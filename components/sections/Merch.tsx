'use client';

import { motion } from 'framer-motion';
import { useContent } from '@/components/providers/ContentProvider';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import { stagger, popIn } from '@/components/ui/motion';

const categoryIcon: Record<string, string> = {
  'T-shirt': '👕',
  Vinyle: '💿',
  Goodies: '🎁',
};

export default function Merch() {
  const { content, ui } = useContent();
  const shopUrl = content.site.shopUrl;
  // On n'affiche que les produits réellement disponibles ; sinon « coming soon ».
  const available = content.merch.filter((p) => p.available && p.href);

  return (
    <section id="merch" className="relative overflow-hidden py-24 sm:py-32">
      <div className="halo right-[10%] top-[15%] h-80 w-80 bg-gold" />
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading eyebrow={ui.merch.eyebrow} title={ui.merch.title} />

        {available.length === 0 ? (
          /* ── Coming soon ─────────────────────────────────────────── */
          <Reveal
            variants={{
              hidden: { opacity: 0, scale: 0.95 },
              show: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.34, 1.3, 0.5, 1] } },
            }}
          >
            <div className="glass-warm relative mx-auto max-w-2xl overflow-hidden rounded-[2.5rem] px-8 py-16 text-center">
              <div className="mb-6 animate-float-slow text-6xl">🛍️</div>
              <p className="font-display text-2xl font-bold text-cream sm:text-3xl">
                {ui.merch.comingSoon}
              </p>
              <p className="mx-auto mt-3 max-w-md text-cream/65">{ui.merch.comingSoonText}</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {shopUrl && (
                  <a
                    href={shopUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-gradient-to-r from-magenta to-coral px-7 py-3 text-sm font-bold text-night shadow-lg shadow-magenta/30 transition-transform hover:scale-105"
                  >
                    {ui.merch.visit} ↗
                  </a>
                )}
                <a
                  href="#contact"
                  className="rounded-full border-2 border-cream/25 bg-cream/5 px-7 py-3 text-sm font-bold text-cream transition-colors hover:border-gold hover:text-gold"
                >
                  {ui.nav.contact}
                </a>
              </div>
            </div>
          </Reveal>
        ) : (
          /* ── Grille des produits disponibles ─────────────────────── */
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-2 gap-5 sm:gap-6 md:grid-cols-3"
          >
            {available.map((p) => {
              const [c1, c2] = p.accent;
              return (
                <motion.a
                  key={p.id}
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={popIn}
                  whileHover={{ y: -6 }}
                  className="group relative block overflow-hidden rounded-[1.75rem] border border-cream/10 bg-night-soft"
                >
                  <div className="relative flex aspect-square items-center justify-center overflow-hidden">
                    <div
                      className="absolute inset-0 opacity-40 transition-opacity group-hover:opacity-60"
                      style={{ background: `radial-gradient(circle at 50% 40%, ${c1}, ${c2} 60%, transparent 100%)` }}
                    />
                    <div className="grain absolute inset-0 opacity-60" />
                    <span className="relative text-6xl opacity-90 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
                      {categoryIcon[p.category]}
                    </span>
                  </div>
                  <div className="p-4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: c1 }}>
                      {p.category}
                    </span>
                    <h3 className="font-display text-base font-bold leading-tight text-cream">{p.name}</h3>
                  </div>
                </motion.a>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}
