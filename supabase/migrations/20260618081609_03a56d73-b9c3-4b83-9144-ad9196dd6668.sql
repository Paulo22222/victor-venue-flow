REVOKE ALL ON public.competitions FROM anon;
GRANT SELECT (id, nome, data, modalidade, local, finalizado, updated_at) ON public.competitions TO anon;

REVOKE ALL ON public.organizer_teams FROM anon;
GRANT SELECT (id, nome, modalidade, genero) ON public.organizer_teams TO anon;