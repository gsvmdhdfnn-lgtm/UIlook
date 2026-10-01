/* Relvor prototype kit (pass 12). Shared building blocks for every screen:
   layout, money, dates, audit stamps, restricted and frozen blocks, forms,
   wizard steps, timelines, feature and permission checks, and in-memory
   mutation with a toast. Screens use Hub.kit (K) so all areas stay
   consistent. Nothing here talks to a network; all state is in memory. */
(function () {
  var ui = Hub.ui, I = Hub.icon, esc = ui.esc;
  var K = {};
  Hub.kit = K;
  Hub.routes = Hub.routes || {};
  Hub.labels = Hub.labels || { IDP: 'IDP', IDPs: 'IDPs', 'Development plan': 'Development plan' };
  Hub.features = Hub.features || {
    communications: false, sessionRequests: false, bookings: true, cover: true, development: true,
    finance: true, registers: true, trials: true, packages: true, discounts: true, documents: true, publicSite: true
  };
  Hub.featureInfo = {
    communications: 'Communications', sessionRequests: 'Session requests from parents', bookings: 'Online bookings and checkout',
    cover: 'Cover workflow', development: 'Development and feedback', finance: 'Finance', registers: 'Registers',
    trials: 'Trials and trial interest', packages: 'Package pricing (camps)', discounts: 'Discounts', documents: 'Coach documents and compliance', publicSite: 'Public site'
  };

  /* ---------- Route metadata: title and where it sits in navigation ---------- */
  K.route = function (id, meta) { Hub.routes[id] = meta; };
  K.param = function () { return Hub.state.param || ''; };

  /* ---------- Money (pence in, £ out) ---------- */
  K.money = function (p, o) {
    o = o || {};
    if (p == null || isNaN(p)) return '—';
    var neg = p < 0, v = Math.abs(Math.round(p));
    var s = '£' + Math.floor(v / 100).toLocaleString('en-GB') + '.' + String(v % 100).padStart(2, '0');
    return (neg ? '−' : (o.sign && p > 0 ? '+' : '')) + s;
  };
  K.sum = function (list, f) { return list.reduce(function (n, x) { return n + ((typeof f === 'function' ? f(x) : x[f]) || 0); }, 0); };

  /* ---------- Dates on the prototype clock (Thu 1 Oct 2026, 14:10) ---------- */
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function parse(iso) { var p = String(iso).split(/[-T:]/); return new Date(+p[0], +p[1] - 1, +p[2] || 1, +(p[3] || 0), +(p[4] || 0)); }
  K.parse = parse;
  K.iso = function (d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  K.d = function (iso) { if (!iso) return '—'; var d = parse(iso); return DOW[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); };
  K.dm = function (iso) { if (!iso) return '—'; var d = parse(iso); return d.getDate() + ' ' + MON[d.getMonth()]; };
  K.dd = function (iso) { if (!iso) return '—'; var d = parse(iso); return DOW[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()]; };
  K.dt = function (iso) { if (!iso) return '—'; var d = parse(iso); return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  K.today = '2026-10-01';
  var tick = 0;
  K.now = function () { tick++; var m = 10 + tick; return '2026-10-01T' + String(14 + Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  K.addDays = function (iso, n) { var d = parse(iso); d.setDate(d.getDate() + n); return K.iso(d); };
  K.daysBetween = function (a, b) { return Math.round((parse(b) - parse(a)) / 864e5); };

  /* ---------- Who is looking ---------- */
  K.viewer = function () {
    var S = Hub.state;
    var role = S.area === 'client' ? 'parent' : S.area === 'staff' ? 'coach' : S.area === 'public' ? 'public' : 'management';
    var v = { role: role, coachRole: S.coachRole || 'lead', name: role === 'parent' ? Hub.data.parent.name : Hub.data.me.name };
    /* In the Coach hub the signed-in coach depends on the coach role; the guard stops the lookup re-entering here */
    if (role === 'coach' && Hub.db.getSignedInCoach && !K._inViewer) { K._inViewer = true; try { var c = Hub.db.getSignedInCoach(); if (c) v.name = c.name; } finally { K._inViewer = false; } }
    return v;
  };
  K.me = function () { return K.viewer().name; };
  K.fin = function () { return Hub.state.finance || 'manage'; };
  K.canFin = function () { return K.fin() === 'manage'; };
  K.feature = function (k) { return Hub.features[k] !== false; };
  K.label = function (k) { return Hub.labels[k] || k; };

  /* ---------- Mutation: change in-memory state, record it, toast, re-render ---------- */
  Hub.mutate = function (fn, msg, log) {
    var r = fn && fn();
    if (log) K.log(log);
    if (msg) Hub.toast(msg);
    Hub.render();
    return r;
  };
  K.log = function (e) {
    var D = Hub.data; D.audit = D.audit || [];
    var entry = { id: 'AUD-' + String(D.audit.length + 1001), at: e.at || K.now(), who: e.who || K.me(), area: e.area || 'General', summary: e.summary, entity: e.entity || '', before: e.before, after: e.after, restricted: !!e.restricted, finance: !!e.finance };
    D.audit.unshift(entry);
    return entry;
  };

  /* ---------- Small inline pieces ---------- */
  K.pill = function (text, tone) { return '<span class="lx-pill' + (tone ? ' lx-pill--' + tone : '') + '">' + esc(text) + '</span>'; };
  var TONES = {
    active: 'ok', confirmed: 'ok', completed: 'ok', paid: 'ok', issued: 'info', verified: 'ok', present: 'ok', accepted: 'ok', matched: 'ok', 'on track': 'ok', approved: 'ok', published: 'ok', current: 'ok', yes: 'ok', connected: 'ok', synced: 'ok', exported: 'info', booked: 'ok', finalised: 'ok', resolved: 'ok', created: 'ok',
    draft: '', scheduled: '', 'not started': '', new: 'info', pending: 'warn', 'in progress': 'warn', 'ready for issue': 'info', paused: 'warn', late: 'warn', excused: 'info', contacted: 'info', queried: 'warn', 'needs review': 'warn', 'partially credited': 'warn', 'part paid': 'warn', 'cancellation pending': 'warn', 'ending scheduled': 'warn', expiring: 'warn', 'pending verification': 'warn', postponed: 'warn', rescheduled: 'info', inactive: '', ended: '', unknown: 'warn', 'not confirmed': 'warn', open: 'warn', offered: 'info', reopened: 'warn',
    overdue: 'danger', cancelled: 'danger', absent: 'danger', declined: 'danger', expired: 'danger', missing: 'danger', failed: 'danger', void: '', credited: '', reversed: 'danger', denied: 'danger', no: 'danger', disconnected: 'danger', 'at risk': 'warn'
  };
  /* Display wording for stored states whose name is a system term; the stored value is unchanged */
  var STATE_LABEL = { Exported: 'Sent for payment' };
  K.stateLabel = function (text) { return STATE_LABEL[text] || text; };
  K.status = function (text) { return K.pill(K.stateLabel(text), TONES[String(text).toLowerCase()] || ''); };
  K.link = function (route, text) { return '<a class="k-link" href="#' + route + '">' + esc(text) + '</a>'; };
  K.goBtn = function (label, route, o) { o = o || {}; o.attrs = Object.assign({ 'data-action': 'go', 'data-route': route }, o.attrs || {}); return ui.btn(label, o); };
  K.actBtn = function (label, action, data, o) { o = o || {}; var a = { 'data-action': action }; Object.keys(data || {}).forEach(function (k) { a['data-' + k] = data[k]; }); o.attrs = Object.assign(a, o.attrs || {}); return ui.btn(label, o); };
  K.stamp = function (verb, who, at) { return '<span class="k-stamp">' + I('clock', 'icon-sm') + '<span>' + esc(verb) + ' by <b>' + esc(who) + '</b>, ' + esc(K.dt(at)) + '</span></span>'; };
  K.frozen = function (text) { return '<span class="k-frozen">' + I('shield', 'icon-sm') + esc(text || 'Issued · frozen') + '</span>'; };
  K.id = function (id) { return '<span class="k-id num">' + esc(id) + '</span>'; };
  K.restricted = function (allow, html, what) {
    var v = K.viewer(), key = v.role === 'coach' ? 'coach:' + v.coachRole : v.role;
    var ok = allow.some(function (a) { return a === v.role || a === key; });
    if (ok) return '<div class="k-sensitive"><span class="k-sensitive__tag">' + I('shield', 'icon-sm') + 'Restricted · ' + esc(what || 'sensitive') + '</span>' + html + '</div>';
    return '<div class="k-locked">' + I('shield', 'icon-sm') + '<span><b>' + esc(what || 'Restricted details') + '</b><small>Only visible to ' + esc(allow.map(function (a) { return { management: 'Management', parent: 'the family', 'coach:lead': 'lead coaches', 'coach:coach': 'coaches', coach: 'coaches' }[a] || a; }).join(', ')) + '.</small></span></div>';
  };
  K.featureOff = function (key, title) {
    return '<div class="k-off">' + I('info') + '<div><b>' + esc(title || Hub.featureInfo[key] || key) + ' is switched off</b><p>This feature is turned off for this organisation in Feature controls. It stays visible so the Hub reads as complete, but nothing here can be used until it is switched on.</p>' +
      '<button type="button" class="btn btn--secondary btn--sm" data-action="go" data-route="mgmt-features">Feature controls</button></div></div>';
  };

  /* ---------- Layout ---------- */
  K.head = function (o) {
    return '<header class="lx-head">' +
      (o.back ? '<a class="lx-back" href="#' + o.back[0] + '">' + I('chevron', 'icon-sm flip') + esc(o.back[1]) + '</a>' : '') +
      '<div class="lx-head__row"><div class="lx-head__text">' + (o.eyebrow ? '<div class="lx-eyebrow">' + esc(o.eyebrow) + '</div>' : '') + '<h1 class="lx-title">' + esc(o.title) + '</h1>' +
      (o.sub ? '<p class="lx-sub">' + o.sub + '</p>' : '') + '</div>' + (o.actions ? '<div class="lx-head__actions">' + o.actions + '</div>' : '') + '</div>' +
      (o.tabs || '') + '</header>';
  };
  K.page = function (h, body, cls) { return '<div class="lx' + (cls ? ' ' + cls : '') + '">' + h + '<div class="lx-body">' + body + '</div></div>'; };
  K.section = function (title, sub, body, right) {
    return '<section class="lx-section"><div class="lx-section__head"><div><h2>' + esc(title) + '</h2>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (right || '') + '</div>' + body + '</section>';
  };
  K.card = function (o) {
    return '<section class="lx-card' + (o.cls ? ' ' + o.cls : '') + '">' + (o.title ? '<div class="lx-card__head"><div><h2>' + esc(o.title) + '</h2>' + (o.sub ? '<p>' + o.sub + '</p>' : '') + '</div>' + (o.right || '') + '</div>' : '') + o.body + '</section>';
  };
  K.grid = function (items, cols) { return '<div class="k-grid k-grid--' + (cols || 2) + '">' + items.join('') + '</div>'; };
  K.stats = function (list) { return '<div class="lx-stats">' + list.map(K.stat).join('') + '</div>'; };
  K.stat = function (o) {
    var tag = o.route ? 'a' : 'div';
    return '<' + tag + ' class="lx-stat' + (o.tone ? ' lx-stat--' + o.tone : '') + '"' + (o.route ? ' href="#' + o.route + '"' : '') + '><span class="lx-stat__label">' + esc(o.label) + '</span><b class="lx-stat__value num">' + o.value + '</b>' + (o.sub ? '<small>' + o.sub + '</small>' : '') + '</' + tag + '>';
  };
  K.tile = function (o) {
    return '<a class="lx-area" href="#' + o.route + '"><span class="lx-area__top"><span class="lx-area__icon">' + I(o.icon || 'grid') + '</span>' + I('arrowRight', 'icon-sm lx-area__go') + '</span>' +
      '<span class="lx-area__title">' + esc(o.title) + '</span>' + (o.value != null ? '<span class="lx-area__value"><b class="num">' + o.value + '</b><small>' + esc(o.label || '') + '</small></span>' : '') +
      '<span class="lx-area__desc">' + esc(o.desc || '') + '</span>' + (o.badge ? '<span class="k-tile__badge">' + o.badge + '</span>' : '') + '</a>';
  };
  /* ---------- Area landing pieces (Management) ---------- */
  /* What needs Management in one area: Needs Attention cases for the given
     categories, each opening the actual task. */
  K.areaNeeds = function (cats, o) {
    o = o || {};
    var A = Hub.db.getAttention(), list = A.cases.filter(function (k) { return cats.indexOf(k.category) >= 0; });
    var word = { Urgent: 'Urgent', Warning: 'Warning', Normal: 'To do' };
    var rows = list.slice(0, o.limit || 5).map(function (k) {
      return ui.row({ lead: ui.sev(k.severity), title: esc(k.title), sub: [esc(word[k.severity]), esc(k.when || '')].concat(k.detail ? [esc(k.detail)] : []), href: '#' + (k.route || 'mgmt-attention'), trail: '<span class="k-needs__act">' + esc(k.actionLabel || 'Open') + '</span>' });
    });
    var body = list.length ? K.list(rows) + (list.length > rows.length ? '<p class="k-note">' + (list.length - rows.length) + ' more in ' + K.link('mgmt-attention', 'Needs attention') + '</p>' : '')
      : '<div class="k-needs__clear">' + I('checkCircle', 'icon-sm') + '<span>' + esc(o.clear || 'Nothing here needs you right now.') + '</span></div>';
    return K.section('Needs you', list.length ? list.length + ' item' + (list.length === 1 ? '' : 's') + ', most urgent first' : '', body, list.length ? K.goBtn('All needs attention', 'mgmt-attention', { size: 'sm', variant: 'secondary' }) : '');
  };
  /* Everything else in an area, one quiet step away (closed by default). */
  K.moreIn = function (title, groups) {
    var n = 0;
    var body = groups.map(function (g) {
      return '<div class="k-more__group"><h3>' + esc(g[0]) + '</h3>' + g[1].map(function (x) { n++;
        return '<a class="k-more__link" href="#' + x.route + '">' + I(x.icon || 'arrowRight', 'icon-sm') + '<span><b>' + esc(x.title) + '</b>' + (x.desc ? '<small>' + esc(x.desc) + '</small>' : '') + '</span>' + (x.count != null && x.count !== '' ? '<span class="k-more__n num">' + esc(String(x.count)) + '</span>' : '') + '</a>'; }).join('') + '</div>';
    }).join('');
    return '<details class="k-more"><summary><span><b>' + esc(title) + '</b><small>' + n + ' more places, for when you need them</small></span>' + I('chevron', 'icon-sm k-more__chev') + '</summary><div class="k-more__grid">' + body + '</div></details>';
  };
  /* A search entry point that opens the hub search. */
  K.findBar = function (placeholder) {
    return '<button type="button" class="search-trigger k-find" data-action="search">' + I('search') + '<span>' + esc(placeholder) + '</span><span class="kbd">⌘K</span></button>';
  };
  K.tiles = function (list, cols) { return '<div class="lx-areas k-tiles--' + (cols || 3) + '">' + list.map(K.tile).join('') + '</div>'; };
  K.kv = function (pairs, grid) { return ui.fields(pairs.filter(Boolean), grid); };

  /* Tabs: state per id in Hub.wsTabs, switched with the shared wstab action */
  Hub.wsTabs = Hub.wsTabs || {};
  K.tab = function (id, list) { var v = Hub.wsTabs[id]; if (!list.some(function (t) { return t.id === v; })) v = Hub.wsTabs[id] = list[0].id; return v; };
  K.tabs = function (id, list) {
    var active = K.tab(id, list);
    return '<nav class="glide lx-tabs" data-glide="k-' + id + '" role="tablist" aria-label="Sections"><span class="glide__puck" aria-hidden="true"></span>' + list.map(function (t) {
      return '<button type="button" class="glide__tab" role="tab" aria-selected="' + (t.id === active) + '" data-action="wstab" data-ws="' + id + '" data-tab="' + esc(t.id) + '"><span class="glide__label">' + esc(t.label) + '</span>' +
        (t.meta != null ? '<span class="glide__meta">' + (t.state ? ui.sev(t.state) : '') + '<span>' + t.meta + '</span></span>' : '') + '</button>';
    }).join('') + '</nav>';
  };
  Hub.actions.wstab = function (el) {
    var tabs = Array.prototype.slice.call(el.parentNode.querySelectorAll('.glide__tab')), cur = el.parentNode.querySelector('[aria-selected="true"]');
    Hub.sectionDir = tabs.indexOf(el) - tabs.indexOf(cur);
    Hub.wsTabs[el.dataset.ws] = el.dataset.tab; Hub.animateSection = Hub.sectionDir !== 0; Hub.render();
  };
  /* Segmented filter with the same state store */
  K.seg = function (id, list) {
    var active = K.tab(id, list);
    return '<div class="segmented k-seg" role="group">' + list.map(function (t) { return '<button type="button" data-action="wstab" data-ws="' + id + '" data-tab="' + esc(t.id) + '" aria-pressed="' + (t.id === active) + '">' + esc(t.label) + '</button>'; }).join('') + '</div>';
  };

  /* Tables: rows can open a route (whole row is the target) */
  K.table = function (o) {
    var body = o.rows.map(function (r) {
      return ui.tr(r.cells.map(function (c) { return typeof c === 'string' ? { html: c } : c; }), r.route ? { action: 'go', data: { route: r.route }, label: r.label || 'Open' } : r.action ? { action: r.action, data: r.data, label: r.label } : {});
    }).join('');
    return '<div class="k-table">' + ui.table({ cols: o.cols, head: o.head, body: body || '' }) + (o.rows.length ? '' : '<p class="k-table__empty">' + esc(o.empty || 'Nothing to show.') + '</p>') + (o.foot ? '<div class="k-table__foot">' + o.foot + '</div>' : '') + '</div>';
  };
  K.cell = function (title, sub) { return { cls: 'c-main', html: '<span class="c-title">' + title + '</span>' + (sub ? '<span class="c-sub">' + sub + '</span>' : '') }; };
  K.list = function (rows) { return '<div class="zone-inset">' + ui.rows(rows, 'rows--lead') + '</div>'; };

  K.timeline = function (items) {
    return '<ol class="k-timeline">' + items.map(function (t) {
      return '<li class="k-tl' + (t.tone ? ' k-tl--' + t.tone : '') + '"><span class="k-tl__dot"></span><div><b>' + esc(t.text) + '</b>' + (t.detail ? '<p>' + t.detail + '</p>' : '') + '<small>' + esc(t.who || '') + (t.who && t.at ? ' · ' : '') + esc(t.at ? K.dt(t.at) : '') + '</small></div></li>';
    }).join('') + '</ol>';
  };
  K.steps = function (list, i) {
    return '<ol class="k-steps">' + list.map(function (s, n) { return '<li class="' + (n < i ? 'is-done' : n === i ? 'is-current' : '') + '"><span>' + (n < i ? I('check', 'icon-sm') : n + 1) + '</span>' + esc(s) + '</li>'; }).join('') + '</ol>';
  };

  /* ---------- Forms (values are read back with K.val) ---------- */
  K.field = function (label, control, hint, wide) { return '<label class="field k-field' + (wide ? ' k-field--wide' : '') + '"><span class="label">' + esc(label) + '</span>' + control + (hint ? '<span class="hint">' + hint + '</span>' : '') + '</label>'; };
  K.input = function (name, value, o) { o = o || {}; return '<input class="input" name="' + name + '" type="' + (o.type || 'text') + '" value="' + esc(value == null ? '' : value) + '"' + (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '') + (o.readonly ? ' readonly' : '') + '>'; };
  K.select = function (name, opts, value) { return '<select class="select" name="' + name + '">' + opts.map(function (o) { o = Array.isArray(o) ? o : [o, o]; return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(value) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'; };
  K.textarea = function (name, value, ph) { return '<textarea class="textarea k-textarea" name="' + name + '" rows="3"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '>' + esc(value || '') + '</textarea>'; };
  K.form = function (fields, cols) { return '<div class="k-form k-form--' + (cols || 2) + '">' + fields.join('') + '</div>'; };
  K.toggle = function (on, action, data, label) {
    var a = ''; Object.keys(data || {}).forEach(function (k) { a += ' data-' + k + '="' + esc(data[k]) + '"'; });
    return '<button type="button" class="k-toggle' + (on ? ' is-on' : '') + '" role="switch" aria-checked="' + !!on + '" data-action="' + action + '"' + a + '><span class="k-toggle__track"><span></span></span>' + (label ? '<span>' + esc(label) + '</span>' : '') + '</button>';
  };
  K.val = function (name, root) { var el = (root || document).querySelector('[name="' + name + '"]'); return el ? el.value : ''; };

  /* ---------- Loading, empty and error states ---------- */
  K.guard = function (ctx, head, o) {
    o = o || {};
    if (ctx.state === 'loading') { var r = ''; for (var i = 0; i < (o.rows || 4); i++) r += '<span class="skeleton" style="height:' + (i ? 64 : 120) + 'px;border-radius:14px"></span>'; return K.page(head, '<div class="lx-stack">' + r + '</div>'); }
    if (ctx.state === 'error') return K.page(head, ui.notice('danger', o.errorTitle || 'This couldn’t load', o.errorBody || 'Nothing is shown until it can be trusted. Try again in a moment.', { action: ui.btn('Retry', { size: 'sm', icon: 'refresh', attrs: { 'data-action': 'retry' } }) }));
    if (ctx.state === 'empty' && o.empty !== false) { var e = o.empty || ['grid', 'Nothing here yet', 'When there is something to show, it will appear here.']; return K.page(head, '<div class="zone-inset">' + ui.empty(e[0], e[1], e[2]) + '</div>'); }
    return null;
  };
  Hub.actions.retry = function () { Hub.state.state = 'live'; Hub.render(); Hub.toast('Loaded'); };
  Hub.actions.go = function (el) { location.hash = el.dataset.route; };

  /* ---------- Sheet helpers ---------- */
  K.sheet = function (o) { Hub.openSheet(o); };
  K.confirm = function (o) {
    Hub.openSheet({ overline: o.overline || '', title: esc(o.title), body: o.body || '', foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + ui.btn(o.label || 'Confirm', { variant: o.danger ? 'secondary' : 'primary', attrs: Object.assign({ 'data-action': o.action }, o.data || {}) }) });
  };
})();
