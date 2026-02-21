function WizardStepTask({ onChoose, stepNumber, onBack }) {
  return (
    <div className="wizard-page">
      <div className="wizard-page-title">
        {stepNumber === 1
          ? 'Cosa vuoi chiedere allo studente?'
          : `Step ${stepNumber}: cosa succede adesso?`}
      </div>
      <p className="wizard-page-subtitle">
        Scegli il tipo di attivita per questo step della lezione
      </p>

      <div className="wizard-task-cards">
        <button className="wizard-task-card" onClick={() => onChoose('intent')}>
          <div className="wizard-task-card-icon">&#127919;</div>
          <div className="wizard-task-card-body">
            <strong>Domanda strategica</strong>
            <p>Chiedi allo studente quale piano, idea o ragionamento e' migliore.
            Lui sceglie tra opzioni, poi muove il pezzo.</p>
            <span className="wizard-task-card-example">
              Es: &ldquo;Qual e' l'idea dietro Ab5?&rdquo;
            </span>
          </div>
        </button>

        <button className="wizard-task-card" onClick={() => onChoose('detective')}>
          <div className="wizard-task-card-icon">&#128269;</div>
          <div className="wizard-task-card-body">
            <strong>Trova la casa chiave</strong>
            <p>Lo studente deve cliccare sulla casa giusta sulla scacchiera.
            Perfetto per far notare punti deboli, case critiche, pedoni arretrati.</p>
            <span className="wizard-task-card-example">
              Es: &ldquo;Qual e' il punto debole del Nero?&rdquo; &#8594; f7
            </span>
          </div>
        </button>

        <button className="wizard-task-card" onClick={() => onChoose('candidate')}>
          <div className="wizard-task-card-icon">&#9823;</div>
          <div className="wizard-task-card-body">
            <strong>Trova le mosse candidate</strong>
            <p>Lo studente deve identificare le mosse migliori prima di sceglierne una.
            Sviluppa il pensiero sistematico.</p>
            <span className="wizard-task-card-example">
              Es: Trova 2 mosse buone: e1g1, d2d4
            </span>
          </div>
        </button>
      </div>

      {onBack && (
        <div className="wizard-nav-row">
          <button className="wizard-btn-secondary" onClick={onBack}>
            &#8592; Indietro
          </button>
          <div />
        </div>
      )}
    </div>
  )
}

export default WizardStepTask
