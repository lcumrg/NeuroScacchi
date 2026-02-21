function WizardStepFeedback({ step, onUpdate, onNext, onBack }) {
  const tipo = step.tipo_step

  // Detective e candidate hanno il feedback dentro lo step
  const feedbackPos = tipo === 'intent'
    ? (step.feedback || '')
    : (step.feedback_positivo || '')
  const feedbackNeg = step.feedback_negativo || ''

  const handlePosChange = (val) => {
    if (tipo === 'intent') onUpdate({ feedback: val })
    else onUpdate({ feedback_positivo: val })
  }

  const hasSomeFeedback = feedbackPos || feedbackNeg

  return (
    <div className="wizard-page">
      <div className="wizard-page-title">Cosa dici allo studente?</div>
      <p className="wizard-page-subtitle">
        Scrivi il messaggio che vedra quando risponde. Puo essere incoraggiante, educativo o entrambi.
      </p>

      <div className="wizard-feedback-cards">
        <div className="wizard-feedback-card positive">
          <div className="wizard-feedback-card-header">
            <span className="wizard-feedback-emoji">&#10004;</span>
            <strong>Se risponde bene</strong>
          </div>
          <textarea className="wizard-textarea" value={feedbackPos}
            onChange={(e) => handlePosChange(e.target.value)}
            placeholder="Es: Ottimo! L'arrocco mette il Re al sicuro e collega le torri."
            rows={3} />
        </div>

        <div className="wizard-feedback-card negative">
          <div className="wizard-feedback-card-header">
            <span className="wizard-feedback-emoji">&#10008;</span>
            <strong>Se sbaglia</strong>
          </div>
          <textarea className="wizard-textarea" value={feedbackNeg}
            onChange={(e) => onUpdate({ feedback_negativo: e.target.value })}
            placeholder="Es: Attenzione: attaccare senza sviluppo espone a rischi facili."
            rows={3} />
        </div>
      </div>

      <div className="wizard-feedback-tips">
        <strong>Consigli per un buon feedback:</strong>
        <ul>
          <li>Spiega il <em>perche</em>, non solo se e' giusto o sbagliato</li>
          <li>Usa un tono positivo anche quando correggi</li>
          <li>Collega al principio scacchistico (sviluppo, sicurezza del Re...)</li>
        </ul>
      </div>

      <div className="wizard-nav-row">
        <button className="wizard-btn-secondary" onClick={onBack}>&#8592; Indietro</button>
        <button className="wizard-btn-primary wizard-btn-lg" onClick={onNext} disabled={!hasSomeFeedback}>
          Avanti &#8594;
        </button>
      </div>
    </div>
  )
}

export default WizardStepFeedback
