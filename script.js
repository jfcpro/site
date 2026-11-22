/* jfcpro.org : animations légères, sans dépendance. Le site reste lisible sans ce script. */
(function () {
  'use strict';
  var root = document.documentElement;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var top = document.querySelector('.top');
  var hero = document.querySelector('.hero');
  var steps = document.querySelector('.steps');
  var contact = document.querySelector('.contact');

  // Apparition des éléments au défilement
  var items = document.querySelectorAll('[data-r]');
  if (calm || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
    // Sécurité : rien ne reste caché si l'observateur ne se déclenche pas
    setTimeout(function () {
      items.forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in'); });
    }, 2500);
  }

  // Compteur « 35 ans »
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (calm || !target) return;
    var t0 = null;
    el.textContent = '0';
    function tick(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0 - 900) / 1500);
      if (k > 0) el.textContent = String(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(tick); else el.textContent = String(target);
    }
    requestAnimationFrame(tick);
  });

  // Défilement : en-tête, barre de progression, anneau, ligne de la démarche
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY || 0;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (top) top.classList.toggle('scrolled', y > 40);
    root.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : '0');
    if (calm) return;
    if (hero && y < window.innerHeight * 1.2) hero.style.setProperty('--sy', String(Math.round(y * 0.35)));
    if (steps) {
      var r = steps.getBoundingClientRect();
      var k = (window.innerHeight * 0.62 - r.top) / r.height;
      steps.style.setProperty('--sp', Math.max(0, Math.min(1, k)).toFixed(3));
    }
    if (contact) {
      var c = contact.getBoundingClientRect();
      if (c.top < window.innerHeight && c.bottom > 0) contact.style.setProperty('--cr', ((window.innerHeight - c.top) * 0.03).toFixed(2));
    }
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // Accroche : la lueur dorée et l'anneau suivent le pointeur
  if (hero && !calm && window.matchMedia('(hover: hover)').matches) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, yy = (e.clientY - r.top) / r.height;
      hero.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      hero.style.setProperty('--my', (yy * 100).toFixed(1) + '%');
      hero.style.setProperty('--px', (x - 0.5).toFixed(3));
      hero.style.setProperty('--py', (yy - 0.5).toFixed(3));
    });
  }
})();
