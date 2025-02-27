import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: require('../../locales/en/translation.json'),
    },
    ja: {
      translation: require('../../locales/ja/translation.json'),
    },
    zh: {
      translation: require('../../locales/zh/translation.json'),
    },
    ko: {
      translation: require('../../locales/ko/translation.json'),
    },
    vi: {
      translation: require('../../locales/vi/translation.json'),
    },
    fr: {
      translation: require('../../locales/fr/translation.json'),
    },
    es: {
      translation: require('../../locales/es/translation.json'),
    },
    pt: {
      translation: require('../../locales/pt/translation.json'),
    },
    de: {
      translation: require('../../locales/de/translation.json'),
    },
    ru: {
      translation: require('../../locales/ru/translation.json'),
    },
    it: {
      translation: require('../../locales/it/translation.json'),
    },
    ar: {
      translation: require('../../locales/ar/translation.json'),
    },
    hi: {
      translation: require('../../locales/hi/translation.json'),
    },
    pl: {
      translation: require('../../locales/pl/translation.json'),
    },
    th: {
      translation: require('../../locales/th/translation.json'),
    },
  },
  lng: 'ja',
  fallbackLng: 'ja',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
