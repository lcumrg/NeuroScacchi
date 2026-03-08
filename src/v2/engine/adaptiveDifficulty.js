// Adaptive Difficulty — calibra la difficolta in base ai risultati
//
// Ogni studente ha un "livello" per tema (1-10).
// Il sistema sceglie posizioni nella zona ~60-70% probabilita di successo.
// Se lo studente azzecca molte di fila → sale. Se sbaglia molte → scende.
//
// Con Stockfish (Strato 4.4): la difficolta puo essere calcolata automaticamente
// in base alla depth minima a cui il motore trova la soluzione.
// Le posizioni curate dal coach mantengono la difficolta manuale come fallback.

import { evaluate } from './stockfishService'

const DEFAULT_LEVEL = 3

// Depths a cui testare per trovare la soluzione
const DIFFICULTY_DEPTHS = [1, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20]

/**
 * Mappa la depth minima a cui Stockfish trova la soluzione → difficolta 1-10.
 */
export function depthToDifficulty(depthFound) {
  if (depthFound <= 1) return 1
  if (depthFound <= 3) return 2
  if (depthFound <= 4) return 3
  if (depthFound <= 6) return 4
  if (depthFound <= 8) return 5
  if (depthFound <= 10) return 6
  if (depthFound <= 12) return 7
  if (depthFound <= 14) return 8
  if (depthFound <= 16) return 9
  return 10
}

/**
 * Calcola la difficolta di una posizione con Stockfish.
 * Analizza a depth crescenti e restituisce la depth minima
 * a cui la bestMove coincide con una delle solutionMoves.
 *
 * @returns {{ difficulty: number, depthFound: number|null, bestMove: string }}
 */
export async function calculateDifficulty(fen, solutionMoves) {
  for (const depth of DIFFICULTY_DEPTHS) {
    const result = await evaluate(fen, depth)
    if (solutionMoves.includes(result.bestMove)) {
      return {
        difficulty: depthToDifficulty(depth),
        depthFound: depth,
        bestMove: result.bestMove,
      }
    }
  }
  // Stockfish non trova la soluzione — posizione molto difficile o tematica
  return { difficulty: 10, depthFound: null, bestMove: null }
}

/**
 * Restituisce la difficolta effettiva di una posizione.
 * Usa `calculatedDifficulty` se presente, altrimenti `difficulty` manuale.
 */
export function getEffectiveDifficulty(position) {
  return position.calculatedDifficulty ?? position.difficulty
}

/**
 * Calcola il livello dello studente per un dato tema
 * basandosi sui risultati SR.
 */
export function getStudentLevel(srRecords, theme) {
  const relevant = srRecords.filter(r => r.theme === theme)
  if (relevant.length === 0) return DEFAULT_LEVEL

  // Media pesata: risultati recenti contano di piu
  let weightedSum = 0
  let weightTotal = 0
  relevant.forEach((r, i) => {
    const weight = i + 1 // piu recenti = piu peso
    const score = r.correct ? r.difficulty + 0.5 : r.difficulty - 0.5
    weightedSum += score * weight
    weightTotal += weight
  })

  const level = Math.round(weightedSum / weightTotal)
  return Math.max(1, Math.min(10, level))
}

/**
 * Dato il livello dello studente, restituisce il range di difficolta ottimale.
 * Zona ottimale: livello-1 a livello+1 (non troppo facile, non troppo difficile)
 */
export function getOptimalDifficultyRange(level) {
  return {
    min: Math.max(1, level - 1),
    max: Math.min(10, level + 1),
  }
}

/**
 * Filtra le posizioni per il range di difficolta ottimale.
 * Se non ce ne sono abbastanza, espande il range.
 */
export function filterByDifficulty(positions, level, minCount = 5) {
  const range = getOptimalDifficultyRange(level)
  let filtered = positions.filter(p => {
    const diff = getEffectiveDifficulty(p)
    return diff >= range.min && diff <= range.max
  })

  // Se troppo poche, espandi il range
  let expand = 1
  while (filtered.length < minCount && expand < 5) {
    expand++
    filtered = positions.filter(p => {
      const diff = getEffectiveDifficulty(p)
      return diff >= Math.max(1, level - expand) && diff <= Math.min(10, level + expand)
    })
  }

  return filtered
}

/**
 * Calcola i livelli per tutti i temi dati i record SR arricchiti.
 * I record devono avere il campo `theme` e `difficulty`.
 */
export function getAllLevels(enrichedRecords) {
  const themes = new Set(enrichedRecords.map(r => r.theme))
  const levels = {}
  themes.forEach(theme => {
    levels[theme] = getStudentLevel(
      enrichedRecords.filter(r => r.theme === theme),
      theme
    )
  })
  return levels
}
