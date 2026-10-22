'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { heroIsLandscape, imageSize, pluginImage, type Plugin } from '@/lib/plugins';

type Props = {
  plugin: Plugin;
  /**
   * Largeur maximale du rendu. Par défaut : 400 px pour une fenêtre portrait
   * (420 x 520 dans le DAW), 680 px pour une fenêtre paysage (760 x 480).
   */
  width?: number;
  priority?: boolean;
  className?: string;
};

/**
 * Fenêtre du plugin + mascotte détourée qui dépasse du cadre.
 * La mascotte flotte doucement et rebondit au survol ; tout est figé si
 * le visiteur a demandé moins d'animations.
 */
export default function PluginWindow({ plugin, width, priority = false, className = '' }: Props) {
  const reduced = useReducedMotion();
  const [heroW, heroH] = imageSize(plugin.slug, 'ui-hero.webp');
  const [mascotW, mascotH] = imageSize(plugin.slug, 'mascot.webp');
  const paysage = heroIsLandscape(plugin.slug);
  const maxW = width ?? (paysage ? 680 : 400);

  return (
    <div className={`relative w-full ${className}`} style={{ maxWidth: maxW }}>
      {/* Halo aux couleurs du plugin */}
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-full opacity-45 blur-3xl"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${plugin.colors.accent}, transparent 62%)`,
        }}
      />

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 24 }}
        animate={reduced ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.34, 1.3, 0.5, 1] }}
        className="overflow-hidden rounded-[1.4rem] border border-cream/15 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.75)]"
      >
        <Image
          src={pluginImage(plugin.slug, 'ui-hero.webp')}
          alt={`${plugin.name}, interface du plugin`}
          width={heroW}
          height={heroH}
          priority={priority}
          sizes={`(max-width: 640px) 92vw, ${maxW}px`}
          className="h-auto w-full"
        />
      </motion.div>

      {/* Mascotte : dépasse volontairement du cadre */}
      <motion.div
        className={`absolute cursor-pointer ${
          paysage
            ? '-bottom-10 -right-2 w-[27%] sm:-right-8'
            : '-bottom-6 -right-2 w-[58%] sm:-right-14'
        }`}
        initial={reduced ? false : { opacity: 0, scale: 0.9, y: 10 }}
        animate={
          reduced
            ? undefined
            : { opacity: 1, scale: 1, y: [0, -9, 0] }
        }
        transition={
          reduced
            ? undefined
            : {
                opacity: { duration: 0.5, delay: 0.25 },
                scale: { duration: 0.5, delay: 0.25 },
                y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 },
              }
        }
        whileHover={reduced ? undefined : { scale: 1.07, rotate: -3 }}
      >
        <Image
          src={pluginImage(plugin.slug, 'mascot.webp')}
          alt={plugin.mascot}
          width={mascotW}
          height={mascotH}
          priority={priority}
          sizes={paysage ? '(max-width: 640px) 28vw, 190px' : '(max-width: 640px) 45vw, 260px'}
          className="h-auto w-full drop-shadow-[0_18px_28px_rgba(0,0,0,0.55)]"
        />
      </motion.div>
    </div>
  );
}
