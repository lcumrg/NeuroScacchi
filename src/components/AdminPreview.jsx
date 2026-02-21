import { useState, useRef, useEffect } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import './AdminPreview.css'

const BOARD_SIZE = 400

function AdminPreview({ lesson }) {
  const [previewMode, setPreviewMode] = useState('json') // json | live
  const [currentStep, setCurrentStep] = useState(0)
  const [intentAnswer, setIntentAnswer] = useState(null)
  const [detectiveClick, setDetectiveClick] = useState(null)
  const [showChunks, setShowChunks] = useState(false)
  const [previewFeedback, setPreviewFeedback] = useState(null)
  const gameRef = useRef(new Chess())

  const isSequence = ['intent_sequenza', 'candidate_sequenza', 'mista'].includes(lesson.tipo_modulo)
  const steps = lesson.steps || []
  const activeStep = isSequence ? steps[currentStep] : null

  // FEN corrente per la preview
  const currentFen = activeStep?.fen_aggiornata || lesson.fen

  useEffect(() => {
    setCurrentStep(0)
    setIntentAnswer(null)
    setDetectiveClick(null)
    setShowChunks(false)
    setPreviewFeedback(null)
  }, [lesson.tipo_modulo])

  // Simula click intent
  const handleIntentClick = (option) => {
    const text = typeof option === 'string' ? option : option.testo
    const data = activeStep || lesson
    const isCorrect = text === data.risposta_corretta
    setIntentAnswer(text)
    setPreviewFeedback(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) setShowChunks(true)
  }

  // Simula click detective
  const handleDetectiveClick = (square) => {
    const data = activeStep || lesson.modalita_detective
    const correct = data.risposta_corretta_casa
    setDetectiveClick(square)
    setPreviewFeedback(square === correct ? 'correct' : 'wrong')
  }

  // Reset step
  const resetStep = () => {
    setIntentAnswer(null)
    setDetectiveClick(null)
    setShowChunks(false)
    setPreviewFeedback(null)
  }

  // Navigazione step
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      resetStep()
    }
  }
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      resetStep()
    }
  }

  // Square styles per preview
  const customSquareStyles = {}
  const chunks = activeStep?.mostra_chunk_visivo || lesson.parametri?.mostra_chunk_visivo || []
  const arrowsData = activeStep?.frecce_pattern || lesson.parametri?.frecce_pattern || []

  if (showChunks) {
    chunks.forEach(sq => {
      customSquareStyles[sq] = {
        background: 'radial-gradient(circle, rgba(129, 199, 132, 0.7) 0%, rgba(129, 199, 132, 0.3) 70%)',
        boxShadow: 'inset 0 0 0 3px rgba(76, 175, 80, 0.9)'
      }
    })
  }

  if (detectiveClick) {
    const data = activeStep || lesson.modalita_detective
    const isCorrect = detectiveClick === data?.risposta_corretta_casa
    customSquareStyles[detectiveClick] = {
      background: isCorrect
        ? 'radial-gradient(circle, rgba(76, 175, 80, 0.8) 0%, rgba(76, 175, 80, 0.3) 70%)'
        : 'radial-gradient(circle, rgba(244, 67, 54, 0.8) 0%, rgba(244, 67, 54, 0.3) 70%)',
      boxShadow: isCorrect
        ? 'inset 0 0 0 4px rgba(76, 175, 80, 1)'
        : 'inset 0 0 0 4px rgba(244, 67, 54, 1)'
    }
  }

  const customArrows = showChunks ? arrowsData.map(a => [a.from, a.to, 'rgb(76, 175, 80)']) : []

  const currentType = activeStep?.tipo_step || lesson.tipo_modulo

  return (
    <div className="admin-preview">
      <div className="preview-mode-toggle">
        <button className={`admin-btn-sm ${previewMode === 'live' ? 'active' : ''}`} onClick={() => setPreviewMode('live')}>
          Anteprima Live
        </button>
        <button className={`admin-btn-sm ${previewMode === 'json' ? 'active' : ''}`} onClick={() => setPreviewMode('json')}>
          JSON
        </button>
      </div>

      {previewMode === 'json' ? (
        <div className="preview-json">
          <pre className="preview-json-content">
            {JSON.stringify(lesson, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="admin-main-layout">
          <div className="admin-board-col">
            <div className="preview-board-section">
              {lesson.titolo && <h3 className="preview-title">{lesson.titolo}</h3>}
              {lesson.descrizione && <p className="preview-description">{lesson.descrizione}</p>}

              <Chessboard
                position={currentFen}
                boardWidth={BOARD_SIZE}
                boardOrientation={lesson.parametri?.orientamento_scacchiera || 'white'}
                arePiecesDraggable={false}
                onSquareClick={currentType === 'detective' ? handleDetectiveClick : undefined}
                customSquareStyles={customSquareStyles}
                customArrows={customArrows}
                customArrowColor="rgb(76, 175, 80)"
                customBoardStyle={{ borderRadius: '8px', boxShadow: 'var(--shadow-md)', cursor: currentType === 'detective' ? 'crosshair' : 'default' }}
                customLightSquareStyle={{ backgroundColor: 'var(--square-light)' }}
                customDarkSquareStyle={{ backgroundColor: 'var(--square-dark)' }}
              />

              {/* Navigazione step per sequenze */}
              {isSequence && steps.length > 0 && (
                <div className="preview-step-nav">
                  <button className="pgn-nav-btn" onClick={prevStep} disabled={currentStep === 0}>&#9664;</button>
                  <span>Step {currentStep + 1} / {steps.length}</span>
                  <button className="pgn-nav-btn" onClick={nextStep} disabled={currentStep >= steps.length - 1}>&#9654;</button>
                  <button className="admin-btn-sm" onClick={resetStep}>Reset</button>
                </div>
              )}
            </div>
          </div>

          <div className="admin-form-col">
            {/* Feedback */}
            {previewFeedback && (
              <div className={`preview-feedback ${previewFeedback}`}>
                {previewFeedback === 'correct' ? 'Risposta corretta!' : 'Risposta sbagliata!'}
              </div>
            )}

            {/* Intent preview */}
            {(currentType === 'intent') && (
              <div className="preview-intent">
                <div className="preview-question-box">
                  <h4>Domanda Strategica</h4>
                  <p>{(activeStep || lesson).domanda || '(nessuna domanda)'}</p>
                </div>
                <div className="preview-options">
                  {((activeStep || lesson).opzioni_risposta || []).map((opt, i) => {
                    const text = typeof opt === 'string' ? opt : opt.testo
                    const isCorrect = text === (activeStep || lesson).risposta_corretta
                    const isSelected = intentAnswer === text
                    return (
                      <button key={i}
                        className={`preview-option ${isSelected ? (isCorrect ? 'correct' : 'wrong') : ''}`}
                        onClick={() => handleIntentClick(opt)}>
                        {text || `(opzione ${i + 1})`}
                        {isSelected && isCorrect && ' ★'}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Detective preview */}
            {currentType === 'detective' && (
              <div className="preview-detective">
                <div className="preview-question-box">
                  <h4>Detective</h4>
                  <p>{(activeStep || lesson.modalita_detective)?.domanda || '(nessuna domanda)'}</p>
                </div>
                <p className="admin-hint">Clicca sulla scacchiera per rispondere</p>
                <p className="admin-hint">Casa corretta: <strong>{(activeStep || lesson.modalita_detective)?.risposta_corretta_casa || '?'}</strong></p>
              </div>
            )}

            {/* Candidate preview */}
            {currentType === 'candidate' && (
              <div className="preview-candidate">
                <div className="preview-question-box">
                  <h4>Mosse Candidate</h4>
                  <p>{(activeStep)?.descrizione_step || 'Identifica le mosse candidate'}</p>
                </div>
                <div className="preview-candidate-list">
                  {((activeStep || lesson).mosse_candidate || []).map((m, i) => (
                    <div key={i} className={`preview-candidate-item ${m === (activeStep || lesson).mossa_migliore ? 'best' : ''}`}>
                      {m} {m === (activeStep || lesson).mossa_migliore && '★ Migliore'}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info aggiuntive */}
            <div className="preview-info">
              <h4>Info</h4>
              <div className="preview-info-grid">
                <span>Tipo:</span><span>{lesson.tipo_modulo}</span>
                <span>Categoria:</span><span>{lesson.categoria || '-'}</span>
                <span>Difficolta:</span><span>{lesson.difficolta || '-'}</span>
                <span>Freeze:</span><span>{lesson.parametri?.tempo_freeze || 1500}ms</span>
                <span>Profilassi:</span><span>{lesson.parametri?.usa_profilassi ? 'Attiva' : 'No'}</span>
                <span>Metacognizione:</span><span>{(lesson.metacognizione?.domande || []).length > 0 ? `${lesson.metacognizione.domande.length} domande` : 'No'}</span>
                {isSequence && <><span>Step:</span><span>{steps.length}</span></>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPreview
