// home.js: the viewing room.
import { boot, qs, ICONS, tileHTML, railArrows, mailto } from './app.js';
import { featured, forSale, inventoryFor, change, heat, latest, fmtAUD, pctText, dirClass, escapeHtml, spark } from './config.js';
import { slabHTML, initSlabs, enableTilt, needsTiltPermission, lampSweep, scrollFlip } from './slab.js';

const cfg = await boot('home');
const email = cfg.settings.contactEmail;

/* 1. Hero */
const hero = featured(cfg);
if (hero) {
  const item = inventoryFor(cfg, hero), c30 = change(item, 30);
  qs('#heroStage').innerHTML = `
    ${slabHTML(hero, item, { eager: true })}
    <div class="hero-stats num">
      <a class="price" href="card.html?id=${encodeURIComponent(hero.id)}" style="text-decoration:none">Our price<b>${fmtAUD(hero.priceAUD)}</b></a>
      <span>30 days<b class="${dirClass(c30)}">${pctText(c30)}</b></span>
      <span>Population<b>${item?.pop ? item.pop.toLocaleString('en-AU') : '—'}</b></span>
    </div>
    <button class="btn btn-text tilt-prompt" type="button" hidden>${escapeHtml(cfg.copy.tiltPrompt)}</button>`;
  const slab = qs('#heroStage [data-slab]');
  initSlabs(qs('#heroStage'));
  lampSweep(slab);
  scrollFlip(slab, qs('#hero'));
  if (needsTiltPermission()) {
    const prompt = qs('#heroStage .tilt-prompt');
    prompt.hidden = false;
    prompt.addEventListener('click', async () => { if (await enableTilt(slab)) prompt.hidden = true; });
  } else enableTilt(slab);
} else {
  qs('#heroStage').innerHTML = `<p class="muted">New slabs are being photographed. <a href="#hunt">Start a Card Hunt</a> in the meantime.</p>`;
}

/* 2. On the table */
const rail = qs('#rail');
const onTable = forSale(cfg).sort((a, b) => (b.listedAt || '').localeCompare(a.listedAt || ''));
rail.innerHTML = onTable.length ? onTable.map(l => tileHTML(cfg, l)).join('')
  : `<p class="muted">Nothing on the table right now. <a href="#hunt">Ask us to hunt one down.</a></p>`;
initSlabs(rail);
qs('#railPrev').innerHTML = ICONS.left;
qs('#railNext').innerHTML = ICONS.right;
railArrows(rail, qs('#railPrev'), qs('#railNext'));

const drop = (cfg.drops || []).filter(d => Date.parse(d.date) > Date.now()).sort((a, b) => a.date.localeCompare(b.date))[0];
if (drop) {
  const when = new Date(drop.date).toLocaleString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Sydney', timeZoneName: 'short' });
  const note = qs('#dropNote');
  note.hidden = false;
  note.innerHTML = `Next drop: ${escapeHtml(drop.title)}, ${escapeHtml(when)}. <a href="#" id="dropIcs">Add to calendar</a>`;
  qs('#dropIcs').addEventListener('click', e => { e.preventDefault(); downloadIcs(drop); });
}

function downloadIcs(d) {
  const stamp = t => new Date(t).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DKsKards//Drops//EN', 'BEGIN:VEVENT',
    `UID:${stamp(d.date)}@dkskards`, `DTSTAMP:${stamp(Date.now())}`, `DTSTART:${stamp(d.date)}`,
    `DTEND:${stamp(Date.parse(d.date) + 36e5)}`, `SUMMARY:DKsKards: ${d.title}`, `URL:${location.origin}${location.pathname.replace(/[^/]*$/, '')}shop.html`,
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })), download: 'dkskards-drop.ics' });
  a.click();
  URL.revokeObjectURL(a.href);
}

/* 3. Grade ladder */
const ladderCards = (cfg.listings || []).filter(l => l.ladder?.length >= 2).slice(0, 3);
const pick = qs('#ladderPick');
pick.innerHTML = ladderCards.map((l, i) =>
  `<button class="chip" type="button" aria-pressed="${i === 0}" data-i="${i}">${escapeHtml(l.title)}</button>`).join('');
function renderLadder(l) {
  const max = Math.max(...l.ladder.map(r => r[1]));
  qs('#ladder').innerHTML = l.ladder.map(([g, p], i) => {
    const mult = i ? `<em>×${(p / l.ladder[i - 1][1]).toFixed(1)}</em>` : '';
    const own = g === `${l.grader} ${l.grade}`;
    return `<li${own ? ' aria-current="true"' : ''} style="height:${Math.round(72 + 96 * Math.sqrt(p / max))}px"><span>${escapeHtml(g)}${own ? ' · ours' : ''}</span><b>${fmtAUD(p)}</b>${mult}</li>`;
  }).join('');
}
if (ladderCards.length) {
  renderLadder(ladderCards[0]);
  pick.addEventListener('click', e => {
    const b = e.target.closest('[data-i]');
    if (!b) return;
    pick.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c === b));
    renderLadder(ladderCards[b.dataset.i]);
  });
} else qs('#ladder').closest('section').hidden = true;

/* 4. What's moving */
const ranked = (cfg.inventory || []).map(i => ({ i, c: change(i, 30), h: heat(i) })).filter(r => r.c != null);
const moverRow = r => `<li><a href="market.html#${encodeURIComponent(r.i.id)}">
  <span class="name"><span>${escapeHtml(r.i.name)}</span><small>${escapeHtml(r.i.grader)} ${escapeHtml(r.i.grade)} · ${fmtAUD(latest(r.i))}</small></span>
  ${spark(r.i, 30, 72, 24)}<b class="chg num ${dirClass(r.c)}">${pctText(r.c)}</b></a></li>`;
const hot = [...ranked].sort((a, b) => b.c - a.c).filter(r => r.c > 0).slice(0, 3);
const cold = [...ranked].sort((a, b) => a.c - b.c).filter(r => r.c < 0).slice(0, 3);
qs('#movers').innerHTML = `
  <div><h3><span class="up" aria-hidden="true">▲</span> Hot</h3><ul class="mover-list">${hot.map(moverRow).join('') || '<li class="muted">Nothing rising this month.</li>'}</ul></div>
  <div><h3><span class="down" aria-hidden="true">▼</span> Cold</h3><ul class="mover-list">${cold.map(moverRow).join('') || '<li class="muted">Nothing falling this month.</li>'}</ul></div>`;

/* 5. Card Hunt */
const { huntPrice, auditPrice, sourcingRates } = cfg.settings;
qs('#huntPriceNote').textContent = `A$${huntPrice}, report in 48–72 hours.`;
qs('#briefTerms').textContent = `A$${huntPrice}, report in 48–72 hours. We confirm before you pay.`;
const brief = qs('#briefForm'), more = qs('#briefMore');
brief.addEventListener('input', () => { more.hidden = false; }, { once: true });
brief.addEventListener('submit', e => {
  e.preventDefault();
  more.hidden = false;
  const f = Object.fromEntries(new FormData(brief));
  const missing = ['budget', 'target', 'email'].find(k => !f[k]?.trim() || (k === 'email' && !brief.email.checkValidity()));
  const out = qs('#briefConfirm');
  if (missing) {
    out.hidden = false;
    out.style.borderColor = 'var(--loss)';
    out.textContent = { budget: 'Add your budget so we can scope the hunt.', target: 'Tell us the card, set or character you’re after.', email: 'Add an email so we can send the report.' }[missing];
    brief[missing].focus();
    return;
  }
  const budget = f.budget.replace(/[^\d.]/g, '');
  location.href = mailto(email, `Card Hunt brief: ${f.target}`,
    `I have A$${Number(budget).toLocaleString('en-AU')} to spend on ${f.target}.\nI want it ${f.form} and plan to hold it for ${f.hold}.\nReach me at ${f.email}.\n`);
  out.hidden = false;
  out.style.borderColor = '';
  out.textContent = `${cfg.copy.huntConfirm} Your email app should have opened with the brief ready to send.`;
});

qs('#reportCardBody').innerHTML = (cfg.reportCards || []).map(r =>
  `<tr><td>${escapeHtml(r.card)}</td><td>${escapeHtml(r.grade)}</td><td class="n">${fmtAUD(r.median)}</td><td><span class="tag tag-lamp">${escapeHtml(r.call)}</span></td><td class="muted">${escapeHtml(r.note)}</td></tr>`).join('');

qs('#auditPrice').textContent = `A$${auditPrice}`;
qs('#auditLink').href = mailto(email, 'Portfolio audit', 'Hi, I’d like a portfolio audit. My collection list is attached.\n');

const calc = qs('#calcValue');
const renderCalc = () => {
  const v = Number(calc.value), fee = v * sourcingRates.free;
  qs('#calcOut').innerHTML = `<span>Card value ${fmtAUD(v)} → fee <b>${fmtAUD(fee)}</b></span>
    <span class="muted small">${(sourcingRates.free * 100).toFixed(1).replace('.0', '')}% standard · ${(sourcingRates.collector * 100).toFixed(1)}% for Collector members (${fmtAUD(v * sourcingRates.collector)})</span>`;
};
calc.addEventListener('input', renderCalc);
renderCalc();

/* 6. Membership */
const tiers = cfg.membership?.tiers || [], features = cfg.membership?.features || [];
let billing = 'monthly';
function priceLine(t) {
  if (!t.priceMonthly) return `A$0 <small>forever</small>`;
  if (billing === 'yearly' && t.priceYearly) return `A$${t.priceYearly} <small>a year</small>`;
  return `${t.from ? '<small>from </small>' : ''}A$${t.priceMonthly} <small>a month</small>`;
}
function renderTiers() {
  qs('#tiers').innerHTML = tiers.map((t, n) => {
    const perks = features.filter(f => f[n + 1]).map(f => escapeHtml(f[n + 1] === '✓' ? f[0] : `${f[0]}: ${f[n + 1]}`));
    const href = t.link || mailto(email, `Membership: ${t.name}`, `Hi, I’d like to join DKsKards ${t.name} (${billing}).\n`);
    return `<article class="tier panel${t.highlight ? ' highlight' : ''}${n === shown ? ' is-shown' : ''}" id="tier-${escapeHtml(t.id)}" role="tabpanel" aria-label="${escapeHtml(t.name)}">
      <h3>${escapeHtml(t.name)}</h3>
      <p class="tier-price num">${priceLine(t)}</p>
      <p class="muted small">${escapeHtml(t.blurb || '')}</p>
      <ul>${perks.map(p => `<li>${p}</li>`).join('')}</ul>
      <a class="btn ${t.highlight ? 'btn-lamp' : 'btn-line'}" href="${escapeHtml(href)}"${t.link ? ' rel="noopener"' : ''}>${t.priceMonthly ? `Join ${escapeHtml(t.name)}` : 'Get the free email'}</a>
    </article>`;
  }).join('');
}
let shown = Math.max(0, tiers.findIndex(t => t.highlight));
const sw = qs('#tierSwitch');
sw.innerHTML = tiers.map((t, n) => `<button class="chip" type="button" role="tab" aria-selected="${n === shown}" aria-controls="tier-${escapeHtml(t.id)}" data-n="${n}">${escapeHtml(t.name)}</button>`).join('');
sw.addEventListener('click', e => {
  const b = e.target.closest('[data-n]');
  if (!b) return;
  shown = Number(b.dataset.n);
  sw.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-selected', c === b));
  renderTiers();
});
document.querySelectorAll('[data-billing]').forEach(b => b.addEventListener('click', () => {
  billing = b.dataset.billing;
  document.querySelectorAll('[data-billing]').forEach(x => x.setAttribute('aria-pressed', x === b));
  renderTiers();
}));
renderTiers();
qs('#compare').innerHTML = `<thead><tr><th scope="col"><span class="sr-only">Feature</span></th>${tiers.map(t => `<th scope="col">${escapeHtml(t.name)}</th>`).join('')}</tr></thead>
  <tbody>${features.map(f => `<tr><th scope="row" style="font-weight:450">${escapeHtml(f[0])}</th>${f.slice(1).map(c => `<td>${c ? escapeHtml(c) : '<span class="sr-only">Not included</span><span aria-hidden="true">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody>`;

/* 7. Check a cert */
const LOOKUP = {
  PSA: n => `https://www.psacard.com/cert/${n}`,
  CGC: n => `https://www.cgccards.com/certlookup/${n}/`,
  BGS: () => 'https://www.beckett.com/grading/card-lookup'
};
qs('#verifyForm').addEventListener('submit', e => {
  e.preventDefault();
  const grader = qs('#vGrader').value, n = qs('#vCert').value.replace(/\s/g, '');
  const out = qs('#verifyOut');
  if (!/^\d{6,12}$/.test(n)) {
    out.innerHTML = `<p class="down">${escapeHtml(cfg.copy.certError)}</p>`;
    return;
  }
  const ours = (cfg.listings || []).find(l => l.cert === n && l.grader === grader);
  out.innerHTML = `
    ${ours ? `<p class="panel" style="padding:16px;margin-bottom:12px"><span class="verified">${ICONS.check.replace('<svg', '<svg width="18" height="18"')} In our stock:</span> <a href="card.html?id=${encodeURIComponent(ours.id)}">${escapeHtml(ours.title)}, ${escapeHtml(ours.grader)} ${escapeHtml(ours.grade)}</a> (${ours.status === 'sold' ? 'sold' : fmtAUD(ours.priceAUD)})</p>` : ''}
    <p><a class="btn btn-line" href="${LOOKUP[grader](n)}" target="_blank" rel="noopener">Open ${grader}’s record for ${escapeHtml(n)} ↗</a></p>
    <p class="muted small" style="margin-top:8px">The grader’s own database is the final word. Match the label, the card and the photo on their record.${grader === 'BGS' ? ' Beckett’s lookup opens on their search page; paste the number there.' : ''}</p>`;
});
