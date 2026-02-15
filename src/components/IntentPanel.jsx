import { useState } from 'react'
import './IntentPanel.css'

function IntentPanel({ question, options, onSelect, disabled, cooldownActive }) {
  const [selectedOption, setSelectedOption] = useState(null)

  // Supporta sia stringhe che oggetti
  const normalizeOptions = () => {
    return options.map(opt => {
      if (typeof opt === 'string') {
        return { testo: opt, categoria: detectCategory(opt) }
      }
      return opt
    })
  }

  const normalizedOptions = normalizeOptions()

  const handleClick = (option) => {
    if (disabled && !cooldownActive) return
    
    const optionText = typeof option === 'string' ? option : option.testo
    setSelectedOption(optionText)
    onSelect(optionText)
    
    // Reset visual selection dopo un momento
    setTimeout(() => setSelectedOption(null), 1000)
  }

  // Rileva categoria dal testo (fallback per lezioni vecchie)
  const detectCategory = (text) => {
    if (text.toLowerCase().includes('attac')) return 'attacco'
    if (text.toLowerCase().includes('svilup') || text.toLowerCase().includes('miglior')) return 'sviluppo'
    if (text.toLowerCase().includes('difes') || text.toLowerCase().includes('arroc')) return 'difesa'
    return 'sviluppo'
  }

  // Icone per ogni categoria
  const getIcon = (categoria) => {
    if (categoria === 'attacco') return '⚔️'
    if (categoria === 'sviluppo') return '♟️'
    if (categoria === 'difesa') return '🛡️'
    return '♟️'
  }

  // Colore per ogni categoria
  const getColor = (categoria) => {
    if (categoria === 'attacco') return 'attack'
    if (categoria === 'sviluppo') return 'develop'
    if (categoria === 'difesa') return 'defend'
    return 'develop'
  }

  return (
    <div className="intent-panel">
      <div className="intent-question">
        <h3>Domanda Strategica</h3>
        <p>{question}</p>
      </div>

      <div className="intent-options">
        {normalizedOptions.map((option, index) => (
          <button
            key={index}
            className={`intent-button ${getColor(option.categoria)} ${
              cooldownActive ? 'cooldown' : ''
            } ${selectedOption === option.testo ? 'selected' : ''} ${
              disabled && !cooldownActive ? 'disabled' : ''
            }`}
            onClick={() => handleClick(option)}
            disabled={cooldownActive}
          >
            {cooldownActive && (
              <div className="cooldown-bar" style={{ animationDelay: `${index * 0.1}s` }} />
            )}
            <span className="intent-icon">{getIcon(option.categoria)}</span>
            <span className="intent-text">{option.testo}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default IntentPanel
