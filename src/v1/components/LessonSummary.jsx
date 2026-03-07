import { useState } from 'react'
import { saveFeelingToFirebase } from '../utils/firebaseService'
import './LessonSummary.css'

const DIFFICULTY_OPTIONS = [
  { id: 'difficile', label: 'Difficile', icon: '😓' },
  { id: 'normale', label: 'Normale', icon: '😊' },
  { id: 'facile', label: 'Facile', icon: '😎' }
]

const TEMPO_OPTIONS = [
  { id: 'calma', label: 'Con calma', icon: '🐢' },
  { id: 'fretta', label: 'In fretta', icon: '🐇' }
]

function LessonSummary({ session, lessonTitle, onRepeat, onExit }) {
  const [currentQuestion, setCurrentQuestion] = useState(0) // 0, 1, 2
  const [answers, setAnswers] = useState({
    difficolta: null,
    tempo: null,
    autocorrezione: null
  })
  const [allSubmitted, setAllSubmitted] = useState(false)

  // Calcola statistiche dalla sessione
  const totalTimeMs = session.completedAt - session.startedAt
  const totalTimeSec = Math.round(totalTimeMs / 1000)
  const minutes = Math.floor(totalTimeSec / 60)
  const seconds = totalTimeSec % 60

  const freezeTime = session.phases.freeze.end && session.phases.freeze.start
    ? Math.round((session.phases.freeze.end - session.phases.freeze.start) / 1000)
    : 0

  const intentTime = session.phases.intent.end && session.phases.intent.start
    ? Math.round((session.phases.intent.end - session.phases.intent.start) / 1000)
    : 0

  const moveTime = session.phases.move.end && session.phases.move.start
    ? Math.round((session.phases.move.end - session.phases.move.start) / 1000)
    : 0

  const totalErrors = session.intentErrors.length + session.moveErrors.length
  const isPerfect = totalErrors === 0

  const handleAnswer = (key, value) => {
    const newAnswers = { ...answers, [key]: value }
    setAnswers(newAnswers)

    if (currentQuestion < 2) {
      // Passa alla prossima domanda con un piccolo delay
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1)
      }, 400)
    } else {
      // Tutte le domande risposte
      setAllSubmitted(true)
      // Salva su Firebase (fire-and-forget)
      saveFeelingToFirebase(session.lessonId, newAnswers, session).catch(() => {})
    }
  }

  // Calcola "stelle" di valutazione (1-3)
  const getStars = () => {
    if (isPerfect && totalTimeSec < 30) return 3
    if (totalErrors <= 1) return 2
    return 1
  }
  const stars = getStars()

  return (
    <div className="lesson-summary-overlay">
      <div className="lesson-summary-modal fade-in">
        {/* Header con risultato */}
        <div className={`summary-header ${isPerfect ? 'perfect' : ''}`}>
          <div className="summary-stars">
            {[1, 2, 3].map(i => (
              <span key={i} className={`star ${i <= stars ? 'earned' : 'empty'}`}>
                {i <= stars ? '⭐' : '☆'}
              </span>
            ))}
          </div>
          <h3>{isPerfect ? 'Perfetto!' : 'Lezione completata!'}</h3>
          <p className="summary-lesson-title">{lessonTitle}</p>
        </div>

        {/* Statistiche */}
        <div className="summary-stats">
          <div className="stat-row">
            <div className="stat-item">
              <span className="stat-icon">⏱️</span>
              <span className="stat-label">Tempo totale</span>
              <span className="stat-value">{minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">{isPerfect ? '🎯' : '🔄'}</span>
              <span className="stat-label">Errori</span>
              <span className="stat-value">{totalErrors}</span>
            </div>
          </div>

          {/* Timeline fasi */}
          <div className="phase-timeline">
            <h4>Tempi per fase</h4>
            <div className="phase-bars">
              {freezeTime > 0 && (
                <div className="phase-bar">
                  <span className="phase-label">Osservazione</span>
                  <div className="phase-bar-track">
                    <div className="phase-bar-fill freeze" style={{ width: `${Math.min(100, (freezeTime / Math.max(totalTimeSec, 1)) * 100)}%` }} />
                  </div>
                  <span className="phase-time">{freezeTime}s</span>
                </div>
              )}
              {intentTime > 0 && (
                <div className="phase-bar">
                  <span className="phase-label">Piano strategico</span>
                  <div className="phase-bar-track">
                    <div className="phase-bar-fill intent" style={{ width: `${Math.min(100, (intentTime / Math.max(totalTimeSec, 1)) * 100)}%` }} />
                  </div>
                  <span className="phase-time">{intentTime}s</span>
                </div>
              )}
              {moveTime > 0 && (
                <div className="phase-bar">
                  <span className="phase-label">Esecuzione mossa</span>
                  <div className="phase-bar-track">
                    <div className="phase-bar-fill move" style={{ width: `${Math.min(100, (moveTime / Math.max(totalTimeSec, 1)) * 100)}%` }} />
                  </div>
                  <span className="phase-time">{moveTime}s</span>
                </div>
              )}
            </div>
          </div>

          {/* Riflessioni raccolte */}
          {session.reflections.length > 0 && (
            <div className="summary-reflections">
              <h4>Le tue riflessioni</h4>
              <div className="reflection-tags">
                {session.reflections.map((r, i) => (
                  <span key={i} className="reflection-tag">
                    {r.reason === 'fretta' && '⏩ Fretta'}
                    {r.reason === 'non_guardato' && '👀 Non ho guardato'}
                    {r.reason === 'non_capito' && '🤔 Non capivo'}
                    {r.reason === 'altro' && `💭 ${r.customText || 'Altro'}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Risposte metacognitive raccolte */}
          {session.metacognitive && session.metacognitive.length > 0 && (
            <div className="summary-reflections">
              <h4>Auto-osservazione</h4>
              <div className="reflection-tags">
                {session.metacognitive.map((m, i) => (
                  <span key={i} className="reflection-tag metacognitive-tag">
                    🪞 {m.answer ? 'Si' : 'No'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3 Domande post-lezione */}
        {!allSubmitted ? (
          <div className="summary-feeling">
            {/* Indicatore progresso domande */}
            <div className="post-lesson-progress">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className={`progress-dot ${i < currentQuestion ? 'done' : ''} ${i === currentQuestion ? 'active' : ''}`}
                />
              ))}
            </div>

            {/* Domanda 1: Difficolta */}
            {currentQuestion === 0 && (
              <div className="post-lesson-question fade-in">
                <h4>Com'era questa lezione?</h4>
                <div className="feeling-options">
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      className="feeling-button"
                      onClick={() => handleAnswer('difficolta', opt.id)}
                    >
                      <span className="feeling-icon">{opt.icon}</span>
                      <span className="feeling-label">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Domanda 2: Tempo */}
            {currentQuestion === 1 && (
              <div className="post-lesson-question fade-in">
                <h4>Come hai usato il tempo?</h4>
                <div className="feeling-options">
                  {TEMPO_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      className="feeling-button"
                      onClick={() => handleAnswer('tempo', opt.id)}
                    >
                      <span className="feeling-icon">{opt.icon}</span>
                      <span className="feeling-label">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Domanda 3: Auto-correzione */}
            {currentQuestion === 2 && (
              <div className="post-lesson-question fade-in">
                <h4>C'e un momento in cui hai capito da solo un errore?</h4>
                <div className="feeling-options autocorrezione-options">
                  <button
                    className="feeling-button autocorrezione-btn"
                    onClick={() => handleAnswer('autocorrezione', true)}
                  >
                    <span className="feeling-icon">👍</span>
                    <span className="feeling-label">Si</span>
                  </button>
                  <button
                    className="feeling-button autocorrezione-btn"
                    onClick={() => handleAnswer('autocorrezione', false)}
                  >
                    <span className="feeling-icon">👎</span>
                    <span className="feeling-label">No</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="summary-feeling-done fade-in">
            <p>Grazie per le tue risposte! 👍</p>
          </div>
        )}

        {/* Azioni */}
        <div className="summary-actions">
          <button className="btn-summary btn-summary-exit" onClick={onExit}>
            Torna alle lezioni
          </button>
          <button className="btn-summary btn-summary-repeat" onClick={onRepeat}>
            🔄 Ripeti
          </button>
        </div>
      </div>
    </div>
  )
}

export default LessonSummary
