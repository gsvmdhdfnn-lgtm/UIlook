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
    var st = db.occState(o), why = db.staffIssue(o);
    if (st === 'Awaiting confirmation') return ['Awaiting confirmation', 'warn'];
    if (st === 'Confirmed' || st === 'Partially delivered') return [st, 'ok'];
    if (!o.staff.length) return ['No coach', 'danger'];
    if (why) return [why, 'warn'];
    return ['Staffed', 'ok'];
  }
  K.route('mgmt-home', { title: 'Home' });
  K.route('mgmt-attention', { title: 'Needs attention', parent: 'home' });
  K.route('mgmt-attention-rules', { title: 'Needs attention rules', parent: 'more' });
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
      '<span class="lx-area__value"><b class="num">' + o.value + '</b><small>' + esc(o.label) + '</small>' + (o.need ? '<span class="hm-areas__need">' + esc(o.need) + '</span>' : '') + '</span></a>';
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
    var N = attnNow(), c = N.counts, empty = state === 'empty' || !N.total;
    var head = '<div class="hx-card__head"><div><h2>Needs attention</h2><small class="hx-sub">' + (empty ? 'Nothing waiting' : N.total + ' to do' + (N.waiting.length ? ' · ' + N.waiting.length + ' waiting on others' : '')) + '</small></div><a class="hx-link" href="#mgmt-attention">View all' + I('arrowRight', 'icon-sm') + '</a></div>';
    if (empty) return '<section class="hx-card hm-attn" id="hm-attn">' + head + ui.empty('checkCircle', 'All clear', 'Nothing currently needs management action.', 'ok') + '</section>';
    var sev = '<div class="hm-sev num">' + [['Urgent', 'urgent'], ['Warning', 'warning'], ['Normal', 'normal']].map(function (x) { return '<a class="hm-sev__i hm-sev--' + x[1] + '" href="#mgmt-attention"><i></i><b>' + c[x[0]] + '</b>' + SEVWORD[x[0]] + '</a>'; }).join('') + '</div>';
    var rows = '<div class="hx-list">' + N.active.slice(0, 5).map(function (g) {
      var k = g.lead, more = g.issues.length - 1;
      return '<a class="hx-attn' + (g.severity === 'Urgent' ? ' is-urgent' : '') + '" data-case-key="' + esc(k.caseKey) + '" href="#' + esc(k.route || 'mgmt-attention') + '"><span class="hx-dot hx-tone--' + (g.severity === 'Urgent' ? 'danger' : g.severity === 'Warning' ? 'warn' : 'muted') + '"></span><span class="hx-attn__main"><b>' + esc(k.title) + '</b><small>' + esc(k.when) + ' · ' + esc(k.actionLabel || 'Open') + (more ? ' · +' + more + ' more' : '') + '</small></span>' + I('chevron', 'icon-sm hx-chev') + '</a>';
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
    var fin = K.fin() !== 'none', owed = fin ? db.fin.receivables().total : 0;
    var NC = attnNow().active;
    function waiting(cats) { var n = NC.filter(function (g) { return g.issues.some(function (k) { return cats.indexOf(k.category) >= 0; }); }).length; return n ? n + ' need' + (n === 1 ? 's' : '') + ' you' : ''; }
    var areas = '<div class="lx-areas lx-areas--stat hm-areas" aria-label="Your four areas">' +
      areaCard({ route: 'mgmt-schedule', icon: 'calendar', title: 'Schedule & Sessions', value: empty ? 0 : T.length, label: 'today', need: waiting(['Sessions & Venues', 'Staffing & Cover']) }) +
      areaCard({ route: 'mgmt-coaches', icon: 'coaches', title: 'Coaches', value: active, label: 'active', need: waiting(['Coaches & Compliance', 'Staffing & Cover']) }) +
      areaCard({ route: 'mgmt-players', icon: 'players', title: 'Players & Parents', value: players, label: 'active players', need: waiting(['Players & Parents']) }) +
      areaCard({ route: 'mgmt-finance', icon: 'finance', title: 'Financials', value: fin ? K.money(owed).replace(/\.\d\d$/, '') : '—', label: fin ? 'owed to us' : 'ask for Finance access', need: fin ? waiting(['Finance']) : '' }) + '</div>';
    var UN = attnNow(), urgent = UN.active.filter(function (g) { return g.severity === 'Urgent'; }).map(function (g) { return g.lead; }), c = UN.counts;
    var urgentSum = empty || !urgent.length ? '' : '<section class="hm-urgent" aria-label="Urgent actions"><a class="hm-urgent__head" href="#hm-attn"><span class="hm-urgent__k">' + ui.sev('Urgent') + '<b class="num">' + urgent.length + ' urgent</b><span class="num">· ' + c.Warning + ' warning · ' + c.Normal + ' to do</span></span><span class="hm-urgent__go">Review' + I('arrowRight', 'icon-sm') + '</span></a>' +
      urgent.map(function (k) { return '<a class="hm-urgent__row" data-case-key="' + esc(k.caseKey) + '" href="#' + esc(k.route || 'mgmt-attention') + '"><b>' + esc(k.title) + '</b><small>' + esc(k.when) + ' · ' + esc(k.actionLabel || 'Open') + '</small></a>'; }).join('') + '</section>';
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
    /* Approvals are Needs Attention items now, so there is one list of decisions */
    return shell(urgentSum + areas + '<div class="hm__pair">' + attentionPanel(ctx.state) + sched + '</div>', tom + cal);
  };

  /* ------------------------------------------------------ NEEDS ATTENTION
     One card per date or coach (each problem underneath is still its own issue): what is wrong,
     why it matters, and the one action that opens the exact task. Urgent first, soonest first.
     Waiting on others is folded away and not counted until Management is needed again. */
  var attnCategory = 'All';
  /* The four areas are filtered views of this one list (never separate queues) */
  var AREA_CATS = { 'Schedule & Sessions': ['Sessions & Venues', 'Staffing & Cover'], 'Coaches': ['Coaches & Compliance', 'Staffing & Cover'], 'Players & Parents': ['Players & Parents'], 'Financials': ['Finance'] };
  function inFilter(g) { var cats = AREA_CATS[attnCategory] || [attnCategory]; return attnCategory === 'All' || g.issues.some(function (k) { return cats.indexOf(k.category) >= 0; }); }
  Hub.actions['attn-area'] = function (el) { attnCategory = el.dataset.area || 'All'; Hub.wsTabs.attention = 'All'; if (location.hash === '#mgmt-attention') Hub.render(); else Hub.go('mgmt-attention'); };
  document.addEventListener('change', function (e) { if (e.target.matches && e.target.matches('[data-change="attn-cat"]')) { attnCategory = e.target.value; Hub.render(); } });
  /* Every surface reads the same cards */
  function attnNow() {
    var A = db.getAttention(), all = db.getAttentionCards(A.cases), active = all.filter(function (g) { return !g.waiting; }), waiting = all.filter(function (g) { return g.waiting; });
    var counts = { Urgent: 0, Warning: 0, Normal: 0 }; active.forEach(function (g) { counts[g.severity]++; });
    return { A: A, active: active, waiting: waiting, counts: counts, total: active.length };
  }
  Hub.attnNow = attnNow;
  function issueCard(g) {
    var k = g.lead, sv = g.waiting ? 'normal' : (g.severity === 'Normal' ? 'normal' : g.severity.toLowerCase()), also = g.issues.slice(1);
    var where = g.group ? esc(g.group.title) + ' · ' + esc(g.group.sub) : esc(k.category);
    return '<article class="lx-issue lx-issue--' + sv + '"><div class="lx-issue__main"><span class="lx-issue__tags">' + (g.waiting ? K.pill('Waiting', '') : K.pill(SEVWORD[g.severity], sevTone(g.severity))) + '<span class="lx-issue__cat">' + where + '</span></span>' +
      '<h3><button type="button" class="lx-issue__link" data-action="case" data-key="' + esc(k.caseKey) + '">' + esc(k.title) + '</button></h3>' +
      '<p class="lx-issue__meta">' + esc(k.why || k.detail || '') + '</p>' +
      '<p class="lx-issue__why"><span class="num when when--' + (g.waiting ? 'normal' : k.severity.toLowerCase()) + '">' + esc(k.when) + '</span>' + (k.reopened ? '<span>Back after being left as it is: ' + esc(k.reopened.lapsed ? k.reopened.lapsed.why.toLowerCase() : 'something changed') + '</span>' : '') + '</p>' +
      (also.length ? '<ul class="lx-also" aria-label="Also">' + also.map(function (c) {
        return '<li>' + (c.waiting ? '<span class="lx-also__tag">Waiting</span>' : ui.sev(c.severity)) + '<span class="lx-also__t">' + esc(c.title) + '</span><a class="lx-also__go" href="#' + esc(c.route) + '" data-case-key="' + esc(c.caseKey) + '">' + esc(c.actionLabel) + '</a></li>';
      }).join('') + '</ul>' : '') + '</div>' +
      '<div class="lx-issue__act">' + K.goBtn(k.actionLabel, k.route, { variant: 'primary', trail: 'arrowRight', attrs: { 'data-case-key': k.caseKey } }) + '</div></article>';
  }
  function leftCard(k) {
    var e = k.exception;
    return '<article class="lx-issue lx-issue--normal"><div class="lx-issue__main"><span class="lx-issue__tags">' + K.pill('Left as it is', 'ok') + '<span class="lx-issue__cat">' + esc(k.category) + '</span></span><h3>' + esc(k.title) + '</h3>' +
      '<p class="lx-issue__meta">“' + esc(e.reason) + '”' + (e.scope && e.scope.label ? ' · ' + esc(e.scope.label) : '') + '</p><p class="lx-issue__why"><span>' + K.stamp('Agreed', e.by, e.at) + '</span><span>Comes back if anything material changes</span></p></div>' +
      '<div class="lx-issue__act">' + K.actBtn('Reopen', 'attn-reopen', { id: e.id }, { variant: 'secondary' }) + '</div></article>';
  }
  Hub.screens['mgmt-attention'] = function (ctx) {
    var N = attnNow(), c = N.counts;
    var tabs = [{ id: 'All', label: 'All', meta: N.total + ' to do' }, { id: 'Urgent', label: 'Urgent', meta: c.Urgent, state: 'Urgent' }, { id: 'Warning', label: 'Warning', meta: c.Warning, state: 'Warning' }, { id: 'Normal', label: 'To do', meta: c.Normal }, { id: 'Accepted', label: 'Left as it is', meta: N.A.left.length }];
    var sev = K.tab('attention', tabs);
    var cats = ['Staffing & Cover', 'Coaches & Compliance', 'Sessions & Venues', 'Players & Parents', 'Development', 'Finance'];
    var select = '<label class="lx-select"><span class="visually-hidden">Area</span>' + I('filter', 'icon-sm') + '<select data-change="attn-cat">' + ['All'].concat(Object.keys(AREA_CATS)).concat(cats.filter(function (x) { return !AREA_CATS[x]; })).map(function (k) { return '<option value="' + esc(k) + '"' + (k === attnCategory ? ' selected' : '') + '>' + (k === 'All' ? 'Every area' : esc(k)) + '</option>'; }).join('') + '</select></label>';
    var h = K.head({ back: ['mgmt-home', 'Home'], eyebrow: 'Needs attention', title: 'Needs attention', sub: '<span class="na-sub">Everything waiting for a Management decision, most urgent first. Each item says what’s wrong, why it matters and what to do, and clears itself once it’s fixed.</span>',
      actions: K.goBtn('Rules', 'mgmt-attention-rules', { variant: 'tertiary', icon: 'settings' }), tabs: '<div class="lx-filterbar">' + K.tabs('attention', tabs) + select + '</div>' });
    var g = K.guard(ctx, h, { empty: ['checkCircle', 'All clear', 'No staffing gaps, compliance issues, registers, claims or finance items are waiting.'] }); if (g) return g;
    if (sev === 'Accepted') {
      var left = N.A.left.filter(function (k) { return inFilter({ issues: [k] }); });
      return K.page(h, left.length ? '<div class="lx-stack">' + left.map(leftCard).join('') + '</div><p class="lx-note">Each one was a deliberate decision with a reason and who agreed it. It comes back to the queue on its own if something material changes, or when its time limit passes.</p>' : '<div class="zone-inset">' + ui.empty('checkCircle', 'Nothing left as it is', 'When you decide to leave something as it is, it shows here with the reason.', 'ok') + '</div>');
    }
    var list = N.active.filter(function (x) { return (sev === 'All' || x.severity === sev) && inFilter(x); });
    var wait = sev === 'All' ? N.waiting.filter(inFilter) : [];
    var body = list.length ? '<div class="lx-stack na-list">' + list.map(issueCard).join('') + '</div>' : '<div class="zone-inset">' + ui.empty('checkCircle', sev === 'All' ? 'Nothing needs you' : 'Nothing in this filter', sev === 'All' ? 'Everything is sorted or waiting on someone else.' : 'Try another priority or area.', 'ok') + '</div>';
    var waitSec = wait.length ? K.details('Waiting on others (' + wait.length + ')', '<div class="lx-stack na-list">' + wait.map(issueCard).join('') + '</div>', { sub: 'You’ve done your part. These come back up when you’re needed: someone can cover, no one can, or it gets close.', key: 'na-waiting' }) : '';
    return K.page(h, body + waitSec);
  };
  Hub.actions['attn-refresh'] = function () { Hub.render(); };
  Hub.actions['attn-reopen'] = function (el) { Hub.mutate(function () { db.revokeAttentionException(el.dataset.id); }, 'Reopened. It’s back in Needs attention'); };

  /* Item detail: what, why, what to do, and "Leave as it is" as a deliberate exception */
  Hub.actions['case'] = function (el) {
    var c = db.getAttentionCase(el.dataset.key);
    if (!c) { Hub.toast('This item has already been resolved'); return; }
    var siblings = c.group && c.group.kind ? db.getAttentionCases().filter(function (x) { return x.caseKey !== c.caseKey && x.group && x.group.key === c.group.key; }) : [];
    Hub.openSheet({
      overline: '<div class="sheet-kicker">' + ui.sev(c.severity) + '<span class="' + (c.severity === 'Urgent' ? 'text-danger' : '') + '">' + (c.waiting ? 'Waiting on others' : SEVWORD[c.severity]) + '</span><span class="text-4">/</span><span>' + esc(c.group && c.group.kind ? c.group.title : c.category) + '</span></div>',
      title: esc(c.title),
      body: K.kv([['Why it matters', esc(c.why || '')], ['When', '<span class="num when when--' + c.severity.toLowerCase() + '">' + esc(c.when) + '</span>' + (c.severityReason ? ' <small class="k-note">' + esc(c.severityReason) + '</small>' : '')], c.detail ? ['Details', esc(c.detail)] : null,
        c.exception ? [c.exception.type, '“' + esc(c.exception.reason) + '”' + (c.exception.scope && c.exception.scope.label ? ' · ' + esc(c.exception.scope.label) : '') + '<br>' + K.stamp('By', c.exception.by, c.exception.at)] : null,
        c.reopened && c.reopened.lapsed ? ['Came back', esc(c.reopened.lapsed.why) + ' (was left as it is by ' + esc(c.reopened.by) + ': “' + esc(c.reopened.reason) + '”)'] : null].filter(Boolean)) +
        (siblings.length ? '<h3 class="k-h3">Also on this ' + (c.group.kind === 'date' ? 'date' : 'coach') + '</h3>' + ui.rows(siblings.map(function (x) { return ui.row({ lead: ui.sev(x.severity), title: esc(x.title), sub: [esc(x.why || '')], href: '#' + x.route }); })) : '') +
        '<p class="text-3 fs-14">This clears on its own once the problem is fixed.</p>',
      foot: (c.exception ? '' : K.actBtn('Leave as it is', 'case-except', { key: c.caseKey }, { variant: 'tertiary' })) + K.goBtn(c.actionLabel, c.route, { variant: 'primary', trail: 'arrowRight', attrs: { 'data-case-key': c.caseKey } })
    });
  };
  Hub.actions['case-except'] = function (el) {
    var c = db.getAttentionCase(el.dataset.key), occ = c.related && c.related.occurrence && db.getOccurrence(c.related.occurrence);
    var scopes = (occ ? [['date', 'This date only (' + K.dd(occ.date) + ')']] : []).concat([['change', 'Until something changes'], ['until', 'Until a date']]);
    Hub.openSheet({ overline: '<span class="overline">Leave as it is</span>', title: esc(c.title),
      meta: '<p class="k-note">Use this when you’ve decided not to fix it, for a good reason. It leaves the queue, stays visible where it applies, and comes back on its own if something material changes. Your name, the time and the reason are kept.</p>',
      body: K.form([K.field('Decision', K.select('ex_type', [['Leave as it is', 'Leave as it is'], ['Change priority', 'Change its priority instead']], 'Leave as it is')),
        K.field('For how long', K.select('ex_scope', scopes, scopes[0][0])), K.field('Until (if a date)', K.input('ex_until', K.addDays(K.today, 7), { type: 'date' })),
        K.field('Priority (if changing it)', K.select('ex_sev', [['Normal', 'To do'], ['Warning', 'Warning'], ['Urgent', 'Urgent']], 'Normal')),
        K.field('Why?', K.input('ex_reason', '', { placeholder: 'For example: small group this week, two coaches is enough' }), null, true)], 1) + '<p class="k-note">Recorded as ' + esc(K.me()) + ', now.</p>',
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Save', 'case-except-save', { key: c.caseKey }, { variant: 'primary' }) });
  };
  Hub.actions['case-except-save'] = function (el) {
    var c = db.getAttentionCase(el.dataset.key), r = K.val('ex_reason').trim(); if (!r) { Hub.toast('Say why'); return; }
    var t = K.val('ex_type'), sc = K.val('ex_scope'), until = K.val('ex_until'), occ = c.related && c.related.occurrence && db.getOccurrence(c.related.occurrence);
    if (sc === 'until' && (!until || until < K.today)) { Hub.toast('Pick a date from today'); return; }
    var scope = sc === 'date' ? { kind: 'date', date: occ.date, label: 'For ' + K.dd(occ.date) + ' only' } : sc === 'until' ? { kind: 'until', until: until, label: 'Until ' + K.dd(until) } : { kind: 'change', label: 'Until something changes' };
    var e = { caseKey: c.caseKey, title: c.title, type: t, severity: t === 'Change priority' ? K.val('ex_sev') : null, reason: r, scope: scope, occurrence: occ ? occ.id : null };
    Hub.closeSheet(true); Hub.mutate(function () { db.addAttentionException(e); }, t === 'Leave as it is' ? 'Left as it is, with your reason' : 'Priority changed');
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
    var cats = ['Staffing & Cover', 'Coaches & Compliance', 'Sessions & Venues', 'Players & Parents', 'Development', 'Finance'];
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
    var h = K.head({ eyebrow: 'Management', title: 'More', sub: 'Less frequent work: development, communication, reports and settings.', actions: '<span class="lx-me">' + ui.avatar(me.name, 'md') + '<span><b>' + esc(me.name) + '</b><small>' + esc(me.email) + '</small></span></span>' });
    var g = K.guard(ctx, h, { empty: false }); if (g) return g;
    function group(title, rows) { return '<section class="lx-group"><h2 class="lx-group__title">' + esc(title) + '</h2><div class="zone-inset">' + ui.rows(rows, 'rows--lead') + '</div></section>'; }
    function r(icon, title, sub, route, trail) { return ui.row({ lead: I(icon, 'row-glyph'), title: esc(title), sub: sub ? [esc(sub)] : null, href: '#' + route, trail: trail || '' }); }
    var dev = [r('development', 'Development', 'Framework, feedback review and ' + K.label('IDPs'), 'mgmt-development', K.feature('development') ? '' : '<span class="text-4">Off</span>'),
      r('comms', 'Communications', 'Notices and messages to families and coaches', 'mgmt-comms', K.feature('communications') ? '' : '<span class="text-4">Off</span>'),
      r('star', 'Content & Brand', 'Resources, coach support, public pages, what we offer', 'mgmt-content')];
    var reports = [r('grid', 'Reports', 'Attendance, registers, schools and development', 'mgmt-reports'),
      r('clock', 'History', 'Who changed what, and when, across the Hub', 'mgmt-audit')];
    var sys = [r('settings', 'Settings & System', 'Organisation, branding, labels and feature controls', 'mgmt-settings'),
      r('alertCircle', 'Needs attention rules', 'What raises an item, and how urgent it is', 'mgmt-attention-rules')];
    var acct = [ui.row({ lead: I('swap', 'row-glyph'), title: 'Switch to ' + t.staff.toLowerCase() + ' hub', action: 'area', data: { area: 'staff' } }), r('user', 'Profile', '', 'mgmt-profile'), r('bell', 'Notifications', '', 'mgmt-notifications'), r('external', 'View the public site', '', 'pub-home')];
    var note = '<p class="k-note lx-more-note">Sessions, Coaches, Players & Parents and Financials are on ' + K.link('mgmt-home', 'Home') + '.</p>';
    return K.page(h, note + '<div class="lx-columns"><div class="lx-col">' + group('Development & communication', dev) + group('Reports & history', reports) + '</div><div class="lx-col">' + group('Settings', sys) + group('Account', acct) + '</div></div>');
  };
})();
