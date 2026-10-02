import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import common from './local/bg/common';
import shared from './shared';

i18n
  .use(initReactI18next)
  .init({
    lng: 'bg',
    fallbackLng: 'bg',
    supportedLngs: ['bg'],
    debug: false,
    resources: { bg: { translation: { ...common, ...shared } } },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
