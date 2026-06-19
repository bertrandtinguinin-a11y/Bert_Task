import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import TaskList from './pages/TaskList'
import TaskForm from './pages/TaskForm'
import Synthesis from './pages/Synthesis'
import AIInsights from './pages/AIInsights'
import Settings from './pages/Settings'

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
