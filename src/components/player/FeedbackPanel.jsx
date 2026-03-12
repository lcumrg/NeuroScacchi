import './player-activities.css'

export default function FeedbackPanel({ correct, feedbackText, onContinue }) {
  return (
    <div className={`feedback-panel feedback-panel--${correct ? 'correct' : 'incorrect'}`}>
      <div className="feedback-panel__icon">{correct ? '✓' : '✗'}</div>
      <p className="feedback-panel__text">{feedbackText}</p>
      <button className="feedback-panel__btn" onClick={onContinue}>
        Continua
      </button>
    </div>
  )
}
