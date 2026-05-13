# Frontend Architecture

ObservAI Web uses Next.js App Router with feature-oriented boundaries.

## Routing

`app/` owns route segments, layouts, metadata and page composition. Route files should stay thin and delegate product behavior to feature modules.

Current routes:

- `/dashboard`
- `/analyses/new`
- `/analyses/[analysisId]`
- `/analyses/[analysisId]/evidence`
- `/analyses/[analysisId]/traces`
- `/analyses/[analysisId]/chat`
- `/history`

## Feature Modules

`src/features/*` groups product capabilities:

- `analysis`: analysis contracts, queries, workspace, results, evidence and traces.
- `chat`: chat contracts, queries and conversation UI.
- `dashboard`: aggregate dashboard composition.
- `health`: API health contract.
- `history`: analysis history screen.

Feature modules can contain API clients, query hooks, schemas, domain rules and components. Visual components should consume UI-ready data and avoid raw fetch calls.

## Shared Modules

`src/shared/*` contains reusable infrastructure:

- `api`: HTTP client, envelope parsing, typed errors and retry policy.
- `config`: browser-safe public environment values.
- `layout`: app shell and primary navigation.
- `lib`: formatting and utility helpers.
- `ui`: shadcn-style primitives and state components.

## State

TanStack Query owns server state. Local component state is used for UI-only filters, optimistic chat feedback and copy status.

## Error Handling

API errors are converted into safe user-facing messages in `src/shared/api/errors.ts`. Transient failures use the retry policy in `src/shared/api/retry-policy.ts`. Next.js route errors are handled by `app/error.tsx` and `app/global-error.tsx`.

## Backend-Dependent Capabilities

The frontend does not invent backend data. These capabilities should be added when ObservAI API exposes contracts for them:

- Dashboard aggregation endpoint.
- Runtime signal capability metadata.
- Structured trace spans for waterfall and dependency maps.
- Chat streaming.
- Server-side search and sorting for history.
