import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] crash:', error?.message, info?.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: '3rem 2rem',
          maxWidth: 520,
          margin: '4rem auto',
          fontFamily: 'var(--font-mono, monospace)',
          background: 'var(--bg-card, #1c1917)',
          border: '1px solid #ef444466',
          borderRadius: 8,
          color: 'var(--text-primary, #fafaf9)',
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⚠</div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#ef4444' }}>
            Errore imprevisto
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#a8a29e', marginBottom: '1rem', lineHeight: 1.6 }}>
            {this.state.error?.message || 'Qualcosa è andato storto.'}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#78716c', marginBottom: '1.5rem' }}>
            L'errore è stato registrato in console. Se stavi eseguendo una lezione, il feedback parziale potrebbe non essere stato salvato.
          </p>
          <a
            href="#/lessons"
            onClick={() => this.setState({ error: null })}
            style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              background: '#ef444422',
              border: '1px solid #ef444466',
              borderRadius: 6,
              color: '#ef4444',
              textDecoration: 'none',
              fontSize: '0.82rem',
            }}
          >
            Torna alle lezioni
          </a>
        </div>
      )
    }
    return this.props.children
  }
}
