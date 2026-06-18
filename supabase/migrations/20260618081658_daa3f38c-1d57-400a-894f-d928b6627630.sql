DROP POLICY IF EXISTS "Team owners and admins can view organizer team members" ON public.organizer_team_members;
DROP POLICY IF EXISTS "Owners can add members to their teams" ON public.organizer_team_members;
DROP POLICY IF EXISTS "Owners can update members of their teams" ON public.organizer_team_members;
DROP POLICY IF EXISTS "Owners can delete members of their teams" ON public.organizer_team_members;

CREATE POLICY "Team owners and admins can view organizer team members"
ON public.organizer_team_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organizer_teams ot
    WHERE ot.id = organizer_team_members.team_id
      AND ot.owner_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Owners can add members to their teams"
ON public.organizer_team_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organizer_teams ot
    WHERE ot.id = organizer_team_members.team_id
      AND ot.owner_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Owners can update members of their teams"
ON public.organizer_team_members
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organizer_teams ot
    WHERE ot.id = organizer_team_members.team_id
      AND ot.owner_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Owners can delete members of their teams"
ON public.organizer_team_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organizer_teams ot
    WHERE ot.id = organizer_team_members.team_id
      AND ot.owner_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

REVOKE ALL ON FUNCTION public.get_team_owner(uuid) FROM authenticated, service_role;