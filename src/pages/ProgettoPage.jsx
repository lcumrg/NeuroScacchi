import { useState } from 'react'
import './ProgettoPage.css'

// ═══════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════

const ARCH_DATA = {
  ai: {
    title: 'Intelligenza Artificiale', roleClass: 'rt-ai', role: 'Pianifica e costruisce',
    desc: 'Genera la struttura pedagogica della lezione: domande, opzioni di risposta, spiegazioni, sequenza degli step. Adatta linguaggio e complessità al profilo dello studente.',
    doList: 'Pedagogia, struttura didattica, domande, adattamento al profilo, linguaggio',
    dontList: 'Non calcola mosse, non genera FEN, non valuta posizioni scacchistiche',
    collab: 'Riceve i dati certificati da Stockfish e li integra nella struttura didattica. Il coach guida le sue scelte iniziali e approva il risultato.',
  },
  sf: {
    title: 'Stockfish', roleClass: 'rt-sf', role: 'Valida e analizza',
    desc: 'Il motore scacchistico analizza ogni posizione, certifica la legalità delle mosse, fornisce la best move e la valutazione numerica. Nessun errore scacchistico può passare.',
    doList: 'Analisi posizioni, best move, valutazione, legalità mosse, varianti',
    dontList: 'Non spiega, non insegna, non adatta al livello dello studente',
    collab: "Fornisce i \"mattoni certificati\" che l'IA usa per costruire la lezione. Senza Stockfish, l'IA potrebbe inventare mosse sbagliate.",
  },
  coach: {
    title: 'Coach umano', roleClass: 'rt-coach', role: 'Rivede e approva',
    desc: "Il filtro finale non bypassabile. Definisce gli obiettivi didattici, personalizza le indicazioni per lo studente, rivede ogni lezione generata e la approva prima che lo studente la veda.",
    doList: 'Obiettivi, personalizzazione, revisione, approvazione, correzione, rifiuto',
    dontList: 'Non costruisce la lezione da zero, non analizza le posizioni al motore',
    collab: "Apre e chiude il ciclo: dà il brief iniziale all'IA e approva (o rifiuta) il prodotto finale. Senza il coach, nessuna lezione raggiunge lo studente.",
  },
}

const PW_STEPS = [
  { icon: '👤', glow: 'glow-green', who: 'Coach umano', whoClass: 'c-green',
    desc: 'Il coach definisce gli obiettivi didattici, seleziona il profilo dello studente e dà indicazioni precise per personalizzare la lezione.' },
  { icon: '🤖', glow: 'glow-blue', who: 'Intelligenza Artificiale', whoClass: 'c-blue',
    desc: "L'IA riceve il brief del coach e progetta la struttura della lezione: tipo di attività, domande, sequenza degli step, linguaggio adatto." },
  { icon: '♟', glow: 'glow-red', who: 'Sistema + Stockfish', whoClass: 'c-red',
    desc: "Il sistema recupera posizioni reali dall'Explorer API di Lichess. Stockfish analizza ogni posizione e certifica la correttezza scacchistica." },
  { icon: '🤖', glow: 'glow-blue', who: 'Intelligenza Artificiale', whoClass: 'c-blue',
    desc: "L'IA assembla la lezione finale: integra i dati certificati nella struttura pedagogica. Il contenuto è completo e pronto per la revisione." },
  { icon: '👤', glow: 'glow-green', who: 'Coach umano', whoClass: 'c-green',
    desc: "Il coach rivede la lezione generata, può correggerla o rifiutarla. Solo dopo l'approvazione lo studente potrà vederla." },
]

const PW_BOARD_ROWS = [
  ['','♞','',''], ['♟','','♟',''], ['','♙','',''], ['♙','','','♖'],
]

const SKEL_CFG = [
  [],
  ['w100','w80','w60','w100','w40'],
  ['w100 filled-blue','w80 filled-amber','w60','w100 filled-blue','w40'],
  ['w100 filled-text','w80 filled-text','w100 filled-text','w60 filled-text'],
  ['w100 filled-text','w80 filled-text','w100 filled-text','w60 filled-text'],
]
const CARD_META = [
  { phase: '', title: 'In attesa del brief...', ghost: true },
  { phase: 'Apertura', title: 'Italiana: piano del Bianco...', ghost: true },
  { phase: 'Apertura', title: 'Italiana: piano del Bianco...', ghost: true },
  { phase: 'Apertura · Italiana', title: 'Piano del Bianco dopo 1.e4 e5', ghost: false },
  { phase: 'Apertura · Italiana', title: 'Piano del Bianco dopo 1.e4 e5', ghost: false },
]

const SESSIONS = [
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
// SVG COMPONENTS
// ═══════════════════════════════════════════════════════════

function Problemasvg() {
  return (
    <svg width="100%" viewBox="0 0 680 400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrProb" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </marker>
        <clipPath id="headL"><circle cx="165" cy="248" r="72"/></clipPath>
      </defs>
      <text x="165" y="32" textAnchor="middle" fill="#78716c" fontFamily="'JetBrains Mono',monospace" fontSize="11" letterSpacing="0.08em">METODO TRADIZIONALE</text>
      <text x="515" y="32" textAnchor="middle" fill="#78716c" fontFamily="'JetBrains Mono',monospace" fontSize="11" letterSpacing="0.08em">NEUROSCACCHI</text>
      <line x1="340" y1="20" x2="340" y2="390" stroke="#3a3530" strokeWidth="0.5" strokeDasharray="4 4"/>
      <line x1="120" y1="52" x2="120" y2="158" stroke="#78716c" strokeWidth="1" markerEnd="url(#arrProb)" opacity="0.3"/>
      <line x1="165" y1="52" x2="165" y2="158" stroke="#78716c" strokeWidth="1" markerEnd="url(#arrProb)" opacity="0.3"/>
      <line x1="210" y1="52" x2="210" y2="158" stroke="#78716c" strokeWidth="1" markerEnd="url(#arrProb)" opacity="0.3"/>
      <rect x="82" y="54" width="72" height="28" rx="6" fill="#1c1917" stroke="#3a3530" strokeWidth="0.5"/>
      <text x="118" y="72" textAnchor="middle" fill="#a8a29e" fontFamily="'DM Sans',sans-serif" fontSize="12">Pattern</text>
      <rect x="88" y="90" width="72" height="28" rx="6" fill="#1c1917" stroke="#3a3530" strokeWidth="0.5"/>
      <text x="124" y="108" textAnchor="middle" fill="#a8a29e" fontFamily="'DM Sans',sans-serif" fontSize="12">Tattica</text>
      <rect x="160" y="54" width="96" height="28" rx="6" fill="#1c1917" stroke="#3a3530" strokeWidth="0.5"/>
      <text x="208" y="72" textAnchor="middle" fill="#a8a29e" fontFamily="'DM Sans',sans-serif" fontSize="12">Varianti a memoria</text>
      <rect x="158" y="90" width="64" height="28" rx="6" fill="#1c1917" stroke="#3a3530" strokeWidth="0.5"/>
      <text x="190" y="108" textAnchor="middle" fill="#a8a29e" fontFamily="'DM Sans',sans-serif" fontSize="12">Mosse</text>
      <circle cx="165" cy="248" r="72" fill="#1c1917" stroke="#3a3530" strokeWidth="1" opacity="0.6"/>
      <g clipPath="url(#headL)" opacity="0.25">
        <rect x="100" y="192" width="130" height="12" rx="3" fill="#78716c"/>
        <rect x="110" y="212" width="100" height="12" rx="3" fill="#78716c"/>
        <rect x="105" y="232" width="115" height="12" rx="3" fill="#78716c"/>
        <rect x="115" y="252" width="90" height="12" rx="3" fill="#78716c"/>
        <rect x="100" y="272" width="120" height="12" rx="3" fill="#78716c"/>
        <rect x="112" y="292" width="95" height="12" rx="3" fill="#78716c"/>
      </g>
      <text x="165" y="365" textAnchor="middle" fill="#78716c" fontFamily="'DM Sans',sans-serif" fontSize="13" opacity="0.5">Lo studente ripete.</text>
      <line x1="470" y1="52" x2="470" y2="140" stroke="#ef4444" strokeWidth="1" opacity="0.35"/>
      <line x1="515" y1="52" x2="515" y2="140" stroke="#ef4444" strokeWidth="1" opacity="0.35"/>
      <line x1="560" y1="52" x2="560" y2="140" stroke="#ef4444" strokeWidth="1" opacity="0.35"/>
      <rect x="434" y="54" width="72" height="28" rx="6" fill="#1c1917" stroke="#3a3530" strokeWidth="0.5"/>
      <text x="470" y="72" textAnchor="middle" fill="#a8a29e" fontFamily="'DM Sans',sans-serif" fontSize="12">Pattern</text>
      <rect x="440" y="90" width="72" height="28" rx="6" fill="#1c1917" stroke="#3a3530" strokeWidth="0.5"/>
      <text x="476" y="108" textAnchor="middle" fill="#a8a29e" fontFamily="'DM Sans',sans-serif" fontSize="12">Tattica</text>
      <rect x="510" y="54" width="96" height="28" rx="6" fill="#1c1917" stroke="#3a3530" strokeWidth="0.5"/>
      <text x="558" y="72" textAnchor="middle" fill="#a8a29e" fontFamily="'DM Sans',sans-serif" fontSize="12">Varianti a memoria</text>
      <rect x="516" y="90" width="64" height="28" rx="6" fill="#1c1917" stroke="#3a3530" strokeWidth="0.5"/>
      <text x="548" y="108" textAnchor="middle" fill="#a8a29e" fontFamily="'DM Sans',sans-serif" fontSize="12">Mosse</text>
      <line x1="470" y1="140" x2="470" y2="146" stroke="#ef4444" strokeWidth="2" opacity="0.5"/>
      <line x1="515" y1="140" x2="515" y2="146" stroke="#ef4444" strokeWidth="2" opacity="0.5"/>
      <line x1="560" y1="140" x2="560" y2="146" stroke="#ef4444" strokeWidth="2" opacity="0.5"/>
      <rect x="445" y="148" width="140" height="32" rx="6" fill="#1c1917" stroke="#ef4444" strokeWidth="1"/>
      <text x="515" y="168" textAnchor="middle" fill="#ef4444" fontFamily="'DM Serif Display',serif" fontSize="14">Freeze</text>
      <circle cx="515" cy="248" r="72" fill="#1c1917" stroke="#22c55e" strokeWidth="1.5"/>
      <rect x="462" y="216" width="106" height="26" rx="6" fill="#22c55e12" stroke="#22c55e50" strokeWidth="0.5"/>
      <text x="515" y="233" textAnchor="middle" fill="#5DCAA5" fontFamily="'DM Sans',sans-serif" fontSize="12">Ragionamento</text>
      <rect x="472" y="248" width="86" height="24" rx="6" fill="#60a5fa12" stroke="#60a5fa50" strokeWidth="0.5"/>
      <text x="515" y="264" textAnchor="middle" fill="#85B7EB" fontFamily="'DM Sans',sans-serif" fontSize="12">Strategia</text>
      <rect x="458" y="278" width="114" height="24" rx="6" fill="#22c55e12" stroke="#22c55e50" strokeWidth="0.5"/>
      <text x="515" y="294" textAnchor="middle" fill="#5DCAA5" fontFamily="'DM Sans',sans-serif" fontSize="12">Consapevolezza</text>
      <text x="515" y="365" textAnchor="middle" fill="#fafaf9" fontFamily="'DM Sans',sans-serif" fontSize="14" fontWeight="500">Lo studente pensa.</text>
    </svg>
  )
}

function MetodoSvg() {
  return (
    <svg width="100%" viewBox="0 0 680 430" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrMet" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </marker>
      </defs>
      <rect x="88" y="26" width="140" height="48" rx="8" fill="#1c1917" stroke="#ef4444" strokeWidth="0.8"/>
      <text x="158" y="44" textAnchor="middle" fill="#ef4444" fontFamily="'DM Serif Display',serif" fontSize="14">Freeze</text>
      <text x="158" y="62" textAnchor="middle" fill="#78716c" fontFamily="'DM Sans',sans-serif" fontSize="11">Fermati e osserva</text>
      <line x1="228" y1="50" x2="264" y2="50" stroke="#b58863" strokeWidth="1.5" markerEnd="url(#arrMet)"/>
      <rect x="270" y="26" width="140" height="48" rx="8" fill="#1c1917" stroke="#22c55e" strokeWidth="0.8"/>
      <text x="340" y="44" textAnchor="middle" fill="#22c55e" fontFamily="'DM Serif Display',serif" fontSize="14">Attività</text>
      <text x="340" y="62" textAnchor="middle" fill="#78716c" fontFamily="'DM Sans',sans-serif" fontSize="11">Pensa e rispondi</text>
      <line x1="410" y1="50" x2="446" y2="50" stroke="#b58863" strokeWidth="1.5" markerEnd="url(#arrMet)"/>
      <rect x="452" y="26" width="140" height="48" rx="8" fill="#1c1917" stroke="#a78bfa" strokeWidth="0.8"/>
      <text x="522" y="44" textAnchor="middle" fill="#a78bfa" fontFamily="'DM Serif Display',serif" fontSize="14">Feedback</text>
      <text x="522" y="62" textAnchor="middle" fill="#78716c" fontFamily="'DM Sans',sans-serif" fontSize="11">Impara dal risultato</text>
      <text x="340" y="108" textAnchor="middle" fill="#a8a29e" fontFamily="'DM Sans',sans-serif" fontSize="13">L'attività cognitiva prende tre forme:</text>
      <line x1="152" y1="120" x2="152" y2="148" stroke="#60a5fa" strokeWidth="1" markerEnd="url(#arrMet)"/>
      <line x1="340" y1="120" x2="340" y2="148" stroke="#f97316" strokeWidth="1" markerEnd="url(#arrMet)"/>
      <line x1="528" y1="120" x2="528" y2="148" stroke="#a78bfa" strokeWidth="1" markerEnd="url(#arrMet)"/>
      <rect x="57" y="154" width="190" height="86" rx="10" fill="#1c1917" stroke="#60a5fa" strokeWidth="0.8"/>
      <text x="152" y="180" textAnchor="middle" fill="#60a5fa" fontFamily="'DM Serif Display',serif" fontSize="16">Intent</text>
      <text x="152" y="200" textAnchor="middle" fill="#a8a29e" fontFamily="'DM Sans',sans-serif" fontSize="12">Identifica il piano</text>
      <text x="152" y="216" textAnchor="middle" fill="#a8a29e" fontFamily="'DM Sans',sans-serif" fontSize="12">strategico</text>
      <rect x="262" y="154" width="156" height="86" rx="10" fill="#1c1917" stroke="#f97316" strokeWidth="0.8"/>
      <text x="340" y="180" textAnchor="middle" fill="#f97316" fontFamily="'DM Serif Display',serif" fontSize="16">Detective</text>
      <text x="340" y="200" textAnchor="middle" fill="#a8a29e" fontFamily="'DM Sans',sans-serif" fontSize="12">Trova la casa o il</text>
      <text x="340" y="216" textAnchor="middle" fill="#a8a29e" fontFamily="'DM Sans',sans-serif" fontSize="12">pezzo chiave</text>
      <rect x="433" y="154" width="190" height="86" rx="10" fill="#1c1917" stroke="#a78bfa" strokeWidth="0.8"/>
      <text x="528" y="180" textAnchor="middle" fill="#a78bfa" fontFamily="'DM Serif Display',serif" fontSize="16">Candidate</text>
      <text x="528" y="200" textAnchor="middle" fill="#a8a29e" fontFamily="'DM Sans',sans-serif" fontSize="12">Individua tutte le</text>
      <text x="528" y="216" textAnchor="middle" fill="#a8a29e" fontFamily="'DM Sans',sans-serif" fontSize="12">mosse candidate</text>
      <line x1="152" y1="240" x2="152" y2="264" stroke="#60a5fa" strokeWidth="0.5" strokeDasharray="3 3"/>
      <line x1="340" y1="240" x2="340" y2="264" stroke="#f97316" strokeWidth="0.5" strokeDasharray="3 3"/>
      <line x1="528" y1="240" x2="528" y2="264" stroke="#a78bfa" strokeWidth="0.5" strokeDasharray="3 3"/>
      <rect x="47" y="270" width="210" height="68" rx="8" fill="#60a5fa12" stroke="#60a5fa50" strokeWidth="0.5"/>
      <text x="152" y="300" textAnchor="middle" fill="#fafaf9" fontFamily="'DM Serif Display',serif" fontSize="14" fontStyle="italic">«Cosa vuole ottenere</text>
      <text x="152" y="320" textAnchor="middle" fill="#fafaf9" fontFamily="'DM Serif Display',serif" fontSize="14" fontStyle="italic">il Bianco qui?»</text>
      <rect x="252" y="270" width="176" height="68" rx="8" fill="#f9731612" stroke="#f9731650" strokeWidth="0.5"/>
      <text x="340" y="300" textAnchor="middle" fill="#fafaf9" fontFamily="'DM Serif Display',serif" fontSize="14" fontStyle="italic">«Qual è la casa</text>
      <text x="340" y="320" textAnchor="middle" fill="#fafaf9" fontFamily="'DM Serif Display',serif" fontSize="14" fontStyle="italic">più importante?»</text>
      <rect x="423" y="270" width="210" height="68" rx="8" fill="#a78bfa12" stroke="#a78bfa50" strokeWidth="0.5"/>
      <text x="528" y="300" textAnchor="middle" fill="#fafaf9" fontFamily="'DM Serif Display',serif" fontSize="14" fontStyle="italic">«Quali mosse ha</text>
      <text x="528" y="320" textAnchor="middle" fill="#fafaf9" fontFamily="'DM Serif Display',serif" fontSize="14" fontStyle="italic">il Bianco?»</text>
      <text x="152" y="368" textAnchor="middle" fill="#78716c" fontFamily="'DM Sans',sans-serif" fontSize="10" opacity="0.4">De Groot, 1946</text>
      <text x="340" y="368" textAnchor="middle" fill="#78716c" fontFamily="'DM Sans',sans-serif" fontSize="10" opacity="0.4">Chase & Simon, 1973</text>
      <text x="528" y="368" textAnchor="middle" fill="#78716c" fontFamily="'DM Sans',sans-serif" fontSize="10" opacity="0.4">Kotov, 1971</text>
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════
// FONDATIVO WIDGETS
// ═══════════════════════════════════════════════════════════

const BOARD_ROW = ['♜','♞','♝','♛','♚','♝','♞','♜']
const BOARD_INIT = [
  BOARD_ROW, Array(8).fill('♟'),
  ...Array(4).fill(null).map(() => Array(8).fill('')),
  Array(8).fill('♙'),
  ['♖','♘','♗','♕','♔','♗','♘','♖'],
]

function MiniBoard() {
  return (
    <div className="pf-mini-board">
      {BOARD_INIT.flatMap((row, r) =>
        row.map((p, c) => (
          <div key={r * 8 + c} className={`pf-sq ${(r + c) % 2 === 0 ? 'l' : 'd'}`}>{p}</div>
        ))
      )}
    </div>
  )
}

function ArchWidget() {
  const [key, setKey] = useState('ai')
  const d = ARCH_DATA[key]
  const actors = [
    { id: 'ai', icon: '🤖', name: 'IA', role: 'Pianifica e costruisce' },
    { id: 'sf', icon: '♟', name: 'Stockfish', role: 'Valida e analizza' },
    { id: 'coach', icon: '👤', name: 'Coach', role: 'Rivede e approva' },
  ]
  return (
    <>
      <div className="pf-arch-actors">
        {actors.map(a => (
          <div key={a.id} className={`pf-arch-btn a-${a.id}${key === a.id ? ' active' : ''}`} onClick={() => setKey(a.id)}>
            <div className="pf-arch-circle">{a.icon}</div>
            <div className="pf-arch-btn-name">{a.name}</div>
            <div className="pf-arch-btn-role">{a.role}</div>
          </div>
        ))}
      </div>
      <div className="pf-arch-detail">
        <h3>{d.title}</h3>
        <div className={`pf-arch-role-tag rt-${key}`}>{d.role}</div>
        <p>{d.desc}</p>
        <div className="pf-arch-do-dont">
          <div className="pf-arch-do"><div className="pf-arch-dd-label">Cosa fa</div>{d.doList}</div>
          <div className="pf-arch-dont"><div className="pf-arch-dd-label">Cosa non fa</div>{d.dontList}</div>
        </div>
        <div className="pf-arch-collab">
          <div className="pf-arch-collab-label">Collaborazione</div>
          {d.collab}
        </div>
      </div>
    </>
  )
}

function PipeWidget() {
  const [step, setStep] = useState(0)
  const s  = PW_STEPS[step]
  const ct = CARD_META[step]

  return (
    <div className="pf-pipe-widget">
      <div className="pf-pw-bar">
        {['Obiettivi','Pianifica','Dati reali','Costruisce','Approva'].map((lbl, i) => (
          <button key={i} className={`pf-pw-btn${i === step ? ' active' : ''}${i < step ? ' done' : ''}`} onClick={() => setStep(i)}>
            <span className="pf-pw-num">{i + 1}</span>
            <span className="pf-pw-label">{lbl}</span>
          </button>
        ))}
      </div>

      <div className="pf-pw-narration">
        <div className={`pf-pw-narr-icon ${s.glow}`}>{s.icon}</div>
        <div className="pf-pw-narr-body">
          <div className={`pf-pw-narr-who ${s.whoClass}`}>{s.who}</div>
          <div className="pf-pw-narr-desc">{s.desc}</div>
        </div>
      </div>

      <div className="pf-pw-card">
        <div className="pf-pw-card-header">
          <div className="pf-pw-phase">{ct.phase}</div>
          <div className="pf-pw-title">
            {ct.ghost ? <span className="pf-ghost">{ct.title}</span> : ct.title}
          </div>
        </div>
        <div className="pf-pw-card-body">
          {step <= 1 && (
            <div className="pf-pw-brief">
              <div className="pf-pw-brief-label">Brief del coach</div>
              <div className="pf-pw-brief-item">Obiettivo: comprendere il piano</div>
              <div className="pf-pw-brief-item">Studente: Elo 1200, ADHD</div>
              <div className="pf-pw-brief-item">Sessione breve (10 min)</div>
            </div>
          )}
          {step === 1 && (
            <div className="pf-pw-dots"><span /><span /><span /></div>
          )}
          {SKEL_CFG[step].length > 0 && (
            <div className="pf-pw-skel">
              {SKEL_CFG[step].map((cls, i) => <div key={i} className={`pf-pw-skel-line ${cls}`} />)}
            </div>
          )}
          {step >= 2 && (
            <div className="pf-pw-board">
              {PW_BOARD_ROWS.flatMap((row, r) =>
                row.map((p, c) => (
                  <div key={r * 4 + c} className={`pf-pw-bsq ${(r + c) % 2 === 0 ? 'l' : 'd'}`}>{p}</div>
                ))
              )}
            </div>
          )}
          {step >= 3 && (
            <div className="pf-pw-activity">
              <div className="pf-pw-act-label">Intent</div>
              <div className="pf-pw-act-q">Qual è il piano del Bianco?</div>
            </div>
          )}
          {step >= 3 && (
            <div className="pf-pw-options">
              <div className="pf-pw-opt">Attaccare il centro</div>
              <div className="pf-pw-opt pf-pw-correct">Sviluppare i pezzi</div>
              <div className="pf-pw-opt">Arroccare subito</div>
            </div>
          )}
        </div>
        {step === 4 && (
          <div className="pf-pw-stamp">
            <div className="pf-pw-stamp-line" />
            <div className="pf-pw-stamp-text">Approvata</div>
            <div className="pf-pw-stamp-sub">coach review</div>
            <div className="pf-pw-stamp-line" />
          </div>
        )}
      </div>

      <div className="pf-pipeline-motto">«L'IA fa pedagogia, il sistema fa scacchi.»</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// DIARIO WIDGET
// ═══════════════════════════════════════════════════════════

function SessionLog() {
  const [open, setOpen] = useState(new Set(['s0']))
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
// FONDATIVO SECTION
// ═══════════════════════════════════════════════════════════

function FondativoSection() {
  return (
    <div className="pf">
      {/* Hero */}
      <section className="pf-hero">
        <div className="pf-container">
          <div className="pf-hero-grid">
            <div>
              <div className="pf-hero-badge">♟ Versione 3.0</div>
              <h1 className="pf-h1">Non toccare i pezzi.<br /><span>Prima pensa.</span></h1>
              <p className="pf-hero-sub">NeuroScacchi insegna il pensiero strategico attraverso gli scacchi — non memorizzando mosse, ma imparando a ragionare prima di agire.</p>
              <p className="pf-hero-sub pf-hero-sub--dim">Dall'istintività tattica alla visione strategica.</p>
            </div>
            <MiniBoard />
          </div>
        </div>
      </section>

      {/* Problema */}
      <section className="pf-section">
        <div className="pf-container">
          <div className="pf-section-label">01 — Il problema</div>
          <h2 className="pf-h2">Memorizzare non è pensare</h2>
          <p className="pf-lead">Le piattaforme esistenti — Chess.com, Lichess, ChessKid, Chessable — insegnano <em>cosa</em> giocare. Ti danno un puzzle, muovi, giusto o sbagliato, fine. Non c'è lavoro sul processo decisionale.</p>
          <div style={{ maxWidth: 680, margin: '3rem auto 0' }}>
            <Problemasvg />
          </div>
        </div>
      </section>

      <div className="pf-sep" />

      {/* Metodo */}
      <section className="pf-section">
        <div className="pf-container">
          <div className="pf-section-label">02 — Il metodo</div>
          <h2 className="pf-h2">Freeze → Attività → Feedback</h2>
          <p className="pf-lead">Il ciclo base di ogni interazione. Il pensiero prende tre forme diverse, ciascuna mirata a un'abilità cognitiva specifica.</p>
          <div style={{ maxWidth: 680, margin: '3rem auto 0' }}>
            <MetodoSvg />
          </div>
        </div>
      </section>

      <div className="pf-sep" />

      {/* Architettura */}
      <section className="pf-section">
        <div className="pf-container">
          <div className="pf-section-label">03 — Architettura</div>
          <h2 className="pf-h2">Le tre intelligenze</h2>
          <p className="pf-lead">Nessuno dei tre attori da solo basta. Il valore nasce dalla collaborazione.</p>
          <ArchWidget />
          <div style={{ marginTop: '4rem' }}>
            <h3 className="pf-h3">La pipeline a 5 passi</h3>
            <p className="pf-sub-desc">Clicca su ogni fase per vedere la lezione che si assembla pezzo per pezzo.</p>
          </div>
          <PipeWidget />
        </div>
      </section>

      <div className="pf-sep" />

      {/* Personalizzazione */}
      <section className="pf-section">
        <div className="pf-container">
          <div className="pf-section-label">04 — Personalizzazione</div>
          <h2 className="pf-h2">Ogni studente è diverso</h2>
          <p className="pf-lead">La scheda studente organizza il profilo su tre livelli. L'IA usa questa scheda per selezionare contenuti, adattare struttura, linguaggio e strumenti.</p>
          <div className="pf-profile-layers">
            {[
              { lv: '1', tag: 'Livello 1', title: 'Profilo scacchistico', items: ['Rating Elo','Punti di forza e debolezza','Aperture di repertorio'] },
              { lv: '2', tag: 'Livello 2', title: 'Profilo di apprendimento', items: ['Reazione agli errori','Durata ottimale sessione','Gestione della frustrazione'] },
              { lv: '3', tag: 'Livello 3', title: 'Profilo cognitivo', optional: true, items: ['ADHD','Autismo','Plusdotazione','Difficoltà di memoria di lavoro'] },
            ].map(l => (
              <div key={l.lv} className={`pf-layer${l.optional ? ' pf-layer--optional' : ''}`} data-level={l.lv}>
                <div className="pf-layer-tag">{l.tag}{l.optional && ' (opzionale)'}</div>
                <h3 className="pf-layer-h3">{l.title}</h3>
                <ul>{l.items.map(item => <li key={item}>{item}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="pf-sep" />

      {/* Interfacce */}
      <section className="pf-section">
        <div className="pf-container">
          <div className="pf-section-label">05 — Design</div>
          <h2 className="pf-h2">Due interfacce, due ruoli</h2>
          <p className="pf-lead">Il coach è il regista. Lo studente vive l'esperienza che il coach ha costruito.</p>
          <div className="pf-interfaces-grid">
            {[
              { url: 'console-coach.app', title: 'Console Coach', metaphor: 'Lo studio di registrazione',
                desc: "Il coach è il regista, l'IA lo sceneggiatore, Stockfish il consulente tecnico. Qui si creano le lezioni, si configurano i percorsi, si monitorano i progressi." },
              { url: 'player.app', title: 'Interfaccia Studente', metaphor: "L'esperienza guidata",
                desc: "Essenziale. Lista di lezioni e percorsi di studio. L'esperienza è interamente guidata da ciò che il coach ha preparato e approvato." },
            ].map(iface => (
              <div key={iface.url} className="pf-interface-card">
                <div className="pf-interface-header">
                  <span className="pf-dot r" /><span className="pf-dot y" /><span className="pf-dot g" />
                  <span>{iface.url}</span>
                </div>
                <div className="pf-interface-body">
                  <h3>{iface.title}</h3>
                  <div className="pf-metaphor">{iface.metaphor}</div>
                  <p>{iface.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// DIARIO SECTION
// ═══════════════════════════════════════════════════════════

function DiarioSection() {
  return (
    <div className="pd">
      <header className="pd-header">
        <h1 className="pd-header-h1">♟ NeuroScacchi 3.0 <span>/ Diario di Bordo</span></h1>
        <div className="pd-last-update">Ultimo aggiornamento: 15 marzo 2026</div>
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
          <h4>Chessboard.jsx — reinit forzato di Chessground</h4>
          <p>Il reinit di Chessground al cambio di interattività avviene forzando l'useEffect. Causa: bug interno di Chessground — <code>.set()</code> non aggiorna <code>draggable.enabled</code>.</p>
          <div className="pd-solution">
            <strong>Soluzione futura:</strong> Usare la prop <code>key</code> sul container div, verificando prima la gestione del reattachment dei ref in React.
          </div>
        </div>

        <div className="pd-debt-card" style={{ marginTop: '0.75rem' }}>
          <h4>FeedbackPage — schema non aggiornato</h4>
          <p>La pagina di visualizzazione feedback legge ancora i campi vecchi (<code>overallRating</code>, <code>note</code>, <code>rating</code> per step). Con il nuovo schema <code>{'{ tag, note, errors[] }'}</code> mostrerà dati parziali o vuoti.</p>
          <div className="pd-solution">
            <strong>Da fare prima dei tester:</strong> Riscrivere FeedbackPage come console sviluppatore con vista per lezione, filtri per tag, visualizzazione errori browser.
          </div>
        </div>
      </div>

      {/* Da pensare */}
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
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════

export default function ProgettoPage() {
  return (
    <div>
      <FondativoSection />
      <DiarioSection />
    </div>
  )
}
