import './player-activities.css'

export default function TextActivity({ step, onContinue }) {
  const paragraphs = step.content.split('\n').filter(p => p.trim().length > 0)

  return (
    <div className="activity activity--text">
      <div className="activity__content">
        {paragraphs.map((p, i) => (
          <p key={i} className="activity__paragraph">{p}</p>
        ))}
      </div>
      <button className="activity__btn activity__btn--primary" onClick={onContinue}>
        Continua
      </button>
    </div>
  )
}
