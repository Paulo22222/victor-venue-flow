import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, Trophy, Radio, Calendar, MapPin } from 'lucide-react';
import { getSportRule, pontosRanking } from '@/utils/sportRules';
import logo from '@/assets/logo.png';

interface Competition {
  id: string; nome: string; data: string | null; modalidade: string | null;
  local: string | null; finalizado: boolean | null;
}
interface Match {
  id: string; rodada: number; participante_a: string; participante_b: string;
  placar_a: number | null; placar_b: number | null; horario: string | null;
  local: string | null; modalidade: string | null; esporte: string | null;
}
interface Modality { id: string; nome: string; }

const PublicEvent = () => {
  const { id } = useParams<{ id: string }>();
  const [comp, setComp] = useState<Competition | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMod, setActiveMod] = useState<string>('all');

  const fetchAll = async () => {
    if (!id) return;
    const [{ data: c }, { data: m }, { data: mods }] = await Promise.all([
      supabase.from('competitions').select('*').eq('id', id).maybeSingle(),
      supabase.from('competition_matches').select('*').eq('competition_id', id).order('rodada'),
      supabase.from('competition_modalities').select('id,nome').eq('competition_id', id),
    ]);
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
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  const filtered = useMemo(() => {
    if (activeMod === 'all') return matches;
    return matches.filter(m => (m.modalidade || '').toUpperCase() === activeMod.toUpperCase());
  }, [matches, activeMod]);

  const ranking = useMemo(() => {
    const pts: Record<string, { p: number; v: number; e: number; d: number; gp: number; gc: number }> = {};
    const ensure = (n: string) => { if (!pts[n]) pts[n] = { p: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0 }; };
    // Filtra estritamente por modalidade para não misturar esportes na classificação
    filtered.forEach(m => {
      if (activeMod !== 'all' && (m.modalidade || '').toUpperCase() !== activeMod.toUpperCase()) return;
      ensure(m.participante_a); ensure(m.participante_b);
      if (m.placar_a != null && m.placar_b != null) {
        pts[m.participante_a].gp += m.placar_a; pts[m.participante_a].gc += m.placar_b;
        pts[m.participante_b].gp += m.placar_b; pts[m.participante_b].gc += m.placar_a;
        const matchRule = getSportRule(m.modalidade || activeMod);
        const { a, b } = pontosRanking(m.placar_a, m.placar_b, matchRule);
        pts[m.participante_a].p += a; pts[m.participante_b].p += b;
        if (m.placar_a > m.placar_b) { pts[m.participante_a].v++; pts[m.participante_b].d++; }
        else if (m.placar_b > m.placar_a) { pts[m.participante_b].v++; pts[m.participante_a].d++; }
        else { pts[m.participante_a].e++; pts[m.participante_b].e++; }
      }
    });
    return Object.entries(pts).sort((a, b) => b[1].p - a[1].p || (b[1].gp - b[1].gc) - (a[1].gp - a[1].gc));
  }, [filtered, activeMod]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!comp) return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><p>Evento não encontrado.</p><Link to="/"><Button>Voltar</Button></Link></div>;

  const live = !comp.finalizado;

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
              <TabsTrigger key={m.id} value={m.nome} className="gap-1.5">
                <span>{getSportRule(m.nome).emoji}</span> {m.nome}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={activeMod} className="mt-6 space-y-6">
            <RankingTable ranking={ranking} />
            <Bracket matches={filtered} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

const RankingTable = ({ ranking }: { ranking: [string, any][] }) => (
  <Card>
    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" /> Classificação</CardTitle></CardHeader>
    <CardContent>
      {ranking.length === 0 ? <p className="text-sm text-muted-foreground">Sem placares lançados ainda.</p> : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-2 text-left">#</th><th className="p-2 text-left">Equipe</th>
                <th className="p-2 text-center">P</th><th className="p-2 text-center">V</th>
                <th className="p-2 text-center">E</th><th className="p-2 text-center">D</th>
                <th className="p-2 text-center">SG</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map(([nome, s], i) => (
                <tr key={nome} className={`border-t ${i < 3 ? 'font-semibold' : ''}`}>
                  <td className="p-2">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`}</td>
                  <td className="p-2">{nome}</td>
                  <td className="p-2 text-center font-bold text-primary">{s.p}</td>
                  <td className="p-2 text-center">{s.v}</td>
                  <td className="p-2 text-center">{s.e}</td>
                  <td className="p-2 text-center">{s.d}</td>
                  <td className="p-2 text-center">{s.gp - s.gc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardContent>
  </Card>
);

const Bracket = ({ matches }: { matches: Match[] }) => {
  const rounds = matches.reduce<Record<number, Match[]>>((acc, m) => { (acc[m.rodada] ||= []).push(m); return acc; }, {});
  const rkeys = Object.keys(rounds).map(Number).sort((a, b) => a - b);
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Chaveamento e resultados</CardTitle></CardHeader>
      <CardContent>
        {matches.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum jogo gerado ainda.</p> : (
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-6 min-w-max">
              {rkeys.map(r => (
                <div key={r} className="flex flex-col gap-3 min-w-[240px]">
                  <div className="text-xs font-bold text-primary tracking-wider">RODADA {r}</div>
                  <div className="flex flex-col gap-3 justify-around flex-1">
                    {rounds[r].map(m => {
                      const decided = m.placar_a != null && m.placar_b != null;
                      const winA = decided && (m.placar_a! > m.placar_b!);
                      const winB = decided && (m.placar_b! > m.placar_a!);
                      return (
                        <div key={m.id} className="rounded-lg border bg-card overflow-hidden shadow-sm">
                          <Row name={m.participante_a} score={m.placar_a} winner={winA} />
                          <div className="border-t border-border" />
                          <Row name={m.participante_b} score={m.placar_b} winner={winB} />
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
