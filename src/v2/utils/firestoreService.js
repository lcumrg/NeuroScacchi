// Firestore Service v2 — architettura dati per logging completo
//
// Struttura:
//   users/{uid}/profile          → profilo cognitivo + preferenze
//   users/{uid}/sessions/{id}    → metadata sessione
//   users/{uid}/sessions/{id}/moves/{n} → log per-mossa
//   users/{uid}/leitner/{posId}  → stato SR per posizione
//
// Livello 1 — per-mossa: timestamp, FEN, mossa giocata, eval, deltaEval,
//   classificazione, mossa migliore SF, freeze start/end, profilassi, metacognizione
// Livello 2 — per-sessione: distribuzione qualita, deltaEval medio, errori consecutivi,
//   curva tempo, compliance freeze/profilassi, trend intra-sessione

import { db, isConfigured } from '../../shared/firebase'
import {
  doc, setDoc, getDoc, updateDoc,
  collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp
} from 'firebase/firestore'

// ── Helpers ──

function userRef(uid) {
  return doc(db, 'users', uid)
}

function sessionsCol(uid) {
  return collection(db, 'users', uid, 'sessions')
}

function movesCol(uid, sessionId) {
  return collection(db, 'users', uid, 'sessions', sessionId, 'moves')
}

function leitnerRef(uid, positionId) {
  return doc(db, 'users', uid, 'leitner', positionId)
}

// ── Profile ──

export async function saveProfile(uid, profile) {
  if (!isConfigured) return
  await setDoc(userRef(uid), { profile, updatedAt: serverTimestamp() }, { merge: true })
}

export async function loadProfile(uid) {
  if (!isConfigured) return null
  const snap = await getDoc(userRef(uid))
  return snap.exists() ? snap.data().profile : null
}

// ── Session ──

/**
 * Crea una nuova sessione e restituisce il sessionId.
 */
export async function createSession(uid, metadata) {
  if (!isConfigured) return null
  const ref = await addDoc(sessionsCol(uid), {
    ...metadata,
    startedAt: serverTimestamp(),
    status: 'active',
  })
  return ref.id
}

/**
 * Salva il riepilogo a fine sessione.
 */
export async function completeSession(uid, sessionId, summary) {
  if (!isConfigured || !sessionId) return
  const ref = doc(db, 'users', uid, 'sessions', sessionId)
  await updateDoc(ref, {
    ...summary,
    completedAt: serverTimestamp(),
    status: 'completed',
  })
}

/**
 * Carica le ultime N sessioni.
 */
export async function getRecentSessions(uid, count = 10) {
  if (!isConfigured) return []
  const q = query(sessionsCol(uid), orderBy('startedAt', 'desc'), limit(count))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── Move logging (Livello 1) ──

/**
 * Logga una singola mossa nella sessione corrente.
 */
export async function logMove(uid, sessionId, moveData) {
  if (!isConfigured || !sessionId) return
  await addDoc(movesCol(uid, sessionId), {
    ...moveData,
    timestamp: serverTimestamp(),
  })
}

/**
 * Crea il log completo per una mossa.
 * Chiamato da SessionRunner/TrainingSession dopo ogni mossa.
 *
 * @param {Object} data
 * @param {string} data.positionId
 * @param {string} data.fen - FEN della posizione
 * @param {string} data.movePlayed - mossa UCI giocata
 * @param {number} data.moveNumber - indice mossa nella sessione
 * @param {number} data.evalBefore - eval prima della mossa
 * @param {number} data.evalAfter - eval dopo la mossa
 * @param {number} data.deltaEval - perdita di eval
 * @param {string} data.classification - ottima/buona/imprecisione/errore
 * @param {string} data.bestMove - mossa migliore di Stockfish
 * @param {number} data.timeMs - tempo di risposta in ms
 * @param {boolean} data.correct - mossa accettata o rifiutata
 * @param {number} data.freezeDurationMs - durata freeze (se presente)
 * @param {Object|null} data.profilassi - { shown, answer, correct }
 * @param {Object|null} data.metacognition - { shown, question, answer }
 */
export function buildMoveLog(data) {
  return {
    positionId: data.positionId,
    fen: data.fen,
    movePlayed: data.movePlayed || null,
    moveNumber: data.moveNumber,
    // Stockfish data
    evalBefore: data.evalBefore ?? null,
    evalAfter: data.evalAfter ?? null,
    deltaEval: data.deltaEval ?? null,
    classification: data.classification || null,
    bestMove: data.bestMove || null,
    // Timing
    timeMs: data.timeMs || null,
    correct: data.correct,
    // Cognitive scaffolding
    freezeDurationMs: data.freezeDurationMs || null,
    profilassi: data.profilassi || null,
    metacognition: data.metacognition || null,
  }
}

/**
 * Calcola il summary di sessione (Livello 2) dai risultati.
 *
 * @param {Array} results - array di risultati per-mossa
 * @param {Object} meta - metadata sessione (temi, profilo, ecc.)
 */
export function buildSessionSummary(results, meta = {}) {
  const total = results.length
  const correct = results.filter(r => r.correct).length
  const totalErrors = results.reduce((s, r) => s + (r.errors || 0), 0)

  // Distribuzione classificazione mosse
  const distribution = { ottima: 0, buona: 0, imprecisione: 0, errore: 0 }
  results.forEach(r => {
    if (r.classification && distribution[r.classification] !== undefined) {
      distribution[r.classification]++
    }
  })

  // DeltaEval medio (solo mosse con eval)
  const evaled = results.filter(r => r.deltaEval != null)
  const avgDeltaEval = evaled.length > 0
    ? evaled.reduce((s, r) => s + Math.abs(r.deltaEval), 0) / evaled.length
    : null

  // Tempo medio per mossa
  const timed = results.filter(r => r.timeMs != null)
  const avgTimeMs = timed.length > 0
    ? timed.reduce((s, r) => s + r.timeMs, 0) / timed.length
    : null

  // Mosse veloci (< 3 secondi)
  const fastMoves = timed.filter(r => r.timeMs < 3000).length

  // Errori consecutivi massimi
  let maxConsecutiveErrors = 0
  let currentStreak = 0
  results.forEach(r => {
    if (!r.correct) { currentStreak++; maxConsecutiveErrors = Math.max(maxConsecutiveErrors, currentStreak) }
    else { currentStreak = 0 }
  })

  return {
    positionCount: total,
    correct,
    totalErrors,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    distribution,
    avgDeltaEval: avgDeltaEval != null ? Math.round(avgDeltaEval * 100) / 100 : null,
    avgTimeMs: avgTimeMs != null ? Math.round(avgTimeMs) : null,
    fastMoves,
    maxConsecutiveErrors,
    // Contesto
    themes: meta.themes || [],
    sessionType: meta.sessionType || 'smart',
    cognitiveProfile: meta.cognitiveProfile || null,
    hourOfDay: new Date().getHours(),
  }
}

// ── Leitner / SR sync ──

export async function saveLeitnerState(uid, positionId, srRecord) {
  if (!isConfigured) return
  await setDoc(leitnerRef(uid, positionId), {
    ...srRecord,
    updatedAt: serverTimestamp(),
  })
}

export async function loadAllLeitner(uid) {
  if (!isConfigured) return []
  const col = collection(db, 'users', uid, 'leitner')
  const snap = await getDocs(col)
  return snap.docs.map(d => ({ positionId: d.id, ...d.data() }))
}
