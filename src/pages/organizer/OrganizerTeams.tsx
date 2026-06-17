import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Users, Loader2, ChevronRight, UserPlus, Upload, FileSpreadsheet, Download, Pencil } from 'lucide-react';
import { uploadAthletePhoto } from '@/utils/athletePhoto';
import { parseAthletesFile, downloadTemplate } from '@/utils/athleteImport';

interface Modality { id: string; nome: string; }
interface Team {
  id: string; nome: string; genero: string | null; modalidade: string; created_at: string;
  responsavel?: string | null; contato?: string | null; owner_id?: string;
}
interface Member {
  id: string; team_id: string | null; nome: string; data_nascimento: string | null;
  documento: string | null; genero: string | null; codigo: string | null;
  foto_url: string | null; telefone: string | null; rg: string | null;
  campus: string | null; instituicao: string | null; curso: string | null;
  modalidades: string[] | null; alergias: string | null; tipo_sanguineo: string | null;
  enfermidades: string | null; contato_emergencia: string | null; observacoes: string | null;
}

const emptyMember = {
  nome: '', foto_url: '', telefone: '', rg: '', data_nascimento: '',
  campus: '', instituicao: '', curso: '', genero: 'masculino',
  alergias: '', tipo_sanguineo: '', enfermidades: '', contato_emergencia: '', observacoes: '',
};

const OrganizerTeams = () => {
  const { user, role } = useAuth();
  const isAdmin = role === 'admin';
  const [teams, setTeams] = useState<Team[]>([]);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTeam, setNewTeam] = useState({ nome: '', genero: 'masculino', modalidade: 'FUTSAL' });
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberDialog, setMemberDialog] = useState(false);
  const [newMember, setNewMember] = useState<any>(emptyMember);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);
  const [editTeamDialog, setEditTeamDialog] = useState<Team | null>(null);
  const [editTeamForm, setEditTeamForm] = useState({ nome: '', genero: 'masculino', modalidade: '', responsavel: '', contato: '' });

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    let q = supabase.from('organizer_teams').select('*').order('created_at', { ascending: false });
    if (!isAdmin) q = q.eq('owner_id', user.id);
    const [t, m] = await Promise.all([
      q,
      supabase.from('sport_modalities').select('id, nome').eq('ativo', true).order('nome'),
    ]);
    setTeams((t.data ?? []) as Team[]);
    setModalities((m.data ?? []) as Modality[]);
    if (m.data && m.data.length && !m.data.find(x => x.nome === newTeam.modalidade)) {
      setNewTeam(s => ({ ...s, modalidade: m.data[0].nome }));
    }
    setLoading(false);
  };
  const fetchMembers = async (teamId: string) => {
    const { data } = await supabase.from('organizer_team_members').select('*').eq('team_id', teamId);
    setMembers((data ?? []) as Member[]);
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [user]);
  useEffect(() => { if (selectedTeam) fetchMembers(selectedTeam.id); }, [selectedTeam]);

  const handleCreateTeam = async () => {
    if (!user || !newTeam.nome.trim()) return;
    setCreating(true);
    const { error } = await supabase.from('organizer_teams').insert({
      owner_id: user.id, nome: newTeam.nome.trim(), genero: newTeam.genero, modalidade: newTeam.modalidade,
    });
    setCreating(false);
    if (error) return toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    setNewTeam(s => ({ ...s, nome: '' }));
    toast({ title: 'Equipe criada!' });
    fetchAll();
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Excluir esta equipe e todos os seus atletas?')) return;
    const { error } = await supabase.from('organizer_teams').delete().eq('id', id);
    if (error) return toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    if (selectedTeam?.id === id) setSelectedTeam(null);
    fetchAll();
  };

  const openMemberDialog = () => { setNewMember(emptyMember); setPhotoFile(null); setMemberDialog(true); };

  const handleAddMember = async () => {
    if (!selectedTeam) return;
    const required = ['nome', 'telefone', 'rg', 'data_nascimento', 'campus', 'instituicao', 'curso'];
    for (const f of required) {
      if (!String(newMember[f] || '').trim()) {
        return toast({ title: `Campo obrigatório: ${f}`, variant: 'destructive' });
      }
    }
    let foto_url = newMember.foto_url || null;
    if (photoFile) {
      try {
        setPhotoUploading(true);
        foto_url = await uploadAthletePhoto(photoFile, `${selectedTeam.id}-${Date.now()}`);
      } catch (e: any) {
        setPhotoUploading(false);
        return toast({ title: 'Erro na foto', description: e.message, variant: 'destructive' });
      } finally { setPhotoUploading(false); }
    }
    const payload = {
      team_id: selectedTeam.id,
      nome: newMember.nome.trim(),
      codigo: newMember.rg.trim(),
      rg: newMember.rg.trim(),
      telefone: newMember.telefone.trim(),
      data_nascimento: newMember.data_nascimento || null,
      genero: newMember.genero,
      campus: newMember.campus,
      instituicao: newMember.instituicao,
      curso: newMember.curso,
      foto_url,
      modalidades: [selectedTeam.modalidade],
      alergias: newMember.alergias || null,
      tipo_sanguineo: newMember.tipo_sanguineo || null,
      enfermidades: newMember.enfermidades || null,
      contato_emergencia: newMember.contato_emergencia || null,
      observacoes: newMember.observacoes || null,
    };
    const { error } = await supabase.from('organizer_team_members').insert(payload);
    if (error) return toast({ title: 'Erro', description: error.message, variant: 'destructive' });
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

  const handleImport = async (file: File) => {
    if (!selectedTeam) return toast({ title: 'Selecione uma equipe antes', variant: 'destructive' });
    setImporting(true);
    try {
      const { rows, errors } = await parseAthletesFile(file);
      if (errors.length) toast({ title: `${errors.length} linha(s) com erro`, description: errors.slice(0, 3).map(e => `Linha ${e.row}: ${e.message}`).join(' · '), variant: 'destructive' });
      // Buscar existentes por RG na equipe
      const { data: existing } = await supabase.from('organizer_team_members').select('id, rg').eq('team_id', selectedTeam.id);
      const byRg = new Map((existing ?? []).filter(e => e.rg).map(e => [e.rg, e.id]));
      let inserted = 0, updated = 0;
      for (const r of rows) {
        const payload: any = {
          team_id: selectedTeam.id,
          nome: r.nome, codigo: r.rg || r.nome, rg: r.rg || null,
          telefone: r.telefone || null, data_nascimento: r.data_nascimento || null,
          campus: r.campus || null, instituicao: r.instituicao || null, curso: r.curso || null,
          genero: r.genero || 'masculino', modalidades: r.modalidade ? [r.modalidade.toUpperCase()] : [selectedTeam.modalidade],
        };
        const existId = r.rg ? byRg.get(r.rg) : null;
        if (existId) {
          await supabase.from('organizer_team_members').update(payload).eq('id', existId);
          updated++;
        } else {
          await supabase.from('organizer_team_members').insert(payload);
          inserted++;
        }
      }
      toast({ title: 'Importação concluída', description: `${inserted} novos · ${updated} atualizados · ${errors.length} erros` });
      fetchMembers(selectedTeam.id);
    } catch (e: any) {
      toast({ title: 'Erro na importação', description: e.message, variant: 'destructive' });
    } finally { setImporting(false); if (importInput.current) importInput.current.value = ''; }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Minhas Equipes</h1>
          <p className="text-muted-foreground text-sm">Cadastre suas equipes e atletas — o administrador poderá usá-las nos eventos.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1"><Download className="w-3.5 h-3.5" /> Modelo</Button>
          <input ref={importInput} type="file" accept=".xlsx,.csv" className="hidden" onChange={e => e.target.files && handleImport(e.target.files[0])} />
          <Button size="sm" disabled={importing || !selectedTeam} onClick={() => importInput.current?.click()} className="gradient-primary text-primary-foreground gap-1">
            {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />} Importar planilha
          </Button>
        </div>
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
              <SelectContent>{modalities.map(m => <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>)}</SelectContent>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" /> Equipes ({teams.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> :
              teams.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhuma equipe cadastrada.</p> :
                teams.map(t => (
                  <div key={t.id} onClick={() => setSelectedTeam(t)}
                    className={`group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${selectedTeam?.id === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{t.nome}</div>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-[10px]">{t.modalidade}</Badge>
                        {t.genero && <Badge variant="secondary" className="text-[10px]">{t.genero}</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleDeleteTeam(t.id); }}>
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
              <Button size="sm" onClick={openMemberDialog} className="gap-1">
                <UserPlus className="w-3.5 h-3.5" /> Adicionar
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!selectedTeam ? (
              <p className="text-sm text-muted-foreground text-center py-6">Clique em uma equipe à esquerda.</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum atleta cadastrado.</p>
            ) : (
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-2 rounded border border-border hover:bg-muted/50">
                    {m.foto_url ? <img src={m.foto_url} alt="" className="w-10 h-10 rounded object-cover" /> : <div className="w-10 h-10 rounded bg-muted shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate text-sm">{m.nome}</div>
                      <div className="text-xs text-muted-foreground truncate">{m.rg ? `RG ${m.rg}` : ''} {m.curso && `· ${m.curso}`} {m.campus && `· ${m.campus}`}</div>
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

      {/* Dialog de novo atleta — completo */}
      <Dialog open={memberDialog} onOpenChange={setMemberDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Adicionar atleta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <Label className="text-xs">Foto *</Label>
                <label className="block w-24 h-24 rounded border-2 border-dashed cursor-pointer overflow-hidden bg-muted/50 hover:border-primary">
                  {photoFile ? <img src={URL.createObjectURL(photoFile)} alt="" className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex flex-col items-center justify-center text-xs text-muted-foreground"><Upload className="w-4 h-4 mb-1" /> Enviar</div>
                  }
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
                </label>
                <p className="text-[10px] text-muted-foreground mt-1 w-24">JPG/PNG/WEBP. Será comprimida.</p>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label className="text-xs">Nome completo *</Label><Input value={newMember.nome} onChange={e => setNewMember({ ...newMember, nome: e.target.value })} /></div>
                <div><Label className="text-xs">Telefone *</Label><Input value={newMember.telefone} onChange={e => setNewMember({ ...newMember, telefone: e.target.value })} /></div>
                <div><Label className="text-xs">RG *</Label><Input value={newMember.rg} onChange={e => setNewMember({ ...newMember, rg: e.target.value })} /></div>
                <div><Label className="text-xs">Data nascimento *</Label><Input type="date" value={newMember.data_nascimento} onChange={e => setNewMember({ ...newMember, data_nascimento: e.target.value })} /></div>
                <div>
                  <Label className="text-xs">Gênero</Label>
                  <Select value={newMember.genero} onValueChange={v => setNewMember({ ...newMember, genero: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="masculino">Masculino</SelectItem><SelectItem value="feminino">Feminino</SelectItem><SelectItem value="outro">Outro</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Instituição *</Label><Input value={newMember.instituicao} onChange={e => setNewMember({ ...newMember, instituicao: e.target.value })} /></div>
              <div><Label className="text-xs">Campus *</Label><Input value={newMember.campus} onChange={e => setNewMember({ ...newMember, campus: e.target.value })} /></div>
              <div><Label className="text-xs">Curso *</Label><Input value={newMember.curso} onChange={e => setNewMember({ ...newMember, curso: e.target.value })} /></div>
            </div>

            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">SAÚDE & EMERGÊNCIA (opcional)</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Tipo sanguíneo</Label><Input value={newMember.tipo_sanguineo} onChange={e => setNewMember({ ...newMember, tipo_sanguineo: e.target.value })} placeholder="O+, A-, ..." /></div>
                <div><Label className="text-xs">Contato de emergência</Label><Input value={newMember.contato_emergencia} onChange={e => setNewMember({ ...newMember, contato_emergencia: e.target.value })} /></div>
                <div className="col-span-2"><Label className="text-xs">Alergias</Label><Input value={newMember.alergias} onChange={e => setNewMember({ ...newMember, alergias: e.target.value })} /></div>
                <div className="col-span-2"><Label className="text-xs">Enfermidades / condições</Label><Input value={newMember.enfermidades} onChange={e => setNewMember({ ...newMember, enfermidades: e.target.value })} /></div>
                <div className="col-span-2"><Label className="text-xs">Observações</Label><Textarea rows={2} value={newMember.observacoes} onChange={e => setNewMember({ ...newMember, observacoes: e.target.value })} /></div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddMember} disabled={photoUploading} className="gradient-primary text-primary-foreground">
              {photoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizerTeams;
