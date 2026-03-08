export default function SessionSummary({ results, onRestart, onHome }) {
  const total = results.length
  const correct = results.filter(r => r.correct).length
  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0)
  const totalTime = results.reduce((sum, r) => sum + r.timeMs, 0)
  const avgTime = total > 0 ? Math.round(totalTime / total / 1000) : 0
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0

  const getMessage = () => {
    if (percentage >= 90) return 'Eccezionale! Quasi perfetto.'
    if (percentage >= 70) return 'Ottimo lavoro! Stai migliorando.'
    if (percentage >= 50) return 'Buon inizio. Continua ad allenarti!'
    return 'Non mollare! Ogni errore e\' un passo avanti.'
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h2 style={styles.title}>Sessione completata!</h2>
        <p style={styles.message}>{getMessage()}</p>

        <div style={styles.stats}>
          <div style={styles.stat}>
            <div style={styles.statValue}>{correct}/{total}</div>
            <div style={styles.statLabel}>Corrette</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statValue}>{percentage}%</div>
            <div style={styles.statLabel}>Precisione</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statValue}>{totalErrors}</div>
            <div style={styles.statLabel}>Errori</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statValue}>{avgTime}s</div>
            <div style={styles.statLabel}>Media</div>
          </div>
        </div>

        <div style={styles.buttons}>
          <button style={styles.btnPrimary} onClick={onRestart}>
            Allenati ancora
          </button>
          <button style={styles.btnSecondary} onClick={onHome}>
            Torna alla home
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 20,
  },
  card: {
    background: '#FAFBFC',
    borderRadius: 20,
    padding: '36px 32px',
    maxWidth: 400,
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    animation: 'fadeIn 0.3s ease',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#212121',
    margin: '0 0 4px 0',
  },
  message: {
    fontSize: 15,
    color: '#546E7A',
    margin: '0 0 24px 0',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: 12,
    marginBottom: 24,
  },
  stat: {
    textAlign: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 700,
    color: '#212121',
  },
  statLabel: {
    fontSize: 11,
    color: '#90A4AE',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  btnPrimary: {
    padding: '12px 24px',
    background: '#283593',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnSecondary: {
    padding: '10px 24px',
    background: 'none',
    color: '#546E7A',
    border: '1px solid #E0E0E0',
    borderRadius: 10,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
}
