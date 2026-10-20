import { Suspense } from 'react';
import type { Metadata } from 'next';
import { paypalMe } from '@/lib/publicConfig';
import { getPlugins } from '@/lib/pluginConfig';
import ThanksPage from './ThanksPage';

export const metadata: Metadata = {
  title: 'Merci · regarde ta boîte mail',
  description: 'Tes liens de téléchargement Groove Knobs viennent de partir par email.',
  alternates: { canonical: '/plugins/merci' },
  robots: { index: false, follow: true },
};

export default async function Page() {
  return (
    <Suspense fallback={null}>
      <ThanksPage paypalMe={paypalMe} plugins={await getPlugins()} />
    </Suspense>
  );
}
