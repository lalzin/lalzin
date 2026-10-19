'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '@/components/providers/ContentProvider';
import PluginCard from '@/components/plugins/PluginCard';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import { plugins, suite, suiteImage } from '@/lib/plugins';

export default function PluginsIndex() {
  const { t, ui } = useContent();

  return (
    <main className="relative min-h-[100svh] overflow-hidden pb-24 pt-28">
      <div className="halo left-[8%] top-[12%] h-72 w-72 bg-magenta" />
      <div className="halo right-[10%] top-[40%] h-72 w-72 bg-teal" />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Bannière de la suite */}
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-cream/12">
            <Image
              src={suiteImage(suite.images.banner)}
              alt={suite.name}
              width={2400}
              height={1000}
              priority
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="h-auto w-full"
            />
          </div>
        </Reveal>

        <div className="mt-12">
          <SectionHeading
            eyebrow={`${suite.name} · ${suite.by}`}
            title={ui.plugins.title}
            subtitle={t(suite.tagline)}
          />
        </div>

        <Reveal>
          <p className="mx-auto -mt-6 mb-12 max-w-2xl text-center text-base text-cream/70">
            {ui.plugins.suiteIntro}
          </p>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plugins.map((p, i) => (
            <PluginCard key={p.slug} plugin={p} index={i} />
          ))}

          {/* Les deux autres plugins de la suite arrivent */}
          <Reveal
            as="article"
            className="flex min-h-[18rem] flex-col items-center justify-center rounded-[2rem] border border-dashed border-cream/15 p-8 text-center"
          >
            <span className="text-4xl">🎛️</span>
            <p className="mt-4 font-display text-xl font-bold text-cream/80">{ui.plugins.soon}</p>
            <p className="mt-2 max-w-xs text-sm text-cream/55">{ui.plugins.soonOther}</p>
          </Reveal>
        </div>

        <Reveal>
          <p className="mt-14 text-center text-sm text-cream/50">
            <Link href="/plugins/installation" className="text-gold underline-offset-4 hover:underline">
              {ui.plugins.installGuide}
            </Link>
            {' · '}
            <Link href="/" className="underline-offset-4 hover:text-cream hover:underline">
              {ui.links.back}
            </Link>
          </p>
        </Reveal>
      </div>
    </main>
  );
}
