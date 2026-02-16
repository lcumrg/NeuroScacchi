// Storage Manager - Gestione localStorage per NeuroScacchi v4.0
const STORAGE_KEYS = {
  LESSONS: 'neuroscacchi_lessons',
  PLAYLISTS: 'neuroscacchi_playlists',
  PROGRESS: 'neuroscacchi_progress',
  SETTINGS: 'neuroscacchi_settings',
  SESSIONS: 'neuroscacchi_sessions'
}

// === SETTINGS ===
export const getSettings = () => {
  const defaults = {
    boardSize: 'medium', // small, medium, large
    soundEnabled: false,
    darkMode: false,
    debugMode: new URLSearchParams(window.location.search).get('debug') === 'true'
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults
  } catch (e) {
    return defaults
  }
}

export const saveSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
    return true
  } catch (e) {
    console.error('Failed to save settings:', e)
    return false
  }
}

// === LESSONS ===
export const getLessons = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LESSONS)
    return stored ? JSON.parse(stored) : []
  } catch (e) {
    console.error('Failed to load lessons:', e)
    return []
  }
}

export const saveLesson = (lesson) => {
  try {
    const lessons = getLessons()
    const existing = lessons.findIndex(l => l.id === lesson.id)
    
    if (existing !== -1) {
      lessons[existing] = lesson
    } else {
      lessons.push(lesson)
    }
    
    localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(lessons))
    return true
  } catch (e) {
    console.error('Failed to save lesson:', e)
    return false
  }
}

export const deleteLesson = (lessonId) => {
  try {
    const lessons = getLessons().filter(l => l.id !== lessonId)
    localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(lessons))
    return true
  } catch (e) {
    console.error('Failed to delete lesson:', e)
    return false
  }
}

// === PLAYLISTS ===
export const getPlaylists = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PLAYLISTS)
    return stored ? JSON.parse(stored) : []
  } catch (e) {
    console.error('Failed to load playlists:', e)
    return []
  }
}

export const savePlaylist = (playlist) => {
  try {
    const playlists = getPlaylists()
    const existing = playlists.findIndex(p => p.id === playlist.id)
    
    if (existing !== -1) {
      playlists[existing] = playlist
    } else {
      playlists.push(playlist)
    }
    
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists))
    return true
  } catch (e) {
    console.error('Failed to save playlist:', e)
    return false
  }
}

export const deletePlaylist = (playlistId) => {
  try {
    const playlists = getPlaylists().filter(p => p.id !== playlistId)
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists))
    return true
  } catch (e) {
    console.error('Failed to delete playlist:', e)
    return false
  }
}

// === PROGRESS ===
export const getProgress = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PROGRESS)
    return stored ? JSON.parse(stored) : {}
  } catch (e) {
    console.error('Failed to load progress:', e)
    return {}
  }
}

export const saveLessonProgress = (lessonId, progressData) => {
  try {
    const progress = getProgress()
    progress[lessonId] = {
      ...progress[lessonId],
      ...progressData,
      lastPlayed: new Date().toISOString()
    }
    
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress))
    return true
  } catch (e) {
    console.error('Failed to save progress:', e)
    return false
  }
}

export const resetLessonProgress = (lessonId) => {
  try {
    const progress = getProgress()
    delete progress[lessonId]
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress))
    return true
  } catch (e) {
    console.error('Failed to reset progress:', e)
    return false
  }
}

export const resetAllProgress = () => {
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify({}))
    return true
  } catch (e) {
    console.error('Failed to reset all progress:', e)
    return false
  }
}

// === SESSIONS (v4.0 - Metacognizione) ===
// Ogni sessione traccia: tempi per fase, errori, riflessioni

export const createSession = (lessonId) => {
  return {
    lessonId,
    startedAt: Date.now(),
    phases: {
      freeze: { start: Date.now(), end: null },
      intent: { start: null, end: null },
      move: { start: null, end: null }
    },
    intentAttempts: 0,
    intentErrors: [],
    moveAttempts: 0,
    moveErrors: [],
    reflections: [],
    completed: false,
    completedAt: null
  }
}

export const saveSession = (session) => {
  try {
    const sessions = getSessions()
    sessions.push(session)
    // Mantieni solo le ultime 100 sessioni
    const trimmed = sessions.slice(-100)
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(trimmed))
    return true
  } catch (e) {
    console.error('Failed to save session:', e)
    return false
  }
}

export const getSessions = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS)
    return stored ? JSON.parse(stored) : []
  } catch (e) {
    console.error('Failed to load sessions:', e)
    return []
  }
}

export const getSessionsByLesson = (lessonId) => {
  return getSessions().filter(s => s.lessonId === lessonId)
}
