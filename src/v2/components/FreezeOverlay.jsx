import { useState, useEffect } from 'react'

export default function FreezeOverlay({ duration, onComplete }) {
  const [remaining, setRemaining] = useState(duration)

  useEffect(() => {
    if (remaining <= 0) {
      onComplete()
      return
    }
    const timer = setTimeout(() => setRemaining(r => r - 100), 100)
    return () => clearTimeout(timer)
  }, [remaining, onComplete])

  const progress = 1 - remaining / duration

  return (
    <div style={styles.overlay}>
      <div style={styles.content}>
        <div style={styles.icon}>&#128065;</div>
        <p style={styles.text}>Osserva la posizione...</p>
        <div style={styles.barContainer}>
          <div style={{ ...styles.bar, width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderRadius: 8,
    backdropFilter: 'blur(1px)',
  },
  content: {
    textAlign: 'center',
    color: '#fff',
  },
  icon: {
    fontSize: 36,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 12,
  },
  barContainer: {
    width: 180,
    height: 6,
    background: 'rgba(255,255,255,0.25)',
    borderRadius: 3,
    overflow: 'hidden',
    margin: '0 auto',
  },
  bar: {
    height: '100%',
    background: '#81C784',
    borderRadius: 3,
    transition: 'width 0.1s linear',
  },
}
