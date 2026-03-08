import { useState } from 'react'
import TrainingSession from './TrainingSession'
import ProgressBar from './ProgressBar'
import SessionSummary from './SessionSummary'
import { DEFAULT_PROFILE } from '../engine/cognitiveLayer'
import { createSRRecord, updateSRRecord } from '../engine/spacedRepetition'
import { getSRRecords, updateSRRecordInStorage, saveSessionResult, getCognitiveProfile } from '../utils/storage'

export default function SessionRunner({ positions, onFinish, onRestart }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState([])
  const [showSummary, setShowSummary] = useState(false)
  const cognitiveProfile = getCognitiveProfile() || DEFAULT_PROFILE

  const handleResult = (result) => {
    const newResults = [...results, result]
    setResults(newResults)

    // Aggiorna spaced repetition
    const srRecords = getSRRecords()
    const existing = srRecords.find(r => r.positionId === result.positionId)
    if (existing) {
      const updated = updateSRRecord(existing, result.correct)
      updateSRRecordInStorage(updated)
    } else {
      const newRecord = createSRRecord(result.positionId, result.correct)
      updateSRRecordInStorage(newRecord)
    }

    if (currentIndex + 1 >= positions.length) {
      // Salva sessione nello storico
      saveSessionResult({
        positionCount: positions.length,
        results: newResults,
        correct: newResults.filter(r => r.correct).length,
        errors: newResults.reduce((s, r) => s + r.errors, 0),
      })
      setShowSummary(true)
    } else {
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
        positionIndex={currentIndex}
        cognitiveProfile={cognitiveProfile}
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
    color: '#546E7A',
  },
}
