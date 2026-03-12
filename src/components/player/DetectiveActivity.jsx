import { useState, useEffect } from 'react'
import './player-activities.css'

export default function DetectiveActivity({ step, onCorrect, onIncorrect, clickedSquare, onSquareConsumed }) {
  const [attempts, setAttempts] = useState(0)
  const [hintIndex, setHintIndex] = useState(-1)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(false)

  const maxAttempts = step.maxAttempts ?? 3
  const hints = step.hints ?? []

  useEffect(() => {
    if (!clickedSquare || done) return
    onSquareConsumed()

    if (clickedSquare === step.correctSquare) {
      setDone(true)
      onCorrect()
      return
    }

    const newAttempts = attempts + 1
    setAttempts(newAttempts)
    onIncorrect()

    if (newAttempts < maxAttempts && hintIndex + 1 < hints.length) {
      setHintIndex(prev => prev + 1)
    } else if (newAttempts >= maxAttempts) {
      setRevealed(true)
      setTimeout(() => {
        setDone(true)
        onCorrect()
      }, 2000)
    }
  }, [clickedSquare])

  return (
    <div className="activity activity--detective">
      <p className="activity__question">{step.question}</p>
      <p className="activity__instruction">Clicca sulla casa corretta sulla scacchiera</p>

      {hintIndex >= 0 && hints[hintIndex] && (
        <div className="activity__hint activity__hint--box">
          <strong>Suggerimento:</strong> {hints[hintIndex]}
        </div>
      )}

      {revealed && (
        <div className="activity__hint activity__hint--answer">
          La casa corretta era: <strong>{step.correctSquare}</strong>
        </div>
      )}

      {!done && attempts > 0 && !revealed && (
        <p className="activity__attempts">
          Tentativi: {attempts}/{maxAttempts}
        </p>
      )}
    </div>
  )
}
