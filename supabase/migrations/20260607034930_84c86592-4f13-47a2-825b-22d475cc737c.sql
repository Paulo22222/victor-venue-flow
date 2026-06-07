
-- Storage: athlete-photos bucket — admin-only
DROP POLICY IF EXISTS "athlete photos public read" ON storage.objects;
DROP POLICY IF EXISTS "athlete photos authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "athlete photos authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "athlete photos authenticated delete" ON storage.objects;

CREATE POLICY "athlete photos admin select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'athlete-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "athlete photos admin insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'athlete-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "athlete photos admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'athlete-photos' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'athlete-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "athlete photos admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'athlete-photos' AND public.has_role(auth.uid(), 'admin'));

-- competition_athletes
DROP POLICY IF EXISTS "Authenticated can view athletes" ON public.competition_athletes;
CREATE POLICY "Admins and organizers can view athletes" ON public.competition_athletes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'organizer'));

-- team_members
DROP POLICY IF EXISTS "Authenticated can view team members" ON public.team_members;
CREATE POLICY "Admins and organizers can view team members" ON public.team_members FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'organizer'));

-- organizer_team_members
DROP POLICY IF EXISTS "Authenticated can view organizer team members" ON public.organizer_team_members;
CREATE POLICY "Team owners and admins can view organizer team members" ON public.organizer_team_members FOR SELECT TO authenticated
  USING (public.get_team_owner(team_id) = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- competitions: split SELECT, column-restrict anon
DROP POLICY IF EXISTS "Anyone can view competitions" ON public.competitions;

CREATE POLICY "Authenticated can view competitions" ON public.competitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon can view competitions (non-email)" ON public.competitions FOR SELECT TO anon USING (true);

REVOKE SELECT ON public.competitions FROM anon;
GRANT SELECT (
  id, nome, data, horario, local, modalidade, organizadores, responsavel,
  tipo_competidor, sistema_disputa, modalidade_selecionada, sugestao_manual,
  logistica_local, logistica_dia, logistica_horario_inicio, espacos_disponiveis,
  equipe_arbitragem, coordenador_quadra, outros_envolvidos,
  tempo_total_disponivel, tempo_por_partida, tempo_intervalo, intervalo_refeicao,
  created_at, updated_at, finalizado
) ON public.competitions TO anon;

GRANT SELECT ON public.competitions TO authenticated;
