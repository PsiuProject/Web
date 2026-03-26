# Dev Mode - Offline Testing Completo

## Como Funciona

Quando você roda o projeto em `localhost` (desenvolvimento), o sistema automaticamente:

1. **Detecta que está em dev mode** (localhost ou `import.meta.env.DEV`)
2. **Mocka autenticação Google OAuth** - sem necessidade de Supabase configurado
3. **Cria dados mock completos** que persistem no localStorage:
   - 3 Projetos (active, pipeline, done)
   - 5 Elementos canvas (card, text, image, link, button)
   - 3 Comentários com threads
   - Notificações
4. **Persiste tudo no localStorage** - dados sobrevivem ao refresh!
5. **Sessão de 24h** no localStorage

## Features 100% Funcionais Offline

### ✅ Gallery View
- Grid de projetos com layout automático
- Separators por status (Active/Pipeline/Done)
- Connection lines entre projetos pai/filho
- Zoom/Pan com momentum
- Filtros por seção

### ✅ View Mode
- Visualização read-only do canvas
- Todos os elementos renderizados
- Conexões entre elementos
- Zoom com pinch/mouse wheel
- Pan com drag

### ✅ Edit Mode - COMPLETO
- **Toolbar lateral esquerda:**
  - Add Card → Cria card novo no centro do viewport
  - Add Text → Cria texto editável
  - Add Image → Cria placeholder de imagem
  - Add Link → Cria link clicável
  - Add Button → Cria botão estilizado
  - Undo (Ctrl+Z) → Desfaz última ação
  - Redo (Ctrl+Shift+Z) → Refaz ação desfeita
  - Delete → Remove elemento selecionado
  - Clone → Duplica elemento selecionado

- **Properties Panel (direita):**
  - Position X/Y (numérico)
  - Width/Height (mínimos aplicados)
  - Rotation (-180° a 180°)
  - Layer (z-index + buttons)
  - Card Settings (status, background color, border color)
  - Text Settings (font size, color, boxed toggle)
  - Image Upload (mock - salva URL)
  - Link/Button URL

- **Inline Editor:**
  - Double-click em qualquer elemento
  - Modal de edição de texto
  - Suporte multi-language (pt/en)
  - Ctrl+Enter para salvar

- **Drag & Drop:**
  - Arrastar elementos pelo canvas
  - Seleção com click
  - Highlight quando selecionado

### ✅ Comment Mode - COMPLETO
- **Markers visuais no canvas:**
  - Avatar do usuário (cor ou foto)
  - Badge de número de respostas
  - Tooltip ao passar mouse
  - Click abre thread sidebar

- **Thread Sidebar:**
  - Lista comentários e respostas
  - Input de nova resposta
  - Attach files (mock upload)
  - Resolve comment button
  - Delete comment button
  - Timestamp relative (just now, 5m ago, etc)

- **Novo Comentário:**
  - Botão "New Comment" quando elemento selecionado
  - Modal com textarea
  - Posicionamento automático próximo ao elemento
  - Thread aberta após criar

### ✅ Presentation Mode
- UI completamente escondida
- Foco total no canvas
- Navegação limpa

### ✅ Keyboard Shortcuts
- `Ctrl+Z` → Undo
- `Ctrl+Shift+Z` → Redo
- `Ctrl+Y` → Redo (alternativo)
- `Delete/Backspace` → Delete selecionado
- `Escape` → Cancelar edição / Limpar seleção

## Dados Mock Iniciais

### 3 Projetos
```javascript
[
  {
    id: 'test-project-1',
    title: 'Projeto Teste',
    status: 'active',
    position: { x: 100, y: 150 }
  },
  {
    id: 'test-project-2',
    title: 'Projeto Pipeline',
    status: 'pipeline',
    position: { x: 450, y: 200 }
  },
  {
    id: 'test-project-3',
    title: 'Projeto Concluído',
    status: 'done',
    position: { x: 800, y: 100 }
  }
]
```

### 5 Elementos Canvas (test-project-1)
1. **Card** - Card de exemplo com título e descrição
2. **Text** - Texto de boas-vindas
3. **Image** - Placeholder de imagem
4. **Link** - Link para site externo
5. **Button** - Botão de ação

### 3 Comentários
1. **comment-1** - No card, perguntando sobre detalhes
2. **comment-2** - Resposta ao comment-1
3. **comment-3** - No canvas, marcado como resolvido

## Como Usar

### 1. Start Dev Server
```bash
pnpm run dev
```

### 2. Acesse localhost
```
http://localhost:5173/web/
```

### 3. Click em "START TESTING (Mock Login)"
- Automaticamente loga com usuário mock
- Redireciona para `/test-project-1/edit`
- Toolbar e properties panel visíveis

### 4. Teste Todas as Features!

#### Adicionar Elementos
1. Toolbar esquerda → Click "Card"
2. Novo card aparece no centro
3. Properties panel mostra configurações
4. Double-click para editar título/descrição

#### Editar Elementos
1. Click no elemento para selecionar
2. Properties panel à direita
3. Ajuste posição, tamanho, rotação
4. Double-click para inline edit

#### Mover Elementos
1. Click e arraste qualquer elemento
2. Soltar para posicionar

#### Comentários
1. Click no botão "Comment" no header
2. Click em um elemento
3. Click "New Comment"
4. Escreva e submit
5. Marker aparece no canvas
6. Click no marker para ver thread

#### Undo/Redo
1. Faça qualquer alteração (criar, mover, editar)
2. `Ctrl+Z` para desfazer
3. `Ctrl+Shift+Z` para refazer

#### Zoom/Pan
1. Mouse wheel para zoom
2. Drag no canvas vazio para pan
3. Pinch em touch devices

## Gerenciando Dados Mock

### Console DevTools
No console do browser, use:

```javascript
// Resetar todos os dados mock para o estado inicial
window.mockData.reset()
location.reload()

// Limpar todos os dados mock
window.mockData.clear()
location.reload()

// Ver projetos atuais
window.mockData.getProjects()

// Ver elementos de um projeto
window.mockData.getElements('test-project-1')

// Ver comentários
window.mockData.getComments('test-project-1')

// Adicionar elemento manualmente
window.mockData.addElement({
  id: 'my-element',
  project_id: 'test-project-1',
  type: 'text',
  content: { text: { pt: 'Olá!' } },
  position_x: 100,
  position_y: 100,
  width: 200,
  height: 50
})
```

## Persistência

Os dados são salvos no localStorage em:
- `mock-data-projects`
- `mock-data-elements`
- `mock-data-comments`
- `mock-data-notifications`

**Sobrevivem a:**
- Refresh da página
- Fechar e abrir navegador
- Navegar entre rotas
- Logout/Login (dentro de 24h)

**São resetados quando:**
- `window.mockData.reset()` é chamado
- `window.mockData.clear()` é chamado
- LocalStorage é limpo manualmente

## Limitações

⚠️ **Upload de imagens** - Salva apenas URL mock, não faz upload real
⚠️ **Realtime** - Sem atualização em tempo real de outros usuários
⚠️ **Database** - Dados não vão para Supabase
⚠️ **Emails** - Notificações não enviam email

✅ **UI/UX** - 100% funcional
✅ **Interações** - Todas working
✅ **Estado** - Persistido localmente
✅ **Performance** - Rápido, sem network latency

## Debug

No console você verá:
```
[Auth] Dev mode: using mock authentication
[Main] Restored dev auth from localStorage
[Main] Initialized mock data stores
[Projects] Loaded mock projects for offline testing
```

## Sair do Dev Mode

Para testar com Supabase real:

1. Configure `.env`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```

2. Ou faça deploy em produção

## Resetar Tudo

```javascript
// Limpa localStorage e recarrega
localStorage.clear()
location.reload()
```
