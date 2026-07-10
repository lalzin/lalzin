'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useContent } from '@/components/providers/ContentProvider';
import { SocialIcon } from '@/components/ui/icons';
import LangSwitch from '@/components/ui/LangSwitch';
import Confetti from '@/components/Confetti';
import { groovy } from '@/components/ui/motion';
import { resolveListenHref } from '@/lib/links';

const accent: Record<string, string> = {
  spotify: '#15C7B8',
  instagram: '#FF2E92',
  appleMusic: '#FF6B35',
  youtube: '#FF3B3B',
  soundcloud: '#FF7A00',
  facebook: '#3b82f6',
};

export default function LinksPage() {
  const { content, t, ui } = useContent();
  const { artist, socials } = content;

  const items = [
    ...socials.map((s) => ({ ...s, color: accent[s.key] ?? '#FF2E92', icon: SocialIcon[s.key] })),
  ];
  const featured = content.releases.filter((r) => r.featured).slice(0, 4);

  return (
    <main className="grain relative flex min-h-[100svh] flex-col items-center overflow-hidden px-5 py-10">
      {/* Halos + confettis */}
      <div className="halo left-[10%] top-[5%] h-72 w-72 bg-magenta" />
      <div className="halo right-[8%] top-[30%] h-72 w-72 bg-coral" />
      <div className="halo bottom-[8%] left-[35%] h-72 w-72 bg-teal" />
      <Confetti count={20} />

      <div className="absolute right-5 top-5 z-20">
        <LangSwitch />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: groovy }}
        className="relative z-10 flex w-full max-w-md flex-1 flex-col items-center"
      >
        {/* Avatar logo dans un cadre disco */}
        <div className="relative mt-6">
          <div className="absolute -inset-3 animate-spin-slow rounded-full bg-gradient-to-br from-magenta via-coral to-gold opacity-80 blur-md" />
          <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-cream/15 bg-night p-5">
            <Image src={artist.logo} alt={artist.name} fill className="object-contain p-5" sizes="112px" />
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold to-coral text-lg shadow-lg">
            🪩
          </div>
        </div>

        <h1 className="retro-title mt-6 text-5xl">{artist.name}</h1>
        <p className="mt-3 max-w-xs text-center text-sm text-cream/75">{t(artist.tagline)}</p>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
          {artist.genres.join(' · ')}
        </p>

        {/* Écouter — morceaux phares */}
        {featured.length > 0 && (
          <div className="mt-8 w-full space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-cream/45">
              {ui.links.listen}
            </p>
            {featured.map((r, i) => (
              <motion.a
                key={r.id}
                href={resolveListenHref(r.href, socials)}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: groovy, delay: 0.08 + i * 0.05 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="group flex items-center gap-4 rounded-2xl border border-cream/12 bg-gradient-to-r from-magenta/20 to-coral/15 px-5 py-4 backdrop-blur-sm transition-colors hover:border-gold/50"
              >
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-cream/90 text-night">
                  ▶
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-cream">{r.title}</span>
                  <span className="text-[11px] uppercase tracking-wider text-cream/50">{r.type}</span>
                </span>
                <span className="ml-auto text-cream/40 transition-transform group-hover:translate-x-1 group-hover:text-cream">
                  ↗
                </span>
              </motion.a>
            ))}
          </div>
        )}

        {/* Réseaux */}
        <div className="mt-6 w-full space-y-3">
          {items.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.a
                key={s.key}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: groovy, delay: 0.1 + i * 0.06 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-cream/12 bg-cream/[0.05] px-5 py-4 backdrop-blur-sm transition-colors hover:border-cream/30"
              >
                <span
                  className="absolute -left-8 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-70"
                  style={{ background: s.color }}
                />
                <span
                  className="relative flex h-9 w-9 flex-none items-center justify-center rounded-xl"
                  style={{ background: `${s.color}26`, color: s.color }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="relative font-semibold text-cream">{s.label}</span>
                <span className="relative ml-auto text-cream/40 transition-transform group-hover:translate-x-1 group-hover:text-cream">
                  ↗
                </span>
              </motion.a>
            );
          })}

          {/* Booking */}
          <motion.a
            href={`mailto:${artist.bookingEmail}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: groovy, delay: 0.1 + items.length * 0.06 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-magenta via-coral to-gold px-5 py-4 font-bold text-night shadow-lg shadow-magenta/30"
          >
            ✉ {ui.nav.contact} — {artist.bookingEmail}
          </motion.a>
        </div>

        {/* Retour au site */}
        <Link
          href="/"
          className="mt-8 inline-block rounded-full border border-cream/20 bg-cream/5 px-6 py-2.5 text-sm font-semibold text-cream/80 transition-colors hover:text-cream"
        >
          ← {ui.links.back}
        </Link>

        <p className="mb-2 mt-8 text-[11px] text-cream/35">
          © {new Date().getFullYear()} {artist.name}
        </p>
      </motion.div>
    </main>
  );
}
