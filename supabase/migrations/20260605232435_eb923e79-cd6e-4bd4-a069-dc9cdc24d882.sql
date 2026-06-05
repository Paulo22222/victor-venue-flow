
-- 1. competition_athletes: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can view athletes" ON public.competition_athletes;
CREATE POLICY "Authenticated can view athletes" ON public.competition_athletes
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.competition_athletes FROM anon;

-- 2. team_members: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can view team members" ON public.team_members;
CREATE POLICY "Authenticated can view team members" ON public.team_members
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.team_members FROM anon;

-- 3. organizer_team_members: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can view organizer team members" ON public.organizer_team_members;
CREATE POLICY "Authenticated can view organizer team members" ON public.organizer_team_members
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.organizer_team_members FROM anon;

-- 4. competitions: hide email columns from anonymous users via column-level grants
REVOKE SELECT ON public.competitions FROM anon;
GRANT SELECT (
  id, nome, data, horario, local, modalidade, organizadores, responsavel,
  tipo_competidor, modalidade_selecionada, sugestao_manual, sistema_disputa,
  logistica_local, logistica_dia, logistica_horario_inicio, espacos_disponiveis,
  equipe_arbitragem, coordenador_quadra, outros_envolvidos,
  tempo_total_disponivel, tempo_por_partida, tempo_intervalo, intervalo_refeicao,
  created_at, updated_at, finalizado
) ON public.competitions TO anon;

-- 5. Realtime: restrict channel subscriptions to authenticated users only
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can subscribe to realtime" ON realtime.messages;
CREATE POLICY "Authenticated can subscribe to realtime" ON realtime.messages
  FOR SELECT TO authenticated USING (true);
