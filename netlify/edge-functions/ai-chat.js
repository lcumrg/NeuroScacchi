// Netlify Edge Function — proxy per Google Gemini API
// Le Edge Functions non hanno timeout fisso per operazioni di rete (I/O asincrono illimitato)

const GEMINI_MODEL = 'gemini-3-pro-preview'

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: corsHeaders() })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) {
    return jsonResponse({
      error: 'GEMINI_API_KEY non configurata. Aggiungi la variabile in Netlify > Site settings > Environment variables.',
    }, 500)
  }

  try {
    const body = await request.json()
    const { messages, system } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return jsonResponse({ error: 'messages è richiesto e deve essere un array non vuoto' }, 400)
    }

    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return jsonResponse({ error: 'Ogni messaggio deve avere role e content' }, 400)
      }
      if (!['user', 'assistant'].includes(msg.role)) {
        return jsonResponse({ error: `role non valido: "${msg.role}"` }, 400)
      }
    }

    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    const requestBody = {
      contents,
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
      },
    }

    if (system && typeof system === 'string' && system.trim()) {
      requestBody.systemInstruction = {
        parts: [{ text: system.trim() }],
      }
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errText = await response.text()
      let details = errText
      try {
        const errJson = JSON.parse(errText)
        details = errJson.error?.message || errText
      } catch { /* ignore */ }
      return jsonResponse({ error: 'Errore API Gemini', details }, response.status)
    }

    const data = await response.json()

    const content = data.candidates?.[0]?.content?.parts
      ?.filter(p => !p.thought)  // escludi parti di ragionamento interno (gemini 2.5 thinking)
      .map(p => p.text || '')
      .join('') || ''

    if (!content) {
      const finishReason = data.candidates?.[0]?.finishReason
      return jsonResponse({
        error: `Gemini non ha prodotto output. Motivo: ${finishReason || 'sconosciuto'}`,
      }, 500)
    }

    return jsonResponse({
      content,
      usage: {
        input_tokens: data.usageMetadata?.promptTokenCount || 0,
        output_tokens: data.usageMetadata?.candidatesTokenCount || 0,
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

export const config = { path: '/api/ai-chat' }
