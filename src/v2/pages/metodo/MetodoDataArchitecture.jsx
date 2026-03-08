import { Section } from './metodoComponents'
import { styles } from './metodoStyles'

export default function MetodoDataArchitecture() {
  return (
    <>
      <h3 style={styles.partTitle}>Architettura della Raccolta Dati</h3>

      <div style={styles.implBox}>
        <strong>Principio guida:</strong> dati non raccolti sono dati persi per sempre.
        La decisione su quali dati raccogliere va presa PRIMA dello sviluppo, non dopo.
        Firebase e' gratuito fino a 1GB — raccogliere costa quasi niente, non raccogliere
        costa carissimo in possibilita future perdute.
      </div>

      <Section status="open" title="Livello 1 — Dati per ogni singola mossa">
        <p>
          Il granello di sabbia piu piccolo e piu prezioso. Va salvato in tempo reale
          durante la sessione.
        </p>

        <p><strong>Dati temporali:</strong></p>
        <ul style={styles.list}>
          <li>Timestamp inizio freeze, fine freeze, mossa giocata</li>
          <li><strong>Durata riflessione post-freeze</strong> — differenza tra fine freeze e mossa</li>
        </ul>
        <div style={styles.infoBox}>
          La differenza tra freeze imposto e tempo effettivo di riflessione misura il rispetto
          del protocollo. Un utente che muove immediatamente dopo il freeze sta ancora
          bypassando il Sistema 2.
        </div>

        <p><strong>Dati scacchistici:</strong></p>
        <ul style={styles.list}>
          <li>FEN della posizione prima della mossa</li>
          <li>Mossa giocata in notazione algebrica</li>
          <li>Eval Stockfish prima e dopo la mossa</li>
          <li>&#916;eval — proxy di qualita della mossa</li>
          <li>Classificazione automatica (Ottima / Buona / Imprecisione / Errore)</li>
          <li>Mossa migliore secondo Stockfish</li>
        </ul>

        <p><strong>Dati comportamentali:</strong></p>
        <ul style={styles.list}>
          <li>Profilassi richiesta? Risposta data? Saltata?</li>
          <li>Feedback post-errore mostrato?</li>
          <li>Domanda metacognitiva: mostrata? Risposta data?</li>
          <li><strong>Testo della risposta metacognitiva</strong> — sempre salvato integralmente</li>
        </ul>
        <p style={styles.note}>
          Anche "non lo so" e' un dato qualitativo. In futuro un LLM puo analizzare questi testi
          e identificare pattern cognitivi che i numeri non catturano.
        </p>
      </Section>

      <Section status="open" title="Livello 2 — Dati per ogni sessione">
        <p>Aggregati calcolati a fine sessione.</p>

        <p><strong>Performance:</strong></p>
        <ul style={styles.list}>
          <li>Totale mosse, distribuzione qualita (% Ottima / Buona / Imprecisione / Errore)</li>
          <li>&#916;eval medio, errore piu grave (&#916;eval massimo)</li>
          <li><strong>Errori consecutivi</strong> — segnale di crollo attentivo</li>
        </ul>

        <p><strong>Temporali aggregati:</strong></p>
        <ul style={styles.list}>
          <li>Durata totale sessione, tempo medio per mossa</li>
          <li><strong>Curva tempo per mossa</strong>: prime 10 vs ultime 10 — misura il decadimento della vigilanza</li>
          <li><strong>Mosse "veloci"</strong>: giocate sotto soglia (&lt; 2s post-freeze) — proxy dell'impulsivita reale</li>
        </ul>

        <p><strong>Dati cognitivi aggregati:</strong></p>
        <ul style={styles.list}>
          <li>Freeze rispettati vs saltati — ratio di compliance</li>
          <li>Profilassi richieste / risposte / ignorate</li>
          <li>Domande metacognitive mostrate vs risposte date</li>
          <li><strong>Trend intra-sessione</strong>: la qualita e' migliorata o peggiorata?</li>
        </ul>

        <p><strong>Dati contestuali:</strong></p>
        <ul style={styles.list}>
          <li>Ora del giorno (mattina / pomeriggio / sera) — la performance ADHD varia molto</li>
          <li>Giorno della settimana, tipo di sessione (puzzle / partita)</li>
          <li>Temi scacchistici affrontati</li>
          <li>Profilo cognitivo attivo: i valori dei 4 parametri al momento della sessione</li>
        </ul>
      </Section>

      <Section status="open" title="Livello 3 — Dati longitudinali (tra sessioni)">
        <p>
          Emergono nel tempo e sono i piu interessanti per l'IA adattiva.
          Non si raccolgono in un momento — si costruiscono dalla storia.
        </p>

        <p><strong>Progressione per tema:</strong></p>
        <ul style={styles.list}>
          <li>Accuracy media per tema nel tempo (es. finali di torre a gennaio vs marzo)</li>
          <li>Velocita di consolidamento Leitner per tipo di posizione</li>
          <li>Pattern di errore ricorrente per tema</li>
        </ul>

        <p><strong>Evoluzione del profilo cognitivo reale:</strong></p>
        <ul style={styles.list}>
          <li>Tempo medio per mossa — trend settimanale e mensile</li>
          <li>Frequenza errori gravi — trend mensile</li>
          <li>Tasso risposta metacognitiva — migliora nel tempo?</li>
          <li><strong>Decadimento vigilanza intra-sessione</strong> — si riduce? (segnale di miglioramento piu significativo)</li>
        </ul>

        <p><strong>Risposta al feedback — efficacia del metodo:</strong></p>
        <ul style={styles.list}>
          <li>Dopo una domanda metacognitiva, la mossa successiva ha &#916;eval migliore? (efficacia immediata)</li>
          <li>Il freeze riduce effettivamente i blunder per questo utente? (validazione personalizzata)</li>
          <li>Correlazione ora del giorno / qualita sessione — finestra ottimale?</li>
        </ul>
      </Section>

      <Section status="open" title="Struttura Firebase">
        <div style={styles.codeTree}>{
`users/{userId}/profile/
  Profilo cognitivo attuale (4 parametri)
  + storia di tutte le modifiche con timestamp

sessions/{sessionId}/metadata/
  Data, ora, tipo sessione, profilo attivo, durata

sessions/{sessionId}/moves/
  Array di oggetti-mossa autocontenuti:
  FEN + mossa + eval + tempi + risposte comportamentali

sessions/{sessionId}/summary/
  Aggregati calcolati a fine sessione (Livello 2)

positions/{positionId}/leitner/
  Box Leitner attuale per utente
  Storia tentativi, prossima ripetizione

positions/{positionId}/performance/
  Accuracy aggregata (dato anonimizzato)`
        }</div>
      </Section>

      <Section status="open" title="Privacy e limiti">
        <div style={styles.warningBox}>
          <strong>Cosa NON raccogliere (per ora):</strong> dati biometrici (frequenza cardiaca,
          eye tracking). Richiedono hardware dedicato, aprono questioni di privacy complesse
          soprattutto con minorenni (GDPR art. 9 — dati sanitari), e non ne vale la pena
          prima di centinaia di utenti.
        </div>
        <p>
          <strong>Principio della minimizzazione:</strong> per i dati personali vale il principio
          opposto rispetto ai dati cognitivi — raccogliere solo lo stretto necessario. Con utenti
          minorenni, il consenso informato dei genitori e' obbligatorio.
        </p>
      </Section>
    </>
  )
}
