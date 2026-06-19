import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchTask, createTask, updateTask, fetchTaskHistory } from '../api/client'
import toast from 'react-hot-toast'

const STATUSES = ['À faire', 'En cours', 'Réalisé', 'À traiter', 'À planifier', 'Bloqué']
const PRIORITIES = ['Haute', 'Moyenne', 'Basse']
const THEMES = [
  'Cabinet – Retraite',
  'Communication / Multimédia',
  'Fabrice Kopore',
  'Florentine / SNV',
  'Facilitateurs(ce) SNV / Rapports',
  'Situation de référence Formation Microentrepreneur C2',
  'Maguerite',
  'Formation en S&E et IA intégré',
  'Formation en EIES',
  'Mail Professionnel',
]

const DEFAULT_FORM = {
  sequence_number: '',
  theme_project: '',
  task_description: '',
  responsible_person: '',
  status: 'À faire',
  priority: 'Moyenne',
  start_date: '',
  due_date: '',
  observations: '',
}

export default function TaskForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [form, setForm] = useState(DEFAULT_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    if (isEdit) {
      loadTask()
    }
  }, [id])

  const loadTask = async () => {
    try {
      const task = await fetchTask(id)
      setForm({
        sequence_number: task.sequence_number,
        theme_project: task.theme_project,
        task_description: task.task_description,
        responsible_person: task.responsible_person,
        status: task.status,
        priority: task.priority,
        start_date: task.start_date || '',
        due_date: task.due_date || '',
        observations: task.observations || '',
      })
      const hist = await fetchTaskHistory(id)
      setHistory(hist)
    } catch (err) {
      toast.error('Erreur de chargement de la tâche')
      navigate('/tasks')
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.sequence_number || form.sequence_number < 1) errs.sequence_number = 'Numéro de séquence requis (≥ 1)'
    if (!form.theme_project) errs.theme_project = 'Thème/projet requis'
    if (!form.task_description.trim()) errs.task_description = 'Description requise'
    if (!form.responsible_person.trim()) errs.responsible_person = 'Responsable requis'
    if (!form.status) errs.status = 'Statut requis'
    if (!form.priority) errs.priority = 'Priorité requise'
    if (form.due_date && isNaN(Date.parse(form.due_date))) errs.due_date = 'Format de date invalide (YYYY-MM-DD)'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const payload = {
        sequence_number: parseInt(form.sequence_number),
        theme_project: form.theme_project,
        task_description: form.task_description,
        responsible_person: form.responsible_person,
        status: form.status,
        priority: form.priority,
        start_date: form.start_date || null,
        due_date: form.due_date || null,
        observations: form.observations || null,
      }

      if (isEdit) {
        await updateTask(id, payload)
        toast.success('Tâche mise à jour !')
      } else {
        await createTask(payload)
        toast.success('Tâche créée !')
      }
      navigate('/tasks')
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary py-1.5 text-sm">
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Modifier la tâche' : 'Nouvelle tâche'}
        </h1>
      </div>

      {/* Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sequence Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                N° de séquence *
              </label>
              <input
                type="number"
                min="1"
                value={form.sequence_number}
                onChange={e => updateField('sequence_number', e.target.value)}
                className={`input-field ${errors.sequence_number ? 'border-red-500 ring-red-500' : ''}`}
                placeholder="1"
              />
              {errors.sequence_number && <p className="text-xs text-red-500 mt-1">{errors.sequence_number}</p>}
            </div>

            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Thème / Projet *
              </label>
              <input
                type="text"
                value={form.theme_project}
                onChange={e => updateField('theme_project', e.target.value)}
                className={`input-field ${errors.theme_project ? 'border-red-500 ring-red-500' : ''}`}
                placeholder="Ex: Cabinet – Retraite, Formation SNV..."
                list="theme-suggestions"
              />
              <datalist id="theme-suggestions">
                {THEMES.map(t => <option key={t} value={t} />)}
              </datalist>
              {errors.theme_project && <p className="text-xs text-red-500 mt-1">{errors.theme_project}</p>}
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description *
              </label>
              <textarea
                rows={3}
                value={form.task_description}
                onChange={e => updateField('task_description', e.target.value)}
                className={`input-field ${errors.task_description ? 'border-red-500 ring-red-500' : ''}`}
                placeholder="Décrivez la tâche en détail..."
              />
              {errors.task_description && <p className="text-xs text-red-500 mt-1">{errors.task_description}</p>}
            </div>

            {/* Responsible */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Responsable *
              </label>
              <input
                type="text"
                value={form.responsible_person}
                onChange={e => updateField('responsible_person', e.target.value)}
                className={`input-field ${errors.responsible_person ? 'border-red-500 ring-red-500' : ''}`}
                placeholder="Nom du responsable"
              />
              {errors.responsible_person && <p className="text-xs text-red-500 mt-1">{errors.responsible_person}</p>}
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => updateField('start_date', e.target.value)}
                className={`input-field ${errors.start_date ? 'border-red-500 ring-red-500' : ''}`}
              />
              {errors.start_date && <p className="text-xs text-red-500 mt-1">{errors.start_date}</p>}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date d'échéance
              </label>
              <input
                type="date"
                value={form.due_date}
                onChange={e => updateField('due_date', e.target.value)}
                className={`input-field ${errors.due_date ? 'border-red-500 ring-red-500' : ''}`}
              />
              {errors.due_date && <p className="text-xs text-red-500 mt-1">{errors.due_date}</p>}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Statut *
              </label>
              <select
                value={form.status}
                onChange={e => updateField('status', e.target.value)}
                className={`input-field ${errors.status ? 'border-red-500 ring-red-500' : ''}`}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.status && <p className="text-xs text-red-500 mt-1">{errors.status}</p>}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priorité *
              </label>
              <select
                value={form.priority}
                onChange={e => updateField('priority', e.target.value)}
                className={`input-field ${errors.priority ? 'border-red-500 ring-red-500' : ''}`}
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.priority && <p className="text-xs text-red-500 mt-1">{errors.priority}</p>}
            </div>

            {/* Observations */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Observations
              </label>
              <textarea
                rows={4}
                value={form.observations}
                onChange={e => updateField('observations', e.target.value)}
                className="input-field"
                placeholder="Notes, commentaires, suivi, blocages..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? '⏳ Enregistrement...' : isEdit ? '💾 Mettre à jour' : '✅ Créer la tâche'}
            </button>
            <button type="button" onClick={() => navigate('/tasks')} className="btn-secondary">
              Annuler
            </button>
          </div>
        </form>
      </div>

      {/* History (edit mode) */}
      {isEdit && history.length > 0 && (
        <div className="card">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              📜 Historique des modifications ({history.length})
            </h3>
            <span className="text-gray-400">{showHistory ? '▲' : '▼'}</span>
          </button>
          {showHistory && (
            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
              {history.map(h => (
                <div key={h.id} className="text-xs border-b border-gray-100 dark:border-gray-700 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{h.field_changed}</span>
                    <span className="text-gray-400">{new Date(h.changed_at).toLocaleString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {h.old_value && <span className="text-red-500 line-through">{h.old_value}</span>}
                    {h.old_value && h.new_value && <span className="text-gray-400">→</span>}
                    <span className="text-green-600 dark:text-green-400">{h.new_value || '(création)'}</span>
                  </div>
                  {h.changed_by && <span className="text-gray-500">par {h.changed_by}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
