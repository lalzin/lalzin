'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useContent } from '@/components/providers/ContentProvider';
import Reveal from '@/components/ui/Reveal';
import { stagger, popIn } from '@/components/ui/motion';

export default function About() {
  const { content, t, ui } = useContent();
  const { artist } = content;

  return (
    <section id="about" className="relative overflow-hidden py-24 sm:py-32">
      <div className="halo right-[-5%] top-[20%] h-80 w-80 bg-teal" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2 lg:gap-20">
        {/* Photo artiste — cadre organique arrondi */}
        <Reveal variants={popIn} className="relative mx-auto w-full max-w-md">
          <div className="absolute -inset-4 animate-float-slow rounded-[42%_58%_63%_37%/41%_44%_56%_59%] bg-gradient-to-br from-magenta via-coral to-gold opacity-70 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2.5rem] border-4 border-cream/10 shadow-2xl">
            <Image
              src={artist.photos.portrait}
              alt="LALZIN"
              width={800}
              height={1000}
              className="h-full w-full object-cover"
              sizes="(max-width: 768px) 90vw, 40vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-magenta/30 via-transparent to-transparent mix-blend-overlay" />
          </div>
          <div className="absolute -right-3 -top-3 flex h-20 w-20 animate-spin-slow items-center justify-center rounded-full bg-gradient-to-br from-gold to-coral text-3xl shadow-lg">
            🪩
          </div>
        </Reveal>

        {/* Bio */}
        <div>
          <Reveal>
            <span className="mb-4 inline-block rounded-full border border-cream/15 bg-cream/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-gold">
              {ui.about.eyebrow}
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="retro-title text-4xl sm:text-5xl">{ui.about.title}</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 text-lg leading-relaxed text-cream/80">{t(artist.bio)}</p>
          </Reveal>

          {/* Stats */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            className="mt-10 grid grid-cols-3 gap-4"
          >
            {artist.stats.map((s, i) => (
              <motion.div key={i} variants={popIn} className="glass-warm rounded-3xl p-5 text-center">
                <div className="font-display text-3xl font-extrabold text-gold sm:text-4xl">
                  {s.value}
                </div>
                <div className="mt-1 text-xs font-medium text-cream/70">{t(s.label)}</div>
                <div className="text-[10px] uppercase tracking-wider text-cream/40">{t(s.sub)}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
