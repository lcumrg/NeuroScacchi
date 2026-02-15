import './LessonCard.css'

function LessonCard({ lesson, onSelect, onDelete }) {
  const getTypeIcon = () => {
    if (lesson.tipo_modulo === 'detective') return '🔍'
    return '🎯'
  }

  const getDifficultyStars = () => {
    const level = lesson.difficolta || 'facile'
    const stars = { facile: '⭐', medio: '⭐⭐', difficile: '⭐⭐⭐' }
    return stars[level] || '⭐'
  }

  return (
    <div className="lesson-card" onClick={onSelect}>
      <div className="card-header">
        <span className="card-type-icon">{getTypeIcon()}</span>
        <span className="card-difficulty">{getDifficultyStars()}</span>
      </div>
      <h3 className="card-title">{lesson.titolo}</h3>
      <p className="card-description">{lesson.descrizione}</p>
      <div className="card-meta">
        <span className="card-time">⏱️ {lesson.tempo_stimato || '2 min'}</span>
        <span className="card-type">{lesson.tipo_modulo}</span>
      </div>
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
    </div>
  )
}

export default LessonCard
