import { useState, useCallback } from 'react'
import Chessboard from '../components/Chessboard.jsx'
import { INITIAL_FEN, legalDests, makeMove, turnColor, isCheckmate, isStalemate, isCheck, kingSquareInCheck } from '../engine/chessService.js'

export default function DemoPage() {
  const [fen, setFen] = useState(INITIAL_FEN)
  const [lastMove, setLastMove] = useState(null)
  const [history, setHistory] = useState([])

  const turn = turnColor(fen)
  const dests = legalDests(fen)
  const checkSquare = kingSquareInCheck(fen)
  const checkmate = isCheckmate(fen)
  const stalemate = isStalemate(fen)

  const handleMove = useCallback((from, to) => {
    const result = makeMove(fen, { from, to })
    if (!result.valid) return

    setFen(result.fen)
    setLastMove([from, to])
    setHistory(prev => [...prev, result.san])
  }, [fen])

  const statusText = checkmate
    ? `Scacco matto! Vince il ${turn === 'white' ? 'Nero' : 'Bianco'}`
    : stalemate
      ? 'Stallo — patta'
      : isCheck(fen)
        ? `${turn === 'white' ? 'Bianco' : 'Nero'} in scacco`
        : `Muove il ${turn === 'white' ? 'Bianco' : 'Nero'}`

  const demoArrows = history.length === 0
    ? [{ orig: 'e2', dest: 'e4', brush: 'green' }]
    : []

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem 1rem',
    }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
        NeuroScacchi 3.0 — Fase 0
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Scacchiera interattiva
      </p>

      <div style={{ width: '100%', maxWidth: '480px' }}>
        <Chessboard
          fen={fen}
          orientation="white"
          turnColor={turn}
          dests={dests}
          onMove={handleMove}
          lastMove={lastMove}
          check={checkSquare}
          arrows={demoArrows}
        />
      </div>

      <p style={{
        marginTop: '1rem',
        fontWeight: 600,
        fontSize: '1rem',
        color: checkmate ? 'var(--move-ottima)' : 'var(--text-primary)',
      }}>
        {statusText}
      </p>

      {history.length > 0 && (
        <p style={{
          marginTop: '0.5rem',
          color: 'var(--text-secondary)',
          fontSize: '0.85rem',
          fontFamily: 'var(--font-mono)',
          maxWidth: '480px',
          wordBreak: 'break-word',
          textAlign: 'center',
        }}>
          {history.map((san, i) => (
            i % 2 === 0
              ? `${Math.floor(i / 2) + 1}. ${san} `
              : `${san} `
          )).join('')}
        </p>
      )}

      <p style={{
        marginTop: '1rem',
        color: 'var(--text-label)',
        fontSize: '0.75rem',
        fontFamily: 'var(--font-mono)',
        maxWidth: '480px',
        wordBreak: 'break-all',
        textAlign: 'center',
      }}>
        {fen}
      </p>
    </div>
  )
}
