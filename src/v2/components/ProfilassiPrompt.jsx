import { useState, useEffect } from 'react'
import { Chess } from 'chess.js'
import { getThreats } from '../engine/stockfishService'

/**
 * Mostra le 3 minacce principali dell'avversario e chiede allo studente
 * di identificare la piu pericolosa prima di muovere.
 *
 * Con Stockfish: usa getThreats() per le vere minacce ordinate per eval.
 * Senza Stockfish: fallback a chess.js (scacchi, catture, sviluppo).
 */
export default function ProfilassiPrompt({ fen, onComplete, useStockfish }) {
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [threats, setThreats] = useState(null) // null = loading
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (useStockfish) {
      getThreats(fen, 12)
        .then((sfThreats) => {
          if (sfThreats.length === 0) {
            // Nessuna minaccia, skip
            onComplete({ selectedThreat: null, index: -1 })
            return
          }
          // Converti mosse UCI in etichette leggibili con eval
          const labeled = sfThreats.map(t => ({
            ...t,
            label: formatThreatLabel(fen, t.move, t.eval),
            evalDisplay: t.mate ? `Matto in ${Math.abs(t.mate)}` : formatEval(t.eval),
          }))
          setThreats(labeled)
        })
        .catch(() => {
          // Fallback a chess.js
          const fallback = generateThreatsClassic(fen)
          if (fallback.length === 0) {
            onComplete({ selectedThreat: null, index: -1 })
            return
          }
          setThreats(fallback)
        })
    } else {
      const fallback = generateThreatsClassic(fen)
      if (fallback.length === 0) {
        onComplete({ selectedThreat: null, index: -1 })
        return
      }
      setThreats(fallback)
    }
  }, [fen, useStockfish, onComplete])

  const handleConfirm = () => {
    setAnswered(true)
    setRevealed(true)
    setTimeout(() => {
      onComplete({ selectedThreat: threats[selected], index: selected, wasCorrect: selected === 0 })
    }, 2000)
  }

  // Loading
  if (threats === null) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>Prima di muovere...</h3>
        <div style={styles.loading}>Analisi delle minacce...</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Prima di muovere...</h3>
      <p style={styles.question}>Cosa potrebbe fare l'avversario?</p>
      <p style={styles.hint}>Scegli la minaccia che ritieni piu pericolosa:</p>

      <div style={styles.options}>
        {threats.map((threat, i) => {
          // Dopo la conferma, evidenzia la risposta corretta (indice 0 = minaccia piu forte)
          const isCorrectAnswer = i === 0
          const showResult = revealed

          return (
            <button
              key={i}
              style={{
                ...styles.option,
                ...(selected === i && !showResult ? styles.optionSelected : {}),
                ...(showResult && isCorrectAnswer ? styles.optionCorrect : {}),
                ...(showResult && selected === i && !isCorrectAnswer ? styles.optionWrong : {}),
                ...(answered ? styles.optionDisabled : {}),
              }}
              onClick={() => setSelected(i)}
              disabled={answered}
            >
              <span style={styles.optionLabel}>{threat.label}</span>
              {showResult && threat.evalDisplay && (
                <span style={styles.evalBadge}>{threat.evalDisplay}</span>
              )}
            </button>
          )
        })}
      </div>

      {selected !== null && !answered && (
        <button style={styles.confirmBtn} onClick={handleConfirm}>
          Conferma e continua
        </button>
      )}

      {answered && (
        <div style={styles.feedback}>
          {selected === 0
            ? 'Esatto! Hai identificato la minaccia principale.'
            : 'La minaccia piu pericolosa era la prima. Ora fai la tua mossa!'}
        </div>
      )}
    </div>
  )
}

// ── Formattazione minacce Stockfish ──

function formatThreatLabel(fen, moveUci, evalScore) {
  try {
    // Inverti turno per giocare la mossa dell'avversario
    const parts = fen.split(' ')
    parts[1] = parts[1] === 'w' ? 'b' : 'w'
    const opponentFen = parts.join(' ')

    const game = new Chess(opponentFen)
    const move = game.move({ from: moveUci.slice(0, 2), to: moveUci.slice(2, 4), promotion: moveUci[4] || undefined })
    if (!move) return moveUci

    // Costruisci etichetta in italiano
    const piece = pieceName(move.piece)
    if (move.san === 'O-O') return 'Arrocco corto'
    if (move.san === 'O-O-O') return 'Arrocco lungo'

    let label = `${piece} in ${move.to}`
    if (move.captured) {
      label = `${piece} cattura ${pieceName(move.captured)} in ${move.to}`
    }
    if (game.isCheck()) {
      label += ' (scacco)'
    }
    if (game.isCheckmate()) {
      label = `${piece} in ${move.to} — scacco matto!`
    }

    return label
  } catch {
    return moveUci
  }
}

function formatEval(evalScore) {
  if (evalScore === null || evalScore === undefined) return ''
  const sign = evalScore > 0 ? '+' : ''
  return `${sign}${evalScore.toFixed(1)}`
}

// ── Fallback chess.js (logica originale) ──

function generateThreatsClassic(fen) {
  try {
    const parts = fen.split(' ')
    parts[1] = parts[1] === 'w' ? 'b' : 'w'
    const opponentFen = parts.join(' ')

    const game = new Chess(opponentFen)
    const moves = game.moves({ verbose: true })

    const threats = []
    const seen = new Set()

    // Scacchi
    for (const m of moves) {
      game.move(m)
      if (game.isCheck()) {
        const label = `${pieceName(m.piece)} in ${m.to} (scacco)`
        if (!seen.has(label)) {
          threats.push({ label, type: 'check', move: m.lan })
          seen.add(label)
        }
      }
      game.undo()
      if (threats.length >= 1) break
    }

    // Catture
    for (const m of moves) {
      if (m.captured) {
        const label = `${pieceName(m.piece)} cattura ${pieceName(m.captured)} in ${m.to}`
        if (!seen.has(label)) {
          threats.push({ label, type: 'capture', move: m.lan })
          seen.add(label)
        }
      }
      if (threats.length >= 3) break
    }

    // Mosse di sviluppo
    if (threats.length < 3) {
      for (const m of moves) {
        if (!m.captured) {
          const label = `${pieceName(m.piece)} in ${m.to}`
          if (!seen.has(label)) {
            threats.push({ label, type: 'move', move: m.lan })
            seen.add(label)
          }
        }
        if (threats.length >= 3) break
      }
    }

    return threats.slice(0, 3)
  } catch {
    return []
  }
}

function pieceName(piece) {
  const names = { p: 'Pedone', n: 'Cavallo', b: 'Alfiere', r: 'Torre', q: 'Donna', k: 'Re' }
  return names[piece.toLowerCase()] || piece
}

// ── Stili ──

const styles = {
  container: {
    background: '#FFF8E1',
    border: '1px solid #FFE082',
    borderRadius: 12,
    padding: '16px 20px',
    maxWidth: 440,
    width: '100%',
    animation: 'fadeIn 0.3s ease',
  },
  title: {
    fontSize: 17,
    fontWeight: 700,
    color: '#F57F17',
    margin: '0 0 4px 0',
  },
  question: {
    fontSize: 17,
    fontWeight: 600,
    color: '#212121',
    margin: '0 0 2px 0',
  },
  hint: {
    fontSize: 14,
    color: '#546E7A',
    margin: '0 0 12px 0',
  },
  loading: {
    fontSize: 14,
    color: '#546E7A',
    textAlign: 'center',
    padding: '12px 0',
    animation: 'pulse 1.5s infinite',
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  option: {
    padding: '10px 14px',
    background: '#FAFBFC',
    border: '1px solid #E0E0E0',
    borderRadius: 8,
    fontSize: 14,
    color: '#212121',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  optionLabel: {
    flex: 1,
  },
  evalBadge: {
    fontSize: 12,
    fontWeight: 700,
    color: '#546E7A',
    background: '#ECEFF1',
    padding: '2px 6px',
    borderRadius: 4,
    flexShrink: 0,
  },
  optionSelected: {
    background: '#E8EAF6',
    borderColor: '#283593',
    color: '#283593',
    fontWeight: 600,
  },
  optionCorrect: {
    background: '#E8F5E9',
    borderColor: '#2E7D32',
    color: '#2E7D32',
    fontWeight: 600,
  },
  optionWrong: {
    background: '#FFEBEE',
    borderColor: '#EF9A9A',
    color: '#C62828',
  },
  optionDisabled: {
    cursor: 'default',
  },
  confirmBtn: {
    marginTop: 12,
    padding: '10px 20px',
    background: '#283593',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    width: '100%',
  },
  feedback: {
    marginTop: 12,
    padding: '8px 12px',
    background: '#E8EAF6',
    borderRadius: 8,
    fontSize: 14,
    color: '#283593',
    fontWeight: 500,
    textAlign: 'center',
  },
}
