import { Section } from './metodoComponents'
import { styles } from './metodoStyles'

export default function MetodoEvoluzione() {
  return (
    <>
      <h3 style={styles.partTitle}>Evoluzione e Validazione</h3>

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
    </>
  )
}
