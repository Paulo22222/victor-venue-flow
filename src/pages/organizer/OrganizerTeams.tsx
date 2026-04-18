import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Users, Loader2, ChevronRight, UserPlus } from 'lucide-react';

const MODALIDADES = ['FUTSAL', 'VÔLEI', 'HANDEBOL'];

interface Team {
  id: string;
  nome: string;
  genero: string | null;
  modalidade: string;
  created_at: string;
}
interface Member {
  id: string;
  team_id: string;
  nome: string;
  data_nascimento: string | null;
  documento: string | null;
  genero: string | null;
  codigo: string | null;
}

const OrganizerTeams = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTeam, setNewTeam] = useState({ nome: '', genero: 'masculino', modalidade: 'FUTSAL' });
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberDialog, setMemberDialog] = useState(false);
  const [newMember, setNewMember] = useState({ nome: '', codigo: '', data_nascimento: '', genero: 'masculino' });

  const fetch = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('organizer_teams')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    setTeams((data ?? []) as Team[]);
    setLoading(false);
  };

  const fetchMembers = async (teamId: string) => {
    const { data } = await supabase
      .from('organizer_team_members')
      .select('*')
      .eq('team_id', teamId);
    setMembers((data ?? []) as Member[]);
  };

  useEffect(() => { fetch(); }, [user]);
  useEffect(() => { if (selectedTeam) fetchMembers(selectedTeam.id); }, [selectedTeam]);

  const handleCreateTeam = async () => {
    if (!user || !newTeam.nome.trim()) return;
    setCreating(true);
    const { error } = await supabase.from('organizer_teams').insert({
      owner_id: user.id,
      nome: newTeam.nome.trim(),
      genero: newTeam.genero,
      modalidade: newTeam.modalidade,
    });
    setCreating(false);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    setNewTeam({ nome: '', genero: 'masculino', modalidade: 'FUTSAL' });
    toast({ title: 'Equipe criada!' });
    fetch();
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Excluir esta equipe e todos os seus atletas?')) return;
    const { error } = await supabase.from('organizer_teams').delete().eq('id', id);
    if (error) return toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    if (selectedTeam?.id === id) setSelectedTeam(null);
    fetch();
  };

  const handleAddMember = async () => {
    if (!selectedTeam || !newMember.nome.trim() || !newMember.codigo.trim()) {
      return toast({ title: 'Preencha nome e matrícula', variant: 'destructive' });
    }
    const { error } = await supabase.from('organizer_team_members').insert({
      team_id: selectedTeam.id,
      nome: newMember.nome.trim(),
      codigo: newMember.codigo.trim(),
      data_nascimento: newMember.data_nascimento || null,
      genero: newMember.genero,
    });
    if (error) return toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    setNewMember({ nome: '', codigo: '', data_nascimento: '', genero: 'masculino' });
    setMemberDialog(false);
    fetchMembers(selectedTeam.id);
    toast({ title: 'Atleta adicionado!' });
  };

  const handleDeleteMember = async (id: string) => {
    if (!selectedTeam) return;
    if (!confirm('Remover este atleta?')) return;
    await supabase.from('organizer_team_members').delete().eq('id', id);
    fetchMembers(selectedTeam.id);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="font-heading text-2xl font-bold">Minhas Equipes</h1>
        <p className="text-muted-foreground text-sm">Cadastre suas equipes — o administrador poderá usá-las nos eventos.</p>
      </div>

      {/* Criar nova equipe */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Plus className="w-4 h-4" /> Nova equipe</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-2">
            <Label className="text-xs">Nome da equipe</Label>
            <Input value={newTeam.nome} onChange={e => setNewTeam(s => ({ ...s, nome: e.target.value }))} placeholder="Ex: Tigres" className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Modalidade</Label>
            <Select value={newTeam.modalidade} onValueChange={v => setNewTeam(s => ({ ...s, modalidade: v }))}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{MODALIDADES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Select value={newTeam.genero} onValueChange={v => setNewTeam(s => ({ ...s, genero: v }))}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
                <SelectItem value="misto">Misto</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreateTeam} disabled={creating || !newTeam.nome.trim()} className="gradient-primary text-primary-foreground">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista + detalhe */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" /> Equipes ({teams.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> :
              teams.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhuma equipe cadastrada.</p> :
                teams.map(t => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTeam(t)}
                    className={`group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${selectedTeam?.id === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{t.nome}</div>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-[10px]">{t.modalidade}</Badge>
                        {t.genero && <Badge variant="secondary" className="text-[10px]">{t.genero}</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleDeleteTeam(t.id); }}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{selectedTeam ? `Atletas — ${selectedTeam.nome}` : 'Selecione uma equipe'}</CardTitle>
            {selectedTeam && (
              <Button size="sm" onClick={() => setMemberDialog(true)} className="gap-1">
                <UserPlus className="w-3.5 h-3.5" /> Adicionar
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!selectedTeam ? (
              <p className="text-sm text-muted-foreground text-center py-6">Clique em uma equipe à esquerda.</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum atleta cadastrado. Adicione pelo menos 1 para a equipe ser válida.</p>
            ) : (
              <div className="space-y-1">
                {members.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded border border-border hover:bg-muted/50">
                    <div className="min-w-0">
                      <div className="font-medium truncate text-sm">{m.nome}</div>
                      <div className="text-xs text-muted-foreground">Matrícula: {m.codigo} {m.genero && `· ${m.genero}`}</div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteMember(m.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de novo atleta */}
      <Dialog open={memberDialog} onOpenChange={setMemberDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar atleta</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nome *</Label>
              <Input value={newMember.nome} onChange={e => setNewMember(s => ({ ...s, nome: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Matrícula *</Label>
              <Input value={newMember.codigo} onChange={e => setNewMember(s => ({ ...s, codigo: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Data nascimento</Label>
                <Input type="date" value={newMember.data_nascimento} onChange={e => setNewMember(s => ({ ...s, data_nascimento: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Gênero</Label>
                <Select value={newMember.genero} onValueChange={v => setNewMember(s => ({ ...s, genero: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddMember} className="gradient-primary text-primary-foreground">Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizerTeams;
