// Schema e validazione per le posizioni di allenamento
// Ogni posizione rappresenta un puzzle: una posizione FEN + la mossa/e corrette

import { Chess } from 'chess.js'

/**
 * Schema posizione:
 * {
 *   id: string,              // identificativo unico
 *   fen: string,             // posizione FEN
 *   solutionMoves: string[], // mosse corrette in formato UCI (es. "e2e4", "g1f3")
 *   theme: string,           // tema tattico (fork, pin, skewer, mate, ecc.)
 *   difficulty: number,      // 1-10
 *   hints: string[],         // suggerimenti progressivi (opzionali)
 *   origin: string,          // "manual" | "lichess" | "coach"
 *   title: string,           // titolo breve (opzionale)
 * }
 */

const VALID_THEMES = [
  'fork', 'pin', 'skewer', 'discovery', 'mate',
  'deflection', 'decoy', 'trapped_piece', 'promotion',
  'endgame', 'opening', 'defense', 'sacrifice', 'tactics',
]

const VALID_ORIGINS = ['manual', 'lichess', 'coach']

export function validatePosition(pos) {
  const errors = []

  if (!pos.id || typeof pos.id !== 'string') {
    errors.push('id mancante o non valido')
  }

  if (!pos.fen || typeof pos.fen !== 'string') {
    errors.push('fen mancante o non valido')
  } else {
    try {
      const g = new Chess(pos.fen)
      if (!g) errors.push('FEN non valido')
    } catch {
      errors.push('FEN non valido: ' + pos.fen)
    }
  }

  if (!Array.isArray(pos.solutionMoves) || pos.solutionMoves.length === 0) {
    errors.push('solutionMoves deve essere un array con almeno una mossa')
  }

  if (typeof pos.difficulty !== 'number' || pos.difficulty < 1 || pos.difficulty > 10) {
    errors.push('difficulty deve essere un numero tra 1 e 10')
  }

  if (!pos.theme || !VALID_THEMES.includes(pos.theme)) {
    errors.push('theme non valido: ' + pos.theme + '. Valori ammessi: ' + VALID_THEMES.join(', '))
  }

  if (pos.hints && !Array.isArray(pos.hints)) {
    errors.push('hints deve essere un array')
  }

  if (pos.origin && !VALID_ORIGINS.includes(pos.origin)) {
    errors.push('origin non valido: ' + pos.origin)
  }

  return { valid: errors.length === 0, errors }
}

export { VALID_THEMES, VALID_ORIGINS }
