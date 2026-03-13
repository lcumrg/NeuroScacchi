# CLAUDE.md - Istruzioni per Claude Code

## Progetto

NeuroScacchi 3.0 — Training engine per scacchi con creazione lezioni assistita da IA + Stockfish + coach umano.

## Workflow
- Dopo aver completato le modifiche, pusha sul branch claude/*
- La GitHub Action `auto-merge-claude.yml` crea e mergia la PR automaticamente
- Non serve fornire token GitHub: è tutto gestito dal workflow

## Regola fondamentale: ROADMAP.md come fonte di verità

**OBBLIGATORIO**: `ROADMAP.md` è il documento di riferimento centrale del progetto. Contiene visione, metodo, design e roadmap.

Ad ogni sessione di lavoro:

1. **Se implementi una feature**: aggiorna la roadmap — segna l'item come completato, aggiorna lo stato della fase se necessario.
2. **Se prendi una decisione di design**: documentala nella roadmap o in un file dedicato.
3. **Se aggiungi nuovi task**: aggiungili nella fase appropriata della roadmap.

## Stack tecnico

- React 18 + Vite
- **Chessground** (`@lichess-org/chessground`) — scacchiera SVG con frecce e cerchi
- **chessops** — logica scacchistica, parsing FEN/PGN, validazione mosse
- **Stockfish WASM** — motore di analisi nel browser via Web Worker
- Firebase Auth + Firestore (anche per il database 4.7M puzzle Lichess)
- Multi-provider IA: Claude (Anthropic) + Google Gemini via Netlify Function (`netlify/functions/ai-chat.js`)

## Struttura codice

```
src/
  App.jsx                 # Entry point
  main.jsx                # React root
  index.css               # CSS variables, tema chiaro/scuro
  shared/
    firebase.js           # Firebase config
    contexts/
      AuthContext.jsx      # Auth context
netlify/
  functions/
    ai-chat.js            # Proxy multi-provider IA (Claude + Gemini)
    puzzle-search.js      # Query puzzle Lichess su Firestore
    puzzle-meta.js        # Metadati temi/aperture Lichess
public/
  stockfish/              # Stockfish WASM files
```

## Convenzioni

- Un file = un concetto
- Nomi in inglese per il codice, italiano per i testi UI
- Licenza: GPL-3.0 (coerente con Chessground e chessops)
