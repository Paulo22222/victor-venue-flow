import { useCompetition } from '@/context/CompetitionContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, MapPin, Users, Mail } from 'lucide-react';

const Stage1Event = () => {
  const { state, updateEvento, setStep } = useCompetition();
  const e = state.evento;

  const handleNext = () => {
    if (!e.nome || !e.data) return;
    setStep(2);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <Card className="shadow-card border-0">
        <CardHeader className="gradient-primary rounded-t-lg">
          <CardTitle className="text-primary-foreground flex items-center gap-2">
            <CalendarDays className="w-6 h-6" />
            Etapa I — Cadastro do Evento
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="nome">Nome do Evento / Competição *</Label>
              <Input id="nome" value={e.nome} onChange={ev => updateEvento({ nome: ev.target.value })} placeholder="Ex: Jogos Internos IFTM 2026" />
            </div>
            <div>
              <Label htmlFor="data">Data *</Label>
              <Input id="data" type="date" value={e.data} onChange={ev => updateEvento({ data: ev.target.value })} />
            </div>
            <div>
              <Label htmlFor="horario">Horário</Label>
              <Input id="horario" type="time" value={e.horario} onChange={ev => updateEvento({ horario: ev.target.value })} />
            </div>
            <div>
              <Label htmlFor="local" className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Local</Label>
              <Input id="local" value={e.local} onChange={ev => updateEvento({ local: ev.target.value })} placeholder="Ex: Ginásio Poliesportivo" />
            </div>
            <div>
              <Label htmlFor="modalidade">Modalidade</Label>
              <Input id="modalidade" value={e.modalidade} onChange={ev => updateEvento({ modalidade: ev.target.value })} placeholder="Ex: Futsal, Vôlei, Xadrez" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="org" className="flex items-center gap-1"><Users className="w-3 h-3" /> Organizador(es)</Label>
              <Input id="org" value={e.organizadores} onChange={ev => updateEvento({ organizadores: ev.target.value })} />
            </div>
            <div>
              <Label htmlFor="emailOrg" className="flex items-center gap-1"><Mail className="w-3 h-3" /> E-mail (Organizador)</Label>
              <Input id="emailOrg" type="email" value={e.emailOrganizador} onChange={ev => updateEvento({ emailOrganizador: ev.target.value })} />
            </div>
            <div>
              <Label htmlFor="resp">Responsável pelo Cadastro</Label>
              <Input id="resp" value={e.responsavel} onChange={ev => updateEvento({ responsavel: ev.target.value })} />
            </div>
            <div>
              <Label htmlFor="emailResp" className="flex items-center gap-1"><Mail className="w-3 h-3" /> E-mail (Responsável)</Label>
              <Input id="emailResp" type="email" value={e.emailResponsavel} onChange={ev => updateEvento({ emailResponsavel: ev.target.value })} />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleNext} className="gradient-primary text-primary-foreground px-8">
              Próximo →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Stage1Event;
