/* Header menus. Every language has its own URL — / for English, then
 * /zh-hans/, /zh-hant/, /de/, /es/, /fr/, /ja/ and /ru/ — and the menu entries
 * are ordinary links between them. The English URLs double as the default: a
 * visitor arriving at one from elsewhere is sent on to the same page in the
 * first of their browser's languages that the site has, Chinese being
 * Traditional for Taiwan, Hong Kong and Macau and Simplified otherwise. A
 * language picked from the menu is remembered and wins over the browser from
 * then on. Any other URL is always shown as asked for, and so is an English
 * one reached from within the site, so picking English sticks even where
 * nothing can be remembered. Loaded synchronously in <head> so that hop
 * happens before anything paints. Without JS the popover stays shut and the
 * footer links do the same job. */
(function () {
  var KEY = 'sd-lang';
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}

  // The site's language for a browser language tag such as de-AT, zh-TW or zh-Hans-HK, or null.
  function siteLang(tag) {
    var sub = String(tag || '').toLowerCase().split(/[-_]/);
    if (sub[0] !== 'zh') return /^(en|de|es|fr|ja|ru)$/.test(sub[0]) ? sub[0] : null;
    // A script subtag comes before the region, so it decides when there is one.
    for (var i = 1; i < sub.length; i++) {
      if (sub[i] === 'hans') return 'zh';
      if (sub[i] === 'hant' || sub[i] === 'tw' || sub[i] === 'hk' || sub[i] === 'mo') return 'zht';
    }
    return 'zh';
  }

  function browserLang() {
    var tags = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
    for (var i = 0; i < tags.length; i++) {
      var l = siteLang(tags[i]);
      if (l) return l;
    }
    return null;
  }

  if (root.getAttribute('data-lang') === 'en') {
    var want = /^[a-z]{2,3}$/.test(saved || '') ? saved : null;
    if (!want && document.referrer.indexOf(location.origin + '/') !== 0) want = browserLang();
    // Only ever a path the page itself lists; an unknown value finds nothing.
    var to = want && want !== 'en' && root.getAttribute('data-alt-' + want);
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
