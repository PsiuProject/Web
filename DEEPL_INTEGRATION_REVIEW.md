# DeepL API Integration - Comprehensive Review & Improvements

## Executive Summary

Your Earth Guardians SA app has a **sophisticated translation system** using DeepL API via Supabase Edge Functions. The implementation is well-architected with glossary protection, batching, and fallback mechanisms. This document outlines improvements made and best practices for production use.

---

## What Was Improved

### 1. Edge Function (`supabase/functions/translate/index.ts`)

#### Fixed Issues:

**a) Proper XML Tag Handling**
- **Before:** Used `«G0»` Unicode characters with incorrect `ignore_tags: 'g'` parameter
- **After:** Uses proper `<g0>translation</g0>` XML tags that DeepL recognizes
- **Benefit:** DeepL now correctly preserves your glossary terms during translation

**b) Glossary Term Protection**
- **Before:** Replaced terms in arbitrary order (could cause nested replacements)
- **After:** Sorts glossary by length (longest first) before replacement
- **Example:** "Earth Guardians South America" replaced before "Earth"

**c) Comprehensive Error Handling**
- **Before:** Silent `catch (_) {}` blocks hiding failures
- **After:** Detailed logging and specific error handling for:
  - Authentication errors (403)
  - Rate limiting (429)
  - Client errors (4xx)
  - Server errors (5xx)
- **Benefit:** Easier debugging and monitoring

**d) Input Validation**
- Added validation for:
  - Maximum 50 texts per batch (DeepL limit)
  - Valid language codes (pt/en only)
  - Proper JSON parsing
- Returns helpful error messages instead of cryptic failures

**e) Character Usage Tracking**
- Logs character counts for monitoring against 500k monthly limit
- Returns metadata in response for UI feedback
- Helps prevent unexpected service interruption

**f) Language Code Correction**
- **Before:** `PT` (generic Portuguese)
- **After:** `PT-BR` (Brazilian Portuguese - appropriate for South America project)

#### New Features:

```typescript
// Response now includes metadata
{
  translations: [...],
  metadata: {
    usedFallback: false,           // true if LibreTranslate was used
    glossaryTermsLoaded: 15,       // number of protected terms
    characterCount: 342,           // chars processed (for billing tracking)
    textsProcessed: 3              // number of texts translated
  }
}
```

---

### 2. Translation Service (`src/lib/translationService.js`)

#### Improvements:

**a) Status Callback System**
```javascript
import { onTranslationStatus } from './translationService'

// Set up callback to receive translation updates
onTranslationStatus = (status) => {
  if (status.type === 'start') {
    // Show loading indicator
  } else if (status.type === 'error') {
    // Show error message to user
  } else if (status.type === 'complete') {
    // Hide loading, show success
    console.log(`Translated ${status.metadata?.textsProcessed} texts`)
  }
}
```

**b) Better Error Logging**
- Specific error messages for different failure types
- Logs when fallback is used
- Tracks glossary save confirmations

**c) Utility Functions**
```javascript
// Cancel pending translations (e.g., when navigating away)
cancelPendingTranslations(projectId)

// Clear all pending translations
clearAllPending()
```

**d) Glossary Save Feedback**
```javascript
const result = await saveToGlossary(sourceText, 'pt', targetText, 'en')
if (result.success) {
  console.log('Term saved to glossary')
} else {
  console.error('Failed to save:', result.error)
}
```

---

## DeepL API Best Practices

### Authentication & Security ✅

Your current setup is **correct**:
- API key stored in Supabase secrets (not in `.env`)
- Key never exposed to client-side code
- Uses proper Authorization header format

**Verify your secret is set:**
```bash
supabase link --project-ref bnkwtlbtnvoitmjvefvw
supabase secrets list  # Should show DEEPL_API_KEY
```

### Rate Limits & Quotas ⚠️

**DeepL Free Plan:**
- **500,000 characters per month** (resets monthly, not daily)
- **128 KiB max request size**
- **50 texts per batch**

**Monitoring Recommendations:**

1. **Add usage tracking table:**
```sql
CREATE TABLE translation_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT now(),
  characters_count INTEGER NOT NULL,
  source_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  used_fallback BOOLEAN DEFAULT false
);

-- Add index for monthly queries
CREATE INDEX idx_usage_month ON translation_usage_log 
  USING BTREE (date_trunc('month', timestamp));
```

2. **Log each translation in Edge Function:**
```typescript
// After successful translation, add:
await db.from('translation_usage_log').insert({
  characters_count: totalChars,
  source_lang: sourceLang,
  target_lang: targetLang,
  used_fallback
})
```

3. **Check monthly usage:**
```sql
SELECT 
  date_trunc('month', timestamp) as month,
  SUM(characters_count) as total_chars,
  COUNT(*) as requests
FROM translation_usage_log
WHERE timestamp >= date_trunc('month', now())
GROUP BY month;
```

### Optimization Tips 💡

**1. Batching Strategy (Already Implemented ✅)**
Your 4-second batching is good. Consider:
- Current: 4000ms delay (good balance)
- Could reduce to 2000ms for more responsive UX
- Or increase to 6000ms for more batching efficiency

**2. Glossary Management**
- Keep glossary under 100 terms for best performance
- Review quarterly to remove outdated terms
- Use for: Organization names, technical terms, brand names

**3. Character Counting**
DeepL counts **Unicode code points**, not bytes or words:
```javascript
// "Café" = 4 characters (C-a-f-é)
// Not 5 bytes (UTF-8 encoding)
const chars = text.length  // JavaScript .length is usually correct
```

**4. Fallback Strategy**
Your LibreTranslate fallback is good for resilience:
- Pros: Free, unlimited, no API key needed
- Cons: Lower quality, slower, rate-limited by public server
- Consider: Self-hosting LibreTranslate for production

---

## App Structure Review

### Architecture Strengths ✅

1. **Two-Tier Translation System**
   - Auto-translate for initial content
   - Manual corrections saved to glossary
   - Glossary terms NEVER overwritten

2. **Bilingual Data Storage**
   ```json
   {
     "title": {
       "pt": "Projeto de Reflorestamento",
       "en": "Reforestation Project"
     }
   }
   ```

3. **Smart Queue System**
   - Only translates "complete" phrases (30+ chars or ends with punctuation)
   - Prevents translating single words unnecessarily
   - Batches multiple edits into one API call

4. **Component Integration**
   - `InlineEdit.vue`: Dual-language editing
   - `ProjectDetail.vue`: Content block translations
   - `ProjectCard.vue`: Card-level translations

### Recommended Enhancements 📋

**1. Add Translation Quality Indicator**
```vue
<!-- In InlineEdit.vue -->
<div class="translation-badge" v-if="fieldWasAutoTranslated">
  <span title="Auto-translated by DeepL">🤖</span>
</div>
```

**2. Add Monthly Usage Dashboard**
```vue
<!-- New component: TranslationUsage.vue -->
<script setup>
const { data: usage } = await supabase.rpc('get_monthly_translation_usage')
</script>
```

**3. Add Translation History/Audit Log**
```sql
CREATE TABLE translation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  field TEXT NOT NULL,
  source_text TEXT,
  translated_text TEXT,
  source_lang TEXT,
  target_lang TEXT,
  was_manual BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
```

**4. Add Pre-Translation Check**
```javascript
// Before calling DeepL, check if translation already exists
async function translateIfNeeded(texts, sourceLang) {
  const targetLang = sourceLang === 'pt' ? 'en' : 'pt'
  
  // Check DB for existing translations
  const { data: existing } = await supabase
    .from('projects')
    .select('title, description')
    .eq('id', projectId)
    .single()
  
  // Only translate what's missing
  const needsTranslation = texts.filter(t => 
    !existing?.[targetLang]
  )
  
  if (needsTranslation.length === 0) {
    console.log('[translate] Already translated, skipping')
    return
  }
  
  // ... proceed with translation
}
```

---

## Testing Checklist

### Manual Testing

- [ ] Test with empty glossary
- [ ] Test with 50+ glossary terms
- [ ] Test with very long text (>1000 chars)
- [ ] Test with special characters (emoji, accents)
- [ ] Test with HTML/special formatting
- [ ] Test glossary term at start/middle/end of sentence
- [ ] Test case sensitivity (does "Earth" protect "earth"?)
- [ ] Test fallback by temporarily removing DEEPL_API_KEY

### Load Testing

```javascript
// Test batch limits
const fiftyTexts = Array(50).fill('Test text')
await supabase.functions.invoke('translate', {
  body: { texts: fiftyTexts, sourceLang: 'pt' }
})

// Test over limit (should fail gracefully)
const fiftyOneTexts = Array(51).fill('Test text')
const result = await supabase.functions.invoke('translate', {
  body: { texts: fiftyOneTexts, sourceLang: 'pt' }
})
console.log(result.error) // Should show helpful error
```

---

## Deployment Instructions

### Deploy Updated Edge Function

```bash
cd /home/jay/projects

# Link to Supabase project (if not already linked)
supabase link --project-ref bnkwtlbtnvoitmjvefvw

# Verify secrets are set
supabase secrets list

# Deploy updated function
supabase functions deploy translate

# Test the function
supabase functions invoke translate \
  --body-json '{"texts": ["Olá mundo"], "sourceLang": "pt"}'
```

### Update Frontend

No deployment needed for frontend changes - they're in the existing codebase. Just ensure:

1. Clear browser cache if testing locally
2. Check browser console for any new error messages
3. Verify translation status callbacks work (if you add UI feedback)

---

## Monitoring & Alerts

### Set Up Monthly Usage Alert

```sql
-- Create a view for current month usage
CREATE VIEW monthly_translation_usage AS
SELECT 
  SUM(characters_count) as total_chars,
  500000 as monthly_limit,
  ROUND(SUM(characters_count)::numeric / 500000 * 100, 2) as percent_used
FROM translation_usage_log
WHERE timestamp >= date_trunc('month', now());

-- Query to check usage
SELECT * FROM monthly_translation_usage;
```

### Recommended Alerts

Set up alerts when:
- Usage exceeds 80% of monthly limit (400k chars)
- Error rate exceeds 5% of requests
- Fallback usage exceeds 10% (indicates DeepL issues)

---

## Cost Analysis

### Current Setup: DeepL Free

- **Limit:** 500,000 characters/month
- **Cost:** $0/month
- **Overage:** Requests fail until next month

### Upgrade Options

**DeepL API Advanced (Paid):**
- Starting at ~$7.49/month
- Higher character limits
- Priority support
- More language pairs

**When to Upgrade:**
- If you consistently hit 500k limit
- If you need more language pairs (currently pt↔en only)
- If you need guaranteed uptime (no fallback to LibreTranslate)

---

## Troubleshooting Guide

### Common Issues

**Problem:** Translations failing silently
```bash
# Check Edge Function logs
supabase functions logs translate

# Verify API key is set
supabase secrets list | grep DEEPL
```

**Problem:** Glossary terms not being protected
```sql
-- Check glossary entries
SELECT * FROM translation_glossary 
WHERE source_lang = 'pt' AND target_lang = 'en';

-- Verify terms are being loaded (check Edge Function logs)
-- Should see: "glossaryTermsLoaded: X"
```

**Problem:** Hitting rate limits
```sql
-- Check this month's usage
SELECT SUM(characters_count) 
FROM translation_usage_log 
WHERE timestamp >= date_trunc('month', now());
```

**Problem:** LibreTranslate fallback also failing
- Public LibreTranslate server may be rate-limiting or down
- Solution: Self-host LibreTranslate or disable fallback
- Edit Edge Function to return error instead of falling back

---

## Security Considerations

### Current Security Posture ✅

1. **API Key Protection:** Stored in Supabase secrets, not exposed to client
2. **Row Level Security:** Database tables have RLS policies
3. **Service Role Key:** Only used server-side in Edge Function
4. **No Hardcoded Secrets:** Verified in code review

### Additional Recommendations

**1. Add Request Rate Limiting**
```typescript
// In Edge Function, add per-user rate limiting
const { data: recentRequests } = await db
  .from('translation_requests_log')
  .select('timestamp')
  .eq('user_id', userId)
  .gte('timestamp', new Date(Date.now() - 60000)) // last minute

if (recentRequests.length > 10) {
  return json({ error: 'Rate limited' }, 429)
}
```

**2. Add Input Sanitization**
```typescript
// Prevent injection attacks
const sanitizeText = (text: string) => {
  return text
    .replace(/<script[^>]*>/gi, '')
    .replace(/<\/script>/gi, '')
    .substring(0, 5000)  // Max length safety
}
```

**3. Audit Log for Translations**
```sql
-- Track who triggers translations
CREATE TABLE translation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id),
  timestamp TIMESTAMPTZ DEFAULT now(),
  characters_count INTEGER,
  ip_address TEXT
);
```

---

## Conclusion

Your DeepL integration is **production-ready** with these improvements. The architecture correctly balances:

- ✅ Automation (auto-translate new content)
- ✅ Control (glossary protects important terms)
- ✅ Resilience (LibreTranslate fallback)
- ✅ Efficiency (batching reduces API calls)
- ✅ Security (API keys properly protected)

### Next Steps

1. **Deploy updated Edge Function** (critical - fixes XML tag handling)
2. **Add usage tracking table** (recommended - monitor 500k limit)
3. **Test thoroughly** with your actual content
4. **Monitor logs** for first week after deployment
5. **Consider UI enhancements** (translation status indicators)

### Questions or Issues?

- DeepL API Docs: https://developers.deepl.com/docs
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Report bugs or request features via GitHub issues

---

*Last reviewed: 2026-03-25*
*DeepL API Version: v2*
*Supabase Edge Functions Runtime: Deno*
