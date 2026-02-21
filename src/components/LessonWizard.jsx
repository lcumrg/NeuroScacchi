import { useState, useCallback } from 'react'
import { Chess } from 'chess.js'
import { validateLesson } from '../utils/lessonValidator'
import { saveLesson } from '../utils/storageManager'
import WizardStepPosition from './wizard/WizardStepPosition'
import WizardStepTask from './wizard/WizardStepTask'
import WizardStepQuestion from './wizard/WizardStepQuestion'
import WizardStepVisuals from './wizard/WizardStepVisuals'
import WizardStepFeedback from './wizard/WizardStepFeedback'
import WizardStepExtras from './wizard/WizardStepExtras'
import WizardStepContinue from './wizard/WizardStepContinue'
import WizardStepReview from './wizard/WizardStepReview'
import './LessonWizard.css'

/*
  Flusso wizard:
  1. position   → Da che posizione partiamo?
  2. task       → Cosa vuoi chiedere allo studente?
  3. question   → Configura la domanda (adattato al tipo scelto)
  4. visuals    → Vuoi evidenziare qualcosa?
  5. feedback   → Cosa dici se risponde bene/male?
  6. extras     → Profilassi? Metacognizione?
  7. continue   → Aggiungi un altro step o finisci?
  8. review     → Riepilogo, titolo, prova, salva
*/

const WIZARD_PAGES = ['position', 'task', 'question', 'visuals', 'feedback', 'extras', 'continue', 'review']

// Etichette per la barra di progresso
const PAGE_LABELS = {
  position: 'Posizione',
  task: 'Tipo',
  question: 'Domanda',
  visuals: 'Visivi',
  feedback: 'Feedback',
  extras: 'Extra',
  continue: 'Continua?',
  review: 'Riepilogo'
}

function LessonWizard({ onSave, onClose, editLesson = null }) {
  // Stato globale della lezione in costruzione
  const [lessonData, setLessonData] = useState(() => {
    if (editLesson) return { ...JSON.parse(JSON.stringify(editLesson)) }
    return {
      id: '',
      titolo: '',
      descrizione: '',
      autori: [''],
      tipo_modulo: 'intent',
      categoria: 'aperture',
      difficolta: 'facile',
      fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      parametri: {
        tempo_freeze: 1500,
        orientamento_scacchiera: 'white',
        usa_profilassi: false,
        mostra_chunk_visivo: [],
        frecce_pattern: []
      },
      // Campi intent singolo
      domanda: '',
      opzioni_risposta: [],
      risposta_corretta: '',
      mosse_consentite: [],
      mosse_corrette: [],
      // Detective singolo
      modalita_detective: { domanda: '', risposta_corretta_casa: '', feedback_positivo: '', feedback_negativo: '' },
      // Candidate singolo
      mosse_candidate: [],
      mossa_migliore: '',
      // Sequenze
      steps: [],
      // Feedback
      feedback_positivo: '',
      feedback_negativo: '',
      // Metacognizione
      metacognizione: { domande: [], trigger: 'post_intent' }
    }
  })

  // Wizard navigation
  const [currentPage, setCurrentPage] = useState(editLesson ? 'review' : 'position')

  // Step corrente in costruzione (per sequenze multi-step)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // Stato per capire se stiamo costruendo uno step di una sequenza
  const [buildingStep, setBuildingStep] = useState(null)

  // Callback generico per aggiornare i dati della lezione
  const updateLesson = useCallback((updates) => {
    setLessonData(prev => {
      const next = { ...prev }
      for (const [key, value] of Object.entries(updates)) {
        if (key === 'parametri' && typeof value === 'object') {
          next.parametri = { ...prev.parametri, ...value }
        } else {
          next[key] = value
        }
      }
      return next
    })
  }, [])

  // Aggiorna lo step corrente in costruzione
  const updateBuildingStep = useCallback((updates) => {
    setBuildingStep(prev => prev ? { ...prev, ...updates } : null)
  }, [])

  // Navigazione wizard
  const goTo = (page) => setCurrentPage(page)

  const goNext = () => {
    const idx = WIZARD_PAGES.indexOf(currentPage)
    if (idx < WIZARD_PAGES.length - 1) setCurrentPage(WIZARD_PAGES[idx + 1])
  }

  const goBack = () => {
    const idx = WIZARD_PAGES.indexOf(currentPage)
    if (idx > 0) setCurrentPage(WIZARD_PAGES[idx - 1])
  }

  // Determina il tipo modulo appropriato basandosi sugli step costruiti
  const inferTipoModulo = (steps) => {
    if (steps.length === 0) return 'intent'
    if (steps.length === 1) {
      return steps[0].tipo_step // intent, detective, candidate
    }
    // Multi-step
    const types = new Set(steps.map(s => s.tipo_step))
    if (types.size === 1) {
      if (types.has('intent')) return 'intent_sequenza'
      if (types.has('candidate')) return 'candidate_sequenza'
    }
    return 'mista'
  }

  // Quando il coach sceglie il tipo di task per un nuovo step
  const handleTaskChosen = (taskType) => {
    const stepNumber = (lessonData.steps || []).length + 1
    const newStep = {
      numero: stepNumber,
      tipo_step: taskType,
      fen_aggiornata: lessonData.fen,
      mostra_chunk_visivo: [],
      frecce_pattern: [],
      feedback: '',
      feedback_negativo: ''
    }

    if (taskType === 'intent') {
      newStep.domanda = ''
      newStep.opzioni_risposta = ['', '', '']
      newStep.risposta_corretta = ''
      newStep.mosse_consentite = []
      newStep.mosse_corrette = []
    } else if (taskType === 'detective') {
      newStep.domanda = ''
      newStep.risposta_corretta_casa = ''
      newStep.max_tentativi = 3
      newStep.feedback_positivo = ''
      newStep.feedback_negativo = ''
    } else if (taskType === 'candidate') {
      newStep.mosse_candidate = []
      newStep.mossa_migliore = ''
      newStep.num_candidate = 2
      newStep.descrizione_step = ''
      newStep.feedback_positivo = ''
      newStep.feedback_negativo = ''
    }

    setBuildingStep(newStep)
    goTo('question')
  }

  // Finalizza lo step corrente e aggiungilo alla lezione
  const finalizeCurrentStep = () => {
    if (!buildingStep) return

    const newSteps = [...(lessonData.steps || []), buildingStep]
    const tipoModulo = inferTipoModulo(newSteps)

    // Se e' il primo step e tipo singolo, copia i dati anche a livello root
    if (newSteps.length === 1 && ['intent', 'detective', 'candidate'].includes(tipoModulo)) {
      const rootUpdates = { steps: newSteps, tipo_modulo: tipoModulo }
      if (tipoModulo === 'intent') {
        rootUpdates.domanda = buildingStep.domanda
        rootUpdates.opzioni_risposta = buildingStep.opzioni_risposta
        rootUpdates.risposta_corretta = buildingStep.risposta_corretta
        rootUpdates.mosse_consentite = buildingStep.mosse_consentite
        rootUpdates.mosse_corrette = buildingStep.mosse_corrette
      } else if (tipoModulo === 'detective') {
        rootUpdates.modalita_detective = {
          domanda: buildingStep.domanda,
          risposta_corretta_casa: buildingStep.risposta_corretta_casa,
          feedback_positivo: buildingStep.feedback_positivo || buildingStep.feedback || '',
          feedback_negativo: buildingStep.feedback_negativo || ''
        }
      } else if (tipoModulo === 'candidate') {
        rootUpdates.mosse_candidate = buildingStep.mosse_candidate
        rootUpdates.mossa_migliore = buildingStep.mossa_migliore
        rootUpdates.parametri = { ...lessonData.parametri, num_candidate: buildingStep.num_candidate || 2 }
      }
      updateLesson(rootUpdates)
    } else {
      updateLesson({ steps: newSteps, tipo_modulo: tipoModulo })
    }

    setCurrentStepIndex(newSteps.length - 1)
    setBuildingStep(null)
  }

  // "Vuoi aggiungere un altro step?" → Si
  const handleAddAnotherStep = () => {
    finalizeCurrentStep()
    goTo('task')
  }

  // "No, la lezione e' finita" → vai al review
  const handleFinishLesson = () => {
    finalizeCurrentStep()
    goTo('review')
  }

  // Salva la lezione
  const handleSave = (titleAndMeta) => {
    const finalLesson = { ...lessonData, ...titleAndMeta }
    if (!finalLesson.id) {
      finalLesson.id = finalLesson.titolo
        .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `lezione_${Date.now()}`
    }

    // Validazione
    const result = validateLesson(finalLesson)
    if (!result.valid) {
      return { success: false, errors: result.errors, warnings: result.warnings }
    }

    saveLesson(finalLesson)
    if (onSave) onSave(finalLesson)
    return { success: true }
  }

  // Scarica JSON
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(lessonData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${lessonData.id || 'lezione'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // FEN corrente per il board (usa lo step in costruzione se presente)
  const currentFen = buildingStep?.fen_aggiornata || lessonData.fen
  const boardOrientation = lessonData.parametri?.orientamento_scacchiera || 'white'

  // Progresso visuale
  const pageIndex = WIZARD_PAGES.indexOf(currentPage)
  const totalSteps = (lessonData.steps || []).length + (buildingStep ? 1 : 0)

  return (
    <div className="lesson-wizard">
      {/* Header */}
      <div className="wizard-header">
        <button className="wizard-back-btn" onClick={onClose}>
          &#8592; Torna alle lezioni
        </button>
        <div className="wizard-progress">
          {WIZARD_PAGES.map((page, i) => (
            <div key={page} className={`wizard-progress-dot ${i <= pageIndex ? 'active' : ''} ${page === currentPage ? 'current' : ''}`}>
              <span className="wizard-progress-label">{PAGE_LABELS[page]}</span>
            </div>
          ))}
        </div>
        {totalSteps > 0 && (
          <div className="wizard-step-count">
            {totalSteps} step{totalSteps !== 1 ? '' : ''}
          </div>
        )}
      </div>

      {/* Contenuto pagina corrente */}
      <div className="wizard-content">
        {currentPage === 'position' && (
          <WizardStepPosition
            fen={lessonData.fen}
            orientation={boardOrientation}
            onFenChange={(fen) => updateLesson({ fen })}
            onOrientationChange={(o) => updateLesson({ parametri: { orientamento_scacchiera: o } })}
            onNext={() => goTo('task')}
          />
        )}

        {currentPage === 'task' && (
          <WizardStepTask
            onChoose={handleTaskChosen}
            stepNumber={totalSteps + 1}
            onBack={totalSteps === 0 ? () => goTo('position') : undefined}
          />
        )}

        {currentPage === 'question' && buildingStep && (
          <WizardStepQuestion
            step={buildingStep}
            fen={currentFen}
            boardOrientation={boardOrientation}
            onUpdate={updateBuildingStep}
            onNext={() => goTo('visuals')}
            onBack={() => goTo('task')}
          />
        )}

        {currentPage === 'visuals' && buildingStep && (
          <WizardStepVisuals
            step={buildingStep}
            fen={currentFen}
            boardOrientation={boardOrientation}
            onUpdate={updateBuildingStep}
            onNext={() => goTo('feedback')}
            onBack={() => goTo('question')}
            onSkip={() => goTo('feedback')}
          />
        )}

        {currentPage === 'feedback' && buildingStep && (
          <WizardStepFeedback
            step={buildingStep}
            onUpdate={updateBuildingStep}
            onNext={() => goTo('extras')}
            onBack={() => goTo('visuals')}
          />
        )}

        {currentPage === 'extras' && (
          <WizardStepExtras
            lessonData={lessonData}
            step={buildingStep}
            onUpdateLesson={updateLesson}
            onUpdateStep={updateBuildingStep}
            onNext={() => goTo('continue')}
            onBack={() => goTo('feedback')}
            onSkip={() => goTo('continue')}
          />
        )}

        {currentPage === 'continue' && (
          <WizardStepContinue
            stepsCount={totalSteps}
            currentStep={buildingStep}
            onAddAnother={handleAddAnotherStep}
            onFinish={handleFinishLesson}
            onBack={() => goTo('extras')}
          />
        )}

        {currentPage === 'review' && (
          <WizardStepReview
            lessonData={lessonData}
            onUpdateLesson={updateLesson}
            onSave={handleSave}
            onExport={handleExport}
            onClose={onClose}
            onEditStep={(idx) => {
              // Per ora torna alla task per aggiungerne di nuovi
              goTo('task')
            }}
            onBack={() => goTo('continue')}
          />
        )}
      </div>
    </div>
  )
}

export default LessonWizard
