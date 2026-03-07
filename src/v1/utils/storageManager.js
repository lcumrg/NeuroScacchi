// Storage Manager - Gestione localStorage per NeuroScacchi v6.0
// Dual-write: localStorage (cache locale) + Firebase (persistenza cloud)
import {
  saveSessionToFirebase,
  saveProgressToFirebase,
  saveSettingsToFirebase,
  saveLessonToFirebase,
  deleteLessonFromFirebase,
  syncFromFirebase
} from './firebaseService'

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
    saveSettingsToFirebase(settings).catch(() => {})
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
    // Sync custom lessons to Firebase (skip test lessons)
    if (lesson.categoria !== 'test') {
      saveLessonToFirebase(lesson).catch(() => {})
    }
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
    deleteLessonFromFirebase(lessonId).catch(() => {})
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
    const updated = {
      ...progress[lessonId],
      ...progressData,
      lastPlayed: new Date().toISOString()
    }
    progress[lessonId] = updated

    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress))
    saveProgressToFirebase(lessonId, updated).catch(() => {})
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
    metacognitive: [],
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

    // Dual-write: salva anche su Firebase (fire-and-forget)
    saveSessionToFirebase(session).catch(() => {})

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

// === SYNC DA FIREBASE (per nuovo dispositivo / altro browser) ===
// Scarica i dati dal cloud e li unisce a quelli locali senza sovrascrivere

export const mergeFromCloud = async () => {
  try {
    const cloudData = await syncFromFirebase()
    if (!cloudData) return { merged: false }

    let lessonsAdded = 0
    let progressMerged = 0
    let sessionsMerged = 0

    // Merge lezioni: aggiungi quelle cloud che non esistono in locale
    if (cloudData.lessons.length > 0) {
      const localLessons = getLessons()
      const localIds = new Set(localLessons.map(l => l.id))
      for (const lesson of cloudData.lessons) {
        if (!localIds.has(lesson.id)) {
          localLessons.push(lesson)
          lessonsAdded++
        }
      }
      if (lessonsAdded > 0) {
        localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(localLessons))
      }
    }

    // Merge progresso: cloud vince se piu recente
    if (Object.keys(cloudData.progress).length > 0) {
      const localProgress = getProgress()
      for (const [lessonId, cloudProg] of Object.entries(cloudData.progress)) {
        const localProg = localProgress[lessonId]
        if (!localProg || (cloudProg.updatedAt && (!localProg.lastPlayed || new Date(cloudProg.updatedAt.seconds * 1000) > new Date(localProg.lastPlayed)))) {
          localProgress[lessonId] = { ...cloudProg, lastPlayed: cloudProg.updatedAt ? new Date(cloudProg.updatedAt.seconds * 1000).toISOString() : new Date().toISOString() }
          progressMerged++
        }
      }
      if (progressMerged > 0) {
        localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(localProgress))
      }
    }

    // Merge sessioni: aggiungi quelle cloud non presenti in locale
    if (cloudData.sessions.length > 0) {
      const localSessions = getSessions()
      const localStartTimes = new Set(localSessions.map(s => s.startedAt))
      for (const session of cloudData.sessions) {
        if (!localStartTimes.has(session.startedAt)) {
          localSessions.push(session)
          sessionsMerged++
        }
      }
      if (sessionsMerged > 0) {
        const trimmed = localSessions.slice(-100)
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(trimmed))
      }
    }

    console.log(`Cloud sync: +${lessonsAdded} lezioni, +${progressMerged} progressi, +${sessionsMerged} sessioni`)
    return { merged: true, lessonsAdded, progressMerged, sessionsMerged }
  } catch (e) {
    console.error('Cloud sync failed:', e)
    return { merged: false }
  }
}
