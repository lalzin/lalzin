'use client';

import Link from 'next/link';
import { useContent } from '@/components/providers/ContentProvider';
import SectionHeading from '@/components/ui/SectionHeading';
import Navbar from '@/components/Navbar';
import Reveal from '@/components/ui/Reveal';
import { ArrowLeft } from 'lucide-react';
import { legal } from '@/lib/legal';

export default function PrivacyPage() {
  const { ui, lang, content } = useContent();
  const tx = ui.privacy;
  const updated = new Date(legal.misAJour).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="relative min-h-[100svh] overflow-hidden pb-24 pt-28">
      <Navbar />
      <div className="halo left-[12%] top-[12%] h-72 w-72 bg-magenta" />

      <div className="relative mx-auto max-w-3xl px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cream/45 transition-colors hover:text-cream"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {content.artist.name}
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
              <section
                id={'id' in s ? s.id : undefined}
                className="scroll-mt-28 rounded-[1.5rem] border border-cream/12 bg-cream/[0.04] p-6"
              >
                <h2 className="font-display text-xl font-bold text-cream">{s.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-cream/75">
                  {s.body.replace('{editeur}', `${legal.editeur.nom} (${legal.editeur.nomDeScene})`).replace('{email}', legal.editeur.email)}
                </p>
                {'items' in s && (
                  <ul className="mt-3 space-y-2">
                    {s.items.map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-relaxed text-cream/75">
                        <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-gold" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="mt-10 text-sm text-cream/60">
            {tx.contact}{' '}
            <a href={`mailto:${legal.editeur.email}`} className="text-gold underline-offset-4 hover:underline">
              {legal.editeur.email}
            </a>
            {' · '}
            <Link href="/mentions-legales" className="underline-offset-4 hover:text-cream hover:underline">
              {ui.legalNav.legal}
            </Link>
          </p>
        </Reveal>
      </div>
    </main>
  );
}
