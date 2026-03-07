import { useState, useCallback, useRef } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import FreezeOverlay from './FreezeOverlay'
import HintBox from './HintBox'
import ProfilassiPrompt from './ProfilassiPrompt'
import MetaPrompt from './MetaPrompt'
import { getFreezeDuration, shouldShowProfilassi, shouldShowMetacognition, getMaxHints, getRandomMetaQuestion } from '../engine/cognitiveLayer'

export default function TrainingSession({ position, positionIndex, cognitiveProfile, onResult }) {
  const freezeDuration = getFreezeDuration(cognitiveProfile)
  const maxHints = getMaxHints(cognitiveProfile)
  const showProfilassi = shouldShowProfilassi(cognitiveProfile, positionIndex)

  const [phase, setPhase] = useState(showProfilassi ? 'profilassi' : 'freeze')
  // profilassi → freeze → play → meta → done
  const [errors, setErrors] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [solved, setSolved] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const [metaQuestion, setMetaQuestion] = useState(null)
  const gameRef = useRef(new Chess(position.fen))
  const startTimeRef = useRef(null)
  const totalErrorsRef = useRef(0)

  const handleProfilassiComplete = useCallback(() => {
    setPhase('freeze')
  }, [])

  const handleFreezeEnd = useCallback(() => {
    setPhase('play')
    startTimeRef.current = Date.now()
  }, [])

  const handleMetaAnswer = useCallback((answer) => {
    setPhase('play')
    setMetaQuestion(null)
  }, [])

  const handleDrop = (source, target) => {
    if (phase !== 'play' || solved) return false

    const game = gameRef.current
    const moveUci = source + target

    try {
      const result = game.move({ from: source, to: target, promotion: 'q' })
      if (!result) return false

      const isCorrect = position.solutionMoves.some(sol =>
        sol === moveUci || sol === moveUci + 'q'
      )

      if (isCorrect) {
        setSolved(true)
        setFeedback({ type: 'correct', message: 'Ottimo! Mossa corretta.' })
        const elapsed = Date.now() - startTimeRef.current
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
        game.undo()
        const newErrors = errors + 1
        setErrors(newErrors)
        totalErrorsRef.current++

        // Hint limitati + soluzione
        if (maxHints !== -1 && newErrors > maxHints && position.solutionMoves[0]) {
          setShowSolution(true)
          setFeedback({ type: 'wrong', message: `La mossa corretta era: ${formatMove(position.solutionMoves[0])}` })
          setTimeout(() => {
            onResult({
              positionId: position.id,
              correct: false,
              errors: newErrors,
              timeMs: Date.now() - startTimeRef.current,
            })
          }, 2500)
        } else {
          setFeedback({ type: 'wrong', message: 'Non e\' la mossa migliore. Riprova!' })

          // Metacognizione?
          if (shouldShowMetacognition(cognitiveProfile, totalErrorsRef.current)) {
            setTimeout(() => {
              setMetaQuestion(getRandomMetaQuestion())
              setPhase('meta')
            }, 1200)
          }
        }

        return false
      }
    } catch {
      return false
    }
  }

  const turn = position.fen.split(' ')[1]
  const orientation = turn === 'b' ? 'black' : 'white'

  return (
    <div style={styles.container}>
      {position.title && <h3 style={styles.title}>{position.title}</h3>}

      {/* Profilassi — prima del freeze */}
      {phase === 'profilassi' && (
        <ProfilassiPrompt fen={position.fen} onComplete={handleProfilassiComplete} />
      )}

      {/* Scacchiera */}
      {phase !== 'profilassi' && (
        <div style={styles.boardWrapper}>
          <Chessboard
            position={gameRef.current.fen()}
            onPieceDrop={handleDrop}
            boardWidth={Math.min(440, window.innerWidth - 40)}
            boardOrientation={orientation}
            arePiecesDraggable={phase === 'play' && !solved && !showSolution}
            customBoardStyle={{
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            }}
            customDarkSquareStyle={{ backgroundColor: '#779952' }}
            customLightSquareStyle={{ backgroundColor: '#edeed1' }}
          />
          {phase === 'freeze' && (
            <FreezeOverlay duration={freezeDuration} onComplete={handleFreezeEnd} />
          )}
        </div>
      )}

      {/* Metacognizione */}
      {phase === 'meta' && metaQuestion && (
        <MetaPrompt question={metaQuestion} onAnswer={handleMetaAnswer} />
      )}

      {/* Feedback */}
      {feedback && phase !== 'profilassi' && (
        <div style={{
          ...styles.feedback,
          background: feedback.type === 'correct' ? '#E8F5E9' : '#FFEBEE',
          borderColor: feedback.type === 'correct' ? '#81C784' : '#EF9A9A',
          color: feedback.type === 'correct' ? '#2E7D32' : '#C62828',
        }}>
          {feedback.type === 'correct' ? '\u2705' : '\u274C'} {feedback.message}
        </div>
      )}

      {/* Hint */}
      {!solved && !showSolution && phase === 'play' && position.hints && position.hints.length > 0 && (
        <HintBox hints={position.hints} errorsCount={errors} />
      )}

      {/* Meta: tema e difficolta */}
      <div style={styles.meta}>
        <span style={styles.badge}>{position.theme}</span>
        <span style={styles.difficulty}>
          {'\u2605'.repeat(position.difficulty)}{'\u2606'.repeat(10 - position.difficulty)}
        </span>
      </div>
    </div>
  )
}

function formatMove(uci) {
  return uci.slice(0, 2) + ' \u2192 ' + uci.slice(2, 4)
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
