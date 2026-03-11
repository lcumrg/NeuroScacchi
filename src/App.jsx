import { AuthProvider } from './shared/contexts/AuthContext.jsx'

export default function App() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-main)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-main)',
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>NeuroScacchi 3.0</h1>
      <p style={{ color: 'var(--text-secondary)' }}>In costruzione</p>
      <p style={{ color: 'var(--text-label)', fontSize: '0.85rem', marginTop: '1rem' }}>
        Build: {typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'dev'}
      </p>
    </div>
  )
}
