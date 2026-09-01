'use client';

/**
 * Placeholder affiché tant que la boule disco 3D n'est pas prête.
 * 100 % CSS (aucun asset ni JS supplémentaire) : sphère sombre facettée +
 * balayage de lumière, exactement à la place et à la taille du canvas.
 */
export default function BallLoader({ label }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-0 grid place-items-center"
    >
      <div className="relative aspect-square w-[70%] overflow-hidden rounded-full">
        {/* Sphère sombre, même teinte que le noyau de la vraie boule */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_34%_28%,rgba(245,232,207,0.20),rgba(58,30,51,0.5)_45%,rgba(36,16,25,0.85)_78%)]" />

        {/* Facettes miroir */}
        <div className="absolute inset-0 opacity-40 [background-image:repeating-linear-gradient(0deg,transparent_0_10px,rgba(245,232,207,0.18)_10px_11px),repeating-linear-gradient(90deg,transparent_0_10px,rgba(245,232,207,0.14)_10px_11px)]" />

        {/* Balayage de lumière chaud */}
        <div className="absolute inset-y-0 -left-1/4 w-1/2 animate-sweep bg-[linear-gradient(100deg,transparent,rgba(233,174,62,0.28)_45%,rgba(245,232,207,0.42)_55%,transparent)] blur-md" />

        {/* Reflet spéculaire + liseré chaud */}
        <div className="absolute left-[22%] top-[18%] h-[22%] w-[22%] rounded-full bg-cream/25 blur-lg" />
        <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-cream/15" />
      </div>

      {label && <span className="sr-only">{label}</span>}
    </div>
  );
}
