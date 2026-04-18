import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Calendar, MapPin, LogIn, Radio } from 'lucide-react';
import logo from '@/assets/logo.png';

interface CompetitionView {
  id: string;
  nome: string;
  data: string | null;
  modalidade: string | null;
  local: string | null;
  finalizado: boolean | null;
  updated_at: string;
}

const PublicHome = () => {
  const [competitions, setCompetitions] = useState<CompetitionView[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCompetitions = async () => {
    const { data } = await supabase
      .from('competitions')
      .select('id, nome, data, modalidade, local, finalizado, updated_at')
      .order('updated_at', { ascending: false });
    setCompetitions(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCompetitions();
    // realtime updates
    const channel = supabase
      .channel('public-competitions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competitions' }, () => fetchCompetitions())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const inProgress = competitions.filter(c => !c.finalizado);
  const finished = competitions.filter(c => c.finalizado);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="IF Competition" className="w-8 h-8" width={32} height={32} />
            <span className="font-heading font-bold text-foreground">IF Competition 2026</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="gap-2">
            <LogIn className="w-4 h-4" /> Acesso restrito
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="gradient-hero py-12 md:py-16 text-center">
        <div className="container mx-auto px-4">
          <Trophy className="w-12 h-12 mx-auto text-primary-foreground mb-3" />
          <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-primary-foreground mb-2">
            Competições ao vivo
          </h1>
          <p className="text-primary-foreground/80 text-base max-w-xl mx-auto">
            Acompanhe os jogos, placares e classificações em tempo real.
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-10 space-y-12">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Em andamento */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Radio className="w-5 h-5 text-destructive animate-pulse" />
                <h2 className="font-heading text-xl font-bold">Em andamento</h2>
                <Badge variant="secondary">{inProgress.length}</Badge>
              </div>
              {inProgress.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum evento em andamento agora.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inProgress.map(c => <CompetitionCard key={c.id} c={c} live />)}
                </div>
              )}
            </section>

            {/* Finalizados */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-primary" />
                <h2 className="font-heading text-xl font-bold">Finalizados</h2>
                <Badge variant="secondary">{finished.length}</Badge>
              </div>
              {finished.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum evento finalizado ainda.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {finished.map(c => <CompetitionCard key={c.id} c={c} />)}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        IF Competition 2026 — IFTM Paracatu, MG
      </footer>
    </div>
  );
};

const CompetitionCard = ({ c, live }: { c: CompetitionView; live?: boolean }) => (
  <Link to={`/evento/${c.id}`}>
    <Card className="h-full hover:border-primary/40 hover:shadow-card transition-all border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-heading font-semibold text-foreground line-clamp-1">{c.nome || 'Sem nome'}</h3>
          {live ? (
            <Badge className="bg-destructive text-destructive-foreground gap-1 shrink-0">
              <Radio className="w-3 h-3 animate-pulse" /> Ao vivo
            </Badge>
          ) : (
            <Badge variant="outline" className="shrink-0">Finalizado</Badge>
          )}
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          {c.modalidade && <div className="flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5" /> {c.modalidade}</div>}
          {c.data && <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {c.data}</div>}
          {c.local && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {c.local}</div>}
        </div>
      </CardContent>
    </Card>
  </Link>
);

export default PublicHome;
