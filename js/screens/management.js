/* Management screens: Home, Needs Attention, More. */
(function () {
  var ui = Hub.ui, I = Hub.icon, D = Hub.data, esc = ui.esc;

  function todayOccurrences() { return D.occurrences.filter(function (o) { return o.date === '2026-10-01'; }); }
  function tomorrowOccurrences() { return D.occurrences.filter(function (o) { return o.date === '2026-10-02'; }); }

  function occurrenceRow(o, opts) {
    opts = opts || {};
    var v = D.venues[o.venue];
    var unavailable = o.staff.some(function (s) { return s.unavailable; });
    var status = !o.staff.length ? ui.pill('No coach', 'danger') : unavailable ? ui.pill('Coach unavailable', 'danger') : ui.pill('Staffed', 'ok', 'hide-narrow');
    return ui.row({
      lead: '<span class="row__time">' + o.start + '<small>' + o.end + '</small></span>',
      title: esc(o.session),
      meta: [esc(v.name), o.players + ' players', o.staff.length ? ui.staffLine(o.staff) : null],
      trail: status,
      action: 'occurrence', data: { id: o.id }
    });
  }

  function caseRow(c, o) {
    o = o || {};
    return ui.row({
      lead: ui.sev(c.severity),
      title: esc(c.title),
      meta: o.compact ? [esc(c.when)] : [esc(c.detail), esc(c.when)],
      trail: o.compact ? I('chevron', 'icon-sm') :
        '<span class="case-trail"><span class="case-when">' + esc(c.when) + '</span><span class="case-action">' + ui.btn(c.actionLabel, { variant: 'secondary', size: 'sm', attrs: { 'data-action': 'case', 'data-key': c.caseKey } }) + '</span>' + I('chevron', 'icon-sm case-chev') + '</span>',
      action: 'case', data: { key: c.caseKey }, stretch: !o.compact
    });
  }

  /* ---------------------------------------------------------------- HOME */
  function attentionCard(state) {
    var A = D.attention, c = A.summary.counts;
    if (state === 'loading') return '<section class="card card--pad" aria-busy="true"><span class="skeleton" style="height:18px;width:40%"></span><div style="height:16px"></div><span class="skeleton" style="height:56px"></span><div style="height:12px"></div><span class="skeleton" style="height:44px"></span></section>';
    if (state === 'error') return '<section class="card card--pad">' + ui.alert('danger', 'Needs Attention couldn’t be checked', 'The queue didn’t finish loading, so it isn’t safe to treat it as clear. Try again in a moment.', ui.btn('Try again', { variant: 'secondary', size: 'sm', icon: 'refresh' })) + '</section>';
    if (state === 'empty') return '<section class="card attention-card is-clear"><div class="card__head"><h2 class="card__title">Needs Attention</h2>' + ui.pill('Clear', 'ok') + '</div>' + ui.empty('checkCircle', 'Nothing needs attention', 'Staffing, compliance and cover are all in order. New items appear here as soon as they come up.', 'ok') + '</section>';
    var top = A.cases.slice(0, 3);
    return '<section class="card card--flush attention-card">' +
      '<div class="card__head"><h2 class="card__title">Needs Attention</h2>' + ui.pill(c.Urgent + ' urgent', 'danger') + '</div>' +
      '<div class="attention-card__stats"><div class="stats">' +
        '<div class="stat stat--danger"><span class="stat__value">' + c.Urgent + '</span><span class="stat__label">Urgent</span></div>' +
        '<div class="stat stat--warn"><span class="stat__value">' + c.Warning + '</span><span class="stat__label">Warning</span></div>' +
        '<div class="stat"><span class="stat__value">' + c.Normal + '</span><span class="stat__label">To do</span></div>' +
      '</div></div>' +
      ui.list(top.map(function (x) { return caseRow(x, { compact: true }); })) +
      '<div class="card__foot"><span class="text-3 fs-sm">Updated 14:05</span>' + ui.btn('Open queue (' + A.summary.total + ')', { variant: 'ghost', size: 'sm', trail: 'arrowRight', href: '#mgmt-attention' }) + '</div>' +
      '</section>';
  }

  function todayCard(state) {
    var list = todayOccurrences();
    var players = list.reduce(function (a, o) { return a + o.players; }, 0);
    var body = state === 'empty' ? ui.empty('calendar', 'No sessions today', 'Nothing is scheduled for today. Tomorrow has ' + tomorrowOccurrences().length + ' sessions.')
      : state === 'loading' ? '<div class="card--pad" style="display:grid;gap:12px"><span class="skeleton" style="height:44px"></span><span class="skeleton" style="height:44px"></span><span class="skeleton" style="height:44px"></span></div>'
      : ui.list(list.map(function (o) { return occurrenceRow(o); }));
    return '<section class="section">' +
      ui.sectionHead('Today', { count: state === 'empty' ? null : list.length + ' sessions · ' + players + ' players', link: 'Schedule', href: '#mgmt-schedule' }) +
      '<div class="card card--flush">' + body + '</div></section>';
  }

  function approvalsCard() {
    return '<section class="section">' + ui.sectionHead('Waiting for approval') +
      '<div class="card card--flush">' + ui.list(D.approvals.filter(function (a) { return a.id !== 'player-migration'; }).map(function (a) {
        return ui.row({ compact: true, lead: '<span class="tile__icon">' + I(a.icon, 'icon-sm') + '</span>', title: esc(a.label),
          trail: (a.count ? '<span class="badge badge--quiet num">' + a.count + '</span>' : '<span class="text-3 fs-sm">None</span>') + I('chevron', 'icon-sm'),
          href: '#mgmt-' + a.id });
      })) + '</div></section>';
  }

  function tomorrowCard() {
    var list = tomorrowOccurrences();
    return '<section class="section">' + ui.sectionHead('Tomorrow', { count: list.length + ' sessions' }) +
      '<div class="card card--flush">' + ui.list(list.map(function (o) { return occurrenceRow(o); })) + '</div></section>';
  }

  Hub.screens['mgmt-home'] = function (ctx) {
    var hour = D.now.getHours(), greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return '<div class="page">' +
      ui.pageHead({ eyebrow: 'Thursday 1 October · ' + D.term, title: greet + ', ' + D.me.name.split(' ')[0] }) +
      '<div class="grid-2"><div class="stack">' + attentionCard(ctx.state) + todayCard(ctx.state) + '</div>' +
      '<div class="stack">' + approvalsCard() + (ctx.state === 'loading' ? '' : tomorrowCard()) + '</div></div>' +
      '</div>';
  };

  /* ------------------------------------------------------- NEEDS ATTENTION */
  var filter = 'All';
  Hub.screens['mgmt-attention'] = function (ctx) {
    var A = D.attention, cats = {};
    A.cases.forEach(function (c) { cats[c.category] = (cats[c.category] || 0) + 1; });
    var head = ui.pageHead({ eyebrow: 'Management', title: 'Needs Attention',
      sub: ctx.state === 'empty' ? 'Everything is in order.' : ctx.state === 'loading' ? 'Checking…' : 'Things that need a decision or an action, most urgent first.',
      actions: ctx.state === 'loading' ? '' : ui.btn('Refresh', { variant: 'secondary', size: 'sm', icon: 'refresh', attrs: { 'data-action': 'refresh' } }) });

    if (ctx.state === 'loading') {
      return '<div class="page">' + head + '<div class="card card--pad" style="display:grid;gap:14px" aria-busy="true">' +
        [1, 2, 3, 4].map(function () { return '<div style="display:flex;gap:12px;align-items:center"><span class="skeleton" style="width:32px;height:32px"></span><div style="flex:1;display:grid;gap:6px"><span class="skeleton" style="height:14px;width:70%"></span><span class="skeleton" style="height:12px;width:45%"></span></div></div>'; }).join('') + '</div></div>';
    }
    if (ctx.state === 'error') {
      return '<div class="page">' + head + ui.alert('danger', 'The queue couldn’t be checked', 'One of the checks didn’t complete, so this page won’t show a partial list or call it clear. Refresh to try again. If it keeps happening, let the office know.', ui.btn('Refresh', { variant: 'secondary', size: 'sm', icon: 'refresh' })) + '</div>';
    }
    if (ctx.state === 'empty') {
      return '<div class="page">' + head + '<div class="card">' + ui.empty('checkCircle', 'Nothing needs attention', 'No staffing gaps, compliance issues, cover or summaries are waiting. Last checked 14:05.', 'ok') + '</div></div>';
    }

    var chips = ['All'].concat(Object.keys(cats)).map(function (k) {
      var n = k === 'All' ? A.cases.length : cats[k];
      return '<button type="button" class="chip" data-action="filter" data-filter="' + esc(k) + '" aria-pressed="' + (filter === k) + '">' + esc(k) + ' <span class="n">' + n + '</span></button>';
    }).join('');

    var shown = A.cases.filter(function (c) { return filter === 'All' || c.category === filter; });
    var groups = ['Urgent', 'Warning', 'Normal'].map(function (sev) {
      var list = shown.filter(function (c) { return c.severity === sev; });
      if (!list.length) return '';
      var label = { Urgent: 'Urgent', Warning: 'Warning', Normal: 'To do' }[sev];
      return '<section class="section"><div class="section-head"><h2 class="section-title sev-title sev-title--' + sev.toLowerCase() + '">' + label + '<span class="count num">' + list.length + '</span></h2></div>' +
        '<div class="card card--flush case-list">' + ui.list(list.map(function (c) { return caseRow(c); })) + '</div></section>';
    }).join('');

    return '<div class="page page--queue">' + head +
      '<div class="queue-summary"><div class="stats">' +
        '<div class="stat stat--danger"><span class="stat__value">' + A.summary.counts.Urgent + '</span><span class="stat__label">Urgent</span></div>' +
        '<div class="stat stat--warn"><span class="stat__value">' + A.summary.counts.Warning + '</span><span class="stat__label">Warning</span></div>' +
        '<div class="stat"><span class="stat__value">' + A.summary.counts.Normal + '</span><span class="stat__label">To do</span></div>' +
      '</div><p class="text-3 fs-sm">Updated 14:05 · checks staffing, cover, compliance and coach summaries</p></div>' +
      '<div class="chips" role="group" aria-label="Filter by category">' + chips + '</div>' +
      groups + '</div>';
  };

  Hub.actions.filter = function (el) { filter = el.dataset.filter; Hub.render(); };
  Hub.actions.refresh = function (el) { el.classList.add('is-busy'); setTimeout(function () { el.classList.remove('is-busy'); Hub.toast('Queue is up to date'); }, 700); };

  Hub.actions['case'] = function (el) {
    var c = D.attention.cases.filter(function (x) { return x.caseKey === el.dataset.key; })[0];
    if (!c) return;
    var occ = c.related && c.related.occurrence && D.occurrences.filter(function (o) { return o.id === c.related.occurrence; })[0];
    var occHtml = '';
    if (occ) {
      var v = D.venues[occ.venue];
      occHtml = '<section class="section"><h3 class="label">Session</h3><div class="card card--quiet card--pad occ-mini">' +
        '<div class="row__title">' + esc(occ.session) + '</div>' +
        '<div class="row__meta"><div><span>' + (occ.date === '2026-10-01' ? 'Today' : 'Fri 2 Oct') + ', ' + occ.start + '–' + occ.end + '</span><span>' + esc(v.name) + '</span></div></div>' +
        '<div class="staff-list">' + (occ.staff.length ? occ.staff.map(function (s) {
          var co = D.coaches[s.coach];
          return '<div class="staff-item">' + ui.avatar(co.name, 'sm') + '<span><b>' + esc(co.name) + '</b><small>' + (s.lead ? 'Lead coach' : 'Coach') + '</small></span>' + (s.unavailable ? ui.pill('Unavailable', 'danger') : ui.pill('Confirmed', 'ok')) + '</div>';
        }).join('') : '<div class="staff-item staff-item--none">' + I('alertCircle', 'icon-sm') + '<span>No coach assigned to this session yet</span></div>') + '</div></div></section>';
    }
    Hub.openSheet(
      '<div class="sheet__head"><div style="display:grid;gap:8px">' +
        '<div class="btn-row" style="gap:6px">' + ui.pill(c.severity === 'Normal' ? 'To do' : c.severity, ui.sevTone(c.severity)) + ui.pill(c.category, null, 'pill--plain') + '</div>' +
        '<h2 id="sheet-title" style="font-size:var(--fs-xl)">' + esc(c.title) + '</h2></div>' +
        '<button type="button" class="icon-btn" data-action="close-sheet" aria-label="Close">' + I('x') + '</button></div>' +
      '<div class="sheet__body">' +
        ui.kv([['When', esc(c.when)], ['Details', esc(c.detail)], ['Why it’s ' + (c.severity === 'Normal' ? 'listed' : c.severity.toLowerCase()), esc(c.severityReason)], ['Check', esc(c.ruleName) + ' <span class="text-3">· ' + esc(c.ruleId) + '</span>']]) +
        occHtml +
        '<div style="display:grid;gap:8px">' + ui.btn(c.actionLabel, { block: true, trail: 'arrowRight', attrs: { 'data-action': 'go-area', 'data-area': c.destination.area } }) +
        '<p class="text-3 fs-xs" style="text-align:center">Opens ' + esc(c.destination.area) + '. This item clears when the underlying issue is fixed.</p></div>' +
      '</div>');
  };
  Hub.actions['go-area'] = function (el) { Hub.closeSheet(); Hub.toast('Would open ' + el.dataset.area + ' (not in this pass)'); };
  Hub.actions.occurrence = function () { Hub.toast('Session detail is not part of this pass'); };

  /* ---------------------------------------------------------------- MORE */
  Hub.screens['mgmt-more'] = function () {
    var me = D.me;
    var areaRows = D.areas.map(function (a) {
      return ui.row({ lead: '<span class="tile__icon">' + I(a.icon, 'icon-sm') + '</span>', title: esc(a.label),
        meta: [esc(a.sub)], trail: (a.on ? (a.restricted ? '<span class="lock-note">' + esc(a.restricted) + '</span>' : '') : ui.pill('Off', null, 'pill--plain')) + I('chevron', 'icon-sm'),
        href: '#mgmt-' + a.id });
    });
    var approvalRows = D.approvals.map(function (a) {
      return ui.row({ lead: '<span class="tile__icon">' + I(a.icon, 'icon-sm') + '</span>', title: esc(a.label), meta: [esc(a.sub)],
        trail: (a.count ? '<span class="badge num">' + a.count + '</span>' : '') + I('chevron', 'icon-sm'), href: '#mgmt-' + a.id });
    });
    var accountRows = [
      ['user', 'My profile', me.email, 'profile'], ['bell', 'Notifications', 'Manage alerts', 'soon'],
      ['chat', 'Feedback', 'Share ideas or report an issue', 'soon'], ['phone', 'Contact the office', 'Get in touch', 'soon']
    ].map(function (r) { return ui.row({ compact: true, lead: '<span class="tile__icon tile__icon--quiet">' + I(r[0], 'icon-sm') + '</span>', title: esc(r[1]), meta: [esc(r[2])], action: r[3] }); });
    accountRows.push(ui.row({ compact: true, lead: '<span class="tile__icon tile__icon--quiet">' + I('logout', 'icon-sm') + '</span>', title: 'Log out', action: 'soon', trail: '' }));

    return '<div class="page page--more">' +
      ui.pageHead({ eyebrow: 'Management', title: 'More' }) +
      '<section class="card card--pad me-card"><div class="profile-head">' + ui.avatar(me.name, 'lg') +
        '<div><div class="profile-head__name">' + esc(me.name) + '</div><div class="profile-head__meta"><span>' + esc(me.email) + '</span>' + ui.pill('Management', 'info', 'pill--plain') + '</div></div></div>' +
        '<div class="me-card__switch">' + ui.btn('Switch to Coach view', { variant: 'secondary', icon: 'swap', block: true, attrs: { 'data-action': 'area', 'data-area': 'coach' } }) + '</div></section>' +
      '<div class="more-grid">' +
        '<section class="section more-areas">' + ui.sectionHead('Areas') + '<div class="card card--flush">' + ui.list(areaRows) + '</div></section>' +
        '<div class="stack">' +
          '<section class="section">' + ui.sectionHead('Approvals') + '<div class="card card--flush">' + ui.list(approvalRows) + '</div></section>' +
          '<section class="section">' + ui.sectionHead('Settings') + '<div class="card card--flush">' + ui.list([ui.row({ compact: true, lead: '<span class="tile__icon tile__icon--quiet">' + I('settings', 'icon-sm') + '</span>', title: 'Settings & System', meta: ['Branding, modules and system health'], href: '#mgmt-settings' })]) + '</div></section>' +
          '<section class="section">' + ui.sectionHead('Account') + '<div class="card card--flush">' + ui.list(accountRows) + '</div></section>' +
        '</div>' +
      '</div></div>';
  };
})();
