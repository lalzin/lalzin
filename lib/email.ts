/**
 * ════════════════════════════════════════════════════════════════════
 *  ENVOI DES EMAILS — Resend (serveur uniquement)
 * ════════════════════════════════════════════════════════════════════
 *  - email transactionnel contenant les liens de téléchargement ;
 *  - ajout à l'audience newsletter UNIQUEMENT si la case a été cochée.
 * ════════════════════════════════════════════════════════════════════
 */
import { Resend } from 'resend';
import DownloadEmail, { downloadEmailText, type DownloadEmailProps } from '@/components/email/DownloadEmail';
import type { Lang } from './content';

const API_KEY = process.env.RESEND_API_KEY;
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

export const emailConfigured = Boolean(API_KEY);

export const FROM = 'LALZIN <downloads@lalzin.com>';

const SUBJECT: Record<Lang, string> = {
  fr: 'Tes plugins Groove Knobs 🎛️',
  en: 'Your Groove Knobs plugins 🎛️',
};

let cached: Resend | null = null;
function client(): Resend | null {
  if (!API_KEY) return null;
  if (!cached) cached = new Resend(API_KEY);
  return cached;
}

export type SendResult = { ok: true } | { ok: false; reason: string };

/** Dernière erreur d'envoi, lisible depuis le diagnostic de l'admin. */
let lastError: { at: string; reason: string } | null = null;
export const lastSendError = () => lastError;

/**
 * Envoie l'email de téléchargement.
 * La raison d'un échec est journalisée (visible dans les logs Vercel) et
 * conservée pour le diagnostic de l'admin : sans ça, une erreur Resend
 * — domaine non vérifié, par exemple — reste totalement invisible.
 */
export async function sendDownloadEmail(
  to: string,
  replyTo: string,
  props: DownloadEmailProps,
): Promise<SendResult> {
  const resend = client();
  if (!resend) return { ok: false, reason: 'RESEND_API_KEY absente' };

  const fail = (reason: string): SendResult => {
    lastError = { at: new Date().toISOString(), reason };
    console.error('[plugins] envoi email échoué :', reason);
    return { ok: false, reason };
  };

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      replyTo,
      subject: SUBJECT[props.lang],
      react: DownloadEmail(props),
      text: downloadEmailText(props),
    });
    if (error) return fail(`${error.name ?? 'erreur'} : ${error.message ?? 'inconnue'}`);
    lastError = null;
    return { ok: true };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'exception inconnue');
  }
}

/**
 * Ajoute le contact à l'audience newsletter (opt-in explicite uniquement).
 * Ne fait jamais échouer la demande de téléchargement.
 */
export async function addToAudience(email: string): Promise<void> {
  const resend = client();
  if (!resend || !AUDIENCE_ID) return;
  try {
    await resend.contacts.create({ email, audienceId: AUDIENCE_ID, unsubscribed: false });
  } catch {
    /* silencieux : l'inscription newsletter ne doit pas bloquer le téléchargement */
  }
}
