import { useState } from 'react'
import { useAuth } from '../shared/contexts/AuthContext'
import LoginScreen from '../v1/components/LoginScreen'
import { resetVersionChoice } from '../VersionSelector'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import StatsPage from './pages/StatsPage'
import MetodoPage from './pages/MetodoPage'
import SessionRunner from './components/SessionRunner'

export default function AppV2() {
  const { user, loading, logout } = useAuth()
  const [screen, setScreen] = useState('home') // 'home' | 'training' | 'profile' | 'stats' | 'method'
  const [sessionPositions, setSessionPositions] = useState([])

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

  const handleStartSession = (positions) => {
    setSessionPositions(positions)
    setScreen('training')
  }

  const handleBackHome = () => {
    setScreen('home')
    setSessionPositions([])
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={{ fontSize: 24, cursor: 'pointer' }} onClick={handleBackHome}>&#9812;</span>
          <h1 style={styles.headerTitle}>NeuroScacchi 2.0</h1>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userName}>{user.displayName || user.email?.split('@')[0]}</span>
          <button
            style={styles.versionBtn}
            onClick={() => { resetVersionChoice(); window.location.reload() }}
          >
            v2
          </button>
          {screen !== 'home' && (
            <button style={styles.headerBtn} onClick={handleBackHome}>
              &#10005; Esci
            </button>
          )}
          <button style={styles.headerBtn} onClick={logout}>
            Logout
          </button>
          <span style={styles.buildTime}>{__BUILD_TIME__}</span>
        </div>
      </header>

      <main>
        {screen === 'home' && (
          <HomePage
            onStartSession={handleStartSession}
            onOpenProfile={() => setScreen('profile')}
            onOpenStats={() => setScreen('stats')}
            onOpenMethod={() => setScreen('method')}
          />
        )}
        {screen === 'profile' && (
          <ProfilePage onBack={handleBackHome} />
        )}
        {screen === 'stats' && (
          <StatsPage onBack={handleBackHome} />
        )}
        {screen === 'method' && (
          <MetodoPage onBack={handleBackHome} />
        )}
        {screen === 'training' && (
          <SessionRunner
            positions={sessionPositions}
            onFinish={handleBackHome}
            onRestart={() => {
              setScreen('home')
              setTimeout(() => handleStartSession(sessionPositions), 0)
            }}
          />
        )}
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
    color: '#546E7A',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 20px',
    background: '#FAFBFC',
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
    color: '#212121',
    margin: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  userName: {
    fontSize: 14,
    color: '#546E7A',
  },
  versionBtn: {
    padding: '3px 10px',
    background: '#E8EAF6',
    border: '1px solid #C5CAE9',
    borderRadius: 12,
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 700,
    color: '#283593',
    cursor: 'pointer',
  },
  headerBtn: {
    background: 'none',
    border: '1px solid #E0E0E0',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: 14,
    color: '#546E7A',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  buildTime: {
    fontSize: 11,
    color: '#B0BEC5',
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
