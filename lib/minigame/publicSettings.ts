/**
 * Réglages d'un mini-jeu exposés au navigateur (jamais le mot de passe).
 * La version complète, côté serveur, vit dans `settings.ts`.
 */
export type PublicGameSettings = {
  /** Date de sortie AAAA-MM-JJ (heure de Paris), '' si pas encore fixée. */
  releaseDate: string;
  /** Cadeau pour le n°1 du classement le jour de la sortie. */
  gift: boolean;
  /** Pochette choisie dans l'admin ('' = celle du jeu). */
  cover: string;
  /** Liens d'écoute choisis dans l'admin (absents = ceux du jeu). */
  links: { spotify?: string; appleMusic?: string };
};
