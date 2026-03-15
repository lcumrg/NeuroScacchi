// Salva e recupera lezioni da Firestore via Netlify Functions

export async function saveLesson(lesson) {
  try {
    const res = await fetch('/api/lesson-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[lessonStore] saveLesson fallito:', err.error || res.status)
      return { ok: false, error: err.error || `HTTP ${res.status}` }
    }
    return { ok: true }
  } catch (err) {
    console.error('[lessonStore] saveLesson errore di rete:', err.message)
    return { ok: false, error: err.message }
  }
}

export async function loadLesson(id) {
  try {
    const res = await fetch(`/api/lesson-get?id=${encodeURIComponent(id)}`)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[lessonStore] loadLesson fallito:', err.error || res.status)
      return null
    }
    const data = await res.json()
    return data.lesson ?? null
  } catch (err) {
    console.error('[lessonStore] loadLesson errore di rete:', err.message)
    return null
  }
}

export async function listLessons() {
  try {
    const res = await fetch('/api/lesson-list')
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[lessonStore] listLessons fallito:', err.error || res.status)
      return []
    }
    const data = await res.json()
    return data.lessons ?? []
  } catch (err) {
    console.error('[lessonStore] listLessons errore di rete:', err.message)
    return []
  }
}

export async function deleteLesson(id) {
  try {
    const res = await fetch('/api/lesson-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[lessonStore] deleteLesson fallito:', err.error || res.status)
      return { ok: false, error: err.error || `HTTP ${res.status}` }
    }
    return { ok: true }
  } catch (err) {
    console.error('[lessonStore] deleteLesson errore di rete:', err.message)
    return { ok: false, error: err.message }
  }
}

export function markAsApproved(lesson) {
  // Sincrono — solo aggiunge campi, non salva
  return { ...lesson, status: 'published', origin: 'collaborative' }
}

export async function saveLessonFeedback({ lessonId, lessonTitle, lessonCategory, stepFeedback }) {
  try {
    const res = await fetch('/api/feedback-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, lessonTitle, lessonCategory, stepFeedback }),
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
