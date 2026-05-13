# Frontend security rule

## Goal

Protect users, credentials and observability data.

## Secrets

Never expose provider tokens, LLM API keys, private keys or passwords in frontend code.

Never place secrets in `NEXT_PUBLIC_*` variables.

Never store secrets in localStorage, sessionStorage or client-side state.

Sensitive credentials must be handled by ObservAI API.

## Environment variables

Only non-sensitive browser-safe values may use `NEXT_PUBLIC_*`.

Examples of allowed public values:

- API base URL
- app name
- app environment label

Examples of forbidden public values:

- provider tokens
- LLM API keys
- database URLs
- private keys
- service credentials

## Logs

Do not log tokens, credentials, full provider payloads or sensitive evidence.

Do not log full chat context when it may contain sensitive production data.

## UI safety

Do not render raw HTML from backend or LLM responses.

Markdown rendering must sanitize or restrict unsafe content.

Links from generated content must be safe and explicit.

## Authentication

Authentication state must be handled through secure backend flows.

Do not invent client-only authentication rules.

Do not rely on hidden UI state for authorization.

## Error handling

Do not expose raw stack traces, provider responses or internal backend errors directly to users.

Show safe messages and optional safe technical details.

## Data minimization

Only request and display the data required for the current screen or workflow.

Avoid keeping large sensitive payloads in client state longer than necessary.
