'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useContent } from '@/components/providers/ContentProvider';
import { isExternal, resolveListenHref } from '@/lib/links';
import { groovy } from '@/components/ui/motion';

const DISMISS_KEY = 'lalzin:promo-dismissed';

export default function NewReleasePopup() {
  const { content, t, ui } = useContent();
  const release = content.releases.find((r) => r.announce);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!release) return;
    let dismissed: string | null = null;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY);
    } catch {
      /* ignore */
    }
    if (dismissed === release.id) return;
    const id = setTimeout(() => setOpen(true), 1300);
    return () => clearTimeout(id);
  }, [release]);

  const close = () => {
    setOpen(false);
    try {
      if (release) localStorage.setItem(DISMISS_KEY, release.id);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!release) return null;
  const href = resolveListenHref(release.href, content.socials);
  const [c1, c2] = release.accent;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          {/* Voile */}
          <div className="absolute inset-0 bg-night-deep/80 backdrop-blur-sm" />

          <motion.div
            role="dialog"
            aria-label={ui.promo.badge}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.55, ease: groovy }}
            className="relative w-full max-w-sm overflow-hidden rounded-[2rem] p-[2px]"
            style={{ background: `linear-gradient(140deg, ${c1}, ${c2})` }}
          >
            <div className="relative overflow-hidden rounded-[1.9rem] bg-night-soft">
              {/* Fermer */}
              <button
                onClick={close}
                aria-label="Fermer"
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-night/60 text-cream/80 backdrop-blur-sm transition-colors hover:bg-night hover:text-cream"
              >
                ✕
              </button>

              {/* Cover */}
              <div className="relative aspect-square w-full overflow-hidden">
                {release.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={release.cover} alt={release.title} className="h-full w-full object-cover" />
                ) : (
                  <div
                    className="h-full w-full"
                    style={{ background: `radial-gradient(circle at 50% 35%, ${c1}, ${c2} 70%, #160912)` }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-night-soft via-transparent to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-cream px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-night">
                  ★ {ui.promo.badge}
                </span>
              </div>

              {/* Infos */}
              <div className="px-6 pb-6 pt-1 text-center">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: c1 }}>
                  {release.type} · {ui.promo.out}
                </span>
                <h3 className="mt-1 font-display text-2xl font-extrabold text-cream">{release.title}</h3>

                <a
                  href={href}
                  target={isExternal(href) ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  onClick={close}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-magenta via-coral to-gold py-3.5 text-base font-bold text-night shadow-lg shadow-magenta/30 transition-transform hover:scale-[1.03]"
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-night/20 text-[10px]">▶</span>
                  {ui.promo.listen}
                </a>
                <button
                  onClick={close}
                  className="mt-3 text-sm font-medium text-cream/50 transition-colors hover:text-cream"
                >
                  {ui.promo.later}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
