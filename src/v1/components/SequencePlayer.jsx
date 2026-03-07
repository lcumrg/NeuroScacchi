import { useState, useEffect, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'
import ChessboardComponent from './ChessboardComponent'
import IntentPanel from './IntentPanel'
import FeedbackBox from './FeedbackBox'
import ProfilassiRadar from './ProfilassiRadar'
import ReflectionPrompt from './ReflectionPrompt'
import MetacognitivePrompt from './MetacognitivePrompt'
import LessonSummary from './LessonSummary'
import { createSession, saveSession } from '../utils/storageManager'
import { generateConfrontation } from '../utils/confrontation'
import './SequencePlayer.css'

function SequencePlayer({ lesson, esameMode = false, onComplete, onExit }) {
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

  // v5.0 Metacognitive questions
  const [showMetacognitive, setShowMetacognitive] = useState(false)
  const [metacognitiveQuestion, setMetacognitiveQuestion] = useState(null)
  const [metacognitivePendingAction, setMetacognitivePendingAction] = useState(null)

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

  // v5.0: Seleziona domanda metacognitiva random
  const pickMetacognitiveQuestion = () => {
    const domande = lesson.metacognizione?.domande
    if (!domande || domande.length === 0) return null
    return domande[Math.floor(Math.random() * domande.length)]
  }

  const tryShowMetacognitiveForStep = (step, pendingAction) => {
    if (!step.mostra_metacognitiva || esameMode) return false
    const question = pickMetacognitiveQuestion()
    if (!question) return false

    setMetacognitiveQuestion(question)
    setMetacognitivePendingAction(() => pendingAction)
    setShowMetacognitive(true)
    return true
  }

  const handleMetacognitiveAnswer = (answer) => {
    if (sessionRef.current) {
      if (!sessionRef.current.metacognitive) sessionRef.current.metacognitive = []
      sessionRef.current.metacognitive.push({
        question: metacognitiveQuestion,
        answer,
        step: currentStepIndex + 1,
        timestamp: Date.now()
      })
    }
    setShowMetacognitive(false)
    setMetacognitiveQuestion(null)
    if (metacognitivePendingAction) {
      metacognitivePendingAction()
      setMetacognitivePendingAction(null)
    }
  }

  const handleMetacognitiveSkip = () => {
    setShowMetacognitive(false)
    setMetacognitiveQuestion(null)
    if (metacognitivePendingAction) {
      metacognitivePendingAction()
      setMetacognitivePendingAction(null)
    }
  }

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

    setFeedback({ type: 'neutral', message: '' })
    setHighlightedSquares([])
    setArrows([])
    setShowReflection(false)
    setReflectionContext(null)

    // Orientamento
    if (lesson.parametri?.orientamento_scacchiera) {
      setBoardOrientation(lesson.parametri.orientamento_scacchiera)
    }

    // Esame mode: niente freeze, niente intent, scacchiera subito attiva
    if (esameMode) {
      setIsFrozen(false)
      setIntentSelected(true)
      setCooldownActive(false)
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
        message: `Esame - Step ${currentStepIndex + 1}/${totalSteps}: Esegui la mossa corretta.`
      })
      return
    }

    setIsFrozen(true)
    setIntentSelected(false)
    setCooldownActive(true)

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

      // Mostra chunking se presente (non in esame mode)
      if (currentStep.mostra_chunk_visivo && !esameMode) {
        setHighlightedSquares(currentStep.mostra_chunk_visivo)
      }
      if (currentStep.frecce_pattern && !esameMode) {
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

    // Profilassi? (non in esame mode)
    if (lesson.parametri?.usa_profilassi && !esameMode) {
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

    if (lesson.parametri?.usa_profilassi && !esameMode) {
      setPendingMove({ from: promoteFromSquare, to: promoteToSquare, promotion: promotionPiece })
      setShowProfilassi(true)
      promotionHandledRef.current = true
      return true
    }

    const result = executeMove(promoteFromSquare, promoteToSquare, promotionPiece)
    if (result) promotionHandledRef.current = true
    return result
  }

  const executeMove = (sourceSquare, targetSquare, promotion = 'q', confidenceLevel = null) => {
    const preMoveFen = position

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

        // Genera confronto metacognitivo se la profilassi ha raccolto la fiducia
        let confrontation = null
        if (confidenceLevel) {
          const customMessages = lesson.parametri?.profilassi?.messaggi_confronto || null
          confrontation = generateConfrontation(confidenceLevel, isCorrect, preMoveFen, customMessages)

          // v4.0: salva dati calibrazione nella sessione
          if (sessionRef.current) {
            if (!sessionRef.current.calibrations) sessionRef.current.calibrations = []
            sessionRef.current.calibrations.push({
              step: currentStepIndex + 1,
              move: moveNotation,
              confidence: confidenceLevel,
              correct: isCorrect,
              confrontation: confrontation.message,
              timestamp: Date.now()
            })
          }
        }

        const extraDelay = confrontation ? 1500 : 0

        if (isCorrect) {
          // Mossa corretta
          if (isLastStep) {
            // Ultimo step - lezione completata
            setFeedback({
              type: 'positive',
              message: lesson.feedback_finale || currentStep.feedback_finale ||
                      'Sequenza completata! Hai dimostrato ottima pianificazione strategica.',
              confrontation
            })

            // v4.0: finalizza e salva sessione
            if (sessionRef.current) {
              sessionRef.current.phases.move.end = Date.now()
              sessionRef.current.completed = true
              sessionRef.current.completedAt = Date.now()
              saveSession(sessionRef.current)
              setCompletedSession({ ...sessionRef.current })
            }

            // v5.0: metacognitive dopo ultimo step
            const finishFn = () => {
              setSequenceComplete(true)
              setShowSummary(true)
              onComplete()
            }
            safeTimeout(() => {
              const shown = tryShowMetacognitiveForStep(currentStep, finishFn)
              if (!shown) finishFn()
            }, 2000 + extraDelay)
          } else {
            // Step intermedio - passa al prossimo
            setFeedback({
              type: 'positive',
              message: currentStep.feedback || 'Ottimo! Prossimo step...',
              confrontation
            })
            // v5.0: metacognitive dopo step intermedio
            const nextStepFn = () => {
              setCurrentStepIndex(currentStepIndex + 1)
            }
            safeTimeout(() => {
              const shown = tryShowMetacognitiveForStep(currentStep, nextStepFn)
              if (!shown) nextStepFn()
            }, 2000 + extraDelay)
          }
        } else {
          // Mossa accettabile ma non ottima
          setFeedback({
            type: 'positive',
            message: 'Mossa accettabile, ma ce n\'era una migliore.',
            confrontation
          })
          if (!isLastStep) {
            const nextStepFn = () => {
              setCurrentStepIndex(currentStepIndex + 1)
            }
            safeTimeout(() => {
              const shown = tryShowMetacognitiveForStep(currentStep, nextStepFn)
              if (!shown) nextStepFn()
            }, 2500 + extraDelay)
          } else {
            // Ultimo step: completa la sequenza anche con mossa accettabile
            const finishFn = () => {
              setSequenceComplete(true)
              setShowSummary(true)
              onComplete()
            }
            safeTimeout(() => {
              const shown = tryShowMetacognitiveForStep(currentStep, finishFn)
              if (!shown) finishFn()
            }, 2500 + extraDelay)
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
    setShowMetacognitive(false)
    setMetacognitiveQuestion(null)
    setMetacognitivePendingAction(null)
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
          {esameMode && '📝 Esame - '}Step {currentStepIndex + 1} di {totalSteps}
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
          {/* Profilassi: sostituisce il pannello laterale (non in esame mode) */}
          {showProfilassi && pendingMove && !esameMode ? (
            <ProfilassiRadar
              position={position}
              move={pendingMove}
              config={lesson.parametri?.profilassi}
              onConfirm={(confidenceLevel) => {
                setShowProfilassi(false)
                setProfilassiSquareStyles({})
                executeMove(pendingMove.from, pendingMove.to, pendingMove.promotion || 'q', confidenceLevel)
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
              {!esameMode && (
                <IntentPanel
                  question={currentStep.domanda}
                  options={currentStep.opzioni_risposta}
                  onSelect={handleIntentSelection}
                  disabled={intentSelected || cooldownActive}
                  cooldownActive={cooldownActive}
                />
              )}

              {/* v5.0: Domanda metacognitiva */}
              {showMetacognitive && metacognitiveQuestion ? (
                <MetacognitivePrompt
                  question={metacognitiveQuestion}
                  onAnswer={handleMetacognitiveAnswer}
                  onSkip={handleMetacognitiveSkip}
                />
              ) : showReflection && reflectionContext ? (
                <ReflectionPrompt
                  onReflect={handleReflection}
                  onSkip={handleReflectionSkip}
                  errorContext={reflectionContext}
                />
              ) : (
                <FeedbackBox
                  type={feedback.type}
                  message={feedback.message}
                  confrontation={feedback.confrontation}
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
