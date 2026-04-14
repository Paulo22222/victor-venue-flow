import { useCompetition } from '@/context/CompetitionContext';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Swords, MapPin, FileText, ArrowRight, Loader2, Trash2, FolderOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { listCompetitions, SavedCompetition } from '@/services/competitionService';
import logo from '@/assets/logo.png';
import heroBanner from '@/assets/hero-banner.jpg';

const steps = [
  { icon: Trophy, label: 'Cadastro do Evento', desc: 'Informações gerais da competição', step: 1 },
  { icon: Users, label: 'Competidores', desc: 'Atletas, equipes e modalidades', step: 2 },
  { icon: Swords, label: 'Sistema de Disputas', desc: 'Rodízio, eliminatória ou misto', step: 3 },
  { icon: MapPin, label: 'Logística', desc: 'Locais, horários e programação', step: 4 },
  { icon: FileText, label: 'Relatórios', desc: 'Resultados e boletins finais', step: 5 },
];

const HomePage = () => {
  const { setStep, load, remove, resetState } = useCompetition();
  const [competitions, setCompetitions] = useState<SavedCompetition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompetitions = async () => {
    setLoading(true);
    try {
      const data = await listCompetitions();
      setCompetitions(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const handleNew = () => {
    resetState();
    setStep(1);
  };

  const handleLoad = async (id: string) => {
    await load(id);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir esta competição?')) return;
    await remove(id);
    fetchCompetitions();
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBanner} alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 gradient-hero opacity-90" />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-16 md:py-24 text-center">
          <img src={logo} alt="IF Competition 2026" className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-6" width={128} height={128} />
          <h1 className="font-heading text-3xl md:text-5xl font-extrabold text-primary-foreground mb-4 tracking-tight">
            IF Competition 2026
          </h1>
          <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto mb-8 font-light">
            Ferramenta tecnológica para organização de competições esportivas. 
            Funcional, intuitiva e eficiente.
          </p>
          <Button
            onClick={handleNew}
            size="lg"
            className="gradient-accent text-accent-foreground font-bold text-lg px-10 py-6 rounded-full shadow-elevated hover:scale-105 transition-transform animate-pulse-glow"
          >
            Criar Nova Competição <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Saved Competitions */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-center mb-8 text-foreground">
          <FolderOpen className="inline-block w-7 h-7 mr-2 mb-1" />
          Competições Salvas
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : competitions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma competição salva ainda. Crie uma nova para começar!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {competitions.map(c => (
              <button
                key={c.id}
                onClick={() => handleLoad(c.id)}
                className="group text-left p-5 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-card transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading font-semibold text-foreground truncate">{c.nome || 'Sem nome'}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {c.modalidade && <span className="mr-3">{c.modalidade}</span>}
                      {c.data && <span>{c.data}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-2">
                      Atualizado: {new Date(c.updated_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(c.id, e)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    title="Excluir competição"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-center mb-12 text-foreground">
          Como funciona
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => setStep(s.step)}
              className={`group text-center p-6 rounded-xl border-2 border-transparent hover:border-primary/20 hover:shadow-card transition-all duration-300 animate-fade-in-up opacity-0 step-delay-${i + 1} bg-card`}
            >
              <div className="w-16 h-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-card">
                <s.icon className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="text-xs font-bold text-primary mb-1">ETAPA {s.step}</div>
              <h3 className="font-heading font-semibold text-foreground mb-1">{s.label}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-muted py-8 text-center text-sm text-muted-foreground">
        <p>IF Competition 2026 — Prof. Marcos Roberto dos Santos</p>
        <p>Professor EBTT – IFTM · Paracatu, MG</p>
      </footer>
    </div>
  );
};

export default HomePage;
