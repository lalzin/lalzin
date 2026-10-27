import type { Chord } from './types';

/**
 * Synthé placeholder : joue les couches absentes (pas de `src`) tant que les
 * stems ne sont pas livrés. Une voix par id de couche : pad, bass, vocals,
 * drums, chorus. Tout est synthétisé, aucun fichier.
 */

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export type SynthVoices = {
  /** Planifie le pas `step` (double-croche, 16 par mesure) de la mesure `bar` à l'instant `t`. */
  play(id: string, t: number, bar: number, step: number, dest: AudioNode): void;
  sfx(kind: 'hit' | 'tier' | 'rush' | 'win', t: number, dest: AudioNode): void;
};

export function createSynth(ctx: AudioContext, chords: Chord[], beatLen: number): SynthVoices {
  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const step = beatLen / 4;
  const bar = beatLen * 4;

  const env = (g: GainNode, t: number, a: number, peak: number, d: number) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  };

  function kick(t: number, dest: AudioNode, level = 1) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.12);
    env(g, t, 0.004, 0.9 * level, 0.32);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + 0.4);
  }

  function noiseHit(t: number, dest: AudioNode, type: BiquadFilterType, freq: number, q: number, level: number, dur: number) {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    env(g, t, 0.002, level, dur);
    s.connect(f).connect(g).connect(dest);
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.05);
  }

  function pad(t: number, notes: number[], dur: number, dest: AudioNode) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(700, t);
    f.frequency.linearRampToValueAtTime(1400, t + dur * 0.5);
    f.frequency.linearRampToValueAtTime(800, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.075, t + 0.6);
    g.gain.setValueAtTime(0.075, t + dur - 0.2);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.9);
    f.connect(g).connect(dest);
    for (const n of notes) {
      for (const det of [-9, 7]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = mtof(n);
        o.detune.value = det;
        o.connect(f);
        o.start(t);
        o.stop(t + dur + 1);
      }
    }
  }

  function bass(t: number, midi: number, dur: number, dest: AudioNode) {
    const o = ctx.createOscillator();
    const s = ctx.createOscillator();
    o.type = 'triangle';
    s.type = 'sine';
    o.frequency.value = mtof(midi);
    s.frequency.value = mtof(midi - 12);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(900, t);
    f.frequency.exponentialRampToValueAtTime(220, t + dur);
    const g = ctx.createGain();
    env(g, t, 0.01, 0.5, dur);
    o.connect(f);
    s.connect(f);
    f.connect(g).connect(dest);
    o.start(t);
    s.start(t);
    o.stop(t + dur + 0.1);
    s.stop(t + dur + 0.1);
  }

  /** « Voix » : dent de scie à travers deux formants (voyelle « oo/ah »). */
  function voice(t: number, midi: number, dur: number, dest: AudioNode) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = mtof(midi);
    const vib = ctx.createOscillator();
    const vg = ctx.createGain();
    vib.frequency.value = 5.2;
    vg.gain.setValueAtTime(0, t);
    vg.gain.linearRampToValueAtTime(14, t + dur * 0.6);
    vib.connect(vg).connect(o.detune);
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.linearRampToValueAtTime(0.16, t + 0.12);
    out.gain.setValueAtTime(0.16, t + dur * 0.8);
    out.gain.linearRampToValueAtTime(0.0001, t + dur + 0.25);
    for (const [fr, q, lv] of [[650, 6, 1], [1100, 8, 0.6], [2600, 10, 0.25]] as const) {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = fr;
      bp.Q.value = q;
      const lg = ctx.createGain();
      lg.gain.value = lv;
      o.connect(bp).connect(lg).connect(out);
    }
    out.connect(dest);
    o.start(t);
    vib.start(t);
    o.stop(t + dur + 0.3);
    vib.stop(t + dur + 0.3);
  }

  /** Accords « guitare funky » courts sur les contretemps. */
  function stab(t: number, notes: number[], dest: AudioNode) {
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1800;
    f.Q.value = 0.8;
    const g = ctx.createGain();
    env(g, t, 0.003, 0.09, 0.12);
    f.connect(g).connect(dest);
    for (const n of notes) {
      const o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = mtof(n + 12);
      o.connect(f);
      o.start(t);
      o.stop(t + 0.2);
    }
  }

  const bassPattern: [number, number, number][] = [
    // pas, intervalle, durée (en pas)
    [0, 0, 3],
    [3, 0, 1],
    [6, 12, 2],
    [8, 0, 2],
    [10, 7, 2],
    [14, 10, 2],
  ];
  const leadPattern: [number, number, number][] = [
    // pas, index de note dans l'accord (dernière = plus aiguë), durée (pas)
    [0, 3, 6],
    [8, 2, 4],
    [12, 1, 4],
  ];

  return {
    play(id, t, barIdx, s, dest) {
      const chord = chords[((barIdx % chords.length) + chords.length) % chords.length];
      switch (id) {
        case 'pad':
          if (s === 0) pad(t, chord.notes, bar, dest);
          if (s === 0 || s === 8) kick(t, dest, 0.45); // battement de cœur
          break;
        case 'bass':
          for (const [ps, iv, d] of bassPattern) if (ps === s) bass(t, chord.root + iv, d * step * 0.9, dest);
          break;
        case 'vocals':
          if (barIdx % 2 === 0) for (const [ps, ni, d] of leadPattern) if (ps === s) voice(t, chord.notes[ni] + 12, d * step, dest);
          break;
        case 'drums':
          if (s % 4 === 0) kick(t, dest);
          if (s === 4 || s === 12) noiseHit(t, dest, 'bandpass', 1500, 0.9, 0.45, 0.16);
          if (s % 4 === 2) noiseHit(t, dest, 'highpass', 7000, 0.7, 0.16, 0.12);
          else noiseHit(t, dest, 'highpass', 9000, 0.7, 0.05, 0.03);
          break;
        case 'chorus':
          if (s % 4 === 2) stab(t, chord.notes, dest);
          if (s % 2 === 1) noiseHit(t, dest, 'highpass', 6000, 1, 0.05, 0.05);
          break;
      }
    },
    sfx(kind, t, dest) {
      if (kind === 'hit') {
        // Scintillement non accordé : ne frotte jamais avec la tonalité du morceau.
        noiseHit(t, dest, 'bandpass', 9000, 4, 0.12, 0.35);
      } else if (kind === 'tier' || kind === 'win') {
        // Montée de bruit filtré, calée pour finir sur la mesure.
        const s = ctx.createBufferSource();
        s.buffer = noise;
        s.loop = true;
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.Q.value = 2;
        const len = kind === 'win' ? 2.5 : 1.2;
        f.frequency.setValueAtTime(400, t);
        f.frequency.exponentialRampToValueAtTime(6000, t + len);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.12, t + len);
        g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.4);
        s.connect(f).connect(g).connect(dest);
        s.start(t);
        s.stop(t + len + 0.5);
      } else {
        // Rush : souffle grave et sale.
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(90, t);
        o.frequency.exponentialRampToValueAtTime(40, t + 0.35);
        env(g, t, 0.01, 0.12, 0.35);
        o.connect(g).connect(dest);
        o.start(t);
        o.stop(t + 0.45);
      }
    },
  };
}
