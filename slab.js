// slab.js: the lamp-and-tilt slab. Pointer tilt on desktop, gyroscope on phones, flip by button or scroll.
import { escapeHtml, fmtAUD, fmtDate, latest, cardArt } from './config.js';

export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (window.CSS?.registerProperty) {
  for (const [name, initialValue] of [['--lx', '50%'], ['--ly', '30%']]) {
    try { CSS.registerProperty({ name, syntax: '<percentage>', inherits: true, initialValue }); } catch {}
  }
}

export function setTilt(slab, x, y) {   // x,y in -1..1
  slab.style.setProperty('--ry', `${x * 12}deg`);
  slab.style.setProperty('--rx', `${-y * 10}deg`);
  slab.style.setProperty('--lx', `${50 + x * 40}%`);
  slab.style.setProperty('--ly', `${40 + y * 40}%`);
  slab.style.setProperty('--foil-angle', `${x * 120}deg`);
}

const label = l => `${l.title}, ${l.subtitle}, ${l.grader} ${l.grade}.`;

// back: 'data' (cert, pop, median, last sales), 'photo' (back image if there is one), or false (tile, no flip)
export function slabHTML(l, item, { back = 'data', eager = false } = {}) {
  const img = l.images?.front || cardArt(l);
  const backPhoto = back === 'photo' && l.images?.back;
  const sales = (item?.comps || []).slice(-3).reverse();
  const backFace = !back ? '' : `
    <div class="slab-face slab-back">${backPhoto ? `<img src="${escapeHtml(l.images.back)}" alt="">` : `
      <h3>${escapeHtml(l.grader)} ${escapeHtml(l.grade)} · back label</h3>
      <dl class="num">
        <div><dt>Cert</dt><dd>${escapeHtml(l.cert || '—')}</dd></div>
        <div><dt>Population</dt><dd>${item?.pop ? item.pop.toLocaleString('en-AU') : '—'}</dd></div>
        <div><dt>Graded higher</dt><dd>${item ? (item.popHigher ?? 0).toLocaleString('en-AU') : '—'}</dd></div>
        <div><dt>Market median</dt><dd>${fmtAUD(latest(item))}</dd></div>
      </dl>
      ${sales.length ? `<ul class="back-sales num">${sales.map(s => `<li><span>${fmtDate(s.date, { day: 'numeric', month: 'short' })} · ${escapeHtml(s.venue)}</span><b>${fmtAUD(s.aud)}</b></li>`).join('')}</ul>` : ''}`}
    </div>`;
  return `
  <figure class="slab" data-slab aria-label="${escapeHtml(label(l))}${back ? ' Use the button to turn it over.' : ''}">
    <div class="slab-body">
      <div class="slab-face slab-front">
        <div class="slab-label"><b>${escapeHtml(l.title)}</b><span>${escapeHtml(l.subtitle)}</span><span class="grade">${escapeHtml(l.grader)} ${escapeHtml(l.grade)}</span></div>
        <div class="zoom-host"><img src="${escapeHtml(img)}" alt="" ${eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'} decoding="async"></div>
        <i class="slab-foil"></i><i class="slab-lamp"></i>
      </div>${backFace}
    </div>
    ${back ? '<button class="btn btn-text slab-flip" type="button">Turn it over</button>' : ''}
  </figure>`;
}

// Binds flip and pointer tilt. `host` lets a tile's whole card drive the tilt.
export function initSlabs(root = document) {
  root.querySelectorAll('[data-slab]:not([data-bound])').forEach(slab => {
    slab.dataset.bound = '';
    const flip = slab.querySelector('.slab-flip');
    flip?.addEventListener('click', () => {
      slab.classList.toggle('is-flipped');
      flip.textContent = slab.classList.contains('is-flipped') ? 'Turn it back' : 'Turn it over';
    });
    if (reduce) return;
    const host = slab.closest('.tile') || slab;
    let frame = 0;
    host.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || slab.dataset.loupe) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = slab.getBoundingClientRect();
        slab.dataset.moving = '';
        setTilt(slab, Math.max(-1, Math.min(1, (e.clientX - r.left) / r.width * 2 - 1)),
                      Math.max(-1, Math.min(1, (e.clientY - r.top) / r.height * 2 - 1)));
      });
    });
    host.addEventListener('pointerleave', () => { cancelAnimationFrame(frame); delete slab.dataset.moving; setTilt(slab, 0, 0); });
  });
}

export const needsTiltPermission = () =>
  typeof window.DeviceOrientationEvent?.requestPermission === 'function';

// Gyroscope tilt, only while the slab is on screen. iOS needs a tap to grant permission first.
export async function enableTilt(slab) {
  if (reduce || !window.DeviceOrientationEvent || !matchMedia('(pointer: coarse)').matches) return false;
  if (needsTiltPermission()) {
    try { if (await DeviceOrientationEvent.requestPermission() !== 'granted') return false; } catch { return false; }
  }
  let queued = false;
  const onTilt = e => {
    if (queued || e.gamma == null) return;
    queued = true;
    requestAnimationFrame(() => {
      const x = Math.max(-1, Math.min(1, (e.gamma || 0) / 25));
      const y = Math.max(-1, Math.min(1, ((e.beta ?? 45) - 45) / 25));
      slab.dataset.moving = '';
      setTilt(slab, x, y);
      queued = false;
    });
  };
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) addEventListener('deviceorientation', onTilt);
    else removeEventListener('deviceorientation', onTilt);
  }).observe(slab);
  return true;
}

// The one orchestrated moment: the lamp sweeps across the slab on first load.
export function lampSweep(slab) {
  if (reduce || !slab || !window.CSS?.registerProperty) return;
  slab.animate([{ '--lx': '-10%' }, { '--lx': '110%' }], { duration: 900, easing: 'cubic-bezier(.2,.7,.2,1)' });
}

// Scrolling past `section` turns the slab over (0→180°).
export function scrollFlip(slab, section) {
  if (reduce) return;
  let frame = 0;
  const update = () => {
    const r = section.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, -r.top / (r.height * .45)));
    slab.style.setProperty('--scroll-flip', `${p * 180}deg`);
    if (p > 0 && p < 1) slab.dataset.moving = ''; else delete slab.dataset.moving;
  };
  addEventListener('scroll', () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); }, { passive: true });
  update();
}
