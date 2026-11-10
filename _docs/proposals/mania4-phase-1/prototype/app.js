// Mania4 commerce platform — Phase 1 prototype.
// Explore mode: every screen is clickable. Demo mode: a director drives the
// same screens with a cursor, captions and the "behind the scenes" checklist.

import * as Shirt from "./configurator.js";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const params = new URLSearchParams(location.search);
const SPEED = Number(params.get("speed")) || 1;
const RECORD = params.has("record");

/* ------------------------------------------------------------------ icons */

const svg = (d, extra = "") =>
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
const I = {
  check: `<svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  checkC: `<svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  lock: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  orders: svg('<path d="M6 3h12l1 18H5z"/><path d="M9 7a3 3 0 0 0 6 0"/>'),
  production: svg('<path d="M3 21V9l6 4V9l6 4V5h6v16z"/>'),
  stores: svg('<path d="M4 10v10h16V10"/><path d="M3 4h18l-1 6H4z"/><path d="M10 20v-5h4v5"/>'),
  products: svg('<path d="M8 3 3 6v4l3 1v10h12V11l3-1V6l-5-3a4 4 0 0 1-8 0z"/>'),
  members: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>'),
  reports: svg('<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>'),
  settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  pickup: svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>'),
  cart: svg('<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 7H6"/>'),
  download: svg('<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>'),
  scan: svg('<path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3M7 12h10"/>'),
  rotate: svg('<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  bell: svg('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>'),
  upload: svg('<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>'),
  truck: svg('<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/>'),
  store: svg('<path d="M4 10v10h16V10"/><path d="M3 4h18l-1 6H4z"/>'),
  card: svg('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>'),
  shield: svg('<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>'),
  back: svg('<path d="M15 5l-7 7 7 7"/>'),
  box: svg('<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>'),
  sig: `<svg viewBox="0 0 18 11"><rect x="0" y="7" width="3" height="4" rx="1" fill="currentColor"/><rect x="5" y="5" width="3" height="6" rx="1" fill="currentColor"/><rect x="10" y="2.5" width="3" height="8.5" rx="1" fill="currentColor"/><rect x="15" y="0" width="3" height="11" rx="1" fill="currentColor"/></svg>`,
  batt: `<svg viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3" fill="none" stroke="currentColor" opacity=".5"/><rect x="2" y="2" width="17" height="8" rx="1.6" fill="currentColor"/><rect x="23.5" y="4" width="1.8" height="4" rx=".8" fill="currentColor" opacity=".5"/></svg>`,
};

/* ------------------------------------------------------------ sample data */

const CLUB = {
  store: "Marés FC Official Store",
  short: "Marés FC",
  host: "maresfc",
  primary: "#12305A",
  accent: "#E8B04A",
  pickup: "Club shop, Estádio do Areal",
};
const CUSTOMER = { name: "Rui Silva", first: "Rui", member: "4821", email: "rui.silva@example.com", phone: "912 345 678" };
const ORDER = { id: "M4-10482", design: "D-7F3K2", code: "7KQ-2M9" };
const PRICE = { jersey: 54.9, nameNumber: 10, badge: 5, delivery: 4.9 };
const COLOURS = [
  { id: "navy", name: "Club navy", hex: "#12305A", text: "#E8B04A" },
  { id: "white", name: "Away white", hex: "#F4F4F2", text: "#12305A" },
  { id: "gold", name: "Gold", hex: "#E3A93C", text: "#12305A" },
  { id: "black", name: "Black", hex: "#141417", text: "#E8B04A" },
];
const CATALOGUE = [
  { id: "jersey", name: "Home jersey 2027", is3d: true },
  { id: "training", name: "Training top" },
  { id: "scarf", name: "Scarf" },
  { id: "cap", name: "Cap" },
  { id: "mug", name: "Mug" },
];
const DEFAULT_CAT = ["jersey", "training", "scarf", "cap"];

const ROLES = {
  all: "Overview",
  mania4: "Mania4 team",
  supporter: "Supporter",
  heliotextil: "HELIOtextil production",
  partner: "Partner club",
};

const money = (n) => "€" + n.toFixed(2);

/* ----------------------------------------------------------------- state */

const blankStore = () => ({
  name: "",
  logo: false,
  colours: false,
  catalogue: new Set(),
  host: "",
  pickup: "",
  members: false,
  published: false,
});
const blankDesign = () => ({
  color: "#12305A",
  textColor: "#E8B04A",
  name: "",
  number: "",
  crest: true,
  badge: false,
});

const state = {
  store: blankStore(),
  design: blankDesign(),
  colourId: "navy",
  tab: "colour",
  size: "L",
  views: null,
  saved: false,
  memberOk: false,
  delivery: "pickup",
  pay: "mbway",
  phone: "",
  paid: false,
  status: "received",
  modal: null,
};

function storeReady() {
  Object.assign(state.store, {
    name: CLUB.store,
    logo: true,
    colours: true,
    host: CLUB.host,
    pickup: CLUB.pickup,
    members: true,
    published: true,
  });
  state.store.catalogue = new Set(DEFAULT_CAT);
}
function designReady() {
  Object.assign(state.design, { color: "#12305A", textColor: "#E8B04A", name: "SILVA", number: "10", crest: true, badge: true });
  state.colourId = "navy";
  state.saved = true;
}
function subtotal() {
  return PRICE.jersey + (state.design.name || state.design.number ? PRICE.nameNumber : 0) + (state.design.badge ? PRICE.badge : 0);
}
function totals() {
  const sub = subtotal();
  const disc = state.memberOk ? Math.round(sub * 10) / 100 : 0;
  const del = state.delivery === "home" ? PRICE.delivery : 0;
  return { sub, disc, del, total: Math.round((sub - disc + del) * 100) / 100 };
}

/* ------------------------------------------------------------ 3D imagery */

let shirtReady = false;
const shotCache = new Map();

function shirtPlaceholder(color = "#12305A") {
  const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 110"><path d="M30 6 42 2q8 7 16 0l12 4 26 16-10 20-10-5v67H24V37l-10 5L4 22z" fill="${color}" stroke="rgba(0,0,0,.12)"/></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(s);
}
function shots(design) {
  const key = JSON.stringify(design);
  if (shotCache.has(key)) return shotCache.get(key);
  if (!shirtReady) {
    const p = shirtPlaceholder(design.color);
    return { front: p, back: p, left: p, right: p };
  }
  const out = Shirt.snapshots(design);
  Shirt.setDesign(state.design);
  shotCache.set(key, out);
  return out;
}
const views = () => shots({ ...state.design });
const plainJersey = () => shots({ ...blankDesign() }).front;
const trainingTop = () => shots({ ...blankDesign(), color: "#F4F4F2", textColor: "#12305A" }).front;

const ART = {
  scarf: `<svg viewBox="0 0 120 120"><defs><pattern id="st" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(0)"><rect width="16" height="8" fill="#12305A"/><rect y="8" width="16" height="8" fill="#E8B04A"/></pattern></defs><path d="M22 14h26v80H22z" fill="url(#st)" transform="rotate(-14 35 54)"/><path d="M58 20h26v80H58z" fill="url(#st)" transform="rotate(10 71 60)"/><g stroke="#12305A" stroke-width="2"><path d="M30 104v8M35 103v9M40 102v9M45 101v9" transform="rotate(-14 35 54)"/></g></svg>`,
  cap: `<svg viewBox="0 0 120 120"><path d="M22 74c0-26 16-44 38-44s38 18 38 44z" fill="#12305A"/><path d="M60 30v44" stroke="#0B1F3D" stroke-width="2"/><path d="M14 74h92c4 0 6 4 2 7-10 6-30 9-48 9s-38-3-48-9c-4-3-2-7 2-7z" fill="#0B1F3D"/><circle cx="60" cy="30" r="4" fill="#E8B04A"/><path d="M48 54l12-4 12 4v7c0 6-5 9-12 11-7-2-12-5-12-11z" fill="#E8B04A"/></svg>`,
  mug: `<svg viewBox="0 0 120 120"><path d="M28 30h52v58a10 10 0 0 1-10 10H38a10 10 0 0 1-10-10z" fill="#fff" stroke="#d5d4dd" stroke-width="2"/><path d="M80 44h8a12 12 0 0 1 0 24h-8" fill="none" stroke="#d5d4dd" stroke-width="6"/><rect x="28" y="50" width="52" height="18" fill="#12305A"/><path d="M48 52l6-2 6 2v4c0 3-3 5-6 6-3-1-6-3-6-6z" fill="#E8B04A"/></svg>`,
  lanyard: `<svg viewBox="0 0 120 120"><path d="M38 10c-6 30 4 60 18 80M82 10c6 30-4 60-18 80" stroke="#6A3DE8" stroke-width="9" fill="none" stroke-linecap="round"/><rect x="50" y="86" width="20" height="10" rx="3" fill="#9a99a6"/><rect x="44" y="96" width="32" height="18" rx="4" fill="#111114"/></svg>`,
  badge: `<svg viewBox="0 0 120 120"><path d="M60 12 96 24v34c0 26-16 40-36 50-20-10-36-24-36-50V24z" fill="#111114"/><path d="M60 22l28 9v27c0 20-12 32-28 40-16-8-28-20-28-40V31z" fill="#13806F"/><path d="M44 62h32M44 52h32M48 72h24" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>`,
};
function catThumb(id) {
  if (id === "jersey") return `<img src="${plainJersey()}" alt="">`;
  if (id === "training") return `<img src="${trainingTop()}" alt="">`;
  return ART[id] || "";
}

function qrSVG(text, px = 160, dark = "#111114", light = "#ffffff") {
  const q = window.qrcode(0, "M");
  q.addData(text);
  q.make();
  const n = q.getModuleCount();
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
  return `<svg class="qr" width="${px}" height="${px}" viewBox="-1 -1 ${n + 2} ${n + 2}" shape-rendering="crispEdges"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="${light}"/><path d="${d}" fill="${dark}"/></svg>`;
}
const storeUrl = () => `${location.origin}${location.pathname}#scan`;

function monogram(text, bg, fg) {
  const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="${fg}"/><circle cx="50" cy="50" r="40" fill="${bg}"/><text x="50" y="62" text-anchor="middle" font-family="Arial" font-weight="700" font-size="32" fill="${fg}">${text}</text></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(s);
}

/* ------------------------------------------------------------- shared UI */

const NAV = {
  mania4: [
    { id: "orders", label: "Orders", icon: "orders" },
    { id: "production", label: "Production", icon: "production" },
    { id: "stores", label: "Stores", icon: "stores" },
    { id: "products", label: "Products and 3D", icon: "products" },
    { id: "members", label: "Members", icon: "members" },
    { id: "reports", label: "Reports", icon: "reports" },
    { id: "settings", label: "Settings", icon: "settings" },
  ],
  heliotextil: [
    { id: "production", label: "Production", icon: "production" },
    { id: "orders", label: "Orders", icon: "orders" },
  ],
};
const WHO = {
  mania4: { name: "Marta Reis", role: "Mania4 operator", initials: "MR" },
  heliotextil: { name: "Paulo Matos", role: "HELIOtextil production", initials: "PM" },
};

function admin({ role = "mania4", active, crumbs, content, badge = {} }) {
  const who = WHO[role];
  const live = state.store.published ? 2 : 1;
  const org =
    role === "heliotextil"
      ? `<b>HELIOtextil</b>Production partner · sees approved orders only`
      : `<b>Mania4</b>Merchant of record · ${live} ${live === 1 ? "store" : "stores"} live`;
  return `<div class="admin" data-role="${role}">
    <aside class="admin-side">
      <img class="alogo" src="assets/mania4-logo-white.png" alt="MANIA4">
      ${NAV[role]
        .map(
          (n) =>
            `<div class="nav-item ${n.id === active ? "active" : ""}">${I[n.icon]}<span>${n.label}</span>${badge[n.id] ? `<span class="badge">${badge[n.id]}</span>` : ""}</div>`,
        )
        .join("")}
      <div class="org">${org}</div>
    </aside>
    <section class="admin-main">
      <div class="admin-top">
        <div class="crumbs">${crumbs}</div>
        <div class="who"><div style="text-align:right"><b>${who.name}</b><small>${who.role}</small></div><span class="avatar">${who.initials}</span></div>
      </div>
      <div class="admin-content" id="admin-content">${content}</div>
    </section>
  </div>`;
}

function toast(title, sub = "", icon = I.bell) {
  const host = $("#screen");
  if (!host) return;
  $$(".toast", host).forEach((t) => t.remove());
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `<span class="ti">${icon}</span><div><b>${title}</b>${sub ? `<small>${sub}</small>` : ""}</div>`;
  host.appendChild(t);
  setTimeout(() => t.remove(), 5200 / SPEED);
}

function views4(v, cls = "views4") {
  const labels = { front: "Front", back: "Back", left: "Left", right: "Right" };
  return `<div class="${cls}">${["front", "back", "left", "right"]
    .map((k) => `<figure><img src="${v[k]}" alt="${labels[k]} view"><figcaption>${labels[k]}</figcaption></figure>`)
    .join("")}</div>`;
}

function storeTop(cart = 0) {
  return `<div class="store-top">
    <img src="assets/club-crest.svg" alt="">
    <div class="sname">Marés FC<small>OFFICIAL STORE</small></div>
    <div class="tools"><span class="lang"><b>EN</b> | PT</span><span class="cart-ic">${I.cart}${cart ? `<em>${cart}</em>` : ""}</span></div>
  </div>`;
}

/* --------------------------------------------------------------- screens */

const SCREENS = {};
const ACTIONS = {};
const BINDS = {};

// ---- 0 overview
SCREENS.overview = {
  frame: "none",
  render() {
    const lanes = ["mania4", "supporter", "heliotextil", "partner"];
    const laneSub = {
      mania4: "Sells, operates, invoices",
      supporter: "Buys by QR code or link",
      heliotextil: "Produces from the file",
      partner: "Club, university, event",
    };
    return `<div class="overview" id="overview">
      <div class="ov-head">
        <div>
          <h2>From a QR code at the stadium to a personalised shirt in a supporter’s hands</h2>
          <p>The Phase 1 journey on one platform: one partner store, one 3D product family and one Mania4 checkout, from the first scan to the month-end report.</p>
        </div>
        <img class="ov-ring" src="assets/heliopromo-key-visual.jpg" alt="">
      </div>
      <div class="lanes" id="lanes">
        ${lanes.map((r) => `<div class="lane" data-role="${r}"><div class="lane-name"><div>${ROLES[r]}<small>${laneSub[r]}</small></div></div><div></div></div>`).join("")}
        <svg class="ov-svg" id="ov-svg"></svg>
      </div>
      <div class="ov-foot">
        <div><b>Mania4 sells</b>Merchant of record for every store, through one checkout and one Easypay account.</div>
        <div><b>Partners never handle money</b>They validate pickup codes, and the accounts are settled at month-end.</div>
        <div><b>HELIOtextil produces from the file</b>Production files come with each order. Nothing is re-keyed.</div>
      </div>
    </div>`;
  },
  mount(el) {
    const lanesEl = $("#lanes", el);
    const order = ["mania4", "supporter", "heliotextil", "partner"];
    const w = 1124 - 150;
    const h = lanesEl.clientHeight;
    const laneH = h / 4;
    const pts = CHAPTERS.slice(1).map((ch, i) => ({
      x: 150 + w * (0.06 + i * 0.098),
      y: laneH * order.indexOf(ch.role) + laneH / 2,
      ch,
      i: i + 1,
    }));
    let d = "";
    pts.forEach((p, i) => {
      const x = p.x - 150;
      if (i === 0) d += `M${x} ${p.y}`;
      else {
        const q = pts[i - 1];
        const qx = q.x - 150;
        const mx = (qx + x) / 2;
        d += ` C${mx} ${q.y} ${mx} ${p.y} ${x} ${p.y}`;
      }
    });
    $("#ov-svg", el).innerHTML = `<path class="ov-path" d="${d}"/>`;
    pts.forEach((p) => {
      const n = document.createElement("div");
      n.className = "ov-node";
      n.dataset.role = p.ch.role;
      n.dataset.action = "goto";
      n.dataset.chapter = p.i;
      n.style.left = p.x + "px";
      n.style.top = p.y + "px";
      n.innerHTML = `<div class="dot">${p.i}</div><span>${p.ch.short}</span>`;
      lanesEl.appendChild(n);
    });
  },
};
ACTIONS.goto = (el) => showChapter(Number(el.dataset.chapter));

// ---- 1 store set-up
const storeCard = (s) => `<div class="store-card">
  <div class="sc-top" style="background:${s.bg}">${s.logo ? `<img src="${s.logo}" alt="" style="${s.logoStyle || ""}">` : ""}${s.title ? `<div class="sc-name">${s.title}</div>` : ""}</div>
  <div class="sc-body">
    <div class="row"><b>${s.name}</b><span class="pill ${s.pillCls}">${s.pill}</span></div>
    <div class="row muted"><span>${s.host}</span><span>${s.meta || ""}</span></div>
  </div>
</div>`;
const HELIO_STORE = {
  bg: "#111114",
  logo: "assets/heliopromo-logo-white.png",
  logoStyle: "height:22px",
  name: "HELIOPromo",
  host: "shop.heliopromo.com",
  pill: "Live",
  pillCls: "live",
  meta: "Reference store",
};
const MARES_STORE = {
  bg: CLUB.primary,
  logo: "assets/club-crest.svg",
  title: "Marés FC",
  name: CLUB.store,
  host: "maresfc.mania4.com",
  pill: "Live",
  pillCls: "live",
  meta: "Partner store",
};

SCREENS.storeList = {
  frame: "browser",
  url: "admin.mania4.com/stores",
  render() {
    return admin({
      active: "stores",
      crumbs: `<b>Stores</b>`,
      content: `<div class="page-head"><div><h2>Stores</h2><p>Every store runs on the same platform and sells through the Mania4 checkout.</p></div>
        <button class="btn primary hint" data-action="newStore">+ New store from template</button></div>
        <div class="store-grid">${storeCard(HELIO_STORE)}
          <div class="store-card new" data-action="newStore"><div class="plus">+</div><b>New partner store</b><span>Club, university, festival or event.<br>From the Mania4 template.</span></div>
        </div>`,
    });
  },
};
ACTIONS.newStore = () => go("storeForm");

SCREENS.storeForm = {
  frame: "browser",
  needsShirt: true,
  url: "admin.mania4.com/stores/new",
  render() {
    const s = state.store;
    return admin({
      active: "stores",
      crumbs: `Stores <span>›</span> <b>New partner store</b>`,
      content: `<div class="page-head"><div><h2>New partner store</h2><p>From the Mania4 store template. Checkout, payments and invoicing stay with Mania4.</p></div></div>
      <div class="form-wrap">
        <div class="form-sections">
          <div class="card"><h4>1 · Brand</h4>
            <div class="form-grid">
              <div class="field"><label>Store name</label><input class="input" data-bind="storeName" value="${s.name}" placeholder="e.g. Club official store"></div>
              <div class="field"><label>Partner type</label><input class="input" value="Football club" readonly></div>
              <div class="field"><label>Logo</label>
                <div class="upload ${s.logo ? "done" : ""}" data-action="uploadLogo" id="logo-up">${
                  s.logo
                    ? `<img src="assets/club-crest.svg" alt=""><div><b>maresfc-crest.svg</b>Vector logo · checked</div>`
                    : `${I.upload}<div><b>Upload logo</b>SVG or PNG</div>`
                }</div></div>
              <div class="field"><label>Brand colours</label>
                <div class="swatches" data-action="colours" id="swatches">${
                  s.colours
                    ? `<div class="swatch" style="--c:${CLUB.primary}"><i></i>#12305A</div><div class="swatch" style="--c:${CLUB.accent}"><i></i>#E8B04A</div>`
                    : `<div class="swatch" style="--c:#fff"><i></i>Primary</div><div class="swatch" style="--c:#fff"><i></i>Accent</div>`
                }</div></div>
            </div>
          </div>
          <div class="card"><h4>2 · Catalogue <span class="muted tiny" style="font-weight:500">from the shared product base</span></h4>
            <div class="cat-grid">${CATALOGUE.map(
              (c) =>
                `<div class="cat-item ${s.catalogue.has(c.id) ? "on" : ""}" data-action="cat" data-id="${c.id}"><span class="box">${I.check}</span><div class="thumb">${catThumb(c.id)}</div>${c.name}${c.is3d ? `<span class="tag3d">3D personalisation</span>` : ""}</div>`,
            ).join("")}</div>
          </div>
          <div class="card"><h4>3 · Address and pickup</h4>
            <div class="form-grid">
              <div class="field"><label>Store address</label><div class="input-group"><input class="input" data-bind="storeHost" value="${s.host}" placeholder="name"><span class="addon">.mania4.com</span></div></div>
              <div class="field"><label>Pickup point</label><input class="input" data-bind="storePickup" value="${s.pickup}" placeholder="Where supporters collect"></div>
              <div class="check on"><span class="box">${I.check}</span>Collect at the pickup point · free</div>
              <div class="check on"><span class="box">${I.check}</span>Home delivery · ${money(PRICE.delivery)}</div>
            </div>
          </div>
          <div class="card"><h4>4 · Members</h4>
            <div id="members">${membersBlock()}</div>
          </div>
        </div>
        <div class="preview-card">
          <div class="side-label" style="margin:0">Store preview</div>
          <div id="mini">${miniStore()}</div>
          <button class="btn primary lg block" data-action="publish" id="publish">Publish store</button>
          <p class="tiny muted" style="margin:0;line-height:1.45">Uses the Mania4 checkout and Easypay account. The club gets operator access to the pickup screen only.</p>
        </div>
      </div>`,
    });
  },
};
function membersBlock() {
  return state.store.members
    ? `<div class="import-row fade-in"><span class="file">CSV</span><div><b>socios-2027.csv</b><span class="muted">2,340 members imported</span></div><div class="map">Column “Nº sócio” → member number<br>Member discount <b style="color:var(--ink)">10%</b></div></div>`
    : `<div class="import-row" data-action="importMembers" style="cursor:pointer"><span class="file" style="background:var(--lav);color:var(--muted)">CSV</span><div><b>Import member list</b><span class="muted">CSV file, with column mapping</span></div><div class="map">Member discount<br><b style="color:var(--ink)">10%</b></div></div>`;
}
function miniStore() {
  const s = state.store;
  const on = s.colours;
  return `<div class="mini-store">
    <div class="ms-head ${on ? "" : "empty-preview"}" style="background:${on ? CLUB.primary : ""}">${s.logo ? `<img src="assets/club-crest.svg" alt="">` : ""}<span>${s.name || "Store name"}</span></div>
    <div class="ms-hero ${on ? "" : "empty-preview"}" style="background:${on ? `linear-gradient(150deg,#1b4378,${CLUB.primary})` : ""}">
      <div><b>Home jersey 2027</b><div class="ms-cta" style="background:${on ? CLUB.accent : "#d4d2dc"}"></div></div>
      ${s.catalogue.has("jersey") ? `<img src="${plainJersey()}" alt="">` : "<span></span>"}
    </div>
    <div class="ms-grid">${CATALOGUE.slice(1, 4)
      .map((c) => (s.catalogue.has(c.id) ? `<i style="display:grid;place-items:center;overflow:hidden">${catThumb(c.id).replace("<svg", '<svg style="height:48px"').replace("<img", '<img style="height:50px"')}</i>` : "<i></i>"))
      .join("")}</div>
    <div class="tiny muted" style="padding:0 12px 12px">${s.host ? `${s.host}.mania4.com` : "address.mania4.com"}</div>
  </div>`;
}
const refreshMini = () => {
  const m = $("#mini");
  if (m) m.innerHTML = miniStore();
};
BINDS.storeName = (v) => {
  state.store.name = v;
  refreshMini();
};
BINDS.storeHost = (v) => {
  state.store.host = v.toLowerCase().replace(/[^a-z0-9-]/g, "");
  refreshMini();
};
BINDS.storePickup = (v) => (state.store.pickup = v);
ACTIONS.uploadLogo = () => {
  state.store.logo = true;
  $("#logo-up").outerHTML = `<div class="upload done fade-in" id="logo-up"><img src="assets/club-crest.svg" alt=""><div><b>maresfc-crest.svg</b>Vector logo · checked</div></div>`;
  refreshMini();
};
ACTIONS.colours = () => {
  state.store.colours = true;
  $("#swatches").innerHTML = `<div class="swatch fade-in" style="--c:${CLUB.primary}"><i></i>#12305A</div><div class="swatch fade-in" style="--c:${CLUB.accent}"><i></i>#E8B04A</div>`;
  refreshMini();
};
ACTIONS.cat = (el) => {
  const id = el.dataset.id;
  const c = state.store.catalogue;
  c.has(id) ? c.delete(id) : c.add(id);
  el.classList.toggle("on", c.has(id));
  refreshMini();
};
ACTIONS.importMembers = () => {
  state.store.members = true;
  $("#members").innerHTML = membersBlock();
};
ACTIONS.publish = () => {
  storeReady();
  go("storeLive");
};

SCREENS.storeLive = {
  frame: "browser",
  url: "admin.mania4.com/stores/maresfc",
  last: true,
  render() {
    return admin({
      active: "stores",
      crumbs: `Stores <span>›</span> <b>${CLUB.store}</b>`,
      content: `<div class="live-wrap fade-in">
        <div style="display:grid;gap:16px;align-content:start">
          <div class="live-banner"><img src="assets/club-crest.svg" alt=""><div><h3>${CLUB.store} is live</h3><p>maresfc.mania4.com · Portuguese and English · sold by Mania4</p></div><span class="pill live">Live</span></div>
          <div class="card"><h4>Ready to sell</h4>
            <ul class="checklist">
              <li><i>${I.checkC}</i>Store created from the Mania4 template<span class="r">no new build</span></li>
              <li><i>${I.checkC}</i>4 products from the shared base, 1 with 3D personalisation<span class="r">club prices</span></li>
              <li><i>${I.checkC}</i>Checkout: Mania4, with MB WAY, Multibanco and card<span class="r">Easypay</span></li>
              <li><i>${I.checkC}</i>Pickup point: ${CLUB.pickup}<span class="r">free</span></li>
              <li><i>${I.checkC}</i>2,340 members imported, 10% member discount<span class="r">CSV</span></li>
              <li><i>${I.checkC}</i>2 club shop operators invited to the pickup screen<span class="r">no access to money</span></li>
            </ul>
          </div>
        </div>
        <div class="card qr-card">
          <div class="side-label" style="margin:0">Store QR code</div>
          <div class="qr-frame">${qrSVG(storeUrl(), 190, CLUB.primary)}</div>
          <b>maresfc.mania4.com</b>
          <span class="tiny muted">For posters at the stadium, the club shop, tickets and social media.</span>
          <button class="btn sm" style="margin-top:4px">${I.download} QR poster (A3 PDF)</button>
        </div>
      </div>`,
    });
  },
};

// ---- 2 scan
function poster(inCamera = false) {
  return `<div class="poster ${inCamera ? "in-camera" : ""}">
    <img class="crest" src="assets/club-crest.svg" alt="">
    <h3>Your name.<br><em>Your number.</em></h3>
    <p>Personalise the new home jersey and collect it at the club shop.</p>
    <div class="qr-frame">${qrSVG(storeUrl(), inCamera ? 120 : 150, CLUB.primary)}</div>
    <span class="url-s">maresfc.mania4.com</span>
  </div>`;
}
SCREENS.camera = {
  frame: "phone",
  dark: true,
  url: "Camera",
  side: () => ({ left: `<div style="display:grid;gap:12px;justify-items:center"><div class="side-label">Poster at the stadium</div>${poster()}</div>` }),
  render() {
    return `<div class="camera"><div class="scene-bg">${poster(true)}</div>
      <div class="scan-frame" style="margin-top:2px"><i></i><i></i><i></i><i></i></div>
      <div id="scan-result"></div></div>`;
  },
  mount() {
    setTimeout(() => {
      const r = $("#scan-result");
      if (r)
        r.innerHTML = `<div class="scan-pill" data-action="openStore"><span class="ic"><img src="assets/club-crest.svg" alt=""></span><div><b>maresfc.mania4.com</b><small>Open in browser</small></div></div>`;
    }, 900 / SPEED);
  },
};
ACTIONS.openStore = () => go("storeHome");

const posterSide = () => ({ left: `<div style="display:grid;gap:12px;justify-items:center"><div class="side-label">Poster at the stadium</div>${poster()}</div>` });

SCREENS.storeHome = {
  frame: "phone",
  url: "maresfc.mania4.com",
  needsShirt: true,
  side: posterSide,
  render() {
    return `${storeTop()}
      <div class="hero" data-action="openProduct">
        <div class="kicker">New season 2027</div>
        <h3>Home jersey<br>2027</h3>
        <p>Your name. Your number. In 3D.</p>
        <img src="${plainJersey()}" alt="">
      </div>
      <div class="member-strip">${I.info} Members save 10% with their member number.</div>
      <div class="sec-title"><h4>Shop</h4><span>4 products</span></div>
      <div class="pgrid">
        <div class="pcard hint" data-action="openProduct" id="p-jersey"><span class="tag3d">3D</span><div class="pimg"><img src="${plainJersey()}" alt=""></div><b>Home jersey 2027</b><span class="price">${money(PRICE.jersey)}</span></div>
        <div class="pcard"><div class="pimg"><img src="${trainingTop()}" alt=""></div><b>Training top</b><span class="price">€34.90</span></div>
        <div class="pcard"><div class="pimg">${ART.scarf}</div><b>Scarf 2027</b><span class="price">€16.90</span></div>
        <div class="pcard"><div class="pimg">${ART.cap}</div><b>Cap</b><span class="price">€19.90</span></div>
      </div>`;
  },
};
ACTIONS.openProduct = () => go("product");

SCREENS.product = {
  frame: "phone",
  url: "maresfc.mania4.com/home-jersey-2027",
  needsShirt: true,
  last: true,
  side: posterSide,
  render() {
    const v = shots({ ...blankDesign() });
    return `${storeTop()}
      <div class="pdp-img"><img src="${v.front}" alt=""></div>
      <div class="pdp-thumbs">${["front", "back", "left", "right"].map((k, i) => `<img class="${i ? "" : "on"}" src="${v[k]}" alt="">`).join("")}</div>
      <div class="pdp">
        <h3>Home jersey 2027</h3>
        <div class="prices"><b>${money(PRICE.jersey)}</b><span>Members ${money(PRICE.jersey * 0.9)}</span></div>
        <div><div class="lbl" style="margin-bottom:6px">Size</div><div class="sizes">${["S", "M", "L", "XL", "XXL"].map((s) => `<span class="size ${s === state.size ? "on" : ""}" data-action="size" data-size="${s}">${s}</span>`).join("")}</div></div>
        <button class="btn club lg block hint" data-action="personalise" id="btn-personalise">Personalise in 3D</button>
        <button class="btn lg block">Buy as it is</button>
        <div class="small-print">${I.info}<span>Name, number and badge printed by HELIOtextil. Collect at the club shop or get it delivered.</span></div>
      </div>`;
  },
};
ACTIONS.size = (el) => {
  state.size = el.dataset.size;
  $$(".size").forEach((s) => s.classList.toggle("on", s === el));
};
ACTIONS.personalise = () => nextChapter("personalise");

// ---- 3 personalise
SCREENS.configurator = {
  frame: "phone",
  url: "maresfc.mania4.com/personalise",
  side: () => ({
    right: `<div class="side-card">
      <div class="side-label">What production receives</div>
      <h3>The artwork, as the supporter designs</h3>
      <p>The same design is painted on the shirt’s pattern. It is saved with the order, so HELIOtextil gets exactly what the supporter saw.</p>
      <div class="live-art"><canvas id="live-art" width="560" height="560"></canvas></div>
      <div class="zone-key" id="zone-key"></div>
    </div>`,
  }),
  render() {
    return `<div style="display:flex;flex-direction:column;height:100%">
      <div class="store-top" style="height:48px"><span style="display:flex;width:18px">${I.back}</span><div class="sname" style="font-size:15px">Personalise<small>HOME JERSEY 2027 · SIZE ${state.size}</small></div><div class="tools"><span class="cart-ic">${I.cart}</span></div></div>
      <div class="cfg-view" id="cfg-view">
        <div class="cfg-loading">Loading the 3D shirt…</div>
        <div class="rotate-hint">${I.rotate} Drag to rotate</div>
        <div class="view-btns">${["front", "back", "left", "right"].map((v, i) => `<button class="${i ? "" : "on"}" data-action="view" data-view="${v}">${v[0].toUpperCase() + v.slice(1)}</button>`).join("")}</div>
      </div>
      <div class="tabs">
        <button class="tab ${state.tab === "colour" ? "on" : ""}" data-action="tab" data-tab="colour">Colour</button>
        <button class="tab ${state.tab === "name" ? "on" : ""}" data-action="tab" data-tab="name">Name · number</button>
        <button class="tab ${state.tab === "badge" ? "on" : ""}" data-action="tab" data-tab="badge">Badge</button>
      </div>
      <div class="cfg-panel" id="cfg-panel" style="flex:1;overflow:auto">${cfgPanel()}</div>
      <div class="cfg-foot">
        <div class="cfg-total"><span id="cfg-lines">${cfgLines()}</span><b id="cfg-sum">${money(subtotal())}</b></div>
        <button class="btn club lg block" data-action="saveDesign" id="btn-save">Save design and add to cart</button>
      </div>
    </div>`;
  },
  mount(el) {
    if (shirtReady) {
      Shirt.setDesign(state.design);
      Shirt.mount($("#cfg-view", el));
      $(".cfg-loading", el)?.remove();
    }
    paintLiveArt();
  },
  unmount() {
    Shirt.unmount();
  },
  needsShirt: true,
};
function cfgLines() {
  const parts = ["Jersey " + money(PRICE.jersey)];
  if (state.design.name || state.design.number) parts.push("name and number " + money(PRICE.nameNumber));
  if (state.design.badge) parts.push("badge " + money(PRICE.badge));
  return parts.join(" · ");
}
function cfgPanel() {
  const d = state.design;
  if (state.tab === "colour")
    return `<div class="lbl">Shirt colour</div><div class="colors">${COLOURS.map(
      (c) => `<div class="color ${state.colourId === c.id ? "on" : ""}" data-action="colour" data-id="${c.id}" style="--c:${c.hex}"><i></i>${c.name}</div>`,
    ).join("")}</div><div class="tiny muted">Club crest on the chest is included and fixed by the club.</div>`;
  if (state.tab === "name")
    return `<div class="row2">
        <div class="field"><label>Name</label><input class="input" data-bind="dName" id="in-name" maxlength="12" value="${d.name}" placeholder="Your name" autocomplete="off"><span class="counter" id="name-count">${d.name.length}/12</span></div>
        <div class="field"><label>Number</label><input class="input" data-bind="dNumber" id="in-number" maxlength="2" inputmode="numeric" value="${d.number}" placeholder="0–99" autocomplete="off"></div>
      </div><div class="tiny muted">Club font, in gold on navy. Up to 12 letters.</div>`;
  return `<div class="badge-opts">
      <div class="badge-opt ${d.badge ? "" : "on"}" data-action="badge" data-on="0"><b>No badge</b><span class="muted">Plain sleeve</span></div>
      <div class="badge-opt ${d.badge ? "on" : ""}" data-action="badge" data-on="1" id="badge-upload"><b>Upload a logo</b><span class="muted">PNG or SVG · ${money(PRICE.badge)}</span></div>
    </div>${
      d.badge
        ? `<div class="file-check fade-in"><img src="assets/supporters-badge.svg" alt=""><div><b>norte-badge.png</b><ul><li>✓ PNG, 1200 × 1200 px</li><li>✓ Transparent background</li><li>✓ Fits the sleeve zone</li></ul></div></div>`
        : ""
    }`;
}
function refreshCfg() {
  const p = $("#cfg-panel");
  if (p) p.innerHTML = cfgPanel();
  updateCfgTotals();
}
function updateCfgTotals() {
  const l = $("#cfg-lines");
  if (l) l.textContent = cfgLines();
  const s = $("#cfg-sum");
  if (s) s.textContent = money(subtotal());
}
function designChanged() {
  state.views = null;
  state.saved = false;
  if (shirtReady) Shirt.setDesign(state.design);
  paintLiveArt();
  updateCfgTotals();
}
function paintLiveArt() {
  const c = $("#live-art");
  if (c && shirtReady) Shirt.paint(c, state.design);
  else if (c) {
    const ctx = c.getContext("2d");
    ctx.fillStyle = state.design.color;
    ctx.fillRect(0, 0, c.width, c.height);
  }
  const k = $("#zone-key");
  if (k) {
    const d = state.design;
    const z = [
      ["Club crest", d.crest],
      ["Name: " + (d.name || "—"), !!d.name],
      ["Number: " + (d.number || "—"), !!d.number],
      ["Sleeve badge", d.badge],
    ];
    k.innerHTML = z.map(([t, on]) => `<span class="${on ? "" : "off"}"><i></i>${t}</span>`).join("");
  }
}
ACTIONS.view = (el) => {
  $$(".view-btns button").forEach((b) => b.classList.toggle("on", b === el));
  Shirt.view(el.dataset.view);
};
function setViewBtn(v) {
  $$(".view-btns button").forEach((b) => b.classList.toggle("on", b.dataset.view === v));
}
ACTIONS.tab = (el) => {
  state.tab = el.dataset.tab;
  $$(".tab").forEach((t) => t.classList.toggle("on", t === el));
  refreshCfg();
  if (state.tab === "name") {
    setViewBtn("back");
    Shirt.view("back");
  }
  if (state.tab === "badge") {
    setViewBtn("right");
    Shirt.view("right");
  }
  if (state.tab === "colour") {
    setViewBtn("front");
    Shirt.view("front");
  }
};
ACTIONS.colour = (el) => {
  const c = COLOURS.find((x) => x.id === el.dataset.id);
  state.colourId = c.id;
  state.design.color = c.hex;
  state.design.textColor = c.text;
  $$(".color").forEach((x) => x.classList.toggle("on", x === el));
  designChanged();
};
BINDS.dName = (v, el) => {
  const clean = v.toUpperCase().replace(/[^A-ZÀ-Ü .'-]/g, "").slice(0, 12);
  if (clean !== v) el.value = clean;
  state.design.name = clean;
  const n = $("#name-count");
  if (n) n.textContent = `${clean.length}/12`;
  designChanged();
};
BINDS.dNumber = (v, el) => {
  const clean = v.replace(/\D/g, "").slice(0, 2);
  if (clean !== v) el.value = clean;
  state.design.number = clean;
  designChanged();
};
ACTIONS.badge = (el) => {
  state.design.badge = el.dataset.on === "1";
  refreshCfg();
  designChanged();
  if (state.design.badge) {
    setViewBtn("right");
    Shirt.view("right");
  }
};
ACTIONS.saveDesign = () => {
  if (!state.design.name) Object.assign(state.design, { name: "SILVA", number: state.design.number || "10" });
  state.saved = true;
  const v = views();
  const host = $("#phone-screen");
  const o = document.createElement("div");
  o.className = "saved-overlay";
  o.innerHTML = `<div class="big-check">${I.checkC}</div><h4>Design ${ORDER.design} saved</h4><p>Four views generated for the cart, the order and the email.</p>${views4(v)}<button class="btn club lg block hint" data-action="toCart" id="btn-tocart">Go to cart · ${money(subtotal())}</button>`;
  host.appendChild(o);
  markLast();
};
ACTIONS.toCart = () => nextChapter("checkout");

// ---- 4 checkout
const checkoutSide = () => ({
  left: `<div class="side-card" style="width:400px">
    <div class="side-label">One checkout for every store</div>
    <h3>Every store pays into Mania4</h3>
    <p style="margin-bottom:16px">Each store has its own name and address. Payment always runs through the same Mania4 checkout and Easypay account.</p>
    <div style="display:grid;grid-template-columns:1fr 40px 1fr;align-items:center;gap:8px">
      <div style="display:grid;gap:8px">
        <div class="chip" style="justify-content:flex-start;background:#111114;color:#fff;border-color:#111114"><img src="assets/heliopromo-logo-white.png" style="height:10px" alt="HELIOPromo"></div>
        <div class="chip" style="justify-content:flex-start;background:${CLUB.primary};color:#fff;border-color:${CLUB.primary}"><img src="assets/club-crest.svg" style="height:18px" alt="">Marés FC</div>
        <div class="chip" style="justify-content:flex-start;color:var(--muted)">Next stores…</div>
      </div>
      <svg viewBox="0 0 40 100" style="height:100px"><path d="M2 14 C22 14 18 50 38 50 M2 50 H38 M2 86 C22 86 18 50 38 50" fill="none" stroke="#c9c5da" stroke-width="2"/></svg>
      <div style="display:grid;gap:8px">
        <div class="card" style="padding:12px;text-align:center"><img src="assets/mania4-logo-white.png" style="height:12px;filter:brightness(0);margin:0 auto 6px" alt=""><span class="tiny muted">checkout</span></div>
        <div class="tiny muted" style="text-align:center">Easypay · MB WAY, Multibanco, card<br>Invoice by Mania4</div>
      </div>
    </div>
  </div>`,
});
SCREENS.cart = {
  frame: "phone",
  url: "maresfc.mania4.com/cart",
  needsShirt: true,
  side: checkoutSide,
  render() {
    const v = views();
    return `${storeTop(1)}<div class="co">
      <h3>Your cart</h3>
      <div class="co-sec">
        <div class="cart-line"><img src="${v.back}" alt=""><div><b>Home jersey 2027</b><small>Size ${state.size} · ${state.design.name} ${state.design.number} · ${COLOURS.find((c) => c.id === state.colourId).name}${state.design.badge ? " · Norte badge" : ""}</small><small>Design ${ORDER.design}</small></div><b>${money(subtotal())}</b></div>
        ${views4(v, "mini-views")}
      </div>
      <div class="sum"><div><span>Subtotal</span><span>${money(subtotal())}</span></div><div class="muted"><span>Member discount and delivery</span><span>at checkout</span></div></div>
      <button class="btn club lg block hint" data-action="toCheckout" id="btn-checkout">Checkout</button>
      <div class="small-print">${I.shield}<span>Secure checkout by Mania4. You can pay with MB WAY, Multibanco or card.</span></div>
    </div>`;
  },
};
ACTIONS.toCheckout = () => go("checkout");

SCREENS.checkout = {
  frame: "phone",
  url: "checkout.mania4.com",
  side: checkoutSide,
  render() {
    const t = totals();
    return `<div class="co-top"><img src="assets/mania4-logo-white.png" alt="MANIA4"><span class="co-title">Checkout</span><span class="co-store"><img src="assets/club-crest.svg" alt="">Marés FC</span></div>
    <div class="co">
      <div class="co-sec"><h5>Marés FC member? <small>10% off</small></h5>
        <div id="member">${memberBlock()}</div>
      </div>
      <div class="co-sec"><h5>Delivery</h5>
        <div class="radio ${state.delivery === "pickup" ? "on" : ""}" data-action="delivery" data-v="pickup"><span class="dot"></span><div>Collect at the club shop<small>${CLUB.pickup}</small></div><span class="r">Free</span></div>
        <div class="radio ${state.delivery === "home" ? "on" : ""}" data-action="delivery" data-v="home"><span class="dot"></span><div>Home delivery<small>3 to 5 working days after production</small></div><span class="r">${money(PRICE.delivery)}</span></div>
      </div>
      <div class="co-sec"><h5>Payment</h5>
        <div class="radio ${state.pay === "mbway" ? "on" : ""}" data-action="pay" data-v="mbway" id="pay-mbway"><span class="dot"></span><span class="pay-logo mbway">MB WAY</span>MB WAY</div>
        <input class="input" data-bind="phone" id="in-phone" placeholder="Mobile number for MB WAY" value="${state.phone}" inputmode="tel" autocomplete="off">
        <div class="radio ${state.pay === "mb" ? "on" : ""}" data-action="pay" data-v="mb"><span class="dot"></span><span class="pay-logo mb">MB</span>Multibanco reference</div>
        <div class="radio ${state.pay === "card" ? "on" : ""}" data-action="pay" data-v="card"><span class="dot"></span><span class="pay-logo card">CARD</span>Card</div>
      </div>
      <div class="sum" id="sum">${sumBlock(t)}</div>
      <button class="btn primary lg block hint" data-action="payNow" id="btn-pay">Pay ${money(t.total)}</button>
      <div class="small-print">${I.shield}<span>Sold and invoiced by Mania4. Payments processed by Easypay.</span></div>
    </div>`;
  },
};
function sumBlock(t) {
  return `<div><span>Home jersey 2027, personalised</span><span>${money(t.sub)}</span></div>
    ${t.disc ? `<div class="disc"><span>Member discount (10%)</span><span>−${money(t.disc)}</span></div>` : ""}
    <div><span>${state.delivery === "pickup" ? "Collect at the club shop" : "Home delivery"}</span><span>${t.del ? money(t.del) : "Free"}</span></div>
    <div class="total"><span>Total <small class="muted" style="font-weight:500">VAT included</small></span><span>${money(t.total)}</span></div>`;
}
function memberBlock() {
  return state.memberOk
    ? `<div class="member-ok fade-in">${I.checkC} Member ${CUSTOMER.member} · ${CUSTOMER.name} · 10% off applied</div>`
    : `<div class="or-type"><input class="input" data-bind="memberNo" id="in-member" placeholder="Member number" inputmode="numeric" autocomplete="off"><button class="btn" data-action="checkMember" id="btn-member">Check</button></div>`;
}
function refreshSum() {
  const t = totals();
  const s = $("#sum");
  if (s) s.innerHTML = sumBlock(t);
  const b = $("#btn-pay");
  if (b) b.textContent = `Pay ${money(t.total)}`;
}
BINDS.memberNo = () => {};
BINDS.phone = (v) => (state.phone = v);
ACTIONS.checkMember = () => {
  state.memberOk = true;
  $("#member").innerHTML = memberBlock();
  refreshSum();
};
ACTIONS.delivery = (el) => {
  state.delivery = el.dataset.v;
  $$('[data-action="delivery"]').forEach((r) => r.classList.toggle("on", r === el));
  refreshSum();
};
ACTIONS.pay = (el) => {
  state.pay = el.dataset.v;
  $$('[data-action="pay"]').forEach((r) => r.classList.toggle("on", r === el));
};
ACTIONS.payNow = () => {
  const host = $("#screen");
  const t = totals();
  const w = document.createElement("div");
  w.className = "mbway-wait";
  w.innerHTML = `<div class="spinner"></div><h4>Confirm in the MB WAY app</h4><p>We sent a payment request of <b>${money(t.total)}</b> to ${state.phone || CUSTOMER.phone}.<br>It expires in 4:59.</p><span class="pay-logo mbway" style="height:26px">MB WAY</span>`;
  host.appendChild(w);
  host.scrollTop = 0;
  setTimeout(() => {
    const ps = $("#phone-screen");
    if (!ps || !$(".mbway-wait")) return;
    const n = document.createElement("div");
    n.className = "notif";
    n.dataset.action = "confirmPay";
    n.id = "notif";
    n.innerHTML = `<span class="app" style="background:#d60510">MB WAY</span><div><b>Payment request · ${money(t.total)}</b><small>MANIA4 · Marés FC Official Store. Tap to confirm.</small></div>`;
    ps.appendChild(n);
    markLast();
  }, 1300 / SPEED);
};
ACTIONS.confirmPay = () => {
  state.paid = true;
  state.status = "received";
  $("#notif")?.remove();
  nextChapter("confirmed");
};

// ---- 5 confirmation
SCREENS.confirmed = {
  frame: "phone",
  url: "maresfc.mania4.com/order/M4-10482",
  needsShirt: true,
  last: true,
  side: () => ({
    right: `<div class="email fade-in">
      <div class="email-meta"><b>Your Marés FC order ${ORDER.id}</b><span>From: Marés FC Official Store &lt;orders@mania4.com&gt;</span><span>To: ${CUSTOMER.email}</span></div>
      <div class="email-body">
        <div class="email-banner"><img src="assets/club-crest.svg" alt=""><div><b>Thank you, ${CUSTOMER.first}</b><small>Order ${ORDER.id} · paid with MB WAY</small></div></div>
        <div class="email-inner">
          <p>Your personalised home jersey is going into production. We’ll email you again when it’s ready to collect at the club shop.</p>
          ${views4(views(), "mini-views")}
          <p><b>Pickup code ${ORDER.code}</b> · show it at the ${CLUB.pickup}.</p>
        </div>
        <div class="email-foot">Sold and invoiced by Mania4. Your invoice is attached.</div>
      </div>
    </div>`,
  }),
  render() {
    const v = views();
    return `${storeTop()}<div class="conf">
      <div class="conf-hero"><div class="big-check">${I.checkC}</div><h3>Thank you, ${CUSTOMER.first}!</h3><p>Order ${ORDER.id} · ${money(totals().total)} paid with MB WAY</p></div>
      <div class="steps"><div class="on"><i></i>Paid</div><div><i></i>Artwork check</div><div><i></i>In production</div><div><i></i>Ready</div><div><i></i>Collected</div></div>
      <div class="pickup-card"><div><small>Your pickup code</small><b>${ORDER.code}</b><p>Show it at the club shop when we tell you your jersey is ready.</p></div><div class="qr-frame">${qrSVG(`M4-PICKUP:${ORDER.id}:${ORDER.code}`, 100)}</div></div>
      ${views4(v, "mini-views")}
      <div class="small-print">${I.bell}<span>Confirmation sent to ${CUSTOMER.email}, with the design views and the invoice.</span></div>
    </div>`;
  },
};

// ---- 6 orders
const OTHER_ORDERS = [
  { id: "M4-10481", name: "Ana Costa", store: "HELIOPromo", c: "#111114", item: "Woven badges × 200", ful: "Delivery", total: 340, st: "pending", art: "badge" },
  { id: "M4-10479", name: "Tiago Mendes", store: "Marés FC", c: CLUB.primary, item: "Scarf 2027", ful: "Pickup · club shop", total: 16.9, st: "production", art: "scarf" },
  { id: "M4-10476", name: "Inês Ferreira", store: "Marés FC", c: CLUB.primary, item: "Home jersey 2027 · personalised", ful: "Delivery", total: 69.8, st: "production", art: "jersey" },
  { id: "M4-10473", name: "Clube de Leitura", store: "HELIOPromo", c: "#111114", item: "Lanyards × 120", ful: "Delivery", total: 264, st: "ready", art: "lanyard" },
  { id: "M4-10468", name: "Sofia Almeida", store: "Marés FC", c: CLUB.primary, item: "Home jersey 2027", ful: "Pickup · club shop", total: 49.41, st: "done", art: "jersey" },
];
const ST = {
  received: ["received", "Order received"],
  pending: ["pending", "Pending production"],
  production: ["production", "In production"],
  ready: ["ready", "Ready for collection"],
  done: ["done", "Completed"],
};
const pill = (st) => `<span class="pill ${ST[st][0]}">${ST[st][1]}</span>`;
const thumbFor = (o) => (o.art === "jersey" ? `<img class="thumb-mini" src="${plainJersey()}" alt="">` : `<span class="thumb-mini" style="display:grid;place-items:center">${ART[o.art].replace("<svg", '<svg style="width:30px;height:30px"')}</span>`);

SCREENS.orders = {
  frame: "browser",
  url: "admin.mania4.com/orders",
  needsShirt: true,
  render() {
    const v = views();
    return admin({
      active: "orders",
      badge: { orders: 1 },
      crumbs: `<b>Orders</b>`,
      content: `<div class="page-head"><div><h2>Orders</h2><p>All stores, newest first.</p></div><button class="btn sm">${I.download} Export for invoicing</button></div>
      <div class="filters">
        <span class="chip on">All stores</span><span class="chip">HELIOPromo</span><span class="chip">Marés FC</span>
        <span class="sep"></span>
        <span class="chip">Order received <em>3</em></span><span class="chip">Pending production <em>5</em></span><span class="chip">In production <em>8</em></span><span class="chip">Ready <em>4</em></span>
      </div>
      <table class="table">
        <thead><tr><th>Order</th><th>Customer</th><th>Store</th><th>Items</th><th>Fulfilment</th><th class="num">Total</th><th>Status</th></tr></thead>
        <tbody>
          <tr class="new click hint" data-action="openOrder" id="row-new"><td class="oid">${ORDER.id}</td><td>${CUSTOMER.name}<div class="tiny muted">Member ${CUSTOMER.member}</div></td><td><span class="store-dot" style="--c:${CLUB.primary}">Marés FC</span></td><td><div class="prod-cell"><img class="thumb-mini" src="${v.back}" alt="">Home jersey 2027 · personalised</div></td><td>Pickup · club shop</td><td class="num">${money(totals().total)}</td><td>${pill(state.status)}</td></tr>
          ${OTHER_ORDERS.map((o) => `<tr><td class="oid">${o.id}</td><td>${o.name}</td><td><span class="store-dot" style="--c:${o.c}">${o.store}</span></td><td><div class="prod-cell">${thumbFor(o)}${o.item}</div></td><td>${o.ful}</td><td class="num">${money(o.total)}</td><td>${pill(o.st)}</td></tr>`).join("")}
        </tbody>
      </table>`,
    });
  },
  mount() {
    setTimeout(() => {
      if (current === "orders") toast(`New paid order · ${ORDER.id}`, `Marés FC · ${money(totals().total)} · MB WAY via Easypay`);
    }, 500 / SPEED);
  },
};
ACTIONS.openOrder = () => go("orderDetail");

function orderLog() {
  const items = [
    { c: "var(--cyan)", t: "Paid with MB WAY", s: "Easypay confirmation · Sat 21:14" },
    { c: "var(--cyan)", t: "Mania4 and Marés FC notified", s: "Email · Sat 21:14" },
  ];
  if (["pending", "production", "ready", "done"].includes(state.status))
    items.push({ c: "var(--warn)", t: "Artwork approved by Marta Reis", s: "Pending production · Mon 09:12" });
  return items.reverse();
}
SCREENS.orderDetail = {
  frame: "browser",
  url: "admin.mania4.com/orders/M4-10482",
  needsShirt: true,
  render() {
    const v = views();
    const d = state.design;
    const t = totals();
    const approved = state.status !== "received";
    return admin({
      active: "orders",
      crumbs: `Orders <span>›</span> <b>${ORDER.id}</b>`,
      content: `<div class="page-head"><div><h2 style="display:flex;align-items:center;gap:12px">Order ${ORDER.id} <span id="st-pill">${pill(state.status)}</span></h2><p>Marés FC Official Store · paid Saturday 21:14</p></div></div>
      <div class="detail">
        <div style="display:grid;gap:14px">
          <div class="card"><h4>Home jersey 2027 · size ${state.size} · ×1 <span class="muted" style="font-weight:500">· design ${ORDER.design}</span></h4>
            ${views4(v)}
          </div>
          <div class="card"><h4>Personalisation</h4>
            <dl class="kv">
              <dt>Colour</dt><dd><span class="sw" style="--c:${d.color}"></span>${COLOURS.find((c) => c.id === state.colourId).name} · ${d.color}</dd>
              <dt>Name</dt><dd>${d.name} <span class="muted" style="font-weight:500">· club font, gold</span></dd>
              <dt>Number</dt><dd>${d.number}</dd>
              <dt>Chest</dt><dd>Marés FC crest (club artwork)</dd>
              <dt>Sleeve badge</dt><dd>${d.badge ? `norte-badge.png · 1200 × 1200 <span class="ok">✓ checked</span>` : "None"}</dd>
            </dl>
            <div class="actions-row" id="approve-row">${
              approved
                ? `<span class="pill pending" style="font-size:13px;padding:7px 12px">Approved · in the HELIOtextil production queue</span>`
                : `<button class="btn violet hint" data-action="approve" id="btn-approve">${I.checkC} Approve artwork</button><button class="btn">Ask the customer for a change</button>`
            }</div>
          </div>
        </div>
        <div style="display:grid;gap:14px">
          <div class="card"><h4>Customer</h4><dl class="kv" style="grid-template-columns:90px 1fr"><dt>Name</dt><dd>${CUSTOMER.name}</dd><dt>Member</dt><dd>${CUSTOMER.member} <span class="ok">✓</span></dd><dt>Email</dt><dd style="font-weight:500">${CUSTOMER.email}</dd></dl></div>
          <div class="card"><h4>Fulfilment</h4><dl class="kv" style="grid-template-columns:90px 1fr"><dt>Method</dt><dd>Collect at the club shop</dd><dt>Code</dt><dd>${ORDER.code}</dd></dl></div>
          <div class="card"><h4>Payment</h4><dl class="kv" style="grid-template-columns:90px 1fr"><dt>Total</dt><dd>${money(t.total)}</dd><dt>Method</dt><dd>MB WAY · Easypay</dd><dt>Status</dt><dd><span class="ok">Paid</span></dd></dl></div>
          <div class="card"><h4>Activity</h4><ul class="log" id="log">${orderLog().map((l) => `<li style="--c:${l.c}"><div>${l.t}<small>${l.s}</small></div></li>`).join("")}</ul></div>
        </div>
      </div>`,
    });
  },
};
ACTIONS.approve = () => {
  state.status = "pending";
  go("orderDetail", { keepScroll: true });
  toast("Artwork approved", "Order M4-10482 sent to the HELIOtextil production queue", I.checkC);
  markLast();
};

// ---- 7 production
const JOBS = {
  pending: [
    { id: "M4-10481", t: "Woven badges × 200", s: "HELIOPromo", due: "Due Thu", art: "badge" },
    { id: "M4-10477", t: "Home jersey 2027 · DIAS 7", s: "Marés FC", due: "Due Wed", art: "jersey" },
  ],
  production: [
    { id: "M4-10479", t: "Scarf 2027", s: "Marés FC", due: "Due Tue", art: "scarf" },
    { id: "M4-10476", t: "Home jersey 2027 · FERREIRA 21", s: "Marés FC", due: "Due Tue", art: "jersey" },
  ],
  ready: [{ id: "M4-10473", t: "Lanyards × 120", s: "HELIOPromo", due: "Shipped", art: "lanyard" }],
};
function jobCard(j) {
  const img = j.art === "jersey" ? `<img src="${plainJersey()}" alt="">` : `<span class="ph" style="display:grid;place-items:center">${ART[j.art].replace("<svg", '<svg style="width:34px;height:34px"')}</span>`;
  return `<div class="job"><div class="job-top">${img}<div><b>${j.id}</b><small>${j.t}</small></div></div><div class="job-meta"><span>${j.s}</span><span>${j.due}</span></div></div>`;
}
function featuredJob() {
  const v = views();
  const st = state.status;
  const btns =
    st === "pending"
      ? `<div style="display:flex;gap:8px"><button class="btn sm" data-action="prodFiles" id="btn-files">${I.download} Production files</button><button class="btn sm teal" data-action="startProd" id="btn-start">Start production</button></div>`
      : st === "production"
        ? `<div style="display:flex;gap:8px"><button class="btn sm" data-action="prodFiles">${I.download} Files</button><button class="btn sm teal hint" data-action="markReady" id="btn-ready">Mark ready for collection</button></div>`
        : `<span class="tiny" style="color:var(--teal);font-weight:600">${I.bell.replace("<svg", '<svg style="width:13px;height:13px;vertical-align:-2px"')} Customer notified with the pickup code</span>`;
  return `<div class="job featured moving" id="job-new"><div class="job-top"><img src="${v.back}" alt=""><div><b>${ORDER.id}</b><small>Home jersey 2027 · ${state.design.name} ${state.design.number} · ${state.size}</small></div></div><div class="job-meta"><span>Marés FC · pickup</span><span>Due Fri</span></div>${btns}</div>`;
}
SCREENS.board = {
  frame: "browser",
  url: "admin.mania4.com/production",
  needsShirt: true,
  render() {
    const col = (key, title) => {
      const mine = state.status === key ? featuredJob() : "";
      const n = JOBS[key].length + (mine ? 1 : 0);
      return `<div class="col"><div class="col-head">${title}<em>${n}</em></div>${mine}${JOBS[key].map(jobCard).join("")}</div>`;
    };
    return admin({
      role: "heliotextil",
      active: "production",
      crumbs: `<b>Production queue</b> <span>·</span> HELIOtextil`,
      content: `<div class="page-head"><div><h2>Production queue</h2><p>Approved orders from every store, with their production files.</p></div><span class="chip">All stores</span></div>
      <div class="board">${col("pending", "Pending production")}${col("production", "In production")}${col("ready", "Ready for collection")}</div>`,
    });
  },
};
ACTIONS.prodFiles = () => {
  const host = $("#screen");
  const art = shirtReady ? Shirt.productionArtwork(state.design, 760) : shirtPlaceholder(state.design.color);
  const m = document.createElement("div");
  m.className = "modal-back";
  m.id = "modal";
  m.innerHTML = `<div class="modal">
    <div class="modal-head"><div><h3>Production files · ${ORDER.id}</h3><p>Generated from design ${ORDER.design} when the order was paid. Nothing is re-keyed.</p></div><button class="btn sm" data-action="closeModal" id="btn-close">Close</button></div>
    <div class="pack">
      <div class="artwork"><img src="${art}" alt="Production artwork"></div>
      <div class="files">
        <div class="file-row"><span class="ext">PNG</span><div><b>${ORDER.id}_artwork.png</b><small>2048 × 2048 px · print layout</small></div><span class="dl">${I.download}</span></div>
        <div class="file-row"><span class="ext">JSON</span><div><b>${ORDER.id}_design.json</b><small>Colour, name, number, font, zones</small></div><span class="dl">${I.download}</span></div>
        <div class="file-row"><span class="ext">PNG</span><div><b>${ORDER.id}_views.zip</b><small>Front, back, left and right views</small></div><span class="dl">${I.download}</span></div>
        <dl class="kv" style="margin-top:6px"><dt>Size</dt><dd>${state.size}</dd><dt>Name</dt><dd>${state.design.name} · club font · gold</dd><dt>Number</dt><dd>${state.design.number}</dd><dt>Base colour</dt><dd><span class="sw" style="--c:${state.design.color}"></span>${state.design.color}</dd></dl>
        <div class="note">Illustrative layout. In Phase 1 the file follows the production template agreed with HELIOtextil for this product family.</div>
        <button class="btn teal block" data-action="closeModal">${I.download} Download all</button>
      </div>
    </div>
  </div>`;
  host.appendChild(m);
};
ACTIONS.closeModal = () => $("#modal")?.remove();
ACTIONS.startProd = () => {
  $("#modal")?.remove();
  state.status = "production";
  go("board");
};
ACTIONS.markReady = () => {
  state.status = "ready";
  go("board");
  toast(`${CUSTOMER.name} notified`, `Ready to collect at the club shop · code ${ORDER.code}`, I.bell);
  markLast();
};

// ---- 8 pickup
function pickupShell(right) {
  return `<div style="display:flex;flex-direction:column;height:100%">
    <div class="browser-bar" style="height:34px"><div class="url" style="height:22px;width:360px;font-size:11.5px">${I.lock}partners.mania4.com/pickup</div></div>
    <div class="pk-top"><img src="assets/club-crest.svg" alt=""><div><b>Marés FC · Pickups</b><small>${CLUB.pickup}</small></div><div class="pk-user"><span class="avatar" style="--role:var(--pink)">CL</span>Carla · club shop</div></div>
    <div class="pk-body">
      <div class="pk-left">
        <button class="scan-big hint" data-action="scan" id="btn-scan">${I.scan}Scan pickup code</button>
        <div class="or-type"><input class="input" placeholder="Or type the code"><button class="btn">Find</button></div>
        <div class="lbl" style="margin-top:6px">Ready to collect · 3</div>
        <div class="pk-list">
          <div class="pk-item"><div><b>${ORDER.id} · ${CUSTOMER.name}</b><small>Home jersey 2027 · ${state.design.name} ${state.design.number}</small></div>${state.status === "done" ? pill("done") : pill("ready")}</div>
          <div class="pk-item"><div><b>M4-10466 · Marta Lopes</b><small>Scarf 2027 · Cap</small></div>${pill("ready")}</div>
          <div class="pk-item"><div><b>M4-10459 · Hugo Faria</b><small>Home jersey 2027 · FARIA 8</small></div>${pill("ready")}</div>
        </div>
      </div>
      <div class="pk-right" id="pk-right">${right}</div>
    </div>
  </div>`;
}
SCREENS.pickupHome = {
  frame: "tablet",
  needsShirt: true,
  render() {
    return pickupShell(`<div class="pk-empty">${I.pickup}<b style="color:var(--ink)">Scan a pickup code</b>The order appears here. Nothing to charge: every order is already paid.</div>`);
  },
};
ACTIONS.scan = () => {
  $("#pk-right").innerHTML = `<div class="viewfinder fade-in"><div class="held-phone"><div><b>${ORDER.code}</b>${qrSVG(`M4-PICKUP:${ORDER.id}:${ORDER.code}`, 120)}<span class="muted">Marés FC · pickup code</span></div></div><div class="scan-frame"><i></i><i></i><i></i><i></i></div><div class="scan-line"></div><div class="vf-label">Hold the code inside the frame</div></div>`;
  setTimeout(() => {
    if (current === "pickupHome" && $(".viewfinder")) showMatch();
  }, 1800 / SPEED);
};
function showMatch() {
  const v = views();
  $("#pk-right").innerHTML = `<div class="fade-in" style="display:grid;gap:14px">
    <div class="match-head"><div><b>${ORDER.id} · ${CUSTOMER.name}</b><div class="tiny muted">Code ${ORDER.code} · matched</div></div>${pill("ready")}</div>
    <div class="match">
      <div class="match-card"><div class="views4" style="grid-template-columns:1fr 1fr"><figure><img src="${v.front}" alt=""><figcaption>Front</figcaption></figure><figure><img src="${v.back}" alt=""><figcaption>Back</figcaption></figure></div></div>
      <div class="match-card"><dl class="kv" style="grid-template-columns:80px 1fr"><dt>Product</dt><dd>Home jersey 2027</dd><dt>Size</dt><dd>${state.size}</dd><dt>Name</dt><dd>${state.design.name} ${state.design.number}</dd><dt>Badge</dt><dd>${state.design.badge ? "Norte, left sleeve" : "None"}</dd></dl>
        <div class="paid-ok">${I.checkC} Paid online to Mania4 · nothing to charge</div>
        <button class="btn pink lg block hint" data-action="handOver" id="btn-handover">Hand over and complete</button>
      </div>
    </div></div>`;
}
ACTIONS.handOver = () => {
  state.status = "done";
  $("#pk-right").innerHTML = `<div class="done-big"><div class="big-check">${I.checkC}</div><h3>Collected</h3><p>${ORDER.id} · ${CUSTOMER.name} · 17:42</p><p class="tiny">Recorded for the March report. ${CUSTOMER.first} gets a receipt by email.</p></div>`;
  $$(".pk-item")[0].lastElementChild.outerHTML = pill("done");
  markLast();
};

// ---- 9 reports
const DAILY = [6, 5, 7, 9, 12, 19, 43, 13, 6, 5, 4, 6, 9, 21, 10, 5, 4, 6, 8, 11, 47, 15, 7, 5, 6, 5, 9, 18, 8, 5, 4];
const MATCH = { 7: "Home match", 14: "Away match", 21: "Home match", 28: "Away match" };
const TOTAL_ORDERS = DAILY.reduce((a, b) => a + b, 0);
function chartSVG() {
  const W = 620;
  const H = 220;
  const L = 30;
  const B = 24;
  const T = 18;
  const max = 50;
  const n = DAILY.length;
  const bw = (W - L) / n;
  const y = (v) => T + (H - T - B) * (1 - v / max);
  let g = "";
  for (let v = 0; v <= max; v += 10) g += `<line x1="${L}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/>`;
  let ax = "";
  for (let v = 0; v <= max; v += 10) ax += `<text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  [1, 7, 14, 21, 28].forEach((d) => (ax += `<text x="${L + bw * (d - 0.5)}" y="${H - 6}" text-anchor="middle">${d} Mar</text>`));
  let bars = "";
  DAILY.forEach((v, i) => {
    const d = i + 1;
    const x = L + bw * i + 1;
    const w = bw - 2;
    const top = y(v);
    const h = y(0) - top;
    const col = MATCH[d] ? "var(--violet)" : "#cbc4e6";
    const r = Math.min(4, w / 2, h);
    bars += `<path class="bar" d="M${x} ${y(0)}V${top + r}q0 -${r} ${r} -${r}h${w - 2 * r}q${r} 0 ${r} ${r}V${y(0)}z" fill="${col}"/>`;
    bars += `<rect class="hit" x="${L + bw * i}" y="${T}" width="${bw}" height="${H - T - B}" data-d="${d}" data-v="${v}"/>`;
  });
  const anno = [7, 21].map((d) => `<text class="anno" x="${L + bw * (d - 0.5)}" y="${y(DAILY[d - 1]) - 7}" text-anchor="middle">${DAILY[d - 1]}</text>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Paid orders per day in March 2027, with peaks on match days"><g class="grid">${g}</g><g class="axis">${ax}</g>${bars}${anno}</svg>`;
}
SCREENS.reports = {
  frame: "browser",
  url: "admin.mania4.com/reports",
  render() {
    const sales = 15184.6;
    const pickups = Math.round(TOTAL_ORDERS * 0.78);
    const collected = pickups - 9;
    const products = [
      ["Home jersey 2027 · personalised", 214],
      ["Home jersey 2027 · as it is", 61],
      ["Scarf 2027", 58],
      ["Cap", 37],
      ["Training top", 29],
    ];
    const pmax = products[0][1];
    return admin({
      active: "reports",
      crumbs: `Reports <span>›</span> <b>Sales and pickups</b>`,
      content: `<div class="filters"><span class="chip">All stores</span><span class="chip">HELIOPromo</span><span class="chip on">Marés FC</span><span class="sep"></span><span class="chip on">March 2027</span>
        <span style="margin-left:auto;display:flex;gap:8px"><button class="btn sm">Platform activity</button><button class="btn sm primary hint" data-action="exportCsv" id="btn-csv">${I.download} Export CSV for reconciliation</button></span></div>
      <div class="kpis">
        <div class="kpi"><small>Paid orders</small><b>${TOTAL_ORDERS}</b><span>Marés FC · March</span></div>
        <div class="kpi"><small>Sales, VAT included</small><b>€${sales.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</b><span>Average ${money(sales / TOTAL_ORDERS)}</span></div>
        <div class="kpi"><small>Personalised</small><b>66%</b><span>of jerseys sold</span></div>
        <div class="kpi"><small>Pickups collected</small><b>${collected}/${pickups}</b><span>9 waiting at the club shop</span></div>
        <div class="kpi"><small>Member orders</small><b>58%</b><span>10% discount applied</span></div>
      </div>
      <div class="report-grid">
        <div class="card chart-card"><div class="chart-head"><h4>Paid orders per day</h4><div class="legend"><span style="--c:var(--violet)"><i></i>Match day</span><span style="--c:#cbc4e6"><i></i>Other days</span></div></div>
          <div class="chart" id="chart">${chartSVG()}</div><div class="tip" id="tip"></div></div>
        <div class="card"><h4>Products sold</h4>
          <table class="table bars-table" style="border:0"><tbody>${products.map(([n, q]) => `<tr><td style="padding:8px 0">${n}<div class="bar-in" style="width:${(q / pmax) * 100}%;margin-top:6px"></div></td><td class="num" style="padding:8px 0 8px 12px;vertical-align:top"><b>${q}</b></td></tr>`).join("")}</tbody></table>
        </div>
      </div>`,
    });
  },
  mount(el) {
    const chart = $("#chart", el);
    const tip = $("#tip", el);
    const card = chart.closest(".chart-card");
    chart.addEventListener("mousemove", (e) => {
      const h = e.target.closest(".hit");
      if (!h) return tip.classList.remove("show");
      const d = Number(h.dataset.d);
      const r = h.getBoundingClientRect();
      const c = card.getBoundingClientRect();
      const s = c.width / card.offsetWidth;
      tip.innerHTML = `<b>${h.dataset.v} orders</b><small>${d} March${MATCH[d] ? " · " + MATCH[d] : ""}</small>`;
      tip.style.left = (r.left + r.width / 2 - c.left) / s + "px";
      tip.style.top = (r.top - c.top) / s + 40 + "px";
      tip.classList.add("show");
    });
    chart.addEventListener("mouseleave", () => tip.classList.remove("show"));
  },
};
ACTIONS.exportCsv = () => {
  toast("maresfc-2027-03.csv exported", `${TOTAL_ORDERS} orders · products · pickups, ready to settle with the club`, I.download);
  markLast();
};

// ---- 10 replicate
const NEXT_STORES = [
  {
    bg: "#0F5B4A",
    logo: monogram("LU", "#0F5B4A", "#C9E265"),
    title: "Lumen University",
    name: "Lumen University Students’ Union",
    host: "lumen.mania4.com",
    pill: "Setting up · day 3 of 5",
    pillCls: "setup",
  },
  {
    bg: "linear-gradient(120deg,#E4572E,#8E2DE2)",
    logo: monogram("SS", "#E4572E", "#fff"),
    title: "Solar Sound",
    name: "Solar Sound Festival",
    host: "solarsound.mania4.com",
    pill: "Planned · June",
    pillCls: "muted",
  },
];
SCREENS.replicate = {
  frame: "browser",
  url: "admin.mania4.com/stores",
  last: true,
  render() {
    return admin({
      active: "stores",
      crumbs: `<b>Stores</b>`,
      content: `<div class="page-head"><div><h2>Stores</h2><p>One template, many stores. Same checkout, same products, same 3D.</p></div><button class="btn primary">+ New store from template</button></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:18px;align-items:start">
        <div class="store-grid" style="grid-template-columns:1fr 1fr">${[HELIO_STORE, { ...MARES_STORE, meta: `${TOTAL_ORDERS} orders in March` }, ...NEXT_STORES].map(storeCard).join("")}</div>
        <div class="card"><h4>A new partner store in five working days</h4>
          <ol class="timeline5">
            <li class="done"><span class="d">Day 1</span><div>Agreement signed, catalogue chosen</div></li>
            <li class="done"><span class="d">Day 2</span><div>Brand assets in, store set up from the template</div></li>
            <li class="now"><span class="d">Day 3</span><div>Address and QR codes, member list, pickup point</div></li>
            <li><span class="d">Day 4</span><div>Test order end to end, 30-minute staff training</div></li>
            <li><span class="d">Day 5</span><div>Store launched and announced</div></li>
          </ol>
          <div class="note" style="margin-top:10px">Wave 1, April to June 2027: three to five more partner stores. Phase 2 adds a self-service store wizard.</div>
        </div>
      </div>`,
    });
  },
};

/* --------------------------------------------------------------- chapters */

const CHAPTERS = [
  {
    id: "overview",
    title: "The journey at a glance",
    short: "Overview",
    role: "all",
    phase: "Phase 1 · Commercial MVP",
    start: "overview",
    intro: "This is the Phase 1 journey: one partner store, one 3D product, from the first QR code scan to the month-end report.",
    behind: [
      "Mania4 is the merchant of record, with one checkout for every store",
      "Partners never handle money; accounts are settled at month-end",
      "HELIOtextil receives production files with every order",
      "The same journey works for clubs, universities, festivals and events",
    ],
    ws: "<b>Pilot scenario</b>Section 8 of the proposal: the journey Phase 1 is judged against.",
    prepare() {},
    async demo(D) {
      const ov = $("#overview");
      ov.classList.add("animating");
      await D.say(0);
      await D.wait(1800);
      const nodes = $$(".ov-node");
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].classList.add("lit");
        if (i === 0) D.tick(0);
        if (i === 6) D.tick(2);
        if (i === 7) D.tick(1);
        await D.wait(520);
      }
      ov.classList.remove("animating");
      await D.say(1);
      D.tick(3);
      await D.wait(3600);
    },
    captions: [
      "This is the Phase 1 journey: one partner store, one 3D product, from the first QR code scan to the month-end report.",
      "Four roles, one platform. Let’s follow a supporter’s personalised shirt from start to finish.",
    ],
  },
  {
    id: "store",
    title: "Mania4 sets up a partner store",
    short: "Set up the store",
    role: "mania4",
    phase: "Phase 1: set up by our team · Phase 2: self-service wizard",
    start: "storeList",
    behind: [
      "Store created from the Mania4 template, with no new build",
      "Club brand: name, logo and colours",
      "Catalogue picked from the shared product base",
      "Store address and pickup point at the club shop",
      "Members imported from a CSV file, with a 10% discount",
      "Store live, with its QR code",
    ],
    ws: "<b>Workstreams 1 and 6</b>Platform setup, store template, roles, member imports.",
    prepare() {
      state.store = blankStore();
    },
    captions: [
      "Mania4 opens a new partner store from the template. No new build: the same platform and the same checkout.",
      "The club’s brand goes in: name, crest and colours.",
      "Products come from the shared product base. The store gets its own address and a pickup point at the club shop.",
      "The club’s member list is imported from a CSV file, so members get their discount at checkout.",
      "The store is live, with a QR code ready for posters, the stadium and social media.",
    ],
    async demo(D) {
      await D.say(0);
      await D.wait(1400);
      await D.click('[data-action="newStore"].btn');
      D.tick(0);
      await D.wait(700);
      await D.say(1);
      await D.type('[data-bind="storeName"]', CLUB.store);
      await D.click("#logo-up");
      await D.click("#swatches");
      D.tick(1);
      await D.wait(500);
      await D.say(2);
      for (const id of DEFAULT_CAT) await D.click(`.cat-item[data-id="${id}"]`, { hold: 60, after: 120 });
      D.tick(2);
      await D.type('[data-bind="storeHost"]', CLUB.host);
      await D.type('[data-bind="storePickup"]', CLUB.pickup, { delay: 45 });
      D.tick(3);
      await D.say(3);
      await D.click('[data-action="importMembers"]');
      D.tick(4);
      await D.wait(1600);
      await D.click("#publish");
      await D.say(4);
      D.tick(5);
      await D.wait(4200);
    },
  },
  {
    id: "scan",
    title: "A supporter scans the QR code",
    short: "Scan the QR code",
    role: "supporter",
    phase: "Phase 1",
    start: "camera",
    behind: [
      "Each store has its own address and QR code",
      "Club branding from the store settings, in Portuguese and English",
      "Products from the shared base, with this store’s prices",
      "Works in any phone browser; no app to install",
    ],
    ws: "<b>Workstream 2</b>Customer storefront: one reusable Mania4 store template.",
    prepare() {
      storeReady();
    },
    captions: [
      "Match day. A supporter scans the QR code on a poster at the stadium.",
      "It opens the Marés FC store: the club’s brand and catalogue, sold by Mania4.",
      "The new home jersey can be bought as it is, or personalised in 3D.",
    ],
    async demo(D) {
      await D.say(0);
      D.tick(0);
      await D.wait(2400);
      await D.click(".scan-pill");
      await D.say(1);
      D.tick(1);
      D.tick(3);
      await D.wait(2600);
      await D.click("#p-jersey");
      await D.say(2);
      D.tick(2);
      await D.wait(1500);
      await D.click('.size[data-size="L"]');
      await D.wait(900);
      await D.click("#btn-personalise");
    },
  },
  {
    id: "personalise",
    title: "The supporter personalises the shirt in 3D",
    short: "Personalise in 3D",
    role: "supporter",
    phase: "Phase 1 · one product family",
    start: "configurator",
    behind: [
      "Colours, fonts and limits set per product by Mania4",
      "Name and number drawn on the 3D shirt as they are typed",
      "Logo upload checked for format, size and zone",
      "Production artwork generated from the same design",
      "Design saved with a unique ID and four views",
    ],
    ws: "<b>Workstream 3</b>3D personalisation and production export, built on the 3D Customisation Engine.",
    prepare() {
      storeReady();
      state.design = blankDesign();
      state.colourId = "navy";
      state.tab = "colour";
      state.views = null;
      state.saved = false;
    },
    captions: [
      "The 3D configurator opens on the phone. The supporter can rotate and zoom the shirt.",
      "They keep the club navy and add their name and number on the back.",
      "They upload their supporters’ group badge for the sleeve. The file is checked automatically.",
      "One last look all round. On the right is the artwork production will receive.",
      "The design is saved with a unique ID and four views.",
    ],
    async demo(D) {
      await D.say(0);
      await D.wait(1200);
      await D.click('.color[data-id="white"]');
      await D.wait(900);
      await D.click('.color[data-id="navy"]');
      D.tick(0);
      await D.wait(700);
      await D.say(1);
      await D.click('.tab[data-tab="name"]');
      await D.wait(800);
      await D.type("#in-name", "SILVA", { delay: 160 });
      await D.type("#in-number", "10", { delay: 220 });
      D.tick(1);
      await D.wait(1400);
      await D.say(2);
      await D.click('.tab[data-tab="badge"]');
      await D.wait(700);
      await D.click("#badge-upload");
      D.tick(2);
      await D.wait(2200);
      await D.say(3);
      D.tick(3);
      await D.click('.view-btns [data-view="front"]');
      await Shirt.turntable(4200 / SPEED);
      await D.wait(300);
      await D.click("#btn-save");
      await D.say(4);
      D.tick(4);
      await D.wait(3200);
      await D.click("#btn-tocart");
    },
  },
  {
    id: "checkout",
    title: "The supporter pays through the Mania4 checkout",
    short: "Pay by MB WAY",
    role: "supporter",
    phase: "Phase 1",
    start: "cart",
    behind: [
      "The cart line carries the design and its four views",
      "One Mania4 checkout and Easypay account for every store",
      "Member number checked against the imported list",
      "Pickup or delivery, set per store",
      "MB WAY, Multibanco or card; Mania4 issues the invoice",
    ],
    ws: "<b>Workstreams 5 and 6</b>Payments and notifications, member discount.",
    prepare() {
      storeReady();
      if (!state.saved) designReady();
      state.memberOk = false;
      state.delivery = "pickup";
      state.pay = "mbway";
      state.phone = "";
      state.paid = false;
    },
    captions: [
      "The design goes into the cart with its four views.",
      "Checkout runs on the Mania4 checkout, the same for every store.",
      "The member number unlocks 10% off. They collect at the club shop and pay with MB WAY.",
      "The payment is confirmed in the MB WAY app.",
    ],
    async demo(D) {
      await D.say(0);
      D.tick(0);
      await D.wait(2400);
      await D.click("#btn-checkout");
      await D.say(1);
      D.tick(1);
      await D.wait(1800);
      await D.say(2);
      await D.type("#in-member", CUSTOMER.member, { delay: 150 });
      await D.click("#btn-member");
      D.tick(2);
      await D.wait(1000);
      await D.click('[data-action="delivery"][data-v="pickup"]');
      D.tick(3);
      await D.click("#pay-mbway");
      await D.type("#in-phone", CUSTOMER.phone, { delay: 70 });
      D.tick(4);
      await D.wait(600);
      await D.click("#btn-pay");
      await D.say(3);
      await D.waitFor("#notif", 4000);
      await D.wait(900);
      await D.click("#notif");
    },
  },
  {
    id: "confirmed",
    title: "Order confirmed, with a pickup code",
    short: "Confirmation and code",
    role: "supporter",
    phase: "Phase 1",
    start: "confirmed",
    behind: [
      "Order confirmation with the design views",
      "Pickup code generated and shown as a QR code",
      "Confirmation email and invoice sent",
      "Mania4 and the club notified of the new order",
    ],
    ws: "<b>Workstreams 4 and 5</b>Pickup codes, confirmation and notification emails.",
    prepare() {
      storeReady();
      if (!state.saved) designReady();
      state.memberOk = true;
      state.delivery = "pickup";
      state.paid = true;
      state.status = "received";
    },
    captions: [
      "Order confirmed. The supporter sees the design, the order status and a pickup code.",
      "The confirmation email carries the same four views and the invoice from Mania4.",
    ],
    async demo(D) {
      await D.say(0);
      D.tick(0);
      D.tick(1);
      await D.wait(3600);
      await D.say(1);
      D.tick(2);
      D.tick(3);
      await D.wait(3600);
    },
  },
  {
    id: "orders",
    title: "Mania4 checks the order and the artwork",
    short: "Check the order",
    role: "mania4",
    phase: "Phase 1",
    start: "orders",
    behind: [
      "Orders from every store in one place, by store and status",
      "Customer, pickup choice and payment status",
      "Design views and values on every order line",
      "Every status change logged, with who and when",
    ],
    ws: "<b>Workstream 4</b>Order and production management, on the existing dashboard.",
    prepare() {
      storeReady();
      if (!state.saved) designReady();
      state.memberOk = true;
      state.paid = true;
      state.status = "received";
    },
    captions: [
      "Mania4 sees the new paid order straight away, with orders from every store.",
      "The order shows the design views and every value, so the artwork can be checked.",
      "The operator approves the artwork. The order moves to HELIOtextil’s production queue.",
    ],
    async demo(D) {
      await D.say(0);
      D.tick(0);
      await D.wait(2800);
      await D.click("#row-new");
      await D.say(1);
      D.tick(1);
      D.tick(2);
      await D.wait(3400);
      await D.say(2);
      await D.click("#btn-approve");
      D.tick(3);
      await D.wait(3200);
    },
  },
  {
    id: "production",
    title: "HELIOtextil produces from the file",
    short: "Produce",
    role: "heliotextil",
    phase: "Phase 1 · one production template",
    start: "board",
    behind: [
      "Approved orders arrive in HELIOtextil’s production queue",
      "Production files generated with each order",
      "Status moves from pending to in production to ready",
      "The supporter gets a “ready to collect” email with the code",
    ],
    ws: "<b>Workstreams 3 and 4</b>Production export and the production workflow (section 10).",
    prepare() {
      storeReady();
      if (!state.saved) designReady();
      state.memberOk = true;
      state.paid = true;
      state.status = "pending";
    },
    captions: [
      "HELIOtextil sees the approved order in its production queue.",
      "It downloads the production files, generated from the supporter’s design. Nothing is re-keyed.",
      "Production starts. When the shirt is done, it is marked ready and the supporter is told.",
    ],
    async demo(D) {
      await D.say(0);
      D.tick(0);
      await D.wait(2400);
      await D.click("#btn-files");
      await D.say(1);
      D.tick(1);
      await D.wait(4200);
      await D.click("#btn-close");
      await D.say(2);
      await D.click("#btn-start");
      D.tick(2);
      await D.wait(1600);
      await D.click("#btn-ready");
      D.tick(3);
      await D.wait(3200);
    },
  },
  {
    id: "pickup",
    title: "The club shop hands over the shirt",
    short: "Pickup at the club",
    role: "partner",
    phase: "Phase 1",
    start: "pickupHome",
    behind: [
      "Light pickup screen in any phone or tablet browser",
      "Scan the QR code, or type the code",
      "The club never handles money",
      "Each pickup recorded for the month-end report",
    ],
    ws: "<b>Workstream 4</b>Pickup validation by QR code or typed code.",
    prepare() {
      storeReady();
      if (!state.saved) designReady();
      state.memberOk = true;
      state.paid = true;
      state.status = "ready";
    },
    captions: [
      "Saturday at the club shop. The supporter shows their pickup code.",
      "Staff scan it on a tablet. The order is already paid, so there is nothing to charge.",
      "The shirt is handed over and the pickup is recorded for the month-end report.",
    ],
    async demo(D) {
      await D.say(0);
      D.tick(0);
      await D.wait(2000);
      await D.click("#btn-scan");
      D.tick(1);
      await D.waitFor("#btn-handover", 5000);
      await D.say(1);
      D.tick(2);
      await D.wait(2600);
      await D.click("#btn-handover");
      await D.say(2);
      D.tick(3);
      await D.wait(3400);
    },
  },
  {
    id: "reports",
    title: "Month-end: Mania4 settles with the club",
    short: "Month-end report",
    role: "mania4",
    phase: "Phase 1 · no automatic payouts",
    start: "reports",
    behind: [
      "Sales by store and period",
      "Products and quantities sold",
      "Orders and pickups, for reconciliation",
      "CSV export to settle the accounts with the club",
      "Platform activity report: paid orders per month",
    ],
    ws: "<b>Workstream 6</b>Partner reporting and member imports.",
    prepare() {
      storeReady();
      if (!state.saved) designReady();
      state.status = "done";
    },
    captions: [
      "At month-end, Mania4 opens the Marés FC report: sales, products and pickups.",
      "Match days stand out. Every order and pickup is there to settle the accounts.",
      "One click exports the CSV used to reconcile with the club.",
    ],
    async demo(D) {
      await D.say(0);
      D.tick(0);
      D.tick(1);
      await D.wait(3200);
      await D.say(1);
      D.tick(2);
      await D.hover(".hit[data-d='21']");
      await D.wait(1800);
      await D.hover(".hit[data-d='7']");
      await D.wait(1600);
      await D.say(2);
      await D.click("#btn-csv");
      D.tick(3);
      D.tick(4);
      await D.wait(3200);
    },
  },
  {
    id: "replicate",
    title: "The next partner store, in five days",
    short: "The next store",
    role: "mania4",
    phase: "Rollout · Wave 1: April to June 2027",
    start: "replicate",
    behind: [
      "Every store starts from the same template",
      "Shared product base and 3D products",
      "Five working days per new partner store",
      "A self-service store wizard in Phase 2",
    ],
    ws: "<b>Rollout</b>Section 21 of the proposal: four waves, from two stores to a network.",
    prepare() {
      storeReady();
    },
    captions: [
      "The same template becomes the next store: a university, a festival, a corporate event.",
      "Each new partner store takes five working days, from agreement to launch.",
    ],
    async demo(D) {
      await D.say(0);
      D.tick(0);
      D.tick(1);
      await D.wait(3600);
      await D.say(1);
      await D.moveTo(".timeline5 li.now");
      D.tick(2);
      D.tick(3);
      await D.wait(3800);
    },
  },
];
const chapterIndexOf = (id) => CHAPTERS.findIndex((c) => c.id === id);
// In the demo the director moves to the next chapter itself.
function nextChapter(id) {
  if (mode !== "demo") showChapter(chapterIndexOf(id));
}

/* ------------------------------------------------------------ rendering */

const body = document.body;
const scene = $("#scene");
let chapterIndex = 0;
let current = null;
let currentFrame = null;
let mode = "explore";

function fit() {
  const b = $("#stage-body").getBoundingClientRect();
  const w = scene.offsetWidth || 1200;
  const h = scene.offsetHeight || 780;
  const s = Math.min((b.width - 24) / w, (b.height - 24) / h, 1.25);
  scene.style.transform = `translate(-50%, -50%) scale(${Math.max(0.2, s)})`;
}
window.addEventListener("resize", fit);

function renderRail() {
  $("#chapters").innerHTML = CHAPTERS.map(
    (c, i) =>
      `<li class="chapter" data-role="${c.role}" data-i="${i}"><span class="num">${i}</span><div><div class="t">${c.short}</div><div class="r">${ROLES[c.role]}</div></div></li>`,
  ).join("");
  $("#roles").innerHTML = ["mania4", "supporter", "heliotextil", "partner"].map((r) => `<span data-role="${r}"><i></i>${ROLES[r]}</span>`).join("");
  $("#progress").innerHTML = CHAPTERS.map(() => "<span><i></i></span>").join("");
}

function showChapter(i, { fromDemo = false } = {}) {
  if (!fromDemo && mode === "demo") stopDemo();
  chapterIndex = Math.max(0, Math.min(CHAPTERS.length - 1, i));
  const ch = CHAPTERS[chapterIndex];
  ch.prepare();
  $$(".chapter").forEach((el, k) => el.classList.toggle("active", k === chapterIndex));
  $(".chapter.active")?.scrollIntoView({ block: "nearest" });
  const roleChip = $("#stage-role");
  roleChip.dataset.role = ch.role;
  roleChip.textContent = ROLES[ch.role];
  $("#stage-title").textContent = ch.title;
  $("#stage-phase").textContent = ch.phase;
  const aside = $(".behind");
  aside.dataset.role = ch.role;
  $("#behind").innerHTML = ch.behind.map((t) => `<li><span class="ck">${I.check}</span><span>${t}</span></li>`).join("");
  $("#behind-ws").innerHTML = ch.ws;
  $$("#progress span").forEach((s, k) => {
    s.classList.toggle("done", k < chapterIndex);
    s.querySelector("i").style.width = k < chapterIndex ? "100%" : "0";
  });
  $("#next").classList.remove("hint");
  if (mode === "explore") setCaption(ch.intro || ch.captions[0], "Click the highlighted elements, or use the arrows to move between chapters.");
  go(ch.start);
  if (!RECORD) history.replaceState(null, "", `${location.search}#${ch.id}`);
}

function setCaption(text, hint = "") {
  const c = $("#caption");
  c.classList.add("out");
  setTimeout(() => {
    c.innerHTML = text + (hint && mode === "explore" ? `<span class="hint-text">${hint}</span>` : "");
    c.classList.remove("out");
  }, 180);
}

function frameHTML(frame, scr) {
  if (frame === "browser")
    return `<div class="browser"><div class="browser-bar"><div class="dots"><i></i><i></i><i></i></div><div class="url">${I.lock}<span id="url"></span></div><div style="width:47px"></div></div><div class="browser-body" id="screen"></div></div>`;
  if (frame === "phone")
    return `<div class="split"><div id="side-l"></div><div class="phone"><div class="phone-screen" id="phone-screen"><div class="island"></div><div class="status"><span>9:41</span><span class="sig">${I.sig}${I.batt}</span></div><div class="phone-body" id="screen"></div><div class="phone-url"><span>${I.lock}<span id="url"></span></span></div><div class="home-ind"></div></div></div><div id="side-r"></div></div>`;
  if (frame === "tablet") return `<div class="split"><div class="tablet"><div class="tablet-screen" id="screen"></div></div></div>`;
  return `<div id="screen"></div>`;
}

function go(id, { keepScroll = false } = {}) {
  const scr = SCREENS[id];
  const prev = current && SCREENS[current];
  const scrollWas = keepScroll ? ($("#admin-content")?.scrollTop ?? 0) : 0;
  if (prev?.unmount) prev.unmount();
  const frameKey = scr.frame + (scr.frame === "phone" ? ":" + chapterIndex : "");
  if (frameKey !== currentFrame || !$("#screen")) {
    scene.innerHTML = frameHTML(scr.frame, scr);
    currentFrame = frameKey;
  }
  current = id;
  scene.dataset.frame = scr.frame;
  const host = $("#screen");
  host.innerHTML = scr.render();
  host.scrollTop = 0;
  if (keepScroll && $("#admin-content")) $("#admin-content").scrollTop = scrollWas;
  const url = $("#url");
  if (url) url.textContent = scr.url || "";
  const ps = $("#phone-screen");
  if (ps) ps.classList.toggle("dark", !!scr.dark);
  if (scr.frame === "phone") {
    const side = scr.side ? scr.side() : {};
    const l = $("#side-l");
    const r = $("#side-r");
    if (l && l.dataset.html !== (side.left || "")) {
      l.innerHTML = side.left || "";
      l.dataset.html = side.left || "";
    }
    if (r && r.dataset.html !== (side.right || "")) {
      r.innerHTML = side.right || "";
      r.dataset.html = side.right || "";
    }
  }
  scr.mount?.(host);
  if (scr.last) markLast();
  fit();
}

function markLast() {
  if (mode === "explore" && chapterIndex < CHAPTERS.length - 1) $("#next").classList.add("hint");
}

/* ------------------------------------------------------------- events */

document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-action]");
  if (a && scene.contains(a)) {
    if (e.isTrusted && mode === "demo") return;
    const fn = ACTIONS[a.dataset.action];
    if (fn) fn(a, e);
  }
});
document.addEventListener("input", (e) => {
  const el = e.target.closest("[data-bind]");
  if (el && scene.contains(el)) BINDS[el.dataset.bind]?.(el.value, el);
});
$("#chapters").addEventListener("click", (e) => {
  const li = e.target.closest(".chapter");
  if (!li) return;
  const i = Number(li.dataset.i);
  if (mode === "demo") playFrom(i);
  else showChapter(i);
});
$$(".mode-btn").forEach((b) =>
  b.addEventListener("click", () => {
    if (b.dataset.mode === "demo") playFrom(0);
    else {
      stopDemo();
      showChapter(chapterIndex);
    }
  }),
);
$("#play").addEventListener("click", () => {
  if (mode === "demo" && playing) togglePause();
  else playFrom(chapterIndex === CHAPTERS.length - 1 ? 0 : chapterIndex);
});
$("#prev").addEventListener("click", () => (mode === "demo" ? playFrom(Math.max(0, chapterIndex - 1)) : showChapter(chapterIndex - 1)));
$("#next").addEventListener("click", () => (mode === "demo" ? playFrom(Math.min(CHAPTERS.length - 1, chapterIndex + 1)) : showChapter(chapterIndex + 1)));
window.addEventListener("hashchange", () => {
  const i = chapterIndexOf(location.hash.slice(1));
  if (i >= 0 && i !== chapterIndex) showChapter(i);
});
document.addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea")) return;
  if (e.key === "ArrowRight") $("#next").click();
  if (e.key === "ArrowLeft") $("#prev").click();
  if (e.key === " ") {
    e.preventDefault();
    $("#play").click();
  }
});

/* ------------------------------------------------------------- director */

class Abort extends Error {}
let runId = 0;
let playing = false;
let paused = false;
const cursorEl = $("#cursor");
const cur = { x: window.innerWidth * 0.55, y: window.innerHeight * 0.55 };
const placeCursor = () => (cursorEl.style.transform = `translate(${cur.x}px, ${cur.y}px)`);

function setMode(m) {
  mode = m;
  body.classList.toggle("demo", m === "demo");
  body.classList.toggle("explore", m === "explore");
  $$(".mode-btn").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.mode === m)));
  if (m === "explore") {
    $("#next").classList.remove("hint");
    cursorEl.classList.remove("visible");
  }
}
function stopDemo() {
  runId++;
  playing = false;
  paused = false;
  body.classList.remove("playing");
  $("#endcard")?.remove();
  setMode("explore");
}
function togglePause() {
  paused = !paused;
  body.classList.toggle("playing", !paused);
}

async function sleep(ms) {
  const id = runId;
  let remaining = ms / SPEED;
  let last = performance.now();
  while (remaining > 0) {
    await new Promise((r) => setTimeout(r, Math.min(30, remaining)));
    if (id !== runId) throw new Abort();
    const now = performance.now();
    if (!paused) remaining -= now - last;
    last = now;
  }
}
const nextFrame = () => new Promise((r) => requestAnimationFrame(r));

async function waitFor(sel, timeout = 4000) {
  const id = runId;
  const end = performance.now() + timeout;
  while (performance.now() < end) {
    const el = $(sel, scene);
    if (el) return el;
    await new Promise((r) => setTimeout(r, 50));
    if (id !== runId) throw new Abort();
  }
  console.warn("demo: element not found", sel);
  return null;
}

async function animate(duration, step) {
  const id = runId;
  let t = 0;
  let last = performance.now();
  const dur = duration / SPEED;
  while (t < dur) {
    await nextFrame();
    if (id !== runId) throw new Abort();
    const now = performance.now();
    if (!paused) t += now - last;
    last = now;
    step(Math.min(1, t / dur));
  }
}
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

async function reveal(el) {
  const sc = el.closest(".phone-body, .admin-content");
  if (!sc) return;
  const r = el.getBoundingClientRect();
  const s = sc.getBoundingClientRect();
  const k = s.height / sc.clientHeight || 1;
  const margin = 70 * k;
  if (r.top >= s.top + margin && r.bottom <= s.bottom - margin) return;
  const target = Math.max(0, Math.min(sc.scrollHeight - sc.clientHeight, sc.scrollTop + (r.top + r.height / 2 - (s.top + s.height / 2)) / k));
  const from = sc.scrollTop;
  await animate(650, (t) => (sc.scrollTop = from + (target - from) * ease(t)));
  await sleep(120);
}

async function moveTo(sel) {
  const el = typeof sel === "string" ? await waitFor(sel) : sel;
  if (!el) return null;
  await reveal(el);
  const r = el.getBoundingClientRect();
  const tx = r.left + r.width / 2;
  const ty = r.top + r.height / 2;
  const sx = cur.x;
  const sy = cur.y;
  const dist = Math.hypot(tx - sx, ty - sy);
  if (dist > 2) {
    const dur = Math.min(1050, 380 + dist * 0.55);
    const bend = Math.min(60, dist * 0.12);
    await animate(dur, (t) => {
      const e = ease(t);
      const arc = Math.sin(Math.PI * e) * bend;
      cur.x = sx + (tx - sx) * e - ((ty - sy) / (dist || 1)) * arc;
      cur.y = sy + (ty - sy) * e + ((tx - sx) / (dist || 1)) * arc;
      placeCursor();
    });
  }
  cur.x = tx;
  cur.y = ty;
  placeCursor();
  return el;
}

function ripple() {
  const r = document.createElement("span");
  r.className = "ripple";
  r.style.left = cur.x + "px";
  r.style.top = cur.y + "px";
  document.body.appendChild(r);
  setTimeout(() => r.remove(), 700);
}

const D = {
  wait: sleep,
  waitFor,
  moveTo,
  async say(i) {
    const ch = CHAPTERS[chapterIndex];
    setCaption(ch.captions[i]);
    const seg = $$("#progress span")[chapterIndex];
    if (seg) seg.querySelector("i").style.width = `${((i + 1) / ch.captions.length) * 100}%`;
    await sleep(350);
  },
  tick(i) {
    const li = $$("#behind li")[i];
    if (!li || li.classList.contains("on")) return;
    li.classList.add("on", "flash");
  },
  async click(sel, { hold = 110, after = 320 } = {}) {
    const el = await moveTo(sel);
    if (!el) return null;
    await sleep(90);
    cursorEl.classList.add("press");
    ripple();
    await sleep(hold);
    cursorEl.classList.remove("press");
    el.click();
    if (el.matches("input")) el.focus({ preventScroll: true });
    await sleep(after);
    return el;
  },
  async type(sel, text, { delay = 75 } = {}) {
    const el = await D.click(sel, { after: 150 });
    if (!el) return;
    el.focus({ preventScroll: true });
    el.value = "";
    for (const ch of text) {
      el.value += ch;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      await sleep(delay);
    }
    await sleep(200);
  },
  async hover(sel) {
    const el = await moveTo(sel);
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }));
  },
};

async function playFrom(i) {
  const id = ++runId;
  $("#endcard")?.remove();
  setMode("demo");
  playing = true;
  paused = false;
  body.classList.add("playing");
  try {
    if (!shirtReady) {
      setCaption("Loading the 3D shirt…");
      await shirtLoading;
      if (id !== runId) return;
    }
    for (let k = i; k < CHAPTERS.length; k++) {
      showChapter(k, { fromDemo: true });
      $("#caption").innerHTML = "";
      cursorEl.classList.toggle("touch", ["phone", "tablet"].includes(SCREENS[CHAPTERS[k].start].frame));
      cursorEl.classList.toggle("visible", k > 0);
      await sleep(600);
      await CHAPTERS[k].demo(D);
      $$("#progress span")[k]?.classList.add("done");
      $$(".chapter")[k]?.classList.add("done");
      await sleep(500);
    }
    await endCard();
    playing = false;
    body.classList.remove("playing");
    if (RECORD) document.title = "demo-finished";
  } catch (e) {
    if (!(e instanceof Abort)) {
      console.error(e);
      if (RECORD) document.title = "demo-error";
    }
  }
}

async function endCard() {
  cursorEl.classList.remove("visible");
  setCaption("One platform. Many stores. One Mania4 checkout.");
  const e = document.createElement("div");
  e.className = "endcard";
  e.id = "endcard";
  e.innerHTML = `<div class="ec-text">
      <div class="ec-logos"><img src="assets/heliopromo-logo-white.png" alt="HELIOPROMO"><span>×</span><img src="assets/mania4-logo-white.png" alt="MANIA4"></div>
      <h2>One platform.<br>Many stores.<br>One Mania4 checkout.</h2>
      <p>Phase 1 proves the whole journey with one partner store and one 3D product family. Every next club, university, festival or event starts from the same template.</p>
    </div>
    <img class="ec-ring" src="assets/heliopromo-key-visual.jpg" alt="">`;
  scene.appendChild(e);
  await sleep(6500);
}

/* ---------------------------------------------------------------- boot */

let shirtLoading = Shirt.load()
  .then(() => {
    shirtReady = true;
    Shirt.setDesign(state.design);
    if (current && SCREENS[current].needsShirt && !(mode === "demo" && playing)) go(current);
    else if (current === "storeForm") refreshMini();
  })
  .catch((err) => {
    console.error("3D model failed to load", err);
  });

renderRail();
placeCursor();
await document.fonts.ready;
const startId = location.hash.slice(1);
const startIdx = Math.max(0, chapterIndexOf(startId));
// Recording: show the first chapter in demo style and wait for the recorder
// to call __proto.playFrom() once the capture has started.
if (RECORD) {
  setMode("demo");
  document.body.style.cursor = "none";
}
showChapter(startIdx, { fromDemo: RECORD });
if (params.has("autoplay") && !RECORD) {
  await shirtLoading;
  playFrom(startIdx);
}

// Hook for scripted screenshots and recordings.
window.__proto = { isReady: () => shirtReady, go, showChapter, actions: ACTIONS, state, playFrom };
