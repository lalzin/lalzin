import { Container, Rectangle, Sprite, Texture } from 'pixi.js';
import type { Vec2 } from '@/lib/minigame/types';
import dance from './dance.json';

/**
 * Silhouettes du couple, tirées de la planche de danse (16 poses, sol aligné en
 * bas de chaque cellule). Elles remplissent le canal R du masque d'ombre ; la
 * couleur finale vient du shader du mur.
 *
 * Coordonnées locales : pieds en (0, 0), le haut vers les y négatifs.
 * Pendant la partie, les poses 1, 2, 3 et 8 sont découpées en « elle » et « lui »
 * (mains tendues → frôlées → tenues → bras tendu qui s'éloigne). Une sélection des
 * autres sert au couple entier (chorégraphie finale, écran d'accueil) ; les
 * baisers ne sont jamais affichés.
 */

export const SHADOW = 0xff0000;
/** Unités monde par pixel de la planche (≈ 710 de haut pour une silhouette de ~210 px). */
export const DANCE_SCALE = 3.4;
/** Poses découpées elle / lui utilisées en jeu (index de la planche, base 0). */
const HALF_POSES = [0, 1, 2, 7];
/** Poses jamais affichées : les baisers (poses 12 et 16 de la planche). */
const BANNED_POSES = new Set([11, 15]);

type Frame = (typeof dance.frames)[number];
const CELL = dance.cell;

export type Pose = {
  time: number;
  beat: number;
  /** 0 = mains tendues, 1 = elles se frôlent, 2 = elles se tiennent, 3 = bras tendu (elle s'éloigne). */
  contact: number;
};

export type Figure = {
  root: Container;
  /** Main tendue « logique » (gameplay), locale. */
  hand: Vec2;
  update(p: Pose, dt: number): void;
};

function frameTexture(atlas: Texture, f: Frame, x0: number, x1: number) {
  return new Texture({
    source: atlas.source,
    frame: new Rectangle(f.x + x0, f.y, x1 - x0, CELL.h),
  });
}

/**
 * Une moitié du couple (poses 1, 2, 3 et 8). Les pieds restent au sol ; chaque
 * pose est juste décalée en x pour que sa main tombe sur la main logique.
 */
function createHalf(atlas: Texture, side: 'her' | 'him'): Figure {
  const root = new Container();
  // Main de référence = celle de la pose « mains tenues » (pose 3) : au contact, les mains
  // dessinées se rejoignent exactement.
  const base = dance.frames[2][side]!;
  const hand = { x: (base.hand.x - base.feet) * DANCE_SCALE, y: (base.hand.y - CELL.h) * DANCE_SCALE };
  const sprites = HALF_POSES.map((i) => {
    const f = dance.frames[i];
    const part = f[side]!;
    const [x0, x1] = side === 'her' ? [0, f.split!] : [f.split!, CELL.w];
    const s = new Sprite(frameTexture(atlas, f, x0, x1));
    s.tint = SHADOW;
    s.scale.set(DANCE_SCALE);
    // Pieds TOUJOURS posés au sol (pas de décalage vertical : sinon les jambes passent sous
    // le sol et l'ombre paraît coupée). Seul un petit pas de côté aligne la main en x.
    const handX = (part.hand.x - part.feet) * DANCE_SCALE;
    s.x = (x0 - part.feet) * DANCE_SCALE + (hand.x - handX);
    s.y = -CELL.h * DANCE_SCALE;
    s.alpha = i === 0 ? 1 : 0;
    root.addChild(s);
    return s;
  });
  return {
    root,
    hand,
    update({ contact }, dt) {
      const k = Math.min(1, dt * 7);
      sprites.forEach((s, i) => {
        s.alpha += ((i === contact ? 1 : 0) - s.alpha) * k;
      });
    },
  };
}

export const createHer = (atlas: Texture) => createHalf(atlas, 'her');
export const createHim = (atlas: Texture) => createHalf(atlas, 'him');

/** Le couple entier (poses autorisées), pieds centrés en (0, 0). */
export function createCouple(atlas: Texture) {
  const root = new Container();
  const sprites = dance.frames.flatMap((f, i) => {
    if (BANNED_POSES.has(i)) return [];
    const s = new Sprite(frameTexture(atlas, f, 0, CELL.w));
    s.tint = SHADOW;
    s.scale.set(DANCE_SCALE);
    s.x = -f.feet * DANCE_SCALE;
    s.y = -CELL.h * DANCE_SCALE;
    s.alpha = 0;
    root.addChild(s);
    return [{ s, i }];
  });
  return {
    root,
    /** Affiche la pose `i` (index de la planche), en fondu rapide. */
    show(i: number, dt: number, speed = 9) {
      const k = Math.min(1, dt * speed);
      for (const { s, i: j } of sprites) s.alpha += ((j === i ? 1 : 0) - s.alpha) * k;
    },
    hideAll() {
      for (const { s } of sprites) s.alpha = 0;
    },
  };
}

/**
 * Où se tiennent elle et lui dans la pose « mains tenues » (pose 3), par
 * rapport au centre des pieds du couple : sert à les amener pile en place
 * avant d'enchaîner sur la chorégraphie.
 */
export const HOLD_POSE = {
  her: (dance.frames[2].her!.feet - dance.frames[2].feet) * DANCE_SCALE,
  him: (dance.frames[2].him!.feet - dance.frames[2].feet) * DANCE_SCALE,
};
