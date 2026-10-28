// market.js: the Market board — hot / cold / most traded, heat map, recently sold.
import { boot, qs } from './app.js';
import { change, salesIn, heat, latest, spark, fmtAUD, pctText, dirClass, escapeHtml, fmtDate, isAdmin } from './config.js';

const cfg = await boot('market');
const FREE_ROWS = 5;
const inv = cfg.inventory || [];
let days = 30, view = 'hot';

const newest = inv.flatMap(i => i.history?.length ? [i.history.at(-1).t] : []).sort().at(-1);
if (newest) {
  const ago = Math.round((Date.now() - Date.parse(newest)) / 864e5);
  qs('#updated').innerHTML = `${inv.length} Pokémon slabs we track · updated ${ago <= 0 ? 'today' : ago === 1 ? 'yesterday' : `${ago} days ago`} <span class="live-dot" style="display:inline-block;margin:0 0 1px 6px" aria-hidden="true"></span>`;
}

const ARROWS = { Hot: '▲', Cold: '▼', Steady: '–' };

function render() {
  const rows = inv.map(i => ({ i, c: change(i, days), c7: change(i, 7), c30: change(i, 30), c90: change(i, 90), s: salesIn(i, days), h: heat(i) }));
  const sorts = {
    hot: (a, b) => (b.c ?? -1e9) - (a.c ?? -1e9),
    cold: (a, b) => (a.c ?? 1e9) - (b.c ?? 1e9),
    traded: (a, b) => b.s - a.s
  };
  rows.sort(sorts[view]);
  const gated = !isAdmin();
  qs('#salesHead').textContent = `Sales (${days}d)`;
  qs('#board tbody').innerHTML = rows.map((r, n) => {
    const lock = gated && n >= FREE_ROWS;
    const word = r.h.label, arrows = word === 'Steady' ? '–' : ARROWS[word].repeat(r.h.level);
    return `<tr id="${escapeHtml(r.i.id)}"${lock ? ' class="gated" aria-hidden="true"' : ''}>
      <td class="card"><button type="button" aria-expanded="false"${lock ? ' tabindex="-1"' : ''}>${escapeHtml(r.i.name)}</button><small>${escapeHtml(r.i.set)} · <span class="grade-inline">${escapeHtml(r.i.grader)} ${escapeHtml(r.i.grade)}</span></small></td>
      <td class="gr">${escapeHtml(r.i.grader)} ${escapeHtml(r.i.grade)}</td>
      <td class="med"><b>${fmtAUD(latest(r.i))}</b><span class="${dirClass(r.c30)}" data-m>${pctText(r.c30)}</span></td>
      <td class="c7 ${dirClass(r.c7)}" data-label="7d">${pctText(r.c7)}</td>
      <td class="c30 ${dirClass(r.c30)}">${pctText(r.c30)}</td>
      <td class="c90 ${dirClass(r.c90)}" data-label="90d">${pctText(r.c90)}</td>
      <td class="sales" data-label="Sales (${days}d)">${r.s}</td>
      <td class="hc"><span class="heat" title="${word}"><i class="${word === 'Hot' ? 'up' : word === 'Cold' ? 'down' : 'muted'}" aria-hidden="true">${arrows}</i><small>${word}</small></span></td>
      <td class="sp">${spark(r.i, Math.max(days, 30))}</td>
    </tr>`;
  }).join('');

  qs('#gate .gate-cta')?.remove();
  if (gated && rows.length > FREE_ROWS) {
    qs('#gate').insertAdjacentHTML('beforeend', `<div class="gate-cta"><p><b>Members see all ${rows.length} tracked cards.</b></p>
      <p class="muted small">Insider members get the full board, the monthly AU report and price alerts.</p>
      <a class="btn btn-lamp" href="index.html#membership">See membership</a></div>`);
  }
}

// Desktop shows the median change in its own column; the mobile list shows it beside the median.
const style = document.createElement('style');
style.textContent = '@media (min-width:761px){.board [data-m]{display:none}.board .grade-inline{display:none}}@media (max-width:760px){.board td.med b{margin-right:4px}}';
document.head.append(style);

qs('#board').addEventListener('click', e => {
  const b = e.target.closest('td.card button');
  if (!b || !matchMedia('(max-width: 760px)').matches) return;
  const tr = b.closest('tr'), open = tr.classList.toggle('open');
  b.setAttribute('aria-expanded', open);
});

for (const [id, set] of [['#range', b => { days = Number(b.dataset.days); }], ['#view', b => { view = b.dataset.view; }]]) {
  qs(id).addEventListener('click', e => {
    const b = e.target.closest('.chip');
    if (!b) return;
    set(b);
    qs(id).querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === b));
    render();
  });
}

/* Heat map: era × grade */
function renderHeatmap() {
  const eras = [...new Set(inv.map(i => i.era || 'Other'))];
  const grades = ['8', '9', '10'];
  const cell = (era, g) => {
    const xs = inv.filter(i => (i.era || 'Other') === era && i.grade === g).map(i => change(i, 30)).filter(c => c != null);
    if (!xs.length) return `<div class="hm-cell" role="cell"><b class="muted">—</b><small>No cards</small></div>`;
    const avg = xs.reduce((a, b) => a + b, 0) / xs.length;
    const mix = Math.min(55, Math.round(Math.abs(avg) * 5));
    return `<div class="hm-cell" role="cell" style="--tone:var(${avg >= 0 ? '--gain' : '--loss'});--mix:${mix}%">
      <b>${pctText(avg)}</b><small>${xs.length} ${xs.length === 1 ? 'card' : 'cards'} · ${avg >= 2 ? 'Hot' : avg <= -2 ? 'Cold' : 'Steady'}</small></div>`;
  };
  qs('#heatmap').innerHTML =
    `<div class="hm-row" role="row"><span class="hm-head" role="columnheader">Era</span>${grades.map(g => `<span class="hm-head" role="columnheader" style="text-align:center">Grade ${g}</span>`).join('')}</div>` +
    eras.map(e => `<div class="hm-row" role="row"><span class="hm-label" role="rowheader">${escapeHtml(e)}</span>${grades.map(g => cell(e, g)).join('')}</div>`).join('');
}

/* Recently sold */
const sold = (cfg.listings || []).filter(l => l.status === 'sold' && l.soldAt && Date.now() - Date.parse(l.soldAt) < 30 * 864e5);
if (sold.length) {
  qs('#soldWrap').hidden = false;
  qs('#sold').innerHTML = sold.map(l => `<li><a href="card.html?id=${encodeURIComponent(l.id)}">
    <span class="name"><span>${escapeHtml(l.title)} · ${escapeHtml(l.grader)} ${escapeHtml(l.grade)}</span><small>${escapeHtml(l.subtitle)}</small></span>
    <span class="muted small">Sold ${fmtDate(l.soldAt, { day: 'numeric', month: 'short' })}</span><b class="num">${fmtAUD(l.priceAUD)}</b></a></li>`).join('');
}

render();
renderHeatmap();
if (location.hash) {
  const row = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (row && !row.classList.contains('gated')) { row.scrollIntoView({ block: 'center' }); row.style.background = 'var(--case)'; }
}
