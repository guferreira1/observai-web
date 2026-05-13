# Frontend architecture rule

## Goal

Keep ObservAI Web maintainable, scalable and easy to evolve for a developer who is still growing in frontend and Next.js.

## Architecture style

Use feature-oriented architecture.

The app should be organized around product capabilities, not only technical folders.

Main features:

- dashboard
- providers
- LLM providers
- analysis workspace
- evidence viewer
- trace insights
- AI chat
- analysis history
- settings

## Layer responsibilities

`app/` contains routing, layouts, metadata and page composition.

`features/` contains feature-specific components, hooks, API clients, schemas, types, mappers and rules.

`components/ui/` contains generic shadcn/ui components.

`components/layout/` contains app shell, navigation, sidebar, header and layout primitives.

`components/shared/` contains reusable product components that are not tied to one feature.

`lib/` contains cross-cutting utilities such as API base client, config, formatting, error handling and telemetry.

`types/` contains global shared types only when they truly cross features.

## Dependency direction

Pages may depend on features.

Features may depend on shared UI, lib and types.

Shared UI must not depend on features.

Lib must not depend on features.

Feature internals should not import from other feature internals unless a shared contract is intentionally extracted.

## Server and client components

Default to Server Components.

Use Client Components only for:

- local state
- browser events
- forms
- interactive UI
- TanStack Query hooks
- charts requiring browser APIs
- context providers
- client-side navigation behavior

Do not mark large trees as `use client` without need.

## API boundary

Backend integration must go through typed feature API clients or shared API client utilities.

Avoid raw fetch calls directly inside visual components.

API models should be mapped to UI models when the backend shape does not match screen needs.

## Component boundaries

Avoid components that fetch, transform, validate, decide rules and render everything at once.

Split into:

- page composition
- feature container
- presentational components
- hooks
- mappers
- schemas
- rules or policies

## Shared code rule

Do not create shared abstractions too early.

Extract shared code only when at least two places need the same behavior and the abstraction has a clear name.
