'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { pluginImage, type Plugin } from '@/lib/plugins';

type Props = {
  plugin: Plugin;
  /** Taille du rendu (la fenêtre fait 420×520 à l'écran dans le DAW). */
  width?: number;
  priority?: boolean;
  className?: string;
};

/**
 * Fenêtre du plugin + mascotte détourée qui dépasse du cadre.
 * La mascotte flotte doucement et rebondit au survol ; tout est figé si
 * le visiteur a demandé moins d'animations.
 */
export default function PluginWindow({ plugin, width = 420, priority = false, className = '' }: Props) {
  const reduced = useReducedMotion();
  const height = Math.round((width * 1040) / 840);

  return (
    <div className={`relative ${className}`} style={{ width, maxWidth: '100%' }}>
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
          width={840}
          height={1040}
          priority={priority}
          sizes={`(max-width: 640px) 80vw, ${width}px`}
          className="h-auto w-full"
        />
      </motion.div>

      {/* Mascotte : dépasse volontairement du cadre */}
      <motion.div
        className="absolute -bottom-6 -right-10 w-[58%] cursor-pointer sm:-right-14"
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
          width={648}
          height={560}
          priority={priority}
          sizes="(max-width: 640px) 45vw, 260px"
          className="h-auto w-full drop-shadow-[0_18px_28px_rgba(0,0,0,0.55)]"
        />
      </motion.div>
    </div>
  );
}
