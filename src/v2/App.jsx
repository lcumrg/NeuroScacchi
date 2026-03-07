import { useAuth } from '../shared/contexts/AuthContext'
import LoginScreen from '../v1/components/LoginScreen'
import { resetVersionChoice } from '../VersionSelector'

export default function AppV2() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={{ fontSize: 32 }}>&#9812;</div>
          <div>Caricamento...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={{ fontSize: 24 }}>&#9812;</span>
          <h1 style={styles.headerTitle}>NeuroScacchi 2.0</h1>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userName}>{user.displayName || user.email?.split('@')[0]}</span>
          <button
            style={styles.headerBtn}
            onClick={() => { resetVersionChoice(); window.location.reload() }}
          >
            Cambia versione
          </button>
          <button style={styles.headerBtn} onClick={logout}>
            Esci
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.placeholder}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>&#9812;</div>
          <h2 style={{ margin: '0 0 12px 0', color: '#2C3E50' }}>NeuroScacchi 2.0</h2>
          <p style={{ color: '#5A6C7D', maxWidth: 400, lineHeight: 1.6 }}>
            Training engine adattivo in fase di sviluppo.
            Il session engine, il profilo cognitivo e il sistema di progressione
            verranno costruiti qui.
          </p>
          <div style={styles.statusBadge}>In costruzione</div>
        </div>
      </main>

      <footer style={styles.footer}>
        Ultimo aggiornamento: {__BUILD_TIME__}
      </footer>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#F8F9FA',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: 8,
    color: '#5A6C7D',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    background: '#FFFFFF',
    borderBottom: '1px solid #E0E0E0',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#2C3E50',
    margin: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  userName: {
    fontSize: 14,
    color: '#5A6C7D',
  },
  headerBtn: {
    background: 'none',
    border: '1px solid #E0E0E0',
    borderRadius: 8,
    padding: '6px 14px',
    fontSize: 13,
    color: '#5A6C7D',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  main: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 60px)',
  },
  placeholder: {
    textAlign: 'center',
    padding: 40,
  },
  statusBadge: {
    marginTop: 20,
    display: 'inline-block',
    padding: '6px 16px',
    borderRadius: 20,
    background: '#FFF3E0',
    color: '#E65100',
    fontSize: 13,
    fontWeight: 600,
  },
  footer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    textAlign: 'center',
    padding: '8px 0',
    fontSize: 11,
    color: '#B0BEC5',
    background: '#F8F9FA',
  },
}
