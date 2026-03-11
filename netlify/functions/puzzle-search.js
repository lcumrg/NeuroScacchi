import { createClient } from '@libsql/client'

let db = null

function getDb() {
  if (db) return db

  const url = process.env.TURSO_DATABASE_URL
  if (!url) return null

  const config = { url }
  const token = process.env.TURSO_AUTH_TOKEN
  if (token) config.authToken = token

  db = createClient(config)
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

function parsePuzzleRow(row) {
  return {
    id: row.id,
    fen: row.fen,
    moves: row.moves,
    rating: row.rating,
    themes: row.themes ? row.themes.split(' ').filter(Boolean) : [],
    openingTags: row.opening_tags ? row.opening_tags.split(' ').filter(Boolean) : [],
    popularity: row.popularity,
    nbPlays: row.nb_plays,
  }
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: corsHeaders() })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const client = getDb()
  if (!client) {
    return jsonResponse({
      error: 'TURSO_DATABASE_URL non configurata. Aggiungi la variabile in Netlify > Site settings > Environment variables (oppure nel file .env locale).',
    }, 500)
  }

  try {
    const body = await req.json()
    const { themes, ratingMin, ratingMax, popularityMin, openingTags, excludeIds, random } = body
    const limit = Math.min(Math.max(body.limit || 20, 1), 100)

    const conditions = []
    const args = []

    if (Array.isArray(themes) && themes.length > 0) {
      for (const theme of themes) {
        conditions.push(`themes LIKE ?`)
        args.push(`%${theme}%`)
      }
    }

    if (typeof ratingMin === 'number') {
      conditions.push(`rating >= ?`)
      args.push(ratingMin)
    }

    if (typeof ratingMax === 'number') {
      conditions.push(`rating <= ?`)
      args.push(ratingMax)
    }

    if (typeof popularityMin === 'number') {
      conditions.push(`popularity >= ?`)
      args.push(popularityMin)
    }

    if (Array.isArray(openingTags) && openingTags.length > 0) {
      const orClauses = openingTags.map(() => `opening_tags LIKE ?`)
      conditions.push(`(${orClauses.join(' OR ')})`)
      for (const tag of openingTags) {
        args.push(`%${tag}%`)
      }
    }

    if (Array.isArray(excludeIds) && excludeIds.length > 0) {
      const placeholders = excludeIds.map(() => '?').join(', ')
      conditions.push(`id NOT IN (${placeholders})`)
      args.push(...excludeIds)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countResult = await client.execute({
      sql: `SELECT COUNT(*) as total FROM puzzles ${where}`,
      args,
    })
    const total = Number(countResult.rows[0].total)

    const orderBy = random ? 'ORDER BY RANDOM()' : 'ORDER BY rating ASC'
    const dataResult = await client.execute({
      sql: `SELECT * FROM puzzles ${where} ${orderBy} LIMIT ?`,
      args: [...args, limit],
    })

    return jsonResponse({
      puzzles: dataResult.rows.map(parsePuzzleRow),
      total,
    })
  } catch (err) {
    return jsonResponse({ error: err.message }, 500)
  }
}

export const config = {
  path: '/api/puzzle-search',
}
