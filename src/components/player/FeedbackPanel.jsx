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

export default function FeedbackPanel({ correct, feedbackText, onContinue }) {
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
      {btnVisible && (
        <button className="feedback-panel__btn" onClick={onContinue}>
          Continua
        </button>
      )}
    </div>
  )
}
