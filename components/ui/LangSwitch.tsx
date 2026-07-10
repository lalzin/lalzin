'use client';

import { useContent } from '@/components/providers/ContentProvider';
import type { Lang } from '@/lib/content';

export default function LangSwitch({ className = '' }: { className?: string }) {
  const { lang, setLang } = useContent();
  const langs: Lang[] = ['fr', 'en'];

  return (
    <div
      className={`flex items-center rounded-full border border-cream/15 bg-cream/5 p-0.5 text-xs font-bold ${className}`}
    >
      {langs.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-2.5 py-1 uppercase transition-colors ${
            lang === l
              ? 'bg-gradient-to-r from-magenta to-coral text-night'
              : 'text-cream/60 hover:text-cream'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
