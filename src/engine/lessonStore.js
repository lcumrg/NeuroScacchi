// Salva lezioni in localStorage con prefisso 'ns3_draft_'

const PREFIX = 'ns3_draft_'

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
