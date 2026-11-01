'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { translate, type AdminLang } from '@/lib/admin-i18n';

type Ctx = { lang: AdminLang; setLang: (l: AdminLang) => void; t: (s: string, vars?: Record<string, string | number>) => string };
const I18nCtx = createContext<Ctx>({ lang: 'fr', setLang: () => {}, t: (s) => s });
export const useT = () => useContext(I18nCtx);

const KEY = 'pizzart-admin-lang';

export function AdminI18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<AdminLang>('fr');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === 'en' || saved === 'fr') setLangState(saved);
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = (l: AdminLang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {}
  };
  const t = useCallback((s: string, vars?: Record<string, string | number>) => translate(lang, s, vars), [lang]);
  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

export function LangSwitch() {
  const { lang, setLang } = useT();
  return (
    <div className="admin-langs" role="group" aria-label="Langue / Language">
      {(['fr', 'en'] as const).map((l) => (
        <button key={l} type="button" className={l === lang ? 'on' : ''} onClick={() => setLang(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
