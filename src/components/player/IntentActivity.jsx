import { useState } from 'react'
import './player-activities.css'

export default function IntentActivity({ step, onCorrect, onIncorrect }) {
  const [selected, setSelected] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)

  function handleConfirm() {
    if (selected === null) return
    setConfirmed(true)
    const isCorrect = step.options[selected]?.correct === true
    if (isCorrect) {
      onCorrect()
    } else {
      setShowAnswer(true)
      onIncorrect()
      setTimeout(() => {
        onCorrect()
      }, 1500)
    }
  }

  const correctIndex = step.options.findIndex(o => o.correct === true)

  return (
    <div className="activity activity--intent">
      <p className="activity__question">{step.question}</p>
      <div className="activity__options">
        {step.options.map((opt, i) => (
          <label
            key={i}
            className={[
              'activity__option',
              selected === i ? 'activity__option--selected' : '',
              confirmed && showAnswer && i === correctIndex ? 'activity__option--correct' : '',
              confirmed && showAnswer && selected === i && !opt.correct ? 'activity__option--wrong' : '',
            ].join(' ')}
          >
            <input
              type="radio"
              name="intent-option"
              value={i}
              checked={selected === i}
              onChange={() => !confirmed && setSelected(i)}
              disabled={confirmed}
            />
            <span>{opt.text}</span>
          </label>
        ))}
      </div>
      {showAnswer && (
        <p className="activity__hint">
          La risposta corretta era: <strong>{step.options[correctIndex]?.text}</strong>
        </p>
      )}
      {!confirmed && (
        <button
          className="activity__btn activity__btn--primary"
          onClick={handleConfirm}
          disabled={selected === null}
        >
          Conferma
        </button>
      )}
    </div>
  )
}
