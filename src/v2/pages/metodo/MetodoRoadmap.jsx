import { RoadmapPhase } from './metodoComponents'
import { styles } from './metodoStyles'

export default function MetodoRoadmap() {
  return (
    <>
      <h3 style={styles.partTitle}>Roadmap di Sviluppo</h3>

      <div style={styles.roadmapContainer}>
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

        <RoadmapPhase
          number="4"
          title="Stockfish Core"
          status="next"
          subtitle="Il motore che cambia tutto"
          items={[
            { label: 'Wrapper Stockfish WASM + Web Worker', done: true, pillar: 'Infrastruttura' },
            { label: 'Feedback graduato (ottima/buona/imprecisione/errore)', done: true, pillar: 'Regolazione emotiva' },
            { label: 'Profilassi reale con eval numerica', done: true, pillar: 'Memoria di lavoro' },
            { label: 'Difficolta calcolata automaticamente', done: false, pillar: 'Infrastruttura' },
            { label: 'Metacognizione contestuale (basata su eval)', done: true, pillar: 'Metacognizione' },
            { label: 'Architettura dati Firebase + logging per-mossa', done: false, pillar: 'Infrastruttura' },
            { label: 'Ri-validazione posizioni esistenti', done: false, pillar: 'Qualita' },
            { label: 'Agente IA coach: generazione posizioni e percorsi', done: false, pillar: 'Contenuti' },
            { label: 'Agente IA coach: analisi PGN e consulenza metodo', done: false, pillar: 'Contenuti' },
            { label: 'Backend API key per agente IA', done: false, pillar: 'Infrastruttura' },
          ]}
        />

        <RoadmapPhase
          number="5"
          title="Freeze Evoluto + Partite"
          status="future"
          subtitle="Dal puzzle alla partita completa"
          items={[
            { label: 'Freeze prima di ogni mossa (anti-decadimento vigilanza)', done: false, pillar: 'Inibizione' },
            { label: 'Partita vs Stockfish con scaffolding completo', done: false, pillar: 'Tutti i pilastri' },
            { label: 'Analisi post-partita con errori e trend', done: false, pillar: 'Metacognizione' },
            { label: 'Errori di partita -> puzzle nel sistema Leitner', done: false, pillar: 'Consolidamento' },
          ]}
        />

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

        <RoadmapPhase
          number="7"
          title="Design System"
          status="future"
          subtitle="Identita visiva ADHD-friendly"
          items={[
            { label: 'Font Nunito + Atkinson Hyperlegible', done: true, pillar: 'Accessibilita' },
            { label: 'Colori funzionali esclusivi per classificazione mosse', done: true, pillar: 'Regolazione emotiva' },
            { label: 'Freeze visual: vignettatura + sfocatura + indaco', done: true, pillar: 'Inibizione' },
            { label: 'Tema chiaro / scuro con contrasto calibrato', done: false, pillar: 'Accessibilita' },
            { label: 'Layout single-action per schermata', done: false, pillar: 'Memoria di lavoro' },
            { label: 'Scala tipografica ADHD-optimized', done: false, pillar: 'Accessibilita' },
          ]}
        />

        <RoadmapPhase
          number="8"
          title="IA verso lo studente"
          status="future"
          subtitle="L'agente coach evolve per interagire con lo studente"
          items={[
            { label: 'Livello 1: Analista post-sessione (report, microlezioni)', done: false, pillar: 'Metacognizione' },
            { label: 'Scaffolding dialogico e apprendimento situato', done: false, pillar: 'Tutti i pilastri' },
            { label: 'Microlezioni contestuali ancorate all\'errore', done: false, pillar: 'Apprendimento' },
            { label: 'Analisi repertorio personalizzato', done: false, pillar: 'Consolidamento' },
            { label: 'Livello 2: Agente real-time (calibrazione dinamica)', done: false, pillar: 'Tutti i pilastri' },
          ]}
        />
      </div>
    </>
  )
}
