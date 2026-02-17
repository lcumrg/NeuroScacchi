import { useState, useEffect, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'
import Header from './components/Header'
import LessonSelector from './components/LessonSelector'
import ChessboardComponent from './components/ChessboardComponent'
import DetectiveMode from './components/DetectiveMode'
import IntentPanel from './components/IntentPanel'
import FeedbackBox from './components/FeedbackBox'
import ProfilassiRadar from './components/ProfilassiRadar'
import SequencePlayer from './components/SequencePlayer'
import ReflectionPrompt from './components/ReflectionPrompt'
import LessonSummary from './components/LessonSummary'
import { getLessons, saveLesson, deleteLesson, getSettings, saveLessonProgress, createSession, saveSession } from './utils/storageManager'
import { generateConfrontation } from './utils/confrontation'
import lezione01 from './data/lezione01.json'
import testMetaV4 from './data/test_metacognizione_v4.json'
import './App.css'

function App() {
  const [currentScreen, setCurrentScreen] = useState('selector') // 'selector' | 'lesson'
  const [lessons, setLessons] = useState([])
  const [currentLesson, setCurrentLesson] = useState(null)
  const [settings] = useState(getSettings())

  // Lesson player state
  const gameRef = useRef(new Chess())
  const game = gameRef.current
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
  const [lessonComplete, setLessonComplete] = useState(false)
  const timersRef = useRef([])
  const promotionHandledRef = useRef(false)

  // v4.0 Metacognizione state
  const sessionRef = useRef(null)
  const [showReflection, setShowReflection] = useState(false)
  const [reflectionContext, setReflectionContext] = useState(null)
  const [showSummary, setShowSummary] = useState(false)
  const [completedSession, setCompletedSession] = useState(null)

  // Cancella tutti i timer attivi (cleanup)
  const clearAllTimers = () => {
    timersRef.current.forEach(id => clearTimeout(id))
    timersRef.current = []
  }
  const safeTimeout = (fn, ms) => {
    const id = setTimeout(fn, ms)
    timersRef.current.push(id)
    return id
  }

  // Carica lezioni al mount
  useEffect(() => {
    const stored = getLessons()
    // Aggiungi lezioni di test se non ci sono lezioni
    if (stored.length === 0) {
      const defaultLessons = [
        { ...lezione01, categoria: 'test' },
        { ...testMetaV4, categoria: 'test' }
      ]
      defaultLessons.forEach(l => saveLesson(l))
      setLessons(defaultLessons)
    } else {
      // v4.0: assicurati che la lezione test metacognizione sia presente
      const hasMetaTest = stored.some(l => l.id === 'test_metacognizione_v4')
      if (!hasMetaTest) {
        const metaLesson = { ...testMetaV4, categoria: 'test' }
        saveLesson(metaLesson)
        stored.push(metaLesson)
      }
      setLessons(stored)
    }
  }, [])

  // Inizializza lezione
  const startLesson = (lesson) => {
    clearAllTimers()
    setCurrentLesson(lesson)
    setCurrentScreen('lesson')

    // Fix #6: gestione FEN invalida
    try {
      game.load(lesson.fen)
      setPosition(lesson.fen)
    } catch (e) {
      setFeedback({ type: 'negative', message: 'Errore: la posizione FEN di questa lezione non è valida.' })
      return
    }

    setIsFrozen(lesson.tipo_modulo === 'intent')
    setIntentSelected(false)
    setLessonComplete(false)
    setFeedback({ type: 'neutral', message: '' })
    setHighlightedSquares([])
    setArrows([])
    setCooldownActive(true)
    setShowReflection(false)
    setReflectionContext(null)
    setShowSummary(false)
    setCompletedSession(null)

    // v4.0: crea sessione di tracciamento
    sessionRef.current = createSession(lesson.id)

    // Imposta orientamento
    if (lesson.parametri?.orientamento_scacchiera) {
      setBoardOrientation(lesson.parametri.orientamento_scacchiera)
    }

    // Debug mode: auto-complete
    if (settings.debugMode) {
      safeTimeout(() => {
        if (lesson.tipo_modulo === 'intent') {
          handleIntentSelection(lesson.risposta_corretta)
        }
      }, 500)
    }

    // Freeze iniziale
    const freezeTime = lesson.parametri?.tempo_freeze || 1500
    safeTimeout(() => {
      setCooldownActive(false)
      // v4.0: segna fine fase freeze, inizio fase intent
      if (sessionRef.current) {
        sessionRef.current.phases.freeze.end = Date.now()
        sessionRef.current.phases.intent.start = Date.now()
      }
      if (lesson.tipo_modulo === 'intent') {
        setFeedback({
          type: 'neutral',
          message: 'Osserva attentamente la posizione. Quale piano strategico sceglieresti?'
        })
      }
    }, freezeTime)
  }

  // Gestione Intent
  const handleIntentSelection = (selectedIntent) => {
    const isCorrect = selectedIntent === currentLesson.risposta_corretta

    // v4.0: traccia tentativo
    if (sessionRef.current) {
      sessionRef.current.intentAttempts++
    }

    if (isCorrect) {
      // v4.0: segna fine fase intent, inizio fase move
      if (sessionRef.current) {
        sessionRef.current.phases.intent.end = Date.now()
        sessionRef.current.phases.move.start = Date.now()
      }

      setFeedback({
        type: 'positive',
        message: currentLesson.feedback_positivo
      })

      // Mostra chunk visivi
      if (currentLesson.parametri?.mostra_chunk_visivo) {
        setHighlightedSquares(currentLesson.parametri.mostra_chunk_visivo)
      }

      // Mostra frecce
      if (currentLesson.parametri?.frecce_pattern) {
        setArrows(currentLesson.parametri.frecce_pattern)
      }

      // Sblocca scacchiera
      safeTimeout(() => {
        setIsFrozen(false)
        setIntentSelected(true)
      }, 800)

    } else {
      // v4.0: traccia errore intent
      if (sessionRef.current) {
        sessionRef.current.intentErrors.push({
          selected: selectedIntent,
          correct: currentLesson.risposta_corretta,
          timestamp: Date.now()
        })
      }

      setFeedback({
        type: 'negative',
        message: currentLesson.feedback_negativo
      })

      // v4.0: mostra riflessione dopo il secondo errore
      if (sessionRef.current && sessionRef.current.intentErrors.length >= 2) {
        safeTimeout(() => {
          setReflectionContext({ phase: 'intent', selected: selectedIntent })
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

  // Gestione Detective
  const handleDetectiveCorrect = () => {
    setFeedback({
      type: 'positive',
      message: currentLesson.modalita_detective.feedback_positivo || currentLesson.feedback_positivo
    })

    safeTimeout(() => {
      completeLesson()
    }, 2000)
  }

  const handleDetectiveWrong = () => {
    // v4.0: traccia errore detective
    if (sessionRef.current) {
      sessionRef.current.moveErrors.push({
        type: 'detective',
        timestamp: Date.now()
      })
    }

    setFeedback({
      type: 'negative',
      message: currentLesson.modalita_detective.feedback_negativo || currentLesson.feedback_negativo
    })
  }

  // Controlla se una mossa e' una promozione (per la libreria react-chessboard)
  const handlePromotionCheck = (sourceSquare, targetSquare, piece) => {
    const isPromo = ((piece === "wP" && sourceSquare[1] === "7" && targetSquare[1] === "8") ||
                     (piece === "bP" && sourceSquare[1] === "2" && targetSquare[1] === "1")) &&
                    Math.abs(sourceSquare.charCodeAt(0) - targetSquare.charCodeAt(0)) <= 1
    if (!isPromo) return false

    // Se la mossa non e' consentita, non mostrare il dialog di promozione
    const moveNotation = sourceSquare + targetSquare
    if (currentLesson.mosse_consentite &&
        !currentLesson.mosse_consentite.includes(moveNotation)) {
      return false
    }

    return true
  }

  // Gestione mossa
  const onDrop = (sourceSquare, targetSquare) => {
    // Se la promozione e' gia' stata gestita, conferma alla libreria senza rieseguire
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

    // Verifica se la mossa è consentita
    if (currentLesson.mosse_consentite &&
        !currentLesson.mosse_consentite.includes(moveNotation)) {
      // v4.0: traccia errore mossa
      if (sessionRef.current) {
        sessionRef.current.moveErrors.push({
          type: 'wrong_move',
          attempted: moveNotation,
          timestamp: Date.now()
        })
      }

      setFeedback({
        type: 'negative',
        message: 'Questa mossa non è ottimale. Prova a sviluppare i pezzi verso il centro.'
      })

      // v4.0: mostra riflessione dopo il secondo errore mossa
      if (sessionRef.current && sessionRef.current.moveErrors.length >= 2) {
        safeTimeout(() => {
          setReflectionContext({ phase: 'move', attempted: moveNotation })
          setShowReflection(true)
        }, 1500)
      }

      return false
    }

    // Profilassi attiva?
    if (currentLesson.parametri?.usa_profilassi) {
      setPendingMove({ from: sourceSquare, to: targetSquare })
      setShowProfilassi(true)
      return false
    }

    // Esegui mossa direttamente
    return executeMove(sourceSquare, targetSquare)
  }

  // Callback quando l'utente sceglie il pezzo di promozione dal dialog della libreria
  const handlePromotionPieceSelect = (piece, promoteFromSquare, promoteToSquare) => {
    if (!piece || !promoteFromSquare || !promoteToSquare) {
      return false
    }
    const promotionPiece = piece[1].toLowerCase()

    // Se c'e' la profilassi, salva la mossa come pending
    if (currentLesson.parametri?.usa_profilassi) {
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
        setPosition(game.fen())

        const moveNotation = sourceSquare + targetSquare
        const isCorrect = currentLesson.mosse_corrette?.includes(moveNotation)

        // Genera confronto metacognitivo se la profilassi ha raccolto la fiducia
        let confrontation = null
        if (confidenceLevel) {
          confrontation = generateConfrontation(confidenceLevel, isCorrect, preMoveFen)

          // v4.0: salva dati calibrazione nella sessione
          if (sessionRef.current) {
            if (!sessionRef.current.calibrations) sessionRef.current.calibrations = []
            sessionRef.current.calibrations.push({
              move: moveNotation,
              confidence: confidenceLevel,
              correct: isCorrect,
              confrontation: confrontation.message,
              timestamp: Date.now()
            })
          }
        }

        if (isCorrect) {
          setFeedback({
            type: 'positive',
            message: '✅ Eccellente! Hai eseguito la mossa migliore.',
            confrontation
          })

          safeTimeout(() => {
            completeLesson()
          }, confrontation ? 3500 : 2000)
        } else {
          setFeedback({
            type: 'positive',
            message: 'Mossa accettabile, ma ce n\'era una migliore.',
            confrontation
          })
        }

        return true
      }
    } catch (e) {
      return false
    }

    return false
  }

  const completeLesson = () => {
    setLessonComplete(true)
    saveLessonProgress(currentLesson.id, { completed: true })

    // v4.0: finalizza e salva sessione, poi mostra summary
    if (sessionRef.current) {
      sessionRef.current.phases.move.end = Date.now()
      sessionRef.current.completed = true
      sessionRef.current.completedAt = Date.now()
      saveSession(sessionRef.current)
      setCompletedSession({ ...sessionRef.current })
    }

    safeTimeout(() => {
      setShowSummary(true)
    }, 1500)
  }

  // Reset lezione
  const handleReset = () => {
    startLesson(currentLesson)
  }

  // Exit lezione
  const handleExit = () => {
    clearAllTimers()
    setShowSummary(false)
    setShowReflection(false)
    setCurrentScreen('selector')
    setCurrentLesson(null)
  }

  // Upload lezione
  const handleUploadLesson = (newLesson) => {
    saveLesson(newLesson)
    setLessons([...lessons, newLesson])
  }

  // Delete lezione
  const handleDeleteLesson = (lessonId) => {
    deleteLesson(lessonId)
    setLessons(lessons.filter(l => l.id !== lessonId))
  }

  // Callback stabile per evidenziazione profilassi sulla scacchiera
  const handleProfilassiHighlight = useCallback((styles) => {
    setProfilassiSquareStyles(styles)
  }, [])

  // v4.0: callback per SequencePlayer completeLesson
  const handleSequenceComplete = () => {
    saveLessonProgress(currentLesson.id, { completed: true })
    setLessonComplete(true)
  }

  return (
    <div className="app-container">
      <Header
        showExit={currentScreen === 'lesson'}
        onExit={handleExit}
        onSettings={() => alert('Impostazioni (coming soon)')}
        lessonTitle={currentScreen === 'lesson' ? currentLesson?.titolo : null}
      />

      {currentScreen === 'selector' ? (
        <LessonSelector
          lessons={lessons}
          onSelectLesson={startLesson}
          onUploadLesson={handleUploadLesson}
          onDeleteLesson={handleDeleteLesson}
        />
      ) : currentLesson?.tipo_modulo === 'intent_sequenza' ? (
        <SequencePlayer
          lesson={currentLesson}
          onComplete={handleSequenceComplete}
          onExit={handleExit}
        />
      ) : (
        <main className="main-content">
          <div className="chess-section">
            {currentLesson?.tipo_modulo === 'detective' ? (
              <DetectiveMode
                position={position}
                question={currentLesson.modalita_detective.domanda}
                correctSquare={currentLesson.modalita_detective.risposta_corretta_casa}
                onCorrect={handleDetectiveCorrect}
                onWrong={handleDetectiveWrong}
                boardOrientation={boardOrientation}
              />
            ) : (
              <>
                <div className="lesson-title">
                  <h2>{currentLesson?.titolo}</h2>
                  <p className="lesson-description">{currentLesson?.descrizione}</p>
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
              </>
            )}
          </div>

          <div className="intent-section">
            {/* Profilassi: sostituisce il pannello laterale (la scacchiera resta visibile) */}
            {showProfilassi && pendingMove ? (
              <ProfilassiRadar
                position={position}
                move={pendingMove}
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
                {currentLesson?.tipo_modulo === 'intent' && (
                  <IntentPanel
                    question={currentLesson.domanda}
                    options={currentLesson.opzioni_risposta}
                    onSelect={handleIntentSelection}
                    disabled={intentSelected || cooldownActive}
                    cooldownActive={cooldownActive}
                  />
                )}

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
                    confrontation={feedback.confrontation}
                    onReset={handleReset}
                    showReset={lessonComplete && !showSummary}
                  />
                )}
              </>
            )}
          </div>
        </main>
      )}

      {/* v4.0: Schermata riepilogo post-lezione */}
      {showSummary && completedSession && (
        <LessonSummary
          session={completedSession}
          lessonTitle={currentLesson?.titolo}
          onRepeat={handleReset}
          onExit={handleExit}
        />
      )}
    </div>
  )
}

export default App
