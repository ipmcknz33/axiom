# Axiom Phase 1 Schema Plan

Core principles:

- Supabase auth owns canonical users via `auth.users`; application profile metadata lives in `public.profiles`.
- Approval and audit are first-class tables from day one.
- Agent and connector systems are template-driven to enforce controlled expansion.
- Memory supports vector retrieval with pgvector and provenance fields.

## Table coverage

- Identity: `profiles`
- Access and monetization: `account_entitlements`, `billing_subscriptions`, `billing_entitlement_overrides`, `billing_usage_events`, `billing_webhook_events`
- Work management: `projects`, `tasks`
- Chat: `conversations`, `messages`
- Knowledge: `documents`, `memories`
- Agent model: `agent_templates`, `agents`
- Connector model: `connectors`
- Governance: `approvals`, `audit_logs`
- Reasoning/scoring: `probability_scores`

## Deferred to phase 2

- Customer portal session APIs and self-serve billing management surfaces.
- Replay protection windows and enhanced event authenticity constraints for webhook processing.
- Tenant/org overlays for entitlement inheritance and team billing.
- Full RLS policies and role matrix by organization/workspace tier.
- Document chunking ingestion workers and durable queue pipeline.
- Redis caching and Temporal orchestration workflows.
