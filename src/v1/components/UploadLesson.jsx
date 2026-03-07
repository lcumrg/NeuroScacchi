import { useState } from 'react'
import { validateLesson } from '../utils/lessonValidator'
import './UploadLesson.css'

function UploadLesson({ onUpload, onClose }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [validation, setValidation] = useState(null)

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result)
        const validationResult = validateLesson(json)
        
        setFile(selectedFile)
        setPreview(json)
        setValidation(validationResult)
      } catch (err) {
        alert('File JSON non valido: ' + err.message)
      }
    }
    reader.readAsText(selectedFile)
  }

  const handleUpload = () => {
    if (validation?.valid && preview) {
      onUpload(preview)
      onClose()
    }
  }

  return (
    <div className="upload-overlay" onClick={onClose}>
      <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="upload-header">
          <h3>📤 Carica Nuova Lezione</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="upload-content">
          <input
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="file-input"
            id="lesson-upload"
          />
          <label htmlFor="lesson-upload" className="file-label">
            {file ? `📄 ${file.name}` : '📁 Seleziona file JSON'}
          </label>

          {validation && (
            <div className={`validation-result ${validation.valid ? 'valid' : 'invalid'}`}>
              {validation.valid ? (
                <div className="validation-success">
                  ✅ File valido! <br />
                  <strong>{preview?.titolo}</strong> ({preview?.tipo_modulo})
                </div>
              ) : (
                <div className="validation-errors">
                  ❌ Errori trovati:
                  <ul>
                    {validation.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
              
              {validation.warnings.length > 0 && (
                <div className="validation-warnings">
                  ⚠️ Avvisi:
                  <ul>
                    {validation.warnings.map((warn, i) => <li key={i}>{warn}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="upload-actions">
          <button className="btn-cancel-upload" onClick={onClose}>Annulla</button>
          <button 
            className="btn-confirm-upload"
            onClick={handleUpload}
            disabled={!validation?.valid}
          >
            Carica Lezione
          </button>
        </div>
      </div>
    </div>
  )
}

export default UploadLesson
