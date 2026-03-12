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
export async function sendMessage(messages, systemPrompt, model) {
  const body = { messages }
  if (systemPrompt) body.system = systemPrompt
  if (model) body.model = model

  const response = await fetch(AI_CHAT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const rawText = await response.text().catch(() => '')
    let message = `Errore HTTP ${response.status}`
    try {
      const errorData = JSON.parse(rawText)
      message = errorData.details || errorData.error || message
    } catch {
      if (rawText.length > 0) {
        message = `Errore HTTP ${response.status}: ${rawText.substring(0, 300)}`
      }
    }
    throw new AIServiceError(message, response.status)
  }

  // Legge la risposta SSE streaming
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullText = ''
  let usage = { input_tokens: 0, output_tokens: 0 }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (!data) continue

      try {
        const event = JSON.parse(data)
        if (event.error) throw new AIServiceError(event.error)
        if (event.text) fullText += event.text
        if (event.done && event.usage) usage = event.usage
      } catch (err) {
        if (err instanceof AIServiceError) throw err
        // ignora chunk malformati
      }
    }
  }

  if (!fullText) {
    throw new AIServiceError("L'IA non ha prodotto output")
  }

  return { content: fullText, usage }
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
  const { tema, livello, ratingMin, ratingMax, obiettivo, fenPartenza, model } = params

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

  const messages = [{ role: 'user', content: userMessage }]
  let result = await sendMessage(messages, LESSON_SYSTEM_PROMPT, model)
  let lesson = extractJSON(result.content)

  // Retry automatico se il JSON è invalido: rimanda l'errore all'IA e chiede correzione
  if (!lesson) {
    const retryMessages = [
      ...messages,
      { role: 'assistant', content: result.content },
      {
        role: 'user',
        content:
          'Il JSON che hai generato contiene un errore di sintassi (es. "type": "text": "valore" invece di "type": "text", "content": "valore").\n' +
          'Restituisci SOLO il JSON corretto e completo, senza blocchi markdown, senza testo aggiuntivo. Inizia con { e finisci con }.',
      },
    ]
    result = await sendMessage(retryMessages, LESSON_SYSTEM_PROMPT, model)
    lesson = extractJSON(result.content)
  }

  if (!lesson) {
    const preview = result.content.substring(0, 1000)
    const totalLen = result.content.length
    throw new AIServiceError(
      `L'IA non ha restituito un JSON valido (${totalLen} chars totali). Inizio risposta:\n${preview}`
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
export async function refineLesson({ lesson, userMessage, history = [], stockfishContext, model }) {
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

  let result = await sendMessage(messages, LESSON_SYSTEM_PROMPT, model)
  let updatedLesson = extractJSON(result.content)

  if (!updatedLesson) {
    const retryMessages = [
      ...messages,
      { role: 'assistant', content: result.content },
      {
        role: 'user',
        content:
          'Il JSON contiene un errore di sintassi.\n' +
          'Restituisci SOLO il JSON corretto e completo, senza blocchi markdown, senza testo aggiuntivo. Inizia con { e finisci con }.',
      },
    ]
    result = await sendMessage(retryMessages, LESSON_SYSTEM_PROMPT, model)
    updatedLesson = extractJSON(result.content)
  }

  if (!updatedLesson) {
    const preview = result.content.substring(0, 1000)
    const totalLen = result.content.length
    throw new AIServiceError(
      `L'IA non ha restituito un JSON valido (${totalLen} chars totali). Inizio risposta:\n${preview}`
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
 * blocchi di codice markdown, ecc. Usa più strategie in cascata.
 */
function extractJSON(text) {
  if (!text || typeof text !== 'string') return null

  const attempts = [text.trim()]

  // Estrai contenuto da blocco ```json ... ``` (greedy: fino all'ultimo ```)
  const fenceGreedy = text.match(/```(?:json)?\s*\n?([\s\S]+)\n?\s*```/)
  if (fenceGreedy) attempts.push(fenceGreedy[1].trim())

  // Estrai contenuto da blocco ```json ... ``` (non-greedy)
  const fenceNonGreedy = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (fenceNonGreedy) attempts.push(fenceNonGreedy[1].trim())

  // Substring dal primo { all'ultimo }
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    attempts.push(text.substring(firstBrace, lastBrace + 1))
  }

  for (const candidate of attempts) {
    if (!candidate) continue
    // Prova parse diretto
    try { return JSON.parse(candidate) } catch { /* continua */ }

    // Se fallisce, prova a trovare { ... } bilanciato nel candidate
    const start = candidate.indexOf('{')
    if (start === -1) continue

    let depth = 0
    let inString = false
    let escape = false

    for (let i = start; i < candidate.length; i++) {
      const ch = candidate[i]
      if (escape) { escape = false; continue }
      if (ch === '\\' && inString) { escape = true; continue }
      if (ch === '"') { inString = !inString; continue }
      if (inString) continue
      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) {
          try { return JSON.parse(candidate.substring(start, i + 1)) } catch { break }
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
