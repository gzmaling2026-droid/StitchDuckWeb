/* Language menu: English (default) / 简体中文 / 繁體中文.
 * Every language has its own URL — / for English, /zh-hans/ and /zh-hant/ — and
 * the menu entries are ordinary links between them. English is what everyone
 * gets first: the browser language is never sniffed, and only an explicit
 * choice is remembered. A visitor who picked Chinese and later arrives at an
 * English URL is sent on to the same page in their language; a Chinese URL is
 * always shown as asked for. Loaded synchronously in <head> so that hop happens
 * before anything paints. Without JS the popover stays shut and the footer
 * links do the same job. */
(function () {
  var KEY = 'sd-lang';
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}

  if (root.getAttribute('data-lang') === 'en' && (saved === 'zh' || saved === 'zht')) {
    var to = root.getAttribute('data-alt-' + saved);
    if (to) {
      location.replace(to + location.search + location.hash);
      return;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Remember an explicit choice, whether it came from the menu or the footer.
    var links = document.querySelectorAll('a[data-setlang]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function () {
        try { localStorage.setItem(KEY, this.getAttribute('data-setlang')); } catch (e) {}
      });
    }

    var btn = document.getElementById('langBtn');
    var pop = document.getElementById('langPop');
    if (!btn || !pop) return;
    var menu = btn.parentNode;

    function setOpen(open) {
      pop.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.classList.toggle('open', open);
    }
    btn.addEventListener('click', function () { setOpen(pop.hidden); });
    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  });
})();
