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
    const { id } = await req.json()
    if (!id) return jsonResponse({ error: 'id è obbligatorio' }, 400)

    await firestore.collection('lessons').doc(id).delete()

    return jsonResponse({ ok: true })
  } catch (err) {
    return jsonResponse({ error: err.message }, 500)
  }
}

export const config = { path: '/api/lesson-delete' }
