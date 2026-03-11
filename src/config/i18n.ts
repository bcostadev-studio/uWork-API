import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import middleware from 'i18next-http-middleware';
import path from 'path';

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'pt'],
    ns: ['translation'],
    defaultNS: 'translation',
    backend: {
      loadPath: path.join(__dirname, '../i18n/locales/{{lng}}/{{ns}}.json'),
    },
    detection: {
      order: ['header', 'querystring'],
      lookupHeader: 'accept-language',
      lookupQuerystring: 'lang',
      caches: false,
    },
    interpolation: {
      escapeValue: false,
    },
    preload: ['en', 'pt'],
  });

export { i18next, middleware as i18nMiddleware };
