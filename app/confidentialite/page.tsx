import type { Metadata } from 'next';
import { defaultContent } from '@/lib/content';
import PrivacyPage from './PrivacyPage';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description:
    'Données collectées par le site de LALZIN, à quoi elles servent, combien de temps elles sont conservées et comment les faire supprimer.',
  alternates: { canonical: '/confidentialite' },
  openGraph: {
    title: 'Politique de confidentialité · LALZIN',
    url: `${defaultContent.site.url}/confidentialite`,
  },
};

export default function Page() {
  return <PrivacyPage />;
}
