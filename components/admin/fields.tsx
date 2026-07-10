'use client';

import { useRef, useState } from 'react';
import type { L } from '@/lib/content';

const inputCls =
  'w-full rounded-xl border border-cream/15 bg-night-deep/60 px-3 py-2 text-sm text-cream placeholder-cream/30 outline-none transition-colors focus:border-gold';

/** Redimensionne + compresse une image côté client en data URL (léger pour localStorage). */
function fileToDataUrl(file: File, max = 700): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > max) {
          height = Math.round((height * max) / width);
          width = max;
        } else if (height > max) {
          width = Math.round((width * max) / height);
          height = max;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Champ image : upload depuis le disque (converti en data URL) OU chemin/URL. */
export function ImageField({
  label,
  value,
  onChange,
  square,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  square?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      onChange(await fileToDataUrl(file));
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  };

  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gold">{label}</span>
      <div className="flex items-center gap-3">
        <div
          className={`flex-none overflow-hidden rounded-xl border border-cream/15 bg-night-deep/60 ${
            square ? 'h-16 w-16' : 'h-16 w-24'
          }`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-cream/30">—</div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={busy}
            className="rounded-lg bg-gradient-to-r from-magenta to-coral px-3 py-1.5 text-xs font-semibold text-night disabled:opacity-60"
          >
            {busy ? '…' : 'Uploader'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="rounded-lg border border-cream/15 px-3 py-1.5 text-xs text-cream/60 hover:text-coral"
            >
              Retirer
            </button>
          )}
          <input ref={ref} type="file" accept="image/*" className="hidden" onChange={onFile} />
        </div>
      </div>
      <input
        className={`${inputCls} mt-2 font-mono text-xs`}
        placeholder="ou colle un chemin / une URL"
        value={value?.startsWith('data:') ? '' : value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function Text({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-xs font-medium text-cream/60">{label}</span>}
      <input
        className={`${inputCls} ${mono ? 'font-mono text-xs' : ''}`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function Area({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-xs font-medium text-cream/60">{label}</span>}
      <textarea
        rows={3}
        className={`${inputCls} resize-none`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

/** Champ localisé FR / EN. */
export function LocalizedField({
  label,
  value,
  onChange,
  area,
}: {
  label: string;
  value: L;
  onChange: (v: L) => void;
  area?: boolean;
}) {
  const Comp = area ? Area : Text;
  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gold">{label}</span>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <span className="mb-1 block text-[10px] uppercase text-cream/40">FR</span>
          <Comp value={value.fr} onChange={(v) => onChange({ ...value, fr: v })} />
        </div>
        <div>
          <span className="mb-1 block text-[10px] uppercase text-cream/40">EN</span>
          <Comp value={value.en} onChange={(v) => onChange({ ...value, en: v })} />
        </div>
      </div>
    </div>
  );
}

export function Select({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-xs font-medium text-cream/60">{label}</span>}
      <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o} className="bg-night">
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ColorPair({
  value,
  onChange,
}: {
  value: [string, string];
  onChange: (v: [string, string]) => void;
}) {
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-cream/60">Couleurs (dégradé)</span>
      <div className="flex gap-2">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-1.5 rounded-xl border border-cream/15 bg-night-deep/60 px-2 py-1.5">
            <input
              type="color"
              value={value[i]}
              onChange={(e) => {
                const next = [...value] as [string, string];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="h-6 w-8 cursor-pointer rounded bg-transparent"
            />
            <span className="font-mono text-[10px] text-cream/50">{value[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-sm text-cream/80"
    >
      <span
        className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
          checked ? 'bg-gradient-to-r from-magenta to-coral' : 'bg-cream/15'
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-cream transition-transform ${checked ? 'translate-x-4' : ''}`}
        />
      </span>
      {label}
    </button>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3 rounded-2xl border border-cream/10 bg-cream/[0.03] p-4">{children}</div>;
}
