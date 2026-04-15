import { useCompetition } from '@/context/CompetitionContext';
import { CheckCircle2, Circle } from 'lucide-react';

const steps = [
  { label: 'Evento', desc: 'Cadastro geral' },
  { label: 'Categorias', desc: 'Modalidades esportivas' },
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
            className={`flex items-center gap-2 px-2 md:px-3 py-2 rounded-lg transition-all duration-300 text-xs md:text-sm
              ${current === i + 1 ? 'gradient-primary text-primary-foreground shadow-elevated scale-105' : ''}
              ${current > i + 1 ? 'bg-primary/10 text-primary' : ''}
              ${current < i + 1 ? 'bg-muted text-muted-foreground' : ''}
              hover:scale-105
            `}
          >
            {current > i + 1 ? (
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
            ) : (
              <Circle className={`w-4 h-4 md:w-5 md:h-5 ${current === i + 1 ? 'fill-current' : ''}`} />
            )}
            <div className="hidden lg:block text-left">
              <div className="font-semibold leading-tight">{step.label}</div>
              <div className="text-xs opacity-75">{step.desc}</div>
            </div>
            <span className="lg:hidden font-semibold">{i + 1}</span>
          </button>
          {i < steps.length - 1 && (
            <div className={`w-4 md:w-8 h-0.5 mx-0.5 md:mx-1 transition-colors ${current > i + 1 ? 'bg-primary' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  );
};

export default StepIndicator;
