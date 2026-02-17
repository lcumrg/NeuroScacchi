import { useState, useEffect, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'
import ChessboardComponent from './ChessboardComponent'
import IntentPanel from './IntentPanel'
import FeedbackBox from './FeedbackBox'
import ProfilassiRadar from './ProfilassiRadar'
import ReflectionPrompt from './ReflectionPrompt'
import LessonSummary from './LessonSummary'
import { createSession, saveSession } from '../utils/storageManager'
import './SequencePlayer.css'

function SequencePlayer({ lesson, onComplete, onExit }) {
  const gameRef = useRef(new Chess())
  const game = gameRef.current
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [position, setPosition] = useState('')
  const [isFrozen, setIsFrozen] = useState(true)
  const [intentSelected, setIntentSelected] = useState(false)
  const [feedback, setFeedback] = useState({ type: 'neutral', message: '' })
  const [highlightedSquares, setHighlightedSquares] = useState([])
  const [arrows, setArrows] = useState([])
  const [boardOrientation, setBoardOrientation] = useState('white')
  const [cooldownActive, setCooldownActive] = useState(true)
  const [showProfilassi, setShowProfilassi] = useState(false)
  const [pendingMove, setPendingMove] = useState(null)
  const [profilassiSquareStyles, setProfilassiSquareStyles] = useState({})
  const timersRef = useRef([])
  const promotionHandledRef = useRef(false)

  // v4.0 Metacognizione state
  const sessionRef = useRef(null)
  const [showReflection, setShowReflection] = useState(false)
  const [reflectionContext, setReflectionContext] = useState(null)
  const [showSummary, setShowSummary] = useState(false)
  const [completedSession, setCompletedSession] = useState(null)
  const [sequenceComplete, setSequenceComplete] = useState(false)

  const clearAllTimers = () => {
    timersRef.current.forEach(id => clearTimeout(id))
    timersRef.current = []
  }
  const safeTimeout = (fn, ms) => {
    const id = setTimeout(fn, ms)
    timersRef.current.push(id)
    return id
  }

  // Cleanup timer al dismount
  useEffect(() => {
    return () => clearAllTimers()
  }, [])

  const currentStep = lesson.steps[currentStepIndex]
  const totalSteps = lesson.steps.length
  const isLastStep = currentStepIndex === totalSteps - 1

  // v4.0: inizializza sessione al primo mount
  useEffect(() => {
    sessionRef.current = createSession(lesson.id)
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

    setIsFrozen(true)
    setIntentSelected(false)
    setFeedback({ type: 'neutral', message: '' })
    setHighlightedSquares([])
    setArrows([])
    setCooldownActive(true)
    setShowReflection(false)
    setReflectionContext(null)

    // Orientamento
    if (lesson.parametri?.orientamento_scacchiera) {
      setBoardOrientation(lesson.parametri.orientamento_scacchiera)
    }

    // v4.0: traccia inizio fase freeze per lo step
    if (sessionRef.current && currentStepIndex === 0) {
      sessionRef.current.phases.freeze.start = Date.now()
    }

    // Freeze iniziale
    const freezeTime = lesson.parametri?.tempo_freeze || 1500
    safeTimeout(() => {
      setCooldownActive(false)

      // v4.0: traccia transizione freeze -> intent
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
        message: `Step ${currentStepIndex + 1}/${totalSteps}: ${currentStep.domanda}`
      })
    }, freezeTime)
  }, [currentStepIndex])

  // Gestione Intent
  const handleIntentSelection = (selectedIntent) => {
    const isCorrect = selectedIntent === currentStep.risposta_corretta

    // v4.0: traccia tentativo
    if (sessionRef.current) {
      sessionRef.current.intentAttempts++
    }

    if (isCorrect) {
      // v4.0: se ultimo step corretto, segna transizione intent -> move
      if (sessionRef.current && !sessionRef.current.phases.intent.end) {
        sessionRef.current.phases.intent.end = Date.now()
        sessionRef.current.phases.move.start = Date.now()
      }

      setFeedback({
        type: 'positive',
        message: currentStep.feedback || 'Corretto!'
      })

      // Mostra chunking se presente
      if (currentStep.mostra_chunk_visivo) {
        setHighlightedSquares(currentStep.mostra_chunk_visivo)
      }
      if (currentStep.frecce_pattern) {
        setArrows(currentStep.frecce_pattern)
      }

      safeTimeout(() => {
        setIsFrozen(false)
        setIntentSelected(true)
      }, 800)
    } else {
      // v4.0: traccia errore intent
      if (sessionRef.current) {
        sessionRef.current.intentErrors.push({
          step: currentStepIndex + 1,
          selected: selectedIntent,
          correct: currentStep.risposta_corretta,
          timestamp: Date.now()
        })
      }

      setFeedback({
        type: 'negative',
        message: currentStep.feedback_negativo || 'Riprova, pensa meglio al piano strategico.'
      })

      // v4.0: mostra riflessione dopo il secondo errore
      if (sessionRef.current && sessionRef.current.intentErrors.length >= 2) {
        safeTimeout(() => {
          setReflectionContext({ phase: 'intent', step: currentStepIndex + 1, selected: selectedIntent })
          setShowReflection(true)
        }, 1500)
      }
    }
  }

  // v4.0: gestione riflessione
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

  // Controlla se una mossa e' una promozione (per la libreria react-chessboard)
  const handlePromotionCheck = (sourceSquare, targetSquare, piece) => {
    const isPromo = ((piece === "wP" && sourceSquare[1] === "7" && targetSquare[1] === "8") ||
                     (piece === "bP" && sourceSquare[1] === "2" && targetSquare[1] === "1")) &&
                    Math.abs(sourceSquare.charCodeAt(0) - targetSquare.charCodeAt(0)) <= 1
    if (!isPromo) return false

    const moveNotation = sourceSquare + targetSquare
    if (currentStep.mosse_consentite &&
        !currentStep.mosse_consentite.includes(moveNotation)) {
      return false
    }

    return true
  }

  // Gestione mossa
  const onDrop = (sourceSquare, targetSquare) => {
    if (promotionHandledRef.current) {
      promotionHandledRef.current = false
      return true
    }

    if (isFrozen) return false

    const moveNotation = sourceSquare + targetSquare

    // v4.0: traccia tentativo mossa
    if (sessionRef.current) {
      sessionRef.current.moveAttempts++
    }

    // Verifica mossa consentita
    if (currentStep.mosse_consentite &&
        !currentStep.mosse_consentite.includes(moveNotation)) {
      // v4.0: traccia errore mossa
      if (sessionRef.current) {
        sessionRef.current.moveErrors.push({
          type: 'wrong_move',
          step: currentStepIndex + 1,
          attempted: moveNotation,
          timestamp: Date.now()
        })
      }

      setFeedback({
        type: 'negative',
        message: 'Questa mossa non è ottimale per il piano scelto.'
      })

      // v4.0: mostra riflessione dopo il secondo errore mossa
      if (sessionRef.current && sessionRef.current.moveErrors.length >= 2) {
        safeTimeout(() => {
          setReflectionContext({ phase: 'move', step: currentStepIndex + 1, attempted: moveNotation })
          setShowReflection(true)
        }, 1500)
      }

      return false
    }

    // Profilassi?
    if (lesson.parametri?.usa_profilassi) {
      setPendingMove({ from: sourceSquare, to: targetSquare })
      setShowProfilassi(true)
      return false
    }

    return executeMove(sourceSquare, targetSquare)
  }

  // Callback quando l'utente sceglie il pezzo di promozione dal dialog della libreria
  const handlePromotionPieceSelect = (piece, promoteFromSquare, promoteToSquare) => {
    if (!piece || !promoteFromSquare || !promoteToSquare) {
      return false
    }
    const promotionPiece = piece[1].toLowerCase()

    if (lesson.parametri?.usa_profilassi) {
      setPendingMove({ from: promoteFromSquare, to: promoteToSquare, promotion: promotionPiece })
      setShowProfilassi(true)
      promotionHandledRef.current = true
      return true
    }

    const result = executeMove(promoteFromSquare, promoteToSquare, promotionPiece)
    if (result) promotionHandledRef.current = true
    return result
  }

  const executeMove = (sourceSquare, targetSquare, promotion = 'q') => {
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion
      })

      if (move) {
        const newPosition = game.fen()
        setPosition(newPosition)

        const moveNotation = sourceSquare + targetSquare
        const isCorrect = currentStep.mosse_corrette?.includes(moveNotation)

        if (isCorrect) {
          // Mossa corretta
          if (isLastStep) {
            // Ultimo step - lezione completata
            setFeedback({
              type: 'positive',
              message: lesson.feedback_finale || currentStep.feedback_finale ||
                      '🎉 Sequenza completata! Hai dimostrato ottima pianificazione strategica.'
            })

            // v4.0: finalizza e salva sessione
            if (sessionRef.current) {
              sessionRef.current.phases.move.end = Date.now()
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
          } else {
            // Step intermedio - passa al prossimo
            setFeedback({
              type: 'positive',
              message: currentStep.feedback || 'Ottimo! Prossimo step...'
            })
            safeTimeout(() => {
              setCurrentStepIndex(currentStepIndex + 1)
            }, 2000)
          }
        } else {
          // Mossa accettabile ma non ottima
          setFeedback({
            type: 'positive',
            message: 'Mossa accettabile, ma ce n\'era una migliore.'
          })
          if (!isLastStep) {
            safeTimeout(() => {
              setCurrentStepIndex(currentStepIndex + 1)
            }, 2500)
          }
        }

        return true
      }
    } catch (e) {
      return false
    }
    return false
  }

  // Callback stabile per evidenziazione profilassi sulla scacchiera
  const handleProfilassiHighlight = useCallback((styles) => {
    setProfilassiSquareStyles(styles)
  }, [])

  const handleReset = () => {
    clearAllTimers()
    setShowSummary(false)
    setShowReflection(false)
    setCompletedSession(null)
    setSequenceComplete(false)
    // v4.0: nuova sessione
    sessionRef.current = createSession(lesson.id)
    setCurrentStepIndex(0)
  }

  return (
    <div className="sequence-player">
      {/* Progress Bar */}
      <div className="sequence-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>
        <div className="progress-text">
          Step {currentStepIndex + 1} di {totalSteps}
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content">
        <div className="chess-section">
          <div className="lesson-title">
            <h2>{lesson.titolo}</h2>
            <p className="lesson-description">{lesson.descrizione}</p>
          </div>

          <ChessboardComponent
            position={position}
            onDrop={onDrop}
            isFrozen={isFrozen}
            highlightedSquares={highlightedSquares}
            boardOrientation={boardOrientation}
            arrows={arrows}
            onPromotionPieceSelect={handlePromotionPieceSelect}
            onPromotionCheck={handlePromotionCheck}
            profilassiSquareStyles={profilassiSquareStyles}
          />
        </div>

        <div className="intent-section">
          {/* Profilassi: sostituisce il pannello laterale (la scacchiera resta visibile) */}
          {showProfilassi && pendingMove ? (
            <ProfilassiRadar
              position={position}
              move={pendingMove}
              onConfirm={() => {
                setShowProfilassi(false)
                setProfilassiSquareStyles({})
                executeMove(pendingMove.from, pendingMove.to, pendingMove.promotion || 'q')
                setPendingMove(null)
              }}
              onCancel={() => {
                setShowProfilassi(false)
                setProfilassiSquareStyles({})
                setPendingMove(null)
              }}
              onHighlightChange={handleProfilassiHighlight}
            />
          ) : (
            <>
              <IntentPanel
                question={currentStep.domanda}
                options={currentStep.opzioni_risposta}
                onSelect={handleIntentSelection}
                disabled={intentSelected || cooldownActive}
                cooldownActive={cooldownActive}
              />

              {/* v4.0: Riflessione post-errore */}
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
            </>
          )}
        </div>
      </main>

      {/* v4.0: Schermata riepilogo post-lezione */}
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

export default SequencePlayer
