/**
 * Réglages d'animation partagés — esprit « groovy » :
 * easing avec léger rebond organique (jamais de linéaire sec).
 */
import type { Variants } from 'framer-motion';

// Back-out : petit overshoot façon rebond funky
export const groovy = [0.34, 1.3, 0.5, 1] as const;
export const groovySoft = [0.25, 1, 0.4, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 42 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: groovy },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.9, ease: groovySoft } },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.85, y: 30 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.7, ease: groovy },
  },
};

export const stagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};
