(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Theme toggle */
  var btn = document.querySelector('.theme-btn');
  function syncThemeUI() {
    var t = root.getAttribute('data-theme');
    if (btn) btn.setAttribute('aria-label', t === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', t === 'light' ? '#f5f7f6' : '#0a0e0c');
  }
  syncThemeUI();
  if (btn) btn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncThemeUI();
  });

  /* Diagram connectors */
  var NS = 'http://www.w3.org/2000/svg';
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rel(el, box) {
    var r = el.getBoundingClientRect();
    var o = { l: r.left - box.left, r: r.right - box.left, t: r.top - box.top, b: r.bottom - box.top };
    o.cx = (o.l + o.r) / 2; o.cy = (o.t + o.b) / 2;
    return o;
  }
  function edgePath(a, b) {
    var x1, y1, x2, y2, d, k;
    if (b.l >= a.r - 2) {
      y1 = clamp(b.cy, a.t + 14, a.b - 14); y2 = clamp(a.cy, b.t + 14, b.b - 14);
      x1 = a.r; x2 = b.l; k = (x2 - x1) / 2;
      d = 'M' + x1 + ' ' + y1 + 'C' + (x1 + k) + ' ' + y1 + ' ' + (x2 - k) + ' ' + y2 + ' ' + x2 + ' ' + y2;
    } else if (b.r <= a.l + 2) {
      y1 = clamp(b.cy, a.t + 14, a.b - 14); y2 = clamp(a.cy, b.t + 14, b.b - 14);
      x1 = a.l; x2 = b.r; k = (x1 - x2) / 2;
      d = 'M' + x1 + ' ' + y1 + 'C' + (x1 - k) + ' ' + y1 + ' ' + (x2 + k) + ' ' + y2 + ' ' + x2 + ' ' + y2;
    } else if (b.t >= a.b - 2) {
      x1 = clamp(b.cx, a.l + 18, a.r - 18); x2 = clamp(a.cx, b.l + 18, b.r - 18);
      y1 = a.b; y2 = b.t; k = (y2 - y1) / 2;
      d = 'M' + x1 + ' ' + y1 + 'C' + x1 + ' ' + (y1 + k) + ' ' + x2 + ' ' + (y2 - k) + ' ' + x2 + ' ' + y2;
    } else {
      x1 = clamp(b.cx, a.l + 18, a.r - 18); x2 = clamp(a.cx, b.l + 18, b.r - 18);
      y1 = a.t; y2 = b.b; k = (y1 - y2) / 2;
      d = 'M' + x1 + ' ' + y1 + 'C' + x1 + ' ' + (y1 - k) + ' ' + x2 + ' ' + (y2 + k) + ' ' + x2 + ' ' + y2;
    }
    return { d: d, x: x2, y: y2 };
  }
  function draw(dg) {
    var svg = dg.querySelector('.wires');
    var box = dg.getBoundingClientRect();
    if (!box.width) return;
    var narrow = getComputedStyle(dg).getPropertyValue('--narrow').trim() === '1';
    var spec = (narrow && dg.getAttribute('data-edges-narrow')) || dg.getAttribute('data-edges');
    svg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    spec.split(',').forEach(function (e) {
      var ids = e.trim().split('>');
      var A = dg.querySelector('[data-node="' + ids[0] + '"]');
      var B = dg.querySelector('[data-node="' + ids[1] + '"]');
      if (!A || !B) return;
      var p = edgePath(rel(A, box), rel(B, box));
      ['w', 'f'].forEach(function (c) {
        var path = document.createElementNS(NS, 'path');
        path.setAttribute('d', p.d); path.setAttribute('class', c);
        svg.appendChild(path);
      });
      var dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y); dot.setAttribute('r', 3);
      dot.setAttribute('class', 'end');
      svg.appendChild(dot);
    });
  }
  var dgs = [].slice.call(document.querySelectorAll('.dg'));
  function drawAll() { dgs.forEach(draw); }
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function (entries) { entries.forEach(function (en) { draw(en.target); }); });
    dgs.forEach(function (d) { ro.observe(d); });
  } else {
    window.addEventListener('resize', drawAll);
  }
  drawAll();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawAll);
  window.addEventListener('load', drawAll);

  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle('live', en.isIntersecting); });
    }, { rootMargin: '0px 0px -10% 0px' });
    dgs.forEach(function (d) { io.observe(d); });
  }

  /* Fade out before leaving for another page on this site */
  if (!reduce) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target || a.hasAttribute('download') || a.origin !== location.origin) return;
      if (a.pathname === location.pathname && a.search === location.search) return;
      e.preventDefault();
      var moved = window.__pillTo ? window.__pillTo(a.pathname) : false;
      root.classList.add('leaving');
      setTimeout(function () { location.href = a.href; }, moved ? 380 : 180);
    });
  }
  window.addEventListener('pageshow', function (e) { if (e.persisted) root.classList.remove('leaving'); });

  /* Certificate preview: page images in a dialog, with open-in-tab and download */
  var dlg = document.querySelector('.cert-dlg'), cdata = document.getElementById('cert-data');
  if (dlg && cdata && typeof dlg.showModal === 'function') {
    var certs = JSON.parse(cdata.textContent), dBody = dlg.querySelector('.dlg-body'), lastOpen = null;
    function closeDlg() {
      if (!dlg.open || dlg.classList.contains('closing')) return;
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      dlg.classList.add('closing');
      setTimeout(function () { dlg.classList.remove('closing'); dlg.close(); }, reduce ? 0 : 170);
    }
    dlg.addEventListener('close', function () {
      root.classList.remove('dlg-lock');
      if (lastOpen) lastOpen.focus();
    });
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); closeDlg(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closeDlg(); });
    dlg.querySelector('.dlg-x').addEventListener('click', closeDlg);
    [].forEach.call(document.querySelectorAll('.cert-open'), function (a) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        var c = certs[a.getAttribute('data-cert')]; if (!c) return;
        e.preventDefault(); lastOpen = a;
        dlg.querySelector('#dlg-h').textContent = c.title;
        dlg.querySelector('.dlg-sub').textContent = c.pages.length > 1 ? c.pages.length + ' pages, scroll to read' : 'Certificate, 1 page';
        dlg.querySelector('.dlg-tab').href = c.pdf;
        var dl = dlg.querySelector('.dlg-dl'); dl.href = c.pdf; dl.setAttribute('download', c.file);
        dBody.innerHTML = '';
        c.pages.forEach(function (pg, i) {
          var img = new Image(); img.src = pg[0]; img.width = pg[1]; img.height = pg[2]; img.decoding = 'async';
          img.alt = c.title + (c.pages.length > 1 ? ', page ' + (i + 1) + ' of ' + c.pages.length : '');
          dBody.appendChild(img);
        });
        root.classList.add('dlg-lock');
        dlg.showModal(); dBody.scrollTop = 0;
        dlg.querySelector('.dlg-x').focus();
      });
    });
  }

  /* Active-page pill: slides from the last page's tab to this one, with a small bounce */
  var bars = [['nav', document.querySelector('.nav-links')], ['tab', document.querySelector('.tabbar ul')]];
  function activeIn(ul) { return ul.querySelector('a[aria-current="page"]'); }
  function rectIn(ul, el) {
    var u = ul.getBoundingClientRect(), r = el.getBoundingClientRect();
    return { x: r.left - u.left, y: r.top - u.top, w: r.width, h: r.height };
  }
  function put(ind, r) {
    ind.style.transform = 'translate(' + r.x + 'px,' + r.y + 'px)';
    ind.style.width = r.w + 'px'; ind.style.height = r.h + 'px';
  }
  function placeAll(animate) {
    bars.forEach(function (b) {
      var ul = b[1]; if (!ul) return;
      var ind = ul.querySelector('.pill-ind'), el = activeIn(ul);
      if (!ind || !el || !ul.offsetWidth) return;
      var to = rectIn(ul, el), from = null;
      if (animate && !reduce) { try { from = JSON.parse(sessionStorage.getItem('pill-' + b[0])); } catch (e) {} }
      ind.classList.remove('moving');
      if (from && Math.abs(from.x - to.x) > 1) {
        put(ind, { x: from.x, y: to.y, w: from.w, h: to.h });
        ul.classList.add('has-pill');
        ind.offsetWidth;
        ind.classList.add('moving');
        put(ind, to);
      } else {
        put(ind, to);
        ul.classList.add('has-pill');
      }
    });
  }
  var clickedTo = false;
  function tabFor(ul, path) {
    var best = null, len = -1, root = (ul.querySelector('a[href]') || {}).pathname;
    [].forEach.call(ul.children, function (li) {
      var t = li.querySelector(':scope > a'); if (!t) return;
      var p = t.pathname; if (!p) return;
      var hit = p === root ? (path === p || path === p + 'index.html') : path.indexOf(p) === 0;
      if (hit && p.length > len) { best = t; len = p.length; }
    });
    return best;
  }
  /* On click: slide the pill to the tab being opened, and remember where it landed */
  window.__pillTo = function (path) {
    var moved = false;
    bars.forEach(function (b) {
      var ul = b[1]; if (!ul || !ul.offsetWidth) return;
      var ind = ul.querySelector('.pill-ind'), el = tabFor(ul, path);
      if (!ind || !el) return;
      var r = rectIn(ul, el);
      try { sessionStorage.setItem('pill-' + b[0], JSON.stringify(r)); } catch (e) {}
      if (el !== activeIn(ul)) { ind.classList.add('moving'); put(ind, r); moved = true; }
    });
    clickedTo = true;
    return moved;
  };
  function savePills() {
    if (clickedTo) return;
    bars.forEach(function (b) {
      var ul = b[1]; if (!ul || !ul.offsetWidth) return;
      var el = activeIn(ul); if (!el) return;
      try { sessionStorage.setItem('pill-' + b[0], JSON.stringify(rectIn(ul, el))); } catch (e) {}
    });
  }
  bars.forEach(function (b) {
    var ind = b[1] && b[1].querySelector('.pill-ind');
    if (ind) ind.addEventListener('transitionend', function (e) { if (e.propertyName === 'transform') ind.classList.remove('moving'); });
  });
  placeAll(true);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!document.querySelector('.pill-ind.moving')) placeAll(false); });
  var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { placeAll(false); }, 80); });
  window.addEventListener('pagehide', savePills);

  window.addEventListener('pageshow', function (e) { if (e.persisted) { clickedTo = false; placeAll(false); } });
})();
