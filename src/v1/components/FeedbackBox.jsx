import './FeedbackBox.css'

function FeedbackBox({ type, message, confrontation, onReset, showReset }) {
  if (!message) return null

  const getIcon = () => {
    switch (type) {
      case 'positive':
        return '✅'
      case 'negative':
        return '⚠️'
      default:
        return '💭'
    }
  }

  return (
    <div className={`feedback-box ${type} fade-in`}>
      <div className="feedback-content">
        <span className="feedback-icon">{getIcon()}</span>
        <p className="feedback-message">{message}</p>
      </div>

      {/* Confronto metacognitivo (fiducia vs realtà) */}
      {confrontation && (
        <div className={`confrontation-box confrontation-${confrontation.type}`}>
          <span className="confrontation-icon">{confrontation.icon}</span>
          <p className="confrontation-message">{confrontation.message}</p>
        </div>
      )}

      {showReset && (
        <div className="feedback-actions">
          <button className="btn-reset" onClick={onReset}>
            🔄 Ripeti Esercizio
          </button>
        </div>
      )}
    </div>
  )
}

export default FeedbackBox
