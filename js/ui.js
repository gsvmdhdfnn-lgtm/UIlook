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
