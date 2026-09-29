/* Shared component helpers. Each returns an HTML string built only from
   the classes in components.css, so screens compose rather than restyle.
   These map one-to-one onto the recurring patterns found in the Hub
   (page-title / ph-hero, section-head / ph-section-head, support-row /
   more-row / pending-row, empty-state / ph-empty / schedule-empty ...). */
(function () {
  var I = function (n, c) { return Hub.icon(n, c); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function attrs(o) { if (!o) return ''; return Object.keys(o).filter(function (k) { return o[k] != null && o[k] !== false; }).map(function (k) { return ' ' + k + (o[k] === true ? '' : '="' + esc(o[k]) + '"'); }).join(''); }
  function initials(name) { return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); }

  var ui = {
    esc: esc, initials: initials,

    /* Page heading: eyebrow, title, one line of context, optional actions. */
    pageHead: function (o) {
      return '<header class="page-head">' +
        (o.eyebrow ? '<div class="eyebrow">' + esc(o.eyebrow) + '</div>' : '') +
        '<div class="page-head__row"><h1 class="page-title">' + esc(o.title) + '</h1>' + (o.actions || '') + '</div>' +
        (o.sub ? '<p class="page-sub">' + o.sub + '</p>' : '') +
        '</header>';
    },

    sectionHead: function (title, o) {
      o = o || {};
      return '<div class="section-head"><h2 class="section-title">' + esc(title) +
        (o.count != null ? '<span class="count num">' + esc(o.count) + '</span>' : '') + '</h2>' +
        (o.link ? '<a class="section-link" href="' + o.href + '">' + esc(o.link) + I('chevron', 'icon-sm') + '</a>' : '') +
        '</div>';
    },

    pill: function (text, tone, extra) { return '<span class="pill' + (tone ? ' pill--' + tone : '') + (extra ? ' ' + extra : '') + '">' + esc(text) + '</span>'; },

    btn: function (label, o) {
      o = o || {};
      var cls = 'btn' + (o.variant ? ' btn--' + o.variant : '') + (o.size ? ' btn--' + o.size : '') + (o.block ? ' btn--block' : '');
      var inner = (o.icon ? I(o.icon, 'icon-sm') : '') + '<span>' + esc(label) + '</span>' + (o.trail ? I(o.trail, 'icon-sm') : '');
      if (o.href) return '<a class="' + cls + '" href="' + o.href + '"' + attrs(o.attrs) + '>' + inner + '</a>';
      return '<button type="button" class="' + cls + '"' + attrs(o.attrs) + '>' + inner + '</button>';
    },

    avatar: function (name, size, extra) { return '<span class="avatar' + (size ? ' avatar--' + size : '') + (extra ? ' ' + extra : '') + '" aria-hidden="true">' + esc(initials(name)) + '</span>'; },

    /* List row. lead: html; title; meta: array of strings; trail: html;
       href/action makes the whole row one tap target. */
    row: function (o) {
      /* stretch: the row holds its own buttons, so the tap target is a
         stretched button on the title rather than a nested button. */
      var tag = o.stretch ? 'div' : o.href ? 'a' : (o.action ? 'button' : 'div');
      var a = o.stretch ? {} : o.href ? { href: o.href } : (o.action ? { type: 'button', 'data-action': o.action } : {});
      var d = {}; if (o.data) Object.keys(o.data).forEach(function (k) { d['data-' + k] = o.data[k]; });
      if (o.stretch) o.title = '<button type="button" class="row__link" data-action="' + o.action + '"' + attrs(d) + '>' + o.title + '</button>';
      else Object.keys(d).forEach(function (k) { a[k] = d[k]; });
      var metaHtml = o.meta && o.meta.length ? '<div class="row__meta"><div>' + o.meta.filter(Boolean).map(function (m) { return '<span>' + m + '</span>'; }).join('') + '</div></div>' : '';
      var trail = o.trail != null ? o.trail : ((o.href || o.action) ? I('chevron', 'icon-sm') : '');
      return '<' + tag + ' class="row' + (o.stretch ? ' row--stretch' : '') + (o.lead ? '' : ' row--nolead') + (o.compact ? ' row--compact' : '') + '"' + attrs(a) + '>' +
        (o.lead ? o.lead : '') +
        '<div class="row__body"><div class="row__title">' + o.title + '</div>' + metaHtml + '</div>' +
        '<div class="row__trail">' + trail + '</div></' + tag + '>';
    },

    list: function (rows) { return '<div class="list">' + rows.join('') + '</div>'; },

    alert: function (tone, title, body, action) {
      var icon = { warn: 'attention', danger: 'alertCircle', ok: 'checkCircle', info: 'info' }[tone] || 'info';
      return '<div class="alert alert--' + tone + '" role="' + (tone === 'danger' ? 'alert' : 'status') + '">' + I(icon) +
        '<div><div class="alert__title">' + esc(title) + '</div>' + (body ? '<div class="alert__body">' + body + '</div>' : '') + '</div>' + (action || '<span></span>') + '</div>';
    },

    empty: function (icon, title, body, tone) {
      return '<div class="empty' + (tone ? ' empty--' + tone : '') + '"><span class="empty__icon">' + I(icon) + '</span><div class="empty__title">' + esc(title) + '</div>' + (body ? '<p class="empty__body">' + esc(body) + '</p>' : '') + '</div>';
    },

    sev: function (severity) {
      var s = String(severity).toLowerCase();
      var icon = s === 'urgent' ? 'flame' : s === 'warning' ? 'attention' : 'info';
      return '<span class="sev sev--' + s + '" aria-hidden="true">' + I(icon, 'icon-sm') + '</span>';
    },
    sevTone: function (severity) { return { Urgent: 'danger', Warning: 'warn', Normal: 'info' }[severity] || 'info'; },

    kv: function (pairs) { return '<dl class="kv">' + pairs.map(function (p) { return '<div><dt>' + esc(p[0]) + '</dt><dd>' + p[1] + '</dd></div>'; }).join('') + '</dl>'; },

    staffLine: function (staff) {
      var C = Hub.data.coaches;
      if (!staff.length) return '<span class="text-danger">No coach assigned</span>';
      return staff.map(function (s) { var n = C[s.coach].name.split(' ')[0]; return s.unavailable ? '<s class="text-3">' + esc(n) + '</s>' : esc(n) + (s.lead ? ' (lead)' : ''); }).join(', ');
    }
  };

  Hub.ui = ui;
})();
