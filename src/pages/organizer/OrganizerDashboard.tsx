import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ListChecks, Trophy } from 'lucide-react';

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ teams: 0, athletes: 0, modalities: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: teams } = await supabase
        .from('organizer_teams')
        .select('id, modalidade')
        .eq('owner_id', user.id);
      const teamIds = (teams ?? []).map(t => t.id);
      let athletes = 0;
      if (teamIds.length > 0) {
        const { count } = await supabase
          .from('organizer_team_members')
          .select('id', { count: 'exact', head: true })
          .in('team_id', teamIds);
        athletes = count ?? 0;
      }
      const modalities = new Set((teams ?? []).map(t => t.modalidade)).size;
      setStats({ teams: teams?.length ?? 0, athletes, modalities });
    })();
  }, [user]);

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="font-heading text-2xl font-bold">Painel do Organizador</h1>
        <p className="text-muted-foreground text-sm">Gerencie suas equipes e atletas</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Equipes" value={stats.teams} />
        <StatCard icon={Trophy} label="Atletas" value={stats.athletes} />
        <StatCard icon={ListChecks} label="Modalidades" value={stats.modalities} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Próximos passos</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Acesse <strong>Minhas Equipes</strong> para cadastrar novas equipes.</p>
          <p>2. Para cada equipe, adicione pelo menos 1 atleta com nome, matrícula e dados básicos.</p>
          <p>3. As equipes ficam disponíveis para o administrador selecionar nos eventos.</p>
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: number }) => (
  <Card>
    <CardContent className="p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary-foreground" />
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </CardContent>
  </Card>
);

export default OrganizerDashboard;
