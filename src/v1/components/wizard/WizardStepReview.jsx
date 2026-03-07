import { useState } from 'react'
import { Chessboard } from 'react-chessboard'
import WizardLivePreview from './WizardLivePreview'

const BOARD_SIZE = 340

const STEP_TYPE_LABELS = { intent: 'Domanda strategica', detective: 'Trova la casa', candidate: 'Mosse candidate' }
const STEP_TYPE_ICONS = { intent: '\u2753', detective: '\uD83D\uDD0D', candidate: '\uD83C\uDFAF' }

function WizardStepReview({ lessonData, onUpdateLesson, onSave, onExport, onClose, onBack, onEditStep, onDeleteStep, onAddStep, onEditTransition, fromAI }) {
  const [titolo, setTitolo] = useState(lessonData.titolo || '')
  const [descrizione, setDescrizione] = useState(lessonData.descrizione || '')
  const [categoria, setCategoria] = useState(lessonData.categoria || 'aperture')
  const [difficolta, setDifficolta] = useState(lessonData.difficolta || 'facile')
  const [errors, setErrors] = useState([])
  const [saved, setSaved] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [previewStep, setPreviewStep] = useState(0)
  const [showLivePreview, setShowLivePreview] = useState(false)
  const [expandExtras, setExpandExtras] = useState(false)

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

  const handleDeleteStepConfirm = (idx) => {
    if (confirm(`Eliminare lo step ${idx + 1}?`)) {
      onDeleteStep(idx)
    }
  }

  const currentPreviewStep = steps[previewStep]
  const previewFen = currentPreviewStep?.fen_aggiornata || lessonData.fen

  const getStepPreviewText = (s) => {
    if (s.domanda) return s.domanda
    if (s.descrizione_step) return s.descrizione_step
    if (s.mosse_candidate?.length) return `${s.mosse_candidate.length} mosse candidate`
    return 'Step configurato'
  }

  return (
    <div className="wizard-page">
      <div className="wizard-page-title">
        {saved ? 'Lezione salvata!' : (fromAI ? 'Rivedi e valida la lezione' : 'Dai un titolo e salva')}
      </div>
      {!saved && fromAI && (
        <p className="wizard-page-subtitle">
          Controlla ogni step, modifica quello che serve, poi salva.
        </p>
      )}

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

              {/* Bottone prova live */}
              {steps.length > 0 && (
                <button className="wizard-btn-primary wizard-btn-preview-live" onClick={() => setShowLivePreview(true)}>
                  &#9654; Prova la lezione
                </button>
              )}
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

                  {/* Riepilogo step con azioni */}
                  <div className="wizard-review-steps">
                    <label className="wizard-label wizard-label-mt">
                      Step della lezione ({steps.length})
                    </label>
                    {steps.map((s, i) => (
                      <div key={i}>
                        <div className="wizard-review-step-card">
                          <span className="wizard-review-step-num">{i + 1}</span>
                          <div className="wizard-review-step-info">
                            <span className="wizard-review-step-type">
                              {STEP_TYPE_ICONS[s.tipo_step] || ''} {STEP_TYPE_LABELS[s.tipo_step] || s.tipo_step}
                            </span>
                            <span className="wizard-review-step-preview">
                              {getStepPreviewText(s)}
                            </span>
                          </div>
                          {/* Azioni step */}
                          <div className="wizard-review-step-actions">
                            {onEditStep && (
                              <button className="wizard-review-step-btn edit" onClick={() => onEditStep(i)} title="Modifica step">
                                &#9998;
                              </button>
                            )}
                            {onDeleteStep && steps.length > 1 && (
                              <button className="wizard-review-step-btn delete" onClick={() => handleDeleteStepConfirm(i)} title="Elimina step">
                                &#10005;
                              </button>
                            )}
                          </div>
                        </div>
                        {/* Connettore transizione tra step */}
                        {i < steps.length - 1 && (
                          <div className="wizard-review-transition">
                            <div className="wizard-review-transition-line" />
                            <div className="wizard-review-transition-content">
                              {s.transizione?.mosse?.length > 0 ? (
                                <span className="wizard-review-transition-moves">
                                  {s.transizione.mosse.map((m, mi) => (
                                    <span key={mi} className="wizard-review-transition-move">{m}</span>
                                  ))}
                                </span>
                              ) : (
                                <span className="wizard-review-transition-empty">Nessuna mossa di transizione</span>
                              )}
                              {onEditTransition && (
                                <button className="wizard-review-step-btn edit" onClick={() => onEditTransition(i)} title="Modifica transizione">
                                  &#9998;
                                </button>
                              )}
                            </div>
                            <div className="wizard-review-transition-line" />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Bottone aggiungi step */}
                    {onAddStep && (
                      <button className="wizard-btn-add wizard-review-add-step" onClick={onAddStep}>
                        + Aggiungi step
                      </button>
                    )}
                  </div>

                  {/* Extras inline */}
                  <div className="wizard-review-extras-section">
                    <button className="wizard-review-extras-toggle" onClick={() => setExpandExtras(!expandExtras)}>
                      <span>{expandExtras ? '▾' : '▸'} Opzioni avanzate</span>
                      <div className="wizard-review-extras-badges">
                        {lessonData.parametri?.usa_profilassi && (
                          <span className="wizard-review-badge profilassi">Profilassi</span>
                        )}
                        {(lessonData.metacognizione?.domande || []).length > 0 && (
                          <span className="wizard-review-badge meta">
                            {lessonData.metacognizione.domande.length} domande meta
                          </span>
                        )}
                      </div>
                    </button>

                    {expandExtras && (
                      <div className="wizard-review-extras-content">
                        {/* Profilassi toggle */}
                        <div className="wizard-review-extra-row">
                          <label className="wizard-review-extra-label">
                            <input
                              type="checkbox"
                              checked={lessonData.parametri?.usa_profilassi || false}
                              onChange={(e) => onUpdateLesson({ parametri: { usa_profilassi: e.target.checked } })}
                            />
                            Profilassi (calibrazione fiducia)
                          </label>
                        </div>

                        {/* Metacognizione */}
                        {(lessonData.metacognizione?.domande || []).length > 0 && (
                          <div className="wizard-review-meta-section">
                            <label className="wizard-label">Domande metacognitive</label>
                            {lessonData.metacognizione.domande.map((d, i) => (
                              <div key={i} className="wizard-review-meta-item">{d}</div>
                            ))}
                          </div>
                        )}
                      </div>
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
                    {/* Feedback preview */}
                    <div className="wizard-preview-feedback-pair">
                      {(currentPreviewStep.feedback || currentPreviewStep.feedback_positivo) && (
                        <div className="wizard-preview-feedback positive">
                          <strong>&#10003; Feedback positivo</strong>
                          <p>{currentPreviewStep.feedback || currentPreviewStep.feedback_positivo}</p>
                        </div>
                      )}
                      {currentPreviewStep.feedback_negativo && (
                        <div className="wizard-preview-feedback negative">
                          <strong>&#10007; Feedback negativo</strong>
                          <p>{currentPreviewStep.feedback_negativo}</p>
                        </div>
                      )}
                    </div>
                    {/* Visivi */}
                    {(currentPreviewStep.mostra_chunk_visivo?.length > 0 || currentPreviewStep.frecce_pattern?.length > 0) && (
                      <div className="wizard-preview-visuals">
                        {currentPreviewStep.mostra_chunk_visivo?.length > 0 && (
                          <span className="wizard-review-badge profilassi">
                            {currentPreviewStep.mostra_chunk_visivo.length} caselle evidenziate
                          </span>
                        )}
                        {currentPreviewStep.frecce_pattern?.length > 0 && (
                          <span className="wizard-review-badge meta">
                            {currentPreviewStep.frecce_pattern.length} frecce
                          </span>
                        )}
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
                {fromAI ? 'Valida e Salva' : 'Salva lezione'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Live Preview Modal */}
      {showLivePreview && (
        <WizardLivePreview
          lessonData={lessonData}
          onClose={() => setShowLivePreview(false)}
        />
      )}
    </div>
  )
}

export default WizardStepReview
