create table if not exists public.profiles (
 "userId" uuid primary key references auth.users(id) on delete cascade,
 nickname text not null check (char_length(nickname) between 1 and 20),
 gender text not null check (gender in ('female','male')),
 "birthYear" integer not null check ("birthYear" between 1900 and 2200),
 vocative text not null,
 "relationshipTier" text not null default 'standard' check ("relationshipTier" in ('standard','vip_dad','vip_owner','vip_jangmi')),
 "createdAt" timestamptz not null default now(),
 "updatedAt" timestamptz not null default now()
);
alter table public.profiles enable row level security;
-- All reads/writes use the authenticated server route. No public profile enumeration or client VIP writes.
revoke all on public.profiles from anon, authenticated;
grant select, insert, update on public.profiles to service_role;
-- Future per-user tables should reference profiles("userId"), without expanding this pass.
