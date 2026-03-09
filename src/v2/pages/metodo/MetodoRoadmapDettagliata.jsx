import { useState } from 'react'
import { styles } from './metodoStyles'

// ============================================================
// SOTTOPAGINA: Roadmap Dettagliata + Gap Analysis + Sviluppo Parallelo
// ============================================================

const PHASE_COLORS = {
  done:     { bg: '#E8F5E9', border: '#A5D6A7', accent: '#2E7D32', text: '#1B5E20' },
  next:     { bg: '#E3F2FD', border: '#90CAF9', accent: '#1565C0', text: '#0D47A1' },
  future:   { bg: '#ECEFF1', border: '#CFD8DC', accent: '#78909C', text: '#455A64' },
  gap:      { bg: '#FFF3E0', border: '#FFE0B2', accent: '#E65100', text: '#BF360C' },
}

function CollapsibleSection({ title, icon, defaultOpen = false, accentColor = '#283593', children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{
      borderRadius: 10,
      border: `1px solid ${open ? accentColor + '40' : '#CFD8DC'}`,
      overflow: 'hidden',
      transition: 'border-color 0.3s ease',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 16px',
          background: open ? accentColor + '08' : '#FAFBFC',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#2C3E50' }}>{title}</span>
        <span style={{
          fontSize: 18,
          color: '#78909C',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
        }}>&#9660;</span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 16px', background: '#fff' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function GapItem({ title, severity, v1Desc, v2Status, proposal }) {
  const sevColors = {
    alta: { bg: '#FFEBEE', border: '#EF9A9A', badge: '#C62828', label: 'Priorita Alta' },
    media: { bg: '#FFF8E1', border: '#FFE082', badge: '#F57F17', label: 'Priorita Media' },
    bassa: { bg: '#E8F5E9', border: '#A5D6A7', badge: '#2E7D32', label: 'Trasformato' },
  }
  const s = sevColors[severity]
  return (
    <div style={{
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: 8,
      padding: '12px 14px',
      marginTop: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{
          background: s.badge, color: '#fff', fontSize: 10, fontWeight: 700,
          padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase',
        }}>{s.label}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#2C3E50' }}>{title}</span>
      </div>
      <div style={{ fontSize: 13, color: '#37474F', lineHeight: 1.6 }}>
        <div><strong>v1.0:</strong> {v1Desc}</div>
        <div style={{ marginTop: 4 }}><strong>v2.0:</strong> {v2Status}</div>
        <div style={{
          marginTop: 8, padding: '8px 10px', background: '#E3F2FD',
          border: '1px solid #90CAF9', borderRadius: 6, fontSize: 12, color: '#1565C0',
        }}>
          <strong>Proposta:</strong> {proposal}
        </div>
      </div>
    </div>
  )
}

function PhaseDetail({ number, title, status, description, items, dependencies, effort, pillarMap }) {
  const ps = PHASE_COLORS[status]
  const statusLabels = { done: 'Completato', next: 'Prossimo', future: 'Futuro', gap: 'Da Recuperare' }
  return (
    <div style={{
      background: ps.bg,
      border: `1px solid ${ps.border}`,
      borderLeft: `4px solid ${ps.accent}`,
      borderRadius: 10,
      padding: '16px 18px',
      marginTop: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
        <span style={{
          background: ps.accent, color: '#fff', fontSize: 9, fontWeight: 700,
          padding: '2px 7px', borderRadius: 6, textTransform: 'uppercase',
        }}>{statusLabels[status]}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#2C3E50' }}>
          {number && `Strato ${number} — `}{title}
        </span>
      </div>

      {description && (
        <p style={{ fontSize: 13, color: '#546E7A', margin: '4px 0 10px', lineHeight: 1.5, fontStyle: 'italic' }}>
          {description}
        </p>
      )}

      {dependencies && (
        <div style={{
          fontSize: 12, color: '#78909C', marginBottom: 8,
          padding: '4px 8px', background: 'rgba(0,0,0,0.03)', borderRadius: 4, display: 'inline-block',
        }}>
          Dipende da: {dependencies}
        </div>
      )}

      {effort && (
        <div style={{
          fontSize: 12, color: ps.accent, marginBottom: 8, fontWeight: 600,
        }}>
          Stima: {effort}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 13 }}>
            <span style={{
              flexShrink: 0, width: 18, height: 18, borderRadius: 4,
              border: item.done ? 'none' : `2px solid ${ps.border}`,
              background: item.done ? ps.accent : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 11, fontWeight: 700, marginTop: 1,
            }}>
              {item.done ? '\u2713' : ''}
            </span>
            <div style={{ lineHeight: 1.4 }}>
              <span style={{
                color: item.done ? '#78909C' : '#37474F',
                textDecoration: item.done ? 'line-through' : 'none',
              }}>
                {item.label}
              </span>
              {item.pillar && (
                <span style={{ marginLeft: 6, fontSize: 10, color: ps.accent, fontWeight: 600, opacity: 0.7 }}>
                  [{item.pillar}]
                </span>
              )}
              {item.detail && (
                <div style={{ fontSize: 12, color: '#78909C', marginTop: 2 }}>{item.detail}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ParallelTable() {
  const sessions = [
    {
      id: 'S1',
      label: 'Sessione 1 — Fondamenta Lezioni',
      windowA: { phase: '4.9.1', task: 'Modello dati lezioni', detail: 'Schema Lezione/Percorso/Piano, Firestore collections, CRUD service, Firestore rules' },
      windowB: { phase: 'GAP-A', task: 'Visual Chunking + Arrows', detail: 'Sistema chunking visivo con evidenziazione case e frecce strategiche (recupero da v1)' },
      note: 'Nessun conflitto: 4.9.1 lavora su engine/data, GAP-A su components/UI',
    },
    {
      id: 'S2',
      label: 'Sessione 2 — Console + Player',
      windowA: { phase: '4.9.2', task: 'Console gestione lezioni (Coach)', detail: 'Editor lezione, step drag-and-drop, validazione Stockfish, preview, azioni CRUD' },
      windowB: { phase: '4.9.4', task: 'Lesson Player (Studente)', detail: 'Catalogo lezioni, player step-by-step, rendering testo/demo/puzzle, progresso Firestore' },
      note: 'Parallelo ideale: entrambi dipendono da 4.9.1, ma console e player non si toccano',
    },
    {
      id: 'S3',
      label: 'Sessione 3 — IA Evoluto + Modalita',
      windowA: { phase: '4.9.3', task: 'Coach IA potenziato + 7 integrazioni SF', detail: 'System prompt lezioni, streaming, correzione auto, PV multi-mossa, MultiPV, hint intelligenti' },
      windowB: { phase: 'GAP-B', task: 'Modalita Intent + Detective + Candidate', detail: 'Reimplementazione delle 3 modalita di apprendimento come tipi di step nelle lezioni' },
      note: '4.9.3 lavora su CoachAIPage + engine, GAP-B su components di gioco. Usano lo stesso schema step (da 4.9.1) ma file diversi',
    },
    {
      id: 'S4',
      label: 'Sessione 4 — Percorsi + Calibrazione',
      windowA: { phase: '4.9.5', task: 'Percorsi e piani di allenamento', detail: 'CRUD percorsi/piani, IA genera percorsi, Stockfish valida coerenza, UI studente' },
      windowB: { phase: 'GAP-C', task: 'Calibrazione fiducia + Self-assessment', detail: 'Sistema Sicuro/Dubbio/Non lo so, messaggi di confronto, self-assessment a fine sessione' },
      note: '4.9.5 lavora su pagine gestione, GAP-C su componenti della sessione di allenamento',
    },
    {
      id: 'S5',
      label: 'Sessione 5 — Freeze Evoluto + Partite',
      windowA: { phase: '5.1', task: 'Freeze prima di ogni mossa', detail: 'Freeze non solo a inizio posizione ma ad ogni mossa, anti-decadimento vigilanza, calibrazione dal profilo' },
      windowB: { phase: '5.2', task: 'Modalita partita vs Stockfish', detail: 'GamePage, Stockfish come avversario con livello regolabile, scaffolding completo su ogni mossa' },
      note: '5.1 modifica FreezeOverlay (componente), 5.2 crea una nuova pagina. Freeze evoluto va integrato dopo nella GamePage',
    },
    {
      id: 'S6',
      label: 'Sessione 6 — Partite SR + Esame',
      windowA: { phase: '5.3', task: 'Spaced repetition per partite', detail: 'Posizioni critiche delle partite nel Leitner, ciclo partita-errori-puzzle-partita' },
      windowB: { phase: '6.3', task: 'Modalita esame (senza aiuti)', detail: 'Sessione senza scaffolding, confronto guidato vs autonomo, report per il coach' },
      note: '5.3 lavora su sessionEngine/spacedRepetition, 6.3 crea un nuovo mode in SessionRunner',
    },
    {
      id: 'S7',
      label: 'Sessione 7 — Osservazione + Dashboard',
      windowA: { phase: '6.1+6.2', task: 'Protocollo osservazione + Adattamento profilo', detail: 'Log reazioni, test duale, suggerimenti auto-adattamento, coach approva' },
      windowB: { phase: '6.4', task: 'Dashboard coach multi-utente', detail: 'Lista studenti, gestione direttive, alert, progressi, sistema multi-utente Firebase' },
      note: 'Protocollo osservazione e dashboard sono funzionalita coach diverse: una raccoglie dati, l\'altra li visualizza',
    },
    {
      id: 'S8',
      label: 'Sessione 8 — IA Studente + Export',
      windowA: { phase: '8.1+8.2', task: 'IA analista post-sessione + Scaffolding dialogico', detail: 'Report testuale trend, microlezioni, l\'agente coach evolve per lo studente' },
      windowB: { phase: '6.5', task: 'Export dati (CSV, PDF)', detail: 'Export sessioni CSV, report PDF per genitori/scuola, analisi partite Stockfish' },
      note: 'IA lavora su CoachAI/nuove pagine, export lavora su utils/report. Completamente indipendenti',
    },
  ]

  return (
    <div>
      <p style={{ fontSize: 13, color: '#546E7A', lineHeight: 1.6, margin: '0 0 16px' }}>
        Questa tabella organizza tutto il lavoro rimanente in <strong>8 sessioni di sviluppo parallelo</strong>.
        Ogni sessione ha due "finestre" (Window A e B) che lavorano contemporaneamente su file e aree
        del codice diverse, senza creare conflitti di merge. Le sessioni vanno eseguite in ordine
        perche ogni riga dipende dalle precedenti.
      </p>

      {sessions.map((s) => (
        <div key={s.id} style={{
          marginBottom: 16,
          borderRadius: 10,
          border: '1px solid #CFD8DC',
          overflow: 'hidden',
        }}>
          {/* Session header */}
          <div style={{
            background: '#283593',
            color: '#fff',
            padding: '10px 14px',
            fontSize: 14,
            fontWeight: 700,
          }}>
            {s.label}
          </div>

          {/* Two windows side by side */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 0,
          }}>
            {/* Window A */}
            <div style={{
              padding: '12px 14px',
              borderRight: '1px solid #E0E0E0',
              background: '#F1F8E9',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{
                  background: '#558B2F', color: '#fff', fontSize: 10, fontWeight: 700,
                  padding: '2px 6px', borderRadius: 4,
                }}>A</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: '#558B2F',
                  fontFamily: 'monospace',
                }}>{s.windowA.phase}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#2C3E50', marginBottom: 4 }}>
                {s.windowA.task}
              </div>
              <div style={{ fontSize: 12, color: '#546E7A', lineHeight: 1.5 }}>
                {s.windowA.detail}
              </div>
            </div>

            {/* Window B */}
            <div style={{
              padding: '12px 14px',
              background: '#E3F2FD',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{
                  background: '#1565C0', color: '#fff', fontSize: 10, fontWeight: 700,
                  padding: '2px 6px', borderRadius: 4,
                }}>B</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: '#1565C0',
                  fontFamily: 'monospace',
                }}>{s.windowB.phase}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#2C3E50', marginBottom: 4 }}>
                {s.windowB.task}
              </div>
              <div style={{ fontSize: 12, color: '#546E7A', lineHeight: 1.5 }}>
                {s.windowB.detail}
              </div>
            </div>
          </div>

          {/* Note */}
          <div style={{
            padding: '8px 14px',
            background: '#FAFBFC',
            borderTop: '1px solid #E0E0E0',
            fontSize: 12,
            color: '#78909C',
            fontStyle: 'italic',
          }}>
            {s.note}
          </div>
        </div>
      ))}

      {/* Summary */}
      <div style={{
        marginTop: 16,
        background: '#E8EAF6',
        border: '1px solid #C5CAE9',
        borderRadius: 8,
        padding: '12px 16px',
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#283593', marginBottom: 6 }}>Riepilogo</div>
        <div style={{ fontSize: 13, color: '#37474F', lineHeight: 1.7 }}>
          <strong>8 sessioni sequenziali</strong>, ognuna con <strong>2 task paralleli</strong> = 16 blocchi di lavoro totali.<br />
          Senza parallelismo: ~16 sessioni. Con parallelismo: ~8 sessioni (<strong>risparmio ~50%</strong>).<br />
          Le fasi GAP (recupero idee v1.0) sono distribuite nelle prime 4 sessioni per non accumularle tutte alla fine.
        </div>
      </div>
    </div>
  )
}

function DependencyGraph() {
  return (
    <div style={{
      fontFamily: 'monospace',
      fontSize: 12,
      lineHeight: 2,
      color: '#37474F',
      background: '#ECEFF1',
      borderRadius: 8,
      padding: '16px 20px',
      overflowX: 'auto',
      whiteSpace: 'pre',
    }}>
{`STRATO 4.9 — Sistema Lezioni
  4.9.1 Modello dati ──────────────────────────────┐
    ├──> 4.9.2 Console coach ──> 4.9.3 IA evoluto  │
    │                                    │          │
    └──> 4.9.4 Lesson player ───────────>│          │
                                         v          │
                                    4.9.5 Percorsi  │
                                                    │
GAP v1.0 (recupero idee)                            │
  GAP-A Visual chunking + arrows ──── indipendente  │
  GAP-B Modalita intent/detective ──> usa schema ───┘
  GAP-C Calibrazione fiducia ──────── indipendente

STRATO 5 — Freeze + Partite (dopo 4.9)
  5.1 Freeze per mossa ──┐
  5.2 Partita vs SF ─────┼──> 5.3 SR per partite
                         │
STRATO 6 — Test + Coach (dopo 5)
  6.1 Protocollo oss. ──┐
  6.2 Auto-profilo ─────┼──> 6.4 Dashboard coach
  6.3 Modalita esame    │
  6.5 Export dati ──────── indipendente

STRATO 8 — IA Studente (dopo 6)
  8.1 Analista post-sess ──> 8.2 Scaffolding dialog
  8.3 Agente real-time (futuro)`}
    </div>
  )
}

export default function MetodoRoadmapDettagliata({ onBack }) {
  return (
    <div style={{
      maxWidth: 700,
      margin: '0 auto',
      padding: '24px 20px 80px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', fontSize: 14,
            color: '#5A6C7D', cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit',
          }}
        >
          &#8592; Torna al Metodo
        </button>
      </div>

      <h2 style={{
        fontSize: 22, fontWeight: 700, color: '#2C3E50',
        margin: 0, textAlign: 'center',
      }}>
        Roadmap Dettagliata
      </h2>
      <p style={{
        fontSize: 14, color: '#5A6C7D', margin: 0,
        textAlign: 'center', lineHeight: 1.5,
      }}>
        Analisi completa dello stato del progetto, gap con la v1.0,
        piano di sviluppo e strategia di parallelismo.
      </p>

      {/* Legenda */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', padding: '4px 0' }}>
        {[
          { color: PHASE_COLORS.done.accent, label: 'Completato' },
          { color: PHASE_COLORS.next.accent, label: 'Prossimo' },
          { color: PHASE_COLORS.gap.accent, label: 'Gap da v1.0' },
          { color: PHASE_COLORS.future.accent, label: 'Futuro' },
        ].map((l, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#5A6C7D' }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>

      {/* ============================================================ */}
      {/* SEZIONE 1: GAP ANALYSIS v1.0 → v2.0 */}
      {/* ============================================================ */}
      <CollapsibleSection
        title="Gap Analysis: v1.0 → v2.0"
        icon="&#128269;"
        defaultOpen={true}
        accentColor="#E65100"
      >
        <p style={{ fontSize: 13, color: '#546E7A', lineHeight: 1.6, margin: '10px 0' }}>
          La versione 2.0 ha ridisegnato l'architettura da zero con Stockfish e layer cognitivo automatico,
          ma nel processo alcune idee fondamentali della v1.0 non sono state trasferite.
          Queste non sono "piccoli dettagli" — sono meccaniche di apprendimento validate.
        </p>

        <GapItem
          title="Tre Modalita di Apprendimento (Intent / Detective / Candidate)"
          severity="alta"
          v1Desc="Tre modalita complementari che forzano pensiero attivo: Intent (perche muovi? — 3 opzioni), Detective (click sulla casa chiave — scansione visiva), Candidate (identifica N mosse prima di scegliere — analisi sistematica). Ogni modalita allena un aspetto diverso del ragionamento scacchistico."
          v2Status="Completamente assente. Il Freeze e' solo una pausa passiva — non richiede pensiero attivo. Lo studente aspetta il countdown e poi muove, senza dover dimostrare che ha ragionato."
          proposal="Reimplementare come tipi di step nelle lezioni (4.9). Intent, Detective e Candidate diventano tipi di step oltre a 'text', 'puzzle' e 'demo'. Possono anche essere attivati nella sessione puzzle standard come opzione del profilo cognitivo."
        />

        <GapItem
          title="Calibrazione Fiducia e Messaggi di Confronto"
          severity="alta"
          v1Desc="Prima di confermare la mossa, lo studente dichiara il suo livello di fiducia: Sicuro / Dubbio / Non lo so. Dopo il risultato, riceve un messaggio di confronto personalizzato (22 template) che compara fiducia dichiarata vs risultato reale. Insegna la metacognizione calibrativa — sapere cosa sai."
          v2Status="La profilassi v2.0 fa un lavoro diverso (identifica minacce con Stockfish). Il concetto di auto-calibrazione della fiducia e' completamente assente."
          proposal="Aggiungere la calibrazione come fase opzionale tra il freeze e la mossa. Integrare con Stockfish: confronto fiducia vs deltaEval. I messaggi di confronto diventano piu precisi ('Eri sicuro, ma hai perso 2.3 punti — la tua mossa era buona ma non la migliore')."
        />

        <GapItem
          title="Visual Chunking (Evidenziazione Gruppi di Case)"
          severity="alta"
          v1Desc="Dopo risposta corretta, le case chiave vengono evidenziate con gradiente radiale verde, formando un 'chunk' visivo. Basato sulla teoria di Gobet: riduce il carico sulla memoria di lavoro raggruppando 5-7 case in un singolo concetto visivo."
          v2Status="Assente. Il feedback graduato Stockfish mostra solo la classificazione della mossa, non evidenzia i pattern sulla scacchiera."
          proposal="Implementare come overlay sulla scacchiera, attivabile per posizioni che hanno chunks definiti. Nei puzzle classici: definiti dal coach nella posizione. Con Stockfish: auto-generati dalla variante principale (case coinvolte nella combinazione)."
        />

        <GapItem
          title="Arrow Patterns (Frecce Strategiche)"
          severity="media"
          v1Desc="Frecce visive tra case correlate dopo la risposta corretta: diagonali dell'alfiere, percorsi del cavallo, linee di attacco. Rinforzano l'idea strategica in modo visivo, non solo verbale."
          v2Status="Assente. react-chessboard supporta le frecce nativamente, ma non vengono usate."
          proposal="Aggiungere come dato opzionale nella posizione (come in v1). Nelle lezioni: il coach o l'IA possono definire frecce per ogni step puzzle/demo. Stockfish puo auto-generare frecce dalla variante principale."
        />

        <GapItem
          title="Sequenze Multi-Step con Modalita Miste"
          severity="media"
          v1Desc="Lezioni da 2-10 step che combinano Intent + Detective + Candidate in sequenza (tipo 'mista'). Ogni step puo avere un tipo diverso, creando mini-percorsi didattici coerenti di 2-10 minuti."
          v2Status="Pianificato nello Strato 4.9 come sistema lezioni con step, ma i tipi di step previsti sono solo 'text', 'puzzle' e 'demo' — mancano intent, detective e candidate."
          proposal="Estendere il modello step di 4.9 con i tipi 'intent', 'detective' e 'candidate'. Il LessonPlayer renderizza ogni tipo con il componente appropriato. L'IA puo generare lezioni miste che combinano tutti i tipi."
        />

        <GapItem
          title="Reflection Prompts con Attribuzione Errore"
          severity="media"
          v1Desc="Dopo il 2o errore: 'Perche hai sbagliato?' con opzioni specifiche: 'Ho avuto fretta' / 'Non ho guardato bene' / 'Non ho capito la posizione' / 'Altro'. Insegna l'auto-attribuzione — capire PERCHE si sbaglia, non solo CHE si sbaglia."
          v2Status="La metacognizione contestuale v2.0 fa domande basate su eval/tempo (ottime), ma sono domande Si/No. Manca la parte di attribuzione strutturata dell'errore."
          proposal="Combinare i due approcci: dopo un errore significativo (deltaEval > 2.5), prima la domanda contestuale Stockfish, poi la richiesta di attribuzione. I dati di attribuzione alimentano l'analytics (pattern: 'il 70% degli errori e' per fretta')."
        />

        <GapItem
          title="Self-Assessment a Fine Sessione"
          severity="bassa"
          v1Desc="A fine sessione lo studente valuta: difficolta percepita (emoji), velocita percepita, auto-correzione. Fornisce dati qualitativi preziosi sulla percezione soggettiva vs dati oggettivi."
          v2Status="SessionSummary mostra statistiche oggettive (corrette/sbagliate, tempo, precisione) ma non chiede la percezione soggettiva dello studente."
          proposal="Aggiungere 2-3 domande rapide prima del riepilogo numerico. Confronto percezione vs realta diventa un insight in StatsPage ('Percepisci le sessioni come facili, ma la precisione e' sotto il 60% — potresti sottovalutare la difficolta')."
        />
      </CollapsibleSection>

      {/* ============================================================ */}
      {/* SEZIONE 2: GRAFO DIPENDENZE */}
      {/* ============================================================ */}
      <CollapsibleSection
        title="Grafo delle Dipendenze"
        icon="&#128279;"
        accentColor="#283593"
      >
        <p style={{ fontSize: 13, color: '#546E7A', lineHeight: 1.6, margin: '10px 0' }}>
          Questo schema mostra quali fasi dipendono da quali altre.
          Le fasi sullo stesso livello orizzontale possono essere sviluppate in parallelo.
        </p>
        <DependencyGraph />
      </CollapsibleSection>

      {/* ============================================================ */}
      {/* SEZIONE 3: ROADMAP FASE PER FASE */}
      {/* ============================================================ */}
      <CollapsibleSection
        title="Roadmap Completa — Fase per Fase"
        icon="&#128204;"
        defaultOpen={true}
        accentColor="#1565C0"
      >
        {/* Strati 0-3 */}
        <PhaseDetail
          number="0-3"
          title="Fondamenta"
          status="done"
          description="MVP funzionante con spaced repetition, profilo cognitivo, profilassi, metacognizione, difficolta adattiva e analytics."
          items={[
            { label: 'Schema posizioni + 25 puzzle + validazione pre-build', done: true },
            { label: 'TrainingSession con freeze, hint, feedback', done: true },
            { label: 'Spaced repetition Leitner 5 box', done: true, pillar: 'Consolidamento' },
            { label: 'Profilo cognitivo 4 parametri x 3 livelli', done: true, pillar: 'Tutti' },
            { label: 'Profilassi (identifica minacce) + Metacognizione', done: true, pillar: 'Memoria / Metacognizione' },
            { label: 'Difficolta adattiva + Session Engine + Percorsi tematici', done: true, pillar: 'Adattivita' },
            { label: 'StatsPage con insight e progresso per tema', done: true, pillar: 'Analytics' },
          ]}
        />

        {/* Strato 4 */}
        <PhaseDetail
          number="4"
          title="Stockfish Core"
          status="done"
          description="Il motore scacchistico nel browser. Abilita feedback graduato, profilassi reale, metacognizione contestuale, difficolta calcolata e Coach IA."
          items={[
            { label: 'Stockfish WASM via Web Worker (depth 16, timeout 15s)', done: true, pillar: 'Infrastruttura' },
            { label: 'Feedback graduato: ottima/buona/imprecisione/errore (deltaEval)', done: true, pillar: 'Regolazione emotiva' },
            { label: 'Profilassi reale con MultiPV + eval numerica', done: true, pillar: 'Memoria di lavoro' },
            { label: 'Difficolta calcolata automaticamente (depth → difficulty)', done: true, pillar: 'Infrastruttura' },
            { label: 'Metacognizione contestuale (domande basate su eval, tempo, pattern)', done: true, pillar: 'Metacognizione' },
            { label: 'Validazione posizioni con Stockfish (--fix, --fix-all)', done: true, pillar: 'Qualita' },
            { label: 'Coach IA: chat, generazione posizioni, analisi PGN', done: true, pillar: 'Contenuti' },
            { label: 'Firebase logging per-mossa + per-sessione + Leitner cloud', done: true, pillar: 'Infrastruttura' },
          ]}
        />

        {/* Strato 7 (Design System - completato) */}
        <PhaseDetail
          number="7"
          title="Design System ADHD-Friendly"
          status="done"
          description="Identita visiva progettata per minimizzare il carico cognitivo. Ogni elemento ha una funzione precisa."
          items={[
            { label: 'Font Nunito + Atkinson Hyperlegible, scala 14-32px', done: true, pillar: 'Accessibilita' },
            { label: 'Colori esclusivi classificazione mosse (verde/arancio/rosso)', done: true, pillar: 'Regolazione emotiva' },
            { label: 'Freeze visual: vignettatura + blur(7px) + indaco', done: true, pillar: 'Inibizione' },
            { label: 'Tema chiaro/scuro con contrasto calibrato', done: true, pillar: 'Accessibilita' },
            { label: 'Layout single-action per schermata', done: true, pillar: 'Memoria di lavoro' },
          ]}
        />

        {/* Gap recovery */}
        <PhaseDetail
          title="Recupero Idee v1.0"
          status="gap"
          description="Le meccaniche didattiche validate della v1.0 che devono essere reintegrate nell'architettura v2.0. Vanno distribuite nelle sessioni di sviluppo parallelo."
          items={[
            { label: 'GAP-A: Visual Chunking + Arrow Patterns', done: false, pillar: 'Memoria di lavoro',
              detail: 'Evidenziazione case chiave + frecce strategiche sulla scacchiera. Riduce carico WM.' },
            { label: 'GAP-B: Modalita Intent + Detective + Candidate', done: false, pillar: 'Inibizione / Metacognizione',
              detail: 'Tre modi di interazione attiva: domanda strategica, click su casa, mosse candidate. Diventano tipi di step nelle lezioni.' },
            { label: 'GAP-C: Calibrazione fiducia + Messaggi confronto', done: false, pillar: 'Metacognizione',
              detail: 'Sicuro/Dubbio/Non lo so prima della mossa + confronto con risultato reale. Integrazione con deltaEval Stockfish.' },
            { label: 'GAP-D: Reflection Prompts con attribuzione', done: false, pillar: 'Metacognizione',
              detail: 'Dopo errore significativo: perche hai sbagliato? Opzioni strutturate. Si combina con metacognizione contestuale.' },
            { label: 'GAP-E: Self-assessment a fine sessione', done: false, pillar: 'Metacognizione',
              detail: 'Difficolta percepita, velocita, auto-correzione. Confronto percezione vs dati oggettivi nelle stats.' },
          ]}
        />

        {/* Strato 4.9 */}
        <PhaseDetail
          number="4.9"
          title="Sistema Lezioni e Coach IA Evoluto"
          status="next"
          description="L'IA struttura la didattica, Stockfish garantisce la verita scacchistica. Il coach umano dirige, lo studente segue."
          dependencies="Strato 4 completato"
          effort="5 sotto-fasi, stimato 4-5 sessioni di sviluppo"
          items={[
            { label: '4.9.1 — Modello dati lezioni (Lezione, Percorso, Piano) + Firestore + CRUD', done: false, pillar: 'Infrastruttura',
              detail: 'Schema con step tipizzati (text, puzzle, demo + intent, detective, candidate da GAP-B). Storage Firestore.' },
            { label: '4.9.2 — Console gestione lezioni per il coach', done: false, pillar: 'Contenuti',
              detail: 'Editor step drag-and-drop, editing inline per tipo, validazione SF integrata, preview, CRUD.' },
            { label: '4.9.3 — Coach IA potenziato: lezioni intere, streaming, output strutturato', done: false, pillar: 'Contenuti',
              detail: 'System prompt evoluto, genera lezioni/percorsi/piani. Flusso: genera → rivedi → salva → rifina.' },
            { label: '4.9.3b — 7 integrazioni Stockfish nella creazione', done: false, pillar: 'Qualita',
              detail: 'Correzione auto, PV multi-mossa, MultiPV alternative, calibrazione difficolta, hint intelligenti, analisi PGN, verifica demo.' },
            { label: '4.9.4 — Lesson Player studente (testo, demo, puzzle, intent, detective, candidate)', done: false, pillar: 'Tutti',
              detail: 'Catalogo, player step-by-step, progresso Firestore, puzzle errati → Leitner. Include le modalita v1.0 reimplementate.' },
            { label: '4.9.5 — Percorsi e piani di allenamento', done: false, pillar: 'Contenuti',
              detail: 'CRUD percorsi/piani, IA genera su richiesta, SF valida coerenza, UI studente con progresso visuale.' },
          ]}
        />

        {/* Strato 5 */}
        <PhaseDetail
          number="5"
          title="Freeze Evoluto + Modalita Partita"
          status="future"
          description="Dal puzzle alla partita completa. Il freeze si evolve per contrastare il decadimento della vigilanza."
          dependencies="Strato 4.9 completato"
          effort="3 sotto-fasi, stimato 1-2 sessioni"
          items={[
            { label: '5.1 — Freeze prima di ogni mossa (non solo a inizio posizione)', done: false, pillar: 'Inibizione',
              detail: 'Calibrazione dal profilo. Si allunga se il giocatore accelera troppo. Toggle per puzzle classici.' },
            { label: '5.2 — Partita vs Stockfish con scaffolding completo', done: false, pillar: 'Tutti',
              detail: 'GamePage, SF come avversario regolabile, freeze+profilassi+meta+feedback su ogni mossa, barra eval opzionale.' },
            { label: '5.3 — Errori di partita nel sistema Leitner', done: false, pillar: 'Consolidamento',
              detail: 'Posizioni critiche (deltaEval > 2.0) salvate come puzzle. Ciclo: partita → errori → puzzle → partita migliore.' },
          ]}
        />

        {/* Strato 6 */}
        <PhaseDetail
          number="6"
          title="Test Duale e Validazione"
          status="future"
          description="Verifica sul campo: lo scaffolding funziona? Lo studente lo interiorizza? Il coach monitora."
          dependencies="Strati 4-5 funzionanti"
          effort="5 sotto-fasi, stimato 2-3 sessioni"
          items={[
            { label: '6.1 — Protocollo osservazione (scaffolding come aiuto o interferenza?)', done: false, pillar: 'Clinico' },
            { label: '6.2 — Adattamento automatico profilo cognitivo (coach approva)', done: false, pillar: 'Tutti' },
            { label: '6.3 — Modalita esame senza scaffolding + confronto guidato vs autonomo', done: false, pillar: 'Validazione' },
            { label: '6.4 — Dashboard coach multi-utente con direttive e alert', done: false, pillar: 'Infrastruttura' },
            { label: '6.5 — Export dati (CSV sessioni, PDF report per genitori/scuola)', done: false, pillar: 'Infrastruttura' },
          ]}
        />

        {/* Strato 8 */}
        <PhaseDetail
          number="8"
          title="IA verso lo Studente"
          status="future"
          description="L'agente che ha lavorato con il coach evolve per interagire direttamente con lo studente."
          dependencies="Strato 6 completato + Coach IA gia operativo"
          effort="4 sotto-fasi, stimato 2-3 sessioni"
          items={[
            { label: '8.1 — IA analista post-sessione: report, trend, suggerimenti', done: false, pillar: 'Metacognizione' },
            { label: '8.2 — Scaffolding dialogico e microlezioni contestuali (2-3 min)', done: false, pillar: 'Tutti' },
            { label: '8.3 — Analisi repertorio: dove il repertorio crolla, studio mirato', done: false, pillar: 'Consolidamento' },
            { label: '8.4 — Agente real-time: calibra freeze/profilassi/difficolta in tempo reale (futuro)', done: false, pillar: 'Tutti',
              detail: 'Richiede latenza ultra-bassa (Groq o equivalente). Architettura a stato persistente.' },
          ]}
        />
      </CollapsibleSection>

      {/* ============================================================ */}
      {/* SEZIONE 4: SVILUPPO PARALLELO */}
      {/* ============================================================ */}
      <CollapsibleSection
        title="Piano di Sviluppo Parallelo (2 Finestre)"
        icon="&#9997;"
        defaultOpen={true}
        accentColor="#558B2F"
      >
        <ParallelTable />
      </CollapsibleSection>

      {/* ============================================================ */}
      {/* SEZIONE 5: NOTE OPERATIVE */}
      {/* ============================================================ */}
      <CollapsibleSection
        title="Note Operative"
        icon="&#128221;"
        accentColor="#78909C"
      >
        <div style={{ fontSize: 13, color: '#37474F', lineHeight: 1.7 }}>
          <p style={{ margin: '10px 0' }}>
            <strong>Come usare le due finestre:</strong><br />
            Aprire due istanze di Claude Code sulla stessa macchina, ognuna nella propria directory di lavoro.
            La Finestra A lavora su un branch (es. <code>claude/parallel-a</code>),
            la Finestra B su un altro (es. <code>claude/parallel-b</code>).
            A fine sessione, merge sequenziale: prima A in main, poi B in main (risolvendo eventuali conflitti minimi).
          </p>

          <p style={{ margin: '10px 0' }}>
            <strong>Regola anti-conflitto:</strong><br />
            Ogni riga della tabella e' stata progettata perche le due finestre lavorino su <em>file diversi</em>.
            La Finestra A lavora tipicamente su engine/service/data, la Finestra B su components/pages/UI.
            L'unico punto di contatto e' lo schema dati (4.9.1), che va completato <em>prima</em> di aprire
            le due finestre.
          </p>

          <p style={{ margin: '10px 0' }}>
            <strong>Le fasi GAP sono distribuite, non concentrate:</strong><br />
            Invece di recuperare tutte le idee v1.0 in un blocco separato, sono state inserite nelle sessioni
            di sviluppo parallelo dove hanno piu senso: GAP-A (visual) con le fondamenta dati, GAP-B (modalita)
            con l'IA, GAP-C (calibrazione) con i percorsi. Questo evita un "debito tecnico" che cresce.
          </p>

          <p style={{ margin: '10px 0' }}>
            <strong>Priorita assoluta:</strong><br />
            La Sessione 1 (4.9.1 + GAP-A) e' il collo di bottiglia. Tutto il resto dipende dal modello dati.
            Il visual chunking (GAP-A) e' invece indipendente e puo partire subito come warm-up.
          </p>
        </div>
      </CollapsibleSection>

      {/* Footer */}
      <div style={{
        textAlign: 'center', paddingTop: 16, borderTop: '1px solid #E0E0E0',
      }}>
        <p style={{ fontSize: 12, color: '#B0BEC5', margin: 0 }}>
          Ultimo aggiornamento: 9 Marzo 2026 — Roadmap Dettagliata v1.0
        </p>
      </div>
    </div>
  )
}
