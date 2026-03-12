// Netlify Function — proxy per Anthropic Claude API (streaming)
// Protegge la API key lato server

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: corsHeaders() })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return jsonResponse({
      error: 'ANTHROPIC_API_KEY non configurata. Aggiungi la variabile in Netlify > Site settings > Environment variables.',
    }, 500)
  }

  try {
    const body = await req.json()
    const { messages, system } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return jsonResponse({ error: 'messages è richiesto e deve essere un array non vuoto' }, 400)
    }

    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return jsonResponse({ error: 'Ogni messaggio deve avere role e content' }, 400)
      }
      if (!['user', 'assistant'].includes(msg.role)) {
        return jsonResponse({ error: `role non valido: "${msg.role}". Deve essere "user" o "assistant"` }, 400)
      }
    }

    const requestBody = {
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      stream: true,
      messages,
    }

    if (system && typeof system === 'string' && system.trim()) {
      requestBody.system = system.trim()
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    })

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text()
      let details = errText
      try {
        const errJson = JSON.parse(errText)
        details = errJson.error?.message || errText
      } catch { /* ignore */ }
      return jsonResponse({ error: 'Errore API Anthropic', details }, anthropicResponse.status)
    }

    // Inoltra lo stream SSE direttamente al client
    return new Response(anthropicResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (err) {
    return jsonResponse({ error: err.message }, 500)
  }
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

export const config = {
  path: '/api/ai-chat',
}
