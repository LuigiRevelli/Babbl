-- Babbl — 23/09/2026
-- 1. « Qu'est-ce qui a apaisé votre bébé ? » : la réponse du parent, rangée avec l'analyse.
--    Liste fermée, identique à backend/taxonomy.py (SOOTHED_BY) + 'skipped'.
-- 2. guidance_source : qui a rédigé le résumé ('llm' sous garde-fou, ou 'deterministic').
--    Nécessaire pour l'affichage AI Act art. 50 quand l'historique est relu.
-- Sans risque : colonnes ajoutées, nullables, aucune donnée modifiée.
-- Le backend fonctionne avant ET après cette migration (il réessaie sans ces colonnes).

alter table public.analyses
  add column if not exists soothed_by text,
  add column if not exists soothed_at timestamptz,
  add column if not exists guidance_source text;

alter table public.analyses
  drop constraint if exists analyses_soothed_by_check,
  add constraint analyses_soothed_by_check check (
    soothed_by is null or soothed_by in (
      'feeding', 'diaper_or_position', 'sleep', 'arms_or_voice',
      'babbl_voice', 'nothing_yet', 'dont_know', 'skipped'
    )
  ),
  drop constraint if exists analyses_guidance_source_check,
  add constraint analyses_guidance_source_check check (
    guidance_source is null or guidance_source in ('llm', 'deterministic')
  );
