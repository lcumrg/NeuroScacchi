import { useState, useEffect, useRef } from 'react'
import './player-activities.css'

export default function DemoActivity({ step, fen, onComplete, onFenChange }) {
  const [playing, setPlaying] = useState(false)
  const [finished, setFinished] = useState(false)
  const [moveIndex, setMoveIndex] = useState(0)
  const intervalRef = useRef(null)
  const speed = step.playbackSpeedMs ?? 1500

  // Auto-play if enabled
  useEffect(() => {
    if (step.autoPlay) handlePlay()
    return () => clearInterval(intervalRef.current)
  }, [])

  function handlePlay() {
    if (playing || finished) return
    setPlaying(true)
    intervalRef.current = setInterval(() => {
      setMoveIndex(prev => {
        const next = prev + 1
        if (next >= step.moves.length) {
          clearInterval(intervalRef.current)
          setPlaying(false)
          setFinished(true)
        }
        return next
      })
    }, speed)
  }

  // Communicate move index changes upward so PlayerPage can apply the move
  useEffect(() => {
    if (moveIndex > 0 && onFenChange) {
      onFenChange(moveIndex)
    }
  }, [moveIndex])

  return (
    <div className="activity activity--demo">
      <p className="activity__question">{step.explanation}</p>

      <div className="demo__controls">
        {!finished && (
          <button
            className="activity__btn activity__btn--secondary"
            onClick={handlePlay}
            disabled={playing}
          >
            {playing ? 'Riproduzione...' : 'Riproduci'}
          </button>
        )}
        <button
          className="activity__btn activity__btn--primary"
          onClick={onComplete}
          disabled={!finished && step.autoPlay !== false}
        >
          Continua
        </button>
      </div>

      <p className="activity__instruction">
        Mossa {moveIndex}/{step.moves.length}
      </p>
    </div>
  )
}
