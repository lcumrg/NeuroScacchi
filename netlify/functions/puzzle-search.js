// Netlify Function — ricerca puzzle Lichess in Firestore
// Collection: puzzles (importati con import_puzzles.py)
// Indici compositi: themes (Arrays) + rating (Ascending)

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

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

function docToPuzzle(doc) {
  const d = doc.data()
  return {
    id: doc.id,
    fen: d.fen,
    moves: typeof d.moves === 'string' ? d.moves.split(' ').filter(Boolean) : (d.moves || []),
    rating: d.rating,
    themes: d.themes || [],
    openingTags: d.openingTags || [],
    popularity: d.popularity,
    nbPlays: d.nbPlays,
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: corsHeaders() })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const firestore = getDb()
  if (!firestore) {
    return jsonResponse({
      error: 'FIREBASE_SERVICE_ACCOUNT non configurata. Aggiungi la variabile in Netlify > Site settings > Environment variables.',
    }, 500)
  }

  try {
    const body = await req.json()
    const { themes, ratingMin, ratingMax, popularityMin, openingTags, excludeIds, random } = body
    const limit = Math.min(Math.max(body.limit || 20, 1), 100)

    let query = firestore.collection('puzzles')

    // Firestore supporta max 1 array-contains o array-contains-any per query.
    // Priorita: themes > openingTags
    if (Array.isArray(themes) && themes.length > 0) {
      if (themes.length === 1) {
        query = query.where('themes', 'array-contains', themes[0])
      } else {
        query = query.where('themes', 'array-contains-any', themes.slice(0, 10))
      }
    } else if (Array.isArray(openingTags) && openingTags.length > 0) {
      if (openingTags.length === 1) {
        query = query.where('openingTags', 'array-contains', openingTags[0])
      } else {
        query = query.where('openingTags', 'array-contains-any', openingTags.slice(0, 10))
      }
    }

    // Per query random: partiamo da un punto casuale nel range di rating
    // cosi ogni chiamata restituisce puzzle diversi
    if (random && typeof ratingMin === 'number' && typeof ratingMax === 'number') {
      const pivot = Math.floor(ratingMin + Math.random() * (ratingMax - ratingMin))
      query = query.where('rating', '>=', pivot).where('rating', '<=', ratingMax)
    } else {
      if (typeof ratingMin === 'number') {
        query = query.where('rating', '>=', ratingMin)
      }
      if (typeof ratingMax === 'number') {
        query = query.where('rating', '<=', ratingMax)
      }
    }

    // Oversample per compensare filtri client-side e shuffle
    const fetchLimit = random ? Math.min(limit * 5, 100) : limit
    query = query.orderBy('rating').limit(fetchLimit)

    const snapshot = await query.get()
    let puzzles = snapshot.docs.map(docToPuzzle)

    // Filtri client-side (evitano indici compositi aggiuntivi)
    if (typeof popularityMin === 'number') {
      puzzles = puzzles.filter(p => p.popularity >= popularityMin)
    }

    if (Array.isArray(excludeIds) && excludeIds.length > 0) {
      const excludeSet = new Set(excludeIds)
      puzzles = puzzles.filter(p => !excludeSet.has(p.id))
    }

    if (random) {
      puzzles = shuffle(puzzles)
    }

    return jsonResponse({
      puzzles: puzzles.slice(0, limit),
      total: -1,
    })
  } catch (err) {
    return jsonResponse({ error: err.message }, 500)
  }
}

export const config = {
  path: '/api/puzzle-search',
}
