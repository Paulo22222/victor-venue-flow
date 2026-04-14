import { CompetitionProvider, useCompetition } from '@/context/CompetitionContext';
import HomePage from '@/components/HomePage';
import StepIndicator from '@/components/StepIndicator';
import Stage1Event from '@/components/stages/Stage1Event';
import Stage2Competitors from '@/components/stages/Stage2Competitors';
import Stage3Dispute from '@/components/stages/Stage3Dispute';
import Stage4Logistics from '@/components/stages/Stage4Logistics';
import Stage5Reports from '@/components/stages/Stage5Reports';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import logo from '@/assets/logo.png';

const CompetitionApp = () => {
  const { state, setStep, save, saving, resetState } = useCompetition();

  if (state.currentStep === 0) return <HomePage />;

  const handleHome = () => {
    resetState();
    setStep(0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="gradient-hero py-3 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <button onClick={handleHome} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={logo} alt="IF Competition" className="w-8 h-8" width={32} height={32} />
            <span className="font-heading font-bold text-primary-foreground text-lg hidden sm:inline">IF Competition 2026</span>
          </button>
          <Button
            onClick={save}
            disabled={saving}
            variant="secondary"
            size="sm"
            className="gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </Button>
        </div>
      </header>

      <StepIndicator />

      <main className="container mx-auto px-4 pb-16">
        {state.currentStep === 1 && <Stage1Event />}
        {state.currentStep === 2 && <Stage2Competitors />}
        {state.currentStep === 3 && <Stage3Dispute />}
        {state.currentStep === 4 && <Stage4Logistics />}
        {state.currentStep === 5 && <Stage5Reports />}
      </main>
    </div>
  );
};

const Index = () => (
  <CompetitionProvider>
    <CompetitionApp />
  </CompetitionProvider>
);

export default Index;
