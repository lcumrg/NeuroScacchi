export default function HintBox({ hints, errorsCount }) {
  // Mostra hint progressivamente: 1 hint dopo 1 errore, 2 dopo 2, ecc.
  const visibleHints = hints.slice(0, errorsCount)

  if (visibleHints.length === 0) return null

  return (
    <div style={styles.container}>
      {visibleHints.map((hint, i) => (
        <div key={i} style={styles.hint}>
          <span style={styles.bulb}>&#128161;</span> {hint}
        </div>
      ))}
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginTop: 8,
  },
  hint: {
    background: '#FFF9C4',
    border: '1px solid #FFF176',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 14,
    color: '#5D4037',
    animation: 'fadeIn 0.3s ease',
  },
  bulb: {
    marginRight: 4,
  },
}
