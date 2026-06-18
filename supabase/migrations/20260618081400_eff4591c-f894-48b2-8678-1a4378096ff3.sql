CREATE INDEX IF NOT EXISTS idx_competition_matches_competition_modality_round
  ON public.competition_matches (competition_id, modalidade, rodada);

CREATE INDEX IF NOT EXISTS idx_competition_modalities_competition
  ON public.competition_modalities (competition_id);

CREATE INDEX IF NOT EXISTS idx_competition_athletes_competition_modality_gender
  ON public.competition_athletes (competition_id, modalidade, genero);

CREATE INDEX IF NOT EXISTS idx_competition_teams_competition_modality_gender
  ON public.competition_teams (competition_id, modalidade, genero);

CREATE INDEX IF NOT EXISTS idx_competition_selected_teams_competition
  ON public.competition_selected_teams (competition_id);

CREATE INDEX IF NOT EXISTS idx_team_members_team
  ON public.team_members (team_id);