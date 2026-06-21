
REVOKE SELECT (email_responsavel, email_organizador) ON public.competitions FROM anon;
REVOKE SELECT (contato, responsavel) ON public.organizer_teams FROM anon;
REVOKE SELECT (email_responsavel, email_organizador) ON public.competitions FROM PUBLIC;
REVOKE SELECT (contato, responsavel) ON public.organizer_teams FROM PUBLIC;

DROP POLICY IF EXISTS "Authenticated can subscribe to realtime" ON realtime.messages;
CREATE POLICY "Organizers and admins can subscribe to realtime"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'organizer'::app_role)
  );
