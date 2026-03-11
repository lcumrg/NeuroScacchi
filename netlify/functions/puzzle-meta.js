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

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: corsHeaders() })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const client = getDb()
  if (!client) {
    return jsonResponse({ error: 'TURSO_DATABASE_URL non configurata.' }, 500)
  }

  try {
    const body = await req.json()
    const { type } = body

    if (type === 'themes') {
      const result = await client.execute('SELECT DISTINCT themes FROM puzzles WHERE themes IS NOT NULL AND themes != "" LIMIT 5000')
      const themeSet = new Set()
      for (const row of result.rows) {
        for (const t of row.themes.split(' ')) {
          if (t) themeSet.add(t)
        }
      }
      return jsonResponse({ values: [...themeSet].sort() })
    }

    if (type === 'openings') {
      const result = await client.execute('SELECT DISTINCT opening_tags FROM puzzles WHERE opening_tags IS NOT NULL AND opening_tags != "" LIMIT 5000')
      const tagSet = new Set()
      for (const row of result.rows) {
        for (const t of row.opening_tags.split(' ')) {
          if (t) tagSet.add(t)
        }
      }
      return jsonResponse({ values: [...tagSet].sort() })
    }

    return jsonResponse({ error: 'type deve essere "themes" o "openings"' }, 400)
  } catch (err) {
    return jsonResponse({ error: err.message }, 500)
  }
}

export const config = {
  path: '/api/puzzle-meta',
}
