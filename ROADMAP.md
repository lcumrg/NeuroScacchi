# NeuroScacchi 3.0 — Documento di Progetto

*Documento riservato — Luca Morigi*

---

## Lavoro in corso

### Sessione 2026-03-14 (continuazione — sistema feedback lezioni)

**Obiettivo:** implementare un sistema di feedback strutturato per raccogliere valutazioni del coach dopo ogni lezione. Il feedback viene salvato su Firestore e riletto nelle sessioni future per guidare l'iterazione sui prompt.

**Implementato:**

- **Salvataggio lezioni approvate su Firestore** (`netlify/functions/lesson-save.js`, `lessonStore.js`) ✓
  - Nuova Netlify Function `lesson-save.js` con Firebase Admin SDK
  - `publishLesson(lesson)` in `lessonStore.js` — POST a `/api/lesson-save`
  - `ConsolePage.jsx`: al click "Approva" chiama anche `publishLesson()` in aggiunta al salvataggio localStorage

- **Stelle per step durante la lezione** (`FeedbackPanel.jsx`, `player-activities.css`) ✓
  - Rating 1-3 stelle nel pannello feedback dopo ogni step (Difficile / Ok / Facile)
  - Props opzionali `onRate` e `currentRating` — retrocompatibile
  - `PlayerPage.jsx`: stato `stepRatings` (index → 1-3), passato e raccolto step per step

- **Freeze saltato per step text** (`PlayerPage.jsx`) ✓
  - Il testo è già l'attività — attendere 2 secondi prima di poter leggere è frustrante
  - Condizione: `if (!freezeEnabled || durationMs <= 0 || currentStep?.type === 'text') → setPhase('activity')`

- **Form feedback finale** (`PlayerPage.jsx`, `PlayerPage.css`) ✓
  - Schermata "Lezione completata!" con pulsante "Valuta la lezione →"
  - Form con: rating complessivo 1-5 stelle, rating 1-3 per ogni step, campo note libere
  - **Per ogni step: campo nota testuale** (opzionale) — per appunti specifici su cosa sistemare
  - Layout step: riga superiore (tipo step + sommario + stelle) + riga inferiore (input nota)
  - Stato `stepNotes` (index → stringa) raccolto insieme a `stepRatings`
  - Salvataggio via `saveLessonFeedback()` su Firestore `lessonFeedback/{autoId}`

- **Salvataggio feedback su Firestore** (`netlify/functions/feedback-save.js`, `lessonStore.js`) ✓
  - Nuova Netlify Function `feedback-save.js`
  - Campi salvati: `lessonId`, `lessonTitle`, `lessonCategory`, `overallRating`, `note`, `stepFeedback[]` (con stepIndex, stepType, summary, rating, note), `playedAt`
  - `saveLessonFeedback({...})` in `lessonStore.js` — POST a `/api/feedback-save`

**Flusso feedback completo:**

```
Gioca lezione
  → FeedbackPanel per ogni step: 3 stelle (Difficile/Ok/Facile)
  → Schermata completamento
  → [opzionale] Form valutazione:
      - 5 stelle complessivo
      - Per ogni step: 3 stelle + nota testuale
      - Note generali
  → Salva su Firestore lessonFeedback
  → Coach rileva dati, chiede a Claude di analizzarli → miglioramento prompt
```

**Prossimo passo:** verificare che il proxy Explorer funzioni correttamente (dati reali nelle lezioni), iterare sui prompt in base alla qualità delle lezioni generate con dati Explorer e ai feedback raccolti.

---

### Sessione 2026-03-14 (prima parte — fix pipeline aperture)

**Contesto:** Prima sessione di test reali con i figli del coach. Identificati e risolti numerosi bug nella pipeline aperture. La pipeline è ora funzionante; la qualità delle lezioni dipende dai dati Explorer (proxy appena deployato — da verificare nel prossimo test).

**Fix implementati:**

- **Prompt ottimizzato per bambini** (`openingBuildPrompt.js`) ✓
  - Limiti espliciti: domande ≤12 parole, opzioni ≤5 parole, feedback ≤2 frasi, hints ≤6 parole
  - Max 1 step `text` per lezione (regola "si impara facendo")
  - Step `demo` scoraggiato — solo in casi eccezionali, non fa parte del metodo
  - `visualAids` (frecce/cerchi) richiesti sistematicamente su ogni step interattivo, con esempi JSON
  - Tabella mosse speciali UCI per arrocco (previene confusione post-arrocco nella sequenza)

- **Fix schema** (`lessonSchema.js`) ✓
  - `allowedMoves` e `correctMoves` ora opzionali per step `intent` — `IntentActivity` è pure multiple-choice, la scacchiera non è mai interattiva durante intent

- **Freeze saltato per step text** (`PlayerPage.jsx`) ✓
  - Il testo è già l'attività — attendere 2 secondi prima di poter leggere è frustrante

- **Mosse illegali non crashano** (`openingEnricher.js`) ✓
  - `walkOpeningMoves` ora tronca alla prima mossa illegale invece di restituire errore
  - La lezione viene costruita sulle posizioni valide disponibili
  - Errore visibile nell'avanzamento passo 2 (non crash)

- **Fix params Lichess Explorer** (`openingExplorer.js`) ✓
  - `ratings` e `speeds` devono essere parametri ripetuti (`ratings=1000&ratings=1200`), non CSV (`ratings=1000,1200`)
  - Bug precedente causava 0 dati Explorer per tutte le posizioni

- **Proxy Netlify per Opening Explorer** (`netlify/functions/opening-explorer.js`) ✓
  - `explorer.lichess.ovh` restituisce 401 per richieste dirette dal browser
  - Nuova Netlify Function che proxia server-side con User-Agent appropriato
  - Client aggiornato per usare `POST /.netlify/functions/opening-explorer`

- **Try-catch su legalDests** (`PlayerPage.jsx`) ✓
  - Previene crash del rendering se un FEN invalido arriva in uno step

**Prossimo passo:** verificare che il proxy Explorer funzioni correttamente (dati reali nelle lezioni), iterare sui prompt in base alla qualità delle lezioni generate con dati Explorer.

---

### Sessione 2026-03-14 (prima parte — implementazione pipeline aperture)

**Decisioni strategiche:**

- **Focus esclusivo sulle aperture** per la pipeline di generazione lezioni. Tattica e finali esclusi dalla pipeline finché le aperture non raggiungono qualità reale.
- **Nuova fonte dati**: Lichess Opening Explorer API (statistiche reali per fascia Elo, frequenza mosse, win rate). Il database puzzle Lichess rimane su Firestore per uso futuro (tattica).
- **Architettura invariata**: stesse attività didattiche, stesso schema JSON v3.0.0, stesso flusso di approvazione coach.

**Implementato:**

- **Pipeline aperture completa (Fase 1C)** — 5 nuovi file engine + form Console Coach rifatto ✓
  - `openingExplorer.js` — client Lichess Opening Explorer API con rate limiting e formattazione per prompt
  - `openingEnricher.js` — cammina mosse con chessops, interroga Explorer per ogni posizione, analisi SF
  - `openingPipeline.js` — orchestratore 4 passi, transizioni deterministiche, validazione legalità
  - `openingPlanPrompt.js` — prompt pianificazione: IA produce mosse UCI + struttura pedagogica
  - `openingBuildPrompt.js` — prompt costruzione: focalizzato su comprensione piano, dati Explorer integrati
- **Console Coach** — form completamente rifatto: apertura (testo libero), colore bianco/nero, livello, varianti, profondità
- **Scacchiera orientabile** — `orientation` passato dal lesson.orientation al LessonViewer
- **Analisi competitiva** documentata — Chessdriller (repo GitHub), ChessMind AI, Chessline.io
- **Hub documentazione** nell'app (`#/doc`) con 4 documenti navigabili

---

### Sessione 2026-03-13

**Lavoro completato:**

- **Migrazione puzzle da Turso a Firestore** — riscrittura `puzzle-search.js` e `puzzle-meta.js` per Firebase Admin SDK
- `FIREBASE_SERVICE_ACCOUNT` impostata in Netlify — query puzzle Lichess attive ✓
- **Analisi Stockfish integrata** nel flusso di generazione — pallini qualità, confronto mossa IA vs SF
- Fix LessonViewer: renderizzazione `transition` come oggetto (era crash React #31)
- **Analisi architetturale profonda** della pipeline di generazione — identificati 8 gap critici
- **Progettazione nuova pipeline** "IA fa pedagogia, il sistema fa scacchi" → documentata in `docs/architettura-pipeline-lezioni.md`

**Conclusione chiave:** l'architettura attuale chiede all'IA di calcolare scacchi (FEN, mosse, valutazioni) — cosa che gli LLM non sanno fare. La nuova pipeline separa i ruoli: Lichess fornisce posizioni reali, chessops calcola FEN, Stockfish analizza, l'IA scrive solo la parte pedagogica.

**Nuova pipeline implementata (2026-03-13):**

- Fase A (Foundation): `puzzleEnricher.js` con `computePuzzlePositions()`, helper `makeMoveFromUci`/`getSan` in `chessService.js`, skeleton `lessonPipeline.js` ✓
- Fase B (Passo 1+2): `lessonPlanPrompt.js` con mappa tema→tag Lichess espansa (40+ voci), `planLesson()`, `buildMaterialsPackage()` con SF ✓
- Fase C (Passo 3+UI): `lessonBuildPrompt.js` con regole ferree, `buildLesson()`, validazione materiali, transizioni deterministiche, wiring ConsolePage con toggle ✓
- Fase D (Polish): toggle pipeline 3.0/legacy nella Console Coach, fallback allargamento range rating ✓

**Prossimo passo:** test end-to-end su Netlify, iterare sui prompt in base ai risultati, eventuale cloud eval Lichess.

---

## 1. IL PROGETTO

### Il problema

Gli scacchi sono uno degli strumenti educativi più potenti che esistano: insegnano a pensare prima di agire, a considerare le conseguenze, a gestire l'incertezza. La ricerca accademica mostra risultati incoraggianti, in particolare per bambini e ragazzi con difficoltà attentive.

Il problema è che le piattaforme scacchistiche esistenti — Chess.com, Lichess, ChessKid, Chessable — insegnano *cosa* giocare ma non *come pensare*. Ti danno un puzzle, tu muovi, è giusto o sbagliato. Fine. Non c'è alcun lavoro sul processo decisionale, sulla consapevolezza, sulla capacità di fermarsi e ragionare prima di agire.

Per ottenere un allenamento che lavori davvero su *come pensi*, oggi l'unica opzione è un coach umano competente — che costa, che non è sempre disponibile, e che raramente ha competenze incrociate su scacchi e profili cognitivi diversi (ADHD, autismo, plusdotazione).

### L'idea

NeuroScacchi è una web app che mette insieme tre intelligenze per creare lezioni scacchistiche di qualità eccellente:

- **Un motore scacchistico (Stockfish)** che sa sempre qual è la mossa migliore, quanto è grave un errore, quali sono le minacce reali in una posizione.
- **Un'intelligenza artificiale** che sa strutturare una lezione, formulare domande, costruire percorsi progressivi, adattare il linguaggio.
- **Un essere umano** (genitore, insegnante, istruttore di scacchi) che conosce il proprio studente — i suoi punti forti, le sue difficoltà, cosa lo motiva e cosa lo frustra.

Nessuno dei tre da solo basta. L'IA sbaglia sugli scacchi — la ricerca dimostra che i modelli linguistici producono mosse illegali oltre il 50% delle volte senza correzione esterna. Stockfish non sa insegnare. L'umano non ha tempo di costruire tutto da zero. Il valore nasce dalla collaborazione: **l'IA bozza, Stockfish valida, il coach rivede e approva**. Insieme, producono lezioni che prima richiedevano un maestro di scacchi con esperienza pedagogica.

### Come funziona

NeuroScacchi non è un'app di puzzle. È un sistema che insegna un ciclo decisionale: **Osserva → Ragiona → Scegli → Rifletti**.

Ogni lezione parte da una posizione sulla scacchiera. Lo studente è obbligato a pensare prima di poter toccare i pezzi. Questo pensiero prende forme diverse:

- **Intent** (domanda strategica): "Qual è il piano migliore per il Bianco?" Lo studente sceglie tra opzioni e deve dimostrare di capire il *perché* prima di poter muovere. Sviluppa il pensiero strategico.
- **Detective** (trova il punto chiave): "Qual è il punto debole nella posizione del Nero?" Lo studente clicca su una casa della scacchiera. Non muove pezzi — impara a *leggere* la posizione. Sviluppa la visione posizionale.
- **Candidate** (trova le alternative): "Trova 2 mosse candidate." Lo studente deve identificare più opzioni prima di sceglierne una. Sviluppa il pensiero sistematico.
- Quando non ci sono attività intermedie e lo studente deve semplicemente muovere, un'**attesa temporizzata** gli dà comunque il tempo di pensare.

Le lezioni mescolano questi tipi di attività in sequenze la cui lunghezza e composizione viene decisa dal sistema coach (IA + motore + umano) in base all'obiettivo didattico. Accanto alle lezioni ci sono puzzle, esami e step di verifica per consolidare le conoscenze e il metodo di ragionamento appreso.

Dopo aver risposto correttamente, lo studente può vedere **aiuti visivi** — frecce che mostrano linee d'attacco, case evidenziate che raggruppano concetti. Il cervello impara a vedere la scacchiera a blocchi significativi, non come 64 case scollegate.

L'idea di fondo è una: **aiutare a passare dall'istintività tattica alla visione strategica**. Non basta sapere la mossa giusta — devi sapere il perché, devi aver considerato le alternative, devi essere consapevole di come stai ragionando. Questa è la differenza tra un giocatore amatoriale e uno agonistico.

### Per chi è

NeuroScacchi non è un'app per un profilo specifico. È uno strumento che permette a chiunque insegni scacchi di creare percorsi su misura per studenti con esigenze diverse:

- Un bambino ADHD con deficit nella memoria di lavoro ha bisogno di sessioni corte, molto rinforzo visivo, e feedback che non punisca gli errori.
- Un bambino plusdotato ha bisogno di sfide che non lo annoino e domande che lo costringano a verbalizzare il ragionamento.
- Un bambino autistico può beneficiare di struttura prevedibile, regole chiare e progressione esplicita.
- Un adulto che vuole migliorare il proprio gioco torneistico ha bisogno di lavorare sulla disciplina decisionale sotto pressione.

La piattaforma non decide cosa serve a chi — lo decide l'umano che crea la lezione, supportato dall'IA e dal motore.

### Il vantaggio competitivo

Nessuna piattaforma scacchistica oggi offre la combinazione di creazione lezioni assistita da IA, percorsi interattivi ramificati e contenuti centrati sul coach. Chess.com e Lichess hanno milioni di puzzle ma zero lavoro sul processo decisionale. ChessKid è pensata per bambini ma non adatta nulla a profili cognitivi diversi. Chessable insegna aperture per memorizzazione, non per comprensione. DecodeChess usa Stockfish più NLP per spiegare le mosse, ma è uno strumento di analisi, non un costruttore di lezioni.

Per ottenere quello che NeuroScacchi offre, oggi serve un coach umano esperto — che costa 30-80€/ora e che raramente combina competenza scacchistica e sensibilità pedagogica per profili diversi. NeuroScacchi democratizza quell'esperienza.

Il vantaggio difensivo non sta nelle funzionalità tecniche — un concorrente con più risorse potrebbe replicarle — ma nella **specializzazione pedagogica**. Le piattaforme esistenti ottimizzano per l'ampiezza dell'engagement; NeuroScacchi ottimizza per la profondità del pensiero. Questa distinzione conta per chi vuole insegnare a ragionare, non solo a giocare.

### L'origine e la visione

Il progetto nasce dall'esperienza personale di un padre e insegnante che gioca a scacchi in torneo con il proprio figlio ADHD e ha osservato che la concentrazione in contesto agonistico è la funzione esecutiva più compromessa sotto stress.

La fase attuale è di sviluppo e test interno: il creatore e i suoi tre figli (12, 10 e 8 anni, tutti giocatori agonistici) sono il banco di prova. L'idea e il progetto sono da tutelare. In futuro NeuroScacchi potrebbe aprirsi a collaboratori fidati e una possibile commercializzazione non è esclusa — ma quelle decisioni verranno dopo, sulla base dei risultati reali.

L'ambizione più grande è che NeuroScacchi diventi uno stimolo per una collaborazione tra scacchisti, psicologi e insegnanti — idealmente sotto forma di una fondazione dove competenze diverse convergono per creare contenuti proprietari e promuovere gli scacchi come strumento educativo efficace. Non necessariamente validato clinicamente su tutti gli aspetti, ma costruito con rigore, con dati, e con l'umiltà di chi sa che il valore è nell'esperienza sul campo prima che nella teoria.

### Protezione dell'idea

Il metodo didattico di NeuroScacchi (Intent/Detective/Candidate, freeze, scaffolding cognitivo) non è brevettabile nell'UE — l'art. 52(2)(c) della Convenzione Europea sui Brevetti esclude i metodi per compiere atti mentali e giocare. Le protezioni concrete sono:

- **Segreti commerciali** (D.Lgs. 63/2018): invio di descrizioni datate del metodo via PEC, registro dei segreti commerciali, NDA per eventuali collaboratori, algoritmi sensibili lato server.
- **Copyright** sul codice sorgente (automatico, vita + 70 anni sotto legge UE).
- **Deposito SIAE** (~€150–200) e/o deposito notarile (~€200–500) per prova di paternità e data.

Il costo totale per una fondazione IP solida è circa **€250–500**. Queste azioni vanno intraprese prima di qualsiasi condivisione o pubblicazione del progetto.

---

## 2. IL METODO

### Principio

Dal tatticismo istintivo al pensiero strategico. NeuroScacchi colma il gap tra il giocatore amatoriale che "vede la mossa" e lo scacchista agonistico che "capisce la posizione". Quella profondità di studio che oggi richiede anni di libri o un maestro, l'app la rende accessibile attraverso l'interazione IA + motore + coach umano.

### Principio non negoziabile

**Non si toccano i pezzi senza aver prima pensato.**

Questo principio si realizza attraverso attività che si frappongono tra lo studente e la mossa (Intent, Detective, Candidate), oppure — quando non ci sono attività — attraverso un'attesa temporizzata che dà tempo per osservare e riflettere.

Il freeze non è uno strumento tra gli altri. È il principio stesso che prende forme diverse a seconda del contesto: una domanda strategica *è* un freeze, un esercizio di individuazione *è* un freeze, un'attesa prima della mossa *è* un freeze.

### Il ciclo

Il ciclo base è: **Freeze → Attività → Feedback**. Ma non è rigido. Gli elementi intermedi (aiuti visivi, calibrazione della fiducia, domande metacognitive) sono modulari: il coach può inserirli, spostarli, rimuoverli in base allo studente e all'obiettivo.

Per un bambino ADHD il ciclo potrebbe essere molto strutturato con più strumenti attivi. Per un ragazzo plusdotato potrebbe essere snello con solo un'attività complessa. Per un bambino autistico potrebbe essere sempre uguale nella forma, prevedibile e rassicurante.

Il coach decide — perché troppi strumenti insieme possono essere deleteri per certi profili (rallentamenti continui frustrano alcuni studenti) e troppo poca struttura manda in confusione altri.

### Le tre attività e le loro radici

I tre tipi di attività non sono scelte di design arbitrarie. Ciascuno mappa direttamente su tradizioni consolidate della pedagogia scacchistica e della scienza cognitiva:

**Intent — Il pensiero strategico prima dell'azione.** Esternalizza quella che Adriaan de Groot identificò nel suo studio fondativo del 1946 come la "fase di orientamento" — i primi secondi in cui un giocatore esperto coglie la posizione e formula idee generali prima di calcolare. Si allinea con il framework degli "squilibri" di Jeremy Silman ("prima immagina la posizione ideale, poi cerca come arrivarci"). Forzando lo studente a categorizzare la posizione prima che la scacchiera si sblocchi, Intent allena il pensiero riflessivo che la ricerca ha dimostrato migliorare la qualità delle mosse a tutti i livelli (Moxley, Ericsson, Charness & Krampe, 2012).

**Detective — Il riconoscimento di pattern e la lettura della posizione.** Isola il riconoscimento di pattern — il singolo predittore più forte dell'abilità scacchistica ad ogni livello, secondo la teoria del chunking di Chase e Simon (1973) e la teoria dei template di Gobet (1996). Separando l'osservazione dall'azione, Detective allena l'abilità percettiva e implementa la valutazione sistematica delle caratteristiche posizionali proposta da Dvoretsky.

**Candidate — Il metodo delle mosse candidate.** Implementa direttamente il metodo di Alexander Kotov da *Pensare come un grande maestro* (1971): identificare tutte le mosse candidate valide prima di analizzarne qualcuna. Combatte il "pensiero circolare" e quella che Dan Heisman definisce "Hope Chess" — muovere senza verificare le risposte dell'avversario. Il principio di considerare alternative prima di impegnarsi è universalmente approvato nella pedagogia scacchistica.

### Avvertimento sulla calibrazione per livello

Il consenso nella didattica scacchistica è che **l'allenamento tattico deve dominare per i principianti** (indicativamente sotto i 1500 Elo), con i concetti strategici introdotti progressivamente — come nel curriculum in nove libri di Yusupov, che passa da forte enfasi tattica al livello base a strategia maggioritaria ai livelli avanzati.

Se le attività Intent e Detective pesano troppo sulla riflessione strategica astratta per giovani principianti, rischiano di frustrare anziché sviluppare giocatori la cui base di riconoscimento dei pattern si sta ancora formando. Le attività vanno calibrate: **osservazione tattica concreta per i principianti, valutazione strategica per gli avanzati**.

### Strumenti modulari a disposizione del coach

- **Aiuti visivi** — Frecce e case evidenziate che appaiono dopo la risposta corretta. Costruiscono il chunking: la capacità di vedere la scacchiera a blocchi significativi.
- **Calibrazione della fiducia** — Prima di confermare la mossa, lo studente dichiara "sono sicuro", "ho un dubbio" o "non lo so". Dopo, l'app confronta la fiducia con il risultato. Attivabile dal coach per gli studenti che ne beneficiano.
- **Metacognizione** — Domande riflessive senza risposta giusta ("hai ragionato o hai risposto d'istinto?"). Attivabile dal coach, frequenza e momento configurabili.
- **Feedback graduato** — Con Stockfish, non solo giusto/sbagliato ma quanto giusto/sbagliato.
- **Traduzione semantica della valutazione** — Stockfish produce dati numerici (delta-eval in centipawn); l'IA li traduce in feedback narrativi strategici comprensibili allo studente. Un calo di -2.5 non diventa "hai perso 2.5 punti" ma "con questa mossa il controllo delle case scure si indebolisce e il Re resta esposto". Il dato oggettivo del motore alimenta la capacità narrativa dell'IA, producendo spiegazioni che normalmente richiederebbero un maestro.

### Progressione

All'apertura dell'app lo studente ha due opzioni:

- **Lezioni singole** — A scelta, per argomento o tema, esplorabili liberamente.
- **Percorsi di studio** — Sequenze strutturate di lezioni + puzzle di verifica + esami, con avanzamento progressivo.

In futuro, ogni studente che accede vedrà i contenuti assegnati dal proprio coach.

### Note bibliografiche

Le radici scientifiche e pedagogiche del metodo si appoggiano su una tradizione consolidata:

**Scienza cognitiva degli scacchi:**

- De Groot, A. D. (1946). *Het denken van den schaker*. Amsterdam: Noord-Hollandsche Uitgevers Maatschappij. Traduzione inglese: *Thought and Choice in Chess* (1965, Mouton; ristampa 2008, Amsterdam University Press, ISBN: 978-90-5356-998-6).
- Chase, W. G. & Simon, H. A. (1973). Perception in chess. *Cognitive Psychology*, 4(1), 55–81. DOI: 10.1016/0010-0285(73)90004-2.
- Gobet, F. & Simon, H. A. (1996). Templates in chess memory. *Cognitive Psychology*, 31(1), 1–40. DOI: 10.1006/cogp.1996.0011.
- Gobet, F. (2018). *The Psychology of Chess*. London: Routledge. ISBN: 978-1-138-21665-5.
- Moxley, J. H., Ericsson, K. A., Charness, N. & Krampe, R. T. (2012). The role of intuition and deliberative thinking in experts' superior tactical decision-making. *Cognition*, 124(1), 72–78. DOI: 10.1016/j.cognition.2012.03.005.

**Pedagogia scacchistica pratica:**

- Kotov, A. (1971). *Think Like a Grandmaster*. London: Batsford. ISBN: 978-0-7134-0356-5. Edizione italiana: *Pensa come un grande maestro* (1983, Prisma Editori, a cura di S. Mariotti, ISBN: 978-88-7264-019-7).
- Silman, J. (2010). *How to Reassess Your Chess* (4th ed.). Los Angeles: Siles Press. ISBN: 978-1-890085-13-1. Edizione italiana della 3ª ed.: *Teoria e pratica degli squilibri* (2005, Prisma, ISBN: 978-88-7264-094-4).
- Heisman, D. (2014). *The Improving Chess Thinker* (2nd ed.). Boston: Mongoose Press. ISBN: 978-1-936277-48-3.

**Meta-analisi sul trasferimento cognitivo:**

- Sala, G. & Gobet, F. (2016). Do the benefits of chess instruction transfer to academic and cognitive skills? A meta-analysis. *Educational Research Review*, 18, 46–57. DOI: 10.1016/j.edurev.2016.02.002.
- Sala, G. & Gobet, F. (2017). Does far transfer exist? Negative evidence from chess, music, and working memory training. *Current Directions in Psychological Science*, 26(6), 515–520. DOI: 10.1177/0963721417712760.

**Pedagogia scacchistica in Italia:**

- Trinchero, R. (a cura di) (2012). *Gli scacchi, un gioco per crescere: Sei anni di sperimentazione nella scuola primaria*. Milano: FrancoAngeli. ISBN: 978-8820405816.
- Sgrò, G. (a cura di) (2012). *A scuola con i Re: Educare e rieducare attraverso il gioco degli scacchi*. Roma: Alpes Italia. ISBN: 978-8865311066. (Volume multidisciplinare con 30 contributori internazionali tra cui Fernand Gobet.)
- Miletto, R., Pompa, A., Fucci, M. R. & Morrone, F. (2024). *I bambini e gli scacchi: Appunti per una teoria della mente*. Roma: Armando Editore. ISBN: 979-1259846587.
- Messa, R. & Mearini, M. T. *Il gioco degli scacchi*. Messaggerie Scacchistiche. ISBN: 978-8898503070. (Il manuale giovanile più diffuso in Italia.)

---

## 3. LA DIDATTICA PERSONALIZZATA

### Principio

Ogni studente è diverso. La personalizzazione non è un'opzione avanzata — è il modo in cui NeuroScacchi funziona. La stessa posizione scacchistica può diventare lezioni completamente diverse a seconda di chi la studia: diversi tipi di attività, diversi strumenti attivi, diversa durata, diverso linguaggio del feedback.

La personalizzazione agisce su due piani:

- **Cosa si studia** — Quali posizioni, quali temi, quale difficoltà, quale progressione. Un bambino di 8 anni con Elo 900 ha bisogno di tattica di base e sviluppo dei pezzi; un ragazzo di 12 anni con Elo 1400 può lavorare su piani strategici e finali complessi.
- **Come si studia** — Quali strumenti si attivano, quanto dura il freeze, quanto feedback serve, che tipo di linguaggio usare. Un bambino ADHD che si frustra facilmente ha bisogno di feedback graduato e sessioni brevi; un bambino autistico ha bisogno di routine prevedibili e regole esplicite; un plusdotato ha bisogno di sfide che non lo annoino.

### La scheda studente

Il punto di partenza della personalizzazione è la **scheda studente** — un profilo che il coach compila inizialmente e che evolve nel tempo con i dati d'uso.

**Compilazione iniziale — dialogo coach + IA:**

Il coach racconta liberamente in chat quello che sa dello studente. Non un questionario rigido — un dialogo naturale. L'IA ascolta, estrae le informazioni, le organizza in una scheda strutturata e segnala le lacune ("non hai menzionato la durata ottimale delle sessioni — quanti minuti riesce a restare concentrato?"). Il coach rivede, corregge, integra e approva.

La scheda è organizzata su tre livelli:

- **Profilo scacchistico** (sempre): Elo o livello stimato, da quanto gioca, punti di forza e debolezza (tattica/strategia/finali/aperture/gestione del tempo), se gioca tornei, che aperture usa.
- **Profilo di apprendimento** (sempre): come reagisce agli errori, se preferisce struttura rigida o flessibilità, durata ottimale della sessione, se si frustra facilmente, se tende a muovere d'impulso o a pensare troppo.
- **Profilo cognitivo** (opzionale): ADHD, autismo, plusdotazione, difficoltà specifiche di memoria di lavoro, attenzione sostenuta, o altre informazioni che il coach ritenga rilevanti.

**Evoluzione con i dati d'uso:**

Man mano che lo studente usa l'app, i risultati delle lezioni alimentano il profilo: accuracy per tema, tempi di risposta, pattern di errore ricorrenti, compliance con il freeze, durata effettiva delle sessioni. L'IA può suggerire aggiornamenti al coach ("l'accuracy sui finali è salita dal 40% al 65% negli ultimi due mesi — aggiorno il profilo?"), ma è sempre il coach umano che approva le modifiche.

### Come la scheda studente guida la creazione delle lezioni

Quando il coach crea una lezione, l'IA conosce la scheda dello studente e la usa come contesto per tutte le sue proposte:

- **Selezione dei contenuti**: l'IA attinge dal database di puzzle (4,7M di puzzle Lichess con rating e tag tematici) e dall'Opening Explorer scegliendo posizioni adeguate al livello e ai temi su cui lo studente deve lavorare.
- **Struttura della lezione**: più step con strumenti multipli per chi ha bisogno di struttura, lezioni snelle e sfidanti per chi non ne ha bisogno.
- **Linguaggio e feedback**: adattato all'età e al profilo — spiegazioni semplici e incoraggianti per un bambino di 8 anni, analisi più tecniche per un ragazzo di 12.
- **Configurazione degli strumenti**: il profilo suggerisce quali strumenti attivare per default (calibrazione della fiducia per chi tende a sopravvalutarsi, metacognizione per chi muove d'impulso) e quali tenere spenti.
- **Calibrazione tattica/strategica**: per studenti principianti, le attività Intent e Detective restano sul piano tattico concreto; per studenti avanzati, si spostano verso la valutazione strategica astratta.

Il coach può sempre sovrascrivere qualsiasi scelta dell'IA — la scheda studente è una guida, non un vincolo.

### Prospettiva futura: analisi delle partite dello studente

Quando il sistema sarà maturo, il coach potrà incollare un PGN di una partita reale dello studente. L'IA, conoscendo il profilo dello studente, identificherà i momenti critici (dove il delta-eval supera una soglia) e proporrà lezioni mirate su quegli errori specifici. Questo chiude il cerchio: lo studente gioca in torneo → il coach analizza la partita → l'IA genera lezioni sui punti deboli → lo studente migliora → gioca meglio in torneo.

---

## 4. IL DESIGN

### Due interfacce

L'app ha due anime distinte con due interfacce separate.

### Console Coach — Lo studio di registrazione

La console è lo spazio dove il coach lavora con IA e Stockfish per creare le lezioni. È come uno studio di registrazione: il coach è il regista, l'IA è lo sceneggiatore che propone la struttura, Stockfish è il consulente tecnico che verifica la correttezza.

**Flusso di lavoro a tre livelli:**

1. **Impostazione obiettivi** — Il coach spiega all'IA cosa vuole in una schermata iniziale: per chi è la lezione (con accesso alla scheda studente), su quale tema, quale obiettivo didattico, quale livello.

2. **Creazione collaborativa** — L'IA propone una struttura (posizioni, step, domande, feedback), attingendo dal database puzzle Lichess, dall'Opening Explorer e dalle valutazioni cloud per posizioni adeguate al profilo dello studente. Stockfish valida in tempo reale che le posizioni siano corrette, che le mosse "sbagliate" siano davvero peggiori, che le mosse "giuste" siano effettivamente le migliori. L'IA non è affidabile da sola sugli scacchi — il sistema funziona perché le tre intelligenze si correggono a vicenda.

3. **Revisione e validazione** — Il coach vede la lezione risultante, può modificarla, correggerla, aggiustarla. Poi la valida e diventa disponibile.

**Layout:** la scacchiera al centro — la stessa visualizzazione che vedrà lo studente. Intorno, gli strumenti di lavoro del coach: la chat con l'IA, i pannelli di configurazione, i controlli Stockfish. Il coach mentre crea sta già vedendo l'esperienza dello studente. Quando modifica qualcosa, vede immediatamente l'effetto.

**In futuro:** assegnazione lezioni a studenti specifici, visualizzazione feedback e dati di utilizzo, compilazione e aggiornamento delle schede studente.

**Nota tecnica — Scelta open source:** Il componente scacchiera utilizzerà Chessground, la libreria di Lichess (licenza GPL-3.0), che offre frecce e cerchi integrati — funzionalità essenziali per gli aiuti visivi del metodo. La scelta GPL è coerente con la visione non commerciale del progetto nella fase attuale. I contenuti creati (lezioni, percorsi) sono e resteranno proprietari.

**Nota tecnica — Funzionamento offline:** Stockfish WASM (~7MB) e le lezioni scaricate vengono messe in cache via Service Worker (architettura PWA), permettendo allo studente di allenarsi senza connessione internet. Solo la creazione di lezioni con IA richiede connettività.

### Interfaccia Studente

Per ora essenziale: lista di lezioni disponibili e percorsi di studio. Un clic apre la lezione o il percorso. L'esperienza durante la lezione è guidata da ciò che il coach ha configurato.

---

## 5. LA ROADMAP

### Fase 0 — Fondamenta

**Stato: COMPLETATA** ✓

Le cose senza cui niente funziona.

- Componente scacchiera interattiva: **Chessground** (`@lichess-org/chessground`, GPL-3.0) — scacchiera SVG con frecce, cerchi, drag-and-drop, animazioni, supporto mobile. ~10KB, zero dipendenze.
- Logica scacchistica: **chessops** (`chessops`, GPL-3.0) — validazione mosse, parsing FEN, parsing PGN con annotazioni Lichess (frecce, cerchi, eval), generazione mosse legali nel formato Chessground. Sostituisce chess.js con funzionalità più ricche.
- Motore di analisi: **Stockfish WASM** (`stockfish` npm, GPL-3.0) — build lite ~7MB, single-thread, depth 15-20 sufficiente per l'uso didattico. Gira in un Web Worker, zero costi server.
- **Database puzzle Lichess** importato in Firestore: 4,7M di puzzle con FEN, soluzione, rating, tag tematici (CC0, dominio pubblico). Indicizzato per tema + rating con indici compositi Firestore. Fonte principale da cui l'IA attinge posizioni per le lezioni.
- Definizione del **formato lezione JSON v3**: versionamento semantico, unioni discriminate per tipo step, separazione contenuto/configurazione. Non esiste uno standard aperto per lezioni scacchistiche interattive — questo formato è parte del valore del progetto.
- **IA generativa**: Google Gemini 2.5 Pro via API, chiamata lato server tramite Netlify Function (`ai-chat.js`) per proteggere la chiave. La scelta del provider è intercambiabile — l'interfaccia interna usa un contratto `{ messages, system } → { content, usage }` indipendente dal modello.

### Fase 1 — La console coach con IA

**Stato: IN CORSO**

Il cuore della 3.0: il sistema di creazione lezioni. L'IA arriva subito perché senza di essa il coach non può produrre contenuti di qualità in tempi ragionevoli. L'integrazione è progressiva:

**Fase 1A — IA per il testo, Stockfish per gli scacchi.**

**Completato:**
- Schermata di impostazione obiettivi con form tema/livello/rating/obiettivo ✓
- Chat con IA integrata (iterazione raffinamento) ✓
- Generazione lezione con multi-provider IA (Claude Sonnet/Opus + Gemini Flash/Pro) ✓
- LessonViewer con visualizzazione step, errori schema, mosse illegali ✓
- Validazione mosse con chessops (mosse illegali rilevate) ✓
- Salvataggio bozza e approvazione in localStorage ✓
- System prompt migliorato con regole anti-errori comuni ✓
- Progress messages nel flusso generazione ✓
- Infrastruttura database puzzle completa: `puzzle-search.js` (Netlify Function → Firestore), `puzzleDatabase.js` (client), `puzzle-meta.js` (metadati temi/aperture) ✓
- **Database puzzle Lichess importato in Firestore** ✓ — ~4.7M puzzle filtrati per qualità (popularity ≥ 50, nbPlays ≥ 500), indici compositi (themes + rating) abilitati
- Netlify Function `puzzle-search.js` riscritta per Firestore (Firebase Admin SDK) ✓

- **Analisi Stockfish automatica dopo generazione** ✓ — ogni step viene analizzato con SF depth 15, mostra qualità (best/good/inaccuracy/mistake/blunder), mossa migliore SF vs mossa IA, top linee. Ri-analisi anche dopo raffinamento via chat.

**Stato Fase 1A: INFRASTRUTTURA COMPLETA — Pipeline di generazione da rifare (vedi sotto).**

Il database puzzle Lichess è attivo su Firestore (`FIREBASE_SERVICE_ACCOUNT` impostata), l'analisi Stockfish post-generazione funziona, ma la qualità delle lezioni generate non è accettabile. Vedi sezione dedicata.

**Ancora mancante in 1A:**
- Salvataggio lezioni su Firestore (solo localStorage)
- Pipeline aperture con Opening Explorer (vedi Fase 1C sotto)

---

### Problema critico identificato: l'IA non sa fare scacchi

**Data identificazione: 2026-03-13**

L'architettura attuale della generazione lezioni ha un difetto fondamentale: **chiede all'IA di calcolare scacchi** — generare FEN, determinare mosse migliori, calcolare posizioni risultanti. Gli LLM non sono in grado di farlo in modo affidabile. Risultato: lezioni con errori scacchistici gravi (posizioni impossibili, mosse illegali, valutazioni false come "Df1 è matto" quando c'è una torre che può catturare).

**8 gap identificati nell'architettura attuale:**

| # | Gap | Gravità |
|---|-----|---------|
| 1 | Solo il primo tag Lichess usato per la ricerca (sempre "fork" per tattica) | Media |
| 2 | Temi non mappati → zero puzzle → IA inventa posizioni | Alta |
| 3 | IA può usare puzzle "come ispirazione" o ignorarli del tutto | **Critica** |
| 4 | FEN validata solo per formato regex, non per legalità posizione | Alta |
| 5 | Mosse mai validate per legalità nella posizione data | **Critica** |
| 6 | Catena FEN tra step non calcolata, solo string-match | **Critica** |
| 7 | Nessun Stockfish nel loop di generazione | **Critica** |
| 8 | initialFen vs steps[0].fen non verificato | Bassa |

Il principio delle "3 intelligenze" (IA bozza, SF valida, umano approva) è corretto ma l'implementazione attuale lo viola: l'IA fa tutto da sola e SF interviene solo dopo, come audit — troppo tardi per essere utile.

---

### Nuova pipeline di generazione: "IA fa pedagogia, il sistema fa scacchi"

**Documento di riferimento:** `docs/architettura-pipeline-lezioni.md`

Il cambio architetturale separerà nettamente i ruoli. L'IA interviene due volte (pianifica e costruisce) ma **non tocca mai FEN, mosse o valutazioni** — quelli arrivano da Lichess, Stockfish e chessops.

#### Pipeline a 4 passi

```
Passo 0: UMANO → descrive il bisogno
Passo 1: IA PIANIFICA → struttura pedagogica, criteri ricerca puzzle
Passo 2: SISTEMA CERCA E VALIDA → Lichess + SF + chessops → materiali certificati
Passo 3: IA COSTRUISCE → con materiali validati scrive domande, feedback, spiegazioni
Passo 4: UMANO → rivede e approva
```

**Passo 1 — IA Pianifica**: produce un piano strutturato (JSON) con titolo, tipi di attività, sequenza pedagogica, criteri di ricerca puzzle (tag Lichess, range rating, quantità). Non genera nessuna FEN né mossa.

**Passo 2 — Sistema Cerca e Valida** (zero IA):
- Query puzzle da Firestore con i criteri del piano
- Per ogni puzzle, `chessops.makeMove()` calcola deterministicamente ogni FEN intermedia lungo la sequenza di mosse
- Stockfish analizza le posizioni chiave: eval, mosse migliori, minacce
- Output: "pacchetto materiali" con posizioni reali, mosse verificate, analisi SF

**Passo 3 — IA Costruisce**: riceve piano + materiali certificati. Scrive domande, opzioni, feedback, spiegazioni. Usa **solo** le FEN e le mosse dal pacchetto materiali. Post-processing automatico verifica che nessuna FEN sia stata inventata e calcola le transizioni deterministicamente.

**Passo 4 — Umano Valida**: invariato — il coach rivede e approva nella Console Coach.

#### Come il puzzle Lichess diventa lezione

Un puzzle Lichess ha: FEN iniziale + sequenza di mosse (la prima è dell'avversario = setup, la seconda è la soluzione del giocatore, ecc.). Il sistema calcola tutte le posizioni intermedie con chessops:

```
positions[0] = FEN iniziale
positions[1] = dopo mossa avversario (= la posizione del puzzle)
positions[2] = dopo soluzione giocatore
positions[3] = dopo risposta avversario
...
```

Ogni posizione è analizzata da SF. L'IA poi mappa queste posizioni su step della lezione:

| Step | Posizione | Dati scacchi | IA fa |
|------|-----------|-------------|-------|
| intent | positions[1] | correctMoves da puzzle, allowedMoves da SF top 3-4 | Scrive domanda e opzioni |
| detective | positions[1] | correctSquare da target mossa migliore | Scrive domanda |
| candidate | positions[1] | candidateMoves da SF, bestMove da SF | Scrive istruzioni |
| move | positions[1] | correctMoves da puzzle | Scrive feedback |
| text | opzionale | nessuno | Scrive contenuto |
| demo | positions[0] | moves da sequenza puzzle | Scrive spiegazione |

#### File da creare

| File | Ruolo |
|------|-------|
| `src/engine/lessonPipeline.js` | Orchestratore dei 4 passi |
| `src/engine/puzzleEnricher.js` | Passo 2: calcolo posizioni, analisi SF, validazione |
| `src/engine/lessonPlanPrompt.js` | System prompt per Passo 1 (pianificazione) |
| `src/engine/lessonBuildPrompt.js` | System prompt per Passo 3 (costruzione) |

#### File da modificare

| File | Modifiche |
|------|-----------|
| `src/engine/aiService.js` | Aggiungere `planLesson()` e `buildLesson()`. Mantenere vecchio flusso come fallback. |
| `src/engine/chessService.js` | Aggiungere helper `makeMoveFromUci()` e `getSan()` |
| `src/pages/ConsolePage.jsx` | Wiring nuova pipeline con toggle vecchia/nuova |

#### Fasi di implementazione

| Fase | Scope | Prerequisiti |
|------|-------|-------------|
| **1A-Pipeline-A** | Foundation: `puzzleEnricher.js`, helper `chessService.js`, skeleton pipeline | Nessuno |
| **1A-Pipeline-B** | Passo 1+2: prompt pianificazione, `planLesson()`, `buildMaterialsPackage()` con SF | A |
| **1A-Pipeline-C** | Passo 3+integrazione: prompt costruzione, `buildLesson()`, validazione, ConsolePage | B |
| **1A-Pipeline-D** | Polish: cloud eval, fallback, rimozione toggle | C |

#### Budget performance

| Fase | Tempo |
|------|-------|
| Passo 1 (IA pianifica) | 5-15s |
| Passo 2 (fetch + compute + SF) | 16-27s |
| Passo 3 (IA costruisce) | 10-20s |
| Post-processing | <200ms |
| **Totale** | **31-62s** (25-45s con cloud eval) |

---

**Fase 1B — Raffinamenti pipeline tattica.**

**Stato: DA FARE (bassa priorità — tattica in standby)**
- Cloud eval Lichess come prima fonte, SF locale come fallback
- Gestione fallback quando non ci sono abbastanza puzzle per i criteri
- Supporto per FEN fornita dal coach (bypass puzzle database)
- Raffinamento iterativo: il coach chiede modifiche via chat, la pipeline ri-valida

---

### Fase 1C — Pipeline aperture con Opening Explorer

**Stato: COMPLETATA** ✓

Pipeline dedicata alle aperture, costruita sulla stessa architettura della Fase 1A ma con fonte dati e prompt completamente diversi. L'obiettivo è la comprensione del piano, non la memorizzazione delle mosse.

**Documento di riferimento:** `docs/analisi-pipeline-aperture.md`

**Principio chiave:** L'IA spiega il *perché* di ogni mossa usando dati statistici reali ("il 73% dei giocatori al tuo livello risponde così") e analisi Stockfish. Lo studente ragiona prima di muovere, non dopo aver memorizzato.

**File da creare:**

| File | Ruolo |
|---|---|
| `src/engine/openingExplorer.js` | Client Lichess Opening Explorer API |
| `src/engine/openingEnricher.js` | Cammina mosse + statistiche Explorer + analisi SF |
| `src/engine/openingPipeline.js` | Orchestratore 4 passi per aperture |
| `src/engine/openingPlanPrompt.js` | Prompt pianificazione lezione apertura |
| `src/engine/openingBuildPrompt.js` | Prompt costruzione step (centrato su comprensione piano) |

**File da modificare:**

| File | Modifiche |
|---|---|
| `src/pages/ConsolePage.jsx` | Sezione aperture: form con apertura, colore, varianti, profondità |
| `src/engine/aiService.js` | Aggiungere `planOpening()` e `buildOpeningLesson()` |
| `src/pages/LessonViewer.jsx` | Orientation: passare bianco/nero a Chessground |

**Input coach per una lezione di apertura:**
- Apertura (es. "Siciliana Najdorf, variante Inglese")
- Colore (Bianco / Nero) — determina l'orientamento della scacchiera
- Varianti da coprire (testo libero)
- Profondità (numero di mosse)
- Livello studente (mappato su fascia Elo Explorer)

**Come le attività esistenti si applicano alle aperture:**

| Attività | Uso per aperture |
|---|---|
| **text** | Introduce l'idea dell'apertura, spiega la struttura |
| **intent** | "Perché il Nero gioca ...c5 invece di ...e5?" |
| **detective** | Trova la casa/pezzo che definisce la struttura |
| **candidate** | Scegli tra le mosse più giocate a questo livello (statistiche reali) |
| **move** | Esegui la mossa dell'apertura (rinforzo) |
| **demo** | Mostra la sequenza con narrazione del piano |

### Fase 2 — Il player studente (base)

**Stato: COMPLETATA** ✓

Il player minimo per eseguire le lezioni create in Fase 1.

- Freeze (attesa temporizzata quando non ci sono attività) ✓
- Tutti e 6 i tipi di attività: Intent, Detective, Candidate, Move, Text, Demo ✓
- Aiuti visivi (frecce e case evidenziate) ✓
- Feedback base corretto/scorretto ✓
- Lista lezioni (LessonsPage), clic per aprire e giocare ✓
- Transizioni animate tra step ✓
- Schermata completamento lezione ✓
- **Sistema feedback coach** ✓ — stelle per step durante la lezione, form valutazione finale (5 stelle globale + 3 stelle + nota per ogni step + note generali), salvataggio su Firestore
- **Salvataggio lezioni approvate su Firestore** ✓ — `lesson-save.js` + `publishLesson()` in `lessonStore.js`

**Nota sull'engagement:** La ricerca indica 10–20 minuti come durata ottimale per sessione di contenuti scacchistici educativi con bambini di 8–12 anni. La soglia critica per verificare l'efficacia è di 25–30 ore totali di istruzione (Sala & Gobet, 2016), che a 3–5 sessioni settimanali da 10–20 minuti richiede 8–16 settimane di uso sostenuto.

### Fase 3 — Scheda studente e personalizzazione

**Stato: DA FARE**

La didattica personalizzata prende forma.

- Creazione della scheda studente: dialogo coach + IA per la compilazione iniziale (profilo scacchistico, di apprendimento, cognitivo opzionale)
- L'IA usa la scheda come contesto nella creazione delle lezioni
- Raccolta dati d'uso base (accuracy, tempi, pattern di errore)
- Suggerimenti IA per aggiornamento profilo basati sui dati

### Fase 4 — Raffinamento console coach

**Stato: DA FARE**

Lo studio di registrazione diventa completo.

- Editor raffinato: modifica singoli step, riordina, aggiusta domande e feedback
- Configurazione degli strumenti modulari per la singola lezione
- Personalizzazione dei parametri del freeze

### Fase 5 — Strumenti modulari nel player

**Stato: DA FARE**

Il player supporta tutto ciò che è opzionale.

- Calibrazione della fiducia
- Domande metacognitive
- Feedback graduato via Stockfish
- Ogni strumento risponde a ciò che il coach ha configurato nella lezione

### Fase 6 — Percorsi e verifiche

**Stato: DA FARE**

La struttura di avanzamento.

- Creazione di percorsi (sequenze di lezioni + puzzle + esami)
- Lato studente: selezione percorsi con visualizzazione avanzamento
- Lato coach: strumenti per assemblare percorsi

### Fase 7 — Multi-utente (futuro)

**Stato: DA FARE**

L'apertura ad altri.

- Account studenti
- Il coach assegna lezioni e percorsi a studenti specifici
- Dashboard per visualizzare feedback e dati di utilizzo

### Debito tecnico — Chessboard.jsx

**Reinit di Chessground al cambio di interattività**

La fix attuale aggiunge `interactive` e `viewOnly` alle dipendenze dell'`useEffect` che inizializza Chessground, forzando un destroy + reinit completo ogni volta che la board passa da non-interattiva a interattiva (e viceversa). Funziona, ma non è la soluzione più pulita.

**Causa radice:** Chessground ha un bug interno — `.set()` non aggiorna correttamente `draggable.enabled` quando passa da `false` a `true`.

**Soluzione preferibile:** usare il prop `key` sul container div invece di gestire le dipendenze manualmente:

```jsx
<div
  key={`cg-${interactive ? 'i' : 'n'}-${viewOnly ? 'v' : 'n'}`}
  ref={cgContainerRef}
  style={{ width: size, height: size }}
/>
```

React smonta e rimonta il DOM element al cambio di `key`, triggering il ciclo cleanup/init dell'`useEffect` in modo naturale. L'`useEffect` di init tornerebbe alla sola dipendenza `[size]`. Prima di implementare: verificare che React gestisca correttamente il reattachment del `ref` al remount e che non ci siano race condition con il ResizeObserver.

---

### Orizzonte futuro (non in roadmap)

Idee da esplorare in futuro senza impegno attuale:

- Analisi PGN delle partite dello studente per generare lezioni mirate sui punti deboli
- Integrazione di stimoli audio e altri strumenti sensoriali
- Modalità partita con scaffolding
- Apertura a collaboratori fidati e/o fondazione educativa
- Possibile commercializzazione sulla base dei risultati reali

#### Hover preview avanzato per le opzioni Intent (estensioni future)

Attualmente implementata l'**Opzione A** (frecce/cerchi statici sul board al passaggio del mouse), già parte del sistema `previewVisualAids` nel JSON della lezione.

Idee per evoluzioni future:

- **Opzione B — FEN anteprima**: ogni opzione porta un `previewFen` opzionale. Hovering → la scacchiera si aggiorna alla posizione risultante da quella scelta. Più potente ma rischia di "spoilerare" — mostra la conseguenza senza far ragionare. Va valutato se contraddice il principio "pensa prima di muovere".

- **Opzione C — Analisi Stockfish live**: hovering su un'opzione → Stockfish analizza la mossa associata in tempo reale e disegna la top line sulla scacchiera. Molto d'impatto per studenti avanzati, permette di vedere immediatamente la qualità di ogni piano. Richiede l'integrazione di Stockfish nel Player (Fase 3+) e una gestione dei thread SF per non bloccare l'interfaccia.

### Azioni IP immediate (prima di qualsiasi condivisione)

- Invio descrizione datata del metodo via PEC
- Deposito SIAE e/o notarile del documento di progetto e del codice
- Predisposizione NDA per eventuali futuri collaboratori

---

*NeuroScacchi 3.0 e tutti i contenuti sono di proprietà esclusiva di Luca Morigi. Tutti i diritti riservati.*
