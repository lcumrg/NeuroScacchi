import { createClient } from '@libsql/client/web'

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
      const result = await client.execute('SELECT theme FROM meta_themes ORDER BY theme')
      return jsonResponse({ values: result.rows.map(r => r.theme) })
    }

    if (type === 'openings') {
      const result = await client.execute('SELECT opening FROM meta_openings ORDER BY opening')
      return jsonResponse({ values: result.rows.map(r => r.opening) })
    }

    return jsonResponse({ error: 'type deve essere "themes" o "openings"' }, 400)
  } catch (err) {
    return jsonResponse({ error: err.message }, 500)
  }
}

export const config = {
  path: '/api/puzzle-meta',
}
