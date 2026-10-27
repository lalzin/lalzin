-- ════════════════════════════════════════════════════════════════════
--  LALZIN — Mini-jeux : tableau des scores
--  À exécuter dans Supabase → SQL Editor → New query → Run.
--  RLS activée, AUCUNE policy publique : seules les routes serveur
--  (clé service_role) lisent et écrivent cette table.
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.minigame_scores (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null,
  pseudo      text not null check (char_length(pseudo) between 2 and 16),
  score       integer not null check (score >= 0 and score <= 300000),
  levels      smallint not null check (levels between 0 and 20),
  duration_s  integer not null check (duration_s >= 0),
  ip_hash     text,
  created_at  timestamptz not null default now()
);

-- Classements (total et du jour) + anti-spam par IP
create index if not exists minigame_scores_rank_idx on public.minigame_scores (slug, score desc);
create index if not exists minigame_scores_day_idx on public.minigame_scores (slug, created_at desc);
create index if not exists minigame_scores_ip_idx on public.minigame_scores (ip_hash, created_at desc);

alter table public.minigame_scores enable row level security;

-- ── Cadeau du jour de sortie (2026-10) ────────────────────────────────
-- E-mail facultatif, demandé uniquement aux joueurs du Top 10, pour
-- contacter le n°1. Jamais renvoyé par l'API publique (admin seulement).
-- Ré-exécutable sans risque.
alter table public.minigame_scores add column if not exists email text
  check (email is null or char_length(email) <= 200);
alter table public.minigame_scores add column if not exists email_at timestamptz;
