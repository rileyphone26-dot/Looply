-- Looply / Nova TikTok OAuth storage
-- Run this migration in the Supabase SQL Editor before deploying the Edge Function.
-- Access and refresh tokens are intentionally never exposed through client-side SELECT policies.

create table if not exists public.tiktok_oauth_states (
  state text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists tiktok_oauth_states_expires_at_idx
  on public.tiktok_oauth_states (expires_at);

create table if not exists public.tiktok_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  open_id text not null,
  display_name text,
  avatar_url text,
  access_token text not null,
  refresh_token text not null,
  access_token_expires_at timestamptz not null,
  refresh_token_expires_at timestamptz not null,
  scope text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.tiktok_oauth_states enable row level security;
alter table public.tiktok_connections enable row level security;

-- No client policies are created. Only the Edge Function's service-role client
-- can read/write these tables; never expose the service-role key in the website.
revoke all on public.tiktok_oauth_states from anon, authenticated;
revoke all on public.tiktok_connections from anon, authenticated;
grant all on public.tiktok_oauth_states to service_role;
grant all on public.tiktok_connections to service_role;

-- Periodically remove abandoned OAuth states (optional; the function also checks expiry).
