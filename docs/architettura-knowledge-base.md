# Knowledge Base Strategica — Analisi e Architettura

*NeuroScacchi 3.0 | Marzo 2026*

---

## 1. IL PROBLEMA CHE RISOLVE

La pipeline aperture attuale ha tre fonti di verità:

| Fonte | Cosa porta | Limiti |
|---|---|---|
| **Lichess Opening Explorer** | Dati statistici reali — cosa giocano i giocatori al tuo livello | Sa *cosa* si gioca, non *perché* |
| **Stockfish** | Verità computazionale — la mossa oggettivamente migliore | Sa *cosa è meglio*, non *cosa significa strategicamente* |
| **IA (LLM)** | Pedagogia, domande, spiegazioni | Non ha conoscenza scacchistica autorevole — genera "strategia plausibile", non profondità reale |

Il terzo strato manca. L'IA sa formulare domande eccellenti ma non sa *cosa valga la pena spiegare* con la profondità di un maestro di scacchi. Il risultato: lezioni pedagogicamente corrette nella forma ma superficiali nel contenuto strategico.

**La Knowledge Base strategica è il terzo strato.** Porta nella pipeline quella profondità che oggi richiederebbe anni di studio di manuali o ore con un maestro. È costruita da chi conosce il materiale — il coach — e diventa il differenziatore fondamentale dell'app.

---

## 2. LA VISIONE

> L'IA di NeuroScacchi non è una IA generica che parla di scacchi.
> È un'IA che dialoga con un database certificato di aperture (Lichess),
> un motore scacchistico (Stockfish) e un database strutturato di analisi
> strategiche autorevoli costruito dal coach.
> Nessuna altra piattaforma ha questi tre strati integrati.

Questo è il vantaggio difensivo reale: non le funzionalità tecniche (replicabili), ma la **conoscenza proprietaria** accumulata nel database strategico.

---

## 3. I TRE STRATI — ARCHITETTURA COMPLETA

```
┌─────────────────────────────────────────────────────────────────┐
│  STRATO 1: STATISTICO (Lichess Opening Explorer)                │
│  "Cosa giocano i giocatori reali al tuo livello"                │
│  Già integrato e funzionante ✓                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  STRATO 2: COMPUTAZIONALE (Stockfish + chessops)                │
│  "Cosa è oggettivamente la mossa migliore"                      │
│  Già integrato e funzionante ✓                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  STRATO 3: STRATEGICO (Knowledge Base)                          │
│  "Perché questa struttura è buona, quali sono i piani,          │
│   gli errori tipici, cosa dicono i maestri"                     │
│  DA COSTRUIRE ← questo documento                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                   ┌─────────▼─────────┐
                   │   IA COSTRUISCE   │
                   │   la lezione con  │
                   │   tutti e tre     │
                   └───────────────────┘
```

---

## 4. IL COLLEGAMENTO CRITICO: FEN come indice dell'albero

### Il problema dell'indicizzazione per nome

Un approccio naive indicizzerebbe i chunk di conoscenza per nome dell'apertura: "Spagnola", "Berlino", ecc. Questo ha un difetto fondamentale: i nomi delle varianti sono ambigui (Berlin Defense / Berlino / Difesa Berlino), le trasposizioni fanno arrivare alla stessa posizione da mosse diverse, e il matching testuale è fragile.

### La soluzione: FEN come chiave dell'albero posizionale

Le aperture sono alberi di posizioni. Ogni nodo dell'albero è una FEN univoca. Lichess Opening Explorer naviga già questo albero FEN per FEN.

**La Knowledge Base usa la FEN come chiave di indice.**

```
Nodo albero: FEN "r1bqkb1r/1ppp1ppp/p1n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 4"
(= posizione dopo 1.e4 e5 2.Cf3 Cc6 3.Ab5 a6 = mossa cardine della Spagnola)
                           ↓
Lichess Explorer:  statistiche mosse per questa FEN
Stockfish:         analisi di questa posizione specifica
Knowledge Base:    "Qui il Bianco ha due opzioni strategiche fondamentali:
                   mantenere la tensione (4.Aa4) oppure risolvere subito (4.Axc6)..."
```

Quando la pipeline naviga il percorso dell'apertura e calcola le FEN con chessops, per ogni FEN del percorso fa tre query in parallelo: Explorer + Stockfish + Knowledge Base. Il risultato che arriva all'IA è il massimo della conoscenza disponibile su quella posizione specifica. Nessun matching testuale, nessuna ambiguità: match esatto per FEN.

### Il principio applicato all'ingestion

La stessa regola della pipeline si applica all'ingestion:

- **Vision** legge la pagina del manuale ed estrae: testo strategico + sequenze di mosse citate nel testo
- **Vision NON produce mai FEN** — le sequenze di mosse vengono usate, non le posizioni
- **chessops** converte le sequenze di mosse in FEN deterministicamente (zero errori)

Questo è lo stesso principio "IA fa pedagogia, il sistema fa scacchi" applicato alla costruzione della Knowledge Base: Vision fa la comprensione del testo, chessops fa il calcolo posizionale.

---

## 5. PERCORSO DI INGESTION: B → C

### Modalità B — Foto del manuale (ingestion attuale)

**Flusso:**
1. Coach carica foto di una pagina del manuale
2. Claude Vision legge la pagina ed estrae un oggetto strutturato:
   - Principi strategici espressi in forma strutturata (NON testo raw copiato)
   - Sequenze di mosse citate nel testo (es. "1.e4 e5 2.Cf3 Cc6 3.Ab5 a6 4.Aa4 Cf6 5.0-0")
3. chessops converte le sequenze → FEN calcolate deterministicamente
4. Coach rivede l'anteprima dell'estrazione
5. Conferma → chunk salvato su Firestore indicizzato sulle FEN

**Perché non chiedere a Vision le FEN:**
Vision è eccellente nel leggere testo e notazione algebrica. È inaffidabile nel calcolare posizioni scacchistiche. Le FEN non si "leggono" da un diagramma con sufficiente accuratezza — si *calcolano* da una sequenza di mosse. chessops lo fa in modo deterministico.

### Modalità C — Import PGN annotato (futuro)

Un PGN con commenti `{}` è già un formato strutturato:
```
1.e4 e5 2.Cf3 Cc6 3.Ab5 {L'Alfiere attacca il cavallo che difende e5
— non per catturarlo subito, ma per creare pressione futura.} 3...a6
4.Aa4 {Mantiene la tensione. 4.Axc6 risolve subito la struttura ma
cede la coppia di alfieri.}
```

Il parser PGN (già fattibile con chessops) legge i commenti e crea chunk associati alla posizione in quel punto della partita. Il formato Firestore è identico alla Modalità B — nessuna migrazione necessaria quando si passa da B a C.

**Casi d'uso futuri per Modalità C:**
- Import da database digitali
- PGN annotati da motori (Stockfish, Leela)
- Analisi personali del coach in formato PGN
- Collaborazione futura con maestri che forniscono PGN annotati

---

## 6. SCHEMA FIRESTORE

```
knowledgeChunks/
  {chunkId}/
    apertura: "Spagnola"          // famiglia ECO (es. "Siciliana", "Francese")
    variante: "Berlino"           // nome variante principale
    sottoVariante: "difesa del Rio"  // opzionale
    ecoCode: "C65"                // codice ECO se noto, opzionale

    sequenzaMosse: "1.e4 e5 2.Cf3 Cc6 3.Ab5 Cf6 4.0-0 Cxe4 5.d4"
                                  // mosse da posizione iniziale alla posizione chiave
    fens: ["fen1", "fen2"]       // FEN calcolate da chessops sulla sequenzaMosse
                                  // può essere una lista se il chunk si applica a più posizioni

    // Contenuto strategico strutturato (NON testo raw dal manuale)
    principiStrategici: [
      "Il bianco mantiene la tensione evitando Axc6",
      "Il finale è favorevole al bianco grazie alla coppia di alfieri"
    ]
    piani: {
      bianco: "Puntare al finale con la coppia di alfieri...",
      nero: "Contrattaccare al centro con ...d5 prima che il bianco si sistemi..."
    }
    erroriTipici: [
      "Risolvere la tensione troppo presto con Axc6 (cede la coppia di alfieri)",
      "Dimenticare la minaccia ...d5 e perdere il controllo del centro"
    ]
    concettiChiave: ["coppia di alfieri", "tensione vs risoluzione", "struttura pedonale"]
    strutturePedonali: ["pedone isolato su e5", "centro mobile bianco"]  // opzionale

    livello: "tutti"              // "principiante" | "intermedio" | "avanzato" | "tutti"
    fonte: {
      nome: "Il grande libro della Spagnola",
      pagina: 47,
      autore: "..."               // opzionale
    }
    createdAt: timestamp
    aggiornato: timestamp
```

### Indici Firestore necessari

```
// Per recupero per apertura
apertura ASC, variante ASC

// Per recupero per FEN (query principale nel pipeline)
fens ARRAY_CONTAINS → nativo Firestore, no indice composto necessario
```

---

## 7. INTEGRAZIONE NELLA PIPELINE APERTURE

### Dove si inserisce

Il recupero dalla Knowledge Base avviene nel **Passo 2** dell'`openingEnricher.js`, dopo che chessops ha calcolato tutte le FEN del percorso dell'apertura. Per ogni FEN calcolata, una query Firestore cerca chunk corrispondenti.

```
Passo 2 attuale:
  → chessops calcola FEN posizione per posizione
  → Explorer: statistiche per ogni FEN
  → Stockfish: analisi posizioni chiave

Passo 2 con Knowledge Base:
  → chessops calcola FEN posizione per posizione
  → Explorer: statistiche per ogni FEN
  → Stockfish: analisi posizioni chiave
  → Knowledge Base: chunk strategici per ogni FEN    ← NUOVO (opzionale)
```

### Comportamento opzionale (Opzione 1)

La pipeline funziona senza Knowledge Base. Se un chunk viene trovato per una FEN, viene aggiunto al pacchetto materiali come campo `knowledgeChunks: [...]`. Se non viene trovato nulla, la pipeline procede normalmente — l'IA usa solo Explorer + Stockfish.

Questo permette di usare l'app per qualsiasi apertura, anche quelle non ancora nella Knowledge Base. Man mano che il database cresce, la qualità delle lezioni migliora automaticamente per le aperture coperte.

### Futuro: Opzione 2 (pipeline dipendente dalla KB)

Quando la Knowledge Base sarà sufficientemente ricca da coprire le aperture principali, si potrà passare alla Opzione 2: la pipeline segnala al coach quando genera una lezione su un'apertura non ancora nella KB, suggerendo di arricchire il database prima di procedere.

### Come i chunk vengono iniettati nel prompt

Nel prompt di costruzione (`openingBuildPrompt.js`), quando `knowledgeChunks` è presente nel pacchetto materiali, viene aggiunta una sezione:

```
## ANALISI STRATEGICA DA FONTE AUTOREVOLE
Questa sezione contiene analisi di un manuale esperto sulla posizione in studio.
Usala per arricchire la profondità strategica della lezione.

REGOLE FONDAMENTALI:
- NON copiare mai frasi o espressioni dal testo — reinterpreta sempre
- Riformula con parole tue, adattando al livello e all'età dello studente
- Il tuo compito è tradurre la profondità dell'analisi in attività interattive,
  non citare il manuale
- Usa questi principi per costruire domande Intent più profonde, opzioni
  Candidate più significative, spiegazioni nei feedback più ricche

[principiStrategici, piani, erroriTipici...]
```

---

## 8. IL PROMPT DI ESTRAZIONE PER VISION

Il prompt che Vision usa per estrarre conoscenza da una pagina del manuale deve produrre un oggetto strutturato, **non testo raw**. La qualità dell'estrazione determina la qualità del database.

### Cosa Vision estrae

```json
{
  "apertura": "Spagnola",
  "variante": "Berlino",
  "sequenzaMosse": "1.e4 e5 2.Cf3 Cc6 3.Ab5 Cf6 4.0-0 Cxe4 5.d4",
  "principiStrategici": [
    "Il bianco accetta un finale leggermente inferiore in cambio di struttura solida",
    "La coppia di alfieri del nero è compensata dalla struttura pedonale più attiva del bianco"
  ],
  "piani": {
    "bianco": "...",
    "nero": "..."
  },
  "erroriTipici": ["..."],
  "concettiChiave": ["..."],
  "livello": "intermedio"
}
```

### Cosa Vision NON fa

- Non produce FEN (le calcola chessops)
- Non copia frasi intere dal libro
- Non trascrive il testo raw della pagina
- Non analizza i diagrammi in termini di FEN

### Come gestire i diagrammi

I diagrammi scacchistici nei libri sono visivamente informativi ma non producono FEN affidabili via Vision. Strategia:
- Se un diagramma è accompagnato da una sequenza di mosse nel testo → la sequenza è sufficiente per calcolare la FEN
- Se un diagramma non ha una sequenza di mosse associata → Vision descrive la posizione in termini strategici testuali ("il bianco ha un pedone isolato in d4, il nero ha un cavallo forte in e5") che diventa un principio strategico, non una FEN

---

## 9. PROBLEMI POTENZIALI E SOLUZIONI

### Problema 1 — Qualità dell'estrazione Vision

**Rischio:** Vision fraintende la notazione algebrica italiana/inglese, o estrae mosse sbagliate dal testo.

**Soluzione:** Nell'interfaccia di ingestion, mostrare la preview delle mosse estratte + la FEN calcolata da chessops con la scacchiera visuale. Il coach vede la posizione e può correggere le mosse prima di salvare.

### Problema 2 — Chunk troppo generici

**Rischio:** Un chunk dice "il bianco ha la coppia di alfieri" — informazione vera per decine di posizioni diverse, non utile per nessuna in particolare.

**Soluzione:** Ogni chunk deve essere ancorato a una sequenza di mosse specifica (non solo all'apertura). Il campo `sequenzaMosse` è obbligatorio. Un chunk senza posizione specifica non viene salvato.

### Problema 3 — Granularità dei chunk

**Rischio:** Se una pagina del manuale copre 10 posizioni diverse, un singolo chunk è ambiguo.

**Soluzione:** Il prompt di estrazione chiede a Vision di identificare le "posizioni chiave" della pagina e di produrre un chunk per ciascuna. Una pagina → N chunk, uno per posizione chiave.

### Problema 4 — Overlap tra chunk

**Rischio:** Due pagine del manuale si sovrappongono sulla stessa posizione, producendo chunk duplicati.

**Soluzione:** Al momento del salvataggio, controllare se esiste già un chunk per la stessa FEN. Se sì, permettere al coach di unirli o mantenere entrambi (con versioning).

### Problema 5 — Adattamento al livello

**Rischio:** Il manuale è scritto per giocatori di alto livello. I principi estratti usano terminologia tecnica inappropriata per principianti.

**Soluzione:** I principi estratti sono conoscenza "grezza" — la riformulazione per livello è compito dell'IA nel momento della costruzione della lezione. Il prompt ha già il parametro `livello` e le istruzioni per adattare il linguaggio. La KB fornisce il *cosa*, il prompt controlla il *come*.

### Problema 6 — Copertura parziale del database

**Rischio:** La KB copre solo alcune aperture, creando discontinuità nella qualità.

**Soluzione:** L'opzione 1 (KB opzionale) gestisce questo per design. Il coach vede nella Console quale apertura ha copertura KB (indicatore visivo) e quale no. Questo crea anche un incentivo a costruire il database progressivamente.

---

## 10. ROADMAP DI SVILUPPO DELLA KNOWLEDGE BASE

### Fase KB-0 — Prototipo già esistente (completato)

Campo `contestoStrategico` nella Console Coach: textarea opzionale dove il coach incolla manualmente 2-3 paragrafi dal manuale. Iniettato nel Passo 3 con regole anti-plagio.

**Valore:** permette di testare se il contesto strategico migliora la qualità delle lezioni, prima di costruire l'infrastruttura completa.

**Limite:** non è scalabile (copia manuale), non è strutturato, non è indicizzato per posizione.

### Fase KB-1 — Schema Firestore + Ingestion UI (prossima)

- Definizione schema Firestore `knowledgeChunks`
- Pagina `IngestionPage` (`#/ingestion`): upload foto, preview estrazione Vision, conferma, salva
- Prompt Vision per estrazione strutturata
- Calcolo FEN via chessops da sequenzaMosse estratte
- Visualizzazione scacchiera nella preview per verifica visiva

### Fase KB-2 — Retrieval nella pipeline

- In `openingEnricher.js`: query Firestore per ogni FEN del percorso apertura
- Chunk trovati aggiunti al `materials` package come `knowledgeChunks`
- Nel prompt `openingBuildPrompt.js`: sezione condizionale per chunk KB con regole anti-plagio
- Indicatore visivo in Console Coach: "KB disponibile" / "KB assente" per l'apertura richiesta

### Fase KB-3 — Raffinamento ingestion

- Gestione chunk duplicati (stessa FEN, diversa fonte)
- Merge chunk da stessa pagina con posizioni multiple
- Import Modalità C: parser PGN annotato → chunk automatici
- Ricerca e gestione chunk esistenti (visualizza, modifica, elimina)

### Fase KB-4 — Pipeline dipendente (futuro)

Quando la Knowledge Base sarà sufficientemente ricca (copertura delle principali aperture usate negli scopi dell'app), passaggio a Opzione 2: la pipeline segnala le aperture senza copertura KB e il coach viene invitato ad arricchire il database prima di generare la lezione.

---

## 11. METRICHE DI QUALITÀ

Come misurare se la Knowledge Base migliora effettivamente le lezioni:

**A. Test A/B manuale (breve termine)**
- Generare la stessa lezione con e senza KB attiva
- Coach rivede e valuta la profondità strategica delle domande e dei feedback
- Questa è la fase attuale con `contestoStrategico`

**B. Feedback studenti (medio termine)**
- Confrontare le stelle assegnate agli step nelle lezioni con KB vs senza KB
- Pattern atteso: step con KB ricevono meno "Difficile" e più "Ok/Facile" perché le spiegazioni sono più chiare

**C. Qualità delle domande (qualitativo)**
- Una domanda generata con KB: "Il Nero ha appena giocato ...a6. Quale scopo ha questa mossa rispetto al piano del Bianco con 4.Aa4?"
- Una domanda generata senza KB: "Perché il Nero gioca ...a6?"
- La differenza è nella contestualizzazione strategica — la KB la rende possibile.

---

*NeuroScacchi 3.0 — Documento riservato. Tutti i diritti riservati.*
