/**
 * ════════════════════════════════════════════════════════════════════
 *  INFORMATIONS LÉGALES — mentions légales et politique de confidentialité
 * ════════════════════════════════════════════════════════════════════
 *  Éditeur : micro-entreprise (entrepreneur individuel). La loi LCEN
 *  impose nom, adresse, moyen de contact direct et numéro d'immatriculation ;
 *  la mention « EI » suit le nom depuis le 15 mai 2022.
 *
 *  Tant qu'un champ vaut A_COMPLETER, `npm run build` échoue
 *  (scripts/check-legal.mjs) : impossible de publier des mentions vides.
 * ════════════════════════════════════════════════════════════════════
 */
export const A_COMPLETER = 'À COMPLÉTER';

export const legal = {
  editeur: {
    /** Prénom et nom de l'entrepreneur, suivis de « EI ». */
    nom: 'Alan Marzin EI',
    nomDeScene: 'LALZIN',
    statut: { fr: 'Entrepreneur individuel (micro-entreprise)', en: 'Sole trader (French micro-entreprise)' },
    /** Adresse postale (une domiciliation convient). */
    adresse: '5 allée de la Grande Treille, bureau 3, Rennes',
    siret: '883 454 605 00022',
    /** Non communiqué : l'email permet un contact direct et rapide. */
    telephone: null as string | null,
    email: 'dirty.lalzin@gmail.com',
  },
  hebergeur: {
    nom: 'Vercel Inc.',
    adresse: '440 N Barranca Ave #4133, Covina, CA 91723, États-Unis',
    adresseEn: '440 N Barranca Ave #4133, Covina, CA 91723, USA',
    telephone: '+1 559 288 7060',
    site: 'https://vercel.com',
  },
  /** Date de dernière mise à jour des textes légaux (AAAA-MM-JJ). */
  misAJour: '2026-11-17',
};
