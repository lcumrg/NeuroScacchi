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

  // Feedback raccolta per ogni step (index → rating 1-3, 0 = non valutato)
  const [stepRatings, setStepRatings] = useState({})
  const [stepNotes, setStepNotes] = useState({}) // index → stringa nota

  // Schermata feedback finale
  const [feedbackPhase, setFeedbackPhase] = useState(false) // true dopo 'done'
  const [overallRating, setOverallRating] = useState(0)
  const [feedbackNote, setFeedbackNote] = useState('')
  const [feedbackSaved, setFeedbackSaved] = useState(false)

  // Hover preview shapes (intent activity)
  const [previewShapes, setPreviewShapes] = useState(null)

  // Detective square click state
  const [clickedSquare, setClickedSquare] = useState(null)

  // Demo move index state (which move of demo.moves is currently shown)
  const demoMoveIndexRef = useRef(0)

  const freezeTimerRef = useRef(null)

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

  // ── Salva feedback e vai alla schermata finale ────────────────────────────
  async function handleSubmitFeedback() {
    const stepFeedback = (lesson.steps || []).map((step, i) => ({
      stepIndex: i,
      stepType: step.type,
      summary: stepSummary(step),
      rating: stepRatings[i] || 0,
      note: stepNotes[i] || '',
    }))

    await saveLessonFeedback({
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      lessonCategory: lesson.category,
      overallRating,
      note: feedbackNote,
      stepFeedback,
    })
    setFeedbackSaved(true)
  }

  if (phase === 'done') {
    if (!feedbackPhase) {
      return (
        <div className="player-page player-page--done">
          <div className="player-done">
            <div className="player-done__icon">★</div>
            <h2 className="player-done__title">Lezione completata!</h2>
            <p className="player-done__subtitle">{lesson.title}</p>
            <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column', alignItems: 'center' }}>
              <button
                className="player-done__btn"
                onClick={() => setFeedbackPhase(true)}
                style={{ cursor: 'pointer', border: 'none' }}
              >
                Valuta la lezione →
              </button>
              <a href="#/lessons" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'underline' }}>
                Salta e torna alle lezioni
              </a>
            </div>
          </div>
        </div>
      )
    }

    // ── Form di feedback ────────────────────────────────────────────────────
    return (
      <div className="player-page player-page--done">
        <div className="player-feedback">
          <h2 className="player-feedback__title">Come è andata?</h2>
          <p className="player-feedback__subtitle">{lesson.title}</p>

          {/* Rating globale */}
          <div className="player-feedback__overall">
            <span className="player-feedback__overall-label">Valutazione complessiva</span>
            <div className="player-feedback__stars">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  className={`player-feedback__star${overallRating >= n ? ' player-feedback__star--active' : ''}`}
                  onClick={() => setOverallRating(overallRating === n ? 0 : n)}
                  aria-label={`${n} stelle`}
                >★</button>
              ))}
            </div>
          </div>

          {/* Rating per step */}
          <div className="player-feedback__steps">
            <span className="player-feedback__steps-label">Step individuali</span>
            {(lesson.steps || []).map((step, i) => (
              <div key={i} className="player-feedback__step-block">
                <div className="player-feedback__step-row">
                  <span className="player-feedback__step-type">{step.type}</span>
                  <span className="player-feedback__step-summary">{stepSummary(step)}</span>
                  <div className="player-feedback__step-stars">
                    {[1, 2, 3].map(n => (
                      <button
                        key={n}
                        className={`player-feedback__step-star${(stepRatings[i] || 0) >= n ? ' player-feedback__step-star--active' : ''}`}
                        onClick={() => setStepRatings(prev => ({ ...prev, [i]: prev[i] === n ? 0 : n }))}
                        title={n === 1 ? 'Difficile/non funziona' : n === 2 ? 'Ok' : 'Ben fatto'}
                        aria-label={`Step ${i + 1}: ${n} stelle`}
                      >★</button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  className="player-feedback__step-note"
                  placeholder="Nota (opzionale)..."
                  value={stepNotes[i] || ''}
                  onChange={e => setStepNotes(prev => ({ ...prev, [i]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          {/* Nota testuale */}
          <div className="player-feedback__note">
            <span className="player-feedback__note-label">Note (opzionale)</span>
            <textarea
              className="player-feedback__note-input"
              placeholder="Cosa ha funzionato? Cosa sistemare? Osservazioni sui bambini..."
              value={feedbackNote}
              onChange={e => setFeedbackNote(e.target.value)}
            />
          </div>

          {feedbackSaved ? (
            <>
              <p className="player-feedback__saved">✓ Feedback salvato!</p>
              <a href="#/lessons" className="player-feedback__back">Torna alle lezioni</a>
            </>
          ) : (
            <div className="player-feedback__actions">
              <button className="player-feedback__btn player-feedback__btn--secondary" onClick={() => window.location.hash = '#/lessons'}>
                Salta
              </button>
              <button className="player-feedback__btn player-feedback__btn--primary" onClick={handleSubmitFeedback}>
                Salva feedback
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const totalSteps = lesson.steps.length
  const progressPct = ((stepIndex) / totalSteps) * 100

  return (
    <div className="player-page">
      {/* Header */}
      <header className="player-header">
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
            <FreezeOverlay secondsLeft={freezeSecondsLeft} />
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
            onRate={rating => setStepRatings(prev => ({ ...prev, [stepIndex]: rating }))}
            currentRating={stepRatings[stepIndex] || 0}
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
    </div>
  )
}
