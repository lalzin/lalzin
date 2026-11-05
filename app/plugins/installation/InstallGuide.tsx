'use client';

import Link from 'next/link';
import { useContent } from '@/components/providers/ContentProvider';
import SectionHeading from '@/components/ui/SectionHeading';
import Navbar from '@/components/Navbar';
import Reveal from '@/components/ui/Reveal';
import { ArrowLeft, Download, RefreshCw, SlidersVertical, type LucideIcon } from 'lucide-react';

function Steps({ title, steps, icon: Icone }: { title: string; steps: readonly string[]; icon: LucideIcon }) {
  return (
    <Reveal>
      <div className="h-full rounded-[1.75rem] border border-cream/12 bg-cream/[0.04] p-7">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/15 text-gold">
          <Icone className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="mt-3 font-display text-2xl font-bold text-cream">{title}</h2>
        <ol className="mt-5 space-y-4">
          {steps.map((s, i) => (
            <li key={s} className="flex gap-4 text-sm leading-relaxed text-cream/75">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </div>
    </Reveal>
  );
}

export default function InstallGuide() {
  const { ui, content } = useContent();
  const tx = ui.plugins.install;

  return (
    <main className="relative min-h-[100svh] overflow-hidden pb-24 pt-28">
      <Navbar />
      <div className="halo left-[10%] top-[15%] h-72 w-72 bg-teal" />
      <div className="halo right-[12%] top-[45%] h-72 w-72 bg-coral" />

      <div className="relative mx-auto max-w-4xl px-6">
        <Link
          href="/plugins"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cream/45 transition-colors hover:text-cream"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {ui.plugins.backToPlugins}
        </Link>

        <div className="mt-8">
          <SectionHeading eyebrow={ui.plugins.eyebrow} title={tx.title} subtitle={tx.subtitle} />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Steps title={tx.macTitle} steps={tx.macSteps} icon={Download} />
          <Steps title={tx.winTitle} steps={tx.winSteps} icon={Download} />
        </div>

        <div className="mt-6">
          <Steps title={tx.dawTitle} steps={tx.dawSteps} icon={SlidersVertical} />
        </div>

        <div className="mt-6">
          <Steps title={tx.updatesTitle} steps={tx.updatesSteps} icon={RefreshCw} />
        </div>

        <Reveal>
          <div className="mt-6 rounded-[1.75rem] border border-gold/25 bg-gold/[0.07] p-7">
            <h2 className="font-display text-xl font-bold text-gold">{tx.noteTitle}</h2>
            <ul className="mt-4 space-y-2">
              {tx.notes.map((n) => (
                <li key={n} className="flex gap-3 text-sm leading-relaxed text-cream/75">
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-gold" aria-hidden />
                  {n}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal>
          <p className="mt-12 text-center text-sm text-cream/55">
            {tx.problem}{' '}
            <a
              href={`mailto:${content.artist.bookingEmail}`}
              className="text-gold underline-offset-4 hover:underline"
            >
              {content.artist.bookingEmail}
            </a>
          </p>
        </Reveal>
      </div>
    </main>
  );
}
