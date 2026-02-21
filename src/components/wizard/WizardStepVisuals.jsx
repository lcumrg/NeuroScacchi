import { useState } from 'react'
import { Chessboard } from 'react-chessboard'

const BOARD_SIZE = 380

function WizardStepVisuals({ step, fen, boardOrientation, onUpdate, onNext, onBack, onSkip }) {
  const [mode, setMode] = useState(null) // null | 'chunk' | 'arrow'
  const [arrowStart, setArrowStart] = useState(null)

  const chunks = step.mostra_chunk_visivo || []
  const arrows = step.frecce_pattern || []

  const handleSquareClick = (square) => {
    if (mode === 'chunk') {
      if (chunks.includes(square)) {
        onUpdate({ mostra_chunk_visivo: chunks.filter(s => s !== square) })
      } else {
        onUpdate({ mostra_chunk_visivo: [...chunks, square] })
      }
    } else if (mode === 'arrow') {
      if (!arrowStart) {
        setArrowStart(square)
      } else {
        if (arrowStart !== square) {
          const exists = arrows.some(a => a.from === arrowStart && a.to === square)
          if (!exists) {
            onUpdate({ frecce_pattern: [...arrows, { from: arrowStart, to: square }] })
          }
        }
        setArrowStart(null)
      }
    }
  }

  const squareStyles = {}
  chunks.forEach(sq => {
    squareStyles[sq] = {
      background: 'radial-gradient(circle, rgba(129,199,132,0.7) 0%, rgba(129,199,132,0.3) 70%)',
      boxShadow: 'inset 0 0 0 3px rgba(76,175,80,0.9)'
    }
  })
  if (arrowStart) {
    squareStyles[arrowStart] = {
      background: 'radial-gradient(circle, rgba(255,193,7,0.7) 0%, rgba(255,193,7,0.3) 70%)',
      boxShadow: 'inset 0 0 0 3px #FFC107'
    }
  }

  const customArrows = arrows.map(a => [a.from, a.to, 'rgb(76,175,80)'])

  const hasVisuals = chunks.length > 0 || arrows.length > 0

  return (
    <div className="wizard-page">
      <div className="wizard-page-title">Vuoi evidenziare qualcosa sulla scacchiera?</div>
      <p className="wizard-page-subtitle">
        Aiuti visivi che lo studente vedra dopo aver risposto correttamente
      </p>

      <div className="wizard-two-col">
        <div className="wizard-board-col">
          <Chessboard position={fen} boardWidth={BOARD_SIZE}
            boardOrientation={boardOrientation}
            arePiecesDraggable={false}
            onSquareClick={handleSquareClick}
            customSquareStyles={squareStyles}
            customArrows={customArrows}
            customArrowColor="rgb(76,175,80)"
            customBoardStyle={{ borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', cursor: mode ? 'crosshair' : 'default' }}
            customLightSquareStyle={{ backgroundColor: 'var(--square-light)' }}
            customDarkSquareStyle={{ backgroundColor: 'var(--square-dark)' }}
          />
          {mode === 'arrow' && arrowStart && (
            <div className="wizard-board-hint">Clicca la casa di arrivo della freccia...</div>
          )}
        </div>

        <div className="wizard-side-col">
          <div className="wizard-visual-modes">
            <button className={`wizard-visual-mode-btn ${mode === 'chunk' ? 'active' : ''}`}
              onClick={() => { setMode(mode === 'chunk' ? null : 'chunk'); setArrowStart(null) }}>
              <span className="wizard-visual-mode-icon" style={{ background: '#E8F5E9', color: '#4CAF50' }}>&#9632;</span>
              <div>
                <strong>Evidenzia case</strong>
                <span>Clicca per illuminare case importanti</span>
              </div>
            </button>

            <button className={`wizard-visual-mode-btn ${mode === 'arrow' ? 'active' : ''}`}
              onClick={() => { setMode(mode === 'arrow' ? null : 'arrow'); setArrowStart(null) }}>
              <span className="wizard-visual-mode-icon" style={{ background: '#E3F2FD', color: '#2196F3' }}>&#8594;</span>
              <div>
                <strong>Disegna frecce</strong>
                <span>Clicca partenza poi arrivo</span>
              </div>
            </button>
          </div>

          {/* Riepilogo visivi aggiunti */}
          {hasVisuals && (
            <div className="wizard-visuals-summary">
              {chunks.length > 0 && (
                <div className="wizard-visuals-group">
                  <span className="wizard-visuals-label">Case evidenziate:</span>
                  <div className="wizard-move-tags">
                    {chunks.map(sq => (
                      <span key={sq} className="wizard-move-tag good">{sq}
                        <button onClick={() => onUpdate({ mostra_chunk_visivo: chunks.filter(s => s !== sq) })}>&times;</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {arrows.length > 0 && (
                <div className="wizard-visuals-group">
                  <span className="wizard-visuals-label">Frecce:</span>
                  <div className="wizard-move-tags">
                    {arrows.map((a, i) => (
                      <span key={i} className="wizard-move-tag">{a.from} &#8594; {a.to}
                        <button onClick={() => onUpdate({ frecce_pattern: arrows.filter((_, j) => j !== i) })}>&times;</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <button className="wizard-btn-text-danger" onClick={() => onUpdate({ mostra_chunk_visivo: [], frecce_pattern: [] })}>
                Rimuovi tutto
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="wizard-nav-row">
        <button className="wizard-btn-secondary" onClick={onBack}>&#8592; Indietro</button>
        <div className="wizard-nav-right">
          {!hasVisuals && (
            <button className="wizard-btn-text" onClick={onSkip}>Salta, nessun aiuto visivo</button>
          )}
          <button className="wizard-btn-primary wizard-btn-lg" onClick={onNext}>
            Avanti &#8594;
          </button>
        </div>
      </div>
    </div>
  )
}

export default WizardStepVisuals
