import { useState, useEffect } from 'react'
import { useAuth } from '../shared/contexts/AuthContext'
import LoginScreen from '../v1/components/LoginScreen'
import { resetVersionChoice } from '../VersionSelector'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import StatsPage from './pages/StatsPage'
import MetodoPage from './pages/MetodoPage'
import CoachAIPage from './pages/CoachAIPage'
import SessionRunner from './components/SessionRunner'
import { initTheme, saveTheme, getTheme } from './utils/storage'

export default function AppV2() {
  const { user, loading, logout } = useAuth()
  const [screen, setScreen] = useState('home') // 'home' | 'training' | 'profile' | 'stats' | 'method' | 'coach-ai'
  const [sessionPositions, setSessionPositions] = useState([])
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    setTheme(initTheme())
  }, [])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    saveTheme(next)
    setTheme(next)
  }

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
            style={styles.themeBtn}
            onClick={toggleTheme}
            title={theme === 'light' ? 'Tema scuro' : 'Tema chiaro'}
          >
            {theme === 'light' ? '\u263E' : '\u2600'}
          </button>
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
            onOpenCoachAI={() => setScreen('coach-ai')}
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
        {screen === 'coach-ai' && (
          <CoachAIPage onBack={handleBackHome} />
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
    background: 'var(--bg-main)',
    color: 'var(--text-primary)',
    transition: 'background 0.3s ease, color 0.3s ease',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: 8,
    color: 'var(--text-secondary)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 20px',
    background: 'var(--bg-card)',
    borderBottom: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    transition: 'background 0.3s ease',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  userName: {
    fontSize: 14,
    color: 'var(--text-secondary)',
  },
  themeBtn: {
    padding: '3px 10px',
    background: 'var(--color-primary-bg)',
    border: '1px solid var(--border-color)',
    borderRadius: 12,
    fontSize: 16,
    cursor: 'pointer',
    lineHeight: 1,
  },
  versionBtn: {
    padding: '3px 10px',
    background: 'var(--color-primary-bg)',
    border: '1px solid var(--border-color)',
    borderRadius: 12,
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--color-primary)',
    cursor: 'pointer',
  },
  headerBtn: {
    background: 'none',
    border: '1px solid var(--border-color)',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: 14,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  buildTime: {
    fontSize: 11,
    color: 'var(--text-label)',
  },
  footer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    textAlign: 'center',
    padding: '8px 0',
    fontSize: 11,
    color: 'var(--text-label)',
    background: 'var(--bg-main)',
    transition: 'background 0.3s ease',
  },
}
