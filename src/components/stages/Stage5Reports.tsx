import { useCompetition } from '@/context/CompetitionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, ChevronLeft, Download, Trophy, CheckCircle2 } from 'lucide-react';
import { generateCompetitionPDF } from '@/utils/pdfGenerator';

const Stage5Reports = () => {
  const { state, updateResultado, setStep, finalize, saving } = useCompetition();
  const { evento, competidores, jogos, resultados, disputa, logistica } = state;

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

  const handleFinalize = () => {
    if (!confirm('Tem certeza que deseja finalizar este evento? Os resultados ficarão visíveis para todos os usuários.')) return;
    finalize();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <Card className="border-0 shadow-card">
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

          {state.finalizado && (
            <div className="mt-4 flex items-center gap-2 text-success bg-success/10 rounded-lg p-3">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">Evento finalizado — resultados publicados.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados dos jogos */}
      {jogos.length > 0 && (
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" /> Resultados dos Jogos
            </CardTitle>
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
                            disabled={state.finalizado}
                          />
                        </td>
                        <td className="p-2 font-medium">{j.participanteB}</td>
                        <td className="p-2 text-center">
                          <Input
                            type="number" min={0} className="w-16 h-8 text-center mx-auto"
                            value={r?.placarB ?? ''}
                            onChange={e => updateResultado(j.id, r?.placarA || 0, parseInt(e.target.value) || 0)}
                            disabled={state.finalizado}
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
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" /> Classificação
            </CardTitle>
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

      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <Button variant="outline" onClick={() => setStep(4)}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <div className="flex gap-3">
          <Button onClick={() => generateCompetitionPDF(state)} variant="outline">
            <Download className="w-4 h-4 mr-2" /> Exportar PDF
          </Button>
          {!state.finalizado && (
            <Button onClick={handleFinalize} disabled={saving} className="bg-success text-success-foreground hover:bg-success/90">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Finalizar Evento
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stage5Reports;
