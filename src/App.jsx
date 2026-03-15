import { useState, useEffect, lazy, Suspense } from 'react'
import DemoPage from './pages/DemoPage.jsx'
import ConsolePage from './pages/ConsolePage.jsx'
import LessonsPage from './pages/LessonsPage.jsx'

const DocPage = lazy(() => import('./pages/DocPage.jsx'))
const ProgettoPage = lazy(() => import('./pages/ProgettoPage.jsx'))
const PlayerPage = lazy(() => import('./pages/PlayerPage.jsx'))
const FeedbackPage = lazy(() => import('./pages/FeedbackPage.jsx'))

function getRoute() {
  const hash = window.location.hash || '#/'
  if (hash.startsWith('#/console')) return 'console'
  if (hash.startsWith('#/progetto')) return 'progetto'
  if (hash.startsWith('#/doc')) return 'doc'
  if (hash.startsWith('#/lessons')) return 'lessons'
  if (hash.startsWith('#/player')) return 'player'
  if (hash.startsWith('#/feedback')) return 'feedback'
  return 'demo'
}

export default function App() {
  const [route, setRoute] = useState(getRoute)

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-main)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-main)',
    }}>
      {/* Nav bar */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        padding: '0.625rem 1.5rem',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <span style={{
          fontWeight: 700,
          fontSize: '1rem',
          color: 'var(--color-primary)',
          marginRight: 'auto',
        }}>
          NeuroScacchi
        </span>
        <a
          href="#/"
          style={{
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: route === 'demo' ? 700 : 500,
            color: route === 'demo' ? 'var(--color-primary)' : 'var(--text-secondary)',
            padding: '0.25rem 0.5rem',
            borderRadius: '6px',
            background: route === 'demo' ? 'var(--color-primary-bg)' : 'transparent',
            transition: 'background var(--transition-fast)',
          }}
        >
          Demo
        </a>
        <a
          href="#/console"
          style={{
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: route === 'console' ? 700 : 500,
            color: route === 'console' ? 'var(--color-primary)' : 'var(--text-secondary)',
            padding: '0.25rem 0.5rem',
            borderRadius: '6px',
            background: route === 'console' ? 'var(--color-primary-bg)' : 'transparent',
            transition: 'background var(--transition-fast)',
          }}
        >
          Console Coach
        </a>
        <a
          href="#/progetto"
          style={{
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: route === 'progetto' ? 700 : 500,
            color: route === 'progetto' ? 'var(--color-primary)' : 'var(--text-secondary)',
            padding: '0.25rem 0.5rem',
            borderRadius: '6px',
            background: route === 'progetto' ? 'var(--color-primary-bg)' : 'transparent',
            transition: 'background var(--transition-fast)',
          }}
        >
          Progetto
        </a>
        <a
          href="#/doc"
          style={{
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: route === 'doc' ? 700 : 500,
            color: route === 'doc' ? 'var(--color-primary)' : 'var(--text-secondary)',
            padding: '0.25rem 0.5rem',
            borderRadius: '6px',
            background: route === 'doc' ? 'var(--color-primary-bg)' : 'transparent',
            transition: 'background var(--transition-fast)',
          }}
        >
          Documenti
        </a>
        <a
          href="#/lessons"
          style={{
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: route === 'lessons' ? 700 : 500,
            color: route === 'lessons' ? 'var(--color-primary)' : 'var(--text-secondary)',
            padding: '0.25rem 0.5rem',
            borderRadius: '6px',
            background: route === 'lessons' ? 'var(--color-primary-bg)' : 'transparent',
            transition: 'background var(--transition-fast)',
          }}
        >
          Lezioni
        </a>
        <a
          href="#/feedback"
          style={{
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: route === 'feedback' ? 700 : 500,
            color: route === 'feedback' ? 'var(--color-primary)' : 'var(--text-secondary)',
            padding: '0.25rem 0.5rem',
            borderRadius: '6px',
            background: route === 'feedback' ? 'var(--color-primary-bg)' : 'transparent',
            transition: 'background var(--transition-fast)',
          }}
        >
          Feedback
        </a>
      </nav>

      {/* Page content */}
      <main style={{ flex: 1 }}>
        {route === 'console' && <ConsolePage />}
        {route === 'demo' && <DemoPage />}
        {route === 'lessons' && <LessonsPage />}
        {route === 'progetto' && (
          <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Caricamento...</div>}>
            <ProgettoPage />
          </Suspense>
        )}
        {route === 'doc' && (
          <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Caricamento...</div>}>
            <DocPage />
          </Suspense>
        )}
        {route === 'player' && (
          <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Caricamento...</div>}>
            <PlayerPage />
          </Suspense>
        )}
        {route === 'feedback' && (
          <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Caricamento...</div>}>
            <FeedbackPage />
          </Suspense>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        padding: '1rem',
        color: 'var(--text-label)',
        fontSize: '0.7rem',
        fontFamily: 'var(--font-mono)',
        textAlign: 'center',
      }}>
        v3.0.0 — Build: {typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'dev'}
      </footer>
    </div>
  )
}
