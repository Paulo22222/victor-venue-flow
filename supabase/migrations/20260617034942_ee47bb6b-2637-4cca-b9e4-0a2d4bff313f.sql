
-- Modalidades: tipo de participação e regras
ALTER TABLE public.sport_modalities
  ADD COLUMN IF NOT EXISTS tipo_participacao text NOT NULL DEFAULT 'coletiva',
  ADD COLUMN IF NOT EXISTS regra_pontuacao text NOT NULL DEFAULT 'padrao',
  ADD COLUMN IF NOT EXISTS colunas_classificacao jsonb;

-- Restringe valores válidos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sport_modalities_tipo_participacao_chk') THEN
    ALTER TABLE public.sport_modalities
      ADD CONSTRAINT sport_modalities_tipo_participacao_chk
      CHECK (tipo_participacao IN ('coletiva','individual'));
  END IF;
END $$;

-- Partidas: detalhes do placar (sets/games/parciais)
ALTER TABLE public.competition_matches
  ADD COLUMN IF NOT EXISTS detalhes_placar jsonb;

-- Atletas: marca inscrições individuais (sem vínculo de equipe na competição)
ALTER TABLE public.competition_athletes
  ADD COLUMN IF NOT EXISTS inscricao_individual boolean NOT NULL DEFAULT false;

-- Backfill por nome conhecido
UPDATE public.sport_modalities SET tipo_participacao = 'individual', regra_pontuacao = 'tenis_mesa'
 WHERE upper(nome) IN ('TÊNIS DE MESA','TENIS DE MESA');
UPDATE public.sport_modalities SET tipo_participacao = 'individual', regra_pontuacao = 'xadrez'
 WHERE upper(nome) = 'XADREZ';
UPDATE public.sport_modalities SET tipo_participacao = 'individual', regra_pontuacao = 'corrida'
 WHERE upper(nome) LIKE 'CORRIDA%' OR upper(nome) LIKE '%METROS%';
UPDATE public.sport_modalities SET tipo_participacao = 'individual', regra_pontuacao = 'atletismo'
 WHERE upper(nome) LIKE 'SALTO%' OR upper(nome) LIKE 'ARREMESSO%' OR upper(nome) LIKE 'LAN%AMENTO%';
UPDATE public.sport_modalities SET regra_pontuacao = 'futsal'
 WHERE upper(nome) = 'FUTSAL';
UPDATE public.sport_modalities SET regra_pontuacao = 'volei'
 WHERE upper(nome) IN ('VÔLEI','VOLEI','VÔLEI DE PRAIA','VOLEI DE PRAIA');
UPDATE public.sport_modalities SET regra_pontuacao = 'handebol'
 WHERE upper(nome) = 'HANDEBOL';
