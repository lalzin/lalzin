'use client';

import Link from 'next/link';
import { useContent } from '@/components/providers/ContentProvider';
import { SocialIcon } from '@/components/ui/icons';

export default function Footer() {
  const { content, t, ui } = useContent();
  const { artist, socials } = content;

  return (
    <footer className="relative overflow-hidden border-t border-cream/10 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 text-center">
        <button
          onClick={() => document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' })}
          className="font-display text-3xl font-extrabold text-cream"
        >
          LALZIN 🪩
        </button>

        <p className="max-w-md text-sm text-cream/60">{t(artist.tagline)}</p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {socials.map((s) => {
            const Icon = SocialIcon[s.key];
            return (
              <a
                key={s.key}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-cream/5 text-cream/70 transition-colors hover:bg-gradient-to-br hover:from-magenta hover:to-coral hover:text-night"
              >
                <Icon className="h-5 w-5" />
              </a>
            );
          })}
        </div>

        <a href={`mailto:${artist.bookingEmail}`} className="text-sm font-medium text-gold underline-offset-4 hover:underline">
          {artist.bookingEmail}
        </a>

        <Link href="/links" className="text-xs font-semibold uppercase tracking-[0.2em] text-cream/45 transition-colors hover:text-cream">
          {ui.nav.links} ↗
        </Link>

        <p className="text-xs text-cream/35">
          © {new Date().getFullYear()} {artist.name}. {ui.footer.rights}
        </p>
      </div>
    </footer>
  );
}
