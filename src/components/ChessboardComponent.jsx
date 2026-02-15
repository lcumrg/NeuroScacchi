import { Chessboard } from 'react-chessboard'
import './ChessboardComponent.css'

function ChessboardComponent({ position, onDrop, isFrozen, highlightedSquares, boardOrientation = 'white', arrows = [] }) {
  // Custom square styles per highlighting - MOLTO PIÙ VISIBILI
  const customSquareStyles = {}
  
  highlightedSquares.forEach(square => {
    customSquareStyles[square] = {
      background: 'radial-gradient(circle, rgba(129, 199, 132, 0.7) 0%, rgba(129, 199, 132, 0.3) 70%)',
      boxShadow: 'inset 0 0 0 4px rgba(76, 175, 80, 0.9)',
      position: 'relative',
      zIndex: 1
    }
  })

  // Converti le frecce nel formato corretto per react-chessboard
  const customArrows = arrows.map(arrow => [arrow.from, arrow.to])

  return (
    <div className={`chessboard-wrapper ${isFrozen ? 'frozen' : ''}`}>
      {isFrozen && (
        <div className="freeze-overlay">
          <div className="freeze-message">
            ⏸️ Pensa prima di muovere
          </div>
        </div>
      )}
      
      <Chessboard
        position={position}
        onPieceDrop={onDrop}
        boardWidth={600}
        boardOrientation={boardOrientation}
        customSquareStyles={customSquareStyles}
        customArrows={customArrows}
        customArrowColor="rgb(76, 175, 80)"
        customBoardStyle={{
          borderRadius: '8px',
          boxShadow: 'var(--shadow-md)'
        }}
        customLightSquareStyle={{
          backgroundColor: 'var(--square-light)'
        }}
        customDarkSquareStyle={{
          backgroundColor: 'var(--square-dark)'
        }}
        arePiecesDraggable={!isFrozen}
      />
    </div>
  )
}

export default ChessboardComponent
