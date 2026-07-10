'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useContent } from '@/components/providers/ContentProvider';
import LangSwitch from '@/components/ui/LangSwitch';

const NAV_IDS = ['about', 'discography', 'video', 'live', 'merch', 'contact'] as const;

export default function Navbar() {
  const { ui } = useContent();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? 'py-2' : 'py-4'
      }`}
    >
      <nav
        className={`mx-3 flex items-center justify-between rounded-full px-5 py-3 transition-all duration-500 sm:mx-auto sm:max-w-6xl sm:px-6 ${
          scrolled
            ? 'glass-warm shadow-[0_10px_40px_-12px_rgba(255,46,146,0.4)]'
            : 'bg-transparent'
        }`}
      >
        {/* Logo — une seule couleur */}
        <button
          onClick={() => go('home')}
          className="font-display text-2xl font-extrabold tracking-tight text-cream"
        >
          LALZIN
        </button>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_IDS.map((id) => (
            <li key={id}>
              <button
                onClick={() => go(id)}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-cream/75 transition-colors hover:bg-cream/10 hover:text-cream"
              >
                {ui.nav[id]}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <LangSwitch />
          <button
            onClick={() => go('contact')}
            className="hidden rounded-full bg-gradient-to-r from-magenta to-coral px-5 py-2 text-sm font-semibold text-cream shadow-lg shadow-magenta/30 transition-transform hover:scale-105 sm:inline-block"
          >
            {ui.nav.contact}
          </button>

          {/* Burger mobile */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-cream/10 lg:hidden"
            aria-label="Menu"
          >
            <div className="space-y-1.5">
              <span className={`block h-0.5 w-5 bg-cream transition-transform ${open ? 'translate-y-2 rotate-45' : ''}`} />
              <span className={`block h-0.5 w-5 bg-cream transition-opacity ${open ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 w-5 bg-cream transition-transform ${open ? '-translate-y-2 -rotate-45' : ''}`} />
            </div>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-warm mx-3 mt-2 overflow-hidden rounded-3xl p-3 lg:hidden"
          >
            {NAV_IDS.map((id) => (
              <button
                key={id}
                onClick={() => go(id)}
                className="block w-full rounded-2xl px-4 py-3 text-left text-base font-medium text-cream/85 transition-colors hover:bg-cream/10"
              >
                {ui.nav[id]}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
