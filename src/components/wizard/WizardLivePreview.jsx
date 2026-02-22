import { useState, useEffect, useCallback } from 'react'
import { Chessboard } from 'react-chessboard'

/*
  Anteprima live semplificata.
  Simula il flusso studente: freeze → attivita → feedback, step per step.
  Non serve chess.js perche non eseguiamo mosse reali: mostriamo solo la posizione.
*/

const BOARD_SIZE = 380
const FREEZE_DURATION = 2000

const STEP_TYPE_LABELS = { intent: 'Domanda strategica', detective: 'Trova la casa', candidate: 'Mosse candidate' }

function WizardLivePreview({ lessonData, onClose }) {
  const steps = lessonData.steps || []
  const boardOrientation = lessonData.parametri?.orientamento_scacchiera || 'white'

  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [phase, setPhase] = useState('freeze') // freeze | activity | feedback
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [feedbackType, setFeedbackType] = useState(null) // positive | negative
  const [clickedSquare, setClickedSquare] = useState(null)

  const step = steps[currentStepIdx]
  const fen = step?.fen_aggiornata || lessonData.fen

  // Freeze timer
  useEffect(() => {
    if (phase !== 'freeze') return
    const freezeTime = lessonData.parametri?.tempo_freeze || FREEZE_DURATION
    const timer = setTimeout(() => setPhase('activity'), freezeTime)
    return () => clearTimeout(timer)
  }, [phase, currentStepIdx, lessonData.parametri?.tempo_freeze])

  // Reset state when step changes
  useEffect(() => {
    setPhase('freeze')
    setSelectedAnswer(null)
    setFeedbackType(null)
    setClickedSquare(null)
  }, [currentStepIdx])

  const handleIntentAnswer = (opt) => {
    setSelectedAnswer(opt)
    const isCorrect = opt === step.risposta_corretta
    setFeedbackType(isCorrect ? 'positive' : 'negative')
    setPhase('feedback')
  }

  const handleDetectiveClick = useCallback((square) => {
    if (phase !== 'activity' || step?.tipo_step !== 'detective') return
    setClickedSquare(square)
    const isCorrect = square === step.risposta_corretta_casa
    setFeedbackType(isCorrect ? 'positive' : 'negative')
    setPhase('feedback')
  }, [phase, step])

  const handleCandidateConfirm = () => {
    // In preview, always show positive feedback after candidate selection
    setFeedbackType('positive')
    setPhase('feedback')
  }

  const goNextStep = () => {
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1)
    }
  }

  const goRestart = () => {
    setCurrentStepIdx(0)
  }

  const isLastStep = currentStepIdx >= steps.length - 1

  // Highlighted squares for chunks
  const customSquareStyles = {}
  if (phase === 'activity' && step?.mostra_chunk_visivo) {
    step.mostra_chunk_visivo.forEach(sq => {
      customSquareStyles[sq] = { backgroundColor: 'rgba(255, 235, 59, 0.45)', borderRadius: '4px' }
    })
  }
  if (clickedSquare && phase === 'feedback' && step?.tipo_step === 'detective') {
    const color = feedbackType === 'positive' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)'
    customSquareStyles[clickedSquare] = { backgroundColor: color, borderRadius: '4px' }
    if (feedbackType === 'negative' && step.risposta_corretta_casa) {
      customSquareStyles[step.risposta_corretta_casa] = { backgroundColor: 'rgba(76, 175, 80, 0.5)', borderRadius: '4px' }
    }
  }

  // Arrows for patterns
  const customArrows = []
  if (phase === 'activity' && step?.frecce_pattern) {
    step.frecce_pattern.forEach(f => {
      if (f.da && f.a) {
        customArrows.push([f.da, f.a, f.colore || 'rgba(76, 175, 80, 0.7)'])
      }
    })
  }

  if (!step) return null

  const getFeedbackText = () => {
    if (feedbackType === 'positive') {
      return step.feedback || step.feedback_positivo || lessonData.feedback_positivo || 'Ottimo lavoro!'
    }
    return step.feedback_negativo || lessonData.feedback_negativo || 'Riprova con piu attenzione.'
  }

  return (
    <div className="wizard-live-overlay" onClick={onClose}>
      <div className="wizard-live-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="wizard-live-header">
          <div className="wizard-live-title">
            Anteprima: {lessonData.titolo || 'Lezione senza titolo'}
          </div>
          <button className="wizard-live-close" onClick={onClose}>&#10005;</button>
        </div>

        {/* Progress bar */}
        <div className="wizard-live-progress">
          {steps.map((_, i) => (
            <div key={i} className={`wizard-live-progress-dot ${i < currentStepIdx ? 'done' : ''} ${i === currentStepIdx ? 'current' : ''}`} />
          ))}
        </div>

        {/* Content */}
        <div className="wizard-live-content">
          <div className="wizard-live-board-area">
            {/* Freeze overlay */}
            {phase === 'freeze' && (
              <div className="wizard-live-freeze-overlay">
                <div className="wizard-live-freeze-text">Osserva la posizione...</div>
              </div>
            )}

            <Chessboard
              position={fen}
              boardWidth={BOARD_SIZE}
              boardOrientation={boardOrientation}
              arePiecesDraggable={false}
              onSquareClick={phase === 'activity' && step.tipo_step === 'detective' ? handleDetectiveClick : undefined}
              customBoardStyle={{ borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
              customLightSquareStyle={{ backgroundColor: 'var(--square-light)' }}
              customDarkSquareStyle={{ backgroundColor: 'var(--square-dark)' }}
              customSquareStyles={customSquareStyles}
              customArrows={customArrows}
            />
          </div>

          <div className="wizard-live-panel">
            {/* Step info */}
            <div className="wizard-live-step-info">
              Step {currentStepIdx + 1} / {steps.length}
              <span className="wizard-live-step-type">
                {STEP_TYPE_LABELS[step.tipo_step] || step.tipo_step}
              </span>
            </div>

            {/* Phase: Freeze */}
            {phase === 'freeze' && (
              <div className="wizard-live-phase-freeze">
                <div className="wizard-live-phase-icon">&#128065;</div>
                <p>Fase di osservazione...</p>
                <div className="wizard-live-freeze-bar">
                  <div className="wizard-live-freeze-fill" />
                </div>
              </div>
            )}

            {/* Phase: Activity - Intent */}
            {phase === 'activity' && step.tipo_step === 'intent' && (
              <div className="wizard-live-activity">
                <div className="wizard-live-question">{step.domanda}</div>
                <div className="wizard-live-options">
                  {(step.opzioni_risposta || []).filter(Boolean).map((opt, i) => (
                    <button
                      key={i}
                      className="wizard-live-option"
                      onClick={() => handleIntentAnswer(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Phase: Activity - Detective */}
            {phase === 'activity' && step.tipo_step === 'detective' && (
              <div className="wizard-live-activity">
                <div className="wizard-live-question">{step.domanda || 'Clicca sulla casa corretta'}</div>
                <p className="wizard-live-hint">Clicca una casella sulla scacchiera</p>
              </div>
            )}

            {/* Phase: Activity - Candidate */}
            {phase === 'activity' && step.tipo_step === 'candidate' && (
              <div className="wizard-live-activity">
                <div className="wizard-live-question">{step.descrizione_step || 'Quali sono le mosse candidate?'}</div>
                <div className="wizard-live-candidate-list">
                  {(step.mosse_candidate || []).map((m, i) => (
                    <span key={i} className={`wizard-live-candidate-tag ${m === step.mossa_migliore ? 'best' : ''}`}>
                      {m} {m === step.mossa_migliore ? '\u2605' : ''}
                    </span>
                  ))}
                </div>
                <button className="wizard-btn-primary" onClick={handleCandidateConfirm} style={{ marginTop: 16 }}>
                  Conferma
                </button>
              </div>
            )}

            {/* Phase: Feedback */}
            {phase === 'feedback' && (
              <div className={`wizard-live-feedback ${feedbackType}`}>
                <div className="wizard-live-feedback-icon">
                  {feedbackType === 'positive' ? '\u2713' : '\u2717'}
                </div>
                <p className="wizard-live-feedback-text">{getFeedbackText()}</p>

                <div className="wizard-live-feedback-actions">
                  {!isLastStep ? (
                    <button className="wizard-btn-primary" onClick={goNextStep}>
                      Prossimo step &#8594;
                    </button>
                  ) : (
                    <div className="wizard-live-complete">
                      <div className="wizard-live-complete-icon">&#10003;</div>
                      <p>Lezione completata!</p>
                      <div className="wizard-live-complete-actions">
                        <button className="wizard-btn-secondary" onClick={goRestart}>
                          Riprova
                        </button>
                        <button className="wizard-btn-primary" onClick={onClose}>
                          Chiudi anteprima
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WizardLivePreview
