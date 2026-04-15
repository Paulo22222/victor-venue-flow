import { useCompetition } from '@/context/CompetitionContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Swords, MapPin, FileText, ArrowRight, Loader2, Trash2, FolderOpen, Download, Shield, ListChecks } from 'lucide-react';
import { useEffect, useState } from 'react';
import { listCompetitions, SavedCompetition } from '@/services/competitionService';
import { Badge } from '@/components/ui/badge';
import logo from '@/assets/logo.png';

const steps = [
  { icon: Trophy, label: 'Cadastro do Evento', desc: 'Informações gerais da competição', step: 1 },
  { icon: ListChecks, label: 'Categorias', desc: 'Modalidades esportivas do evento', step: 2 },
  { icon: Users, label: 'Competidores', desc: 'Atletas e equipes por categoria', step: 3 },
  { icon: Swords, label: 'Sistema de Disputas', desc: 'Rodízio, eliminatória ou misto', step: 4 },
  { icon: MapPin, label: 'Logística', desc: 'Locais, horários e programação', step: 5 },
  { icon: FileText, label: 'Relatórios', desc: 'Resultados e boletins em PDF', step: 6 },
];

const guideContent = `# IF Competition 2026 — Guia de Execução Local

## Pré-requisitos
- Node.js 18+ (https://nodejs.org/)
- npm ou bun

## Passos para executar

1. Clone o repositório:
   git clone <URL_DO_REPOSITORIO>
   cd if-competition-2026

2. Instale as dependências:
   npm install

3. Configure as variáveis de ambiente:
   Crie um arquivo .env na raiz com:
   VITE_SUPABASE_URL=<sua_url_supabase>
   VITE_SUPABASE_PUBLISHABLE_KEY=<sua_chave_publica>

4. Execute o projeto:
   npm run dev

5. Acesse no navegador:
   http://localhost:5173

## Papéis de Usuário
- Admin: Acesso completo (criar, editar, finalizar competições, gerenciar papéis)
- Viewer: Apenas visualização de eventos finalizados

## Tecnologias
- React 18 + TypeScript
- Vite 5
- Tailwind CSS
- Lovable Cloud

## Autor
Prof. Marcos Roberto dos Santos — IFTM, Paracatu, MG
`;

interface HomePageProps {
  onOpenAdmin?: () => void;
}

const HomePage = ({ onOpenAdmin }: HomePageProps) => {
  const { setStep, load, remove, resetState } = useCompetition();
  const { signOut } = useAuth();
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

  const handleDownloadGuide = () => {
    const blob = new Blob([guideContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'IF_Competition_2026_Guia_Local.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="gradient-hero">
        <div className="container mx-auto px-4 py-16 md:py-20 text-center relative">
          <div className="absolute top-4 right-4 flex gap-2">
            {onOpenAdmin && (
              <Button variant="ghost" size="sm" onClick={onOpenAdmin} className="text-primary-foreground/70 hover:text-primary-foreground gap-1">
                <Shield className="w-4 h-4" /> Gerenciar Usuários
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={signOut} className="text-primary-foreground/70 hover:text-primary-foreground">
              Sair
            </Button>
          </div>
          <img src={logo} alt="IF Competition 2026" className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-5" width={96} height={96} />
          <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-primary-foreground mb-3 tracking-tight">
            IF Competition 2026
          </h1>
          <p className="text-primary-foreground/80 text-base md:text-lg max-w-xl mx-auto mb-8">
            Organização de competições esportivas de forma funcional e eficiente.
          </p>
          <Button
            onClick={handleNew}
            size="lg"
            className="gradient-accent text-accent-foreground font-bold text-base px-8 py-5 rounded-full shadow-elevated hover:scale-105 transition-transform"
          >
            Criar Nova Competição <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Saved Competitions */}
      <div className="container mx-auto px-4 py-10">
        <h2 className="font-heading text-xl md:text-2xl font-bold text-center mb-6 text-foreground flex items-center justify-center gap-2">
          <FolderOpen className="w-6 h-6" />
          Competições Salvas
        </h2>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : competitions.length === 0 ? (
          <p className="text-center text-muted-foreground py-6 text-sm">
            Nenhuma competição salva ainda.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
            {competitions.map(c => (
              <button
                key={c.id}
                onClick={() => handleLoad(c.id)}
                className="group text-left p-4 rounded-lg border border-border bg-card hover:border-primary/40 hover:shadow-card transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-semibold text-foreground truncate text-sm">{c.nome || 'Sem nome'}</h3>
                      {c.finalizado && <Badge className="gradient-primary text-primary-foreground text-xs">Finalizado</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.modalidade && <span className="mr-2">{c.modalidade}</span>}
                      {c.data && <span>{c.data}</span>}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(c.id, e)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="font-heading text-xl md:text-2xl font-bold text-center mb-8 text-foreground">
          Como funciona
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => setStep(s.step)}
              className={`group text-center p-4 rounded-lg hover:shadow-card transition-all duration-300 animate-fade-in-up opacity-0 step-delay-${i + 1} bg-card border border-transparent hover:border-primary/20`}
            >
              <div className="w-12 h-12 mx-auto rounded-xl gradient-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <s.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="text-xs font-bold text-primary mb-0.5">ETAPA {s.step}</div>
              <h3 className="font-heading font-semibold text-foreground text-xs md:text-sm mb-0.5">{s.label}</h3>
              <p className="text-xs text-muted-foreground hidden md:block">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Download Guide */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center bg-card rounded-lg p-6 shadow-card border border-border">
          <Download className="w-8 h-8 mx-auto text-primary mb-3" />
          <h3 className="font-heading text-base font-bold text-foreground mb-1">Guia de Execução Local</h3>
          <p className="text-muted-foreground text-xs mb-3">
            Instruções para executar o projeto localmente.
          </p>
          <Button onClick={handleDownloadGuide} size="sm" className="gradient-primary text-primary-foreground">
            <Download className="w-4 h-4 mr-1" /> Baixar Guia
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-muted py-6 text-center text-xs text-muted-foreground">
        <p>IF Competition 2026 — Prof. Marcos Roberto dos Santos</p>
        <p>Professor EBTT – IFTM · Paracatu, MG</p>
      </footer>
    </div>
  );
};

export default HomePage;
