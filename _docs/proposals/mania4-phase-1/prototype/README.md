# Mania4 platform — clickable prototype and demo video

A visual explanation of what Phase 1 builds, from Mania4's point of view: one
partner store, one 3D product family and one Mania4 checkout, followed from the
first QR code scan to the month-end report. Client-branded (HELIOPROMO ×
MANIA4); no agency branding.

- **Explore:** every screen is clickable. Highlighted elements show the next
  step, and the arrows move between chapters.
- **Watch the demo:** the same screens play by themselves, with a cursor,
  captions and a "behind the scenes" checklist for each step. Just over three minutes.
- **Video:** [`media/Mania4-Platform-Demo.mp4`](./media/Mania4-Platform-Demo.mp4),
  a recording of the demo (1920 × 1080, 30 fps, 3 min 17 s, 11 MB). It plays
  anywhere and works offline, for email or a meeting room.

The 3D shirt is real: the 3D Customisation Engine's texture approach, ported to
plain three.js. Names, numbers, colours and the sleeve badge are painted on the
shirt's pattern as they are typed, and the four views and the production
artwork come from the same design.

## The journey

| # | Chapter | Who | What it shows | Proposal |
| --- | --- | --- | --- | --- |
| 0 | Overview | All | The four roles and ten steps on one map | §8 Pilot scenario |
| 1 | Set up the store | Mania4 team | New partner store from the template: brand, catalogue, address, pickup point, member import, QR code | WS1, WS6 |
| 2 | Scan the QR code | Supporter | Poster QR → branded store → product page | WS2 |
| 3 | Personalise in 3D | Supporter | Colour, name, number, logo upload with file checks, live production artwork, saved design with four views | WS3 |
| 4 | Pay by MB WAY | Supporter | Cart with views, the Mania4 checkout, member discount, pickup, MB WAY | WS5, WS6 |
| 5 | Confirmation and code | Supporter | Order status, pickup QR code, confirmation email | WS4, WS5 |
| 6 | Check the order | Mania4 team | Orders from every store, order detail, artwork approval, activity log | WS4 |
| 7 | Produce | HELIOtextil | Production queue, production files, status to "ready", customer notified | WS3, WS4 |
| 8 | Pickup at the club | Partner club | Tablet pickup screen: scan, match, hand over. No money handled. | WS4 |
| 9 | Month-end report | Mania4 team | Sales, products, pickups, CSV export for reconciliation | WS6 |
| 10 | The next store | Mania4 team | Store network, five-day set-up for the next partner | §21 Rollout |

Each chapter's header says what is Phase 1 and what comes later (for example,
the self-service store wizard is Phase 2).

## Sample data and honesty notes

- Marés FC, Lumen University, Solar Sound Festival, Rui Silva and all orders and
  figures are fictional. The page says so in the side panel.
- The screens show the intended Phase 1 experience, not the final design.
- The production file is illustrative. In Phase 1 it follows the production
  template agreed with HELIOtextil for the chosen product family.
- The store QR code points at this prototype's own address (`#scan`), so it
  opens the store chapter when scanned from a deployed copy.
- No prices from the proposal appear in the prototype or the video.

## Run it locally

It's a static site with no build step, but it must be served over HTTP (the 3D
model and ES modules don't load from `file://`):

```bash
cd _docs/proposals/mania4-phase-1/prototype
python3 -m http.server 4870
# open http://localhost:4870/
```

Useful addresses:

- `#store`, `#personalise`, `#production` … open a chapter directly.
- `?autoplay` starts the demo straight away.
- `?autoplay&speed=2` plays it twice as fast, to check the flow.

Everything is vendored (three.js r169, the QR code library, Inter and Oswald),
so it works offline, for example in a meeting room without Wi-Fi.

## Deploy

Live at **<https://mania4-phase-1.vercel.app>**: Vercel project `mania4-phase-1`
in the `wppes-pt` team. It's deployed from this folder with the CLI and isn't
connected to Git, so pushing doesn't redeploy it. The demo video is also served
at `/media/Mania4-Platform-Demo.mp4`, behind the same password.

Every deployment, including the production address, has Vercel Password
Protection. The password is not in this repository. Change it under Project
Settings → Deployment Protection.

To redeploy after a change:

```bash
cd _docs/proposals/mania4-phase-1/prototype
vercel link --yes --project mania4-phase-1 --scope wppes-pt   # once per machine
vercel deploy --prod --scope wppes-pt
```

`vercel.json` skips the monorepo install and serves the folder as it is.
`.vercelignore` keeps this README and `tools/` off the site.

## Re-record the video

After changing copy or screens:

```bash
cd _docs/proposals/mania4-phase-1/prototype
npm install --no-save playwright-core     # once
python3 -m http.server 4870 --bind 127.0.0.1 &
node tools/record-demo.js http://127.0.0.1:4870/ media/Mania4-Platform-Demo.mp4
```

It needs Google Chrome and ffmpeg (`FFMPEG=/path/to/ffmpeg` if it isn't on the
`PATH`). The recorder starts the demo in record mode (`?autoplay&record`), takes
Chrome's screencast frames and writes them to ffmpeg at a constant 30 fps. It
takes as long as the demo.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | Page shell: chapters, stage, behind-the-scenes panel, caption bar |
| `app.js` | Sample data, every screen, the chapters and their captions, and the demo director |
| `configurator.js` | The 3D shirt: model loading, texture painting, interactive viewer, four-view snapshots, production artwork |
| `styles.css` | All styles |
| `assets/` | Client logos and key visual (from the deck), the fictional club crest and supporters' badge, the 3D model, fonts |
| `vendor/` | three.js r169 (MIT) and qrcode-generator 1.4.4 (MIT) |
| `media/` | The demo video |
| `tools/record-demo.js` | Records the demo to MP4 |

## Credits

3D model: “Men Regular Apparel Fit Sporty T-Shirt” by BINARYCLOTH
(<https://sketchfab.com/3d-models/men-regular-apparel-fit-sporty-t-shirt-4d055bb8c1e04549a4b2dac7b27ebb2c>),
licensed under CC BY 4.0. The prototype recolours it, removes its printed
graphic and paints new artwork on it. The credit is shown in the page's side
panel and must stay there.
