/* Motor das dicas em vídeo da R3. Lê window.__SPEC (JSON) e expõe window.__render(t) e window.__DURATION.
   Tela do Windows simulada em coordenadas lógicas 640x569 (ampliada 1.6875x na câmera). */
(function () {
  var SPEC = window.__SPEC;
  function $(id) { return document.getElementById(id); }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function seg(v, a, b) { return clamp01((v - a) / (b - a)); }
  function ease(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  var COLORS = ['#7CAFDD', '#5B9BD5', '#C9CDD1'];
  var CHECK = '<svg viewBox="0 0 24 24"><path d="M6 12.5l4 4L18 8" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------- área de trabalho ---------- */
  var desk = SPEC.desktop || ['Fotos', 'Documentos', 'Trabalho'];
  var dh = '';
  desk.forEach(function (n, i) {
    dh += '<div class="dicon" style="top:' + (24 + i * 80) + 'px"><div class="f" style="background:' + COLORS[i % 3] + '"><div class="ok">' + CHECK + '</div></div><span class="l">' + esc(n) + '</span></div>';
  });
  $('desk').innerHTML = dh;
  var oks = document.querySelectorAll('.dicon .ok');

  /* ---------- toast ---------- */
  var hook = SPEC.hook || {};
  if (hook.toast) { $('toastT').textContent = hook.toast.title; $('toastB').textContent = hook.toast.body; }
  var hasToast = !!hook.toast;

  /* ---------- janela e menu lateral ---------- */
  var WIN = SPEC.window || { title: 'Configurações', nav: [] };
  $('winTitle').textContent = WIN.title;
  var nav = WIN.nav || [];
  var nh = '';
  nav.forEach(function (n, i) { nh += '<div class="ni" id="ni' + i + '" style="top:' + (88 + i * 36) + 'px">' + esc(n) + '</div>'; });
  $('navs').innerHTML = nh;

  /* ---------- páginas ---------- */
  var PAGES = SPEC.pages;
  var geo = []; /* geometria de cada linha, por página */
  var ph = '';
  PAGES.forEach(function (p, pi) {
    var rows = p.rows || [];
    var hasChecks = rows.some(function (r) { return 'checked' in r; });
    var top0 = p.rowsTop || (p.card ? 198 : (p.final ? 150 : (p.subtitle ? 116 : 96)));
    var pitch = hasChecks ? 48 : (p.card ? 52 : 54);
    var rh = pitch - (hasChecks ? 4 : (p.card ? 6 : 6));
    var g = { rows: [], hasChecks: hasChecks };
    var h = '<div class="page" id="pg' + pi + '"><h2 class="pt">' + esc(p.title) + '</h2>';
    if (p.subtitle) h += '<div class="ps">' + esc(p.subtitle) + '</div>';
    if (p.card) {
      h += '<div class="card"><div class="t">' + esc(p.card.title) + '</div>' + (p.card.tag ? '<div class="tag">' + esc(p.card.tag) + '</div>' : '') +
        '<div class="bar"><div style="width:' + (p.card.pct || 90) + '%"></div></div><div class="s">' + esc(p.card.text) + '</div></div>';
    }
    if (p.final) {
      h += '<div class="btnrm" id="btn' + pi + '">' + esc(p.final.button) + '</div>' +
        '<div class="tot" id="tot' + pi + '">' + esc(p.final.total || '') + '</div>' +
        '<div class="done" id="done' + pi + '"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#2E7D32"/><path d="M7 12.5l3.2 3.2L17 9" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' + esc(p.final.done || 'Pronto!') + '</div>' +
        '<div class="prog" id="prog' + pi + '"><div id="fill' + pi + '"></div></div>';
    }
    rows.forEach(function (r, j) {
      var y = top0 + j * pitch;
      g.rows.push({ y: y, h: rh });
      if (hasChecks) {
        h += '<div class="row" id="r' + pi + '_' + j + '" style="top:' + y + 'px;height:' + rh + 'px"><div class="cb' + (r.checked ? ' on' : '') + '" id="cb' + pi + '_' + j + '"></div>' +
          '<div class="t' + (r.desc ? '' : ' c') + '" style="left:44px;top:' + (r.desc ? 5 : 12) + 'px;font-size:14.5px">' + esc(r.name) + '</div>' +
          (r.desc ? '<div class="s" style="left:44px;top:24px">' + esc(r.desc) + '</div>' : '') +
          (r.warn ? '<div class="nao" id="nao' + pi + '_' + j + '">' + esc(r.warn) + '</div>' : '') +
          (r.size ? '<div class="z" id="sz' + pi + '_' + j + '" style="top:13px">' + esc(r.size) + '</div>' : '') + '</div>';
      } else {
        h += '<div class="row" id="r' + pi + '_' + j + '" style="top:' + y + 'px;height:' + rh + 'px"><div class="ic" style="top:' + Math.round((rh - 20) / 2) + 'px;background:' + (r.color || COLORS[(j + pi) % 3]) + '"></div>' +
          '<div class="t' + (r.desc ? '' : ' c') + '" style="' + (r.desc ? '' : 'top:' + Math.round((rh - 20) / 2) + 'px') + '">' + esc(r.name) + '</div>' +
          (r.desc ? '<div class="s">' + esc(r.desc) + '</div>' : '') +
          (r.size ? '<div class="z" style="top:' + Math.round((rh - 18) / 2) + 'px">' + esc(r.size) + '</div>' : '') +
          (r.chev ? '<div class="chev" style="top:' + Math.round((rh - 24) / 2) + 'px">›</div>' : '') + '</div>';
      }
    });
    h += '</div>';
    ph += h;
  });
  $('pages').innerHTML = ph;

  /* ---------- teclas ---------- */
  var KEYS = (SPEC.keys && SPEC.keys.keys) || [];
  var kh = '';
  KEYS.forEach(function (k, i) {
    if (i) kh += '<div class="plus">+</div>';
    if (String(k).toLowerCase() === 'win') kh += '<div class="key" data-k="1"><div class="wl"><i></i><i></i><i></i><i></i></div></div>';
    else kh += '<div class="key' + (String(k).length > 1 ? ' txt' : '') + '" data-k="1">' + esc(k) + '</div>';
  });
  $('keys').innerHTML = kh;
  var keyEls = document.querySelectorAll('#keys .key');

  /* ---------- linha do tempo ---------- */
  var T = {}; /* marcos */
  T.hook = 0; T.reassure = 4; T.keys = 8;
  var KDUR = 6;
  T.win = T.keys + 3.6; /* a janela abre */
  var steps = [];
  var cur = 0, s = T.keys + KDUR, pageAt = [{ t: T.win + 0.3, page: 0 }];
  var cx = 420, cy = 330, path = [[0, 420, 330], [T.keys + 5.0, 420, 330]];
  var clicks = [], rings = [], warns = [], finals = [];
  var NSTEPS = (SPEC.steps || []).length + 1;
  var captions = [
    { a: T.hook, badge: 'DICA RÁPIDA', title: hook.title, sub: hook.sub },
    { a: T.reassure, badge: 'DICA RÁPIDA', title: (SPEC.reassure || {}).title || 'Seus arquivos ficam salvos.', sub: (SPEC.reassure || {}).sub || 'Nada seu é apagado.' },
    { a: T.keys, badge: 'PASSO 1 DE ' + NSTEPS, title: (SPEC.keys || {}).title, sub: (SPEC.keys || {}).sub }
  ];
  (SPEC.steps || []).forEach(function (st, i) {
    var list = Array.isArray(st.click) ? st.click : [st.click];
    var final = !!st.final;
    var D = final ? 6 : 2.4 + (list.length - 1) * 3 + 3.6 + (st.warn ? 6 : 0);
    var cap = { a: s, badge: 'PASSO ' + (i + 2) + ' DE ' + NSTEPS, title: st.title, sub: st.sub };
    captions.push(cap);
    list.forEach(function (ck, n) {
      var tx, ty, ring;
      if (ck.nav != null) {
        var ny = 88 + ck.nav * 36;
        tx = 95; ty = ny + 16; ring = { l: 26, t: ny - 2, w: 178, h: 36 };
      } else if (ck.row != null) {
        var gr = geoOf(cur, ck.row);
        tx = 320; ty = gr.y + gr.h / 2; ring = { l: 226, t: gr.y - 2, w: 378, h: gr.h + 4 };
      } else {
        tx = 305; ty = 119; ring = { l: 226, t: 100, w: 158, h: 38 };
      }
      var clickT = s + (final ? 2.0 : 2.4) + n * 3;
      path.push([clickT - 1.6, cx, cy]); path.push([clickT - 0.4, tx, ty]); path.push([clickT + 0.2, tx, ty]);
      cx = tx; cy = ty;
      clicks.push({ t: clickT, x: tx, y: ty });
      rings.push({ a: clickT - 1.0, b: clickT + 0.2, l: ring.l, t: ring.t, w: ring.w, h: ring.h });
      if (final) {
        finals.push({ page: cur, t0: clickT + 0.2, t1: clickT + 2.8 });
        if (st.sub2) cap.sub2 = { t: clickT + 3.0, text: st.sub2 };
        path.push([clickT + 4.5, tx, ty]); path.push([clickT + 5.5, 430, 440]);
        return;
      }
      var g2 = ck.goto != null ? ck.goto : cur + 1;
      pageAt.push({ t: clickT + 0.3, page: g2 });
      if (st.warn && n === list.length - 1) {
        var wj = -1;
        (PAGES[g2].rows || []).forEach(function (r, j) { if (r.warn) wj = j; });
        if (wj >= 0) {
          var wg = geoOf(g2, wj);
          var wa = clickT + 1.4, wb = s + D - 0.6;
          warns.push({ a: wa, b: wb, page: g2, row: wj, l: 224, t: wg.y - 2, w: 382, h: wg.h + 4 });
          path.push([clickT + 0.9, tx, ty]); path.push([clickT + 1.9, 398, wg.y + wg.h / 2]); path.push([wb, 398, wg.y + wg.h / 2]);
          cx = 398; cy = wg.y + wg.h / 2;
        }
      }
      cur = g2;
    });
    s += D;
  });
  var E = s; /* fim dos passos */
  T.outro = E - 0.4;
  var DURATION = E + 8.0;
  path.push([DURATION + 5, cx, cy]);
  window.__DURATION = DURATION;
  window.__CAPTIONS = captions;
  window.__TOTAL_STEPS = NSTEPS;

  function geoOf(pi, j) {
    var p = PAGES[pi], rows = p.rows || [];
    var hasChecks = rows.some(function (r) { return 'checked' in r; });
    var top0 = p.rowsTop || (p.card ? 198 : (p.final ? 150 : (p.subtitle ? 116 : 96)));
    var pitch = hasChecks ? 48 : (p.card ? 52 : 54);
    var rh = pitch - (hasChecks ? 4 : 6);
    return { y: top0 + j * pitch, h: rh };
  }

  /* ---------- elementos ---------- */
  var el = {
    toast: $('toast'), win: $('win'), cursor: $('cursor'), chip: $('chip'), dim: $('dim'), keys: $('keys'),
    badge: $('badge'), cap: $('cap'), capTitle: $('capTitle'), capSub: $('capSub'), rg: $('rg'), rA: $('rA'), rp: $('rp'),
    outro: $('outro'), gA: $('gA'), gB: $('gB'), dots: $('dots')
  };
  var dh2 = '';
  for (var d0 = 0; d0 < NSTEPS; d0++) dh2 += '<i></i>';
  el.dots.innerHTML = dh2;
  var dotEls = el.dots.children;
  el.chip.textContent = SPEC.chip || '';
  var pageEls = PAGES.map(function (_, i) { return $('pg' + i); });

  function track(v) {
    if (v <= path[0][0]) return [path[0][1], path[0][2]];
    for (var i = 1; i < path.length; i++) {
      if (v <= path[i][0]) {
        var p = path[i - 1], q = path[i], k = ease(seg(v, p[0], q[0]));
        return [p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k];
      }
    }
    var l = path[path.length - 1];
    return [l[1], l[2]];
  }

  function render(v) {
    /* aviso e ícones protegidos */
    var tIn = hasToast ? ease(seg(v, 0.3, 0.8)) : 0, tOut = seg(v, 5.2, 5.8);
    el.toast.style.opacity = tIn * (1 - tOut);
    el.toast.style.transform = 'translateY(' + ((1 - tIn) * 20) + 'px)';
    el.toast.style.boxShadow = '0 0 0 ' + (2 + 3 * (0.5 + 0.5 * Math.sin(v * 6))) + 'px rgba(178,106,0,.28), 0 8px 24px rgba(0,0,0,.2)';
    for (var i = 0; i < oks.length; i++) {
      var q = ease(seg(v, 4.5 + i * 0.25, 5.0 + i * 0.25));
      oks[i].style.opacity = q;
      oks[i].style.transform = 'scale(' + (0.6 + 0.4 * q) + ')';
    }

    /* teclas */
    var kv = seg(v, T.keys + 0.6, T.keys + 1.2) * (1 - seg(v, T.keys + 3.6, T.keys + 4.0));
    el.keys.style.opacity = kv;
    el.keys.style.transform = 'scale(' + (0.9 + 0.1 * ease(seg(v, T.keys + 0.6, T.keys + 1.2))) + ')';
    el.dim.style.opacity = kv;
    var pressed = v >= T.keys + 2.4 && v < T.keys + 3.3;
    for (var k = 0; k < keyEls.length; k++) keyEls[k].classList.toggle('press', pressed);

    /* janela */
    var w = ease(seg(v, T.win, T.win + 0.8));
    el.win.style.opacity = w;
    el.win.style.visibility = w > 0 ? 'visible' : 'hidden';
    el.win.style.transform = 'scale(' + (0.94 + 0.06 * w) + ')';

    /* páginas e menu ativo */
    var curPage = 0;
    for (var a = 0; a < pageAt.length; a++) if (v >= pageAt[a].t) curPage = pageAt[a].page;
    var pg = PAGES[curPage];
    nav.forEach(function (n, i) { $('ni' + i).classList.toggle('active', pg.nav === i); });
    for (var pi = 0; pi < PAGES.length; pi++) {
      var tin = null, tout = null;
      for (var b = 0; b < pageAt.length; b++) {
        if (pageAt[b].page === pi && tin === null) tin = pageAt[b].t;
        if (b > 0 && pageAt[b - 1].page === pi && tout === null) tout = pageAt[b].t;
      }
      var op = tin === null ? 0 : seg(v, tin, tin + 0.3) * (tout === null ? 1 : 1 - seg(v, tout, tout + 0.3));
      pageEls[pi].style.opacity = op;
    }

    /* remoção (página final) */
    finals.forEach(function (f) {
      var removing = v >= f.t0 && v < f.t1, finished = v >= f.t1;
      var btn = $('btn' + f.page);
      btn.textContent = removing ? (PAGES[f.page].final.busy || 'Removendo…') : PAGES[f.page].final.button;
      btn.classList.toggle('off', removing || finished);
      $('tot' + f.page).style.display = (!removing && !finished) ? '' : 'none';
      $('done' + f.page).style.opacity = finished ? ease(seg(v, f.t1, f.t1 + 0.5)) : 0;
      $('prog' + f.page).style.opacity = removing ? 1 : 0;
      $('fill' + f.page).style.width = (seg(v, f.t0 + 0.2, f.t1 - 0.2) * 100) + '%';
      (PAGES[f.page].rows || []).forEach(function (r, j) {
        if (!r.checked) return;
        $('cb' + f.page + '_' + j).classList.toggle('on', !finished);
        var sz = $('sz' + f.page + '_' + j);
        if (sz) sz.textContent = finished ? '0 MB' : r.size;
        $('r' + f.page + '_' + j).classList.toggle('dim2', finished);
      });
    });

    /* cursor, cliques e destaques */
    var c = track(v);
    el.cursor.style.transform = 'translate(' + c[0] + 'px,' + c[1] + 'px)';
    el.cursor.style.opacity = seg(v, T.keys + 5.0, T.keys + 5.5) * (1 - seg(v, E - 0.6, E - 0.2));
    var rg = 0, rpOp = 0, rpTr = 'translate(-100px,-100px)';
    clicks.forEach(function (kk, n) {
      var p = seg(v, kk.t, kk.t + 0.6);
      if (p > 0 && p < 1) { rpOp = (1 - p) * 0.9; rpTr = 'translate(' + (kk.x - 14) + 'px,' + (kk.y - 14) + 'px) scale(' + (0.3 + 1.3 * ease(p)) + ')'; }
      var r = rings[n];
      var vis = seg(v, r.a, r.a + 0.3) * (1 - seg(v, r.b - 0.2, r.b));
      if (vis > 0) {
        rg = vis * (0.75 + 0.25 * Math.sin(v * 8));
        el.rg.style.left = r.l + 'px'; el.rg.style.top = r.t + 'px'; el.rg.style.width = r.w + 'px'; el.rg.style.height = r.h + 'px';
      }
    });
    el.rg.style.opacity = rg;
    el.rp.style.opacity = rpOp; el.rp.style.transform = rpTr;
    var am = 0;
    warns.forEach(function (wn) {
      var m = seg(v, wn.a, wn.a + 0.3) * (1 - seg(v, wn.b - 0.3, wn.b));
      var nao = $('nao' + wn.page + '_' + wn.row);
      if (nao) nao.style.opacity = m;
      if (m > 0) {
        am = m;
        el.rA.style.left = wn.l + 'px'; el.rA.style.top = wn.t + 'px'; el.rA.style.width = wn.w + 'px'; el.rA.style.height = wn.h + 'px';
      }
    });
    el.rA.style.opacity = am * (0.7 + 0.3 * Math.sin(v * 7));
    el.chip.style.opacity = SPEC.chip ? seg(v, T.win + 1.6, T.win + 2.0) * (1 - seg(v, E - 0.6, E - 0.2)) : 0;

    /* legenda */
    var idx = 0;
    for (var s2 = 0; s2 < captions.length; s2++) if (v >= captions[s2].a) idx = s2;
    var S = captions[idx];
    el.badge.textContent = S.badge;
    el.capTitle.textContent = S.title;
    el.capSub.textContent = (S.sub2 && v >= S.sub2.t) ? S.sub2.text : S.sub;
    var cq = idx === 0 ? 1 : ease(seg(v, S.a, S.a + 0.35));
    el.cap.style.opacity = cq;
    el.cap.style.transform = 'translateY(' + ((1 - cq) * 16) + 'px)';
    el.dots.style.opacity = idx >= 2 ? 1 : 0;
    for (var d = 0; d < dotEls.length; d++) dotEls[d].classList.toggle('on', idx >= 2 && d <= idx - 2);

    /* encerramento */
    var o0 = T.outro;
    var oo = seg(v, o0, o0 + 0.6);
    el.outro.style.opacity = oo;
    el.outro.style.visibility = oo > 0 ? 'visible' : 'hidden';
    var ga = ease(seg(v, o0 + 0.7, o0 + 1.3)) * (1 - seg(v, o0 + 4.0, o0 + 4.4));
    el.gA.style.opacity = ga;
    el.gA.style.transform = 'translateY(' + ((1 - ease(seg(v, o0 + 0.7, o0 + 1.3))) * 24) + 'px)';
    var gb = ease(seg(v, o0 + 4.4, o0 + 5.0));
    el.gB.style.opacity = gb;
    el.gB.style.transform = 'translateY(' + ((1 - gb) * 24) + 'px)';
  }
  window.__render = render;
  window.__DURATION = o0Total();
  function o0Total() { return T.outro + 8.6; }
  render(0);
})();
