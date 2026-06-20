# 📋 Point DG — Application de Gestion de Tâches

**M&N Expertise — Natitingou, Bénin**

Application mobile de suivi des tâches pour le Point du Directeur Général (Point DG). Solution complète avec tableau de bord, gestion de tâches, analyses synthétiques et module d'intelligence artificielle pour l'aide à la décision.

---

## 🌟 Fonctionnalités

### 📊 Tableau de Bord
- KPIs en temps réel (Total, Réalisées, En cours, Bloquées)
- Barre de progression du taux de complétion
- Filtres rapides par statut, priorité et thème
- Liste des tâches récentes avec code couleur

### 📋 Gestion des Tâches
- Création, modification et suppression de tâches
- 17 tâches initiales importées du fichier Excel Point DG
- Filtrage avancé multi-critères
- Recherche textuelle
- Tri par colonne
- Vue tableau ou cartes (responsive)
- Export Excel / CSV
- Historique des modifications par tâche

### 📈 Synthèse & Analytique
- Graphique à barres : Répartition par statut
- Graphique circulaire : Répartition par priorité
- Tableau : Taux de complétion par thème/projet
- Indicateurs visuels avec code couleur

### 🤖 Module IA
- **Priorisation intelligente** : Analyse sémantique pour suggérer des changements de priorité
- **Détection de blocages** : Identification automatique des goulets d'étranglement dans les observations
- **Résumé de performance** : Génération automatique d'un rapport narratif
- **Recommandations** : Suggestions d'actions correctives par catégorie

### ⚙️ Administration
- Gestion des utilisateurs (Admin, Manager, Viewer)
- Contrôle d'accès par rôle
- Mode sombre/clair
- Interface adaptée mobile (responsive design)

---

## 🏗️ Architecture Technique

| Couche | Technologie |
|--------|------------|
| **Frontend** | React 18 + Vite + TailwindCSS |
| **Backend** | FastAPI (Python 3.10+) |
| **Base de données** | SQLite (via SQLAlchemy ORM) |
| **Graphiques** | Recharts |
| **IA/NLP** | Module Python d'analyse de texte français |
| **Authentification** | JWT (JSON Web Tokens) |
| **Export** | openpyxl (Excel) + csv |

---

## 📁 Structure du Projet

```
point-dg-app/
├── backend/
│   ├── main.py           # Application FastAPI (routes, endpoints)
│   ├── models.py         # Modèles SQLAlchemy (tables)
│   ├── schemas.py        # Schémas Pydantic (validation)
│   ├── database.py       # Configuration base de données
│   ├── crud.py           # Opérations CRUD + règles métier
│   ├── ai_module.py      # Module IA (NLP, analyse, recommandations)
│   ├── seed_data.py      # Données initiales (17 tâches Excel)
│   ├── requirements.txt  # Dépendances Python
│   └── run.py            # Script de démarrage
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # Routage principal
│   │   ├── main.jsx      # Point d'entrée React
│   │   ├── index.css     # Styles Tailwind + composants
│   │   ├── api/
│   │   │   └── client.js # Client API (fetch wrapper)
│   │   ├── components/
│   │   │   ├── Layout.jsx        # Navigation + sidebar responsive
│   │   │   ├── TaskCard.jsx      # Carte de tâche
│   │   │   ├── StatusBadge.jsx   # Badge de statut coloré
│   │   │   ├── PriorityBadge.jsx # Badge de priorité
│   │   │   ├── KpiCard.jsx       # Carte indicateur
│   │   │   └── FilterBar.jsx     # Barre de filtres
│   │   └── pages/
│   │       ├── Dashboard.jsx     # Tableau de bord
│   │       ├── TaskList.jsx      # Liste des tâches
│   │       ├── TaskForm.jsx      # Formulaire création/édition
│   │       ├── Synthesis.jsx     # Graphiques et analyses
│   │       ├── AIInsights.jsx    # Insights IA
│   │       ├── Settings.jsx      # Paramètres / Utilisateurs
│   │       └── Login.jsx         # Connexion
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── start.bat            # Script de démarrage Windows
├── start.sh             # Script de démarrage Linux/Mac
└── README.md            # Documentation
```

---

## 🚀 Installation et Démarrage

### Prérequis
- **Python 3.10+** avec pip
- **Node.js 18+** avec npm
- Windows, Mac ou Linux

### Option 1 : Démarrage automatique

**Windows :**
```batch
start.bat
```

**Linux / Mac :**
```bash
chmod +x start.sh
./start.sh
```

### Option 2 : Démarrage manuel

**1. Backend (FastAPI) :**
```bash
cd backend
pip install -r requirements.txt
python run.py
```
Le backend démarre sur `http://localhost:8000`
Documentation API : `http://localhost:8000/docs`

**2. Frontend (React + Vite) :**
```bash
cd frontend
npm install
npm run dev
```
Le frontend démarre sur `http://localhost:5173`

---

## 🔑 Comptes de Démonstration

| Nom d'utilisateur | Mot de passe | Rôle | Accès |
|-------------------|-------------|------|-------|
| `admin` | `admin123` | Administrateur | Tous les accès + gestion utilisateurs |
| `dg` | `dg123456` | Manager | CRUD tâches + analyses + IA |
| `assistant` | `assist123` | Manager | CRUD tâches + analyses + IA |
| `consultant` | `consult123` | Viewer | Lecture seule |

---

## 📊 Données Initiales (Seed)

L'application démarre avec **17 tâches** correspondant au fichier Excel Point DG :

| # | Thème | Responsable |
|---|-------|-------------|
| 1-3 | Cabinet – Retraite | Chantal Sossou, Nicaise Degbo |
| 4-5 | Communication / Multimédia | Bertrand Tinguini |
| 6-7 | Fabrice Kopore | Fabrice Kopore |
| 8-9 | Florentine / SNV | Florentine Toukourou |
| 10-11 | Facilitateurs(ce) SNV / Rapports | Mariam Bio |
| 12 | Situation de référence Microentrepreneur C2 | Romaric Gbaguidi |
| 13 | Maguerite | Maguerite Sounouvou |
| 14 | Formation S&E et IA intégré | Bertrand Tinguini |
| 15-16 | Formation en EIES | Dr. Yvette M'Po |
| 17 | Mail Professionnel | Bertrand Tinguini |

---

## 🎨 Guide des Couleurs

| Statut | Couleur | Code |
|--------|---------|------|
| ✅ Réalisé | Vert | `#16a34a` |
| 🔄 En cours | Bleu | `#2563eb` |
| 📝 À faire | Jaune | `#ca8a04` |
| 📥 À traiter | Orange | `#ea580c` |
| 🚫 Bloqué | Rouge | `#dc2626` |
| 📅 À planifier | Gris | `#6b7280` |

| Priorité | Couleur |
|----------|---------|
| 🔴 Haute | Rouge |
| 🟡 Moyenne | Jaune |
| 🟢 Basse | Vert |

---

## 🤖 Module IA — Fonctionnement

Le module IA utilise des techniques NLP simples mais efficaces :

1. **Priorisation** : Détection de mots-clés d'urgence/priorité dans les descriptions et observations (français)
2. **Blocages** : Scan des observations avec patterns regex pour 6 catégories de blocages
3. **Résumé** : Agrégation statistique + génération narrative contextuelle
4. **Recommandations** : Règles métier basées sur l'état global des tâches

---

## 🔒 Règles Métier

### Transitions de Statut autorisées
- À faire → En cours, Bloqué, À planifier
- En cours → Réalisé, Bloqué, À faire
- À traiter → En cours, Bloqué, À faire
- À planifier → À faire, En cours, Bloqué
- Réalisé → Bloqué (réouverture)
- Bloqué → À faire, En cours, À traiter, À planifier (déblocage)

### Validations
- Numéro de séquence unique
- Priorité : Haute, Moyenne ou Basse uniquement
- Champs obligatoires : thème, description, responsable, statut, priorité
- Date format YYYY-MM-DD

---

## 📱 Mode Hors-ligne (PWA)

L'application inclut un manifest pour une installation en tant que Progressive Web App (PWA) sur mobile :

1. Ouvrez l'application dans le navigateur mobile
2. Appuyez sur « Ajouter à l'écran d'accueil »
3. L'application s'ouvrira en plein écran comme une app native

---

## 🛠️ Développement

### API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET/POST | `/api/tasks` | Liste / Création de tâches |
| GET/PUT/DELETE | `/api/tasks/{id}` | Détail / Mise à jour / Suppression |
| GET | `/api/tasks/{id}/history` | Historique des modifications |
| GET | `/api/tasks/export` | Export CSV/Excel |
| GET | `/api/dashboard` | Données du tableau de bord |
| GET | `/api/synthesis/status` | Distribution par statut |
| GET | `/api/synthesis/priority` | Distribution par priorité |
| GET | `/api/synthesis/themes` | Complétion par thème |
| POST | `/api/ai/prioritize` | Suggestions de priorisation |
| POST | `/api/ai/detect-blockages` | Détection de blocages |
| POST | `/api/ai/summary` | Résumé de performance |
| POST | `/api/ai/recommendations` | Recommandations |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/register` | Inscription |
| GET | `/api/users` | Liste des utilisateurs (admin) |
| PUT | `/api/users/{id}/role` | Changer le rôle (admin) |
| DELETE | `/api/users/{id}` | Supprimer un utilisateur (admin) |

---

## 📝 Licence

Application développée pour **M&N Expertise — Natitingou, Bénin**.

© 2026 Point DG. Tous droits réservés.
