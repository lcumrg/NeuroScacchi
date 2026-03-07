// Adaptive Difficulty — calibra la difficolta in base ai risultati
//
// Ogni studente ha un "livello" per tema (1-10).
// Il sistema sceglie posizioni nella zona ~60-70% probabilita di successo.
// Se lo studente azzecca molte di fila → sale. Se sbaglia molte → scende.

const DEFAULT_LEVEL = 3

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
  let filtered = positions.filter(p => p.difficulty >= range.min && p.difficulty <= range.max)

  // Se troppo poche, espandi il range
  let expand = 1
  while (filtered.length < minCount && expand < 5) {
    expand++
    filtered = positions.filter(p =>
      p.difficulty >= Math.max(1, level - expand) &&
      p.difficulty <= Math.min(10, level + expand)
    )
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
