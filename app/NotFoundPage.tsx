'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useContent } from '@/components/providers/ContentProvider';
import Confetti from '@/components/Confetti';
import Navbar from '@/components/Navbar';
import { groovy } from '@/components/ui/motion';

/** Page 404 — même habillage que le reste du site, avec des sorties utiles. */
export default function NotFoundPage() {
  const { ui, content } = useContent();
  const tx = ui.notFound;

  return (
    <main className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 py-28">
      <Navbar />
      <div className="halo left-[14%] top-[18%] h-72 w-72 bg-magenta" />
      <div className="halo right-[12%] bottom-[18%] h-72 w-72 bg-teal" />
      <Confetti count={14} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: groovy }}
        className="relative z-10 w-full max-w-xl text-center"
      >
        <motion.p
          animate={{ rotate: [-3, 3, -3] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-4 text-7xl"
          aria-hidden
        >
          🪩
        </motion.p>

        <p className="retro-title text-7xl leading-none sm:text-8xl">404</p>
        <h1 className="mt-5 font-display text-2xl font-bold text-cream sm:text-3xl">{tx.title}</h1>
        <p className="mx-auto mt-4 max-w-md text-cream/70">{tx.text}</p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-gradient-to-r from-magenta via-coral to-gold px-7 py-3.5 text-sm font-bold text-night shadow-lg shadow-magenta/30 transition-transform hover:scale-105"
          >
            {tx.home}
          </Link>
          <Link
            href="/plugins"
            className="rounded-full border border-cream/25 px-7 py-3.5 text-sm font-bold text-cream/85 transition-colors hover:border-gold hover:text-gold"
          >
            {tx.plugins}
          </Link>
          <Link
            href="/links"
            className="rounded-full border border-cream/25 px-7 py-3.5 text-sm font-bold text-cream/85 transition-colors hover:border-gold hover:text-gold"
          >
            {tx.links}
          </Link>
        </div>

        <p className="mt-12 text-xs text-cream/35">
          © {new Date().getFullYear()} {content.artist.name}
        </p>
      </motion.div>
    </main>
  );
}
