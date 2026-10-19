'use client';

import Link from 'next/link';
import { useContent } from '@/components/providers/ContentProvider';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';

function Steps({ title, steps, badge }: { title: string; steps: readonly string[]; badge: string }) {
  return (
    <Reveal>
      <div className="h-full rounded-[1.75rem] border border-cream/12 bg-cream/[0.04] p-7">
        <span className="text-3xl" aria-hidden>
          {badge}
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
      <div className="halo left-[10%] top-[15%] h-72 w-72 bg-teal" />
      <div className="halo right-[12%] top-[45%] h-72 w-72 bg-coral" />

      <div className="relative mx-auto max-w-4xl px-6">
        <Link
          href="/plugins"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-cream/45 transition-colors hover:text-cream"
        >
          {ui.plugins.backToPlugins}
        </Link>

        <div className="mt-8">
          <SectionHeading eyebrow={ui.plugins.eyebrow} title={tx.title} subtitle={tx.subtitle} />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Steps title={tx.macTitle} steps={tx.macSteps} badge="🍏" />
          <Steps title={tx.winTitle} steps={tx.winSteps} badge="🪟" />
        </div>

        <div className="mt-6">
          <Steps title={tx.dawTitle} steps={tx.dawSteps} badge="🎚️" />
        </div>

        <Reveal>
          <div className="mt-6 rounded-[1.75rem] border border-gold/25 bg-gold/[0.07] p-7">
            <h2 className="font-display text-xl font-bold text-gold">{tx.noteTitle}</h2>
            <ul className="mt-4 space-y-2">
              {tx.notes.map((n) => (
                <li key={n} className="text-sm leading-relaxed text-cream/75">
                  • {n}
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
