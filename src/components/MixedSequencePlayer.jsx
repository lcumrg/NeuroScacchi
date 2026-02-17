import { useState, useEffect, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import IntentPanel from './IntentPanel'
import FeedbackBox from './FeedbackBox'
import ProfilassiRadar from './ProfilassiRadar'
import ReflectionPrompt from './ReflectionPrompt'
import MetacognitivePrompt from './MetacognitivePrompt'
import LessonSummary from './LessonSummary'
import { createSession, saveSession } from '../utils/storageManager'
import { generateConfrontation } from '../utils/confrontation'
import './MixedSequencePlayer.css'

const BOARD_SIZE = 480
const MAX_CANDIDATES = 5

function MixedSequencePlayer({ lesson, esameMode = false, onComplete, onExit }) {
  const gameRef = useRef(new Chess())
  const game = gameRef.current

  // Sequence state
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [position, setPosition] = useState('')
  const [boardOrientation, setBoardOrientation] = useState('white')

  // Phase: freeze | intent_question | intent_move | detective_click |
  //        collecting | evaluated | candidate_move
  const [phase, setPhase] = useState('freeze')

  // Intent state
  const [intentSelected, setIntentSelected] = useState(false)
  const [cooldownActive, setCooldownActive] = useState(true)
  const [highlightedSquares, setHighlightedSquares] = useState([])
  const [arrows, setArrows] = useState([])

  // Detective state
  const [detectiveClickedSquare, setDetectiveClickedSquare] = useState(null)
  const [detectiveAttempts, setDetectiveAttempts] = useState(0)
  const [detectiveShowSolution, setDetectiveShowSolution] = useState(false)

  // Candidate state
  const [candidates, setCandidates] = useState([])
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [legalTargets, setLegalTargets] = useState([])

  // Profilassi
  const [showProfilassi, setShowProfilassi] = useState(false)
  const [pendingMove, setPendingMove] = useState(null)
  const [profilassiSquareStyles, setProfilassiSquareStyles] = useState({})

  // Feedback & completion
  const [feedback, setFeedback] = useState({ type: 'neutral', message: '' })
  const [sequenceComplete, setSequenceComplete] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [completedSession, setCompletedSession] = useState(null)

  // Metacognizione
  const sessionRef = useRef(null)
  const [showReflection, setShowReflection] = useState(false)
  const [reflectionContext, setReflectionContext] = useState(null)
  const [showMetacognitive, setShowMetacognitive] = useState(false)
  const [metacognitiveQuestion, setMetacognitiveQuestion] = useState(null)
  const [metacognitivePendingAction, setMetacognitivePendingAction] = useState(null)

  const timersRef = useRef([])
  const promotionHandledRef = useRef(false)

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
  const stepType = currentStep.tipo_step

  // Candidate per-step data
  const numRequired = stepType === 'candidate'
    ? (currentStep.num_candidate || lesson.parametri?.num_candidate || 2) : 0
  const goodMoves = stepType === 'candidate' ? (currentStep.mosse_candidate || []) : []
  const bestMove = stepType === 'candidate' ? currentStep.mossa_migliore : null

  // --- Metacognitive ---
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
        question: metacognitiveQuestion, answer,
        step: currentStepIndex + 1, stepType, timestamp: Date.now()
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

  // --- Session init ---
  useEffect(() => {
    sessionRef.current = createSession(lesson.id)
    if (!sessionRef.current.stepErrors) sessionRef.current.stepErrors = []
    if (!sessionRef.current.candidateAccuracyPerStep) sessionRef.current.candidateAccuracyPerStep = []
  }, [lesson.id])

  // --- Step initialization ---
  useEffect(() => {
    clearAllTimers()
    const stepFen = currentStep.fen_aggiornata || lesson.fen

    try {
      game.load(stepFen)
      setPosition(stepFen)
    } catch (e) {
      setFeedback({ type: 'negative', message: 'Errore: posizione FEN non valida.' })
      return
    }

    // Reset per-step state
    setFeedback({ type: 'neutral', message: '' })
    setHighlightedSquares([])
    setArrows([])
    setShowReflection(false)
    setReflectionContext(null)
    setIntentSelected(false)
    setCooldownActive(true)
    setDetectiveClickedSquare(null)
    setDetectiveAttempts(0)
    setDetectiveShowSolution(false)
    setCandidates([])
    setSelectedSquare(null)
    setLegalTargets([])
    setShowProfilassi(false)
    setPendingMove(null)
    setProfilassiSquareStyles({})

    if (lesson.parametri?.orientamento_scacchiera) {
      setBoardOrientation(lesson.parametri.orientamento_scacchiera)
    }

    // Esame mode: skip freeze
    if (esameMode) {
      if (sessionRef.current) {
        sessionRef.current.isEsame = true
        if (currentStepIndex === 0) {
          sessionRef.current.phases.freeze.end = Date.now()
          sessionRef.current.phases.intent.end = Date.now()
          sessionRef.current.phases.move.start = Date.now()
        }
      }
      if (stepType === 'intent') {
        setPhase('intent_move')
        setIntentSelected(true)
        setCooldownActive(false)
      } else if (stepType === 'detective') {
        setPhase('detective_click')
      } else if (stepType === 'candidate') {
        setPhase('candidate_move')
      }
      setFeedback({
        type: 'neutral',
        message: `Esame - Step ${currentStepIndex + 1}/${totalSteps}: ${
          stepType === 'detective' ? 'Trova la casa corretta.' : 'Esegui la mossa corretta.'}`
      })
      return
    }

    // Normal: freeze
    setPhase('freeze')
    if (sessionRef.current && currentStepIndex === 0) {
      sessionRef.current.phases.freeze.start = Date.now()
    }

    const freezeTime = lesson.parametri?.tempo_freeze || 1500
    safeTimeout(() => {
      if (sessionRef.current) {
        if (currentStepIndex === 0) sessionRef.current.phases.freeze.end = Date.now()
        if (!sessionRef.current.phases.intent.start) sessionRef.current.phases.intent.start = Date.now()
      }
      setCooldownActive(false)

      if (stepType === 'intent') {
        setPhase('intent_question')
        setFeedback({ type: 'neutral', message: `Step ${currentStepIndex + 1}/${totalSteps}: ${currentStep.domanda}` })
      } else if (stepType === 'detective') {
        setPhase('detective_click')
        setFeedback({ type: 'neutral', message: `Step ${currentStepIndex + 1}/${totalSteps}: ${currentStep.domanda}` })
      } else if (stepType === 'candidate') {
        setPhase('collecting')
        setFeedback({
          type: 'neutral',
          message: `Step ${currentStepIndex + 1}/${totalSteps}: ${currentStep.descrizione_step || `Identifica almeno ${numRequired} mosse candidate.`}`
        })
      }
    }, freezeTime)
  }, [currentStepIndex])

  // --- Advance or complete ---
  const advanceOrComplete = () => {
    if (isLastStep) {
      setFeedback({
        type: 'positive',
        message: lesson.feedback_finale || currentStep.feedback_finale ||
          'Sequenza completata!'
      })
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
      const finishFn = () => { setSequenceComplete(true); setShowSummary(true); onComplete() }
      safeTimeout(() => {
        const shown = tryShowMetacognitiveForStep(currentStep, finishFn)
        if (!shown) finishFn()
      }, 2000)
    } else {
      const nextFn = () => setCurrentStepIndex(currentStepIndex + 1)
      safeTimeout(() => {
        const shown = tryShowMetacognitiveForStep(currentStep, nextFn)
        if (!shown) nextFn()
      }, 2000)
    }
  }

  // ====================
  // INTENT handlers
  // ====================
  const handleIntentSelection = (selectedIntent) => {
    const isCorrect = selectedIntent === currentStep.risposta_corretta
    if (sessionRef.current) sessionRef.current.intentAttempts++

    if (isCorrect) {
      if (sessionRef.current && !sessionRef.current.phases.intent.end) {
        sessionRef.current.phases.intent.end = Date.now()
        sessionRef.current.phases.move.start = Date.now()
      }
      setFeedback({ type: 'positive', message: currentStep.feedback || 'Corretto!' })
      if (currentStep.mostra_chunk_visivo && !esameMode) setHighlightedSquares(currentStep.mostra_chunk_visivo)
      if (currentStep.frecce_pattern && !esameMode) setArrows(currentStep.frecce_pattern)
      safeTimeout(() => { setPhase('intent_move'); setIntentSelected(true) }, 800)
    } else {
      if (sessionRef.current) {
        sessionRef.current.intentErrors.push({
          step: currentStepIndex + 1, selected: selectedIntent,
          correct: currentStep.risposta_corretta, timestamp: Date.now()
        })
      }
      setFeedback({ type: 'negative', message: currentStep.feedback_negativo || 'Riprova, pensa meglio al piano strategico.' })
      if (sessionRef.current && sessionRef.current.intentErrors.length >= 2) {
        safeTimeout(() => {
          setReflectionContext({ phase: 'intent', step: currentStepIndex + 1, selected: selectedIntent })
          setShowReflection(true)
        }, 1500)
      }
    }
  }

  // ====================
  // DETECTIVE handlers
  // ====================
  const handleDetectiveSquareClick = (square) => {
    if (phase !== 'detective_click') return
    const correctSquare = currentStep.risposta_corretta_casa
    setDetectiveClickedSquare(square)

    if (square === correctSquare) {
      setFeedback({ type: 'positive', message: currentStep.feedback_positivo || currentStep.feedback || 'Esatto!' })
      safeTimeout(() => advanceOrComplete(), 1500)
    } else {
      const newAttempts = detectiveAttempts + 1
      setDetectiveAttempts(newAttempts)
      if (sessionRef.current) {
        sessionRef.current.moveErrors.push({
          type: 'detective', step: currentStepIndex + 1,
          attempted: square, correct: correctSquare, timestamp: Date.now()
        })
      }
      const maxAttempts = currentStep.max_tentativi || 3
      setFeedback({ type: 'negative', message: currentStep.feedback_negativo || 'Casa sbagliata. Riprova!' })
      if (newAttempts >= maxAttempts) {
        setDetectiveShowSolution(true)
        setFeedback({ type: 'negative', message: `La casa corretta era: ${correctSquare}` })
        safeTimeout(() => advanceOrComplete(), 3000)
      } else {
        safeTimeout(() => setDetectiveClickedSquare(null), 1000)
      }
    }
  }

  // ====================
  // CANDIDATE handlers
  // ====================
  const handleCandidateSquareClick = (square) => {
    if (phase !== 'collecting') return
    if (candidates.length >= MAX_CANDIDATES && !selectedSquare) return

    const pieceMoves = game.moves({ square, verbose: true })
    const hasPiece = pieceMoves.length > 0

    if (selectedSquare) {
      if (hasPiece && square !== selectedSquare) {
        setSelectedSquare(square)
        setLegalTargets(pieceMoves.map(m => m.to))
        return
      }
      if (legalTargets.includes(square)) {
        const moveNotation = selectedSquare + square
        const isDuplicate = candidates.some(c => c.notation === moveNotation)
        if (!isDuplicate && candidates.length < MAX_CANDIDATES) {
          setCandidates(prev => [...prev, { from: selectedSquare, to: square, notation: moveNotation }])
        }
      }
      setSelectedSquare(null)
      setLegalTargets([])
    } else if (hasPiece) {
      setSelectedSquare(square)
      setLegalTargets(pieceMoves.map(m => m.to))
    }
  }

  const removeCandidate = (index) => setCandidates(prev => prev.filter((_, i) => i !== index))

  const handleEvaluate = () => {
    setSelectedSquare(null)
    setLegalTargets([])

    const stepAccuracy = {
      step: currentStepIndex + 1,
      proposed: candidates.map(c => c.notation),
      goodFound: candidates.filter(c => goodMoves.includes(c.notation)).length,
      badSelected: candidates.filter(c => !goodMoves.includes(c.notation)).length,
      totalGood: goodMoves.length
    }
    if (sessionRef.current) {
      sessionRef.current.candidateAccuracyPerStep.push(stepAccuracy)
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
      setFeedback({ type: 'positive', message: `Ottimo! Hai identificato ${goodFound.length} mosse valide su ${goodMoves.length}. Ora gioca la mossa migliore!` })
    } else if (goodFound.length > 0) {
      setFeedback({ type: 'neutral', message: `Hai trovato ${goodFound.length} mosse buone, ma anche ${badFound.length} meno efficaci. Ora gioca la migliore!` })
    } else {
      setFeedback({ type: 'negative', message: 'Nessuna delle mosse selezionate era tra le migliori. Ora prova a giocare la mossa ottimale.' })
      if (sessionRef.current) {
        sessionRef.current.intentErrors.push({
          step: currentStepIndex + 1, selected: candidates.map(c => c.notation),
          correct: goodMoves, timestamp: Date.now()
        })
        if (sessionRef.current.intentErrors.length >= 2) {
          safeTimeout(() => {
            setReflectionContext({ phase: 'candidate_evaluation', step: currentStepIndex + 1, selected: candidates.map(c => c.notation) })
            setShowReflection(true)
          }, 1500)
        }
      }
    }

    safeTimeout(() => {
      setPhase('candidate_move')
      setFeedback({ type: 'neutral', message: 'Trascina il pezzo per eseguire la mossa che ritieni migliore.' })
    }, 2500)
  }

  // ====================
  // MOVE execution
  // ====================
  const handlePromotionCheck = (sourceSquare, targetSquare, piece) => {
    const isPromo = ((piece === "wP" && sourceSquare[1] === "7" && targetSquare[1] === "8") ||
                     (piece === "bP" && sourceSquare[1] === "2" && targetSquare[1] === "1")) &&
                    Math.abs(sourceSquare.charCodeAt(0) - targetSquare.charCodeAt(0)) <= 1
    if (!isPromo) return false
    if (stepType === 'intent' && currentStep.mosse_consentite) {
      if (!currentStep.mosse_consentite.includes(sourceSquare + targetSquare)) return false
    }
    return true
  }

  const onDrop = (sourceSquare, targetSquare) => {
    if (promotionHandledRef.current) { promotionHandledRef.current = false; return true }
    if (phase !== 'intent_move' && phase !== 'candidate_move') return false

    const moveNotation = sourceSquare + targetSquare
    if (sessionRef.current) sessionRef.current.moveAttempts++

    if (stepType === 'intent') {
      if (currentStep.mosse_consentite && !currentStep.mosse_consentite.includes(moveNotation)) {
        if (sessionRef.current) {
          sessionRef.current.moveErrors.push({ type: 'wrong_move', step: currentStepIndex + 1, attempted: moveNotation, timestamp: Date.now() })
        }
        setFeedback({ type: 'negative', message: 'Questa mossa non e\' ottimale per il piano scelto.' })
        if (sessionRef.current && sessionRef.current.moveErrors.length >= 2) {
          safeTimeout(() => {
            setReflectionContext({ phase: 'move', step: currentStepIndex + 1, attempted: moveNotation })
            setShowReflection(true)
          }, 1500)
        }
        return false
      }
      if (lesson.parametri?.usa_profilassi && !esameMode) {
        setPendingMove({ from: sourceSquare, to: targetSquare })
        setShowProfilassi(true)
        return false
      }
      return executeIntentMove(sourceSquare, targetSquare)
    } else {
      return executeCandidateMove(sourceSquare, targetSquare)
    }
  }

  const handlePromotionPieceSelect = (piece, promoteFromSquare, promoteToSquare) => {
    if (!piece || !promoteFromSquare || !promoteToSquare) return false
    const promotionPiece = piece[1].toLowerCase()
    if (stepType === 'intent' && lesson.parametri?.usa_profilassi && !esameMode) {
      setPendingMove({ from: promoteFromSquare, to: promoteToSquare, promotion: promotionPiece })
      setShowProfilassi(true)
      promotionHandledRef.current = true
      return true
    }
    const result = stepType === 'intent'
      ? executeIntentMove(promoteFromSquare, promoteToSquare, promotionPiece)
      : executeCandidateMove(promoteFromSquare, promoteToSquare, promotionPiece)
    if (result) promotionHandledRef.current = true
    return result
  }

  const executeIntentMove = (sourceSquare, targetSquare, promotion = 'q', confidenceLevel = null) => {
    const preMoveFen = position
    try {
      const move = game.move({ from: sourceSquare, to: targetSquare, promotion })
      if (move) {
        setPosition(game.fen())
        const moveNotation = sourceSquare + targetSquare
        const isCorrect = currentStep.mosse_corrette?.includes(moveNotation)

        let confrontation = null
        if (confidenceLevel) {
          const customMessages = lesson.parametri?.profilassi?.messaggi_confronto || null
          confrontation = generateConfrontation(confidenceLevel, isCorrect, preMoveFen, customMessages)
          if (sessionRef.current) {
            if (!sessionRef.current.calibrations) sessionRef.current.calibrations = []
            sessionRef.current.calibrations.push({
              step: currentStepIndex + 1, move: moveNotation,
              confidence: confidenceLevel, correct: isCorrect,
              confrontation: confrontation.message, timestamp: Date.now()
            })
          }
        }
        const extraDelay = confrontation ? 1500 : 0

        if (isCorrect) {
          setFeedback({ type: 'positive', message: currentStep.feedback || 'Ottimo!', confrontation })
        } else {
          setFeedback({ type: 'positive', message: 'Mossa accettabile, ma ce n\'era una migliore.', confrontation })
        }
        safeTimeout(() => advanceOrComplete(), 2000 + extraDelay)
        return true
      }
    } catch (e) { return false }
    return false
  }

  const executeCandidateMove = (sourceSquare, targetSquare, promotion = 'q') => {
    const moveNotation = sourceSquare + targetSquare
    try {
      const move = game.move({ from: sourceSquare, to: targetSquare, promotion })
      if (move) {
        setPosition(game.fen())
        const isBest = moveNotation === bestMove
        const isGood = goodMoves.includes(moveNotation)

        if (isBest || isGood) {
          const msg = isBest
            ? (currentStep.feedback_positivo || currentStep.feedback || 'Eccellente! Mossa migliore!')
            : (currentStep.feedback || 'Buona mossa! Ma ce n\'era una ancora migliore.')
          setFeedback({ type: 'positive', message: msg })
          advanceOrComplete()
        } else {
          if (sessionRef.current) {
            sessionRef.current.moveErrors.push({
              type: 'wrong_candidate_move', step: currentStepIndex + 1,
              attempted: moveNotation, timestamp: Date.now()
            })
            if (sessionRef.current.moveErrors.length >= 2) {
              safeTimeout(() => {
                setReflectionContext({ phase: 'move', step: currentStepIndex + 1, attempted: moveNotation })
                setShowReflection(true)
              }, 1500)
            }
          }
          const stepFen = currentStep.fen_aggiornata || lesson.fen
          game.load(stepFen)
          setPosition(stepFen)
          setFeedback({ type: 'negative', message: currentStep.feedback_negativo || 'Questa non era la mossa migliore. Riprova!' })
        }
        return true
      }
    } catch (e) { return false }
    return false
  }

  // ====================
  // Shared handlers
  // ====================
  const handleReflection = (reflection) => {
    if (sessionRef.current) sessionRef.current.reflections.push(reflection)
    setShowReflection(false)
    setReflectionContext(null)
  }
  const handleReflectionSkip = () => { setShowReflection(false); setReflectionContext(null) }

  const handleProfilassiHighlight = useCallback((styles) => {
    setProfilassiSquareStyles(styles)
  }, [])

  const handleSquareClick = (square) => {
    if (phase === 'detective_click') handleDetectiveSquareClick(square)
    else if (phase === 'collecting') handleCandidateSquareClick(square)
  }

  const handleReset = () => {
    clearAllTimers()
    setShowSummary(false)
    setShowReflection(false)
    setShowMetacognitive(false)
    setMetacognitiveQuestion(null)
    setMetacognitivePendingAction(null)
    setCompletedSession(null)
    setSequenceComplete(false)
    sessionRef.current = createSession(lesson.id)
    if (!sessionRef.current.stepErrors) sessionRef.current.stepErrors = []
    if (!sessionRef.current.candidateAccuracyPerStep) sessionRef.current.candidateAccuracyPerStep = []
    setCurrentStepIndex(0)
  }

  // ====================
  // Board styling
  // ====================
  const buildSquareStyles = () => {
    const styles = {}

    // Intent highlights
    if (stepType === 'intent') {
      highlightedSquares.forEach(sq => {
        styles[sq] = {
          background: 'radial-gradient(circle, rgba(255,193,7,0.6) 0%, rgba(255,193,7,0.2) 70%)',
          boxShadow: 'inset 0 0 0 3px rgba(255,193,7,0.8)'
        }
      })
    }

    // Detective click feedback
    if (stepType === 'detective') {
      const correctSq = currentStep.risposta_corretta_casa
      if (detectiveClickedSquare) {
        const ok = detectiveClickedSquare === correctSq
        styles[detectiveClickedSquare] = {
          background: ok
            ? 'radial-gradient(circle, rgba(76,175,80,0.8) 0%, rgba(76,175,80,0.3) 70%)'
            : 'radial-gradient(circle, rgba(244,67,54,0.8) 0%, rgba(244,67,54,0.3) 70%)',
          boxShadow: ok
            ? 'inset 0 0 0 4px rgba(76,175,80,1)'
            : 'inset 0 0 0 4px rgba(244,67,54,1)'
        }
      }
      if (detectiveShowSolution && correctSq) {
        styles[correctSq] = {
          background: 'radial-gradient(circle, rgba(255,193,7,0.8) 0%, rgba(255,193,7,0.3) 70%)',
          boxShadow: 'inset 0 0 0 4px rgba(255,193,7,1)'
        }
      }
    }

    // Candidate styles
    if (stepType === 'candidate') {
      if (selectedSquare) {
        styles[selectedSquare] = {
          background: 'radial-gradient(circle, rgba(255,193,7,0.7) 0%, rgba(255,193,7,0.3) 70%)',
          boxShadow: 'inset 0 0 0 3px rgba(255,193,7,1)'
        }
      }
      legalTargets.forEach(sq => {
        if (!candidates.some(c => c.to === sq && c.from === selectedSquare)) {
          styles[sq] = { background: 'radial-gradient(circle, rgba(33,150,243,0.5) 25%, transparent 25%)', borderRadius: '50%' }
        }
      })
      if (phase === 'collecting') {
        candidates.forEach(c => {
          styles[c.to] = {
            background: 'radial-gradient(circle, rgba(33,150,243,0.6) 0%, rgba(33,150,243,0.2) 70%)',
            boxShadow: 'inset 0 0 0 3px rgba(33,150,243,0.8)'
          }
        })
      }
      if (phase === 'evaluated' || phase === 'candidate_move') {
        candidates.forEach(c => {
          const isBest = c.notation === bestMove
          const isGood = goodMoves.includes(c.notation)
          styles[c.to] = {
            background: isBest
              ? 'radial-gradient(circle, rgba(255,193,7,0.7) 0%, rgba(255,193,7,0.3) 70%)'
              : isGood
                ? 'radial-gradient(circle, rgba(76,175,80,0.7) 0%, rgba(76,175,80,0.3) 70%)'
                : 'radial-gradient(circle, rgba(244,67,54,0.7) 0%, rgba(244,67,54,0.3) 70%)',
            boxShadow: isBest
              ? 'inset 0 0 0 3px rgba(255,193,7,1)' : isGood
                ? 'inset 0 0 0 3px rgba(76,175,80,1)' : 'inset 0 0 0 3px rgba(244,67,54,1)'
          }
        })
      }
    }

    if (Object.keys(profilassiSquareStyles).length > 0) Object.assign(styles, profilassiSquareStyles)
    return styles
  }

  const buildArrows = () => {
    if (stepType === 'intent' && arrows.length > 0) {
      return arrows.map(a => [a.from, a.to, 'rgb(76,175,80)'])
    }
    if (stepType === 'candidate' && candidates.length > 0) {
      return candidates.map(c => {
        if (phase === 'evaluated' || phase === 'candidate_move') {
          const isBest = c.notation === bestMove
          const isGood = goodMoves.includes(c.notation)
          return [c.from, c.to, isBest ? 'rgb(255,193,7)' : isGood ? 'rgb(76,175,80)' : 'rgb(244,67,54)']
        }
        return [c.from, c.to, 'rgb(33,150,243)']
      })
    }
    return []
  }

  const isDraggable = phase === 'intent_move' || phase === 'candidate_move'
  const isFrozen = phase === 'freeze'

  const stepTypeLabel = (type) => {
    if (type === 'intent') return 'I'
    if (type === 'detective') return 'D'
    if (type === 'candidate') return 'C'
    return '?'
  }

  const stepTypeName = (type) => {
    if (type === 'intent') return 'Intent'
    if (type === 'detective') return 'Detective'
    if (type === 'candidate') return 'Candidate'
    return ''
  }

  return (
    <div className="mixed-sequence-player">
      {/* Progress Bar */}
      <div className="sequence-progress">
        <div className="step-type-indicators">
          {lesson.steps.map((s, idx) => (
            <div
              key={idx}
              className={`step-indicator ${s.tipo_step} ${idx === currentStepIndex ? 'active' : ''} ${idx < currentStepIndex ? 'done' : ''}`}
              title={`Step ${idx + 1}: ${s.tipo_step}`}
            >
              {stepTypeLabel(s.tipo_step)}
            </div>
          ))}
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }} />
        </div>
        <div className="progress-text">
          {esameMode && 'Esame - '}Step {currentStepIndex + 1} di {totalSteps} ({stepTypeName(stepType)})
          {phase === 'freeze' && ' — Osserva...'}
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content">
        <div className="chess-section">
          <div className="lesson-title">
            <h2>{lesson.titolo}</h2>
            <p className="lesson-description">{lesson.descrizione}</p>
          </div>

          <div className={`chessboard-wrapper ${isFrozen ? 'frozen' : ''}`}>
            {isFrozen && (
              <div className="freeze-overlay">
                <div className="freeze-message">Osserva la posizione</div>
              </div>
            )}
            {phase === 'detective_click' && (
              <div className="detective-badge">Clicca la casa corretta</div>
            )}
            <Chessboard
              position={position}
              boardWidth={BOARD_SIZE}
              boardOrientation={boardOrientation}
              arePiecesDraggable={isDraggable}
              onPieceDrop={onDrop}
              onSquareClick={handleSquareClick}
              onPromotionPieceSelect={handlePromotionPieceSelect}
              promotionCheck={handlePromotionCheck}
              customSquareStyles={buildSquareStyles()}
              customArrows={buildArrows()}
              customBoardStyle={{
                borderRadius: '8px',
                boxShadow: 'var(--shadow-md)',
                cursor: phase === 'detective_click' ? 'crosshair'
                  : phase === 'collecting' ? 'pointer' : 'default'
              }}
              customLightSquareStyle={{ backgroundColor: 'var(--square-light)' }}
              customDarkSquareStyle={{ backgroundColor: 'var(--square-dark)' }}
            />
          </div>
        </div>

        <div className="intent-section">
          {/* Profilassi */}
          {showProfilassi && pendingMove && !esameMode ? (
            <ProfilassiRadar
              position={position}
              move={pendingMove}
              config={lesson.parametri?.profilassi}
              onConfirm={(confidenceLevel) => {
                setShowProfilassi(false)
                setProfilassiSquareStyles({})
                executeIntentMove(pendingMove.from, pendingMove.to, pendingMove.promotion || 'q', confidenceLevel)
                setPendingMove(null)
              }}
              onCancel={() => { setShowProfilassi(false); setProfilassiSquareStyles({}); setPendingMove(null) }}
              onHighlightChange={handleProfilassiHighlight}
            />
          ) : (
            <>
              {/* Intent panel */}
              {stepType === 'intent' && phase === 'intent_question' && !esameMode && (
                <IntentPanel
                  question={currentStep.domanda}
                  options={currentStep.opzioni_risposta}
                  onSelect={handleIntentSelection}
                  disabled={intentSelected || cooldownActive}
                  cooldownActive={cooldownActive}
                />
              )}

              {/* Detective panel */}
              {stepType === 'detective' && phase === 'detective_click' && (
                <div className="detective-side-panel">
                  <div className="detective-icon-large">?</div>
                  <h3>{currentStep.domanda}</h3>
                  <div className="detective-attempts-info">
                    Tentativi: {detectiveAttempts}/{currentStep.max_tentativi || 3}
                  </div>
                </div>
              )}

              {/* Candidate panel */}
              {stepType === 'candidate' && (phase === 'collecting' || phase === 'evaluated' || phase === 'candidate_move') && (
                <div className="candidate-panel">
                  <div className="candidate-header">
                    <h3>Mosse Candidate</h3>
                    <p className="candidate-instruction">
                      {phase === 'collecting' && (currentStep.descrizione_step || 'Clicca un pezzo, poi la casella di destinazione')}
                      {phase === 'evaluated' && 'Valutazione completata!'}
                      {phase === 'candidate_move' && 'Trascina il pezzo per giocare la migliore'}
                    </p>
                  </div>
                  <div className="candidate-list">
                    {candidates.length === 0 && phase === 'collecting' && (
                      <div className="candidate-empty">Seleziona almeno {numRequired} mosse candidate</div>
                    )}
                    {candidates.map((c, idx) => (
                      <div key={idx} className={`candidate-item ${
                        (phase === 'evaluated' || phase === 'candidate_move')
                          ? (c.notation === bestMove ? 'best' : goodMoves.includes(c.notation) ? 'good' : 'bad') : ''
                      }`}>
                        <span className="candidate-number">{idx + 1}</span>
                        <span className="candidate-move">{c.from} &rarr; {c.to}</span>
                        {(phase === 'evaluated' || phase === 'candidate_move') && (
                          <span className="candidate-verdict">
                            {c.notation === bestMove ? 'Migliore' : goodMoves.includes(c.notation) ? 'Buona' : 'Debole'}
                          </span>
                        )}
                        {phase === 'collecting' && (
                          <button className="candidate-remove" onClick={() => removeCandidate(idx)}>&times;</button>
                        )}
                      </div>
                    ))}
                  </div>
                  {phase === 'collecting' && (
                    <div className="candidate-counter">
                      <div className="counter-bar">
                        <div className="counter-fill" style={{ width: `${Math.min(100, (candidates.length / numRequired) * 100)}%` }} />
                      </div>
                      <span>{candidates.length} / {numRequired}</span>
                    </div>
                  )}
                  {phase === 'collecting' && candidates.length >= numRequired && (
                    <button className="btn-evaluate" onClick={handleEvaluate}>Valuta le mie candidate</button>
                  )}
                </div>
              )}

              {/* Metacognitive / Reflection / Feedback */}
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

      {/* Summary */}
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

export default MixedSequencePlayer
