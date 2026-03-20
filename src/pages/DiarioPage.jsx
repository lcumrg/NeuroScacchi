import { useState } from 'react'
import './DiarioPage.css'

// ═══════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════

const SESSIONS = [
  {
    id: 's0e', date: '2026-03-19/20',
    summary: 'Pannello Sviluppo + AnalisiPage + Knowledge Pipeline + contesto strategico da manuale',
    items: [
      'SviluppoPage: nuovo pannello con sub-nav a schede (Analisi | Diario | Progetto | Feedback) — le pagine esistenti spostate lì, link legacy mantenuti',
      'AnalisiPage: nuova sezione per analisi strategiche articolate con renderer markdown minimale e voci espandibili',
      'Archiviate due analisi: Knowledge Pipeline v1.1 (documento Luca) + valutazione applicazione a NeuroScacchi (Claude)',
      'Fix build: backtick non escaped nelle template literal di AnalisiPage — corretto prima del deploy',
      'openingBuildPrompt + openingPlanPrompt: aggiunta motivazione esplicita alle regole FERREE ("perché esiste questa regola")',
      'DECISIONE CONFERMATA: solo lezioni aperture finché la qualità non è ottimale — lezioni tattiche in standby',
      'Analisi Knowledge Pipeline: fonte esperta esterna (libri fisici, niente file digitali) come strada per profondità strategica reale',
      'Implementato campo "Contesto strategico" (textarea opzionale) nella Console Coach — inietta narrativa da manuale nel Passo 3 della pipeline',
      'Istruzioni anti-plagio nel prompt: l\'IA usa il testo per capire i concetti a livello alto e riformula sempre, senza copiare frasi dalla fonte',
      'Prossimo test: copiare 2-3 paragrafi da manuale su un\'apertura, generare con e senza contesto, confrontare profondità strategica',
    ],
  },
  {
    id: 's0d', date: '2026-03-16',
    summary: 'Analisi e miglioramento prompt generazione lezioni IA (solo aperture)',
    items: [
      'Analisi comparativa dei 4 prompt (lessonBuildPrompt, openingBuildPrompt, lessonPlanPrompt, openingPlanPrompt) vs Anthropic best practices',
      'lessonBuildPrompt: aggiunto REGOLE DI STILE (≤12 parole/domanda, ≤5 parole/opzione, ≤2 frasi/feedback) — lo stesso standard già presente in openingBuildPrompt',
      'lessonBuildPrompt: aggiunta guida Visual Aids sistematica (frecce/cerchi per ogni step interattivo) + REGOLA CRITICA text = last resort + demo = eccezionale',
      'Tutti i build prompt: motivazione alle REGOLE FERREE ("perché": chessops valida ogni mossa — una mossa inventata causa crash immediato nel player)',
      'Tutti i prompt: istruzione output rafforzata: "Inizia con { e finisci con }" — riduce testo spurio prima/dopo il JSON',
      'DECISIONE: lezioni tattiche non implementate finché aperture non producono risultati OTTIMALI. Solo aperture da qui in avanti.',
    ],
  },
  {
    id: 's0c', date: '2026-03-15/16',
    summary: 'Fase 2bis UX studenti + separazione Diario + ErrorBoundary + fix crash',
    items: [
      'Scacchiera Lichess marrone: #f0d9b5 / #b58863 (era grigio) — colori standard per studenti abituati a Lichess',
      'FreezeOverlay redesign: radial-gradient con colore specifico per tipo attività (blu intent, arancio detective, verde candidate, viola move, giallo demo)',
      'Color coding attività: border-top 4px solid con token CSS --activity-color per ogni tipo — il colore attraversa bottoni, domanda, selezioni',
      'Bottoni e opzioni: radius 12px, shadow, scale(1.04) hover, scale(0.98) active — feedback tattile per bambini',
      'Tipografia: question 1.1rem/800, label min 0.75rem, coordinate scacchiera 0.8rem/700',
      'Chessboard.jsx key fix: risolto debito tecnico — key={cgKey} sul container (non più useEffect deps hack)',
      'ErrorBoundary: componente React che cattura crash di render e mostra messaggio leggibile invece di schermata bianca',
      'Fix crash TypeError undefined[2]: rimossi onRate e currentRating (riferimenti a stepRatings già eliminato) da FeedbackPanel',
      'DiarioPage: separazione dal ProgettoPage — Roadmap, priorità, sessioni in pagina dedicata (#/diario)',
      'App.jsx: aggiunta rotta #/diario, lazy import DiarioPage, ErrorBoundary attorno a PlayerPage',
    ],
  },
  {
    id: 's0b', date: '2026-03-15',
    summary: 'Step snapshot per training IA + sistema auto-data diario al deploy',
    items: [
      'stepSnapshot(): cattura il contenuto esatto visto dallo studente al momento del salvataggio feedback',
      'Snapshot immutabile per tipo step: intent (domanda, opzioni, risposta), detective (quadro), candidate (mosse), move, text, demo',
      'Schema Firestore aggiornato: ogni step ora include snapshot{} — dataset labeled (contenuto → giudizio qualità) per iterare sui prompt',
      'Diario di Bordo: "Ultimo aggiornamento" ora usa __BUILD_TIME__ (iniettato da Vite al deploy) — si aggiorna automaticamente ad ogni push',
    ],
  },
  {
    id: 's0', date: '2026-03-15',
    summary: 'Pagina Progetto riscritta + nuovo sistema raccolta feedback sviluppatore',
    items: [
      'Pagina Progetto ristrutturata in due sezioni: Fondativo (dark chess design) + Diario di Bordo',
      'Fondativo: SVG interattivi Problema/Metodo, widget Architettura e Pipeline a 5 passi clickabili',
      'DevFeedbackSidebar: colonna fissa 220px sempre visibile durante le lezioni',
      'Per ogni step: tag rapido (Chiaro / Difficile / Bloccato) + nota libera',
      'Tag Bloccato: nota obbligatoria + snapshot automatico errori browser',
      'Browser error capture: window.error + unhandledrejection, keyati per stepIndex tramite ref',
      'Auto-save al completamento lezione, rimozione form finale con stelle',
      'Schema Firestore aggiornato: { tag, note, errors[] } per step',
    ],
  },
  {
    id: 's1', date: '2026-03-14',
    summary: 'Fix pipeline aperture, ottimizzazione prompt, migrazione da localStorage a Firestore',
    items: [
      'Fix pipeline aperture: Proxy Netlify, token OAuth Lichess',
      'Ottimizzazione prompt per studenti: domande brevi, max 1 step text',
      'Fix board interattiva e migrazione completa da localStorage a Firestore',
      'Zero localStorage nel progetto',
      'Completamento sistema feedback coach',
    ],
  },
  {
    id: 's2', date: '2026-03-13',
    summary: "Problema critico «L'IA non sa fare scacchi» — progettazione pipeline 4 passi",
    items: [
      "Identificazione del problema critico: «L'IA non sa fare scacchi» e 8 gap architetturali",
      'Progettazione della nuova pipeline a 4 passi',
      'Analisi Stockfish post-generazione integrata',
    ],
  },
  {
    id: 's3', date: '2026-03-06/08',
    summary: 'Sviluppo pipeline aperture (Fase 1C)',
    items: [
      'Sviluppo completo pipeline aperture (Fase 1C)',
      'Integrazione Explorer API Lichess',
      'Prima implementazione orchestratore',
    ],
  },
]

const ROADMAP = [
  { id: 'f0', stato: 'done', label: 'Fase 0 — Fondamenta', title: 'Infrastruttura base',
    desc: 'Chessground, chessops, Stockfish WASM, database puzzle Lichess su Firestore, API IA.',
    tags: ['chessground','chessops','stockfish wasm','firestore'] },
  { id: 'f1a', stato: 'done', label: 'Fase 1A — Infrastruttura IA/Scacchi', title: 'Database e analisi Stockfish',
    desc: 'Database attivo, analisi SF funzionante, salvataggio su Firestore.',
    tags: ['database','stockfish','firestore'] },
  { id: 'f1c', stato: 'done', label: 'Fase 1C — Pipeline Aperture', title: 'Explorer API e orchestratore 5 passi',
    desc: 'Explorer API, orchestratore a 5 passi, focus sulla comprensione del piano.',
    tags: ['lichess explorer','pipeline 5 passi','intent'] },
  { id: 'f2', stato: 'done', label: 'Fase 2 — Player Studente Base', title: 'Freeze, attività, scacchiera interattiva',
    desc: 'Freeze, tipi di attività, aiuti visivi, salvataggio su Firestore, scacchiera orientabile.',
    tags: ['freeze','intent','detective','candidate','firestore'] },
  { id: 'f2bis', stato: 'active', label: 'Fase 2bis — UX Studenti', title: 'Palette, celebrazioni, tipografia',
    desc: 'Color coding per attività, bottoni ottimizzati, celebrazioni, feedback positivo. Decisivo per i test.',
    tags: ['palette','celebrazioni','bottoni','tipografia'] },
  { id: 'f3', stato: 'todo', label: 'Fase 3 — Scheda studente', title: 'Profili a 3 livelli',
    desc: 'Scacchistico, apprendimento, cognitivo. Personalizzazione automatica delle lezioni.', tags: [] },
  { id: 'f4', stato: 'todo', label: 'Fase 4 — Console Coach raffinata', title: 'Strumenti avanzati per il coach',
    desc: 'Editing lezioni, dashboard progressi, configurazione percorsi.', tags: [] },
  { id: 'f5', stato: 'todo', label: 'Fasi 5–7 — Strumenti, percorsi, multi-utente', title: 'Ecosistema completo',
    desc: 'Strumenti modulari nel player, percorsi e verifiche, sistema multi-utente.', tags: [] },
]

// ═══════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════

function SessionLog() {
  const [open, setOpen] = useState(new Set(['s0e', 's0d']))
  const toggle = id => setOpen(prev => {
    const n = new Set(prev)
    n.has(id) ? n.delete(id) : n.add(id)
    return n
  })
  return (
    <div className="pd-session-log">
      {SESSIONS.map(s => (
        <div key={s.id} className={`pd-session${open.has(s.id) ? ' open' : ''}`}>
          <div className="pd-session-header" onClick={() => toggle(s.id)}>
            <span className="pd-session-date">{s.date}</span>
            <span className="pd-session-summary">{s.summary}</span>
            <span className="pd-session-toggle">▾</span>
          </div>
          {open.has(s.id) && (
            <div className="pd-session-body">
              <ul>{s.items.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════

export default function DiarioPage() {
  return (
    <div className="pd">
      <div className="pd-inner">
        <header className="pd-header">
          <h1 className="pd-header-h1">♟ NeuroScacchi 3.0 <span>/ Diario di Bordo</span></h1>
          <div className="pd-last-update">Ultimo aggiornamento: {typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'dev'}</div>
        </header>

        {/* Priorità */}
        <div className="pd-section">
          <div className="pd-section-title">Priorità operative</div>
          <div className="pd-principle-banner">
            <strong>Principio guida:</strong> Le aperture sono l'unico tipo di contenuto attivo finché non hanno feedback costantemente positivi.
          </div>
          <div className="pd-priorities">
            {[
              { cls: 'p1', badge: 'P1 — In corso', title: 'Qualità contenuti aperture',
                desc: 'Iterare sui prompt in base ai feedback raccolti. Generare lezioni chiare e stimolanti per gli studenti.', status: 'Iterazione attiva' },
              { cls: 'p2', badge: 'P2 — Prossima', title: 'Esperienza visiva player',
                desc: "L'aspetto grafico è decisivo nei test con gli studenti. Palette, scacchiera (marrone/beige), celebrazioni, feedback positivo.", status: 'In attesa di P1' },
              { cls: 'p3', badge: 'P3 — Da avviare', title: 'Fasi 3–7',
                desc: 'Scheda studente, console raffinata, strumenti modulari, percorsi e verifiche, multi-utente.', status: 'Post-validazione' },
            ].map(p => (
              <div key={p.cls} className={`pd-priority-card ${p.cls}`}>
                <div className="pd-prio-badge">{p.badge}</div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
                <div className="pd-status-pill"><span className="pd-dot" />{p.status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap */}
        <div className="pd-section">
          <div className="pd-section-title">Roadmap</div>
          <div className="pd-roadmap">
            {ROADMAP.map(item => (
              <div key={item.id} className={`pd-roadmap-item ${item.stato}`}>
                <div className="pd-phase-label">{item.label}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                {item.tags.length > 0 && (
                  <div className="pd-tag-list">
                    {item.tags.map(t => <span key={t} className="pd-tag">{t}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sessioni */}
        <div className="pd-section">
          <div className="pd-section-title">Storico sessioni recenti</div>
          <SessionLog />
        </div>

        {/* Debito tecnico */}
        <div className="pd-section">
          <div className="pd-section-title">Debito tecnico</div>

          <div className="pd-debt-card">
            <h4>FeedbackPage — schema non aggiornato</h4>
            <p>La pagina di visualizzazione feedback legge ancora i campi vecchi (<code>overallRating</code>, <code>note</code>, <code>rating</code> per step). Con il nuovo schema <code>{'{ tag, note, errors[] }'}</code> mostrerà dati parziali o vuoti.</p>
            <div className="pd-solution">
              <strong>Da fare prima dei tester:</strong> Riscrivere FeedbackPage come console sviluppatore con vista per lezione, filtri per tag, visualizzazione errori browser.
            </div>
          </div>
        </div>

        {/* Da decidere */}
        <div className="pd-section">
          <div className="pd-section-title">Da decidere / ancora aperto</div>
          <div className="pd-future-grid">
            <div className="pd-future-item">
              <div className="pd-future-icon">👥</div>
              <h4>Apertura ai tester familiari</h4>
              <p>Quando si aprirà a piccoli utenti tester, associare il feedback al profilo utente (userId, nome, età) per capire i miglioramenti specifici per studente e iterare sulle lezioni in modo mirato.</p>
            </div>
            <div className="pd-future-item">
              <div className="pd-future-icon">📊</div>
              <h4>Console sviluppatore feedback</h4>
              <p>Interfaccia dedicata per analizzare i dati raccolti: vista per lezione, frequenza dei tag per step, errori browser ricorrenti, pattern di blocco. Non urgente — prima raccogliere dati sufficienti.</p>
            </div>
            <div className="pd-future-item">
              <div className="pd-future-icon">📱</div>
              <h4>Dev sidebar su mobile</h4>
              <p>La sidebar è nascosta su mobile perché non c'è spazio. Valutare se serve un pannello collassabile o se i test avvengono sempre su desktop durante questa fase.</p>
            </div>
          </div>
        </div>

        {/* Orizzonte futuro */}
        <div className="pd-section">
          <div className="pd-section-title">Orizzonte futuro (fuori roadmap)</div>
          <div className="pd-future-grid">
            {[
              { icon: '📊', title: 'Analisi PGN', desc: 'Analisi delle partite dello studente per generare lezioni mirate sui punti deboli reali.' },
              { icon: '🔀', title: 'Randomizzazione ripasso', desc: 'Ripasso non sequenziale per allenare il riconoscimento del contesto in situazioni variate.' },
              { icon: '🔍', title: 'Hover preview', desc: 'FEN anteprima o analisi Stockfish live al passaggio del mouse sulle opzioni Intent.' },
            ].map(f => (
              <div key={f.title} className="pd-future-item">
                <div className="pd-future-icon">{f.icon}</div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
