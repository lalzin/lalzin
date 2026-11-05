'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { useContent } from '@/components/providers/ContentProvider';
import { suite, suiteImage, type Plugin } from '@/lib/plugins';

/**
 * Carte « toute la suite » de la grille /plugins. Même gabarit que les
 * cartes de plugin (zone image de même hauteur), pour que titres et
 * boutons restent alignés sur la rangée.
 */
export default function SuiteCard({ suiteDl, index = 0 }: { suiteDl: Plugin; index?: number }) {
  const { t, ui } = useContent();
  const reduced = useReducedMotion();
  const noms = suite.includes ?? [];
  const texte = ui.plugins.suiteText
    .replace('{n}', String(noms.length))
    .replace('{v}', suiteDl.version);

  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 28 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.34, 1.3, 0.5, 1], delay: index * 0.08 }}
      className="group relative flex w-full flex-col overflow-hidden rounded-[2rem] border border-gold/30 bg-gradient-to-b from-gold/[0.09] to-cream/[0.03] p-6 backdrop-blur-sm transition-colors hover:border-gold/60"
    >
      <a href="#telecharger" className="relative">
        <div className="pb-6">
          <div className="flex w-full items-center justify-center" style={{ aspectRatio: '840 / 645' }}>
            <Image
              src={suiteImage(suite.images.og)}
              alt={`${suite.name}, ${t(suite.tagline)}`}
              width={1200}
              height={630}
              sizes="(max-width: 640px) 80vw, 300px"
              className="h-auto w-full rounded-2xl border border-cream/15 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:-translate-y-1"
            />
          </div>
        </div>

        <h3 className="mt-2 font-display text-2xl font-bold text-cream">{ui.plugins.suiteTitle}</h3>
        <p className="mt-1 text-sm text-gold/80">{suite.name}</p>
        <p className="mt-3 min-h-[3rem] text-sm leading-relaxed text-cream/75">{texte}</p>
      </a>

      <a
        href="#telecharger"
        className="relative mt-5 rounded-full bg-gradient-to-r from-magenta via-coral to-gold px-5 py-3 text-center text-sm font-bold text-night shadow-lg transition-transform hover:scale-[1.03]"
      >
        {ui.plugins.suiteCta}
      </a>

      <p className="relative mt-3 text-center text-[11px] leading-relaxed text-cream/40">{noms.join(' · ')}</p>
    </motion.article>
  );
}
