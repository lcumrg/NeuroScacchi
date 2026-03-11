import { useState, useEffect, useRef, useCallback } from 'react'
import stockfishService from '../engine/stockfishService'
import { parseFen } from '../engine/chessService'
import { makeSan, makeSanAndPlay } from 'chessops/san'
import { parseUci as parseChessopsUci, makeSquare } from 'chessops/util'
import EvalBar from './EvalBar'
import './StockfishPanel.css'

const DEBOUNCE_MS = 500
const DEFAULT_DEPTH = 18
const PV_LINE_COUNT = 3

/**
 * Convert a UCI move string (e.g. "e2e4") to SAN (e.g. "e4") given a FEN.
 * Returns the UCI string as fallback if conversion fails.
 */
function uciToSan(uci, fen) {
  try {
    const pos = parseFen(fen)
    const move = parseChessopsUci(uci)
    if (!move) return uci
    return makeSan(pos, move)
  } catch {
    return uci
  }
}

/**
 * Convert a PV string (space-separated UCI moves) to SAN notation.
 * Shows up to maxMoves moves.
 */
function pvToSan(pvString, fen, maxMoves = 6) {
  if (!pvString) return ''
  const uciMoves = pvString.split(' ').slice(0, maxMoves)
  const sans = []

  try {
    const pos = parseFen(fen)
    for (const uci of uciMoves) {
      const move = parseChessopsUci(uci)
      if (!move) break
      const san = makeSanAndPlay(pos, move)
      sans.push(san)
    }
  } catch {
    // If something fails mid-PV, return what we have
  }

  return sans.join(' ')
}

/**
 * Format eval for display: "+1.5", "-0.3", "M3"
 */
function formatEval(evalCp, mate) {
  if (mate != null) {
    return mate > 0 ? `M${mate}` : `M${mate}`
  }
  const pawns = evalCp / 100
  if (pawns > 0) return `+${pawns.toFixed(1)}`
  if (pawns < 0) return pawns.toFixed(1)
  return '0.0'
}

/**
 * Semantic Italian translation of eval.
 */
function evalToText(evalCp, mate, orientation) {
  // Determine who has the advantage from the raw eval (positive = white)
  const side = (cp) => cp > 0 ? 'Bianco' : 'Nero'

  if (mate != null) {
    const who = mate > 0 ? 'Bianco' : 'Nero'
    return `Matto in ${Math.abs(mate)} per il ${who}`
  }

  const abs = Math.abs(evalCp)
  if (abs < 30) return 'Posizione equilibrata'
  if (abs < 100) return `Leggero vantaggio del ${side(evalCp)}`
  if (abs < 300) return `Vantaggio del ${side(evalCp)}`
  if (abs < 600) return `Vantaggio netto del ${side(evalCp)}`
  return `Vantaggio decisivo del ${side(evalCp)}`
}

/**
 * Classify an eval value for color coding.
 */
function classifyEval(evalCp, mate, rank) {
  if (rank === 1) return 'ottima'
  if (mate != null) return rank <= 2 ? 'buona' : 'imprecisione'
  // For secondary lines, compare distance from line 1
  return 'buona'
}

/**
 * StockfishPanel — displays Stockfish analysis info.
 *
 * Props:
 *   fen         — FEN string of position to analyze
 *   orientation — 'white' | 'black'
 */
export default function StockfishPanel({ fen, orientation = 'white' }) {
  const [analysis, setAnalysis] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  const debounceRef = useRef(null)
  const currentFenRef = useRef(null)

  const runAnalysis = useCallback(async (fenToAnalyze) => {
    if (!fenToAnalyze) return

    currentFenRef.current = fenToAnalyze
    setAnalyzing(true)
    setError(null)

    try {
      const moves = await stockfishService.getBestMoves(fenToAnalyze, {
        count: PV_LINE_COUNT,
        depth: DEFAULT_DEPTH,
      })

      // Only update if this is still the current FEN (avoid stale results)
      if (currentFenRef.current !== fenToAnalyze) return

      // Get eval from the top line
      const topLine = moves[0]
      if (!topLine) {
        setAnalysis(null)
        setAnalyzing(false)
        return
      }

      // Determine mate: check if eval is extreme (stockfish encodes mate as ±100000-N)
      let mate = null
      let evalCp = topLine.eval
      if (Math.abs(evalCp) > 90000) {
        mate = evalCp > 0 ? 100000 - evalCp : -100000 - evalCp
        // Correction: mate is stored as 100000 - mateInN for positive
      }

      // Re-evaluate for accurate mate info using single evaluate
      const evalResult = await stockfishService.evaluate(fenToAnalyze, { depth: DEFAULT_DEPTH })

      if (currentFenRef.current !== fenToAnalyze) return

      setAnalysis({
        evalCp: evalResult.eval,
        mate: evalResult.mate,
        depth: evalResult.depth,
        bestMove: evalResult.bestMove,
        lines: moves,
        fen: fenToAnalyze,
      })
    } catch (err) {
      if (currentFenRef.current === fenToAnalyze) {
        setError(err.message)
      }
    } finally {
      if (currentFenRef.current === fenToAnalyze) {
        setAnalyzing(false)
      }
    }
  }, [])

  // Auto-evaluate when FEN changes (debounced)
  useEffect(() => {
    if (!fen) return

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      runAnalysis(fen)
    }, DEBOUNCE_MS)

    return () => clearTimeout(debounceRef.current)
  }, [fen, runAnalysis])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current)
      stockfishService.stop()
    }
  }, [])

  const handleAnalyze = () => {
    if (fen) runAnalysis(fen)
  }

  const panelClass = `sf-panel${analyzing ? ' sf-panel--analyzing' : ''}`

  return (
    <div className={panelClass}>
      <div className="sf-panel__header">
        <span className="sf-panel__title">
          {analyzing ? 'Analisi in corso…' : 'Analisi Stockfish'}
        </span>
        {analysis && (
          <span className="sf-panel__depth">
            prof. {analysis.depth}
          </span>
        )}
      </div>

      {analysis ? (
        <>
          <EvalBar
            eval={analysis.evalCp}
            mate={analysis.mate}
            orientation={orientation}
          />

          <div className="sf-panel__eval-row" style={{ marginTop: 8 }}>
            <span className="sf-panel__eval-value">
              {formatEval(analysis.evalCp, analysis.mate)}
            </span>
            <span className="sf-panel__eval-text">
              {evalToText(analysis.evalCp, analysis.mate, orientation)}
            </span>
          </div>

          {analysis.bestMove && (
            <div className="sf-panel__best-move">
              Mossa migliore: <strong>{uciToSan(analysis.bestMove, analysis.fen)}</strong>
            </div>
          )}

          {analysis.lines.length > 0 && (
            <ol className="sf-panel__lines">
              {analysis.lines.map((line, i) => {
                const cls = classifyEval(line.eval, null, i + 1)
                return (
                  <li key={i} className="sf-panel__line">
                    <span className="sf-panel__line-rank">{i + 1}</span>
                    <span className={`sf-panel__line-eval sf-panel__line-eval--${cls}`}>
                      {formatEval(line.eval, null)}
                    </span>
                    <span className="sf-panel__line-pv">
                      {pvToSan(line.pv, analysis.fen)}
                    </span>
                  </li>
                )
              })}
            </ol>
          )}
        </>
      ) : (
        <div className="sf-panel__empty">
          {error
            ? `Errore: ${error}`
            : analyzing
              ? 'Inizializzazione motore…'
              : 'Nessuna posizione da analizzare'
          }
        </div>
      )}

      <button
        className="sf-panel__btn"
        onClick={handleAnalyze}
        disabled={analyzing || !fen}
      >
        {analyzing ? '⏳ Analisi…' : '♟ Analizza'}
      </button>
    </div>
  )
}
