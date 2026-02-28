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

  Modalita' fromAI:
  - I dati sono pre-compilati da un JSON generato dall'IA
  - Si parte da position, poi si va direttamente a review
  - Da review si possono modificare o aggiungere step
  - Il flusso di editing step: question → visuals → feedback → torna a review
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

function LessonWizard({ onSave, onClose, editLesson = null, fromAI = false }) {
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
  const getStartPage = () => {
    if (fromAI) return 'position'
    if (editLesson) return 'review'
    return 'position'
  }
  const [currentPage, setCurrentPage] = useState(getStartPage)

  // Step corrente in costruzione (per sequenze multi-step)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // Stato per capire se stiamo costruendo uno step di una sequenza
  const [buildingStep, setBuildingStep] = useState(null)

  // Editing step: indice dello step esistente che stiamo modificando (null = nuovo)
  const [editStepIndex, setEditStepIndex] = useState(null)

  // Quando true, dopo feedback torniamo direttamente a review (skip extras/continue)
  const [returnToReview, setReturnToReview] = useState(false)

  // FEN per il prossimo step (dopo la transizione posizione con mosse avversario)
  const [nextStepFen, setNextStepFen] = useState(null)

  // Se true, la pagina Continue mostra direttamente la board di avanzamento posizione
  const [continueDirectAdvance, setContinueDirectAdvance] = useState(false)

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

  // Quando il coach sceglie il tipo di task per un nuovo step (o conferma/cambia tipo in editing)
  const handleTaskChosen = (taskType) => {
    // Se stiamo editando uno step esistente e il tipo e' lo stesso, vai avanti senza resettare
    if (buildingStep && editStepIndex !== null && buildingStep.tipo_step === taskType) {
      goTo('question')
      return
    }

    // Se stiamo editando ma il tipo cambia, mantieni FEN e visivi ma resetta i campi specifici
    const baseFen = buildingStep?.fen_aggiornata || nextStepFen || lessonData.fen
    const baseChunks = buildingStep?.mostra_chunk_visivo || []
    const baseArrows = buildingStep?.frecce_pattern || []
    const baseTransizione = buildingStep?.transizione || undefined

    const stepNumber = editStepIndex !== null
      ? (editStepIndex + 1)
      : ((lessonData.steps || []).length + 1)

    const newStep = {
      numero: stepNumber,
      tipo_step: taskType,
      fen_aggiornata: baseFen,
      mostra_chunk_visivo: baseChunks,
      frecce_pattern: baseArrows,
      feedback: '',
      feedback_negativo: ''
    }

    if (baseTransizione) newStep.transizione = baseTransizione

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
    setNextStepFen(null)
    goTo('question')
  }

  // Finalizza lo step corrente e aggiungilo/aggiornalo nella lezione
  const finalizeCurrentStep = () => {
    if (!buildingStep) return

    let newSteps
    if (editStepIndex !== null) {
      // Stiamo modificando uno step esistente
      newSteps = [...(lessonData.steps || [])]
      newSteps[editStepIndex] = { ...buildingStep, numero: editStepIndex + 1 }
    } else {
      // Stiamo aggiungendo uno step nuovo
      newSteps = [...(lessonData.steps || []), buildingStep]
    }

    const tipoModulo = inferTipoModulo(newSteps)

    // Se e' il primo step e tipo singolo, copia i dati anche a livello root
    if (newSteps.length === 1 && ['intent', 'detective', 'candidate'].includes(tipoModulo)) {
      const rootUpdates = { steps: newSteps, tipo_modulo: tipoModulo }
      if (tipoModulo === 'intent') {
        rootUpdates.domanda = newSteps[0].domanda
        rootUpdates.opzioni_risposta = newSteps[0].opzioni_risposta
        rootUpdates.risposta_corretta = newSteps[0].risposta_corretta
        rootUpdates.mosse_consentite = newSteps[0].mosse_consentite
        rootUpdates.mosse_corrette = newSteps[0].mosse_corrette
      } else if (tipoModulo === 'detective') {
        rootUpdates.modalita_detective = {
          domanda: newSteps[0].domanda,
          risposta_corretta_casa: newSteps[0].risposta_corretta_casa,
          feedback_positivo: newSteps[0].feedback_positivo || newSteps[0].feedback || '',
          feedback_negativo: newSteps[0].feedback_negativo || ''
        }
      } else if (tipoModulo === 'candidate') {
        rootUpdates.mosse_candidate = newSteps[0].mosse_candidate
        rootUpdates.mossa_migliore = newSteps[0].mossa_migliore
        rootUpdates.parametri = { ...lessonData.parametri, num_candidate: newSteps[0].num_candidate || 2 }
      }
      updateLesson(rootUpdates)
    } else {
      updateLesson({ steps: newSteps, tipo_modulo: tipoModulo })
    }

    setCurrentStepIndex(newSteps.length - 1)
    setBuildingStep(null)
    setEditStepIndex(null)
  }

  // "Vuoi aggiungere un altro step?" → Si (con FEN aggiornata dalla transizione)
  const handleAddAnotherStep = (transitionFen, transitionMoves) => {
    if (buildingStep && transitionMoves?.length > 0) {
      buildingStep.transizione = { mosse: transitionMoves, fen_risultante: transitionFen }
    }
    finalizeCurrentStep()
    setNextStepFen(transitionFen || null)
    setContinueDirectAdvance(false)
    goTo('task')
  }

  // "No, la lezione e' finita" → vai al review
  const handleFinishLesson = () => {
    finalizeCurrentStep()
    goTo('review')
  }

  // Dopo feedback, finalizza e torna a review (usato quando si edita/aggiunge da review)
  const handleFinishAndReturnToReview = () => {
    finalizeCurrentStep()
    setReturnToReview(false)
    goTo('review')
  }

  // Edit step: carica uno step esistente nel buildingStep e parti da task (scelta tipo)
  const handleEditStep = (idx) => {
    const step = lessonData.steps[idx]
    if (!step) return
    setBuildingStep({ ...JSON.parse(JSON.stringify(step)) })
    setEditStepIndex(idx)
    setReturnToReview(true)
    goTo('task')
  }

  // Delete step
  const handleDeleteStep = (idx) => {
    const newSteps = (lessonData.steps || []).filter((_, i) => i !== idx).map((s, i) => ({ ...s, numero: i + 1 }))
    const tipoModulo = inferTipoModulo(newSteps)
    updateLesson({ steps: newSteps, tipo_modulo: tipoModulo })
  }

  // Add step from review: passa per la transizione posizione prima di task
  const handleAddStepFromReview = () => {
    setReturnToReview(true)
    setEditStepIndex(null)
    setContinueDirectAdvance(true)
    goTo('continue')
  }

  // Edit transizione tra step[idx] e step[idx+1]: riapre la board di avanzamento
  const [editingTransitionIdx, setEditingTransitionIdx] = useState(null)

  const handleEditTransition = (idx) => {
    setEditingTransitionIdx(idx)
    setContinueDirectAdvance(true)
    setReturnToReview(false)
    goTo('continue')
  }

  // Callback specifica per salvare la transizione editata
  const handleSaveTransition = (transitionFen, transitionMoves) => {
    if (editingTransitionIdx !== null) {
      const newSteps = [...(lessonData.steps || [])]
      // Aggiorna la transizione sullo step di partenza
      newSteps[editingTransitionIdx] = {
        ...newSteps[editingTransitionIdx],
        transizione: { mosse: transitionMoves || [], fen_risultante: transitionFen }
      }
      // Aggiorna la FEN dello step successivo
      if (editingTransitionIdx + 1 < newSteps.length) {
        newSteps[editingTransitionIdx + 1] = {
          ...newSteps[editingTransitionIdx + 1],
          fen_aggiornata: transitionFen
        }
      }
      updateLesson({ steps: newSteps })
      setEditingTransitionIdx(null)
      setContinueDirectAdvance(false)
      goTo('review')
    }
  }

  // Salva la lezione
  const handleSave = (titleAndMeta) => {
    const finalLesson = { ...lessonData, ...titleAndMeta }
    if (!finalLesson.id) {
      finalLesson.id = finalLesson.titolo
        .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `lezione_${Date.now()}`
    }

    // Se da IA, segna come validata
    if (fromAI) {
      finalLesson.stato = 'validata'
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

  // Dove va il bottone "Avanti" dalla pagina position
  const handlePositionNext = () => {
    // Se da IA o editing con step esistenti, vai direttamente a review
    if ((fromAI || editLesson) && (lessonData.steps || []).length > 0) {
      goTo('review')
    } else {
      goTo('task')
    }
  }

  // Dove va il bottone "Avanti" dalla pagina feedback
  const handleFeedbackNext = () => {
    if (returnToReview) {
      handleFinishAndReturnToReview()
    } else {
      goTo('extras')
    }
  }

  // FEN corrente per il board (usa lo step in costruzione se presente)
  const currentFen = buildingStep?.fen_aggiornata || lessonData.fen
  const boardOrientation = lessonData.parametri?.orientamento_scacchiera || 'white'

  // Progresso visuale
  const pageIndex = WIZARD_PAGES.indexOf(currentPage)
  const totalSteps = (lessonData.steps || []).length + (buildingStep ? 1 : 0)

  // Header label per modalita' AI
  const headerLabel = fromAI ? 'Revisione lezione IA' : (editLesson ? 'Modifica lezione' : null)

  return (
    <div className="lesson-wizard">
      {/* Header */}
      <div className="wizard-header">
        <button className="wizard-back-btn" onClick={onClose}>
          &#8592; {fromAI ? 'Torna all\'importazione' : 'Torna alle lezioni'}
        </button>
        {headerLabel && <div className="wizard-header-label">{headerLabel}</div>}
        <div className="wizard-progress">
          {WIZARD_PAGES.map((page, i) => (
            <div key={page}
              className={`wizard-progress-dot ${i <= pageIndex ? 'active' : ''} ${page === currentPage ? 'current' : ''} ${i < pageIndex ? 'clickable' : ''}`}
              onClick={() => {
                if (i < pageIndex) {
                  if (['question', 'visuals', 'feedback'].includes(page) && !buildingStep) return
                  goTo(page)
                }
              }}
            >
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
            onNext={handlePositionNext}
          />
        )}

        {currentPage === 'task' && (
          <WizardStepTask
            onChoose={handleTaskChosen}
            stepNumber={editStepIndex !== null ? editStepIndex + 1 : totalSteps + 1}
            currentType={editStepIndex !== null ? buildingStep?.tipo_step : undefined}
            onBack={returnToReview ? () => { setBuildingStep(null); setEditStepIndex(null); setReturnToReview(false); goTo('review') } : (totalSteps === 0 ? () => goTo('position') : undefined)}
          />
        )}

        {currentPage === 'question' && buildingStep && (
          <WizardStepQuestion
            step={buildingStep}
            fen={currentFen}
            boardOrientation={boardOrientation}
            onUpdate={updateBuildingStep}
            onNext={() => goTo('visuals')}
            onBack={returnToReview ? () => { setBuildingStep(null); setEditStepIndex(null); setReturnToReview(false); goTo('review') } : () => goTo('task')}
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
            onNext={handleFeedbackNext}
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
            fen={editingTransitionIdx !== null
              ? (lessonData.steps?.[editingTransitionIdx]?.fen_aggiornata || lessonData.fen)
              : (buildingStep?.fen_aggiornata || (lessonData.steps?.length > 0 ? lessonData.steps[lessonData.steps.length - 1].fen_aggiornata : null) || lessonData.fen)}
            boardOrientation={boardOrientation}
            onAddAnother={editingTransitionIdx !== null ? handleSaveTransition : handleAddAnotherStep}
            onFinish={handleFinishLesson}
            onBack={continueDirectAdvance
              ? () => { setContinueDirectAdvance(false); setReturnToReview(false); setEditingTransitionIdx(null); goTo('review') }
              : () => goTo('extras')}
            directAdvance={continueDirectAdvance}
          />
        )}

        {currentPage === 'review' && (
          <WizardStepReview
            lessonData={lessonData}
            onUpdateLesson={updateLesson}
            onSave={handleSave}
            onExport={handleExport}
            onClose={onClose}
            onEditStep={handleEditStep}
            onDeleteStep={handleDeleteStep}
            onAddStep={handleAddStepFromReview}
            onEditTransition={handleEditTransition}
            onBack={fromAI ? () => goTo('position') : () => goTo('continue')}
            fromAI={fromAI}
          />
        )}
      </div>
    </div>
  )
}

export default LessonWizard
