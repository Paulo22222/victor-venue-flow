
-- 1) Restaurar EXECUTE nas funções SECURITY DEFINER usadas em policies RLS
-- (a revogação anterior quebrou todas as policies has_role-based)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_team_owner(uuid) TO PUBLIC;

-- 2) Adicionar coluna 'finalizada' em competition_matches para fluxo manual de encerramento
ALTER TABLE public.competition_matches
  ADD COLUMN IF NOT EXISTS finalizada boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_competition_matches_finalizada
  ON public.competition_matches(competition_id, finalizada);
