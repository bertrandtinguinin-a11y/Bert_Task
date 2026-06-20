export default function KpiCard({ title, value, icon, color = 'primary', subtitle, onClick }) {
  const colorClasses = {
    primary: 'border-l-4 border-primary-500 bg-primary-50/50 dark:bg-primary-900/10',
    green: 'border-l-4 border-green-500 bg-green-50/50 dark:bg-green-900/10',
    blue: 'border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-900/10',
    yellow: 'border-l-4 border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10',
    red: 'border-l-4 border-red-500 bg-red-50/50 dark:bg-red-900/10',
    orange: 'border-l-4 border-orange-500 bg-orange-50/50 dark:bg-orange-900/10',
  }

  return (
    <div
      className={`card ${colorClasses[color] || colorClasses.primary} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="text-3xl opacity-70">{icon}</div>
        )}
      </div>
    </div>
  )
}
