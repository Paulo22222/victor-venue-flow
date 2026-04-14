import { useCompetition } from '@/context/CompetitionContext';
import { CheckCircle2, Circle } from 'lucide-react';

const steps = [
  { label: 'Evento', desc: 'Cadastro geral' },
  { label: 'Competidores', desc: 'Atletas e equipes' },
  { label: 'Disputas', desc: 'Sistema de jogos' },
  { label: 'Logística', desc: 'Locais e horários' },
  { label: 'Relatórios', desc: 'Resultados finais' },
];

const StepIndicator = () => {
  const { state, setStep } = useCompetition();
  const current = state.currentStep;

  return (
    <div className="flex items-center justify-center gap-1 md:gap-2 py-6 px-4 overflow-x-auto">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center">
          <button
            onClick={() => setStep(i + 1)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 text-sm md:text-base
              ${current === i + 1 ? 'gradient-primary text-primary-foreground shadow-elevated scale-105' : ''}
              ${current > i + 1 ? 'bg-primary/10 text-primary' : ''}
              ${current < i + 1 ? 'bg-muted text-muted-foreground' : ''}
              hover:scale-105
            `}
          >
            {current > i + 1 ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Circle className={`w-5 h-5 ${current === i + 1 ? 'fill-current' : ''}`} />
            )}
            <div className="hidden md:block text-left">
              <div className="font-semibold leading-tight">{step.label}</div>
              <div className="text-xs opacity-75">{step.desc}</div>
            </div>
            <span className="md:hidden font-semibold">{i + 1}</span>
          </button>
          {i < steps.length - 1 && (
            <div className={`w-6 md:w-10 h-0.5 mx-1 transition-colors ${current > i + 1 ? 'bg-primary' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  );
};

export default StepIndicator;
