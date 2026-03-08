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

### 4.1 Wrapper Stockfish WASM — COMPLETATO

- [x] Installare `stockfish` (nmrugg/Chess.com) via npm — Stockfish 18 lite single-threaded
- [x] Creare `src/v2/engine/stockfishService.js` — Web Worker che carica e comunica con Stockfish via UCI
- [x] API: `evaluate(fen, depth)` → `{ bestMove, eval, pv, depth, mate }`
- [x] API: `analyzeMove(fen, move, depth)` → `{ evalBefore, evalAfter, deltaEval, classification }`
- [x] API: `getThreats(fen, depth)` → top 3 mosse avversario con eval via MultiPV
- [x] Gestione lifecycle: init → ready → analyzing → idle. Timeout 15s su analisi.
- [x] Depth configurabile: default 16
- [x] WASM files in public/stockfish/, auto-copiati via postinstall
- [ ] Test: verificare funzionamento su Chrome, Firefox, Safari mobile

### 4.2 Feedback graduato (Regolazione emotiva — pilastro 4) — COMPLETATO

- [x] Classificazione mossa basata su deltaEval:
  - Ottima: deltaEval < 0.3 (verde #2E7D32)
  - Buona: deltaEval 0.3–1.0 (verde chiaro #558B2F)
  - Imprecisione: deltaEval 1.0–2.5 (arancione #E65100)
  - Errore: deltaEval > 2.5 (rosso #C62828)
- [x] UI: feedback graduato in TrainingSession con label grande (20px) + messaggio + deltaEval numerico
- [x] Mostrare la mossa migliore quando la mossa giocata e' imprecisione/errore
- [x] "Analisi in corso..." mostrato durante elaborazione Stockfish
- [x] Fallback automatico a modalita classica (solutionMoves) se Stockfish non disponibile
- [x] Mosse "buona" accettate come corrette (prima erano rifiutate)
- [ ] Soglia "errore" configurabile dal coach nel profilo (per bilanciare motivazione vs rigore)
- [ ] Collegamento con tolleranza frustrazione: soglia piu permissiva se bassa

### 4.3 Profilassi reale (Memoria di lavoro — pilastro 2) — COMPLETATO

- [x] Sostituire `ProfilassiPrompt` attuale (mosse legali casuali) con analisi Stockfish (getThreats via MultiPV)
- [x] Mostrare 3 mosse avversario ordinate per eval (le vere minacce)
- [x] Valutazione numerica rivelata dopo la risposta (eval badge per ogni minaccia)
- [x] Dopo conferma: evidenzia risposta corretta (verde) e sbagliata (rosso), mostra eval di tutte
- [x] Etichette in italiano: "Cavallo cattura Torre in d5 (scacco)", "Donna in h7 — scacco matto!"
- [x] Mantenere la meccanica: lo studente sceglie la piu pericolosa prima di giocare
- [x] Frequenza controllata dal profilo cognitivo (consapevolezza minacce)
- [x] Fallback automatico a chess.js se Stockfish non disponibile

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

### 4.7 Agente IA per il coach — strumento di lavoro immediato

> L'agente IA per il coach NON e' un wizard o un form. E' un'interfaccia conversazionale
> nella sezione Coach dell'app. Il coach dialoga con l'IA per creare contenuti e percorsi.
> Mentre il coach lavora, l'agente accumula contesto — sara gia "formato" quando evolvera
> per interagire con lo studente (Strato 8).

- [ ] Backend API key (Node.js su Railway/Render) — pre-requisito per qualsiasi chiamata IA
- [ ] Interfaccia chat nella sezione Coach dell'app
- [ ] Generazione posizioni: "Generami 10 posizioni sui finali di torre" → FEN + soluzione + spiegazione
- [ ] Validazione automatica con Stockfish di ogni posizione generata dall'IA
- [ ] Percorsi di studio: "Percorso aperture per 1200 Elo impulsivo" → sequenza ragionata con progressione
- [ ] Analisi PGN: coach incolla un PGN → IA identifica momenti critici → genera posizioni di studio
- [ ] Consulenza sul metodo: "Studente sbaglia finali sotto pressione" → strategie personalizzate
- [ ] Salvataggio posizioni generate direttamente nel database dell'app (positions.json o Firestore)
- [ ] Piattaforma consigliata: Anthropic Claude (ragionamento strutturato, feedback pedagogici)

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

### 7.1 Tipografia ADHD-friendly — COMPLETATO

- [x] Installare e applicare Nunito / Atkinson Hyperlegible come font principale
- [x] Scala tipografica: 17-18px operativo, 14-15px secondario, 20-22px classificazione mossa, 28-32px timer freeze
- [x] Mai sotto 14px per nessun elemento. Mai font decorativi per testo operativo

### 7.2 Colori funzionali esclusivi — COMPLETATO

- [x] Verde (#2E7D32), arancio (#E65100), rosso (#C62828) ESCLUSIVI per classificazione mosse
- [x] Rimuovere usi di verde/rosso per pulsanti generici, stati UI, elementi decorativi
- [x] Colori freeze: indaco #283593 (dominante), #3949AB (timer), #E8EAF6 (testo) — pausa intenzionale, non punizione
- [x] Base: off-white #F8F9FA (light), navy #1C1C2E (dark) — mai bianco puro o nero puro
- [x] Pulsanti e azioni UI: indaco #283593 (coerente con palette freeze)

### 7.3 Freeze visual evoluto — COMPLETATO

- [x] Vignettatura radiale: trasparente al centro (scacchiera), rgba(28,28,46,0.75) ai bordi
- [x] Sfocatura sfondo: blur(7px) — tutto tranne la scacchiera
- [x] Transizioni: 450ms ease-in entrata, 500ms ease-out uscita
- [x] Scacchiera emerge nitida sopra overlay (z-index), titolo e turno visibili
- [x] Timer: barra sottile 5px, colore indaco fisso #3949AB, countdown numerico 32px

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

## STRATO 8 — IA verso lo Studente — DA FARE

> Prerequisito: Strato 6 completato + agente coach (4.7) gia operativo e "formato"
> Riferimento: pagina Metodo, sezioni "Evoluzione — l'agente incontra lo studente"
> Principio: l'agente che ha lavorato con il coach evolve per interagire con lo studente

### 8.1 Livello 1 — IA come analista (post-sessione studente)

- [ ] Chiamata API a fine sessione con dati aggregati (Livello 2 dati)
- [ ] Report testuale: trend, errori ricorrenti, suggerimenti
- [ ] Feedback post-errore contestuali (basati su eval e tempo)
- [ ] Microlezioni contestuali: 2-3 minuti, ancorate all'errore appena commesso
- [ ] L'agente usa il contesto accumulato lavorando col coach (posizioni, percorsi, decisioni pedagogiche)

### 8.2 Modalita pedagogiche per lo studente

- [ ] Scaffolding dialogico: conversazione, non testo statico. L'IA fa domande nell'ordine giusto
- [ ] Apprendimento situato: microlezioni proposte a fine sessione, max 3-5 minuti
- [ ] Analisi repertorio: l'IA identifica dove il repertorio crolla, suggerisce studio mirato

### 8.3 Livello 2 — Agente real-time (futuro)

- [ ] Loop agente con stato persistente durante la sessione
- [ ] Calibra freeze, profilassi, difficolta in tempo reale in base all'andamento
- [ ] Piattaforma consigliata: Groq (latenza ultra-bassa) o OpenAI GPT-4o (function calling robusto)
- [ ] Richiede architettura piu complessa: stato agente, feedback loop, timeout

### 8.4 Validazione contenuti generati

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

### 8 Marzo 2026 (sessione 7)
- Design System applicato all'intera app: Strato 7.1, 7.2, 7.3 completati
- Font: Outfit → Nunito + Atkinson Hyperlegible (Google Fonts)
- Colori esclusivi mosse: verde/arancio/rosso rimossi da tutti i pulsanti/badge/stats, UI usa indaco #283593
- Freeze riscritto: overlay full-screen con vignettatura radiale + blur(7px), scacchiera emerge nitida (z-index), titolo e turno visibili
- Testo primario #212121, secondario #546E7A, card off-white #FAFBFC
- Indicatore turno (Muove il Bianco/Nero) aggiunto sopra la scacchiera
- PDF: html2pdf.js rimosso, sostituito con @react-pdf/renderer (MetodoPDF.jsx)

### 8 Marzo 2026 (sessione 6)
- Agente IA per il coach spostato nello Strato 4 come strumento di lavoro immediato (ex Strato 8)
- Strato 4.7 riscritto: da "upload posizioni semplificato" a interfaccia conversazionale con agente IA
- Strato 8 ridefinito: "IA verso lo studente" — l'agente coach evolve per interagire con lo studente
- Architettura IA a 3 livelli: Livello 0 (agente coach, immediato), Livello 1 (analista studente), Livello 2 (agente real-time)

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
