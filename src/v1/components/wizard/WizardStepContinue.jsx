import { useState } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'

const BOARD_SIZE = 340

function WizardStepContinue({ stepsCount, currentStep, fen, boardOrientation, onAddAnother, onFinish, onBack, directAdvance }) {
  const [phase, setPhase] = useState(directAdvance ? 'advance' : 'choose')
  const [currentFen, setCurrentFen] = useState(fen)
  const [moveHistory, setMoveHistory] = useState([])
  const [fenHistory, setFenHistory] = useState([fen])

  const stepLabel = currentStep?.tipo_step === 'intent' ? 'domanda strategica'
    : currentStep?.tipo_step === 'detective' ? 'detective'
    : currentStep?.tipo_step === 'candidate' ? 'mosse candidate'
    : 'step'

  const getTurnLabel = () => {
    try {
      const game = new Chess(currentFen)
      return game.turn() === 'w' ? 'Bianco' : 'Nero'
    } catch {
      return ''
    }
  }

  const handleBoardDrop = (from, to) => {
    try {
      const game = new Chess(currentFen)
      const move = game.move({ from, to, promotion: 'q' })
      if (move) {
        const newFen = game.fen()
        setCurrentFen(newFen)
        setMoveHistory(prev => [...prev, move.san])
        setFenHistory(prev => [...prev, newFen])
        return true
      }
    } catch { /* invalid move */ }
    return false
  }

  const handleUndo = () => {
    if (fenHistory.length > 1) {
      const newFenHistory = fenHistory.slice(0, -1)
      setFenHistory(newFenHistory)
      setCurrentFen(newFenHistory[newFenHistory.length - 1])
      setMoveHistory(prev => prev.slice(0, -1))
    }
  }

  const handleResetPhase = () => {
    setPhase('choose')
    setCurrentFen(fen)
    setMoveHistory([])
    setFenHistory([fen])
  }

  // Fase 2: board interattiva per avanzare la posizione
  if (phase === 'advance') {
    return (
      <div className="wizard-page">
        <div className="wizard-page-title">Avanza la posizione</div>
        <p className="wizard-page-subtitle">
          Gioca le mosse sulla scacchiera per raggiungere la posizione del prossimo step:
          la mossa corretta dello studente e la risposta dell'avversario.
        </p>

        <div className="wizard-two-col">
          <div className="wizard-board-col">
            <Chessboard
              position={currentFen}
              boardWidth={BOARD_SIZE}
              onPieceDrop={handleBoardDrop}
              boardOrientation={boardOrientation}
              customBoardStyle={{ borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
              customLightSquareStyle={{ backgroundColor: 'var(--square-light)' }}
              customDarkSquareStyle={{ backgroundColor: 'var(--square-dark)' }}
            />
            <div className="wizard-board-turn-label">
              Tocca al <strong>{getTurnLabel()}</strong>
            </div>
          </div>

          <div className="wizard-side-col">
            <label className="wizard-label">Mosse giocate</label>
            {moveHistory.length === 0 ? (
              <p className="wizard-hint">
                Nessuna mossa ancora. Trascina i pezzi sulla scacchiera per avanzare la partita.
              </p>
            ) : (
              <div className="wizard-move-tags" style={{ marginBottom: 12 }}>
                {moveHistory.map((m, i) => (
                  <span key={i} className="wizard-move-tag">
                    {i % 2 === 0 && <strong>{Math.floor(i / 2) + 1}.</strong>} {m}
                  </span>
                ))}
              </div>
            )}

            {moveHistory.length > 0 && (
              <button className="wizard-btn-secondary" onClick={handleUndo} style={{ padding: '8px 16px', fontSize: 13 }}>
                &#8617; Annulla ultima mossa
              </button>
            )}

            <p className="wizard-hint" style={{ marginTop: 24 }}>
              Puoi anche procedere senza giocare mosse se il prossimo step usa la stessa posizione.
            </p>
          </div>
        </div>

        <div className="wizard-nav-row">
          <button className="wizard-btn-secondary" onClick={directAdvance ? onBack : handleResetPhase}>
            &#8592; Indietro
          </button>
          <button className="wizard-btn-primary wizard-btn-lg" onClick={() => onAddAnother(currentFen, moveHistory)}>
            Avanti con questa posizione &#8594;
          </button>
        </div>
      </div>
    )
  }

  // Fase 1: scelta aggiungi/finisci
  return (
    <div className="wizard-page">
      <div className="wizard-page-title">Vuoi aggiungere un altro step?</div>
      <p className="wizard-page-subtitle">
        {stepsCount === 0
          ? `Hai creato una ${stepLabel}. Puoi aggiungere altri step per creare una lezione piu ricca.`
          : `La lezione ha ${stepsCount} step finora. Puoi continuare ad aggiungerne o concludere.`}
      </p>

      <div className="wizard-continue-cards">
        <button className="wizard-continue-card add" onClick={() => setPhase('advance')}>
          <div className="wizard-continue-icon">&#43;</div>
          <strong>Si, aggiungi un altro step</strong>
          <p>Gioca la risposta dell'avversario e costruisci il prossimo step della lezione.</p>
        </button>

        <button className="wizard-continue-card finish" onClick={onFinish}>
          <div className="wizard-continue-icon">&#10003;</div>
          <strong>No, la lezione e' pronta</strong>
          <p>Vai al riepilogo per dare un titolo, provare la lezione e salvarla.</p>
        </button>
      </div>

      <div className="wizard-nav-row">
        <button className="wizard-btn-secondary" onClick={onBack}>&#8592; Indietro</button>
        <div />
      </div>
    </div>
  )
}

export default WizardStepContinue
