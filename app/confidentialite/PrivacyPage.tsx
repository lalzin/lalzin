'use client';

import Link from 'next/link';
import { useContent } from '@/components/providers/ContentProvider';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';

/** Date de dernière mise à jour du texte (à changer si le texte change). */
const UPDATED = '2026-10-13';

export default function PrivacyPage() {
  const { ui, lang, content } = useContent();
  const tx = ui.privacy;
  const updated = new Date(UPDATED).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="relative min-h-[100svh] overflow-hidden pb-24 pt-28">
      <div className="halo left-[12%] top-[12%] h-72 w-72 bg-magenta" />

      <div className="relative mx-auto max-w-3xl px-6">
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-cream/45 transition-colors hover:text-cream"
        >
          ← {content.artist.name}
        </Link>

        <div className="mt-8">
          <SectionHeading title={tx.title} subtitle={tx.intro} align="left" />
        </div>

        <p className="-mt-6 mb-10 text-xs uppercase tracking-[0.2em] text-cream/40">
          {tx.updated} : {updated}
        </p>

        <div className="space-y-5">
          {tx.sections.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.04}>
              <section className="rounded-[1.5rem] border border-cream/12 bg-cream/[0.04] p-6">
                <h2 className="font-display text-xl font-bold text-cream">{s.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-cream/75">{s.body}</p>
              </section>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="mt-10 text-sm text-cream/60">
            {tx.contact}{' '}
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
