import { useState, useEffect, lazy, Suspense } from 'react'
import './SviluppoPage.css'

const ProgettoPage = lazy(() => import('./ProgettoPage.jsx'))
const DiarioPage = lazy(() => import('./DiarioPage.jsx'))
const FeedbackPage = lazy(() => import('./FeedbackPage.jsx'))
const AnalisiPage = lazy(() => import('./AnalisiPage.jsx'))

const TABS = [
  { id: 'analisi',  label: 'Analisi',   hash: '#/sviluppo/analisi' },
  { id: 'diario',   label: 'Diario',    hash: '#/sviluppo/diario' },
  { id: 'progetto', label: 'Progetto',  hash: '#/sviluppo/progetto' },
  { id: 'feedback', label: 'Feedback',  hash: '#/sviluppo/feedback' },
]

function getSubRoute() {
  const hash = window.location.hash || ''
  if (hash.includes('/diario'))   return 'diario'
  if (hash.includes('/progetto')) return 'progetto'
  if (hash.includes('/feedback')) return 'feedback'
  return 'analisi'
}

const fallback = (
  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
    Caricamento...
  </div>
)

export default function SviluppoPage() {
  const [sub, setSub] = useState(getSubRoute)

  useEffect(() => {
    const onHash = () => setSub(getSubRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <div className="sv-page">
      {/* Sub-nav */}
      <nav className="sv-subnav">
        {TABS.map(t => (
          <a
            key={t.id}
            href={t.hash}
            className={`sv-tab${sub === t.id ? ' active' : ''}`}
          >
            {t.label}
          </a>
        ))}
      </nav>

      {/* Content */}
      <Suspense fallback={fallback}>
        {sub === 'analisi'  && <AnalisiPage />}
        {sub === 'diario'   && <DiarioPage />}
        {sub === 'progetto' && <ProgettoPage />}
        {sub === 'feedback' && <FeedbackPage />}
      </Suspense>
    </div>
  )
}
