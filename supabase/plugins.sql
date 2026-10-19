-- ════════════════════════════════════════════════════════════════════
--  LALZIN — Groove Knobs : demandes et téléchargements de plugins
--  À exécuter dans Supabase → SQL Editor → New query → Run.
--  RLS activée, AUCUNE policy publique : seules les requêtes faites
--  côté serveur avec la clé service_role accèdent à ces tables.
-- ════════════════════════════════════════════════════════════════════

-- citext : emails insensibles à la casse (quota par email fiable)
create extension if not exists citext;

-- ── Demandes ────────────────────────────────────────────────────────
create table if not exists public.plugin_requests (
  id          uuid primary key default gen_random_uuid(),
  email       citext not null,
  plugins     text[] not null,
  os          text not null check (os in ('macos', 'windows')),
  lang        text not null default 'fr' check (lang in ('fr', 'en')),
  newsletter  boolean not null default false,
  consent_at  timestamptz,
  ip_hash     text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

-- Index servant les quotas anti-spam (5 / h / IP, 3 / jour / email)
create index if not exists plugin_requests_ip_created_idx
  on public.plugin_requests (ip_hash, created_at desc);
create index if not exists plugin_requests_email_created_idx
  on public.plugin_requests (email, created_at desc);
create index if not exists plugin_requests_newsletter_idx
  on public.plugin_requests (newsletter) where newsletter;

-- ── Téléchargements ─────────────────────────────────────────────────
create table if not exists public.plugin_downloads (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid references public.plugin_requests (id) on delete set null,
  plugin      text not null,
  os          text not null check (os in ('macos', 'windows')),
  version     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists plugin_downloads_plugin_idx
  on public.plugin_downloads (plugin, os);
create index if not exists plugin_downloads_created_idx
  on public.plugin_downloads (created_at desc);

-- ── Sécurité ────────────────────────────────────────────────────────
alter table public.plugin_requests  enable row level security;
alter table public.plugin_downloads enable row level security;

-- (Volontairement aucune policy : tout accès passe par la clé service_role,
--  qui contourne la RLS. Les clés anon/publishable ne voient rien.)

-- ── RGPD : purge au-delà de 24 mois ─────────────────────────────────
-- À lancer à la main de temps en temps, ou via un cron Supabase :
--   select cron.schedule('purge-plugins', '0 4 1 * *', $$select public.purge_old_plugin_data()$$);
create or replace function public.purge_old_plugin_data()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.plugin_downloads where created_at < now() - interval '24 months';
  delete from public.plugin_requests  where created_at < now() - interval '24 months';
$$;
