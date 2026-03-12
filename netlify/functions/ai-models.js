// Endpoint diagnostico — lista modelli Gemini disponibili per questa API key

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: corsHeaders() })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return jsonResponse({ error: 'GEMINI_API_KEY non configurata' }, 500)
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    { method: 'GET' }
  )

  const data = await response.json()

  // Filtra solo quelli che supportano generateContent
  const models = (data.models || [])
    .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
    .map(m => m.name)

  return jsonResponse({ models })
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

export const config = { path: '/api/ai-models' }
