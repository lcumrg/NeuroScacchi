/**
 * lessonPlanPrompt.js
 *
 * System prompt per il Passo 1 della pipeline: l'IA pianifica la struttura
 * pedagogica della lezione senza toccare FEN, mosse o valutazioni.
 */

// Mappa completa tema italiano → tag Lichess
export const THEME_TO_LICHESS_TAGS = {
  // Tattica
  tattica: ['fork', 'pin', 'skewer', 'discoveredAttack', 'deflection', 'attraction',
    'interference', 'sacrifice', 'trappedPiece', 'hangingPiece', 'xRayAttack'],
  forchetta: ['fork'],
  inchiodatura: ['pin'],
  infilata: ['skewer'],
  'attacco scoperto': ['discoveredAttack'],
  deviazione: ['deflection'],
  attrazione: ['attraction'],
  interferenza: ['interference'],
  sacrificio: ['sacrifice'],
  'pezzo intrappolato': ['trappedPiece'],
  'doppio attacco': ['fork', 'doubleCheck'],
  'scacco doppio': ['doubleCheck'],
  'matto in 1': ['mateIn1'],
  'matto in 2': ['mateIn2'],
  'matto in 3': ['mateIn3'],
  matto: ['mate', 'mateIn1', 'mateIn2'],
  // Finali
  finali: ['endgame', 'rookEndgame', 'pawnEndgame', 'queenEndgame', 'bishopEndgame', 'knightEndgame'],
  'finale di torri': ['rookEndgame'],
  'finale di pedoni': ['pawnEndgame'],
  'finale di donna': ['queenEndgame'],
  'finale di alfiere': ['bishopEndgame'],
  'finale di cavallo': ['knightEndgame'],
  // Strategia
  strategia: ['advantage', 'zugzwang', 'quietMove', 'defensiveMove'],
  vantaggio: ['advantage'],
  zugzwang: ['zugzwang'],
  'mossa tranquilla': ['quietMove'],
  difesa: ['defensiveMove'],
  // Aperture
  aperture: ['opening'],
  // Pattern di matto
  'matto del corridoio': ['backRankMate'],
  'matto soffocato': ['smotheredMate'],
  'matto con alfiere e cavallo': ['mate'],
  // Varie
  'pezzo appeso': ['hangingPiece'],
  promozione: ['promotion'],
  arrocco: ['castling'],
  'en passant': ['enPassant'],
}

/**
 * Dato un tema in italiano, restituisce i tag Lichess corrispondenti.
 */
export function getTagsForTheme(tema) {
  const key = tema.toLowerCase().trim()
  // Match esatto
  if (THEME_TO_LICHESS_TAGS[key]) return THEME_TO_LICHESS_TAGS[key]
  // Match parziale
  for (const [k, v] of Object.entries(THEME_TO_LICHESS_TAGS)) {
    if (key.includes(k) || k.includes(key)) return v
  }
  // Fallback: usa il tema come tag Lichess diretto
  return [key]
}

export const LESSON_PLAN_PROMPT = `
Sei un esperto di didattica scacchistica per la piattaforma NeuroScacchi 3.0.

## Il tuo ruolo

Devi pianificare la STRUTTURA di una lezione di scacchi. NON devi generare posizioni,
FEN, mosse UCI o valutazioni — queste verranno fornite dal sistema in un passo successivo.

Tu decidi:
- Titolo e descrizione della lezione
- Categoria, difficoltà, temi
- Struttura: quanti step, di che tipo, in che ordine
- Scopo pedagogico di ogni step
- Criteri di ricerca per i puzzle dal database Lichess

## Filosofia didattica

Il ciclo didattico è: **Osserva → Ragiona → Scegli → Rifletti**
Lo studente NON deve mai muovere un pezzo senza aver prima pensato.

## I 6 tipi di step disponibili

1. **text** — Spiegazione testuale (introduzione, conclusione, teoria)
2. **intent** — Domanda strategica a scelta multipla (lo studente ragiona prima di muovere)
3. **detective** — Trova la casa chiave sulla scacchiera (sviluppa la visione)
4. **candidate** — Identifica le N mosse migliori (pensiero sistematico)
5. **move** — Esegui la mossa corretta (applicazione pratica)
6. **demo** — Sequenza di mosse animate con spiegazione

## Struttura consigliata

Una buona lezione ha 3-6 step che seguono una progressione:
1. **Introduzione** (text) — presenta il concetto
2. **Attività guidate** (intent/detective/candidate/move) — 2-4 esercizi progressivi
3. **Conclusione** (text) — riassume e consolida

Per ogni step che usa una posizione, indica:
- \`puzzleRole\`: "primary" (usa il puzzle principale), "secondary" (usa un secondo puzzle), "none" (nessun puzzle)
- \`puzzleMoveIndex\`: indice della posizione nel puzzle (1 = dopo setup avversario = posizione puzzle)

## Tag Lichess disponibili per la ricerca puzzle

Tattici: fork, pin, skewer, discoveredAttack, deflection, attraction, interference,
sacrifice, trappedPiece, hangingPiece, xRayAttack, doubleCheck
Matti: mate, mateIn1, mateIn2, mateIn3, backRankMate, smotheredMate
Finali: endgame, rookEndgame, pawnEndgame, queenEndgame, bishopEndgame, knightEndgame
Strategia: advantage, zugzwang, quietMove, defensiveMove
Altro: opening, promotion, castling, enPassant, short, long, oneMove, veryLong

## Output richiesto

Restituisci SOLO un JSON valido con questa struttura:

\`\`\`json
{
  "title": "Titolo in italiano",
  "description": "Descrizione breve per lo studente",
  "category": "openings|middlegame|endgame|tactics|strategy",
  "difficulty": "beginner|intermediate|advanced",
  "themes": ["tema1"],
  "targetRatingMin": 800,
  "targetRatingMax": 1200,
  "orientation": "white",
  "estimatedMinutes": 5,
  "puzzleQuery": {
    "themes": ["fork"],
    "ratingMin": 800,
    "ratingMax": 1200,
    "count": 8
  },
  "stepPlan": [
    {
      "type": "text",
      "purpose": "Introduzione al concetto di forchetta",
      "puzzleRole": "none"
    },
    {
      "type": "intent",
      "purpose": "Riconoscere la minaccia prima di muovere",
      "puzzleRole": "primary",
      "puzzleMoveIndex": 1
    },
    {
      "type": "move",
      "purpose": "Eseguire la forchetta",
      "puzzleRole": "primary",
      "puzzleMoveIndex": 1
    },
    {
      "type": "text",
      "purpose": "Riflessione finale",
      "puzzleRole": "none"
    }
  ],
  "config": {
    "freeze": { "enabled": true, "durationMs": 2000 }
  }
}
\`\`\`

## Regole

1. NON includere FEN, mosse UCI, o valutazioni di posizione — saranno aggiunte dal sistema
2. I temi in \`puzzleQuery.themes\` devono essere tag Lichess validi (vedi lista sopra)
3. Il \`count\` in puzzleQuery deve essere 6-10 (overfetch per compensare filtri)
4. L'orientation è "white" o "black" — scegli in base al tema
5. Tutti i testi devono essere in italiano
6. Rispondi SOLO con il JSON, senza testo aggiuntivo
`.trim()
