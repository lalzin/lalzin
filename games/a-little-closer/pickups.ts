import { Graphics, type Renderer, type Texture } from 'pixi.js';

/**
 * Bonus qui tombent du haut du mur. On les attrape avec la lumière : c'est un
 * pari, car déplacer la lumière sépare les mains (et casse le combo).
 */
export type PickupKind = 'note' | 'vinyl' | 'disco';

export const PICKUPS: Record<PickupKind, { points: number; weight: number }> = {
  note: { points: 50, weight: 0.62 },
  vinyl: { points: 100, weight: 0.3 },
  // Rare : lance le mode disco.
  disco: { points: 150, weight: 0.08 },
};

function note(): Graphics {
  const g = new Graphics();
  g.circle(0, 0, 58).fill({ color: 0xff9a3c, alpha: 0.16 });
  g.circle(0, 0, 40).fill({ color: 0xffb24a, alpha: 0.14 });
  const c = 0xffd27a;
  g.ellipse(-20, 26, 15, 11).fill(c);
  g.ellipse(22, 18, 15, 11).fill(c);
  g.rect(-8, -32, 6, 58).fill(c);
  g.rect(34, -40, 6, 58).fill(c);
  g.poly([-8, -32, 40, -40, 40, -28, -8, -20]).fill(c);
  return g;
}

function vinyl(): Graphics {
  const g = new Graphics();
  g.circle(0, 0, 62).fill({ color: 0xff9a3c, alpha: 0.18 });
  g.circle(0, 0, 44).fill(0x0d0d12);
  g.circle(0, 0, 44).stroke({ width: 3, color: 0xffb24a });
  for (const r of [36, 30, 24]) g.circle(0, 0, r).stroke({ width: 1.5, color: 0x6b4a2a, alpha: 0.8 });
  g.circle(0, 0, 15).fill(0xff8a2a);
  g.rect(-13, -3, 26, 2).fill({ color: 0xffd9a8, alpha: 0.7 }); // reflet qui tourne avec le disque
  g.circle(0, 0, 3).fill(0x0d0d12);
  return g;
}

function discoBall(): Graphics {
  const g = new Graphics();
  for (const [col, r] of [
    [0xff3fa4, 76],
    [0x3fe8ff, 64],
    [0xffd34a, 54],
  ] as const)
    g.circle(0, 0, r).fill({ color: col, alpha: 0.12 });
  g.rect(-1, -90, 2, 44).fill({ color: 0xcfd6e6, alpha: 0.8 });
  g.circle(0, 0, 46).fill(0x8d97ad);
  const tones = [0xffffff, 0xdfe7ff, 0xb9c4dd, 0xffd1ec, 0xc8fbff];
  let k = 0;
  for (let y = -44; y <= 44; y += 11)
    for (let x = -44; x <= 44; x += 11) {
      if (x * x + y * y > 43 * 43) continue;
      g.rect(x - 4.5, y - 4.5, 9, 9).fill(tones[k++ % tones.length]);
    }
  g.circle(-15, -17, 9).fill({ color: 0xffffff, alpha: 0.9 });
  return g;
}

// --- Bonus spéciaux (un par niveau) : rapides, imprévisibles, ils rapportent gros.
export type SpecialKind = 'car' | 'bouquet' | 'mic' | 'mystery' | 'champagne' | 'polaroid';

function glow(g: Graphics, r: number, col = 0xffd06b) {
  g.circle(0, 0, r * 1.5).fill({ color: col, alpha: 0.12 });
  g.circle(0, 0, r * 1.15).fill({ color: col, alpha: 0.12 });
}

function car(): Graphics {
  // SUV compact gris argent façon Peugeot 4007 (la voiture de la route du mariage) :
  // caisse haute, 3 vitres latérales, barres de toit, bas de caisse noir, phares allumés.
  const g = new Graphics();
  glow(g, 78, 0xffe1a8);
  // Caisse
  g.moveTo(-92, 8)
    .lineTo(-90, -26)
    .lineTo(-80, -40)
    .lineTo(-66, -54)
    .lineTo(28, -54)
    .lineTo(56, -30)
    .lineTo(86, -24)
    .quadraticCurveTo(96, -20, 95, -6)
    .lineTo(94, 8)
    .closePath()
    .fill(0xaeb6c2);
  // Reflet clair le long du toit
  g.moveTo(-64, -52).lineTo(26, -52).stroke({ width: 2, color: 0xe6ebf2, alpha: 0.9 });
  // Bas de caisse et passages de roues noirs
  g.rect(-92, -2, 186, 12).fill(0x2a2f38);
  g.circle(-54, 6, 24).fill(0x2a2f38);
  g.circle(58, 6, 24).fill(0x2a2f38);
  // Vitres
  g.poly([-76, -48, -52, -48, -52, -32, -84, -32]).fill(0x14223a);
  g.poly([-48, -50, -6, -50, -6, -32, -48, -32]).fill(0x14223a);
  g.poly([-2, -50, 26, -50, 48, -32, -2, -32]).fill(0x14223a);
  g.rect(-5, -32, 2, 30).fill({ color: 0x5c6573, alpha: 0.8 }); // ligne de porte
  // Barres de toit
  g.roundRect(-64, -60, 90, 4, 2).fill(0x2a2f38);
  // Roues
  for (const x of [-54, 58]) {
    g.circle(x, 8, 18).fill(0x111318);
    g.circle(x, 8, 9).fill(0xcfd6e6);
    g.circle(x, 8, 3).fill(0x5c6573);
  }
  // Phare avant, feu arrière, rétroviseur
  g.ellipse(88, -14, 7, 4).fill(0xfff3c4);
  g.rect(-92, -24, 4, 10).fill(0xd83a3a);
  g.ellipse(44, -30, 5, 3).fill(0x2a2f38);
  // Ficelle + boîtes de conserve « Just Married »
  g.moveTo(-92, 4).quadraticCurveTo(-110, 20, -124, 16).stroke({ width: 2, color: 0xcfd6e6 });
  g.roundRect(-132, 10, 12, 14, 2).fill(0xcfd6e6);
  g.moveTo(-92, 6).quadraticCurveTo(-104, 28, -116, 28).stroke({ width: 2, color: 0xcfd6e6 });
  g.roundRect(-124, 24, 12, 14, 2).fill(0xb9c4dd);
  return g;
}

function bouquet(): Graphics {
  const g = new Graphics();
  glow(g, 58, 0xff9ad0);
  g.poly([-8, 10, 8, 10, 4, 60, -4, 60]).fill(0x3f8a4f);
  g.poly([-16, 18, 16, 18, 8, 34, -8, 34]).fill(0xfff1f6);
  const cols = [0xffffff, 0xffc2dc, 0xff7fb2, 0xfff1f6, 0xffd06b];
  const pts = [[0, -10], [-24, -2], [24, -2], [-14, -30], [14, -30], [0, -40], [-30, -24], [30, -24]];
  pts.forEach(([x, y], i) => {
    g.circle(x, y, 15).fill(cols[i % cols.length]);
    g.circle(x, y, 5).fill(0xffd06b);
  });
  return g;
}

function mic(): Graphics {
  const g = new Graphics();
  glow(g, 60, 0xb48cff);
  g.roundRect(-9, 6, 18, 56, 8).fill(0x2a2a36);
  g.roundRect(-14, 0, 28, 10, 4).fill(0xcfd6e6);
  g.circle(0, -22, 26).fill(0xcfd6e6);
  for (let y = -40; y <= -4; y += 8) g.moveTo(-22, y).lineTo(22, y).stroke({ width: 2, color: 0x8d97ad, alpha: 0.8 });
  for (const [x, y, r] of [[34, -44, 6], [-36, -36, 4], [40, 0, 3]]) g.star(x, y, 4, r * 2, r * 0.8).fill(0xffffff);
  return g;
}

function mystery(): Graphics {
  // Pochette mystère du prochain album : vinyle qui dépasse + gros « ? ».
  const g = new Graphics();
  glow(g, 62);
  g.circle(26, -6, 44).fill(0x0d0d12);
  g.circle(26, -6, 14).fill(0xff8a2a);
  g.roundRect(-52, -52, 92, 92, 4).fill(0x101826);
  g.roundRect(-52, -52, 92, 92, 4).stroke({ width: 3, color: 0xffb24a });
  g.circle(-6, -18, 18).stroke({ width: 9, color: 0xffb24a });
  g.rect(-24, -24, 18, 14).fill(0x101826);
  g.rect(-10, -2, 9, 14).fill(0xffb24a);
  g.circle(-6, 24, 6).fill(0xffb24a);
  return g;
}

function champagne(): Graphics {
  const g = new Graphics();
  glow(g, 60);
  g.roundRect(-16, -10, 32, 72, 10).fill(0x1f5a3a);
  g.rect(-8, -42, 16, 34).fill(0x1f5a3a);
  g.rect(-9, -46, 18, 14).fill(0xffd06b);
  g.roundRect(-14, 18, 28, 22, 3).fill(0xfff1d6);
  // Le bouchon qui saute + les bulles
  g.roundRect(-8, -78, 16, 16, 4).fill(0xd9b38a);
  for (const [x, y, r] of [[18, -66, 5], [-20, -60, 4], [24, -90, 3], [-14, -94, 5], [6, -104, 3]]) g.circle(x, y, r).stroke({ width: 2, color: 0xfff3c4 });
  return g;
}

function polaroid(): Graphics {
  // La toute première idée de pochette : un polaroid du baiser en ombre.
  const g = new Graphics();
  glow(g, 60);
  g.roundRect(-46, -54, 92, 108, 3).fill(0xf4efe4);
  g.rect(-38, -46, 76, 74).fill(0xe8dfcf);
  g.ellipse(-8, -22, 9, 11).fill(0x1b2a44);
  g.ellipse(9, -26, 10, 12).fill(0x1b2a44);
  g.poly([-22, 28, -16, -10, 18, -12, 26, 28]).fill(0x1b2a44);
  return g;
}

const SPECIAL_DRAW: Record<SpecialKind, () => Graphics> = { car, bouquet, mic, mystery, champagne, polaroid };

export function makeSpecialTexture(renderer: Renderer, kind: SpecialKind): Texture {
  const g = SPECIAL_DRAW[kind]();
  const t = renderer.generateTexture({ target: g, resolution: 1.5 });
  g.destroy();
  return t;
}

export function makePickupTextures(renderer: Renderer): Record<PickupKind, Texture> {
  const make = (g: Graphics) => {
    const t = renderer.generateTexture({ target: g, resolution: 1.5 });
    g.destroy();
    return t;
  };
  return { note: make(note()), vinyl: make(vinyl()), disco: make(discoBall()) };
}
