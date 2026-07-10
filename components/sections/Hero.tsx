'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useContent } from '@/components/providers/ContentProvider';
import Confetti from '@/components/Confetti';
import { groovy } from '@/components/ui/motion';

const HeroCanvas = dynamic(() => import('@/components/three/HeroCanvas'), { ssr: false });

export default function Hero() {
  const { content, t, ui } = useContent();
  const { artist } = content;

  return (
    <section
      id="home"
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-28"
    >
      {/* Titre H1 pour le SEO (le visuel étant le logo en image) */}
      <h1 className="sr-only">
        {artist.name} — DJ &amp; producteur funky house, disco funk &amp; bass house
      </h1>

      {/* Filigrane live + voile sombre */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.12] mix-blend-luminosity"
        style={{ backgroundImage: `url(${artist.photos.live})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-night-deep/60 via-night-deep/20 to-night-deep" />

      <Confetti count={18} />

      {/* Boule disco suspendue */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Fil de suspension */}
        <div className="h-16 w-px bg-gradient-to-b from-transparent via-cream/30 to-cream/50 sm:h-20" />

        <div className="relative aspect-square w-[68vw] max-w-[400px]">
          {/* Rayons + halo derrière la boule */}
          <div className="light-rays absolute inset-[-40%] animate-spin-slow rounded-full opacity-80" />
          <div className="absolute inset-0 -z-0 rounded-full bg-[radial-gradient(circle,rgba(232,72,126,0.28),transparent_62%)] blur-2xl" />
          <HeroCanvas />
        </div>
      </div>

      {/* Logo + tagline + CTA */}
      <div className="relative z-10 mt-4 flex flex-col items-center text-center">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: groovy }}
          className="mb-6 rounded-full border border-cream/15 bg-cream/[0.04] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/90 backdrop-blur-sm"
        >
          {artist.genres.join(' · ')}
        </motion.span>

        {/* Logo réel détouré (lettres crème sur transparent) */}
        <motion.img
          src={artist.logo}
          alt={artist.name}
          initial={{ opacity: 0, scale: 0.9, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: groovy, delay: 0.1 }}
          className="h-auto w-[min(58vw,300px)] select-none drop-shadow-[0_4px_30px_rgba(232,72,126,0.25)]"
          draggable={false}
        />

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: groovy, delay: 0.4 }}
          className="mt-3 max-w-md text-base font-light text-cream/75 sm:text-lg"
        >
          {t(artist.tagline)}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: groovy, delay: 0.55 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <a
            href="#discography"
            className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-magenta via-coral to-gold px-7 py-3.5 text-sm font-bold text-night shadow-lg shadow-magenta/30 transition-transform hover:scale-105"
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-night/20 text-[10px]">▶</span>
            {ui.hero.listen}
          </a>
          <a
            href="#contact"
            className="rounded-full border border-cream/25 px-7 py-3.5 text-sm font-bold text-cream/90 transition-colors hover:border-gold hover:text-gold"
          >
            {ui.hero.booking}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
