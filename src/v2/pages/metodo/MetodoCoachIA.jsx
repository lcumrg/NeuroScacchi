import { Section } from './metodoComponents'
import { styles } from './metodoStyles'

export default function MetodoCoachIA() {
  return (
    <>
      <h3 style={styles.partTitle}>Intelligenza Artificiale — Sistema Lezioni</h3>

      {/* --- Sistema Lezioni: Coach IA come assistente alla creazione didattica --- */}
      <Section status="solid" title="6. Coach IA — Assistente alla creazione didattica">
        <p>
          Il Coach IA e' l'<strong>assistente del coach umano</strong> per creare contenuti didattici.
          L'IA struttura la didattica, Stockfish garantisce la verita scacchistica,
          il coach umano da la direzione e pubblica. Lo studente sceglie e segue.
        </p>

        <div style={styles.implBox}>
          <strong>4 livelli di contenuto:</strong>
        </div>
        <div style={styles.paramGrid}>
          <div style={styles.paramCard}>
            <div style={styles.paramName}>Puzzle</div>
            <div style={styles.paramFoundation}>Singola posizione</div>
            <div style={styles.paramDetail}>
              Posizione con soluzione, validata da Stockfish. La base di tutto.
              Gia implementato nello Strato 4.7.
            </div>
          </div>
          <div style={styles.paramCard}>
            <div style={styles.paramName}>Lezione</div>
            <div style={styles.paramFoundation}>Sequenza passo-passo</div>
            <div style={styles.paramDetail}>
              Insegna un argomento con step ordinati: spiegazioni testuali,
              dimostrazioni interattive sulla scacchiera, esercizi-puzzle.
            </div>
          </div>
          <div style={styles.paramCard}>
            <div style={styles.paramName}>Percorso</div>
            <div style={styles.paramFoundation}>Raccolta di lezioni</div>
            <div style={styles.paramDetail}>
              Serie ordinata di lezioni su un tema. Es: "Fondamenti dei finali" —
              6 lezioni + 20 puzzle, dalla teoria alla pratica.
            </div>
          </div>
          <div style={styles.paramCard}>
            <div style={styles.paramName}>Piano di allenamento</div>
            <div style={styles.paramFoundation}>Programma con obiettivo</div>
            <div style={styles.paramDetail}>
              Programma con timeline e milestones. Es: "Da 1200 a 1400 Elo in 3 mesi"
              o "Preparazione torneo regionale del 15 aprile".
            </div>
          </div>
        </div>

        <div style={styles.implBox}>
          <strong>3 ruoli nel sistema:</strong>
        </div>
        <div style={styles.paramGrid}>
          <div style={styles.paramCard}>
            <div style={styles.paramName}>Coach IA + Stockfish</div>
            <div style={styles.paramFoundation}>Co-creatori</div>
            <div style={styles.paramDetail}>
              L'IA genera bozze a tutti i livelli. Stockfish non si limita a validare:
              corregge mosse, arricchisce soluzioni (PV multi-mossa), identifica alternative
              valide (MultiPV), calibra difficolta, genera hint intelligenti, analizza PGN
              per trovare i momenti critici reali.
            </div>
          </div>
          <div style={styles.paramCard}>
            <div style={styles.paramName}>Coach umano</div>
            <div style={styles.paramFoundation}>Direttore didattico</div>
            <div style={styles.paramDetail}>
              Da la direzione ("voglio un percorso sui finali per un ragazzo impulsivo").
              Seleziona le proposte migliori, modifica via chat o console di gestione,
              pubblica i contenuti per lo studente.
            </div>
          </div>
          <div style={styles.paramCard}>
            <div style={styles.paramName}>Studente</div>
            <div style={styles.paramFoundation}>Fruisce e si allena</div>
            <div style={styles.paramDetail}>
              Vede le lezioni e i percorsi pubblicati dal coach. Sceglie cosa seguire.
              Ogni puzzle nella lezione attiva lo scaffolding cognitivo completo
              (freeze, profilassi, metacognizione, feedback graduato).
            </div>
          </div>
        </div>

        <div style={styles.implBox}>
          <strong>7 integrazioni Stockfish come co-creatore:</strong>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Integrazione</th>
              <th style={styles.th}>Cosa fa</th>
              <th style={styles.th}>Perche</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...styles.td, fontWeight: 600 }}>Correzione automatica</td>
              <td style={styles.td}>Mossa IA sbagliata → Stockfish la sostituisce con la migliore</td>
              <td style={styles.td}>Zero posizioni sprecate</td>
            </tr>
            <tr>
              <td style={{ ...styles.td, fontWeight: 600 }}>PV multi-mossa</td>
              <td style={styles.td}>Calcola la variante principale completa (2-4 mosse)</td>
              <td style={styles.td}>Soluzioni ricche, lo studente segue tutta la combinazione</td>
            </tr>
            <tr>
              <td style={{ ...styles.td, fontWeight: 600 }}>MultiPV alternative</td>
              <td style={styles.td}>Identifica mosse equivalenti (deltaEval &lt; 0.3)</td>
              <td style={styles.td}>Accetta piu soluzioni corrette, meno frustrazione</td>
            </tr>
            <tr>
              <td style={{ ...styles.td, fontWeight: 600 }}>Calibrazione difficolta</td>
              <td style={styles.td}>Auto-calibra ogni puzzle, verifica progressione crescente</td>
              <td style={styles.td}>L'IA dice "facile→difficile", Stockfish conferma o corregge</td>
            </tr>
            <tr>
              <td style={{ ...styles.td, fontWeight: 600 }}>Hint intelligenti</td>
              <td style={styles.td}>Genera hint dalla mossa reale ("Osserva la diagonale a2-g8")</td>
              <td style={styles.td}>Hint ancorati alla realta, non vaghi</td>
            </tr>
            <tr>
              <td style={{ ...styles.td, fontWeight: 600 }}>Analisi PGN</td>
              <td style={styles.td}>Trova i momenti critici reali (deltaEval &gt; 2.0)</td>
              <td style={styles.td}>Lezioni da partite vere con errori veri</td>
            </tr>
            <tr>
              <td style={{ ...styles.td, fontWeight: 600 }}>Verifica demo</td>
              <td style={styles.td}>Controlla che le sequenze dimostrative siano gioco corretto</td>
              <td style={styles.td}>Step didattici verificati + confutazioni "e se invece...?"</td>
            </tr>
          </tbody>
        </table>

        <div style={styles.evolutionBox}>
          <strong>Principio fondamentale:</strong> l'IA non ha conoscenze scacchistiche sufficienti
          per garantire la correttezza. Stockfish compensa questo limite non come validatore a posteriori,
          ma come <strong>co-creatore</strong> che partecipa attivamente alla costruzione dei contenuti.
          Tutto cio che riguarda la correttezza scacchistica passa da Stockfish automaticamente —
          il coach non deve preoccuparsene.
        </div>
      </Section>

      {/* --- Fase 2: IA verso lo studente (FUTURO) --- */}
      <Section status="open" title="7. Evoluzione — l'agente incontra lo studente">
        <p>
          Nella fase successiva, lo stesso agente IA che ha lavorato con il coach evolve per
          interagire anche con lo studente. L'integrazione e' progettata in due livelli:
        </p>
        <div style={styles.implBox}>
          <strong>Applicazione futura</strong>: dopo una partita persa per un finale mal gestito,
          l'agente propone una microlezione di 2-3 minuti su quella specifica posizione.
          Non un corso separato — un insegnamento ancorato all'esperienza vissuta, calibrato
          sul profilo cognitivo dello studente.
        </div>
        <p>
          <strong>Fondamento scientifico:</strong> per un cervello ADHD l'apprendimento astratto e
          decontestualizzato e' il formato meno efficace. Ancorare la nozione a una posizione appena
          vissuta — con i relativi stati emotivi e motori ancora attivi — sfrutta il meccanismo
          dell'<em>apprendimento esperienziale</em> e aumenta significativamente il tasso di ritenzione.
        </p>
        <div style={styles.infoBox}>
          <strong>Vantaggio competitivo:</strong> le app esistenti (Lichess, Chess.com, Chessable)
          hanno contenuti eccellenti ma non sanno con chi stanno parlando. Spiegano la Difesa
          Siciliana allo stesso modo a un adulto concentrato e a un ragazzo ADHD di 12 anni.
          Il vantaggio di NeuroScacchi non e' <em>cosa</em> insegna, ma <em>come</em>: calibrato
          sul profilo cognitivo, frammentato nei momenti giusti, con freeze prima di applicare
          la nozione e domanda metacognitiva dopo.
        </div>

        <p><strong>Tre modalita operative dell'IA con lo studente:</strong></p>
        <div style={styles.paramGrid}>
          <div style={styles.paramCard}>
            <div style={styles.paramName}>Scaffolding dialogico</div>
            <div style={styles.paramFoundation}>Spiegazione adattiva</div>
            <div style={styles.paramDetail}>
              Non un testo statico, ma una conversazione. L'IA fa domande nell'ordine giusto,
              non da la risposta. Il dialogo si adatta al livello e al profilo cognitivo.
            </div>
          </div>
          <div style={styles.paramCard}>
            <div style={styles.paramName}>Apprendimento situato</div>
            <div style={styles.paramFoundation}>Microlezioni contestuali</div>
            <div style={styles.paramDetail}>
              Proposte a fine sessione, ancorate all'errore appena commesso. Max 3-5 minuti.
              L'IA spiega solo cio che serve, quando serve.
            </div>
          </div>
          <div style={styles.paramCard}>
            <div style={styles.paramName}>Analisi del repertorio</div>
            <div style={styles.paramFoundation}>Repertorio personalizzato</div>
            <div style={styles.paramDetail}>
              L'IA analizza le partite e identifica dove il repertorio crolla,
              suggerendo studio mirato sulle posizioni piu deboli.
            </div>
          </div>
        </div>
      </Section>

      <Section status="open" title="8. Architettura IA — I tre livelli di integrazione">
        <p>
          L'integrazione IA e' progettata in tre livelli, implementabili in sequenza:
        </p>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}></th>
              <th style={{ ...styles.th, background: '#E3F2FD' }}>Livello 0 — Agente coach</th>
              <th style={styles.th}>Livello 1 — Analista studente</th>
              <th style={styles.th}>Livello 2 — Agente real-time</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...styles.td, fontWeight: 600 }}>Quando</td>
              <td style={{ ...styles.td, background: '#F5F9FF' }}>Subito — nella sezione Coach</td>
              <td style={styles.td}>A fine sessione o dopo errore</td>
              <td style={styles.td}>Durante la sessione, mossa per mossa</td>
            </tr>
            <tr>
              <td style={{ ...styles.td, fontWeight: 600 }}>Chi lo usa</td>
              <td style={{ ...styles.td, background: '#F5F9FF' }}>Il coach (tu)</td>
              <td style={styles.td}>Lo studente (post-sessione)</td>
              <td style={styles.td}>Lo studente (in-game)</td>
            </tr>
            <tr>
              <td style={{ ...styles.td, fontWeight: 600 }}>Cosa fa</td>
              <td style={{ ...styles.td, background: '#F5F9FF' }}>Genera posizioni, percorsi, analizza PGN, consulenza metodo</td>
              <td style={styles.td}>Report, feedback, microlezioni contestuali</td>
              <td style={styles.td}>Calibra freeze, profilassi, difficolta live</td>
            </tr>
            <tr>
              <td style={{ ...styles.td, fontWeight: 600 }}>Complessita</td>
              <td style={{ ...styles.td, background: '#F5F9FF' }}>Media — chat con contesto persistente</td>
              <td style={styles.td}>Bassa — chiamata API a fine sessione</td>
              <td style={styles.td}>Alta — loop agente con stato</td>
            </tr>
            <tr>
              <td style={{ ...styles.td, fontWeight: 600 }}>Priorita</td>
              <td style={{ ...styles.td, background: '#F5F9FF', fontWeight: 600, color: '#1565C0' }}>IMMEDIATA (Strato 4)</td>
              <td style={styles.td}>Futuro (Strato 8)</td>
              <td style={styles.td}>Futuro (Strato 8)</td>
            </tr>
          </tbody>
        </table>

        <div style={styles.warningBox}>
          <strong>Nota critica — L'IA amplifica, non sostituisce la validazione.</strong> L'IA
          sui contenuti scacchistici e' molto brava ma non infallibile sulle varianti profonde
          delle aperture. Il layer di validazione e' obbligatorio: Stockfish verifica la
          correttezza delle posizioni, un consulente umano (maestro di scacchi) revisiona
          periodicamente le spiegazioni generate.
        </div>

        <p><strong>Piattaforme IA disponibili:</strong></p>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Piattaforma</th>
              <th style={styles.th}>Punto di forza</th>
              <th style={styles.th}>Uso consigliato</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.td}>Anthropic Claude</td>
              <td style={styles.td}>Ragionamento strutturato, feedback pedagogici calibrati</td>
              <td style={styles.td}>Feedback post-errore, report sessione, microlezioni</td>
            </tr>
            <tr>
              <td style={styles.td}>OpenAI GPT-4o</td>
              <td style={styles.td}>Function calling robusto, ecosistema maturo</td>
              <td style={styles.td}>Agente Livello 2, analisi repertorio</td>
            </tr>
            <tr>
              <td style={styles.td}>Google Gemini Flash</td>
              <td style={styles.td}>Economico, integrato con Firebase</td>
              <td style={styles.td}>Task semplici, classificazione mosse</td>
            </tr>
            <tr>
              <td style={styles.td}>Groq</td>
              <td style={styles.td}>Latenza ultra-bassa (~10x piu veloce)</td>
              <td style={styles.td}>Feedback in tempo reale durante sessione</td>
            </tr>
          </tbody>
        </table>

        <p><strong>Stima costi:</strong></p>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Scala</th>
              <th style={styles.th}>Costo stimato</th>
              <th style={styles.th}>Note</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...styles.td, fontWeight: 600 }}>Beta (2 utenti, ~25 sessioni/mese)</td>
              <td style={styles.td}>~$2/mese</td>
              <td style={styles.td}>Trascurabile</td>
            </tr>
            <tr>
              <td style={styles.td}>50 utenti</td>
              <td style={styles.td}>~$45/mese</td>
              <td style={styles.td}>Sostenibile con abbonamento minimo</td>
            </tr>
            <tr>
              <td style={styles.td}>500 utenti</td>
              <td style={styles.td}>~$450/mese</td>
              <td style={styles.td}>Richiede ottimizzazione (modelli diversi per task diversi)</td>
            </tr>
            <tr>
              <td style={styles.td}>5.000 utenti</td>
              <td style={styles.td}>~$4.500/mese</td>
              <td style={styles.td}>Richiede architettura ibrida (caching, routing)</td>
            </tr>
          </tbody>
        </table>

        <div style={styles.warningBox}>
          <strong>Regola critica — API key nel client:</strong> prima di aprire l'app ad altri
          utenti e' obbligatorio un backend intermedio (Node.js su Railway o Render, ~$7-20/mese)
          che gestisce le chiamate IA lato server. Senza questo layer chiunque potrebbe estrarre
          la chiave API dall'app.
        </div>

        <p><strong>Pro e contro — sintesi:</strong></p>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, color: '#2E7D32' }}>Pro</th>
              <th style={{ ...styles.th, color: '#C62828' }}>Contro</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.td}>Profilo cognitivo dinamico, aggiornato dai dati reali</td>
              <td style={styles.td}>Complessita tecnica: richiede backend sicuro prima dello scaling</td>
            </tr>
            <tr>
              <td style={styles.td}>Feedback pedagogici contestuali, non generici — cruciali per ADHD</td>
              <td style={styles.td}>Rischio black box pedagogica: output sbagliati hanno impatto motivazionale reale</td>
            </tr>
            <tr>
              <td style={styles.td}>Differenziazione competitiva forte — dati cognitivi unici</td>
              <td style={styles.td}>Dipendenza da terzi: prezzi e condizioni API possono cambiare</td>
            </tr>
            <tr>
              <td style={styles.td}>Costi trascurabili in beta (&lt; $2/mese)</td>
              <td style={styles.td}>Costi scalano linearmente — ottimizzazione oltre 200 utenti</td>
            </tr>
          </tbody>
        </table>

        <p style={styles.note}>
          <strong>Conclusione strategica:</strong> l'agente IA per il coach parte subito — e' uno
          strumento di lavoro per creare contenuti migliori e piu velocemente. L'estensione
          allo studente (Livelli 1 e 2) arriva dopo la validazione umana del metodo.
          Il percorso: il coach crea con l'IA, valida con gli utenti, poi l'IA si estende allo studente.
        </p>
      </Section>
    </>
  )
}
