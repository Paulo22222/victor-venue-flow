import { useCompetition } from '@/context/CompetitionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, ListChecks, Check } from 'lucide-react';
import { Modalidade } from '@/types/competition';
import { SPORT_RULES } from '@/utils/sportRules';

const CATEGORIAS = [
  { id: 'FUTSAL', desc: 'Futebol de salão', emoji: '⚽' },
  { id: 'VÔLEI', desc: 'Voleibol', emoji: '🏐' },
  { id: 'HANDEBOL', desc: 'Handebol', emoji: '🤾' },
];

const Stage2Categories = () => {
  const { state, updateCompetidores, setStep } = useCompetition();
  const selected = state.competidores.modalidades.map(m => m.nome);

  const toggle = (cat: string) => {
    if (selected.includes(cat)) {
      updateCompetidores({
        modalidades: state.competidores.modalidades.filter(m => m.nome !== cat),
      });
    } else {
      const m: Modalidade = { id: crypto.randomUUID(), nome: cat };
      updateCompetidores({ modalidades: [...state.competidores.modalidades, m] });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up py-6">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
          <ListChecks className="w-4 h-4" /> Etapa 2 de 6
        </div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold">Categorias do evento</h1>
        <p className="text-muted-foreground mt-1">Selecione as modalidades esportivas que serão disputadas.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CATEGORIAS.map(cat => {
          const isSel = selected.includes(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => toggle(cat.id)}
              className={`relative text-left p-5 rounded-xl border-2 transition-all
                ${isSel ? 'border-primary bg-primary/5 shadow-card' : 'border-border bg-card hover:border-primary/30'}
              `}
            >
              {isSel && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="text-3xl mb-2">{cat.emoji}</div>
              <div className="font-heading font-semibold text-lg">{cat.id}</div>
              <div className="text-xs text-muted-foreground">{cat.desc}</div>
            </button>
          );
        })}
      </div>

      <Card className="border-border bg-muted/30">
        <CardContent className="p-4 text-sm">
          <span className="font-semibold">{selected.length}</span> modalidade(s) selecionada(s)
          {selected.length > 0 && <span className="text-muted-foreground"> — {selected.join(', ')}</span>}
        </CardContent>
      </Card>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Button>
        <Button
          onClick={() => setStep(3)}
          disabled={selected.length === 0}
          className="gradient-primary text-primary-foreground gap-2 px-8"
        >
          Continuar <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Stage2Categories;
