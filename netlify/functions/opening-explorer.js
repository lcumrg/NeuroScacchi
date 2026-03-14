// Netlify Function — proxy per Lichess Opening Explorer
// Aggira le restrizioni CORS/auth per richieste dirette browser → explorer.lichess.ovh

const LICHESS_EXPLORER = 'https://explorer.lichess.ovh/lichess'

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: corsHeaders() })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders(),
    })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: corsHeaders(),
    })
  }

  const { fen, ratings = [], speeds = ['rapid', 'classical'], moves = 5 } = body

  if (!fen) {
    return new Response(JSON.stringify({ error: 'FEN is required' }), {
      status: 400,
      headers: corsHeaders(),
    })
  }

  // Costruisce i parametri con ripetizione (non CSV)
  const params = new URLSearchParams()
  params.set('fen', fen)
  params.set('moves', moves)
  params.set('topGames', 0)
  params.set('recentGames', 0)
  for (const r of ratings) params.append('ratings', r)
  for (const s of speeds) params.append('speeds', s)

  const url = `${LICHESS_EXPLORER}?${params}`

  let lichessRes
  try {
    lichessRes = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NeuroScacchi/3.0 (educational chess app)',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: `Lichess fetch error: ${err.message}` }), {
      status: 502,
      headers: corsHeaders(),
    })
  }

  if (!lichessRes.ok) {
    return new Response(
      JSON.stringify({ error: `Lichess Explorer returned ${lichessRes.status}` }),
      { status: lichessRes.status, headers: corsHeaders() }
    )
  }

  const data = await lichessRes.json()

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: corsHeaders(),
  })
}

export const config = {
  path: '/.netlify/functions/opening-explorer',
}
