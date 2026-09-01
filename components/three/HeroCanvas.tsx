'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import DiscoBall from './DiscoBall';
import BallLoader from './BallLoader';

/**
 * Signale que la scène est réellement peinte : monté seulement une fois le
 * Suspense résolu (HDR chargé), il attend une frame rendue avant de prévenir.
 */
function SceneReady({ onReady }: { onReady: () => void }) {
  const done = useRef(false);
  const invalidate = useThree((state) => state.invalidate);

  // En frameloop « demand » (motion réduit), force le rendu d'une frame.
  useEffect(() => {
    invalidate();
  }, [invalidate]);

  useFrame(() => {
    if (done.current) return;
    done.current = true;
    onReady();
  });

  return null;
}

/**
 * Canvas du hero — boule disco miroir 3D.
 * Version allégée sur mobile / petits écrans pour préserver le 60fps.
 */
export default function HeroCanvas({ loadingLabel }: { loadingLabel: string }) {
  const [lowPower, setLowPower] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mqMobile = window.matchMedia('(max-width: 768px)');
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      setLowPower(mqMobile.matches || window.devicePixelRatio < 1.5);
      setReduced(mqMotion.matches);
    };
    update();
    mqMobile.addEventListener('change', update);
    mqMotion.addEventListener('change', update);
    return () => {
      mqMobile.removeEventListener('change', update);
      mqMotion.removeEventListener('change', update);
    };
  }, []);

  const handleReady = useCallback(() => setReady(true), []);

  // Filet de sécurité : si le WebGL échoue, on n'affiche pas le loader à vie.
  useEffect(() => {
    if (ready) return;
    const id = setTimeout(() => setReady(true), 8000);
    return () => clearTimeout(id);
  }, [ready]);

  return (
    <div className="relative h-full w-full">
      <div
        className={`h-full w-full transition-opacity duration-700 ease-out ${
          ready ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Canvas
          camera={{ position: [0, 0, 6], fov: 42 }}
          dpr={lowPower ? [1, 1.4] : [1, 1.9]}
          gl={{ alpha: true, antialias: !lowPower, powerPreference: 'high-performance' }}
          frameloop={reduced ? 'demand' : 'always'}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <DiscoBall bands={lowPower ? 16 : 24} lowPower={lowPower} />
            <SceneReady onReady={handleReady} />
          </Suspense>
        </Canvas>
      </div>

      {!ready && <BallLoader label={loadingLabel} />}
    </div>
  );
}
