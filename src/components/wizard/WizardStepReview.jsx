import { useState } from 'react'
import { Chessboard } from 'react-chessboard'

const BOARD_SIZE = 340

const STEP_TYPE_LABELS = { intent: 'Domanda strategica', detective: 'Trova la casa', candidate: 'Mosse candidate' }

function WizardStepReview({ lessonData, onUpdateLesson, onSave, onExport, onClose, onBack }) {
  const [titolo, setTitolo] = useState(lessonData.titolo || '')
  const [descrizione, setDescrizione] = useState(lessonData.descrizione || '')
  const [categoria, setCategoria] = useState(lessonData.categoria || 'aperture')
  const [difficolta, setDifficolta] = useState(lessonData.difficolta || 'facile')
  const [errors, setErrors] = useState([])
  const [saved, setSaved] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [previewStep, setPreviewStep] = useState(0)

  const steps = lessonData.steps || []
  const boardOrientation = lessonData.parametri?.orientamento_scacchiera || 'white'

  const handleSave = () => {
    if (!titolo.trim()) {
      setErrors(['Dai un titolo alla lezione'])
      return
    }

    const result = onSave({
      titolo: titolo.trim(),
      descrizione: descrizione.trim(),
      categoria,
      difficolta,
      feedback_positivo: lessonData.feedback_positivo || steps[steps.length - 1]?.feedback || steps[steps.length - 1]?.feedback_positivo || 'Ottimo lavoro!',
      feedback_negativo: lessonData.feedback_negativo || steps[steps.length - 1]?.feedback_negativo || 'Riprova con piu attenzione.'
    })

    if (result.success) {
      setSaved(true)
      setErrors([])
      setTimeout(() => onClose(), 1500)
    } else {
      setErrors(result.errors || ['Errore nel salvataggio'])
    }
  }

  const currentPreviewStep = steps[previewStep]
  const previewFen = currentPreviewStep?.fen_aggiornata || lessonData.fen

  return (
    <div className="wizard-page">
      <div className="wizard-page-title">
        {saved ? 'Lezione salvata!' : 'Dai un titolo e salva'}
      </div>

      {saved ? (
        <div className="wizard-saved-message">
          <div className="wizard-saved-icon">&#10003;</div>
          <p>La lezione e' stata salvata con successo. Tornando alla lista...</p>
        </div>
      ) : (
        <>
          <div className="wizard-two-col">
            <div className="wizard-board-col">
              {/* Anteprima scacchiera */}
              <Chessboard position={previewMode ? previewFen : lessonData.fen}
                boardWidth={BOARD_SIZE}
                boardOrientation={boardOrientation}
                arePiecesDraggable={false}
                customBoardStyle={{ borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
                customLightSquareStyle={{ backgroundColor: 'var(--square-light)' }}
                customDarkSquareStyle={{ backgroundColor: 'var(--square-dark)' }}
              />

              {/* Navigazione step in preview */}
              {previewMode && steps.length > 1 && (
                <div className="wizard-review-nav">
                  <button className="wizard-pgn-btn" onClick={() => setPreviewStep(Math.max(0, previewStep - 1))} disabled={previewStep === 0}>&#9664;</button>
                  <span>Step {previewStep + 1} / {steps.length}</span>
                  <button className="wizard-pgn-btn" onClick={() => setPreviewStep(Math.min(steps.length - 1, previewStep + 1))} disabled={previewStep >= steps.length - 1}>&#9654;</button>
                </div>
              )}

              {/* Toggle preview */}
              <button className="wizard-btn-text" onClick={() => setPreviewMode(!previewMode)}>
                {previewMode ? 'Torna al form' : 'Anteprima step'}
              </button>
            </div>

            <div className="wizard-side-col">
              {!previewMode ? (
                <>
                  {/* Form titolo e metadati */}
                  <label className="wizard-label">Titolo della lezione *</label>
                  <input type="text" className="wizard-input wizard-input-lg" value={titolo}
                    onChange={(e) => setTitolo(e.target.value)}
                    placeholder="Es: Pensa prima di muovere" />

                  <label className="wizard-label wizard-label-mt">Descrizione (opzionale)</label>
                  <textarea className="wizard-textarea" value={descrizione}
                    onChange={(e) => setDescrizione(e.target.value)}
                    placeholder="Una breve descrizione per lo studente..."
                    rows={2} />

                  <div className="wizard-review-meta-row">
                    <div className="wizard-review-meta-field">
                      <label className="wizard-label">Categoria</label>
                      <select className="wizard-select" value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}>
                        <option value="aperture">Aperture</option>
                        <option value="mediogioco">Mediogioco</option>
                        <option value="finali">Finali</option>
                        <option value="tattica">Tattica</option>
                        <option value="altro">Altro</option>
                      </select>
                    </div>
                    <div className="wizard-review-meta-field">
                      <label className="wizard-label">Difficolta</label>
                      <select className="wizard-select" value={difficolta}
                        onChange={(e) => setDifficolta(e.target.value)}>
                        <option value="facile">Facile</option>
                        <option value="medio">Medio</option>
                        <option value="difficile">Difficile</option>
                      </select>
                    </div>
                  </div>

                  {/* Riepilogo step */}
                  <div className="wizard-review-steps">
                    <label className="wizard-label wizard-label-mt">
                      Step della lezione ({steps.length})
                    </label>
                    {steps.map((s, i) => (
                      <div key={i} className="wizard-review-step-card">
                        <span className="wizard-review-step-num">{i + 1}</span>
                        <div className="wizard-review-step-info">
                          <span className="wizard-review-step-type">
                            {STEP_TYPE_LABELS[s.tipo_step] || s.tipo_step}
                          </span>
                          <span className="wizard-review-step-preview">
                            {s.domanda || s.descrizione_step || `${(s.mosse_candidate || []).length} mosse`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Info extra */}
                  <div className="wizard-review-extras">
                    {lessonData.parametri?.usa_profilassi && (
                      <span className="wizard-review-badge profilassi">Profilassi attiva</span>
                    )}
                    {(lessonData.metacognizione?.domande || []).length > 0 && (
                      <span className="wizard-review-badge meta">
                        {lessonData.metacognizione.domande.length} domande metacognitive
                      </span>
                    )}
                  </div>

                  {/* Errori */}
                  {errors.length > 0 && (
                    <div className="wizard-errors">
                      {errors.map((e, i) => <div key={i} className="wizard-error">{e}</div>)}
                    </div>
                  )}
                </>
              ) : (
                // Preview mode: mostra contenuto step
                currentPreviewStep && (
                  <div className="wizard-preview-content">
                    <div className="wizard-preview-step-type">
                      {STEP_TYPE_LABELS[currentPreviewStep.tipo_step]}
                    </div>
                    {currentPreviewStep.domanda && (
                      <div className="wizard-preview-question">{currentPreviewStep.domanda}</div>
                    )}
                    {currentPreviewStep.opzioni_risposta && (
                      <div className="wizard-preview-options">
                        {currentPreviewStep.opzioni_risposta.filter(Boolean).map((opt, i) => (
                          <div key={i} className={`wizard-preview-option ${opt === currentPreviewStep.risposta_corretta ? 'correct' : ''}`}>
                            {opt}
                            {opt === currentPreviewStep.risposta_corretta && ' \u2605'}
                          </div>
                        ))}
                      </div>
                    )}
                    {currentPreviewStep.risposta_corretta_casa && (
                      <div className="wizard-preview-detective">
                        Casa corretta: <strong>{currentPreviewStep.risposta_corretta_casa}</strong>
                      </div>
                    )}
                    {currentPreviewStep.mosse_candidate && (
                      <div className="wizard-preview-candidates">
                        Candidate: {currentPreviewStep.mosse_candidate.join(', ')}
                        {currentPreviewStep.mossa_migliore && ` (migliore: ${currentPreviewStep.mossa_migliore})`}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          <div className="wizard-nav-row">
            <button className="wizard-btn-secondary" onClick={onBack}>&#8592; Indietro</button>
            <div className="wizard-nav-right">
              <button className="wizard-btn-text" onClick={onExport}>Scarica JSON</button>
              <button className="wizard-btn-primary wizard-btn-lg wizard-btn-save" onClick={handleSave}>
                Salva lezione
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default WizardStepReview
