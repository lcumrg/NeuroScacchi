import { useState, useCallback, useRef } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import FreezeOverlay from './FreezeOverlay'
import HintBox from './HintBox'
import ProfilassiPrompt from './ProfilassiPrompt'
import MetaPrompt from './MetaPrompt'
import { getFreezeDuration, shouldShowProfilassi, shouldShowMetacognition, getMaxHints, getContextualMetaQuestion, getRandomMetaQuestion } from '../engine/cognitiveLayer'
import { analyzeMove } from '../engine/stockfishService'

// Colori esclusivi per classificazione mosse (Design System)
const MOVE_COLORS = {
  ottima:       { bg: '#E8F5E9', border: '#81C784', text: '#2E7D32' },
  buona:        { bg: '#E8F5E9', border: '#A5D6A7', text: '#558B2F' },
  imprecisione: { bg: '#FFF3E0', border: '#FFB74D', text: '#E65100' },
  errore:       { bg: '#FFEBEE', border: '#EF9A9A', text: '#C62828' },
}

const MOVE_LABELS = {
  ottima: 'Ottima!',
  buona: 'Buona',
  imprecisione: 'Imprecisione',
  errore: 'Errore',
}

export default function TrainingSession({ position, positionIndex, cognitiveProfile, onResult, useStockfish }) {
  const freezeDuration = getFreezeDuration(cognitiveProfile)
  const maxHints = getMaxHints(cognitiveProfile)
  const showProfilassi = shouldShowProfilassi(cognitiveProfile, positionIndex)

  const [phase, setPhase] = useState('freeze')
  const [errors, setErrors] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [solved, setSolved] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const [metaQuestion, setMetaQuestion] = useState(null)
  const gameRef = useRef(new Chess(position.fen))
  const startTimeRef = useRef(null)
  const totalErrorsRef = useRef(0)
  const busyRef = useRef(false)

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

  const handleMetaAnswer = useCallback(() => {
    setPhase('play')
    setMetaQuestion(null)
  }, [])

  // ── Gestione mossa con Stockfish ──

  const handleDropWithStockfish = async (source, target) => {
    const game = gameRef.current
    const fenBefore = game.fen()
    const moveUci = source + target

    try {
      const result = game.move({ from: source, to: target, promotion: 'q' })
      if (!result) return false
    } catch {
      return false
    }

    // Mossa accettata visivamente — ora analizziamo
    setAnalyzing(true)
    busyRef.current = true

    try {
      const analysis = await analyzeMove(fenBefore, moveUci, 16)
      setAnalyzing(false)

      const { classification, deltaEval, bestMove } = analysis
      const isAccepted = classification === 'ottima' || classification === 'buona'

      if (isAccepted) {
        // Mossa accettata
        setSolved(true)
        setFeedback({
          classification,
          message: classification === 'ottima'
            ? 'Mossa migliore!'
            : `Mossa solida (${deltaEval > 0 ? '-' : ''}${Math.abs(deltaEval).toFixed(1)})`,
        })
        const elapsed = Date.now() - startTimeRef.current
        setTimeout(() => {
          onResult({
            positionId: position.id,
            correct: true,
            errors,
            timeMs: elapsed,
            classification,
            deltaEval,
          })
        }, 1500)
      } else {
        // Mossa rifiutata — undo dopo feedback
        const newErrors = errors + 1
        setErrors(newErrors)
        totalErrorsRef.current++

        const bestMoveFormatted = bestMove ? formatMove(bestMove) : ''

        // Troppi errori → mostra soluzione
        if (maxHints !== -1 && newErrors > maxHints) {
          setShowSolution(true)
          setFeedback({
            classification,
            message: `${MOVE_LABELS[classification]} (${deltaEval > 0 ? '-' : ''}${Math.abs(deltaEval).toFixed(1)}). La mossa migliore era: ${bestMoveFormatted}`,
          })
          // Undo la mossa sbagliata
          game.undo()
          setTimeout(() => {
            onResult({
              positionId: position.id,
              correct: false,
              errors: newErrors,
              timeMs: Date.now() - startTimeRef.current,
              classification,
              deltaEval,
            })
          }, 3000)
        } else {
          const hint = classification === 'imprecisione'
            ? `Non e' la migliore (${deltaEval > 0 ? '-' : ''}${Math.abs(deltaEval).toFixed(1)}). Riprova!`
            : `${MOVE_LABELS[classification]}: perdi ${Math.abs(deltaEval).toFixed(1)} punti. Riprova!`

          setFeedback({ classification, message: hint })
          // Undo la mossa
          game.undo()

          // Metacognizione?
          if (shouldShowMetacognition(cognitiveProfile, totalErrorsRef.current)) {
            const metaCtx = {
              deltaEval,
              timeMs: Date.now() - startTimeRef.current,
              classification,
              totalErrors: totalErrorsRef.current,
            }
            setTimeout(() => {
              setMetaQuestion(getContextualMetaQuestion(metaCtx))
              setPhase('meta')
            }, 1500)
          }
        }
      }
    } catch (err) {
      // Stockfish fallito — fallback a logica classica
      console.warn('Analisi Stockfish fallita, fallback:', err)
      setAnalyzing(false)
      handleFallbackResult(source, target, moveUci)
    }

    busyRef.current = false
    return true // la mossa è già stata gestita (accettata o undone)
  }

  // ── Fallback senza Stockfish (logica originale) ──

  const handleDropClassic = (source, target) => {
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
        setFeedback({ classification: 'ottima', message: 'Mossa corretta!' })
        const elapsed = Date.now() - startTimeRef.current
        setTimeout(() => {
          onResult({ positionId: position.id, correct: true, errors, timeMs: elapsed })
        }, 1200)
        return true
      } else {
        game.undo()
        const newErrors = errors + 1
        setErrors(newErrors)
        totalErrorsRef.current++

        if (maxHints !== -1 && newErrors > maxHints && position.solutionMoves[0]) {
          setShowSolution(true)
          setFeedback({ classification: 'errore', message: `La mossa corretta era: ${formatMove(position.solutionMoves[0])}` })
          setTimeout(() => {
            onResult({ positionId: position.id, correct: false, errors: newErrors, timeMs: Date.now() - startTimeRef.current })
          }, 2500)
        } else {
          setFeedback({ classification: 'errore', message: 'Non e\' la mossa migliore. Riprova!' })
          if (shouldShowMetacognition(cognitiveProfile, totalErrorsRef.current)) {
            setTimeout(() => {
              setMetaQuestion(getContextualMetaQuestion({
                deltaEval: null,
                timeMs: Date.now() - startTimeRef.current,
                classification: 'errore',
                totalErrors: totalErrorsRef.current,
              }))
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

  const handleFallbackResult = (source, target, moveUci) => {
    const game = gameRef.current
    const isCorrect = position.solutionMoves.some(sol =>
      sol === moveUci || sol === moveUci + 'q'
    )
    if (isCorrect) {
      setSolved(true)
      setFeedback({ classification: 'ottima', message: 'Mossa corretta!' })
      setTimeout(() => {
        onResult({ positionId: position.id, correct: true, errors, timeMs: Date.now() - startTimeRef.current })
      }, 1200)
    } else {
      game.undo()
      const newErrors = errors + 1
      setErrors(newErrors)
      setFeedback({ classification: 'errore', message: 'Non e\' la mossa migliore. Riprova!' })
    }
  }

  const handleDrop = (source, target) => {
    if (phase !== 'play' || solved || busyRef.current) return false

    if (useStockfish) {
      handleDropWithStockfish(source, target)
      return true // accettiamo visivamente, poi gestiamo
    }
    return handleDropClassic(source, target)
  }

  const turn = position.fen.split(' ')[1]
  const orientation = turn === 'b' ? 'black' : 'white'

  // Colori feedback basati su classificazione
  const feedbackColors = feedback ? (MOVE_COLORS[feedback.classification] || MOVE_COLORS.errore) : null

  return (
    <div style={styles.container}>
      {/* Blocco titolo + turno + scacchiera: emerge sopra il freeze overlay */}
      <div style={phase === 'freeze' ? styles.boardFreeze : undefined}>
        {position.title && <h3 style={{
          ...styles.title,
          ...(phase === 'freeze' ? styles.titleFreeze : {}),
        }}>{position.title}</h3>}
        <div style={{
          ...styles.turnLabel,
          ...(phase === 'freeze' ? styles.turnLabelFreeze : {}),
        }}>
          Muove il {turn === 'w' ? 'Bianco' : 'Nero'}
        </div>

        <div style={styles.boardWrapper}>
          <Chessboard
            position={gameRef.current.fen()}
            onPieceDrop={handleDrop}
            boardWidth={Math.min(440, window.innerWidth - 40, Math.floor(window.innerHeight * 0.55))}
            boardOrientation={orientation}
            arePiecesDraggable={phase === 'play' && !solved && !showSolution && !analyzing}
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

      {/* Freeze */}
      {phase === 'freeze' && (
        <FreezeOverlay duration={freezeDuration} onComplete={handleFreezeEnd} />
      )}

      {/* Profilassi */}
      {phase === 'profilassi' && (
        <ProfilassiPrompt fen={position.fen} onComplete={handleProfilassiComplete} useStockfish={useStockfish} />
      )}

      {/* Metacognizione */}
      {phase === 'meta' && metaQuestion && (
        <MetaPrompt question={metaQuestion} onAnswer={handleMetaAnswer} />
      )}

      {/* Analisi in corso */}
      {analyzing && (
        <div style={styles.analyzingBox}>
          Analisi in corso...
        </div>
      )}

      {/* Feedback graduato */}
      {feedback && !analyzing && phase !== 'profilassi' && phase !== 'freeze' && (
        <div style={{
          ...styles.feedback,
          background: feedbackColors.bg,
          borderColor: feedbackColors.border,
          color: feedbackColors.text,
        }}>
          <span style={styles.feedbackLabel}>{MOVE_LABELS[feedback.classification]}</span>
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Hint */}
      {!solved && !showSolution && !analyzing && phase === 'play' && position.hints && position.hints.length > 0 && (
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
  if (!uci || uci.length < 4) return uci || ''
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
    color: 'var(--text-primary)',
    margin: 0,
  },
  titleFreeze: {
    color: '#E8EAF6',
    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
    textAlign: 'center',
    marginBottom: 2,
  },
  turnLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textAlign: 'center',
    marginBottom: 6,
  },
  turnLabelFreeze: {
    color: '#C5CAE9',
    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
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
  analyzingBox: {
    padding: '8px 16px',
    borderRadius: 10,
    background: 'var(--color-primary-bg)',
    color: 'var(--color-primary)',
    fontSize: 14,
    fontWeight: 500,
    textAlign: 'center',
    maxWidth: 440,
    width: '100%',
    animation: 'pulse 1.5s infinite',
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
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  feedbackLabel: {
    fontSize: 20,
    fontWeight: 700,
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    background: 'var(--color-primary-bg)',
    color: 'var(--color-primary)',
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
