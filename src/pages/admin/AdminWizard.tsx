import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useCompetition } from '@/context/CompetitionContext';
import { Button } from '@/components/ui/button';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import StepIndicator from '@/components/StepIndicator';
import Stage1Event from '@/components/stages/Stage1Event';
import Stage2Categories from '@/components/stages/Stage2Categories';
import Stage3Teams from '@/components/stages/Stage3Teams';
import Stage4Dispute from '@/components/stages/Stage4Dispute';
import Stage5Logistics from '@/components/stages/Stage5Logistics';
import Stage6Summary from '@/components/stages/Stage6Summary';

const AdminWizard = () => {
  const { state, save, saving, setStep, load, competitionId, resetState } = useCompetition();
  const [params] = useSearchParams();
  const idParam = params.get('id');
  const loadedRef = useRef<string | null>(null);

  useEffect(() => {
    if (idParam) {
      if (loadedRef.current !== idParam && competitionId !== idParam) {
        loadedRef.current = idParam;
        load(idParam).then(() => setStep(6));
      }
    } else {
      // No id param: if no current competition, ensure clean state
      if (!competitionId && state.currentStep === 0) {
        // nothing
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam]);

  return (
    <div className="min-h-full bg-background">
      <div className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-[5]">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <Link to="/admin/events">
            <Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="w-4 h-4" /> Eventos</Button>
          </Link>
          <Button onClick={save} disabled={saving} size="sm" className="gradient-primary text-primary-foreground gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </Button>
        </div>
      </div>
      {state.currentStep === 0 && (
        <div className="container mx-auto p-6 text-center">
          <p className="text-muted-foreground mb-3">Comece um novo cadastro.</p>
          <Button onClick={() => setStep(1)} className="gradient-primary text-primary-foreground">Iniciar</Button>
        </div>
      )}
      {state.currentStep > 0 && <StepIndicator />}
      <main className="container mx-auto px-4 pb-12">
        {state.currentStep === 1 && <Stage1Event />}
        {state.currentStep === 2 && <Stage2Categories />}
        {state.currentStep === 3 && <Stage3Teams />}
        {state.currentStep === 4 && <Stage4Dispute />}
        {state.currentStep === 5 && <Stage5Logistics />}
        {state.currentStep === 6 && <Stage6Summary />}
      </main>
    </div>
  );
};

export default AdminWizard;
