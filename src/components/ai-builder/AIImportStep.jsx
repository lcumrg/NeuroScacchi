import { useState } from 'react'
import { validateLesson } from '../../utils/lessonValidator'
import promptRaw from '../../../docs/prompt-crea-lezione.md?raw'

// Estrai il prompt dopo il separatore ---
const extractPrompt = () => {
  const parts = promptRaw.split('---')
  return parts.length > 1 ? parts.slice(1).join('---').trim() : promptRaw
}

function AIImportStep({ onImport }) {
  const [jsonInput, setJsonInput] = useState('')
  const [parseError, setParseError] = useState('')
  const [validationResult, setValidationResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(extractPrompt())
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback per browser senza clipboard API
      const textarea = document.createElement('textarea')
      textarea.value = extractPrompt()
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleParse = () => {
    setParseError('')
    setValidationResult(null)

    const trimmed = jsonInput.trim()
    if (!trimmed) {
      setParseError('Incolla il JSON generato dall\'IA')
      return
    }

    // Prova a estrarre JSON da markdown code block
    let jsonStr = trimmed
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim()
    }

    let parsed
    try {
      parsed = JSON.parse(jsonStr)
    } catch (e) {
      setParseError(`JSON non valido: ${e.message}`)
      return
    }

    // Valida con il validator esistente
    const result = validateLesson(parsed)
    setValidationResult(result)

    if (result.valid) {
      // Aggiungi stato bozza
      parsed.stato = 'bozza_ia'
      onImport(parsed, result)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setJsonInput(ev.target.result)
      setParseError('')
      setValidationResult(null)
    }
    reader.readAsText(file)
  }

  return (
    <div className="wizard-page">
      <div className="wizard-page-title">Costruisci con IA</div>
      <p className="wizard-page-subtitle">
        Usa un'intelligenza artificiale per creare una bozza di lezione, poi rivedila qui passo passo prima di pubblicarla.
      </p>

      {/* Step 1: Copia prompt */}
      <div className="ai-import-section">
        <div className="ai-import-step-header">
          <span className="ai-import-step-num">1</span>
          <div>
            <strong>Copia il prompt per l'IA</strong>
            <p>Copia questo prompt e incollalo in una chat con Claude, ChatGPT o un'altra IA. Rispondi alle sue domande per costruire la lezione.</p>
          </div>
        </div>
        <button className={`ai-copy-prompt-btn ${copied ? 'copied' : ''}`} onClick={handleCopyPrompt}>
          {copied ? 'Copiato!' : 'Copia prompt'}
        </button>
      </div>

      {/* Step 2: Incolla JSON */}
      <div className="ai-import-section">
        <div className="ai-import-step-header">
          <span className="ai-import-step-num">2</span>
          <div>
            <strong>Incolla il JSON generato</strong>
            <p>Quando l'IA ti ha dato il JSON finale, incollalo qui sotto (funziona anche se e' dentro un blocco di codice).</p>
          </div>
        </div>

        <textarea
          className="wizard-textarea ai-json-textarea"
          value={jsonInput}
          onChange={(e) => { setJsonInput(e.target.value); setParseError(''); setValidationResult(null) }}
          placeholder='{"id": "...", "titolo": "...", "tipo_modulo": "intent", ...}'
          rows={12}
        />

        <div className="ai-import-actions">
          <label className="ai-upload-label">
            <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
            oppure carica un file .json
          </label>
          <button className="wizard-btn-primary" onClick={handleParse} disabled={!jsonInput.trim()}>
            Importa e Rivedi
          </button>
        </div>

        {/* Errore di parsing */}
        {parseError && (
          <div className="wizard-error" style={{ marginTop: 12 }}>{parseError}</div>
        )}

        {/* Risultato validazione con errori */}
        {validationResult && !validationResult.valid && (
          <div className="ai-validation-result">
            <div className="ai-validation-title error">
              Errori da correggere prima di procedere:
            </div>
            {validationResult.errors.map((e, i) => (
              <div key={i} className="wizard-error">{e}</div>
            ))}
            {validationResult.warnings.length > 0 && (
              <>
                <div className="ai-validation-title warning" style={{ marginTop: 12 }}>Avvisi (non bloccanti):</div>
                {validationResult.warnings.map((w, i) => (
                  <div key={i} className="ai-validation-warning">{w}</div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AIImportStep
