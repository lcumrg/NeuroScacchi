import { useState } from 'react'
import { Chessboard } from 'react-chessboard'

const BOARD_SIZE = 340

function WizardStepQuestion({ step, fen, boardOrientation, onUpdate, onNext, onBack }) {
  const tipo = step.tipo_step

  // Per detective: clicca sulla casa corretta
  const [detectivePickMode, setDetectivePickMode] = useState(false)

  // Per candidate/intent: clicca per scegliere mosse
  const [pickingMoveFor, setPickingMoveFor] = useState(null) // 'consentite' | 'corrette' | 'candidate' | null
  const [moveFrom, setMoveFrom] = useState(null)

  const handleSquareClick = (square) => {
    if (tipo === 'detective' && detectivePickMode) {
      onUpdate({ risposta_corretta_casa: square })
      setDetectivePickMode(false)
      return
    }

    if (pickingMoveFor) {
      if (!moveFrom) {
        setMoveFrom(square)
      } else {
        const moveStr = moveFrom + square
        if (moveFrom !== square) {
          if (pickingMoveFor === 'consentite') {
            const current = step.mosse_consentite || []
            if (!current.includes(moveStr)) onUpdate({ mosse_consentite: [...current, moveStr] })
          } else if (pickingMoveFor === 'corrette') {
            const current = step.mosse_corrette || []
            if (!current.includes(moveStr)) onUpdate({ mosse_corrette: [...current, moveStr] })
          } else if (pickingMoveFor === 'candidate') {
            const current = step.mosse_candidate || []
            if (!current.includes(moveStr)) onUpdate({ mosse_candidate: [...current, moveStr] })
          }
        }
        setMoveFrom(null)
        setPickingMoveFor(null)
      }
    }
  }

  // Square styles
  const squareStyles = {}
  if (tipo === 'detective' && step.risposta_corretta_casa) {
    squareStyles[step.risposta_corretta_casa] = {
      background: 'radial-gradient(circle, rgba(76,175,80,0.7) 0%, rgba(76,175,80,0.2) 70%)',
      boxShadow: 'inset 0 0 0 3px #4CAF50'
    }
  }
  if (moveFrom) {
    squareStyles[moveFrom] = {
      background: 'radial-gradient(circle, rgba(33,150,243,0.7) 0%, rgba(33,150,243,0.2) 70%)',
      boxShadow: 'inset 0 0 0 3px #2196F3'
    }
  }

  const canProceed = () => {
    if (tipo === 'intent') return step.domanda && (step.opzioni_risposta || []).some(o => o) && step.risposta_corretta
    if (tipo === 'detective') return step.domanda && step.risposta_corretta_casa
    if (tipo === 'candidate') return (step.mosse_candidate || []).length >= 2 && step.mossa_migliore
    return false
  }

  return (
    <div className="wizard-page">
      <div className="wizard-page-title">
        {tipo === 'intent' && 'Scrivi la tua domanda strategica'}
        {tipo === 'detective' && 'Imposta la domanda Detective'}
        {tipo === 'candidate' && 'Definisci le mosse candidate'}
      </div>

      <div className="wizard-two-col">
        <div className="wizard-board-col">
          <Chessboard position={fen} boardWidth={BOARD_SIZE}
            boardOrientation={boardOrientation}
            arePiecesDraggable={false}
            onSquareClick={handleSquareClick}
            customSquareStyles={squareStyles}
            customBoardStyle={{ borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', cursor: (detectivePickMode || pickingMoveFor) ? 'crosshair' : 'default' }}
            customLightSquareStyle={{ backgroundColor: 'var(--square-light)' }}
            customDarkSquareStyle={{ backgroundColor: 'var(--square-dark)' }}
          />
          {(detectivePickMode || pickingMoveFor) && (
            <div className="wizard-board-hint">
              {detectivePickMode && 'Clicca sulla casa corretta'}
              {pickingMoveFor && !moveFrom && 'Clicca la casa di partenza del pezzo'}
              {pickingMoveFor && moveFrom && 'Ora clicca la casa di arrivo'}
            </div>
          )}
        </div>

        <div className="wizard-side-col">
          {/* INTENT */}
          {tipo === 'intent' && (
            <>
              <label className="wizard-label">La tua domanda</label>
              <textarea className="wizard-textarea" value={step.domanda || ''} rows={2}
                onChange={(e) => onUpdate({ domanda: e.target.value })}
                placeholder="Es: Quale piano strategico e' corretto per il Bianco?" />

              <label className="wizard-label">Le opzioni di risposta</label>
              {(step.opzioni_risposta || []).map((opt, i) => (
                <div key={i} className="wizard-option-row">
                  <input type="text" className="wizard-input" value={opt}
                    onChange={(e) => {
                      const updated = [...step.opzioni_risposta]
                      updated[i] = e.target.value
                      onUpdate({ opzioni_risposta: updated })
                    }}
                    placeholder={`Opzione ${i + 1}`} />
                  <button className={`wizard-star-btn ${step.risposta_corretta === opt && opt ? 'selected' : ''}`}
                    onClick={() => { if (opt) onUpdate({ risposta_corretta: opt }) }}
                    title="Segna come corretta">
                    {step.risposta_corretta === opt && opt ? '\u2605' : '\u2606'}
                  </button>
                  {(step.opzioni_risposta || []).length > 2 && (
                    <button className="wizard-remove-btn" onClick={() => {
                      const updated = step.opzioni_risposta.filter((_, j) => j !== i)
                      onUpdate({ opzioni_risposta: updated, ...(step.risposta_corretta === opt ? { risposta_corretta: '' } : {}) })
                    }}>&times;</button>
                  )}
                </div>
              ))}
              <button className="wizard-btn-add" onClick={() => onUpdate({ opzioni_risposta: [...(step.opzioni_risposta || []), ''] })}>
                + Aggiungi opzione
              </button>

              <label className="wizard-label wizard-label-mt">Mosse sulla scacchiera (opzionale)</label>
              <p className="wizard-hint">Quali mosse puo fare lo studente dopo aver risposto? Clicca da-a sulla scacchiera.</p>

              <div className="wizard-move-section">
                <div className="wizard-move-group">
                  <span className="wizard-move-group-label">Consentite:</span>
                  <div className="wizard-move-tags">
                    {(step.mosse_consentite || []).map((m, i) => (
                      <span key={i} className="wizard-move-tag">{m}
                        <button onClick={() => onUpdate({ mosse_consentite: step.mosse_consentite.filter((_, j) => j !== i) })}>&times;</button>
                      </span>
                    ))}
                    <button className="wizard-move-add-btn"
                      onClick={() => { setPickingMoveFor('consentite'); setMoveFrom(null) }}>
                      + aggiungi
                    </button>
                  </div>
                </div>
                <div className="wizard-move-group">
                  <span className="wizard-move-group-label">Corrette:</span>
                  <div className="wizard-move-tags">
                    {(step.mosse_corrette || []).map((m, i) => (
                      <span key={i} className="wizard-move-tag correct">{m}
                        <button onClick={() => onUpdate({ mosse_corrette: step.mosse_corrette.filter((_, j) => j !== i) })}>&times;</button>
                      </span>
                    ))}
                    <button className="wizard-move-add-btn"
                      onClick={() => { setPickingMoveFor('corrette'); setMoveFrom(null) }}>
                      + aggiungi
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* DETECTIVE */}
          {tipo === 'detective' && (
            <>
              <label className="wizard-label">La tua domanda</label>
              <textarea className="wizard-textarea" value={step.domanda || ''} rows={2}
                onChange={(e) => onUpdate({ domanda: e.target.value })}
                placeholder="Es: Quale casa e' il punto debole del Nero?" />

              <label className="wizard-label">Casa corretta</label>
              <div className="wizard-detective-pick">
                <div className="wizard-detective-value">
                  {step.risposta_corretta_casa
                    ? <span className="wizard-detective-square">{step.risposta_corretta_casa}</span>
                    : <span className="wizard-detective-placeholder">Nessuna casa selezionata</span>}
                </div>
                <button className="wizard-btn-secondary"
                  onClick={() => setDetectivePickMode(!detectivePickMode)}>
                  {detectivePickMode ? 'Annulla' : 'Clicca sulla scacchiera'}
                </button>
              </div>

              <label className="wizard-label wizard-label-mt">Max tentativi</label>
              <input type="number" className="wizard-input wizard-input-sm"
                value={step.max_tentativi || 3} min={1} max={10}
                onChange={(e) => onUpdate({ max_tentativi: parseInt(e.target.value) || 3 })} />
            </>
          )}

          {/* CANDIDATE */}
          {tipo === 'candidate' && (
            <>
              <label className="wizard-label">Quante mosse candidate deve trovare?</label>
              <input type="number" className="wizard-input wizard-input-sm"
                value={step.num_candidate || 2} min={1} max={5}
                onChange={(e) => onUpdate({ num_candidate: parseInt(e.target.value) || 2 })} />

              <label className="wizard-label wizard-label-mt">Mosse candidate accettabili</label>
              <p className="wizard-hint">Clicca da-a sulla scacchiera per aggiungere mosse.</p>
              <div className="wizard-move-tags">
                {(step.mosse_candidate || []).map((m, i) => (
                  <span key={i} className={`wizard-move-tag ${m === step.mossa_migliore ? 'best' : 'good'}`}>
                    {m} {m === step.mossa_migliore && '\u2605'}
                    <button onClick={() => {
                      const updated = step.mosse_candidate.filter((_, j) => j !== i)
                      onUpdate({ mosse_candidate: updated, ...(step.mossa_migliore === m ? { mossa_migliore: updated[0] || '' } : {}) })
                    }}>&times;</button>
                  </span>
                ))}
                <button className="wizard-move-add-btn"
                  onClick={() => { setPickingMoveFor('candidate'); setMoveFrom(null) }}>
                  + aggiungi
                </button>
              </div>

              <label className="wizard-label wizard-label-mt">Qual e' la migliore?</label>
              <div className="wizard-radio-group">
                {(step.mosse_candidate || []).map(m => (
                  <label key={m} className="wizard-radio">
                    <input type="radio" name="best" checked={step.mossa_migliore === m}
                      onChange={() => onUpdate({ mossa_migliore: m })} />
                    <span>{m}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="wizard-nav-row">
        <button className="wizard-btn-secondary" onClick={onBack}>&#8592; Indietro</button>
        <button className="wizard-btn-primary wizard-btn-lg" onClick={onNext} disabled={!canProceed()}>
          Avanti &#8594;
        </button>
      </div>
    </div>
  )
}

export default WizardStepQuestion
