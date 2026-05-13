# Frontend code rule

## Goal

Keep TypeScript and React code readable, predictable and easy to maintain.

## Mandatory principles

All code must follow:

- Clean Code
- SOLID principles
- appropriate Design Patterns
- readable naming
- explicit dependencies
- small components
- small functions
- feature boundaries
- typed contracts
- testable behavior

## Naming

Variables, parameters, components, hooks, files and functions must have readable names.

Avoid one-letter names unless the meaning is obvious in a very small scope.

Avoid generic names such as:

- data
- info
- obj
- item when a domain name exists
- result when a specific name exists
- tmp
- val
- res
- req
- x
- y
- z
- p
- m
- s

Allowed short names:

- id
- ok
- err only in Node-style utilities if needed
- i for simple indexes
- t in tests
- e for tiny event handlers only when the handler is local and obvious

Prefer domain names:

- analysisResult
- evidenceEntries
- selectedProvider
- normalizedTrace
- chatMessage
- affectedService
- severityLevel

## Components

Components must be named by responsibility.

Avoid generic names such as Box, Wrapper, Content, Section or Card unless they are true reusable primitives.

Prefer names such as:

- AnalysisSummaryCard
- EvidenceTimeline
- ProviderStatusBadge
- TraceBottleneckList
- ChatMessageComposer

## Props

Props must be explicit and typed.

Avoid passing large objects when the component only needs a few fields.

Avoid boolean prop explosion. Use variants, enums or composition when behavior grows.

## Hooks

Custom hooks must start with `use` and must have one clear responsibility.

Do not hide business rules in hooks without tests.

Feature hooks may compose TanStack Query, local state and mappers, but should not become large orchestration objects.

## Conditional complexity

If a component or function needs more than two behavioral conditionals, extract the variation into a component, mapper, policy, strategy, rule object or dispatcher map.

Guard clauses for loading, error and empty states are allowed.

Large conditional rendering blocks must be split into named components.

## Comments

Avoid implementation comments.

Prefer readable names and small functions.

Comments are allowed only for non-obvious product decisions, accessibility explanations, browser limitations or integration constraints.

## TypeScript

Avoid `any`.

Use `unknown` for unknown external values and validate them with Zod or explicit guards.

Prefer explicit domain types for API and UI models.

Do not leak raw backend response types into complex UI when a UI model would make the screen clearer.

## Imports

Avoid long relative import chains when project aliases are available.

Do not create circular dependencies between features.

## Duplication

Avoid duplicated business rules and formatting rules.

Do not prematurely abstract visual components only because JSX looks similar.

Extract only when the responsibility and name are clear.
