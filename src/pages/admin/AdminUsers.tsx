import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Shield, Loader2, Plus, Trash2 } from 'lucide-react';

interface UserInfo {
  id: string; email: string; display_name: string; role: string; created_at: string;
}

const AdminUsers = () => {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', display_name: '', role: 'organizer' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-roles', { method: 'GET' });
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const changeRole = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      const { error } = await supabase.functions.invoke('manage-roles', { body: { user_id: userId, role: newRole } });
      if (error) throw error;
      toast({ title: 'Papel atualizado!' });
      fetchUsers();
    } catch (err: any) { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); }
    finally { setUpdating(null); }
  };

  const createUser = async () => {
    if (!newUser.email || !newUser.password) return toast({ title: 'Preencha e-mail e senha', variant: 'destructive' });
    setCreating(true);
    try {
      const { error } = await supabase.functions.invoke('manage-roles?action=create', { body: newUser });
      if (error) throw error;
      toast({ title: 'Usuário criado!' });
      setNewUser({ email: '', password: '', display_name: '', role: 'organizer' });
      setCreateOpen(false);
      fetchUsers();
    } catch (err: any) { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); }
    finally { setCreating(false); }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Excluir este usuário permanentemente?')) return;
    try {
      const { error } = await supabase.functions.invoke('manage-roles?action=delete', { body: { user_id: userId } });
      if (error) throw error;
      toast({ title: 'Usuário excluído' });
      fetchUsers();
    } catch (err: any) { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); }
  };

  const roleLabel = (r: string) => r === 'admin' ? 'Administrador' : r === 'organizer' ? 'Organizador' : 'Visualizador';
  const roleColor = (r: string) => r === 'admin' ? 'gradient-primary text-primary-foreground' : r === 'organizer' ? 'bg-accent text-accent-foreground' : '';

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6 text-primary" /> Usuários</h1>
          <p className="text-muted-foreground text-sm">Crie contas e gerencie papéis</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground gap-2"><Plus className="w-4 h-4" /> Novo usuário</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar novo usuário</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Nome</Label>
                <Input value={newUser.display_name} onChange={e => setNewUser(s => ({ ...s, display_name: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">E-mail *</Label>
                <Input type="email" value={newUser.email} onChange={e => setNewUser(s => ({ ...s, email: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Senha inicial *</Label>
                <Input type="text" value={newUser.password} onChange={e => setNewUser(s => ({ ...s, password: e.target.value }))} placeholder="mínimo 6 caracteres" />
              </div>
              <div>
                <Label className="text-xs">Papel</Label>
                <Select value={newUser.role} onValueChange={v => setNewUser(s => ({ ...s, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organizer">Organizador</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button onClick={createUser} disabled={creating} className="gradient-primary text-primary-foreground">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{users.length} usuário(s)</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left">Nome</th>
                    <th className="p-3 text-left">E-mail</th>
                    <th className="p-3 text-left">Papel</th>
                    <th className="p-3 text-center">Alterar</th>
                    <th className="p-3 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t hover:bg-muted/50">
                      <td className="p-3 font-medium">{u.display_name}</td>
                      <td className="p-3 text-muted-foreground">{u.email}</td>
                      <td className="p-3"><Badge className={roleColor(u.role)}>{roleLabel(u.role)}</Badge></td>
                      <td className="p-3 text-center">
                        {updating === u.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (
                          <Select value={u.role} onValueChange={v => changeRole(u.id, v)}>
                            <SelectTrigger className="w-36 h-8 mx-auto"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="organizer">Organizador</SelectItem>
                              <SelectItem value="viewer">Visualizador</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {u.id !== me?.id && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteUser(u.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        )}
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

export default AdminUsers;
