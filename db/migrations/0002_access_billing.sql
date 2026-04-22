create type public.plan_tier as enum ('free', 'trial', 'pro', 'business', 'internal');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete');
create type public.usage_event_type as enum ('increment', 'set', 'decrement');

create table if not exists public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'stripe',
  external_customer_id text not null,
  created_at timestamptz not null default now(),
  unique (provider, external_customer_id),
  unique (user_id, provider)
);

create table if not exists public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'stripe',
  external_subscription_id text,
  plan public.plan_tier not null default 'free',
  status public.subscription_status not null default 'active',
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists billing_subscriptions_user_idx
  on public.billing_subscriptions(user_id, created_at desc);

create table if not exists public.billing_entitlement_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  feature_key text not null,
  enabled boolean not null,
  reason text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, feature_key)
);

create table if not exists public.billing_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  metric text not null,
  quantity integer not null default 1,
  event_type public.usage_event_type not null default 'increment',
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists billing_usage_events_user_metric_idx
  on public.billing_usage_events(user_id, metric, occurred_at desc);

alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.connectors enable row level security;
alter table public.billing_subscriptions enable row level security;
alter table public.billing_entitlement_overrides enable row level security;
alter table public.billing_usage_events enable row level security;

create policy if not exists projects_owner_read_write on public.projects
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy if not exists tasks_owner_project_scope on public.tasks
  for all
  using (
    exists (
      select 1
      from public.projects p
      where p.id = tasks.project_id
        and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.projects p
      where p.id = tasks.project_id
        and p.owner_id = auth.uid()
    )
  );

create policy if not exists connectors_owner_read_write on public.connectors
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy if not exists billing_subscriptions_owner_read on public.billing_subscriptions
  for select
  using (user_id = auth.uid());

create policy if not exists billing_entitlement_overrides_owner_read on public.billing_entitlement_overrides
  for select
  using (user_id = auth.uid());

create policy if not exists billing_usage_events_owner_read on public.billing_usage_events
  for select
  using (user_id = auth.uid());
