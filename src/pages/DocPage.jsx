import { useState, useEffect, useMemo } from 'react'
import { marked } from 'marked'
import roadmapRaw from '../../ROADMAP.md?raw'
import './DocPage.css'

// Split the document into sections by ## headings
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
    if (current) {
      current.body += line + '\n'
    }
  }
  if (current) sections.push(current)
  return sections
}

// Extract the intro (everything before the first ##)
function parseIntro(md) {
  const idx = md.indexOf('\n## ')
  if (idx === -1) return md
  return md.substring(0, idx)
}

export default function DocPage() {
  const [activeSection, setActiveSection] = useState(0)

  const intro = useMemo(() => parseIntro(roadmapRaw), [])
  const sections = useMemo(() => parseSections(roadmapRaw), [])

  // Render markdown to HTML (sanitization not needed — content is our own ROADMAP.md)
  const introHtml = useMemo(() => marked.parse(intro), [intro])
  const sectionHtml = useMemo(
    () => sections.map(s => marked.parse(s.body)),
    [sections]
  )

  // Clean section titles for display (remove numbering like "1. ")
  const cleanTitle = (title) => title.replace(/^\d+\.\s*/, '')

  return (
    <div className="doc-page">
      <div className="doc-layout">
        {/* Sidebar / Table of contents */}
        <nav className="doc-sidebar">
          <h2>Indice</h2>
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
        </nav>

        {/* Main content */}
        <article className="doc-content">
          {activeSection === -1 ? (
            <div
              className="doc-prose"
              dangerouslySetInnerHTML={{ __html: introHtml }}
            />
          ) : (
            <>
              <h2 className="doc-section-title">
                {sections[activeSection]?.title}
              </h2>
              <div
                className="doc-prose"
                dangerouslySetInnerHTML={{ __html: sectionHtml[activeSection] }}
              />
            </>
          )}
        </article>
      </div>
    </div>
  )
}
