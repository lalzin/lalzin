'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useContent } from '@/components/providers/ContentProvider';
import type { Content, LiveDate, MerchProduct, Release } from '@/lib/content';
import { Area, Card, ColorPair, ImageField, LocalizedField, Select, Text, Toggle } from '@/components/admin/fields';

type Tab = 'artist' | 'socials' | 'releases' | 'video' | 'live' | 'merch' | 'seo';

const TABS: { id: Tab; label: string }[] = [
  { id: 'artist', label: '🎤 Artiste' },
  { id: 'socials', label: '🔗 Réseaux' },
  { id: 'releases', label: '💿 Sorties' },
  { id: 'video', label: '🎬 Vidéo' },
  { id: 'live', label: '📅 Dates' },
  { id: 'merch', label: '🛍️ Boutique' },
  { id: 'seo', label: '⚙️ SEO' },
];

const ACCENTS = ['#FF2E92', '#FF6B35', '#FFC23C', '#15C7B8'];

export default function AdminPage() {
  const { content, update, reset, exportJSON, importJSON } = useContent();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('artist');
  const [flash, setFlash] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const logout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.replace('/admin/login');
    router.refresh();
  };

  const set = (patch: Partial<Content>) => update({ ...content, ...patch });
  const setArtist = (p: Partial<Content['artist']>) => set({ artist: { ...content.artist, ...p } });

  const notify = (m: string) => {
    setFlash(m);
    setTimeout(() => setFlash(''), 2200);
  };

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then((txt) => notify(importJSON(txt) ? 'Contenu importé ✓' : 'JSON invalide ✗'));
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">
        {/* En-tête */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-cream">Admin LALZIN</h1>
            <p className="text-sm text-cream/50">
              Modifications enregistrées dans ce navigateur. Exporte le JSON pour sauvegarder.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/" className="rounded-full border border-cream/15 px-4 py-2 text-sm text-cream/80 hover:text-cream">
              Voir le site ↗
            </Link>
            <button onClick={exportJSON} className="rounded-full bg-gradient-to-r from-magenta to-coral px-4 py-2 text-sm font-semibold text-night">
              Exporter JSON
            </button>
            <button onClick={() => fileRef.current?.click()} className="rounded-full border border-cream/15 px-4 py-2 text-sm text-cream/80 hover:text-cream">
              Importer
            </button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImport} />
            <button
              onClick={() => {
                if (confirm('Réinitialiser tout le contenu aux valeurs par défaut ?')) {
                  reset();
                  notify('Réinitialisé');
                }
              }}
              className="rounded-full border border-cream/15 px-4 py-2 text-sm text-cream/50 hover:text-coral"
            >
              Réinitialiser
            </button>
            <button
              onClick={logout}
              className="rounded-full border border-cream/15 px-4 py-2 text-sm text-cream/70 hover:text-cream"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {flash && (
          <div className="mb-4 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-medium text-gold">
            {flash}
          </div>
        )}

        {/* Onglets */}
        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                tab === tb.id ? 'bg-cream text-night' : 'bg-cream/5 text-cream/70 hover:bg-cream/10'
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {/* ARTISTE */}
        {tab === 'artist' && (
          <div className="space-y-4">
            <Card>
              <Text label="Nom" value={content.artist.name} onChange={(v) => setArtist({ name: v })} />
              <Text label="Email booking" value={content.artist.bookingEmail} onChange={(v) => setArtist({ bookingEmail: v })} />
              <Text
                label="Genres (séparés par des virgules)"
                value={content.artist.genres.join(', ')}
                onChange={(v) => setArtist({ genres: v.split(',').map((g) => g.trim()).filter(Boolean) })}
              />
            </Card>
            <Card>
              <LocalizedField label="Tagline" value={content.artist.tagline} onChange={(v) => setArtist({ tagline: v })} />
              <LocalizedField label="Bio" value={content.artist.bio} onChange={(v) => setArtist({ bio: v })} area />
            </Card>
            <Card>
              <span className="text-xs font-semibold uppercase tracking-wider text-gold">Stats</span>
              {content.artist.stats.map((s, i) => (
                <div key={i} className="grid gap-2 rounded-xl border border-cream/10 p-3 sm:grid-cols-3">
                  <Text label="Valeur" value={s.value} onChange={(v) => {
                    const stats = [...content.artist.stats];
                    stats[i] = { ...s, value: v };
                    setArtist({ stats });
                  }} />
                  <LocalizedField label="Label" value={s.label} onChange={(label) => {
                    const stats = [...content.artist.stats];
                    stats[i] = { ...s, label };
                    setArtist({ stats });
                  }} />
                  <LocalizedField label="Sous-titre" value={s.sub} onChange={(sub) => {
                    const stats = [...content.artist.stats];
                    stats[i] = { ...s, sub };
                    setArtist({ stats });
                  }} />
                </div>
              ))}
            </Card>
            <Card>
              <span className="text-xs font-semibold uppercase tracking-wider text-gold">Médias</span>
              <div className="grid gap-4 sm:grid-cols-2">
                <ImageField label="Photo portrait (About)" value={content.artist.photos.portrait} onChange={(v) => setArtist({ photos: { ...content.artist.photos, portrait: v } })} />
                <ImageField label="Photo live (fond hero)" value={content.artist.photos.live} onChange={(v) => setArtist({ photos: { ...content.artist.photos, live: v } })} />
              </div>
              <ImageField label="Logo (PNG transparent conseillé)" value={content.artist.logo} onChange={(v) => setArtist({ logo: v })} />
            </Card>
          </div>
        )}

        {/* RÉSEAUX */}
        {tab === 'socials' && (
          <div className="space-y-3">
            {content.socials.map((s, i) => (
              <Card key={s.key}>
                <div className="text-xs font-semibold uppercase tracking-wider text-gold">{s.key}</div>
                <Text label="Label" value={s.label} onChange={(v) => {
                  const socials = [...content.socials];
                  socials[i] = { ...s, label: v };
                  set({ socials });
                }} />
                <Text label="Lien" value={s.href} onChange={(v) => {
                  const socials = [...content.socials];
                  socials[i] = { ...s, href: v };
                  set({ socials });
                }} mono />
              </Card>
            ))}
          </div>
        )}

        {/* SORTIES */}
        {tab === 'releases' && (
          <div className="space-y-3">
            {content.releases.map((r, i) => (
              <Card key={r.id}>
                <div className="flex items-start justify-between gap-2">
                  <Text label="Titre" value={r.title} onChange={(v) => updateRelease(content, set, i, { title: v })} />
                  <RowActions
                    onUp={() => move(content, set, 'releases', i, -1)}
                    onDown={() => move(content, set, 'releases', i, 1)}
                    onDel={() => set({ releases: content.releases.filter((_, j) => j !== i) })}
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Select label="Type" value={r.type} options={['Album', 'EP', 'Single', 'Remix']} onChange={(v) => updateRelease(content, set, i, { type: v as Release['type'] })} />
                  <Text label="Lien d'écoute" value={r.href} onChange={(v) => updateRelease(content, set, i, { href: v })} mono />
                </div>
                <ImageField label="Pochette" value={r.cover} onChange={(v) => updateRelease(content, set, i, { cover: v || undefined })} square />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <ColorPair value={r.accent} onChange={(accent) => updateRelease(content, set, i, { accent })} />
                  <div className="flex flex-col gap-2">
                    <Toggle label="À la une" checked={!!r.featured} onChange={(featured) => updateRelease(content, set, i, { featured })} />
                    <Toggle
                      label="Popup « nouveau titre »"
                      checked={!!r.announce}
                      onChange={(announce) =>
                        // Un seul morceau annoncé à la fois
                        set({
                          releases: content.releases.map((rel, j) => ({
                            ...rel,
                            announce: j === i ? announce : false,
                          })),
                        })
                      }
                    />
                  </div>
                </div>
              </Card>
            ))}
            <button
              onClick={() =>
                set({
                  releases: [
                    ...content.releases,
                    { id: `rel-${Date.now()}`, title: 'Nouvelle sortie', type: 'Single', accent: ['#FF2E92', '#FF6B35'], href: '#' },
                  ],
                })
              }
              className="w-full rounded-2xl border border-dashed border-cream/25 py-3 text-sm font-semibold text-cream/70 hover:text-cream"
            >
              + Ajouter une sortie
            </button>
          </div>
        )}

        {/* VIDÉO */}
        {tab === 'video' && (
          <Card>
            <Text label="Titre" value={content.video.title} onChange={(v) => set({ video: { ...content.video, title: v } })} />
            <LocalizedField label="Sous-titre" value={content.video.subtitle} onChange={(subtitle) => set({ video: { ...content.video, subtitle } })} />
            <Text
              label="ID YouTube (la partie après v= ou youtu.be/)"
              value={content.video.youtubeId}
              onChange={(v) => set({ video: { ...content.video, youtubeId: v } })}
              mono
            />
            <p className="text-xs text-cream/40">Laisser vide affiche un cadre disco + bouton « Voir sur YouTube ».</p>
          </Card>
        )}

        {/* DATES */}
        {tab === 'live' && (
          <div className="space-y-3">
            {content.liveDates.length === 0 && (
              <p className="rounded-2xl border border-cream/10 bg-cream/[0.03] p-4 text-sm text-cream/50">
                Aucune date — la section affiche « Dates bientôt annoncées ».
              </p>
            )}
            {content.liveDates.map((d, i) => (
              <Card key={d.id}>
                <div className="flex items-start justify-between gap-2">
                  <Text label="Date" value={d.date} onChange={(v) => updateDate(content, set, i, { date: v })} placeholder="12 JUIL 2026" />
                  <RowActions
                    onUp={() => move(content, set, 'liveDates', i, -1)}
                    onDown={() => move(content, set, 'liveDates', i, 1)}
                    onDel={() => set({ liveDates: content.liveDates.filter((_, j) => j !== i) })}
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Text label="Lieu" value={d.venue} onChange={(v) => updateDate(content, set, i, { venue: v })} />
                  <Text label="Ville" value={d.city} onChange={(v) => updateDate(content, set, i, { city: v })} />
                </div>
                <Text label="Lien billetterie (optionnel)" value={d.ticketsHref ?? ''} onChange={(v) => updateDate(content, set, i, { ticketsHref: v || undefined })} mono />
              </Card>
            ))}
            <button
              onClick={() =>
                set({ liveDates: [...content.liveDates, { id: `date-${Date.now()}`, date: '', venue: '', city: '' }] })
              }
              className="w-full rounded-2xl border border-dashed border-cream/25 py-3 text-sm font-semibold text-cream/70 hover:text-cream"
            >
              + Ajouter une date
            </button>
          </div>
        )}

        {/* BOUTIQUE */}
        {tab === 'merch' && (
          <div className="space-y-3">
            <Card>
              <Text
                label="Lien de la boutique (Shopify) — bouton « Visiter la boutique »"
                value={content.site.shopUrl ?? ''}
                onChange={(v) => set({ site: { ...content.site, shopUrl: v || undefined } })}
                mono
              />
              <p className="text-xs text-cream/40">
                Tant qu'aucun produit n'est marqué « Disponible », la section affiche « Boutique bientôt disponible ».
              </p>
            </Card>
            {content.merch.map((p, i) => (
              <Card key={p.id}>
                <div className="flex items-start justify-between gap-2">
                  <Text label="Nom" value={p.name} onChange={(v) => updateMerch(content, set, i, { name: v })} />
                  <RowActions
                    onUp={() => move(content, set, 'merch', i, -1)}
                    onDown={() => move(content, set, 'merch', i, 1)}
                    onDel={() => set({ merch: content.merch.filter((_, j) => j !== i) })}
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Select label="Catégorie" value={p.category} options={['T-shirt', 'Vinyle', 'Goodies']} onChange={(v) => updateMerch(content, set, i, { category: v as MerchProduct['category'] })} />
                  <Text label="Lien boutique (si dispo)" value={p.href ?? ''} onChange={(v) => updateMerch(content, set, i, { href: v || undefined })} mono />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <ColorPair value={p.accent} onChange={(accent) => updateMerch(content, set, i, { accent })} />
                  <Toggle label="Disponible" checked={p.available} onChange={(available) => updateMerch(content, set, i, { available })} />
                </div>
              </Card>
            ))}
            <button
              onClick={() =>
                set({ merch: [...content.merch, { id: `merch-${Date.now()}`, name: 'Nouveau produit', category: 'Goodies', accent: ['#FF2E92', '#FFC23C'], available: false }] })
              }
              className="w-full rounded-2xl border border-dashed border-cream/25 py-3 text-sm font-semibold text-cream/70 hover:text-cream"
            >
              + Ajouter un produit
            </button>
          </div>
        )}

        {/* SEO */}
        {tab === 'seo' && (
          <Card>
            <Text label="URL du site" value={content.site.url} onChange={(v) => set({ site: { ...content.site, url: v } })} mono />
            <Text label="Titre (meta)" value={content.site.title} onChange={(v) => set({ site: { ...content.site, title: v } })} />
            <Area label="Description (meta)" value={content.site.description} onChange={(v) => set({ site: { ...content.site, description: v } })} />
          </Card>
        )}

        <p className="mt-8 text-center text-xs text-cream/30">
          Couleurs suggérées : {ACCENTS.join(' · ')}
        </p>
      </div>
    </main>
  );
}

/* ----------------------------------------------------------- helpers */
function updateRelease(c: Content, set: (p: Partial<Content>) => void, i: number, patch: Partial<Release>) {
  const releases = [...c.releases];
  releases[i] = { ...releases[i], ...patch };
  set({ releases });
}
function updateDate(c: Content, set: (p: Partial<Content>) => void, i: number, patch: Partial<LiveDate>) {
  const liveDates = [...c.liveDates];
  liveDates[i] = { ...liveDates[i], ...patch };
  set({ liveDates });
}
function updateMerch(c: Content, set: (p: Partial<Content>) => void, i: number, patch: Partial<MerchProduct>) {
  const merch = [...c.merch];
  merch[i] = { ...merch[i], ...patch };
  set({ merch });
}
function move(c: Content, set: (p: Partial<Content>) => void, key: 'releases' | 'liveDates' | 'merch', i: number, dir: number) {
  const arr = [...(c[key] as unknown[])];
  const j = i + dir;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  set({ [key]: arr } as Partial<Content>);
}

function RowActions({ onUp, onDown, onDel }: { onUp: () => void; onDown: () => void; onDel: () => void }) {
  return (
    <div className="flex flex-none gap-1">
      <button onClick={onUp} className="h-7 w-7 rounded-lg bg-cream/5 text-cream/60 hover:text-cream" aria-label="Monter">↑</button>
      <button onClick={onDown} className="h-7 w-7 rounded-lg bg-cream/5 text-cream/60 hover:text-cream" aria-label="Descendre">↓</button>
      <button onClick={onDel} className="h-7 w-7 rounded-lg bg-cream/5 text-coral/80 hover:text-coral" aria-label="Supprimer">✕</button>
    </div>
  );
}
