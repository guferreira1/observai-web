# AGENTS.md

## Project

ObservAI Web is the Next.js frontend for ObservAI, an open-source and self-hosted AI platform for observability analysis.

The application helps engineers configure providers, run AI-powered investigations, inspect evidence, review diagnoses and continue investigations through a context-aware chat.

## Main goal

Build a frontend that is clear, fast, accessible, maintainable and aligned with ObservAI API.

The UI must reduce cognitive load for complex observability data and help users understand what happened, why it happened and what to do next.

## Stack direction

Use:

- Next.js with App Router
- TypeScript
- React Server Components when appropriate
- Client Components only when interactivity is required
- Tailwind CSS
- shadcn/ui
- TanStack Query for server state
- Zustand or Jotai only for client UI state
- React Hook Form
- Zod
- Recharts or Tremor for charts
- Playwright for E2E when needed
- Vitest or Jest with Testing Library for unit/component tests

## Architecture principles

Prefer feature-oriented organization with clear boundaries.

Keep domain concepts explicit:

- providers
- LLM configuration
- analysis workspace
- evidence viewer
- trace insights
- AI chat
- analysis history
- dashboard

Avoid placing all logic inside components.

Components should render UI. Business rules, transformations, API mapping, formatting and state orchestration must live in dedicated files.

## Code quality rules

All implementation must follow Clean Code, SOLID and appropriate Design Patterns.

Do not add business behavior as loose procedural code.

When a function needs more than two behavioral conditionals, extract the variation into a Strategy, Policy, Specification, Rule Object, Factory, Adapter or dispatcher map.

Variable and parameter names must be readable. One-letter names are forbidden except for idiomatic and obvious cases such as `t` in tests, `i` in simple loops, `id`, `ok`, `err` and very small callbacks where meaning is obvious.

Use domain language in names. Avoid generic names like `data`, `info`, `obj`, `res`, `tmp`, `val`, `x`, `y`, `z`, `p`, `m` or `s`.

## Component rules

Components must be small, focused and composable.

Separate:

- page composition
- feature containers
- UI components
- forms
- hooks
- API clients
- mappers
- schemas
- types
- constants

Avoid deeply nested JSX.

Extract repeated UI into named components.

Avoid prop drilling through many levels. Use composition first, then scoped context or small stores when justified.

## API rules

The frontend must not know backend internals.

Use typed API clients, request schemas, response schemas and mapping functions.

Never call `fetch` randomly across components.

API integration must be centralized by feature.

Use TanStack Query for server state, caching, loading, error and retry behavior.

## Security rules

Never expose provider tokens, LLM API keys or secrets in frontend code.

Only `NEXT_PUBLIC_*` variables are available in the browser, and they must never contain secrets.

Sensitive credentials must be sent to ObservAI API and handled by the backend.

Do not log tokens, credentials, full provider payloads or sensitive evidence.

## UX rules

Observability data is complex. The interface must be clear, guided and actionable.

Prefer evidence-first UI, clear status states, empty states, loading states, error recovery and progressive disclosure.

Every analysis result should make it easy to see:

- summary
- severity
- affected services
- evidence
- possible root causes
- recommended actions
- next investigation steps

## Testing rules

Test behavior, not implementation details.

Add tests for:

- complex components
- feature hooks
- mappers
- API clients
- validation schemas
- rule/policy objects
- critical flows

## Git safety

Agents must not work directly on `main`.

Agents must not commit, push, pull, merge, rebase, force update, open PRs or change repository settings without explicit owner authorization.

## Memory

At the end of meaningful sessions, update `.codex/memory.md` with a concise summary, decisions, pending items and validation.
