import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 번역 리소스 import
import ko from './locales/ko.json';
import en from './locales/en.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import vi from './locales/vi.json';
import id from './locales/id.json';

const resources = {
  ko: { translation: ko },
  en: { translation: en },
  zh: { translation: zh },
  ja: { translation: ja },
  vi: { translation: vi },
  id: { translation: id },
};

i18n
  .use(LanguageDetector) // 브라우저 언어 자동 감지
  .use(initReactI18next) // React와 연결
  .init({
    resources,
    fallbackLng: 'ko', // 기본 언어
    debug: import.meta.env.DEV, // 개발 모드에서만 디버그
    
    interpolation: {
      escapeValue: false, // React는 XSS 보호가 내장
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
