// Netlify Function — salva un chunk di Knowledge Base in Firestore
// Collection: knowledgeChunks/{chunkId}

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

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
    const { chunk } = await req.json()
    if (!chunk) return jsonResponse({ error: 'chunk è obbligatorio' }, 400)
    if (!chunk.fens || !Array.isArray(chunk.fens) || chunk.fens.length === 0) {
      return jsonResponse({ error: 'chunk.fens è obbligatorio (array di FEN)' }, 400)
    }
    if (!chunk.apertura) return jsonResponse({ error: 'chunk.apertura è obbligatorio' }, 400)

    const id = chunk.id || firestore.collection('knowledgeChunks').doc().id

    const doc = {
      ...chunk,
      id,
      createdAt: chunk.createdAt || FieldValue.serverTimestamp(),
      aggiornato: FieldValue.serverTimestamp(),
    }

    await firestore.collection('knowledgeChunks').doc(id).set(doc)

    return jsonResponse({ ok: true, id })
  } catch (err) {
    return jsonResponse({ error: err.message }, 500)
  }
}

export const config = { path: '/api/kb-save' }
