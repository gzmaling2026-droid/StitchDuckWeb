/* Explains, in a toast on the download tap, why the App Store badge can't get
 * anywhere — the usual reason a tap looks like it did nothing.
 *
 * Two things are identified: the platform (iOS / Android / Windows / other) and
 * the browser (Safari, Chrome, WeChat, Weibo, QQ, Alipay, Douyin, …), because
 * the useful message differs. On iPhone and iPad only Safari can hand off to
 * the App Store, so the toast names the browser the visitor is actually in and
 * offers the site address to copy and reopen in Safari. Everywhere else the
 * platform is the whole story, so the toast just says so.
 *
 * Silent where the badge works: Safari on iOS/iPadOS, and macOS on any browser.
 * Without JS the badge stays a plain link and behaves as it always did.
 *
 * Message text lives here rather than in l-en/l-zh/l-zht spans like the rest of
 * the site because the browser name has to be interpolated into it. */
(function () {
  var ua = navigator.userAgent || '';
  var touch = navigator.maxTouchPoints > 1;

  // iPadOS 13+ reports a Mac user agent; the touch points tell it apart.
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && touch);
  var isMac = /Macintosh/.test(ua) && !touch;

  /* In-app webviews are matched before real browsers: they almost all carry a
   * Chrome or Safari token too, so a generic match would shadow them. */
  var BROWSERS = [
    [/MicroMessenger/i,                {en: 'WeChat',           zh: '微信',       zht: '微信'}],
    [/Weibo/i,                         {en: 'Weibo',            zh: '微博',       zht: '微博'}],
    [/MQQBrowser|QQ\//i,               {en: 'QQ',               zh: 'QQ',         zht: 'QQ'}],
    [/AlipayClient|AliApp/i,           {en: 'Alipay',           zh: '支付宝',     zht: '支付寶'}],
    [/DingTalk/i,                      {en: 'DingTalk',         zh: '钉钉',       zht: '釘釘'}],
    [/BytedanceWebview|Aweme|TikTok/i, {en: 'Douyin',           zh: '抖音',       zht: '抖音'}],
    [/baiduboxapp|Baidu/i,             {en: 'Baidu',            zh: '百度',       zht: '百度'}],
    [/Quark/i,                         {en: 'Quark',            zh: '夸克',       zht: '夸克'}],
    [/UCBrowser|UBrowser/i,            {en: 'UC Browser',       zh: 'UC 浏览器',  zht: 'UC 瀏覽器'}],
    [/FBAN|FBAV/i,                     {en: 'Facebook',         zh: 'Facebook',   zht: 'Facebook'}],
    [/Instagram/i,                     {en: 'Instagram',        zh: 'Instagram',  zht: 'Instagram'}],
    [/Line\//i,                        {en: 'LINE',             zh: 'LINE',       zht: 'LINE'}],
    [/EdgiOS|EdgA?\//i,                {en: 'Edge',             zh: 'Edge',       zht: 'Edge'}],
    [/OPiOS|OPR\/|Opera/i,             {en: 'Opera',            zh: 'Opera',      zht: 'Opera'}],
    [/FxiOS|Firefox/i,                 {en: 'Firefox',          zh: 'Firefox',    zht: 'Firefox'}],
    [/SamsungBrowser/i,                {en: 'Samsung Internet', zh: '三星浏览器', zht: '三星瀏覽器'}],
    [/HuaweiBrowser/i,                 {en: 'Huawei Browser',   zh: '华为浏览器', zht: '華為瀏覽器'}],
    [/CriOS|Chrome/i,                  {en: 'Chrome',           zh: 'Chrome',     zht: 'Chrome'}]
  ];
  var GENERIC = {en: 'This browser', zh: '当前浏览器', zht: '目前瀏覽器'};

  var named = null;
  for (var i = 0; i < BROWSERS.length; i++) {
    if (BROWSERS[i][0].test(ua)) { named = BROWSERS[i][1]; break; }
  }
  // Real Safari always sends "Version/<n> … Safari/<n>" and matches nothing above.
  var isSafari = !named && /Version\/\d/.test(ua) && /Safari\//.test(ua);

  if (isMac) return;                // the Mac App Store opens fine from any browser
  if (isIOS && isSafari) return;    // Safari hands off to the App Store fine

  var browser = named || GENERIC;
  var kind = isIOS ? 'ios'
           : /Android/i.test(ua) ? 'android'
           : /Windows/i.test(ua) ? 'windows'
           : 'other';

  var MSG = {
    ios: {
      en:  function (b) { return b + ' can’t open the App Store. Copy the address below and open it in Safari.'; },
      zh:  function (b) { return b + '无法打开 App Store，请复制下面的网址，在 Safari 中打开。'; },
      zht: function (b) { return b + '無法開啟 App Store，請複製下面的網址，在 Safari 中開啟。'; }
    },
    android: {
      en:  function () { return 'StitchDuck isn’t available on Android yet — it’s an iPhone and iPad app.'; },
      zh:  function () { return '绣鸭暂不支持 Android，目前只有 iPhone、iPad 版。'; },
      zht: function () { return 'StitchDuck 暫不支援 Android，目前只有 iPhone、iPad 版。'; }
    },
    windows: {
      en:  function () { return 'StitchDuck isn’t available on Windows — it’s an iPhone and iPad app, with a Mac version coming.'; },
      zh:  function () { return '绣鸭暂不支持 Windows，目前只有 iPhone、iPad 版，Mac 版即将上线。'; },
      zht: function () { return 'StitchDuck 暫不支援 Windows，目前只有 iPhone、iPad 版，Mac 版即將上線。'; }
    },
    other: {
      en:  function () { return 'StitchDuck is an iPhone and iPad app — this device can’t install it.'; },
      zh:  function () { return '绣鸭是 iPhone、iPad 应用，当前设备无法安装。'; },
      zht: function () { return 'StitchDuck 是 iPhone、iPad 應用程式，目前裝置無法安裝。'; }
    }
  };
  var COPY  = {en: ['Copy', 'Copied'], zh: ['复制', '已复制'], zht: ['複製', '已複製']};
  var HINT  = {en: 'Press and hold the address to copy it.', zh: '请长按网址手动复制。', zht: '請長按網址手動複製。'};
  var CLOSE = {en: 'Dismiss', zh: '关闭', zht: '關閉'};

  function lang() {
    var l = document.documentElement.getAttribute('data-lang');
    return (l === 'zh' || l === 'zht') ? l : 'en';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var badge = document.querySelector('.store-badge');
    var toast = document.getElementById('toast');
    if (!badge || !toast) return;

    var msgEl = document.getElementById('toastMsg');
    var copyBox = document.getElementById('toastCopy');
    var hintEl = document.getElementById('toastHint');
    var urlEl = document.getElementById('siteUrl');
    var copyBtn = document.getElementById('copyUrl');
    var closeBtn = document.getElementById('toastClose');
    var timer = null;

    // The markup carries the domain so it is right before JS runs and stays
    // right in any context where location isn't a usable http(s) URL.
    var url;
    if (location.host) {
      urlEl.textContent = location.host;
      url = location.origin + '/';
    } else {
      url = 'https://' + urlEl.textContent.trim() + '/';
    }

    badge.addEventListener('click', function (e) {
      e.preventDefault();       // the jump would go nowhere here
      show();
    });
    closeBtn.addEventListener('click', hide);
    copyBtn.addEventListener('click', function () {
      var l = lang();
      copy(url, function (ok) {
        if (ok) {
          copyBtn.textContent = COPY[l][1];
          return;
        }
        // Fall back to letting them copy it by hand.
        hintEl.textContent = HINT[l];
        hintEl.hidden = false;
        selectNode(urlEl);
      });
    });

    function show() {
      var l = lang();
      msgEl.textContent = MSG[kind][l](browser[l]);
      copyBtn.textContent = COPY[l][0];
      closeBtn.setAttribute('aria-label', CLOSE[l]);
      hintEl.hidden = true;
      copyBox.hidden = kind !== 'ios';
      toast.hidden = false;
      // Next frame, so the transition runs from the hidden state.
      requestAnimationFrame(function () { toast.classList.add('show'); });

      clearTimeout(timer);
      // The iOS toast is something to act on, so it waits to be dismissed.
      if (kind !== 'ios') timer = setTimeout(hide, 6000);
    }

    function hide() {
      clearTimeout(timer);
      toast.classList.remove('show');
      setTimeout(function () { toast.hidden = true; }, 200);
    }
  });

  function copy(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { done(true); },
        function () { done(legacyCopy(text)); }
      );
      return;
    }
    done(legacyCopy(text));
  }

  /* execCommand path for in-app webviews with no async clipboard. iOS only
   * copies from an editable, selected field, hence contentEditable. */
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.contentEditable = 'true';
    ta.readOnly = false;
    ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0;';
    document.body.appendChild(ta);
    var range = document.createRange();
    range.selectNodeContents(ta);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    ta.setSelectionRange(0, text.length);
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    sel.removeAllRanges();
    document.body.removeChild(ta);
    return ok;
  }

  function selectNode(el) {
    try {
      var range = document.createRange();
      range.selectNodeContents(el);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (e) {}
  }
})();
