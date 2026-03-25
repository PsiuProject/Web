// Translation service
// Batches all pending translatable fields into a single DeepL call per project.
// Triggers only when text looks like a complete sentence/phrase.
// Handles: title, description, kpi_label, kpi_detail, meta[].value, content_blocks.content
import { supabase } from '../lib/supabase'

const BATCH_DELAY_MS = 4000
// Complete if: ends with punctuation OR is 30+ chars (a real phrase, not a single word)
const COMPLETE_RE = /[.!?…]\s*$|.{30,}/

// pending: Map<projectId, Map<fieldKey, {text, lang}>>
const pending = new Map()
let timer = null

// Callback for translation status updates (optional, can be set by UI components)
export let onTranslationStatus = null

function isComplete(text) {
  return COMPLETE_RE.test(text?.trim() ?? '')
}

function schedule() {
  clearTimeout(timer)
  timer = setTimeout(flush, BATCH_DELAY_MS)
}

async function flush() {
  if (!pending.size) return
  const snapshot = new Map(pending)
  pending.clear()

  for (const [projectId, fields] of snapshot) {
    const keys = [...fields.keys()]
    const texts = keys.map(k => fields.get(k).text)
    const sourceLang = fields.values().next().value.lang

    try {
      // Notify start of translation
      if (onTranslationStatus) {
        onTranslationStatus({ type: 'start', projectId, textsCount: texts.length })
      }

      const { data, error } = await supabase.functions.invoke('translate', {
        body: { texts, sourceLang }
      })

      if (error) {
        console.error('[translate] Edge Function error:', error)
        if (onTranslationStatus) {
          onTranslationStatus({ type: 'error', projectId, error: error.message })
        }
        continue
      }

      if (!data?.translations) {
        console.warn('[translate] No translations returned')
        if (onTranslationStatus) {
          onTranslationStatus({ type: 'error', projectId, error: 'No translations returned' })
        }
        continue
      }

      // Log metadata if available
      if (data.metadata) {
        console.log(`[translate] Processed ${data.metadata.textsProcessed} texts (${data.metadata.characterCount} chars)` +
          (data.metadata.usedFallback ? ' (using LibreTranslate fallback)' : ''))
        
        if (onTranslationStatus) {
          onTranslationStatus({ 
            type: 'complete', 
            projectId, 
            metadata: data.metadata 
          })
        }
      } else if (onTranslationStatus) {
        onTranslationStatus({ type: 'complete', projectId })
      }

      // Build DB update — each field becomes full JSONB {pt, en}
      const updates = {}
      keys.forEach((key, i) => {
        const t = data.translations[i]
        // key may be a dot-path for nested fields e.g. "meta.2.value"
        if (!key.startsWith('meta.')) {
          updates[key] = t
        }
      })

      // Handle meta separately — need to patch the array
      const metaKeys = keys.filter(k => k.startsWith('meta.'))
      if (metaKeys.length) {
        const { data: row } = await supabase.from('projects').select('meta').eq('id', projectId).single()
        if (row?.meta) {
          const meta = [...row.meta]
          metaKeys.forEach(key => {
            const idx = parseInt(key.split('.')[1])
            const t = data.translations[keys.indexOf(key)]
            if (meta[idx]) meta[idx] = { ...meta[idx], value: t }
          })
          updates.meta = meta
        }
      }

      if (Object.keys(updates).length) {
        const { error: updateError } = await supabase.from('projects').update(updates).eq('id', projectId)
        if (updateError) {
          console.error('[translate] Failed to save translations:', updateError)
          if (onTranslationStatus) {
            onTranslationStatus({ type: 'error', projectId, error: 'Failed to save translations' })
          }
        }
      }
    } catch (e) {
      console.error('[translate] Flush failed for project', projectId, e)
      if (onTranslationStatus) {
        onTranslationStatus({ type: 'error', projectId, error: e.message })
      }
    }
  }
}

/**
 * Save a manually-corrected translation to the glossary.
 * Called automatically when user edits a translation via InlineEdit.
 * @param {string} sourceText  - original text in sourceLang
 * @param {string} sourceLang  - 'pt'|'en'
 * @param {string} targetText  - human translation
 * @param {string} targetLang  - 'pt'|'en'
 */
export async function saveToGlossary(sourceText, sourceLang, targetText, targetLang) {
  if (!sourceText?.trim() || !targetText?.trim()) return
  
  const trimmedSource = sourceText.trim()
  const trimmedTarget = targetText.trim()
  
  try {
    const { data, error } = await supabase.from('translation_glossary').upsert(
      { 
        source_text: trimmedSource, 
        source_lang: sourceLang, 
        target_text: trimmedTarget, 
        target_lang: targetLang 
      },
      { onConflict: 'source_lang,source_text,target_lang' }
    )
    
    if (error) {
      console.error('[glossary] Failed to save:', error)
    } else {
      console.log(`[glossary] Saved: "${trimmedSource}" (${sourceLang} → ${targetLang})`)
    }
    
    return { success: !error, error }
  } catch (err) {
    console.error('[glossary] Exception:', err)
    return { success: false, error: err }
  }
}

/**
 * Queue a project field for translation.
 * @param {string} projectId
 * @param {string} field  - 'title'|'description'|'kpi_label'|'kpi_detail'|'meta.0.value' etc.
 * @param {string} text   - raw text typed by user
 * @param {string} lang   - 'pt'|'en'
 */
export function queueTranslation(projectId, field, text, lang) {
  if (!text || !isComplete(text)) return
  if (!pending.has(projectId)) pending.set(projectId, new Map())
  pending.get(projectId).set(field, { text, lang })
  schedule()
}

/**
 * Queue a content block for translation (stored in project_content_blocks table).
 * @param {string} blockId
 * @param {string} content
 * @param {string} lang
 */
export async function translateBlock(blockId, content, lang) {
  // content may be JSONB {pt,en} or raw string — extract source text
  const text = typeof content === 'object' ? content[lang] : content
  if (!text || !isComplete(text)) return
  
  try {
    const { data, error } = await supabase.functions.invoke('translate', {
      body: { texts: [text], sourceLang: lang }
    })
    
    if (error) {
      console.error('[translate] Block translation error:', error)
      return
    }
    
    if (!data?.translations?.[0]) {
      console.warn('[translate] No translation returned for block')
      return
    }
    
    const { error: updateError } = await supabase.from('project_content_blocks')
      .update({ content: data.translations[0] })
      .eq('id', blockId)
      
    if (updateError) {
      console.error('[translate] Failed to save block translation:', updateError)
    }
  } catch (e) {
    console.error('[translate] Block translation failed', blockId, e)
  }
}

/**
 * Cancel pending translations for a project (e.g., when navigating away)
 * @param {string} projectId 
 */
export function cancelPendingTranslations(projectId) {
  if (pending.has(projectId)) {
    pending.delete(projectId)
    console.log(`[translate] Cancelled pending translations for project ${projectId}`)
  }
}

/**
 * Clear all pending translations and stop the timer
 */
export function clearAllPending() {
  clearTimeout(timer)
  pending.clear()
  console.log('[translate] Cleared all pending translations')
}
