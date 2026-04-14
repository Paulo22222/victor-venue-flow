import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, LogOut, Trophy, Eye } from 'lucide-react';
import logo from '@/assets/logo.png';

interface CompetitionView {
  id: string;
  nome: string;
  data: string | null;
  modalidade: string | null;
  local: string | null;
  finalizado: boolean | null;
}

interface MatchView {
  id: string;
  rodada: number;
  participante_a: string;
  participante_b: string;
  placar_a: number | null;
  placar_b: number | null;
}

const ViewerHome = () => {
  const { signOut } = useAuth();
  const [competitions, setCompetitions] = useState<CompetitionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchView[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('competitions')
        .select('id, nome, data, modalidade, local, finalizado')
        .order('updated_at', { ascending: false });
      setCompetitions(data ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  const viewCompetition = async (id: string) => {
    setSelected(id);
    setLoadingMatches(true);
    const { data } = await supabase
      .from('competition_matches')
      .select('*')
      .eq('competition_id', id)
      .order('rodada');
    setMatches(data ?? []);
    setLoadingMatches(false);
  };

  const comp = competitions.find(c => c.id === selected);

  // Classificação
  const classificacao = () => {
    const pontos: Record<string, number> = {};
    matches.forEach(m => {
      if (!pontos[m.participante_a]) pontos[m.participante_a] = 0;
      if (!pontos[m.participante_b]) pontos[m.participante_b] = 0;
      if (m.placar_a != null && m.placar_b != null) {
        if (m.placar_a > m.placar_b) pontos[m.participante_a] += 3;
        else if (m.placar_b > m.placar_a) pontos[m.participante_b] += 3;
        else { pontos[m.participante_a] += 1; pontos[m.participante_b] += 1; }
      }
    });
    return Object.entries(pontos).sort((a, b) => b[1] - a[1]);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-hero py-3 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="IF Competition" className="w-8 h-8" />
            <span className="font-heading font-bold text-primary-foreground text-lg hidden sm:inline">IF Competition 2026</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Visualizador</Badge>
            <Button variant="secondary" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-1" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!selected ? (
          <>
            <h1 className="font-heading text-2xl font-bold mb-6 flex items-center gap-2">
              <Eye className="w-6 h-6 text-primary" /> Competições Disponíveis
            </h1>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : competitions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma competição cadastrada ainda.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {competitions.map(c => (
                  <button
                    key={c.id}
                    onClick={() => viewCompetition(c.id)}
                    className="text-left p-5 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-card transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-heading font-semibold text-foreground">{c.nome || 'Sem nome'}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {c.modalidade && <span className="mr-3">{c.modalidade}</span>}
                          {c.data && <span>{c.data}</span>}
                        </p>
                        {c.local && <p className="text-xs text-muted-foreground mt-1">{c.local}</p>}
                      </div>
                      <Badge variant={c.finalizado ? 'default' : 'outline'} className={c.finalizado ? 'gradient-primary text-primary-foreground' : ''}>
                        {c.finalizado ? 'Finalizado' : 'Em andamento'}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => setSelected(null)} className="mb-4">← Voltar</Button>
            <h1 className="font-heading text-2xl font-bold mb-6">{comp?.nome}</h1>

            {!comp?.finalizado && (
              <Card className="mb-6 bg-warning/10 border-warning/30">
                <CardContent className="p-4 text-center">
                  <p className="text-warning font-semibold">⏳ Este evento ainda está em andamento. Os resultados serão exibidos quando o administrador finalizar o evento.</p>
                </CardContent>
              </Card>
            )}

            {comp?.finalizado && (
              <>
                {loadingMatches ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : (
                  <>
                    {/* Classificação */}
                    <Card className="shadow-card border-0 mb-6">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" /> Classificação Final</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-lg border overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-muted">
                              <tr>
                                <th className="p-3 text-left">Pos.</th>
                                <th className="p-3 text-left">Participante</th>
                                <th className="p-3 text-center">Pontos</th>
                              </tr>
                            </thead>
                            <tbody>
                              {classificacao().map(([nome, pts], i) => (
                                <tr key={nome} className={`border-t ${i < 3 ? 'font-semibold' : ''}`}>
                                  <td className="p-3">
                                    {i === 0 && '🥇'}{i === 1 && '🥈'}{i === 2 && '🥉'}{i > 2 && `${i + 1}º`}
                                  </td>
                                  <td className="p-3">{nome}</td>
                                  <td className="p-3 text-center">{pts}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Jogos */}
                    <Card className="shadow-card border-0">
                      <CardHeader>
                        <CardTitle className="text-lg">Resultados dos Jogos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-lg border overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-muted">
                              <tr>
                                <th className="p-2 text-left">Rd</th>
                                <th className="p-2 text-left">Participante A</th>
                                <th className="p-2 text-center">Placar</th>
                                <th className="p-2 text-left">Participante B</th>
                                <th className="p-2 text-center">Placar</th>
                              </tr>
                            </thead>
                            <tbody>
                              {matches.map(m => (
                                <tr key={m.id} className="border-t">
                                  <td className="p-2"><Badge variant="outline">{m.rodada}</Badge></td>
                                  <td className="p-2 font-medium">{m.participante_a}</td>
                                  <td className="p-2 text-center font-bold">{m.placar_a ?? '-'}</td>
                                  <td className="p-2 font-medium">{m.participante_b}</td>
                                  <td className="p-2 text-center font-bold">{m.placar_b ?? '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default ViewerHome;
