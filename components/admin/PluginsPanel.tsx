'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PluginStats } from '@/lib/pluginRequests';
import type { PluginConfig } from '@/lib/pluginConfig';

type Services = {
  resend: boolean;
  r2: boolean;
  turnstile: boolean;
  jetons: boolean;
  supabase: boolean;
  dernierEchecEmail: { at: string; reason: string } | null;
};
import { ALL_PLUGINS, OS_LABEL, SUITE, type OS } from '@/lib/plugins';
import { Check, X } from 'lucide-react';

/** Éléments éditables : les plugins, puis l'installateur de toute la suite. */
const EDITABLES = SUITE ? [...ALL_PLUGINS, SUITE] : ALL_PLUGINS;

const OSES: OS[] = ['macos', 'windows'];

/** Champ texte compact de l'admin. */
function Field({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-cream/45">
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-cream/15 bg-night-deep/60 px-3 py-2 text-sm text-cream placeholder:text-cream/25 focus:border-gold focus:outline-none"
      />
    </label>
  );
}

/** Onglet « Plugins » de l'admin : lecture seule (demandes, téléchargements). */
export default function PluginsPanel() {
  const [stats, setStats] = useState<PluginStats | null>(null);
  const [config, setConfig] = useState<PluginConfig | null>(null);
  const [services, setServices] = useState<Services | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/plugins');
      const data = (await res.json().catch(() => ({}))) as {
        stats?: PluginStats;
        config?: PluginConfig;
        services?: Services;
        error?: string;
      };
      if (!res.ok) setError(data.error || 'Lecture impossible');
      else {
        setStats(data.stats ?? null);
        setConfig(data.config ?? null);
        setServices(data.services ?? null);
      }
    } catch {
      setError('Lecture impossible');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!config) return;
    setSaving(true);
    setFlash('');
    try {
      const res = await fetch('/api/admin/plugins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setFlash(res.ok ? 'Configuration publiée' : data.error || 'Échec de la sauvegarde');
    } catch {
      setFlash('Échec de la sauvegarde');
    } finally {
      setSaving(false);
      setTimeout(() => setFlash(''), 3000);
    }
  };

  /** Modifie la surcharge d'un plugin sans toucher au reste. */
  const patch = (slug: string, change: (o: NonNullable<PluginConfig['bySlug'][string]>) => void) =>
    setConfig((c) => {
      if (!c) return c;
      const bySlug = { ...c.bySlug };
      const entry = structuredClone(bySlug[slug] ?? {});
      change(entry);
      bySlug[slug] = entry;
      return { ...c, bySlug };
    });

  const togglePublished = (slug: string) =>
    setConfig((c) =>
      c
        ? {
            ...c,
            published: c.published.includes(slug)
              ? c.published.filter((s) => s !== slug)
              : [...c.published, slug],
          }
        : c,
    );

  if (loading) return <p className="text-sm text-cream/55">Chargement…</p>;
  if (error) {
    return (
      <div className="rounded-xl border border-magenta/40 bg-magenta/10 px-4 py-3 text-sm text-magenta-soft">
        {error}
      </div>
    );
  }
  if (!stats) return <p className="text-sm text-cream/55">Aucune donnée pour l’instant.</p>;

  const maxWeek = Math.max(1, ...stats.byWeek.map((w) => w.downloads));

  return (
    <div className="space-y-4">
      {/* ── État des services ──────────────────────────────────── */}
      {services && (
        <div className="rounded-2xl border border-cream/12 bg-cream/[0.04] p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gold">
            État des services
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {(
              [
                ['Email (Resend)', services.resend],
                ['Fichiers (R2)', services.r2],
                ['Captcha (Turnstile)', services.turnstile],
                ['Liens signés', services.jetons],
                ['Base (Supabase)', services.supabase],
              ] as [string, boolean][]
            ).map(([label, ok]) => (
              <li key={label} className="flex items-center gap-2 text-cream/75">
                {ok ? (
                  <Check className="h-4 w-4 text-teal-soft" aria-label="actif" />
                ) : (
                  <X className="h-4 w-4 text-magenta-soft" aria-label="inactif" />
                )}
                {label}
              </li>
            ))}
          </ul>
          {services.dernierEchecEmail && (
            <p className="mt-4 rounded-xl border border-magenta/40 bg-magenta/10 px-4 py-3 text-sm text-magenta-soft">
              <strong className="font-bold">Dernier échec d’envoi</strong> (
              {new Date(services.dernierEchecEmail.at).toLocaleString('fr-FR')}) :{' '}
              {services.dernierEchecEmail.reason}
            </p>
          )}
        </div>
      )}

      {/* ── Configuration éditable ─────────────────────────────── */}
      {config && (
        <div className="rounded-2xl border border-gold/25 bg-gold/[0.05] p-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gold">
            Configuration des plugins
          </p>
          <p className="mb-4 text-xs text-cream/45">
            Les champs vides reprennent les valeurs par défaut du projet groove-knobs.
            Le chemin du fichier dans R2 est{' '}
            <code className="text-cream/60">dossier/version/fichier</code> ; le dossier vaut
            le slug si le champ est vide (groove-knobs pour la suite).
          </p>

          <div className="space-y-4">
            {EDITABLES.map((p) => {
              const o = config.bySlug[p.slug] ?? {};
              const enLigne = config.published.includes(p.slug);
              return (
                <div key={p.slug} className="rounded-xl border border-cream/12 bg-night-deep/40 p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <span className="font-display text-lg font-bold text-cream">{p.name}</span>
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-cream/70">
                      <input
                        type="checkbox"
                        checked={enLigne}
                        onChange={() => togglePublished(p.slug)}
                        className="h-4 w-4 accent-gold"
                      />
                      En ligne
                    </label>
                    <span className="ml-auto text-[11px] text-cream/35">
                      défaut : v{p.version}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Version"
                      value={o.version ?? ''}
                      placeholder={p.version}
                      onChange={(v) => patch(p.slug, (e) => { e.version = v || undefined; })}
                    />
                    <Field
                      label="Dossier R2"
                      value={o.folder ?? ''}
                      placeholder={p.r2Folder ?? p.slug}
                      onChange={(v) => patch(p.slug, (e) => { e.folder = v.trim() || undefined; })}
                    />
                  </div>
                  <p className="mt-2 font-mono text-[11px] text-cream/40">
                    {(o.folder || p.r2Folder || p.slug).replace(/^\/+|\/+$/g, '')}/{o.version || p.version}/
                    {o.downloads?.macos?.file || p.downloads.macos.file}
                  </p>

                  {OSES.map((os) => {
                    const d = o.downloads?.[os] ?? {};
                    const base = p.downloads[os];
                    return (
                      <div key={os} className="mt-3 grid gap-3 border-t border-cream/10 pt-3 sm:grid-cols-2">
                        <p className="sm:col-span-2 text-[11px] font-semibold uppercase tracking-wider text-cream/45">
                          {OS_LABEL[os]}
                        </p>
                        <Field
                          label="Fichier"
                          value={d.file ?? ''}
                          placeholder={base.file}
                          onChange={(v) =>
                            patch(p.slug, (e) => {
                              e.downloads = { ...e.downloads, [os]: { ...e.downloads?.[os], file: v || undefined } };
                            })
                          }
                        />
                        <Field
                          label="Taille en octets (vide = masquée)"
                          value={d.bytes != null ? String(d.bytes) : ''}
                          placeholder={base.bytes != null ? String(base.bytes) : '—'}
                          onChange={(v) =>
                            patch(p.slug, (e) => {
                              const n = Number(v);
                              e.downloads = {
                                ...e.downloads,
                                [os]: { ...e.downloads?.[os], bytes: v && Number.isFinite(n) ? n : undefined },
                              };
                            })
                          }
                        />
                        <Field
                          label="Configuration requise"
                          value={d.requirements ?? ''}
                          placeholder={base.requirements}
                          onChange={(v) =>
                            patch(p.slug, (e) => {
                              e.downloads = { ...e.downloads, [os]: { ...e.downloads?.[os], requirements: v || undefined } };
                            })
                          }
                        />
                        <Field
                          label="Formats (séparés par des virgules)"
                          value={d.formats?.join(', ') ?? ''}
                          placeholder={base.formats.join(', ')}
                          onChange={(v) =>
                            patch(p.slug, (e) => {
                              const list = v.split(',').map((f) => f.trim()).filter(Boolean);
                              e.downloads = {
                                ...e.downloads,
                                [os]: { ...e.downloads?.[os], formats: list.length ? list : undefined },
                              };
                            })
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-full bg-gradient-to-r from-magenta to-coral px-5 py-2.5 text-sm font-bold text-night disabled:opacity-60"
            >
              {saving ? 'Publication…' : 'Publier la configuration'}
            </button>
            {flash && <span className="text-sm font-medium text-gold">{flash}</span>}
          </div>
        </div>
      )}

      {/* Totaux */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Demandes', value: stats.requests },
          { label: 'Téléchargements', value: stats.downloads },
          { label: 'Opt-in newsletter', value: stats.newsletterOptIn },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-cream/12 bg-cream/[0.04] p-5">
            <p className="font-display text-3xl font-bold text-gold">{k.value}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-cream/50">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Par plugin / par OS */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-cream/12 bg-cream/[0.04] p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gold">Par plugin</p>
          {Object.keys(stats.byPlugin).length === 0 ? (
            <p className="text-sm text-cream/45">Aucune donnée</p>
          ) : (
            <ul className="space-y-1.5 text-sm text-cream/80">
              {Object.entries(stats.byPlugin)
                .sort((a, b) => b[1] - a[1])
                .map(([slug, n]) => (
                  <li key={slug} className="flex justify-between gap-3">
                    <span>{EDITABLES.find((p) => p.slug === slug)?.name ?? slug}</span>
                    <span className="font-semibold text-cream">{n}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-cream/12 bg-cream/[0.04] p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gold">Par système</p>
          {Object.keys(stats.byOS).length === 0 ? (
            <p className="text-sm text-cream/45">Aucune donnée</p>
          ) : (
            <ul className="space-y-1.5 text-sm text-cream/80">
              {Object.entries(stats.byOS).map(([os, n]) => (
                <li key={os} className="flex justify-between gap-3">
                  <span>{OS_LABEL[os as OS] ?? os}</span>
                  <span className="font-semibold text-cream">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Par semaine */}
      <div className="rounded-2xl border border-cream/12 bg-cream/[0.04] p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gold">
          Téléchargements par semaine
        </p>
        {stats.byWeek.every((w) => w.downloads === 0) ? (
          <p className="text-sm text-cream/45">Aucun téléchargement sur les 12 dernières semaines</p>
        ) : (
          <div className="flex h-40 gap-2">
            {stats.byWeek.map((w) => (
              <div key={w.week} className="flex h-full min-w-0 flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] font-semibold tabular-nums text-cream/70">
                  {w.downloads > 0 ? w.downloads : ''}
                </span>
                {/* Zone de hauteur fixe : la barre y prend un pourcentage réel */}
                <div className="relative w-full flex-1 border-b border-cream/15">
                  <div
                    className="absolute inset-x-0 bottom-0 rounded-t bg-gradient-to-t from-magenta to-coral"
                    style={{ height: w.downloads > 0 ? `${Math.max(3, (w.downloads / maxWeek) * 100)}%` : 0 }}
                    title={`Semaine du ${new Date(w.week).toLocaleDateString('fr-FR')} : ${w.downloads}`}
                  />
                </div>
                <span className="text-[10px] tabular-nums text-cream/40">
                  {w.week.slice(8)}/{w.week.slice(5, 7)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dernières demandes */}
      <div className="rounded-2xl border border-cream/12 bg-cream/[0.04] p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gold">
          Dernières demandes
        </p>
        {stats.lastRequests.length === 0 ? (
          <p className="text-sm text-cream/45">Aucune donnée</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {stats.lastRequests.map((r, i) => (
              <li key={`${r.email}-${i}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-cream/75">
                <span className="font-medium text-cream">{r.email}</span>
                <span className="text-cream/45">{r.plugins.join(', ')}</span>
                <span className="text-cream/45">{OS_LABEL[r.os as OS] ?? r.os}</span>
                <span className="ml-auto text-xs text-cream/35">
                  {new Date(r.created_at).toLocaleString('fr-FR')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href="/api/admin/plugins?csv=1"
          className="rounded-full bg-gradient-to-r from-magenta to-coral px-5 py-2.5 text-sm font-bold text-night"
        >
          Exporter les emails opt-in (CSV)
        </a>
        <button
          type="button"
          onClick={load}
          className="rounded-full border border-cream/20 px-5 py-2.5 text-sm font-semibold text-cream/75 hover:text-cream"
        >
          Rafraîchir
        </button>
      </div>
      <p className="text-xs text-cream/40">
        L’export ne contient que les adresses ayant explicitement coché la case newsletter.
      </p>
    </div>
  );
}
