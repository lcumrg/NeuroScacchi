import './RoleSelector.css'

function RoleSelector({ onSelectRole, userName }) {
  return (
    <div className="role-screen">
      <div className="role-container">
        <div className="role-logo">
          <div className="role-logo-icon">NS</div>
          <h1>NeuroScacchi</h1>
          <p className="role-welcome">Ciao{userName ? `, ${userName}` : ''}! Come vuoi entrare?</p>
        </div>

        <div className="role-cards">
          <button className="role-card role-student" onClick={() => onSelectRole('studente')}>
            <div className="role-icon">&#9823;</div>
            <h2>Studente</h2>
            <p>Esercitati con le lezioni, allena il pensiero strategico e migliora il tuo gioco.</p>
          </button>

          <button className="role-card role-coach" onClick={() => onSelectRole('allenatore')}>
            <div className="role-icon">&#128227;</div>
            <h2>Allenatore</h2>
            <p>Crea e gestisci le lezioni, monitora i progressi e costruisci percorsi didattici.</p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default RoleSelector
