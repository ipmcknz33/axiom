# Testing Guide

## Overview

The Axiom control plane uses a layered testing approach:

1. **Unit Tests** — Deterministic policy and access control logic tested in isolation
2. **Integration Tests** — Real Supabase persistence validated against a live database instance

## Running Tests

### Standard Unit Tests (Always Run)

Unit tests validate access control policies, audit logic, and health status derivation without requiring external dependencies.

```bash
npm run test
```

This command:

- Compiles `.ts` test files to CommonJS in `.test-dist/`
- Runs 8 passing unit tests covering chat access policies, approval queue access, and health status logic
- Takes ~3 seconds

Expected output:

```
✔ tests/chat-access.test.ts (3 tests)
✔ tests/approvals-access.test.ts (4 tests)
✔ tests/health.test.ts (1 test)
```

### Live Supabase Integration Tests (Manual Enablement)

Integration tests validate real persistence behavior (approval/audit insert/list, database connectivity) against a live Supabase instance. These tests are **gated and disabled by default** to prevent accidental writes to production databases.

#### Prerequisites

1. Active Supabase project with initialized schema (`db/migrations/0001_foundation.sql`)
2. Environment variables set:
   - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — Service role authentication key (write access)

#### Running Integration Tests

Enable and run integration tests with:

```bash
RUN_LIVE_SUPABASE_TESTS=true npm run test:live
```

Or set the env var globally and run:

```bash
export RUN_LIVE_SUPABASE_TESTS=true
npm run test:live
```

This command:

- Sets `RUN_LIVE_SUPABASE_TESTS=true` environment variable
- Compiles all test files
- Runs both unit tests AND live integration tests
- Validates approval/audit insert operations against real database
- Tests database connectivity for health endpoint

Expected output when enabled with valid credentials:

```
✔ Supabase integration setup
✔ persistence: insert approval record to database
✔ persistence: list approval records from database
✔ persistence: insert audit log record to database
✔ health: database connectivity check via profiles query
```

#### Skipping Behavior

If `RUN_LIVE_SUPABASE_TESTS` is not set (or is `false`), integration tests are safely skipped:

```bash
⊙ Missing env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
```

## TypeScript Compilation

Verify type safety:

```bash
npm run typecheck
```

This runs `tsc --noEmit` and reports any TypeScript diagnostics across the entire codebase.

## Linting

Check code style and patterns:

```bash
npm run lint
```

This runs ESLint with `next/core-web-vitals` and `next/typescript` configurations.

## Test Organization

### `tests/chat-access.test.ts`

- **Coverage**: User identity enforcement, ownership validation, approval workflow role gating
- **Test count**: 3 unit tests
- **Dependencies**: None (deterministic policy logic)
- **Example**: Validates that users cannot initiate approvals from other users' accounts

### `tests/approvals-access.test.ts`

- **Coverage**: Approval queue access control (user sees own, admin sees all)
- **Test count**: 4 unit tests
- **Dependencies**: None (deterministic policy logic)
- **Example**: Validates that non-admin users cannot query other users' approval queues

### `tests/health.test.ts`

- **Coverage**: Health status derivation (healthy, degraded, unavailable states)
- **Test count**: 1 comprehensive test
- **Dependencies**: None (pure status logic)
- **Example**: Validates that health status is `degraded` when one check fails

### `tests/supabase-integration.test.ts`

- **Coverage**: Real Supabase persistence (approval/audit insert/list, database connectivity)
- **Test count**: 5 tests (skipped by default)
- **Dependencies**: Live Supabase instance with valid credentials
- **Example**: Validates `INSERT` to approvals table returns success with data

## CI/CD Integration

### Local Development

```bash
npm run typecheck && npm run test && npm run lint
```

This verifies type safety, passes all unit tests, and passes linting before committing.

### GitHub Actions (Proposed)

```yaml
- name: Run tests
  run: npm run typecheck && npm run test && npm run lint
  # Note: RUN_LIVE_SUPABASE_TESTS not set, so integration tests skipped

- name: Run integration tests (if secrets available)
  run: RUN_LIVE_SUPABASE_TESTS=true npm run test:live
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
  # Only runs on main branch, requires secrets to be configured
```

## Debugging Tests

### View Compiled Test Files

Test files are compiled to CommonJS in `.test-dist/`:

```bash
ls .test-dist/tests/
```

### Run Single Test File

```bash
node --test .test-dist/tests/chat-access.test.js
```

### Run with Verbose Output

```bash
node --test .test-dist/tests --verbose
```

### Check Environment Variables

Verify env vars are set:

```bash
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

## Test Philosophy

- **Deterministic**: Tests produce same results across runs (no randomness, no side effects)
- **Independent**: Each test can run in any order and pass/fail independently
- **Offline-first**: Unit tests require no network or external services
- **Gated integration**: Integration tests explicitly opt-in via environment variable
- **Fast**: Unit tests run in ~3 seconds; integration tests complete in ~10 seconds per operation
