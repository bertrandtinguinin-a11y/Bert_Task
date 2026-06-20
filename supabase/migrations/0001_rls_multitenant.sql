-- ============================================================
-- Isolation multi-tenant (1 compte = 1 entreprise) via RLS
-- ============================================================
-- À EXÉCUTER UNE FOIS dans : Supabase → SQL Editor → Run.
--
-- Pourquoi : la clé SUPABASE_ANON_KEY est publique (présente dans
-- frontend/src/api/client.js). Sans Row Level Security, n'importe qui
-- peut lire TOUTES les données via cette clé. Le filtrage côté JS ne
-- protège rien. Seul RLS (règles serveur) garantit la confidentialité.
--
-- Résultat attendu :
--   - Connecté    -> auth.uid() = ton id  -> ne voit QUE ses tâches.
--   - Non connecté (aperçu public) -> auth.uid() = null -> 0 ligne,
--     pas d'erreur. Pages générales visibles, données vides.
--
-- ⚠️ L'étape 2 (truncate) EFFACE les tâches existantes (choix
--    "repartir propre"). Commente-la si tu veux garder des données.
-- ============================================================

-- 1. Colonne propriétaire (remplie automatiquement à l'insertion)
alter table public.tasks
  add column if not exists owner_id uuid
  references auth.users(id) default auth.uid();

-- 2. "Repartir propre" : VIDE toutes les tâches existantes (IRRÉVERSIBLE)
truncate table public.task_history, public.tasks restart identity cascade;

-- 3. Activer Row Level Security
alter table public.tasks enable row level security;
alter table public.task_history enable row level security;

-- 4. Tâches : chaque compte ne voit / modifie QUE ses lignes
drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks
  for select using (owner_id = auth.uid());

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks
  for insert with check (owner_id = auth.uid());

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks
  for delete using (owner_id = auth.uid());

-- 5. Historique : accès via appartenance à une tâche possédée
drop policy if exists "history_select_own" on public.task_history;
create policy "history_select_own" on public.task_history
  for select using (
    task_id in (select id from public.tasks where owner_id = auth.uid())
  );

drop policy if exists "history_insert_own" on public.task_history;
create policy "history_insert_own" on public.task_history
  for insert with check (
    task_id in (select id from public.tasks where owner_id = auth.uid())
  );
