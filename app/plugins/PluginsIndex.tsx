'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '@/components/providers/ContentProvider';
import PluginCard from '@/components/plugins/PluginCard';
import PluginRow from '@/components/plugins/PluginRow';
import SuiteHighlight from '@/components/plugins/SuiteHighlight';
import SectionHeading from '@/components/ui/SectionHeading';
import Navbar from '@/components/Navbar';
import Reveal from '@/components/ui/Reveal';
import { suite, suiteImage, type Plugin } from '@/lib/plugins';
import { SlidersHorizontal } from 'lucide-react';

/** Largeur d'une carte : deux ou trois par rangée (la grille n'existe qu'à partir de la tablette). */
const CARTE = 'flex w-full sm:w-[calc(50%_-_0.75rem)] lg:w-[calc(33.333%_-_1rem)]';

type Filtre = 'all' | 'effect' | 'instrument';
const typeOf = (p: Plugin) => (p.type === 'instrument' ? 'instrument' : 'effect');

/**
 * Catalogue Groove Knobs.
 * - En tête, l'offre « toute la suite » : le choix le plus simple.
 * - Mobile : une liste compacte (icône, nom, accroche), lisible d'un coup
 *   d'œil au lieu de dix grandes cartes à faire défiler.
 * - Tablette et ordinateur : la grille de cartes illustrées.
 * - Un filtre Effets / Instruments, quand les deux existent.
 */
export default function PluginsIndex({
  plugins,
  suiteDl,
}: {
  plugins: Plugin[];
  /** Installateur de toute la suite, s'il est publié dans /admin. */
  suiteDl: Plugin | null;
}) {
  const { t, ui } = useContent();
  const tx = ui.plugins;
  const [filtre, setFiltre] = useState<Filtre>('all');

  const compte = {
    all: plugins.length,
    effect: plugins.filter((p) => typeOf(p) === 'effect').length,
    instrument: plugins.filter((p) => typeOf(p) === 'instrument').length,
  };
  const avecFiltre = compte.effect > 0 && compte.instrument > 0;
  const visibles = filtre === 'all' ? plugins : plugins.filter((p) => typeOf(p) === filtre);

  const onglets: { id: Filtre; label: string }[] = [
    { id: 'all', label: tx.filterAll },
    { id: 'effect', label: tx.filterEffects },
    { id: 'instrument', label: tx.filterInstruments },
  ];

  return (
    <main className="relative min-h-[100svh] overflow-hidden pb-20 pt-24 sm:pb-24 sm:pt-28">
      <Navbar />
      <div className="halo left-[8%] top-[12%] h-72 w-72 bg-magenta" />
      <div className="halo right-[10%] top-[40%] h-72 w-72 bg-teal" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Bannière de la suite */}
        <Reveal>
          <div className="relative overflow-hidden rounded-[1.5rem] border border-cream/12 sm:rounded-[2rem]">
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

        <div className="mt-8 sm:mt-12">
          <SectionHeading
            eyebrow={`${suite.name} · ${suite.by}`}
            title={tx.title}
            subtitle={t(suite.tagline)}
          />
        </div>

        <Reveal>
          <p className="mx-auto -mt-6 mb-8 max-w-2xl text-center text-sm text-cream/65 sm:mb-12 sm:text-base">
            {tx.suiteIntro}
          </p>
        </Reveal>

        {/* Toute la suite, avant le détail plugin par plugin */}
        {suiteDl && (
          <Reveal>
            <div className="mx-auto max-w-4xl">
              <SuiteHighlight suiteDl={suiteDl} count={suite.includes?.length ?? plugins.length} />
            </div>
          </Reveal>
        )}

        {/* Filtre */}
        {avecFiltre && (
          <div
            role="tablist"
            aria-label={tx.filterLabel}
            className="mx-auto mt-10 flex w-full max-w-sm rounded-full border border-cream/12 bg-cream/[0.04] p-1 sm:mt-14"
          >
            {onglets.map((o) => {
              const actif = filtre === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="tab"
                  aria-selected={actif}
                  onClick={() => setFiltre(o.id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                    actif ? 'bg-cream text-night' : 'text-cream/60 hover:text-cream'
                  }`}
                >
                  {o.label}
                  <span className={`text-xs tabular-nums ${actif ? 'text-night/55' : 'text-cream/35'}`}>
                    {compte[o.id]}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Mobile : liste compacte */}
        <ul
          className={`overflow-hidden rounded-[1.5rem] border border-cream/12 bg-cream/[0.04] backdrop-blur-sm sm:hidden ${
            avecFiltre ? 'mt-5' : 'mt-10'
          }`}
        >
          {visibles.map((p, i) => (
            <li key={p.slug} className={i > 0 ? 'border-t border-cream/[0.08]' : ''}>
              <PluginRow plugin={p} />
            </li>
          ))}
        </ul>

        {/* Tablette et ordinateur : cartes illustrées, rangées centrées */}
        <div
          className={`hidden flex-wrap justify-center gap-6 sm:flex ${avecFiltre ? 'mt-8' : 'mt-14'}`}
        >
          {visibles.map((p, i) => (
            <div key={p.slug} className={CARTE}>
              <PluginCard plugin={p} index={i} />
            </div>
          ))}

          {filtre === 'all' && (
            <Reveal
              as="article"
              className={`${CARTE} min-h-[18rem] flex-col items-center justify-center rounded-[2rem] border border-dashed border-cream/15 p-8 text-center`}
            >
              <SlidersHorizontal className="h-9 w-9 text-cream/50" strokeWidth={1.5} aria-hidden />
              <p className="mt-4 font-display text-xl font-bold text-cream/80">{tx.soon}</p>
              <p className="mt-2 max-w-xs text-sm text-cream/55">{tx.soonOther}</p>
            </Reveal>
          )}
        </div>

        <Reveal>
          <p className="mt-12 text-center text-sm text-cream/50 sm:mt-14">
            <Link href="/plugins/installation" className="text-gold underline-offset-4 hover:underline">
              {tx.installGuide}
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
