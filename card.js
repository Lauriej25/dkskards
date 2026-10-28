// card.js: the lot. Gallery with loupe, price block, sales scatter, grade ladder, notes, provenance.
import { boot, qs, ICONS, tileHTML, railArrows, mailto, wireDialog } from './app.js';
import { inventoryFor, forSale, change, salesIn, latest, median, fmtAUD, pctText, dirClass, escapeHtml, fmtDate, cardArt } from './config.js';
import { slabHTML, initSlabs } from './slab.js';
import { loupe } from './loupe.js';

const cfg = await boot('shop');
const id = new URLSearchParams(location.search).get('id');
const l = (cfg.listings || []).find(x => x.id === id);
const root = qs('#lot');

const CERT_URL = { PSA: n => `https://www.psacard.com/cert/${n}`, CGC: n => `https://www.cgccards.com/certlookup/${n}/` };

if (!l) {
  document.body.classList.remove('is-lot');
  root.innerHTML = `<div class="empty-state" style="padding-block:var(--s-9)">
    <h1>We couldn't find that slab</h1><p class="muted">It may have sold, or the link is out of date.</p>
    <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center"><a class="btn btn-lamp" href="shop.html">Browse the slabs</a><a class="btn btn-line" href="index.html#hunt">Ask us to hunt one down</a></div></div>`;
} else render();

function render() {
  const item = inventoryFor(cfg, l), sold = l.status === 'sold';
  const c30 = change(item, 30), med = latest(item);
  const name = `${l.title}, ${l.subtitle}`, gradeText = `${l.grader} ${l.grade}`;
  document.title = `${l.title} ${gradeText} · DKsKards`;
  const certUrl = l.cert && CERT_URL[l.grader]?.(encodeURIComponent(l.cert));

  root.innerHTML = `
  <div class="lot">
    <div class="gallery">
      <div id="stage">${slabHTML(l, item, { back: 'photo', eager: true })}</div>
      <div class="edge-view panel" id="edgeView" hidden>${l.images?.edge ? `<img src="${escapeHtml(l.images.edge)}" alt="Edge of the slab">` : '<p>No edge photo for this slab yet. Ask us and we’ll send one.</p>'}</div>
      <div class="chips gallery-tabs" role="group" aria-label="View">
        <button class="chip" type="button" aria-pressed="true" data-view="front">Front</button>
        <button class="chip" type="button" aria-pressed="false" data-view="back">Back</button>
        <button class="chip" type="button" aria-pressed="false" data-view="edge">Edge</button>
      </div>
      <p class="muted small" id="zoomHint"></p>
    </div>

    <div class="lot-info">
      <div>
        ${l.sample ? '<span class="tag" style="margin-bottom:12px">Sample listing</span>' : ''}
        <h1>${escapeHtml(l.title)}</h1>
        <p class="lot-sub">${escapeHtml(l.subtitle)} · ${escapeHtml(gradeText)}</p>
      </div>
      <p class="cert-line num">
        <span>Cert ${escapeHtml(l.cert || '—')}</span>
        ${l.certVerified ? `<span class="verified">${ICONS.check.replace('<svg', '<svg width="16" height="16"')} Checked by us</span>` : ''}
        ${certUrl ? `<a href="${certUrl}" target="_blank" rel="noopener">See it on ${escapeHtml(l.grader)} ↗</a>` : ''}
      </p>
      <div>
        <p class="lot-price num">${sold ? 'Sold' : fmtAUD(l.priceAUD)}</p>
        ${med ? `<p class="muted num" style="margin-top:8px">Market median ${fmtAUD(med)}</p>` : ''}
      </div>
      <dl class="facts num">
        <div class="panel"><dt>30 days</dt><dd class="${dirClass(c30)}">${pctText(c30)}</dd></div>
        <div class="panel"><dt>Population</dt><dd>${item?.pop ? item.pop.toLocaleString('en-AU') : '—'}</dd></div>
        <div class="panel"><dt>Graded higher</dt><dd>${item ? (item.popHigher ?? 0).toLocaleString('en-AU') : '—'}</dd></div>
      </dl>
      <div class="lot-actions">
        ${sold ? `<a class="btn btn-lamp" href="index.html#hunt">Ask us to find another</a>`
               : `<button class="btn btn-lamp" type="button" data-buy="buy"${l.status === 'on_hold' ? ' disabled style="opacity:.6"' : ''}>${l.status === 'on_hold' ? 'On hold' : 'Buy this slab'}</button>`}
        <button class="btn btn-text" type="button" data-buy="question">Ask a question</button>
      </div>
      <p class="muted small">${escapeHtml(cfg.copy.buyNote)} Prices include GST where applicable.${l.onlyCopy && !sold ? ` ${escapeHtml(cfg.copy.onlyCopy)}.` : ''}</p>
    </div>
  </div>

  ${item?.comps?.length ? `
  <section class="lot-section" aria-labelledby="salesTitle">
    <div class="section-head" style="margin-bottom:0">
      <h2 id="salesTitle">Recent sales</h2>
      <div class="chips" role="group" aria-label="Time range" id="range">
        <button class="chip" type="button" aria-pressed="false" data-days="30">30d</button>
        <button class="chip" type="button" aria-pressed="true" data-days="90">90d</button>
        <button class="chip" type="button" aria-pressed="false" data-days="365">1y</button>
      </div>
    </div>
    <p class="chart-summary num" id="salesSummary"></p>
    <div class="chart-box"><canvas id="sales" role="img" aria-label="Recent sales for ${escapeHtml(l.title)} ${escapeHtml(gradeText)}"></canvas></div>
    <p class="chart-note">Each dot is one sale of a ${escapeHtml(gradeText)} copy; the line is the market median. ${escapeHtml(cfg.copy.disclaimer)}</p>
  </section>` : ''}

  ${l.ladder?.length ? `
  <section class="lot-section" aria-labelledby="ladderTitle">
    <h2 id="ladderTitle">Grade ladder</h2>
    <p class="muted" style="margin-bottom:var(--s-4)">This card at each grade, from recent sales.</p>
    <ol class="ladder num" aria-label="Prices by grade">${ladderHTML(l)}</ol>
  </section>` : ''}

  ${l.notes || l.provenance?.length ? `
  <section class="lot-section two-col">
    ${l.notes ? `<div><h2>Our notes</h2><p class="read">${escapeHtml(l.notes)}</p></div>` : '<div></div>'}
    ${l.provenance?.length ? `<div><h2>Provenance</h2><ol class="timeline" style="margin-top:var(--s-4)">${l.provenance.map(p => `<li><time>${escapeHtml(p.date)}</time>${escapeHtml(p.event)}</li>`).join('')}</ol></div>` : ''}
  </section>` : ''}

  <section class="lot-section" aria-labelledby="similarTitle" id="similarWrap">
    <div class="section-head">
      <h2 id="similarTitle">Similar slabs</h2>
      <div class="rail-arrows"><button class="icon-btn" type="button" id="simPrev" aria-label="Previous">${ICONS.left}</button><button class="icon-btn" type="button" id="simNext" aria-label="Next">${ICONS.right}</button></div>
    </div>
    <div class="rail" id="similar" tabindex="0" aria-label="Similar slabs"></div>
  </section>

  <div class="buybar" role="region" aria-label="Buy">
    <div class="num"><b>${sold ? 'Sold' : fmtAUD(l.priceAUD)}</b><small>All-in, insured shipping</small></div>
    ${sold ? '<a class="btn btn-lamp" href="index.html#hunt">Find another</a>'
           : `<button class="btn btn-lamp" type="button" data-buy="buy"${l.status === 'on_hold' ? ' disabled style="opacity:.6"' : ''}>${l.status === 'on_hold' ? 'On hold' : 'Buy this slab'}</button>`}
  </div>

  <dialog class="sheet" id="buySheet" aria-labelledby="buyTitle"></dialog>
  <dialog class="viewer" id="viewer" aria-label="Zoomed photo">
    <button class="icon-btn" type="button" data-close aria-label="Close">${ICONS.close}</button>
    <div class="viewer-scroll"><img alt="${escapeHtml(name)}, zoomed"></div>
  </dialog>`;

  initGallery();
  initBuy(item);
  if (item?.comps?.length) initSales(item);
  renderSimilar(item);
}

function ladderHTML(l) {
  const max = Math.max(...l.ladder.map(r => r[1]));
  return l.ladder.map(([g, p], i) => {
    const own = g === `${l.grader} ${l.grade}`;
    return `<li${own ? ' aria-current="true"' : ''} style="height:${Math.round(72 + 96 * Math.sqrt(p / max))}px"><span>${escapeHtml(g)}${own ? ' · this slab' : ''}</span><b>${fmtAUD(p)}</b>${i ? `<em>×${(p / l.ladder[i - 1][1]).toFixed(1)}</em>` : ''}</li>`;
  }).join('');
}

/* ---------- gallery ---------- */
function initGallery() {
  const slab = qs('#stage [data-slab]'), img = qs('.slab-front img', slab);
  initSlabs(qs('#stage'));
  const touch = matchMedia('(pointer: coarse)').matches;
  qs('#zoomHint').textContent = touch ? 'Tap the card to zoom. Double-tap to zoom closer.' : 'Hover the card to look through the loupe.';
  if (!touch) loupe(img);

  const tabs = document.querySelectorAll('[data-view]');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.setAttribute('aria-pressed', x === t));
    const v = t.dataset.view;
    qs('#stage').hidden = v === 'edge';
    qs('#edgeView').hidden = v !== 'edge';
    slab.classList.toggle('is-flipped', v === 'back');
  }));

  const viewer = qs('#viewer'), vImg = qs('img', viewer);
  wireDialog(viewer);
  slab.addEventListener('click', e => {
    if (!touch || e.target.closest('button')) return;
    const back = slab.classList.contains('is-flipped');
    vImg.src = back ? (l.images?.back || l.images?.front || cardArt(l)) : (l.images?.front || cardArt(l));
    viewer.classList.remove('zoomed');
    viewer.showModal();
  });
  let lastTap = 0;
  vImg.addEventListener('click', () => {
    const now = Date.now();
    if (now - lastTap < 320) viewer.classList.toggle('zoomed');
    lastTap = now;
  });
  vImg.addEventListener('dblclick', () => viewer.classList.toggle('zoomed'));
}

/* ---------- buy / ask sheet ---------- */
function initBuy() {
  const sheet = qs('#buySheet'), email = cfg.settings.contactEmail;
  wireDialog(sheet);
  const open = mode => {
    const checkout = mode === 'buy' && l.buyLink;
    sheet.innerHTML = `
      <div class="sheet-head"><h2 id="buyTitle" style="font-size:1.25rem">${mode === 'buy' ? 'Buy this slab' : 'Ask a question'}</h2>
        <button class="icon-btn" type="button" data-close aria-label="Close">${ICONS.close}</button></div>
      <form class="sheet-body" id="buyForm" novalidate>
        <div class="panel" style="padding:14px 16px;display:flex;justify-content:space-between;gap:12px">
          <span>${escapeHtml(l.title)}<br><small class="muted">${escapeHtml(l.subtitle)} · ${escapeHtml(l.grader)} ${escapeHtml(l.grade)} · cert ${escapeHtml(l.cert || '—')}</small></span>
          <b class="num" style="color:var(--lamp-ink)">${fmtAUD(l.priceAUD)}</b>
        </div>
        ${checkout ? `
          <p class="muted">${escapeHtml(cfg.copy.buyNote)} Payment is handled securely by our payment provider. We confirm dispatch by email.</p>
          <a class="btn btn-lamp" href="${escapeHtml(l.buyLink)}" rel="noopener">Continue to secure checkout</a>
          <button class="btn btn-text" type="button" data-mode="question">Ask a question first</button>` : `
          <label class="field"><span>Your name</span><input class="input" name="name" autocomplete="name" required></label>
          <label class="field"><span>Email</span><input class="input" name="email" type="email" autocomplete="email" required></label>
          <label class="field"><span>${mode === 'buy' ? 'Anything we should know? (delivery suburb, timing)' : 'Your question'}</span>
            <textarea class="input" name="msg"${mode === 'question' ? ' required' : ''}></textarea></label>
          <p class="muted small">${mode === 'buy' ? `We’ll hold the slab for 24 hours and email a payment link. ${escapeHtml(cfg.copy.buyNote)}` : 'We usually reply within one business day.'}</p>
          <p class="down small" id="buyErr" role="alert" hidden></p>
          <button class="btn btn-lamp" type="submit">${mode === 'buy' ? 'Send my order request' : 'Send question'}</button>`}
      </form>`;
    sheet.querySelector('[data-mode]')?.addEventListener('click', () => open('question'));
    sheet.querySelector('#buyForm').addEventListener('submit', e => {
      e.preventDefault();
      const f = e.target, err = qs('#buyErr', sheet);
      const bad = [...f.querySelectorAll('[required]')].find(i => !i.value.trim() || !i.checkValidity());
      if (bad) { err.hidden = false; err.textContent = bad.name === 'email' ? 'Add a valid email so we can reply.' : 'Fill in the highlighted field.'; bad.focus(); return; }
      const subject = `${mode === 'buy' ? 'Order request' : 'Question'}: ${l.title} ${l.grader} ${l.grade} (cert ${l.cert || '—'})`;
      const body = `${mode === 'buy' ? `I'd like to buy ${l.title} ${l.grader} ${l.grade}, listed at ${fmtAUD(l.priceAUD)}.` : `About ${l.title} ${l.grader} ${l.grade}:`}\n\n${f.msg.value}\n\n${f.name.value}\n${f.email.value}\n${location.href}`;
      location.href = mailto(email, subject, body);
      f.innerHTML = `<p class="brief-confirm">Your email app should have opened with the message ready. Send it and we’ll reply within one business day.</p><button class="btn btn-line" type="button" data-close>Done</button>`;
    });
    sheet.showModal();
  };
  document.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => open(b.dataset.buy)));
}

/* ---------- sales scatter ---------- */
function initSales(item) {
  let days = 90, chart;
  const draw = () => {
    const since = Date.now() - days * 864e5;
    const comps = item.comps.filter(c => Date.parse(c.date) >= since);
    const hist = item.history.filter(p => Date.parse(p.t) >= since);
    const n = salesIn(item, days), c = change(item, days);
    const label = days === 365 ? 'the last year' : `${days} days`;
    qs('#salesSummary').textContent = n
      ? `${n} ${n === 1 ? 'sale' : 'sales'} in ${label}, median sale ${fmtAUD(median(comps.map(x => x.aud)))}, market median ${c == null ? 'flat' : `${c >= 0 ? 'up' : 'down'} ${Math.abs(c).toFixed(1)}%`}.`
      : `No recorded sales in ${label}. Market median ${fmtAUD(latest(item))}.`;
    if (!window.Chart) {
      qs('.chart-box').innerHTML = `<ul class="mover-list num">${comps.slice(-8).reverse().map(s => `<li style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--edge)"><span>${fmtDate(s.date)} · ${escapeHtml(s.venue)}</span><b>${fmtAUD(s.aud)}</b></li>`).join('')}</ul>`;
      return;
    }
    const css = getComputedStyle(document.documentElement), tok = n => css.getPropertyValue(n).trim();
    chart?.destroy();
    chart = new Chart(qs('#sales'), {
      data: { datasets: [
        { type: 'scatter', label: 'Sales', data: comps.map(s => ({ x: Date.parse(s.date), y: s.aud, venue: s.venue })),
          pointRadius: 5, pointHoverRadius: 7, backgroundColor: tok('--acrylic'), borderWidth: 0 },
        { type: 'line', label: 'Median', data: hist.map(p => ({ x: Date.parse(p.t), y: p.aud })),
          borderColor: tok('--lamp'), borderWidth: 2, pointRadius: 0, tension: .3 }
      ]},
      options: {
        parsing: false, maintainAspectRatio: false, animation: false,
        interaction: { mode: 'nearest', intersect: true },
        scales: {
          x: { type: 'linear', min: since, max: Date.now(), grid: { color: tok('--edge') }, border: { color: tok('--edge') },
               ticks: { color: tok('--steel'), maxTicksLimit: 6, callback: v => new Date(v).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) } },
          y: { grid: { color: tok('--edge') }, border: { display: false },
               ticks: { color: tok('--steel'), callback: v => 'A$' + v.toLocaleString('en-AU') } }
        },
        plugins: {
          legend: { labels: { color: tok('--steel'), usePointStyle: true, boxHeight: 6 } },
          tooltip: { callbacks: {
            title: items => fmtDate(items[0].parsed.x),
            label: c => c.dataset.type === 'scatter' ? `${fmtAUD(c.parsed.y)} · ${c.raw.venue}` : `Median ${fmtAUD(c.parsed.y)}`
          } }
        }
      }
    });
  };
  qs('#range').addEventListener('click', e => {
    const b = e.target.closest('[data-days]');
    if (!b) return;
    days = Number(b.dataset.days);
    qs('#range').querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === b));
    draw();
  });
  document.addEventListener('themechange', draw);
  draw();
}

/* ---------- similar ---------- */
function renderSimilar(item) {
  const others = forSale(cfg).filter(x => x.id !== l.id)
    .sort((a, b) => (inventoryFor(cfg, b)?.era === item?.era) - (inventoryFor(cfg, a)?.era === item?.era))
    .slice(0, 8);
  if (!others.length) { qs('#similarWrap').hidden = true; return; }
  const rail = qs('#similar');
  rail.innerHTML = others.map(x => tileHTML(cfg, x)).join('');
  initSlabs(rail);
  railArrows(rail, qs('#simPrev'), qs('#simNext'));
}
