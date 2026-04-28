// Regras de pontuação por esporte (configurações para a UI)
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
  passoIncremento: number;  // quanto somar/subtrair com +/-
  permiteEmpate: boolean;
  scoreMin: number;
  scoreMax: number;
  cor: string;              // tailwind classe de cor
  emoji: string;            // mantido vazio — sem emojis na UI
}

const make = (key: SportKey, nome: string, unidade: string, opts: Partial<SportRule> = {}): SportRule => ({
  key, nome, unidade,
  passoIncremento: 1, permiteEmpate: true,
  scoreMin: 0, scoreMax: 99, cor: 'bg-primary', emoji: '',
  ...opts,
});

export const SPORT_RULES: Record<string, SportRule> = {
  FUTSAL: make('FUTSAL', 'Futsal', 'gols', { cor: 'bg-emerald-500' }),
  VOLEI: make('VOLEI', 'Vôlei', 'sets', { permiteEmpate: false, scoreMax: 5, cor: 'bg-blue-500' }),
  'VÔLEI': make('VOLEI', 'Vôlei', 'sets', { permiteEmpate: false, scoreMax: 5, cor: 'bg-blue-500' }),
  HANDEBOL: make('HANDEBOL', 'Handebol', 'gols', { cor: 'bg-orange-500' }),
  'TÊNIS DE MESA': make('TENIS_MESA', 'Tênis de Mesa', 'sets', { permiteEmpate: false, scoreMax: 5 }),
  'TENIS DE MESA': make('TENIS_MESA', 'Tênis de Mesa', 'sets', { permiteEmpate: false, scoreMax: 5 }),
  XADREZ: make('XADREZ', 'Xadrez', 'pontos', { permiteEmpate: true, scoreMax: 1 }),
  'VÔLEI DE PRAIA': make('VOLEI_PRAIA', 'Vôlei de Praia', 'sets', { permiteEmpate: false, scoreMax: 3 }),
  'VOLEI DE PRAIA': make('VOLEI_PRAIA', 'Vôlei de Praia', 'sets', { permiteEmpate: false, scoreMax: 3 }),
  'ARREMESSO DE PESO': make('ARREMESSO_PESO', 'Arremesso de Peso', 'metros', { permiteEmpate: false, scoreMax: 9999 }),
  'LANÇAMENTO DE DARDO': make('LANCAMENTO_DARDO', 'Lançamento de Dardo', 'metros', { permiteEmpate: false, scoreMax: 9999 }),
  'LANCAMENTO DE DARDO': make('LANCAMENTO_DARDO', 'Lançamento de Dardo', 'metros', { permiteEmpate: false, scoreMax: 9999 }),
  'SALTO EM DISTÂNCIA': make('SALTO_DISTANCIA', 'Salto em Distância', 'metros', { permiteEmpate: false, scoreMax: 9999 }),
  'SALTO EM DISTANCIA': make('SALTO_DISTANCIA', 'Salto em Distância', 'metros', { permiteEmpate: false, scoreMax: 9999 }),
  'SALTO EM ALTURA': make('SALTO_ALTURA', 'Salto em Altura', 'metros', { permiteEmpate: false, scoreMax: 9999 }),
};

export const DEFAULT_RULE: SportRule = make('OUTRO', 'Outro', 'pontos', { scoreMax: 999 });

export const getSportRule = (modalidade?: string): SportRule => {
  if (!modalidade) return DEFAULT_RULE;
  const upper = modalidade.toUpperCase();
  return SPORT_RULES[upper] ?? DEFAULT_RULE;
};

// Pontos para o ranking (vitória/empate/derrota)
export const pontosRanking = (placarA: number, placarB: number, regra: SportRule) => {
  if (placarA > placarB) return { a: 3, b: 0 };
  if (placarB > placarA) return { a: 0, b: 3 };
  if (regra.permiteEmpate) return { a: 1, b: 1 };
  return { a: 0, b: 0 };
};

// Lista única de modalidades disponíveis para seleção (cada uma com seu gênero implícito ao cadastrar a equipe)
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
