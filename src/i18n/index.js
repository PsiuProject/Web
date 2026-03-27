import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import pt from './locales/pt.json'

const i18n = createI18n({
  legacy: false,
  locale: 'pt', // Default to Portuguese (original language)
  fallbackLocale: 'en',
  messages: {
    en,
    pt
  }
})

// Export a function to sync with i18n store after store is initialized
export function syncI18nWithStore(i18nStore) {
  i18n.global.locale.value = i18nStore.locale
  
  i18nStore.$subscribe((mutation, state) => {
    if (mutation.type === 'direct' && mutation.payload?.key === 'locale') {
      i18n.global.locale.value = state.locale
    }
  })
}

export default i18n
