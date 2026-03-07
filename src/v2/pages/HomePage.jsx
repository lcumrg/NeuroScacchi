import positions from '../data/positions.json'

export default function HomePage({ onStartSession }) {
  // Conta per tema
  const themes = {}
  positions.forEach(p => {
    themes[p.theme] = (themes[p.theme] || 0) + 1
  })

  const handleStart = (count) => {
    // Per ora: ordina per difficolta crescente e prendi N posizioni
    const sorted = [...positions].sort((a, b) => a.difficulty - b.difficulty)
    onStartSession(sorted.slice(0, count))
  }

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div style={styles.heroIcon}>&#9812;</div>
        <h2 style={styles.heroTitle}>Pronto ad allenarti?</h2>
        <p style={styles.heroSubtitle}>
          {positions.length} posizioni disponibili
        </p>
      </div>

      <div style={styles.sessionOptions}>
        <button style={styles.btnPrimary} onClick={() => handleStart(10)}>
          Sessione rapida (10)
        </button>
        <button style={styles.btnSecondary} onClick={() => handleStart(positions.length)}>
          Sessione completa ({positions.length})
        </button>
      </div>

      <div style={styles.themesSection}>
        <h3 style={styles.themesTitle}>Temi disponibili</h3>
        <div style={styles.themesList}>
          {Object.entries(themes).map(([theme, count]) => (
            <span key={theme} style={styles.themeTag}>
              {theme} ({count})
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: 500,
    margin: '0 auto',
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 32,
  },
  hero: {
    textAlign: 'center',
  },
  heroIcon: {
    fontSize: 56,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: '#2C3E50',
    margin: '0 0 4px 0',
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#5A6C7D',
    margin: 0,
  },
  sessionOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    maxWidth: 320,
  },
  btnPrimary: {
    padding: '14px 24px',
    background: '#2E7D32',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.2s',
  },
  btnSecondary: {
    padding: '12px 24px',
    background: '#fff',
    color: '#2C3E50',
    border: '1px solid #E0E0E0',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  themesSection: {
    width: '100%',
    textAlign: 'center',
  },
  themesTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#90A4AE',
    textTransform: 'uppercase',
    letterSpacing: 1,
    margin: '0 0 10px 0',
  },
  themesList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  themeTag: {
    background: '#F5F5F5',
    border: '1px solid #E0E0E0',
    borderRadius: 16,
    padding: '4px 12px',
    fontSize: 13,
    color: '#5A6C7D',
    textTransform: 'capitalize',
  },
}
