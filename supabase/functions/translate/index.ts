// Supabase Edge Function: translate
// 1. Loads glossary from DB (human-corrected terms)
// 2. Protects terms using XML tags that DeepL preserves
// 3. Restores protected terms after translation — they are NEVER overwritten
// 4. Tracks character usage and handles rate limits gracefully

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DEEPL_API   = 'https://api-free.deepl.com/v2'
const LIBRE_URL   = 'https://libretranslate.com/translate'
const DEEPL_LANG  = { pt: 'PT-BR', en: 'EN-US' }  // Use PT-BR for Brazilian Portuguese

// Max limits per DeepL API docs
const MAX_TEXTS_PER_REQUEST = 50
const MAX_REQUEST_SIZE_BYTES = 128 * 1024  // 128 KiB

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors() })

  const DEEPL_KEY  = Deno.env.get('DEEPL_API_KEY')
  const SUPA_URL   = Deno.env.get('SUPABASE_URL')!
  const SUPA_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  let requestBody: { texts: string[], sourceLang: string }
  try {
    requestBody = await req.json()
  } catch (e) {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const { texts, sourceLang } = requestBody
  if (!texts?.length || !sourceLang) {
    return json({ error: 'Missing required params: texts and sourceLang' }, 400)
  }

  if (!['pt', 'en'].includes(sourceLang)) {
    return json({ error: 'Invalid sourceLang. Must be "pt" or "en"' }, 400)
  }

  // Enforce batch size limit
  if (texts.length > MAX_TEXTS_PER_REQUEST) {
    return json({ 
      error: `Too many texts. Max ${MAX_TEXTS_PER_REQUEST} per request, got ${texts.length}`,
      suggestion: 'Split into multiple requests'
    }, 413)
  }

  const targetLang = sourceLang === 'pt' ? 'en' : 'pt'

  // 1. Load glossary entries for this lang pair
  const db = createClient(SUPA_URL, SUPA_KEY)
  const { data: glossaryRows, error: glossaryError } = await db
    .from('translation_glossary')
    .select('source_text, target_text')
    .eq('source_lang', sourceLang)
    .eq('target_lang', targetLang)

  if (glossaryError) {
    console.error('[translate] Failed to load glossary:', glossaryError)
  }

  const glossary: Record<string, string> = {}
  for (const row of glossaryRows ?? []) {
    if (row.source_text && row.target_text) {
      glossary[row.source_text] = row.target_text
    }
  }

  // 2. Protect glossary terms using XML tags that DeepL understands
  // Sort by length (longest first) to prevent partial replacements
  // e.g., replace "Earth Guardians South America" before "Earth"
  const sortedGlossary = Object.entries(glossary).sort(
    (a, b) => b[0].length - a[0].length
  )

  const xmlTags: string[] = []
  const protect = (text: string): string => {
    let out = text
    sortedGlossary.forEach(([src, tgt], idx) => {
      // Case-insensitive replacement with word boundaries would be ideal,
      // but for now we do simple case-sensitive replacement
      if (out.includes(src)) {
        // Use <g> tags which DeepL recognizes when tag_handling: 'xml'
        const tag = `<g${idx}>${tgt}</g${idx}>`
        xmlTags.push(tag)
        out = out.replaceAll(src, tag)
      }
    })
    return out
  }

  const restore = (text: string): string => {
    let out = text
    // Restore in reverse order to handle nested tags correctly
    for (let i = xmlTags.length - 1; i >= 0; i--) {
      const tag = xmlTags[i]
      // Extract the content between <gX> and </gX>
      const match = tag.match(/<g\d+>(.*?)<\/g\d+>/)
      if (match) {
        out = out.replaceAll(tag, match[1])
      }
    }
    return out
  }

  const protectedTexts = texts.map(protect)

  // Calculate character count for logging
  const totalChars = protectedTexts.reduce((sum, t) => sum + t.length, 0)
  console.log(`[translate] Processing ${texts.length} texts (${totalChars} chars) from ${sourceLang} to ${targetLang}`)

  let translated: string[] | undefined
  let usedFallback = false

  // 3. Try DeepL first
  if (DEEPL_KEY) {
    try {
      const body = new URLSearchParams()
      body.append('source_lang', DEEPL_LANG[sourceLang])
      body.append('target_lang', DEEPL_LANG[targetLang])
      // Use XML tag handling to preserve <g> tags
      body.append('tag_handling', 'xml')
      protectedTexts.forEach(t => body.append('text', t))

      const res = await fetch(`${DEEPL_API}/translate`, {
        method: 'POST',
        headers: { 
          'Authorization': `DeepL-Auth-Key ${DEEPL_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body,
      })

      if (res.ok) {
        const data = await res.json()
        translated = data.translations.map((t: { text: string }) => restore(t.text))
        console.log(`[translate] DeepL success: ${data.translations.length} translations`)
        
        // Log billing info if available
        if (data.billed_characters) {
          console.log(`[translate] Billed characters: ${data.billed_characters}`)
        }
      } else {
        // Handle specific error codes
        const errorText = await res.text()
        console.error(`[translate] DeepL API error ${res.status}:`, errorText)
        
        // Don't retry on auth errors or permanent failures
        if (res.status === 403) {
          console.error('[translate] DeepL authentication failed - check API key')
        } else if (res.status === 429) {
          console.warn('[translate] DeepL rate limited - consider upgrading plan')
        } else if (res.status >= 400 && res.status < 500) {
          // Client error - don't fallback, let user know
          return json({ error: 'DeepL API error', details: errorText, status: res.status }, res.status)
        }
        // Server errors (5xx) will fall through to LibreTranslate
      }
    } catch (err) {
      console.error('[translate] DeepL request failed:', err)
      // Will fall through to LibreTranslate
    }
  } else {
    console.warn('[translate] DEEPL_API_KEY not set - using LibreTranslate fallback')
  }

  // 4. Fallback to LibreTranslate if DeepL failed or unavailable
  if (translated === undefined) {
    console.log('[translate] Using LibreTranslate fallback')
    usedFallback = true
    try {
      translated = await Promise.all(
        protectedTexts.map(async (text, idx) => {
          try {
            const res = await fetch(LIBRE_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                q: text, 
                source: sourceLang, 
                target: targetLang, 
                format: 'text' 
              }),
            })
            
            if (!res.ok) {
              console.warn(`[translate] LibreTranslate text ${idx} failed: ${res.status}`)
              return restore(texts[idx])  // Return original with restoration
            }
            
            const d = await res.json()
            return restore(d.translatedText ?? texts[idx])
          } catch (err) {
            console.warn(`[translate] LibreTranslate text ${idx} exception:`, err)
            return texts[idx]  // Return original on error
          }
        })
      )
    } catch (err) {
      console.error('[translate] LibreTranslate batch failed:', err)
      translated = texts  // Complete failure - return all originals
    }
  }

  const translations = texts.map((original, i) => ({
    [sourceLang]: original,
    [targetLang]: translated![i],
  }))

  return json({ 
    translations,
    metadata: {
      usedFallback,
      glossaryTermsLoaded: glossaryRows?.length ?? 0,
      characterCount: totalChars,
      textsProcessed: texts.length
    }
  })
})

const cors = () => ({ 
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { 
    status, 
    headers: { 'Content-Type': 'application/json', ...cors() } 
  })
}
