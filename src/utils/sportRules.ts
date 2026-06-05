// Regras de pontuação por esporte — definidas individualmente para refletir as características reais de cada modalidade
export type SportKey =
  | 'FUTSAL' | 'VOLEI' | 'HANDEBOL'
  | 'ARREMESSO_PESO' | 'LANCAMENTO_DARDO'
  | 'SALTO_DISTANCIA' | 'SALTO_ALTURA'
  | 'TENIS_MESA' | 'XADREZ' | 'VOLEI_PRAIA'
  | 'OUTRO';

export interface SportRule {
  key: SportKey;
  nome: string;
  unidade: string;          // "gols" | "sets" | "pontos" | "metros"
  passoIncremento: number;  // incremento dos botões +/-
  permiteEmpate: boolean;
  scoreMin: number;
  scoreMax: number;
  cor: string;
  emoji: string;
  /** Pontos atribuídos no ranking: vitória/empate/derrota */
  pontuacaoRanking: { vitoria: number; empate: number; derrota: number };
  /** Descrição curta da pontuação (exibida na UI) */
  descricaoPontuacao: string;
}

const make = (
  key: SportKey, nome: string, unidade: string,
  opts: Partial<SportRule> = {}
): SportRule => ({
  key, nome, unidade,
  passoIncremento: 1, permiteEmpate: true,
  scoreMin: 0, scoreMax: 99, cor: 'bg-primary', emoji: '',
  pontuacaoRanking: { vitoria: 3, empate: 1, derrota: 0 },
  descricaoPontuacao: 'Vitória 3 pts · Empate 1 pt · Derrota 0',
  ...opts,
});

export const SPORT_RULES: Record<string, SportRule> = {
  // Coletivos com placar em gols
  FUTSAL: make('FUTSAL', 'Futsal', 'gols', {
    cor: 'bg-emerald-500',
    scoreMax: 99,
    descricaoPontuacao: 'Vitória 3 · Empate 1 · Derrota 0 (gols cabem em 1ª/2ª linha)',
  }),
  HANDEBOL: make('HANDEBOL', 'Handebol', 'gols', {
    cor: 'bg-orange-500',
    scoreMax: 99,
    descricaoPontuacao: 'Vitória 3 · Empate 1 · Derrota 0',
  }),

  // Vôlei: sets, sem empate, melhor de 5
  VOLEI: make('VOLEI', 'Vôlei', 'sets', {
    permiteEmpate: false, scoreMax: 3, cor: 'bg-blue-500',
    pontuacaoRanking: { vitoria: 2, empate: 0, derrota: 1 },
    descricaoPontuacao: 'Vitória 2 · Derrota 1 (FIVB) — melhor de 5 sets',
  }),
  'VÔLEI': make('VOLEI', 'Vôlei', 'sets', {
    permiteEmpate: false, scoreMax: 3, cor: 'bg-blue-500',
    pontuacaoRanking: { vitoria: 2, empate: 0, derrota: 1 },
    descricaoPontuacao: 'Vitória 2 · Derrota 1 (FIVB) — melhor de 5 sets',
  }),

  // Vôlei de praia: melhor de 3
  'VÔLEI DE PRAIA': make('VOLEI_PRAIA', 'Vôlei de Praia', 'sets', {
    permiteEmpate: false, scoreMax: 2, cor: 'bg-amber-500',
    pontuacaoRanking: { vitoria: 2, empate: 0, derrota: 1 },
    descricaoPontuacao: 'Vitória 2 · Derrota 1 — melhor de 3 sets',
  }),
  'VOLEI DE PRAIA': make('VOLEI_PRAIA', 'Vôlei de Praia', 'sets', {
    permiteEmpate: false, scoreMax: 2, cor: 'bg-amber-500',
    pontuacaoRanking: { vitoria: 2, empate: 0, derrota: 1 },
    descricaoPontuacao: 'Vitória 2 · Derrota 1 — melhor de 3 sets',
  }),

  // Tênis de mesa: sets, melhor de 7
  'TÊNIS DE MESA': make('TENIS_MESA', 'Tênis de Mesa', 'sets', {
    permiteEmpate: false, scoreMax: 4, cor: 'bg-red-500',
    pontuacaoRanking: { vitoria: 2, empate: 0, derrota: 1 },
    descricaoPontuacao: 'Vitória 2 · Derrota 1 — melhor de 7 sets',
  }),
  'TENIS DE MESA': make('TENIS_MESA', 'Tênis de Mesa', 'sets', {
    permiteEmpate: false, scoreMax: 4, cor: 'bg-red-500',
    pontuacaoRanking: { vitoria: 2, empate: 0, derrota: 1 },
    descricaoPontuacao: 'Vitória 2 · Derrota 1 — melhor de 7 sets',
  }),

  // Xadrez: 1 / 0,5 / 0 (usamos passo 1 pois placar inteiro; empate vale 1 para ambos via permiteEmpate)
  XADREZ: make('XADREZ', 'Xadrez', 'pontos', {
    permiteEmpate: true, scoreMax: 1, cor: 'bg-slate-600',
    pontuacaoRanking: { vitoria: 1, empate: 0, derrota: 0 }, // ponto por jogo; empate tratado abaixo
    descricaoPontuacao: 'Vitória 1 · Empate ½ · Derrota 0',
  }),

  // Atletismo / individuais: maior marca vence; placar em centímetros para evitar decimais
  'ARREMESSO DE PESO': make('ARREMESSO_PESO', 'Arremesso de Peso', 'cm', {
    permiteEmpate: false, scoreMax: 9999, cor: 'bg-purple-500',
    pontuacaoRanking: { vitoria: 3, empate: 0, derrota: 0 },
    descricaoPontuacao: 'Maior marca vence · 3 pts ao vencedor',
  }),
  'LANÇAMENTO DE DARDO': make('LANCAMENTO_DARDO', 'Lançamento de Dardo', 'cm', {
    permiteEmpate: false, scoreMax: 19999, cor: 'bg-purple-500',
    pontuacaoRanking: { vitoria: 3, empate: 0, derrota: 0 },
    descricaoPontuacao: 'Maior marca vence · 3 pts ao vencedor',
  }),
  'LANCAMENTO DE DARDO': make('LANCAMENTO_DARDO', 'Lançamento de Dardo', 'cm', {
    permiteEmpate: false, scoreMax: 19999, cor: 'bg-purple-500',
    pontuacaoRanking: { vitoria: 3, empate: 0, derrota: 0 },
    descricaoPontuacao: 'Maior marca vence · 3 pts ao vencedor',
  }),
  'SALTO EM DISTÂNCIA': make('SALTO_DISTANCIA', 'Salto em Distância', 'cm', {
    permiteEmpate: false, scoreMax: 1500, cor: 'bg-fuchsia-500',
    pontuacaoRanking: { vitoria: 3, empate: 0, derrota: 0 },
    descricaoPontuacao: 'Maior marca vence · 3 pts ao vencedor',
  }),
  'SALTO EM DISTANCIA': make('SALTO_DISTANCIA', 'Salto em Distância', 'cm', {
    permiteEmpate: false, scoreMax: 1500, cor: 'bg-fuchsia-500',
    pontuacaoRanking: { vitoria: 3, empate: 0, derrota: 0 },
    descricaoPontuacao: 'Maior marca vence · 3 pts ao vencedor',
  }),
  'SALTO EM ALTURA': make('SALTO_ALTURA', 'Salto em Altura', 'cm', {
    permiteEmpate: false, scoreMax: 300, cor: 'bg-fuchsia-500',
    pontuacaoRanking: { vitoria: 3, empate: 0, derrota: 0 },
    descricaoPontuacao: 'Maior marca vence · 3 pts ao vencedor',
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
