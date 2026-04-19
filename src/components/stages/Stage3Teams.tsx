import { useEffect, useState } from 'react';
import { useCompetition } from '@/context/CompetitionContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Users, Check, AlertCircle, Loader2, UserCheck } from 'lucide-react';
import { Equipe, Atleta } from '@/types/competition';

interface OrgTeam {
  id: string;
  nome: string;
  modalidade: string;
  genero: string | null;
  owner_id: string;
  members: { id: string; nome: string; genero: string | null; codigo: string | null }[];
  ownerName?: string;
}

const Stage3Teams = () => {
  const { state, updateCompetidores, setStep } = useCompetition();
  const modalidades = state.competidores.modalidades;
  const [activeMod, setActiveMod] = useState(modalidades[0]?.nome || '');
  const [pool, setPool] = useState<OrgTeam[]>([]);
  const [loading, setLoading] = useState(true);

  // Garante tipo "coletivo" automaticamente nesta etapa (event-driven)
  useEffect(() => {
    if (state.competidores.tipo !== 'coletivo') {
      updateCompetidores({ tipo: 'coletivo' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchPool = async () => {
      setLoading(true);
      const { data: teams } = await supabase
        .from('organizer_teams')
        .select('id, nome, modalidade, genero, owner_id')
        .order('nome');
      const ids = (teams ?? []).map(t => t.id);
      const [{ data: members }, { data: profiles }] = await Promise.all([
        ids.length ? supabase.from('organizer_team_members').select('id, team_id, nome, genero, codigo').in('team_id', ids) : Promise.resolve({ data: [] as any }),
        teams?.length ? supabase.from('profiles').select('user_id, display_name').in('user_id', teams.map(t => t.owner_id)) : Promise.resolve({ data: [] as any }),
      ]);
      const ownerMap: Record<string, string> = {};
      (profiles ?? []).forEach((p: any) => { ownerMap[p.user_id] = p.display_name || ''; });
      const result: OrgTeam[] = (teams ?? []).map(t => ({
        ...t,
        ownerName: ownerMap[t.owner_id] || '—',
        members: (members ?? []).filter((m: any) => m.team_id === t.id).map((m: any) => ({
          id: m.id, nome: m.nome, genero: m.genero, codigo: m.codigo,
        })),
      }));
      setPool(result);
      setLoading(false);
    };
    fetchPool();
  }, []);

  const isSelected = (orgTeamId: string, modalidade: string) =>
    state.competidores.equipes.some(e => e.organizerTeamId === orgTeamId && e.modalidade === modalidade);

  const toggleTeam = (t: OrgTeam, modalidade: string) => {
    if (isSelected(t.id, modalidade)) {
      updateCompetidores({
        equipes: state.competidores.equipes.filter(
          e => !(e.organizerTeamId === t.id && e.modalidade === modalidade)
        ),
      });
    } else {
      const integrantes: Atleta[] = t.members.map(m => ({
        id: m.id, nome: m.nome, dataNascimento: '', documento: '',
        genero: (m.genero as Atleta['genero']) || 'masculino',
        codigo: m.codigo || undefined,
      }));
      const novaEquipe: Equipe = {
        id: crypto.randomUUID(),
        nome: t.nome,
        genero: (t.genero as Equipe['genero']) || 'misto',
        integrantes,
        modalidade,
        organizerTeamId: t.id,
      };
      updateCompetidores({ equipes: [...state.competidores.equipes, novaEquipe] });
    }
  };

  const teamsForMod = (mod: string) =>
    pool.filter(t => t.modalidade.toUpperCase() === mod.toUpperCase());

  const selecionadasNaMod = (mod: string) =>
    state.competidores.equipes.filter(e => e.modalidade === mod);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up py-6">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
          <Users className="w-4 h-4" /> Etapa 3 de 6
        </div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold">Selecione as equipes participantes</h1>
        <p className="text-muted-foreground mt-1">
          Escolha equipes do acervo dos organizadores para cada modalidade do evento.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
      ) : pool.length === 0 ? (
        <Card><CardContent className="p-8 text-center space-y-2">
          <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="font-semibold">Nenhuma equipe cadastrada pelos organizadores ainda.</p>
          <p className="text-sm text-muted-foreground">Crie organizadores no painel de usuários e peça que cadastrem suas equipes.</p>
        </CardContent></Card>
      ) : (
        <Tabs value={activeMod} onValueChange={setActiveMod}>
          <TabsList className="w-full justify-start flex-wrap h-auto p-1">
            {modalidades.map(m => (
              <TabsTrigger key={m.nome} value={m.nome} className="gap-2">
                {m.nome}
                <Badge variant="secondary" className="h-5">{selecionadasNaMod(m.nome).length}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {modalidades.map(m => {
            const opts = teamsForMod(m.nome);
            return (
              <TabsContent key={m.nome} value={m.nome} className="mt-4 space-y-3">
                {opts.length === 0 ? (
                  <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">
                    Nenhuma equipe de {m.nome} cadastrada por organizadores.
                  </CardContent></Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {opts.map(t => {
                      const sel = isSelected(t.id, m.nome);
                      const semAtletas = t.members.length === 0;
                      return (
                        <button
                          key={t.id}
                          disabled={semAtletas}
                          onClick={() => toggleTeam(t, m.nome)}
                          className={`text-left rounded-xl border-2 p-4 transition-all
                            ${sel ? 'border-primary bg-primary/5 shadow-card' : 'border-border bg-card hover:border-primary/30'}
                            ${semAtletas ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="font-semibold">{t.nome}</div>
                            {sel && <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Check className="w-3 h-3" /></div>}
                          </div>
                          <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                            <Badge variant="outline" className="capitalize">{t.genero || 'misto'}</Badge>
                            <Badge variant="outline">{t.members.length} atleta(s)</Badge>
                            <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> {t.ownerName}</span>
                          </div>
                          {semAtletas && (
                            <p className="text-xs text-destructive mt-2">Equipe sem atletas — não pode ser usada.</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Button>
        <Button
          onClick={() => setStep(4)}
          disabled={state.competidores.equipes.length === 0}
          className="gradient-primary text-primary-foreground gap-2 px-8"
        >
          Continuar <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Stage3Teams;
