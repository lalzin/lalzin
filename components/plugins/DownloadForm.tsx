'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useContent } from '@/components/providers/ContentProvider';
import Turnstile from './Turnstile';
import {
  OS_LABEL,
  availableOS,
  formatBytes,
  plugins as allPlugins,
  type OS,
  type Plugin,
} from '@/lib/plugins';

/** Devine l'OS du visiteur (modifiable ensuite). */
function guessOS(): OS {
  if (typeof navigator === 'undefined') return 'macos';
  const ua = `${navigator.userAgent} ${navigator.platform ?? ''}`.toLowerCase();
  if (/mac|iphone|ipad/.test(ua)) return 'macos';
  if (/win/.test(ua)) return 'windows';
  return 'macos';
}

type Props = {
  plugin: Plugin;
  /** Affiche le bandeau « lien expiré » (?expire=1). */
  expired?: boolean;
  /** Affiche le bandeau « fichier pas encore en ligne » (?indisponible=1). */
  notYet?: boolean;
  /** Clé publique Turnstile (vide = captcha désactivé). */
  turnstileSiteKey?: string;
};

export default function DownloadForm({
  plugin,
  expired = false,
  notYet = false,
  turnstileSiteKey = '',
}: Props) {
  const { ui, lang, content } = useContent();
  const router = useRouter();
  const tx = ui.plugins.form;

  const oses = useMemo(() => availableOS(plugin), [plugin]);
  const others = useMemo(() => allPlugins.filter((p) => p.slug !== plugin.slug), [plugin.slug]);

  const [email, setEmail] = useState('');
  const [os, setOS] = useState<OS>(oses[0] ?? 'macos');
  const [extra, setExtra] = useState<string[]>([]);
  const [newsletter, setNewsletter] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Pré-sélection d'après le user-agent, si cet OS est disponible.
  useEffect(() => {
    const guessed = guessOS();
    if (oses.includes(guessed)) setOS(guessed);
  }, [oses]);

  const toggleExtra = (slug: string) =>
    setExtra((list) => (list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError(tx.errorEmail);
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/plugins/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          os,
          plugins: [plugin.slug, ...extra],
          newsletter,
          lang,
          turnstileToken: captcha ?? undefined,
          website,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; redirect?: string; error?: string };

      if (res.ok && data.ok && data.redirect) {
        router.push(data.redirect);
        return;
      }
      setError(
        data.error === 'rate'
          ? tx.errorRate
          : data.error === 'captcha'
            ? tx.errorCaptcha
            : tx.errorGeneric,
      );
    } catch {
      setError(tx.errorGeneric);
    } finally {
      setSending(false);
    }
  };

  const accent = plugin.colors.accent;

  return (
    <section id="telecharger" className="scroll-mt-28">
      <div className="glass-warm mx-auto max-w-xl rounded-[2rem] p-6 sm:p-8">
        {notYet && (
          <p className="mb-5 rounded-2xl border border-teal/40 bg-teal/10 px-4 py-3 text-sm text-teal-soft">
            <strong className="font-bold">{ui.plugins.notYet.title}.</strong> {ui.plugins.notYet.text}
          </p>
        )}

        {expired && (
          <p className="mb-5 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">
            <strong className="font-bold">{ui.plugins.expired.title}.</strong> {ui.plugins.expired.text}
          </p>
        )}

        <h2 className="font-display text-2xl font-bold text-cream sm:text-3xl">{tx.title}</h2>
        <p className="mt-2 text-sm text-cream/65">{tx.subtitle}</p>

        <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
          {/* Email */}
          <div>
            <label htmlFor="df-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-cream/55">
              {tx.email}
            </label>
            <input
              id="df-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={tx.emailPlaceholder}
              className="w-full rounded-2xl border border-cream/15 bg-night-deep/60 px-4 py-3 text-cream placeholder:text-cream/30 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          {/* OS */}
          <fieldset>
            <legend className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-cream/55">
              {tx.os}
            </legend>
            <div className="flex flex-wrap gap-2">
              {oses.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOS(o)}
                  aria-pressed={os === o}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    os === o
                      ? 'border-transparent bg-cream text-night'
                      : 'border-cream/20 text-cream/70 hover:border-cream/40 hover:text-cream'
                  }`}
                >
                  {OS_LABEL[o]}
                  <span className="ml-2 text-xs font-normal opacity-60">
                    {formatBytes(plugin.downloads[o].bytes, lang)}
                  </span>
                </button>
              ))}
            </div>
            {oses.length < 2 && <p className="mt-2 text-xs text-cream/45">{ui.plugins.osUnavailable}</p>}
          </fieldset>

          {/* Autres plugins de la suite (une seule demande pour tout) */}
          {others.length > 0 && (
            <fieldset>
              <legend className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-cream/55">
                {tx.alsoWant}
              </legend>
              <div className="space-y-2">
                {others.map((p) => (
                  <label key={p.slug} className="flex cursor-pointer items-center gap-3 text-sm text-cream/80">
                    <input
                      type="checkbox"
                      checked={extra.includes(p.slug)}
                      onChange={() => toggleExtra(p.slug)}
                      className="h-4 w-4 accent-gold"
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {/* Newsletter — décochée par défaut, séparée du reste */}
          <div className="rounded-2xl border border-cream/10 bg-cream/[0.03] p-4">
            <label className="flex cursor-pointer items-start gap-3 text-sm text-cream/75">
              <input
                type="checkbox"
                checked={newsletter}
                onChange={(e) => setNewsletter(e.target.checked)}
                className="mt-0.5 h-4 w-4 flex-none accent-gold"
              />
              <span>{tx.newsletter}</span>
            </label>
            <p className="mt-3 text-xs text-cream/45">
              {tx.privacyNote}{' '}
              <Link href="/confidentialite" className="text-gold underline-offset-2 hover:underline">
                {tx.privacy}
              </Link>
              .
            </p>
          </div>

          {/* Honeypot : invisible pour un humain, rempli par les robots */}
          <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
            <label htmlFor="df-website">Website</label>
            <input
              id="df-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          {turnstileSiteKey && <Turnstile siteKey={turnstileSiteKey} onToken={setCaptcha} />}

          {error && (
            <p role="alert" className="rounded-2xl border border-magenta/40 bg-magenta/10 px-4 py-3 text-sm text-magenta-soft">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            style={{ backgroundImage: `linear-gradient(90deg, ${accent}, ${plugin.colors.accent2})` }}
            className="w-full rounded-full px-6 py-4 text-base font-bold text-cream shadow-lg transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? tx.sending : tx.submit}
          </button>

          <p className="text-center text-xs text-cream/40">
            {content.artist.name} · {ui.plugins.free} ·{' '}
            <Link href="/plugins/installation" className="underline-offset-2 hover:text-cream/70 hover:underline">
              {ui.plugins.installGuide}
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
