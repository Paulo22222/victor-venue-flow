// Regras de pontuação por esporte — definidas individualmente para refletir as características reais de cada modalidade
export type SportKey =
  | 'FUTSAL' | 'VOLEI' | 'HANDEBOL'
  | 'ARREMESSO_PESO' | 'LANCAMENTO_DARDO'
  | 'SALTO_DISTANCIA' | 'SALTO_ALTURA'
  | 'TENIS_MESA' | 'XADREZ' | 'VOLEI_PRAIA'
  | 'OUTRO';

export type TipoParticipacao = 'coletiva' | 'individual';
export type ScoreInputTipo = 'simples' | 'sets' | 'games' | 'marca';

export interface RankingColumn {
  key: string;          // chave na linha (V, E, D, GP, GC, SG, Pts, SetsV...)
  label: string;        // header curto
  // formato opcional (ex: saldo com sinal)
  format?: (n: number) => string;
}

export interface RankingRow {
  participante: string;
  P: number;
  V: number;
  E: number;
  D: number;
  GP: number; GC: number; SG: number;
  SetsV: number; SetsP: number;
  GamesV: number; GamesP: number;
  J: number;
}

export interface SportRule {
  key: SportKey;
  nome: string;
  unidade: string;
  passoIncremento: number;
  permiteEmpate: boolean;
  scoreMin: number;
  scoreMax: number;
  cor: string;
  emoji: string;
  pontuacaoRanking: { vitoria: number; empate: number; derrota: number };
  descricaoPontuacao: string;
  /** Tipo de participação padrão da modalidade. */
  tipo: TipoParticipacao;
  /** Tipo de input usado na tela de lançamento de placar. */
  inputTipo: ScoreInputTipo;
  /** Colunas exibidas na tabela de classificação. */
  colunas: RankingColumn[];
}

const COLS_FUTSAL: RankingColumn[] = [
  { key: 'P', label: 'Pts' }, { key: 'J', label: 'J' },
  { key: 'V', label: 'V' }, { key: 'E', label: 'E' }, { key: 'D', label: 'D' },
  { key: 'GP', label: 'GP' }, { key: 'GC', label: 'GC' },
  { key: 'SG', label: 'SG', format: (n) => n > 0 ? `+${n}` : `${n}` },
];
const COLS_VOLEI: RankingColumn[] = [
  { key: 'P', label: 'Pts' }, { key: 'J', label: 'J' },
  { key: 'V', label: 'V' }, { key: 'D', label: 'D' },
  { key: 'SetsV', label: 'SV' }, { key: 'SetsP', label: 'SP' },
  { key: 'GP', label: 'PP' }, { key: 'GC', label: 'PC' },
];
const COLS_TM: RankingColumn[] = [
  { key: 'P', label: 'Pts' }, { key: 'J', label: 'J' },
  { key: 'V', label: 'V' }, { key: 'D', label: 'D' },
  { key: 'GamesV', label: 'GV' }, { key: 'GamesP', label: 'GP' },
];
const COLS_PADRAO: RankingColumn[] = [
  { key: 'P', label: 'Pts' }, { key: 'V', label: 'V' }, { key: 'E', label: 'E' }, { key: 'D', label: 'D' },
  { key: 'SG', label: 'SG', format: (n) => n > 0 ? `+${n}` : `${n}` },
];

const make = (
  key: SportKey, nome: string, unidade: string,
  opts: Partial<SportRule> = {}
): SportRule => ({
  key, nome, unidade,
  passoIncremento: 1, permiteEmpate: true,
  scoreMin: 0, scoreMax: 99, cor: 'bg-primary', emoji: '',
  pontuacaoRanking: { vitoria: 3, empate: 1, derrota: 0 },
  descricaoPontuacao: 'Vitória 3 pts · Empate 1 pt · Derrota 0',
  tipo: 'coletiva',
  inputTipo: 'simples',
  colunas: COLS_PADRAO,
  ...opts,
});

export const SPORT_RULES: Record<string, SportRule> = {
  FUTSAL: make('FUTSAL', 'Futsal', 'gols', {
    cor: 'bg-emerald-500', scoreMax: 99,
    descricaoPontuacao: 'Vitória 3 · Empate 1 · Derrota 0 — saldo de gols',
    colunas: COLS_FUTSAL,
  }),
  HANDEBOL: make('HANDEBOL', 'Handebol', 'gols', {
    cor: 'bg-orange-500', scoreMax: 99,
    descricaoPontuacao: 'Vitória 3 · Empate 1 · Derrota 0',
    colunas: COLS_FUTSAL,
  }),

  VOLEI: make('VOLEI', 'Vôlei', 'sets', {
    permiteEmpate: false, scoreMax: 3, cor: 'bg-blue-500',
    pontuacaoRanking: { vitoria: 2, empate: 0, derrota: 1 },
    descricaoPontuacao: 'Vitória 2 · Derrota 1 — registrado por sets',
    inputTipo: 'sets', colunas: COLS_VOLEI,
  }),
  'VÔLEI': make('VOLEI', 'Vôlei', 'sets', {
    permiteEmpate: false, scoreMax: 3, cor: 'bg-blue-500',
    pontuacaoRanking: { vitoria: 2, empate: 0, derrota: 1 },
    descricaoPontuacao: 'Vitória 2 · Derrota 1 — registrado por sets',
    inputTipo: 'sets', colunas: COLS_VOLEI,
  }),
  'VÔLEI DE PRAIA': make('VOLEI_PRAIA', 'Vôlei de Praia', 'sets', {
    permiteEmpate: false, scoreMax: 2, cor: 'bg-amber-500',
    pontuacaoRanking: { vitoria: 2, empate: 0, derrota: 1 },
    descricaoPontuacao: 'Vitória 2 · Derrota 1 — melhor de 3 sets',
    inputTipo: 'sets', colunas: COLS_VOLEI,
  }),
  'VOLEI DE PRAIA': make('VOLEI_PRAIA', 'Vôlei de Praia', 'sets', {
    permiteEmpate: false, scoreMax: 2, cor: 'bg-amber-500',
    pontuacaoRanking: { vitoria: 2, empate: 0, derrota: 1 },
    descricaoPontuacao: 'Vitória 2 · Derrota 1 — melhor de 3 sets',
    inputTipo: 'sets', colunas: COLS_VOLEI,
  }),

  'TÊNIS DE MESA': make('TENIS_MESA', 'Tênis de Mesa', 'games', {
    permiteEmpate: false, scoreMax: 4, cor: 'bg-red-500',
    pontuacaoRanking: { vitoria: 2, empate: 0, derrota: 1 },
    descricaoPontuacao: 'Vitória 2 · Derrota 1 — melhor de 7 games',
    tipo: 'individual', inputTipo: 'games', colunas: COLS_TM,
  }),
  'TENIS DE MESA': make('TENIS_MESA', 'Tênis de Mesa', 'games', {
    permiteEmpate: false, scoreMax: 4, cor: 'bg-red-500',
    pontuacaoRanking: { vitoria: 2, empate: 0, derrota: 1 },
    descricaoPontuacao: 'Vitória 2 · Derrota 1 — melhor de 7 games',
    tipo: 'individual', inputTipo: 'games', colunas: COLS_TM,
  }),

  XADREZ: make('XADREZ', 'Xadrez', 'pontos', {
    permiteEmpate: true, scoreMax: 1, cor: 'bg-slate-600',
    pontuacaoRanking: { vitoria: 1, empate: 0, derrota: 0 },
    descricaoPontuacao: 'Vitória 1 · Empate ½ · Derrota 0',
    tipo: 'individual', colunas: COLS_PADRAO,
  }),

  'ARREMESSO DE PESO': make('ARREMESSO_PESO', 'Arremesso de Peso', 'cm', {
    permiteEmpate: false, scoreMax: 9999, cor: 'bg-purple-500',
    pontuacaoRanking: { vitoria: 3, empate: 0, derrota: 0 },
    descricaoPontuacao: 'Maior marca vence · 3 pts ao vencedor',
    tipo: 'individual', inputTipo: 'marca',
  }),
  'LANÇAMENTO DE DARDO': make('LANCAMENTO_DARDO', 'Lançamento de Dardo', 'cm', {
    permiteEmpate: false, scoreMax: 19999, cor: 'bg-purple-500',
    pontuacaoRanking: { vitoria: 3, empate: 0, derrota: 0 },
    descricaoPontuacao: 'Maior marca vence · 3 pts ao vencedor',
    tipo: 'individual', inputTipo: 'marca',
  }),
  'LANCAMENTO DE DARDO': make('LANCAMENTO_DARDO', 'Lançamento de Dardo', 'cm', {
    permiteEmpate: false, scoreMax: 19999, cor: 'bg-purple-500',
    pontuacaoRanking: { vitoria: 3, empate: 0, derrota: 0 },
    descricaoPontuacao: 'Maior marca vence · 3 pts ao vencedor',
    tipo: 'individual', inputTipo: 'marca',
  }),
  'SALTO EM DISTÂNCIA': make('SALTO_DISTANCIA', 'Salto em Distância', 'cm', {
    permiteEmpate: false, scoreMax: 1500, cor: 'bg-fuchsia-500',
    pontuacaoRanking: { vitoria: 3, empate: 0, derrota: 0 },
    descricaoPontuacao: 'Maior marca vence · 3 pts ao vencedor',
    tipo: 'individual', inputTipo: 'marca',
  }),
  'SALTO EM DISTANCIA': make('SALTO_DISTANCIA', 'Salto em Distância', 'cm', {
    permiteEmpate: false, scoreMax: 1500, cor: 'bg-fuchsia-500',
    pontuacaoRanking: { vitoria: 3, empate: 0, derrota: 0 },
    descricaoPontuacao: 'Maior marca vence · 3 pts ao vencedor',
    tipo: 'individual', inputTipo: 'marca',
  }),
  'SALTO EM ALTURA': make('SALTO_ALTURA', 'Salto em Altura', 'cm', {
    permiteEmpate: false, scoreMax: 300, cor: 'bg-fuchsia-500',
    pontuacaoRanking: { vitoria: 3, empate: 0, derrota: 0 },
    descricaoPontuacao: 'Maior marca vence · 3 pts ao vencedor',
    tipo: 'individual', inputTipo: 'marca',
  }),
};

export const DEFAULT_RULE: SportRule = make('OUTRO', 'Outro', 'pontos', { scoreMax: 999 });

export const getSportRule = (modalidade?: string): SportRule => {
  if (!modalidade) return DEFAULT_RULE;
  const upper = modalidade.toUpperCase();
  return SPORT_RULES[upper] ?? DEFAULT_RULE;
};

// Pontos para o ranking conforme a regra específica da modalidade
export const pontosRanking = (placarA: number, placarB: number, regra: SportRule) => {
  const { vitoria, empate, derrota } = regra.pontuacaoRanking;
  if (placarA > placarB) return { a: vitoria, b: derrota };
  if (placarB > placarA) return { a: derrota, b: vitoria };
  if (regra.permiteEmpate) return { a: empate, b: empate };
  return { a: 0, b: 0 };
};

// Cria uma linha de ranking vazia
export const linhaVazia = (participante: string): RankingRow => ({
  participante, P: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0, SG: 0,
  SetsV: 0, SetsP: 0, GamesV: 0, GamesP: 0, J: 0,
});

// Atualiza a linha conforme a regra. `detalhes` pode trazer { sets: [[a,b],...] } para vôlei/TM.
export const aplicarPartida = (
  linha: RankingRow, regra: SportRule,
  placarA: number, placarB: number, ehLadoA: boolean,
  detalhes?: { sets?: number[][] } | null
) => {
  linha.J += 1;
  const propria = ehLadoA ? placarA : placarB;
  const adversa = ehLadoA ? placarB : placarA;
  // V/E/D + pontos
  if (placarA === placarB && regra.permiteEmpate) { linha.E += 1; linha.P += regra.pontuacaoRanking.empate; }
  else if (propria > adversa) { linha.V += 1; linha.P += regra.pontuacaoRanking.vitoria; }
  else { linha.D += 1; linha.P += regra.pontuacaoRanking.derrota; }
  // GP/GC para esportes com placar somado
  if (regra.inputTipo === 'simples') {
    linha.GP += propria; linha.GC += adversa; linha.SG = linha.GP - linha.GC;
  }
  if (regra.inputTipo === 'sets') {
    // placar agregado = sets vencidos
    linha.SetsV += propria; linha.SetsP += adversa;
    // soma de pontos por set
    if (detalhes?.sets) {
      detalhes.sets.forEach(([a, b]) => {
        if (ehLadoA) { linha.GP += a || 0; linha.GC += b || 0; }
        else { linha.GP += b || 0; linha.GC += a || 0; }
      });
    }
  }
  if (regra.inputTipo === 'games') {
    linha.GamesV += propria; linha.GamesP += adversa;
  }
};

export const MODALIDADES_DISPONIVEIS: { id: string; desc: string }[] = [
  { id: 'FUTSAL', desc: 'Futebol de salão' },
  { id: 'VÔLEI', desc: 'Voleibol' },
  { id: 'HANDEBOL', desc: 'Handebol' },
  { id: 'ARREMESSO DE PESO', desc: 'Atletismo' },
  { id: 'LANÇAMENTO DE DARDO', desc: 'Atletismo' },
  { id: 'SALTO EM DISTÂNCIA', desc: 'Atletismo' },
  { id: 'SALTO EM ALTURA', desc: 'Atletismo' },
  { id: 'TÊNIS DE MESA', desc: 'Esporte individual' },
  { id: 'XADREZ', desc: 'Esporte individual' },
  { id: 'VÔLEI DE PRAIA', desc: 'Esporte de areia' },
];
