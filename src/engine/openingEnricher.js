/**
 * openingEnricher.js
 *
 * Passo 2 della pipeline aperture:
 * cammina le mosse dell'apertura con chessops, interroga l'Opening Explorer
 * per ogni posizione, analizza le posizioni chiave con Stockfish.
 *
 * Output: OpeningMaterialsPackage — tutto deterministico, zero IA.
 */

import { makeMoveFromUci, getSan, turnColor } from './chessService.js'
import { StockfishService } from './stockfishService.js'
import { getExplorerData, formatExplorerForPrompt } from './openingExplorer.js'

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

/**
 * Delay tra chiamate Explorer per rispettare il rate limit.
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Cammina una sequenza di mosse UCI a partire dal FEN iniziale.
 * Restituisce un array di posizioni, una per ogni mossa.
 *
 * @param {string[]} moves - Mosse UCI da eseguire
 * @param {string} [startFen] - FEN di partenza (default: posizione iniziale)
 * @returns {{ positions: Array, error?: string }}
 */
export function walkOpeningMoves(moves, startFen = STARTING_FEN) {
  const positions = []
  let currentFen = startFen

  // Posizione 0: prima di qualsiasi mossa
  positions.push({
    fen: currentFen,
    moveIndex: 0,
    moveUci: null,
    moveSan: null,
    sideToMove: turnColor(currentFen),
  })

  for (let i = 0; i < moves.length; i++) {
    const result = makeMoveFromUci(currentFen, moves[i])
    if (!result.valid) {
      // Tronca alla prima mossa illegale — meglio una lezione parziale che nessuna lezione
      console.warn(`[openingEnricher] Mossa illegale "${moves[i]}" alla posizione ${i} — sequenza troncata a ${i} mosse`)
      return {
        positions,
        truncated: true,
        truncatedAt: i,
        truncatedMove: moves[i],
      }
    }
    currentFen = result.fen
    positions.push({
      fen: result.fen,
      moveIndex: i + 1,
      moveUci: moves[i],
      moveSan: result.san,
      sideToMove: turnColor(result.fen),
    })
  }

  return { positions, truncated: false }
}

/**
 * Costruisce il pacchetto materiali completo per una lezione di apertura.
 *
 * @param {Object} params
 * @param {string[]} params.moves - Mosse UCI dell'apertura (linea principale)
 * @param {string} params.livello - Livello studente
 * @param {string} params.colore - 'white' | 'black'
 * @param {string} [params.startFen] - FEN di partenza
 * @param {function} [params.onProgress]
 * @returns {Promise<OpeningMaterialsPackage>}
 */
export async function buildOpeningMaterialsPackage(params, { onProgress } = {}) {
  const { moves, livello, colore, startFen = STARTING_FEN } = params

  // ── Step 1: Calcola posizioni con chessops ──
  onProgress?.({ phase: 'compute', message: 'Calcolo posizioni apertura...' })

  const { positions, truncated, truncatedAt, truncatedMove } = walkOpeningMoves(moves, startFen)

  if (positions.length < 2) {
    throw new Error(`Impossibile calcolare le posizioni: la sequenza di mosse è vuota o invalida fin dall'inizio.`)
  }

  if (truncated) {
    onProgress?.({ phase: 'compute', message: `Mossa illegale "${truncatedMove}" alla posizione ${truncatedAt} — lezione costruita sulle prime ${positions.length - 1} mosse valide.` })
  }

  // ── Step 2: Opening Explorer per ogni posizione ──
  onProgress?.({ phase: 'explorer', message: `Analisi Opening Explorer (${positions.length} posizioni)...` })

  const explorerData = []
  let firstExplorerError = null
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i]
    try {
      const data = await getExplorerData(pos.fen, { livello })
      explorerData.push({
        positionIndex: i,
        fen: pos.fen,
        sideToMove: pos.sideToMove,
        ...data,
        formatted: formatExplorerForPrompt(data, pos.sideToMove),
      })
    } catch (explorerErr) {
      const errMsg = explorerErr?.message || String(explorerErr)
      console.error(`[openingEnricher] Explorer fallito per posizione ${i}:`, errMsg)
      if (!firstExplorerError) firstExplorerError = errMsg
      explorerData.push({
        positionIndex: i,
        fen: pos.fen,
        sideToMove: pos.sideToMove,
        moves: [],
        opening: null,
        totalGames: 0,
        formatted: '(dati Explorer non disponibili)',
      })
    }

    // Rispetta rate limit: 200ms tra chiamate
    if (i < positions.length - 1) await delay(200)
  }

  if (firstExplorerError) {
    onProgress?.({ phase: 'explorer-error-done', message: `Explorer error: ${firstExplorerError}` })
  }

  // Estrai nome apertura dal primo dato Explorer che lo ha
  const openingName = explorerData.find(d => d.opening?.name)?.opening?.name || null

  // ── Step 3: Analisi Stockfish sulle posizioni chiave ──
  // Analizza ogni posizione dove è il turno del colore che studia
  const studyColor = colore === 'white' ? 'white' : 'black'
  const keyPositions = positions.filter(p => p.sideToMove === studyColor && p.moveIndex > 0)
  const sfAnalysis = {}

  if (keyPositions.length > 0) {
    onProgress?.({ phase: 'stockfish', message: `Analisi Stockfish (${keyPositions.length} posizioni chiave)...` })

    const sf = new StockfishService()
    try {
      await sf.init()

      for (const pos of keyPositions) {
        try {
          const evalResult = await sf.evaluate(pos.fen, { depth: 15 })
          const topMoves = await sf.getBestMoves(pos.fen, { count: 3, depth: 15 })

          sfAnalysis[pos.moveIndex] = {
            fen: pos.fen,
            bestMove: evalResult.bestMove,
            bestMoveSan: getSan(pos.fen, evalResult.bestMove),
            eval: evalResult.eval,
            mate: evalResult.mate,
            topMoves: topMoves.map(m => ({
              uci: m.move,
              san: getSan(pos.fen, m.move),
              eval: m.eval,
            })),
          }
        } catch {
          // SF fallisce su questa posizione — continua
        }
      }
    } finally {
      sf.destroy()
    }
  }

  const summary = [
    `Apertura: ${openingName || 'non identificata'}`,
    `${positions.length} posizioni calcolate`,
    `${explorerData.filter(d => d.totalGames > 0).length} posizioni con dati Explorer`,
    `${Object.keys(sfAnalysis).length} analisi Stockfish`,
  ].join(', ')

  onProgress?.({ phase: 'done', message: summary })

  return {
    moves,
    colore,
    livello,
    openingName,
    positions,
    explorerData,
    sfAnalysis,
    summary,
  }
}
