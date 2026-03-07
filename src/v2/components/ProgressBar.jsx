export default function ProgressBar({ current, total }) {
  const progress = total > 0 ? current / total : 0

  return (
    <div style={styles.container}>
      <div style={styles.barOuter}>
        <div style={{ ...styles.barInner, width: `${progress * 100}%` }} />
      </div>
      <span style={styles.label}>{current}/{total}</span>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  barOuter: {
    flex: 1,
    height: 8,
    background: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barInner: {
    height: '100%',
    background: '#66BB6A',
    borderRadius: 4,
    transition: 'width 0.4s ease',
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#5A6C7D',
    minWidth: 40,
    textAlign: 'right',
  },
}
