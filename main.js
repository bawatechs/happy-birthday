(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Fit the name so it can never be cropped ---------- */
  function fitName(el, max) {
    if (!el) return;
    el.style.fontSize = '';
    var box = el.parentElement, avail = box.clientWidth - 4;
    var w = el.getBoundingClientRect().width;
    var fs = parseFloat(getComputedStyle(el).fontSize);
    if (w > avail && w > 0) { fs = Math.floor(fs * avail / w * 0.97); el.style.fontSize = fs + 'px'; }
    if (max && fs > max) el.style.fontSize = max + 'px';
  }
  function fitAll() { fitName($('#welcomeName')); fitName($('#heroName')); }
  fitAll();
  window.addEventListener('resize', fitAll);
  window.addEventListener('orientationchange', function () { setTimeout(fitAll, 250); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
  window.addEventListener('load', fitAll);

  /* ---------- 2. Golden dust ---------- */
  var dust = $('#dust'), dctx = dust.getContext('2d'), P = [], dw, dh, dpr = Math.min(window.devicePixelRatio || 1, 2);
  function sizeDust() { dw = innerWidth; dh = innerHeight; dust.width = dw * dpr; dust.height = dh * dpr; dctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function mkP() { return { x: Math.random() * dw, y: Math.random() * dh, r: Math.random() * 1.6 + .4, vy: -(Math.random() * .18 + .05), vx: (Math.random() - .5) * .12, a: Math.random() * Math.PI * 2, s: Math.random() * .02 + .005 }; }
  function initDust() { sizeDust(); P = []; var n = dw < 600 ? 28 : 55; for (var i = 0; i < n; i++) P.push(mkP()); }
  function tickDust() {
    dctx.clearRect(0, 0, dw, dh);
    for (var i = 0; i < P.length; i++) {
      var p = P[i]; p.x += p.vx; p.y += p.vy; p.a += p.s;
      if (p.y < -10) { p.y = dh + 10; p.x = Math.random() * dw; }
      var o = .25 + Math.sin(p.a) * .25;
      dctx.beginPath(); dctx.fillStyle = 'rgba(236,205,140,' + Math.max(o, .05) + ')';
      dctx.shadowBlur = 8; dctx.shadowColor = 'rgba(216,180,106,.8)';
      dctx.arc(p.x, p.y, p.r, 0, 6.283); dctx.fill();
    }
    if (!document.hidden && !reduced) requestAnimationFrame(tickDust);
  }
  initDust(); tickDust();
  window.addEventListener('resize', initDust);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && !reduced) requestAnimationFrame(tickDust); });

  /* ---------- 3. Music + video ---------- */
  var audio = $('#bgm'), video = $('#heroVideo'), frame = $('.hero-frame');
  var musicBtn = $('#musicBtn'), toast = $('#musicToast');
  var wantPlaying = false;
  audio.loop = true; audio.volume = 0.85;

  function musicUI(state) {
    musicBtn.classList.toggle('on', state === 'playing');
    musicBtn.classList.toggle('blocked', state === 'blocked');
    musicBtn.setAttribute('aria-pressed', state === 'playing' ? 'true' : 'false');
    musicBtn.setAttribute('aria-label', state === 'playing' ? 'Pause music' : 'Play music');
    $('.music-label', musicBtn).textContent = state === 'playing' ? 'Playing' : (state === 'blocked' ? 'Tap to play' : 'Paused');
    toast.hidden = state !== 'blocked';
  }
  // The UI only claims "playing" when the browser confirms it.
  audio.addEventListener('playing', function () { musicUI('playing'); });
  audio.addEventListener('pause', function () { if (!audio.ended) musicUI('paused'); });
  audio.addEventListener('error', function () { musicUI('blocked'); $('#musicToast span').textContent = 'The song could not be loaded.'; });

  function playMusic() {
    var p;
    try { p = audio.play(); } catch (e) { musicUI('blocked'); return; }
    wantPlaying = true;
    if (p && p.catch) p.catch(function () { musicUI('blocked'); });
  }
  musicBtn.addEventListener('click', function () {
    if (audio.paused) { playMusic(); } else { wantPlaying = false; audio.pause(); }
  });
  $('#musicRetry').addEventListener('click', playMusic);

  // Resume if the phone paused audio when she switched apps and came back.
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && wantPlaying && audio.paused) {
      var p = audio.play(); if (p && p.catch) p.catch(function () { musicUI('blocked'); });
    }
  });

  // Video: always silent, independent of the music.
  function silence() { video.muted = true; video.defaultMuted = true; video.volume = 0; }
  silence();
  video.addEventListener('volumechange', function () { if (!video.muted || video.volume) silence(); });
  video.addEventListener('playing', function () { frame.classList.add('video-on'); });
  video.addEventListener('error', function () { frame.classList.add('video-failed'); });
  $('source', video).addEventListener('error', function () { frame.classList.add('video-failed'); });
  function startVideo() {
    silence();
    var p; try { p = video.play(); } catch (e) { return; }
    if (p && p.catch) p.catch(function () { /* poster stays visible; page remains fully usable */ frame.classList.add('video-failed'); });
  }
  // Pause the video when scrolled away to save battery and data.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!entered || frame.classList.contains('video-failed')) return;
        if (e.isIntersecting) { video.play().catch(function () {}); } else { video.pause(); }
      });
    }, { threshold: .1 }).observe(frame);
  }

  /* ---------- 4. Welcome → experience ---------- */
  var entered = false, welcome = $('#welcome'), exp = $('#experience');
  $('#enterBtn').addEventListener('click', function () {
    if (entered) return; entered = true;
    playMusic();              // runs inside the click so mobile browsers allow sound
    startVideo();
    musicBtn.hidden = false;
    welcome.classList.add('leaving');
    exp.removeAttribute('aria-hidden');
    document.body.classList.remove('locked');
    window.scrollTo(0, 0);
    setTimeout(function () { welcome.hidden = true; }, 1500);
    setTimeout(revealCheck, 200);
  });

  /* ---------- 5. Scroll reveal ---------- */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); if (e.target.closest('#celebrate') && !burstDone) { burstDone = true; burst(); } } });
  }, { threshold: .15 }) : null;
  var burstDone = false;
  $$('.reveal').forEach(function (el) { io ? io.observe(el) : el.classList.add('in'); });
  function revealCheck() { $$('.hero .reveal').forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- 6. Wish + sparks ---------- */
  var wishes = ['May this year be gentle, bright and entirely yours.', 'May every door you knock on open for you.', 'May you always feel as loved as you are.', 'May your laughter find you daily.'];
  var wi = 0;
  function burst(x, y) {
    if (reduced) return;
    var c = document.createElement('canvas'); c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60';
    var w = innerWidth, h = innerHeight; c.width = w; c.height = h; document.body.appendChild(c);
    var ctx = c.getContext('2d'), ps = [], cx = x == null ? w / 2 : x, cy = y == null ? h * .4 : y;
    for (var i = 0; i < 70; i++) { var a = Math.random() * 6.283, s = Math.random() * 4 + 1; ps.push({ x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, l: 1, r: Math.random() * 2 + 1 }); }
    (function f() {
      ctx.clearRect(0, 0, w, h); var alive = 0;
      ps.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.vy += .05; p.vx *= .99; p.l -= .012; if (p.l > 0) { alive++; ctx.fillStyle = 'rgba(236,205,140,' + p.l + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); } });
      if (alive) requestAnimationFrame(f); else c.remove();
    })();
  }
  $('#sparkBtn').addEventListener('click', function (e) {
    $('#wishText').textContent = wishes[wi++ % wishes.length];
    var r = e.currentTarget.getBoundingClientRect(); burst(r.left + r.width / 2, r.top);
  });

  /* ---------- 7. Gallery + viewer ---------- */
  var photos = [
    { src: 'assets/saudah-1.jpg', cap: 'Grace', alt: 'Saudah in a soft grey tee against a deep burgundy backdrop' },
    { src: 'assets/saudah-2.jpg', cap: 'Elegance', alt: 'Saudah standing in an emerald green dress' },
    { src: 'assets/saudah-3.jpg', cap: 'Warmth', alt: 'Saudah in a blue hijab and striped shirt' },
    { src: 'assets/saudah-4.jpg', cap: 'Light', alt: 'Saudah in a black and white photograph with small golden crescents' }
  ];
  var lb = $('#lightbox'), lbImg = $('#lbImg'), cur = 0, lastFocus = null;
  function show(i) {
    cur = (i + photos.length) % photos.length;
    lbImg.style.opacity = 0;
    lbImg.onload = function () { lbImg.style.opacity = 1; };
    lbImg.src = photos[cur].src; lbImg.alt = photos[cur].alt;
    $('#lbCap').textContent = photos[cur].cap + '  ·  ' + (cur + 1) + ' / ' + photos.length;
    var n = new Image(); n.src = photos[(cur + 1) % photos.length].src;
  }
  function openLb(i) { lastFocus = document.activeElement; lb.hidden = false; document.body.classList.add('locked'); show(i); $('#lbClose').focus(); }
  function closeLb() { lb.hidden = true; document.body.classList.remove('locked'); if (lastFocus) lastFocus.focus(); }
  $$('.card').forEach(function (b) { b.addEventListener('click', function () { openLb(+b.dataset.i); }); });
  $('#lbClose').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', function () { show(cur - 1); });
  $('#lbNext').addEventListener('click', function () { show(cur + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'FIGURE') closeLb(); });
  var tx = null;
  lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) { if (tx == null) return; var dx = e.changedTouches[0].clientX - tx; tx = null; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); });

  /* ---------- 8. Envelope + typing letter ---------- */
  var env = $('#envelope'), paper = $('#paper'), skipBtn = $('#skipLetter');
  var typeNodes = [], typeTimer = null, typing = false;
  function textNodes(root) {
    var out = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    while (w.nextNode()) { if (w.currentNode.nodeValue.trim()) out.push(w.currentNode); }
    return out;
  }
  function finishTyping() {
    clearTimeout(typeTimer); typing = false;
    typeNodes.forEach(function (o) { o.node.nodeValue = o.full; });
    var c = $('.caret', paper); if (c) c.remove();
    paper.style.minHeight = ''; skipBtn.hidden = true;
  }
  function startTyping() {
    paper.hidden = false;
    var nodes = textNodes(paper);
    typeNodes = nodes.map(function (n) { return { node: n, full: n.nodeValue }; });
    // reserve the final height first so the page never jumps while typing
    paper.style.minHeight = paper.offsetHeight + 'px';
    if (reduced) { skipBtn.hidden = true; return; }
    typeNodes.forEach(function (o) { o.node.nodeValue = ''; });
    var caret = document.createElement('span'); caret.className = 'caret'; caret.setAttribute('aria-hidden', 'true');
    var ni = 0, ci = 0; typing = true; skipBtn.hidden = false;
    setTimeout(function () { paper.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 120);
    (function step() {
      if (!typing) return;
      if (ni >= typeNodes.length) { finishTyping(); return; }
      var o = typeNodes[ni];
      if (ci === 0) o.node.parentNode.insertBefore(caret, o.node.nextSibling);
      ci++; o.node.nodeValue = o.full.slice(0, ci);
      var ch = o.full.charAt(ci - 1), d = 24;
      if (/[.!?]/.test(ch)) d = 260; else if (/[,;:]/.test(ch)) d = 130;
      if (ci >= o.full.length) { ni++; ci = 0; d = Math.max(d, 380); }
      typeTimer = setTimeout(step, d);
    })();
  }
  env.addEventListener('click', function () {
    if (env.classList.contains('open')) return;
    env.classList.add('open'); env.setAttribute('aria-expanded', 'true');
    setTimeout(function () { env.classList.add('done'); startTyping(); }, reduced ? 50 : 1100);
  });
  skipBtn.addEventListener('click', finishTyping);

  /* ---------- 9. Hidden surprises ---------- */
  var found = { stars: 0, heart: false, seal: false }, TOTAL = 7, UNLOCK_AT = 4; // <-- change UNLOCK_AT to make the final surprise easier or harder to unlock
  var dots = $$('#dots i'), starMsg = $('#starMsg'), finalBtn = $('#finalBtn'), hint = $('#finalHint');
  function count() { return found.stars + (found.heart ? 1 : 0) + (found.seal ? 1 : 0); }
  function update() {
    var n = count();
    dots.forEach(function (d, i) { d.classList.toggle('on', i < n); });
    $('#progressText').textContent = n + ' of ' + TOTAL + ' found';
    if (n >= UNLOCK_AT) {
      finalBtn.classList.remove('is-locked'); finalBtn.classList.add('ready'); finalBtn.setAttribute('aria-disabled', 'false');
      finalBtn.textContent = 'Open your final surprise'; hint.textContent = '';
    }
  }
  function say(t) { starMsg.textContent = t; starMsg.classList.remove('pop'); void starMsg.offsetWidth; starMsg.classList.add('pop'); }
  $$('.star').forEach(function (s) {
    s.addEventListener('click', function (e) {
      say(s.dataset.msg);
      if (!s.classList.contains('found')) { s.classList.add('found'); found.stars++; update(); var r = s.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2); }
    });
  });
  $('#goldHeart').addEventListener('click', function (e) {
    var h = e.currentTarget; say('You found the golden heart. Every day with you is gold.');
    if (!found.heart) { found.heart = true; h.classList.add('found'); update(); var r = h.getBoundingClientRect(); burst(r.left + r.width / 2, r.top); }
  });
  $('#sealBtn').addEventListener('click', function (e) {
    var b = e.currentTarget; if (b.classList.contains('broken')) return;
    b.classList.add('broken'); b.setAttribute('aria-expanded', 'true'); $('#sealedNote').hidden = false;
    found.seal = true; update();
    var r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + 30);
  });

  /* ---------- 10. Finale ---------- */
  var fin = $('#finale'), fc = $('#fireworks'), fctx = fc.getContext('2d'), fw = [], fRun = false, fTimer = null, fLast = null;
  function sizeFin() { fc.width = innerWidth; fc.height = innerHeight; }
  function launch() {
    var x = Math.random() * fc.width * .8 + fc.width * .1, y = Math.random() * fc.height * .5 + fc.height * .1, hue = 38 + Math.random() * 14;
    for (var i = 0; i < 46; i++) { var a = i / 46 * 6.283, s = Math.random() * 2.6 + 1.2; fw.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, l: 1, hue: hue }); }
  }
  function loopFin() {
    if (!fRun) return;
    fctx.fillStyle = 'rgba(11,5,7,.18)'; fctx.fillRect(0, 0, fc.width, fc.height);
    fw = fw.filter(function (p) { return p.l > 0; });
    fw.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.vy += .03; p.vx *= .985; p.vy *= .985; p.l -= .011; fctx.fillStyle = 'hsla(' + p.hue + ',70%,72%,' + p.l + ')'; fctx.beginPath(); fctx.arc(p.x, p.y, 1.7, 0, 6.283); fctx.fill(); });
    requestAnimationFrame(loopFin);
  }
  function openFinale() {
    lastFocus = document.activeElement; fin.hidden = false; document.body.classList.add('locked');
    // restart the staged text animation each time
    $$('.f-a,.f-b,.f-c,.f-d,.f-e', fin).forEach(function (el) { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; });
    $('#finaleClose').focus({ preventScroll: true });
    if (!reduced) { sizeFin(); fRun = true; fw = []; loopFin(); launch(); fTimer = setInterval(launch, 1500); }
    $('#replayBtn').hidden = false;
  }
  function closeFinale() { fin.hidden = true; fRun = false; clearInterval(fTimer); document.body.classList.remove('locked'); if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); }
  finalBtn.addEventListener('click', function () {
    if (count() < UNLOCK_AT) {
      finalBtn.classList.remove('shake'); void finalBtn.offsetWidth; finalBtn.classList.add('shake');
      var more = UNLOCK_AT - count();
      hint.textContent = 'Find ' + more + ' more ' + (more === 1 ? 'secret' : 'secrets') + ' to unlock this: tap the glowing stars, the tiny golden heart, or the sealed note.';
      return;
    }
    openFinale();
  });
  $('#replayBtn').addEventListener('click', openFinale);
  $('#finaleClose').addEventListener('click', closeFinale);
  window.addEventListener('resize', function () { if (!fin.hidden) sizeFin(); });

  document.addEventListener('keydown', function (e) {
    if (!lb.hidden) { if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); }
    else if (!fin.hidden && e.key === 'Escape') closeFinale();
  });
})();
