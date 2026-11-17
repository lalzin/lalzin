import type { Metadata } from 'next';
import { defaultContent } from '@/lib/content';
import LegalPage from './LegalPage';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Éditeur, hébergeur, propriété intellectuelle et licence des plugins du site de LALZIN.',
  alternates: { canonical: '/mentions-legales' },
  openGraph: {
    title: 'Mentions légales · LALZIN',
    url: `${defaultContent.site.url}/mentions-legales`,
  },
};

export default function Page() {
  return <LegalPage />;
}
