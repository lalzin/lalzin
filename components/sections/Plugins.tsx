'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useContent } from '@/components/providers/ContentProvider';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import { plugins, pluginImage, suite } from '@/lib/plugins';

/** Teaser sur la home : la suite Groove Knobs, renvoie vers /plugins. */
export default function Plugins() {
  const { t, ui } = useContent();
  const reduced = useReducedMotion();
  const featured = plugins[0];

  if (!featured) return null;

  return (
    <section id="plugins" className="relative overflow-hidden py-24 sm:py-32">
      <div className="halo left-[12%] top-[25%] h-72 w-72 bg-gold" />

      <div className="mx-auto max-w-5xl px-6">
        <SectionHeading
          eyebrow={ui.plugins.eyebrow}
          title={ui.plugins.teaserTitle}
          subtitle={t(suite.tagline)}
        />

        <div className="grid items-center gap-10 sm:grid-cols-2">
          <Reveal className="flex justify-center">
            <Link href={`/plugins/${featured.slug}`} className="group relative block w-[62%] sm:w-[78%]">
              <div
                aria-hidden
                className="absolute -inset-5 -z-10 rounded-full opacity-40 blur-3xl transition-opacity group-hover:opacity-60"
                style={{
                  background: `radial-gradient(circle at 50% 45%, ${featured.colors.accent}, transparent 65%)`,
                }}
              />
              <Image
                src={pluginImage(featured.slug, 'ui-hero.webp')}
                alt={`${featured.name}, interface du plugin`}
                width={840}
                height={1040}
                sizes="(max-width: 640px) 55vw, 300px"
                className="h-auto w-full rounded-2xl border border-cream/15 shadow-[0_26px_50px_-18px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:-translate-y-1.5"
              />
              <motion.div
                className="absolute -bottom-3 -right-10 w-[58%]"
                animate={reduced ? undefined : { y: [0, -8, 0] }}
                transition={reduced ? undefined : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Image
                  src={pluginImage(featured.slug, 'mascot.webp')}
                  alt={featured.mascot}
                  width={648}
                  height={560}
                  sizes="(max-width: 640px) 36vw, 180px"
                  className="h-auto w-full drop-shadow-[0_16px_26px_rgba(0,0,0,0.55)]"
                />
              </motion.div>
            </Link>
          </Reveal>

          <Reveal delay={0.08}>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">
              {featured.name} · {ui.plugins.free}
            </p>
            <h3 className="mt-3 font-display text-3xl font-bold text-cream">{t(featured.tagline)}</h3>
            <p className="mt-4 leading-relaxed text-cream/70">{ui.plugins.suiteIntro}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/plugins"
                className="rounded-full bg-gradient-to-r from-magenta via-coral to-gold px-7 py-3.5 text-sm font-bold text-night shadow-lg shadow-magenta/30 transition-transform hover:scale-105"
              >
                {ui.plugins.teaserCta}
              </Link>
              <Link
                href={`/plugins/${featured.slug}#telecharger`}
                className="rounded-full border border-cream/25 px-7 py-3.5 text-sm font-bold text-cream/85 transition-colors hover:border-gold hover:text-gold"
              >
                {ui.plugins.download}
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
