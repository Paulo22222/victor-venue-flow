import { supabase } from '@/integrations/supabase/client';
import { CompetitionState, Atleta, Equipe, Modalidade, Jogo, SistemaDisputa } from '@/types/competition';

export interface SavedCompetition {
  id: string;
  nome: string;
  data: string;
  modalidade: string;
  created_at: string;
  updated_at: string;
  finalizado: boolean;
}

export async function listCompetitions(): Promise<SavedCompetition[]> {
  const { data: { user } } = await supabase.auth.getUser();
  let query = supabase
    .from('competitions')
    .select('id, nome, data, modalidade, created_at, updated_at, finalizado, owner_id')
    .order('updated_at', { ascending: false });
  // Admins veem apenas os próprios eventos (RLS já restringe, mas filtramos explicitamente)
  if (user) {
    query = query.or(`owner_id.eq.${user.id},owner_id.is.null`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(d => ({ ...d, finalizado: d.finalizado ?? false }));
}

export interface SaveResult {
  competitionId: string;
  matchIdMap: { id: string; localId: string }[];
}

export async function saveCompetition(state: CompetitionState, existingId?: string): Promise<SaveResult> {
  const { data: { user } } = await supabase.auth.getUser();

  const competitionRow: any = {
    nome: state.evento.nome,
    data: state.evento.data,
    horario: state.evento.horario,
    local: state.evento.local,
    venue_id: (state.evento as any).venueId || null,
    modalidade: state.evento.modalidade,
    organizadores: state.evento.organizadores,
    email_organizador: state.evento.emailOrganizador,
    responsavel: state.evento.responsavel,
    email_responsavel: state.evento.emailResponsavel,
    tipo_competidor: state.competidores.tipo || '',
    sistema_disputa: state.disputa.sistema || '',
    modalidade_selecionada: state.disputa.modalidadeSelecionada,
    sugestao_manual: state.disputa.sugestaoManual,
    logistica_local: state.logistica.local,
    logistica_dia: state.logistica.dia,
    logistica_horario_inicio: state.logistica.horarioInicio,
    espacos_disponiveis: state.logistica.espacosDisponiveis,
    equipe_arbitragem: state.logistica.equipeArbitragem,
    coordenador_quadra: state.logistica.coordenadorQuadra,
    outros_envolvidos: state.logistica.outrosEnvolvidos,
    tempo_total_disponivel: state.logistica.tempoTotalDisponivel,
    tempo_por_partida: state.logistica.tempoPorPartida,
    tempo_intervalo: state.logistica.tempoIntervalo,
    intervalo_refeicao: state.logistica.intervaloRefeicao,
  };

  let competitionId: string;

  if (existingId) {
    const { error } = await supabase
      .from('competitions')
      .update(competitionRow)
      .eq('id', existingId);
    if (error) throw error;
    competitionId = existingId;
  } else {
    if (user) competitionRow.owner_id = user.id;
    const { data, error } = await supabase
      .from('competitions')
      .insert(competitionRow)
      .select('id')
      .single();
    if (error) throw error;
    competitionId = data.id;
  }

  // Limpa relacionados
  await Promise.all([
    supabase.from('competition_modalities').delete().eq('competition_id', competitionId),
    supabase.from('competition_athletes').delete().eq('competition_id', competitionId),
    supabase.from('competition_matches').delete().eq('competition_id', competitionId),
    supabase.from('competition_dispute_systems').delete().eq('competition_id', competitionId),
    supabase.from('competition_selected_teams').delete().eq('competition_id', competitionId),
  ]);
  await supabase.from('competition_teams').delete().eq('competition_id', competitionId);

  // Modalidades
  if (state.competidores.modalidades.length > 0) {
    await supabase.from('competition_modalities').insert(
      state.competidores.modalidades.map(m => ({
        competition_id: competitionId,
        nome: m.nome,
      }))
    );
  }

  // Atletas individuais
  if (state.competidores.atletas.length > 0) {
    await supabase.from('competition_athletes').insert(
      state.competidores.atletas.map(a => ({
        competition_id: competitionId,
        nome: a.nome,
        genero: a.genero,
        codigo: a.codigo || null,
        modalidade: a.modalidade || null,
      }))
    );
  }

  for (const equipe of state.competidores.equipes) {
    const { data: teamData, error: teamError } = await supabase
      .from('competition_teams')
      .insert({
        competition_id: competitionId,
        nome: equipe.nome,
        genero: equipe.genero,
        modalidade: equipe.modalidade || null,
      })
      .select('id')
      .single();
    if (teamError) throw teamError;

    if (equipe.integrantes.length > 0) {
      await supabase.from('team_members').insert(
        equipe.integrantes.map(i => ({
          team_id: teamData.id,
          nome: i.nome,
          genero: i.genero,
          codigo: i.codigo || null,
        }))
      );
    }

    if (equipe.organizerTeamId) {
      await supabase.from('competition_selected_teams').insert({
        competition_id: competitionId,
        organizer_team_id: equipe.organizerTeamId,
        modalidade: equipe.modalidade || '',
      });
    }
  }

  const sistemas = Object.entries(state.disputa.porModalidade || {}).filter(([, s]) => !!s);
  if (sistemas.length > 0) {
    await supabase.from('competition_dispute_systems').insert(
      sistemas.map(([modalidade, sistema]) => ({
        competition_id: competitionId,
        modalidade,
        sistema: sistema as string,
      }))
    );
  }

  let savedMatches: { id: string; localId: string }[] = [];
  if (state.jogos.length > 0) {
    const payload = state.jogos.map(j => ({
      competition_id: competitionId,
      rodada: j.rodada,
      participante_a: j.participanteA,
      participante_b: j.participanteB,
      placar_a: state.resultados[j.id]?.placarA ?? j.placarA ?? null,
      placar_b: state.resultados[j.id]?.placarB ?? j.placarB ?? null,
      finalizada: j.finalizada ?? false,
      manual: (j as any).manual ?? false,
      data: j.data || null,
      horario: j.horario || null,
      local: j.local || null,
      modalidade: j.modalidade || null,
      esporte: j.esporte || j.modalidade || null,
    }));
    const { data: inserted, error: matchErr } = await supabase
      .from('competition_matches')
      .insert(payload)
      .select('id');
    if (matchErr) throw matchErr;
    savedMatches = (inserted ?? []).map((row, idx) => ({
      id: row.id,
      localId: state.jogos[idx].id,
    }));
  }

  return { competitionId, matchIdMap: savedMatches };
}

export async function loadCompetition(id: string): Promise<CompetitionState> {
  const { data: comp, error } = await supabase
    .from('competitions')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;

  const [modRes, athRes, teamRes, matchRes, sysRes, selRes] = await Promise.all([
    supabase.from('competition_modalities').select('*').eq('competition_id', id),
    supabase.from('competition_athletes').select('*').eq('competition_id', id),
    supabase.from('competition_teams').select('*').eq('competition_id', id),
    supabase.from('competition_matches').select('*').eq('competition_id', id).order('rodada'),
    supabase.from('competition_dispute_systems').select('*').eq('competition_id', id),
    supabase.from('competition_selected_teams').select('*').eq('competition_id', id),
  ]);

  const modalidades: Modalidade[] = (modRes.data ?? []).map(m => ({ id: m.id, nome: m.nome }));
  const atletas: Atleta[] = (athRes.data ?? []).map(a => ({
    id: a.id, nome: a.nome, dataNascimento: '', documento: '',
    genero: (a.genero as Atleta['genero']) || 'masculino',
    codigo: a.codigo || undefined, modalidade: a.modalidade || undefined,
  }));

  const selByName: Record<string, string> = {};
  if (selRes.data && selRes.data.length > 0) {
    const orgIds = selRes.data.map(s => s.organizer_team_id);
    const { data: orgTeams } = await supabase
      .from('organizer_teams').select('id, nome').in('id', orgIds);
    (orgTeams ?? []).forEach(t => { selByName[t.nome] = t.id; });
  }

  const equipes: Equipe[] = [];
  for (const t of teamRes.data ?? []) {
    const { data: members } = await supabase
      .from('team_members').select('*').eq('team_id', t.id);
    equipes.push({
      id: t.id, nome: t.nome,
      genero: (t.genero as Equipe['genero']) || 'masculino',
      modalidade: t.modalidade || undefined,
      organizerTeamId: selByName[t.nome],
      integrantes: (members ?? []).map(m => ({
        id: m.id, nome: m.nome, dataNascimento: '', documento: '',
        genero: (m.genero as Atleta['genero']) || 'masculino',
        codigo: m.codigo || undefined,
      })),
    });
  }

  const jogos: Jogo[] = (matchRes.data ?? []).map(m => ({
    id: m.id, rodada: m.rodada,
    participanteA: m.participante_a, participanteB: m.participante_b,
    placarA: m.placar_a ?? undefined, placarB: m.placar_b ?? undefined,
    data: m.data || undefined,
    horario: m.horario || undefined, local: m.local || undefined,
    modalidade: m.modalidade || undefined,
    esporte: m.esporte || undefined,
    finalizada: (m as any).finalizada ?? false,
    manual: (m as any).manual ?? false,
  } as any));

  const resultados: Record<string, { placarA: number; placarB: number }> = {};
  jogos.forEach(j => {
    if (j.placarA != null && j.placarB != null) {
      resultados[j.id] = { placarA: j.placarA, placarB: j.placarB };
    }
  });

  const porModalidade: Record<string, SistemaDisputa> = {};
  (sysRes.data ?? []).forEach(s => { porModalidade[s.modalidade] = s.sistema as SistemaDisputa; });

  return {
    currentStep: 1,
    evento: {
      nome: comp.nome, data: comp.data || '', horario: comp.horario || '',
      local: comp.local || '', modalidade: comp.modalidade || '',
      organizadores: comp.organizadores || '', emailOrganizador: comp.email_organizador || '',
      responsavel: comp.responsavel || '', emailResponsavel: comp.email_responsavel || '',
      venueId: (comp as any).venue_id || '',
    } as any,
    competidores: {
      tipo: (comp.tipo_competidor as 'individual' | 'coletivo' | '') || '',
      modalidades, atletas, equipes,
    },
    disputa: {
      sistema: (comp.sistema_disputa as SistemaDisputa) || '',
      modalidadeSelecionada: comp.modalidade_selecionada || '',
      sugestaoManual: comp.sugestao_manual || '',
      porModalidade,
    },
    logistica: {
      modalidadeId: '',
      local: comp.logistica_local || '', dia: comp.logistica_dia || '',
      horarioInicio: comp.logistica_horario_inicio || '',
      espacosDisponiveis: comp.espacos_disponiveis ?? 1,
      equipeArbitragem: comp.equipe_arbitragem || '',
      coordenadorQuadra: comp.coordenador_quadra || '',
      outrosEnvolvidos: comp.outros_envolvidos || '',
      tempoTotalDisponivel: comp.tempo_total_disponivel ?? 300,
      tempoPorPartida: comp.tempo_por_partida ?? 20,
      tempoIntervalo: comp.tempo_intervalo ?? 5,
      intervaloRefeicao: comp.intervalo_refeicao ?? false,
    },
    jogos, resultados,
    finalizado: comp.finalizado ?? false,
  };
}

export async function deleteCompetition(id: string): Promise<void> {
  const { error } = await supabase.from('competitions').delete().eq('id', id);
  if (error) throw error;
}

export async function finalizeCompetition(id: string): Promise<void> {
  const { error } = await supabase
    .from('competitions')
    .update({ finalizado: true })
    .eq('id', id);
  if (error) throw error;
}

// Atualiza placar em tempo real e grava histórico (auditoria)
export async function updateMatchScore(
  matchId: string,
  placarA: number | null,
  placarB: number | null,
  detalhes?: { sets?: number[][] } | null,
): Promise<void> {
  // Captura valores antigos para histórico
  const { data: before } = await supabase
    .from('competition_matches')
    .select('competition_id, placar_a, placar_b, finalizada')
    .eq('id', matchId)
    .maybeSingle();

  const payload: any = { placar_a: placarA, placar_b: placarB };
  if (detalhes !== undefined) payload.detalhes_placar = detalhes;
  const { error } = await supabase
    .from('competition_matches')
    .update(payload)
    .eq('id', matchId);
  if (error) throw error;

  // Auditoria: registra somente se houve mudança real
  if (before && (before.placar_a !== placarA || before.placar_b !== placarB)) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: prof } = user ? await supabase.from('profiles').select('display_name, username').eq('user_id', user.id).maybeSingle() : { data: null } as any;
      await supabase.from('competition_match_history').insert({
        match_id: matchId,
        competition_id: before.competition_id,
        changed_by: user?.id ?? null,
        changed_by_name: prof?.display_name || prof?.username || user?.email || null,
        placar_a_old: before.placar_a,
        placar_b_old: before.placar_b,
        placar_a_new: placarA,
        placar_b_new: placarB,
        finalizada_old: before.finalizada ?? false,
        finalizada_new: before.finalizada ?? false,
      });
    } catch { /* histórico é best-effort */ }
  }
}

export interface MatchHistoryRow {
  id: string;
  changed_at: string;
  changed_by_name: string | null;
  placar_a_old: number | null;
  placar_b_old: number | null;
  placar_a_new: number | null;
  placar_b_new: number | null;
}
export async function getMatchHistory(matchId: string): Promise<MatchHistoryRow[]> {
  const { data, error } = await supabase
    .from('competition_match_history')
    .select('id, changed_at, changed_by_name, placar_a_old, placar_b_old, placar_a_new, placar_b_new')
    .eq('match_id', matchId)
    .order('changed_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as MatchHistoryRow[];
}

// Atualiza data, horário e local de um jogo (reagendamento pós-chaveamento)
export async function updateMatchSchedule(
  matchId: string,
  schedule: { data?: string | null; horario?: string | null; local?: string | null }
): Promise<void> {
  const payload: { data?: string | null; horario?: string | null; local?: string | null } = {};
  if ('data' in schedule) payload.data = schedule.data ?? null;
  if ('horario' in schedule) payload.horario = schedule.horario ?? null;
  if ('local' in schedule) payload.local = schedule.local ?? null;
  const { error } = await supabase.from('competition_matches').update(payload).eq('id', matchId);
  if (error) throw error;
}

// Marca uma partida como finalizada (confirmação manual do administrador)
export async function finalizeMatch(matchId: string, finalizada = true): Promise<void> {
  const { error } = await supabase
    .from('competition_matches')
    .update({ finalizada } as any)
    .eq('id', matchId);
  if (error) throw error;
}

// Chaveamento manual
export async function createManualMatch(
  competitionId: string,
  m: { rodada: number; participanteA: string; participanteB: string; modalidade: string; esporte?: string }
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('competition_matches')
    .insert({
      competition_id: competitionId,
      rodada: m.rodada,
      participante_a: m.participanteA,
      participante_b: m.participanteB,
      modalidade: m.modalidade,
      esporte: m.esporte || m.modalidade,
      manual: true,
      finalizada: false,
    } as any)
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

export async function updateMatchParticipants(
  matchId: string,
  participanteA: string,
  participanteB: string,
): Promise<void> {
  const { error } = await supabase
    .from('competition_matches')
    .update({ participante_a: participanteA, participante_b: participanteB, manual: true } as any)
    .eq('id', matchId);
  if (error) throw error;
}

export async function deleteMatch(matchId: string): Promise<void> {
  const { error } = await supabase.from('competition_matches').delete().eq('id', matchId);
  if (error) throw error;
}
