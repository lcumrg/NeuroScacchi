// Lesson Validator - Validazione JSON lezioni

export const validateLesson = (lessonData) => {
  const errors = []
  const warnings = []

  // Campi obbligatori base
  if (!lessonData.id) errors.push('Campo "id" mancante')
  if (!lessonData.titolo) errors.push('Campo "titolo" mancante')
  if (!lessonData.tipo_modulo) errors.push('Campo "tipo_modulo" mancante')
  if (!lessonData.fen) errors.push('Campo "fen" (posizione) mancante')

  // Valida tipo modulo
  const validTypes = ['intent', 'detective', 'intent_sequenza', 'candidate']
  if (lessonData.tipo_modulo && !validTypes.includes(lessonData.tipo_modulo)) {
    errors.push(`tipo_modulo deve essere "intent", "detective", "intent_sequenza" o "candidate", ricevuto: "${lessonData.tipo_modulo}"`)
  }

  // Valida parametri
  if (!lessonData.parametri) {
    warnings.push('Campo "parametri" mancante, verranno usati defaults')
  } else {
    if (lessonData.parametri.tempo_freeze && lessonData.parametri.tempo_freeze < 0) {
      errors.push('tempo_freeze deve essere un numero positivo')
    }
  }

  // Validazione specifica per Intent
  if (lessonData.tipo_modulo === 'intent') {
    if (!lessonData.domanda) errors.push('Lezione Intent: campo "domanda" mancante')
    if (!lessonData.opzioni_risposta || !Array.isArray(lessonData.opzioni_risposta)) {
      errors.push('Lezione Intent: campo "opzioni_risposta" deve essere un array')
    } else if (lessonData.opzioni_risposta.length < 2) {
      errors.push('Lezione Intent: servono almeno 2 opzioni di risposta')
    }
    if (!lessonData.risposta_corretta) errors.push('Lezione Intent: campo "risposta_corretta" mancante')
    if (!lessonData.mosse_consentite || !Array.isArray(lessonData.mosse_consentite)) {
      warnings.push('Lezione Intent: "mosse_consentite" mancante o non array')
    }
    if (!lessonData.mosse_corrette || !Array.isArray(lessonData.mosse_corrette)) {
      warnings.push('Lezione Intent: "mosse_corrette" mancante o non array')
    }
  }

  // Validazione specifica per Intent Sequenza
  if (lessonData.tipo_modulo === 'intent_sequenza') {
    if (!lessonData.steps || !Array.isArray(lessonData.steps)) {
      errors.push('Lezione Intent Sequenza: campo "steps" deve essere un array')
    } else {
      if (lessonData.steps.length < 2) {
        errors.push('Lezione Intent Sequenza: servono almeno 2 steps')
      }
      lessonData.steps.forEach((step, idx) => {
        if (!step.domanda) errors.push(`Step ${idx + 1}: campo "domanda" mancante`)
        if (!step.opzioni_risposta || step.opzioni_risposta.length < 2) {
          errors.push(`Step ${idx + 1}: servono almeno 2 opzioni di risposta`)
        } else {
          // Supporta sia stringhe che oggetti
          step.opzioni_risposta.forEach((opt, optIdx) => {
            if (typeof opt === 'object' && !opt.testo) {
              errors.push(`Step ${idx + 1}, opzione ${optIdx + 1}: campo "testo" mancante`)
            }
          })
        }
        if (!step.risposta_corretta) errors.push(`Step ${idx + 1}: "risposta_corretta" mancante`)
        if (!step.mosse_corrette || !Array.isArray(step.mosse_corrette)) {
          warnings.push(`Step ${idx + 1}: "mosse_corrette" mancante`)
        }
      })
    }
  }

  // Validazione specifica per Candidate
  if (lessonData.tipo_modulo === 'candidate') {
    if (!lessonData.mosse_candidate || !Array.isArray(lessonData.mosse_candidate)) {
      errors.push('Lezione Candidate: campo "mosse_candidate" deve essere un array')
    } else if (lessonData.mosse_candidate.length < 2) {
      errors.push('Lezione Candidate: servono almeno 2 mosse candidate')
    }
    if (!lessonData.mossa_migliore) {
      errors.push('Lezione Candidate: campo "mossa_migliore" mancante')
    }
  }

  // Validazione specifica per Detective
  if (lessonData.tipo_modulo === 'detective') {
    if (!lessonData.modalita_detective) {
      errors.push('Lezione Detective: campo "modalita_detective" mancante')
    } else {
      if (!lessonData.modalita_detective.domanda) {
        errors.push('Lezione Detective: campo "modalita_detective.domanda" mancante')
      }
      if (!lessonData.modalita_detective.risposta_corretta_casa) {
        errors.push('Lezione Detective: campo "modalita_detective.risposta_corretta_casa" mancante')
      }
    }
  }

  // Valida FEN
  if (lessonData.fen) {
    const fenParts = lessonData.fen.split(' ')
    if (fenParts.length < 4) {
      errors.push('FEN non valida: formato incompleto')
    }
  }

  // Valida feedback
  if (!lessonData.feedback_positivo) warnings.push('Campo "feedback_positivo" mancante')
  if (!lessonData.feedback_negativo) warnings.push('Campo "feedback_negativo" mancante')

  // Valida profilassi se presente
  if (lessonData.parametri?.usa_profilassi) {
    if (!lessonData.parametri.tipo_profilassi) {
      warnings.push('Profilassi attiva ma "tipo_profilassi" non specificato (userò "checklist")')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

export const getLessonSummary = (lesson) => {
  const summary = {
    id: lesson.id,
    titolo: lesson.titolo,
    tipo: lesson.tipo_modulo,
    descrizione: lesson.descrizione || 'Nessuna descrizione',
    difficolta: lesson.difficolta || 'Non specificata',
    tempo_stimato: estimateTime(lesson),
    has_profilassi: !!lesson.parametri?.usa_profilassi,
    has_chunking: !!(lesson.parametri?.mostra_chunk_visivo?.length),
    has_frecce: !!(lesson.parametri?.frecce_pattern?.length)
  }
  
  return summary
}

const estimateTime = (lesson) => {
  let seconds = 0
  
  // Freeze base
  seconds += (lesson.parametri?.tempo_freeze || 1500) / 1000
  
  // Tempo per leggere e rispondere Intent/Detective/Candidate
  if (lesson.tipo_modulo === 'intent') {
    seconds += 10 // Lettura domanda + scelta
  } else if (lesson.tipo_modulo === 'detective') {
    seconds += 8 // Osservazione + click
  } else if (lesson.tipo_modulo === 'candidate') {
    seconds += 20 // Selezione candidate + valutazione
  }

  // Tempo per mossa
  if (lesson.tipo_modulo === 'intent' || lesson.tipo_modulo === 'candidate') {
    seconds += 5 // Trascinamento pezzo
  }
  
  // Profilassi
  if (lesson.parametri?.usa_profilassi) {
    seconds += 5 // Checklist
  }
  
  // Feedback
  seconds += 3
  
  // Arrotonda
  const minutes = Math.ceil(seconds / 60)
  return minutes === 1 ? '1 min' : `${minutes} min`
}
