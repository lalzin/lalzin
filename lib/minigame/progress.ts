/**
 * Progression du joueur, gardée dans son navigateur : bonus spéciaux attrapés
 * (collection de la cabine) et points cumulés sur les victoires (ouverture de
 * la cabine). Tout est dans un try/catch : sans stockage, le jeu marche quand même.
 */
export type Progress = { collected: string[]; totalPoints: number };

const key = (slug: string) => `minigame:${slug}:progress`;

export function loadProgress(slug: string): Progress {
  try {
    const raw = localStorage.getItem(key(slug));
    if (raw) {
      const p = JSON.parse(raw) as Partial<Progress>;
      return { collected: Array.isArray(p.collected) ? p.collected : [], totalPoints: Number(p.totalPoints) || 0 };
    }
  } catch {
    /* stockage indisponible */
  }
  return { collected: [], totalPoints: 0 };
}

export function saveProgress(slug: string, p: Progress) {
  try {
    localStorage.setItem(key(slug), JSON.stringify(p));
  } catch {
    /* stockage indisponible */
  }
}
