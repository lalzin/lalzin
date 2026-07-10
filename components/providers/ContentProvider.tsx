'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  defaultContent,
  pick as pickLang,
  type Content,
  type L,
  type Lang,
} from '@/lib/content';
import { ui, type UI } from '@/lib/i18n';

const CONTENT_KEY = 'lalzin:content';
const LANG_KEY = 'lalzin:lang';

type Ctx = {
  content: Content;
  hydrated: boolean;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (l: L | undefined) => string;
  ui: UI;
  update: (next: Content) => void;
  reset: () => void;
  exportJSON: () => void;
  importJSON: (json: string) => boolean;
};

const ContentContext = createContext<Ctx | null>(null);

/** Fusionne des overrides sauvegardés avec les valeurs par défaut. */
function merge(saved: Partial<Content>): Content {
  return {
    ...defaultContent,
    ...saved,
    artist: { ...defaultContent.artist, ...saved.artist },
    video: { ...defaultContent.video, ...saved.video },
    site: { ...defaultContent.site, ...saved.site },
  };
}

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<Content>(defaultContent);
  const [lang, setLangState] = useState<Lang>('fr');
  const [hydrated, setHydrated] = useState(false);

  // Hydratation depuis le navigateur (après montage)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONTENT_KEY);
      if (saved) setContent(merge(JSON.parse(saved)));
    } catch {
      /* ignore */
    }
    const savedLang = localStorage.getItem(LANG_KEY) as Lang | null;
    if (savedLang === 'fr' || savedLang === 'en') setLangState(savedLang);
    setHydrated(true);
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

  const update = useCallback((next: Content) => {
    setContent(next);
    try {
      localStorage.setItem(CONTENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const reset = useCallback(() => {
    setContent(defaultContent);
    try {
      localStorage.removeItem(CONTENT_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(content, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lalzin-content.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [content]);

  const importJSON = useCallback(
    (json: string) => {
      try {
        update(merge(JSON.parse(json)));
        return true;
      } catch {
        return false;
      }
    },
    [update],
  );

  const t = useCallback((l: L | undefined) => pickLang(l, lang), [lang]);

  const value = useMemo<Ctx>(
    () => ({
      content,
      hydrated,
      lang,
      setLang,
      t,
      ui: ui[lang],
      update,
      reset,
      exportJSON,
      importJSON,
    }),
    [content, hydrated, lang, setLang, t, update, reset, exportJSON, importJSON],
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used within ContentProvider');
  return ctx;
}
