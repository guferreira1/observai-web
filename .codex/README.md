# Codex workspace

This folder documents how AI assistants should work on ObservAI Web.

## Structure

- `rules/`: engineering, architecture, security, UX, performance and testing guidance.
- `agents/`: specialized frontend agent profiles.
- `skills/`: repeatable workflows for common tasks.
- `hooks/`: session start and end checklists.
- `tasks/`: templates for future work.
- `memory.md`: concise project memory.

## Reading order

Recommended reading order:

1. `AGENTS.md`
2. `.codex/README.md`
3. `.codex/rules/project-decisions.md`
4. `.codex/rules/architecture.md`
5. `.codex/rules/frontend-code.md`
6. rules related to the current task
7. relevant agent profile
8. `.codex/memory.md`

## Core expectation

Frontend work should preserve architecture, typed contracts, state boundaries, accessibility, performance and design consistency.

## Session notes

At the end of a meaningful session, add a concise note to `.codex/memory.md`.
