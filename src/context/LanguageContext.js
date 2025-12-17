import { createContext, useContext, useMemo, useState } from 'react';
import { setLocale } from '../i18n';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');

  const setAppLanguage = (code) => {
    setLanguageState(code);
    setLocale(code);
  };

  const setEN = () => setAppLanguage('en');
  const setES = () => setAppLanguage('es');

  const value = useMemo(
    () => ({ language, setAppLanguage, setEN, setES }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
