# Axiom Architecture

## Goals

Establish a production-grade foundation for a modular AI operating system with strict security boundaries, premium product presentation, and clean expansion paths.

## Layered structure

- `app/`: Next.js App Router UI and API route handlers.
- `components/`: UI components for dashboard and chat shell.
- `lib/`: shared utilities (lazy environment getters, API response contract, Supabase clients).
- `server/`: domain logic modules for orchestrator input contracts, governance services, persistence repositories, agent and connector registries, security policy, memory contracts.
- `db/`: SQL migration and schema planning docs.

## API-first phase 1 endpoints

- `POST /api/v1/auth/signout`: clears access/refresh session cookies and redirects to sign-in page.
- `GET /api/v1/auth/session`: verifies current access token and returns authenticated user state for app-shell checks.
- `POST /api/v1/chat`: validates auth headers and orchestrator payload, enforces caller identity, emits audit events, and returns either dispatch intent or a pending approval response.
- `GET /api/v1/agents`: lists controlled agent templates.
- `GET /api/v1/connectors`: lists connector templates.
- `GET /api/v1/approvals`: authenticated approval queue endpoint backed by persisted records; owners can view their queue and admins can inspect any queue.
- `GET /api/v1/access`: centralized access/entitlement snapshot endpoint for role-aware plan, feature, and limit checks.
- `GET /api/v1/entitlements/snapshot`: lightweight authenticated entitlement snapshot endpoint for demo shell gating.
- `POST /api/v1/rag/ingest`: authenticated RAG ingestion endpoint for document indexing.
- `GET /api/v1/rag/seed`: auto-seeds deterministic demo corpus and returns seed status.
- `POST /api/v1/rag/seed`: force reseed deterministic demo corpus for resettable demos.
- `POST /api/v1/ai/query`: authenticated orchestration pipeline endpoint with retrieval-augmented responses.
- `GET /api/v1/ai/metrics`: authenticated telemetry endpoint exposing AI runtime summary metrics and recent runs.
- `GET /api/v1/bots`: authenticated endpoint returning recent bot creation requests.
- `POST /api/v1/bots`: authenticated bot request validation and queuing endpoint.
- `GET /api/v1/projects`, `/tasks`, `/memory`: scaffolds to anchor phase 2 implementation.
- `GET /api/v1/health`: readiness endpoint returning env + database check details and HTTP `503` when degraded.

## Security posture in phase 1

- Explicit runtime guards for environment and orchestrator payload validation.
- No secrets rendered in client components.
- Auth context is supplied at the API boundary with `x-axiom-user-id` and optional `x-axiom-role` headers.
- Browser session gating is enforced for workspace routes via verified Supabase access tokens in httpOnly cookies.
- Payload `userId` must match the authenticated caller before orchestration dispatch is allowed.
- `requestedAction` is prechecked against high-risk policy rules and routed to pending approval when matched.
- Access controls are centralized in shared entitlement contracts so feature gating is not scattered across routes/components.
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

## Access foundation

- `db/migrations/0002_access_billing.sql` adds billing primitives (plans, subscriptions, entitlement overrides, usage events) and RLS seeds for ownership-based access.
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

## Demo entitlement model

- Entitlements are intentionally minimal in the demo shell: `free` and role-based `internal` override.
- `admin` and `service` authenticated roles resolve to internal-access snapshots with all features enabled.
- `user` role resolves to free access with `coming_soon` status and gated premium features.
- No checkout, subscription, external billing events, or webhook dependency exists in the active entitlement path.

## Auth and route protection

- Marketing and onboarding are separated from product workspace: `/` (landing), `/signin` (auth entry), `/app` (protected control plane).
- Runtime auth is session/header-context based for private demo access.
- Middleware preserves path telemetry headers while enforcing token verification-based access control for `/app`.
- Session lifecycle uses dual cookies (`axiom_access_token`, `axiom_refresh_token`) with centralized set/get/clear helpers.

## Phase 1.7 protected shell

- `/app` now acts as a premium shell with side navigation, advisor/dashboard composition, and centralized access-state presentation.
- Access state messaging is driven from shared entitlement snapshots, including locked-state semantics for demo users.
- Permission explainability panels establish a foundation for high-risk capability consent UX.

## AI assistant system

- `app/components/assistant/ai-assistant.tsx` provides a persistent floating assistant mounted at the root layout level, visible on every page.
- The assistant bubble sits bottom-right with a pulse-glow idle animation; clicking toggles a slide-in panel.
- Conversation history is persisted to `localStorage` under `axiom_assistant_messages` and survives full page reloads.
- Assistant prompts now call `/api/v1/ai/query`, which routes to the orchestrator and injects retrieved context from the in-memory RAG store.
- Response routing is intent-based with four delegation roles: `orchestrator`, `research`, `builder`, and `debugger`.
- On first mount, assistant calls `/api/v1/rag/seed` to guarantee seeded demo context without manual setup.
- Onboarding suggestions: `Create a marketing plan`, `Explain how this system works`, `Build a workflow bot`.
- One-click demo actions: `Run Demo Workflow`, `Test RAG Query`, and `Create Sample Bot`.
- Thinking state renders a three-dot blink animation while a response is being produced.
- Inspector mode displays per-run metadata including selected agent, latency, token estimate, cache-hit status, prompt, normalized query, RAG usage, and retrieval context docs.

## RAG and observability runtime

- `server/rag/store.ts` provides ingestion, deterministic hashed embeddings, cosine retrieval, bounded query-level cache, and dual-mode retrieval (Postgres/memory).
- `server/rag/store.ts` exposes deterministic seed corpus helpers: `ensureSeeded`, `isSeeded`, and `reseedDemoDocuments`.
- Runtime state is attached to `globalThis` for stable behavior during local hot reloads.
- `server/ai/orchestrator.ts` executes an explicit graph pipeline via the local `StateGraph` adapter: `normalize → route → retrieve → respond`.
- `server/ai/telemetry.ts` tracks bounded run history and aggregate metrics including `requestCount`, `avgLatencyMs`, `totalTokens`, `cacheHitRate`, `errorCount`, `retrievalCount`, `slowRuns`, and `estimatedCostUsd`.
- `app/components/dashboard/observability-panel.tsx` surfaces metric cards (including retrieval count, slow run count, estimated cost), recent runs, agent path, and slow-query highlighting.
- Inspector panel in the assistant exposes per-run `agentPath`, `estimatedCostUsd`, and optional `traceUrl` in addition to agent, latency, tokens, cache, and RAG status.

## Bot creation flow

- `server/bots/store.ts` provides an in-memory demo request queue with `queueBotRequest` and `getRecentBotRequests`; bounded to 50 records per runtime.
- `app/api/v1/bots/route.ts` provides `GET` (recent requests) and `POST` (validate name, intent, capabilities + queue) with full auth enforcement.
- `app/components/dashboard/bot-creation-panel.tsx` provides a first-class Bot Creator UX: bot name, task intent, capability selector (chat / workflow / research / monitoring), confirmation checkbox, create action, and recent requests preview.
- Bot Creator is surfaced as a dedicated panel in the workspace shell and linked from the side navigation.

## Visual and design system

- `app/global.css` defines a unified premium token system: `--bg`, `--panel`, `--panel-soft`, `--text`, `--muted`, `--accent`, `--border`.
- `.panel-premium` is a shared elevated panel treatment used across workspace shell surfaces and the side nav.
- `.btn-primary` is a shared primary CTA button with gradient fill, glow hover, and animated lift used on both landing and workspace.
- `.workspace-header-pill` adds a green live-dot indicator for active session context.
- Landing and `/app` share the same token layer so both surfaces read as one coherent product.

## Landing page

- `components/marketing/landing-hero.tsx` provides a two-column premium composition:
  - Left: gradient headline, system highlights (graph orchestration, RAG retrieval, approval gates, observability), single `Enter Workspace` CTA.
  - Right: four live signal metric cards + terminal-style pipeline trace snippet (normalize / route / retrieve / respond).
- One CTA only (`Enter Workspace`); `Request Access` removed to eliminate split-intent friction.

## Planned next backend phase

- Full LangGraph package integration when package policy permits, replacing the local `StateGraph` adapter.
- pgvector as the canonical retrieval layer with deterministic in-memory fallback retained for local resilience.
- Preserve assistant guidance and observability explainability as non-negotiable UX constraints through all backend changes.
- Add full RLS policy matrix and tenant-aware permission model.
- Add connector OAuth flows and encrypted credential vault integration.
- Implement worker execution plane and durable orchestration for long-running tasks.
