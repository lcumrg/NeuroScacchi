import { useState, useEffect, useRef } from 'react'
import { Chess } from 'chess.js'
import ChessboardComponent from './ChessboardComponent'
import IntentPanel from './IntentPanel'
import FeedbackBox from './FeedbackBox'
import ProfilassiRadar from './ProfilassiRadar'
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
  const [promotionToSquare, setPromotionToSquare] = useState(null)
  const [promotionFromSquare, setPromotionFromSquare] = useState(null)
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

  // Cleanup timer al dismount
  useEffect(() => {
    return () => clearAllTimers()
  }, [])

  const currentStep = lesson.steps[currentStepIndex]
  const totalSteps = lesson.steps.length
  const isLastStep = currentStepIndex === totalSteps - 1

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

    // Orientamento
    if (lesson.parametri?.orientamento_scacchiera) {
      setBoardOrientation(lesson.parametri.orientamento_scacchiera)
    }

    // Freeze iniziale
    const freezeTime = lesson.parametri?.tempo_freeze || 1500
    safeTimeout(() => {
      setCooldownActive(false)
      setFeedback({
        type: 'neutral',
        message: `Step ${currentStepIndex + 1}/${totalSteps}: ${currentStep.domanda}`
      })
    }, freezeTime)
  }, [currentStepIndex])

  // Gestione Intent
  const handleIntentSelection = (selectedIntent) => {
    const isCorrect = selectedIntent === currentStep.risposta_corretta

    if (isCorrect) {
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
      setFeedback({
        type: 'negative',
        message: currentStep.feedback_negativo || 'Riprova, pensa meglio al piano strategico.'
      })
    }
  }

  // Controlla se una mossa e' una promozione
  const isPromotionMove = (sourceSquare, targetSquare) => {
    const piece = game.get(sourceSquare)
    if (!piece || piece.type !== 'p') return false
    return (piece.color === 'w' && targetSquare[1] === '8') ||
           (piece.color === 'b' && targetSquare[1] === '1')
  }

  // Gestione mossa
  const onDrop = (sourceSquare, targetSquare) => {
    if (isFrozen) return false

    const moveNotation = sourceSquare + targetSquare

    // Verifica mossa consentita
    if (currentStep.mosse_consentite &&
        !currentStep.mosse_consentite.includes(moveNotation)) {
      setFeedback({
        type: 'negative',
        message: 'Questa mossa non è ottimale per il piano scelto.'
      })
      return false
    }

    // Se e' una promozione, mostra il dialog di scelta
    if (isPromotionMove(sourceSquare, targetSquare)) {
      setPromotionFromSquare(sourceSquare)
      setPromotionToSquare(targetSquare)
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

  // Callback quando l'utente sceglie il pezzo di promozione
  const handlePromotionPieceSelect = (piece) => {
    if (!piece || !promotionFromSquare || !promotionToSquare) {
      setPromotionFromSquare(null)
      setPromotionToSquare(null)
      return false
    }
    const promotionPiece = piece[1].toLowerCase()

    if (lesson.parametri?.usa_profilassi) {
      setPendingMove({ from: promotionFromSquare, to: promotionToSquare, promotion: promotionPiece })
      setShowProfilassi(true)
      setPromotionFromSquare(null)
      setPromotionToSquare(null)
      return true
    }

    const result = executeMove(promotionFromSquare, promotionToSquare, promotionPiece)
    setPromotionFromSquare(null)
    setPromotionToSquare(null)
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
            safeTimeout(() => {
              onComplete()
            }, 3000)
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

  const handleReset = () => {
    clearAllTimers()
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
            showPromotionDialog={!!promotionToSquare}
            promotionToSquare={promotionToSquare}
            onPromotionPieceSelect={handlePromotionPieceSelect}
          />
        </div>

        <div className="intent-section">
          <IntentPanel
            question={currentStep.domanda}
            options={currentStep.opzioni_risposta}
            onSelect={handleIntentSelection}
            disabled={intentSelected || cooldownActive}
            cooldownActive={cooldownActive}
          />

          <FeedbackBox
            type={feedback.type}
            message={feedback.message}
            onReset={handleReset}
            showReset={isLastStep && intentSelected}
          />
        </div>
      </main>

      {/* Profilassi */}
      {showProfilassi && pendingMove && (
        <ProfilassiRadar
          position={position}
          move={pendingMove}
          onConfirm={() => {
            setShowProfilassi(false)
            executeMove(pendingMove.from, pendingMove.to, pendingMove.promotion || 'q')
            setPendingMove(null)
          }}
          onCancel={() => {
            setShowProfilassi(false)
            setPendingMove(null)
          }}
          checklistQuestions={lesson.parametri?.domande_checklist}
        />
      )}
    </div>
  )
}

export default SequencePlayer
