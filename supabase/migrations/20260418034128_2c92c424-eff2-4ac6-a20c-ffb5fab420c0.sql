-- Organizer teams catalog (independent of events)
CREATE TABLE public.organizer_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  nome text NOT NULL,
  genero text,
  modalidade text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organizer_teams ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER organizer_teams_updated_at
BEFORE UPDATE ON public.organizer_teams
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.organizer_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.organizer_teams(id) ON DELETE CASCADE,
  nome text NOT NULL,
  data_nascimento text,
  documento text,
  genero text,
  codigo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organizer_team_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_team_owner(_team_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT owner_id FROM public.organizer_teams WHERE id = _team_id
$$;

-- Policies for organizer_teams
CREATE POLICY "Anyone can view organizer teams"
ON public.organizer_teams FOR SELECT
USING (true);

CREATE POLICY "Organizers can create their own teams"
ON public.organizer_teams FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = owner_id
  AND (has_role(auth.uid(), 'organizer'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Organizers can update their own teams"
ON public.organizer_teams FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Organizers can delete their own teams"
ON public.organizer_teams FOR DELETE
TO authenticated
USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role));

-- Policies for organizer_team_members
CREATE POLICY "Anyone can view organizer team members"
ON public.organizer_team_members FOR SELECT
USING (true);

CREATE POLICY "Owners can add members to their teams"
ON public.organizer_team_members FOR INSERT
TO authenticated
WITH CHECK (
  public.get_team_owner(team_id) = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Owners can update members of their teams"
ON public.organizer_team_members FOR UPDATE
TO authenticated
USING (
  public.get_team_owner(team_id) = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Owners can delete members of their teams"
ON public.organizer_team_members FOR DELETE
TO authenticated
USING (
  public.get_team_owner(team_id) = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE INDEX idx_organizer_teams_owner ON public.organizer_teams(owner_id);
CREATE INDEX idx_organizer_team_members_team ON public.organizer_team_members(team_id);