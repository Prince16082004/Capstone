import { createContext, useContext, useState, useEffect } from "react";
import { translations } from "../translations/translations.js";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("agrisense_lang") || "en";
  });

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem("agrisense_lang", newLang);
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations["en"]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
