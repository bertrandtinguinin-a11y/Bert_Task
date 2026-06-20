import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/layout'
import Dashboard from './pages/dashboard'
import TaskList from './pages/tasklist'
import TaskForm from './pages/taskform'
import Synthesis from './pages/synthesis'
import AIInsights from './pages/aiinsights'
import Settings from './pages/settings'
import Login from './pages/login'
import { getSession, onAuthStateChange } from './api/client'

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('point_dg_dark_mode')
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // null = pas connecté ; objet = session ; undefined = chargement initial
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    const root = document.documentElement
    if (darkMode) { root.classList.add('dark') } else { root.classList.remove('dark') }
    localStorage.setItem('point_dg_dark_mode', darkMode)
  }, [darkMode])

  useEffect(() => {
    let mounted = true
    getSession().then(({ data }) => {
      if (mounted) setUser(data?.session?.user ?? null)
    })
    const { data: sub } = onAuthStateChange((_event, u) => {
      setUser(u)
    })
    return () => { mounted = false; sub?.subscription?.unsubscribe?.() }
  }, [])

  // Attente résolution session pour éviter un flash login
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-400 text-sm">Chargement…</div>
      </div>
    )
  }

  return (
    <Layout darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} user={user}>
      <Routes>
        {/* Aperçu public : fonctionnalités générales visibles sans connexion.
            Les données restent vides tant que non authentifié (isolées par RLS). */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<TaskList />} />
        <Route path="/synthesis" element={<Synthesis />} />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

        {/* Fonctionnalités avancées : authentification requise */}
        <Route path="/tasks/new" element={<Protected user={user}><TaskForm /></Protected>} />
        <Route path="/tasks/:id" element={<Protected user={user}><TaskForm /></Protected>} />
        <Route path="/ai" element={<Protected user={user}><AIInsights /></Protected>} />
        <Route path="/settings" element={<Protected user={user}><Settings /></Protected>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

// Garde de route : redirige vers /login si non connecté.
function Protected({ user, children }) {
  const location = useLocation()
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}
