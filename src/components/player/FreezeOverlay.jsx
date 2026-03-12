import './player-activities.css'

export default function FreezeOverlay({ secondsLeft }) {
  return (
    <div className="freeze-overlay">
      <div className="freeze-overlay__content">
        <div className="freeze-overlay__countdown">{secondsLeft}</div>
        <p className="freeze-overlay__label">Osserva la posizione...</p>
      </div>
    </div>
  )
}
