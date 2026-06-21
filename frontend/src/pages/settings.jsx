import { useState, useEffect } from 'react'
import { fetchTasks, fetchUsers, updateUserRole, deleteUser, supabase } from '../api/client'
import { generatePerformanceSummary as aiSummary } from '../api/ai'
import Icon from '../components/icon'
import toast from 'react-hot-toast'

export default function Settings() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState([])

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('taskmn_profile')
    return saved ? JSON.parse(saved) : { username: '', email: '' }
  })
  const [editMode, setEditMode] = useState(!profile.username)

  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem('taskmn_notif_enabled') === 'true')
  const [notifEmail, setNotifEmail] = useState(() => localStorage.getItem('taskmn_notif_email') || '')
  const [notifChecked, setNotifChecked] = useState(null)

  useEffect(() => {
    loadTasks()
    loadUsers()
    if (notifEnabled) checkDeadlines()
  }, [notifEnabled])

  const loadTasks = async () => {
    try { const data = await fetchTasks(); setTasks(data) } catch {}
  }

  const loadUsers = async () => {
    try { const data = await fetchUsers(); setUsers(data || []) } catch {} finally { setLoading(false) }
  }

  const saveProfile = () => {
    if (!profile.username.trim()) { toast.error('Nom d\'utilisateur requis'); return }
    if (!profile.email.trim() || !profile.email.includes('@')) { toast.error('Email invalide'); return }
    localStorage.setItem('taskmn_profile', JSON.stringify(profile))
    setEditMode(false)
    toast.success('Profil enregistré !')
  }

  // === EXPORT ===
  const exportData = async (format) => {
    try {
      const data = await fetchTasks()
      if (data.length === 0) { toast.error('Aucune tâche à exporter'); return }
      const headers = ['#', 'Thème/Projet', 'Description', 'Responsable', 'Statut', 'Priorité', 'Échéance', 'Observations']
      const rows = data.map(t => [t.sequence_number, t.theme_project, t.task_description, t.responsible_person, t.status, t.priority, t.due_date || '', t.observations || ''])

      if (format === 'csv') {
        const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = 'TaskMN_taches.csv'; a.click()
        URL.revokeObjectURL(url)
        toast.success('CSV téléchargé !')
      } else {
        let html = '<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1">'
        html += '<tr>' + headers.map(h => `<th style="background:#15803d;color:white;padding:6px">${h}</th>`).join('') + '</tr>'
        rows.forEach(r => { html += '<tr>' + r.map(c => `<td style="padding:4px">${String(c).replace(/</g,'&lt;')}</td>`).join('') + '</tr>' })
        html += '</table></body></html>'
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = 'TaskMN_taches.xls'; a.click()
        URL.revokeObjectURL(url)
        toast.success('Excel téléchargé !')
      }
    } catch (err) { toast.error('Erreur export: ' + (err.message || '')) }
  }

  // === NOTIFICATIONS ===
  const saveNotifSettings = () => {
    if (notifEnabled && !notifEmail.trim()) { toast.error('Email requis'); return }
    if (notifEnabled && !notifEmail.includes('@')) { toast.error('Email invalide'); return }
    localStorage.setItem('taskmn_notif_enabled', notifEnabled.toString())
    localStorage.setItem('taskmn_notif_email', notifEmail)
    toast.success(notifEnabled ? 'Notifications activées !' : 'Notifications désactivées')
    if (notifEnabled) checkDeadlines()
  }

  const checkDeadlines = async () => {
    try {
      const data = await fetchTasks()
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const soon = []
      for (const t of data) {
        if (!t.due_date || t.status === 'Réalisé') continue
        const due = new Date(t.due_date); due.setHours(0, 0, 0, 0)
        const diff = Math.round((due - today) / (1000 * 60 * 60 * 24))
        if (diff >= 0 && diff <= 3) soon.push({ ...t, days_left: diff })
      }
      setNotifChecked({ date: new Date().toISOString(), count: soon.length })

      if (soon.length > 0) {
        const summary = aiSummary(data)
        const rapport = `RAPPORT TaskMN — Échéances proches (${soon.length} tâche(s))

${soon.map(t => `• ${t.task_description}
   Échéance: ${new Date(t.due_date).toLocaleDateString('fr-FR')} (J-${t.days_left})
   Responsable: ${t.responsible_person}
   Statut: ${t.status} | Priorité: ${t.priority}`).join('\n\n')}

---
${summary.summary_text}
— TaskMN, M&N Expertise`

        const subject = `TaskMN — ${soon.length} tâche(s) arrivent à échéance`
        const mailto = `mailto:${notifEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(rapport)}`
        window.location.href = mailto
        toast.success(`${soon.length} tâche(s) proche(s) — email préparé !`)
      } else {
        toast.success('Aucune tâche à échéance dans les 3 prochains jours')
      }
    } catch (err) { console.error('Erreur check:', err) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 inline-flex items-center gap-2"><Icon name="settings" className="text-gray-400" />Paramètres</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Gestion du compte et configuration</p>
      </div>

      {/* Mon compte */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 inline-flex items-center gap-2"><Icon name="user" className="text-gray-400" />Mon compte</h3>
          {!editMode && <button onClick={() => setEditMode(true)} className="btn-secondary text-sm py-1.5 inline-flex items-center gap-1.5"><Icon name="edit" /> Modifier</button>}
        </div>
        {editMode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom d'utilisateur *</label>
              <input type="text" value={profile.username} onChange={e => setProfile({ ...profile, username: e.target.value })} className="input-field" placeholder="Votre nom" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse e-mail *</label>
              <input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} className="input-field" placeholder="vous@exemple.com" />
            </div>
            <button onClick={saveProfile} className="btn-primary py-2 px-4 text-sm inline-flex items-center gap-1.5"><Icon name="save" /> Enregistrer</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div><p className="text-gray-500 dark:text-gray-400">Nom</p><p className="font-medium text-gray-800 dark:text-gray-200">{profile.username}</p></div>
            <div><p className="text-gray-500 dark:text-gray-400">Email</p><p className="font-medium text-gray-800 dark:text-gray-200">{profile.email}</p></div>
            <div><p className="text-gray-500 dark:text-gray-400">Statut</p><p className="font-medium text-green-600 dark:text-green-400 inline-flex items-center gap-1.5"><Icon name="done" /> Actif</p></div>
          </div>
        )}
      </div>

      {/* Export */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 inline-flex items-center gap-2"><Icon name="chart" className="text-gray-400" />Export des données</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => exportData('excel')} className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-1.5"><Icon name="export" /> Exporter en Excel</button>
          <button onClick={() => exportData('csv')} className="btn-secondary text-sm py-2 px-4 inline-flex items-center gap-1.5"><Icon name="csv" /> Exporter en CSV</button>
        </div>
        {tasks.length > 0 && <p className="text-xs text-gray-500 mt-3">{tasks.length} tâche(s) exportable(s)</p>}
      </div>

      {/* Notifications email */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 inline-flex items-center gap-2"><Icon name="bell" className="text-gray-400" />Notifications par email</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Activer les notifications J-2 / J-3</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Rapport IA des tâches dont l'échéance approche</p>
            </div>
            <button onClick={() => setNotifEnabled(!notifEnabled)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifEnabled ? 'bg-green-600' : 'bg-gray-300'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          {notifEnabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email destinataire</label>
                <input type="email" value={notifEmail} onChange={e => setNotifEmail(e.target.value)} className="input-field" placeholder="exemple@gmail.com" />
              </div>
              <div className="flex gap-3">
                <button onClick={saveNotifSettings} className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-1.5"><Icon name="save" /> Enregistrer</button>
                <button onClick={checkDeadlines} className="btn-secondary text-sm py-2 px-4 inline-flex items-center gap-1.5"><Icon name="search" /> Tester maintenant</button>
              </div>
              {notifChecked && <p className="text-xs text-gray-500">Dernier check: {new Date(notifChecked.date).toLocaleString('fr-FR')} — {notifChecked.count} tâche(s)</p>}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300"><Icon name="info" className="mr-1.5" />Le rapport IA inclut: intitulé, échéance, responsable, statut + résumé global. L'email s'ouvre dans votre client mail pré-rempli.</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* À propos */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 inline-flex items-center gap-2"><Icon name="info" className="text-gray-400" />À propos</h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p><strong>Application :</strong> TaskMN v2.0.0</p>
          <p><strong>Organisation :</strong> M&N Expertise — Natitingou, Bénin</p>
          <p className="inline-flex items-center gap-1.5"><strong>Stockage :</strong> Supabase PostgreSQL (cloud) <Icon name="cloud" className="text-gray-400" /></p>
          <p><strong>IA :</strong> Analyse NLP intégrée (JavaScript)</p>
          <p><strong>Export :</strong> Excel (.xls) + CSV</p>
          <p><strong>Notifications :</strong> Email J-2/J-3 avec rapport IA</p>
        </div>
      </div>
    </div>
  )
}
