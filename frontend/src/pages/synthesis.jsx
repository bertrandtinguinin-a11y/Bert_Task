import { useState, useEffect } from 'react'
import { fetchStatusDistribution, fetchPriorityDistribution, fetchThemeCompletion } from '../api/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Icon from '../components/icon'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  'Réalisé': '#16a34a',
  'En cours': '#2563eb',
  'À faire': '#ca8a04',
  'À traiter': '#ea580c',
  'Bloqué': '#dc2626',
  'À planifier': '#6b7280',
}

const PRIORITY_COLORS = {
  'Haute': '#dc2626',
  'Moyenne': '#eab308',
  'Basse': '#16a34a',
}

export default function Synthesis() {
  const [statusData, setStatusData] = useState([])
  const [priorityData, setPriorityData] = useState([])
  const [themeData, setThemeData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [status, priority, themes] = await Promise.all([
        fetchStatusDistribution(),
        fetchPriorityDistribution(),
        fetchThemeCompletion(),
      ])
      setStatusData(status)
      setPriorityData(priority)
      setThemeData(themes)
    } catch (err) {
      toast.error('Erreur de chargement des données de synthèse')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Icon name="spinner" spin className="text-4xl mb-4 text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400">Chargement des analyses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Synthèse & Analytique</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Vue d'ensemble de l'état des tâches</p>
      </div>

      {/* Bar Chart - Status */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
<Icon name="chart" className="mr-2 text-gray-400" />Répartition par Statut
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={statusData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="status"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              angle={-15}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#f3f4f6',
                fontSize: '12px',
              }}
              formatter={(value) => [`${value} tâche(s)`, '']}
            />
            <Bar dataKey="count" name="Nombre de tâches" radius={[4, 4, 0, 0]}>
              {statusData.map((entry, idx) => (
                <Cell key={idx} fill={STATUS_COLORS[entry.status] || '#6b7280'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {statusData.map(s => (
            <div key={s.status} className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[s.status] || '#6b7280' }} />
              <span className="text-gray-600 dark:text-gray-400">{s.status}</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{s.count}</span>
              <span className="text-gray-400">({s.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pie Chart - Priority */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
<Icon name="target" className="mr-2 text-gray-400" />Répartition par Priorité
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={priorityData}
              dataKey="count"
              nameKey="priority"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={50}
              paddingAngle={5}
              label={({ priority, percentage }) => `${priority} (${percentage}%)`}
              labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
            >
              {priorityData.map((entry, idx) => (
                <Cell key={idx} fill={PRIORITY_COLORS[entry.priority] || '#6b7280'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#f3f4f6',
                fontSize: '12px',
              }}
              formatter={(value) => [`${value} tâche(s)`, '']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Theme Completion Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
<Icon name="synthesis" className="mr-2 text-gray-400" />Taux de Complétion par Thème
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Thème</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Total</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Réalisées</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Taux</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Progression</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {themeData.map(t => (
                <tr key={t.theme} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-2.5 px-3 text-gray-800 dark:text-gray-200 max-w-[200px] truncate">{t.theme}</td>
                  <td className="py-2.5 px-3 text-center text-gray-600 dark:text-gray-400">{t.total}</td>
                  <td className="py-2.5 px-3 text-center font-medium text-green-600 dark:text-green-400">{t.completed}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`font-semibold ${
                      t.completion_rate >= 75 ? 'text-green-600 dark:text-green-400' :
                      t.completion_rate >= 40 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {t.completion_rate}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${t.completion_rate}%`,
                          background: `linear-gradient(90deg, #2563eb, #16a34a)`,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Légende — Statuts</h3>
        <div className="flex flex-wrap gap-3 text-xs">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-gray-600 dark:text-gray-400">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
