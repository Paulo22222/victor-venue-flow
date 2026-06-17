
REVOKE SELECT ON public.competitions FROM anon;
GRANT SELECT (
  id, nome, data, horario, local, modalidade, organizadores,
  responsavel, tipo_competidor, sistema_disputa, modalidade_selecionada,
  sugestao_manual, logistica_local, logistica_dia, logistica_horario_inicio,
  espacos_disponiveis, equipe_arbitragem, coordenador_quadra, outros_envolvidos,
  tempo_total_disponivel, tempo_por_partida, tempo_intervalo, intervalo_refeicao,
  created_at, updated_at, finalizado, venue_id, owner_id
) ON public.competitions TO anon;

REVOKE SELECT ON public.organizer_teams FROM anon;
GRANT SELECT (
  id, owner_id, nome, genero, modalidade, created_at, updated_at
) ON public.organizer_teams TO anon;
