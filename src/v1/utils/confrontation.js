import { Chess } from 'chess.js'

/**
 * Messaggi di confronto di default.
 * Ogni chiave segue il pattern: {fiducia}_{esito}[_{dettaglio}]
 *
 * Le lezioni possono sovrascrivere qualsiasi chiave tramite
 * parametri.profilassi.messaggi_confronto nel JSON.
 * Se la lezione fornisce solo le chiavi base (es. "sicuro_corretto"),
 * il sistema usa quella; altrimenti cerca la chiave con dettaglio
 * (es. "sicuro_corretto_scacco"), poi la base, poi il default.
 */
const DEFAULTS = {
  // --- SICURO ---
  sicuro_corretto:           { icon: '🎯', message: 'Eri sicuro e avevi ragione! Ottima calibrazione metacognitiva!', type: 'positive' },
  sicuro_corretto_scacco:    { icon: '⚠️', message: 'Mossa corretta, ma il tuo Re era sotto scacco! Presta attenzione alla sicurezza del Re.', type: 'warning' },
  sicuro_corretto_minaccia:  { icon: '⚠️', message: 'Mossa corretta, ma c\'erano pezzi minacciati! Verifica meglio le minacce.', type: 'warning' },
  sicuro_sbagliato:          { icon: '❌', message: 'Eri sicuro, ma la mossa non era la migliore. Attenzione all\'eccesso di fiducia!', type: 'negative' },
  sicuro_sbagliato_scacco:   { icon: '❌', message: 'Eri sicuro, ma il tuo Re era sotto scacco! L\'eccesso di fiducia puo\' essere pericoloso.', type: 'negative' },
  sicuro_sbagliato_minaccia: { icon: '❌', message: 'Eri sicuro, ma c\'era un pezzo minacciato! L\'eccesso di fiducia puo\' costare caro.', type: 'negative' },

  // --- DUBBIO ---
  dubbio_corretto:           { icon: '💡', message: 'Avevi un dubbio, ma la mossa era giusta! Fidati di piu\' del tuo istinto!', type: 'positive' },
  dubbio_corretto_scacco:    { icon: '💡', message: 'Avevi un dubbio, ma la mossa era giusta! Stai migliorando, fidati di te.', type: 'positive' },
  dubbio_corretto_minaccia:  { icon: '💡', message: 'Avevi un dubbio, ma la mossa era giusta! Stai migliorando, fidati di te.', type: 'positive' },
  dubbio_sbagliato:          { icon: '🔍', message: 'Avevi un dubbio e in effetti c\'era una mossa migliore. Il dubbio era giustificato!', type: 'warning' },
  dubbio_sbagliato_scacco:   { icon: '🔍', message: 'Avevi un dubbio e in effetti il Re era sotto scacco. Buona percezione del pericolo!', type: 'warning' },
  dubbio_sbagliato_minaccia: { icon: '🔍', message: 'Avevi un dubbio e in effetti c\'era un pezzo minacciato. Buona percezione del pericolo!', type: 'warning' },

  // --- NON LO SO ---
  non_so_corretto:           { icon: '🌟', message: 'Non eri sicuro, ma hai scelto bene! Sai piu\' di quanto pensi!', type: 'positive' },
  non_so_corretto_scacco:    { icon: '🌟', message: 'Non eri sicuro, ma hai scelto bene! Sai piu\' di quanto pensi!', type: 'positive' },
  non_so_corretto_minaccia:  { icon: '🌟', message: 'Non eri sicuro, ma hai scelto bene! Sai piu\' di quanto pensi!', type: 'positive' },
  non_so_sbagliato:          { icon: '📚', message: 'Non eri sicuro e c\'era una mossa migliore. Continua ad allenarti, migliorerai!', type: 'negative' },
  non_so_sbagliato_scacco:   { icon: '📚', message: 'Non eri sicuro e il Re era sotto scacco. Allena la visione delle minacce al Re!', type: 'negative' },
  non_so_sbagliato_minaccia: { icon: '📚', message: 'Non eri sicuro e c\'era un pezzo minacciato. Continua ad allenarti!', type: 'negative' }
}

/**
 * Analizza la posizione per determinare minacce (scacco al Re, pezzi attaccati).
 */
function analyzeThreats(fen) {
  try {
    const tempGame = new Chess(fen)
    const kingInCheck = tempGame.isCheck()

    const ourColor = tempGame.turn()
    const enemyColor = ourColor === 'w' ? 'b' : 'w'
    const board = tempGame.board()
    let piecesAttacked = false

    board.forEach((row, rowIdx) => {
      row.forEach((piece, colIdx) => {
        if (!piece || piece.color !== ourColor || piece.type === 'k') return
        const sq = String.fromCharCode(97 + colIdx) + (8 - rowIdx)
        if (tempGame.isAttacked(sq, enemyColor)) {
          piecesAttacked = true
        }
      })
    })

    return { kingInCheck, piecesAttacked }
  } catch (e) {
    return { kingInCheck: false, piecesAttacked: false }
  }
}

/**
 * Determina la chiave del messaggio di confronto.
 * Ritorna sia la chiave dettagliata che quella base.
 *
 * @returns {{ detailKey: string, baseKey: string }}
 */
function resolveKey(confidenceLevel, isCorrect, kingInCheck, piecesAttacked) {
  const esito = isCorrect ? 'corretto' : 'sbagliato'
  const baseKey = `${confidenceLevel}_${esito}`

  let detailKey = baseKey
  if (kingInCheck) {
    detailKey = `${baseKey}_scacco`
  } else if (piecesAttacked) {
    detailKey = `${baseKey}_minaccia`
  }

  return { detailKey, baseKey }
}

/**
 * Genera il messaggio di confronto metacognitivo.
 *
 * Risoluzione dei messaggi (in ordine di priorita'):
 * 1. customMessages[chiave_dettagliata]  (es. "sicuro_sbagliato_scacco")
 * 2. customMessages[chiave_base]         (es. "sicuro_sbagliato")
 * 3. DEFAULTS[chiave_dettagliata]
 * 4. DEFAULTS[chiave_base]
 *
 * Le lezioni possono fornire messaggi personalizzati in:
 *   parametri.profilassi.messaggi_confronto
 *
 * Se il valore custom e' una stringa, viene wrappato con icon e type dal default.
 *
 * @param {string} confidenceLevel - 'sicuro' | 'dubbio' | 'non_so'
 * @param {boolean} isCorrect - se la mossa era in mosse_corrette
 * @param {string} preMoveFen - FEN della posizione PRIMA della mossa
 * @param {Object|null} customMessages - messaggi personalizzati dalla lezione
 * @returns {{ icon: string, message: string, type: string }}
 */
export function generateConfrontation(confidenceLevel, isCorrect, preMoveFen, customMessages = null) {
  const { kingInCheck, piecesAttacked } = analyzeThreats(preMoveFen)
  const { detailKey, baseKey } = resolveKey(confidenceLevel, isCorrect, kingInCheck, piecesAttacked)

  // Cerca prima nei messaggi personalizzati della lezione
  if (customMessages) {
    const customDetail = customMessages[detailKey]
    const customBase = customMessages[baseKey]
    const custom = customDetail || customBase

    if (custom) {
      // Se e' una stringa, wrappa con icon/type dal default corrispondente
      if (typeof custom === 'string') {
        const fallback = DEFAULTS[detailKey] || DEFAULTS[baseKey]
        return { icon: fallback.icon, message: custom, type: fallback.type }
      }
      // Se e' un oggetto completo { icon, message, type }, usalo direttamente
      return { icon: custom.icon, message: custom.message, type: custom.type }
    }
  }

  // Fallback ai messaggi di default
  return DEFAULTS[detailKey] || DEFAULTS[baseKey]
}

/**
 * Esporta i default per referenza (es. per la console admin futura).
 */
export { DEFAULTS as CONFRONTATION_DEFAULTS }
