# 🤖 AI Programmer Prompt — Project Management App
> **Repo:** https://github.com/HautlyS/projects  
> **Deploy:** GitHub Pages  
> **Stack alvo:** React (ou HTML/JS existente) + Supabase (Postgres + Auth + Realtime + Storage)

---

## 🧠 CONTEXTO GERAL

Você é uma AI programadora sênior full-stack. Você irá revisar, reestruturar e expandir completamente um app de **Project Management** hospedado em GitHub Pages, migrando de dados hardcoded para Supabase e adicionando autenticação, colaboração em tempo real, e edição in-place completa.

**Leia todo este prompt antes de começar qualquer ação.**  
**A cada fase concluída, marque o TODO correspondente como ✅ antes de continuar.**

---

## ✅ TODO LIST — VERIFICAÇÃO 100%

### FASE 0 — LEITURA E AUDITORIA
- [ ] **TODO-00:** Ler e mapear toda a estrutura atual do repositório (arquivos, pastas, componentes)
- [ ] **TODO-01:** Identificar todos os dados hardcoded (projetos, subprojetos, metadados)
- [ ] **TODO-02:** Mapear todas as rotas, estados e fluxos existentes no app
- [ ] **TODO-03:** Documentar os problemas de arquitetura atuais antes de qualquer mudança
- [ ] **TODO-04:** Listar todas as dependências instaladas e verificar versões

---

### FASE 1 — CANVAS & DETAILED VIEW (UI/UX)
- [ ] **TODO-10:** Redesenhar o Canvas principal com suporte a **projetos e subprojetos** hierárquicos (árvore/kanban misto)
- [ ] **TODO-11:** Implementar drag-and-drop de cards de projeto no canvas (usar `@dnd-kit` ou `react-beautiful-dnd`)
- [ ] **TODO-12:** Criar **Detailed View** de projeto com: título, descrição, status, datas, membros, subprojetos, links, imagens e texto livre
- [ ] **TODO-13:** Todo elemento no hover deve exibir um **ícone de lápis (✏️)** pequeno e discreto para edição in-place
- [ ] **TODO-14:** Implementar edição inline em todos os campos (click-to-edit, sem modais desnecessários)
- [ ] **TODO-15:** Adicionar suporte a inserção de **texto, imagem, links** em qualquer lugar da Detailed View
- [ ] **TODO-16:** Links inseridos devem ser **auto-transformados em chip-buttons** clicáveis
- [ ] **TODO-17:** Garantir que todas as posições e conteúdos tenham **persistent view** (salvo no Supabase)

---

### FASE 2 — MIGRAÇÃO DE DADOS PARA SUPABASE

#### 2A — Script de Transformação
- [ ] **TODO-20:** Extrair todos os dados hardcoded em um array/objeto JavaScript estruturado
- [ ] **TODO-21:** Criar script `migrate.js` (ou `migrate.ts`) que transforma cada item em um `POST` para a API do Supabase
- [ ] **TODO-22:** Verificação 1ª passagem: checar se **todos os campos** dos dados originais estão mapeados para colunas do schema
- [ ] **TODO-23:** Verificação 2ª passagem: re-comparar dado original vs payload do POST linha a linha — só então executar
- [ ] **TODO-24:** Executar o script e confirmar que todos os registros foram inseridos corretamente (checar count e sample)

#### 2B — Schema Supabase (via MCP)
- [ ] **TODO-25:** Criar tabela `projects` com colunas: `id, owner_id, title, description, status, privacy, position_x, position_y, created_at, updated_at`
- [ ] **TODO-26:** Criar tabela `subprojects` com FK para `projects.id`
- [ ] **TODO-27:** Criar tabela `project_members` com colunas: `project_id, user_id, email, role (viewer|editor|owner)`
- [ ] **TODO-28:** Criar tabela `project_content_blocks` para blocos de texto/imagem/link com: `id, project_id, type, content, position, created_by`
- [ ] **TODO-29:** Criar tabela `canvas_positions` para persistir posição X/Y de cada card por usuário/projeto
- [ ] **TODO-30:** Configurar **RLS (Row Level Security)** — regras:
  - `owner` pode fazer tudo
  - `editor` pode SELECT e UPDATE
  - `viewer` pode SELECT apenas se `privacy = 'public'` ou se está em `project_members`
  - usuário não autenticado pode SELECT apenas se `privacy = 'public'`
- [ ] **TODO-31:** Revisar todas as RLS policies e testar com usuário anônimo, viewer e editor antes de prosseguir

---

### FASE 3 — AUTENTICAÇÃO (Google Login via Supabase)
- [ ] **TODO-32:** Configurar **Supabase Auth com provider Google**
- [ ] **TODO-33:** Adicionar fluxo de Login/Logout no app (botão de login Google visível apenas se não autenticado)
- [ ] **TODO-34:** Proteger rotas privadas — projetos com `privacy = 'private'` só visíveis para `owner` ou `project_members`
- [ ] **TODO-35:** Armazenar `SUPABASE_URL` e `SUPABASE_ANON_KEY` como **GitHub Pages Secrets** (via Actions se necessário) e nunca hardcodar no código
- [ ] **TODO-36:** Garantir que o build de GitHub Pages injete as variáveis de ambiente corretamente

---

### FASE 4 — PRIVACIDADE & LINKS DINÂMICOS
- [ ] **TODO-40:** Adicionar seção **"Privacy Settings"** na Detailed View de cada projeto
- [ ] **TODO-41:** Toggle de privacidade: `Público` / `Privado` / `Somente por link`
- [ ] **TODO-42:** Gerar **link dinâmico único** por projeto (ex: `hautlys.github.io/projects/p/{project_id}`)
- [ ] **TODO-43:** Ao alterar privacidade, atualizar campo `privacy` no Supabase imediatamente
- [ ] **TODO-44:** Implementar middleware de acesso: verificar `privacy` + `project_members` antes de renderizar qualquer projeto
- [ ] **TODO-45:** Suporte a **múltiplos projetos por conta**, cada um com privacidade independente

---

### FASE 5 — ROLES & COLABORAÇÃO EDITORIAL
- [ ] **TODO-50:** Criar UI de **"Manage Members"** dentro de cada projeto:
  - Input de email para convidar editor/viewer
  - Lista de membros atuais com seu role
  - Botão para remover membro ou alterar role
- [ ] **TODO-51:** Ao convidar por email, inserir registro em `project_members` e (opcional) enviar email de convite via Supabase Edge Function
- [ ] **TODO-52:** Para usuários com role `editor`: habilitar toda interface editável (lápis no hover, drag-and-drop, edição inline)
- [ ] **TODO-53:** Para usuários com role `viewer`: interface somente leitura, sem lápis, sem drag
- [ ] **TODO-54:** Controle de acesso no frontend: verificar role do usuário logado ao carregar o projeto

---

### FASE 6 — COLABORAÇÃO REALTIME (CRDT / Google Docs-like)
- [ ] **TODO-60:** Ativar **Supabase Realtime** nas tabelas `projects`, `subprojects`, `project_content_blocks`, `canvas_positions`
- [ ] **TODO-61:** Implementar **presença em tempo real**: mostrar avatares/iniciais dos colaboradores ativos no canvas
- [ ] **TODO-62:** Sincronizar **posições de drag** em tempo real entre editores (broadcast via Supabase Realtime channels)
- [ ] **TODO-63:** Sincronizar **edições de texto inline** com debounce (300ms) via Supabase Realtime ou biblioteca CRDT leve (ex: `Yjs` + Supabase provider)
- [ ] **TODO-64:** Implementar **lock otimista**: se dois editores tentam editar o mesmo campo, o segundo vê um indicador visual de "being edited by X"
- [ ] **TODO-65:** Garantir que mudanças de conteúdo, posição e privacidade propagam para todos os viewers/editors conectados sem necessidade de refresh

---

### FASE 7 — REVISÃO FINAL & QA
- [ ] **TODO-70:** Testar fluxo completo como **owner**: criar projeto, adicionar conteúdo, convidar editor, alterar privacidade
- [ ] **TODO-71:** Testar fluxo completo como **editor**: ver projeto, editar inline, arrastar card, adicionar bloco
- [ ] **TODO-72:** Testar fluxo completo como **viewer**: ver projeto público, não conseguir editar
- [ ] **TODO-73:** Testar fluxo como **usuário não autenticado**: projeto público visível, projeto privado bloqueado
- [ ] **TODO-74:** Verificar que nenhuma chave de API está exposta no código fonte ou no bundle final
- [ ] **TODO-75:** Verificar que o deploy no GitHub Pages está funcional após todas as mudanças
- [ ] **TODO-76:** Checar performance do canvas com 20+ projetos (lazy load se necessário)

---

## 📐 SCHEMA SUPABASE — REFERÊNCIA RÁPIDA

```sql
-- projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  privacy TEXT DEFAULT 'private', -- 'public' | 'private' | 'link_only'
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- subprojects
CREATE TABLE subprojects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- project_members
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  role TEXT DEFAULT 'viewer', -- 'viewer' | 'editor' | 'owner'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, email)
);

-- project_content_blocks
CREATE TABLE project_content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'text' | 'image' | 'link'
  content TEXT,
  position INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: enable on all tables above
-- Example for projects:
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON projects
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "member_select" ON projects
  FOR SELECT USING (
    privacy = 'public'
    OR auth.uid() IN (
      SELECT user_id FROM project_members WHERE project_id = projects.id
    )
  );
```

---

## ⚙️ VARIÁVEIS DE AMBIENTE

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> No GitHub Pages, configure via **Settings → Secrets → Actions** e injete no build via `github-actions` workflow.

---

## 🚨 REGRAS GERAIS PARA A AI

1. **Nunca pule um TODO** sem marcá-lo como concluído.
2. **Nunca hardcode** credenciais, IDs ou dados de produção.
3. **Sempre verifique duas vezes** antes de executar qualquer migração de dados (TODO-22 e TODO-23 são obrigatórios antes do TODO-24).
4. **Preserve o design** existente ao máximo — evolua, não destrua.
5. **Comentários no código** são obrigatórios em toda lógica de RLS, autenticação e realtime.
6. **A interface deve ser responsiva** — canvas funcional em desktop e tablet.
7. **Commits atômicos**: um commit por fase concluída, com mensagem descritiva.
