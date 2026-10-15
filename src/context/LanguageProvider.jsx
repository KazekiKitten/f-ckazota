import { useState } from "react";
import LanguageContext from "./languageContext";
import { translations } from "../i18n/translations";
import { markPrefsChanged } from "../lib/prefs";

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("azota-language");
    return (saved && ["vi", "en"].includes(saved)) ? saved : "vi";
  });

  const t = (key, params) => {
    let str =
      translations[language]?.[key] ?? translations.en[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([name, value]) => {
        str = str.replace(new RegExp(`\\{${name}\\}`, "g"), value);
      });
    }
    return str;
  };

  const changeLanguage = (lang) => {
    if (!["vi", "en"].includes(lang)) return;
    setLanguage(lang);
    localStorage.setItem("azota-language", lang);
    markPrefsChanged();
  };

  const toggleLanguage = () => {
    changeLanguage(language === "vi" ? "en" : "vi");
  };

  return (
    <LanguageContext.Provider
      value={{ language, t, toggleLanguage, changeLanguage }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
