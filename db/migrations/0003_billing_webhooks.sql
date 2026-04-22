create table if not exists public.billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  status text not null check (status in ('processing', 'processed', 'failed', 'ignored')),
  payload jsonb not null,
  error text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.account_entitlements
  add column if not exists billing_status text,
  add column if not exists last_stripe_event_id text;

create index if not exists billing_webhook_events_status_idx
  on public.billing_webhook_events(status, created_at desc);
