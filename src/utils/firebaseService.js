// Firebase Service - Salvataggio dati su Firestore per NeuroScacchi v6.0
// Struttura Firestore (per-utente):
//   users/{uid}/sessions/{auto-id}   → sessione completa
//   users/{uid}/feelings/{auto-id}   → feeling post-lezione
//   users/{uid}/progress/{lessonId}  → progresso lezione
//   users/{uid}/settings/main        → impostazioni utente
//   users/{uid}/lessons/{lessonId}   → lezioni custom caricate dall'utente
import { collection, doc, addDoc, setDoc, getDoc, getDocs, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db, auth, isConfigured } from '../firebase'

// Ottieni UID dell'utente corrente
const getUid = () => auth?.currentUser?.uid || null

// Controlla che Firebase e utente siano pronti
const canWrite = () => {
  if (!isConfigured || !db) return false
  if (!getUid()) return false
  return true
}

// === SESSIONS ===

export const saveSessionToFirebase = async (session) => {
  if (!canWrite()) return null
  try {
    const uid = getUid()
    const ref = collection(db, 'users', uid, 'sessions')
    const docRef = await addDoc(ref, {
      ...session,
      uid,
      savedAt: serverTimestamp()
    })
    return docRef.id
  } catch (e) {
    console.error('Firebase: errore salvataggio sessione', e.code, e.message)
    return null
  }
}

export const getSessionsFromFirebase = async () => {
  if (!canWrite()) return []
  try {
    const uid = getUid()
    const snap = await getDocs(collection(db, 'users', uid, 'sessions'))
    return snap.docs.map(d => ({ _id: d.id, ...d.data() }))
  } catch (e) {
    console.error('Firebase: errore lettura sessioni', e.code, e.message)
    return []
  }
}

// === FEELINGS ===

export const saveFeelingToFirebase = async (lessonId, feeling, sessionData) => {
  if (!canWrite()) return null
  try {
    const uid = getUid()
    const ref = collection(db, 'users', uid, 'feelings')
    const docRef = await addDoc(ref, {
      lessonId,
      feeling,
      totalErrors: (sessionData.intentErrors?.length || 0) + (sessionData.moveErrors?.length || 0),
      totalTimeMs: sessionData.completedAt ? sessionData.completedAt - sessionData.startedAt : 0,
      uid,
      savedAt: serverTimestamp()
    })
    return docRef.id
  } catch (e) {
    console.error('Firebase: errore salvataggio feeling', e.code, e.message)
    return null
  }
}

// === PROGRESS ===

export const saveProgressToFirebase = async (lessonId, progressData) => {
  if (!canWrite()) return false
  try {
    const uid = getUid()
    const ref = doc(db, 'users', uid, 'progress', lessonId)
    await setDoc(ref, { ...progressData, updatedAt: serverTimestamp() }, { merge: true })
    return true
  } catch (e) {
    console.error('Firebase: errore salvataggio progresso', e.code, e.message)
    return false
  }
}

export const getProgressFromFirebase = async () => {
  if (!canWrite()) return {}
  try {
    const uid = getUid()
    const snap = await getDocs(collection(db, 'users', uid, 'progress'))
    const progress = {}
    snap.docs.forEach(d => { progress[d.id] = d.data() })
    return progress
  } catch (e) {
    console.error('Firebase: errore lettura progresso', e.code, e.message)
    return {}
  }
}

// === SETTINGS ===

export const saveSettingsToFirebase = async (settings) => {
  if (!canWrite()) return false
  try {
    const uid = getUid()
    const ref = doc(db, 'users', uid, 'settings', 'main')
    await setDoc(ref, { ...settings, updatedAt: serverTimestamp() })
    return true
  } catch (e) {
    console.error('Firebase: errore salvataggio impostazioni', e.code, e.message)
    return false
  }
}

export const getSettingsFromFirebase = async () => {
  if (!canWrite()) return null
  try {
    const uid = getUid()
    const ref = doc(db, 'users', uid, 'settings', 'main')
    const snap = await getDoc(ref)
    return snap.exists() ? snap.data() : null
  } catch (e) {
    console.error('Firebase: errore lettura impostazioni', e.code, e.message)
    return null
  }
}

// === LESSONS (custom uploaded) ===

export const saveLessonToFirebase = async (lesson) => {
  if (!canWrite()) return false
  try {
    const uid = getUid()
    const ref = doc(db, 'users', uid, 'lessons', lesson.id)
    await setDoc(ref, { ...lesson, uid, updatedAt: serverTimestamp() })
    return true
  } catch (e) {
    console.error('Firebase: errore salvataggio lezione', e.code, e.message)
    return false
  }
}

export const getLessonsFromFirebase = async () => {
  if (!canWrite()) return []
  try {
    const uid = getUid()
    const snap = await getDocs(collection(db, 'users', uid, 'lessons'))
    return snap.docs.map(d => d.data())
  } catch (e) {
    console.error('Firebase: errore lettura lezioni', e.code, e.message)
    return []
  }
}

export const deleteLessonFromFirebase = async (lessonId) => {
  if (!canWrite()) return false
  try {
    const uid = getUid()
    await deleteDoc(doc(db, 'users', uid, 'lessons', lessonId))
    return true
  } catch (e) {
    console.error('Firebase: errore eliminazione lezione', e.code, e.message)
    return false
  }
}

// === MIGRAZIONE localStorage → Firestore ===

export const migrateLocalDataToFirebase = async () => {
  if (!canWrite()) return false

  const uid = getUid()

  // Controlla se già migrato
  const migratedKey = `neuroscacchi_migrated_${uid}`
  if (localStorage.getItem(migratedKey)) return false

  try {
    const batch = writeBatch(db)
    let hasData = false

    // Migra sessioni
    const localSessions = JSON.parse(localStorage.getItem('neuroscacchi_sessions') || '[]')
    for (const session of localSessions.slice(-50)) {
      const ref = doc(collection(db, 'users', uid, 'sessions'))
      batch.set(ref, { ...session, uid, migratedFromLocal: true, savedAt: serverTimestamp() })
      hasData = true
    }

    // Migra progresso
    const localProgress = JSON.parse(localStorage.getItem('neuroscacchi_progress') || '{}')
    for (const [lessonId, data] of Object.entries(localProgress)) {
      const ref = doc(db, 'users', uid, 'progress', lessonId)
      batch.set(ref, { ...data, migratedFromLocal: true, updatedAt: serverTimestamp() }, { merge: true })
      hasData = true
    }

    // Migra lezioni custom (non quelle di test)
    const localLessons = JSON.parse(localStorage.getItem('neuroscacchi_lessons') || '[]')
    const customLessons = localLessons.filter(l => l.categoria !== 'test')
    for (const lesson of customLessons) {
      const ref = doc(db, 'users', uid, 'lessons', lesson.id)
      batch.set(ref, { ...lesson, uid, migratedFromLocal: true, updatedAt: serverTimestamp() })
      hasData = true
    }

    // Migra impostazioni
    const localSettings = localStorage.getItem('neuroscacchi_settings')
    if (localSettings) {
      const ref = doc(db, 'users', uid, 'settings', 'main')
      batch.set(ref, { ...JSON.parse(localSettings), migratedFromLocal: true, updatedAt: serverTimestamp() })
      hasData = true
    }

    if (hasData) {
      await batch.commit()
      console.log('Firebase: migrazione localStorage completata')
    }

    localStorage.setItem(migratedKey, 'true')
    return hasData
  } catch (e) {
    console.error('Firebase: errore durante migrazione', e.code, e.message)
    return false
  }
}
