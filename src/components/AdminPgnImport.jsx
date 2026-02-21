import { useState, useRef } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import './AdminPgnImport.css'

const BOARD_SIZE = 400

function AdminPgnImport({ onUsePosition }) {
  const [pgnText, setPgnText] = useState('')
  const [moves, setMoves] = useState([])
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1)
  const [positions, setPositions] = useState([])
  const [error, setError] = useState('')
  const [headers, setHeaders] = useState({})
  const gameRef = useRef(new Chess())

  const parsePgn = () => {
    setError('')
    try {
      const game = new Chess()
      game.loadPgn(pgnText)

      const hdrs = game.header()
      setHeaders(hdrs)

      // Raccogli tutte le posizioni
      const history = game.history({ verbose: true })
      const posArr = ['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'] // posizione iniziale

      const replayGame = new Chess()
      history.forEach(move => {
        replayGame.move(move.san)
        posArr.push(replayGame.fen())
      })

      setMoves(history)
      setPositions(posArr)
      setCurrentMoveIndex(-1)
      gameRef.current = replayGame
    } catch (e) {
      setError('PGN non valido: ' + e.message)
      setMoves([])
      setPositions([])
    }
  }

  const handleFileImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      setPgnText(evt.target.result)
    }
    reader.readAsText(file)
  }

  const goToMove = (index) => {
    if (index >= -1 && index < positions.length - 1) {
      setCurrentMoveIndex(index)
    }
  }

  const currentFen = positions[currentMoveIndex + 1] || positions[0] || 'start'

  return (
    <div className="admin-pgn-import">
      <div className="admin-main-layout">
        <div className="admin-board-col">
          {positions.length > 0 ? (
            <div className="pgn-board-section">
              <Chessboard
                position={currentFen}
                boardWidth={BOARD_SIZE}
                arePiecesDraggable={false}
                customBoardStyle={{ borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}
                customLightSquareStyle={{ backgroundColor: 'var(--square-light)' }}
                customDarkSquareStyle={{ backgroundColor: 'var(--square-dark)' }}
              />

              <div className="pgn-nav-controls">
                <button className="pgn-nav-btn" onClick={() => goToMove(-1)} disabled={currentMoveIndex <= -1}>&#9198;</button>
                <button className="pgn-nav-btn" onClick={() => goToMove(currentMoveIndex - 1)} disabled={currentMoveIndex <= -1}>&#9664;</button>
                <span className="pgn-move-counter">
                  {currentMoveIndex < 0 ? 'Inizio' : `Mossa ${currentMoveIndex + 1} / ${moves.length}`}
                </span>
                <button className="pgn-nav-btn" onClick={() => goToMove(currentMoveIndex + 1)} disabled={currentMoveIndex >= moves.length - 1}>&#9654;</button>
                <button className="pgn-nav-btn" onClick={() => goToMove(moves.length - 1)} disabled={currentMoveIndex >= moves.length - 1}>&#9197;</button>
              </div>

              <button className="admin-btn admin-btn-save pgn-use-btn" onClick={() => onUsePosition(currentFen)}>
                Usa questa posizione
              </button>
            </div>
          ) : (
            <div className="pgn-placeholder">
              <span className="pgn-placeholder-icon">&#9823;</span>
              <p>Incolla un PGN e premi "Analizza" per visualizzare la partita</p>
            </div>
          )}
        </div>

        <div className="admin-form-col">
          <div className="admin-form-section">
            <h3>Import PGN</h3>

            <div className="pgn-input-section">
              <textarea
                className="admin-textarea pgn-textarea"
                value={pgnText}
                onChange={(e) => setPgnText(e.target.value)}
                placeholder={'Incolla qui il PGN della partita...\n\nEs:\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5'}
                rows={10}
              />

              <div className="pgn-actions-row">
                <label className="admin-btn-sm pgn-file-btn">
                  Carica .pgn
                  <input type="file" accept=".pgn,.txt" onChange={handleFileImport} style={{ display: 'none' }} />
                </label>
                <button className="admin-btn admin-btn-save" onClick={parsePgn} disabled={!pgnText.trim()}>
                  Analizza PGN
                </button>
              </div>
            </div>

            {error && <div className="pgn-error">{error}</div>}

            {/* Headers PGN */}
            {Object.keys(headers).length > 0 && (
              <div className="pgn-headers">
                <h4>Info Partita</h4>
                {Object.entries(headers).map(([key, value]) => (
                  <div key={key} className="pgn-header-row">
                    <strong>{key}:</strong> <span>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Lista mosse cliccabili */}
            {moves.length > 0 && (
              <div className="pgn-moves-section">
                <h4>Mosse ({moves.length})</h4>
                <div className="pgn-moves-list">
                  {moves.map((move, i) => (
                    <button
                      key={i}
                      className={`pgn-move-btn ${currentMoveIndex === i ? 'active' : ''}`}
                      onClick={() => goToMove(i)}
                    >
                      {i % 2 === 0 && <span className="pgn-move-number">{Math.floor(i / 2) + 1}.</span>}
                      {move.san}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPgnImport
