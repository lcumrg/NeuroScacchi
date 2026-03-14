// Salva lezioni in localStorage (bozze) e Firestore (approvate)

const PREFIX = 'ns3_draft_'

// ── localStorage ────────────────────────────────────────────────────────────

export function saveDraftLesson(lesson) {
  const key = PREFIX + lesson.id
  const value = JSON.stringify({ lesson, savedAt: new Date().toISOString() })
  localStorage.setItem(key, value)
}

export function loadDraftLesson(id) {
  const key = PREFIX + id
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function listDraftLessons() {
  const results = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith(PREFIX)) continue
    const raw = localStorage.getItem(key)
    if (!raw) continue
    try {
      const { lesson, savedAt } = JSON.parse(raw)
      results.push({ id: lesson.id, title: lesson.title || lesson.titolo || '', savedAt })
    } catch {
      // skip malformed entries
    }
  }
  return results.sort((a, b) => (b.savedAt > a.savedAt ? 1 : -1))
}

export function deleteDraftLesson(id) {
  localStorage.removeItem(PREFIX + id)
}

export function markAsApproved(lesson) {
  const approved = {
    ...lesson,
    status: 'published',
    origin: 'collaborative',
  }
  saveDraftLesson(approved)
  return approved
}

// ── Firestore (via Netlify Function) ─────────────────────────────────────────

/**
 * Salva una lezione approvata su Firestore.
 * Non blocca — restituisce una Promise (errori gestiti internamente).
 */
export async function publishLesson(lesson) {
  try {
    const res = await fetch('/api/lesson-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[lessonStore] publishLesson fallito:', err.error || res.status)
      return { ok: false, error: err.error || `HTTP ${res.status}` }
    }
    return { ok: true }
  } catch (err) {
    console.error('[lessonStore] publishLesson errore di rete:', err.message)
    return { ok: false, error: err.message }
  }
}

/**
 * Salva il feedback di una sessione lezione su Firestore.
 */
export async function saveLessonFeedback({ lessonId, lessonTitle, lessonCategory, overallRating, note, stepFeedback }) {
  try {
    const res = await fetch('/api/feedback-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, lessonTitle, lessonCategory, overallRating, note, stepFeedback }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[lessonStore] saveLessonFeedback fallito:', err.error || res.status)
      return { ok: false, error: err.error || `HTTP ${res.status}` }
    }
    return { ok: true }
  } catch (err) {
    console.error('[lessonStore] saveLessonFeedback errore di rete:', err.message)
    return { ok: false, error: err.message }
  }
}
