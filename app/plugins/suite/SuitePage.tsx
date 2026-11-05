'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '@/components/providers/ContentProvider';
import DownloadForm from '@/components/plugins/DownloadForm';
import Navbar from '@/components/Navbar';
import Reveal from '@/components/ui/Reveal';
import {
  ALL_PLUGINS,
  OS_LABEL,
  availableOS,
  formatBytes,
  pluginImage,
  suite,
  suiteImage,
  type OS,
  type Plugin,
} from '@/lib/plugins';
import { ArrowLeft, ArrowRight } from 'lucide-react';

/**
 * Page de l'installateur de toute la suite : ce qu'il contient, la
 * configuration requise, et le formulaire de téléchargement.
 */
export default function SuitePage({
  suiteDl,
  publies,
  expired,
  turnstileSiteKey,
}: {
  suiteDl: Plugin;
  /** Slugs des plugins publiés : seuls ceux-là ont une page à lier. */
  publies: string[];
  expired: boolean;
  turnstileSiteKey: string;
}) {
  const { t, ui, lang } = useContent();
  const tx = ui.plugins;
  const oses = availableOS(suiteDl);
  const texte = tx.suiteText.replace('{n}', String(ALL_PLUGINS.length)).replace('{v}', suiteDl.version);

  return (
    <main className="relative min-h-[100svh] overflow-hidden pb-24 pt-28">
      <Navbar />
      <div className="halo left-[8%] top-[10%] h-80 w-80 bg-magenta" />
      <div className="halo right-[10%] top-[40%] h-72 w-72 bg-gold" />

      <div className="relative mx-auto max-w-6xl px-6">
        <Link
          href="/plugins"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cream/45 transition-colors hover:text-cream"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {tx.backToPlugins}
        </Link>

        {/* ── HERO ─────────────────────────────────────────────── */}
        <Reveal>
          <div className="relative mt-8 overflow-hidden rounded-[2rem] border border-cream/12">
            <Image
              src={suiteImage(suite.images.banner)}
              alt={`${suite.name}, ${t(suite.tagline)}`}
              width={2400}
              height={1000}
              priority
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="h-auto w-full"
            />
          </div>
        </Reveal>

        <div className="mx-auto mt-12 max-w-3xl text-center">
          <span className="inline-block rounded-full border border-cream/15 bg-cream/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-gold">
            {suite.name} · {tx.free}
          </span>
          <h1 className="retro-title mt-5 text-5xl sm:text-6xl">{tx.suiteTitle}</h1>
          <p className="mt-4 text-lg text-cream/80">{texte}</p>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-cream/65">{tx.suitePage.intro}</p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#telecharger"
              className="rounded-full bg-gradient-to-r from-magenta via-coral to-gold px-7 py-3.5 text-sm font-bold text-night shadow-lg shadow-magenta/30 transition-transform hover:scale-105"
            >
              {tx.suiteCta}
            </a>
            <Link
              href="/plugins/installation"
              className="rounded-full border border-cream/25 px-7 py-3.5 text-sm font-bold text-cream/85 transition-colors hover:border-gold hover:text-gold"
            >
              {tx.installGuide}
            </Link>
          </div>

          <p className="mt-5 text-xs uppercase tracking-[0.2em] text-cream/40">
            {tx.version} {suiteDl.version} · {oses.map((o) => OS_LABEL[o]).join(' · ')} ·{' '}
            {suiteDl.downloads.macos.formats.join(' · ')}
          </p>
        </div>

        {/* ── CONTENU DE LA SUITE ──────────────────────────────── */}
        <section className="mt-24">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-cream">{tx.suitePage.contentsTitle}</h2>
          </Reveal>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {ALL_PLUGINS.map((p, i) => {
              const enLigne = publies.includes(p.slug);
              const avecSend = p.downloads.macos.includes?.includes('Kick Lock Send');
              const contenu = (
                <div className="flex h-full items-center gap-4 rounded-2xl border border-cream/10 bg-cream/[0.04] p-4 transition-colors group-hover:border-cream/25">
                  <Image
                    src={pluginImage(p.slug, 'icon-512.webp')}
                    alt=""
                    width={512}
                    height={512}
                    sizes="56px"
                    className="h-14 w-14 flex-none rounded-xl"
                  />
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-baseline gap-x-2 font-display text-lg font-bold text-cream">
                      {p.name}
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: p.colors.accent }}>
                        {p.type === 'instrument' ? tx.instrument : tx.effect}
                      </span>
                    </p>
                    <p className="text-sm text-cream/65">{t(p.tagline)}</p>
                    {avecSend && <p className="mt-0.5 text-xs text-cream/45">{tx.suitePage.withSend}</p>}
                  </div>
                  {enLigne && (
                    <ArrowRight
                      className="ml-auto h-4 w-4 flex-none text-cream/35 transition-transform group-hover:translate-x-1 group-hover:text-cream"
                      aria-hidden
                    />
                  )}
                </div>
              );
              return (
                <Reveal key={p.slug} delay={Math.min(i, 6) * 0.04}>
                  {enLigne ? (
                    <Link href={`/plugins/${p.slug}`} className="group block h-full" aria-label={`${tx.suitePage.viewPlugin} ${p.name}`}>
                      {contenu}
                    </Link>
                  ) : (
                    contenu
                  )}
                </Reveal>
              );
            })}
          </div>
          <Reveal>
            <p className="mt-5 text-sm text-cream/50">{tx.suitePage.alone}</p>
          </Reveal>
        </section>

        {/* ── TÉLÉCHARGEMENT ───────────────────────────────────── */}
        <section className="mt-24">
          <DownloadForm
            plugin={suiteDl}
            expired={expired}
            turnstileSiteKey={turnstileSiteKey}
            title={tx.suiteFormTitle}
          />
        </section>

        {/* ── CONFIGURATION REQUISE ────────────────────────────── */}
        <section className="mt-20">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-cream">{tx.requirements}</h2>
          </Reveal>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {(['macos', 'windows'] as OS[]).map((os) => {
              const d = suiteDl.downloads[os];
              return (
                <Reveal key={os}>
                  <div className="h-full rounded-2xl border border-cream/12 bg-cream/[0.04] p-6">
                    <h3 className="font-display text-xl font-bold text-cream">{OS_LABEL[os]}</h3>
                    <dl className="mt-4 space-y-2 text-sm">
                      <div className="flex gap-2">
                        <dt className="text-cream/45">{tx.requirements} :</dt>
                        <dd className="text-cream/80">{d.requirements}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-cream/45">{tx.formats} :</dt>
                        <dd className="text-cream/80">{d.formats.join(', ')}</dd>
                      </div>
                      {d.bytes ? (
                        <div className="flex gap-2">
                          <dt className="text-cream/45">{tx.size} :</dt>
                          <dd className="text-cream/80">{formatBytes(d.bytes, lang)}</dd>
                        </div>
                      ) : null}
                      {d.signed && (
                        <div className="flex gap-2">
                          <dt className="text-cream/45">{tx.signature} :</dt>
                          <dd className="text-teal-soft">{tx.signedApple}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
