import { useState, useMemo } from 'react'
import { Chess } from 'chess.js'
import './ProfilassiRadar.css'

function ProfilassiRadar({
  position,
  move,
  onConfirm,
  onCancel,
  checklistQuestions = [
    "Il mio Re è al sicuro?",
    "Non lascio pezzi indifesi?",
    "Cosa può fare l'avversario?"
  ]
}) {
  const [checkedItems, setCheckedItems] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)

  // Fix #3: calcola le minacce solo quando position/move cambiano, non a ogni render
  const threats = useMemo(() => {
    try {
      const tempGame = new Chess(position)
      tempGame.move({
        from: move.from,
        to: move.to,
        promotion: 'q'
      })
      return analyzeThreats(tempGame)
    } catch (e) {
      return []
    }
  }, [position, move.from, move.to])

  // v4.0: modalita step-by-step per le domande
  const handleCheckStep = () => {
    const newChecked = [...checkedItems, currentQuestion]
    setCheckedItems(newChecked)

    if (currentQuestion < checklistQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const allChecked = checkedItems.length === checklistQuestions.length
  const progressPercent = (checkedItems.length / checklistQuestions.length) * 100

  return (
    <div className="profilassi-overlay">
      <div className="profilassi-modal">
        <div className="profilassi-header">
          <span className="profilassi-icon">🛡️</span>
          <h3>Controllo Profilassi</h3>
          <p className="profilassi-hint">Controlla prima di confermare la mossa</p>
        </div>

        {/* v4.0: Progress indicator */}
        <div className="profilassi-progress">
          <div className="profilassi-progress-bar">
            <div
              className="profilassi-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="profilassi-progress-text">
            {checkedItems.length}/{checklistQuestions.length} verifiche
          </span>
        </div>

        <div className="profilassi-content">
          {/* RADAR VISIVO */}
          {threats.length > 0 && (
            <div className="profilassi-radar">
              <h4>Attenzione!</h4>
              <div className="radar-warnings">
                {threats.map((threat, idx) => (
                  <div key={idx} className="radar-warning">
                    <span className="radar-warning-icon">⚠️</span>
                    <span>{threat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {threats.length === 0 && (
            <div className="profilassi-radar radar-safe-block">
              <div className="radar-safe">
                ✅ Nessuna minaccia immediata rilevata
              </div>
            </div>
          )}

          {/* v4.0: CHECKLIST step-by-step */}
          <div className="profilassi-checklist">
            <h4>Verifica passo per passo:</h4>
            <div className="checklist-items">
              {checklistQuestions.map((question, index) => {
                const isChecked = checkedItems.includes(index)
                const isCurrent = index === currentQuestion && !isChecked
                const isLocked = index > currentQuestion && !isChecked

                return (
                  <div
                    key={index}
                    className={`checklist-item-v4 ${isChecked ? 'checked' : ''} ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}`}
                  >
                    <span className="checklist-status">
                      {isChecked ? '✅' : isCurrent ? '👉' : '🔒'}
                    </span>
                    <span className="checklist-text">{question}</span>
                    {isCurrent && !isChecked && (
                      <button
                        className="btn-check-step"
                        onClick={handleCheckStep}
                      >
                        Fatto
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
            {allChecked ? '✓ Confermo la mossa' : `Completa le verifiche (${checkedItems.length}/${checklistQuestions.length})`}
          </button>
        </div>
      </div>
    </div>
  )
}

// Fix #7: analisi minacce piu' robusta usando isAttacked() di chess.js
function analyzeThreats(game) {
  const threats = []

  // Controlla se il re avversario e' in scacco (dopo la nostra mossa, tocca all'avversario)
  if (game.isCheck()) {
    threats.push('Il tuo Re è sotto scacco!')
  }

  if (game.isCheckmate()) {
    threats.push('Questa mossa porta a scacco matto!')
    return threats
  }

  // Analisi pezzi attaccati: dopo la mossa tocca all'avversario,
  // quindi i nostri pezzi sono quelli del colore opposto al turno corrente
  const board = game.board()
  const opponentTurn = game.turn() // chi deve muovere ora (l'avversario)
  const ourColor = opponentTurn === 'w' ? 'b' : 'w'

  board.forEach((row, rowIdx) => {
    row.forEach((square, colIdx) => {
      if (square && square.color === ourColor && square.type !== 'p' && square.type !== 'k') {
        const squareName = String.fromCharCode(97 + colIdx) + (8 - rowIdx)
        // Usa isAttacked di chess.js: controlla se la casa e' attaccata dal colore indicato
        if (game.isAttacked(squareName, opponentTurn)) {
          threats.push(`Il tuo ${getPieceName(square.type)} in ${squareName} è vulnerabile`)
        }
      }
    })
  })

  return threats.slice(0, 3) // Max 3 avvisi per non sovraccaricare
}

function getPieceName(type) {
  const names = {
    'k': 'Re',
    'q': 'Regina',
    'r': 'Torre',
    'b': 'Alfiere',
    'n': 'Cavallo',
    'p': 'Pedone'
  }
  return names[type] || 'Pezzo'
}

export default ProfilassiRadar
