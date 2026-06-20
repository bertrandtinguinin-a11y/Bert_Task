import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/layout'
import Dashboard from './pages/dashboard'
import TaskList from './pages/tasklist'
import TaskForm from './pages/taskform'
import Synthesis from './pages/synthesis'
import AIInsights from './pages/aiinsights'
import Settings from './pages/settings'

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('point_dg_dark_mode')
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (darkMode) { root.classList.add('dark') } else { root.classList.remove('dark') }
    localStorage.setItem('point_dg_dark_mode', darkMode)
  }, [darkMode])

  return (
    <Layout darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<TaskList />} />
        <Route path="/tasks/new" element={<TaskForm />} />
        <Route path="/tasks/:id" element={<TaskForm />} />
        <Route path="/synthesis" element={<Synthesis />} />
        <Route path="/ai" element={<AIInsights />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
