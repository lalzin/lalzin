'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '@/components/providers/ContentProvider';
import DownloadForm from '@/components/plugins/DownloadForm';
import PluginWindow from '@/components/plugins/PluginWindow';
import Reveal from '@/components/ui/Reveal';
import Navbar from '@/components/Navbar';
import {
  OS_LABEL,
  availableOS,
  formatBytes,
  pluginImage,
  uiStates,
  type OS,
  type Plugin,
} from '@/lib/plugins';

export default function PluginDetail({
  plugin,
  expired,
  turnstileSiteKey,
  others = [],
}: {
  plugin: Plugin;
  expired: boolean;
  turnstileSiteKey: string;
  others?: Plugin[];
}) {
  const { t, ui, lang } = useContent();
  const tx = ui.plugins;
  const features = plugin.features[lang] ?? plugin.features.fr;
  const states = uiStates(plugin.slug);
  const estInstrument = plugin.type === 'instrument';
  const usage = tx.usage[plugin.slug as keyof typeof tx.usage];
  const oses = availableOS(plugin);
  const { accent, accent2 } = plugin.colors;

  return (
    <main className="relative min-h-[100svh] overflow-hidden pb-24 pt-28">
      <Navbar />
      {/* Halos aux couleurs du plugin, discrets (le fond reste celui du site) */}
      <div
        aria-hidden
        className="halo left-[12%] top-[8%] h-80 w-80"
        style={{ background: accent, opacity: 0.22 }}
      />
      <div
        aria-hidden
        className="halo right-[10%] top-[45%] h-72 w-72"
        style={{ background: accent2, opacity: 0.22 }}
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <Link
          href="/plugins"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-cream/45 transition-colors hover:text-cream"
        >
          {tx.backToPlugins}
        </Link>

        {/* ── HERO ─────────────────────────────────────────────── */}
        <div className="mt-8 grid items-center gap-14 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block rounded-full border border-cream/15 bg-cream/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-gold">
                {tx.eyebrow} · {tx.free}
              </span>
              <span
                className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-night"
                style={{ background: estInstrument ? accent2 : accent }}
              >
                {estInstrument ? tx.instrument : tx.effect}
              </span>
            </div>
            <h1 className="retro-title mt-5 text-5xl sm:text-6xl">{plugin.name}</h1>
            <p className="mt-4 text-lg text-cream/80">{t(plugin.tagline)}</p>
            <p className="mt-5 leading-relaxed text-cream/65">{t(plugin.description)}</p>

            {usage && (
              <p className="mt-4 rounded-2xl border border-cream/12 bg-cream/[0.04] px-4 py-3 text-sm text-cream/75">
                <span aria-hidden>🎚️ </span>
                {usage}
              </p>
            )}

            {plugin.latency_ms != null && (
              <p className="mt-2 text-xs text-cream/45">
                {tx.latency} : {String(plugin.latency_ms).replace('.', ',')} ms
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#telecharger"
                style={{ backgroundImage: `linear-gradient(90deg, ${accent}, ${accent2})` }}
                className="rounded-full px-7 py-3.5 text-sm font-bold text-cream shadow-lg transition-transform hover:scale-105"
              >
                {tx.download}
              </a>
              <Link
                href="/plugins/installation"
                className="rounded-full border border-cream/25 px-7 py-3.5 text-sm font-bold text-cream/85 transition-colors hover:border-gold hover:text-gold"
              >
                {tx.installGuide}
              </Link>
            </div>

            <p className="mt-5 text-xs uppercase tracking-[0.2em] text-cream/40">
              {tx.version} {plugin.version} · {oses.map((o) => OS_LABEL[o]).join(' · ')} ·{' '}
              {plugin.downloads.macos.formats.join(' · ')}
            </p>
          </div>

          <div className="order-1 flex min-w-0 justify-center lg:order-2">
            <PluginWindow plugin={plugin} width={400} priority />
          </div>
        </div>

        {/* ── POINTS FORTS ─────────────────────────────────────── */}
        <section className="mt-24">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-cream">{tx.highlights}</h2>
          </Reveal>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {features.map((f, i) => (
              <Reveal key={f} delay={i * 0.05}>
                <div className="flex h-full items-start gap-4 rounded-2xl border border-cream/10 bg-cream/[0.04] p-5">
                  <span
                    className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full text-sm font-bold text-night"
                    style={{ background: i % 2 ? accent2 : accent }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-cream/80">{f}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── PRESETS ──────────────────────────────────────────── */}
        <section className="mt-20">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-cream">
              {plugin.slug === 'sing-it-back' ? tx.styles : tx.presets}
            </h2>
          </Reveal>
          <Reveal delay={0.05}>
            <ul className="mt-6 flex flex-wrap gap-2.5">
              {plugin.presets.map((p) => (
                <li
                  key={p}
                  className="rounded-full border border-cream/15 bg-cream/[0.05] px-4 py-2 text-sm font-medium text-cream/80"
                >
                  {p}
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        {/* ── GALERIE DES ÉTATS ────────────────────────────────── */}
        {states.length > 0 && (
          <section className="mt-20">
            <Reveal>
              <h2 className="font-display text-3xl font-bold text-cream">{tx.states}</h2>
            </Reveal>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {states.map((s: { file: string; label: typeof plugin.tagline }, i: number) => (
                <Reveal key={s.file} delay={i * 0.05}>
                  <figure>
                    <Image
                      src={pluginImage(plugin.slug, s.file)}
                      alt={`${plugin.name}, ${t(s.label)}`}
                      width={840}
                      height={1040}
                      sizes="(max-width: 640px) 80vw, 320px"
                      className="h-auto w-full rounded-2xl border border-cream/12"
                    />
                    <figcaption className="mt-3 text-center text-sm text-cream/60">{t(s.label)}</figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* ── TÉLÉCHARGEMENT ───────────────────────────────────── */}
        <section className="mt-24">
          <DownloadForm
            plugin={plugin}
            expired={expired}
            turnstileSiteKey={turnstileSiteKey}
            others={others}
          />
        </section>

        {/* ── CONFIGURATION REQUISE ────────────────────────────── */}
        <section className="mt-20">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-cream">{tx.requirements}</h2>
          </Reveal>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {(['macos', 'windows'] as OS[]).map((os) => {
              const d = plugin.downloads[os];
              const available = oses.includes(os);
              return (
                <Reveal key={os}>
                  <div
                    className={`h-full rounded-2xl border p-6 ${
                      available ? 'border-cream/12 bg-cream/[0.04]' : 'border-dashed border-cream/12'
                    }`}
                  >
                    <h3 className="font-display text-xl font-bold text-cream">
                      {OS_LABEL[os]}
                      {!available && (
                        <span className="ml-3 rounded-full bg-cream/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cream/55">
                          {tx.soon}
                        </span>
                      )}
                    </h3>
                    <dl className="mt-4 space-y-2 text-sm">
                      <div className="flex gap-2">
                        <dt className="text-cream/45">{tx.requirements} :</dt>
                        <dd className="text-cream/80">{d.requirements}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-cream/45">{tx.formats} :</dt>
                        <dd className="text-cream/80">{d.formats.join(', ')}</dd>
                      </div>
                      {available && (
                        <div className="flex gap-2">
                          <dt className="text-cream/45">{tx.size} :</dt>
                          <dd className="text-cream/80">{formatBytes(d.bytes, lang)}</dd>
                        </div>
                      )}
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
