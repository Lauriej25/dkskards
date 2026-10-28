// shop.js: filterable grid of every slab for sale.
import { boot, qs, ICONS, tileHTML } from './app.js';
import { forSale, inventoryFor, change, escapeHtml } from './config.js';
import { initSlabs } from './slab.js';

const cfg = await boot('shop');
const rows = forSale(cfg).map(l => {
  const item = inventoryFor(cfg, l);
  return { l, era: item?.era || 'Other', lang: item?.language || 'English', c30: change(item, 30), pop: item?.pop ?? Infinity };
});

const facets = { fGrader: r => r.l.grader, fGrade: r => r.l.grade, fEra: r => r.era, fLang: r => r.lang };
for (const [id, get] of Object.entries(facets)) {
  const vals = [...new Set(rows.map(get))].sort((a, b) => isNaN(a) ? a.localeCompare(b) : b - a);
  qs('#' + id).innerHTML = vals.map(v => `<label class="check"><input type="checkbox" value="${escapeHtml(v)}"> ${escapeHtml(id === 'fGrade' ? `Grade ${v}` : v)}</label>`).join('');
}

const checked = id => [...document.querySelectorAll(`#${id} input:checked`)].map(i => i.value);
const num = id => { const v = qs('#' + id).value.replace(/[^\d]/g, ''); return v ? Number(v) : null; };

function filtered() {
  const sel = Object.fromEntries(Object.keys(facets).map(id => [id, checked(id)]));
  const min = num('fMin'), max = num('fMax'), rising = qs('#fRising').checked;
  return rows.filter(r =>
    Object.entries(facets).every(([id, get]) => !sel[id].length || sel[id].includes(String(get(r)))) &&
    (min == null || r.l.priceAUD >= min) && (max == null || r.l.priceAUD <= max) &&
    (!rising || r.c30 > 0));
}

const SORTS = {
  new: (a, b) => (b.l.listedAt || '').localeCompare(a.l.listedAt || ''),
  priceAsc: (a, b) => a.l.priceAUD - b.l.priceAUD,
  priceDesc: (a, b) => b.l.priceAUD - a.l.priceAUD,
  change: (a, b) => (b.c30 ?? -Infinity) - (a.c30 ?? -Infinity),
  pop: (a, b) => a.pop - b.pop
};

function activeCount() {
  return Object.keys(facets).reduce((n, id) => n + checked(id).length, 0)
    + (num('fMin') != null) + (num('fMax') != null) + qs('#fRising').checked;
}

function render() {
  const list = filtered().sort(SORTS[qs('#sort').value]);
  const n = list.length, word = n === 1 ? 'slab' : 'slabs';
  qs('#count').textContent = `${n} ${word}`;
  qs('#showResults').textContent = `Show ${n} ${word}`;
  const active = activeCount();
  qs('#filtersOpen').textContent = active ? `Filters (${active})` : 'Filters';
  qs('#grid').innerHTML = n ? list.map(r => tileHTML(cfg, r.l)).join('') : `
    <div class="empty-state panel" style="grid-column:1/-1">
      <p>${escapeHtml(cfg.copy.emptyShop)}</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">
        <button class="btn btn-line" type="button" data-clear>Clear filters</button>
        <a class="btn btn-lamp" href="index.html#hunt">Start a Card Hunt</a>
      </div>
    </div>`;
  initSlabs(qs('#grid'));
}

function clear() {
  document.querySelectorAll('#filters input[type=checkbox]').forEach(i => { i.checked = false; });
  qs('#fMin').value = qs('#fMax').value = '';
  render();
}

qs('#filters').addEventListener('input', render);
qs('#sort').addEventListener('change', render);
qs('#clearFilters').addEventListener('click', clear);
qs('#grid').addEventListener('click', e => { if (e.target.closest('[data-clear]')) clear(); });

/* Mobile: filters as a bottom sheet */
const sheet = qs('#filters'), openBtn = qs('#filtersOpen');
qs('#filtersClose').innerHTML = ICONS.close;
let scrim;
function setSheet(open) {
  sheet.toggleAttribute('open', open);
  sheet.querySelector('[data-mobile-only]').hidden = !open;
  openBtn.setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) {
    scrim = Object.assign(document.createElement('div'), { className: 'scrim' });
    scrim.addEventListener('click', () => setSheet(false));
    document.body.append(scrim);
    sheet.querySelector('input,button')?.focus();
  } else { scrim?.remove(); openBtn.focus(); }
}
openBtn.addEventListener('click', () => setSheet(true));
qs('#filtersClose').addEventListener('click', () => setSheet(false));
qs('#showResults').addEventListener('click', () => setSheet(false));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheet.hasAttribute('open')) setSheet(false); });

const drop = (cfg.drops || []).filter(d => Date.parse(d.date) > Date.now()).sort((a, b) => a.date.localeCompare(b.date))[0];
if (drop) {
  const when = new Date(drop.date).toLocaleString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Sydney', timeZoneName: 'short' });
  const el = qs('#dropNote');
  el.hidden = false;
  el.innerHTML = `<span class="live-dot" style="margin:0" aria-hidden="true"></span><span><b>Next drop:</b> ${escapeHtml(drop.title)}, ${escapeHtml(when)}.</span>`;
}

render();
