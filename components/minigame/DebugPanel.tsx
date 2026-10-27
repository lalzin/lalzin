'use client';

import { useEffect, useRef, useState } from 'react';
import type { Engine } from '@/lib/minigame/engine';

/**
 * `?debug=1` : affiche le beatClock et permet de caler BPM + offset en tapant
 * en rythme sur les temps forts. Recopier les valeurs dans config.ts.
 */
export default function DebugPanel({ engine }: { engine: Engine }) {
  const { clock } = engine;
  const [, force] = useState(0);
  const taps = useRef<number[]>([]);
  const [measured, setMeasured] = useState<{ bpm: number; offset: number } | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 100);
    return () => window.clearInterval(id);
  }, []);

  const tap = () => {
    const t = clock.now();
    const list = taps.current;
    if (list.length && t - list[list.length - 1] > 2) list.length = 0;
    list.push(t);
    if (list.length > 12) list.shift();
    if (list.length < 4) return;
    const intervals = list.slice(1).map((v, i) => v - list[i]);
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpm = 60 / avg;
    // Offset = phase moyenne des taps par rapport au début de lecture.
    const phases = list.map((v) => (((v - clock.startAt()) % avg) + avg) % avg);
    const offset = phases.reduce((a, b) => a + b, 0) / phases.length;
    setMeasured({ bpm: Math.round(bpm * 10) / 10, offset: Math.round(offset * 1000) / 1000 });
  };

  const beat = clock.beat();
  return (
    <div
      className="absolute bottom-3 left-3 z-50 w-48 rounded-lg bg-black/70 p-2 font-mono text-[10px] text-lime-300"
      style={{ touchAction: 'manipulation' }}
    >
      <div>bpm {clock.bpm} · offset {clock.offset.toFixed(3)}s</div>
      <div>
        mesure {Math.floor(beat / clock.beatsPerBar) + 1} · temps {clock.beatInBar() + 1}
      </div>
      <div className="mt-1 flex gap-1">
        {Array.from({ length: clock.beatsPerBar }, (_, i) => (
          <span key={i} className={`h-2 flex-1 rounded ${clock.beatInBar() === i ? 'bg-lime-300' : 'bg-lime-900'}`} />
        ))}
      </div>
      <button onPointerDown={tap} className="mt-2 w-full rounded bg-lime-300/20 py-2 font-bold">
        TAP (temps forts)
      </button>
      {measured && (
        <div className="mt-1">
          mesuré : bpm {measured.bpm} · offset {measured.offset}s
          <button
            className="ml-1 underline"
            onClick={() => {
              clock.bpm = measured.bpm;
              clock.offset = measured.offset;
            }}
          >
            appliquer
          </button>
        </div>
      )}
    </div>
  );
}
