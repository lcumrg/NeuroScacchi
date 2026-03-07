import { useState } from 'react'
import './ReflectionPrompt.css'

const DEFAULT_REASONS = [
  { id: 'fretta', label: 'Ho avuto fretta', icon: '⏩' },
  { id: 'non_guardato', label: 'Non ho guardato bene', icon: '👀' },
  { id: 'non_capito', label: 'Non ho capito la posizione', icon: '🤔' },
  { id: 'altro', label: 'Altro motivo', icon: '💭' }
]

function ReflectionPrompt({ onReflect, onSkip, errorContext }) {
  const [selected, setSelected] = useState(null)
  const [customText, setCustomText] = useState('')

  const handleSelect = (reasonId) => {
    setSelected(reasonId)
  }

  const handleConfirm = () => {
    const reflection = {
      reason: selected,
      customText: selected === 'altro' ? customText : null,
      errorContext,
      timestamp: Date.now()
    }
    onReflect(reflection)
  }

  return (
    <div className="reflection-prompt fade-in">
      <div className="reflection-header">
        <span className="reflection-icon">🪞</span>
        <h4>Un momento di riflessione</h4>
        <p className="reflection-subtitle">Secondo te, perche hai sbagliato?</p>
      </div>

      <div className="reflection-options">
        {DEFAULT_REASONS.map((reason) => (
          <button
            key={reason.id}
            className={`reflection-option ${selected === reason.id ? 'selected' : ''}`}
            onClick={() => handleSelect(reason.id)}
          >
            <span className="reflection-option-icon">{reason.icon}</span>
            <span className="reflection-option-label">{reason.label}</span>
          </button>
        ))}
      </div>

      {selected === 'altro' && (
        <input
          type="text"
          className="reflection-custom-input"
          placeholder="Scrivi il motivo..."
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          maxLength={100}
          autoFocus
        />
      )}

      <div className="reflection-actions">
        <button
          className="btn-reflection btn-reflection-skip"
          onClick={onSkip}
        >
          Salta
        </button>
        <button
          className={`btn-reflection btn-reflection-confirm ${!selected ? 'disabled' : ''}`}
          onClick={handleConfirm}
          disabled={!selected}
        >
          Conferma e riprova
        </button>
      </div>
    </div>
  )
}

export default ReflectionPrompt
