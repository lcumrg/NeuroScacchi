// Netlify Edge Function — proxy streaming per Google Gemini API
// Usa streamGenerateContent per evitare timeout anche con modelli thinking lenti

const GEMINI_MODEL = 'gemini-2.5-pro'

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

  let body
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Request body non valido' }, 400)
  }

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

  // Usa streamGenerateContent + alt=sse per ricevere i token man mano
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?key=${apiKey}&alt=sse`

  const geminiResp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  if (!geminiResp.ok) {
    const errText = await geminiResp.text()
    let details = errText
    try {
      const errJson = JSON.parse(errText)
      details = errJson.error?.message || errText
    } catch { /* ignore */ }
    return jsonResponse({ error: 'Errore API Gemini', details }, geminiResp.status)
  }

  // Crea uno stream SSE verso il client
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  // Processo il flusso Gemini in background e lo riverso al client
  ;(async () => {
    const reader = geminiResp.body.getReader()
    let buffer = ''
    let usageMetadata = null

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // mantieni la riga incompleta

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (!data || data === '[DONE]') continue

          try {
            const chunk = JSON.parse(data)
            if (chunk.usageMetadata) usageMetadata = chunk.usageMetadata

            const parts = chunk.candidates?.[0]?.content?.parts || []
            for (const part of parts) {
              if (!part.thought && part.text) {
                await writer.write(encoder.encode(
                  `data: ${JSON.stringify({ text: part.text })}\n\n`
                ))
              }
            }
          } catch { /* ignora chunk malformati */ }
        }
      }

      // Evento finale con metadati
      await writer.write(encoder.encode(
        `data: ${JSON.stringify({
          done: true,
          usage: {
            input_tokens: usageMetadata?.promptTokenCount || 0,
            output_tokens: usageMetadata?.candidatesTokenCount || 0,
          },
        })}\n\n`
      ))
    } catch (err) {
      await writer.write(encoder.encode(
        `data: ${JSON.stringify({ error: err.message })}\n\n`
      ))
    } finally {
      writer.close()
    }
  })()

  return new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
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
