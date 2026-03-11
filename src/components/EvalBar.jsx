import './EvalBar.css'

/**
 * Converts centipawn eval / mate to a percentage width for white's side.
 * 0cp = 50%, +300cp ≈ 70%, mate = 100% (or 0%).
 */
function evalToPercent(evalCp, mate) {
  if (mate != null) {
    return mate > 0 ? 100 : 0
  }

  // Sigmoid-like mapping: 2/(1+e^(-cp/300)) - 1, scaled to 0-100
  const sigmoid = 2 / (1 + Math.exp(-evalCp / 300)) - 1
  // sigmoid is in [-1, 1], map to [0, 100]
  return 50 + sigmoid * 50
}

/**
 * Formats eval for display: "+1.5", "-0.3", "M3", "M-3"
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
 * EvalBar — horizontal bar showing Stockfish evaluation.
 *
 * Props:
 *   eval        — number in centipawns (positive = white advantage)
 *   mate        — number or null (positive = white mates in N, negative = black mates)
 *   orientation — 'white' | 'black'
 */
export default function EvalBar({ eval: evalCp = 0, mate = null, orientation = 'white' }) {
  let percent = evalToPercent(evalCp, mate)

  // If board is flipped, reverse the bar direction
  if (orientation === 'black') {
    percent = 100 - percent
  }

  const label = formatEval(evalCp, mate)

  // Choose label color based on whether it sits on the white or black side
  const labelClass = percent >= 50 ? 'eval-bar__label--dark' : 'eval-bar__label--light'

  return (
    <div className="eval-bar" role="meter" aria-valuenow={evalCp} aria-label="Valutazione posizione">
      <div className="eval-bar__fill" style={{ width: `${percent}%` }} />
      <span className={`eval-bar__label ${labelClass}`}>{label}</span>
    </div>
  )
}
