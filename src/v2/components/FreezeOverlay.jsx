import { useState, useEffect, useRef } from 'react'

export default function FreezeOverlay({ duration, onComplete }) {
  const [remaining, setRemaining] = useState(duration)
  const [visible, setVisible] = useState(false)
  const overlayRef = useRef(null)

  // Fade-in on mount
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  useEffect(() => {
    if (remaining <= 0) {
      // Fade-out before completing
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
    <div
      ref={overlayRef}
      style={{
        ...styles.overlay,
        opacity: visible ? 1 : 0,
      }}
    >
      <div style={styles.vignette} />
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
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderRadius: 8,
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    transition: 'opacity 500ms ease-in',
  },
  vignette: {
    position: 'absolute',
    inset: 0,
    borderRadius: 8,
    background: 'radial-gradient(circle at center, rgba(28,28,46,0.15) 0%, rgba(28,28,46,0.75) 100%)',
    pointerEvents: 'none',
  },
  content: {
    position: 'relative',
    textAlign: 'center',
    zIndex: 1,
  },
  text: {
    fontSize: 17,
    fontWeight: 600,
    color: '#E8EAF6',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  timer: {
    fontSize: 32,
    fontWeight: 800,
    color: '#E8EAF6',
    marginBottom: 12,
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
