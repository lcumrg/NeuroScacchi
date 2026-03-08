import { getSRRecords, getSessionHistory } from '../utils/storage'
import { getSRStatus, getSRStatusLabel, getSRStatusColor } from '../engine/spacedRepetition'
import positions from '../data/positions.json'

export default function StatsPage({ onBack }) {
  const srRecords = getSRRecords()
  const history = getSessionHistory()

  const posMap = {}
  positions.forEach(p => { posMap[p.id] = p })

  // Stats generali
  const total = positions.length
  const seen = srRecords.length
  const unseen = total - seen
  const consolidated = srRecords.filter(r => getSRStatus(r) === 'consolidata').length
  const learning = srRecords.filter(r => getSRStatus(r) === 'in_apprendimento').length
  const toReview = srRecords.filter(r => getSRStatus(r) === 'da_rivedere').length

  // Stats per tema
  const themeStats = {}
  srRecords.forEach(r => {
    const pos = posMap[r.positionId]
    if (!pos) return
    const theme = pos.theme
    if (!themeStats[theme]) themeStats[theme] = { correct: 0, total: 0, errors: 0 }
    themeStats[theme].total++
    if (r.correct) themeStats[theme].correct++
    themeStats[theme].errors += r.errors
  })

  // Ultime sessioni
  const recentSessions = history.slice(-5).reverse()

  // Insight
  const insights = generateInsights(srRecords, history, posMap)

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Le tue statistiche</h2>

      {/* Panoramica */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Panoramica</h3>
        <div style={styles.overviewGrid}>
          <div style={styles.overviewItem}>
            <div style={{ ...styles.overviewValue, color: '#1565C0' }}>{consolidated}</div>
            <div style={styles.overviewLabel}>Consolidate</div>
          </div>
          <div style={styles.overviewItem}>
            <div style={{ ...styles.overviewValue, color: '#5C6BC0' }}>{learning}</div>
            <div style={styles.overviewLabel}>In corso</div>
          </div>
          <div style={styles.overviewItem}>
            <div style={{ ...styles.overviewValue, color: '#455A64' }}>{toReview}</div>
            <div style={styles.overviewLabel}>Da rivedere</div>
          </div>
          <div style={styles.overviewItem}>
            <div style={styles.overviewValue}>{unseen}</div>
            <div style={styles.overviewLabel}>Nuove</div>
          </div>
        </div>
        {/* Barra visiva */}
        <div style={styles.progressBar}>
          {consolidated > 0 && <div style={{ ...styles.progressSegment, background: '#1565C0', flex: consolidated }} />}
          {learning > 0 && <div style={{ ...styles.progressSegment, background: '#5C6BC0', flex: learning }} />}
          {toReview > 0 && <div style={{ ...styles.progressSegment, background: '#455A64', flex: toReview }} />}
          {unseen > 0 && <div style={{ ...styles.progressSegment, background: '#E0E0E0', flex: unseen }} />}
        </div>
      </div>

      {/* Insight */}
      {insights.length > 0 && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Insight</h3>
          {insights.map((insight, i) => (
            <div key={i} style={styles.insight}>{insight}</div>
          ))}
        </div>
      )}

      {/* Per tema */}
      {Object.keys(themeStats).length > 0 && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Per tema</h3>
          {Object.entries(themeStats).map(([theme, stats]) => {
            const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
            return (
              <div key={theme} style={styles.themeRow}>
                <span style={styles.themeName}>{theme}</span>
                <div style={styles.themeBar}>
                  <div style={{ ...styles.themeBarFill, width: `${pct}%` }} />
                </div>
                <span style={styles.themePct}>{pct}%</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Ultime sessioni */}
      {recentSessions.length > 0 && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Ultime sessioni</h3>
          {recentSessions.map((s, i) => (
            <div key={i} style={styles.sessionRow}>
              <span style={styles.sessionDate}>
                {new Date(s.timestamp).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
              <span style={styles.sessionResult}>
                {s.correct}/{s.positionCount} corrette
              </span>
            </div>
          ))}
        </div>
      )}

      {seen === 0 && (
        <div style={styles.empty}>
          <p>Completa la tua prima sessione per vedere le statistiche!</p>
        </div>
      )}

      <button style={styles.backBtn} onClick={onBack}>Torna alla home</button>
    </div>
  )
}

function generateInsights(srRecords, history, posMap) {
  const insights = []
  if (srRecords.length === 0) return insights

  // Tema migliore e peggiore
  const themeScores = {}
  srRecords.forEach(r => {
    const theme = posMap[r.positionId]?.theme
    if (!theme) return
    if (!themeScores[theme]) themeScores[theme] = { correct: 0, total: 0 }
    themeScores[theme].total++
    if (r.correct) themeScores[theme].correct++
  })

  const entries = Object.entries(themeScores).filter(([, s]) => s.total >= 2)
  if (entries.length >= 2) {
    entries.sort((a, b) => (b[1].correct / b[1].total) - (a[1].correct / a[1].total))
    const best = entries[0]
    const worst = entries[entries.length - 1]
    const bestPct = Math.round((best[1].correct / best[1].total) * 100)
    const worstPct = Math.round((worst[1].correct / worst[1].total) * 100)
    insights.push(`Sei forte in "${best[0]}" (${bestPct}% corrette).`)
    if (worstPct < 60) {
      insights.push(`Potresti migliorare in "${worst[0]}" (${worstPct}%). Prova una sessione focalizzata!`)
    }
  }

  // Confronto ultime 2 sessioni
  if (history.length >= 2) {
    const last = history[history.length - 1]
    const prev = history[history.length - 2]
    const lastPct = last.positionCount > 0 ? Math.round((last.correct / last.positionCount) * 100) : 0
    const prevPct = prev.positionCount > 0 ? Math.round((prev.correct / prev.positionCount) * 100) : 0
    const diff = lastPct - prevPct
    if (diff > 5) {
      insights.push(`Nell'ultima sessione hai migliorato del ${diff}% rispetto alla precedente!`)
    } else if (diff < -10) {
      insights.push(`L'ultima sessione e' stata piu difficile della precedente. Non mollare!`)
    }
  }

  // Streak
  const consolidated = srRecords.filter(r => getSRStatus(r) === 'consolidata').length
  if (consolidated > 0) {
    insights.push(`Hai consolidato ${consolidated} posizioni. Ottimo lavoro!`)
  }

  return insights
}

const styles = {
  container: { maxWidth: 520, margin: '0 auto', padding: '24px 20px 80px' },
  title: { fontSize: 24, fontWeight: 700, color: '#212121', margin: '0 0 20px 0' },
  card: {
    background: '#FAFBFC', borderRadius: 12, padding: '16px 20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #E0E0E0',
    marginBottom: 16,
  },
  cardTitle: { fontSize: 14, fontWeight: 600, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 12px 0' },
  overviewGrid: { display: 'flex', justifyContent: 'space-around', marginBottom: 12 },
  overviewItem: { textAlign: 'center' },
  overviewValue: { fontSize: 24, fontWeight: 700, color: '#212121' },
  overviewLabel: { fontSize: 11, color: '#90A4AE', fontWeight: 600, textTransform: 'uppercase' },
  progressBar: { display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 },
  progressSegment: { borderRadius: 4, transition: 'flex 0.3s' },
  insight: {
    padding: '8px 12px', background: '#E8EAF6', borderRadius: 8,
    fontSize: 14, color: '#283593', marginBottom: 8, lineHeight: 1.4,
  },
  themeRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  themeName: { fontSize: 14, color: '#212121', fontWeight: 500, textTransform: 'capitalize', width: 100, flexShrink: 0 },
  themeBar: { flex: 1, height: 8, background: '#E0E0E0', borderRadius: 4, overflow: 'hidden' },
  themeBarFill: { height: '100%', background: '#5C6BC0', borderRadius: 4, transition: 'width 0.3s' },
  themePct: { fontSize: 14, fontWeight: 600, color: '#546E7A', width: 36, textAlign: 'right' },
  sessionRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F5F5F5' },
  sessionDate: { fontSize: 14, color: '#546E7A' },
  sessionResult: { fontSize: 14, fontWeight: 600, color: '#212121' },
  empty: { textAlign: 'center', padding: 20, color: '#90A4AE' },
  backBtn: {
    padding: '10px 24px', background: 'none', color: '#546E7A',
    border: '1px solid #E0E0E0', borderRadius: 10, fontSize: 14,
    cursor: 'pointer', fontFamily: 'inherit', marginTop: 8,
  },
}
