// Netlify Function — proxy per Anthropic Claude API
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
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages,
    }

    if (system && typeof system === 'string' && system.trim()) {
      requestBody.system = system.trim()
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errText = await response.text()
      let details = errText
      try {
        const errJson = JSON.parse(errText)
        details = errJson.error?.message || errText
      } catch { /* ignore */ }
      return jsonResponse({ error: 'Errore API Anthropic', details }, response.status)
    }

    const data = await response.json()

    const content = data.content
      ?.filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n') || ''

    return jsonResponse({
      content,
      usage: {
        input_tokens: data.usage?.input_tokens || 0,
        output_tokens: data.usage?.output_tokens || 0,
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
