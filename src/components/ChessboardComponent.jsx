import { useState, useEffect, useRef } from 'react'
import { Chessboard } from 'react-chessboard'
import './ChessboardComponent.css'

function ChessboardComponent({
  position,
  onDrop,
  isFrozen,
  highlightedSquares,
  boardOrientation = 'white',
  arrows = [],
  showPromotionDialog = false,
  promotionToSquare = null,
  onPromotionPieceSelect
}) {
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

  // Converti le frecce nel formato corretto per react-chessboard
  const customArrows = arrows.map(arrow => [arrow.from, arrow.to])

  return (
    <div ref={wrapperRef} className={`chessboard-wrapper ${isFrozen ? 'frozen' : ''}`}>
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
        boardWidth={boardWidth}
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
        showPromotionDialog={showPromotionDialog}
        promotionToSquare={promotionToSquare}
        onPromotionPieceSelect={onPromotionPieceSelect}
      />
    </div>
  )
}

export default ChessboardComponent
