// app.js: shared chrome for every public page — nav, live strip, tab bar, search, footer, theme.
import { load, THEME_KEY, escapeHtml, fmtAUD, pctText, forSale, inventoryFor, change, dirClass, spark } from './config.js';
import { reduce, slabHTML } from './slab.js';

const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const ICONS = {
  shop: svg('<rect x="5" y="3" width="14" height="18" rx="2.5"/><rect x="7.5" y="5.5" width="9" height="3" rx="1"/><rect x="7.5" y="10.5" width="9" height="8" rx="1"/>'),
  market: svg('<path d="M3 17l5-5 4 4 8-8"/><path d="M15 8h5v5"/>'),
  hunt: svg('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/><path d="M11 8v6M8 11h6"/>'),
  members: svg('<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/>'),
  search: svg('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/>'),
  theme: svg('<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  left: svg('<path d="M15 6l-6 6 6 6"/>'),
  right: svg('<path d="M9 6l6 6-6 6"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7"/>')
};

const NAV = [
  ['shop', 'Shop', 'shop.html'],
  ['market', 'Market', 'market.html'],
  ['hunt', 'Card Hunt', 'index.html#hunt', 'Hunt'],
  ['members', 'Membership', 'index.html#membership', 'Members']
];

export async function boot(page) {
  const cfg = await load();
  applyTheme(cfg);
  applyLamp(cfg);
  renderTop(page);
  renderLive(cfg.tickerItems || []);
  renderTabbar(page);
  renderFoot(cfg);
  applyCopy(cfg);
  initSearch(cfg);
  return cfg;
}

/* ---------- theme + brand ---------- */

function applyTheme(cfg) {
  let stored = null;
  try { stored = localStorage.getItem(THEME_KEY); } catch {}
  document.documentElement.dataset.theme = stored || cfg.theme || 'dark';
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem(THEME_KEY, next); } catch {}
  document.dispatchEvent(new CustomEvent('themechange'));
}

// The dashboard's lamp colour replaces the dark-theme lamp. The light theme keeps its darker lamp for contrast.
function applyLamp(cfg) {
  const lamp = cfg.settings?.lamp;
  if (!lamp || !/^#[0-9a-f]{6}$/i.test(lamp)) return;
  const s = document.createElement('style');
  s.textContent = `:root:not([data-theme="light"]){--lamp:${lamp}}`;
  document.head.append(s);
}

export function applyCopy(cfg) {
  document.querySelectorAll('[data-copy]').forEach(el => {
    const v = cfg.copy?.[el.dataset.copy];
    if (v) el.textContent = v;
  });
}

/* ---------- top nav ---------- */

function renderTop(page) {
  const el = document.querySelector('[data-chrome="top"]');
  if (!el) return;
  el.innerHTML = `
  <header class="topnav">
    <div class="wrap">
      <a class="logo" href="index.html" aria-label="DKsKards home"><span class="logo-chip" id="navLogoAbbr">DK</span><span id="navLogoName">DKsKards</span></a>
      <nav class="topnav-links" aria-label="Main">
        ${NAV.map(([id, name, href]) => `<a href="${href}"${id === page ? ' aria-current="page"' : ''}>${name}</a>`).join('')}
      </nav>
      <div class="topnav-tools">
        <button class="icon-btn" type="button" data-open-search aria-label="Search cards" title="Search (/)">${ICONS.search}</button>
        <button class="icon-btn" type="button" data-theme-toggle aria-label="Switch light or dark theme" title="Theme">${ICONS.theme}</button>
      </div>
    </div>
  </header>
  <div class="live" id="liveStrip" role="region" aria-label="Live prices"></div>`;
  el.querySelector('[data-theme-toggle]').addEventListener('click', toggleTheme);
}

/* ---------- live strip ---------- */

function renderLive(items) {
  const el = document.getElementById('liveStrip');
  if (!el) return;
  if (!items.length) { el.hidden = true; return; }
  const parts = items.map(i => {
    const pct = i.price && i.prevPrice ? (i.price - i.prevPrice) / i.prevPrice * 100 : null;
    const cls = pct == null ? (i.dir === 'down' ? 'down' : 'up') : pct >= 0 ? 'up' : 'down';
    return { text: escapeHtml(i.text), price: i.price ? fmtAUD(i.price) : '', pct: pct == null ? '' : pctText(pct), cls };
  });
  const li = p => `<li><span>${p.text}</span> <b class="num">${p.price}</b>${p.pct ? ` <b class="num ${p.cls}">${p.pct}</b>` : ''}</li>`;
  const row = parts.map(li).join('');
  el.style.setProperty('--ticker-speed', `${Math.max(30, items.length * 7)}s`);
  el.innerHTML = `<span class="live-dot" aria-hidden="true"></span><span class="sr-only">Live</span>
    <ul tabindex="0">${row}</ul>
    <button class="live-one" type="button" aria-haspopup="dialog"></button>
    <dialog class="sheet" id="liveAll" aria-label="All live prices">
      <div class="sheet-head"><h3>Live prices</h3><button class="icon-btn" type="button" data-close aria-label="Close">${ICONS.close}</button></div>
      <ul class="sheet-body mover-list">${parts.map(p => `<li style="display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid var(--edge);padding:10px 0"><span>${p.text}</span><span class="num"><b>${p.price}</b> <b class="${p.cls}">${p.pct}</b></span></li>`).join('')}</ul>
    </dialog>`;
  // Desktop marquee needs the row twice; the copy is hidden from screen readers.
  el.querySelector('ul').insertAdjacentHTML('beforeend', parts.map(p => li(p).replace('<li>', '<li aria-hidden="true">')).join(''));

  // Mobile: one item at a time, tap to see all.
  const one = el.querySelector('.live-one'), dlg = el.querySelector('#liveAll');
  let i = 0;
  const show = () => {
    const p = parts[i % parts.length];
    one.innerHTML = `<span>${p.text}</span> <b class="num">${p.price}</b> <b class="num ${p.cls}">${p.pct}</b> ›`;
    one.style.animation = 'none'; one.offsetWidth; one.style.animation = '';
  };
  show();
  if (!reduce && parts.length > 1) setInterval(() => { if (!dlg.open && !document.hidden) { i++; show(); } }, 4000);
  one.addEventListener('click', () => dlg.showModal());
  wireDialog(dlg);
}

/* ---------- tab bar + footer ---------- */

function renderTabbar(page) {
  const nav = document.createElement('nav');
  nav.className = 'tabbar';
  nav.setAttribute('aria-label', 'Main');
  nav.innerHTML = NAV.map(([id, name, href, short]) =>
    `<a href="${href}"${id === page ? ' aria-current="page"' : ''}>${ICONS[id]}${short || name}</a>`).join('');
  document.body.append(nav);
}

function renderFoot(cfg) {
  const el = document.querySelector('[data-chrome="foot"]');
  if (!el) return;
  const email = cfg.settings.contactEmail;
  el.innerHTML = `
  <footer class="foot">
    <div class="wrap">
      <div class="foot-grid">
        <div>
          <a class="logo" href="index.html" aria-label="DKsKards home"><span class="logo-chip">DK</span><span>DKsKards</span></a>
          <p class="muted small" style="margin-top:12px;max-width:36ch">Graded Pokémon slabs, hand-picked in Australia. Every price in AUD.</p>
          ${email ? `<p class="small" style="margin-top:8px"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>` : ''}
        </div>
        <nav aria-label="Footer">
          <a href="shop.html">Shop</a><a href="market.html">Market</a><a href="index.html#hunt">Card Hunt</a><a href="index.html#membership">Membership</a>
        </nav>
        <nav aria-label="Trust">
          <a href="index.html#verify">Check a cert</a><a href="index.html#hunt">Portfolio audit</a><a href="dashboard.html" rel="nofollow">Admin</a>
        </nav>
      </div>
      <p class="disclaimer">${escapeHtml(cfg.copy.disclaimer)}</p>
      <p class="muted small" style="margin-top:8px">${escapeHtml(cfg.copy.abn)} · © ${new Date().getFullYear()} DKsKards</p>
    </div>
  </footer>`;
}

/* ---------- dialogs ---------- */

export function wireDialog(dlg) {
  dlg.addEventListener('click', e => {
    if (e.target === dlg || e.target.closest('[data-close]')) dlg.close();
  });
}

/* ---------- search ---------- */

function initSearch(cfg) {
  const items = [
    ...forSale(cfg).map(l => ({ name: l.title, meta: `${l.subtitle} · ${l.grader} ${l.grade}`, right: fmtAUD(l.priceAUD), href: `card.html?id=${encodeURIComponent(l.id)}` })),
    ...(cfg.inventory || []).map(i => ({ name: i.name, meta: `${i.set} · ${i.grader} ${i.grade} · market`, right: fmtAUD(i.history?.at(-1)?.aud), href: `market.html#${encodeURIComponent(i.id)}` }))
  ];
  const dlg = document.createElement('dialog');
  dlg.className = 'search';
  dlg.setAttribute('aria-label', 'Search cards');
  dlg.innerHTML = `<input type="search" placeholder="Search slabs and tracked cards" aria-label="Search" role="combobox" aria-expanded="true" aria-controls="searchResults" autocomplete="off"><ul id="searchResults" role="listbox"></ul>`;
  document.body.append(dlg);
  const input = dlg.querySelector('input'), list = dlg.querySelector('ul');
  let sel = 0, hits = [];
  const render = () => {
    const q = input.value.trim().toLowerCase();
    hits = items.filter(i => !q || (i.name + ' ' + i.meta).toLowerCase().includes(q)).slice(0, 12);
    sel = Math.min(sel, Math.max(0, hits.length - 1));
    list.innerHTML = hits.length ? hits.map((h, n) =>
      `<li><a href="${h.href}" role="option" aria-selected="${n === sel}"><span>${escapeHtml(h.name)}<br><small>${escapeHtml(h.meta)}</small></span><b class="num">${h.right}</b></a></li>`).join('')
      : `<li class="empty">No cards match. <a href="index.html#hunt">Ask us to hunt one down</a>.</li>`;
  };
  input.addEventListener('input', () => { sel = 0; render(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % (hits.length || 1);
      render();
      list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && hits[sel]) location.href = hits[sel].href;
  });
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  const open = () => { input.value = ''; render(); dlg.showModal(); input.focus(); };
  document.addEventListener('click', e => { if (e.target.closest('[data-open-search]')) open(); });
  document.addEventListener('keydown', e => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
    if ((e.key === '/' && !typing) || (e.key === 'k' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); open(); }
  });
}

/* ---------- shared bits used by several pages ---------- */

export const qs = (s, r = document) => r.querySelector(s);

// A listing as a mini slab with price and 30-day trend. Used in rails and the shop grid.
export function tileHTML(cfg, l) {
  const item = inventoryFor(cfg, l), c30 = change(item, 30);
  return `
  <a class="tile" href="card.html?id=${encodeURIComponent(l.id)}">
    ${slabHTML(l, item, { back: false })}
    <div class="tile-info">
      <h3>${escapeHtml(l.title)}</h3>
      <span class="sub">${escapeHtml(l.subtitle)} · ${escapeHtml(l.grader)} ${escapeHtml(l.grade)}</span>
      <div class="tile-row"><span class="tile-price num">${fmtAUD(l.priceAUD)}</span>${spark(item, 30)}</div>
      <div class="tile-row">
        <span class="tile-change num ${dirClass(c30)}">${c30 == null ? '' : `30d ${pctText(c30)}`}</span>
        <span class="tags">${l.status === 'on_hold' ? '<span class="tag">On hold</span>' : ''}${l.sample ? '<span class="tag">Sample</span>' : ''}</span>
      </div>
      ${l.onlyCopy && l.status === 'available' ? `<span class="sub">${escapeHtml(cfg.copy.onlyCopy)}</span>` : ''}
    </div>
  </a>`;
}

export function railArrows(rail, prev, next) {
  const step = () => rail.firstElementChild ? rail.firstElementChild.getBoundingClientRect().width + 24 : 300;
  prev?.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }));
  next?.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }));
}

export function mailto(to, subject, body) {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
