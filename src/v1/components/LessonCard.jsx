import { getProgress } from '../utils/storageManager'
import './LessonCard.css'

function LessonCard({ lesson, onSelect, onSelectEsame, onDelete, onEdit }) {
  const progress = getProgress()
  const isCompleted = progress[lesson.id]?.completed

  const getTypeIcon = () => {
    if (lesson.tipo_modulo === 'detective') return '🔍'
    if (lesson.tipo_modulo === 'candidate') return '🎯'
    if (lesson.tipo_modulo === 'candidate_sequenza') return '🎯'
    if (lesson.tipo_modulo === 'intent_sequenza') return '📋'
    return '♟️'
  }

  const getDifficultyStars = () => {
    const level = lesson.difficolta || 'facile'
    const stars = { facile: '⭐', medio: '⭐⭐', difficile: '⭐⭐⭐' }
    return stars[level] || '⭐'
  }

  const getTypeLabel = () => {
    const labels = {
      intent: 'Intent',
      detective: 'Detective',
      intent_sequenza: 'Sequenza',
      candidate: 'Candidate',
      candidate_sequenza: 'Candidate Seq.'
    }
    return labels[lesson.tipo_modulo] || lesson.tipo_modulo
  }

  return (
    <div className="lesson-card" onClick={onSelect}>
      <div className="card-header">
        <span className="card-type-icon">{getTypeIcon()}</span>
        {lesson.stato && (
          <span className={`card-stato card-stato-${lesson.stato}`}>
            {lesson.stato === 'bozza_ia' ? 'Bozza IA' : lesson.stato === 'validata' ? 'Validata' : lesson.stato === 'in_revisione' ? 'In revisione' : lesson.stato}
          </span>
        )}
        <span className="card-difficulty">{getDifficultyStars()}</span>
      </div>
      <h3 className="card-title">{lesson.titolo}</h3>
      <p className="card-description">{lesson.descrizione}</p>
      <div className="card-meta">
        <span className="card-time">⏱️ {lesson.tempo_stimato || '2 min'}</span>
        <span className="card-type">{getTypeLabel()}</span>
        {isCompleted && <span className="card-completed">✅</span>}
      </div>

      {/* Bottone Esame: visibile solo se la lezione e' stata completata */}
      {isCompleted && (
        <button
          className="btn-esame-card"
          onClick={(e) => {
            e.stopPropagation()
            onSelectEsame()
          }}
        >
          📝 Esame
        </button>
      )}

      {(onEdit || onDelete) && (
        <div className="card-action-buttons">
          {onEdit && (
            <button
              className="btn-edit-card"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              &#9998;
            </button>
          )}
          {onDelete && (
            <button
              className="btn-delete-card"
              onClick={(e) => {
                e.stopPropagation()
                if (confirm(`Eliminare "${lesson.titolo}"?`)) {
                  onDelete()
                }
              }}
            >
              🗑️
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default LessonCard
