import { useState } from 'react'
import TrainingSession from './TrainingSession'
import ProgressBar from './ProgressBar'
import SessionSummary from './SessionSummary'

export default function SessionRunner({ positions, onFinish, onRestart }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState([])
  const [showSummary, setShowSummary] = useState(false)

  const handleResult = (result) => {
    const newResults = [...results, result]
    setResults(newResults)

    if (currentIndex + 1 >= positions.length) {
      // Sessione completata
      setShowSummary(true)
    } else {
      // Prossima posizione
      setCurrentIndex(i => i + 1)
    }
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setResults([])
    setShowSummary(false)
    onRestart()
  }

  if (positions.length === 0) {
    return (
      <div style={styles.empty}>
        <p>Nessuna posizione disponibile per questa sessione.</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.progressArea}>
        <ProgressBar current={currentIndex + 1} total={positions.length} />
      </div>

      <TrainingSession
        key={positions[currentIndex].id}
        position={positions[currentIndex]}
        onResult={handleResult}
      />

      {showSummary && (
        <SessionSummary
          results={results}
          onRestart={handleRestart}
          onHome={onFinish}
        />
      )}
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  progressArea: {
    width: '100%',
    maxWidth: 440,
    padding: '0 16px',
  },
  empty: {
    textAlign: 'center',
    padding: 40,
    color: '#5A6C7D',
  },
}
