import { useState } from 'react'
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
  
  // Analizza posizione per radar
  const game = new Chess(position)
  
  // Simula la mossa per vedere le conseguenze
  let positionAfterMove = position
  let threats = []
  
  try {
    const tempGame = new Chess(position)
    tempGame.move({
      from: move.from,
      to: move.to,
      promotion: 'q'
    })
    positionAfterMove = tempGame.fen()
    
    // Analizza minacce sulla posizione risultante
    threats = analyzeThreats(tempGame)
  } catch (e) {
    console.error('Error analyzing move:', e)
  }

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

// Funzione helper per analizzare minacce
function analyzeThreats(game) {
  const threats = []
  
  // Controlla se il re è in scacco
  if (game.isCheck()) {
    threats.push('Il tuo Re è sotto scacco!')
  }
  
  // Controlla se la mossa è illegale (non dovrebbe succedere ma safe check)
  if (game.isGameOver()) {
    if (game.isCheckmate()) {
      threats.push('Questa mossa porta a scacco matto!')
    }
  }
  
  // Analisi pezzi attaccati (semplificata)
  const board = game.board()
  const turn = game.turn()
  
  board.forEach((row, rowIdx) => {
    row.forEach((square, colIdx) => {
      if (square && square.color === turn) {
        const squareName = String.fromCharCode(97 + colIdx) + (8 - rowIdx)
        const attacks = game.moves({ square: squareName, verbose: true })
          .filter(m => m.captured)
        
        // Controlla se questo pezzo è attaccato
        const isAttacked = isSquareAttacked(game, squareName, turn)
        if (isAttacked && square.type !== 'p') {
          threats.push(`Il tuo ${getPieceName(square.type)} in ${squareName} è vulnerabile`)
        }
      }
    })
  })
  
  return threats.slice(0, 3) // Max 3 avvisi per non sovraccaricare
}

function isSquareAttacked(game, square, byColor) {
  // Controlla se una casa è attaccata dall'avversario
  try {
    const tempGame = new Chess(game.fen())
    // Cambia turno per vedere attacchi avversari
    const fen = tempGame.fen()
    const parts = fen.split(' ')
    parts[1] = byColor === 'w' ? 'b' : 'w'
    const flippedFen = parts.join(' ')
    
    const testGame = new Chess(flippedFen)
    const moves = testGame.moves({ verbose: true })
    
    return moves.some(m => m.to === square)
  } catch (e) {
    return false
  }
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
