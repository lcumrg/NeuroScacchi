import { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth'
import { auth, googleProvider, isConfigured } from '../firebase'

const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isConfigured || !auth) {
      setLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const clearError = () => setError(null)

  const login = async (email, password) => {
    if (!auth) throw new Error('Firebase non configurato')
    setError(null)
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      return result.user
    } catch (e) {
      const msg = firebaseErrorMessage(e.code)
      setError(msg)
      throw e
    }
  }

  const signup = async (email, password, displayName) => {
    if (!auth) throw new Error('Firebase non configurato')
    setError(null)
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      if (displayName) {
        await updateProfile(result.user, { displayName })
      }
      return result.user
    } catch (e) {
      const msg = firebaseErrorMessage(e.code)
      setError(msg)
      throw e
    }
  }

  const loginWithGoogle = async () => {
    if (!auth || !googleProvider) throw new Error('Firebase non configurato')
    setError(null)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      return result.user
    } catch (e) {
      if (e.code === 'auth/popup-closed-by-user') return null
      const msg = firebaseErrorMessage(e.code)
      setError(msg)
      throw e
    }
  }

  const logout = async () => {
    if (!auth) return
    setError(null)
    await signOut(auth)
  }

  const resetPassword = async (email) => {
    if (!auth) throw new Error('Firebase non configurato')
    setError(null)
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (e) {
      const msg = firebaseErrorMessage(e.code)
      setError(msg)
      throw e
    }
  }

  const value = {
    user,
    loading,
    error,
    clearError,
    isConfigured,
    login,
    signup,
    loginWithGoogle,
    logout,
    resetPassword
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function firebaseErrorMessage(code) {
  switch (code) {
    case 'auth/user-not-found': return 'Nessun account trovato con questa email.'
    case 'auth/wrong-password': return 'Password errata.'
    case 'auth/invalid-credential': return 'Credenziali non valide.'
    case 'auth/email-already-in-use': return 'Questa email è già registrata.'
    case 'auth/weak-password': return 'La password deve avere almeno 6 caratteri.'
    case 'auth/invalid-email': return 'Email non valida.'
    case 'auth/too-many-requests': return 'Troppi tentativi. Riprova tra qualche minuto.'
    case 'auth/network-request-failed': return 'Errore di rete. Controlla la connessione.'
    case 'auth/popup-blocked': return 'Il popup è stato bloccato dal browser. Abilita i popup per questo sito.'
    default: return `Errore di autenticazione (${code})`
  }
}
