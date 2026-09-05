import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../i18n/en.json';
import hi from '../i18n/hi.json';
import ml from '../i18n/ml.json';

export const SUPPORTED_LANGUAGES = ['en', 'ml', 'hi'] as const;
export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ml: { translation: ml },
      hi: { translation: hi },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnEmptyString: false,
  });
}

export default i18n;
