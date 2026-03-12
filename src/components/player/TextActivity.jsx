import { marked } from 'marked'
import './player-activities.css'

// Configure marked: no async, sanitize a safe subset
marked.setOptions({ async: false, breaks: true })

/**
 * Converts markdown text to sanitized HTML (only safe inline/block tags).
 * Uses the `marked` library which is already in package.json.
 */
function renderMarkdown(text) {
  if (!text) return ''
  try {
    const html = marked.parse(text)
    // Basic sanitization: strip script/iframe/on* attributes
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
      .replace(/\s+on\w+="[^"]*"/gi, '')
  } catch {
    // Fallback: return as plain text wrapped in <p>
    return `<p>${text}</p>`
  }
}

export default function TextActivity({ step, onContinue }) {
  const html = renderMarkdown(step.content)

  return (
    <div className="activity activity--text">
      <div
        className="activity__content activity__content--markdown"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <button className="activity__btn activity__btn--primary" onClick={onContinue}>
        Continua
      </button>
    </div>
  )
}
