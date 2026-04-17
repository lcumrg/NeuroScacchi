# NeuroScacchi 3.1 — Documento di indirizzo

*Luca Morigi, per Luca Morigi — Aprile 2026*

*Nasce dalla sessione di ripensamento del 17 aprile 2026, dopo mesi di lavoro sulla versione 3.0. Sostituisce la ROADMAP stratificata tra marzo e aprile come riferimento principale. La vecchia ROADMAP è archiviata in `docs/archivio/ROADMAP-3.0-storica.md`.*

---

## Chi è NeuroScacchi nel 2026

NeuroScacchi nasce da un'intuizione didattica semplice: gli scacchi insegnano a pensare prima di agire, ma le piattaforme esistenti ti insegnano *cosa* giocare, non *come* pensare. Da questa intuizione è nato il metodo — il freeze, il ciclo Osserva → Ragiona → Scegli → Rifletti, le tre attività (Intent, Detective, Candidate) che si frappongono tra lo studente e la mossa.

Questo è il **primo cuore** del progetto, quello fondativo. Negli ultimi mesi, con la versione 3.0, ne è emerso un secondo, meno visibile ma altrettanto centrale: **addomesticare l'intelligenza artificiale agli scacchi**. Non usarla come un oracolo che sa tutto, perché sugli scacchi non sa; ma farla lavorare in tandem con un motore scacchistico (Stockfish), con una libreria di mosse reali (Lichess Explorer), e con un coach umano che conosce il suo studente. L'IA produce pedagogia, il sistema garantisce la correttezza scacchistica, il coach sceglie e approva. Questo secondo cuore è quello che trasforma NeuroScacchi da un'intuizione didattica in un **sistema di produzione di contenuti personalizzati**.

Tra i due cuori c'è un legame preciso: il metodo senza il sistema resta un'idea; il sistema senza il metodo genera lezioni generiche come tutte le altre. Vivono insieme.

Nel 2026, NeuroScacchi è e resta un **laboratorio privato**. Non è un prodotto, non è un'app per il pubblico, non è una startup. È uno strumento che costruisco per me, per i miei tre figli giocatori agonistici, e — se tutto fila liscio — per qualche persona di fiducia (un collega, un parente, un allievo particolare) nei prossimi mesi. Non oltre.

La dimensione pubblica — fondazione, libro, metodo pubblicato — resta come *sogno guida* all'orizzonte, non come scadenza. Ogni scelta di questa versione deve rispettare entrambe le cose: tenere il progetto vivibile oggi, nel tempo frammentato di un insegnante-padre-poeta, e non bruciare ponti verso una possibile condivisione futura.

---

## Cosa vogliamo per giugno

Il traguardo concreto dei prossimi due mesi, da metà aprile a metà giugno, è duplice.

**Un risultato misurabile**: arrivare a **5-10 lezioni di apertura di qualità**, già pronte e testate almeno da me, pronte da usare con i figli appena finisce la scuola. Quando scrivo "di qualità" intendo, in quest'ordine preciso:

Prima di tutto, la **qualità del linguaggio**. Le domande, le opzioni, le spiegazioni, i feedback devono essere scritti in italiano vero — quello che un bambino di 8-12 anni capisce davvero. Niente corporatese, niente IA-ese, niente costruzioni che adulti colti userebbero senza accorgersene. Una lezione NeuroScacchi si riconosce dalla lingua viva prima che dalla didattica sofisticata.

Subito dopo, la **profondità pedagogica**: la lezione deve spiegare il *perché*, non solo il *cosa*. L'idea dietro la mossa, non solo la mossa. Altrimenti è un drill di Chess.com vestito da lezione.

E in terzo luogo, l'**uso attento del metodo**: le attività Intent, Detective, Candidate devono comparire dove hanno senso, non a caso. Il freeze deve essere calibrato. Il ritmo della lezione deve rispettare la capacità di attenzione di un bambino.

La correttezza scacchistica (niente FEN sbagliate, niente mosse illegali, valutazioni Stockfish coerenti) è data per scontata: è un prerequisito, non un vanto. Se una lezione ha un errore scacchistico, è spazzatura a prescindere dal linguaggio.

**Un risultato di processo**: riuscire a lavorare al progetto con **continuità**, una o due sere a settimana, senza sparire per tre settimane e poi tornare smarriti. La continuità non è una virtù personale da tirare fuori, è qualcosa che il progetto stesso deve *abilitare* — ogni sessione deve lasciare punti di aggancio chiari per la successiva.

Questi due risultati si rinforzano a vicenda: la continuità produce le lezioni, e avere lezioni concrete in vista dà senso alla continuità.

---

## Cosa teniamo a distanza

Sono altrettanto importanti le cose che *non* proveremo a fare tra aprile e giugno. Esplicitarle libera energia. In questa versione 3.1 non entrano:

La **pipeline tattica sui puzzle Lichess**. È stata congelata a marzo e per ora resta tale. Il codice è scritto e funzionante, ma non viene riaperto, non viene toccato, non viene manutenuto con priorità. Se un giorno tornerà utile, sarà una decisione consapevole — non un ritorno automatico.

Il **multi-utente, i profili studente separati, l'assegnazione lezioni**. Questo è il confine netto tra laboratorio e prodotto: resta fuori. La Fase 7 della vecchia ROADMAP è sospesa.

**Refactoring architetturali o riscritture**. Il progetto 3.0 ha un'architettura solida. Non la cambiamo. Niente migrazione a TypeScript, niente cambio di framework, niente ripensamenti di fondo. Il tempo disponibile non lo permette e il guadagno non giustificherebbe il rischio.

**Sicurezza infrastrutturale pesante**. Le Netlify Functions oggi non sono protette da autenticazione — chiunque conosca gli URL può scrivere nel database. Questo è un debito noto. In regime di laboratorio privato familiare, con URL non pubblicati, il rischio resta tollerabile: l'oscurità degli URL è sufficiente per il perimetro A (tu \+ figli). Se nei prossimi mesi dovesse emergere il perimetro B (2-5 persone di fiducia esterne), la sistemazione diventa un'azione prioritaria prima di condividere gli URL — e in tal caso si interromperà la produzione di contenuti per affrontarla. Ma non facciamo il lavoro in anticipo: lo facciamo se e quando serve.

**La Fase 3 della vecchia ROADMAP: scheda studente e personalizzazione cognitiva**. L'infrastruttura di personalizzazione è ambiziosa e importante, ma richiede un ordine di grandezza più di lavoro di quello disponibile in questa finestra. Per ora i tre "profili studente" sono mentali — stanno nella testa del coach (me), non nel sistema. Quando crei una lezione per un figlio specifico, tieni tu conto di chi è. Sufficiente per il laboratorio privato.

**La commercializzazione, l'apertura a terzi, gli aspetti legali e IP di distribuzione**. Restano dove sono: registrati nella vecchia ROADMAP, protetti nell'IP di base (SIAE, NDA, segreto commerciale come già previsto), ma non oggetto di lavoro attivo.

Tenere queste cose *fuori* dalla 3.1 non significa rinunciare a loro per sempre. Significa solo che in questa versione non ci occupiamo di loro, e quindi non ci rubano energia mentale.

---

## I due rischi strutturali, e come li affrontiamo

Nella sessione di ripensamento sono emersi due rischi concreti che potrebbero far fallire questi due mesi. Meritano una strategia esplicita, non una raccomandazione generica.

### Rischio 1 — La discontinuità

Smettere di aprire il progetto per tre settimane, tornare, non ricordare dove eri, sentirsi spaesati, allontanarsi di nuovo. Questa è una spirale classica, ed è particolarmente pericolosa per chi ha un profilo ADHD e una vita di insegnante con stagioni di tempo molto diseguale.

Il rischio non si elimina con la forza di volontà. Si riduce con scelte di processo:

**Ogni sessione di lavoro lascia un punto di aggancio esplicito per la successiva.** Concretamente: un foglio Google Fogli (di cui parleremo subito dopo) dove tutte le task vivono, con stato aggiornato, con note che raccontano dove eri, con una task *in corso* sempre visibile. Quando riapri il progetto dopo due settimane, non devi ricostruire il contesto leggendo codice: apri il foglio e vedi dove sei. La memoria non è tua, è del sistema.

**Le task sono piccole.** Una task del foglio deve stare in una sessione reale — 30 minuti, un'ora, al massimo due. Task più grandi vengono spezzate. Una task da "otto ore" è una task che non inizi mai.

**Le sessioni di Claude Code cominciano e finiscono con un rito breve.** All'inizio: gli chiedi "dove eravamo rimasti?" e lui legge il foglio task e te lo riassume in 5 righe. Alla fine: gli chiedi di aggiornare il foglio e di scrivere la prossima task di aggancio. Così non devi ricordarti tu di farlo.

**La produzione di lezioni è disaccoppiata dal lavoro tecnico.** Non devi sempre essere in modalità "programmatore" per avanzare. In serate stanche puoi limitarti a generare una lezione nella Console Coach, leggere l'output, segnare nel foglio cosa va e cosa no. Lavoro legittimo, continuità preservata, zero frustrazione.

### Rischio 2 — La delusione di qualità

Arrivare a giugno, finalmente con tempo libero, iniziare a testare le lezioni coi figli, e scoprire che "non funzionano davvero" — sono piatte, il linguaggio è freddo, il ritmo è sbagliato, i bambini si annoiano. Vivere questo come un fallimento, invece che come una ripresa.

Anche qui, il rischio si combatte con scelte di processo:

**Test piccoli ma frequenti, non un test catastrofico a giugno.** Ogni volta che produci una lezione, non la archivi direttamente — la leggi con occhio critico, la giochi tu stesso nel player, la valuti con i criteri di qualità di questa 3.1 (linguaggio, pedagogia, metodo). Se non ti convince già a te, non convincerà i figli. Correzione subito, non accumulo per dopo.

**Una lezione "campione" che fa da riferimento.** Prendiamo una lezione già prodotta che ti soddisfa — la Ruy Lopez di marzo o un'altra che sceglieremo — e la dichiariamo *standard di qualità*. Tutte le lezioni future si misurano contro quella. Se non sono alla sua altezza, non passano. Questo evita la deriva silenziosa della qualità, che è il modo tipico in cui i progetti di produzione decadono.

**Test con i figli ridotti al minimo essenziale già prima di giugno.** Anche mezz'ora al mese con un figlio, su una lezione alla volta, vale più di sessioni ipotetiche a giugno. Serve solo per avere un segnale precoce: "ecco, qui si annoiano", "ecco, qui ridono", "ecco, qui chiedono perché". Questi segnali indirizzano la produzione successiva molto più di qualsiasi analisi teorica. Non è "testare seriamente": è tastare il terreno.

**Un esperimento mirato sulla Knowledge Base prima di investirci troppo.** La domanda aperta è: le lezioni generate con `contestoStrategico` ricco (testo da manuale incollato nella console) sono davvero migliori di quelle senza? Se sì, vale la pena di investire sulla KB piena (ingestione dei manuali). Se no, restiamo su KB-0 manuale e risparmiamo settimane. Il test si fa con poche lezioni, ben confrontate, letto dai tuoi figli in una sera. Finché non c'è risposta, la KB-2 (retrieval automatico) aspetta.

---

## Le aree di lavoro di primavera

Il lavoro dei prossimi due mesi si distribuisce su cinque aree, ciascuna con uno scopo chiaro. Non sono fasi in sequenza — sono **ambiti paralleli** che coabitano nello stesso foglio di task, con priorità diverse.

### Area 1 — Ripulire prima di lavorare

Una serata sola, forse due, dedicate a mettere in ordine il progetto *prima* di iniziare a produrre. Non è "rifattorizzare", è semplicemente togliere di mezzo quello che confonde.

**Cosa entra**: archiviare il codice della versione 2.x che è ancora nel progetto ma non serve più; disambiguare i due `ai-chat` che hanno lo stesso percorso; aggiornare il `README.md` che parla di un progetto che non esiste più; aggiornare il file `CLAUDE.md` che descrive una struttura molto più piccola di quella reale; congelare `ANALISI-CODICE.md` come documento storico; aggiornare Vite alla versione 6 per chiudere le vulnerabilità più rumorose.

**Cosa non entra**: nessun lavoro strutturale sul codice, nessuna riscrittura, nessun cambio di libreria che richieda test.

**Perché conta**: un progetto ripulito è un progetto che Claude Code capisce meglio, che tu rileggi meglio dopo due settimane di silenzio, che ti fa sentire al timone invece che al rimorchio.

### Area 2 — Produrre lezioni di apertura

Il cuore operativo dei due mesi. Aprire la Console Coach, generare lezioni, rifinirle, archiviarle. Sempre sulla pipeline aperture — che è la pipeline "viva" del 3.0 e che si è dimostrata funzionante.

**Cosa entra**: decidere insieme quali aperture coprire (Ruy Lopez per un figlio, Siciliana per un altro, Italiana come base comune, qualcosa per il Nero); produrre 1-2 lezioni a settimana; salvarle approvate su Firestore; giocarle tu stesso come primo test di qualità; annotare nel foglio cosa ha funzionato e cosa no.

**Cosa non entra**: la pipeline tattica, la generazione di puzzle, altri tipi di contenuto.

**Perché conta**: è l'unico modo per arrivare a giugno con il risultato promesso — 5-10 lezioni testabili. Tutto il resto è secondario.

### Area 3 — L'esperimento Knowledge Base

Una sola domanda a cui rispondere: *la KB piena vale l'investimento di tempo?* La risposta non si indovina — si misura con un piccolo esperimento.

**Cosa entra**: usare la `IngestionPage` per caricare qualche pagina chiave da un manuale della Spagnola (non tutte le 26, bastano 3-5 per iniziare); produrre 2-3 lezioni della Spagnola con `contestoStrategico` ricco; produrre le stesse 2-3 lezioni senza contesto; leggerle con cura e confrontarle contro i criteri di qualità di questa 3.1. Chiaro: stiamo valutando se il contesto strategico che viene passato *a mano* migliora le lezioni. Non stiamo ancora costruendo il retrieval automatico.

**Dipendenze**: la famosa intuizione della fotocopiatrice scolastica. Se il flusso di ingestione viene esteso per accettare PDF multi-pagina da scanner, il costo per popolare la KB cala drasticamente e l'esperimento diventa più ricco. È una task piccola del foglio, ma strategica.

**Cosa non entra**: KB-2 (retrieval automatico in pipeline). KB-3 e KB-4. Nessun lavoro su quelle prima di aver risposto alla domanda di KB-0/KB-1.

**Perché conta**: potrebbe risparmiare settimane di lavoro, o confermarne la necessità. In entrambi i casi, saperlo vale oro.

### Area 4 — L'aspetto grafico per bambini

L'intuizione di cui ti sei accorto nella sessione di oggi: la grafica attuale è "corporate e fredda", e per un bambino di 10 anni la qualità della lezione comincia dal colpo d'occhio, non dal testo. Una lezione scritta benissimo ma presentata in un'interfaccia triste perde metà della sua forza con uno studente di quell'età.

**Cosa entra**: la Fase 2bis della vecchia ROADMAP è già documentata in `docs/design-ux-bambini.md`. Possiamo partire da lì, ma in dose molto ridotta — non tutto il piano di design, solo le cose a **impatto alto / sforzo basso**: palette più calda, colori della scacchiera tradizionali (marrone/beige stile Lichess), color coding dei tipi di attività, un'animazione o due di celebrazione sul "corretto\!". Lavoro di una sera, forse due.

**Cosa non entra**: il ridisegno sistematico dell'interfaccia, il rework tipografico completo, le animazioni avanzate, le icone personalizzate.

**Perché conta**: senza questa area, le lezioni a giugno rischiano di deludere non per il contenuto ma per il contenitore. È un investimento piccolo ad altissima resa per il testing coi figli.

### Area 5 — La continuità come infrastruttura

Non è un'area di lavoro nel senso classico — è un'area di *supporto* alle altre quattro. Comprende le scelte di processo che rendono possibile tornare al progetto dopo una pausa.

**Cosa entra**: il foglio Google Fogli con tutte le task di queste cinque aree, con i campi che avevamo deciso (ID, titolo, descrizione in italiano leggibile, fase, priorità, stato, tempo stimato, chi fa, dipendenze, istruzioni tecniche per Claude Code, note). Il rito di apertura e chiusura sessione con Claude Code. L'aggiornamento del foglio come parte integrante di ogni sessione, non come aggiunta opzionale.

**Cosa non entra**: strumenti complicati, sistemi di project management pesanti, metriche elaborate. Un foglio. Una tabella. Tre colonne filtrabili. Basta e avanza.

**Perché conta**: è il moltiplicatore di tutto il resto. Senza continuità, produrre lezioni diventa un'impresa titanica; con continuità, diventa un'abitudine serale.

---

## Oltre giugno

A giugno finisce la scuola, arrivano le vacanze, cambia il tempo disponibile. Non ha senso pianificare ora nel dettaglio l'estate — sarebbe pianificazione al buio. Ma ha senso fissare due cose.

**Il testing vero coi figli comincia a giugno**, non prima. Le sessioni del laboratorio familiare — uno o più figli davanti all'app, tu accanto che osservi e prendi note — diventano il centro dell'estate. Le 5-10 lezioni prodotte entro giugno sono il materiale su cui fare questo test. Se l'estate produce altre lezioni, bene; ma il cuore è il test.

**La fotocopiatrice della scuola è un'opportunità di giugno**. Finché sei a scuola, hai accesso a uno strumento che trasforma l'ingestione KB da lavoro manuale proibitivo a operazione rapida. Prima che le vacanze chiudano la scuola, potrebbe avere senso dedicare mezz'ora a scansionare i 3-4 manuali strategici che hai in casa. Il PDF prodotto resta a disposizione per l'ingestione progressiva nei mesi successivi.

Il resto dell'estate si definirà sulla base di due segnali: cosa ti dicono i figli durante i test di giugno, e cosa ti ha detto l'esperimento sulla Knowledge Base. Da lì nascerà, se necessario, una versione 3.2 del documento. Non prima.

All'orizzonte più lontano — nei mesi e anni che verranno — resta il sogno del progetto come metodo condiviso: fondazione, libro, collaborazione con psicologi e insegnanti. Non è scadenza, è direzione. Ogni scelta di questa primavera deve essere coerente con quella possibilità, senza che la forzi.

---

## Porte che restano aperte

Il perimetro operativo dei prossimi due mesi è la strada del **laboratorio privato**. Ma alcune piccole scelte di igiene vanno curate in questa primavera anche se non servirebbero al laboratorio, perché sono **precondizioni per tutte le strade future** che un giorno potremmo decidere di imboccare (pubblicazione del metodo, rete informale di collaboratori, eventuale associazione).

Tre filoni da tenere vivi con attenzione leggera ma costante:

**Proprietà intellettuale**. Le azioni già previste (deposito SIAE, deposito notarile, NDA tipo per futuri collaboratori) non le anticipiamo per spaventarci, ma non le rimandiamo sine die. Quando una di queste azioni costa poco tempo e chiude una porta di rischio, la facciamo.

**Qualità del codice e tracciabilità**. Niente refactoring pesanti, ma scelte piccole che non chiudono porte: commit messaggi leggibili, documentazione architetturale aggiornata, licenze open source correttamente tracciate (`chessops`, `chessground` e Stockfish sono GPL-3.0, e questo ha implicazioni per una eventuale distribuzione futura).

**Pubblicabilità dei materiali**. Ogni lezione, documento, schema prodotto viene scritto *come se* un giorno potesse essere letto da un terzo — un editor, un collega, un revisore. Non significa asettico: significa rileggibile senza di me. Lingua curata, riferimenti corretti, radici metodologiche documentate.

Il bivio vero sulla natura futura del progetto (laboratorio, opera d'autore, rete informale, associazione) si affronterà a **settembre 2026**, dopo l'estate di testing, con più dati ed energia. Da qui a lì, il compito è solo: non chiudere porte per distrazione.

---

## Nota di chiusura

Questo documento è scritto in un momento di lucidità del progetto — dopo settimane di distanza fisica, con la prospettiva ristabilita da una sessione di ripensamento. Quella lucidità non durerà da sola. Servirà rileggere queste pagine quando la discontinuità minaccerà di riprendere il sopravvento — magari tra due settimane, o tra due mesi. Il documento è scritto apposta per essere rileggibile senza sforzo.

Se a una futura rilettura qualcosa qui dentro non ti sembrerà più vero, la cosa giusta non sarà ignorarlo: sarà aprire una nuova sessione di ripensamento e scrivere la 3.2. I piani vivi hanno il diritto e il dovere di essere riscritti. L'importante è che non restino impliciti.  
