import './player-activities.css'

export default function CandidateActivity({ step, onComplete, selectedMoves, onMoveToggle }) {
  const instruction = step.instruction || `Trova ${step.requiredCount} mosse candidate`

  function handleConfirm() {
    if (selectedMoves.length >= step.requiredCount) {
      onComplete(selectedMoves)
    }
  }

  return (
    <div className="activity activity--candidate">
      <p className="activity__question">{instruction}</p>
      <p className="activity__instruction">
        Esegui le mosse sulla scacchiera. Selezionate: {selectedMoves.length}/{step.requiredCount}
      </p>

      {selectedMoves.length > 0 && (
        <ul className="candidate__move-list">
          {selectedMoves.map((move, i) => (
            <li key={i} className="candidate__move-item">
              <span className="candidate__move-label">{move}</span>
              <button
                className="candidate__move-remove"
                onClick={() => onMoveToggle(move)}
                title="Rimuovi"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        className="activity__btn activity__btn--primary"
        onClick={handleConfirm}
        disabled={selectedMoves.length < step.requiredCount}
      >
        Conferma
      </button>
    </div>
  )
}
