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
 * Without JS the badge stays a plain link and behaves as it always did. The
 * Google Play badge is left alone: it opens the Play Store app on Android and
 * the store's web page everywhere else. The mainland China edition (/cn/), for
 * where Google Play can't be reached, shows Android as still to come instead,
 * and the messages say the same (the *Mainland entries).
 *
 * Message text lives here rather than in the page sources like the rest of the
 * site because the browser name has to be interpolated into it. */
(function () {
  var ua = navigator.userAgent || '';
  var touch = navigator.maxTouchPoints > 1;

  // iPadOS 13+ reports a Mac user agent; the touch points tell it apart.
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && touch);
  var isMac = /Macintosh/.test(ua) && !touch;

  /* In-app webviews are matched before real browsers: they almost all carry a
   * Chrome or Safari token too, so a generic match would shadow them. A name is
   * localized only where the local one is what people know it by; every other
   * language uses the English entry. */
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

  var named = null;
  for (var i = 0; i < BROWSERS.length; i++) {
    if (BROWSERS[i][0].test(ua)) { named = BROWSERS[i][1]; break; }
  }
  // Real Safari always sends "Version/<n> … Safari/<n>" and matches nothing above.
  var isSafari = !named && /Version\/\d/.test(ua) && /Safari\//.test(ua);

  if (isMac) return;                // the Mac App Store opens fine from any browser
  if (isIOS && isSafari) return;    // Safari hands off to the App Store fine

  var kind = isIOS ? 'ios'
           : /Android/i.test(ua) ? 'android'
           : /Windows/i.test(ua) ? 'windows'
           : 'other';

  // {browser} is the app or browser the page is open in, or the "browser" entry when it isn't known.
  // The *Mainland entries are for the mainland China edition, where Google Play can't be reached and
  // Android is still to come.
  var TEXT = {
    en: {
      ios: '{browser} can’t open the App Store. Copy the address below and open it in Safari.',
      android: 'On Android, get StitchDuck from Google Play. The App Store is for iPhone, iPad and Mac.',
      windows: 'StitchDuck for Windows is coming soon. For now it’s available on iPhone, iPad, Mac and Android.',
      other: 'StitchDuck is available on iPhone, iPad, Mac and Android — this device can’t install it.',
      androidMainland: 'StitchDuck for Android is coming soon. For now it’s available on iPhone, iPad and Mac.',
      windowsMainland: 'StitchDuck for Windows is coming soon. For now it’s available on iPhone, iPad and Mac.',
      otherMainland: 'StitchDuck is available on iPhone, iPad and Mac — this device can’t install it.',
      browser: 'This browser', copy: 'Copy', copied: 'Copied',
      hint: 'Press and hold the address to copy it.', dismiss: 'Dismiss'
    },
    zh: {
      ios: '{browser}无法打开 App Store，请复制下面的网址，在 Safari 中打开。',
      android: 'Android 设备请到 Google Play 下载绣鸭，App Store 只适用于 iPhone、iPad、Mac。',
      windows: '绣鸭 Windows 版即将上架，目前有 iPhone、iPad、Mac、Android 版。',
      other: '绣鸭目前有 iPhone、iPad、Mac、Android 版，当前设备无法安装。',
      androidMainland: '绣鸭 Android 版即将上架，目前有 iPhone、iPad、Mac 版。',
      windowsMainland: '绣鸭 Windows 版即将上架，目前有 iPhone、iPad、Mac 版。',
      otherMainland: '绣鸭目前有 iPhone、iPad、Mac 版，当前设备无法安装。',
      browser: '当前浏览器', copy: '复制', copied: '已复制',
      hint: '请长按网址手动复制。', dismiss: '关闭'
    },
    zht: {
      ios: '{browser}無法開啟 App Store，請複製下面的網址，在 Safari 中開啟。',
      android: 'Android 裝置請到 Google Play 下載 StitchDuck，App Store 只適用於 iPhone、iPad、Mac。',
      windows: 'StitchDuck Windows 版即將上架，目前有 iPhone、iPad、Mac、Android 版。',
      other: 'StitchDuck 目前有 iPhone、iPad、Mac、Android 版，目前裝置無法安裝。',
      androidMainland: 'StitchDuck Android 版即將上架，目前有 iPhone、iPad、Mac 版。',
      windowsMainland: 'StitchDuck Windows 版即將上架，目前有 iPhone、iPad、Mac 版。',
      otherMainland: 'StitchDuck 目前有 iPhone、iPad、Mac 版，目前裝置無法安裝。',
      browser: '目前瀏覽器', copy: '複製', copied: '已複製',
      hint: '請長按網址手動複製。', dismiss: '關閉'
    },
    de: {
      ios: '{browser} kann den App Store nicht öffnen. Kopiere die Adresse unten und öffne sie in Safari.',
      android: 'Auf Android bekommst du StitchDuck bei Google Play. Der App Store ist für iPhone, iPad und Mac.',
      windows: 'StitchDuck für Windows kommt demnächst. Aktuell gibt es die App für iPhone, iPad, Mac und Android.',
      other: 'StitchDuck gibt es für iPhone, iPad, Mac und Android – auf diesem Gerät lässt sich die App nicht installieren.',
      androidMainland: 'StitchDuck für Android kommt demnächst. Aktuell gibt es die App für iPhone, iPad und Mac.',
      windowsMainland: 'StitchDuck für Windows kommt demnächst. Aktuell gibt es die App für iPhone, iPad und Mac.',
      otherMainland: 'StitchDuck gibt es für iPhone, iPad und Mac – auf diesem Gerät lässt sich die App nicht installieren.',
      browser: 'Dieser Browser', copy: 'Kopieren', copied: 'Kopiert',
      hint: 'Adresse lange drücken, um sie zu kopieren.', dismiss: 'Schließen'
    },
    es: {
      ios: '{browser} no puede abrir el App Store. Copia la dirección de abajo y ábrela en Safari.',
      android: 'En Android, descarga StitchDuck desde Google Play. El App Store es para iPhone, iPad y Mac.',
      windows: 'StitchDuck para Windows llegará pronto. Por ahora está disponible en iPhone, iPad, Mac y Android.',
      other: 'StitchDuck está disponible en iPhone, iPad, Mac y Android: no se puede instalar en este dispositivo.',
      androidMainland: 'StitchDuck para Android llegará pronto. Por ahora está disponible en iPhone, iPad y Mac.',
      windowsMainland: 'StitchDuck para Windows llegará pronto. Por ahora está disponible en iPhone, iPad y Mac.',
      otherMainland: 'StitchDuck está disponible en iPhone, iPad y Mac: no se puede instalar en este dispositivo.',
      browser: 'Este navegador', copy: 'Copiar', copied: 'Copiado',
      hint: 'Mantén pulsada la dirección para copiarla.', dismiss: 'Cerrar'
    },
    fr: {
      ios: '{browser} ne peut pas ouvrir l’App Store. Copiez l’adresse ci-dessous et ouvrez-la dans Safari.',
      android: 'Sur Android, téléchargez StitchDuck sur Google Play. L’App Store, c’est pour iPhone, iPad et Mac.',
      windows: 'StitchDuck pour Windows arrive bientôt. Pour l’instant, il est disponible sur iPhone, iPad, Mac et Android.',
      other: 'StitchDuck est disponible sur iPhone, iPad, Mac et Android – cet appareil ne peut pas l’installer.',
      androidMainland: 'StitchDuck pour Android arrive bientôt. Pour l’instant, il est disponible sur iPhone, iPad et Mac.',
      windowsMainland: 'StitchDuck pour Windows arrive bientôt. Pour l’instant, il est disponible sur iPhone, iPad et Mac.',
      otherMainland: 'StitchDuck est disponible sur iPhone, iPad et Mac – cet appareil ne peut pas l’installer.',
      browser: 'Ce navigateur', copy: 'Copier', copied: 'Copié',
      hint: 'Faites un appui long sur l’adresse pour la copier.', dismiss: 'Fermer'
    },
    it: {
      ios: '{browser} non riesce ad aprire App Store. Copia l’indirizzo qui sotto e aprilo in Safari.',
      android: 'Su Android, scarica StitchDuck da Google Play. App Store è per iPhone, iPad e Mac.',
      windows: 'StitchDuck per Windows arriverà presto. Per ora è disponibile su iPhone, iPad, Mac e Android.',
      other: 'StitchDuck è disponibile su iPhone, iPad, Mac e Android: su questo dispositivo non si può installare.',
      androidMainland: 'StitchDuck per Android arriverà presto. Per ora è disponibile su iPhone, iPad e Mac.',
      windowsMainland: 'StitchDuck per Windows arriverà presto. Per ora è disponibile su iPhone, iPad e Mac.',
      otherMainland: 'StitchDuck è disponibile su iPhone, iPad e Mac: su questo dispositivo non si può installare.',
      browser: 'Questo browser', copy: 'Copia', copied: 'Copiato',
      hint: 'Tieni premuto l’indirizzo per copiarlo.', dismiss: 'Chiudi'
    },
    ja: {
      ios: '{browser}では App Store を開けません。下のアドレスをコピーして、Safari で開いてください。',
      android: 'Android では Google Play から StitchDuck をダウンロードしてください。App Store は iPhone・iPad・Mac 用です。',
      windows: 'StitchDuck の Windows 版は近日公開です。現在は iPhone・iPad・Mac・Android でご利用いただけます。',
      other: 'StitchDuck は iPhone・iPad・Mac・Android でご利用いただけます。この端末にはインストールできません。',
      androidMainland: 'StitchDuck の Android 版は近日公開です。現在は iPhone・iPad・Mac でご利用いただけます。',
      windowsMainland: 'StitchDuck の Windows 版は近日公開です。現在は iPhone・iPad・Mac でご利用いただけます。',
      otherMainland: 'StitchDuck は iPhone・iPad・Mac でご利用いただけます。この端末にはインストールできません。',
      browser: 'このブラウザ', copy: 'コピー', copied: 'コピー済み',
      hint: 'アドレスを長押ししてコピーしてください。', dismiss: '閉じる'
    },
    ko: {
      ios: '{browser}에서는 App Store를 열 수 없습니다. 아래 주소를 복사해 Safari에서 열어 주세요.',
      android: 'Android에서는 Google Play에서 StitchDuck을 다운로드하세요. App Store는 iPhone, iPad, Mac용입니다.',
      windows: 'Windows용 StitchDuck은 곧 출시됩니다. 지금은 iPhone, iPad, Mac, Android에서 이용할 수 있습니다.',
      other: 'StitchDuck은 iPhone, iPad, Mac, Android용 앱이라 이 기기에는 설치할 수 없습니다.',
      androidMainland: 'Android용 StitchDuck은 곧 출시됩니다. 지금은 iPhone, iPad, Mac에서 이용할 수 있습니다.',
      windowsMainland: 'Windows용 StitchDuck은 곧 출시됩니다. 지금은 iPhone, iPad, Mac에서 이용할 수 있습니다.',
      otherMainland: 'StitchDuck은 iPhone, iPad, Mac용 앱이라 이 기기에는 설치할 수 없습니다.',
      browser: '이 브라우저', copy: '복사', copied: '복사됨',
      hint: '주소를 길게 눌러 복사하세요.', dismiss: '닫기'
    },
    pl: {
      ios: '{browser} nie może otworzyć App Store. Skopiuj poniższy adres i otwórz go w Safari.',
      android: 'Na Androidzie pobierz aplikację StitchDuck z Google Play. App Store jest dla iPhone’a, iPada i Maca.',
      windows: 'StitchDuck na Windowsa już wkrótce. Na razie aplikacja jest dostępna na iPhonie, iPadzie, Macu i Androidzie.',
      other: 'Aplikacja StitchDuck jest dostępna na iPhonie, iPadzie, Macu i Androidzie — na tym urządzeniu nie można jej zainstalować.',
      androidMainland: 'StitchDuck na Androida już wkrótce. Na razie aplikacja jest dostępna na iPhonie, iPadzie i Macu.',
      windowsMainland: 'StitchDuck na Windowsa już wkrótce. Na razie aplikacja jest dostępna na iPhonie, iPadzie i Macu.',
      otherMainland: 'Aplikacja StitchDuck jest dostępna na iPhonie, iPadzie i Macu — na tym urządzeniu nie można jej zainstalować.',
      browser: 'Ta przeglądarka', copy: 'Kopiuj', copied: 'Skopiowano',
      hint: 'Dotknij i przytrzymaj adres, aby go skopiować.', dismiss: 'Zamknij'
    },
    pt: {
      ios: '{browser} não consegue abrir a App Store. Copie o endereço abaixo e abra-o no Safari.',
      android: 'No Android, baixe o StitchDuck no Google Play. A App Store é para iPhone, iPad e Mac.',
      windows: 'O StitchDuck para Windows chega em breve. Por enquanto, ele está disponível para iPhone, iPad, Mac e Android.',
      other: 'O StitchDuck está disponível para iPhone, iPad, Mac e Android — não é possível instalá-lo neste dispositivo.',
      androidMainland: 'O StitchDuck para Android chega em breve. Por enquanto, ele está disponível para iPhone, iPad e Mac.',
      windowsMainland: 'O StitchDuck para Windows chega em breve. Por enquanto, ele está disponível para iPhone, iPad e Mac.',
      otherMainland: 'O StitchDuck está disponível para iPhone, iPad e Mac — não é possível instalá-lo neste dispositivo.',
      browser: 'Este navegador', copy: 'Copiar', copied: 'Copiado',
      hint: 'Toque e segure o endereço para copiá-lo.', dismiss: 'Fechar'
    },
    ru: {
      ios: '{browser} не может открыть App Store. Скопируйте адрес ниже и откройте его в Safari.',
      android: 'На Android скачайте StitchDuck в Google Play. App Store — для iPhone, iPad и Mac.',
      windows: 'StitchDuck для Windows скоро появится. Пока приложение доступно на iPhone, iPad, Mac и Android.',
      other: 'StitchDuck доступен на iPhone, iPad, Mac и Android — на это устройство установить его нельзя.',
      androidMainland: 'StitchDuck для Android скоро появится. Пока приложение доступно на iPhone, iPad и Mac.',
      windowsMainland: 'StitchDuck для Windows скоро появится. Пока приложение доступно на iPhone, iPad и Mac.',
      otherMainland: 'StitchDuck доступен на iPhone, iPad и Mac — на это устройство установить его нельзя.',
      browser: 'Этот браузер', copy: 'Скопировать', copied: 'Скопировано',
      hint: 'Нажмите и удерживайте адрес, чтобы скопировать его.', dismiss: 'Закрыть'
    },
    tr: {
      ios: '{browser} App Store’u açamıyor. Aşağıdaki adresi kopyalayıp Safari’de açın.',
      android: 'Android’de StitchDuck uygulamasını Google Play’den indirin. App Store; iPhone, iPad ve Mac içindir.',
      windows: 'Windows için StitchDuck çok yakında geliyor. Şimdilik iPhone, iPad, Mac ve Android’de kullanılabilir.',
      other: 'StitchDuck iPhone, iPad, Mac ve Android’de kullanılabilir — bu aygıta yüklenemez.',
      androidMainland: 'Android için StitchDuck çok yakında geliyor. Şimdilik iPhone, iPad ve Mac’te kullanılabilir.',
      windowsMainland: 'Windows için StitchDuck çok yakında geliyor. Şimdilik iPhone, iPad ve Mac’te kullanılabilir.',
      otherMainland: 'StitchDuck iPhone, iPad ve Mac’te kullanılabilir — bu aygıta yüklenemez.',
      browser: 'Bu tarayıcı', copy: 'Kopyala', copied: 'Kopyalandı',
      hint: 'Kopyalamak için adresi basılı tutun.', dismiss: 'Kapat'
    },
    uk: {
      ios: '{browser} не може відкрити App Store. Скопіюйте адресу нижче й відкрийте її в Safari.',
      android: 'На Android завантажте StitchDuck із Google Play. App Store — для iPhone, iPad і Mac.',
      windows: 'StitchDuck для Windows з’явиться незабаром. Поки що застосунок доступний на iPhone, iPad, Mac і Android.',
      other: 'StitchDuck доступний на iPhone, iPad, Mac і Android — на цей пристрій його встановити не можна.',
      androidMainland: 'StitchDuck для Android з’явиться незабаром. Поки що застосунок доступний на iPhone, iPad і Mac.',
      windowsMainland: 'StitchDuck для Windows з’явиться незабаром. Поки що застосунок доступний на iPhone, iPad і Mac.',
      otherMainland: 'StitchDuck доступний на iPhone, iPad і Mac — на цей пристрій його встановити не можна.',
      browser: 'Цей браузер', copy: 'Скопіювати', copied: 'Скопійовано',
      hint: 'Натисніть і утримуйте адресу, щоб скопіювати її.', dismiss: 'Закрити'
    }
  };

  function lang() {
    var l = document.documentElement.getAttribute('data-lang');
    return TEXT.hasOwnProperty(l) ? l : 'en';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var badge = document.querySelector('.store-badge[data-store="apple"]');
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
      var t = TEXT[lang()];
      copy(url, function (ok) {
        if (ok) {
          copyBtn.textContent = t.copied;
          return;
        }
        // Fall back to letting them copy it by hand.
        hintEl.textContent = t.hint;
        hintEl.hidden = false;
        selectNode(urlEl);
      });
    });

    function show() {
      var l = lang(), t = TEXT[l];
      var browser = named ? (named[l] || named.en) : t.browser;
      // _src/build.py marks the mainland China edition's pages.
      var mainland = document.documentElement.classList.contains('mainland-edition');
      msgEl.textContent = t[kind !== 'ios' && mainland ? kind + 'Mainland' : kind].replace('{browser}', browser);
      copyBtn.textContent = t.copy;
      closeBtn.setAttribute('aria-label', t.dismiss);
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
