# Mania4 Commerce Platform — Phase 1 proposal

Client-branded proposal for **HELIOtextil Group, HELIOPromo and Mania4**: a €49,500
Phase 1 Commercial MVP, 10 to 14 weeks, with a choice between a Partnership model
(€0.40 success fee per order) and a Standard one-off licence. It follows the July 2026 proposal in
`../mania4-helio-platform/` and replaces its scope with a focused first phase built
on two existing foundations: the Prood commerce platform and the 3D Customization
Engine.

No WPP or VML branding. The deck uses the client's own marks (HELIOPROMO, MANIA4),
their black-and-white identity and HELIOPromo's iridescent key visual.

## Files

| File | Audience | What it is |
| --- | --- | --- |
| [`PROPOSAL.md`](./PROPOSAL.md) | Client | The full written proposal: scope, workstreams, deliverables, acceptance, plan, investment, commercial model and revenue share, ownership, assumptions, exclusions, risks, rollout, run and operate, next phases. **Source of truth.** |
| [`deck/Mania4-Phase1-Proposal.pptx`](./deck/Mania4-Phase1-Proposal.pptx) | Client | 38-slide PowerPoint version of the proposal |
| [`INTERNAL-NOTES.md`](./INTERNAL-NOTES.md) | **Internal only** | Day rate and effort model, the upsells, 14 revenue share options and the negotiation order, what the recurring income could be worth, run and operate pricing, decisions to confirm, the ownership conversation, technical validation checklist. Git-ignored. |
| [`prototype/`](./prototype/) | Client | Clickable prototype of the Phase 1 journey from Mania4's point of view, with an autoplay demo mode. Live at <https://mania4-phase-1.vercel.app>, behind a password (`wppes-pt` team). Static site; see its README. |
| [`prototype/media/Mania4-Platform-Demo.mp4`](./prototype/media/Mania4-Platform-Demo.mp4) | Client | The demo as a video: 3 min 17 s, 1080p, 11 MB, no sound, with captions |
| `deck/build-deck.js` | Internal | Generates the deck |
| `deck/assets/` | Internal | Client logos and key visual, taken from heliopromo.com and mania4.com |

The research behind the proposal is in `../research/` (git-ignored).

## Phase 1 in one table

| | |
| --- | --- |
| Phase 1 | €49,500 excl. VAT, fixed price (€60,885 with 23% VAT) |
| Funding lines | A · HELIOPromo commerce presence €20,000 · B · Replicable sales platform €29,500 |
| Licence | Partnership: €0.40 per paid order, yearly, cap €36,000/year, buy-out · or Standard: €25,000 one-off (€74,500 total) |
| Duration | 10 to 14 weeks (12-week baseline) |
| Scope | 2 stores in PT and EN, 5 to 10 products, 1 3D product family with four views, Easypay checkout, production and pickup workflow, partner reports, member imports, first activation support |
| Milestones | M1 20% on signature · M2 30% stores on staging · M3 30% 3D and operations on staging · M4 20% launch |
| Run and operate | Essential €690 · Growth €1,390 · Scale €2,690 a month, plus services on demand |
| Ownership | Mania4 owns data, accounts and bespoke work; perpetual licence to the foundations; no subscription, no fee per store |

## Before sending

Read section 5 of `INTERNAL-NOTES.md`. In short:

1. Confirm the supplier name ("Prepared by Rodrigo Barona").
2. Decide whether to name Prood in the client documents. They don't today.
3. Confirm the revenue share numbers: €0.40 per order, €36,000 cap, buy-out formula, €25,000 Standard licence, 15% referral.
4. Confirm the run and operate prices and response times, especially 1-hour cover on event days.
5. Be ready to explain the licence model. It differs from "é todo teu" in the May meeting.
6. Re-check the Shopify and Zakeke fees used in the market comparison; they change.

## Prototype and demo video

`prototype/` shows what Phase 1 builds, in ten steps across the four roles:
Mania4 sets up a partner store, a supporter scans a QR code, personalises a
shirt in real 3D and pays with MB WAY, Mania4 approves the artwork, HELIOtextil
produces from the generated file, the club shop hands it over by pickup code,
and Mania4 settles with the club at month-end. It ends with the next stores
being set up from the same template.

Use **Explore** to click through it in a meeting, or **Watch the demo** to let
it play. The MP4 is the same demo, recorded, for email or offline use. All
names and figures in it are fictional, and it shows no prices.

## Rebuild the deck

The deck is generated, so change `PROPOSAL.md` first, then the matching text in
`deck/build-deck.js`.

```bash
cd _docs/proposals/mania4-phase-1/deck
npm install --no-save pptxgenjs sharp react-icons react react-dom
node build-deck.js
```

This writes `deck/Mania4-Phase1-Proposal.pptx`. The supplier name, client name
and date are constants at the top of `build-deck.js`.

Design notes: Arial throughout (the client's sites use Roboto, which PowerPoint
doesn't ship), black and white dominant, holographic violet `#6A3DE8` as the accent,
teal `#13806F` for funding line A and "reused", and the iridescent ring as the
motif on the cover and dividers. The theme colours are written into the file, so
the deck can be restyled from PowerPoint's Design tab.

## Public repository

This repository is public. `PROPOSAL.md` and the deck contain the price and would be
public if committed, as the July proposal already is. `INTERNAL-NOTES.md` and
`../research/` are git-ignored by `../.gitignore` because they contain the day rate
and negotiation notes. Keep it that way, or make the repository private.
