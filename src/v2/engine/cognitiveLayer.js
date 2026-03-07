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

// Pool domande metacognitive
export const METACOGNITION_QUESTIONS = [
  'Ti eri accorto che c\'era una minaccia?',
  'Hai guardato tutta la scacchiera prima di muovere?',
  'Avevi un piano in mente o hai mosso d\'istinto?',
  'Hai considerato cosa poteva fare l\'avversario?',
  'C\'e\' stato un momento in cui ti sei accorto dell\'errore?',
  'Hai provato a immaginare la posizione dopo la tua mossa?',
  'Hai controllato se i tuoi pezzi erano al sicuro?',
]

export function getRandomMetaQuestion() {
  return METACOGNITION_QUESTIONS[Math.floor(Math.random() * METACOGNITION_QUESTIONS.length)]
}
