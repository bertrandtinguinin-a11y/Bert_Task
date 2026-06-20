import { useState, useEffect } from 'react'
import {
  fetchTasks, fetchAIPrioritize, fetchAIBlockages,
  fetchAISummary, fetchAIRecommendations,
} from '../api/client'
import toast from 'react-hot-toast'

export default function AIInsights() {
  const [prioritize, setPrioritize] = useState(null)
  const [blockages, setBlockages] = useState(null)
  const [summary, setSummary] = useState(null)
  const [recommendations, setRecommendations] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('summary')

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const tasks = await fetchTasks()
      const [p, b, s, r] = await Promise.all([
        fetchAIPrioritize(tasks),
        fetchAIBlockages(tasks),
        fetchAISummary(tasks),
        fetchAIRecommendations(tasks),
      ])
      setPrioritize(p)
      setBlockages(b)
      setSummary(s)
      setRecommendations(r)
    } catch (err) {
      toast.error('Erreur de chargement des analyses IA: ' + (err.message || ''))
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { key: 'summary', label: '📊 Résumé', icon: '📊' },
    { key: 'blockages', label: '🚫 Blocages', icon: '🚫', count: blockages?.total_blockages },
    { key: 'prioritize', label: '🔄 Priorisation', icon: '🔄', count: prioritize?.suggestions?.length },
    { key: 'recommendations', label: '💡 Recommandations', icon: '💡', count: recommendations?.recommendations?.length },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🤖</div>
          <p className="text-gray-500 dark:text-gray-400">Analyse IA en cours...</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Analyse sémantique des tâches et observations</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">🤖 IA Insights</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Analyse intelligente des tâches — Priorisation, Blocages, Recommandations</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key
                  ? 'bg-white/20'
                  : 'bg-gray-200 dark:bg-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Performance Summary */}
      {activeTab === 'summary' && summary && (
        <div className="space-y-4">
          <div className="card border-l-4 border-primary-500">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                  Résumé de Performance — {summary.period}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-line">
                  {summary.summary_text}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Highlights */}
            <div className="card border-l-4 border-green-500">
              <h4 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-3">
                ✅ Points forts ({summary.highlights.length})
              </h4>
              <ul className="space-y-2">
                {summary.highlights.map((h, i) => (
                  <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            {/* Concerns */}
            <div className="card border-l-4 border-red-500">
              <h4 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-3">
                ⚠️ Points d'attention ({summary.concerns.length})
              </h4>
              <ul className="space-y-2">
                {summary.concerns.map((c, i) => (
                  <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">!</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card text-center">
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{summary.total_tasks}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.completed}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Réalisées</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.completion_rate}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Taux</p>
            </div>
          </div>
        </div>
      )}

      {/* Blockages */}
      {activeTab === 'blockages' && blockages && (
        <div className="space-y-4">
          <div className="card border-l-4 border-red-500">
            <p className="text-sm text-gray-700 dark:text-gray-300">{blockages.summary}</p>
          </div>

          {blockages.blockages.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-gray-500 dark:text-gray-400">Aucun blocage détecté.</p>
            </div>
          ) : (
            blockages.blockages.map(b => (
              <div key={b.task_id} className="card border-l-4 border-red-500">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400">#{b.sequence_number}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        b.severity === 'Critique' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' :
                        b.severity === 'Élevée' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
                      }`}>
                        {b.severity === 'Critique' ? '🔴' : b.severity === 'Élevée' ? '🟠' : '🟡'} {b.severity}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{b.task_description}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Type : {b.blockage_type} | Statut : {b.status}
                    </p>
                    {b.observations && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                        💬 {b.observations}
                      </p>
                    )}
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        💡 Suggestion : {b.suggestion}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Prioritization */}
      {activeTab === 'prioritize' && prioritize && (
        <div className="space-y-4">
          <div className="card border-l-4 border-yellow-500">
            <p className="text-sm text-gray-700 dark:text-gray-300">{prioritize.summary}</p>
          </div>

          {prioritize.suggestions.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">✨</div>
              <p className="text-gray-500 dark:text-gray-400">La priorisation actuelle est optimale.</p>
            </div>
          ) : (
            prioritize.suggestions.map(s => (
              <div
                key={s.task_id}
                className={`card border-l-4 ${
                  s.suggested_priority !== s.current_priority
                    ? 'border-yellow-500'
                    : 'border-green-500'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400">#{s.sequence_number}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{s.task_description}</h4>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-gray-500">Actuelle :</span>
                        <span className={`font-medium ${
                          s.current_priority === 'Haute' ? 'text-red-600' :
                          s.current_priority === 'Moyenne' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {s.current_priority}
                        </span>
                      </div>
                      {s.suggested_priority !== s.current_priority && (
                        <>
                          <span className="text-gray-400">→</span>
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-gray-500">Suggérée :</span>
                            <span className={`font-medium ${
                              s.suggested_priority === 'Haute' ? 'text-red-600' :
                              s.suggested_priority === 'Moyenne' ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {s.suggested_priority}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    {s.reason && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        📝 {s.reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Recommendations */}
      {activeTab === 'recommendations' && recommendations && (
        <div className="space-y-4">
          <div className="card border-l-4 border-green-500">
            <p className="text-sm text-gray-700 dark:text-gray-300">{recommendations.summary}</p>
          </div>

          {recommendations.recommendations.map((r, i) => (
            <div
              key={i}
              className={`card border-l-4 ${
                r.priority === 'Haute' ? 'border-red-500' :
                r.priority === 'Moyenne' ? 'border-yellow-500' : 'border-green-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`text-lg ${
                  r.priority === 'Haute' ? 'text-red-500' :
                  r.priority === 'Moyenne' ? 'text-yellow-500' : 'text-green-500'
                }`}>
                  {r.priority === 'Haute' ? '🔴' : r.priority === 'Moyenne' ? '🟡' : '🟢'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      {r.category}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      r.priority === 'Haute' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                      r.priority === 'Moyenne' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                    }`}>
                      Priorité {r.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{r.recommendation}</p>
                  {r.target_tasks.length > 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Tâches concernées : {r.target_tasks.map(id => `#${id}`).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
