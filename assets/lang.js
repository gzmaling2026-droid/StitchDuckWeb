/* Editions, languages and the header menus. The site comes in two editions:
 * the international one, with a page per language under /intl/ — /intl/ for
 * English, then /intl/zh-hans/, /intl/zh-hant/, /intl/de/, /intl/es/,
 * /intl/fr/, /intl/it/, /intl/ja/, /intl/ko/, /intl/pl/, /intl/pt-br/,
 * /intl/ru/, /intl/tr/ and /intl/uk/ — and the mainland China one, /cn/, in
 * Simplified Chinese. The menu entries are ordinary links between them.
 *
 * Every other address is an entry page (data-entry): / is what people type, and
 * the rest are where the international pages were before they moved under /intl/
 * (/support/, /zh-hans/, /de/ …). An entry page always sends the visitor on: to
 * the mainland China edition if they picked it before or, picking nothing, if
 * their time zone is mainland China's; otherwise to the international page in
 * the language the address names, or for an English address the language they
 * picked before or else the first of their browser's languages that the site
 * has, Chinese being Traditional for Taiwan, Hong Kong and Macau and Simplified
 * otherwise, and any Portuguese getting the site's Brazilian Portuguese.
 *
 * The international English pages still double as the default for language: a
 * visitor arriving at one from elsewhere is sent on to the same page in the
 * language they picked or their browser's, never to the other edition. Any other
 * edition page is always shown as asked for, and so is an English one reached
 * from within the site, so picking English sticks even where nothing can be
 * remembered. Loaded synchronously in <head> so that hop happens before anything
 * paints. Without JS an entry page shows the international page it stands for,
 * the popover stays shut and the footer links do the same job. */
(function () {
  // The language picked (an international one) and the edition picked ('cn' or 'intl'), each null
  // until a menu or footer link sets it.
  var LANG_KEY = 'sd-lang', REGION_KEY = 'sd-region';
  var root = document.documentElement;
  function load(key, valid) {
    var v = null;
    try { v = localStorage.getItem(key); } catch (e) {}
    return valid.test(v || '') ? v : null;
  }
  var savedLang = load(LANG_KEY, /^[a-z]{2,3}$/);
  var savedRegion = load(REGION_KEY, /^(cn|intl)$/);

  // The site's language for a browser language tag such as de-AT, zh-TW or zh-Hans-HK, or null.
  function siteLang(tag) {
    var sub = String(tag || '').toLowerCase().split(/[-_]/);
    if (sub[0] !== 'zh') return /^(en|de|es|fr|it|ja|ko|pl|pt|ru|tr|uk)$/.test(sub[0]) ? sub[0] : null;
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

  // Whether the visitor is in mainland China, going by the browser's time zone, which tells without
  // sending the visitor's IP anywhere and before anything paints. Hong Kong, Macau and Taiwan have
  // zones of their own; with no time zone to go by, the answer is no.
  function inMainland() {
    var zone = null;
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
    return /^(Asia\/(Shanghai|Chongqing|Chungking|Harbin|Urumqi|Kashgar)|PRC)$/.test(zone || '');
  }

  // Only ever a path the page itself lists; an unknown value finds nothing.
  function alt(l) { return l ? root.getAttribute('data-alt-' + l) : null; }

  var entry = root.getAttribute('data-entry');
  if (entry) {
    var cn = root.getAttribute('data-cn');
    var to = cn && (savedRegion ? savedRegion === 'cn' : inMainland()) ? cn
           : entry === 'en' ? alt(savedLang) || alt(browserLang()) || alt('en')
           : alt(entry);
    location.replace(to + location.search + location.hash);
    return;
  }

  if (root.getAttribute('data-lang') === 'en') {
    var want = savedLang;
    if (!want && document.referrer.indexOf(location.origin + '/') !== 0) want = browserLang();
    var to = want !== 'en' && alt(want);
    if (to) {
      location.replace(to + location.search + location.hash);
      return;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Remember an explicit choice, whether it came from the menu or the footer: the mainland China
    // edition, or the international one in a language.
    var links = document.querySelectorAll('a[data-setlang]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function () {
        var l = this.getAttribute('data-setlang');
        try {
          localStorage.setItem(REGION_KEY, l === 'cn' ? 'cn' : 'intl');
          if (l !== 'cn') localStorage.setItem(LANG_KEY, l);
        } catch (e) {}
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
