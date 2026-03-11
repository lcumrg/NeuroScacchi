import { useState, useCallback } from 'react'
import Chessboard from '../components/Chessboard.jsx'
import StockfishPanel from '../components/StockfishPanel.jsx'
import { INITIAL_FEN, legalDests, makeMove, turnColor, isCheck, kingSquareInCheck, parseFen } from '../engine/chessService.js'
import './ConsolePage.css'

export default function ConsolePage() {
  // Board state
  const [fen, setFen] = useState(INITIAL_FEN)
  const [fenInput, setFenInput] = useState(INITIAL_FEN)
  const [lastMove, setLastMove] = useState(null)

  // Settings form state
  const [tema, setTema] = useState('')
  const [livello, setLivello] = useState('')
  const [ratingMin, setRatingMin] = useState('')
  const [ratingMax, setRatingMax] = useState('')
  const [obiettivo, setObiettivo] = useState('')

  // Chat state
  const [chatInput, setChatInput] = useState('')
  const [messages] = useState([])

  const turn = turnColor(fen)
  const dests = legalDests(fen)
  const checkSquare = kingSquareInCheck(fen)

  const handleMove = useCallback((from, to) => {
    const result = makeMove(fen, { from, to })
    if (!result.valid) return
    setFen(result.fen)
    setFenInput(result.fen)
    setLastMove([from, to])
  }, [fen])

  const handleFenChange = useCallback((e) => {
    const newFen = e.target.value
    setFenInput(newFen)
  }, [])

  const handleFenSubmit = useCallback((e) => {
    if (e.key === 'Enter') {
      try {
        // Validate FEN by attempting to parse it
        parseFen(fenInput)
        setFen(fenInput)
        setLastMove(null)
      } catch {
        // Invalid FEN — do nothing, user can keep editing
      }
    }
  }, [fenInput])

  return (
    <div className="console-page">
      {/* Top bar */}
      <div className="console-topbar">
        <h1>Console Coach</h1>
        <span className="breadcrumb">/ Creazione lezione</span>
      </div>

      {/* 3-column grid */}
      <div className="console-grid">
        {/* Left panel — Settings */}
        <div className="console-panel panel-left">
          <h2>Impostazione Obiettivi</h2>
          <div className="settings-form">
            <div className="form-group">
              <label htmlFor="tema">Tema</label>
              <select id="tema" value={tema} onChange={e => setTema(e.target.value)}>
                <option value="">Seleziona tema...</option>
                <option value="tattica">Tattica</option>
                <option value="aperture">Aperture</option>
                <option value="finali">Finali</option>
                <option value="strategia">Strategia</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="livello">Livello studente</label>
              <select id="livello" value={livello} onChange={e => setLivello(e.target.value)}>
                <option value="">Seleziona livello...</option>
                <option value="principiante">Principiante</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzato">Avanzato</option>
              </select>
            </div>

            <div className="form-group">
              <label>Rating range</label>
              <div className="rating-range">
                <input
                  type="number"
                  placeholder="Min"
                  value={ratingMin}
                  onChange={e => setRatingMin(e.target.value)}
                  min={0}
                  max={3000}
                />
                <span>—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={ratingMax}
                  onChange={e => setRatingMax(e.target.value)}
                  min={0}
                  max={3000}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="obiettivo">Obiettivo didattico</label>
              <textarea
                id="obiettivo"
                placeholder="Descrivi l'obiettivo della lezione..."
                value={obiettivo}
                onChange={e => setObiettivo(e.target.value)}
                rows={3}
              />
            </div>

            <button className="btn-generate" disabled>
              Genera lezione
            </button>
          </div>
        </div>

        {/* Center panel — Board */}
        <div className="console-panel panel-center center-panel">
          <div className="board-wrapper">
            <Chessboard
              fen={fen}
              orientation="white"
              turnColor={turn}
              dests={dests}
              onMove={handleMove}
              lastMove={lastMove}
              check={checkSquare}
            />
          </div>

          <div className="fen-input">
            <input
              type="text"
              value={fenInput}
              onChange={handleFenChange}
              onKeyDown={handleFenSubmit}
              title="Modifica FEN e premi Invio per aggiornare la scacchiera"
            />
          </div>

          <StockfishPanel fen={fen} orientation="white" />
        </div>

        {/* Right panel — Chat */}
        <div className="console-panel panel-right chat-panel">
          <h2>Chat IA</h2>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-empty">
                Nessun messaggio. La chat IA sara' disponibile a breve.
              </div>
            )}
          </div>

          <div className="chat-input-area">
            <textarea
              placeholder="Scrivi un messaggio..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              rows={1}
              disabled
            />
            <button className="btn-send" disabled>
              Invia
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
