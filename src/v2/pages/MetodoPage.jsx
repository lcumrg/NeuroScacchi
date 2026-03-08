import { useRef, useState } from 'react'
import html2pdf from 'html2pdf.js'

export default function MetodoPage({ onBack }) {
  const contentRef = useRef(null)
  const [exporting, setExporting] = useState(false)

  const handleDownloadPDF = () => {
    if (!contentRef.current || exporting) return
    setExporting(true)
    html2pdf()
      .set({
        margin: [12, 12, 16, 12],
        filename: 'Metodo-NeuroScacchi-2.0.pdf',
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      })
      .from(contentRef.current)
      .save()
      .then(() => setExporting(false))
      .catch(() => setExporting(false))
  }

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={onBack}>
          &#8592; Torna alla home
        </button>
        <button
          style={{ ...styles.pdfBtn, opacity: exporting ? 0.6 : 1 }}
          onClick={handleDownloadPDF}
          disabled={exporting}
        >
          {exporting ? 'Generazione...' : 'Scarica PDF'}
        </button>
      </div>

      <div ref={contentRef}>
      <h2 style={styles.title}>Il Metodo NeuroScacchi 2.0</h2>
      <p style={styles.subtitle}>
        Un allenatore adattivo per scacchisti con ADHD che vogliono progredire davvero.
      </p>

      {/* Legenda */}
      <div style={styles.legend}>
        <span style={styles.legendItem}>
          <span style={{ ...styles.dot, background: STATUS.solid.bg }}></span> Implementato e validato
        </span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.dot, background: STATUS.open.bg }}></span> Da approfondire
        </span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.dot, background: STATUS.critical.bg }}></span> Criticita aperta
        </span>
      </div>

      {/* --- Sezione 1: La visione --- */}
      <Section status="solid" title="La visione">
        <p>
          NeuroScacchi nasce per scacchisti con ADHD che competono e vogliono migliorare.
          Non e' un'app "semplificata" — e' un allenatore che conosce il tuo funzionamento cognitivo
          e adatta il training di conseguenza.
        </p>
        <p>
          L'idea di fondo: le difficolta delle funzioni esecutive (impulsivita, scarsa pianificazione,
          bassa tolleranza alla frustrazione) non sono difetti da nascondere, ma variabili misurabili
          su cui costruire un percorso di allenamento personalizzato.
        </p>
      </Section>

      {/* --- Sezione 2: I 4 parametri cognitivi --- */}
      <Section status="solid" title="Profilo cognitivo — 4 parametri">
        <p>
          Ogni studente ha un profilo con 4 parametri, ciascuno regolabile su 3 livelli
          (alta / media / bassa). Ogni parametro controlla un comportamento concreto dell'app:
        </p>
        <div style={styles.paramGrid}>
          <ParamCard
            name="Impulsivita"
            desc="Quanto tendi a muovere senza pensare"
            effect="Freeze: 5s (alta) / 3s (media) / 1s (bassa)"
            detail="Prima di ogni posizione l'app ti blocca e ti obbliga a osservare la scacchiera.
                    Se sei impulsivo, il freeze dura di piu."
          />
          <ParamCard
            name="Consapevolezza minacce"
            desc="Quanto noti le minacce dell'avversario"
            effect="Profilassi: sempre / ogni 3 / mai"
            detail="Prima di giocare, l'app ti mostra 3 mosse dell'avversario e ti chiede quale sia
                    la piu pericolosa. Se la tua consapevolezza e' bassa, lo fa sempre."
          />
          <ParamCard
            name="Metacognizione"
            desc="Quanto rifletti sui tuoi errori"
            effect="Domande post-errore: ogni errore / ogni 2 / ogni 4"
            detail="Dopo un errore, l'app ti pone una domanda ('Avevi un piano in mente?').
                    Se la tua metacognizione e' bassa, lo fa piu spesso."
          />
          <ParamCard
            name="Tolleranza frustrazione"
            desc="Quanto reggi l'errore senza demotivarti"
            effect="Hint: 2 (bassa) / 3 (media) / illimitati (alta)"
            detail="L'app ti da suggerimenti progressivi. Se la tua tolleranza e' bassa, dopo 2 hint
                    ti rivela la soluzione per non bloccarti."
          />
        </div>
      </Section>

      {/* --- Sezione 3: Spaced Repetition --- */}
      <Section status="solid" title="Ripetizione spaziata (Leitner)">
        <p>
          Le posizioni vengono ripetute a intervalli crescenti: 1, 3, 7, 14, 30 giorni.
          Se sbagli, la posizione torna all'inizio. Se la azzecchi, avanza.
          Dopo 5 passaggi consecutivi corretti, la posizione e' "consolidata".
        </p>
        <p>
          Il sistema Leitner e' usato da decenni nella didattica ed e' ben validato.
          Applicato agli scacchi, assicura che le posizioni difficili vengano riviste piu spesso,
          senza sovraccaricare con quelle gia acquisite.
        </p>
      </Section>

      {/* --- Sezione 4: Sessioni adattive --- */}
      <Section status="solid" title="Sessioni generate su misura">
        <p>
          Il session engine combina tre criteri per generare ogni sessione:
        </p>
        <ul style={styles.list}>
          <li><strong>Spaced repetition</strong> — prima le posizioni scadute</li>
          <li><strong>Difficolta adattiva</strong> — il livello si calibra sui tuoi risultati per tema</li>
          <li><strong>Direttive del coach</strong> — il coach puo forzare temi, difficolta, posizioni specifiche</li>
        </ul>
        <p>
          Il risultato: ogni sessione e' diversa e calibrata su dove sei adesso, non su dove eri ieri.
        </p>
      </Section>

      {/* --- Sezione 5: Stockfish --- */}
      <Section status="open" title="Integrazione Stockfish — il salto di qualita">
        <p>
          Oggi l'app verifica le mosse contro una lista di soluzioni pre-scritte.
          Con Stockfish (motore scacchistico open source, gira nel browser via WebAssembly),
          l'analisi diventa in tempo reale:
        </p>
        <ul style={styles.list}>
          <li><strong>Soluzioni calcolate</strong>, non pre-scritte — qualsiasi FEN funziona</li>
          <li><strong>Profilassi reale</strong> — minacce con valutazione numerica, non mosse casuali</li>
          <li><strong>Difficolta oggettiva</strong> — misurata dalla profondita necessaria per trovare la mossa</li>
          <li><strong>Metacognizione contestuale</strong> — "Hai perso 3 punti nelle ultime 5 mosse. Stai andando troppo veloce?"</li>
          <li><strong>Modalita partita</strong> — non solo puzzle, ma partite intere con scaffolding cognitivo</li>
        </ul>
        <p style={styles.note}>
          Stockfish WASM analizza a depth 15-18 in ~200-500ms su telefono moderno.
          Nessun server necessario. Alternative valutate: Lc0 (troppo pesante per WASM),
          Lichess Cloud API (limitata a posizioni gia nel DB), motori JS nativi (troppo deboli).
          Stockfish resta la scelta migliore per rapporto potenza/praticita.
        </p>
      </Section>

      {/* --- Sezione 6: Feedback graduato vs muro rosso --- */}
      <Section status="critical" title="Il problema del feedback: muro rosso vs sfumature">
        <p>
          Questa e' la decisione di design piu delicata e ancora aperta.
        </p>
        <p>
          <strong>Il sistema attuale</strong>: feedback binario — la mossa e' giusta (verde) o sbagliata (rosso).
          Chiaro, immediato, inequivocabile. Ma per un giocatore ADHD con bassa tolleranza alla frustrazione,
          una sequenza di schermate rosse puo generare un "muro rosso" che porta ad abbandonare la sessione.
        </p>
        <p>
          <strong>L'alternativa con Stockfish</strong>: feedback graduato su 4 livelli basati sulla valutazione del motore:
        </p>
        <ul style={styles.list}>
          <li style={{ color: '#2E7D32' }}><strong>Ottima</strong> — la mossa migliore o equivalente (&#916;eval &lt; 0.3)</li>
          <li style={{ color: '#1565C0' }}><strong>Buona</strong> — non la migliore, ma solida (&#916;eval 0.3-1.0)</li>
          <li style={{ color: '#F57F17' }}><strong>Imprecisione</strong> — perdita moderata (&#916;eval 1.0-2.5)</li>
          <li style={{ color: '#C62828' }}><strong>Errore</strong> — perdita significativa (&#916;eval &gt; 2.5)</li>
        </ul>
        <p>
          Il feedback graduato e' piu informativo e meno punitivo. "Buona mossa, ma c'era di meglio"
          e' piu costruttivo di "SBAGLIATO". Ma introduce un rischio opposto:
        </p>
        <div style={styles.warningBox}>
          <strong>Rischio</strong>: un giocatore ADHD che compete potrebbe usare il "buona" come scusa
          per non cercare la mossa migliore. La comodita del "abbastanza bene" puo diventare
          una trappola che impedisce il vero progresso. Chi vuole competere ha bisogno di sapere
          quando una mossa e' <em>sbagliata</em>, non solo "non ottimale".
        </div>
        <p>
          <strong>Possibile soluzione ibrida</strong>: feedback graduato per default, ma con un indicatore
          chiaro di quanto si e' lontani dalla mossa migliore. Il coach potrebbe configurare la soglia
          di "errore" per ogni studente: per qualcuno &#916;eval &gt; 1.0 e' gia errore, per altri serve &gt; 2.5.
        </p>
        <p style={styles.note}>
          Questa decisione richiede una validazione con dati reali: come reagiscono diversi profili ADHD
          al feedback graduato vs binario? Il profilo cognitivo (tolleranza frustrazione) dovrebbe
          influenzare la soglia? Servono test con utenti reali prima di decidere.
        </p>
      </Section>

      {/* --- Sezione 7: Freeze per mossa --- */}
      <Section status="open" title="Freeze per ogni mossa, non solo a inizio posizione">
        <p>
          Oggi il freeze si applica solo all'inizio di ogni posizione: lo studente osserva
          la scacchiera per qualche secondo prima di poter muovere.
        </p>
        <p>
          Con Stockfish e la modalita partita, il freeze potrebbe applicarsi prima di <em>ogni</em> mossa,
          non solo alla prima. Un giocatore impulsivo spesso parte bene ma accelera a meta partita —
          proprio quando serve piu attenzione.
        </p>
        <p>
          La domanda aperta: il freeze per ogni mossa sarebbe troppo invasivo? O e' proprio quello
          che serve a un giocatore ADHD impulsivo che compete? Il profilo cognitivo potrebbe calibrarlo:
          freeze lungo a inizio posizione, freeze breve sulle mosse successive, nessun freeze
          se l'impulsivita e' bassa.
        </p>
      </Section>

      {/* --- Sezione 8: Puzzle vs Partite --- */}
      <Section status="open" title="Puzzle singoli o partite con scaffolding?">
        <p>
          Oggi l'app funziona a puzzle: una posizione, una mossa corretta, avanti.
          Con Stockfish e' possibile un modello diverso: giocare partite intere con lo scaffolding
          cognitivo attivo (freeze, profilassi, metacognizione).
        </p>
        <p>
          Per uno scacchista che compete, il puzzle tattico e' solo una parte dell'allenamento.
          La capacita di applicare il pensiero strutturato per 30-40 mosse consecutive e' altrettanto
          importante — e per un giocatore ADHD, e' spesso la parte piu difficile.
        </p>
        <p>
          Il piano: mantenere i puzzle come modalita "tattiche mirate" e aggiungere la modalita partita
          come secondo pilastro. I due si completano: i puzzle allenano il pattern recognition,
          le partite allenano la tenuta attentiva.
        </p>
      </Section>

      {/* --- Sezione 9: Cosa manca --- */}
      <Section status="open" title="Cosa manca ancora">
        <ul style={styles.list}>
          <li><strong>Validazione clinica</strong> — il metodo si basa su principi consolidati
              (spaced repetition, scaffolding cognitivo, calibrazione individuale) ma non e' stato
              ancora testato sistematicamente su una popolazione ADHD</li>
          <li><strong>Adattamento automatico del profilo</strong> — oggi il profilo e' statico,
              impostato manualmente. L'app dovrebbe analizzare i dati (tempi di risposta, pattern di errore)
              e suggerire aggiustamenti</li>
          <li><strong>Dashboard coach</strong> — il coach deve poter monitorare i progressi
              e impostare direttive senza accedere al telefono dello studente</li>
          <li><strong>Modalita esame</strong> — sessione senza aiuti per misurare
              l'interiorizzazione reale degli strumenti cognitivi</li>
        </ul>
      </Section>

      <div style={styles.footer}>
        <p style={styles.footerText}>
          NeuroScacchi 2.0 e' un progetto in evoluzione. Questa pagina viene aggiornata
          man mano che le decisioni di design si chiariscono.
        </p>
      </div>

      <div style={styles.copyright}>
        <p style={styles.copyrightText}>
          Il Metodo NeuroScacchi 2.0 e tutti i contenuti di questa pagina sono di proprieta esclusiva
          di <strong>Luca Morigi</strong>. Tutti i diritti riservati.
        </p>
        <p style={styles.copyrightText}>
          Vietata la riproduzione, distribuzione o utilizzo senza autorizzazione scritta dell'autore.
        </p>
      </div>
      </div>
    </div>
  )
}

// --- Sub-components ---

const STATUS = {
  solid:    { bg: '#2E7D32', border: '#A5D6A7', fill: '#E8F5E9', label: '#1B5E20' },
  open:     { bg: '#F57F17', border: '#FFE082', fill: '#FFF8E1', label: '#E65100' },
  critical: { bg: '#C62828', border: '#EF9A9A', fill: '#FFEBEE', label: '#B71C1C' },
}

function Section({ status, title, children }) {
  const s = STATUS[status]
  return (
    <div style={{ ...styles.section, borderLeft: `4px solid ${s.bg}`, background: s.fill }}>
      <div style={styles.sectionHeader}>
        <span style={{ ...styles.statusBadge, background: s.bg }}>{
          status === 'solid' ? 'Validato' : status === 'open' ? 'Da approfondire' : 'Critico'
        }</span>
        <h3 style={styles.sectionTitle}>{title}</h3>
      </div>
      <div style={styles.sectionBody}>{children}</div>
    </div>
  )
}

function ParamCard({ name, desc, effect, detail }) {
  return (
    <div style={styles.paramCard}>
      <div style={styles.paramName}>{name}</div>
      <div style={styles.paramDesc}>{desc}</div>
      <div style={styles.paramEffect}>{effect}</div>
      <div style={styles.paramDetail}>{detail}</div>
    </div>
  )
}

// --- Styles ---

const styles = {
  container: {
    maxWidth: 640,
    margin: '0 auto',
    padding: '24px 20px 80px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    fontSize: 14,
    color: '#5A6C7D',
    cursor: 'pointer',
    padding: '4px 0',
    fontFamily: 'inherit',
  },
  pdfBtn: {
    padding: '8px 16px',
    background: '#2C3E50',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#2C3E50',
    margin: 0,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#5A6C7D',
    margin: 0,
    textAlign: 'center',
    lineHeight: 1.5,
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: 20,
    flexWrap: 'wrap',
    padding: '8px 0',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: '#5A6C7D',
  },
  dot: {
    display: 'inline-block',
    width: 10,
    height: 10,
    borderRadius: '50%',
  },
  section: {
    borderRadius: 10,
    padding: '16px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  statusBadge: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    whiteSpace: 'nowrap',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 600,
    color: '#2C3E50',
    margin: 0,
  },
  sectionBody: {
    fontSize: 14,
    color: '#37474F',
    lineHeight: 1.7,
  },
  list: {
    margin: '8px 0',
    paddingLeft: 20,
    lineHeight: 1.8,
  },
  note: {
    fontSize: 13,
    color: '#78909C',
    fontStyle: 'italic',
    marginTop: 8,
  },
  warningBox: {
    background: '#FFF3E0',
    border: '1px solid #FFE0B2',
    borderRadius: 8,
    padding: '12px 16px',
    fontSize: 13,
    color: '#E65100',
    lineHeight: 1.6,
    margin: '10px 0',
  },
  paramGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 12,
    marginTop: 12,
  },
  paramCard: {
    background: '#fff',
    border: '1px solid #C8E6C9',
    borderRadius: 8,
    padding: '12px 14px',
  },
  paramName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#2C3E50',
    marginBottom: 2,
  },
  paramDesc: {
    fontSize: 12,
    color: '#78909C',
    marginBottom: 6,
  },
  paramEffect: {
    fontSize: 12,
    fontWeight: 600,
    color: '#2E7D32',
    background: '#E8F5E9',
    padding: '3px 8px',
    borderRadius: 4,
    display: 'inline-block',
    marginBottom: 6,
  },
  paramDetail: {
    fontSize: 12,
    color: '#546E7A',
    lineHeight: 1.5,
  },
  footer: {
    textAlign: 'center',
    paddingTop: 16,
    borderTop: '1px solid #E0E0E0',
  },
  footerText: {
    fontSize: 12,
    color: '#B0BEC5',
    margin: 0,
  },
  copyright: {
    textAlign: 'center',
    padding: '16px 20px',
    marginTop: 8,
    background: '#ECEFF1',
    borderRadius: 8,
    border: '1px solid #CFD8DC',
  },
  copyrightText: {
    fontSize: 11,
    color: '#546E7A',
    margin: '0 0 4px 0',
    lineHeight: 1.5,
  },
}
