import { parseFen as parseChessopsFen, makeFen, INITIAL_FEN } from 'chessops/fen'
import { Chess } from 'chessops/chess'
import { parseUci as parseChessopsUci, makeUci as makeChessopsUci, parseSquare, makeSquare } from 'chessops/util'
import { chessgroundDests } from 'chessops/compat'
import { makeSanAndPlay, makeSan, parseSan } from 'chessops/san'
import { parsePgn as parseChessopsPgn, startingPosition, parseComment } from 'chessops/pgn'

export { INITIAL_FEN }

function setupToChess(fen) {
  const setup = parseChessopsFen(fen)
  if (setup.isErr) throw new Error(`Invalid FEN: ${fen}`)
  const pos = Chess.fromSetup(setup.unwrap())
  if (pos.isErr) throw new Error(`Illegal position: ${fen}`)
  return pos.unwrap()
}

export function parseFen(fen) {
  return setupToChess(fen)
}

export function legalDests(fen) {
  const pos = setupToChess(fen)
  return chessgroundDests(pos)
}

export function makeMove(fen, move) {
  try {
    const pos = setupToChess(fen)
    const chessopsMove = {
      from: parseSquare(move.from),
      to: parseSquare(move.to),
      promotion: move.promotion || undefined,
    }
    if (!pos.isLegal(chessopsMove)) return { valid: false }
    const san = makeSanAndPlay(pos, chessopsMove)
    return { valid: true, san, fen: makeFen(pos.toSetup()) }
  } catch {
    return { valid: false }
  }
}

export function parseUci(uci) {
  const move = parseChessopsUci(uci)
  if (!move || !('from' in move)) return null
  const result = { from: makeSquare(move.from), to: makeSquare(move.to) }
  if (move.promotion) result.promotion = move.promotion
  return result
}

export function toUci(move) {
  const m = { from: parseSquare(move.from), to: parseSquare(move.to) }
  if (move.promotion) m.promotion = move.promotion
  return makeChessopsUci(m)
}

export function turnColor(fen) {
  const pos = setupToChess(fen)
  return pos.turn
}

export function isCheckmate(fen) {
  const pos = setupToChess(fen)
  return pos.isCheckmate()
}

export function isStalemate(fen) {
  const pos = setupToChess(fen)
  return pos.isStalemate()
}

export function isCheck(fen) {
  const pos = setupToChess(fen)
  return pos.isCheck()
}

/**
 * Applica una mossa UCI a una FEN e restituisce la nuova FEN + SAN.
 * Deterministic — usato dalla pipeline per calcolare posizioni dai puzzle Lichess.
 *
 * @param {string} fen - FEN di partenza
 * @param {string} uci - Mossa in formato UCI (es. "e2e4", "e7e8q")
 * @returns {{ valid: boolean, fen?: string, san?: string, isCheck?: boolean, isCheckmate?: boolean, isStalemate?: boolean }}
 */
export function makeMoveFromUci(fen, uci) {
  try {
    const pos = setupToChess(fen)
    const parsed = parseChessopsUci(uci)
    if (!parsed) return { valid: false }
    if (!pos.isLegal(parsed)) return { valid: false }
    const san = makeSanAndPlay(pos, parsed)
    return {
      valid: true,
      fen: makeFen(pos.toSetup()),
      san,
      isCheck: pos.isCheck(),
      isCheckmate: pos.isCheckmate(),
      isStalemate: pos.isStalemate(),
    }
  } catch {
    return { valid: false }
  }
}

/**
 * Restituisce la notazione SAN di una mossa UCI in una data posizione.
 *
 * @param {string} fen
 * @param {string} uci
 * @returns {string|null}
 */
export function getSan(fen, uci) {
  try {
    const pos = setupToChess(fen)
    const parsed = parseChessopsUci(uci)
    if (!parsed || !pos.isLegal(parsed)) return null
    return makeSan(pos, parsed)
  } catch {
    return null
  }
}

export function kingSquareInCheck(fen) {
  const pos = setupToChess(fen)
  if (!pos.isCheck()) return null
  const kingSquare = pos.board.kingOf(pos.turn)
  if (kingSquare === undefined) return null
  return makeSquare(kingSquare)
}

export function parsePgn(pgn) {
  const games = parseChessopsPgn(pgn)
  if (games.length === 0) return []

  const game = games[0]
  const posResult = startingPosition(game.headers)
  if (posResult.isErr) return []
  const pos = posResult.unwrap()

  const positions = [{ fen: makeFen(pos.toSetup()), move: null, san: null }]

  for (const node of game.moves.mainline()) {
    const move = parseSan(pos, node.san)
    if (!move) break

    const san = makeSanAndPlay(pos, move)
    const entry = { fen: makeFen(pos.toSetup()), move, san }

    if (node.comments && node.comments.length > 0) {
      const parsed = parseComment(node.comments[0])
      entry.comment = parsed.text || undefined
      if (parsed.shapes.length > 0) {
        entry.arrows = parsed.shapes
          .filter(s => s.from !== s.to)
          .map(s => ({ orig: makeSquare(s.from), dest: makeSquare(s.to), brush: s.color }))
        entry.circles = parsed.shapes
          .filter(s => s.from === s.to)
          .map(s => ({ key: makeSquare(s.from), brush: s.color }))
      }
    }

    positions.push(entry)
  }

  return positions
}
