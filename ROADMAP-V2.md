# NeuroScacchi 2.0 — Roadmap

> Training engine adattivo per scacchi + riabilitazione funzioni esecutive.
> Ultimo aggiornamento: 8 Marzo 2026 (Strati 0-3 implementati, Strati 4-8 pianificati)

---

## Principi di design

1. **Il coach da la direzione, l'app costruisce il viaggio** — il coach imposta obiettivi di alto livello, l'engine genera sessioni su misura
2. **Layer cognitivo trasversale** — freeze, profilassi, metacognizione applicati automaticamente in base al profilo dello studente, non scriptati lezione per lezione
3. **Progressione tripla** — spaced repetition + difficolta adattiva + percorsi tematici
4. **Uso primario autonomo** — lo studente si allena da solo, il coach monitora e interviene

---

## Architettura a 5 blocchi

### Blocco 1 — Il Magazzino (Position Database)
Database di posizioni con metadati: tema, difficolta, mossa/e corrette, origine.
Fonti: coach (upload semplificato), Lichess puzzle DB, partite dello studente.
Con Stockfish: qualsiasi FEN funziona, la soluzione e' calcolata dal motore.

### Blocco 2 — Il Motore (Stockfish WASM)
Cuore dell'app. Analizza posizioni in tempo reale nel browser via Web Worker.
Fornisce: valutazione, mossa migliore, minacce reali, classificazione mosse, difficolta calcolata.
Abilita: feedback graduato, profilassi reale, metacognizione contestuale, modalita partita.

### Blocco 3 — Il Cervello (Session Engine)
Genera sessioni su misura guardando: direttive coach, storico studente (spaced repetition),
livello attuale (difficolta adattiva), bilanciamento tematico.

### Blocco 4 — Lo Scaffolding Cognitivo (Cognitive Layer)
Profilo per studente con 4 parametri: impulsivita, consapevolezza minacce, metacognizione,
tolleranza frustrazione. Ogni parametro fondato su un pilastro scientifico (vedi pagina Metodo).
Si applica automaticamente e si adatta nel tempo.

### Blocco 5 — Il Cruscotto Coach
Dashboard: progressi studenti, direttive attive, alert, gestione posizioni, export dati.

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

## STRATO 2 — Adattivita — COMPLETATO

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

> **Nota:** le feature coach (direttive, dashboard, adattamento automatico) previste qui
> sono state ripianificate nello Strato 6 come parte del piano Stockfish.

---

## STRATO 3 — Analytics — COMPLETATO

### 3.1 Analytics studente — COMPLETATO
- [x] `StatsPage.jsx`: panoramica con barra visiva (consolidate/in corso/da rivedere/nuove)
- [x] Progresso per tema con barre percentuali
- [x] Storico ultime 5 sessioni
- [x] Insight in linguaggio naturale: tema forte/debole, confronto sessioni, conteggio consolidate
- [x] Accessibile da HomePage via bottone "Statistiche"

> **Nota:** alert coach, upload posizioni, modalita esame ed export dati previsti qui
> sono stati ripianificati negli Strati 4-6 come parte del piano Stockfish.

---

## Note tecniche

### Stack
- React 18 + Vite (come v1)
- chess.js + react-chessboard (condivisi con v1)
- **Stockfish WASM** — motore scacchistico nel browser via Web Worker (Strato 4+)
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
    stockfishWorker.js  # Web Worker Stockfish WASM (Strato 4)
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

## DECISIONI ARCHITETTURALI — Prese l'8 Marzo 2026

> Le 4 questioni aperte sono state discusse e risolte.

1. **Si integra Stockfish?** → **SI.** Diventa il cuore dell'app. Stockfish WASM nel browser via Web Worker.
2. **Si mantengono i puzzle classici?** → **SI.** Convivono come modalita "tattiche mirate". Stockfish li migliora (feedback graduato, validazione) ma non li sostituisce.
3. **Si aggiunge la modalita partita con scaffolding?** → **SI**, ma come fase successiva. Prima Stockfish nei puzzle, poi partite.
4. **Priorita?** → **Direttamente Stockfish.** Niente passaggio intermedio Lichess API (limiti: 1 req/s, solo posizioni nel DB, richiede rete). Stockfish risolve tutto offline.

---

## STRATO 4 — Stockfish Core — DA FARE

> Riferimento: pagina Metodo, sezioni 1-5 (fondamenti scientifici)
> Principio guida: ogni feature deve servire almeno uno dei 5 pilastri del Metodo
> (inibizione, memoria di lavoro, metacognizione, regolazione emotiva, consolidamento)

### 4.1 Wrapper Stockfish WASM

- [ ] Installare `stockfish.wasm` (o `lila-stockfish-web`) via npm
- [ ] Creare `src/v2/engine/stockfishWorker.js` — Web Worker che carica e comunica con Stockfish via UCI
- [ ] API: `evaluate(fen, depth)` → `{ bestMove, eval, pv, depth }`
- [ ] API: `analyzeMove(fen, move, depth)` → `{ evalBefore, evalAfter, deltaEval, classification }`
- [ ] API: `getThreats(fen, depth)` → top 3 mosse avversario con eval (per profilassi reale)
- [ ] Gestione lifecycle: init → ready → analyzing → idle. Timeout su analisi lunghe.
- [ ] Depth configurabile: default 16, riducibile a 12 su dispositivi lenti
- [ ] Test: verificare funzionamento su Chrome, Firefox, Safari mobile

### 4.2 Feedback graduato (Regolazione emotiva — pilastro 4)

- [ ] Classificazione mossa basata su deltaEval:
  - Ottima: deltaEval < 0.3 (verde)
  - Buona: deltaEval 0.3–1.0 (blu)
  - Imprecisione: deltaEval 1.0–2.5 (arancione)
  - Errore: deltaEval > 2.5 (rosso)
- [ ] UI: sostituire il feedback binario in `TrainingSession` con barra graduata
- [ ] Mostrare la mossa migliore quando la mossa giocata e' imprecisione/errore
- [ ] Soglia "errore" configurabile dal coach nel profilo (per bilanciare motivazione vs rigore)
- [ ] Collegamento con tolleranza frustrazione: soglia piu permissiva se bassa

### 4.3 Profilassi reale (Memoria di lavoro — pilastro 2)

- [ ] Sostituire `ProfilassiPrompt` attuale (mosse legali casuali) con analisi Stockfish
- [ ] Mostrare 3 mosse avversario ordinate per eval (le vere minacce)
- [ ] Aggiungere valutazione numerica: "Cd5 ti costa la qualita (-3.2)"
- [ ] Mantenere la meccanica: lo studente sceglie la piu pericolosa prima di giocare
- [ ] Frequenza controllata dal profilo cognitivo (consapevolezza minacce)

### 4.4 Difficolta calcolata

- [ ] Per ogni posizione: analizzare a depth crescenti (8, 12, 16, 20)
- [ ] La depth a cui Stockfish trova la mossa migliore = indicatore di difficolta
- [ ] Mappare depth → scala 1-10 (depth 8 = facile, depth 20 = molto difficile)
- [ ] Aggiornare `adaptiveDifficulty.js` per usare la difficolta calcolata
- [ ] Mantenere retrocompatibilita con difficolta manuale per posizioni curate dal coach

### 4.5 Metacognizione contestuale (pilastro 3)

- [ ] Dopo errore, generare domanda basata su dati reali del motore:
  - "Hai mosso in 2 secondi. Il motore dice che perdi un pezzo. Cosa non hai visto?"
  - "Nelle ultime 3 posizioni hai perso 5 punti di eval. Stai andando troppo veloce?"
- [ ] Pool di template con placeholder: `{deltaEval}`, `{tempoRisposta}`, `{minaccia}`
- [ ] Frequenza controllata dal profilo cognitivo (metacognizione)

### 4.6 Validazione automatica posizioni esistenti

- [ ] Script che ri-analizza tutte le posizioni in `positions.json` con Stockfish
- [ ] Segnala soluzioni sub-ottimali o sbagliate
- [ ] Propone la mossa migliore del motore come alternativa/sostituzione
- [ ] Ricalcola difficolta per ogni posizione

### 4.7 Upload posizioni semplificato (coach)

- [ ] Scacchiera interattiva: posiziona i pezzi o incolla FEN, indica la mossa giusta
- [ ] Stockfish valida automaticamente la mossa e calcola la difficolta
- [ ] Tag tema con dropdown, hint testuali opzionali
- [ ] Nessun wizard complesso — salva in 30 secondi
- [ ] Con Stockfish: il coach puo inserire qualsiasi FEN senza pre-verificare la soluzione

### 4.8 Architettura dati Firebase + logging per-mossa

- [ ] Struttura Firebase: `users/profile`, `sessions/metadata`, `sessions/moves`, `sessions/summary`, `positions/leitner`, `positions/performance`
- [ ] Livello 1 — per-mossa: timestamp freeze start/end, mossa giocata, FEN, eval prima/dopo, deltaEval, classificazione, mossa migliore Stockfish
- [ ] Livello 1 — comportamentali: profilassi richiesta/risposta, metacognizione richiesta/risposta, testo libero metacognizione
- [ ] Livello 2 — per-sessione: distribuzione qualita, deltaEval medio, errori consecutivi, curva tempo per mossa, mosse veloci, compliance freeze/profilassi, trend intra-sessione
- [ ] Livello 2 — contestuali: ora del giorno, tipo sessione, temi, profilo cognitivo attivo
- [ ] Principio: raccogliere costa quasi niente (Firebase gratuito fino 1GB), non raccogliere costa carissimo

---

## STRATO 5 — Freeze Evoluto e Partite — DA FARE

> Prerequisito: Strato 4 completato
> Riferimento: pagina Metodo, sezione 1 (inibizione) e sezione "Puzzle vs Partite"

### 5.1 Freeze per ogni mossa (Inibizione — pilastro 1)

- [ ] Estendere FreezeOverlay per attivarsi prima di ogni mossa (non solo a inizio posizione)
- [ ] Calibrazione dal profilo: freeze lungo (3-5s) a inizio, freeze breve (1-2s) sulle mosse successive
- [ ] Nessun freeze se impulsivita = bassa
- [ ] Contrastare il "decadimento della vigilanza": il freeze puo allungarsi se il giocatore accelera troppo (deltaEval in peggioramento + tempo risposta in calo)
- [ ] Toggle on/off per modalita puzzle classici (dove il freeze a inizio basta)

### 5.2 Modalita partita con scaffolding

- [ ] Nuova pagina `GamePage.jsx`: partita completa contro Stockfish
- [ ] Stockfish come avversario con livello regolabile (depth/elo limitato)
- [ ] Scaffolding cognitivo attivo su ogni mossa:
  - Freeze (pilastro 1) — prima di ogni mossa
  - Profilassi (pilastro 2) — "Cosa minaccia l'avversario?" con eval reale
  - Metacognizione (pilastro 3) — dopo imprecisioni/errori
  - Feedback graduato (pilastro 4) — dopo ogni mossa
- [ ] Barra eval live (opzionale, disattivabile) per visualizzare l'andamento
- [ ] Riepilogo partita con analisi completa: errori, imprecisioni, tempo medio per mossa
- [ ] Confronto con partite precedenti (consolidamento — pilastro 5)

### 5.3 Spaced repetition per partite (Consolidamento — pilastro 5)

- [ ] Salvare le posizioni critiche della partita (dove lo studente ha sbagliato)
- [ ] Inserirle automaticamente nel sistema Leitner come "posizioni da rivedere"
- [ ] Lo studente rivede le proprie posizioni sbagliate come puzzle tattici
- [ ] Ciclo virtuoso: partita → errori → puzzle mirati → partita migliore

---

## STRATO 6 — Test Duale e Validazione — DA FARE

> Prerequisito: Strati 4-5 funzionanti
> Riferimento: pagina Metodo, sezione "Test duale padre-figlio"

### 6.1 Protocollo di osservazione

- [ ] Strumento per annotare reazioni qualitative durante le sessioni
- [ ] Domande chiave: lo scaffolding e' percepito come aiuto o interferenza?
- [ ] Log automatico: quando lo studente "forza" il freeze (impazienza), quando salta la profilassi
- [ ] Confronto parametri tra i due soggetti (padre e figlio)
- [ ] Osservare variazioni nella stessa persona in base a stanchezza/momento della giornata

### 6.2 Adattamento automatico del profilo

- [ ] Analisi automatica dei dati per suggerire aggiustamenti al profilo cognitivo
- [ ] Indicatori: tempo medio risposta in calo → impulsivita in aumento → suggerire freeze piu lungo
- [ ] Indicatori: errori profilassi in calo → consapevolezza in miglioramento → ridurre frequenza
- [ ] Il coach approva o rifiuta i suggerimenti (nessun cambiamento automatico senza supervisione)
- [ ] Log dei cambiamenti per tracciare l'evoluzione nel tempo

### 6.3 Modalita esame

- [ ] Sessione senza nessun supporto cognitivo (no freeze, no profilassi, no hint, no feedback graduato)
- [ ] Confronto risultati: "Con gli aiuti: 80%. Da solo: 65%"
- [ ] Misura dell'interiorizzazione: quanto lo scaffolding e' stato assorbito?
- [ ] Report per il coach con trend nel tempo

### 6.4 Dashboard coach

- [ ] Lista studenti con progressi
- [ ] Gestione direttive e profili cognitivi per ogni studente
- [ ] UI direttive: il coach imposta tema, difficolta, posizioni specifiche per studente
- [ ] Lo studente vede le direttive attive nella home
- [ ] Alert: studente non si allena da X giorni, bloccato su un tema, scaffolding percepito come interferenza
- [ ] Richiede sistema multi-utente (coach + studenti su Firebase)

### 6.5 Export dati

- [ ] Export CSV delle sessioni per analisi esterna
- [ ] Export PDF del report studente per genitori/scuola
- [ ] Report partite con analisi Stockfish (errori, imprecisioni, trend)

---

## STRATO 7 — Design System — DA FARE

> Prerequisito: Strati 4-5 (il design si applica ai componenti evoluti)
> Riferimento: pagina Metodo, sezioni "Design System — Ergonomia Cognitiva"
> Principio: ogni elemento visivo che non ha una funzione cognitiva precisa non deve esistere

### 7.1 Tipografia ADHD-friendly

- [ ] Installare e applicare Nunito / Atkinson Hyperlegible come font principale
- [ ] Scala tipografica: 17-18px operativo, 14-15px secondario, 20-22px classificazione mossa, 28-32px timer freeze
- [ ] Mai sotto 14px per nessun elemento. Mai font decorativi per testo operativo

### 7.2 Colori funzionali esclusivi

- [ ] Verde (#2E7D32), arancio (#E65100), rosso (#C62828) ESCLUSIVI per classificazione mosse
- [ ] Rimuovere usi di verde/rosso per pulsanti generici, stati UI, elementi decorativi
- [ ] Colori freeze: indaco #283593 (dominante), #3949AB (timer), #E8EAF6 (testo) — pausa intenzionale, non punizione
- [ ] Base: off-white #F8F9FA (light), navy #1C1C2E (dark) — mai bianco puro o nero puro

### 7.3 Freeze visual evoluto

- [ ] Vignettatura radiale: trasparente al centro (scacchiera), rgba(28,28,46,0.75) ai bordi
- [ ] Sfocatura sfondo: blur(6-8px) moderata
- [ ] Transizioni: 400-500ms ease-in entrata, 400-600ms ease-out uscita
- [ ] Scacchiera emerge nitida da sfondo gia sfocato — attivazione PRIMA della posizione
- [ ] Timer: barra sottile 4-6px, colore indaco fisso, MAI cambia colore

### 7.4 Tema chiaro / scuro

- [ ] Sfondo light: #F8F9FA, superfici #FFFFFF + ombra, bordi #E0E0E0
- [ ] Sfondo dark: #1C1C2E, superfici #252540, bordi #37374F
- [ ] Contrasto 4.5:1 - 7:1 in entrambi i temi
- [ ] Toggle utente, preferenza salvata in localStorage

### 7.5 Layout single-action

- [ ] Un'unica azione principale per schermata, visivamente dominante
- [ ] Scacchiera 60-70% verticale, mai spostata da popup/notifiche
- [ ] Statistiche accessibili ma non visibili durante sessione attiva
- [ ] Animazioni solo per eventi cognitivi (classificazione, fine freeze). Zero decorative

---

## STRATO 8 — Integrazione IA — DA FARE

> Prerequisito: Strato 6 completato (validazione umana prima, amplificazione IA dopo)
> Riferimento: pagina Metodo, sezioni "Coach IA" e "Architettura IA"
> Principio: l'IA amplifica cio che funziona, ma amplifica anche cio che non funziona

### 8.1 Backend per API key (pre-requisito)

- [ ] Server Node.js (Railway o Render, ~$7-20/mese)
- [ ] Gestisce tutte le chiamate IA lato server — API key mai nel client
- [ ] Rate limiting e autenticazione Firebase token
- [ ] Obbligatorio prima di aprire l'app ad altri utenti

### 8.2 Livello 1 — IA come analista (post-sessione)

- [ ] Chiamata API a fine sessione con dati aggregati (Livello 2)
- [ ] Report testuale: trend, errori ricorrenti, suggerimenti
- [ ] Feedback post-errore contestuali (basati su eval e tempo)
- [ ] Microlezioni contestuali: 2-3 minuti, ancorate all'errore appena commesso
- [ ] Piattaforma consigliata: Anthropic Claude (ragionamento strutturato, feedback pedagogici calibrati)
- [ ] Alternativa per task semplici: Google Gemini Flash (economico, integrato Firebase)

### 8.3 Livello 1 — Modalita pedagogiche

- [ ] Scaffolding dialogico: conversazione, non testo statico. L'IA fa domande nell'ordine giusto
- [ ] Apprendimento situato: microlezioni proposte a fine sessione, max 3-5 minuti
- [ ] Analisi repertorio: l'IA identifica dove il repertorio crolla, suggerisce studio mirato

### 8.4 Livello 2 — Agente real-time (futuro)

- [ ] Loop agente con stato persistente durante la sessione
- [ ] Calibra freeze, profilassi, difficolta in tempo reale in base all'andamento
- [ ] Piattaforma consigliata: Groq (latenza ultra-bassa) o OpenAI GPT-4o (function calling robusto)
- [ ] Richiede architettura piu complessa: stato agente, feedback loop, timeout

### 8.5 Validazione contenuti generati

- [ ] Stockfish verifica correttezza delle posizioni generate/suggerite dall'IA
- [ ] Consulente umano (maestro di scacchi) revisiona periodicamente le spiegazioni
- [ ] L'IA non produce contenuti — il maestro li valida

### 8.6 Stima costi

- Beta (2 utenti, ~25 sessioni/mese): ~$2/mese — trascurabile
- 50 utenti: ~$45/mese — sostenibile con abbonamento minimo
- 500 utenti: ~$450/mese — richiede ottimizzazione (modelli diversi per task)
- 5.000 utenti: ~$4.500/mese — architettura ibrida (caching, routing intelligente)

---

## Changelog

### 8 Marzo 2026 (sessione 5)
- Pagina Metodo ristrutturata in moduli (metodo/ subfolder): fondamenti, implementazione, coach IA, design system, architettura dati, roadmap, evoluzione
- Integrati 3 documenti supplementari: Coach IA (2 livelli, piattaforme, costi), Design System (tipografia, palette, freeze visual, checklist), Architettura Dati (3 livelli raccolta, Firebase, privacy)
- Roadmap estesa: Strato 7 (Design System ADHD-friendly), Strato 8 (Integrazione IA a 2 livelli)
- Strato 4 esteso: aggiunta sezione 4.8 (architettura dati Firebase + logging per-mossa)

### 8 Marzo 2026 (sessione 4)
- Decisioni architetturali prese: SI a Stockfish, SI a puzzle + partite, direttamente Stockfish senza passaggio Lichess
- Pagina Metodo ristrutturata con 5 fondamenti scientifici (inibizione, memoria di lavoro, metacognizione, regolazione emotiva, consolidamento)
- Roadmap estesa: Strato 4 (Stockfish Core), Strato 5 (Freeze evoluto + Partite), Strato 6 (Test duale + Validazione)
- Ogni feature mappata al pilastro scientifico di riferimento

### 8 Marzo 2026 (sessioni 1-3)
- Ristrutturazione app in v1/v2 con selettore versione
- **Strato 0**: schema posizioni, 25 puzzle, TrainingSession, SessionRunner, FreezeOverlay, SessionSummary, HomePage
- Fix 2 posizioni con mosse illegali + validazione automatica pre-build
- **Strato 1**: spaced repetition (Leitner 5 box), profilo cognitivo (4 parametri × 3 livelli), profilassi (analisi minacce avversario), metacognizione (domande post-errore), script import Lichess
- **Strato 2**: difficolta adattiva, percorsi tematici (sessioni per tema), session engine unificato con supporto direttive coach
- **Strato 3**: pagina statistiche con panoramica, insight, progresso per tema, storico sessioni

### 7 Marzo 2026
- Creazione ROADMAP-V2 e definizione architettura a 4 blocchi
