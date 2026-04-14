import { useState } from 'react';
import { useCompetition } from '@/context/CompetitionContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Trash2, Plus, ChevronLeft } from 'lucide-react';
import { Atleta, Equipe, Modalidade } from '@/types/competition';

const Stage2Competitors = () => {
  const { state, updateCompetidores, setStep } = useCompetition();
  const comp = state.competidores;
  const [novaModalidade, setNovaModalidade] = useState('');
  const [novoAtleta, setNovoAtleta] = useState<Partial<Atleta>>({ nome: '', genero: 'masculino', codigo: '' });
  const [novaEquipe, setNovaEquipe] = useState('');
  const [equipeGenero, setEquipeGenero] = useState<'masculino' | 'feminino' | 'misto'>('masculino');
  const [equipeAtiva, setEquipeAtiva] = useState<string | null>(null);
  const [novoIntegrante, setNovoIntegrante] = useState<Partial<Atleta>>({ nome: '', genero: 'masculino', codigo: '' });

  const addModalidade = () => {
    if (!novaModalidade.trim()) return;
    const m: Modalidade = { id: crypto.randomUUID(), nome: novaModalidade.trim() };
    updateCompetidores({ modalidades: [...comp.modalidades, m] });
    setNovaModalidade('');
  };

  const removeModalidade = (id: string) => {
    updateCompetidores({ modalidades: comp.modalidades.filter(m => m.id !== id) });
  };

  const addAtleta = () => {
    if (!novoAtleta.nome?.trim()) return;
    const a: Atleta = {
      id: crypto.randomUUID(),
      nome: novoAtleta.nome!,
      dataNascimento: '',
      documento: '',
      genero: novoAtleta.genero as Atleta['genero'],
      codigo: novoAtleta.codigo || undefined,
    };
    updateCompetidores({ atletas: [...comp.atletas, a] });
    setNovoAtleta({ nome: '', genero: 'masculino', codigo: '' });
  };

  const removeAtleta = (id: string) => {
    updateCompetidores({ atletas: comp.atletas.filter(a => a.id !== id) });
  };

  const addEquipe = () => {
    if (!novaEquipe.trim()) return;
    const eq: Equipe = { id: crypto.randomUUID(), nome: novaEquipe.trim(), genero: equipeGenero, integrantes: [] };
    updateCompetidores({ equipes: [...comp.equipes, eq] });
    setNovaEquipe('');
  };

  const removeEquipe = (id: string) => {
    updateCompetidores({ equipes: comp.equipes.filter(e => e.id !== id) });
    if (equipeAtiva === id) setEquipeAtiva(null);
  };

  const addIntegrante = () => {
    if (!equipeAtiva || !novoIntegrante.nome?.trim()) return;
    const integ: Atleta = {
      id: crypto.randomUUID(),
      nome: novoIntegrante.nome!,
      dataNascimento: '',
      documento: '',
      genero: novoIntegrante.genero as Atleta['genero'],
      codigo: novoIntegrante.codigo || undefined,
    };
    const equipes = comp.equipes.map(eq =>
      eq.id === equipeAtiva ? { ...eq, integrantes: [...eq.integrantes, integ] } : eq
    );
    updateCompetidores({ equipes });
    setNovoIntegrante({ nome: '', genero: 'masculino', codigo: '' });
  };

  const removeIntegrante = (equipeId: string, atletaId: string) => {
    const equipes = comp.equipes.map(eq =>
      eq.id === equipeId ? { ...eq, integrantes: eq.integrantes.filter(i => i.id !== atletaId) } : eq
    );
    updateCompetidores({ equipes });
  };

  const canProceed = comp.modalidades.length > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      <Card className="shadow-card border-0">
        <CardHeader className="gradient-primary rounded-t-lg">
          <CardTitle className="text-primary-foreground flex items-center gap-2">
            <Users className="w-6 h-6" />
            Etapa II — Cadastro dos Competidores
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Tipo de competição */}
          <div>
            <Label>Tipo de Competição</Label>
            <div className="flex gap-3 mt-2">
              <Button variant={comp.tipo === 'individual' ? 'default' : 'outline'} onClick={() => updateCompetidores({ tipo: 'individual' })} className={comp.tipo === 'individual' ? 'gradient-primary text-primary-foreground' : ''}>
                Individual
              </Button>
              <Button variant={comp.tipo === 'coletivo' ? 'default' : 'outline'} onClick={() => updateCompetidores({ tipo: 'coletivo' })} className={comp.tipo === 'coletivo' ? 'gradient-primary text-primary-foreground' : ''}>
                Coletivo
              </Button>
            </div>
          </div>

          {/* Modalidades (obrigatório) */}
          <div>
            <Label>Modalidades / Atividades <span className="text-destructive">*</span></Label>
            <div className="flex gap-2 mt-2">
              <Input value={novaModalidade} onChange={e => setNovaModalidade(e.target.value)} placeholder="Ex: Futsal" onKeyDown={e => e.key === 'Enter' && addModalidade()} />
              <Button onClick={addModalidade} size="icon" className="gradient-primary text-primary-foreground shrink-0"><Plus className="w-4 h-4" /></Button>
            </div>
            {comp.modalidades.length === 0 && (
              <p className="text-sm text-destructive mt-1">Adicione pelo menos uma modalidade para continuar.</p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {comp.modalidades.map(m => (
                <Badge key={m.id} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                  {m.nome}
                  <button onClick={() => removeModalidade(m.id)} className="ml-1 hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
          </div>

          {/* INDIVIDUAL */}
          {comp.tipo === 'individual' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-heading font-semibold text-lg flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" /> Cadastro de Atletas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input placeholder="Nome do atleta *" value={novoAtleta.nome} onChange={e => setNovoAtleta({ ...novoAtleta, nome: e.target.value })} />
                <Select value={novoAtleta.genero} onValueChange={v => setNovoAtleta({ ...novoAtleta, genero: v as Atleta['genero'] })}>
                  <SelectTrigger><SelectValue placeholder="Gênero" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="misto">Misto</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Código da Matrícula (opcional)" value={novoAtleta.codigo} onChange={e => setNovoAtleta({ ...novoAtleta, codigo: e.target.value })} />
              </div>
              <Button onClick={addAtleta} className="gradient-primary text-primary-foreground"><UserPlus className="w-4 h-4 mr-2" /> Adicionar Atleta</Button>

              {comp.atletas.length > 0 && (
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 font-semibold">Nome</th>
                        <th className="text-left p-3 font-semibold">Gênero</th>
                        <th className="text-left p-3 font-semibold hidden md:table-cell">Matrícula</th>
                        <th className="p-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {comp.atletas.map(a => (
                        <tr key={a.id} className="border-t hover:bg-muted/50">
                          <td className="p-3">{a.nome}</td>
                          <td className="p-3 capitalize">{a.genero}</td>
                          <td className="p-3 hidden md:table-cell">{a.codigo || '—'}</td>
                          <td className="p-3"><button onClick={() => removeAtleta(a.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="w-4 h-4" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-muted-foreground text-sm">{comp.atletas.length} atleta(s) cadastrado(s)</p>
            </div>
          )}

          {/* COLETIVO */}
          {comp.tipo === 'coletivo' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-heading font-semibold text-lg flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Cadastro de Equipes</h3>
              <div className="flex gap-2">
                <Input placeholder="Nome da equipe" value={novaEquipe} onChange={e => setNovaEquipe(e.target.value)} />
                <Select value={equipeGenero} onValueChange={v => setEquipeGenero(v as 'masculino' | 'feminino' | 'misto')}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="misto">Misto</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addEquipe} className="gradient-primary text-primary-foreground shrink-0"><Plus className="w-4 h-4" /></Button>
              </div>

              <div className="space-y-3">
                {comp.equipes.map(eq => (
                  <Card key={eq.id} className={`border transition-all ${equipeAtiva === eq.id ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button onClick={() => setEquipeAtiva(equipeAtiva === eq.id ? null : eq.id)} className="font-semibold text-primary hover:underline">{eq.nome}</button>
                          <Badge variant="outline" className="capitalize">{eq.genero}</Badge>
                          <span className="text-muted-foreground text-sm">{eq.integrantes.length} integrante(s)</span>
                        </div>
                        <button onClick={() => removeEquipe(eq.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </div>

                      {equipeAtiva === eq.id && (
                        <div className="mt-4 space-y-3 animate-fade-in-up">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <Input placeholder="Nome *" value={novoIntegrante.nome} onChange={e => setNovoIntegrante({ ...novoIntegrante, nome: e.target.value })} />
                            <Select value={novoIntegrante.genero} onValueChange={v => setNovoIntegrante({ ...novoIntegrante, genero: v as Atleta['genero'] })}>
                              <SelectTrigger><SelectValue placeholder="Gênero" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="masculino">Masculino</SelectItem>
                                <SelectItem value="feminino">Feminino</SelectItem>
                                <SelectItem value="misto">Misto</SelectItem>
                                <SelectItem value="outro">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input placeholder="Matrícula (opcional)" value={novoIntegrante.codigo} onChange={e => setNovoIntegrante({ ...novoIntegrante, codigo: e.target.value })} />
                          </div>
                          <Button size="sm" onClick={addIntegrante} className="gradient-primary text-primary-foreground"><UserPlus className="w-3 h-3 mr-1" /> Adicionar</Button>
                          {eq.integrantes.length > 0 && (
                            <ul className="space-y-1 text-sm">
                              {eq.integrantes.map(i => (
                                <li key={i.id} className="flex items-center justify-between bg-muted rounded px-3 py-1.5">
                                  <span>{i.nome} <span className="text-muted-foreground capitalize">({i.genero})</span> {i.codigo && <span className="text-muted-foreground">· {i.codigo}</span>}</span>
                                  <button onClick={() => removeIntegrante(eq.id, i.id)} className="text-destructive"><Trash2 className="w-3 h-3" /></button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-muted-foreground text-sm">{comp.equipes.length} equipe(s) cadastrada(s)</p>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(1)}><ChevronLeft className="w-4 h-4 mr-1" /> Voltar</Button>
            <Button onClick={() => setStep(3)} disabled={!canProceed} className="gradient-primary text-primary-foreground px-8">Próximo →</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Stage2Competitors;
