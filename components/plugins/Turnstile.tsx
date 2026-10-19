'use client';

import Script from 'next/script';
import { useEffect, useId, useRef, useState } from 'react';

type TurnstileAPI = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileAPI;
  }
}

/**
 * Widget Cloudflare Turnstile.
 * Sans clé publique configurée, le composant ne rend rien et le
 * formulaire reste utilisable (le serveur ne bloque pas non plus).
 */
export default function Turnstile({
  siteKey,
  onToken,
  theme = 'dark',
}: {
  /** Clé publique, lue côté serveur et passée en prop (voir lib/publicConfig). */
  siteKey: string;
  onToken: (token: string | null) => void;
  theme?: 'dark' | 'light';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!siteKey || !ready || widgetId.current) return;

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    let attempts = 0;

    /**
     * api.js se charge avant d'avoir posé `window.turnstile` : au premier
     * passage l'API est souvent absente. On réessaie jusqu'à ce qu'elle
     * apparaisse (abandon au bout de ~10 s) plutôt que de renoncer en
     * silence, ce qui laissait le widget invisible.
     */
    const tryRender = (): boolean => {
      const api = window.turnstile;
      if (cancelled || widgetId.current || !api || !ref.current) return false;
      widgetId.current = api.render(ref.current, {
        sitekey: siteKey,
        theme,
        callback: (token: string) => onToken(token),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
      });
      return true;
    };

    if (!tryRender()) {
      timer = setInterval(() => {
        attempts += 1;
        if (tryRender() || attempts > 66) {
          if (timer) clearInterval(timer);
          timer = null;
        }
      }, 150);
    }

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      if (widgetId.current) {
        window.turnstile?.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [ready, siteKey, theme, onToken]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="lazyOnload"
        onReady={() => setReady(true)}
      />
      <div ref={ref} id={`turnstile-${id}`} className="min-h-[65px]" />
    </>
  );
}
