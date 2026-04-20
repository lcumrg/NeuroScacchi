# CLAUDE.md - Istruzioni per Claude Code

---
DOCUMENTI DI RIFERIMENTO (da consultare all'inizio di ogni sessione):
- ROADMAP.md → visione e piano di lavoro (versione 3.1, aprile 2026)
- STATO-ATTUALE.md → fotografia tecnica del codice
- DOMANDE-APERTE.md → questioni da chiarire con l'utente

PRINCIPIO GUIDA: il perimetro operativo è "laboratorio privato" (vedi ROADMAP.md). Ogni scelta tecnica proposta in sessione va verificata contro la ROADMAP. In caso di dubbio tra più strade, chiedere all'utente invece di decidere autonomamente.
---

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

## Things — area "NeuroScacchi" come task board viva

L'utente tiene le task operative in **Things 3**, nell'area "NeuroScacchi". È l'incarnazione concreta dell'Area 5 della ROADMAP 3.1 ("la continuità come infrastruttura"). I cinque progetti dell'area corrispondono alle cinque aree di lavoro della 3.1: Pulizia codice, Lezioni di apertura, Esperimento KB, Grafica per bambini, Continuità e processo.

**Claude Code può leggere e modificare Things direttamente via AppleScript** (`osascript`). Dal 2026-04-20, su richiesta esplicita dell'utente, l'istruzione è:

1. **Leggere Things a ogni inizio sessione**, senza chiedere. Quando l'utente dice "riprendiamo", "dove eravamo", "cosa facciamo oggi" o simili, aprire direttamente la lista "Oggi" e i progetti dell'area NeuroScacchi e presentare una sintesi concisa (non riversare tutti i 30+ todo aperti).
2. **Proporre aggiornamenti al termine di ogni task completata.** Claude può spuntare/modificare le task via AppleScript, ma **solo previa conferma esplicita** dell'utente — la spunta è una decisione sua.
3. **Ricordargli di aprirla quando perde il filo.** Se l'utente sembra disorientato, ripete domande, o chiede "e adesso?", rileggere Things prima di proporre.

Note tecniche su AppleScript Things 3:
- `every project of theArea` **non funziona** (errore -1728). Iterare invece `every project` e filtrare su `name of (area of p)`.
- Usare `every checklist item of t` (non `checklist items of t`).
- La lista "Oggi" in localizzazione italiana si chiama `"Oggi"`, non `"Today"`.

Questa è un'istruzione persistente: vale per tutte le sessioni future, anche quando l'utente non la rinnova esplicitamente.

## Stack tecnico

- React 18 + Vite
- **Chessground** (`@lichess-org/chessground`) — scacchiera SVG con frecce e cerchi
- **chessops** — logica scacchistica, parsing FEN/PGN, validazione mosse
- **Stockfish WASM** — motore di analisi nel browser via Web Worker
- Firebase Auth + Firestore (anche per il database 4.7M puzzle Lichess)
- Multi-provider IA: Claude (Anthropic) + Google Gemini, orchestrati da una **edge function** streaming (`netlify/edge-functions/ai-chat.js`). Esiste anche `netlify/functions/ai-chat.js` non-streaming con supporto Vision per l'ingestione KB.

## Struttura codice

Ordine di grandezza reale al 2026-04-20: ~20 moduli in `src/engine/`, 11 pagine, 10 componenti, 13 Netlify functions + 1 edge function, 6 documenti in `docs/`. Una fotografia descrittiva completa vive in `STATO-ATTUALE.md` — qui solo il riassunto navigabile.

```
src/
  App.jsx                        # Entry point, routing hash-based
  main.jsx                       # React root + AuthProvider
  index.css                      # CSS variables, tema chiaro/scuro
  engine/                        # 20 moduli: logica scacchistica, pipeline, prompt
    chessService.js              #   wrapper chessops (FEN/PGN, legalità)
    stockfishService.js          #   singleton WASM, lifecycle + API
    openingPipeline.js           #   pipeline aperture a 4 passi (viva)
    openingEnricher.js           #   Explorer + SF + chessops sui piani IA
    openingPlanPrompt.js         #   prompt passo 1 (piano lezione)
    openingBuildPrompt.js        #   prompt passo 3 (contenuti pedagogici)
    lessonPipeline.js            #   pipeline tattica (congelata)
    puzzleEnricher.js            #   arricchimento puzzle (congelato)
    lessonSchema.js              #   validatore runtime v3.0.0
    lessonStore.js, kbStore.js   #   I/O Firestore via Netlify functions
    kbIngestion.js               #   Fase KB-1: pagina manuale → chunk
    lichessCloudEval.js          #   cloud eval Lichess (fallback)
    sfAnalysisService.js         #   analisi Stockfish on-demand UI
    aiService.js                 #   client edge function /api/ai-chat
    lessonSystemPrompt.js        #   system prompt generico
  pages/                         # 11 pagine .jsx + CSS
    ConsolePage                  #   creazione lezioni (cuore coach)
    PlayerPage                   #   esecuzione lezione (studente)
    LessonsPage                  #   archivio lezioni
    IngestionPage                #   upload pagine manuale → KB
    AnalisiPage, DiarioPage      #   pannello Sviluppo
    FeedbackPage, ProgettoPage   #   pannello Sviluppo
    SviluppoPage                 #   contenitore dei precedenti
    DemoPage, DocPage            #   onboarding/documentazione
  components/                    # UI riusabile
    Chessboard.jsx               #   wrapper Chessground (responsive)
    LessonViewer.jsx             #   viewer lezione JSON
    StockfishPanel.jsx, EvalBar  #   analisi manuale coach
    player/                      #   sotto-componenti step player
    ErrorBoundary.jsx
  shared/
    firebase.js                  # Firebase config (client)
    contexts/
      AuthContext.jsx            # AuthProvider (presente ma non cablato)
netlify/
  edge-functions/
    ai-chat.js                   # Edge streaming Claude + Gemini
  functions/                     # 13 functions: CRUD lezioni/KB/feedback,
                                 # puzzle-search, opening-explorer, ai-chat (Vision), ecc.
public/
  stockfish/                     # Stockfish WASM files
docs/                            # 6 documenti architetturali + archivio 3.0
  archivio/                      #   ROADMAP-3.0-storica, ANALISI-CODICE-storica
functions/                       # Firebase Functions 2.x (LEGACY, da archiviare)
```

## Convenzioni

- Un file = un concetto
- Nomi in inglese per il codice, italiano per i testi UI
- Licenza: GPL-3.0 (coerente con Chessground e chessops)
