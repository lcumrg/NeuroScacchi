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
            <div className="role-icon">
              <svg viewBox="0 0 100 48" width="100" height="48" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                {/* Omino - testa */}
                <circle cx="18" cy="8" r="6" />
                {/* Omino - corpo */}
                <line x1="18" y1="14" x2="18" y2="30" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                {/* Omino - braccia (la destra tiene il megafono) */}
                <line x1="18" y1="19" x2="8" y2="26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                <line x1="18" y1="19" x2="32" y2="17" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                {/* Omino - gambe */}
                <line x1="18" y1="30" x2="10" y2="42" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                <line x1="18" y1="30" x2="26" y2="42" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                {/* Megafono */}
                <polygon points="32,12 48,4 48,30 32,22" opacity="0.9" />
                <rect x="29" y="13" width="4" height="8" rx="1" />
                {/* Onde sonore */}
                <path d="M52,13 Q56,17 52,21" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M56,9 Q62,17 56,25" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M60,5 Q68,17 60,29" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                {/* Pedone */}
                <circle cx="82" cy="14" r="5.5" />
                <path d="M75,44 L89,44 L87,36 Q82,32 77,36 Z" />
                <rect x="77" y="20" width="10" height="4" rx="2" />
                <path d="M78,24 Q82,30 86,24" fill="currentColor" />
              </svg>
            </div>
            <h2>Allenatore</h2>
            <p>Crea e gestisci le lezioni, monitora i progressi e costruisci percorsi didattici.</p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default RoleSelector
