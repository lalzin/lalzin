'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useContent } from '@/components/providers/ContentProvider';
import { UI, formatDay } from '@/lib/minigame/i18n';
import type { Lang } from '@/lib/minigame/types';

/** Accès anticipé : la pochette + un champ mot de passe, rien d'autre du jeu. */
export default function AccessGate({
  slug,
  title,
  cover,
  releaseDate,
  displayFont,
}: {
  slug: string;
  title: string;
  cover: string;
  releaseDate: string;
  displayFont: string;
}) {
  const router = useRouter();
  const { lang, setLang } = useContent();
  const t = UI[lang];
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem('lalzin:lang'))
        setLang(navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en');
    } catch {
      /* stockage indisponible */
    }
  }, [setLang]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !password.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/minigame/access', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, password }),
      });
      if (res.ok) return router.refresh();
      setError(res.status === 429 ? t.gateTooMany : t.gateWrong);
    } catch {
      setError(t.gateWrong);
    }
    setBusy(false);
  };

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#000d1c] text-[#ffd9a8]">
      {/* Fond flou agrandi : rogné par <main>, jamais de barres de défilement. */}
      <div
        aria-hidden
        className="absolute inset-0 scale-110 bg-cover bg-center opacity-35 blur-2xl"
        style={{ backgroundImage: `url(${cover})` }}
      />
      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden">
      <div className="relative mx-auto flex min-h-full max-w-sm flex-col items-center justify-center px-6 py-12 text-center">
        <div className="absolute right-4 top-4 flex rounded-full bg-[#001226]/60 p-0.5 font-body text-[11px] font-bold ring-1 ring-[#ffb24a]/30">
          {(['fr', 'en'] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={`rounded-full px-2.5 py-1.5 uppercase ${lang === l ? 'bg-[#ffb24a] text-[#001c35]' : 'text-[#ffd9a8]/70'}`}
            >
              {l}
            </button>
          ))}
        </div>
        <p className="font-body text-[10px] font-semibold uppercase tracking-[0.5em] text-[#ffb24a]/80">
          {t.gateKicker}
        </p>
        <img
          src={cover}
          alt={title}
          className="mt-6 aspect-square w-60 rounded-[6px] shadow-[0_30px_60px_-10px_rgba(0,0,0,0.75)]"
        />
        <h1 className="mt-6 text-4xl text-[#ffa53d] [text-shadow:0_4px_0_#001226]" style={{ fontFamily: displayFont }}>
          {title}
        </h1>
        {releaseDate && (
          <p className="mt-1 font-body text-xs uppercase tracking-[0.25em] text-[#ffd9a8]/60">
            {t.gateSoon(formatDay(releaseDate, lang))}
          </p>
        )}
        <p className="mt-4 font-body text-sm leading-relaxed text-[#ffd9a8]/80">{t.gateText}</p>
        <form onSubmit={submit} className="mt-5 w-full font-body">
          <input
            type="password"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.gatePlaceholder}
            className="w-full rounded-full border border-[#ffb24a]/40 bg-white/5 px-5 py-3 text-center text-base text-[#ffd9a8] outline-none placeholder:text-[#ffd9a8]/35 focus:border-[#ffb24a]"
          />
          {error && <p className="mt-2 text-xs text-[#ff8a6a]">{error}</p>}
          <button
            disabled={busy}
            className="mt-3 w-full rounded-full bg-gradient-to-r from-[#ffb24a] to-[#ff7a1a] py-3.5 text-sm font-bold uppercase tracking-[0.2em] text-[#001c35] disabled:opacity-50"
          >
            {busy ? '…' : t.gateSubmit}
          </button>
        </form>
      </div>
      </div>
    </main>
  );
}
