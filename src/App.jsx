import { useState, useEffect, lazy, Suspense } from 'react'
import DemoPage from './pages/DemoPage.jsx'
import ConsolePage from './pages/ConsolePage.jsx'
import LessonsPage from './pages/LessonsPage.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

const DocPage = lazy(() => import('./pages/DocPage.jsx'))
const SviluppoPage = lazy(() => import('./pages/SviluppoPage.jsx'))
const PlayerPage = lazy(() => import('./pages/PlayerPage.jsx'))

function getRoute() {
  const hash = window.location.hash || '#/'
  if (hash.startsWith('#/console'))  return 'console'
  if (hash.startsWith('#/sviluppo')) return 'sviluppo'
  // legacy redirects — old links still work
  if (hash.startsWith('#/progetto')) return 'sviluppo'
  if (hash.startsWith('#/diario'))   return 'sviluppo'
  if (hash.startsWith('#/feedback')) return 'sviluppo'
  if (hash.startsWith('#/doc'))      return 'doc'
  if (hash.startsWith('#/lessons'))  return 'lessons'
  if (hash.startsWith('#/player'))   return 'player'
  return 'demo'
}

const fallback = (
  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
    Caricamento...
  </div>
)

export default function App() {
  const [route, setRoute] = useState(getRoute)

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navLink = (href, label, active) => (
    <a
      href={href}
      style={{
        textDecoration: 'none',
        fontSize: '0.875rem',
        fontWeight: active ? 700 : 500,
        color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
        padding: '0.25rem 0.5rem',
        borderRadius: '6px',
        background: active ? 'var(--color-primary-bg)' : 'transparent',
        transition: 'background var(--transition-fast)',
      }}
    >
      {label}
    </a>
  )

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
        {navLink('#/',         'Demo',          route === 'demo')}
        {navLink('#/console',  'Console Coach', route === 'console')}
        {navLink('#/lessons',  'Lezioni',       route === 'lessons')}
        {navLink('#/sviluppo', 'Sviluppo',      route === 'sviluppo')}
      </nav>

      {/* Page content */}
      <main style={{ flex: 1 }}>
        {route === 'console'  && <ConsolePage />}
        {route === 'demo'     && <DemoPage />}
        {route === 'lessons'  && <LessonsPage />}
        {route === 'sviluppo' && (
          <Suspense fallback={fallback}>
            <SviluppoPage />
          </Suspense>
        )}
        {route === 'doc' && (
          <Suspense fallback={fallback}>
            <DocPage />
          </Suspense>
        )}
        {route === 'player' && (
          <ErrorBoundary>
            <Suspense fallback={fallback}>
              <PlayerPage />
            </Suspense>
          </ErrorBoundary>
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
