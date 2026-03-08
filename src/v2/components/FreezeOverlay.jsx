import { useState, useEffect } from 'react'

/**
 * Freeze: overlay a schermo intero che sfoca TUTTO tranne la scacchiera.
 * La scacchiera emerge nitida grazie a z-index superiore (gestito dal parent).
 * Vignettatura radiale: trasparente al centro, scuro ai bordi.
 * Timer indaco fisso, countdown grande, barra sottile.
 */
export default function FreezeOverlay({ duration, onComplete }) {
  const [remaining, setRemaining] = useState(duration)
  const [visible, setVisible] = useState(false)

  // Fade-in progressivo
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  useEffect(() => {
    if (remaining <= 0) {
      // Fade-out prima di completare
      setVisible(false)
      const timer = setTimeout(onComplete, 500)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => setRemaining(r => r - 100), 100)
    return () => clearTimeout(timer)
  }, [remaining, onComplete])

  const progress = 1 - remaining / duration
  const seconds = Math.ceil(remaining / 1000)

  return (
    <div style={{
      ...styles.overlay,
      opacity: visible ? 1 : 0,
    }}>
      {/* Vignettatura: scuro ai bordi, trasparente al centro (dove c'è la scacchiera) */}
      <div style={styles.vignette} />

      {/* Contenuto sotto la scacchiera */}
      <div style={styles.content}>
        <p style={styles.text}>Osserva la posizione</p>
        <div style={styles.timer}>{seconds}</div>
        <div style={styles.barContainer}>
          <div style={{ ...styles.bar, width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    backdropFilter: 'blur(7px)',
    WebkitBackdropFilter: 'blur(7px)',
    transition: 'opacity 450ms ease-in',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 80,
  },
  vignette: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at center, rgba(28,28,46,0.05) 30%, rgba(28,28,46,0.65) 100%)',
    pointerEvents: 'none',
  },
  content: {
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
  },
  text: {
    fontSize: 17,
    fontWeight: 600,
    color: '#E8EAF6',
    marginBottom: 6,
    letterSpacing: 0.5,
    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
  },
  timer: {
    fontSize: 32,
    fontWeight: 800,
    color: '#E8EAF6',
    marginBottom: 10,
    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
  },
  barContainer: {
    width: 180,
    height: 5,
    background: 'rgba(232,234,246,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    margin: '0 auto',
  },
  bar: {
    height: '100%',
    background: '#3949AB',
    borderRadius: 3,
    transition: 'width 0.1s linear',
  },
}
