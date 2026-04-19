import { useCompetition } from '@/context/CompetitionContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';

const Stage5Logistics = () => {
  const { state, updateLogistica, setStep } = useCompetition();
  const log = state.logistica;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up py-6">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
          <MapPin className="w-4 h-4" /> Etapa 5 de 6
        </div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold">Logística do evento</h1>
        <p className="text-muted-foreground mt-1">Informe local, datas e responsáveis.</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-5">
          <div>
            <Label>Local da competição</Label>
            <Input value={log.local} onChange={e => updateLogistica({ local: e.target.value })} placeholder="Ex: Ginásio Poliesportivo" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Dia</Label>
              <Input type="date" value={log.dia} onChange={e => updateLogistica({ dia: e.target.value })} />
            </div>
            <div>
              <Label className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Horário de início</Label>
              <Input type="time" value={log.horarioInicio} onChange={e => updateLogistica({ horarioInicio: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Equipe de arbitragem</Label>
              <Input value={log.equipeArbitragem} onChange={e => updateLogistica({ equipeArbitragem: e.target.value })} placeholder="Nomes dos árbitros" />
            </div>
            <div>
              <Label>Coordenador de quadra</Label>
              <Input value={log.coordenadorQuadra} onChange={e => updateLogistica({ coordenadorQuadra: e.target.value })} />
            </div>
          </div>

          <div>
            <Label>Outros envolvidos (opcional)</Label>
            <Input value={log.outrosEnvolvidos} onChange={e => updateLogistica({ outrosEnvolvidos: e.target.value })} placeholder="Mesa, áudio, fotografia..." />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => setStep(4)} className="gap-2">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Button>
        <Button onClick={() => setStep(6)} className="gradient-primary text-primary-foreground gap-2 px-8">
          Continuar <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Stage5Logistics;
