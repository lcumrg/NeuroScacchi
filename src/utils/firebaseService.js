// Firebase Service - Salvataggio dati su Firestore per NeuroScacchi v4.0
// Struttura Firestore:
//   sessions/{auto-id}    → sessione completa (tempi, errori, riflessioni, calibrazioni)
//   reflections/{auto-id} → singola riflessione post-errore
//   feelings/{auto-id}    → feeling post-lezione
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, isConfigured } from '../firebase'

// ID dispositivo anonimo (persistente per sessione browser)
const getDeviceId = () => {
  let id = localStorage.getItem('neuroscacchi_device_id')
  if (!id) {
    id = 'device_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
    localStorage.setItem('neuroscacchi_device_id', id)
  }
  return id
}

// Salva sessione completa su Firestore
export const saveSessionToFirebase = async (session) => {
  if (!isConfigured || !db) return null

  try {
    const docRef = await addDoc(collection(db, 'sessions'), {
      ...session,
      deviceId: getDeviceId(),
      savedAt: serverTimestamp()
    })
    return docRef.id
  } catch (e) {
    console.warn('Firebase: impossibile salvare sessione', e)
    return null
  }
}

// Salva feeling post-lezione su Firestore
export const saveFeelingToFirebase = async (lessonId, feeling, sessionData) => {
  if (!isConfigured || !db) return null

  try {
    const docRef = await addDoc(collection(db, 'feelings'), {
      lessonId,
      feeling,
      totalErrors: sessionData.intentErrors.length + sessionData.moveErrors.length,
      totalTimeMs: sessionData.completedAt - sessionData.startedAt,
      deviceId: getDeviceId(),
      savedAt: serverTimestamp()
    })
    return docRef.id
  } catch (e) {
    console.warn('Firebase: impossibile salvare feeling', e)
    return null
  }
}
