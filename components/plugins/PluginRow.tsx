'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useContent } from '@/components/providers/ContentProvider';
import { pluginImage, type Plugin } from '@/lib/plugins';

/**
 * Ligne compacte de la liste des plugins sur mobile : icône, nom, type,
 * accroche. Toute la ligne mène à la page du plugin, où se trouve le
 * formulaire de téléchargement.
 */
export default function PluginRow({ plugin }: { plugin: Plugin }) {
  const { t, ui } = useContent();
  const tx = ui.plugins;
  const { accent } = plugin.colors;

  return (
    <Link
      href={`/plugins/${plugin.slug}`}
      className="group flex items-center gap-4 px-4 py-3.5 transition-colors active:bg-cream/[0.06]"
    >
      <Image
        src={pluginImage(plugin.slug, 'icon-512.webp')}
        alt=""
        width={512}
        height={512}
        sizes="56px"
        className="h-14 w-14 flex-none rounded-2xl shadow-[0_8px_18px_-8px_rgba(0,0,0,0.8)]"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h3 className="truncate font-display text-[17px] font-bold leading-tight text-cream">{plugin.name}</h3>
          <span className="flex-none text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: accent }}>
            {plugin.type === 'instrument' ? tx.instrument : tx.effect}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-cream/60">{t(plugin.tagline)}</p>
      </div>
      <ChevronRight className="h-5 w-5 flex-none text-cream/30" aria-hidden />
    </Link>
  );
}
