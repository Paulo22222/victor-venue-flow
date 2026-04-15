import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Shield, Users, Loader2, ArrowLeft } from 'lucide-react';

interface UserInfo {
  id: string;
  email: string;
  display_name: string;
  role: string;
  created_at: string;
}

interface AdminPanelProps {
  onBack: () => void;
}

const AdminPanel = ({ onBack }: AdminPanelProps) => {
  const { session } = useAuth();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-roles', {
        method: 'GET',
      });
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const changeRole = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      const { error } = await supabase.functions.invoke('manage-roles', {
        body: { user_id: userId, role: newRole },
      });
      if (error) throw error;
      toast({ title: 'Papel atualizado com sucesso!' });
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <Button variant="ghost" onClick={onBack} className="mb-4 gap-2">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Button>
      <Card className="border-0 shadow-card">
        <CardHeader className="gradient-primary rounded-t-lg">
          <CardTitle className="text-primary-foreground flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Gestão de Usuários e Papéis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum usuário encontrado.</p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left font-semibold">Usuário</th>
                    <th className="p-3 text-left font-semibold">E-mail</th>
                    <th className="p-3 text-left font-semibold">Papel</th>
                    <th className="p-3 text-center font-semibold">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t hover:bg-muted/50">
                      <td className="p-3 font-medium">{u.display_name}</td>
                      <td className="p-3 text-muted-foreground">{u.email}</td>
                      <td className="p-3">
                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className={u.role === 'admin' ? 'gradient-primary text-primary-foreground' : ''}>
                          {u.role === 'admin' ? 'Administrador' : 'Visualizador'}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        {updating === u.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        ) : (
                          <Select
                            value={u.role}
                            onValueChange={(v) => changeRole(u.id, v)}
                          >
                            <SelectTrigger className="w-36 h-8 mx-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="viewer">Visualizador</SelectItem>
                            </SelectContent>
                          </Select>
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

export default AdminPanel;
