import './Header.css'

function Header({ onExit, onSettings, onLogout, onChangeRole, showExit = false, lessonTitle = null, userName = null, userRole = null }) {
  const roleLabel = userRole === 'studente' ? 'Studente' : userRole === 'allenatore' ? 'Allenatore' : null

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <span className="logo-icon">&#9823;</span>
          <h1>NeuroScacchi</h1>
          {lessonTitle && <span className="lesson-title-header">{lessonTitle}</span>}
        </div>
        <div className="header-controls">
          {userName && (
            <span className="header-user-name">{userName}</span>
          )}
          {roleLabel && onChangeRole && (
            <button className="role-badge" onClick={onChangeRole} title="Cambia modalita">
              {roleLabel}
            </button>
          )}
          {showExit && (
            <button className="icon-btn exit-btn" onClick={onExit} aria-label="Esci dalla lezione">
              &#10005;
            </button>
          )}
          <button className="icon-btn" onClick={onSettings} aria-label="Impostazioni">
            &#9881;
          </button>
          {onLogout && (
            <button className="icon-btn logout-btn" onClick={onLogout} aria-label="Esci dall'account" title="Logout">
              &#8618;
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
