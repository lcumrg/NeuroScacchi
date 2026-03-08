#!/usr/bin/env node
/**
 * Validazione automatica posizioni con Stockfish (Strato 4.6)
 *
 * Per ogni posizione in positions.json:
 * 1. Analizza con Stockfish a depth crescenti (8, 12, 16, 20)
 * 2. Confronta bestMove del motore con solutionMoves salvate
 * 3. Segnala soluzioni sub-ottimali o sbagliate
 * 4. Propone la mossa migliore del motore come alternativa
 * 5. Ricalcola la difficolta basata sulla depth a cui Stockfish trova la soluzione
 *
 * Uso:
 *   node scripts/validate-positions-stockfish.cjs              # report
 *   node scripts/validate-positions-stockfish.cjs --fix        # corregge soluzioni sbagliate
 *   node scripts/validate-positions-stockfish.cjs --fix-all    # corregge anche difficolta
 *   node scripts/validate-positions-stockfish.cjs --json       # output JSON
 *   node scripts/validate-positions-stockfish.cjs --depth 20   # depth massima (default 20)
 */

const { spawn } = require('child_process')
const { Chess } = require('chess.js')
const path = require('path')
const fs = require('fs')

// ── Config ──

const POSITIONS_PATH = path.join(__dirname, '..', 'src', 'v2', 'data', 'positions.json')
const SF_PATH = path.join(__dirname, '..', 'node_modules', 'stockfish', 'bin', 'stockfish.js')
const ANALYSIS_DEPTHS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20]

// Soglie per classificare la qualita della soluzione
const THRESHOLDS = {
  OPTIMAL: 0.3,      // deltaEval < 0.3 → soluzione ottima
  ACCEPTABLE: 1.0,   // deltaEval 0.3–1.0 → accettabile
  SUBOPTIMAL: 2.5,   // deltaEval 1.0–2.5 → sub-ottimale
  // > 2.5 → sbagliata
}

// Mappa depth → difficolta calcolata
// La depth a cui Stockfish trova la mossa migliore indica quanto e' difficile vederla
function depthToDifficulty(depthFound) {
  if (depthFound <= 1) return 1
  if (depthFound <= 4) return 2
  if (depthFound <= 6) return 3
  if (depthFound <= 8) return 4
  if (depthFound <= 10) return 5
  if (depthFound <= 12) return 6
  if (depthFound <= 14) return 7
  if (depthFound <= 16) return 8
  if (depthFound <= 18) return 9
  return 10
}

// ── Stockfish Engine ──

class StockfishEngine {
  constructor() {
    this.process = null
    this.buffer = ''
    this.resolveCallback = null
  }

  start() {
    return new Promise((resolve, reject) => {
      this.process = spawn('node', [SF_PATH], {
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      this.process.stdout.on('data', (data) => {
        this.buffer += data.toString()
        this._processBuffer()
      })

      this.process.stderr.on('data', (data) => {
        // Ignora messaggi stderr (NNUE loading etc.)
      })

      this.process.on('error', reject)

      // Init UCI
      this._sendAndWait('uci', 'uciok')
        .then(() => this._sendAndWait('setoption name Threads value 1\nsetoption name Hash value 32\nisready', 'readyok'))
        .then(resolve)
        .catch(reject)
    })
  }

  async evaluate(fen, depth) {
    this._send(`position fen ${fen}`)
    this._send(`go depth ${depth}`)

    const result = { bestMove: null, eval: 0, mate: null, depth: 0, pv: '' }

    await new Promise((resolve) => {
      const lines = []
      this.resolveCallback = (line) => {
        lines.push(line)
        if (line.startsWith('bestmove')) {
          // Parse tutte le info lines per prendere la depth massima
          for (const l of lines) {
            if (l.startsWith('info') && l.includes(' depth ') && !l.includes(' currmove ')) {
              const parsed = this._parseInfo(l)
              if (parsed.depth >= result.depth) {
                result.depth = parsed.depth
                result.eval = parsed.eval
                result.mate = parsed.mate
                result.pv = parsed.pv
              }
            }
          }
          result.bestMove = line.split(' ')[1]
          this.resolveCallback = null
          resolve()
        }
      }
    })

    return result
  }

  /**
   * Analizza una mossa specifica: valuta prima e dopo.
   * Restituisce deltaEval (quanto peggiora la posizione rispetto alla bestMove).
   */
  async analyzeMove(fen, move, depth) {
    // Eval posizione corrente
    const before = await this.evaluate(fen, depth)

    // Eval dopo la mossa
    this._send(`position fen ${fen} moves ${move}`)
    this._send(`go depth ${depth}`)

    const after = { eval: 0, mate: null, depth: 0 }

    await new Promise((resolve) => {
      const lines = []
      this.resolveCallback = (line) => {
        lines.push(line)
        if (line.startsWith('bestmove')) {
          for (const l of lines) {
            if (l.startsWith('info') && l.includes(' depth ') && !l.includes(' currmove ')) {
              const parsed = this._parseInfo(l)
              if (parsed.depth >= after.depth) {
                after.depth = parsed.depth
                after.eval = parsed.eval
                after.mate = parsed.mate
              }
            }
          }
          this.resolveCallback = null
          resolve()
        }
      }
    })

    // Dopo la mossa il turno cambia → eval invertito
    const evalAfter = -after.eval

    // deltaEval: positivo = la mossa ha peggiorato la posizione
    const deltaEval = before.eval - evalAfter

    return {
      evalBefore: before.eval,
      evalAfter,
      deltaEval,
      bestMove: before.bestMove,
      mateBefore: before.mate,
      mateAfter: after.mate,
    }
  }

  /**
   * Trova a quale depth minima Stockfish trova la soluzione.
   * Analizza a depth crescenti e segna la prima depth dove bestMove == solutionMove.
   */
  async findSolutionDepth(fen, solutionMoves, depths) {
    for (const depth of depths) {
      const result = await this.evaluate(fen, depth)
      if (solutionMoves.includes(result.bestMove)) {
        return { depth, bestMove: result.bestMove, eval: result.eval, mate: result.mate }
      }
    }
    return null
  }

  /**
   * Calcola complessita di una posizione analizzandola a depth crescenti.
   * Misura la "stabilita" della valutazione: posizioni complesse cambiano eval
   * piu volte tra depth basse e alte.
   * Restituisce un valore 1-10.
   */
  async calculateComplexity(fen, depths) {
    let evalChanges = 0
    let prevEval = null
    let prevBestMove = null

    for (const depth of depths) {
      const result = await this.evaluate(fen, depth)
      if (prevEval !== null) {
        // Conta cambi significativi di eval o di bestMove
        if (Math.abs(result.eval - prevEval) > 0.5 || result.bestMove !== prevBestMove) {
          evalChanges++
        }
      }
      prevEval = result.eval
      prevBestMove = result.bestMove
    }

    // Mappa il numero di cambi a complessita 1-10
    if (evalChanges <= 0) return 1
    if (evalChanges <= 1) return 2
    if (evalChanges <= 2) return 3
    if (evalChanges <= 3) return 4
    if (evalChanges <= 4) return 5
    if (evalChanges <= 5) return 6
    if (evalChanges <= 6) return 7
    if (evalChanges <= 8) return 8
    if (evalChanges <= 10) return 9
    return 10
  }

  quit() {
    if (this.process) {
      this._send('quit')
      this.process = null
    }
  }

  // ── Internals ──

  _send(cmd) {
    if (this.process && this.process.stdin.writable) {
      this.process.stdin.write(cmd + '\n')
    }
  }

  _sendAndWait(cmd, token) {
    return new Promise((resolve) => {
      this.resolveCallback = (line) => {
        if (line.startsWith(token)) {
          this.resolveCallback = null
          resolve(line)
        }
      }
      this._send(cmd)
    })
  }

  _processBuffer() {
    const lines = this.buffer.split('\n')
    this.buffer = lines.pop() // ultimo pezzo incompleto torna nel buffer
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && this.resolveCallback) {
        this.resolveCallback(trimmed)
      }
    }
  }

  _parseInfo(line) {
    const result = { depth: 0, eval: 0, mate: null, pv: '' }

    const depthMatch = line.match(/\bdepth (\d+)/)
    if (depthMatch) result.depth = parseInt(depthMatch[1])

    const cpMatch = line.match(/\bscore cp (-?\d+)/)
    if (cpMatch) result.eval = parseInt(cpMatch[1]) / 100

    const mateMatch = line.match(/\bscore mate (-?\d+)/)
    if (mateMatch) {
      result.mate = parseInt(mateMatch[1])
      result.eval = result.mate > 0 ? 100 : -100
    }

    const pvMatch = line.match(/\bpv (.+)$/)
    if (pvMatch) result.pv = pvMatch[1].trim()

    return result
  }
}

// ── Validazione ──

async function validatePositions(options) {
  const positions = JSON.parse(fs.readFileSync(POSITIONS_PATH, 'utf-8'))
  const maxDepth = options.depth || 20
  const depths = ANALYSIS_DEPTHS.filter(d => d <= maxDepth)

  console.log(`\n🔍 Validazione Stockfish — ${positions.length} posizioni, depth max ${maxDepth}\n`)

  const engine = new StockfishEngine()
  await engine.start()
  console.log('✅ Stockfish avviato\n')

  const results = []

  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i]
    const prefix = `[${i + 1}/${positions.length}] ${pos.id}`
    process.stdout.write(`${prefix}... `)

    const analysis = {
      id: pos.id,
      fen: pos.fen,
      theme: pos.theme,
      currentDifficulty: pos.difficulty,
      solutionMoves: pos.solutionMoves,
      status: 'ok',       // ok | suboptimal | wrong
      issues: [],
      suggestions: {},
    }

    try {
      // 1. Analizza la posizione alla depth massima
      const fullEval = await engine.evaluate(pos.fen, maxDepth)
      analysis.engineBestMove = fullEval.bestMove
      analysis.engineEval = fullEval.eval
      analysis.engineMate = fullEval.mate

      // 2. Verifica se la soluzione corrente e' la mossa migliore
      const isBestMove = pos.solutionMoves.includes(fullEval.bestMove)

      if (isBestMove) {
        // Soluzione coincide con la bestMove — tutto ok
        analysis.status = 'ok'
      } else {
        // Soluzione diversa dalla bestMove — analizziamo quanto e' lontana
        const moveAnalysis = await engine.analyzeMove(pos.fen, pos.solutionMoves[0], maxDepth)

        analysis.moveAnalysis = moveAnalysis

        // Gestione casi con matto: entrambe le mosse danno matto → equivalenti
        const solGivesMate = moveAnalysis.mateAfter !== null && moveAnalysis.mateAfter < 0 // matto per chi ha mosso
        const bestGivesMate = fullEval.mate !== null && fullEval.mate > 0

        if (solGivesMate && bestGivesMate) {
          // Entrambe danno matto — la soluzione va bene
          analysis.status = 'ok'
          analysis.deltaEval = 0
        } else if (bestGivesMate && !solGivesMate) {
          // La bestMove da matto ma la soluzione no — errore
          analysis.status = 'wrong'
          analysis.deltaEval = 99
          analysis.issues.push(
            `Perde il matto in ${fullEval.mate}. ` +
            `Soluzione: ${pos.solutionMoves[0]}, Migliore: ${fullEval.bestMove}`
          )
          analysis.suggestions.bestMove = fullEval.bestMove
        } else {
          // Nessun matto — confronto eval numerico
          analysis.deltaEval = Math.abs(moveAnalysis.deltaEval)

          if (analysis.deltaEval < THRESHOLDS.ACCEPTABLE) {
            analysis.status = 'ok' // accettabile
          } else if (analysis.deltaEval < THRESHOLDS.SUBOPTIMAL) {
            analysis.status = 'suboptimal'
            analysis.issues.push(
              `Sub-ottimale (deltaEval: ${analysis.deltaEval.toFixed(2)}). ` +
              `Soluzione: ${pos.solutionMoves[0]} (eval: ${moveAnalysis.evalAfter.toFixed(2)}), ` +
              `Migliore: ${fullEval.bestMove} (eval: ${fullEval.eval.toFixed(2)})`
            )
            analysis.suggestions.bestMove = fullEval.bestMove
          } else {
            analysis.status = 'wrong'
            analysis.issues.push(
              `Soluzione sbagliata (deltaEval: ${analysis.deltaEval.toFixed(2)}). ` +
              `Soluzione: ${pos.solutionMoves[0]} (eval: ${moveAnalysis.evalAfter.toFixed(2)}), ` +
              `Migliore: ${fullEval.bestMove} (eval: ${fullEval.eval.toFixed(2)})`
            )
            analysis.suggestions.bestMove = fullEval.bestMove
          }
        }
      }

      // 3. Calcola difficolta
      const depthResult = await engine.findSolutionDepth(pos.fen, pos.solutionMoves, depths)
      if (depthResult) {
        // Stockfish trova la soluzione come bestMove: usa la depth
        analysis.solutionFoundAtDepth = depthResult.depth
        analysis.calculatedDifficulty = depthToDifficulty(depthResult.depth)
      } else {
        // Soluzione non e' la bestMove di Stockfish
        analysis.solutionFoundAtDepth = null

        if (analysis.status === 'ok' && (analysis.deltaEval === 0 || analysis.deltaEval < THRESHOLDS.ACCEPTABLE)) {
          // Mossa equivalente: la difficolta e' quella della posizione in se,
          // non della mossa specifica. Manteniamo la difficolta manuale del coach
          // (che conosce il contesto pedagogico)
          analysis.calculatedDifficulty = pos.difficulty
          if (fullEval.bestMove !== pos.solutionMoves[0]) {
            analysis.issues.push(
              `Nota: Stockfish preferisce ${fullEval.bestMove} ma ${pos.solutionMoves[0]} e' equivalente ` +
              `(delta: ${(analysis.deltaEval || 0).toFixed(2)}). Difficolta manuale mantenuta.`
            )
          }
        } else {
          // Mossa sub-ottimale o sbagliata: non ha senso calcolare una difficolta
          analysis.calculatedDifficulty = pos.difficulty
        }
      }

      // 4. Confronta difficolta calcolata vs manuale
      if (analysis.calculatedDifficulty !== pos.difficulty) {
        analysis.suggestions.difficulty = analysis.calculatedDifficulty
        analysis.issues.push(
          `Difficolta: manuale=${pos.difficulty}, calcolata=${analysis.calculatedDifficulty} ` +
          `(trovata a depth ${analysis.solutionFoundAtDepth})`
        )
      }

      // Stampa risultato inline
      const icon = analysis.status === 'ok' ? '✅' : analysis.status === 'suboptimal' ? '⚠️' : '❌'
      const diffInfo = analysis.suggestions.difficulty
        ? ` [diff: ${pos.difficulty}→${analysis.calculatedDifficulty}]`
        : ''
      console.log(`${icon}${diffInfo}`)

      if (analysis.issues.length > 0) {
        analysis.issues.forEach(issue => console.log(`   └─ ${issue}`))
      }
    } catch (err) {
      analysis.status = 'error'
      analysis.issues.push(`Errore analisi: ${err.message}`)
      console.log(`💥 ${err.message}`)
    }

    results.push(analysis)
  }

  engine.quit()

  return results
}

// ── Report ──

function printReport(results) {
  const ok = results.filter(r => r.status === 'ok')
  const suboptimal = results.filter(r => r.status === 'suboptimal')
  const wrong = results.filter(r => r.status === 'wrong')
  const errors = results.filter(r => r.status === 'error')
  const diffChanges = results.filter(r => r.suggestions.difficulty !== undefined)

  console.log('\n' + '═'.repeat(60))
  console.log('📊 RIEPILOGO VALIDAZIONE STOCKFISH')
  console.log('═'.repeat(60))
  console.log(`  ✅ Corrette:       ${ok.length}`)
  console.log(`  ⚠️  Sub-ottimali:   ${suboptimal.length}`)
  console.log(`  ❌ Sbagliate:      ${wrong.length}`)
  console.log(`  💥 Errori:         ${errors.length}`)
  console.log(`  📐 Diff. da aggiornare: ${diffChanges.length}`)
  console.log('═'.repeat(60))

  // Carica posizioni per controllare origin
  const positions = JSON.parse(fs.readFileSync(POSITIONS_PATH, 'utf-8'))
  const getOrigin = (id) => {
    const p = positions.find(pos => pos.id === id)
    return p ? p.origin : 'unknown'
  }

  if (suboptimal.length > 0) {
    console.log('\n⚠️  POSIZIONI SUB-OTTIMALI:')
    suboptimal.forEach(r => {
      const tag = getOrigin(r.id) === 'manual' ? ' [curata dal coach]' : ''
      console.log(`  ${r.id}${tag}: ${r.issues.join('; ')}`)
    })
  }

  if (wrong.length > 0) {
    console.log('\n❌ POSIZIONI CON SOLUZIONE NON OTTIMALE:')
    wrong.forEach(r => {
      const tag = getOrigin(r.id) === 'manual' ? ' [curata dal coach — potrebbe essere intenzionale]' : ''
      console.log(`  ${r.id}${tag}: ${r.issues.join('; ')}`)
    })
    if (wrong.some(r => getOrigin(r.id) === 'manual')) {
      console.log('\n  💡 Le posizioni curate dal coach possono avere soluzioni didattiche')
      console.log('     intenzionalmente diverse dalla mossa migliore di Stockfish.')
      console.log('     Usa --fix per aggiungere la bestMove come alternativa.')
    }
  }

  if (diffChanges.length > 0) {
    console.log('\n📐 DIFFICOLTA DA AGGIORNARE:')
    diffChanges.forEach(r => {
      console.log(`  ${r.id}: ${r.currentDifficulty} → ${r.suggestions.difficulty}`)
    })
  }

  console.log('')
}

// ── Fix automatico ──

function applyFixes(results, { fixDifficulty = false } = {}) {
  const positions = JSON.parse(fs.readFileSync(POSITIONS_PATH, 'utf-8'))
  let fixCount = 0

  for (const result of results) {
    const pos = positions.find(p => p.id === result.id)
    if (!pos) continue

    // Fix difficolta calcolata (solo con --fix-all)
    if (fixDifficulty && result.suggestions.difficulty !== undefined && result.suggestions.difficulty !== pos.difficulty) {
      pos.difficulty = result.suggestions.difficulty
      fixCount++
    }

    // Fix soluzioni sbagliate: aggiungi la bestMove come alternativa (non sovrascrivere)
    if (result.status === 'wrong' && result.suggestions.bestMove) {
      if (!pos.solutionMoves.includes(result.suggestions.bestMove)) {
        // Inserisci la bestMove come prima soluzione, mantieni le altre
        pos.solutionMoves.unshift(result.suggestions.bestMove)
        pos._stockfishNote = `Mossa migliore aggiunta da Stockfish: ${result.suggestions.bestMove}`
        fixCount++
      }
    }
  }

  if (fixCount > 0) {
    fs.writeFileSync(POSITIONS_PATH, JSON.stringify(positions, null, 2) + '\n')
    console.log(`\n✅ Applicate ${fixCount} correzioni a ${POSITIONS_PATH}`)
  } else {
    console.log('\nNessuna correzione necessaria.')
  }

  return fixCount
}

// ── Main ──

async function main() {
  const args = process.argv.slice(2)
  const doFixAll = args.includes('--fix-all')
  const doFix = args.includes('--fix') || doFixAll
  const doJson = args.includes('--json')
  const depthIdx = args.indexOf('--depth')
  const maxDepth = depthIdx !== -1 ? parseInt(args[depthIdx + 1]) : 20

  if (!fs.existsSync(POSITIONS_PATH)) {
    console.error('❌ File posizioni non trovato:', POSITIONS_PATH)
    process.exit(1)
  }

  if (!fs.existsSync(SF_PATH)) {
    console.error('❌ Stockfish non trovato. Esegui: npm install')
    process.exit(1)
  }

  const results = await validatePositions({ depth: maxDepth })

  if (doJson) {
    console.log(JSON.stringify(results, null, 2))
  } else {
    printReport(results)
  }

  if (doFix) {
    applyFixes(results, { fixDifficulty: doFixAll })
  }

  // Exit code: 0 se tutto ok, 1 se ci sono soluzioni sbagliate
  const hasWrong = results.some(r => r.status === 'wrong')
  process.exit(hasWrong ? 1 : 0)
}

main().catch(err => {
  console.error('💥 Errore fatale:', err)
  process.exit(1)
})
