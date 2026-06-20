/**
 * API Client — Supabase Auth Edition
 * Authentification via Supabase Auth (Google OAuth + Email/Password)
 * Données CRUD via Supabase
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://icwnwahtrasxobebqvcr.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_mc5TKG02OJDL2iLN7lXNJg_GaB51IW3'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ============================================================
// AUTH — Supabase Auth (Google + Email/Password)
// ============================================================
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/',
      queryParams: { access_type: 'offline', prompt: 'consent' },
    }
  })
  if (error) throw error
  return data
}

export async function signUp(email, password, username) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, role: 'viewer' },
      emailRedirectTo: window.location.origin + '/',
    }
  })
  if (error) throw error
  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export function getUser() {
  return supabase.auth.getUser()
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session?.user || null)
  })
}

export function getSession() {
  return supabase.auth.getSession()
}

// ============================================================
// TASKS — CRUD direct Supabase
// ============================================================
export async function fetchTasks(filters = {}) {
  let query = supabase.from('tasks').select('*')
  
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.priority) query = query.eq('priority', filters.priority)
  if (filters.theme) query = query.ilike('theme_project', `%${filters.theme}%`)
  if (filters.search) {
    query = query.or(`task_description.ilike.%${filters.search}%,responsible_person.ilike.%${filters.search}%,observations.ilike.%${filters.search}%`)
  }
  
  const sortBy = filters.sort_by || 'sequence_number'
  const ascending = filters.sort_order !== 'desc'
  query = query.order(sortBy, { ascending })
  
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export async function fetchTask(id) {
  const { data, error } = await supabase.from('tasks').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  return data
}

export async function createTask(taskData) {
  const { data, error } = await supabase.from('tasks').insert([taskData]).select()
  if (error) throw new Error(error.message)
  return data[0]
}

export async function updateTask(id, updates) {
  const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select()
  if (error) throw new Error(error.message)
  return data[0]
}

export async function deleteTask(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function fetchTaskHistory(id) {
  const { data, error } = await supabase.from('task_history').select('*').eq('task_id', id).order('changed_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

// ============================================================
// DASHBOARD & SYNTHESIS
// ============================================================
export async function fetchDashboard() {
  const { data: tasks, error } = await supabase.from('tasks').select('*')
  if (error) throw new Error(error.message)
  
  const total = tasks.length
  const completed = tasks.filter(t => t.status === 'Réalisé').length
  const inProgress = tasks.filter(t => t.status === 'En cours').length
  const blocked = tasks.filter(t => t.status === 'Bloqué').length
  
  const statusCounts = {}
  tasks.forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1 })
  const byStatus = Object.entries(statusCounts).map(([status, count]) => ({
    status, count, percentage: Math.round(count / Math.max(total, 1) * 1000) / 10
  })).sort((a, b) => b.count - a.count)
  
  const priCounts = {}
  tasks.forEach(t => { priCounts[t.priority] = (priCounts[t.priority] || 0) + 1 })
  const byPriority = Object.entries(priCounts).map(([priority, count]) => ({
    priority, count, percentage: Math.round(count / Math.max(total, 1) * 1000) / 10
  })).sort((a, b) => b.count - a.count)
  
  const recent = [...tasks].sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || '')).slice(0, 10)
  
  return {
    total_tasks: total, completed, in_progress: inProgress, blocked,
    completion_rate: Math.round(completed / Math.max(total, 1) * 1000) / 10,
    by_status: byStatus, by_priority: byPriority, recent_tasks: recent,
  }
}

export async function fetchStatusDistribution() {
  const { data: tasks, error } = await supabase.from('tasks').select('status')
  if (error) throw new Error(error.message)
  const counts = {}
  tasks.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1 })
  const total = Math.max(tasks.length, 1)
  return Object.entries(counts).map(([status, count]) => ({
    status, count, percentage: Math.round(count / total * 1000) / 10
  })).sort((a, b) => b.count - a.count)
}

export async function fetchPriorityDistribution() {
  const { data: tasks, error } = await supabase.from('tasks').select('priority')
  if (error) throw new Error(error.message)
  const counts = {}
  tasks.forEach(t => { counts[t.priority] = (counts[t.priority] || 0) + 1 })
  const total = Math.max(tasks.length, 1)
  return Object.entries(counts).map(([priority, count]) => ({
    priority, count, percentage: Math.round(count / total * 1000) / 10
  })).sort((a, b) => b.count - a.count)
}

export async function fetchThemeCompletion() {
  const { data: tasks, error } = await supabase.from('tasks').select('theme_project,status')
  if (error) throw new Error(error.message)
  const themes = {}
  tasks.forEach(t => {
    if (!themes[t.theme_project]) themes[t.theme_project] = { total: 0, completed: 0 }
    themes[t.theme_project].total++
    if (t.status === 'Réalisé') themes[t.theme_project].completed++
  })
  return Object.entries(themes).map(([theme, v]) => ({
    theme, total: v.total, completed: v.completed,
    completion_rate: v.total > 0 ? Math.round(v.completed / v.total * 1000) / 10 : 0,
  })).sort((a, b) => a.theme.localeCompare(b.theme))
}

// AI — Exécuté directement dans le navigateur (pas de backend nécessaire)
import { prioritizeTasks as aiPrioritize, detectBlockages as aiBlockages, generatePerformanceSummary as aiSummary, generateRecommendations as aiRecs } from './ai.js'

export async function fetchAIPrioritize(tasks) { return aiPrioritize(tasks) }
export async function fetchAIBlockages(tasks) { return aiBlockages(tasks) }
export async function fetchAISummary(tasks) { return aiSummary(tasks) }
export async function fetchAIRecommendations(tasks) { return aiRecs(tasks) }

// Users
export async function fetchUsers() {
  // Supabase Auth ne stocke pas dans la table users custom
  // On utilise la table users existante si elle a encore des données
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false })
  if (error) return []
  return data
}

// Realtime
export function subscribeToTasks(onInsert, onUpdate, onDelete) {
  return supabase
    .channel('tasks-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, payload => onInsert?.(payload.new))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' }, payload => onUpdate?.(payload.new, payload.old))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tasks' }, payload => onDelete?.(payload.old))
    .subscribe()
}

// Seed tasks into Supabase
export async function seedTasks() {
  const { data: existing } = await supabase.from('tasks').select('count')
  if (existing?.[0]?.count > 0) return { success: true, message: `Déjà ${existing[0].count} tâches` }

  const tasks = [
    { sequence_number: 1, theme_project: "Cabinet – Retraite", task_description: "Organiser une retraite pour faire le point du cabinet", responsible_person: "Paulin, Victorine et Arnaud", status: "À traiter", priority: "Haute", observations: "Les TDR sont transmis au DG pour examen et validation" },
    { sequence_number: 2, theme_project: "Cabinet – Retraite", task_description: "Définir la période de la retraite", responsible_person: "Paulin, Victorine et Arnaud", status: "Réalisé", priority: "Haute", observations: "" },
    { sequence_number: 3, theme_project: "Cabinet – Retraite", task_description: "Définir le lieu de la retraite", responsible_person: "Paulin, Victorine et Arnaud", status: "Réalisé", priority: "Moyenne", observations: "" },
    { sequence_number: 4, theme_project: "Cabinet – Retraite", task_description: "Faire le budget pour la retraite", responsible_person: "Paulin, Victorine et Arnaud", status: "Réalisé", priority: "Haute", observations: "" },
    { sequence_number: 5, theme_project: "Mail Professionnel", task_description: "Création de mail projet", responsible_person: "S&E", status: "Réalisé", priority: "Haute", observations: "" },
    { sequence_number: 6, theme_project: "Communication / Multimédia", task_description: "Partager les photos et vidéos de Cobly", responsible_person: "Moutakilou", status: "En cours", priority: "Moyenne", observations: "" },
    { sequence_number: 7, theme_project: "Communication / Multimédia", task_description: "Manuel : voir les messages clé", responsible_person: "Moutakilou", status: "En cours", priority: "Moyenne", observations: "" },
    { sequence_number: 8, theme_project: "Communication / Multimédia", task_description: "Traduire les messages en langue locale", responsible_person: "Moutakilou", status: "À faire", priority: "Moyenne", observations: "" },
    { sequence_number: 9, theme_project: "Fabrice Kopore", task_description: "photos Helvetas – Natitingou & Toucountouna", responsible_person: "RSE", status: "Réalisé", priority: "Haute", observations: "" },
    { sequence_number: 10, theme_project: "Florentine / SNV", task_description: "Traiter la demande envoyée par Florentine (SNV)", responsible_person: "Victorine/sup YOKOSSI", status: "Réalisé", priority: "Haute", observations: "" },
    { sequence_number: 11, theme_project: "Facilitateurs(ce) SNV / Rapports", task_description: "Que les Facilitateurs(ce) réalisent leur rapport", responsible_person: "Facilitateurs(ce)/Sup/RSE", status: "Réalisé", priority: "Haute", observations: "" },
    { sequence_number: 12, theme_project: "Facilitateurs(ce) SNV / Rapports", task_description: "Inclure activités prévues et réalisées dans le rapport", responsible_person: "Facilitateurs(ce)", status: "Réalisé", priority: "Haute", observations: "" },
    { sequence_number: 13, theme_project: "Facilitateurs(ce) SNV / Rapports", task_description: "Documenter les difficultés rencontrées et solutions", responsible_person: "Facilitateurs(ce)", status: "Réalisé", priority: "Moyenne", observations: "" },
    { sequence_number: 14, theme_project: "Situation de référence Formation Microentrepreneur C2", task_description: "Compiler les données du pré-test et du post-test", responsible_person: "S&E", status: "Réalisé", priority: "Haute", observations: "" },
    { sequence_number: 15, theme_project: "Maguerite", task_description: "Prendre renseignements sur le décès du parent de Marguérite", responsible_person: "Paulin", status: "Réalisé", priority: "Haute", due_date: "2026-06-27", observations: "Les obsèques auront lieu à Djougou le 27 Juin 2026. Un pagne d'une valeur de 7 500 FCFA est mis en vente comme uniforme" },
    { sequence_number: 16, theme_project: "Formation en S&E et IA intégré", task_description: "Activer la formation en S&E au plus tard en juillet", responsible_person: "S&E", status: "En cours", priority: "Haute", observations: "" },
    { sequence_number: 17, theme_project: "Formation en EIES", task_description: "Activer la formation en EIES", responsible_person: "Arnaud/Florentine", status: "En cours", priority: "Moyenne", observations: "" },
  ]
  for (const t of tasks) {
    await supabase.from('tasks').insert(t)
  }
  return { success: true, message: `17 tâches importées !` }
}

// Helper for sync access (used by legacy components)
export function getCachedUser() {
  try {
    const raw = localStorage.getItem('sb-icwnwahtrasxobebqvcr-auth-token')
    if (raw) {
      const parsed = JSON.parse(raw)
      return parsed?.user || null
    }
  } catch {}
  return null
}

export { supabase }

// Users management (simplified)
export async function updateUserRole(userId, role) {
  const { error } = await supabase.from('users').update({ role }).eq('id', userId)
  if (error) throw new Error(error.message)
}
export async function deleteUser(userId) {
  const { error } = await supabase.from('users').delete().eq('id', userId)
  if (error) throw new Error(error.message)
}
