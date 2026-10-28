// config.js: defaults, load/save and shared helpers. Imported by every page and by the dashboard.

export const STORE_KEY = 'dksKardsConfig';
export const ADMIN_KEY = 'dksKardsAdmin';
export const THEME_KEY = 'dksKardsTheme';
const DAY = 864e5;
const iso = t => new Date(t).toISOString().slice(0, 10);

/* ---------- sample data ---------- */

function rng(seed) {
  return () => {
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const VENUES = ['eBay AU', 'eBay US', 'Goldin', 'PWCC', 'AU card show', 'Facebook group'];

// Walks back from today's median so the latest history point equals `median`.
// `yearly` and `recent` are rough % moves over the year and the last 30 days.
function sampleMarket(seed, median, yearly, recent, salesPerYear) {
  const r = rng(seed), now = Date.now(), pts = [];
  let v = median;
  for (let d = 0; d <= 366; d += 3) {
    pts.push({ t: iso(now - d * DAY), aud: Math.round(v / 10) * 10 });
    const step = d < 30 ? recent / 100 / 10 : yearly / 100 / 112;
    v = v / (1 + step) * (1 + (r() - .5) * .006);
  }
  const history = pts.reverse();
  const comps = [];
  for (let i = 0; i < salesPerYear; i++) {
    const t = now - Math.floor(Math.pow(r(), 1.3) * 365) * DAY;
    comps.push({
      date: iso(t),
      aud: Math.round(priceAt(history, t) * (1 + (r() - .5) * .14) / 5) * 5,
      venue: VENUES[Math.floor(r() * VENUES.length)]
    });
  }
  comps.sort((a, b) => a.date.localeCompare(b.date));
  return { history, comps };
}

const inv = (id, seed, card, m) => ({ id, language: 'English', ...card, ...sampleMarket(seed, ...m) });

const INVENTORY = [
  inv('inv_001', 11, { name: 'Charizard', set: 'Base Set', number: '4', era: 'WOTC vintage', grader: 'PSA', grade: '9', pop: 3891, popHigher: 121 }, [4950, 18, 4.2, 22]),
  inv('inv_002', 12, { name: 'Umbreon VMAX (Alt Art)', set: 'Evolving Skies', number: '215', era: 'Sword & Shield', grader: 'PSA', grade: '10', pop: 6012, popHigher: 0 }, [1650, 22, 9.4, 40]),
  inv('inv_003', 13, { name: 'Lugia', set: 'Neo Genesis 1st Edition', number: '9', era: 'WOTC vintage', grader: 'PSA', grade: '8', pop: 1530, popHigher: 812 }, [3900, 6, -4.0, 9]),
  inv('inv_004', 14, { name: 'Rayquaza VMAX (Alt Art)', set: 'Evolving Skies', number: '218', era: 'Sword & Shield', grader: 'PSA', grade: '10', pop: 4410, popHigher: 0 }, [1050, 9, 2.1, 30]),
  inv('inv_005', 15, { name: 'Blastoise', set: 'Base Set', number: '2', era: 'WOTC vintage', grader: 'PSA', grade: '9', pop: 2766, popHigher: 88 }, [1350, 4, -1.6, 16]),
  inv('inv_006', 16, { name: 'Gengar VMAX (Alt Art)', set: 'Fusion Strike', number: '271', era: 'Sword & Shield', grader: 'PSA', grade: '10', pop: 3302, popHigher: 0 }, [880, 12, 5.8, 26]),
  inv('inv_007', 17, { name: 'Mewtwo', set: 'Base Set', number: '10', era: 'WOTC vintage', grader: 'PSA', grade: '9', pop: 2210, popHigher: 64 }, [720, -3, -2.4, 14]),
  inv('inv_008', 18, { name: 'Giratina V (Alt Art)', set: 'Lost Origin', number: '186', era: 'Sword & Shield', grader: 'PSA', grade: '10', pop: 5120, popHigher: 0 }, [1180, 15, 6.6, 28]),
  inv('inv_009', 19, { name: 'Charizard ex (Special Illustration)', set: 'Obsidian Flames', number: '223', era: 'Scarlet & Violet', grader: 'PSA', grade: '10', pop: 7830, popHigher: 0 }, [410, -12, -6.1, 44]),
  inv('inv_010', 20, { name: 'Mew ex (Special Illustration)', set: '151', number: '205', era: 'Scarlet & Violet', grader: 'PSA', grade: '10', pop: 9214, popHigher: 0 }, [330, -8, -3.2, 38]),
  inv('inv_011', 21, { name: 'Venusaur', set: 'Base Set', number: '15', era: 'WOTC vintage', grader: 'PSA', grade: '8', pop: 4140, popHigher: 2980 }, [560, 2, 0.8, 12]),
  inv('inv_012', 22, { name: 'Ho-Oh', set: 'Neo Revelation 1st Edition', number: '7', era: 'WOTC vintage', grader: 'PSA', grade: '9', pop: 402, popHigher: 41 }, [2650, 10, 3.4, 6]),
  inv('inv_013', 23, { name: 'Espeon VMAX (Alt Art)', set: 'Evolving Skies', number: '270', era: 'Sword & Shield', grader: 'CGC', grade: '10', pop: 640, popHigher: 0 }, [690, 14, 1.2, 10]),
  inv('inv_014', 24, { name: 'Pikachu ex (Special Illustration)', set: 'Surging Sparks', number: '238', era: 'Scarlet & Violet', grader: 'PSA', grade: '9', pop: 3020, popHigher: 5110 }, [240, -5, 2.6, 34]),
  inv('inv_015', 25, { name: 'Lugia V (Alt Art)', set: 'Silver Tempest', number: '186', era: 'Sword & Shield', grader: 'PSA', grade: '9', pop: 2280, popHigher: 4320 }, [610, 8, -2.8, 18])
];

const today = iso(Date.now());
const daysAgo = n => iso(Date.now() - n * DAY);

const LISTINGS = [
  {
    id: 'lst_001', inventoryId: 'inv_001', title: 'Charizard', subtitle: 'Base Set Unlimited #4',
    grader: 'PSA', grade: '9', cert: '00000001', priceAUD: 4950, status: 'available', onlyCopy: true,
    images: { front: '', back: '', edge: '' },
    notes: 'Centring 60/40 left to right, 55/45 top to bottom. Corners are sharp under the loupe; the top-left has the faintest white fleck, visible only at an angle. Holo surface is clean with no scratches across the flames. Strong eye appeal for the grade.',
    provenance: [{ date: '2019-06', event: 'Graded PSA 9' }, { date: '2023-02', event: 'Sold at an AU card show' }, { date: daysAgo(40).slice(0, 7), event: 'Bought by DKsKards' }],
    ladder: [['Raw', 750], ['PSA 8', 1900], ['PSA 9', 4950], ['PSA 10', 22000]],
    featured: true, buyLink: '', listedAt: daysAgo(6), sample: true
  },
  {
    id: 'lst_002', inventoryId: 'inv_002', title: 'Umbreon VMAX', subtitle: 'Evolving Skies Alt Art #215',
    grader: 'PSA', grade: '10', cert: '00000002', priceAUD: 1690, status: 'available', onlyCopy: true,
    images: { front: '', back: '', edge: '' },
    notes: 'Centring is close to 50/50 on the front. No print lines across the night sky, which is where this card usually fails. Edges clean all round.',
    provenance: [{ date: '2022-04', event: 'Graded PSA 10' }],
    ladder: [['Raw', 420], ['PSA 8', 520], ['PSA 9', 760], ['PSA 10', 1690]],
    featured: false, buyLink: '', listedAt: daysAgo(3), sample: true
  },
  {
    id: 'lst_003', inventoryId: 'inv_003', title: 'Lugia', subtitle: 'Neo Genesis 1st Edition #9',
    grader: 'PSA', grade: '8', cert: '00000003', priceAUD: 3850, status: 'available', onlyCopy: true,
    images: { front: '', back: '', edge: '' },
    notes: 'The usual Neo Genesis back-edge whitening is light here. Holo has the common factory swirl, not damage. Centring 65/35 left to right, which is what kept it from a 9.',
    provenance: [{ date: '2020-11', event: 'Graded PSA 8' }, { date: '2024-08', event: 'Sold, eBay US, US$2,300' }],
    ladder: [['Raw', 1200], ['PSA 8', 3850], ['PSA 9', 9800], ['PSA 10', 48000]],
    featured: false, buyLink: '', listedAt: daysAgo(12), sample: true
  },
  {
    id: 'lst_004', inventoryId: 'inv_004', title: 'Rayquaza VMAX', subtitle: 'Evolving Skies Alt Art #218',
    grader: 'PSA', grade: '10', cert: '00000004', priceAUD: 1080, status: 'available', onlyCopy: true,
    images: { front: '', back: '', edge: '' },
    notes: 'Sharp corners and a clean textured surface. Centring 55/45. A strong copy for the grade.',
    provenance: [{ date: '2023-01', event: 'Graded PSA 10' }],
    ladder: [['Raw', 300], ['PSA 8', 360], ['PSA 9', 520], ['PSA 10', 1080]],
    featured: false, buyLink: '', listedAt: daysAgo(1), sample: true
  },
  {
    id: 'lst_005', inventoryId: 'inv_005', title: 'Blastoise', subtitle: 'Base Set Unlimited #2',
    grader: 'PSA', grade: '9', cert: '00000005', priceAUD: 1390, status: 'on_hold', onlyCopy: true,
    images: { front: '', back: '', edge: '' },
    notes: 'Bright holo with very little scratching. Back has a small soft spot on the bottom edge that you have to look for.',
    provenance: [{ date: '2018-09', event: 'Graded PSA 9' }],
    ladder: [['Raw', 260], ['PSA 8', 620], ['PSA 9', 1390], ['PSA 10', 7200]],
    featured: false, buyLink: '', listedAt: daysAgo(20), sample: true
  },
  {
    id: 'lst_006', inventoryId: 'inv_006', title: 'Gengar VMAX', subtitle: 'Fusion Strike Alt Art #271',
    grader: 'PSA', grade: '10', cert: '00000006', priceAUD: 899, status: 'available', onlyCopy: true,
    images: { front: '', back: '', edge: '' },
    notes: 'Clean surface and corners. Centring 55/45 top to bottom. Colours are deep purple with no fading.',
    provenance: [{ date: '2023-05', event: 'Graded PSA 10' }],
    ladder: [['Raw', 210], ['PSA 8', 260], ['PSA 9', 380], ['PSA 10', 899]],
    featured: false, buyLink: '', listedAt: daysAgo(9), sample: true
  },
  {
    id: 'lst_007', inventoryId: 'inv_007', title: 'Mewtwo', subtitle: 'Base Set Unlimited #10',
    grader: 'PSA', grade: '9', cert: '00000007', priceAUD: 740, status: 'sold', soldAt: daysAgo(8), onlyCopy: true,
    images: { front: '', back: '', edge: '' }, notes: '', provenance: [], ladder: [],
    featured: false, buyLink: '', listedAt: daysAgo(30), sample: true
  }
];

export const DEFAULTS = {
  copy: {
    heroHeadline: "Researched before it's listed.",
    heroSub: 'Every slab here comes with the recent sales, the population and our notes from under the loupe.',
    heroCta: 'Browse the slabs',
    heroCta2: 'Start a Card Hunt',
    tiltPrompt: 'Tilt your phone to light the card',
    railTitle: 'On the table',
    onlyCopy: 'This is the only copy we have',
    ladderTitle: 'What a grade is worth',
    ladderCaption: 'The same card, priced by grade. The jump from 9 to 10 is where most of the value sits, and where our notes matter most.',
    marketTitle: "What's moving",
    huntTitle: 'Tell us what you’re after',
    huntButton: 'Send my brief',
    huntConfirm: "Brief sent. We'll reply within one business day with questions or a start date.",
    membershipTitle: 'Stay a step ahead of the AU market',
    certTitle: 'Check a cert',
    certHint: 'Enter a PSA, CGC or BGS cert number.',
    certError: "We couldn't find that cert. Check the number on the label and try again.",
    emptyShop: 'No slabs match these filters. Clear filters, or ask us to hunt one down.',
    buyNote: 'All-in price. Insured shipping in Australia.',
    disclaimer: 'General information only. Nothing on this site is financial advice. Prices are in AUD and reflect recent sales, not future values.',
    abn: 'ABN to be added'
  },
  settings: {
    contactEmail: 'hello@dkskards.example',
    huntPrice: 99,
    auditPrice: 249,
    sourcingRates: { free: .05, insider: .05, collector: .035, concierge: .025 },
    lamp: '#F2CF8D'
  },
  tickerItems: INVENTORY.slice(0, 8).map(i => {
    const ref = Date.parse(i.history.at(-1).t);
    const price = i.history.at(-1).aud, prevPrice = priceAt(i.history, ref - 30 * DAY);
    return { text: `${i.name} ${i.grader} ${i.grade}`, price, prevPrice, dir: price >= prevPrice ? 'up' : 'down' };
  }),
  reportCards: [
    { card: 'Umbreon VMAX Alt Art', grade: 'PSA 10', median: 1650, call: 'Keep', note: 'Steady demand, low supply of clean copies' },
    { card: 'Charizard ex SIR (Obsidian Flames)', grade: 'Raw', median: 95, call: 'Grade', note: 'Centring looks 10-capable; gem rate is high' },
    { card: 'Lugia V Alt Art', grade: 'PSA 9', median: 610, call: 'Upgrade', note: 'The 10 is 2.6× the 9; swap if you find a strong 10' },
    { card: 'Mew ex SIR (151)', grade: 'PSA 10', median: 330, call: 'Sell', note: 'Population is climbing faster than sales' }
  ],
  inventory: INVENTORY,
  listings: LISTINGS,
  drops: [{ date: iso(Date.now() + 11 * DAY) + 'T19:00:00+11:00', title: 'Vintage holo drop', listingIds: [] }],
  membership: {
    tiers: [
      { id: 'free', name: 'Free', priceMonthly: 0, blurb: 'The weekly movers email and the top of the Market board.', link: '' },
      { id: 'insider', name: 'Insider', priceMonthly: 15, priceYearly: 150, blurb: 'The full Market board, the monthly report and price alerts.', link: '' },
      { id: 'collector', name: 'Collector', priceMonthly: 39, priceYearly: 390, blurb: 'Your collection tracked, with a call on every card.', link: '', highlight: true },
      { id: 'concierge', name: 'Concierge', priceMonthly: 199, blurb: 'A direct line to us and regular Card Hunts.', link: '', from: true }
    ],
    features: [
      ['Weekly AU movers email', '✓', '✓', '✓', '✓'],
      ['Full Market board', 'Top 5', '✓', '✓', '✓'],
      ['Monthly AU market report', '', '✓', '✓', '✓'],
      ['Price alerts', '', '5', '25', 'Unlimited'],
      ['Tracked collection', '', '', '50 cards, monthly calls', 'Unlimited + quarterly audit'],
      ['Card Hunt reports', '', '', '1 per quarter', 'Up to 2 per month'],
      ['Sourcing fee', '5%', '5%', '3.5%', '2.5%'],
      ['First look at new slabs', '', '', '48 hours', '48 hours + direct line']
    ]
  },
  theme: 'dark'
};

/* ---------- load / save ---------- */

export function readLocal() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch { return {}; }
}

export function isAdmin() {
  try { return !!localStorage.getItem(ADMIN_KEY); } catch { return false; }
}

// Published config.json first, then this browser's edits only if the dashboard has been opened here.
export async function load({ admin = isAdmin() } = {}) {
  const remote = await fetch('config.json', { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : {})).catch(() => ({}));
  const cfg = { ...DEFAULTS, ...remote, ...(admin ? readLocal() : {}) };
  cfg.copy = { ...DEFAULTS.copy, ...cfg.copy };
  cfg.settings = { ...DEFAULTS.settings, ...cfg.settings };
  return cfg;
}

export function save(cfg) {
  localStorage.setItem(STORE_KEY, JSON.stringify(cfg));
}

/* ---------- market maths ---------- */

export function priceAt(history, ts) {
  let v = history[0]?.aud ?? 0;
  for (const p of history) { if (Date.parse(p.t) <= ts) v = p.aud; else break; }
  return v;
}

export const median = xs => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export const latest = item => item?.history?.at(-1)?.aud ?? 0;

// % change over `days`, measured back from the latest history point.
export function change(item, days) {
  const h = item?.history;
  if (!h?.length) return null;
  const last = h.at(-1), past = priceAt(h, Date.parse(last.t) - days * DAY);
  return past ? (last.aud - past) / past * 100 : null;
}

export const salesIn = (item, days) =>
  (item?.comps || []).filter(c => Date.parse(c.date) >= Date.now() - days * DAY).length;

// Heat = 30-day momentum, then 7-day momentum, then sales velocity (last 30 days vs the 90-day pace).
export function heat(item) {
  const m30 = change(item, 30) ?? 0, m7 = change(item, 7) ?? 0;
  const s30 = salesIn(item, 30), s90 = salesIn(item, 90);
  // Velocity only counts once there are enough sales to mean something, and is capped so it can't outvote price.
  const velocity = s90 >= 4 ? s30 / (s90 / 3) : 1;
  const score = .5 * m30 + .3 * m7 + 2 * Math.max(-1, Math.min(1, velocity - 1));
  const label = score >= 2 ? 'Hot' : score <= -2 ? 'Cold' : 'Steady';
  return { score, label, level: label === 'Steady' ? 0 : Math.min(3, Math.ceil(Math.abs(score) / 3)) };
}

/* ---------- lookups ---------- */

export const inventoryFor = (cfg, l) => (cfg.inventory || []).find(i => i.id === l?.inventoryId);
export const forSale = cfg => (cfg.listings || []).filter(l => l.status !== 'sold');
export const featured = cfg => forSale(cfg).find(l => l.featured) || forSale(cfg)[0];

/* ---------- formatting ---------- */

export const fmtAUD = n => (n || n === 0) && !isNaN(n) ? 'A$' + Math.round(Number(n)).toLocaleString('en-AU') : '—';

export const pctText = p => p == null || isNaN(p) ? '—' : (p >= 0 ? '+' : '−') + Math.abs(p).toFixed(1) + '%';

export const dirClass = p => p == null ? '' : p >= 0 ? 'up' : 'down';

export const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const fmtDate = (d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(d).toLocaleDateString('en-AU', opts);

// Inline SVG sparkline of the last `days` of history. Colour follows the direction.
export function spark(item, days = 30, w = 96, h = 28) {
  const h0 = item?.history || [];
  if (h0.length < 2) return '';
  const end = Date.parse(h0.at(-1).t);
  const pts = h0.filter(p => Date.parse(p.t) >= end - days * DAY);
  if (pts.length < 2) return '';
  const ys = pts.map(p => p.aud), lo = Math.min(...ys), hi = Math.max(...ys) || 1;
  const d = pts.map((p, i) => `${(i / (pts.length - 1) * w).toFixed(1)},${(h - 2 - (p.aud - lo) / (hi - lo || 1) * (h - 4)).toFixed(1)}`).join(' ');
  const cls = ys.at(-1) >= ys[0] ? 'up' : 'down';
  return `<svg class="spark ${cls}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><polyline points="${d}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}

/* ---------- colour ---------- */

function luminance(hex) {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => parseInt(n.length === 3 ? n[i / 2].repeat(2) : n.slice(i, i + 2), 16) / 255)
    .map(c => (c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4));
  return .2126 * r + .7152 * g + .0722 * b;
}

export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + .05) / (y + .05);
}

/* ---------- placeholder art ---------- */

// Abstract stand-in art for a listing until a real photo is added. Never shows real card artwork.
export function cardArt(l) {
  let h = 0;
  for (const c of (l?.title || '') + (l?.subtitle || '')) h = (h * 31 + c.charCodeAt(0)) % 360;
  const a = `hsl(${h} 55% 42%)`, b = `hsl(${(h + 60) % 360} 60% 24%)`, c = `hsl(${(h + 200) % 360} 70% 70%)`;
  const initial = escapeHtml((l?.title || '?').trim()[0] || '?');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 420">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
<radialGradient id="r" cx=".7" cy=".3" r=".6"><stop offset="0" stop-color="${c}" stop-opacity=".55"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs>
<rect width="300" height="420" fill="url(#g)"/><rect width="300" height="420" fill="url(#r)"/>
<g fill="none" stroke="#fff" stroke-opacity=".14"><circle cx="150" cy="190" r="70"/><circle cx="150" cy="190" r="110"/><circle cx="150" cy="190" r="150"/></g>
<text x="150" y="222" text-anchor="middle" font-family="Archivo,Arial,sans-serif" font-weight="800" font-size="96" fill="#fff" fill-opacity=".85">${initial}</text>
<text x="150" y="398" text-anchor="middle" font-family="Archivo,Arial,sans-serif" font-size="13" fill="#fff" fill-opacity=".7">Photo to come</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
