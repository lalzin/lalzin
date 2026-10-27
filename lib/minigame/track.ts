/**
 * Analytics minimales, branchables plus tard (Plausible, GA, Supabase…).
 * Pour l'instant : événement DOM `minigame:track` + console en debug.
 */
export type TrackEvent = 'start' | 'tier' | 'win' | 'easter_egg' | 'share' | 'streaming_click' | 'level';

export function track(event: TrackEvent, props: Record<string, string | number> = {}) {
  try {
    window.dispatchEvent(new CustomEvent('minigame:track', { detail: { event, ...props } }));
    const w = window as unknown as { plausible?: (e: string, o: { props: object }) => void };
    w.plausible?.(`minigame_${event}`, { props });
    if (new URLSearchParams(location.search).has('debug')) console.info('[track]', event, props);
  } catch {
    /* jamais bloquant */
  }
}
