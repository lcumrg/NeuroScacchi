// DevFeedbackSidebar — strumento sviluppatore per raccolta feedback per-step durante le lezioni.
// Non è una feature utente finale: serve a iterare sulla qualità dei contenuti in fase di test.

const STEP_ICON = {
  intent: '💡', detective: '🔍', candidate: '♟', move: '→', text: '📝', demo: '▶',
}

const TAGS = [
  { id: 'chiaro',    label: 'Chiaro',    color: '#34d399' },
  { id: 'difficile', label: 'Difficile', color: '#fbbf24' },
  { id: 'bloccato',  label: 'Bloccato',  color: '#f87171' },
]

export default function DevFeedbackSidebar({ steps, currentStepIndex, feedbackData, onUpdate }) {
  return (
    <aside className="dev-sidebar">
      <div className="dev-sidebar__header">
        <span className="dev-sidebar__title">Dev Log</span>
        <span className="dev-sidebar__count">{steps.length} step</span>
      </div>

      <div className="dev-sidebar__steps">
        {steps.map((step, i) => {
          const fb = feedbackData[i] || {}
          const isCurrent = i === currentStepIndex
          const isPast    = i < currentStepIndex

          return (
            <div
              key={i}
              className={[
                'dev-step',
                isCurrent ? 'dev-step--current' : '',
                isPast    ? 'dev-step--past'    : '',
              ].filter(Boolean).join(' ')}
            >
              {/* Row: numero + tipo + indicatori */}
              <div className="dev-step__row">
                <span className="dev-step__num">{i + 1}</span>
                <span className="dev-step__icon">{STEP_ICON[step.type] || '·'}</span>
                <span className="dev-step__type">{step.type}</span>
                {fb.tag && (
                  <span
                    className="dev-step__tag-dot"
                    style={{ background: TAGS.find(t => t.id === fb.tag)?.color }}
                    title={fb.tag}
                  />
                )}
                {fb.errors?.length > 0 && (
                  <span className="dev-step__err-badge" title={`${fb.errors.length} errori browser`}>⚠</span>
                )}
              </div>

              {/* Step corrente: form completo */}
              {isCurrent && (
                <div className="dev-step__body">
                  <div className="dev-step__tags">
                    {TAGS.map(t => (
                      <button
                        key={t.id}
                        className={`dev-tag-btn${fb.tag === t.id ? ' active' : ''}`}
                        style={{ '--tag-color': t.color }}
                        onClick={() => onUpdate(i, 'tag', fb.tag === t.id ? null : t.id)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    className={`dev-step__note${fb.tag === 'bloccato' ? ' dev-step__note--required' : ''}`}
                    placeholder={fb.tag === 'bloccato' ? 'Causa del blocco (obbligatoria)...' : 'Nota (opzionale)...'}
                    value={fb.note || ''}
                    rows={3}
                    onChange={e => onUpdate(i, 'note', e.target.value)}
                  />

                  {fb.tag === 'bloccato' && !fb.note?.trim() && (
                    <p className="dev-step__note-warn">Campo obbligatorio per "Bloccato"</p>
                  )}

                  {fb.errors?.length > 0 && (
                    <div className="dev-step__errors">
                      <div className="dev-step__errors-label">
                        Errori browser catturati ({fb.errors.length})
                      </div>
                      {fb.errors.slice(0, 5).map((e, j) => (
                        <div key={j} className="dev-step__error-item" title={e.stack}>
                          {e.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step già passati: mostra nota in compatto se presente */}
              {isPast && fb.note && (
                <div className="dev-step__past-note">{fb.note}</div>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
