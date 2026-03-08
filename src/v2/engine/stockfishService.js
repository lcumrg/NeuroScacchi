/**
 * Stockfish WASM Service — wrapper per comunicare con Stockfish via Web Worker.
 *
 * Usa la variante lite single-threaded (~7MB, no CORS headers necessari).
 * Comunicazione via UCI protocol (postMessage).
 *
 * API:
 *   initStockfish()                        → inizializza il worker
 *   evaluate(fen, depth?)                  → { bestMove, eval, pv, depth, mate }
 *   analyzeMove(fen, move, depth?)         → { evalBefore, evalAfter, deltaEval, classification }
 *   getThreats(fen, depth?)                → [{ move, eval, san }] (top 3 mosse avversario)
 *   isReady()                              → boolean
 *   destroy()                              → termina il worker
 */

let worker = null
let ready = false
let messageResolvers = []

// ── Lifecycle ──

export function initStockfish() {
  return new Promise((resolve, reject) => {
    if (worker) {
      resolve()
      return
    }

    try {
      worker = new Worker('/stockfish/stockfish-18-lite-single.js')
    } catch (err) {
      reject(new Error('Impossibile caricare Stockfish: ' + err.message))
      return
    }

    worker.onmessage = (e) => {
      const line = typeof e.data === 'string' ? e.data : ''
      // Route to pending resolvers
      for (const r of messageResolvers) {
        r.onLine(line)
      }
    }

    worker.onerror = (err) => {
      console.error('Stockfish worker error:', err)
    }

    // Init UCI
    send('uci')
    waitFor('uciok', 5000)
      .then(() => {
        // Configurazione leggera per browser
        send('setoption name Threads value 1')
        send('setoption name Hash value 16')
        send('isready')
        return waitFor('readyok', 5000)
      })
      .then(() => {
        ready = true
        resolve()
      })
      .catch(reject)
  })
}

export function isReady() {
  return ready
}

export function destroy() {
  if (worker) {
    worker.terminate()
    worker = null
    ready = false
    messageResolvers = []
  }
}

// ── API ──

const DEFAULT_DEPTH = 16

/**
 * Valuta una posizione.
 * @returns {{ bestMove: string, eval: number, pv: string, depth: number, mate: number|null }}
 */
export async function evaluate(fen, depth = DEFAULT_DEPTH) {
  ensureReady()
  send('position fen ' + fen)
  send('go depth ' + depth)

  const result = { bestMove: null, eval: 0, pv: '', depth: 0, mate: null }

  await waitForLines((line) => {
    if (line.startsWith('info') && line.includes(' depth ')) {
      const parsed = parseInfoLine(line)
      if (parsed.depth >= result.depth) {
        result.depth = parsed.depth
        result.eval = parsed.eval
        result.mate = parsed.mate
        result.pv = parsed.pv
      }
    }
    if (line.startsWith('bestmove')) {
      result.bestMove = line.split(' ')[1]
      return true // done
    }
    return false
  }, 15000)

  return result
}

/**
 * Analizza una mossa giocata: confronta eval prima e dopo.
 * @returns {{ evalBefore: number, evalAfter: number, deltaEval: number, classification: string, bestMove: string }}
 */
export async function analyzeMove(fen, move, depth = DEFAULT_DEPTH) {
  ensureReady()

  // Eval prima della mossa
  const before = await evaluate(fen, depth)

  // Applica la mossa e valuta dopo
  // Servono chess.js per applicare la mossa e ottenere il FEN risultante
  // ma per evitare dipendenze circolari, chiediamo a Stockfish di valutare
  // la posizione dopo la mossa
  send('position fen ' + fen + ' moves ' + move)
  send('go depth ' + depth)

  const after = { eval: 0, mate: null, depth: 0 }

  await waitForLines((line) => {
    if (line.startsWith('info') && line.includes(' depth ')) {
      const parsed = parseInfoLine(line)
      if (parsed.depth >= after.depth) {
        after.depth = parsed.depth
        after.eval = parsed.eval
        after.mate = parsed.mate
      }
    }
    if (line.startsWith('bestmove')) {
      return true
    }
    return false
  }, 15000)

  // Dopo la mossa il turno cambia, quindi l'eval è dal punto di vista opposto
  const evalAfter = -after.eval

  // deltaEval: quanto si è perso rispetto alla posizione precedente
  // Positivo = la mossa ha peggiorato la posizione
  const deltaEval = before.eval - evalAfter

  const classification = classifyMove(deltaEval, before.mate, after.mate)

  return {
    evalBefore: before.eval,
    evalAfter,
    deltaEval,
    classification,
    bestMove: before.bestMove,
  }
}

/**
 * Trova le top 3 minacce dell'avversario.
 * Inverte il turno (position fen con turno opposto) e analizza con MultiPV.
 * @returns {Array<{ move: string, eval: number, san: string }>}
 */
export async function getThreats(fen, depth = Math.min(DEFAULT_DEPTH, 12)) {
  ensureReady()

  // Invertiamo il turno nel FEN per vedere le mosse dell'avversario
  const parts = fen.split(' ')
  parts[1] = parts[1] === 'w' ? 'b' : 'w'
  const opponentFen = parts.join(' ')

  // Attiva MultiPV per ottenere le top 3
  send('setoption name MultiPV value 3')
  send('position fen ' + opponentFen)
  send('go depth ' + depth)

  const threats = []
  const seen = new Map() // pvIndex → threat

  await waitForLines((line) => {
    if (line.startsWith('info') && line.includes(' multipv ')) {
      const parsed = parseInfoLine(line)
      if (parsed.pvIndex && parsed.firstMove) {
        seen.set(parsed.pvIndex, {
          move: parsed.firstMove,
          eval: parsed.eval,
          mate: parsed.mate,
        })
      }
    }
    if (line.startsWith('bestmove')) {
      return true
    }
    return false
  }, 10000)

  // Ripristina MultiPV a 1
  send('setoption name MultiPV value 1')

  // Ordina per indice multipv (1, 2, 3)
  for (let i = 1; i <= 3; i++) {
    if (seen.has(i)) {
      threats.push(seen.get(i))
    }
  }

  return threats
}

// ── Classificazione mossa ──

function classifyMove(deltaEval, mateBefore, mateAfter) {
  // Gestione matti
  if (mateBefore !== null && mateAfter !== null) {
    // Aveva matto e lo mantiene: ottima
    return 'ottima'
  }
  if (mateBefore !== null && mateAfter === null) {
    // Aveva matto e lo ha perso: errore
    return 'errore'
  }

  if (deltaEval < 0.3) return 'ottima'
  if (deltaEval < 1.0) return 'buona'
  if (deltaEval < 2.5) return 'imprecisione'
  return 'errore'
}

// ── UCI parsing ──

function parseInfoLine(line) {
  const result = { depth: 0, eval: 0, mate: null, pv: '', pvIndex: null, firstMove: null }

  const depthMatch = line.match(/\bdepth (\d+)/)
  if (depthMatch) result.depth = parseInt(depthMatch[1])

  const pvIndexMatch = line.match(/\bmultipv (\d+)/)
  if (pvIndexMatch) result.pvIndex = parseInt(pvIndexMatch[1])

  const cpMatch = line.match(/\bscore cp (-?\d+)/)
  if (cpMatch) result.eval = parseInt(cpMatch[1]) / 100

  const mateMatch = line.match(/\bscore mate (-?\d+)/)
  if (mateMatch) result.mate = parseInt(mateMatch[1])

  const pvMatch = line.match(/\bpv (.+)$/)
  if (pvMatch) {
    result.pv = pvMatch[1].trim()
    result.firstMove = result.pv.split(' ')[0]
  }

  // Se c'è matto, convertiamo in eval molto alto/basso per coerenza
  if (result.mate !== null) {
    result.eval = result.mate > 0 ? 100 : -100
  }

  return result
}

// ── Internals ──

function send(cmd) {
  if (!worker) throw new Error('Stockfish non inizializzato')
  worker.postMessage(cmd)
}

function ensureReady() {
  if (!ready) throw new Error('Stockfish non pronto. Chiama initStockfish() prima.')
}

function waitFor(token, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error(`Timeout aspettando "${token}" da Stockfish`))
    }, timeout)

    const resolver = {
      onLine: (line) => {
        if (line.startsWith(token)) {
          cleanup()
          resolve(line)
        }
      },
    }

    function cleanup() {
      clearTimeout(timer)
      messageResolvers = messageResolvers.filter(r => r !== resolver)
    }

    messageResolvers.push(resolver)
  })
}

function waitForLines(handler, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('Timeout analisi Stockfish'))
    }, timeout)

    const resolver = {
      onLine: (line) => {
        if (handler(line)) {
          cleanup()
          resolve()
        }
      },
    }

    function cleanup() {
      clearTimeout(timer)
      messageResolvers = messageResolvers.filter(r => r !== resolver)
    }

    messageResolvers.push(resolver)
  })
}
