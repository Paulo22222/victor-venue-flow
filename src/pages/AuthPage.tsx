import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { LogIn, Loader2, ArrowLeft, User } from 'lucide-react';
import logo from '@/assets/logo.png';

const INTERNAL_DOMAIN = 'ifcomp.local';

const AuthPage = () => {
  const { signIn, user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user && role) {
      if (role === 'admin') navigate('/admin/dashboard', { replace: true });
      else if (role === 'organizer') navigate('/organizer/dashboard', { replace: true });
      else navigate('/', { replace: true });
    }
  }, [user, role, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim().toLowerCase();
    if (!u) return toast({ title: 'Informe o usuário', variant: 'destructive' });
    setLoading(true);
    try {
      // Username is converted to internal email for Supabase Auth
      const email = u.includes('@') ? u : `${u}@${INTERNAL_DOMAIN}`;
      await signIn(email, password);
      toast({ title: 'Login realizado!' });
    } catch (err: any) {
      toast({ title: 'Erro ao entrar', description: err.message === 'Invalid login credentials' ? 'Usuário ou senha incorretos' : err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-hero">
      <div className="w-full max-w-sm">
        <Link to="/" className="text-primary-foreground/80 hover:text-primary-foreground text-xs flex items-center gap-1 mb-3">
          <ArrowLeft className="w-3 h-3" /> Voltar à página pública
        </Link>
        <Card className="shadow-elevated border-0">
          <CardHeader className="text-center pb-2">
            <img src={logo} alt="" className="w-16 h-16 mx-auto mb-3" />
            <CardTitle className="font-heading text-xl text-foreground">Acesso restrito</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Administradores e organizadores</p>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label className="text-xs flex items-center gap-1.5"><User className="w-3 h-3" /> Usuário</Label>
                <Input
                  type="text" value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="seu_usuario"
                  required autoComplete="username"
                  className="h-9 lowercase"
                />
              </div>
              <div>
                <Label className="text-xs">Senha</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} autoComplete="current-password" className="h-9" />
              </div>
              <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground h-9">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
                Entrar
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Não tem conta? Solicite acesso ao administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
