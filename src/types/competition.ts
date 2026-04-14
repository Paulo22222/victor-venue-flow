export interface EventData {
  nome: string;
  data: string;
  horario: string;
  local: string;
  modalidade: string;
  organizadores: string;
  emailOrganizador: string;
  responsavel: string;
  emailResponsavel: string;
}

export interface Atleta {
  id: string;
  nome: string;
  dataNascimento: string;
  documento: string;
  genero: 'masculino' | 'feminino' | 'misto' | 'outro';
  codigo?: string;
}

export interface Equipe {
  id: string;
  nome: string;
  genero: 'masculino' | 'feminino' | 'misto';
  integrantes: Atleta[];
}

export interface Modalidade {
  id: string;
  nome: string;
}

export interface CompetidoresData {
  tipo: 'individual' | 'coletivo' | '';
  modalidades: Modalidade[];
  atletas: Atleta[];
  equipes: Equipe[];
}

export type SistemaDisputa = 'rodizio' | 'eliminatorio' | 'misto' | 'suico' | '';

export interface DisputaData {
  sistema: SistemaDisputa;
  modalidadeSelecionada: string;
  sugestaoManual: string;
}

export interface LogisticaData {
  modalidadeId: string;
  local: string;
  dia: string;
  horarioInicio: string;
  espacosDisponiveis: number;
  equipeArbitragem: string;
  coordenadorQuadra: string;
  outrosEnvolvidos: string;
  tempoTotalDisponivel: number;
  tempoPorPartida: number;
  tempoIntervalo: number;
  intervaloRefeicao: boolean;
}

export interface Jogo {
  id: string;
  rodada: number;
  participanteA: string;
  participanteB: string;
  placarA?: number;
  placarB?: number;
  horario?: string;
  local?: string;
}

export interface CompetitionState {
  currentStep: number;
  evento: EventData;
  competidores: CompetidoresData;
  disputa: DisputaData;
  logistica: LogisticaData;
  jogos: Jogo[];
  resultados: Record<string, { placarA: number; placarB: number }>;
  finalizado: boolean;
}
