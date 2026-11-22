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

  // Menu sur téléphone
  var burger = document.querySelector('.burger'), menu = document.getElementById('menu');
  if (burger && menu) {
    var setMenu = function (o) {
      menu.classList.toggle('open', o);
      burger.setAttribute('aria-expanded', o ? 'true' : 'false');
      burger.setAttribute('aria-label', o ? 'Fermer le menu' : 'Ouvrir le menu');
    };
    burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); burger.focus(); } });
    document.addEventListener('click', function (e) { if (menu.classList.contains('open') && !e.target.closest('.top')) setMenu(false); });
  }

  // Formulaire : nom des fichiers choisis, limite de 10 Mo au total
  var form = document.getElementById('formulaire');
  if (form) {
    var msg = document.getElementById('file-msg');
    var inputs = form.querySelectorAll('input[type=file]');
    var MAX = 10 * 1024 * 1024;
    function check() {
      var total = 0;
      inputs.forEach(function (i) {
        var f = i.files && i.files[0], lab = i.closest('.file'), name = lab.querySelector('.file-name');
        lab.classList.toggle('has', !!f);
        name.textContent = f ? f.name : name.getAttribute('data-vide');
        if (f) total += f.size;
      });
      var ok = total <= MAX;
      msg.textContent = ok ? '' : 'Les fichiers pèsent ' + (total / 1048576).toFixed(1) + ' Mo. Le maximum est de 10 Mo au total : retirez un fichier ou envoyez-le par e-mail.';
      return ok;
    }
    inputs.forEach(function (i) { i.addEventListener('change', check); });
    var GAS = form.getAttribute('data-envoi');
    function lire(f) {
      return new Promise(function (ok, ko) {
        var r = new FileReader();
        r.onload = function () { ok({ name: f.name, type: f.type, data: String(r.result).split(',')[1] }); };
        r.onerror = ko; r.readAsDataURL(f);
      });
    }
    form.addEventListener('submit', function (e) {
      if (!check()) { e.preventDefault(); msg.scrollIntoView({ block: 'center' }); return; }
      var b = form.querySelector('button[type=submit]');
      b.disabled = true; b.querySelector('span').textContent = 'Envoi en cours…';
      if (!GAS || !window.fetch || !window.FileReader) return; // secours : envoi classique
      e.preventDefault();
      var d = {};
      form.querySelectorAll('input:not([type=file]):not([type=hidden]), select, textarea').forEach(function (i) { d[i.name] = i.value; });
      var fs = [];
      inputs.forEach(function (i) { if (i.files && i.files[0]) fs.push(lire(i.files[0])); });
      Promise.all(fs).then(function (fichiers) {
        d.fichiers = fichiers;
        return fetch(GAS, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(d) });
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (!j.ok) throw new Error(j.erreur || 'refus');
        window.location.href = 'merci.html';
      }).catch(function () {
        b.disabled = false; b.querySelector('span').textContent = 'Envoyer ma demande';
        msg.textContent = "L'envoi n'a pas abouti. Réessayez dans un instant ou écrivez-moi directement à info@jfcpro.org.";
        msg.scrollIntoView({ block: 'center' });
      });
    });
    window.addEventListener('pageshow', function () {
      var b = form.querySelector('button[type=submit]');
      b.disabled = false; b.querySelector('span').textContent = 'Envoyer ma demande';
    });
  }

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

/* Catalogue : bouton « Acheter » vers le lien Payrexx, sinon « Bientôt disponible » */
document.querySelectorAll("[data-paiement]").forEach(function (b) {
  var lien = b.getAttribute("data-paiement");
  if (lien) { b.href = lien; } else { b.classList.add("bientot"); b.setAttribute("aria-disabled", "true"); b.querySelector("span").textContent = "Bientôt disponible"; }
});
