import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// -- Stili per stampa B&N --
const s = StyleSheet.create({
  page: {
    padding: '28 36 40 36',
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
    lineHeight: 1.5,
  },
  header: {
    fontSize: 7,
    color: '#999',
    borderBottom: '0.5pt solid #ccc',
    paddingBottom: 4,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    fontSize: 7,
    color: '#999',
    textAlign: 'center',
    borderTop: '0.5pt solid #ccc',
    paddingTop: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  partTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#333',
    borderBottom: '1.5pt solid #333',
    paddingBottom: 4,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    marginTop: 14,
  },
  statusTag: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    padding: '1 6',
    marginRight: 6,
  },
  statusSolid: {
    backgroundColor: '#ddd',
    color: '#333',
  },
  statusOpen: {
    backgroundColor: '#eee',
    color: '#666',
    border: '0.5pt solid #999',
  },
  statusCritical: {
    backgroundColor: '#333',
    color: '#fff',
  },
  p: {
    marginBottom: 6,
    textAlign: 'justify',
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  italic: {
    fontFamily: 'Helvetica-Oblique',
  },
  box: {
    border: '1pt solid #999',
    padding: '8 10',
    marginVertical: 6,
    backgroundColor: '#f5f5f5',
  },
  boxLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    marginBottom: 3,
  },
  boxText: {
    fontSize: 9,
    lineHeight: 1.5,
  },
  warningBox: {
    border: '1.5pt solid #333',
    padding: '8 10',
    marginVertical: 6,
    backgroundColor: '#eee',
  },
  list: {
    marginVertical: 4,
    paddingLeft: 12,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  bullet: {
    width: 12,
    fontSize: 10,
  },
  listText: {
    flex: 1,
    fontSize: 10,
  },
  table: {
    marginVertical: 8,
    border: '0.5pt solid #999',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #ccc',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderBottom: '1pt solid #999',
  },
  tableCell: {
    flex: 1,
    padding: '4 6',
    fontSize: 8,
    lineHeight: 1.4,
  },
  tableCellBold: {
    flex: 1,
    padding: '4 6',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.4,
  },
  paramGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  paramCard: {
    width: '48%',
    border: '0.5pt solid #999',
    padding: '6 8',
    marginBottom: 6,
  },
  paramName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 1,
  },
  paramSub: {
    fontSize: 7,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  paramEffect: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#eee',
    padding: '2 4',
    marginBottom: 3,
  },
  paramDetail: {
    fontSize: 8,
    color: '#444',
    lineHeight: 1.4,
  },
  // Roadmap
  phaseBox: {
    border: '1pt solid #999',
    padding: '8 10',
    marginBottom: 8,
  },
  phaseTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  phaseSubtitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Oblique',
    color: '#666',
    marginBottom: 6,
  },
  phaseItem: {
    flexDirection: 'row',
    marginBottom: 2,
    fontSize: 8,
  },
  checkbox: {
    width: 10,
    fontSize: 9,
  },
  pillarTag: {
    fontSize: 7,
    color: '#666',
  },
  copyright: {
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
    marginTop: 20,
    paddingTop: 8,
    borderTop: '0.5pt solid #ccc',
  },
  note: {
    fontSize: 9,
    fontFamily: 'Helvetica-Oblique',
    color: '#555',
    marginTop: 4,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    fontSize: 9,
  },
  colorBox: {
    width: 12,
    height: 12,
    marginRight: 6,
    border: '0.5pt solid #999',
  },
})

// -- Helper components --
const B = ({ children }) => <Text style={s.bold}>{children}</Text>
const I = ({ children }) => <Text style={s.italic}>{children}</Text>
const P = ({ children }) => <Text style={s.p}>{children}</Text>

function StatusTag({ status }) {
  const label = status === 'solid' ? 'VALIDATO' : status === 'open' ? 'DA APPROFONDIRE' : 'CRITICO'
  const tagStyle = status === 'solid' ? s.statusSolid : status === 'critical' ? s.statusCritical : s.statusOpen
  return <Text style={{ ...s.statusTag, ...tagStyle }}>{label}</Text>
}

function SectionTitle({ status, title }) {
  return (
    <View style={s.sectionTitle} wrap={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <StatusTag status={status} />
        <Text>{title}</Text>
      </View>
    </View>
  )
}

function Box({ label, children }) {
  return (
    <View style={s.box} wrap={false}>
      {label && <Text style={s.boxLabel}>{label}</Text>}
      <Text style={s.boxText}>{children}</Text>
    </View>
  )
}

function Warning({ label, children }) {
  return (
    <View style={s.warningBox} wrap={false}>
      {label && <Text style={s.boxLabel}>{label}</Text>}
      <Text style={s.boxText}>{children}</Text>
    </View>
  )
}

function Li({ children }) {
  return (
    <View style={s.listItem}>
      <Text style={s.bullet}>-</Text>
      <Text style={s.listText}>{children}</Text>
    </View>
  )
}

function TableRow({ cells, header }) {
  return (
    <View style={header ? s.tableHeader : s.tableRow}>
      {cells.map((cell, i) => (
        <Text key={i} style={header ? s.tableCellBold : s.tableCell}>{cell}</Text>
      ))}
    </View>
  )
}

function ParamCard({ name, foundation, effect, detail }) {
  return (
    <View style={s.paramCard} wrap={false}>
      <Text style={s.paramName}>{name}</Text>
      {foundation && <Text style={s.paramSub}>{foundation}</Text>}
      <Text style={s.paramEffect}>{effect}</Text>
      <Text style={s.paramDetail}>{detail}</Text>
    </View>
  )
}

function Phase({ title, status, subtitle, items }) {
  const tag = status === 'done' ? '[COMPLETATO]' : status === 'next' ? '[PROSSIMO]' : '[FUTURO]'
  return (
    <View style={s.phaseBox} wrap={false}>
      <Text style={s.phaseTitle}>{tag} {title}</Text>
      {subtitle && <Text style={s.phaseSubtitle}>{subtitle}</Text>}
      {items.map((item, i) => (
        <View key={i} style={s.phaseItem}>
          <Text style={s.checkbox}>{item.done ? '[x]' : '[ ]'}</Text>
          <Text style={{ flex: 1 }}>
            {item.label}
            {item.pillar && <Text style={s.pillarTag}> [{item.pillar}]</Text>}
          </Text>
        </View>
      ))}
    </View>
  )
}

function PageHeader() {
  return (
    <View style={s.header} fixed>
      <Text>Il Metodo NeuroScacchi 2.0</Text>
      <Text>Documento riservato — Luca Morigi</Text>
    </View>
  )
}

function PageFooter() {
  return (
    <View style={s.footer} fixed>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  )
}

// -- Il documento --
export default function MetodoPDF() {
  return (
    <Document title="Il Metodo NeuroScacchi 2.0" author="Luca Morigi">

      {/* ====== FONDAMENTI SCIENTIFICI ====== */}
      <Page size="A4" style={s.page}>
        <PageHeader />
        <PageFooter />

        <Text style={s.title}>Il Metodo NeuroScacchi 2.0</Text>
        <Text style={s.subtitle}>Un allenatore adattivo per scacchisti con ADHD che vogliono progredire davvero.</Text>

        <Text style={s.partTitle}>Il Metodo — Fondamenti Scientifici</Text>

        <SectionTitle status="solid" title="La visione" />
        <P>NeuroScacchi nasce per scacchisti con ADHD che competono e vogliono migliorare. Non e' un'app "semplificata" — e' un allenatore che conosce il funzionamento cognitivo dell'utente e adatta il training di conseguenza.</P>
        <P>L'architettura del Metodo si fonda su un'ipotesi: le difficolta delle funzioni esecutive non sono ostacoli insormontabili, ma variabili misurabili su cui costruire un percorso personalizzato. L'ADHD non e' una mancanza di conoscenza, ma una difficolta nell'applicazione della stessa nel "punto di prestazione".</P>

        <SectionTitle status="solid" title="1. Inibizione comportamentale — Il Freeze" />
        <P>Il controllo inibitorio e' spesso considerato il deficit primario nell'ADHD. Senza un'adeguata inibizione, il soggetto risponde agli stimoli in modo immediato e automatico.</P>
        <Box label="Applicazione">Il "Freeze" impone un blocco forzato della scacchiera (da 1 a 5 secondi) prima di ogni posizione. Se l'impulsivita e' alta, il blocco dura di piu.</Box>
        <P>Fondamento scientifico: il meccanismo agisce come una "protesi" per l'inibizione mancante. L'allenamento alla risposta ritardata sposta il processamento dal Sistema 1 (intuitivo/impulsivo) al Sistema 2 (analitico/riflessivo), permettendo alla corteccia prefrontale di elaborare prima dell'atto motorio.</P>
        <Box label="Evoluzione agonistica">L'estensione del freeze a ogni mossa della partita contrasta il "decadimento della vigilanza", dove la precisione cala col passare dei minuti. Il profilo cognitivo calibra l'intensita.</Box>

        <SectionTitle status="solid" title="2. Memoria di lavoro — La Profilassi guidata" />
        <P>La memoria di lavoro e' il "taccuino" mentale che permette di mantenere e manipolare informazioni. Negli scacchi: ricordare le minacce dell'avversario mentre si calcola la propria mossa.</P>
        <Box label="Applicazione">Il sistema di "Profilassi" obbliga l'utente a identificare la mossa piu pericolosa dell'avversario prima di giocare. Se la consapevolezza e' bassa, questo passaggio viene richiesto sistematicamente.</Box>
        <P>Fondamento scientifico: lo "scaffolding cognitivo" riduce il carico sulla memoria di lavoro. Esternalizzando la domanda ("Cosa vuole fare l'altro?"), l'app libera risorse mentali per il calcolo profondo.</P>
        <Box label="Evoluzione con Stockfish">Oggi la profilassi mostra mosse legali, non necessariamente minacce reali. Con il motore: la differenza tra "il cavallo puo andare in d5" e "il cavallo in d5 ti costa la qualita (-3.2)" e' enorme.</Box>

        <SectionTitle status="solid" title="3. Metacognizione — Monitoraggio dell'errore" />
        <P>L'ADHD e' spesso associato a scarsa auto-osservazione durante l'esecuzione di un compito.</P>
        <Box label="Applicazione">Dopo un errore, l'app pone domande dirette ("Avevi un piano in mente?"). La frequenza aumenta se la capacita metacognitiva e' bassa.</Box>
        <P>Fondamento scientifico: il monitoraggio dell'errore e' legato alla corteccia cingolata anteriore. Negli individui con ADHD la risposta neurale all'errore e' spesso attenuata. La riflessione post-errore aiuta a "marcare" l'evento a livello cognitivo.</P>
        <Box label="Evoluzione con Stockfish">La metacognizione diventa contestuale: "Hai perso 3 punti nelle ultime 5 mosse. Stai andando troppo veloce?" — basato su dati reali del motore.</Box>

        <SectionTitle status="critical" title="4. Regolazione emotiva — Il dilemma del feedback" />
        <P>Il cervello ADHD e' estremamente sensibile ai segnali di errore e gratificazione (Reward Deficiency Syndrome).</P>
        <Warning label="Il problema del 'muro rosso'">Un feedback binario (corretto/sbagliato) puo generare saturazione di segnali negativi che porta alla demotivazione. Per un giocatore ADHD con bassa tolleranza alla frustrazione, una sequenza di schermate rosse e' un muro contro cui si infrange la motivazione.</Warning>
        <P>Soluzione con Stockfish — feedback graduato basato su delta-eval: Ottima ({'<'}0.3), Buona (0.3-1.0), Imprecisione (1.0-2.5), Errore ({'>'}2.5).</P>
        <Warning label="Rischio">Un giocatore ADHD che compete potrebbe usare il "buona" come scusa per non cercare la mossa migliore. Chi vuole competere ha bisogno di sapere quando una mossa e' sbagliata, non solo "non ottimale".</Warning>
        <P>Soluzione ibrida: feedback graduato per default, soglia di errore configurabile dal coach. Il profilo cognitivo (tolleranza frustrazione) influenza la soglia.</P>
        <Text style={s.note}>Questa decisione richiede validazione con dati reali: servono test con utenti reali prima di decidere.</Text>

        <SectionTitle status="solid" title="5. Consolidamento mnestico — Ripetizione spaziata" />
        <P>La difficolta nel consolidare schemi tattici e' un problema comune con deficit di memoria di lavoro e attenzione sostenuta.</P>
        <Box label="Applicazione">Il sistema Leitner ripete le posizioni a intervalli crescenti (1, 3, 7, 14, 30 giorni). Se sbagli, la posizione torna all'inizio. Consolidata dopo 5 successi consecutivi.</Box>
        <P>Fondamento scientifico: la ripetizione spaziata sfrutta lo spacing effect, il modo piu efficace per trasferire informazioni nella memoria a lungo termine.</P>
      </Page>

      {/* ====== IMPLEMENTAZIONE ====== */}
      <Page size="A4" style={s.page}>
        <PageHeader />
        <PageFooter />

        <Text style={s.partTitle}>L'Implementazione</Text>

        <SectionTitle status="solid" title="Profilo cognitivo — 4 parametri" />
        <P>I 5 fondamenti scientifici si traducono in un profilo con 4 parametri, ciascuno regolabile su 3 livelli (alta / media / bassa):</P>
        <View style={s.paramGrid}>
          <ParamCard name="Impulsivita" foundation="Inibizione comportamentale" effect="Freeze: 5s (alta) / 3s (media) / 1s (bassa)" detail="Sistema 1 -> Sistema 2. Il freeze impone il tempo di latenza per attivare la corteccia prefrontale." />
          <ParamCard name="Consapevolezza minacce" foundation="Memoria di lavoro" effect="Profilassi: sempre / ogni 3 / mai" detail="Esternalizza la domanda 'Cosa vuole fare l'altro?', liberando risorse per il calcolo." />
          <ParamCard name="Metacognizione" foundation="Monitoraggio errore" effect="Domande post-errore: ogni errore / ogni 2 / ogni 4" detail="Attiva la corteccia cingolata anteriore per 'marcare' l'errore a livello cognitivo." />
          <ParamCard name="Tolleranza frustrazione" foundation="Regolazione emotiva" effect="Hint: 2 (bassa) / 3 (media) / illimitati (alta)" detail="Contrasta la Reward Deficiency Syndrome. Soglia errore calibrabile dal coach." />
        </View>

        <SectionTitle status="solid" title="Sessioni generate su misura" />
        <P>Il session engine combina tre criteri per ogni sessione:</P>
        <View style={s.list}>
          <Li>Spaced repetition — prima le posizioni scadute (spacing effect)</Li>
          <Li>Difficolta adattiva — il livello si calibra sui risultati per tema</Li>
          <Li>Direttive del coach — il coach puo forzare temi, difficolta, posizioni specifiche</Li>
        </View>

        <SectionTitle status="open" title="Integrazione Stockfish" />
        <P>Stockfish (motore scacchistico open source, WebAssembly) analizza posizioni a depth 15-18 in ~200-500ms su telefono moderno. Nessun server necessario.</P>
        <View style={s.table}>
          <TableRow header cells={['Aspetto', 'Oggi', 'Con Stockfish']} />
          <TableRow cells={['Soluzioni', 'Lista fissa pre-scritta', 'Calcolate in tempo reale']} />
          <TableRow cells={['Feedback', 'Giusto / Sbagliato', 'Ottima / Buona / Imprecisione / Errore']} />
          <TableRow cells={['Profilassi', 'Minacce finte (mosse legali)', 'Minacce reali (eval-based)']} />
          <TableRow cells={['Difficolta', 'Numero manuale 1-10', 'Calcolata: profondita per la mossa']} />
          <TableRow cells={['Metacognizione', 'Domanda generica', 'Contestuale, basata su eval']} />
          <TableRow cells={['Modalita', 'Solo puzzle singoli', 'Puzzle + partite con scaffolding']} />
        </View>

        <SectionTitle status="open" title="Due pilastri: puzzle tattici e partite con scaffolding" />
        <View style={s.list}>
          <Li>Puzzle — allenano il pattern recognition. Una posizione, una mossa corretta (o graduata con Stockfish).</Li>
          <Li>Partite con scaffolding — allenano la tenuta attentiva. Freeze prima di ogni mossa, profilassi contestuale, metacognizione su dati reali.</Li>
        </View>
        <P>I puzzle costruiscono gli schemi, le partite li mettono alla prova nella continuita.</P>
      </Page>

      {/* ====== INTELLIGENZA ARTIFICIALE ====== */}
      <Page size="A4" style={s.page}>
        <PageHeader />
        <PageFooter />

        <Text style={s.partTitle}>Intelligenza Artificiale — Due Fasi</Text>

        <SectionTitle status="open" title="6. Agente IA per il coach — strumento immediato" />
        <P>La sezione Coach diventa un'interfaccia conversazionale con un agente IA. Non un wizard o un form — un dialogo continuo per creare contenuti, progettare percorsi, analizzare materiale di studio.</P>
        <View style={s.paramGrid}>
          <ParamCard name="Generazione posizioni" foundation="Contenuti su richiesta" effect="Coach chiede, IA propone" detail="'Generami 10 posizioni sui finali di torre' — l'IA propone FEN + soluzione. Stockfish valida automaticamente." />
          <ParamCard name="Percorsi di studio" foundation="Aperture, finali, tattiche" effect="Progressione ragionata" detail="'Percorso aperture per un 1200 Elo impulsivo' — sequenza con progressione logica e hint mirati." />
          <ParamCard name="Analisi partite" foundation="Da PGN a studio" effect="Momenti critici" detail="Il coach incolla un PGN, l'IA identifica i momenti critici e genera posizioni di studio mirate." />
          <ParamCard name="Consulenza metodo" foundation="Ragionamento pedagogico" effect="Strategie personalizzate" detail="'Studente sbaglia finali sotto pressione' — l'agente conosce il profilo cognitivo e propone strategie." />
        </View>
        <Box label="Vantaggio strategico doppio">Mentre il coach crea contenuti, l'agente accumula contesto sul metodo. Quando evolvera per interagire con lo studente, sara gia "formato" — avra visto centinaia di posizioni validate e decisioni pedagogiche prese.</Box>

        <SectionTitle status="open" title="7. Evoluzione — l'agente incontra lo studente" />
        <P>Lo stesso agente che ha lavorato col coach evolve per interagire con lo studente: microlezioni contestuali, scaffolding dialogico, analisi del repertorio.</P>

        <SectionTitle status="open" title="8. Architettura IA — Tre livelli" />
        <View style={s.table}>
          <TableRow header cells={['', 'Livello 0: Agente coach', 'Livello 1: Analista', 'Livello 2: Real-time']} />
          <TableRow cells={['Quando', 'Subito (Strato 4)', 'Futuro (Strato 8)', 'Futuro (Strato 8)']} />
          <TableRow cells={['Chi', 'Il coach', 'Lo studente (post)', 'Lo studente (in-game)']} />
          <TableRow cells={['Cosa fa', 'Genera posizioni, percorsi, analizza PGN', 'Report, feedback, microlezioni', 'Calibra freeze, profilassi live']} />
          <TableRow cells={['Complessita', 'Media — chat con contesto', 'Bassa — API a fine sessione', 'Alta — loop agente']} />
        </View>

        <Warning label="Nota critica">L'IA amplifica, non sostituisce la validazione. Stockfish verifica la correttezza delle posizioni; un consulente umano revisiona le spiegazioni generate.</Warning>

        <View style={s.table}>
          <TableRow header cells={['Piattaforma', 'Punto di forza', 'Uso consigliato']} />
          <TableRow cells={['Anthropic Claude', 'Ragionamento strutturato', 'Feedback, report, microlezioni']} />
          <TableRow cells={['OpenAI GPT-4o', 'Function calling robusto', 'Agente Livello 2, analisi repertorio']} />
          <TableRow cells={['Google Gemini Flash', 'Economico, integrato Firebase', 'Task semplici, classificazione']} />
          <TableRow cells={['Groq', 'Latenza ultra-bassa', 'Feedback real-time in sessione']} />
        </View>

        <View style={s.table}>
          <TableRow header cells={['Scala', 'Costo stimato', 'Note']} />
          <TableRow cells={['Beta (2 utenti)', '~$2/mese', 'Trascurabile']} />
          <TableRow cells={['50 utenti', '~$45/mese', 'Sostenibile con abbonamento']} />
          <TableRow cells={['500 utenti', '~$450/mese', 'Richiede ottimizzazione']} />
          <TableRow cells={['5.000 utenti', '~$4.500/mese', 'Architettura ibrida']} />
        </View>

        <Warning label="API key">Prima di aprire l'app ad altri utenti: backend obbligatorio (Node.js, ~$7-20/mese). API key mai nel client.</Warning>
        <Text style={s.note}>Strategia: il coach crea con l'IA, valida con gli utenti, poi l'IA si estende allo studente.</Text>
      </Page>

      {/* ====== DESIGN SYSTEM ====== */}
      <Page size="A4" style={s.page}>
        <PageHeader />
        <PageFooter />

        <Text style={s.partTitle}>Design System — Ergonomia Cognitiva</Text>

        <SectionTitle status="open" title="Principio fondamentale" />
        <P>Ogni elemento visivo che non ha una funzione cognitiva precisa non deve esistere. Colori, animazioni e layout sono strumenti pedagogici. Il design serve il metodo.</P>

        <SectionTitle status="open" title="Tipografia" />
        <P>Font principale: Nunito / Atkinson Hyperlegible — massima leggibilita, forme inequivocabili. Mai font decorativi per testo operativo.</P>
        <View style={s.table}>
          <TableRow header cells={['Elemento', 'Dimensione', 'Motivo']} />
          <TableRow cells={['Testo operativo', '17-18px', 'Leggibilita immediata']} />
          <TableRow cells={['Testo secondario', '14-15px', 'Leggibile ma non dominante']} />
          <TableRow cells={['Classificazione mossa', '20-22px bold', 'Letto in un colpo d\'occhio']} />
          <TableRow cells={['Timer freeze', '28-32px', 'Visibile senza guardare']} />
        </View>

        <SectionTitle status="open" title="Colori funzionali" />
        <P>Classificazione mosse — colori ESCLUSIVI (mai usare per altro):</P>
        <View style={s.list}>
          <Li>Ottima: #2E7D32 (verde) — delta-eval {'<'} 0.3</Li>
          <Li>Buona: #558B2F (verde chiaro) — delta-eval 0.3-1.0</Li>
          <Li>Imprecisione: #E65100 (arancio) — delta-eval 1.0-2.5</Li>
          <Li>Errore: #C62828 (rosso) — delta-eval {'>'} 2.5</Li>
        </View>
        <P>Colori freeze: indaco #283593 (dominante), #3949AB (timer). Comunica "pausa intenzionale", non allarme o via libera.</P>
        <Warning label="Regola fondamentale">Verde, arancio e rosso appartengono ESCLUSIVAMENTE alla classificazione mosse. Il cervello ADHD risponde al colore come segnale — funziona solo se il segnale e' consistente.</Warning>

        <SectionTitle status="open" title="Freeze — comportamento visivo" />
        <P>Effetto vignettatura + sfocatura: lo schermo si sfoca (blur 6-8px), vignettatura radiale centrata sulla scacchiera, transizioni 400-600ms. La scacchiera emerge come unico punto focale.</P>
        <Warning label="Cosa NON fare">Timer che cambia colore (genera fretta), animazioni sulla scacchiera (distrazione), testo sovrapposto (interferisce), sfocatura massima (disorientante).</Warning>

        <SectionTitle status="open" title="Checklist — 8 regole" />
        <View style={s.list}>
          <Li>1. Un solo colore funzionale per ruolo semantico.</Li>
          <Li>2. Una sola azione principale per schermata, visivamente dominante.</Li>
          <Li>3. Testo operativo minimo 17px, mai sotto 14px.</Li>
          <Li>4. Freeze: vignettatura + sfocatura. Transizioni 400-600ms. Colore indaco fisso.</Li>
          <Li>5. Animazioni solo per eventi cognitivi. Zero decorative.</Li>
          <Li>6. Sfondo off-white o navy scuro. Mai bianco puro o nero puro.</Li>
          <Li>7. Font: Nunito o Atkinson Hyperlegible. Mai decorativi.</Li>
          <Li>8. Statistiche accessibili ma non visibili durante la sessione attiva.</Li>
        </View>
      </Page>

      {/* ====== ARCHITETTURA DATI ====== */}
      <Page size="A4" style={s.page}>
        <PageHeader />
        <PageFooter />

        <Text style={s.partTitle}>Architettura della Raccolta Dati</Text>
        <Box label="Principio guida">Dati non raccolti sono dati persi per sempre. Firebase e' gratuito fino a 1GB — raccogliere costa quasi niente, non raccogliere costa carissimo in possibilita future perdute.</Box>

        <SectionTitle status="open" title="Livello 1 — Dati per ogni singola mossa" />
        <P>Dati temporali: timestamp inizio/fine freeze, mossa giocata, durata riflessione post-freeze (misura il rispetto del protocollo).</P>
        <P>Dati scacchistici: FEN, mossa giocata, eval prima/dopo, delta-eval, classificazione, mossa migliore Stockfish.</P>
        <P>Dati comportamentali: profilassi (richiesta/risposta/saltata), metacognizione (richiesta/risposta/testo libero).</P>
        <Text style={s.note}>Il testo delle risposte metacognitive va sempre salvato — in futuro un LLM puo analizzare pattern cognitivi che i numeri non catturano.</Text>

        <SectionTitle status="open" title="Livello 2 — Dati per ogni sessione" />
        <P>Performance: totale mosse, distribuzione qualita, delta-eval medio, errore piu grave, errori consecutivi (segnale di crollo attentivo).</P>
        <P>Temporali: durata totale, tempo medio per mossa, curva prime 10 vs ultime 10 (decadimento vigilanza), mosse veloci ({'<'}2s post-freeze = proxy impulsivita reale).</P>
        <P>Cognitivi: compliance freeze, compliance profilassi, trend intra-sessione.</P>
        <P>Contestuali: ora del giorno, giorno della settimana, tipo sessione, temi, profilo cognitivo attivo.</P>

        <SectionTitle status="open" title="Livello 3 — Dati longitudinali" />
        <P>Progressione per tema: accuracy nel tempo, velocita consolidamento Leitner, pattern errore ricorrente.</P>
        <P>Evoluzione profilo reale: trend tempo risposta, frequenza errori gravi, tasso risposta metacognitiva, decadimento vigilanza (il segnale di miglioramento piu significativo).</P>
        <P>Efficacia del metodo: la mossa post-metacognizione migliora? Il freeze riduce i blunder per questo utente? Esiste una finestra oraria ottimale?</P>

        <SectionTitle status="open" title="Struttura Firebase" />
        <View style={s.list}>
          <Li>users/userId/profile/ — Profilo cognitivo attuale + storia modifiche</Li>
          <Li>sessions/sessionId/metadata/ — Data, ora, tipo, profilo attivo, durata</Li>
          <Li>sessions/sessionId/moves/ — Array oggetti-mossa autocontenuti</Li>
          <Li>sessions/sessionId/summary/ — Aggregati fine sessione</Li>
          <Li>positions/positionId/leitner/ — Box Leitner, storia tentativi</Li>
          <Li>positions/positionId/performance/ — Accuracy aggregata (anonimizzata)</Li>
        </View>

        <Warning label="Privacy">Dati biometrici: non raccogliere per ora (GDPR art. 9 con minorenni). Principio minimizzazione per dati personali. Consenso genitori obbligatorio.</Warning>
      </Page>

      {/* ====== ROADMAP ====== */}
      <Page size="A4" style={s.page}>
        <PageHeader />
        <PageFooter />

        <Text style={s.partTitle}>Roadmap di Sviluppo</Text>

        <Phase title="Strato 0-3 — Fondamenta" status="done" items={[
          { label: 'Schema posizioni + 25 puzzle', done: true },
          { label: 'Training session con freeze', done: true },
          { label: 'Spaced repetition (Leitner 5 box)', done: true },
          { label: 'Profilo cognitivo (4 parametri)', done: true },
          { label: 'Profilassi + Metacognizione', done: true },
          { label: 'Difficolta adattiva + Session engine', done: true },
          { label: 'Statistiche e insight', done: true },
        ]} />

        <Phase title="Strato 4 — Stockfish Core" status="next" subtitle="Il motore che cambia tutto" items={[
          { label: 'Wrapper Stockfish WASM + Web Worker', done: false, pillar: 'Infrastruttura' },
          { label: 'Feedback graduato', done: false, pillar: 'Regolazione emotiva' },
          { label: 'Profilassi reale con eval', done: false, pillar: 'Memoria di lavoro' },
          { label: 'Difficolta calcolata', done: false, pillar: 'Infrastruttura' },
          { label: 'Metacognizione contestuale', done: false, pillar: 'Metacognizione' },
          { label: 'Architettura dati Firebase + logging per-mossa', done: false, pillar: 'Infrastruttura' },
          { label: 'Agente IA coach: posizioni e percorsi', done: false, pillar: 'Contenuti' },
          { label: 'Agente IA coach: analisi PGN e consulenza', done: false, pillar: 'Contenuti' },
          { label: 'Backend API key', done: false, pillar: 'Infrastruttura' },
        ]} />

        <Phase title="Strato 5 — Freeze Evoluto + Partite" status="future" subtitle="Dal puzzle alla partita completa" items={[
          { label: 'Freeze prima di ogni mossa', done: false, pillar: 'Inibizione' },
          { label: 'Partita vs Stockfish con scaffolding', done: false, pillar: 'Tutti i pilastri' },
          { label: 'Analisi post-partita', done: false, pillar: 'Metacognizione' },
          { label: 'Errori partita -> puzzle Leitner', done: false, pillar: 'Consolidamento' },
        ]} />

        <Phase title="Strato 6 — Test e Validazione" status="future" subtitle="Verifica con utenti reali" items={[
          { label: 'Protocollo osservazione', done: false, pillar: 'Clinico' },
          { label: 'Test duale padre-figlio', done: false, pillar: 'Clinico' },
          { label: 'Adattamento automatico profilo', done: false, pillar: 'Tutti i pilastri' },
          { label: 'Modalita esame (senza aiuti)', done: false, pillar: 'Validazione' },
          { label: 'Dashboard coach multi-utente', done: false, pillar: 'Infrastruttura' },
          { label: 'Export dati', done: false, pillar: 'Infrastruttura' },
        ]} />

        <Phase title="Strato 7 — Design System" status="future" subtitle="Identita visiva ADHD-friendly" items={[
          { label: 'Font Nunito + Atkinson Hyperlegible', done: false, pillar: 'Accessibilita' },
          { label: 'Colori funzionali esclusivi', done: false, pillar: 'Regolazione emotiva' },
          { label: 'Freeze visual: vignettatura + sfocatura', done: false, pillar: 'Inibizione' },
          { label: 'Tema chiaro / scuro', done: false, pillar: 'Accessibilita' },
          { label: 'Layout single-action', done: false, pillar: 'Memoria di lavoro' },
        ]} />

        <Phase title="Strato 8 — IA verso lo Studente" status="future" subtitle="L'agente coach evolve" items={[
          { label: 'Livello 1: Analista post-sessione', done: false, pillar: 'Metacognizione' },
          { label: 'Scaffolding dialogico', done: false, pillar: 'Tutti i pilastri' },
          { label: 'Microlezioni contestuali', done: false, pillar: 'Apprendimento' },
          { label: 'Analisi repertorio', done: false, pillar: 'Consolidamento' },
          { label: 'Livello 2: Agente real-time', done: false, pillar: 'Tutti i pilastri' },
        ]} />

        <View style={s.copyright}>
          <Text>Il Metodo NeuroScacchi 2.0 e tutti i contenuti sono di proprieta esclusiva di Luca Morigi.</Text>
          <Text>Tutti i diritti riservati. Vietata la riproduzione senza autorizzazione scritta.</Text>
        </View>
      </Page>
    </Document>
  )
}
