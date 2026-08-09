/* Language dropdown menu: English (default) / 简体中文 / 繁體中文.
 * Custom popover (native <select> panels can't be styled). Defaults to English
 * for every first visit — no browser-language detection; only an explicit
 * choice is remembered. Runs synchronously in <head> so the right language
 * shows on first paint. Without JS the page falls back to English. */
(function () {
  var KEY = 'sd-lang';
  var LANGS = ['en', 'zh', 'zht'];
  var NAMES = { en: 'English', zh: '简体中文', zht: '繁體中文' };
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  var lang = LANGS.indexOf(saved) !== -1 ? saved : 'en';

  function apply(l) {
    document.documentElement.setAttribute('data-lang', l);
    document.documentElement.setAttribute('lang', l === 'zh' ? 'zh-Hans' : l === 'zht' ? 'zh-Hant' : 'en');
    try { localStorage.setItem(KEY, l); } catch (e) {}
    var label = document.getElementById('langBtnLabel');
    if (label) label.textContent = NAMES[l];
    var opts = document.querySelectorAll('.lang-pop button');
    for (var i = 0; i < opts.length; i++) {
      opts[i].classList.toggle('active', opts[i].getAttribute('data-setlang') === l);
    }
  }

  apply(lang);

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('langBtn');
    var pop = document.getElementById('langPop');
    if (!btn || !pop) return;
    var menu = btn.parentNode;
    apply(document.documentElement.getAttribute('data-lang'));

    function setOpen(open) {
      pop.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.classList.toggle('open', open);
    }
    btn.addEventListener('click', function () { setOpen(pop.hidden); });
    var opts = pop.querySelectorAll('button');
    for (var i = 0; i < opts.length; i++) {
      opts[i].addEventListener('click', function () {
        apply(this.getAttribute('data-setlang'));
        setOpen(false);
      });
    }
    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  });
})();
