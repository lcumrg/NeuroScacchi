import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

let db = null

function getDb() {
  if (db) return db
  const json = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!json) return null
  if (getApps().length === 0) initializeApp({ credential: cert(JSON.parse(json)) })
  db = getFirestore()
  return db
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders() })
}

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 204, headers: corsHeaders() })

  const firestore = getDb()
  if (!firestore) return jsonResponse({ error: 'FIREBASE_SERVICE_ACCOUNT non configurata' }, 500)

  try {
    const snapshot = await firestore
      .collection('lessons')
      .orderBy('savedAt', 'desc')
      .limit(200)
      .get()

    const lessons = snapshot.docs.map(doc => {
      const data = doc.data()
      // Convert Firestore Timestamps to ISO strings
      if (data.savedAt && typeof data.savedAt.toDate === 'function') {
        data.savedAt = data.savedAt.toDate().toISOString()
      }
      if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
        data.updatedAt = data.updatedAt.toDate().toISOString()
      }
      return { id: doc.id, ...data }
    })

    return jsonResponse({ lessons })
  } catch (err) {
    return jsonResponse({ error: err.message }, 500)
  }
}

export const config = { path: '/api/lesson-list' }
