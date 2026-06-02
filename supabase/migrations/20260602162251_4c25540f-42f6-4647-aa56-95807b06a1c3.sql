-- Estender organizer_team_members com todos os campos do cadastro completo
ALTER TABLE public.organizer_team_members
  ADD COLUMN IF NOT EXISTS foto_url text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS rg text,
  ADD COLUMN IF NOT EXISTS campus text,
  ADD COLUMN IF NOT EXISTS instituicao text,
  ADD COLUMN IF NOT EXISTS curso text,
  ADD COLUMN IF NOT EXISTS modalidades text[],
  ADD COLUMN IF NOT EXISTS alergias text,
  ADD COLUMN IF NOT EXISTS tipo_sanguineo text,
  ADD COLUMN IF NOT EXISTS enfermidades text,
  ADD COLUMN IF NOT EXISTS contato_emergencia text,
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS numero_atleta text;

-- Tornar team_id nulo permitido para suportar atletas avulsos importados
ALTER TABLE public.organizer_team_members ALTER COLUMN team_id DROP NOT NULL;

-- Estender profiles com instituição/campus/telefone
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS instituicao text,
  ADD COLUMN IF NOT EXISTS campus text;

-- Tabela de modalidades (admin)
CREATE TABLE IF NOT EXISTS public.sport_modalities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  descricao text,
  unidade text DEFAULT 'pontos',
  max_atletas integer,
  max_equipes integer,
  ativo boolean NOT NULL DEFAULT true,
  regras text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sport_modalities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sport_modalities TO authenticated;
GRANT ALL ON public.sport_modalities TO service_role;
ALTER TABLE public.sport_modalities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view modalities admin" ON public.sport_modalities FOR SELECT USING (true);
CREATE POLICY "Admins manage modalities" ON public.sport_modalities FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- Tabela de locais
CREATE TABLE IF NOT EXISTS public.venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  endereco text,
  capacidade integer,
  disponivel boolean NOT NULL DEFAULT true,
  modalidade_id uuid REFERENCES public.sport_modalities(id) ON DELETE SET NULL,
  modalidade_nome text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.venues TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.venues TO authenticated;
GRANT ALL ON public.venues TO service_role;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view venues" ON public.venues FOR SELECT USING (true);
CREATE POLICY "Admins manage venues" ON public.venues FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- Histórico de impressão de crachás
CREATE TABLE IF NOT EXISTS public.badge_prints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL,
  printed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  segunda_via boolean NOT NULL DEFAULT false,
  evento_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.badge_prints TO authenticated;
GRANT ALL ON public.badge_prints TO service_role;
ALTER TABLE public.badge_prints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view badge prints" ON public.badge_prints FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins insert badge prints" ON public.badge_prints FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- Estender competition_matches com data
ALTER TABLE public.competition_matches
  ADD COLUMN IF NOT EXISTS data text;

-- Trigger updated_at
DROP TRIGGER IF EXISTS sport_modalities_updated_at ON public.sport_modalities;
CREATE TRIGGER sport_modalities_updated_at BEFORE UPDATE ON public.sport_modalities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS venues_updated_at ON public.venues;
CREATE TRIGGER venues_updated_at BEFORE UPDATE ON public.venues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed inicial de modalidades a partir da lista atual
INSERT INTO public.sport_modalities (nome, descricao, unidade) VALUES
  ('FUTSAL','Futebol de salão','gols'),
  ('VÔLEI','Voleibol','sets'),
  ('HANDEBOL','Handebol','gols'),
  ('ARREMESSO DE PESO','Atletismo','metros'),
  ('LANÇAMENTO DE DARDO','Atletismo','metros'),
  ('SALTO EM DISTÂNCIA','Atletismo','metros'),
  ('SALTO EM ALTURA','Atletismo','metros'),
  ('TÊNIS DE MESA','Esporte individual','sets'),
  ('XADREZ','Esporte individual','pontos'),
  ('VÔLEI DE PRAIA','Esporte de areia','sets')
ON CONFLICT (nome) DO NOTHING;