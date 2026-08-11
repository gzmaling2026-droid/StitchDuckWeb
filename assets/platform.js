/* Warns on the download tap when the App Store badge can't actually reach the
 * App Store — the usual reason a tap looks like it did nothing.
 *
 * Detection runs synchronously in <head> and records the reason on <html>:
 *   data-platform="browser"  Apple device, but a third-party browser or in-app
 *                            webview (WeChat, Weibo, Chrome for iOS, …) that
 *                            often swallows the apps.apple.com jump
 *   data-platform="other"    not an Apple device — nothing to install here
 * No attribute means the badge works, and it is left as a plain link.
 *
 * The notice is not shown up front: the first tap is intercepted to reveal it,
 * and any tap after that goes through, so nobody gets stuck. Without JS the
 * badge behaves exactly as it always did. */
(function () {
  var ua = navigator.userAgent || '';
  var touch = navigator.maxTouchPoints > 1;

  // iPadOS 13+ reports a Mac user agent; the touch points tell it apart.
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && touch);
  var isMac = /Macintosh/.test(ua) && !touch;

  // Every third-party iOS browser and in-app webview either adds its own token
  // or drops the "Version/<n>" that real Safari always sends.
  var EMBEDDED = /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|Brave|YaBrowser|MicroMessenger|Weibo|QQ|MQQBrowser|UCBrowser|Quark|Baidu|AlipayClient|DingTalk|Lark|Line\/|FBAN|FBAV|Instagram|Snapchat|TikTok|Bytedance/i;
  var isSafari = /Version\/\d/.test(ua) && /Safari\//.test(ua) && !EMBEDDED.test(ua);

  if ((isIOS && isSafari) || isMac) return;   // the badge works — stay out of the way
  document.documentElement.setAttribute('data-platform', isIOS ? 'browser' : 'other');

  document.addEventListener('DOMContentLoaded', function () {
    var badge = document.querySelector('.store-badge');
    var note = document.getElementById('platformNote');
    if (!badge || !note) return;

    var warned = false;
    badge.addEventListener('click', function (e) {
      if (warned) return;          // already told them — let this tap through
      e.preventDefault();
      warned = true;
      note.hidden = false;
      note.focus();
    });
  });
})();
