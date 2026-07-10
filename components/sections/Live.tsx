'use client';

import { motion } from 'framer-motion';
import { useContent } from '@/components/providers/ContentProvider';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import { stagger, fadeUp } from '@/components/ui/motion';

export default function Live() {
  const { content, ui } = useContent();
  const dates = content.liveDates;
  const hasDates = dates.length > 0;

  return (
    <section id="live" className="relative overflow-hidden py-24 sm:py-32">
      <div className="halo right-[15%] top-[30%] h-72 w-72 bg-teal" />
      <div className="mx-auto max-w-4xl px-6">
        <SectionHeading eyebrow={ui.live.eyebrow} title={ui.live.title} />

        {hasDates ? (
          <motion.ul
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="space-y-4"
          >
            {dates.map((d) => (
              <motion.li
                key={d.id}
                variants={fadeUp}
                className="glass-warm flex flex-col items-start justify-between gap-3 rounded-3xl p-5 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-5">
                  <div className="font-display text-xl font-bold text-gold">{d.date}</div>
                  <div>
                    <div className="font-semibold text-cream">{d.venue}</div>
                    <div className="text-sm text-cream/60">{d.city}</div>
                  </div>
                </div>
                {d.ticketsHref && (
                  <a
                    href={d.ticketsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-gradient-to-r from-magenta to-coral px-5 py-2 text-sm font-semibold text-night"
                  >
                    {ui.live.tickets}
                  </a>
                )}
              </motion.li>
            ))}
          </motion.ul>
        ) : (
          <Reveal
            variants={{
              hidden: { opacity: 0, scale: 0.95 },
              show: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.34, 1.3, 0.5, 1] } },
            }}
          >
            <div className="glass-warm relative overflow-hidden rounded-[2.5rem] px-8 py-16 text-center">
              <div className="mb-6 animate-float-slow text-6xl">🪩</div>
              <p className="font-display text-2xl font-bold text-cream sm:text-3xl">{ui.live.soon}</p>
              <p className="mx-auto mt-3 max-w-md text-cream/65">{ui.live.soonText}</p>
              <a
                href="#contact"
                className="mt-8 inline-block rounded-full border-2 border-cream/25 bg-cream/5 px-7 py-3 text-sm font-bold text-cream transition-colors hover:border-gold hover:text-gold"
              >
                {ui.live.book}
              </a>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
