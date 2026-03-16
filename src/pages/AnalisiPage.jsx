import { useState } from 'react'
import './AnalisiPage.css'

// ═══════════════════════════════════════════════════════════
// ANALISI — documenti di riflessione strategica
// ═══════════════════════════════════════════════════════════

const ANALISI = [
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
