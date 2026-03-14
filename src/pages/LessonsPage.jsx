import { useState, useEffect } from 'react'
import { listLessons, deleteLesson } from '../engine/lessonStore.js'
import './LessonsPage.css'

const DIFFICULTY_LABELS = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzato',
}

function formatDateIT(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function LessonsPage() {
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setLoading(true)
    const data = await listLessons()
    setLessons(data)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  function handlePlay(id) {
    sessionStorage.setItem('ns3_selected_lesson_id', id)
    window.location.hash = '#/player'
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Eliminare la lezione "${title}"? L'azione non è reversibile.`)) return
    await deleteLesson(id)
    refresh()
  }

  return (
    <div className="lessons-page fade-in">
      <header className="lessons-header">
        <div className="lessons-header-inner">
          <h1 className="lessons-title">Le mie lezioni</h1>
          {!loading && lessons.length > 0 && (
            <span className="lessons-count">{lessons.length} lezione{lessons.length !== 1 ? 'i' : ''}</span>
          )}
        </div>
      </header>

      <div className="lessons-content">
        {loading ? (
          <div className="lessons-empty">
            <p className="lessons-empty-text">Caricamento...</p>
          </div>
        ) : lessons.length === 0 ? (
          <div className="lessons-empty">
            <div className="lessons-empty-icon" aria-hidden="true">♟</div>
            <p className="lessons-empty-text">Nessuna lezione salvata.</p>
            <p className="lessons-empty-sub">
              Per creare la tua prima lezione, vai alla{' '}
              <a href="#/console" className="lessons-link">Console Coach</a>,
              imposta tema e livello e premi <strong>Genera lezione</strong>.
              Poi approva o salva come bozza: comparirà qui.
            </p>
          </div>
        ) : (
          <div className="lessons-grid">
            {lessons.map((lesson) => {
              const stepsCount = lesson.steps?.length ?? 0
              return (
                <article key={lesson.id} className="lesson-card">
                  <div className="lesson-card-top">
                    <div className="lesson-card-badges">
                      {lesson.difficulty && (
                        <span className={`badge badge-difficulty badge-difficulty--${lesson.difficulty}`}>
                          {DIFFICULTY_LABELS[lesson.difficulty] ?? lesson.difficulty}
                        </span>
                      )}
                      {(lesson.status === 'published' || lesson.status === 'approved') ? (
                        <span className="badge badge-approved">Approvata</span>
                      ) : (
                        <span className="badge badge-draft">Bozza</span>
                      )}
                    </div>
                    <h2 className="lesson-card-title">{lesson.title}</h2>
                    <div className="lesson-card-meta">
                      {lesson.category && (
                        <span className="lesson-meta-item">
                          <span className="lesson-meta-label">Categoria</span>
                          {lesson.category}
                        </span>
                      )}
                      {stepsCount > 0 && (
                        <span className="lesson-meta-item">
                          <span className="lesson-meta-label">Step</span>
                          {stepsCount}
                        </span>
                      )}
                      {lesson.estimatedMinutes != null && (
                        <span className="lesson-meta-item">
                          <span className="lesson-meta-label">Durata</span>
                          {lesson.estimatedMinutes} min
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="lesson-card-bottom">
                    <span className="lesson-date">{formatDateIT(lesson.savedAt)}</span>
                    <div className="lesson-card-actions">
                      <button
                        className="btn btn-play"
                        onClick={() => handlePlay(lesson.id)}
                      >
                        Gioca
                      </button>
                      <button
                        className="btn btn-delete"
                        onClick={() => handleDelete(lesson.id, lesson.title)}
                      >
                        Elimina
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
