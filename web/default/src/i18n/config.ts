import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'

export const resources = {
  en,
} as const

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: ['en'],
  nsSeparator: false,
  debug: import.meta.env.DEV,
  interpolation: {
    escapeValue: false,
  },
})

try {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('i18nextLng', 'en')
  }
} catch {
  /* empty */
}

export default i18n
