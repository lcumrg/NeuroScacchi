const API_URL = '/api/puzzle-search'

let themesCache = null
let openingTagsCache = null

async function request(body) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `Errore server: ${res.status}`)
  }

  return res.json()
}

async function searchPuzzles({ themes, ratingMin, ratingMax, popularityMin, openingTags, excludeIds, limit, random } = {}) {
  return request({ themes, ratingMin, ratingMax, popularityMin, openingTags, excludeIds, limit, random })
}

async function getRandomPuzzles({ theme, ratingMin, ratingMax, count = 10 } = {}) {
  const result = await searchPuzzles({
    themes: theme ? [theme] : undefined,
    ratingMin,
    ratingMax,
    limit: count,
    random: true,
  })
  return result.puzzles
}

async function getOpeningPuzzles({ opening, ratingMin, ratingMax, count = 10 } = {}) {
  const result = await searchPuzzles({
    openingTags: opening ? [opening] : undefined,
    ratingMin,
    ratingMax,
    limit: count,
    random: true,
  })
  return result.puzzles
}

async function getThemes() {
  if (themesCache) return themesCache

  const res = await fetch('/api/puzzle-meta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'themes' }),
  })
  if (!res.ok) throw new Error('Errore caricamento temi')
  const data = await res.json()
  themesCache = data.values
  return themesCache
}

async function getOpeningTags() {
  if (openingTagsCache) return openingTagsCache

  const res = await fetch('/api/puzzle-meta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'openings' }),
  })
  if (!res.ok) throw new Error('Errore caricamento aperture')
  const data = await res.json()
  openingTagsCache = data.values
  return openingTagsCache
}

const puzzleDatabase = {
  searchPuzzles,
  getRandomPuzzles,
  getOpeningPuzzles,
  getThemes,
  getOpeningTags,
}

export default puzzleDatabase
