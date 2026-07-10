import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Hanken_Grotesk } from 'next/font/google';
import { getContent } from '@/lib/serverContent';
import { ContentProvider } from '@/components/providers/ContentProvider';
import './globals.css';

// Contenu lu à chaque requête (Supabase) → l'admin est vraiment live.
export const dynamic = 'force-dynamic';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const body = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const { site, artist } = await getContent();
  return {
    metadataBase: new URL(site.url),
    title: { default: site.title, template: '%s — LALZIN' },
    description: site.description,
    applicationName: artist.name,
    category: 'music',
    keywords: [
      'LALZIN', 'DJ LALZIN', 'DJ', 'music producer', 'funky house', 'disco funk',
      'bass house', 'nu disco', 'booking DJ', 'Better With You', 'Party Love And Funk',
      "I Can't Stop", 'Chemise', 'remix disco',
    ],
    authors: [{ name: artist.name, url: site.url }],
    creator: artist.name,
    publisher: artist.name,
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      locale: 'fr_FR',
      url: site.url,
      siteName: artist.name,
      title: site.title,
      description: site.description,
      images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'LALZIN — DJ & producteur funky house / disco / bass' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: site.title,
      description: site.description,
      images: ['/og.jpg'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    },
    manifest: '/manifest.webmanifest',
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: '#160912',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const content = await getContent();
  const { site, artist, socials } = content;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: artist.name,
    url: site.url,
    image: `${site.url}/og.jpg`,
    logo: `${site.url}${artist.logo}`,
    description: artist.bio.en,
    genre: artist.genres,
    email: artist.bookingEmail,
    sameAs: socials.map((s) => s.href),
  };

  return (
    <html lang="fr" className={`${display.variable} ${body.variable}`}>
      <body className="warm-backdrop min-h-screen antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <ContentProvider initialContent={content}>{children}</ContentProvider>
      </body>
    </html>
  );
}
