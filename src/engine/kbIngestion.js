// Knowledge Base — logica di ingestion
// Foto manuale → Vision → estrazione strutturata → chessops FEN → chunk

import { INITIAL_FEN } from 'chessops/fen'
import { parseFen } from './chessService.js'
import { makeSanAndPlay, parseSan } from 'chessops/san'
import { makeFen } from 'chessops/fen'
import { Chess } from 'chessops/chess'
import { parseFen as parseChessopsFen } from 'chessops/fen'

const AI_CHAT_ENDPOINT = '/api/ai-chat'

// ─── Prompt Vision per estrazione strutturata ───────────────────────

const VISION_EXTRACTION_PROMPT = `Sei un esperto di scacchi. Analizza questa pagina di un manuale di scacchi e estrai la conoscenza strategica in formato strutturato JSON.

REGOLE FONDAMENTALI:
- Estrai i PRINCIPI STRATEGICI, non copiare frasi dal libro. Riformula sempre.
- Identifica TUTTE le sequenze di mosse menzionate nel testo.
- Le mosse possono essere in notazione italiana (C=Cavallo, A=Alfiere, T=Torre, D=Donna, R=Re) o inglese (N, B, R, Q, K). Riportale ESATTAMENTE come appaiono nel testo.
- Se una pagina copre più posizioni/varianti, crea un chunk separato per ciascuna.
- NON produrre FEN — verranno calcolate dal sistema.
- Se c'è un diagramma senza sequenza di mosse associata, descrivi la posizione in termini strategici.

FORMATO OUTPUT — rispondi SOLO con un JSON array (niente altro testo):

[
  {
    "apertura": "nome apertura (es. Spagnola, Siciliana)",
    "variante": "nome variante se identificabile",
    "sottoVariante": "sotto-variante se applicabile, altrimenti null",
    "sequenzaMosse": "1.e4 e5 2.Cf3 Cc6 3.Ab5 a6 — dalla posizione iniziale alla posizione chiave",
    "principiStrategici": [
      "principio 1 riformulato con parole tue",
      "principio 2 riformulato con parole tue"
    ],
    "piani": {
      "bianco": "piano strategico del bianco",
      "nero": "piano strategico del nero"
    },
    "erroriTipici": [
      "errore tipico 1",
      "errore tipico 2"
    ],
    "concettiChiave": ["concetto1", "concetto2"],
    "livello": "principiante | intermedio | avanzato | tutti"
  }
]

Se la pagina contiene più posizioni chiave, restituisci più oggetti nell'array.
Se la pagina non contiene informazioni scacchistiche utili, restituisci un array vuoto [].`

// ─── Conversione notazione italiana → inglese ───────────────────────

const ITALIAN_TO_ENGLISH = { C: 'N', A: 'B', T: 'R', D: 'Q', R: 'K' }
const ITALIAN_PIECES = /^[CATDR]/

/**
 * Converte una singola mossa SAN da notazione italiana a inglese.
 * Es: "Cf3" → "Nf3", "Ab5" → "Bb5", "O-O" → "O-O", "e4" → "e4"
 */
function italianSanToEnglish(san) {
  // Arrocco — invariante
  if (san.startsWith('O-') || san.startsWith('0-')) return san.replace(/0/g, 'O')
  // Pezzo italiano
  if (ITALIAN_PIECES.test(san)) {
    return ITALIAN_TO_ENGLISH[san[0]] + san.slice(1)
  }
  return san
}

/**
 * Parsa una stringa di mosse tipo "1.e4 e5 2.Cf3 Cc6 3.Ab5 a6"
 * e restituisce un array di SAN in notazione inglese.
 */
function parseMovesString(movesStr) {
  if (!movesStr || typeof movesStr !== 'string') return []

  // Rimuovi numeri mossa ("1.", "2.", "1...", "15.") e trim
  const tokens = movesStr
    .replace(/\d+\.{1,3}/g, ' ')  // rimuovi "1.", "2...", ecc.
    .replace(/[–—-]\s*$/g, '')     // rimuovi trattino finale
    .split(/\s+/)
    .filter(t => t.length > 0)

  return tokens.map(italianSanToEnglish)
}

// ─── Calcolo FEN da sequenza mosse ──────────────────────────────────

/**
 * Calcola le FEN per una sequenza di mosse SAN (notazione inglese).
 * Ritorna la lista di FEN per ogni posizione raggiunta.
 *
 * @param {string[]} sans - Mosse in SAN inglese
 * @param {string} [startFen] - FEN di partenza (default: posizione iniziale)
 * @returns {{ fens: string[], error?: string }}
 */
export function computeFensFromSans(sans, startFen = INITIAL_FEN) {
  const fens = [startFen]

  const setup = parseChessopsFen(startFen)
  if (setup.isErr) return { fens: [], error: `FEN iniziale invalida: ${startFen}` }
  const pos = Chess.fromSetup(setup.unwrap())
  if (pos.isErr) return { fens: [], error: `Posizione illegale: ${startFen}` }
  const chess = pos.unwrap()

  for (let i = 0; i < sans.length; i++) {
    const move = parseSan(chess, sans[i])
    if (!move) {
      return {
        fens,
        error: `Mossa ${i + 1} invalida: "${sans[i]}" nella posizione ${makeFen(chess.toSetup())}`,
      }
    }
    makeSanAndPlay(chess, move)
    fens.push(makeFen(chess.toSetup()))
  }

  return { fens }
}

// ─── Chiamata Vision ────────────────────────────────────────────────

/**
 * Invia un'immagine a Vision (Gemini) per estrazione strutturata.
 *
 * @param {string} base64Data - Immagine in base64 (senza prefisso data:...)
 * @param {string} mimeType - es. "image/jpeg", "image/png"
 * @param {{ fonte?: { nome?: string, pagina?: number, autore?: string } }} [meta]
 * @returns {Promise<Array<object>>} - Array di chunk estratti (senza FEN, da calcolare)
 */
export async function extractFromImage(base64Data, mimeType, meta = {}) {
  const messages = [
    {
      role: 'user',
      content: [
        { type: 'image', mime_type: mimeType, data: base64Data },
        { type: 'text', text: 'Analizza questa pagina del manuale di scacchi ed estrai la conoscenza strategica.' },
      ],
    },
  ]

  const response = await fetch(AI_CHAT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      system: VISION_EXTRACTION_PROMPT,
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`Errore Vision API: ${response.status} — ${errText.substring(0, 300)}`)
  }

  const data = await response.json()
  const content = data.content || ''

  // Estrai JSON dalla risposta (può essere wrappato in ```json ... ```)
  const jsonMatch = content.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('Vision non ha restituito un JSON valido. Risposta: ' + content.substring(0, 500))
  }

  const rawChunks = JSON.parse(jsonMatch[0])
  if (!Array.isArray(rawChunks)) {
    throw new Error('Vision ha restituito un JSON che non è un array')
  }

  // Arricchisci ogni chunk con metadati fonte
  return rawChunks.map(chunk => ({
    ...chunk,
    fonte: {
      nome: meta.fonte?.nome || '',
      pagina: meta.fonte?.pagina || null,
      autore: meta.fonte?.autore || '',
    },
  }))
}

// ─── Pipeline completa: immagine → chunk con FEN ────────────────────

/**
 * Processa un chunk estratto da Vision: converte la sequenza mosse in FEN.
 * Ritorna il chunk arricchito con le FEN calcolate.
 *
 * @param {object} rawChunk - Chunk estratto da Vision (con sequenzaMosse)
 * @returns {{ chunk: object, error?: string }}
 */
export function enrichChunkWithFens(rawChunk) {
  if (!rawChunk.sequenzaMosse) {
    return {
      chunk: { ...rawChunk, fens: [] },
      error: 'Nessuna sequenza di mosse trovata',
    }
  }

  const sans = parseMovesString(rawChunk.sequenzaMosse)
  if (sans.length === 0) {
    return {
      chunk: { ...rawChunk, fens: [] },
      error: `Impossibile parsare la sequenza: "${rawChunk.sequenzaMosse}"`,
    }
  }

  const { fens, error } = computeFensFromSans(sans)

  // La FEN chiave è l'ultima (posizione finale della sequenza)
  return {
    chunk: {
      ...rawChunk,
      fens: fens.length > 0 ? [fens[fens.length - 1]] : [],
      allFens: fens, // tutte le FEN del percorso, utile per preview
      parsedSans: sans,
    },
    error,
  }
}

/**
 * Pipeline completa: immagine → estrazione Vision → calcolo FEN per ogni chunk.
 *
 * @param {string} base64Data
 * @param {string} mimeType
 * @param {{ fonte?: object }} [meta]
 * @returns {Promise<Array<{ chunk: object, error?: string }>>}
 */
export async function processImage(base64Data, mimeType, meta = {}) {
  const rawChunks = await extractFromImage(base64Data, mimeType, meta)
  return rawChunks.map(raw => enrichChunkWithFens(raw))
}

// ─── Export utilità per test ─────────────────────────────────────────

export { parseMovesString, italianSanToEnglish }
