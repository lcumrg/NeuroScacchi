// Cloud Functions per NeuroScacchi
// 1. onSessionComplete — trigger dopo ogni sessione completata
// 2. weeklyAggregation — cron settimanale per generare pattern/insights

const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')

initializeApp()
const db = getFirestore()

// =============================================================================
// 1. TRIGGER: Quando una nuova sessione viene salvata
//    - Aggiorna le statistiche della lezione (rating, plays count)
//    - Aggiorna le stats aggregate dell'utente
// =============================================================================

exports.onSessionComplete = onDocumentCreated(
  'users/{userId}/sessions/{sessionId}',
  async (event) => {
    const session = event.data.data()
    const { userId } = event.params

    if (!session || !session.lessonId) return

    const totalErrors = (session.intentErrors?.length || 0) + (session.moveErrors?.length || 0)
    const durationMs = session.completedAt && session.startedAt
      ? session.completedAt - session.startedAt
      : 0
    const isCompleted = session.completed === true

    try {
      // --- Aggiorna stats della lezione per questo utente ---
      const lessonStatsRef = db.doc(`users/${userId}/lessonStats/${session.lessonId}`)
      const lessonStatsSnap = await lessonStatsRef.get()

      if (lessonStatsSnap.exists) {
        const prev = lessonStatsSnap.data()
        const newPlays = (prev.totalPlays || 0) + 1
        const newErrors = (prev.totalErrors || 0) + totalErrors
        const newCompletions = (prev.completions || 0) + (isCompleted ? 1 : 0)
        const newTotalTime = (prev.totalTimeMs || 0) + durationMs

        await lessonStatsRef.update({
          totalPlays: newPlays,
          totalErrors: newErrors,
          completions: newCompletions,
          totalTimeMs: newTotalTime,
          avgErrors: newPlays > 0 ? newErrors / newPlays : 0,
          avgTimeMs: newPlays > 0 ? Math.round(newTotalTime / newPlays) : 0,
          completionRate: newPlays > 0 ? newCompletions / newPlays : 0,
          lastPlayedAt: FieldValue.serverTimestamp()
        })
      } else {
        await lessonStatsRef.set({
          lessonId: session.lessonId,
          totalPlays: 1,
          totalErrors: totalErrors,
          completions: isCompleted ? 1 : 0,
          totalTimeMs: durationMs,
          avgErrors: totalErrors,
          avgTimeMs: durationMs,
          completionRate: isCompleted ? 1 : 0,
          lastPlayedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp()
        })
      }

      // --- Aggiorna stats globali dell'utente ---
      const userStatsRef = db.doc(`users/${userId}/stats/global`)
      const userStatsSnap = await userStatsRef.get()

      if (userStatsSnap.exists) {
        await userStatsRef.update({
          totalSessions: FieldValue.increment(1),
          totalErrors: FieldValue.increment(totalErrors),
          totalTimeMs: FieldValue.increment(durationMs),
          totalCompletions: FieldValue.increment(isCompleted ? 1 : 0),
          lastSessionAt: FieldValue.serverTimestamp()
        })
      } else {
        await userStatsRef.set({
          totalSessions: 1,
          totalErrors: totalErrors,
          totalTimeMs: durationMs,
          totalCompletions: isCompleted ? 1 : 0,
          lastSessionAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp()
        })
      }

      console.log(`Stats aggiornate per utente ${userId}, lezione ${session.lessonId}`)
    } catch (e) {
      console.error('Errore aggiornamento stats:', e)
    }
  }
)

// =============================================================================
// 2. CRON SETTIMANALE: Aggrega sessioni e genera pattern/insights
//    Esegue ogni lunedi alle 03:00 CET
// =============================================================================

exports.weeklyAggregation = onSchedule(
  {
    schedule: 'every monday 03:00',
    timeZone: 'Europe/Rome'
  },
  async () => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    try {
      // Trova tutti gli utenti che hanno sessioni recenti
      const usersSnap = await db.collection('users').listDocuments()

      for (const userDoc of usersSnap) {
        const userId = userDoc.id
        await generateWeeklyInsights(userId, oneWeekAgo)
      }

      console.log('Aggregazione settimanale completata')
    } catch (e) {
      console.error('Errore aggregazione settimanale:', e)
    }
  }
)

// Genera insights settimanali per un singolo utente
async function generateWeeklyInsights(userId, since) {
  const sessionsSnap = await db
    .collection(`users/${userId}/sessions`)
    .where('savedAt', '>=', since)
    .get()

  if (sessionsSnap.empty) return

  const sessions = sessionsSnap.docs.map(d => d.data())
  const insights = []

  // --- Calcoli aggregati ---
  const totalSessions = sessions.length
  const completedSessions = sessions.filter(s => s.completed).length

  // Errori per step position
  const errorsByStep = {}
  for (const s of sessions) {
    for (const err of (s.intentErrors || [])) {
      const step = err.step || 'unknown'
      errorsByStep[step] = (errorsByStep[step] || 0) + 1
    }
  }

  // Step con piu errori
  const worstStep = Object.entries(errorsByStep).sort((a, b) => b[1] - a[1])[0]
  if (worstStep && worstStep[1] >= 2) {
    insights.push({
      type: 'worst_step',
      message: `Hai notato che sbagli spesso allo step ${worstStep[0]}? Forse vale la pena rallentare in quel punto.`,
      data: { step: worstStep[0], errors: worstStep[1] }
    })
  }

  // Correlazione fretta-errori (dalle riflessioni metacognitive)
  let frettaCount = 0
  let frettaErrors = 0
  let calmaCount = 0
  let calmaErrors = 0

  for (const s of sessions) {
    const totalErrors = (s.intentErrors?.length || 0) + (s.moveErrors?.length || 0)
    const metacog = s.metacognitive || []
    const hadFretta = metacog.some(m =>
      m.answer === 'fretta' || m.answer === 'in fretta' ||
      (m.question?.includes('istinto') && m.answer === 'Si')
    )

    if (hadFretta) {
      frettaCount++
      frettaErrors += totalErrors
    } else if (metacog.length > 0) {
      calmaCount++
      calmaErrors += totalErrors
    }
  }

  if (frettaCount >= 2 && calmaCount >= 2) {
    const avgFrettaErrors = frettaErrors / frettaCount
    const avgCalmaErrors = calmaErrors / calmaCount
    if (avgFrettaErrors > avgCalmaErrors * 1.3) {
      const diff = Math.round((1 - avgCalmaErrors / avgFrettaErrors) * 100)
      insights.push({
        type: 'fretta_correlation',
        message: `Hai notato che quando vai con calma sbagli il ${diff}% in meno? Continua cosi!`,
        data: { avgFrettaErrors, avgCalmaErrors, diff }
      })
    }
  }

  // Impatto profilassi
  let withProfilassi = { count: 0, errors: 0 }
  let withoutProfilassi = { count: 0, errors: 0 }

  for (const s of sessions) {
    const totalErrors = (s.intentErrors?.length || 0) + (s.moveErrors?.length || 0)
    if (s.profilassiUsed || s.phases?.profilassi) {
      withProfilassi.count++
      withProfilassi.errors += totalErrors
    } else {
      withoutProfilassi.count++
      withoutProfilassi.errors += totalErrors
    }
  }

  if (withProfilassi.count >= 2 && withoutProfilassi.count >= 2) {
    const avgWith = withProfilassi.errors / withProfilassi.count
    const avgWithout = withoutProfilassi.errors / withoutProfilassi.count
    if (avgWith < avgWithout * 0.8) {
      const diff = Math.round((1 - avgWith / avgWithout) * 100)
      insights.push({
        type: 'profilassi_impact',
        message: `Hai notato che quando usi la profilassi sbagli il ${diff}% in meno? La checklist ti aiuta davvero!`,
        data: { avgWith, avgWithout, diff }
      })
    }
  }

  // Trend miglioramento: prima meta settimana vs seconda meta
  if (sessions.length >= 4) {
    const sorted = [...sessions].sort((a, b) => (a.startedAt || 0) - (b.startedAt || 0))
    const mid = Math.floor(sorted.length / 2)
    const firstHalf = sorted.slice(0, mid)
    const secondHalf = sorted.slice(mid)

    const avgErrorsFirst = firstHalf.reduce((sum, s) =>
      sum + (s.intentErrors?.length || 0) + (s.moveErrors?.length || 0), 0) / firstHalf.length
    const avgErrorsSecond = secondHalf.reduce((sum, s) =>
      sum + (s.intentErrors?.length || 0) + (s.moveErrors?.length || 0), 0) / secondHalf.length

    if (avgErrorsSecond < avgErrorsFirst * 0.8) {
      insights.push({
        type: 'improvement',
        message: 'Stai migliorando! Nella seconda parte della settimana hai fatto meno errori.',
        data: { avgErrorsFirst, avgErrorsSecond }
      })
    }
  }

  // Sessioni completate
  if (totalSessions > 0) {
    insights.push({
      type: 'summary',
      message: `Questa settimana hai fatto ${totalSessions} sessioni e ne hai completate ${completedSessions}. Bel lavoro!`,
      data: { totalSessions, completedSessions }
    })
  }

  // --- Salva il report settimanale ---
  if (insights.length > 0) {
    const weekId = new Date().toISOString().split('T')[0]
    await db.doc(`users/${userId}/weeklyReports/${weekId}`).set({
      weekOf: weekId,
      totalSessions,
      completedSessions,
      errorsByStep,
      insights,
      generatedAt: FieldValue.serverTimestamp()
    })
    console.log(`Report settimanale per ${userId}: ${insights.length} insights`)
  }
}
