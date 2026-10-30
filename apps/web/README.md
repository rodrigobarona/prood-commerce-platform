# web

The marketing site for [prood.com](https://prood.com). Next.js App Router, almost
entirely static Server Components, styled with the shared Prood theme from
`@prood/ui` (`globals.css` + `themes/prood.css`).

```bash
pnpm --filter web dev     # http://localhost:3001
```

- Copy and visual rules: [`_docs/BRAND.md`](../../_docs/BRAND.md).
- Plan names, prices and limits come from `@prood/billing`; don't hard-code them.
- Sign-up and sign-in links point at `NEXT_PUBLIC_DASHBOARD_URL`, docs links at
  `NEXT_PUBLIC_DOCS_URL`. Canonical URLs always use `https://prood.com`.
