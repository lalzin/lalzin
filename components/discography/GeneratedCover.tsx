import type { Release } from '@/lib/content';

/**
 * Cover générée façon pochette disco rétro (flat, chaleureuse).
 * Boule à facettes pleine et nette, rayons chauds, confettis, ondulations.
 * Sert de visuel par défaut quand aucune image n'est fournie.
 */
export default function GeneratedCover({ release }: { release: Release }) {
  const [c1, c2] = release.accent;
  const uid = release.id.replace(/[^a-z0-9]/gi, '');
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id={`bg-${uid}`} cx="50%" cy="36%" r="80%">
          <stop offset="0%" stopColor={c2} />
          <stop offset="50%" stopColor={c1} />
          <stop offset="100%" stopColor="#1b0e22" />
        </radialGradient>
        <linearGradient id={`ray-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff3e6" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#fff3e6" stopOpacity="0" />
        </linearGradient>
        {/* Facettes pleines (deux tons argent) */}
        <pattern
          id={`facets-${uid}`}
          width="15"
          height="15"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(0)"
        >
          <rect width="15" height="15" fill="#9aa6b6" />
          <path d="M7.5 0 L15 7.5 L7.5 15 L0 7.5 Z" fill="#e6edf5" />
        </pattern>
        {/* Ombrage sphérique */}
        <radialGradient id={`shade-${uid}`} cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#0d0612" stopOpacity="0.6" />
        </radialGradient>
        <clipPath id={`ball-${uid}`}>
          <circle cx="200" cy="150" r="62" />
        </clipPath>
      </defs>

      <rect width="400" height="400" fill={`url(#bg-${uid})`} />

      {/* Rayons de lumière chauds */}
      <g opacity="0.55">
        {Array.from({ length: 10 }).map((_, i) => (
          <polygon
            key={i}
            points="200,150 190,-50 210,-50"
            fill={`url(#ray-${uid})`}
            transform={`rotate(${i * 36} 200 150)`}
          />
        ))}
      </g>

      {/* Ondulations organiques */}
      <path d="M0,300 C80,270 140,330 220,300 C300,272 360,320 400,296 L400,400 L0,400 Z" fill="#1b0e22" opacity="0.5" />
      <path d="M0,332 C90,310 150,356 230,330 C310,306 360,346 400,328 L400,400 L0,400 Z" fill="#140a1a" opacity="0.7" />

      {/* Boule à facettes pleine */}
      <g>
        <circle cx="200" cy="150" r="64" fill="#0d0612" opacity="0.4" />
        <g clipPath={`url(#ball-${uid})`}>
          <rect x="138" y="88" width="124" height="124" fill={`url(#facets-${uid})`} />
          <rect x="138" y="88" width="124" height="124" fill={`url(#shade-${uid})`} />
        </g>
        <circle cx="200" cy="150" r="62" fill="none" stroke="#fff3e6" strokeOpacity="0.3" strokeWidth="1.5" />
        <ellipse cx="180" cy="128" rx="16" ry="11" fill="#ffffff" opacity="0.7" />
      </g>

      {/* Confettis flottants */}
      {[
        [62, 96, '#FFC23C'],
        [332, 78, '#15C7B8'],
        [70, 210, '#FF6BB0'],
        [338, 214, '#FFD96B'],
        [112, 66, '#FF6B35'],
        [300, 168, '#FF2E92'],
      ].map(([x, y, col], i) =>
        i % 2 ? (
          <circle key={i} cx={x as number} cy={y as number} r="5" fill={col as string} />
        ) : (
          <rect
            key={i}
            x={x as number}
            y={y as number}
            width="9"
            height="5"
            rx="1.5"
            fill={col as string}
            transform={`rotate(${i * 24} ${x} ${y})`}
          />
        ),
      )}
    </svg>
  );
}
