export function calcRodizio(n: number) {
  const jogos = (n * (n - 1)) / 2;
  const rodadas = n % 2 === 0 ? n - 1 : n;
  const isentos = n % 2 !== 0 ? 1 : 0;
  return { jogos, rodadas, isentos };
}

export function calcEliminatorioSimples(n: number) {
  const jogos = n - 1;
  let k = 1;
  while (Math.pow(2, k) < n) k++;
  const potenciaProxima = Math.pow(2, k);
  const isentos = potenciaProxima - n;
  return { jogos, isentos, fases: k };
}

export function calcEliminatorioDuplo(n: number) {
  const jogos = 2 * (n - 1);
  return { jogos };
}

export function calcMisto(numGrupos: number, participantesPorGrupo: number, classificadosPorGrupo: number) {
  let jogosGrupos = 0;
  for (let i = 0; i < numGrupos; i++) {
    jogosGrupos += (participantesPorGrupo * (participantesPorGrupo - 1)) / 2;
  }
  const classificados = numGrupos * classificadosPorGrupo;
  const jogosEliminatoria = classificados - 1;
  return { jogosGrupos, jogosEliminatoria, totalJogos: jogosGrupos + jogosEliminatoria };
}

export function calcSuico(n: number) {
  const rodadas = Math.ceil(Math.log2(n));
  const jogos = Math.floor((n * rodadas) / 2);
  return { rodadas, jogos };
}

export function calcCapacidadeMaxima(tempoTotal: number, tempoPorJogo: number, intervalo: number, espacos: number) {
  if (tempoPorJogo + intervalo <= 0) return 0;
  return Math.floor((tempoTotal / (tempoPorJogo + intervalo)) * espacos);
}

export function gerarTabelaRodizio(participantes: string[]): { rodada: number; jogoA: string; jogoB: string }[] {
  const n = participantes.length;
  const lista = [...participantes];
  if (n % 2 !== 0) lista.push('BYE');
  const total = lista.length;
  const rodadas = total - 1;
  const jogos: { rodada: number; jogoA: string; jogoB: string }[] = [];

  for (let r = 0; r < rodadas; r++) {
    for (let i = 0; i < total / 2; i++) {
      const a = lista[i];
      const b = lista[total - 1 - i];
      if (a !== 'BYE' && b !== 'BYE') {
        jogos.push({ rodada: r + 1, jogoA: a, jogoB: b });
      }
    }
    const last = lista.pop()!;
    lista.splice(1, 0, last);
  }
  return jogos;
}

export function gerarTabelaEliminatoria(participantes: string[]): { rodada: number; jogoA: string; jogoB: string }[] {
  const n = participantes.length;
  let k = 1;
  while (Math.pow(2, k) < n) k++;
  const size = Math.pow(2, k);
  const byes = size - n;

  const jogos: { rodada: number; jogoA: string; jogoB: string }[] = [];
  const allParticipants = [...participantes];
  for (let i = 0; i < byes; i++) allParticipants.push('BYE');

  let currentRound = allParticipants;
  let rodada = 1;
  while (currentRound.length > 1) {
    const nextRound: string[] = [];
    for (let i = 0; i < currentRound.length; i += 2) {
      const a = currentRound[i];
      const b = currentRound[i + 1];
      if (a === 'BYE') {
        nextRound.push(b);
      } else if (b === 'BYE') {
        nextRound.push(a);
      } else {
        jogos.push({ rodada, jogoA: a, jogoB: b });
        nextRound.push(`Vencedor(${a} x ${b})`);
      }
    }
    currentRound = nextRound;
    rodada++;
  }
  return jogos;
}
