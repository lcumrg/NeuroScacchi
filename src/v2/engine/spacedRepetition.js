// Spaced Repetition — algoritmo Leitner a 5 box
//
// Box 1: rivedi domani (1 giorno)
// Box 2: rivedi tra 3 giorni
// Box 3: rivedi tra 7 giorni
// Box 4: rivedi tra 14 giorni
// Box 5: rivedi tra 30 giorni
//
// Sbagliata → torna a box 1
// Corretta → avanza di un box

const BOX_INTERVALS = [1, 3, 7, 14, 30] // giorni

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Crea un nuovo record SR per una posizione appena vista.
 */
export function createSRRecord(positionId, correct) {
  const now = Date.now()
  const box = correct ? 2 : 1 // se corretta al primo colpo, parte da box 2
  const interval = BOX_INTERVALS[box - 1]

  return {
    positionId,
    box,
    correct,
    attempts: 1,
    errors: correct ? 0 : 1,
    lastSeen: now,
    nextReview: now + interval * DAY_MS,
    history: [{ timestamp: now, correct, box }],
  }
}

/**
 * Aggiorna un record SR esistente dopo un nuovo tentativo.
 */
export function updateSRRecord(record, correct) {
  const now = Date.now()
  let newBox

  if (correct) {
    newBox = Math.min(record.box + 1, 5)
  } else {
    newBox = 1
  }

  const interval = BOX_INTERVALS[newBox - 1]

  return {
    ...record,
    box: newBox,
    correct,
    attempts: record.attempts + 1,
    errors: record.errors + (correct ? 0 : 1),
    lastSeen: now,
    nextReview: now + interval * DAY_MS,
    history: [...record.history, { timestamp: now, correct, box: newBox }],
  }
}

/**
 * Restituisce lo stato visivo di un record.
 */
export function getSRStatus(record) {
  if (record.box >= 4) return 'consolidata'
  if (record.box >= 2) return 'in_apprendimento'
  return 'da_rivedere'
}

/**
 * Restituisce l'etichetta italiana dello stato.
 */
export function getSRStatusLabel(record) {
  const status = getSRStatus(record)
  switch (status) {
    case 'consolidata': return 'Consolidata'
    case 'in_apprendimento': return 'In apprendimento'
    case 'da_rivedere': return 'Da rivedere'
    default: return ''
  }
}

/**
 * Restituisce il colore associato allo stato.
 */
export function getSRStatusColor(record) {
  const status = getSRStatus(record)
  switch (status) {
    case 'consolidata': return '#2E7D32'
    case 'in_apprendimento': return '#F57F17'
    case 'da_rivedere': return '#C62828'
    default: return '#5A6C7D'
  }
}

/**
 * Filtra e ordina le posizioni per la prossima sessione.
 * Priorita:
 * 1. Posizioni in scadenza (nextReview <= ora)
 * 2. Posizioni mai viste
 * 3. Posizioni non ancora in scadenza (ordinate per nextReview piu vicino)
 */
export function selectPositionsForSession(allPositions, srRecords, count = 10) {
  const now = Date.now()
  const recordMap = {}
  srRecords.forEach(r => { recordMap[r.positionId] = r })

  const due = []      // in scadenza
  const unseen = []   // mai viste
  const upcoming = [] // non ancora in scadenza

  allPositions.forEach(pos => {
    const record = recordMap[pos.id]
    if (!record) {
      unseen.push(pos)
    } else if (record.nextReview <= now) {
      due.push({ pos, record })
    } else {
      upcoming.push({ pos, record })
    }
  })

  // Ordina: le piu urgenti prima
  due.sort((a, b) => a.record.nextReview - b.record.nextReview)
  upcoming.sort((a, b) => a.record.nextReview - b.record.nextReview)

  // Mescola le mai viste per varieta
  for (let i = unseen.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unseen[i], unseen[j]] = [unseen[j], unseen[i]]
  }

  // Componi la sessione: prima le scadute, poi nuove, poi prossime
  const selected = []
  for (const item of due) {
    if (selected.length >= count) break
    selected.push(item.pos)
  }
  for (const pos of unseen) {
    if (selected.length >= count) break
    selected.push(pos)
  }
  for (const item of upcoming) {
    if (selected.length >= count) break
    selected.push(item.pos)
  }

  return selected
}

export { BOX_INTERVALS }
