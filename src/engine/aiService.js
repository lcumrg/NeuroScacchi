// Client-side service per le interazioni con l'IA (Anthropic Claude via Netlify Function)

import { LESSON_SYSTEM_PROMPT } from './lessonSystemPrompt.js'
import { validateLesson } from './lessonSchema.js'
import puzzleDatabase from './puzzleDatabase.js'

const AI_CHAT_ENDPOINT = '/api/ai-chat'

// Mappa tema italiano → tag Lichess
const THEME_TO_LICHESS = {
  tattica: ['fork', 'pin', 'skewer', 'discoveredAttack', 'deflection'],
  finali: ['endgame', 'rookEndgame', 'pawnEndgame', 'queenEndgame'],
  strategia: ['strategicPlay', 'advantage', 'zugzwang'],
  aperture: [], // gestito separatamente con openingTags
}

/**
 * Recupera puzzle candidati dal database Lichess in base al tema e al range di rating.
 *
 * @param {string} tema - Tema in italiano
 * @param {number} ratingMin
 * @param {number} ratingMax
 * @returns {Promise<Array<{fen: string, moves: string[], themes: string[]}>>}
 */
async function fetchCandidatePuzzles(tema, ratingMin, ratingMax) {
  try {
    if (tema === 'aperture') {
      return await puzzleDatabase.getOpeningPuzzles({ ratingMin, ratingMax, count: 5 })
    }

    const tags = THEME_TO_LICHESS[tema] || []
    if (tags.length === 0) return []

    return await puzzleDatabase.getRandomPuzzles({
      theme: tags[0],
      ratingMin,
      ratingMax,
      count: 5,
    })
  } catch {
    return []
  }
}

/**
 * Invia un messaggio all'IA e restituisce la risposta.
 *
 * @param {Array<{role: string, content: string}>} messages - Cronologia messaggi
 * @param {string} [systemPrompt] - System prompt opzionale
 * @returns {Promise<{content: string, usage: {input_tokens: number, output_tokens: number}}>}
 */
export async function sendMessage(messages, systemPrompt) {
  const body = { messages }
  if (systemPrompt) {
    body.system = systemPrompt
  }

  const response = await fetch(AI_CHAT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const message = errorData.details || errorData.error || `Errore HTTP ${response.status}`
    throw new AIServiceError(message, response.status)
  }

  return response.json()
}

/**
 * Genera una bozza di lezione usando l'IA.
 *
 * @param {Object} params
 * @param {string} params.tema - Tema della lezione (es. "doppio di cavallo", "arrocco", "finale di torri")
 * @param {string} params.livello - Livello target: "beginner" | "intermediate" | "advanced"
 * @param {number} [params.ratingMin] - Rating minimo dello studente target
 * @param {number} [params.ratingMax] - Rating massimo dello studente target
 * @param {string} [params.obiettivo] - Obiettivo didattico specifico
 * @param {string} [params.fenPartenza] - FEN di partenza opzionale (se il coach ha già una posizione)
 * @returns {Promise<{lesson: Object, validation: {valid: boolean, errors: string[], warnings: string[]}, usage: Object}>}
 */
export async function generateLesson(params) {
  const { tema, livello, ratingMin, ratingMax, obiettivo, fenPartenza } = params

  // Recupera puzzle candidati dal database prima di costruire il prompt
  const candidatePuzzles = await fetchCandidatePuzzles(tema, ratingMin, ratingMax)

  // Costruisci il prompt utente con i parametri specifici
  const parts = [`Crea una lezione sul tema: "${tema}".`]

  parts.push(`Livello di difficoltà: ${translateLevel(livello)}.`)

  if (ratingMin != null || ratingMax != null) {
    const range = []
    if (ratingMin != null) range.push(`da ${ratingMin}`)
    if (ratingMax != null) range.push(`a ${ratingMax}`)
    parts.push(`Rating target: ${range.join(' ')}.`)
  }

  if (obiettivo) {
    parts.push(`Obiettivo didattico: ${obiettivo}.`)
  }

  if (fenPartenza) {
    parts.push(`Parti da questa posizione FEN: ${fenPartenza}`)
  } else {
    parts.push(
      'Usa una posizione classica e ben nota per questo tema. ' +
      'Se non conosci una posizione appropriata con certezza, segnalalo e suggerisci di cercare nel database puzzle.'
    )
  }

  if (candidatePuzzles.length > 0) {
    parts.push(
      'Posizioni candidate dal database Lichess (scegli quella più adatta o usane una come ispirazione):\n' +
      candidatePuzzles
        .map(p => `- FEN: ${p.fen} | Temi: ${Array.isArray(p.themes) ? p.themes.join(', ') : p.themes} | Prima mossa soluzione: ${p.moves[0]}`)
        .join('\n')
    )
  }

  parts.push('La lezione deve avere almeno 2-4 step che seguano il ciclo Osserva → Ragiona → Scegli.')
  parts.push('Rispondi SOLO con il JSON della lezione, senza testo aggiuntivo.')

  const userMessage = parts.join('\n')

  const result = await sendMessage(
    [{ role: 'user', content: userMessage }],
    LESSON_SYSTEM_PROMPT
  )

  // Estrai e parsa il JSON dalla risposta
  const lesson = extractJSON(result.content)

  if (!lesson) {
    throw new AIServiceError(
      'L\'IA non ha restituito un JSON valido. Risposta ricevuta:\n' + result.content.substring(0, 500)
    )
  }

  // Se l'IA ha segnalato un errore
  if (lesson.error) {
    throw new AIServiceError(`L'IA ha segnalato un problema: ${lesson.error}`)
  }

  // Sanitizza le mosse: rimuove simboli algebrici (x, +, #, =) che l'IA produce invece di UCI puro
  sanitizeLessonMoves(lesson)

  return {
    lesson,
    validation: validateLesson(lesson),
    usage: result.usage,
  }
}

/**
 * Converte mosse in formato algebrico spurio → UCI puro.
 * Es: "c5xb4" → "c5b4", "g1f3+" → "g1f3", "e7e8=q" → "e7e8q"
 * Modifica la lezione in-place.
 */
function sanitizeLessonMoves(lesson) {
  if (!lesson?.steps) return

  const cleanMove = (m) => {
    if (typeof m !== 'string') return m
    // Rimuove x (cattura), + (scacco), # (matto), = (promozione separatore)
    return m.replace(/[x+#=]/g, '').toLowerCase()
  }

  for (const step of lesson.steps) {
    if (step.correctMoves) step.correctMoves = step.correctMoves.map(cleanMove)
    if (step.allowedMoves) step.allowedMoves = step.allowedMoves.map(cleanMove)
    if (step.candidateMoves) step.candidateMoves = step.candidateMoves.map(cleanMove)
    if (step.bestMove) step.bestMove = cleanMove(step.bestMove)
    if (step.transition?.moves) step.transition.moves = step.transition.moves.map(cleanMove)
    if (step.moves) step.moves = step.moves.map(cleanMove) // demo steps
  }
}

/**
 * Raffina una lezione esistente tramite dialogo con l'IA.
 *
 * @param {Object} params
 * @param {Object} params.lesson - La lezione corrente da raffinare
 * @param {string} params.userMessage - La richiesta del coach
 * @param {Array<{role: string, content: string}>} [params.history] - Cronologia messaggi precedenti
 * @param {Object} [params.stockfishContext] - Contesto di analisi Stockfish opzionale
 * @returns {Promise<{lesson: Object, validation: {valid: boolean, errors: string[], warnings: string[]}, usage: Object}>}
 */
export async function refineLesson({ lesson, userMessage, history = [], stockfishContext }) {
  const refinementPrompt = [
    'Lezione attuale:',
    JSON.stringify(lesson, null, 2),
    '',
    `Richiesta del coach: ${userMessage}`,
  ]

  if (stockfishContext) {
    refinementPrompt.push('')
    refinementPrompt.push('Contesto Stockfish:')
    refinementPrompt.push(JSON.stringify(stockfishContext, null, 2))
  }

  refinementPrompt.push('')
  refinementPrompt.push('Rispondi SOLO con il JSON aggiornato della lezione.')

  const messages = [
    ...history,
    { role: 'user', content: refinementPrompt.join('\n') },
  ]

  const result = await sendMessage(messages, LESSON_SYSTEM_PROMPT)

  const updatedLesson = extractJSON(result.content)

  if (!updatedLesson) {
    throw new AIServiceError(
      'L\'IA non ha restituito un JSON valido. Risposta ricevuta:\n' + result.content.substring(0, 500)
    )
  }

  if (updatedLesson.error) {
    throw new AIServiceError(`L'IA ha segnalato un problema: ${updatedLesson.error}`)
  }

  return {
    lesson: updatedLesson,
    validation: validateLesson(updatedLesson),
    usage: result.usage,
  }
}

/**
 * Estrae un oggetto JSON da una stringa che potrebbe contenere testo aggiuntivo,
 * blocchi di codice markdown, ecc.
 */
function extractJSON(text) {
  if (!text || typeof text !== 'string') return null

  // Prova prima il parsing diretto
  try {
    return JSON.parse(text.trim())
  } catch { /* continua */ }

  // Cerca un blocco ```json ... ```
  const jsonBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (jsonBlockMatch) {
    try {
      return JSON.parse(jsonBlockMatch[1].trim())
    } catch { /* continua */ }
  }

  // Cerca il primo { ... } bilanciato
  const firstBrace = text.indexOf('{')
  if (firstBrace === -1) return null

  let depth = 0
  let inString = false
  let escape = false

  for (let i = firstBrace; i < text.length; i++) {
    const ch = text[i]

    if (escape) {
      escape = false
      continue
    }

    if (ch === '\\' && inString) {
      escape = true
      continue
    }

    if (ch === '"') {
      inString = !inString
      continue
    }

    if (inString) continue

    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        try {
          return JSON.parse(text.substring(firstBrace, i + 1))
        } catch {
          return null
        }
      }
    }
  }

  return null
}

/**
 * Traduce il livello in italiano per il prompt.
 */
function translateLevel(level) {
  const map = {
    beginner: 'principiante',
    intermediate: 'intermedio',
    advanced: 'avanzato',
  }
  return map[level] || level
}

/**
 * Errore specifico del servizio IA.
 */
export class AIServiceError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'AIServiceError'
    this.status = status || null
  }
}
