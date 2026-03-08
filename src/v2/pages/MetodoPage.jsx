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

      {/* ====== PARTE 1: IL METODO — FONDAMENTI SCIENTIFICI ====== */}

      <h3 style={styles.partTitle}>Il Metodo — Fondamenti Scientifici</h3>

      {/* --- 1. La visione --- */}
      <Section status="solid" title="La visione">
        <p>
          NeuroScacchi nasce per scacchisti con ADHD che competono e vogliono migliorare.
          Non e' un'app "semplificata" — e' un allenatore che conosce il tuo funzionamento cognitivo
          e adatta il training di conseguenza.
        </p>
        <p>
          L'architettura del Metodo si fonda su un'ipotesi precisa: le difficolta delle funzioni
          esecutive non sono ostacoli insormontabili, ma <strong>variabili misurabili</strong> su cui
          costruire un percorso di allenamento personalizzato. Questa prospettiva si allinea con i
          modelli neuropsicologici contemporanei che vedono l'ADHD non come una mancanza di conoscenza,
          ma come una difficolta nell'applicazione della stessa nel <em>"punto di prestazione"</em>.
        </p>
      </Section>

      {/* --- 2. Inibizione comportamentale — Il Freeze --- */}
      <Section status="solid" title="1. Inibizione comportamentale — Il Freeze">
        <p>
          Il controllo inibitorio e' spesso considerato il deficit primario nell'ADHD.
          Senza un'adeguata inibizione, il soggetto risponde agli stimoli in modo immediato e automatico,
          impedendo l'attivazione dei processi di pensiero superiore.
        </p>
        <div style={styles.implBox}>
          <strong>Applicazione</strong>: il "Freeze" impone un blocco forzato della scacchiera
          (da 1 a 5 secondi) prima di ogni posizione. Se l'impulsivita dell'utente e' alta,
          il blocco dura di piu.
        </div>
        <p>
          <strong>Fondamento scientifico:</strong> questo meccanismo agisce come una "protesi"
          per l'inibizione mancante. L'allenamento alla risposta ritardata e' una strategia cardine
          per spostare il processamento dal <strong>Sistema 1</strong> (intuitivo/impulsivo) al
          <strong> Sistema 2</strong> (analitico/riflessivo). Imponendo il tempo di latenza, si permette
          alla corteccia prefrontale di elaborare i dati prima che avvenga l'atto motorio.
        </p>
        <div style={styles.evolutionBox}>
          <strong>Evoluzione agonistica:</strong> l'estensione del freeze a ogni singola mossa della
          partita serve a contrastare il fenomeno del "decadimento della vigilanza", tipico dell'ADHD,
          dove la precisione cala drasticamente col passare dei minuti. Il profilo cognitivo calibra
          l'intensita: freeze lungo a inizio posizione, freeze breve sulle mosse successive, nessun
          freeze se l'impulsivita e' bassa.
        </div>
      </Section>

      {/* --- 3. Memoria di lavoro — La Profilassi --- */}
      <Section status="solid" title="2. Memoria di lavoro — La Profilassi guidata">
        <p>
          La memoria di lavoro e' il "taccuino" mentale che permette di mantenere e manipolare
          informazioni. Negli scacchi, questo significa ricordare le minacce dell'avversario
          mentre si calcola la propria mossa.
        </p>
        <div style={styles.implBox}>
          <strong>Applicazione</strong>: il sistema di "Profilassi" obbliga l'utente a identificare
          la mossa piu pericolosa dell'avversario prima di giocare. Se la consapevolezza e' bassa,
          questo passaggio viene richiesto sistematicamente.
        </div>
        <p>
          <strong>Fondamento scientifico:</strong> lo "scaffolding cognitivo" (impalcatura) riduce
          il carico sulla memoria di lavoro. Esternalizzando la domanda ("Cosa vuole fare l'altro?"),
          l'app libera risorse mentali per il calcolo profondo. Studi sulla riabilitazione cognitiva
          suggeriscono che automatizzare queste routine di pensiero aiuti a compensare i deficit di
          attenzione divisa.
        </p>
        <div style={styles.evolutionBox}>
          <strong>Evoluzione con Stockfish:</strong> oggi la profilassi mostra mosse legali,
          non necessariamente minacce reali. Con il motore, la domanda diventa significativa:
          la differenza tra "il cavallo puo andare in d5" e "il cavallo in d5 ti costa la
          qualita (-3.2)" e' enorme per chi deve imparare a valutare il pericolo.
        </div>
      </Section>

      {/* --- 4. Metacognizione --- */}
      <Section status="solid" title="3. Metacognizione — Monitoraggio dell'errore">
        <p>
          L'ADHD e' spesso associato a una scarsa auto-osservazione durante l'esecuzione
          di un compito (metacognizione).
        </p>
        <div style={styles.implBox}>
          <strong>Applicazione</strong>: dopo un errore, l'app pone domande dirette
          (es. "Avevi un piano in mente?"). La frequenza delle domande aumenta se la
          capacita metacognitiva dell'utente e' valutata come bassa.
        </div>
        <p>
          <strong>Fondamento scientifico:</strong> il monitoraggio dell'errore e' legato all'attivita
          della corteccia cingolata anteriore. Negli individui con ADHD, la risposta neurale
          all'errore e' spesso attenuata. Obbligare a una riflessione post-errore aiuta a "marcare"
          l'evento a livello cognitivo, favorendo l'apprendimento dai propri sbagli anziche
          la loro ripetizione impulsiva.
        </p>
        <div style={styles.evolutionBox}>
          <strong>Evoluzione con Stockfish:</strong> la metacognizione diventa contestuale.
          Non piu "Avevi un piano?" generico, ma "Hai perso 3 punti di valutazione nelle
          ultime 5 mosse. Stai andando troppo veloce?" — basato su dati reali del motore.
        </div>
      </Section>

      {/* --- 5. Regolazione emotiva — Il Feedback --- */}
      <Section status="critical" title="4. Regolazione emotiva — Il dilemma del feedback">
        <p>
          Il cervello ADHD e' estremamente sensibile ai segnali di errore e gratificazione,
          un fenomeno noto come <strong>Reward Deficiency Syndrome</strong>.
        </p>
        <div style={styles.warningBox}>
          <strong>Il problema del "muro rosso":</strong> un feedback binario (corretto/sbagliato)
          puo generare una saturazione di segnali negativi che porta alla demotivazione e
          all'abbandono della sessione. Per un giocatore ADHD con bassa tolleranza alla
          frustrazione, una sequenza di schermate rosse e' un muro contro cui si infrange
          la motivazione.
        </div>
        <p>
          <strong>Soluzione con Stockfish:</strong> feedback graduato basato sulla valutazione
          numerica (&#916;eval):
        </p>
        <ul style={styles.list}>
          <li style={{ color: '#2E7D32' }}><strong>Ottima</strong> — la mossa migliore o equivalente (&#916;eval &lt; 0.3)</li>
          <li style={{ color: '#1565C0' }}><strong>Buona</strong> — non la migliore, ma solida (&#916;eval 0.3-1.0)</li>
          <li style={{ color: '#F57F17' }}><strong>Imprecisione</strong> — perdita moderata (&#916;eval 1.0-2.5)</li>
          <li style={{ color: '#C62828' }}><strong>Errore</strong> — perdita significativa (&#916;eval &gt; 2.5)</li>
        </ul>
        <p>
          <strong>Fondamento scientifico:</strong> un feedback informativo e sfumato e' piu costruttivo
          di uno punitivo. "Buona mossa, ma c'era di meglio" e' piu costruttivo di "SBAGLIATO".
          Tuttavia, esiste un rischio opposto:
        </p>
        <div style={styles.warningBox}>
          <strong>Rischio:</strong> un giocatore ADHD che compete potrebbe usare il "buona" come scusa
          per non cercare la mossa migliore. La comodita del "abbastanza bene" puo diventare
          una trappola che impedisce il vero progresso. Chi vuole competere ha bisogno di sapere
          quando una mossa e' <em>sbagliata</em>, non solo "non ottimale".
        </div>
        <p>
          <strong>Soluzione ibrida:</strong> feedback graduato per default, con soglia di errore
          configurabile dal coach per ogni studente. La calibrazione della soglia e' un atto
          di bilanciamento clinico tra protezione della motivazione e spinta al progresso tecnico.
          Il profilo cognitivo (tolleranza frustrazione) influenza la soglia.
        </p>
        <p style={styles.note}>
          Questa decisione richiede validazione con dati reali: come reagiscono diversi profili ADHD
          al feedback graduato vs binario? Servono test con utenti reali prima di decidere.
        </p>
      </Section>

      {/* --- 6. Consolidamento mnestico --- */}
      <Section status="solid" title="5. Consolidamento mnestico — Ripetizione spaziata">
        <p>
          La difficolta nel consolidare gli schemi tattici e' un problema comune per chi ha
          deficit di memoria di lavoro e attenzione sostenuta.
        </p>
        <div style={styles.implBox}>
          <strong>Applicazione</strong>: il sistema Leitner ripete le posizioni a intervalli crescenti
          di 1, 3, 7, 14 e 30 giorni. Se sbagli, la posizione torna all'inizio. Se la azzecchi, avanza.
          Una posizione e' considerata "consolidata" solo dopo 5 successi consecutivi.
        </div>
        <p>
          <strong>Fondamento scientifico:</strong> la ripetizione spaziata sfrutta l'effetto
          di distanziamento (<em>spacing effect</em>), il modo piu efficace per trasferire le
          informazioni nella memoria a lungo termine. Per l'utente ADHD, questo sistema previene
          il sovraccarico e assicura che il tempo di studio sia ottimizzato sulle posizioni
          non ancora acquisite.
        </p>
      </Section>

      {/* ====== PARTE 2: L'IMPLEMENTAZIONE ====== */}

      <h3 style={styles.partTitle}>L'Implementazione</h3>

      {/* --- Profilo cognitivo: 4 parametri --- */}
      <Section status="solid" title="Profilo cognitivo — 4 parametri">
        <p>
          I 5 fondamenti scientifici si traducono in un profilo con 4 parametri, ciascuno
          regolabile su 3 livelli (alta / media / bassa). Ogni parametro controlla un
          comportamento concreto dell'app:
        </p>
        <div style={styles.paramGrid}>
          <ParamCard
            name="Impulsivita"
            foundation="Inibizione comportamentale"
            desc="Quanto tendi a muovere senza pensare"
            effect="Freeze: 5s (alta) / 3s (media) / 1s (bassa)"
            detail="Sistema 1 → Sistema 2. Il freeze impone il tempo di latenza per attivare
                    la corteccia prefrontale prima dell'atto motorio."
          />
          <ParamCard
            name="Consapevolezza minacce"
            foundation="Memoria di lavoro"
            desc="Quanto noti le minacce dell'avversario"
            effect="Profilassi: sempre / ogni 3 / mai"
            detail="Lo scaffolding esternalizza la domanda 'Cosa vuole fare l'altro?',
                    liberando risorse mentali per il calcolo profondo."
          />
          <ParamCard
            name="Metacognizione"
            foundation="Monitoraggio errore"
            desc="Quanto rifletti sui tuoi errori"
            effect="Domande post-errore: ogni errore / ogni 2 / ogni 4"
            detail="Attiva la corteccia cingolata anteriore, aiuta a 'marcare' l'errore
                    a livello cognitivo per favorire l'apprendimento."
          />
          <ParamCard
            name="Tolleranza frustrazione"
            foundation="Regolazione emotiva"
            desc="Quanto reggi l'errore senza demotivarti"
            effect="Hint: 2 (bassa) / 3 (media) / illimitati (alta)"
            detail="Contrasta la Reward Deficiency Syndrome. Meno muri rossi,
                    piu sfumature. Soglia errore calibrabile dal coach."
          />
        </div>
      </Section>

      {/* --- Sessioni adattive --- */}
      <Section status="solid" title="Sessioni generate su misura">
        <p>
          Il session engine combina tre criteri per generare ogni sessione:
        </p>
        <ul style={styles.list}>
          <li><strong>Spaced repetition</strong> — prima le posizioni scadute (spacing effect)</li>
          <li><strong>Difficolta adattiva</strong> — il livello si calibra sui tuoi risultati per tema</li>
          <li><strong>Direttive del coach</strong> — il coach puo forzare temi, difficolta, posizioni specifiche</li>
        </ul>
        <p>
          Il risultato: ogni sessione e' diversa e calibrata su dove sei adesso, non su dove eri ieri.
        </p>
      </Section>

      {/* --- Integrazione Stockfish --- */}
      <Section status="open" title="Integrazione Stockfish — il cuore dell'evoluzione">
        <p>
          Stockfish (motore scacchistico open source, WebAssembly) e' la chiave per portare
          tutti i fondamenti scientifici al livello successivo. Analizza una posizione a depth 15-18
          in ~200-500ms su telefono moderno. Nessun server necessario.
        </p>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Aspetto</th>
              <th style={styles.th}>Oggi</th>
              <th style={styles.th}>Con Stockfish</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={styles.td}>Soluzioni</td><td style={styles.td}>Lista fissa pre-scritta</td><td style={styles.td}>Calcolate in tempo reale</td></tr>
            <tr><td style={styles.td}>Feedback</td><td style={styles.td}>Giusto / Sbagliato</td><td style={styles.td}>Ottima / Buona / Imprecisione / Errore</td></tr>
            <tr><td style={styles.td}>Profilassi</td><td style={styles.td}>Minacce finte (mosse legali)</td><td style={styles.td}>Minacce reali (eval-based)</td></tr>
            <tr><td style={styles.td}>Difficolta</td><td style={styles.td}>Numero manuale 1-10</td><td style={styles.td}>Calcolata: profondita per trovare la mossa</td></tr>
            <tr><td style={styles.td}>Posizioni</td><td style={styles.td}>Database curato a mano</td><td style={styles.td}>Qualsiasi FEN funziona</td></tr>
            <tr><td style={styles.td}>Metacognizione</td><td style={styles.td}>Domanda generica</td><td style={styles.td}>Contestuale, basata su eval</td></tr>
            <tr><td style={styles.td}>Modalita</td><td style={styles.td}>Solo puzzle singoli</td><td style={styles.td}>Puzzle + partite con scaffolding</td></tr>
          </tbody>
        </table>
      </Section>

      {/* --- Puzzle vs Partite --- */}
      <Section status="open" title="Due pilastri: puzzle tattici e partite con scaffolding">
        <p>
          Per uno scacchista che compete, il puzzle tattico e' solo una parte dell'allenamento.
          La capacita di applicare il pensiero strutturato per 30-40 mosse consecutive e' altrettanto
          importante — e per un giocatore ADHD, e' spesso la parte piu difficile.
        </p>
        <ul style={styles.list}>
          <li><strong>Puzzle</strong> — allenano il pattern recognition. Una posizione, una mossa
              corretta (o graduata con Stockfish). Modalita "tattiche mirate".</li>
          <li><strong>Partite con scaffolding</strong> — allenano la tenuta attentiva. Freeze prima
              di ogni mossa, profilassi contestuale, metacognizione su dati reali. Il vero
              banco di prova per le funzioni esecutive.</li>
        </ul>
        <p>
          I due si completano: i puzzle costruiscono gli schemi, le partite li mettono alla prova
          nella continuita. Lo studente non risolve piu "indovinelli con una risposta sola" —
          gioca a scacchi, e l'app lo accompagna con strumenti cognitivi calibrati.
        </p>
      </Section>

      {/* ====== ROADMAP VISUALE ====== */}

      <h3 style={styles.partTitle}>Roadmap di Sviluppo</h3>

      <div style={styles.roadmapContainer}>
        {/* Strato 0-3: completati */}
        <RoadmapPhase
          number="0-3"
          title="Fondamenta"
          status="done"
          items={[
            { label: 'Schema posizioni + 25 puzzle', done: true },
            { label: 'Training session con freeze', done: true },
            { label: 'Spaced repetition (Leitner 5 box)', done: true },
            { label: 'Profilo cognitivo (4 parametri)', done: true },
            { label: 'Profilassi + Metacognizione', done: true },
            { label: 'Difficolta adattiva + Session engine', done: true },
            { label: 'Statistiche e insight', done: true },
          ]}
        />

        {/* Strato 4: Stockfish Core */}
        <RoadmapPhase
          number="4"
          title="Stockfish Core"
          status="next"
          subtitle="Il motore che cambia tutto"
          items={[
            { label: 'Wrapper Stockfish WASM + Web Worker', done: false, pillar: 'Infrastruttura' },
            { label: 'Feedback graduato (ottima/buona/imprecisione/errore)', done: false, pillar: 'Regolazione emotiva' },
            { label: 'Profilassi reale con eval numerica', done: false, pillar: 'Memoria di lavoro' },
            { label: 'Difficolta calcolata automaticamente', done: false, pillar: 'Infrastruttura' },
            { label: 'Metacognizione contestuale (basata su eval)', done: false, pillar: 'Metacognizione' },
            { label: 'Ri-validazione posizioni esistenti', done: false, pillar: 'Qualita' },
            { label: 'Upload posizioni semplificato (coach)', done: false, pillar: 'Infrastruttura' },
          ]}
        />

        {/* Strato 5: Partite */}
        <RoadmapPhase
          number="5"
          title="Freeze Evoluto + Partite"
          status="future"
          subtitle="Dal puzzle alla partita completa"
          items={[
            { label: 'Freeze prima di ogni mossa (anti-decadimento vigilanza)', done: false, pillar: 'Inibizione' },
            { label: 'Partita vs Stockfish con scaffolding completo', done: false, pillar: 'Tutti i pilastri' },
            { label: 'Analisi post-partita con errori e trend', done: false, pillar: 'Metacognizione' },
            { label: 'Errori di partita → puzzle nel sistema Leitner', done: false, pillar: 'Consolidamento' },
          ]}
        />

        {/* Strato 6: Validazione */}
        <RoadmapPhase
          number="6"
          title="Test e Validazione"
          status="future"
          subtitle="Verifica sul campo con utenti reali"
          items={[
            { label: 'Protocollo osservazione (aiuto vs interferenza)', done: false, pillar: 'Clinico' },
            { label: 'Test duale padre-figlio', done: false, pillar: 'Clinico' },
            { label: 'Adattamento automatico profilo cognitivo', done: false, pillar: 'Tutti i pilastri' },
            { label: 'Modalita esame (senza aiuti)', done: false, pillar: 'Validazione' },
            { label: 'Dashboard coach multi-utente', done: false, pillar: 'Infrastruttura' },
            { label: 'Export dati (CSV, PDF report)', done: false, pillar: 'Infrastruttura' },
          ]}
        />
      </div>

      {/* ====== PARTE 3: EVOLUZIONE ====== */}

      <h3 style={styles.partTitle}>Evoluzione e Validazione</h3>

      {/* --- Test duale --- */}
      <Section status="open" title="Test duale — padre e figlio">
        <p>
          I test coinvolgeranno due generazioni con ADHD. Sara utile osservare come i parametri
          cambino non solo tra i due soggetti, ma anche nella stessa persona in base ai
          livelli di stanchezza.
        </p>
        <p>
          Il passo successivo e' la creazione di un <strong>protocollo di osservazione</strong> per
          annotare se lo scaffolding (il supporto dell'app) viene percepito come un aiuto
          necessario o, in certi momenti, come un'interferenza eccessiva.
        </p>
        <p style={styles.note}>
          Questa osservazione e' clinicamente rilevante: lo scaffolding deve essere una protesi
          temporanea, non una dipendenza. Il successo del metodo si misura nella progressiva
          riduzione del supporto necessario.
        </p>
      </Section>

      {/* --- Cosa manca --- */}
      <Section status="open" title="Cosa manca ancora">
        <ul style={styles.list}>
          <li><strong>Validazione clinica</strong> — il metodo si basa su principi consolidati
              (spaced repetition, scaffolding cognitivo, inibizione comportamentale, monitoraggio
              errore, regolazione emotiva) ma non e' stato ancora testato sistematicamente su
              una popolazione ADHD</li>
          <li><strong>Adattamento automatico del profilo</strong> — oggi il profilo e' statico,
              impostato manualmente. L'app dovrebbe analizzare i dati (tempi di risposta,
              pattern di errore, decadimento vigilanza) e suggerire aggiustamenti</li>
          <li><strong>Dashboard coach</strong> — il coach deve poter monitorare i progressi
              e impostare direttive senza accedere al telefono dello studente</li>
          <li><strong>Modalita esame</strong> — sessione senza aiuti per misurare
              l'interiorizzazione reale degli strumenti cognitivi</li>
          <li><strong>Protocollo di osservazione</strong> — strumento per annotare reazioni
              qualitative durante le sessioni (scaffolding percepito come aiuto o interferenza)</li>
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

const PHASE_STYLES = {
  done:   { accent: '#2E7D32', bg: '#E8F5E9', border: '#A5D6A7', badge: '#2E7D32', badgeText: 'Completato' },
  next:   { accent: '#1565C0', bg: '#E3F2FD', border: '#90CAF9', badge: '#1565C0', badgeText: 'Prossimo' },
  future: { accent: '#78909C', bg: '#ECEFF1', border: '#CFD8DC', badge: '#78909C', badgeText: 'Futuro' },
}

function RoadmapPhase({ number, title, status, subtitle, items }) {
  const ps = PHASE_STYLES[status]
  return (
    <div style={{
      position: 'relative',
      paddingLeft: 36,
      paddingBottom: status === 'future' && !subtitle ? 0 : 24,
    }}>
      {/* Vertical line */}
      <div style={{
        position: 'absolute',
        left: 13,
        top: 0,
        bottom: 0,
        width: 2,
        background: ps.border,
      }} />
      {/* Circle node */}
      <div style={{
        position: 'absolute',
        left: 4,
        top: 2,
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: ps.accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 9,
        fontWeight: 800,
        boxShadow: status === 'next' ? `0 0 0 4px ${ps.border}` : 'none',
      }}>
        {status === 'done' ? '\u2713' : number}
      </div>
      {/* Content */}
      <div style={{
        background: ps.bg,
        border: `1px solid ${ps.border}`,
        borderRadius: 10,
        padding: '14px 16px',
        borderLeft: `4px solid ${ps.accent}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: subtitle ? 2 : 8, flexWrap: 'wrap' }}>
          <span style={{
            background: ps.badge,
            color: '#fff',
            fontSize: 9,
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: 6,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
            {ps.badgeText}
          </span>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#2C3E50' }}>
            Strato {number} — {title}
          </span>
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: '#78909C', marginBottom: 8, fontStyle: 'italic' }}>
            {subtitle}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 13 }}>
              <span style={{
                flexShrink: 0,
                width: 18,
                height: 18,
                borderRadius: 4,
                border: item.done ? 'none' : `2px solid ${ps.border}`,
                background: item.done ? ps.accent : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                marginTop: 1,
              }}>
                {item.done ? '\u2713' : ''}
              </span>
              <span style={{ color: item.done ? '#78909C' : '#37474F', textDecoration: item.done ? 'line-through' : 'none', lineHeight: 1.4 }}>
                {item.label}
                {item.pillar && (
                  <span style={{
                    marginLeft: 6,
                    fontSize: 10,
                    color: ps.accent,
                    fontWeight: 600,
                    opacity: 0.7,
                  }}>
                    [{item.pillar}]
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ParamCard({ name, foundation, desc, effect, detail }) {
  return (
    <div style={styles.paramCard}>
      <div style={styles.paramName}>{name}</div>
      {foundation && <div style={styles.paramFoundation}>{foundation}</div>}
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
  partTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#78909C',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    margin: '24px 0 4px',
    paddingBottom: 8,
    borderBottom: '2px solid #CFD8DC',
  },
  roadmapContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    padding: '8px 0',
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
  implBox: {
    background: '#E8F5E9',
    border: '1px solid #C8E6C9',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    color: '#2E7D32',
    lineHeight: 1.6,
    margin: '10px 0',
  },
  evolutionBox: {
    background: '#FFF8E1',
    border: '1px solid #FFE082',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    color: '#E65100',
    lineHeight: 1.6,
    margin: '10px 0',
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
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: 12,
    fontSize: 13,
  },
  th: {
    textAlign: 'left',
    padding: '8px 10px',
    background: '#ECEFF1',
    borderBottom: '2px solid #CFD8DC',
    fontSize: 12,
    fontWeight: 700,
    color: '#37474F',
  },
  td: {
    padding: '6px 10px',
    borderBottom: '1px solid #E0E0E0',
    color: '#546E7A',
    lineHeight: 1.5,
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
  paramFoundation: {
    fontSize: 11,
    fontWeight: 600,
    color: '#78909C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
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
