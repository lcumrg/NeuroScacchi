import { useState } from 'react'

/**
 * Domanda metacognitiva dopo un errore.
 * Risposta Si/No, registrata per analytics.
 */
export default function MetaPrompt({ question, onAnswer }) {
  const [answered, setAnswered] = useState(false)

  const handleAnswer = (answer) => {
    setAnswered(true)
    setTimeout(() => {
      onAnswer(answer)
    }, 800)
  }

  return (
    <div style={styles.container}>
      <p style={styles.question}>{question}</p>

      {!answered ? (
        <div style={styles.buttons}>
          <button style={styles.btnSi} onClick={() => handleAnswer('si')}>
            Si
          </button>
          <button style={styles.btnNo} onClick={() => handleAnswer('no')}>
            No
          </button>
        </div>
      ) : (
        <p style={styles.thanks}>Grazie! Continuiamo.</p>
      )}
    </div>
  )
}

const styles = {
  container: {
    background: '#E8EAF6',
    border: '1px solid #C5CAE9',
    borderRadius: 12,
    padding: '16px 20px',
    textAlign: 'center',
    maxWidth: 440,
    width: '100%',
    animation: 'fadeIn 0.3s ease',
  },
  question: {
    fontSize: 17,
    fontWeight: 600,
    color: '#1A237E',
    margin: '0 0 14px 0',
    lineHeight: 1.4,
  },
  buttons: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
  },
  btnSi: {
    padding: '10px 32px',
    background: '#283593',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnNo: {
    padding: '10px 32px',
    background: '#FAFBFC',
    color: '#546E7A',
    border: '1px solid #E0E0E0',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  thanks: {
    fontSize: 14,
    color: '#546E7A',
    margin: 0,
    fontStyle: 'italic',
  },
}
