import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, Trophy, Radio, Calendar, MapPin } from 'lucide-react';
import { getSportRule, aplicarPartida, linhaVazia, sortRanking, type RankingRow, type SportRule } from '@/utils/sportRules';
import logo from '@/assets/logo.png';

interface Competition {
  id: string; nome: string; data: string | null; modalidade: string | null;
  local: string | null; finalizado: boolean | null;
}
interface Match {
  id: string; rodada: number; participante_a: string; participante_b: string;
  placar_a: number | null; placar_b: number | null; data: string | null; horario: string | null;
  local: string | null; modalidade: string | null; esporte: string | null;
  finalizada: boolean | null;
  detalhes_placar?: { sets?: number[][] } | null;
}
interface Modality { id: string; nome: string; }
// nome+modalidade -> genero
type GenderMap = Record<string, string>;

const keyEq = (nome: string, mod: string) => `${nome}__${mod.toUpperCase()}`;

const PublicEvent = () => {
  const { id } = useParams<{ id: string }>();
  const [comp, setComp] = useState<Competition | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [genderMap, setGenderMap] = useState<GenderMap>({});
  const [loading, setLoading] = useState(true);
  const [activeMod, setActiveMod] = useState<string>('all');

  const fetchAll = async () => {
    if (!id) return;
    const [{ data: c }, { data: m }, { data: mods }, { data: selected }] = await Promise.all([
      supabase.from('competitions').select('id, nome, data, modalidade, local, finalizado').eq('id', id).maybeSingle(),
      supabase.from('competition_matches').select('*').eq('competition_id', id).order('rodada'),
      supabase.from('competition_modalities').select('id,nome').eq('competition_id', id),
      supabase.from('competition_selected_teams').select('organizer_team_id, modalidade').eq('competition_id', id),
    ]);
    // Buscar gênero das equipes selecionadas via organizer_teams
    const gmap: GenderMap = {};
    if (selected && selected.length) {
      const ids = Array.from(new Set(selected.map((s: any) => s.organizer_team_id)));
      const { data: teams } = await supabase.from('organizer_teams').select('id, nome, genero').in('id', ids);
      const byId: Record<string, { nome: string; genero: string | null }> = {};
      (teams ?? []).forEach((t: any) => { byId[t.id] = { nome: t.nome, genero: t.genero }; });
      selected.forEach((s: any) => {
        const t = byId[s.organizer_team_id];
        if (t) gmap[keyEq(t.nome, s.modalidade)] = t.genero || 'misto';
      });
    }
    setGenderMap(gmap);
    setComp(c as Competition | null);
    setMatches((m ?? []) as Match[]);
    setModalities((mods ?? []) as Modality[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    if (!id) return;
    const ch = supabase
      .channel(`public-event-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competition_matches', filter: `competition_id=eq.${id}` }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competitions', filter: `id=eq.${id}` }, () => fetchAll())
      .subscribe();
    const interval = window.setInterval(fetchAll, 15000);
    return () => { window.clearInterval(interval); supabase.removeChannel(ch); };
  }, [id]);

  const filtered = useMemo(() => {
    if (activeMod === 'all') return matches;
    return matches.filter(m => (m.modalidade || '').toUpperCase() === activeMod.toUpperCase());
  }, [matches, activeMod]);

  const generoDe = (nome: string, mod: string) => genderMap[keyEq(nome, mod)] || 'misto';

  // Agrupa partidas finalizadas por modalidade+gênero e calcula classificação respeitando a regra de cada esporte
  const rankings = useMemo(() => {
    const groups: Record<string, { modalidade: string; genero: string; regra: SportRule; rows: Record<string, RankingRow> }> = {};
    filtered.forEach(m => {
      if (m.placar_a == null || m.placar_b == null) return;
      if (isPending(m.participante_a) || isPending(m.participante_b)) return;
      const mod = m.modalidade || '';
      const gA = generoDe(m.participante_a, mod);
      const gB = generoDe(m.participante_b, mod);
      if (gA !== gB) return;
      const key = `${mod}__${gA}`;
      if (!groups[key]) groups[key] = { modalidade: mod, genero: gA, regra: getSportRule(mod), rows: {} };
      const g = groups[key];
      if (!g.rows[m.participante_a]) g.rows[m.participante_a] = linhaVazia(m.participante_a);
      if (!g.rows[m.participante_b]) g.rows[m.participante_b] = linhaVazia(m.participante_b);
      aplicarPartida(g.rows[m.participante_a], g.regra, m.placar_a, m.placar_b, true, m.detalhes_placar);
      aplicarPartida(g.rows[m.participante_b], g.regra, m.placar_a, m.placar_b, false, m.detalhes_placar);
    });
    return Object.values(groups).map(g => ({
      ...g,
      ranking: sortRanking(g.regra, Object.values(g.rows)),
    }));
  }, [filtered, genderMap]);



  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!comp) return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><p>Evento não encontrado.</p><Link to="/"><Button>Voltar</Button></Link></div>;

  const live = !comp.finalizado;
  const labelGenero = (g: string) => g === 'masculino' ? 'Masculino' : g === 'feminino' ? 'Feminino' : 'Misto';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80">
            <img src={logo} alt="" className="w-7 h-7" /> <span className="font-heading font-bold">IF Competition 2026</span>
          </Link>
          <Link to="/"><Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="w-4 h-4" /> Voltar</Button></Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6 max-w-5xl">
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2">{comp.nome}</h1>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {comp.data && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {comp.data}</span>}
                  {comp.local && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {comp.local}</span>}
                </div>
              </div>
              {live ? (
                <Badge className="bg-destructive text-destructive-foreground gap-1"><Radio className="w-3 h-3 animate-pulse" /> Ao vivo</Badge>
              ) : (
                <Badge variant="outline">Finalizado</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeMod} onValueChange={setActiveMod}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="all">Todas</TabsTrigger>
            {modalities.map(m => (
              <TabsTrigger key={m.id} value={m.nome}>{m.nome}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={activeMod} className="mt-6 space-y-6">
            {rankings.length === 0 ? (
              <RankingTable titulo="Classificação" regra={getSportRule()} ranking={[]} />
            ) : (
              rankings.map(g => (
                <RankingTable
                  key={`${g.modalidade}__${g.genero}`}
                  titulo={`Classificação — ${g.modalidade || 'Geral'} (${labelGenero(g.genero)})`}
                  regra={g.regra}
                  ranking={g.ranking}
                />
              ))
            )}
            <Bracket matches={filtered} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

const RankingTable = ({ titulo, regra, ranking }: { titulo: string; regra: SportRule; ranking: RankingRow[] }) => (
  <Card>
    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" /> {titulo}</CardTitle></CardHeader>
    <CardContent>
      {ranking.length === 0 ? <p className="text-sm text-muted-foreground">Sem placares lançados ainda.</p> : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-2 text-left">Pos</th>
                <th className="p-2 text-left">Participante</th>
                {regra.colunas.map(c => (
                  <th key={c.key} className="p-2 text-center">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, i) => (
                <tr key={r.participante} className={`border-t ${i < 3 ? 'font-semibold' : ''}`}>
                  <td className="p-2">{i + 1}º</td>
                  <td className="p-2">{r.participante}</td>
                  {regra.colunas.map(c => {
                    const v = (r as any)[c.key] ?? 0;
                    return <td key={c.key} className={`p-2 text-center ${c.key === 'P' ? 'font-bold text-primary' : ''}`}>{c.format ? c.format(v) : v}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardContent>
  </Card>
);

const isPending = (name?: string) => !name || name.startsWith('Vencedor(');
const displayName = (name?: string) => (isPending(name) ? 'Aguardando adversário' : name!);

const Bracket = ({ matches }: { matches: Match[] }) => {
  const rounds = matches.reduce<Record<number, Match[]>>((acc, m) => { (acc[m.rodada] ||= []).push(m); return acc; }, {});
  const rkeys = Object.keys(rounds).map(Number).sort((a, b) => a - b);
  const visibleByRound: Record<number, Match[]> = {};
  rkeys.forEach(r => {
    visibleByRound[r] = rounds[r].filter(m => !(isPending(m.participante_a) && isPending(m.participante_b)));
  });
  const visibleKeys = rkeys.filter(r => visibleByRound[r].length > 0);
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Chaveamento e resultados</CardTitle></CardHeader>
      <CardContent>
        {visibleKeys.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum jogo gerado ainda.</p> : (
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-6 min-w-max">
              {visibleKeys.map(r => (
                <div key={r} className="flex flex-col gap-3 min-w-[240px]">
                  <div className="text-xs font-bold text-primary tracking-wider">RODADA {r}</div>
                  <div className="flex flex-col gap-3 justify-around flex-1">
                    {visibleByRound[r].map(m => {
                      const finalizada = !!m.finalizada;
                      const hasScore = m.placar_a != null && m.placar_b != null;
                      const winA = finalizada && hasScore && (m.placar_a! > m.placar_b!);
                      const winB = finalizada && hasScore && (m.placar_b! > m.placar_a!);
                      return (
                        <div key={m.id} className="rounded-lg border bg-card overflow-hidden shadow-sm">
                          <Row name={displayName(m.participante_a)} score={m.placar_a} winner={winA} />
                          <div className="border-t border-border" />
                          <Row name={displayName(m.participante_b)} score={m.placar_b} winner={winB} />
                          {(m.data || m.horario || m.local || (hasScore && !finalizada)) && (
                            <div className="border-t border-border px-3 py-1.5 bg-muted/30 text-[11px] text-muted-foreground flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap min-w-0">
                                {(m.data || m.horario) && (
                                  <span className="inline-flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {m.data ? new Date(m.data + 'T00:00:00').toLocaleDateString('pt-BR') : ''} {m.horario || ''}
                                  </span>
                                )}
                                {m.local && (
                                  <span className="inline-flex items-center gap-1 truncate">
                                    <MapPin className="w-3 h-3" /> {m.local}
                                  </span>
                                )}
                              </div>
                              {hasScore && !finalizada && (
                                <span className="text-amber-600 dark:text-amber-400 font-medium">Aguardando confirmação</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Row = ({ name, score, winner }: { name: string; score: number | null; winner: boolean }) => (
  <div className={`flex items-center justify-between px-3 py-2 ${winner ? 'bg-primary/5 font-bold' : ''}`}>
    <span className={`truncate text-sm ${winner ? 'text-foreground' : 'text-muted-foreground'}`}>{name}</span>
    <span className={`text-lg tabular-nums font-bold ${winner ? 'text-primary' : 'text-muted-foreground'}`}>{score ?? '—'}</span>
  </div>
);

export default PublicEvent;
