import { useCompetition } from '@/context/CompetitionContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { MapPin, Clock, ChevronLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { calcCapacidadeMaxima } from '@/utils/disputeCalculations';

const Stage4Logistics = () => {
  const { state, updateLogistica, setStep } = useCompetition();
  const log = state.logistica;

  const jMax = calcCapacidadeMaxima(log.tempoTotalDisponivel, log.tempoPorPartida, log.tempoIntervalo, log.espacosDisponiveis);
  const jogosNecessarios = state.jogos.length;
  const capacidadeSuficiente = jMax >= jogosNecessarios;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <Card className="shadow-card border-0">
        <CardHeader className="gradient-primary rounded-t-lg">
          <CardTitle className="text-primary-foreground flex items-center gap-2">
            <MapPin className="w-6 h-6" />
            Etapa V — Logística e Programação
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Local da Competição</Label>
              <Input value={log.local} onChange={e => updateLogistica({ local: e.target.value })} placeholder="Ex: Ginásio Poliesportivo" />
            </div>
            <div>
              <Label>Dia da Competição</Label>
              <Input type="date" value={log.dia} onChange={e => updateLogistica({ dia: e.target.value })} />
            </div>
            <div>
              <Label>Horário de Início</Label>
              <Input type="time" value={log.horarioInicio} onChange={e => updateLogistica({ horarioInicio: e.target.value })} />
            </div>
            <div>
              <Label>Espaços Disponíveis (quadras, mesas, raias...)</Label>
              <Input type="number" min={1} value={log.espacosDisponiveis} onChange={e => updateLogistica({ espacosDisponiveis: parseInt(e.target.value) || 1 })} />
            </div>
            <div>
              <Label>Equipe de Arbitragem</Label>
              <Input value={log.equipeArbitragem} onChange={e => updateLogistica({ equipeArbitragem: e.target.value })} />
            </div>
            <div>
              <Label>Coordenador de Quadra</Label>
              <Input value={log.coordenadorQuadra} onChange={e => updateLogistica({ coordenadorQuadra: e.target.value })} />
            </div>
            <div>
              <Label>Outros Envolvidos</Label>
              <Input value={log.outrosEnvolvidos} onChange={e => updateLogistica({ outrosEnvolvidos: e.target.value })} />
            </div>
          </div>

          <div className="border-t pt-5">
            <h3 className="font-heading font-semibold flex items-center gap-2 mb-4"><Clock className="w-5 h-5 text-primary" /> Tempo e Intervalos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Tempo Total Disponível (min)</Label>
                <Input type="number" value={log.tempoTotalDisponivel} onChange={e => updateLogistica({ tempoTotalDisponivel: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Tempo por Partida (min)</Label>
                <Input type="number" value={log.tempoPorPartida} onChange={e => updateLogistica({ tempoPorPartida: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Intervalo entre Partidas (min)</Label>
                <Input type="number" value={log.tempoIntervalo} onChange={e => updateLogistica({ tempoIntervalo: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <Switch checked={log.intervaloRefeicao} onCheckedChange={v => updateLogistica({ intervaloRefeicao: v })} />
              <Label>Intervalo para refeição (até 1 hora)</Label>
            </div>
          </div>

          {/* Capacidade */}
          <Card className={`${capacidadeSuficiente ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {capacidadeSuficiente ? <CheckCircle2 className="w-6 h-6 text-success" /> : <AlertTriangle className="w-6 h-6 text-destructive" />}
                <div>
                  <div className="font-semibold">
                    Capacidade Máxima: {jMax} jogos | Necessários: {jogosNecessarios} jogos
                  </div>
                  <div className="text-sm text-muted-foreground">
                    J_max = ({log.tempoTotalDisponivel} ÷ ({log.tempoPorPartida} + {log.tempoIntervalo})) × {log.espacosDisponiveis} = {jMax}
                  </div>
                  {!capacidadeSuficiente && jogosNecessarios > 0 && (
                    <p className="text-sm text-destructive mt-1">
                      ⚠ Capacidade insuficiente. Considere: mudar o formato, reduzir participantes ou aumentar espaços/tempo.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(4)}><ChevronLeft className="w-4 h-4 mr-1" /> Voltar</Button>
            <Button onClick={() => setStep(6)} className="gradient-primary text-primary-foreground px-8">Próximo →</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Stage4Logistics;
