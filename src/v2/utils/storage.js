// Storage v2 — localStorage + Firestore (quando disponibile)
// Chiavi separate da v1 per non interferire

const KEYS = {
  SR_RECORDS: 'ns2_sr_records',
  COGNITIVE_PROFILE: 'ns2_cognitive_profile',
  SESSION_HISTORY: 'ns2_session_history',
  VERSION_PREF: 'neuroscacchi_version',
  THEME: 'ns2_theme',
}

// --- Spaced Repetition Records ---

export function getSRRecords() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.SR_RECORDS)) || []
  } catch {
    return []
  }
}

export function saveSRRecords(records) {
  localStorage.setItem(KEYS.SR_RECORDS, JSON.stringify(records))
}

export function updateSRRecordInStorage(record) {
  const records = getSRRecords()
  const index = records.findIndex(r => r.positionId === record.positionId)
  if (index >= 0) {
    records[index] = record
  } else {
    records.push(record)
  }
  saveSRRecords(records)
  return records
}

// --- Cognitive Profile ---

export function getCognitiveProfile() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.COGNITIVE_PROFILE))
  } catch {
    return null
  }
}

export function saveCognitiveProfile(profile) {
  localStorage.setItem(KEYS.COGNITIVE_PROFILE, JSON.stringify(profile))
}

// --- Session History ---

export function getSessionHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.SESSION_HISTORY)) || []
  } catch {
    return []
  }
}

export function saveSessionResult(session) {
  const history = getSessionHistory()
  history.push({
    ...session,
    timestamp: Date.now(),
  })
  // Mantieni solo le ultime 100 sessioni
  if (history.length > 100) history.splice(0, history.length - 100)
  localStorage.setItem(KEYS.SESSION_HISTORY, JSON.stringify(history))
}

// --- Theme ---

export function getTheme() {
  return localStorage.getItem(KEYS.THEME) || 'light'
}

export function saveTheme(theme) {
  localStorage.setItem(KEYS.THEME, theme)
  document.documentElement.setAttribute('data-theme', theme)
}

/**
 * Inizializza il tema all'avvio dell'app.
 * Legge la preferenza salvata e la applica al DOM.
 */
export function initTheme() {
  const theme = getTheme()
  document.documentElement.setAttribute('data-theme', theme)
  return theme
}
