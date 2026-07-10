'use client';

import { motion } from 'framer-motion';
import { useContent } from '@/components/providers/ContentProvider';
import SectionHeading from '@/components/ui/SectionHeading';
import { stagger, popIn } from '@/components/ui/motion';
import ReleaseCard from '@/components/discography/ReleaseCard';

export default function Discography() {
  const { content, ui } = useContent();

  return (
    <section id="discography" className="relative overflow-hidden py-24 sm:py-32">
      <div className="halo left-[-5%] top-[10%] h-80 w-80 bg-magenta" />
      <div className="halo right-[-5%] bottom-[10%] h-80 w-80 bg-gold" />

      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow={ui.discography.eyebrow}
          title={ui.discography.title}
          subtitle={ui.discography.subtitle}
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-2 gap-5 sm:gap-6 md:grid-cols-3 lg:grid-cols-4"
        >
          {content.releases.map((r) => (
            <motion.div key={r.id} variants={popIn}>
              <ReleaseCard release={r} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
