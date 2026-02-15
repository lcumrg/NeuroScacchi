import { useState } from 'react'
import LessonCard from './LessonCard'
import UploadLesson from './UploadLesson'
import './LessonSelector.css'

function LessonSelector({ lessons, onSelectLesson, onUploadLesson, onDeleteLesson }) {
  const [showUpload, setShowUpload] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Organizza lezioni per categoria
  const categories = ['all', 'aperture', 'mediogioco', 'finali', 'tattica', 'altro']
  
  const filteredLessons = selectedCategory === 'all' 
    ? lessons 
    : lessons.filter(l => (l.categoria || 'altro') === selectedCategory)

  return (
    <div className="lesson-selector">
      <div className="selector-header">
        <h2>Le Mie Lezioni</h2>
        <button 
          className="btn-upload"
          onClick={() => setShowUpload(true)}
        >
          📤 Carica Lezione
        </button>
      </div>

      {/* Filtri categoria */}
      <div className="category-filters">
        {categories.map(cat => (
          <button
            key={cat}
            className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Griglia lezioni */}
      <div className="lessons-grid">
        {filteredLessons.length === 0 ? (
          <div className="no-lessons">
            <div className="no-lessons-icon">📚</div>
            <p>Nessuna lezione disponibile</p>
            <button 
              className="btn-upload-empty"
              onClick={() => setShowUpload(true)}
            >
              Carica la tua prima lezione
            </button>
          </div>
        ) : (
          filteredLessons.map(lesson => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onSelect={() => onSelectLesson(lesson)}
              onDelete={() => onDeleteLesson(lesson.id)}
            />
          ))
        )}
      </div>

      {/* Modal Upload */}
      {showUpload && (
        <UploadLesson
          onUpload={onUploadLesson}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  )
}

export default LessonSelector
