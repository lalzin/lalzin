'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PluginStats } from '@/lib/pluginRequests';
import { OS_LABEL, getPlugin, type OS } from '@/lib/plugins';

/** Onglet « Plugins » de l'admin : lecture seule (demandes, téléchargements). */
export default function PluginsPanel() {
  const [stats, setStats] = useState<PluginStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/plugins');
      const data = (await res.json().catch(() => ({}))) as { stats?: PluginStats; error?: string };
      if (!res.ok) setError(data.error || 'Lecture impossible');
      else setStats(data.stats ?? null);
    } catch {
      setError('Lecture impossible');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
                    <span>{getPlugin(slug)?.name ?? slug}</span>
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
        {stats.byWeek.length === 0 ? (
          <p className="text-sm text-cream/45">Aucune donnée</p>
        ) : (
          <div className="flex h-32 items-end gap-2">
            {stats.byWeek.map((w) => (
              <div key={w.week} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-magenta to-coral"
                  style={{ height: `${Math.max(4, (w.downloads / maxWeek) * 100)}%` }}
                  title={`${w.week} : ${w.downloads}`}
                />
                <span className="text-[10px] text-cream/40">{w.week.slice(5)}</span>
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
