import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { signOut } from '../api/client'
import toast from 'react-hot-toast'
import Icon from './icon'

const NAV_ITEMS = [
  { path: '/', label: 'Tableau de bord', icon: 'dashboard' },
  { path: '/tasks', label: 'Tâches', icon: 'tasks' },
  { path: '/synthesis', label: 'Synthèse', icon: 'synthesis' },
  { path: '/ai', label: 'IA Insights', icon: 'ai' },
  { path: '/settings', label: 'Paramètres', icon: 'settings' },
]

export default function Layout({ children, darkMode, toggleDarkMode, user }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Déconnecté')
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Erreur déconnexion')
    }
  }

  // Bloc compte réutilisé (sidebar mobile + desktop)
  const AccountBox = () => (
    user ? (
      <div className="space-y-2">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5" title={user.email}>
          <Icon name="user" /> {user.email}
        </p>
        <button onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
          Se déconnecter
        </button>
      </div>
    ) : (
      <Link to="/login" onClick={() => setSidebarOpen(false)}
        className="block w-full text-center px-3 py-2 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700">
        Se connecter
      </Link>
    )
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-green-700 dark:text-green-400">TaskMN</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">M&N Expertise</span>
          </div>
          <button onClick={toggleDarkMode} className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <Icon name={darkMode ? 'sun' : 'moon'} />
          </button>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-xl p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-green-700 dark:text-green-400">TaskMN</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">M&N Expertise — Natitingou</p>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1 text-gray-400 hover:text-gray-600"><Icon name="close" /></button>
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map(item => (
                <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon name={item.icon} className="w-5 text-center" fixedWidth />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <AccountBox />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 lg:border-r lg:border-gray-200 dark:lg:border-gray-700 bg-white dark:bg-gray-800 z-20">
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="px-6 py-5">
            <h1 className="text-2xl font-bold text-green-700 dark:text-green-400">TaskMN</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">M&N Expertise — Natitingou, Bénin</p>
          </div>
          <nav className="flex-1 px-4 space-y-1">
            {NAV_ITEMS.map(item => (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon name={item.icon} className="w-5 text-center" fixedWidth />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <AccountBox />
            <button onClick={toggleDarkMode} className="inline-flex items-center gap-2 p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm" title={darkMode ? 'Mode clair' : 'Mode sombre'}>
              <Icon name={darkMode ? 'sun' : 'moon'} /> {darkMode ? 'Clair' : 'Sombre'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64 pt-14 lg:pt-0">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
