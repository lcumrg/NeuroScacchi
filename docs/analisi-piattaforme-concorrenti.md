# Analisi Piattaforme Concorrenti

*NeuroScacchi — Ricerca competitiva | Marzo 2026 — aggiornato 2026-03-14*

---

## Chessdriller

### Cos'è

App open-source per allenamento aperture via **spaced repetition**. Alternativa gratuita a Chessable. Richiede account Lichess (i repertori sono salvati come studi Lichess). 491 commit, 52 stelle su GitHub.

Repository: https://github.com/gtim/chessdriller

### Integrazione Lichess — 3 endpoint

| Endpoint | Scopo |
|---|---|
| `GET /api/study/by/{username}` | Lista studi utente (metadata NDJSON) |
| `GET /api/study/{id}.pgn` | Scarica PGN completo dello studio |
| `HEAD /api/study/{id}.pgn` | Controlla `last-modified` per sync |

Scope OAuth: solo `study:read`. Non vede partite, rating, puzzle, niente altro.

**Flusso tecnico:** scarica PGN → parsa albero mosse con `cm-pgn` → denormalizza tutto in SQLite locale → durante il drill non chiama più Lichess. Le mosse vengono normalizzate rimuovendo en passant, halfmove e fullmove dal FEN, così le trasposizioni convergono allo stesso nodo.

**Sync:** ogni 5 minuti controlla `last-modified` via HEAD. Se lo studio è incluso nel repertorio e cambia su Lichess, crea un record di staging che l'utente deve approvare manualmente. Nota nel codice: Lichess non aggiorna il timestamp per studi con sync disabilitata (bug noto su lila).

**Color guessing:** algoritmo che inferisce automaticamente se uno studio è per il bianco o il nero, contando quante "split" (posizioni con più mosse proprie) ci sono in ciascuna interpretazione.

### Integrazione Stockfish — completamente assente

Zero. Nessun file, nessuna dipendenza, nessun commento. La piattaforma si fida ciecamente del PGN come unica fonte di verità: se una mossa è nel tuo studio, è "corretta". Nessuna validazione, nessuna analisi.

### Come funziona davvero

È **Anki per le mosse di apertura**. L'unica logica intelligente è lo scheduler SM-2:

- **Learning phase:** 0 min → 10 min → 1h → 8h → promozione a review
- **Review phase:** intervallo iniziale 1 giorno × ease factor (default 2.5), max 100 giorni
- **Risposta sbagliata:** reset a step 0, ease −0.2 (min 1.3)

Nessuna spiegazione, nessuna analisi, nessun "perché".

### Issue aperte — cosa chiedono gli utenti

| Issue | Richiesta |
|---|---|
| #120 | Algoritmo SR più sofisticato |
| #37 | Ricerca per posizione + annotazioni in linguaggio naturale |
| #36 | Importazione annotazioni da Wikibooks |
| #35 | "Demo line" — mostrare varianti senza allenarle |
| #34 | Struttura a cartelle per organizzare repertori |
| #33 | Input rapido mosse (smart one-click) |
| #19 | Escludere mosse candidate dal drill |
| #136 | Bug promozione pedone |

**Cosa dicono le issue:** gli utenti vogliono capire le posizioni (annotazioni, ricerca, spiegazioni) ma la piattaforma non lo prevede by design. È un drill puro e gli utenti sentono la mancanza della comprensione.

---

## ChessMind AI

### Cos'è

App mobile (iOS/Android) fondata dal GM Mauricio Flores (autore di "Chess Structures"). Piattaforma di allenamento con IA — non un generatore di lezioni.

### Funzionalità principali

- 56 corsi di aperture scritti dal GM fondatore (contenuti pre-scritti, non generati)
- Puzzle posizionali e di finali
- "Evaluation Flash", training di notazione, board vision
- **ChessGPT:** l'utente scrive i propri ragionamenti e riceve feedback testuale dall'IA
- Analisi delle partite

### Come usa l'IA

L'IA è usata principalmente per il feedback testuale (ChessGPT) e come wrapper attorno a contenuti curati dal GM. Non genera lezioni da zero — i corsi sono pre-scritti.

**Target:** Scacchisti generici adulti. Nessun riferimento a bambini, profili cognitivi, ADHD, autismo o bisogni educativi speciali.

**Modello:** Freemium — $6.99/mese, $59.99/anno, $139.99 lifetime.

---

## Chessline.io

### Cos'è

Piattaforma web/mobile per la generazione automatica di repertori di aperture personalizzati. Sviluppata in Svizzera (backing accademico: Hasler Foundation, VentureKick). Usata in 60+ paesi.

### Funzionalità principali

- Generazione istantanea di repertori calibrati sul livello Elo
- Analisi dati da milioni di partite reali + validazione engine
- Preparazione specifica per avversario (analizza le abitudini di un singolo giocatore)
- AI coach che spiega qualsiasi posizione in linguaggio naturale
- Move trainer adattivo con spaced repetition implicita

### Come usa l'IA

IA per personalizzazione delle raccomandazioni in base a Elo, copertura desiderata e stile. Il sistema bilancia statistiche di partita reale + engine analysis.

**Target:** Scacchisti da 500 a 2000+ Elo, adulti o adolescenti autonomi. Nessun riferimento a bambini giovani, profili cognitivi speciali, o mediazione di un coach umano.

**Modello:** Piano gratuito + CHF 4.99/mese. Tariffe scontate per scuole su richiesta.

---

## Chessdriller — Opportunità di integrazione Lichess non sfruttate

Analisi delle API Lichess pubbliche che chessdriller non usa e che potrebbero arricchire NeuroScacchi:

### API non usate da chessdriller

| Endpoint Lichess | Cosa offre | Uso possibile in NeuroScacchi |
|---|---|---|
| `GET /api/opening-explorer` | Database di milioni di partite reali filtrabili per Elo, variante, anno | Statistiche "questa mossa viene giocata dal X% dei giocatori al tuo livello" |
| `GET /api/puzzle/next` | Puzzle adattivi Lichess in base al rating | Alternativa/complemento al nostro DB Firestore |
| `GET /api/puzzle/{id}` | Singolo puzzle con tema e mosse | Recupero puzzle specifici per tema |
| `GET /api/user/{username}/perf/{perfType}` | Statistiche di performance per variante (blitz, rapid, aperture specifiche) | Calibrare le lezioni sulle aperture realmente giocate dallo studente |
| `GET /api/user/{username}/rating-history` | Storico rating | Tracciare progressi nel tempo |
| `GET /api/games/user/{username}` | Partite reali dell'utente in PGN | Analizzare dove lo studente esce dalla teoria e perché |
| `GET /explorer/lichess` | Opening explorer database Lichess aperto | Frequenza mosse, win rate per colore e livello Elo |
| `GET /explorer/player` | Opening explorer per singolo giocatore | Repertorio reale che il giocatore usa nelle sue partite |

### Idea chiave: Opening Explorer per lezioni di apertura

L'endpoint `GET https://explorer.lichess.ovh/lichess` accetta: `variant`, `fen`, `speeds`, `ratings` (range Elo), e restituisce per ogni posizione:
- Quante volte è stata giocata
- Win/draw/loss rate per bianco e nero
- Le mosse più giocate con le loro statistiche
- Le partite master di riferimento

Questo permetterebbe lezioni di apertura ancorate a dati reali: "il 73% dei giocatori al tuo livello gioca e4 qui — vediamo perché".

### Idea chiave: partite reali dello studente

Connettendo l'account Lichess dello studente (scope `games:read`), si potrebbero analizzare le sue partite reali per:
- Identificare dove esce dalla teoria (out-of-book moves)
- Capire quali aperture gioca davvero
- Generare lezioni personalizzate sui suoi specifici problemi di apertura

---

## Confronto diretto con NeuroScacchi

| Aspetto | Chessdriller | ChessMind AI | Chessline.io | NeuroScacchi |
|---|---|---|---|---|
| **Obiettivo** | Memorizzare mosse | Performance generica | Repertori personalizzati | Capire il ragionamento |
| **Metodo** | Drill SR cieco | Corsi GM + feedback IA | SR + engine stats | Intent + Detective + Candidate |
| **Spiegazioni** | Zero | Post-hoc (ChessGPT) | On-demand AI coach | Generate da IA, validate da coach |
| **Stockfish** | Assente | Implicito nei contenuti GM | Engine per validazione | Nel flusso di generazione |
| **Target** | Adulti autonomi | Adulti generici | Adulti Elo-consapevoli | Bambini, profili cognitivi diversi |
| **Coach umano** | Assente | Assente | Assente | Approva ogni lezione |
| **Profili cognitivi** | No | No | No | ADHD, autismo, plusdotazione |
| **Metacognizione** | No | Minima | No | Principio fondante |
| **Lichess** | Solo studi/PGN | Non usato | Partite + engine stats | Puzzle database (4.7M puzzle) |
| **Processo decisionale** | Non tematizzato | Non tematizzato | Non tematizzato | Nucleo del metodo |

---

## Chessline.io — Approfondimento (analisi tecnica marzo 2026)

### Realtà vs marketing

**La generazione repertori** non usa LLM per le mosse. Il meccanismo reale è: database partite reali (probabilmente Lichess) filtrato per fascia Elo + validazione Stockfish. Essenzialmente è l'Opening Explorer di Lichess con un'interfaccia più semplice.

**L'"AI coach" (ChessGPT)** è ancora in waitlist a marzo 2026. Da quello che trapela sarà RAG (Retrieval-Augmented Generation): posizione → ricerca in database partite annotate da esperti → LLM presenta i commenti in linguaggio naturale. Non rivelano quale LLM usano.

**Personalizzazione reale oggi:** solo Elo e "quanto vuoi coprire". Stile di gioco, analisi avversario specifico, sistema adattivo → tutto roadmap non ancora implementata.

**Limiti evidenti:**
- 5 aperture/mese nel piano premium (costo computazionale elevato o architettura non ottimizzata)
- Nessuna statistica winrate visibile all'utente nelle pagine aperture (Lichess le mostra gratis)
- Nessuna attività didattica interattiva — solo move trainer = memorizzazione
- 2 persone, lancio ottobre 2025, prodotto core ancora a metà

**Finanziamenti:** VentureKick CHF 10.000 + Hasler Foundation CHF 50.000 per "explainable AI". Backing accademico FHNW (Data Science Institute).

---

## Conclusione competitiva

Il concept di NeuroScacchi — lezioni scacchistiche pedagogicamente strutturate, validate da Stockfish, calibrate su profilo cognitivo, approvate da coach umano, per bambini con neurodiversità — **non ha equivalenti sul mercato attuale**.

Le piattaforme esistenti assumono che lo studente sappia già cosa studiare e perché. Forniscono un mezzo di memorizzazione o analisi, non un processo di comprensione mediato da un insegnante.

L'unico player che tocca il target (non il metodo) è **ADHD-chess.com** — ma non usa IA generativa, non genera lezioni, e il coach è il genitore o terapista, non un insegnante di scacchi.
