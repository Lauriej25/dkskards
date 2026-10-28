// loupe.js: round magnifier that follows the cursor over the slab image (desktop only).
export function loupe(img, zoom = 2.5, size = 180) {
  const host = img.parentElement, slab = img.closest('[data-slab]');
  const lens = Object.assign(document.createElement('div'), { className: 'loupe' });
  lens.setAttribute('aria-hidden', 'true');
  host.append(lens);
  img.addEventListener('pointerenter', e => {
    if (e.pointerType !== 'mouse' || !slab) return;
    // Hold the slab still while inspecting so the lens lines up with the image.
    slab.dataset.loupe = 'on';
    delete slab.dataset.moving;
    ['--rx', '--ry'].forEach(p => slab.style.setProperty(p, '0deg'));
  });
  img.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const r = img.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    Object.assign(lens.style, {
      display: 'block', left: `${img.offsetLeft + x - size / 2}px`, top: `${img.offsetTop + y - size / 2}px`,
      backgroundImage: `url("${img.currentSrc || img.src}")`,
      backgroundSize: `${r.width * zoom}px ${r.height * zoom}px`,
      backgroundPosition: `${-x * zoom + size / 2}px ${-y * zoom + size / 2}px`
    });
  });
  img.addEventListener('pointerleave', () => {
    lens.style.display = 'none';
    if (slab) delete slab.dataset.loupe;
  });
}
