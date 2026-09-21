/* Header menus. Every language has its own URL — / for English, then
 * /zh-hans/, /zh-hant/, /de/, /es/, /fr/, /ja/ and /ru/ — and the menu entries
 * are ordinary links between them. English is what everyone gets first: the
 * browser language is never sniffed, and only an explicit choice is
 * remembered. A visitor who picked another language and later arrives at an
 * English URL is sent on to the same page in their language; any other URL is
 * always shown as asked for. Loaded synchronously in <head> so that hop happens
 * before anything paints. Without JS the popover stays shut and the footer
 * links do the same job. */
(function () {
  var KEY = 'sd-lang';
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}

  if (root.getAttribute('data-lang') === 'en' && /^[a-z]{2,3}$/.test(saved || '') && saved !== 'en') {
    // Only ever a path the page itself lists; an unknown value finds nothing.
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

    // The header menus (Tools, language): a button that shows and hides the popover next to it.
    var menus = document.querySelectorAll('.nav-menu, .lang-menu');
    function setOpen(menu, open) {
      var btn = menu.querySelector('button'), pop = menu.querySelector('.lang-pop');
      pop.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.classList.toggle('open', open);
    }
    function closeAll(except) {
      for (var i = 0; i < menus.length; i++) if (menus[i] !== except) setOpen(menus[i], false);
    }
    for (var m = 0; m < menus.length; m++) {
      (function (menu) {
        menu.querySelector('button').addEventListener('click', function () {
          closeAll(menu);
          setOpen(menu, menu.querySelector('.lang-pop').hidden);
        });
      })(menus[m]);
    }
    document.addEventListener('click', function (e) {
      for (var i = 0; i < menus.length; i++) if (!menus[i].contains(e.target)) setOpen(menus[i], false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll(null);
    });
  });
})();
