import { useState } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'

const BOARD_SIZE = 380

const COMMON_POSITIONS = [
  { name: 'Posizione iniziale', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' },
  { name: 'Italiana (Giuoco Piano)', fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3' },
  { name: 'Spagnola (Ruy Lopez)', fen: 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3' },
  { name: 'Siciliana', fen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2' },
  { name: 'Francese', fen: 'rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2' },
  { name: 'Dopo 1.e4 e5', fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1' },
]

function WizardStepPosition({ fen, orientation, onFenChange, onOrientationChange, onNext }) {
  const [mode, setMode] = useState('choose') // choose | fen | pgn
  const [fenInput, setFenInput] = useState(fen)
  const [fenError, setFenError] = useState('')
  const [pgnInput, setPgnInput] = useState('')
  const [pgnMoves, setPgnMoves] = useState([])
  const [pgnPositions, setPgnPositions] = useState([])
  const [pgnIndex, setPgnIndex] = useState(-1)

  const handleFenSubmit = (newFen) => {
    try {
      new Chess(newFen)
      setFenError('')
      onFenChange(newFen)
      setFenInput(newFen)
    } catch {
      setFenError('FEN non valida')
    }
  }

  const handlePgnParse = () => {
    try {
      const game = new Chess()
      game.loadPgn(pgnInput)
      const history = game.history({ verbose: true })
      const positions = ['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1']
      const replay = new Chess()
      history.forEach(m => { replay.move(m.san); positions.push(replay.fen()) })
      setPgnMoves(history)
      setPgnPositions(positions)
      setPgnIndex(-1)
    } catch (e) {
      setFenError('PGN non valido: ' + e.message)
    }
  }

  const selectPgnPosition = (idx) => {
    setPgnIndex(idx)
    const pos = pgnPositions[idx + 1]
    onFenChange(pos)
    setFenInput(pos)
  }

  const handleBoardDrop = (from, to) => {
    try {
      const game = new Chess(fen)
      const move = game.move({ from, to, promotion: 'q' })
      if (move) {
        const newFen = game.fen()
        onFenChange(newFen)
        setFenInput(newFen)
        return true
      }
    } catch { /* */ }
    return false
  }

  return (
    <div className="wizard-page">
      <div className="wizard-page-title">Da che posizione partiamo?</div>
      <p className="wizard-page-subtitle">Scegli come vuoi impostare la scacchiera per questa lezione</p>

      {/* Modalita' scelta */}
      {mode === 'choose' && (
        <div className="wizard-choices-row">
          <button className="wizard-choice-card" onClick={() => setMode('common')}>
            <span className="wizard-choice-icon">&#9823;</span>
            <strong>Posizione classica</strong>
            <span className="wizard-choice-desc">Scegli da aperture comuni</span>
          </button>
          <button className="wizard-choice-card" onClick={() => setMode('fen')}>
            <span className="wizard-choice-icon">&#9999;</span>
            <strong>Incolla una FEN</strong>
            <span className="wizard-choice-desc">Se hai una posizione specifica</span>
          </button>
          <button className="wizard-choice-card" onClick={() => setMode('pgn')}>
            <span className="wizard-choice-icon">&#9782;</span>
            <strong>Importa una partita</strong>
            <span className="wizard-choice-desc">Da PGN, scegli il momento</span>
          </button>
          <button className="wizard-choice-card" onClick={() => setMode('play')}>
            <span className="wizard-choice-icon">&#9996;</span>
            <strong>Gioca le mosse</strong>
            <span className="wizard-choice-desc">Muovi i pezzi sulla scacchiera</span>
          </button>
        </div>
      )}

      {/* Posizioni comuni */}
      {mode === 'common' && (
        <div className="wizard-two-col">
          <div className="wizard-board-col">
            <Chessboard position={fen} boardWidth={BOARD_SIZE} arePiecesDraggable={false}
              boardOrientation={orientation}
              customBoardStyle={{ borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
              customLightSquareStyle={{ backgroundColor: 'var(--square-light)' }}
              customDarkSquareStyle={{ backgroundColor: 'var(--square-dark)' }}
            />
            <div className="wizard-orient-btns">
              <button className={`wizard-orient-btn ${orientation === 'white' ? 'active' : ''}`}
                onClick={() => onOrientationChange('white')}>Lato Bianco</button>
              <button className={`wizard-orient-btn ${orientation === 'black' ? 'active' : ''}`}
                onClick={() => onOrientationChange('black')}>Lato Nero</button>
            </div>
          </div>
          <div className="wizard-side-col">
            <button className="wizard-back-link" onClick={() => setMode('choose')}>&#8592; Cambia metodo</button>
            <div className="wizard-common-list">
              {COMMON_POSITIONS.map((p, i) => (
                <button key={i} className={`wizard-common-item ${fen === p.fen ? 'selected' : ''}`}
                  onClick={() => { onFenChange(p.fen); setFenInput(p.fen) }}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input FEN */}
      {mode === 'fen' && (
        <div className="wizard-two-col">
          <div className="wizard-board-col">
            <Chessboard position={fen} boardWidth={BOARD_SIZE} arePiecesDraggable={false}
              boardOrientation={orientation}
              customBoardStyle={{ borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
              customLightSquareStyle={{ backgroundColor: 'var(--square-light)' }}
              customDarkSquareStyle={{ backgroundColor: 'var(--square-dark)' }}
            />
            <div className="wizard-orient-btns">
              <button className={`wizard-orient-btn ${orientation === 'white' ? 'active' : ''}`}
                onClick={() => onOrientationChange('white')}>Lato Bianco</button>
              <button className={`wizard-orient-btn ${orientation === 'black' ? 'active' : ''}`}
                onClick={() => onOrientationChange('black')}>Lato Nero</button>
            </div>
          </div>
          <div className="wizard-side-col">
            <button className="wizard-back-link" onClick={() => setMode('choose')}>&#8592; Cambia metodo</button>
            <label className="wizard-label">Incolla la FEN qui sotto</label>
            <textarea className="wizard-textarea" value={fenInput}
              onChange={(e) => setFenInput(e.target.value)}
              placeholder="rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"
              rows={3} />
            {fenError && <span className="wizard-error">{fenError}</span>}
            <button className="wizard-btn-primary" onClick={() => handleFenSubmit(fenInput)}>
              Usa questa posizione
            </button>
          </div>
        </div>
      )}

      {/* Import PGN */}
      {mode === 'pgn' && (
        <div className="wizard-two-col">
          <div className="wizard-board-col">
            <Chessboard position={fen} boardWidth={BOARD_SIZE} arePiecesDraggable={false}
              boardOrientation={orientation}
              customBoardStyle={{ borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
              customLightSquareStyle={{ backgroundColor: 'var(--square-light)' }}
              customDarkSquareStyle={{ backgroundColor: 'var(--square-dark)' }}
            />
            {pgnMoves.length > 0 && (
              <div className="wizard-pgn-nav">
                <button className="wizard-pgn-btn" onClick={() => selectPgnPosition(Math.max(-1, pgnIndex - 1))} disabled={pgnIndex <= -1}>&#9664;</button>
                <span>{pgnIndex < 0 ? 'Inizio' : `Mossa ${pgnIndex + 1}/${pgnMoves.length}`}</span>
                <button className="wizard-pgn-btn" onClick={() => selectPgnPosition(Math.min(pgnMoves.length - 1, pgnIndex + 1))} disabled={pgnIndex >= pgnMoves.length - 1}>&#9654;</button>
              </div>
            )}
          </div>
          <div className="wizard-side-col">
            <button className="wizard-back-link" onClick={() => setMode('choose')}>&#8592; Cambia metodo</button>
            <label className="wizard-label">Incolla il PGN della partita</label>
            <textarea className="wizard-textarea" value={pgnInput} onChange={(e) => setPgnInput(e.target.value)}
              placeholder="1. e4 e5 2. Nf3 Nc6 3. Bc4 ..."
              rows={5} />
            {fenError && <span className="wizard-error">{fenError}</span>}
            <button className="wizard-btn-primary" onClick={handlePgnParse} disabled={!pgnInput.trim()}>
              Analizza
            </button>
            {pgnMoves.length > 0 && (
              <div className="wizard-pgn-moves">
                {pgnMoves.map((m, i) => (
                  <button key={i} className={`wizard-pgn-move ${pgnIndex === i ? 'active' : ''}`}
                    onClick={() => selectPgnPosition(i)}>
                    {i % 2 === 0 && <span className="wizard-pgn-num">{Math.floor(i/2)+1}.</span>}
                    {m.san}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gioca le mosse */}
      {mode === 'play' && (
        <div className="wizard-two-col">
          <div className="wizard-board-col">
            <Chessboard position={fen} boardWidth={BOARD_SIZE} onPieceDrop={handleBoardDrop}
              boardOrientation={orientation}
              customBoardStyle={{ borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
              customLightSquareStyle={{ backgroundColor: 'var(--square-light)' }}
              customDarkSquareStyle={{ backgroundColor: 'var(--square-dark)' }}
            />
            <div className="wizard-orient-btns">
              <button className={`wizard-orient-btn ${orientation === 'white' ? 'active' : ''}`}
                onClick={() => onOrientationChange('white')}>Lato Bianco</button>
              <button className={`wizard-orient-btn ${orientation === 'black' ? 'active' : ''}`}
                onClick={() => onOrientationChange('black')}>Lato Nero</button>
            </div>
          </div>
          <div className="wizard-side-col">
            <button className="wizard-back-link" onClick={() => setMode('choose')}>&#8592; Cambia metodo</button>
            <p className="wizard-hint">Muovi i pezzi sulla scacchiera per raggiungere la posizione desiderata.</p>
            <button className="wizard-btn-secondary" onClick={() => {
              onFenChange('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
              setFenInput('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
            }}>Ricomincia da capo</button>
            <div className="wizard-fen-display">
              <span className="wizard-fen-label">FEN attuale:</span>
              <code className="wizard-fen-code">{fen}</code>
            </div>
          </div>
        </div>
      )}

      {/* Pulsante Avanti */}
      {mode !== 'choose' && (
        <div className="wizard-nav-row">
          <div />
          <button className="wizard-btn-primary wizard-btn-lg" onClick={onNext}>
            Avanti &#8594;
          </button>
        </div>
      )}
    </div>
  )
}

export default WizardStepPosition
