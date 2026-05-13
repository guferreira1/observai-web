# Skill: API integration

Use this workflow when integrating ObservAI Web with ObservAI API.

## Steps

1. Identify the backend endpoint and expected user behavior.
2. Define request and response TypeScript types.
3. Add Zod validation when response shape is external or uncertain.
4. Implement or reuse a feature API client.
5. Add mapper from API model to UI model when needed.
6. Add TanStack Query hook with stable query keys.
7. Define loading, error, empty and success behavior.
8. Add tests for mapper, schema or hook when behavior is non-trivial.
9. Ensure errors are safe for users.
10. Ensure no secrets are exposed to the browser.

## Rules

Do not call raw fetch directly inside visual components.

Do not store server state in global client stores.

Do not expose raw backend errors directly in the UI.
