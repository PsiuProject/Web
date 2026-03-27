<template>
  <aside class="properties-panel" v-if="element" @contextmenu.prevent="onPanelRightClick">
    <div class="panel-header">
      <h3>{{ element.type.toUpperCase() }}</h3>
      <button class="close-btn" @click="elements.clearSelection()">&times;</button>
    </div>

    <!-- Tabs -->
    <div class="panel-tabs">
      <button :class="{ active: tab === 'design' }" @click="tab = 'design'">Design</button>
      <button v-if="element.type === 'card'" :class="{ active: tab === 'layout' }" @click="tab = 'layout'">Layout</button>
      <button v-if="hasText" :class="{ active: tab === 'translations' }" @click="tab = 'translations'">Translations</button>
    </div>

    <!-- DESIGN TAB -->
    <div v-if="tab === 'design'" class="panel-body">
      <!-- Transform Controls -->
      <div class="prop-section">
        <div class="section-header-with-icon">
          <span class="prop-label">TRANSFORM</span>
          <div class="transform-buttons">
            <button class="icon-btn" @click="flipHorizontal" title="Flip Horizontal">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 3v18M8 8l-4 4 4 4M16 8l4 4-4 4"/>
              </svg>
            </button>
            <button class="icon-btn" @click="flipVertical" title="Flip Vertical">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12h18M8 16l4 4 4-4M8 8l4-4 4 4"/>
              </svg>
            </button>
            <button class="icon-btn" @click="resetTransforms" title="Reset Transforms">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Position -->
      <div class="prop-section">
        <span class="prop-label">POSITION</span>
        <div class="prop-row">
          <label>X</label>
          <div class="scrubbable-input-wrapper">
            <input 
              type="number" 
              :value="Math.round(element.position_x)" 
              @change="update('position_x', +$event.target.value)"
              @mousedown="startScrubbing($event, 'position_x')"
              class="scrubbable-input"
            />
            <div class="scrub-handle">
              <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                <circle cx="4" cy="3" r="1.5"/>
                <circle cx="4" cy="9" r="1.5"/>
              </svg>
            </div>
          </div>
          <label>Y</label>
          <div class="scrubbable-input-wrapper">
            <input 
              type="number" 
              :value="Math.round(element.position_y)" 
              @change="update('position_y', +$event.target.value)"
              @mousedown="startScrubbing($event, 'position_y')"
              class="scrubbable-input"
            />
            <div class="scrub-handle">
              <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                <circle cx="4" cy="3" r="1.5"/>
                <circle cx="4" cy="9" r="1.5"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Size -->
      <div class="prop-section">
        <span class="prop-label">SIZE</span>
        <div class="prop-row">
          <label>W</label>
          <div class="scrubbable-input-wrapper">
            <input 
              type="number" 
              :value="Math.round(element.width)" 
              @change="update('width', +$event.target.value)" 
              min="50"
              @mousedown="startScrubbing($event, 'width')"
              class="scrubbable-input"
            />
            <div class="scrub-handle">
              <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                <circle cx="4" cy="3" r="1.5"/>
                <circle cx="4" cy="9" r="1.5"/>
              </svg>
            </div>
          </div>
          <label>H</label>
          <div class="scrubbable-input-wrapper">
            <input 
              type="number" 
              :value="Math.round(element.height)" 
              @change="update('height', +$event.target.value)" 
              min="30"
              @mousedown="startScrubbing($event, 'height')"
              class="scrubbable-input"
            />
            <div class="scrub-handle">
              <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                <circle cx="4" cy="3" r="1.5"/>
                <circle cx="4" cy="9" r="1.5"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Rotation with scrubbing -->
      <div class="prop-section">
        <span class="prop-label">ROTATION</span>
        <div class="prop-row rotation-row">
          <div class="scrubbable-input-wrapper rotation-input">
            <input 
              type="number" 
              :value="Math.round(element.rotation || 0)" 
              @change="update('rotation', +$event.target.value)"
              @mousedown="startScrubbing($event, 'rotation')"
              class="scrubbable-input"
            />
            <div class="scrub-handle">
              <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                <circle cx="4" cy="3" r="1.5"/>
                <circle cx="4" cy="9" r="1.5"/>
              </svg>
            </div>
          </div>
          <span class="range-val">&deg;</span>
          <input type="range" min="-180" max="180" step="1" :value="element.rotation || 0" @input="update('rotation', +$event.target.value)" class="modern-range" />
        </div>
      </div>

      <!-- Opacity -->
      <div class="prop-section">
        <span class="prop-label">OPACITY</span>
        <div class="prop-row opacity-row">
          <div class="scrubbable-input-wrapper opacity-input">
            <input 
              type="number" 
              :value="Math.round((element.style?.opacity ?? 1) * 100)" 
              @change="updateStyle('opacity', $event.target.value / 100)"
              @mousedown="startScrubbing($event, 'opacity', true)"
              class="scrubbable-input"
              min="0"
              max="100"
            />
            <div class="scrub-handle">
              <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                <circle cx="4" cy="3" r="1.5"/>
                <circle cx="4" cy="9" r="1.5"/>
              </svg>
            </div>
          </div>
          <span class="range-val">%</span>
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="1" 
            :value="(element.style?.opacity ?? 1) * 100" 
            @input="updateStyle('opacity', $event.target.value / 100)" 
            class="modern-range" 
          />
        </div>
      </div>

      <!-- Z-Index -->
      <div class="prop-section">
        <span class="prop-label">LAYER</span>
        <div class="prop-row">
          <button class="small-btn" @click="update('z_index', (element.z_index || 0) - 1)">&#8595; Back</button>
          <span class="range-val">{{ element.z_index || 0 }}</span>
          <button class="small-btn" @click="update('z_index', (element.z_index || 0) + 1)">&#8593; Front</button>
        </div>
      </div>

      <!-- Alignment Tools -->
      <div class="prop-section">
        <span class="prop-label">ALIGNMENT</span>
        <div class="alignment-grid">
          <button class="align-btn" @click="alignLeft" title="Align Left">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="4" x2="4" y2="20"/><rect x="8" y="6" width="12" height="6"/><rect x="8" y="14" width="8" height="4"/>
            </svg>
          </button>
          <button class="align-btn" @click="alignCenter" title="Align Center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="4" x2="12" y2="20"/><rect x="6" y="6" width="12" height="6"/><rect x="8" y="14" height="4"/>
            </svg>
          </button>
          <button class="align-btn" @click="alignRight" title="Align Right">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="20" y1="4" x2="20" y2="20"/><rect x="4" y="6" width="12" height="6"/><rect x="8" y="14" width="8" height="4"/>
            </svg>
          </button>
          <button class="align-btn" @click="alignTop" title="Align Top">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="4" x2="20" y2="4"/><rect x="6" y="8" width="6" height="12"/><rect x="14" y="8" width="4" height="8"/>
            </svg>
          </button>
          <button class="align-btn" @click="alignMiddle" title="Align Middle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="12" x2="20" y2="12"/><rect x="6" y="6" width="6" height="12"/><rect x="14" y="8" width="4" height="8"/>
            </svg>
          </button>
          <button class="align-btn" @click="alignBottom" title="Align Bottom">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="20" x2="20" y2="20"/><rect x="6" y="4" width="6" height="12"/><rect x="14" y="8" width="4" height="8"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Corner Radius -->
      <div class="prop-section">
        <span class="prop-label">CORNER RADIUS</span>
        <div class="corner-radius-grid">
          <div class="corner-input">
            <label>All</label>
            <div class="scrubbable-input-wrapper small">
              <input 
                type="number" 
                :value="getBorderRadius() || 0" 
                @change="setBorderRadiusAll($event.target.value)"
                @mousedown="startScrubbing($event, 'borderRadiusAll')"
                class="scrubbable-input"
                min="0"
              />
              <div class="scrub-handle">
                <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                  <circle cx="4" cy="3" r="1.5"/>
                  <circle cx="4" cy="9" r="1.5"/>
                </svg>
              </div>
            </div>
          </div>
          <div class="corner-input">
            <label>TL</label>
            <div class="scrubbable-input-wrapper small">
              <input 
                type="number" 
                :value="getBorderRadius('topLeft') || 0" 
                @change="setBorderRadius('topLeft', $event.target.value)"
                @mousedown="startScrubbing($event, 'borderRadius', 'topLeft')"
                class="scrubbable-input"
                min="0"
              />
              <div class="scrub-handle">
                <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                  <circle cx="4" cy="3" r="1.5"/>
                  <circle cx="4" cy="9" r="1.5"/>
                </svg>
              </div>
            </div>
          </div>
          <div class="corner-input">
            <label>TR</label>
            <div class="scrubbable-input-wrapper small">
              <input 
                type="number" 
                :value="getBorderRadius('topRight') || 0" 
                @change="setBorderRadius('topRight', $event.target.value)"
                @mousedown="startScrubbing($event, 'borderRadius', 'topRight')"
                class="scrubbable-input"
                min="0"
              />
              <div class="scrub-handle">
                <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                  <circle cx="4" cy="3" r="1.5"/>
                  <circle cx="4" cy="9" r="1.5"/>
                </svg>
              </div>
            </div>
          </div>
          <div class="corner-input">
            <label>BL</label>
            <div class="scrubbable-input-wrapper small">
              <input 
                type="number" 
                :value="getBorderRadius('bottomLeft') || 0" 
                @change="setBorderRadius('bottomLeft', $event.target.value)"
                @mousedown="startScrubbing($event, 'borderRadius', 'bottomLeft')"
                class="scrubbable-input"
                min="0"
              />
              <div class="scrub-handle">
                <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                  <circle cx="4" cy="3" r="1.5"/>
                  <circle cx="4" cy="9" r="1.5"/>
                </svg>
              </div>
            </div>
          </div>
          <div class="corner-input">
            <label>BR</label>
            <div class="scrubbable-input-wrapper small">
              <input 
                type="number" 
                :value="getBorderRadius('bottomRight') || 0" 
                @change="setBorderRadius('bottomRight', $event.target.value)"
                @mousedown="startScrubbing($event, 'borderRadius', 'bottomRight')"
                class="scrubbable-input"
                min="0"
              />
              <div class="scrub-handle">
                <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                  <circle cx="4" cy="3" r="1.5"/>
                  <circle cx="4" cy="9" r="1.5"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Border -->
      <div class="prop-section">
        <span class="prop-label">BORDER</span>
        <div class="prop-row">
          <label>Width</label>
          <div class="scrubbable-input-wrapper">
            <input 
              type="number" 
              :value="element.style?.borderWidth || 0" 
              @change="updateStyle('borderWidth', +$event.target.value)"
              @mousedown="startScrubbing($event, 'borderWidth')"
              class="scrubbable-input"
              min="0"
              max="20"
            />
            <div class="scrub-handle">
              <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                <circle cx="4" cy="3" r="1.5"/>
                <circle cx="4" cy="9" r="1.5"/>
              </svg>
            </div>
          </div>
          <label>Color</label>
          <input 
            type="color" 
            :value="element.style?.borderColor || '#3e4c33'" 
            @change="updateStyle('borderColor', $event.target.value)" 
            class="border-color-input"
          />
        </div>
        <div class="prop-row" style="margin-top: 8px;">
          <label>Style</label>
          <select 
            :value="element.style?.borderStyle || 'solid'" 
            @change="updateStyle('borderStyle', $event.target.value)"
            class="border-style-select"
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
            <option value="none">None</option>
          </select>
        </div>
      </div>

      <!-- Shadow Effects -->
      <div class="prop-section shadow-section">
        <div class="section-header-with-icon">
          <span class="prop-label">SHADOW</span>
          <label class="toggle-switch">
            <input type="checkbox" :checked="!!element.style?.shadow" @change="toggleShadow($event.target.checked)" />
            <span class="toggle-slider"></span>
          </label>
        </div>
        
        <template v-if="element.style?.shadow">
          <div class="shadow-controls">
            <div class="prop-row">
              <label>X</label>
              <div class="scrubbable-input-wrapper small">
                <input 
                  type="number" 
                  :value="element.style.shadow.x || 0" 
                  @change="updateShadow('x', +$event.target.value)"
                  @mousedown="startScrubbing($event, 'shadowX')"
                  class="scrubbable-input"
                />
                <div class="scrub-handle">
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                    <circle cx="4" cy="3" r="1.5"/>
                    <circle cx="4" cy="9" r="1.5"/>
                  </svg>
                </div>
              </div>
              <label>Y</label>
              <div class="scrubbable-input-wrapper small">
                <input 
                  type="number" 
                  :value="element.style.shadow.y || 4" 
                  @change="updateShadow('y', +$event.target.value)"
                  @mousedown="startScrubbing($event, 'shadowY')"
                  class="scrubbable-input"
                />
                <div class="scrub-handle">
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                    <circle cx="4" cy="3" r="1.5"/>
                    <circle cx="4" cy="9" r="1.5"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="prop-row">
              <label>Blur</label>
              <div class="scrubbable-input-wrapper small">
                <input 
                  type="number" 
                  :value="element.style.shadow.blur || 8" 
                  @change="updateShadow('blur', +$event.target.value)"
                  @mousedown="startScrubbing($event, 'shadowBlur')"
                  class="scrubbable-input"
                  min="0"
                  max="100"
                />
                <div class="scrub-handle">
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                    <circle cx="4" cy="3" r="1.5"/>
                    <circle cx="4" cy="9" r="1.5"/>
                  </svg>
                </div>
              </div>
              <label>Spread</label>
              <div class="scrubbable-input-wrapper small">
                <input 
                  type="number" 
                  :value="element.style.shadow.spread || 0" 
                  @change="updateShadow('spread', +$event.target.value)"
                  @mousedown="startScrubbing($event, 'shadowSpread')"
                  class="scrubbable-input"
                  min="-50"
                  max="50"
                />
                <div class="scrub-handle">
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                    <circle cx="4" cy="3" r="1.5"/>
                    <circle cx="4" cy="9" r="1.5"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="prop-row">
              <label>Color</label>
              <input 
                type="color" 
                :value="element.style.shadow.color || '#000000'" 
                @change="updateShadow('color', $event.target.value)"
                class="shadow-color-input"
              />
              <label>Opacity</label>
              <div class="scrubbable-input-wrapper small">
                <input 
                  type="number" 
                  :value="Math.round((element.style.shadow.opacity || 0.25) * 100)" 
                  @change="updateShadow('opacity', +$event.target.value / 100)"
                  @mousedown="startScrubbing($event, 'shadowOpacity')"
                  class="scrubbable-input"
                  min="0"
                  max="100"
                />
                <div class="scrub-handle">
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                    <circle cx="4" cy="3" r="1.5"/>
                    <circle cx="4" cy="9" r="1.5"/>
                  </svg>
                </div>
              </div>
              <span class="range-val">%</span>
            </div>
          </div>
        </template>
      </div>

      <!-- Card-specific -->
      <template v-if="element.type === 'card'">
        <div class="prop-section">
          <span class="prop-label">CARD STYLE</span>
          <div class="prop-field">
            <label>Status</label>
            <select :value="element.content?.status || 'active'" @change="updateContent('status', $event.target.value)">
              <option value="active">Active</option>
              <option value="pipeline">Pipeline</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div class="prop-field">
            <label>Background</label>
            <input type="color" :value="element.style?.background || '#141412'" @change="updateStyle('background', $event.target.value)" />
          </div>
          <div class="prop-field">
            <label>Border</label>
            <input type="color" :value="element.style?.borderColor || '#3e4c33'" @change="updateStyle('borderColor', $event.target.value)" />
          </div>
        </div>
      </template>

      <!-- Text-specific -->
      <template v-if="element.type === 'text'">
        <div class="prop-section typography-section">
          <div class="section-header">
            <span class="prop-label">TYPOGRAPHY</span>
            <svg class="section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 7V4h16v3"/>
              <path d="M9 20h6"/>
              <path d="M12 4v16"/>
            </svg>
          </div>
          <div class="modern-font-field">
            <label class="field-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 7V4h16v3"/>
                <path d="M9 20h6"/>
              </svg>
              Font Family
            </label>
            <div class="modern-select-wrapper">
              <select :value="element.style?.fontFamily || ''" @change="updateStyle('fontFamily', $event.target.value)" class="modern-select">
                <option value="">Default (Space Mono)</option>
                <option v-for="f in allFontsList" :key="f.name" :value="f.name" :style="{ fontFamily: f.name }">{{ f.name }}</option>
              </select>
              <svg class="select-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </div>
          </div>
          <div class="prop-row-2col">
            <div class="prop-field">
              <label class="field-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                Size
              </label>
              <div class="input-with-unit">
                <input type="number" :value="element.font_size || 14" @change="update('font_size', +$event.target.value)" min="8" max="200" class="modern-input" />
                <span class="unit">px</span>
              </div>
            </div>
            <div class="prop-field">
              <label class="field-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                Weight
              </label>
              <div class="modern-select-wrapper">
                <select :value="element.style?.fontWeight || 'normal'" @change="updateStyle('fontWeight', $event.target.value)" class="modern-select">
                  <option value="300">Light</option>
                  <option value="normal">Normal</option>
                  <option value="600">Semi-bold</option>
                  <option value="bold">Bold</option>
                  <option value="800">Extra-bold</option>
                </select>
                <svg class="select-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </div>
            </div>
          </div>
          <div class="prop-row-2col">
            <div class="prop-field color-field">
              <label class="field-label">Text Color</label>
              <div class="color-picker-wrapper">
                <input type="color" :value="element.text_color || '#e2ded0'" @change="update('text_color', $event.target.value)" class="modern-color-input" />
                <span class="color-hex">{{ element.text_color || '#e2ded0' }}</span>
              </div>
            </div>
            <div class="prop-field">
              <label class="field-label">Line Height</label>
              <div class="input-with-unit">
                <input type="number" step="0.1" :value="element.style?.lineHeight || 1.5" @change="updateStyle('lineHeight', +$event.target.value)" min="1" max="4" class="modern-input" />
                <span class="unit">em</span>
              </div>
            </div>
          </div>
          <div class="prop-field">
            <label class="field-label">Letter Spacing</label>
            <div class="range-with-value">
              <input type="range" step="0.5" :value="parseFloat(element.style?.letterSpacing) || 0" @change="updateStyle('letterSpacing', $event.target.value + 'px')" min="-2" max="20" class="modern-range" />
              <span class="range-value">{{ parseFloat(element.style?.letterSpacing) || 0 }}px</span>
            </div>
          </div>
          <div class="checkbox-group">
            <label class="modern-checkbox">
              <input type="checkbox" :checked="element.content?.boxed" @change="updateContent('boxed', $event.target.checked)" />
              <span class="checkmark"></span>
              <span class="checkbox-label">Show Background Box</span>
            </label>
            <label class="modern-checkbox">
              <input type="checkbox" :checked="element.style?.permanentBox" @change="updateStyle('permanentBox', $event.target.checked)" />
              <span class="checkmark"></span>
              <span class="checkbox-label">Always Show Border</span>
            </label>
          </div>
        </div>
        
        <!-- Import font -->
        <div class="prop-section custom-font-section">
          <div class="section-header">
            <span class="prop-label accent">CUSTOM FONTS</span>
            <svg class="section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <p class="custom-font-hint">Upload your own fonts (.ttf, .otf, .woff, .woff2). They'll sync across your account.</p>
          <label class="upload-font-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span>Upload Font File</span>
            <input type="file" accept=".ttf,.otf,.woff,.woff2" @change="importFont" hidden />
          </label>
        </div>
      </template>

      <!-- Image-specific -->
      <template v-if="element.type === 'image'">
        <div class="prop-section">
          <span class="prop-label">IMAGE</span>
          <div class="prop-field">
            <label>URL</label>
            <input type="text" :value="element.content?.url || ''" @change="updateContent('url', $event.target.value)" placeholder="https://..." />
          </div>
          <div class="prop-field">
            <label>Upload</label>
            <label class="themed-file-button">
              <span>Choose Image</span>
              <input type="file" accept="image/*" @change="handleImageUpload" />
            </label>
          </div>
          <div class="prop-field">
            <label>Fit</label>
            <select :value="element.style?.objectFit || 'cover'" @change="updateStyle('objectFit', $event.target.value)">
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="fill">Fill</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>
      </template>

      <!-- Link/Button -->
      <template v-if="element.type === 'link' || element.type === 'button'">
        <div class="prop-section">
          <span class="prop-label">{{ element.type.toUpperCase() }}</span>
          <div class="prop-field">
            <label>URL</label>
            <input type="text" :value="element.content?.url || ''" @change="updateContent('url', $event.target.value)" placeholder="https://..." />
          </div>
          <div class="prop-field">
            <label>Label</label>
            <input type="text" :value="getLabel()" @change="updateLabel($event.target.value)" placeholder="Button text..." />
          </div>
        </div>
      </template>
    </div>

    <!-- LAYOUT TAB (Card only) -->
    <div v-if="tab === 'layout' && element.type === 'card'" class="panel-body">
      <div class="prop-section">
        <span class="prop-label">CARD CELLS</span>
        <p class="layout-hint">Configure individual cell styles below. Click a cell in the card to edit it directly.</p>
      </div>
      
      <div v-for="(cell, idx) in cardCells" :key="cell.id" class="cell-config">
        <div class="cell-config-header">
          <span class="cell-type-badge">{{ cell.type || 'Empty' }}</span>
          <span class="cell-index">#{{ idx + 1 }}</span>
        </div>
        
        <template v-if="cell.type === 'text'">
          <div class="prop-field">
            <label>Font Size</label>
            <input type="number" :value="cell.fontSize || 14" @change="updateCellProp(idx, 'fontSize', +$event.target.value)" min="8" max="72" />
          </div>
          <div class="prop-field">
            <label>Color</label>
            <input type="color" :value="cell.color || '#e2ded0'" @change="updateCellProp(idx, 'color', $event.target.value)" />
          </div>
          <div class="prop-field">
            <label>Weight</label>
            <select :value="cell.fontWeight || 'normal'" @change="updateCellProp(idx, 'fontWeight', $event.target.value)">
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
            </select>
          </div>
        </template>

        <template v-if="cell.type === 'image'">
          <div class="prop-field">
            <label>Height</label>
            <input type="number" :value="cell.height || 120" @change="updateCellProp(idx, 'height', +$event.target.value)" min="30" max="500" />
          </div>
          <div class="prop-field">
            <label>Fit</label>
            <select :value="cell.objectFit || 'cover'" @change="updateCellProp(idx, 'objectFit', $event.target.value)">
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
            </select>
          </div>
        </template>

        <template v-if="cell.type === 'button'">
          <div class="prop-field">
            <label>BG Color</label>
            <input type="color" :value="cell.bgColor || '#b55d3a'" @change="updateCellProp(idx, 'bgColor', $event.target.value)" />
          </div>
          <div class="prop-field">
            <label>Text Color</label>
            <input type="color" :value="cell.color || '#e2ded0'" @change="updateCellProp(idx, 'color', $event.target.value)" />
          </div>
          <div class="prop-field">
            <label>Font Size</label>
            <input type="number" :value="cell.fontSize || 13" @change="updateCellProp(idx, 'fontSize', +$event.target.value)" min="8" max="32" />
          </div>
        </template>
      </div>
    </div>

    <!-- TRANSLATIONS TAB -->
    <div v-if="tab === 'translations'" class="panel-body">
      <div class="prop-section">
        <span class="prop-label">TRANSLATIONS</span>
        <p class="trans-hint">Edit original (PT) and translations side by side. Changes auto-save.</p>
      </div>
      
      <!-- For text elements -->
      <template v-if="element.type === 'text'">
        <div v-for="lang in availableLangs" :key="lang" class="trans-lang-block">
          <span class="trans-lang-label">{{ langNames[lang] || lang.toUpperCase() }}</span>
          <textarea
            class="trans-textarea"
            :value="getTranslation(lang)"
            @input="setTranslation(lang, $event.target.value)"
            :placeholder="`${lang} text...`"
            rows="4"
          />
        </div>
      </template>

      <!-- For card elements -->
      <template v-if="element.type === 'card'">
        <div class="trans-section">
          <span class="trans-field-label">Title</span>
          <div v-for="lang in availableLangs" :key="'title-' + lang" class="trans-lang-block">
            <span class="trans-lang-label">{{ langNames[lang] || lang.toUpperCase() }}</span>
            <input
              type="text"
              class="trans-input"
              :value="getCardTitle(lang)"
              @input="setCardTitle(lang, $event.target.value)"
              :placeholder="`Title in ${lang}...`"
            />
          </div>
        </div>
        
        <!-- Card cell translations -->
        <div v-for="(cell, idx) in textCells" :key="'cell-' + cell.id" class="trans-section">
          <span class="trans-field-label">Cell #{{ getCellIndex(cell) + 1 }} ({{ cell.type }})</span>
          <div v-for="lang in availableLangs" :key="'cell-' + cell.id + '-' + lang" class="trans-lang-block">
            <span class="trans-lang-label">{{ langNames[lang] || lang.toUpperCase() }}</span>
            <textarea
              class="trans-textarea small"
              :value="getCellTranslation(cell, lang)"
              @input="setCellTranslation(getCellIndex(cell), lang, $event.target.value)"
              :placeholder="`${lang} text...`"
              rows="2"
            />
          </div>
        </div>
      </template>
    </div>

    <!-- Properties panel context menu -->
    <ContextMenu
      :is-visible="propertiesContextMenuVisible"
      :x="propertiesContextMenuPosition.x"
      :y="propertiesContextMenuPosition.y"
      :items="propertiesContextMenuItems"
      :title="propertiesContextMenuTitle"
      @update:is-visible="propertiesContextMenuVisible = $event"
      @action="handlePropertiesContextMenuAction"
    />
  </aside>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18nStore } from '../../../stores/i18n-store'
import { useElementsStore } from '../../../stores/elements'
import { useHistoryStore } from '../../../stores/history'
import { useAuthStore } from '../../../stores/auth'
import { useViewportStore } from '../../../stores/viewport'
import { supabase, isSupabaseConfigured } from '../../../lib/supabase'
import { useRoute } from 'vue-router'
import ContextMenu from '../../UI/ContextMenu.vue'
import { useContextMenu } from '../../../composables/useContextMenu'

const i18nStore = useI18nStore()
const elements = useElementsStore()
const history = useHistoryStore()
const auth = useAuthStore()
const route = useRoute()
const viewport = useViewportStore()

const { MenuItems } = useContextMenu()

// Properties panel context menu
const propertiesContextMenuVisible = ref(false)
const propertiesContextMenuPosition = ref({ x: 0, y: 0 })
const propertiesContextMenuItems = ref([])
const propertiesContextMenuTitle = 'Properties Panel'

function onPanelRightClick(e) {
  e.preventDefault()
  propertiesContextMenuPosition.value = { x: e.clientX, y: e.clientY }
  propertiesContextMenuItems.value = MenuItems.propertiesPanel(element.value)
  propertiesContextMenuVisible.value = true
}

function handlePropertiesContextMenuAction(action) {
  if (!element.value) return
  
  switch(action) {
    case 'reset-position':
      update('position_x', 0)
      update('position_y', 0)
      break
    case 'reset-size':
      // Reset to default size based on element type
      const defaults = {
        card: { width: 280, height: 370 },
        text: { width: 200, height: 60 },
        image: { width: 300, height: 200 },
        link: { width: 180, height: 44 },
        button: { width: 160, height: 44 }
      }
      const def = defaults[element.value.type] || { width: 200, height: 100 }
      update('width', def.width)
      update('height', def.height)
      break
    case 'reset-rotation':
      update('rotation', 0)
      break
    case 'reset-all':
      handlePropertiesContextMenuAction('reset-position')
      handlePropertiesContextMenuAction('reset-size')
      handlePropertiesContextMenuAction('reset-rotation')
      update('z_index', 0)
      break
    case 'copy-style':
      // Copy element style to clipboard
      const styleData = JSON.stringify(element.value.style || {})
      navigator.clipboard.writeText(styleData).catch(console.error)
      break
    case 'paste-style':
      // Paste style from clipboard
      navigator.clipboard.readText().then(text => {
        try {
          const style = JSON.parse(text)
          elements.updateElement(element.value.id, { style })
        } catch (e) {
          console.error('Failed to paste style:', e)
        }
      }).catch(console.error)
      break
  }
}

const tab = ref('design')
const element = computed(() => elements.selectedElement)
const hasText = computed(() => ['text', 'card', 'button', 'link'].includes(element.value?.type))

const availableLangs = ['pt', 'en']
const langNames = { pt: 'Portuguese (Original)', en: 'English' }

const systemFonts = [
  { name: 'Space Mono' }, { name: 'Inter' }, { name: 'Roboto' }, { name: 'Georgia' }, 
  { name: 'Arial' }, { name: 'Courier New' }, { name: 'Playfair Display' }, { name: 'Montserrat' },
  { name: 'Lato' }, { name: 'Oswald' }, { name: 'Raleway' }, { name: 'Poppins' },
  { name: 'Open Sans' }, { name: 'Nunito' }, { name: 'Merriweather' }, { name: 'Fira Code' }
]

const userCustomFonts = ref([])

// All fonts combined
const allFontsList = computed(() => [...userCustomFonts.value, ...systemFonts])

// Card-specific computed
const cardCells = computed(() => element.value?.content?.cells || [])
const textCells = computed(() => cardCells.value.filter(c => c.type === 'text' || c.type === 'button'))

function getCellIndex(cell) {
  return cardCells.value.findIndex(c => c.id === cell.id)
}

// Translation helpers
function getTranslation(lang) {
  const val = element.value?.content?.text
  if (!val) return ''
  if (typeof val === 'object') return val[lang] || ''
  return lang === 'pt' ? val : ''
}

let saveTimer = null
function setTranslation(lang, value) {
  if (!element.value) return
  const elementId = element.value.id
  const currentContent = element.value.content
  const currentText = currentContent?.text || {}
  const updated = typeof currentText === 'object'
    ? { ...currentText, [lang]: value }
    : { pt: currentText, [lang]: value }
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    elements.updateElement(elementId, {
      content: { ...currentContent, text: updated }
    })
  }, 500)
}

function getCardTitle(lang) {
  const val = element.value?.content?.title
  if (!val) return ''
  if (typeof val === 'object') return val[lang] || ''
  return lang === 'pt' ? val : ''
}

function setCardTitle(lang, value) {
  if (!element.value) return
  const currentContent = element.value.content
  const currentTitle = currentContent?.title || {}
  const updated = typeof currentTitle === 'object'
    ? { ...currentTitle, [lang]: value }
    : { pt: currentTitle, [lang]: value }
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    elements.updateElement(element.value.id, {
      content: { ...currentContent, title: updated }
    })
  }, 500)
}

function getCellTranslation(cell, lang) {
  const val = cell.text
  if (!val) return ''
  if (typeof val === 'object') return val[lang] || ''
  return lang === 'pt' ? val : ''
}

function setCellTranslation(idx, lang, value) {
  if (!element.value) return
  const cells = [...(element.value.content?.cells || [])]
  const cell = cells[idx]
  if (!cell) return
  const currentText = cell.text || {}
  const updated = typeof currentText === 'object'
    ? { ...currentText, [lang]: value }
    : { pt: currentText, [lang]: value }
  cells[idx] = { ...cell, text: updated }
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    elements.updateElement(element.value.id, {
      content: { ...element.value.content, cells }
    })
  }, 500)
}

// Label helper for buttons/links
function getLabel() {
  const val = element.value?.content?.label
  if (!val) return ''
  if (typeof val === 'object') return val[i18nStore.currentLocale] ?? val.pt ?? val.en ?? ''
  return val
}

function updateLabel(value) {
  const current = element.value?.content?.label
  let updated
  if (typeof current === 'object') updated = { ...current, [i18nStore.currentLocale]: value }
  else updated = { pt: value }
  updateContent('label', updated)
}

function update(key, value) {
  if (!element.value) return
  const prev = element.value[key]
  history.push({ action: 'update', elementId: element.value.id, state: { [key]: prev } })
  elements.updateElement(element.value.id, { [key]: value })
}

function updateContent(key, value) {
  if (!element.value) return
  const prevContent = { ...element.value.content }
  history.push({ action: 'update', elementId: element.value.id, state: { content: prevContent } })
  elements.updateElement(element.value.id, { content: { ...element.value.content, [key]: value } })
}

function updateStyle(key, value) {
  if (!element.value) return
  const prevStyle = { ...element.value.style }
  history.push({ action: 'update', elementId: element.value.id, state: { style: prevStyle } })
  elements.updateElement(element.value.id, { style: { ...(element.value.style || {}), [key]: value } })
}

function updateCellProp(idx, key, value) {
  if (!element.value) return
  const cells = [...(element.value.content?.cells || [])]
  cells[idx] = { ...cells[idx], [key]: value }
  elements.updateElement(element.value.id, { content: { ...element.value.content, cells } })
}

// ===== NEW ENHANCED FEATURES =====

// Scrubbing functionality for number inputs
let scrubbingState = ref(null)
let scrubbingStartY = 0
let scrubbingStartValue = 0
let scrubbingProperty = null
let scrubbingCorner = null
let scrubbingIsPercentage = false
let scrubbingElement = null

function startScrubbing(event, property, isPercentage = false, corner = null) {
  if (event.button !== 0) return // Only left click
  
  event.preventDefault()
  event.stopPropagation()
  const target = event.currentTarget.querySelector('input') || event.target
  
  scrubbingState.value = true
  scrubbingStartY = event.clientY
  scrubbingStartValue = parseFloat(target.value) || 0
  scrubbingProperty = property
  scrubbingCorner = corner
  scrubbingIsPercentage = isPercentage
  scrubbingElement = target
  
  document.addEventListener('mousemove', handleScrubbing)
  document.addEventListener('mouseup', stopScrubbing)
  
  // Change cursor to indicate dragging
  document.body.style.cursor = 'ns-resize'
  if (target) target.style.cursor = 'ns-resize'
}

function handleScrubbing(event) {
  if (!scrubbingState.value || !scrubbingProperty) return
  
  const deltaY = scrubbingStartY - event.clientY
  // Improved sensitivity - slower for fine control
  const sensitivity = 0.5
  let newValue = scrubbingStartValue + (deltaY * sensitivity)
  
  // Round to integers for most properties
  if (!scrubbingIsPercentage && scrubbingProperty !== 'shadowX' && scrubbingProperty !== 'shadowY') {
    newValue = Math.round(newValue)
  } else if (scrubbingIsPercentage) {
    newValue = Math.max(0, Math.min(100, Math.round(newValue * 10) / 10))
  }
  
  // Update the value based on property type
  if (scrubbingProperty === 'borderRadiusAll') {
    setBorderRadiusAll(newValue)
  } else if (scrubbingProperty === 'borderRadius') {
    setBorderRadius(scrubbingCorner, newValue)
  } else if (['shadowX', 'shadowY', 'shadowBlur', 'shadowSpread', 'shadowOpacity'].includes(scrubbingProperty)) {
    const shadowProp = scrubbingProperty.replace('shadow', '').replace(/^./, c => c.toLowerCase())
    updateShadow(shadowProp, newValue)
  } else if (scrubbingProperty === 'opacity') {
    updateStyle('opacity', Math.max(0, Math.min(1, newValue / 100)))
  } else {
    update(scrubbingProperty, newValue)
  }
}

function stopScrubbing() {
  scrubbingState.value = null
  scrubbingProperty = null
  scrubbingCorner = null
  scrubbingIsPercentage = false
  
  document.removeEventListener('mousemove', handleScrubbing)
  document.removeEventListener('mouseup', stopScrubbing)
  document.body.style.cursor = ''
  if (scrubbingElement) scrubbingElement.style.cursor = ''
  scrubbingElement = null
}

// Transform functions
function flipHorizontal() {
  if (!element.value) return
  // Toggle scaleX between 1 and -1 (or multiply current by -1)
  const currentScale = element.value.style?.scaleX ?? 1
  updateStyle('scaleX', currentScale * -1)
}

function flipVertical() {
  if (!element.value) return
  // Toggle scaleY between 1 and -1 (or multiply current by -1)
  const currentScale = element.value.style?.scaleY ?? 1
  updateStyle('scaleY', currentScale * -1)
}

function resetTransforms() {
  if (!element.value) return
  // Reset rotation, scale, and position
  const prevStyle = { ...element.value.style }
  history.push({ 
    action: 'update', 
    elementId: element.value.id, 
    state: { 
      rotation: element.value.rotation,
      style: prevStyle 
    } 
  })
  
  elements.updateElement(element.value.id, { 
    rotation: 0,
    style: { 
      ...(element.value.style || {}), 
      scaleX: 1, 
      scaleY: 1 
    } 
  })
}

// Alignment functions - align relative to canvas viewport
function getCanvasBounds() {
  // Get visible canvas area in world coordinates
  const viewport = elements.viewport || useViewportStore()
  const width = window.innerWidth
  const height = window.innerHeight
  
  // Calculate visible canvas bounds in world space
  const left = -viewport.translateX / viewport.zoom
  const top = -viewport.translateY / viewport.zoom
  const right = (width - viewport.translateX) / viewport.zoom
  const bottom = (height - viewport.translateY) / viewport.zoom
  
  return { left, top, right, bottom, width: right - left, height: bottom - top }
}

function alignLeft() {
  if (!element.value) return
  const bounds = getCanvasBounds()
  // Align left edge to visible canvas left edge
  update('position_x', Math.round(bounds.left))
}

function alignCenter() {
  if (!element.value) return
  const bounds = getCanvasBounds()
  // Center horizontally in visible canvas
  const centerX = bounds.left + (bounds.width / 2) - (element.value.width / 2)
  update('position_x', Math.round(centerX))
}

function alignRight() {
  if (!element.value) return
  const bounds = getCanvasBounds()
  // Align right edge to visible canvas right edge
  update('position_x', Math.round(bounds.right - element.value.width))
}

function alignTop() {
  if (!element.value) return
  const bounds = getCanvasBounds()
  // Align top edge to visible canvas top edge
  update('position_y', Math.round(bounds.top))
}

function alignMiddle() {
  if (!element.value) return
  const bounds = getCanvasBounds()
  // Center vertically in visible canvas
  const centerY = bounds.top + (bounds.height / 2) - (element.value.height / 2)
  update('position_y', Math.round(centerY))
}

function alignBottom() {
  if (!element.value) return
  const bounds = getCanvasBounds()
  // Align bottom edge to visible canvas bottom edge
  update('position_y', Math.round(bounds.bottom - element.value.height))
}

// Border radius functions - returns value in px
function getBorderRadius(corner = null) {
  if (!element.value?.style?.borderRadius) return 0
  
  const radius = element.value.style.borderRadius
  
  // If it's a number, use it directly
  if (typeof radius === 'number') {
    if (corner) return radius
    return radius
  }
  
  // If it's an object with corner properties
  if (typeof radius === 'object' && radius !== null) {
    if (corner) return radius[corner] || 0
    // Return average or topLeft for "all"
    return radius.topLeft || radius.topRight || radius.bottomRight || radius.bottomLeft || 0
  }
  
  // If it's a string (CSS format), parse it
  if (typeof radius === 'string') {
    const values = radius.split(' ').map(v => {
      const num = parseFloat(v)
      return isNaN(num) ? 0 : num
    })
    
    if (corner) {
      const corners = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft']
      const idx = corners.indexOf(corner)
      // CSS shorthand: 1 value (all), 2 values (tl/br, tr/bl), 3 values, or 4 values
      if (values.length === 1) return values[0]
      if (values.length === 2) return values[idx % 2]
      if (values.length === 3) return values[idx === 2 ? 2 : idx === 3 ? 1 : idx]
      return values[idx] || values[0] || 0
    }
    return values[0] || 0
  }
  
  return 0
}

function setBorderRadiusAll(value) {
  if (!element.value) return
  const numValue = Math.max(0, parseInt(value) || 0)
  updateStyle('borderRadius', numValue)
}

function setBorderRadius(corner, value) {
  if (!element.value) return
  
  const current = element.value.style?.borderRadius || 0
  let borderRadius = {}
  
  // Initialize borderRadius object based on current value type
  if (typeof current === 'number') {
    borderRadius = { 
      topLeft: current, 
      topRight: current, 
      bottomRight: current, 
      bottomLeft: current 
    }
  } else if (typeof current === 'string') {
    const values = current.split(' ').map(v => parseFloat(v) || 0)
    borderRadius = {
      topLeft: values[0] || 0,
      topRight: values[1] || values[0] || 0,
      bottomRight: values[2] || values[0] || 0,
      bottomLeft: values[3] || values[0] || 0
    }
  } else if (typeof current === 'object' && current !== null) {
    borderRadius = { ...current }
  } else {
    borderRadius = { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 }
  }
  
  // Update the specific corner
  borderRadius[corner] = Math.max(0, parseInt(value) || 0)
  
  // Store as object - will be converted to CSS in the render component
  updateStyle('borderRadius', borderRadius)
}

// Shadow functions
function toggleShadow(enabled) {
  if (!element.value) return
  
  if (enabled) {
    updateStyle('shadow', {
      x: 0,
      y: 4,
      blur: 8,
      spread: 0,
      color: '#000000',
      opacity: 0.25
    })
  } else {
    updateStyle('shadow', null)
  }
}

function updateShadow(prop, value) {
  if (!element.value) return
  
  const currentShadow = { ...element.value.style?.shadow }
  const updatedShadow = { ...currentShadow, [prop]: value }
  
  updateStyle('shadow', updatedShadow)
}

// Helper to generate CSS box-shadow from shadow object
function getBoxShadow() {
  const shadow = element.value?.style?.shadow
  if (!shadow) return 'none'
  
  const { x = 0, y = 4, blur = 8, spread = 0, color = '#000000', opacity = 0.25 } = shadow
  const rgbaColor = hexToRgba(color, opacity)
  return `${x}px ${y}px ${blur}px ${spread}px ${rgbaColor}`
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// ===== END NEW ENHANCED FEATURES =====

async function handleImageUpload(e) {
  const file = e.target.files?.[0]
  if (!file || !isSupabaseConfigured) return
  const projectId = route.params.projectId
  const ext = file.name.split('.').pop()
  const path = `canvas/${projectId}/${element.value.id}.${ext}`
  const { error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true, contentType: file.type })
  if (error) { console.error('[Upload] Failed:', error.message); return }
  const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path)
  if (urlData?.publicUrl) updateContent('url', urlData.publicUrl)
}

async function importFont(e) {
  const file = e.target.files?.[0]
  if (!file || !isSupabaseConfigured) return
  
  const ext = file.name.split('.').pop()
  const fontName = file.name.replace(/\.[^.]+$/, '')
  const path = `fonts/${auth.userId}/${fontName}.${ext}`
  
  const { error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true, contentType: 'font/' + ext })
  if (error) { 
    console.error('[Font] Upload failed:', error.message)
    alert('Failed to upload font. Please try again.')
    return 
  }
  
  const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path)
  if (urlData?.publicUrl) {
    // Load font in browser
    const style = document.createElement('style')
    style.textContent = `@font-face { font-family: '${fontName}'; src: url('${urlData.publicUrl}'); }`
    document.head.appendChild(style)
    
    // Save to database
    await supabase.from('custom_fonts').upsert({ 
      user_id: auth.userId, 
      font_name: fontName, 
      file_url: urlData.publicUrl 
    })
    
    // Add to local font list
    userCustomFonts.value.push({ name: fontName, isCustom: true })
    
    // Apply the font
    updateStyle('fontFamily', fontName)
  }
}

// Load user's custom fonts
async function loadUserFonts() {
  if (!isSupabaseConfigured || !auth.userId) return
  
  const { data, error } = await supabase
    .from('custom_fonts')
    .select('*')
    .eq('user_id', auth.userId)
  
  if (!error && data) {
    for (const font of data) {
      try {
        const style = document.createElement('style')
        style.textContent = `@font-face { font-family: '${font.font_name}'; src: url('${font.file_url}'); }`
        document.head.appendChild(style)
        userCustomFonts.value.push({ name: font.font_name, isCustom: true })
      } catch (err) {
        console.error('Failed to load custom font:', font.font_name, err)
      }
    }
  }
}

// Load fonts on mount
onMounted(() => {
  loadUserFonts()
})
</script>

<style scoped>
.properties-panel {
  position: fixed;
  right: 0;
  top: 60px;
  bottom: 0;
  width: clamp(240px, 25vw, 320px);
  max-width: clamp(200px, 20vw, 280px);
  background: rgba(20, 20, 18, 0.98);
  border-left: 1px solid var(--moss);
  backdrop-filter: blur(12px);
  z-index: 900;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: clamp(220px, 22vw, 300px);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: clamp(0.7rem, 1.2vh, 1rem);
  border-bottom: 1px solid var(--moss);
  flex-shrink: 0;
}

.panel-header h3 {
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.7rem, 1.1vw, 0.8rem);
  color: var(--stencil-orange);
  letter-spacing: 0.1em;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--moss-light);
  font-size: clamp(1rem, 1.5vw, 1.2rem);
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}
.close-btn:hover { color: var(--paper); }

.panel-tabs {
  display: flex;
  border-bottom: 1px solid var(--moss);
  flex-shrink: 0;
}

.panel-tabs button {
  flex: 1;
  padding: clamp(0.5rem, 0.8vh, 0.6rem);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--moss-light);
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.55rem, 0.9vw, 0.65rem);
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.panel-tabs button.active { color: var(--terracotta); border-bottom-color: var(--terracotta); }
.panel-tabs button:hover:not(.active) { color: var(--paper); }

.panel-body {
  padding: clamp(0.6rem, 1vh, 0.75rem);
  display: flex;
  flex-direction: column;
  gap: clamp(0.6rem, 0.8vh, 0.75rem);
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
}

.prop-section { 
  display: flex; 
  flex-direction: column; 
  gap: clamp(0.3rem, 0.5vh, 0.4rem);
  min-width: 0;
}

.prop-label {
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.5rem, 0.8vw, 0.6rem);
  color: var(--moss);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prop-row { 
  display: flex; 
  align-items: center; 
  gap: clamp(0.3rem, 0.5vw, 0.4rem);
  flex-wrap: wrap;
}
.prop-row label { 
  font-family: 'Space Mono', monospace; 
  font-size: clamp(0.55rem, 0.9vw, 0.65rem); 
  color: var(--moss-light); 
  min-width: clamp(1rem, 2vw, 1.5rem);
  white-space: nowrap;
}
.prop-row input[type="number"] { 
  flex: 1; 
  background: rgba(255,255,255,0.05); 
  border: 1px solid rgba(255,255,255,0.1); 
  color: var(--paper); 
  padding: clamp(0.25rem, 0.4vh, 0.3rem) clamp(0.3rem, 0.5vw, 0.4rem); 
  font-family: 'Space Mono', monospace; 
  font-size: clamp(0.65rem, 1vw, 0.75rem); 
  width: clamp(50px, 8vw, 60px); 
  border-radius: 2px;
  min-width: 0;
}
.prop-row input[type="range"] { 
  flex: 1; 
  accent-color: var(--terracotta);
  min-width: 0;
}
.range-val { 
  font-family: 'Space Mono', monospace; 
  font-size: clamp(0.6rem, 0.9vw, 0.7rem); 
  color: var(--paper); 
  min-width: clamp(2rem, 4vw, 2.5rem); 
  text-align: center;
  white-space: nowrap;
}

.prop-field { 
  display: flex; 
  align-items: center; 
  gap: clamp(0.4rem, 0.6vw, 0.5rem);
  flex-wrap: wrap;
}
.prop-field label { 
  font-family: 'Space Mono', monospace; 
  font-size: clamp(0.55rem, 0.9vw, 0.65rem); 
  color: var(--moss-light); 
  min-width: clamp(3rem, 5vw, 4.5rem); 
  display: flex; 
  align-items: center; 
  gap: clamp(0.2rem, 0.3vw, 0.3rem);
  white-space: nowrap;
}
.prop-field input[type="text"], 
.prop-field select { 
  flex: 1; 
  background: rgba(13, 13, 13, 0.8); 
  border: 1px solid rgba(62, 76, 51, 0.4); 
  color: var(--paper); 
  padding: clamp(0.3rem, 0.5vh, 0.35rem) clamp(0.4rem, 0.6vw, 0.5rem); 
  font-family: 'Space Mono', monospace; 
  font-size: clamp(0.65rem, 1vw, 0.75rem); 
  border-radius: 3px;
  min-width: 0;
}
.prop-field input[type="text"]:focus,
.prop-field select:focus {
  outline: none;
  border-color: var(--terracotta);
  background: rgba(13, 13, 13, 0.95);
}
.prop-field input[type="number"] { 
  flex: 1; 
  background: rgba(13, 13, 13, 0.8); 
  border: 1px solid rgba(62, 76, 51, 0.4); 
  color: var(--paper); 
  padding: clamp(0.3rem, 0.5vh, 0.35rem) clamp(0.4rem, 0.6vw, 0.5rem); 
  font-family: 'Space Mono', monospace; 
  font-size: clamp(0.65rem, 1vw, 0.75rem); 
  width: clamp(50px, 8vw, 60px); 
  border-radius: 2px;
  min-width: 0;
}
.prop-field input[type="color"] { 
  width: clamp(28px, 4vw, 36px); 
  height: clamp(22px, 3vh, 26px); 
  border: 1px solid var(--moss); 
  background: rgba(13, 13, 13, 0.8); 
  cursor: pointer; 
  padding: 0; 
  border-radius: 3px;
  flex-shrink: 0;
}
.prop-field input[type="checkbox"] { 
  accent-color: var(--terracotta); 
  width: clamp(14px, 2vw, 16px); 
  height: clamp(14px, 2vw, 16px);
  flex-shrink: 0;
}
.prop-field input[type="file"], 
.file-input { 
  font-size: clamp(0.55rem, 0.8vw, 0.65rem); 
  color: var(--moss-light); 
  max-width: clamp(120px, 18vw, 140px);
  min-width: 0;
}

/* Themed File Upload Button */
.themed-file-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: clamp(0.5rem, 0.8vh, 0.6rem) clamp(0.8rem, 1.2vw, 1rem);
  background: linear-gradient(135deg, rgba(181, 93, 58, 0.3) 0%, rgba(181, 93, 58, 0.15) 100%);
  border: 1px solid var(--terracotta);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Space Mono', monospace;
  font-size: clamp(0.6rem, 0.9vw, 0.7rem);
  color: var(--paper);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  min-width: clamp(120px, 15vw, 160px);
  max-width: clamp(140px, 18vw, 180px);
  position: relative;
  overflow: hidden;
}

.themed-file-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  transition: left 0.5s ease;
}

.themed-file-button:hover::before {
  left: 100%;
}

.themed-file-button:hover {
  background: linear-gradient(135deg, rgba(181, 93, 58, 0.4) 0%, rgba(181, 93, 58, 0.25) 100%);
  border-color: var(--stencil-orange);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(181, 93, 58, 0.3);
}

.themed-file-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(181, 93, 58, 0.2);
}

.themed-file-button input[type="file"] {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.checkbox-field label { 
  flex-direction: row; 
  gap: clamp(0.4rem, 0.6vw, 0.5rem);
  white-space: nowrap;
}

.font-selector select { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: var(--paper); padding: 0.35rem 0.5rem; font-size: 0.75rem; border-radius: 2px; }

.font-hint { font-family: 'Space Mono', monospace; font-size: 0.6rem; color: var(--moss-light); margin: 0.25rem 0 0; }

.small-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: var(--paper); padding: 0.3rem 0.6rem; font-family: 'Space Mono', monospace; font-size: 0.65rem; cursor: pointer; transition: all 0.15s; border-radius: 2px; }
.small-btn:hover { border-color: var(--moss); background: rgba(106,125,91,0.15); }

/* Layout tab */
.layout-hint { font-family: 'Space Mono', monospace; font-size: 0.65rem; color: var(--moss-light); margin: 0; line-height: 1.4; }

.cell-config {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.1);
  padding: 0.75rem;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.cell-config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.cell-type-badge {
  font-family: 'Space Mono', monospace;
  font-size: 0.6rem;
  color: var(--stencil-orange);
  background: rgba(255, 95, 31, 0.15);
  padding: 0.2rem 0.5rem;
  border-radius: 2px;
  text-transform: uppercase;
}

.cell-index {
  font-family: 'Space Mono', monospace;
  font-size: 0.6rem;
  color: var(--moss-light);
}

/* Translations tab */
.trans-hint { font-family: 'Space Mono', monospace; font-size: 0.65rem; color: var(--moss-light); margin: 0; line-height: 1.4; }

.trans-section {
  border-top: 1px solid rgba(106,125,91,0.2);
  padding-top: 0.75rem;
  margin-top: 0.5rem;
}

.trans-field-label {
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  color: var(--paper);
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: block;
}

.trans-lang-block { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 0.5rem; }

.trans-lang-label { font-family: 'Space Mono', monospace; font-size: 0.6rem; color: var(--stencil-orange); text-transform: uppercase; letter-spacing: 0.05em; }

.trans-textarea, .trans-input {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: var(--paper);
  padding: 0.5rem 0.6rem;
  font-family: inherit;
  font-size: 0.85rem;
  resize: vertical;
  line-height: 1.4;
  border-radius: 2px;
  width: 100%;
  box-sizing: border-box;
}
.trans-textarea:focus, .trans-input:focus { outline: none; border-color: var(--terracotta); }
.trans-textarea.small { font-size: 0.8rem; }

/* Modernized 2026 Design Styles */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(106, 125, 91, 0.2);
}

.section-header .prop-label {
  font-family: 'Space Mono', monospace;
  font-size: 0.65rem;
  color: var(--moss);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin: 0;
}

.section-header .prop-label.accent {
  color: var(--stencil-orange);
}

.section-icon {
  color: var(--moss-light);
  opacity: 0.7;
}

.modern-font-field {
  margin-bottom: 12px;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  color: var(--moss-light);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.field-label svg {
  opacity: 0.7;
}

.modern-select-wrapper {
  position: relative;
}

.modern-select {
  width: 100%;
  padding: 10px 36px 10px 12px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.03) 100%);
  border: 1px solid rgba(106, 125, 91, 0.3);
  border-radius: 6px;
  color: var(--paper);
  font-family: 'Space Mono', monospace;
  font-size: 0.8rem;
  cursor: pointer;
  appearance: none;
  transition: all 0.2s;
}

.modern-select:hover {
  border-color: rgba(106, 125, 91, 0.5);
  background: rgba(255, 255, 255, 0.07);
}

.modern-select:focus {
  outline: none;
  border-color: var(--terracotta);
  box-shadow: 0 0 0 3px rgba(181, 93, 58, 0.15);
}

.select-chevron {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--moss-light);
  pointer-events: none;
  width: 14px;
  height: 14px;
}

.prop-row-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.input-with-unit {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-unit .modern-input {
  width: 100%;
  padding: 10px 36px 10px 12px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.03) 100%);
  border: 1px solid rgba(106, 125, 91, 0.3);
  border-radius: 6px;
  color: var(--paper);
  font-family: 'Space Mono', monospace;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.input-with-unit .modern-input:focus {
  outline: none;
  border-color: var(--terracotta);
  box-shadow: 0 0 0 3px rgba(181, 93, 58, 0.15);
}

.input-with-unit .unit {
  position: absolute;
  right: 10px;
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  color: var(--moss-light);
  pointer-events: none;
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(106, 125, 91, 0.2);
  border-radius: 6px;
}

.modern-color-input {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(106, 125, 91, 0.4);
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
  padding: 0;
}

.modern-color-input::-webkit-color-swatch-wrapper {
  padding: 0;
  border-radius: 3px;
}

.modern-color-input::-webkit-color-swatch {
  border: none;
  border-radius: 3px;
}

.modern-color-input::-moz-color-swatch {
  border: none;
  border-radius: 3px;
}

.color-hex {
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  color: var(--moss-light);
  text-transform: uppercase;
}

.range-with-value {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modern-range {
  flex: 1;
  height: 4px;
  background: rgba(106, 125, 91, 0.3);
  border-radius: 2px;
  appearance: none;
  accent-color: var(--terracotta);
}

.modern-range::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--terracotta);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.modern-range::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 4px rgba(181, 93, 58, 0.2);
}

.range-value {
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  color: var(--paper);
  min-width: 36px;
  text-align: right;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}

.modern-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.modern-checkbox input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkmark {
  width: 20px;
  height: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(106, 125, 91, 0.4);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.modern-checkbox input[type="checkbox"]:checked + .checkmark {
  background: linear-gradient(135deg, rgba(181, 93, 58, 0.4) 0%, rgba(181, 93, 58, 0.3) 100%);
  border-color: var(--terracotta);
}

.modern-checkbox input[type="checkbox"]:checked + .checkmark::after {
  content: '✓';
  font-size: 14px;
  color: var(--paper);
  font-weight: bold;
}

.checkbox-label {
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  color: var(--paper);
}

.custom-font-section {
  background: linear-gradient(180deg, rgba(255, 95, 31, 0.05) 0%, rgba(255, 95, 31, 0.02) 100%);
  border: 1px solid rgba(255, 95, 31, 0.2);
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
}

.custom-font-hint {
  font-family: 'Space Mono', monospace;
  font-size: 0.65rem;
  color: var(--moss-light);
  line-height: 1.5;
  margin: 0 0 12px 0;
}

.upload-font-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(106, 125, 91, 0.15) 0%, rgba(106, 125, 91, 0.08) 100%);
  border: 1px dashed rgba(106, 125, 91, 0.4);
  border-radius: 8px;
  color: var(--paper);
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.upload-font-button:hover {
  background: linear-gradient(135deg, rgba(106, 125, 91, 0.25) 0%, rgba(106, 125, 91, 0.15) 100%);
  border-color: var(--terracotta);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.upload-font-button svg {
  color: var(--stencil-orange);
}

.upload-font-button span {
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  font-weight: 600;
}

.typography-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(106, 125, 91, 0.15);
  border-radius: 8px;
  padding: 12px;
}

/* Themed Overflow - Black Background for Selects */
select,
.modern-select,
.properties-panel select {
  background: linear-gradient(180deg, rgba(13, 13, 13, 0.95) 0%, rgba(20, 20, 18, 0.95) 100%) !important;
  color: var(--paper) !important;
  border: 1px solid rgba(106, 125, 91, 0.3) !important;
}

/* Style the dropdown options */
.properties-panel option {
  background: rgba(13, 13, 13, 0.98) !important;
  color: var(--paper) !important;
  padding: 8px !important;
}

/* Custom scrollbar for properties panel */
.panel-body::-webkit-scrollbar {
  width: 6px;
}

.panel-body::-webkit-scrollbar-track {
  background: rgba(13, 13, 13, 0.5);
}

.panel-body::-webkit-scrollbar-thumb {
  background: rgba(106, 125, 91, 0.4);
  border-radius: 3px;
}

.panel-body::-webkit-scrollbar-thumb:hover {
  background: rgba(106, 125, 91, 0.6);
}

/* Firefox scrollbar */
.panel-body {
  scrollbar-width: thin;
  scrollbar-color: rgba(106, 125, 91, 0.4) rgba(13, 13, 13, 0.5);
}

/* ===== ENHANCED DESIGN FEATURES STYLES ===== */

/* Section header with icon */
.section-header-with-icon {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

/* Transform buttons */
.transform-buttons {
  display: flex;
  gap: 4px;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(106, 125, 91, 0.3);
  border-radius: 4px;
  color: var(--moss-light);
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}

.icon-btn:hover {
  background: rgba(181, 93, 58, 0.2);
  border-color: var(--terracotta);
  color: var(--paper);
}

.icon-btn:active {
  transform: scale(0.95);
}

/* Scrubbable input wrapper */
.scrubbable-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
}

.scrubbable-input-wrapper.small {
  flex: 0 0 auto;
  width: 70px;
}

.scrubbable-input {
  width: 100%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.03) 100%);
  border: 1px solid rgba(106, 125, 91, 0.3);
  border-radius: 4px;
  color: var(--paper);
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  padding: 6px 24px 6px 8px;
  transition: all 0.2s;
  cursor: ew-resize;
}

.scrubbable-input:hover {
  border-color: rgba(106, 125, 91, 0.5);
  background: rgba(255, 255, 255, 0.07);
}

.scrubbable-input:focus {
  outline: none;
  border-color: var(--terracotta);
  box-shadow: 0 0 0 3px rgba(181, 93, 58, 0.15);
}

.scrub-handle {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--moss-light);
  opacity: 0.5;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.scrubbable-input-wrapper:hover .scrub-handle {
  opacity: 1;
  color: var(--terracotta);
}

/* Rotation row */
.rotation-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rotation-input {
  flex: 0 0 70px;
}

/* Opacity row */
.opacity-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.opacity-input {
  flex: 0 0 60px;
}

/* Alignment grid */
.alignment-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  margin-top: 8px;
}

.align-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(106, 125, 91, 0.3);
  border-radius: 4px;
  color: var(--moss-light);
  cursor: pointer;
  transition: all 0.2s;
  padding: 4px;
}

.align-btn:hover {
  background: rgba(181, 93, 58, 0.2);
  border-color: var(--terracotta);
  color: var(--paper);
}

.align-btn:active {
  transform: scale(0.9);
}

/* Corner radius grid */
.corner-radius-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 8px;
  align-items: end;
}

.corner-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.corner-input label {
  font-family: 'Space Mono', monospace;
  font-size: 0.6rem;
  color: var(--moss-light);
  text-align: center;
  text-transform: uppercase;
}

/* Border controls */
.border-color-input {
  width: 36px;
  height: 28px;
  border: 1px solid rgba(106, 125, 91, 0.4);
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  padding: 0;
}

.border-style-select {
  flex: 1;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.03) 100%);
  border: 1px solid rgba(106, 125, 91, 0.3);
  border-radius: 4px;
  color: var(--paper);
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  padding: 6px 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.border-style-select:hover {
  border-color: rgba(106, 125, 91, 0.5);
}

.border-style-select:focus {
  outline: none;
  border-color: var(--terracotta);
  box-shadow: 0 0 0 3px rgba(181, 93, 58, 0.15);
}

/* Shadow section */
.shadow-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(106, 125, 91, 0.15);
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
}

.shadow-controls {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.shadow-color-input {
  width: 36px;
  height: 28px;
  border: 1px solid rgba(106, 125, 91, 0.4);
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  padding: 0;
}

/* Toggle switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(106, 125, 91, 0.3);
  transition: 0.3s;
  border-radius: 20px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: var(--moss-light);
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: rgba(181, 93, 58, 0.6);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(20px);
  background-color: var(--paper);
}

.toggle-switch input:focus + .toggle-slider {
  box-shadow: 0 0 0 3px rgba(181, 93, 58, 0.15);
}

/* Card style section */
.card-style-section {
  background: linear-gradient(180deg, rgba(255, 95, 31, 0.05) 0%, rgba(255, 95, 31, 0.02) 100%);
  border: 1px solid rgba(255, 95, 31, 0.2);
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
}

/* Image section */
.image-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(106, 125, 91, 0.15);
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
}

/* Link/Button section */
.link-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(106, 125, 91, 0.15);
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
}

/* Hover state for scrubbing */
body[style*="cursor: ns-resize"] .scrubbable-input {
  user-select: none;
}

/* Animation for value changes */
@keyframes valueChange {
  from {
    background: rgba(181, 93, 58, 0.3);
  }
  to {
    background: transparent;
  }
}

.scrubbable-input.changed {
  animation: valueChange 0.3s ease-out;
}
</style>
