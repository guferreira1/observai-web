# Frontend performance rule

## Goal

Keep ObservAI Web fast and responsive as screens and datasets grow.

## Next.js

Default to Server Components.

Use Client Components only when interaction, state, effects, browser APIs or client-side libraries are required.

Avoid adding `use client` to high-level trees without a clear reason.

## Bundle size

Avoid large dependencies without a strong reason.

Use dynamic imports for heavy charts, editors or visualizations when useful.

Prefer the existing stack before adding new libraries.

## Rendering

Keep state close to where it is used.

Do not place frequently changing state high in the component tree.

Avoid unnecessary re-renders.

Use memoization only when there is a clear reason.

## Large data screens

Logs, traces, evidence entries and analysis history must not render unbounded lists.

Use pagination, filtering, progressive loading or virtualization when needed.

## Charts

Charts must be readable and efficient.

Avoid rendering too many points without aggregation.

Heavy charts can be client-only and dynamically imported.

## Network

Use TanStack Query caching intentionally.

Avoid duplicate requests for the same data.

Use stable query keys.

Use request cancellation when flows can be interrupted.

## UX

Performance is part of product quality.

Users should see useful information quickly, even when a full analysis is still loading.
