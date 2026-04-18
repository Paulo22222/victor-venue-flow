ALTER TABLE public.competitions REPLICA IDENTITY FULL;
ALTER TABLE public.competition_matches REPLICA IDENTITY FULL;
ALTER TABLE public.competition_teams REPLICA IDENTITY FULL;
ALTER TABLE public.competition_modalities REPLICA IDENTITY FULL;
ALTER TABLE public.competition_athletes REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.competitions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_modalities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_athletes;