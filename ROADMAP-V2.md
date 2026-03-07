# NeuroScacchi 2.0 — Roadmap

> Training engine adattivo per scacchi + riabilitazione funzioni esecutive.
> Ultimo aggiornamento: 8 Marzo 2026 (Strato 0 completato)

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

## STRATO 1 — Memoria e Cognizione

### 1.1 Spaced Repetition
- [ ] Salvare risultato per ogni posizione: `{ positionId, correct, attempts, lastSeen, nextReview, interval }`
- [ ] Algoritmo SR semplice (stile Leitner a 5 box):
  - Sbagliata → box 1 (rivedi domani)
  - Corretta → box successivo (intervallo raddoppia: 1gg, 3gg, 7gg, 14gg, 30gg)
- [ ] Il SessionEngine prioritizza le posizioni "in scadenza" (nextReview <= oggi)
- [ ] Indicatore visivo nello storico: "da rivedere", "in fase di apprendimento", "consolidata"

### 1.2 Profilo Cognitivo — Setup
- [ ] Schermata di configurazione profilo (per il coach o per auto-setup):
  - Impulsivita: alta / media / bassa
  - Consapevolezza minacce: alta / media / bassa
  - Metacognizione: alta / media / bassa
  - Tolleranza frustrazione: alta / media / bassa
- [ ] Ogni parametro controlla un comportamento dell'app:
  - Impulsivita → durata freeze (alta=5s, media=3s, bassa=1s)
  - Consapevolezza minacce → frequenza profilassi (alta=mai, media=ogni 3, bassa=sempre)
  - Metacognizione → frequenza domande post-errore (alta=rara, media=ogni 2 errori, bassa=ogni errore)
  - Tolleranza frustrazione → numero hint prima di rivelare la soluzione, messaggi di incoraggiamento
- [ ] Salvataggio in localStorage + Firestore (stesso pattern della v1)

### 1.3 Profilassi (secondo elemento cognitivo)
- [ ] Prima della mossa, chiedere: "Cosa potrebbe fare l'avversario da questa posizione?"
- [ ] Opzioni generate dall'engine: le 2-3 minacce reali dell'avversario
- [ ] Lo studente seleziona quella che ritiene piu pericolosa
- [ ] Non blocca la mossa — e un prompt di riflessione, poi prosegue
- [ ] Frequenza controllata dal profilo cognitivo (non da ogni singola posizione)

### 1.4 Metacognizione (terzo elemento cognitivo)
- [ ] Dopo un errore, mostrare domanda di riflessione:
  - "Ti eri accorto che c'era una minaccia?"
  - "Hai guardato tutta la scacchiera prima di muovere?"
  - "Avevi un piano in mente o hai mosso d'istinto?"
- [ ] Pool di domande, scelta casuale
- [ ] Risposta Si/No — registrata per analytics
- [ ] Frequenza controllata dal profilo cognitivo

### 1.5 Import posizioni da Lichess
- [ ] Scaricare e parsare il Lichess puzzle database (CSV pubblico)
- [ ] Filtrare per tema e rating, convertire in formato interno
- [ ] Tool o script per importare N posizioni per tema
- [ ] Classificazione automatica difficolta (mapping rating Lichess → scala 1-10)

---

## STRATO 2 — Adattivita e Coach

### 2.1 Difficolta adattiva
- [ ] Tracciare il "rating" dello studente per ogni tema (Elo semplificato o percentuale successo)
- [ ] Il SessionEngine sceglie posizioni nella zona ottimale: ~60-70% probabilita di successo
- [ ] Se lo studente azzecca molte di fila → sale. Se sbaglia molte → scende
- [ ] Visualizzazione del proprio livello per tema (grafichetto semplice)

### 2.2 Percorsi tematici
- [ ] Organizzare posizioni per tema: tattica (fork, pin, skewer, discovery...), finali, aperture, difesa
- [ ] Lo studente puo scegliere "Allenamento libero" (mix) o "Focus su [tema]"
- [ ] Tracciamento progressi separato per tema
- [ ] Suggerimento automatico: "Sei debole sui finali di torre — vuoi allenarli?"

### 2.3 Direttive del coach
- [ ] Il coach puo impostare per ogni studente:
  - Tema focus della settimana
  - Difficolta minima/massima
  - Posizioni specifiche da proporre
  - Note testuali ("lavora sulla pazienza")
- [ ] Lo studente vede le direttive attive come messaggio in home
- [ ] Il SessionEngine le usa come vincoli aggiuntivi nella generazione

### 2.4 Dashboard Coach (base)
- [ ] Lista studenti con: ultimo accesso, sessioni completate, livello per tema
- [ ] Grafico semplice: andamento errori nel tempo per studente
- [ ] Possibilita di cambiare il profilo cognitivo dello studente
- [ ] Gestione direttive

### 2.5 Adattamento automatico profilo cognitivo
- [ ] Se lo studente mostra segni di minor impulsivita (tempo medio pre-mossa aumenta), ridurre freeze
- [ ] Se le risposte profilassi migliorano, ridurre la frequenza
- [ ] Se la metacognizione mostra consapevolezza, ridurre le domande
- [ ] Log dei cambiamenti per il coach ("Il freeze e sceso da 5s a 3s — sembra meno impulsivo")

---

## STRATO 3 — Analytics e Completamento

### 3.1 Analytics studente
- [ ] Grafici: successo nel tempo, tempo medio per posizione, errori per tema
- [ ] Insight in linguaggio naturale: "Questa settimana hai migliorato del 15% nelle forchette"
- [ ] Confronto settimana corrente vs precedente
- [ ] Streak e traguardi (motivazione per uso autonomo)

### 3.2 Alert coach
- [ ] Notifica se lo studente non si allena da X giorni
- [ ] Notifica se lo studente e bloccato su un tema
- [ ] Notifica se c'e un miglioramento significativo
- [ ] Riassunto settimanale automatico

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
- Strato 0 completato: schema posizioni, 25 puzzle, TrainingSession, SessionRunner, FreezeOverlay, SessionSummary, HomePage
- Fix 2 posizioni con mosse illegali (pin-01, fork-07)
- Aggiunta validazione automatica posizioni pre-build

### 7 Marzo 2026
- Creazione ROADMAP-V2 e definizione architettura a 4 blocchi
