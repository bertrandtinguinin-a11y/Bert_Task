const PRIORITY_STYLES = {
  'Haute': 'badge priority-haute',
  'Moyenne': 'badge priority-moyenne',
  'Basse': 'badge priority-basse',
}

const PRIORITY_ICONS = {
  'Haute': '🔴',
  'Moyenne': '🟡',
  'Basse': '🟢',
}

export default function PriorityBadge({ priority, className = '' }) {
  const style = PRIORITY_STYLES[priority] || 'badge bg-gray-100 text-gray-800'
  const icon = PRIORITY_ICONS[priority] || ''

  return (
    <span className={`${style} ${className}`}>
      {icon} {priority}
    </span>
  )
}
