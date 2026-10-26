import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en/translation.json';
import myTranslation from './locales/my/translation.json';

const savedLang = localStorage.getItem('lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      my: { translation: myTranslation },
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;
