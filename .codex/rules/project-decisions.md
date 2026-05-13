# Project decisions

This document records the main technical decisions for ObservAI Web.

## Product

ObservAI Web is the Next.js web interface for ObservAI.

The frontend must help users configure observability providers, configure LLM providers, run AI-powered investigations, inspect evidence, review diagnoses and continue investigations through contextual chat.

The UI must make complex observability data easier to understand.

## Language and framework

Use TypeScript and Next.js.

Use the Next.js App Router.

Prefer React Server Components for static or server-rendered data needs.

Use Client Components only when the component needs browser interactivity, hooks, state, effects, event handlers or browser APIs.

## Styling

Use Tailwind CSS and shadcn/ui.

Prefer reusable design tokens, consistent spacing, accessible contrast and composable components.

Avoid ad-hoc CSS when Tailwind and component variants solve the problem.

## State management

Use TanStack Query for server state.

Use local component state for small UI state.

Use Zustand or Jotai only for client state shared across distant components.

Do not put server state in global client stores.

## Forms

Use React Hook Form and Zod.

Zod schemas must be reusable for validation and typed contracts.

Transport validation belongs near forms and API boundaries.

Business rules must be isolated in dedicated functions, policies or feature rules.

## Data fetching

Do not scatter raw fetch calls across pages and components.

Create typed API clients by feature.

Validate and map backend responses before using them in UI components.

Components should receive UI-ready data whenever possible.

## Architecture

Prefer feature-oriented organization.

Recommended structure:

    src/
      app/
      components/
        ui/
        layout/
        shared/
      features/
        analysis/
        chat/
        dashboard/
        evidence/
        providers/
        llm-providers/
        traces/
      lib/
        api/
        config/
        errors/
        formatting/
        telemetry/
        utils/
      types/
      styles/

This can evolve, but boundaries must stay clear.

## Component strategy

Pages compose features.

Feature containers orchestrate feature state and data loading.

UI components render visual elements.

Hooks isolate reusable behavior.

Mappers convert API models into UI models.

Schemas validate input and external data.

## Security

The frontend must never expose provider tokens or LLM API keys.

Do not store secrets in frontend code, public environment variables, localStorage, sessionStorage or logs.

Only non-sensitive values may use NEXT_PUBLIC variables.

## Accessibility

Accessibility is mandatory.

Use semantic HTML, keyboard navigation, focus states, labels, ARIA only when necessary and sufficient contrast.

Interactive components must be usable without a mouse.

## Performance

Avoid unnecessary Client Components.

Avoid large client bundles.

Use dynamic imports for heavy visualizations when useful.

Memoization should be used only when there is a measured or obvious rendering issue.

Charts and large evidence lists must consider pagination, virtualization or progressive rendering.

## Testing

Use tests for critical behavior, feature logic, mappers, schemas, hooks and complex components.

Use Testing Library for component behavior.

Use Playwright for important user flows when the app grows.

## Design quality

Observability UI must be evidence-first and action-oriented.

Every important screen should provide clear empty, loading, error and success states.

Users must understand what to do next.
