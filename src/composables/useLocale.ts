// ═══════════════════════════════════════════════════════════════════════════
// useLocale — Composable for managing locale/language
// ═══════════════════════════════════════════════════════════════════════════

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useLocale() {
  const { locale, t, d, n } = useI18n({ useScope: 'global' })

  // Available locales
  const availableLocales = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  ]

  // Current locale info
  const currentLocale = computed(() => 
    availableLocales.find(l => l.code === locale.value) || availableLocales[0]
  )

  // Is RTL
  const isRtl = computed(() => false) // Neither English nor Bengali are RTL

  // Switch locale
  function setLocale(code: string) {
    if (availableLocales.some(l => l.code === code)) {
      locale.value = code
      localStorage.setItem('locale', code)
      
      // Update HTML lang attribute
      document.documentElement.lang = code
    }
  }

  // Toggle between available locales
  function toggleLocale() {
    const currentIndex = availableLocales.findIndex(l => l.code === locale.value)
    const nextIndex = (currentIndex + 1) % availableLocales.length
    const nextLocale = availableLocales[nextIndex]
    if (nextLocale) {
      setLocale(nextLocale.code)
    }
  }

  return {
    locale,
    t,
    d,
    n,
    availableLocales,
    currentLocale,
    isRtl,
    setLocale,
    toggleLocale,
  }
}
