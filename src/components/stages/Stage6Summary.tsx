import { useMemo, useState } from 'react';
import { useCompetition } from '@/context/CompetitionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronLeft, Save, CheckCircle2, FileText, Trophy, Loader2, Minus, Plus, Radio, Flag } from 'lucide-react';
import { generateCompetitionPDF } from '@/utils/pdfGenerator';
import { getSportRule, pontosRanking } from '@/utils/sportRules';
import { updateMatchScore } from '@/services/competitionService';
import { toast } from '@/hooks/use-toast';

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

const Stage6Summary = () => {
  const { state, competitionId, save, saving, finalize, updateResultado, setStep } = useCompetition();
  const { evento, competidores, jogos, resultados, logistica, disputa } = state;
  const modalidades = competidores.modalidades;
  const [activeTab, setActiveTab] = useState(modalidades[0]?.nome || 'resumo');
  const [savingScore, setSavingScore] = useState<string | null>(null);
  const [finalizeRound, setFinalizeRound] = useState<{ mod: string; rodada: number } | null>(null);

  const liveUpdate = async (jogoId: string, a: number, b: number) => {
    if (!competitionId || !isUuid(jogoId)) {
      toast({ title: 'Salve o evento primeiro', description: 'As alterações no placar só podem ser feitas após clicar em "Salvar evento".', variant: 'destructive' });
      return;
    }
    updateResultado(jogoId, a, b);
    try {
      setSavingScore(jogoId);
      await updateMatchScore(jogoId, a, b);
    } catch (err: any) {
      toast({ title: 'Erro ao salvar placar', description: err.message, variant: 'destructive' });
    } finally {
      setSavingScore(null);
    }
  };

  const jogosPorMod = (mod: string) => jogos.filter(j => (j.modalidade || '').toUpperCase() === mod.toUpperCase());

  const rankingPorMod = (mod: string) => {
    const regra = getSportRule(mod);
    const tabela: Record<string, { p: number; v: number; e: number; d: number; sg: number }> = {};
    const eqs = competidores.equipes.filter(e => (e.modalidade || '').toUpperCase() === mod.toUpperCase());
    eqs.forEach(e => { tabela[e.nome] = { p: 0, v: 0, e: 0, d: 0, sg: 0 }; });
    jogosPorMod(mod).forEach(j => {
      const r = resultados[j.id];
      if (!r) return;
      const { a, b } = pontosRanking(r.placarA, r.placarB, regra);
      if (!tabela[j.participanteA]) tabela[j.participanteA] = { p: 0, v: 0, e: 0, d: 0, sg: 0 };
      if (!tabela[j.participanteB]) tabela[j.participanteB] = { p: 0, v: 0, e: 0, d: 0, sg: 0 };
      tabela[j.participanteA].p += a;
      tabela[j.participanteB].p += b;
      tabela[j.participanteA].sg += (r.placarA - r.placarB);
      tabela[j.participanteB].sg += (r.placarB - r.placarA);
      if (r.placarA > r.placarB) { tabela[j.participanteA].v++; tabela[j.participanteB].d++; }
      else if (r.placarB > r.placarA) { tabela[j.participanteB].v++; tabela[j.participanteA].d++; }
      else { tabela[j.participanteA].e++; tabela[j.participanteB].e++; }
    });
    return Object.entries(tabela).sort((a, b) => b[1].p - a[1].p || b[1].sg - a[1].sg);
  };

  const handleFinalize = async () => {
    if (!confirm('Finalizar o evento? Os resultados ficarão visíveis ao público como concluídos.')) return;
    await finalize();
  };

  // Finalizar uma rodada inteira: para cada jogo sem placar, marca um vencedor padrão (o usuário escolhe por jogo no modal)
  const FinalizeRoundDialog = () => {
    const [winners, setWinners] = useState<Record<string, 'A' | 'B'>>({});
    const ctx = finalizeRound;
    const matches = useMemo(() => ctx ? jogosPorMod(ctx.mod).filter(j => j.rodada === ctx.rodada && !resultados[j.id]) : [], [ctx]);
    if (!ctx) return null;
    const regra = getSportRule(ctx.mod);
    const handle = async () => {
      // Para cada jogo sem resultado, decreta vencedor 1x0 (ou conforme regra)
      const placarVencedor = regra.passoIncremento; // 1 para futsal/handebol; vôlei = 1 set
      for (const j of matches) {
        const w = winners[j.id];
        if (!w) {
          toast({ title: 'Selecione o vencedor de todos os jogos', variant: 'destructive' });
          return;
        }
        const a = w === 'A' ? placarVencedor : 0;
        const b = w === 'B' ? placarVencedor : 0;
        updateResultado(j.id, a, b);
        if (competitionId && isUuid(j.id)) {
          try { await updateMatchScore(j.id, a, b); } catch { /* keep going */ }
        }
      }
      toast({ title: `Rodada ${ctx.rodada} finalizada!`, description: `${matches.length} jogo(s) decididos.` });
      setFinalizeRound(null);
    };
    return (
      <Dialog open={!!ctx} onOpenChange={(o) => !o && setFinalizeRound(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Flag className="w-5 h-5 text-primary" /> Finalizar Rodada {ctx.rodada} — {ctx.mod}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {matches.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todos os jogos desta rodada já têm placar.</p>
            ) : matches.map(j => (
              <div key={j.id} className="rounded-lg border p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Selecione o vencedor:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={winners[j.id] === 'A' ? 'default' : 'outline'}
                    className={winners[j.id] === 'A' ? 'gradient-primary text-primary-foreground' : ''}
                    onClick={() => setWinners(s => ({ ...s, [j.id]: 'A' }))}
                  >
                    {j.participanteA}
                  </Button>
                  <Button
                    variant={winners[j.id] === 'B' ? 'default' : 'outline'}
                    className={winners[j.id] === 'B' ? 'gradient-primary text-primary-foreground' : ''}
                    onClick={() => setWinners(s => ({ ...s, [j.id]: 'B' }))}
                  >
                    {j.participanteB}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalizeRound(null)}>Cancelar</Button>
            {matches.length > 0 && (
              <Button className="gradient-primary text-primary-foreground gap-2" onClick={handle}>
                <CheckCircle2 className="w-4 h-4" /> Confirmar vencedores
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up py-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
            <FileText className="w-4 h-4" /> Etapa 6 de 6
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">{evento.nome || 'Evento'}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {evento.data || logistica.dia} {evento.horario && `· ${evento.horario}`} {logistica.local && `· ${logistica.local}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={save} disabled={saving} className="gradient-primary text-primary-foreground gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {competitionId ? 'Salvar alterações' : 'Salvar evento'}
          </Button>
          <Button variant="outline" onClick={() => generateCompetitionPDF(state)} className="gap-2">
            <FileText className="w-4 h-4" /> PDF
          </Button>
          {!state.finalizado && competitionId && (
            <Button onClick={handleFinalize} className="bg-success text-success-foreground hover:bg-success/90 gap-2">
              <CheckCircle2 className="w-4 h-4" /> Finalizar evento
            </Button>
          )}
        </div>
      </div>

      {state.finalizado && (
        <Card className="bg-success/5 border-success/30">
          <CardContent className="p-4 flex items-center gap-2 text-success">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold">Evento finalizado — resultados publicados.</span>
          </CardContent>
        </Card>
      )}

      {!competitionId && (
        <Card className="bg-accent/10 border-accent/30">
          <CardContent className="p-4 text-sm">
            <strong>Salve o evento</strong> para poder atualizar placares em tempo real e exibi-lo ao público.
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start flex-wrap h-auto p-1">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          {modalidades.map(m => (
            <TabsTrigger key={m.nome} value={m.nome} className="gap-2">
              {m.nome}
              <Badge variant="secondary" className="h-5">{jogosPorMod(m.nome).length}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="resumo" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Modalidades" value={modalidades.length} />
            <StatCard label="Equipes" value={competidores.equipes.length} />
            <StatCard label="Atletas" value={competidores.equipes.reduce((s, e) => s + e.integrantes.length, 0)} />
            <StatCard label="Jogos" value={jogos.length} />
          </div>
          <Card>
            <CardContent className="p-5">
              <h3 className="font-heading font-semibold mb-3">Sistemas de disputa</h3>
              <div className="space-y-2 text-sm">
                {modalidades.map(m => (
                  <div key={m.nome} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                    <span>{m.nome}</span>
                    <Badge variant="outline" className="capitalize">{disputa.porModalidade?.[m.nome] || '—'}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {modalidades.map(m => {
          const ranking = rankingPorMod(m.nome);
          const rounds = jogosPorMod(m.nome).reduce<Record<number, typeof jogos>>((acc, j) => {
            (acc[j.rodada] ||= []).push(j); return acc;
          }, {});
          const rkeys = Object.keys(rounds).map(Number).sort((a, b) => a - b);
          const regra = getSportRule(m.nome);
          return (
            <TabsContent key={m.nome} value={m.nome} className="mt-4 space-y-6">
              {/* Classificação */}
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-primary" /> Classificação — {m.nome}
                  </h3>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-2 text-left">#</th>
                          <th className="p-2 text-left">Equipe</th>
                          <th className="p-2 text-center">P</th>
                          <th className="p-2 text-center">V</th>
                          <th className="p-2 text-center">E</th>
                          <th className="p-2 text-center">D</th>
                          <th className="p-2 text-center">SG</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ranking.length === 0 ? (
                          <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">Sem placares lançados.</td></tr>
                        ) : ranking.map(([nome, s], i) => (
                          <tr key={nome} className={`border-t ${i < 3 ? 'font-semibold' : ''}`}>
                            <td className="p-2">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`}</td>
                            <td className="p-2">{nome}</td>
                            <td className="p-2 text-center font-bold text-primary">{s.p}</td>
                            <td className="p-2 text-center">{s.v}</td>
                            <td className="p-2 text-center">{s.e}</td>
                            <td className="p-2 text-center">{s.d}</td>
                            <td className="p-2 text-center">{s.sg > 0 ? `+${s.sg}` : s.sg}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Chaveamento com placar editável + finalizar rodada */}
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-destructive animate-pulse" /> Placares ao vivo — {m.nome}
                  </h3>
                  {rkeys.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum jogo gerado para esta modalidade.</p>
                  ) : (
                    <div className="space-y-5">
                      {rkeys.map(r => {
                        const pendentes = rounds[r].filter(j => !resultados[j.id]).length;
                        return (
                          <div key={r}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs font-bold text-primary tracking-wider">RODADA {r}</div>
                              {!state.finalizado && pendentes > 0 && (
                                <Button
                                  size="sm" variant="outline"
                                  className="h-7 gap-1.5 text-xs"
                                  onClick={() => setFinalizeRound({ mod: m.nome, rodada: r })}
                                >
                                  <Flag className="w-3 h-3" /> Finalizar rodada ({pendentes})
                                </Button>
                              )}
                            </div>
                            <div className="grid gap-2 md:grid-cols-2">
                              {rounds[r].map(j => {
                                const cur = resultados[j.id] || { placarA: 0, placarB: 0 };
                                const decided = !!resultados[j.id];
                                const winA = decided && cur.placarA > cur.placarB;
                                const winB = decided && cur.placarB > cur.placarA;
                                return (
                                  <div key={j.id} className="rounded-lg border bg-card p-3">
                                    <ScoreRow
                                      name={j.participanteA}
                                      value={cur.placarA}
                                      winner={winA}
                                      loading={savingScore === j.id}
                                      onChange={(v) => liveUpdate(j.id, v, cur.placarB)}
                                      rule={regra}
                                      disabled={state.finalizado}
                                    />
                                    <div className="border-t my-2" />
                                    <ScoreRow
                                      name={j.participanteB}
                                      value={cur.placarB}
                                      winner={winB}
                                      loading={savingScore === j.id}
                                      onChange={(v) => liveUpdate(j.id, cur.placarA, v)}
                                      rule={regra}
                                      disabled={state.finalizado}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      <FinalizeRoundDialog />

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => setStep(5)} className="gap-2">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Button>
      </div>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: number | string }) => (
  <Card>
    <CardContent className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
    </CardContent>
  </Card>
);

const ScoreRow = ({
  name, value, winner, onChange, rule, disabled, loading,
}: {
  name: string; value: number; winner: boolean; loading: boolean;
  onChange: (v: number) => void;
  rule: ReturnType<typeof getSportRule>;
  disabled: boolean;
}) => (
  <div className={`flex items-center justify-between gap-3 ${winner ? 'font-bold text-foreground' : ''}`}>
    <span className="truncate flex-1">{name}</span>
    <div className="flex items-center gap-1.5">
      <Button
        size="icon" variant="outline" className="h-7 w-7"
        disabled={disabled || value <= rule.scoreMin}
        onClick={() => onChange(Math.max(rule.scoreMin, value - rule.passoIncremento))}
      ><Minus className="w-3 h-3" /></Button>
      <span className={`tabular-nums text-xl w-9 text-center font-bold ${winner ? 'text-primary' : 'text-muted-foreground'}`}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : value}
      </span>
      <Button
        size="icon" variant="outline" className="h-7 w-7"
        disabled={disabled || value >= rule.scoreMax}
        onClick={() => onChange(Math.min(rule.scoreMax, value + rule.passoIncremento))}
      ><Plus className="w-3 h-3" /></Button>
    </div>
  </div>
);

export default Stage6Summary;
