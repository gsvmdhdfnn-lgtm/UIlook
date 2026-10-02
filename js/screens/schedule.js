/* Schedule & Sessions screens (pass 12): the area hub, sessions and the
   session wizard, calendar and occurrences, cancellation outcomes,
   eligibility, venues, registers and attendance. Mock data only, read and
   written through Hub.db; every change is in memory with a toast, a who
   and when, and an audit entry. */
(function () {
  var K = Hub.kit, db = Hub.db, ui = Hub.ui, I = Hub.icon, esc = ui.esc;
  var OPT = function () { return db.getSessionOptions(); };
  function who() { return K.me(); }

  /* ---------- Routes ---------- */
  function sesTitle() { var s = db.getSession(K.param()); return s ? s.name : 'Session'; }
  function occTitle() { var o = db.getOccurrence(K.param()); return o ? o.session + ', ' + K.dm(o.date) : 'Session'; }
  K.route('mgmt-schedule', { title: 'Schedule & Sessions', parent: 'home' });
  K.route('mgmt-sessions', { title: 'All sessions', parent: 'home' });
  K.route('mgmt-session', { title: sesTitle, parent: 'home' });
  K.route('mgmt-session-new', { title: 'Create session', parent: 'home' });
  K.route('mgmt-session-edit', { title: function () { return 'Edit ' + sesTitle(); }, parent: 'home' });
  K.route('mgmt-calendar', { title: 'Calendar', parent: 'home' });
  K.route('mgmt-occurrences', { title: 'Session dates', parent: 'home' });
  K.route('mgmt-occurrence', { title: occTitle, parent: 'home' });
  K.route('mgmt-occurrence-outcome', { title: function () { return 'Outcome · ' + occTitle(); }, parent: 'home' });
  K.route('mgmt-eligibility', { title: 'Eligibility', parent: 'home' });
  K.route('mgmt-venues', { title: 'Venues', parent: 'home' });
  K.route('mgmt-venue', { title: function () { var v = db.getVenue(K.param()); return v ? v.name : 'Venue'; }, parent: 'home' });
  K.route('mgmt-register', { title: function () { return 'Register · ' + occTitle(); }, parent: 'home' });
  K.route('mgmt-registers', { title: 'Registers', parent: 'home' });
  K.route('mgmt-attendance', { title: function () { var p = K.param() && db.getPlayer(K.param()); return p ? 'Attendance · ' + p.name : 'Attendance'; }, parent: 'home' });

  /* ---------- Small shared pieces ---------- */
  /* The schedule in plain words, from the session's own dates */
  function schedWords(s) {
    if (s.pattern === 'Selected dates') {
      var ds = (s.dates || []).slice().sort();
      return { line: (ds.length === 1 ? esc(K.dd(ds[0])) : ds.length + ' selected dates') + ' · ' + s.start + '–' + s.end, sub: ds.length > 1 ? ds.slice(0, 8).map(function (d) { return esc(K.dd(d)); }).join(' · ') + (ds.length > 8 ? ' and ' + (ds.length - 8) + ' more' : '') : '' };
    }
    var full = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };
    return { line: 'Every ' + esc((s.days || []).map(function (d) { return full[d]; }).join(' and ') || '—') + ' · ' + s.start + '–' + s.end, sub: 'From ' + esc(K.d(s.startDate)) + ' · ' + (s.endDate ? 'until ' + esc(K.d(s.endDate)) : 'no end date') };
  }
  /* The usual venue only when one has actually been set; never inferred from the dates */
  function usualVenueHtml(s) {
    var occ = db.getSessionOccurrences(s.id).filter(function (o) { return o.date >= K.today && o.status === 'Scheduled'; }), base = occ.length ? occ[0].date : K.today;
    var v = db.usualVenueOn(s, base), later = (s.venuePeriods || []).filter(function (p) { return p.from > base; }), own = occ.filter(function (o) { return o.venueOverride; }).length;
    return (v ? K.link('mgmt-venue/' + v, db.venueName(v)) : 'None set<br><small class="k-note">Choose one with Change venue, or set a venue on each date.</small>') +
      later.map(function (p) { return '<br><small class="k-note">From ' + esc(K.dd(p.from)) + ': ' + esc(db.venueName(p.venue)) + '</small>'; }).join('') +
      (own ? '<br><small class="k-note">' + own + ' date' + (own === 1 ? ' has its' : 's have their') + ' own venue</small>' : '');
  }
  function dayNames(s) {
    if (s.pattern === 'Selected dates') { var n = (s.dates || []).length; return n + ' selected date' + (n === 1 ? '' : 's'); }
    var map = {}; OPT().dows.forEach(function (d) { map[d[0]] = d[1]; });
    return (s.days || []).map(function (d) { return map[d]; }).join(' & ') || '—';
  }
  function when(o) { return K.dd(o.date) + ', ' + o.start + '–' + o.end; }
  function venueOf(o) { return o.venue ? db.venueName(o.venue) : 'No venue yet'; }
  /* What is wrong before a date runs (empty once it has run or been changed) */
  function risk(o) {
    var st = db.occState(o);
    if (st !== 'Staffing issue') return '';
    return db.staffIssue(o) || (!o.venue ? 'No venue' : '');
  }
  /* One status per date: Scheduled, Staffing issue, Awaiting confirmation, Confirmed,
     Partially delivered, Cancelled, Rescheduled (or Postponed), with the reason for a staffing issue */
  function occStatus(o) {
    var st = db.occState(o), r = risk(o);
    if (st === 'Draft') return K.pill('Draft');
    /* A problem date takes its tone from the engine; waiting cover reads quietly */
    var sd = o.status === 'Scheduled' && !o.delivery ? K.dateStanding(o) : null;
    if (sd && (st === 'Staffing issue' || st === 'Awaiting confirmation' || sd.waiting)) { var tn = K.sevTone(sd.sev, sd.waiting); return K.pill(sd.waiting ? 'Finding cover' : st, tn === 'danger' ? 'danger' : tn === 'warn' ? 'warn' : '') + (r && !sd.waiting ? ' <small class="sch-why">' + esc(r) + '</small>' : ''); }
    return K.status(st) + (r ? ' <small class="sch-why">' + esc(r) + '</small>' : '');
  }
  function regState(o) { return db.getRegister(o.id).state; }
  function sortOcc(list, desc) { return list.slice().sort(function (a, b) { var x = a.date + a.start, y = b.date + b.start; return (x < y ? -1 : x > y ? 1 : 0) * (desc ? -1 : 1); }); }
  function timeCell(o, withDay) { return { cls: 'c-time', html: (withDay ? esc(K.dd(o.date)) : o.start) + '<small>' + (withDay ? o.start + '–' + o.end : o.end) + '</small>' }; }
  function staffText(o) { return o.staff.length ? ui.staffNames(o.staff) : '<span class="c-mute">None</span>'; }
  function closeThen(fn, msg, log) { Hub.closeSheet(true); return Hub.mutate(fn, msg, log); }
  function sheetFoot(label, action, data, o) { o = o || {}; return ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn(label, action, data, { variant: o.danger ? 'danger' : 'primary' }); }
  function pounds(p) { return (Math.round(p) / 100).toFixed(2); }
  function toPence(v) { var n = parseFloat(String(v).replace(/[£,\s]/g, '')); return isNaN(n) ? NaN : Math.round(n * 100); }
  function canSeeSensitive() { var v = K.viewer(); return v.role === 'management' || (v.role === 'coach' && v.coachRole !== 'learning'); }
  var SENSITIVE = ['management', 'coach:lead', 'coach:coach'];
  function featureGate(h) { return K.feature('registers') ? null : K.page(h, K.featureOff('registers')); }
  function moneyOk() { return K.fin() !== 'none'; }

  /* ===================================================== AREA HUB */
  Hub.screens['mgmt-schedule'] = function (ctx) {
    var h = K.head({ back: ['mgmt-home', 'Home'], eyebrow: 'Home', title: 'Schedule & Sessions', sub: 'Everything that is happening, and when.',
      actions: K.goBtn('Calendar', 'mgmt-calendar', { variant: 'secondary', icon: 'calendar' }) + K.goBtn('Add session', 'mgmt-session-new', { variant: 'primary', icon: 'plus' }) });
    var g = K.guard(ctx, h, { empty: ['calendar', 'No sessions yet', 'Add a session to start building the schedule.'] }); if (g) return g;
    var sessions = db.getSessions(), active = sessions.filter(function (s) { return s.lifecycle === 'Active'; });
    var upcoming = db.getOccurrences(function (o) { return o.date >= K.today && o.status === 'Scheduled' && !o.draft; });
    var need = db.getUnstaffedOccurrences(7), outstanding = db.getOutstandingRegisters();
    var today = sortOcc(db.getTodayOccurrences());
    var week = upcoming.filter(function (o) { return o.date <= K.addDays(K.today, 6); });
    var todayT = K.table({ cols: '64px minmax(0, 1.6fr) minmax(0, 1.1fr) 72px minmax(0, 150px)', head: ['Time', 'Session', { label: 'Coaches', cls: 'wide' }, { label: 'Expected', cls: 'c-num wide' }, { label: '', cls: 'c-end' }],
      rows: today.map(function (o) {
        return { cells: [timeCell(o), K.cell(esc(o.session), esc(venueOf(o))), { cls: 'wide c-cell', html: staffText(o) }, { cls: 'c-num wide', html: String(o.players) }, { cls: 'c-end', html: occStatus(o) }], route: 'mgmt-occurrence/' + o.id };
      }), empty: 'Nothing scheduled today.' });
    var later = sortOcc(week.filter(function (o) { return o.date > K.today; }));
    var weekT = K.table({ cols: '110px minmax(0, 1.6fr) minmax(0, 1.1fr) minmax(0, 150px)', head: ['When', 'Session', { label: 'Coaches', cls: 'wide' }, { label: '', cls: 'c-end' }],
      rows: later.map(function (o) { return { cells: [K.cell(esc(K.dd(o.date)), o.start + '–' + o.end), K.cell(esc(o.session), esc(venueOf(o))), { cls: 'wide c-cell', html: staffText(o) }, { cls: 'c-end', html: occStatus(o) }], route: 'mgmt-occurrence/' + o.id }; }),
      empty: 'Nothing else this week.' });
    var feature = '<section class="lx-feature"><div class="lx-feature__text"><h2>All sessions</h2><p>Open a session to see its dates, coaches and players, or to change, cancel or reschedule a date.</p>' +
      '<p class="lx-feature__facts num"><span><b>' + active.length + '</b> sessions running</span><span><b>' + week.length + '</b> this week</span>' +
      (need.length ? '<span' + (need.some(function (o) { var d = K.dateStanding(o); return d && d.sev === 'Urgent' && !d.waiting; }) ? ' class="is-alert"' : '') + '><b>' + need.length + '</b> need a coach this week</span>' : '') + '</p></div>' +
      '<button type="button" class="lx-feature__btn" data-action="go" data-route="mgmt-sessions">Open all sessions' + I('arrowRight', 'icon-sm') + '</button></section>';
    var cards = '<div class="lx-links">' +
      K.tile({ route: 'mgmt-calendar', icon: 'calendar', title: 'Calendar', desc: 'Every session by day, week or month.' }) +
      K.tile({ route: 'mgmt-venues', icon: 'pin', title: 'Venues', desc: 'Venue details, closures and the sessions they affect.' }) + '</div>';
    var more = K.moreIn('More in Sessions', [
      ['Schedule', [{ route: 'mgmt-sessions', icon: 'calendar', title: 'All sessions', desc: 'Weekly and one-off sessions', count: active.length },
        { route: 'mgmt-occurrences', icon: 'clock', title: 'Upcoming sessions', desc: 'Every date, with filters', count: upcoming.length },
        { route: 'mgmt-calendar', icon: 'calendar', title: 'Calendar', desc: 'Day, week or month' }]],
      ['On the day', [{ route: 'mgmt-registers', icon: 'check', title: 'Registers', desc: 'To complete and recently completed', count: outstanding.length },
        { route: 'mgmt-attendance', icon: 'users', title: 'Attendance', desc: 'By player and by session' }]],
      ['Places and rules', [{ route: 'mgmt-venues', icon: 'pin', title: 'Venues', desc: 'Details and closures' },
        { route: 'mgmt-eligibility', icon: 'shield', title: 'Who can join', desc: 'Age, school year and player exceptions', count: db.getEligibilityOverrides().filter(function (x) { return !x.revokedAt; }).length }]]
    ]);
    return K.page(h, K.findBar('Find a session, venue, player or coach') +
      K.areaNeeds(['Sessions & Venues', 'Staffing & Cover'], { area: 'Schedule & Sessions', clear: 'Every session in the next two weeks has a coach, a venue and is on track.' }) +
      K.section('Today', K.d(K.today) + ' · ' + today.length + ' sessions · ' + K.sum(today, 'players') + ' expected. Open one to change coaches, cancel, reschedule or take the register.', todayT) +
      K.section('Later this week', later.length + ' sessions in the next six days', weekT, K.goBtn('Calendar', 'mgmt-calendar', { size: 'sm', variant: 'secondary' })) +
      K.section('Your sessions', '', feature + cards) + more);
  };

  /* ===================================================== SESSIONS LIST */
  Hub.screens['mgmt-sessions'] = function (ctx) {
    var list = db.getSessions();
    var segs = [{ id: 'all', label: 'All' }, { id: 'Active', label: 'Active' }, { id: 'Draft', label: 'Draft' }, { id: 'Inactive', label: 'Inactive' }];
    var h = K.head({ back: ['mgmt-schedule', 'Schedule & Sessions'], eyebrow: 'Schedule & Sessions', title: 'All sessions', sub: 'Every session with its programme, timetable, venue and status.',
      actions: K.goBtn('Create session', 'mgmt-session-new', { variant: 'primary', icon: 'plus' }), tabs: '<div class="lx-filterbar">' + K.seg('sch-sess', segs) + '</div>' });
    var g = K.guard(ctx, h, { empty: ['calendar', 'No sessions yet', 'Create a session to start building the schedule.'] }); if (g) return g;
    var f = K.tab('sch-sess', segs);
    var rows = list.filter(function (s) { return f === 'all' || s.lifecycle === f; }).map(function (s) {
      var members = db.getSessionMembers(s.id).length;
      return { cells: [{ cls: 'c-time', html: esc(dayNames(s)) + '<small>' + s.start + '</small>' }, K.cell(esc(s.name), esc(s.programme) + ' · ' + esc(s.ageGroup) + (s.client ? ' · client session' : '')),
        { cls: 'wide c-cell', html: esc(db.venueName(s.venue)) }, { cls: 'wide c-num', html: s.client ? 'Headcount ' + (s.headcount || 0) : members + ' / ' + s.capacity },
        { cls: 'c-end', html: K.status(s.lifecycle) }], route: 'mgmt-session/' + s.id, label: 'Open ' + s.name };
    });
    return K.page(h, K.table({ cols: '92px minmax(0, 1.6fr) minmax(0, 1fr) 110px 100px', head: ['When', 'Session', { label: 'Venue', cls: 'wide' }, { label: 'Players', cls: 'c-num wide' }, { label: 'Status', cls: 'c-end' }], rows: rows, empty: 'No sessions in this filter.' }));
  };

  /* ===================================================== SESSION DETAIL */
  Hub.screens['mgmt-session'] = function (ctx) {
    var s = db.getSession(ctx.param);
    var h = K.head({ back: ['mgmt-sessions', 'All sessions'], eyebrow: 'Session', title: s ? s.name : 'Session not found', sub: s ? esc(s.programme) + ' · ' + esc(s.ageGroup) + ' · ' + schedWords(s).line : '',
      actions: s ? K.actBtn('Change venue', 'sch-venue', { session: s.id }, { variant: 'secondary', icon: 'pin' }) + K.actBtn('Change status', 'sch-lifecycle', { id: s.id }, { variant: 'secondary' }) + K.goBtn('Edit session', 'mgmt-session-edit/' + s.id, { variant: 'primary', icon: 'settings' }) : '' });
    var g = K.guard(ctx, h, { empty: ['calendar', 'No details yet', 'This session has no details to show yet.'] }); if (g) return g;
    if (!s) return K.page(h, ui.notice('warn', 'This session could not be found', 'It may have been removed. Open All sessions to choose another.', { action: K.goBtn('All sessions', 'mgmt-sessions', { size: 'sm' }) }));
    Hub.crumbTail = s.id;
    var client = s.client && db.getClient ? db.getClient(s.client) : null;
    var details = K.card({ title: 'Details', body: K.kv([
      ['Programme', esc(s.programme)], ['Delivery area', esc(s.area)], ['Age group', esc(s.ageGroup)],
      ['Schedule', (function () { var w = schedWords(s); return w.line + (w.sub ? '<br><small class="k-note">' + w.sub + '</small>' : ''); })()], ['Usual venue', usualVenueHtml(s)], ['Places', s.capacity + ' per date'],
      ['Client', client ? K.link('mgmt-fin-client/' + client.id, client.name) : 'None (parent session)'], ['Funded by', esc(s.commercial)], ['Who can book', esc(s.booking)], ['Charged', esc(s.billing)],
      ['Price', moneyOk() ? K.money(s.price) + (s.billing === 'Monthly subscription' ? ' a month' : '') : '<span class="c-mute">Finance access only</span>'],
      ['Meeting point', esc(s.meetingPoint || '—')]
    ], true) });
    var breaks = db.getScheduleBreaksFor(s.id);
    var sched = K.card({ title: 'Schedule breaks', sub: 'Dates with no session.', body: breaks.length ? K.list(breaks.map(function (b) { return ui.row({ lead: '<span class="row__icon">' + I('calendar', 'icon-sm') + '</span>', title: esc(b.type), sub: [esc(b.from === b.to ? K.d(b.from) : K.dm(b.from) + ' – ' + K.d(b.to)), esc(b.note || '')] }); })) : '<p class="k-note">No breaks set for this session.</p>' });
    var occ = db.getSessionOccurrences(s.id), next = occ.filter(function (o) { return o.date >= K.today; }).slice(0, 6);
    var toCome = occ.filter(function (o) { return o.date >= K.today && o.status === 'Scheduled'; }).length;
    var occT = K.card({ title: 'Dates', sub: occ.length + ' date' + (occ.length === 1 ? '' : 's') + ' · ' + toCome + ' still to come. Open a date to change its coaches, cancel or reschedule it, or take the register.', right: K.actBtn('All ' + occ.length + ' date' + (occ.length === 1 ? '' : 's'), 'sch-occ-for', { id: s.id }, { size: 'sm', variant: 'secondary' }),
      body: K.table({ cols: '110px minmax(0, 1fr) minmax(0, 140px)', head: ['Date', 'Venue', { label: 'Status', cls: 'c-end' }], rows: next.map(function (o) {
        return { cells: [timeCell(o, true), K.cell(esc(venueOf(o)), staffText(o)), { cls: 'c-end', html: occStatus(o) }], route: 'mgmt-occurrence/' + o.id };
      }), empty: 'No upcoming dates.' }) });
    var att = db.getSessionAttendance(s.id);
    var attBody = s.client ? '<p class="k-note">Client session: headcount registers. Average headcount ' + (att.headcount == null ? '—' : att.headcount + '% of expected') + ' across ' + att.registers + ' completed registers.</p>'
      : K.table({ cols: '40px minmax(0, 1fr) 80px', head: ['', 'Player', { label: 'Attended', cls: 'c-num' }], rows: att.players.map(function (p) {
        return { cells: [ui.avatar(p.player.name, 'sm'), K.cell(esc(p.player.name), p.summary.present + ' present · ' + p.summary.late + ' late · ' + p.summary.absent + ' absent'), { cls: 'c-num', html: p.summary.pct == null ? '—' : p.summary.pct + '%' }], route: 'mgmt-attendance/' + p.player.id };
      }), empty: 'No registers completed yet.' });
    var attCard = K.card({ title: 'Attendance', sub: s.client ? '' : 'Overall ' + (att.summary.pct == null ? '—' : att.summary.pct + '%') + ' across ' + att.registers + ' completed registers', body: attBody });
    var lc = K.card({ title: 'Status', right: K.status(s.lifecycle), body: K.timeline(s.history.slice().reverse()) });
    /* Regular coaches in force today, any change already set for a later date, and Change / Add a coach */
    var regNow = db.regularStaffOn(s, K.today), coming = (s.staffChanges || []).filter(function (ch) { return ch.from > K.today; });
    var coaches = K.card({ title: 'Regular coaches', sub: 'They coach every date unless a date is changed on its own.', right: s.lifecycle !== 'Inactive' ? K.actBtn('Add a coach', 'sch-coach', { session: s.id, mode: 'add', coach: '' }, { size: 'sm', variant: 'secondary', icon: 'plus' }) : '',
      body: (regNow.length ? K.list(regNow.map(function (x) { return ui.row({ lead: ui.avatar(db.coachName(x.coach), 'md'), title: '<a class="k-link" href="#mgmt-coach/' + x.coach + '">' + esc(db.coachName(x.coach)) + '</a>', sub: [esc(K.roleName(x.role))], after: s.lifecycle !== 'Inactive' ? K.actBtn('Change', 'sch-coach', { session: s.id, coach: x.coach }, { size: 'sm', variant: 'tertiary' }) : '' }); })) : ui.notice('warn', 'No coaches yet', 'Add a coach so dates are staffed.')) +
        coming.map(function (ch) { return '<p class="k-note">From ' + esc(K.dd(ch.from)) + ': ' + esc(ch.to === 'same' ? db.coachName(ch.out) + ' becomes ' + K.roleName(ch.role) : ch.to === 'none' ? db.coachName(ch.out) + ' comes off' : (ch.out ? db.coachName(ch.to) + ' replaces ' + db.coachName(ch.out) : db.coachName(ch.to) + ' joins') + ' as ' + K.roleName(ch.role)) + '</p>'; }).join('') });
    var rule = db.getEligibilityRules(s.id) || { ageGroups: [], schoolYears: [] }, ovs = db.getEligibilityOverrides(s.id).filter(function (x) { return !x.revokedAt; });
    var elig = K.card({ title: 'Eligibility', right: K.link('mgmt-eligibility', 'Manage'), body: K.kv([['Age groups', esc(rule.ageGroups.join(', ') || 'Any')], ['School years', esc(rule.schoolYears.join(', ') || 'Any')], ['Membership required', rule.membership ? 'Yes' : 'No'], ['Exceptions', String(ovs.length)]]) });
    var members = s.client ? '' : K.card({ title: 'Players', body: '<p class="k-big num">' + db.getSessionMembers(s.id).length + ' <small class="k-note">of ' + s.capacity + ' places</small></p>' + K.link('mgmt-memberships', 'Open memberships') });
    return K.page(h, K.grid(['<div class="lx-stack">' + details + occT + attCard + sched + '</div>', '<div class="lx-stack">' + lc + coaches + members + elig + '</div>'], '21'));
  };
  Hub.actions['sch-occ-for'] = function (el) { occFilter.session = el.dataset.id; Hub.wsTabs['sch-occ-when'] = 'all'; location.hash = 'mgmt-occurrences'; };
  Hub.actions['sch-lifecycle'] = function (el) {
    var s = db.getSession(el.dataset.id);
    K.sheet({ title: 'Change status', meta: '<p class="k-note">' + esc(s.name) + ' is ' + esc(s.lifecycle) + '.</p>', body: K.form([
      K.field('New status', K.select('lc', OPT().lifecycle, s.lifecycle), 'Draft sessions are hidden from families. Inactive sessions stop generating sessions.', true),
      K.field('Reason', K.textarea('lcReason', '', 'Why is this changing?'), '', true)], 1), foot: sheetFoot('Save change', 'sch-lifecycle-save', { id: s.id }) });
  };
  Hub.actions['sch-lifecycle-save'] = function (el) {
    var id = el.dataset.id, st = K.val('lc'), why = K.val('lcReason'), s = db.getSession(id);
    if (st === s.lifecycle) { Hub.toast('Status is already ' + st); return; }
    var was = s.lifecycle, at = K.now();
    closeThen(function () { db.setSessionLifecycle(id, st, why, who(), at); }, s.name + ' is now ' + st, { area: 'Schedule', summary: 'Status changed to ' + st + ' for ' + s.name, entity: id, before: was, after: st, at: at });
  };

  /* ===================================================== SESSION WIZARD */
  var STEPS = ['Details', 'Schedule', 'Venue & capacity', 'Coaches', 'Review'];
  var wiz = null;
  function wizFrom(key, s) {
    var d = s || OPT().newSession, staff = {};
    if (s) s.staff.forEach(function (x) { staff[x.coach] = x.role; }); else Object.assign(staff, d.staff);
    wiz = { key: key, id: s ? s.id : null, step: 0, v: {
      name: d.name, programme: d.programme, area: d.area, ageGroup: d.ageGroup, client: d.client || '', commercial: d.commercial, booking: d.booking, billing: d.billing, price: pounds(d.price || 0), lifecycle: d.lifecycle,
      pattern: d.pattern, days: (d.days || []).slice(), start: d.start, end: d.end, startDate: d.startDate, endDate: d.endDate, dates: (d.dates || []).slice(), newDate: '',
      breaks: s ? db.getScheduleBreaksFor(s.id).map(function (b) { return b.id; }) : d.breaks.slice(), custom: [], venue: d.venue || '', capacity: d.capacity, meetingPoint: d.meetingPoint || '', staff: staff,
      brkType: OPT().breakTypes[0], brkFrom: '', brkTo: '', brkNote: '' } };
  }
  function harvest() { if (!wiz) return; document.querySelectorAll('.sch-wiz [name]').forEach(function (el) { wiz.v[el.name] = el.value; }); }
  function spec() {
    var v = wiz.v, all = db.getScheduleBreaks();
    return { name: v.name.trim(), programme: v.programme, area: v.area, ageGroup: v.ageGroup, client: v.client || null, commercial: v.commercial, booking: v.booking, billing: v.billing, price: toPence(v.price) || 0, lifecycle: v.lifecycle,
      pattern: v.pattern, days: v.days.map(Number), start: v.start, end: v.end, startDate: v.startDate, endDate: v.endDate, dates: v.dates.slice(),
      breaks: all.filter(function (b) { return v.breaks.indexOf(b.id) >= 0; }).concat(v.custom), venue: v.venue || null, capacity: +v.capacity || 0, meetingPoint: v.meetingPoint,
      staff: Object.keys(v.staff).filter(function (k) { return v.staff[k]; }).map(function (k) { return { coach: k, role: v.staff[k] }; }) };
  }
  function validate(step) {
    var v = wiz.v;
    if (step === 0 && !v.name.trim()) return 'Add a session name first';
    if (step === 0 && isNaN(toPence(v.price))) return 'Enter the price in pounds, for example 72.00';
    if (step === 1) {
      if (!v.start || !v.end || v.start >= v.end) return 'The end time must be after the start time';
      if (v.pattern === 'Weekly' && !v.days.length) return 'Choose at least one day';
      if (v.pattern === 'Weekly' && (!v.startDate || !v.endDate || v.startDate > v.endDate)) return 'Choose a start date before the end date';
      if (v.pattern === 'Selected dates' && !v.dates.length) return 'Add at least one date';
    }
    if (step === 2 && !(+v.capacity > 0)) return 'Capacity must be more than 0';
    return '';
  }
  function chip(label, on, action, data) { var a = ''; Object.keys(data).forEach(function (k) { a += ' data-' + k + '="' + esc(data[k]) + '"'; }); return '<button type="button" class="sch-chip' + (on ? ' is-on' : '') + '" aria-pressed="' + !!on + '" data-action="' + action + '"' + a + '>' + (on ? I('check', 'icon-sm') : '') + esc(label) + '</button>'; }
  function wizStep() {
    var v = wiz.v, O = OPT(), st = wiz.step;
    if (st === 0) {
      var clients = [['', 'None (parent session)']].concat((db.getClients ? db.getClients() : []).map(function (c) { return [c.id, c.name]; }));
      return K.card({ title: 'Session details', sub: 'What it is, who it is for and how it is paid for.', body: K.form([
        K.field('Session name', K.input('name', v.name, { placeholder: 'For example U11 Saturday Development' }), '', true),
        K.field('Programme', K.select('programme', O.programmes, v.programme)), K.field('Delivery area', K.select('area', O.areas, v.area)),
        K.field('Age group', K.select('ageGroup', O.ageGroups, v.ageGroup)), K.field('Client', K.select('client', clients, v.client), 'Client sessions use a headcount register.'),
        K.field('How is this session funded?', K.select('commercial', O.commercial, v.commercial)),
        K.field('How is it charged?', K.select('billing', O.billing, v.billing)), K.field('Price (£)', K.input('price', v.price), 'Per month for subscriptions, per session or per hour otherwise.'),
        K.field('Status', K.select('lifecycle', O.lifecycle, v.lifecycle), 'Draft stays hidden from families until you activate it.')]) });
    }
    if (st === 1) {
      var pattern = '<div class="segmented k-seg" role="group">' + ['Weekly', 'Selected dates'].map(function (p) { return '<button type="button" data-action="sch-wiz-pattern" data-p="' + p + '" aria-pressed="' + (v.pattern === p) + '">' + (p === 'Weekly' ? 'Recurring weekly' : 'Selected dates') + '</button>'; }).join('') + '</div>';
      var body = pattern;
      if (v.pattern === 'Weekly') body += '<div class="sch-chips">' + O.dows.map(function (d) { return chip(d[1], v.days.map(Number).indexOf(d[0]) >= 0, 'sch-wiz-day', { d: d[0] }); }).join('') + '</div>' +
        K.form([K.field('Start time', K.input('start', v.start, { type: 'time' })), K.field('End time', K.input('end', v.end, { type: 'time' })), K.field('First date', K.input('startDate', v.startDate, { type: 'date' })), K.field('Last date', K.input('endDate', v.endDate, { type: 'date' }))]);
      else body += K.form([K.field('Start time', K.input('start', v.start, { type: 'time' })), K.field('End time', K.input('end', v.end, { type: 'time' }))]) +
        '<div class="sch-adddate">' + K.field('Add a date', K.input('newDate', v.newDate, { type: 'date' })) + K.actBtn('Add date', 'sch-wiz-adddate', {}, { variant: 'secondary', icon: 'plus' }) + '</div>' +
        (v.dates.length ? '<div class="sch-chips">' + v.dates.slice().sort().map(function (d) { return '<span class="sch-chip is-on">' + esc(K.dd(d)) + '<button type="button" aria-label="Remove ' + esc(K.dd(d)) + '" data-action="sch-wiz-deldate" data-d="' + d + '">' + I('x', 'icon-sm') + '</button></span>'; }).join('') + '</div>' : '<p class="k-note">No dates added yet.</p>');
      var brks = db.getScheduleBreaks().map(function (b) { return chip(b.type + ' · ' + (b.from === b.to ? K.dm(b.from) : K.dm(b.from) + '–' + K.dm(b.to)), v.breaks.indexOf(b.id) >= 0, 'sch-wiz-break', { id: b.id }); }).join('') +
        v.custom.map(function (b, i) { return '<span class="sch-chip is-on">' + esc(b.type + ' · ' + (b.from === b.to ? K.dm(b.from) : K.dm(b.from) + '–' + K.dm(b.to))) + '<button type="button" aria-label="Remove break" data-action="sch-wiz-delbreak" data-i="' + i + '">' + I('x', 'icon-sm') + '</button></span>'; }).join('');
      var addBrk = K.form([K.field('Break type', K.select('brkType', O.breakTypes, v.brkType)), K.field('From', K.input('brkFrom', v.brkFrom, { type: 'date' })), K.field('To', K.input('brkTo', v.brkTo, { type: 'date' })), K.field('Note', K.input('brkNote', v.brkNote, { placeholder: 'Optional' }))], 2) +
        '<div class="k-bar">' + K.actBtn('Add break', 'sch-wiz-addbreak', {}, { variant: 'secondary', icon: 'plus' }) + '</div>';
      return K.card({ title: 'Schedule', sub: 'A recurring weekly pattern, or a list of selected dates.', body: '<div class="lx-stack">' + body + '</div>' }) +
        K.card({ title: 'Schedule breaks', sub: 'Half term, INSET days and venue closures. No sessions are created on these dates.', body: '<div class="lx-stack"><div class="sch-chips">' + brks + '</div>' + addBrk + '</div>' });
    }
    if (st === 2) {
      var venues = [['', 'No venue yet']].concat(db.getVenues().map(function (x) { return [x.key, x.name + (x.active ? '' : ' (inactive)')]; }));
      var venueField = wiz.id ? ('<div class="field k-field"><span class="label">Venue</span>' + '<div class="sch-vfixed"><b>' + esc((function () { var cs = db.getSession(wiz.id), u = db.usualVenueOn(cs, K.today); return u ? db.venueName(u) : 'No venue yet'; })()) + '</b>' + K.actBtn('Change venue', 'sch-venue', { session: wiz.id }, { size: 'sm', variant: 'secondary', icon: 'pin' }) + '</div><span class="hint">Opens the venue change: one date, some dates, or from a date onwards.</span></div>')
        : K.field('Venue', K.select('venue', venues, v.venue), 'You can change the venue for a single date later.');
      return K.card({ title: 'Venue & capacity', body: K.form([venueField, K.field('Capacity', K.input('capacity', v.capacity, { type: 'number' }), 'For client sessions this is the expected headcount.'), K.field('Who can book?', K.select('booking', O.booking, v.booking), 'Invite only: families cannot sign up or pay until you offer a place.'),
        K.field('Meeting point', K.input('meetingPoint', v.meetingPoint), '', true)]) });
    }
    if (st === 3 && wiz.id) {
      var cs = db.getSession(wiz.id), reg = db.regularStaffOn(cs, K.today);
      return K.card({ title: 'Regular coaches', sub: 'Changes open the coach change: one date, some dates, or from a date onwards.', right: K.actBtn('Add a coach', 'sch-coach', { session: wiz.id, mode: 'add', coach: '' }, { size: 'sm', variant: 'secondary', icon: 'plus' }),
        body: reg.length ? K.list(reg.map(function (x) { return ui.row({ lead: ui.avatar(db.coachName(x.coach), 'md'), title: esc(db.coachName(x.coach)), sub: [esc(K.roleName(x.role))], after: K.actBtn('Change', 'sch-coach', { session: wiz.id, coach: x.coach }, { size: 'sm', variant: 'tertiary' }) }); })) : ui.notice('warn', 'No coaches yet', 'Add a coach so dates are staffed.') });
    }
    if (st === 3) {
      var roles = [['', 'Not assigned']].concat(O.staffRoles.map(function (r) { return [r, K.roleName(r)]; }));
      return K.card({ title: 'Regular coaches', sub: 'They coach every date unless a date is changed on its own.', body: K.table({ cols: '40px minmax(0, 1fr) 170px', head: ['', 'Coach', 'Role'], rows: db.getCoaches().map(function (c) {
        return { cells: [ui.avatar(c.name, 'sm'), K.cell(esc(c.name), esc(c.role || '')), '<select class="select" data-change="sch-wiz-role" data-coach="' + c.id + '">' + roles.map(function (r) { return '<option value="' + r[0] + '"' + ((v.staff[c.id] || '') === r[0] ? ' selected' : '') + '>' + r[1] + '</option>'; }).join('') + '</select>'] };
      }) }) });
    }
    var sp = spec(), prev = db.previewOccurrences(sp), make = prev.filter(function (p) { return !p.skipped; });
    var future = wiz.id ? db.getSessionOccurrences(wiz.id).filter(function (o) { return o.date > K.today && o.status === 'Scheduled'; }).length : 0;
    var summary = K.card({ title: 'Review', body: K.kv([['Session', esc(sp.name)], ['Programme', esc(sp.programme) + ' · ' + esc(sp.ageGroup)], ['Client', sp.client ? esc((db.getClient(sp.client) || {}).name || sp.client) : 'None'], ['Commercial', esc(sp.commercial) + ' · ' + esc(sp.billing)],
      ['Booking access', esc(sp.booking)], ['Price', K.money(sp.price)], ['Schedule', (function () { var w = schedWords(sp); return w.line + (w.sub ? '<br><small class="k-note">' + w.sub + '</small>' : ''); })()],
      ['Usual venue', sp.venue ? esc(db.venueName(sp.venue)) : 'None set'], ['Places', sp.capacity + ' per date'], ['Coaches', (function () { var st = wiz.id ? db.regularStaffOn(db.getSession(wiz.id), K.today) : sp.staff; return st.length ? esc(st.map(function (x) { return db.coachName(x.coach) + ' (' + K.roleName(x.role) + ')'; }).join(', ')) : K.pill('None yet', 'warn'); })()], ['Status', K.status(sp.lifecycle)]], true) });
    /* Editing: exactly what saving does to the dates. A booked date is never removed here. */
    if (wiz.id) {
      var plan = db.planSessionDates(wiz.id, wizPatch(sp, db.getSession(wiz.id))), dl = function (list) { return list.map(function (d) { return esc(K.dd(d)); }).join(' · '); };
      var lines = [plan.add.length ? ['Added', dl(plan.add)] : null, plan.remove.length ? ['Removed', dl(plan.remove.map(function (o) { return o.date; })) + ' <small class="k-note">(nothing booked on ' + (plan.remove.length === 1 ? 'it' : 'them') + ')</small>'] : null].filter(Boolean);
      var blockedHtml = plan.blocked.map(function (b) { return ui.notice('warn', esc(K.dd(b.o.date)) + ' can’t be removed here', 'It’s no longer in the schedule, but ' + esc(b.why) + '. Cancel or reschedule it from the date first, so families are told and refunds are decided. Then save again.', { action: K.goBtn('Open ' + K.dd(b.o.date), 'mgmt-occurrence/' + b.o.id, { size: 'sm', variant: 'secondary' }) }); }).join('');
      return summary + K.card({ title: 'Dates', sub: (lines.length || plan.blocked.length ? 'What saving does to the dates. ' : 'No dates are added or removed. ') + 'Past, started and confirmed dates never change, and dates with their own time, venue, places or coaches keep them.',
        body: (lines.length ? K.kv(lines) : '') + blockedHtml + (!lines.length && !plan.blocked.length ? '<p class="k-note">' + future + ' upcoming date' + (future === 1 ? '' : 's') + ' follow this set-up.</p>' : '') });
    }
    var pv = K.card({ title: wiz.id ? 'Dates from this timetable' : 'Create dates', sub: wiz.id ? 'Saving applies only what you changed to the ' + future + ' upcoming dates that still follow the usual set-up. Dates with their own time, venue, capacity or coach arrangements keep them; past dates never change.' : make.length + ' dates will be created · ' + (prev.length - make.length) + ' skipped for breaks',
      body: '<ol class="sch-preview">' + prev.map(function (p) { return '<li class="' + (p.skipped ? 'is-skipped' : '') + '"><b class="num">' + esc(K.dd(p.date)) + '</b><span class="num">' + p.start + '–' + p.end + '</span>' + (p.skipped ? K.pill('Skipped · ' + p.skipped, 'warn') : K.pill(wiz.id ? 'In pattern' : 'Will be created', 'ok')) + '</li>'; }).join('') + '</ol>' + (prev.length ? '' : '<p class="k-note">This pattern produces no dates.</p>') });
    return summary + pv;
  }
  function wizScreen(ctx, edit) {
    var s = edit ? db.getSession(ctx.param) : null, key = edit ? 'edit:' + ctx.param : 'new';
    var h = K.head({ back: edit && s ? ['mgmt-session/' + s.id, s.name] : ['mgmt-sessions', 'All sessions'], eyebrow: edit ? 'Edit session' : 'Create session', title: edit ? (s ? 'Edit ' + s.name : 'Session not found') : 'Create a session', sub: 'Details, schedule, venue and coaches, then review the dates it creates.' });
    var g = K.guard(ctx, h, { empty: false }); if (g) return g;
    if (edit && !s) return K.page(h, ui.notice('warn', 'This session could not be found', '', { action: K.goBtn('All sessions', 'mgmt-sessions', { size: 'sm' }) }));
    if (!wiz || wiz.key !== key) wizFrom(key, s);
    var last = wiz.step === STEPS.length - 1;
    var nav = '<div class="k-bar sch-wiznav">' + (wiz.step ? K.actBtn('Back', 'sch-wiz-step', { dir: -1 }, { variant: 'secondary' }) : K.goBtn('Cancel', edit ? 'mgmt-session/' + s.id : 'mgmt-sessions', { variant: 'tertiary' })) + '<span class="k-bar__spacer"></span>' +
      (last ? K.actBtn(edit ? 'Save changes' : 'Finish and create', 'sch-wiz-finish', {}, { variant: 'primary', icon: 'check' }) : K.actBtn('Continue', 'sch-wiz-step', { dir: 1 }, { variant: 'primary', trail: 'arrowRight' })) + '</div>';
    return K.page(h, K.steps(STEPS, wiz.step) + '<div class="lx-stack sch-wiz">' + wizStep() + '</div>' + nav);
  }
  Hub.screens['mgmt-session-new'] = function (ctx) { return wizScreen(ctx, false); };
  Hub.screens['mgmt-session-edit'] = function (ctx) { return wizScreen(ctx, true); };
  Hub.actions['sch-wiz-step'] = function (el) {
    harvest(); var dir = +el.dataset.dir;
    if (dir > 0) { var err = validate(wiz.step); if (err) { Hub.toast(err); return; } }
    wiz.step = Math.max(0, Math.min(STEPS.length - 1, wiz.step + dir)); Hub.render(); window.scrollTo(0, 0);
  };
  Hub.actions['sch-wiz-pattern'] = function (el) { harvest(); wiz.v.pattern = el.dataset.p; Hub.render(); };
  Hub.actions['sch-wiz-day'] = function (el) { harvest(); var d = +el.dataset.d, days = wiz.v.days.map(Number), i = days.indexOf(d); if (i >= 0) days.splice(i, 1); else days.push(d); wiz.v.days = days; Hub.render(); };
  Hub.actions['sch-wiz-adddate'] = function () { harvest(); var d = wiz.v.newDate; if (!d) { Hub.toast('Choose a date first'); return; } if (wiz.v.dates.indexOf(d) < 0) wiz.v.dates.push(d); wiz.v.newDate = ''; wiz.v.startDate = wiz.v.dates.slice().sort()[0]; wiz.v.endDate = wiz.v.dates.slice().sort().pop(); Hub.render(); };
  Hub.actions['sch-wiz-deldate'] = function (el) { harvest(); wiz.v.dates = wiz.v.dates.filter(function (d) { return d !== el.dataset.d; }); Hub.render(); };
  Hub.actions['sch-wiz-break'] = function (el) { harvest(); var b = wiz.v.breaks, i = b.indexOf(el.dataset.id); if (i >= 0) b.splice(i, 1); else b.push(el.dataset.id); Hub.render(); };
  Hub.actions['sch-wiz-addbreak'] = function () {
    harvest(); var v = wiz.v; if (!v.brkFrom) { Hub.toast('Choose when the break starts'); return; }
    v.custom.push({ type: v.brkType, from: v.brkFrom, to: v.brkTo && v.brkTo >= v.brkFrom ? v.brkTo : v.brkFrom, note: v.brkNote }); v.brkFrom = v.brkTo = v.brkNote = ''; Hub.render(); Hub.toast('Break added');
  };
  Hub.actions['sch-wiz-delbreak'] = function (el) { harvest(); wiz.v.custom.splice(+el.dataset.i, 1); Hub.render(); };
  function wizPatch(sp, s) { return { name: sp.name, programme: sp.programme, area: sp.area, ageGroup: sp.ageGroup, client: sp.client, commercial: sp.commercial, booking: sp.booking, billing: sp.billing, price: sp.price, pattern: sp.pattern, days: sp.days, dates: sp.pattern === 'Selected dates' ? sp.dates : s.dates, start: sp.start, end: sp.end, startDate: sp.startDate, endDate: sp.endDate, capacity: sp.capacity, meetingPoint: sp.meetingPoint }; }
  Hub.actions['sch-wiz-finish'] = function () {
    harvest(); for (var i = 0; i < 4; i++) { var err = validate(i); if (err) { wiz.step = i; Hub.render(); Hub.toast(err); return; } }
    var sp = spec(), at = K.now();
    if (wiz.id) {
      var id = wiz.id, s = db.getSession(id);
      var patch = wizPatch(sp, s);
      var lcChange = sp.lifecycle !== s.lifecycle, plan = db.planSessionDates(id, patch);
      if (plan.blocked.length) { wiz.step = STEPS.length - 1; Hub.render(); Hub.toast(K.dd(plan.blocked[0].o.date) + ' can’t be removed here: ' + plan.blocked[0].why + '. Cancel or reschedule it from the date first.'); return; }
      wiz = null;
      Hub.mutate(function () { var n = db.updateSession(id, patch, who(), at); if (lcChange) db.setSessionLifecycle(id, sp.lifecycle, 'Changed in Edit session', who(), at); return n; }, 'Session saved', { area: 'Schedule', summary: 'Session updated: ' + sp.name, entity: id, at: at });
      location.hash = 'mgmt-session/' + id; return;
    }
    wiz = null;
    var res = Hub.mutate(function () { return db.createSession(sp, who(), at); }, 'Session created with its dates', { area: 'Schedule', summary: 'Session created: ' + sp.name, entity: sp.name, at: at });
    Hub.toast(res.session.name + ' created · ' + res.occurrences.length + ' sessions');
    location.hash = 'mgmt-session/' + res.session.id;
  };

  /* ===================================================== CALENDAR */
  var cal = { date: K.today };
  function weekStart(iso) { var d = K.parse(iso).getDay(); return K.addDays(iso, -((d + 6) % 7)); }
  function evClass(o) { var st = db.occState(o); return st === 'Cancelled' || st === 'Rescheduled' || st === 'Postponed' ? ' is-cancelled' : st === 'Staffing issue' || st === 'Awaiting confirmation' ? ' is-warn' : ''; }
  Hub.screens['mgmt-calendar'] = function (ctx) {
    var views = [{ id: 'day', label: 'Day' }, { id: 'week', label: 'Week' }, { id: 'month', label: 'Month' }];
    var h = K.head({ back: ['mgmt-schedule', 'Schedule & Sessions'], eyebrow: 'Schedule & Sessions', title: 'Calendar', sub: 'The full operational schedule by day, week or month.', actions: K.goBtn('Session dates', 'mgmt-occurrences', { variant: 'secondary' }), tabs: K.tabs('sch-cal', views) });
    var g = K.guard(ctx, h, { empty: ['calendar', 'Nothing scheduled', 'Dates appear here once a session is active.'] }); if (g) return g;
    var v = K.tab('sch-cal', views), d = cal.date, label, body;
    if (v === 'day') {
      label = K.d(d);
      var list = sortOcc(db.getCalendarOccurrences(d, d));
      body = K.table({ cols: '64px minmax(0, 1.6fr) minmax(0, 1fr) 72px minmax(0, 150px)', head: ['Time', 'Session', { label: 'Coaches', cls: 'wide' }, { label: 'Expected', cls: 'c-num wide' }, { label: '', cls: 'c-end' }],
        rows: list.map(function (o) { return { cells: [timeCell(o), K.cell(esc(o.session), esc(venueOf(o))), { cls: 'wide c-cell', html: staffText(o) }, { cls: 'c-num wide', html: String(o.players) }, { cls: 'c-end', html: occStatus(o) }], route: 'mgmt-occurrence/' + o.id }; }),
        empty: 'Nothing scheduled on this day.' });
    } else if (v === 'week') {
      var ws = weekStart(d); label = K.dm(ws) + ' – ' + K.d(K.addDays(ws, 6));
      body = '<div class="sch-week">' + [0, 1, 2, 3, 4, 5, 6].map(function (i) {
        var day = K.addDays(ws, i), list = sortOcc(db.getCalendarOccurrences(day, day));
        return '<div class="sch-week__day' + (day === K.today ? ' is-today' : '') + '"><a class="sch-week__head" href="#mgmt-calendar" data-action="sch-cal-day" data-d="' + day + '"><span>' + esc(K.dd(day).split(' ')[0]) + '</span><b class="num">' + K.parse(day).getDate() + '</b></a>' +
          (list.length ? list.map(function (o) { return '<a class="sch-ev' + evClass(o) + '" href="#mgmt-occurrence/' + o.id + '"><b class="num">' + o.start + '</b><span>' + esc(o.session) + '</span><small>' + esc(venueOf(o)) + '</small></a>'; }).join('') : '<p class="sch-week__none">Nothing on</p>') + '</div>';
      }).join('') + '</div>';
    } else {
      var p = K.parse(d), first = K.iso(new Date(p.getFullYear(), p.getMonth(), 1)), start = weekStart(first), month = p.getMonth();
      label = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month] + ' ' + p.getFullYear();
      var cells = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (x) { return '<div class="k-month__dow">' + x + '</div>'; });
      for (var i = 0; i < 42; i++) {
        var day = K.addDays(start, i), dd = K.parse(day);
        if (i >= 28 && i % 7 === 0 && dd.getMonth() !== month) break;
        var list = sortOcc(db.getCalendarOccurrences(day, day));
        cells.push('<div class="k-month__day' + (dd.getMonth() !== month ? ' is-out' : '') + (day === K.today ? ' is-today' : '') + '"><a class="k-month__n" href="#mgmt-calendar" data-action="sch-cal-day" data-d="' + day + '">' + dd.getDate() + '</a>' +
          list.slice(0, 4).map(function (o) { return '<a class="k-month__ev' + evClass(o) + '" href="#mgmt-occurrence/' + o.id + '" title="' + esc(o.session + ', ' + o.start) + '">' + o.start + ' ' + esc(o.session) + '</a>'; }).join('') + (list.length > 4 ? '<small class="k-note">+' + (list.length - 4) + ' more</small>' : '') + '</div>');
      }
      body = '<div class="k-month">' + cells.join('') + '</div>';
    }
    var bar = '<div class="k-bar sch-calbar"><div class="sch-calbar__nav">' + '<button type="button" class="icon-btn" aria-label="Previous" data-action="sch-cal-move" data-dir="-1">' + I('chevron', 'icon-sm flip') + '</button>' + ui.iconBtn('chevron', 'Next', { 'data-action': 'sch-cal-move', 'data-dir': 1 }) + '</div><b class="sch-calbar__label">' + esc(label) + '</b><span class="k-bar__spacer"></span>' +
      K.actBtn('Today', 'sch-cal-today', {}, { size: 'sm', variant: 'secondary' }) + '<span class="sch-legend"><span><i class="is-warn"></i>Needs action</span><span><i class="is-cancelled"></i>Cancelled or moved</span></span></div>';
    return K.page(h, bar + body);
  };
  Hub.actions['sch-cal-move'] = function (el) {
    var v = Hub.wsTabs['sch-cal'] || 'day', dir = +el.dataset.dir, p = K.parse(cal.date);
    if (v === 'day') cal.date = K.addDays(cal.date, dir); else if (v === 'week') cal.date = K.addDays(cal.date, 7 * dir); else cal.date = K.iso(new Date(p.getFullYear(), p.getMonth() + dir, 1));
    Hub.render();
  };
  Hub.actions['sch-cal-today'] = function () { cal.date = K.today; Hub.render(); };
  Hub.actions['sch-cal-day'] = function (el) { cal.date = el.dataset.d; Hub.wsTabs['sch-cal'] = 'day'; Hub.render(); };

  /* ===================================================== OCCURRENCES LIST */
  var occFilter = { session: '' };
  Hub.screens['mgmt-occurrences'] = function (ctx) {
    var whenS = [{ id: 'upcoming', label: 'Upcoming' }, { id: 'past', label: 'Past' }, { id: 'all', label: 'All dates' }];
    var stS = [{ id: 'all', label: 'Any status' }, { id: 'action', label: 'Needs action' }, { id: 'Scheduled', label: 'Scheduled' }, { id: 'Awaiting confirmation', label: 'Awaiting confirmation' }, { id: 'Confirmed', label: 'Confirmed' }, { id: 'changed', label: 'Changed' }];
    var sel = '<label class="lx-select"><span class="visually-hidden">Session</span>' + I('filter', 'icon-sm') + '<select data-change="sch-occ-session"><option value="">All sessions</option>' + db.getSessions().map(function (s) { return '<option value="' + s.id + '"' + (occFilter.session === s.id ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('') + '</select>' + I('chevronDown', 'icon-sm') + '</label>';
    var h = K.head({ back: ['mgmt-schedule', 'Schedule & Sessions'], eyebrow: 'Schedule & Sessions', title: 'Session dates', sub: 'Every date of every session.', actions: K.goBtn('Calendar', 'mgmt-calendar', { variant: 'secondary', icon: 'calendar' }),
      tabs: '<div class="lx-filterbar">' + K.seg('sch-occ-when', whenS) + K.seg('sch-occ-status', stS) + sel + '</div>' });
    var g = K.guard(ctx, h, { empty: ['calendar', 'No sessions', 'Dates are created when a session is created.'] }); if (g) return g;
    var w = K.tab('sch-occ-when', whenS), st = K.tab('sch-occ-status', stS);
    var list = db.getOccurrences(function (o) {
      if (occFilter.session && o.sessionId !== occFilter.session) return false;
      if (w === 'upcoming' && o.date < K.today) return false;
      if (w === 'past' && o.date >= K.today) return false;
      var os = db.occState(o);
      if (st === 'changed') return !!o.change || os === 'Partially delivered';
      if (st === 'action') return os === 'Staffing issue' || os === 'Awaiting confirmation';
      return st === 'all' || os === st;
    });
    list = sortOcc(list, w === 'past');
    var rows = list.map(function (o) {
      return { cells: [timeCell(o, true), K.cell(esc(o.session), esc(venueOf(o)) + (o.change ? ' · ' + esc(o.change) : '')), { cls: 'wide c-cell', html: staffText(o) }, { cls: 'wide', html: o.status === 'Cancelled' || o.status === 'Rescheduled' || o.status === 'Postponed' ? '<span class="c-mute">—</span>' : K.status(regState(o)) }, { cls: 'c-end', html: occStatus(o) }], route: 'mgmt-occurrence/' + o.id };
    });
    return K.page(h, '<p class="k-note sch-count">' + list.length + ' sessions</p>' + K.table({ cols: '110px minmax(0, 1.5fr) minmax(0, 1fr) 110px minmax(0, 150px)', head: ['When', 'Session', { label: 'Coaches', cls: 'wide' }, { label: 'Register', cls: 'wide' }, { label: 'Status', cls: 'c-end' }], rows: rows, empty: 'No sessions match these filters.' }));
  };
  document.addEventListener('change', function (e) {
    var t = e.target, k = t && t.dataset && t.dataset.change;
    if (k === 'sch-occ-session') { occFilter.session = t.value; Hub.render(); }
    if (k === 'sch-wiz-role' && wiz) { harvest(); wiz.v.staff[t.dataset.coach] = t.value; }
    if (k === 'sch-elig-session') { eligSession = t.value; Hub.render(); }
  });

  /* ===================================================== OCCURRENCE DETAIL */
  var CHANGED = ['Cancelled', 'Rescheduled', 'Postponed'];
  Hub.screens['mgmt-occurrence'] = function (ctx) {
    var o = db.getOccurrence(ctx.param);
    var live = o && !(o.status === 'Cancelled' || o.status === 'Rescheduled' || o.status === 'Postponed');
    var h = K.head({ back: o ? ['mgmt-session/' + o.sessionId, o.session] : ['mgmt-sessions', 'All sessions'], eyebrow: o ? K.dd(o.date) : 'Session', title: o ? o.session : 'Session not found', sub: o ? esc(when(o)) + ' · ' + esc(venueOf(o)) : '',
      actions: o && live ? K.goBtn('Open register', 'mgmt-register/' + o.id, { variant: 'secondary', icon: 'check' }) + (!o.delivery && !o.draft && (o.status === 'Scheduled' || o.status === 'Completed') ? K.actBtn('More actions', 'sch-more', { id: o.id }, { variant: 'tertiary', icon: 'more' }) : '') : '' });
    var g = K.guard(ctx, h, { empty: ['calendar', 'No details yet', 'This session has nothing to show yet.'] }); if (g) return g;
    if (!o) return K.page(h, ui.notice('warn', 'This session could not be found', '', { action: K.goBtn('All sessions', 'mgmt-sessions', { size: 'sm' }) }));
    var s = db.getSession(o.sessionId), reg = db.getRegister(o.id), changed = CHANGED.indexOf(o.status) >= 0;
    var status = '<div class="sch-statusline">' + K.status(o.status) + (o.draft ? K.pill('Draft session') : '') + (o.change ? K.pill(o.change, 'info') : '') + (risk(o) ? K.pill(risk(o), 'danger') : '') + '</div>';
    var details = K.card({ title: 'Details', body: K.kv([
      ['Session', K.link('mgmt-session/' + s.id, s.name)], ['Date', K.d(o.date)], ['Time', o.start + '–' + o.end],
      ['Venue', (o.venue ? K.link('mgmt-venue/' + o.venue, db.venueName(o.venue)) : K.pill('No venue yet', 'warn')) + (o.venueOverride ? '<br><small class="k-note">Changed from ' + esc(db.venueName(o.venueOverride.from)) + ': ' + esc(o.venueOverride.reason) + '</small>' : '')],
      ['Capacity', o.capacity + (o.capacityOverride ? ' <small class="k-note">(changed from ' + (o.capacityOverride.from || s.capacity) + ': ' + esc(o.capacityOverride.reason) + ')</small>' : '')],
      ['Expected', s.client ? 'Headcount ' + o.players : o.players + ' players'], ['Register', changed ? '<span class="c-mute">Not needed</span>' : K.link('mgmt-register/' + o.id, reg.state)], ['Age group', esc(o.ageGroup)]
    ], true) });
    /* Staff for this Session: planned before it runs, what actually happened once confirmed */
    var ended = db.hasEnded(o), done = !!o.delivery, canEdit = db.venueChangeable(o);
    function onTheDay(x) {
      if (x.attended === 'Attended') return K.status('Present');
      if (x.attended === 'Absent') return K.status('Absent') + (x.covering ? ' <small class="sch-why">' + esc(db.coachName(x.covering).split(' ')[0]) + ' covered</small>' : '');
      if (x.attended === 'Not required' || x.attended === 'Moved') return '<span class="c-mute">' + esc(x.attended) + '</span>';
      if (x.unavailable) return x.covering ? K.pill('Covered by ' + db.coachName(x.covering).split(' ')[0], 'info') : K.pill('Away', '');
      return x.cover ? K.pill('Covering ' + db.coachName(x.covers || '').split(' ')[0], 'info') : '<span class="c-mute">Planned</span>';
    }
    var staffT = K.card({ title: 'Staff for this Session', sub: done ? 'What actually happened. Saved for history and coach pay.' : ended ? 'As planned. Confirm what actually happened above.' : 'Planned for this date. Changes here affect this date only.',
      right: done || changed || ended ? '' : K.actBtn('Add a coach', 'sch-coach', { id: o.id, mode: 'add' }, { size: 'sm', variant: o.staff.length ? 'secondary' : 'primary', icon: 'plus' }),
      body: o.staff.length ? K.table({ cols: '36px minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 150px)' + (canEdit ? ' 190px' : ''), head: ['', 'Coach', { label: 'Role on the day', cls: 'wide' }, { label: done ? 'On the day' : 'Status', cls: 'c-end' }].concat(canEdit ? [{ label: '', cls: 'c-end' }] : []), rows: o.staff.map(function (x) {
        var planned = K.roleName(x.role || (x.lead ? 'Lead' : 'Coach'));
        return { cells: [ui.avatar(db.coachName(x.coach), 'sm', x.attended === 'Absent' || (x.unavailable && !x.covering) ? 'is-out' : ''), K.cell(esc(db.coachName(x.coach)), x.cover ? 'Covering ' + esc(db.coachName(x.covers || '').split(' ')[0]) : x.extra ? 'Extra coach on the day' : x.added ? 'Added for this date' : 'Planned: ' + esc(planned)),
          { cls: 'wide c-cell', html: esc(K.roleName(x.actualRole || x.role) || '—') }, { cls: 'c-end', html: onTheDay(x) }].concat(canEdit ? [{ cls: 'c-end', html: staffActs(o, x) }] : []) };
      }) }) : ui.notice('danger', 'No coach yet', 'Add a coach or ask for cover before this session starts.') });
    var notes = K.card({ title: 'Operational notes', right: K.actBtn(o.notes ? 'Edit notes' : 'Add notes', 'sch-notes', { id: o.id }, { size: 'sm', variant: 'secondary' }), body: o.notes ? '<p class="sch-notes">' + esc(o.notes) + '</p>' + (o.notesBy ? K.stamp('Updated', o.notesBy, o.notesAt) : '') : '<p class="k-note">No notes for this session.</p>' });
    var change = '';
    if (changed || o.replacementOf) {
      var rep = o.replacement && db.getOccurrence(o.replacement), orig = o.replacementOf && db.getOccurrence(o.replacementOf);
      change = K.card({ title: 'Schedule change', body: K.kv([['State', esc(o.change || o.status)], o.cancelReason ? ['Reason', esc(o.cancelReason)] : null, o.cancelledAt ? ['Recorded', K.stamp('Recorded', o.cancelledBy, o.cancelledAt)] : null,
        rep ? ['Replacement', K.link('mgmt-occurrence/' + rep.id, K.dd(rep.date) + ', ' + rep.start + ' (' + rep.id + ')')] : null, orig ? ['Replaces', K.link('mgmt-occurrence/' + orig.id, K.dd(orig.date) + ', ' + orig.start + ' (' + orig.id + ')')] : null]) +
        (changed ? '<div class="k-bar sch-gap">' + (o.outcome ? K.goBtn('See refunds and credits', 'mgmt-occurrence-outcome/' + o.id, { variant: 'secondary' }) : K.goBtn('Decide refunds and credits', 'mgmt-occurrence-outcome/' + o.id, { variant: 'primary' })) + (o.status === 'Postponed' ? K.actBtn('Set new date', 'sch-resched', { id: o.id }, { variant: 'secondary' }) : '') + '</div>' : '') });
    }
    var actions = '';
    /* Is this session ready to run? One message and the one next step. */
    var issues = readiness(o, s, reg), handled = [].concat.apply([], issues.map(function (x) { return x.rules || []; }));
    var sit = readinessHtml(issues);
    var originals = (o.deliveryHistory || []).map(function (hx, i) {
      return '<div class="sch-orig"><b>' + (i === 0 ? 'Original confirmation' : 'Before correction ' + (i + 1)) + '</b><small>' + K.stamp('Confirmed', hx.delivery.by, hx.delivery.at) + ' · replaced ' + K.dt(hx.replacedAt) + ' by ' + esc(hx.replacedBy) + ': ' + esc(hx.reason) + '</small>' +
        '<p>' + (hx.delivery.staff || []).map(function (x) { return esc(db.coachName(x.coach)) + ' (' + esc(K.roleName(x.role)) + '): ' + esc(x.attended === 'Attended' ? 'present' : (x.attended || 'not recorded').toLowerCase()); }).join(' · ') + '</p>' +
        (K.fin() === 'none' ? '' : '<p class="c-mute">Pay: ' + hx.pay.map(function (a) { return esc(db.coachName(a.coach).split(' ')[0]) + ' ' + a.units + ' h × ' + K.money(a.rate) + ' = ' + K.money(a.cost); }).join(' · ') + '</p>') + '</div>';
    }).join('');
    var history = K.details('History', originals + K.timeline(o.history.slice().reverse()), { sub: 'Every change to this date, with who and when' });
    var also = K.needsFor(function (k) { return K.relatesTo(k, 'occurrence', o.id) && handled.indexOf(k.ruleId) < 0; }, { title: 'Also needs you' });
    return K.page(h, sit + also + K.grid(['<div class="lx-stack">' + staffT + details + '</div>', '<div class="lx-stack">' + change + notes + '</div>'], '21') + history);
  };
  /* Per coach on a date: Can't coach (finds cover) and Change (you know who) */
  function staffActs(o, x) {
    if (x.unavailable) return '';
    var cant;
    if (x.cover) {
      var held = db.getCoverRequests().map(function (r) { var n = r.needs.filter(function (n) { return n.occurrence === o.id && n.confirmed && n.confirmed.coach === x.coach && !n.confirmed.direct; })[0]; return n ? { r: r, n: n } : null; }).filter(Boolean)[0];
      cant = held ? K.actBtn('Can’t coach', 'co-dropout', { req: held.r.id, need: held.n.id }, { size: 'sm', variant: 'tertiary' }) : '';
    } else cant = K.actBtn('Can’t coach', 'sch-cantcoach', { id: o.id, coach: x.coach }, { size: 'sm', variant: 'tertiary' });
    return '<span class="k-row-actions">' + cant + K.actBtn('Change', 'sch-coach', { id: o.id, coach: x.coach }, { size: 'sm', variant: 'tertiary' }) + '</span>';
  }
  /* Cover on this date, in the same plain words as the cover page. Know who → Change coach; don't → Find cover. */
  function coverBanner(o, absent) {
    var hit = db.coverNeedsFor(o.id).filter(function (y) { return y.need.absent === (absent || null); })[0];
    var title0 = absent ? esc(db.coachName(absent)) + ' can’t coach' : 'No coach yet';
    var change = absent ? K.actBtn('Change coach', 'sch-coach', { id: o.id, coach: absent }, { variant: 'secondary' }) : K.actBtn('Add a coach', 'sch-coach', { id: o.id, mode: 'add' }, { variant: 'secondary' });
    var rules = absent ? ['ATT-014', 'ATT-041'] : ['ATT-013', 'ATT-041'];
    if (!hit) return { tone: 'danger', title: title0, text: absent ? 'Find cover offers it to every eligible coach and you choose who covers. Change coach if you already know who.' : 'This session can’t run without a coach. Find cover, or add a coach if you know who.',
      primary: K.actBtn('Find cover', 'sch-findcover', { id: o.id, coach: absent || '' }, { variant: 'primary', icon: 'swap' }), secondary: change, rules: rules };
    var x = db.coverOutcome(hit.need), go = function (label) { return K.goBtn(label, 'mgmt-cover-request/' + hit.request.id + '/' + hit.need.id, { variant: 'primary', icon: 'swap' }); };
    var prog = x.offered ? x.offered + ' offered · ' + x.replied + ' replied · ' + x.can.length + ' can cover' : 'No eligible coach is free';
    var nm = function (f) { return db.coachName(f.coach).split(' ')[0]; };
    if (x.key === 'choose') return { tone: x.urgency ? 'danger' : 'warn', title: title0 + ': ' + (x.can.length > 1 ? x.can.length + ' coaches can cover' : esc(nm(x.can[0])) + ' can cover'), text: 'Choose who covers. ' + prog + '.', primary: go('Choose who covers'), secondary: change, rules: rules };
    if (x.key === 'none') return { tone: 'danger', title: title0 + ': no one can cover yet', text: prog + '. Ring round, offer a higher rate, or choose someone yourself.', primary: go('Find someone'), secondary: change, rules: rules };
    return { tone: x.urgency ? 'danger' : 'warn', title: title0 + ': finding cover', text: prog + '. You’ll choose once someone can cover.', primary: go('See replies'), secondary: change, rules: rules };
  }
  /* What this date needs, most serious first. The first is the banner; the rest sit under it.
     Before it runs: is it ready? Once it has ended: did it go as planned? Once confirmed: what happened. */
  function readiness(o, s, reg) {
    /* Away with no one covering yet, including time off that still leaves a coach on the date: never "ready" */
    var out = o.staff.filter(function (x) { return (x.unavailable && !x.covering) || (!x.unavailable && !x.cover && db.awayFrom && db.awayFrom(x.coach, o)); }), list = [];
    var regDone = reg.state === 'Completed', regIssue = { tone: 'warn', title: 'Register still needed', text: 'The register is ' + reg.state.toLowerCase() + '.', primary: K.goBtn('Open register', 'mgmt-register/' + o.id, { variant: 'primary' }), rules: ['ATT-020'] };
    if (o.status === 'Cancelled' || o.status === 'Postponed' || o.status === 'Rescheduled') {
      if (o.outcome) return [{ tone: 'ok', title: 'This session was ' + o.status.toLowerCase(), text: esc(o.cancelReason || '') + ' Refunds and credits have been decided.' }];
      return [{ tone: 'warn', sev: (db.getAttentionCase('outcome_missing|occurrence:' + o.id) || { severity: 'Warning' }).severity, title: 'This session was ' + o.status.toLowerCase(), text: 'Families, the venue and coaches are waiting to hear what happens next.', primary: K.goBtn('Decide refunds and credits', 'mgmt-occurrence-outcome/' + o.id, { variant: 'primary' }), rules: ['ATT-024'] }];
    }
    if (o.delivery) {
      var d = o.delivery;
      list.push({ tone: 'ok', kicker: d.corrected ? 'Corrected ' + K.dm(d.corrected.at.slice(0, 10)) : 'Confirmed ' + K.dm(d.at.slice(0, 10)), title: d.state === 'Partial' ? 'Partially delivered' : d.state === 'Changed' ? 'Delivered, with changes' : 'Delivered as planned',
        text: (d.corrected ? esc(d.corrected.changes.join('. ')) + '. Reason: ' + esc(d.corrected.reason) + '. The original confirmation is kept in History. ' + K.stamp('Corrected', d.corrected.by, d.corrected.at)
          : (d.changes && d.changes.length ? esc(d.changes.join('. ')) + '. ' : '') + 'Who coached, and their pay, are saved for history. ' + K.stamp('Confirmed', d.by, d.at)),
        secondary: K.canFin() ? K.actBtn('Correct delivery', 'sch-correct', { id: o.id }, { variant: 'tertiary', size: 'sm' }) : '' });
      if (!regDone) list.push(regIssue);
      return engineSev(o, list);
    }
    if (db.hasEnded(o) && !o.draft) {
      var names = db.workingStaff(o).map(function (x) { return esc(db.coachName(x.coach).split(' ')[0]) + ' (' + esc(K.roleName(x.actualRole || x.role)) + ')'; }).join(', ');
      var gap = out.length || !o.staff.length;
      list.push({ tone: 'warn', kicker: 'Ended ' + (o.date === K.today ? 'today' : K.dm(o.date)), title: 'Did this session go as planned?',
        text: gap ? (out.length ? esc(out.map(function (x) { return db.coachName(x.coach).split(' ')[0]; }).join(' and ')) + ' couldn’t make it and no cover was confirmed. Record what actually happened.' : 'No coach was planned. Record who actually coached.')
          : 'Planned: ' + (names || 'nobody') + '. Confirming saves who actually coached, for history and coach pay.',
        primary: gap ? K.actBtn('Record what happened', 'sch-changed', { id: o.id }, { variant: 'primary' }) : K.actBtn('Went as planned', 'sch-went', { id: o.id }, { variant: 'primary', icon: 'check' }),
        secondary: gap ? '' : K.actBtn('Something changed', 'sch-changed', { id: o.id }, { variant: 'secondary' }), rules: ['ATT-022', 'ATT-013', 'ATT-014', 'ATT-041'] });
      if (!regDone) list.push(regIssue);
      return engineSev(o, list);
    }
    /* Before it runs: the same issues Needs Attention sees, from the one shared engine */
    if (o.draft) return [{ tone: 'warn', sev: 'Normal', title: 'This session is still a draft', text: 'Finish setting it up so its dates can run and families can book.', primary: K.goBtn('Finish setting up', 'mgmt-session-edit/' + o.sessionId, { variant: 'primary' }), rules: ['ATT-016'] }];
    var iss = db.dateIssues(o), seen = {}, leftNotes = [];
    var vActs = K.actBtn('Reschedule', 'sch-resched', { id: o.id }, { variant: 'secondary' }) + K.actBtn('Cancel session', 'sch-cancel', { id: o.id }, { variant: 'tertiary' });
    /* Each banner carries its issue's severity from the engine; its tone is set from that, never locally */
    iss.open.forEach(function (k) { var n0 = list.length; addIssue(k); if (list.length > n0) Object.assign(list[list.length - 1], { sev: k.severity, waiting: k.waiting, key: k.caseKey }); });
    function addIssue(k) {
      var who = k.related && k.related.coach || null;
      if (k.ruleId === 'ATT-013' || k.ruleId === 'ATT-014' || k.ruleId === 'ATT-041') { if (seen[who]) return; seen[who] = 1; list.push(Object.assign(coverBanner(o, who), { rules: ['ATT-013', 'ATT-014', 'ATT-041'] })); }
      else if (k.ruleId === 'ATT-002') list.push({ tone: 'warn', title: 'Learning Coach only', text: esc(k.why) + ' Add a Lead Coach.', primary: K.actBtn('Add a coach', 'sch-coach', { id: o.id, mode: 'add' }, { variant: 'primary' }), rules: ['ATT-002'] });
      else if (k.ruleId === 'ATT-003') list.push({ tone: 'warn', title: 'No Lead Coach', text: esc(k.why) + ' Make one of the coaches the Lead Coach for this date, or add one.', primary: K.actBtn('Choose a lead', 'sch-coach', { id: o.id, mode: 'lead' }, { variant: 'primary' }), rules: ['ATT-003'] });
      else if (k.ruleId === 'ATT-031') { var comp = db.getCoachComplianceSummary(who); list.push({ tone: 'warn', title: esc(db.coachName(who)) + ': ' + esc(comp.text.charAt(0).toLowerCase() + comp.text.slice(1)), text: 'They are on this date and shouldn’t coach until it’s sorted. Change the coach, or check their documents.', primary: K.actBtn('Change coach', 'sch-coach', { id: o.id, coach: who }, { variant: 'primary' }), secondary: K.actBtn('Check documents', 'sch-docs', { coach: who }, { variant: 'secondary' }), rules: ['ATT-031'] }); }
      else if (k.ruleId === 'ATT-032') list.push({ tone: 'warn', title: esc(k.title), text: esc(k.why), primary: K.goBtn('Set a pay rate', k.route, { variant: 'primary' }), rules: ['ATT-032'] });
      else if (k.ruleId === 'ATT-018') list.push({ tone: 'danger', title: 'No venue yet', text: esc(k.why) + ' Choose a venue, or move the session to a date when one is free.', primary: K.actBtn('Change venue', 'sch-venue', { id: o.id }, { variant: 'primary' }), secondary: vActs, rules: ['ATT-018'] });
      else if (k.ruleId === 'ATT-019') { var shut = db.venueClosure(o.venue, o.date); list.push({ tone: 'danger', title: esc(db.venueName(o.venue)) + ' is closed on ' + esc(K.dd(o.date)), text: esc(shut.reason) + '. Move this date to another venue, reschedule it, or cancel it.', primary: K.actBtn('Change venue', 'sch-venue', { id: o.id }, { variant: 'primary' }), secondary: vActs, rules: ['ATT-019'] }); }
    }
    /* Deliberate exceptions stay visible on the date, with who, when and why */
    iss.left.forEach(function (k) { var e = k.exception; leftNotes.push({ tone: 'ok', kicker: 'Left as it is', title: esc(k.title), text: esc(e.reason) + (e.scope && e.scope.label ? ' · ' + esc(e.scope.label) : '') + '. ' + K.stamp('Agreed', e.by, e.at) + ' It comes back if anything changes on this date.', secondary: K.actBtn('Reopen', 'attn-reopen', { id: e.id }, { variant: 'tertiary', size: 'sm' }), rules: [k.ruleId] }); });
    if (db.hasStarted(o) && !regDone) list.push({ tone: 'warn', sev: 'Normal', title: 'Register still needed', text: 'The session has started. The register is ' + reg.state.toLowerCase() + '.', primary: K.goBtn('Open register', 'mgmt-register/' + o.id, { variant: 'primary' }), rules: ['ATT-020'] });
    /* Urgent first; order within a tone stays as written */
    return (list.length ? list : [{ tone: 'ok', title: 'Ready to run', text: 'Coaches, a Lead Coach and the venue are in place. After it runs, confirm what happened here.' }]).concat(leftNotes);
  }
  /* After the session: confirmation and register take their severity from the engine too */
  function engineSev(o, list) {
    var di = db.dateIssues(o).open, of = function (r) { return di.filter(function (k) { return k.ruleId === r; })[0]; };
    list.forEach(function (x) { var k = x.rules && x.rules.indexOf('ATT-022') >= 0 ? of('ATT-022') : x.rules && x.rules.indexOf('ATT-020') >= 0 ? of('ATT-020') : null; if (x.tone !== 'ok') x.sev = k ? k.severity : 'Normal'; });
    return list;
  }
  /* The most important issue first, as the banner. Other Urgent issues stay as banners (never folded);
     everything else sits quietly underneath. Healthy states are one quiet line. */
  function readinessHtml(list) {
    var R = { Urgent: 0, Warning: 1, Normal: 2 };
    var left = list.filter(function (x) { return x.kicker === 'Left as it is'; }), ok = list.filter(function (x) { return x.tone === 'ok' && x.kicker !== 'Left as it is'; });
    var act = list.filter(function (x) { return x.tone !== 'ok'; }).map(function (x, i) { return { x: x, i: i }; })
      .sort(function (a, b) { return ((a.x.waiting ? 3 : R[a.x.sev || 'Normal']) - (b.x.waiting ? 3 : R[b.x.sev || 'Normal'])) || a.i - b.i; }).map(function (y) { return y.x; });
    act.forEach(function (x) { var t = K.sevTone(x.sev || 'Normal', x.waiting); x.tone = t === 'quiet' ? 'neutral' : t; });
    var banners = act.filter(function (x, i) { return i === 0 || x.sev === 'Urgent'; }), rest = act.filter(function (x) { return banners.indexOf(x) < 0; });
    var okHtml = ok.map(function (x) { return '<p class="k-okline">' + I('checkCircle') + '<b>' + (x.kicker ? esc(x.kicker) + ' · ' : '') + x.title + '</b>' + (act.length ? '' : '<span>' + x.text + '</span>') + (x.secondary || '') + '</p>'; }).join('');
    var rows = rest.map(function (x) { return { sev: x.sev, waiting: x.waiting, title: x.title, action: K.quietAct(x.primary || x.secondary) }; })
      .concat(left.map(function (x) { return { sev: 'Normal', title: 'Left as it is: ' + x.title, sub: x.text, action: K.quietAct(x.secondary) }; }));
    return banners.map(K.situation).join('') + (act.length ? '' : okHtml) + K.alsoList(rows) + (act.length ? okHtml : '');
  }
  /* Find cover from the date: the Hub offers it to every eligible coach at once and you land on its cover page */
  Hub.actions['sch-findcover'] = function (el) {
    var o = db.getOccurrence(el.dataset.id), coach = el.dataset.coach || null, at = K.now(), r;
    var ex = coach && db.awayFrom(coach, o);
    r = Hub.mutate(function () { return coach && ex ? db.sweepTimeOff(who(), at)[0] : db.raiseCover({ coach: coach, occurrences: [o], kind: coach ? 'Unavailable' : 'No coach', reason: coach ? 'Can’t coach this date' : 'No coach on this date' }, who(), at); }, null, occLog(o, 'Cover started', at));
    var hit = db.coverNeedsFor(o.id).filter(function (y) { return y.need.absent === coach; })[0];
    if (hit) { Hub.toast('Offered to every eligible coach'); location.hash = 'mgmt-cover-request/' + hit.request.id + '/' + hit.need.id; }
  };
  /* A coach can't coach this date (or some dates): time off, then cover starts at once */
  Hub.actions['sch-cantcoach'] = function (el) {
    var o = db.getOccurrence(el.dataset.id), c = el.dataset.coach, nm = db.coachName(c).split(' ')[0];
    K.sheet({ overline: '<span class="overline">' + esc(o.session) + ' · ' + esc(K.dd(o.date)) + ', ' + o.start + '</span>', title: esc(nm) + ' can’t coach',
      body: '<p class="k-note">' + esc(nm) + ' comes off the date and the Hub offers it to every eligible coach by Hub and email. You choose who covers. The regular coaches don’t change.</p>' + K.form([
        K.field('Reason', K.input('cc-why', '', { placeholder: 'For example: unwell. Kept from other coaches' }), null, true),
        '<fieldset class="k-fieldset"><legend class="k-label">Which dates?</legend><div class="sch-scope sch-scope--row">' +
          '<label class="sch-scope__opt"><input type="radio" name="ccScope" value="one" checked><span><b>Just this date</b><small>' + esc(K.dd(o.date)) + '</small></span></label>' +
          '<label class="sch-scope__opt"><input type="radio" name="ccScope" value="range"><span><b>More dates</b><small>Every session ' + esc(nm) + ' is on in a date range</small></span></label></div></fieldset>',
        K.field('Until', K.input('cc-to', o.date, { type: 'date' }), 'Only used for More dates')], 1),
      foot: sheetFoot('Find cover', 'sch-cantcoach-go', { id: o.id, coach: c }) });
  };
  Hub.actions['sch-cantcoach-go'] = function (el) {
    var o = db.getOccurrence(el.dataset.id), c = el.dataset.coach, why = K.val('cc-why').trim(), scope = (document.querySelector('#sheet [name=ccScope]:checked') || {}).value, to = K.val('cc-to') || o.date, at = K.now();
    if (!why) { Hub.toast('Add a reason'); return; }
    if (scope === 'range' && to < o.date) { Hub.toast('The end date is before this date'); return; }
    Hub.closeSheet(true);
    var res = Hub.mutate(function () { return db.recordTimeOff(scope === 'range' ? { coach: c, type: 'Unavailable', from: o.date, to: to, reason: why } : { coach: c, type: 'Unavailable', from: o.date, to: o.date, start: o.start, end: o.end, reason: why }, who(), at); }, null, occLog(o, db.coachName(c) + ' can’t coach', at));
    if (res && res.request) { Hub.toast('Offered to every eligible coach'); var n0 = res.request.needs.filter(function (n) { return n.occurrence === o.id; })[0] || res.request.needs[0]; location.hash = 'mgmt-cover-request/' + res.request.id + '/' + n0.id; }
  };
  /* Less frequent changes, behind one Actions control */
  Hub.actions['sch-more'] = function (el) {
    var o = db.getOccurrence(el.dataset.id);
    function r(icon, title, sub, action) { return ui.row({ lead: I(icon, 'row-glyph'), title: esc(title), sub: [esc(sub)], action: action, data: { id: o.id } }); }
    K.sheet({ overline: '<span class="overline">' + esc(o.session) + ' · ' + esc(K.dd(o.date)) + '</span>', title: 'Change this session', body: '<p class="k-note">Changes apply to this date only. Every change is kept in the history.</p>' + K.list([
      (db.hasStarted(o) ? null : r('pin', 'Change venue', 'For this date, some dates, or from a date onwards', 'sch-venue')), r('users', 'Change capacity', 'More or fewer places for this date', 'sch-capacity'),
      r('calendar', 'Reschedule', 'Move it to another date or time', 'sch-resched'), r('clock', 'Postpone', 'Put it off until a new date is set', 'sch-postpone'),
      r('x', 'Cancel this session', 'Then decide refunds and credits', 'sch-cancel')].filter(Boolean)) });
  };
  function occLog(o, summary, at, extra) { return Object.assign({ area: 'Schedule', summary: summary + ': ' + o.session + ', ' + K.dd(o.date), entity: o.id, at: at }, extra || {}); }
  /* Delivery: one tap when it went as planned; one short sheet for exceptions */
  Hub.actions['sch-went'] = function (el) {
    var o = db.getOccurrence(el.dataset.id), at = K.now();
    Hub.mutate(function () { db.confirmDelivery(o.id, null, who(), at); }, 'Confirmed as delivered', occLog(o, 'Delivery confirmed: went as planned', at, { finance: true }));
  };
  Hub.actions['sch-changed'] = function (el) {
    var o = db.getOccurrence(el.dataset.id), O = OPT(), roles = O.staffRoles.map(function (r) { return [r, K.roleName(r)]; });
    var rows = o.staff.filter(function (x) { return !(x.unavailable && x.covering); });
    var onStaff = o.staff.map(function (x) { return x.coach; });
    var others = [['', 'Choose a coach']].concat(db.getCoaches().filter(function (c) { return c.active !== false && onStaff.indexOf(c.id) < 0; }).map(function (c) { return [c.id, c.name]; }));
    var forWho = [['', 'Nobody: an extra coach']].concat(rows.map(function (x) { return [x.coach, db.coachName(x.coach)]; }));
    var people = rows.length ? '<div class="lx-stack">' + rows.map(function (x) {
      return '<div class="sch-staffedit"><div class="sch-staffedit__who">' + ui.avatar(db.coachName(x.coach), 'sm') + '<b>' + esc(db.coachName(x.coach)) + '</b><small class="k-note">Planned: ' + esc(K.roleName(x.actualRole || x.role)) + (x.unavailable ? ' · marked unavailable' : '') + '</small></div>' +
        K.form([K.field('On the day', K.select('dv-at-' + x.coach, [['Present', 'Was there'], ['Absent', 'Wasn’t there']], x.unavailable ? 'Absent' : 'Present')), K.field('Role on the day', K.select('dv-role-' + x.coach, roles, x.actualRole || x.role))], 2) + '</div>';
    }).join('') + '</div>' : '<p class="k-note">No coach was planned for this date.</p>';
    var extra = '<details class="k-details sch-dv"' + (rows.length ? '' : ' open') + '><summary><span><b>Someone else coached</b><small>Cover, or an extra coach</small></span>' + I('chevron', 'icon-sm k-details__chev') + '</summary><div class="k-details__body">' +
      K.form([K.field('Coach', K.select('dv-extra', others, '')), K.field('Role', K.select('dv-extra-role', roles, 'Coach')), K.field('Covering for', K.select('dv-extra-for', forWho, ''))], 1) + '</div></details>';
    var short = '<details class="k-details sch-dv"><summary><span><b>It ended early</b><small>Record when it stopped and how coaches are paid</small></span>' + I('chevron', 'icon-sm k-details__chev') + '</summary><div class="k-details__body">' +
      K.form([K.field('Ended at', K.input('dv-end', '', { type: 'time' })), K.field('Coach pay', K.select('dv-pay', [['worked', 'Pay for the time worked'], ['full', 'Pay in full']], 'worked')), K.field('What happened', K.input('dv-why', '', { placeholder: 'For example: fire alarm, pitch flooded' }))], 1) + '</div></details>';
    K.sheet({ overline: '<span class="overline">' + esc(o.session) + ' · ' + esc(K.dd(o.date)) + '</span>', title: 'What actually happened?', meta: '<p class="k-note">Only record what changed. Everything else stays as planned.</p>',
      body: people + extra + short + '<div class="k-bar sch-gap">' + K.actBtn('It was cancelled', 'sch-cancel', { id: o.id }, { variant: 'tertiary', size: 'sm' }) + K.actBtn('It moved to another date', 'sch-resched', { id: o.id }, { variant: 'tertiary', size: 'sm' }) + '</div>',
      foot: sheetFoot('Confirm session', 'sch-changed-go', { id: o.id }) });
  };
  /* Correcting a confirmed delivery: deliberate, with a reason; the original stays in History */
  Hub.actions['sch-correct'] = function (el) {
    var o = db.getOccurrence(el.dataset.id), O = OPT(), roles = O.staffRoles.map(function (r) { return [r, K.roleName(r)]; });
    var full = (function () { var a = o.start.split(':'), b = o.end.split(':'); return ((+b[0] * 60 + +b[1]) - (+a[0] * 60 + +a[1])) / 60; })();
    function pay(c) { return db.getAllocations(function (a) { return a.occurrence === o.id && a.coach === c && !a.adjusts; })[0]; }
    var rows = o.staff.filter(function (x) { return x.attended === 'Attended' || x.attended === 'Absent'; });
    var onStaff = o.staff.map(function (x) { return x.coach; });
    var others = [['', 'Choose a coach']].concat(db.getCoaches().filter(function (c) { return c.active !== false && onStaff.indexOf(c.id) < 0; }).map(function (c) { return [c.id, c.name]; }));
    var people = '<div class="lx-stack">' + rows.map(function (x) {
      var a = pay(x.coach), rate = a ? a.rate : db.coverRate(x.coach, o).rate, units = a ? a.units : full;
      return '<div class="sch-staffedit"><div class="sch-staffedit__who">' + ui.avatar(db.coachName(x.coach), 'sm') + '<b>' + esc(db.coachName(x.coach)) + '</b><small class="k-note">Confirmed: ' + (x.attended === 'Attended' ? 'worked as ' + esc(K.roleName(x.actualRole || x.role)) : 'did not work') + '</small></div>' +
        K.form([K.field('Worked?', K.select('cr-at-' + x.coach, [['Present', 'Yes'], ['Absent', 'No']], x.attended === 'Attended' ? 'Present' : 'Absent')), K.field('Role', K.select('cr-role-' + x.coach, roles, x.actualRole || x.role)),
          K.field('Hours', K.input('cr-h-' + x.coach, units, { type: 'number' })), K.field('Rate (£ an hour)', K.input('cr-r-' + x.coach, (rate / 100).toFixed(2)))], 2) + '</div>';
    }).join('') + '</div>';
    var add = '<details class="k-details sch-dv"><summary><span><b>Someone else actually worked</b><small>For example, Joe covered, not Danny</small></span>' + I('chevron', 'icon-sm k-details__chev') + '</summary><div class="k-details__body">' +
      K.form([K.field('Coach', K.select('cr-add', others, '')), K.field('Role', K.select('cr-add-role', roles, 'Coach')), K.field('Covering for', K.select('cr-add-for', [['', 'Nobody: an extra coach']].concat(rows.map(function (x) { return [x.coach, db.coachName(x.coach)]; })), '')),
        K.field('Hours', K.input('cr-add-h', full, { type: 'number' })), K.field('Rate (£ an hour)', K.input('cr-add-r', '', { placeholder: 'Their normal rate if left blank' }))], 1) + '</div></details>';
    K.sheet({ overline: '<span class="overline">' + esc(o.session) + ' · ' + esc(K.dd(o.date)) + '</span>', title: 'Correct confirmed delivery', meta: '<p class="k-note">Use this only for a genuine mistake. The original confirmation stays in History, and pay already sent is adjusted, never rewritten.</p>',
      body: people + add + K.form([K.field('Reason for the correction', K.textarea('cr-why', '', 'For example: Joe covered, not Danny; confirmed in error'), null, true)], 1), foot: sheetFoot('Save correction', 'sch-correct-go', { id: o.id }) });
  };
  Hub.actions['sch-correct-go'] = function (el) {
    var o = db.getOccurrence(el.dataset.id), at = K.now(), why = K.val('cr-why').trim();
    if (!why) { Hub.toast('Add a reason for the correction'); return; }
    var bad = false, num = function (v) { var n = parseFloat(String(v).replace(/[£,\s]/g, '')); if (isNaN(n) || n < 0) bad = true; return n; };
    var rows = o.staff.filter(function (x) { return x.attended === 'Attended' || x.attended === 'Absent'; }).map(function (x) {
      return { coach: x.coach, attended: K.val('cr-at-' + x.coach), role: K.val('cr-role-' + x.coach), units: num(K.val('cr-h-' + x.coach)), rate: Math.round(num(K.val('cr-r-' + x.coach)) * 100) };
    });
    var add = K.val('cr-add');
    if (add) { var rr = K.val('cr-add-r').trim(); rows.push({ coach: add, attended: 'Present', role: K.val('cr-add-role') || 'Coach', covers: K.val('cr-add-for') || null, units: num(K.val('cr-add-h')), rate: rr ? Math.round(num(rr) * 100) : db.coverRate(add, o).rate }); }
    if (bad) { Hub.toast('Check the hours and rates'); return; }
    Hub.closeSheet(true);
    var res = db.correctDelivery(o.id, rows, why, who(), at);
    Hub.mutate(null, res ? 'Delivery corrected. The original is kept in History' : 'Nothing changed', res ? occLog(o, 'Delivery corrected: ' + why, at, { finance: true }) : null);
  };
  Hub.actions['sch-changed-go'] = function (el) {
    var o = db.getOccurrence(el.dataset.id), at = K.now();
    var people = o.staff.filter(function (x) { return !(x.unavailable && x.covering); }).map(function (x) { return { coach: x.coach, attended: K.val('dv-at-' + x.coach), role: K.val('dv-role-' + x.coach) }; });
    var ex = K.val('dv-extra'), extras = ex ? [{ coach: ex, role: K.val('dv-extra-role') || 'Coach', covering: K.val('dv-extra-for') || null }] : [];
    var end = K.val('dv-end'), partial = null;
    if (end) {
      if (end <= o.start || end >= o.end) { Hub.toast('Ended at must be between ' + o.start + ' and ' + o.end); return; }
      partial = { endedAt: end, payFull: K.val('dv-pay') === 'full', reason: K.val('dv-why').trim() };
    }
    if (!people.some(function (p) { return p.attended === 'Present'; }) && !extras.length) { Hub.toast('Nobody coached? Record it as cancelled instead'); return; }
    closeThen(function () { db.confirmDelivery(o.id, { people: people, extras: extras, partial: partial }, who(), at); }, partial ? 'Confirmed as partially delivered' : 'Confirmed with changes', occLog(o, 'Delivery confirmed with changes', at, { finance: true }));
  };
  Hub.actions['sch-cancel'] = function (el) {
    var o = db.getOccurrence(el.dataset.id);
    K.sheet({ title: 'Cancel this session', meta: '<p class="k-note">' + esc(o.session) + ' · ' + esc(when(o)) + '</p>', body: ui.notice('warn', o.players + ' expected players are affected', 'After cancelling, decide what families get back and whether the venue and coaches are paid.') + K.form([K.field('Reason', K.textarea('reason', '', 'For example: waterlogged pitch'), 'Shown to families and coaches.', true)], 1), foot: sheetFoot('Cancel session', 'sch-cancel-go', { id: o.id }, { danger: true }) });
  };
  Hub.actions['sch-cancel-go'] = function (el) {
    var o = db.getOccurrence(el.dataset.id), r = K.val('reason').trim(), at = K.now(); if (!r) { Hub.toast('Add a reason first'); return; }
    closeThen(function () { db.cancelOccurrence(o.id, r, who(), at); }, 'Session cancelled', occLog(o, 'Session cancelled', at, { before: 'Scheduled', after: 'Cancelled' }));
  };
  Hub.actions['sch-postpone'] = function (el) {
    var o = db.getOccurrence(el.dataset.id);
    K.sheet({ title: 'Postpone this session', meta: '<p class="k-note">The new date can be set later.</p>', body: K.form([K.field('Reason', K.textarea('reason', '', 'Why is it postponed?'), '', true)], 1), foot: sheetFoot('Postpone', 'sch-postpone-go', { id: o.id }) });
  };
  Hub.actions['sch-postpone-go'] = function (el) {
    var o = db.getOccurrence(el.dataset.id), r = K.val('reason').trim(), at = K.now(); if (!r) { Hub.toast('Add a reason first'); return; }
    closeThen(function () { db.postponeOccurrence(o.id, r, who(), at); }, 'Session postponed', occLog(o, 'Session postponed', at, { before: 'Scheduled', after: 'Postponed' }));
  };
  Hub.actions['sch-resched'] = function (el) {
    var o = db.getOccurrence(el.dataset.id);
    var venues = db.getVenues().filter(function (v) { return v.active; }).map(function (v) { return [v.key, v.name]; });
    K.sheet({ title: 'Reschedule', meta: '<p class="k-note">Creates a replacement session and links the two.</p>', body: K.form([
      K.field('New date', K.input('rDate', K.addDays(o.date > K.today ? o.date : K.today, 1), { type: 'date' })), K.field('Venue', K.select('rVenue', venues, o.venue)),
      K.field('Start', K.input('rStart', o.start, { type: 'time' })), K.field('End', K.input('rEnd', o.end, { type: 'time' })),
      K.field('Reason', K.textarea('reason', o.status === 'Postponed' ? o.cancelReason : '', 'Why is it moving?'), '', true)]), foot: sheetFoot('Reschedule', 'sch-resched-go', { id: o.id }) });
  };
  Hub.actions['sch-resched-go'] = function (el) {
    var o = db.getOccurrence(el.dataset.id), at = K.now(), to = { date: K.val('rDate'), start: K.val('rStart'), end: K.val('rEnd'), venue: K.val('rVenue') }, r = K.val('reason').trim();
    if (!to.date || !r) { Hub.toast('Choose a date and add a reason'); return; }
    if (to.start >= to.end) { Hub.toast('The end time must be after the start time'); return; }
    var rep = closeThen(function () { return db.rescheduleOccurrence(o.id, to, r, who(), at); }, 'Rescheduled · replacement created', occLog(o, 'Session rescheduled to ' + K.dd(to.date), at, { before: o.date, after: to.date }));
    location.hash = 'mgmt-occurrence/' + rep.id;
  };
  /* ===================================================== CHANGE COACH
     One flow for every starting point when Management already knows who should coach:
     a dated session, staffing banners, Needs attention, the weekly session page, Edit session
     and the coach profile. Finding someone unknown stays the separate Find cover journey. */
  var CS = null;
  Hub.actions['sch-staff'] = function (el) { Hub.actions['sch-coach'](el); };
  Hub.actions['sch-coach'] = function (el) {
    var d = el.dataset, o = d.id ? db.getOccurrence(d.id) : null, s = db.getSession(o ? o.sessionId : d.session);
    var dates = db.venueDates(s.id);
    if (!dates.length) { Hub.toast('There are no upcoming dates of ' + s.name + ' to change'); return; }
    var anchor = o && db.venueChangeable(o) ? o : dates[0];
    if (o && !db.venueChangeable(o)) { Hub.toast('This date has started or run, so its coaches can’t be changed here'); return; }
    var scope = d.scope || (o ? 'one' : 'onwards');
    var people = o ? o.staff.filter(function (x) { return !(x.cover && x.unavailable); }).map(function (x) { return x.coach; }) : db.regularStaffOn(s, anchor.date).map(function (x) { return x.coach; });
    var out = d.coach !== undefined ? d.coach : d.mode === 'add' ? '' : (people[0] || '');
    if (d.mode === 'lead') { var w = o ? db.workingStaff(o) : []; out = (w.filter(function (x) { return (x.actualRole || x.role) === 'Coach'; })[0] || w[0] || {}).coach || ''; }
    CS = { session: s.id, anchor: anchor.id, fromDate: !!o };
    function roleOf(c) { var x = o ? o.staff.filter(function (y) { return y.coach === c; })[0] : db.regularStaffOn(s, anchor.date).filter(function (y) { return y.coach === c; })[0]; return x ? (x.actualRole || x.role) : ''; }
    var who = [['', 'Nobody: add a coach']].concat(people.map(function (c) { var x = o && o.staff.filter(function (y) { return y.coach === c; })[0]; return [c, db.coachName(c) + ' (' + K.roleName(roleOf(c)) + ')' + (x && x.unavailable ? ' · away' : x && x.cover ? ' · covering' : '')]; }));
    function radio(name, val, title, sub, on) { return '<label class="sch-scope__opt"><input type="radio" name="' + name + '" value="' + val + '"' + (on ? ' checked' : '') + '><span><b>' + title + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span></label>'; }
    var roleNow = out ? roleOf(out) : (o && !db.workingStaff(o).some(function (x) { return (x.actualRole || x.role) === 'Lead'; }) ? 'Lead' : 'Coach');
    if (d.mode === 'lead') roleNow = 'Lead';
    var dateList = '<div class="sch-vdates" data-cs-show="dates">' + dates.map(function (x) { return '<label class="sch-vdate"><input type="checkbox" name="cDate" value="' + x.id + '"' + (x.id === anchor.id && o ? ' checked' : '') + '><span><b>' + esc(K.dd(x.date)) + ', ' + x.start + '</b><small data-cs-note="' + x.id + '"></small></span></label>'; }).join('') +
      '<div class="sch-vrange">' + K.field('Tick from', K.select('cFrom', dates.map(function (x) { return [x.date, K.dd(x.date)]; }), anchor.date)) + K.field('to', K.select('cTo', dates.map(function (x) { return [x.date, K.dd(x.date)]; }), anchor.date)) + K.actBtn('Tick these dates', 'sch-coach-range', {}, { size: 'sm', variant: 'secondary' }) + '</div></div>';
    K.sheet({ overline: '<span class="overline">' + esc(s.name) + (o ? ' · ' + esc(K.dd(o.date)) + ', ' + o.start : '') + '</span>', title: d.mode === 'add' ? 'Add a coach' : 'Change coach',
      body: '<div data-cs>' + K.form([K.field('Who is changing?', K.select('cOut', who, out)), K.field('Who should coach instead?', '<select class="select" name="cIn" data-cs-in data-pre="' + esc(d.mode === 'lead' ? 'same' : '') + '"></select>', '<span data-cs-fit></span>')], 1) +
        '<p class="sch-vq">What role should they have?</p><div class="sch-scope sch-scope--row">' + radio('cRole', 'Lead', 'Lead Coach', '', roleNow === 'Lead') + radio('cRole', 'Coach', 'Coach', '', roleNow === 'Coach' || !roleNow) + radio('cRole', 'Learning', 'Learning Coach', '', roleNow === 'Learning') + '</div>' +
        '<p class="sch-vq">How long should this change apply?</p><div class="sch-scope">' +
        radio('cScope', 'one', 'This session only', 'Changes ' + esc(K.dd(anchor.date)) + ' only. The regular coaches stay the same.', scope === 'one') + radio('cScope', 'dates', 'Selected dates', 'Choose the individual dates or a date range affected.', scope === 'dates') + radio('cScope', 'onwards', 'From this date onwards', 'Changes the regular coaches for future sessions from the date you choose.', scope === 'onwards') + '</div>' +
        dateList + '<div data-cs-show="onwards">' + K.field('Starting from', K.select('cStart', dates.map(function (x) { return [x.date, K.dd(x.date)]; }), anchor.date), 'Earlier dates stay as they are.') + '</div>' +
        K.form([K.field('Why?', K.input('cWhy', '', { placeholder: 'For example: Charlie moving to Saturdays' }), null, true)], 1) +
        '<section class="sch-vcheck" aria-live="polite"><h3>Check before saving</h3><div id="cSummary"></div></section></div>',
      foot: sheetFoot('Save change', 'sch-coach-go', {}) });
    fillIncoming(); coachSummary();
  };
  /* The "instead" list: blocked coaches are shown but can't be picked; warnings stay visible */
  function fillIncoming() {
    var sel = document.querySelector('#sheet [data-cs-in]'); if (!sel || !CS) return;
    var o = db.getOccurrence(CS.anchor), out = K.val('cOut'), role = (document.querySelector('#sheet [name=cRole]:checked') || {}).value || 'Coach', keep = sel.value || sel.getAttribute('data-pre') || '';
    var on = o.staff.filter(function (x) { return !x.unavailable; }).map(function (x) { return x.coach; });
    var opts = (out ? [['same', db.coachName(out).split(' ')[0] + ': change role only'], ['none', 'Nobody: remove ' + db.coachName(out).split(' ')[0]]] : []).map(function (x) { return '<option value="' + x[0] + '">' + esc(x[1]) + '</option>'; });
    opts.unshift('<option value="">Choose a coach</option>');
    db.getCoaches().filter(function (c) { return c.id !== out && on.indexOf(c.id) < 0; }).forEach(function (c) {
      var f = db.coachFit(c.id, o, role);
      opts.push('<option value="' + c.id + '"' + (f.block ? ' disabled' : '') + '>' + esc(c.name) + (f.block ? ' · ' + esc(f.block) : f.warn ? ' · ' + esc(f.warn) : ' · free') + '</option>');
    });
    sel.innerHTML = opts.join(''); if (keep && sel.querySelector('option[value="' + keep + '"]:not([disabled])')) sel.value = keep;
    sel.removeAttribute('data-pre');
  }
  function readCoach() {
    var q = function (x) { return document.querySelector('#sheet ' + x); };
    var scope = (q('[name=cScope]:checked') || {}).value || 'one';
    var spec = { session: CS.session, out: K.val('cOut') || null, to: K.val('cIn'), role: (q('[name=cRole]:checked') || {}).value || 'Coach', scope: scope, reason: K.val('cWhy').trim() };
    if (scope === 'one') spec.dates = [CS.anchor];
    if (scope === 'dates') spec.dates = Array.prototype.map.call(document.querySelectorAll('#sheet [name=cDate]:checked'), function (x) { return x.value; });
    if (scope === 'onwards') spec.from = K.val('cStart');
    return spec;
  }
  function coachSummary() {
    var box = document.getElementById('cSummary'); if (!box || !CS) return;
    var spec = readCoach(), q = function (x) { return document.querySelector('#sheet ' + x); };
    Array.prototype.forEach.call(document.querySelectorAll('#sheet [data-cs-show]'), function (x) { x.hidden = x.getAttribute('data-cs-show') !== spec.scope; });
    Array.prototype.forEach.call(document.querySelectorAll('#sheet [data-cs-note]'), function (n) { var o = db.getOccurrence(n.getAttribute('data-cs-note')); n.textContent = spec.out ? (o.staff.some(function (x) { return x.coach === spec.out; }) ? db.staffArrangement(o, spec.out) || '' : db.coachName(spec.out).split(' ')[0] + ' isn’t on this date') : ''; });
    /* the role picker can't make a Learning Coach the Lead */
    var lc = spec.to && spec.to !== 'none' ? db.getCoach(spec.to === 'same' ? spec.out : spec.to) : null, lead = q('[name=cRole][value=Lead]');
    if (lead) { lead.disabled = !!(lc && lc.type === 'learning'); if (lead.disabled && lead.checked) { q('[name=cRole][value=Learning]').checked = true; spec.role = 'Learning'; } }
    var fit = q('[data-cs-fit]'); if (fit) { var o0 = db.getOccurrence(CS.anchor), f = spec.to && spec.to !== 'same' && spec.to !== 'none' ? db.coachFit(spec.to, o0, spec.role) : null; fit.innerHTML = f && f.warn ? '<span class="co-flag">' + esc(f.warn) + ': they can be chosen, and the document issue stays in Needs attention.</span>' : ''; }
    if (!spec.to) { box.innerHTML = '<p class="k-note">Choose who should coach instead.</p>'; return; }
    var plan = db.planStaffChange(spec), s = plan.session, n = plan.targets.length, list = function (a) { return a.map(function (x) { return K.dm((x.o || x).date); }).join(', '); };
    var outN = spec.out ? db.coachName(spec.out) : '', inN = plan.incoming && spec.to !== 'same' ? db.coachName(plan.incoming) : '';
    var when = spec.scope === 'one' ? (n ? esc(K.dd(plan.targets[0].date)) + ' only' : 'Nothing to change on this date') : spec.scope === 'dates' ? (n ? n + ' date' + (n === 1 ? '' : 's') + ': ' + esc(list(plan.targets)) : 'Tick at least one date') : 'From ' + esc(K.dd(spec.from)) + ': ' + n + ' upcoming date' + (n === 1 ? '' : 's') + ', and any added later';
    var rows = [['Session', esc(s.name)]];
    if (spec.to === 'same') rows.push(['Role change', esc(outN) + ' becomes ' + K.roleName(spec.role)]);
    else { if (spec.out) rows.push([spec.to === 'none' ? 'Removing' : 'Replacing', esc(outN)]); if (inN) rows.push(['With', esc(inN) + ', as ' + K.roleName(spec.role)]); }
    rows.push(['Dates', when]);
    if (plan.replaced.length) rows.push(['Replacing', plan.replaced.map(function (x) { return 'This will replace the existing arrangement for ' + esc(K.dd(x.o.date)) + ' (' + esc(x.why) + ').'; }).join('<br>')]);
    rows.push(['Staying as they are', plan.kept.map(function (x) { return esc(K.dd(x.o.date)) + ': ' + esc(x.why) + ', kept'; }).concat(plan.absentFrom.length && spec.scope !== 'onwards' ? [esc(list(plan.absentFrom)) + ': ' + esc(outN.split(' ')[0]) + ' isn’t on ' + (plan.absentFrom.length === 1 ? 'that date' : 'those dates')] : []).concat(['Past and confirmed dates aren’t changed', 'The regular coaches ' + (spec.scope === 'onwards' ? 'change from ' + esc(K.dm(spec.from)) + '; ' + (outN && spec.to !== 'same' ? esc(outN.split(' ')[0]) + '’s earlier period is kept in history' : 'earlier dates keep the old set-up') : 'don’t change')]).join('<br>')]);
    if (K.fin() !== 'none' && spec.to !== 'same' && n) rows.push(['Expected pay', (plan.payOut ? '−' + K.money(plan.payOut) + ' ' + esc(outN.split(' ')[0]) : '') + (plan.payOut && plan.payIn ? ', ' : '') + (plan.payIn ? '+' + K.money(plan.payIn) + ' ' + esc(inN.split(' ')[0]) + ' at their normal rate' : '') + (!plan.payOut && !plan.payIn ? 'No change' : '')]);
    if (plan.cover.length) rows.push(['Cover', 'Sorts the open cover for ' + esc(list(plan.cover)) + '; coaches offered it are told it’s been filled by Management']);
    rows.push(['Who is told', esc(plan.told.map(function (c) { return db.coachName(c).split(' ')[0]; }).join(' and ') || 'Nobody') + '. Families see the change in the Hub.']);
    var warn = (plan.blocked.length ? ui.notice('danger', esc(inN || outN) + ' can’t take ' + esc(list(plan.blocked)), esc(plan.blocked[0].why) + '. Choose someone else, or leave ' + (plan.blocked.length === 1 ? 'that date' : 'those dates') + ' out.') : '') +
      (plan.warned.length ? ui.notice('warn', esc(inN) + ': ' + esc(plan.warned[0].why), 'They can be chosen. The document issue stays in Needs attention until it’s sorted.') : '') +
      (plan.gaps.length ? ui.notice('warn', 'This leaves ' + esc(plan.gaps[0].why) + ' on ' + esc(list(plan.gaps)), 'You can still save; Needs attention will show it until it’s fixed.') : '');
    box.innerHTML = K.kv(rows) + warn;
  }
  document.addEventListener('change', function (e) {
    if (!(e.target.closest && e.target.closest('[data-cs]'))) return;
    if (e.target.name === 'cOut' || e.target.name === 'cRole') fillIncoming();
    coachSummary();
  });
  Hub.actions['sch-coach-range'] = function () {
    var f = K.val('cFrom'), t = K.val('cTo'), out = K.val('cOut'); if (t < f) { var x = f; f = t; t = x; }
    Array.prototype.forEach.call(document.querySelectorAll('#sheet [name=cDate]'), function (c) { var o = db.getOccurrence(c.value); if (!out || !db.staffArrangement(o, out)) c.checked = o.date >= f && o.date <= t; });
    coachSummary();
  };
  Hub.actions['sch-coach-go'] = function () {
    var spec = readCoach(); if (!spec.to) { Hub.toast('Choose who should coach instead'); return; }
    if (spec.to === 'same' && !spec.out) { Hub.toast('Choose who is changing'); return; }
    var plan = db.planStaffChange(spec), at = K.now();
    if (!plan.targets.length) { Hub.toast(spec.scope === 'dates' ? 'Tick at least one date' : 'Nothing to change on these dates'); return; }
    if (plan.blocked.length) { Hub.toast((plan.incoming ? db.coachName(plan.incoming) : 'They') + ' can’t take ' + plan.blocked.map(function (x) { return K.dm(x.o.date); }).join(', ') + ': ' + plan.blocked[0].why); return; }
    if (!spec.reason) { Hub.toast('Say why the coach is changing'); return; }
    var n = plan.targets.length, s = plan.session;
    var what = spec.to === 'same' ? db.coachName(spec.out) + ' is now ' + K.roleName(spec.role) : spec.to === 'none' ? db.coachName(spec.out) + ' removed' : (spec.out ? db.coachName(plan.incoming) + ' replaces ' + db.coachName(spec.out) : db.coachName(plan.incoming) + ' added');
    var msg = what + (spec.scope === 'onwards' ? ' from ' + K.dm(spec.from) + ' (' + n + ' date' + (n === 1 ? '' : 's') + ')' : n === 1 ? ' for ' + K.dd(plan.targets[0].date) : ' for ' + n + ' dates');
    Hub.closeSheet(true);
    Hub.mutate(function () { db.changeStaff(spec, who(), at); }, msg, { area: 'Schedule', summary: 'Coach change on ' + s.name + ': ' + what + ' (' + (spec.scope === 'onwards' ? 'from ' + K.dm(spec.from) : plan.targets.map(function (o) { return K.dm(o.date); }).join(', ')) + '): ' + spec.reason, entity: s.id, at: at });
  };
  Hub.actions['sch-docs'] = function (el) { Hub.wsTabs['coach-prof'] = 'documents'; location.hash = 'mgmt-coach/' + el.dataset.coach; };

  /* ===================================================== CHANGE VENUE
     One flow for every starting point: a dated session, a no-venue or venue-closed banner,
     Needs attention, the venue page (through the date) and the weekly session page. */
  var VS = null;
  Hub.actions['sch-venue'] = function (el) {
    var o = el.dataset.id ? db.getOccurrence(el.dataset.id) : null, s = db.getSession(o ? o.sessionId : el.dataset.session);
    var dates = db.venueDates(s.id);
    if (!dates.length) { Hub.toast('There are no upcoming dates of ' + s.name + ' to change'); return; }
    var anchor = o && db.venueChangeable(o) ? o : dates[0];
    var scope = el.dataset.scope || (o ? 'one' : 'onwards'), current = o ? o.venue : s.venue, usual = db.usualVenueOn(s, anchor.date);
    VS = { session: s.id, anchor: anchor.id };
    var cur = '<div class="sch-vcur"><span class="k-note">Current venue</span><b>' + (current ? esc(db.venueName(current)) : 'None yet') + '</b>' +
      (o && o.venueOverride ? '<small class="k-note">For this date only. Usual venue: ' + esc(db.venueName(usual)) + '</small>' : !o && (s.venuePeriods || []).some(function (p) { return p.from > K.today; }) ? '<small class="k-note">Already changing: ' + (s.venuePeriods || []).filter(function (p) { return p.from > K.today; }).map(function (p) { return esc(db.venueName(p.venue)) + ' from ' + K.dm(p.from); }).join(', ') + '</small>' : '') + '</div>';
    var opts = [['', 'Choose a venue']].concat(db.getVenues().filter(function (v) { return v.active && v.key !== current; }).map(function (v) { var c = db.venueClosure(v.key, anchor.date); return [v.key, v.name + (c ? ' · closed ' + K.dm(anchor.date) : '')]; }));
    function radio(val, title, sub) { return '<label class="sch-scope__opt"><input type="radio" name="vScope" value="' + val + '"' + (scope === val ? ' checked' : '') + '><span><b>' + title + '</b><small>' + sub + '</small></span></label>'; }
    var dateList = '<div class="sch-vdates" data-vs-show="dates">' + dates.map(function (d) {
      var own = d.venueOverride, shut = db.venueClosure(d.venue, d.date);
      return '<label class="sch-vdate"><input type="checkbox" name="vDate" value="' + d.id + '"' + (d.id === anchor.id && o && !own ? ' checked' : '') + '><span><b>' + esc(K.dd(d.date)) + ', ' + d.start + '</b>' +
        (own ? '<small>Currently ' + esc(db.venueName(d.venue)) + ' for this date only.</small>' : shut ? '<small class="text-danger">' + esc(db.venueName(d.venue)) + ' is closed this day</small>' : '<small>' + esc(db.venueName(d.venue)) + '</small>') + '</span></label>';
    }).join('') + '<div class="sch-vrange">' + K.field('Tick from', K.select('vFrom', dates.map(function (d) { return [d.date, K.dd(d.date)]; }), anchor.date)) + K.field('to', K.select('vTo', dates.map(function (d) { return [d.date, K.dd(d.date)]; }), anchor.date)) + K.actBtn('Tick these dates', 'sch-venue-range', {}, { size: 'sm', variant: 'secondary' }) + '</div></div>';
    var onwards = '<div data-vs-show="onwards">' + K.field('Starting from', K.select('vStart', dates.map(function (d) { return [d.date, K.dd(d.date)]; }), anchor.date), 'Earlier dates stay as they are.') + '</div>';
    K.sheet({ overline: '<span class="overline">' + esc(s.name) + (o ? ' · ' + esc(K.dd(o.date)) + ', ' + o.start : '') + '</span>', title: 'Change venue',
      body: '<div data-vs>' + cur + K.form([K.field('New venue', K.select('vVenue', opts, ''))], 1) +
        '<p class="sch-vq">How long should this change apply?</p><div class="sch-scope">' +
        radio('one', 'This session only', 'Changes ' + esc(K.dd(anchor.date)) + ' only. The usual venue stays ' + esc(usual ? db.venueName(usual) : 'as it is') + '.') + radio('dates', 'Selected dates', 'Choose the individual dates or a date range affected.') + radio('onwards', 'From this date onwards', 'Changes the usual venue for future sessions from the date you choose.') + '</div>' +
        dateList + onwards + K.form([K.field('Why?', K.input('vWhy', '', { placeholder: 'For example: hall floor resurfacing' }), null, true)], 1) +
        '<label class="sch-vmsg"><input type="checkbox" name="vMsg"><span><b>Send a message to families</b><small>Optional. Families always see the new venue in the Hub; coaches are told automatically.</small></span></label>' +
        '<section class="sch-vcheck" aria-live="polite"><h3>Check before saving</h3><div id="vSummary"></div></section></div>',
      foot: sheetFoot('Save change', 'sch-venue-go', {}) });
    venueSummary();
  };
  function readVenue() {
    var q = function (sel) { return document.querySelector('#sheet ' + sel); };
    var scope = (q('[name=vScope]:checked') || {}).value || 'one';
    var spec = { session: VS.session, venue: K.val('vVenue'), scope: scope, reason: K.val('vWhy').trim(), messageFamilies: !!(q('[name=vMsg]') && q('[name=vMsg]').checked) };
    if (scope === 'one') spec.dates = [VS.anchor];
    if (scope === 'dates') spec.dates = Array.prototype.map.call(document.querySelectorAll('#sheet [name=vDate]:checked'), function (x) { return x.value; });
    if (scope === 'onwards') spec.from = K.val('vStart');
    return spec;
  }
  function venueSummary() {
    var box = document.getElementById('vSummary'); if (!box || !VS) return;
    var spec = readVenue(), plan = db.planVenueChange(spec), s = plan.session, name = spec.venue ? db.venueName(spec.venue) : '';
    Array.prototype.forEach.call(document.querySelectorAll('#sheet [data-vs-show]'), function (x) { x.hidden = x.getAttribute('data-vs-show') !== spec.scope; });
    var n = plan.targets.length, list = function (a) { return a.map(function (o) { return K.dm(o.date); }).join(', '); };
    var when = spec.scope === 'one' ? (n ? esc(K.dd(plan.targets[0].date)) + ' only' : 'Nothing to change on this date')
      : spec.scope === 'dates' ? (n ? n + ' date' + (n === 1 ? '' : 's') + ': ' + esc(list(plan.targets)) : 'Tick at least one date')
      : 'From ' + esc(K.dd(spec.from)) + ': ' + n + ' upcoming date' + (n === 1 ? '' : 's') + ', and any added later';
    var keep = plan.kept.map(function (o) { return esc(K.dd(o.date)) + ' already has its own venue (' + esc(db.venueName(o.venue)) + ') and keeps it'; }).concat(['Past dates aren’t changed']);
    var coaches = Object.keys(plan.coaches);
    var rows = [['Session', esc(s.name)], ['New venue', name ? '<b>' + esc(name) + '</b>' : '<span class="c-mute">Choose a venue</span>'], ['Dates', when]];
    if (plan.replaced.length) rows.push(['Replacing', plan.replaced.map(function (o) { return 'This will replace the existing venue change for ' + esc(K.dd(o.date)) + '.'; }).join('<br>')]);
    rows.push(['Staying as they are', keep.join('<br>')], ['Coaches', 'Unchanged' + (coaches.length ? '. ' + esc(coaches.map(function (c) { return db.coachName(c).split(' ')[0]; }).join(', ')) + (coaches.length === 1 ? ' is' : ' are') + ' told automatically' : '')],
      ['Players & bookings', 'Unchanged. Families see the new venue in the Hub' + (spec.messageFamilies ? ' and get a message' : '')]);
    if (K.fin() !== 'none' && spec.venue && n) { var from = db.getVenue(plan.targets[0].venue), to = db.getVenue(spec.venue); if (from && to && from.costPerHour !== to.costPerHour) rows.push(['Venue hire', K.money(from.costPerHour || 0) + ' → ' + K.money(to.costPerHour || 0) + ' an hour for these dates']); }
    var warn = (plan.closed.length ? ui.notice('danger', esc(name) + ' is closed on ' + esc(list(plan.closed)), 'Choose another venue, or leave ' + (plan.closed.length === 1 ? 'that date' : 'those dates') + ' out.') : '') +
      plan.clash.map(function (c) { return ui.notice('info', esc(c.other.session) + ' is also at ' + esc(name) + ' on ' + esc(K.dm(c.o.date)), c.other.start + '–' + c.other.end + '. Check there is room for both.'); }).join('');
    box.innerHTML = K.kv(rows) + warn;
  }
  document.addEventListener('change', function (e) { if (e.target.closest && e.target.closest('[data-vs]')) venueSummary(); });
  document.addEventListener('input', function (e) { if (e.target.closest && e.target.closest('[data-vs]') && e.target.name === 'vWhy') return; });
  Hub.actions['sch-venue-range'] = function () {
    var f = K.val('vFrom'), t = K.val('vTo'); if (t < f) { var x = f; f = t; t = x; }
    Array.prototype.forEach.call(document.querySelectorAll('#sheet [name=vDate]'), function (c) { var o = db.getOccurrence(c.value); if (!o.venueOverride) c.checked = o.date >= f && o.date <= t; });
    venueSummary();
  };
  Hub.actions['sch-venue-go'] = function () {
    var spec = readVenue(), plan = db.planVenueChange(spec), s = plan.session, at = K.now();
    if (!spec.venue) { Hub.toast('Choose the new venue'); return; }
    if (!plan.targets.length && spec.scope !== 'onwards') { Hub.toast(spec.scope === 'dates' ? 'Tick at least one date' : 'That date already uses this venue'); return; }
    if (plan.closed.length) { Hub.toast(db.venueName(spec.venue) + ' is closed on ' + plan.closed.map(function (o) { return K.dm(o.date); }).join(', ')); return; }
    if (!spec.reason) { Hub.toast('Say why the venue is changing'); return; }
    var name = db.venueName(spec.venue), n = plan.targets.length;
    var msg = spec.scope === 'onwards' ? 'Usual venue changed to ' + name + ' from ' + K.dm(spec.from) + ' (' + n + ' date' + (n === 1 ? '' : 's') + ')' : 'Venue changed to ' + name + (n === 1 ? ' for ' + K.dd(plan.targets[0].date) : ' for ' + n + ' dates');
    Hub.closeSheet(true);
    Hub.mutate(function () { db.changeVenue(spec, who(), at); }, msg, { area: 'Schedule', summary: 'Venue changed: ' + s.name + ' → ' + name + ' (' + (spec.scope === 'onwards' ? 'from ' + K.dm(spec.from) : plan.targets.map(function (o) { return K.dm(o.date); }).join(', ')) + '): ' + spec.reason, entity: s.id, at: at, after: name });
  };
  Hub.actions['sch-capacity'] = function (el) {
    var o = db.getOccurrence(el.dataset.id);
    K.sheet({ title: 'Change capacity for this session', body: K.form([K.field('Capacity', K.input('cap', o.capacity, { type: 'number' })), K.field('Reason', K.textarea('reason', '', 'For example: two trial players joining'), '', true)], 1), foot: sheetFoot('Save capacity', 'sch-capacity-go', { id: o.id }) });
  };
  Hub.actions['sch-capacity-go'] = function (el) {
    var o = db.getOccurrence(el.dataset.id), c = +K.val('cap'), r = K.val('reason').trim(), at = K.now(), was = o.capacity;
    if (!(c > 0)) { Hub.toast('Capacity must be more than 0'); return; } if (!r) { Hub.toast('Add a reason first'); return; }
    closeThen(function () { db.setOccurrenceCapacity(o.id, c, r, who(), at); }, 'Capacity changed', occLog(o, 'Different capacity', at, { before: String(was), after: String(c) }));
  };
  Hub.actions['sch-notes'] = function (el) {
    var o = db.getOccurrence(el.dataset.id);
    K.sheet({ title: 'Operational notes', meta: '<p class="k-note">Visible to coaches on this session.</p>', body: K.form([K.field('Notes', K.textarea('notes', o.notes, 'Parking, kit, access or anything coaches should know'), '', true)], 1), foot: sheetFoot('Save notes', 'sch-notes-go', { id: o.id }) });
  };
  Hub.actions['sch-notes-go'] = function (el) { var o = db.getOccurrence(el.dataset.id), n = K.val('notes'), at = K.now(); closeThen(function () { db.setOccurrenceNotes(o.id, n, who(), at); }, 'Notes saved', occLog(o, 'Operational notes updated', at)); };
  /* ===================================================== CANCELLATION OUTCOME */
  Hub.screens['mgmt-occurrence-outcome'] = function (ctx) {
    var o = db.getOccurrence(ctx.param);
    var h = K.head({ back: o ? ['mgmt-occurrence/' + o.id, o.session + ', ' + K.dm(o.date)] : ['mgmt-occurrences', 'Session dates'], eyebrow: 'After a cancellation or change', title: o ? 'Refunds and credits' : 'Session not found', sub: o ? esc(o.session) + ' · ' + esc(when(o)) + ' · ' + K.status(o.status) : '' });
    var g = K.guard(ctx, h, { empty: ['finance', 'No outcome yet', 'Outcomes appear once a session is cancelled, postponed or rescheduled.'] }); if (g) return g;
    if (!o) return K.page(h, ui.notice('warn', 'This session could not be found', ''));
    Hub.crumbTail = K.dd(o.date);
    if (CHANGED.indexOf(o.status) < 0) return K.page(h, ui.notice('info', 'No outcome needed', 'Financial outcomes are recorded for cancelled, postponed or rescheduled sessions. This one is ' + o.status.toLowerCase() + '.', { action: K.goBtn('Back to session', 'mgmt-occurrence/' + o.id, { size: 'sm' }) }));
    if (!moneyOk()) return K.page(h, ui.notice('info', 'Finance access needed', 'Ask a director for finance access to view or record cancellation outcomes.'));
    var s = db.getSession(o.sessionId), affected = db.getAffectedPlayers(o.id).map(db.getPlayer).filter(Boolean);
    var fams = {}; affected.forEach(function (p) { fams[p.family] = (fams[p.family] || 0) + 1; });
    var famList = '<div class="sch-fams">' + Object.keys(fams).map(function (f) { var fam = db.getFamily(f); return '<a class="sch-fam" href="#mgmt-family/' + f + '">' + ui.avatar(fam.name, 'xs') + esc(fam.name) + (fams[f] > 1 ? ' ×' + fams[f] : '') + '</a>'; }).join('') + '</div>';
    if (o.outcome) {
      var oc = o.outcome, credits = db.getFamilyCredits().filter(function (c) { return c.occurrence === o.id; }), refunds = db.getRefunds().filter(function (r) { return r.occurrence === o.id; });
      var block = function (t, x) { return K.card({ title: t, right: K.status(x.type === 'None' ? 'None' : x.type), body: K.kv([['Amount', x.type === 'None' ? '—' : K.money(x.amount) + (t === 'Parents' ? ' per player' : '')], ['Reason', esc(x.reason || '—')]]) }); };
      var issued = K.table({ cols: 'minmax(0, 1.4fr) minmax(0, 1fr) 100px', head: ['Family', { label: 'Type', cls: 'wide' }, { label: 'Amount', cls: 'c-num' }], rows: credits.map(function (c) { return { cells: [K.cell(esc(db.getFamily(c.family).name), c.player ? esc(db.getPlayer(c.player).name) : ''), { cls: 'wide', html: 'Family credit ' + K.id(c.id) }, { cls: 'c-num', html: K.money(c.amount) }], route: 'mgmt-family/' + c.family }; })
        .concat(refunds.map(function (r) { return { cells: [K.cell(esc(db.getFamily(r.family).name), esc(r.state || '')), { cls: 'wide', html: 'Refund ' + K.id(r.id) }, { cls: 'c-num', html: K.money(r.amount) }], route: 'mgmt-family/' + r.family }; })), empty: 'No family credits or refunds were issued.',
        foot: '<span>' + (credits.length + refunds.length) + ' issued</span><b class="num">' + K.money(K.sum(credits, 'amount') + K.sum(refunds, 'amount')) + '</b>' });
      return K.page(h, '<div class="k-bar">' + K.frozen('Issued · frozen') + K.stamp('Recorded', oc.by, oc.at) + '<span class="k-bar__spacer"></span>' + K.goBtn('Family credits in Finance', 'mgmt-fin-parent-money', { size: 'sm', variant: 'secondary' }) + '</div>' +
        K.grid([block('Parents', oc.parent), block('Venue', oc.venue), block('Coaches', oc.coach)], 3) + K.section('Issued to families', 'Created from this outcome and shown in Finance.', issued) +
        K.card({ title: 'Reason for the change', body: K.kv([['Exception', esc(o.cancelReason || '—')], ['Who and when', o.cancelledAt ? K.stamp('Recorded', o.cancelledBy, o.cancelledAt) : '—']]) }));
    }
    var O = OPT(), venue = o.venue && db.getVenue(o.venue), hours = (K.parse('2026-01-01T' + o.end) - K.parse('2026-01-01T' + o.start)) / 36e5;
    var pDef = s.client ? 0 : Math.round(s.price / (s.billing === 'Monthly subscription' ? 4 : 1)), vDef = venue ? Math.round((venue.costPerHour || 0) * hours) : 0;
    var parent = s.client ? K.card({ title: 'Parents', body: ui.notice('info', 'Client session', 'The client is invoiced per class, so there is no parent outcome. Adjust the client invoice in Finance if needed.') + '<input type="hidden" name="pType" value="None"><input type="hidden" name="pAmt" value="0"><input type="hidden" name="pReason" value="Client session">' })
      : K.card({ title: 'Parents', sub: affected.length + ' players in ' + Object.keys(fams).length + ' families are affected.', body: K.form([K.field('Outcome', K.select('pType', O.parentOutcome, 'Credit')), K.field('Amount per player (£)', K.input('pAmt', pounds(pDef)), s.billing === 'Monthly subscription' ? 'Default: one session of a 4-week month.' : ''), K.field('Reason', K.textarea('pReason', '', 'Shown to parents with the credit or refund'), '', true)]) + famList });
    var venueC = K.card({ title: 'Venue', sub: venue ? esc(venue.name) : 'No venue', body: K.form([K.field('Outcome', K.select('vType', O.venueOutcome, vDef ? 'Credit' : 'None')), K.field('Amount (£)', K.input('vAmt', pounds(vDef))), K.field('Reason', K.textarea('vReason', '', 'For example: the venue credited the booking'), '', true)]) });
    var coachC = K.card({ title: 'Coaches', sub: o.staff.map(function (x) { return db.coachName(x.coach); }).join(', ') || 'No coaches', body: K.form([K.field('Outcome', K.select('cType', O.coachOutcome, 'None')), K.field('Amount (£)', K.input('cAmt', '0.00')), K.field('Reason', K.textarea('cReason', '', 'For example: cancelled over 3 hours before start'), '', true)]) });
    return K.page(h, ui.notice('warn', 'Not recorded yet', 'Saving issues family credits or refunds straight away and notifies parents. Issued outcomes cannot be edited.') +
      '<div class="lx-stack">' + parent + K.grid([venueC, coachC], 2) + '</div><div class="k-bar sch-gap"><span class="k-bar__spacer"></span>' + K.goBtn('Cancel', 'mgmt-occurrence/' + o.id, { variant: 'tertiary' }) + K.actBtn('Save outcome and notify parents', 'sch-outcome-save', { id: o.id }, { variant: 'primary', icon: 'check' }) + '</div>');
  };
  Hub.actions['sch-outcome-save'] = function (el) {
    var o = db.getOccurrence(el.dataset.id), at = K.now();
    function part(p) { return { type: K.val(p + 'Type'), amount: K.val(p + 'Type') === 'None' ? 0 : toPence(K.val(p + 'Amt')), reason: K.val(p + 'Reason').trim() }; }
    var oc = { parent: part('p'), venue: part('v'), coach: part('c') };
    var bad = ['parent', 'venue', 'coach'].filter(function (k) { return oc[k].type !== 'None' && !(oc[k].amount > 0); });
    if (bad.length) { Hub.toast('Enter an amount for the ' + bad[0] + ' outcome'); return; }
    if (oc.parent.type !== 'None' && !oc.parent.reason) { Hub.toast('Add a reason for parents'); return; }
    var made = Hub.mutate(function () { return db.recordOccurrenceOutcome(o.id, oc, who(), at); }, null, occLog(o, 'Financial outcome recorded', at, { finance: true, after: 'Parents ' + oc.parent.type + ' ' + K.money(oc.parent.amount) + ' · venue ' + oc.venue.type + ' · coach ' + oc.coach.type }));
    var n = made.credits.length + made.refunds.length;
    Hub.toast(n ? 'Outcome saved · ' + n + ' ' + (made.credits.length ? 'credits' : 'refunds') + ' issued · Parents notified' : 'Outcome saved');
  };

  /* ===================================================== ELIGIBILITY */
  var eligSession = '';
  Hub.screens['mgmt-eligibility'] = function (ctx) {
    var h = K.head({ back: ['mgmt-schedule', 'Schedule & Sessions'], eyebrow: 'Schedule & Sessions', title: 'Eligibility', sub: 'Who can join or book each session, and the per-player exceptions.', actions: K.actBtn('Add exception', 'sch-elig-add', {}, { variant: 'primary', icon: 'plus' }) });
    var g = K.guard(ctx, h, { empty: ['shield', 'No eligibility rules', 'Rules appear here once sessions exist.'] }); if (g) return g;
    var players = db.getPlayers();
    var rules = K.table({ cols: '32px minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr) 90px 60px', head: ['', 'Session', { label: 'School years', cls: 'wide' }, { label: 'Membership', cls: 'wide' }, { label: 'Eligible', cls: 'c-num wide' }, { label: '', cls: 'c-end' }],
      rows: db.getSessions().map(function (s) {
        var r = db.getEligibilityRules(s.id) || { ageGroups: [], schoolYears: [] }, n = players.filter(function (p) { return db.checkEligibility(p.id, s.id).ok; }).length;
        return { cells: ['<span class="row__icon">' + I('shield', 'icon-sm') + '</span>', K.cell(esc(s.name), 'Age groups: ' + esc(r.ageGroups.join(', ') || 'Any')), { cls: 'wide c-cell', html: esc(r.schoolYears.join(', ') || 'Any') }, { cls: 'wide', html: r.membership ? 'Required' : 'Not required' }, { cls: 'c-num wide', html: n + ' players' }, { cls: 'c-end', html: '<span class="k-link">Edit</span>' }], action: 'sch-elig-edit', data: { id: s.id }, label: 'Edit rules for ' + s.name };
      }) });
    var sel = '<label class="lx-select"><span class="visually-hidden">Session</span>' + I('filter', 'icon-sm') + '<select data-change="sch-elig-session"><option value="">All sessions</option>' + db.getSessions().map(function (s) { return '<option value="' + s.id + '"' + (eligSession === s.id ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('') + '</select>' + I('chevronDown', 'icon-sm') + '</label>';
    var ovs = db.getEligibilityOverrides(eligSession || null).slice().reverse();
    var ovT = K.table({ cols: '36px minmax(0, 1.3fr) minmax(0, 1.4fr) 90px minmax(0, 120px)', head: ['', 'Player', { label: 'Reason', cls: 'wide' }, { label: 'Decision', cls: 'wide' }, { label: '', cls: 'c-end' }],
      rows: ovs.map(function (x) {
        var p = db.getPlayer(x.player), s = db.getSession(x.session);
        return { cells: [ui.avatar(p.name, 'sm'), K.cell(esc(p.name), esc(s.name) + ' · ' + esc(p.year) + ' · ' + esc(p.ageGroup)), { cls: 'wide', html: '<span class="c-sub sch-wrap">' + esc(x.reason) + '</span>' + K.stamp(x.revokedAt ? 'Revoked' : 'Decided', x.revokedAt ? x.revokedBy : x.by, x.revokedAt || x.at) },
          { cls: 'wide', html: K.status(x.decision === 'Allow' ? 'Approved' : 'Denied') }, { cls: 'c-end', html: x.revokedAt ? K.pill('Revoked') : K.actBtn('Revoke', 'sch-elig-revoke', { id: x.id }, { size: 'sm', variant: 'secondary', cls: 'sch-above' }) }] };
      }), empty: 'No exceptions for this session.' });
    return K.page(h, K.section('Session rules', 'Age group, school year and whether a membership is required. Select a session to edit its rules.', rules) +
      K.section('Player exceptions', 'Allow a player outside the rules, or stop one who meets them. Every decision keeps who and when.', '<div class="lx-stack"><div class="lx-filterbar">' + sel + '</div>' + ovT + '</div>'));
  };
  Hub.actions['sch-elig-edit'] = function (el) {
    var s = db.getSession(el.dataset.id), r = db.getEligibilityRules(s.id) || { ageGroups: [], schoolYears: [] };
    K.sheet({ title: 'Eligibility rules', meta: '<p class="k-note">' + esc(s.name) + ' · last changed by ' + esc(r.by || '—') + (r.at ? ', ' + esc(K.dt(r.at)) : '') + '</p>', body: K.form([
      K.field('Age groups', K.input('eAge', r.ageGroups.join(', ')), 'Separate with commas. Leave empty for any age group.', true),
      K.field('School years', K.input('eYears', r.schoolYears.join(', ')), 'For example: Year 4, Year 5', true),
      K.field('Membership required', K.select('eMem', [['yes', 'Yes, members only'], ['no', 'No']], r.membership ? 'yes' : 'no'), '', true)], 1), foot: sheetFoot('Save rules', 'sch-elig-save', { id: s.id }) });
  };
  Hub.actions['sch-elig-save'] = function (el) {
    var id = el.dataset.id, at = K.now(), split = function (v) { return v.split(',').map(function (x) { return x.trim(); }).filter(Boolean); };
    var patch = { ageGroups: split(K.val('eAge')), schoolYears: split(K.val('eYears')), membership: K.val('eMem') === 'yes' };
    closeThen(function () { db.setEligibilityRule(id, patch, who(), at); }, 'Eligibility rules saved', { area: 'Schedule', summary: 'Eligibility rules changed for ' + db.getSession(id).name, entity: id, at: at, after: patch.ageGroups.join(', ') + ' · ' + patch.schoolYears.join(', ') });
  };
  Hub.actions['sch-elig-add'] = function () {
    var players = db.getPlayers().map(function (p) { return [p.id, p.name + ' (' + p.ageGroup + ', ' + p.year + ')']; });
    K.sheet({ title: 'Add a player exception', body: K.form([K.field('Player', K.select('oPlayer', players, ''), '', true), K.field('Session', K.select('oSession', db.getSessions().map(function (s) { return [s.id, s.name]; }), eligSession || 'SES-02'), '', true),
      K.field('Decision', K.select('oDecision', [['Allow', 'Allow (outside the rules)'], ['Deny', 'Deny (even if eligible)']], 'Allow'), '', true), K.field('Reason', K.textarea('oReason', '', 'Why is this player an exception?'), '', true)], 1), foot: sheetFoot('Save override', 'sch-elig-add-go', {}) });
  };
  Hub.actions['sch-elig-add-go'] = function () {
    var x = { player: K.val('oPlayer'), session: K.val('oSession'), decision: K.val('oDecision'), reason: K.val('oReason').trim(), by: who(), at: K.now() };
    if (!x.reason) { Hub.toast('Add a reason first'); return; }
    var p = db.getPlayer(x.player);
    closeThen(function () { db.addEligibilityOverride(x); }, x.decision === 'Allow' ? p.name + ' allowed' : p.name + ' denied', { area: 'Schedule', summary: 'Eligibility exception: ' + x.decision + ' ' + p.name + ' for ' + db.getSession(x.session).name, entity: x.player, at: x.at });
  };
  Hub.actions['sch-elig-revoke'] = function (el) {
    var at = K.now(), x = db.getEligibilityOverrides().filter(function (e) { return e.id === el.dataset.id; })[0], p = db.getPlayer(x.player);
    Hub.mutate(function () { db.revokeEligibilityOverride(x.id, who(), at); }, 'Override revoked', { area: 'Schedule', summary: 'Eligibility exception removed for ' + p.name, entity: x.player, at: at });
  };

  /* ===================================================== VENUES */
  Hub.screens['mgmt-venues'] = function (ctx) {
    var h = K.head({ back: ['mgmt-schedule', 'Schedule & Sessions'], eyebrow: 'Schedule & Sessions', title: 'Venues', sub: 'Venue details, closures and the sessions each one affects.' });
    var g = K.guard(ctx, h, { empty: ['pin', 'No venues yet', 'Venues appear here once they are added.'] }); if (g) return g;
    var tiles = '<div class="lx-links lx-links--3">' + db.getVenues().map(function (v) {
      var n = db.getVenueOccurrences(v.key, K.today).filter(function (o) { return o.venue === v.key && o.status === 'Scheduled'; }).length;
      return K.tile({ route: 'mgmt-venue/' + v.key, icon: 'pin', title: v.name, value: n, label: 'upcoming dates', desc: v.area + ' · ' + (v.meetingPoint ? 'Meet at ' + v.meetingPoint.toLowerCase() : 'No meeting point'), badge: K.status(v.active ? 'Active' : 'Inactive') });
    }).join('') + '</div>';
    var un = db.getVenueUnavailability().slice().sort(function (a, b) { return a.from < b.from ? -1 : 1; });
    var unT = K.table({ cols: '120px minmax(0, 1.4fr) minmax(0, 1fr) 110px', head: ['Dates', 'Venue', { label: 'Recorded', cls: 'wide' }, { label: 'Affected', cls: 'c-end' }], rows: un.map(function (u) {
      return { cells: [{ cls: 'c-time', html: esc(K.dm(u.from)) + '<small>' + (u.to !== u.from ? 'to ' + esc(K.dm(u.to)) : '1 day') + '</small>' }, K.cell(esc(db.venueName(u.venue)), esc(u.reason)), { cls: 'wide', html: K.stamp('Recorded', u.by, u.at) }, { cls: 'c-end', html: '<span class="num">' + db.getUnavailabilityImpact(u).length + ' sessions</span>' }], route: 'mgmt-venue/' + u.venue };
    }), empty: 'No unavailability recorded.' });
    return K.page(h, tiles + K.section('Unavailability', 'Closures and the sessions they affect.', unT));
  };
  function siteMap(v) {
    return '<svg class="sch-map" viewBox="0 0 320 180" role="img" aria-label="Site map of ' + esc(v.name) + '"><rect x="1" y="1" width="318" height="178" rx="12" class="sch-map__ground"/>' +
      '<rect x="24" y="26" width="120" height="70" rx="6" class="sch-map__bld"/><text x="84" y="66" text-anchor="middle">Building</text>' +
      '<rect x="168" y="26" width="128" height="128" rx="6" class="sch-map__pitch"/><line x1="232" y1="26" x2="232" y2="154" class="sch-map__line"/><circle cx="232" cy="90" r="18" class="sch-map__line"/><text x="232" y="168" text-anchor="middle">Pitch / hall</text>' +
      '<rect x="24" y="112" width="120" height="42" rx="6" class="sch-map__park"/><text x="84" y="138" text-anchor="middle">Parking</text>' +
      '<circle cx="160" cy="100" r="7" class="sch-map__pin"/><text x="160" y="122" text-anchor="middle" class="sch-map__pinlabel">Meet</text></svg>';
  }
  Hub.screens['mgmt-venue'] = function (ctx) {
    var v = db.getVenue(ctx.param);
    var h = K.head({ back: ['mgmt-venues', 'Venues'], eyebrow: 'Venue · ' + (v ? v.id : ''), title: v ? v.name : 'Venue not found', sub: v ? esc(v.address || v.area) : '', actions: v ? K.actBtn('Add unavailability', 'sch-unavail', { key: v.key }, { variant: 'primary', icon: 'plus' }) : '' });
    var g = K.guard(ctx, h, { empty: ['pin', 'No venue details', 'This venue has no details yet.'] }); if (g) return g;
    if (!v) return K.page(h, ui.notice('warn', 'This venue could not be found', '', { action: K.goBtn('Venues', 'mgmt-venues', { size: 'sm' }) }));
    Hub.crumbTail = v.name;
    var details = K.card({ title: 'Details', body: K.kv([['Address', esc(v.address || '—')], ['Area', esc(v.area)], ['Meeting point', esc(v.meetingPoint || '—')], ['Parking', esc(v.parking || '—')], ['Access', esc(v.access || '—')], ['Hire cost', moneyOk() ? (v.costPerHour ? K.money(v.costPerHour) + ' an hour' : 'No charge (client site)') : '<span class="c-mute">Finance access only</span>']]) });
    var map = K.card({ title: 'Site map', sub: esc(v.siteMap || ''), body: siteMap(v) });
    var photos = K.card({ title: 'Photos', sub: (v.photos || 0) + ' photos', body: v.photos ? '<div class="sch-photos">' + Array.apply(null, Array(v.photos)).map(function (_, i) { return '<div class="sch-photo" role="img" aria-label="Photo ' + (i + 1) + ' of ' + esc(v.name) + '">' + I(['venue', 'pin', 'users'][i % 3]) + '<small>' + ['Entrance', 'Meeting point', 'Pitch'][i % 3] + '</small></div>'; }).join('') + '</div>' : '<p class="k-note">No photos yet.</p>' });
    var upcoming = sortOcc(db.getVenueOccurrences(v.key, K.today)).slice(0, 8);
    var occT = K.card({ title: 'Upcoming dates', body: K.table({ cols: '110px minmax(0, 1fr) minmax(0, 150px)', head: ['When', 'Session', { label: 'Status', cls: 'c-end' }], rows: upcoming.map(function (o) {
      var moved = o.venue !== v.key;
      return { cells: [timeCell(o, true), K.cell(esc(o.session), moved ? 'Moved to ' + esc(db.venueName(o.venue)) : staffText(o)), { cls: 'c-end', html: moved ? K.pill('Moved away', 'warn') : occStatus(o) }], route: 'mgmt-occurrence/' + o.id };
    }), empty: 'No upcoming dates here.' }) });
    var active = K.card({ title: 'Availability', right: K.toggle(v.active, 'sch-venue-active', { key: v.key }, v.active ? 'Active' : 'Inactive'), body: '<p class="k-note">Inactive venues cannot be chosen for new sessions or dates.</p>' + K.timeline(v.history.slice().reverse()) });
    var un = db.getVenueUnavailability(v.key).slice().sort(function (a, b) { return a.from < b.from ? -1 : 1; });
    var unC = K.card({ title: 'Unavailability', sub: un.length + (un.length === 1 ? ' period' : ' periods'), right: K.actBtn('Add', 'sch-unavail', { key: v.key }, { size: 'sm', variant: 'secondary', icon: 'plus' }), body: un.length ? '<div class="lx-stack">' + un.map(function (u) {
      var aff = db.getUnavailabilityImpact(u);
      return '<div class="sch-unav"><div class="sch-unav__head"><b>' + esc(u.from === u.to ? K.d(u.from) : K.dm(u.from) + ' – ' + K.d(u.to)) + '</b>' + K.pill(aff.length + ' affected', aff.some(function (o) { return o.venue === v.key && o.status === 'Scheduled'; }) ? 'warn' : '') + '</div><p class="k-note">' + esc(u.reason) + '</p>' + K.stamp('Recorded', u.by, u.at) +
        (aff.length ? '<ul class="sch-aff">' + aff.map(function (o) { var moved = o.venue !== v.key; return '<li><a class="k-link" href="#mgmt-occurrence/' + o.id + '">' + esc(o.session) + ', ' + esc(K.dd(o.date)) + ' ' + o.start + '</a> ' + (moved ? K.pill('Moved to ' + db.venueName(o.venue), 'ok') : o.status === 'Scheduled' ? K.pill('Needs a decision', 'danger') : K.status(o.status)) + '</li>'; }).join('') + '</ul>' : '<p class="k-note">No sessions fall in this period.</p>') + '</div>';
    }).join('') + '</div>' : '<p class="k-note">No unavailability recorded.</p>' });
    return K.page(h, K.grid(['<div class="lx-stack">' + details + map + occT + '</div>', '<div class="lx-stack">' + active + unC + photos + '</div>'], '21'));
  };
  Hub.actions['sch-venue-active'] = function (el) {
    var v = db.getVenue(el.dataset.key), on = !v.active, at = K.now();
    Hub.mutate(function () { db.setVenueActive(v.key, on, who(), at); }, v.name + (on ? ' is active' : ' is inactive'), { area: 'Schedule', summary: 'Venue ' + (on ? 'activated' : 'deactivated') + ': ' + v.name, entity: v.id, before: on ? 'Inactive' : 'Active', after: on ? 'Active' : 'Inactive', at: at });
  };
  Hub.actions['sch-unavail'] = function (el) {
    var v = db.getVenue(el.dataset.key);
    K.sheet({ title: 'Add unavailability', meta: '<p class="k-note">' + esc(v.name) + '</p>', body: K.form([K.field('From', K.input('uFrom', K.addDays(K.today, 7), { type: 'date' })), K.field('To', K.input('uTo', K.addDays(K.today, 7), { type: 'date' })), K.field('Reason', K.textarea('uReason', '', 'For example: hall floor resurfacing'), 'Sessions in this period are listed so you can move or cancel them.', true)]), foot: sheetFoot('Save', 'sch-unavail-go', { key: v.key }) });
  };
  Hub.actions['sch-unavail-go'] = function (el) {
    var v = db.getVenue(el.dataset.key), at = K.now(), u = { id: 'VUN-' + String(db.getVenueUnavailability().length + 1).padStart(2, '0'), venue: v.key, from: K.val('uFrom'), to: K.val('uTo') || K.val('uFrom'), reason: K.val('uReason').trim(), by: who(), at: at };
    if (!u.from || !u.reason) { Hub.toast('Choose dates and add a reason'); return; }
    if (u.to < u.from) u.to = u.from;
    var n = db.getUnavailabilityImpact(u).length;
    closeThen(function () { db.addVenueUnavailability(u); }, 'Unavailability added · ' + n + ' sessions affected', { area: 'Schedule', summary: 'Venue unavailable ' + K.dm(u.from) + (u.to !== u.from ? '–' + K.dm(u.to) : '') + ': ' + v.name, entity: v.id, at: at });
  };

  /* ===================================================== REGISTER */
  function flags(p) {
    if (!p || !canSeeSensitive()) return '';
    var f = '';
    if (p.medical === 'details') f += '<span class="sch-flag sch-flag--med" title="Medical information">' + I('alertCircle', 'icon-sm') + '<span class="visually-hidden">Medical information</span></span>';
    if (p.medical === 'not_confirmed') f += '<span class="sch-flag sch-flag--warn" title="Medical details not confirmed">' + I('attention', 'icon-sm') + '<span class="visually-hidden">Medical details not confirmed</span></span>';
    if (p.support === 'details') f += '<span class="sch-flag sch-flag--sup" title="Support needs">' + I('support', 'icon-sm') + '<span class="visually-hidden">Support needs</span></span>';
    return f ? '<span class="sch-flags">' + f + '</span>' : '';
  }
  function regPill(r) {
    if (r.trial) return K.pill('Trial', 'info');
    if (r.oneOff) return K.pill('One-off', 'info');
    if (r.membership && r.membership !== 'Active') return K.pill(r.membership, r.membership === 'Paused' ? 'warn' : 'warn');
    if (r.membership) return K.pill('Member', 'ok');
    return K.pill('Pending', 'warn');
  }
  Hub.screens['mgmt-register'] = function (ctx) {
    var o = db.getOccurrence(ctx.param);
    var r = o && db.getRegister(o.id), done = r && r.state === 'Completed', head = o && db.isClientSession(o.sessionId);
    var h = K.head({ back: o ? ['mgmt-occurrence/' + o.id, o.session + ', ' + K.dm(o.date)] : ['mgmt-registers', 'Registers'], eyebrow: 'Register' + (head ? ' · headcount' : ''), title: o ? o.session : 'Register not found', sub: o ? esc(when(o)) + ' · ' + esc(venueOf(o)) : '',
      actions: o && !done && CHANGED.indexOf(o.status) < 0 ? K.actBtn('Complete register', 'sch-reg-complete', { id: o.id }, { variant: 'primary', icon: 'check' }) : o && done ? K.actBtn('Reopen register', 'sch-reg-reopen', { id: o.id }, { variant: 'secondary' }) : '' });
    var g = K.guard(ctx, h, { empty: ['users', 'No players expected', 'Players appear here once they join the session or book a trial.'] }); if (g) return g;
    var off = featureGate(h); if (off) return off;
    if (!o) return K.page(h, ui.notice('warn', 'This register could not be found', '', { action: K.goBtn('Registers', 'mgmt-registers', { size: 'sm' }) }));
    Hub.crumbTail = o.id;
    if (CHANGED.indexOf(o.status) >= 0) return K.page(h, ui.notice('info', 'No register for this session', 'It was ' + o.status.toLowerCase() + (o.replacement ? '. Take the register on the replacement instead.' : '.'), { action: o.replacement ? K.goBtn('Open replacement register', 'mgmt-register/' + o.replacement, { size: 'sm' }) : '' }));
    var stateBar = '<div class="sch-regstate">' + K.status(r.state) + (done ? K.stamp('Completed', r.by, r.at) : r.startedBy ? K.stamp('Started', r.startedBy, r.startedAt) : '<span class="k-note">Nobody has started this register yet.</span>') + (r.reopenedBy && !done ? K.stamp('Reopened', r.reopenedBy, r.reopenedAt) : '') + '</div>';
    if (head) {
      var hc = r.headcount || { expected: o.players, actual: null };
      return K.page(h, stateBar + K.stats([{ label: 'Expected', value: hc.expected, sub: 'Class list from the school' }, { label: 'Actual', value: hc.actual == null ? '—' : hc.actual, sub: hc.by ? 'Counted by ' + esc(hc.by) : 'Not counted yet', tone: hc.actual != null && hc.actual < hc.expected ? 'warn' : '' }, { label: 'Difference', value: hc.actual == null ? '—' : (hc.actual - hc.expected), sub: 'Actual minus expected' }, { label: 'Capacity', value: o.capacity }]) +
        K.card({ title: 'Headcount register', sub: 'Client sessions record the number of children who took part, not individual names.', body: done ? K.kv([['Actual', String(hc.actual)], ['Recorded', hc.by ? K.stamp('Counted', hc.by, hc.at) : '—']]) :
          '<div class="sch-headcount">' + K.actBtn('', 'sch-hc-step', { id: o.id, d: -1 }, { variant: 'secondary', icon: 'x', attrs: { 'aria-label': 'One fewer' } }) + K.field('Children present', K.input('hcActual', hc.actual == null ? hc.expected : hc.actual, { type: 'number' })) + K.actBtn('', 'sch-hc-step', { id: o.id, d: 1 }, { variant: 'secondary', icon: 'plus', attrs: { 'aria-label': 'One more' } }) + K.actBtn('Save headcount', 'sch-headcount', { id: o.id }, { variant: 'primary' }) + '</div>' }));
    }
    var rows = db.getRegisterRows(o.id), O = OPT(), counts = { Present: 0, Late: 0, Absent: 0, Excused: 0 }, unmarked = 0;
    rows.forEach(function (x) { if (x.mark && counts[x.mark.mark] != null) counts[x.mark.mark]++; else unmarked++; });
    var stats = K.stats([{ label: 'Expected', value: rows.filter(function (x) { return !x.oneOff; }).length, sub: rows.filter(function (x) { return x.oneOff; }).length + ' one-off added' }, { label: 'Here', value: counts.Present + counts.Late, sub: counts.Late + ' late' }, { label: 'Absent', value: counts.Absent, sub: counts.Excused + ' excused' }, { label: 'Not marked', value: unmarked, tone: unmarked && !done ? 'warn' : '' }]);
    var sens = canSeeSensitive() ? '' : K.restricted(SENSITIVE, '', 'Medical and support flags');
    var list = '<div class="sch-reg">' + rows.map(function (x) {
      var p = x.player, name = p ? p.name : x.name, m = x.mark;
      var marks = '<div class="segmented sch-marks" role="group" aria-label="Mark ' + esc(name) + '">' + O.marks.map(function (k) { return '<button type="button"' + (done ? ' disabled' : '') + ' data-action="sch-mark" data-occ="' + o.id + '" data-pid="' + x.id + '" data-mark="' + k + '" aria-pressed="' + !!(m && m.mark === k) + '" class="sch-mark sch-mark--' + k.toLowerCase() + '">' + k + '</button>'; }).join('') + '</div>';
      return '<div class="sch-reg__row' + (m ? ' is-marked' : '') + '">' + ui.avatar(name, 'md') +
        '<div class="sch-reg__who"><b>' + (p ? '<a href="#" data-action="sch-player" data-pid="' + p.id + '">' + esc(name) + '</a>' : esc(name)) + '</b>' + flags(p) +
        '<small>' + esc(p ? p.ageGroup : x.ageGroup || '') + '</small>' + regPill(x) + (m && m.note ? '<small class="sch-reg__note">' + I('chat', 'icon-sm') + esc(m.note) + '</small>' : x.note ? '<small class="sch-reg__note">' + esc(x.note) + '</small>' : '') +
        (m ? '<small class="sch-reg__by">' + esc(m.by) + ', ' + esc(K.dt(m.at)) + '</small>' : '') + '</div>' +
        '<div class="sch-reg__act">' + marks + (done ? '' : ui.iconBtn('chat', 'Add a note for ' + name, { 'data-action': 'sch-mark-note', 'data-occ': o.id, 'data-pid': x.id })) + '</div></div>';
    }).join('') + '</div>';
    var add = done ? '' : '<div class="k-bar sch-gap">' + K.actBtn('Add one-off player', 'sch-oneoff', { id: o.id }, { variant: 'secondary', icon: 'plus' }) + '<span class="k-bar__spacer"></span>' + K.actBtn('Mark everyone not marked as present', 'sch-mark-all', { id: o.id }, { variant: 'tertiary' }) + '</div>';
    return K.page(h, stateBar + stats + sens + K.card({ title: 'Players', sub: rows.length + ' on this register', body: list + add }));
  };
  Hub.actions['sch-player'] = function (el) {
    var p = db.getPlayer(el.dataset.pid);
    K.sheet({ title: esc(p.name), meta: '<p class="k-note">' + esc(p.ageGroup) + ' · ' + esc(p.year) + ' · ' + esc(p.school) + '</p>', body: '<div class="lx-stack">' + K.restricted(SENSITIVE, K.kv([['Medical', esc(p.medical === 'none' ? 'None declared' : p.medical === 'not_confirmed' ? 'Not confirmed by the family' : p.medicalDetail)], ['Support needs', esc(p.support === 'none' ? 'None declared' : p.supportDetail)], ['Emergency contact', esc(p.emergency[0].name + ' (' + p.emergency[0].rel + ') ' + p.emergency[0].phone)]]), 'Medical, support and emergency details') +
      '<div class="k-bar">' + K.goBtn('Attendance history', 'mgmt-attendance/' + p.id, { variant: 'secondary', size: 'sm' }) + K.goBtn('Player profile', 'mgmt-player/' + p.id, { variant: 'secondary', size: 'sm' }) + '</div></div>' });
  };
  function rowName(occId, pid) { var x = db.getRegisterRows(occId).filter(function (r) { return r.id === pid; })[0]; return x ? (x.player ? x.player.name : x.name) : pid; }
  Hub.actions['sch-mark'] = function (el) {
    var occ = el.dataset.occ, pid = el.dataset.pid, mark = el.dataset.mark, at = K.now(), cur = db.getRegister(occ).marks[pid], name = rowName(occ, pid);
    Hub.mutate(function () { db.setMark(occ, pid, mark, cur ? cur.note : '', who(), at); }, name + ': ' + mark, { area: 'Registers', summary: name + ' marked ' + mark, entity: occ, before: cur ? cur.mark : 'Not marked', after: mark, at: at });
  };
  Hub.actions['sch-mark-all'] = function (el) {
    var occ = el.dataset.id, at = K.now(), rows = db.getRegisterRows(occ).filter(function (x) { return !x.mark; });
    if (!rows.length) { Hub.toast('Everyone is already marked'); return; }
    Hub.mutate(function () { rows.forEach(function (x) { db.setMark(occ, x.id, 'Present', '', who(), at); }); }, rows.length + ' marked present', { area: 'Registers', summary: rows.length + ' players marked present', entity: occ, at: at });
  };
  Hub.actions['sch-mark-note'] = function (el) {
    var occ = el.dataset.occ, pid = el.dataset.pid, cur = db.getRegister(occ).marks[pid];
    K.sheet({ title: 'Note for ' + esc(rowName(occ, pid)), body: K.form([K.field('Mark', K.select('nMark', OPT().marks, cur ? cur.mark : 'Present')), K.field('Note', K.textarea('nNote', cur ? cur.note : '', 'For example: left early, collected by grandparent'), '', true)], 1), foot: sheetFoot('Save', 'sch-mark-note-go', { occ: occ, pid: pid }) });
  };
  Hub.actions['sch-mark-note-go'] = function (el) {
    var occ = el.dataset.occ, pid = el.dataset.pid, at = K.now(), mark = K.val('nMark'), note = K.val('nNote').trim(), name = rowName(occ, pid);
    closeThen(function () { db.setMark(occ, pid, mark, note, who(), at); }, 'Saved for ' + name, { area: 'Registers', summary: name + ' marked ' + mark + (note ? ' with a note' : ''), entity: occ, at: at });
  };
  Hub.actions['sch-oneoff'] = function (el) {
    var o = db.getOccurrence(el.dataset.id), on = db.getRegisterRows(o.id).map(function (x) { return x.player && x.player.id; });
    var players = [['', 'Someone not in the Hub']].concat(db.getPlayers().filter(function (p) { return on.indexOf(p.id) < 0; }).map(function (p) { return [p.id, p.name + ' (' + p.ageGroup + ')']; }));
    K.sheet({ title: 'Add a one-off player', meta: '<p class="k-note">For a player attending this session only, such as a make-up session or a visitor.</p>', body: K.form([
      K.field('Player', K.select('ooPlayer', players, ''), '', true), K.field('Name (if not in the Hub)', K.input('ooName', '', { placeholder: 'First and last name' }), '', true),
      K.field('Age group', K.select('ooAge', OPT().ageGroups, o.ageGroup)), K.field('Mark', K.select('ooMark', OPT().marks, 'Present')), K.field('Note', K.textarea('ooNote', '', 'Why are they here today?'), '', true)]), foot: sheetFoot('Add to register', 'sch-oneoff-go', { id: o.id }) });
  };
  Hub.actions['sch-oneoff-go'] = function (el) {
    var occ = el.dataset.id, at = K.now(), pid = K.val('ooPlayer'), name = K.val('ooName').trim();
    if (!pid && !name) { Hub.toast('Choose a player or enter a name'); return; }
    var x = { player: pid || null, name: pid ? db.getPlayer(pid).name : name, ageGroup: pid ? db.getPlayer(pid).ageGroup : K.val('ooAge'), note: K.val('ooNote').trim() }, mark = K.val('ooMark');
    closeThen(function () { var one = db.addOneOff(occ, x, who(), at); db.setMark(occ, one.id, mark, x.note, who(), at); }, x.name + ' added to the register', { area: 'Registers', summary: 'One-off player added: ' + x.name, entity: occ, at: at });
  };
  Hub.actions['sch-hc-step'] = function (el) { var inp = document.querySelector('[name="hcActual"]'); if (inp) inp.value = Math.max(0, (+inp.value || 0) + (+el.dataset.d)); };
  Hub.actions['sch-headcount'] = function (el) {
    var occ = el.dataset.id, n = K.val('hcActual'), at = K.now();
    if (n === '' || +n < 0) { Hub.toast('Enter how many children took part'); return; }
    Hub.mutate(function () { db.setHeadcount(occ, +n, who(), at); }, 'Headcount saved: ' + n, { area: 'Registers', summary: 'Headcount ' + n + ' recorded', entity: occ, at: at });
  };
  Hub.actions['sch-reg-complete'] = function (el) {
    var occ = el.dataset.id, o = db.getOccurrence(occ), r = db.getRegister(occ);
    if (db.isClientSession(o.sessionId)) {
      var inp = document.querySelector('[name="hcActual"]');
      if (!r.headcount || r.headcount.actual == null) { if (inp && inp.value !== '') db.setHeadcount(occ, +inp.value, who(), K.now()); else { Hub.toast('Save the headcount first'); return; } }
      return finish(occ);
    }
    var un = db.getRegisterRows(occ).filter(function (x) { return !x.mark; });
    if (!un.length) return finish(occ);
    K.sheet({ title: un.length + ' players are not marked', body: '<p class="k-note">' + esc(un.map(function (x) { return x.player ? x.player.name : x.name; }).join(', ')) + '</p><p>Mark them Absent and complete the register?</p>', foot: sheetFoot('Mark absent and complete', 'sch-reg-complete-go', { id: occ }) });
  };
  function finish(occ) {
    var at = K.now(), o = db.getOccurrence(occ);
    closeThen(function () { db.finishRegister(occ, who(), at); }, 'Register completed', { area: 'Registers', summary: 'Register completed: ' + o.session + ', ' + K.dd(o.date), entity: occ, before: db.getRegister(occ).state, after: 'Completed', at: at });
  }
  Hub.actions['sch-reg-complete-go'] = function (el) {
    var occ = el.dataset.id, at = K.now();
    db.getRegisterRows(occ).filter(function (x) { return !x.mark; }).forEach(function (x) { db.setMark(occ, x.id, 'Absent', 'Not marked when the register was completed', who(), at); });
    finish(occ);
  };
  Hub.actions['sch-reg-reopen'] = function (el) {
    K.sheet({ title: 'Reopen this register?', body: K.form([K.field('Reason', K.textarea('rrReason', '', 'For example: a late arrival was missed'), '', true)], 1), foot: sheetFoot('Reopen', 'sch-reg-reopen-go', { id: el.dataset.id }) });
  };
  Hub.actions['sch-reg-reopen-go'] = function (el) {
    var occ = el.dataset.id, at = K.now(), why = K.val('rrReason').trim(); if (!why) { Hub.toast('Add a reason first'); return; }
    closeThen(function () { db.reopenRegister(occ, why, who(), at); }, 'Register reopened', { area: 'Registers', summary: 'Register reopened', entity: occ, before: 'Completed', after: 'In progress', at: at });
  };

  /* ===================================================== REGISTERS OVERVIEW */
  Hub.screens['mgmt-registers'] = function (ctx) {
    var h = K.head({ back: ['mgmt-schedule', 'Schedule & Sessions'], eyebrow: 'Schedule & Sessions', title: 'Registers', sub: 'Registers outstanding across every session, oldest first, and those recently completed.', actions: K.goBtn('Attendance', 'mgmt-attendance', { variant: 'secondary', icon: 'users' }) });
    var g = K.guard(ctx, h, { empty: ['check', 'No registers yet', 'Registers appear once sessions start.'] }); if (g) return g;
    var off = featureGate(h); if (off) return off;
    var out = sortOcc(db.getOutstandingRegisters());
    var later = sortOcc(db.getTodayOccurrences().filter(function (o) { return !db.isRegisterDue(o) && o.status === 'Scheduled'; }));
    var regs = db.getRegisters(), done = sortOcc(db.getOccurrences(function (o) { return regs[o.id] && regs[o.id].state === 'Completed'; })).sort(function (a, b) { return (regs[a.id].at || '') < (regs[b.id].at || '') ? 1 : -1; });
    var weekAgo = K.addDays(K.today, -7);
    function tbl(list, empty) {
      return K.table({ cols: '110px minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 130px)', head: ['When', 'Session', { label: 'Progress', cls: 'wide' }, { label: 'State', cls: 'c-end' }], rows: list.map(function (o) {
        var r = db.getRegister(o.id), n = Object.keys(r.marks).length, client = db.isClientSession(o.sessionId), overdue = o.date < K.today && r.state !== 'Completed';
        var prog = r.state === 'Completed' ? K.stamp('Completed', r.by, r.at) : client ? (r.headcount && r.headcount.actual != null ? 'Headcount ' + r.headcount.actual + ' of ' + r.headcount.expected : 'Headcount not taken') : n + ' of ' + o.players + ' marked' + (r.startedBy ? ' · ' + esc(r.startedBy) : '');
        return { cells: [timeCell(o, true), K.cell(esc(o.session), esc(venueOf(o)) + (client ? ' · headcount' : '')), { cls: 'wide c-cell', html: prog }, { cls: 'c-end', html: overdue ? K.pill('Overdue · ' + r.state, 'danger') : K.status(r.state) }], route: 'mgmt-register/' + o.id };
      }), empty: empty });
    }
    return K.page(h, K.stats([{ label: 'Outstanding', value: out.length, tone: out.length ? 'warn' : '', sub: out.filter(function (o) { return o.date < K.today; }).length + ' from earlier days' }, { label: 'Later today', value: later.length, sub: 'Due once they start' }, { label: 'Completed this week', value: done.filter(function (o) { return o.date >= weekAgo; }).length }, { label: 'Completed this term', value: done.length }]) +
      K.section('Outstanding', 'Incomplete registers from earlier days come first. Each one raises a Needs attention item until it is complete.', tbl(out, 'Every register due so far is complete.')) +
      K.section('Later today', '', tbl(later, 'Nothing else today.')) + K.section('Recently completed', '', tbl(done.slice(0, 10), 'No registers completed yet.')));
  };

  /* ===================================================== ATTENDANCE */
  Hub.screens['mgmt-attendance'] = function (ctx) {
    if (ctx.param) return playerAttendance(ctx);
    var views = [{ id: 'players', label: 'By player' }, { id: 'sessions', label: 'By session' }];
    var h = K.head({ back: ['mgmt-schedule', 'Schedule & Sessions'], eyebrow: 'Schedule & Sessions', title: 'Attendance', sub: 'Attendance from completed and in-progress registers. Late counts as attended; excused is left out of the percentage.', actions: K.goBtn('Registers', 'mgmt-registers', { variant: 'secondary', icon: 'check' }), tabs: K.tabs('sch-att', views) });
    var g = K.guard(ctx, h, { empty: ['users', 'No attendance yet', 'Attendance appears once registers are taken.'] }); if (g) return g;
    var off = featureGate(h); if (off) return off;
    function pct(v) { return v == null ? '<span class="c-mute">—</span>' : '<span class="sch-pct' + (v < 75 ? ' is-low' : '') + '">' + v + '%</span>'; }
    if (K.tab('sch-att', views) === 'players') {
      var rows = db.getPlayers().map(function (p) { return { p: p, s: db.getAttendanceSummary(p.id) }; }).filter(function (x) { return x.s.total; }).sort(function (a, b) { return (a.s.pct || 0) - (b.s.pct || 0); });
      return K.page(h, K.table({ cols: '40px minmax(0, 1.5fr) minmax(0, 1fr) 90px 90px', head: ['', 'Player', { label: 'Marks', cls: 'wide' }, { label: 'Sessions', cls: 'c-num wide' }, { label: 'Attended', cls: 'c-num' }], rows: rows.map(function (x) {
        return { cells: [ui.avatar(x.p.name, 'sm'), K.cell(esc(x.p.name), esc(x.p.ageGroup) + ' · ' + esc(db.getPlayerMemberships(x.p.id).filter(function (m) { return m.state !== 'Ended'; }).map(function (m) { return db.getSession(m.session).name; }).join(', ') || 'No membership')),
          { cls: 'wide c-cell', html: x.s.present + ' present · ' + x.s.late + ' late · ' + x.s.absent + ' absent · ' + x.s.excused + ' excused' }, { cls: 'c-num wide', html: String(x.s.total) }, { cls: 'c-num', html: pct(x.s.pct) }], route: 'mgmt-attendance/' + x.p.id };
      }), empty: 'No attendance yet.' }));
    }
    var srows = db.getSessions().filter(function (s) { return s.lifecycle !== 'Draft'; }).map(function (s) { var a = db.getSessionAttendance(s.id); return { cells: [{ cls: 'c-time', html: esc(dayNames(s)) + '<small>' + s.start + '</small>' }, K.cell(esc(s.name), s.client ? 'Headcount register' : a.players.length + ' players'), { cls: 'c-num wide', html: String(a.registers) }, { cls: 'c-num', html: pct(s.client ? a.headcount : a.summary.pct) }], route: 'mgmt-session/' + s.id }; });
    return K.page(h, K.table({ cols: '92px minmax(0, 1.5fr) 100px 90px', head: ['When', 'Session', { label: 'Registers', cls: 'c-num wide' }, { label: 'Attended', cls: 'c-num' }], rows: srows }));
  };
  function playerAttendance(ctx) {
    var p = db.getPlayer(ctx.param);
    var h = K.head({ back: ['mgmt-attendance', 'Attendance'], eyebrow: 'Attendance', title: p ? p.name : 'Player not found', sub: p ? esc(p.ageGroup) + ' · ' + esc(p.year) + ' · ' + esc(p.school) : '', actions: p ? K.goBtn('Player profile', 'mgmt-player/' + p.id, { variant: 'secondary', icon: 'user' }) : '' });
    var g = K.guard(ctx, h, { empty: ['users', 'No attendance yet', 'This player has no register marks yet.'] }); if (g) return g;
    var off = featureGate(h); if (off) return off;
    if (!p) return K.page(h, ui.notice('warn', 'This player could not be found', '', { action: K.goBtn('Attendance', 'mgmt-attendance', { size: 'sm' }) }));
    Hub.crumbTail = p.name;
    var s = db.getAttendanceSummary(p.id), list = db.getAttendance(p.id);
    var rows = list.map(function (x) { var o = x.occurrence; return { cells: [timeCell(o, true), K.cell(esc(o.session), esc(venueOf(o))), { cls: 'wide c-cell', html: x.note ? esc(x.note) : '<span class="c-mute">—</span>' }, { cls: 'c-end', html: K.status(x.mark) }], route: 'mgmt-register/' + o.id }; });
    return K.page(h, K.stats([{ label: 'Attended', value: s.pct == null ? '—' : s.pct + '%', tone: s.pct != null && s.pct < 75 ? 'warn' : '', sub: 'Present or late' }, { label: 'Present', value: s.present, sub: s.late + ' late' }, { label: 'Absent', value: s.absent }, { label: 'Excused', value: s.excused }]) +
      K.section('History', s.total + ' marks, newest first', K.table({ cols: '110px minmax(0, 1.4fr) minmax(0, 1fr) 100px', head: ['When', 'Session', { label: 'Note', cls: 'wide' }, { label: 'Mark', cls: 'c-end' }], rows: rows, empty: 'No register marks yet.' })));
  }
})();
