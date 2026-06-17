# Fase 3 — Modalidades Esportivas Inteligentes

Objetivo: cada modalidade passa a ter regras próprias de pontuação, classificação e participação (coletiva ou individual), sem quebrar o que já funciona.

## 1. Banco de dados (1 migração)

Adicionar em `sport_modalities`:
- `tipo_participacao text not null default 'coletiva'` — valores: `coletiva` | `individual`
- `regra_pontuacao text not null default 'padrao'` — chave que mapeia para o conjunto de regras no front (`futsal`, `volei`, `tenis_mesa`, `xadrez`, `corrida`, `padrao`)
- `colunas_classificacao jsonb` — opcional, define quais colunas a tabela de classificação exibe (ex: `["V","E","D","GP","GC","SG","Pts"]`)

Adicionar em `competition_matches`:
- `detalhes_placar jsonb` — guarda sets/games/parciais quando aplicável (ex: `{ sets: [[25,20],[23,25],[25,18]] }`). Placar agregado continua em `placar_a/placar_b`.

Adicionar em `competition_athletes`:
- `inscricao_individual boolean not null default false` — marca atletas inscritos diretamente (sem equipe) em modalidades individuais.

Atualizar a seed das modalidades já existentes para os valores corretos (futsal/volei/basquete → coletiva; tênis de mesa/xadrez/corrida → individual).

## 2. Camada de regras (`src/utils/sportRules.ts`)

Expandir o arquivo já existente para expor, por modalidade:
- `tipo: 'coletiva' | 'individual'`
- `colunas: { key, label, formula }[]` — define a tabela de classificação
- `calcularLinhaClassificacao(partidas, participanteId)` — devolve `{ V, E, D, GP, GC, SG, Pts, SetsV, SetsP, ... }` conforme o esporte
- `componenteLancamentoPlacar` — chave para o front escolher o input (placar simples, sets, games)

Implementar inicialmente:
- **Futsal**: V/E/D, GP, GC, SG, Pts (3/1/0). Input: placar simples.
- **Vôlei**: SetsV, SetsP, PontosPro, PontosContra, Pts (vitória=3 em 3 sets / 2 em 5 sets; derrota com set=1). Input: lista de sets.
- **Tênis de Mesa**: V, D, GamesV, GamesP, Pts. Input: lista de games. Tipo individual.
- **Xadrez / Corrida**: estrutura básica individual (placeholder, sem mudar regras vigentes).
- **padrao**: mantém o comportamento atual para não quebrar nada.

## 3. Front — adaptação automática

- `Stage6Summary.tsx` (lançamento de placares): detectar `regra_pontuacao` da partida e renderizar o input correto (simples / por sets / por games). Persistir agregado em `placar_a/placar_b` e detalhe em `detalhes_placar`.
- Tabela de classificação (no `Stage6Summary` admin e no `PublicEvent`): renderizar colunas dinamicamente a partir de `colunas` da modalidade. Manter divisão por **modalidade + categoria (masculino/feminino/misto)** que já existe.
- `Stage3Teams.tsx`: para modalidades com `tipo='individual'`, esconder UI de equipes da modalidade e mostrar "Inscrever atleta" (busca em `organizer_team_members` ou cadastro avulso), gravando em `competition_athletes` com `inscricao_individual=true`.
- Chaveamento (`Stage6Summary` + manual): em modalidades individuais, os "participantes" do confronto são atletas, não equipes. Reaproveitar a UI de chaveamento manual já existente, trocando o seletor de equipe por seletor de atleta quando `tipo='individual'`.
- `AdminModalities.tsx`: adicionar campos `tipo_participacao` e `regra_pontuacao` no formulário (selects).

## 4. Serviços

`competitionService.ts`:
- `updateMatchScore` passa a aceitar `detalhes_placar` opcional.
- Funções de listagem de participantes da competição retornam `equipes` **ou** `atletas` conforme tipo da modalidade.

## 5. Fora de escopo (não tocar)

- Login, permissões admin, locais, histórico de placares, edição de equipes/atletas — tudo continua como está.
- Sem refatoração global; só os arquivos listados acima.

## Arquivos previstos

- 1 migração SQL
- `src/utils/sportRules.ts` (expandir)
- `src/components/stages/Stage6Summary.tsx`
- `src/components/stages/Stage3Teams.tsx`
- `src/pages/admin/AdminModalities.tsx`
- `src/pages/PublicEvent.tsx` (classificação dinâmica)
- `src/services/competitionService.ts`
- `src/types/competition.ts`

## Pergunta antes de implementar

Posso implementar tudo de uma vez, ou prefere por etapa (primeiro pontuação Futsal/Vôlei/TM, depois suporte individual)?
