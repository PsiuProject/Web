# Guia de Teste Rápido - Dev Mode

## 🚀 Start

```bash
pnpm run dev
# Acesse http://localhost:5173/web/
```

## ✅ Checklist de Testes

### 1. Login Mock (5s)
- [ ] Click em "START TESTING (Mock Login)"
- [ ] Redireciona automaticamente para `/test-project-1/edit`
- [ ] Toolbar esquerda visível
- [ ] Properties panel visível quando elemento selecionado

### 2. Gallery View (30s)
- [ ] Click em "All" no header → volta pra gallery
- [ ] 3 projetos visíveis (active, pipeline, done)
- [ ] Separators com labels
- [ ] Zoom com mouse wheel funciona
- [ ] Drag no canvas para pan

### 3. Edit Mode - Adicionar Elementos (2min)

#### Adicionar Card
- [ ] Toolbar → Click "Card"
- [ ] Card aparece no centro
- [ ] Properties panel mostra configs
- [ ] Double-click → modal inline editor abre
- [ ] Edita título → Ctrl+Enter salva

#### Adicionar Texto
- [ ] Toolbar → Click "Text"
- [ ] Texto aparece
- [ ] Properties: font size, color, boxed
- [ ] Double-click → edita texto

#### Adicionar Image
- [ ] Toolbar → Click "Image"
- [ ] Placeholder aparece
- [ ] Properties: URL input

#### Adicionar Link/Button
- [ ] Toolbar → Click "Link" ou "Button"
- [ ] Elemento aparece
- [ ] Properties: URL input

### 4. Edit Mode - Manipular Elementos (1min)

#### Mover
- [ ] Click e arraste qualquer elemento
- [ ] Soltar em nova posição

#### Redimensionar
- [ ] Selecione elemento
- [ ] Properties → Width/Height
- [ ] Valores atualizam no canvas

#### Rotacionar
- [ ] Selecione elemento
- [ ] Properties → Rotation slider
- [ ] Elemento rotaciona

#### Mudar Camada
- [ ] Selecione elemento
- [ ] Properties → Layer Back/Front buttons
- [ ] Z-index muda

### 5. Undo/Redo (30s)
- [ ] Crie ou mova um elemento
- [ ] `Ctrl+Z` → desfaz
- [ ] `Ctrl+Shift+Z` → refaz
- [ ] Delete elemento → Ctrl+Z traz de volta

### 6. Comment Mode (2min)
- [ ] Header → Click "Comment" tab
- [ ] Click em um elemento existente
- [ ] Click "New Comment" button
- [ ] Modal abre → escreve comentário
- [ ] Submit → marker aparece no canvas
- [ ] Click no marker → sidebar thread abre
- [ ] Escreve resposta → Enter envia
- [ ] Click "Resolve" → comment marcado resolvido

### 7. Presentation Mode (10s)
- [ ] Header → Click "Present" tab
- [ ] UI some (header, toolbar, etc)
- [ ] Só canvas visível
- [ ] Zoom/pan ainda funcionam

### 8. Persistência (30s)
- [ ] Crie um novo elemento
- [ ] Dê refresh na página (F5)
- [ ] Elemento ainda está lá!
- [ ] Comentários também persistem

### 9. Keyboard Shortcuts (30s)
- [ ] Selecione elemento → Delete → some
- [ ] Ctrl+Z → volta
- [ ] Escape → deselect
- [ ] Double-click → edit → Escape cancela

### 10. DevTools Console (1min)
```javascript
// Abrir console (F12)
window.mockData.reset()  // Reseta tudo
location.reload()        // Recarrega

window.mockData.getProjects()  // Ver projetos
window.mockData.getElements('test-project-1')  // Ver elementos
```

## 🎯 Resultado Esperado

**Todos os checkboxes devem estar marcados ✅**

Se algo falhar:
1. Abra console (F12)
2. Veja erros
3. Reporte com screenshot

## 💡 Dicas

- **Elementos iniciais:** 5 elementos já existem no test-project-1
- **Comentários iniciais:** 3 comentários com threads
- **Persistência:** Tudo salvo no localStorage
- **Reset total:** `window.mockData.reset()` + reload

## 📊 Features Count

| Feature | Status |
|---------|--------|
| Add elements | ✅ |
| Edit elements | ✅ |
| Delete elements | ✅ |
| Move elements | ✅ |
| Resize elements | ✅ |
| Rotate elements | ✅ |
| Inline editing | ✅ |
| Undo/Redo | ✅ |
| Comments | ✅ |
| Comment threads | ✅ |
| Resolve comments | ✅ |
| Zoom/Pan | ✅ |
| Presentation | ✅ |
| Persistence | ✅ |

**Total: 14/14 features working! 🎉**
