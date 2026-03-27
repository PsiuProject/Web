# Responsive Units Audit - PSIU Project

## Summary
This audit identifies all hardcoded `px` values in the codebase and provides recommendations for converting them to responsive units (`clamp()`, `vw`, `vh`, `rem`, `%`).

## Files Reviewed: 32 files with px values

---

## 🎯 PRIORITY 1: Critical Layout Files (Convert These)

### 1. **src/components/Canvas/Render/Card.vue** - 81 px occurrences
**Status**: Partially converted

**Already Converted:**
- ✅ Resize handles now use `clamp()` for size and positioning

**Still Need Conversion:**
- Cell min-heights (40px, 50px) → Use `clamp(40px, 5vh, 60px)`
- Button heights (50px) → Use `clamp(44px, 5vh, 52px)`  
- Image heights (80px, 120px) → Use relative units or aspect-ratio
- Toolbar gaps/padding → Use `clamp(4px, 0.5vw, 8px)`
- Menu widths (180px, 28px) → Use `clamp(160px, 20vw, 200px)`

**Recommendation**: Focus on cell sizes and spacing, keep border radius small values in px

---

### 2. **src/components/Canvas/Render/Text.vue** 
**Key Issues:**
- Text resize handles fixed sizes
- Toolbar dimensions
- Font picker dimensions

**Recommended Conversions:**
```css
/* Instead of */
width: 12px; height: 24px;
padding: 6px 8px;

/* Use */
width: clamp(10px, 1.5vw, 14px);
height: clamp(20px, 2.5vh, 28px);
padding: clamp(4px, 0.5vh, 6px) clamp(6px, 0.8vw, 10px);
```

---

### 3. **src/components/Canvas/Editor/PropertiesPanel.vue**
**Key Issues:**
- Panel width uses some clamp() but many internal elements use px
- Input field sizes
- Icon/button sizes

**Already Good:**
- ✅ Panel width: `clamp(240px, 25vw, 320px)`
- ✅ Many font sizes already responsive

**Needs Work:**
- Section padding/margins
- Icon sizes (14px, 16px) → `clamp(12px, 1.5vw, 16px)`

---

### 4. **src/style.css** - 80 px occurrences
**Browser UI Theme Section:**

**KEEP as px (appropriate for these):**
- Scrollbar widths (10px) - browser standard
- Checkbox/radio sizes (16px) - accessibility requirement
- Border radius values (3px, 4px, 5px) - visual consistency
- Outline offsets (2px, 4px) - precision needed
- Box-shadow blur values (4px, 8px, 12px) - visual effect

**CONVERT to responsive:**
- Connection port sizes (10px) → `clamp(8px, 1vw, 12px)`
- Privacy badge position (top: 8px; right: 8px;) → `clamp(6px, 1vh, 10px)`
- Links row gap (4px) → `clamp(2px, 0.3vw, 6px)`
- Detail overlay blur (12px) → `clamp(8px, 1.5vh, 16px)`

---

## 🎯 PRIORITY 2: Important Component Files

### 5. **src/components/Layout/AppHeader.vue**
- Logo sizes
- Navigation padding
- Dropdown dimensions

### 6. **src/views/CanvasEdit.vue**
- Canvas container sizes
- Viewport dimensions

### 7. **src/components/UI/ContextMenu.vue**
- Menu item padding
- Icon sizes

---

## 🎯 PRIORITY 3: Supporting Files

### 8-32. Other Files
These have fewer px values and lower impact:
- Comment components (Bubble, Thread, Marker)
- Render components (Image, Link, ConnectionLine, Grid)
- Editor components (Toolbar, InlineEditor, ConnectionTypePicker)
- View components (GalleryView, ProjectSelectView, WelcomeView)
- Store files (gallery.js, viewport/projectViewport.js)

---

## 📋 CONVERSION GUIDELINES

### When to USE Responsive Units:

✅ **Layout dimensions** (widths, heights, margins, padding)
```css
/* Good examples */
width: clamp(200px, 25vw, 400px);
padding: clamp(0.5rem, 1vh, 1rem) clamp(1rem, 2vw, 2rem);
gap: clamp(4px, 0.5vw, 12px);
margin: clamp(8px, 1vh, 16px);
```

✅ **Font sizes** (already mostly done)
```css
font-size: clamp(0.7rem, 1vw, 0.9rem);
```

✅ **Interactive elements** (buttons, inputs)
```css
min-height: clamp(40px, 5vh, 52px);
min-width: clamp(120px, 15vw, 180px);
```

✅ **Positioning** (top, left, right, bottom)
```css
top: clamp(8px, 1vh, 12px);
left: clamp(16px, 2vw, 32px);
```

---

### When to KEEP Pixels:

❌ **Border radius** (small values for visual consistency)
```css
/* Keep as px */
border-radius: 2px;
border-radius: 4px;
border-radius: 8px;
```

❌ **Border widths** (precision needed)
```css
/* Keep as px */
border: 1px solid var(--moss);
border-width: 2px;
```

❌ **Box shadows** (visual effects need precision)
```css
/* Keep as px */
box-shadow: 0 4px 12px rgba(0,0,0,0.3);
filter: drop-shadow(0 0 8px currentColor);
```

❌ **Browser UI controls** (scrollbars, checkboxes, radios)
```css
/* Keep as px for cross-browser consistency */
::-webkit-scrollbar { width: 10px; }
input[type="checkbox"] { width: 16px; height: 16px; }
```

❌ **Outline offsets** (accessibility precision)
```css
/* Keep as px */
outline-offset: 2px;
```

---

## 🔧 RECOMMENDED UNIT MAPPINGS

| Element Type | Recommended Unit | Example |
|--------------|------------------|---------|
| Container widths | `clamp(px, vw, px)` | `clamp(280px, 35vw, 400px)` |
| Container heights | `clamp(px, vh, px)` | `clamp(200px, 25vh, 400px)` |
| Padding/Margin | `clamp(rem, vh/vw, rem)` | `clamp(0.5rem, 1vh, 1rem)` |
| Gaps | `clamp(px, vw, px)` | `clamp(4px, 0.5vw, 12px)` |
| Font sizes | `clamp(rem, vw, rem)` | `clamp(0.8rem, 1vw, 1rem)` |
| Icon sizes | `clamp(px, vw, px)` | `clamp(14px, 1.5vw, 20px)` |
| Position offsets | `clamp(px, vh/vw, px)` | `clamp(8px, 1vh, 16px)` |
| Min-heights | `clamp(px, vh, px)` | `clamp(40px, 5vh, 80px)` |
| Border radius | **Keep px** | `4px` |
| Border widths | **Keep px** | `1px` |
| Shadows | **Keep px** | `0 4px 12px` |

---

## 📊 ESTIMATED EFFORT

| Priority | Files | Est. Changes | Risk Level |
|----------|-------|--------------|------------|
| P1 | Card.vue, Text.vue, PropertiesPanel.vue | ~150 | Medium |
| P2 | AppHeader, CanvasEdit, ContextMenu | ~80 | Low |
| P3 | All others | ~200 | Low |
| **Total** | **32 files** | **~430 changes** | **-** |

---

## ✅ COMPLETED CHANGES

1. ✅ Card.vue resize handles - converted to `clamp()`
2. ✅ Browser UI theme added to style.css
3. ✅ Border radius functions fixed in PropertiesPanel
4. ✅ Border width reactivity fixed

---

## 🚀 NEXT STEPS

1. **Test current state** - Verify app works with recent changes
2. **Priority 1 conversions** - Convert Card.vue cell sizes
3. **Priority 2 conversions** - Update layout components
4. **Visual regression testing** - Check all screen sizes
5. **Performance testing** - Ensure clamp() doesn't impact performance

---

## ⚠️ IMPORTANT NOTES

1. **Don't convert everything** - Some elements NEED fixed pixel sizes
2. **Test thoroughly** - Responsive changes can break layouts
3. **Consider accessibility** - Don't make interactive elements too small
4. **Performance** - Too many clamp() calculations can impact rendering
5. **Browser support** - clamp() is well-supported but check requirements

---

## 📝 FILES ALREADY USING RESPONSIVE UNITS WELL

- ✅ PropertiesPanel.vue (partial - panel width)
- ✅ AppHeader.vue (some elements)
- ✅ Most font sizes across app
- ✅ Main layout containers

---

*Generated: 2026-03-27*
*Audit Tool: grep pattern `\d+px` across src/ directory*
