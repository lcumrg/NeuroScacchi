import { useState, useEffect, useRef } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import FeedbackBox from './FeedbackBox'
import LessonSummary from './LessonSummary'
import { createSession, saveSession } from '../utils/storageManager'
import './CandidateMode.css'

const BOARD_SIZE = 480
const MAX_CANDIDATES = 5

function CandidateMode({ lesson, onComplete, onExit }) {
  const gameRef = useRef(new Chess())
  const game = gameRef.current
  const [position, setPosition] = useState('')
  const [phase, setPhase] = useState('freeze') // freeze | collecting | evaluated | executing
  const [candidates, setCandidates] = useState([])
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [legalTargets, setLegalTargets] = useState([])
  const [feedback, setFeedback] = useState({ type: 'neutral', message: '' })
  const [boardOrientation, setBoardOrientation] = useState('white')
  const [showSummary, setShowSummary] = useState(false)
  const [completedSession, setCompletedSession] = useState(null)
  const sessionRef = useRef(null)
  const timersRef = useRef([])

  const numRequired = lesson.parametri?.num_candidate || 2
  const goodMoves = lesson.mosse_candidate || []
  const bestMove = lesson.mossa_migliore

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

  // Inizializzazione
  useEffect(() => {
    try {
      game.load(lesson.fen)
      setPosition(lesson.fen)
    } catch (e) {
      setFeedback({ type: 'negative', message: 'Errore: posizione FEN non valida.' })
      return
    }

    if (lesson.parametri?.orientamento_scacchiera) {
      setBoardOrientation(lesson.parametri.orientamento_scacchiera)
    }

    sessionRef.current = createSession(lesson.id)

    const freezeTime = lesson.parametri?.tempo_freeze || 2000
    safeTimeout(() => {
      setPhase('collecting')
      if (sessionRef.current) {
        sessionRef.current.phases.freeze.end = Date.now()
        sessionRef.current.phases.intent.start = Date.now()
      }
      setFeedback({
        type: 'neutral',
        message: `Identifica almeno ${numRequired} mosse candidate. Clicca un pezzo, poi la casella di destinazione.`
      })
    }, freezeTime)
  }, [lesson])

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
      // Primo clic → seleziona pezzo
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

    if (sessionRef.current) {
      sessionRef.current.phases.intent.end = Date.now()
      sessionRef.current.phases.move.start = Date.now()
      sessionRef.current.candidateAccuracy = {
        proposed: candidates.map(c => c.notation),
        goodFound: candidates.filter(c => goodMoves.includes(c.notation)).length,
        badSelected: candidates.filter(c => !goodMoves.includes(c.notation)).length,
        totalGood: goodMoves.length
      }
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
    }

    safeTimeout(() => {
      setPhase('executing')
      setFeedback({
        type: 'neutral',
        message: 'Trascina il pezzo per eseguire la mossa che ritieni migliore.'
      })
    }, 2500)
  }

  // Esecuzione mossa finale
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

        if (isBest) {
          setFeedback({
            type: 'positive',
            message: lesson.feedback_positivo || 'Eccellente! Hai giocato la mossa migliore!'
          })
          completeLesson()
        } else if (isGood) {
          setFeedback({
            type: 'positive',
            message: 'Buona mossa! Ma ce n\'era una ancora migliore.'
          })
          completeLesson()
        } else {
          if (sessionRef.current) {
            sessionRef.current.moveErrors.push({
              type: 'wrong_candidate_move',
              attempted: moveNotation,
              timestamp: Date.now()
            })
          }
          // Ricarica posizione
          game.load(lesson.fen)
          setPosition(lesson.fen)
          setFeedback({
            type: 'negative',
            message: lesson.feedback_negativo || 'Questa non era la mossa migliore. Riprova!'
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
    if (sessionRef.current) {
      sessionRef.current.phases.move.end = Date.now()
      sessionRef.current.completed = true
      sessionRef.current.completedAt = Date.now()
      saveSession(sessionRef.current)
      setCompletedSession({ ...sessionRef.current })
    }

    safeTimeout(() => {
      setShowSummary(true)
      onComplete()
    }, 2000)
  }

  const handleReset = () => {
    clearAllTimers()
    setPhase('freeze')
    setCandidates([])
    setSelectedSquare(null)
    setLegalTargets([])
    setFeedback({ type: 'neutral', message: '' })
    setShowSummary(false)
    setCompletedSession(null)

    game.load(lesson.fen)
    setPosition(lesson.fen)
    sessionRef.current = createSession(lesson.id)

    const freezeTime = lesson.parametri?.tempo_freeze || 2000
    safeTimeout(() => {
      setPhase('collecting')
      if (sessionRef.current) {
        sessionRef.current.phases.freeze.end = Date.now()
        sessionRef.current.phases.intent.start = Date.now()
      }
      setFeedback({
        type: 'neutral',
        message: `Identifica almeno ${numRequired} mosse candidate. Clicca un pezzo, poi la casella di destinazione.`
      })
    }, freezeTime)
  }

  // Square styles
  const customSquareStyles = {}

  // Pezzo selezionato
  if (selectedSquare) {
    customSquareStyles[selectedSquare] = {
      background: 'radial-gradient(circle, rgba(255, 193, 7, 0.7) 0%, rgba(255, 193, 7, 0.3) 70%)',
      boxShadow: 'inset 0 0 0 3px rgba(255, 193, 7, 1)'
    }
  }

  // Caselle target legali (dot indicator)
  legalTargets.forEach(sq => {
    if (!candidates.some(c => c.to === sq && c.from === selectedSquare)) {
      customSquareStyles[sq] = {
        background: 'radial-gradient(circle, rgba(33, 150, 243, 0.5) 25%, transparent 25%)',
        borderRadius: '50%'
      }
    }
  })

  // Candidate proposte (fase collecting)
  if (phase === 'collecting') {
    candidates.forEach(c => {
      customSquareStyles[c.to] = {
        background: 'radial-gradient(circle, rgba(33, 150, 243, 0.6) 0%, rgba(33, 150, 243, 0.2) 70%)',
        boxShadow: 'inset 0 0 0 3px rgba(33, 150, 243, 0.8)'
      }
    })
  }

  // Candidate valutate (fase evaluated/executing)
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
    <div className="candidate-mode">
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
                {phase === 'collecting' && 'Clicca un pezzo, poi la casella di destinazione'}
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

          <FeedbackBox
            type={feedback.type}
            message={feedback.message}
            onReset={handleReset}
            showReset={completedSession && !showSummary}
          />
        </div>
      </main>

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

export default CandidateMode
