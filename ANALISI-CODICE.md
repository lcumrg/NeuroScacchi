# ANALISI-CODICE.md — Analisi codice vs ROADMAP

*Generata automaticamente il 2026-03-13 durante la sessione di sviluppo.*

Questo documento analizza le discrepanze tra ciò che la ROADMAP descrive come design/architettura e ciò che il codice implementa effettivamente. Non è un audit di qualità del codice, ma una mappa delle divergenze da considerare nelle decisioni future.

---

## CRITICO

### 1. Fase 2 marcata DA FARE, ma il player è completamente implementato

**ROADMAP (prima di questa sessione):** Fase 2 — DA FARE
**Codice reale:** `PlayerPage.jsx` implementa tutti i tipi di step (intent, detective, candidate, move, text, demo), freeze, transizioni animate, FreezeOverlay, feedback panel, schermata completamento.

**Risolto in questa sessione:** Fase 2 aggiornata a COMPLETATA nel ROADMAP.

---

### 2. lessonStore.js: `markAsApproved` salva `status: 'published'` ma LessonsPage cercava `status === 'published'` solo

**File:** `src/engine/lessonStore.js` (riga 47), `src/pages/LessonsPage.jsx`
**Problema:** `markAsApproved` imposta `status: 'published'`, ma il check in LessonsPage era `lesson.status === 'published'` — il che è corretto. Tuttavia lo schema in `lessonSchema.js` (riga 8) definisce `STATUSES = ['draft', 'published']` — non esiste il valore `'approved'`.

**Attenzione:** Il sistema prompt nell'esempio JSON usa `"status": "draft"` che è corretto. Ma la stringa `"approved"` usata in alcuni badge UI (aggiunta in questa sessione in LessonsPage) non corrisponde ai valori dello schema. Il badge viene mostrato se `status === 'published' || status === 'approved'` — il secondo branch è difensivo ma non corrisponde a un valore reale.

**Azione raccomandata:** Decidere se aggiungere `'approved'` come stato valido nello schema, o tenere solo `'published'` (cambiando il badge text in "Pubblicata").

---

### 3. sfAnalysisService.js usa `sf._sendAnalysis()` — metodo privato

**File:** `src/engine/sfAnalysisService.js`
**Problema:** Per valutare la qualità della mossa corretta, il servizio chiama `sf._sendAnalysis()` direttamente (metodo privato con underscore). Se l'interfaccia di `StockfishService` cambia, si rompe silenziosamente. Il metodo non è esportato come API pubblica.

**Alternativa:** Usare `sf.evaluate()` con `position fen X moves Y` costruendo il FEN risultante prima via chessops, o aggiungere un metodo pubblico `evaluateAfterMove(fen, move)` a `StockfishService`.

---

### 4. ConsolePage: `handleGenerate` aveva `selectedModel` mancante nelle dipendenze `useCallback`

**File:** `src/pages/ConsolePage.jsx`
**Problema (pre-fix):** `handleGenerate` passava `model: selectedModel` alla chiamata, ma `selectedModel` era assente dall'array di dipendenze del `useCallback`. Questo causava una closure stale su `selectedModel`.

**Risolto in questa sessione:** `selectedModel` aggiunto alle dipendenze.

---

## ATTENZIONE

### 5. PlayerPage: `phase === 'transition'` non è gestito nella logica, ma usato solo nella UI

**File:** `src/pages/PlayerPage.jsx`
**Problema:** `advanceAfterFeedback()` imposta `setPhase('transition')` prima di `runTransition`, ma la state machine non include 'transition' come fase gestita nei check `isBoardInteractive` e `isDetectivePhase`. La transizione funziona, ma il tipo di fase è usato solo per mostrare il messaggio "Prossima posizione..." — non previene l'interazione durante la transizione (il board diventa viewOnly per effetto collaterale perché phase !== 'activity').

**Nota:** Funziona correttamente in pratica, ma la state machine non è documentata/esplicita.

---

### 6. ROADMAP Fase 1A: il database puzzle Lichess NON è usato come descritto

**ROADMAP descrive:** "L'IA attinge dal database puzzle Lichess per proporre posizioni adeguate al livello"
**Codice reale:** `fetchCandidatePuzzles` in `aiService.js` *prova* a recuperare dal database, ma fallisce silenziosamente (catch→return []) e il prompt include comunque la richiesta "usa posizioni classiche". La piattaforma del database (`puzzleDatabase.js`) ha `getRandomPuzzles` / `getOpeningPuzzles`, ma non è garantita la presenza del database SQLite locale.

**Impatto:** L'IA genera posizioni dalla propria conoscenza, non dal database — il che è uno dei rischi principali identificati nella ROADMAP ("l'IA sbaglia sugli scacchi").

---

### 7. `validateMovesWithChessService` è nominata "sfValidation" ma non usa Stockfish

**File:** `src/pages/ConsolePage.jsx`
**Problema di naming:** Lo stato si chiama `sfValidation` e i props si chiamano `sfValidation`, ma la funzione usa `chessService.legalDests()` (chessops) — non Stockfish. Questo genera confusione: la validazione attuale identifica mosse illegali via chessops, non qualità delle mosse via SF.

**Suggerimento:** Rinominare in `movesValidation` o `chesopsValidation`, oppure integrare il vero `sfAnalysisService` (aggiunto in questa sessione) nel flusso.

---

### 8. LessonViewer: `step.options` — check `correctOption`/`correctIndex` non corrisponde allo schema

**File:** `src/components/LessonViewer.jsx` (riga 81)
**Problema:** La logica per evidenziare l'opzione corretta usa `step.correctOption === opt || step.correctIndex === i`, ma lo schema definisce che la correttezza è `option.correct === true` (campo nel singolo oggetto opzione, non nella step). I campi `correctOption` e `correctIndex` non esistono nello schema v3.

**Azione:** Correggere il check in LessonViewer a: `opt.correct === true`.

---

### 9. PlayerPage: `handleCandidateComplete` controlla `allValid` ma non `requiredCount`

**File:** `src/pages/PlayerPage.jsx` (riga 194)
**Logica:**
```js
const allValid = moves.every(m => candidateList.includes(m))
```
Se lo studente invia 3 mosse tutte valide ma `requiredCount` è 2, va comunque avanti. Questo è *corretto per design* (si può trovare più del minimo), ma il feedback "Alcune mosse non erano tra le candidate" viene mostrato se UNA qualsiasi mossa non è nella lista — anche se le altre `requiredCount` mosse erano corrette.

**Effetto pratico:** Con le modifiche di questa sessione, `CandidateActivity` mostra già in giallo le mosse non-candidate. PlayerPage accetta qualsiasi insieme purchè tutte siano nella lista. Questo è coerente ma la UX potrebbe essere migliorata con feedback parziale.

---

### 10. ROADMAP descrive Calibrazione fiducia, Metacognizione, Feedback graduato — nessuno implementato nel player

**ROADMAP Fase 5 (modulari):** Calibrazione fiducia, domande metacognitive, feedback graduato via SF.
**Codice reale:** `lesson.config` ha i campi (`confidenceCalibration.enabled`, `metacognition.enabled`, `graduatedFeedback.enabled`) ma il PlayerPage non li legge né attiva comportamenti diversi. Sono configurabili nel JSON ma ignorati a runtime.

**Priorità:** Bassa (Fase 5 è futura per design), ma è importante saperlo quando si testa il flusso.

---

### 11. `lessonSchema.js` — `STATUSES` non include 'approved'

Come notato nel punto 2: lo schema definisce `['draft', 'published']` ma la UI gestisce anche `'approved'`. Questo crea un warning di validazione se una lezione viene salvata con `status: 'approved'`. In pratica `markAsApproved` imposta `'published'` quindi non è un problema attuale, ma il codice UI è difensivo su un valore non possibile.

---

### 12. `createStep` in lessonSchema include `configOverrides: null` e `transition: null` per default

**File:** `src/engine/lessonSchema.js`
**Nota:** I template degli step includono `transition: null`, ma `validateTransition(null, ...)` lo accetta (ritorna immediatamente). Tuttavia, il validator FEN check al passo 312 avvisa che uno step non-ultimo senza transizione è un warning. Questo è coerente con il comportamento inteso (la transizione è opzionale ma raccomandata), ma il default a `null` in `createStep` può indurre il coach a creare step senza transizione.

---

### 13. `MoveActivity.jsx` — non ha logica UI, solo shell

**File:** `src/components/player/MoveActivity.jsx` (non ancora letto ma inferibile dal PlayerPage che non vi passa props rilevanti)
**Nota:** L'attività 'move' è gestita principalmente in `PlayerPage.handleBoardMove`. `MoveActivity` viene renderizzato senza feedback intermedio, solo come placeholder "esegui la mossa sulla scacchiera".

---

## NOTA

### 14. ROADMAP Sezione 4: "Funzionamento offline" via Service Worker — non implementato

**ROADMAP:** "Stockfish WASM (~7MB) e le lezioni scaricate vengono messe in cache via Service Worker (architettura PWA)"
**Codice:** Nessun service worker, nessun manifest PWA. L'app funziona solo online (anche se SF è una risorsa statica nel bundle).

---

### 15. ROADMAP: "l'IA non è affidabile sugli scacchi — l'IA bozza, Stockfish valida"

**ROADMAP:** Descrive il ciclo a tre intelligenze come fondamentale.
**Codice:** Stockfish analizza la posizione nella ConsolePage tramite StockfishPanel (per il coach), ma non è integrato nella pipeline di generazione per validare/correggere automaticamente le mosse generate dall'IA. Il flusso è: IA genera → chessops valida mosse legali → coach rivede. Manca il loop: SF analizza qualità mosse → eventuale correzione automatica → coach vede risultato validato.

**Questo è esplicitamente in Fase 1A "ancora mancante" — ora documentato in ROADMAP.**

---

### 16. `aiService.js`: `fetchCandidatePuzzles` per 'aperture' usa `getOpeningPuzzles` — non testato

**File:** `src/engine/aiService.js`, `src/engine/puzzleDatabase.js`
**Nota:** Il tema 'aperture' richiede `puzzleDatabase.getOpeningPuzzles()`. Se il database non è presente/inizializzato, il catch restituisce `[]` silenziosamente. Non c'è UI feedback all'utente che i puzzle candidati non sono stati trovati.

---

### 17. `App.jsx`: Nav link "Player" punta direttamente a `#/player` senza lezione selezionata

**File:** `src/App.jsx`
**Problema:** Il link "Player" nella nav porta a `#/player` ma `PlayerPage` legge `sessionStorage.getItem('ns3_selected_lesson_id')`. Se si naviga direttamente, l'errore "Nessuna lezione selezionata." appare — comportamento corretto ma il link nella nav è fuorviante. L'accesso al player dovrebbe essere solo da LessonsPage.

**Suggerimento:** Rimuovere il link "Player" dalla nav o nasconderlo quando non c'è una lezione attiva.

---

### 18. ROADMAP cita "Opening Explorer di Lichess" — non integrato

**ROADMAP:** "l'IA attinge dall'Opening Explorer di Lichess per dati statistici sulle aperture"
**Codice:** Nessuna chiamata all'Opening Explorer API di Lichess. Il tema 'aperture' usa solo il database puzzle locale.

---

### 19. Transizione `demo` step: `DemoActivity` gestisce il FEN tramite callback in PlayerPage, ma `demoMoveIndexRef` non è resettato se si torna indietro

**File:** `src/pages/PlayerPage.jsx`
**Nota minore:** `demoMoveIndexRef.current = 0` viene resettato nello `useEffect` su `stepIndex`, quindi è corretto. Non è un bug attivo.

---

### 20. `FreezeOverlay` non mostra il titolo della lezione prominentemente

**ROADMAP Task 7** richiedeva "la freeze countdown dovrebbe mostrare il titolo della lezione più prominentemente". L'implementazione attuale mostra solo il countdown e "Osserva la posizione...". Il titolo della lezione è nell'header sopra, non nell'overlay stesso.

**Priorità:** Bassa/cosmetical — l'header del player mostra già il titolo.

---

## Riepilogo per priorità

| # | Tipo | Azione immediata |
|---|------|-----------------|
| 3 | CRITICO | Evitare uso di `sf._sendAnalysis()` in sfAnalysisService — refactor |
| 2 | CRITICO | Allineare valore `'approved'` tra schema e UI (o rimuovere) |
| 8 | ATTENZIONE | Correggere check `correctOption`/`correctIndex` in LessonViewer |
| 7 | ATTENZIONE | Rinominare `sfValidation` in `movesValidation` (Fase 1A) |
| 6 | ATTENZIONE | Database puzzle: feedback visibile all'utente se non disponibile |
| 17 | NOTA | Link "Player" nella nav — rimuovere o condizionare |

---

*Fine analisi. Prossimo aggiornamento raccomandato dopo Fase 1B (integrazione SF nel flusso generazione).*
