'use client';

import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import DiscoBall from './DiscoBall';

/**
 * Canvas du hero — boule disco miroir 3D.
 * Version allégée sur mobile / petits écrans pour préserver le 60fps.
 */
export default function HeroCanvas() {
  const [lowPower, setLowPower] = useState(false);
  const [reduced, setReduced] = useState(false);

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

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 42 }}
      dpr={lowPower ? [1, 1.4] : [1, 1.9]}
      gl={{ alpha: true, antialias: !lowPower, powerPreference: 'high-performance' }}
      frameloop={reduced ? 'demand' : 'always'}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <DiscoBall bands={lowPower ? 16 : 24} lowPower={lowPower} />
      </Suspense>
    </Canvas>
  );
}
