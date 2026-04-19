// Regras de pontuação por esporte (configurações para a UI)
export type SportKey = 'FUTSAL' | 'VOLEI' | 'HANDEBOL' | 'OUTRO';

export interface SportRule {
  key: SportKey;
  nome: string;
  unidade: string;        // "gols" | "sets" | "pontos"
  passoIncremento: number; // quanto somar/subtrair com +/-
  permiteEmpate: boolean;
  scoreMin: number;
  scoreMax: number;
  cor: string;            // tailwind classe de cor
  emoji: string;
}

export const SPORT_RULES: Record<string, SportRule> = {
  FUTSAL: {
    key: 'FUTSAL', nome: 'Futsal', unidade: 'gols',
    passoIncremento: 1, permiteEmpate: true, scoreMin: 0, scoreMax: 99,
    cor: 'bg-emerald-500', emoji: '⚽',
  },
  VOLEI: {
    key: 'VOLEI', nome: 'Vôlei', unidade: 'sets',
    passoIncremento: 1, permiteEmpate: false, scoreMin: 0, scoreMax: 5,
    cor: 'bg-blue-500', emoji: '🏐',
  },
  'VÔLEI': {
    key: 'VOLEI', nome: 'Vôlei', unidade: 'sets',
    passoIncremento: 1, permiteEmpate: false, scoreMin: 0, scoreMax: 5,
    cor: 'bg-blue-500', emoji: '🏐',
  },
  HANDEBOL: {
    key: 'HANDEBOL', nome: 'Handebol', unidade: 'gols',
    passoIncremento: 1, permiteEmpate: true, scoreMin: 0, scoreMax: 99,
    cor: 'bg-orange-500', emoji: '🤾',
  },
};

export const getSportRule = (modalidade?: string): SportRule => {
  if (!modalidade) return DEFAULT_RULE;
  const upper = modalidade.toUpperCase();
  return SPORT_RULES[upper] ?? DEFAULT_RULE;
};

export const DEFAULT_RULE: SportRule = {
  key: 'OUTRO', nome: 'Outro', unidade: 'pontos',
  passoIncremento: 1, permiteEmpate: true, scoreMin: 0, scoreMax: 999,
  cor: 'bg-primary', emoji: '🏆',
};

// Pontos para o ranking (vitória/empate/derrota)
export const pontosRanking = (placarA: number, placarB: number, regra: SportRule) => {
  if (placarA > placarB) return { a: 3, b: 0 };
  if (placarB > placarA) return { a: 0, b: 3 };
  if (regra.permiteEmpate) return { a: 1, b: 1 };
  return { a: 0, b: 0 };
};
