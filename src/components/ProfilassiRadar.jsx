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

  const handleCheck = (index) => {
    if (checkedItems.includes(index)) {
      setCheckedItems(checkedItems.filter(i => i !== index))
    } else {
      setCheckedItems([...checkedItems, index])
    }
  }

  const allChecked = checkedItems.length === checklistQuestions.length

  return (
    <div className="profilassi-overlay">
      <div className="profilassi-modal">
        <div className="profilassi-header">
          <span className="profilassi-icon">🛡️</span>
          <h3>Controllo Profilassi</h3>
        </div>

        <div className="profilassi-content">
          {/* RADAR VISIVO */}
          <div className="profilassi-radar">
            <h4>Radar Minacce</h4>
            <div className="radar-info">
              {threats.length === 0 ? (
                <div className="radar-safe">
                  ✅ Nessuna minaccia immediata rilevata
                </div>
              ) : (
                <div className="radar-warnings">
                  {threats.map((threat, idx) => (
                    <div key={idx} className="radar-warning">
                      ⚠️ {threat}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CHECKLIST */}
          <div className="profilassi-checklist">
            <h4>Prima di confermare, verifica:</h4>
            <div className="checklist-items">
              {checklistQuestions.map((question, index) => (
                <label key={index} className="checklist-item">
                  <input
                    type="checkbox"
                    checked={checkedItems.includes(index)}
                    onChange={() => handleCheck(index)}
                  />
                  <span className="checklist-text">{question}</span>
                </label>
              ))}
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
            ✓ Ho controllato
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
