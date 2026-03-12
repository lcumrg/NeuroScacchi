import './player-activities.css'

export default function MoveActivity({ step }) {
  const instruction = step.instruction || 'Fai la mossa migliore'

  return (
    <div className="activity activity--move">
      <p className="activity__question">{instruction}</p>
      <p className="activity__instruction">Esegui la mossa sulla scacchiera</p>
    </div>
  )
}
