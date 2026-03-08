import { useState, useEffect, useRef } from 'react'
import TrainingSession from './TrainingSession'
import ProgressBar from './ProgressBar'
import SessionSummary from './SessionSummary'
import { DEFAULT_PROFILE } from '../engine/cognitiveLayer'
import { createSRRecord, updateSRRecord } from '../engine/spacedRepetition'
import { getSRRecords, updateSRRecordInStorage, saveSessionResult, getCognitiveProfile } from '../utils/storage'
import { initStockfish, isReady as isStockfishReady, destroy as destroyStockfish } from '../engine/stockfishService'
import { createSession, completeSession, logMove, buildMoveLog, buildSessionSummary, saveLeitnerState } from '../utils/firestoreService'
import { useAuth } from '../../shared/contexts/AuthContext'

export default function SessionRunner({ positions, onFinish, onRestart }) {
  const { user } = useAuth()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState([])
  const [showSummary, setShowSummary] = useState(false)
  const [stockfishLoading, setStockfishLoading] = useState(true)
  const [stockfishError, setStockfishError] = useState(null)
  const cognitiveProfile = getCognitiveProfile() || DEFAULT_PROFILE
  const sessionIdRef = useRef(null)

  // Inizializza Stockfish + crea sessione Firebase
  useEffect(() => {
    initStockfish()
      .then(() => setStockfishLoading(false))
      .catch((err) => {
        console.warn('Stockfish non disponibile, fallback a modalita classica:', err.message)
        setStockfishError(err.message)
        setStockfishLoading(false)
      })

    // Crea sessione su Firestore
    if (user?.uid) {
      const themes = [...new Set(positions.map(p => p.theme))]
      createSession(user.uid, {
        positionCount: positions.length,
        themes,
        cognitiveProfile,
      }).then(id => { sessionIdRef.current = id })
        .catch(() => {}) // silenzioso se Firebase non disponibile
    }

    return () => { destroyStockfish() }
  }, [])

  const handleResult = (result) => {
    const newResults = [...results, result]
    setResults(newResults)

    // Aggiorna spaced repetition (localStorage)
    const srRecords = getSRRecords()
    const existing = srRecords.find(r => r.positionId === result.positionId)
    let srRecord
    if (existing) {
      srRecord = updateSRRecord(existing, result.correct)
      updateSRRecordInStorage(srRecord)
    } else {
      srRecord = createSRRecord(result.positionId, result.correct)
      updateSRRecordInStorage(srRecord)
    }

    // Log mossa + SR su Firestore (fire-and-forget)
    if (user?.uid) {
      const pos = positions[currentIndex]
      const moveLog = buildMoveLog({
        ...result,
        fen: pos.fen,
        moveNumber: currentIndex,
      })
      logMove(user.uid, sessionIdRef.current, moveLog).catch(() => {})
      saveLeitnerState(user.uid, result.positionId, srRecord).catch(() => {})
    }

    if (currentIndex + 1 >= positions.length) {
      // Salva sessione nello storico (localStorage)
      saveSessionResult({
        positionCount: positions.length,
        results: newResults,
        correct: newResults.filter(r => r.correct).length,
        errors: newResults.reduce((s, r) => s + r.errors, 0),
      })

      // Completa sessione su Firestore
      if (user?.uid && sessionIdRef.current) {
        const themes = [...new Set(positions.map(p => p.theme))]
        const summary = buildSessionSummary(newResults, {
          themes,
          sessionType: 'smart',
          cognitiveProfile,
        })
        completeSession(user.uid, sessionIdRef.current, summary).catch(() => {})
      }

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
        {stockfishLoading && (
          <div style={styles.stockfishStatus}>Caricamento motore...</div>
        )}
        {stockfishError && (
          <div style={styles.stockfishStatus}>Motore non disponibile — modalita classica</div>
        )}
      </div>

      <TrainingSession
        key={positions[currentIndex].id}
        position={positions[currentIndex]}
        positionIndex={currentIndex}
        cognitiveProfile={cognitiveProfile}
        onResult={handleResult}
        useStockfish={!stockfishLoading && !stockfishError}
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
    gap: 12,
    paddingTop: 8,
    paddingBottom: 32,
    minHeight: 'calc(100vh - 60px)', // single-action: sessione occupa tutto lo spazio
    justifyContent: 'flex-start',
  },
  progressArea: {
    width: '100%',
    maxWidth: 440,
    padding: '0 16px',
  },
  stockfishStatus: {
    fontSize: 12,
    color: 'var(--text-label)',
    textAlign: 'center',
    marginTop: 4,
  },
  empty: {
    textAlign: 'center',
    padding: 40,
    color: 'var(--text-secondary)',
  },
}
