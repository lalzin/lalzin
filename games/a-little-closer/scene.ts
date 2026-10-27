import {
  Assets,
  Container,
  Geometry,
  GlProgram,
  Graphics,
  Matrix,
  Mesh,
  RenderTexture,
  Shader,
  Sprite,
  Texture,
  UniformGroup,
} from 'pixi.js';
import { hexToRgb, type SceneFactory, type World } from '@/lib/minigame/engine';
import type { LevelConfig, LevelStats, Vec2 } from '@/lib/minigame/types';
import { makePickupTextures, makeSpecialTexture, PICKUPS, type PickupKind, type SpecialKind } from './pickups';
import { createCouple, createHer, createHim, HOLD_POSE, type Figure } from './shadows';
import { wallFragment, wallVertex } from './wallShader';

type Layout = { floorY: number; xMin: number; xMax: number; yMin: number; yMax: number };
type Phase = 'attract' | 'countdown' | 'play' | 'embrace' | 'won' | 'lost';

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);
/*
 * Sélection dans la planche de danse (index base 0 = numéro de pose − 1).
 * Jamais de baiser (poses 12 et 16) ; la pose 15 (côtés inversés) est écartée.
 */
/** Victoire : passe (4), tour (5), face à face (6), 2ᵉ tour (10), porté (13), étreinte (11). */
const CHOREO = [3, 4, 5, 9, 12, 10];
/** Écran d'accueil : seulement des pas de danse (3, 4, 5, 6, 8, 9, 10, 14). */
const ATTRACT_LOOP = [2, 3, 4, 5, 7, 8, 9, 13];
/** Durée du mode disco, en mesures (le refrain disco tourne pendant ce temps). */
const DISCO_BARS = 8;

function quad(w: number, h: number) {
  return new Geometry({
    attributes: { aPosition: [0, 0, w, 0, w, h, 0, h] },
    indexBuffer: [0, 1, 2, 0, 2, 3],
  });
}

/** Petite texture ronde et douce pour les poussières dans la lumière. */
function moteTexture(): Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.4, 'rgba(255,255,255,0.45)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 32, 32);
  return Texture.from(c);
}

export const createScene: SceneFactory = async (ctx) => {
  const { app, root, world, input, clock, config, debug, emit } = ctx;
  const pal = config.palette;
  const bpb = config.audio.beatsPerBar;

  const danceTex = await Assets.load<Texture>(config.assets.dance);
  try {
    await document.fonts.load(`92px ${ctx.fonts.display}`);
  } catch {
    /* police de secours */
  }

  // --- Masque : R = ombres, G = paroles projetées. Rendu hors écran en ½ résolution.
  const maskRoot = new Container();
  const her = createHer(danceTex);
  const him = createHim(danceTex);
  const herRig = new Container();
  const himRig = new Container();
  herRig.addChild(her.root);
  himRig.addChild(him.root);
  const couple = createCouple(danceTex);
  maskRoot.addChild(herRig, himRig, couple.root);
  const maskRT = RenderTexture.create({ width: world.w, height: world.h, resolution: 0.5, dynamic: true });

  // --- Mur procédural
  const vec = (v: number[]) => new Float32Array(v);
  const uniforms = new UniformGroup({
    uRes: { value: vec([world.w, world.h]), type: 'vec2<f32>' },
    uFloorY: { value: 0, type: 'f32' },
    uLight: { value: vec([0, 0]), type: 'vec2<f32>' },
    uLight2: { value: vec([0, 0, 0]), type: 'vec3<f32>' },
    uPatchHalf: { value: vec([470, 380]), type: 'vec2<f32>' },
    uSlope: { value: -0.5, type: 'f32' },
    uPeriod: { value: 52, type: 'f32' },
    uOpen: { value: 0.52, type: 'f32' },
    uSoft: { value: 5, type: 'f32' },
    uIntensity: { value: 1, type: 'f32' },
    uTime: { value: 0, type: 'f32' },
    uBlur: { value: 14, type: 'f32' },
    uWarm: { value: 0, type: 'f32' },
    uRush: { value: 0, type: 'f32' },
    uDisco: { value: 0, type: 'f32' },
    uPulse: { value: 0, type: 'f32' },
    uSpark: { value: vec([0, 0, 0]), type: 'vec3<f32>' },
    uRing: { value: vec([0, 0, 0, 0]), type: 'vec4<f32>' },
    uWallTop: { value: vec(hexToRgb(pal.wallTop)), type: 'vec3<f32>' },
    uWallBottom: { value: vec(hexToRgb(pal.wallBottom)), type: 'vec3<f32>' },
    uAmberA: { value: vec(hexToRgb(pal.amberA)), type: 'vec3<f32>' },
    uAmberB: { value: vec(hexToRgb(pal.amberB)), type: 'vec3<f32>' },
    uFloorCol: { value: vec(hexToRgb(pal.floor)), type: 'vec3<f32>' },
  });
  const u = uniforms.uniforms as Record<string, any>;
  const shader = new Shader({
    glProgram: GlProgram.from({ vertex: wallVertex, fragment: wallFragment, name: 'alc-wall' }),
    resources: { wallUniforms: uniforms, uMask: maskRT.source },
  });
  const wall = new Mesh({ geometry: quad(world.w, world.h), shader });
  root.addChild(wall);

  // --- Repère de jeu : deux points sur les mains et un fil de lumière entre elles,
  // bleu froid quand elles sont loin, ambre puis blanc chaud quand elles se rejoignent.
  const guide = new Graphics();
  guide.blendMode = 'add';
  root.addChild(guide);
  const mixColor = (a: number, b: number, t: number) => {
    const c = (sh: number) => Math.round(lerp((a >> sh) & 255, (b >> sh) & 255, t));
    return (c(16) << 16) | (c(8) << 8) | c(0);
  };

  // --- Poussières en suspension, visibles seulement dans les rais de lumière.
  const moteTex = moteTexture();
  const motes = new Container();
  root.addChild(motes);
  type Mote = { s: Sprite; x: number; y: number; vx: number; vy: number; ph: number; size: number };
  const moteList: Mote[] = [];
  for (let i = 0; i < 60; i++) {
    const s = new Sprite(moteTex);
    s.anchor.set(0.5);
    s.blendMode = 'add';
    s.tint = 0xffc27a;
    motes.addChild(s);
    moteList.push({
      s,
      x: Math.random() * world.w,
      y: Math.random() * world.h * 0.75,
      vx: (Math.random() - 0.5) * 8,
      vy: -2 - Math.random() * 6,
      ph: Math.random() * 10,
      size: 0.25 + Math.random() * 0.55,
    });
  }

  // --- Bonus qui tombent + boule à facettes du mode disco.
  const pickTex = makePickupTextures(app.renderer);
  const items = new Container();
  root.addChild(items);
  type Item = { kind: PickupKind; s: Sprite; x0: number; x: number; y: number; vy: number; ph: number; t: number; gone: number };
  let itemList: Item[] = [];
  const ball = new Graphics();
  root.addChild(ball);
  // Bonus spécial du niveau (une seule apparition, imprévisible).
  const specialTex = new Map<string, Texture>();
  type Special = { s: Sprite; x: number; y: number; vx: number; vy: number; t: number; turnIn: number; pause: number; gone: number; leaving: boolean; trail: Vec2[]; blinks: number };
  let special: Special | null = null;
  let specialDone = false;
  let specialAt = 50;
  // Images des bonus spéciaux (préchargées) ; dessin vectoriel de secours sinon.
  for (const l of config.levels) {
    const sp = l.special;
    if (!sp?.image || specialTex.has(sp.id)) continue;
    try {
      specialTex.set(sp.id, await Assets.load<Texture>(sp.image));
    } catch {
      /* repli sur le dessin */
    }
  }

  const dbg = debug ? new Graphics() : null;
  if (dbg) root.addChild(dbg);

  // --- État
  const layout: Layout = { floorY: 0, xMin: 0, xMax: 0, yMin: 0, yMax: 0 };
  let level: LevelConfig = config.levels[0];
  let levelIndex = 0;
  let phase: Phase = 'attract';
  const light: Vec2 = { x: 0.6, y: 0.3 };
  const target: Vec2 = { x: 0.6, y: 0.3 };
  let gauge = 0;
  let tier = 0;
  let lastEmitted = -1;
  let embraceT = 0;
  let choreoStart = -1;
  let playTime = 0;
  let lastBeat = -1;
  let firstContact = false;
  let beatsCounted = 0;
  let hits = 0;
  let combo = 0;
  let maxCombo = 0;
  let rushes = 0;
  let momentsWon = 0;
  let rushing = false;
  let rushAmt = 0;
  let ringT = 1;
  let hitFlash = 0;
  let open = 0.3;
  let warm = 0;
  const ringAt = { x: 0, y: 0 };
  const hands = { her: { x: 0, y: 0 }, him: { x: 0, y: 0 } };
  let dist = 999;
  // Moments de jeu calés sur la mesure : anneau doré « Right now » et respiration « Breathe ».
  type Moment = { kind: 'golden' | 'breath'; start: number; end: number; ok: boolean };
  let moment: Moment | null = null;
  let breathEnv = 0;
  let shakeT = 0;
  let forceFill = false;
  const targetN = { x: 0, y: 0 };
  // Pas de danse : le point de rencontre saute ailleurs toutes les N mesures.
  const stepFrom = { x: 0, y: 0 };
  const stepTo = { x: 0, y: 0 };
  let stepT = 1;
  let stepFlash = 0;
  // Décompte « 3 2 1 Go », calé sur les temps : le jeu démarre au temps `goBeat`.
  let goBeat = 0;
  let lastCount = -1;
  // Points, bonus, mode disco.
  let points = 0;
  let catches = 0;
  let spawnIn = 3;
  let discoSpawned = false;
  let lastDiscoAt = -99;
  let discoT = 0;
  let discoAmt = 0;
  let clockT = 0;
  // Bonus chrono : il fond chaque seconde ; ce qui reste à la fin s'ajoute au score.
  // Il fond plus vite qu'on ne peut gagner de points en traînant : finir vite paie toujours.
  let chrono = 0;
  let chronoRate = 0;
  let lastChrono = -1;
  let timeBonus = 0;
  // Prolongations : une fois le chrono vide, il reste quelques secondes avant le « boom ».
  let overtime = 0;
  let lostT = 0;

  const toWorld = (n: Vec2): Vec2 => ({
    x: lerp(layout.xMin, layout.xMax, n.x),
    y: lerp(layout.yMin, layout.yMax, n.y),
  });

  function relayout(w: World) {
    layout.floorY = Math.round(w.h * 0.74);
    // La lumière reste autour des danseurs (colonne de 1080 au centre) : sur écran large,
    // elle ne part pas éclairer les bords vides.
    layout.xMin = Math.max(120, w.w / 2 - 1080 * 0.62);
    layout.xMax = Math.min(w.w - 120, w.w / 2 + 1080 * 0.62);
    // …et la fenêtre de lumière grandit avec le mur, pour garder des lames aussi généreuses qu'en mobile.
    const wide = Math.max(1, w.w / 1080);
    u.uPatchHalf[0] = 470 * Math.min(2.2, 0.55 + 0.45 * wide + (wide - 1) * 0.35);
    u.uPatchHalf[1] = 380 + (wide - 1) * 60;
    layout.yMin = w.h * 0.12;
    layout.yMax = layout.floorY - 140;
    wall.geometry = quad(w.w, w.h);
    maskRT.resize(w.w, w.h, 0.5);
    u.uRes[0] = w.w;
    u.uRes[1] = w.h;
    u.uFloorY = layout.floorY;
  }

  const popupAt = (text: string, p: Vec2, kind: 'gold' | 'disco' | 'cold') =>
    emit('popup', text, p.x / world.w, p.y / world.h, kind);

  /** Points (×3 en mode disco). */
  function addPoints(n: number, at?: Vec2) {
    // Prolongations : une fois le chrono vide, les points ne valent plus que 30 %.
    const overtime = chrono <= 0 ? 0.3 : 1;
    const g = Math.max(1, Math.round(n * (discoT > 0 ? 3 : 1) * overtime));
    points += g;
    emit('points', points);
    if (at) popupAt(`+${g}`, at, discoT > 0 ? 'disco' : 'gold');
  }

  function clearItems() {
    for (const it of itemList) it.s.destroy();
    itemList = [];
  }

  function spawnItem(force?: PickupKind) {
    let kind: PickupKind = force ?? 'note';
    if (!force) {
      const canDisco = discoT <= 0 && clockT - lastDiscoAt > 18;
      let r = Math.random() * (canDisco ? 1 : 1 - PICKUPS.disco.weight);
      for (const k of ['note', 'vinyl', 'disco'] as PickupKind[]) {
        if ((r -= PICKUPS[k].weight) <= 0) {
          kind = k;
          break;
        }
      }
    }
    if (kind === 'disco') {
      discoSpawned = true;
      lastDiscoAt = clockT;
    }
    const sp = new Sprite(pickTex[kind]);
    sp.anchor.set(0.5, kind === 'disco' ? 0.54 : 0.5);
    items.addChild(sp);
    const x0 = lerp(layout.xMin + 40, layout.xMax - 40, Math.random());
    itemList.push({ kind, s: sp, x0, x: x0, y: -80, vy: kind === 'disco' ? 150 : 170 + Math.random() * 70, ph: Math.random() * 6, t: 0, gone: 0 });
  }

  function startDisco() {
    discoT = DISCO_BARS * bpb * clock.beatLength;
    discoActive = true;
    emit('disco', true, discoT);
    ctx.audio()?.setDisco(true);
  }

  let discoActive = false;
  function stopDisco() {
    // On prévient l'interface même quand le compte à rebours vient d'expirer (discoT ≤ 0).
    if (discoActive) emit('disco', false, 0);
    discoActive = false;
    discoT = 0;
    ctx.audio()?.setDisco(false);
  }

  function showLyric(i: number, hold = false) {
    const line = config.lyrics[i];
    if (line) emit('lyric', line, hold);
  }

  function play(i: number) {
    levelIndex = clamp(i, 0, config.levels.length - 1);
    level = config.levels[levelIndex];
    phase = 'countdown';
    // Au tout premier départ, le « Go » tombe sur le temps 0 = départ de la musique.
    goBeat = Math.max(0, Math.ceil(clock.beat() + 3 + 0.05));
    lastCount = -1;
    target.x = level.lightStart.x;
    target.y = level.lightStart.y;
    gauge = 0;
    tier = 0;
    lastEmitted = -1;
    embraceT = 0;
    choreoStart = -1;
    playTime = 0;
    firstContact = false;
    beatsCounted = hits = combo = maxCombo = rushes = momentsWon = catches = 0;
    points = 0;
    // ~470 pts/s : bien plus que tout ce qu'on peut gagner en traînant (bonus, combo, disco).
    chrono = 12000 + 1500 * levelIndex;
    chronoRate = chrono / (level.fillSeconds * 1.1);
    overtime = 0;
    lostT = 0;
    lastChrono = -1;
    timeBonus = 0;
    spawnIn = 1.5;
    discoSpawned = false;
    clearItems();
    stopDisco();
    emit('points', 0);
    special?.s.destroy();
    special = null;
    specialDone = false;
    specialAt = 30 + Math.random() * 35;
    rushing = false;
    rushAmt = 0;
    emit('lyric', '', false);
    herRig.alpha = himRig.alpha = 1;
    couple.hideAll();
    moment = null;
    emit('moment', 'none', 'end');
    ctx.audio()?.resetLayers();
    emit('level', levelIndex);
    emit('gauge', 0);
    stepFrom.x = stepFrom.y = stepTo.x = stepTo.y = 0;
    stepT = 1;
    emit('hint', level.targetHelp === 'full' ? 'target' : 'search'); // clé traduite par l'interface
  }

  /** Lumière JS (approchée) pour éclairer les poussières. */
  function lightJS(px: number, py: number, L: Vec2): number {
    const qx = px - L.x;
    const qy = py - L.y;
    const v = qy - qx * u.uSlope;
    const hx = u.uPatchHalf[0];
    const hy = u.uPatchHalf[1];
    const ex = 1 - smooth(hx - 40, hx + 40, Math.abs(qx));
    const ey = smooth(-hy - 40, -hy + 40, v);
    const s = (((v / u.uPeriod) % 1) + 1) % 1;
    return ex * ey * (s < u.uOpen ? 1 : 0.12);
  }

  /**
   * Ombre « physique fake » : la main suit la lumière avec un gain propre à
   * chaque corps ; on en déduit étirement et cisaillement, pieds fixés au sol.
   */
  function place(fig: Figure, rig: Container, feetX: number, goal: Vec2, out: Vec2, extraShear: number, breath: number) {
    const { floorY } = layout;
    const sy = clamp((floorY - goal.y) / -fig.hand.y, 0.82, 1.55) * breath;
    const sx = 1 + (sy - 1) * 0.35;
    const c = clamp((goal.x - feetX - fig.hand.x * sx) / fig.hand.y, -0.45, 0.45) + extraShear;
    rig.setFromMatrix(new Matrix(sx, 0, c, sy, feetX, floorY));
    out.x = feetX + fig.hand.x * sx + c * fig.hand.y;
    out.y = floorY + fig.hand.y * sy;
    return sy;
  }

  function onBeat(b: number) {
    if (phase !== 'play' || !firstContact) return;
    beatsCounted++;
    const downbeat = ((b % bpb) + bpb) % bpb === 0;
    if (dist <= level.touchRadius * 1.3) {
      hits++;
      combo++;
      maxCombo = Math.max(maxCombo, combo);
      gauge = Math.min(100, gauge + (downbeat ? 1.5 : 0.6) * (1 + Math.min(combo, 16) / 32));
      ringT = 0;
      ringAt.x = (hands.her.x + hands.him.x) / 2;
      ringAt.y = (hands.her.y + hands.him.y) / 2;
      hitFlash = 1;
      addPoints((downbeat ? 25 : 10) * (1 + Math.floor(Math.min(combo, 16) / 8)));
      if (downbeat) ctx.audio()?.sfx('hit');
      emit('beat', { hit: true, combo, downbeat });
    } else if (combo > 0) {
      combo = 0;
      emit('beat', { hit: false, combo, downbeat });
    }
    if (!downbeat) return;
    const bar = Math.floor(b / bpb);
    if (level.step && bar > 0 && bar % level.step.bars === 0) {
      // Nouveau pas : on part de la position actuelle vers un autre point du mur.
      const cur = { x: lerp(stepFrom.x, stepTo.x, smooth(0, 1, stepT)), y: lerp(stepFrom.y, stepTo.y, smooth(0, 1, stepT)) };
      stepFrom.x = cur.x;
      stepFrom.y = cur.y;
      const rg = level.step.range;
      const bx = level.meetLight.x;
      const by = level.meetLight.y;
      // On impose un vrai déplacement (au moins la moitié de l'amplitude).
      let nx = 0;
      let ny = 0;
      for (let i = 0; i < 6; i++) {
        nx = clamp(bx + (Math.random() * 2 - 1) * rg, 0.15, 0.85) - bx;
        ny = clamp(by + (Math.random() * 2 - 1) * rg * 0.8, 0.15, 0.85) - by;
        if (Math.hypot(nx - cur.x, ny - cur.y) > rg * 0.5) break;
      }
      stepTo.x = nx;
      stepTo.y = ny;
      stepT = 0;
      stepFlash = 1;
    }
    if (moment && b >= moment.end) {
      const ok = moment.kind === 'golden' ? dist <= level.touchRadius * 1.3 : moment.ok && dist <= level.touchRadius * 2;
      if (ok) {
        gauge = Math.min(100, gauge + (moment.kind === 'golden' ? 6 : 7));
        ringT = 0;
        hitFlash = 1.6;
        ctx.audio()?.sfx('tier');
        momentsWon++;
        addPoints(moment.kind === 'golden' ? 250 : 300, ringAt);
      }
      emit('moment', moment.kind, ok ? 'success' : 'fail');
      moment = null;
    }
    if (!moment && bar % 4 === 1 && level.golden) {
      moment = { kind: 'golden', start: b, end: b + bpb, ok: true };
      emit('moment', 'golden', 'start');
    } else if (!moment && bar % 4 === 3 && level.breath) {
      moment = { kind: 'breath', start: b, end: b + bpb, ok: true };
      emit('moment', 'breath', 'start');
    }
  }

  /** Trop tard : la lumière s'éteint, les ombres s'écartent, le niveau est perdu. */
  function lose() {
    phase = 'lost';
    lostT = 0;
    stopDisco();
    for (const it of itemList) it.gone = Math.max(it.gone, 0.01);
    moment = null;
    emit('moment', 'none', 'end');
    emit('hint', '');
    shakeT = 1.6;
    ctx.audio()?.sfx('rush');
    try {
      navigator.vibrate?.([80, 60, 160]);
    } catch {
      /* pas de vibreur */
    }
    emit('lose', {
      level: levelIndex,
      levelName: level.name,
      time: playTime,
      hits,
      beats: beatsCounted,
      maxCombo,
      rushes,
      catches,
      timeBonus: 0,
      score: points,
    });
  }

  function finish(): LevelStats {
    // Bonus de fin (hors multiplicateur disco) : base + ce qui reste du chrono.
    timeBonus = Math.round(chrono);
    points += 1000 + timeBonus;
    emit('points', points);
    const score = points;
    return {
      level: levelIndex,
      levelName: level.name,
      time: playTime,
      hits,
      beats: beatsCounted,
      maxCombo,
      rushes,
      catches,
      timeBonus,
      score,
    };
  }

  function update(dt: number, time: number) {
    const W = world.w;
    clockT = time;
    const spanY = layout.yMax - layout.yMin;
    const beat = clock.beat();
    const bInt = Math.floor(beat);
    const pulse = beat >= 0 ? Math.exp(-(beat - bInt) * 5) : 0;
    if (bInt !== lastBeat) {
      if (bInt > lastBeat) onBeat(bInt);
      lastBeat = bInt;
    }

    // --- Doigt → cible de lumière (mode trackpad), puis lumière lissée (« slow hands »).
    const { dx, dy } = input.consume();
    const speed = input.speed();
    if (phase === 'play') {
      playTime += dt;
      chrono = Math.max(0, chrono - chronoRate * dt);
      if (chrono <= 0) overtime += dt;
      const limit = level.overtimeSeconds ?? 12;
      // Chrono positif = bonus restant ; négatif = secondes avant le « boom ».
      const shown = chrono > 0 ? Math.ceil(chrono / 10) * 10 : -Math.ceil(limit - overtime);
      if (shown !== lastChrono) {
        lastChrono = shown;
        emit('chrono', shown);
      }
      if (overtime >= limit) lose();
      target.x = clamp(target.x + (dx * world.cssToWorld) / (layout.xMax - layout.xMin), 0, 1);
      target.y = clamp(target.y + (dy * world.cssToWorld) / spanY, 0, 1);
      // Souris : tout l'écran sert de pavé — bord gauche de l'écran = limite gauche de la
      // lumière, bord droit = limite droite (idem en hauteur). Rien n'est hors d'atteinte.
      const mp = input.mouse();
      if (mp) {
        target.x = clamp((mp.x - 0.04) / 0.92, 0, 1);
        target.y = clamp((mp.y - 0.06) / 0.8, 0, 1);
      }
      // No rush : un doigt trop rapide fait vaciller la lumière et écarte les ombres.
      const rushSpeed = level.noRushSpeed ?? config.noRush.speed;
      const on = rushing ? speed > rushSpeed * 0.6 : speed > rushSpeed;
      if (on && !rushing) {
        rushes++;
        shakeT = 1;
        if (points > 0) {
          const loss = Math.min(points, 50);
          points -= loss;
          emit('points', points);
          popupAt(`-${loss}`, toWorld(light), 'cold');
        }
        ctx.audio()?.sfx('rush');
        try {
          navigator.vibrate?.(70);
        } catch {
          /* pas de vibreur */
        }
        emit('rush', true);
        if (combo > 0) {
          combo = 0;
          emit('beat', { hit: false, combo, downbeat: false });
        }
      } else if (!on && rushing) emit('rush', false);
      rushing = on;
    } else if (phase === 'attract') {
      target.x = 0.5 + 0.34 * Math.sin(time * 0.17);
      target.y = 0.45 + 0.3 * Math.sin(time * 0.23 + 1);
    } else if (phase === 'countdown') {
      // La lumière attend sur sa position de départ ; on ignore le doigt.
      target.x = level.lightStart.x;
      target.y = level.lightStart.y;
      const n = Math.max(0, Math.min(3, goBeat - Math.floor(beat)));
      if (n !== lastCount) {
        lastCount = n;
        emit('countdown', n);
        if (n > 0) ctx.audio()?.sfx('hit');
        else ctx.audio()?.sfx('tier');
      }
      if (beat >= goBeat) phase = 'play';
    } else if (phase === 'lost') {
      lostT += dt;
      if (rushing) emit('rush', false);
      rushing = false;
    } else {
      target.x = lerp(target.x, level.meetLight.x, damp(1.5, dt));
      target.y = lerp(target.y, level.meetLight.y, damp(1.5, dt));
      if (rushing) emit('rush', false);
      rushing = false;
    }
    rushAmt = clamp(rushAmt + (rushing ? 6 : -1.6) * dt, 0, 1);
    if (moment?.kind === 'breath' && phase === 'play' && speed > 140) {
      if (moment.ok) emit('moment', 'breath', 'moved');
      moment.ok = false;
    }
    breathEnv += ((moment?.kind === 'breath' ? 1 : 0) - breathEnv) * damp(3, dt);
    // Secousse de l'image pendant la précipitation.
    shakeT = Math.max(0, shakeT - dt * 2.5);
    const shake = (rushAmt * 0.6 + shakeT) * 7;
    root.position.set((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    const k = damp(phase === 'attract' ? 2 : 14, dt);
    light.x += (target.x - light.x) * k;
    light.y += (target.y - light.y) * k;

    // --- Niveau 3 : une deuxième source dérive seule et pousse les ombres.
    let effX = light.x;
    let effY = light.y;
    let L2: Vec2 | null = null;
    const sl = level.secondLight;
    if (sl && phase !== 'attract') {
      L2 = {
        x: sl.center.x + sl.amp.x * Math.sin(time * sl.speed * 2.1),
        y: sl.center.y + sl.amp.y * Math.sin(time * sl.speed * 2.9 + 0.7),
      };
      const wgt = phase === 'play' ? sl.weight : sl.weight * (1 - smooth(0, 1.6, embraceT));
      effX = lerp(light.x, L2.x, wgt);
      effY = lerp(light.y, L2.y, wgt);
    }

    // --- Le point de rencontre danse en rythme, de plus en plus ample à chaque palier.
    const amp = phase === 'play' ? [0.7, 0.95, 1.15, 1.35][tier] : 0;
    const per = bpb * level.sway.bars;
    // Le pas glisse sur un temps.
    if (phase === 'play') stepT = Math.min(1, stepT + dt / clock.beatLength);
    const st = phase === 'play' ? smooth(0, 1, stepT) : 0;
    const meet = {
      x: clamp(
        level.meetLight.x + lerp(stepFrom.x, stepTo.x, st) +
          level.sway.x * amp * (Math.sin((2 * Math.PI * beat) / per) + 0.35 * Math.sin((2 * Math.PI * beat) / (per * 0.37))),
        0.08,
        0.92,
      ),
      y: clamp(
        level.meetLight.y + lerp(stepFrom.y, stepTo.y, st) + level.sway.y * amp * Math.sin((Math.PI * beat) / per + 1.3),
        0.08,
        0.92,
      ),
    };

    // --- Mains visées.
    // Les danseurs vivent dans une « colonne » de 1080 centrée (le mur, lui, peut être plus large).
    const PW = 1080;
    const ox = (W - PW) / 2;
    const meetX = ox + (level.left.feetX + level.right.feetX) * 0.5 * PW;
    const meetY = layout.floorY - level.meetHeight;
    const ddx = effX - meet.x;
    const ddy = effY - meet.y;
    const sep = 150 * rushAmt + (phase === 'lost' ? Math.min(1, lostT) * 260 : 0);
    let feetL = ox + level.left.feetX * PW + level.left.slide * ddx * PW - sep * 0.5;
    let feetR = ox + level.right.feetX * PW + level.right.slide * ddx * PW + sep * 0.5;
    const goalL = { x: meetX + level.left.gainX * ddx * PW - sep, y: meetY + level.left.gainY * ddy * spanY };
    const goalR = { x: meetX + level.right.gainX * ddx * PW + sep, y: meetY + level.right.gainY * ddy * spanY };
    // Distance « idéale » entre les mains visées (avant les butées d'étirement/inclinaison) :
    // aux extrêmes, les ombres butent et leurs mains dessinées peuvent se croiser par accident.
    const goalDist = Math.hypot(goalL.x - goalR.x, goalL.y - goalR.y);

    if (phase === 'embrace' || phase === 'won') {
      embraceT += dt;
      // 1) Ils se rejoignent, mains tenues, ombres redressées (1,6 s).
      const e = smooth(0, 1.6, embraceT);
      feetL = lerp(feetL, meetX + HOLD_POSE.her, e);
      feetR = lerp(feetR, meetX + HOLD_POSE.him, e);
      goalL.x = lerp(goalL.x, feetL + her.hand.x, e);
      goalL.y = lerp(goalL.y, layout.floorY + her.hand.y, e);
      goalR.x = lerp(goalR.x, feetR + him.hand.x, e);
      goalR.y = lerp(goalR.y, layout.floorY + him.hand.y, e);
      // 2) Chorégraphie calée sur la mesure : passe, tour, rapprochement, étreinte, baiser.
      if (choreoStart < 0 && embraceT > 1.4) choreoStart = Math.ceil(beat / bpb) * bpb;
      const cb = choreoStart < 0 ? -1 : beat - choreoStart;
      const step = cb < 0 ? -1 : Math.floor(cb / 2);
      // Chorégraphie (voir CHOREO), puis on reste sur l'étreinte qui se balance doucement.
      const frame = step < 0 ? 2 : CHOREO[Math.min(step, CHOREO.length - 1)];
      const fade = smooth(1.2, 1.7, embraceT);
      herRig.alpha = himRig.alpha = 1 - fade;
      couple.show(frame, dt, fade < 1 ? 30 : 9);
      // Slow : balancement d'un côté puis de l'autre une fois enlacés.
      const settled = smooth(0, 4, cb - CHOREO.length * 2);
      const sway = Math.sin((Math.PI * beat) / bpb) * 0.045 * settled;
      couple.root.alpha = fade;
      couple.root.setFromMatrix(new Matrix(1, 0, sway, 1 + 0.008 * Math.sin(Math.PI * beat) * settled, meetX, layout.floorY));
      if (step >= CHOREO.length - 2 && phase === 'embrace') {
        phase = 'won';
        emit('win', finish());
      }
    }

    if (phase === 'attract') {
      herRig.alpha = himRig.alpha = 0;
      couple.root.alpha = 1;
      couple.show(ATTRACT_LOOP[Math.floor(Math.max(0, beat) / 2) % ATTRACT_LOOP.length], dt, 9);
      couple.root.setFromMatrix(new Matrix(1, 0, Math.sin((Math.PI * beat) / bpb) * 0.02, 1, meetX, layout.floorY));
    }

    const close = 1 - smooth(level.touchRadius, level.farRadius, dist);
    const danceShear = Math.sin((Math.PI * beat) / 2) * 0.018;
    const breath = 1 + 0.006 * Math.sin(time * 1.7);
    // Pose des mains : tendues, puis qui se frôlent, puis qui se tiennent (combo en cours).
    // Mains : tendues → frôlées → tenues ; en combo, ils dansent : mains tenues et bras
    // tendu (elle s'éloigne) en alternance, une mesure chacun.
    const danceAlt = Math.floor(beat / bpb) % 2 === 1 ? 3 : 2;
    const contact =
      phase === 'embrace' || phase === 'won'
        ? 2
        : phase !== 'play'
          ? 0
          : dist <= level.touchRadius
            ? combo >= 4
              ? danceAlt
              : 1
            : dist <= level.touchRadius * 2.2
              ? 1
              : 0;
    const pose = { time, beat, contact };
    her.update(pose, dt);
    him.update(pose, dt);
    const syL = place(her, herRig, feetL, goalL, hands.her, danceShear, breath);
    const syR = place(him, himRig, feetR, goalR, hands.him, -danceShear, breath);
    // Contact = mains dessinées proches ET mains visées proches (pas de faux contact en butée).
    dist = Math.hypot(hands.her.x - hands.him.x, hands.her.y - hands.him.y);
    if (phase === 'play' || phase === 'countdown') dist = Math.max(dist, goalDist);

    // --- Jauge « Closer » : contact, bonus de rythme, précipitation, paliers.
    if (phase === 'play') {
      const fill = 100 / level.fillSeconds;
      const floor = tier * 25;
      if (dist <= level.touchRadius) {
        gauge += fill * dt;
        if (!firstContact) emit('hint', '');
        firstContact = true;
      } else gauge += (fill * 0.45 * close ** 2 - 2.5 * (1 - close)) * dt;
      gauge -= config.noRush.drain * rushAmt * dt;
      gauge = clamp(gauge, floor, 100);
      if (forceFill) {
        gauge = 100;
        forceFill = false;
      }
      while (tier < 3 && gauge >= (tier + 1) * 25) {
        tier++;
        showLyric(tier - 1);
        ctx.audio()?.setProgress(tier * 25);
        ctx.audio()?.sfx('tier');
        emit('tier', tier);
      }
      if (gauge >= 100) {
        phase = 'embrace';
        stopDisco();
        for (const it of itemList) it.gone = Math.max(it.gone, 0.01);
        showLyric(3, true);
        ctx.audio()?.setProgress(100);
        ctx.audio()?.sfx('win');
        emit('tier', 4);
      }
    }
    if (phase !== 'attract') {
      const rounded = gauge >= 100 ? 100 : Math.floor(gauge * 2) / 2;
      if (rounded !== lastEmitted) {
        lastEmitted = rounded;
        emit('gauge', gauge);
      }
    }

    // --- Audio : les couches suivent la proximité des mains, en direct.
    const audio = ctx.audio();
    if (audio) {
      const c = phase === 'play' ? close * (1 - rushAmt * 0.7) : phase === 'attract' || phase === 'lost' || phase === 'countdown' ? 0 : 1;
      audio.setCloseness(c);
      open += ((phase === 'play' ? 0.55 + 0.45 * c : 1) - open) * damp(4, dt);
      audio.setOpenness(open);
    }

    // --- Uniformes du mur.
    const Lw = toWorld(light);
    u.uLight[0] = Lw.x;
    u.uLight[1] = Lw.y;
    const L2w = L2 ? toWorld(L2) : null;
    if (L2w) {
      u.uLight2[0] = L2w.x;
      u.uLight2[1] = L2w.y;
      u.uLight2[2] = 0.55;
    } else u.uLight2[2] = 0;
    warm += ((phase === 'attract' ? 0.15 : gauge / 100) - warm) * damp(1.5, dt);
    u.uWarm = warm;
    u.uSlope = -0.37 + (light.x - 0.5) * 0.2;
    u.uTime = time;
    const breathe = breathEnv * (0.5 + 0.5 * Math.sin(((beat % bpb) / bpb) * Math.PI * 2 - Math.PI / 2));
    u.uOpen = (phase === 'won' ? 0.66 : 0.54 + 0.025 * tier) + 0.04 * pulse - 0.22 * rushAmt + 0.12 * breathe;
    u.uRush = rushAmt;
    const flick = rushAmt * (0.35 + 0.35 * Math.sin(time * 47) * Math.sin(time * 31));
    u.uIntensity = (0.9 + 0.1 * pulse + 0.04 * Math.sin(time * 1.6)) * (1 - flick) * (phase === 'lost' ? Math.max(0.12, 1 - lostT * 1.5) : 1);
    u.uBlur = 8 + ((syL + syR) * 0.5 - 0.6) * 18 + rushAmt * 14;
    hitFlash = Math.max(0, hitFlash - dt * 3);
    const spark = phase === 'play' ? close * close * (0.7 + 0.3 * Math.sin(time * 6)) + hitFlash * 0.8 : 0;
    u.uSpark[0] = (hands.her.x + hands.him.x) / 2;
    u.uSpark[1] = (hands.her.y + hands.him.y) / 2;
    u.uSpark[2] = spark;
    ringT = Math.min(1, ringT + dt * 1.4);
    u.uRing[0] = ringAt.x;
    u.uRing[1] = ringAt.y;
    u.uRing[2] = 20 + ringT * 280;
    u.uRing[3] = (1 - ringT) * (1 - ringT);

    // --- Mode disco : compte à rebours, fondu du shader, boule à facettes.
    if (discoT > 0) {
      discoT -= dt;
      if (discoT <= 0) stopDisco();
    }
    discoAmt += ((discoT > 0 ? 1 : 0) - discoAmt) * damp(5, dt);
    u.uDisco = discoAmt;
    u.uPulse = pulse;
    ball.clear();
    if (discoAmt > 0.01) {
      const bx = W * 0.8;
      const by = layout.yMin * 1.15;
      const r = 70 + 4 * pulse;
      ball.moveTo(bx, 0).lineTo(bx, by - r).stroke({ width: 3, color: 0xcfd6e6, alpha: 0.7 * discoAmt });
      ball.circle(bx, by, r * 1.9).fill({ color: 0xff3fa4, alpha: 0.08 * discoAmt });
      ball.circle(bx, by, r).fill({ color: 0x8d97ad, alpha: discoAmt });
      for (let yy = -r + 6; yy < r; yy += 13)
        for (let xx = -r + 6; xx < r; xx += 13) {
          if (xx * xx + yy * yy > (r - 5) * (r - 5)) continue;
          // Les facettes défilent : la boule tourne.
          const tw = 0.5 + 0.5 * Math.sin(time * 6 + xx * 0.31 + yy * 0.17 + Math.floor((xx + time * 40) / 13));
          ball.rect(bx + xx - 5, by + yy - 5, 10, 10).fill({ color: tw > 0.8 ? 0xffffff : 0xb9c4dd, alpha: (0.55 + 0.45 * tw) * discoAmt });
        }
    }

    // --- Bonus qui tombent : on les attrape avec la lumière (le halo autour d'elle).
    if (phase === 'play') {
      spawnIn -= dt;
      if (!discoSpawned && gauge >= 30) {
        spawnItem('disco');
        spawnIn = 2;
      } else if (spawnIn <= 0) {
        spawnItem();
        spawnIn = discoT > 0 ? 0.5 + Math.random() * 0.4 : 1.2 + Math.random() * 1.1;
      }
    }
    const catchR = 105;
    itemList = itemList.filter((it) => {
      it.t += dt;
      if (it.gone > 0) {
        it.gone += dt * 3;
        it.s.alpha = Math.max(0, 1 - it.gone);
        it.s.scale.set(1 + it.gone * 0.6);
        if (it.gone >= 1) {
          it.s.destroy();
          return false;
        }
        return true;
      }
      it.y += it.vy * dt;
      it.x = it.x0 + Math.sin(it.t * 1.4 + it.ph) * 30;
      it.s.position.set(it.x, it.y);
      it.s.rotation = it.kind === 'vinyl' ? it.t * 4 : it.kind === 'disco' ? Math.sin(it.t * 2) * 0.2 : Math.sin(it.t * 3 + it.ph) * 0.15;
      it.s.scale.set(1 + 0.08 * pulse);
      if (phase === 'play' && Math.hypot(it.x - Lw.x, it.y - Lw.y) < catchR) {
        catches++;
        addPoints(PICKUPS[it.kind].points, { x: it.x, y: it.y });
        ringAt.x = it.x;
        ringAt.y = it.y;
        ringT = 0;
        ctx.audio()?.sfx('hit');
        if (it.kind === 'disco') startDisco();
        it.gone = 0.01;
        return true;
      }
      if (it.y > layout.floorY - 20) it.gone = 0.01; // raté : s'éteint au sol
      return true;
    });

    // --- Bonus spécial : file dans tous les sens, fuit la lumière, s'enfuit au bout de 9 s.
    const sp = level.special;
    if (sp && phase === 'play' && !specialDone && gauge >= specialAt) {
      specialDone = true;
      let tex = specialTex.get(sp.id);
      if (!tex) {
        tex = makeSpecialTexture(app.renderer, sp.kind as SpecialKind);
        specialTex.set(sp.id, tex);
      }
      const s2 = new Sprite(tex);
      s2.anchor.set(0.5);
      // Les logos font 256 px : on les ramène à ~220 unités monde.
      const baseScale = sp.image ? 220 / Math.max(tex.width, tex.height) : 1;
      (s2 as Sprite & { baseScale?: number }).baseScale = baseScale;
      items.addChild(s2);
      // Il entre du côté opposé à la lumière.
      const fromLeft = toWorld(light).x > (layout.xMin + layout.xMax) / 2;
      special = {
        s: s2,
        x: fromLeft ? layout.xMin - 160 : layout.xMax + 160,
        y: lerp(layout.yMin, layout.floorY - 200, Math.random()),
        vx: fromLeft ? 480 : -480,
        vy: (Math.random() - 0.5) * 300,
        t: 0,
        turnIn: 0.6,
        pause: 0,
        gone: 0,
        leaving: false,
        trail: [],
        blinks: 2,
      };
      ctx.audio()?.sfx('tier');
      emit('special', 'spawn', sp.id);
    }
    if (special && sp) {
      const S = special;
      S.t += dt;
      if (S.gone > 0) {
        S.gone += dt * 2.5;
        S.s.alpha = Math.max(0, 1 - S.gone);
        S.s.scale.set(((S.s as Sprite & { baseScale?: number }).baseScale ?? 1) * (1 + S.gone * 1.2));
        if (S.gone >= 1) {
          S.s.destroy();
          special = null;
        }
      } else {
        if (!S.leaving && (S.t > 9 || phase !== 'play')) {
          S.leaving = true;
          S.vx *= 0.3;
          S.vy = -900;
          if (phase === 'play') emit('special', 'escaped', sp.id);
        }
        if (!S.leaving) {
          const minY = layout.yMin * 0.7;
          const maxY = layout.floorY - 90;
          // Zone que la lumière peut atteindre (le bonus ne doit jamais être hors de portée).
          const zL = layout.xMin - 40;
          const zR = layout.xMax + 40;
          // Direction de fuite qui ne fonce pas dans un mur : près d'un bord, on glisse le long.
          const fleeDir = () => {
            let ax = S.x - Lw.x;
            let ay = S.y - Lw.y;
            const n = Math.hypot(ax, ay) || 1;
            ax /= n;
            ay /= n;
            if ((S.x < zL + 120 && ax < 0) || (S.x > zR - 120 && ax > 0)) {
              ax *= -0.25;
              ay = (ay >= 0 ? 1 : -1) * (S.y > maxY - 150 ? -1 : S.y < minY + 150 ? 1 : 1);
            }
            if ((S.y < minY + 150 && ay < 0) || (S.y > maxY - 150 && ay > 0)) {
              ay *= -0.25;
              ax = ax >= 0 ? (S.x > zR - 120 ? -1 : 1) : S.x < zL + 120 ? 1 : -1;
            }
            const m = Math.hypot(ax, ay) || 1;
            return { x: ax / m, y: ay / m };
          };
          const fx = S.x - Lw.x;
          const fy = S.y - Lw.y;
          const fd = Math.hypot(fx, fy);
          // Changements de cap brusques, petites pauses pour narguer (jamais si la lumière est proche).
          S.turnIn -= dt;
          if (S.pause > 0) S.pause -= dt;
          if (S.turnIn <= 0) {
            if (Math.random() < 0.18 && fd > 420) {
              S.pause = 0.45;
              S.vx = S.vy = 0;
            } else {
              // Nouveau cap : plutôt à l'opposé de la lumière (± 100°), pour la faire courir.
              const fdir = fleeDir();
              const a = Math.atan2(fdir.y, fdir.x) + (Math.random() - 0.5) * 3.4;
              const v = 420 + Math.random() * 320;
              S.vx = Math.cos(a) * v;
              S.vy = Math.sin(a) * v;
            }
            S.turnIn = 0.35 + Math.random() * 0.45;
          }
          // Il fuit la lumière quand elle approche.
          if (fd < 460 && fd > 1) {
            S.pause = 0;
            const f = fleeDir();
            S.vx += f.x * 3200 * dt;
            S.vy += f.y * 3200 * dt;
          }
          // Acculé contre un bord ? Il se téléporte loin de la lumière (2 fois max).
          const cornered = S.x < zL + 150 || S.x > zR - 150 || S.y < minY + 160 || S.y > maxY - 160;
          if (fd < 210 && cornered && S.blinks > 0) {
            S.blinks--;
            ringAt.x = S.x;
            ringAt.y = S.y;
            ringT = 0;
            let nx = S.x;
            let ny = S.y;
            for (let k = 0; k < 12; k++) {
              nx = lerp(zL + 180, zR - 180, Math.random());
              ny = lerp(minY + 180, maxY - 180, Math.random());
              if (Math.hypot(nx - Lw.x, ny - Lw.y) > 520) break;
            }
            S.x = nx;
            S.y = ny;
            S.trail = [];
            ctx.audio()?.sfx('hit');
            popupAt('poof', { x: nx, y: ny - 80 }, 'gold');
          }
          // Sprint d'esquive quand la lumière est tout près.
          if (fd < 220 && fd > 1 && S.turnIn > 0.15) {
            const f = fleeDir();
            const a = Math.atan2(f.y, f.x) + (Math.random() - 0.5) * 1.2;
            S.vx = Math.cos(a) * 1450;
            S.vy = Math.sin(a) * 1450;
            S.turnIn = 0.12;
          }
          const vmax = fd < 260 ? 1450 : 900;
          const v = Math.hypot(S.vx, S.vy);
          if (v > vmax) {
            S.vx *= vmax / v;
            S.vy *= vmax / v;
          }
          // Rebonds sur les bords du mur.
          if ((S.x < zL && S.vx < 0) || (S.x > zR && S.vx > 0)) S.vx *= -1;
          if ((S.y < minY && S.vy < 0) || (S.y > maxY && S.vy > 0)) S.vy *= -1;
        }
        S.x += S.vx * dt;
        S.y += S.vy * dt;
        S.trail.unshift({ x: S.x, y: S.y });
        if (S.trail.length > 7) S.trail.pop();
        S.s.position.set(S.x, S.y);
        S.s.rotation = Math.sin(S.t * 9) * 0.18 + S.vx * 0.0003;
        const bs = (S.s as Sprite & { baseScale?: number }).baseScale ?? 1;
        S.s.scale.set(bs * (1 + 0.1 * pulse), bs * (1 + 0.1 * pulse));
        if (phase === 'play' && !S.leaving && Math.hypot(S.x - Lw.x, S.y - Lw.y) < catchR * 0.75) {
          catches++;
          addPoints(sp.points, { x: S.x, y: S.y });
          ringAt.x = S.x;
          ringAt.y = S.y;
          ringT = 0;
          hitFlash = 2;
          ctx.audio()?.sfx('win');
          emit('special', 'caught', sp.id);
          S.gone = 0.01;
        } else if (S.leaving && S.y < -160) {
          S.s.destroy();
          special = null;
        }
      }
    }

    // --- Poussières
    for (const m of moteList) {
      m.x += (m.vx + Math.sin(time * 0.3 + m.ph) * 6) * dt;
      m.y += m.vy * dt;
      if (m.y < 0 || m.x < -20 || m.x > W + 20) {
        m.y = layout.floorY - 10;
        m.x = Math.random() * W;
      }
      let lit = lightJS(m.x, m.y, Lw);
      if (L2w) lit = Math.max(lit, lightJS(m.x, m.y, L2w) * 0.55);
      const tw = 0.6 + 0.4 * Math.sin(time * 2 + m.ph * 3);
      m.s.position.set(m.x, m.y);
      m.s.scale.set(m.size * (1 + pulse * 0.3));
      m.s.alpha = (0.04 + lit * 0.75) * tw * (1 - flick * 0.6) + (phase === 'won' ? 0.08 : 0);
    }

    guide.clear();
    if (special && special.gone <= 0) {
      special.trail.forEach((p, i) => {
        guide.circle(p.x, p.y, 34 - i * 4).fill({ color: 0xffd06b, alpha: 0.16 - i * 0.02 });
      });
    }
    if (phase === 'play') {
      // Le cercle doré : là où il faut amener la lumière pour que les mains se touchent.
      let tx = meet.x;
      let ty = meet.y;
      if (sl && L2) {
        tx = (meet.x - sl.weight * L2.x) / (1 - sl.weight);
        ty = (meet.y - sl.weight * L2.y) / (1 - sl.weight);
      }
      targetN.x = clamp(tx, 0, 1);
      targetN.y = clamp(ty, 0, 1);
      const Tw = toWorld(targetN);
      const help = level.targetHelp ?? 'near';
      const vis = help === 'full' && !firstContact ? 1 : help === 'none' ? 0 : smooth(0.5, 0.85, close) * 0.8;
      const onTarget = smooth(0.6, 0.95, close);
      guide.circle(Tw.x, Tw.y, 58).fill({ color: 0xffc35a, alpha: (0.07 + 0.25 * onTarget) * vis });
      guide.circle(Tw.x, Tw.y, 58 + 6 * pulse).stroke({ width: 4, color: 0xffd06b, alpha: (0.45 + 0.35 * pulse) * vis });
      // Nouveau pas : bref éclair doré à la nouvelle position, même sans aide.
      stepFlash = Math.max(0, stepFlash - dt * 1.1);
      if (stepFlash > 0) {
        const r = 58 + (1 - stepFlash) * 60;
        guide.circle(Tw.x, Tw.y, r).stroke({ width: 5, color: 0xffd06b, alpha: stepFlash * 0.85 });
        guide.circle(Tw.x, Tw.y, 58).fill({ color: 0xffc35a, alpha: stepFlash * 0.18 });
      }
      if (!firstContact && help === 'full') {
        // Pointillés de la lumière vers le cercle.
        const ddx2 = Tw.x - Lw.x;
        const ddy2 = Tw.y - Lw.y;
        const len = Math.hypot(ddx2, ddy2);
        const n = Math.floor(len / 46);
        const phaseOff = (time * 2) % 1;
        for (let i = 1; i < n; i++) {
          const f = (i + phaseOff) / n;
          guide.circle(Lw.x + ddx2 * f, Lw.y + ddy2 * f, 5).fill({ color: 0xffd06b, alpha: 0.55 });
        }
      }
      // La « lampe » : le halo qui attrape les bonus.
      guide.circle(Lw.x, Lw.y, catchR).fill({ color: 0xffb24a, alpha: 0.05 + 0.03 * pulse });
      guide.circle(Lw.x, Lw.y, catchR).stroke({ width: 2, color: 0xffd9a8, alpha: 0.22 });
      const g = close ** 1.5;
      const col = g < 0.6 ? mixColor(0x5f9bff, 0xff9a3c, g / 0.6) : mixColor(0xff9a3c, 0xfff0d0, (g - 0.6) / 0.4);
      const beatGlow = 0.85 + 0.15 * pulse;
      guide
        .moveTo(hands.her.x, hands.her.y)
        .lineTo(hands.him.x, hands.him.y)
        .stroke({ width: 2 + 4 * g, color: col, alpha: (0.18 + 0.5 * g) * beatGlow });
      for (const h of [hands.her, hands.him]) {
        guide.circle(h.x, h.y, 22 + 10 * g).fill({ color: col, alpha: 0.1 + 0.12 * g });
        guide.circle(h.x, h.y, 8).fill({ color: col, alpha: 0.6 * beatGlow });
      }
      const mx = (hands.her.x + hands.him.x) / 2;
      const my = (hands.her.y + hands.him.y) / 2;
      if (moment?.kind === 'golden') {
        // Anneau doré qui se resserre jusqu'au premier temps suivant, + 4 repères de temps.
        const left = clamp((moment.end - beat) / bpb, 0, 1);
        const r = 26 + 190 * left;
        guide.circle(mx, my, r).stroke({ width: 5, color: 0xffc35a, alpha: 0.35 + 0.5 * (1 - left) });
        for (let i = 0; i < bpb; i++) {
          const a = -Math.PI / 2 + (i / bpb) * Math.PI * 2;
          const done = beat - moment.start >= i + 1;
          guide.circle(mx + Math.cos(a) * r, my + Math.sin(a) * r, done ? 9 : 6).fill({ color: 0xffd98a, alpha: done ? 0.95 : 0.4 });
        }
      } else if (moment?.kind === 'breath') {
        // Halo qui inspire / expire sur la mesure ; il devient terne si on bouge.
        const br = 0.5 + 0.5 * Math.sin(((beat - moment.start) / bpb) * Math.PI * 2 - Math.PI / 2);
        const c2 = moment.ok ? 0xffe2b0 : 0x6f8fc0;
        guide.circle(mx, my, 60 + 120 * br).fill({ color: c2, alpha: 0.06 + 0.06 * br });
        guide.circle(mx, my, 60 + 120 * br).stroke({ width: 3, color: c2, alpha: 0.35 });
      }
    }

    app.renderer.render({ container: maskRoot, target: maskRT, clear: true, clearColor: [0, 0, 0, 0] });

    if (dbg) {
      const T = toWorld(meet);
      dbg.clear();
      dbg.circle(T.x, T.y, 22).stroke({ width: 3, color: 0x00ff99 });
      dbg.circle(Lw.x, Lw.y, 10).fill(0xffffff);
      dbg.circle(hands.her.x, hands.her.y, 8).fill(0xff3366);
      dbg.circle(hands.him.x, hands.him.y, 8).fill(0x33ccff);
      dbg.moveTo(hands.her.x, hands.her.y).lineTo(hands.him.x, hands.him.y).stroke({ width: 2, color: 0xffffff, alpha: 0.6 });
    }
  }

  // Debug : « W » remplit la jauge (tester la fin sans jouer).
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'w' && phase === 'play') forceFill = true;
    if (e.key === 'd' && phase === 'play') startDisco(); // debug : mode disco
    if (e.key === 's' && phase === 'play') specialAt = 0; // debug : bonus spécial
  };
  if (debug) window.addEventListener('keydown', onKey);


  relayout(world);

  return {
    resize: relayout,
    update,
    start: () => play(0),
    state: () => ({
      phase, level: levelIndex, gauge: Math.round(gauge), tier, dist: Math.round(dist), combo,
      light: { x: +light.x.toFixed(2), y: +light.y.toFixed(2) }, moment: moment && { ...moment }, rushAmt,
      points, catches, discoT: +discoT.toFixed(1), target: { ...targetN },
      special: special && special.gone <= 0 ? { x: Math.round(special.x), y: Math.round(special.y) } : null,
      lightW: toWorld(light), items: itemList.filter((i) => !i.gone).map((i) => ({ kind: i.kind, x: Math.round(i.x), y: Math.round(i.y) })),
    }),
    play,
    destroy() {
      window.removeEventListener('keydown', onKey);
      wall.destroy();
      maskRoot.destroy({ children: true });
      maskRT.destroy(true);
      moteTex.destroy(true);
      clearItems();
      for (const t of Object.values(pickTex)) t.destroy(true);
      // Seules les textures dessinées par le jeu sont à nous ; celles d'Assets sont en cache partagé.
      for (const [id, t] of specialTex) if (!config.levels.some((l) => l.special?.id === id && l.special.image)) t.destroy(true);
    },
  };
};
