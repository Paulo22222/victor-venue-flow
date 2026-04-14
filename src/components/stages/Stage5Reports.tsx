import { useCompetition } from '@/context/CompetitionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, ChevronLeft, Printer, Trophy } from 'lucide-react';

const Stage5Reports = () => {
  const { state, updateResultado, setStep } = useCompetition();
  const { evento, competidores, jogos, resultados, logistica, disputa } = state;

  const handlePrint = () => window.print();

  // Classificação simples baseada em vitórias
  const classificacao = () => {
    const pontos: Record<string, number> = {};
    const nomes = competidores.tipo === 'individual'
      ? competidores.atletas.map(a => a.nome)
      : competidores.equipes.map(e => e.nome);
    nomes.forEach(n => (pontos[n] = 0));
    jogos.forEach(j => {
      const r = resultados[j.id];
      if (r) {
        if (r.placarA > r.placarB) pontos[j.participanteA] = (pontos[j.participanteA] || 0) + 3;
        else if (r.placarB > r.placarA) pontos[j.participanteB] = (pontos[j.participanteB] || 0) + 3;
        else {
          pontos[j.participanteA] = (pontos[j.participanteA] || 0) + 1;
          pontos[j.participanteB] = (pontos[j.participanteB] || 0) + 1;
        }
      }
    });
    return Object.entries(pontos).sort((a, b) => b[1] - a[1]);
  };

  const ranking = classificacao();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <Card className="shadow-card border-0">
        <CardHeader className="gradient-primary rounded-t-lg">
          <CardTitle className="text-primary-foreground flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Etapa V — Relatórios e Boletins
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-muted rounded-lg p-4 text-sm space-y-1">
            <p><strong>Evento:</strong> {evento.nome || '—'}</p>
            <p><strong>Data:</strong> {evento.data || '—'} às {evento.horario || '—'}</p>
            <p><strong>Local:</strong> {evento.local || logistica.local || '—'}</p>
            <p><strong>Organizador(es):</strong> {evento.organizadores || '—'}</p>
            <p><strong>Sistema:</strong> {disputa.sistema || '—'} | <strong>Tipo:</strong> {competidores.tipo || '—'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Resultados dos jogos */}
      {jogos.length > 0 && (
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Trophy className="w-5 h-5 text-accent" /> Resultados dos Jogos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Rd</th>
                    <th className="p-2 text-left">Participante A</th>
                    <th className="p-2 text-center">Placar</th>
                    <th className="p-2 text-left">Participante B</th>
                    <th className="p-2 text-center">Placar</th>
                  </tr>
                </thead>
                <tbody>
                  {jogos.map(j => {
                    const r = resultados[j.id];
                    return (
                      <tr key={j.id} className="border-t hover:bg-muted/50">
                        <td className="p-2"><Badge variant="outline">{j.rodada}</Badge></td>
                        <td className="p-2 font-medium">{j.participanteA}</td>
                        <td className="p-2 text-center">
                          <Input
                            type="number" min={0} className="w-16 h-8 text-center mx-auto"
                            value={r?.placarA ?? ''}
                            onChange={e => updateResultado(j.id, parseInt(e.target.value) || 0, r?.placarB || 0)}
                          />
                        </td>
                        <td className="p-2 font-medium">{j.participanteB}</td>
                        <td className="p-2 text-center">
                          <Input
                            type="number" min={0} className="w-16 h-8 text-center mx-auto"
                            value={r?.placarB ?? ''}
                            onChange={e => updateResultado(j.id, r?.placarA || 0, parseInt(e.target.value) || 0)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Classificação */}
      {ranking.length > 0 && (
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" /> Classificação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left">Pos.</th>
                    <th className="p-3 text-left">Participante</th>
                    <th className="p-3 text-center">Pontos</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map(([nome, pts], i) => (
                    <tr key={nome} className={`border-t ${i < 3 ? 'font-semibold' : ''}`}>
                      <td className="p-3">
                        {i === 0 && '🥇'}
                        {i === 1 && '🥈'}
                        {i === 2 && '🥉'}
                        {i > 2 && `${i + 1}º`}
                      </td>
                      <td className="p-3">{nome}</td>
                      <td className="p-3 text-center">{pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(4)}><ChevronLeft className="w-4 h-4 mr-1" /> Voltar</Button>
        <Button onClick={handlePrint} className="gradient-primary text-primary-foreground">
          <Printer className="w-4 h-4 mr-2" /> Imprimir Relatório
        </Button>
      </div>
    </div>
  );
};

export default Stage5Reports;
