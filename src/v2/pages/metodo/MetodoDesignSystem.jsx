import { Section } from './metodoComponents'
import { styles } from './metodoStyles'

export default function MetodoDesignSystem() {
  return (
    <>
      <h3 style={styles.partTitle}>Design System — Ergonomia Cognitiva</h3>

      <Section status="open" title="Principio fondamentale">
        <p>
          Ogni elemento visivo che non ha una funzione cognitiva precisa non deve esistere.
          Colori, animazioni e layout non sono decorazione — sono <strong>strumenti pedagogici</strong>.
          Il design serve il metodo, non il contrario.
        </p>
      </Section>

      <Section status="open" title="Tipografia">
        <p>
          <strong>Font principale:</strong> Nunito / Atkinson Hyperlegible — entrambi gratuiti, open
          source, progettati per massima leggibilita in contesti di attenzione ridotta. Nunito ha
          forme arrotondate che riducono l'affaticamento. Atkinson Hyperlegible nasce per ipovedenti
          ma e' ottimo per ADHD — ogni carattere e' inequivocabile.
          Alternativa sicura: Inter. Mai font decorativi o corsivi per testo operativo.
        </p>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Elemento</th>
              <th style={styles.th}>Dimensione</th>
              <th style={styles.th}>Motivo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.td}>Testo operativo (feedback, domande)</td>
              <td style={{ ...styles.td, fontWeight: 600 }}>17-18px</td>
              <td style={styles.td}>Massima leggibilita immediata</td>
            </tr>
            <tr>
              <td style={styles.td}>Testo secondario (label, statistiche)</td>
              <td style={{ ...styles.td, fontWeight: 600 }}>14-15px</td>
              <td style={styles.td}>Leggibile ma non dominante</td>
            </tr>
            <tr>
              <td style={styles.td}>Classificazione mossa (Ottima / Errore)</td>
              <td style={{ ...styles.td, fontWeight: 600 }}>20-22px bold</td>
              <td style={styles.td}>Letto in un colpo d'occhio</td>
            </tr>
            <tr>
              <td style={styles.td}>Timer freeze</td>
              <td style={{ ...styles.td, fontWeight: 600 }}>28-32px</td>
              <td style={styles.td}>Visibile senza guardare direttamente</td>
            </tr>
          </tbody>
        </table>
        <p style={styles.note}>
          Il testo durante la sessione e' breve e ad alta priorita. Poche parole, grandi,
          ad alto contrasto. Non e' un articolo da leggere — e' un segnale da decodificare
          in meno di un secondo.
        </p>
      </Section>

      <Section status="open" title="Palette colori funzionali">
        <p><strong>Colori base:</strong></p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: '8px 0' }}>
          <ColorRow color="#F8F9FA" label="Sfondo chiaro (tema light)" />
          <ColorRow color="#1C1C2E" label="Sfondo scuro (tema dark)" light />
          <ColorRow color="#212121" label="Testo primario (su chiaro)" light />
          <ColorRow color="#E8EAF6" label="Testo su dark" />
          <ColorRow color="#90A4AE" label="Testo secondario (label, note)" />
        </div>
        <p style={styles.note}>
          Evitare bianco puro (#FFFFFF) — troppo abbagliante. Evitare nero puro (#000000) —
          contrasto eccessivo. Off-white caldo su chiaro, navy profondo su scuro.
        </p>

        <p><strong>Classificazione mosse — colori ESCLUSIVI:</strong></p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: '8px 0' }}>
          <ColorRow color="#2E7D32" label="Ottima (delta eval < 0.3)" light />
          <ColorRow color="#558B2F" label="Buona (delta eval 0.3-1.0)" light />
          <ColorRow color="#E65100" label="Imprecisione (delta eval 1.0-2.5)" light />
          <ColorRow color="#C62828" label="Errore (delta eval > 2.5)" light />
        </div>
        <div style={styles.warningBox}>
          <strong>Regola fondamentale:</strong> verde, arancio e rosso appartengono ESCLUSIVAMENTE
          alla classificazione delle mosse. Non usarli per pulsanti generici, stati dell'interfaccia
          o elementi decorativi. Se il rosso appare anche nel pulsante "Esci", perde il suo
          significato semantico. Il cervello ADHD risponde al colore come segnale — funziona solo
          se il segnale e' consistente.
        </div>

        <p><strong>Colori freeze — pausa intenzionale:</strong></p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: '8px 0' }}>
          <ColorRow color="#283593" label="Freeze primario — colore dominante" light />
          <ColorRow color="#3949AB" label="Freeze chiaro — barra timer" light />
          <ColorRow color="#E8EAF6" label="Freeze testo" />
        </div>
        <p style={styles.note}>
          Il freeze non comunica allarme (rosso) ne via libera (verde). L'indaco/blu profondo
          comunica "pausa intenzionale" — uno stato attivo e consapevole, non un blocco punitivo.
        </p>
      </Section>

      <Section status="open" title="Il Freeze — comportamento visivo">
        <p>
          Il freeze e' il momento piu critico dell'interfaccia. Il design deve supportare
          esattamente cio che il meccanismo cerca di ottenere: spostare il processamento
          dal Sistema 1 al Sistema 2.
        </p>
        <div style={styles.implBox}>
          <strong>Effetto vignettatura + sfocatura:</strong> tutto lo schermo tranne la scacchiera
          si sfoca progressivamente. Gli angoli si scuriscono con vignettatura radiale centrata
          sulla scacchiera. La scacchiera emerge come unico punto focale senza nascondere nulla.
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Parametro</th>
              <th style={styles.th}>Valore</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={styles.td}>Sfocatura sfondo</td><td style={styles.td}>blur(6-8px) — moderata, non massima</td></tr>
            <tr><td style={styles.td}>Vignettatura</td><td style={styles.td}>Gradiente radiale: trasparente al centro, rgba(28,28,46,0.75) ai bordi</td></tr>
            <tr><td style={styles.td}>Transizione entrata</td><td style={styles.td}>400-500ms ease-in — progressiva, nessuno shock</td></tr>
            <tr><td style={styles.td}>Transizione uscita</td><td style={styles.td}>400-600ms ease-out — riapertura, non scatto</td></tr>
            <tr><td style={styles.td}>Attivazione</td><td style={styles.td}>PRIMA che la posizione sia visibile — la scacchiera emerge nitida</td></tr>
            <tr><td style={styles.td}>Timer</td><td style={styles.td}>Barra sottile 4-6px o indicatore circolare. Colore indaco fisso</td></tr>
          </tbody>
        </table>
        <div style={styles.warningBox}>
          <strong>Cosa NON fare durante il freeze:</strong> timer che cambia colore (genera fretta),
          animazioni elaborate sulla scacchiera (distrazione), testo sovrapposto "Analizza!"
          (interferisce col pensiero), sfocatura massima (disorientante).
        </div>
      </Section>

      <Section status="open" title="Layout e animazioni">
        <p>
          <strong>Principio di azione unica per schermata:</strong> ogni schermata ha un'unica azione
          principale visivamente dominante. Per un cervello ADHD la gerarchia visiva implicita
          non funziona — se tre pulsanti hanno la stessa dimensione, non e' chiaro quale premere.
        </p>
        <ul style={styles.list}>
          <li><strong>Zona scacchiera</strong> — 60-70% dello spazio verticale, sempre centrata, mai spostata da popup</li>
          <li><strong>Zona feedback</strong> — sotto la scacchiera, mai sovrapposta. Testo grande, sfondo contrastato</li>
          <li><strong>Zona controlli</strong> — minimalista, solo i controlli della sessione corrente</li>
          <li><strong>Statistiche</strong> — accessibili ma non visibili durante la sessione attiva</li>
        </ul>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, color: '#2E7D32' }}>Animazioni che AIUTANO</th>
              <th style={{ ...styles.th, color: '#C62828' }}>Animazioni che DISTURBANO</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.td}>Micro-feedback sulla classificazione mossa</td>
              <td style={styles.td}>Transizioni elaborate tra schermate</td>
            </tr>
            <tr>
              <td style={styles.td}>Dissolvenza lenta del freeze</td>
              <td style={styles.td}>Loading spinner continui durante il gioco</td>
            </tr>
            <tr>
              <td style={styles.td}>Barra timer che si svuota linearmente</td>
              <td style={styles.td}>Animazioni decorative a riposo</td>
            </tr>
            <tr>
              <td style={styles.td}>Highlight della mossa sulla scacchiera</td>
              <td style={styles.td}>Effetti particellari o celebrativi eccessivi</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section status="open" title="Tema chiaro e scuro">
        <p>
          Entrambi i temi devono essere supportati. Pattern per utenti ADHD:
        </p>
        <ul style={styles.list}>
          <li><strong>Tema scuro</strong> — meglio tollerato in sessioni serali, riduce affaticamento nelle sessioni lunghe, preferito da molti adolescenti</li>
          <li><strong>Tema chiaro</strong> — migliore leggibilita in ambienti luminosi, adatto per sessioni brevi mattutine</li>
        </ul>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Elemento</th>
              <th style={styles.th}>Light</th>
              <th style={styles.th}>Dark</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={styles.td}>Sfondo primario</td><td style={styles.td}>#F8F9FA</td><td style={styles.td}>#1C1C2E</td></tr>
            <tr><td style={styles.td}>Superfici elevate</td><td style={styles.td}>#FFFFFF + ombra</td><td style={styles.td}>#252540</td></tr>
            <tr><td style={styles.td}>Bordi e divisori</td><td style={styles.td}>#E0E0E0</td><td style={styles.td}>#37374F</td></tr>
          </tbody>
        </table>
        <p style={styles.note}>
          Contrasto nel range 4.5:1 - 7:1 in entrambi i temi. Troppo basso (illeggibile)
          e troppo alto (abbagliante) sono entrambi problematici.
        </p>
      </Section>

      <Section status="open" title="Checklist — 8 regole sintetiche">
        <p>
          Da applicare a ogni nuova schermata o componente. Prima di aggiungere qualsiasi
          elemento visivo: <em>questo elemento ha una funzione cognitiva precisa?</em>
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          <CheckItem n={1}>Un solo colore funzionale per ruolo semantico. Verde = ottima. Arancio = imprecisione. Rosso = errore. Mai riutilizzati per altro.</CheckItem>
          <CheckItem n={2}>Una sola azione principale per schermata, visivamente dominante.</CheckItem>
          <CheckItem n={3}>Testo operativo minimo 17px, mai sotto i 14px anche per elementi secondari.</CheckItem>
          <CheckItem n={4}>Il freeze usa vignettatura + sfocatura leggera. Transizioni 400-600ms. Colore indaco fisso.</CheckItem>
          <CheckItem n={5}>Animazioni solo se marcano un evento cognitivo. Zero animazioni decorative.</CheckItem>
          <CheckItem n={6}>Sfondo off-white o navy scuro — mai bianco puro o nero puro.</CheckItem>
          <CheckItem n={7}>Font: Nunito o Atkinson Hyperlegible. Mai font decorativi per testo operativo.</CheckItem>
          <CheckItem n={8}>Statistiche e dati avanzati accessibili ma non visibili durante la sessione attiva.</CheckItem>
        </div>
      </Section>
    </>
  )
}

function ColorRow({ color, label, light }) {
  return (
    <div style={styles.colorRow}>
      <div style={{ ...styles.colorSwatch, background: color }} />
      <span style={styles.colorCode}>{color}</span>
      <span style={{ color: light ? '#37474F' : '#78909C' }}>{label}</span>
    </div>
  )
}

function CheckItem({ n, children }) {
  return (
    <div style={styles.checklistItem}>
      <span style={styles.checklistNumber}>{n}</span>
      <span>{children}</span>
    </div>
  )
}
