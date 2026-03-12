// Netlify Edge Function — proxy streaming multi-provider (Gemini + Claude)
// Usa ReadableStream nativo + keepalive SSE per evitare timeout su modelli lenti

const MODELS = {
  'gemini-2.5-pro':    { provider: 'gemini', id: 'gemini-2.5-pro' },
  'gemini-2.5-flash':  { provider: 'gemini', id: 'gemini-2.5-flash' },
  'claude-opus-4-6':   { provider: 'claude', id: 'claude-opus-4-6' },
  'claude-sonnet-4-6': { provider: 'claude', id: 'claude-sonnet-4-6' },
}

const DEFAULT_MODEL = 'claude-sonnet-4-6'

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: corsHeaders() })
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  let body
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Request body non valido' }, 400)
  }

  const { messages, system, model: requestedModel } = body

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return jsonResponse({ error: 'messages richiesto' }, 400)
  }

  const modelKey = requestedModel || DEFAULT_MODEL
  const modelConfig = MODELS[modelKey]
  if (!modelConfig) {
    return jsonResponse({ error: `Modello non supportato: ${modelKey}` }, 400)
  }

  if (modelConfig.provider === 'gemini') {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) return jsonResponse({ error: 'GEMINI_API_KEY non configurata in Netlify' }, 500)
    return streamGemini({ messages, system, modelId: modelConfig.id, apiKey })
  } else {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) return jsonResponse({ error: 'ANTHROPIC_API_KEY non configurata in Netlify' }, 500)
    return streamClaude({ messages, system, modelId: modelConfig.id, apiKey })
  }
}

// ─── Gemini ────────────────────────────────────────────────────────────────

async function streamGemini({ messages, system, modelId, apiKey }) {
  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }))

  const requestBody = {
    contents,
    generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
  }

  if (system?.trim()) {
    requestBody.systemInstruction = { parts: [{ text: system.trim() }] }
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?key=${apiKey}&alt=sse`

  let geminiResp
  try {
    geminiResp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })
  } catch (err) {
    return jsonResponse({ error: `Connessione a Gemini fallita: ${err.message}` }, 502)
  }

  if (!geminiResp.ok) {
    const errText = await geminiResp.text()
    let details = errText
    try { details = JSON.parse(errText).error?.message || errText } catch { /* ignore */ }
    return jsonResponse({ error: 'Errore API Gemini', details }, geminiResp.status)
  }

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const readable = new ReadableStream({
    start(controller) {
      // Keepalive ogni 5s — mantiene la connessione viva durante il thinking
      const keepAlive = setInterval(() => {
        try { controller.enqueue(encoder.encode(': keepalive\n\n')) } catch { clearInterval(keepAlive) }
      }, 5000)

      async function pump() {
        const reader = geminiResp.body.getReader()
        let buffer = ''
        let usageMetadata = null

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop()

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
                    controller.enqueue(encoder.encode(
                      `data: ${JSON.stringify({ text: part.text })}\n\n`
                    ))
                  }
                }
              } catch { /* chunk malformato, ignora */ }
            }
          }

          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({
              done: true,
              usage: {
                input_tokens: usageMetadata?.promptTokenCount || 0,
                output_tokens: usageMetadata?.candidatesTokenCount || 0,
              },
            })}\n\n`
          ))
        } catch (err) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ error: err.message })}\n\n`
          ))
        } finally {
          clearInterval(keepAlive)
          controller.close()
        }
      }

      pump()
    },
  })

  return new Response(readable, { status: 200, headers: sseHeaders() })
}

// ─── Claude ────────────────────────────────────────────────────────────────

async function streamClaude({ messages, system, modelId, apiKey }) {
  const claudeMessages = messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }))

  const requestBody = {
    model: modelId,
    max_tokens: 8192,
    temperature: 0.7,
    messages: claudeMessages,
    stream: true,
  }

  if (system?.trim()) {
    requestBody.system = system.trim()
  }

  let claudeResp
  try {
    claudeResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    })
  } catch (err) {
    return jsonResponse({ error: `Connessione a Claude fallita: ${err.message}` }, 502)
  }

  if (!claudeResp.ok) {
    const errText = await claudeResp.text()
    let details = errText
    try { details = JSON.parse(errText).error?.message || errText } catch { /* ignore */ }
    return jsonResponse({ error: 'Errore API Claude', details }, claudeResp.status)
  }

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const readable = new ReadableStream({
    start(controller) {
      const keepAlive = setInterval(() => {
        try { controller.enqueue(encoder.encode(': keepalive\n\n')) } catch { clearInterval(keepAlive) }
      }, 5000)

      async function pump() {
        const reader = claudeResp.body.getReader()
        let buffer = ''
        let inputTokens = 0
        let outputTokens = 0
        let eventType = null // fuori dal while: persiste tra chunk per eventi spezzati

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop()

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                eventType = line.slice(7).trim()
                continue
              }
              if (!line.startsWith('data: ')) continue
              const data = line.slice(6).trim()
              if (!data || data === '[DONE]') continue

              try {
                const chunk = JSON.parse(data)

                if (eventType === 'message_start' && chunk.message?.usage) {
                  inputTokens = chunk.message.usage.input_tokens || 0
                }
                if (eventType === 'message_delta' && chunk.usage) {
                  outputTokens = chunk.usage.output_tokens || 0
                }
                if (
                  eventType === 'content_block_delta' &&
                  chunk.delta?.type === 'text_delta' &&
                  chunk.delta.text
                ) {
                  controller.enqueue(encoder.encode(
                    `data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`
                  ))
                }
              } catch { /* chunk malformato, ignora */ }
            }
          }

          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({
              done: true,
              usage: { input_tokens: inputTokens, output_tokens: outputTokens },
            })}\n\n`
          ))
        } catch (err) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ error: err.message })}\n\n`
          ))
        } finally {
          clearInterval(keepAlive)
          controller.close()
        }
      }

      pump()
    },
  })

  return new Response(readable, { status: 200, headers: sseHeaders() })
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function sseHeaders() {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    ...corsHeaders(),
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

export const config = { path: '/api/ai-chat' }
