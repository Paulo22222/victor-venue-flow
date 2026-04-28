import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Team {
  id: string; nome: string; modalidade: string; genero: string | null; owner_id: string;
}
interface Member { id: string; team_id: string; nome: string; codigo: string | null; }
interface Profile { user_id: string; display_name: string | null; }

const AdminTeamsView = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: t }, { data: m }, { data: p }] = await Promise.all([
      supabase.from('organizer_teams').select('*'),
      supabase.from('organizer_team_members').select('id, team_id, nome, codigo'),
      supabase.from('profiles').select('user_id, display_name'),
    ]);
    setTeams((t ?? []) as Team[]);
    setMembers((m ?? []) as Member[]);
    setProfiles((p ?? []) as Profile[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Excluir a equipe "${nome}" e todos os seus atletas?`)) return;
    const { error } = await supabase.from('organizer_teams').delete().eq('id', id);
    if (error) return toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    toast({ title: 'Equipe excluída.' });
    fetchAll();
  };

  const ownerName = (id: string) => profiles.find(p => p.user_id === id)?.display_name || 'Organizador';
  const teamMembers = (id: string) => members.filter(m => m.team_id === id);

  const byMod = teams.reduce<Record<string, Team[]>>((acc, t) => { (acc[t.modalidade] ||= []).push(t); return acc; }, {});

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-primary" /> Equipes dos organizadores</h1>
        <p className="text-muted-foreground text-sm">Acervo de equipes cadastradas pelos organizadores. Como administrador, você pode excluí-las.</p>
      </div>
      {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> :
        teams.length === 0 ? <p className="text-sm text-muted-foreground text-center py-12">Nenhuma equipe cadastrada ainda.</p> :
          Object.entries(byMod).map(([mod, ts]) => (
            <Card key={mod}>
              <CardHeader><CardTitle className="text-base">{mod} <Badge variant="secondary" className="ml-2">{ts.length}</Badge></CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {ts.map(t => {
                  const tm = teamMembers(t.id);
                  return (
                    <div key={t.id} className="p-3 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <div className="font-semibold truncate">{t.nome}</div>
                        <div className="flex items-center gap-1">
                          {t.genero && <Badge variant="outline" className="text-[10px]">{t.genero}</Badge>}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(t.id, t.nome)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">por {ownerName(t.owner_id)}</div>
                      <div className="text-xs"><strong>{tm.length}</strong> atleta(s)</div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))
      }
    </div>
  );
};

export default AdminTeamsView;
