import { useState } from 'react'
import './AnalisiPage.css'

// ═══════════════════════════════════════════════════════════
// ANALISI — documenti di riflessione strategica
// ═══════════════════════════════════════════════════════════

const ANALISI = [
  {
    id: 'a2',
    date: '2026-03-16',
    title: 'Knowledge Pipeline — analisi del documento + applicazione a NeuroScacchi',
    tags: ['knowledge base', 'pipeline', 'qualità', 'architettura'],
    body: `
## Il documento in sintesi

Il documento "Knowledge Pipeline v1.1" propone di dotare l'IA di NeuroScacchi di una base di conoscenza scacchistica costruita da materiale umano esperto — manuali, partite commentate, analisi di GM. L'architettura prevede:

- **Bot Telegram** come interfaccia di ingestion: foto di pagine → Claude Vision (OCR intelligente) → PGN validato con python-chess → database
- **Albero di posizioni** (non di partite): ogni nodo rappresenta una posizione FEN, accumula commenti da più fonti
- **Commenti multipli** sulla stessa posizione come risorsa, non problema: arricchiscono anziché sovrascriversi
- **Tutto nel prompt** (Approccio A) come punto di partenza: il materiale rilevante viene iniettato nel system prompt di Claude al momento della generazione della lezione
- Il **coach resta il filtro**: l'IA produce bozze, il coach revede e adatta prima che lo studente veda qualcosa

L'intuizione centrale è questa: un LLM non calcola varianti, ragiona su concetti. Se gli forniamo materiale umano già validato, diventa un traduttore tra il motore (sa ma non spiega) e il linguaggio didattico.

---

## Cosa si allinea perfettamente con NeuroScacchi attuale

**L'architettura "IA fa pedagogia, sistema fa scacchi"** — introdotta dopo la crisi di marzo 2026 ("l'IA non sa fare scacchi") — è esattamente la stessa filosofia del documento. Buon segno: le due riflessioni convergono indipendentemente.

**Il coach come filtro** — la lezione monolitica, curata, non è una conversazione con un chatbot. Già così in NeuroScacchi.

**La validazione con python-chess** — nella pipeline attuale usiamo chessops (JavaScript) per lo stesso scopo: calcolo deterministico delle FEN, validazione mosse. Il documento propone python-chess (Python) per il bot Telegram. Stessa filosofia, strumenti diversi per contesti diversi — coerente.

**Tutto nel prompt come punto di partenza** — è esattamente l'Approccio A già usato oggi (Explorer data + SF analysis iniettati nel system prompt). La Knowledge Pipeline estenderebbe questo con la narrativa umana esperta.

---

## Cosa non è aggiornato o è impreciso rispetto al progetto

**Il framework pedagogico citato — Detective → Intento → Profilassi → Metacognizione** — non corrisponde ai tipi di step implementati in NeuroScacchi 3.0. I tipi attuali sono: `intent`, `detective`, `candidate`, `move`, `text`, `demo`. "Profilassi" e "Metacognizione" non esistono come step type. Il documento sembra derivare da una versione precedente o parallela del framework. Prima di usare questo schema nel prompt di generazione, bisogna decidere se quei concetti si mappano su step esistenti o se richiedono nuovi tipi.

**Lo schema del prompt in sezione 2.3** produce una "lezione narrativa" — testo discorsivo da revisionare. La pipeline attuale produce JSON strutturato v3.0.0 che il player esegue direttamente. Questi due output sono incompatibili. Bisogna chiarire: la Knowledge Pipeline alimenta la generazione di JSON strutturati (come oggi), o introduce un passaggio intermedio di "bozza narrativa" che il coach poi traduce in JSON? Sono flussi molto diversi.

**Il documento non menziona Lichess Explorer** — uno degli input più ricchi che già abbiamo (statistiche reali di milioni di partite, winrate, frequenza per ogni mossa a ogni posizione). La Knowledge Pipeline si aggiungerebbe a questo, non lo sostituirebbe.

**"Aperture" come focus esclusivo** — il documento ragiona principalmente sulle aperture. Ma il database NeuroScacchi già ha 4.7 milioni di puzzle tattici Lichess. La Knowledge Pipeline per la tattica sarebbe diversa: non "commenti di manuali" ma forse "spiegazione del pattern tattico" per ogni tema (forchetta, inchiodatura, ecc.). Non viene affrontato.

---

## L'insight più prezioso

**L'albero delle posizioni con commenti multipli** è l'idea più originale e potente del documento. Non è ovvia. La struttura naturale che viene in mente per i dati di apertura è "lista di PGN". Ma la struttura giusta è un albero dove ogni nodo-posizione accumula prospettive da più autori. Questo ha una conseguenza pratica enorme: la Ruy Lopez spiegata da Kasparov, da Kortschnoj, e da un libro didattico italiano dà tre angolature diverse sulla stessa mossa. L'IA le integra e il coach sceglie quale enfatizzare per quel preciso studente.

Nessun singolo manuale può dare questo. È qualcosa che solo un sistema come questo può costruire nel tempo.

---

## Riserve e dubbi tecnici

**1. Volume del contesto per apertura**
"Tutto nel prompt" funziona se il materiale per una singola apertura entra nel context window senza dominarlo. Ma se carichiamo commenti da 3-5 libri su ogni variante della Ruy Lopez, quanti token diventano? La Ruy Lopez ha decine di varianti principali. Potremmo facilmente superare 30.000-50.000 token di solo materiale. Bisogna definire un criterio di selezione: quali nodi dell'albero caricare in base alla lezione richiesta.

**2. La chiave del nodo**
Il documento lo lascia aperto: sequenza di mosse? Hash FEN? ECO + variante? Questa decisione ha conseguenze importanti. La FEN è la più robusta (identificazione univoca della posizione indipendente dal percorso) ma esclude il contesto di come ci si è arrivati. La sequenza di mosse è più leggibile ma può essere ambigua (trasposizioni). Raccomandazione: FEN come chiave tecnica (identificazione univoca) + sequenza di mosse come campo descrittivo.

**3. Notazione italiana → inglese**
I libri italiani usano: C = Cavallo (N), A = Alfiere (B), T = Torre (R), D = Donna (Q), R = Re (K). La conversione non è banale se il prompt non è scritto bene: "C" in italiano potrebbe essere letto come cattura in contesti PGN. Il prompt di trascrizione deve essere molto preciso su questo punto e va testato accuratamente prima di usarlo in produzione.

**4. Copyright**
Trascrivere testi protetti da copyright in un database digitale è legalmente ambiguo anche per uso personale in alcuni paesi. Non è un blocco per uso interno e didattico personale, ma vale la pena esserne consapevoli se il sistema dovesse crescere.

**5. Il bot Telegram come infrastruttura critica**
Il Mac mini con Tailscale è una scelta pragmatica ma introduce un punto di fragilità (il Mac deve essere acceso, Tailscale deve funzionare). Per il prototipo va benissimo. Per uso continuativo con collaboratori esterni, la dipendenza dall'hardware locale è rischiosa.

**6. Strategia "prima il digitale"**
La sezione 3.4 è saggia: prima di scansionare un manuale, cercare le partite su 365chess.com, chessgames.com o database Lichess. Questo riduce drasticamente il rischio di errori OCR nella notazione. Vale la pena farne un principio operativo esplicito nel flusso.

---

## Domande aperte a cui devi rispondere

**Sequencing — quando costruire questo?**
La Knowledge Pipeline è un investimento significativo di tempo (bot, schema dati, ingestion di più libri). La domanda è: siamo già al punto in cui la mancanza di narrativa strategica è il principale limite della qualità delle lezioni? O ci sono prima altri problemi da risolvere nella pipeline attuale?

**Il passaggio "bozza narrativa" vs "JSON diretto"**
Vuoi che la Knowledge Pipeline alimenti direttamente la generazione di JSON v3.0.0 (continuità con il sistema attuale), oppure immagini un passaggio intermedio dove l'IA produce una bozza testuale che il coach legge e poi trasforma in lezione strutturata? Sono due prodotti diversi con implicazioni molto diverse sull'UX della console coach.

**Quali fonti e in che lingua?**
Il documento menziona Kasparov, Kotronias, Avrukh — tutti in inglese. I manuali italiani di aperture esistono ma sono più rari. La base di conoscenza sarà principalmente in inglese con commenti tradotti in italiano, o vuoi fonti originali italiane?

**"Profilassi" e "Metacognizione" — fanno parte del piano?**
Il documento usa questi due concetti pedagogici come fondamentali. In NeuroScacchi 3.0 non esistono come step type. Sono in programma? Se sì, la Knowledge Pipeline dovrebbe essere progettata tenendo conto di questi step futuri. Se no, il prompt di sezione 2.3 va adattato ai tipi esistenti.

**Chi sono i collaboratori esterni?**
Il documento apre questa possibilità in modo vago. Hai in mente persone specifiche? Cambierebbe il design del bot (es. autenticazione, quale bot Telegram, quanta autonomia dare ai collaboratori).

---

## Raccomandazione di sequenza

Prima di costruire il bot Telegram, c'è un esperimento a costo zero che valida il concetto:

1. Prendi una variante dell'apertura che già generi (es. Ruy Lopez, variante Berlinese)
2. Scrivi manualmente un documento di 500-800 parole con: idee tipiche di entrambi i colori, piano strategico del Bianco, errori classici del Nero, 2-3 posizioni chiave spiegate a parole
3. Iniettalo nel system prompt come sezione aggiuntiva ("Contesto strategico da fonte esperta")
4. Genera la stessa lezione con e senza questo contesto
5. Confronta la qualità

Se la differenza è evidente, l'investimento nella pipeline è giustificato. Se è marginale, c'è qualcos'altro che limita la qualità.

Questo esperimento richiede un'ora di lavoro, non settimane. Fallire velocemente è più utile che costruire una pipeline per qualcosa che non risolve il problema reale.
    `.trim(),
  },
  {
    id: 'a1',
    date: '2026-03-16',
    title: 'Qualità massima delle lezioni — cosa separa NeuroScacchi da un maestro',
    tags: ['visione', 'pedagogia', 'qualità'],
    body: `
## Il punto di partenza

NeuroScacchi ha senso di esistere solo se rivaleggia con un maestro di scacchi o con un manuale di qualità — senza il problema del costo o della fatica di leggere centinaia di pagine.

---

## Cosa rende un maestro insostituibile

Un buon maestro non mostra mosse. **Cambia come vedi la scacchiera.** Dopo una lezione con un grande insegnante non ricordi "e4 è meglio di d4 in questa posizione" — ricordi un principio che puoi applicare in mille posizioni diverse che non hai mai visto.

Un buon manuale fa la stessa cosa: usa posizioni specifiche per illustrare principi generali. Il principio resta, la posizione è solo il veicolo.

**Il gap attuale:** il sistema trova una posizione e chiede all'IA di costruirci sopra una domanda. È il contrario di come lavora un maestro. Un maestro parte dal principio e cerca la posizione migliore per illustrarlo.

---

## Dove siamo forti, dove siamo deboli

**NeuroScacchi può battere un maestro e un manuale su:**
- L'interattività — devi *dimostrare* di capire, non solo leggere
- La pazienza — nessun giudizio, nessuna fretta
- Il feedback immediato
- Il freeze — forza l'osservazione prima dell'azione (nessun manuale può farlo)

**Dove oggi falliamo:**

**1. Profondità concettuale** — Le spiegazioni restano in superficie. "Esatto! La mossa colpisce due pezzi" vs quello che direbbe un maestro: "Questo è il motivo per cui il Cavallo su d5 è così pericoloso nelle posizioni Siciliane — controlla quattro case nell'area del Re nero e non può essere attaccato da pedoni. Tienilo a mente ogni volta che vedi questa struttura di pedoni."

**2. Il contesto strategico manca** — L'IA riceve una FEN e dati Stockfish. Non riceve le *idee strategiche* della posizione. Stockfish sa che una mossa è +0.8, ma non sa *perché* quella struttura è favorevole o quali sono i piani tipici.

**3. Nessun curriculum** — Ogni lezione è un'isola. Un maestro costruisce, lezione dopo lezione, un repertorio mentale coerente. NeuroScacchi non sa cosa lo studente ha già visto.

**4. Le domande allenano il riconoscimento, non la comprensione** — "Perché questa mossa?" è buona. Ma un maestro farebbe anche: "Cosa succede se il Nero non gioca così? Quali sono le debolezze strutturali che rimangono? Questa struttura ti ricorda qualcosa?"

---

## Dove sta il vero leverage sulla qualità

Il modello IA (Claude vs Gemini) è il **fattore meno importante**. Il fattore più importante è **cosa dai in input all'IA**.

Oggi l'IA riceve:
- FEN calcolate da chessops ✓
- Analisi Stockfish (eval, topMoves) ✓
- Dati Explorer Lichess (frequenza, winrate) ✓
- System prompt pedagogico ✓

Quello che **manca** per arrivare a livello maestro:
- **La narrativa strategica** dell'apertura — le idee tipiche, i piani per entrambi i colori, i motivi ricorrenti, gli errori classici
- **Il collegamento ai principi generali** — questa posizione illustra quale principio? "sviluppo rapido", "controllo centro", "coordinazione pezzi"?
- **Il profilo dello studente** — cosa ha già visto? dove sbaglia di solito?

---

## La domanda strategica centrale

Prima di decidere qualsiasi tecnologia, il vero problema di design è:

**Chi o cosa fornisce la narrativa strategica?**

**Opzione A — Il coach la scrive:** annota ogni apertura con le idee chiave, i piani tipici, gli errori comuni. L'IA usa quella narrativa per costruire la lezione. Qualità altissima, scalabilità zero.

**Opzione B — L'IA la genera:** produce la narrativa strategica da sola. Conveniente, ma rischio di genericità o imprecisioni su dettagli scacchistici sottili.

**Opzione C — Fonti esterne certificate:** database di annotazioni di partite di maestri, libri in formato strutturato. L'IA attinge da materiale autorevole.

---

## Cosa significherebbe "livello maestro" concretamente

Una lezione di livello maestro per il Ruy Lopez **non è:**
> "Ecco la mossa Af1b5. Perché il Bianco gioca così? A) Attacca il cavallo B) Controlla il centro C) Libera l'alfiere"

**È:**
> *[freeze 3 secondi — osserva la posizione]*
> "Il Bianco ha sviluppato, ha arroccato, il Re è al sicuro. Il Nero ha il centro ma il Re non è sicuro. L'Alfiere su b5 crea una pressione invisibile — non è ancora una cattura, è una minaccia latente. Il Bianco dice: devo affrontare il cavallo che difende il centro, altrimenti il Nero consolida. Questa è la filosofia della Ruy Lopez: non attaccare subito, creare tensione e aspettare."

Quella seconda versione richiede che qualcuno — coach, libro, o IA con il contesto giusto — sappia *raccontare* la posizione, non solo analizzarla.

---

## Domande aperte da decidere

1. **La narrativa strategica viene scritta dal coach o generata dall'IA?** Le due strade hanno implicazioni di qualità e scalabilità opposte.

2. **Il curriculum è nel piano?** Senza di esso anche lezioni perfette costruiscono un mosaico senza cornice.

3. **Chi è lo studente ideale?** Un bambino di 8 anni ha bisogno di qualcosa di diverso da un adulto di 30 che inizia. La risposta cambia il design delle lezioni.

*Queste tre domande guidano tutto il resto — tecnologia inclusa.*
    `.trim(),
  },
]

// ═══════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════

function AnalisiEntry({ a }) {
  const [open, setOpen] = useState(true)

  // Minimal markdown: **bold**, ## heading, --- hr, - list, \n\n paragraph
  function renderMarkdown(text) {
    const lines = text.split('\n')
    const elements = []
    let key = 0
    let i = 0

    while (i < lines.length) {
      const line = lines[i]

      // Heading
      if (line.startsWith('## ')) {
        elements.push(<h3 key={key++} className="an-h3">{line.slice(3)}</h3>)
        i++; continue
      }

      // HR
      if (line.trim() === '---') {
        elements.push(<hr key={key++} className="an-hr" />)
        i++; continue
      }

      // List item
      if (line.startsWith('- ') || line.startsWith('**')) {
        // Collect consecutive list-like lines
        const block = []
        while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('**'))) {
          block.push(lines[i])
          i++
        }
        elements.push(
          <ul key={key++} className="an-ul">
            {block.map((l, li) => (
              <li key={li} dangerouslySetInnerHTML={{ __html: renderInline(l.startsWith('- ') ? l.slice(2) : l) }} />
            ))}
          </ul>
        )
        continue
      }

      // Empty line
      if (line.trim() === '') { i++; continue }

      // Blockquote
      if (line.startsWith('> ')) {
        const block = []
        while (i < lines.length && lines[i].startsWith('> ')) {
          block.push(lines[i].slice(2))
          i++
        }
        elements.push(
          <blockquote key={key++} className="an-blockquote">
            {block.map((l, li) => <p key={li} dangerouslySetInnerHTML={{ __html: renderInline(l) }} />)}
          </blockquote>
        )
        continue
      }

      // Paragraph
      elements.push(
        <p key={key++} className="an-p" dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
      )
      i++
    }

    return elements
  }

  function renderInline(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
  }

  return (
    <div className={`an-entry${open ? ' open' : ''}`}>
      <div className="an-entry-header" onClick={() => setOpen(o => !o)}>
        <div className="an-entry-meta">
          <span className="an-entry-date">{a.date}</span>
          {a.tags.map(t => <span key={t} className="an-tag">{t}</span>)}
        </div>
        <div className="an-entry-title-row">
          <h2 className="an-entry-title">{a.title}</h2>
          <span className="an-toggle">{open ? '▴' : '▾'}</span>
        </div>
      </div>
      {open && (
        <div className="an-entry-body">
          {renderMarkdown(a.body)}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════

export default function AnalisiPage() {
  return (
    <div className="an-page">
      <div className="an-inner">
        <header className="an-header">
          <h1 className="an-header-h1">Analisi</h1>
          <p className="an-header-sub">Riflessioni strategiche, valutazioni tecniche, decisioni aperte. Da leggere con calma prima di rispondere.</p>
        </header>
        <div className="an-list">
          {ANALISI.map(a => <AnalisiEntry key={a.id} a={a} />)}
        </div>
      </div>
    </div>
  )
}
