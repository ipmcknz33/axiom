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

- `POST /api/v1/chat`: validates auth headers and orchestrator payload, enforces caller identity, emits audit events, and returns either dispatch intent or a pending approval response.
- `GET /api/v1/agents`: lists controlled agent templates.
- `GET /api/v1/connectors`: lists connector templates.
- `GET /api/v1/approvals`: authenticated approval queue endpoint backed by persisted records; owners can view their queue and admins can inspect any queue.
- `GET /api/v1/projects`, `/tasks`, `/memory`: scaffolds to anchor phase 2 implementation.
- `GET /api/v1/health`: liveness endpoint.

## Security posture in phase 1

- Explicit runtime guards for environment and orchestrator payload validation.
- No secrets rendered in client components.
- Auth context is supplied at the API boundary with `x-axiom-user-id` and optional `x-axiom-role` headers.
- Payload `userId` must match the authenticated caller before orchestration dispatch is allowed.
- `requestedAction` is prechecked against high-risk policy rules and routed to pending approval when matched.
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

## Planned phase 2 evolution

- Introduce worker execution plane and durable orchestration.
- Add full RLS policy matrix and tenant-aware permission model.
- Add connector OAuth flows and encrypted credential vault integration.
- Implement vector retrieval + memory ranking service.
