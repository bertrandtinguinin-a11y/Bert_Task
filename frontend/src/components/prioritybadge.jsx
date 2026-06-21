import Icon from './icon'

const PRIORITY_STYLES = {
  'Haute': 'badge priority-haute',
  'Moyenne': 'badge priority-moyenne',
  'Basse': 'badge priority-basse',
}

const PRIORITY_DOT = {
  'Haute': 'text-red-500',
  'Moyenne': 'text-yellow-500',
  'Basse': 'text-green-500',
}

export default function PriorityBadge({ priority, className = '' }) {
  const style = PRIORITY_STYLES[priority] || 'badge bg-gray-100 text-gray-800'
  const dot = PRIORITY_DOT[priority] || 'text-gray-400'

  return (
    <span className={`${style} inline-flex items-center gap-1.5 ${className}`}>
      <Icon name="dot" className={`text-[0.5em] ${dot}`} />
      {priority}
    </span>
  )
}
