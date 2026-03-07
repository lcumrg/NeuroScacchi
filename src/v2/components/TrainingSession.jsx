import { useState, useCallback, useRef } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import FreezeOverlay from './FreezeOverlay'
import HintBox from './HintBox'

const FREEZE_DURATION = 3000 // ms — sara configurabile dal profilo cognitivo

export default function TrainingSession({ position, onResult }) {
  const [frozen, setFrozen] = useState(true)
  const [errors, setErrors] = useState(0)
  const [feedback, setFeedback] = useState(null) // { type: 'correct'|'wrong', message }
  const [solved, setSolved] = useState(false)
  const gameRef = useRef(new Chess(position.fen))
  const startTimeRef = useRef(null)

  const handleFreezeEnd = useCallback(() => {
    setFrozen(false)
    startTimeRef.current = Date.now()
  }, [])

  const handleDrop = (source, target) => {
    if (frozen || solved) return false

    const game = gameRef.current
    const moveUci = source + target

    // Verifica se la mossa e' legale in chess.js
    try {
      const result = game.move({ from: source, to: target, promotion: 'q' })
      if (!result) return false

      // Verifica se e' la mossa corretta
      const isCorrect = position.solutionMoves.some(sol =>
        sol === moveUci || sol === moveUci + 'q'
      )

      if (isCorrect) {
        setSolved(true)
        setFeedback({ type: 'correct', message: 'Ottimo! Mossa corretta.' })
        const elapsed = Date.now() - startTimeRef.current
        // Notifica il risultato dopo un breve delay per mostrare il feedback
        setTimeout(() => {
          onResult({
            positionId: position.id,
            correct: true,
            errors,
            timeMs: elapsed,
          })
        }, 1200)
        return true
      } else {
        // Mossa legale ma sbagliata — annulla
        game.undo()
        setErrors(e => e + 1)
        setFeedback({ type: 'wrong', message: 'Non e\' la mossa migliore. Riprova!' })
        return false
      }
    } catch {
      return false
    }
  }

  // Determina orientamento dalla FEN (chi muove)
  const turn = position.fen.split(' ')[1]
  const orientation = turn === 'b' ? 'black' : 'white'

  return (
    <div style={styles.container}>
      {position.title && (
        <h3 style={styles.title}>{position.title}</h3>
      )}

      <div style={styles.boardWrapper}>
        <Chessboard
          position={gameRef.current.fen()}
          onPieceDrop={handleDrop}
          boardWidth={Math.min(440, window.innerWidth - 40)}
          boardOrientation={orientation}
          arePiecesDraggable={!frozen && !solved}
          customBoardStyle={{
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          }}
          customDarkSquareStyle={{ backgroundColor: '#779952' }}
          customLightSquareStyle={{ backgroundColor: '#edeed1' }}
        />
        {frozen && (
          <FreezeOverlay duration={FREEZE_DURATION} onComplete={handleFreezeEnd} />
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{
          ...styles.feedback,
          background: feedback.type === 'correct' ? '#E8F5E9' : '#FFEBEE',
          borderColor: feedback.type === 'correct' ? '#81C784' : '#EF9A9A',
          color: feedback.type === 'correct' ? '#2E7D32' : '#C62828',
        }}>
          {feedback.type === 'correct' ? '\u2705' : '\u274C'} {feedback.message}
        </div>
      )}

      {/* Hint progressivi */}
      {!solved && position.hints && position.hints.length > 0 && (
        <HintBox hints={position.hints} errorsCount={errors} />
      )}

      {/* Info tema e difficolta */}
      <div style={styles.meta}>
        <span style={styles.badge}>{position.theme}</span>
        <span style={styles.difficulty}>
          {'★'.repeat(position.difficulty)}{'☆'.repeat(10 - position.difficulty)}
        </span>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: '0 16px',
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: '#2C3E50',
    margin: 0,
  },
  boardWrapper: {
    position: 'relative',
  },
  feedback: {
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid',
    fontSize: 15,
    fontWeight: 500,
    animation: 'fadeIn 0.3s ease',
    textAlign: 'center',
    maxWidth: 440,
    width: '100%',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    background: '#E3F2FD',
    color: '#1565C0',
    padding: '3px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  difficulty: {
    fontSize: 12,
    color: '#FFB300',
    letterSpacing: 1,
  },
}
