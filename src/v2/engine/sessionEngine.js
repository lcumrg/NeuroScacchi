// Session Engine — genera sessioni su misura
//
// Combina: spaced repetition + difficolta adattiva + percorsi tematici + direttive coach

import { selectPositionsForSession } from './spacedRepetition'
import { filterByDifficulty, getStudentLevel, getEffectiveDifficulty } from './adaptiveDifficulty'
import { getSRRecords } from '../utils/storage'
import allPositions from '../data/positions.json'

/**
 * Genera una sessione di allenamento.
 *
 * @param {Object} options
 * @param {number} options.count - Numero posizioni (default 10)
 * @param {string|null} options.theme - Focus su un tema specifico (null = mix)
 * @param {Object|null} options.directives - Direttive del coach
 * @returns {Array} Lista di posizioni ordinate per la sessione
 */
export function generateSession({ count = 10, theme = null, directives = null } = {}) {
  const srRecords = getSRRecords()
  let pool = [...allPositions]

  // 1. Filtra per tema se specificato
  if (theme) {
    pool = pool.filter(p => p.theme === theme)
  }

  // 2. Applica direttive coach
  if (directives) {
    if (directives.theme) {
      pool = pool.filter(p => p.theme === directives.theme)
    }
    if (directives.minDifficulty) {
      pool = pool.filter(p => getEffectiveDifficulty(p) >= directives.minDifficulty)
    }
    if (directives.maxDifficulty) {
      pool = pool.filter(p => getEffectiveDifficulty(p) <= directives.maxDifficulty)
    }
    if (directives.specificPositions && directives.specificPositions.length > 0) {
      const specificIds = new Set(directives.specificPositions)
      const specific = pool.filter(p => specificIds.has(p.id))
      const rest = pool.filter(p => !specificIds.has(p.id))
      pool = [...specific, ...rest] // Specifiche prima
    }
  }

  // 3. Difficolta adattiva — solo se il pool e' abbastanza grande
  //    Con pochi esercizi per tema, il filtro rischia di svuotare il pool
  if (!directives?.minDifficulty && !directives?.maxDifficulty && pool.length > count) {
    const level = theme
      ? getStudentLevel(enrichRecords(srRecords), theme)
      : getAverageLevel(enrichRecords(srRecords))
    const filtered = filterByDifficulty(pool, level, Math.min(count, pool.length))
    if (filtered.length > 0) {
      pool = filtered
    }
  }

  // 4. Spaced repetition: prioritizza posizioni in scadenza e mai viste
  const selected = selectPositionsForSession(pool, srRecords, count)

  return selected
}

/**
 * Arricchisce i record SR con tema e difficolta dalla posizione originale.
 */
function enrichRecords(srRecords) {
  const posMap = {}
  allPositions.forEach(p => { posMap[p.id] = p })

  return srRecords.map(r => ({
    ...r,
    theme: posMap[r.positionId]?.theme || 'tactics',
    difficulty: posMap[r.positionId] ? getEffectiveDifficulty(posMap[r.positionId]) : 3,
  }))
}

/**
 * Calcola il livello medio dello studente su tutti i temi.
 */
function getAverageLevel(enrichedRecords) {
  if (enrichedRecords.length === 0) return 3

  const themes = new Set(enrichedRecords.map(r => r.theme))
  let sum = 0
  themes.forEach(theme => {
    sum += getStudentLevel(enrichedRecords.filter(r => r.theme === theme), theme)
  })
  return Math.round(sum / themes.size)
}

/**
 * Restituisce i temi disponibili con conteggio posizioni.
 */
export function getAvailableThemes() {
  const themes = {}
  allPositions.forEach(p => {
    themes[p.theme] = (themes[p.theme] || 0) + 1
  })
  return themes
}
