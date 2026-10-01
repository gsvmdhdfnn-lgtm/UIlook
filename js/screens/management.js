/* Management: Home, Needs Attention (with accept / override and rule
   settings) and More. Navigation follows the Josh Evans Hub design pack:
   Home and More at top level. Cases are computed live by
   js/data/attention.js, so fixing the underlying issue clears the case. */
(function () {
  var K = Hub.kit, db = Hub.db, ui = Hub.ui, I = Hub.icon, esc = ui.esc;
  var SEVWORD = { Urgent: 'Urgent', Warning: 'Warning', Normal: 'To do' };
  function sevTone(s) { return { Urgent: 'danger', Warning: 'warn', Normal: 'info' }[s] || ''; }
  function today() { return db.getTodayOccurrences().slice().sort(function (a, b) { return a.start < b.start ? -1 : 1; }); }
  function tomorrow() { return db.getOccurrences(function (o) { return o.date === '2026-10-02'; }).sort(function (a, b) { return a.start < b.start ? -1 : 1; }); }
  function staffState(o) {
    if (!o.staff.length) return ['No coach', 'danger'];
    if (o.staff.some(function (s) { return s.unavailable && !s.covering; })) return ['Coach unavailable', 'warn'];
    return [o.confirmed ? 'Confirmed' : 'Staffed', 'ok'];
  }
  K.route('mgmt-home', { title: 'Home' });
  K.route('mgmt-attention', { title: 'Needs attention', parent: 'home' });
  K.route('mgmt-attention-rules', { title: 'Needs attention rules', parent: 'home' });
  K.route('mgmt-more', { title: 'More' });

  /* ---------------------------------------------------------------- HOME */
  function backdrop() {
    return '<div class="hx__backdrop" aria-hidden="true"><svg viewBox="0 0 1200 420" preserveAspectRatio="xMidYMin slice">' +
      '<path class="r1" d="M0 250 C140 205 250 190 360 212 C470 234 560 170 690 140 C800 115 880 150 960 128 C1050 104 1130 70 1200 86 L1200 420 L0 420Z"/>' +
      '<path class="r2" d="M0 300 C120 270 230 262 350 280 C480 300 590 236 720 214 C840 194 930 232 1030 206 C1110 186 1160 170 1200 176 L1200 420 L0 420Z"/>' +
      '<path class="r3" d="M0 350 C180 322 330 330 470 340 C620 350 760 300 900 292 C1030 285 1120 300 1200 290 L1200 420 L0 420Z"/></svg></div>';
  }
  function areaCard(o) {
    return '<a class="lx-area" href="#' + o.route + '"><span class="lx-area__top"><span class="lx-area__icon">' + I(o.icon) + '</span>' + I('arrowRight', 'icon-sm lx-area__go') + '</span><span class="lx-area__title">' + esc(o.title) + '</span>' +
      '<span class="lx-area__value"><b class="num">' + o.value + '</b><small>' + esc(o.label) + '</small></span></a>';
  }
  function schedRow(o) {
    var ss = staffState(o), r = db.getRegister(o.id), client = !!db.getSession(o.sessionId).client;
    var reg = r.state === 'Completed' ? ['Register done', 'ok'] : r.state === 'In progress' ? ['Register in progress', 'warn'] : ['Register not started', ''];
    return '<a class="hx-sched" href="#mgmt-occurrence/' + o.id + '"><span class="hx-sched__bar hx-tone--' + (ss[1] === 'ok' ? 'ok' : 'warn') + '"></span>' +
      '<span class="hx-sched__time num">' + o.start + '<small>' + o.end + '</small></span>' +
      '<span class="hx-sched__main"><b>' + esc(o.session) + '</b><small>' + esc(db.venueName(o.venue)) + ' · ' + (o.staff.length ? o.staff.map(function (s) { var n = db.coachName(s.covering || s.coach).split(' ')[0]; return s.unavailable && !s.covering ? '<s>' + esc(n) + '</s>' : esc(n); }).join(', ') : 'No coach') + '</small>' +
      '<span class="hm-chips">' + K.pill(ss[0], ss[1]) + K.pill(reg[0], reg[1]) + '</span></span>' +
      '<span class="hx-sched__count num">' + I('users', 'icon-sm') + o.players + (client ? '' : '') + '</span>' + I('chevron', 'icon-sm hx-chev') + '</a>';
  }
  function attentionPanel(state) {
    var A = db.getAttention(), c = A.summary.counts, empty = state === 'empty' || !A.cases.length;
    var head = '<div class="hx-card__head"><div><h2>Needs attention</h2><small class="hx-sub">' + (empty ? 'Nothing waiting' : A.summary.total + ' open · updated 14:05') + '</small></div><a class="hx-link" href="#mgmt-attention">View all' + I('arrowRight', 'icon-sm') + '</a></div>';
    if (empty) return '<section class="hx-card hm-attn" id="hm-attn">' + head + ui.empty('checkCircle', 'All clear', 'Nothing currently needs management action.', 'ok') + '</section>';
    var sev = '<div class="hm-sev num">' + [['Urgent', 'urgent'], ['Warning', 'warning'], ['Normal', 'normal']].map(function (x) { return '<a class="hm-sev__i hm-sev--' + x[1] + '" href="#mgmt-attention"><i></i><b>' + c[x[0]] + '</b>' + SEVWORD[x[0]] + '</a>'; }).join('') + '</div>';
    var rows = '<div class="hx-list">' + A.cases.slice(0, 5).map(function (k) {
      return '<button type="button" class="hx-attn' + (k.severity === 'Urgent' ? ' is-urgent' : '') + '" data-action="case" data-key="' + esc(k.caseKey) + '"><span class="hx-dot hx-tone--' + (k.severity === 'Urgent' ? 'danger' : k.severity === 'Warning' ? 'warn' : 'muted') + '"></span><span class="hx-attn__main"><b>' + esc(k.title) + '</b><small>' + esc(k.when) + ' · ' + esc(k.category) + '</small></span>' + I('chevron', 'icon-sm hx-chev') + '</button>';
    }).join('') + '</div>';
    return '<section class="hx-card hm-attn" id="hm-attn">' + head + sev + rows + '</section>';
  }
  Hub.screens['mgmt-home'] = function (ctx) {
    var me = db.getMe(), first = me.name.split(' ')[0], empty = ctx.state === 'empty';
    var hello = '<header class="hm-hello"><div class="hm-hello__date">Thursday 1 October</div><h1 class="hm-hello__title">Good afternoon, ' + esc(first) + '.</h1><p class="hm-hello__lede">Here’s what’s happening across ' + esc(Hub.brand.orgFull || Hub.brand.orgName) + ' today.</p></header>';
    var shell = function (main, rail) { return '<div class="hx">' + backdrop() + '<div class="hm"><div class="hm__main">' + hello + main + '</div>' + (rail ? '<aside class="hm__rail">' + rail + '</aside>' : '') + '</div></div>'; };
    if (ctx.state === 'loading') return shell('<div class="lx-areas">' + [1, 2, 3, 4].map(function () { return '<span class="skeleton" style="height:76px;border-radius:14px"></span>'; }).join('') + '</div><div class="hm__pair"><span class="skeleton" style="height:360px;border-radius:16px"></span><span class="skeleton" style="height:360px;border-radius:16px"></span></div>');
    if (ctx.state === 'error') return shell(ui.notice('danger', 'Couldn’t load today’s operation', 'Nothing is shown as clear until the checks complete. Try again in a moment.', { action: ui.btn('Retry', { size: 'sm', icon: 'refresh', attrs: { 'data-action': 'retry' } }) }));
    var T = today(), expected = K.sum(T, 'players');
    var active = db.getCoaches().filter(function (c) { return c.active !== false; }).length;
    var players = db.getPlayers(function (p) { return p.status === 'Active'; }).length;
    var areas = '<div class="lx-areas lx-areas--stat">' +
      areaCard({ route: 'mgmt-schedule', icon: 'calendar', title: 'Schedule & Sessions', value: empty ? 0 : T.length, label: 'sessions today' }) +
      areaCard({ route: 'mgmt-coaches', icon: 'coaches', title: Hub.staffPlural(), value: active, label: 'active' }) +
      areaCard({ route: 'mgmt-players', icon: 'players', title: 'Players & ' + Hub.brand.terms.client + 's', value: players, label: 'active players' }) +
      areaCard({ route: 'mgmt-registers', icon: 'clock', title: 'Today', value: empty ? 0 : expected, label: 'players expected' }) + '</div>';
    var urgent = db.getAttention().cases.filter(function (k) { return k.severity === 'Urgent'; }), c = db.getAttention().summary.counts;
    var urgentSum = empty || !urgent.length ? '' : '<section class="hm-urgent" aria-label="Urgent actions"><a class="hm-urgent__head" href="#hm-attn"><span class="hm-urgent__k">' + ui.sev('Urgent') + '<b class="num">' + urgent.length + ' urgent</b><span class="num">· ' + c.Warning + ' warning · ' + c.Normal + ' to do</span></span><span class="hm-urgent__go">Review' + I('arrowRight', 'icon-sm') + '</span></a>' +
      urgent.map(function (k) { return '<button type="button" class="hm-urgent__row" data-action="case" data-key="' + esc(k.caseKey) + '"><b>' + esc(k.title) + '</b><small>' + esc(k.when) + '</small></button>'; }).join('') + '</section>';
    var sched = '<section class="hx-card hm-sched" id="hx-today"><div class="hx-card__head"><div><h2>Today’s schedule</h2><small class="hx-sub">' + (empty ? 'No sessions' : T.length + ' sessions · ' + expected + ' players expected') + '</small></div><a class="hx-link" href="#mgmt-calendar">View full day' + I('arrowRight', 'icon-sm') + '</a></div>' +
      (empty ? ui.empty('calendar', 'Nothing scheduled today', 'Tomorrow has ' + tomorrow().length + ' sessions.') : '<div class="hx-list">' + T.map(schedRow).join('') + '</div>') + '</section>';
    var week = [['Mon', 28, '2026-09-28'], ['Tue', 29, '2026-09-29'], ['Wed', 30, '2026-09-30'], ['Thu', 1, '2026-10-01'], ['Fri', 2, '2026-10-02'], ['Sat', 3, '2026-10-03'], ['Sun', 4, '2026-10-04']];
    var cal = '<section class="hx-card hx-card--rail"><div class="hx-card__head"><div><h2>Calendar</h2><small class="hx-sub">Thursday 1 October 2026</small></div><a class="hx-link" href="#mgmt-calendar">Open' + I('arrowRight', 'icon-sm') + '</a></div>' +
      '<div class="hx-week" role="group" aria-label="Choose a day">' + week.map(function (d, i) { return '<a class="hx-week__day' + (i === 3 ? ' is-today' : '') + '" href="#mgmt-occurrences/' + d[2] + '"' + (i === 3 ? ' aria-current="date"' : '') + '><small>' + d[0] + '</small><b>' + d[1] + '</b></a>'; }).join('') + '</div>' +
      '<p class="hm-cal__sum num">' + (empty ? 'No sessions today' : T.length + ' sessions · first ' + (T[0] || {}).start + ' · last ends ' + (T[T.length - 1] || {}).end) + '</p></section>';
    var tm = tomorrow();
    var tom = '<section class="hx-card hx-card--rail"><div class="hx-card__head"><div><h2>Tomorrow</h2><small class="hx-sub">Friday 2 October</small></div></div><div class="hx-list">' + (tm.length ? tm.map(function (o) { var ss = staffState(o); return '<a class="hm-mini" href="#mgmt-occurrence/' + o.id + '"><span class="num">' + o.start + '</span><span><b>' + esc(o.session) + '</b><small>' + esc(db.venueName(o.venue)) + '</small></span>' + K.pill(ss[0], ss[1]) + '</a>'; }).join('') : '<p class="hx-sub">Nothing scheduled.</p>') + '</div></section>';
    var appr = db.getApprovalsWaiting().filter(function (a) { return a.count; });
    var approvals = '<section class="hx-card hx-card--rail"><div class="hx-card__head"><div><h2>Approvals waiting</h2><small class="hx-sub">' + K.sum(appr, 'count') + ' to decide</small></div><a class="hx-link" href="#mgmt-approvals">All' + I('arrowRight', 'icon-sm') + '</a></div><div class="hx-list">' + appr.map(function (a) { return '<a class="hm-mini" href="#mgmt-' + a.id + '"><span class="hm-mini__icon">' + I(a.icon, 'icon-sm') + '</span><span><b>' + esc(a.label) + '</b><small>' + esc(a.sub) + '</small></span>' + K.pill(a.count + ' waiting', 'info') + '</a>'; }).join('') + '</div></section>';
    var changes = '<section class="hx-card hx-card--rail"><div class="hx-card__head"><div><h2>Since you last looked</h2><small class="hx-sub">Last visit ' + esc(db.getLastVisit()) + '</small></div><a class="hx-link" href="#mgmt-audit">History' + I('arrowRight', 'icon-sm') + '</a></div><div class="hx-activity">' +
      db.getChanges().map(function (ch, i) { var tone = ['warn', 'ok', 'blue'][i % 3], icon = ['calendar', 'shield', 'inbox'][i % 3]; var target = ch.key ? ' data-action="case" data-key="' + esc(ch.key) + '"' : ''; return '<' + (ch.key ? 'button type="button"' : 'a href="' + (ch.href || '#mgmt-audit') + '"') + ' class="hx-act hm-act"' + target + '><span class="hx-act__icon hx-tone--' + tone + '">' + I(icon, 'icon-sm') + '</span><span><b>' + esc(ch.text) + '</b><small>' + esc(ch.time) + '</small></span></' + (ch.key ? 'button' : 'a') + '>'; }).join('') + '</div></section>';
    return shell(areas + urgentSum + '<div class="hm__pair">' + sched + attentionPanel(ctx.state) + '</div>', cal + tom + approvals + changes);
  };

  /* ------------------------------------------------------ NEEDS ATTENTION */
  var attnCategory = 'All';
  document.addEventListener('change', function (e) { if (e.target.matches && e.target.matches('[data-change="attn-cat"]')) { attnCategory = e.target.value; Hub.render(); } });
  Hub.screens['mgmt-attention'] = function (ctx) {
    var A = db.getAttention(), c = A.summary.counts;
    var tabs = [{ id: 'All', label: 'All', meta: A.summary.total + ' open' }, { id: 'Urgent', label: 'Urgent', meta: c.Urgent, state: 'Urgent' }, { id: 'Warning', label: 'Warning', meta: c.Warning, state: 'Warning' }, { id: 'Normal', label: 'To do', meta: c.Normal, state: 'Normal' }, { id: 'Accepted', label: 'Accepted', meta: A.accepted.length }];
    var sev = K.tab('attention', tabs);
    var cats = ['Staffing & Cover', 'Coaches & Compliance', 'Sessions & Venues', 'Players & Families', 'Development', 'Finance'];
    var select = '<label class="lx-select"><span class="visually-hidden">Category</span>' + I('filter', 'icon-sm') + '<select data-change="attn-cat">' + ['All'].concat(cats).map(function (k) { return '<option value="' + esc(k) + '"' + (k === attnCategory ? ' selected' : '') + '>' + (k === 'All' ? 'All categories' : esc(k)) + '</option>'; }).join('') + '</select>' + I('chevronDown', 'icon-sm') + '</label>';
    var h = K.head({ back: ['mgmt-home', 'Home'], eyebrow: 'Needs attention', title: 'Needs attention', sub: 'A work queue of things Management needs to decide, fix, approve or support. Each item clears itself once the issue is fixed.',
      actions: K.goBtn('Rules', 'mgmt-attention-rules', { variant: 'tertiary', icon: 'settings' }) + K.actBtn('Refresh', 'attn-refresh', {}, { variant: 'secondary', icon: 'refresh' }), tabs: '<div class="lx-filterbar">' + K.tabs('attention', tabs) + select + '</div>' });
    var g = K.guard(ctx, h, { empty: ['checkCircle', 'All clear', 'No staffing gaps, compliance issues, registers, claims or finance items are waiting.'] }); if (g) return g;
    var list = (sev === 'Accepted' ? A.accepted : A.cases).filter(function (k) { return (sev === 'All' || sev === 'Accepted' || k.severity === sev) && (attnCategory === 'All' || k.category === attnCategory); });
    if (!list.length) return K.page(h, '<div class="zone-inset">' + ui.empty('checkCircle', 'Nothing in this filter', 'Try another priority or category.', 'ok') + '</div>');
    var body = cats.filter(function (cat) { return list.some(function (k) { return k.category === cat; }); }).map(function (cat) {
      var items = list.filter(function (k) { return k.category === cat; });
      return K.section(cat, items.length + ' item' + (items.length > 1 ? 's' : ''), '<div class="lx-stack">' + items.map(function (k) {
        return '<article class="lx-issue lx-issue--' + (k.severity === 'Normal' ? 'normal' : k.severity.toLowerCase()) + '"><div class="lx-issue__main">' + K.pill(SEVWORD[k.severity], sevTone(k.severity)) +
          '<h3><button type="button" class="lx-issue__link" data-action="case" data-key="' + esc(k.caseKey) + '">' + esc(k.title) + '</button></h3><p class="lx-issue__meta">' + esc(k.detail) + '</p>' +
          '<p class="lx-issue__why"><span>' + esc(k.severityReason) + '</span><span class="num when when--' + k.severity.toLowerCase() + '">' + esc(k.when) + '</span>' + (k.exception ? '<span>' + esc(k.exception.type) + ' by ' + esc(k.exception.approver) + '</span>' : '') + '</p></div>' +
          '<div class="lx-issue__act">' + (sev === 'Accepted' ? K.actBtn('Reopen', 'attn-reopen', { id: k.exception.id }, { variant: 'secondary' }) : K.goBtn(k.actionLabel, k.route, { variant: 'primary', trail: 'arrowRight' })) + '</div></article>';
      }).join('') + '</div>');
    }).join('');
    return K.page(h, body + '<p class="lx-note">Items clear on their own once the underlying issue is fixed. Accepting or overriding a case needs a reason and an approver, and stays in history.</p>');
  };
  Hub.actions['attn-refresh'] = function (el) { el.classList.add('is-busy'); setTimeout(function () { el.classList.remove('is-busy'); Hub.render(); Hub.toast('Checks re-run at ' + K.dt(K.now()).split(' ')[2]); }, 500); };
  Hub.actions['attn-reopen'] = function (el) { Hub.mutate(function () { db.revokeAttentionException(el.dataset.id); }, 'Case reopened'); };

  /* Case drawer: detail, one action, and accept / override as an exception */
  Hub.actions['case'] = function (el) {
    var c = db.getAttentionCase(el.dataset.key);
    if (!c) { Hub.toast('This item has already been resolved'); return; }
    var occ = c.related && c.related.occurrence && db.getOccurrence(c.related.occurrence), occHtml = '';
    if (occ) occHtml = '<section class="section">' + ui.sectionHead(occ.session, { meta: K.dd(occ.date) + ', ' + occ.start + '–' + occ.end }) +
      (occ.staff.length ? ui.rows(occ.staff.map(function (s) { return ui.row({ lead: ui.avatar(db.coachName(s.coach), 'md'), title: esc(db.coachName(s.coach)), sub: [esc(s.role || (s.lead ? 'Lead' : 'Coach'))], trail: s.unavailable ? ui.status(s.covering ? 'Covered by ' + db.coachName(s.covering) : 'Unavailable', s.covering ? 'ok' : 'danger') : ui.status('Assigned') }); }), 'rows--avatar') : '<p>' + ui.status('No coach assigned yet', 'danger') + '</p>') + '</section>';
    Hub.openSheet({
      overline: '<div class="sheet-kicker">' + ui.sev(c.severity) + '<span class="' + (c.severity === 'Urgent' ? 'text-danger' : '') + '">' + SEVWORD[c.severity] + '</span><span class="text-4">/</span><span>' + esc(c.category) + '</span></div>',
      title: esc(c.title),
      body: K.kv([['When', '<span class="num when when--' + c.severity.toLowerCase() + '">' + esc(c.when) + '</span>'], ['Details', esc(c.detail)], ['Why this priority', esc(c.severityReason)], ['Rule', esc(c.ruleName) + ' <span class="text-3 mono">' + esc(c.ruleId) + '</span>'], c.exception ? ['Exception', esc(c.exception.type) + ': ' + esc(c.exception.reason) + '<br>' + K.stamp('Approved by ' + c.exception.approver + ', recorded', c.exception.by, c.exception.at)] : null]) + occHtml +
        '<p class="text-3 fs-14">This item clears on its own once the underlying issue is fixed.</p>',
      foot: K.actBtn('Accept or change priority', 'case-except', { key: c.caseKey }, { variant: 'tertiary' }) + K.goBtn(c.actionLabel, c.route, { variant: 'primary', trail: 'arrowRight' })
    });
  };
  Hub.actions['case-except'] = function (el) {
    var c = db.getAttentionCase(el.dataset.key);
    Hub.openSheet({ overline: '<span class="overline">Exception</span>', title: 'Accept or change priority: ' + esc(c.title), meta: '<p class="k-note">Accepting removes the case from the queue until it changes. Changing priority moves it up or down. Both need a reason and an approver, and are kept in history.</p>',
      body: K.form([K.field('Decision', K.select('ex_type', [['Accepted', 'Accept this case (known and handled)'], ['Severity override', 'Change priority']], 'Accepted')), K.field('Change priority to', K.select('ex_sev', [['Normal', 'To do'], ['Warning', 'Warning'], ['Urgent', 'Urgent']], 'Normal')), K.field('Approver', K.select('ex_approver', ['Josh Evans', 'David Cole'], 'Josh Evans')), K.field('Reason', K.input('ex_reason', '', { placeholder: 'Required' }), '', true)], 2),
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Save exception', 'case-except-save', { key: c.caseKey }, { variant: 'primary' }) });
  };
  Hub.actions['case-except-save'] = function (el) {
    var c = db.getAttentionCase(el.dataset.key), r = K.val('ex_reason'); if (!r) { Hub.toast('A reason is required'); return; }
    var t = K.val('ex_type'), e = { caseKey: c.caseKey, title: c.title, type: t, severity: t === 'Severity override' ? K.val('ex_sev') : null, from: c.severity, approver: K.val('ex_approver'), reason: r };
    if (t === 'Severity override') { var rl = db.getAttentionRule(c.ruleId); if (rl.locked && ({ Normal: 1, Warning: 2, Urgent: 3 })[e.severity] < ({ Normal: 1, Warning: 2, Urgent: 3 })[rl.locked]) { Hub.toast('This rule has a locked minimum of ' + rl.locked); return; } }
    Hub.closeSheet(true); Hub.mutate(function () { db.addAttentionException(e); }, t === 'Accepted' ? 'Case accepted' : 'Priority changed');
  };

  /* Rule settings */
  Hub.actions['rule-toggle'] = function (el) { var r = db.getAttentionRule(el.dataset.id); Hub.mutate(function () { db.updateAttentionRule(r.id, { enabled: !r.enabled }); }, r.name + (r.enabled ? ' switched off' : ' switched on')); };
  Hub.actions['rule-edit'] = function (el) {
    var r = db.getAttentionRule(el.dataset.id);
    function hrs(v) { return v == null ? '' : String(v); }
    Hub.openSheet({ overline: '<span class="overline">' + esc(r.id) + ' · ' + esc(r.category) + '</span>', title: esc(r.name),
      body: K.form([K.field('Standard priority', K.select('r_base', [['Normal', 'To do'], ['Warning', 'Warning'], ['Urgent', 'Urgent']], r.base)), K.field('Locked minimum', K.select('r_locked', [['', 'None'], ['Normal', 'To do'], ['Warning', 'Warning'], ['Urgent', 'Urgent']], r.locked || ''), 'Priority can never be set below this.'),
        K.field('Warning threshold (hours before)', K.input('r_warn', hrs(r.warnHours), { type: 'number', placeholder: 'Not used' })), K.field('Urgent threshold (hours before)', K.input('r_urgent', hrs(r.urgentHours), { type: 'number', placeholder: 'Not used' }))], 2),
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Save rule', 'rule-save', { id: r.id }, { variant: 'primary' }) });
  };
  Hub.actions['rule-save'] = function (el) {
    function n(v) { return v === '' ? null : +v; }
    var patch = { base: K.val('r_base'), locked: K.val('r_locked') || null, warnHours: n(K.val('r_warn')), urgentHours: n(K.val('r_urgent')) };
    Hub.closeSheet(true); Hub.mutate(function () { db.updateAttentionRule(el.dataset.id, patch); }, 'Rule saved');
  };
  Hub.screens['mgmt-attention-rules'] = function (ctx) {
    var h = K.head({ back: ['mgmt-attention', 'Needs attention'], eyebrow: 'Needs attention', title: 'Rules', sub: 'Each rule can be switched on or off and has a standard priority, the points at which it becomes Warning and Urgent, and an optional lowest allowed priority.' });
    var g = K.guard(ctx, h, { empty: false }); if (g) return g;
    var cats = ['Staffing & Cover', 'Coaches & Compliance', 'Sessions & Venues', 'Players & Families', 'Development', 'Finance'];
    var A = db.getAttention();
    return K.page(h, cats.map(function (cat) {
      var rules = db.getAttentionRules().filter(function (r) { return r.category === cat; });
      return K.section(cat, '', K.table({ cols: '70px minmax(0,1.8fr) 110px 150px 150px 120px 70px 70px', head: ['On', 'Rule', 'Standard', 'Warning', 'Urgent', 'Lowest allowed', 'Open', ''], rows: rules.map(function (r) {
        var open = A.cases.filter(function (c) { return c.ruleId === r.id; }).length;
        return { cells: [{ html: K.toggle(r.enabled, 'rule-toggle', { id: r.id }) }, K.cell(esc(r.name), esc(r.id)), { html: K.pill(SEVWORD[r.base], sevTone(r.base)) }, { cls: 'c-cell', html: r.warnHours != null ? 'Within ' + (r.warnHours >= 48 ? Math.round(r.warnHours / 24) + ' days' : r.warnHours + ' h') : '—' }, { cls: 'c-cell', html: r.urgentHours != null ? 'Within ' + (r.urgentHours >= 72 ? Math.round(r.urgentHours / 24) + ' days' : r.urgentHours + ' h') : r.urgentDaysOverdue ? r.urgentDaysOverdue + ' days overdue' : '—' }, { cls: 'c-cell', html: r.locked ? K.pill(SEVWORD[r.locked], sevTone(r.locked)) : '—' }, { cls: 'c-cell num', html: String(open) }, { cls: 'c-end', html: K.actBtn('Edit', 'rule-edit', { id: r.id }, { variant: 'tertiary', size: 'sm' }) }] };
      }) }));
    }).join('') + K.section('Exceptions', 'Accepted and overridden cases, with approver and reason.', K.table({ cols: 'minmax(0,1.8fr) 150px minmax(0,1.4fr) minmax(0,1.4fr) 90px', head: ['Case', 'Decision', 'Reason', 'Recorded', ''], empty: 'No exceptions yet.', rows: db.getAttentionExceptions().slice().reverse().map(function (e) { return { cells: [K.cell(esc(e.title), esc(e.caseKey)), { html: K.pill(e.type + (e.severity ? ': ' + SEVWORD[e.severity] : ''), e.revoked ? '' : 'info') }, { cls: 'c-cell', html: esc(e.reason) + '<br><small class="c-mute">Approver: ' + esc(e.approver) + '</small>' }, { cls: 'c-cell', html: K.stamp('Recorded', e.by, e.at) + (e.revoked ? '<br><small class="c-mute">Reopened ' + K.dt(e.revoked.at) + '</small>' : '') }, { cls: 'c-end', html: e.revoked ? '' : K.actBtn('Reopen', 'attn-reopen', { id: e.id }, { variant: 'tertiary', size: 'sm' }) }] }; }) })));
  };

  /* ---------------------------------------------------------------- MORE */
  Hub.screens['mgmt-more'] = function (ctx) {
    var me = db.getMe(), t = Hub.brand.terms;
    var h = K.head({ eyebrow: 'Management', title: 'More', sub: 'Management areas that don’t need to occupy the daily Home screen.', actions: '<span class="lx-me">' + ui.avatar(me.name, 'md') + '<span><b>' + esc(me.name) + '</b><small>' + esc(me.email) + '</small></span></span>' });
    var g = K.guard(ctx, h, { empty: false }); if (g) return g;
    function group(title, rows) { return '<section class="lx-group"><h2 class="lx-group__title">' + esc(title) + '</h2><div class="zone-inset">' + ui.rows(rows, 'rows--lead') + '</div></section>'; }
    function r(icon, title, sub, route, trail) { return ui.row({ lead: I(icon, 'row-glyph'), title: esc(title), sub: sub ? [esc(sub)] : null, href: '#' + route, trail: trail || '' }); }
    var fin = K.fin();
    var dev = [r('development', 'Development', 'Framework, feedback review and ' + K.label('IDPs'), 'mgmt-development', K.feature('development') ? '' : '<span class="text-4">Off</span>'),
      r('comms', 'Communications', 'Notices, messages and communication history', 'mgmt-comms', K.feature('communications') ? '' : '<span class="text-4">Off</span>'),
      r('star', 'Content & Brand', 'Resources, coach support, public pages, what we offer', 'mgmt-content')];
    var biz = [fin === 'none' ? ui.row({ lead: I('finance', 'row-glyph'), title: 'Finance', sub: ['You don’t have Finance access'], href: '#mgmt-finance', trail: '<span class="text-4">No access</span>' }) : r('finance', 'Finance', 'Invoices, payments, parent money, costs, cash and reporting', 'mgmt-finance', fin === 'view' ? '<span class="text-4">View only</span>' : ''),
      r('card', 'Bookings', 'Checkouts, booking lines and refunds', 'mgmt-bookings'),
      r('selector', 'Commercial setup', 'Discounts, refund policies, packages, billing rules, terms', 'mgmt-commercial'),
      r('plus', 'Adjustments', 'One-off charges and credits', 'mgmt-adjustments'),
      r('grid', 'Reports', 'Operational, programme and business reporting', 'mgmt-reports'),
      r('shield', 'Audit history', 'Who changed what, and when', 'mgmt-audit'),
      r('settings', 'Settings & System', 'Organisation, branding, labels and feature controls', 'mgmt-settings')];
    var appr = db.getApprovalsWaiting().map(function (a) { return ui.row({ lead: I(a.icon, 'row-glyph'), title: esc(a.label), sub: [esc(a.sub)], trail: a.count ? '<span class="num">' + a.count + ' waiting</span>' : '', href: '#mgmt-' + a.id }); });
    appr.unshift(r('inbox', 'All approvals', 'Sign-ups, trial coaches, claims and trial interest', 'mgmt-approvals'));
    var acct = [ui.row({ lead: I('swap', 'row-glyph'), title: 'Switch to ' + t.staff.toLowerCase() + ' hub', action: 'area', data: { area: 'staff' } }), r('user', 'Profile', '', 'mgmt-profile'), r('bell', 'Notifications', '', 'mgmt-notifications'), r('external', 'View the public site', '', 'pub-home'), ui.row({ lead: I('logout', 'row-glyph'), title: 'Log out', href: '#pub-signin', chevron: false })];
    return K.page(h, '<div class="lx-columns"><div class="lx-col">' + group('Development & Communication', dev) + group('Business & System', biz) + '</div><div class="lx-col">' + group('Approvals', appr) + group('Account', acct) + '</div></div>');
  };
})();
