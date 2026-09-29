/* Screenshot row on the home page. Touch screens swipe it; for a mouse, the
 * buttons under it step one screenshot at a time and dim at either end. The
 * stylesheet keeps the buttons off touch screens, and without JS they stay
 * hidden while the row still scrolls sideways. */
(function () {
  var row = document.getElementById('shots');
  var nav = document.querySelector('.shots-nav');
  if (!row || !nav) return;
  var prev = nav.querySelector('.shots-prev'), next = nav.querySelector('.shots-next');
  var still = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;

  function step(dir) {
    var shots = row.querySelectorAll('.shot');
    var by = shots.length > 1 ? shots[1].offsetLeft - shots[0].offsetLeft : row.clientWidth;
    row.scrollBy({ left: dir * by, behavior: still && still.matches ? 'auto' : 'smooth' });
  }

  function update() {
    prev.disabled = row.scrollLeft <= 1;
    next.disabled = row.scrollLeft >= row.scrollWidth - row.clientWidth - 1;
  }

  prev.addEventListener('click', function () { step(-1); });
  next.addEventListener('click', function () { step(1); });
  row.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  nav.hidden = false;
  update();
})();
