/**
 * openingPipeline.js
 *
 * Orchestratore della pipeline di generazione lezioni di apertura.
 * 4 passi: IA pianifica → Sistema valida → IA costruisce → Post-processing
 *
 * Fonte dati: Lichess Opening Explorer (statistiche reali) + Stockfish (analisi)
 * Obiettivo: COMPRENSIONE del piano, non memorizzazione delle mosse.
 */

import { planOpening, buildOpeningLesson } from './aiService.js'
import { buildOpeningMaterialsPackage } from './openingEnricher.js'
import { validateLesson } from './lessonSchema.js'
import { legalDests } from './chessService.js'

/**
 * Genera una lezione di apertura usando la pipeline a 4 passi.
 *
 * @param {Object} params
 * @param {string} params.apertura - Descrizione apertura (es. "Ruy Lopez, variante Berlino")
 * @param {string} params.colore - "white" | "black"
 * @param {string} params.livello - "principiante" | "intermedio" | "avanzato"
 * @param {string} [params.varianti] - Varianti da coprire (testo libero)
 * @param {number} [params.profonditа] - Numero di mosse da coprire
 * @param {string} [params.model] - Modello IA da usare
 * @param {function} [params.onProgress]
 * @returns {Promise<{ lesson, validation, sfValidation, plan, materials, usage }>}
 */
export async function generateOpeningLesson(params) {
  const { apertura, colore, livello, varianti, profondita, model, onProgress, contestoStrategico } = params
  let totalUsage = { input_tokens: 0, output_tokens: 0 }

  // ═══ PASSO 1: IA pianifica ═══
  onProgress?.({ step: 1, phase: 'plan', message: 'Passo 1/4 — IA pianifica la struttura...' })

  const planResult = await planOpening({ apertura, colore, livello, varianti, profondita, model })
  const plan = planResult.plan
  totalUsage.input_tokens += planResult.usage?.input_tokens || 0
  totalUsage.output_tokens += planResult.usage?.output_tokens || 0

  onProgress?.({
    step: 1,
    phase: 'plan-done',
    message: `Piano: "${plan.openingName || apertura}" — ${plan.moves?.length || 0} mosse pianificate`,
  })

  if (!plan.moves || plan.moves.length === 0) {
    throw new Error('Il piano non contiene mosse valide. Riprova con una descrizione più specifica.')
  }

  // ═══ PASSO 2: Sistema cerca e valida ═══
  onProgress?.({ step: 2, phase: 'materials', message: 'Passo 2/4 — Opening Explorer + Stockfish...' })

  const materials = await buildOpeningMaterialsPackage(
    {
      moves: plan.moves,
      livello,
      colore,
    },
    {
      onProgress: (p) => {
        onProgress?.({ step: 2, phase: p.phase, message: `Passo 2/4 — ${p.message}` })
      },
    }
  )

  onProgress?.({
    step: 2,
    phase: 'materials-done',
    message: `Materiali pronti: ${materials.summary}`,
  })

  // ═══ PASSO 3: IA costruisce ═══
  onProgress?.({ step: 3, phase: 'build', message: 'Passo 3/4 — IA costruisce la lezione...' })

  const buildResult = await buildOpeningLesson({ plan, materials, model, contestoStrategico })
  let lesson = buildResult.lesson
  totalUsage.input_tokens += buildResult.usage?.input_tokens || 0
  totalUsage.output_tokens += buildResult.usage?.output_tokens || 0

  onProgress?.({
    step: 3,
    phase: 'build-done',
    message: `Lezione costruita: "${lesson.title}" — ${lesson.steps?.length || 0} step`,
  })

  // ═══ PASSO 4: Post-processing ═══
  onProgress?.({ step: 4, phase: 'postprocess', message: 'Passo 4/4 — Validazione...' })

  // 4a. Assicura orientation corretto
  lesson.orientation = colore === 'black' ? 'black' : 'white'

  // 4a-bis. Salva il modello IA usato per la generazione
  lesson.generatedBy = model || 'unknown'

  // 4b. Assicura category = openings
  lesson.category = 'openings'

  // 4c. Assicura initialFen
  if (!lesson.initialFen && materials.positions.length > 0) {
    lesson.initialFen = materials.positions[0].fen
  }

  // 4d. Calcola transizioni deterministicamente
  lesson = computeOpeningTransitions(lesson, materials)

  // 4e. Validazione schema
  const validation = validateLesson(lesson)

  // 4f. Validazione legalità mosse
  const sfValidation = validateMovesLegality(lesson)

  onProgress?.({
    step: 4,
    phase: 'done',
    message: `Completato — ${validation.errors.length} errori schema`,
  })

  return {
    lesson,
    validation,
    sfValidation,
    plan,
    materials,
    usage: totalUsage,
  }
}

/**
 * Calcola le transizioni tra step usando le posizioni dell'apertura.
 */
function computeOpeningTransitions(lesson, materials) {
  if (!lesson?.steps || lesson.steps.length < 2) return lesson

  // Mappa FEN → posizione successiva (tramite moveUci)
  const fenToNext = new Map()
  for (let i = 0; i < materials.positions.length - 1; i++) {
    const curr = materials.positions[i]
    const next = materials.positions[i + 1]
    if (curr.fen && next.fen && next.moveUci) {
      if (!fenToNext.has(curr.fen)) {
        fenToNext.set(curr.fen, { fen: next.fen, moveUci: next.moveUci })
      }
    }
  }

  for (let i = 0; i < lesson.steps.length - 1; i++) {
    const step = lesson.steps[i]
    const nextStep = lesson.steps[i + 1]

    if (!step.fen || !nextStep.fen || step.fen === nextStep.fen) continue
    if (step.transition) continue // già impostata

    // Cerca percorso diretto nella sequenza
    const moves = []
    let currentFen = step.fen
    let safety = 0

    while (currentFen !== nextStep.fen && safety < 10) {
      const next = fenToNext.get(currentFen)
      if (!next) break
      moves.push(next.moveUci)
      currentFen = next.fen
      safety++
    }

    if (currentFen === nextStep.fen && moves.length > 0) {
      step.transition = { moves, resultingFen: nextStep.fen }
    }
  }

  // Rimuovi transizione dall'ultimo step
  const last = lesson.steps[lesson.steps.length - 1]
  if (last.transition) delete last.transition

  return lesson
}

/**
 * Valida la legalità delle mosse negli step.
 */
function validateMovesLegality(lesson) {
  const result = {}

  for (let i = 0; i < (lesson.steps || []).length; i++) {
    const step = lesson.steps[i]
    if (!step.fen) continue

    let destinations
    try {
      destinations = legalDests(step.fen)
    } catch {
      continue
    }

    const movesToCheck = [
      ...(step.correctMoves || []),
      ...(step.allowedMoves || []),
      ...(step.candidateMoves || []).map(m => typeof m === 'string' ? m : m?.move).filter(Boolean),
      ...(step.bestMove ? [step.bestMove] : []),
    ]

    if (movesToCheck.length === 0) continue

    const illegal = []
    for (const uci of movesToCheck) {
      if (typeof uci !== 'string' || uci.length < 4) continue
      const from = uci.slice(0, 2)
      const to = uci.slice(2, 4)
      const fromDests = destinations.get(from)
      if (!fromDests || !fromDests.includes(to)) {
        illegal.push(uci)
      }
    }

    if (illegal.length > 0) result[i] = { illegalMoves: illegal }
  }

  return result
}
