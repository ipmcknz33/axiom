# Axiom Phase 1 Architecture

## Goals

Establish a production-grade foundation for a modular AI operating system with strict security boundaries and clean expansion paths.

## Layered structure

- `app/`: Next.js App Router UI and API route handlers.
- `components/`: UI components for dashboard and chat shell.
- `lib/`: shared utilities (lazy environment getters, API response contract, Supabase clients).
- `server/`: domain logic modules for orchestrator input contracts, governance services, persistence repositories, agent and connector registries, security policy, memory contracts.
- `db/`: SQL migration and schema planning docs.

## API-first phase 1 endpoints

- `GET /api/v1/auth/google/start`: starts Google OAuth and redirects to provider login.
- `GET /api/v1/auth/callback`: exchanges OAuth code, sets access/refresh session cookies, and redirects to protected workspace.
- `POST /api/v1/auth/signout`: clears access/refresh session cookies and redirects to sign-in page.
- `GET /api/v1/auth/session`: verifies current access token and returns authenticated user state for app-shell checks.
- `POST /api/v1/chat`: validates auth headers and orchestrator payload, enforces caller identity, emits audit events, and returns either dispatch intent or a pending approval response.
- `GET /api/v1/agents`: lists controlled agent templates.
- `GET /api/v1/connectors`: lists connector templates.
- `GET /api/v1/approvals`: authenticated approval queue endpoint backed by persisted records; owners can view their queue and admins can inspect any queue.
- `GET /api/v1/access`: centralized access/entitlement snapshot endpoint for role-aware plan, feature, and limit checks.
- `POST /api/billing/checkout-session`: authenticated Stripe checkout session creation for premium/pro/business upgrades.
- `POST /api/v1/billing/webhooks/stripe`: webhook-ready billing ingress scaffold for idempotent subscription sync flows.
- `POST /api/webhooks/stripe`: verified Stripe webhook ingestion endpoint with signature validation and idempotent transition processing.
- `GET /api/v1/projects`, `/tasks`, `/memory`: scaffolds to anchor phase 2 implementation.
- `GET /api/v1/health`: readiness endpoint returning env + database check details and HTTP `503` when degraded.

## Security posture in phase 1

- Explicit runtime guards for environment and orchestrator payload validation.
- No secrets rendered in client components.
- Auth context is supplied at the API boundary with `x-axiom-user-id` and optional `x-axiom-role` headers.
- Browser session gating is enforced for workspace routes via verified Supabase access tokens in httpOnly cookies.
- Payload `userId` must match the authenticated caller before orchestration dispatch is allowed.
- `requestedAction` is prechecked against high-risk policy rules and routed to pending approval when matched.
- Billing and access controls are centralized via plan/entitlement contracts so premium gating is not scattered across routes/components.
- Approval requests and audit events are persisted through Supabase-backed repositories.
- Audit events are standardized as `allowed`, `denied`, or `pending_approval` before any orchestration handoff.
- Route authorization decisions are centralized in reusable security policy modules for deterministic, testable access outcomes.
- Dependency failures in approvals/audit persistence are normalized to deterministic `503` responses with stable error codes.
- Route-level error handling preserves detailed messages for `4xx` validation/auth failures while returning a sanitized `request failed` message for `5xx` responses.
- Data model includes approvals and immutable audit log table from day one.

## Chat contract

- Required header: `x-axiom-user-id` must be a UUID.
- Optional header: `x-axiom-role` normalizes to `user`, `admin`, or `service`; unknown values fall back to `user`.
- Request body: `conversationId`, `message`, `userId`, and optional `requestedAction`.
- Valid requests return dispatch intent to `orchestrator.dispatch`.
- High-risk `requestedAction` values create a persisted approval row and return HTTP `202` with `next: approval.queue` and the approval record summary.
- Denied requests emit audit telemetry with a rejection reason and do not reach orchestration.

## Governance persistence

- `server/approvals/repository.ts` persists approval inserts and queue reads against `public.approvals`.
- `server/audit/repository.ts` persists audit telemetry against `public.audit_logs`.
- Service layers map database rows into stable domain contracts for routes and orchestrator handoff.

## Access and monetization foundation

- `db/migrations/0002_access_billing.sql` adds billing primitives (plans, subscriptions, entitlement overrides, usage events) and RLS seeds for ownership-based access.
- `server/billing/contracts.ts` defines centralized billing domain primitives: `Plan`, `FeatureKey`, `UsageMetric`, and `EntitlementSnapshot`.
- `server/billing/entitlements.ts` resolves free/trial/pro/business/internal entitlements with trial-expiry downgrade behavior and explicit internal bypass rules.
- `server/billing/repository.ts` provides a single state-loading path for active subscription, feature overrides, and usage counters.
- `lib/entitlements/access.ts` provides an app-shell focused access model with free/trial/premium/pro/business tiers, owner/internal override path, and 3-day trial handling.
- `GET /api/v1/access` is the centralized entitlement contract for UI/API consumers to prevent scattered feature gating logic.

## Phase 1.8 persisted entitlement enforcement

- `db/migrations/0002_entitlements.sql` introduces `public.account_entitlements` as canonical entitlement storage.
- `server/entitlements/repository.ts` loads entitlement rows and provisions default 3-day trial rows when missing.
- `server/entitlements/service.ts` resolves normalized access snapshots from persisted rows.
- `server/entitlements/context.ts` centralizes request identity resolution through session verification/refresh with legacy header fallback.
- `server/entitlements/guards.ts` centralizes reusable feature and active-access allow/deny decisions.
- Route-level enforcement now uses shared guards:
  - `POST /api/v1/chat` -> `advisor.advanced`
  - `GET /api/v1/connectors` -> `connectors.premium`
  - `GET /api/v1/memory` -> `memory.long_term`
- `/app` shell renders lock/unlock states through `app/components/access/feature-lock.tsx` based on resolved access state.

## Phase 1.9 webhook and billing transitions foundation

- `db/migrations/0003_billing_webhooks.sql` adds `billing_webhook_events` for webhook idempotency and extends `account_entitlements` with billing lifecycle metadata.
- `lib/stripe/env.ts` centralizes Stripe server-only env loading (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, optional plan price IDs).
- `server/billing/stripe/signature.ts` verifies Stripe signatures using HMAC SHA-256 and timing-safe comparison.
- `server/billing/stripe/plan-mapping.ts` centralizes plan -> price and price -> plan mapping for checkout creation and webhook reconciliation.
- `server/billing/stripe/mapping.ts` maps supported Stripe events into normalized entitlement transitions.
- `server/billing/stripe/processor.ts` executes begin -> map -> apply -> finalize workflow and dedupes duplicate event IDs.
- `server/billing/repository.ts` persists webhook event status (`processing|processed|failed|ignored`) and applies mapped transitions into `account_entitlements`.

## Phase 2.0 checkout activation

- `app/components/access/upgrade-button.tsx` provides reusable, actionable upgrade triggers from shell surfaces.
- Access panel and feature lock cards now call `POST /api/billing/checkout-session` and redirect to Stripe Checkout.
- `/app` handles return-state banners via `?billing=success|canceled` query params after checkout redirects.

## Auth and route protection

- Marketing and onboarding are separated from product workspace: `/` (landing), `/signin` (auth entry), `/app` (protected control plane).
- OAuth utilities are centralized under `server/auth/` and reusable across route handlers.
- Middleware preserves path telemetry headers while enforcing token verification-based access control for `/app`.
- Session lifecycle uses dual cookies (`axiom_access_token`, `axiom_refresh_token`) with centralized set/get/clear helpers.

## Phase 1.7 protected shell

- `/app` now acts as a premium shell with side navigation, advisor/dashboard composition, and centralized access-state presentation.
- Access and upgrade messaging is driven from shared entitlement snapshots, including trial and locked-state semantics.
- Permission explainability panels establish a foundation for high-risk capability consent UX.

## Planned phase 2 evolution

- Introduce worker execution plane and durable orchestration.
- Add full RLS policy matrix and tenant-aware permission model.
- Add connector OAuth flows and encrypted credential vault integration.
- Implement vector retrieval + memory ranking service.
