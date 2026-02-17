import { useState, useMemo, useEffect } from 'react'
import { Chess } from 'chess.js'
import './ProfilassiRadar.css'

// Le due domande fisse della profilassi
const PROFILASSI_QUESTIONS = [
  { id: 'king', text: 'Il Re è sotto attacco?', icon: '♔' },
  { id: 'threats', text: 'Ci sono pezzi minacciati?', icon: '⚔️' }
]

// Domanda pre-profilassi sulla fiducia
const CONFIDENCE_OPTIONS = [
  { id: 'sicuro', label: 'Sono sicuro', icon: '💪', color: '#4CAF50' },
  { id: 'dubbio', label: 'Ho un dubbio', icon: '🤔', color: '#FF9800' },
  { id: 'non_so', label: 'Non lo so', icon: '❓', color: '#F44336' }
]

function ProfilassiRadar({ position, move, onConfirm, onCancel, onHighlightChange }) {
  const [confidenceLevel, setConfidenceLevel] = useState(null)
  const [checkedItems, setCheckedItems] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)

  // Analizza la posizione: trova il re del giocatore e i pezzi avversari
  const analysis = useMemo(() => {
    try {
      const currentGame = new Chess(position)
      const ourColor = currentGame.turn() // chi deve muovere = nostro colore
      const enemyColor = ourColor === 'w' ? 'b' : 'w'
      const board = currentGame.board()

      let kingSquare = null
      const enemySquares = []

      board.forEach((row, rowIdx) => {
        row.forEach((piece, colIdx) => {
          if (!piece) return
          const sq = String.fromCharCode(97 + colIdx) + (8 - rowIdx)
          if (piece.color === ourColor && piece.type === 'k') {
            kingSquare = sq
          }
          if (piece.color === enemyColor) {
            enemySquares.push(sq)
          }
        })
      })

      // Verifica se il re e' sotto scacco
      const kingInCheck = currentGame.isCheck()

      return { kingSquare, enemySquares, kingInCheck }
    } catch (e) {
      return { kingSquare: null, enemySquares: [], kingInCheck: false }
    }
  }, [position])

  // Aggiorna evidenziazione sulla scacchiera (solo durante fase checklist)
  useEffect(() => {
    if (!onHighlightChange) return

    // Nessuna evidenziazione durante la fase confidence
    if (!confidenceLevel) {
      onHighlightChange({})
      return
    }

    const question = PROFILASSI_QUESTIONS[currentQuestion]
    if (!question || checkedItems.includes(currentQuestion)) {
      onHighlightChange({})
      return
    }

    const styles = {}

    if (question.id === 'king' && analysis.kingSquare) {
      // Evidenzia la casella del Re con alone blu
      styles[analysis.kingSquare] = {
        background: 'radial-gradient(circle, rgba(66, 165, 245, 0.75) 0%, rgba(66, 165, 245, 0.25) 70%)',
        boxShadow: 'inset 0 0 0 4px rgba(33, 150, 243, 0.9)',
        position: 'relative',
        zIndex: 1
      }
    } else if (question.id === 'threats') {
      // Evidenzia le caselle dei pezzi avversari con alone rosso
      analysis.enemySquares.forEach(sq => {
        styles[sq] = {
          background: 'radial-gradient(circle, rgba(239, 83, 80, 0.55) 0%, rgba(239, 83, 80, 0.15) 70%)',
          boxShadow: 'inset 0 0 0 3px rgba(229, 57, 53, 0.8)',
          position: 'relative',
          zIndex: 1
        }
      })
    }

    onHighlightChange(styles)
  }, [currentQuestion, checkedItems, analysis, onHighlightChange, confidenceLevel])

  // Pulisci evidenziazione al dismount
  useEffect(() => {
    return () => {
      if (onHighlightChange) onHighlightChange({})
    }
  }, [onHighlightChange])

  const handleConfidenceSelect = (level) => {
    setConfidenceLevel(level)
  }

  const handleCheckStep = () => {
    const newChecked = [...checkedItems, currentQuestion]
    setCheckedItems(newChecked)

    if (currentQuestion < PROFILASSI_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const allChecked = checkedItems.length === PROFILASSI_QUESTIONS.length
  const totalSteps = PROFILASSI_QUESTIONS.length + 1 // confidence + 2 domande
  const completedSteps = (confidenceLevel ? 1 : 0) + checkedItems.length
  const progressPercent = (completedSteps / totalSteps) * 100

  return (
    <div className="profilassi-panel">
      <div className="profilassi-header">
        <div className="profilassi-header-row">
          <span className="profilassi-icon">🛡️</span>
          <h3>Controllo Profilassi</h3>
        </div>
        <p className="profilassi-hint">Guarda la scacchiera e verifica prima di confermare</p>
      </div>

      {/* Progress indicator */}
      <div className="profilassi-progress">
        <div className="profilassi-progress-bar">
          <div
            className="profilassi-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="profilassi-progress-text">
          {completedSteps}/{totalSteps}
        </span>
      </div>

      <div className="profilassi-content">
        {/* FASE 0: Domanda sulla fiducia */}
        {!confidenceLevel ? (
          <div className="confidence-section">
            <h4 className="confidence-question">Come ti senti su questa mossa?</h4>
            <div className="confidence-options">
              {CONFIDENCE_OPTIONS.map(option => (
                <button
                  key={option.id}
                  className="confidence-btn"
                  style={{ '--confidence-color': option.color }}
                  onClick={() => handleConfidenceSelect(option.id)}
                >
                  <span className="confidence-icon">{option.icon}</span>
                  <span className="confidence-label">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* FASE 1-2: Checklist step-by-step */
          <div className="profilassi-checklist">
            {/* Badge fiducia selezionata */}
            <div className={`confidence-badge confidence-${confidenceLevel}`}>
              <span>{CONFIDENCE_OPTIONS.find(o => o.id === confidenceLevel)?.icon}</span>
              <span>{CONFIDENCE_OPTIONS.find(o => o.id === confidenceLevel)?.label}</span>
            </div>

            <div className="checklist-items">
              {PROFILASSI_QUESTIONS.map((question, index) => {
                const isChecked = checkedItems.includes(index)
                const isCurrent = index === currentQuestion && !isChecked
                const isLocked = index > currentQuestion && !isChecked

                return (
                  <div
                    key={question.id}
                    className={`checklist-item-v4 ${isChecked ? 'checked' : ''} ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}`}
                  >
                    <span className="checklist-status">
                      {isChecked ? '✅' : isCurrent ? question.icon : '🔒'}
                    </span>
                    <span className="checklist-text">{question.text}</span>
                    {isCurrent && (
                      <button
                        className="btn-check-step"
                        onClick={handleCheckStep}
                      >
                        Verificato
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="profilassi-actions">
        <button
          className="btn-profilassi btn-cancel"
          onClick={onCancel}
        >
          ✗ Annulla
        </button>
        <button
          className={`btn-profilassi btn-confirm ${!allChecked || !confidenceLevel ? 'disabled' : ''}`}
          onClick={() => onConfirm(confidenceLevel)}
          disabled={!allChecked || !confidenceLevel}
        >
          {allChecked && confidenceLevel
            ? '✓ Confermo la mossa'
            : `${completedSteps}/${totalSteps} verifiche`}
        </button>
      </div>
    </div>
  )
}

export default ProfilassiRadar
