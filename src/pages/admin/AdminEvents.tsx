import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Plus, Trash2, FolderOpen, Eye } from 'lucide-react';
import { listCompetitions, SavedCompetition } from '@/services/competitionService';
import { useCompetition } from '@/context/CompetitionContext';

const AdminEvents = () => {
  const { setStep, remove, resetState } = useCompetition();
  const navigate = useNavigate();
  const [list, setList] = useState<SavedCompetition[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try { setList(await listCompetitions()); } catch {}
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const handleNew = () => { resetState(); setStep(1); navigate('/admin/wizard'); };
  const handleOpen = (id: string) => { navigate(`/admin/wizard?id=${id}`); };
  const handleDelete = async (id: string) => { if (!confirm('Excluir esta competição?')) return; await remove(id); refresh(); };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><Trophy className="w-6 h-6 text-primary" /> Eventos</h1>
          <p className="text-muted-foreground text-sm">Crie e gerencie suas competições</p>
        </div>
        <Button onClick={handleNew} className="gradient-primary text-primary-foreground gap-2"><Plus className="w-4 h-4" /> Novo evento</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FolderOpen className="w-4 h-4" /> Eventos cadastrados ({list.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> :
            list.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Nenhum evento cadastrado.</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {list.map(c => (
                  <div key={c.id} className="group p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-all">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold truncate flex-1">{c.nome || 'Sem nome'}</h3>
                      {c.finalizado ? <Badge>Finalizado</Badge> : <Badge variant="outline">Em andamento</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mb-3">
                      {c.modalidade && <span className="mr-2">{c.modalidade}</span>}
                      {c.data && <span>{c.data}</span>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => handleOpen(c.id)}>
                        <Eye className="w-3.5 h-3.5" /> Abrir
                      </Button>
                      <Link to={`/evento/${c.id}`} target="_blank">
                        <Button size="sm" variant="ghost" title="Ver página pública">
                          <Trophy className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)} title="Excluir">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEvents;
