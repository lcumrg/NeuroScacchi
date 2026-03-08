// Componenti condivisi per la pagina Metodo

import { styles } from './metodoStyles'

export const STATUS = {
  solid:    { bg: '#2E7D32', border: '#A5D6A7', fill: '#E8F5E9', label: '#1B5E20' },
  open:     { bg: '#F57F17', border: '#FFE082', fill: '#FFF8E1', label: '#E65100' },
  critical: { bg: '#C62828', border: '#EF9A9A', fill: '#FFEBEE', label: '#B71C1C' },
}

export function Section({ status, title, children }) {
  const s = STATUS[status]
  return (
    <div style={{ ...styles.section, borderLeft: `4px solid ${s.bg}`, background: s.fill }}>
      <div style={styles.sectionHeader}>
        <span style={{ ...styles.statusBadge, background: s.bg }}>{
          status === 'solid' ? 'Validato' : status === 'open' ? 'Da approfondire' : 'Critico'
        }</span>
        <h3 style={styles.sectionTitle}>{title}</h3>
      </div>
      <div style={styles.sectionBody}>{children}</div>
    </div>
  )
}

const PHASE_STYLES = {
  done:   { accent: '#2E7D32', bg: '#E8F5E9', border: '#A5D6A7', badge: '#2E7D32', badgeText: 'Completato' },
  next:   { accent: '#1565C0', bg: '#E3F2FD', border: '#90CAF9', badge: '#1565C0', badgeText: 'Prossimo' },
  future: { accent: '#78909C', bg: '#ECEFF1', border: '#CFD8DC', badge: '#78909C', badgeText: 'Futuro' },
}

export function RoadmapPhase({ number, title, status, subtitle, items }) {
  const ps = PHASE_STYLES[status]
  return (
    <div style={{
      position: 'relative',
      paddingLeft: 36,
      paddingBottom: 24,
    }}>
      <div style={{
        position: 'absolute',
        left: 13,
        top: 0,
        bottom: 0,
        width: 2,
        background: ps.border,
      }} />
      <div style={{
        position: 'absolute',
        left: 4,
        top: 2,
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: ps.accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 9,
        fontWeight: 800,
        boxShadow: status === 'next' ? `0 0 0 4px ${ps.border}` : 'none',
      }}>
        {status === 'done' ? '\u2713' : number}
      </div>
      <div style={{
        background: ps.bg,
        border: `1px solid ${ps.border}`,
        borderRadius: 10,
        padding: '14px 16px',
        borderLeft: `4px solid ${ps.accent}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: subtitle ? 2 : 8, flexWrap: 'wrap' }}>
          <span style={{
            background: ps.badge,
            color: '#fff',
            fontSize: 9,
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: 6,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
            {ps.badgeText}
          </span>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#2C3E50' }}>
            Strato {number} — {title}
          </span>
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: '#78909C', marginBottom: 8, fontStyle: 'italic' }}>
            {subtitle}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 13 }}>
              <span style={{
                flexShrink: 0,
                width: 18,
                height: 18,
                borderRadius: 4,
                border: item.done ? 'none' : `2px solid ${ps.border}`,
                background: item.done ? ps.accent : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                marginTop: 1,
              }}>
                {item.done ? '\u2713' : ''}
              </span>
              <span style={{ color: item.done ? '#78909C' : '#37474F', textDecoration: item.done ? 'line-through' : 'none', lineHeight: 1.4 }}>
                {item.label}
                {item.pillar && (
                  <span style={{
                    marginLeft: 6,
                    fontSize: 10,
                    color: ps.accent,
                    fontWeight: 600,
                    opacity: 0.7,
                  }}>
                    [{item.pillar}]
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ParamCard({ name, foundation, desc, effect, detail }) {
  return (
    <div style={styles.paramCard}>
      <div style={styles.paramName}>{name}</div>
      {foundation && <div style={styles.paramFoundation}>{foundation}</div>}
      <div style={styles.paramDesc}>{desc}</div>
      <div style={styles.paramEffect}>{effect}</div>
      <div style={styles.paramDetail}>{detail}</div>
    </div>
  )
}
