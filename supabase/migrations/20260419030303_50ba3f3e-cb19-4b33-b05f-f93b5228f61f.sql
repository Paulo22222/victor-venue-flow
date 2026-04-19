-- Add modalidade and esporte columns to competition_matches
ALTER TABLE public.competition_matches
  ADD COLUMN IF NOT EXISTS modalidade text,
  ADD COLUMN IF NOT EXISTS esporte text;

-- Table: dispute systems per modality of an event
CREATE TABLE IF NOT EXISTS public.competition_dispute_systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL,
  modalidade text NOT NULL,
  sistema text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (competition_id, modalidade)
);

ALTER TABLE public.competition_dispute_systems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view dispute systems"
  ON public.competition_dispute_systems FOR SELECT USING (true);

CREATE POLICY "Admins insert dispute systems"
  ON public.competition_dispute_systems FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update dispute systems"
  ON public.competition_dispute_systems FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete dispute systems"
  ON public.competition_dispute_systems FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Table: link organizer teams to a competition (admin selects teams from catalog)
CREATE TABLE IF NOT EXISTS public.competition_selected_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL,
  organizer_team_id uuid NOT NULL,
  modalidade text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (competition_id, organizer_team_id, modalidade)
);

ALTER TABLE public.competition_selected_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view selected teams"
  ON public.competition_selected_teams FOR SELECT USING (true);

CREATE POLICY "Admins insert selected teams"
  ON public.competition_selected_teams FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update selected teams"
  ON public.competition_selected_teams FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete selected teams"
  ON public.competition_selected_teams FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add tables to realtime publication for live score updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_dispute_systems;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_selected_teams;