## Resumo

Você escolheu priorizar **CRUD admin/organizador → ajustes cadastro → visual**, mas o bug de login bloqueia tudo (sem login admin, não dá pra testar nada). Então proponho rodar **bugs críticos primeiro (rápido)** e depois seguir sua ordem. Total estimado: 4 fases.

---

## Fase 1 — Bugs críticos (faço já, é rápido)

1. **Login redireciona pra home**: a causa típica é race condition no `AuthContext` — a query de role roda antes da sessão restaurar. Vou:
   - Em `AuthContext`, primeiro registrar `onAuthStateChange`, depois chamar `getSession()` (ordem correta).
   - Marcar `loading=true` até a role ser carregada.
   - Em rotas protegidas, esperar `loading` virar `false` antes de redirecionar.
2. **Visitante: "evento não encontrado"**: revisar `PublicEvent.tsx` — provavelmente está filtrando por `finalizado=true` ou a policy `anon` no `competitions` está exigindo auth. Vou ajustar RLS para permitir `SELECT` anon em eventos publicados e remover o filtro que esconde eventos.
3. **Tirar QR Code dos crachás**: remover geração e renderização em `badgeGenerator.ts` e telas de crachá.

## Fase 2 — Ajustes no cadastro de evento

4. **Remover etapa Logística inteira** (você confirmou): tirar `Stage5Logistics` do wizard, remover do `CompetitionState.logistica`, do `competitionService` (campos `logistica_*`, `tempo_*`, `equipe_arbitragem` etc.) e migrar coluna para serem opcionais/ignoradas. O wizard fica: Evento → Categorias → Equipes → Disputa → Resumo (5 etapas).
5. **Modalidade na etapa 1 = lista clicável**: substituir input texto por multi-select usando `sport_modalities` cadastradas no admin. Salva como array.
6. **Unidade de pontuação clicável** em `AdminModalities`: radio/select com opções (pontos, sets, tempo, distância) — o sistema de scoring se adapta com base nisso (`sportRules.ts`).
7. **Validação telefone/RG** no cadastro de atleta: zod com máscaras BR (`(99) 99999-9999`, RG numérico/alfanumérico).
8. **Planilha modelo (XLSX) mais bonita**: cabeçalhos coloridos, larguras de coluna, dropdowns de validação para gênero/modalidade, instruções na primeira linha.

## Fase 3 — Novas telas (sua prioridade #1)

9. **Admin → Atletas & Equipes** (nova página, já existe rota `/admin/athletes`): tabela com todos atletas do acervo (`organizer_team_members`), com:
   - Filtros: curso, campus, busca por nome.
   - Edição inline ou modal (nome, foto, telefone, RG, curso, campus, data nasc).
   - Aba "Equipes" para editar `organizer_teams` (nome, gênero, integrantes).
10. **Organizador → editar atletas**: liberar `OrganizerTeams` para editar atletas do próprio acervo (RLS já permite via `get_team_owner`).

## Fase 4 — Visual/UX

11. **Chaveamento com linhas conectando rodadas** (estilo da imagem): SVG overlay no `Bracket` em `PublicEvent.tsx` e `Stage6Summary.tsx`. Linhas laranjas em L conectando vencedor → próxima partida.
12. **Classificação por modalidade + gênero**: agrupar rankings em abas/cards (`Masculino / Feminino / Misto` dentro de cada modalidade) no público e no admin.
13. **Visitante clica na equipe → vê atletas** (só nome + foto): modal/drawer no `PublicEvent.tsx` carregando `team_members` ou `organizer_team_members`.
14. **Chaveamento manual**: novo modo em `Stage6Summary` onde admin arrasta/seleciona quem joga contra quem antes de gerar a 1ª rodada.
15. **Aba Locais — utilidade real**: hoje é só CRUD solto. Proposta: associar locais a eventos (dropdown de `venues` na etapa 1 ao invés de texto livre) + mostrar agenda do local (quais eventos/jogos acontecem ali). Se você preferir, removo a aba.

---

## Explicação das funções admin (entrego junto, em texto)

Vou te mandar no chat um guia rápido do que cada item do menu admin faz: Painel, Eventos, Equipes & Atletas, Acervo organizadores, Modalidades, Locais, Crachás, Usuários — com 1 parágrafo cada.

---

## Ordem de execução proposta

Faço **Fase 1 agora** (1 resposta), aí você testa o login e visitante. Depois confirmamos seguir pra Fase 2, 3 e 4 em respostas separadas — assim cada etapa é validável e não viramos um "big bang" de 30 arquivos.

**Pergunta de decisão antes de começar:**
- Posso rodar a Fase 1 já? (bugs críticos + tirar QR)
- Na **etapa 15 (Locais)**: prefere (a) integrar locais ao cadastro de evento ou (b) remover a aba?
- No **chaveamento manual** (item 14): substituir a geração automática ou adicionar como opção extra?
