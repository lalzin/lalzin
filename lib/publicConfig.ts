/**
 * ════════════════════════════════════════════════════════════════════
 *  RÉGLAGES NON SECRETS, LUS CÔTÉ SERVEUR
 * ════════════════════════════════════════════════════════════════════
 *  Ces deux valeurs finissent forcément dans la page (le widget Turnstile
 *  et le lien de don s'affichent dans le navigateur), mais elles ne sont
 *  PAS sensibles :
 *   - la site key Turnstile est publique par conception, elle est visible
 *     dans le HTML de tous les sites qui utilisent Turnstile. Le secret,
 *     lui, est TURNSTILE_SECRET_KEY et ne quitte jamais le serveur ;
 *   - un identifiant paypal.me est public par nature.
 *
 *  Elles sont lues ici, côté serveur, puis passées en props aux
 *  composants client. Résultat : aucune variable n'a besoin du préfixe
 *  NEXT_PUBLIC sur Vercel.
 *
 *  ⚠️ Ne jamais importer ce module depuis un composant 'use client' :
 *  sans préfixe NEXT_PUBLIC, Next.js ne remplace pas ces `process.env`
 *  dans le bundle navigateur et les valeurs y seraient vides.
 */

/** Clé publique du widget Turnstile (vide = captcha désactivé). */
export const turnstileSiteKey =
  process.env.TURNSTILE_SITE_KEY ?? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

/** Identifiant paypal.me, sans URL (vide = bloc don masqué). */
export const paypalMe = process.env.PAYPAL_ME ?? process.env.NEXT_PUBLIC_PAYPAL_ME ?? '';

/** URL de don, ou null si aucun identifiant n'est configuré. */
export const paypalUrl = (amountEUR?: number): string | null => {
  if (!paypalMe) return null;
  return amountEUR
    ? `https://paypal.me/${paypalMe}/${amountEUR}EUR`
    : `https://paypal.me/${paypalMe}`;
};
