import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchTasks, deleteTask } from '../api/client'
import StatusBadge from '../components/statusbadge'
import PriorityBadge from '../components/prioritybadge'
import FilterBar from '../components/filterbar'
import TaskCard from '../components/taskcard'
import Icon from '../components/icon'
import toast from 'react-hot-toast'

const SORT_COLUMNS = [
  { key: 'sequence_number', label: '#' },
  { key: 'theme_project', label: 'Thème' },
  { key: 'task_description', label: 'Description' },
  { key: 'responsible_person', label: 'Responsable' },
  { key: 'status', label: 'Statut' },
  { key: 'priority', label: 'Priorité' },
  { key: 'start_date', label: 'Début' },
  { key: 'due_date', label: 'Échéance' },
]

export default function TaskList() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({})
  const [sortBy, setSortBy] = useState('sequence_number')
  const [sortOrder, setSortOrder] = useState('asc')
  const [selected, setSelected] = useState(new Set())
  const [viewMode, setViewMode] = useState('table') // table or cards
  const navigate = useNavigate()

  const loadTasks = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchTasks({ ...filters, sort_by: sortBy, sort_order: sortOrder })
      setTasks(data)
    } catch (err) {
      toast.error('Erreur de chargement des tâches')
    } finally {
      setLoading(false)
    }
  }, [filters, sortBy, sortOrder])

  useEffect(() => { loadTasks() }, [loadTasks])

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortOrder('asc')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette tâche ? Cette action est irréversible.')) return
    try {
      await deleteTask(id)
      toast.success('Tâche supprimée')
      loadTasks()
    } catch (err) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const toggleSelect = (id) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const selectAll = () => {
    if (selected.size === tasks.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(tasks.map(t => t.id)))
    }
  }

  const exportData = () => {
    const format = window.confirm('Cliquez OK pour Excel, Annuler pour CSV')
    window.open(`/api/tasks/export?format=${format ? 'excel' : 'csv'}`, '_blank')
  }

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Liste des tâches</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{tasks.length} tâche(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
            className="btn-secondary text-sm py-1.5"
            title={viewMode === 'table' ? 'Vue cartes' : 'Vue tableau'}
          >
            <Icon name={viewMode === 'table' ? 'cards' : 'table'} className="mr-1.5" />{viewMode === 'table' ? 'Cartes' : 'Tableau'}
          </button>
          <button onClick={exportData} className="btn-secondary text-sm py-1.5 inline-flex items-center gap-1.5">
            <Icon name="export" /> Exporter
          </button>
          <button onClick={() => navigate('/tasks/new')} className="btn-primary text-sm py-1.5 inline-flex items-center gap-1.5">
            <Icon name="plus" /> Nouvelle
          </button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar filters={filters} onFilterChange={setFilters} />

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Icon name="spinner" spin className="text-4xl mb-4 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="card text-center py-16">
          <Icon name="empty" className="text-5xl mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Aucune tâche trouvée</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Essayez de modifier les filtres ou créez une nouvelle tâche.</p>
          <button onClick={() => navigate('/tasks/new')} className="btn-primary mt-4 inline-flex items-center gap-2">
            <Icon name="plus" /> Créer une tâche
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-3 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selected.size === tasks.length && tasks.length > 0}
                      onChange={selectAll}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </th>
                  {SORT_COLUMNS.map(col => (
                    <th
                      key={col.key}
                      className="px-3 py-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                      onClick={() => handleSort(col.key)}
                    >
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        {col.label}
                        {sortBy === col.key && (
                          <Icon name={sortOrder === 'asc' ? 'sort-up' : 'sort-down'} className="ml-1 text-[0.7em]" />
                        )}
                      </span>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-left">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {tasks.map(task => (
                  <tr
                    key={task.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(task.id)}
                        onChange={() => toggleSelect(task.id)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-500">{task.sequence_number}</td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px] block">
                        {task.theme_project}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-gray-800 dark:text-gray-200 line-clamp-2 max-w-[250px] block">
                        {task.task_description}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {task.responsible_person}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(task.start_date)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-xs whitespace-nowrap ${
                        task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Réalisé'
                          ? 'text-red-600 dark:text-red-400 font-medium'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {formatDate(task.due_date)}
                      </span>
                    </td>
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/tasks/${task.id}`)}
                          className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          title="Modifier"
                        >
                          <Icon name="edit" />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Supprimer"
                        >
                          <Icon name="delete" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 z-20">
          <span className="text-sm">{selected.size} tâche(s) sélectionnée(s)</span>
          <button className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors inline-flex items-center gap-1.5">
            <Icon name="delete" /> Supprimer
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm transition-colors inline-flex items-center gap-1.5"
          >
            <Icon name="close" /> Annuler
          </button>
        </div>
      )}
    </div>
  )
}

