'use client';

import { motion } from 'framer-motion';
import { useContent } from '@/components/providers/ContentProvider';
import { SocialIcon } from '@/components/ui/icons';
import SectionHeading from '@/components/ui/SectionHeading';
import { stagger, popIn } from '@/components/ui/motion';

const accent: Record<string, string> = {
  spotify: '#15C7B8',
  instagram: '#FF2E92',
  appleMusic: '#FF6B35',
  youtube: '#FF3B3B',
  soundcloud: '#FF7A00',
  facebook: '#3b82f6',
};

export default function Socials() {
  const { content, ui } = useContent();

  return (
    <section id="socials" className="relative overflow-hidden py-24 sm:py-32">
      <div className="halo bottom-[10%] left-[10%] h-72 w-72 bg-magenta" />
      <div className="mx-auto max-w-5xl px-6">
        <SectionHeading eyebrow={ui.socials.eyebrow} title={ui.socials.title} subtitle={ui.socials.subtitle} />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5"
        >
          {content.socials.map((s) => {
            const Icon = SocialIcon[s.key];
            const col = accent[s.key] ?? '#FF2E92';
            return (
              <motion.a
                key={s.key}
                variants={popIn}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -5 }}
                className="group relative flex items-center gap-4 overflow-hidden rounded-3xl border border-cream/10 bg-cream/[0.04] p-5 transition-colors hover:border-cream/25"
              >
                <span
                  className="absolute -left-6 -top-6 h-20 w-20 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-80"
                  style={{ background: col }}
                />
                <span
                  className="relative flex h-12 w-12 flex-none items-center justify-center rounded-2xl transition-transform group-hover:rotate-6 group-hover:scale-110"
                  style={{ background: `${col}26`, color: col }}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span className="relative font-semibold text-cream">{s.label}</span>
                <span className="relative ml-auto text-cream/30 transition-transform group-hover:translate-x-1 group-hover:text-cream">
                  ↗
                </span>
              </motion.a>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
