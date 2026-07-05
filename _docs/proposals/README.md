# Client Proposals

Standalone HTML proposal packages. No build step — open `index.html` locally or deploy as static files.

## Deploy on Vercel

Each proposal is a separate Vercel project. Do **not** deploy from the monorepo root; that triggers Turbo and installs all 27 workspace packages.

| Setting | Value |
| --- | --- |
| Root Directory | `_docs/proposals/<proposal-slug>` (e.g. `mania4-helio-platform`) |
| Framework Preset | Other |
| Install Command | *(leave empty — `vercel.json` in each proposal skips install)* |
| Build Command | *(leave empty)* |
| Output Directory | `.` |

After linking the project, push to `main` or run:

```bash
cd _docs/proposals/mania4-helio-platform
vercel --prod
```

## Proposals

| Slug | Description |
| --- | --- |
| [mania4-helio-platform](./mania4-helio-platform/) | HELIOtextil / Mania4 multi-brand commerce & 3D customization SoW |
