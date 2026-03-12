import './player-activities.css'

export default function CandidateActivity({ step, onComplete, selectedMoves, onMoveToggle }) {
  const instruction = step.instruction || `Trova ${step.requiredCount} mosse candidate`
  const candidateList = step.candidateMoves ?? []

  function handleConfirm() {
    // Enable confirm when at least requiredCount moves are selected (not requiring all candidates)
    if (selectedMoves.length >= step.requiredCount) {
      onComplete(selectedMoves)
    }
  }

  const found = selectedMoves.length
  const required = step.requiredCount

  return (
    <div className="activity activity--candidate">
      <p className="activity__question">{instruction}</p>
      <p className="activity__instruction">
        Esegui le mosse sulla scacchiera.
      </p>
      <p className="activity__counter">
        Hai trovato <strong>{found}</strong> di <strong>{required}</strong> mosse
      </p>

      {selectedMoves.length > 0 && (
        <ul className="candidate__move-list">
          {selectedMoves.map((move, i) => {
            const isCandidate = candidateList.includes(move)
            return (
              <li
                key={i}
                className={`candidate__move-item${isCandidate ? '' : ' candidate__move-item--unknown'}`}
                title={isCandidate ? '' : 'Mossa non tra le candidate — potrebbe non essere ottimale'}
              >
                <span className="candidate__move-label">{move}</span>
                <button
                  className="candidate__move-remove"
                  onClick={() => onMoveToggle(move)}
                  title="Rimuovi"
                >
                  ×
                </button>
              </li>
            )
          })}
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
