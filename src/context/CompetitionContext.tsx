import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CompetitionState, EventData, CompetidoresData, DisputaData, LogisticaData, Jogo } from '@/types/competition';
import { saveCompetition, loadCompetition, deleteCompetition, finalizeCompetition } from '@/services/competitionService';
import { toast } from '@/hooks/use-toast';

const initialState: CompetitionState = {
  currentStep: 0,
  evento: { nome: '', data: '', horario: '', local: '', modalidade: '', organizadores: '', emailOrganizador: '', responsavel: '', emailResponsavel: '' },
  competidores: { tipo: '', modalidades: [], atletas: [], equipes: [] },
  disputa: { sistema: '', modalidadeSelecionada: '', sugestaoManual: '', porModalidade: {} },
  logistica: { modalidadeId: '', local: '', dia: '', horarioInicio: '', espacosDisponiveis: 1, equipeArbitragem: '', coordenadorQuadra: '', outrosEnvolvidos: '', tempoTotalDisponivel: 300, tempoPorPartida: 20, tempoIntervalo: 5, intervaloRefeicao: false },
  jogos: [],
  resultados: {},
  finalizado: false,
};

interface CompetitionContextType {
  state: CompetitionState;
  competitionId: string | null;
  saving: boolean;
  setStep: (step: number) => void;
  updateEvento: (data: Partial<EventData>) => void;
  updateCompetidores: (data: Partial<CompetidoresData>) => void;
  updateDisputa: (data: Partial<DisputaData>) => void;
  updateLogistica: (data: Partial<LogisticaData>) => void;
  setJogos: (jogos: Jogo[]) => void;
  updateResultado: (jogoId: string, placarA: number, placarB: number) => void;
  save: () => Promise<void>;
  load: (id: string) => Promise<void>;
  resetState: () => void;
  remove: (id: string) => Promise<void>;
  finalize: () => Promise<void>;
}

const CompetitionContext = createContext<CompetitionContextType | null>(null);

export const CompetitionProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<CompetitionState>(initialState);
  const [competitionId, setCompetitionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const setStep = (step: number) => setState(prev => ({ ...prev, currentStep: step }));
  const updateEvento = (data: Partial<EventData>) => setState(prev => ({ ...prev, evento: { ...prev.evento, ...data } }));
  const updateCompetidores = (data: Partial<CompetidoresData>) => setState(prev => ({ ...prev, competidores: { ...prev.competidores, ...data } }));
  const updateDisputa = (data: Partial<DisputaData>) => setState(prev => ({ ...prev, disputa: { ...prev.disputa, ...data } }));
  const updateLogistica = (data: Partial<LogisticaData>) => setState(prev => ({ ...prev, logistica: { ...prev.logistica, ...data } }));
  const setJogos = (jogos: Jogo[]) => setState(prev => ({ ...prev, jogos }));
  const updateResultado = (jogoId: string, placarA: number, placarB: number) =>
    setState(prev => ({ ...prev, resultados: { ...prev.resultados, [jogoId]: { placarA, placarB } } }));

  const save = async () => {
    setSaving(true);
    try {
      const { competitionId: id, matchIdMap } = await saveCompetition(state, competitionId ?? undefined);
      setCompetitionId(id);
      // Reescreve os IDs locais dos jogos com os UUIDs reais do DB para permitir updates ao vivo
      if (matchIdMap.length > 0) {
        setState(prev => {
          const map = new Map(matchIdMap.map(m => [m.localId, m.id]));
          const novosResultados: typeof prev.resultados = {};
          Object.entries(prev.resultados).forEach(([k, v]) => {
            novosResultados[map.get(k) ?? k] = v;
          });
          return {
            ...prev,
            jogos: prev.jogos.map(j => ({ ...j, id: map.get(j.id) ?? j.id })),
            resultados: novosResultados,
          };
        });
      }
      toast({ title: 'Competição salva!', description: 'Dados salvos com sucesso.' });
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const load = async (id: string) => {
    try {
      const loaded = await loadCompetition(id);
      setState(loaded);
      setCompetitionId(id);
    } catch (err: any) {
      toast({ title: 'Erro ao carregar', description: err.message, variant: 'destructive' });
    }
  };

  const resetState = () => {
    setState(initialState);
    setCompetitionId(null);
  };

  const remove = async (id: string) => {
    try {
      await deleteCompetition(id);
      if (competitionId === id) resetState();
      toast({ title: 'Competição excluída', description: 'Competição removida com sucesso.' });
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' });
    }
  };

  const finalize = async () => {
    if (!competitionId) {
      toast({ title: 'Erro', description: 'Salve a competição antes de finalizar.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await saveCompetition(state, competitionId);
      await finalizeCompetition(competitionId);
      setState(prev => ({ ...prev, finalizado: true }));
      toast({ title: 'Evento Finalizado!', description: 'Os resultados agora estão visíveis para todos os usuários.' });
    } catch (err: any) {
      toast({ title: 'Erro ao finalizar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <CompetitionContext.Provider value={{ state, competitionId, saving, setStep, updateEvento, updateCompetidores, updateDisputa, updateLogistica, setJogos, updateResultado, save, load, resetState, remove, finalize }}>
      {children}
    </CompetitionContext.Provider>
  );
};

export const useCompetition = () => {
  const ctx = useContext(CompetitionContext);
  if (!ctx) throw new Error('useCompetition must be used within CompetitionProvider');
  return ctx;
};
