import { useCompetition } from '@/context/CompetitionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ListChecks } from 'lucide-react';
import { Modalidade } from '@/types/competition';

const CATEGORIAS_DISPONIVEIS = ['FUTSAL', 'VÔLEI', 'HANDEBOL'];

const Stage2Categories = () => {
  const { state, updateCompetidores, setStep } = useCompetition();
  const selected = state.competidores.modalidades.map(m => m.nome);

  const toggleCategoria = (cat: string) => {
    if (selected.includes(cat)) {
      updateCompetidores({
        modalidades: state.competidores.modalidades.filter(m => m.nome !== cat),
      });
    } else {
      const m: Modalidade = { id: crypto.randomUUID(), nome: cat };
      updateCompetidores({
        modalidades: [...state.competidores.modalidades, m],
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
      <Card className="shadow-card border-0">
        <CardHeader className="gradient-primary rounded-t-lg">
          <CardTitle className="text-primary-foreground flex items-center gap-2">
            <ListChecks className="w-6 h-6" />
            Etapa II — Categorias dos Esportes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <p className="text-muted-foreground text-sm">
            Selecione todas as modalidades esportivas que serão realizadas neste evento.
          </p>

          <div className="space-y-4">
            {CATEGORIAS_DISPONIVEIS.map(cat => (
              <label
                key={cat}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${selected.includes(cat) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}
                `}
              >
                <Checkbox
                  checked={selected.includes(cat)}
                  onCheckedChange={() => toggleCategoria(cat)}
                />
                <div>
                  <div className="font-semibold text-lg">{cat}</div>
                  <div className="text-sm text-muted-foreground">
                    {cat === 'FUTSAL' && 'Futebol de salão — equipes de 5 jogadores'}
                    {cat === 'VÔLEI' && 'Voleibol — equipes de 6 jogadores'}
                    {cat === 'HANDEBOL' && 'Handebol — equipes de 7 jogadores'}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {selected.length === 0 && (
            <p className="text-sm text-destructive">Selecione pelo menos uma modalidade para continuar.</p>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={selected.length === 0}
              className="gradient-primary text-primary-foreground px-8"
            >
              Próximo →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Stage2Categories;
