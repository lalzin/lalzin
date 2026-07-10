import type { Social } from './content';

/** Vrai lien http(s) (pas un placeholder « # » ou vide). */
export const isExternal = (href: string | undefined): boolean =>
  /^https?:\/\//.test(href ?? '');

/**
 * Lien d'écoute effectif : le lien du morceau s'il est renseigné,
 * sinon repli sur le profil Spotify (jamais de lien mort « # »).
 */
export function resolveListenHref(
  href: string | undefined,
  socials: Social[],
): string {
  if (isExternal(href)) return href as string;
  const spotify = socials.find((s) => s.key === 'spotify')?.href;
  return (isExternal(spotify) && spotify) || socials.find((s) => isExternal(s.href))?.href || '#';
}
