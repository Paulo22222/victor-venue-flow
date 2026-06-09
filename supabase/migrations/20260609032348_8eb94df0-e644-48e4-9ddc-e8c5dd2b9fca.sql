-- Restaurar acessos públicos quebrados por migrations anteriores de segurança
-- competitions: visitantes precisam ler dados básicos do evento
GRANT SELECT ON public.competitions TO anon;

-- organizer_teams: visitantes precisam saber nome+genero das equipes para classificação
GRANT SELECT (id, nome, genero, created_at, updated_at) ON public.organizer_teams TO anon;

-- team_members: visitante poderá clicar na equipe e ver atletas (somente nome+foto)
GRANT SELECT (id, team_id, nome, genero) ON public.team_members TO anon;
