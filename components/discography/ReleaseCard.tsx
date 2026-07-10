'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { Release } from '@/lib/content';
import { isExternal, resolveListenHref } from '@/lib/links';
import { useContent } from '@/components/providers/ContentProvider';
import GeneratedCover from './GeneratedCover';

export default function ReleaseCard({ release }: { release: Release }) {
  const { ui, content } = useContent();
  const href = resolveListenHref(release.href, content.socials);
  const ref = useRef<HTMLAnchorElement>(null);
  const [coverOk, setCoverOk] = useState(Boolean(release.cover));

  // Tilt 3D au survol
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), { stiffness: 200, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), { stiffness: 200, damping: 18 });

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const [c1, c2] = release.accent;

  return (
    <motion.a
      ref={ref}
      href={href}
      target={isExternal(href) ? '_blank' : undefined}
      rel="noopener noreferrer"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      whileHover={{ scale: 1.03 }}
      className="group relative block rounded-[1.75rem] p-[2px]"
    >
      {/* Halo lumineux chaud au survol */}
      <div
        className="absolute -inset-3 rounded-[2rem] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-70"
        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
      />
      {/* Bordure dégradée */}
      <div
        className="absolute inset-0 rounded-[1.75rem] opacity-60 transition-opacity group-hover:opacity-100"
        style={{ background: `linear-gradient(135deg, ${c1}66, ${c2}66)` }}
      />

      <div className="relative overflow-hidden rounded-[1.65rem] bg-night-soft">
        {/* Visuel */}
        <div className="relative aspect-square overflow-hidden" style={{ transform: 'translateZ(30px)' }}>
          <GeneratedCover release={release} />
          {coverOk && release.cover && (
            // Vraie cover par-dessus le visuel généré ; en cas d'erreur (image
            // absente) on masque l'image et le visuel généré reste affiché.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={release.cover}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setCoverOk(false)}
            />
          )}
          {release.featured && (
            <span className="absolute left-3 top-3 rounded-full bg-cream/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-night">
              ★ {ui.discography.featured}
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-night-soft via-transparent to-transparent" />
        </div>

        {/* Infos */}
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: c1 }}
            >
              {release.type}
            </span>
            <h3 className="truncate font-display text-lg font-bold text-cream">
              {release.title}
            </h3>
          </div>
          <span
            className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-night transition-transform group-hover:rotate-12 group-hover:scale-110"
            style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
          >
            ▶
          </span>
        </div>
      </div>
    </motion.a>
  );
}
