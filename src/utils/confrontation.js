import { Chess } from 'chess.js'

/**
 * Genera il messaggio di confronto metacognitivo confrontando
 * il livello di fiducia dichiarato dallo studente con il risultato reale della mossa.
 *
 * @param {string} confidenceLevel - 'sicuro' | 'dubbio' | 'non_so'
 * @param {boolean} isCorrect - se la mossa era nella lista mosse_corrette
 * @param {string} preMoveFen - FEN della posizione PRIMA della mossa
 * @returns {{ icon: string, message: string, type: string }}
 */
export function generateConfrontation(confidenceLevel, isCorrect, preMoveFen) {
  let kingInCheck = false
  let piecesAttacked = false

  try {
    const tempGame = new Chess(preMoveFen)
    kingInCheck = tempGame.isCheck()

    // Controlla se i nostri pezzi (non il re) sono attaccati da pezzi avversari
    const ourColor = tempGame.turn()
    const enemyColor = ourColor === 'w' ? 'b' : 'w'
    const board = tempGame.board()

    board.forEach((row, rowIdx) => {
      row.forEach((piece, colIdx) => {
        if (!piece || piece.color !== ourColor || piece.type === 'k') return
        const sq = String.fromCharCode(97 + colIdx) + (8 - rowIdx)
        if (tempGame.isAttacked(sq, enemyColor)) {
          piecesAttacked = true
        }
      })
    })
  } catch (e) {
    // Se l'analisi fallisce, genera solo il confronto base
  }

  // --- SICURO ---
  if (confidenceLevel === 'sicuro') {
    if (isCorrect && !kingInCheck && !piecesAttacked) {
      return {
        icon: '🎯',
        message: 'Eri sicuro e avevi ragione! Ottima calibrazione metacognitiva!',
        type: 'positive'
      }
    }
    if (isCorrect && kingInCheck) {
      return {
        icon: '⚠️',
        message: 'Mossa corretta, ma il tuo Re era sotto scacco! Presta attenzione alla sicurezza del Re.',
        type: 'warning'
      }
    }
    if (isCorrect && piecesAttacked) {
      return {
        icon: '⚠️',
        message: 'Mossa corretta, ma c\'erano pezzi minacciati! Verifica meglio le minacce.',
        type: 'warning'
      }
    }
    if (!isCorrect && kingInCheck) {
      return {
        icon: '❌',
        message: 'Eri sicuro, ma il tuo Re era sotto scacco! L\'eccesso di fiducia puo\' essere pericoloso.',
        type: 'negative'
      }
    }
    if (!isCorrect && piecesAttacked) {
      return {
        icon: '❌',
        message: 'Eri sicuro, ma c\'era un pezzo minacciato! L\'eccesso di fiducia puo\' costare caro.',
        type: 'negative'
      }
    }
    return {
      icon: '❌',
      message: 'Eri sicuro, ma la mossa non era la migliore. Attenzione all\'eccesso di fiducia!',
      type: 'negative'
    }
  }

  // --- DUBBIO ---
  if (confidenceLevel === 'dubbio') {
    if (isCorrect && !kingInCheck && !piecesAttacked) {
      return {
        icon: '💡',
        message: 'Avevi un dubbio, ma la mossa era giusta! Fidati di piu\' del tuo istinto!',
        type: 'positive'
      }
    }
    if (isCorrect) {
      return {
        icon: '💡',
        message: 'Avevi un dubbio, ma la mossa era giusta! Stai migliorando, fidati di te.',
        type: 'positive'
      }
    }
    if (kingInCheck) {
      return {
        icon: '🔍',
        message: 'Avevi un dubbio e in effetti il Re era sotto scacco. Buona percezione del pericolo!',
        type: 'warning'
      }
    }
    if (piecesAttacked) {
      return {
        icon: '🔍',
        message: 'Avevi un dubbio e in effetti c\'era un pezzo minacciato. Buona percezione del pericolo!',
        type: 'warning'
      }
    }
    return {
      icon: '🔍',
      message: 'Avevi un dubbio e in effetti c\'era una mossa migliore. Il dubbio era giustificato!',
      type: 'warning'
    }
  }

  // --- NON LO SO ---
  if (isCorrect) {
    return {
      icon: '🌟',
      message: 'Non eri sicuro, ma hai scelto bene! Sai piu\' di quanto pensi!',
      type: 'positive'
    }
  }
  if (kingInCheck) {
    return {
      icon: '📚',
      message: 'Non eri sicuro e il Re era sotto scacco. Allena la visione delle minacce al Re!',
      type: 'negative'
    }
  }
  if (piecesAttacked) {
    return {
      icon: '📚',
      message: 'Non eri sicuro e c\'era un pezzo minacciato. Continua ad allenarti!',
      type: 'negative'
    }
  }
  return {
    icon: '📚',
    message: 'Non eri sicuro e c\'era una mossa migliore. Continua ad allenarti, migliorerai!',
    type: 'negative'
  }
}
