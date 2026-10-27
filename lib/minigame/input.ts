/**
 * Contrôle de la lumière, trois façons, même sortie (deltas en px CSS) :
 *  - doigt : glisser, en mode « trackpad » (pas de saut quand on repose le doigt) ;
 *  - souris : position ABSOLUE, la lumière va sous le curseur (pas besoin de cliquer) ;
 *  - clavier : flèches, à vitesse lente constante.
 * Mesure aussi une vitesse lissée (px CSS/s) pour la règle « no rush ».
 */
export type DragInput = {
  /** Deltas accumulés depuis le dernier `consume()`, en px CSS. */
  consume(): { dx: number; dy: number };
  /** Vitesse lissée (px CSS / s), 0 quand rien ne bouge. */
  speed(): number;
  /** Position de la souris (0..1 dans le canvas) si elle a bougé depuis le dernier appel, sinon null. */
  mouse(): { x: number; y: number } | null;
  destroy(): void;
};

const KEY_SPEED = 260; // px CSS / s : volontairement sous le seuil « no rush »

export function createDragInput(el: HTMLElement): DragInput {
  let pointerId: number | null = null;
  let hover = false;
  let lastX = 0;
  let lastY = 0;
  let lastT = 0;
  let accX = 0;
  let accY = 0;
  let vel = 0;
  const keys = new Set<string>();
  let lastConsume = performance.now();
  let mousePos: { x: number; y: number } | null = null;

  // La souris va naturellement plus vite qu'un doigt : on tempère sa vitesse « no rush ».
  const feed = (dx: number, dy: number, t: number, mouse: boolean) => {
    const dt = Math.max(1, t - lastT) / 1000;
    // La souris est en position absolue : seuls le doigt (et le clavier) poussent des deltas.
    if (!mouse) {
      accX += dx;
      accY += dy;
    }
    // Sur grand écran la souris parcourt beaucoup plus de pixels : on ramène sa vitesse
    // à l'échelle d'un téléphone (~400 px de large) pour la règle « no rush ».
    const scale = mouse ? 0.7 * Math.min(1, 420 / Math.max(420, el.clientWidth)) : 1;
    const inst = (Math.hypot(dx, dy) / dt) * scale;
    vel += (inst - vel) * Math.min(1, dt * 12);
    lastT = t;
  };

  const down = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') return; // la souris est gérée au survol
    if (pointerId !== null) return;
    pointerId = e.pointerId;
    lastX = e.clientX;
    lastY = e.clientY;
    lastT = e.timeStamp;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* pointeur synthétique ou déjà relâché */
    }
  };
  const move = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') {
      const r = el.getBoundingClientRect();
      mousePos = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
      if (!hover) {
        hover = true;
        lastX = e.clientX;
        lastY = e.clientY;
        lastT = e.timeStamp;
        return;
      }
    } else if (e.pointerId !== pointerId) return;
    feed(e.clientX - lastX, e.clientY - lastY, e.timeStamp, e.pointerType === 'mouse');
    lastX = e.clientX;
    lastY = e.clientY;
  };
  const up = (e: PointerEvent) => {
    if (e.pointerId === pointerId) pointerId = null;
  };
  const leave = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') hover = false;
  };
  // iOS : bloque scroll / zoom / rebond pendant la partie.
  const block = (e: TouchEvent) => e.preventDefault();
  const ARROWS: Record<string, true> = { ArrowLeft: true, ArrowRight: true, ArrowUp: true, ArrowDown: true };
  const kd = (e: KeyboardEvent) => {
    if (!ARROWS[e.key]) return;
    e.preventDefault();
    keys.add(e.key);
  };
  const ku = (e: KeyboardEvent) => keys.delete(e.key);
  const blur = () => keys.clear();

  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('pointerleave', leave);
  el.addEventListener('touchmove', block, { passive: false });
  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  window.addEventListener('blur', blur);

  let lastSpeedT = performance.now();
  return {
    consume() {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastConsume) / 1000);
      lastConsume = now;
      if (keys.size) {
        const kx = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0);
        const ky = (keys.has('ArrowDown') ? 1 : 0) - (keys.has('ArrowUp') ? 1 : 0);
        accX += kx * KEY_SPEED * dt;
        accY += ky * KEY_SPEED * dt;
      }
      const out = { dx: accX, dy: accY };
      accX = 0;
      accY = 0;
      return out;
    },
    mouse() {
      const p = mousePos;
      mousePos = null;
      return p;
    },
    speed() {
      // Décroissance quand aucun événement n'arrive (doigt/souris immobile).
      const now = performance.now();
      const dt = (now - lastSpeedT) / 1000;
      lastSpeedT = now;
      if (now - lastT > 60) vel *= Math.exp(-dt * 10);
      return vel;
    },
    destroy() {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('touchmove', block);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('blur', blur);
    },
  };
}
