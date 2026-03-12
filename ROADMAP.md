# NeuroScacchi 3.0 — Documento di Progetto

*Documento riservato — Luca Morigi*

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
- **Database puzzle Lichess** scaricato localmente: 4,7M di puzzle con FEN, soluzione, rating, tag tematici (CC0, dominio pubblico). Indicizzato per tema, rating e apertura — sarà la fonte principale da cui l'IA attinge posizioni per le lezioni.
- Definizione del **formato lezione JSON v3**: versionamento semantico, unioni discriminate per tipo step, separazione contenuto/configurazione. Non esiste uno standard aperto per lezioni scacchistiche interattive — questo formato è parte del valore del progetto.
- **IA generativa**: Google Gemini 2.5 Pro via API, chiamata lato server tramite Netlify Function (`ai-chat.js`) per proteggere la chiave. La scelta del provider è intercambiabile — l'interfaccia interna usa un contratto `{ messages, system } → { content, usage }` indipendente dal modello.

### Fase 1 — La console coach con IA

**Stato: IN CORSO**

Il cuore della 3.0: il sistema di creazione lezioni. L'IA arriva subito perché senza di essa il coach non può produrre contenuti di qualità in tempi ragionevoli. L'integrazione è progressiva:

**Fase 1A — IA per il testo, Stockfish per gli scacchi.**
- Schermata di impostazione obiettivi (con accesso alla scheda studente quando disponibile)
- Chat con IA integrata
- L'IA genera le parti dove è affidabile: struttura della lezione, domande Intent, feedback, spiegazioni strategiche, testo metacognitivo
- Stockfish genera le parti dove l'IA sbaglia: valutazione posizioni, mosse migliori, mosse candidate, classificazione errori
- Traduzione semantica della valutazione: l'IA interpreta i dati numerici di Stockfish (delta-eval, classificazione errore) e li trasforma in feedback narrativi strategici contestualizzati alla posizione. Questa è un'area dove l'IA eccelle — il dato numerico è oggettivo e verificabile, il rischio di allucinazione è basso
- L'IA attinge dal **database puzzle Lichess** per proporre posizioni adeguate al livello e ai temi richiesti, e dall'**Opening Explorer** di Lichess per dati statistici sulle aperture — anziché inventare posizioni da zero
- Il coach fornisce la posizione di partenza (FEN, apertura, PGN) e il contesto didattico, oppure lascia che l'IA la trovi nel database
- Validazione automatica (chessops + Stockfish) per la correttezza scacchistica
- Scacchiera al centro che mostra le posizioni in tempo reale
- Il coach rivede il risultato finale e lo approva o chiede modifiche

**Fase 1B — IA anche per le posizioni, con validazione.**

**Stato: DA FARE**
- Una volta che la pipeline di validazione è collaudata con l'uso reale, l'IA inizia a proporre anche posizioni e sequenze di mosse originali (non solo dal database)
- Ciclo di validazione a tre round: genera → valida → correggi → ri-valida
- Stockfish corregge automaticamente prima che il coach veda il risultato

### Fase 2 — Il player studente (base)

**Stato: DA FARE**

Il player minimo per eseguire le lezioni create in Fase 1.

- Freeze (attesa temporizzata quando non ci sono attività)
- I tre tipi di attività: Intent, Detective, Candidate
- Aiuti visivi (frecce e case evidenziate)
- Feedback base
- Lista lezioni, clic per aprire e giocare
- Fase di test: prima il creatore, poi i figli

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
