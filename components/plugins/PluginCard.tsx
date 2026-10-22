'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useContent } from '@/components/providers/ContentProvider';
import { imageSize, pluginImage, type Plugin } from '@/lib/plugins';

/** Carte de la page /plugins : fenêtre du plugin + mascotte qui dépasse. */
export default function PluginCard({ plugin, index = 0 }: { plugin: Plugin; index?: number }) {
  const { t, ui } = useContent();
  const reduced = useReducedMotion();
  const { accent, accent2 } = plugin.colors;
  const [heroW, heroH] = imageSize(plugin.slug, 'ui-hero.webp');
  const [mascotW, mascotH] = imageSize(plugin.slug, 'mascot.webp');

  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 28 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.34, 1.3, 0.5, 1], delay: index * 0.08 }}
      className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-cream/12 bg-cream/[0.04] p-6 backdrop-blur-sm transition-colors hover:border-cream/25"
    >
      {/* Teinte du plugin */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-40 opacity-30 blur-2xl transition-opacity duration-500 group-hover:opacity-50"
        style={{ background: `radial-gradient(circle at 50% 0%, ${accent}, transparent 70%)` }}
      />

      <Link href={`/plugins/${plugin.slug}`} className="relative">
        {/* Fenêtre + mascotte */}
        <div className="relative mx-auto w-[62%] pb-6">
          <Image
            src={pluginImage(plugin.slug, 'ui-hero.webp')}
            alt={`${plugin.name}, interface du plugin`}
            width={heroW}
            height={heroH}
            sizes="(max-width: 640px) 55vw, 220px"
            className="h-auto w-full rounded-2xl border border-cream/15 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:-translate-y-1"
          />
          <Image
            src={pluginImage(plugin.slug, 'mascot.webp')}
            alt={plugin.mascot}
            width={mascotW}
            height={mascotH}
            sizes="(max-width: 640px) 36vw, 150px"
            className="absolute -bottom-1 -right-8 w-[62%] drop-shadow-[0_14px_22px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:-rotate-3 group-hover:scale-105"
          />
        </div>

        <h3 className="mt-2 font-display text-2xl font-bold text-cream">{plugin.name}</h3>
        <p className="mt-1 text-sm text-cream/40">{plugin.mascot}</p>
        <p className="mt-3 min-h-[3rem] text-sm leading-relaxed text-cream/75">{t(plugin.tagline)}</p>
      </Link>

      <div className="relative mt-5 flex flex-col gap-2.5">
        <Link
          href={`/plugins/${plugin.slug}#telecharger`}
          style={{ backgroundImage: `linear-gradient(90deg, ${accent}, ${accent2})` }}
          className="rounded-full px-5 py-3 text-center text-sm font-bold text-cream shadow-lg transition-transform hover:scale-[1.03]"
        >
          {ui.plugins.download}
        </Link>
        <Link
          href={`/plugins/${plugin.slug}`}
          className="rounded-full border border-cream/20 px-4 py-2.5 text-center text-sm font-semibold text-cream/75 transition-colors hover:border-gold hover:text-gold"
        >
          {ui.plugins.discover}
        </Link>
      </div>

      <p className="relative mt-3 text-center text-[11px] uppercase tracking-[0.2em] text-cream/35">
        {ui.plugins.free} · v{plugin.version} · {plugin.downloads.macos.formats.join(' · ')}
      </p>
    </motion.article>
  );
}
