/**
 * Carte de partage 1080×1920 (format story) générée côté client, puis
 * Web Share API avec fichier quand c'est possible, sinon téléchargement.
 */
export type ShareCardInput = {
  snapshot: HTMLCanvasElement;
  title: string;
  artist: string;
  score: number;
  subtitle: string;
  url: string;
  fontFamily: string;
  amber: string;
};

export async function makeShareCard(i: ShareCardInput): Promise<Blob> {
  const W = 1080;
  const H = 1920;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#001c35';
  g.fillRect(0, 0, W, H);
  // Capture du jeu, recadrée en « cover ».
  const s = Math.max(W / i.snapshot.width, H / i.snapshot.height);
  const sw = i.snapshot.width * s;
  const sh = i.snapshot.height * s;
  g.drawImage(i.snapshot, (W - sw) / 2, (H - sh) / 2, sw, sh);
  const top = g.createLinearGradient(0, 0, 0, 640);
  top.addColorStop(0, 'rgba(0,18,36,0.92)');
  top.addColorStop(1, 'rgba(0,18,36,0)');
  g.fillStyle = top;
  g.fillRect(0, 0, W, 640);
  const bot = g.createLinearGradient(0, H - 760, 0, H);
  bot.addColorStop(0, 'rgba(0,18,36,0)');
  bot.addColorStop(1, 'rgba(0,18,36,0.95)');
  g.fillStyle = bot;
  g.fillRect(0, H - 760, W, 760);

  g.textAlign = 'center';
  g.fillStyle = i.amber;
  g.shadowColor = 'rgba(255,138,42,0.6)';
  g.shadowBlur = 30;
  g.font = `600 44px system-ui, sans-serif`;
  g.fillText(i.artist.split('').join(' '), W / 2, 170);
  g.font = `120px ${i.fontFamily}`;
  g.fillText(i.title, W / 2, 330);

  g.font = `200px ${i.fontFamily}`;
  g.fillText(String(i.score), W / 2, H - 420);
  g.shadowBlur = 0;
  g.fillStyle = 'rgba(255,214,170,0.85)';
  g.font = `500 44px system-ui, sans-serif`;
  g.fillText(i.subtitle, W / 2, H - 320);
  g.fillStyle = 'rgba(255,255,255,0.7)';
  g.font = `500 38px system-ui, sans-serif`;
  g.fillText(i.url.replace(/^https?:\/\//, ''), W / 2, H - 150);

  return await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('toBlob'))), 'image/png'));
}

/** Partage natif avec fichier si possible ; sinon téléchargement. Retourne la méthode utilisée. */
export async function shareOrDownload(blob: Blob, filename: string, text: string, url: string): Promise<'share' | 'download' | 'cancel'> {
  const file = new File([blob], filename, { type: blob.type });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], text, url });
      return 'share';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancel';
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'download';
}
