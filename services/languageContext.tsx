import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { t, T } from './i18n';

const LANG_KEY = 'app_language';

interface LanguageContextType {
  lang: string;
  tr: T;
  setLang: (code: string) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  tr: t('en'),
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then(saved => {
      if (saved) setLangState(saved);
    });
  }, []);

  const setLang = async (code: string) => {
    setLangState(code);
    await AsyncStorage.setItem(LANG_KEY, code);
  };

  return (
    <LanguageContext.Provider value={{ lang, tr: t(lang), setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
