import Icon from './icon'

const STATUS_STYLES = {
  'Réalisé': 'badge status-realise',
  'En cours': 'badge status-en-cours',
  'À faire': 'badge status-a-faire',
  'À traiter': 'badge status-a-traiter',
  'Bloqué': 'badge status-bloque',
  'À planifier': 'badge status-a-planifier',
}

const STATUS_ICONS = {
  'Réalisé': 'done',
  'En cours': 'progress',
  'À faire': 'todo',
  'À traiter': 'export',
  'Bloqué': 'blocked',
  'À planifier': 'calendar',
}

export default function StatusBadge({ status, className = '' }) {
  const style = STATUS_STYLES[status] || 'badge bg-gray-100 text-gray-800'
  const icon = STATUS_ICONS[status]

  return (
    <span className={`${style} inline-flex items-center gap-1.5 ${className}`}>
      {icon && <Icon name={icon} className="text-[0.85em]" />}
      {status}
    </span>
  )
}
