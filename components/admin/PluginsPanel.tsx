'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Check,
  ChevronDown,
  Download,
  Layers,
  ListChecks,
  Loader2,
  RefreshCw,
  RotateCcw,
  TriangleAlert,
  X,
} from 'lucide-react';
import type { PluginStats } from '@/lib/pluginRequests';
import type { PluginConfig } from '@/lib/pluginConfig';
import { merge, type PluginOverride } from '@/lib/pluginMerge';
import { ALL_PLUGINS, OS_LABEL, SUITE, pluginImage, r2Key, type OS, type Plugin } from '@/lib/plugins';

type Services = {
  resend: boolean;
  r2: boolean;
  turnstile: boolean;
  jetons: boolean;
  supabase: boolean;
  dernierEchecEmail: { at: string; reason: string } | null;
};

/** Éléments éditables : les plugins, puis l'installateur de toute la suite. */
const EDITABLES: Plugin[] = SUITE ? [...ALL_PLUGINS, SUITE] : ALL_PLUGINS;
const OSES: OS[] = ['macos', 'windows'];
const nomDe = (slug: string) => EDITABLES.find((p) => p.slug === slug)?.name ?? slug;

/* ═════════════════════════════════════════════════════ petits composants */

const CARTE = 'rounded-2xl border border-cream/12 bg-cream/[0.04]';
const TITRE = 'text-xs font-semibold uppercase tracking-wider text-gold';

/** Champ texte compact ; le placeholder montre la valeur par défaut. */
function Field({
  label,
  value,
  placeholder,
  onChange,
  mono,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  mono?: boolean;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-cream/45">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl border border-cream/15 bg-night-deep/60 px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:border-gold focus:outline-none ${
          mono ? 'font-mono text-[13px]' : ''
        }`}
      />
    </label>
  );
}

/** Interrupteur « en ligne ». */
function Switch({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-6 w-11 flex-none rounded-full transition-colors ${checked ? 'bg-teal' : 'bg-cream/15'}`}
    >
      <span
        className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-cream shadow transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

/** Contrôle segmenté (onglets internes, choix d'OS). */
function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = 'md',
}: {
  value: T;
  options: { id: T; label: string; icon?: React.ElementType }[];
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <div role="tablist" className="flex rounded-full border border-cream/12 bg-night-deep/50 p-1">
      {options.map((o) => {
        const actif = o.id === value;
        const Icone = o.icon;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={actif}
            onClick={() => onChange(o.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full font-semibold transition-colors ${
              size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'
            } ${actif ? 'bg-cream text-night' : 'text-cream/60 hover:text-cream'}`}
          >
            {Icone && <Icone className="h-4 w-4" aria-hidden />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Vignette d'un élément du catalogue. */
function Vignette({ p }: { p: Plugin }) {
  if (p.slug === SUITE?.slug) {
    return (
      <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-gradient-to-br from-magenta via-coral to-gold text-night">
        <Layers className="h-5 w-5" aria-hidden />
      </span>
    );
  }
  return (
    <Image
      src={pluginImage(p.slug, 'icon-512.webp')}
      alt=""
      width={512}
      height={512}
      sizes="40px"
      className="h-10 w-10 flex-none rounded-xl"
    />
  );
}

/** Une surcharge contient-elle autre chose que des champs vides ? */
function aDesSurcharges(o?: PluginOverride): boolean {
  if (!o) return false;
  if (o.version || o.folder) return true;
  return OSES.some((os) => {
    const d = o.downloads?.[os];
    return Boolean(d && (d.file || d.bytes != null || d.requirements || d.formats?.length));
  });
}

/* ═══════════════════════════════════════════════════════════ panneau */

type Vue = 'catalogue' | 'stats';

/** Onglet « Plugins » de l'admin : catalogue (publication, versions, fichiers) et statistiques. */
export default function PluginsPanel() {
  const [stats, setStats] = useState<PluginStats | null>(null);
  const [config, setConfig] = useState<PluginConfig | null>(null);
  const [saved, setSaved] = useState('');
  const [services, setServices] = useState<Services | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);
  const [vue, setVue] = useState<Vue>('catalogue');
  const [ouvert, setOuvert] = useState<string | null>(null);

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
        setSaved(JSON.stringify(data.config ?? null));
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

  const dirty = config !== null && JSON.stringify(config) !== saved;

  // Prévenir avant de quitter la page avec des modifications non publiées.
  useEffect(() => {
    if (!dirty) return;
    const avant = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', avant);
    return () => window.removeEventListener('beforeunload', avant);
  }, [dirty]);

  const montrer = (ok: boolean, text: string) => {
    setFlash({ ok, text });
    setTimeout(() => setFlash(null), 3500);
  };

  const save = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/plugins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        setSaved(JSON.stringify(config));
        montrer(true, 'Publié en ligne');
      } else montrer(false, data.error || 'Échec de la publication');
    } catch {
      montrer(false, 'Échec de la publication');
    } finally {
      setSaving(false);
    }
  };

  const annuler = () => setConfig(saved ? (JSON.parse(saved) as PluginConfig) : null);

  /** Modifie la surcharge d'un élément sans toucher au reste. */
  const patch = (slug: string, change: (o: PluginOverride) => void) =>
    setConfig((c) => {
      if (!c) return c;
      const bySlug = { ...c.bySlug };
      const entry = structuredClone(bySlug[slug] ?? {});
      change(entry);
      bySlug[slug] = entry;
      return { ...c, bySlug };
    });

  const reinitialiser = (slug: string) =>
    setConfig((c) => {
      if (!c) return c;
      const bySlug = { ...c.bySlug };
      delete bySlug[slug];
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

  /** Déplace un plugin en ligne d'un cran : l'ordre est celui du site. */
  const deplacer = (slug: string, sens: -1 | 1) =>
    setConfig((c) => {
      if (!c) return c;
      const ordre = c.published.filter((s) => s !== SUITE?.slug);
      const i = ordre.indexOf(slug);
      const j = i + sens;
      if (i < 0 || j < 0 || j >= ordre.length) return c;
      [ordre[i], ordre[j]] = [ordre[j], ordre[i]];
      const suite = c.published.filter((s) => s === SUITE?.slug);
      return { ...c, published: [...ordre, ...suite] };
    });

  /** Passe tous les éléments en ligne à une même version (cas d'une release de la suite). */
  const appliquerVersion = (version: string) =>
    setConfig((c) => {
      if (!c) return c;
      const bySlug = { ...c.bySlug };
      for (const slug of c.published) bySlug[slug] = { ...structuredClone(bySlug[slug] ?? {}), version };
      return { ...c, bySlug };
    });

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-cream/55">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Chargement…
      </p>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-magenta/40 bg-magenta/10 px-4 py-3 text-sm text-magenta-soft">{error}</div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {services && <EtatServices services={services} />}

      <Segmented
        value={vue}
        onChange={setVue}
        options={[
          { id: 'catalogue', label: 'Catalogue', icon: ListChecks },
          { id: 'stats', label: 'Statistiques', icon: BarChart3 },
        ]}
      />

      {vue === 'catalogue' && config && (
        <Catalogue
          config={config}
          ouvert={ouvert}
          setOuvert={setOuvert}
          patch={patch}
          reinitialiser={reinitialiser}
          togglePublished={togglePublished}
          deplacer={deplacer}
          appliquerVersion={appliquerVersion}
        />
      )}
      {vue === 'catalogue' && !config && (
        <p className="text-sm text-cream/55">Configuration indisponible (Supabase non configuré).</p>
      )}

      {vue === 'stats' && (stats ? (
        <Statistiques
          stats={stats}
          // Recharger relit aussi la configuration : ne pas perdre des modifications en cours.
          onRefresh={() => {
            if (!dirty || window.confirm('Abandonner les modifications non publiées du catalogue ?')) load();
          }}
        />
      ) : (
        <p className="text-sm text-cream/55">Aucune donnée pour l’instant.</p>
      ))}

      {/* Barre de publication : visible dès qu'il y a des modifications */}
      {(dirty || flash) && (
        <div className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-cream/15 bg-night-deep/95 px-4 py-3 shadow-2xl shadow-black/60 backdrop-blur-md sm:bottom-6">
          {dirty ? (
            <>
              <span className="min-w-0 flex-1 text-sm text-cream/80">Modifications non publiées</span>
              <button
                type="button"
                onClick={annuler}
                disabled={saving}
                className="rounded-full px-3 py-2 text-sm font-semibold text-cream/60 hover:text-cream"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-magenta to-coral px-5 py-2 text-sm font-bold text-night disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                Publier
              </button>
            </>
          ) : (
            flash && (
              <span className={`flex items-center gap-2 text-sm font-medium ${flash.ok ? 'text-teal-soft' : 'text-magenta-soft'}`}>
                {flash.ok ? <Check className="h-4 w-4" aria-hidden /> : <X className="h-4 w-4" aria-hidden />}
                {flash.text}
              </span>
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════════════ état des services */

function EtatServices({ services }: { services: Services }) {
  const liste: [string, boolean][] = [
    ['Email', services.resend],
    ['Fichiers R2', services.r2],
    ['Captcha', services.turnstile],
    ['Liens signés', services.jetons],
    ['Supabase', services.supabase],
  ];
  const enPanne = liste.filter(([, ok]) => !ok);
  return (
    <div className="space-y-2">
      <ul className="flex flex-wrap gap-1.5">
        {liste.map(([label, ok]) => (
          <li
            key={label}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
              ok ? 'border-cream/10 text-cream/55' : 'border-magenta/40 bg-magenta/10 text-magenta-soft'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-teal-soft' : 'bg-magenta-soft'}`} />
            {label}
          </li>
        ))}
      </ul>
      {enPanne.length > 0 && (
        <p className="text-xs text-magenta-soft">
          Service inactif : vérifie ses variables d’environnement sur Vercel.
        </p>
      )}
      {services.dernierEchecEmail && (
        <p className="flex items-start gap-2 rounded-xl border border-magenta/40 bg-magenta/10 px-4 py-3 text-sm text-magenta-soft">
          <TriangleAlert className="mt-0.5 h-4 w-4 flex-none" aria-hidden />
          <span>
            <strong className="font-bold">Dernier échec d’envoi</strong> (
            {new Date(services.dernierEchecEmail.at).toLocaleString('fr-FR')}) : {services.dernierEchecEmail.reason}
          </span>
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ catalogue */

function Catalogue({
  config,
  ouvert,
  setOuvert,
  patch,
  reinitialiser,
  togglePublished,
  deplacer,
  appliquerVersion,
}: {
  config: PluginConfig;
  ouvert: string | null;
  setOuvert: (s: string | null) => void;
  patch: (slug: string, change: (o: PluginOverride) => void) => void;
  reinitialiser: (slug: string) => void;
  togglePublished: (slug: string) => void;
  deplacer: (slug: string, sens: -1 | 1) => void;
  appliquerVersion: (v: string) => void;
}) {
  const [release, setRelease] = useState('');

  // En ligne d'abord, dans l'ordre du site ; puis le reste, puis la suite.
  const { enLigne, horsLigne, suite } = useMemo(() => {
    const plugins = EDITABLES.filter((p) => p.slug !== SUITE?.slug);
    return {
      enLigne: config.published
        .map((s) => plugins.find((p) => p.slug === s))
        .filter((p): p is Plugin => Boolean(p)),
      horsLigne: plugins.filter((p) => !config.published.includes(p.slug)),
      suite: SUITE,
    };
  }, [config.published]);

  const nbEnLigne = config.published.length;
  const versionValide = /^\d+\.\d+\.\d+$/.test(release.trim());

  const ligne = (p: Plugin, position?: { i: number; n: number }) => (
    <LignePlugin
      key={p.slug}
      plugin={p}
      override={config.bySlug[p.slug]}
      enLigne={config.published.includes(p.slug)}
      ouvert={ouvert === p.slug}
      onToggle={() => setOuvert(ouvert === p.slug ? null : p.slug)}
      onPublish={() => togglePublished(p.slug)}
      patch={(change) => patch(p.slug, change)}
      onReset={() => reinitialiser(p.slug)}
      position={position}
      onMove={(sens) => deplacer(p.slug, sens)}
    />
  );

  return (
    <div className="space-y-4">
      {/* Release : une version pour tout ce qui est en ligne */}
      <div className={`${CARTE} p-4`}>
        <p className={TITRE}>Nouvelle release</p>
        <p className="mt-1 text-xs text-cream/50">
          Passe les {nbEnLigne} éléments en ligne à une même version. Les noms de fichiers suivent
          (FrenchFilter-<span className="text-cream/70">version</span>-macOS.pkg).
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={release}
            onChange={(e) => setRelease(e.target.value)}
            placeholder="0.2.0"
            inputMode="decimal"
            className="w-28 rounded-xl border border-cream/15 bg-night-deep/60 px-3 py-2 font-mono text-sm text-cream placeholder:text-cream/30 focus:border-gold focus:outline-none"
          />
          <button
            type="button"
            disabled={!versionValide || nbEnLigne === 0}
            onClick={() => {
              appliquerVersion(release.trim());
              setRelease('');
            }}
            className="flex-1 rounded-full border border-gold/50 px-4 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold/10 disabled:border-cream/10 disabled:text-cream/30 disabled:hover:bg-transparent sm:flex-none"
          >
            Appliquer aux {nbEnLigne} en ligne
          </button>
        </div>
      </div>

      {/* Liste */}
      <Groupe titre={`En ligne · ${enLigne.length}`}>
        {enLigne.length === 0 ? (
          <p className="px-4 py-3 text-sm text-cream/45">Aucun plugin en ligne.</p>
        ) : (
          enLigne.map((p, i) => ligne(p, { i, n: enLigne.length }))
        )}
      </Groupe>

      {suite && <Groupe titre="Installateur complet">{ligne(suite)}</Groupe>}

      {horsLigne.length > 0 && <Groupe titre={`Hors ligne · ${horsLigne.length}`}>{horsLigne.map((p) => ligne(p))}</Groupe>}
    </div>
  );
}

function Groupe({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-cream/40">{titre}</p>
      <div className={`${CARTE} divide-y divide-cream/[0.08] overflow-hidden`}>{children}</div>
    </section>
  );
}

function LignePlugin({
  plugin,
  override,
  enLigne,
  ouvert,
  onToggle,
  onPublish,
  patch,
  onReset,
  position,
  onMove,
}: {
  plugin: Plugin;
  override?: PluginOverride;
  enLigne: boolean;
  ouvert: boolean;
  onToggle: () => void;
  onPublish: () => void;
  patch: (change: (o: PluginOverride) => void) => void;
  onReset: () => void;
  position?: { i: number; n: number };
  onMove: (sens: -1 | 1) => void;
}) {
  const [os, setOs] = useState<OS>('macos');
  const effectif = merge(plugin, override);
  const modifie = aDesSurcharges(override);
  const o = override ?? {};
  const d = o.downloads?.[os] ?? {};
  const base = effectif.downloads[os];

  const setDl = (champ: 'file' | 'bytes' | 'requirements' | 'formats', valeur: unknown) =>
    patch((e) => {
      e.downloads = { ...e.downloads, [os]: { ...e.downloads?.[os], [champ]: valeur } };
    });

  return (
    <div>
      {/* Ligne repliée */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={ouvert}>
          <Vignette p={plugin} />
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="truncate font-semibold text-cream">{plugin.name}</span>
              {modifie && (
                <span className="flex-none rounded-full bg-gold/15 px-1.5 py-px text-[10px] font-semibold text-gold">modifié</span>
              )}
            </span>
            <span className="block truncate font-mono text-[11px] text-cream/40">
              {r2Key(effectif, 'macos').replace(/\/[^/]*$/, '/')}
            </span>
          </span>
        </button>
        <Switch checked={enLigne} onChange={onPublish} label={`${plugin.name} en ligne`} />
        <button
          type="button"
          onClick={onToggle}
          aria-label={ouvert ? 'Replier' : 'Modifier'}
          className="grid h-8 w-8 flex-none place-items-center rounded-full text-cream/45 hover:bg-cream/10 hover:text-cream"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${ouvert ? 'rotate-180' : ''}`} aria-hidden />
        </button>
      </div>

      {/* Édition */}
      {ouvert && (
        <div className="space-y-4 border-t border-cream/[0.08] bg-night-deep/30 px-4 pb-4 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Version"
              value={o.version ?? ''}
              placeholder={plugin.version}
              mono
              onChange={(v) => patch((e) => { e.version = v.trim() || undefined; })}
            />
            <Field
              label="Dossier R2"
              value={o.folder ?? ''}
              placeholder={plugin.r2Folder ?? plugin.slug}
              mono
              onChange={(v) => patch((e) => { e.folder = v.trim() || undefined; })}
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-cream/45">Fichiers</p>
              <div className="w-48">
                <Segmented
                  size="sm"
                  value={os}
                  onChange={setOs}
                  options={OSES.map((x) => ({ id: x, label: OS_LABEL[x] }))}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nom du fichier" value={d.file ?? ''} placeholder={base.file} mono onChange={(v) => setDl('file', v.trim() || undefined)} />
              <Field
                label="Taille en octets"
                value={d.bytes != null ? String(d.bytes) : ''}
                placeholder={base.bytes != null ? String(base.bytes) : 'masquée'}
                mono
                onChange={(v) => {
                  const n = Number(v);
                  setDl('bytes', v && Number.isFinite(n) ? n : undefined);
                }}
              />
              <Field label="Configuration requise" value={d.requirements ?? ''} placeholder={base.requirements} onChange={(v) => setDl('requirements', v || undefined)} />
              <Field
                label="Formats"
                value={d.formats?.join(', ') ?? ''}
                placeholder={base.formats.join(', ')}
                onChange={(v) => {
                  const list = v.split(',').map((f) => f.trim()).filter(Boolean);
                  setDl('formats', list.length ? list : undefined);
                }}
              />
            </div>
          </div>

          {/* Chemins réellement demandés à R2 */}
          <div className="rounded-xl border border-cream/10 bg-night-deep/50 px-3 py-2.5">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-cream/45">Chemins R2</p>
            {OSES.map((x) =>
              effectif.downloads[x]?.file ? (
                <p key={x} className="break-all font-mono text-[11px] leading-relaxed text-cream/70">
                  <span className="text-cream/35">{OS_LABEL[x]} </span>
                  {r2Key(effectif, x)}
                </p>
              ) : null,
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {position && (
              <>
                <span className="mr-1 text-xs text-cream/45">
                  Position {position.i + 1} / {position.n}
                </span>
                <button
                  type="button"
                  disabled={position.i === 0}
                  onClick={() => onMove(-1)}
                  className="inline-flex items-center gap-1 rounded-full border border-cream/15 px-3 py-1.5 text-xs font-semibold text-cream/70 hover:text-cream disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                  Monter
                </button>
                <button
                  type="button"
                  disabled={position.i === position.n - 1}
                  onClick={() => onMove(1)}
                  className="inline-flex items-center gap-1 rounded-full border border-cream/15 px-3 py-1.5 text-xs font-semibold text-cream/70 hover:text-cream disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                  Descendre
                </button>
              </>
            )}
            {modifie && (
              <button
                type="button"
                onClick={onReset}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-cream/50 hover:text-magenta-soft"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Valeurs par défaut
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ statistiques */

function Statistiques({ stats, onRefresh }: { stats: PluginStats; onRefresh: () => void }) {
  const [toutes, setToutes] = useState(false);
  const maxWeek = Math.max(1, ...stats.byWeek.map((w) => w.downloads));
  const parPlugin = Object.entries(stats.byPlugin).sort((a, b) => b[1] - a[1]);
  const maxPlugin = Math.max(1, ...parPlugin.map(([, n]) => n));
  const totalOS = Object.values(stats.byOS).reduce((a, b) => a + b, 0);
  const demandes = toutes ? stats.lastRequests : stats.lastRequests.slice(0, 5);
  const couleur = (slug: string) => EDITABLES.find((p) => p.slug === slug)?.colors.accent ?? '#E8487E';

  return (
    <div className="space-y-4">
      {/* Totaux */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: 'Demandes', value: stats.requests },
          { label: 'Téléchargés', value: stats.downloads },
          { label: 'Newsletter', value: stats.newsletterOptIn },
        ].map((k) => (
          <div key={k.label} className={`${CARTE} p-3 sm:p-5`}>
            <p className="font-display text-2xl font-bold tabular-nums text-gold sm:text-3xl">{k.value}</p>
            <p className="mt-0.5 truncate text-[10px] uppercase tracking-wider text-cream/50 sm:text-xs">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Par semaine */}
      <div className={`${CARTE} p-5`}>
        <p className={`${TITRE} mb-4`}>Téléchargements par semaine</p>
        {stats.byWeek.every((w) => w.downloads === 0) ? (
          <p className="text-sm text-cream/45">Aucun téléchargement sur les 12 dernières semaines</p>
        ) : (
          <div className="flex h-40 gap-1.5 sm:gap-2">
            {stats.byWeek.map((w) => (
              <div key={w.week} className="flex h-full min-w-0 flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] font-semibold tabular-nums text-cream/70">{w.downloads > 0 ? w.downloads : ''}</span>
                <div className="relative w-full flex-1 border-b border-cream/15">
                  <div
                    className="absolute inset-x-0 bottom-0 rounded-t bg-gradient-to-t from-magenta to-coral"
                    style={{ height: w.downloads > 0 ? `${Math.max(3, (w.downloads / maxWeek) * 100)}%` : 0 }}
                    title={`Semaine du ${new Date(w.week).toLocaleDateString('fr-FR')} : ${w.downloads}`}
                  />
                </div>
                <span className="text-[9px] tabular-nums text-cream/40 sm:text-[10px]">
                  {w.week.slice(8)}/{w.week.slice(5, 7)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-[3fr_2fr]">
        {/* Par plugin */}
        <div className={`${CARTE} p-5`}>
          <p className={`${TITRE} mb-3`}>Par plugin</p>
          {parPlugin.length === 0 ? (
            <p className="text-sm text-cream/45">Aucune donnée</p>
          ) : (
            <ul className="space-y-2.5">
              {parPlugin.map(([slug, n]) => (
                <li key={slug}>
                  <div className="mb-1 flex justify-between gap-3 text-sm">
                    <span className="truncate text-cream/80">{nomDe(slug)}</span>
                    <span className="font-semibold tabular-nums text-cream">{n}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-cream/[0.07]">
                    <div className="h-full rounded-full" style={{ width: `${(n / maxPlugin) * 100}%`, background: couleur(slug) }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Par système */}
        <div className={`${CARTE} p-5`}>
          <p className={`${TITRE} mb-3`}>Par système</p>
          {totalOS === 0 ? (
            <p className="text-sm text-cream/45">Aucune donnée</p>
          ) : (
            <>
              <div className="flex h-3 overflow-hidden rounded-full bg-cream/[0.07]">
                {OSES.map((os) => (
                  <div
                    key={os}
                    className={os === 'macos' ? 'bg-cream/80' : 'bg-teal'}
                    style={{ width: `${((stats.byOS[os] ?? 0) / totalOS) * 100}%` }}
                  />
                ))}
              </div>
              <ul className="mt-3 space-y-1.5 text-sm">
                {OSES.map((os) => {
                  const n = stats.byOS[os] ?? 0;
                  return (
                    <li key={os} className="flex items-center gap-2 text-cream/75">
                      <span className={`h-2 w-2 rounded-full ${os === 'macos' ? 'bg-cream/80' : 'bg-teal'}`} />
                      {OS_LABEL[os]}
                      <span className="ml-auto font-semibold tabular-nums text-cream">{n}</span>
                      <span className="w-10 text-right text-xs tabular-nums text-cream/40">{Math.round((n / totalOS) * 100)} %</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Dernières demandes */}
      <div className={`${CARTE} p-5`}>
        <p className={`${TITRE} mb-3`}>Dernières demandes</p>
        {stats.lastRequests.length === 0 ? (
          <p className="text-sm text-cream/45">Aucune donnée</p>
        ) : (
          <>
            <ul className="divide-y divide-cream/[0.07]">
              {demandes.map((r, i) => (
                <li key={`${r.email}-${i}`} className="py-2 first:pt-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-medium text-cream">{r.email}</span>
                    <span className="flex-none text-[11px] tabular-nums text-cream/35">
                      {new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="truncate text-xs text-cream/45">
                    {OS_LABEL[r.os as OS] ?? r.os} · {r.plugins.map(nomDe).join(', ')}
                  </p>
                </li>
              ))}
            </ul>
            {stats.lastRequests.length > 5 && (
              <button
                type="button"
                onClick={() => setToutes(!toutes)}
                className="mt-2 text-xs font-semibold text-gold hover:underline"
              >
                {toutes ? 'Réduire' : `Afficher les ${stats.lastRequests.length}`}
              </button>
            )}
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href="/api/admin/plugins?csv=1"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-magenta to-coral px-5 py-2.5 text-sm font-bold text-night"
        >
          <Download className="h-4 w-4" aria-hidden />
          Emails newsletter (CSV)
        </a>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-full border border-cream/20 px-5 py-2.5 text-sm font-semibold text-cream/75 hover:text-cream"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Rafraîchir
        </button>
      </div>
      <p className="text-xs text-cream/40">L’export ne contient que les adresses ayant explicitement coché la case newsletter.</p>
    </div>
  );
}
