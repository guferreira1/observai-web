# Codex memory

Use this file to keep concise session notes for ObservAI Web.

Do not store secrets, tokens, passwords, private keys or sensitive environment values here.

## Entry format

### YYYY-MM-DD - Agent role

Summary:

Decisions:

Pending:

Validation:

---

### 2026-05-12 - Documentation setup

Summary:

Created initial Codex workspace documentation for ObservAI Web.

Decisions:

- Frontend uses Next.js, TypeScript, Tailwind CSS and shadcn/ui.
- Architecture should be feature-oriented.
- TanStack Query should handle server state.
- Zustand or Jotai should be reserved for client UI state only.
- API integration should be typed and centralized by feature.
- Components should remain small, accessible and focused.

Pending:

- Owner review.
- Adapt rules after the first real implementation tasks.

Validation:

- Documentation-only change.
