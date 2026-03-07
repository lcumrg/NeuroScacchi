import { Chessboard } from 'react-chessboard'
import './ChessboardComponent.css'

const BOARD_SIZE = 480

function ChessboardComponent({
  position,
  onDrop,
  isFrozen,
  highlightedSquares,
  boardOrientation = 'white',
  arrows = [],
  onPromotionPieceSelect,
  onPromotionCheck,
  profilassiSquareStyles = {}
}) {

  // Custom square styles per highlighting
  const customSquareStyles = {}

  highlightedSquares.forEach(square => {
    customSquareStyles[square] = {
      background: 'radial-gradient(circle, rgba(129, 199, 132, 0.7) 0%, rgba(129, 199, 132, 0.3) 70%)',
      boxShadow: 'inset 0 0 0 4px rgba(76, 175, 80, 0.9)',
      position: 'relative',
      zIndex: 1
    }
  })

  // Profilassi: sovrascrive con stili dedicati (blu re, rosso avversari)
  Object.assign(customSquareStyles, profilassiSquareStyles)

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
        boardWidth={BOARD_SIZE}
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
        onPromotionPieceSelect={onPromotionPieceSelect}
        onPromotionCheck={onPromotionCheck}
      />
    </div>
  )
}

export default ChessboardComponent
