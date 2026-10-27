import type { BeatClock } from './beatClock';
import { createSynth } from './synth';
import type { AudioConfig } from './types';

/**
 * Musique qui suit la proximité : une piste (bus) par couche ; chaque couche
 * entre quand les mains passent sous son seuil de distance et ressort dès
 * qu'elles s'éloignent (tout joue au contact). Les couches avec `src` sont des
 * stems en boucle (un même fichier peut nourrir plusieurs couches, chacune
 * filtrée sur sa bande) ; les autres sont jouées par le synthé placeholder.
 * À 100 %, le refrain (`finale`) prend le relais sur la mesure suivante.
 * Un filtre passe-bas maître s'ouvre quand les ombres se rapprochent.
 */
export type GameAudio = {
  ctx: AudioContext;
  /** Proximité des mains 0..1 : plus on est proche, plus il y a de couches. */
  setCloseness(c: number): void;
  /** 100 = le refrain prend le relais sur la mesure suivante. */
  setProgress(gauge: number): void;
  /** Coupe le refrain et rend la main aux couches. */
  resetLayers(): void;
  /** 0 = étouffé, 1 = grand ouvert. */
  setOpenness(v: number): void;
  sfx(kind: 'hit' | 'tier' | 'rush' | 'win'): void;
  /** Mode disco : bascule sur la version disco (ou batterie disco de secours). */
  setDisco(on: boolean): void;
  /** Debug : gains courants (maître, refrain, disco, couches). */
  levels(): object;
  /** Sourdine (musique + effets) ; l'horloge continue, la partie aussi. */
  setMuted(muted: boolean): void;
  suspend(): void;
  resume(): void;
  destroy(): void;
};

/** À appeler dans le gestionnaire du tap (iOS exige un geste utilisateur). */
export function createAudioContext(): AudioContext {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctor({ latencyHint: 'interactive' });
  void ctx.resume();
  return ctx;
}

const prefetched = new Map<string, Promise<ArrayBuffer>>();
const fetchBytes = (src: string) => {
  let p = prefetched.get(src);
  if (!p) {
    p = fetch(src).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.arrayBuffer();
    });
    prefetched.set(src, p);
  }
  return p;
};

/** Télécharge les stems dès l'écran d'accueil (le décodage, lui, attend le tap). */
export function prefetchAudio(cfg: AudioConfig) {
  for (const l of cfg.layers) if (l.src) fetchBytes(l.src).catch(() => {});
  if (cfg.finale) fetchBytes(cfg.finale.src).catch(() => {});
}

async function loadBuffer(ctx: AudioContext, src: string): Promise<AudioBuffer | null> {
  try {
    // slice() : decodeAudioData détache le buffer, on garde l'original pour un 2e décodage.
    const bytes = (await fetchBytes(src)).slice(0);
    return await ctx.decodeAudioData(bytes);
  } catch (e) {
    console.warn('[minigame] stem indisponible, synthé de secours :', src, e);
    return null;
  }
}

/** Filtre de bande Linkwitz-Riley 4 (deux Butterworth en série) : les bandes se resomment à plat. */
function bandChain(ctx: AudioContext, [lo, hi]: [number, number]): { input: AudioNode; output: AudioNode } {
  const nodes: BiquadFilterNode[] = [];
  const add = (type: BiquadFilterType, f: number) => {
    for (let i = 0; i < 2; i++) {
      const b = ctx.createBiquadFilter();
      b.type = type;
      b.frequency.value = f;
      b.Q.value = Math.SQRT1_2;
      nodes.push(b);
    }
  };
  if (lo > 0) add('highpass', lo);
  if (hi > 0) add('lowpass', hi);
  if (!nodes.length) {
    const g = ctx.createGain();
    return { input: g, output: g };
  }
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]);
  return { input: nodes[0], output: nodes[nodes.length - 1] };
}

export async function createGameAudio(
  ctx: AudioContext,
  cfg: AudioConfig,
  clock: BeatClock,
  /** Temps d'attente (en temps musicaux) avant que la musique parte : le décompte « 3 2 1 Go ». */
  leadInBeats = 0,
): Promise<GameAudio> {
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -10;
  comp.ratio.value = 2.5;
  const master = ctx.createGain();
  master.gain.value = 0.9;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 0.9;
  lp.frequency.value = 600;
  // Sortie générale : la sourdine agit ici (après le compresseur), pas sur le contexte,
  // pour que l'horloge du jeu (ctx.currentTime) continue de tourner.
  const out = ctx.createGain();
  lp.connect(master).connect(comp).connect(out).connect(ctx.destination);
  const sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.8;
  sfxBus.connect(comp);

  const buses = new Map<string, GainNode>();
  for (const layer of cfg.layers) {
    const g = ctx.createGain();
    g.gain.value = layer.unlockAt <= 0 ? 1 : 0;
    g.connect(lp);
    buses.set(layer.id, g);
  }
  const discoBus = ctx.createGain();
  discoBus.gain.value = 0;
  discoBus.connect(lp);
  const finaleBus = ctx.createGain();
  finaleBus.gain.value = 0;
  finaleBus.connect(lp);

  // Un décodage par fichier, partagé entre les couches qui l'utilisent.
  const srcs = new Set<string>(cfg.layers.flatMap((l) => (l.src ? [l.src] : [])));
  if (cfg.finale) srcs.add(cfg.finale.src);
  if (cfg.disco) srcs.add(cfg.disco.src);
  const buffers = new Map<string, AudioBuffer>();
  await Promise.all(
    [...srcs].map(async (s) => {
      const b = await loadBuffer(ctx, s);
      if (b) buffers.set(s, b);
    }),
  );

  const startAt = ctx.currentTime + 0.15 + leadInBeats * clock.beatLength;
  clock.attach(() => ctx.currentTime, startAt);
  const sources: AudioBufferSourceNode[] = [];
  const loopStart = cfg.loop?.start ?? 0;
  const playFrom = cfg.playFrom ?? loopStart;
  // Fin de l'intro (instant audio) : avant, le morceau joue en entier, quelle que soit la proximité.
  const introEnd = startAt + Math.max(0, loopStart - playFrom);
  const synthIds: string[] = [];
  // Refrain disco : lancé à la demande, depuis son premier temps, sur le temps suivant.
  const discoBuf = cfg.disco ? buffers.get(cfg.disco.src) : undefined;
  let discoSrc: AudioBufferSourceNode | null = null;
  let discoOn = false;
  const nextBeat = () => {
    const bl = clock.beatLength;
    const base = startAt + clock.offset;
    return base + Math.ceil((ctx.currentTime + 0.03 - base) / bl) * bl;
  };
  for (const layer of cfg.layers) {
    const buf = layer.src ? buffers.get(layer.src) : undefined;
    if (!buf) {
      synthIds.push(layer.id);
      continue;
    }
    const s = ctx.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    if (cfg.loop) {
      s.loopStart = cfg.loop.start;
      s.loopEnd = cfg.loop.end;
    }
    const chain = layer.band ? bandChain(ctx, layer.band) : null;
    if (chain) {
      s.connect(chain.input);
      chain.output.connect(buses.get(layer.id)!);
    } else s.connect(buses.get(layer.id)!);
    // Tous les stems démarrent au même instant audio → synchro à l'échantillon.
    s.start(startAt, playFrom);
    sources.push(s);
  }

  const synth = createSynth(ctx, cfg.placeholderChords, clock.beatLength);
  const stepLen = clock.beatLength / 4;
  let nextStep = 0;
  // Planificateur « lookahead » (synthé de secours seulement).
  const timer = window.setInterval(() => {
    const horizon = ctx.currentTime + 0.15;
    while (startAt + clock.offset + nextStep * stepLen < horizon) {
      const t = startAt + clock.offset + nextStep * stepLen;
      if (t >= ctx.currentTime - 0.01) {
        const bar = Math.floor(nextStep / 16);
        const step = nextStep % 16;
        for (const id of synthIds) synth.play(id, t, bar, step, buses.get(id)!);
        // Pas de version disco fournie : batterie disco synthétisée (non accordée).
        if (discoOn && !discoBuf) synth.play('drums', t, bar, step, discoBus);
      }
      nextStep++;
    }
  }, 25);

  let finale: AudioBufferSourceNode | null = null;
  const targets = new Map<string, number>(cfg.layers.map((l) => [l.id, l.unlockAt <= 0 ? 1 : 0]));
  // Peu de couches = peu d'énergie : on remonte le maître pour que ça ne sonne jamais vide.
  let lastMaster = -1;
  // Pendant qu'un refrain (fin de niveau / disco) s'éteint, on ne remonte pas le maître :
  // sinon le refrain qui finit est amplifié et se superpose à la boucle (volume qui explose).
  let fadingUntil = 0;
  const compensate = () => {
    let sum = 0;
    for (const v of targets.values()) sum += v;
    const quiet = finale || (discoOn && discoBuf) || ctx.currentTime < fadingUntil || ctx.currentTime < introEnd;
    const ratio = quiet ? 1 : sum / cfg.layers.length;
    const g = 0.9 * (1 + 0.8 * (1 - ratio));
    if (Math.abs(g - lastMaster) < 0.01) return;
    lastMaster = g;
    master.gain.setTargetAtTime(g, ctx.currentTime, 0.25);
  };
  compensate();

  const ramp = (g: GainNode, v: number, at: number, len: number) => {
    const now = ctx.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(g.gain.value, now);
    g.gain.setValueAtTime(g.gain.value, Math.max(now, at));
    g.gain.linearRampToValueAtTime(v, Math.max(now, at) + len);
  };
  const nextBar = () => Math.max(ctx.currentTime + 0.02, clock.nextBarTime());

  function startFinale() {
    const buf = cfg.finale ? buffers.get(cfg.finale.src) : undefined;
    if (!buf || finale) return;
    const t = nextBar();
    const s = ctx.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    s.loopStart = cfg.finale!.start;
    s.loopEnd = cfg.finale!.end;
    s.connect(finaleBus);
    s.start(t, cfg.finale!.start);
    finale = s;
    ramp(finaleBus, 1, t, 0.03);
    for (const g of buses.values()) ramp(g, 0, t, 0.06);
    compensate();
  }

  return {
    ctx,
    setCloseness(c) {
      if (finale || (discoOn && discoBuf)) return;
      if (ctx.currentTime < introEnd - 0.05) c = 1; // l'intro (avec la voix parlée) joue en entier
      // Chaque couche a son seuil de proximité (unlockAt %) : elle entre en fondu
      // en approchant du seuil et ressort dès qu'on s'éloigne.
      for (const l of cfg.layers) {
        const th = l.unlockAt / 100;
        const t = l.unlockAt <= 0 ? 1 : Math.min(1, Math.max(0, (c - (th - 0.14)) / 0.14));
        const v = t * t * (3 - 2 * t);
        if (Math.abs(v - targets.get(l.id)!) < 0.02) continue;
        targets.set(l.id, v);
        buses.get(l.id)!.gain.setTargetAtTime(v, ctx.currentTime, 0.12);
      }
      compensate();
    },
    setProgress(gauge) {
      if (gauge >= 100) startFinale();
    },
    resetLayers() {
      if (finale) {
        // Le refrain s'éteint tout de suite (fondu court) ; la boucle revient sur la mesure suivante.
        const now = ctx.currentTime;
        ramp(finaleBus, 0, now, 0.35);
        finale.stop(now + 0.45);
        finale = null;
        fadingUntil = now + 0.5;
        // La boucle tourne toujours en rythme en arrière-plan : on la ramène tout de suite,
        // en fondu enchaîné avec la fin du refrain (pas de trou de silence).
        const t = now + 0.15;
        // Nouveau niveau = état de départ (couches de base seules) ; la proximité rajoutera le reste.
        for (const l of cfg.layers) {
          const v = l.unlockAt <= 0 ? 1 : 0;
          targets.set(l.id, v);
          ramp(buses.get(l.id)!, v, t, 0.25);
        }
        window.setTimeout(compensate, 600);
      }
      compensate();
    },
    setOpenness(v) {
      const f = 380 * Math.pow(18000 / 380, Math.min(1, Math.max(0, v)));
      lp.frequency.setTargetAtTime(f, ctx.currentTime, 0.12);
    },
    setDisco(on) {
      if (on === discoOn) return;
      discoOn = on;
      const now = ctx.currentTime;
      if (!discoBuf || !cfg.disco) {
        // Pas de version disco : batterie synthétisée par-dessus le morceau.
        discoBus.gain.setTargetAtTime(on ? 0.85 : 0, now, 0.08);
        if (on) synth.sfx('win', now + 0.01, sfxBus);
        return;
      }
      const t = nextBeat();
      if (on) {
        // On saute directement au refrain disco, calé sur le temps.
        const src = ctx.createBufferSource();
        src.buffer = discoBuf;
        src.loop = true;
        src.loopStart = cfg.disco.start;
        src.loopEnd = cfg.disco.end;
        src.connect(discoBus);
        src.start(t, cfg.disco.start);
        discoSrc = src;
        ramp(discoBus, 1, t, 0.02);
        for (const g of buses.values()) ramp(g, 0, t, 0.04);
      } else {
        ramp(discoBus, 0, t, 0.12);
        discoSrc?.stop(t + 0.2);
        discoSrc = null;
        for (const [id, g] of buses) ramp(g, targets.get(id)!, t, 0.12);
        fadingUntil = t + 0.25;
        window.setTimeout(compensate, (t - ctx.currentTime + 0.35) * 1000);
      }
      compensate();
    },
    sfx(kind) {
      synth.sfx(kind, ctx.currentTime + 0.01, sfxBus);
    },
    levels: () => ({
      master: +master.gain.value.toFixed(2),
      finale: +finaleBus.gain.value.toFixed(2),
      disco: +discoBus.gain.value.toFixed(2),
      layers: Object.fromEntries([...buses].map(([id, g]) => [id, +g.gain.value.toFixed(2)])),
    }),
    setMuted(muted) {
      out.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.05);
    },
    suspend: () => void ctx.suspend(),
    resume: () => void ctx.resume(),
    destroy() {
      window.clearInterval(timer);
      for (const s of sources) s.stop();
      finale?.stop();
      discoSrc?.stop();
      void ctx.close();
    },
  };
}
