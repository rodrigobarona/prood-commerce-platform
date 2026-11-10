// Builds the client-branded Phase 1 proposal deck for HELIOPromo × Mania4.
//
//   cd _docs/proposals/mania4-phase-1/deck
//   npm install --no-save pptxgenjs sharp react-icons react react-dom
//   node build-deck.js
//
// Output: Mania4-Phase1-Proposal.pptx next to this file.
// Content source of truth: ../PROPOSAL.md. Change the text there first, then here.

const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const sharp = require("sharp");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const lu = require("react-icons/lu");
const JSZip = require(require.resolve("jszip", { paths: [require.resolve("pptxgenjs")] }));

const PREPARED_BY = "Rodrigo Barona";
const PREPARED_FOR = "André Catalão, CMO, HELIOtextil Group";
const DATE = "November 2026";
const OUT = path.join(__dirname, "Mania4-Phase1-Proposal.pptx");
const ASSETS = path.join(__dirname, "assets");

// ---------------------------------------------------------------------------
// Brand: HELIOPROMO and MANIA4 are monochrome wordmarks. HELIOPromo's key visual
// is an iridescent ring (violet, pink, cyan). The deck keeps black and white
// dominant, with holographic violet as the one strong accent.
// ---------------------------------------------------------------------------
const THEME = {
  name: "HELIOPromo Mania4",
  headFontFace: "Arial",
  bodyFontFace: "Arial",
  colors: {
    dk1: "111114", // ink
    lt1: "FFFFFF",
    dk2: "2A2A33", // charcoal, cards on dark slides
    lt2: "F3F2F8", // cool light grey, cards on light slides
    accent1: "6A3DE8", // holographic violet
    accent2: "13806F", // HELIOtextil teal, deepened for contrast: "reused / existing"
    accent3: "38BDF0", // HELIOPromo cyan, on dark backgrounds
    accent4: "E0479E", // iridescent pink, sparingly
    accent5: "6B6B76", // muted text on light
    accent6: "C9C6DA", // muted text on dark, hairlines
    hlink: "6A3DE8",
    folHlink: "4B2BA6",
  },
};
const HEX = THEME.colors;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.author = PREPARED_BY;
pres.company = "Mania4";
pres.title = "Mania4 Commerce Platform: Phase 1 proposal";
pres.subject = "Phase 1 Commercial MVP proposal for HELIOtextil Group, HELIOPromo and Mania4";
const C = pres.SchemeColor;

const W = 13.333;
const MX = 0.6; // side margin
const CW = W - 2 * MX; // content width 12.133

// ---------------------------------------------------------------------------
// Image helpers
// ---------------------------------------------------------------------------
const b64 = (buf, mime = "image/png") => `${mime};base64,${buf.toString("base64")}`;
const iconCache = new Map();
async function icon(name, hex = "FFFFFF") {
  const key = `${name}:${hex}`;
  if (iconCache.has(key)) return iconCache.get(key);
  const Comp = lu[name];
  if (!Comp) throw new Error(`Unknown icon ${name}`);
  const svg = renderToStaticMarkup(React.createElement(Comp, { size: 256, color: `#${hex}`, strokeWidth: 1.75 })).replace(/currentColor/g, `#${hex}`);
  const data = b64(await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer());
  iconCache.set(key, data);
  return data;
}

async function glowBackground() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
    <defs>
      <radialGradient id="v" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#6A3DE8" stop-opacity="0.95"/><stop offset="100%" stop-color="#6A3DE8" stop-opacity="0"/></radialGradient>
      <radialGradient id="p" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#E0479E" stop-opacity="0.75"/><stop offset="100%" stop-color="#E0479E" stop-opacity="0"/></radialGradient>
      <radialGradient id="c" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#38BDF0" stop-opacity="0.7"/><stop offset="100%" stop-color="#38BDF0" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="1920" height="1080" fill="#111114"/>
    <circle cx="1560" cy="760" r="620" fill="url(#v)"/>
    <circle cx="1820" cy="380" r="420" fill="url(#c)"/>
    <circle cx="1240" cy="1040" r="420" fill="url(#p)"/>
  </svg>`;
  return b64(await sharp(Buffer.from(svg)).blur(40).png().toBuffer());
}

async function ringImage() {
  const ring = (blur) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#38BDF0"/><stop offset="35%" stop-color="#6A3DE8"/>
        <stop offset="70%" stop-color="#E0479E"/><stop offset="100%" stop-color="#F6C8E4"/>
      </linearGradient>
    </defs>
    <circle cx="600" cy="600" r="430" fill="none" stroke="url(#g)" stroke-width="${blur ? 110 : 64}" stroke-opacity="${blur ? 0.55 : 0.95}"/>
  </svg>`;
  const glow = await sharp(Buffer.from(ring(true))).blur(38).png().toBuffer();
  const crisp = await sharp(Buffer.from(ring(false))).png().toBuffer();
  return b64(await sharp(glow).composite([{ input: crisp }]).png().toBuffer());
}

async function prepareImages() {
  const keyVisual = await sharp(path.join(ASSETS, "heliopromo-key-visual.jpg"))
    .resize({ width: 1046, height: 1260, fit: "cover", position: "centre" }) // 6.233 x 7.5 in at 168 dpi
    .jpeg({ quality: 90 })
    .toBuffer();
  const maniaWhite = fs.readFileSync(path.join(ASSETS, "mania4-logo-white.png"));
  const maniaBlack = await sharp(maniaWhite).negate({ alpha: false }).png().toBuffer();
  return {
    keyVisual: b64(keyVisual, "image/jpeg"),
    hpBlack: b64(fs.readFileSync(path.join(ASSETS, "heliopromo-logo-black.png"))),
    hpWhite: b64(fs.readFileSync(path.join(ASSETS, "heliopromo-logo-white.png"))),
    maniaWhite: b64(maniaWhite),
    maniaBlack: b64(maniaBlack),
    glow: await glowBackground(),
    ring: await ringImage(),
  };
}

// ---------------------------------------------------------------------------
// Layouts
// ---------------------------------------------------------------------------
const FOOTER = `HELIOPROMO × MANIA4   ·   Phase 1 proposal   ·   ${DATE}`;
const HP_RATIO = 380 / 76;
const M4_RATIO = 1840 / 375;

function defineLayouts(img) {
  const kicker = (color) => ({
    placeholder: {
      options: { name: "kicker", type: "body", x: MX, y: 0.42, w: 10, h: 0.3, fontSize: 11, bold: true, color, charSpacing: 2, margin: 0, valign: "middle" },
      text: "",
    },
  });
  const title = (color) => ({
    placeholder: {
      options: { name: "title", type: "title", x: MX, y: 0.74, w: CW, h: 0.75, fontSize: 32, bold: true, color, margin: 0, valign: "top", align: "left" },
      text: "",
    },
  });
  const footer = (textColor, logo) => [
    { text: { text: FOOTER, options: { x: MX, y: 6.98, w: 8, h: 0.3, fontSize: 10, color: textColor, margin: 0, valign: "middle" } } },
    { image: { data: logo, x: 10.75, y: 7.03, w: 1.0, h: 1.0 / M4_RATIO } },
  ];
  const slideNumber = (color) => ({ x: 12.23, y: 6.98, w: 0.5, h: 0.3, fontSize: 10, color, align: "right", margin: 0 });

  pres.defineSlideMaster({
    title: "M4_LIGHT",
    background: { color: C.background1 },
    objects: [kicker(C.accent1), title(C.text1), ...footer(C.accent5, img.maniaBlack)],
    slideNumber: slideNumber(C.accent5),
  });

  pres.defineSlideMaster({
    title: "M4_DARK",
    background: { color: C.text1 },
    objects: [kicker(C.accent3), title(C.background1), ...footer(C.accent6, img.maniaWhite)],
    slideNumber: slideNumber(C.accent6),
  });

  pres.defineSlideMaster({
    title: "M4_DIVIDER",
    background: { data: img.glow },
    objects: [
      { image: { data: img.ring, x: 7.9, y: 0.9, w: 5.9, h: 5.9 } },
      { placeholder: { options: { name: "secnum", type: "body", x: 0.9, y: 2.35, w: 3, h: 0.5, fontSize: 20, bold: true, color: C.accent3, margin: 0, charSpacing: 2 }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", x: 0.9, y: 2.9, w: 7.6, h: 1.0, fontSize: 44, bold: true, color: C.background1, margin: 0, valign: "top", align: "left" }, text: "" } },
      { placeholder: { options: { name: "subtitle", type: "body", x: 0.9, y: 4.05, w: 6.8, h: 1.0, fontSize: 18, color: C.accent6, margin: 0, valign: "top" }, text: "" } },
      ...footer(C.accent6, img.maniaWhite),
    ],
    slideNumber: slideNumber(C.accent6),
  });

  pres.defineSlideMaster({
    title: "M4_COVER",
    background: { color: C.text1 },
    objects: [
      { image: { data: img.keyVisual, x: 7.1, y: 0, w: W - 7.1, h: 7.5 } },
      { image: { data: img.hpWhite, x: 0.75, y: 0.7, w: 2.1, h: 2.1 / HP_RATIO } },
      { text: { text: "×", options: { x: 3.0, y: 0.62, w: 0.35, h: 0.5, fontSize: 20, color: C.accent6, align: "center", valign: "middle", margin: 0 } } },
      { image: { data: img.maniaWhite, x: 3.5, y: 0.67, w: 2.1, h: 2.1 / M4_RATIO } },
      { placeholder: { options: { name: "title", type: "title", x: 0.75, y: 2.6, w: 6.0, h: 1.65, fontSize: 44, bold: true, color: C.background1, margin: 0, valign: "top", align: "left" }, text: "" } },
      { placeholder: { options: { name: "subtitle", type: "body", x: 0.75, y: 4.35, w: 5.8, h: 1.1, fontSize: 18, color: C.accent6, margin: 0, valign: "top" }, text: "" } },
    ],
  });
}

// ---------------------------------------------------------------------------
// Composition helpers
// ---------------------------------------------------------------------------
let objId = 0;
const nm = (s) => `${s}-${++objId}`;

function addLight(section, kicker, title, notes) {
  const s = pres.addSlide({ masterName: "M4_LIGHT", sectionTitle: section });
  s.addText(kicker, { placeholder: "kicker" });
  s.addText(title, { placeholder: "title" });
  if (notes) s.addNotes(notes);
  return s;
}
function addDark(section, kicker, title, notes) {
  const s = pres.addSlide({ masterName: "M4_DARK", sectionTitle: section });
  s.addText(kicker, { placeholder: "kicker" });
  s.addText(title, { placeholder: "title" });
  if (notes) s.addNotes(notes);
  return s;
}
function addDivider(section, num, title, subtitle, notes) {
  const s = pres.addSlide({ masterName: "M4_DIVIDER", sectionTitle: section });
  s.addText(num, { placeholder: "secnum" });
  s.addText(title, { placeholder: "title" });
  s.addText(subtitle, { placeholder: "subtitle" });
  if (notes) s.addNotes(notes);
  return s;
}

function card(slide, x, y, w, h, fill = C.background2, extra = {}) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: fill }, line: { type: "none" }, objectName: nm("card"), ...extra });
}

async function iconCircle(slide, name, x, y, d, fill = C.accent1, iconHex = "FFFFFF") {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" }, objectName: nm("icon-bg") });
  const pad = d * 0.24;
  slide.addImage({ data: await icon(name, iconHex), x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad, altText: name.replace(/^Lu/, "") + " icon", objectName: nm("icon") });
}

async function iconPlain(slide, name, hex, x, y, d) {
  slide.addImage({ data: await icon(name, hex), x, y, w: d, h: d, altText: name.replace(/^Lu/, "") + " icon", objectName: nm("icon") });
}

function text(slide, t, opts) {
  slide.addText(t, { isTextBox: true, margin: 0, valign: "top", fontSize: 14, color: C.text1, objectName: nm("text"), ...opts });
}

function bullets(slide, items, opts) {
  const runs = items.map((it, i) => {
    const o = { bullet: { indent: 14 }, breakLine: i < items.length - 1 };
    if (typeof it === "string") return { text: it, options: o };
    return { text: it.text, options: { ...o, ...it.options } };
  });
  slide.addText(runs, { isTextBox: true, margin: 0, valign: "top", fontSize: 14, color: C.text1, paraSpaceAfter: 5, objectName: nm("list"), ...opts });
}

function chip(slide, label, x, y, w, fill, color, h = 0.3) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: h / 2, fill: { color: fill }, line: { type: "none" }, objectName: nm("chip") });
  slide.addText(label, { isTextBox: true, x, y, w, h, margin: 0, align: "center", valign: "middle", fontSize: 10, bold: true, color, charSpacing: 1, objectName: nm("chip-text") });
}

function arrow(slide, x1, y1, x2, y2, hex) {
  slide.addShape(pres.shapes.LINE, {
    x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
    flipV: y2 < y1, flipH: x2 < x1,
    line: { color: hex, width: 1.5, endArrowType: "triangle" }, objectName: nm("arrow"),
  });
}

// ---------------------------------------------------------------------------
// Slides
// ---------------------------------------------------------------------------
async function build() {
  const img = await prepareImages();
  defineLayouts(img);

  // 1 · Cover -------------------------------------------------------------
  pres.addSection({ title: "Introduction" });
  {
    const s = pres.addSlide({ masterName: "M4_COVER", sectionTitle: "Introduction" });
    text(s, "PROPOSAL   ·   PHASE 1   ·   COMMERCIAL MVP", { x: 0.75, y: 2.15, w: 6, h: 0.3, fontSize: 11, bold: true, color: C.accent3, charSpacing: 2 });
    s.addText("Mania4 Commerce Platform", { placeholder: "title" });
    s.addText("Sell, personalise in 3D and produce merchandise for every partner, from one platform.", { placeholder: "subtitle" });
    text(s, [
      { text: "Prepared for ", options: { color: C.accent6 } },
      { text: PREPARED_FOR, options: { color: C.background1, bold: true, breakLine: true } },
      { text: `Prepared by ${PREPARED_BY}   ·   ${DATE}`, options: { color: C.accent6 } },
    ], { x: 0.75, y: 6.15, w: 6.1, h: 0.6, fontSize: 12, paraSpaceAfter: 4 });
    s.addNotes("Phase 1 of the Mania4 Commerce Platform: one complete commercial journey, from a branded store to a personalised product collected by the customer, for a fixed €49,500 excluding VAT, with a choice of how to pay for the platform licence.");
  }

  // 2 · Executive summary -------------------------------------------------
  {
    const s = addLight("Introduction", "EXECUTIVE SUMMARY", "A complete commercial journey in one phase",
      "Phase 1 is not a prototype. It is the full journey with real payments, for two stores in Portuguese and English and one 3D product family. The price works because it is built on two foundations that already exist. The platform licence is paid either through a small fee per order or once.");
    text(s, "Phase 1 lets Mania4 sell personalised merchandise through the HELIOPromo store and one partner store, take real payments, send production-ready files to HELIOtextil and manage pickup or delivery.",
      { x: MX, y: 1.68, w: 11.4, h: 0.85, fontSize: 16, color: C.text2 });
    const stats = [
      ["€49.5k", "fixed price, excluding VAT"],
      ["10–14", "weeks to launch"],
      ["2", "pilot stores"],
      ["PT/EN", "store languages"],
      ["1", "3D product family"],
    ];
    const tw = (CW - 4 * 0.2) / 5;
    stats.forEach(([n, l], i) => {
      const x = MX + i * (tw + 0.2);
      card(s, x, 2.75, tw, 1.65);
      text(s, n, { x: x + 0.25, y: 2.95, w: tw - 0.4, h: 0.7, fontSize: 38, bold: true, color: C.accent1 });
      text(s, l, { x: x + 0.25, y: 3.72, w: tw - 0.4, h: 0.5, fontSize: 13, color: C.text2 });
    });
    text(s, "Built on two existing foundations, so the budget goes into what only Mania4 needs.", { x: MX, y: 4.72, w: CW, h: 0.35, fontSize: 15, bold: true });
    const halves = [
      ["LuStore", C.accent2, "Commerce platform", "Stores, catalogue, central checkout, Easypay, orders, roles and custom domains."],
      ["LuRotate3D", C.accent1, "3D Customisation Engine", "Real-time 3D configurator, texture engine and Zone Studio for personalisation zones."],
    ];
    for (const [i, [ic, col, h, d]] of halves.entries()) {
      const x = MX + i * (CW / 2 + 0.1);
      card(s, x, 5.2, CW / 2 - 0.1, 1.35, C.background1, { line: { color: HEX.accent6, width: 1 } });
      await iconCircle(s, ic, x + 0.3, 5.47, 0.8, col);
      text(s, h, { x: x + 1.35, y: 5.38, w: 4.4, h: 0.35, fontSize: 15, bold: true });
      text(s, d, { x: x + 1.35, y: 5.75, w: 4.4, h: 0.65, fontSize: 13, color: C.text2 });
    }
  }

  // 3 · What we heard ------------------------------------------------------
  {
    const s = addLight("Introduction", "WHAT WE HEARD   ·   MEETING OF 28 MAY 2026", "Not a website: an application to replicate",
      "These six points from our meeting shape every decision in this proposal.");
    const items = [
      ["LuLayers", "One application, many stores", "Replicate the store for clubs, universities and events, on web, tablet and MUPI."],
      ["LuBadgeCheck", "Mania4 sells and invoices", "HELIOPromo and HELIOtextil can't sell retail, so every sale is made by Mania4."],
      ["LuCreditCard", "One checkout for every store", "Each store has its own name and address. Payment always runs through Mania4."],
      ["LuHandshake", "Partners don't handle money", "They validate a pickup code and settle the accounts with Mania4 at month end."],
      ["LuShirt", "Personalisation is the edge", "Colours, names, numbers and logos on a 3D product, ready for production."],
      ["LuWallet", "Two funding lines", "One platform, budgeted as HELIOPromo commerce presence and a replicable sales platform."],
    ];
    const cw = (CW - 0.4) / 3;
    for (const [i, [ic, h, d]] of items.entries()) {
      const x = MX + (i % 3) * (cw + 0.2);
      const y = 1.75 + Math.floor(i / 3) * 2.42;
      card(s, x, y, cw, 2.22);
      await iconCircle(s, ic, x + 0.3, y + 0.3, 0.62, i === 1 || i === 2 ? C.accent1 : C.text1);
      text(s, h, { x: x + 0.3, y: y + 1.08, w: cw - 0.6, h: 0.35, fontSize: 16, bold: true });
      text(s, d, { x: x + 0.3, y: y + 1.48, w: cw - 0.6, h: 0.72, fontSize: 13, color: C.text2 });
    }
  }

  // 4 · Operating model -----------------------------------------------------
  {
    const s = addDark("Introduction", "OPERATING MODEL", "Mania4 owns the sale; partners hand over",
      "Mania4 is the merchant of record. The partner never touches the payment: it receives a notification and validates a pickup code, like a delivery app. Accounts are settled monthly from the platform's reports.");
    const nodes = [
      ["LuSmartphone", "Customer", "Buys on the web, by QR code or on a tablet"],
      ["LuStore", "Partner store", "Branded store on its own address"],
      ["LuCreditCard", "Mania4 checkout", "Easypay payment, invoice by Mania4"],
      ["LuFactory", "HELIOtextil", "Receives the files and produces"],
      ["LuPackageCheck", "Handover", "Pickup code at the partner, or delivery by post"],
    ];
    const nw = 2.1, gap = (CW - 5 * nw) / 4;
    for (const [i, [ic, h, d]] of nodes.entries()) {
      const x = MX + i * (nw + gap);
      const hot = i === 2;
      card(s, x, 1.8, nw, 1.95, hot ? C.accent1 : C.text2);
      await iconPlain(s, ic, "FFFFFF", x + 0.25, 2.02, 0.48);
      text(s, h, { x: x + 0.25, y: 2.65, w: nw - 0.4, h: 0.35, fontSize: 15, bold: true, color: C.background1 });
      text(s, d, { x: x + 0.25, y: 3.02, w: nw - 0.4, h: 0.65, fontSize: 12, color: hot ? C.background1 : C.accent6 });
      if (i < 4) arrow(s, x + nw + 0.06, 2.77, x + nw + gap - 0.06, 2.77, HEX.accent6);
    }
    const roles = [
      ["Mania4", "Merchant of record. Checkout, payments, invoicing, customer and order data."],
      ["HELIOPromo", "The reference store. Always online, it shows the offer and sells under Mania4."],
      ["Partner", "Own store and catalogue. Gets order alerts, validates pickups, no payments."],
      ["HELIOtextil", "Produces from the files attached to each order and updates the status."],
    ];
    const rw = (CW - 0.6) / 4;
    roles.forEach(([h, d], i) => {
      const x = MX + i * (rw + 0.2);
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 4.1, w: rw, h: 1.6, rectRadius: 0.12, fill: { color: C.text1 }, line: { color: C.text2, width: 1.25 }, objectName: nm("role") });
      text(s, h, { x: x + 0.25, y: 4.28, w: rw - 0.5, h: 0.35, fontSize: 15, bold: true, color: C.accent3 });
      text(s, d, { x: x + 0.25, y: 4.68, w: rw - 0.5, h: 0.95, fontSize: 12, color: C.accent6 });
    });
    await iconPlain(s, "LuEuro", HEX.accent3, MX, 6.0, 0.4);
    text(s, [
      { text: "Money flow   ", options: { bold: true, color: C.background1 } },
      { text: "The customer pays Mania4  →  Mania4 invoices  →  each partner is settled monthly from the platform's reports.", options: { color: C.accent6 } },
    ], { x: MX + 0.6, y: 6.0, w: CW - 0.6, h: 0.4, fontSize: 14, valign: "middle" });
  }

  // 5 · Pilot scenario -----------------------------------------------------
  {
    const s = addLight("Introduction", "THE PILOT SCENARIO", "One football club, start to finish",
      "Phase 1 is judged against this one scenario. Once it runs end to end, it can be shown to the next club, university, festival or event.");
    const steps = [
      ["Club store", "Its own branded Mania4 store"],
      ["QR or link", "Supporters arrive from anywhere"],
      ["Choose", "They pick the club shirt"],
      ["Personalise", "Colours, name, number and club logo"],
      ["See it in 3D", "The design is saved with an ID"],
      ["Pay", "Multibanco, MB WAY or card, to Mania4"],
      ["Order in", "Mania4 gets the preview and files"],
      ["Produce", "HELIOtextil makes the shirt"],
      ["Collect", "Pickup code shown at the club shop"],
    ];
    const colW = CW / 9;
    const phases = [["SHOP", C.accent2], ["PERSONALISE AND PAY", C.accent1], ["PRODUCE AND DELIVER", C.text1]];
    phases.forEach(([p, col], i) => chip(s, p, MX + i * 3 * colW + 0.08, 1.75, 3 * colW - 0.16, col, C.background1, 0.34));
    const cy = 2.62;
    s.addShape(pres.shapes.LINE, { x: MX + colW / 2, y: cy, w: CW - colW, h: 0, line: { color: HEX.accent6, width: 2 }, objectName: nm("timeline") });
    steps.forEach(([h, d], i) => {
      const cx = MX + i * colW + colW / 2;
      const col = i < 3 ? C.accent2 : i < 6 ? C.accent1 : C.text1;
      s.addShape(pres.shapes.OVAL, { x: cx - 0.31, y: cy - 0.31, w: 0.62, h: 0.62, fill: { color: col }, line: { color: C.background1, width: 3 }, objectName: nm("step") });
      text(s, String(i + 1), { x: cx - 0.31, y: cy - 0.31, w: 0.62, h: 0.62, fontSize: 16, bold: true, color: C.background1, align: "center", valign: "middle" });
      text(s, h, { x: MX + i * colW + 0.06, y: 3.15, w: colW - 0.12, h: 0.32, fontSize: 14, bold: true, align: "center" });
      text(s, d, { x: MX + i * colW + 0.06, y: 3.5, w: colW - 0.12, h: 1.1, fontSize: 12, color: C.text2, align: "center" });
    });
    card(s, MX, 4.85, CW, 1.25);
    await iconCircle(s, "LuRepeat", MX + 0.35, 5.1, 0.75, C.accent1);
    text(s, [
      { text: "Then replicate it. ", options: { bold: true } },
      { text: "The same journey works for a university, a festival or a corporate event, and the next store is set up from the template without a new build.", options: { color: C.text2 } },
    ], { x: MX + 1.35, y: 5.05, w: CW - 1.7, h: 0.85, fontSize: 15, valign: "middle" });
  }

  // 6 · Divider: solution ---------------------------------------------------
  pres.addSection({ title: "The solution" });
  addDivider("The solution", "01", "The solution", "Two existing foundations, connected and completed for Mania4.");

  // 7 · Two foundations -----------------------------------------------------
  {
    const s = addLight("The solution", "THE SOLUTION", "Built on two foundations that already exist",
      "The commerce platform is production software. The 3D engine is a working proof of concept: Phase 1 finishes what is still missing, such as saving designs, server-side production files and the link to orders.");
    const cols = [
      {
        ic: "LuStore", col: C.accent2, h: "Commerce platform", sub: "EXISTING   ·   PROPRIETARY   ·   API-FIRST",
        items: ["Many stores, each with its own isolated data", "Storefront, management dashboard and admin", "Catalogue with variants, stock and VAT", "Cart, coupons, promotions and shipping", "Central hosted checkout", "Easypay: Multibanco, MB WAY and card", "Users, roles and custom domains", "REST API, file storage and email"],
      },
      {
        ic: "LuRotate3D", col: C.accent1, h: "3D Customisation Engine", sub: "EXISTING   ·   PROOF OF CONCEPT V0.1",
        items: ["Real-time 3D viewer for GLB models", "Texture engine at 2048 × 2048 px: same input, same output", "Colours, text, names and numbers", "Logo upload inside defined zones", "Zone Studio to draw personalisation areas", "Product rules in a validated schema", "API for configuration, preview and export"],
      },
    ];
    const w = (CW - 0.25) / 2;
    for (const [i, c] of cols.entries()) {
      const x = MX + i * (w + 0.25);
      card(s, x, 1.72, w, 4.3);
      await iconCircle(s, c.ic, x + 0.35, 1.97, 0.75, c.col);
      text(s, c.h, { x: x + 1.3, y: 1.98, w: w - 1.6, h: 0.4, fontSize: 20, bold: true });
      text(s, c.sub, { x: x + 1.3, y: 2.4, w: w - 1.6, h: 0.3, fontSize: 10, bold: true, color: c.col, charSpacing: 1 });
      bullets(s, c.items, { x: x + 0.4, y: 2.95, w: w - 0.75, h: 2.95, fontSize: 14 });
    }
    await iconPlain(s, "LuPuzzle", HEX.accent1, MX, 6.27, 0.38);
    text(s, "Phase 1 connects them, finishes what is still proof of concept, and adds what only Mania4 needs.",
      { x: MX + 0.55, y: 6.25, w: CW - 0.55, h: 0.42, fontSize: 15, bold: true, color: C.accent1, valign: "middle" });
  }

  // 8 · Reuse vs build ---------------------------------------------------
  {
    const s = addLight("The solution", "REUSE FIRST", "Reuse what works, build what is specific",
      "The commerce core stays generic and intact. Mania4-specific needs are built on top, which keeps the platform maintainable and lets Mania4 benefit from future improvements.");
    const cols = [
      { ic: "LuCircleCheck", col: C.accent2, h: "Reused as is", items: ["Stores with isolated data", "Catalogue, variants, stock, VAT", "Cart, coupons and shipping", "Central hosted checkout", "Easypay payments", "Roles and permissions", "Custom domains", "Email notifications"] },
      { ic: "LuWrench", col: C.text1, h: "Adapted for Mania4", items: ["Store template and branding", "Dashboard → production screens", "3D configurator → cart and orders", "Zone Studio → saved in the database", "Texture engine → production file on the server", "Coupons → member discounts"] },
      { ic: "LuSparkles", col: C.accent1, h: "New for Mania4", items: ["Production statuses and artwork check", "Pickup codes with QR validation", "Partner pickup screen", "Partner sales and pickup reports", "Member list import from CSV"] },
    ];
    const w = (CW - 0.4) / 3;
    for (const [i, c] of cols.entries()) {
      const x = MX + i * (w + 0.2);
      card(s, x, 1.72, w, 3.95);
      await iconCircle(s, c.ic, x + 0.3, 1.97, 0.62, c.col);
      text(s, c.h, { x: x + 1.08, y: 2.0, w: w - 1.3, h: 0.36, fontSize: 18, bold: true });
      text(s, `${c.items.length} capabilities`, { x: x + 1.08, y: 2.36, w: w - 1.3, h: 0.25, fontSize: 11, color: C.accent5 });
      bullets(s, c.items, { x: x + 0.35, y: 2.9, w: w - 0.6, h: 2.65, fontSize: 14 });
    }
    await iconPlain(s, "LuShieldCheck", HEX.accent1, MX, 5.97, 0.38);
    text(s, "The commerce core stays generic and intact, so Mania4 benefits from every future improvement to it.",
      { x: MX + 0.55, y: 5.95, w: CW - 0.55, h: 0.42, fontSize: 15, bold: true, color: C.accent1, valign: "middle" });
  }

  // 9 · Architecture ------------------------------------------------------
  {
    const s = addLight("The solution", "ARCHITECTURE", "One platform, every store, one checkout",
      "The commerce core is the source of truth for products, prices, stock and orders. The 3D engine owns models, zones and designs. An order line simply points to its design.");
    const lx = MX, gx = 2.05, gw = 6.95;
    const rowLabel = (t, y, h) => text(s, t, { x: lx, y, w: 1.35, h, fontSize: 10, bold: true, color: C.accent5, charSpacing: 1, valign: "middle" });
    const box = (x, y, w, h, title, sub, fill = C.background2, color = C.text1, subColor = C.accent5) => {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.1, fill: { color: fill }, line: { type: "none" }, objectName: nm("arch") });
      text(s, sub ? [{ text: title, options: { bold: true, breakLine: true } }, { text: sub, options: { fontSize: 11, color: subColor } }] : [{ text: title, options: { bold: true } }],
        { x: x + 0.1, y, w: w - 0.2, h, fontSize: 13, color, align: "center", valign: "middle" });
    };
    const row = (n, i, gap = 0.15) => { const w = (gw - (n - 1) * gap) / n; return { x: gx + i * (w + gap), w }; };

    rowLabel("CHANNELS", 1.72, 0.55);
    ["Web and mobile", "QR codes", "Tablet or MUPI"].forEach((t, i) => { const r = row(3, i); box(r.x, 1.72, r.w, 0.55, t, null); });
    rowLabel("STORES", 2.6, 0.75);
    [["HELIOPromo store", "reference brand store"], ["Partner store", "club, university or event"]].forEach(([t, d], i) => { const r = row(2, i); box(r.x, 2.6, r.w, 0.75, t, d, C.background1, C.text1, C.accent5); s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: r.x, y: 2.6, w: r.w, h: 0.75, rectRadius: 0.1, fill: { type: "none" }, line: { color: HEX.accent1, width: 1.5 }, objectName: nm("store-outline") }); });
    rowLabel("MANIA4 PLATFORM", 3.68, 1.2);
    [["Commerce core", "products, prices, cart, orders", C.text1], ["Central checkout", "Mania4 is the merchant", C.accent1], ["3D engine", "configurator, Zone Studio, export", C.text1], ["Operations", "production, pickup, reports", C.text1]]
      .forEach(([t, d, f], i) => { const r = row(4, i); box(r.x, 3.68, r.w, 1.2, t, d, f, C.background1, C.accent6); });
    rowLabel("SERVICES", 5.2, 0.7);
    [["PostgreSQL", "per-store data isolation"], ["Object storage", "3D models, previews, files"], ["Email", "notifications"]].forEach(([t, d], i) => { const r = row(3, i); box(r.x, 5.2, r.w, 0.7, t, d); });
    rowLabel("PAYMENTS", 6.12, 0.5);
    box(gx, 6.12, gw, 0.5, "Easypay   ·   Multibanco, MB WAY, card", null, C.background1, C.accent1);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: gx, y: 6.12, w: gw, h: 0.5, rectRadius: 0.1, fill: { type: "none" }, line: { color: HEX.accent1, width: 1.25, dashType: "dash" }, objectName: nm("pay-outline") });
    // connectors between rows
    [[2.27, 2.6], [3.35, 3.68], [4.88, 5.2]].forEach(([a, b]) => [gx + gw * 0.25, gx + gw * 0.75].forEach((x) => arrow(s, x, a + 0.02, x, b - 0.02, HEX.accent5)));

    const rx = 9.35, rw = W - MX - rx;
    card(s, rx, 1.72, rw, 4.9);
    text(s, "Who owns which data", { x: rx + 0.3, y: 1.95, w: rw - 0.6, h: 0.4, fontSize: 16, bold: true });
    const notes = [
      ["LuDatabase", C.text1, "Commerce core", "products, prices, stock, customers and orders"],
      ["LuRotate3D", C.accent1, "3D engine", "models, zones, rules and saved designs"],
      ["LuLink", C.accent2, "Order line", "points to the design ID, preview and production file"],
      ["LuLock", C.text1, "Mania4's accounts", "every service runs in accounts Mania4 owns"],
    ];
    for (const [i, [ic, col, h, d]] of notes.entries()) {
      const y = 2.55 + i * 0.98;
      await iconCircle(s, ic, rx + 0.3, y, 0.5, col);
      text(s, [{ text: h, options: { bold: true, breakLine: true } }, { text: d, options: { color: C.text2 } }], { x: rx + 0.95, y: y - 0.04, w: rw - 1.2, h: 0.85, fontSize: 13 });
    }
  }

  // 10 · Divider: scope --------------------------------------------------
  pres.addSection({ title: "Phase 1 scope" });
  addDivider("Phase 1 scope", "02", "Phase 1 scope", "Six workstreams that deliver one complete journey.");

  // 11 · Six workstreams ----------------------------------------------------
  {
    const s = addLight("Phase 1 scope", "PHASE 1 SCOPE", "Six workstreams, one complete journey",
      "Each workstream is tagged with the funding line it belongs to. Line A is the HELIOPromo commerce presence; line B is the replicable sales platform for client projects.");
    const ws = [
      ["LuSettings", "Platform setup", "A + B", "Mania4 environments, two branded stores, store addresses, roles for Mania4 and partners."],
      ["LuLayoutTemplate", "Customer storefront", "LINE A", "One template in Portuguese and English: catalogue, product pages, cart, pickup or delivery."],
      ["LuRotate3D", "3D personalisation", "LINE B", "One product family: colours, text, names, numbers, a logo, four views and the production file."],
      ["LuFactory", "Orders and production", "LINE B", "Production statuses, design files, pickup codes and QR validation."],
      ["LuCreditCard", "Payments and notifications", "LINE A", "Easypay with Multibanco, MB WAY and card. Emails to customer, Mania4 and partner."],
      ["LuChartBar", "Reporting and imports", "LINE B", "Partner sales and pickups, CSV export, member list import and discount."],
    ];
    const cw = (CW - 0.4) / 3;
    for (const [i, [ic, h, tag, d]] of ws.entries()) {
      const x = MX + (i % 3) * (cw + 0.2);
      const y = 1.72 + Math.floor(i / 3) * 2.48;
      card(s, x, y, cw, 2.3);
      const tagCol = tag === "LINE A" ? C.accent2 : tag === "LINE B" ? C.accent1 : C.text1;
      await iconCircle(s, ic, x + 0.3, y + 0.3, 0.6, tagCol);
      text(s, String(i + 1).padStart(2, "0"), { x: x + 1.05, y: y + 0.38, w: 0.6, h: 0.45, fontSize: 20, bold: true, color: C.accent5, valign: "middle" });
      chip(s, tag, x + cw - 1.15, y + 0.45, 0.85, tagCol, C.background1);
      text(s, h, { x: x + 0.3, y: y + 1.05, w: cw - 0.6, h: 0.38, fontSize: 17, bold: true });
      text(s, d, { x: x + 0.3, y: y + 1.45, w: cw - 0.6, h: 0.8, fontSize: 13, color: C.text2 });
    }
  }

  // 12 · WS1 + WS2 --------------------------------------------------------
  {
    const s = addLight("Phase 1 scope", "WORKSTREAMS 1 AND 2", "Two branded stores from one template",
      "No new commerce engine is developed. Both stores run on the existing platform, from one Mania4 template.");
    const cols = [
      { ic: "LuSettings", col: C.text1, h: "1 · Platform setup", items: ["Production and staging environments in Mania4's accounts", "Mania4 as operator and merchant of record", "HELIOPromo reference store", "One partner store from the same template", "Name, logo, colours and content per store", "Catalogue per store, from one shared product base", "Its own address for each store", "Roles: Mania4 admin, Mania4 operator, partner operator"] },
      { ic: "LuLayoutTemplate", col: C.accent2, h: "2 · Customer storefront", items: ["Home page and content pages", "Product listing and categories", "Product pages with sizes and colours", "“Buy as is” or “Personalise”", "Cart, checkout and order confirmation", "Pickup or delivery, set per store", "Desktop, tablet and mobile", "Portuguese and English, plus basic analytics"] },
    ];
    const w = (CW - 0.3) / 2;
    for (const [i, c] of cols.entries()) {
      const x = MX + i * (w + 0.3);
      await iconCircle(s, c.ic, x, 1.75, 0.58, c.col);
      text(s, c.h, { x: x + 0.75, y: 1.75, w: w - 0.8, h: 0.58, fontSize: 18, bold: true, valign: "middle" });
      bullets(s, c.items, { x: x + 0.05, y: 2.55, w: w - 0.1, h: 2.85, fontSize: 14 });
    }
    card(s, MX, 5.55, CW, 1.0);
    const flow = [["LuLayoutTemplate", "One Mania4 template"], ["LuStore", "HELIOPromo store + partner store"], ["LuCopyPlus", "Next store: configuration, not a new build"]];
    const fw = CW / 3;
    for (const [i, [ic, t]] of flow.entries()) {
      const x = MX + i * fw;
      await iconCircle(s, ic, x + 0.3, 5.75, 0.6, i === 2 ? C.accent1 : C.text1);
      text(s, t, { x: x + 1.05, y: 5.75, w: fw - 1.5, h: 0.6, fontSize: 14, bold: true, valign: "middle" });
      if (i < 2) arrow(s, x + fw - 0.42, 6.05, x + fw - 0.08, 6.05, HEX.accent5);
    }
  }

  // 13 · WS3: 3D ----------------------------------------------------------
  {
    const s = addLight("Phase 1 scope", "WORKSTREAM 3", "3D personalisation for one product family",
      "The engine's Zone Studio lets a designer draw the areas that can be personalised on the product's texture map, instead of programming each product. The example zones on the left are the engine's sample T-shirt.");
    // Texture map illustration (2048 x 2048 UV space, zones from the engine's sample product)
    const sx = MX, sy = 1.72, sw = 3.9;
    const k = sw / 2048;
    s.addShape(pres.shapes.RECTANGLE, { x: sx, y: sy, w: sw, h: sw, fill: { color: C.text1 }, line: { type: "none" }, objectName: nm("uv-map") });
    for (let g = 1; g < 8; g++) {
      s.addShape(pres.shapes.LINE, { x: sx + (g * sw) / 8, y: sy, w: 0, h: sw, line: { color: HEX.dk2, width: 0.75 }, objectName: nm("grid") });
      s.addShape(pres.shapes.LINE, { x: sx, y: sy + (g * sw) / 8, w: sw, h: 0, line: { color: HEX.dk2, width: 0.75 }, objectName: nm("grid") });
    }
    text(s, "BACK", { x: sx + 0.15, y: sy + 0.12, w: 1, h: 0.25, fontSize: 10, bold: true, color: C.accent6, charSpacing: 2 });
    text(s, "FRONT", { x: sx + sw / 2 + 0.15, y: sy + 0.12, w: 1, h: 0.25, fontSize: 10, bold: true, color: C.accent6, charSpacing: 2 });
    const zones = [
      ["Back name", 310, 1060, 400, 150, C.accent3],
      ["Back number", 380, 1280, 260, 300, C.accent1],
      ["Front text", 1330, 1060, 420, 180, C.accent4],
      ["Sleeve logo", 1410, 400, 180, 180, C.accent2],
    ];
    zones.forEach(([label, zx, zy, zw, zh, col]) => {
      s.addShape(pres.shapes.RECTANGLE, { x: sx + zx * k, y: sy + zy * k, w: zw * k, h: zh * k, fill: { color: col, transparency: 35 }, line: { color: C.background1, width: 1, dashType: "dash" }, objectName: nm("zone") });
      const above = label === "Back name"; // the back number sits right below it
      text(s, label, { x: sx + zx * k - 0.15, y: above ? sy + zy * k - 0.27 : sy + (zy + zh) * k + 0.04, w: zw * k + 0.3, h: 0.22, fontSize: 10, bold: true, color: C.background1, align: "center" });
    });
    text(s, "Zone Studio: personalisation zones drawn on the product's texture map (sample product).", { x: sx, y: sy + sw + 0.1, w: sw, h: 0.5, fontSize: 10, color: C.accent5 });

    const rx = 4.85, rw = W - MX - rx;
    text(s, "Included", { x: rx, y: 1.72, w: 3, h: 0.35, fontSize: 16, bold: true });
    const inc = [
      "Opens from the product page", "Rotate, zoom and inspect in 3D", "Predefined colours", "Text, names and numbers, with limits", "One logo upload, with file checks", "Design added to the cart and the order",
      "Product setup saved in the database", "Zone Studio for Mania4 administrators", "Every design saved with a unique ID", "Four views: front, back and both sides", "Views in the cart, order and email", "Production file generated on the server",
    ];
    const cw2 = (rw - 0.3) / 2;
    for (const [i, t] of inc.entries()) {
      const col = i < 6 ? 0 : 1, rowi = i < 6 ? i : i - 6;
      const x = rx + col * (cw2 + 0.3), y = 2.2 + rowi * 0.47;
      await iconPlain(s, "LuCircleCheck", col === 0 ? HEX.accent2 : HEX.accent1, x, y + 0.03, 0.27);
      text(s, t, { x: x + 0.4, y, w: cw2 - 0.4, h: 0.34, fontSize: 14, valign: "middle" });
    }
    card(s, rx, 5.2, rw, 1.32);
    await iconCircle(s, "LuPackageOpen", rx + 0.3, 5.48, 0.75, C.accent1);
    text(s, [
      { text: "Needed from HELIOtextil", options: { bold: true, breakLine: true } },
      { text: "The 3D model of the pilot product (GLB), its UV map and its production specifications, plus one physical sample to validate the production file.", options: { color: C.text2 } },
    ], { x: rx + 1.3, y: 5.3, w: rw - 1.55, h: 1.12, fontSize: 14, valign: "middle" });
  }

  // 14 · WS4: production --------------------------------------------------
  {
    const s = addLight("Phase 1 scope", "WORKSTREAM 4", "From paid order to pickup, every step tracked",
      "Every status change is logged with who made it and when. Orders can be cancelled or refunded before completion, with the reason recorded.");
    const st = [
      ["Order received", "System", "Easypay confirms the payment. Mania4 and the partner are notified."],
      ["Pending production", "Mania4", "An operator checks the order and the artwork."],
      ["In production", "HELIOtextil", "Downloads the production files and makes the product."],
      ["Ready or shipped", "Mania4 / HELIOtextil", "The customer is notified, with the pickup code if collecting."],
      ["Completed", "Partner / Mania4", "Pickup validated by code, or delivery confirmed."],
    ];
    const step = 2.42, sw = 2.52;
    st.forEach(([h, who, d], i) => {
      const x = MX + i * step;
      const fill = i === 4 ? C.accent2 : i === 0 ? C.text1 : C.accent1;
      s.addShape(i === 0 ? pres.shapes.PENTAGON : pres.shapes.CHEVRON, { x, y: 1.78, w: i === 4 ? sw - 0.1 : sw, h: 0.85, fill: { color: fill }, line: { color: C.background1, width: 2 }, objectName: nm("stage") });
      text(s, h, { x: x + (i === 0 ? 0.2 : 0.55), y: 1.78, w: sw - 0.95, h: 0.85, fontSize: 14, bold: true, color: C.background1, valign: "middle" });
      text(s, who.toUpperCase(), { x: x + 0.12, y: 2.85, w: step - 0.2, h: 0.28, fontSize: 10, bold: true, color: i === 4 ? C.accent2 : C.accent1, charSpacing: 1 });
      text(s, d, { x: x + 0.12, y: 3.15, w: step - 0.3, h: 1.0, fontSize: 13, color: C.text2 });
    });
    const cards = [
      ["LuMonitor", C.text1, "Mania4 operations screen", ["Orders across stores, by store and status", "Design preview and values for each line", "Download the production files", "Status changes logged with who and when"]],
      ["LuScanQrCode", C.accent1, "Partner pickup screen", ["Works in a phone or tablet browser", "Scan the QR code or type the code", "Marks the order as completed", "No payment handling for the partner"]],
    ];
    const w = (CW - 0.25) / 2;
    for (const [i, [ic, col, h, items]] of cards.entries()) {
      const x = MX + i * (w + 0.25);
      card(s, x, 4.2, w, 2.35);
      await iconCircle(s, ic, x + 0.3, 4.45, 0.6, col);
      text(s, h, { x: x + 1.05, y: 4.45, w: w - 1.3, h: 0.6, fontSize: 17, bold: true, valign: "middle" });
      bullets(s, items, { x: x + 0.35, y: 5.25, w: w - 0.6, h: 1.2, fontSize: 14, paraSpaceAfter: 2 });
    }
  }

  // 15 · WS5 + WS6 ----------------------------------------------------------
  {
    const s = addLight("Phase 1 scope", "WORKSTREAMS 5 AND 6", "Payments, notifications and partner reports",
      "Easypay is HELIOtextil's existing payment partner and is already supported by the commerce platform. Invoices are issued by Mania4's certified invoicing software from an export.");
    const w = (CW - 0.3) / 2;
    await iconCircle(s, "LuCreditCard", MX, 1.75, 0.58, C.accent2);
    text(s, "5 · Payments and notifications", { x: MX + 0.75, y: 1.75, w: w - 0.8, h: 0.58, fontSize: 18, bold: true, valign: "middle" });
    ["Multibanco", "MB WAY", "Card"].forEach((m, i) => chip(s, m.toUpperCase(), MX + i * 1.55, 2.5, 1.4, C.background2, C.accent1, 0.36));
    bullets(s, ["Mania4's Easypay account configured and tested", "Paid, pending, failed and expired payments handled", "Refunds recorded, with their status", "Confirmation email with the design views", "New-order alerts to Mania4 and the partner", "“Ready for collection” email with the pickup code", "Order and invoice data export for invoicing"],
      { x: MX + 0.05, y: 3.1, w: w - 0.1, h: 3.3, fontSize: 14 });
    const x2 = MX + w + 0.3;
    await iconCircle(s, "LuChartBar", x2, 1.75, 0.58, C.accent1);
    text(s, "6 · Reporting and member imports", { x: x2 + 0.75, y: 1.75, w: w - 0.8, h: 0.58, fontSize: 18, bold: true, valign: "middle" });
    bullets(s, ["Member list import from CSV, with column mapping", "Member discount after checking the member number", "Sales by store and period", "Products and quantities sold", "Orders and pickups (redemptions)", "CSV export for monthly reconciliation", "Activity report: paid orders per month"],
      { x: x2 + 0.05, y: 2.5, w: w - 0.1, h: 2.6, fontSize: 14 });
    card(s, x2, 5.15, w, 1.2);
    await iconPlain(s, "LuHandshake", HEX.accent1, x2 + 0.3, 5.45, 0.55);
    text(s, [{ text: "Settlement stays simple. ", options: { bold: true } }, { text: "One monthly report per partner. No automatic payouts in Phase 1.", options: { color: C.text2 } }],
      { x: x2 + 1.05, y: 5.23, w: w - 1.3, h: 1.05, fontSize: 14, valign: "middle" });
  }

  // 16 · Deliverables and acceptance ---------------------------------------
  {
    const s = addLight("Phase 1 scope", "DELIVERABLES AND ACCEPTANCE", "What Mania4 receives, and how it is accepted",
      "Acceptance is tested in production against these seven criteria, using the pilot scenario.");
    const groups = [
      ["LuLayers", C.text1, "Platform", ["Production and staging environments", "HELIOPromo store, live in PT and EN", "Partner store, live in PT and EN", "Documented store template"]],
      ["LuRotate3D", C.accent1, "3D personalisation", ["Configurator on pilot products", "Zone Studio for administrators", "Saved designs: four views and file"]],
      ["LuFactory", C.accent2, "Operations", ["Production and pickup screens", "Easypay live in production", "Email notifications", "Imports and partner reports"]],
      ["LuBookOpen", C.text1, "Handover", ["Operations and technical guides", "Two training sessions", "First activation support", "30-day warranty after launch"]],
    ];
    const gw = 2.95, gh = 2.32;
    for (const [i, [ic, col, h, items]] of groups.entries()) {
      const x = MX + (i % 2) * (gw + 0.2), y = 1.72 + Math.floor(i / 2) * (gh + 0.2);
      card(s, x, y, gw, gh);
      await iconCircle(s, ic, x + 0.25, y + 0.25, 0.5, col);
      text(s, h, { x: x + 0.88, y: y + 0.25, w: gw - 1.0, h: 0.5, fontSize: 15, bold: true, valign: "middle" });
      bullets(s, items, { x: x + 0.28, y: y + 0.92, w: gw - 0.45, h: gh - 1.0, fontSize: 12, paraSpaceAfter: 3 });
    }
    const rx = MX + 2 * gw + 0.45, rw = W - MX - rx;
    card(s, rx, 1.72, rw, 4.84, C.text1);
    text(s, "Accepted in production when…", { x: rx + 0.35, y: 1.95, w: rw - 0.7, h: 0.4, fontSize: 16, bold: true, color: C.background1 });
    const crit = [
      "A customer personalises, pays and gets a confirmation with the preview",
      "An operator opens the design, downloads the files and moves the statuses",
      "A partner validates a pickup by QR code or typed code",
      "Members get the discount; non-members don't",
      "Partner sales and pickups export for any period",
      "A third store is set up from the template, without code",
      "Works in PT and EN, on desktop, tablet and mobile",
    ];
    crit.forEach((t, i) => {
      const y = 2.5 + i * 0.57;
      s.addShape(pres.shapes.OVAL, { x: rx + 0.35, y: y + 0.04, w: 0.36, h: 0.36, fill: { color: C.accent1 }, line: { type: "none" }, objectName: nm("num") });
      text(s, String(i + 1), { x: rx + 0.35, y: y + 0.04, w: 0.36, h: 0.36, fontSize: 12, bold: true, color: C.background1, align: "center", valign: "middle" });
      text(s, t, { x: rx + 0.88, y, w: rw - 1.15, h: 0.5, fontSize: 13, color: C.background1, valign: "middle" });
    });
  }

  // 17 · Divider: plan ------------------------------------------------------
  pres.addSection({ title: "Plan and investment" });
  addDivider("Plan and investment", "03", "Plan and investment", "Twelve weeks, four milestones, one fixed price.");

  // 18 · Timeline ---------------------------------------------------------
  {
    const s = addLight("Plan and investment", "DELIVERY PLAN", "Twelve weeks from kickoff to launch",
      "The 3D work starts once the commerce foundation is in place, which also gives HELIOtextil time to prepare the 3D model and production specifications.");
    const lx = MX, lw = 3.2, gx = 4.0, gw = W - MX - gx, cols = 13, cw = gw / cols;
    const head = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12", "+30 d"];
    head.forEach((h, i) => text(s, h, { x: gx + i * cw, y: 1.72, w: cw, h: 0.3, fontSize: 11, bold: true, color: i === 12 ? C.accent1 : C.accent5, align: "center" }));
    const rows = [
      ["Discovery and technical validation", 1, 2, C.text1],
      ["UX/UI adaptation", 2, 4, C.accent5],
      ["Commerce foundation and storefront", 3, 6, C.accent2],
      ["3D pilot and operational workflows", 5, 10, C.accent1],
      ["Quality, acceptance and launch", 10, 12, C.text1],
      ["Warranty and first activation", 13, 13, C.accent6],
    ];
    const ry = 2.1, rh = 0.56;
    rows.forEach(([label, a, b, col], i) => {
      const y = ry + i * rh;
      if (i % 2 === 0) s.addShape(pres.shapes.RECTANGLE, { x: lx, y, w: W - 2 * MX, h: rh, fill: { color: C.background2 }, line: { type: "none" }, objectName: nm("row") });
      text(s, label, { x: lx + 0.15, y, w: lw, h: rh, fontSize: 13, bold: true, valign: "middle" });
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: gx + (a - 1) * cw + 0.05, y: y + 0.13, w: (b - a + 1) * cw - 0.1, h: rh - 0.26, rectRadius: 0.15, fill: { color: col }, line: { type: "none" }, objectName: nm("bar") });
    });
    const ms = [[2, "M1 · Discovery"], [6, "M2 · Stores"], [10, "M3 · 3D + ops"], [12, "M4 · Launch"]];
    const my = ry + rows.length * rh + 0.12;
    ms.forEach(([wk, label]) => {
      const x = gx + wk * cw;
      s.addShape(pres.shapes.LINE, { x, y: ry, w: 0, h: my - ry, line: { color: HEX.accent1, width: 1, dashType: "dash" }, objectName: nm("ms-line") });
      s.addShape(pres.shapes.DIAMOND, { x: x - 0.15, y: my, w: 0.3, h: 0.3, fill: { color: C.accent1 }, line: { type: "none" }, objectName: nm("ms") });
      text(s, label, { x: x - 0.75, y: my + 0.34, w: 1.5, h: 0.28, fontSize: 11, bold: true, align: "center" });
    });
    text(s, "MILESTONES", { x: lx + 0.15, y: my, w: lw, h: 0.3, fontSize: 10, bold: true, color: C.accent5, charSpacing: 1, valign: "middle" });
    text(s, "The range is 10 to 14 weeks, depending mainly on when the 3D model, production specifications, Easypay credentials and content are available.",
      { x: lx, y: 6.35, w: CW, h: 0.4, fontSize: 12, color: C.accent5 });
  }

  // 19 · Investment ---------------------------------------------------------
  {
    const s = addDark("Plan and investment", "INVESTMENT", "€49,500 fixed, in two funding lines",
      "One platform, delivered as one project. For the internationalisation funding, it is presented as two budget lines. The split can be adjusted to fit the application. The platform licence is covered in the next section.");
    s.addChart(pres.charts.DOUGHNUT, [{ name: "Funding lines", labels: ["Line A", "Line B"], values: [20000, 29500] }], {
      x: MX, y: 1.75, w: 4.3, h: 4.3, holeSize: 62, chartColors: [HEX.accent2, HEX.accent1],
      showLegend: false, showTitle: false, showValue: false, showPercent: true, showLabel: false,
      dataLabelColor: "FFFFFF", dataLabelFontSize: 14, dataLabelFontBold: true, dataLabelFontFace: "+mn-lt",
      dataBorder: { pt: 2, color: HEX.dk1 }, altText: "Doughnut chart: line A €20,000 (40%), line B €29,500 (60%)", objectName: "funding-doughnut",
    });
    text(s, [{ text: "€49,500", options: { bold: true, fontSize: 26, color: C.background1, breakLine: true } }, { text: "excluding VAT", options: { fontSize: 12, color: C.accent6 } }],
      { x: MX + 1.15, y: 3.45, w: 2.0, h: 0.9, align: "center", valign: "middle" });
    const lines = [
      ["LINE A", C.accent2, "€20,000", "HELIOPromo commerce presence", "The HELIOPromo reference store with online sales in Portuguese and English: design, platform setup, storefront, checkout with Easypay, notifications."],
      ["LINE B", C.accent1, "€29,500", "Replicable sales platform for client projects", "Partner stores, 3D personalisation and production files, production and pickup workflow, partner reports, member imports, first activation."],
    ];
    const cx = 5.35, cw = W - MX - cx;
    lines.forEach(([tag, col, amt, h, d], i) => {
      const y = 1.75 + i * 2.2;
      card(s, cx, y, cw, 2.0, C.text2);
      chip(s, tag, cx + 0.35, y + 0.3, 0.9, col, C.background1);
      text(s, amt, { x: cx + 0.35, y: y + 0.72, w: 2.2, h: 0.6, fontSize: 30, bold: true, color: C.background1 });
      text(s, h, { x: cx + 2.7, y: y + 0.25, w: cw - 3.0, h: 0.62, fontSize: 16, bold: true, color: C.background1, valign: "middle" });
      text(s, d, { x: cx + 2.7, y: y + 0.95, w: cw - 3.0, h: 0.95, fontSize: 13, color: C.accent6 });
    });
    text(s, "€49,500 + VAT at 23% (€11,385) = €60,885.   The split is indicative and can follow the funding application. The platform licence is paid separately (next section).",
      { x: MX, y: 6.3, w: CW, h: 0.45, fontSize: 12, color: C.accent6 });
  }

  // 20 · Breakdown table ----------------------------------------------------
  {
    const s = addLight("Plan and investment", "INVESTMENT", "Where the investment goes",
      "The risk allowance is part of the fixed price. It protects the scope against what the technical validation in weeks 1 and 2 may uncover.");
    const eur = (n) => (n == null ? "—" : `€${n.toLocaleString("en-GB")}`);
    const data = [
      ["Discovery and technical validation", 1350, 900],
      ["UX/UI adaptation", 1800, 900],
      ["Platform setup and adaptation", 2250, 3150],
      ["Storefront and catalogue, in Portuguese and English", 5850, null],
      ["3D personalisation, design views and production export", null, 8100],
      ["Order and production management", null, 4500],
      ["Payments and notifications", 2250, null],
      ["Partner reporting and member imports", null, 1800],
      ["Quality, security, launch and first activation", 2250, 4050],
      ["Project management and technical leadership", 1800, 2700],
    ];
    const base = { fontSize: 13, color: HEX.dk1, valign: "middle", margin: [0.03, 0.12, 0.03, 0.12], border: [{ type: "none" }, { type: "none" }, { pt: 0.75, color: HEX.accent6 }, { type: "none" }] };
    const num = { ...base, align: "right" };
    const hdr = (t, right) => ({ text: t, options: { ...base, bold: true, color: "FFFFFF", fill: { color: HEX.dk1 }, align: right ? "right" : "left" } });
    const rows = [[hdr("Workstream"), hdr("Line A", true), hdr("Line B", true), hdr("Total", true)]];
    let ta = 0, tb = 0;
    data.forEach(([n, a, b]) => {
      ta += a || 0; tb += b || 0;
      rows.push([{ text: n, options: base }, { text: eur(a), options: num }, { text: eur(b), options: num }, { text: eur((a || 0) + (b || 0)), options: { ...num, bold: true } }]);
    });
    const sub = { ...base, bold: true, fill: { color: HEX.lt2 } };
    rows.push([{ text: "Implementation", options: sub }, { text: eur(ta), options: { ...sub, align: "right" } }, { text: eur(tb), options: { ...sub, align: "right" } }, { text: eur(ta + tb), options: { ...sub, align: "right" } }]);
    rows.push([{ text: "Delivery risk allowance (included in the fixed price)", options: base }, { text: eur(2450), options: num }, { text: eur(3400), options: num }, { text: eur(5850), options: { ...num, bold: true } }]);
    const tot = { ...base, bold: true, color: "FFFFFF", fill: { color: HEX.accent1 } };
    rows.push([{ text: "Total, excluding VAT", options: tot }, { text: eur(ta + 2450), options: { ...tot, align: "right" } }, { text: eur(tb + 3400), options: { ...tot, align: "right" } }, { text: eur(ta + tb + 5850), options: { ...tot, align: "right" } }]);
    if (ta + tb + 5850 !== 49500 || ta + 2450 !== 20000 || tb + 3400 !== 29500) throw new Error("Investment table does not add up");
    s.addTable(rows, { x: MX, y: 1.68, w: CW, colW: [6.43, 1.9, 1.9, 1.9], rowH: 0.335, objectName: "investment-table" });
    text(s, "Line A: HELIOPromo commerce presence.   Line B: replicable sales platform for client projects.", { x: MX, y: 6.5, w: CW, h: 0.3, fontSize: 11, color: C.accent5 });
  }

  // 21 · Payment milestones -------------------------------------------------
  {
    const s = addLight("Plan and investment", "PAYMENT AND TERMS", "Paid in four milestones",
      "Each milestone after the first is invoiced when it is accepted. Acceptance happens within 5 working days of delivery.");
    const ms = [
      ["M1", "20%", 9900, "On signature and kickoff"],
      ["M2", "30%", 14850, "Both stores on staging, with a test payment end to end"],
      ["M3", "30%", 14850, "A personalised order from configurator to pickup, on staging"],
      ["M4", "20%", 9900, "Acceptance criteria met in production"],
    ];
    const w = (CW - 0.6) / 4;
    ms.forEach(([m, p, amt, d], i) => {
      const x = MX + i * (w + 0.2);
      card(s, x, 1.72, w, 2.55);
      chip(s, m, x + 0.3, 1.97, 0.6, i === 3 ? C.accent2 : C.accent1, C.background1);
      text(s, p, { x: x + 1.05, y: 1.9, w: 1.4, h: 0.45, fontSize: 22, bold: true, color: C.accent1, valign: "middle" });
      text(s, `€${amt.toLocaleString("en-GB")}`, { x: x + 0.3, y: 2.5, w: w - 0.5, h: 0.5, fontSize: 26, bold: true });
      const withVat = Math.round(amt * 123) / 100;
      text(s, `€${withVat.toLocaleString("en-GB", { minimumFractionDigits: Number.isInteger(withVat) ? 0 : 2 })} with VAT`, { x: x + 0.3, y: 3.0, w: w - 0.5, h: 0.25, fontSize: 11, color: C.accent5 });
      text(s, d, { x: x + 0.3, y: 3.32, w: w - 0.5, h: 0.85, fontSize: 13, color: C.text2 });
    });
    const terms = [
      ["LuLock", "Fixed price for the Phase 1 scope"],
      ["LuFilePen", "Changes by written change request, approved before work"],
      ["LuReceipt", "€49,500 + 23% VAT (€11,385) = €60,885"],
      ["LuServer", "Hosting, services and Easypay fees paid directly by Mania4"],
      ["LuClock", "Each milestone reviewed within 5 working days"],
      ["LuCalendar", "Proposal valid for 30 days"],
    ];
    const tw = (CW - 0.3) / 2;
    for (const [i, [ic, t]] of terms.entries()) {
      const x = MX + (i % 2) * (tw + 0.3), y = 4.5 + Math.floor(i / 2) * 0.6;
      await iconCircle(s, ic, x, y, 0.46, C.text1);
      text(s, t, { x: x + 0.62, y, w: tw - 0.7, h: 0.46, fontSize: 14, valign: "middle" });
    }
    text(s, "Standard model: the €25,000 licence is invoiced with M4.   Partnership model: the success fee is invoiced once a year.",
      { x: MX, y: 6.38, w: CW, h: 0.3, fontSize: 12, color: C.accent5 });
  }

  // Divider: commercial model -------------------------------------------
  pres.addSection({ title: "Commercial model" });
  addDivider("Commercial model", "04", "Commercial model", "Pay once, or grow together and pay as Mania4 sells.");

  // Two ways to pay ------------------------------------------------------
  {
    const s = addLight("Commercial model", "COMMERCIAL MODEL", "Two ways to pay for the platform",
      "Phase 1 is priced well below a build from scratch because it reuses two existing foundations. Mania4 pays for the right to use them either through a small fee per order, or once. Scope, ownership and service are the same.");
    const w = (CW - 0.3) / 2;
    const opts = [
      { tag: "PARTNERSHIP   ·   RECOMMENDED", hot: true, upfront: "€49,500", plus: "+ €0.40 per paid order", items: ["The lowest upfront investment", "Pay as sales grow; if nothing sells, nothing is due", "Every improvement to the foundations included", "Capped at €36,000 a year, with a buy-out at any time"] },
      { tag: "STANDARD", hot: false, upfront: "€74,500", plus: "No fee per order", items: ["Phase 1 €49,500 + perpetual licence €25,000", "One fixed investment, which can suit a funded project", "Improvements through run and operate or new projects", "Same scope, ownership and service as Partnership"] },
    ];
    opts.forEach((o, i) => {
      const x = MX + i * (w + 0.3);
      card(s, x, 1.72, w, 4.05, o.hot ? C.accent1 : C.background2);
      const fg = o.hot ? C.background1 : C.text1;
      chip(s, o.tag, x + 0.4, 1.98, o.hot ? 3.3 : 1.2, o.hot ? C.background1 : C.text1, o.hot ? C.accent1 : C.background1);
      text(s, [{ text: o.upfront, options: { fontSize: 40, bold: true } }, { text: "   upfront", options: { fontSize: 16, color: o.hot ? C.background1 : C.accent5 } }],
        { x: x + 0.4, y: 2.42, w: w - 0.8, h: 0.75, color: fg, valign: "middle" });
      text(s, o.plus, { x: x + 0.4, y: 3.17, w: w - 0.8, h: 0.4, fontSize: 18, bold: true, color: o.hot ? C.background1 : C.accent1 });
      bullets(s, o.items, { x: x + 0.4, y: 3.8, w: w - 0.8, h: 1.85, fontSize: 14, color: fg });
    });
    card(s, MX, 6.0, CW, 0.62, C.background1, { line: { color: HEX.accent6, width: 1 } });
    await iconPlain(s, "LuShieldCheck", HEX.accent2, MX + 0.25, 6.13, 0.36);
    text(s, [{ text: "In both:   ", options: { bold: true } }, { text: "the same scope   ·   Mania4 owns its data and accounts   ·   no subscription   ·   no fee per store", options: { color: C.text2 } }],
      { x: MX + 0.8, y: 6.0, w: CW - 1.0, h: 0.62, fontSize: 14, valign: "middle" });
  }

  // How the success fee works ---------------------------------------------
  {
    const s = addLight("Commercial model", "PARTNERSHIP", "We earn when Mania4 sells",
      "The success fee is simple and transparent. Both sides see the same numbers in the platform at any time. Mania4 is protected by the cap, the absence of a minimum and the buy-out.");
    const tiles = [
      ["€0.40", "per paid order", "Any store or channel. Cancelled or refunded orders don't count."],
      ["1× a year", "invoiced in January", "From the platform's own report, which both sides can see. Quarterly if preferred."],
      ["€0", "minimum", "If nothing sells, nothing is due."],
      ["€36,000", "annual cap", "About 90,000 orders. Above that, orders are free for the rest of the year."],
      ["Buy-out", "at any time", "€25,000 minus the fees already paid, never less than twice the last 12 months."],
      ["3 years", "fixed rate", "Then updated each year by the Portuguese consumer price index."],
    ];
    const tw = (CW - 0.4) / 3;
    tiles.forEach(([big, label, d], i) => {
      const x = MX + (i % 3) * (tw + 0.2), y = 1.72 + Math.floor(i / 3) * 2.2;
      card(s, x, y, tw, 2.02);
      text(s, big, { x: x + 0.3, y: y + 0.22, w: tw - 0.6, h: 0.62, fontSize: 30, bold: true, color: C.accent1, valign: "middle" });
      text(s, label, { x: x + 0.3, y: y + 0.86, w: tw - 0.6, h: 0.3, fontSize: 14, bold: true });
      text(s, d, { x: x + 0.3, y: y + 1.2, w: tw - 0.6, h: 0.75, fontSize: 12, color: C.text2 });
    });
    await iconPlain(s, "LuHandshake", HEX.accent1, MX, 6.2, 0.4);
    text(s, "In return: a lower upfront price, every improvement to the platform and the 3D engine, and a partner paid on results.",
      { x: MX + 0.6, y: 6.17, w: CW - 0.6, h: 0.46, fontSize: 15, bold: true, color: C.accent1, valign: "middle" });
  }

  // Market comparison -----------------------------------------------------
  {
    const s = addLight("Commercial model", "COMPARED WITH THE MARKET", "Less than the market charges per order",
      "Example of a €40 order. Shopify charges a fee when the store uses a third-party payment provider such as Easypay: 2% on Basic, 1% on Grow, 0.6% on Advanced. 3D customiser apps such as Zakeke charge 1.5% to 1.9% per personalised sale, plus a monthly plan. Public pricing, November 2026.");
    s.addChart(pres.charts.BAR, [{ name: "Fees on a €40 order", labels: ["Shopify Basic + 3D customiser app", "Shopify Grow + 3D customiser app", "Shopify Advanced + 3D customiser app", "Mania4 Partnership"], values: [1.56, 1.16, 0.84, 0.4] }], {
      x: MX, y: 1.72, w: 7.5, h: 4.4, barDir: "bar", catAxisOrientation: "maxMin", barGapWidthPct: 55,
      chartColors: [HEX.accent5, HEX.accent5, HEX.accent5, HEX.accent1],
      showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: '"€"0.00', dataLabelColor: HEX.dk1, dataLabelFontSize: 14, dataLabelFontBold: true, dataLabelFontFace: "+mn-lt",
      catAxisLabelColor: HEX.dk1, catAxisLabelFontSize: 13, catAxisLabelFontFace: "+mn-lt", catAxisLineShow: false,
      valAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: 1.9, valGridLine: { style: "none" }, catGridLine: { style: "none" },
      showLegend: false, showTitle: false,
      altText: "Bar chart of platform and customiser fees on a €40 order: Shopify Basic plus customiser €1.56, Shopify Grow plus customiser €1.16, Shopify Advanced plus customiser €0.84, Mania4 Partnership €0.40",
      objectName: "market-fees-chart",
    });
    const rx = 8.45, rw = W - MX - rx;
    card(s, rx, 1.72, rw, 4.4);
    text(s, "Fees on a €40 order", { x: rx + 0.3, y: 1.95, w: rw - 0.6, h: 0.4, fontSize: 16, bold: true });
    text(s, "Platform and customiser fees only. Payment processing and monthly subscriptions come on top.", { x: rx + 0.3, y: 2.38, w: rw - 0.6, h: 0.7, fontSize: 13, color: C.text2 });
    bullets(s, [
      "Shopify: 2%, 1% or 0.6% by plan when the store uses a provider such as Easypay",
      "3D customiser apps: 1.5% to 1.9% of each personalised sale, plus a plan",
      { text: "Mania4: €0.40 per order, no subscription, own data and accounts", options: { bold: true, color: C.accent1 } },
    ], { x: rx + 0.3, y: 3.2, w: rw - 0.55, h: 2.35, fontSize: 13, paraSpaceAfter: 8 });
    text(s, "Public pricing of Shopify and Zakeke, November 2026. Rates vary by plan.", { x: rx + 0.3, y: 5.6, w: rw - 0.6, h: 0.4, fontSize: 10, color: C.accent5 });
  }

  // Break-even and upside ---------------------------------------------------
  {
    const s = addLight("Commercial model", "WHICH OPTION PAYS OFF", "Partnership costs less until real scale",
      "The Partnership costs less until the success fees add up to the €25,000 difference with Standard, which is 62,500 orders in total. If the platform reaches that, it is a substantial business.");
    const base = { fontSize: 14, color: HEX.dk1, valign: "middle", margin: [0.04, 0.15, 0.04, 0.15], border: [{ type: "none" }, { type: "none" }, { pt: 0.75, color: HEX.accent6 }, { type: "none" }] };
    const hdr = (t, right) => ({ text: t, options: { ...base, bold: true, color: "FFFFFF", fill: { color: HEX.dk1 }, align: right ? "right" : "left" } });
    const rows = [[hdr("Orders a year"), hdr("Success fee a year", true), hdr("Partnership costs more after", true)]];
    [["5,000", "€2,000", "12.5 years"], ["15,000", "€6,000", "about 4 years"], ["30,000", "€12,000", "about 2 years"], ["60,000", "€24,000", "about 1 year"]]
      .forEach(([o, f, y]) => rows.push([{ text: o, options: { ...base, bold: true } }, { text: f, options: { ...base, align: "right" } }, { text: y, options: { ...base, align: "right" } }]));
    s.addTable(rows, { x: MX, y: 1.72, w: 7.3, colW: [2.2, 2.4, 2.7], rowH: 0.5, objectName: "breakeven-table" });
    text(s, "At 60,000 orders a year the platform is a substantial business, and Mania4 can still buy out the fee at any time.",
      { x: MX, y: 4.38, w: 7.3, h: 0.65, fontSize: 14, color: C.text2 });
    await iconPlain(s, "LuInfo", HEX.accent5, MX, 5.42, 0.34);
    text(s, "A one-off investment can be easier to include in a funding application. Check with the funding consultant which option suits the project.",
      { x: MX + 0.5, y: 5.3, w: 6.8, h: 0.62, fontSize: 13, color: C.accent5, valign: "middle" });
    const rx = 8.25, rw = W - MX - rx;
    card(s, rx, 1.72, rw, 2.25, C.accent1);
    text(s, "62,500", { x: rx + 0.35, y: 1.95, w: rw - 0.7, h: 0.8, fontSize: 44, bold: true, color: C.background1, valign: "middle" });
    text(s, "orders in total before the Partnership costs more than Standard", { x: rx + 0.35, y: 2.8, w: rw - 0.7, h: 0.95, fontSize: 15, color: C.background1 });
    card(s, rx, 4.17, rw, 2.25);
    await iconCircle(s, "LuUsers", rx + 0.35, 4.42, 0.55, C.text1);
    text(s, "Referrals", { x: rx + 1.05, y: 4.42, w: rw - 1.3, h: 0.55, fontSize: 16, bold: true, valign: "middle" });
    text(s, "When Mania4 introduces a company that buys its own platform from us, Mania4 receives 15% of that project's first-year value.",
      { x: rx + 0.35, y: 5.1, w: rw - 0.7, h: 1.2, fontSize: 13, color: C.text2 });
  }

  // 22 · Divider: conditions ----------------------------------------------
  pres.addSection({ title: "Conditions" });
  addDivider("Conditions", "05", "Conditions", "Ownership, dependencies, exclusions, risks and ways of working.");

  // 23 · Ownership ----------------------------------------------------------
  {
    const s = addLight("Conditions", "OWNERSHIP AND LICENSING", "Full control, with no subscription",
      "Mania4 controls its data and infrastructure and pays no subscription. Phase 1 can cost €49,500 because it reuses foundations that existed before this project; their owner keeps them so they continue to improve.");
    const cols = [
      ["LuShieldCheck", C.accent1, "Mania4 owns", ["All its data: customers, orders, products, designs and reports", "Its environments and service accounts", "Its brands, content, product data and 3D assets", "The bespoke Mania4 work: template, configuration and Mania4 features"]],
      ["LuKey", C.accent2, "Mania4 is licensed", ["A perpetual licence to the commerce platform and the 3D engine", "For Mania4's own business and its partner stores", "No subscription and no fee per store", "Paid through the success fee, or once in the Standard model"]],
      ["LuBox", C.text1, "The supplier keeps", ["The foundations that existed before this project", "Generic improvements made to them, so they keep evolving", "Mania4 benefits from those improvements in later phases"]],
    ];
    const w = (CW - 0.4) / 3;
    for (const [i, [ic, col, h, items]] of cols.entries()) {
      const x = MX + i * (w + 0.2);
      card(s, x, 1.72, w, 3.95);
      await iconCircle(s, ic, x + 0.3, 1.97, 0.62, col);
      text(s, h, { x: x + 1.08, y: 1.97, w: w - 1.3, h: 0.62, fontSize: 18, bold: true, valign: "middle" });
      bullets(s, items, { x: x + 0.35, y: 2.85, w: w - 0.6, h: 2.7, fontSize: 14 });
    }
    await iconPlain(s, "LuInfo", HEX.accent5, MX, 5.95, 0.34);
    text(s, "Exact terms are set in the contract. Customer data is processed under a data processing agreement, with Mania4 as controller.",
      { x: MX + 0.5, y: 5.9, w: CW - 0.5, h: 0.45, fontSize: 13, color: C.accent5, valign: "middle" });
  }

  // 24 · Dependencies -------------------------------------------------------
  {
    const s = addLight("Conditions", "ASSUMPTIONS AND DEPENDENCIES", "What we need from HELIOtextil and Mania4",
      "The 3D model, UV map and production specifications are the dependency with the most impact on the plan. We'd like to agree the pilot product family in week 1.");
    const items = [
      ["A product owner who decides, weekly meeting, feedback in 3 working days", false],
      ["Pilot product family and partner, confirmed in discovery", false],
      ["3D model, UV map, production specifications and one physical sample", true],
      ["Product data and English translations: names, prices, VAT, photos", false],
      ["Brand assets and copy for HELIOPromo and the partner", false],
      ["Legal texts: terms of sale, privacy, returns and cookies", false],
      ["Easypay merchant account and API credentials, early on", true],
      ["Access to domains and DNS", false],
      ["A sample member list and the discount rules", false],
      ["The import format of the invoicing software", false],
    ];
    text(s, "HELIOtextil and Mania4 provide", { x: MX, y: 1.72, w: 7, h: 0.35, fontSize: 16, bold: true });
    for (const [i, [t, hot]] of items.entries()) {
      const y = 2.2 + i * 0.43;
      await iconPlain(s, hot ? "LuCircleAlert" : "LuCircleCheck", hot ? HEX.accent1 : HEX.accent2, MX, y + 0.04, 0.27);
      text(s, t, { x: MX + 0.42, y, w: 6.9, h: 0.36, fontSize: 14, bold: hot, valign: "middle" });
    }
    const rx = 8.25, rw = W - MX - rx;
    card(s, rx, 1.72, rw, 4.85);
    text(s, "Assumptions", { x: rx + 0.35, y: 1.95, w: rw - 0.7, h: 0.4, fontSize: 16, bold: true });
    bullets(s, ["Storefront in Portuguese and English", "One payment provider: Easypay", "One production template", "Up to 10 products and 2 stores", "Flat-rate shipping, set per store", "Existing technical sheet as the reference for the production file", "Stores run in tablet or MUPI browsers; no hardware is integrated"],
      { x: rx + 0.35, y: 2.5, w: rw - 0.65, h: 3.9, fontSize: 14 });
  }

  // 25 · Out of scope -------------------------------------------------------
  {
    const s = addLight("Conditions", "OUT OF SCOPE", "Kept out of Phase 1, on purpose",
      "Each of these can be added by change request, and most are already planned in Phase 2 or 3.");
    const items = [
      "New 3D models, UV maps, photography", "Photo-to-3D and virtual try-on", "More than one 3D product family", "Self-service store creation",
      "ERP, accounting and warehouse", "Invoicing API (export included)", "Automatic settlement and payouts", "Member APIs and SFTP (CSV included)",
      "Payment terminals and MUPI hardware", "Printer, press and IoT telemetry", "Native iOS and Android apps", "Carrier integrations (CTT, DPD)",
      "Languages beyond PT and EN", "Legal, tax or GDPR certification", "Running costs and transaction fees", "Support after the 30-day warranty",
    ];
    const w = (CW - 0.6) / 4, h = 0.86;
    for (const [i, t] of items.entries()) {
      const x = MX + (i % 4) * (w + 0.2), y = 1.72 + Math.floor(i / 4) * (h + 0.16);
      card(s, x, y, w, h);
      await iconPlain(s, "LuCircleMinus", HEX.accent5, x + 0.22, y + (h - 0.3) / 2, 0.3);
      text(s, t, { x: x + 0.65, y, w: w - 0.8, h, fontSize: 13, valign: "middle" });
    }
    await iconPlain(s, "LuArrowRight", HEX.accent1, MX, 5.97, 0.34);
    text(s, "Most of these are planned for Phase 2 or 3. Any of them can be added to Phase 1 by change request.", { x: MX + 0.5, y: 5.92, w: CW - 0.5, h: 0.45, fontSize: 14, bold: true, color: C.accent1, valign: "middle" });
  }

  // 26 · Risks --------------------------------------------------------------
  {
    const s = addLight("Conditions", "RISKS", "Risks we manage from day one",
      "Most risks come from dependencies outside the software. The plan addresses them in the first two weeks.");
    const risks = [
      ["3D model, UV map or specifications arrive late", "Product family chosen in week 1, asset checklist in discovery, 3D work planned after the commerce work."],
      ["The texture file is not ready for production as is", "Validated against one physical sample before M3. One production template only."],
      ["Easypay credentials take time", "Requested at kickoff. The Easypay test environment is used until then."],
      ["Requirements grow during the project", "The backlog is fixed after discovery. Anything new goes through a change request."],
      ["Technical review finds work in the foundations", "The review happens first, in weeks 1 and 2, and is covered by the risk allowance."],
      ["Invoicing needs more than an export", "Software and import format confirmed in discovery. An integration is quoted separately if needed."],
    ];
    text(s, "RISK", { x: MX + 0.75, y: 1.7, w: 4, h: 0.28, fontSize: 10, bold: true, color: C.accent5, charSpacing: 1 });
    text(s, "MITIGATION", { x: 5.85, y: 1.7, w: 4, h: 0.28, fontSize: 10, bold: true, color: C.accent5, charSpacing: 1 });
    for (const [i, [r, m]] of risks.entries()) {
      const y = 2.05 + i * 0.75;
      card(s, MX, y, CW, 0.66, i % 2 ? C.background1 : C.background2);
      await iconPlain(s, "LuTriangleAlert", HEX.accent4, MX + 0.22, y + 0.17, 0.32);
      text(s, r, { x: MX + 0.75, y, w: 4.4, h: 0.66, fontSize: 13, bold: true, valign: "middle" });
      text(s, m, { x: 5.85, y, w: W - MX - 5.85 - 0.25, h: 0.66, fontSize: 13, color: C.text2, valign: "middle" });
    }
  }

  // 27 · Governance and team -----------------------------------------------
  {
    const s = addLight("Conditions", "GOVERNANCE AND TEAM", "How we work together",
      "One decision-maker on each side keeps the project moving. Demos on staging every two weeks mean there are no surprises at acceptance.");
    const cadence = [
      ["LuFlag", "Kickoff and pilot definition workshop, in week 1"],
      ["LuCalendar", "A 30-minute status meeting every week"],
      ["LuMonitor", "A demo on staging every two weeks"],
      ["LuListChecks", "One shared backlog, visible to Mania4"],
      ["LuUsers", "One decision-maker on each side"],
      ["LuFilePen", "Written change requests, approved before work"],
      ["LuBadgeCheck", "Acceptance by milestone"],
    ];
    for (const [i, [ic, t]] of cadence.entries()) {
      const y = 1.75 + i * 0.66;
      await iconCircle(s, ic, MX, y, 0.48, i === 0 ? C.accent1 : C.text1);
      text(s, t, { x: MX + 0.68, y, w: 5.9, h: 0.48, fontSize: 14, valign: "middle" });
    }
    const rx = 7.55, rw = W - MX - rx;
    card(s, rx, 1.72, rw, 4.85, C.text1);
    text(s, "Delivery team", { x: rx + 0.35, y: 1.95, w: rw - 0.7, h: 0.4, fontSize: 16, bold: true, color: C.background1 });
    const team = [
      ["Technical lead and project manager", "Single contact, architecture, plan and quality"],
      ["Full-stack engineers", "Platform, storefront, checkout and operations"],
      ["3D and front-end engineer", "Configurator, Zone Studio and production export"],
      ["UX/UI designer", "Store template, configurator and operator screens"],
      ["QA", "Test plan, device testing and acceptance support"],
    ];
    team.forEach(([h, d], i) => {
      const y = 2.5 + i * 0.8;
      text(s, [{ text: h, options: { bold: true, color: C.background1, breakLine: true } }, { text: d, options: { color: C.accent6 } }], { x: rx + 0.35, y, w: rw - 0.7, h: 0.72, fontSize: 13 });
    });
  }

  // Divider: after launch -----------------------------------------------
  pres.addSection({ title: "After launch" });
  addDivider("After launch", "06", "After launch", "Rollout, run and operate, and the next phases.");

  // Rollout ---------------------------------------------------------------
  {
    const s = addLight("After launch", "ROLLOUT", "From two stores to a network",
      "Dates assume a signature in December 2026. In Wave 1 we measure stores live, orders per store, conversion, share of personalised orders, average order value, production lead time, pickup rate and settlement differences. These results set the Phase 2 priorities.");
    const waves = [
      ["WAVE 0", "Jan–Mar 2027", "Launch", "Phase 1: HELIOPromo and the pilot partner store go live, with the first activation.", C.text1],
      ["WAVE 1", "Apr–Jun 2027", "Prove", "3 to 5 more partner stores from the template, and a first event with QR codes. Phase 2 is built in parallel.", C.accent2],
      ["WAVE 2", "Jul–Dec 2027", "Scale", "Phase 2 live: store wizard, MUPI kiosk mode, more 3D products. Summer events. 10 to 20 stores.", C.accent1],
      ["WAVE 3", "2028", "Expand", "First stores outside Portugal, using the English store. Phase 3 integrations and automation.", C.accent4],
    ];
    const ww = (CW - 0.6) / 4;
    waves.forEach(([tag, when, h, d, col], i) => {
      const x = MX + i * (ww + 0.2);
      card(s, x, 1.72, ww, 2.85);
      chip(s, tag, x + 0.3, 1.98, 0.95, col, C.background1);
      text(s, when, { x: x + 1.38, y: 1.98, w: ww - 1.5, h: 0.3, fontSize: 12, bold: true, color: C.accent5, valign: "middle" });
      text(s, h, { x: x + 0.3, y: 2.5, w: ww - 0.6, h: 0.4, fontSize: 18, bold: true });
      text(s, d, { x: x + 0.3, y: 2.95, w: ww - 0.6, h: 1.5, fontSize: 13, color: C.text2 });
    });
    text(s, "A new partner store in five working days", { x: MX, y: 4.82, w: CW, h: 0.38, fontSize: 16, bold: true });
    const days = ["Agreement signed and catalogue chosen", "Brand assets in, store set up from the template", "Address, QR codes, member list and pickup point", "Test order, and partner staff trained in 30 minutes", "Store launched and announced"];
    const dw = (CW - 4 * 0.15) / 5;
    days.forEach((t, i) => {
      const x = MX + i * (dw + 0.15);
      card(s, x, 5.3, dw, 1.25, i === 4 ? C.accent1 : C.background2);
      text(s, `DAY ${i + 1}`, { x: x + 0.22, y: 5.42, w: dw - 0.4, h: 0.28, fontSize: 10, bold: true, color: i === 4 ? C.background1 : C.accent1, charSpacing: 1 });
      text(s, t, { x: x + 0.22, y: 5.72, w: dw - 0.4, h: 0.78, fontSize: 13, color: i === 4 ? C.background1 : C.text1 });
    });
  }

  // Run and operate plans -------------------------------------------------
  {
    const s = addLight("After launch", "RUN AND OPERATE", "Kept secure, up to date and growing",
      "After the 30-day warranty, the platform needs security updates, monitoring and support, and new stores and products need to be added. Growth is the recommended plan for the first year.");
    const plans = [
      { h: "Essential", price: "€690", hot: false, items: ["Infrastructure managed, in Mania4's accounts", "Monitoring and alerts, 24/7", "Security updates and upgrades", "Daily backups and bug fixes", "4 hours of changes a month", "Monthly service report"] },
      { h: "Growth", price: "€1,390", hot: true, items: ["Everything in Essential", "12 hours of changes a month", "1 new partner store a month", "Faster response times", "Quarterly roadmap review"] },
      { h: "Scale", price: "€2,690", hot: false, items: ["Everything in Growth", "30 hours of changes a month", "Up to 4 new stores a month", "Event-day on-call, up to 4 days", "1 new 3D product a quarter", "Monthly roadmap review"] },
    ];
    const pw = (CW - 0.4) / 3;
    plans.forEach((p, i) => {
      const x = MX + i * (pw + 0.2);
      const fg = p.hot ? C.background1 : C.text1;
      card(s, x, 1.72, pw, 4.55, p.hot ? C.accent1 : C.background2);
      text(s, p.h, { x: x + 0.35, y: 1.95, w: 1.8, h: 0.4, fontSize: 20, bold: true, color: fg });
      if (p.hot) chip(s, "RECOMMENDED", x + pw - 1.9, 2.0, 1.55, C.background1, C.accent1);
      text(s, [{ text: p.price, options: { fontSize: 34, bold: true } }, { text: "  a month", options: { fontSize: 14, color: p.hot ? C.background1 : C.accent5 } }],
        { x: x + 0.35, y: 2.45, w: pw - 0.7, h: 0.7, color: p.hot ? C.background1 : C.accent1, valign: "middle" });
      bullets(s, p.items, { x: x + 0.35, y: 3.4, w: pw - 0.65, h: 2.75, fontSize: 14, color: fg });
    });
    text(s, "Prices exclude VAT. 12-month plans, starting after the 30-day warranty. Move up at any time, down at renewal. Unused hours carry over one month.",
      { x: MX, y: 6.4, w: CW, h: 0.3, fontSize: 11, color: C.accent5 });
  }

  // Response times and services -------------------------------------------
  {
    const s = addLight("After launch", "SERVICE LEVELS AND SERVICES", "Response times and services on demand",
      "Business hours are 9:00 to 18:00 Lisbon time, Monday to Friday. Services on demand are available on any plan, or without one.");
    const base = { fontSize: 12, color: HEX.dk1, valign: "middle", margin: [0.04, 0.1, 0.04, 0.1], border: [{ type: "none" }, { type: "none" }, { pt: 0.75, color: HEX.accent6 }, { type: "none" }] };
    const hdr = (t) => ({ text: t, options: { ...base, bold: true, color: "FFFFFF", fill: { color: HEX.dk1 } } });
    const rows = [[hdr("Severity"), hdr("Essential"), hdr("Growth"), hdr("Scale")]];
    [
      ["Critical", "Checkout or a store is down", "4 business hours", "2 business hours", "1 hour, event days too"],
      ["High", "A feature fails, no workaround", "Next business day", "8 business hours", "4 business hours"],
      ["Normal", "A minor fault or a question", "3 business days", "2 business days", "1 business day"],
    ].forEach(([sev, ex, a, b, c]) => rows.push([
      { text: [{ text: sev, options: { bold: true, breakLine: true } }, { text: ex, options: { color: HEX.accent5 } }], options: base },
      { text: a, options: base }, { text: b, options: base }, { text: c, options: base },
    ]));
    s.addTable(rows, { x: MX, y: 1.72, w: 7.1, colW: [2.5, 1.5, 1.5, 1.6], rowH: [0.4, 0.75, 0.75, 0.75], objectName: "sla-table" });
    text(s, "Target availability for stores and checkout: 99.5% a month, excluding cloud provider outages.", { x: MX, y: 4.55, w: 7.1, h: 0.5, fontSize: 12, color: C.accent5 });
    card(s, MX, 5.2, 7.1, 1.3);
    await iconCircle(s, "LuCloud", MX + 0.3, 5.5, 0.65, C.text1);
    text(s, [{ text: "Cloud running costs  ", options: { bold: true, breakLine: true } }, { text: "Hosting, database, storage and email run in Mania4's accounts: typically €100 to €300 a month at pilot volumes, paid directly to the providers.", options: { color: C.text2 } }],
      { x: MX + 1.15, y: 5.3, w: 5.75, h: 1.1, fontSize: 13, valign: "middle" });
    const rx = 8.0, rw = W - MX - rx;
    card(s, rx, 1.72, rw, 4.78);
    text(s, "Services on demand", { x: rx + 0.3, y: 1.92, w: rw - 0.6, h: 0.4, fontSize: 16, bold: true });
    const svc = [["New partner store set-up", "€650"], ["New 3D product set-up", "€1,800"], ["Event support, remote", "€450 a day"], ["Event support, on site", "€600 a day + travel"], ["Training session, 2 hours", "€350"], ["Additional development", "€450 a day"]];
    svc.forEach(([l, p], i) => {
      const y = 2.5 + i * 0.6;
      text(s, l, { x: rx + 0.3, y, w: 2.4, h: 0.5, fontSize: 13, valign: "middle" });
      text(s, p, { x: rx + 2.6, y, w: rw - 2.9, h: 0.5, fontSize: 13, bold: true, color: C.accent1, align: "right", valign: "middle" });
      if (i < svc.length - 1) s.addShape(pres.shapes.LINE, { x: rx + 0.3, y: y + 0.55, w: rw - 0.6, h: 0, line: { color: HEX.accent6, width: 0.75 }, objectName: nm("rule") });
    });
    text(s, "Prices exclude VAT.", { x: rx + 0.3, y: 6.08, w: rw - 0.6, h: 0.3, fontSize: 11, color: C.accent5 });
  }

  // Next phases -----------------------------------------------------------
  {
    const s = addLight("After launch", "NEXT PHASES", "Prove it first, then scale it",
      "Phase 2 and 3 figures are planning ranges. They are confirmed after Phase 1, once real orders show what matters most. Phase 2 is planned so it is ready for the summer 2027 event season.");
    const phases = [
      { tag: "PHASE 1", h: "Commercial MVP", price: "€49,500   ·   10–14 weeks", lead: "January to March 2027", items: ["Two stores in PT and EN, one checkout", "One 3D product family", "Production and pickup workflow", "Partner reports and member imports"], hot: true },
      { tag: "PHASE 2", h: "Scale and self-service", price: "€15,000–25,000   ·   5–8 weeks", lead: "April to June 2027", items: ["Store creation wizard for partners", "Zone Studio for designers, more 3D families", "Richer pricing and member rules", "Tablet and MUPI kiosk mode, wider reports"] },
      { tag: "PHASE 3", h: "Integrate and automate", price: "Scoped separately", lead: "From late 2027", items: ["ERP, accounting and invoicing API", "SFTP, partner APIs, automatic settlement", "Easypay terminal on MUPI", "Press telemetry, AI agents, virtual try-on"] },
    ];
    const w = (CW - 0.4) / 3;
    phases.forEach((p, i) => {
      const x = MX + i * (w + 0.2);
      card(s, x, 1.72, w, 4.6, p.hot ? C.accent1 : C.background2);
      const fg = p.hot ? C.background1 : C.text1, sub = p.hot ? C.background1 : C.text2;
      chip(s, p.tag, x + 0.35, 1.97, 1.05, p.hot ? C.background1 : C.text1, p.hot ? C.accent1 : C.background1);
      text(s, p.h, { x: x + 0.35, y: 2.45, w: w - 0.7, h: 0.45, fontSize: 20, bold: true, color: fg });
      text(s, p.price, { x: x + 0.35, y: 2.92, w: w - 0.7, h: 0.35, fontSize: 14, bold: true, color: p.hot ? C.background1 : C.accent1 });
      text(s, p.lead, { x: x + 0.35, y: 3.4, w: w - 0.7, h: 0.4, fontSize: 14, italic: true, color: sub });
      bullets(s, p.items, { x: x + 0.35, y: 3.95, w: w - 0.6, h: 2.25, fontSize: 14, color: fg });
    });
    text(s, "Phase 2 and 3 figures are indicative planning ranges, confirmed after Phase 1.", { x: MX, y: 6.45, w: CW, h: 0.3, fontSize: 11, color: C.accent5 });
  }

  // 29 · Next steps ---------------------------------------------------------
  pres.addSection({ title: "Next steps" });
  {
    const s = pres.addSlide({ masterName: "M4_DIVIDER", sectionTitle: "Next steps" });
    s.addText("NEXT STEPS", { placeholder: "secnum" });
    s.addText("Let's start selling", { placeholder: "title" });
    s.addText("Real, personalised orders in about twelve weeks.", { placeholder: "subtitle" });
    const steps = [
      "Review the proposal with HELIOtextil and the funding consultant",
      "Choose the commercial model and the run and operate plan",
      "Confirm the split between the two funding lines",
      "Choose the pilot product family and the partner store",
      "Sign Phase 1 and schedule the kickoff workshop",
      "Request the Easypay credentials and collect the 3D model and specifications",
    ];
    steps.forEach((t, i) => {
      const y = 4.6 + i * 0.37;
      text(s, String(i + 1), { x: 0.9, y, w: 0.3, h: 0.34, fontSize: 14, bold: true, color: C.accent3, valign: "middle" });
      text(s, t, { x: 1.25, y, w: 7.2, h: 0.34, fontSize: 14, color: C.background1, valign: "middle" });
    });
    s.addNotes("Proposed next steps. The first two are on the HELIOtextil side; the kickoff workshop can be scheduled as soon as Phase 1 is signed.");
  }

  await pres.writeFile({ fileName: OUT });
  await applyThemeColors(OUT, THEME);
  console.log(`Wrote ${OUT}`);
}

// pptxgenjs writes Office's stock palette into the theme. Replace it with ours so the
// scheme colours used throughout the deck resolve to the brand palette.
async function applyThemeColors(file, theme) {
  const slots = ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const part = "ppt/theme/theme1.xml";
  const xml = await zip.file(part).async("string");
  const scheme = `<a:clrScheme name="${theme.name}">${slots.map((k) => `<a:${k}><a:srgbClr val="${theme.colors[k]}"/></a:${k}>`).join("")}</a:clrScheme>`;
  const out = xml.replace(/<a:clrScheme\b[\s\S]*?<\/a:clrScheme>/, scheme).replace(/(<a:(?:theme|fontScheme)\b[^>]*?\bname=")[^"]*"/g, (_, h) => `${h}${theme.name}"`);
  if (!out.includes(scheme)) throw new Error("Theme colour scheme not found");
  zip.file(part, out);
  // Rebuild without folder entries: some cloud services fail to open a deck that has them.
  const clean = new JSZip();
  for (const [name, entry] of Object.entries(zip.files)) {
    if (!entry.dir) clean.file(name, await entry.async("nodebuffer"), { createFolders: false });
  }
  fs.writeFileSync(file, await clean.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
