/* Fabric size calculator: stitches ÷ fabric count = inches.
 * The page supplies the unit labels and which unit leads (data-unit-in,
 * data-unit-cm, data-primary on the form), so this file carries no copy and
 * numbers follow the page language's decimal mark. Without JS the form shows
 * the formula in a <noscript> note instead. */
(function () {
  var form = document.getElementById('calc');
  if (!form) return;

  var CM = 2.54;
  // Aida counts are stitched over one square; evenweave and linen counts over two threads.
  var TABLE = [[11, 1], [14, 1], [16, 1], [18, 1], [20, 1], [22, 1], [25, 2], [28, 2], [32, 2], [36, 2], [40, 2]];

  var fmt = new Intl.NumberFormat(document.documentElement.lang || 'en', { maximumFractionDigits: 1 });
  var units = { 'in': form.getAttribute('data-unit-in') || 'in', cm: form.getAttribute('data-unit-cm') || 'cm' };
  var primary = form.getAttribute('data-primary') === 'in' ? 'in' : 'cm';

  var el = {
    w: document.getElementById('calcW'), h: document.getElementById('calcH'),
    count: document.getElementById('calcCount'), over: document.getElementById('calcOver'),
    margin: document.getElementById('calcMargin'), unit: document.getElementById('calcUnit'),
    size: document.getElementById('calcSize'), cut: document.getElementById('calcCut'),
    rows: document.querySelector('#calcTable tbody')
  };
  el.unit.value = primary;

  function number(input, min, max) {
    var v = parseFloat(String(input.value).replace(',', '.'));
    return isFinite(v) ? Math.min(max, Math.max(min, v)) : NaN;
  }

  function dims(wIn, hIn, unit) {
    var k = unit === 'cm' ? CM : 1;
    var label = units[unit];
    // A prime mark sits against the number; a word or abbreviation takes a space.
    return fmt.format(wIn * k) + ' × ' + fmt.format(hIn * k) + (label === '″' ? '' : ' ') + label;
  }

  function both(wIn, hIn) {
    var other = primary === 'in' ? 'cm' : 'in';
    return dims(wIn, hIn, primary) + ' (' + dims(wIn, hIn, other) + ')';
  }

  function update() {
    var w = number(el.w, 1, 5000), h = number(el.h, 1, 5000);
    var count = parseFloat(el.count.value), over = parseFloat(el.over.value);
    var margin = number(el.margin, 0, 50);
    if (!isFinite(w) || !isFinite(h)) {
      el.size.textContent = el.cut.textContent = '—';
      el.rows.textContent = '';
      return;
    }
    var perInch = count / over;
    var wIn = w / perInch, hIn = h / perInch;
    var m = (isFinite(margin) ? margin : 0) / (el.unit.value === 'cm' ? CM : 1);
    el.size.textContent = both(wIn, hIn);
    el.cut.textContent = both(wIn + 2 * m, hIn + 2 * m);

    el.rows.textContent = '';
    TABLE.forEach(function (row) {
      var tr = document.createElement('tr');
      if (row[0] === count && row[1] === over) tr.className = 'current';
      var cells = [row[0] + ' ct' + (row[1] === 2 ? ' ÷ 2' : ''),
                   dims(w * row[1] / row[0], h * row[1] / row[0], 'in'),
                   dims(w * row[1] / row[0], h * row[1] / row[0], 'cm')];
      cells.forEach(function (text, i) {
        var cell = document.createElement(i === 0 ? 'th' : 'td');
        if (i === 0) cell.scope = 'row';
        cell.textContent = text;
        tr.appendChild(cell);
      });
      el.rows.appendChild(tr);
    });
  }

  // Evenweave and linen counts default to "over two" when picked; Aida counts to one.
  el.count.addEventListener('change', function () {
    el.over.value = parseFloat(el.count.value) >= 25 ? '2' : '1';
  });
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  update();
})();
