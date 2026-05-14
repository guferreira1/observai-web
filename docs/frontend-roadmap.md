# Frontend Roadmap

This plan orders the requested frontend work by dependency, user impact and backend readiness.

## P0 - Resilience And Correctness

- Add global error boundaries.
- Improve network failure handling and user-safe API messages.
- Add specific retry policy for transient failures.
- Validate `start < end` before creating analyses.

## P1 - Core Investigation Flow

- Improve time-window presets.
- Improve long-running analysis feedback.
- Refine result hierarchy for summary, severity, confidence and affected services.
- Improve root cause and recommended action presentation.
- Add copy/export for analysis results.
- Make navigation between summary, evidence, trace insights and chat direct.

## P2 - Evidence, Traces And Chat

- Add Evidence Viewer filters by signal, service, provider and score.
- Add textual evidence search.
- Add evidence grouping by signal or service.
- Improve attribute, query and reference presentation.
- Add evidence timeline.
- Categorize trace insights by performance, network, database and code.
- Highlight slow trace evidence.
- Improve cited evidence display in chat.
- Add optimistic chat feedback, retry and next-question suggestions.

## P3 - History And Navigation

- Persist history filters in the URL.
- Add local search by loaded summary/service until backend search exists.
- Use `metadata.pagination.next` for next-page availability.
- Improve responsive history layout.
- Keep global navigation focused on screens that do not require an active analysis.

## P4 - Backend-Dependent And Delivery Work

- Use real dashboard aggregations when the backend exposes aggregate endpoints.
- Use backend-exposed signal capabilities when available.
- Add structured trace waterfall/timeline when spans are exposed.
- Add streaming chat when supported by the API.
- Add history sorting by date/severity when backend support exists.
- Validate Dockerfile with clean build.
- Add docker-compose web + api if the owner wants a bundled local stack.
- Review CI/CD after scaffold stabilization.
- Keep dependency audit clean with pnpm.
- Define version and release policy.
