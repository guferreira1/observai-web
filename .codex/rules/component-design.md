# Component design rule

## Goal

Keep UI components consistent, accessible, reusable and easy to reason about.

## Component categories

Use clear categories:

- page components compose screens
- feature components represent product capabilities
- shared components solve cross-feature UI needs
- ui components are low-level shadcn or primitive components
- layout components define shell and navigation

## Composition

Prefer composition over prop-heavy components.

A component should not know every possible use case.

When a component grows too many variants or booleans, split it or use compound composition.

## JSX readability

Avoid deeply nested JSX.

Extract meaningful sections into named components.

Keep conditional rendering readable.

Do not hide complex conditions inline inside JSX.

## UI states

Every data-driven component must consider:

- loading state
- empty state
- error state
- success state
- disabled state when applicable
- optimistic or pending state when applicable

## Accessibility

Use semantic HTML first.

Buttons must be buttons.

Links must be links.

Inputs must have labels.

Dialogs, menus, popovers and tabs should use accessible primitives from shadcn/ui or Radix.

Interactive elements must have visible focus states.

## Design consistency

Use consistent spacing, typography, border radius and elevation.

Do not create one-off visual styles unless the product decision is clear.

Prefer shared variants for repeated visual patterns such as severity badges, provider status, evidence cards and analysis result sections.

## Observability UI

Evidence and diagnosis UI must prioritize clarity.

Severity, affected service, provider, time window and recommended action should be easy to scan.

Avoid dense dashboards without hierarchy.

Use progressive disclosure for complex details.
