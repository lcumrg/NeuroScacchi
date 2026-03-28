import { useState, useCallback, useEffect } from 'react'
import Chessboard from '../components/Chessboard.jsx'
import { processImage } from '../engine/kbIngestion.js'
import { saveChunk, listChunks, deleteChunk } from '../engine/kbStore.js'
import { INITIAL_FEN } from '../engine/chessService.js'
import './IngestionPage.css'

export default function IngestionPage() {
  // Upload state
  const [imageData, setImageData] = useState(null)    // { base64, mimeType, preview }
  const [dragOver, setDragOver] = useState(false)

  // Meta fields
  const [fonteNome, setFonteNome] = useState('')
  const [fontePagina, setFontePagina] = useState('')
  const [fonteAutore, setFonteAutore] = useState('')

  // Processing state
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  // Extracted chunks (preview before saving)
  const [chunks, setChunks] = useState([])  // array of { chunk, error, saved, moveIndex }

  // Saved chunks in DB
  const [savedChunks, setSavedChunks] = useState([])
  const [loadingSaved, setLoadingSaved] = useState(false)

  // Load saved chunks on mount
  useEffect(() => {
    loadSavedChunks()
  }, [])

  async function loadSavedChunks() {
    setLoadingSaved(true)
    const list = await listChunks()
    setSavedChunks(list)
    setLoadingSaved(false)
  }

  // ─── Image handling ─────────────────────────────────────────────

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    setError(null)
    setChunks([])

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      const base64 = dataUrl.split(',')[1]
      setImageData({
        base64,
        mimeType: file.type,
        preview: dataUrl,
      })
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => setDragOver(false), [])

  // ─── Extract from image ─────────────────────────────────────────

  async function handleExtract() {
    if (!imageData) return
    setProcessing(true)
    setError(null)
    setChunks([])

    try {
      const meta = {
        fonte: {
          nome: fonteNome || undefined,
          pagina: fontePagina ? parseInt(fontePagina, 10) : undefined,
          autore: fonteAutore || undefined,
        },
      }

      const results = await processImage(imageData.base64, imageData.mimeType, meta)
      setChunks(results.map(r => ({ ...r, saved: false, moveIndex: r.chunk.allFens ? r.chunk.allFens.length - 1 : 0 })))
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  // ─── Save / discard chunk ───────────────────────────────────────

  async function handleSaveChunk(index) {
    const item = chunks[index]
    if (!item || item.saved) return

    const { chunk } = item
    // Remove allFens and parsedSans before saving (only for preview)
    const toSave = { ...chunk }
    delete toSave.allFens
    delete toSave.parsedSans

    const result = await saveChunk(toSave)
    if (result.ok) {
      setChunks(prev => prev.map((c, i) =>
        i === index ? { ...c, saved: true, chunk: { ...c.chunk, id: result.id } } : c
      ))
      loadSavedChunks()
    } else {
      setError(`Errore salvataggio: ${result.error}`)
    }
  }

  function handleDiscardChunk(index) {
    setChunks(prev => prev.filter((_, i) => i !== index))
  }

  async function handleDeleteSaved(id) {
    const result = await deleteChunk(id)
    if (result.ok) {
      setSavedChunks(prev => prev.filter(c => c.id !== id))
    }
  }

  // ─── Navigate moves in chunk preview ─────────────────────────────

  function setMoveIndex(chunkIndex, newIndex) {
    setChunks(prev => prev.map((c, i) =>
      i === chunkIndex ? { ...c, moveIndex: newIndex } : c
    ))
  }

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="ingestion-page">
      <h1>Knowledge Base — Ingestion</h1>
      <p className="subtitle">
        Carica foto dal manuale di scacchi. Vision estrae la conoscenza, chessops calcola le posizioni.
      </p>

      {/* Upload area */}
      <div
        className={`ingestion-upload ${dragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input
          id="file-input"
          type="file"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {imageData ? (
          <img src={imageData.preview} alt="Preview" className="ingestion-preview-image" />
        ) : (
          <p className="upload-label">
            Trascina una foto qui oppure <strong>clicca per selezionare</strong>
          </p>
        )}
      </div>

      {/* Meta fields */}
      <div className="ingestion-meta">
        <label>
          Fonte (libro)
          <input
            type="text"
            value={fonteNome}
            onChange={(e) => setFonteNome(e.target.value)}
            placeholder="es. Il grande libro della Spagnola"
          />
        </label>
        <label>
          Pagina
          <input
            type="number"
            value={fontePagina}
            onChange={(e) => setFontePagina(e.target.value)}
            placeholder="47"
          />
        </label>
        <label>
          Autore
          <input
            type="text"
            value={fonteAutore}
            onChange={(e) => setFonteAutore(e.target.value)}
            placeholder="es. Karpov"
          />
        </label>
      </div>

      {/* Extract button */}
      <button
        className="btn-extract"
        onClick={handleExtract}
        disabled={!imageData || processing}
      >
        {processing ? 'Estrazione in corso...' : 'Estrai conoscenza'}
      </button>

      {/* Status */}
      {processing && (
        <div className="ingestion-status">
          <div className="ingestion-spinner" />
          Vision sta analizzando la pagina...
        </div>
      )}

      {error && (
        <div className="ingestion-status error">
          {error}
        </div>
      )}

      {/* Extracted chunks preview */}
      {chunks.length > 0 && (
        <div className="ingestion-chunks">
          <h2>Chunk estratti ({chunks.length})</h2>
          {chunks.map((item, index) => (
            <ChunkCard
              key={index}
              item={item}
              index={index}
              onSave={handleSaveChunk}
              onDiscard={handleDiscardChunk}
              moveIndex={item.moveIndex}
              onMoveIndexChange={(newIdx) => setMoveIndex(index, newIdx)}
            />
          ))}
        </div>
      )}

      {/* Saved chunks */}
      <div className="saved-chunks-section">
        <h2>Chunk salvati {loadingSaved ? '...' : `(${savedChunks.length})`}</h2>
        {savedChunks.length === 0 && !loadingSaved && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Nessun chunk nella Knowledge Base.
          </p>
        )}
        {savedChunks.map(chunk => (
          <div key={chunk.id} className="saved-chunk-row">
            <div className="chunk-info">
              <strong>{chunk.apertura}</strong>
              {chunk.variante && ` — ${chunk.variante}`}
              {chunk.fonte?.pagina && ` (p.${chunk.fonte.pagina})`}
            </div>
            <div className="chunk-fens">
              {chunk.fens?.length || 0} FEN
            </div>
            <button onClick={() => handleDeleteSaved(chunk.id)}>
              Elimina
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── ChunkCard component ──────────────────────────────────────────

function ChunkCard({ item, index, onSave, onDiscard, moveIndex, onMoveIndexChange }) {
  const { chunk, error, saved } = item
  const allFens = chunk.allFens || []
  const currentFen = allFens[moveIndex] || chunk.fens?.[0] || INITIAL_FEN
  const totalMoves = allFens.length

  return (
    <div className={`chunk-card ${error ? 'has-error' : ''} ${saved ? 'saved' : ''}`}>
      <div className="chunk-header">
        <h3>
          {chunk.apertura || 'Apertura sconosciuta'}
          {chunk.variante && ` — ${chunk.variante}`}
        </h3>
        <span className="chunk-badge">{chunk.livello || 'tutti'}</span>
        {saved && <span className="chunk-badge" style={{ background: 'var(--color-success, #16a34a)', color: 'white' }}>Salvato</span>}
      </div>

      <div className="chunk-body">
        {/* Board + move navigation */}
        <div className="chunk-board">
          <Chessboard
            fen={currentFen}
            interactive={false}
            viewOnly={true}
          />
          {totalMoves > 1 && (
            <div className="move-nav">
              <button onClick={() => onMoveIndexChange(0)} disabled={moveIndex === 0}>|&lt;</button>
              <button onClick={() => onMoveIndexChange(Math.max(0, moveIndex - 1))} disabled={moveIndex === 0}>&lt;</button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '4rem', textAlign: 'center' }}>
                {moveIndex}/{totalMoves - 1}
              </span>
              <button onClick={() => onMoveIndexChange(Math.min(totalMoves - 1, moveIndex + 1))} disabled={moveIndex >= totalMoves - 1}>&gt;</button>
              <button onClick={() => onMoveIndexChange(totalMoves - 1)} disabled={moveIndex >= totalMoves - 1}>&gt;|</button>
            </div>
          )}
        </div>

        {/* Chunk details */}
        <div className="chunk-details">
          <h4>Sequenza mosse</h4>
          <div className="moves-raw">{chunk.sequenzaMosse || '—'}</div>

          {chunk.principiStrategici?.length > 0 && (
            <>
              <h4>Principi strategici</h4>
              <ul>
                {chunk.principiStrategici.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </>
          )}

          {chunk.piani && (
            <>
              <h4>Piani</h4>
              {chunk.piani.bianco && <p><strong>Bianco:</strong> {chunk.piani.bianco}</p>}
              {chunk.piani.nero && <p><strong>Nero:</strong> {chunk.piani.nero}</p>}
            </>
          )}

          {chunk.erroriTipici?.length > 0 && (
            <>
              <h4>Errori tipici</h4>
              <ul>
                {chunk.erroriTipici.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </>
          )}

          {chunk.concettiChiave?.length > 0 && (
            <>
              <h4>Concetti chiave</h4>
              <p>{chunk.concettiChiave.join(', ')}</p>
            </>
          )}
        </div>
      </div>

      {error && <div className="chunk-error">Errore calcolo FEN: {error}</div>}

      <div className="chunk-actions">
        {!saved && (
          <>
            <button
              className="btn-save"
              onClick={() => onSave(index)}
              disabled={!chunk.fens?.length}
            >
              Salva nella KB
            </button>
            <button className="btn-discard" onClick={() => onDiscard(index)}>
              Scarta
            </button>
          </>
        )}
      </div>
    </div>
  )
}
