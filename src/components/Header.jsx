import './Header.css'

function Header({ onExit, onSettings, showExit = false, lessonTitle = null }) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <span className="logo-icon">♟️</span>
          <h1>NeuroScacchi</h1>
          {lessonTitle && <span className="lesson-title-header">{lessonTitle}</span>}
        </div>
        <div className="header-controls">
          {showExit && (
            <button className="icon-btn exit-btn" onClick={onExit} aria-label="Esci">
              ✕
            </button>
          )}
          <button className="icon-btn" onClick={onSettings} aria-label="Impostazioni">
            ⚙️
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
