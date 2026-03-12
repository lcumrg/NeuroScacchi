import { useState, useEffect } from 'react'
import { listDraftLessons, loadDraftLesson, deleteDraftLesson } from '../engine/lessonStore.js'
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

function loadFullLessons() {
  const drafts = listDraftLessons()
  return drafts.map((draft) => {
    const entry = loadDraftLesson(draft.id)
    const lesson = entry?.lesson ?? {}
    return {
      id: draft.id,
      savedAt: draft.savedAt,
      title: draft.title || lesson.title || lesson.titolo || 'Senza titolo',
      difficulty: lesson.difficulty || lesson.difficolta || null,
      category: lesson.category || lesson.categoria || null,
      stepsCount: Array.isArray(lesson.steps) ? lesson.steps.length : 0,
      status: lesson.status || null,
    }
  })
}

export default function LessonsPage() {
  const [lessons, setLessons] = useState([])

  function refresh() {
    setLessons(loadFullLessons())
  }

  useEffect(() => {
    refresh()
  }, [])

  function handlePlay(id) {
    sessionStorage.setItem('ns3_selected_lesson_id', id)
    window.location.hash = '#/player'
  }

  function handleDelete(id, title) {
    if (!window.confirm(`Eliminare la lezione "${title}"? L'azione non è reversibile.`)) return
    deleteDraftLesson(id)
    refresh()
  }

  return (
    <div className="lessons-page fade-in">
      <header className="lessons-header">
        <div className="lessons-header-inner">
          <h1 className="lessons-title">Le mie lezioni</h1>
          {lessons.length > 0 && (
            <span className="lessons-count">{lessons.length} lezione{lessons.length !== 1 ? 'i' : ''}</span>
          )}
        </div>
      </header>

      <div className="lessons-content">
        {lessons.length === 0 ? (
          <div className="lessons-empty">
            <p className="lessons-empty-text">Nessuna lezione salvata.</p>
            <p className="lessons-empty-sub">
              Vai alla{' '}
              <a href="#/console" className="lessons-link">Console Coach</a>{' '}
              per crearne una.
            </p>
          </div>
        ) : (
          <div className="lessons-grid">
            {lessons.map((lesson) => (
              <article key={lesson.id} className="lesson-card">
                <div className="lesson-card-top">
                  <div className="lesson-card-badges">
                    {lesson.difficulty && (
                      <span className={`badge badge-difficulty badge-difficulty--${lesson.difficulty}`}>
                        {DIFFICULTY_LABELS[lesson.difficulty] ?? lesson.difficulty}
                      </span>
                    )}
                    {lesson.status === 'published' && (
                      <span className="badge badge-approved">APPROVATA</span>
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
                    {lesson.stepsCount > 0 && (
                      <span className="lesson-meta-item">
                        <span className="lesson-meta-label">Step</span>
                        {lesson.stepsCount}
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
