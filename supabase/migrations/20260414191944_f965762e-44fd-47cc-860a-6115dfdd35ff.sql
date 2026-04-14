
-- Competitions main table
CREATE TABLE public.competitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  data TEXT,
  horario TEXT,
  local TEXT,
  modalidade TEXT,
  organizadores TEXT,
  email_organizador TEXT,
  responsavel TEXT,
  email_responsavel TEXT,
  tipo_competidor TEXT CHECK (tipo_competidor IN ('individual', 'coletivo', '')),
  sistema_disputa TEXT CHECK (sistema_disputa IN ('rodizio', 'eliminatorio', 'misto', 'suico', '')),
  modalidade_selecionada TEXT,
  sugestao_manual TEXT,
  logistica_local TEXT,
  logistica_dia TEXT,
  logistica_horario_inicio TEXT,
  espacos_disponiveis INTEGER DEFAULT 1,
  equipe_arbitragem TEXT,
  coordenador_quadra TEXT,
  outros_envolvidos TEXT,
  tempo_total_disponivel FLOAT DEFAULT 300,
  tempo_por_partida FLOAT DEFAULT 20,
  tempo_intervalo FLOAT DEFAULT 5,
  intervalo_refeicao BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Modalities per competition
CREATE TABLE public.competition_modalities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Athletes (individual competitions)
CREATE TABLE public.competition_athletes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  data_nascimento TEXT,
  documento TEXT,
  genero TEXT CHECK (genero IN ('masculino', 'feminino', 'misto', 'outro')),
  codigo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Teams (collective competitions)
CREATE TABLE public.competition_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  genero TEXT CHECK (genero IN ('masculino', 'feminino', 'misto')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Team members
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.competition_teams(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  data_nascimento TEXT,
  documento TEXT,
  genero TEXT CHECK (genero IN ('masculino', 'feminino', 'misto', 'outro')),
  codigo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Matches/games
CREATE TABLE public.competition_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  rodada INTEGER NOT NULL,
  participante_a TEXT NOT NULL,
  participante_b TEXT NOT NULL,
  placar_a INTEGER,
  placar_b INTEGER,
  horario TEXT,
  local TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_modalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_matches ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth required)
CREATE POLICY "Public access" ON public.competitions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.competition_modalities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.competition_athletes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.competition_teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.competition_matches FOR ALL USING (true) WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_competitions_updated_at
  BEFORE UPDATE ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
