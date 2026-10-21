const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

if (!reduceMotion && 'IntersectionObserver' in window) document.documentElement.classList.add('js-motion');

/* ============ MENU ============ */
function initMenu() {
  const toggle = $('.menu-toggle');
  const menu = $('#menu');
  const set = open => {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };
  toggle.addEventListener('click', () => set(!menu.classList.contains('open')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
}

/* ============ HEADER + PROGRESSO + NAV ATIVA ============ */
function initScroll() {
  const header = $('.site-header');
  const bar = $('.progress span');
  const road = $('.road-photo img');
  let ticking = false;
  const update = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle('scrolled', y > 40);
    bar.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    if (road && !reduceMotion) {
      const r = road.parentElement.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) road.style.setProperty('--py', `${((r.top + r.height / 2) / innerHeight - .5) * -40}px`);
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();

  // cada item do menu cobre um grupo de seções (data-group); fora deles nada fica ativo
  const links = $$('#menu a[data-nav]');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const group = en.target.dataset.group || '';
      links.forEach(a => a.classList.toggle('active', a.dataset.nav === group));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section').forEach(s => spy.observe(s));
}

/* ============ PLAYER SPOTIFY + WHATSAPP ============ */
function initDock() {
  const fab = $('#spFab'), panel = $('#spPanel'), frame = $('#spFrame');
  const all = $('#spAll'), name = $('#spName');
  const ARTIST = 'artist/0bSp1Zl0WBFRTnrzJkaLvL';
  const PQP = 'album/7z36uyEYP1cjDok4PmiLds';
  let current = '';

  const open = (path, label) => {
    if (path !== current) {
      const f = document.createElement('iframe');
      f.src = `https://open.spotify.com/embed/${path}?utm_source=generator&theme=0`;
      f.height = path === ARTIST ? 352 : 152;
      f.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
      f.loading = 'lazy';
      f.title = `Spotify: ${label}`;
      frame.replaceChildren(f);
      current = path;
    }
    name.textContent = label;
    all.textContent = path === ARTIST ? 'Ouvir PQP' : 'Todas as músicas';
    all.dataset.spotify = path === ARTIST ? PQP : ARTIST;
    all.dataset.name = path === ARTIST ? 'PQP · lançamento' : 'Grupo Portal Gaúcho';
    panel.hidden = false;
    fab.setAttribute('aria-expanded', 'true');
  };
  const close = () => { panel.hidden = true; fab.setAttribute('aria-expanded', 'false'); };

  // PQP é sempre a primeira faixa do player
  fab.addEventListener('click', () => panel.hidden ? open(current || PQP, current ? name.textContent : 'PQP · lançamento') : close());
  $('#spClose').addEventListener('click', () => {
    close();
    try { localStorage.setItem('pg-spotify-visto', '1'); } catch (e) {}
  });

  // uma vez por visitante, o player abre sozinho com PQP depois que a pessoa sai do topo
  let seen = false;
  try { seen = localStorage.getItem('pg-spotify-visto') === '1'; } catch (e) {}
  // só no desktop (no celular cobriria a tela) e se recolhe sozinho se a pessoa não mexer nele
  let touched = false;
  panel.addEventListener('pointerenter', () => { touched = true; });
  panel.addEventListener('focusin', () => { touched = true; });
  if (!seen && window.matchMedia('(min-width: 900px)').matches) {
    new IntersectionObserver(([en], obs) => {
      if (en.isIntersecting || !panel.hidden) return;
      obs.disconnect();
      if ($('dialog[open]') || $('#menu.open')) return;
      open(PQP, 'PQP · lançamento');
      try { localStorage.setItem('pg-spotify-visto', '1'); } catch (e) {}
      setTimeout(() => { if (!touched) close(); }, 12000);
    }, { threshold: 0 }).observe($('.hero'));
  }
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-spotify]');
    if (btn) open(btn.dataset.spotify, btn.dataset.name || 'Portal Gaúcho');
  });

  // o rótulo "Contratar show" aparece uma vez, sozinho, para mostrar o que é o botão verde
  const wa = $('.wa-fab');
  setTimeout(() => { wa.classList.add('hint'); setTimeout(() => wa.classList.remove('hint'), 3500); }, 4000);
}

/* ============ REVEAL + TÍTULOS EM PALAVRAS + CONTADORES ============ */
function initReveal() {
  $$('.split').forEach(el => {
    let wi = 0;
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const inner = document.createElement('span');
            inner.style.setProperty('--wi', wi++);
            inner.textContent = part;
            w.append(inner);
            frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') walk(child);
      });
    };
    walk(el);
  });

  const counters = new Set($$('[data-count]'));
  const runCounter = el => {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    const fmt = v => v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
    if (reduceMotion) { el.textContent = fmt(target); return; }
    const t0 = performance.now(), dur = 1800;
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = fmt(target * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (!document.documentElement.classList.contains('js-motion')) {
    counters.forEach(runCounter);
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      if (counters.has(el)) { runCounter(el); counters.delete(el); }
      else el.classList.add('visible');
      io.unobserve(el);
    });
  }, { threshold: .18, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal, .split').forEach(el => io.observe(el));
  counters.forEach(el => io.observe(el));
}

/* ============ HERO: FAÍSCAS + PARALLAX ============ */
function initHero() {
  const canvas = $('.sparks');
  const band = $('.hero-band img');
  const hero = $('.hero');
  if (reduceMotion || !canvas) return;

  const ctx = canvas.getContext('2d');
  let w, h, dpr, sparks = [], running = true;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.width = hero.clientWidth * dpr;
    h = canvas.height = hero.clientHeight * dpr;
  };
  const spawn = () => ({
    x: Math.random() * w, y: h + Math.random() * h * .3,
    r: (Math.random() * 2.2 + .6) * dpr,
    vy: (Math.random() * 1.2 + .5) * dpr, vx: (Math.random() - .5) * .6 * dpr,
    life: 0, max: 220 + Math.random() * 260,
    hue: Math.random() < .55 ? 45 : 8
  });
  resize();
  const count = innerWidth < 700 ? 40 : 90;
  for (let i = 0; i < count; i++) { const s = spawn(); s.y = Math.random() * h; sparks.push(s); }
  const frame = () => {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    sparks.forEach((s, i) => {
      s.life++; s.y -= s.vy; s.x += s.vx + Math.sin(s.life / 30) * .3 * dpr;
      const a = Math.max(0, 1 - s.life / s.max);
      ctx.beginPath();
      ctx.fillStyle = `hsla(${s.hue},100%,${s.hue > 30 ? 55 : 52}%,${a * .9})`;
      ctx.shadowBlur = 12 * dpr; ctx.shadowColor = `hsla(${s.hue},100%,50%,${a})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      if (a <= 0 || s.y < -20) sparks[i] = spawn();
    });
    requestAnimationFrame(frame);
  };
  new IntersectionObserver(([en]) => {
    const was = running; running = en.isIntersecting;
    if (running && !was) requestAnimationFrame(frame);
  }).observe(hero);
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);

  if (finePointer && band) {
    hero.addEventListener('pointermove', e => {
      const x = (e.clientX / innerWidth - .5) * 2, y = (e.clientY / innerHeight - .5) * 2;
      band.style.setProperty('--mx', `${x * -18}px`);
      band.style.setProperty('--my', `${y * -12}px`);
    });
  }
}

/* ============ CARDS 3D + BOTÕES MAGNÉTICOS ============ */
function initTilt() {
  if (reduceMotion || !finePointer) return;
  $$('.tilt').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${y * -10}deg) translateY(-6px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
  $$('.magnetic').forEach(btn => {
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`;
    });
    btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
  });
}

/* ============ MODAL DE VÍDEO ============ */
const embed = id => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
function makeFrame(id, title) {
  const f = document.createElement('iframe');
  f.src = embed(id);
  f.title = title;
  f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  
  return f;
}
function initVideoModal() {
  const dlg = $('#videoModal');
  const frame = $('#videoFrame');
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-video]');
    if (!btn) return;
    const id = btn.dataset.video, title = btn.dataset.title || 'Portal Gaúcho';
    stopStage();
    pauseRelease();
    $('#videoTitle').textContent = title;
    $('#videoExternal').href = 'https://www.youtube.com/watch?v=' + id;
    frame.replaceChildren(makeFrame(id, title));
    dlg.showModal();
  });
  $('[data-close]', dlg).addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => frame.replaceChildren());
}

/* ============ LANÇAMENTO: PQP TOCANDO DE CARA ============ */
// navegadores só deixam o vídeo começar sozinho se estiver mudo; o botão "Ativar som" libera o áudio
let pauseRelease = () => {};
function initRelease() {
  const screen = $('#releaseScreen');
  const sound = $('#releaseSound');
  const saveData = navigator.connection && navigator.connection.saveData;
  if (reduceMotion || saveData) return;

  const ID = 'Lom0mEJsFmM';
  const send = (func, args = []) => {
    const f = $('iframe', screen);
    if (f) f.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
  };
  pauseRelease = () => send('pauseVideo');

  const start = () => {
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${ID}?autoplay=1&mute=1&loop=1&playlist=${ID}&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
    f.title = 'PQP — Portal Gaúcho';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    
    // mantém o pôster por baixo até o player carregar
    f.style.opacity = '0';
    f.addEventListener('load', () => { f.style.transition = 'opacity .6s'; f.style.opacity = '1'; sound.hidden = false; });
    screen.append(f);
  };
  sound.addEventListener('click', () => {
    send('unMute'); send('setVolume', [90]); send('playVideo');
    sound.hidden = true;
  });
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}

/* ============ CLIPES: PALCO + CARROSSEL ============ */
let stopStage = () => {};
function initClips() {
  const rail = $('#clipRail');
  const cards = $$('.clip-card', rail);
  const screen = $('#stage');
  const info = $('.stage-info');
  let current = 0;

  const showPoster = () => {
    if (!$('#stagePoster', screen)) {
      const p = document.createElement('button');
      p.className = 'poster'; p.id = 'stagePoster';
      p.setAttribute('aria-label', 'Assistir ao clipe selecionado');
      p.innerHTML = '<img id="stageImg" alt="" width="960" height="540"><span class="play-disc" aria-hidden="true"></span>';
      p.addEventListener('click', play);
      screen.replaceChildren(p);
    }
    const c = cards[current];
    $('#stageImg').src = $('img', c).src;
  };
  const play = () => {
    pauseRelease();
    const c = cards[current];
    screen.replaceChildren(makeFrame(c.dataset.id, c.dataset.name + ' — Portal Gaúcho'));
  };
  stopStage = () => { if ($('iframe', screen)) showPoster(); };

  const select = (i, autoplay) => {
    current = (i + cards.length) % cards.length;
    const c = cards[current];
    cards.forEach(k => k.classList.toggle('current', k === c));
    $('#stageIndex').textContent = String(current + 1).padStart(2, '0');
    $('#stageTitle').textContent = c.dataset.name;
    $('#stageMeta').textContent = c.dataset.meta;
    $('#stageViews').textContent = c.dataset.views;
    $('#stageYt').href = 'https://www.youtube.com/watch?v=' + c.dataset.id;
    info.classList.remove('swap'); screen.classList.remove('swap');
    void info.offsetWidth;
    info.classList.add('swap'); screen.classList.add('swap');
    if (autoplay) play(); else showPoster();
    rail.scrollTo({ left: c.offsetLeft - rail.offsetLeft - 8, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  $('#stageTotal').textContent = String(cards.length).padStart(2, '0');
  $('#stagePoster').addEventListener('click', play);
  cards.forEach((c, i) => c.addEventListener('click', () => { if (!rail.dragged) select(i, true); }));
  $$('[data-step]').forEach(b => b.addEventListener('click', () => select(current + Number(b.dataset.step), !!$('iframe', screen))));
  cards[0].classList.add('current');

  // setas + arrastar
  const prev = $('.rail-arrow.prev'), next = $('.rail-arrow.next');
  const edges = () => {
    const end = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
    prev.disabled = rail.scrollLeft < 4; next.disabled = end;
    rail.classList.toggle('at-end', end);
  };
  $$('[data-rail]').forEach(b => b.addEventListener('click', () => rail.scrollBy({ left: rail.clientWidth * .85 * Number(b.dataset.rail) })));
  rail.addEventListener('scroll', edges, { passive: true });
  edges();
  dragScroll(rail);
}

function dragScroll(el) {
  let down = false, startX = 0, startLeft = 0;
  el.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || el.closest('.pinned')) return;
    down = true; el.dragged = false; startX = e.clientX; startLeft = el.scrollLeft;
  });
  window.addEventListener('pointermove', e => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 6) { el.dragged = true; el.classList.add('dragging'); }
    if (el.dragged) el.scrollLeft = startLeft - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!down) return;
    down = false; el.classList.remove('dragging');
    setTimeout(() => { el.dragged = false; }, 0);
  });
}

/* ============ DISCOGRAFIA: COVERFLOW ============ */
function initCoverflow() {
  const root = $('#coverflow');
  const items = $$('.cf-item', root);
  const dots = $('#cfDots');
  const caption = $('.cf-caption');
  let index = 0, timer;

  items.forEach((_, i) => {
    const d = document.createElement('button');
    d.setAttribute('aria-label', `Ir para o disco ${i + 1}`);
    d.addEventListener('click', () => go(i));
    dots.append(d);
  });

  const layout = () => {
    const step = Math.min(innerWidth * .16, 190);
    items.forEach((el, i) => {
      const o = i - index, a = Math.abs(o);
      el.classList.toggle('active', o === 0);
      el.style.zIndex = 100 - a;
      el.style.opacity = a > 4 ? 0 : 1;
      el.style.pointerEvents = a > 4 ? 'none' : '';
      el.style.filter = o === 0 ? 'none' : `brightness(${Math.max(.35, 1 - a * .18)})`;
      el.style.transform = o === 0
        ? 'translateX(0) translateZ(80px) rotateY(0)'
        : `translateX(${o * step + Math.sign(o) * 60}px) translateZ(${-a * 90}px) rotateY(${o > 0 ? -48 : 48}deg)`;
      el.tabIndex = o === 0 ? 0 : -1;
    });
    $$('button', dots).forEach((d, i) => d.classList.toggle('on', i === index));
    $('#cfTitle').textContent = items[index].dataset.title;
    $('#cfMeta').textContent = items[index].dataset.meta;
    caption.classList.remove('swap'); void caption.offsetWidth; caption.classList.add('swap');
  };
  const go = i => { index = Math.max(0, Math.min(items.length - 1, i)); layout(); };
  const auto = () => {
    clearInterval(timer);
    if (reduceMotion) return;
    timer = setInterval(() => go(index === items.length - 1 ? 0 : index + 1), 3800);
  };

  items.forEach((el, i) => {
    el.target = '_blank'; el.rel = 'noopener noreferrer';
    el.addEventListener('click', e => {
      if (root.dragged || i !== index) { e.preventDefault(); if (!root.dragged) go(i); }
    });
  });
  $$('[data-cf]', root).forEach(b => b.addEventListener('click', () => { go(index + Number(b.dataset.cf)); auto(); }));
  root.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { go(index + 1); auto(); }
    if (e.key === 'ArrowLeft') { go(index - 1); auto(); }
  });

  // arrastar / swipe
  const stage = $('.cf-stage', root);
  let sx = null;
  stage.addEventListener('pointerdown', e => { sx = e.clientX; root.dragged = false; });
  stage.addEventListener('pointermove', e => { if (sx !== null && Math.abs(e.clientX - sx) > 10) root.dragged = true; });
  stage.addEventListener('pointerup', e => {
    if (sx === null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 40) { go(index + (dx < 0 ? 1 : -1)); auto(); }
    setTimeout(() => { root.dragged = false; }, 0);
  });
  stage.addEventListener('pointercancel', () => { sx = null; });

  root.addEventListener('pointerenter', () => clearInterval(timer));
  root.addEventListener('pointerleave', auto);
  new IntersectionObserver(([en]) => en.isIntersecting ? auto() : clearInterval(timer)).observe(root);
  window.addEventListener('resize', layout);
  layout();
}

/* ============ LINHA DO TEMPO HORIZONTAL (fixada no scroll) ============ */
function initTimeline() {
  const tl = $('.timeline');
  const track = $('.timeline-track', tl);
  const fill = $('.timeline-fill', tl);
  const desktop = window.matchMedia('(min-width: 900px)');
  let distance = 0;

  const measure = () => {
    const pin = desktop.matches && !reduceMotion;
    tl.classList.toggle('pinned', pin);
    track.style.transform = '';
    if (!pin) { tl.style.removeProperty('--pin-h'); return; }
    distance = Math.max(0, track.scrollWidth - innerWidth);
    tl.style.setProperty('--pin-h', `${innerHeight + distance}px`);
    update();
  };
  const update = () => {
    const r = tl.getBoundingClientRect();
    const total = tl.offsetHeight - innerHeight;
    const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
    if (tl.classList.contains('pinned')) track.style.transform = `translate3d(${-p * distance}px,0,0)`;
    else {
      const vis = Math.min(1, Math.max(0, (innerHeight - r.top) / (r.height + innerHeight * .3)));
      fill.style.setProperty('--tp', vis.toFixed(3));
      return;
    }
    fill.style.setProperty('--tp', p.toFixed(3));
  };
  window.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  measure();

  // no celular a trilha vira carrossel com arraste
  dragScroll(tl.querySelector('.timeline-sticky'));
}

/* ============ GALERIA: LIGHTBOX ============ */
function initLightbox() {
  const tiles = $$('#mosaic .tile');
  const lb = $('#lightbox');
  const img = $('#lbImg');
  let i = 0;
  const show = n => {
    i = (n + tiles.length) % tiles.length;
    const t = tiles[i];
    img.src = t.dataset.full;
    img.alt = $('img', t).alt;
  };
  tiles.forEach((t, n) => t.addEventListener('click', () => { show(n); lb.showModal(); }));
  $$('[data-lb]', lb).forEach(b => b.addEventListener('click', () => show(i + Number(b.dataset.lb))));
  $('[data-close]', lb).addEventListener('click', () => lb.close());
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') show(i + 1);
    if (e.key === 'ArrowLeft') show(i - 1);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initMenu();
  initScroll();
  initReveal();
  initHero();
  initTilt();
  initVideoModal();
  initClips();
  initCoverflow();
  initTimeline();
  initLightbox();
  initDock();
  initRelease();
  $('#year').textContent = new Date().getFullYear();
});
