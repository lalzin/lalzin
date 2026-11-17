'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useContent } from '@/components/providers/ContentProvider';
import SectionHeading from '@/components/ui/SectionHeading';
import Navbar from '@/components/Navbar';
import Reveal from '@/components/ui/Reveal';
import { legal } from '@/lib/legal';

const CARTE = 'rounded-[1.5rem] border border-cream/12 bg-cream/[0.04] p-6';

/** Mentions légales (LCEN, art. 6) : éditeur, hébergeur, règles du site. */
export default function LegalPage() {
  const { ui, lang, content } = useContent();
  const tx = ui.legalPage;
  const e = legal.editeur;
  const h = legal.hebergeur;
  const updated = new Date(legal.misAJour).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const lignes: [string, React.ReactNode][] = [
    [tx.labels.name, `${e.nom}`],
    [tx.labels.stage, e.nomDeScene],
    [tx.labels.status, e.statut[lang]],
    [tx.labels.address, e.adresse],
    [tx.labels.siret, e.siret],
    ...(e.telephone
      ? ([[tx.labels.phone, <a key="tel" href={`tel:${e.telephone.replace(/\s/g, '')}`} className="hover:text-gold">{e.telephone}</a>]] as [string, React.ReactNode][])
      : []),
    [
      tx.labels.email,
      <a key="mail" href={`mailto:${e.email}`} className="text-gold underline-offset-4 hover:underline">
        {e.email}
      </a>,
    ],
    // Le directeur de la publication est la personne, sans la mention EI.
    [tx.labels.director, e.nom.replace(/\s+EI$/, '')],
  ];

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
          {ui.privacy.updated} : {updated}
        </p>

        <div className="space-y-5">
          {/* Éditeur */}
          <Reveal>
            <section className={CARTE}>
              <h2 className="font-display text-xl font-bold text-cream">{tx.publisher}</h2>
              <dl className="mt-4 divide-y divide-cream/[0.08] text-sm">
                {lignes.map(([label, valeur]) => (
                  <div key={label} className="grid gap-1 py-2.5 sm:grid-cols-[13rem_1fr] sm:gap-4">
                    <dt className="text-cream/45">{label}</dt>
                    <dd className="text-cream/85">{valeur}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </Reveal>

          {/* Hébergeur */}
          <Reveal>
            <section className={CARTE}>
              <h2 className="font-display text-xl font-bold text-cream">{tx.host}</h2>
              <p className="mt-3 text-sm leading-relaxed text-cream/75">
                {tx.hostBody}
                <br />
                <span className="font-semibold text-cream">{h.nom}</span>
                <br />
                {lang === 'fr' ? h.adresse : h.adresseEn}
                <br />
                {h.telephone} ·{' '}
                <a href={h.site} target="_blank" rel="noopener noreferrer" className="text-gold underline-offset-4 hover:underline">
                  vercel.com
                </a>
              </p>
            </section>
          </Reveal>

          {tx.sections.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.04}>
              <section className={CARTE}>
                <h2 className="font-display text-xl font-bold text-cream">{s.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-cream/75">{s.body}</p>
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
          <Link
            href="/confidentialite"
            className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-gold underline-offset-4 hover:underline"
          >
            {tx.seePrivacy}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Reveal>
      </div>
    </main>
  );
}
