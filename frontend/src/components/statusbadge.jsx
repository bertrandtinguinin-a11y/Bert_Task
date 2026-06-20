const STATUS_STYLES = {
  'Réalisé': 'badge status-realise',
  'En cours': 'badge status-en-cours',
  'À faire': 'badge status-a-faire',
  'À traiter': 'badge status-a-traiter',
  'Bloqué': 'badge status-bloque',
  'À planifier': 'badge status-a-planifier',
}

const STATUS_ICONS = {
  'Réalisé': '✅',
  'En cours': '🔄',
  'À faire': '📝',
  'À traiter': '📥',
  'Bloqué': '🚫',
  'À planifier': '📅',
}

export default function StatusBadge({ status, className = '' }) {
  const style = STATUS_STYLES[status] || 'badge bg-gray-100 text-gray-800'
  const icon = STATUS_ICONS[status] || ''

  return (
    <span className={`${style} ${className}`}>
      {icon} {status}
    </span>
  )
}
