import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Pencil, Loader2, ListChecks } from 'lucide-react';

interface Modality {
  id: string; nome: string; descricao: string | null; unidade: string | null;
  max_atletas: number | null; max_equipes: number | null; ativo: boolean; regras: string | null;
  tipo_participacao: 'coletiva' | 'individual'; regra_pontuacao: string;
}

const REGRAS = [
  { v: 'padrao', label: 'Padrão (V/E/D · 3-1-0)' },
  { v: 'futsal', label: 'Futsal (gols + saldo)' },
  { v: 'handebol', label: 'Handebol (gols + saldo)' },
  { v: 'volei', label: 'Vôlei (por sets)' },
  { v: 'tenis_mesa', label: 'Tênis de Mesa (por games)' },
  { v: 'xadrez', label: 'Xadrez (1/½/0)' },
  { v: 'atletismo', label: 'Atletismo (maior marca)' },
  { v: 'corrida', label: 'Corrida (menor tempo)' },
];

const blank = { nome: '', descricao: '', unidade: 'pontos', max_atletas: '', max_equipes: '', regras: '', ativo: true, tipo_participacao: 'coletiva', regra_pontuacao: 'padrao' };

const AdminModalities = () => {
  const [items, setItems] = useState<Modality[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Modality | null>(null);
  const [form, setForm] = useState<any>(blank);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from('sport_modalities').select('*').order('nome');
    setItems((data ?? []) as Modality[]);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const openNew = () => { setEditing(null); setForm(blank); setOpen(true); };
  const openEdit = (m: Modality) => {
    setEditing(m);
    setForm({ ...m, max_atletas: m.max_atletas ?? '', max_equipes: m.max_equipes ?? '', regras: m.regras ?? '', descricao: m.descricao ?? '' });
    setOpen(true);
  };

  const save = async () => {
    if (!form.nome.trim()) return toast({ title: 'Informe o nome', variant: 'destructive' });
    const payload = {
      nome: form.nome.trim().toUpperCase(),
      descricao: form.descricao || null,
      unidade: form.unidade || 'pontos',
      max_atletas: form.max_atletas ? Number(form.max_atletas) : null,
      max_equipes: form.max_equipes ? Number(form.max_equipes) : null,
      regras: form.regras || null,
      ativo: !!form.ativo,
      tipo_participacao: form.tipo_participacao || 'coletiva',
      regra_pontuacao: form.regra_pontuacao || 'padrao',
    };
    const { error } = editing
      ? await supabase.from('sport_modalities').update(payload).eq('id', editing.id)
      : await supabase.from('sport_modalities').insert(payload);
    if (error) return toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    toast({ title: editing ? 'Modalidade atualizada' : 'Modalidade criada' });
    setOpen(false); fetch();
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir esta modalidade?')) return;
    const { error } = await supabase.from('sport_modalities').delete().eq('id', id);
    if (error) return toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    fetch();
  };

  const toggle = async (m: Modality) => {
    await supabase.from('sport_modalities').update({ ativo: !m.ativo }).eq('id', m.id);
    fetch();
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><ListChecks className="w-6 h-6 text-primary" /> Modalidades</h1>
          <p className="text-muted-foreground text-sm">Gerencie esportes disponíveis no sistema</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gradient-primary text-primary-foreground gap-2"><Plus className="w-4 h-4" /> Nova modalidade</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Nova'} modalidade</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Nome *</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
              <div><Label className="text-xs">Descrição</Label><Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Unidade</Label><Input value={form.unidade} onChange={e => setForm({ ...form, unidade: e.target.value })} placeholder="gols/sets/pontos/metros" /></div>
                <div className="flex items-end gap-2"><Switch checked={form.ativo} onCheckedChange={v => setForm({ ...form, ativo: v })} /><Label>Ativo</Label></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Tipo de participação</Label>
                  <Select value={form.tipo_participacao} onValueChange={(v) => setForm({ ...form, tipo_participacao: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coletiva">Coletiva (equipes)</SelectItem>
                      <SelectItem value="individual">Individual (atletas)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Regra de pontuação</Label>
                  <Select value={form.regra_pontuacao} onValueChange={(v) => setForm({ ...form, regra_pontuacao: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {REGRAS.map(r => <SelectItem key={r.v} value={r.v}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Máx atletas</Label><Input type="number" value={form.max_atletas} onChange={e => setForm({ ...form, max_atletas: e.target.value })} /></div>
                <div><Label className="text-xs">Máx equipes</Label><Input type="number" value={form.max_equipes} onChange={e => setForm({ ...form, max_equipes: e.target.value })} /></div>
              </div>
              <div><Label className="text-xs">Regras específicas</Label><Input value={form.regras} onChange={e => setForm({ ...form, regras: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save} className="gradient-primary text-primary-foreground">{editing ? 'Salvar' : 'Criar'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{items.length} modalidade(s)</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left">Nome</th>
                    <th className="p-3 text-left">Unidade</th>
                    <th className="p-3 text-left">Máx Atl/Eq</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(m => (
                    <tr key={m.id} className="border-t">
                      <td className="p-3 font-medium">{m.nome}<div className="text-xs text-muted-foreground">{m.descricao}</div></td>
                      <td className="p-3">{m.unidade}</td>
                      <td className="p-3 text-xs">{m.max_atletas ?? '-'} / {m.max_equipes ?? '-'}</td>
                      <td className="p-3"><Badge variant={m.ativo ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => toggle(m)}>{m.ativo ? 'Ativo' : 'Inativo'}</Badge></td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(m.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
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

export default AdminModalities;
