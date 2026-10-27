'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, ImageField, Toggle } from '@/components/admin/fields';

type Settings = {
  access: 'private' | 'public';
  password: string;
  releaseDate: string;
  gift: boolean;
  cover: string;
  links: { spotify?: string; appleMusic?: string };
};
type Row = { pseudo: string; score: number; levels: number; created_at: string; email: string | null };
type Data = {
  games: { slug: string; title: string }[];
  slug: string;
  defaults: { cover: string; links: { spotify?: string; appleMusic?: string } };
  settings: Settings;
  today: string;
  boards: { all: Row[]; today: Row[]; release: Row[] | null };
  boardError: string | null;
  services: { supabase: boolean; authSecret: boolean; envPassword: boolean };
};

const inputCls =
  'w-full rounded-xl border border-cream/15 bg-night-deep/60 px-3 py-2 text-sm text-cream placeholder:text-cream/25 focus:border-gold focus:outline-none';

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-cream/45">{children}</span>;
}

/** Onglet « Mini-jeu » : sortie du jeu (accès, date, cadeau, pochette, liens) + classements. */
export default function MinigamePanel() {
  const [data, setData] = useState<Data | null>(null);
  const [draft, setDraft] = useState<Settings | null>(null);
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [boardTab, setBoardTab] = useState<'release' | 'today' | 'all'>('release');

  const load = useCallback(async (s?: string) => {
    setError('');
    try {
      const res = await fetch(`/api/admin/minigame${s ? `?slug=${encodeURIComponent(s)}` : ''}`);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return setError(j.error || 'Lecture impossible');
      setData(j);
      setDraft(j.settings);
      setSlug(j.slug);
    } catch {
      setError('Lecture impossible');
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (error) return <Card><p className="text-sm text-coral">{error}</p></Card>;
  if (!data || !draft) return <Card><p className="text-sm text-cream/50">Chargement…</p></Card>;

  const set = (p: Partial<Settings>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const dirty = JSON.stringify(draft) !== JSON.stringify(data.settings);
  const gameUrl = typeof window !== 'undefined' ? `${window.location.origin}/play/${slug}` : `/play/${slug}`;

  const save = async () => {
    setSaving(true);
    setFlash('');
    try {
      const res = await fetch('/api/admin/minigame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, settings: draft }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setFlash('Enregistré ✓');
        await load(slug);
      } else setFlash(j.error || 'Échec');
    } catch {
      setFlash('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  const copy = (txt: string, what: string) => {
    void navigator.clipboard?.writeText(txt).then(() => setFlash(`${what} copié ✓`));
  };

  const rows =
    boardTab === 'release' ? data.boards.release ?? [] : boardTab === 'today' ? data.boards.today : data.boards.all;
  const winner = (data.boards.release ?? [])[0];

  return (
    <div className="space-y-4">
      {/* Choix du jeu + état */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {data.games.length > 1 ? (
              <select
                value={slug}
                onChange={(e) => load(e.target.value)}
                className="rounded-xl border border-cream/15 bg-night-deep/60 px-3 py-2 text-sm text-cream"
              >
                {data.games.map((g) => (
                  <option key={g.slug} value={g.slug}>{g.title}</option>
                ))}
              </select>
            ) : (
              <span className="font-display text-xl font-bold text-cream">{data.games[0]?.title}</span>
            )}
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                data.settings.access === 'public' ? 'bg-teal/20 text-teal' : 'bg-gold/15 text-gold'
              }`}
            >
              {data.settings.access === 'public' ? '● En ligne pour tous' : '🔒 Accès anticipé'}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => copy(gameUrl, 'Lien')} className="rounded-full border border-cream/15 px-3 py-1.5 text-xs text-cream/80">
              Copier le lien
            </button>
            <a href={`/play/${slug}`} target="_blank" className="rounded-full border border-cream/15 px-3 py-1.5 text-xs text-cream/80">
              Ouvrir ↗
            </a>
          </div>
        </div>
        {!data.services.supabase && (
          <p className="text-xs text-coral">Supabase non configuré : impossible d’enregistrer (le jeu reste privé, mot de passe = variable MINIGAME_ACCESS_PASSWORD).</p>
        )}
        {!data.services.authSecret && (
          <p className="text-xs text-coral">AUTH_SECRET absent : l’accès anticipé ne peut délivrer aucun accès.</p>
        )}
      </Card>

      {/* Accès */}
      <Card>
        <span className="text-xs font-semibold uppercase tracking-wider text-gold">Accès</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {(['private', 'public'] as const).map((a) => (
            <button
              key={a}
              onClick={() => set({ access: a })}
              className={`rounded-xl border p-3 text-left text-sm ${
                draft.access === a ? 'border-gold bg-gold/10 text-cream' : 'border-cream/10 text-cream/60'
              }`}
            >
              <span className="block font-semibold">{a === 'private' ? '🔒 Accès anticipé' : '🚀 Sortie publique'}</span>
              <span className="mt-0.5 block text-xs text-cream/50">
                {a === 'private'
                  ? 'Mot de passe demandé, page non référencée (noindex).'
                  : 'Ouvert à tous, sans mot de passe.'}
              </span>
            </button>
          ))}
        </div>
        {draft.access === 'private' && (
          <label className="block">
            <Label>Mot de passe d’accès (à donner aux testeurs)</Label>
            <div className="flex gap-2">
              <input
                type={showPwd ? 'text' : 'password'}
                value={draft.password}
                onChange={(e) => set({ password: e.target.value })}
                placeholder={data.services.envPassword ? '(variable MINIGAME_ACCESS_PASSWORD)' : '4 caractères minimum'}
                className={inputCls}
                autoComplete="off"
              />
              <button type="button" onClick={() => setShowPwd((v) => !v)} className="rounded-xl border border-cream/15 px-3 text-xs text-cream/70">
                {showPwd ? 'Masquer' : 'Voir'}
              </button>
              {draft.password && (
                <button type="button" onClick={() => copy(draft.password, 'Mot de passe')} className="rounded-xl border border-cream/15 px-3 text-xs text-cream/70">
                  Copier
                </button>
              )}
            </div>
            <span className="mt-1 block text-[11px] text-cream/40">Le changer déconnecte tous ceux qui avaient l’ancien.</span>
          </label>
        )}
      </Card>

      {/* Sortie + cadeau */}
      <Card>
        <span className="text-xs font-semibold uppercase tracking-wider text-gold">Sortie & cadeau</span>
        <label className="block max-w-xs">
          <Label>Date de sortie (heure de Paris)</Label>
          <input type="date" value={draft.releaseDate} onChange={(e) => set({ releaseDate: e.target.value })} className={inputCls} />
        </label>
        <Toggle
          label="🎁 Cadeau pour le n°1 du classement le jour de la sortie"
          checked={draft.gift}
          onChange={(v) => set({ gift: v })}
        />
        <p className="text-[11px] text-cream/40">
          Annoncé sur l’accueil du jeu et au Top 10 jusqu’au jour J. Les joueurs du Top 10 peuvent laisser leur e-mail (visible ci-dessous uniquement).
        </p>
      </Card>

      {/* Pochette + son */}
      <Card>
        <span className="text-xs font-semibold uppercase tracking-wider text-gold">Pochette & son</span>
        <ImageField label="Pochette (accueil du jeu, page d’accès)" value={draft.cover || data.defaults.cover} onChange={(v) => set({ cover: v })} square />
        {draft.cover && (
          <button onClick={() => set({ cover: '' })} className="text-xs text-cream/50 underline">
            Revenir à la pochette d’origine
          </button>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <Label>Lien Spotify du titre</Label>
            <input
              value={draft.links.spotify ?? ''}
              placeholder={data.defaults.links.spotify}
              onChange={(e) => set({ links: { ...draft.links, spotify: e.target.value } })}
              className={inputCls}
            />
          </label>
          <label className="block">
            <Label>Lien Apple Music du titre</Label>
            <input
              value={draft.links.appleMusic ?? ''}
              placeholder={data.defaults.links.appleMusic}
              onChange={(e) => set({ links: { ...draft.links, appleMusic: e.target.value } })}
              className={inputCls}
            />
          </label>
        </div>
        <p className="text-[11px] text-cream/40">
          Boutons d’écoute affichés à la fin du jeu (vide = page artiste). La musique du jeu (pistes séparées, calées sur le tempo) est intégrée au code du jeu.
        </p>
      </Card>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={!dirty || saving}
          className={`rounded-full px-5 py-2 text-sm font-bold ${
            dirty ? 'bg-gradient-to-r from-magenta via-coral to-gold text-night' : 'cursor-default border border-cream/15 text-cream/40'
          }`}
        >
          {saving ? 'Enregistrement…' : dirty ? '● Enregistrer le jeu' : 'Enregistré ✓'}
        </button>
        {flash && <span className="text-sm text-gold">{flash}</span>}
      </div>

      {/* Classements avec e-mails */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gold">Classements</span>
          <div className="flex gap-1.5 text-xs">
            {(
              [
                ['release', data.settings.releaseDate ? `Jour de sortie (${data.settings.releaseDate})` : 'Jour de sortie'],
                ['today', `Aujourd’hui (${data.today})`],
                ['all', 'Total'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setBoardTab(id)}
                className={`rounded-full px-3 py-1 ${boardTab === id ? 'bg-cream text-night' : 'bg-cream/5 text-cream/70'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {data.boardError && (
          <p className="text-xs text-coral">
            Lecture des scores impossible ({data.boardError}). Exécute <code>supabase/minigame.sql</code> dans Supabase → SQL Editor.
          </p>
        )}
        {boardTab === 'release' && winner && (
          <p className="rounded-xl bg-gold/10 px-3 py-2 text-sm text-gold">
            🎁 Gagnant du cadeau : <b>{winner.pseudo}</b> · {winner.score.toLocaleString('fr-FR')} pts ·{' '}
            {winner.email ? <a className="underline" href={`mailto:${winner.email}`}>{winner.email}</a> : 'pas d’e-mail laissé'}
          </p>
        )}
        {boardTab === 'release' && !data.settings.releaseDate ? (
          <p className="text-sm text-cream/50">Choisis une date de sortie pour voir le classement du jour J.</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-cream/50">Aucun score.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-cream/40">
              <tr>
                <th className="py-1">#</th>
                <th>Pseudo</th>
                <th className="text-right">Score</th>
                <th className="hidden sm:table-cell">E-mail</th>
                <th className="hidden text-right sm:table-cell">Heure</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.pseudo}-${r.created_at}`} className="border-t border-cream/5 text-cream/85">
                  <td className="py-1.5">{i + 1}</td>
                  <td>
                    {r.pseudo}
                    <span className="block text-[11px] text-cream/40 sm:hidden">{r.email ?? '—'}</span>
                  </td>
                  <td className="text-right tabular-nums">{r.score.toLocaleString('fr-FR')}</td>
                  <td className="hidden sm:table-cell">
                    {r.email ? <a href={`mailto:${r.email}`} className="text-gold underline">{r.email}</a> : <span className="text-cream/30">—</span>}
                  </td>
                  <td className="hidden text-right text-xs text-cream/45 sm:table-cell">
                    {new Date(r.created_at).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
