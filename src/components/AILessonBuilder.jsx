import { useState } from 'react'
import { saveLesson } from '../utils/storageManager'
import AIImportStep from './ai-builder/AIImportStep'
import AIReviewConsole from './ai-builder/AIReviewConsole'
import './AILessonBuilder.css'

function AILessonBuilder({ onSave, onClose }) {
  const [screen, setScreen] = useState('import') // 'import' | 'review' | 'done'
  const [lessonData, setLessonData] = useState(null)

  const handleImport = (parsed, validationResult) => {
    setLessonData(parsed)
    setScreen('review')
  }

  const handleUpdateLesson = (updates) => {
    setLessonData(prev => {
      const next = { ...prev }
      for (const [key, value] of Object.entries(updates)) {
        if (key === 'parametri' && typeof value === 'object') {
          next.parametri = { ...prev.parametri, ...value }
        } else {
          next[key] = value
        }
      }
      return next
    })
  }

  const handleApprove = (finalLesson) => {
    // Segna come validata
    const lesson = { ...finalLesson, stato: 'validata' }

    // Genera ID se mancante
    if (!lesson.id) {
      lesson.id = lesson.titolo
        .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `lezione_ia_${Date.now()}`
    }

    saveLesson(lesson)
    if (onSave) onSave(lesson)
    setScreen('done')
  }

  const handleBackToImport = () => {
    setScreen('import')
  }

  return (
    <div className="ai-lesson-builder">
      {/* Header */}
      <div className="ai-builder-header">
        <button className="wizard-back-btn" onClick={onClose}>
          &#8592; Torna alle lezioni
        </button>
        <div className="ai-builder-title">
          <span className="ai-builder-title-icon">&#9881;</span>
          Costruisci con IA
        </div>
        <div className="ai-builder-phase">
          <span className={`ai-builder-phase-dot ${screen === 'import' ? 'active' : screen !== 'import' ? 'done' : ''}`}>1</span>
          <span className="ai-builder-phase-label">Importa</span>
          <span className="ai-builder-phase-line" />
          <span className={`ai-builder-phase-dot ${screen === 'review' ? 'active' : screen === 'done' ? 'done' : ''}`}>2</span>
          <span className="ai-builder-phase-label">Rivedi</span>
          <span className="ai-builder-phase-line" />
          <span className={`ai-builder-phase-dot ${screen === 'done' ? 'active' : ''}`}>3</span>
          <span className="ai-builder-phase-label">Validata</span>
        </div>
      </div>

      {/* Content */}
      <div className="ai-builder-content">
        {screen === 'import' && (
          <AIImportStep onImport={handleImport} />
        )}

        {screen === 'review' && lessonData && (
          <AIReviewConsole
            lessonData={lessonData}
            onUpdateLesson={handleUpdateLesson}
            onApprove={handleApprove}
            onBack={handleBackToImport}
          />
        )}

        {screen === 'done' && (
          <div className="ai-builder-done">
            <div className="ai-builder-done-icon">&#10003;</div>
            <h2>Lezione validata!</h2>
            <p>La lezione <strong>"{lessonData?.titolo}"</strong> e stata salvata ed e pronta per il test con gli studenti.</p>
            <div className="ai-builder-done-actions">
              <button className="wizard-btn-primary wizard-btn-lg" onClick={onClose}>
                Torna alle lezioni
              </button>
              <button className="wizard-btn-secondary" onClick={() => {
                setLessonData(null)
                setScreen('import')
              }}>
                Importa un'altra lezione
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AILessonBuilder
