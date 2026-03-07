import { useState, useEffect } from 'react'

const STORAGE_KEY = 'neuroscacchi_version'

export default function VersionSelector({ onSelect }) {
  const [hoveredVersion, setHoveredVersion] = useState(null)

  // Se l'utente ha gia scelto, vai diretto
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'v1' || saved === 'v2') {
      onSelect(saved)
    }
  }, [onSelect])

  const handleSelect = (version) => {
    localStorage.setItem(STORAGE_KEY, version)
    onSelect(version)
  }

  return (
    <div style={styles.container}>
      <div style={styles.inner}>
        <div style={styles.logo}>&#9816;</div>
        <h1 style={styles.title}>NeuroScacchi</h1>
        <p style={styles.subtitle}>Scegli la versione</p>

        <div style={styles.cards}>
          {/* V1 Classic */}
          <button
            style={{
              ...styles.card,
              borderColor: hoveredVersion === 'v1' ? '#64B5F6' : '#E0E0E0',
              transform: hoveredVersion === 'v1' ? 'translateY(-4px)' : 'none',
            }}
            onMouseEnter={() => setHoveredVersion('v1')}
            onMouseLeave={() => setHoveredVersion(null)}
            onClick={() => handleSelect('v1')}
          >
            <div style={styles.cardIcon}>&#9823;</div>
            <h2 style={styles.cardTitle}>Classic</h2>
            <p style={styles.cardDesc}>
              Lezioni guidate con Intent, Detective e Candidate mode.
              Profilassi, metacognizione e wizard di creazione.
            </p>
            <span style={styles.badge}>v1 — stabile</span>
          </button>

          {/* V2 */}
          <button
            style={{
              ...styles.card,
              borderColor: hoveredVersion === 'v2' ? '#81C784' : '#E0E0E0',
              transform: hoveredVersion === 'v2' ? 'translateY(-4px)' : 'none',
            }}
            onMouseEnter={() => setHoveredVersion('v2')}
            onMouseLeave={() => setHoveredVersion(null)}
            onClick={() => handleSelect('v2')}
          >
            <div style={styles.cardIcon}>&#9812;</div>
            <h2 style={styles.cardTitle}>2.0</h2>
            <p style={styles.cardDesc}>
              Training engine adattivo con profilo cognitivo,
              ripetizione spaziata e difficolta dinamica.
            </p>
            <span style={{ ...styles.badge, background: '#E8F5E9', color: '#2E7D32' }}>
              v2 — in sviluppo
            </span>
          </button>
        </div>

        <p style={styles.hint}>
          Puoi cambiare versione in qualsiasi momento dalle impostazioni.
        </p>
      </div>
    </div>
  )
}

// Reset: permette di tornare al selettore da qualsiasi versione
export function resetVersionChoice() {
  localStorage.removeItem(STORAGE_KEY)
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #F8F9FA 0%, #E8EAF6 100%)',
    padding: 20,
  },
  inner: {
    textAlign: 'center',
    maxWidth: 700,
    width: '100%',
  },
  logo: {
    fontSize: 64,
    marginBottom: 8,
    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))',
  },
  title: {
    fontSize: 36,
    fontWeight: 700,
    color: '#2C3E50',
    margin: '0 0 4px 0',
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  subtitle: {
    fontSize: 16,
    color: '#5A6C7D',
    margin: '0 0 40px 0',
  },
  cards: {
    display: 'flex',
    gap: 24,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  card: {
    background: '#FFFFFF',
    border: '2px solid #E0E0E0',
    borderRadius: 16,
    padding: '32px 24px',
    width: 280,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    fontFamily: 'inherit',
    fontSize: 'inherit',
  },
  cardIcon: {
    fontSize: 48,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 600,
    color: '#2C3E50',
    margin: 0,
  },
  cardDesc: {
    fontSize: 14,
    color: '#5A6C7D',
    lineHeight: 1.5,
    margin: 0,
  },
  badge: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: 20,
    background: '#E3F2FD',
    color: '#1565C0',
  },
  hint: {
    marginTop: 32,
    fontSize: 13,
    color: '#90A4AE',
  },
}
