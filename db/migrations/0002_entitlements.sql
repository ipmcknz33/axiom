do $$ begin
  create type public.entitlement_plan as enum ('free', 'trial', 'premium', 'pro', 'business');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.entitlement_role as enum ('owner', 'admin', 'member', 'internal');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.entitlement_access_status as enum ('active', 'inactive', 'expired');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.account_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan public.entitlement_plan not null default 'trial',
  role public.entitlement_role not null default 'member',
  access_status public.entitlement_access_status not null default 'active',
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists account_entitlements_user_idx
  on public.account_entitlements(user_id);

alter table public.account_entitlements enable row level security;

create policy if not exists account_entitlements_owner_read
  on public.account_entitlements
  for select
  using (user_id = auth.uid());
