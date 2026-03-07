import { generateSession, getAvailableThemes } from '../engine/sessionEngine'
import { getSRRecords, getSessionHistory } from '../utils/storage'
import { getSRStatus } from '../engine/spacedRepetition'
import positions from '../data/positions.json'

export default function HomePage({ onStartSession, onOpenProfile, onOpenStats }) {
  const srRecords = getSRRecords()
  const history = getSessionHistory()
  const themes = getAvailableThemes()

  // Stats rapide
  const totalSeen = srRecords.length
  const consolidated = srRecords.filter(r => getSRStatus(r) === 'consolidata').length
  const toReview = srRecords.filter(r => r.nextReview <= Date.now()).length

  const handleSmartSession = (count) => {
    const selected = generateSession({ count })
    onStartSession(selected)
  }

  const handleThemeSession = (theme) => {
    const selected = generateSession({ count: 10, theme })
    if (selected.length === 0) {
      alert('Nessuna posizione disponibile per questo tema.')
      return
    }
    onStartSession(selected)
  }

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div style={styles.heroIcon}>&#9812;</div>
        <h2 style={styles.heroTitle}>Pronto ad allenarti?</h2>
        <p style={styles.heroSubtitle}>
          {positions.length} posizioni &middot; {totalSeen} viste &middot; {toReview > 0 ? toReview + ' da rivedere' : 'tutto aggiornato'}
        </p>
      </div>

      {/* Stats rapide */}
      {totalSeen > 0 && (
        <div style={styles.statsRow}>
          <div style={styles.stat}>
            <div style={{ ...styles.statValue, color: '#C62828' }}>{toReview}</div>
            <div style={styles.statLabel}>Da rivedere</div>
          </div>
          <div style={styles.stat}>
            <div style={{ ...styles.statValue, color: '#F57F17' }}>{totalSeen - consolidated}</div>
            <div style={styles.statLabel}>In corso</div>
          </div>
          <div style={styles.stat}>
            <div style={{ ...styles.statValue, color: '#2E7D32' }}>{consolidated}</div>
            <div style={styles.statLabel}>Consolidate</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statValue}>{history.length}</div>
            <div style={styles.statLabel}>Sessioni</div>
          </div>
        </div>
      )}

      {/* Sessioni */}
      <div style={styles.sessionOptions}>
        <button style={styles.btnPrimary} onClick={() => handleSmartSession(10)}>
          Allenamento smart (10)
        </button>
        <button style={styles.btnSecondary} onClick={() => handleSmartSession(positions.length)}>
          Sessione completa ({positions.length})
        </button>
      </div>

      {/* Temi — click per sessione focalizzata */}
      <div style={styles.themesSection}>
        <h3 style={styles.themesTitle}>Focus su un tema</h3>
        <div style={styles.themesList}>
          {Object.entries(themes).map(([theme, count]) => (
            <button
              key={theme}
              style={styles.themeBtn}
              onClick={() => handleThemeSession(theme)}
            >
              {theme} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Azioni */}
      <div style={styles.actions}>
        <button style={styles.actionBtn} onClick={onOpenProfile}>
          &#9881; Profilo cognitivo
        </button>
        <button style={styles.actionBtn} onClick={onOpenStats}>
          &#128200; Statistiche
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: 500,
    margin: '0 auto',
    padding: '32px 20px 80px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24,
  },
  hero: { textAlign: 'center' },
  heroIcon: { fontSize: 56, marginBottom: 8 },
  heroTitle: { fontSize: 26, fontWeight: 700, color: '#2C3E50', margin: '0 0 4px 0' },
  heroSubtitle: { fontSize: 15, color: '#5A6C7D', margin: 0 },
  statsRow: {
    display: 'flex',
    gap: 16,
    background: '#fff',
    borderRadius: 12,
    padding: '16px 24px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    border: '1px solid #E0E0E0',
    width: '100%',
    maxWidth: 400,
    justifyContent: 'space-around',
  },
  stat: { textAlign: 'center' },
  statValue: { fontSize: 22, fontWeight: 700, color: '#2C3E50' },
  statLabel: { fontSize: 10, color: '#90A4AE', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 },
  sessionOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
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
  themesSection: { width: '100%', textAlign: 'center' },
  themesTitle: { fontSize: 14, fontWeight: 600, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px 0' },
  themesList: { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  themeBtn: {
    background: '#F5F5F5',
    border: '1px solid #E0E0E0',
    borderRadius: 16,
    padding: '6px 14px',
    fontSize: 13,
    color: '#5A6C7D',
    textTransform: 'capitalize',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  actions: { display: 'flex', gap: 10 },
  actionBtn: {
    padding: '8px 16px',
    background: '#F5F5F5',
    border: '1px solid #E0E0E0',
    borderRadius: 8,
    fontSize: 13,
    color: '#5A6C7D',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
}
