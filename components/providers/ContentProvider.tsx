'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { defaultContent, pick as pickLang, type Content, type L, type Lang } from '@/lib/content';
import { ui, type UI } from '@/lib/i18n';

const LANG_KEY = 'lalzin:lang';

type Ctx = {
  content: Content;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (l: L | undefined) => string;
  ui: UI;
  /** Met à jour le contenu EN MÉMOIRE (la persistance passe par l'API Supabase). */
  update: (next: Content) => void;
  reset: () => void;
  importJSON: (json: string) => boolean;
};

const ContentContext = createContext<Ctx | null>(null);

function merge(saved: Partial<Content>): Content {
  return {
    ...defaultContent,
    ...saved,
    artist: { ...defaultContent.artist, ...saved.artist },
    video: { ...defaultContent.video, ...saved.video },
    site: { ...defaultContent.site, ...saved.site },
  };
}

export function ContentProvider({
  initialContent,
  children,
}: {
  initialContent: Content;
  children: React.ReactNode;
}) {
  // Source de vérité = contenu fourni par le serveur (Supabase, sinon défauts).
  const [content, setContent] = useState<Content>(initialContent);
  const [lang, setLangState] = useState<Lang>('fr');

  // Seule la langue est mémorisée côté navigateur (préférence par visiteur).
  useEffect(() => {
    const savedLang = localStorage.getItem(LANG_KEY) as Lang | null;
    if (savedLang === 'fr' || savedLang === 'en') setLangState(savedLang);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
      document.documentElement.lang = l;
    } catch {
      /* ignore */
    }
  }, []);

  const update = useCallback((next: Content) => setContent(next), []);
  const reset = useCallback(() => setContent(defaultContent), []);

  const importJSON = useCallback((json: string) => {
    try {
      setContent(merge(JSON.parse(json)));
      return true;
    } catch {
      return false;
    }
  }, []);

  const t = useCallback((l: L | undefined) => pickLang(l, lang), [lang]);

  const value = useMemo<Ctx>(
    () => ({ content, lang, setLang, t, ui: ui[lang], update, reset, importJSON }),
    [content, lang, setLang, t, update, reset, importJSON],
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used within ContentProvider');
  return ctx;
}
