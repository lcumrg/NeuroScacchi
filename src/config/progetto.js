/**
 * progetto.js — dati della sezione PROGETTO
 *
 * Questo file viene aggiornato manualmente quando il coach lo richiede.
 * Le sezioni "auto" (fasi, priorità) riflettono sempre lo stato attuale del progetto.
 * Aggiornato: 2026-03-15
 */

export const meta = {
  nome: 'NeuroScacchi 3.0',
  tagline: 'Training engine per scacchi con metodo cognitivo attivo',
  sottotitolo: "L'IA genera, Stockfish valida, il coach approva.",
  autore: 'Luca Morigi',
  aggiornato: 'Marzo 2026',
  versione: 'v3.0',
}

export const numeri = [
  { valore: '3+', label: 'Fasi completate' },
  { valore: '~30h', label: 'Lavoro investito' },
  { valore: '4.7M', label: 'Puzzle Lichess' },
  { valore: '8–12', label: 'Età target (anni)' },
]

export const visione = {
  problema: `Gli scacchi sono uno strumento eccezionale per sviluppare il pensiero strategico nei bambini — ma il metodo tradizionale si basa sulla memorizzazione delle mosse, non sul ragionamento. Il bambino impara a copiare, non a pensare.`,
  soluzione: `NeuroScacchi introduce un principio non negoziabile: non si toccano i pezzi senza aver prima pensato. Ogni interazione con la scacchiera è preceduta da un momento esplicito di ragionamento strutturato, guidato da tre attività cognitive specifiche.`,
  principio: 'Non si toccano i pezzi senza aver prima pensato.',
  target: 'Bambini 8–12 anni, seguiti da un coach umano che crea, approva e monitora le lezioni.',
}

export const metodo = {
  ciclo: ['Osserva', 'Ragiona', 'Scegli', 'Rifletti'],
  attivita: [
    {
      nome: 'Intent',
      colore: '#1565C0',
      bg: '#E3F2FD',
      descrizione: 'Identifica il piano strategico. Multiple choice con opzioni plausibili — il bambino sceglie prima di vedere la mossa.',
    },
    {
      nome: 'Detective',
      colore: '#E64A19',
      bg: '#FBE9E7',
      descrizione: 'Trova la casa o il pezzo chiave. Click diretto sulla scacchiera — traduce il ragionamento in azione visiva.',
    },
    {
      nome: 'Candidate',
      colore: '#2E7D32',
      bg: '#E8F5E9',
      descrizione: 'Genera tutte le mosse candidate valide prima di analizzarne una. Combatte il pensiero circolare (Kotov, 1971).',
    },
    {
      nome: 'Move',
      colore: '#6A1B9A',
      bg: '#F3E5F5',
      descrizione: "Esegui la mossa sulla scacchiera. La comprensione precede sempre l'esecuzione.",
    },
  ],
}

export const intelligenze = [
  {
    nome: 'Intelligenza Artificiale',
    ruolo: 'Pianifica e costruisce',
    dettaglio: 'Claude / Gemini generano la struttura pedagogica — domande, opzioni, spiegazioni. Non calcolano mai mosse o FEN. La pedagogia è loro; gli scacchi no.',
    icona: '◆',
    colore: '#6366f1',
  },
  {
    nome: 'Stockfish',
    ruolo: 'Valida e analizza',
    dettaglio: "Il motore scacchistico analizza ogni posizione, certifica la legalità delle mosse, fornisce la best move e l'eval. Nessun errore scacchistico può passare.",
    icona: '♜',
    colore: '#059669',
  },
  {
    nome: 'Coach Umano',
    ruolo: 'Rivede e approva',
    dettaglio: "Il coach legge ogni lezione generata e la approva prima che lo studente la veda. L'approvazione umana non è bypassabile — è il filtro finale.",
    icona: '◉',
    colore: '#d97706',
  },
]

export const fasi = [
  {
    id: 'f0',
    nome: 'Fondamenta',
    stato: 'done',
    items: [
      'Chessground (scacchiera SVG) + chessops (logica)',
      'Stockfish WASM — analisi in-browser',
      '4.7M puzzle Lichess su Firestore',
      'Formato lezione JSON v3 — schema definitivo',
      'Multi-provider IA: Claude + Gemini',
    ],
  },
  {
    id: 'f1',
    nome: 'Console Coach + Pipeline Aperture',
    stato: 'done',
    items: [
      'Pipeline 4 passi con Lichess Opening Explorer',
      'IA pianifica → sistema valida → IA costruisce → coach approva',
      'Sistema feedback coach (stelle per step + note)',
      'Storage completo su Firestore — zero localStorage',
      'FeedbackPage per review sessioni passate',
    ],
  },
  {
    id: 'f2',
    nome: 'Player Studente',
    stato: 'done',
    items: [
      '6 tipi di attività: Intent, Detective, Candidate, Move, Text, Demo',
      'Freeze cognitivo + aiuti visivi (frecce e cerchi Chessground)',
      'Transizioni animate tra step',
      'Scacchiera orientabile (bianco/nero per aperture)',
    ],
  },
  {
    id: 'f2bis',
    nome: 'UX Bambini',
    stato: 'next',
    items: [
      'Palette e scacchiera marrone tradizionale',
      'Freeze color-coded per tipo attività',
      'Celebrazioni e feedback emotivo (risposta corretta, completamento)',
      'Differenziazione visiva per tipo di attività',
      'Tipografia e bottoni ottimizzati per 8–12 anni',
    ],
  },
  {
    id: 'f3',
    nome: 'Scheda Studente',
    stato: 'todo',
    items: [
      'Profilo scacchistico e cognitivo',
      "IA che legge la scheda per personalizzare le lezioni",
      'Raccolta dati uso: accuracy, tempi, pattern di errore',
    ],
  },
  {
    id: 'f4',
    nome: 'Editor Console',
    stato: 'todo',
    items: [
      'Modifica singoli step, riordino',
      'Configurazione strumenti per lezione',
      'Personalizzazione freeze e parametri',
    ],
  },
  {
    id: 'f5',
    nome: 'Strumenti Player',
    stato: 'todo',
    items: [
      'Calibrazione della fiducia pre-mossa',
      'Domande metacognitive',
      'Feedback graduato via Stockfish',
    ],
  },
  {
    id: 'f6',
    nome: 'Percorsi',
    stato: 'todo',
    items: [
      'Sequenze di lezioni + puzzle + esami',
      'Avanzamento visivo dello studente',
      'Assemblaggio percorsi dalla Console Coach',
    ],
  },
  {
    id: 'f7',
    nome: 'Multi-utente',
    stato: 'todo',
    items: [
      'Account studenti separati',
      'Assegnazione lezioni e percorsi',
      'Dashboard risultati per il coach',
    ],
  },
]

export const stack = [
  { nome: 'React 18 + Vite', ruolo: 'UI + build', cat: 'frontend' },
  { nome: 'Chessground', ruolo: 'Scacchiera SVG interattiva', cat: 'frontend' },
  { nome: 'chessops', ruolo: 'Logica scacchistica, FEN, mosse legali', cat: 'frontend' },
  { nome: 'Stockfish WASM', ruolo: 'Analisi engine in-browser', cat: 'engine' },
  { nome: 'Firebase + Firestore', ruolo: 'Auth + database cloud', cat: 'backend' },
  { nome: 'Netlify Functions', ruolo: 'Backend serverless, proxy API', cat: 'backend' },
  { nome: 'Claude API (Anthropic)', ruolo: 'IA generativa principale', cat: 'ai' },
  { nome: 'Gemini API (Google)', ruolo: 'IA generativa alternativa', cat: 'ai' },
  { nome: 'Lichess Opening Explorer', ruolo: 'Statistiche aperture reali', cat: 'data' },
]

export const decisioniChiave = [
  {
    titolo: "L'IA fa pedagogia, il sistema fa scacchi",
    data: 'Mar 2026',
    tipo: 'architetturale',
    descrizione:
      "Gli LLM non sanno calcolare scacchi. L'IA non genera mai FEN, mosse o valutazioni — li riceve da Lichess e Stockfish come dati certificati. L'IA scrive solo domande, spiegazioni e feedback pedagogico.",
  },
  {
    titolo: 'Pipeline a 4 passi per le aperture',
    data: 'Mar 2026',
    tipo: 'architetturale',
    descrizione:
      "Passo 1: IA pianifica. Passo 2: sistema recupera dati Explorer reali + analisi SF. Passo 3: IA costruisce la lezione con i materiali certificati. Passo 4: coach approva. Nessun passo è saltabile.",
  },
  {
    titolo: 'Freeze cognitivo obbligatorio',
    data: 'Feb 2026',
    tipo: 'pedagogico',
    descrizione:
      "Prima di ogni attività la scacchiera è bloccata per 2–5 secondi. Il bambino non può muovere nulla. Non è bypassabile. Serve a creare il momento di preparazione mentale che il metodo richiede.",
  },
  {
    titolo: 'Approvazione coach non bypassabile',
    data: 'Feb 2026',
    tipo: 'pedagogico',
    descrizione:
      "Nessuna lezione generata dall'IA arriva allo studente senza che il coach l'abbia letta e approvata esplicitamente. Il coach è il filtro di qualità finale — l'IA è uno strumento, non l'autorità.",
  },
  {
    titolo: 'Zero localStorage — tutto su Firestore',
    data: 'Mar 2026',
    tipo: 'tecnico',
    descrizione:
      "Lezioni, feedback e sessioni vivono su Firestore. Il coach può rivedere tutto da qualsiasi dispositivo. I dati di feedback sono la fonte primaria per iterare sui prompt IA.",
  },
]

export const prioritaImmediate = [
  { testo: 'Iterare sui prompt aperture in base ai feedback raccolti', stato: 'active' },
  { testo: 'UX bambini: scacchiera, freeze, celebrazioni, palette', stato: 'active' },
  { testo: 'Scheda studente e personalizzazione lezioni', stato: 'planned' },
  { testo: 'Editor step nella Console Coach', stato: 'planned' },
]

// Sezioni disponibili per l'export PDF
export const SEZIONI_PDF = [
  { id: 'hero', label: 'Intestazione' },
  { id: 'visione', label: 'La visione' },
  { id: 'metodo', label: 'Il metodo' },
  { id: 'intelligenze', label: 'Le 3 intelligenze' },
  { id: 'fasi', label: 'Stato fasi' },
  { id: 'stack', label: 'Stack tecnologico' },
  { id: 'decisioni', label: 'Decisioni architetturali' },
  { id: 'priorita', label: 'Priorità immediate' },
]
