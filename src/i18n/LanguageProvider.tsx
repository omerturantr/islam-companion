import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getDeviceLanguage, loadStoredLanguage, saveStoredLanguage, t } from './index';
import type { LanguageCode } from './translations';

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(getDeviceLanguage());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    loadStoredLanguage()
      .then((stored) => {
        if (stored) {
          setLanguageState(stored);
        }
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    saveStoredLanguage(language).catch(() => undefined);
  }, [hydrated, language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
      t: (key) => t(language, key),
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
