# Pattern strategy rule

## Goal

Keep frontend behavior readable, testable and easy to change.

Agents must follow Clean Code, SOLID and appropriate Design Patterns.

Agents must not accumulate many conditional branches in components, hooks or mappers when those branches represent different behaviors or product rules.

## Conditional limit

If a component, function, hook or mapper needs more than two behavioral conditionals, extract the variation.

Preferred options:

- Strategy pattern for interchangeable behavior
- Policy object for decision rules
- Specification pattern for composable predicates
- Rule object for isolated analysis or UI rules
- Factory for controlled construction
- Adapter for API/provider differences
- Dispatcher map for stable keys
- Component composition for UI variation

## What must be isolated

Extract a strategy, rule, policy, adapter or component when conditionals decide:

- provider-specific behavior
- LLM provider behavior
- analysis status behavior
- severity behavior
- chart rendering behavior
- evidence rendering behavior
- API response mapping
- form behavior
- chat message rendering
- empty/loading/error state variation
- access or visibility rules

## Acceptable conditionals

Simple guard clauses are allowed for:

- loading states
- error states
- empty states
- null checks
- basic validation
- early returns that keep JSX readable

Guard clauses must stay shallow and must not hide business decisions.

## Naming rule

Variables and parameters must be readable.

Do not use one-letter names unless the scope is very small and obvious.

Prefer domain language over generic names.

Bad names:

- x
- y
- z
- p
- s
- m
- obj
- tmp
- val
- res
- data
- info

Good names:

- analysisResult
- selectedProvider
- evidenceEntry
- traceSpan
- chatMessage
- severityLevel
- providerStatus

## Review checklist

Before finishing, verify:

- components are small and focused
- business rules are not hidden in JSX
- hooks do not contain too many responsibilities
- API mapping is isolated
- provider-specific UI behavior is isolated
- variable names are readable
- tests cover extracted rules or mappers
