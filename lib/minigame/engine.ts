import { Application, Container } from 'pixi.js';
import { createGameAudio, prefetchAudio, type GameAudio } from './audio';
import { createBeatClock, type BeatClock } from './beatClock';
import { createDragInput, type DragInput } from './input';
import type { GameConfig, LevelStats } from './types';

/** Le monde fait toujours 1080 unités de large ; sa hauteur suit l'écran. */
export const WORLD_WIDTH = 1080;

export type World = { w: number; h: number; /** px CSS → unités monde */ cssToWorld: number };

export type GameEvents = {
  gauge: (value: number) => void;
  tier: (tier: number) => void;
  beat: (info: { hit: boolean; combo: number; downbeat: boolean }) => void;
  rush: (rushing: boolean) => void;
  level: (index: number) => void;
  /** Moments de jeu : anneau doré / respiration. */
  moment: (kind: 'golden' | 'breath' | 'none', state: 'start' | 'success' | 'fail' | 'moved' | 'end') => void;
  /** Consigne d'aide : clé traduite par l'interface (`target`, `search`), vide = la masquer. */
  hint: (key: string) => void;
  /** Bonus chrono restant (fond pendant la partie). */
  chrono: (value: number) => void;
  /** Score en direct. */
  points: (total: number) => void;
  /** Petit texte flottant (« +150 », ou la clé `poof`) à une position normalisée de l'écran (0..1). */
  popup: (text: string, x: number, y: number, kind: 'gold' | 'disco' | 'cold') => void;
  /** Mode disco : actif ou non, durée en secondes. */
  disco: (on: boolean, seconds: number) => void;
  /** Ligne de paroles à afficher (`hold` = reste affichée). */
  lyric: (text: string, hold: boolean) => void;
  /** Bonus spécial du niveau : apparu, attrapé ou enfui. */
  special: (state: 'spawn' | 'caught' | 'escaped', id: string) => void;
  /** Décompte avant la partie : 3, 2, 1, puis 0 = « Go ». */
  countdown: (n: number) => void;
  win: (stats: LevelStats) => void;
  /** Temps écoulé : niveau perdu. */
  lose: (stats: LevelStats) => void;
};

export type SceneContext = {
  app: Application;
  root: Container;
  world: World;
  input: DragInput;
  clock: BeatClock;
  /** Null tant que le joueur n'a pas tapé « Play ». */
  audio: () => GameAudio | null;
  config: GameConfig;
  debug: boolean;
  fonts: { display: string };
  emit<K extends keyof GameEvents>(event: K, ...args: Parameters<GameEvents[K]>): void;
};

/** Une « scène » = la mécanique propre à un titre, branchée sur le cœur. */
export type Scene = {
  resize(world: World): void;
  update(dt: number, time: number): void;
  /** Passe du mode vitrine (avant le tap) au jeu. */
  start(): void;
  /** (Re)lance un niveau. */
  play(level: number): void;
  /** État lisible pour le debug. */
  state?(): object;
  destroy(): void;
};

export type SceneFactory = (ctx: SceneContext) => Scene | Promise<Scene>;

export type Engine = {
  /** Application Pixi (debug : faire avancer la boucle à la main). */
  app: Application;
  /** Appelé depuis le tap « Play » avec un AudioContext déjà créé dans le geste. */
  start(ctx: AudioContext): Promise<void>;
  play(level: number): void;
  clock: BeatClock;
  state(): object;
  /** Null avant le tap « Play ». */
  audio(): GameAudio | null;
  /** Image du jeu à l'instant T (carte de partage). */
  snapshot(): HTMLCanvasElement;
  destroy(): void;
};

export async function createEngine(
  host: HTMLElement,
  config: GameConfig,
  factory: SceneFactory,
  opts: { debug?: boolean; fonts: { display: string }; on?: Partial<GameEvents> },
): Promise<Engine> {
  prefetchAudio(config.audio);
  const app = new Application();
  const maxRes = Math.min(window.devicePixelRatio || 1, 1.5);
  await app.init({
    resizeTo: host,
    preference: 'webgl',
    antialias: false,
    backgroundColor: 0x001c35,
    resolution: maxRes,
    autoDensity: true,
    powerPreference: 'high-performance',
  });
  host.appendChild(app.canvas);
  app.canvas.style.display = 'block';
  app.canvas.style.touchAction = 'none';

  const root = new Container();
  app.stage.addChild(root);

  const world: World = { w: WORLD_WIDTH, h: (WORLD_WIDTH * 16) / 9, cssToWorld: 1 };
  // Téléphone (portrait) : on cale la largeur sur 1080. Écran large (ordinateur) :
  // on cale la hauteur sur 1920 et le monde s'élargit — le mur prend tout l'écran.
  const measure = () => {
    const s = Math.min(app.screen.width / WORLD_WIDTH, app.screen.height / 1920);
    world.w = app.screen.width / s;
    world.h = app.screen.height / s;
    world.cssToWorld = 1 / s;
    root.scale.set(s);
  };
  measure();

  const clock = createBeatClock({
    bpm: config.audio.bpm,
    offset: config.audio.firstBeatOffset,
    beatsPerBar: config.audio.beatsPerBar,
  });
  let audio: GameAudio | null = null;
  const input = createDragInput(app.canvas);
  const ctx: SceneContext = {
    app,
    root,
    world,
    input,
    clock,
    audio: () => audio,
    config,
    debug: !!opts.debug,
    fonts: opts.fonts,
    emit: (event, ...args) => {
      const fn = opts.on?.[event] as ((...a: unknown[]) => void) | undefined;
      fn?.(...args);
    },
  };
  const scene = await factory(ctx);
  scene.resize(world);

  app.renderer.on('resize', () => {
    measure();
    scene.resize(world);
  });

  // Qualité adaptative : si on tient mal 60 fps, on baisse la résolution.
  let time = 0;
  let slowFor = 0;
  let res = maxRes;
  app.ticker.add((ticker) => {
    const raw = ticker.deltaMS / 1000;
    const dt = Math.min(raw, 1 / 20);
    time += dt;
    scene.update(dt, time);
    slowFor = raw > 1 / 48 ? slowFor + raw : Math.max(0, slowFor - raw * 0.5);
    if (slowFor > 1.5 && res > 0.75) {
      res = Math.max(0.75, res - 0.25);
      app.renderer.resize(app.screen.width, app.screen.height, res);
      slowFor = 0;
    }
  });

  const onVisibility = () => {
    if (document.hidden) {
      app.ticker.stop();
      audio?.suspend();
    } else {
      app.ticker.start();
      audio?.resume();
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  return {
    app,
    clock,
    async start(actx) {
      // La musique part sur le « Go » du décompte (3 temps plus tard).
      audio = await createGameAudio(actx, config.audio, clock, 3);
      scene.start();
    },
    play: (level) => scene.play(level),
    state: () => scene.state?.() ?? {},
    audio: () => audio,
    snapshot: () => app.renderer.extract.canvas({ target: app.stage }) as HTMLCanvasElement,
    destroy() {
      document.removeEventListener('visibilitychange', onVisibility);
      input.destroy();
      audio?.destroy();
      scene.destroy();
      app.destroy(true, { children: true, texture: true });
    },
  };
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
