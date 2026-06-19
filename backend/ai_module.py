"""
Module d'Intelligence Artificielle pour Point DG
Analyse NLP simple basée sur des règles pour le français :
- Recommandations de priorisation
- Détection de blocages/bouchons
- Résumé de performance
- Actions correctives suggérées
"""
import re
from typing import List, Dict, Optional
from datetime import datetime, timezone


# --- Vocabulaire de blocage ---
BLOCKAGE_PATTERNS = {
    "Ressource indisponible": [
        r"manque de (personnel|ressources?|moyens?)",
        r"absence de",
        r"indisponib",
        r"pas (de |d')",
        r"défaillance",
        r"vacance",
        r"poste vacant",
        r"personnel insuffisant",
    ],
    "Retard administratif": [
        r"attente (de )?(validation|signature|approbation|autorisation|décision)",
        r"procédure (longue|administrative)",
        r"blocage administratif",
        r"en attente de retour",
        r"sans réponse",
        r"délai administratif",
    ],
    "Problème technique": [
        r"problème technique",
        r"panne",
        r"dysfonctionnement",
        r"bug",
        r"erreur système",
        r"problème (informatique|réseau|connexion)",
        r"ne fonctionne pas",
        r"plantage",
    ],
    "Contrainte budgétaire": [
        r"budget insuffisant",
        r"manque de budget",
        r"contrainte budgétaire",
        r"pas de financement",
        r"coût trop élevé",
        r"dépassement",
        r"fonds insuffisants",
    ],
    "Manque d'information": [
        r"information manquante",
        r"données incomplètes",
        r"pas d'information",
        r"documentation (absente|manquante|insuffisante)",
        r"besoin de précision",
        r"clarification nécessaire",
    ],
    "Dépendance externe": [
        r"dépend (de|du) ",
        r"en attente (de|du) ",
        r"bloqué par",
        r"sous-traitant",
        r"partenaire externe",
        r"prestataire",
        r"fournisseur",
    ],
}

SEVERITY_KEYWORDS = {
    "Critique": [r"urgent", r"critique", r"bloquant", r"impossible", r"arrêt total", r"deadline dépassée"],
    "Élevée": [r"important", r"significatif", r"retard accumulé", r"plusieurs semaines", r"impact (élevé|majeur)"],
    "Modérée": [r"mineur", r"léger", r"en cours de résolution", r"solution envisagée", r"résolu prochainement"],
}


def detect_blockages(tasks: List[dict]) -> dict:
    """
    Analyse les observations des tâches pour détecter les blocages.
    """
    blockages = []

    for task in tasks:
        obs = (task.get("observations") or "").lower()
        status = task.get("status", "")

        # Ne pas analyser les tâches déjà réalisées
        if status == "Réalisé":
            continue

        detected_types = []
        for blockage_type, patterns in BLOCKAGE_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, obs):
                    detected_types.append(blockage_type)
                    break

        if detected_types or status == "Bloqué":
            # Déterminer la sévérité
            severity = "Modérée"
            for sev_level, sev_patterns in SEVERITY_KEYWORDS.items():
                for pattern in sev_patterns:
                    if re.search(pattern, obs):
                        severity = sev_level
                        break
                if severity != "Modérée":
                    break

            if status == "Bloqué" and not detected_types:
                detected_types = ["Blocage non spécifié"]

            if detected_types:
                suggestions = generate_blockage_suggestions(detected_types, task)
                blockages.append({
                    "task_id": task["id"],
                    "sequence_number": task.get("sequence_number", 0),
                    "task_description": task.get("task_description", ""),
                    "status": status,
                    "observations": task.get("observations"),
                    "blockage_type": ", ".join(detected_types),
                    "severity": severity,
                    "suggestion": suggestions,
                })

    summary = generate_blockage_summary(blockages)

    return {
        "blockages": blockages,
        "total_blockages": len(blockages),
        "summary": summary,
    }


def generate_blockage_suggestions(blockage_types: List[str], task: dict) -> str:
    suggestions_map = {
        "Ressource indisponible": f"Recruter ou réaffecter du personnel pour la tâche « {task.get('task_description', '')[:60]}... ». Envisager le renforcement de capacités.",
        "Retard administratif": f"Relancer les parties prenantes et escalader si nécessaire. Prévoir un suivi hebdomadaire de la tâche « {task.get('task_description', '')[:60]}... ».",
        "Problème technique": "Contacter le support technique. Documenter le problème et évaluer des solutions alternatives temporaires.",
        "Contrainte budgétaire": "Réviser le budget alloué ou rechercher des financements complémentaires. Prioriser les actions à fort impact.",
        "Manque d'information": "Organiser une réunion de clarification avec les parties prenantes. Collecter les données manquantes.",
        "Dépendance externe": "Contacter le partenaire/prestataire pour un point d'avancement. Établir un plan B en cas de retard prolongé.",
        "Blocage non spécifié": "Planifier une réunion dédiée pour identifier la cause racine du blocage et définir un plan d'action.",
    }
    suggestions = []
    for bt in blockage_types:
        s = suggestions_map.get(bt, "Analyser la cause et définir un plan d'action ciblé.")
        suggestions.append(s)
    return " | ".join(suggestions)


def generate_blockage_summary(blockages: list) -> str:
    if not blockages:
        return "✅ Aucun blocage détecté. Toutes les tâches en cours progressent normalement."

    n = len(blockages)
    crit = sum(1 for b in blockages if b["severity"] == "Critique")
    ele = sum(1 for b in blockages if b["severity"] == "Élevée")

    parts = [f"🔍 {n} blocage(s) détecté(s)."]
    if crit > 0:
        parts.append(f"⚠️ {crit} critique(s) nécessitant une action immédiate.")
    if ele > 0:
        parts.append(f"⚡ {ele} élevée(s) à traiter rapidement.")
    parts.append("Consultez les suggestions détaillées pour chaque blocage.")
    return " ".join(parts)


def prioritize_tasks(tasks: List[dict]) -> dict:
    """
    Suggère des changements de priorité basés sur des règles métier.
    """
    suggestions = []
    urgent_keywords = [
        r"urgent", r"deadline", r"échéance", r"délai (court|court|proche|dépassé)",
        r"priorité absolue", r"critique", r"immédiat", r"dès que possible",
        r"retard", r"en souffrance", r"impératif",
    ]
    low_keywords = [
        r"non prioritaire", r"peut attendre", r"secondaire", r"à long terme",
        r"reporté", r"pas urgent", r"faible priorité", r"optionnel",
    ]
    blocked_indicators = [r"bloqué", r"en attente", r"dépend"]

    for task in tasks:
        current_priority = task.get("priority", "Moyenne")
        desc = (task.get("task_description", "") + " " + (task.get("observations") or "")).lower()
        suggested = current_priority
        reasons = []

        # Détection d'urgence
        urgency_score = 0
        for pattern in urgent_keywords:
            if re.search(pattern, desc):
                urgency_score += 1

        # Détection de faible priorité
        low_score = 0
        for pattern in low_keywords:
            if re.search(pattern, desc):
                low_score += 1

        # Détection de blocage
        for pattern in blocked_indicators:
            if re.search(pattern, desc):
                urgency_score -= 1
                reasons.append("Tâche potentiellement bloquée ou en attente de dépendance")

        if urgency_score >= 2 and current_priority != "Haute":
            suggested = "Haute"
            reasons.insert(0, "Termes d'urgence détectés dans la description")
        elif urgency_score >= 1 and current_priority == "Basse":
            suggested = "Moyenne"
            reasons.insert(0, "Indices d'urgence modérés détectés")
        elif low_score >= 2 and current_priority != "Basse":
            suggested = "Basse"
            reasons.insert(0, "Indices de faible priorité détectés")

        # Tâches sans date d'échéance qui sont en cours depuis longtemps
        if not task.get("due_date") and task.get("status") in ["En cours", "À faire"]:
            if current_priority == "Basse":
                reasons.append("Pas de date d'échéance définie - à planifier")

        if suggested != current_priority or reasons:
            suggestions.append({
                "task_id": task["id"],
                "sequence_number": task.get("sequence_number", 0),
                "task_description": task.get("task_description", ""),
                "current_priority": current_priority,
                "suggested_priority": suggested,
                "reason": "; ".join(reasons) if reasons else "Priorité actuelle confirmée",
            })

    total = len(tasks)
    changes = len([s for s in suggestions if s["suggested_priority"] != s["current_priority"]])

    summary = (
        f"📊 Analyse de {total} tâche(s) terminée. "
        f"{changes} changement(s) de priorité suggéré(s). "
        f"Les recommandations sont basées sur l'analyse sémantique des descriptions et observations."
    )

    return {"suggestions": suggestions, "summary": summary}


def generate_performance_summary(tasks: List[dict]) -> dict:
    """
    Génère un résumé de performance basé sur l'état des tâches.
    """
    total = len(tasks)
    completed = sum(1 for t in tasks if t.get("status") == "Réalisé")
    in_progress = sum(1 for t in tasks if t.get("status") == "En cours")
    blocked = sum(1 for t in tasks if t.get("status") == "Bloqué")
    to_do = sum(1 for t in tasks if t.get("status") == "À faire")
    to_process = sum(1 for t in tasks if t.get("status") == "À traiter")
    to_plan = sum(1 for t in tasks if t.get("status") == "À planifier")

    rate = round(completed / total * 100, 1) if total > 0 else 0

    highlights = []
    concerns = []

    if rate >= 75:
        highlights.append(f"Excellent taux de réalisation : {rate}% des tâches sont terminées.")
    elif rate >= 50:
        highlights.append(f"Bon progrès : {rate}% des tâches terminées. Poursuivez sur cette lancée.")
    else:
        concerns.append(f"Taux de réalisation faible ({rate}%). Une accélération est nécessaire.")

    if completed > 0:
        highlights.append(f"{completed} tâche(s) réalisée(s) avec succès.")

    if in_progress > 0:
        highlights.append(f"{in_progress} tâche(s) en cours d'exécution.")

    if blocked > 0:
        concerns.append(f"{blocked} tâche(s) bloquée(s) nécessitent une attention immédiate.")

    if to_process > 0:
        concerns.append(f"{to_process} tâche(s) en attente de traitement. Priorisez-les rapidement.")

    if to_plan + to_do > total * 0.4:
        concerns.append("Plus de 40% des tâches sont encore à démarrer. Planifiez des sessions de travail dédiées.")

    # Analyse par thème
    themes = {}
    for t in tasks:
        theme = t.get("theme_project", "Non classé")
        if theme not in themes:
            themes[theme] = {"total": 0, "completed": 0}
        themes[theme]["total"] += 1
        if t.get("status") == "Réalisé":
            themes[theme]["completed"] += 1

    weak_themes = []
    for theme, counts in themes.items():
        theme_rate = round(counts["completed"] / counts["total"] * 100, 1) if counts["total"] > 0 else 0
        if theme_rate < 30 and counts["total"] >= 2:
            weak_themes.append(f"{theme} ({theme_rate}%)")

    if weak_themes:
        concerns.append(f"Thèmes à faible progression : {', '.join(weak_themes)}.")

    summary_text = generate_narrative_summary(total, completed, rate, highlights, concerns)

    return {
        "period": datetime.now(timezone.utc).strftime("%d/%m/%Y"),
        "total_tasks": total,
        "completed": completed,
        "completion_rate": rate,
        "highlights": highlights,
        "concerns": concerns,
        "summary_text": summary_text,
    }


def generate_narrative_summary(total: int, completed: int, rate: float, highlights: list, concerns: list) -> str:
    parts = [f"📋 Point DG — État des lieux au {datetime.now(timezone.utc).strftime('%d/%m/%Y')}."]
    parts.append(f"Sur {total} tâches suivies, {completed} sont réalisées, soit un taux de complétion de {rate}%.")

    if highlights:
        parts.append("✅ Points forts : " + " ".join(highlights))
    if concerns:
        parts.append("⚠️ Points d'attention : " + " ".join(concerns))

    return "\n".join(parts)


def generate_recommendations(tasks: List[dict]) -> dict:
    """
    Génère des recommandations correctives basées sur l'analyse globale.
    """
    recommendations = []
    total = len(tasks)
    completed = sum(1 for t in tasks if t.get("status") == "Réalisé")
    blocked = sum(1 for t in tasks if t.get("status") == "Bloqué")
    high_priority_todo = sum(
        1 for t in tasks
        if t.get("priority") == "Haute" and t.get("status") in ["À faire", "À traiter"]
    )
    no_due_date = sum(1 for t in tasks if not t.get("due_date") and t.get("status") != "Réalisé")

    # Identifier les tâches concernées
    blocked_ids = [t["id"] for t in tasks if t.get("status") == "Bloqué"]
    high_prio_ids = [
        t["id"] for t in tasks
        if t.get("priority") == "Haute" and t.get("status") in ["À faire", "À traiter"]
    ]
    no_date_ids = [
        t["id"] for t in tasks
        if not t.get("due_date") and t.get("status") != "Réalisé"
    ]

    # 1. Priorisation
    if high_priority_todo > 0:
        recommendations.append({
            "category": "Priorisation",
            "recommendation": f"{high_priority_todo} tâche(s) de haute priorité en attente. Planifiez une réunion de priorisation cette semaine pour les lancer.",
            "priority": "Haute",
            "target_tasks": high_prio_ids,
        })

    if completed < total * 0.5:
        recommendations.append({
            "category": "Priorisation",
            "recommendation": "Le taux de complétion est inférieur à 50%. Concentrez les efforts sur les tâches à fort impact et réévaluez les priorités.",
            "priority": "Haute",
            "target_tasks": [t["id"] for t in tasks if t.get("status") in ["En cours"]],
        })

    # 2. Ressources
    if blocked > 0:
        recommendations.append({
            "category": "Ressources",
            "recommendation": f"{blocked} tâche(s) bloquée(s). Organisez une session de déblocage (war room) avec les responsables pour identifier et résoudre les obstacles.",
            "priority": "Haute" if blocked > 2 else "Moyenne",
            "target_tasks": blocked_ids,
        })

    # 3. Suivi
    if no_due_date > 0:
        recommendations.append({
            "category": "Suivi",
            "recommendation": f"{no_due_date} tâche(s) sans date d'échéance. Attribuez des dates butoirs pour améliorer le suivi et la redevabilité.",
            "priority": "Moyenne",
            "target_tasks": no_date_ids,
        })

    recommendations.append({
        "category": "Suivi",
        "recommendation": "Mettre en place un point de suivi hebdomadaire (30 min) pour passer en revue les tâches en cours et les blocages.",
        "priority": "Moyenne",
        "target_tasks": [],
    })

    # 4. Organisation
    completed_tasks = [t for t in tasks if t.get("status") == "Réalisé"]
    if completed_tasks:
        recommendations.append({
            "category": "Organisation",
            "recommendation": f"Célébrez les {len(completed_tasks)} tâches réalisées ! Documentez les bonnes pratiques pour les partager avec l'équipe.",
            "priority": "Basse",
            "target_tasks": [t["id"] for t in completed_tasks[:5]],
        })

    recommendations.append({
        "category": "Organisation",
        "recommendation": "Standardisez la mise à jour hebdomadaire des observations pour améliorer la traçabilité et faciliter les analyses futures.",
        "priority": "Basse",
        "target_tasks": [],
    })

    summary = (
        f"📌 {len(recommendations)} recommandations générées : "
        f"{sum(1 for r in recommendations if r['priority'] == 'Haute')} haute(s), "
        f"{sum(1 for r in recommendations if r['priority'] == 'Moyenne')} moyenne(s), "
        f"{sum(1 for r in recommendations if r['priority'] == 'Basse')} basse(s)."
    )

    return {"recommendations": recommendations, "summary": summary}
