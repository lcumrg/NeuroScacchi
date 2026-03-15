// Netlify Function — salva il feedback di una sessione lezione in Firestore
// Collection: lessonFeedback/{autoId}

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

let db = null

function getDb() {
  if (db) return db
  const json = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!json) return null
  if (getApps().length === 0) {
    initializeApp({ credential: cert(JSON.parse(json)) })
  }
  db = getFirestore()
  return db
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders() })
}

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 204, headers: corsHeaders() })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const firestore = getDb()
  if (!firestore) return jsonResponse({ error: 'FIREBASE_SERVICE_ACCOUNT non configurata' }, 500)

  try {
    const body = await req.json()
    const { lessonId, lessonTitle, lessonCategory, stepFeedback } = body

    if (!lessonId) return jsonResponse({ error: 'lessonId è obbligatorio' }, 400)

    // stepFeedback items: { stepIndex, stepType, tag, note, errors[] }
    const doc = {
      lessonId,
      lessonTitle: lessonTitle || '',
      lessonCategory: lessonCategory || '',
      stepFeedback: (stepFeedback || []).map(s => ({
        stepIndex: s.stepIndex,
        stepType: s.stepType || '',
        tag: s.tag || null,
        note: s.note || '',
        errors: (s.errors || []).map(e => ({
          message: String(e.message || '').substring(0, 500),
          stack: String(e.stack || '').substring(0, 2000),
          timestamp: e.timestamp || '',
        })),
      })),
      playedAt: FieldValue.serverTimestamp(),
    }

    const ref = await firestore.collection('lessonFeedback').add(doc)

    return jsonResponse({ ok: true, feedbackId: ref.id })
  } catch (err) {
    return jsonResponse({ error: err.message }, 500)
  }
}

export const config = { path: '/api/feedback-save' }
