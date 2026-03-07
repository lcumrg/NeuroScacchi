import { useState, useEffect, useRef } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import FeedbackBox from './FeedbackBox'
import ReflectionPrompt from './ReflectionPrompt'
import LessonSummary from './LessonSummary'
import { createSession, saveSession } from '../utils/storageManager'
import './CandidateSequencePlayer.css'

const BOARD_SIZE = 480
const MAX_CANDIDATES = 5

function CandidateSequencePlayer({ lesson, esameMode = false, onComplete, onExit }) {
  const gameRef = useRef(new Chess())
  const game = gameRef.current

  // Sequence state
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [position, setPosition] = useState('')
  const [phase, setPhase] = useState('freeze') // freeze | collecting | evaluated | executing
  const [boardOrientation, setBoardOrientation] = useState('white')

  // Candidate state
  const [candidates, setCandidates] = useState([])
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [legalTargets, setLegalTargets] = useState([])

  // Feedback & completion
  const [feedback, setFeedback] = useState({ type: 'neutral', message: '' })
  const [showSummary, setShowSummary] = useState(false)
  const [completedSession, setCompletedSession] = useState(null)
  const [sequenceComplete, setSequenceComplete] = useState(false)

  // Metacognizione
  const sessionRef = useRef(null)
  const [showReflection, setShowReflection] = useState(false)
  const [reflectionContext, setReflectionContext] = useState(null)

  const timersRef = useRef([])

  const clearAllTimers = () => {
    timersRef.current.forEach(id => clearTimeout(id))
    timersRef.current = []
  }
  const safeTimeout = (fn, ms) => {
    const id = setTimeout(fn, ms)
    timersRef.current.push(id)
    return id
  }

  useEffect(() => {
    return () => clearAllTimers()
  }, [])

  const totalSteps = lesson.steps.length
  const isLastStep = currentStepIndex === totalSteps - 1
  const currentStep = lesson.steps[currentStepIndex]

  // Per-step candidate data
  const numRequired = currentStep.num_candidate || lesson.parametri?.num_candidate || 2
  const goodMoves = currentStep.mosse_candidate || []
  const bestMove = currentStep.mossa_migliore

  // Inizializza sessione
  useEffect(() => {
    sessionRef.current = createSession(lesson.id)
    if (!sessionRef.current.stepErrors) {
      sessionRef.current.stepErrors = []
    }
    if (!sessionRef.current.candidateAccuracyPerStep) {
      sessionRef.current.candidateAccuracyPerStep = []
    }
  }, [lesson.id])

  // Inizializza step corrente
  useEffect(() => {
    clearAllTimers()
    const stepFen = currentStep.fen_aggiornata || lesson.fen

    try {
      game.load(stepFen)
      setPosition(stepFen)
    } catch (e) {
      setFeedback({ type: 'negative', message: 'Errore: posizione FEN non valida per questo step.' })
      return
    }

    // Reset stato candidate per il nuovo step
    setCandidates([])
    setSelectedSquare(null)
    setLegalTargets([])
    setShowReflection(false)
    setReflectionContext(null)

    if (lesson.parametri?.orientamento_scacchiera) {
      setBoardOrientation(lesson.parametri.orientamento_scacchiera)
    }

    // Esame mode: skip freeze e collecting, vai diretto a executing
    if (esameMode) {
      setPhase('executing')
      if (sessionRef.current) {
        sessionRef.current.isEsame = true
        if (currentStepIndex === 0) {
          sessionRef.current.phases.freeze.end = Date.now()
          sessionRef.current.phases.intent.end = Date.now()
          sessionRef.current.phases.move.start = Date.now()
        }
      }
      setFeedback({
        type: 'neutral',
        message: `Esame - Step ${currentStepIndex + 1}/${totalSteps}: Esegui la mossa migliore.`
      })
      return
    }

    // Modalita' normale: parti da freeze
    setPhase('freeze')

    if (sessionRef.current && currentStepIndex === 0) {
      sessionRef.current.phases.freeze.start = Date.now()
    }

    const freezeTime = lesson.parametri?.tempo_freeze || 2000
    safeTimeout(() => {
      setPhase('collecting')
      if (sessionRef.current) {
        if (currentStepIndex === 0) {
          sessionRef.current.phases.freeze.end = Date.now()
        }
        if (!sessionRef.current.phases.intent.start) {
          sessionRef.current.phases.intent.start = Date.now()
        }
      }
      setFeedback({
        type: 'neutral',
        message: `Step ${currentStepIndex + 1}/${totalSteps}: ${currentStep.descrizione_step || `Identifica almeno ${numRequired} mosse candidate.`}`
      })
    }, freezeTime)
  }, [currentStepIndex])

  // Click sulla scacchiera per selezionare candidate
  const handleSquareClick = (square) => {
    if (phase !== 'collecting') return
    if (candidates.length >= MAX_CANDIDATES && !selectedSquare) return

    const pieceMoves = game.moves({ square, verbose: true })
    const hasPiece = pieceMoves.length > 0

    if (selectedSquare) {
      // Clic su un altro pezzo proprio → ri-seleziona
      if (hasPiece && square !== selectedSquare) {
        setSelectedSquare(square)
        setLegalTargets(pieceMoves.map(m => m.to))
        return
      }

      // Prova ad aggiungere come candidata
      if (legalTargets.includes(square)) {
        const moveNotation = selectedSquare + square
        const isDuplicate = candidates.some(c => c.notation === moveNotation)
        if (!isDuplicate && candidates.length < MAX_CANDIDATES) {
          setCandidates(prev => [...prev, {
            from: selectedSquare,
            to: square,
            notation: moveNotation
          }])
        }
      }

      setSelectedSquare(null)
      setLegalTargets([])
    } else {
      if (hasPiece) {
        setSelectedSquare(square)
        setLegalTargets(pieceMoves.map(m => m.to))
      }
    }
  }

  const removeCandidate = (index) => {
    setCandidates(prev => prev.filter((_, i) => i !== index))
  }

  // Valuta le candidate
  const handleEvaluate = () => {
    setSelectedSquare(null)
    setLegalTargets([])

    // Traccia accuracy per questo step
    const stepAccuracy = {
      step: currentStepIndex + 1,
      proposed: candidates.map(c => c.notation),
      goodFound: candidates.filter(c => goodMoves.includes(c.notation)).length,
      badSelected: candidates.filter(c => !goodMoves.includes(c.notation)).length,
      totalGood: goodMoves.length
    }

    if (sessionRef.current) {
      sessionRef.current.candidateAccuracyPerStep.push(stepAccuracy)
      // Aggiorna anche l'accuracy globale
      sessionRef.current.candidateAccuracy = {
        proposed: (sessionRef.current.candidateAccuracy?.proposed || []).concat(candidates.map(c => c.notation)),
        goodFound: (sessionRef.current.candidateAccuracy?.goodFound || 0) + stepAccuracy.goodFound,
        badSelected: (sessionRef.current.candidateAccuracy?.badSelected || 0) + stepAccuracy.badSelected,
        totalGood: (sessionRef.current.candidateAccuracy?.totalGood || 0) + stepAccuracy.totalGood
      }
      sessionRef.current.intentAttempts++
    }

    setPhase('evaluated')

    const goodFound = candidates.filter(c => goodMoves.includes(c.notation))
    const badFound = candidates.filter(c => !goodMoves.includes(c.notation))

    if (goodFound.length > 0 && badFound.length === 0) {
      setFeedback({
        type: 'positive',
        message: `Ottimo! Hai identificato ${goodFound.length} mosse valide su ${goodMoves.length}. Ora gioca la mossa migliore!`
      })
    } else if (goodFound.length > 0) {
      setFeedback({
        type: 'neutral',
        message: `Hai trovato ${goodFound.length} mosse buone, ma anche ${badFound.length} meno efficaci. Ora gioca la migliore!`
      })
    } else {
      setFeedback({
        type: 'negative',
        message: 'Nessuna delle mosse selezionate era tra le migliori. Ora prova a giocare la mossa ottimale.'
      })

      // Riflessione dopo selezione completamente errata
      if (sessionRef.current) {
        sessionRef.current.intentErrors.push({
          step: currentStepIndex + 1,
          selected: candidates.map(c => c.notation),
          correct: goodMoves,
          timestamp: Date.now()
        })

        if (sessionRef.current.intentErrors.length >= 2) {
          safeTimeout(() => {
            setReflectionContext({
              phase: 'candidate_evaluation',
              step: currentStepIndex + 1,
              selected: candidates.map(c => c.notation)
            })
            setShowReflection(true)
          }, 1500)
        }
      }
    }

    safeTimeout(() => {
      setPhase('executing')
      setFeedback({
        type: 'neutral',
        message: 'Trascina il pezzo per eseguire la mossa che ritieni migliore.'
      })
    }, 2500)
  }

  // Esecuzione mossa finale (drag)
  const onDrop = (sourceSquare, targetSquare) => {
    if (phase !== 'executing') return false

    const moveNotation = sourceSquare + targetSquare

    if (sessionRef.current) {
      sessionRef.current.moveAttempts++
    }

    try {
      const move = game.move({ from: sourceSquare, to: targetSquare, promotion: 'q' })
      if (move) {
        setPosition(game.fen())

        const isBest = moveNotation === bestMove
        const isGood = goodMoves.includes(moveNotation)

        if (isBest || isGood) {
          const stepFeedback = isBest
            ? (currentStep.feedback_positivo || currentStep.feedback || 'Eccellente! Hai giocato la mossa migliore!')
            : (currentStep.feedback || 'Buona mossa! Ma ce n\'era una ancora migliore.')

          if (isLastStep) {
            // Ultimo step completato
            setFeedback({
              type: 'positive',
              message: lesson.feedback_finale || currentStep.feedback_finale || stepFeedback
            })
            completeSequence()
          } else {
            // Step intermedio - avanza
            setFeedback({
              type: 'positive',
              message: stepFeedback
            })
            safeTimeout(() => {
              setCurrentStepIndex(currentStepIndex + 1)
            }, 2000)
          }
        } else {
          // Mossa sbagliata
          if (sessionRef.current) {
            sessionRef.current.moveErrors.push({
              type: 'wrong_candidate_move',
              step: currentStepIndex + 1,
              attempted: moveNotation,
              timestamp: Date.now()
            })

            if (sessionRef.current.moveErrors.length >= 2) {
              safeTimeout(() => {
                setReflectionContext({
                  phase: 'move',
                  step: currentStepIndex + 1,
                  attempted: moveNotation
                })
                setShowReflection(true)
              }, 1500)
            }
          }

          // Ricarica posizione dello step corrente
          const stepFen = currentStep.fen_aggiornata || lesson.fen
          game.load(stepFen)
          setPosition(stepFen)
          setFeedback({
            type: 'negative',
            message: currentStep.feedback_negativo || 'Questa non era la mossa migliore. Riprova!'
          })
        }
        return true
      }
    } catch (e) {
      return false
    }
    return false
  }

  const completeSequence = () => {
    if (sessionRef.current) {
      sessionRef.current.phases.move.end = Date.now()
      if (sessionRef.current.phases.intent.start && !sessionRef.current.phases.intent.end) {
        sessionRef.current.phases.intent.end = Date.now()
      }
      sessionRef.current.completed = true
      sessionRef.current.completedAt = Date.now()
      saveSession(sessionRef.current)
      setCompletedSession({ ...sessionRef.current })
    }

    safeTimeout(() => {
      setSequenceComplete(true)
      setShowSummary(true)
      onComplete()
    }, 2000)
  }

  // Riflessione metacognitiva
  const handleReflection = (reflection) => {
    if (sessionRef.current) {
      sessionRef.current.reflections.push(reflection)
    }
    setShowReflection(false)
    setReflectionContext(null)
  }

  const handleReflectionSkip = () => {
    setShowReflection(false)
    setReflectionContext(null)
  }

  const handleReset = () => {
    clearAllTimers()
    setShowSummary(false)
    setShowReflection(false)
    setCompletedSession(null)
    setSequenceComplete(false)
    sessionRef.current = createSession(lesson.id)
    if (!sessionRef.current.stepErrors) sessionRef.current.stepErrors = []
    if (!sessionRef.current.candidateAccuracyPerStep) sessionRef.current.candidateAccuracyPerStep = []
    setCurrentStepIndex(0)
  }

  // --- Square styles ---
  const customSquareStyles = {}

  if (selectedSquare) {
    customSquareStyles[selectedSquare] = {
      background: 'radial-gradient(circle, rgba(255, 193, 7, 0.7) 0%, rgba(255, 193, 7, 0.3) 70%)',
      boxShadow: 'inset 0 0 0 3px rgba(255, 193, 7, 1)'
    }
  }

  legalTargets.forEach(sq => {
    if (!candidates.some(c => c.to === sq && c.from === selectedSquare)) {
      customSquareStyles[sq] = {
        background: 'radial-gradient(circle, rgba(33, 150, 243, 0.5) 25%, transparent 25%)',
        borderRadius: '50%'
      }
    }
  })

  if (phase === 'collecting') {
    candidates.forEach(c => {
      customSquareStyles[c.to] = {
        background: 'radial-gradient(circle, rgba(33, 150, 243, 0.6) 0%, rgba(33, 150, 243, 0.2) 70%)',
        boxShadow: 'inset 0 0 0 3px rgba(33, 150, 243, 0.8)'
      }
    })
  }

  if (phase === 'evaluated' || phase === 'executing') {
    candidates.forEach(c => {
      const isBest = c.notation === bestMove
      const isGood = goodMoves.includes(c.notation)
      customSquareStyles[c.to] = {
        background: isBest
          ? 'radial-gradient(circle, rgba(255, 193, 7, 0.7) 0%, rgba(255, 193, 7, 0.3) 70%)'
          : isGood
            ? 'radial-gradient(circle, rgba(76, 175, 80, 0.7) 0%, rgba(76, 175, 80, 0.3) 70%)'
            : 'radial-gradient(circle, rgba(244, 67, 54, 0.7) 0%, rgba(244, 67, 54, 0.3) 70%)',
        boxShadow: isBest
          ? 'inset 0 0 0 3px rgba(255, 193, 7, 1)'
          : isGood
            ? 'inset 0 0 0 3px rgba(76, 175, 80, 1)'
            : 'inset 0 0 0 3px rgba(244, 67, 54, 1)'
      }
    })
  }

  // Frecce per le candidate
  const customArrows = candidates.map(c => {
    if (phase === 'evaluated' || phase === 'executing') {
      const isBest = c.notation === bestMove
      const isGood = goodMoves.includes(c.notation)
      const color = isBest ? 'rgb(255, 193, 7)' : isGood ? 'rgb(76, 175, 80)' : 'rgb(244, 67, 54)'
      return [c.from, c.to, color]
    }
    return [c.from, c.to, 'rgb(33, 150, 243)']
  })

  return (
    <div className="candidate-sequence-player">
      {/* Progress Bar */}
      <div className="sequence-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>
        <div className="progress-text">
          {esameMode && '📝 Esame - '}Step {currentStepIndex + 1} di {totalSteps}
          {phase === 'freeze' && ' — Osserva...'}
          {phase === 'collecting' && ' — Seleziona candidate'}
          {phase === 'evaluated' && ' — Valutazione'}
          {phase === 'executing' && ' — Gioca la migliore'}
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content">
        <div className="chess-section">
          <div className="lesson-title">
            <h2>{lesson.titolo}</h2>
            <p className="lesson-description">{lesson.descrizione}</p>
          </div>

          <div className={`chessboard-wrapper ${phase === 'freeze' ? 'frozen' : ''}`}>
            {phase === 'freeze' && (
              <div className="freeze-overlay">
                <div className="freeze-message">
                  ⏸️ Osserva la posizione
                </div>
              </div>
            )}

            <Chessboard
              position={position}
              boardWidth={BOARD_SIZE}
              boardOrientation={boardOrientation}
              arePiecesDraggable={phase === 'executing'}
              onPieceDrop={onDrop}
              onSquareClick={handleSquareClick}
              customSquareStyles={customSquareStyles}
              customArrows={customArrows}
              customBoardStyle={{
                borderRadius: '8px',
                boxShadow: 'var(--shadow-md)',
                cursor: phase === 'collecting' ? 'pointer' : 'default'
              }}
              customLightSquareStyle={{
                backgroundColor: 'var(--square-light)'
              }}
              customDarkSquareStyle={{
                backgroundColor: 'var(--square-dark)'
              }}
            />
          </div>
        </div>

        <div className="intent-section">
          {/* Pannello Candidate */}
          <div className="candidate-panel">
            <div className="candidate-header">
              <span className="candidate-icon-big">🎯</span>
              <h3>Mosse Candidate</h3>
              <p className="candidate-instruction">
                {phase === 'freeze' && 'Osserva attentamente la posizione...'}
                {phase === 'collecting' && (currentStep.descrizione_step || 'Clicca un pezzo, poi la casella di destinazione')}
                {phase === 'evaluated' && 'Valutazione completata!'}
                {phase === 'executing' && 'Trascina il pezzo per giocare la migliore'}
              </p>
            </div>

            <div className="candidate-list">
              {candidates.length === 0 && phase === 'collecting' && (
                <div className="candidate-empty">
                  Seleziona almeno {numRequired} mosse candidate
                </div>
              )}

              {candidates.map((c, idx) => (
                <div
                  key={idx}
                  className={`candidate-item ${
                    (phase === 'evaluated' || phase === 'executing')
                      ? (c.notation === bestMove ? 'best' : goodMoves.includes(c.notation) ? 'good' : 'bad')
                      : ''
                  }`}
                >
                  <span className="candidate-number">{idx + 1}</span>
                  <span className="candidate-move">{c.from} → {c.to}</span>
                  {(phase === 'evaluated' || phase === 'executing') && (
                    <span className="candidate-verdict">
                      {c.notation === bestMove ? '⭐ Migliore'
                        : goodMoves.includes(c.notation) ? '✅ Buona'
                        : '❌ Debole'}
                    </span>
                  )}
                  {phase === 'collecting' && (
                    <button
                      className="candidate-remove"
                      onClick={() => removeCandidate(idx)}
                    >×</button>
                  )}
                </div>
              ))}
            </div>

            {phase === 'collecting' && (
              <div className="candidate-counter">
                <div className="counter-bar">
                  <div
                    className="counter-fill"
                    style={{ width: `${Math.min(100, (candidates.length / numRequired) * 100)}%` }}
                  />
                </div>
                <span>{candidates.length} / {numRequired}</span>
              </div>
            )}

            {phase === 'collecting' && candidates.length >= numRequired && (
              <button className="btn-evaluate" onClick={handleEvaluate}>
                Valuta le mie candidate
              </button>
            )}
          </div>

          {/* Riflessione o Feedback */}
          {showReflection && reflectionContext ? (
            <ReflectionPrompt
              onReflect={handleReflection}
              onSkip={handleReflectionSkip}
              errorContext={reflectionContext}
            />
          ) : (
            <FeedbackBox
              type={feedback.type}
              message={feedback.message}
              onReset={handleReset}
              showReset={sequenceComplete && !showSummary}
            />
          )}
        </div>
      </main>

      {/* Riepilogo */}
      {showSummary && completedSession && (
        <LessonSummary
          session={completedSession}
          lessonTitle={lesson.titolo}
          onRepeat={handleReset}
          onExit={onExit}
        />
      )}
    </div>
  )
}

export default CandidateSequencePlayer
