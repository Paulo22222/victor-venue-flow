import { useCompetition } from '@/context/CompetitionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Swords, ChevronLeft, Calculator, Info } from 'lucide-react';
import { calcRodizio, calcEliminatorioSimples, calcMisto, calcSuico, gerarTabelaRodizio, gerarTabelaEliminatoria } from '@/utils/disputeCalculations';
import { SistemaDisputa, Jogo } from '@/types/competition';

const sistemaInfo: Record<string, { nome: string; desc: string }> = {
  rodizio: { nome: 'Rodízio (Todos contra Todos)', desc: 'Maior justiça esportiva, porém maior duração. J = n(n-1)/2' },
  eliminatorio: { nome: 'Eliminatório Simples', desc: 'Rapidez na definição, menor justiça. J = n - 1' },
  misto: { nome: 'Misto (Grupos + Eliminatória)', desc: 'Equilíbrio entre justiça e duração.' },
  suico: { nome: 'Sistema Suíço', desc: 'Pareamento por desempenho. Ideal para xadrez e esportes intelectuais.' },
};

const Stage3Dispute = () => {
  const { state, updateDisputa, setJogos, setStep } = useCompetition();
  const { disputa, competidores } = state;

  const n = competidores.tipo === 'individual' ? competidores.atletas.length : competidores.equipes.length;
  const nomes = competidores.tipo === 'individual'
    ? competidores.atletas.map(a => a.nome)
    : competidores.equipes.map(e => e.nome);

  const getCalcInfo = () => {
    if (n < 2) return null;
    switch (disputa.sistema) {
      case 'rodizio': return calcRodizio(n);
      case 'eliminatorio': return calcEliminatorioSimples(n);
      case 'misto': {
        const numGrupos = Math.max(2, Math.ceil(n / 4));
        const porGrupo = Math.ceil(n / numGrupos);
        return { ...calcMisto(numGrupos, porGrupo, 2), numGrupos, porGrupo };
      }
      case 'suico': return calcSuico(n);
      default: return null;
    }
  };

  const calcInfo = getCalcInfo();

  const gerarTabela = () => {
    if (n < 2) return;
    let tabelaRaw: { rodada: number; jogoA: string; jogoB: string }[] = [];
    if (disputa.sistema === 'rodizio') {
      tabelaRaw = gerarTabelaRodizio(nomes);
    } else if (disputa.sistema === 'eliminatorio') {
      tabelaRaw = gerarTabelaEliminatoria(nomes);
    } else {
      // For misto/suico, fallback to rodizio for now
      tabelaRaw = gerarTabelaRodizio(nomes);
    }
    const jogos: Jogo[] = tabelaRaw.map((j, i) => ({
      id: `jogo-${i}`,
      rodada: j.rodada,
      participanteA: j.jogoA,
      participanteB: j.jogoB,
    }));
    setJogos(jogos);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      <Card className="shadow-card border-0">
        <CardHeader className="gradient-primary rounded-t-lg">
          <CardTitle className="text-primary-foreground flex items-center gap-2">
            <Swords className="w-6 h-6" />
            Etapa III — Sistema de Disputa
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <Info className="w-4 h-4 inline mr-1" />
              {n} participante(s) cadastrado(s) ({competidores.tipo || 'tipo não definido'}) · {competidores.modalidades.length} modalidade(s)
            </p>
          </div>

          <div>
            <Label className="mb-3 block">Selecione o Sistema de Disputa</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Object.keys(sistemaInfo) as SistemaDisputa[]).map(s => (
                <button
                  key={s}
                  onClick={() => updateDisputa({ sistema: s })}
                  className={`text-left p-4 rounded-lg border-2 transition-all hover:shadow-card
                    ${disputa.sistema === s ? 'border-primary bg-primary/5 shadow-card' : 'border-border hover:border-primary/30'}
                  `}
                >
                  <div className="font-semibold">{sistemaInfo[s].nome}</div>
                  <div className="text-sm text-muted-foreground mt-1">{sistemaInfo[s].desc}</div>
                </button>
              ))}
            </div>
          </div>

          {calcInfo && disputa.sistema && (
            <Card className="bg-info/5 border-info/20">
              <CardContent className="p-4">
                <h4 className="font-heading font-semibold flex items-center gap-2 mb-3">
                  <Calculator className="w-5 h-5 text-info" />
                  Cálculos Automáticos ({sistemaInfo[disputa.sistema].nome})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  {'jogos' in calcInfo && (
                    <div className="bg-card rounded-lg p-3 shadow-sm">
                      <div className="text-muted-foreground">Total de Jogos</div>
                      <div className="text-2xl font-bold text-primary">{calcInfo.jogos}</div>
                    </div>
                  )}
                  {'totalJogos' in calcInfo && (
                    <div className="bg-card rounded-lg p-3 shadow-sm">
                      <div className="text-muted-foreground">Total de Jogos</div>
                      <div className="text-2xl font-bold text-primary">{calcInfo.totalJogos}</div>
                    </div>
                  )}
                  {'rodadas' in calcInfo && (
                    <div className="bg-card rounded-lg p-3 shadow-sm">
                      <div className="text-muted-foreground">Rodadas</div>
                      <div className="text-2xl font-bold text-secondary">{calcInfo.rodadas}</div>
                    </div>
                  )}
                  {'isentos' in calcInfo && (calcInfo as any).isentos > 0 && (
                    <div className="bg-card rounded-lg p-3 shadow-sm">
                      <div className="text-muted-foreground">Isentos (Byes)</div>
                      <div className="text-2xl font-bold text-accent">{(calcInfo as any).isentos}</div>
                    </div>
                  )}
                  {'fases' in calcInfo && (
                    <div className="bg-card rounded-lg p-3 shadow-sm">
                      <div className="text-muted-foreground">Fases</div>
                      <div className="text-2xl font-bold text-secondary">{(calcInfo as any).fases}</div>
                    </div>
                  )}
                  {'numGrupos' in calcInfo && (
                    <div className="bg-card rounded-lg p-3 shadow-sm">
                      <div className="text-muted-foreground">Grupos</div>
                      <div className="text-2xl font-bold text-secondary">{(calcInfo as any).numGrupos}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <Label>Sugestão Manual (opcional)</Label>
            <Textarea
              value={disputa.sugestaoManual}
              onChange={e => updateDisputa({ sugestaoManual: e.target.value })}
              placeholder="Escreva observações ou ajustes manuais sobre a forma de disputa..."
              className="mt-1"
            />
          </div>

          {n >= 2 && disputa.sistema && (
            <Button onClick={gerarTabela} className="gradient-primary text-primary-foreground w-full">
              <Swords className="w-4 h-4 mr-2" /> Gerar Tabela de Jogos Automaticamente
            </Button>
          )}

          {state.jogos.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-heading font-semibold">Tabela Gerada</h4>
              <div className="rounded-lg border overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="p-2 text-left">Rodada</th>
                      <th className="p-2 text-left">Participante A</th>
                      <th className="p-2 text-center">×</th>
                      <th className="p-2 text-left">Participante B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.jogos.map(j => (
                      <tr key={j.id} className="border-t hover:bg-muted/50">
                        <td className="p-2"><Badge variant="outline">{j.rodada}</Badge></td>
                        <td className="p-2 font-medium">{j.participanteA}</td>
                        <td className="p-2 text-center text-muted-foreground">×</td>
                        <td className="p-2 font-medium">{j.participanteB}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-muted-foreground text-sm">{state.jogos.length} jogo(s) gerado(s)</p>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(2)}><ChevronLeft className="w-4 h-4 mr-1" /> Voltar</Button>
            <Button onClick={() => setStep(4)} className="gradient-primary text-primary-foreground px-8">Próximo →</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Stage3Dispute;
