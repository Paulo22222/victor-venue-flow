
-- Add modalidade field to athletes and teams so they can be linked to a sport category
ALTER TABLE public.competition_athletes ADD COLUMN modalidade text DEFAULT NULL;
ALTER TABLE public.competition_teams ADD COLUMN modalidade text DEFAULT NULL;
