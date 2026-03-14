import { useState, useEffect } from 'react'
import { marked } from 'marked'
import './player-activities.css'

marked.setOptions({ async: false, breaks: true })

function renderMarkdown(text) {
  if (!text) return ''
  try {
    const html = marked.parse(text)
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
      .replace(/\s+on\w+="[^"]*"/gi, '')
  } catch {
    return `<p>${text}</p>`
  }
}

const CONTINUE_DELAY_MS = 600

export default function FeedbackPanel({ correct, feedbackText, onContinue, onRate, currentRating }) {
  const [btnVisible, setBtnVisible] = useState(false)

  // Delay "Continua" to prevent accidental taps
  useEffect(() => {
    setBtnVisible(false)
    const t = setTimeout(() => setBtnVisible(true), CONTINUE_DELAY_MS)
    return () => clearTimeout(t)
  }, [correct, feedbackText])

  const html = renderMarkdown(feedbackText)

  return (
    <div className={`feedback-panel feedback-panel--${correct ? 'correct' : 'incorrect'}`}>
      <div className="feedback-panel__icon">{correct ? '✓' : '✗'}</div>
      <div
        className="feedback-panel__text feedback-panel__text--markdown"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {onRate && (
        <div className="feedback-panel__rating">
          <span className="feedback-panel__rating-label">Valuta:</span>
          {[1, 2, 3].map(n => (
            <button
              key={n}
              className={`feedback-panel__star${currentRating >= n ? ' feedback-panel__star--active' : ''}`}
              onClick={() => onRate(currentRating === n ? 0 : n)}
              title={n === 1 ? 'Difficile' : n === 2 ? 'Ok' : 'Facile'}
              aria-label={`${n} stelle`}
            >
              ★
            </button>
          ))}
        </div>
      )}

      {btnVisible && (
        <button className="feedback-panel__btn" onClick={onContinue}>
          Continua
        </button>
      )}
    </div>
  )
}
