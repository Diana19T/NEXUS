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

  /* Intro: pinned stage, progress p (0..1) over the scroll runway.
     0-.12 hold | .12-.62 "trends." -> "We create", "them." rises | .62-1 hold, then the pin releases */
  const intro = $('#intro');
  const l3o = $('.l3 .o', intro), l3i = $('.l3 .i', intro), l4 = $('.l4 > span', intro);
  const ez = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const seg = (v, a, b) => clamp((v - a) / (b - a));
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const updateIntro = () => {
    const r = intro.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - innerHeight));
    const s = reduce ? (p > .5 ? 1 : 0) : ez(seg(p, .12, .62));
    const s2 = reduce ? s : ez(seg(p, .2, .68));
    l3o.style.transform = `translateY(${-s * 105}%)`;
    l3i.style.transform = `translateY(${(1 - s) * 105}%)`;
    l4.style.transform = `translateY(${(1 - s2) * 105}%)`;
  };

  /* Approach: two-step swap. 0-.12 hold | .12-.42 line 1 | .36-.66 line 2 | .66-1 hold, then pin releases */
  const appr = $('#approach');
  const lines = $$('.mk', appr).map(m => ({ o: $('.o', m), i: $('.i', m) }));
  const steps = [[.12, .42], [.36, .66]];
  const updateApproach = () => {
    const r = appr.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - innerHeight));
    lines.forEach((l, n) => {
      const s = reduce ? (p > steps[n][0] + .15 ? 1 : 0) : ez(seg(p, steps[n][0], steps[n][1]));
      l.o.style.transform = `translateY(${-s * 105}%)`;
      l.i.style.transform = `translateY(${(1 - s) * 105}%)`;
    });
  };
  const updateSwaps = () => { updateIntro(); updateApproach(); };

  /* Pinned Selected Work: scroll progress -> float state s in [0, N-1] */
  const pin = $('#pin'), stage = $('#stage');
  const items = $$('.wk').map(w => ({ t: $('.wk-t', w), i: $('.wk-i', w) }));
  const N = items.length;
  let cur = 0, target = 0, G = {};

  /* Design px on a 1440 canvas: big 1037x692, small 315x188, gap 26 (kept constant while animating).
     Scaled by width; if the window is too short for the 692+26+188 stack, scaled down to fit. */
  const BW = 1037, BH = 692, SW = 315, SH = 188, GAP = 26;
  const measure = () => {
    const W = stage.clientWidth, H = stage.clientHeight;
    const k = Math.min(W / 1440, (H - 48) / (BH + GAP + SH));
    const bw = BW * k, bh = BH * k, sw = SW * k, sh = SH * k, gap = GAP * k;
    const a = (H - (bh + gap + sh)) / 2;
    G = { W, H, bw, bh, sw, sh, gap, a, R: W - W * 0.0125 };
    pin.style.height = ((N - 1) * 0.9 + 1) * H + 'px';
    readTarget(); render();
  };
  const readTarget = () => {
    const top = pin.getBoundingClientRect().top + scrollY;
    target = clamp((scrollY - top) / (pin.offsetHeight - G.H)) * (N - 1);
  };

  /* Items form one vertical chain: every item's top = previous item's bottom + gap. */
  const render = () => {
    const { bw, bh, sw, sh, gap, a, R } = G;
    const n0 = Math.floor(cur), f = cur - n0;
    let y = a - f * (bh + gap);                       // top of the exiting/current item
    items.forEach((it, n) => {
      let w = sw, h = sh, op = 0;
      if (n < n0) { w = bw; h = bh; }
      else if (n === n0) { w = bw; h = bh; op = 1 - clamp((f - 0.5) * 2); }
      else if (n === n0 + 1) { w = lerp(sw, bw, f); h = lerp(sh, bh, f); op = 1; }
      else if (n === n0 + 2) { op = f; }
      if (n >= n0) {
        it.i.style.width = w + 'px'; it.i.style.height = h + 'px';
        it.i.style.transform = `translate3d(${R - w}px,${y}px,0)`;
        it.t.style.transform = `translate3d(0,${y}px,0)`;
        y += h + gap;
      }
      it.i.style.opacity = it.t.style.opacity = op;
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
