import { useState } from 'react'
import {
  meta, numeri, visione, metodo, intelligenze,
  fasi, stack, decisioniChiave, prioritaImmediate, SEZIONI_PDF,
} from '../config/progetto.js'
import './ProgettoPage.css'

const CAT_LABEL = {
  frontend: 'Frontend',
  engine: 'Engine',
  backend: 'Backend',
  ai: 'Intelligenza Artificiale',
  data: 'Dati',
}

const STATO_LABEL = { done: 'Completata', next: 'Prossima', todo: 'Da fare' }

const faseDone = fasi.filter(f => f.stato === 'done').length
const faseNext = fasi.filter(f => f.stato === 'next').length
const progressPct = Math.round(((faseDone + faseNext * 0.5) / fasi.length) * 100)

// Raggruppa stack per categoria
const stackByCat = stack.reduce((acc, s) => {
  if (!acc[s.cat]) acc[s.cat] = []
  acc[s.cat].push(s)
  return acc
}, {})

export default function ProgettoPage() {
  const [fasiOpen, setFasiOpen] = useState(new Set(['f2bis']))
  const [pdfOpen, setPdfOpen] = useState(false)
  const [selected, setSelected] = useState(new Set(SEZIONI_PDF.map(s => s.id)))

  function toggleFase(id) {
    setFasiOpen(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function toggleSection(id) {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function selectAll() {
    setSelected(new Set(SEZIONI_PDF.map(s => s.id)))
  }

  function handlePrint() {
    const hidden = SEZIONI_PDF.filter(s => !selected.has(s.id))
    let style = null
    if (hidden.length) {
      style = document.createElement('style')
      style.id = '__pg-print-hide'
      style.media = 'print'
      style.textContent = hidden.map(s => `[data-section="${s.id}"]`).join(', ') + ' { display: none !important; }'
      document.head.appendChild(style)
    }
    setPdfOpen(false)
    setTimeout(() => {
      window.print()
      if (style) setTimeout(() => style.remove(), 500)
    }, 100)
  }

  return (
    <div className="pg">
      <div className="pg__inner">

        {/* ── HERO ── */}
        <div data-section="hero">
          <div className="pg__hero">
            <div className="pg__hero-badge">Progetto educativo · {meta.aggiornato}</div>
            <h1 className="pg__hero-title">
              {meta.nome.split(' ')[0]} <span>{meta.nome.split(' ')[1]}</span>
            </h1>
            <p className="pg__hero-tagline">{meta.visione || meta.tagline}</p>
            <p className="pg__hero-sub">{meta.sottotitolo}</p>

            <div className="pg__progress-wrap">
              <div className="pg__progress-label">
                <span>Avanzamento</span>
                <span>{faseDone} di {fasi.length} fasi completate</span>
              </div>
              <div className="pg__progress-bar">
                <div className="pg__progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            <div className="pg__numeri" style={{ marginTop: 24 }}>
              {numeri.map(n => (
                <div key={n.label} className="pg__numero">
                  <div className="pg__numero-valore">{n.valore}</div>
                  <div className="pg__numero-label">{n.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── VISIONE ── */}
        <div className="pg__section" data-section="visione">
          <div className="pg__section-label">01 — Visione</div>
          <h2 className="pg__section-title">Perché questo progetto</h2>
          <div className="pg__visione-grid">
            <div className="pg__visione-card">
              <div className="pg__visione-card-label">Il problema</div>
              <p>{visione.problema}</p>
            </div>
            <div className="pg__visione-card">
              <div className="pg__visione-card-label">La soluzione</div>
              <p>{visione.soluzione}</p>
            </div>
          </div>
          <div className="pg__principio">"{visione.principio}"</div>
          {visione.target && (
            <p style={{ marginTop: 14, fontSize: '0.82rem', color: '#9ca3af' }}>
              <strong style={{ color: '#6b7280' }}>Target:</strong> {visione.target}
            </p>
          )}
        </div>

        {/* ── METODO ── */}
        <div className="pg__section" data-section="metodo">
          <div className="pg__section-label">02 — Il metodo</div>
          <h2 className="pg__section-title">Intent · Detective · Candidate</h2>

          <div className="pg__ciclo" style={{ marginBottom: 24 }}>
            {metodo.ciclo.map((step, i) => (
              <span key={step} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="pg__ciclo-step">{step}</span>
                {i < metodo.ciclo.length - 1 && <span className="pg__ciclo-arrow">→</span>}
              </span>
            ))}
          </div>

          <div className="pg__attivita">
            {metodo.attivita.map(a => (
              <div key={a.nome} className="pg__attivita-card">
                <div className="pg__attivita-header" style={{ background: a.colore }}>
                  <div className="pg__attivita-nome">{a.nome}</div>
                </div>
                <div className="pg__attivita-body" style={{ background: a.bg }}>
                  {a.descrizione}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3 INTELLIGENZE ── */}
        <div className="pg__section" data-section="intelligenze">
          <div className="pg__section-label">03 — Architettura</div>
          <h2 className="pg__section-title">Le 3 intelligenze</h2>
          <div className="pg__intelligenze">
            {intelligenze.map(ig => (
              <div key={ig.nome} className="pg__intelligenza" style={{ '--ig-color': ig.colore }}>
                <style>{`[data-ig="${ig.nome}"]::before { background: ${ig.colore}; }`}</style>
                <div data-ig={ig.nome} className="pg__intelligenza" style={{ border: 'none', padding: 0, position: 'static' }}>
                  <span className="pg__intelligenza-icona" style={{ color: ig.colore }}>{ig.icona}</span>
                  <div className="pg__intelligenza-nome">{ig.nome}</div>
                  <div className="pg__intelligenza-ruolo" style={{ color: ig.colore }}>{ig.ruolo}</div>
                  <p className="pg__intelligenza-dettaglio">{ig.dettaglio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FASI ── */}
        <div className="pg__section" data-section="fasi">
          <div className="pg__section-label">04 — Roadmap</div>
          <h2 className="pg__section-title">Stato fasi</h2>
          <div className="pg__fasi">
            {fasi.map(f => (
              <div key={f.id} className={`pg__fase pg__fase--${f.stato}`}>
                <div className="pg__fase-header" onClick={() => toggleFase(f.id)}>
                  <span className="pg__fase-nome">{f.nome}</span>
                  <span className={`pg__fase-badge pg__fase-badge--${f.stato}`}>
                    {STATO_LABEL[f.stato]}
                  </span>
                  <span className="pg__fase-toggle">{fasiOpen.has(f.id) ? '▲' : '▼'}</span>
                </div>
                {fasiOpen.has(f.id) && (
                  <div className="pg__fase-items">
                    <ul>
                      {f.items.map(item => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── STACK ── */}
        <div className="pg__section" data-section="stack">
          <div className="pg__section-label">05 — Tecnologie</div>
          <h2 className="pg__section-title">Stack tecnologico</h2>
          <div className="pg__stack-cats">
            {Object.entries(stackByCat).map(([cat, items]) => (
              <div key={cat}>
                <div className="pg__stack-cat-label">{CAT_LABEL[cat] || cat}</div>
                <div className="pg__stack-pills">
                  {items.map(s => (
                    <div key={s.nome} className="pg__stack-pill">
                      <div className="pg__stack-pill-nome">{s.nome}</div>
                      <div className="pg__stack-pill-ruolo">{s.ruolo}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── DECISIONI ── */}
        <div className="pg__section" data-section="decisioni">
          <div className="pg__section-label">06 — Decisioni</div>
          <h2 className="pg__section-title">Scelte architetturali chiave</h2>
          <div className="pg__decisioni">
            {decisioniChiave.map(d => (
              <div key={d.titolo} className="pg__decisione">
                <div className="pg__decisione-top">
                  <div className="pg__decisione-titolo">{d.titolo}</div>
                  <span className={`pg__decisione-tipo pg__decisione-tipo--${d.tipo}`}>{d.tipo}</span>
                  <span className="pg__decisione-data">{d.data}</span>
                </div>
                <p className="pg__decisione-desc">{d.descrizione}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── PRIORITÀ ── */}
        <div className="pg__section" data-section="priorita">
          <div className="pg__section-label">07 — Prossimi passi</div>
          <h2 className="pg__section-title">Priorità immediate</h2>
          <div className="pg__priorita">
            {prioritaImmediate.map(p => (
              <div key={p.testo} className={`pg__priorita-item pg__priorita-item--${p.stato}`}>
                <div className="pg__priorita-dot" />
                <span className="pg__priorita-testo">{p.testo}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── PDF Button ── */}
      <button className="pg__pdf-btn" onClick={() => setPdfOpen(true)}>
        ↓ Esporta PDF
      </button>

      {/* ── PDF Panel ── */}
      {pdfOpen && (
        <div className="pg__pdf-overlay" onClick={e => e.target === e.currentTarget && setPdfOpen(false)}>
          <div className="pg__pdf-panel">
            <div className="pg__pdf-panel-title">Esporta PDF</div>
            <div className="pg__pdf-panel-sub">Seleziona le sezioni da includere</div>

            <button className="pg__pdf-sel-all" onClick={selectAll}>
              Seleziona tutto
            </button>

            <div className="pg__pdf-checks">
              {SEZIONI_PDF.map(s => (
                <label key={s.id} className="pg__pdf-check">
                  <input
                    type="checkbox"
                    checked={selected.has(s.id)}
                    onChange={() => toggleSection(s.id)}
                  />
                  {s.label}
                </label>
              ))}
            </div>

            <div className="pg__pdf-actions">
              <button className="pg__pdf-print" onClick={handlePrint}>
                Stampa / Salva PDF
              </button>
              <button className="pg__pdf-cancel" onClick={() => setPdfOpen(false)}>
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
