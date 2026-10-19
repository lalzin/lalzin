import type { Metadata } from 'next';
import { defaultContent } from '@/lib/content';
import InstallGuide from './InstallGuide';

export const metadata: Metadata = {
  title: 'Installer les plugins Groove Knobs',
  description:
    'Guide d’installation des plugins Groove Knobs de LALZIN : macOS (.pkg), Windows (.exe) et rescan dans ton DAW (VST3 / Audio Units).',
  alternates: { canonical: '/plugins/installation' },
  openGraph: {
    title: 'Installer les plugins Groove Knobs',
    description: 'Deux minutes, et le knob est dans ton DAW.',
    url: `${defaultContent.site.url}/plugins/installation`,
    images: ['/images/plugins/groove-knobs-og.webp'],
  },
};

export default function Page() {
  return <InstallGuide />;
}
