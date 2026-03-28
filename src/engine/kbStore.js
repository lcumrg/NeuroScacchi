// Client-side wrapper per le operazioni CRUD sulla Knowledge Base

/**
 * Salva un chunk KB su Firestore.
 * @param {object} chunk - Chunk con fens[], apertura, principiStrategici, ecc.
 * @returns {Promise<{ok: boolean, id?: string, error?: string}>}
 */
export async function saveChunk(chunk) {
  const res = await fetch('/api/kb-save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chunk }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { ok: false, error: err.error || `HTTP ${res.status}` }
  }
  const data = await res.json()
  return { ok: true, id: data.id }
}

/**
 * Lista i chunk KB, opzionalmente filtrati per apertura/variante.
 * @param {{ apertura?: string, variante?: string }} [filters]
 * @returns {Promise<Array>}
 */
export async function listChunks(filters = {}) {
  const params = new URLSearchParams()
  if (filters.apertura) params.set('apertura', filters.apertura)
  if (filters.variante) params.set('variante', filters.variante)
  const qs = params.toString()
  const res = await fetch(`/api/kb-list${qs ? '?' + qs : ''}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.chunks ?? []
}

/**
 * Elimina un chunk KB.
 * @param {string} id
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function deleteChunk(id) {
  const res = await fetch('/api/kb-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { ok: false, error: err.error || `HTTP ${res.status}` }
  }
  return { ok: true }
}
