import { useState, useEffect, useRef, useCallback } from 'react'
import Chessboard from '../components/Chessboard'
import FreezeOverlay from '../components/player/FreezeOverlay'
import FeedbackPanel from '../components/player/FeedbackPanel'
import IntentActivity from '../components/player/IntentActivity'
import DetectiveActivity from '../components/player/DetectiveActivity'
import CandidateActivity from '../components/player/CandidateActivity'
import MoveActivity from '../components/player/MoveActivity'
import TextActivity from '../components/player/TextActivity'
import DemoActivity from '../components/player/DemoActivity'
import DevFeedbackSidebar from '../components/player/DevFeedbackSidebar'
import { loadLesson, saveLessonFeedback } from '../engine/lessonStore'
import { legalDests, makeMove, turnColor as getTurnColor, parseUci } from '../engine/chessService'
import './PlayerPage.css'

// ─── helpers ───────────────────────────────────────────────────────────────

function stepSummary(step) {
  if (!step) return ''
  switch (step.type) {
    case 'intent':
    case 'detective': return step.question || ''
    case 'text': return (step.content || '').substring(0, 80)
    case 'candidate': return `Mosse candidate: ${(step.candidateMoves || []).slice(0, 3).join(', ')}`
    case 'move': return `Esegui la mossa: ${(step.correctMoves || []).join(', ')}`
    case 'demo': return (step.explanation || '').substring(0, 80)
    default: return ''
  }
}

// Snapshot immutabile del contenuto dello step visto dallo studente.
// Incluso nel feedback per costruire dataset (content, judgment) per il training dell'IA.
function stepSnapshot(step) {
  if (!step) return {}
  const base = { fen: step.fen || null }
  switch (step.type) {
    case 'intent':
      return { ...base, question: step.question, options: step.options, correctAnswer: step.correctAnswer, explanation: step.explanation }
    case 'detective':
      return { ...base, question: step.question, targetSquare: step.targetSquare, explanation: step.explanation }
    case 'candidate':
      return { ...base, candidateMoves: step.candidateMoves, explanation: step.explanation }
    case 'move':
      return { ...base, correctMoves: step.correctMoves, explanation: step.explanation }
    case 'text':
      return { content: step.content }
    case 'demo':
      return { ...base, explanation: step.explanation, moves: step.moves }
    default:
      return base
  }
}

function visualAidsToShapes(visualAids) {
  if (!visualAids) return []
  const shapes = []
  if (visualAids.arrows) {
    for (const a of visualAids.arrows) {
      shapes.push({ orig: a.from, dest: a.to, brush: 'green' })
    }
  }
  if (visualAids.circles) {
    for (const c of visualAids.circles) {
      shapes.push({ orig: c.square, brush: 'yellow' })
    }
  }
  return shapes
}

// ─── component ─────────────────────────────────────────────────────────────

export default function PlayerPage() {
  const [lesson, setLesson] = useState(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [phase, setPhase] = useState('freeze') // 'freeze'|'activity'|'feedback'|'done'
  const [fen, setFen] = useState(null)
  const [lastMove, setLastMove] = useState(null)
  const [shapes, setShapes] = useState([])
  const [lastAttemptCorrect, setLastAttemptCorrect] = useState(null)
  const [freezeSecondsLeft, setFreezeSecondsLeft] = useState(0)
  const [error, setError] = useState(null)

  // Candidate activity state
  const [candidateMoves, setCandidateMoves] = useState([])

  // Dev feedback per-step: array di { tag, note, errors }
  const [devFeedback, setDevFeedback] = useState([])
  const devFeedbackRef = useRef([])   // ref per accesso senza stale closure
  useEffect(() => { devFeedbackRef.current = devFeedback }, [devFeedback])

  // Browser error capture (keyed by step index)
  const capturedErrorsRef = useRef({})
  const currentStepIndexRef = useRef(0)
  useEffect(() => { currentStepIndexRef.current = stepIndex }, [stepIndex])

  // Hover preview shapes (intent activity)
  const [previewShapes, setPreviewShapes] = useState(null)

  // Detective square click state
  const [clickedSquare, setClickedSquare] = useState(null)

  // Demo move index state (which move of demo.moves is currently shown)
  const demoMoveIndexRef = useRef(0)

  const freezeTimerRef = useRef(null)

  // ── Browser error capture ──────────────────────────────────────────────────
  useEffect(() => {
    const addError = (msg, stack) => {
      const idx = currentStepIndexRef.current
      const entry = { message: msg, stack: stack || '', timestamp: new Date().toISOString() }
      capturedErrorsRef.current = {
        ...capturedErrorsRef.current,
        [idx]: [...(capturedErrorsRef.current[idx] || []), entry],
      }
    }
    const onError = e => addError(e.message, e.error?.stack)
    const onRejection = e => addError(
      e.reason?.message || String(e.reason),
      e.reason?.stack
    )
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  // ── Load lesson on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const id = sessionStorage.getItem('ns3_selected_lesson_id')
    if (!id) {
      setError('Nessuna lezione selezionata.')
      return
    }
    loadLesson(id).then(lesson => {
      if (!lesson) {
        setError(`Lezione "${id}" non trovata.`)
        return
      }
      setLesson(lesson)
      setFen(lesson.steps[0]?.fen ?? lesson.initialFen)
      setDevFeedback(lesson.steps.map(() => ({ tag: null, note: '', errors: [] })))
    })
  }, [])

  // ── Start freeze phase whenever step/phase changes ────────────────────────
  const currentStep = lesson?.steps?.[stepIndex]

  useEffect(() => {
    if (!lesson || !currentStep) return
    if (phase !== 'freeze') return

    const freezeConfig = lesson.config?.freeze
    const freezeEnabled = freezeConfig?.enabled ?? true
    const durationMs = freezeConfig?.durationMs ?? 2000

    // Skip freeze for text steps — the text itself is the content, no board to observe
    if (!freezeEnabled || durationMs <= 0 || currentStep?.type === 'text') {
      setPhase('activity')
      return
    }

    const totalSeconds = Math.ceil(durationMs / 1000)
    setFreezeSecondsLeft(totalSeconds)

    let remaining = totalSeconds
    freezeTimerRef.current = setInterval(() => {
      remaining -= 1
      setFreezeSecondsLeft(remaining)
      if (remaining <= 0) {
        clearInterval(freezeTimerRef.current)
        setPhase('activity')
      }
    }, 1000)

    return () => clearInterval(freezeTimerRef.current)
  }, [phase, stepIndex, lesson])

  // ── Reset per-step state when step changes ────────────────────────────────
  useEffect(() => {
    setCandidateMoves([])
    setClickedSquare(null)
    setShapes([])
    setPreviewShapes(null)
    setLastAttemptCorrect(null)
    demoMoveIndexRef.current = 0
    if (currentStep && currentStep.fen) {
      setFen(currentStep.fen)
    }
  }, [stepIndex])

  // ── Computed board props ──────────────────────────────────────────────────
  const currentStepType = currentStep?.type?.toLowerCase()?.trim()

  const isBoardInteractive = phase === 'activity' && currentStep &&
    ['move', 'candidate'].includes(currentStepType)

  const isDetectivePhase = phase === 'activity' && currentStepType === 'detective'

  // Fallback FEN: step corrente → initialFen della lezione — mai null
  const activeFen = fen ?? currentStep?.fen ?? lesson?.initialFen

  // Shapes: visualAids (feedback) ha priorità; durante activity usa preview hover
  const boardShapes = shapes.length > 0 ? shapes : (previewShapes ?? [])
  let boardDests = new Map()
  if (isBoardInteractive && activeFen) {
    try {
      boardDests = legalDests(activeFen)
    } catch (e) {
      console.error('[PlayerPage] legalDests fallito:', e?.message, 'FEN:', activeFen)
    }
  }
  const boardTurnColor = activeFen ? getTurnColor(activeFen) : 'white'


  // ── Activity callbacks ────────────────────────────────────────────────────

  function enterFeedback(correct, feedbackText, visualAids) {
    setLastAttemptCorrect(correct)
    setShapes(visualAidsToShapes(visualAids))
    setPhase('feedback')
  }

  function handleCorrect() {
    const va = currentStep?.visualAids ?? null
    enterFeedback(true, currentStep?.feedback?.correct || 'Corretto!', va)
  }

  function handleIncorrect() {
    // called for non-blocking incorrect (detective/intent auto-proceed)
    // no phase change here — the activity component will call onCorrect after delay
  }

  // ── Move handler (for 'move' and 'candidate' steps) ──────────────────────
  function handleBoardMove(orig, dest) {
    if (!fen || !currentStep) return
    const result = makeMove(fen, { from: orig, to: dest })
    if (!result.valid) return

    const uci = orig + dest + (result.promotion ? result.promotion : '')

    if (currentStep.type === 'move') {
      const correctMoves = currentStep.correctMoves ?? []
      const isCorrect = correctMoves.some(m => m.startsWith(orig + dest))
      setFen(result.fen)
      setLastMove([orig, dest])
      if (isCorrect) {
        handleCorrect()
      } else {
        const va = currentStep?.visualAids ?? null
        enterFeedback(false, currentStep?.feedback?.incorrect || 'Non è la mossa migliore.', va)
      }
    } else if (currentStep.type === 'candidate') {
      // In candidate mode: add move to list, keep board interactive (restore FEN)
      const moveStr = uci
      if (!candidateMoves.includes(moveStr)) {
        setCandidateMoves(prev => [...prev, moveStr])
      }
      // Revert to step FEN so the board stays at the original position
      setFen(currentStep.fen)
      setLastMove(null)
    }
  }

  function handleCandidateToggle(move) {
    setCandidateMoves(prev => prev.filter(m => m !== move))
  }

  function handleCandidateComplete(moves) {
    const candidateList = currentStep.candidateMoves ?? []
    const allValid = moves.every(m => candidateList.includes(m))
    const va = currentStep?.visualAids ?? null
    if (allValid) {
      enterFeedback(true, currentStep?.feedback?.correct || 'Hai trovato le mosse candidate!', va)
    } else {
      enterFeedback(false, currentStep?.feedback?.incorrect || 'Alcune mosse non erano tra le candidate.', va)
    }
  }

  // ── Detective square click ────────────────────────────────────────────────
  function handleSquareClick(square) {
    if (!isDetectivePhase) return
    setClickedSquare(square)
  }

  function handleSquareConsumed() {
    setClickedSquare(null)
  }

  // ── Text / Demo "Continua" ────────────────────────────────────────────────
  function handleTextContinue() {
    // Text steps have no feedback phase — go straight to transition
    advanceAfterFeedback()
  }

  function handleDemoComplete() {
    advanceAfterFeedback()
  }

  // ── Demo FEN change ───────────────────────────────────────────────────────
  function handleDemoFenChange(moveIndex) {
    if (!currentStep || currentStep.type !== 'demo') return
    const moves = currentStep.moves ?? []
    // Rebuild FEN by applying moves from the step FEN up to moveIndex
    let currentFen = currentStep.fen ?? lesson.initialFen
    for (let i = 0; i < moveIndex && i < moves.length; i++) {
      const parsed = parseUci(moves[i])
      if (!parsed) continue
      const result = makeMove(currentFen, parsed)
      if (result.valid) {
        currentFen = result.fen
        setLastMove([parsed.from, parsed.to])
      }
    }
    setFen(currentFen)
  }

  // ── Transition: apply moves and advance ───────────────────────────────────
  async function runTransition(transition, afterFen) {
    const moves = transition.moves ?? []
    let currentFen = afterFen

    for (let i = 0; i < moves.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800))
      const parsed = parseUci(moves[i])
      if (!parsed) continue
      const result = makeMove(currentFen, parsed)
      if (result.valid) {
        currentFen = result.fen
        setFen(currentFen)
        setLastMove([parsed.from, parsed.to])
      }
    }
  }

  // ── Feedback → next step ──────────────────────────────────────────────────
  async function advanceAfterFeedback() {
    if (!lesson || !currentStep) return
    const nextIndex = stepIndex + 1

    if (nextIndex >= lesson.steps.length) {
      setPhase('done')
      // Auto-save dev feedback (fire-and-forget)
      const stepFeedback = lesson.steps.map((step, i) => ({
        stepIndex: i,
        stepType: step.type,
        tag: devFeedbackRef.current[i]?.tag || null,
        note: devFeedbackRef.current[i]?.note || '',
        errors: capturedErrorsRef.current[i] || [],
        snapshot: stepSnapshot(step),  // contenuto visto dallo studente — immutabile
      }))
      saveLessonFeedback({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        lessonCategory: lesson.category,
        stepFeedback,
      })
      return
    }

    const transition = currentStep.transition
    const nextStep = lesson.steps[nextIndex]

    if (transition) {
      setPhase('transition')
      const baseFen = fen ?? currentStep.fen ?? lesson.initialFen
      await runTransition(transition, baseFen)
    }

    setFen(nextStep.fen ?? transition?.resultingFen ?? fen)
    setLastMove(null)
    setShapes([])
    setStepIndex(nextIndex)
    setPhase('freeze')
  }

  // ── Dev feedback update ───────────────────────────────────────────────────
  function updateDevFeedback(idx, field, value) {
    setDevFeedback(prev => {
      const next = [...prev]
      const item = { ...next[idx], [field]: value }
      // Quando il tag diventa 'bloccato' snapshotta gli errori catturati fino ad ora
      if (field === 'tag' && value === 'bloccato') {
        item.errors = [...(capturedErrorsRef.current[idx] || [])]
      }
      next[idx] = item
      return next
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="player-page player-page--error">
        <p className="player-error__text">{error}</p>
        <a href="#/lessons" className="player-error__link">Torna alle lezioni</a>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="player-page player-page--loading">
        <p>Caricamento lezione...</p>
      </div>
    )
  }


  if (phase === 'done') {
    return (
      <div className="player-page player-page--done">
        <div className="player-done">
          <div className="player-done__icon">★</div>
          <h2 className="player-done__title">Lezione completata!</h2>
          <p className="player-done__subtitle">{lesson.title}</p>
          <p className="player-done__dev-note">Dev log salvato automaticamente</p>
          <a href="#/lessons" className="player-done__btn">Torna alle lezioni</a>
        </div>
      </div>
    )
  }

  const totalSteps = lesson.steps.length
  const progressPct = ((stepIndex) / totalSteps) * 100

  return (
    <div className="player-page player-page--with-sidebar">
      {/* Header */}
      <header className="player-header player-header--wide">
        <div className="player-header__meta">
          <h1 className="player-header__title">{lesson.title}</h1>
          <span className="player-header__step">Step {stepIndex + 1} di {totalSteps}</span>
        </div>
        <div className="player-progress-bar">
          <div
            className="player-progress-bar__fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* Board + Activity affiancati su desktop */}
      <div className="player-content">

      {/* Board area */}
      <main className="player-board-area">
        <div className={`player-board-wrapper${isDetectivePhase ? ' player-board-wrapper--detective' : ''}`}>
          <Chessboard
            fen={activeFen}
            orientation={lesson.orientation ?? 'white'}
            turnColor={boardTurnColor}
            dests={boardDests}
            onMove={isBoardInteractive ? handleBoardMove : undefined}
            interactive={isBoardInteractive}
            viewOnly={!isBoardInteractive}
            lastMove={lastMove}
            shapes={boardShapes.length > 0 ? boardShapes : undefined}
            onSquareClick={isDetectivePhase ? handleSquareClick : undefined}
          />
          {phase === 'freeze' && (
            <FreezeOverlay secondsLeft={freezeSecondsLeft} stepType={currentStep?.type} />
          )}
        </div>
      </main>

      {/* Mobile scroll indicator */}
      <div className="player-scroll-hint" aria-hidden="true">Scorri per l'attività</div>

      {/* Activity / Feedback panel */}
      <section className="player-activity-panel">
        {phase === 'feedback' && (
          <FeedbackPanel
            correct={lastAttemptCorrect}
            feedbackText={
              lastAttemptCorrect
                ? (currentStep?.feedback?.correct || 'Corretto!')
                : (currentStep?.feedback?.incorrect || 'Non corretto.')
            }
            onContinue={advanceAfterFeedback}
          />
        )}

        {phase === 'activity' && currentStep?.type === 'text' && (
          <TextActivity step={currentStep} onContinue={handleTextContinue} />
        )}

        {phase === 'activity' && currentStep?.type === 'demo' && (
          <DemoActivity
            step={currentStep}
            fen={fen}
            onComplete={handleDemoComplete}
            onFenChange={handleDemoFenChange}
          />
        )}

        {phase === 'activity' && currentStep?.type === 'intent' && (
          <IntentActivity
            step={currentStep}
            onCorrect={handleCorrect}
            onIncorrect={handleIncorrect}
            onPreviewShapes={setPreviewShapes}
          />
        )}

        {phase === 'activity' && currentStep?.type === 'detective' && (
          <DetectiveActivity
            step={currentStep}
            onCorrect={handleCorrect}
            onIncorrect={handleIncorrect}
            clickedSquare={clickedSquare}
            onSquareConsumed={handleSquareConsumed}
          />
        )}

        {phase === 'activity' && currentStep?.type === 'candidate' && (
          <CandidateActivity
            step={currentStep}
            onComplete={handleCandidateComplete}
            selectedMoves={candidateMoves}
            onMoveToggle={handleCandidateToggle}
          />
        )}

        {phase === 'activity' && currentStep?.type === 'move' && (
          <MoveActivity step={currentStep} />
        )}

        {phase === 'transition' && (
          <p className="player-transition-msg">Prossima posizione...</p>
        )}
      </section>

      </div> {/* /player-content */}

      {/* Dev feedback sidebar */}
      {lesson && (
        <DevFeedbackSidebar
          steps={lesson.steps}
          currentStepIndex={stepIndex}
          feedbackData={devFeedback}
          onUpdate={updateDevFeedback}
        />
      )}
    </div>
  )
}
