import { useState, useEffect, useRef } from 'react'
import { Chess } from 'chess.js'
import Header from './components/Header'
import LessonSelector from './components/LessonSelector'
import ChessboardComponent from './components/ChessboardComponent'
import DetectiveMode from './components/DetectiveMode'
import IntentPanel from './components/IntentPanel'
import FeedbackBox from './components/FeedbackBox'
import ProfilassiRadar from './components/ProfilassiRadar'
import SequencePlayer from './components/SequencePlayer'
import { getLessons, saveLesson, deleteLesson, getSettings, saveLessonProgress } from './utils/storageManager'
import lezione01 from './data/lezione01.json'
import testPromozione from './data/test_promozione.json'
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
  const [lessonComplete, setLessonComplete] = useState(false)
  const [promotionToSquare, setPromotionToSquare] = useState(null)
  const [promotionFromSquare, setPromotionFromSquare] = useState(null)
  const timersRef = useRef([])

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
    // Aggiungi lezione di test se non ci sono lezioni
    if (stored.length === 0) {
      const defaultLessons = [
        { ...lezione01, categoria: 'test' },
        { ...testPromozione }
      ]
      defaultLessons.forEach(l => saveLesson(l))
      setLessons(defaultLessons)
    } else {
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

    if (isCorrect) {
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
      setFeedback({
        type: 'negative',
        message: currentLesson.feedback_negativo
      })
    }
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
    setFeedback({
      type: 'negative',
      message: currentLesson.modalita_detective.feedback_negativo || currentLesson.feedback_negativo
    })
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

    // Verifica se la mossa è consentita
    if (currentLesson.mosse_consentite &&
        !currentLesson.mosse_consentite.includes(moveNotation)) {
      setFeedback({
        type: 'negative',
        message: 'Questa mossa non è ottimale. Prova a sviluppare i pezzi verso il centro.'
      })
      return false
    }

    // Se e' una promozione, mostra il dialog di scelta
    if (isPromotionMove(sourceSquare, targetSquare)) {
      setPromotionFromSquare(sourceSquare)
      setPromotionToSquare(targetSquare)
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

  // Callback quando l'utente sceglie il pezzo di promozione
  const handlePromotionPieceSelect = (piece) => {
    if (!piece || !promotionFromSquare || !promotionToSquare) {
      setPromotionFromSquare(null)
      setPromotionToSquare(null)
      return false
    }
    // piece e' nel formato "wQ", "wR", "wB", "wN" ecc.
    const promotionPiece = piece[1].toLowerCase()

    // Se c'e' la profilassi, salva la mossa come pending
    if (currentLesson.parametri?.usa_profilassi) {
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
        setPosition(game.fen())

        const moveNotation = sourceSquare + targetSquare
        const isCorrect = currentLesson.mosse_corrette?.includes(moveNotation)

        if (isCorrect) {
          setFeedback({
            type: 'positive',
            message: '✅ Eccellente! Hai eseguito la mossa migliore.'
          })

          safeTimeout(() => {
            completeLesson()
          }, 2000)
        } else {
          setFeedback({
            type: 'positive',
            message: 'Mossa accettabile, ma ce n\'era una migliore.'
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
    setFeedback({
      type: 'positive',
      message: '🎉 Lezione completata! Hai dimostrato ottima capacità di pianificazione strategica.'
    })
  }

  // Reset lezione
  const handleReset = () => {
    startLesson(currentLesson)
  }

  // Exit lezione
  const handleExit = () => {
    clearAllTimers()
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
          onComplete={completeLesson}
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
                  showPromotionDialog={!!promotionToSquare}
                  promotionToSquare={promotionToSquare}
                  onPromotionPieceSelect={handlePromotionPieceSelect}
                />
              </>
            )}
          </div>

          <div className="intent-section">
            {currentLesson?.tipo_modulo === 'intent' && (
              <IntentPanel
                question={currentLesson.domanda}
                options={currentLesson.opzioni_risposta}
                onSelect={handleIntentSelection}
                disabled={intentSelected || cooldownActive}
                cooldownActive={cooldownActive}
              />
            )}
            
            <FeedbackBox
              type={feedback.type}
              message={feedback.message}
              onReset={handleReset}
              showReset={lessonComplete}
            />
          </div>
        </main>
      )}

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
          checklistQuestions={currentLesson.parametri?.domande_checklist}
        />
      )}
    </div>
  )
}

export default App
