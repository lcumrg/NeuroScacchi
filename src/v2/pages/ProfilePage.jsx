import { useState } from 'react'
import { DEFAULT_PROFILE, getFreezeDuration, getProfilassiFrequency, getMetacognitionFrequency, getMaxHints } from '../engine/cognitiveLayer'
import { getCognitiveProfile, saveCognitiveProfile } from '../utils/storage'

const LEVELS = ['bassa', 'media', 'alta']

const PARAM_INFO = {
  impulsivita: {
    label: 'Impulsivita',
    desc: 'Tendi a muovere senza pensare?',
    effect: (p) => `Freeze: ${getFreezeDuration(p) / 1000}s`,
  },
  consapevolezzaMinacce: {
    label: 'Consapevolezza minacce',
    desc: 'Riesci a vedere cosa vuole fare l\'avversario?',
    effect: (p) => {
      const f = getProfilassiFrequency(p)
      return f === 0 ? 'Profilassi: mai' : f === 1 ? 'Profilassi: sempre' : `Profilassi: ogni ${f} posizioni`
    },
  },
  metacognizione: {
    label: 'Metacognizione',
    desc: 'Ti rendi conto dei tuoi errori?',
    effect: (p) => {
      const f = getMetacognitionFrequency(p)
      return f === 0 ? 'Domande: mai' : f === 1 ? 'Domande: ogni errore' : `Domande: ogni ${f} errori`
    },
  },
  tolleranzaFrustrazione: {
    label: 'Tolleranza frustrazione',
    desc: 'Come reagisci quando un esercizio e\' difficile?',
    effect: (p) => {
      const h = getMaxHints(p)
      return h === -1 ? 'Hint: senza limite' : `Hint: max ${h}, poi soluzione`
    },
  },
}

export default function ProfilePage({ onBack }) {
  const saved = getCognitiveProfile()
  const [profile, setProfile] = useState(saved || DEFAULT_PROFILE)
  const [justSaved, setJustSaved] = useState(false)

  const handleChange = (param, value) => {
    setProfile(prev => ({ ...prev, [param]: value }))
    setJustSaved(false)
  }

  const handleSave = () => {
    saveCognitiveProfile(profile)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2000)
  }

  const handleReset = () => {
    setProfile(DEFAULT_PROFILE)
    setJustSaved(false)
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Profilo Cognitivo</h2>
      <p style={styles.subtitle}>
        Configura il supporto dell'app in base alle tue caratteristiche.
        Ogni parametro regola un comportamento automatico.
      </p>

      <div style={styles.params}>
        {Object.entries(PARAM_INFO).map(([key, info]) => (
          <div key={key} style={styles.paramCard}>
            <div style={styles.paramHeader}>
              <span style={styles.paramLabel}>{info.label}</span>
              <span style={styles.paramEffect}>{info.effect(profile)}</span>
            </div>
            <p style={styles.paramDesc}>{info.desc}</p>
            <div style={styles.levelButtons}>
              {LEVELS.map(level => (
                <button
                  key={level}
                  style={{
                    ...styles.levelBtn,
                    ...(profile[key] === level ? styles.levelBtnActive : {}),
                  }}
                  onClick={() => handleChange(key, level)}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.actions}>
        <button style={styles.btnPrimary} onClick={handleSave}>
          {justSaved ? 'Salvato!' : 'Salva profilo'}
        </button>
        <button style={styles.btnSecondary} onClick={handleReset}>
          Ripristina default
        </button>
        <button style={styles.btnSecondary} onClick={onBack}>
          Torna alla home
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: 520,
    margin: '0 auto',
    padding: '32px 20px',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#2C3E50',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: 14,
    color: '#5A6C7D',
    lineHeight: 1.5,
    margin: '0 0 24px 0',
  },
  params: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  paramCard: {
    background: '#fff',
    borderRadius: 12,
    padding: '16px 20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    border: '1px solid #E0E0E0',
  },
  paramHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  paramLabel: {
    fontSize: 16,
    fontWeight: 600,
    color: '#2C3E50',
  },
  paramEffect: {
    fontSize: 12,
    color: '#1565C0',
    background: '#E3F2FD',
    padding: '2px 8px',
    borderRadius: 8,
    fontWeight: 500,
  },
  paramDesc: {
    fontSize: 13,
    color: '#5A6C7D',
    margin: '0 0 10px 0',
  },
  levelButtons: {
    display: 'flex',
    gap: 8,
  },
  levelBtn: {
    flex: 1,
    padding: '8px 0',
    border: '1px solid #E0E0E0',
    borderRadius: 8,
    background: '#F5F5F5',
    fontSize: 14,
    color: '#5A6C7D',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 500,
    textTransform: 'capitalize',
    transition: 'all 0.15s',
  },
  levelBtnActive: {
    background: '#2E7D32',
    color: '#fff',
    borderColor: '#2E7D32',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 24,
  },
  btnPrimary: {
    padding: '12px 24px',
    background: '#2E7D32',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnSecondary: {
    padding: '10px 24px',
    background: 'none',
    color: '#5A6C7D',
    border: '1px solid #E0E0E0',
    borderRadius: 10,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
}
