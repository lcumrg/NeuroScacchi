// Cognitive Layer — profilo cognitivo dello studente
//
// 4 parametri, ciascuno con 3 livelli (alta/media/bassa):
// - impulsivita → durata freeze
// - consapevolezzaMinacce → frequenza profilassi
// - metacognizione → frequenza domande post-errore
// - tolleranzaFrustrazione → hint e incoraggiamenti

export const DEFAULT_PROFILE = {
  impulsivita: 'media',           // alta | media | bassa
  consapevolezzaMinacce: 'media', // alta | media | bassa
  metacognizione: 'media',        // alta | media | bassa
  tolleranzaFrustrazione: 'media', // alta | media | bassa
}

// Mapping parametri → comportamento app

export function getFreezeDuration(profile) {
  switch (profile.impulsivita) {
    case 'alta': return 5000
    case 'media': return 3000
    case 'bassa': return 1000
    default: return 3000
  }
}

/**
 * Ogni quante posizioni mostrare la profilassi.
 * 0 = mai, 1 = sempre, 3 = ogni 3 posizioni
 */
export function getProfilassiFrequency(profile) {
  switch (profile.consapevolezzaMinacce) {
    case 'bassa': return 1    // sempre
    case 'media': return 3    // ogni 3
    case 'alta': return 0     // mai
    default: return 3
  }
}

/**
 * Ogni quanti errori mostrare una domanda metacognitiva.
 * 0 = mai
 */
export function getMetacognitionFrequency(profile) {
  switch (profile.metacognizione) {
    case 'bassa': return 1    // ogni errore
    case 'media': return 2    // ogni 2 errori
    case 'alta': return 4     // ogni 4 errori (rara)
    default: return 2
  }
}

/**
 * Quanti hint mostrare prima di rivelare la soluzione.
 * -1 = non rivelare mai
 */
export function getMaxHints(profile) {
  switch (profile.tolleranzaFrustrazione) {
    case 'bassa': return 2    // dopo 2 hint mostra soluzione
    case 'media': return 3
    case 'alta': return -1    // non rivelare mai
    default: return 3
  }
}

/**
 * Controlla se la profilassi va mostrata per questa posizione.
 */
export function shouldShowProfilassi(profile, positionIndex) {
  const freq = getProfilassiFrequency(profile)
  if (freq === 0) return false
  return positionIndex % freq === 0
}

/**
 * Controlla se la metacognizione va mostrata dopo questo errore.
 */
export function shouldShowMetacognition(profile, totalErrorsInSession) {
  const freq = getMetacognitionFrequency(profile)
  if (freq === 0) return false
  return totalErrorsInSession > 0 && totalErrorsInSession % freq === 0
}

// Pool domande metacognitive generiche (fallback)
const GENERIC_QUESTIONS = [
  'Ti eri accorto che c\'era una minaccia?',
  'Hai guardato tutta la scacchiera prima di muovere?',
  'Avevi un piano in mente o hai mosso d\'istinto?',
  'Hai considerato cosa poteva fare l\'avversario?',
  'C\'e\' stato un momento in cui ti sei accorto dell\'errore?',
  'Hai provato a immaginare la posizione dopo la tua mossa?',
  'Hai controllato se i tuoi pezzi erano al sicuro?',
]

/**
 * Genera una domanda metacognitiva contestuale basata su dati reali del motore.
 * @param {object} context - { deltaEval, timeMs, classification, bestMove, totalErrors }
 * @returns {string} domanda
 */
export function getContextualMetaQuestion(context) {
  if (!context) return getRandomMetaQuestion()

  const { deltaEval, timeMs, classification, totalErrors } = context
  const timeSec = timeMs ? Math.round(timeMs / 1000) : null

  const contextual = []

  // Domande basate su velocita
  if (timeSec !== null && timeSec <= 3) {
    contextual.push(
      `Hai mosso in ${timeSec} secondi. Hai davvero valutato le alternative?`,
      `Risposta molto veloce (${timeSec}s). Stavi vedendo la posizione o reagendo d'istinto?`,
    )
  }

  // Domande basate su deltaEval
  if (deltaEval > 2.5) {
    contextual.push(
      `Hai perso ${Math.abs(deltaEval).toFixed(1)} punti con questa mossa. Cosa non hai visto?`,
      `Il motore dice che perdi materiale importante. Riesci a capire perche?`,
    )
  } else if (deltaEval > 1.0) {
    contextual.push(
      `La tua mossa non era terribile, ma potevi fare meglio (-${Math.abs(deltaEval).toFixed(1)}). Avevi visto l'alternativa?`,
    )
  }

  // Domande basate su pattern di errori
  if (totalErrors >= 3) {
    contextual.push(
      `E' il ${totalErrors}o errore in questa sessione. Stai rallentando o stai accelerando?`,
      `Diversi errori di fila. Hai bisogno di una pausa per rinfrescare la concentrazione?`,
    )
  }

  // Domande basate su classificazione
  if (classification === 'errore') {
    contextual.push(
      'Questa mossa perde molto materiale. Hai controllato se il pezzo era difeso?',
      'Prima di muovere, avevi guardato cosa minacciava l\'avversario?',
    )
  }

  // Se abbiamo domande contestuali, scegline una. Altrimenti fallback.
  if (contextual.length > 0) {
    return contextual[Math.floor(Math.random() * contextual.length)]
  }

  return getRandomMetaQuestion()
}

export function getRandomMetaQuestion() {
  return GENERIC_QUESTIONS[Math.floor(Math.random() * GENERIC_QUESTIONS.length)]
}
