/**
 * lessonPipeline.js
 *
 * Orchestratore della nuova pipeline di generazione lezioni.
 * 4 passi: IA pianifica → Sistema valida → IA costruisce → Post-processing
 *
 * Principio: l'IA fa pedagogia, il sistema fa scacchi.
 */

import { planLesson, buildLesson } from './aiService.js'
import {
  buildMaterialsPackage,
  validateLessonAgainstMaterials,
  computeTransitions,
} from './puzzleEnricher.js'
import { validateLesson } from './lessonSchema.js'
import { legalDests } from './chessService.js'

/**
 * Genera una lezione usando la nuova pipeline a 4 passi.
 *
 * @param {Object} params
 * @param {string} params.tema
 * @param {string} params.livello
 * @param {number} [params.ratingMin]
 * @param {number} [params.ratingMax]
 * @param {string} [params.obiettivo]
 * @param {string} [params.model]
 * @param {function} [params.onProgress] - Callback per aggiornare la UI
 * @returns {Promise<{ lesson, validation, materialsValidation, sfValidation, plan, materials, usage }>}
 */
export async function generateLessonPipeline(params) {
  const { tema, livello, ratingMin, ratingMax, obiettivo, model, onProgress } = params
  let totalUsage = { input_tokens: 0, output_tokens: 0 }

  // ═══ PASSO 1: IA pianifica ═══
  onProgress?.({ step: 1, phase: 'plan', message: 'Passo 1/4 — IA pianifica la struttura...' })

  const planResult = await planLesson({
    tema,
    livello,
    ratingMin,
    ratingMax,
    obiettivo,
    model,
  })

  const plan = planResult.plan
  totalUsage.input_tokens += planResult.usage?.input_tokens || 0
  totalUsage.output_tokens += planResult.usage?.output_tokens || 0

  onProgress?.({
    step: 1,
    phase: 'plan-done',
    message: `Piano: "${plan.title}" — ${plan.stepPlan?.length || 0} step pianificati`,
  })

  // ═══ PASSO 2: Sistema cerca e valida ═══
  onProgress?.({ step: 2, phase: 'materials', message: 'Passo 2/4 — Ricerca puzzle e analisi SF...' })

  const materials = await buildMaterialsPackage(plan.puzzleQuery || {
    themes: plan.themes || [],
    ratingMin: plan.targetRatingMin || ratingMin || 800,
    ratingMax: plan.targetRatingMax || ratingMax || 2000,
    count: 8,
  }, {
    onProgress: (p) => {
      onProgress?.({ step: 2, phase: p.phase, message: `Passo 2/4 — ${p.message}` })
    },
  })

  if (materials.puzzles.length === 0) {
    throw new Error(
      `Nessun puzzle trovato per i criteri: temi=${(plan.puzzleQuery?.themes || plan.themes || []).join(',')}, ` +
      `rating=${plan.targetRatingMin || ratingMin}-${plan.targetRatingMax || ratingMax}. ` +
      'Prova ad allargare il range di rating o cambiare tema.'
    )
  }

  onProgress?.({
    step: 2,
    phase: 'materials-done',
    message: `Materiali pronti: ${materials.summary}`,
  })

  // ═══ PASSO 3: IA costruisce ═══
  onProgress?.({ step: 3, phase: 'build', message: 'Passo 3/4 — IA costruisce la lezione...' })

  const buildResult = await buildLesson({
    plan,
    materials,
    model,
  })

  let lesson = buildResult.lesson
  totalUsage.input_tokens += buildResult.usage?.input_tokens || 0
  totalUsage.output_tokens += buildResult.usage?.output_tokens || 0

  onProgress?.({
    step: 3,
    phase: 'build-done',
    message: `Lezione costruita: "${lesson.title}" — ${lesson.steps?.length || 0} step`,
  })

  // ═══ PASSO 4: Post-processing ═══
  onProgress?.({ step: 4, phase: 'postprocess', message: 'Passo 4/4 — Validazione e transizioni...' })

  // 4a. Validazione materiali
  const materialsValidation = validateLessonAgainstMaterials(lesson, materials)

  // 4b. Calcola transizioni deterministiche
  lesson = computeTransitions(lesson, materials)

  // 4c. Assicura initialFen coerente
  if (lesson.steps?.length > 0 && lesson.steps[0].fen) {
    lesson.initialFen = lesson.steps[0].fen
  }

  // 4d. Aggiungi sourcePuzzleIds
  lesson.sourcePuzzleIds = materials.puzzles.map(p => p.id).filter(Boolean)

  // 4e. Validazione schema
  const validation = validateLesson(lesson)

  // 4f. Validazione mosse legali
  const sfValidation = validateMovesLegality(lesson)

  onProgress?.({
    step: 4,
    phase: 'done',
    message: `Completato — ${validation.errors.length} errori, ${materialsValidation.errors.length} FEN inventate`,
  })

  return {
    lesson,
    validation,
    materialsValidation,
    sfValidation,
    plan,
    materials,
    usage: totalUsage,
  }
}

/**
 * Valida la legalità delle mosse in ogni step usando chessService.
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
      ...(step.candidateMoves || []).map(m => typeof m === 'string' ? m : m.move).filter(Boolean),
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

    if (illegal.length > 0) {
      result[i] = { illegalMoves: illegal }
    }
  }

  return result
}
