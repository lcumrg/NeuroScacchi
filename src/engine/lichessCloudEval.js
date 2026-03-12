/**
 * lichessCloudEval.js
 *
 * Fetches pre-computed Stockfish evaluations from the Lichess Cloud Eval API.
 * Fast (milliseconds) for common positions. Returns null if not cached.
 *
 * API docs: https://lichess.org/api#tag/Analysis/operation/apiCloudEval
 * Rate limit: ~10 requests/second
 */

const CLOUD_EVAL_BASE = 'https://lichess.org/api/cloud-eval'

// Simple rate-limiter: queue requests with a 110ms gap between them
let _lastRequestAt = 0
const MIN_INTERVAL_MS = 110

async function rateLimitedFetch(url) {
  const now = Date.now()
  const wait = MIN_INTERVAL_MS - (now - _lastRequestAt)
  if (wait > 0) {
    await new Promise(resolve => setTimeout(resolve, wait))
  }
  _lastRequestAt = Date.now()
  return fetch(url)
}

/**
 * Fetches pre-computed Stockfish evaluation from Lichess Cloud Eval API.
 *
 * @param {string} fen
 * @param {number} multiPv - number of principal variations (default 3)
 * @returns {Promise<{ fen: string, lines: Array<{ moves: string, cp: number|null, mate: number|null }>, knodes: number } | null>}
 */
export async function fetchCloudEval(fen, multiPv = 3) {
  if (!fen) return null

  const url = `${CLOUD_EVAL_BASE}?fen=${encodeURIComponent(fen)}&multiPv=${multiPv}`

  let response
  try {
    response = await rateLimitedFetch(url)
  } catch (err) {
    // Network error — return null gracefully
    console.warn('[lichessCloudEval] Network error:', err.message)
    return null
  }

  if (response.status === 404) {
    // Position not cached — normal, not an error
    return null
  }

  if (!response.ok) {
    console.warn(`[lichessCloudEval] Unexpected HTTP ${response.status} for FEN: ${fen}`)
    return null
  }

  let data
  try {
    data = await response.json()
  } catch {
    console.warn('[lichessCloudEval] Invalid JSON response')
    return null
  }

  if (!data || !Array.isArray(data.pvs) || data.pvs.length === 0) {
    return null
  }

  const lines = data.pvs.map(pv => ({
    moves: pv.moves || '',
    cp: pv.cp != null ? pv.cp : null,
    mate: pv.mate != null ? pv.mate : null,
  }))

  return {
    fen,
    lines,
    knodes: data.knodes ?? null,
    depth: data.depth ?? null,
  }
}

/**
 * Analyzes all steps in a lesson using Lichess Cloud Eval.
 * Returns an array with results for each step that has a FEN.
 * Steps with uncached positions will have `cloudEval: null`.
 *
 * @param {object} lesson - lesson object with `steps` array
 * @param {{ multiPv?: number, onProgress?: function }} options
 * @returns {Promise<Array<{
 *   stepIndex: number,
 *   fen: string,
 *   cloudEval: object|null
 * }>>}
 */
export async function analyzeWithCloudEval(lesson, { multiPv = 3, onProgress } = {}) {
  const steps = lesson?.steps ?? []
  const results = []

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    if (!step.fen) continue

    onProgress?.({ stepIndex: i, total: steps.length, status: 'fetching' })

    const cloudEval = await fetchCloudEval(step.fen, multiPv)

    results.push({
      stepIndex: i,
      fen: step.fen,
      cloudEval,
    })

    onProgress?.({ stepIndex: i, total: steps.length, status: 'done' })
  }

  return results
}
