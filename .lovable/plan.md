## Fase 2 — Plano de implementação

Antes de começar quero confirmar o escopo, porque são 6 features com **3 migrações de banco**, mudanças na **edge function** e várias telas. Vou implementar exatamente o que você pediu.

---

### 1. Aba Locais ↔ Cadastro de Evento

**Migração**: adicionar `venue_id uuid REFERENCES venues(id)` em `competitions`.

**Stage1Event.tsx**: trocar o campo "Local" texto livre por um **Select de locais cadastrados** (carrega de `venues`) com opção "Outro" que volta a aceitar texto livre. Mostra endereço/capacidade abaixo. Persiste `venue_id` + `local` (nome).

**RescheduleDialog (Stage6)**: já usa venues filtrados por modalidade — manter, mas pré-selecionar o venue do evento.

**AdminVenues**: na tabela mostrar coluna "Eventos vinculados" (count de competitions com aquele venue_id), e impedir delete se houver vínculo.

---

### 2. Chaveamento Manual (opção extra)

**Migração**: adicionar `manual boolean DEFAULT false` em `competition_matches`.

**Stage6Summary**: novo botão **"Adicionar confronto manual"** ao lado de cada modalidade. Abre dialog para escolher rodada + Equipe A + Equipe B (dropdowns com equipes da modalidade). Botão **"Editar confronto"** em cada card de jogo permite trocar participantes. Botão **excluir** o jogo.

A função `propagarVencedor` passa a **ignorar matches com `manual=true`** — alterações manuais não são sobrescritas.

---

### 3. Histórico de Alterações de Placares

**Migração**: nova tabela `competition_match_history` (match_id, competition_id, changed_by uuid, changed_at, placar_a_old/new, placar_b_old/new, finalizada_old/new). RLS: admin/organizer veem do próprio evento.

**competitionService.updateMatchScore**: lê valores antigos antes do update e insere histórico (apenas quando match já estava finalizada).

**Stage6Summary**: botão "🕒" em cada jogo finalizado → drawer com lista cronológica: "Fulano alterou 2x1 → 3x1 em 17/06 14:32".

---

### 4. Visibilidade de Eventos por Admin

**Migração**: adicionar `owner_id uuid` em `competitions` (preenche `auth.uid()` no insert). Atualizar RLS SELECT para admin: `owner_id = auth.uid() OR owner_id IS NULL`. Anon/visitante continua vendo tudo (página pública).

**competitionService.listCompetitions**: filtrar por `owner_id = current user`.
**saveCompetition**: setar `owner_id` no insert.

---

### 5. Alterar Senha de Usuário (admin)

**manage-roles edge function**: nova action `?action=set-password` que recebe `{user_id, new_password}` e chama `supabaseAdmin.auth.admin.updateUserById(user_id, { password })`. Valida ≥6 chars.

**AdminUsers.tsx**: botão 🔑 na linha do usuário → dialog "Nova senha" + "Confirmar" → toast.

---

### 6. Edição de Atletas e Equipes (admin + organizador)

**OrganizerTeams.tsx** (usado por ambos os perfis):

- Botão **✏️ Editar equipe** ao lado do nome → dialog com nome, gênero, modalidade, responsável, contato (adicionar colunas se faltarem: `responsavel`, `contato` em `organizer_teams` via migração).
- Botão **✏️ Editar atleta** em cada membro → reabre o dialog completo (mesma estrutura de adicionar) preenchido com os dados, salvando com UPDATE.
- Para o **admin** acessando `/admin/athletes`: detectar role e, em vez de filtrar `owner_id = user.id`, listar **todas** as equipes (RLS já permite via `has_role admin`). Mostrar coluna "Dono" para distinguir.

---

### Resumo dos arquivos tocados

- **3 migrações SQL** (venue_id, manual+history, owner_id + organizer_teams extras)
- **1 edge function** (manage-roles: action set-password)
- **Edits**: Stage1Event, Stage6Summary, AdminVenues, AdminEvents, AdminUsers, OrganizerTeams, competitionService, types/competition
- ~7 arquivos editados + 3 migrações + 1 função

Posso executar tudo? Ou prefere que eu faça **item por item** (1→6) pra você revisar cada migração separadamente antes da próxima?
