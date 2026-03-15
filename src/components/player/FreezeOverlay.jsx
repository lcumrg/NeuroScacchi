import './player-activities.css'

const FREEZE_CONFIG = {
  intent:    { color: 'rgba(21, 101, 192, 0.88)',  text: 'Cosa sta pensando?' },
  detective: { color: 'rgba(230, 74, 25, 0.88)',   text: 'Trova il punto chiave…' },
  candidate: { color: 'rgba(46, 125, 50, 0.88)',   text: 'Quali mosse hai?' },
  move:      { color: 'rgba(106, 27, 154, 0.88)',  text: 'Ora esegui…' },
  demo:      { color: 'rgba(245, 127, 23, 0.88)',  text: 'Guarda bene…' },
}
const DEFAULT_CONFIG = { color: 'rgba(26, 58, 92, 0.88)', text: 'Osserva la posizione…' }

export default function FreezeOverlay({ secondsLeft, stepType }) {
  const { color, text } = FREEZE_CONFIG[stepType] ?? DEFAULT_CONFIG
  return (
    <div
      className="freeze-overlay"
      style={{ background: `radial-gradient(ellipse at center, rgba(0,0,0,0.05) 25%, ${color} 100%)` }}
    >
      <div className="freeze-overlay__content">
        <div className="freeze-overlay__countdown">{secondsLeft}</div>
        <p className="freeze-overlay__label">{text}</p>
      </div>
    </div>
  )
}
