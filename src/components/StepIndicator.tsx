import { useCompetition } from '@/context/CompetitionContext';
import { Check } from 'lucide-react';

const steps = [
  { label: 'Evento' },
  { label: 'Categorias' },
  { label: 'Equipes' },
  { label: 'Disputa' },
  { label: 'Logística' },
  { label: 'Resumo' },
];

const StepIndicator = () => {
  const { state, setStep } = useCompetition();
  const current = state.currentStep;

  return (
    <div className="border-b border-border bg-card/40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {steps.map((step, i) => {
            const idx = i + 1;
            const done = current > idx;
            const active = current === idx;
            return (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => setStep(idx)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                      ${active ? 'bg-primary text-primary-foreground shadow-elevated scale-110' : ''}
                      ${done ? 'bg-primary/15 text-primary' : ''}
                      ${!active && !done ? 'bg-muted text-muted-foreground group-hover:bg-muted/70' : ''}
                    `}
                  >
                    {done ? <Check className="w-4 h-4" /> : idx}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                </button>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-2 transition-colors ${done ? 'bg-primary/40' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StepIndicator;
