import { useState, useEffect, useRef } from 'react'
import { Chessboard } from 'react-chessboard'
import './DetectiveMode.css'

function DetectiveMode({
  position,
  question,
  correctSquare,
  onCorrect,
  onWrong,
  boardOrientation = 'white',
  maxAttempts = 3
}) {
  const [attempts, setAttempts] = useState(0)
  const [clickedSquare, setClickedSquare] = useState(null)
  const [showSolution, setShowSolution] = useState(false)
  const wrapperRef = useRef(null)
  const [boardWidth, setBoardWidth] = useState(600)

  // Responsive: adatta la dimensione al container
  useEffect(() => {
    const updateSize = () => {
      if (wrapperRef.current) {
        const width = wrapperRef.current.offsetWidth
        setBoardWidth(Math.min(width, 600))
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const handleSquareClick = (square) => {
    setClickedSquare(square)

    if (square === correctSquare) {
      // Risposta corretta!
      setTimeout(() => {
        onCorrect()
      }, 800)
    } else {
      // Risposta sbagliata
      const newAttempts = attempts + 1
      setAttempts(newAttempts)

      onWrong()

      if (newAttempts >= maxAttempts) {
        // Mostra soluzione dopo max tentativi
        setShowSolution(true)
        setTimeout(() => {
          onCorrect() // Procedi comunque
        }, 3000)
      }

      // Reset visual feedback dopo 1s
      setTimeout(() => {
        setClickedSquare(null)
      }, 1000)
    }
  }

  // Custom square styles per feedback visivo
  const customSquareStyles = {}

  if (clickedSquare) {
    const isCorrect = clickedSquare === correctSquare
    customSquareStyles[clickedSquare] = {
      background: isCorrect
        ? 'radial-gradient(circle, rgba(76, 175, 80, 0.8) 0%, rgba(76, 175, 80, 0.3) 70%)'
        : 'radial-gradient(circle, rgba(244, 67, 54, 0.8) 0%, rgba(244, 67, 54, 0.3) 70%)',
      boxShadow: isCorrect
        ? 'inset 0 0 0 4px rgba(76, 175, 80, 1)'
        : 'inset 0 0 0 4px rgba(244, 67, 54, 1)',
      position: 'relative',
      zIndex: 2
    }
  }

  // Mostra soluzione se ha esaurito tentativi
  if (showSolution && correctSquare) {
    customSquareStyles[correctSquare] = {
      background: 'radial-gradient(circle, rgba(255, 193, 7, 0.8) 0%, rgba(255, 193, 7, 0.3) 70%)',
      boxShadow: 'inset 0 0 0 4px rgba(255, 193, 7, 1)',
      animation: 'pulse 1s ease infinite',
      zIndex: 2
    }
  }

  return (
    <div className="detective-mode">
      <div className="detective-question">
        <div className="detective-icon">🔍</div>
        <h3>{question}</h3>
        <div className="detective-attempts">
          Tentativi: {attempts}/{maxAttempts}
        </div>
      </div>

      <div ref={wrapperRef} className="detective-board-wrapper">
        <Chessboard
          position={position}
          boardWidth={boardWidth}
          boardOrientation={boardOrientation}
          arePiecesDraggable={false}
          onSquareClick={handleSquareClick}
          customSquareStyles={customSquareStyles}
          customBoardStyle={{
            borderRadius: '8px',
            boxShadow: 'var(--shadow-md)',
            cursor: 'crosshair'
          }}
          customLightSquareStyle={{
            backgroundColor: 'var(--square-light)'
          }}
          customDarkSquareStyle={{
            backgroundColor: 'var(--square-dark)'
          }}
        />

        {showSolution && (
          <div className="detective-solution-overlay">
            <div className="detective-solution-message">
              💡 La casa corretta era: <strong>{correctSquare}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DetectiveMode
