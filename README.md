# NeuroScacchi 3.0

Training engine per scacchi: creazione lezioni assistita da IA + Stockfish + coach umano.

## Sviluppo locale

```bash
npm install
npm run dev
```

Apri `http://localhost:5173`

## Stack

- React 18 + Vite
- Chessground (scacchiera SVG Lichess)
- chessops (logica scacchistica)
- Stockfish WASM (motore di analisi)
- Firebase Auth + Firestore
- Anthropic Claude API (via Netlify Function)

## Deploy

Push su branch `claude/*` → GitHub Action auto-merge → Netlify auto-deploy.

---

*NeuroScacchi 3.0 — Luca Morigi. Tutti i diritti riservati.*
