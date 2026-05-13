# Skill: design component

Use this workflow when creating a reusable component.

## Steps

1. Identify whether the component is UI, shared, layout or feature-specific.
2. Give the component a domain-specific name when it is product-specific.
3. Define explicit props.
4. Avoid boolean prop explosion.
5. Use composition when variants grow.
6. Use shadcn/ui primitives when possible.
7. Ensure keyboard and screen reader accessibility.
8. Add loading, disabled and error states when relevant.
9. Keep styling consistent with Tailwind and existing components.
10. Add tests when behavior is meaningful.

## Rules

Do not create generic components without a clear responsibility.

Do not duplicate visual patterns that already exist.

Do not put API calls or business rules inside presentational components.
