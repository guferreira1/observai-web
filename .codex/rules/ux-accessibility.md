# UX and accessibility rule

## Goal

Make complex observability workflows clear, guided and usable.

## Product UX principles

Observability data is complex, so the UI must reduce cognitive load.

Every screen should answer:

- Where am I?
- What is happening?
- What should I look at first?
- What can I do next?
- What evidence supports this diagnosis?

## Evidence-first UI

AI insights must be connected to evidence.

When showing a diagnosis, also show:

- signal source
- provider
- time window
- affected service
- severity
- relevant logs, metrics or traces
- recommended action

## Progressive disclosure

Do not show every detail at once.

Start with summary and severity.

Then show evidence, hypotheses, technical details and raw data as expandable sections.

## Empty states

Empty states must be helpful.

They should explain what is missing and provide a clear next action.

Bad empty state:

    No data

Good empty state:

    No analysis has been created yet. Connect a provider and start your first investigation.

## Loading states

Use skeletons or clear loading indicators.

Long-running analysis should show progress-oriented copy and allow cancellation when possible.

## Error states

Errors must be understandable and actionable.

Do not show raw technical errors unless the user opens a technical details section.

## Accessibility

Use semantic HTML.

Forms must have labels and validation messages.

Buttons and links must be used correctly.

Keyboard navigation must work for menus, dialogs, tabs, sidebars and chat input.

Focus states must be visible.

Color must not be the only way to communicate severity or status.

## Copywriting

Use clear and direct product language.

Avoid vague labels such as Details, Data or Info when a domain-specific label is available.

Prefer terms such as Evidence, Root causes, Recommended actions, Affected services and Trace bottlenecks.
