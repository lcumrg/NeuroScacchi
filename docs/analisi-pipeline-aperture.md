# Pipeline Aperture — Analisi, Architettura e Implementazione

*NeuroScacchi 3.0 | Marzo 2026*

**Stato: IMPLEMENTATA ✓** — Sessione 2026-03-14

---

## La decisione strategica

**Tattica e finali esclusivi dalla pipeline per ora.** La qualità didattica richiede specializzazione: spiegare un'apertura, una tattica e un finale sono attività profondamente diverse. Si parte dalle aperture — il terreno più ricco di piani, idee e comprensione strategica — e si aggiunge il resto solo quando ogni dominio avrà raggiunto qualità reale.

---

## Il problema con l'approccio attuale

La pipeline attuale usa il database puzzle Lichess (4.7M puzzle) come fonte di materiali. Questo funziona per la tattica perché un puzzle tattico è una posizione con una soluzione calcolabile.

Per le aperture questo approccio non funziona:
- I puzzle Lichess non hanno contesto di apertura
- Le posizioni tattiche sono estratte dalla partita, non dall'apertura stessa
- Manca la sequenza di mosse contestualizzata (mossa 1, 2, 3... e il perché di ognuna)
- Manca l'elemento statistico: "questa è la risposta più comune a questo livello"

La fonte dati giusta per le aperture è il **Lichess Opening Explorer**.

---

## Lichess Opening Explorer — la fonte dati

### Cos'è

Un database pubblico e gratuito di **milioni di partite reali**, interrogabile posizione per posizione. Restituisce per ogni posizione:
- Tutte le mosse giocate con frequenza assoluta
- Win/draw/loss rate per ciascuna mossa
- Filtri per: fascia Elo (1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500+), cadenza (bullet/blitz/rapid/classical)
- Nome dell'apertura (ECO + nome esteso)
- Partite master di riferimento

### Endpoint principale

```
GET https://explorer.lichess.ovh/lichess
  ?fen=<FEN>
  &ratings=1200,1400,1600
  &speeds=rapid,classical
  &moves=10
```

### Cosa ci dà per le lezioni

Permette di ancorare ogni spiegazione a dati reali:
- "Il 73% dei giocatori al tuo livello risponde con ...e5 qui"
- "Questa mossa è giocata raramente (8%) ma ha un ottimo win rate (58%)"
- "La variante più popolare a questo livello è..."

Questo è il differenziatore rispetto alla memorizzazione: lo studente capisce *perché* certe mosse vengono giocate, non solo *che* vengono giocate.

---

## Architettura della pipeline aperture

### Confronto con pipeline tattica

| | Pipeline tattica (attuale) | Pipeline aperture (nuova) |
|---|---|---|
| **Fonte dati** | Puzzle DB Firestore (4.7M puzzle) | Lichess Opening Explorer API |
| **Materiali** | Posizioni tattiche da puzzle | Mosse dell'apertura con statistiche reali |
| **Input coach** | Tema + livello | Apertura + colore + varianti + profondità |
| **Orientamento** | Sempre bianco | Bianco o nero (scacchiera gira) |
| **Prompt IA** | "Crea attività su questa tattica" | "Spiega il piano dietro ogni mossa" |
| **Formato lezione** | Steps con attività | Identico — stesse attività, stesso schema |
| **SF** | Analisi posizioni puzzle | Analisi posizioni chiave dell'apertura |

### Il flusso completo

```
PASSO 1: UMANO (coach)
├── Apertura (es. "Siciliana Najdorf, variante Inglese")
├── Colore (Bianco / Nero)
├── Varianti da coprire (testo libero, es. "concentrati su 6.Ag5")
├── Profondità (es. "fino alla mossa 12")
└── Livello studente

PASSO 2: IA PIANIFICA
├── Struttura pedagogica della lezione
├── Sequenza di step prevista
└── Linea principale + varianti da coprire

PASSO 3: SISTEMA (deterministico)
├── Cammina le mosse con chessops → FEN per ogni posizione
├── Lichess Opening Explorer → statistiche per ogni FEN
│   ├── Mosse più frequenti per fascia Elo
│   ├── Win/draw/loss rate
│   └── Nome apertura
├── Stockfish analizza posizioni chiave
└── Pacchetto materiali certificato

PASSO 4: IA COSTRUISCE
├── Usa SOLO le FEN e i dati dal pacchetto materiali
├── Spiega il PIANO dietro ogni mossa (non la mossa)
├── Usa tutte le attività: text, intent, detective, candidate, move, demo
└── Output: lezione JSON v3.0.0

PASSO 5: UMANO APPROVA
└── Coach rivede e approva nella Console Coach
```

### Come le attività si applicano alle aperture

Le attività esistenti si mappano naturalmente sulla comprensione delle aperture:

| Attività | Uso per tattica | Uso per aperture |
|---|---|---|
| **text** | Narrativa della posizione | Introduce l'idea dell'apertura, spiega la struttura |
| **intent** | "Qual è il piano?" (tattica) | "Perché il Nero gioca ...c5 invece di ...e5?" |
| **detective** | Trova il punto chiave della tattica | Trova la casa/pezzo che definisce la struttura |
| **candidate** | Trova le mosse forti | Scegli tra le mosse più giocate a questo livello + spiegazione |
| **move** | Esegui la soluzione | Esegui la mossa dell'apertura (rinforzo) |
| **demo** | Mostra la sequenza tattica | Mostra la sequenza di apertura con narrazione |

### Orientamento scacchiera

- Lezione su aperture per il **Bianco** → `orientation: "white"` (invariato)
- Lezione su aperture per il **Nero** → `orientation: "black"` (scacchiera girata)

LessonViewer passa già `orientation` a Chessground — è una riga di codice.

---

## Differenza fondamentale: comprensione vs memorizzazione

### Cosa fa chessdriller (memorizzazione)

> "Dopo 1.e4 e5, gioca 2.Cf3. Corretto. Dopo 2...Cc6, gioca 3.Ab5. Corretto."

Lo studente ripete la mossa finché non la ricorda. Non sa perché.

### Cosa farà NeuroScacchi (comprensione)

> **[text]** "Siamo alla Ruy Lopez. Il Bianco attacca subito il cavallo che difende e5 — non per catturarlo ora, ma per creare pressione futura sul centro."
>
> **[intent]** "Il Nero gioca 3...a6. Qual è lo scopo di questa mossa?"
> - ✓ Mette in discussione il piano dell'Alfiere bianco
> - ✗ Prepara l'avanzata del pedone b
> - ✗ Difende contro Cxe5
>
> **[detective]** "Dopo 4.Aa4, qual è la casa chiave che l'Alfiere tiene d'occhio?"
>
> **[candidate]** "Il Nero può rispondere in 3 modi. Quale è il più giocato tra i giocatori al tuo livello? [statistiche reali da Explorer]"

La differenza è strutturale: l'attività si svolge *prima* di eseguire la mossa, non dopo averla memorizzata.

---

## File da creare

| File | Ruolo |
|---|---|
| `src/engine/openingExplorer.js` | Client Lichess Opening Explorer API |
| `src/engine/openingEnricher.js` | Passo 3: cammina mosse, fetcha statistiche, analisi SF |
| `src/engine/openingPipeline.js` | Orchestratore (analogo a `lessonPipeline.js`) |
| `src/engine/openingPlanPrompt.js` | Prompt Passo 2: pianificazione lezione apertura |
| `src/engine/openingBuildPrompt.js` | Prompt Passo 4: costruzione step centrata su comprensione |
| `docs/analisi-pipeline-aperture.md` | Questo documento |

## File da modificare

| File | Modifiche |
|---|---|
| `src/pages/ConsolePage.jsx` | Sezione aperture: form con apertura, colore, varianti, profondità |
| `src/engine/aiService.js` | Aggiungere `planOpening()` e `buildOpeningLesson()` |
| `src/pages/LessonViewer.jsx` | Passare `orientation` a Chessground (già predisposto) |

---

## Note implementative

### Lichess Opening Explorer — gestione rate limit

L'API è pubblica e gratuita ma ha rate limit. Per una lezione da 6-8 mosse di apertura, servono 6-8 chiamate (una per ogni posizione). Strategia:
- Chiamate sequenziali con piccolo delay (200ms)
- Cache in memoria per la sessione corrente
- Fallback graceful: se l'Explorer non risponde, usa solo SF senza statistiche

### Qualità dei dati per fascia Elo

Il filtro `ratings` dell'Explorer accetta valori specifici: 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500. La pipeline mapperà il livello dello studente sulla fascia più vicina.

### Varianti multiple

Una lezione può coprire linea principale + 1-2 varianti. La struttura a step permette di farlo naturalmente: step nella linea principale, poi step nelle varianti con `text` che introduce il cambio.

---

## Contesto competitivo

Chessline.io tenta un approccio simile (Opening Explorer + engine + spiegazione AI) ma:
- Non ha attività didattiche interattive (solo move trainer = memorizzazione)
- Non ha il coach umano nel loop
- Non ha profilo cognitivo dello studente
- Il loro "AI coach" (ChessGPT) è ancora in waitlist a marzo 2026
- Hanno 2 persone e nessun background pedagogico dichiarato

NeuroScacchi ha già l'infrastruttura (pipeline, attività, LessonViewer, SF, database Lichess) — serve solo re-orientarla verso le aperture con la nuova fonte dati.

---

## Implementazione — Sessione 2026-03-14

### File creati

| File | Ruolo | Note |
|---|---|---|
| `src/engine/openingExplorer.js` | Client Lichess Opening Explorer API | Rate limit: 200ms tra chiamate. Mappa livello → fascia Elo. Formatta dati per prompt. |
| `src/engine/openingEnricher.js` | Passo 2: materiali certificati | Cammina mosse con chessops → Explorer per ogni FEN → SF sulle posizioni chiave del colore che studia |
| `src/engine/openingPipeline.js` | Orchestratore 4 passi | Transizioni deterministiche con mappa FEN→nextMove. Validazione legalità mosse. |
| `src/engine/openingPlanPrompt.js` | Prompt Passo 1 | IA produce: mosse UCI linea principale + stepPlan con tipi di attività |
| `src/engine/openingBuildPrompt.js` | Prompt Passo 3 | Focalizzato su comprensione piano. Esempi espliciti per ogni tipo di step. Cita dati Explorer. |

### File modificati

| File | Modifiche |
|---|---|
| `src/engine/aiService.js` | Aggiunte `planOpening()` e `buildOpeningLesson()` |
| `src/pages/ConsolePage.jsx` | Form rifatto: apertura (testo), colore (radio), livello, varianti, profondità. Rimossa pipeline legacy e toggle. |
| `src/pages/ConsolePage.css` | CSS per radio group bianco/nero |
| `src/components/LessonViewer.jsx` | Prop `orientation` passata al viewer |

### Form Console Coach

Il coach imposta:
- **Apertura** — testo libero (es. "Ruy Lopez", "Siciliana Najdorf, variante Inglese")
- **Colore** — Bianco / Nero (radio button; determina orientation della scacchiera)
- **Livello** — Principiante/Intermedio/Avanzato (mappa su fascia Elo Explorer)
- **Varianti** — testo libero opzionale (es. "Concentrati sulla variante Berlino")
- **Profondità** — numero di mosse da coprire (4–20)
- **Obiettivo didattico** — testo libero opzionale

### Prossimi passi dopo il test

1. Verificare qualità lezioni generate — iterare sui prompt
2. Eventuale ottimizzazione rate limit Explorer per aperture con molte mosse
3. Supporto varianti multiple nella stessa lezione (linea principale + deviazioni)
