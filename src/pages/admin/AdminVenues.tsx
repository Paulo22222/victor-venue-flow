import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Pencil, Loader2, MapPin } from 'lucide-react';

interface Venue {
  id: string; nome: string; endereco: string | null; capacidade: number | null;
  disponivel: boolean; modalidade_id: string | null; modalidade_nome: string | null; observacoes: string | null;
}
interface Modality { id: string; nome: string; }

const blank = { nome: '', endereco: '', capacidade: '', disponivel: true, modalidade_id: 'none', observacoes: '' };

const AdminVenues = () => {
  const [items, setItems] = useState<Venue[]>([]);
  const [mods, setMods] = useState<Modality[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Venue | null>(null);
  const [form, setForm] = useState<any>(blank);

  const fetch = async () => {
    setLoading(true);
    const [v, m] = await Promise.all([
      supabase.from('venues').select('*').order('nome'),
      supabase.from('sport_modalities').select('id, nome').eq('ativo', true).order('nome'),
    ]);
    setItems((v.data ?? []) as Venue[]);
    setMods((m.data ?? []) as Modality[]);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const openNew = () => { setEditing(null); setForm(blank); setOpen(true); };
  const openEdit = (v: Venue) => {
    setEditing(v);
    setForm({
      nome: v.nome, endereco: v.endereco ?? '', capacidade: v.capacidade ?? '',
      disponivel: v.disponivel, modalidade_id: v.modalidade_id ?? 'none', observacoes: v.observacoes ?? '',
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.nome.trim()) return toast({ title: 'Informe o nome', variant: 'destructive' });
    const mod = mods.find(m => m.id === form.modalidade_id);
    const payload = {
      nome: form.nome.trim(),
      endereco: form.endereco || null,
      capacidade: form.capacidade ? Number(form.capacidade) : null,
      disponivel: !!form.disponivel,
      modalidade_id: form.modalidade_id === 'none' ? null : form.modalidade_id,
      modalidade_nome: mod?.nome ?? null,
      observacoes: form.observacoes || null,
    };
    const { error } = editing
      ? await supabase.from('venues').update(payload).eq('id', editing.id)
      : await supabase.from('venues').insert(payload);
    if (error) return toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    toast({ title: 'Local salvo' });
    setOpen(false); fetch();
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este local?')) return;
    await supabase.from('venues').delete().eq('id', id);
    fetch();
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><MapPin className="w-6 h-6 text-primary" /> Locais de jogo</h1>
          <p className="text-muted-foreground text-sm">Ginásios, quadras e campos vinculados às modalidades</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gradient-primary text-primary-foreground gap-2"><Plus className="w-4 h-4" /> Novo local</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Novo'} local</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Nome *</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Ginásio Principal" /></div>
              <div><Label className="text-xs">Endereço</Label><Input value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Capacidade</Label><Input type="number" value={form.capacidade} onChange={e => setForm({ ...form, capacidade: e.target.value })} /></div>
                <div className="flex items-end gap-2"><Switch checked={form.disponivel} onCheckedChange={v => setForm({ ...form, disponivel: v })} /><Label>Disponível</Label></div>
              </div>
              <div>
                <Label className="text-xs">Modalidade vinculada</Label>
                <Select value={form.modalidade_id} onValueChange={v => setForm({ ...form, modalidade_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma (uso geral)</SelectItem>
                    {mods.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Observações</Label><Input value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save} className="gradient-primary text-primary-foreground">Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{items.length} local(is)</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum local cadastrado.</p>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr><th className="p-3 text-left">Local</th><th className="p-3 text-left">Modalidade</th><th className="p-3 text-left">Capacidade</th><th className="p-3 text-left">Status</th><th className="p-3 text-right">Ações</th></tr>
                </thead>
                <tbody>
                  {items.map(v => (
                    <tr key={v.id} className="border-t">
                      <td className="p-3"><div className="font-medium">{v.nome}</div><div className="text-xs text-muted-foreground">{v.endereco}</div></td>
                      <td className="p-3">{v.modalidade_nome ?? <span className="text-muted-foreground">—</span>}</td>
                      <td className="p-3">{v.capacidade ?? '-'}</td>
                      <td className="p-3"><Badge variant={v.disponivel ? 'default' : 'secondary'}>{v.disponivel ? 'Disponível' : 'Indisponível'}</Badge></td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(v)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(v.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                      </td>
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

export default AdminVenues;
