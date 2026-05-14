# Contributing to ObservAI Web

Thank you for helping improve ObservAI Web. This repository contains the Next.js frontend for ObservAI, an open-source and self-hosted AI observability analysis platform.

## Before you start

- Work from a branch, not directly on `main`.
- Keep changes focused on one feature, fix or documentation improvement.
- Do not commit provider tokens, LLM API keys, observability credentials, `.env.local` files or sensitive evidence.
- Prefer small pull requests with clear validation notes.

## Local setup

Requirements:

- Node.js 22 or newer
- pnpm 10.32.1 or newer
- ObservAI API running locally or reachable from the Next.js server when testing integrated flows

Install dependencies:

```bash
pnpm install
```

Create local environment:

```bash
cp .env.example .env.local
```

Run the app:

```bash
pnpm run dev
```

The default local web URL is:

```txt
http://localhost:3000
```

## Development checks

Run these before opening a pull request when your change touches application code:

```bash
pnpm run lint
pnpm run typecheck
pnpm test
pnpm run build
```

Documentation-only changes may skip build and test commands, but the pull request should say why.

## Code standards

- Use TypeScript, React Server Components where appropriate and Client Components only when interactivity requires them.
- Keep API integration centralized by feature. Do not add random `fetch` calls inside components.
- Use TanStack Query for server state.
- Put mapping, validation, formatting and business rules in dedicated files instead of component bodies.
- Keep components small, accessible and oriented around observability workflows.
- Add tests for non-trivial mappers, schemas, hooks, policies, API clients and user-facing behavior.

## Security expectations

- Browser-visible variables must use `NEXT_PUBLIC_*` and must never contain secrets.
- Sensitive credentials belong in ObservAI API, not in this frontend.
- Do not log tokens, credentials, full provider payloads or sensitive evidence.
- Redact service names, hostnames, traces or logs if they contain private information in issues or pull requests.

## Pull request process

1. Describe the problem and the user-facing change.
2. Link related issues when available.
3. Include screenshots or short recordings for meaningful UI changes.
4. List validation commands and results.
5. Call out any API contract assumptions or follow-up work.

Maintainers may ask for narrower scope, extra tests or API contract clarification before merging.
