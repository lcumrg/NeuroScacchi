import { useState } from 'react'

function WizardStepExtras({ lessonData, step, onUpdateLesson, onUpdateStep, onNext, onBack, onSkip }) {
  const [showProfilassi, setShowProfilassi] = useState(lessonData.parametri?.usa_profilassi || false)
  const [showMeta, setShowMeta] = useState((lessonData.metacognizione?.domande || []).length > 0)
  const [metaQuestion, setMetaQuestion] = useState('')

  const meta = lessonData.metacognizione || { domande: [], trigger: 'post_intent' }

  const toggleProfilassi = () => {
    const next = !showProfilassi
    setShowProfilassi(next)
    if (next) {
      onUpdateLesson({
        parametri: {
          usa_profilassi: true,
          profilassi: lessonData.parametri?.profilassi || {
            domanda_fiducia: 'Come ti senti su questa mossa?',
            opzioni_fiducia: [
              { id: 'sicuro', label: 'Sono sicuro', icon: '\uD83D\uDCAA', color: '#4CAF50' },
              { id: 'dubbio', label: 'Ho un dubbio', icon: '\uD83E\uDD14', color: '#FF9800' },
              { id: 'non_so', label: 'Non lo so', icon: '\u2753', color: '#F44336' }
            ],
            domande_verifica: [
              { id: 'king', text: 'Il Re e sotto attacco?', icon: '\u2654' },
              { id: 'threats', text: 'Ci sono pezzi minacciati?', icon: '\u2694\uFE0F' }
            ]
          }
        }
      })
    } else {
      onUpdateLesson({ parametri: { usa_profilassi: false } })
    }
  }

  const addMetaQuestion = () => {
    if (!metaQuestion.trim()) return
    const updated = { ...meta, domande: [...(meta.domande || []), metaQuestion.trim()] }
    onUpdateLesson({ metacognizione: updated })
    setMetaQuestion('')
    setShowMeta(true)
  }

  const removeMetaQuestion = (idx) => {
    const updated = { ...meta, domande: meta.domande.filter((_, i) => i !== idx) }
    onUpdateLesson({ metacognizione: updated })
  }

  const hasExtras = showProfilassi || (meta.domande || []).length > 0

  return (
    <div className="wizard-page">
      <div className="wizard-page-title">Vuoi aggiungere qualcosa?</div>
      <p className="wizard-page-subtitle">
        Strumenti opzionali per arricchire l'esperienza didattica
      </p>

      <div className="wizard-extras-cards">
        {/* Profilassi */}
        <div className={`wizard-extra-card ${showProfilassi ? 'active' : ''}`}>
          <div className="wizard-extra-card-toggle" onClick={toggleProfilassi}>
            <div className="wizard-extra-card-icon">&#128737;</div>
            <div className="wizard-extra-card-body">
              <strong>Chiedi quanto e' sicuro</strong>
              <p>Prima di confermare la mossa, lo studente dice se e' sicuro, in dubbio, o non sa.
              Poi confronta la fiducia con il risultato.</p>
            </div>
            <div className={`wizard-extra-toggle ${showProfilassi ? 'on' : ''}`}>
              {showProfilassi ? 'ON' : 'OFF'}
            </div>
          </div>

          {showProfilassi && (
            <div className="wizard-extra-details">
              <p className="wizard-hint">
                Lo studente vedra 3 opzioni: &ldquo;Sono sicuro&rdquo;, &ldquo;Ho un dubbio&rdquo;, &ldquo;Non lo so&rdquo;.
                Dopo la risposta, vedra un confronto tra la sua fiducia e il risultato.
              </p>
              <p className="wizard-hint">
                Le impostazioni predefinite funzionano bene. Puoi personalizzarle dal JSON esportato se serve.
              </p>
            </div>
          )}
        </div>

        {/* Metacognizione */}
        <div className={`wizard-extra-card ${showMeta ? 'active' : ''}`}>
          <div className="wizard-extra-card-toggle" onClick={() => setShowMeta(!showMeta)}>
            <div className="wizard-extra-card-icon">&#129504;</div>
            <div className="wizard-extra-card-body">
              <strong>Fallo riflettere</strong>
              <p>Aggiungi domande metacognitive che appaiono dopo lo step.
              Aiutano lo studente a prendere consapevolezza del proprio ragionamento.</p>
            </div>
            <div className={`wizard-extra-toggle ${showMeta ? 'on' : ''}`}>
              {showMeta ? 'ON' : 'OFF'}
            </div>
          </div>

          {showMeta && (
            <div className="wizard-extra-details">
              {/* Domande esistenti */}
              {(meta.domande || []).length > 0 && (
                <div className="wizard-meta-questions">
                  {meta.domande.map((d, i) => (
                    <div key={i} className="wizard-meta-question-row">
                      <span className="wizard-meta-question-text">{d}</span>
                      <button className="wizard-remove-btn" onClick={() => removeMetaQuestion(i)}>&times;</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Aggiungi domanda */}
              <div className="wizard-meta-add">
                <input type="text" className="wizard-input" value={metaQuestion}
                  onChange={(e) => setMetaQuestion(e.target.value)}
                  placeholder="Es: Hai ragionato o hai risposto d'istinto?"
                  onKeyDown={(e) => { if (e.key === 'Enter') addMetaQuestion() }} />
                <button className="wizard-btn-add" onClick={addMetaQuestion}>+ Aggiungi</button>
              </div>

              {/* Suggerimenti */}
              <div className="wizard-meta-suggestions">
                <span className="wizard-meta-suggestions-title">Idee:</span>
                {[
                  'Hai ragionato o hai risposto d\'istinto?',
                  'Hai controllato le minacce dell\'avversario?',
                  'Ti sei fermato a guardare tutta la scacchiera?',
                  'Hai considerato la risposta dell\'avversario?'
                ].filter(s => !(meta.domande || []).includes(s)).map((s, i) => (
                  <button key={i} className="wizard-meta-suggestion" onClick={() => {
                    onUpdateLesson({ metacognizione: { ...meta, domande: [...(meta.domande || []), s] } })
                  }}>{s}</button>
                ))}
              </div>

              {/* Trigger */}
              <label className="wizard-label wizard-label-mt">Quando mostrarle?</label>
              <div className="wizard-radio-group">
                <label className="wizard-radio">
                  <input type="radio" checked={meta.trigger === 'post_intent'}
                    onChange={() => onUpdateLesson({ metacognizione: { ...meta, trigger: 'post_intent' } })} />
                  <span>Dopo la domanda strategica</span>
                </label>
                <label className="wizard-radio">
                  <input type="radio" checked={meta.trigger === 'post_move'}
                    onChange={() => onUpdateLesson({ metacognizione: { ...meta, trigger: 'post_move' } })} />
                  <span>Dopo la mossa</span>
                </label>
                <label className="wizard-radio">
                  <input type="radio" checked={meta.trigger === 'post_errore'}
                    onChange={() => onUpdateLesson({ metacognizione: { ...meta, trigger: 'post_errore' } })} />
                  <span>Solo dopo un errore</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="wizard-nav-row">
        <button className="wizard-btn-secondary" onClick={onBack}>&#8592; Indietro</button>
        <div className="wizard-nav-right">
          {!hasExtras && (
            <button className="wizard-btn-text" onClick={onSkip}>Salta, niente extra</button>
          )}
          <button className="wizard-btn-primary wizard-btn-lg" onClick={onNext}>
            Avanti &#8594;
          </button>
        </div>
      </div>
    </div>
  )
}

export default WizardStepExtras
