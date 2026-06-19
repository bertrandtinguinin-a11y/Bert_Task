/**
 * IA Module — Version JavaScript
 * Analyse NLP des tâches : priorisation, blocages, résumés, recommandations
 * Port du module Python ai_module.py
 */

const BLOCKAGE_PATTERNS = {
  "Ressource indisponible": [
    /manque de (personnel|ressources?|moyens?)/i, /absence de/i, /indisponib/i,
    /pas (de |d')/i, /défaillance/i, /vacance/i, /poste vacant/i,
  ],
  "Retard administratif": [
    /attente (de )?(validation|signature|approbation|autorisation|décision)/i,
    /procédure (longue|administrative)/i, /blocage administratif/i,
    /en attente de retour/i, /sans réponse/i,
  ],
  "Problème technique": [
    /problème technique/i, /panne/i, /dysfonctionnement/i, /bug/i,
    /erreur système/i, /ne fonctionne pas/i,
  ],
  "Contrainte budgétaire": [
    /budget insuffisant/i, /manque de budget/i, /contrainte budgétaire/i,
    /pas de financement/i, /coût trop élevé/i, /fonds insuffisants/i,
  ],
  "Manque d'information": [
    /information manquante/i, /données incomplètes/i, /pas d'information/i,
    /documentation (absente|manquante)/i, /clarification nécessaire/i,
  ],
  "Dépendance externe": [
    /dépend (de|du) /i, /en attente (de|du) /i, /bloqué par/i,
    /sous-traitant/i, /partenaire externe/i, /prestataire/i, /fournisseur/i,
  ],
}

const SEVERITY_KEYWORDS = {
  "Critique": [/urgent/i, /critique/i, /bloquant/i, /impossible/i, /arrêt total/i],
  "Élevée": [/important/i, /significatif/i, /retard accumulé/i, /impact (élevé|majeur)/i],
  "Modérée": [/mineur/i, /léger/i, /en cours de résolution/i, /résolu prochainement/i],
}

const URGENT_KEYWORDS = [
  /urgent/i, /deadline/i, /échéance/i, /délai (court|proche|dépassé)/i,
  /priorité absolue/i, /critique/i, /immédiat/i, /dès que possible/i, /retard/i,
]

const LOW_KEYWORDS = [
  /non prioritaire/i, /peut attendre/i, /secondaire/i, /à long terme/i,
  /reporté/i, /pas urgent/i, /faible priorité/i, /optionnel/i,
]

export function detectBlockages(tasks) {
  const blockages = []
  for (const task of tasks) {
    const obs = (task.observations || "").toLowerCase()
    const status = task.status || ""
    if (status === "Réalisé") continue

    const detectedTypes = []
    for (const [type, patterns] of Object.entries(BLOCKAGE_PATTERNS)) {
      for (const p of patterns) {
        if (p.test(obs)) { detectedTypes.push(type); break }
      }
    }

    if (detectedTypes.length > 0 || status === "Bloqué") {
      let severity = "Modérée"
      for (const [level, patterns] of Object.entries(SEVERITY_KEYWORDS)) {
        for (const p of patterns) {
          if (p.test(obs)) { severity = level; break }
        }
        if (severity !== "Modérée") break
      }
      if (status === "Bloqué" && detectedTypes.length === 0) detectedTypes.push("Blocage non spécifié")

      const suggestions = {
        "Ressource indisponible": "Recruter ou réaffecter du personnel. Envisager le renforcement de capacités.",
        "Retard administratif": "Relancer les parties prenantes et escalader si nécessaire.",
        "Problème technique": "Contacter le support technique. Évaluer des solutions alternatives.",
        "Contrainte budgétaire": "Réviser le budget ou rechercher des financements complémentaires.",
        "Manque d'information": "Organiser une réunion de clarification. Collecter les données manquantes.",
        "Dépendance externe": "Contacter le partenaire pour un point d'avancement. Établir un plan B.",
        "Blocage non spécifié": "Planifier une réunion pour identifier la cause racine et définir un plan d'action.",
      }

      blockages.push({
        task_id: task.id, sequence_number: task.sequence_number,
        task_description: task.task_description, status,
        observations: task.observations,
        blockage_type: detectedTypes.join(", "), severity,
        suggestion: detectedTypes.map(t => suggestions[t] || "Analyser et définir un plan d'action.").join(" | "),
      })
    }
  }

  const n = blockages.length
  const crit = blockages.filter(b => b.severity === "Critique").length
  const summary = n === 0
    ? "✅ Aucun blocage détecté. Toutes les tâches en cours progressent normalement."
    : `🔍 ${n} blocage(s) détecté(s). ${crit > 0 ? `⚠️ ${crit} critique(s). ` : ""}Consultez les suggestions détaillées.`

  return { blockages, total_blockages: n, summary }
}

export function prioritizeTasks(tasks) {
  const suggestions = []
  for (const task of tasks) {
    const current = task.priority || "Moyenne"
    const desc = ((task.task_description || "") + " " + (task.observations || "")).toLowerCase()
    let suggested = current
    const reasons = []

    let urgencyScore = 0
    for (const p of URGENT_KEYWORDS) if (p.test(desc)) urgencyScore++
    let lowScore = 0
    for (const p of LOW_KEYWORDS) if (p.test(desc)) lowScore++

    if (urgencyScore >= 2 && current !== "Haute") {
      suggested = "Haute"; reasons.unshift("Termes d'urgence détectés")
    } else if (urgencyScore >= 1 && current === "Basse") {
      suggested = "Moyenne"; reasons.unshift("Indices d'urgence modérés")
    } else if (lowScore >= 2 && current !== "Basse") {
      suggested = "Basse"; reasons.unshift("Indices de faible priorité")
    }

    if (!task.due_date && ["En cours", "À faire"].includes(task.status) && current === "Basse") {
      reasons.push("Pas de date d'échéance — à planifier")
    }

    if (suggested !== current || reasons.length > 0) {
      suggestions.push({
        task_id: task.id, sequence_number: task.sequence_number,
        task_description: task.task_description,
        current_priority: current, suggested_priority: suggested,
        reason: reasons.length > 0 ? reasons.join("; ") : "Priorité confirmée",
      })
    }
  }

  const changes = suggestions.filter(s => s.suggested_priority !== s.current_priority).length
  return {
    suggestions,
    summary: `📊 Analyse de ${tasks.length} tâche(s). ${changes} changement(s) de priorité suggéré(s).`,
  }
}

export function generatePerformanceSummary(tasks) {
  const total = tasks.length
  const completed = tasks.filter(t => t.status === "Réalisé").length
  const inProgress = tasks.filter(t => t.status === "En cours").length
  const blocked = tasks.filter(t => t.status === "Bloqué").length
  const toProcess = tasks.filter(t => t.status === "À traiter").length
  const rate = total > 0 ? Math.round(completed / total * 1000) / 10 : 0

  const highlights = [], concerns = []
  if (rate >= 75) highlights.push(`Excellent taux de réalisation : ${rate}%`)
  else if (rate >= 50) highlights.push(`Bon progrès : ${rate}% des tâches terminées`)
  else concerns.push(`Taux de réalisation faible (${rate}%). Accélération nécessaire.`)
  if (completed > 0) highlights.push(`${completed} tâche(s) réalisée(s) avec succès`)
  if (inProgress > 0) highlights.push(`${inProgress} tâche(s) en cours`)
  if (blocked > 0) concerns.push(`${blocked} tâche(s) bloquée(s) — attention immédiate`)
  if (toProcess > 0) concerns.push(`${toProcess} tâche(s) en attente de traitement`)

  // Analyse par thème
  const themes = {}
  for (const t of tasks) {
    if (!themes[t.theme_project]) themes[t.theme_project] = { total: 0, completed: 0 }
    themes[t.theme_project].total++
    if (t.status === "Réalisé") themes[t.theme_project].completed++
  }
  const weakThemes = Object.entries(themes)
    .filter(([_, v]) => v.total >= 2 && (v.completed / v.total) < 0.3)
    .map(([k, v]) => `${k} (${Math.round(v.completed / v.total * 100)}%)`)
  if (weakThemes.length > 0) concerns.push(`Thèmes à faible progression : ${weakThemes.join(", ")}`)

  const summaryText = `📋 Point DG — ${total} tâches suivies, ${completed} réalisées (${rate}%). ` +
    (highlights.length > 0 ? "✅ " + highlights.join(" ") + " " : "") +
    (concerns.length > 0 ? "⚠️ " + concerns.join(" ") : "")

  return {
    period: new Date().toLocaleDateString("fr-FR"),
    total_tasks: total, completed, completion_rate: rate,
    highlights, concerns, summary_text: summaryText,
  }
}

export function generateRecommendations(tasks) {
  const recommendations = []
  const total = tasks.length
  const completed = tasks.filter(t => t.status === "Réalisé").length
  const blocked = tasks.filter(t => t.status === "Bloqué")
  const highTodo = tasks.filter(t => t.priority === "Haute" && ["À faire", "À traiter"].includes(t.status))
  const noDueDate = tasks.filter(t => !t.due_date && t.status !== "Réalisé")

  if (highTodo.length > 0) {
    recommendations.push({
      category: "Priorisation", priority: "Haute",
      recommendation: `${highTodo.length} tâche(s) haute priorité en attente. Planifiez une réunion de priorisation cette semaine.`,
      target_tasks: highTodo.map(t => t.id),
    })
  }
  if (completed < total * 0.5) {
    recommendations.push({
      category: "Priorisation", priority: "Haute",
      recommendation: "Taux de complétion < 50%. Concentrez les efforts sur les tâches à fort impact.",
      target_tasks: tasks.filter(t => t.status === "En cours").map(t => t.id),
    })
  }
  if (blocked.length > 0) {
    recommendations.push({
      category: "Ressources", priority: blocked.length > 2 ? "Haute" : "Moyenne",
      recommendation: `${blocked.length} tâche(s) bloquée(s). Organisez une session de déblocage avec les responsables.`,
      target_tasks: blocked.map(t => t.id),
    })
  }
  if (noDueDate.length > 0) {
    recommendations.push({
      category: "Suivi", priority: "Moyenne",
      recommendation: `${noDueDate.length} tâche(s) sans date d'échéance. Attribuez des dates butoirs.`,
      target_tasks: noDueDate.map(t => t.id),
    })
  }
  recommendations.push({
    category: "Suivi", priority: "Moyenne",
    recommendation: "Mettre en place un point de suivi hebdomadaire (30 min).",
    target_tasks: [],
  })
  if (completed > 0) {
    recommendations.push({
      category: "Organisation", priority: "Basse",
      recommendation: `Célébrez les ${completed} tâches réalisées ! Documentez les bonnes pratiques.`,
      target_tasks: tasks.filter(t => t.status === "Réalisé").slice(0, 5).map(t => t.id),
    })
  }

  return {
    recommendations,
    summary: `📌 ${recommendations.length} recommandations : ${recommendations.filter(r => r.priority === "Haute").length} haute(s), ${recommendations.filter(r => r.priority === "Moyenne").length} moyenne(s), ${recommendations.filter(r => r.priority === "Basse").length} basse(s).`,
  }
}
