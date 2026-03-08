import { Section, ParamCard } from './metodoComponents'
import { styles } from './metodoStyles'

export default function MetodoImplementazione() {
  return (
    <>
      <h3 style={styles.partTitle}>L'Implementazione</h3>

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
            detail="Sistema 1 -> Sistema 2. Il freeze impone il tempo di latenza per attivare
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
    </>
  )
}
