# Design e UX per bambini — Analisi e linee guida

*NeuroScacchi 3.0 — Documento riservato*

---

## Contesto

I test con i bambini (8–12 anni) confermano che l'aspetto grafico è un fattore decisivo di engagement, motivazione e percezione della qualità. Un buon contenuto presentato male appare come un cattivo contenuto. L'interfaccia attuale ha una base tecnica solida ma un aspetto corporate e freddo — progettato inconsciamente per adulti.

Questo documento raccoglie l'analisi completa dello stato attuale e le linee guida di intervento per la Fase 2bis.

---

## 1. Stato attuale — fotografia

### Stack CSS
- CSS custom properties puro, zero Tailwind
- Font: **Nunito** (400–800) + Atkinson Hyperlegible (fallback accessibilità) + JetBrains Mono (codice)
- Tema chiaro e scuro già supportati via `[data-theme]`
- Responsive mobile-first con breakpoint a 600, 768, 900, 960, 1024px
- Animazioni: fadeIn, shake, pulse, slideUp, progress — tutte via keyframe CSS

### Palette attuale

| Ruolo | Valore | Problema |
|---|---|---|
| Primario | `#283593` (blu indigo) | Freddo, corporate, poco invitante |
| Sfondo | `#F8F9FA` | Neutro, ok |
| Case chiare scacchiera | `#E8E8E8` | Grigio anonimo, non richiama gli scacchi fisici |
| Case scure scacchiera | `#B8B8B8` | Grigio anonimo |
| Freeze overlay | `rgba(40,53,147,0.82)` | Scuro e oppressivo |
| Feedback positivo | `#E8F5E9` | Verde pallido, poco celebrativo |

### Problemi identificati (in ordine di impatto)
1. Nessuna gamification visiva — nessuna risposta emotiva al successo
2. Palette corporate, fredda, monocromatica
3. Scacchiera grigia — non richiama gli scacchi fisici
4. Attività visivamente indistinguibili tra loro
5. FreezeOverlay oppressivo invece che preparatorio
6. Nessuna differenziazione visiva per tipo di attività
7. Label troppo piccole (0.65–0.7rem) per bambini
8. Bottoni piatti, senza respiro

---

## 2. Il problema della visualizzazione mentale della scacchiera

### Il problema

Quando un testo dice *"il Cavallo su c3 controlla d5"*, il bambino deve compiere tre operazioni cognitive in sequenza:
1. Decodificare "c3" come coordinata
2. Localizzare c3 sulla scacchiera (mapping visivo)
3. Trovare il Cavallo lì
4. Capire l'influenza su d5

Solo il punto 4 è l'obiettivo didattico. I punti 1–3 sono **carico cognitivo parassitico** — consumano risorse mentali senza produrre comprensione scacchistica.

Questo è l'**effetto di attenzione divisa** (Sweller, Cognitive Load Theory): quando informazione verbale e visiva sono in posizioni diverse, il cervello deve integrarle mentalmente — operazione costosa che sottrae risorse alla comprensione del contenuto.

### Il principio di contiguità

La soluzione è il **principio di contiguità spaziale**: la parola "c3" nel testo deve essere accompagnata da un evidenziamento visivo della casa c3 sulla scacchiera. Così il bambino non deve fare il mapping — lo vede già fatto. Il carico cognitivo si concentra dove deve: capire *perché* il Cavallo in c3 controlla d5, non *dove* è c3.

### Livelli di implementazione possibili

**Livello 1 — Frecce e cerchi espliciti nel JSON della lezione (già implementato)**
Il sistema `visualAids` nel formato lezione permette già di definire frecce e cerchi per ogni step. Il problema è che l'IA deve generarli correttamente e il coach deve validarli.

```json
"visualAids": [
  { "type": "circle", "square": "c3", "brush": "blue" },
  { "type": "arrow", "orig": "c3", "dest": "d5", "brush": "green" }
]
```

Questo funziona ma è **statico**: le frecce sono sempre visibili per tutta la durata dello step, indipendentemente da cosa sta leggendo il bambino.

**Livello 2 — Highlight contestuale via parsing del testo (nuovo)**
Il sistema rileva automaticamente riferimenti a case (pattern `[a-h][1-8]`) e nomi di pezzi nel testo dello step, e li evidenzia sulla scacchiera mentre il bambino legge. Nessuna configurazione manuale.

Esempio: il testo *"gioca Cf6, difendendo la casa e4"* fa comparire automaticamente:
- Cerchio giallo su f6 (dove va il Cavallo)
- Cerchio arancio su e4 (casa da difendere)

**Livello 3 — Highlight sincrono con lettura (futuro avanzato)**
L'highlight segue il punto di attenzione dell'utente — quando il testo scorra o venga letto, le case evidenziate cambiano. Richiede un sistema di annotazione del testo più ricco.

### Raccomandazione

Implementare il **Livello 1 sistematicamente nei prompt IA**: aggiornare `openingBuildPrompt.js` per richiedere esplicitamente `visualAids` su ogni step con riferimenti a case specifiche. Il Livello 2 è fattibile come feature del player (parsing automatico) e andrebbe aggiunto alla Fase 2bis.

### Colori frecce Chessground

Chessground supporta questi brush natively:
| Brush | Uso suggerito |
|---|---|
| `green` | Mossa corretta / best move SF |
| `red` | Mossa da evitare / errore |
| `blue` | Casa/pezzo da osservare (referimento neutro) |
| `yellow` | Target detective, casa chiave da trovare |
| `paleBlue` | Variante secondaria, alternativa |
| `paleGreen` | Mossa buona ma non ottima |
| `paleRed` | Mossa rischiosa ma giocabile |
| `paleGrey` | Contesto, mossa dell'avversario |

Brush custom si possono definire via CSS su `.cg-custom-svgs`. Utile per aggiungere uno stile "hint" con tratto tratteggiato o animato.

### Applicazione per tipo di attività

| Attività | Frecce/cerchi consigliati |
|---|---|
| **Intent** | Cerchi blu sulle case delle opzioni; frecce verdi sull'opzione corretta dopo la risposta |
| **Detective** | Nessuna freccia prima della risposta (spoilererebbe); cerchio giallo pulsante sulla casa corretta dopo |
| **Candidate** | Frecce paleBlue per ciascuna candidata; freccia green per la best move dopo conferma |
| **Move** | Freccia verde sottile che suggerisce la direzione; sparisce dopo che la mossa è stata eseguita |
| **Demo** | Frecce animate che seguono la sequenza mossa per mossa |
| **Text** | Cerchi blu su tutte le case citate nel testo (parsing automatico) |

---

## 3. Il FreezeOverlay — varianti

### Problema attuale
`rgba(40,53,147,0.82)` è un overlay opaco e scuro che "spegne" la scacchiera. Trasmette blocco e interdizione. Per un bambino è un segnale di "aspetta, non puoi fare niente" invece di "prepara il tuo pensiero".

### Cosa deve comunicare il freeze
Il freeze è il momento più importante del metodo: è quando il bambino ragiona prima di muovere. Visivamente deve dire: *"fermati un secondo, è il momento di pensare"* — non *"sei bloccato"*. La differenza è sottile ma psicologicamente rilevante.

### Varianti da valutare

**A. Vignette soft (consigliata)**
Invece di coprire tutta la scacchiera, scurire leggermente i bordi (vignette) mantenendo i pezzi visibili. Il countdown appare al centro trasparente, come sovrimpresso alla posizione.
```css
background: radial-gradient(
  ellipse at center,
  rgba(0,0,0,0) 40%,
  rgba(20,20,60,0.75) 100%
);
```
Vantaggio: il bambino vede ancora la posizione durante il freeze, può già iniziare a "guardare" mentre conta.

**B. Overlay caldo con tema attività**
Il colore dell'overlay cambia in base al tipo di attività che sta per iniziare. Intent → azzurro, Detective → arancio, Candidate → verde. Il bambino impara ad associare il colore all'attività ancor prima di leggere la domanda.
```css
/* intent */   rgba(25, 100, 180, 0.78)
/* detective */ rgba(200, 80, 20, 0.78)
/* candidate */ rgba(20, 130, 60, 0.78)
/* move */     rgba(90, 30, 160, 0.78)
```

**C. Breathe — overlay con pulsazione lenta**
Overlay leggero (0.5 opacity max) con animazione di "respiro" — si espande e contrae lentamente. Suona quasi come un invito alla calma e alla concentrazione. Il countdown è secondario, il ritmo visivo è la comunicazione principale.
```css
@keyframes breathe {
  0%, 100% { opacity: 0.45; }
  50%       { opacity: 0.65; }
}
```

**D. Countdown circolare**
Sostituire il numero nudo con un cerchio SVG che si svuota progressivamente (come i timer circolari degli quiz online). Più leggibile per bambini, più "gaming". Il numero rimane al centro del cerchio.

**E. Testo motivazionale invece del numero**
Invece di "3… 2… 1…", mostrare testo breve che prepara al tipo di sfida:
- Intent: *"Cosa sta pensando?"*
- Detective: *"Trova il punto chiave…"*
- Candidate: *"Quali mosse hai?"*
- Move: *"Ora esegui…"*

Il countdown rimane visibile ma piccolo, non è più il protagonista.

### Raccomandazione
Combinare **A + B + E**: vignette soft con colore tematico, testo motivazionale per tipo, countdown piccolo in basso. Massimo impatto con minima complessità implementativa.

---

## 4. Tipografia e bottoni

### Problemi attuali

| Elemento | Attuale | Problema |
|---|---|---|
| Label / badge | 0.65–0.7rem | Illeggibili per bambini, troppo piccoli |
| Domanda attività | 1rem bold | Potrebbe essere più grande e più presente |
| Istruzione secondaria | 0.875rem | Ok |
| Bottone primario | 0.95rem, radius 8px | Funzionale ma piatto |
| Bottone secondario | outlined, stesso size | Non si distingue abbastanza |

### Linee guida per bambini 8–12 anni

**Dimensioni minime:**
- Testo leggibile: mai sotto 0.8rem (meglio 0.875rem)
- Label piccole: mai sotto 0.75rem
- Testo interattivo (opzioni, bottoni): minimo 0.9rem

**Domanda dell'attività:**
È l'elemento più importante della schermata — la sfida che il bambino deve affrontare. Attualmente pesa 1rem/700. Proposta: 1.1–1.15rem/800, con un colore più caldo del text-primary generico. Deve "parlare" al bambino, non mimetizzarsi col contesto.

**Bottoni:**
I bottoni attuali sono funzionali ma anonimi. Per bambini servono:
- Border-radius più alto: da 8px a 10–12px (aspetto più "pill-ish", più moderno e amichevole)
- Transform scale su hover/active: `transform: scale(1.04)` — dà l'impressione che il bottone "risponda" al tocco
- Transizione che include transform: `transition: background 0.2s, transform 0.15s`
- Bottone primario: ombra leggera (box-shadow 0 4px 12px rgba(primario, 0.3)) — lo stacca dalla superficie

**Opzioni Intent:**
Sono il cuore dell'interazione più frequente. Attualmente sono rettangoli con bordo sottile. Proposta:
- Border-radius da 8px a 12px
- Padding leggermente aumentato (0.9rem 1.2rem)
- Hover: non solo cambio bordo ma anche `transform: translateX(4px)` — dà l'impressione che l'opzione "si avanzi" verso di te quando la tocchi
- Selected: ombra interna leggera per dare senso di "pressione"

**Font — Nunito è una buona scelta per i bambini** (tondo, amichevole, leggibile). Non cambiare. Eventuale aggiunta: **Fredoka One** o **Baloo 2** solo per i titoli di sezione (più carattere, più "gioco"), ma è opzionale e da valutare dopo il resto.

---

## 5. Palette e color coding attività

### Direzione suggerita

Abbandonare il monocromatismo blu indigo. La nuova palette mantiene la professionalità ma aggiunge calore e identità visiva.

**Colore primario:** invece di un unico primario, il sistema usa il colore del tipo di attività come colore dominante per tutta la schermata di quell'attività.

| Attività | Colore | Hex suggerito | Logica |
|---|---|---|---|
| **Intent** | Azzurro strategico | `#1565C0` | Il pensiero strategico è calmo, profondo |
| **Detective** | Arancio scoperta | `#E64A19` | La scoperta è calda, urgente, investigativa |
| **Candidate** | Verde generazione | `#2E7D32` | La generazione di idee è viva, fertile |
| **Move** | Viola esecuzione | `#6A1B9A` | L'azione è decisa, concreta |
| **Text** | Neutro caldo | `#4E342E` (marrone) | La lettura è tranquilla, contestuale |
| **Demo** | Oro / ambra | `#F57F17` | Il GM che mostra è prezioso, autorevole |

**Sfondo globale:** da `#F8F9FA` (freddo) a qualcosa di leggermente più caldo, es. `#F9F7F4` — quasi impercettibile ma cambia il tono generale.

**Scacchiera:**
Il cambio più semplice e con il maggiore impatto immediato. Il tema `chessground.brown.css` è già importato ma sovrascritto dall'SVG pattern grigio. Basta rimuovere il pattern e lasciare il brown theme di Chessground:
- Case chiare: `#f0d9b5` (beige caldo)
- Case scure: `#b58863` (marrone tradizionale)
Sono i colori usati da Lichess, Chess.com e ogni scacchiera fisica standard. I bambini li riconoscono.

---

## 6. Celebrazioni e feedback emotivo

### Stato attuale
- Risposta corretta: pannello verde pallido con ✓ verde e testo. Nulla di speciale.
- Risposta errata: pannello rosso pallido con ✗ rosso.
- Lezione completata: card bianca con ★ gialla e testo "Ottimo lavoro!". Statico.

### Cosa manca

**Risposta corretta — micro-celebrazione:**
Un bambino di 10 anni che risponde bene ha bisogno di una risposta emotiva immediata. Non serve un fuoco d'artificio, ma serve qualcosa. Proposta:
- Pannello feedback corretto: breve animazione `pop` (scale da 0.95 a 1.05 a 1.0 in 0.3s)
- Bordo con glow leggero: `box-shadow: 0 0 0 3px var(--move-ottima), 0 4px 16px rgba(verde, 0.3)`
- Icona: non il simbolo ✓ ma qualcosa di più espressivo — ♟ animato, oppure la lettera "✓" che "salta in su" con keyframe

**Lezione completata — schermata celebrativa:**
Questa è la schermata che rimane impressa. Deve dare soddisfazione. Proposte:
- Stelle animate che compaiono in sequenza (staggered, 0.2s di delay tra l'una e l'altra)
- Sfondo con pattern CSS di coriandoli (keyframe che muovono elementi decorativi) — realizzabile in puro CSS senza librerie
- Titolo con font-size maggiore (2rem+) e weight 800
- Durata visualizzazione: testo che scala da piccolo a grande (`@keyframes popIn`)

**Risposta errata — feedback senza scoraggiare:**
Lo shake attuale (`@keyframes shake`) è già presente ma va verificato che venga usato. L'overlay rosso non deve essere accusatorio. Il tono visivo è: *"quasi! riprova"* — caldo, non freddo.

---

## 7. Checklist di implementazione — Fase 2bis

In ordine di priorità e impatto:

### Immediato (basso sforzo, alto impatto)
- [ ] Scacchiera: rimuovere SVG pattern grigio, usare marrone Chessground standard
- [ ] Coordinate scacchiera: font-size da 0.7rem a 0.8rem, colore più caldo
- [ ] Label: nessuna label sotto 0.75rem

### Breve termine (medio sforzo, alto impatto)
- [ ] FreezeOverlay: vignette radiale + colore per tipo attività + testo motivazionale
- [ ] Color coding attività: bordo superiore colorato per tipo (4px, colore attività) — implementazione minima che differenzia senza cambiare la struttura
- [ ] Bottoni: border-radius 12px, transform scale su hover/active, ombra sul primario
- [ ] Opzioni Intent: border-radius 12px, hover con translateX(4px)
- [ ] Pannello "Corretto!": animazione pop, glow border

### Medio termine (medio sforzo, medio impatto)
- [ ] Palette: aggiornare variabili CSS in `index.css`; scacchiera marrone/beige
- [ ] Schermata completamento: stelle animate in sequenza, titolo celebrativo
- [ ] Domanda attività: font-size 1.1rem, weight 800, colore per tipo
- [ ] Visual aids sistematici: aggiornare prompt IA per richiedere `visualAids` su ogni step con riferimenti a case

### Lungo termine (più sforzo, completamento sistema)
- [ ] Parsing automatico case nel testo: highlight sulla scacchiera per ogni riferimento `[a-h][1-8]` trovato nel contenuto degli step `text`
- [ ] Brush personalizzati Chessground: stile "hint" tratteggiato per aiuti opzionali
- [ ] Countdown circolare SVG per freeze

---

## 8. Cosa NON fare

- **Cambiare la struttura layout** — funziona, non toccarla
- **Aggiungere audio** — fuori scope, richiede gestione accessibilità e permessi
- **Intervenire sulla Console Coach** — è per adulti, va bene com'è
- **Librerie JS per animazioni** — tutto realizzabile in CSS puro, nessuna dipendenza aggiuntiva
- **Emoji nel testo delle lezioni** — il contenuto didattico deve restare pulito; le emoji appartengono all'UI shell, non al contenuto

---

*Documento creato: 2026-03-14*
*Riferimenti: Sweller (1988) Cognitive Load Theory; Mayer & Moreno (2003) principio di contiguità*
