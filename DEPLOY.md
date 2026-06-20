# Déploiement (Vercel + Supabase) — checklist

Stack 100 % gratuit : frontend statique (Vite) sur Vercel + Supabase (auth + DB).
Le dossier `backend/` (FastAPI) est **obsolète** et ignoré par Vercel.

## 1. Vercel
- Importer le repo. Laisser les réglages par défaut (`vercel.json` build le frontend).
- **NE PAS** définir `VITE_BASE_URL` (sinon page blanche ; c'était pour GitHub Pages).
- Aucune autre variable d'env nécessaire (Supabase est dans `frontend/src/api/client.js`).

## 2. Supabase — Sécurité (OBLIGATOIRE)
- Exécuter une fois `supabase/migrations/0001_rls_multitenant.sql`
  dans **SQL Editor**. Active l'isolation des données par compte (RLS).
  Sans ça, la clé publique laisse lire toutes les données.

## 3. Supabase — Auth
- **Authentication → URL Configuration**
  - *Site URL* = URL Vercel (ex. `https://bert-task.vercel.app`)
  - *Redirect URLs* += `https://bert-task.vercel.app/**`
- **Authentication → Providers → Email**
  - Décocher *Confirm email* (sinon erreur `Email not confirmed` au login),
    ou confirmer manuellement chaque user dans Authentication → Users.
- Google OAuth (optionnel) : ajouter
  `https://<projet>.supabase.co/auth/v1/callback` dans Google Cloud Console.

## Vérifier l'isolation
Créer 2 comptes différents → chacun ne doit voir que ses propres tâches.
