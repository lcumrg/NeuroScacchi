import { useState, useEffect } from 'react'
import { loadDraftLesson, saveDraftLesson } from '../engine/lessonStore.js'
import './FeedbackPage.css'

function Stars({ rating, max = 5 }) {
  return (
    <span className="feedback-card__stars">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ color: i < rating ? '#F5C518' : 'var(--text-secondary)' }}>
          {i < rating ? '★' : '☆'}
        </span>
      ))}
    </span>
  )
}

function StepStars({ rating, max = 3 }) {
  if (!rating) return null
  return (
    <span className="feedback-step__stars">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ color: i < rating ? '#F5C518' : 'var(--text-secondary)' }}>
          {i < rating ? '★' : '☆'}
        </span>
      ))}
    </span>
  )
}

function formatDate(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function truncate(text, max) {
  if (!text) return ''
  return text.length > max ? text.slice(0, max) + '…' : text
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(new Set())
  const [replayLoading, setReplayLoading] = useState(null)

  useEffect(() => {
    fetch('/api/feedback-list')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setFeedbacks(data.feedbacks || [])
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function toggleExpand(id) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleReplay(feedback) {
    const { lessonId } = feedback
    let draft = loadDraftLesson(lessonId)
    if (!draft) {
      setReplayLoading(lessonId)
      try {
        const res = await fetch(`/api/lesson-get?id=${encodeURIComponent(lessonId)}`)
        if (res.ok) {
          const { lesson } = await res.json()
          saveDraftLesson(lesson)
          draft = { lesson }
        }
      } catch {}
      setReplayLoading(null)
    }
    if (!draft) {
      alert('Lezione non trovata. Genera di nuovo dalla Console Coach.')
      return
    }
    sessionStorage.setItem('ns3_selected_lesson_id', lessonId)
    window.location.hash = '#/player'
  }

  if (loading) {
    return (
      <div className="feedback-page">
        <div className="feedback-loading">Caricamento feedback...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="feedback-page">
        <div className="feedback-loading" style={{ color: 'var(--color-danger, #e53e3e)' }}>
          Errore: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="feedback-page">
      <div className="feedback-header">
        <div className="feedback-header-inner">
          <h1 className="feedback-title">Feedback lezioni</h1>
          {feedbacks.length > 0 && (
            <span className="feedback-count">{feedbacks.length}</span>
          )}
        </div>
      </div>

      {feedbacks.length === 0 ? (
        <div className="feedback-empty">
          Nessun feedback ancora. Gioca una lezione e valutala al termine.
        </div>
      ) : (
        <div className="feedback-list">
          {feedbacks.map(fb => {
            const isExpanded = expanded.has(fb.id)
            const steps = fb.stepFeedback || []
            const ratedSteps = steps.filter(s => s.rating > 0).length
            const isReplaying = replayLoading === fb.lessonId

            return (
              <div key={fb.id} className="feedback-card">
                <div className="feedback-card__top">
                  <div className="feedback-card__meta">
                    <span className="feedback-card__title">
                      {fb.lessonTitle || 'Lezione senza titolo'}
                    </span>
                    <span className="feedback-card__date">{formatDate(fb.playedAt)}</span>
                  </div>
                  <div className="feedback-card__meta" style={{ marginTop: '0.5rem' }}>
                    <Stars rating={fb.overallRating || 0} max={5} />
                    {ratedSteps > 0 && (
                      <span className="feedback-card__badge">{ratedSteps} step valutati</span>
                    )}
                    {fb.lessonCategory && (
                      <span className="feedback-card__badge">{fb.lessonCategory}</span>
                    )}
                  </div>
                  {fb.note && (
                    <div className="feedback-card__note">{truncate(fb.note, 100)}</div>
                  )}
                </div>

                <div className="feedback-card__actions">
                  {steps.length > 0 && (
                    <button
                      className="feedback-card__btn feedback-card__btn--secondary"
                      onClick={() => toggleExpand(fb.id)}
                    >
                      {isExpanded ? 'Chiudi' : 'Dettagli'}
                    </button>
                  )}
                  <button
                    className="feedback-card__btn feedback-card__btn--primary"
                    onClick={() => handleReplay(fb)}
                    disabled={isReplaying}
                  >
                    {isReplaying ? 'Caricamento...' : 'Rigioca →'}
                  </button>
                </div>

                {isExpanded && steps.length > 0 && (
                  <div className="feedback-detail">
                    {steps.map((step, idx) => (
                      <div key={idx} className="feedback-step">
                        {step.type && (
                          <span className="feedback-step__type">{step.type}</span>
                        )}
                        <span className="feedback-step__summary">
                          {truncate(step.summary || step.title || '', 80)}
                        </span>
                        <StepStars rating={step.rating} max={3} />
                        {step.note && (
                          <span className="feedback-step__note">{step.note}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
