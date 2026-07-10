'use client';

import { motion, type Variants } from 'framer-motion';
import { fadeUp } from './motion';

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
  delay?: number;
  as?: 'div' | 'section' | 'li' | 'article';
};

/** Wrapper scroll-triggered : se déclenche en entrant dans le viewport. */
export default function Reveal({
  children,
  className,
  variants = fadeUp,
  delay = 0,
  as = 'div',
}: RevealProps) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      transition={delay ? { delay } : undefined}
    >
      {children}
    </MotionTag>
  );
}
