'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '@/components/providers/ContentProvider';
import PluginCard from '@/components/plugins/PluginCard';
import SuiteCard from '@/components/plugins/SuiteCard';
import DownloadForm from '@/components/plugins/DownloadForm';
import SectionHeading from '@/components/ui/SectionHeading';
import Navbar from '@/components/Navbar';
import Reveal from '@/components/ui/Reveal';
import { suite, suiteImage, type Plugin } from '@/lib/plugins';

/** Largeur d'une carte : une, deux ou trois par rangée selon l'écran. */
const CARTE = 'flex w-full sm:w-[calc(50%_-_0.75rem)] lg:w-[calc(33.333%_-_1rem)]';

export default function PluginsIndex({
  plugins,
  suiteDl,
  turnstileSiteKey,
}: {
  plugins: Plugin[];
  /** Installateur de toute la suite, s'il est publié dans /admin. */
  suiteDl: Plugin | null;
  turnstileSiteKey: string;
}) {
  const { t, ui } = useContent();

  return (
    <main className="relative min-h-[100svh] overflow-hidden pb-24 pt-28">
      <Navbar />
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

        {/* Rangées centrées : quel que soit le nombre de plugins publiés, une
            dernière rangée incomplète ne laisse pas de trou à droite. */}
        <div className="mx-auto flex max-w-md flex-wrap justify-center gap-6 sm:max-w-none">
          {plugins.map((p, i) => (
            <div key={p.slug} className={CARTE}>
              <PluginCard plugin={p} index={i} />
            </div>
          ))}

          {suiteDl && (
            <div className={CARTE}>
              <SuiteCard suiteDl={suiteDl} index={plugins.length} />
            </div>
          )}

          {/* D'autres plugins arrivent */}
          <Reveal
            as="article"
            className={`${CARTE} min-h-[18rem] flex-col items-center justify-center rounded-[2rem] border border-dashed border-cream/15 p-8 text-center`}
          >
            <span className="text-4xl">🎛️</span>
            <p className="mt-4 font-display text-xl font-bold text-cream/80">{ui.plugins.soon}</p>
            <p className="mt-2 max-w-xs text-sm text-cream/55">{ui.plugins.soonOther}</p>
          </Reveal>
        </div>

        {/* Téléchargement de toute la suite, en un seul installateur */}
        {suiteDl && (
          <div className="mt-20">
            <DownloadForm plugin={suiteDl} turnstileSiteKey={turnstileSiteKey} title={ui.plugins.suiteFormTitle} />
          </div>
        )}

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
