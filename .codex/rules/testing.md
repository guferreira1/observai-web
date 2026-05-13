# Frontend testing rule

## Goal

Protect critical behavior and reduce regressions without testing implementation details.

## Testing priorities

Prioritize tests for:

- feature rules
- mappers
- validation schemas
- API clients
- custom hooks
- complex components
- forms
- critical user flows

## Component tests

Use Testing Library to test behavior from the user's perspective.

Prefer queries by role, label text and accessible name.

Avoid testing internal state or implementation details.

## Unit tests

Pure functions, mappers, policies and schemas must have focused tests.

Use table-driven tests when it improves readability.

## E2E tests

Use Playwright for critical flows when the application grows.

Important flows may include:

- configuring a provider
- configuring an LLM provider
- starting an analysis
- reviewing evidence
- continuing through chat

## Test data

Use explicit test fixtures.

Do not depend on real provider credentials.

Do not depend on production APIs.

## Naming

Test names must describe behavior.

Bad:

    should work

Good:

    shows an empty state when no analysis history exists

## Coverage

Coverage is useful, but behavior quality matters more than arbitrary numbers.

Critical flows and domain rules must be covered first.
