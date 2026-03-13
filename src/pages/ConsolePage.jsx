import { useState, useCallback } from 'react'
import Chessboard from '../components/Chessboard.jsx'
import StockfishPanel from '../components/StockfishPanel.jsx'
import LessonViewer from '../components/LessonViewer.jsx'
import { INITIAL_FEN, legalDests, makeMove, turnColor, isCheck, kingSquareInCheck, parseFen } from '../engine/chessService.js'
import { generateLesson, refineLesson } from '../engine/aiService.js'
import { analyzeLesson } from '../engine/sfAnalysisService.js'
import { saveDraftLesson, markAsApproved } from '../engine/lessonStore.js'
import './ConsolePage.css'

export default function ConsolePage() {
  // Board state
  const [fen, setFen] = useState(INITIAL_FEN)
  const [fenInput, setFenInput] = useState(INITIAL_FEN)
  const [lastMove, setLastMove] = useState(null)

  // Settings form state
  const [tema, setTema] = useState('')
  const [livello, setLivello] = useState('')
  const [ratingMin, setRatingMin] = useState('')
  const [ratingMax, setRatingMax] = useState('')
  const [obiettivo, setObiettivo] = useState('')

  // Lesson generation state
  const [generating, setGenerating] = useState(false)
  const [lessonResult, setLessonResult] = useState(null)
  const [lessonError, setLessonError] = useState(null)
  const [lessonValidation, setLessonValidation] = useState(null)
  const [sfValidation, setSfValidation] = useState(null)
  const [selectedStepIndex, setSelectedStepIndex] = useState(null)
  const [saveStatus, setSaveStatus] = useState(null) // 'saved' | 'approved' | null
  const [refining, setRefining] = useState(false)
  const [chatHistory, setChatHistory] = useState([]) // history per refineLesson
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-6')

  // Chat state
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState([])

  const turn = turnColor(fen)
  const dests = legalDests(fen)
  const checkSquare = kingSquareInCheck(fen)

  const handleMove = useCallback((from, to) => {
    const result = makeMove(fen, { from, to })
    if (!result.valid) return
    setFen(result.fen)
    setFenInput(result.fen)
    setLastMove([from, to])
  }, [fen])

  const handleFenChange = useCallback((e) => {
    const newFen = e.target.value
    setFenInput(newFen)
  }, [])

  const handleFenSubmit = useCallback((e) => {
    if (e.key === 'Enter') {
      try {
        // Validate FEN by attempting to parse it
        parseFen(fenInput)
        setFen(fenInput)
        setLastMove(null)
      } catch {
        // Invalid FEN — do nothing, user can keep editing
      }
    }
  }, [fenInput])

  // Validates moves in the lesson using chessService legalDests
  const validateMovesWithChessService = useCallback((lesson) => {
    if (!lesson?.steps) return
    const result = {}

    lesson.steps.forEach((step, index) => {
      const stepFen = step.fen
      if (!stepFen) return

      let destinations
      try {
        destinations = legalDests(stepFen)
      } catch {
        return
      }

      // Collect all UCI moves that need to be validated for this step
      const movesToCheck = [
        ...(step.correctMoves || []),
        ...(step.allowedMoves || []),
        ...(step.candidateMoves
          ? step.candidateMoves.map(m => (typeof m === 'string' ? m : m.move)).filter(Boolean)
          : []),
        ...(step.bestMove ? [step.bestMove] : []),
      ]

      if (movesToCheck.length === 0) return

      const illegal = []
      for (const uci of movesToCheck) {
        if (typeof uci !== 'string' || uci.length < 4) continue
        const from = uci.slice(0, 2)
        const to = uci.slice(2, 4)
        const fromDests = destinations.get(from)
        if (!fromDests || !fromDests.includes(to)) {
          illegal.push(uci)
        }
      }

      if (illegal.length > 0) {
        result[index] = { illegalMoves: illegal }
      }
    })

    setSfValidation(result)
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!tema || !livello) return

    setGenerating(true)
    setLessonError(null)
    setLessonResult(null)
    setLessonValidation(null)
    setSfValidation(null)
    setSelectedStepIndex(null)
    setSaveStatus(null)
    setChatHistory([])

    // Helper to append a progress/system message
    const addMsg = (role, content) =>
      setMessages(prev => [...prev, { role, content }])

    addMsg('system', `⟳ Recupero puzzle candidati per tema: ${tema} — livello ${livello}…`)

    try {
      await new Promise(resolve => setTimeout(resolve, 250)) // let UI render
      addMsg('system', `⟳ Contatto modello IA [${selectedModel}]…`)

      const result = await generateLesson({
        tema,
        livello,
        ratingMin: ratingMin ? Number(ratingMin) : undefined,
        ratingMax: ratingMax ? Number(ratingMax) : undefined,
        obiettivo: obiettivo || undefined,
        fenPartenza: fen !== INITIAL_FEN ? fen : undefined,
        model: selectedModel,
      })

      addMsg('system', '⟳ Parsing e validazione schema…')
      await new Promise(resolve => setTimeout(resolve, 150))

      const { lesson, validation, usage } = result
      setLessonResult(lesson)
      setLessonValidation(validation)
      addMsg('system', '✓ Lezione generata')
      addMsg('assistant',
        `Lezione generata: "${lesson.title || lesson.titolo || tema}"\n${lesson.steps?.length || 0} step — ${usage?.input_tokens || '?'} token input, ${usage?.output_tokens || '?'} token output`
      )
      validateMovesWithChessService(lesson)

      // Analisi Stockfish asincrona — non blocca la UI
      addMsg('system', '⟳ Analisi Stockfish in corso…')
      try {
        const sfResults = await analyzeLesson(lesson, {
          depth: 15,
          onProgress: ({ stepIndex, total, status }) => {
            if (status === 'analyzing') {
              setMessages(prev => {
                const updated = [...prev]
                const sfIdx = updated.findLastIndex(m => m.role === 'system' && m.content.startsWith('⟳ Analisi Stockfish'))
                if (sfIdx >= 0) {
                  updated[sfIdx] = { role: 'system', content: `⟳ Analisi Stockfish: step ${stepIndex + 1}/${total}…` }
                }
                return updated
              })
            }
          },
        })

        // Merge SF results con validazione mosse illegali esistente
        setSfValidation(prev => {
          const merged = { ...(prev || {}) }
          for (const r of sfResults) {
            merged[r.stepIndex] = {
              ...merged[r.stepIndex],
              quality: r.quality,
              cpLoss: r.cpLoss,
              bestMove: r.bestMove,
              eval: r.eval,
              mate: r.mate,
              lines: r.lines,
            }
          }
          return merged
        })

        // Riepilogo qualità
        const issues = sfResults.filter(r => r.quality === 'mistake' || r.quality === 'blunder')
        if (issues.length > 0) {
          addMsg('system', `⚠ Stockfish: ${issues.length} step con problemi — ${issues.map(r => `step ${r.stepIndex + 1}: ${r.quality}`).join(', ')}`)
        } else {
          addMsg('system', '✓ Analisi Stockfish completata — nessun problema rilevato')
        }
      } catch (sfErr) {
        addMsg('system', `⚠ Analisi Stockfish fallita: ${sfErr.message}`)
      }
    } catch (err) {
      setLessonError(err.message)
      addMsg('error', `Errore: ${err.message}`)
    } finally {
      setGenerating(false)
    }
  }, [tema, livello, ratingMin, ratingMax, obiettivo, fen, selectedModel, validateMovesWithChessService])

  const handleStepSelect = useCallback((index) => {
    setSelectedStepIndex(index)
    const step = lessonResult?.steps?.[index]
    if (step?.fen) {
      setFen(step.fen)
      setFenInput(step.fen)
      setLastMove(null)
    }
  }, [lessonResult])

  const handleChatSend = useCallback(async () => {
    if (!chatInput.trim() || refining || !lessonResult) return
    const userMsg = chatInput.trim()
    setChatInput('')
    setRefining(true)
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])

    try {
      const result = await refineLesson({
        lesson: lessonResult,
        userMessage: userMsg,
        history: chatHistory,
        model: selectedModel,
      })
      setLessonResult(result.lesson)
      setLessonValidation(result.validation)
      setSfValidation(null)
      setSelectedStepIndex(null)
      const assistantMsg = `Lezione aggiornata: "${result.lesson.title || result.lesson.titolo}" — ${result.lesson.steps?.length || 0} step`
      setChatHistory(prev => [
        ...prev,
        { role: 'user', content: userMsg },
        { role: 'assistant', content: assistantMsg },
      ])
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMsg }])
      validateMovesWithChessService(result.lesson)

      // Ri-analizza con SF dopo raffinamento
      try {
        setMessages(prev => [...prev, { role: 'system', content: '⟳ Ri-analisi Stockfish…' }])
        const sfResults = await analyzeLesson(result.lesson, { depth: 15 })
        setSfValidation(prev => {
          const merged = { ...(prev || {}) }
          for (const r of sfResults) {
            merged[r.stepIndex] = {
              ...merged[r.stepIndex],
              quality: r.quality, cpLoss: r.cpLoss,
              bestMove: r.bestMove, eval: r.eval, mate: r.mate, lines: r.lines,
            }
          }
          return merged
        })
        const issues = sfResults.filter(r => r.quality === 'mistake' || r.quality === 'blunder')
        if (issues.length > 0) {
          setMessages(prev => [...prev, { role: 'system', content: `⚠ SF: ${issues.length} step con problemi` }])
        } else {
          setMessages(prev => [...prev, { role: 'system', content: '✓ Analisi SF ok' }])
        }
      } catch {
        // SF analysis failure non blocca il raffinamento
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'error', content: `Errore raffinamento: ${err.message}` }])
    } finally {
      setRefining(false)
    }
  }, [chatInput, refining, lessonResult, chatHistory, validateMovesWithChessService])

  return (
    <div className="console-page">
      {/* Top bar */}
      <div className="console-topbar">
        <h1>Console Coach</h1>
        <span className="breadcrumb">/ Creazione lezione</span>
      </div>

      {/* 3-column grid */}
      <div className="console-grid">
        {/* Left panel — Settings */}
        <div className="console-panel panel-left">
          <h2>Impostazione Obiettivi</h2>
          <div className="settings-form">
            <div className="form-group">
              <label htmlFor="tema">Tema</label>
              <select id="tema" value={tema} onChange={e => setTema(e.target.value)}>
                <option value="">Seleziona tema...</option>
                <option value="tattica">Tattica</option>
                <option value="aperture">Aperture</option>
                <option value="finali">Finali</option>
                <option value="strategia">Strategia</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="livello">Livello studente</label>
              <select id="livello" value={livello} onChange={e => setLivello(e.target.value)}>
                <option value="">Seleziona livello...</option>
                <option value="principiante">Principiante</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzato">Avanzato</option>
              </select>
            </div>

            <div className="form-group">
              <label>Rating range</label>
              <div className="rating-range">
                <input
                  type="number"
                  placeholder="Min"
                  value={ratingMin}
                  onChange={e => setRatingMin(e.target.value)}
                  min={0}
                  max={3000}
                />
                <span>—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={ratingMax}
                  onChange={e => setRatingMax(e.target.value)}
                  min={0}
                  max={3000}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="obiettivo">Obiettivo didattico</label>
              <textarea
                id="obiettivo"
                placeholder="Descrivi l'obiettivo della lezione..."
                value={obiettivo}
                onChange={e => setObiettivo(e.target.value)}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="model">Modello IA</label>
              <select id="model" value={selectedModel} onChange={e => setSelectedModel(e.target.value)}>
                <optgroup label="Claude (Anthropic)">
                  <option value="claude-sonnet-4-6">Claude Sonnet 4.6 — VELOCE</option>
                  <option value="claude-opus-4-6">Claude Opus 4.6 — POTENTE</option>
                </optgroup>
                <optgroup label="Gemini (Google)">
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash — VELOCE</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro — POTENTE</option>
                </optgroup>
              </select>
              <p className="form-hint">
                Sonnet e Flash garantiscono risposta entro 30s. Opus e Pro possono richiedere 60–90s.
              </p>
            </div>

            <button
              className="btn-generate"
              disabled={generating || !tema || !livello}
              onClick={handleGenerate}
            >
              {generating ? 'Generazione in corso…' : 'Genera lezione'}
            </button>

            {lessonResult && (
              <div className="lesson-actions">
                <button
                  className="btn-save"
                  onClick={() => { saveDraftLesson(lessonResult); setSaveStatus('saved') }}
                  disabled={saveStatus === 'approved'}
                >
                  {saveStatus === 'saved' ? 'Salvata ✓' : 'Salva bozza'}
                </button>
                <button
                  className="btn-approve"
                  onClick={() => { markAsApproved(lessonResult); setSaveStatus('approved') }}
                  disabled={saveStatus === 'approved'}
                >
                  {saveStatus === 'approved' ? 'Approvata ✓' : 'Approva e pubblica'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center panel — Board */}
        <div className="console-panel panel-center center-panel">
          <div className="board-wrapper">
            <Chessboard
              fen={fen}
              orientation="white"
              turnColor={turn}
              dests={dests}
              onMove={handleMove}
              lastMove={lastMove}
              check={checkSquare}
            />
          </div>

          <div className="fen-input">
            <input
              type="text"
              value={fenInput}
              onChange={handleFenChange}
              onKeyDown={handleFenSubmit}
              title="Modifica FEN e premi Invio per aggiornare la scacchiera"
            />
          </div>

          <StockfishPanel fen={fen} orientation="white" />
        </div>

        {/* Right panel — LessonViewer + Chat */}
        <div className="console-panel panel-right chat-panel">
          {lessonResult && (
            <LessonViewer
              lesson={lessonResult}
              validation={lessonValidation}
              sfValidation={sfValidation}
              onStepSelect={handleStepSelect}
              selectedStepIndex={selectedStepIndex}
            />
          )}

          <h2>Chat IA</h2>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty">
                Seleziona tema e livello, poi premi "Genera lezione".
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`chat-msg chat-msg--${msg.role}`}>
                  {msg.content}
                </div>
              ))
            )}
            {lessonResult && (
              <details className="chat-lesson-details">
                <summary>Mostra JSON lezione</summary>
                <pre>{JSON.stringify(lessonResult, null, 2)}</pre>
              </details>
            )}
          </div>

          <div className="chat-input-area">
            <textarea
              placeholder="Scrivi un messaggio..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleChatSend()
                }
              }}
              rows={1}
              disabled={refining || !lessonResult}
            />
            <button
              className="btn-send"
              onClick={handleChatSend}
              disabled={refining || !lessonResult || !chatInput.trim()}
            >
              {refining ? '…' : 'Invia'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
