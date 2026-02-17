import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './LoginScreen.css'

function LoginScreen() {
  const { login, signup, loginWithGoogle, resetPassword, error, clearError, isConfigured } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const switchMode = (newMode) => {
    setMode(newMode)
    clearError()
    setResetSent(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    clearError()

    try {
      if (mode === 'login') {
        await login(email, password)
      } else if (mode === 'signup') {
        await signup(email, password, displayName.trim() || null)
      } else if (mode === 'reset') {
        await resetPassword(email)
        setResetSent(true)
      }
    } catch {
      // error is set in AuthContext
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    setSubmitting(true)
    clearError()
    try {
      await loginWithGoogle()
    } catch {
      // error is set in AuthContext
    } finally {
      setSubmitting(false)
    }
  }

  if (!isConfigured) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-logo">
            <div className="logo-icon">NS</div>
            <h1>NeuroScacchi</h1>
          </div>
          <div className="login-error">
            Firebase non configurato. Crea un file <code>.env</code> con le credenziali Firebase.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">NS</div>
          <h1>NeuroScacchi</h1>
          <p className="login-subtitle">Allena la mente scacchistica</p>
        </div>

        {mode === 'reset' && resetSent ? (
          <div className="reset-success">
            <div className="reset-success-icon">ok</div>
            <h3>Email inviata!</h3>
            <p>Controlla la tua casella email per il link di reset password.</p>
            <button className="btn-back" onClick={() => switchMode('login')}>
              Torna al login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <h2>
              {mode === 'login' && 'Accedi'}
              {mode === 'signup' && 'Registrati'}
              {mode === 'reset' && 'Recupera password'}
            </h2>

            {error && <div className="login-error">{error}</div>}

            {mode === 'signup' && (
              <div className="form-field">
                <label htmlFor="displayName">Nome (opzionale)</label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Il tuo nome"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="la.tua@email.com"
                required
                autoComplete="email"
              />
            </div>

            {mode !== 'reset' && (
              <div className="form-field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Minimo 6 caratteri' : 'La tua password'}
                  required
                  minLength={mode === 'signup' ? 6 : undefined}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Caricamento...' : (
                mode === 'login' ? 'Accedi' :
                mode === 'signup' ? 'Crea account' :
                'Invia email di reset'
              )}
            </button>

            {mode !== 'reset' && (
              <>
                <div className="divider">
                  <span>oppure</span>
                </div>
                <button type="button" className="btn-google" onClick={handleGoogle} disabled={submitting}>
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continua con Google
                </button>
              </>
            )}

            <div className="login-links">
              {mode === 'login' && (
                <>
                  <button type="button" className="link-btn" onClick={() => switchMode('reset')}>
                    Password dimenticata?
                  </button>
                  <button type="button" className="link-btn" onClick={() => switchMode('signup')}>
                    Non hai un account? Registrati
                  </button>
                </>
              )}
              {mode === 'signup' && (
                <button type="button" className="link-btn" onClick={() => switchMode('login')}>
                  Hai gia un account? Accedi
                </button>
              )}
              {mode === 'reset' && (
                <button type="button" className="link-btn" onClick={() => switchMode('login')}>
                  Torna al login
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default LoginScreen
