# Architettura Pipeline Generazione Lezioni

*Documento tecnico — NeuroScacchi 3.0*
*Data: 2026-03-13*

---

## 1. IL PROBLEMA

L'architettura attuale chiede all'IA di fare quattro cose:
1. Scegliere una posizione scacchistica
2. Calcolare la FEN dopo ogni mossa
3. Determinare quale mossa sia la migliore
4. Costruire la struttura pedagogica della lezione

Le prime tre richiedono calcolo scacchistico. **Gli LLM non sanno calcolare scacchi.** La ricerca dimostra che i modelli linguistici producono mosse illegali oltre il 50% delle volte senza correzione esterna. Il risultato: lezioni strutturalmente valide (JSON corretto, schema rispettato) ma **scacchisticamente false** — posizioni impossibili, mosse illegali, valutazioni sbagliate.

I 4.7M puzzle Lichess importati in Firestore sono posizioni già validate da milioni di giocatori, con rating calibrato e temi etichettati. Ma l'IA li riceve come "suggerimenti" e può ignorarli, usarli "come ispirazione", o inventare posizioni proprie. Il valore del database viene vanificato.

### Gap identificati

| # | Gap | Dove nel codice | Impatto |
|---|-----|-----------------|---------|
| 1 | Solo il primo tag Lichess usato (es. sempre "fork" per tattica) | `aiService.js:31` `tags[0]` | Puzzle irrilevanti per sotto-tema |
| 2 | Temi non mappati → zero puzzle → IA inventa | `aiService.js:31` `THEME_TO_LICHESS` ha solo 4 chiavi | Posizioni inventate |
| 3 | IA può ignorare i puzzle forniti | Prompt: "scegli o usane come ispirazione" | Nessuna garanzia di posizioni reali |
| 4 | FEN validata solo per formato regex | `lessonSchema.js` `FEN_REGEX` | Posizioni impossibili passano validazione |
| 5 | Mosse mai validate per legalita nella FEN | `lessonSchema.js` `UCI_MOVE_REGEX` | Mosse illegali passano validazione |
| 6 | Catena FEN non calcolata, solo string-match | `lessonSchema.js:315-323` | IA inventa resultingFen |
| 7 | SF non nel loop di generazione | Solo post-audit manuale | Errori rilevati troppo tardi |
| 8 | initialFen vs steps[0].fen non verificato | `lessonSchema.js` | Mismatch silenzioso |

---

## 2. IL PRINCIPIO

**L'IA fa pedagogia, il sistema fa scacchi.**

L'IA e eccellente in: strutturare una lezione, formulare domande, scrivere feedback, adattare il linguaggio al livello dello studente. Questo e il suo lavoro.

Calcolare FEN, verificare legalita delle mosse, determinare la mossa migliore: questo lo fanno **chessops** (deterministico, zero errori) e **Stockfish** (depth 15, analisi in 2-5 secondi).

Le posizioni vengono dal **database Lichess**: reali, validate, con rating calibrato.

L'IA non deve mai inventare ne calcolare nulla di scacchistico. Riceve materiale certificato e ci costruisce sopra la lezione.

---

## 3. LA PIPELINE

### Panoramica

```
Passo 0: UMANO descrive il bisogno
     |
     v
Passo 1: IA PIANIFICA (struttura pedagogica + criteri ricerca)
     |
     v
Passo 2: SISTEMA CERCA E VALIDA (Lichess + chessops + Stockfish)
     |
     v
Passo 3: IA COSTRUISCE (con materiali certificati)
     |
     v
Passo 4: UMANO valida e approva
```

### Passo 0 — L'umano identifica il bisogno

Il coach descrive cosa serve: "Marco ha 10 anni, 1200 Elo, perde spesso pezzi per forchette di cavallo. Servono esercizi su questo." Oppure seleziona tema, livello e rating dalla UI.

### Passo 1 — L'IA pianifica

L'IA analizza la richiesta e produce un **piano strutturato** (JSON).

**Cosa decide l'IA:**
- Titolo e descrizione della lezione
- Categoria, difficolta, temi
- Struttura: quanti step, di che tipo (intent, detective, candidate, move, text, demo), in che ordine
- Scopo pedagogico di ogni step
- Criteri di ricerca puzzle: tag Lichess da cercare, range rating, quantita

**Cosa NON decide:**
- Nessuna FEN
- Nessuna mossa UCI
- Nessuna valutazione di posizione
- Nessun dato scacchistico

**Output — LessonPlan:**

```json
{
  "title": "Le forchette di cavallo",
  "description": "Impara a riconoscere e sfruttare le forchette",
  "category": "tactics",
  "difficulty": "intermediate",
  "themes": ["fork"],
  "targetRatingMin": 1000,
  "targetRatingMax": 1400,
  "orientation": "white",
  "estimatedMinutes": 8,

  "puzzleQuery": {
    "themes": ["fork"],
    "ratingMin": 1000,
    "ratingMax": 1400,
    "count": 10
  },

  "stepPlan": [
    {
      "type": "text",
      "purpose": "Introduzione: cos'e una forchetta e perche e pericolosa",
      "puzzleRole": "none"
    },
    {
      "type": "intent",
      "purpose": "Riconoscere la minaccia di forchetta prima di muovere",
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
      "type": "detective",
      "purpose": "Trovare la casa chiave dove il cavallo attacca due pezzi",
      "puzzleRole": "secondary",
      "puzzleMoveIndex": 1
    },
    {
      "type": "text",
      "purpose": "Riflessione finale: come prevenire le forchette",
      "puzzleRole": "none"
    }
  ],

  "config": {
    "freeze": { "enabled": true, "durationMs": 2000 }
  }
}
```

**Implementazione:** nuova funzione `planLesson()` in `aiService.js` con system prompt dedicato (`lessonPlanPrompt.js`). La mappa tema→tag Lichess viene espansa significativamente rispetto alle 4 chiavi attuali.

### Passo 2 — Il sistema cerca e valida

Pipeline automatica, **zero IA**. Tre sotto-passi:

#### 2a. Query puzzle da Firestore

Usa i criteri `puzzleQuery` dal piano. Overfetch (2x il count richiesto) per compensare filtri successivi. Se non abbastanza risultati: allarga range rating di +/- 200, poi usa tema piu generico.

#### 2b. Calcolo posizioni con chessops

Per ogni puzzle, cammina lungo la sequenza di mosse con `chessService.makeMove()`:

```
positions[0] = FEN iniziale (prima di qualsiasi mossa)
positions[1] = FEN dopo moves[0] (mossa avversario = "setup")
positions[2] = FEN dopo moves[1] (mossa giocatore = "soluzione")
positions[3] = FEN dopo moves[2] (risposta avversario)
positions[4] = FEN dopo moves[3] (seconda mossa giocatore)
...
```

**Nota sui puzzle Lichess:** la prima mossa (`moves[0]`) e sempre dell'avversario (la mossa che "crea" il puzzle). La seconda (`moves[1]`) e la soluzione del giocatore. Questo pattern si ripete per puzzle multi-mossa.

Ogni FEN e calcolata deterministicamente da chessops — zero errori possibili. Per ogni posizione si registra anche: chi muove, se c'e scacco, se c'e matto/stallo.

#### 2c. Analisi Stockfish

Per ogni puzzle selezionato (2-3 per lezione), Stockfish analizza le posizioni chiave:

| Posizione | Analisi | Perche |
|-----------|---------|--------|
| positions[1] (puzzle position) | `getBestMoves(4, depth 15)` + `evaluate()` + `getThreats(3)` | Servono mosse candidate, eval, minacce per intent/candidate/detective |
| positions[2] (dopo soluzione) | `evaluate()` | Verificare che la soluzione sia effettivamente la migliore |
| positions[0] (prima del setup) | `getThreats(3)` | Contesto per capire la posizione prima della mossa critica |

Ottimizzazione futura: `lichessCloudEval` come prima fonte (gratis, istantaneo per posizioni comuni in cache Lichess), SF locale come fallback.

**Output — MaterialsPackage:**

```json
{
  "puzzles": [
    {
      "id": "abc123",
      "startingFen": "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
      "moves": ["g8f6", "d1h5", "..."],
      "rating": 1200,
      "themes": ["fork", "short"],
      "positions": [
        {
          "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
          "moveIndex": 0,
          "moveUci": null,
          "moveSan": null,
          "sideToMove": "w",
          "isCheck": false,
          "isCheckmate": false
        },
        {
          "fen": "...",
          "moveIndex": 1,
          "moveUci": "g8f6",
          "moveSan": "Nf6",
          "sideToMove": "b",
          "isCheck": false,
          "isCheckmate": false
        }
      ],
      "analysis": [
        {
          "fen": "...",
          "bestMove": "d1h5",
          "bestMoveSan": "Qh5",
          "eval": 350,
          "mate": null,
          "topMoves": [
            { "move": "d1h5", "moveSan": "Qh5", "eval": 350, "pv": "d1h5 g7g6 h5e5" }
          ],
          "threats": [
            { "move": "f6e4", "moveSan": "Nxe4", "eval": -120 }
          ]
        }
      ]
    }
  ],
  "summary": "3 puzzle fork rating 1000-1400, 9 posizioni calcolate, 6 analisi SF"
}
```

### Passo 3 — L'IA costruisce

L'IA riceve il piano (Passo 1) e il pacchetto materiali (Passo 2) e produce il JSON lezione v3.0.0.

**Regole ferree nel prompt:**
1. USARE SOLO le FEN fornite nel pacchetto materiali
2. USARE SOLO le mosse UCI fornite nel pacchetto materiali
3. Ogni `correctMoves`, `bestMove`, `candidateMoves` deve venire dall'analisi SF
4. Non calcolare, non inventare, non modificare nulla di scacchistico
5. Il tuo lavoro: domande, opzioni, feedback, spiegazioni, narrazione pedagogica

**Come il puzzle diventa step:**

| Step tipo | `step.fen` da | Mosse da | IA scrive |
|-----------|--------------|----------|-----------|
| intent | `positions[1].fen` | `correctMoves` = `[moves[1]]`, `allowedMoves` = SF top 3-4 | Domanda, opzioni, feedback |
| detective | `positions[1].fen` | `correctSquare` = casa target della mossa migliore | Domanda, suggerimenti, feedback |
| candidate | `positions[1].fen` | `candidateMoves` = SF top N, `bestMove` = SF best | Istruzione, feedback |
| move | `positions[1].fen` | `correctMoves` = `[moves[1]]` | Istruzione, feedback |
| text | opzionale | nessuna | Contenuto in italiano |
| demo | `positions[0].fen` | `moves` = sottosequenza puzzle | Spiegazione |

**Post-processing automatico** (dopo output IA):

1. **`validateLessonAgainstMaterials()`** — verifica che ogni FEN nel JSON esista nel pacchetto materiali. Se l'IA ha inventato una FEN, viene segnalata.
2. **`computeTransitions()`** — le transizioni tra step vengono calcolate deterministicamente cercando il percorso di mosse tra due FEN nei materiali. L'IA non deve calcolarle.
3. **`validateLesson()`** — validazione schema esistente (gia implementata).
4. **Validazione mosse legali** con `chessService.legalDests()` — gia implementata ma applicata sistematicamente.

### Passo 4 — L'umano valida

Nessun cambio. Il coach usa la Console Coach per rivedere la lezione, con:
- LessonViewer con dettagli step
- Analisi Stockfish con pallini qualita
- Scacchiera che mostra le posizioni
- Chat per richiedere modifiche
- Salva bozza / Approva e pubblica

Novita: vengono mostrati i `sourcePuzzleIds` cosi il coach sa da dove vengono le posizioni.

---

## 4. CONFRONTO: PRIMA E DOPO

| Aspetto | Pipeline attuale | Nuova pipeline |
|---------|-----------------|---------------|
| Chi sceglie le posizioni | IA (puo inventarle) | Lichess database (validate) |
| Chi calcola le FEN | IA (sbaglia >50%) | chessops (deterministico, 0% errori) |
| Chi determina la mossa migliore | IA (hallucina) | Stockfish (depth 15) |
| Chi scrive domande e feedback | IA | IA |
| Chi calcola le transizioni | IA (spesso sbagliate) | chessops (deterministico) |
| Quando SF interviene | Post-audit opzionale | Integrato nel flusso, prima dell'IA |
| Errori scacchistici attesi | Frequenti | Quasi zero (posizioni Lichess + chessops) |

---

## 5. BUDGET PERFORMANCE

| Fase | Tempo stimato |
|------|---------------|
| Passo 1 (IA pianifica) | 5-15s |
| Passo 2a (fetch puzzle Firestore) | 1-2s |
| Passo 2b (compute posizioni chessops) | <100ms |
| Passo 2c (analisi SF, 2-3 puzzle) | 15-25s |
| Passo 3 (IA costruisce) | 10-20s |
| Post-processing (validazione + transizioni) | <200ms |
| **Totale** | **31-62s** |

Con cloud eval Lichess (posizioni comuni gia in cache): **25-45s**.

---

## 6. IMPLEMENTAZIONE

### File da creare

| File | Ruolo |
|------|-------|
| `src/engine/lessonPipeline.js` | Orchestratore: `generateLessonPipeline()` coordina i 4 passi |
| `src/engine/puzzleEnricher.js` | Passo 2: `computePuzzlePositions()`, `analyzePuzzlePositions()`, `buildMaterialsPackage()`, `computeTransitions()`, `validateLessonAgainstMaterials()` |
| `src/engine/lessonPlanPrompt.js` | System prompt per Passo 1 |
| `src/engine/lessonBuildPrompt.js` | System prompt per Passo 3 |

### File da modificare

| File | Modifiche |
|------|-----------|
| `src/engine/aiService.js` | Aggiungere `planLesson()` e `buildLesson()`. Mantenere `generateLesson()` come fallback. |
| `src/engine/chessService.js` | Aggiungere `makeMoveFromUci(fen, uci)` e `getSan(fen, uci)` |
| `src/pages/ConsolePage.jsx` | `handleGenerate` chiama la nuova pipeline. Progress a 4 fasi. Toggle vecchia/nuova durante transizione. |

### Fasi incrementali

| Fase | Scope |
|------|-------|
| **A — Foundation** | `puzzleEnricher.js` con `computePuzzlePositions()`, helper in `chessService.js`, skeleton `lessonPipeline.js` |
| **B — Passo 1+2** | `lessonPlanPrompt.js`, `planLesson()`, `buildMaterialsPackage()` con SF |
| **C — Passo 3+wiring** | `lessonBuildPrompt.js`, `buildLesson()`, validazione materiali, wiring ConsolePage con toggle |
| **D — Polish** | Cloud eval, fallback puzzle insufficienti, rimozione toggle |

### Cosa NON cambia

- **Formato lezione JSON v3.0.0** — invariato. Il Player continua a funzionare senza modifiche.
- **Player** (`PlayerPage.jsx` e componenti) — nessuna modifica.
- **Schema validation** (`lessonSchema.js`) — viene riusata cosi com'e.
- **Database Firestore** — gia popolato con 4.7M puzzle.
- **Netlify Functions** — `puzzle-search.js` e `ai-chat.js` invariate.

---

*NeuroScacchi 3.0 — Documento riservato. Tutti i diritti riservati.*
