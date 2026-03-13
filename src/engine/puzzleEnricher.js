/**
 * puzzleEnricher.js
 *
 * Passo 2 della pipeline: prende i puzzle Lichess grezzi e produce un
 * MaterialsPackage con posizioni calcolate (chessops) e analisi (Stockfish).
 *
 * Zero IA — tutto deterministico + motore.
 */

import { makeMoveFromUci, getSan, turnColor, isCheck } from './chessService.js'
import { StockfishService } from './stockfishService.js'
import puzzleDatabase from './puzzleDatabase.js'

/**
 * Calcola tutte le posizioni intermedie di un puzzle camminando le mosse con chessops.
 *
 * @param {string} startingFen - FEN iniziale del puzzle (prima di qualsiasi mossa)
 * @param {string[]} moves - Mosse UCI in sequenza (moves[0] = setup avversario, moves[1] = soluzione, ...)
 * @returns {{ positions: Array<{ fen, moveIndex, moveUci, moveSan, sideToMove, isCheck, isCheckmate }>, error?: string }}
 */
export function computePuzzlePositions(startingFen, moves) {
  const positions = []
  let currentFen = startingFen

  // Position 0: prima di qualsiasi mossa
  positions.push({
    fen: currentFen,
    moveIndex: 0,
    moveUci: null,
    moveSan: null,
    sideToMove: turnColor(currentFen),
    isCheck: false,
    isCheckmate: false,
  })

  for (let i = 0; i < moves.length; i++) {
    const result = makeMoveFromUci(currentFen, moves[i])
    if (!result.valid) {
      return {
        positions,
        error: `Mossa illegale: ${moves[i]} nella posizione dopo ${i} mosse (FEN: ${currentFen})`,
      }
    }
    currentFen = result.fen
    positions.push({
      fen: result.fen,
      moveIndex: i + 1,
      moveUci: moves[i],
      moveSan: result.san,
      sideToMove: turnColor(result.fen),
      isCheck: result.isCheck,
      isCheckmate: result.isCheckmate,
    })
  }

  return { positions }
}

/**
 * Analizza le posizioni chiave di un puzzle con Stockfish.
 *
 * @param {{ fen: string, moveIndex: number }[]} positions - Posizioni calcolate da computePuzzlePositions
 * @param {StockfishService} sf - Istanza SF già inizializzata
 * @param {{ depth?: number }} options
 * @returns {Promise<Array<{ fen, bestMove, bestMoveSan, eval, mate, topMoves[], threats[] }>>}
 */
async function analyzePuzzlePositions(positions, sf, { depth = 15 } = {}) {
  const analysis = []

  // Analizza positions[1] (puzzle position, dopo setup avversario) — la più importante
  if (positions.length > 1) {
    const pos = positions[1]
    const topMoves = await sf.getBestMoves(pos.fen, { count: 4, depth })
    const evalResult = await sf.evaluate(pos.fen, { depth })

    const bestMoveSan = getSan(pos.fen, evalResult.bestMove)

    analysis.push({
      fen: pos.fen,
      positionIndex: 1,
      bestMove: evalResult.bestMove,
      bestMoveSan,
      eval: evalResult.eval,
      mate: evalResult.mate,
      topMoves: topMoves.map(m => ({
        move: m.move,
        moveSan: getSan(pos.fen, m.move),
        eval: m.eval,
        pv: m.pv,
      })),
      threats: [],
    })
  }

  // Analizza positions[2] (dopo la soluzione) — per verificare che sia effettivamente la migliore
  if (positions.length > 2) {
    const pos = positions[2]
    const evalResult = await sf.evaluate(pos.fen, { depth })
    analysis.push({
      fen: pos.fen,
      positionIndex: 2,
      bestMove: evalResult.bestMove,
      bestMoveSan: getSan(pos.fen, evalResult.bestMove),
      eval: evalResult.eval,
      mate: evalResult.mate,
      topMoves: [],
      threats: [],
    })
  }

  // Threats dalla posizione iniziale (positions[0])
  if (positions.length > 0) {
    try {
      const threats = await sf.getThreats(positions[0].fen, { count: 3, depth: 12 })
      analysis.push({
        fen: positions[0].fen,
        positionIndex: 0,
        bestMove: null,
        bestMoveSan: null,
        eval: null,
        mate: null,
        topMoves: [],
        threats: threats.map(t => ({
          move: t.move,
          moveSan: getSan(positions[0].fen, t.move),
          eval: t.eval,
        })),
      })
    } catch {
      // Threats non critiche — skip
    }
  }

  return analysis
}

/**
 * Fetch puzzle da Firestore e costruisce il MaterialsPackage completo.
 *
 * @param {Object} puzzleQuery - Criteri dal piano IA
 * @param {string[]} puzzleQuery.themes - Tag Lichess da cercare
 * @param {number} puzzleQuery.ratingMin
 * @param {number} puzzleQuery.ratingMax
 * @param {number} puzzleQuery.count - Quanti puzzle servono
 * @param {Object} options
 * @param {function} [options.onProgress] - Callback progresso
 * @returns {Promise<{ puzzles: Array, summary: string }>}
 */
export async function buildMaterialsPackage(puzzleQuery, { onProgress } = {}) {
  const { themes = [], ratingMin = 800, ratingMax = 2000, count = 5 } = puzzleQuery

  onProgress?.({ phase: 'fetch', message: 'Recupero puzzle da Lichess database...' })

  // Overfetch per compensare filtri
  const fetchCount = Math.max(count * 2, 10)
  let rawPuzzles = []

  // Prova con il primo tema
  if (themes.length > 0) {
    try {
      rawPuzzles = await puzzleDatabase.getRandomPuzzles({
        theme: themes[0],
        ratingMin,
        ratingMax,
        count: fetchCount,
      })
    } catch {
      rawPuzzles = []
    }
  }

  // Fallback: allarga range di +/- 200
  if (rawPuzzles.length < count && themes.length > 0) {
    try {
      const wider = await puzzleDatabase.getRandomPuzzles({
        theme: themes[0],
        ratingMin: Math.max(400, ratingMin - 200),
        ratingMax: Math.min(3000, ratingMax + 200),
        count: fetchCount,
      })
      // Aggiungi solo quelli non già presenti
      const existingIds = new Set(rawPuzzles.map(p => p.id))
      for (const p of wider) {
        if (!existingIds.has(p.id)) rawPuzzles.push(p)
      }
    } catch {
      // Continua con quello che abbiamo
    }
  }

  if (rawPuzzles.length === 0) {
    return { puzzles: [], summary: 'Nessun puzzle trovato per i criteri specificati' }
  }

  onProgress?.({ phase: 'compute', message: `Calcolo posizioni per ${rawPuzzles.length} puzzle...` })

  // Computa posizioni con chessops per ogni puzzle
  const enriched = []
  for (const puzzle of rawPuzzles) {
    const moves = typeof puzzle.moves === 'string'
      ? puzzle.moves.split(' ')
      : puzzle.moves

    if (!moves || moves.length < 2) continue

    const { positions, error } = computePuzzlePositions(puzzle.fen, moves)
    if (error) continue // Puzzle con mosse illegali — skip

    enriched.push({
      id: puzzle.id || puzzle.puzzleId,
      startingFen: puzzle.fen,
      moves,
      rating: puzzle.rating,
      themes: Array.isArray(puzzle.themes) ? puzzle.themes : (puzzle.themes || '').split(' '),
      positions,
    })

    if (enriched.length >= count) break
  }

  // Seleziona i puzzle migliori (max 3 per analisi SF)
  const selected = enriched.slice(0, Math.min(3, enriched.length))

  // Analisi Stockfish
  onProgress?.({ phase: 'stockfish', message: `Analisi Stockfish per ${selected.length} puzzle...` })

  const sf = new StockfishService()
  try {
    await sf.init()

    for (let i = 0; i < selected.length; i++) {
      onProgress?.({
        phase: 'stockfish',
        message: `Analisi SF: puzzle ${i + 1}/${selected.length}...`,
      })
      selected[i].analysis = await analyzePuzzlePositions(selected[i].positions, sf)
    }
  } finally {
    sf.destroy()
  }

  // I puzzle non analizzati con SF ricevono analysis vuota
  for (const p of enriched) {
    if (!p.analysis) p.analysis = []
  }

  const summary = `${enriched.length} puzzle ${themes.join('+')} rating ${ratingMin}-${ratingMax}, ` +
    `${enriched.reduce((n, p) => n + p.positions.length, 0)} posizioni calcolate, ` +
    `${selected.reduce((n, p) => n + p.analysis.length, 0)} analisi SF`

  onProgress?.({ phase: 'done', message: summary })

  return { puzzles: enriched, summary }
}

/**
 * Verifica che ogni FEN nel JSON lezione esista nel pacchetto materiali.
 *
 * @param {Object} lesson - Lezione JSON v3.0.0
 * @param {Object} materials - MaterialsPackage
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateLessonAgainstMaterials(lesson, materials) {
  const errors = []

  // Raccoglie tutte le FEN disponibili nei materiali
  const knownFens = new Set()
  for (const puzzle of materials.puzzles) {
    for (const pos of puzzle.positions) {
      knownFens.add(pos.fen)
    }
  }

  // Verifica ogni step
  for (let i = 0; i < (lesson.steps || []).length; i++) {
    const step = lesson.steps[i]
    if (step.fen && !knownFens.has(step.fen)) {
      // Tolleranza: per step text senza FEN, non è un errore
      if (step.type !== 'text') {
        errors.push(`Step ${i + 1} (${step.type}): FEN non presente nei materiali: ${step.fen.substring(0, 40)}...`)
      }
    }
  }

  // Verifica initialFen
  if (lesson.initialFen && !knownFens.has(lesson.initialFen)) {
    errors.push(`initialFen non presente nei materiali: ${lesson.initialFen.substring(0, 40)}...`)
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Calcola le transizioni tra step deterministicamente.
 * Cerca il percorso di mosse tra la FEN di uno step e quella del successivo
 * attraverso le posizioni dei puzzle.
 *
 * @param {Object} lesson - Lezione JSON v3.0.0
 * @param {Object} materials - MaterialsPackage
 * @returns {Object} lesson modificata con transizioni calcolate
 */
export function computeTransitions(lesson, materials) {
  if (!lesson?.steps || lesson.steps.length < 2) return lesson

  // Costruisce una mappa FEN→{puzzle, positionIndex} per ricerca rapida
  const fenMap = new Map()
  for (const puzzle of materials.puzzles) {
    for (let i = 0; i < puzzle.positions.length; i++) {
      const pos = puzzle.positions[i]
      if (!fenMap.has(pos.fen)) {
        fenMap.set(pos.fen, [])
      }
      fenMap.get(pos.fen).push({ puzzle, positionIndex: i })
    }
  }

  for (let i = 0; i < lesson.steps.length - 1; i++) {
    const currentStep = lesson.steps[i]
    const nextStep = lesson.steps[i + 1]

    const currentFen = currentStep.fen
    const nextFen = nextStep.fen

    if (!currentFen || !nextFen) continue
    if (currentFen === nextFen) {
      // Stessa posizione — nessuna transizione necessaria
      continue
    }

    // Cerca un percorso di mosse tra currentFen e nextFen nello stesso puzzle
    const path = findMovePath(currentFen, nextFen, fenMap)
    if (path) {
      currentStep.transition = {
        moves: path.moves,
        resultingFen: nextFen,
      }
    } else {
      // Se non troviamo un percorso, proviamo a calcolarlo step by step
      // Cerca se la currentFen ha una mossa diretta che porta a nextFen
      const directResult = findDirectMove(currentFen, nextFen, materials)
      if (directResult) {
        currentStep.transition = {
          moves: directResult,
          resultingFen: nextFen,
        }
      }
      // Altrimenti lascia la transizione che l'IA ha messo (se presente)
    }
  }

  // Rimuovi transizione dall'ultimo step
  const last = lesson.steps[lesson.steps.length - 1]
  if (last.transition) delete last.transition

  return lesson
}

/**
 * Cerca un percorso di mosse tra due FEN attraverso le posizioni dei puzzle.
 */
function findMovePath(fromFen, toFen, fenMap) {
  const sources = fenMap.get(fromFen)
  if (!sources) return null

  for (const { puzzle, positionIndex } of sources) {
    // Cerca toFen nelle posizioni successive dello stesso puzzle
    for (let j = positionIndex + 1; j < puzzle.positions.length; j++) {
      if (puzzle.positions[j].fen === toFen) {
        // Raccoglie le mosse UCI tra i due indici
        const moves = []
        for (let k = positionIndex + 1; k <= j; k++) {
          if (puzzle.positions[k].moveUci) {
            moves.push(puzzle.positions[k].moveUci)
          }
        }
        if (moves.length > 0) {
          return { moves }
        }
      }
    }
  }

  return null
}

/**
 * Cerca una mossa diretta (o coppia di mosse) che trasforma fromFen in toFen.
 */
function findDirectMove(fromFen, toFen, materials) {
  for (const puzzle of materials.puzzles) {
    for (let i = 0; i < puzzle.positions.length - 1; i++) {
      if (puzzle.positions[i].fen === fromFen) {
        // Prova 1 mossa
        if (puzzle.positions[i + 1]?.fen === toFen) {
          return [puzzle.positions[i + 1].moveUci]
        }
        // Prova 2 mosse
        if (puzzle.positions[i + 2]?.fen === toFen) {
          return [
            puzzle.positions[i + 1].moveUci,
            puzzle.positions[i + 2].moveUci,
          ].filter(Boolean)
        }
      }
    }
  }
  return null
}
