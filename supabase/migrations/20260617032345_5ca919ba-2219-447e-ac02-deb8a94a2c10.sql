
-- 1) venue_id em competitions
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES public.venues(id) ON DELETE SET NULL;

-- 2) manual em competition_matches
ALTER TABLE public.competition_matches ADD COLUMN IF NOT EXISTS manual boolean NOT NULL DEFAULT false;

-- 3) owner_id em competitions
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS owner_id uuid;
CREATE INDEX IF NOT EXISTS idx_competitions_owner ON public.competitions(owner_id);

-- Atualizar política SELECT do admin/autenticado para escopar por owner_id (admins veem apenas os próprios eventos OU eventos sem dono)
DROP POLICY IF EXISTS "Authenticated can view competitions" ON public.competitions;
CREATE POLICY "Authenticated can view own competitions"
  ON public.competitions FOR SELECT
  TO authenticated
  USING (owner_id IS NULL OR owner_id = auth.uid() OR has_role(auth.uid(), 'organizer'::app_role));

-- 4) organizer_teams: campos extras
ALTER TABLE public.organizer_teams ADD COLUMN IF NOT EXISTS responsavel text;
ALTER TABLE public.organizer_teams ADD COLUMN IF NOT EXISTS contato text;

-- Permitir admin gerenciar organizer_teams/members (para edição global)
DROP POLICY IF EXISTS "Admins manage all organizer teams" ON public.organizer_teams;
CREATE POLICY "Admins manage all organizer teams"
  ON public.organizer_teams FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage all organizer members" ON public.organizer_team_members;
CREATE POLICY "Admins manage all organizer members"
  ON public.organizer_team_members FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5) Histórico de alterações de placar
CREATE TABLE IF NOT EXISTS public.competition_match_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.competition_matches(id) ON DELETE CASCADE,
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  changed_by uuid,
  changed_by_name text,
  placar_a_old integer,
  placar_b_old integer,
  placar_a_new integer,
  placar_b_new integer,
  finalizada_old boolean,
  finalizada_new boolean,
  changed_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.competition_match_history TO authenticated;
GRANT ALL ON public.competition_match_history TO service_role;
ALTER TABLE public.competition_match_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can insert history"
  ON public.competition_match_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = changed_by);

CREATE POLICY "Admins and organizers view history"
  ON public.competition_match_history FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'organizer'::app_role));

CREATE INDEX IF NOT EXISTS idx_match_history_match ON public.competition_match_history(match_id, changed_at DESC);
