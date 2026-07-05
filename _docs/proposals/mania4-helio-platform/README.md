# Mania4 Platform SoW Proposal

Standalone HTML proposal package for HELIOtextil / Mania4, prepared as a WPP Enterprise Solutions Statement of Work draft.

## Files

- `index.html` - main proposal, styled inline and ready to open in a browser.
- `assets/wpp-logo.svg` - local logo asset used by the proposal header.

## How to Review

Open `index.html` directly in a browser. No build step is required.

## Deploy on Vercel

This folder is static HTML. In the Vercel project settings, set **Root Directory** to
`_docs/proposals/mania4-helio-platform`. Without that, Vercel detects the monorepo at the
repo root and runs `pnpm install` + Turbo for all workspace apps.

`vercel.json` in this folder skips install/build. Framework preset: **Other**. Output: `.`

Before sharing externally, review:

- Final client-facing name: `Mania4 Studio Commerce` is used as a working name.
- Whether the proposal should mention HELIOPromo, Identity FC, or a new umbrella brand more prominently.
- The indicative timeline of 16 to 22 weeks.
- The two commercial rubrics: institutional commerce presence and replicated online sales platform.
- The assumptions around 3D assets, product modeling, payment provider, hardware, and partner integrations.

## Source Basis

This proposal was based on:

- `_docs/PLATFORM_DOCUMENTATION.md` - API-first multi-tenant commerce platform reference.
- `README.md` - current platform architecture and production gaps.
- `API_FIRST_AGENT_ARCHITECTURE_AUDIT.md` - careful wording around API/agent maturity and contract hardening.
- `_context/Heliopromo.docx` - meeting transcript covering Mania4 checkout ownership, replicated stores, MUPI/tablet/mobile use cases, 3D customization, store pickup, delivery, member discounts, and settlement.
- `/Users/rodrigo.barona/Documents/GitHub/3D-Customization-Engine/README.md` - 3D customization PoC and production roadmap.
- `/Users/rodrigo.barona/Documents/GitHub/vmlpt-slide-presentation-builder/_resources/wpp-brand/brand-book.md` and `wpp-com-html/section-patters.md` - WPP visual language.
- Public references for HELIOtextil, HELIOPromo, Mania4, sports kit configurators, Nike By You, and Spized.

## Notes

The document intentionally separates built platform foundations, 3D PoC capability, proposed production work, assumptions, and out-of-scope items. This is to keep the SoW clear for both business stakeholders and technical reviewers.
