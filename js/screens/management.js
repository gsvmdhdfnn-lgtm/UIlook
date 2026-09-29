/* Management: Home, Needs Attention, People, More. Content is placeholder
   material; the screens exist to prove the visual system. */
(function () {
  var ui = Hub.ui, I = Hub.icon, D = Hub.data, esc = ui.esc;
  function venue(o) { return D.venues[o.venue].name; }
  function todayOcc() { return D.occurrences.filter(function (o) { return o.date === '2026-10-01'; }); }
  function tomorrowOcc() { return D.occurrences.filter(function (o) { return o.date === '2026-10-02'; }); }
  function occStatus(o) {
    if (!o.staff.length) return ui.status('No staff assigned', 'danger');
    if (o.staff.some(function (s) { return s.unavailable; })) return ui.status('Staff unavailable', 'danger');
    return '<span class="wide-inline">' + ui.status('Staffed') + '</span>';
  }
  function skeletonRows(n) { var r = ''; for (var i = 0; i < n; i++) r += '<div class="row"><span class="skeleton" style="width:18px;height:18px;border-radius:50%"></span><div style="display:grid;gap:6px"><span class="skeleton" style="height:12px;width:' + (60 - i * 8) + '%"></span><span class="skeleton" style="height:10px;width:35%"></span></div><span></span></div>'; return ui.rows([r]); }

  /* ---------- Needs attention rows (used on Home) ---------- */
  function caseRow(c) {
    return ui.row({
      stretch: true, action: 'case', data: { key: c.caseKey },
      lead: ui.sev(c.severity), title: esc(c.title), sub: [esc(c.detail)], cls: 'case-row',
      after: '<div class="row__sub only-narrow"><span class="num when when--' + c.severity.toLowerCase() + '">' + esc(c.when) + '</span></div>',
      trail: '<span class="wide-inline trail-swap"><span class="num when when--' + c.severity.toLowerCase() + '">' + esc(c.when) + '</span>' + ui.btn(c.actionLabel, { variant: 'secondary', size: 'sm', cls: 'hover-action', attrs: { 'data-action': 'case', 'data-key': c.caseKey } }) + '</span>',
      chevron: false
    });
  }

  function todayTable(list) {
    return ui.table({
      cols: '72px minmax(0, 1.6fr) minmax(0, 1.4fr) minmax(0, 1.2fr) 80px 160px',
      head: ['Time', 'Session', { label: 'Location', cls: 'wide' }, { label: 'Staff', cls: 'wide' }, { label: 'Expected', cls: 'c-num wide' }, { label: 'Status', cls: 'c-end' }],
      body: list.map(function (o) {
        return ui.tr([
          { cls: 'c-time', html: o.start + '<small>' + o.end + '</small>' },
          { cls: 'c-main', html: '<span class="c-title">' + esc(o.session) + '</span><span class="c-sub wide-sub">' + esc(o.programme) + ' programme</span><span class="c-sub only-narrow">' + esc(venue(o)) + ' · ' + o.players + ' expected</span>' },
          { cls: 'c-cell c-mute wide', html: esc(venue(o)) },
          { cls: 'wide staff-cell', html: o.staff.length ? ui.staffAvatars(o.staff) + '<span class="c-cell">' + ui.staffNames(o.staff) + '</span>' : '<span class="c-mute">—</span>' },
          { cls: 'c-num wide', html: String(o.players) },
          { cls: 'c-end', html: occStatus(o) }
        ], { action: 'soon', label: 'Open ' + o.session });
      }).join('')
    });
  }

  function metrics(cls) {
    var c = D.attention.summary.counts;
    return '<div class="metrics ' + (cls || '') + '">' +
      ui.metric('Sessions today', '4', '15:30 – 20:30') +
      ui.metric('Expected attendance', '53', 'Across 2 locations') +
      ui.metric('Staff on duty', '6', '1 unavailable') +
      ui.metric('Open items', String(D.attention.summary.total), '<span class="count count--alert">' + c.Urgent + ' urgent</span>', 'danger') +
      (String(cls).indexOf('metrics--compact') >= 0 ? '' : ui.metric('Awaiting approval', '4', 'Oldest 2 days')) +
      '</div>';
  }

  function todayHead(ctx) { return ui.sectionHead('Today', { meta: ctx.state === 'live' ? '4 sessions \u00b7 53 expected' : '', link: 'Schedule', href: '#mgmt-schedule' }); }

  /* ---------------------------------------------------------------- HOME */
  Hub.screens['mgmt-home'] = function (ctx) {
    var A = D.attention;
    var head = ui.pageHead({ overline: 'Thursday 1 October 2026 · ' + D.term, title: 'Good afternoon, ' + D.me.name.split(' ')[0],
      actions: ui.btn('View schedule', { href: '#mgmt-schedule', icon: 'calendar', cls: 'wide-inline' }) + ui.btn('Review queue', { variant: 'primary', href: '#mgmt-attention' }) });

    var attention;
    if (ctx.state === 'loading') attention = '<div class="panel">' + skeletonRows(4) + '</div>';
    else if (ctx.state === 'error') attention = ui.notice('danger', 'Open items couldn’t be checked', 'The queue didn’t finish loading, so it isn’t shown as clear. Try again in a moment.', { action: ui.btn('Retry', { size: 'sm', icon: 'refresh' }) });
    else if (ctx.state === 'empty') attention = '<div class="panel">' + ui.empty('checkCircle', 'Nothing needs attention', 'Staffing, cover and compliance are in order.', 'ok') + '</div>';
    else attention = '<div class="panel">' + ui.rows(A.cases.slice(0, 5).map(caseRow), 'rows--lead') + '<div class="panel__foot"><span>Showing 5 of ' + A.summary.total + '</span><a class="section-link" href="#mgmt-attention">Open queue' + I('chevron', 'icon-sm') + '</a></div></div>';

    var today = ctx.state === 'loading' ? '<div class="panel">' + skeletonRows(4) + '</div>'
      : ctx.state === 'empty' ? '<div class="panel">' + ui.empty('calendar', 'Nothing scheduled today', 'Tomorrow has 2 sessions.') + '</div>'
      : '<div class="panel">' + todayTable(todayOcc()) + '</div>';

    var approvals = '<div class="panel">' + ui.rows(D.approvals.filter(function (a) { return a.count; }).map(function (a) {
      return ui.row({ lead: '<span class="row__icon">' + I(a.icon, 'icon-sm') + '</span>', title: esc(a.label), trail: '<span class="num">' + a.count + ' waiting</span>', href: '#mgmt-' + a.id });
    }), 'rows--lead') + '</div>';

    var tomorrow = '<div class="panel">' + ui.rows(tomorrowOcc().map(function (o) {
      return ui.row({ lead: '<span class="row__time">' + o.start + '<small>' + o.end + '</small></span>', title: esc(o.session), sub: [esc(venue(o))], trail: o.staff.length ? '' : ui.status('No staff', 'danger'), action: 'soon', chevron: false });
    }), 'rows--time') + '</div>';

    return '<div class="page page--home">' + head + metrics('only-wide') +
      '<div class="layout"><div class="col">' +
        '<section class="section">' + ui.sectionHead('Needs attention', { meta: ctx.state === 'live' ? A.summary.total + ' open' : '', link: 'View all', href: '#mgmt-attention' }) + attention + '</section>' +
        metrics('metrics--compact only-narrow-block') +
        '<section class="section only-narrow-block">' + todayHead(ctx) + today + '</section>' +
      '</div><div class="col">' +
        '<section class="section">' + ui.sectionHead('Awaiting approval', { meta: '4' }) + approvals + '</section>' +
        '<section class="section">' + ui.sectionHead('Tomorrow', { meta: 'Friday 2 October' }) + tomorrow + '</section>' +
      '</div></div>' +
      '<section class="section only-wide">' + todayHead(ctx) + today + '</section>' +
      '</div>';
  };

  /* ------------------------------------------------------- NEEDS ATTENTION */
  var filter = 'All';
  Hub.screens['mgmt-attention'] = function (ctx) {
    var A = D.attention, cats = {};
    A.cases.forEach(function (c) { cats[c.category] = (cats[c.category] || 0) + 1; });
    var head = ui.pageHead({ overline: 'Management', title: 'Needs attention',
      sub: ctx.state === 'live' ? A.summary.total + ' open · <span class="text-danger">' + A.summary.counts.Urgent + ' urgent</span> · updated 14:05' : ctx.state === 'empty' ? 'Everything is in order · updated 14:05' : '',
      actions: ui.btn('Refresh', { icon: 'refresh', attrs: { 'data-action': 'refresh' } }) });

    if (ctx.state === 'loading') return '<div class="page">' + head + '<div class="panel">' + skeletonRows(6) + '</div></div>';
    if (ctx.state === 'error') return '<div class="page">' + head + ui.notice('danger', 'The queue couldn’t be checked', 'One of the checks didn’t complete, so this page won’t show a partial list or call it clear. Refresh to try again.', { action: ui.btn('Retry', { size: 'sm', icon: 'refresh' }) }) + '</div>';
    if (ctx.state === 'empty') return '<div class="page">' + head + '<div class="panel">' + ui.empty('checkCircle', 'Nothing needs attention', 'No staffing gaps, compliance issues, cover or summaries are waiting.', 'ok') + '</div></div>';

    var tabs = '<div class="tabs" role="tablist">' + ['All'].concat(Object.keys(cats)).map(function (k) {
      return '<button type="button" class="tab-btn" role="tab" data-action="filter" data-filter="' + esc(k) + '" aria-selected="' + (filter === k) + '">' + esc(k) + '<span class="count">' + (k === 'All' ? A.cases.length : cats[k]) + '</span></button>';
    }).join('') + '</div>';

    var shown = A.cases.filter(function (c) { return filter === 'All' || c.category === filter; });
    var body = ['Urgent', 'Warning', 'Normal'].map(function (sev) {
      var list = shown.filter(function (c) { return c.severity === sev; });
      if (!list.length) return '';
      return ui.group(ui.sevWord(sev), list.length, ui.sev(sev)) + list.map(function (c) {
        return ui.tr([
          { html: ui.sev(c.severity) },
          { cls: 'c-main', html: '<span class="c-title">' + esc(c.title) + '</span><span class="c-sub">' + esc(c.detail) + '</span><span class="c-sub only-narrow"><span class="when when--' + sev.toLowerCase() + '">' + esc(c.when) + '</span> · ' + esc(c.category) + '</span>' },
          { cls: 'c-cell c-mute wide', html: esc(c.category) },
          { cls: 'c-cell wide num when when--' + sev.toLowerCase(), html: esc(c.when) },
          { cls: 'c-end wide', html: ui.btn(c.actionLabel, { variant: 'secondary', size: 'sm', attrs: { 'data-action': 'case', 'data-key': c.caseKey } }) }
        ], { action: 'case', data: { key: c.caseKey }, label: c.title });
      }).join('');
    }).join('');

    return '<div class="page page--queue">' + head +
      '<div class="section">' + tabs +
      '<div class="panel queue">' + ui.table({ cols: '18px minmax(0, 1fr) 170px 130px 150px', head: ['', 'Item', { label: 'Area', cls: 'wide' }, { label: 'Due', cls: 'wide' }, { label: '', cls: 'wide' }], body: body }) + '</div>' +
      '</div></div>';
  };

  Hub.actions.filter = function (el) { filter = el.dataset.filter; Hub.render(); };
  Hub.actions.refresh = function (el) { el.classList.add('is-busy'); setTimeout(function () { el.classList.remove('is-busy'); Hub.toast('Queue is up to date'); }, 700); };

  Hub.actions['case'] = function (el) {
    var c = D.attention.cases.filter(function (x) { return x.caseKey === el.dataset.key; })[0];
    if (!c) return;
    var occ = c.related && c.related.occurrence && D.occurrences.filter(function (o) { return o.id === c.related.occurrence; })[0];
    var occHtml = '';
    if (occ) {
      occHtml = '<section class="section">' + ui.sectionHead('Session') + '<div class="panel">' +
        '<div class="panel__head"><div><div class="panel__title">' + esc(occ.session) + '</div><div class="text-3 fs-13">' + (occ.date === '2026-10-01' ? 'Today' : 'Fri 2 Oct') + ', ' + occ.start + '–' + occ.end + ' · ' + esc(venue(occ)) + '</div></div></div>' +
        (occ.staff.length ? ui.rows(occ.staff.map(function (s) {
          var co = D.coaches[s.coach];
          return ui.row({ lead: ui.avatar(co.name, 'md'), title: esc(co.name), sub: [s.lead ? 'Lead' : 'Assistant'], trail: s.unavailable ? ui.status('Unavailable', 'danger') : ui.status('Confirmed') });
        }), 'rows--lead') : '<div class="panel--pad">' + ui.status('No staff assigned yet', 'danger') + '</div>') +
        '</div></section>';
    }
    Hub.openSheet({
      overline: '<div class="overline" style="display:flex;gap:10px;align-items:center">' + ui.sev(c.severity) + '<span class="' + (c.severity === 'Urgent' ? 'text-danger' : '') + '">' + ui.sevWord(c.severity) + '</span><span>·</span><span>' + esc(c.category) + '</span></div>',
      title: esc(c.title),
      body: ui.fields([['Due', '<span class="num">' + esc(c.when) + '</span>'], ['Details', esc(c.detail)], ['Priority', esc(c.severityReason)], ['Check', esc(c.ruleName) + ' <span class="text-3 mono">' + esc(c.ruleId) + '</span>']]) + occHtml +
        '<p class="text-3 fs-13">This item clears on its own once the underlying issue is fixed.</p>',
      foot: ui.btn('Close', { attrs: { 'data-action': 'close-sheet' } }) + ui.btn(c.actionLabel, { variant: 'primary', trail: 'arrowRight', attrs: { 'data-action': 'go-area', 'data-area': c.destination.area } })
    });
  };
  Hub.actions['go-area'] = function (el) { Hub.closeSheet(); Hub.toast('Would open ' + el.dataset.area); };

  /* --------------------------------------------------------------- PEOPLE */
  var peopleFilter = 'all';
  Hub.screens['mgmt-coaches'] = function (ctx) {
    var list = D.staff.filter(function (p) { return peopleFilter === 'all' || p.compliance === 'warn' || p.compliance === 'danger' || p.flag; });
    var flagged = D.staff.filter(function (p) { return p.compliance === 'warn' || p.compliance === 'danger' || p.flag; }).length;
    var head = ui.pageHead({ overline: 'Management', title: 'People', sub: 'Staff, clients and families across ' + esc(Hub.brand.orgName) + '.' });
    var toolbar = '<div class="toolbar"><div class="tabs" role="tablist"><button type="button" class="tab-btn" role="tab" aria-selected="true">Staff<span class="count">' + D.staff.length + '</span></button><button type="button" class="tab-btn" role="tab" aria-selected="false" data-action="soon">' + esc(Hub.brand.terms.client) + 's<span class="count">214</span></button><button type="button" class="tab-btn" role="tab" aria-selected="false" data-action="soon">Families<span class="count">163</span></button></div>' +
      '<div class="toolbar__row"><label class="search"><span class="visually-hidden">Search people</span>' + I('search') + '<input class="input" id="people-search" placeholder="Search people"></label>' +
      '<div class="segmented" role="group" aria-label="Filter"><button type="button" data-action="pfilter" data-val="all" aria-pressed="' + (peopleFilter === 'all') + '">All</button><button type="button" data-action="pfilter" data-val="flag" aria-pressed="' + (peopleFilter === 'flag') + '">Needs attention <span class="count">' + flagged + '</span></button></div></div></div>';
    if (ctx.state === 'loading') return '<div class="page">' + head + toolbar + '<div class="panel">' + skeletonRows(6) + '</div></div>';
    var body = list.map(function (p) {
      var comp = p.compliance === 'danger' ? ui.status(p.complianceText, 'danger') : p.compliance === 'warn' ? ui.status(p.complianceText, 'warn') : ui.status(p.complianceText, p.compliance === 'none' ? 'plain' : '');
      return ui.tr([
        { cls: 'c-lead', html: ui.avatar(p.name, 'md') },
        { cls: 'c-main', html: '<span class="c-title">' + esc(p.name) + '</span><span class="c-sub wide-sub">' + esc(p.email) + '</span><span class="c-sub only-narrow">' + esc(p.role) + ' · ' + esc(p.team) + '</span>' },
        { cls: 'c-main wide', html: '<span class="c-cell" style="color:var(--text)">' + esc(p.role) + '</span><span class="c-sub">' + esc(p.team) + '</span>' },
        { cls: 'c-num wide', html: String(p.sessions) },
        { cls: 'c-main wide', html: comp + (p.flag ? '<span class="c-sub">' + esc(p.flag.text) + '</span>' : '') },
        { cls: 'c-cell c-mute wide', html: esc(p.last) },
        { cls: 'c-end', html: (p.compliance === 'danger' || p.compliance === 'warn' || p.flag ? '<span class="only-narrow">' + ui.sev(p.compliance === 'danger' || (p.flag && p.flag.tone === 'danger') ? 'Urgent' : 'Warning') + '</span>' : '') + '<span class="wide hover-action">' + ui.iconBtn('dotsV', 'Actions for ' + p.name, { 'data-action': 'soon' }) + '</span>' }
      ], { action: 'person', data: { id: p.id }, label: p.name });
    }).join('');
    return '<div class="page">' + head + toolbar +
      '<div class="panel">' + ui.table({ cols: '36px minmax(0, 1.6fr) minmax(0, 1fr) 80px minmax(0, 1.2fr) 110px 40px', head: ['', 'Name', { label: 'Role', cls: 'wide' }, { label: 'This week', cls: 'c-num wide' }, { label: 'Compliance', cls: 'wide' }, { label: 'Last active', cls: 'wide' }, ''], body: body }) +
      '<div class="panel__foot"><span>' + list.length + ' of ' + D.staff.length + ' staff</span><span>Sorted by name</span></div></div></div>';
  };
  Hub.actions.pfilter = function (el) { peopleFilter = el.dataset.val; Hub.render(); };
  Hub.actions.person = function (el) {
    var p = D.staff.filter(function (x) { return x.id === el.dataset.id; })[0];
    if (!p) return;
    var comp = [['Enhanced DBS', p.compliance === 'warn' ? ui.status('Expires 13 Oct', 'warn') : ui.status('Valid to Mar 2028')], ['First aid', p.compliance === 'danger' ? ui.status('Missing', 'danger') : ui.status('Valid to Jan 2027')], ['Safeguarding', ui.status('Level 2 · current')]];
    Hub.openSheet({
      title: '<span class="identity" style="grid-template-columns:auto minmax(0,1fr)">' + ui.avatar(p.name, 'lg') + '<span style="display:grid;gap:4px"><span class="identity__name">' + esc(p.name) + '</span><span class="identity__meta"><span>' + esc(p.role) + '</span><span>' + esc(p.team) + '</span></span></span></span>',
      body: ui.fields([['Sessions this week', '<span class="num">' + p.sessions + '</span>'], ['Last active', esc(p.last)], ['Email', esc(p.email)], ['Team', esc(p.team)]], true) +
        (p.flag ? ui.notice(p.flag.tone === 'danger' ? 'danger' : 'warn', p.flag.text, null) : '') +
        '<section class="section">' + ui.sectionHead('Compliance') + '<div class="panel">' + ui.rows(comp.map(function (c) { return ui.row({ title: c[0], trail: c[1] }); })) + '</div></section>',
      foot: ui.btn('Message', { icon: 'chat' }) + ui.btn('Open profile', { variant: 'primary' })
    });
  };

  /* ---------------------------------------------------------------- MORE */
  Hub.screens['mgmt-more'] = function () {
    var me = D.me, t = Hub.brand.terms;
    function group(title, rows) { return '<section class="section">' + ui.sectionHead(title) + '<div class="panel">' + ui.rows(rows, 'rows--lead') + '</div></section>'; }
    var areaRows = D.areas.map(function (a) {
      var id = a.id === 'coaches' ? 'mgmt-coaches' : 'mgmt-' + a.id;
      return ui.row({ lead: '<span class="row__icon">' + I(a.id === 'coaches' ? 'users' : a.id === 'players' ? 'family' : a.icon, 'icon-sm') + '</span>', title: esc(a.id === 'coaches' ? 'People' : a.label), sub: [esc(a.sub)], trail: a.on ? (a.restricted ? '<span class="wide-inline">' + esc(a.restricted) + '</span>' : '') : ui.tag('Off'), href: '#' + id });
    });
    var approvalRows = D.approvals.map(function (a) { return ui.row({ lead: '<span class="row__icon">' + I(a.icon, 'icon-sm') + '</span>', title: esc(a.label), sub: [esc(a.sub)], trail: a.count ? '<span class="num">' + a.count + ' waiting</span>' : '', href: '#mgmt-' + a.id }); });
    var accountRows = [['user', 'Profile', me.email], ['bell', 'Notifications', 'Email and in-app alerts'], ['chat', 'Send feedback', 'Ideas or problems'], ['phone', 'Contact the office', '']].map(function (r) { return ui.row({ lead: '<span class="row__icon">' + I(r[0], 'icon-sm') + '</span>', title: r[1], sub: [esc(r[2])], action: 'soon' }); });
    accountRows.push(ui.row({ lead: '<span class="row__icon">' + I('logout', 'icon-sm') + '</span>', title: 'Log out', action: 'soon', chevron: false }));
    return '<div class="page">' + ui.pageHead({ overline: 'Management', title: 'More' }) +
      '<div class="panel panel--pad me-panel"><div class="identity">' + ui.avatar(me.name, 'lg') + '<div style="display:grid;gap:2px;min-width:0"><span class="identity__name">' + esc(me.name) + '</span><span class="identity__meta"><span>Management</span><span>' + esc(me.email) + '</span></span></div>' +
        ui.btn('Switch to ' + t.staff.toLowerCase() + ' view', { icon: 'swap', attrs: { 'data-action': 'area', 'data-area': 'staff' } }) + '</div></div>' +
      '<div class="layout layout--even"><div class="col">' + group('Workspace', areaRows) + '</div><div class="col">' + group('Approvals', approvalRows) + group('Organisation', [ui.row({ lead: '<span class="row__icon">' + I('settings', 'icon-sm') + '</span>', title: 'Settings', sub: ['Branding, modules, system health'], href: '#mgmt-settings' })]) + group('Account', accountRows) + '</div></div></div>';
  };
})();
