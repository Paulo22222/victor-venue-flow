import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users, ListChecks, Radio } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ events: 0, inProgress: 0, finished: 0, organizerTeams: 0 });

  useEffect(() => {
    (async () => {
      const [{ data: comps }, { count: teams }] = await Promise.all([
        supabase.from('competitions').select('id, finalizado'),
        supabase.from('organizer_teams').select('id', { count: 'exact', head: true }),
      ]);
      const events = comps?.length ?? 0;
      const finished = comps?.filter(c => c.finalizado).length ?? 0;
      setStats({ events, inProgress: events - finished, finished, organizerTeams: teams ?? 0 });
    })();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="font-heading text-2xl font-bold">Painel do Administrador</h1>
        <p className="text-muted-foreground text-sm">Visão geral do sistema</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Trophy} label="Eventos totais" value={stats.events} />
        <StatCard icon={Radio} label="Em andamento" value={stats.inProgress} accent />
        <StatCard icon={ListChecks} label="Finalizados" value={stats.finished} />
        <StatCard icon={Users} label="Equipes (organizadores)" value={stats.organizerTeams} />
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent?: boolean }) => (
  <Card>
    <CardContent className="p-5">
      <Icon className={`w-5 h-5 mb-2 ${accent ? 'text-destructive' : 'text-primary'}`} />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </CardContent>
  </Card>
);

export default AdminDashboard;
