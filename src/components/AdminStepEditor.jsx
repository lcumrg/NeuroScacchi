import { useState, useCallback } from 'react'
import { Chessboard } from 'react-chessboard'
import './AdminStepEditor.css'

const BOARD_SIZE = 360

// Editor per aiuti visivi (chunking + frecce) contestuali
function VisualAidsEditor({ chunks, arrows, onChunksChange, onArrowsChange, fen, boardOrientation }) {
  const [arrowMode, setArrowMode] = useState(false)
  const [arrowStart, setArrowStart] = useState(null)

  const handleSquareClick = (square) => {
    if (arrowMode) {
      if (!arrowStart) {
        setArrowStart(square)
      } else {
        const newArrow = { from: arrowStart, to: square }
        const isDup = arrows.some(a => a.from === newArrow.from && a.to === newArrow.to)
        if (!isDup && arrowStart !== square) {
          onArrowsChange([...arrows, newArrow])
        }
        setArrowStart(null)
      }
    } else {
      // Toggle chunk
      if (chunks.includes(square)) {
        onChunksChange(chunks.filter(s => s !== square))
      } else {
        onChunksChange([...chunks, square])
      }
    }
  }

  const removeArrow = (idx) => {
    onArrowsChange(arrows.filter((_, i) => i !== idx))
  }

  const removeChunk = (sq) => {
    onChunksChange(chunks.filter(s => s !== sq))
  }

  // Stili per la scacchiera
  const customSquareStyles = {}
  chunks.forEach(sq => {
    customSquareStyles[sq] = {
      background: 'radial-gradient(circle, rgba(129, 199, 132, 0.7) 0%, rgba(129, 199, 132, 0.3) 70%)',
      boxShadow: 'inset 0 0 0 3px rgba(76, 175, 80, 0.9)'
    }
  })
  if (arrowStart) {
    customSquareStyles[arrowStart] = {
      background: 'radial-gradient(circle, rgba(255, 193, 7, 0.7) 0%, rgba(255, 193, 7, 0.3) 70%)',
      boxShadow: 'inset 0 0 0 3px rgba(255, 193, 7, 1)'
    }
  }

  const customArrows = arrows.map(a => [a.from, a.to, 'rgb(76, 175, 80)'])

  return (
    <div className="visual-aids-editor">
      <div className="visual-aids-toolbar">
        <button className={`admin-btn-sm ${!arrowMode ? 'active' : ''}`} onClick={() => { setArrowMode(false); setArrowStart(null) }}>
          Chunking (click)
        </button>
        <button className={`admin-btn-sm ${arrowMode ? 'active' : ''}`} onClick={() => { setArrowMode(true); setArrowStart(null) }}>
          Frecce (2 click)
        </button>
        {arrowStart && <span className="visual-aids-hint">Clicca la casa di destinazione...</span>}
      </div>

      <div className="visual-aids-board">
        <Chessboard
          position={fen}
          boardWidth={BOARD_SIZE}
          boardOrientation={boardOrientation}
          arePiecesDraggable={false}
          onSquareClick={handleSquareClick}
          customSquareStyles={customSquareStyles}
          customArrows={customArrows}
          customArrowColor="rgb(76, 175, 80)"
          customBoardStyle={{ borderRadius: '8px', boxShadow: 'var(--shadow-sm)', cursor: 'pointer' }}
          customLightSquareStyle={{ backgroundColor: 'var(--square-light)' }}
          customDarkSquareStyle={{ backgroundColor: 'var(--square-dark)' }}
        />
      </div>

      <div className="visual-aids-lists">
        {chunks.length > 0 && (
          <div className="visual-aids-group">
            <strong>Chunking:</strong>
            <div className="visual-aids-tags">
              {chunks.map(sq => (
                <span key={sq} className="visual-aid-tag chunk-tag">
                  {sq} <button onClick={() => removeChunk(sq)}>x</button>
                </span>
              ))}
            </div>
          </div>
        )}
        {arrows.length > 0 && (
          <div className="visual-aids-group">
            <strong>Frecce:</strong>
            <div className="visual-aids-tags">
              {arrows.map((a, i) => (
                <span key={i} className="visual-aid-tag arrow-tag">
                  {a.from} &rarr; {a.to} <button onClick={() => removeArrow(i)}>x</button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Editor per profilassi
function ProfilassiEditor({ parametri, onUpdate }) {
  const profilassi = parametri.profilassi || {}
  const usaProfilassi = parametri.usa_profilassi || false

  const updateProfilassi = (field, value) => {
    const updated = { ...profilassi, [field]: value }
    onUpdate({ usa_profilassi: true, profilassi: updated })
  }

  const domande = profilassi.domande_verifica || [
    { id: 'king', text: 'Il Re e sotto attacco?', icon: '♔' },
    { id: 'threats', text: 'Ci sono pezzi minacciati?', icon: '⚔️' }
  ]

  const opzioniFiducia = profilassi.opzioni_fiducia || [
    { id: 'sicuro', label: 'Sono sicuro', icon: '💪', color: '#4CAF50' },
    { id: 'dubbio', label: 'Ho un dubbio', icon: '🤔', color: '#FF9800' },
    { id: 'non_so', label: 'Non lo so', icon: '❓', color: '#F44336' }
  ]

  const messaggiConfronto = profilassi.messaggi_confronto || {}

  return (
    <div className="profilassi-editor">
      <div className="admin-toggle-row">
        <label className="admin-toggle">
          <input type="checkbox" checked={usaProfilassi}
            onChange={(e) => onUpdate({ usa_profilassi: e.target.checked })} />
          <span className="admin-toggle-label">Attiva Profilassi</span>
        </label>
      </div>

      {usaProfilassi && (
        <>
          <div className="profilassi-editor-section">
            <h4>Domanda Fiducia</h4>
            <input type="text" className="admin-input"
              value={profilassi.domanda_fiducia || 'Come ti senti su questa mossa?'}
              onChange={(e) => updateProfilassi('domanda_fiducia', e.target.value)} />
          </div>

          <div className="profilassi-editor-section">
            <h4>Opzioni Fiducia</h4>
            {opzioniFiducia.map((opt, i) => (
              <div key={opt.id} className="profilassi-option-row">
                <input type="text" className="admin-input-sm" value={opt.label}
                  onChange={(e) => {
                    const updated = [...opzioniFiducia]
                    updated[i] = { ...opt, label: e.target.value }
                    updateProfilassi('opzioni_fiducia', updated)
                  }} placeholder="Label" />
                <input type="text" className="admin-input-xs" value={opt.icon}
                  onChange={(e) => {
                    const updated = [...opzioniFiducia]
                    updated[i] = { ...opt, icon: e.target.value }
                    updateProfilassi('opzioni_fiducia', updated)
                  }} placeholder="Icona" />
                <input type="color" value={opt.color}
                  onChange={(e) => {
                    const updated = [...opzioniFiducia]
                    updated[i] = { ...opt, color: e.target.value }
                    updateProfilassi('opzioni_fiducia', updated)
                  }} />
              </div>
            ))}
          </div>

          <div className="profilassi-editor-section">
            <h4>Domande Verifica</h4>
            {domande.map((d, i) => (
              <div key={d.id} className="profilassi-question-row">
                <input type="text" className="admin-input-xs" value={d.icon}
                  onChange={(e) => {
                    const updated = [...domande]
                    updated[i] = { ...d, icon: e.target.value }
                    updateProfilassi('domande_verifica', updated)
                  }} placeholder="Icona" />
                <input type="text" className="admin-input" value={d.text}
                  onChange={(e) => {
                    const updated = [...domande]
                    updated[i] = { ...d, text: e.target.value }
                    updateProfilassi('domande_verifica', updated)
                  }} placeholder="Domanda verifica" />
                <button className="admin-btn-remove" onClick={() => {
                  updateProfilassi('domande_verifica', domande.filter((_, j) => j !== i))
                }}>x</button>
              </div>
            ))}
            <button className="admin-btn-sm" onClick={() => {
              updateProfilassi('domande_verifica', [...domande, { id: `q_${Date.now()}`, text: '', icon: '?' }])
            }}>+ Aggiungi domanda</button>
          </div>

          <div className="profilassi-editor-section">
            <h4>Messaggi Confronto (opzionali)</h4>
            <p className="admin-hint">Personalizza i messaggi per ogni combinazione fiducia/esito. Lascia vuoto per usare i default.</p>
            {['sicuro_corretto', 'sicuro_sbagliato', 'dubbio_corretto', 'dubbio_sbagliato', 'non_so_corretto', 'non_so_sbagliato'].map(key => (
              <label key={key} className="admin-label">
                <span className="confronto-key">{key.replace(/_/g, ' ')}</span>
                <input type="text" className="admin-input" value={messaggiConfronto[key] || ''}
                  onChange={(e) => {
                    const updated = { ...messaggiConfronto }
                    if (e.target.value) updated[key] = e.target.value
                    else delete updated[key]
                    updateProfilassi('messaggi_confronto', updated)
                  }} placeholder="Messaggio personalizzato..." />
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Editor metacognizione
function MetacognizioneEditor({ metacognizione, onChange }) {
  const meta = metacognizione || { domande: [], trigger: 'post_intent' }

  const update = (field, value) => {
    onChange({ ...meta, [field]: value })
  }

  return (
    <div className="metacognizione-editor">
      <div className="admin-row">
        <label className="admin-label admin-label-half">
          Trigger
          <select className="admin-select" value={meta.trigger || 'post_intent'}
            onChange={(e) => update('trigger', e.target.value)}>
            <option value="post_intent">Dopo Intent</option>
            <option value="post_move">Dopo Mossa</option>
            <option value="post_errore">Dopo Errore</option>
          </select>
        </label>
      </div>

      <div className="metacognizione-questions">
        <h4>Domande Metacognitive</h4>
        {(meta.domande || []).map((d, i) => (
          <div key={i} className="metacognizione-question-row">
            <input type="text" className="admin-input" value={d}
              onChange={(e) => {
                const updated = [...meta.domande]
                updated[i] = e.target.value
                update('domande', updated)
              }} placeholder="Es: Hai ragionato o hai risposto d'istinto?" />
            <button className="admin-btn-remove" onClick={() => {
              update('domande', meta.domande.filter((_, j) => j !== i))
            }}>x</button>
          </div>
        ))}
        <button className="admin-btn-sm" onClick={() => {
          update('domande', [...(meta.domande || []), ''])
        }}>+ Aggiungi domanda</button>
      </div>
    </div>
  )
}

// Move input helper: click su scacchiera per scegliere from+to
function MoveInputHelper({ fen, boardOrientation, value, onChange, placeholder }) {
  const [pickingMove, setPickingMove] = useState(false)
  const [moveFrom, setMoveFrom] = useState(null)

  const handleSquareClick = (square) => {
    if (!moveFrom) {
      setMoveFrom(square)
    } else {
      onChange(moveFrom + square)
      setMoveFrom(null)
      setPickingMove(false)
    }
  }

  const squareStyles = {}
  if (moveFrom) {
    squareStyles[moveFrom] = {
      background: 'radial-gradient(circle, rgba(33, 150, 243, 0.7) 0%, rgba(33, 150, 243, 0.3) 70%)',
      boxShadow: 'inset 0 0 0 3px rgba(33, 150, 243, 1)'
    }
  }

  return (
    <div className="move-input-helper">
      <div className="move-input-row">
        <input type="text" className="admin-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || 'Es: e2e4'} />
        <button className="admin-btn-sm" onClick={() => { setPickingMove(!pickingMove); setMoveFrom(null) }}>
          {pickingMove ? 'Chiudi' : 'Scegli'}
        </button>
      </div>
      {pickingMove && (
        <div className="move-input-board">
          {moveFrom && <span className="move-input-hint">Clicca la destinazione...</span>}
          <Chessboard position={fen} boardWidth={280} boardOrientation={boardOrientation}
            arePiecesDraggable={false} onSquareClick={handleSquareClick} customSquareStyles={squareStyles}
            customBoardStyle={{ borderRadius: '6px', cursor: 'pointer' }}
            customLightSquareStyle={{ backgroundColor: 'var(--square-light)' }}
            customDarkSquareStyle={{ backgroundColor: 'var(--square-dark)' }} />
        </div>
      )}
    </div>
  )
}

// Componente principale
function AdminStepEditor({ lesson, updateLesson, updateParametri, boardOrientation, gameRef }) {
  const [expandedStep, setExpandedStep] = useState(0)
  const tipo = lesson.tipo_modulo
  const isSequence = ['intent_sequenza', 'candidate_sequenza', 'mista'].includes(tipo)

  // Aggiorna un campo degli step
  const updateStep = useCallback((index, updates) => {
    const steps = [...(lesson.steps || [])]
    steps[index] = { ...steps[index], ...updates }
    updateLesson({ steps })
  }, [lesson.steps, updateLesson])

  const addStep = useCallback((tipo_step = null) => {
    const steps = [...(lesson.steps || [])]
    const numero = steps.length + 1
    let newStep = {
      numero,
      fen_aggiornata: lesson.fen,
      mostra_chunk_visivo: [],
      frecce_pattern: [],
      feedback: '',
      feedback_negativo: ''
    }

    if (tipo === 'mista') {
      const stepType = tipo_step || 'intent'
      newStep.tipo_step = stepType
      if (stepType === 'intent') {
        newStep = { ...newStep, domanda: '', opzioni_risposta: ['', ''], risposta_corretta: '', mosse_consentite: [], mosse_corrette: [] }
      } else if (stepType === 'detective') {
        newStep = { ...newStep, domanda: '', risposta_corretta_casa: '', max_tentativi: 3, feedback_positivo: '', feedback_negativo: '' }
      } else if (stepType === 'candidate') {
        newStep = { ...newStep, descrizione_step: '', mosse_candidate: [], mossa_migliore: '', num_candidate: 2, feedback_positivo: '', feedback_negativo: '' }
      }
    } else if (tipo === 'intent_sequenza') {
      newStep = { ...newStep, domanda: '', opzioni_risposta: ['', ''], risposta_corretta: '', mosse_consentite: [], mosse_corrette: [] }
    } else if (tipo === 'candidate_sequenza') {
      newStep = { ...newStep, mosse_candidate: [], mossa_migliore: '', num_candidate: 2 }
    }

    steps.push(newStep)
    updateLesson({ steps })
    setExpandedStep(steps.length - 1)
  }, [lesson.steps, lesson.fen, tipo, updateLesson])

  const removeStep = useCallback((index) => {
    const steps = (lesson.steps || []).filter((_, i) => i !== index).map((s, i) => ({ ...s, numero: i + 1 }))
    updateLesson({ steps })
    if (expandedStep >= steps.length) setExpandedStep(Math.max(0, steps.length - 1))
  }, [lesson.steps, expandedStep, updateLesson])

  const moveStep = useCallback((index, direction) => {
    const steps = [...(lesson.steps || [])]
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= steps.length) return
    ;[steps[index], steps[newIndex]] = [steps[newIndex], steps[index]]
    steps.forEach((s, i) => { s.numero = i + 1 })
    updateLesson({ steps })
    setExpandedStep(newIndex)
  }, [lesson.steps, updateLesson])

  // Render per tipo singolo (non sequenza)
  const renderSingleEditor = () => {
    if (tipo === 'intent') return renderIntentEditor(lesson, (updates) => updateLesson(updates))
    if (tipo === 'detective') return renderDetectiveEditor(lesson, (updates) => updateLesson(updates))
    if (tipo === 'candidate') return renderCandidateEditor(lesson, (updates) => updateLesson(updates))
    return null
  }

  // Editor Intent
  const renderIntentEditor = (data, onUpdate, stepContext = false) => (
    <div className="step-editor-content">
      <label className="admin-label">Domanda *
        <textarea className="admin-textarea" value={data.domanda || ''} rows={2}
          onChange={(e) => onUpdate({ domanda: e.target.value })} placeholder="Quale piano strategico scegli?" />
      </label>

      <div className="admin-label">Opzioni Risposta *
        {(data.opzioni_risposta || []).map((opt, i) => {
          const isString = typeof opt === 'string'
          const text = isString ? opt : opt.testo
          return (
            <div key={i} className="option-row">
              <span className="option-number">{i + 1}</span>
              <input type="text" className="admin-input" value={text}
                onChange={(e) => {
                  const updated = [...data.opzioni_risposta]
                  updated[i] = isString ? e.target.value : { ...opt, testo: e.target.value }
                  onUpdate({ opzioni_risposta: updated })
                }} placeholder={`Opzione ${i + 1}`} />
              <button className={`admin-btn-correct ${data.risposta_corretta === text ? 'selected' : ''}`}
                onClick={() => onUpdate({ risposta_corretta: text })} title="Segna come corretta">
                {data.risposta_corretta === text ? '★' : '☆'}
              </button>
              {(data.opzioni_risposta || []).length > 2 && (
                <button className="admin-btn-remove" onClick={() => {
                  const updated = data.opzioni_risposta.filter((_, j) => j !== i)
                  const wasCorrect = data.risposta_corretta === text
                  onUpdate({ opzioni_risposta: updated, ...(wasCorrect ? { risposta_corretta: '' } : {}) })
                }}>x</button>
              )}
            </div>
          )
        })}
        <button className="admin-btn-sm" onClick={() => {
          onUpdate({ opzioni_risposta: [...(data.opzioni_risposta || []), ''] })
        }}>+ Aggiungi opzione</button>
      </div>

      <div className="admin-label">Mosse Consentite
        <p className="admin-hint">Mosse che lo studente puo eseguire sulla scacchiera (formato: e2e4)</p>
        <div className="move-tags">
          {(data.mosse_consentite || []).map((m, i) => (
            <span key={i} className="move-tag">
              {m} <button onClick={() => {
                onUpdate({ mosse_consentite: data.mosse_consentite.filter((_, j) => j !== i) })
              }}>x</button>
            </span>
          ))}
        </div>
        <MoveInputHelper fen={stepContext ? (data.fen_aggiornata || lesson.fen) : lesson.fen}
          boardOrientation={boardOrientation} value=""
          onChange={(v) => {
            if (v && !(data.mosse_consentite || []).includes(v))
              onUpdate({ mosse_consentite: [...(data.mosse_consentite || []), v] })
          }} placeholder="Aggiungi mossa consentita..." />
      </div>

      <div className="admin-label">Mosse Corrette
        <p className="admin-hint">Mosse considerate "migliori" (formato: e2e4)</p>
        <div className="move-tags">
          {(data.mosse_corrette || []).map((m, i) => (
            <span key={i} className="move-tag correct">
              {m} <button onClick={() => {
                onUpdate({ mosse_corrette: data.mosse_corrette.filter((_, j) => j !== i) })
              }}>x</button>
            </span>
          ))}
        </div>
        <MoveInputHelper fen={stepContext ? (data.fen_aggiornata || lesson.fen) : lesson.fen}
          boardOrientation={boardOrientation} value=""
          onChange={(v) => {
            if (v && !(data.mosse_corrette || []).includes(v))
              onUpdate({ mosse_corrette: [...(data.mosse_corrette || []), v] })
          }} placeholder="Aggiungi mossa corretta..." />
      </div>

      {stepContext && (
        <>
          <label className="admin-label">Feedback Step
            <input type="text" className="admin-input" value={data.feedback || ''}
              onChange={(e) => onUpdate({ feedback: e.target.value })} placeholder="Feedback per questo step..." />
          </label>
          <label className="admin-label">Feedback Negativo Step
            <input type="text" className="admin-input" value={data.feedback_negativo || ''}
              onChange={(e) => onUpdate({ feedback_negativo: e.target.value })} placeholder="Feedback negativo per questo step..." />
          </label>
        </>
      )}
    </div>
  )

  // Editor Detective
  const renderDetectiveEditor = (data, onUpdate, stepContext = false) => {
    const detective = stepContext ? data : (data.modalita_detective || {})
    const updateDetective = stepContext
      ? onUpdate
      : (updates) => onUpdate({ modalita_detective: { ...detective, ...updates } })

    return (
      <div className="step-editor-content">
        <label className="admin-label">Domanda *
          <textarea className="admin-textarea" value={detective.domanda || ''} rows={2}
            onChange={(e) => updateDetective({ domanda: e.target.value })} placeholder="Quale casa e il punto debole?" />
        </label>

        <div className="admin-label">Casa Corretta *
          <p className="admin-hint">Clicca sulla scacchiera o scrivi la casa (es: f7)</p>
          <MoveInputHelper fen={stepContext ? (data.fen_aggiornata || lesson.fen) : lesson.fen}
            boardOrientation={boardOrientation}
            value={detective.risposta_corretta_casa || ''}
            onChange={(v) => updateDetective({ risposta_corretta_casa: v.substring(0, 2) })}
            placeholder="Es: f7" />
        </div>

        {stepContext && (
          <label className="admin-label">Max Tentativi
            <input type="number" className="admin-input" value={data.max_tentativi || 3} min={1} max={10}
              onChange={(e) => onUpdate({ max_tentativi: parseInt(e.target.value) || 3 })} />
          </label>
        )}

        <label className="admin-label">Feedback Positivo
          <input type="text" className="admin-input"
            value={(stepContext ? data : detective).feedback_positivo || ''}
            onChange={(e) => (stepContext ? onUpdate : updateDetective)({ feedback_positivo: e.target.value })}
            placeholder="Esatto! Hai trovato la casa giusta." />
        </label>
        <label className="admin-label">Feedback Negativo
          <input type="text" className="admin-input"
            value={(stepContext ? data : detective).feedback_negativo || ''}
            onChange={(e) => (stepContext ? onUpdate : updateDetective)({ feedback_negativo: e.target.value })}
            placeholder="Riprova!" />
        </label>
      </div>
    )
  }

  // Editor Candidate
  const renderCandidateEditor = (data, onUpdate, stepContext = false) => (
    <div className="step-editor-content">
      {stepContext && (
        <label className="admin-label">Descrizione Step
          <input type="text" className="admin-input" value={data.descrizione_step || ''}
            onChange={(e) => onUpdate({ descrizione_step: e.target.value })} placeholder="Descrivi lo step..." />
        </label>
      )}

      <label className="admin-label">Numero Candidate Richieste
        <input type="number" className="admin-input"
          value={stepContext ? (data.num_candidate || 2) : (lesson.parametri?.num_candidate || 2)}
          min={1} max={5}
          onChange={(e) => {
            const val = parseInt(e.target.value) || 2
            if (stepContext) onUpdate({ num_candidate: val })
            else updateParametri({ num_candidate: val })
          }} />
      </label>

      <div className="admin-label">Mosse Candidate (buone) *
        <p className="admin-hint">Tutte le mosse considerate accettabili</p>
        <div className="move-tags">
          {(data.mosse_candidate || []).map((m, i) => (
            <span key={i} className={`move-tag ${m === (data.mossa_migliore) ? 'best' : 'good'}`}>
              {m} {m === data.mossa_migliore && '★'}
              <button onClick={() => {
                const updated = data.mosse_candidate.filter((_, j) => j !== i)
                const wasB = data.mossa_migliore === m
                onUpdate({ mosse_candidate: updated, ...(wasB ? { mossa_migliore: updated[0] || '' } : {}) })
              }}>x</button>
            </span>
          ))}
        </div>
        <MoveInputHelper fen={stepContext ? (data.fen_aggiornata || lesson.fen) : lesson.fen}
          boardOrientation={boardOrientation} value=""
          onChange={(v) => {
            if (v && !(data.mosse_candidate || []).includes(v))
              onUpdate({ mosse_candidate: [...(data.mosse_candidate || []), v] })
          }} placeholder="Aggiungi mossa candidate..." />
      </div>

      <div className="admin-label">Mossa Migliore *
        <p className="admin-hint">Seleziona tra le candidate o digita</p>
        <select className="admin-select" value={data.mossa_migliore || ''}
          onChange={(e) => onUpdate({ mossa_migliore: e.target.value })}>
          <option value="">-- Scegli --</option>
          {(data.mosse_candidate || []).map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {stepContext && (
        <>
          <label className="admin-label">Feedback Positivo
            <input type="text" className="admin-input" value={data.feedback_positivo || ''}
              onChange={(e) => onUpdate({ feedback_positivo: e.target.value })} />
          </label>
          <label className="admin-label">Feedback Negativo
            <input type="text" className="admin-input" value={data.feedback_negativo || ''}
              onChange={(e) => onUpdate({ feedback_negativo: e.target.value })} />
          </label>
          <label className="admin-label">Feedback Generico
            <input type="text" className="admin-input" value={data.feedback || ''}
              onChange={(e) => onUpdate({ feedback: e.target.value })} placeholder="Buona mossa, ma c'era di meglio." />
          </label>
        </>
      )}
    </div>
  )

  // Editor per step in sequenza
  const renderStepEditor = (step, index) => {
    const onStepUpdate = (updates) => updateStep(index, updates)
    const stepType = step.tipo_step || (tipo === 'intent_sequenza' ? 'intent' : tipo === 'candidate_sequenza' ? 'candidate' : 'intent')

    return (
      <div className="step-editor-panel">
        {tipo === 'mista' && (
          <div className="step-type-selector">
            <label className="admin-label">Tipo Step
              <select className="admin-select" value={step.tipo_step || 'intent'}
                onChange={(e) => onStepUpdate({ tipo_step: e.target.value })}>
                <option value="intent">Intent</option>
                <option value="detective">Detective</option>
                <option value="candidate">Candidate</option>
              </select>
            </label>
          </div>
        )}

        <label className="admin-label">FEN Aggiornata (posizione per questo step)
          <input type="text" className="admin-input" value={step.fen_aggiornata || ''}
            onChange={(e) => onStepUpdate({ fen_aggiornata: e.target.value })}
            placeholder="Lascia vuoto per usare il FEN della lezione" />
        </label>

        {stepType === 'intent' && renderIntentEditor(step, onStepUpdate, true)}
        {stepType === 'detective' && renderDetectiveEditor(step, onStepUpdate, true)}
        {stepType === 'candidate' && renderCandidateEditor(step, onStepUpdate, true)}

        {/* Aiuti visivi contestuali per lo step */}
        <div className="step-visual-aids">
          <h4>Aiuti Visivi per questo Step</h4>
          <p className="admin-hint">Chunking e frecce mostrati con domanda/feedback</p>
          <VisualAidsEditor
            chunks={step.mostra_chunk_visivo || []}
            arrows={step.frecce_pattern || []}
            onChunksChange={(v) => onStepUpdate({ mostra_chunk_visivo: v })}
            onArrowsChange={(v) => onStepUpdate({ frecce_pattern: v })}
            fen={step.fen_aggiornata || lesson.fen}
            boardOrientation={boardOrientation}
          />
        </div>

        {/* Flag metacognitiva per lo step (sequenze miste) */}
        {tipo === 'mista' && (
          <div className="admin-toggle-row">
            <label className="admin-toggle">
              <input type="checkbox" checked={step.mostra_metacognitiva || false}
                onChange={(e) => onStepUpdate({ mostra_metacognitiva: e.target.checked })} />
              <span className="admin-toggle-label">Mostra domanda metacognitiva dopo questo step</span>
            </label>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="admin-step-editor">
      <div className="admin-main-layout">
        <div className="admin-step-content-col">
          {/* Editor per tipi singoli */}
          {!isSequence && (
            <>
              <div className="admin-form-section">
                <h3>Contenuto {tipo.charAt(0).toUpperCase() + tipo.slice(1)}</h3>
                {renderSingleEditor()}
              </div>

              {/* Aiuti visivi globali (per tipi singoli) */}
              <div className="admin-form-section">
                <h3>Aiuti Visivi</h3>
                <p className="admin-hint">Chunking e frecce mostrati sulla scacchiera dopo l'intent corretto</p>
                <VisualAidsEditor
                  chunks={lesson.parametri?.mostra_chunk_visivo || []}
                  arrows={lesson.parametri?.frecce_pattern || []}
                  onChunksChange={(v) => updateParametri({ mostra_chunk_visivo: v })}
                  onArrowsChange={(v) => updateParametri({ frecce_pattern: v })}
                  fen={lesson.fen}
                  boardOrientation={boardOrientation}
                />
              </div>
            </>
          )}

          {/* Editor per sequenze */}
          {isSequence && (
            <div className="admin-form-section">
              <div className="steps-header">
                <h3>Step della Sequenza ({(lesson.steps || []).length})</h3>
                <div className="steps-add-btns">
                  {tipo === 'mista' ? (
                    <>
                      <button className="admin-btn-sm" onClick={() => addStep('intent')}>+ Intent</button>
                      <button className="admin-btn-sm" onClick={() => addStep('detective')}>+ Detective</button>
                      <button className="admin-btn-sm" onClick={() => addStep('candidate')}>+ Candidate</button>
                    </>
                  ) : (
                    <button className="admin-btn-sm" onClick={() => addStep()}>+ Aggiungi Step</button>
                  )}
                </div>
              </div>

              <div className="steps-list">
                {(lesson.steps || []).map((step, i) => (
                  <div key={i} className={`step-accordion ${expandedStep === i ? 'expanded' : ''}`}>
                    <div className="step-accordion-header" onClick={() => setExpandedStep(expandedStep === i ? -1 : i)}>
                      <span className="step-number">Step {step.numero}</span>
                      {tipo === 'mista' && <span className="step-type-badge">{step.tipo_step}</span>}
                      <span className="step-preview-text">{step.domanda || step.descrizione_step || '(vuoto)'}</span>
                      <div className="step-actions">
                        <button className="step-action-btn" onClick={(e) => { e.stopPropagation(); moveStep(i, -1) }} disabled={i === 0}>&#8593;</button>
                        <button className="step-action-btn" onClick={(e) => { e.stopPropagation(); moveStep(i, 1) }} disabled={i === (lesson.steps || []).length - 1}>&#8595;</button>
                        <button className="step-action-btn danger" onClick={(e) => { e.stopPropagation(); removeStep(i) }}>&#10005;</button>
                      </div>
                    </div>
                    {expandedStep === i && renderStepEditor(step, i)}
                  </div>
                ))}
              </div>

              {(lesson.steps || []).length === 0 && (
                <div className="steps-empty">Nessuno step. Aggiungi il primo step per iniziare.</div>
              )}
            </div>
          )}
        </div>

        {/* Colonna destra: Profilassi + Metacognizione */}
        <div className="admin-side-col">
          <div className="admin-form-section">
            <h3>Profilassi</h3>
            <ProfilassiEditor parametri={lesson.parametri || {}} onUpdate={updateParametri} />
          </div>

          <div className="admin-form-section">
            <h3>Metacognizione</h3>
            <MetacognizioneEditor metacognizione={lesson.metacognizione} onChange={(v) => updateLesson({ metacognizione: v })} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminStepEditor
