import { useState } from 'react'
import './player-activities.css'

export default function IntentActivity({ step, onCorrect, onIncorrect, onPreviewShapes }) {
  const [selected, setSelected] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)

  function handleConfirm() {
    if (selected === null) return
    setConfirmed(true)
    // Rimuovi il preview hover quando si conferma
    onPreviewShapes?.(null)
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

  function handleOptionHover(opt) {
    if (confirmed || !onPreviewShapes) return
    const aids = opt.previewVisualAids
    if (!aids) {
      onPreviewShapes(null)
      return
    }
    const shapes = []
    if (aids.arrows) {
      for (const a of aids.arrows) shapes.push({ orig: a.from, dest: a.to, brush: 'blue' })
    }
    if (aids.circles) {
      for (const c of aids.circles) shapes.push({ orig: c.square, brush: 'blue' })
    }
    onPreviewShapes(shapes.length > 0 ? shapes : null)
  }

  function handleOptionLeave() {
    if (confirmed || !onPreviewShapes) return
    onPreviewShapes(null)
  }

  const correctIndex = step.options.findIndex(o => o.correct === true)

  return (
    <div className="activity activity--intent">
      <p className="activity__question">{step.question}</p>
      <div className="activity__options">
        {step.options.map((opt, i) => {
          const hasPreview = !confirmed && !!opt.previewVisualAids
          return (
            <label
              key={i}
              className={[
                'activity__option',
                selected === i ? 'activity__option--selected' : '',
                confirmed && showAnswer && i === correctIndex ? 'activity__option--correct' : '',
                confirmed && showAnswer && selected === i && !opt.correct ? 'activity__option--wrong' : '',
                hasPreview ? 'activity__option--has-preview' : '',
              ].join(' ')}
              onMouseEnter={() => handleOptionHover(opt)}
              onMouseLeave={handleOptionLeave}
            >
              <input
                type="radio"
                name="intent-option"
                value={i}
                checked={selected === i}
                onChange={() => !confirmed && setSelected(i)}
                disabled={confirmed}
              />
              <span className="activity__option-text">{opt.text}</span>
              {hasPreview && (
                <span className="activity__option-preview-hint" title="Passa il mouse per vedere sulla scacchiera">
                  ◈
                </span>
              )}
            </label>
          )
        })}
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
