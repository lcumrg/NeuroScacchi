import './LessonViewer.css'

const STEP_TYPE_LABELS = {
  intent: 'Intent',
  detective: 'Detective',
  candidate: 'Candidate',
  move: 'Move',
  text: 'Text',
  demo: 'Demo',
}

function truncate(str, max = 80) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '…' : str
}

function stepPreviewText(step) {
  if (!step) return ''
  return (
    step.question ||
    step.content ||
    step.instruction ||
    step.explanation ||
    step.description ||
    ''
  )
}

function StepTypeBadge({ type }) {
  const cls = `lv-step-type lv-step-type--${type || 'unknown'}`
  const label = STEP_TYPE_LABELS[type] || type || '?'
  return <span className={cls}>{label}</span>
}

function StepDetail({ step, stepIndex, sfValidation }) {
  if (!step) return null

  const sfEntry = sfValidation?.[stepIndex]
  const illegalMoves = sfEntry?.illegalMoves || []
  const type = step.type

  return (
    <div className="lv-step-detail">
      <div className="lv-detail-title">
        Step {stepIndex + 1} — <StepTypeBadge type={type} />
      </div>

      {step.fen && (
        <div className="lv-detail-row">
          <span className="lv-detail-label">FEN:</span>
          <span className="lv-detail-value lv-detail-fen">{step.fen}</span>
        </div>
      )}

      {illegalMoves.length > 0 && (
        <div className="lv-detail-row">
          <span className="lv-detail-label">Mosse illegali:</span>
          <div className="lv-moves-list">
            {illegalMoves.map((m, i) => (
              <span key={i} className="lv-move-chip" style={{ background: '#fef2f2', color: '#b91c1c' }}>{m}</span>
            ))}
          </div>
        </div>
      )}

      {/* Intent */}
      {type === 'intent' && (
        <>
          {step.question && (
            <div className="lv-detail-row">
              <span className="lv-detail-label">Domanda:</span>
              <span className="lv-detail-value">{step.question}</span>
            </div>
          )}
          {step.options && step.options.length > 0 && (
            <div className="lv-detail-row">
              <span className="lv-detail-label">Opzioni:</span>
              <ul className="lv-options-list">
                {step.options.map((opt, i) => {
                  // Schema v3: correctness is opt.correct === true (not a separate field on step)
                  const isCorrect = opt.correct === true
                  return (
                    <li key={i} className={`lv-option${isCorrect ? ' lv-option--correct' : ''}`}>
                      {isCorrect && <span className="lv-option-check">✓</span>}
                      {typeof opt === 'string' ? opt : opt.text || JSON.stringify(opt)}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
          {step.allowedMoves && step.allowedMoves.length > 0 && (
            <div className="lv-detail-row">
              <span className="lv-detail-label">Mosse permesse:</span>
              <div className="lv-moves-list">
                {step.allowedMoves.map((m, i) => (
                  <span key={i} className="lv-move-chip">{m}</span>
                ))}
              </div>
            </div>
          )}
          {step.correctMoves && step.correctMoves.length > 0 && (
            <div className="lv-detail-row">
              <span className="lv-detail-label">Mosse corrette:</span>
              <div className="lv-moves-list">
                {step.correctMoves.map((m, i) => (
                  <span key={i} className="lv-move-chip lv-move-chip--best">{m}</span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Detective */}
      {type === 'detective' && (
        <>
          {step.question && (
            <div className="lv-detail-row">
              <span className="lv-detail-label">Domanda:</span>
              <span className="lv-detail-value">{step.question}</span>
            </div>
          )}
          {step.correctSquare && (
            <div className="lv-detail-row">
              <span className="lv-detail-label">Casa corretta:</span>
              <span className="lv-detail-value lv-move-chip">{step.correctSquare}</span>
            </div>
          )}
          {step.maxAttempts != null && (
            <div className="lv-detail-row">
              <span className="lv-detail-label">Tentativi max:</span>
              <span className="lv-detail-value">{step.maxAttempts}</span>
            </div>
          )}
          {step.hints && step.hints.length > 0 && (
            <div className="lv-detail-row">
              <span className="lv-detail-label">Suggerimenti:</span>
              <ul className="lv-hints-list">
                {step.hints.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Candidate */}
      {type === 'candidate' && (
        <>
          {step.candidateMoves && step.candidateMoves.length > 0 && (
            <div className="lv-detail-row">
              <span className="lv-detail-label">Candidate:</span>
              <div className="lv-moves-list">
                {step.candidateMoves.map((m, i) => (
                  <span key={i} className="lv-move-chip">{typeof m === 'string' ? m : m.move || JSON.stringify(m)}</span>
                ))}
              </div>
            </div>
          )}
          {step.requiredCount != null && (
            <div className="lv-detail-row">
              <span className="lv-detail-label">Richieste:</span>
              <span className="lv-detail-value">{step.requiredCount}</span>
            </div>
          )}
          {step.bestMove && (
            <div className="lv-detail-row">
              <span className="lv-detail-label">Migliore:</span>
              <span className="lv-move-chip lv-move-chip--best">{step.bestMove}</span>
            </div>
          )}
        </>
      )}

      {/* Move */}
      {type === 'move' && (
        <>
          {step.correctMoves && step.correctMoves.length > 0 && (
            <div className="lv-detail-row">
              <span className="lv-detail-label">Mosse corrette:</span>
              <div className="lv-moves-list">
                {step.correctMoves.map((m, i) => (
                  <span key={i} className="lv-move-chip lv-move-chip--best">{m}</span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Text */}
      {type === 'text' && (
        <>
          {step.content && (
            <div className="lv-detail-row">
              <span className="lv-detail-label">Contenuto:</span>
              <span className="lv-detail-value">{step.content}</span>
            </div>
          )}
        </>
      )}

      {/* Demo */}
      {type === 'demo' && (
        <>
          {step.moves && step.moves.length > 0 && (
            <div className="lv-detail-row">
              <span className="lv-detail-label">Mosse:</span>
              <div className="lv-moves-list">
                {step.moves.map((m, i) => (
                  <span key={i} className="lv-move-chip">{typeof m === 'string' ? m : m.uci || JSON.stringify(m)}</span>
                ))}
              </div>
            </div>
          )}
          {step.explanation && (
            <div className="lv-detail-row">
              <span className="lv-detail-label">Spiegazione:</span>
              <span className="lv-detail-value">{step.explanation}</span>
            </div>
          )}
          {step.autoPlay != null && (
            <div className="lv-detail-row">
              <span className="lv-detail-label">AutoPlay:</span>
              <span className="lv-detail-value">{step.autoPlay ? 'sì' : 'no'}</span>
            </div>
          )}
        </>
      )}

      {/* Feedback (tutti i tipi) */}
      {step.feedback && (
        <div className="lv-feedback-block">
          <strong>Feedback:</strong>{' '}
          {typeof step.feedback === 'string'
            ? step.feedback
            : JSON.stringify(step.feedback)}
        </div>
      )}

      {/* Visual aids */}
      {step.visualAids && (
        <div className="lv-visual-aids">
          <strong>Visual aids:</strong> {JSON.stringify(step.visualAids)}
        </div>
      )}

      {/* Transition */}
      {step.transition && (
        <div className="lv-transition">
          Transizione: {step.transition}
        </div>
      )}
    </div>
  )
}

// Quality dot color for sfValidation results
function QualityDot({ quality }) {
  const colors = {
    best: '#16a34a',
    good: '#65a30d',
    inaccuracy: '#d97706',
    mistake: '#ea580c',
    blunder: '#dc2626',
  }
  const color = colors[quality]
  if (!color) return null
  return (
    <span
      className="lv-quality-dot"
      title={quality}
      style={{ background: color }}
    />
  )
}

export default function LessonViewer({
  lesson,
  validation,
  sfValidation,
  onStepSelect,
  selectedStepIndex,
}) {
  if (!lesson) {
    return (
      <div className="lesson-viewer lesson-viewer--empty">
        <div className="lv-empty-state">
          <span className="lv-empty-icon">♟</span>
          <p className="lv-empty-text">Nessuna lezione caricata.</p>
          <p className="lv-empty-sub">Imposta tema e livello, poi premi <strong>Genera lezione</strong>.</p>
        </div>
      </div>
    )
  }

  const steps = lesson.steps || []
  const errors = validation?.errors || []
  const warnings = validation?.warnings || []

  return (
    <div className="lesson-viewer">
      {/* Header */}
      <div className="lv-header">
        <span className="lv-title">{lesson.title || lesson.titolo || 'Lezione senza titolo'}</span>
        {lesson.difficulty && (
          <span className="lv-badge lv-badge--difficulty">{lesson.difficulty}</span>
        )}
        {lesson.category && (
          <span className="lv-badge lv-badge--category">{lesson.category}</span>
        )}
        {lesson.estimatedMinutes != null && (
          <span className="lv-badge lv-badge--meta">{lesson.estimatedMinutes} min</span>
        )}
        <span className="lv-badge lv-badge--meta">{steps.length} step</span>
      </div>

      {/* Error banner */}
      {errors.length > 0 && (
        <div className="lv-banner lv-banner--error">
          <strong>Errori schema:</strong>
          <ul>
            {errors.map((e, i) => <li key={i}>{typeof e === 'string' ? e : JSON.stringify(e)}</li>)}
          </ul>
        </div>
      )}

      {/* Warning banner */}
      {warnings.length > 0 && (
        <div className="lv-banner lv-banner--warning">
          <strong>Avvisi:</strong>
          <ul>
            {warnings.map((w, i) => <li key={i}>{typeof w === 'string' ? w : JSON.stringify(w)}</li>)}
          </ul>
        </div>
      )}

      {/* Step list */}
      {steps.length > 0 && (
        <div className="lv-step-list">
          {steps.map((step, index) => {
            const sfEntry = sfValidation?.[index]
            const hasIllegal = sfEntry?.illegalMoves?.length > 0
            const quality = sfEntry?.quality
            const isSelected = selectedStepIndex === index
            const preview = truncate(stepPreviewText(step), 60)

            return (
              <div
                key={index}
                className={`lv-step-row${isSelected ? ' lv-step-row--selected' : ''}`}
                onClick={() => onStepSelect?.(index)}
              >
                <span className="lv-step-index">{index + 1}.</span>
                <StepTypeBadge type={step.type} />
                <span className="lv-step-text">{preview || <em>–</em>}</span>
                {quality && <QualityDot quality={quality} />}
                {hasIllegal && (
                  <span className="lv-step-illegal">mossa illegale</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* SF Analysis placeholder */}
      <div className="lv-sf-section">
        <div className="lv-sf-header">
          <span className="lv-sf-title">Analisi Stockfish</span>
        </div>
        <p className="lv-sf-hint">
          {selectedStepIndex != null
            ? `Step ${selectedStepIndex + 1} selezionato — analisi non ancora eseguita.`
            : 'Clicca uno step per analizzare'}
        </p>
      </div>

      {/* Step detail */}
      {selectedStepIndex != null && steps[selectedStepIndex] && (
        <StepDetail
          step={steps[selectedStepIndex]}
          stepIndex={selectedStepIndex}
          sfValidation={sfValidation}
        />
      )}
    </div>
  )
}
