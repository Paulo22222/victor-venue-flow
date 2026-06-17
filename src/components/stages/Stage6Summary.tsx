import { useEffect, useMemo, useState } from 'react';
import { useCompetition } from '@/context/CompetitionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronLeft, Save, CheckCircle2, FileText, Trophy, Loader2, Minus, Plus, Radio, Flag, CalendarClock, MapPin, Lock, History, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { generateCompetitionPDF } from '@/utils/pdfGenerator';
import { getSportRule, aplicarPartida, linhaVazia, type SportRule, type RankingRow } from '@/utils/sportRules';
import { updateMatchScore, updateMatchSchedule, finalizeMatch, createManualMatch, updateMatchParticipants, deleteMatch, getMatchHistory, MatchHistoryRow } from '@/services/competitionService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Jogo } from '@/types/competition';

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const isPending = (name?: string) => !name || name.startsWith('Vencedor(');
const displayName = (name?: string) => (isPending(name) ? 'Aguardando adversário' : name!);

const Stage6Summary = () => {
  const { state, competitionId, save, saving, finalize, updateResultado, updateJogo, setStep } = useCompetition();
  const { evento, competidores, jogos, resultados, logistica, disputa } = state;
  const modalidades = competidores.modalidades;
  const [activeTab, setActiveTab] = useState(modalidades[0]?.nome || 'resumo');
  const [savingScore, setSavingScore] = useState<string | null>(null);
  const [finalizeRound, setFinalizeRound] = useState<{ mod: string; rodada: number } | null>(null);
  const [rescheduleJogo, setRescheduleJogo] = useState<Jogo | null>(null);
  const [venues, setVenues] = useState<{ id: string; nome: string; modalidade_nome: string | null }[]>([]);
  const [manualDialog, setManualDialog] = useState<{ mod: string; jogo?: Jogo } | null>(null);
  const [historyDialog, setHistoryDialog] = useState<Jogo | null>(null);

  useEffect(() => {
    supabase.from('venues').select('id, nome, modalidade_nome').eq('disponivel', true).order('nome')
      .then(({ data }) => setVenues((data ?? []) as any));
  }, []);

  // Propaga vencedor para o próximo jogo da chave (substitui "Vencedor(A x B)")
  // IMPORTANTE: jogos marcados como `manual` NÃO são sobrescritos.
  const propagarVencedor = async (jogoDecidido: Jogo, vencedor: string) => {
    const placeholder = `Vencedor(${jogoDecidido.participanteA} x ${jogoDecidido.participanteB})`;
    const proximos = jogos.filter(
      j => !(j as any).manual &&
        (j.modalidade || '').toUpperCase() === (jogoDecidido.modalidade || '').toUpperCase() &&
        j.rodada > jogoDecidido.rodada &&
        (j.participanteA === placeholder || j.participanteB === placeholder)
    );
    for (const p of proximos) {
      const patch: Partial<Jogo> = {};
      if (p.participanteA === placeholder) patch.participanteA = vencedor;
      if (p.participanteB === placeholder) patch.participanteB = vencedor;
      updateJogo(p.id, patch);
      if (competitionId && isUuid(p.id)) {
        try {
          await supabase.from('competition_matches').update({
            participante_a: patch.participanteA ?? p.participanteA,
            participante_b: patch.participanteB ?? p.participanteB,
          }).eq('id', p.id);
        } catch { /* segue */ }
      }
    }
  };

  const liveUpdate = async (jogoId: string, a: number, b: number, detalhes?: { sets?: number[][] } | null) => {
    if (!competitionId || !isUuid(jogoId)) {
      toast({ title: 'Salve o evento primeiro', description: 'As alterações no placar só podem ser feitas após clicar em "Salvar evento".', variant: 'destructive' });
      return;
    }
    const jogo = jogos.find(j => j.id === jogoId);
    if (jogo?.finalizada) {
      toast({ title: 'Partida finalizada', description: 'Para alterar o placar, reabra a partida.', variant: 'destructive' });
      return;
    }
    updateResultado(jogoId, a, b);
    if (detalhes !== undefined) updateJogo(jogoId, { detalhesPlacar: detalhes } as any);
    try {
      setSavingScore(jogoId);
      await updateMatchScore(jogoId, a, b, detalhes);
    } catch (err: any) {
      toast({ title: 'Erro ao salvar placar', description: err.message, variant: 'destructive' });
    } finally {
      setSavingScore(null);
    }
  };

  // Confirma resultado de uma partida individual e propaga o vencedor para a próxima fase
  const confirmarPartida = async (jogo: Jogo) => {
    if (!competitionId || !isUuid(jogo.id)) {
      toast({ title: 'Salve o evento primeiro', variant: 'destructive' });
      return;
    }
    const r = resultados[jogo.id];
    if (!r || r.placarA == null || r.placarB == null) {
      toast({ title: 'Registre o placar antes de finalizar', variant: 'destructive' });
      return;
    }
    if (r.placarA === r.placarB) {
      toast({ title: 'Empate não define vencedor', description: 'Ajuste o placar para definir o vencedor antes de finalizar.', variant: 'destructive' });
      return;
    }
    if (!confirm(`Confirmar resultado e finalizar a partida ${jogo.participanteA} ${r.placarA} x ${r.placarB} ${jogo.participanteB}? O vencedor avançará no chaveamento.`)) return;
    try {
      setSavingScore(jogo.id);
      await finalizeMatch(jogo.id, true);
      updateJogo(jogo.id, { finalizada: true });
      const vencedor = r.placarA > r.placarB ? jogo.participanteA : jogo.participanteB;
      await propagarVencedor(jogo, vencedor);
      toast({ title: 'Partida finalizada', description: `${vencedor} avançou.` });
    } catch (err: any) {
      toast({ title: 'Erro ao finalizar partida', description: err.message, variant: 'destructive' });
    } finally {
      setSavingScore(null);
    }
  };

  const reabrirPartida = async (jogo: Jogo) => {
    if (!confirm('Reabrir a partida? O vencedor permanecerá nas próximas fases até que você ajuste manualmente.')) return;
    try {
      await finalizeMatch(jogo.id, false);
      updateJogo(jogo.id, { finalizada: false });
      toast({ title: 'Partida reaberta' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const jogosPorMod = (mod: string) => jogos.filter(j => (j.modalidade || '').toUpperCase() === mod.toUpperCase());

  const generoEquipe = (nome: string, mod: string): string => {
    const eq = competidores.equipes.find(e => e.nome === nome && (e.modalidade || '').toUpperCase() === mod.toUpperCase());
    return (eq?.genero as string) || 'misto';
  };

  const rankingPorModEGenero = (mod: string, genero: string): RankingRow[] => {
    const regra = getSportRule(mod);
    const rows: Record<string, RankingRow> = {};
    const eqs = competidores.equipes.filter(e => (e.modalidade || '').toUpperCase() === mod.toUpperCase() && (e.genero || 'misto') === genero);
    eqs.forEach(e => { rows[e.nome] = linhaVazia(e.nome); });
    jogosPorMod(mod).forEach(j => {
      if (!j.finalizada) return;
      const r = resultados[j.id];
      if (!r) return;
      if (isPending(j.participanteA) || isPending(j.participanteB)) return;
      if (!rows[j.participanteA] || !rows[j.participanteB]) return;
      const detalhes = (j as any).detalhesPlacar as { sets?: number[][] } | null | undefined;
      aplicarPartida(rows[j.participanteA], regra, r.placarA, r.placarB, true, detalhes);
      aplicarPartida(rows[j.participanteB], regra, r.placarA, r.placarB, false, detalhes);
    });
    return Object.values(rows).sort((a, b) => b.P - a.P || b.SG - a.SG || (b.SetsV - b.SetsP) - (a.SetsV - a.SetsP));
  };

  const generosNaMod = (mod: string): string[] => {
    const set = new Set<string>();
    competidores.equipes
      .filter(e => (e.modalidade || '').toUpperCase() === mod.toUpperCase())
      .forEach(e => set.add(e.genero || 'misto'));
    return Array.from(set);
  };

  const handleFinalize = async () => {
    if (!confirm('Finalizar o evento? Os resultados ficarão visíveis ao público como concluídos.')) return;
    await finalize();
  };

  // Finalizar uma rodada inteira: para cada jogo sem placar, marca um vencedor padrão (o usuário escolhe por jogo no modal)
  const FinalizeRoundDialog = () => {
    const [winners, setWinners] = useState<Record<string, 'A' | 'B'>>({});
    const ctx = finalizeRound;
    const matches = useMemo(() => ctx ? jogosPorMod(ctx.mod).filter(j => j.rodada === ctx.rodada && !resultados[j.id] && !isPending(j.participanteA) && !isPending(j.participanteB)) : [], [ctx]);
    if (!ctx) return null;
    const regra = getSportRule(ctx.mod);
    const handle = async () => {
      const placarVencedor = Math.max(1, regra.passoIncremento);
      // Valida antes
      for (const j of matches) {
        if (!winners[j.id]) {
          toast({ title: 'Selecione o vencedor de todos os jogos', variant: 'destructive' });
          return;
        }
      }
      // Aplica resultados em paralelo (estado + DB) e finaliza cada partida
      await Promise.all(matches.map(async (j) => {
        const w = winners[j.id]!;
        const a = w === 'A' ? placarVencedor : 0;
        const b = w === 'B' ? placarVencedor : 0;
        updateResultado(j.id, a, b);
        if (competitionId && isUuid(j.id)) {
          try {
            await updateMatchScore(j.id, a, b);
            await finalizeMatch(j.id, true);
          } catch { /* keep going */ }
        }
        updateJogo(j.id, { finalizada: true });
        const vencedor = w === 'A' ? j.participanteA : j.participanteB;
        await propagarVencedor(j, vencedor);
      }));
      toast({ title: `Rodada ${ctx.rodada} finalizada!`, description: `${matches.length} jogo(s) decididos · vencedores avançaram.` });
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

  const RescheduleDialog = () => {
    const j = rescheduleJogo;
    const [data, setData] = useState(j?.data || '');
    const [horario, setHorario] = useState(j?.horario || '');
    const [local, setLocal] = useState(j?.local || '');
    const [savingSched, setSavingSched] = useState(false);
    useEffect(() => {
      setData(j?.data || ''); setHorario(j?.horario || ''); setLocal(j?.local || '');
    }, [j?.id]);
    if (!j) return null;
    const filteredVenues = venues.filter(v => !v.modalidade_nome || v.modalidade_nome.toUpperCase() === (j.modalidade || '').toUpperCase());
    const handleSave = async () => {
      if (!competitionId) return toast({ title: 'Salve o evento primeiro', variant: 'destructive' });
      setSavingSched(true);
      try {
        await updateMatchSchedule(j.id, { data: data || null, horario: horario || null, local: local || null });
        updateJogo(j.id, { data: data || undefined, horario: horario || undefined, local: local || undefined });
        toast({ title: 'Jogo agendado!' });
        setRescheduleJogo(null);
      } catch (e: any) {
        toast({ title: 'Erro', description: e.message, variant: 'destructive' });
      } finally { setSavingSched(false); }
    };
    return (
      <Dialog open={!!j} onOpenChange={(o) => !o && setRescheduleJogo(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CalendarClock className="w-5 h-5 text-primary" /> Agendar jogo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="font-semibold">{j.participanteA} <span className="text-muted-foreground font-normal">vs</span> {j.participanteB}</div>
              <div className="text-xs text-muted-foreground mt-1">{j.modalidade} · Rodada {j.rodada}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Data</Label><Input type="date" value={data} onChange={e => setData(e.target.value)} /></div>
              <div><Label className="text-xs">Horário</Label><Input type="time" value={horario} onChange={e => setHorario(e.target.value)} /></div>
            </div>
            <div>
              <Label className="text-xs">Local</Label>
              {filteredVenues.length > 0 ? (
                <Select value={local} onValueChange={setLocal}>
                  <SelectTrigger><SelectValue placeholder="Selecione um local cadastrado" /></SelectTrigger>
                  <SelectContent>
                    {filteredVenues.map(v => <SelectItem key={v.id} value={v.nome}>{v.nome}</SelectItem>)}
                    <SelectItem value="__custom__">Outro (digitar manualmente)</SelectItem>
                  </SelectContent>
                </Select>
              ) : null}
              {(filteredVenues.length === 0 || local === '__custom__') && (
                <Input className="mt-2" placeholder="Ex: Ginásio Central — Quadra 1" value={local === '__custom__' ? '' : local} onChange={e => setLocal(e.target.value)} />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleJogo(null)}>Cancelar</Button>
            <Button className="gradient-primary text-primary-foreground gap-2" onClick={handleSave} disabled={savingSched}>
              {savingSched ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const ManualMatchDialog = () => {
    const ctx = manualDialog;
    const [rodada, setRodada] = useState<number>(ctx?.jogo?.rodada ?? 1);
    const [a, setA] = useState<string>(ctx?.jogo?.participanteA ?? '');
    const [b, setB] = useState<string>(ctx?.jogo?.participanteB ?? '');
    const [savingM, setSavingM] = useState(false);
    useEffect(() => {
      setRodada(ctx?.jogo?.rodada ?? 1);
      setA(ctx?.jogo?.participanteA ?? '');
      setB(ctx?.jogo?.participanteB ?? '');
    }, [ctx?.jogo?.id, ctx?.mod]);
    if (!ctx) return null;
    const equipesMod = competidores.equipes.filter(e => (e.modalidade || '').toUpperCase() === ctx.mod.toUpperCase());
    const opcoes = equipesMod.map(e => e.nome);
    const handleSave = async () => {
      if (!competitionId) return toast({ title: 'Salve o evento primeiro', variant: 'destructive' });
      if (!a || !b || a === b) return toast({ title: 'Selecione duas equipes diferentes', variant: 'destructive' });
      setSavingM(true);
      try {
        if (ctx.jogo && isUuid(ctx.jogo.id)) {
          await updateMatchParticipants(ctx.jogo.id, a, b);
          updateJogo(ctx.jogo.id, { participanteA: a, participanteB: b, manual: true } as any);
        } else {
          const created = await createManualMatch(competitionId, { rodada, participanteA: a, participanteB: b, modalidade: ctx.mod });
          // adicionar localmente
          const novo: Jogo = { id: created.id, rodada, participanteA: a, participanteB: b, modalidade: ctx.mod, esporte: ctx.mod, manual: true } as any;
          (state.jogos as any).push(novo);
          updateJogo(created.id, { manual: true } as any);
        }
        toast({ title: ctx.jogo ? 'Confronto atualizado' : 'Confronto manual criado' });
        setManualDialog(null);
      } catch (e: any) {
        toast({ title: 'Erro', description: e.message, variant: 'destructive' });
      } finally { setSavingM(false); }
    };
    return (
      <Dialog open={!!ctx} onOpenChange={(o) => !o && setManualDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><PlusCircle className="w-5 h-5 text-primary" /> {ctx.jogo ? 'Editar confronto' : 'Adicionar confronto manual'} — {ctx.mod}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {!ctx.jogo && (
              <div><Label className="text-xs">Rodada</Label><Input type="number" min={1} value={rodada} onChange={ev => setRodada(Math.max(1, Number(ev.target.value)))} /></div>
            )}
            <div>
              <Label className="text-xs">Equipe A</Label>
              <Select value={a} onValueChange={setA}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{opcoes.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Equipe B</Label>
              <Select value={b} onValueChange={setB}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{opcoes.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <p className="text-[11px] text-muted-foreground">Confrontos manuais não são sobrescritos pela propagação automática de vencedores.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualDialog(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={savingM} className="gradient-primary text-primary-foreground gap-2">
              {savingM ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const HistoryDialog = () => {
    const j = historyDialog;
    const [rows, setRows] = useState<MatchHistoryRow[]>([]);
    const [loadingH, setLoadingH] = useState(false);
    useEffect(() => {
      if (!j) return;
      setLoadingH(true);
      getMatchHistory(j.id).then(setRows).catch(() => setRows([])).finally(() => setLoadingH(false));
    }, [j?.id]);
    if (!j) return null;
    return (
      <Dialog open={!!j} onOpenChange={(o) => !o && setHistoryDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><History className="w-5 h-5 text-primary" /> Histórico de placar</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            <p className="text-xs text-muted-foreground">{j.participanteA} vs {j.participanteB}</p>
            {loadingH ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> :
              rows.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhuma alteração registrada.</p> :
              rows.map(r => (
                <div key={r.id} className="rounded border p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs">{r.placar_a_old ?? '–'}x{r.placar_b_old ?? '–'} → <strong className="text-primary">{r.placar_a_new ?? '–'}x{r.placar_b_new ?? '–'}</strong></span>
                    <span className="text-[10px] text-muted-foreground">{new Date(r.changed_at).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">por {r.changed_by_name || 'usuário'}</div>
                </div>
              ))
            }
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const handleDeleteMatch = async (j: Jogo) => {
    if (!confirm(`Excluir confronto ${j.participanteA} x ${j.participanteB}?`)) return;
    try {
      if (isUuid(j.id)) await deleteMatch(j.id);
      // Remove do estado local
      const idx = state.jogos.findIndex(x => x.id === j.id);
      if (idx >= 0) (state.jogos as any).splice(idx, 1);
      updateJogo(j.id, { participanteA: '', participanteB: '' } as any); // força re-render
      toast({ title: 'Confronto removido' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
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
          const generos = generosNaMod(m.nome);
          const rounds = jogosPorMod(m.nome).reduce<Record<number, typeof jogos>>((acc, j) => {
            (acc[j.rodada] ||= []).push(j); return acc;
          }, {});
          const rkeys = Object.keys(rounds).map(Number).sort((a, b) => a - b);
          const regra = getSportRule(m.nome);
          const labelGenero = (g: string) => g === 'masculino' ? 'Masculino' : g === 'feminino' ? 'Feminino' : 'Misto';
          return (
            <TabsContent key={m.nome} value={m.nome} className="mt-4 space-y-6">
              {/* Classificação separada por gênero */}
              {generos.length === 0 ? (
                <Card><CardContent className="p-5 text-sm text-muted-foreground">Nenhuma equipe nesta modalidade.</CardContent></Card>
              ) : generos.map(g => {
                const ranking = rankingPorModEGenero(m.nome, g);
                return (
                  <Card key={g}>
                    <CardContent className="p-5">
                      <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-primary" /> Classificação — {m.nome} ({labelGenero(g)})
                      </h3>
                      <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="p-2 text-left">Pos</th>
                              <th className="p-2 text-left">Equipe</th>
                              {regra.colunas.map(c => (
                                <th key={c.key} className="p-2 text-center">{c.label}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {ranking.length === 0 ? (
                              <tr><td colSpan={2 + regra.colunas.length} className="p-4 text-center text-muted-foreground">Sem placares lançados.</td></tr>
                            ) : ranking.map((row, i) => (
                              <tr key={row.participante} className={`border-t ${i < 3 ? 'font-semibold' : ''}`}>
                                <td className="p-2">{i + 1}º</td>
                                <td className="p-2">{row.participante}</td>
                                {regra.colunas.map(c => {
                                  const v = (row as any)[c.key] ?? 0;
                                  return <td key={c.key} className={`p-2 text-center ${c.key === 'P' ? 'font-bold text-primary' : ''}`}>{c.format ? c.format(v) : v}</td>;
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Chaveamento gráfico com placar editável + finalizar rodada */}
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b px-5 py-3 flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-heading font-semibold flex items-center gap-2">
                    <Radio className="w-4 h-4 text-destructive animate-pulse" />
                    Chaveamento ao vivo — {m.nome}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{regra.descricaoPontuacao}</span>
                    {!state.finalizado && competitionId && (
                      <Button size="sm" variant="outline" className="gap-1 h-7" onClick={() => setManualDialog({ mod: m.nome })}>
                        <PlusCircle className="w-3.5 h-3.5" /> Confronto manual
                      </Button>
                    )}
                  </div>
                </div>
                <CardContent className="p-5">
                  {rkeys.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum jogo gerado para esta modalidade.</p>
                  ) : (
                    <div className="space-y-6">
                      {rkeys.map(r => {
                        const visibleMatches = rounds[r].filter(j => !(isPending(j.participanteA) && isPending(j.participanteB)));
                        if (visibleMatches.length === 0) return null;
                        const elegiveis = visibleMatches.filter(j => !isPending(j.participanteA) && !isPending(j.participanteB));
                        const total = elegiveis.length;
                        const finalizadas = elegiveis.filter(j => j.finalizada).length;
                        const aFinalizar = elegiveis.filter(j => !j.finalizada).length;
                        return (
                          <div key={r} className="relative">
                            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-md">
                                  {r}
                                </div>
                                <div>
                                  <div className="font-heading font-bold text-sm tracking-wide">RODADA {r}</div>
                                  <div className="text-[11px] text-muted-foreground">{finalizadas}/{total} finalizadas</div>
                                </div>
                              </div>
                              {!state.finalizado && aFinalizar > 0 && total > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2"
                                  onClick={() => setFinalizeRound({ mod: m.nome, rodada: r })}
                                >
                                  <Flag className="w-4 h-4" /> Encerrar rodada em lote
                                </Button>
                              )}
                              {!state.finalizado && aFinalizar === 0 && total > 0 && (
                                <Badge variant="default" className="bg-success text-success-foreground gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Rodada concluída
                                </Badge>
                              )}
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              {visibleMatches.map(j => {
                                const cur = resultados[j.id] || { placarA: 0, placarB: 0 };
                                const placarRegistrado = !!resultados[j.id];
                                const pendingA = isPending(j.participanteA);
                                const pendingB = isPending(j.participanteB);
                                const aguardando = pendingA || pendingB;
                                const finalizada = !!j.finalizada;
                                const winA = finalizada && cur.placarA > cur.placarB;
                                const winB = finalizada && cur.placarB > cur.placarA;
                                const podeFinalizar = !state.finalizado && !aguardando && !finalizada && placarRegistrado && cur.placarA !== cur.placarB;
                                let statusLabel = 'Aguardando';
                                let statusColor = 'bg-muted text-muted-foreground';
                                if (finalizada) { statusLabel = 'Finalizada'; statusColor = 'bg-success text-success-foreground'; }
                                else if (placarRegistrado) { statusLabel = 'Aguardando confirmação'; statusColor = 'bg-amber-500/15 text-amber-700 dark:text-amber-400'; }
                                else if (j.data || j.horario) { statusLabel = 'Agendada'; statusColor = 'bg-primary/10 text-primary'; }
                                return (
                                  <div
                                    key={j.id}
                                    className={`rounded-xl border-2 bg-card p-4 space-y-2 transition-all hover:shadow-md ${
                                      finalizada ? 'border-success/50' : placarRegistrado ? 'border-amber-500/40' : aguardando ? 'border-dashed border-muted-foreground/30' : 'border-border'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${statusColor} border-0`}>
                                        {finalizada && <Lock className="w-3 h-3 mr-1 inline" />}
                                        {statusLabel}
                                        {(j as any).manual && <span className="ml-1 text-[9px]">· manual</span>}
                                      </Badge>
                                      <div className="flex items-center gap-1">
                                        {finalizada && (
                                          <Button size="icon" variant="ghost" className="h-6 w-6" title="Histórico de placar" onClick={() => setHistoryDialog(j)}>
                                            <History className="w-3.5 h-3.5" />
                                          </Button>
                                        )}
                                        {!state.finalizado && !finalizada && (
                                          <Button size="icon" variant="ghost" className="h-6 w-6" title="Editar confronto" onClick={() => setManualDialog({ mod: m.nome, jogo: j })}>
                                            <Pencil className="w-3.5 h-3.5" />
                                          </Button>
                                        )}
                                        {!state.finalizado && !finalizada && (
                                          <Button size="icon" variant="ghost" className="h-6 w-6" title="Excluir confronto" onClick={() => handleDeleteMatch(j)}>
                                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                          </Button>
                                        )}
                                        {finalizada && !state.finalizado && (
                                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => reabrirPartida(j)}>
                                            Reabrir
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                    <ScoreRow
                                      name={displayName(j.participanteA)}
                                      value={cur.placarA}
                                      winner={winA}
                                      loading={savingScore === j.id}
                                      onChange={(v) => liveUpdate(j.id, v, cur.placarB)}
                                      rule={regra}
                                      disabled={state.finalizado || aguardando || finalizada}
                                    />
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 border-t border-dashed" />
                                      <span className="text-[10px] font-bold text-muted-foreground tracking-widest">VS</span>
                                      <div className="flex-1 border-t border-dashed" />
                                    </div>
                                    <ScoreRow
                                      name={displayName(j.participanteB)}
                                      value={cur.placarB}
                                      winner={winB}
                                      loading={savingScore === j.id}
                                      onChange={(v) => liveUpdate(j.id, cur.placarA, v)}
                                      rule={regra}
                                      disabled={state.finalizado || aguardando || finalizada}
                                    />
                                    {podeFinalizar && (
                                      <Button
                                        size="sm"
                                        className="w-full gradient-primary text-primary-foreground gap-2"
                                        onClick={() => confirmarPartida(j)}
                                      >
                                        <CheckCircle2 className="w-4 h-4" /> Finalizar partida
                                      </Button>
                                    )}
                                    <div className="flex items-center justify-between pt-2 text-[11px] text-muted-foreground border-t">
                                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                                        {(j.data || j.horario) && (
                                          <span className="inline-flex items-center gap-1"><CalendarClock className="w-3 h-3" />{j.data ? new Date(j.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'} {j.horario || ''}</span>
                                        )}
                                        {j.local && <span className="inline-flex items-center gap-1 truncate"><MapPin className="w-3 h-3" />{j.local}</span>}
                                        {!j.data && !j.horario && !j.local && <span className="italic">Não agendado</span>}
                                      </div>
                                      {!state.finalizado && !finalizada && (
                                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1" onClick={() => setRescheduleJogo(j)}>
                                          <CalendarClock className="w-3 h-3" /> Agendar
                                        </Button>
                                      )}
                                    </div>
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
      <RescheduleDialog />
      <ManualMatchDialog />
      <HistoryDialog />

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
