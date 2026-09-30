/* Relvor component helpers. Each returns HTML built only from classes in
   components.css, so screens compose rather than restyle. */
(function () {
  var I = function (n, c) { return Hub.icon(n, c); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function attrs(o) { if (!o) return ''; return Object.keys(o).filter(function (k) { return o[k] != null && o[k] !== false; }).map(function (k) { return ' ' + k + (o[k] === true ? '' : '="' + esc(o[k]) + '"'); }).join(''); }
  function dataAttrs(d) { var o = {}; if (d) Object.keys(d).forEach(function (k) { o['data-' + k] = d[k]; }); return o; }
  function initials(name) { return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); }
  /* A stable, muted hue per person so avatars are distinguishable
     without becoming a colour scheme of their own. */
  var HUES = [250, 215, 180, 150, 95, 55, 25, 330, 290];
  function hue(name) { var h = 0; String(name).split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) >>> 0; }); return HUES[h % HUES.length]; }

  var ui = {
    esc: esc, initials: initials,

    avatar: function (name, size, extra) {
      return '<span class="avatar' + (size ? ' avatar--' + size : '') + (extra ? ' ' + extra : '') + '" style="--h:' + hue(name) + '" aria-hidden="true">' + esc(initials(name)) + '</span>';
    },

    pageHead: function (o) {
      return '<header class="page-head"><div class="page-head__text">' +
        (o.overline ? '<div class="overline">' + esc(o.overline) + '</div>' : '') +
        '<h1 class="page-title">' + esc(o.title) + '</h1>' +
        (o.sub ? '<p class="page-sub">' + o.sub + '</p>' : '') + '</div>' +
        (o.actions ? '<div class="page-head__actions">' + o.actions + '</div>' : '') + '</header>';
    },

    sectionHead: function (title, o) {
      o = o || {};
      return '<div class="section-head"><h2 class="section-title">' + esc(title) + (o.meta ? '<span class="meta">' + o.meta + '</span>' : '') + '</h2>' +
        (o.link ? '<a class="section-link" href="' + o.href + '">' + esc(o.link) + I('chevron', 'icon-sm') + '</a>' : '') + (o.right || '') + '</div>';
    },

    btn: function (label, o) {
      o = o || {};
      var cls = 'btn' + (o.variant ? ' btn--' + o.variant : '') + (o.size ? ' btn--' + o.size : '') + (o.block ? ' btn--block' : '') + (o.cls ? ' ' + o.cls : '');
      var inner = (o.icon ? I(o.icon) : '') + (label ? '<span>' + esc(label) + '</span>' : '') + (o.trail ? I(o.trail, 'icon-sm') : '');
      if (o.href) return '<a class="' + cls + '" href="' + o.href + '"' + attrs(o.attrs) + '>' + inner + '</a>';
      return '<button type="button" class="' + cls + '"' + attrs(o.attrs) + '>' + inner + '</button>';
    },

    iconBtn: function (icon, label, a) { return '<button type="button" class="icon-btn" aria-label="' + esc(label) + '"' + attrs(a) + '>' + I(icon) + '</button>'; },

    status: function (text, tone) { return '<span class="status' + (tone ? ' status--' + tone : '') + '">' + esc(text) + '</span>'; },
    tag: function (text, tone) { return '<span class="tag' + (tone ? ' tag--' + tone : '') + '">' + esc(text) + '</span>'; },
    sev: function (severity) { var s = String(severity).toLowerCase(); return '<span class="sev sev--' + s + '" role="img" aria-label="' + esc(severity) + '"></span>'; },
    sevWord: function (severity) { return { Urgent: 'Urgent', Warning: 'Warning', Normal: 'To do' }[severity] || severity; },
    sevTone: function (severity) { return { Urgent: 'danger', Warning: 'warn', Normal: '' }[severity] || ''; },

    /* List row. sub: array of strings joined with dots. stretch: the row
       holds its own buttons, so the tap target is a stretched title. */
    row: function (o) {
      var tag = o.stretch ? 'div' : o.href ? 'a' : (o.action ? 'button' : 'div');
      var a = o.stretch ? {} : o.href ? { href: o.href } : (o.action ? { type: 'button', 'data-action': o.action } : {});
      var d = dataAttrs(o.data);
      var title = o.title;
      if (o.stretch) title = '<button type="button" class="row__link" data-action="' + o.action + '"' + attrs(d) + '>' + title + '</button>';
      else Object.keys(d).forEach(function (k) { a[k] = d[k]; });
      var sub = o.sub && o.sub.filter(Boolean).length ? '<div class="row__sub">' + o.sub.filter(Boolean).map(function (m) { return '<span>' + m + '</span>'; }).join('') + '</div>' : '';
      var trail = o.trail != null ? o.trail : '';
      if ((o.href || o.action) && o.chevron !== false) trail += I('chevron', 'icon-sm chev');
      return '<' + tag + ' class="row' + (o.lead ? '' : ' row--nolead') + (o.cls ? ' ' + o.cls : '') + '"' + attrs(a) + '>' + (o.lead || '') +
        '<div class="row__body"><div class="row__title">' + title + '</div>' + sub + (o.after || '') + '</div><div class="row__trail">' + trail + '</div></' + tag + '>';
    },
    rows: function (list, cls) { return '<div class="rows' + (cls ? ' ' + cls : '') + '">' + list.join('') + '</div>'; },

    /* Lightweight table. cols: CSS grid template; head: labels (with
       optional class); body: rows from tr(). */
    table: function (o) {
      var head = '<div class="tbl__head" role="row">' + o.head.map(function (h) { h = typeof h === 'string' ? { label: h } : h; return '<div role="columnheader" class="' + (h.cls || '') + '">' + esc(h.label) + '</div>'; }).join('') + '</div>';
      return '<div class="tbl" role="table" style="--cols:' + o.cols + '">' + head + o.body + '</div>';
    },
    tr: function (cells, o) {
      o = o || {};
      var link = o.action ? '<button type="button" class="row__link" data-action="' + o.action + '"' + attrs(dataAttrs(o.data)) + ' aria-label="' + esc(o.label || 'Open') + '"></button>' : '';
      return '<div class="tbl__row" role="row">' + cells.map(function (c, i) { c = typeof c === 'string' ? { html: c } : c; return '<div role="cell" class="' + (c.cls || '') + '">' + c.html + (i === 0 ? link : '') + '</div>'; }).join('') + '</div>';
    },
    group: function (label, count, lead) { return '<div class="tbl__group">' + (lead || '') + esc(label) + ' <span class="count">' + count + '</span></div>'; },

    /* Workspace header: module title, context, actions, and the section
       tabs that say which part of the module is in view. */
    workspace: function (o) {
      /* Index tabs: a boxed tab per section, each carrying its own state
         line, so the tabs themselves say where attention is needed. */
      var tabs = (o.tabs || []).map(function (t) {
        var sel = t.id === o.active;
        var meta = t.meta != null ? t.meta : (t.count != null ? String(t.count) : '');
        return '<button type="button" class="glide__tab" role="tab" aria-selected="' + sel + '" data-action="wstab" data-ws="' + esc(o.id) + '" data-tab="' + esc(t.id) + '">' +
          '<span class="glide__label">' + esc(t.label) + '</span>' +
          '<span class="glide__meta">' + (t.state ? ui.sev(t.state) : '') + '<span>' + meta + '</span></span></button>';
      }).join('');
      return '<header class="ws"><div class="ws__inner">' +
        '<div class="ws__top"><div class="ws__text">' + (o.overline ? '<div class="overline">' + esc(o.overline) + '</div>' : '') +
        '<h1 class="ws__title">' + esc(o.title) + '</h1>' + (o.sub ? '<div class="summary-line ws__sub"><p>' + o.sub + '</p></div>' : '') + '</div>' +
        (o.actions ? '<div class="ws__actions">' + o.actions + '</div>' : '') + '</div>' +
        (tabs ? '<nav class="glide" data-glide="ws-' + esc(o.id) + '" role="tablist" aria-label="' + esc(o.title) + ' sections"><span class="glide__puck" aria-hidden="true"></span>' + tabs + '</nav>' : '') +
        '</div></header>';
    },

    /* Chapter: the editorial divider between major zones of a page */
    chapter: function (title, o) {
      o = o || {};
      return '<div class="chapter"><h2 class="chapter__title">' + esc(title) + (o.meta ? '<span class="chapter__meta">' + o.meta + '</span>' : '') + '</h2><span class="chapter__rule" aria-hidden="true"></span>' +
        (o.link ? '<a class="section-link" href="' + o.href + '">' + esc(o.link) + I('chevron', 'icon-sm') + '</a>' : (o.right || '<span></span>')) + '</div>';
    },

    /* ---- Signature patterns ---- */
    tok: function (text, tone, href) {
      var cls = 'tok' + (tone ? ' tok--' + tone : '');
      return href ? '<a class="' + cls + '" href="' + href + '">' + text + '</a>' : '<span class="' + cls + '">' + text + '</span>';
    },
    brief: function (o) {
      return '<section class="brief" aria-label="Brief"><div class="brief__kicker">' + esc(o.kicker) + '</div>' +
        '<h1 class="brief__title">' + esc(o.title) + '</h1>' + o.lines.map(function (l) { return '<p class="brief__text">' + l + '</p>'; }).join('') +
        (o.changes && o.changes.length ? '<div class="changes"><div class="changes__head">Since your last visit, <b>' + esc(o.since) + '</b></div><ul class="changes__list">' + o.changes.map(function (c) {
          var inner = c.key ? '<a href="#" data-action="case" data-key="' + esc(c.key) + '">' + esc(c.text) + '</a>' : c.href ? '<a href="' + c.href + '">' + esc(c.text) + '</a>' : esc(c.text);
          return '<li class="chg' + (c.tone ? ' chg--' + c.tone : '') + '"><span>' + inner + '</span><time>' + esc(c.time) + '</time></li>';
        }).join('') + '</ul></div>' : '') + '</section>';
    },
    /* Day line: items {title, start, end, state: issue|mine|'', action/href}. */
    dayline: function (o) {
      function h(t) { var p = t.split(':'); return +p[0] + (+p[1]) / 60; }
      var span = o.end - o.start, pct = function (t) { return ((h(t) - o.start) / span * 100).toFixed(3) + '%'; };
      var items = o.items.slice().sort(function (a, b) { return h(a.start) - h(b.start); }), lanes = [];
      items.forEach(function (it) { var l = 0; while (lanes[l] != null && lanes[l] > h(it.start) + 0.001) l++; lanes[l] = h(it.end); it.lane = l; });
      var hours = ''; for (var x = o.start; x <= o.end; x++) hours += '<div class="dayline__hour" style="left:' + ((x - o.start) / span * 100) + '%"><span>' + String(x).padStart(2, '0') + ':00</span></div>';
      var nowH = h(o.now);
      var blocks = items.map(function (it) {
        var past = h(it.end) <= nowH, cls = 'blk' + (it.state === 'issue' ? ' blk--issue' : '') + (it.state === 'mine' ? ' blk--mine' : '') + (past ? ' blk--past' : '');
        var w = ((h(it.end) - h(it.start)) / span * 100).toFixed(3) + '%';
        var inner = (it.state === 'issue' ? ui.sev('Urgent') : '') + '<b>' + esc(it.title) + '</b><small>' + it.start + '</small>';
        var a = it.action ? ' role="button" tabindex="0" data-action="' + it.action + '"' + (it.key ? ' data-key="' + esc(it.key) + '"' : '') : '';
        return '<div class="' + cls + '" style="left:' + pct(it.start) + ';width:calc(' + w + ' - 4px);top:' + (28 + it.lane * 48) + 'px"' + a + ' title="' + esc(it.title + ', ' + it.start + '\u2013' + it.end) + '">' + inner + '</div>';
      }).join('');
      return '<section class="dayline' + (o.ground ? ' dayline--ground' : '') + '" aria-label="' + esc(o.label || 'Day line') + '">' +
        (o.plainHead ? '<div class="dayline__head">' + ui.sectionHead(o.label || 'The day', { meta: o.meta || '' }) + '</div>' : ui.chapter(o.label || 'The day', { meta: o.meta || '', right: o.legend ? '<div class="dayline__legend wide-inline"><span>' + ui.sev('Urgent') + 'Needs a decision</span><span><i class="legend-now"></i>Now</span></div>' : '' })) +
        '<div class="dayline__scroll"><div class="dayline__track" style="--lanes:' + Math.max(1, lanes.length) + ';--now:' + pct(o.now) + '">' +
        '<div class="dayline__elapsed"></div>' + hours + blocks + '<div class="dayline__now" style="left:' + pct(o.now) + '"><span>Now ' + o.now + '</span></div>' +
        '</div></div></section>';
    },
    weekline: function (days) {
      return '<div class="weekline" role="list">' + days.map(function (d) {
        return '<div role="listitem" class="wday' + (d.today ? ' is-today' : '') + (d.past ? ' is-past' : '') + (d.session ? ' has-session' : '') + '"><span>' + esc(d.dow) + '</span><b>' + d.date + '</b><i aria-hidden="true"></i></div>';
      }).join('') + '</div>';
    },
    decision: function (o) {
      return '<article class="decision"><div class="decision__kicker">' + ui.sev('Urgent') + '<span>' + esc(o.kicker) + '</span><span class="when">' + esc(o.when) + '</span></div>' +
        '<h3 class="decision__title">' + esc(o.title) + '</h3><p class="decision__ctx">' + esc(o.ctx) + '</p>' +
        '<div class="decision__actions">' + o.actions + '</div></article>';
    },

    metric: function (label, value, sub, tone) {
      return '<div class="metric' + (tone ? ' metric--' + tone : '') + '"><span class="metric__label">' + esc(label) + '</span><span class="metric__value">' + value + '</span>' + (sub ? '<span class="metric__sub">' + sub + '</span>' : '') + '</div>';
    },

    notice: function (tone, title, body, o) {
      o = o || {};
      var icon = o.icon || { warn: 'attention', danger: 'alertCircle', ok: 'checkCircle', info: 'info', neutral: 'info' }[tone] || 'info';
      return '<div class="notice notice--' + tone + '" role="' + (tone === 'danger' ? 'alert' : 'status') + '">' + I(icon) +
        '<div><div class="notice__title">' + esc(title) + '</div>' + (body ? '<div class="notice__body">' + body + '</div>' : '') + (o.meta ? '<div class="notice__meta">' + esc(o.meta) + '</div>' : '') + '</div>' + (o.action || '<span></span>') + '</div>';
    },

    empty: function (icon, title, body, tone) {
      return '<div class="empty' + (tone ? ' empty--' + tone : '') + '"><span class="empty__icon">' + I(icon) + '</span><div class="empty__title">' + esc(title) + '</div>' + (body ? '<p class="empty__body">' + esc(body) + '</p>' : '') + '</div>';
    },

    fields: function (pairs, grid) { return '<dl class="fields' + (grid ? ' fields--grid' : '') + '">' + pairs.map(function (p) { return '<div><dt>' + esc(p[0]) + '</dt><dd>' + p[1] + '</dd></div>'; }).join('') + '</dl>'; },

    staffAvatars: function (staff) {
      var C = Hub.data.coaches;
      return '<span class="avatars">' + staff.map(function (s) { return ui.avatar(C[s.coach].name, 'sm', s.unavailable ? 'is-out' : ''); }).join('') + '</span>';
    },
    staffNames: function (staff) {
      var C = Hub.data.coaches;
      return staff.map(function (s) { var n = C[s.coach].name.split(' ')[0]; return s.unavailable ? '<s>' + esc(n) + '</s>' : esc(n); }).join(', ');
    }
  };

  Hub.ui = ui;
})();
