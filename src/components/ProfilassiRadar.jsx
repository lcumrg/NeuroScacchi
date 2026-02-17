import { useState, useMemo, useEffect } from 'react'
import { Chess } from 'chess.js'
import './ProfilassiRadar.css'

// Le due domande fisse della profilassi
const PROFILASSI_QUESTIONS = [
  { id: 'king', text: 'Il Re è sotto attacco?', icon: '♔' },
  { id: 'threats', text: 'Ci sono pezzi minacciati?', icon: '⚔️' }
]

function ProfilassiRadar({ position, move, onConfirm, onCancel, onHighlightChange }) {
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

  // Aggiorna evidenziazione sulla scacchiera quando cambia la domanda corrente
  useEffect(() => {
    if (!onHighlightChange) return

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
  }, [currentQuestion, checkedItems, analysis, onHighlightChange])

  // Pulisci evidenziazione al dismount
  useEffect(() => {
    return () => {
      if (onHighlightChange) onHighlightChange({})
    }
  }, [onHighlightChange])

  const handleCheckStep = () => {
    const newChecked = [...checkedItems, currentQuestion]
    setCheckedItems(newChecked)

    if (currentQuestion < PROFILASSI_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const allChecked = checkedItems.length === PROFILASSI_QUESTIONS.length
  const progressPercent = (checkedItems.length / PROFILASSI_QUESTIONS.length) * 100

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
          {checkedItems.length}/{PROFILASSI_QUESTIONS.length}
        </span>
      </div>

      <div className="profilassi-content">
        {/* CHECKLIST step-by-step — le 2 domande fisse */}
        <div className="profilassi-checklist">
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
      </div>

      <div className="profilassi-actions">
        <button
          className="btn-profilassi btn-cancel"
          onClick={onCancel}
        >
          ✗ Annulla
        </button>
        <button
          className={`btn-profilassi btn-confirm ${!allChecked ? 'disabled' : ''}`}
          onClick={onConfirm}
          disabled={!allChecked}
        >
          {allChecked ? '✓ Confermo la mossa' : `${checkedItems.length}/${PROFILASSI_QUESTIONS.length} verifiche`}
        </button>
      </div>
    </div>
  )
}

export default ProfilassiRadar
