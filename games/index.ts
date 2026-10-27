import type { SceneFactory } from '@/lib/minigame/engine';
import type { GameConfig } from '@/lib/minigame/types';
import { config as aLittleCloser } from './a-little-closer/config';

/**
 * Registre des mini-jeux. Ajouter un titre = un dossier `games/<slug>/`
 * (config.ts + scene.ts) et une entrée ici.
 */
export const games: Record<string, { config: GameConfig; scene: () => Promise<SceneFactory> }> = {
  [aLittleCloser.slug]: {
    config: aLittleCloser,
    scene: () => import('./a-little-closer/scene').then((m) => m.createScene),
  },
};
