# API and state rule

## Goal

Keep backend integration typed, centralized and predictable.

## Server state

Use TanStack Query for server state.

Server state includes:

- provider list
- provider status
- LLM provider configuration status
- analysis history
- analysis results
- evidence entries
- chat sessions
- trace insights

Do not store server state in Zustand or Jotai.

## Client UI state

Use local state for simple UI behavior.

Use Zustand or Jotai only for shared client-only state such as:

- sidebar collapsed state
- active workspace panel
- temporary UI filters
- unsaved local draft when not server-backed
- command palette state

## API clients

Do not call raw fetch in visual components.

Create API clients by feature.

API clients must handle:

- base URL
- headers
- request serialization
- response parsing
- typed errors
- cancellation when applicable

## Contracts

Use TypeScript types for API requests and responses.

Use Zod for validating external or uncertain data.

Map API models to UI models when needed.

## Query keys

TanStack Query keys must be explicit and stable.

Prefer feature query key factories.

Example concepts:

- providerKeys.all
- providerKeys.detail(providerId)
- analysisKeys.history(filters)
- analysisKeys.detail(analysisId)
- chatKeys.session(sessionId)

## Mutations

Mutations must define loading, success and error behavior.

Invalidate or update query cache intentionally.

Do not refresh the whole app when a targeted invalidation is enough.

## Error handling

API errors must be converted into user-friendly messages.

Keep technical details available for debugging when safe.

Do not show raw backend stack traces or provider payloads to the user.

## Streaming

Chat and analysis streaming must be isolated in dedicated hooks or clients.

Streaming code must handle:

- connection start
- partial messages
- completion
- cancellation
- retry when appropriate
- user-visible errors
