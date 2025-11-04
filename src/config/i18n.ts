import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Load default namespaces (can be replaced by dynamic import if needed)
import enCommon from '../assets/i18n/en/common.json';
import viCommon from '../assets/i18n/vi/common.json';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  lng: 'vi',
  fallbackLng: 'en',
  resources: {
    en: { common: enCommon },
    vi: { common: viCommon },
  },
  ns: ['common'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

export default i18n;


