'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useContent } from '@/components/providers/ContentProvider';
import { SocialIcon } from '@/components/ui/icons';
import Confetti from '@/components/Confetti';
import Navbar from '@/components/Navbar';
import { groovy } from '@/components/ui/motion';
import type { Plugin } from '@/lib/plugins';

const AMOUNTS = [3, 5, 10];
const RESEND_COOLDOWN_S = 60;

export default function ThanksPage({ paypalMe, plugins }: { paypalMe: string; plugins: Plugin[] }) {
  const { ui, content } = useContent();
  const tx = ui.plugins.thanks;
  const instagram = content.socials.find((s) => s.key === 'instagram')?.href;
  const params = useSearchParams();

  const slugs = (params.get('p') ?? '').split(',').filter(Boolean);
  const resendToken = params.get('r');
  const names = slugs
    .map((s) => plugins.find((p) => p.slug === s)?.name)
    .filter(Boolean) as string[];

  const [left, setLeft] = useState(RESEND_COOLDOWN_S);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  // Le renvoi n'est proposé qu'au bout de 60 s.
  useEffect(() => {
    if (left <= 0) return;
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [left]);

  const resend = useCallback(async () => {
    if (!resendToken || state === 'sending') return;
    setState('sending');
    try {
      const res = await fetch('/api/plugins/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resendToken }),
      });
      setState(res.ok ? 'sent' : 'error');
      if (res.ok) setLeft(RESEND_COOLDOWN_S);
    } catch {
      setState('error');
    }
  }, [resendToken, state]);

  const donate = (amount?: number) => {
    if (!paypalMe) return;
    const url = amount
      ? `https://paypal.me/${paypalMe}/${amount}EUR`
      : `https://paypal.me/${paypalMe}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <main className="relative flex min-h-[100svh] flex-col items-center overflow-hidden px-6 pb-24 pt-32">
      <Navbar />
      <div className="halo left-[15%] top-[10%] h-72 w-72 bg-magenta" />
      <div className="halo right-[12%] top-[35%] h-72 w-72 bg-gold" />
      <Confetti count={16} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: groovy }}
        className="relative z-10 w-full max-w-xl text-center"
      >
        <h1 className="retro-title text-4xl sm:text-5xl">{tx.title}</h1>
        <p className="mx-auto mt-5 max-w-md text-cream/70">{tx.subtitle}</p>

        {names.length > 0 && (
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-gold">
            {names.join(' · ')}
          </p>
        )}

        {/* Renvoi de l'email */}
        <div className="mt-8">
          {state === 'sent' ? (
            <p className="text-sm font-semibold text-teal-soft">{tx.resent}</p>
          ) : (
            <button
              type="button"
              onClick={resend}
              disabled={!resendToken || left > 0 || state === 'sending'}
              className="rounded-full border border-cream/20 px-6 py-2.5 text-sm font-semibold text-cream/75 transition-colors hover:border-cream/40 hover:text-cream disabled:cursor-not-allowed disabled:opacity-45"
            >
              {left > 0 ? tx.wait.replace('{s}', String(left)) : tx.nothing}
            </button>
          )}
          {state === 'error' && (
            <p className="mt-3 text-sm text-magenta-soft">{ui.plugins.form.errorGeneric}</p>
          )}
        </div>

        <Link
          href="/plugins/installation"
          className="mt-6 inline-block text-sm text-gold underline-offset-4 hover:underline"
        >
          {tx.installCta} →
        </Link>

        {/* ── Abonnement Instagram (facultatif) ──────────────────── */}
        {instagram && (
          <div className="glass-warm mt-12 rounded-[2rem] p-7 text-left">
            <h2 className="font-display text-2xl font-bold text-cream">{tx.followTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-cream/70">{tx.followText}</p>
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-magenta to-coral px-6 py-3 text-sm font-bold text-night transition-transform hover:scale-105"
            >
              <SocialIcon.instagram className="h-4 w-4" />
              {tx.followCta}
            </a>
          </div>
        )}

        {/* ── Don (jamais une condition du téléchargement) ───────── */}
        {paypalMe && (
          <div className="glass-warm mt-14 rounded-[2rem] p-7 text-left">
            <h2 className="font-display text-2xl font-bold text-cream">{tx.donateTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-cream/70">{tx.donateText}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              {AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => donate(a)}
                  className="rounded-full bg-gradient-to-r from-magenta to-coral px-6 py-3 text-sm font-bold text-night transition-transform hover:scale-105"
                >
                  {a} €
                </button>
              ))}
              <button
                type="button"
                onClick={() => donate()}
                className="rounded-full border border-cream/25 px-6 py-3 text-sm font-bold text-cream/85 transition-colors hover:border-gold hover:text-gold"
              >
                {tx.donateFree}
              </button>
            </div>

            <p className="mt-4 text-xs text-cream/40">{tx.donateThanks}</p>
          </div>
        )}

        <p className="mt-12 text-sm text-cream/45">
          <Link href="/plugins" className="underline-offset-4 hover:text-cream hover:underline">
            {ui.plugins.backToPlugins}
          </Link>
          {' · '}
          <Link href="/" className="underline-offset-4 hover:text-cream hover:underline">
            {content.artist.name}
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
