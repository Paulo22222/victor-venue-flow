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
  const { data, error } = await supabase
    .from('competitions')
    .select('id, nome, data, modalidade, created_at, updated_at, finalizado')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(d => ({ ...d, finalizado: d.finalizado ?? false }));
}

export async function saveCompetition(state: CompetitionState, existingId?: string): Promise<string> {
  const competitionRow = {
    nome: state.evento.nome,
    data: state.evento.data,
    horario: state.evento.horario,
    local: state.evento.local,
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

  // Equipes (cópia para o evento) + integrantes + vínculo com acervo do organizador
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

  // Sistemas de disputa por modalidade
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

  // Jogos
  if (state.jogos.length > 0) {
    await supabase.from('competition_matches').insert(
      state.jogos.map(j => ({
        competition_id: competitionId,
        rodada: j.rodada,
        participante_a: j.participanteA,
        participante_b: j.participanteB,
        placar_a: state.resultados[j.id]?.placarA ?? j.placarA ?? null,
        placar_b: state.resultados[j.id]?.placarB ?? j.placarB ?? null,
        horario: j.horario || null,
        local: j.local || null,
        modalidade: j.modalidade || null,
        esporte: j.esporte || j.modalidade || null,
      }))
    );
  }

  return competitionId;
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

  // Mapa team-name -> organizer_team_id (best effort)
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
    horario: m.horario || undefined, local: m.local || undefined,
    modalidade: m.modalidade || undefined,
    esporte: m.esporte || undefined,
  }));

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
    },
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

// Atualiza placar em tempo real (sem reescrever todo o evento)
export async function updateMatchScore(matchId: string, placarA: number | null, placarB: number | null): Promise<void> {
  const { error } = await supabase
    .from('competition_matches')
    .update({ placar_a: placarA, placar_b: placarB })
    .eq('id', matchId);
  if (error) throw error;
}
