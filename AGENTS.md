# Prood Commerce Platform Agent Guidance

## Learned User Preferences

- For this dev-only workspace, prefer clean breaking changes over compatibility layers; remove dead or legacy code instead of adding shims, backfills, fallbacks, or workarounds.

## Learned Workspace Facts

- The workspace is a Turborepo/pnpm monorepo with `apps/*` applications and shared `packages/*`.
- `apps/api` is the intended API contract boundary for REST `/v1`, OpenAPI, MCP, and Agent Auth discovery.
- `apps/docs` publishes LLM-readable docs routes, and `packages/api-client` is the TypeScript API client surface.
