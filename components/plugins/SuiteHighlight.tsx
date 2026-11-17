'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Download } from 'lucide-react';
import { useContent } from '@/components/providers/ContentProvider';
import { suite, suiteImage, type Plugin } from '@/lib/plugins';

/**
 * Offre « toute la suite », placée avant le catalogue : c'est le choix le
 * plus simple pour la plupart des visiteurs (un installateur, tout dedans).
 * Empilée sur mobile, image à gauche à partir de la tablette.
 */
export default function SuiteHighlight({ suiteDl, count }: { suiteDl: Plugin; count: number }) {
  const { t, ui } = useContent();
  const tx = ui.plugins;
  const texte = tx.suiteText.replace('{n}', String(count)).replace('{v}', suiteDl.version);

  return (
    <article className="relative overflow-hidden rounded-[1.75rem] border border-gold/30 bg-gradient-to-br from-gold/[0.10] via-cream/[0.03] to-magenta/[0.06] sm:flex sm:items-center">
      <Link href="/plugins/suite" className="block sm:w-[44%] sm:flex-none sm:p-5 sm:pr-0">
        <Image
          src={suiteImage(suite.images.og)}
          alt={`${suite.name}, ${t(suite.tagline)}`}
          width={1200}
          height={630}
          sizes="(max-width: 640px) 100vw, 420px"
          className="h-auto w-full sm:rounded-2xl sm:border sm:border-cream/15"
        />
      </Link>

      <div className="p-5 sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
          {suite.name} · {tx.free}
        </p>
        <h2 className="mt-1.5 font-display text-2xl font-bold text-cream sm:text-3xl">{tx.suiteTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-cream/70">{texte}</p>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <Link
            href="/plugins/suite#telecharger"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-magenta via-coral to-gold px-6 py-3 text-sm font-bold text-night shadow-lg shadow-magenta/25 transition-transform hover:scale-[1.03]"
          >
            <Download className="h-4 w-4" aria-hidden />
            {tx.suiteCta}
          </Link>
          <Link
            href="/plugins/suite"
            className="inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-cream/70 transition-colors hover:text-gold"
          >
            {tx.suiteDetails}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
