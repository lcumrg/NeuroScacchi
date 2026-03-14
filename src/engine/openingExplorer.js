/**
 * openingExplorer.js
 *
 * Client per il Lichess Opening Explorer.
 * Restituisce statistiche reali sulle mosse giocate in una posizione,
 * filtrate per fascia Elo e cadenza.
 */

const EXPLORER_BASE = 'https://explorer.lichess.ovh/lichess'

// Mappa livello NeuroScacchi → fasce Elo Lichess Explorer
const LEVEL_TO_RATINGS = {
  principiante: '1000,1200',
  intermedio: '1400,1600',
  avanzato: '1800,2000,2200',
}

/**
 * Interroga l'Opening Explorer per una posizione data.
 *
 * @param {string} fen - FEN della posizione da analizzare
 * @param {Object} options
 * @param {string} options.livello - Livello studente (principiante/intermedio/avanzato)
 * @param {number} [options.topMoves=5] - Quante mosse restituire
 * @returns {Promise<{
 *   moves: Array<{ uci, san, games, whiteWins, draws, blackWins, winRate }>,
 *   opening: { eco, name } | null,
 *   totalGames: number
 * }>}
 */
export async function getExplorerData(fen, { livello = 'intermedio', topMoves = 5 } = {}) {
  const ratings = LEVEL_TO_RATINGS[livello] || LEVEL_TO_RATINGS.intermedio

  const params = new URLSearchParams({
    fen,
    ratings,
    speeds: 'rapid,classical',
    moves: topMoves,
    topGames: 0,
    recentGames: 0,
  })

  const url = `${EXPLORER_BASE}?${params}`

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Opening Explorer error ${response.status} per FEN: ${fen.substring(0, 40)}`)
  }

  const data = await response.json()

  const totalGames = (data.white || 0) + (data.draws || 0) + (data.black || 0)

  const moves = (data.moves || []).map(m => {
    const games = (m.white || 0) + (m.draws || 0) + (m.black || 0)
    const winRate = games > 0 ? Math.round(((m.white || 0) / games) * 100) : null
    return {
      uci: m.uci,
      san: m.san,
      games,
      whiteWins: m.white || 0,
      draws: m.draws || 0,
      blackWins: m.black || 0,
      winRate,
      frequency: totalGames > 0 ? Math.round((games / totalGames) * 100) : null,
    }
  })

  return {
    moves,
    opening: data.opening || null,
    totalGames,
  }
}

/**
 * Costruisce un sommario testuale dei dati Explorer per il prompt IA.
 *
 * @param {Object} explorerData - Output di getExplorerData
 * @param {string} coloreTurno - 'white' | 'black'
 * @returns {string}
 */
export function formatExplorerForPrompt(explorerData, coloreTurno) {
  const { moves, opening, totalGames } = explorerData

  if (!moves || moves.length === 0) {
    return '(nessun dato Explorer disponibile per questa posizione)'
  }

  const lines = []

  if (opening?.name) {
    lines.push(`Apertura: ${opening.name} (${opening.eco || ''})`)
  }

  lines.push(`Partite nel database per questa fascia Elo: ${totalGames.toLocaleString('it-IT')}`)
  lines.push(`Mosse più giocate (${coloreTurno === 'white' ? 'Bianco' : 'Nero'} muove):`)

  for (const m of moves) {
    const freq = m.frequency != null ? `${m.frequency}%` : '?%'
    const winInfo = m.winRate != null
      ? ` — win rate Bianco: ${m.winRate}%`
      : ''
    lines.push(`  • ${m.san} (${m.uci}): giocata nel ${freq} delle partite${winInfo}`)
  }

  return lines.join('\n')
}
