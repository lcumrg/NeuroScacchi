# STATO-ATTUALE.md — Fotografia del progetto al 2026-04-16

*Documento di orientamento generato da Claude dopo lettura di ROADMAP.md, CLAUDE.md, ANALISI-CODICE.md, della configurazione e del codice. Serve a fissare cosa c'è davvero oggi nel repository, indipendentemente da quello che i documenti dichiarano. Non propone azioni: descrive.*

---

## 1. Cosa funziona oggi

Le cose che nel codice risultano **effettivamente implementate e cablate tra loro**, in linea con la ROADMAP:

**Console Coach (`#/console`).** La schermata di creazione lezioni è il cuore attivo del progetto. Il coach inserisce apertura, colore, livello, varianti, profondità, obiettivo didattico e — novità di marzo — un "contesto strategico" testuale opzionale. Al click, parte la pipeline a 4 passi per le aperture (vedi sotto). Il risultato appare in un `LessonViewer` accanto alla scacchiera, con chat di raffinamento, toggle del modello IA (Claude Sonnet/Opus, Gemini Flash/Pro) e pannello Stockfish per l'analisi manuale. Salva come bozza o approva → la lezione finisce su Firestore.

**Pipeline aperture.** È la pipeline "viva": `src/engine/openingPipeline.js` orchestra quattro passi reali. (1) L'IA produce un piano JSON (titolo, varianti, sequenza di mosse da coprire). (2) Il sistema — senza IA — interroga l'Opening Explorer di Lichess (via proxy Netlify con token OAuth), cammina la sequenza con **chessops** per ottenere tutte le FEN intermedie, e passa Stockfish su ogni posizione chiave. (3) L'IA scrive contenuti (domande, opzioni, feedback, spiegazioni) ricevendo in input *solo* materiali già certificati dal sistema, più l'eventuale contesto strategico. (4) Post-processing: orientation, `initialFen`, transizioni tra step calcolate deterministicamente, validazione schema + legalità delle mosse. Il principio "IA fa pedagogia, il sistema fa scacchi" è rispettato in questa pipeline.

**Player studente (`#/player`).** Gestisce tutti e sei i tipi di step: `intent`, `detective`, `candidate`, `move`, `text`, `demo`. C'è il freeze con countdown, la transizione animata fra step, aiuti visivi (frecce e cerchi), feedback panel con stelle per step (1–3 Difficile/Ok/Facile). La lezione viene selezionata da `LessonsPage` e passata al player via `sessionStorage`.

**Scacchiera.** `Chessboard.jsx` wrappa Chessground di Lichess. È responsive (ResizeObserver), orientabile, supporta overlay di shapes (frecce/cerchi), e ha una logica di click-per-casa (overlay trasparente) usata nella modalità detective. Il bug noto di `draggable.enabled` che non si aggiornava via `.set()` è stato risolto usando una `key` prop che forza il remount al cambio di `interactive`/`viewOnly`.

**Motore Stockfish WASM.** `src/engine/stockfishService.js` è un servizio singleton ben strutturato: lifecycle `idle → initializing → ready → analyzing`, gestione interruzioni con `stop`+discard degli output stale, timeout configurabile, API pulite (`evaluate`, `analyzeMove`, `getBestMoves`, `getThreats`). Gira in un Web Worker, zero costi server.

**Knowledge Base — ingestion (Fase KB-1).** `#/ingestion` è una pipeline completa: upload foto pagina libro → chiamata multimodale a Claude/Gemini con prompt di estrazione strutturata (principi, piani, errori tipici, sequenza mosse) → **chessops** calcola le FEN dalla sequenza (anche notazione italiana: conversione Cf3 → Nf3) → preview con scacchiera → salvataggio su Firestore collection `knowledgeChunks`. La KB è quindi popolabile manualmente dal coach, una foto alla volta.

**Feedback session.** Raccolta doppia: in-lesson (stelle per step) + form finale (5 stelle globali, 3 stelle e nota per step, errori JavaScript catturati automaticamente come `snapshot`). Salvato in Firestore (`lessonFeedback`). Esiste una pagina di review (`FeedbackPage` dentro `SviluppoPage`) per rivedere sessioni passate.

**Storage e funzioni serverless.** 14 Netlify Functions (12 regolari + 1 edge + 1 Firebase proxy): `ai-chat` edge function streaming multi-provider con keepalive SSE; funzioni CRUD per lezioni, KB e feedback; `puzzle-search` + `puzzle-meta` su Firestore; `opening-explorer` con OAuth Lichess.

**IA multi-provider.** L'edge function `/api/ai-chat` gestisce sia Anthropic Claude che Google Gemini dietro un'interfaccia unica `{messages, system, model}`. Streaming vero, con usage tracking. È un pezzo di codice maturo.

---

## 2. Cosa è parzialmente implementato

**Pipeline tattica (puzzle Lichess).** I file esistono tutti: `puzzleEnricher.js`, `lessonPipeline.js`, `lessonPlanPrompt.js`, `lessonBuildPrompt.js`, e il `generateLesson` legacy in `aiService.js`. Il database puzzle è importato in Firestore (4,7M puzzle Lichess, indici compositi). Ma la pipeline è dichiarata "in standby" nella roadmap: la Console Coach espone solo il form aperture, il form tattica non compare nella UI, e `fetchCandidatePuzzles` (legacy) ritorna silenziosamente `[]` se qualcosa va storto. È codice pronto ma non cablato all'esperienza utente.

**Scheda studente, strumenti modulari, profilassi metacognitiva.** Lo schema lezione (`lessonSchema.js`) contempla `config.confidenceCalibration`, `config.metacognition`, `config.graduatedFeedback`. Un coach può configurarli nel JSON. Ma il `PlayerPage` non li legge e non attiva nessun comportamento conseguente: sono campi dormienti. Coerente con la roadmap (Fase 3 e 5 segnate come "DA FARE"), ma importante saperlo.

**Authentication Firebase.** Il contesto auth esiste (`AuthContext.jsx`), `AuthProvider` avvolge l'app in `main.jsx`, e sono esposte le API `login/signup/loginWithGoogle/logout/resetPassword`. Però **nessun componente chiama `useAuth()`**. Non esistono pagine di login, non c'è route gating, non c'è UI di auth. L'infrastruttura è lì ma inerte.

**Retrieval Knowledge Base in pipeline (KB-2).** La KB è popolabile (KB-1 fatto), ma la pipeline aperture non la interroga ancora. L'integrazione prevista in `openingEnricher.js` — "per ogni FEN calcolata, query `knowledgeChunks WHERE fens ARRAY_CONTAINS fen`" — non esiste nel codice. L'unico meccanismo attuo per portare contesto strategico nelle lezioni è il campo testuale che il coach compila a mano in Console (KB-0).

**Documentazione `ANALISI-CODICE.md`.** Vedi sotto: è parzialmente superata.

---

## 3. Disallineamenti tra documenti e codice reale

**`ANALISI-CODICE.md` è del 2026-03-13 e alcune voci non corrispondono più al codice di oggi (2026-04-16).**
- Il punto 7 ("`validateMovesWithChessService` usa chessops ma si chiama `sfValidation`") è ancora vero: in `ConsolePage.jsx` la variabile si chiama `sfValidation` ma la logica usa chessops.
- Il punto 3 (`sf._sendAnalysis()` privato usato in `sfAnalysisService.js`) va verificato — il servizio potrebbe essere stato refactorato.
- Il punto 17 (link "Player" nella nav che rompe il flusso) **è stato risolto**: in `App.jsx` il link non esiste più. Il player è raggiungibile solo da `LessonsPage` via `sessionStorage`.
- Il punto 14 ("funzionamento offline via Service Worker") rimane vero: nessun SW, nessun manifest PWA. Ma la ROADMAP non dichiara più questo come prossimo passo.

**README.md obsoleto.** Dice "Anthropic Claude API (via Netlify Function)". In realtà sono due provider (Claude + Gemini) e la funzione è un'**edge function**, non una normale Netlify function.

**`CLAUDE.md` parzialmente obsoleto.** La "Struttura codice" mostra solo `App.jsx`, `AuthContext.jsx`, `firebase.js`, `ai-chat.js`, `puzzle-search.js`, `puzzle-meta.js`. In realtà ci sono 22 moduli in `src/engine/`, 14 pagine, 12 Netlify functions + 1 edge function, una cartella `functions/` Firebase legacy, e una cartella `docs/` con sei documenti architetturali. La sezione non è scorretta — è solo diventata una miniatura di qualcosa di molto più grande.

**`functions/index.js` è residuo di NeuroScacchi 2.x.** Definisce `onSessionComplete` (trigger su `users/{uid}/sessions/{sessionId}`) e `weeklyAggregation` che analizza campi come `profilassiUsed`, `metacognitive`, `intentErrors`, `moveErrors`. Nessuno di questi campi è prodotto dal PlayerPage o dalle Netlify Functions di 3.0 (che scrivono su `lessons`, `lessonFeedback`, `knowledgeChunks`). C'è anche un GitHub workflow dedicato (`deploy-functions.yml`) che lo deploya su ogni push a main che tocca `functions/`. Vedi "Domande aperte" per la scelta su cosa farne.

**Opening Explorer / Cloud Eval Lichess nella roadmap tattica.** La ROADMAP Fase 1B cita "cloud eval Lichess come prima fonte, SF locale come fallback". Esiste il file `lichessCloudEval.js` ma la pipeline tattica è congelata: l'integrazione tra cloud eval e pipeline non è attiva.

---

## 4. Qualità del codice

**Struttura e leggibilità.** Buone. La separazione è netta: `src/engine/` tiene la logica scacchistica e le API (chess service, stockfish, opening explorer, pipelines, schemi, prompts); `src/components/` la UI riusabile; `src/pages/` ogni pagina; `netlify/functions/` le lambda serverless. Un file = un concetto (come da convenzione CLAUDE.md). I nomi sono chiari. I commenti in italiano sono usati con misura per motivare scelte non ovvie.

**Tipizzazione.** Il progetto è interamente in JavaScript, niente TypeScript. Per un'app di queste dimensioni è una scelta consapevole, ma ogni volta che due moduli si scambiano strutture ricche (es. "materials package" tra pipeline e prompt di build) il contratto va letto a mano dal codice, perché non è tipato. Gli schemi delle lezioni sono definiti come validatori a runtime (`validateLesson` in `lessonSchema.js`) — buoni come "guardie finali" prima del salvataggio, ma non aiutano l'IDE.

**Test.** **Nessun test automatizzato nel repo.** Zero file `*.test.js`, `*.spec.js`, nessuna config di Vitest/Jest, nessuno script di test in `package.json`. Tutta la validazione è runtime (chessops che lancia se la mossa è illegale, `validateLesson` che ritorna errori, Stockfish che timeouta). La pipeline aperture è un sistema con quattro passi, cinque provider esterni (Lichess, Gemini, Claude, Stockfish, Firestore) e un merge nei prompt: un bug di regressione passa inosservato fino al primo studente reale.

**Gestione errori.** A macchia di leopardo. Alcuni posti sono diligenti (retry automatico sul JSON malformato dell'IA, gestione timeout Stockfish, discard degli output stale). Altri sono `try/catch → return []` silenzioso: `fetchCandidatePuzzles` e `openingEnricher` falliscono silenziosamente se il DB non c'è o se Explorer dà 4xx non gestiti.

**CSS e stile.** CSS modulare per file. `index.css` definisce variabili tema (chiaro/scuro), il resto è inline-style o file `.css` accanto al componente. Non c'è un design system formale. La ROADMAP (Fase 2bis) riconosce che il look è "corporate e freddo" per un pubblico di bambini 8–12 anni, e c'è un piano di intervento dettagliato in `docs/design-ux-bambini.md`.

**State management.** Plain React — `useState`, `useEffect`, `useRef`, qualche `useCallback`. Niente Redux, niente Zustand, niente tanstack/query. Per ora basta, ma in qualche posto (`PlayerPage.jsx`, `ConsolePage.jsx`) il numero di state variabili è alto e un futuro reducer aiuterebbe. Il `PlayerPage` ha anche una macchina a stati informale (`phase = 'freeze'|'activity'|'feedback'|'transition'|'done'`) che non è oggettivata da nessuna parte.

---

## 5. Rischi concreti

**Sicurezza Netlify Functions — rischio alto.** Le funzioni `lesson-save.js`, `lesson-delete.js`, `feedback-save.js`, `kb-save.js`, `kb-delete.js` usano Firebase **Admin SDK** (che *bypassa* le regole Firestore) e **non hanno alcun controllo di autenticazione**. Chiunque sul web conosca gli URL `/api/lesson-save`, `/api/kb-save`, `/api/lesson-delete`, `/api/kb-delete` può scrivere, cancellare o sovrascrivere qualunque documento. Le Firestore rules proteggono solo `users/{uid}/...`, ma le collection effettivamente usate dall'app (`lessons`, `lessonFeedback`, `knowledgeChunks`, `puzzles`) stanno fuori da quella regola e sono accessibili solo via admin. La barriera concreta oggi è *"nessuno conosce gli URL"*, cioè security-through-obscurity. Per un prototipo interno è tollerabile, ma va documentato.

**Autenticazione infrastruttura esistente ma non cablata.** Come già detto: `AuthProvider` c'è, ma nulla lo usa. Un futuro gating delle funzioni (richiedere un ID token Firebase nell'header `Authorization` e verificarlo lato Netlify con Admin SDK) sarebbe relativamente compatto da aggiungere — l'infrastruttura è già preparata.

**Chiavi API e `.env.local`.** Nel repo esiste un `.env.local` di 355 byte. È correttamente in `.gitignore`, ma vale la pena verificare che nessun log (CI, build Netlify) le stampi. Le API keys Firebase nel bundle frontend sono pubbliche by design (giusto, come dichiarato in `netlify.toml`): la sicurezza di quelle sta nelle Firestore rules, non nella segretezza della chiave.

**Firestore rules rigide sui dati utente, assenti sui dati di dominio.** La sezione `users/{uid}/**` è ragionevole. Ma le collection di contenuto (`lessons`, `knowledgeChunks`, `lessonFeedback`) non hanno alcuna regola: la regola finale `match /{document=**} { allow read, write: if false }` blocca l'accesso client diretto, il che è **corretto** se tutti i client devono passare per Netlify Functions. Però il client chiama direttamente Firestore per l'auth — non per i dati. Da confermare: il client fa davvero *solo* auth sul Firestore SDK?

**Dipendenze obsolete e vulnerabili.** `npm audit` segnala 14 vulnerabilità (8 low, 3 moderate, 3 high). Le high sono: `rollup` 4 (path traversal, esisterà in build), `node-forge` (più CVE firma digitale) tramite firebase-admin, `fast-xml-parser` (entity expansion). Le moderate includono `esbuild` legato a vite ≤6, che è quella che usa questo repo (`vite 5.4.21`). Molte di queste sono di build o transitive; non tutte sono esploitabili in produzione. Resta che l'aggiornamento a vite 6/7/8 è una dose di debito pronta a maturare, ed `firebase-admin` 13 è dietro l'ultima minor disponibile.

**Accessibilità (a11y).** Non c'è evidenza di attenzione sistematica: niente `aria-label` ricorrenti, niente gestione focus nei modali/overlay, niente navigazione da tastiera sulla scacchiera (Chessground supporta mouse/touch/drag, non keyboard). Per un bambino ADHD ancora va, per uno studente con disabilità motoria o un'insegnante non vedente sarebbe inutilizzabile.

**Performance.** Due zone potenzialmente pesanti:
- La pipeline aperture è sincronizzata in serie (plan → Explorer + SF → build). La roadmap stima 31–62 secondi. Questo è lungo: se un coach fa dieci iterazioni di raffinamento, diventa un'ora. Ma è accettabile in una console di creazione, non in UX studente.
- Stockfish WASM gira su thread singolo (build lite) e blocca il main thread solo per la comunicazione. Depth 15–16 va bene. Nulla di critico.

**Debito tecnico noto e documentato.** Il `Chessboard.jsx` reinit via `key` prop. Il contestualmente riconosciuto "stato è alto" della Console e del Player. Nessuno di questi è bloccante.

**Performance del database puzzle.** `data/puzzles.db` è 1.6 GB e `data/lichess_db_puzzle.csv` 1 GB. Sono gitignorati — non si tracciano. Ma in locale, `better-sqlite3` in devDependencies apre questo DB per `scripts/import-lichess-puzzles.js`. Non è un rischio di produzione (Netlify Functions interrogano Firestore, non sqlite), ma chi clona il progetto senza avere 3 GB di spazio libero non può re-eseguire l'import.

---

## 6. Punti di forza dell'architettura

**"IA fa pedagogia, il sistema fa scacchi" è vero nel codice.** Non è solo slogan: la pipeline aperture lo *implementa*. L'IA non tocca FEN né mosse — riceve un piano di materiali certificati da chessops+Stockfish+Explorer e produce solo testo pedagogico. Questo è il vero *moat* tecnico del progetto, perché gli LLM allucinano sugli scacchi e l'architettura lo esclude per costruzione.

**Separazione netta tra strato scacchistico e strato IA.** `chessService.js` (chessops), `stockfishService.js`, `openingExplorer.js`, `lichessCloudEval.js` sono moduli puri, testabili in isolamento, senza riferimenti all'IA. `aiService.js` e i file `*Prompt.js` non sanno nulla di scacchi: manipolano stringhe e JSON. Il ponte sta in `*Enricher.js` e `*Pipeline.js`.

**Schema lezione versionato.** `LESSON_VERSION = '3.0.0'` e un validatore a runtime con errors + warnings (non solo errors): discriminated unions per tipo step, difese su FEN/UCI/square. È un asset: permette di evolvere il formato senza rompere lezioni vecchie.

**Multi-provider IA con contratto unico.** `{messages, system, model} → streaming SSE → {text, done, usage}`. Cambiare provider costa una riga nella `MODELS` map. L'autentica utility di questa astrazione si vede quando si confrontano output dei modelli sulla stessa lezione.

**Framework open source coerente.** Chessground + chessops + Stockfish WASM sono tutti Lichess (GPL-3.0, gratuiti, mantenuti). Niente licenze commerciali, niente lock-in su provider specifici.

**Firestore come data layer unico.** Auth, puzzle (4,7M doc), lezioni, feedback, knowledge chunks — tutto nello stesso posto, con lo stesso SDK, le stesse regole (quando ci saranno). Niente ORM, niente migration, niente schema enforcement pesante. Per un progetto così giovane, una scelta che paga.

**ROADMAP come single source of truth.** È aggiornata (ultima sessione 2026-03-28, priorità operative chiare), sincera sui problemi ("l'IA non sa fare scacchi"), e dettagliata abbastanza da essere un onboarding da sola. Il fatto che CLAUDE.md la renda un requisito operativo è salutare.

**Storico sessioni.** La sezione "Storico sessioni di lavoro" nella ROADMAP è prezioso: tracklog dei cambiamenti strutturali con data. Questo è raro e utile.

---

## 7. In una riga

Un progetto giovane ma con un'architettura sorprendentemente matura sul pezzo dove conta (le aperture), un'autenticazione scheletro da cablare prima di aprire l'app a terzi, zero test e una pipeline tattica parcheggiata in buon ordine in attesa di decidere se riaprirla.
