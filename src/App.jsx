import { useState, useEffect } from 'react'
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
import './App.css'

function App() {
  const [currentScreen, setCurrentScreen] = useState('selector') // 'selector' | 'lesson'
  const [lessons, setLessons] = useState([])
  const [currentLesson, setCurrentLesson] = useState(null)
  const [settings] = useState(getSettings())
  
  // Lesson player state
  const [game] = useState(new Chess())
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

  // Carica lezioni al mount
  useEffect(() => {
    const stored = getLessons()
    // Aggiungi lezione di test se non ci sono lezioni
    if (stored.length === 0) {
      const testLesson = { ...lezione01, categoria: 'test' }
      saveLesson(testLesson)
      setLessons([testLesson])
    } else {
      setLessons(stored)
    }
  }, [])

  // Inizializza lezione
  const startLesson = (lesson) => {
    setCurrentLesson(lesson)
    setCurrentScreen('lesson')
    game.load(lesson.fen)
    setPosition(lesson.fen)
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
      setTimeout(() => {
        if (lesson.tipo_modulo === 'intent') {
          handleIntentSelection(lesson.risposta_corretta)
        }
      }, 500)
    }
    
    // Freeze iniziale
    const freezeTime = lesson.parametri?.tempo_freeze || 1500
    setTimeout(() => {
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
      setTimeout(() => {
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
    
    setTimeout(() => {
      completeLesson()
    }, 2000)
  }

  const handleDetectiveWrong = () => {
    setFeedback({
      type: 'negative',
      message: currentLesson.modalita_detective.feedback_negativo || currentLesson.feedback_negativo
    })
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

    // Profilassi attiva?
    if (currentLesson.parametri?.usa_profilassi) {
      setPendingMove({ from: sourceSquare, to: targetSquare })
      setShowProfilassi(true)
      return false
    }

    // Esegui mossa direttamente
    return executeMove(sourceSquare, targetSquare)
  }

  const executeMove = (sourceSquare, targetSquare) => {
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
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
          
          setTimeout(() => {
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
            executeMove(pendingMove.from, pendingMove.to)
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
