function WizardStepContinue({ stepsCount, currentStep, onAddAnother, onFinish, onBack }) {
  const stepLabel = currentStep?.tipo_step === 'intent' ? 'domanda strategica'
    : currentStep?.tipo_step === 'detective' ? 'detective'
    : currentStep?.tipo_step === 'candidate' ? 'mosse candidate'
    : 'step'

  return (
    <div className="wizard-page">
      <div className="wizard-page-title">Vuoi aggiungere un altro step?</div>
      <p className="wizard-page-subtitle">
        {stepsCount === 0
          ? `Hai creato una ${stepLabel}. Puoi aggiungere altri step per creare una lezione piu ricca.`
          : `La lezione ha ${stepsCount} step finora. Puoi continuare ad aggiungerne o concludere.`}
      </p>

      <div className="wizard-continue-cards">
        <button className="wizard-continue-card add" onClick={onAddAnother}>
          <div className="wizard-continue-icon">&#43;</div>
          <strong>Si, aggiungi un altro step</strong>
          <p>Torna alla scelta del tipo (domanda, detective, candidate) e costruisci il prossimo step della lezione.</p>
        </button>

        <button className="wizard-continue-card finish" onClick={onFinish}>
          <div className="wizard-continue-icon">&#10003;</div>
          <strong>No, la lezione e' pronta</strong>
          <p>Vai al riepilogo per dare un titolo, provare la lezione e salvarla.</p>
        </button>
      </div>

      <div className="wizard-nav-row">
        <button className="wizard-btn-secondary" onClick={onBack}>&#8592; Indietro</button>
        <div />
      </div>
    </div>
  )
}

export default WizardStepContinue
