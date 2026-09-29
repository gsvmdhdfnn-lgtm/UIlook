/* Management: Home, Needs attention, People, More. Content is unchanged
   placeholder material from pass 2; pass 3 changes composition only.
   Each screen has one dominant zone, one supporting zone and a quiet
   tertiary rail. */
(function () {
  var ui = Hub.ui, I = Hub.icon, D = Hub.data, esc = ui.esc;
  function venue(o) { return D.venues[o.venue].name; }
  function todayOcc() { return D.occurrences.filter(function (o) { return o.date === '2026-10-01'; }); }
  function tomorrowOcc() { return D.occurrences.filter(function (o) { return o.date === '2026-10-02'; }); }
  function occProblem(o) {
    if (!o.staff.length) return ui.status('No staff assigned', 'danger');
    if (o.staff.some(function (s) { return s.unavailable; })) return ui.status('Staff unavailable', 'danger');
    return '';
  }
  function skeleton(n) { var r = []; for (var i = 0; i < n; i++) r.push('<div class="row"><span class="skeleton" style="width:14px;height:14px;border-radius:50%"></span><div style="display:grid;gap:8px"><span class="skeleton" style="height:13px;width:' + (58 - i * 7) + '%"></span><span class="skeleton" style="height:11px;width:34%"></span></div><span></span></div>'); return ui.rows(r, 'rows--lead'); }
  function due(c) { return '<span class="num when when--' + c.severity.toLowerCase() + '">' + esc(c.when) + '</span>'; }

  function caseRow(c) {
    return ui.row({
      stretch: true, action: 'case', data: { key: c.caseKey }, cls: c.severity === 'Urgent' ? 'is-urgent' : '',
      lead: ui.sev(c.severity), title: esc(c.title), sub: [esc(c.detail)],
      after: '<div class="row__sub only-narrow">' + due(c) + '</div>',
      trail: '<span class="wide-inline trail-swap">' + due(c) + ui.btn(c.actionLabel, { size: 'sm', cls: 'hover-action', trail: 'arrowRight', attrs: { 'data-action': 'case', 'data-key': c.caseKey } }) + '</span>',
      chevron: false
    });
  }

  function todayTable(list) {
    return ui.table({
      cols: '64px minmax(0, 1.6fr) minmax(0, 1.1fr) 72px minmax(0, 150px)',
      head: ['Time', 'Session', { label: 'Staff', cls: 'wide' }, { label: 'Expected', cls: 'c-num wide' }, { label: '', cls: 'wide' }],
      body: list.map(function (o) {
        return ui.tr([
          { cls: 'c-time', html: o.start + '<small>' + o.end + '</small>' },
          { cls: 'c-main', html: '<span class="c-title">' + esc(o.session) + '</span><span class="c-sub">' + esc(venue(o)) + '<span class="only-narrow-inline"> · ' + o.players + ' expected</span></span>' },
          { cls: 'wide c-cell', html: o.staff.length ? ui.staffNames(o.staff) : '<span class="c-mute">—</span>' },
          { cls: 'c-num wide', html: String(o.players) },
          { cls: 'c-end', html: occProblem(o) }
        ], { action: 'soon', label: 'Open ' + o.session });
      }).join('')
    });
  }

  /* ---------------------------------------------------------------- HOME */
  Hub.screens['mgmt-home'] = function (ctx) {
    var A = D.attention, c = A.summary.counts, live = ctx.state === 'live';
    var head = '<header class="page-head"><div class="page-head__text">' +
      '<h1 class="page-title">Good afternoon, ' + esc(D.me.name.split(' ')[0]) + '</h1>' +
      '<p class="page-meta">Thursday 1 October · ' + esc(D.term) + '</p>' +
      (live ? '<div class="summary-line"><p><span><b>4</b> sessions today</span><span><b>53</b> expected</span><span><b>6</b> staff on duty</span><span class="is-alert"><b>' + c.Urgent + '</b> urgent</span></p></div>' : '') +
      '</div><div class="page-head__actions">' + ui.btn('Review queue', { variant: 'primary', href: '#mgmt-attention', trail: 'arrowRight' }) + '</div></header>';

    var top = A.cases.slice(0, 4);
    var attention = ctx.state === 'loading' ? skeleton(4)
      : ctx.state === 'error' ? ui.notice('danger', 'Open items couldn’t be checked', 'The queue didn’t finish loading, so it isn’t shown as clear. Try again in a moment.', { action: ui.btn('Retry', { size: 'sm', icon: 'refresh' }) })
      : ctx.state === 'empty' ? '<div class="zone-inset">' + ui.empty('checkCircle', 'Nothing needs attention', 'Staffing, cover and compliance are in order.', 'ok') + '</div>'
      : ui.rows(top.map(caseRow), 'rows--lead') + '<a class="more-link" href="#mgmt-attention">' + (A.summary.total - top.length) + ' more in the queue' + I('arrowRight', 'icon-sm') + '</a>';

    var today = ctx.state === 'loading' ? skeleton(3)
      : ctx.state === 'empty' ? '<div class="zone-inset">' + ui.empty('calendar', 'Nothing scheduled today', 'Tomorrow has 2 sessions.') + '</div>'
      : todayTable(todayOcc());

    var approvals = '<div class="zone-inset">' + ui.rows(D.approvals.filter(function (a) { return a.count; }).map(function (a) {
      return ui.row({ title: esc(a.label), trail: '<span class="num">' + a.count + '</span>', href: '#mgmt-' + a.id, cls: 'row--quiet' });
    }), 'rows--quiet') + '</div>';

    var tomorrow = '<div class="zone-inset">' + ui.rows(tomorrowOcc().map(function (o) {
      return ui.row({ title: esc(o.session), sub: [o.start + '–' + o.end, esc(venue(o))], trail: o.staff.length ? '' : '<span class="status status--danger status--plain">No staff</span>', action: 'soon', chevron: false, cls: 'row--quiet' });
    }), 'rows--quiet') + '</div>';

    return '<div class="page">' + head +
      '<div class="layout"><div class="col">' +
        '<section class="section section--primary">' + ui.sectionHead('Needs attention', { meta: live ? A.summary.total + ' open' : '', link: 'Open queue', href: '#mgmt-attention' }) + attention + '</section>' +
        '<section class="section">' + ui.sectionHead('Today', { meta: live ? '4 sessions' : '', link: 'Schedule', href: '#mgmt-schedule' }) + today + '</section>' +
      '</div><aside class="col rail">' +
        '<section class="section section--quiet">' + ui.sectionHead('Awaiting approval') + approvals + '</section>' +
        '<section class="section section--quiet">' + ui.sectionHead('Tomorrow') + tomorrow + '</section>' +
      '</aside></div></div>';
  };

  /* ------------------------------------------------------- NEEDS ATTENTION */
  var filter = 'All';
  Hub.screens['mgmt-attention'] = function (ctx) {
    var A = D.attention, cats = {};
    A.cases.forEach(function (c) { cats[c.category] = (cats[c.category] || 0) + 1; });
    var head = '<header class="page-head"><div class="page-head__text"><h1 class="page-title">Needs attention</h1>' +
      '<p class="page-meta">' + (ctx.state === 'live' ? A.summary.total + ' open items, most urgent first · updated 14:05' : ctx.state === 'empty' ? 'Everything is in order · updated 14:05' : 'Checking…') + '</p></div>' +
      '<div class="page-head__actions">' + ui.btn('Refresh', { variant: 'tertiary', icon: 'refresh', attrs: { 'data-action': 'refresh' } }) + '</div></header>';

    if (ctx.state === 'loading') return '<div class="page page--wide">' + head + skeleton(6) + '</div>';
    if (ctx.state === 'error') return '<div class="page page--wide">' + head + ui.notice('danger', 'The queue couldn’t be checked', 'One of the checks didn’t complete, so this page won’t show a partial list or call it clear. Refresh to try again.', { action: ui.btn('Retry', { size: 'sm', icon: 'refresh' }) }) + '</div>';
    if (ctx.state === 'empty') return '<div class="page page--wide">' + head + '<div class="zone-inset">' + ui.empty('checkCircle', 'Nothing needs attention', 'No staffing gaps, compliance issues, cover or summaries are waiting.', 'ok') + '</div></div>';

    var tabs = '<div class="tabs" role="tablist">' + ['All'].concat(Object.keys(cats)).map(function (k) {
      return '<button type="button" class="tab-btn" role="tab" data-action="filter" data-filter="' + esc(k) + '" aria-selected="' + (filter === k) + '">' + esc(k) + '<span class="count">' + (k === 'All' ? A.cases.length : cats[k]) + '</span></button>';
    }).join('') + '</div>';

    var cols = '16px minmax(0, 1fr) 180px 150px 180px';
    var shown = A.cases.filter(function (c) { return filter === 'All' || c.category === filter; });
    var groups = ['Urgent', 'Warning', 'Normal'].map(function (sev) {
      var list = shown.filter(function (c) { return c.severity === sev; });
      if (!list.length) return '';
      var body = list.map(function (c) {
        return ui.tr([
          { html: ui.sev(c.severity) },
          { cls: 'c-main', html: '<span class="c-title">' + esc(c.title) + '</span><span class="c-sub">' + esc(c.detail) + '</span><span class="c-sub only-narrow">' + due(c) + ' · ' + esc(c.category) + '</span>' },
          { cls: 'c-cell c-mute wide', html: esc(c.category) },
          { cls: 'c-cell wide', html: due(c) },
          { cls: 'c-end wide', html: ui.btn(c.actionLabel, { variant: 'tertiary', size: 'sm', trail: 'arrowRight', attrs: { 'data-action': 'case', 'data-key': c.caseKey } }) }
        ], { action: 'case', data: { key: c.caseKey }, label: c.title });
      }).join('');
      return '<section class="queue-group queue-group--' + sev.toLowerCase() + '"><h2 class="queue-group__title">' + ui.sev(sev) + ui.sevWord(sev) + '<span class="count">' + list.length + '</span></h2>' +
        '<div class="tbl" role="table" style="--cols:' + cols + '">' + body + '</div></section>';
    }).join('');

    return '<div class="page page--wide page--queue">' + head +
      '<div class="section queue">' + tabs +
      '<div class="tbl queue__head" role="table" style="--cols:' + cols + '"><div class="tbl__head" role="row"><div></div><div>Item</div><div class="wide">Area</div><div class="wide">Due</div><div class="wide"></div></div></div>' +
      groups + '</div></div>';
  };

  Hub.actions.filter = function (el) { filter = el.dataset.filter; Hub.render(); };
  Hub.actions.refresh = function (el) { el.classList.add('is-busy'); setTimeout(function () { el.classList.remove('is-busy'); Hub.toast('Queue is up to date'); }, 700); };

  Hub.actions['case'] = function (el) {
    var c = D.attention.cases.filter(function (x) { return x.caseKey === el.dataset.key; })[0];
    if (!c) return;
    var occ = c.related && c.related.occurrence && D.occurrences.filter(function (o) { return o.id === c.related.occurrence; })[0];
    var occHtml = '';
    if (occ) {
      occHtml = '<section class="section">' + ui.sectionHead(occ.session, { meta: (occ.date === '2026-10-01' ? 'Today' : 'Fri 2 Oct') + ', ' + occ.start + '–' + occ.end }) +
        (occ.staff.length ? ui.rows(occ.staff.map(function (s) {
          var co = D.coaches[s.coach];
          return ui.row({ lead: ui.avatar(co.name, 'md'), title: esc(co.name), sub: [s.lead ? 'Lead' : 'Assistant'], trail: s.unavailable ? ui.status('Unavailable', 'danger') : ui.status('Confirmed') });
        }), 'rows--avatar') : '<p>' + ui.status('No staff assigned yet', 'danger') + '</p>') + '</section>';
    }
    Hub.openSheet({
      overline: '<div class="sheet-kicker">' + ui.sev(c.severity) + '<span class="' + (c.severity === 'Urgent' ? 'text-danger' : '') + '">' + ui.sevWord(c.severity) + '</span><span class="text-4">/</span><span>' + esc(c.category) + '</span></div>',
      title: esc(c.title),
      body: ui.fields([['Due', due(c)], ['Details', esc(c.detail)], ['Priority', esc(c.severityReason)], ['Check', esc(c.ruleName) + ' <span class="text-3 mono">' + esc(c.ruleId) + '</span>']]) + occHtml +
        '<p class="text-3 fs-14">This item clears on its own once the underlying issue is fixed.</p>',
      foot: ui.btn('Close', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + ui.btn(c.actionLabel, { variant: 'primary', trail: 'arrowRight', attrs: { 'data-action': 'go-area', 'data-area': c.destination.area } })
    });
  };
  Hub.actions['go-area'] = function (el) { Hub.closeSheet(); Hub.toast('Would open ' + el.dataset.area); };

  /* --------------------------------------------------------------- PEOPLE */
  var peopleFilter = 'all';
  function flagged(p) { return p.compliance === 'warn' || p.compliance === 'danger' || p.flag; }
  Hub.screens['mgmt-coaches'] = function (ctx) {
    var list = D.staff.filter(function (p) { return peopleFilter === 'all' || flagged(p); });
    var head = '<header class="page-head"><div class="page-head__text"><h1 class="page-title">People</h1><p class="page-meta">Staff, clients and families across ' + esc(Hub.brand.orgName) + '</p></div></header>';
    var toolbar = '<div class="toolbar"><div class="tabs" role="tablist"><button type="button" class="tab-btn" role="tab" aria-selected="true">Staff<span class="count">' + D.staff.length + '</span></button><button type="button" class="tab-btn" role="tab" aria-selected="false" data-action="soon">' + esc(Hub.brand.terms.client) + 's<span class="count">214</span></button><button type="button" class="tab-btn" role="tab" aria-selected="false" data-action="soon">Families<span class="count">163</span></button></div>' +
      '<div class="toolbar__end"><label class="search"><span class="visually-hidden">Search people</span>' + I('search') + '<input class="input" id="people-search" placeholder="Search people"></label>' +
      '<div class="segmented" role="group" aria-label="Filter"><button type="button" data-action="pfilter" data-val="all" aria-pressed="' + (peopleFilter === 'all') + '">All</button><button type="button" data-action="pfilter" data-val="flag" aria-pressed="' + (peopleFilter === 'flag') + '">Needs a look</button></div></div></div>';
    if (ctx.state === 'loading') return '<div class="page page--wide">' + head + toolbar + skeleton(6) + '</div>';
    var body = list.map(function (p) {
      var comp = p.compliance === 'danger' ? ui.status(p.complianceText, 'danger') : p.compliance === 'warn' ? ui.status(p.complianceText, 'warn') : '<span class="c-mute">' + esc(p.complianceText) + '</span>';
      return ui.tr([
        { html: ui.avatar(p.name, 'md') },
        { cls: 'c-main', html: '<span class="c-title">' + esc(p.name) + '</span><span class="c-sub">' + esc(p.email) + '</span><span class="c-sub only-narrow">' + esc(p.role) + ' · ' + esc(p.team) + '</span>' },
        { cls: 'c-main wide', html: '<span class="c-cell" style="color:var(--text)">' + esc(p.role) + '</span><span class="c-sub">' + esc(p.team) + '</span>' },
        { cls: 'c-num wide', html: String(p.sessions) },
        { cls: 'c-main wide', html: comp + (p.flag ? '<span class="c-sub">' + esc(p.flag.text) + '</span>' : '') },
        { cls: 'c-cell c-mute wide', html: esc(p.last) },
        { cls: 'c-end', html: (flagged(p) ? '<span class="only-narrow">' + ui.sev(p.compliance === 'danger' || (p.flag && p.flag.tone === 'danger') ? 'Urgent' : 'Warning') + '</span>' : '') + '<span class="wide hover-action">' + ui.iconBtn('dotsV', 'Actions for ' + p.name, { 'data-action': 'soon' }) + '</span>' }
      ], { action: 'person', data: { id: p.id }, label: p.name });
    }).join('');
    return '<div class="page page--wide">' + head + '<div class="section">' + toolbar +
      ui.table({ cols: '36px minmax(0, 1.7fr) minmax(0, 1fr) 84px minmax(0, 1.3fr) 120px 36px', head: ['', 'Name', { label: 'Role', cls: 'wide' }, { label: 'This week', cls: 'c-num wide' }, { label: 'Compliance', cls: 'wide' }, { label: 'Last active', cls: 'wide' }, ''], body: body }) +
      '<p class="table-foot">' + list.length + ' of ' + D.staff.length + ' staff · sorted by name</p></div></div>';
  };
  Hub.actions.pfilter = function (el) { peopleFilter = el.dataset.val; Hub.render(); };
  Hub.actions.person = function (el) {
    var p = D.staff.filter(function (x) { return x.id === el.dataset.id; })[0];
    if (!p) return;
    var comp = [['Enhanced DBS', p.compliance === 'warn' ? ui.status('Expires 13 Oct', 'warn') : '<span class="text-3">Valid to Mar 2028</span>'], ['First aid', p.compliance === 'danger' ? ui.status('Missing', 'danger') : '<span class="text-3">Valid to Jan 2027</span>'], ['Safeguarding', '<span class="text-3">Level 2, current</span>']];
    Hub.openSheet({
      title: '<span class="identity" style="grid-template-columns:auto minmax(0,1fr)">' + ui.avatar(p.name, 'lg') + '<span style="display:grid;gap:4px"><span class="identity__name">' + esc(p.name) + '</span><span class="identity__meta"><span>' + esc(p.role) + '</span><span>' + esc(p.team) + '</span></span></span></span>',
      body: ui.fields([['Sessions this week', '<span class="num">' + p.sessions + '</span>'], ['Last active', esc(p.last)], ['Email', esc(p.email)], ['Team', esc(p.team)]], true) +
        (p.flag ? ui.notice(p.flag.tone === 'danger' ? 'danger' : 'warn', p.flag.text, null) : '') +
        '<section class="section">' + ui.sectionHead('Compliance') + ui.fields(comp) + '</section>',
      foot: ui.btn('Message', { variant: 'tertiary', icon: 'chat' }) + ui.btn('Open profile', { variant: 'primary' })
    });
  };

  /* ---------------------------------------------------------------- MORE */
  Hub.screens['mgmt-more'] = function () {
    var me = D.me, t = Hub.brand.terms;
    function group(title, rows) { return '<section class="section">' + ui.sectionHead(title) + '<div class="zone-inset">' + ui.rows(rows, 'rows--lead') + '</div></section>'; }
    var areaRows = D.areas.map(function (a) {
      var id = a.id === 'coaches' ? 'mgmt-coaches' : 'mgmt-' + a.id;
      return ui.row({ lead: I(a.id === 'coaches' ? 'users' : a.id === 'players' ? 'family' : a.icon, 'row-glyph'), title: esc(a.id === 'coaches' ? 'People' : a.label), sub: [esc(a.sub)], trail: a.on ? '' : '<span class="text-4">Off</span>', href: '#' + id });
    });
    var approvalRows = D.approvals.map(function (a) { return ui.row({ lead: I(a.icon, 'row-glyph'), title: esc(a.label), trail: a.count ? '<span class="num">' + a.count + ' waiting</span>' : '', href: '#mgmt-' + a.id }); });
    var accountRows = [['user', 'Profile'], ['bell', 'Notifications'], ['chat', 'Send feedback'], ['phone', 'Contact the office']].map(function (r) { return ui.row({ lead: I(r[0], 'row-glyph'), title: r[1], action: 'soon' }); });
    accountRows.push(ui.row({ lead: I('logout', 'row-glyph'), title: 'Log out', action: 'soon', chevron: false }));
    return '<div class="page">' +
      '<header class="page-head"><div class="identity me-head">' + ui.avatar(me.name, 'lg') + '<div style="display:grid;gap:4px;min-width:0"><h1 class="page-title">' + esc(me.name) + '</h1><span class="identity__meta"><span>Management</span><span>' + esc(me.email) + '</span></span></div></div>' +
        '<div class="page-head__actions">' + ui.btn('Switch to ' + t.staff.toLowerCase() + ' view', { variant: 'secondary', icon: 'swap', attrs: { 'data-action': 'area', 'data-area': 'staff' } }) + '</div></header>' +
      '<div class="layout layout--even"><div class="col">' + group('Workspace', areaRows) + '</div><div class="col">' + group('Approvals', approvalRows) + group('Organisation', [ui.row({ lead: I('settings', 'row-glyph'), title: 'Settings', sub: ['Branding, modules, system health'], href: '#mgmt-settings' })]) + group('Account', accountRows) + '</div></div></div>';
  };
})();
