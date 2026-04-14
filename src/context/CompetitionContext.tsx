import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CompetitionState, EventData, CompetidoresData, DisputaData, LogisticaData, Jogo } from '@/types/competition';

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
  setStep: (step: number) => void;
  updateEvento: (data: Partial<EventData>) => void;
  updateCompetidores: (data: Partial<CompetidoresData>) => void;
  updateDisputa: (data: Partial<DisputaData>) => void;
  updateLogistica: (data: Partial<LogisticaData>) => void;
  setJogos: (jogos: Jogo[]) => void;
  updateResultado: (jogoId: string, placarA: number, placarB: number) => void;
}

const CompetitionContext = createContext<CompetitionContextType | null>(null);

export const CompetitionProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<CompetitionState>(initialState);

  const setStep = (step: number) => setState(prev => ({ ...prev, currentStep: step }));
  const updateEvento = (data: Partial<EventData>) => setState(prev => ({ ...prev, evento: { ...prev.evento, ...data } }));
  const updateCompetidores = (data: Partial<CompetidoresData>) => setState(prev => ({ ...prev, competidores: { ...prev.competidores, ...data } }));
  const updateDisputa = (data: Partial<DisputaData>) => setState(prev => ({ ...prev, disputa: { ...prev.disputa, ...data } }));
  const updateLogistica = (data: Partial<LogisticaData>) => setState(prev => ({ ...prev, logistica: { ...prev.logistica, ...data } }));
  const setJogos = (jogos: Jogo[]) => setState(prev => ({ ...prev, jogos }));
  const updateResultado = (jogoId: string, placarA: number, placarB: number) =>
    setState(prev => ({ ...prev, resultados: { ...prev.resultados, [jogoId]: { placarA, placarB } } }));

  return (
    <CompetitionContext.Provider value={{ state, setStep, updateEvento, updateCompetidores, updateDisputa, updateLogistica, setJogos, updateResultado }}>
      {children}
    </CompetitionContext.Provider>
  );
};

export const useCompetition = () => {
  const ctx = useContext(CompetitionContext);
  if (!ctx) throw new Error('useCompetition must be used within CompetitionProvider');
  return ctx;
};
