import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithGoogle, signIn, signUp } from '../api/client'
import toast from 'react-hot-toast'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleGoogle = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
      // Redirection handled by OAuth
    } catch (err) {
      toast.error('Erreur Google: ' + (err.message || 'Connexion échouée'))
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.error('Email et mot de passe requis')
      return
    }
    if (mode === 'register' && !username.trim()) {
      toast.error('Nom d\'utilisateur requis')
      return
    }
    setLoading(true)
    try {
      if (mode === 'register') {
        await signUp(email, password, username)
        toast.success('Compte créé ! Vérifiez votre email pour confirmer.')
        setMode('login')
      } else {
        await signIn(email, password)
        toast.success('Connecté !')
        navigate('/')
      }
    } catch (err) {
      toast.error(err.message || 'Échec')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white text-3xl shadow-lg mb-4">
            📋
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">TaskMN</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Suivi de tâches — M&N Expertise</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 space-y-4">
          {/* Google Button */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Connexion...' : 'Continuer avec Google'}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white dark:bg-gray-800 text-gray-500">ou</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom d'utilisateur</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Jean Dupont" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="vous@exemple.com" autoComplete="email" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="••••••" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
                mode === 'register'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? '⏳ Patientez...' : mode === 'register' ? '📝 Créer un compte' : '🔑 Se connecter'}
            </button>
          </form>

          {/* Toggle */}
          <div className="text-center text-sm">
            {mode === 'login' ? (
              <p className="text-gray-500 dark:text-gray-400">
                Pas de compte ?{' '}
                <button onClick={() => setMode('register')} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                  Créer un compte
                </button>
              </p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                Déjà inscrit ?{' '}
                <button onClick={() => setMode('login')} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                  Se connecter
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          M&N Expertise — Natitingou, Bénin 🇧🇯
        </p>
      </div>
    </div>
  )
}
