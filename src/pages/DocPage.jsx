import { useState, useMemo } from 'react'
import { marked } from 'marked'
import roadmapRaw from '../../ROADMAP.md?raw'
import architetturaPipelineRaw from '../../docs/architettura-pipeline-lezioni.md?raw'
import analisiPiattaformeRaw from '../../docs/analisi-piattaforme-concorrenti.md?raw'
import analisiApertureRaw from '../../docs/analisi-pipeline-aperture.md?raw'
import designUxRaw from '../../docs/design-ux-bambini.md?raw'
import progettoDesignProposteRaw from '../../docs/progetto-design-proposte.md?raw'
import './DocPage.css'

const DOCS = [
  {
    id: 'roadmap',
    label: 'Roadmap',
    group: 'Progetto',
    raw: roadmapRaw,
  },
  {
    id: 'progetto-design-proposte',
    label: 'Proposte design PROGETTO',
    group: 'Progetto',
    raw: progettoDesignProposteRaw,
  },
  {
    id: 'architettura-pipeline',
    label: 'Architettura pipeline',
    group: 'Architettura',
    raw: architetturaPipelineRaw,
  },
  {
    id: 'analisi-piattaforme',
    label: 'Analisi piattaforme',
    group: 'Analisi & Ricerca',
    raw: analisiPiattaformeRaw,
  },
  {
    id: 'analisi-pipeline-aperture',
    label: 'Pipeline aperture',
    group: 'Analisi & Ricerca',
    raw: analisiApertureRaw,
  },
  {
    id: 'design-ux-bambini',
    label: 'Design & UX bambini',
    group: 'Analisi & Ricerca',
    raw: designUxRaw,
  },
]

function parseSections(md) {
  const lines = md.split('\n')
  const sections = []
  let current = null
  for (const line of lines) {
    const h2Match = line.match(/^## (.+)/)
    if (h2Match) {
      if (current) sections.push(current)
      current = { title: h2Match[1].trim(), body: '' }
      continue
    }
    if (current) current.body += line + '\n'
  }
  if (current) sections.push(current)
  return sections
}

function parseIntro(md) {
  const idx = md.indexOf('\n## ')
  if (idx === -1) return md
  return md.substring(0, idx)
}

const cleanTitle = (title) => title.replace(/^\d+\.\s*/, '')

// Group docs by group label
const GROUPS = [...new Set(DOCS.map(d => d.group))]

export default function DocPage() {
  const [activeDocId, setActiveDocId] = useState(DOCS[0].id)
  const [activeSection, setActiveSection] = useState(-1)

  const activeDoc = DOCS.find(d => d.id === activeDocId)

  const intro = useMemo(() => parseIntro(activeDoc.raw), [activeDoc])
  const sections = useMemo(() => parseSections(activeDoc.raw), [activeDoc])
  const introHtml = useMemo(() => marked.parse(intro), [intro])
  const sectionHtml = useMemo(() => sections.map(s => marked.parse(s.body)), [sections])

  function switchDoc(docId) {
    setActiveDocId(docId)
    setActiveSection(-1)
  }

  return (
    <div className="doc-page">
      <div className="doc-layout">
        {/* Sidebar */}
        <nav className="doc-sidebar">
          {GROUPS.map(group => (
            <div key={group} className="doc-sidebar-group">
              <h2>{group}</h2>
              <ul className="doc-toc">
                {DOCS.filter(d => d.group === group).map(doc => (
                  <li key={doc.id}>
                    <button
                      className={activeDocId === doc.id && activeSection === -1 ? 'active' : activeDocId === doc.id ? 'doc-active' : ''}
                      onClick={() => switchDoc(doc.id)}
                    >
                      {doc.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {sections.length > 0 && (
            <div className="doc-sidebar-group">
              <h2>Sezioni</h2>
              <ul className="doc-toc">
                <li>
                  <button
                    className={activeSection === -1 ? 'active' : ''}
                    onClick={() => setActiveSection(-1)}
                  >
                    Introduzione
                  </button>
                </li>
                {sections.map((s, i) => (
                  <li key={i}>
                    <button
                      className={activeSection === i ? 'active' : ''}
                      onClick={() => setActiveSection(i)}
                    >
                      {cleanTitle(s.title)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>

        {/* Content */}
        <article className="doc-content">
          {activeSection === -1 ? (
            <div className="doc-prose" dangerouslySetInnerHTML={{ __html: introHtml }} />
          ) : (
            <>
              <h2 className="doc-section-title">{sections[activeSection]?.title}</h2>
              <div className="doc-prose" dangerouslySetInnerHTML={{ __html: sectionHtml[activeSection] }} />
            </>
          )}
        </article>
      </div>
    </div>
  )
}
