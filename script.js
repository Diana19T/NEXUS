(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* Kyiv clock */
  const clock = $('#clock');
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Kyiv', hour: '2-digit', minute: '2-digit', hour12: false });
  const tick = () => (clock.textContent = 'KYIV ' + fmt.format(new Date()));
  tick(); setInterval(tick, 20000);

  /* Page load + scroll reveal */
  $$('.hero .rv').forEach((el, i) => (el.style.transitionDelay = i * 0.1 + 's'));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  $$('.rv').forEach(el => io.observe(el));

  /* Subtle cursor parallax on images */
  $$('[data-par]').forEach(el => {
    const inner = $('.ph-in', el);
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect(), k = Math.min(28, r.width * 0.05);
      inner.style.setProperty('--px', -((e.clientX - r.left) / r.width - 0.5) * k + 'px');
      inner.style.setProperty('--py', -((e.clientY - r.top) / r.height - 0.5) * k + 'px');
    });
    el.addEventListener('pointerleave', () => { inner.style.setProperty('--px', '0px'); inner.style.setProperty('--py', '0px'); });
  });

  /* Scroll-driven text swap (intro + approach) */
  const swaps = $$('.swap').map(el => {
    const a = $('.s-a', el), b = $('.s-b', el);
    return { el, a, b, base: parseFloat(getComputedStyle(a).opacity) };
  });
  const updateSwaps = () => {
    const vh = innerHeight;
    swaps.forEach(({ el, a, b, base }) => {
      const r = el.getBoundingClientRect();
      const f = clamp((vh * 0.62 - (r.top + r.height / 2)) / (vh * 0.3));
      a.style.opacity = base * (1 - f);
      a.style.transform = `translateY(${-f * 3}rem)`;
      a.style.filter = `blur(${f * 8}px)`;
      b.style.opacity = base * f;
      b.style.transform = `translateY(${(1 - f) * 3}rem)`;
      b.style.filter = `blur(${(1 - f) * 8}px)`;
    });
  };

  /* Pinned Selected Work: scroll progress -> float state s in [0, N-1] */
  const pin = $('#pin'), stage = $('#stage');
  const items = $$('.wk').map(w => ({ t: $('.wk-t', w), i: $('.wk-i', w) }));
  const N = items.length;
  let cur = 0, target = 0, G = {};

  const measure = () => {
    const W = stage.clientWidth, H = stage.clientHeight;
    const bw = Math.min(W * 0.7194, (H - 96) / 0.86), bh = bw / 1.6;
    const sw = bw * 0.306, sh = sw / 1.63, gap = bw * 0.024;
    const a = (H - (bh + gap + sh)) / 2;
    G = { W, H, bw, bh, sw, sh, a, b: a + bh + gap, R: W - W * 0.0125 };
    pin.style.height = ((N - 1) * 0.9 + 1) * H + 'px';
    readTarget(); render();
  };
  const readTarget = () => {
    const top = pin.getBoundingClientRect().top + scrollY;
    target = clamp((scrollY - top) / (pin.offsetHeight - G.H)) * (N - 1);
  };

  const render = () => {
    const { H, bw, bh, sw, sh, a, b, R } = G;
    items.forEach((it, n) => {
      const d = n - cur;
      let w, h, y, op = 1;
      if (d >= 1) {                    // waiting below, enters into slot B
        const k = clamp(d - 1);
        w = sw; h = sh; y = b + k * (H - b + 20); op = 1 - k;
      } else if (d >= 0) {             // small -> big, slot B -> slot A
        const e = 1 - d;
        w = lerp(sw, bw, e); h = lerp(sh, bh, e); y = lerp(b, a, e);
      } else {                         // leaves upward
        const k = clamp(-d);
        w = bw; h = bh; y = a - k * (bh + a + 40); op = 1 - clamp((k - 0.5) * 2);
      }
      it.i.style.width = w + 'px'; it.i.style.height = h + 'px';
      it.i.style.transform = `translate3d(${R - w}px,${y}px,0)`;
      it.i.style.opacity = op;
      it.t.style.transform = `translate3d(0,${y}px,0)`;
      it.t.style.opacity = op;
      const on = op > 0.05;
      it.i.style.pointerEvents = it.t.style.pointerEvents = on ? '' : 'none';
      it.i.style.visibility = it.t.style.visibility = on ? '' : 'hidden';
    });
  };

  let raf = 0;
  const loop = () => {
    cur += (target - cur) * 0.12;
    if (Math.abs(target - cur) < 0.0004) cur = target;
    render();
    raf = cur === target ? 0 : requestAnimationFrame(loop);
  };
  const onScroll = () => { updateSwaps(); readTarget(); if (!raf) raf = requestAnimationFrame(loop); };

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { measure(); updateSwaps(); });
  addEventListener('load', () => { measure(); updateSwaps(); });
  measure(); updateSwaps();
})();
