import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';
import logo from '@/assets/logo.png';

const AuthPage = () => {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast({ title: 'Login realizado com sucesso!' });
      } else {
        await signUp(email, password, displayName);
        toast({
          title: 'Cadastro realizado!',
          description: 'Você já pode fazer login.',
        });
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-hero">
      <Card className="w-full max-w-sm shadow-elevated border-0">
        <CardHeader className="text-center pb-2">
          <img src={logo} alt="IF Competition" className="w-16 h-16 mx-auto mb-3" />
          <CardTitle className="font-heading text-xl text-foreground">
            IF Competition 2026
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {isLogin ? 'Faça login para acessar' : 'Crie sua conta'}
          </p>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <div>
                <Label className="text-xs">Nome</Label>
                <Input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="h-9"
                />
              </div>
            )}
            <div>
              <Label className="text-xs">E-mail</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs">Senha</Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="h-9"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground h-9">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : isLogin ? <LogIn className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
              {isLogin ? 'Entrar' : 'Cadastrar'}
            </Button>
          </form>
          <div className="text-center mt-3">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-primary hover:underline"
            >
              {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
