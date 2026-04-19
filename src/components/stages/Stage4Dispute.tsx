import { useCompetition } from '@/context/CompetitionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Swords, ChevronLeft, ChevronRight, Trophy, Zap, Layers, Brain, Check } from 'lucide-react';
import { SistemaDisputa, Jogo } from '@/types/competition';
import { gerarTabelaRodizio, gerarTabelaEliminatoria } from '@/utils/disputeCalculations';

const SISTEMAS: { key: SistemaDisputa; nome: string; desc: string; icon: typeof Trophy; ideal: string }[] = [
  { key: 'rodizio',     nome: 'Rodízio',         desc: 'Todos contra todos',           icon: Trophy, ideal: 'Mais justo · ideal para até 8 equipes' },
  { key: 'eliminatorio',nome: 'Eliminatório',    desc: 'Mata-mata direto',             icon: Zap,    ideal: 'Mais rápido · perdeu, está fora' },
  { key: 'misto',       nome: 'Misto',           desc: 'Grupos + mata-mata',           icon: Layers, ideal: 'Equilibrado · grupos + finais' },
  { key: 'suico',       nome: 'Sistema Suíço',   desc: 'Pareamento por desempenho',    icon: Brain,  ideal: 'Ideal para muitas equipes em pouco tempo' },
];

const Stage4Dispute = () => {
  const { state, updateDisputa, setJogos, setStep } = useCompetition();
  const modalidades = state.competidores.modalidades;
  const porModalidade = state.disputa.porModalidade || {};

  const setSistemaForMod = (mod: string, sistema: SistemaDisputa) => {
    updateDisputa({ porModalidade: { ...porModalidade, [mod]: sistema } });
  };

  const equipesDaMod = (mod: string) =>
    state.competidores.equipes.filter(e => e.modalidade === mod);

  const todasConfiguradas = modalidades.every(m => !!porModalidade[m.nome]);

  const gerarChaveamentos = () => {
    const novosJogos: Jogo[] = [];
    modalidades.forEach(m => {
      const sis = porModalidade[m.nome];
      const eqs = equipesDaMod(m.nome);
      const nomes = eqs.map(e => e.nome);
      if (!sis || nomes.length < 2) return;

      let raw: { rodada: number; jogoA: string; jogoB: string }[] = [];
      if (sis === 'eliminatorio') raw = gerarTabelaEliminatoria(nomes);
      else raw = gerarTabelaRodizio(nomes); // rodizio/misto/suico fallback simples

      raw.forEach((j, i) => {
        novosJogos.push({
          id: `${m.nome}-${j.rodada}-${i}-${crypto.randomUUID().slice(0, 8)}`,
          rodada: j.rodada,
          participanteA: j.jogoA,
          participanteB: j.jogoB,
          modalidade: m.nome,
          esporte: m.nome,
        });
      });
    });
    setJogos(novosJogos);
  };

  const jogosPorMod = (mod: string) => state.jogos.filter(j => j.modalidade === mod);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up py-6">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
          <Swords className="w-4 h-4" /> Etapa 4 de 6
        </div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold">Sistema de disputa por modalidade</h1>
        <p className="text-muted-foreground mt-1">Defina como cada esporte será disputado.</p>
      </div>

      <div className="space-y-4">
        {modalidades.map(m => {
          const eqs = equipesDaMod(m.nome);
          const atual = porModalidade[m.nome];
          const jogos = jogosPorMod(m.nome);
          return (
            <Card key={m.nome} className="border-border">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-semibold text-lg">{m.nome}</h3>
                    <Badge variant="secondary">{eqs.length} equipe(s)</Badge>
                    {jogos.length > 0 && <Badge className="bg-success text-success-foreground">{jogos.length} jogo(s)</Badge>}
                  </div>
                  {eqs.length < 2 && <span className="text-xs text-destructive">Mínimo 2 equipes</span>}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {SISTEMAS.map(s => {
                    const Sel = s.icon;
                    const isAtivo = atual === s.key;
                    return (
                      <button
                        key={s.key}
                        onClick={() => setSistemaForMod(m.nome, s.key)}
                        className={`relative text-left p-3 rounded-lg border-2 transition-all
                          ${isAtivo ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'}
                        `}
                      >
                        {isAtivo && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                        <Sel className={`w-5 h-5 mb-1.5 ${isAtivo ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="font-semibold text-sm">{s.nome}</div>
                        <div className="text-xs text-muted-foreground">{s.desc}</div>
                      </button>
                    );
                  })}
                </div>
                {atual && (
                  <p className="text-xs text-muted-foreground">{SISTEMAS.find(s => s.key === atual)?.ideal}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="font-semibold">Pronto para gerar os jogos?</div>
            <p className="text-xs text-muted-foreground">
              Os confrontos serão criados automaticamente a partir das equipes e do sistema de cada modalidade.
            </p>
          </div>
          <Button
            onClick={gerarChaveamentos}
            disabled={!todasConfiguradas}
            className="gradient-primary text-primary-foreground gap-2"
          >
            <Zap className="w-4 h-4" /> Gerar chaveamentos
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => setStep(3)} className="gap-2">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Button>
        <Button
          onClick={() => setStep(5)}
          disabled={!todasConfiguradas}
          className="gradient-primary text-primary-foreground gap-2 px-8"
        >
          Continuar <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Stage4Dispute;
