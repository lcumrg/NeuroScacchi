import { useState, useRef, useCallback, useEffect } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { validateLesson } from '../utils/lessonValidator'
import { saveLesson } from '../utils/storageManager'
import AdminStepEditor from './AdminStepEditor'
import AdminPgnImport from './AdminPgnImport'
import AdminPreview from './AdminPreview'
import './AdminConsole.css'

const BOARD_SIZE = 400

const EMPTY_LESSON = {
  id: '',
  titolo: '',
  descrizione: '',
  autori: [''],
  tipo_modulo: 'intent',
  categoria: 'aperture',
  difficolta: 'facile',
  fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
  parametri: {
    tempo_freeze: 1500,
    orientamento_scacchiera: 'white',
    usa_profilassi: false,
    mostra_chunk_visivo: [],
    frecce_pattern: []
  },
  domanda: '',
  opzioni_risposta: ['', ''],
  risposta_corretta: '',
  mosse_consentite: [],
  mosse_corrette: [],
  modalita_detective: { domanda: '', risposta_corretta_casa: '', feedback_positivo: '', feedback_negativo: '' },
  mosse_candidate: [],
  mossa_migliore: '',
  steps: [],
  feedback_positivo: '',
  feedback_negativo: '',
  metacognizione: { domande: [], trigger: 'post_intent' }
}

const TEMPLATES = [
  {
    id: 'intent_base', nome: 'Intent Base', desc: 'Domanda strategica + mossa', icon: '🎯',
    data: {
      tipo_modulo: 'intent',
      parametri: { tempo_freeze: 1500, orientamento_scacchiera: 'white', usa_profilassi: false, mostra_chunk_visivo: [], frecce_pattern: [] },
      opzioni_risposta: ['Opzione attacco', 'Opzione sviluppo', 'Opzione difesa'],
      domanda: 'Quale piano strategico scegli?',
      feedback_positivo: 'Ottimo! Scelta corretta.',
      feedback_negativo: 'Non proprio. Rifletti meglio.'
    }
  },
  {
    id: 'intent_profilassi', nome: 'Intent + Profilassi', desc: 'Con controllo profilassi e fiducia', icon: '🛡️',
    data: {
      tipo_modulo: 'intent',
      parametri: {
        tempo_freeze: 2000, orientamento_scacchiera: 'white', usa_profilassi: true, mostra_chunk_visivo: [], frecce_pattern: [],
        profilassi: {
          domanda_fiducia: 'Come ti senti su questa mossa?',
          opzioni_fiducia: [
            { id: 'sicuro', label: 'Sono sicuro', icon: '💪', color: '#4CAF50' },
            { id: 'dubbio', label: 'Ho un dubbio', icon: '🤔', color: '#FF9800' },
            { id: 'non_so', label: 'Non lo so', icon: '❓', color: '#F44336' }
          ],
          domande_verifica: [
            { id: 'king', text: 'Il Re e sotto attacco?', icon: '♔' },
            { id: 'threats', text: 'Ci sono pezzi minacciati?', icon: '⚔️' }
          ]
        }
      },
      opzioni_risposta: ['Opzione attacco', 'Opzione sviluppo', 'Opzione difesa'],
      domanda: 'Quale piano strategico scegli?',
      feedback_positivo: 'Ottimo!', feedback_negativo: 'Rifletti meglio.'
    }
  },
  {
    id: 'detective_base', nome: 'Detective', desc: 'Trova la casa chiave', icon: '🔍',
    data: {
      tipo_modulo: 'detective',
      parametri: { tempo_freeze: 1500, orientamento_scacchiera: 'white', usa_profilassi: false, mostra_chunk_visivo: [], frecce_pattern: [] },
      modalita_detective: { domanda: 'Quale casa e il punto debole?', risposta_corretta_casa: '', feedback_positivo: 'Esatto!', feedback_negativo: 'Riprova!' },
      feedback_positivo: 'Ottimo!', feedback_negativo: 'Riprova.'
    }
  },
  {
    id: 'candidate_base', nome: 'Candidate', desc: 'Identifica mosse candidate', icon: '♟️',
    data: {
      tipo_modulo: 'candidate',
      parametri: { tempo_freeze: 2000, orientamento_scacchiera: 'white', num_candidate: 2, usa_profilassi: false, mostra_chunk_visivo: [], frecce_pattern: [] },
      mosse_candidate: [], mossa_migliore: '',
      feedback_positivo: 'Eccellente!', feedback_negativo: 'Riprova!'
    }
  },
  {
    id: 'mista_base', nome: 'Sequenza Mista', desc: 'Intent + Detective + Candidate', icon: '🔀',
    data: {
      tipo_modulo: 'mista',
      parametri: { tempo_freeze: 2000, orientamento_scacchiera: 'white', usa_profilassi: false, mostra_chunk_visivo: [], frecce_pattern: [] },
      steps: [{
        numero: 1, tipo_step: 'intent', fen_aggiornata: '',
        domanda: 'Quale piano scegli?', opzioni_risposta: ['Opzione 1', 'Opzione 2', 'Opzione 3'],
        risposta_corretta: '', mosse_consentite: [], mosse_corrette: [],
        feedback: '', feedback_negativo: '', mostra_chunk_visivo: [], frecce_pattern: []
      }],
      feedback_positivo: 'Sequenza completata!', feedback_negativo: 'Riprova.'
    }
  },
  {
    id: 'intent_sequenza', nome: 'Sequenza Intent', desc: 'Piu step Intent', icon: '📋',
    data: {
      tipo_modulo: 'intent_sequenza',
      parametri: { tempo_freeze: 1500, orientamento_scacchiera: 'white', usa_profilassi: false, mostra_chunk_visivo: [], frecce_pattern: [] },
      steps: [{
        numero: 1, fen_aggiornata: '', domanda: 'Step 1',
        opzioni_risposta: ['Opzione 1', 'Opzione 2'], risposta_corretta: '',
        mosse_consentite: [], mosse_corrette: [], feedback: '', feedback_negativo: '',
        mostra_chunk_visivo: [], frecce_pattern: []
      }],
      feedback_positivo: 'Completata!', feedback_negativo: 'Riprova.'
    }
  }
]

function AdminConsole({ onSave, onClose, editLesson = null }) {
  const [lesson, setLesson] = useState(() => {
    if (editLesson) return JSON.parse(JSON.stringify(editLesson))
    return JSON.parse(JSON.stringify(EMPTY_LESSON))
  })
  const [activeTab, setActiveTab] = useState('metadati')
  const [validation, setValidation] = useState(null)
  const [fenInput, setFenInput] = useState(lesson.fen)
  const [fenError, setFenError] = useState('')
  const [boardOrientation, setBoardOrientation] = useState(lesson.parametri?.orientamento_scacchiera || 'white')
  const [showTemplates, setShowTemplates] = useState(!editLesson)
  const [savedFeedback, setSavedFeedback] = useState('')

  const gameRef = useRef(new Chess())

  useEffect(() => {
    try { gameRef.current.load(lesson.fen) } catch (e) { /* */ }
  }, [lesson.fen])

  useEffect(() => {
    setValidation(validateLesson(lesson))
  }, [lesson])

  const updateLesson = useCallback((updates) => {
    setLesson(prev => {
      const next = { ...prev }
      for (const [key, value] of Object.entries(updates)) {
        if (key === 'parametri' && typeof value === 'object') {
          next.parametri = { ...prev.parametri, ...value }
        } else {
          next[key] = value
        }
      }
      return next
    })
  }, [])

  const updateParametri = useCallback((updates) => {
    setLesson(prev => ({ ...prev, parametri: { ...prev.parametri, ...updates } }))
  }, [])

  const handleFenChange = (newFen) => {
    setFenInput(newFen)
    try {
      new Chess(newFen)
      setFenError('')
      gameRef.current.load(newFen)
      updateLesson({ fen: newFen })
    } catch (e) {
      setFenError('FEN non valida')
    }
  }

  const handleBoardDrop = (sourceSquare, targetSquare) => {
    try {
      const move = gameRef.current.move({ from: sourceSquare, to: targetSquare, promotion: 'q' })
      if (move) {
        const newFen = gameRef.current.fen()
        setFenInput(newFen)
        updateLesson({ fen: newFen })
        return true
      }
    } catch (e) { /* */ }
    return false
  }

  const applyTemplate = (template) => {
    const newLesson = {
      ...JSON.parse(JSON.stringify(EMPTY_LESSON)),
      ...JSON.parse(JSON.stringify(template.data)),
      id: `lezione_${Date.now()}`,
      fen: lesson.fen
    }
    setLesson(newLesson)
    setShowTemplates(false)
    setActiveTab('metadati')
  }

  const generateId = (titolo) => {
    return titolo.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `lezione_${Date.now()}`
  }

  const handleSave = () => {
    const result = validateLesson(lesson)
    setValidation(result)
    if (!result.valid) return
    const finalLesson = { ...lesson }
    if (!finalLesson.id) finalLesson.id = generateId(finalLesson.titolo)
    saveLesson(finalLesson)
    if (onSave) onSave(finalLesson)
    setSavedFeedback('Lezione salvata!')
    setTimeout(() => setSavedFeedback(''), 2000)
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(lesson, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${lesson.id || 'lezione'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleUsePgnPosition = (fen) => {
    handleFenChange(fen)
    setActiveTab('metadati')
  }

  return (
    <div className="admin-console">
      <div className="admin-header">
        <div className="admin-header-left">
          <button className="admin-back-btn" onClick={onClose}>&#8592; Torna alle lezioni</button>
          <h2>{editLesson ? 'Modifica Lezione' : 'Crea Nuova Lezione'}</h2>
        </div>
        <div className="admin-header-right">
          {savedFeedback && <span className="admin-saved-feedback">{savedFeedback}</span>}
          <button className="admin-btn admin-btn-export" onClick={handleExport}>Scarica JSON</button>
          <button className="admin-btn admin-btn-save" onClick={handleSave} disabled={!validation?.valid}>
            Salva Lezione
          </button>
        </div>
      </div>

      {showTemplates && (
        <div className="admin-templates">
          <div className="admin-templates-header">
            <h3>Scegli un template</h3>
            <button className="admin-btn-text" onClick={() => setShowTemplates(false)}>Inizia da zero</button>
          </div>
          <div className="admin-templates-grid">
            {TEMPLATES.map(t => (
              <button key={t.id} className="admin-template-card" onClick={() => applyTemplate(t)}>
                <span className="template-icon">{t.icon}</span>
                <strong>{t.nome}</strong>
                <span className="template-desc">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="admin-tabs">
        {['metadati', 'steps', 'pgn', 'preview'].map(tab => (
          <button key={tab} className={`admin-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab === 'metadati' && 'Metadati & Posizione'}
            {tab === 'steps' && 'Step & Contenuto'}
            {tab === 'pgn' && 'Import PGN'}
            {tab === 'preview' && 'Anteprima'}
          </button>
        ))}
      </div>

      {validation && (
        <div className={`admin-validation-bar ${validation.valid ? 'valid' : 'invalid'}`}>
          <span>{validation.valid ? `Lezione valida${validation.warnings.length > 0 ? ` (${validation.warnings.length} avvisi)` : ''}` : `${validation.errors.length} errori`}</span>
          {!validation.valid && (
            <div className="admin-validation-errors">
              {validation.errors.map((err, i) => <span key={i} className="admin-error-chip">{err}</span>)}
            </div>
          )}
          {validation.warnings.length > 0 && (
            <div className="admin-validation-warnings">
              {validation.warnings.map((w, i) => <span key={i} className="admin-warning-chip">{w}</span>)}
            </div>
          )}
        </div>
      )}

      {activeTab === 'metadati' && (
        <div className="admin-main-layout">
          <div className="admin-board-col">
            <div className="admin-board-section">
              <h3>Posizione</h3>
              <div className="admin-fen-input-row">
                <input type="text" className={`admin-fen-input ${fenError ? 'error' : ''}`} value={fenInput} onChange={(e) => handleFenChange(e.target.value)} placeholder="Inserisci FEN..." />
                <button className="admin-btn-sm" onClick={() => handleFenChange('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')} title="Posizione iniziale">Reset</button>
              </div>
              {fenError && <span className="admin-fen-error">{fenError}</span>}
              <div className="admin-board-wrapper">
                <Chessboard position={lesson.fen} onPieceDrop={handleBoardDrop} boardWidth={BOARD_SIZE} boardOrientation={boardOrientation}
                  customBoardStyle={{ borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}
                  customLightSquareStyle={{ backgroundColor: 'var(--square-light)' }}
                  customDarkSquareStyle={{ backgroundColor: 'var(--square-dark)' }}
                />
              </div>
              <div className="admin-board-controls">
                <button className={`admin-btn-sm ${boardOrientation === 'white' ? 'active' : ''}`}
                  onClick={() => { setBoardOrientation('white'); updateParametri({ orientamento_scacchiera: 'white' }) }}>Bianco</button>
                <button className={`admin-btn-sm ${boardOrientation === 'black' ? 'active' : ''}`}
                  onClick={() => { setBoardOrientation('black'); updateParametri({ orientamento_scacchiera: 'black' }) }}>Nero</button>
              </div>
            </div>
          </div>

          <div className="admin-form-col">
            <div className="admin-form-section">
              <h3>Informazioni Lezione</h3>
              <label className="admin-label">Titolo *
                <input type="text" className="admin-input" value={lesson.titolo} onChange={(e) => updateLesson({ titolo: e.target.value })} placeholder="Es: Pensa prima di muovere" />
              </label>
              <label className="admin-label">ID (auto-generato se vuoto)
                <input type="text" className="admin-input" value={lesson.id} onChange={(e) => updateLesson({ id: e.target.value })} placeholder="Es: lezione_01" />
              </label>
              <label className="admin-label">Descrizione
                <textarea className="admin-textarea" value={lesson.descrizione} onChange={(e) => updateLesson({ descrizione: e.target.value })} placeholder="Descrivi la lezione..." rows={3} />
              </label>
              <div className="admin-row">
                <label className="admin-label admin-label-half">Tipo Modulo *
                  <select className="admin-select" value={lesson.tipo_modulo} onChange={(e) => updateLesson({ tipo_modulo: e.target.value })}>
                    <option value="intent">Intent</option>
                    <option value="detective">Detective</option>
                    <option value="candidate">Candidate</option>
                    <option value="intent_sequenza">Sequenza Intent</option>
                    <option value="candidate_sequenza">Sequenza Candidate</option>
                    <option value="mista">Sequenza Mista</option>
                  </select>
                </label>
                <label className="admin-label admin-label-half">Categoria
                  <select className="admin-select" value={lesson.categoria || 'altro'} onChange={(e) => updateLesson({ categoria: e.target.value })}>
                    <option value="aperture">Aperture</option>
                    <option value="mediogioco">Mediogioco</option>
                    <option value="finali">Finali</option>
                    <option value="tattica">Tattica</option>
                    <option value="altro">Altro</option>
                  </select>
                </label>
              </div>
              <div className="admin-row">
                <label className="admin-label admin-label-half">Difficolta
                  <select className="admin-select" value={lesson.difficolta || 'facile'} onChange={(e) => updateLesson({ difficolta: e.target.value })}>
                    <option value="facile">Facile</option>
                    <option value="medio">Medio</option>
                    <option value="difficile">Difficile</option>
                  </select>
                </label>
                <label className="admin-label admin-label-half">Tempo Freeze (ms)
                  <input type="number" className="admin-input" value={lesson.parametri?.tempo_freeze || 1500} onChange={(e) => updateParametri({ tempo_freeze: parseInt(e.target.value) || 1500 })} min={0} step={500} />
                </label>
              </div>
              <label className="admin-label">Autori
                <input type="text" className="admin-input" value={(lesson.autori || []).join(', ')} onChange={(e) => updateLesson({ autori: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Es: Coach Marco" />
              </label>
            </div>
            <div className="admin-form-section">
              <h3>Feedback</h3>
              <label className="admin-label">Feedback Positivo
                <textarea className="admin-textarea" value={lesson.feedback_positivo} onChange={(e) => updateLesson({ feedback_positivo: e.target.value })} placeholder="Messaggio per risposta corretta..." rows={2} />
              </label>
              <label className="admin-label">Feedback Negativo
                <textarea className="admin-textarea" value={lesson.feedback_negativo} onChange={(e) => updateLesson({ feedback_negativo: e.target.value })} placeholder="Messaggio per risposta sbagliata..." rows={2} />
              </label>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'steps' && (
        <AdminStepEditor lesson={lesson} updateLesson={updateLesson} updateParametri={updateParametri} boardOrientation={boardOrientation} gameRef={gameRef} />
      )}

      {activeTab === 'pgn' && (
        <AdminPgnImport onUsePosition={handleUsePgnPosition} />
      )}

      {activeTab === 'preview' && (
        <AdminPreview lesson={lesson} />
      )}
    </div>
  )
}

export default AdminConsole
