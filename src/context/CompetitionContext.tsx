import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CompetitionState, EventData, CompetidoresData, DisputaData, LogisticaData, Jogo } from '@/types/competition';
import { saveCompetition, loadCompetition, deleteCompetition } from '@/services/competitionService';
import { toast } from '@/hooks/use-toast';

const initialState: CompetitionState = {
  currentStep: 0,
  evento: { nome: '', data: '', horario: '', local: '', modalidade: '', organizadores: '', emailOrganizador: '', responsavel: '', emailResponsavel: '' },
  competidores: { tipo: '', modalidades: [], atletas: [], equipes: [] },
  disputa: { sistema: '', modalidadeSelecionada: '', sugestaoManual: '' },
  logistica: { modalidadeId: '', local: '', dia: '', horarioInicio: '', espacosDisponiveis: 1, equipeArbitragem: '', coordenadorQuadra: '', outrosEnvolvidos: '', tempoTotalDisponivel: 300, tempoPorPartida: 20, tempoIntervalo: 5, intervaloRefeicao: false },
  jogos: [],
  resultados: {},
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
      const id = await saveCompetition(state, competitionId ?? undefined);
      setCompetitionId(id);
      toast({ title: 'Competição salva!', description: 'Dados salvos com sucesso no banco de dados.' });
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

  return (
    <CompetitionContext.Provider value={{ state, competitionId, saving, setStep, updateEvento, updateCompetidores, updateDisputa, updateLogistica, setJogos, updateResultado, save, load, resetState, remove }}>
      {children}
    </CompetitionContext.Provider>
  );
};

export const useCompetition = () => {
  const ctx = useContext(CompetitionContext);
  if (!ctx) throw new Error('useCompetition must be used within CompetitionProvider');
  return ctx;
};
