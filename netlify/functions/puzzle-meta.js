// Netlify Function — metadati puzzle (temi e aperture Lichess)
// I temi Lichess sono un set fisso e stabile, hardcoded per evitare
// query di aggregazione costose su milioni di documenti.

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

// Set completo dei temi puzzle Lichess (aggiornato marzo 2026)
const LICHESS_THEMES = [
  'advancedPawn', 'advantage', 'anapierce', 'arabianMate',
  'attackingF2F7', 'attraction', 'backRankMate', 'bishopEndgame',
  'bodenMate', 'castling', 'capablancaFreund', 'clearance',
  'crushing', 'defensiveMove', 'deflection', 'discoveredAttack',
  'doubleBishopMate', 'doubleCheck', 'dovetailMate', 'endgame',
  'enPassant', 'equality', 'exposedKing', 'fork',
  'hangingPiece', 'hookMate', 'interference', 'intermezzo',
  'kingsideAttack', 'knightEndgame', 'long', 'master',
  'masterVsMaster', 'mate', 'mateIn1', 'mateIn2',
  'mateIn3', 'mateIn4', 'mateIn5', 'middlegame',
  'oneMove', 'opening', 'pawnEndgame', 'pin',
  'promotion', 'queenEndgame', 'queenRookEndgame', 'queensideAttack',
  'quietMove', 'rookEndgame', 'sacrifice', 'short',
  'skewer', 'smotheredMate', 'superGM', 'trappedPiece',
  'underPromotion', 'xRayAttack', 'zugzwang',
]

// Famiglie di aperture principali (tag Lichess)
const LICHESS_OPENINGS = [
  'Caro-Kann_Defense', 'English_Opening', 'French_Defense',
  'Italian_Game', 'Kings_Gambit', 'Kings_Indian_Defense',
  'Kings_Pawn_Game', 'Philidor_Defense', 'Pirc_Defense',
  'Queens_Gambit', 'Queens_Gambit_Declined', 'Queens_Pawn_Game',
  'Ruy_Lopez', 'Scandinavian_Defense', 'Scotch_Game',
  'Sicilian_Defense', 'Slav_Defense',
]

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: corsHeaders() })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const body = await req.json()
    const { type } = body

    if (type === 'themes') {
      return jsonResponse({ values: LICHESS_THEMES })
    }

    if (type === 'openings') {
      return jsonResponse({ values: LICHESS_OPENINGS })
    }

    return jsonResponse({ error: 'type deve essere "themes" o "openings"' }, 400)
  } catch (err) {
    return jsonResponse({ error: err.message }, 500)
  }
}

export const config = {
  path: '/api/puzzle-meta',
}
