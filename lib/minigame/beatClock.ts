/**
 * Horloge musicale. La source de temps est branchable : `performance` avant le
 * premier tap (visuels seulement), puis `audioContext.currentTime` — jamais
 * requestAnimationFrame, pour rester calé sur ce qu'on entend.
 */
export type BeatClock = {
  bpm: number;
  offset: number;
  beatsPerBar: number;
  /** Secondes par temps. */
  readonly beatLength: number;
  /** Change la source de temps et fixe l'instant (dans cette source) du temps 0. */
  attach(now: () => number, startAt: number): void;
  /** Temps courant de la source. */
  now(): number;
  /** Instant (source) où la lecture a commencé. */
  startAt(): number;
  /** Temps écoulés (flottant) depuis le premier temps fort. */
  beat(): number;
  bar(): number;
  beatInBar(): number;
  /** Instant (source) du début de la prochaine mesure. */
  nextBarTime(): number;
};

export function createBeatClock(opts: { bpm: number; offset: number; beatsPerBar: number }): BeatClock {
  let source = () => performance.now() / 1000;
  let start = source();
  const clock: BeatClock = {
    bpm: opts.bpm,
    offset: opts.offset,
    beatsPerBar: opts.beatsPerBar,
    get beatLength() {
      return 60 / clock.bpm;
    },
    attach(now, startAt) {
      source = now;
      start = startAt;
    },
    now: () => source(),
    startAt: () => start,
    beat: () => (source() - start - clock.offset) / clock.beatLength,
    bar: () => Math.floor(clock.beat() / clock.beatsPerBar),
    beatInBar() {
      const b = Math.floor(clock.beat());
      return ((b % clock.beatsPerBar) + clock.beatsPerBar) % clock.beatsPerBar;
    },
    nextBarTime() {
      const barLen = clock.beatLength * clock.beatsPerBar;
      const t = source() - start - clock.offset;
      return start + clock.offset + Math.ceil(t / barLen + 1e-4) * barLen;
    },
  };
  return clock;
}
