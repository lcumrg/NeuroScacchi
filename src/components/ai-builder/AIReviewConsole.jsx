import { useState, useMemo } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'

const BOARD_SIZE = 340

const STEP_TYPE_LABELS = {
  intent: 'Domanda strategica',
  detective: 'Trova la casa',
  candidate: 'Mosse candidate'
}

const STEP_TYPE_ICONS = {
  intent: '\u2753',
  detective: '\uD83D\uDD0D',
  candidate: '\u265E'
}

// Costruisce la lista di passi da revisionare in base alla lezione
function buildReviewSteps(lesson) {
  const steps = []

  steps.push({ id: 'metadata', title: 'Identita della lezione', icon: '\uD83D\uDCCB', type: 'metadata' })
  steps.push({ id: 'position', title: 'Posizione sulla scacchiera', icon: '\u265F', type: 'position' })

  if (lesson.steps && lesson.steps.length > 0) {
    lesson.steps.forEach((s, i) => {
      steps.push({
        id: `step-${i}`,
        title: `Step ${i + 1}: ${STEP_TYPE_LABELS[s.tipo_step] || s.tipo_step}`,
        icon: STEP_TYPE_ICONS[s.tipo_step] || '\u2699',
        type: 'activity',
        stepIndex: i
      })
    })
  } else {
    steps.push({
      id: 'activity-0',
      title: STEP_TYPE_LABELS[lesson.tipo_modulo] || 'Attivita',
      icon: STEP_TYPE_ICONS[lesson.tipo_modulo] || '\u2699',
      type: 'activity-single'
    })
  }

  const hasVisuals = lesson.parametri?.mostra_chunk_visivo?.length > 0 ||
    lesson.parametri?.frecce_pattern?.length > 0 ||
    lesson.steps?.some(s => s.mostra_chunk_visivo?.length > 0 || s.frecce_pattern?.length > 0)
  if (hasVisuals) {
    steps.push({ id: 'visuals', title: 'Aiuti visivi', icon: '\uD83C\uDFA8', type: 'visuals' })
  }

  steps.push({ id: 'feedback', title: 'Messaggi di feedback', icon: '\uD83D\uDCAC', type: 'feedback' })

  const hasExtras = lesson.parametri?.usa_profilassi || lesson.metacognizione?.domande?.length > 0
  if (hasExtras) {
    steps.push({ id: 'extras', title: 'Funzionalita extra', icon: '\u2699\uFE0F', type: 'extras' })
  }

  steps.push({ id: 'approval', title: 'Approvazione finale', icon: '\u2713', type: 'approval' })

  return steps
}

function AIReviewConsole({ lessonData, onUpdateLesson, onApprove, onBack }) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [stepStatuses, setStepStatuses] = useState({}) // id → 'approved' | 'edited'
  const [editingField, setEditingField] = useState(null)
  const [editValues, setEditValues] = useState({})

  const reviewSteps = useMemo(() => buildReviewSteps(lessonData), [lessonData])
  const currentReview = reviewSteps[currentStepIdx]
  const boardOrientation = lessonData.parametri?.orientamento_scacchiera || 'white'

  const approveStep = () => {
    setStepStatuses(prev => ({ ...prev, [currentReview.id]: 'approved' }))
    if (currentStepIdx < reviewSteps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1)
    }
    setEditingField(null)
  }

  const startEdit = (field, value) => {
    setEditingField(field)
    setEditValues(prev => ({ ...prev, [field]: value }))
  }

  const confirmEdit = (field, updater) => {
    updater(editValues[field])
    setStepStatuses(prev => ({ ...prev, [currentReview.id]: 'edited' }))
    setEditingField(null)
  }

  const cancelEdit = () => {
    setEditingField(null)
  }

  const goTo = (idx) => {
    setCurrentStepIdx(idx)
    setEditingField(null)
  }

  const allApproved = reviewSteps
    .filter(s => s.type !== 'approval')
    .every(s => stepStatuses[s.id] === 'approved' || stepStatuses[s.id] === 'edited')

  // Determina la FEN da mostrare per lo step corrente
  const getCurrentFen = () => {
    if (currentReview.type === 'activity' && currentReview.stepIndex !== undefined) {
      const step = lessonData.steps[currentReview.stepIndex]
      return step?.fen_aggiornata || lessonData.fen
    }
    return lessonData.fen
  }

  // ---- Renderer per ogni tipo di review step ----

  const renderMetadata = () => (
    <div className="ai-review-section">
      <ReviewField
        label="Titolo" value={lessonData.titolo}
        editing={editingField === 'titolo'} editValue={editValues.titolo}
        onEdit={() => startEdit('titolo', lessonData.titolo)}
        onChange={(v) => setEditValues(prev => ({ ...prev, titolo: v }))}
        onConfirm={() => confirmEdit('titolo', (v) => onUpdateLesson({ titolo: v }))}
        onCancel={cancelEdit}
      />
      <ReviewField
        label="Descrizione" value={lessonData.descrizione || '(nessuna)'}
        editing={editingField === 'descrizione'} editValue={editValues.descrizione}
        onEdit={() => startEdit('descrizione', lessonData.descrizione || '')}
        onChange={(v) => setEditValues(prev => ({ ...prev, descrizione: v }))}
        onConfirm={() => confirmEdit('descrizione', (v) => onUpdateLesson({ descrizione: v }))}
        onCancel={cancelEdit}
        multiline
      />
      <ReviewField
        label="Autori" value={(lessonData.autori || []).join(', ') || '(nessuno)'}
        editing={editingField === 'autori'} editValue={editValues.autori}
        onEdit={() => startEdit('autori', (lessonData.autori || []).join(', '))}
        onChange={(v) => setEditValues(prev => ({ ...prev, autori: v }))}
        onConfirm={() => confirmEdit('autori', (v) => onUpdateLesson({ autori: v.split(',').map(a => a.trim()).filter(Boolean) }))}
        onCancel={cancelEdit}
      />
      <div className="ai-review-row">
        <ReviewReadonly label="Categoria" value={lessonData.categoria || 'non specificata'} />
        <ReviewReadonly label="Difficolta" value={lessonData.difficolta || 'non specificata'} />
        <ReviewReadonly label="Tipo modulo" value={lessonData.tipo_modulo} />
      </div>
      {lessonData.steps?.length > 0 && (
        <ReviewReadonly label="Numero step" value={`${lessonData.steps.length} step`} />
      )}
    </div>
  )

  const renderPosition = () => {
    let fenValid = true
    try { new Chess(lessonData.fen) } catch { fenValid = false }

    return (
      <div className="ai-review-section">
        <div className="ai-review-board-container">
          {fenValid ? (
            <Chessboard
              position={lessonData.fen}
              boardWidth={BOARD_SIZE}
              boardOrientation={boardOrientation}
              arePiecesDraggable={false}
              customBoardStyle={{ borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
              customLightSquareStyle={{ backgroundColor: 'var(--square-light)' }}
              customDarkSquareStyle={{ backgroundColor: 'var(--square-dark)' }}
            />
          ) : (
            <div className="ai-review-fen-error">FEN non valida - la scacchiera non puo essere mostrata</div>
          )}
        </div>
        <div className="ai-review-fen-display">
          <span className="ai-review-fen-label">FEN:</span>
          <code className="ai-review-fen-code">{lessonData.fen}</code>
        </div>
        <ReviewReadonly label="Orientamento" value={boardOrientation === 'white' ? 'Lato Bianco' : 'Lato Nero'} />
        <ReviewReadonly label="Tempo freeze" value={`${lessonData.parametri?.tempo_freeze || 1500}ms`} />
        {!fenValid && <div className="wizard-error">La FEN non e valida. Correggila prima di approvare.</div>}
      </div>
    )
  }

  const renderActivitySingle = () => {
    const tipo = lessonData.tipo_modulo
    if (tipo === 'intent') return renderIntentActivity(lessonData, false)
    if (tipo === 'detective') return renderDetectiveActivity(lessonData, false)
    if (tipo === 'candidate') return renderCandidateActivity(lessonData, false)
    return <div className="ai-review-section"><p>Tipo modulo non riconosciuto: {tipo}</p></div>
  }

  const renderActivityStep = (stepIndex) => {
    const step = lessonData.steps[stepIndex]
    if (!step) return null
    const tipo = step.tipo_step

    return (
      <div className="ai-review-section">
        {/* Mini board per lo step */}
        <div className="ai-review-board-container ai-review-board-small">
          <Chessboard
            position={step.fen_aggiornata || lessonData.fen}
            boardWidth={280}
            boardOrientation={boardOrientation}
            arePiecesDraggable={false}
            customBoardStyle={{ borderRadius: '10px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}
            customLightSquareStyle={{ backgroundColor: 'var(--square-light)' }}
            customDarkSquareStyle={{ backgroundColor: 'var(--square-dark)' }}
          />
        </div>
        {step.fen_aggiornata && step.fen_aggiornata !== lessonData.fen && (
          <div className="ai-review-fen-display" style={{ fontSize: 11 }}>
            <span className="ai-review-fen-label">FEN step:</span>
            <code className="ai-review-fen-code">{step.fen_aggiornata}</code>
          </div>
        )}
        {tipo === 'intent' && renderIntentActivity(step, true)}
        {tipo === 'detective' && renderDetectiveActivity(step, true)}
        {tipo === 'candidate' && renderCandidateActivity(step, true)}
      </div>
    )
  }

  const renderIntentActivity = (data, isStep) => {
    const domanda = isStep ? data.domanda : data.domanda
    const opzioni = isStep ? data.opzioni_risposta : data.opzioni_risposta
    const corretta = isStep ? data.risposta_corretta : data.risposta_corretta
    const mosseConsentite = isStep ? data.mosse_consentite : data.mosse_consentite
    const mosseCorrette = isStep ? data.mosse_corrette : data.mosse_corrette

    return (
      <>
        <div className="ai-review-question">{domanda || '(domanda mancante)'}</div>
        <div className="ai-review-options">
          {(opzioni || []).map((opt, i) => {
            const text = typeof opt === 'object' ? opt.testo : opt
            const isCorrect = text === corretta
            return (
              <div key={i} className={`ai-review-option ${isCorrect ? 'correct' : ''}`}>
                {isCorrect && <span className="ai-review-option-badge">Corretta</span>}
                {text}
              </div>
            )
          })}
        </div>
        {mosseConsentite?.length > 0 && (
          <div className="ai-review-moves">
            <span className="ai-review-moves-label">Mosse consentite:</span>
            <div className="ai-review-move-tags">
              {mosseConsentite.map((m, i) => (
                <span key={i} className={`ai-review-move-tag ${mosseCorrette?.includes(m) ? 'best' : ''}`}>
                  {m} {mosseCorrette?.includes(m) ? '\u2605' : ''}
                </span>
              ))}
            </div>
          </div>
        )}
      </>
    )
  }

  const renderDetectiveActivity = (data, isStep) => {
    const domanda = isStep ? data.domanda : data.modalita_detective?.domanda
    const casa = isStep ? data.risposta_corretta_casa : data.modalita_detective?.risposta_corretta_casa
    const maxTentativi = isStep ? data.max_tentativi : 3

    return (
      <>
        <div className="ai-review-question">{domanda || '(domanda mancante)'}</div>
        <div className="ai-review-detective-answer">
          <span className="ai-review-detective-label">Casa corretta:</span>
          <span className="ai-review-detective-square">{casa || '??'}</span>
        </div>
        <ReviewReadonly label="Max tentativi" value={maxTentativi || 3} />
      </>
    )
  }

  const renderCandidateActivity = (data, isStep) => {
    const candidate = isStep ? data.mosse_candidate : data.mosse_candidate
    const migliore = isStep ? data.mossa_migliore : data.mossa_migliore
    const numCandidate = isStep ? data.num_candidate : (data.parametri?.num_candidate || 2)

    return (
      <>
        {isStep && data.descrizione_step && (
          <div className="ai-review-question">{data.descrizione_step}</div>
        )}
        <ReviewReadonly label="Mosse da trovare" value={numCandidate} />
        <div className="ai-review-moves">
          <span className="ai-review-moves-label">Mosse candidate:</span>
          <div className="ai-review-move-tags">
            {(candidate || []).map((m, i) => (
              <span key={i} className={`ai-review-move-tag ${m === migliore ? 'best' : 'good'}`}>
                {m} {m === migliore ? '\u2605 migliore' : ''}
              </span>
            ))}
          </div>
        </div>
      </>
    )
  }

  const renderVisuals = () => {
    const chunks = lessonData.parametri?.mostra_chunk_visivo || []
    const arrows = lessonData.parametri?.frecce_pattern || []

    // Raccogli anche da steps
    const stepChunks = (lessonData.steps || []).flatMap((s, i) =>
      (s.mostra_chunk_visivo || []).map(sq => ({ square: sq, step: i + 1 }))
    )
    const stepArrows = (lessonData.steps || []).flatMap((s, i) =>
      (s.frecce_pattern || []).map(a => ({ ...a, step: i + 1 }))
    )

    // Costruisci stili per evidenziare le case sulla scacchiera preview
    const squareStyles = {}
    chunks.forEach(sq => {
      squareStyles[sq] = { background: 'radial-gradient(circle, rgba(76,175,80,0.5) 36%, transparent 40%)' }
    })

    const boardArrows = arrows.map(a => [a.from, a.to, 'rgb(76,175,80)'])

    return (
      <div className="ai-review-section">
        <div className="ai-review-board-container ai-review-board-small">
          <Chessboard
            position={lessonData.fen}
            boardWidth={280}
            boardOrientation={boardOrientation}
            arePiecesDraggable={false}
            customSquareStyles={squareStyles}
            customArrows={boardArrows}
            customBoardStyle={{ borderRadius: '10px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}
            customLightSquareStyle={{ backgroundColor: 'var(--square-light)' }}
            customDarkSquareStyle={{ backgroundColor: 'var(--square-dark)' }}
          />
        </div>

        {chunks.length > 0 && (
          <div className="ai-review-visual-group">
            <span className="ai-review-visual-label">Chunk visivi (case illuminate):</span>
            <div className="ai-review-move-tags">
              {chunks.map((sq, i) => <span key={i} className="ai-review-move-tag good">{sq}</span>)}
            </div>
          </div>
        )}

        {arrows.length > 0 && (
          <div className="ai-review-visual-group">
            <span className="ai-review-visual-label">Frecce:</span>
            <div className="ai-review-move-tags">
              {arrows.map((a, i) => <span key={i} className="ai-review-move-tag">{a.from} \u2192 {a.to}</span>)}
            </div>
          </div>
        )}

        {stepChunks.length > 0 && (
          <div className="ai-review-visual-group">
            <span className="ai-review-visual-label">Chunk negli step:</span>
            <div className="ai-review-move-tags">
              {stepChunks.map((c, i) => <span key={i} className="ai-review-move-tag good">{c.square} (step {c.step})</span>)}
            </div>
          </div>
        )}

        {stepArrows.length > 0 && (
          <div className="ai-review-visual-group">
            <span className="ai-review-visual-label">Frecce negli step:</span>
            <div className="ai-review-move-tags">
              {stepArrows.map((a, i) => <span key={i} className="ai-review-move-tag">{a.from} \u2192 {a.to} (step {a.step})</span>)}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderFeedback = () => {
    // Feedback a livello root
    const posFeedback = lessonData.feedback_positivo
    const negFeedback = lessonData.feedback_negativo

    // Feedback detective
    const detectivePosF = lessonData.modalita_detective?.feedback_positivo
    const detectiveNegF = lessonData.modalita_detective?.feedback_negativo

    // Feedback per step
    const stepFeedbacks = (lessonData.steps || []).map((s, i) => ({
      step: i + 1,
      tipo: s.tipo_step,
      positivo: s.feedback || s.feedback_positivo || '',
      negativo: s.feedback_negativo || ''
    }))

    return (
      <div className="ai-review-section">
        {/* Feedback root */}
        <div className="ai-review-feedback-pair">
          <div className="ai-review-feedback-card positive">
            <div className="ai-review-feedback-header">
              <span className="ai-review-feedback-icon positive">\u2714</span>
              <strong>Feedback positivo</strong>
            </div>
            <p>{posFeedback || '(non specificato)'}</p>
          </div>
          <div className="ai-review-feedback-card negative">
            <div className="ai-review-feedback-header">
              <span className="ai-review-feedback-icon negative">\u2718</span>
              <strong>Feedback negativo</strong>
            </div>
            <p>{negFeedback || '(non specificato)'}</p>
          </div>
        </div>

        {/* Detective feedback */}
        {(detectivePosF || detectiveNegF) && (
          <>
            <div className="ai-review-visual-label" style={{ marginTop: 16 }}>Feedback detective:</div>
            <div className="ai-review-feedback-pair">
              <div className="ai-review-feedback-card positive small">
                <p>{detectivePosF || '(non specificato)'}</p>
              </div>
              <div className="ai-review-feedback-card negative small">
                <p>{detectiveNegF || '(non specificato)'}</p>
              </div>
            </div>
          </>
        )}

        {/* Feedback per step */}
        {stepFeedbacks.length > 0 && stepFeedbacks.map((sf, i) => (
          <div key={i} style={{ marginTop: 16 }}>
            <div className="ai-review-visual-label">
              Step {sf.step} ({STEP_TYPE_LABELS[sf.tipo] || sf.tipo}):
            </div>
            <div className="ai-review-feedback-pair">
              <div className="ai-review-feedback-card positive small">
                <p>{sf.positivo || '(non specificato)'}</p>
              </div>
              <div className="ai-review-feedback-card negative small">
                <p>{sf.negativo || '(non specificato)'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderExtras = () => {
    const profilassi = lessonData.parametri?.usa_profilassi
    const profilassiConfig = lessonData.parametri?.profilassi
    const meta = lessonData.metacognizione

    return (
      <div className="ai-review-section">
        {/* Profilassi */}
        <div className={`ai-review-extra-card ${profilassi ? 'active' : ''}`}>
          <div className="ai-review-extra-header">
            <span className="ai-review-extra-icon">{profilassi ? '\uD83D\uDEE1\uFE0F' : '\u2B55'}</span>
            <strong>Profilassi</strong>
            <span className={`ai-review-extra-badge ${profilassi ? 'on' : 'off'}`}>
              {profilassi ? 'Attiva' : 'Disattivata'}
            </span>
          </div>
          {profilassi && profilassiConfig && (
            <div className="ai-review-extra-details">
              <ReviewReadonly label="Domanda fiducia" value={profilassiConfig.domanda_fiducia || 'default'} />
              {profilassiConfig.opzioni_fiducia && (
                <div className="ai-review-confidence-options">
                  {profilassiConfig.opzioni_fiducia.map((o, i) => (
                    <span key={i} className="ai-review-confidence-tag" style={{ borderColor: o.color }}>
                      {o.icon} {o.label}
                    </span>
                  ))}
                </div>
              )}
              {profilassiConfig.messaggi_confronto && (
                <ReviewReadonly label="Messaggi confronto" value="Personalizzati" />
              )}
            </div>
          )}
        </div>

        {/* Metacognizione */}
        {meta?.domande?.length > 0 && (
          <div className="ai-review-extra-card active" style={{ marginTop: 12 }}>
            <div className="ai-review-extra-header">
              <span className="ai-review-extra-icon">\uD83E\uDDE0</span>
              <strong>Metacognizione</strong>
              <span className="ai-review-extra-badge on">{meta.domande.length} domande</span>
            </div>
            <div className="ai-review-extra-details">
              <ReviewReadonly label="Trigger" value={meta.trigger || 'post_intent'} />
              <div className="ai-review-meta-list">
                {meta.domande.map((d, i) => (
                  <div key={i} className="ai-review-meta-item">"{d}"</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderApproval = () => {
    const reviewed = reviewSteps.filter(s => s.type !== 'approval')
    const approvedCount = reviewed.filter(s => stepStatuses[s.id]).length
    const totalCount = reviewed.length

    return (
      <div className="ai-review-section ai-review-approval">
        <div className="ai-review-approval-summary">
          <div className="ai-review-approval-count">
            <span className="ai-review-approval-number">{approvedCount}</span>
            <span className="ai-review-approval-total">/ {totalCount} sezioni revisionate</span>
          </div>
          <div className="ai-review-approval-bar">
            <div className="ai-review-approval-fill" style={{ width: `${(approvedCount / totalCount) * 100}%` }} />
          </div>
        </div>

        {/* Lista sezioni con stato */}
        <div className="ai-review-approval-list">
          {reviewed.map((s, i) => (
            <div key={s.id} className="ai-review-approval-item" onClick={() => goTo(i)}>
              <span className={`ai-review-approval-status ${stepStatuses[s.id] || 'pending'}`}>
                {stepStatuses[s.id] === 'approved' ? '\u2713' : stepStatuses[s.id] === 'edited' ? '\u270E' : '\u25CB'}
              </span>
              <span>{s.icon} {s.title}</span>
            </div>
          ))}
        </div>

        {!allApproved && (
          <div className="ai-review-approval-hint">
            Rivedi e approva tutte le sezioni prima di validare la lezione.
          </div>
        )}

        <div className="ai-review-approval-actions">
          <button
            className="wizard-btn-primary wizard-btn-lg wizard-btn-save"
            onClick={() => onApprove(lessonData)}
            disabled={!allApproved}
          >
            Valida e Salva Lezione
          </button>
        </div>
      </div>
    )
  }

  // ---- Render principale ----
  const renderCurrentStep = () => {
    switch (currentReview.type) {
      case 'metadata': return renderMetadata()
      case 'position': return renderPosition()
      case 'activity-single': return renderActivitySingle()
      case 'activity': return renderActivityStep(currentReview.stepIndex)
      case 'visuals': return renderVisuals()
      case 'feedback': return renderFeedback()
      case 'extras': return renderExtras()
      case 'approval': return renderApproval()
      default: return <p>Sezione non riconosciuta</p>
    }
  }

  return (
    <div className="ai-review-console">
      {/* Progress sidebar */}
      <div className="ai-review-sidebar">
        <div className="ai-review-sidebar-title">Revisione</div>
        {reviewSteps.map((step, i) => (
          <button
            key={step.id}
            className={`ai-review-sidebar-item ${i === currentStepIdx ? 'active' : ''} ${stepStatuses[step.id] || ''}`}
            onClick={() => goTo(i)}
          >
            <span className={`ai-review-sidebar-status ${stepStatuses[step.id] || 'pending'}`}>
              {stepStatuses[step.id] === 'approved' ? '\u2713' : stepStatuses[step.id] === 'edited' ? '\u270E' : (i + 1)}
            </span>
            <span className="ai-review-sidebar-label">{step.title}</span>
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="ai-review-main">
        <div className="ai-review-main-header">
          <span className="ai-review-main-icon">{currentReview.icon}</span>
          <h2 className="ai-review-main-title">{currentReview.title}</h2>
          {stepStatuses[currentReview.id] && (
            <span className={`ai-review-badge ${stepStatuses[currentReview.id]}`}>
              {stepStatuses[currentReview.id] === 'approved' ? 'Approvato' : 'Modificato'}
            </span>
          )}
        </div>

        {renderCurrentStep()}

        {/* Navigation */}
        {currentReview.type !== 'approval' && (
          <div className="ai-review-nav">
            <button className="wizard-btn-secondary" onClick={onBack}>
              Torna all'importazione
            </button>
            <div className="ai-review-nav-right">
              {currentStepIdx > 0 && (
                <button className="wizard-btn-secondary" onClick={() => goTo(currentStepIdx - 1)}>
                  \u2190 Precedente
                </button>
              )}
              <button className="wizard-btn-primary" onClick={approveStep}>
                {stepStatuses[currentReview.id] ? 'Confermato \u2192' : 'Approva e Avanti \u2192'}
              </button>
            </div>
          </div>
        )}

        {currentReview.type === 'approval' && (
          <div className="ai-review-nav">
            <button className="wizard-btn-secondary" onClick={onBack}>
              Torna all'importazione
            </button>
            <button className="wizard-btn-secondary" onClick={() => goTo(currentStepIdx - 1)}>
              \u2190 Precedente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Componenti helper ----

function ReviewField({ label, value, editing, editValue, onEdit, onChange, onConfirm, onCancel, multiline }) {
  if (editing) {
    return (
      <div className="ai-review-field editing">
        <span className="ai-review-field-label">{label}</span>
        {multiline ? (
          <textarea className="wizard-textarea" value={editValue || ''} onChange={(e) => onChange(e.target.value)} rows={3} autoFocus />
        ) : (
          <input type="text" className="wizard-input" value={editValue || ''} onChange={(e) => onChange(e.target.value)} autoFocus />
        )}
        <div className="ai-review-field-actions">
          <button className="wizard-btn-primary" onClick={onConfirm} style={{ padding: '6px 16px', fontSize: 13 }}>Salva</button>
          <button className="wizard-btn-secondary" onClick={onCancel} style={{ padding: '6px 16px', fontSize: 13 }}>Annulla</button>
        </div>
      </div>
    )
  }

  return (
    <div className="ai-review-field">
      <span className="ai-review-field-label">{label}</span>
      <span className="ai-review-field-value">{value}</span>
      {onEdit && (
        <button className="ai-review-edit-btn" onClick={onEdit} title="Modifica">{'\u270E'}</button>
      )}
    </div>
  )
}

function ReviewReadonly({ label, value }) {
  return (
    <div className="ai-review-field">
      <span className="ai-review-field-label">{label}</span>
      <span className="ai-review-field-value">{value}</span>
    </div>
  )
}

export default AIReviewConsole
