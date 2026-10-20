import type { Metadata } from 'next';
import NotFoundPage from './NotFoundPage';

export const metadata: Metadata = {
  title: 'Page introuvable',
  description: 'Cette page n’existe pas, ou plus.',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <NotFoundPage />;
}
