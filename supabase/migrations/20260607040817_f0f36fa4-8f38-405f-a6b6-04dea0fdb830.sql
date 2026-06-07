
-- 1) organizer_teams: restringir owner_id ao público anônimo via column-level grants
REVOKE SELECT ON public.organizer_teams FROM anon;
GRANT SELECT (id, nome, modalidade, genero, created_at, updated_at) ON public.organizer_teams TO anon;
-- authenticated continua com SELECT completo
GRANT SELECT ON public.organizer_teams TO authenticated;

-- 2) Remover competition_athletes do realtime (RLS restringe SELECT, mas realtime ignora isso para subs)
ALTER PUBLICATION supabase_realtime DROP TABLE public.competition_athletes;

-- 3) Revogar EXECUTE de funções SECURITY DEFINER para anon/authenticated.
-- Continuam funcionando dentro de policies (executadas como owner) e no trigger de auth.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_team_owner(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
