import { useRef, useState } from 'react'
import html2pdf from 'html2pdf.js'
import { STATUS } from './metodo/metodoComponents'
import { styles } from './metodo/metodoStyles'
import MetodoFondamenti from './metodo/MetodoFondamenti'
import MetodoImplementazione from './metodo/MetodoImplementazione'
import MetodoCoachIA from './metodo/MetodoCoachIA'
import MetodoDesignSystem from './metodo/MetodoDesignSystem'
import MetodoDataArchitecture from './metodo/MetodoDataArchitecture'
import MetodoRoadmap from './metodo/MetodoRoadmap'
import MetodoEvoluzione from './metodo/MetodoEvoluzione'

export default function MetodoPage({ onBack }) {
  const contentRef = useRef(null)
  const [exporting, setExporting] = useState(false)

  const handleDownloadPDF = () => {
    if (!contentRef.current || exporting) return
    setExporting(true)
    html2pdf()
      .set({
        margin: [10, 10, 14, 10],
        filename: 'Metodo-NeuroScacchi-2.0.pdf',
        image: { type: 'jpeg', quality: 0.92 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          scrollY: -window.scrollY,
          windowWidth: contentRef.current.scrollWidth,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
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

      <div ref={contentRef} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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

        {/* Parte 1: Fondamenti scientifici (5 pilastri) */}
        <MetodoFondamenti />

        {/* Parte 2: Implementazione (profilo, sessioni, Stockfish, puzzle vs partite) */}
        <MetodoImplementazione />

        {/* Parte 3: Coach IA (2 livelli, piattaforme, costi) */}
        <MetodoCoachIA />

        {/* Parte 4: Design System (tipografia, colori, freeze, layout) */}
        <MetodoDesignSystem />

        {/* Parte 5: Architettura Dati (3 livelli, Firebase, privacy) */}
        <MetodoDataArchitecture />

        {/* Roadmap visuale (Strati 0-8) */}
        <MetodoRoadmap />

        {/* Parte 6: Evoluzione e validazione */}
        <MetodoEvoluzione />

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
