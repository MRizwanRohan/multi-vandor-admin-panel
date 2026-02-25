// ═══════════════════════════════════════════════════════════════════════════
// i18n Configuration — Vue I18n setup with English and Bengali
// ═══════════════════════════════════════════════════════════════════════════

import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import bn from './locales/bn.json'

export type MessageSchema = typeof en

const i18n = createI18n<[MessageSchema], 'en' | 'bn'>({
  legacy: false,
  locale: localStorage.getItem('locale') || 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    bn,
  },
  numberFormats: {
    en: {
      currency: {
        style: 'currency',
        currency: 'BDT',
        currencyDisplay: 'narrowSymbol',
      },
    },
    bn: {
      currency: {
        style: 'currency',
        currency: 'BDT',
        currencyDisplay: 'narrowSymbol',
      },
    },
  },
  datetimeFormats: {
    en: {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      },
      long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      },
    },
    bn: {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      },
      long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      },
    },
  },
})

export default i18n
