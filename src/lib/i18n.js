import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: require("../../locales/en/translation.json"),
      },
      ja: {
        translation: require("../../locales/ja/translation.json"),
      },
      zh: {
        translation: require("../../locales/zh/translation.json"),
      },
      ko: {
        translation: require("../../locales/ko/translation.json"),
      },
    },
    lng: "ja", 
    fallbackLng: "ja",
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;
