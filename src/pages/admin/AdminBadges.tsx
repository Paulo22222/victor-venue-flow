import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { IdCard, Printer, Loader2, Search } from 'lucide-react';
import { generateBadgesPDF, BadgeAthlete } from '@/utils/badgeGenerator';

interface Athlete {
  id: string; nome: string; foto_url: string | null; instituicao: string | null;
  campus: string | null; curso: string | null; modalidades: string[] | null; numero_atleta: string | null;
  team_id: string | null;
  tipo_sanguineo: string | null; contato_emergencia: string | null;
  alergias: string | null; enfermidades: string | null; observacoes: string | null;
  team?: { nome: string; modalidade: string | null } | null;
}

const AdminBadges = () => {
  const { user } = useAuth();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filterInst, setFilterInst] = useState<string>('all');
  const [filterCampus, setFilterCampus] = useState<string>('all');
  const [filterMod, setFilterMod] = useState<string>('all');

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('organizer_team_members')
      .select('*, team:organizer_teams(nome, modalidade)')
      .order('nome');
    setAthletes((data ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const institutions = useMemo(() => Array.from(new Set(athletes.map(a => a.instituicao).filter(Boolean))) as string[], [athletes]);
  const campuses = useMemo(() => Array.from(new Set(athletes.map(a => a.campus).filter(Boolean))) as string[], [athletes]);
  const modalities = useMemo(() => {
    const s = new Set<string>();
    athletes.forEach(a => { (a.modalidades || []).forEach(m => s.add(m)); if (a.team?.modalidade) s.add(a.team.modalidade); });
    return Array.from(s);
  }, [athletes]);

  const filtered = useMemo(() => athletes.filter(a => {
    if (search && !a.nome.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterInst !== 'all' && a.instituicao !== filterInst) return false;
    if (filterCampus !== 'all' && a.campus !== filterCampus) return false;
    if (filterMod !== 'all') {
      const has = (a.modalidades || []).includes(filterMod) || a.team?.modalidade === filterMod;
      if (!has) return false;
    }
    return true;
  }), [athletes, search, filterInst, filterCampus, filterMod]);

  const toggle = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(a => a.id)));
  };

  const print = async (list: Athlete[], segundaVia = false) => {
    if (!list.length) return toast({ title: 'Selecione pelo menos 1 atleta', variant: 'destructive' });
    setPrinting(true);
    try {
      const data: BadgeAthlete[] = list.map(a => ({
        id: a.id, nome: a.nome, foto_url: a.foto_url,
        instituicao: a.instituicao, campus: a.campus, curso: a.curso,
        modalidade: a.team?.modalidade || (a.modalidades?.[0] ?? null),
        modalidades: a.modalidades, numero_atleta: a.numero_atleta,
        eventName: 'IF Competition',
      }));
      await generateBadgesPDF(data, list.length === 1 ? `cracha-${list[0].nome}.pdf` : `crachas-${list.length}.pdf`);
      if (user) {
        await supabase.from('badge_prints').insert(list.map(a => ({ athlete_id: a.id, printed_by: user.id, segunda_via: segundaVia })));
      }
      toast({ title: `${list.length} crachá(s) gerado(s)` });
    } catch (e: any) {
      toast({ title: 'Erro ao gerar PDF', description: e.message, variant: 'destructive' });
    } finally { setPrinting(false); }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><IdCard className="w-6 h-6 text-primary" /> Crachás</h1>
          <p className="text-muted-foreground text-sm">Geração individual e em massa em PDF</p>
        </div>
        <Button onClick={() => print(filtered.filter(a => selected.has(a.id)))} disabled={printing || !selected.size} className="gradient-primary text-primary-foreground gap-2">
          {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
          Imprimir selecionados ({selected.size})
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nome" className="pl-8" />
          </div>
          <Select value={filterInst} onValueChange={setFilterInst}>
            <SelectTrigger><SelectValue placeholder="Instituição" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todas instituições</SelectItem>{institutions.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filterCampus} onValueChange={setFilterCampus}>
            <SelectTrigger><SelectValue placeholder="Campus" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todos campus</SelectItem>{campuses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filterMod} onValueChange={setFilterMod}>
            <SelectTrigger><SelectValue placeholder="Modalidade" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todas modalidades</SelectItem>{modalities.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{filtered.length} atleta(s)</CardTitle>
          <Button variant="outline" size="sm" onClick={toggleAll}>{selected.size === filtered.length ? 'Limpar' : 'Selecionar todos'}</Button>
        </CardHeader>
        <CardContent>
          {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr><th className="p-2 w-8"></th><th className="p-2 w-12">Foto</th><th className="p-2 text-left">Nome</th><th className="p-2 text-left">Instituição</th><th className="p-2 text-left">Campus</th><th className="p-2 text-left">Modalidade</th><th className="p-2 text-right">Ação</th></tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a.id} className="border-t hover:bg-muted/50">
                      <td className="p-2 text-center"><Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggle(a.id)} /></td>
                      <td className="p-2">{a.foto_url ? <img src={a.foto_url} alt="" className="w-8 h-8 rounded object-cover" /> : <div className="w-8 h-8 rounded bg-muted" />}</td>
                      <td className="p-2 font-medium">{a.nome}</td>
                      <td className="p-2">{a.instituicao || '—'}</td>
                      <td className="p-2">{a.campus || '—'}</td>
                      <td className="p-2"><Badge variant="outline" className="text-[10px]">{a.team?.modalidade || a.modalidades?.[0] || '—'}</Badge></td>
                      <td className="p-2 text-right"><Button variant="outline" size="sm" onClick={() => print([a])} disabled={printing}><Printer className="w-3.5 h-3.5" /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBadges;
