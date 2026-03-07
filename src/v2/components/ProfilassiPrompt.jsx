import { useState } from 'react'
import { Chess } from 'chess.js'

/**
 * Mostra le 3 minacce principali dell'avversario e chiede allo studente
 * di identificare la piu pericolosa prima di muovere.
 */
export default function ProfilassiPrompt({ fen, onComplete }) {
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)

  // Genera le minacce dell'avversario
  const threats = generateThreats(fen)

  const handleSelect = (index) => {
    setSelected(index)
  }

  const handleConfirm = () => {
    setAnswered(true)
    setTimeout(() => {
      onComplete({ selectedThreat: threats[selected], index: selected })
    }, 1000)
  }

  if (threats.length === 0) {
    // Nessuna minaccia trovata, skip
    onComplete({ selectedThreat: null, index: -1 })
    return null
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Prima di muovere...</h3>
      <p style={styles.question}>Cosa potrebbe fare l'avversario?</p>
      <p style={styles.hint}>Scegli la minaccia che ritieni piu pericolosa:</p>

      <div style={styles.options}>
        {threats.map((threat, i) => (
          <button
            key={i}
            style={{
              ...styles.option,
              ...(selected === i ? styles.optionSelected : {}),
              ...(answered ? styles.optionDisabled : {}),
            }}
            onClick={() => handleSelect(i)}
            disabled={answered}
          >
            {threat.label}
          </button>
        ))}
      </div>

      {selected !== null && !answered && (
        <button style={styles.confirmBtn} onClick={handleConfirm}>
          Conferma e continua
        </button>
      )}

      {answered && (
        <div style={styles.feedback}>
          Bene, hai analizzato le minacce. Ora fai la tua mossa!
        </div>
      )}
    </div>
  )
}

/**
 * Genera le minacce dell'avversario analizzando la posizione.
 * Cambia turno, guarda le mosse dell'avversario, trova catture e scacchi.
 */
function generateThreats(fen) {
  try {
    const parts = fen.split(' ')
    // Inverti il turno per vedere le mosse dell'avversario
    parts[1] = parts[1] === 'w' ? 'b' : 'w'
    const opponentFen = parts.join(' ')

    const game = new Chess(opponentFen)
    const moves = game.moves({ verbose: true })

    const threats = []
    const seen = new Set()

    // Prima: scacchi
    for (const m of moves) {
      game.move(m)
      if (game.isCheck()) {
        const label = `Scacco con ${pieceName(m.piece)} in ${m.to}`
        if (!seen.has(label)) {
          threats.push({ label, type: 'check', move: m })
          seen.add(label)
        }
      }
      game.undo()
      if (threats.length >= 1) break
    }

    // Poi: catture
    for (const m of moves) {
      if (m.captured) {
        const label = `Cattura ${pieceName(m.captured)} con ${pieceName(m.piece)}`
        if (!seen.has(label)) {
          threats.push({ label, type: 'capture', move: m })
          seen.add(label)
        }
      }
      if (threats.length >= 3) break
    }

    // Se poche minacce, aggiungi mosse di sviluppo
    if (threats.length < 3) {
      for (const m of moves) {
        if (!m.captured) {
          const label = `${pieceName(m.piece)} in ${m.to}`
          if (!seen.has(label)) {
            threats.push({ label, type: 'move', move: m })
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
  const names = { p: 'pedone', n: 'cavallo', b: 'alfiere', r: 'torre', q: 'donna', k: 're' }
  return names[piece.toLowerCase()] || piece
}

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
    fontSize: 16,
    fontWeight: 700,
    color: '#E65100',
    margin: '0 0 4px 0',
  },
  question: {
    fontSize: 15,
    fontWeight: 600,
    color: '#2C3E50',
    margin: '0 0 2px 0',
  },
  hint: {
    fontSize: 13,
    color: '#5A6C7D',
    margin: '0 0 12px 0',
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  option: {
    padding: '10px 14px',
    background: '#fff',
    border: '1px solid #E0E0E0',
    borderRadius: 8,
    fontSize: 14,
    color: '#2C3E50',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  optionSelected: {
    background: '#E3F2FD',
    borderColor: '#1565C0',
    color: '#1565C0',
    fontWeight: 600,
  },
  optionDisabled: {
    opacity: 0.7,
    cursor: 'default',
  },
  confirmBtn: {
    marginTop: 12,
    padding: '10px 20px',
    background: '#E65100',
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
    background: '#E8F5E9',
    borderRadius: 8,
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: 500,
    textAlign: 'center',
  },
}
