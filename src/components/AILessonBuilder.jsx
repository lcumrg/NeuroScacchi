import { useState } from 'react'
import AIImportStep from './ai-builder/AIImportStep'
import LessonWizard from './LessonWizard'
import './AILessonBuilder.css'

function AILessonBuilder({ onSave, onClose }) {
  const [screen, setScreen] = useState('import') // 'import' | 'review' | 'done'
  const [lessonData, setLessonData] = useState(null)

  const handleImport = (parsed) => {
    setLessonData(parsed)
    setScreen('review')
  }

  const handleWizardSave = (lesson) => {
    if (onSave) onSave(lesson)
    setScreen('done')
  }

  const handleBackToImport = () => {
    setScreen('import')
  }

  return (
    <div className="ai-lesson-builder">
      {screen === 'import' && (
        <>
          {/* Header solo per la fase import */}
          <div className="ai-builder-header">
            <button className="wizard-back-btn" onClick={onClose}>
              &#8592; Torna alle lezioni
            </button>
            <div className="ai-builder-title">
              <span className="ai-builder-title-icon">&#9881;</span>
              Costruisci con IA
            </div>
            <div className="ai-builder-phase">
              <span className="ai-builder-phase-dot active">1</span>
              <span className="ai-builder-phase-label">Importa</span>
              <span className="ai-builder-phase-line" />
              <span className="ai-builder-phase-dot">2</span>
              <span className="ai-builder-phase-label">Rivedi</span>
              <span className="ai-builder-phase-line" />
              <span className="ai-builder-phase-dot">3</span>
              <span className="ai-builder-phase-label">Validata</span>
            </div>
          </div>
          <div className="ai-builder-content">
            <AIImportStep onImport={handleImport} />
          </div>
        </>
      )}

      {screen === 'review' && lessonData && (
        <LessonWizard
          editLesson={lessonData}
          fromAI={true}
          onSave={handleWizardSave}
          onClose={handleBackToImport}
        />
      )}

      {screen === 'done' && (
        <>
          <div className="ai-builder-header">
            <button className="wizard-back-btn" onClick={onClose}>
              &#8592; Torna alle lezioni
            </button>
            <div className="ai-builder-title">
              <span className="ai-builder-title-icon">&#9881;</span>
              Costruisci con IA
            </div>
            <div className="ai-builder-phase">
              <span className="ai-builder-phase-dot done">1</span>
              <span className="ai-builder-phase-label">Importa</span>
              <span className="ai-builder-phase-line" />
              <span className="ai-builder-phase-dot done">2</span>
              <span className="ai-builder-phase-label">Rivedi</span>
              <span className="ai-builder-phase-line" />
              <span className="ai-builder-phase-dot active">3</span>
              <span className="ai-builder-phase-label">Validata</span>
            </div>
          </div>
          <div className="ai-builder-content">
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
          </div>
        </>
      )}
    </div>
  )
}

export default AILessonBuilder
