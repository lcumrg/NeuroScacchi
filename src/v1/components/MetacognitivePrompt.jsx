import { useState } from 'react'
import './MetacognitivePrompt.css'

function MetacognitivePrompt({ question, onAnswer, onSkip }) {
  const [answered, setAnswered] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState(null)

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer)
    setAnswered(true)
    setTimeout(() => {
      onAnswer(answer)
    }, 600)
  }

  return (
    <div className="metacognitive-prompt fade-in">
      <div className="metacognitive-header">
        <span className="metacognitive-icon">🪞</span>
        <h4>Fermati un momento</h4>
      </div>

      <p className="metacognitive-question">{question}</p>

      {!answered ? (
        <div className="metacognitive-buttons">
          <button
            className="btn-metacognitive btn-si"
            onClick={() => handleAnswer(true)}
          >
            Si
          </button>
          <button
            className="btn-metacognitive btn-no"
            onClick={() => handleAnswer(false)}
          >
            No
          </button>
        </div>
      ) : (
        <div className="metacognitive-thanks fade-in">
          <span>{selectedAnswer ? '👍' : '👌'}</span>
          <p>Grazie, continuiamo!</p>
        </div>
      )}

      {!answered && onSkip && (
        <button className="btn-metacognitive-skip" onClick={onSkip}>
          Salta
        </button>
      )}
    </div>
  )
}

export default MetacognitivePrompt
