/* Ohr HaTzaddik 5787 landing page interactions (no dependencies). */
(function () {
  'use strict';
  window.ohReady = true;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function revealAll(nodes) {
    for (var i = 0; i < nodes.length; i++) nodes[i].classList.add('is-in');
  }

  /* ---- Split the Hebrew verse into words for a staggered reveal ---- */
  var splits = document.querySelectorAll('[data-split]');
  for (var s = 0; s < splits.length; s++) {
    var el = splits[s];
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    for (var w = 0; w < words.length; w++) {
      var span = document.createElement('span');
      span.className = 'oh-word';
      span.style.setProperty('--w', w);
      span.textContent = words[w];
      el.appendChild(span);
      if (w < words.length - 1) el.appendChild(document.createTextNode(' '));
    }
  }

  /* ---- Scroll reveal ---- */
  var revealEls = document.querySelectorAll('.oh-reveal, [data-split], .oh-places li, .oh-row');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealAll(revealEls);
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        // Also reveal anything already scrolled past (e.g. reload mid-page).
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    for (var r = 0; r < revealEls.length; r++) io.observe(revealEls[r]);
  }

  /* ---- Feature spine fills as you scroll through the rows ---- */
  var rows = document.getElementById('oh-rows');
  var spineTicking = false;
  function updateSpine() {
    spineTicking = false;
    var rect = rows.getBoundingClientRect();
    var p = (window.innerHeight * 0.6 - rect.top) / rect.height;
    rows.style.setProperty('--oh-p', Math.max(0, Math.min(1, p)).toFixed(3));
  }
  if (rows && !reduceMotion) {
    updateSpine();
    window.addEventListener('scroll', function () {
      if (!spineTicking) { spineTicking = true; window.requestAnimationFrame(updateSpine); }
    }, { passive: true });
    window.addEventListener('resize', updateSpine);
  }

  if (reduceMotion) return;

  /* ---- Hero book: mouse tilt + scroll parallax ---- */
  var hero = document.getElementById('oh-hero');
  var tilt = document.getElementById('oh-book-tilt');
  var heroBg = hero ? hero.querySelector('.oh-hero-bg') : null;
  var rotX = 0, rotY = 0, scrollY = 0, ticking = false;

  function applyHero() {
    ticking = false;
    if (tilt) {
      tilt.style.transform = 'translate3d(0,' + (scrollY * 0.12).toFixed(1) + 'px,0) rotateX(' + rotX.toFixed(2) + 'deg) rotateY(' + rotY.toFixed(2) + 'deg)';
      tilt.style.setProperty('--oh-shine', (50 - rotY * 5).toFixed(1) + '%');
    }
    if (heroBg) heroBg.style.transform = 'translate3d(0,' + (scrollY * 0.3).toFixed(1) + 'px,0)';
  }
  function requestHero() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(applyHero); }
  }

  if (hero && tilt) {
    if (finePointer) {
      hero.addEventListener('mousemove', function (e) {
        var rect = tilt.getBoundingClientRect();
        var dx = (e.clientX - (rect.left + rect.width / 2)) / window.innerWidth;
        var dy = (e.clientY - (rect.top + rect.height / 2)) / window.innerHeight;
        rotY = Math.max(-1, Math.min(1, dx * 2)) * 14;
        rotX = Math.max(-1, Math.min(1, dy * 2)) * -10;
        requestHero();
      });
      hero.addEventListener('mouseleave', function () { rotX = 0; rotY = 0; requestHero(); });
    }
    window.addEventListener('scroll', function () {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      if (y < window.innerHeight * 1.2) { scrollY = y; requestHero(); }
    }, { passive: true });
  }

  /* ---- Rising embers / motes of light ---- */
  var canvas = document.getElementById('oh-embers');
  if (!canvas || !canvas.getContext || !hero) return;
  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, particles = [], running = false, rafId = null;

  function resize() {
    W = hero.offsetWidth; H = hero.offsetHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var target = Math.round(Math.min(90, Math.max(30, W / 16)));
    while (particles.length < target) particles.push(makeParticle(true));
    particles.length = target;
  }

  function makeParticle(anywhere) {
    return {
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : H + 10,
      r: Math.random() * 1.8 + 0.4,
      vy: Math.random() * 0.45 + 0.15,
      vx: (Math.random() - 0.5) * 0.2,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.02 + 0.005,
      alpha: Math.random() * 0.6 + 0.25,
      flicker: Math.random() * 0.05 + 0.01
    };
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.sway += p.swaySpeed;
      p.y -= p.vy;
      p.x += p.vx + Math.sin(p.sway) * 0.3;
      var life = Math.min(1, p.y / (H * 0.9));
      var a = p.alpha * life * (0.75 + Math.sin(p.sway * 3) * 0.25);
      if (p.y < -10 || a <= 0.01) { particles[i] = makeParticle(false); continue; }
      var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
      g.addColorStop(0, 'rgba(255,226,160,' + a + ')');
      g.addColorStop(0.35, 'rgba(240,160,60,' + (a * 0.5) + ')');
      g.addColorStop(1, 'rgba(217,115,28,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
      ctx.fill();
    }
    rafId = window.requestAnimationFrame(frame);
  }

  function start() { if (!running) { running = true; rafId = window.requestAnimationFrame(frame); } }
  function stop() { running = false; if (rafId) window.cancelAnimationFrame(rafId); }

  resize();
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  // Only animate while the hero is on screen and the tab is visible.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !document.hidden) start(); else stop();
    }).observe(hero);
  } else {
    start();
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else if (hero.getBoundingClientRect().bottom > 0) start();
  });
})();
