import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Load default namespaces (can be replaced by dynamic import if needed)
import enCommon from '../assets/i18n/en/common.json';
import enAuth from '../assets/i18n/en/auth.json';
import enBuddy from '../assets/i18n/en/buddy.json';
import enHome from '../assets/i18n/en/home.json';
import enProfile from '../assets/i18n/en/profile.json';
import enLanguage from '../assets/i18n/en/language.json';
import enSession from '../assets/i18n/en/session.json';
import enChat from '../assets/i18n/en/chat.json';
import viCommon from '../assets/i18n/vi/common.json';
import viAuth from '../assets/i18n/vi/auth.json';
import viBuddy from '../assets/i18n/vi/buddy.json';
import viHome from '../assets/i18n/vi/home.json';
import viProfile from '../assets/i18n/vi/profile.json';
import viLanguage from '../assets/i18n/vi/language.json';
import viSession from '../assets/i18n/vi/session.json';
import viChat from '../assets/i18n/vi/chat.json';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  lng: 'vi',
  fallbackLng: 'en',
  resources: {
    en: {
      common: enCommon,
      auth: enAuth,
      buddy: enBuddy,
      home: enHome,
      profile: enProfile,
      language: enLanguage,
      session: enSession,
      chat: enChat,
    },
    vi: {
      common: viCommon,
      auth: viAuth,
      buddy: viBuddy,
      home: viHome,
      profile: viProfile,
      language: viLanguage,
      session: viSession,
      chat: viChat,
    },
  },
  ns: ['common', 'auth', 'buddy', 'home', 'profile', 'language', 'session', 'chat'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

export default i18n;
