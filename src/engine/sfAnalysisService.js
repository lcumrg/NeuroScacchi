/**
 * sfAnalysisService.js
 *
 * Analyzes chess positions using a dedicated Stockfish worker instance.
 * Creates its own worker — does not share with StockfishPanel.
 */

import { StockfishService } from './stockfishService.js'

// Quality classification thresholds (centipawn loss)
const QUALITY_THRESHOLDS = [
  { max: 10,  label: 'best' },
  { max: 50,  label: 'good' },
  { max: 100, label: 'inaccuracy' },
  { max: 300, label: 'mistake' },
  { max: Infinity, label: 'blunder' },
]

/**
 * Classifies a move based on centipawn loss relative to the best move.
 *
 * @param {number} moveEval  - eval of the position after the player's move (from white's POV)
 * @param {number} bestEval  - eval of the position after the best move (from white's POV)
 * @returns {{ cpLoss: number, quality: string, bestEval: number, moveEval: number }}
 */
export function classifyMove(moveEval, bestEval) {
  // cpLoss is always >= 0; the eval is from white's POV so we compare directly
  const cpLoss = Math.max(0, bestEval - moveEval)
  const quality = QUALITY_THRESHOLDS.find(t => cpLoss < t.max)?.label ?? 'unknown'
  return { cpLoss, quality, bestEval, moveEval }
}

/**
 * Analyzes a single FEN position with Stockfish.
 *
 * @param {string} fen
 * @param {{ depth?: number, multiPv?: number }} options
 * @returns {Promise<{ fen: string, bestMove: string, eval: number, depth: number, lines: Array }>}
 */
export async function analyzePosition(fen, { depth = 15, multiPv = 3 } = {}) {
  const sf = new StockfishService()

  try {
    await sf.init()

    const moves = await sf.getBestMoves(fen, { count: multiPv, depth })
    const evalResult = await sf.evaluate(fen, { depth })

    const lines = moves.map((m, i) => ({
      rank: i + 1,
      move: m.move,
      eval: m.eval,
      pv: m.pv,
    }))

    return {
      fen,
      bestMove: evalResult.bestMove,
      eval: evalResult.eval,
      mate: evalResult.mate,
      depth: evalResult.depth,
      lines,
    }
  } finally {
    sf.destroy()
  }
}

/**
 * Analyzes all steps in a lesson that have a FEN.
 *
 * @param {object} lesson  - lesson object with `steps` array
 * @param {{ depth?: number, onProgress?: function }} options
 * @returns {Promise<Array<{
 *   stepIndex: number,
 *   fen: string,
 *   bestMove: string,
 *   eval: number,
 *   depth: number,
 *   lines: Array,
 *   correctMoveEval: number|null,
 *   cpLoss: number|null,
 *   quality: string
 * }>>}
 */
export async function analyzeLesson(lesson, { depth = 15, onProgress } = {}) {
  const steps = lesson?.steps ?? []
  const results = []

  // Use a single SF instance across all steps for efficiency
  const sf = new StockfishService()

  try {
    await sf.init()

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      if (!step.fen) continue

      // Report progress
      onProgress?.({ stepIndex: i, total: steps.length, status: 'analyzing' })

      // Get best moves at this position
      const moves = await sf.getBestMoves(step.fen, { count: 3, depth })
      const evalResult = await sf.evaluate(step.fen, { depth })

      const lines = moves.map((m, idx) => ({
        rank: idx + 1,
        move: m.move,
        eval: m.eval,
        pv: m.pv,
      }))

      const bestEval = evalResult.eval

      // Try to evaluate the "correct move" for this step
      let correctMoveEval = null
      let cpLoss = null
      let quality = 'unknown'

      const correctMove = (step.correctMoves?.[0]) || step.bestMove || null

      if (correctMove) {
        try {
          // Evaluate position after correct move (flip eval perspective)
          const afterMoveResult = await sf._sendAnalysis([
            `position fen ${step.fen} moves ${correctMove}`,
            `go depth ${depth}`,
          ])
          const afterInfo = afterMoveResult.results.get(1)
          if (afterInfo) {
            // Negate: after opponent's perspective, negate to get white's POV
            correctMoveEval = -afterInfo.eval
            const classification = classifyMove(correctMoveEval, bestEval)
            cpLoss = classification.cpLoss
            quality = classification.quality
          }
        } catch {
          // If we can't evaluate the specific move, skip quality
        }
      }

      results.push({
        stepIndex: i,
        fen: step.fen,
        bestMove: evalResult.bestMove,
        eval: bestEval,
        mate: evalResult.mate,
        depth: evalResult.depth,
        lines,
        correctMoveEval,
        cpLoss,
        quality,
      })

      onProgress?.({ stepIndex: i, total: steps.length, status: 'done' })
    }
  } finally {
    sf.destroy()
  }

  return results
}
