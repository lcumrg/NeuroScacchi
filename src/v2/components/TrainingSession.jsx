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

  const [phase, setPhase] = useState('freeze')
  // freeze → profilassi → play → meta → done
  const [errors, setErrors] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [solved, setSolved] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const [metaQuestion, setMetaQuestion] = useState(null)
  const gameRef = useRef(new Chess(position.fen))
  const startTimeRef = useRef(null)
  const totalErrorsRef = useRef(0)

  const handleFreezeEnd = useCallback(() => {
    if (showProfilassi) {
      setPhase('profilassi')
    } else {
      setPhase('play')
      startTimeRef.current = Date.now()
    }
  }, [showProfilassi])

  const handleProfilassiComplete = useCallback(() => {
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
      {/* Blocco titolo + scacchiera: emerge sopra il freeze overlay */}
      <div style={phase === 'freeze' ? styles.boardFreeze : undefined}>
        {position.title && <h3 style={{
          ...styles.title,
          ...(phase === 'freeze' ? styles.titleFreeze : {}),
        }}>{position.title}</h3>}

        <div style={styles.boardWrapper}>
          <Chessboard
            position={gameRef.current.fen()}
            onPieceDrop={handleDrop}
            boardWidth={Math.min(440, window.innerWidth - 40)}
            boardOrientation={orientation}
            arePiecesDraggable={phase === 'play' && !solved && !showSolution}
            customBoardStyle={{
              borderRadius: 8,
              boxShadow: phase === 'freeze'
                ? '0 8px 32px rgba(0,0,0,0.3)'
                : '0 4px 16px rgba(0,0,0,0.12)',
            }}
            customDarkSquareStyle={{ backgroundColor: '#779952' }}
            customLightSquareStyle={{ backgroundColor: '#edeed1' }}
          />
        </div>
      </div>

      {/* Freeze: overlay full-screen che sfoca TUTTO tranne titolo + scacchiera */}
      {phase === 'freeze' && (
        <FreezeOverlay duration={freezeDuration} onComplete={handleFreezeEnd} />
      )}

      {/* Profilassi — dopo il freeze, prima di giocare */}
      {phase === 'profilassi' && (
        <ProfilassiPrompt fen={position.fen} onComplete={handleProfilassiComplete} />
      )}

      {/* Metacognizione */}
      {phase === 'meta' && metaQuestion && (
        <MetaPrompt question={metaQuestion} onAnswer={handleMetaAnswer} />
      )}

      {/* Feedback — colori esclusivi classificazione mosse */}
      {feedback && phase !== 'profilassi' && phase !== 'freeze' && (
        <div style={{
          ...styles.feedback,
          background: feedback.type === 'correct' ? '#E8F5E9' : '#FFEBEE',
          borderColor: feedback.type === 'correct' ? '#81C784' : '#EF9A9A',
          color: feedback.type === 'correct' ? '#2E7D32' : '#C62828',
        }}>
          {feedback.message}
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
    color: '#212121',
    margin: 0,
  },
  titleFreeze: {
    color: '#E8EAF6',
    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
    textAlign: 'center',
    marginBottom: 8,
  },
  boardWrapper: {
    position: 'relative',
  },
  boardFreeze: {
    position: 'relative',
    zIndex: 60,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  feedback: {
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid',
    fontSize: 17,
    fontWeight: 600,
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
    background: '#E8EAF6',
    color: '#283593',
    padding: '3px 10px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  difficulty: {
    fontSize: 14,
    color: '#FFB300',
    letterSpacing: 1,
  },
}
