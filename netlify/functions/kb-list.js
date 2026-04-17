// Netlify Function — lista chunk Knowledge Base da Firestore
// Supporta filtro per apertura e variante via query params

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
    const url = new URL(req.url)
    const apertura = url.searchParams.get('apertura')
    const variante = url.searchParams.get('variante')

    let query = firestore.collection('knowledgeChunks').orderBy('aggiornato', 'desc')

    if (apertura) query = query.where('apertura', '==', apertura)
    if (variante) query = query.where('variante', '==', variante)

    const snapshot = await query.limit(500).get()

    const chunks = snapshot.docs.map(doc => {
      const data = doc.data()
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        data.createdAt = data.createdAt.toDate().toISOString()
      }
      if (data.aggiornato && typeof data.aggiornato.toDate === 'function') {
        data.aggiornato = data.aggiornato.toDate().toISOString()
      }
      return { id: doc.id, ...data }
    })

    return jsonResponse({ chunks })
  } catch (err) {
    return jsonResponse({ error: err.message }, 500)
  }
}

export const config = { path: '/api/kb-list' }
