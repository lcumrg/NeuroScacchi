import { useState, useRef, useEffect } from 'react'
import { sendMessage, extractPositions } from '../utils/aiService'
import { getCognitiveProfile } from '../utils/storage'
import { validatePosition } from '../engine/positionSchema'
import { initStockfish, evaluate, isReady, destroy } from '../engine/stockfishService'

const QUICK_PROMPTS = [
  { label: 'Genera posizioni', text: 'Generami 5 posizioni tattiche di difficolta crescente (da 3 a 7), con temi misti. Per ogni posizione includi una spiegazione didattica.' },
  { label: 'Finali di torre', text: 'Generami 5 posizioni sui finali di torre, difficolta media (4-6). Ogni posizione deve avere un concetto didattico chiaro.' },
  { label: 'Percorso aperture', text: 'Crea un percorso di studio sulle aperture per un giocatore 1200 Elo con profilo impulsivo. 8-10 posizioni con progressione logica.' },
  { label: 'Analizza PGN', text: 'Ti incollo un PGN. Identifica i 3-5 momenti critici e genera posizioni di studio per ciascuno.\n\n[Incolla qui il PGN]' },
  { label: 'Consulenza ADHD', text: 'Uno studente con alta impulsivita e bassa tolleranza alla frustrazione continua a sbagliare i finali sotto pressione temporale. Che strategie di allenamento suggerisci?' },
]

export default function CoachAIPage({ onBack }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [validating, setValidating] = useState(false)
  const [validationResults, setValidationResults] = useState({}) // messageIndex -> results
  const [savedPositions, setSavedPositions] = useState({}) // positionId -> true
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  const handleSend = async (text) => {
    const messageText = text || input.trim()
    if (!messageText || loading) return

    setInput('')
    setError(null)

    const userMessage = { role: 'user', content: messageText }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setLoading(true)

    try {
      const profile = getCognitiveProfile()
      const reply = await sendMessage(
        newMessages.map(m => ({ role: m.role, content: m.content })),
        profile
      )
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Valida posizioni estratte da un messaggio con Stockfish
  const handleValidate = async (messageIndex) => {
    const msg = messages[messageIndex]
    if (!msg || msg.role !== 'assistant') return

    const positions = extractPositions(msg.content)
    if (positions.length === 0) {
      setValidationResults(prev => ({
        ...prev,
        [messageIndex]: { error: 'Nessuna posizione JSON trovata in questo messaggio.' }
      }))
      return
    }

    setValidating(true)
    const results = []

    try {
      // Inizializza Stockfish se necessario
      if (!isReady()) {
        await initStockfish()
      }

      for (const pos of positions) {
        const result = { position: pos, schemaValid: true, schemaErrors: [], stockfishOk: null, stockfishBest: null }

        // Validazione schema
        const schemaResult = validatePosition(pos)
        result.schemaValid = schemaResult.valid
        result.schemaErrors = schemaResult.errors

        // Validazione Stockfish (solo se schema valido)
        if (schemaResult.valid && pos.solutionMoves?.[0]) {
          try {
            const evalResult = await evaluate(pos.fen, 16)
            const bestMove = evalResult.bestMove
            const solutionMove = pos.solutionMoves[0]

            result.stockfishBest = bestMove
            result.stockfishOk = bestMove === solutionMove

            // Se diversa, controlla se comunque buona (deltaEval piccolo)
            if (!result.stockfishOk) {
              // Valuta la mossa proposta
              const afterSolution = await evaluate(pos.fen + ' moves ' + solutionMove, 16)
              const afterBest = await evaluate(pos.fen + ' moves ' + bestMove, 16)
              const delta = Math.abs((-afterSolution.eval) - (-afterBest.eval))
              result.stockfishDelta = delta
              result.stockfishAcceptable = delta < 0.5 // meno di mezzo pedone di differenza
            }
          } catch (err) {
            result.stockfishError = err.message
          }
        }

        results.push(result)
      }
    } catch (err) {
      setValidationResults(prev => ({
        ...prev,
        [messageIndex]: { error: 'Errore Stockfish: ' + err.message }
      }))
      setValidating(false)
      return
    }

    setValidationResults(prev => ({ ...prev, [messageIndex]: { results } }))
    setValidating(false)
  }

  // Salva una posizione nel database (positions.json via localStorage per ora)
  const handleSavePosition = (position) => {
    try {
      const stored = JSON.parse(localStorage.getItem('ns2_ai_positions') || '[]')
      // Evita duplicati
      if (stored.some(p => p.id === position.id)) {
        setSavedPositions(prev => ({ ...prev, [position.id]: true }))
        return
      }
      stored.push({ ...position, origin: 'coach', createdAt: Date.now() })
      localStorage.setItem('ns2_ai_positions', JSON.stringify(stored))
      setSavedPositions(prev => ({ ...prev, [position.id]: true }))
    } catch (err) {
      setError('Errore salvataggio: ' + err.message)
    }
  }

  const handleClearChat = () => {
    setMessages([])
    setValidationResults({})
    setSavedPositions({})
    setError(null)
  }

  const hasPositions = (content) => {
    return content && content.includes('```json')
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>&larr; Home</button>
        <h2 style={styles.title}>Coach IA</h2>
        <div style={styles.headerActions}>
          {messages.length > 0 && (
            <button style={styles.clearBtn} onClick={handleClearChat}>Nuova chat</button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messagesArea}>
        {messages.length === 0 && !loading && (
          <div style={styles.welcome}>
            <div style={styles.welcomeIcon}>&#9812;</div>
            <h3 style={styles.welcomeTitle}>Agente IA Coach</h3>
            <p style={styles.welcomeText}>
              Chiedimi di generare posizioni, creare percorsi di studio, analizzare partite PGN
              o suggerire strategie di allenamento personalizzate.
            </p>
            <div style={styles.quickPrompts}>
              {QUICK_PROMPTS.map((qp, i) => (
                <button
                  key={i}
                  style={styles.quickBtn}
                  onClick={() => {
                    if (qp.text.includes('[Incolla qui il PGN]')) {
                      setInput(qp.text)
                      textareaRef.current?.focus()
                    } else {
                      handleSend(qp.text)
                    }
                  }}
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={msg.role === 'user' ? styles.userMsg : styles.assistantMsg}>
            <div style={styles.msgLabel}>{msg.role === 'user' ? 'Tu' : 'IA Coach'}</div>
            <div style={styles.msgContent}>
              <MessageContent content={msg.content} />
            </div>
            {/* Azioni per messaggi dell'assistente con posizioni */}
            {msg.role === 'assistant' && hasPositions(msg.content) && (
              <div style={styles.msgActions}>
                <button
                  style={styles.validateBtn}
                  onClick={() => handleValidate(i)}
                  disabled={validating}
                >
                  {validating ? 'Validazione...' : 'Valida con Stockfish'}
                </button>
              </div>
            )}
            {/* Risultati validazione */}
            {validationResults[i] && (
              <ValidationResults
                data={validationResults[i]}
                onSave={handleSavePosition}
                savedPositions={savedPositions}
              />
            )}
          </div>
        ))}

        {loading && (
          <div style={styles.assistantMsg}>
            <div style={styles.msgLabel}>IA Coach</div>
            <div style={styles.loadingDots}>
              <span style={styles.dot}>.</span>
              <span style={{ ...styles.dot, animationDelay: '0.2s' }}>.</span>
              <span style={{ ...styles.dot, animationDelay: '0.4s' }}>.</span>
            </div>
          </div>
        )}

        {error && (
          <div style={styles.errorBox}>
            <strong>Errore:</strong> {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={styles.inputArea}>
        <textarea
          ref={textareaRef}
          style={styles.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scrivi al tuo agente IA..."
          rows={1}
          disabled={loading}
        />
        <button
          style={{
            ...styles.sendBtn,
            opacity: (!input.trim() || loading) ? 0.5 : 1,
          }}
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
        >
          Invia
        </button>
      </div>
    </div>
  )
}

// --- Sub-components ---

function MessageContent({ content }) {
  // Rendering semplice con supporto per blocchi di codice e markdown basico
  const parts = content.split(/(```[\s\S]*?```)/g)

  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const lines = part.split('\n')
      const lang = lines[0].replace('```', '').trim()
      const code = lines.slice(1, -1).join('\n')
      return (
        <pre key={i} style={styles.codeBlock}>
          {lang && <div style={styles.codeLang}>{lang}</div>}
          <code>{code}</code>
        </pre>
      )
    }
    // Markdown basico: bold, italic, headers
    return (
      <div key={i} style={{ whiteSpace: 'pre-wrap' }}>
        {part.split('\n').map((line, j) => {
          if (line.startsWith('### ')) {
            return <h4 key={j} style={{ margin: '12px 0 4px', fontSize: 15, fontWeight: 700 }}>{line.slice(4)}</h4>
          }
          if (line.startsWith('## ')) {
            return <h3 key={j} style={{ margin: '14px 0 6px', fontSize: 16, fontWeight: 700 }}>{line.slice(3)}</h3>
          }
          if (line.startsWith('# ')) {
            return <h2 key={j} style={{ margin: '16px 0 8px', fontSize: 18, fontWeight: 700 }}>{line.slice(2)}</h2>
          }
          // Bold
          const formatted = line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
          if (formatted !== line) {
            return <p key={j} style={{ margin: '2px 0' }} dangerouslySetInnerHTML={{ __html: formatted }} />
          }
          if (line.trim() === '') return <br key={j} />
          return <p key={j} style={{ margin: '2px 0' }}>{line}</p>
        })}
      </div>
    )
  })
}

function ValidationResults({ data, onSave, savedPositions }) {
  if (data.error) {
    return <div style={styles.validationError}>{data.error}</div>
  }

  return (
    <div style={styles.validationBox}>
      <div style={styles.validationTitle}>Risultati validazione</div>
      {data.results.map((r, i) => (
        <div key={i} style={styles.validationItem}>
          <div style={styles.validationHeader}>
            <strong>{r.position.title || r.position.id}</strong>
            <span style={{
              ...styles.validationBadge,
              background: getValidationColor(r),
            }}>
              {getValidationLabel(r)}
            </span>
          </div>

          {!r.schemaValid && (
            <div style={styles.validationDetail}>
              Schema: {r.schemaErrors.join(', ')}
            </div>
          )}

          {r.stockfishOk === false && (
            <div style={styles.validationDetail}>
              Stockfish suggerisce: <code>{r.stockfishBest}</code> (soluzione proposta: <code>{r.position.solutionMoves?.[0]}</code>)
              {r.stockfishAcceptable && ' — differenza trascurabile, accettabile'}
              {!r.stockfishAcceptable && r.stockfishDelta !== undefined && ` — delta: ${r.stockfishDelta.toFixed(2)} pedoni`}
            </div>
          )}

          {r.stockfishError && (
            <div style={styles.validationDetail}>Errore Stockfish: {r.stockfishError}</div>
          )}

          {/* Bottone salva se valida */}
          {r.schemaValid && (r.stockfishOk || r.stockfishAcceptable) && (
            <button
              style={{
                ...styles.saveBtn,
                opacity: savedPositions[r.position.id] ? 0.5 : 1,
              }}
              onClick={() => onSave(r.position)}
              disabled={savedPositions[r.position.id]}
            >
              {savedPositions[r.position.id] ? 'Salvata' : 'Salva posizione'}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

function getValidationColor(r) {
  if (!r.schemaValid) return '#FFCDD2'
  if (r.stockfishOk) return '#C8E6C9'
  if (r.stockfishAcceptable) return '#FFF9C4'
  if (r.stockfishOk === false) return '#FFCDD2'
  return '#E0E0E0'
}

function getValidationLabel(r) {
  if (!r.schemaValid) return 'Schema non valido'
  if (r.stockfishOk) return 'Validata'
  if (r.stockfishAcceptable) return 'Accettabile'
  if (r.stockfishOk === false) return 'Mossa sub-ottimale'
  return 'Da verificare'
}

// --- Styles ---

const styles = {
  container: {
    maxWidth: 800,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 60px)',
    padding: '0 16px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px 0',
    borderBottom: '1px solid #E0E0E0',
  },
  backBtn: {
    background: 'none',
    border: '1px solid #E0E0E0',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: 14,
    color: '#546E7A',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#212121',
    margin: 0,
    flex: 1,
  },
  headerActions: {
    display: 'flex',
    gap: 8,
  },
  clearBtn: {
    background: '#F5F5F5',
    border: '1px solid #E0E0E0',
    borderRadius: 8,
    padding: '6px 14px',
    fontSize: 13,
    color: '#546E7A',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  welcome: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  welcomeIcon: { fontSize: 48, marginBottom: 12 },
  welcomeTitle: { fontSize: 22, fontWeight: 700, color: '#212121', margin: '0 0 8px' },
  welcomeText: { fontSize: 15, color: '#546E7A', maxWidth: 480, margin: '0 auto 20px' },
  quickPrompts: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  quickBtn: {
    background: '#E8EAF6',
    border: '1px solid #C5CAE9',
    borderRadius: 20,
    padding: '8px 16px',
    fontSize: 14,
    color: '#283593',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 500,
    transition: 'all 0.15s',
  },
  userMsg: {
    alignSelf: 'flex-end',
    background: '#E8EAF6',
    borderRadius: '16px 16px 4px 16px',
    padding: '10px 16px',
    maxWidth: '80%',
  },
  assistantMsg: {
    alignSelf: 'flex-start',
    background: '#FAFBFC',
    border: '1px solid #E0E0E0',
    borderRadius: '16px 16px 16px 4px',
    padding: '10px 16px',
    maxWidth: '90%',
  },
  msgLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#90A4AE',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  msgContent: {
    fontSize: 15,
    lineHeight: 1.5,
    color: '#212121',
  },
  msgActions: {
    marginTop: 8,
    display: 'flex',
    gap: 8,
  },
  validateBtn: {
    background: '#FFF8E1',
    border: '1px solid #FFE082',
    borderRadius: 8,
    padding: '6px 14px',
    fontSize: 13,
    color: '#F57F17',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 600,
  },
  loadingDots: {
    display: 'flex',
    gap: 2,
    fontSize: 24,
    color: '#90A4AE',
  },
  dot: {
    animation: 'blink 1s infinite',
  },
  errorBox: {
    background: '#FFEBEE',
    border: '1px solid #EF9A9A',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 14,
    color: '#C62828',
  },
  inputArea: {
    display: 'flex',
    gap: 8,
    padding: '12px 0 20px',
    borderTop: '1px solid #E0E0E0',
    alignItems: 'flex-end',
  },
  textarea: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid #E0E0E0',
    borderRadius: 12,
    fontSize: 15,
    fontFamily: 'inherit',
    resize: 'none',
    outline: 'none',
    lineHeight: 1.4,
    maxHeight: 200,
  },
  sendBtn: {
    padding: '10px 20px',
    background: '#283593',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  codeBlock: {
    background: '#263238',
    color: '#ECEFF1',
    borderRadius: 8,
    padding: '12px 16px',
    fontSize: 13,
    fontFamily: 'monospace',
    overflowX: 'auto',
    margin: '8px 0',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  codeLang: {
    fontSize: 10,
    color: '#78909C',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  validationBox: {
    marginTop: 10,
    border: '1px solid #E0E0E0',
    borderRadius: 8,
    padding: 12,
    background: '#FAFBFC',
  },
  validationTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#546E7A',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  validationItem: {
    padding: '8px 0',
    borderBottom: '1px solid #F0F0F0',
  },
  validationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  validationBadge: {
    padding: '2px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
  },
  validationDetail: {
    fontSize: 13,
    color: '#78909C',
    marginTop: 4,
  },
  validationError: {
    background: '#FFEBEE',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    color: '#C62828',
    marginTop: 8,
  },
  saveBtn: {
    marginTop: 6,
    background: '#E8F5E9',
    border: '1px solid #A5D6A7',
    borderRadius: 8,
    padding: '4px 12px',
    fontSize: 13,
    color: '#2E7D32',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 600,
  },
}
