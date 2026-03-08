import { Section } from './metodoComponents'
import { styles } from './metodoStyles'

export default function MetodoCoachIA() {
  return (
    <>
      <h3 style={styles.partTitle}>Evoluzione con l'Intelligenza Artificiale</h3>

      <Section status="open" title="6. Apprendimento guidato — Il Coach IA">
        <p>
          Il Metodo nella sua forma attuale e' uno strumento di allenamento adattivo.
          L'integrazione con l'IA lo trasforma in un <strong>coach completo</strong>, capace di
          insegnare nozioni nuove — aperture, finali, strutture tattiche — nel momento in cui
          diventano rilevanti per l'utente.
        </p>
        <div style={styles.implBox}>
          <strong>Applicazione</strong>: l'IA intercetta il momento contestuale: dopo una partita
          persa per un finale mal gestito, propone una microlezione di 2-3 minuti su quella specifica
          posizione. Non un corso separato — un insegnamento ancorato all'esperienza vissuta.
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

        <p><strong>Tre modalita operative dell'IA pedagogica:</strong></p>
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

      <Section status="open" title="7. Architettura IA — I due livelli di integrazione">
        <p>
          L'integrazione IA e' progettata in due livelli, implementabili in sequenza:
        </p>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}></th>
              <th style={styles.th}>Livello 1 — IA come analista</th>
              <th style={styles.th}>Livello 2 — Agente in tempo reale</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...styles.td, fontWeight: 600 }}>Quando</td>
              <td style={styles.td}>A fine sessione o dopo ogni errore</td>
              <td style={styles.td}>Durante la sessione, mossa per mossa</td>
            </tr>
            <tr>
              <td style={{ ...styles.td, fontWeight: 600 }}>Cosa fa</td>
              <td style={styles.td}>Report, feedback testuale, domande metacognitive contestuali, microlezioni</td>
              <td style={styles.td}>Calibra freeze, profilassi, difficolta in tempo reale</td>
            </tr>
            <tr>
              <td style={{ ...styles.td, fontWeight: 600 }}>Complessita</td>
              <td style={styles.td}>Bassa — chiamata API a fine sessione</td>
              <td style={styles.td}>Media — loop agente con stato persistente</td>
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
          <strong>Conclusione strategica:</strong> prima si valida il metodo con i due beta tester
          senza IA, identificando quali momenti beneficiano davvero di un intervento intelligente.
          Poi si integra. L'IA amplifica cio che funziona — ma amplifica anche cio che non funziona.
          Il percorso logico e': validazione umana prima, amplificazione artificiale dopo.
        </p>
      </Section>
    </>
  )
}
