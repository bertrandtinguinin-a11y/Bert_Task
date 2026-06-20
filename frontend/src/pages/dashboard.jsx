import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchDashboard, fetchTasks } from '../api/client'
import KpiCard from '../components/KpiCard'
import TaskCard from '../components/TaskCard'
import FilterBar from '../components/FilterBar'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({})
  const navigate = useNavigate()

  const loadData = useCallback(async () => {
    try {
      const [dashData, taskData] = await Promise.all([
        fetchDashboard(),
        fetchTasks(filters),
      ])
      setDashboard(dashData)
      setTasks(taskData)
    } catch (err) {
      toast.error('Erreur de chargement du tableau de bord')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { loadData() }, [loadData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-500 dark:text-gray-400">Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }

  if (!dashboard) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tableau de bord</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">TaskMN — État des lieux</p>
        </div>
        <button onClick={() => navigate('/tasks/new')} className="btn-primary text-sm">
          ➕ Nouvelle tâche
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <KpiCard
          title="Total tâches"
          value={dashboard.total_tasks}
          icon="📋"
          color="primary"
          subtitle="Toutes les tâches"
        />
        <KpiCard
          title="Réalisées"
          value={dashboard.completed}
          icon="✅"
          color="green"
          subtitle={`${dashboard.completion_rate}%`}
        />
        <KpiCard
          title="En cours"
          value={dashboard.in_progress}
          icon="🔄"
          color="blue"
          subtitle="En progression"
        />
        <KpiCard
          title="Bloquées"
          value={dashboard.blocked}
          icon="🚫"
          color="red"
          subtitle="Nécessitent attention"
        />
      </div>

      {/* Completion Progress Bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Taux de complétion</h3>
          <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
            {dashboard.completion_rate}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${dashboard.completion_rate}%`,
              background: `linear-gradient(90deg, #2563eb, #16a34a)`,
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{dashboard.completed} réalisée(s)</span>
          <span>{dashboard.total_tasks - dashboard.completed} restante(s)</span>
        </div>
      </div>

      {/* Quick Filters */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Filtres rapides</h3>
        <FilterBar filters={filters} onFilterChange={setFilters} showSearch={false} />
      </div>

      {/* Task List Preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Tâches récentes ({tasks.length})
          </h3>
          {tasks.length > 0 && (
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              Voir tout →
            </button>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-500 dark:text-gray-400">Aucune tâche trouvée avec ces filtres.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.slice(0, 9).map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
