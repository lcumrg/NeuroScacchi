# NeuroScacchi 2.0 — Roadmap

> Training engine adattivo per scacchi + riabilitazione funzioni esecutive.
> Ultimo aggiornamento: 8 Marzo 2026 (Strati 0-3 implementati)

---

## Principi di design

1. **Il coach da la direzione, l'app costruisce il viaggio** — il coach imposta obiettivi di alto livello, l'engine genera sessioni su misura
2. **Layer cognitivo trasversale** — freeze, profilassi, metacognizione applicati automaticamente in base al profilo dello studente, non scriptati lezione per lezione
3. **Progressione tripla** — spaced repetition + difficolta adattiva + percorsi tematici
4. **Uso primario autonomo** — lo studente si allena da solo, il coach monitora e interviene

---

## Architettura a 4 blocchi

### Blocco 1 — Il Magazzino (Position Database)
Database di posizioni con metadati: tema, difficolta (1-10), mossa/e corrette, origine.
Fonti: coach (upload semplificato), Lichess puzzle DB, engine.

### Blocco 2 — Il Cervello (Session Engine)
Genera sessioni su misura guardando: direttive coach, storico studente (spaced repetition),
livello attuale (difficolta adattiva), bilanciamento tematico.

### Blocco 3 — Lo Scaffolding Cognitivo (Cognitive Layer)
Profilo per studente con parametri: impulsivita, consapevolezza minacce, metacognizione,
tolleranza frustrazione. Si applica automaticamente e si adatta nel tempo.

### Blocco 4 — Il Cruscotto Coach
Dashboard: progressi studenti, direttive attive, alert, gestione posizioni.

---

## STRATO 0 — MVP Funzionante — COMPLETATO

### 0.1 Modello dati posizioni — COMPLETATO
- [x] Schema posizione in `src/v2/engine/positionSchema.js` con validazione
- [x] Set iniziale di 25 posizioni tattiche in `src/v2/data/positions.json`
- Temi: mate, fork, pin, skewer, tactics, opening, defense, sacrifice, endgame, promotion, deflection, trapped_piece

### 0.2 Training Session base — COMPLETATO
- [x] Componente `TrainingSession`: scacchiera + mossa + feedback
- [x] Validazione mossa con chess.js vs solutionMoves
- [x] Feedback visivo: verde (corretta), rosso (sbagliata + "riprova")
- [x] Hint progressivi (HintBox): primo hint dopo 1 errore, secondo dopo 2
- [x] Orientamento automatico in base a chi muove

### 0.3 Sessione come lista di posizioni — COMPLETATO
- [x] Componente `SessionRunner`: sequenza di posizioni
- [x] Barra di progresso (ProgressBar)
- [x] Schermata riepilogo (`SessionSummary`): corrette/sbagliate, errori, tempo medio, precisione %

### 0.4 Freeze — COMPLETATO
- [x] `FreezeOverlay`: overlay con timer visivo (barra che si riempie)
- [x] 3 secondi di default, applicato automaticamente a ogni posizione
- [x] Messaggio "Osserva la posizione..."

### 0.5 Home page v2 — COMPLETATO
- [x] Schermata principale con sessione rapida (10) e completa (25)
- [x] Riepilogo temi disponibili
- [x] Bottone "Cambia versione" (v2) nell'header

---

## STRATO 1 — Memoria e Cognizione — COMPLETATO

### 1.1 Spaced Repetition — COMPLETATO
- [x] Algoritmo Leitner a 5 box in `spacedRepetition.js` (intervalli: 1, 3, 7, 14, 30 giorni)
- [x] `createSRRecord` / `updateSRRecord` con storico completo
- [x] `selectPositionsForSession`: prioritizza scadute → mai viste → prossime
- [x] Stato visivo: "da rivedere" / "in apprendimento" / "consolidata" con colori
- [x] Persistenza in localStorage (`storage.js`)
- [x] Integrato in SessionRunner: ogni risultato aggiorna i record SR

### 1.2 Profilo Cognitivo — COMPLETATO
- [x] `cognitiveLayer.js`: 4 parametri (impulsivita, consapevolezzaMinacce, metacognizione, tolleranzaFrustrazione)
- [x] Ogni parametro con 3 livelli (alta/media/bassa) controlla un comportamento:
  - Impulsivita → freeze (5s/3s/1s)
  - Consapevolezza → profilassi (sempre/ogni 3/mai)
  - Metacognizione → domande (ogni errore/ogni 2/ogni 4)
  - Frustrazione → hint max (2/3/illimitati)
- [x] `ProfilePage.jsx`: UI di configurazione con feedback live degli effetti
- [x] Salvataggio in localStorage

### 1.3 Profilassi — COMPLETATO
- [x] `ProfilassiPrompt.jsx`: analizza la posizione con chess.js, genera 3 minacce dell'avversario
- [x] Lo studente sceglie la piu pericolosa prima di vedere la scacchiera
- [x] Frequenza controllata dal profilo cognitivo (`shouldShowProfilassi`)
- [x] Integrato nel flusso TrainingSession: profilassi → freeze → gioco

### 1.4 Metacognizione — COMPLETATO
- [x] `MetaPrompt.jsx`: domanda Si/No dopo errore
- [x] Pool di 7 domande in `cognitiveLayer.js`, scelta casuale
- [x] Frequenza controllata dal profilo cognitivo (`shouldShowMetacognition`)
- [x] Integrato nel flusso TrainingSession

### 1.5 Import posizioni da Lichess — COMPLETATO
- [x] Script `scripts/import-lichess-puzzles.cjs`
- [x] Parsing CSV Lichess con applicazione mossa di setup
- [x] Filtri: tema, rating min/max, conteggio
- [x] Mapping automatico temi Lichess → temi interni
- [x] Mapping rating → difficolta 1-10

---

## STRATO 2 — Adattivita e Coach — PARZIALMENTE COMPLETATO

### 2.1 Difficolta adattiva — COMPLETATO
- [x] `adaptiveDifficulty.js`: calcola livello studente per tema (media pesata dei risultati)
- [x] Range ottimale: livello +/- 1, con espansione automatica se poche posizioni
- [x] Integrato in `sessionEngine.js`: filtra posizioni per zona ottimale

### 2.2 Percorsi tematici — COMPLETATO
- [x] Posizioni organizzate per tema (12 temi)
- [x] HomePage: click su tema → sessione focalizzata
- [x] "Allenamento smart" (mix) o "Focus su [tema]"
- [x] Tracciamento progressi per tema in StatsPage con barre percentuali

### 2.3 Session Engine — COMPLETATO
- [x] `sessionEngine.js`: genera sessioni combinando SR + difficolta adattiva + tema + direttive
- [x] `generateSession({ count, theme, directives })` — API unica per tutte le modalita
- [x] Supporto direttive coach (tema, min/max difficolta, posizioni specifiche)

### 2.4 Direttive del coach
- [ ] UI per impostare direttive per studente
- [ ] Lo studente vede le direttive attive in home
- [ ] Richiede sistema multi-utente (coach + studenti su Firebase)

### 2.5 Dashboard Coach
- [ ] Lista studenti con progressi
- [ ] Gestione direttive e profili cognitivi
- [ ] Richiede sistema multi-utente

### 2.6 Adattamento automatico profilo cognitivo
- [ ] Analisi automatica dei dati per regolare il profilo
- [ ] Log dei cambiamenti per il coach

---

## STRATO 3 — Analytics e Completamento — PARZIALMENTE COMPLETATO

### 3.1 Analytics studente — COMPLETATO
- [x] `StatsPage.jsx`: panoramica con barra visiva (consolidate/in corso/da rivedere/nuove)
- [x] Progresso per tema con barre percentuali
- [x] Storico ultime 5 sessioni
- [x] Insight in linguaggio naturale: tema forte/debole, confronto sessioni, conteggio consolidate
- [x] Accessibile da HomePage via bottone "Statistiche"

### 3.2 Alert coach
- [ ] Notifica se lo studente non si allena da X giorni
- [ ] Notifica se lo studente e bloccato su un tema
- [ ] Richiede sistema multi-utente

### 3.3 Upload posizioni semplificato (coach)
- [ ] Scacchiera interattiva: posiziona i pezzi, indica la mossa giusta
- [ ] Tag tema e difficolta con dropdown
- [ ] Opzionale: aggiungi 1-2 hint testuali
- [ ] Nessun wizard complesso — salva in 30 secondi

### 3.4 Modalita "esame"
- [ ] Sessione senza nessun supporto cognitivo (no freeze, no profilassi, no hint)
- [ ] Confronto risultati con sessioni supportate ("Con gli aiuti: 80%. Da solo: 65%")
- [ ] Utile per misurare l'interiorizzazione nel tempo

### 3.5 Export dati
- [ ] Export CSV delle sessioni per analisi esterna
- [ ] Export PDF del report studente per i genitori/scuola

---

## Note tecniche

### Stack
- React 18 + Vite (come v1)
- chess.js + react-chessboard (condivisi con v1)
- Firebase Auth (condiviso con v1)
- Firestore per dati v2 (collezioni separate: `v2_positions`, `v2_sessions`, `v2_profiles`)
- Nessun backend custom — tutto client-side + Firestore + Cloud Functions per aggregazioni

### Struttura codice
```
src/v2/
  App.jsx                 # Entry point v2
  pages/
    HomePage.jsx          # Home con "Allenati" e stato
    TrainingPage.jsx      # Sessione di allenamento
    ProfilePage.jsx       # Profilo cognitivo
    StatsPage.jsx         # Analytics studente
    CoachPage.jsx         # Dashboard coach
  components/
    Chessboard.jsx        # Wrapper react-chessboard
    FreezeOverlay.jsx     # Timer visivo freeze
    ProfilassiPrompt.jsx  # Domanda profilassi
    MetaPrompt.jsx        # Domanda metacognitiva
    HintBox.jsx           # Hint progressivi
    ProgressBar.jsx       # Barra avanzamento sessione
    SessionSummary.jsx    # Riepilogo fine sessione
  engine/
    positionSchema.js     # Schema e validazione posizioni
    sessionEngine.js      # Genera sessioni su misura
    spacedRepetition.js   # Algoritmo SR
    cognitiveLayer.js     # Applica scaffolding cognitivo
    adaptiveDifficulty.js # Calibra difficolta
  data/
    positions.json        # Posizioni iniziali
  utils/
    storage.js            # localStorage + Firestore per v2
```

### Convenzioni
- Un file = un concetto. Niente file da 800 righe come l'attuale App.jsx
- Nomi in inglese per il codice, italiano per i testi UI
- Test manuali su ogni strato prima di passare al successivo

---

## Infrastruttura e Qualita

### Selettore versione v1/v2
- [x] `VersionSelector.jsx` — schermata iniziale con due card (Classic / 2.0)
- [x] Scelta salvata in localStorage, si presenta solo la prima volta
- [x] `resetVersionChoice()` per tornare al selettore
- [x] Bottone "Cambia versione" nell'header di entrambe le versioni (v1: badge "v1", v2: badge "v2")

### Struttura codice condivisa
- [x] `src/shared/` — firebase.js e AuthContext condivisi tra v1 e v2
- [x] `src/v1/` — tutto il codice Classic, spostato senza modifiche funzionali
- [x] `src/v2/` — codice 2.0, parte da zero
- [x] `src/App.jsx` — router che smista tra v1 e v2

### Timestamp build
- [x] `__BUILD_TIME__` iniettato da Vite al build (vite.config.js `define`)
- [x] Visibile nell'header v1 e nel footer v2
- [x] Formato italiano con data e ora (timezone Europe/Rome)

### Validazione automatica posizioni
- [x] `scripts/validate-positions.cjs` — script di validazione pre-build
- [x] Verifica: FEN valido, mosse soluzione legali (chess.js), ID univoci, tema ammesso, difficolta 1-10, hint corretti
- [x] Integrato in `npm run build` e `npm run dev` — se fallisce, il build si blocca
- [x] Messaggio di errore dettagliato: quale posizione, quale mossa, mosse legali disponibili
- [x] Comando standalone: `npm run validate`

### Deploy automatico
- [x] GitHub Action `auto-merge-claude.yml`: push su `claude/*` → merge automatico in main
- [x] Netlify auto-deploy da main

---

## Changelog

### 8 Marzo 2026
- Ristrutturazione app in v1/v2 con selettore versione
- **Strato 0**: schema posizioni, 25 puzzle, TrainingSession, SessionRunner, FreezeOverlay, SessionSummary, HomePage
- Fix 2 posizioni con mosse illegali + validazione automatica pre-build
- **Strato 1**: spaced repetition (Leitner 5 box), profilo cognitivo (4 parametri × 3 livelli), profilassi (analisi minacce avversario), metacognizione (domande post-errore), script import Lichess
- **Strato 2**: difficolta adattiva, percorsi tematici (sessioni per tema), session engine unificato con supporto direttive coach
- **Strato 3**: pagina statistiche con panoramica, insight, progresso per tema, storico sessioni

### 7 Marzo 2026
- Creazione ROADMAP-V2 e definizione architettura a 4 blocchi
