-- Babbl — Row Level Security au moindre privilège.
-- Idempotent : peut être relancé sans risque (SQL Editor de Supabase).
--
-- Qui écrit quoi (vérifié dans le code le 24/09/2026) :
--   * le BACKEND (clé service_role, qui contourne RLS) écrit analyses,
--     context_logs, badges, baby_baselines, et efface tout (DELETE /api/me) ;
--   * le NAVIGATEUR (clé publique + jeton du parent) ne fait que :
--       - lire SES analyses        (Dashboard → historique)
--       - lire / créer / modifier SON profil (Profil → voix, prénom, âge)
-- Tout le reste est fermé au navigateur : RLS activé sans règle = refusé.

-- 1. RLS partout (sans effet si déjà actif)
alter table public.profiles       enable row level security;
alter table public.analyses       enable row level security;
alter table public.context_logs   enable row level security;
alter table public.badges         enable row level security;
alter table public.baby_baselines enable row level security;

-- 2. Anciennes règles éventuelles : on repart d'un état connu
do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'analyses', 'context_logs', 'badges', 'baby_baselines')
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- 3. Profil : chaque parent lit, crée et modifie le sien, et seulement le sien
create policy "profil: lire le sien" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "profil: créer le sien" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "profil: modifier le sien" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- 4. Analyses : lecture des siennes uniquement (le backend est le seul écrivain)
create policy "analyses: lire les siennes" on public.analyses
  for select to authenticated using (user_id = auth.uid());

-- 5. context_logs, badges, baby_baselines : aucune règle = aucun accès navigateur.

-- 6. Vérification (doit afficher rls = true pour les 5 tables)
select c.relname as table, c.relrowsecurity as rls,
       (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as regles
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('profiles', 'analyses', 'context_logs', 'badges', 'baby_baselines')
order by 1;
