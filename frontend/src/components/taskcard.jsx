import { useNavigate } from 'react-router-dom'
import StatusBadge from './statusbadge'
import PriorityBadge from './prioritybadge'
import Icon from './icon'

export default function TaskCard({ task }) {
  const navigate = useNavigate()
  const startDate = task.start_date
    ? new Date(task.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : null
  const dueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : null
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Réalisé'

  return (
    <div
      onClick={() => navigate(`/tasks/${task.id}`)}
      className="card cursor-pointer hover:shadow-md transition-shadow border-l-4"
      style={{
        borderLeftColor:
          task.status === 'Réalisé' ? '#16a34a' :
          task.status === 'En cours' ? '#2563eb' :
          task.status === 'À faire' ? '#ca8a04' :
          task.status === 'À traiter' ? '#ea580c' :
          task.status === 'Bloqué' ? '#dc2626' : '#6b7280'
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-gray-400 dark:text-gray-500">#{task.sequence_number}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{task.theme_project}</span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
            {task.task_description}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            <span className="text-xs text-gray-500 dark:text-gray-400 inline-flex items-center gap-1"><Icon name="user" /> {task.responsible_person}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          {startDate && (
            <p className="text-xs text-gray-500 dark:text-gray-400 inline-flex items-center gap-1">
              <Icon name="start" /> {startDate}
            </p>
          )}
          {dueDate && (
            <p className={`text-xs font-medium inline-flex items-center gap-1 ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
              <Icon name={isOverdue ? 'warning' : 'calendar'} /> {dueDate}
            </p>
          )}
        </div>
      </div>
      {task.observations && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 italic">
          <Icon name="comment" className="mr-1" /> {task.observations}
        </p>
      )}
    </div>
  )
}
