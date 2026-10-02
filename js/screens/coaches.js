/* Coaches and staff screens (pass 12): directory, coach profile with tabs,
   session roles and permissions, rates, allocations, availability,
   documents and compliance, the cover workflow and monthly work summaries.
   Reads and writes only through Hub.db (js/data/coaching.js, finance.js). */
(function () {
  var K = Hub.kit, db = Hub.db, ui = Hub.ui, I = Hub.icon, esc = ui.esc;

  /* ---------- Small helpers ---------- */
  function word() { return Hub.staffPlural ? Hub.staffPlural() : 'Coaches'; }
  function one() { return (Hub.brand && Hub.brand.terms && Hub.brand.terms.staff) || 'Coach'; }
  function page(h, body) { return K.page(h, body, 'co'); }
  var TONE = { covered: 'ok', 'ready to finalise': 'info', 'awaiting coach': '', 'needs a phone call': 'warn', 'in progress': 'warn', holiday: 'info', unavailable: 'danger', 'different hours': 'warn',
    rejected: 'danger', illness: 'danger', 'no coach': 'danger', offered: 'info', accepted: 'ok', current: 'ok', 'docs current': 'ok', inactive: '', lead: 'info', coach: '', 'learning coach': 'warn', office: '' };
  function st(text) { var t = String(text).toLowerCase(); return TONE[t] != null ? K.pill(text, TONE[t]) : K.status(text); }
  function pence(v) { var n = parseFloat(String(v).replace(/[£,\s]/g, '')); return isNaN(n) ? null : Math.round(n * 100); }
  function pounds(p) { return (p / 100).toFixed(2); }
  function first(name) { return String(name).split(' ')[0]; }
  function range(a, b) { return a === b ? K.dd(a) : K.dm(a) + '–' + K.dm(b); }
  function occLabel(o) { return o.session + ' · ' + K.dd(o.date) + ', ' + o.start + '–' + o.end; }
  function log(summary, entity, extra) { return Object.assign({ area: 'Coaches', summary: summary, entity: entity || '' }, extra || {}); }
  function finLocked(what) { return '<div class="k-locked">' + I('shield', 'icon-sm') + '<span><b>' + esc(what || 'Rates and costs') + '</b><small>Only visible with Finance access (View or Manage).</small></span></div>'; }
  function coachCell(key, sub) { var n = db.coachName(key); return { cls: 'c-main', html: '<span class="co-who">' + ui.avatar(n, 'sm') + '<span class="co-who__t"><span class="c-title">' + esc(n) + '</span>' + (sub ? '<span class="c-sub">' + sub + '</span>' : '') + '</span></span>' }; }
  function notFound(h, what) { return page(h, ui.notice('warn', what + ' not found', 'It may have been removed. Go back and pick another.')); }
  function checkMark(on) { return on ? '<span class="co-yes">' + I('check', 'icon-sm') + '<span class="visually-hidden">Yes</span></span>' : '<span class="co-no">—<span class="visually-hidden">No</span></span>'; }
  function today(c) { return db.getAvailabilityExceptions(c).filter(function (e) { return e.from <= K.today && e.to >= K.today; })[0]; }
  function holidaySoon(c) { return db.getAvailabilityExceptions(c).filter(function (e) { return e.type === 'Holiday' && e.to >= K.today && e.from <= K.addDays(K.today, 30); })[0]; }
  function sheetFoot(label, action, data, o) { return ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn(label, action, data, Object.assign({ variant: 'primary' }, o || {})); }
  function stamp(verb, who, at) { return who && at ? K.stamp(verb, who, at) : ''; }

  /* Routes */
  K.route('mgmt-coaches', { title: 'Coaches', parent: 'home' });
  K.route('mgmt-coach', { title: function () { var c = db.getCoach(K.param()); return c ? c.name : one(); }, parent: 'home' });
  K.route('mgmt-coach-roles', { title: 'Session roles', parent: 'home' });
  K.route('mgmt-allocations', { title: 'Coach pay', parent: 'home' });
  K.route('mgmt-availability', { title: 'Availability', parent: 'home' });
  K.route('mgmt-documents', { title: 'Documents and compliance', parent: 'home' });
  K.route('mgmt-document', { title: function () { var d = db.getDocument(K.param()); return d ? db.getDocType(d.type).name : 'Document'; }, parent: 'home' });
  K.route('mgmt-cover', { title: 'Cover', parent: 'home' });
  K.route('mgmt-cover-request', { title: function () { var r = db.getCoverRequest(K.param()); return r && r.coach ? 'Cover for ' + db.coachName(r.coach).split(' ')[0] : 'Cover'; }, parent: 'home' });
  K.route('mgmt-work-summaries', { title: 'Work summaries', parent: 'home' });
  K.route('mgmt-work-summary', { title: function () { var w = db.getWorkSummary(K.param()); return w ? db.coachName(w.coach) + ' · ' + w.label : 'Work summary'; }, parent: 'home' });

  /* Live search on the directory: filters cards in place so focus stays */
  var dirQuery = '';
  document.addEventListener('input', function (e) {
    var el = e.target; if (!el.matches || !el.matches('[data-co-search]')) return;
    dirQuery = el.value.trim().toLowerCase();
    document.querySelectorAll('.co-dir .lx-person').forEach(function (c) { c.hidden = dirQuery && c.dataset.name.indexOf(dirQuery) < 0; });
    var none = document.querySelector('.co-dir__none'); if (none) none.hidden = !!document.querySelector('.co-dir .lx-person:not([hidden])');
  });
  /* Filter selects store their value in the shared tab state */
  document.addEventListener('change', function (e) {
    var el = e.target; if (!el.matches || !el.matches('[data-co-filter]')) return;
    Hub.wsTabs[el.dataset.coFilter] = el.value; Hub.render();
  });
  function filterSelect(id, label, opts) {
    var v = Hub.wsTabs[id] || opts[0][0];
    return '<label class="lx-select"><span class="visually-hidden">' + esc(label) + '</span><select data-co-filter="' + id + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === v ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>' + I('chevronDown', 'icon-sm') + '</label>';
  }

  /* ============================================================ DIRECTORY */
  function dirPills(c) {
    var comp = db.getCoachComplianceSummary(c.id), out = [K.pill(comp.text, comp.tone)];
    var t = today(c.id); if (t) out.push(K.pill(t.type === 'Different hours' ? 'Different hours today' : 'Unavailable today', t.type === 'Different hours' ? 'warn' : 'danger'));
    var h = holidaySoon(c.id); if (h && h !== t) out.push(K.pill('Holiday ' + range(h.from, h.to), 'warn'));
    if (!c.active) out.push(K.pill('Inactive', ''));
    return out;
  }
  function needsLook(c) { return db.getCoachComplianceSummary(c.id).state !== 'Current' || today(c.id) || holidaySoon(c.id) || !c.active; }
  Hub.screens['mgmt-coaches'] = function (ctx) {
    var h = K.head({ back: ['mgmt-home', 'Home'], eyebrow: 'Home', title: 'Coaches',
      sub: 'Who is working, whether they are available and up to date, cover, and the work they have done.',
      actions: K.actBtn('Record time off', 'co-absence', {}, { variant: 'secondary', icon: 'calendar' }) + K.goBtn('Add or invite a coach', 'mgmt-coach-signups', { variant: 'primary', icon: 'plus' }) });
    var g = K.guard(ctx, h, { empty: ['coaches', 'No ' + word().toLowerCase() + ' yet', 'Approved coach sign-ups appear here with their documents, availability and rates.'] }); if (g) return g;
    var all = db.getCoaches(), cover = db.getOpenCover(), ready = db.getSummariesReady(), issues = db.getComplianceIssues();
    var reqs = cover.map(function (x) { return x.request; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var glance = K.section('At a glance', '', K.stats([
      { label: 'Active ' + word().toLowerCase(), value: all.filter(function (c) { return c.active; }).length, sub: all.length + ' on file · ' + all.filter(function (c) { return c.type === 'learning'; }).length + ' learning' },
      { label: 'Open cover', value: cover.length, sub: cover.length ? cover.length + ' date' + (cover.length === 1 ? '' : 's') + ' across ' + reqs.length + ' request' + (reqs.length === 1 ? '' : 's') : 'Nothing open', route: 'mgmt-cover', tone: cover.length ? 'warn' : '' },
      { label: 'Work summaries', value: ready.length, sub: ready.length ? ready.map(function (w) { return first(db.coachName(w.coach)); }).join(', ') + ' to read or answer' : 'Nothing waiting', route: 'mgmt-work-summaries' },
      { label: 'Documents', value: issues.length, sub: 'Expiring, missing or awaiting check', route: 'mgmt-documents', tone: issues.length ? 'warn' : '' }
    ]));
    var more = K.moreIn('More in Coaches', [
      ['Cover and time off', [{ route: 'mgmt-cover', icon: 'swap', title: 'Cover', desc: 'Who is away and who is covering', count: cover.length },
        { route: 'mgmt-availability', icon: 'calendar', title: 'Availability and time off', desc: 'Usual weeks, holidays and one-off changes', count: db.getAvailabilityExceptions().filter(function (e) { return e.to >= K.today; }).length }]],
      ['Pay and work', [{ route: 'mgmt-allocations', icon: 'finance', title: 'Coach pay', desc: 'Work done and pay, session by session' },
        { route: 'mgmt-work-summaries', icon: 'inbox', title: 'Work summaries', desc: 'Each coach’s month, checked before payment', count: ready.length }]],
      ['Team and checks', [{ route: 'mgmt-documents', icon: 'book', title: 'Documents', desc: 'DBS, first aid, safeguarding', count: issues.length },
        { route: 'mgmt-coach-roles', icon: 'shield', title: 'Session roles', desc: 'What Lead, Coach and Learning Coach can do' },
        { route: 'mgmt-coach-signups', icon: 'userCheck', title: 'New coach sign-ups', desc: 'Approve new coaches' },
        { route: 'mgmt-trial-coaches', icon: 'whistle', title: 'Coaches on trial', desc: 'Approve, extend or end a trial' }]]
    ]);
    var f = K.tab('co-dir', [{ id: 'all' }, { id: 'look' }, { id: 'lead' }, { id: 'learning' }, { id: 'inactive' }]);
    var list = all.filter(function (c) { return f === 'all' || (f === 'look' && needsLook(c)) || (f === 'lead' && c.type === 'lead') || (f === 'learning' && c.type === 'learning') || (f === 'inactive' && !c.active); });
    var bar = '<div class="lx-tools"><label class="search"><span class="visually-hidden">Search ' + esc(word().toLowerCase()) + '</span>' + I('search') + '<input class="input" data-co-search placeholder="Search by name, role or code" value="' + esc(dirQuery) + '"></label>' +
      K.seg('co-dir', [{ id: 'all', label: 'All' }, { id: 'look', label: 'Needs a look' }, { id: 'lead', label: 'Leads' }, { id: 'learning', label: 'Learning' }, { id: 'inactive', label: 'Inactive' }]) + '</div>';
    var cards = list.map(function (c) {
      var key = (c.name + ' ' + c.role + ' ' + c.code).toLowerCase(), hide = dirQuery && key.indexOf(dirQuery) < 0;
      return '<a class="lx-person" href="#mgmt-coach/' + c.id + '" data-name="' + esc(key) + '"' + (hide ? ' hidden' : '') + '>' + ui.avatar(c.name, 'lg') +
        '<span class="lx-person__text"><b>' + esc(c.name) + '</b><small>' + esc(c.role) + ' · ' + esc(c.code) + '</small></span>' + I('chevron', 'icon-sm lx-person__go') +
        '<span class="lx-person__pills">' + dirPills(c).join('') + '<span class="lx-person__n num">' + db.getCoachWeekCount(c.id) + ' this week</span></span></a>';
    }).join('');
    var anyShown = list.some(function (c) { return !dirQuery || (c.name + ' ' + c.role + ' ' + c.code).toLowerCase().indexOf(dirQuery) >= 0; });
    return page(h, K.areaNeeds(['Coaches & Compliance', 'Staffing & Cover'], { area: 'Coaches', clear: 'Every coach is up to date and every session is covered.' }) + glance +
      K.section('Find a coach', 'Open a coach for their sessions, time off and cover, documents, and pay and work.', bar + '<div class="lx-people co-dir">' + cards + '</div>' +
        '<p class="k-note co-dir__none"' + (anyShown ? ' hidden' : '') + '>No ' + esc(word().toLowerCase()) + ' match this search and filter.</p>') + more);
  };

  /* ============================================================ PROFILE */
  /* Five tabs: the coach as a person, their sessions, their time (availability, time off and cover), their documents, and their pay and work */
  var TABS = [{ id: 'overview', label: 'Overview' }, { id: 'roles', label: 'Sessions' }, { id: 'availability', label: 'Availability' },
    { id: 'documents', label: 'Documents' }, { id: 'pay', label: 'Work & Pay' }];
  Hub.screens['mgmt-coach'] = function (ctx) {
    var c = db.getCoach(ctx.param);
    var base = K.head({ back: ['mgmt-coaches', word()], eyebrow: one(), title: c ? c.name : one() });
    if (!c) { var g0 = K.guard(ctx, base); if (g0) return g0; return notFound(base, one()); }
    var comp = db.getCoachComplianceSummary(c.id), openCover = db.getOpenCover().filter(function (x) { return x.absent === c.id; }).length;
    var tabs = TABS.map(function (t) {
      var m = Object.assign({}, t);
      if (t.id === 'documents') { m.meta = comp.state === 'Current' ? 'Current' : comp.state; m.state = comp.tone === 'danger' ? 'Urgent' : comp.tone === 'warn' ? 'Warning' : null; }
      if (t.id === 'availability' && openCover) { m.meta = openCover + ' cover open'; m.state = 'Warning'; }
      return m;
    });
    var h = K.head({ back: ['mgmt-coaches', word()], eyebrow: c.role, title: c.name,
      sub: esc(c.hub + ' hub access') + ' · ' + (c.active ? 'Active' : 'Inactive') + ' · started ' + esc(K.dm(c.started) + ' ' + c.started.slice(0, 4)),
      actions: K.actBtn('Record time off', 'co-absence', { coach: c.id }, { variant: 'secondary', icon: 'calendar' }),
      tabs: K.tabs('coach-prof', tabs) });
    var g = K.guard(ctx, h, { empty: ['coaches', 'Nothing on this profile yet', 'Details, documents and sessions appear once the coach is set up.'] }); if (g) return g;
    var tab = K.tab('coach-prof', TABS);
    var body = { overview: pOverview, roles: pRoles, availability: function (c) { return pAvail(c) + pCover(c); }, documents: pDocs, pay: function (c) { return pAllocs(c) + pSummaries(c) + pRates(c); } }[tab](c);
    return page(h, body);
  };

  function pOverview(c) {
    var t = today(c.id), comp = db.getCoachCompliance(c.id), up = db.getCoachUpcoming(c.id, 6);
    var alert = t ? ui.notice(t.type === 'Different hours' ? 'warn' : 'danger', (t.type === 'Different hours' ? 'Different hours today' : 'Unavailable today') + (t.start ? ', ' + t.start + '–' + t.end : ''), esc(t.reason) + ' · ' + stamp('Recorded', t.by, t.at)) : '';
    var hist = db.getCoachStatusHistory(c.id);
    var profile = K.card({ title: 'Profile', sub: 'Contact details come from the coach’s own account.', body:
      '<div class="co-photo">' + ui.avatar(c.name, 'lg') + '<div><b>No photo yet</b><small>Coaches add their own photo in the ' + esc(one()) + ' hub. It shows to families on session pages.</small></div>' +
        K.actBtn('Ask for a photo', 'co-photo', { coach: c.id }, { size: 'sm', variant: 'secondary' }) + '</div>' +
      K.kv([['Role', esc(c.role)], ['Session role', st(db.getRole(c.type).name)], ['Code', K.id(c.code)], ['Email', '<a class="k-link" href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a>'], ['Phone', esc(c.phone)], ['Hub access', esc(c.hub)], ['Started', K.d(c.started)]]) +
      '<div class="co-active">' + K.toggle(c.active, 'co-active', { coach: c.id }, c.active ? 'Active: can be staffed and offered cover' : 'Inactive: hidden from staffing and cover') + '</div>' +
      (hist.length ? K.timeline(hist) : '') });
    var compCard = K.card({ title: 'Compliance', sub: 'Required documents for a ' + db.getRole(c.type).name.toLowerCase() + '.', right: K.actBtn('Documents', 'co-tab', { tab: 'documents' }, { size: 'sm', variant: 'tertiary' }),
      body: ui.rows(comp.map(function (x) {
        var d = x.doc || x.pending;
        return ui.row({ title: esc(x.type.name), sub: [d ? (d.expires ? (d.expires < K.today ? 'Expired ' : 'Expires ') + K.d(d.expires) : 'No expiry') : 'Nothing on file', x.pending && x.doc ? 'Newer upload awaiting check' : ''], trail: st(x.state), href: d ? '#mgmt-document/' + d.id : null });
      })) });
    var upcoming = K.card({ title: 'Coming up', sub: 'Next dates this ' + one().toLowerCase() + ' is on.', body: up.length ? ui.rows(up.map(function (o) {
      var me = o.staff.filter(function (s) { return s.coach === c.id; })[0];
      return ui.row({ title: esc(o.session), sub: [K.dd(o.date) + ', ' + o.start + '–' + o.end, esc(db.venueName(o.venue))], trail: me && me.unavailable ? K.pill(me.covering ? 'Covered by ' + first(db.coachName(me.covering)) : 'Unavailable', me.covering ? 'info' : 'danger') : st(me ? me.role : ''), href: '#mgmt-occurrence/' + o.id });
    })) : '<p class="k-note">No upcoming dates.</p>' });
    /* Overview first: anything needing action for this coach (the same items as Needs attention), then the answers to where, when and how they are doing */
    var cs = db.getCoachComplianceSummary(c.id), sess = db.getAssignments ? db.getAssignments(c.id) : [];
    var sep = db.getAllocations(function (a) { return a.coach === c.id && a.date.slice(0, 7) === '2026-09'; });
    var exc = db.getAvailabilityExceptions(c.id).filter(function (e) { return e.to >= K.today; })[0];
    var snap = K.snap([
      ['Works at', sess.length ? sess.map(function (a) { return esc(a.sessionName || (db.getSession(a.session) || {}).name || ''); }).filter(Boolean).slice(0, 3).join(', ') : 'No regular sessions', db.getCoachWeekCount(c.id) + ' this week · ' + esc(db.getRole(c.type).name)],
      ['Available', exc ? esc(exc.type) + ' ' + esc(K.dm(exc.from)) + (exc.to !== exc.from ? '–' + esc(K.dm(exc.to)) : '') : 'Usual week', exc ? esc(exc.reason || '') : 'Nothing booked off'],
      ['Documents and pay', cs.state === 'Current' ? 'Documents up to date' : esc(cs.text), 'September: ' + sep.length + ' sessions' + (K.canFin() || K.fin() === 'view' ? ' · ' + K.money(K.sum(sep, 'cost')) : '')]
    ]);
    /* Is this coach okay, and is anything needed? */
    var fn = first(c.name), list = db.getCoachCompliance(c.id), bad = list.filter(function (x) { return x.state === 'Expired' || x.state === 'Missing'; })[0];
    var pend = list.filter(function (x) { return x.pending; })[0], soon = list.filter(function (x) { return x.state === 'Expiring'; })[0];
    var sit = !c.active ? K.situation({ tone: 'info', title: fn + ' is inactive', text: 'Inactive coaches are not offered sessions or cover.' })
      : bad ? K.situation({ tone: 'danger', title: esc(bad.type.name) + (bad.state === 'Expired' ? ' expired' : ' missing'), text: esc(fn) + ' should not be staffed until ' + (bad.state === 'Expired' ? 'it is replaced' : 'one is on file') + '.' + (pend && pend.type.id === bad.type.id ? ' A new one has been uploaded and is waiting to be checked.' : ''), primary: pend && pend.type.id === bad.type.id ? K.goBtn('Check the new ' + bad.type.name.toLowerCase(), 'mgmt-document/' + pend.pending.id, { variant: 'primary' }) : K.actBtn('Review documents', 'co-tab', { tab: 'documents' }, { variant: 'primary' }) })
      : pend ? K.situation({ tone: 'warn', title: 'New ' + esc(pend.type.name.toLowerCase()) + ' uploaded', text: 'Check the original document before approving.', primary: K.goBtn('Review document', 'mgmt-document/' + pend.pending.id, { variant: 'primary' }) })
      : t ? K.situation({ tone: 'warn', title: (t.type === 'Different hours' ? 'Different hours today' : fn + ' is unavailable today'), text: esc(t.reason || '') })
      : soon ? K.situation({ tone: 'warn', title: esc(soon.type.name) + ' expires ' + esc(K.dm(soon.doc.expires)), text: 'Ask ' + esc(fn) + ' for a new one before then.', primary: K.actBtn('Review documents', 'co-tab', { tab: 'documents' }, { variant: 'secondary' }) })
      : K.situation({ tone: 'ok', title: fn + ' is all set', text: 'Documents current, nothing booked off and no cover open.' });
    return sit + K.needsFor(function (k) { return K.relatesTo(k, 'coach', c.id) && k.ruleId !== 'ATT-011' && k.ruleId !== 'ATT-042'; }, { title: 'Also needs you' }) + snap + K.grid([upcoming, compCard], 2) + K.details('Profile and contact', profile, { sub: 'Contact details, role, active status and its history' });
  }

  function permsList(role) {
    return '<ul class="co-perms">' + db.getPermissions().map(function (p) { var on = role.perms[p.id]; return '<li class="' + (on ? 'is-on' : '') + '">' + checkMark(on) + '<span>' + esc(p.label) + '</span></li>'; }).join('') + '</ul>';
  }
  function pRoles(c) {
    var asg = db.getAssignments(c.id), ovr = db.getRoleOverrides(c.id), rem = db.getRemovedAssignments(c.id), base = db.getRole(c.type);
    var reg = K.card({ title: 'Regular assignments', sub: 'From each session’s staff. The session role decides what this ' + one().toLowerCase() + ' can do there.', body: K.table({
      cols: 'minmax(0,1.6fr) minmax(0,1fr) minmax(0,1.6fr) auto', head: ['Session', { label: 'Role', cls: 'wide' }, { label: 'Can do', cls: 'wide' }, ''],
      rows: asg.map(function (a) {
        var r = db.getRole(a.role);
        return { cells: [K.cell(K.link('mgmt-session/' + a.session, a.sessionName), a.days.map(function (d) { return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]; }).join(', ') + ' ' + a.start + '–' + a.end + ' · ' + esc(db.venueName(a.venue))),
          { cls: 'wide', html: st(r.name) }, { cls: 'wide c-cell', html: esc(db.getPermissions().filter(function (p) { return r.perms[p.id]; }).map(function (p) { return p.label; }).join(', ')) },
          { cls: 'c-end', html: K.actBtn('Remove', 'co-remove', { coach: c.id, session: a.session }, { size: 'sm', variant: 'tertiary' }) }] };
      }), empty: 'Not on any session’s regular staff.' }) });
    var tmp = K.card({ title: 'Temporary role changes', sub: 'A different role on one session for a date range. The regular role returns afterwards.', right: K.actBtn('Add temporary role', 'co-ovr-new', { coach: c.id }, { size: 'sm', variant: 'secondary', icon: 'plus' }), body: K.table({
      cols: 'minmax(0,1.4fr) minmax(0,1fr) minmax(0,1.6fr) auto', head: ['Session and dates', { label: 'Role', cls: 'wide' }, { label: 'Reason', cls: 'wide' }, ''],
      rows: ovr.map(function (o) {
        var s = db.getSession(o.session), live = !o.ended && o.to >= K.today;
        return { cells: [K.cell(esc(s ? s.name : o.session), K.dm(o.from) + ' – ' + K.dm(o.to) + ' · ' + stamp('Set', o.by, o.at)), { cls: 'wide', html: st(db.getRole(o.role).name) }, { cls: 'wide c-cell', html: esc(o.reason) + (o.ended ? '<br>' + stamp('Ended', o.ended.by, o.ended.at) : '') },
          { cls: 'c-end', html: live ? K.actBtn('End now', 'co-ovr-end', { id: o.id }, { size: 'sm', variant: 'tertiary' }) : K.pill(o.ended ? 'Ended' : 'Finished', '') }] };
      }), empty: 'No temporary role changes.' }) });
    var former = K.card({ title: 'Former access', sub: 'After removal a ' + one().toLowerCase() + ' keeps read-only access to that session’s players for 21 days, so they can finish feedback.', body: rem.length ? ui.rows(rem.map(function (r) {
      var n = db.accessDaysLeft(r);
      return ui.row({ title: esc(r.sessionName) + ' · was ' + esc(K.roleName(r.role)), sub: [esc(r.reason), stamp('Removed', r.by, r.removedAt)], trail: n > 0 ? K.pill('Access ends in ' + n + ' day' + (n === 1 ? '' : 's') + ' (' + K.dm(r.accessUntil) + ')', 'warn') : K.pill('Access ended ' + K.dm(r.accessUntil), '') });
    })) : '<p class="k-note">No removed assignments.</p>' });
    var perms = K.card({ title: 'Default permissions · ' + base.name, sub: 'From the role matrix. ' + K.link('mgmt-coach-roles', 'Edit session roles'), body: permsList(base) });
    return K.grid([reg + tmp + former, perms], '21');
  }

  function rateRows(list) {
    return list.slice().sort(function (a, b) { return a.from < b.from ? 1 : -1; }).map(function (r) {
      var live = r.from <= K.today && (!r.to || r.to >= K.today);
      return { cells: [K.cell(K.d(r.from) + (r.to ? ' – ' + K.d(r.to) : ' onwards'), esc(r.note || '') + (r.note ? ' · ' : '') + stamp('Set', r.by, r.at) + (r.endedBy ? ' · ' + stamp('Ended', r.endedBy, r.endedAt) : '')),
        { cls: 'c-num wide', html: K.money(r.evening) }, { cls: 'c-num wide', html: K.money(r.day) },
        { cls: 'c-end', html: live ? K.pill('Current', 'ok') : r.from > K.today ? K.pill('Scheduled', 'info') : K.pill('Ended', '') }] };
    });
  }
  function pRates(c) {
    if (K.fin() === 'none') return finLocked('Rate profiles');
    var list = db.getRateProfiles(c.id), cur = db.getCurrentRate(c.id);
    var curCard = K.card({ title: 'Current rate', sub: 'Pay items keep the rate in force on the day of the session.', right: K.frozen('Never edited'), body: cur ? K.kv([['Evening (per hour)', '<span class="k-big num">' + K.money(cur.evening) + '</span>'], ['Day (per hour)', '<span class="k-big num">' + K.money(cur.day) + '</span>'], ['Effective from', K.d(cur.from)], ['Note', esc(cur.note || '—')]], true) +
      (cur.evening === 0 && cur.day === 0 ? ui.notice('info', cur.note || 'No per-session cost', 'Pay items still record the work at ' + K.money(0) + ' so sessions and cover stay visible.') : '') : '<p class="k-note">No rate profile.</p>' });
    var hist = K.card({ title: 'Rate history', sub: 'A new rate starts from a date and ends the previous one. Earlier rates are never edited.', body: K.table({ cols: 'minmax(0,2fr) 110px 110px auto', head: ['Effective', { label: 'Evening', cls: 'c-num wide' }, { label: 'Day', cls: 'c-num wide' }, ''], rows: rateRows(list) }) });
    var form = K.canFin() ? K.card({ title: 'Change rate', sub: 'Effective date must be after ' + K.d(cur ? cur.from : K.today) + '. Pay items already made keep their rate.', body: K.form([
      K.field('Effective from', K.input('rate-from', '2026-11-01', { type: 'date' })), K.field('Note', K.input('rate-note', '', { placeholder: 'Why the rate changes' })),
      K.field('Evening rate (£ per hour)', K.input('rate-evening', pounds(cur ? cur.evening : 0))), K.field('Day rate (£ per hour)', K.input('rate-day', pounds(cur ? cur.day : 0)))
    ]) + '<div class="k-bar co-formbar">' + K.actBtn('Add new rate', 'co-rate', { coach: c.id }, { variant: 'primary' }) + '</div>' }) : ui.notice('info', 'View only', 'Changing rates needs Finance access: Manage.');
    return K.grid([curCard + hist, form], '21');
  }

  /* ---------- Allocation list (shared by the workspace and the profile tab) ---------- */
  function allocTable(list, showCoach) {
    var rows = list.map(function (a) {
      var o = db.getOccurrence(a.occurrence);
      return { action: 'co-alloc', data: { id: a.id }, label: 'Open pay item ' + a.id, cells: [
        showCoach ? coachCell(a.coach, esc(o ? o.session : '') + ' · ' + K.dd(a.date)) : K.cell(esc(o ? o.session : a.occurrence), K.dd(a.date) + (o ? ', ' + o.start + '–' + o.end : '')),
        { cls: 'wide', html: esc(K.roleName(a.role)) + (a.cover ? ' ' + K.pill('Cover', 'info') : '') },
        { cls: 'c-num wide', html: a.units + ' h' }, { cls: 'c-num wide', html: K.money(a.rate) },
        { cls: 'c-num', html: '<b>' + K.money(a.cost) + '</b>' + (a.override ? '<small class="co-ovr">Adjusted</small>' : '') },
        { cls: 'c-end wide', html: K.status(a.state) }] };
    });
    var foot = '<span>' + list.length + ' pay item' + (list.length === 1 ? '' : 's') + ' · ' + K.sum(list, 'units') + ' h</span><span class="k-total">Total ' + K.money(K.sum(list, 'cost')) + '</span>';
    return K.table({ cols: 'minmax(0,2fr) minmax(0,.9fr) 70px 90px 110px 110px', head: [showCoach ? 'Coach' : 'Session', { label: 'Role', cls: 'wide' }, { label: 'Hours', cls: 'c-num wide' }, { label: 'Rate', cls: 'c-num wide' }, { label: 'Cost', cls: 'c-num' }, { label: 'State', cls: 'wide' }], rows: rows, empty: 'No pay items match.', foot: foot });
  }
  function pAllocs(c) {
    if (K.fin() === 'none') return finLocked('Coach pay and costs');
    var m = K.tab('co-palloc', [{ id: '2026-09' }, { id: '2026-10' }]);
    var list = db.getAllocations(function (a) { return a.coach === c.id && a.date.slice(0, 7) === m; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    return K.section('Work done and pay', 'One pay item per session worked, with the rate used and any adjustment. ' + K.link('mgmt-allocations', 'All pay items'),
      '<div class="k-bar">' + K.seg('co-palloc', [{ id: '2026-09', label: 'September' }, { id: '2026-10', label: 'October' }]) + '</div>' + allocTable(list, false));
  }

  /* ---------- Availability ---------- */
  function weekRow(key) {
    return db.getWeeklyAvailability(key).map(function (w, i) {
      return '<button type="button" class="co-wk__cell' + (w ? ' is-on' : '') + '" data-action="co-week" data-coach="' + key + '" data-day="' + i + '" aria-label="' + esc(db.coachName(key) + ', ' + db.getDows()[i]) + '">' + (w ? '<b class="num">' + w[0] + '</b><small class="num">' + w[1] + '</small>' : '<small>Off</small>') + '</button>';
    }).join('');
  }
  function exceptionRows(list, showCoach) {
    return list.map(function (e) {
      var past = e.to < K.today;
      return { cells: [showCoach ? coachCell(e.coach, range(e.from, e.to) + (e.start ? ', ' + e.start + '–' + e.end : '')) : K.cell(range(e.from, e.to) + (e.start ? ', ' + e.start + '–' + e.end : ''), esc(e.reason)),
        { cls: 'wide c-cell', html: (showCoach ? esc(e.reason) + '<br>' : '') + stamp('Recorded', e.by, e.at) },
        { cls: 'c-end', html: st(e.type) + (past ? K.pill('Past', '') : K.actBtn('Remove', 'co-exc-del', { id: e.id }, { size: 'sm', variant: 'tertiary' })) }] };
    });
  }
  function exceptionForm(coach) {
    var coaches = db.getCoaches().map(function (c) { return [c.id, c.name]; });
    return K.form([
      coach ? '' : K.field(one(), K.select('exc-coach', coaches, 'jack')),
      K.field('Type', K.select('exc-type', ['Holiday', 'Unavailable', 'Different hours'], 'Unavailable')),
      K.field('From', K.input('exc-from', '2026-10-20', { type: 'date' })), K.field('To', K.input('exc-to', '2026-10-20', { type: 'date' })),
      K.field('Start (optional)', K.input('exc-start', '', { type: 'time' }), 'Leave empty for the whole day'), K.field('End (optional)', K.input('exc-end', '', { type: 'time' })),
      K.field('Reason', K.input('exc-reason', '', { placeholder: 'For example: wedding, exam, hospital appointment' }), null, true)
    ].filter(Boolean)) + '<div class="k-bar co-formbar">' + K.actBtn('Add time off or a change', 'co-exc-add', coach ? { coach: coach } : {}, { variant: 'primary' }) + '</div>';
  }
  function pAvail(c) {
    var wk = K.card({ title: 'Weekly pattern', sub: 'When this ' + one().toLowerCase() + ' can usually work. Tap a day to change it. ' + stamp('Last updated', db.getWeeklyUpdated().by, db.getWeeklyUpdated().at), body:
      '<div class="co-wk co-wk--one"><div class="co-wk__head">' + db.getDows().map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</div><div class="co-wk__row">' + weekRow(c.id) + '</div></div>' });
    var ex = K.card({ title: 'Date exceptions', sub: 'Holidays, unavailable dates and different hours. Each one is checked before cover is offered.', body: K.table({ cols: 'minmax(0,1.4fr) minmax(0,1.4fr) auto', head: ['Dates', { label: 'Recorded', cls: 'wide' }, ''], rows: exceptionRows(db.getAvailabilityExceptions(c.id), false), empty: 'No time off or changes.' }) });
    var add = K.card({ title: 'Add an exception', sub: 'A holiday or absence that affects sessions also opens a cover request: use Record time off at the top.', body: exceptionForm(c.id) });
    return wk + K.grid([ex, add], 2);
  }

  /* ---------- Documents ---------- */
  function docRows(list, showCoach) {
    return list.map(function (d) {
      var t = db.getDocType(d.type), s = db.docState(d);
      return { route: 'mgmt-document/' + d.id, cells: [showCoach ? coachCell(d.coach, esc(t.name) + ' · ' + esc(d.ref || '')) : K.cell(esc(t.name), esc(d.ref || '') + ' · uploaded ' + K.dm(d.uploaded.at)),
        { cls: 'wide', html: d.expires ? K.d(d.expires) : '<span class="c-mute">No expiry</span>' },
        { cls: 'wide', html: d.reviewDue ? K.d(d.reviewDue) : '<span class="c-mute">—</span>' },
        { cls: 'wide c-cell', html: d.verification.state === 'Pending' ? '<span class="c-mute">Not checked yet</span>' : esc(d.verification.by) + ', ' + K.dt(d.verification.at) },
        { cls: 'c-end', html: st(s) }] };
    });
  }
  var DOC_COLS = 'minmax(0,1.6fr) 130px 130px minmax(0,1.2fr) 150px';
  function docHead(showCoach) { return [showCoach ? 'Coach' : 'Document', { label: 'Expires', cls: 'wide' }, { label: 'Review from', cls: 'wide' }, { label: 'Verified', cls: 'wide' }, '']; }
  function pDocs(c) {
    if (!K.feature('documents')) return K.featureOff('documents');
    var comp = db.getCoachCompliance(c.id), docs = db.getDocuments(function (d) { return d.coach === c.id; }).slice().sort(function (a, b) { return a.uploaded.at < b.uploaded.at ? 1 : -1; });
    var req = K.card({ title: 'Required for this ' + one().toLowerCase(), sub: 'Set per organisation in ' + K.link('mgmt-documents', 'Documents and compliance') + '.', body: ui.rows(comp.map(function (x) {
      return ui.row({ title: esc(x.type.name), sub: [x.doc ? (x.doc.expires ? (x.doc.expires < K.today ? 'Expired ' : 'Expires ') + K.d(x.doc.expires) : 'No expiry') : 'Nothing verified on file', x.pending ? 'Upload from ' + K.dm(x.pending.uploaded.at) + ' awaiting check' : ''], trail: st(x.state), href: (x.pending || x.doc) ? '#mgmt-document/' + (x.pending || x.doc).id : null });
    })) });
    var types = db.getDocTypes().map(function (t) { return [t.id, t.name]; });
    var add = K.card({ title: 'Record a document', sub: 'Adds it as pending verification. Someone else then checks the original.', body: K.form([
      K.field('Type', K.select('doc-type', types, 'firstaid')), K.field('Reference', K.input('doc-ref', '', { placeholder: 'Certificate number' })),
      K.field('Issued', K.input('doc-issued', K.today, { type: 'date' })), K.field('Expires', K.input('doc-expires', '2029-10-01', { type: 'date' }))
    ]) + '<div class="k-bar co-formbar">' + K.actBtn('Record document', 'co-doc-add', { coach: c.id }, { variant: 'primary' }) + '</div>' });
    return K.grid([req, add], 2) + K.section('All documents', 'Newest first, including expired and rejected uploads.', K.table({ cols: DOC_COLS, head: docHead(false), rows: docRows(docs, false), empty: 'No documents on file.' }));
  }

  /* ---------- Cover and summaries on the profile ---------- */
  function coverRows(list) {
    return list.map(function (r) {
      var done = r.needs.filter(function (n) { return n.state === 'Covered'; }).length;
      return { route: 'mgmt-cover-request/' + r.id, cells: [K.cell((r.coach ? esc(db.coachName(r.coach)) + ' · ' : '') + esc(r.kind), range(r.from, r.to) + ' · ' + esc(r.reason)),
        { cls: 'wide', html: K.id(r.id) }, { cls: 'c-num wide', html: done + ' / ' + r.needs.length + ' covered' }, { cls: 'c-end', html: st(db.coverStatus(r)) }] };
    });
  }
  var COVER_COLS = 'minmax(0,2fr) 90px 120px 130px';
  function pCover(c) {
    if (!K.feature('cover')) return K.featureOff('cover');
    var mine = db.getCoverRequests(function (r) { return r.coach === c.id; });
    var offers = [];
    db.getCoverRequests().forEach(function (r) { r.needs.forEach(function (n) { n.offers.forEach(function (f) { if (f.coach === c.id) offers.push({ r: r, n: n, f: f }); }); }); });
    return K.section('Absences', 'Holiday, illness and unavailable dates that needed cover.', K.table({ cols: COVER_COLS, head: ['Request', { label: 'Ref', cls: 'wide' }, { label: 'Dates', cls: 'c-num wide' }, ''], rows: coverRows(mine), empty: 'No absences recorded.' }), K.actBtn('Record absence', 'co-absence', { coach: c.id }, { size: 'sm', variant: 'secondary' })) +
      K.section('Cover offered to ' + first(c.name), 'Offers this ' + one().toLowerCase() + ' has been sent, and how they answered.', offers.length ? ui.rows(offers.map(function (x) {
        var o = db.getOccurrence(x.n.occurrence);
        return ui.row({ title: esc(occLabel(o)), sub: [stamp('Offered', x.f.sentBy, x.f.sentAt), x.f.note ? esc(x.f.note) : ''], trail: st(x.f.response || 'Offered'), href: '#mgmt-cover-request/' + x.r.id });
      })) : '<p class="k-note">No cover offers.</p>');
  }
  function summaryRows(list, showCoach) {
    return list.map(function (w) {
      return { route: 'mgmt-work-summary/' + w.id, cells: [showCoach ? coachCell(w.coach, w.label + ' · cycle ' + w.cycle) : K.cell(esc(w.label), 'Cycle ' + w.cycle + ' · lines frozen ' + K.dt(w.frozenAt)),
        { cls: 'c-num wide', html: String(w.lines.length) }, { cls: 'c-num wide', html: K.sum(w.lines, 'units') + ' h' },
        { cls: 'c-num', html: K.fin() === 'none' ? '<span class="c-mute">Restricted</span>' : '<b>' + K.money(w.total) + '</b>' }, { cls: 'c-end wide', html: st(w.state) }] };
    });
  }
  var WS_COLS = 'minmax(0,2fr) 80px 80px 110px 150px';
  function wsHead(showCoach) { return [showCoach ? 'Coach' : 'Period', { label: 'Sessions', cls: 'c-num wide' }, { label: 'Hours', cls: 'c-num wide' }, { label: 'Total', cls: 'c-num' }, { label: 'State', cls: 'wide' }]; }
  function pSummaries(c) {
    var list = db.getWorkSummaries(function (w) { return w.coach === c.id; }), r = db.getCurrentRate(c.id);
    var none = r && r.evening === 0 && r.day === 0 ? ui.notice('info', 'No monthly work summary', esc(r.note) + '. Sessions are still recorded as pay items at ' + K.money(0) + '.') : '';
    return none + K.section('Work summaries', 'A monthly check of work done. Not an invoice.', K.table({ cols: WS_COLS, head: wsHead(false), rows: summaryRows(list, false), empty: 'No work summaries.' }));
  }

  /* ============================================================ ROLES MATRIX */
  Hub.screens['mgmt-coach-roles'] = function (ctx) {
    var h = K.head({ back: ['mgmt-coaches', word()], eyebrow: word(), title: 'Session roles and permissions', sub: 'A role is set per session. It decides what a person can see and do for that session’s players.' });
    var g = K.guard(ctx, h, { empty: ['shield', 'No roles yet', 'Session roles appear here once the organisation is set up.'] }); if (g) return g;
    var roles = db.getRoles(), perms = db.getPermissions(), asg = db.getAssignments();
    var matrix = '<div class="co-matrix" role="table" aria-label="Permissions by role"><div class="co-matrix__row co-matrix__head" role="row"><span role="columnheader">Permission</span>' + roles.map(function (r) { return '<span role="columnheader">' + esc(r.name) + '</span>'; }).join('') + '</div>' +
      perms.map(function (p) {
        return '<div class="co-matrix__row" role="row"><span role="rowheader"><b>' + esc(p.label) + '</b><small>' + esc(p.hint) + '</small></span>' + roles.map(function (r) {
          return '<span role="cell">' + K.toggle(r.perms[p.id], 'co-perm', { role: r.id, perm: p.id }, r.name + ': ' + p.label) + '</span>';
        }).join('') + '</div>';
      }).join('') + '</div>';
    var cards = roles.map(function (r) {
      var holders = asg.filter(function (a) { return a.role === r.id; });
      var names = holders.map(function (a) { return a.coach; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
      return K.card({ title: r.name, sub: esc(r.desc), body: '<p class="k-note">' + (r.id === 'office' ? 'Office staff (not on session staff).' : holders.length + ' regular assignment' + (holders.length === 1 ? '' : 's') + ': ' + names.map(function (k) { return K.link('mgmt-coach/' + k, db.coachName(k)); }).join(', ')) + '</p>' });
    });
    var ovr = db.getRoleOverrides(), rem = db.getRemovedAssignments();
    return page(h, K.section('Permissions by role', 'Switch a permission on or off for everyone in that role. Changes apply straight away and are recorded.', '<div class="lx-card co-matrix-wrap">' + matrix + '</div>') +
      K.grid(cards, 2) +
      K.grid([
        K.card({ title: 'Temporary role changes', sub: 'Across all ' + word().toLowerCase() + '.', body: ovr.length ? ui.rows(ovr.map(function (o) { var s = db.getSession(o.session); return ui.row({ title: esc(db.coachName(o.coach)) + ' · ' + esc(db.getRole(o.role).name) + ' on ' + esc(s ? s.name : o.session), sub: [K.dm(o.from) + ' – ' + K.dm(o.to), esc(o.reason), stamp('Set', o.by, o.at)], trail: o.ended ? K.pill('Ended', '') : K.pill(o.from > K.today ? 'Scheduled' : 'Active', o.from > K.today ? 'info' : 'ok'), href: '#mgmt-coach/' + o.coach }); })) : '<p class="k-note">None.</p>' }),
        K.card({ title: 'Former access (21 days)', sub: 'Read-only access that remains after someone is removed from a session.', body: rem.length ? ui.rows(rem.map(function (r) { var n = db.accessDaysLeft(r); return ui.row({ title: esc(db.coachName(r.coach)) + ' · ' + esc(r.sessionName), sub: [stamp('Removed', r.by, r.removedAt), esc(r.reason)], trail: K.pill(n > 0 ? 'Ends in ' + n + ' day' + (n === 1 ? '' : 's') : 'Ended', n > 0 ? 'warn' : ''), href: '#mgmt-coach/' + r.coach }); })) : '<p class="k-note">None.</p>' })
      ], 2) +
      K.section('Changes to roles', 'Who changed a permission, and when.', K.card({ body: K.timeline(db.getRoleHistory()) })));
  };

  /* ============================================================ ALLOCATIONS */
  Hub.screens['mgmt-allocations'] = function (ctx) {
    var h = K.head({ back: ['mgmt-coaches', word()], eyebrow: word(), title: 'Coach pay', sub: 'One coach on one session. Each keeps the rate used, the hours worked and any adjustment with its reason.' });
    var g = K.guard(ctx, h, { empty: ['finance', 'No pay items yet', 'Pay items are created when coaches are put on sessions.'] }); if (g) return g;
    if (K.fin() === 'none') return page(h, finLocked('Coach pay and costs'));
    var m = K.tab('co-al-month', [{ id: '2026-09' }, { id: '2026-10' }]), s = K.tab('co-al-state', [{ id: 'all' }, { id: 'Draft' }, { id: 'Confirmed' }, { id: 'Exported' }]);
    var coach = Hub.wsTabs['co-al-coach'] || 'all';
    var month = db.getAllocations(function (a) { return a.date.slice(0, 7) === m; });
    var list = month.filter(function (a) { return (s === 'all' || a.state === s) && (coach === 'all' || a.coach === coach); }).sort(function (a, b) { return a.date === b.date ? (a.coach < b.coach ? -1 : 1) : a.date < b.date ? -1 : 1; });
    var finTotal = db.fin.monthSummary(m).totals.coach, monthTotal = K.sum(month, 'cost'), filtered = s !== 'all' || coach !== 'all';
    var label = m === '2026-09' ? 'September' : 'October';
    var stats = K.stats([
      { label: 'Pay items', value: list.length, sub: list.filter(function (a) { return a.state === 'Draft'; }).length + ' draft · ' + list.filter(function (a) { return a.state === 'Exported'; }).length + ' sent for payment' },
      { label: 'Hours', value: K.sum(list, 'units'), sub: label + (filtered ? ' · filtered' : '') },
      { label: 'Cost', value: K.money(K.sum(list, 'cost')), sub: filtered ? 'Filtered subtotal' : 'All ' + label + ' pay items' },
      { label: 'Adjusted', value: list.filter(function (a) { return a.override; }).length, sub: 'Each with a reason', tone: list.some(function (a) { return a.override; }) ? 'warn' : '' }
    ]);
    var rec = ui.notice(monthTotal === finTotal ? 'ok' : 'danger', monthTotal === finTotal ? 'Matches Finance' : 'Does not match Finance', 'All ' + label + ' pay items total <b class="num">' + K.money(monthTotal) + '</b>; Finance shows coach costs of <b class="num">' + K.money(finTotal) + '</b> for ' + label + '. ' + K.link('mgmt-fin-reports', 'Finance reports'));
    var coaches = [['all', 'All ' + word().toLowerCase()]].concat(db.getCoaches().map(function (c) { return [c.id, c.name]; }));
    var bar = '<div class="lx-filterbar">' + K.seg('co-al-month', [{ id: '2026-09', label: 'September' }, { id: '2026-10', label: 'October' }]) +
      K.seg('co-al-state', [{ id: 'all', label: 'All states' }, { id: 'Draft', label: 'Draft' }, { id: 'Confirmed', label: 'Confirmed' }, { id: 'Exported', label: 'Sent for payment' }]) + filterSelect('co-al-coach', 'Coach', coaches) + '</div>';
    return page(h, stats + rec + K.section(label + ' 2026', 'Draft until the session happens, Confirmed after, Sent for payment once the work summary is finalised. Pay items sent for payment cannot change.', bar + allocTable(list, true)));
  };
  Hub.actions['co-alloc'] = function (el) {
    var a = db.getAllocation(el.dataset.id); if (!a) return;
    var o = db.getOccurrence(a.occurrence), canEdit = K.canFin() && a.state === 'Draft';
    var body = K.kv([['Coach', K.link('mgmt-coach/' + a.coach, db.coachName(a.coach))], ['Session', o ? K.link('mgmt-occurrence/' + o.id, occLabel(o)) : esc(a.occurrence)], ['Role', esc(a.role || '—')],
      ['Rate used', K.money(a.rate) + ' per hour <small class="c-mute">' + (a.rateSource === 'occurrence' ? '(set for this session' + (a.rateNote ? ': ' + esc(a.rateNote.reason) : '') + ')' : '(normal rate on the day)') + '</small>'], ['Hours', a.units + ' hours'], ['Calculated', K.money(Math.round(a.rate * a.units))],
      ['Final cost', '<b>' + K.money(a.cost) + '</b>'], ['State', K.status(a.state) + (a.exported ? ' ' + stamp('Sent for payment', a.exported.by, a.exported.at) : '') + (a.confirmedBy ? ' ' + stamp('Confirmed', a.confirmedBy.by, a.confirmedBy.at) : '')]]) +
      (a.override ? ui.notice('warn', 'Override: ' + K.money(a.override.cost), esc(a.override.reason) + '<br>' + stamp('Set', a.override.by, a.override.at)) : '') +
      (a.overrideHistory || []).map(function (x) { return '<p class="k-note">Earlier adjustment ' + K.money(x.cost) + ' removed · ' + stamp('Removed', x.removedBy, x.removedAt) + '</p>'; }).join('') +
      (canEdit ? '<div class="co-sheetform">' + K.form([K.field('Adjusted pay (£)', K.input('al-cost', pounds(a.cost))), K.field('Reason (required)', K.textarea('al-reason', '', 'Why this pay is different'), null, true)], 1) + '</div>' :
        a.state === 'Exported' ? '<p class="k-note">' + K.frozen('Sent for payment · frozen') + ' Pay items sent for payment are never edited. Reopen the work summary to correct one.</p>' :
        a.state === 'Confirmed' ? '<p class="k-note">' + K.frozen('Actual pay · fixed') + ' Fixed when the session was confirmed as delivered. It isn’t edited here.</p>' : '') +
      (a.state === 'Draft' ? '<p class="k-note">Expected pay. It becomes actual when the session is confirmed as delivered.' + (o ? ' ' + K.link('mgmt-occurrence/' + o.id, 'Open the session') : '') + '</p>' : '');
    K.sheet({ overline: '<span class="overline">' + esc(a.id) + '</span>', title: 'Pay item', body: body,
      foot: ui.btn('Close', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + (canEdit && a.override ? K.actBtn('Remove override', 'co-alloc-clear', { id: a.id }, { variant: 'secondary' }) : '') + (canEdit ? K.actBtn('Save override', 'co-alloc-ovr', { id: a.id }, { variant: 'primary' }) : '') });
  };
  Hub.actions['co-alloc-ovr'] = function (el) {
    var cost = pence(K.val('al-cost')), reason = K.val('al-reason').trim();
    if (cost == null || cost < 0) { Hub.toast('Enter a cost in pounds'); return; }
    if (!reason) { Hub.toast('A reason is required for an adjustment'); return; }
    var a = db.getAllocation(el.dataset.id), was = a.cost; Hub.closeSheet(true);
    Hub.mutate(function () { db.overrideAllocation(a.id, cost, reason, K.me(), K.now()); }, 'Pay adjusted: ' + K.money(cost), log('Pay item ' + a.id + ' adjusted: ' + reason, a.id, { before: K.money(was), after: K.money(cost), finance: true }));
  };
  Hub.actions['co-alloc-clear'] = function (el) { var id = el.dataset.id; Hub.closeSheet(true); Hub.mutate(function () { db.clearAllocationOverride(id, K.me(), K.now()); }, 'Adjustment removed', log('Pay item ' + id + ' adjustment removed', id, { finance: true })); };

  /* ============================================================ AVAILABILITY */
  Hub.screens['mgmt-availability'] = function (ctx) {
    var h = K.head({ back: ['mgmt-coaches', word()], eyebrow: word(), title: 'Availability', sub: 'Each ' + one().toLowerCase() + '’s usual week, plus the dates that differ. Cover suggestions use both.' });
    var g = K.guard(ctx, h, { empty: ['calendar', 'No availability yet', 'Coaches set their usual week in the ' + one() + ' hub.'] }); if (g) return g;
    var now = db.getAvailabilityExceptions().filter(function (e) { return e.from <= K.today && e.to >= K.today; });
    var alerts = now.map(function (e) { return ui.notice(e.type === 'Different hours' ? 'warn' : 'danger', db.coachName(e.coach) + ': ' + e.type.toLowerCase() + ' today' + (e.start ? ', ' + e.start + '–' + e.end : ''), esc(e.reason) + ' · ' + stamp('Recorded', e.by, e.at), { action: K.goBtn('Cover', 'mgmt-cover', { size: 'sm', variant: 'secondary' }) }); }).join('');
    var grid = '<div class="co-wk"><div class="co-wk__head"><span>' + esc(one()) + '</span>' + db.getDows().map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</div>' +
      db.getCoaches().map(function (c) { return '<div class="co-wk__row"><a class="co-wk__name" href="#mgmt-coach/' + c.id + '">' + ui.avatar(c.name, 'sm') + '<span>' + esc(c.name) + '</span></a>' + weekRow(c.id) + '</div>'; }).join('') + '</div>';
    var f = K.tab('co-exc', [{ id: 'upcoming' }, { id: 'past' }, { id: 'all' }]);
    var ex = db.getAvailabilityExceptions().filter(function (e) { return f === 'all' || (f === 'upcoming' ? e.to >= K.today : e.to < K.today); });
    return page(h, alerts + K.section('Weekly pattern', 'Tap a day to change it. ' + stamp('Last updated', db.getWeeklyUpdated().by, db.getWeeklyUpdated().at), '<div class="lx-card co-wk-wrap">' + grid + '</div>') +
      K.grid([K.section('Date exceptions', 'Holidays, unavailable dates and different hours.', '<div class="k-bar">' + K.seg('co-exc', [{ id: 'upcoming', label: 'Today and later' }, { id: 'past', label: 'Past' }, { id: 'all', label: 'All' }]) + '</div>' +
        K.table({ cols: 'minmax(0,1.4fr) minmax(0,1.6fr) auto', head: ['Coach and dates', { label: 'Reason', cls: 'wide' }, ''], rows: exceptionRows(ex, true), empty: 'No time off or changes.' })),
        K.card({ title: 'Add an exception', sub: 'To open cover for an absence, use Record time off on the Coaches page.', body: exceptionForm(null) })], '21'));
  };
  Hub.actions['co-week'] = function (el) {
    var key = el.dataset.coach, i = +el.dataset.day, w = db.getWeeklyAvailability(key)[i];
    K.sheet({ overline: '<span class="overline">' + esc(db.coachName(key)) + '</span>', title: 'Usual hours on ' + db.getDows()[i] + 's', body: K.form([K.field('From', K.input('wk-start', w ? w[0] : '16:00', { type: 'time' })), K.field('Until', K.input('wk-end', w ? w[1] : '20:00', { type: 'time' }))]) + '<p class="k-note">Changes to the usual week apply from today. Sessions already staffed are not changed.</p>',
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Not available', 'co-week-save', { coach: key, day: i, off: 1 }, { variant: 'secondary' }) + K.actBtn('Save hours', 'co-week-save', { coach: key, day: i }, { variant: 'primary' }) });
  };
  Hub.actions['co-week-save'] = function (el) {
    var key = el.dataset.coach, i = +el.dataset.day, off = !!el.dataset.off, a = K.val('wk-start'), b = K.val('wk-end');
    if (!off && (!a || !b || a >= b)) { Hub.toast('Pick a start before the end'); return; }
    Hub.closeSheet(true);
    Hub.mutate(function () { db.setWeeklyAvailability(key, i, off ? null : [a, b], K.me(), K.now()); }, db.coachName(key) + ': ' + db.getDows()[i] + ' ' + (off ? 'not available' : a + '–' + b), log(db.coachName(key) + ' usual ' + db.getDows()[i] + ' changed to ' + (off ? 'not available' : a + '–' + b), key));
  };
  Hub.actions['co-exc-add'] = function (el) {
    var coach = el.dataset.coach || K.val('exc-coach'), from = K.val('exc-from'), to = K.val('exc-to'), a = K.val('exc-start'), b = K.val('exc-end'), type = K.val('exc-type'), reason = K.val('exc-reason').trim();
    if (!from || !to || to < from) { Hub.toast('Check the dates'); return; }
    if (type === 'Different hours' && (!a || !b)) { Hub.toast('Different hours needs a start and end'); return; }
    if (!reason) { Hub.toast('Add a reason'); return; }
    Hub.mutate(function () { db.addAvailabilityException({ coach: coach, type: type, from: from, to: to, start: a || null, end: b || null, reason: reason, by: K.me(), at: K.now() }); }, type + ' added for ' + db.coachName(coach), log(type + ' recorded for ' + db.coachName(coach) + ' ' + range(from, to), coach));
  };
  Hub.actions['co-exc-del'] = function (el) { var id = el.dataset.id; Hub.mutate(function () { db.removeAvailabilityException(id); }, 'Time off removed', log('Availability exception ' + id + ' removed', id)); };

  /* ============================================================ DOCUMENTS */
  Hub.screens['mgmt-documents'] = function (ctx) {
    var h = K.head({ back: ['mgmt-coaches', word()], eyebrow: word(), title: 'Documents and compliance', sub: 'What each role must hold, what is on file, and what needs checking before it lapses.' });
    var g = K.guard(ctx, h, { empty: ['book', 'No documents yet', 'Coaches upload certificates in the ' + one() + ' hub; they appear here for checking.'] }); if (g) return g;
    if (!K.feature('documents')) return page(h, K.featureOff('documents'));
    var issues = db.getComplianceIssues();
    function n(k) { return issues.filter(function (x) { return x.kind === k; }).length; }
    var KIND = { expired: 'Expired', missing: 'Missing', expiring: 'Expiring', pending: 'New upload to check' };
    var nAct = n('expired') + n('missing') + n('pending'), firstIssue = issues[0];
    var sit = !issues.length ? K.situation({ tone: 'ok', title: 'All documents current', text: 'Nothing expired, missing or waiting to be checked.' }) :
      K.situation({ tone: n('expired') || n('missing') ? 'danger' : n('pending') ? 'warn' : 'info',
        title: (nAct ? nAct + ' document' + (nAct === 1 ? '' : 's') + ' need' + (nAct === 1 ? 's' : '') + ' you' : n('expiring') + ' expiring soon'),
        text: [n('expired') ? n('expired') + ' expired: those coaches should not be staffed until replaced' : '', n('missing') ? n('missing') + ' missing' : '', n('pending') ? n('pending') + ' new upload' + (n('pending') === 1 ? '' : 's') + ' to check against the original' : '', n('expiring') ? n('expiring') + ' expiring soon' : ''].filter(Boolean).join(' · ') + '.',
        primary: firstIssue ? ui.btn(firstIssue.kind === 'pending' ? 'Review document' : 'Open the first', { variant: 'primary', href: '#' + (firstIssue.doc ? 'mgmt-document/' + firstIssue.doc : 'mgmt-coach/' + firstIssue.coach) }) : '' });
    var issueList = issues.length ? ui.rows(issues.map(function (x) {
      return ui.row({ lead: ui.sev(x.severity), title: esc(x.title), sub: [esc(x.typeName), x.date ? (x.kind === 'pending' ? 'Uploaded ' : x.kind === 'expired' ? 'Expired ' : 'Expires ') + K.d(x.date) : 'Nothing on file'], trail: st(KIND[x.kind]), href: '#' + (x.doc ? 'mgmt-document/' + x.doc : 'mgmt-coach/' + x.coach) });
    }), 'rows--lead') : '';
    var req = K.table({ cols: 'minmax(0,1.4fr) minmax(0,1.4fr) 100px 130px', head: ['Document type', { label: 'Required for', cls: 'wide' }, { label: 'Valid for', cls: 'wide' }, 'Review lead time'], rows: db.getDocTypes().map(function (t) {
      return { cells: [K.cell(esc(t.name), stamp('Set', t.by, t.at)), { cls: 'wide c-cell', html: esc(t.appliesTo.map(function (r) { return db.getRole(r).name; }).join(', ')) }, { cls: 'wide', html: t.validYears ? t.validYears + ' years' : 'No expiry' },
        { cls: 'c-end', html: t.validYears ? K.actBtn(t.leadDays + ' days', 'co-lead', { type: t.id }, { size: 'sm', variant: 'secondary' }) : '<span class="c-mute">Review every ' + t.reviewMonths + ' months</span>' }] };
    }) });
    var f = K.tab('co-docs', [{ id: 'action' }, { id: 'all' }, { id: 'pending' }, { id: 'expired' }]);
    var docs = db.getDocuments().filter(function (d) { var s = db.docState(d); return f === 'all' || (f === 'pending' && s === 'Pending verification') || (f === 'expired' && s === 'Expired') || (f === 'action' && s !== 'Verified'); }).sort(function (a, b) { return a.coach === b.coach ? (a.type < b.type ? -1 : 1) : db.coachName(a.coach) < db.coachName(b.coach) ? -1 : 1; });
    return page(h, sit + (issueList ? K.section('Needs you', 'Each one stays in Needs Attention until it is fixed.', '<div class="zone-inset">' + issueList + '</div>') : '') +
      K.details('All documents on file', '<div class="k-bar">' + K.seg('co-docs', [{ id: 'action', label: 'Needs action' }, { id: 'all', label: 'All' }, { id: 'pending', label: 'To check' }, { id: 'expired', label: 'Expired' }]) + '</div>' +
        K.table({ cols: DOC_COLS, head: docHead(true), rows: docRows(docs, true), empty: 'Nothing here.' }), { sub: db.getDocuments().length + ' uploads' }) +
      K.details('Required documents', req, { sub: 'What each role must hold, and when review starts' }));
  };
  Hub.actions['co-lead'] = function (el) {
    var t = db.getDocType(el.dataset.type);
    K.sheet({ overline: '<span class="overline">Required documents</span>', title: esc(t.name) + ': review lead time', body: K.form([K.field('Start review this many days before expiry', K.select('lead-days', [14, 21, 30, 45, 60, 90].map(function (d) { return [d, d + ' days']; }), t.leadDays))], 1) + '<p class="k-note">Documents expiring inside this window show as Expiring and raise a case in Needs Attention.</p>',
      foot: sheetFoot('Save', 'co-lead-save', { type: t.id }) });
  };
  Hub.actions['co-lead-save'] = function (el) { var t = db.getDocType(el.dataset.type), d = +K.val('lead-days'), was = t.leadDays; Hub.closeSheet(true); Hub.mutate(function () { db.setDocLeadDays(t.id, d, K.me(), K.now()); }, t.name + ' review lead time: ' + d + ' days', log(t.name + ' review lead time changed', t.id, { before: was + ' days', after: d + ' days' })); };

  Hub.screens['mgmt-document'] = function (ctx) {
    var d = db.getDocument(ctx.param), t = d && db.getDocType(d.type);
    var h = K.head({ back: ['mgmt-documents', 'Documents and compliance'], eyebrow: d ? db.coachName(d.coach) : 'Document', title: t ? t.name : 'Document',
      sub: d ? (d.expires ? 'Expires ' + K.d(d.expires) : 'No expiry') : '',
    });
    var g = K.guard(ctx, h, { empty: ['book', 'Nothing to show', 'This document has no details yet.'] }); if (g) return g;
    if (!d) return notFound(h, 'Document');
    var s = db.docState(d), others = db.getDocuments(function (x) { return x.coach === d.coach && x.type === d.type && x.id !== d.id; });
    var who = first(db.coachName(d.coach)), pend = others.filter(function (x) { return x.verification.state === 'Pending'; })[0];
    var verifyBtns = { primary: K.actBtn('Approve', 'co-doc-verify', { id: d.id }, { variant: 'primary', icon: 'check' }), secondary: K.actBtn('Reject', 'co-doc-reject', { id: d.id }, { variant: 'secondary' }) };
    var sit = s === 'Expired' ? K.situation({ tone: 'danger', kicker: 'Expired ' + K.d(d.expires), title: esc(t.name) + ' expired', text: who + ' should not be staffed until it is replaced. ' + (pend ? 'A newer upload is waiting to be checked.' : 'Ask ' + who + ' to upload a new one.'), primary: pend ? ui.btn('Check the new upload', { variant: 'primary', href: '#mgmt-document/' + pend.id }) : '' }) :
      s === 'Pending verification' ? K.situation({ tone: 'warn', kicker: 'Uploaded ' + K.dm(d.uploaded.at), title: 'New ' + esc(t.name) + ' uploaded', text: 'Check the original document before approving. The person approving should not be the person who uploaded it.', primary: verifyBtns.primary, secondary: verifyBtns.secondary }) :
      s === 'Expiring' ? K.situation({ tone: 'warn', title: 'Expires in ' + K.daysBetween(K.today, d.expires) + ' days', text: 'Ask ' + who + ' for the renewal now. Review started ' + K.d(d.reviewDue) + '.' }) :
      s === 'Rejected' ? K.situation({ tone: 'danger', title: 'Rejected', text: esc(d.verification.note) + ' ' + who + ' needs to upload a new one.' }) :
      K.situation({ tone: 'ok', title: esc(t.name) + ' is current', text: d.expires ? 'Valid until ' + K.d(d.expires) + '.' : 'No expiry.' });
    var stateNote = sit;
    var details = K.card({ title: 'Details', body: K.kv([['Coach', K.link('mgmt-coach/' + d.coach, db.coachName(d.coach))], ['Type', esc(t.name)], ['Reference', esc(d.ref || '—')], ['Issued', K.d(d.issued)], ['Expires', d.expires ? K.d(d.expires) : 'No expiry'],
      ['Review from', d.reviewDue ? K.d(d.reviewDue) : '—'], ['State', st(s)], ['Uploaded', stamp('Uploaded', d.uploaded.by, d.uploaded.at)], ['Checked', d.verification.state === 'Verified' ? stamp('Approved', d.verification.by, d.verification.at) : d.verification.state === 'Rejected' ? stamp('Rejected', d.verification.by, d.verification.at) : '<span class="c-mute">Not checked yet</span>']]) });
    var scan = K.card({ title: 'Uploaded file', sub: 'Certificate scan provided by the coach.', body: '<div class="co-scan" aria-label="Certificate preview">' + I('book') + '<b>' + esc(t.name) + '</b><small>' + esc(d.ref || '') + ' · ' + esc(db.coachName(d.coach)) + '</small></div>' });
    var hist = K.details('History', K.timeline(d.history.slice().reverse()), { sub: 'Uploads, checks and changes' });
    var prev = others.length ? K.card({ title: 'Other ' + t.name.toLowerCase() + ' uploads', body: ui.rows(others.map(function (x) { return ui.row({ title: esc(x.ref || x.id), sub: [x.expires ? 'Expires ' + K.d(x.expires) : 'No expiry', 'Uploaded ' + K.dm(x.uploaded.at)], trail: st(db.docState(x)), href: '#mgmt-document/' + x.id }); })) }) : '';
    return page(h, stateNote + K.grid([details, scan + prev], '21') + hist);
  };
  Hub.actions['co-doc-verify'] = function (el) { var d = db.getDocument(el.dataset.id); Hub.mutate(function () { db.verifyDocument(d.id, K.me(), K.now()); }, db.getDocType(d.type).name + ' verified', log(db.getDocType(d.type).name + ' for ' + db.coachName(d.coach) + ' verified', d.id, { before: 'Pending', after: 'Verified' })); };
  Hub.actions['co-doc-reject'] = function (el) {
    var d = db.getDocument(el.dataset.id);
    K.sheet({ overline: '<span class="overline">' + esc(d.id) + '</span>', title: 'Reject ' + esc(db.getDocType(d.type).name), body: K.form([K.field('Reason (sent to ' + esc(db.coachName(d.coach)) + ')', K.textarea('rej-reason', '', 'For example: name does not match, photo unreadable'), null, true)], 1), foot: sheetFoot('Reject document', 'co-doc-reject-go', { id: d.id }) });
  };
  Hub.actions['co-doc-reject-go'] = function (el) {
    var d = db.getDocument(el.dataset.id), r = K.val('rej-reason').trim(); if (!r) { Hub.toast('Add a reason'); return; }
    Hub.closeSheet(true); Hub.mutate(function () { db.rejectDocument(d.id, r, K.me(), K.now()); }, 'Document rejected', log(db.getDocType(d.type).name + ' for ' + db.coachName(d.coach) + ' rejected: ' + r, d.id, { before: 'Pending', after: 'Rejected' }));
  };
  Hub.actions['co-doc-add'] = function (el) {
    var coach = el.dataset.coach, type = K.val('doc-type'), ref = K.val('doc-ref').trim(), iss = K.val('doc-issued'), exp = K.val('doc-expires'), t = db.getDocType(type);
    if (!ref) { Hub.toast('Add the certificate reference'); return; }
    if (t.validYears && (!exp || exp <= iss)) { Hub.toast('Expiry must be after the issue date'); return; }
    var at = K.now();
    Hub.mutate(function () { db.addDocument({ coach: coach, type: type, ref: ref, issued: iss, expires: t.validYears ? exp : null, uploaded: { by: K.me(), at: at } }); }, t.name + ' recorded, pending verification', log(t.name + ' recorded for ' + db.coachName(coach), coach));
  };

  /* ============================================================ COVER */
  var NEED_ORDER = ['Open', 'Needs a phone call', 'Offered', 'Accepted', 'Covered'];
  /* Cover: what does each date mean and what is the next step */
  function coverWords(r, n) {
    var acc = n.offers.filter(function (f) { return f.response === 'Accepted'; }).slice(-1)[0];
    var waiting = n.offers.filter(function (f) { return !f.response; });
    if (n.state === 'Covered') return { tone: 'ok', title: db.coachName(n.confirmed.coach) + ' is covering', act: false };
    if (n.state === 'Accepted' && acc) return { tone: 'info', title: db.coachName(acc.coach) + ' can cover: confirm', act: true };
    if (n.state === 'Needs a phone call') return { tone: 'warn', title: 'Needs a phone call', act: true };
    if (waiting.length) return { tone: 'info', title: 'Waiting for ' + waiting.map(function (f) { return first(db.coachName(f.coach)); }).join(' and ') + ' to reply', act: false };
    if (n.offers.length) return { tone: 'danger', title: 'No one has said yes yet', act: true };
    return { tone: 'warn', title: 'Cover still needed', act: true };
  }
  Hub.screens['mgmt-cover'] = function (ctx) {
    var h = K.head({ back: ['mgmt-coaches', word()], eyebrow: word(), title: 'Cover', sub: 'Sessions where a coach can’t make it, and what to do next.',
      actions: K.actBtn('Record time off', 'co-absence', {}, { variant: 'secondary', icon: 'plus' }) });
    var g = K.guard(ctx, h, { empty: ['swap', 'No cover needed', 'Holidays, illness and unstaffed sessions appear here.'] }); if (g) return g;
    if (!K.feature('cover')) return page(h, K.featureOff('cover'));
    var all = [];
    db.getCoverRequests().forEach(function (r) { r.needs.forEach(function (n) { all.push({ r: r, n: n, o: db.getOccurrence(n.occurrence) }); }); });
    var open = all.filter(function (x) { return x.n.state !== 'Covered'; }).sort(function (a, b) { return (a.o.date + a.o.start) < (b.o.date + b.o.start) ? -1 : 1; });
    var act = open.filter(function (x) { return coverWords(x.r, x.n).act; });
    var sit = !open.length ? K.situation({ tone: 'ok', title: 'All covered', text: 'There are no open cover requests.' })
      : act.length ? K.situation({ tone: 'warn', title: act.length + ' session' + (act.length === 1 ? ' needs' : 's need') + ' you', text: 'Open one to ask a coach or confirm someone who said yes.', primary: K.goBtn('Open the first', 'mgmt-cover-request/' + act[0].r.id, { variant: 'primary', trail: 'arrowRight' }) })
      : K.situation({ tone: 'info', title: 'Waiting for replies', text: 'Coaches have been asked for every open session. No action needed yet.' });
    var rows = open.map(function (x) {
      var w = coverWords(x.r, x.n), soon = K.daysBetween(K.today, x.o.date);
      var who = x.r.coach ? first(db.coachName(x.r.coach)) + ' can’t coach' : 'No coach yet';
      return ui.row({ lead: ui.sev(w.tone === 'danger' || soon <= 1 ? 'Urgent' : w.act ? 'Warning' : 'Normal'), title: esc(x.o.session) + ' · ' + (soon === 0 ? 'Today' : soon === 1 ? 'Tomorrow' : esc(K.dd(x.o.date))) + ', ' + x.o.start,
        sub: [esc(who), esc(w.title)], href: '#mgmt-cover-request/' + x.r.id, trail: w.act ? '<span class="k-needs__act">Sort it</span>' : '' });
    });
    var f = K.tab('co-cvr', [{ id: 'open' }, { id: 'all' }]);
    var reqs = db.getCoverRequests(function (r) { return f === 'all' || db.coverStatus(r) !== 'Covered'; });
    var reqTable = '<div class="k-bar">' + K.seg('co-cvr', [{ id: 'open', label: 'Not yet covered' }, { id: 'all', label: 'All' }]) + '</div>' + K.table({ cols: COVER_COLS, head: ['Request', { label: 'Ref', cls: 'wide' }, { label: 'Dates', cls: 'c-num wide' }, ''], rows: coverRows(reqs), empty: 'No requests.' });
    return page(h, sit + (open.length ? K.list(rows) : '') + K.details('All cover requests', reqTable, { sub: 'Each absence and its dates, including covered ones' }));
  };
  Hub.actions['co-absence'] = function (el) {
    var coaches = db.getCoaches().filter(function (c) { return c.active; }).map(function (c) { return [c.id, c.name]; });
    K.sheet({ overline: '<span class="overline">Cover</span>', title: 'Record time off', body: K.form([
      K.field(one(), K.select('abs-coach', coaches, el.dataset.coach || 'priya')), K.field('Type', K.select('abs-kind', ['Holiday', 'Illness'], 'Holiday')),
      K.field('From', K.input('abs-from', '2026-10-19', { type: 'date' })), K.field('To', K.input('abs-to', '2026-10-23', { type: 'date' })),
      K.field('Reason', K.input('abs-reason', '', { placeholder: 'Shown to management only' }), null, true)]) +
      '<p class="k-note">Every session this ' + esc(one().toLowerCase()) + ' is on in that range becomes a separate date needing cover.</p>', foot: sheetFoot('Record and find cover', 'co-absence-go', {}) });
  };
  Hub.actions['co-absence-go'] = function () {
    var o = { coach: K.val('abs-coach'), kind: K.val('abs-kind'), from: K.val('abs-from'), to: K.val('abs-to'), reason: K.val('abs-reason').trim() || (K.val('abs-kind') === 'Illness' ? 'Unwell' : 'Holiday') };
    if (!o.from || !o.to || o.to < o.from) { Hub.toast('Check the dates'); return; }
    if (o.to < K.today) { Hub.toast('Pick dates from today onwards'); return; }
    Hub.closeSheet(true);
    var r = Hub.mutate(function () { return db.addCoverRequest(o, K.me(), K.now()); }, o.kind + ' recorded for ' + db.coachName(o.coach), log(o.kind + ' recorded for ' + db.coachName(o.coach) + ' ' + range(o.from, o.to), o.coach));
    if (r) location.hash = 'mgmt-cover-request/' + r.id;
  };

  /* One date that needs cover: the state in plain words and the next step,
     then the best options, then who was already asked. Details and the
     calculation sit behind a collapsed section. */
  function needCard(r, n) {
    var o = db.getOccurrence(n.occurrence), w = coverWords(r, n), fin = K.fin() !== 'none';
    var absent = r.coach ? db.coachName(r.coach) : null;
    var when = esc(K.dd(o.date)) + ' · ' + o.start + '–' + o.end + ' · ' + esc(db.venueName(o.venue)) + ' · ' + o.players + ' players';
    var cands = n.state === 'Covered' ? [] : db.getCoverCandidates(r.id, n.id), ok = cands.filter(function (x) { return x.eligible; }), no = cands.filter(function (x) { return !x.eligible; });
    var acc = n.offers.filter(function (f) { return f.response === 'Accepted'; }).slice(-1)[0];
    var waiting = n.offers.filter(function (f) { return !f.response; });
    function opt(x, primary) {
      var nm = first(x.coach.name);
      return '<div class="k-opt">' + ui.avatar(x.coach.name, 'md') + '<div><b>' + esc(x.coach.name) + '</b><small>Available ' + esc(x.available.reason) + (x.compliance.state !== 'Current' ? ' · ' + esc(x.compliance.text) : '') + (fin ? (x.cost ? ' · expected cost ' + K.money(x.cost) : ' · no extra cost') : '') + '</small></div>' +
        '<div class="k-opt__acts">' + K.actBtn('Ask ' + nm, 'co-offer', { req: r.id, need: n.id, coach: x.coach.id }, { size: 'sm', variant: primary ? 'primary' : 'secondary' }) + '</div></div>';
    }
    var options = ok.length ? '<div class="k-opts">' + ok.slice(0, 3).map(function (x, i) { return opt(x, i === 0 && w.act && !acc); }).join('') + '</div>' +
        (ok.length > 3 || no.length ? K.details('More coaches', (ok.length > 3 ? '<div class="k-opts">' + ok.slice(3).map(function (x) { return opt(x, false); }).join('') + '</div>' : '') + (no.length ? ui.rows(no.map(function (x) { return ui.row({ title: esc(x.coach.name), sub: x.reasons.map(esc) }); })) : ''), { sub: (ok.length > 3 ? (ok.length - 3) + ' more available · ' : '') + no.length + ' not suitable, and why' }) : '')
      : '<p class="k-note">No one else is free and suitable for this session.</p>';
    var sit;
    if (n.state === 'Covered') sit = K.situation({ tone: 'ok', title: esc(db.coachName(n.confirmed.coach)) + ' is covering' + (absent ? ' ' + esc(first(absent)) : ''), text: 'Confirmed by ' + esc(n.confirmed.by) + '. Nothing more to do.' });
    else if (n.state === 'Accepted' && acc) sit = K.situation({ tone: 'info', title: esc(db.coachName(acc.coach)) + ' can cover this session', text: 'Confirm to put ' + esc(first(db.coachName(acc.coach))) + ' on the session' + (fin ? ' at ' + K.money(acc.cost) : '') + '.', primary: K.actBtn('Confirm ' + first(db.coachName(acc.coach)), 'co-confirm', { req: r.id, need: n.id }, { variant: 'primary' }) });
    else if (waiting.length) sit = K.situation({ tone: 'info', title: 'Waiting for replies', text: esc(waiting.map(function (f) { return first(db.coachName(f.coach)); }).join(' and ')) + (waiting.length === 1 ? ' has' : ' have') + ' been asked. No action needed yet.' });
    else if (n.state === 'Needs a phone call') sit = K.situation({ tone: 'warn', title: 'Needs a phone call', text: esc(n.phone.note) });
    else if (n.offers.length) sit = K.situation({ tone: 'danger', title: 'No one has said yes yet', text: 'Everyone asked so far declined. Ask someone else, or mark it for a phone call.', secondary: K.actBtn('Mark for phone call', 'co-phone', { req: r.id, need: n.id }, { variant: 'secondary', icon: 'phone' }) });
    else sit = K.situation({ tone: 'warn', title: 'Cover still needed', text: (absent ? esc(first(absent)) + ' can’t coach. ' : 'No coach yet. ') + 'Ask one of the best options below.' });
    var asked = n.offers.length ? '<h3 class="k-h3">Already asked</h3>' + ui.rows(n.offers.map(function (f) {
      var name = db.coachName(f.coach);
      var sim = f.response ? '' : '<div class="k-row-actions co-offer-acts"><span class="k-note">Prototype: reply as ' + esc(first(name)) + '</span>' + K.actBtn('Yes', 'co-respond', { req: r.id, need: n.id, offer: f.id, resp: 'Accepted' }, { size: 'sm', variant: 'tertiary' }) + K.actBtn('No', 'co-respond', { req: r.id, need: n.id, offer: f.id, resp: 'Declined' }, { size: 'sm', variant: 'tertiary' }) + '</div>';
      return ui.row({ lead: ui.avatar(name, 'sm'), title: esc(name), sub: [f.response === 'Declined' ? 'Declined' + (f.note ? ': “' + esc(f.note) + '”' : '') : f.response === 'Accepted' ? 'Said yes' : 'Waiting for a reply'], after: sim });
    }), 'rows--lead') : '';
    var showOptions = n.state !== 'Covered' && !(n.state === 'Accepted' && acc);
    var optionsBlock = !showOptions ? (n.state === 'Accepted' ? K.details('Ask someone else instead', options) : '')
      : waiting.length ? K.details('Ask someone else as well', options, { sub: 'Best options for this session' }) : '<h3 class="k-h3">Best options</h3>' + options;
    var detail = K.details('Details', K.kv([['Session', K.link('mgmt-occurrence/' + o.id, occLabel(o))], ['Coaches now', o.staff.length ? ui.staffNames(o.staff) : 'No coach yet'], ['Players expected', String(o.players)]].concat(
      n.offers.map(function (f) { return ['Offer to ' + first(db.coachName(f.coach)), stamp('Sent', f.sentBy, f.sentAt) + (fin ? ' · ' + K.money(f.rate) + '/h, ' + K.money(f.cost) : '') + (f.respondedAt ? '<br>' + stamp(f.response, db.coachName(f.coach), f.respondedAt) : '')]; })).concat(
      n.phone ? [['Phone call', esc(n.phone.note) + '<br>' + stamp('Flagged', n.phone.by, n.phone.at)]] : []), true) +
      (n.state !== 'Covered' && n.state !== 'Needs a phone call' && !(n.offers.length && !waiting.length && !acc) ? '<div class="k-bar">' + K.actBtn('Mark for phone call', 'co-phone', { req: r.id, need: n.id }, { size: 'sm', variant: 'tertiary', icon: 'phone' }) + '</div>' : ''));
    return '<article class="co-need"><h2 class="co-need__t">' + esc(o.session) + '</h2><p class="co-need__w">' + when + '</p>' + sit + (n.state === 'Covered' ? '' : optionsBlock + asked) + detail + '</article>';
  }
  Hub.screens['mgmt-cover-request'] = function (ctx) {
    var r = db.getCoverRequest(ctx.param);
    var who = r && r.coach ? db.coachName(r.coach) : null;
    var h = K.head({ back: ['mgmt-cover', 'Cover'], eyebrow: 'Cover', title: r ? (who ? who + ' can’t coach' : 'No coach for this session') : 'Cover', sub: r ? esc(range(r.from, r.to)) + ' · ' + esc(r.kind.toLowerCase()) : '' });
    var g = K.guard(ctx, h, { empty: ['swap', 'No dates in this request', 'The absence does not touch any session.'] }); if (g) return g;
    if (!r) return notFound(h, 'Cover request');
    if (!K.feature('cover')) return page(h, K.featureOff('cover'));
    if (!r.needs.length) return page(h, K.situation({ tone: 'ok', title: 'No sessions affected', text: 'This absence does not touch any session, so nothing needs cover.' }));
    var order = function (n) { var w = coverWords(r, n); return n.state === 'Covered' ? 2 : w.act ? 0 : 1; };
    var needs = r.needs.slice().sort(function (a, b) { return order(a) - order(b); });
    var open = needs.filter(function (n) { return n.state !== 'Covered'; }), done = needs.filter(function (n) { return n.state === 'Covered'; });
    var top = r.needs.length > 1 ? (open.length ? '<p class="k-note co-need__sum">' + open.length + ' of ' + r.needs.length + ' sessions still need sorting' + (done.length ? '; ' + done.length + ' covered.' : '.') + '</p>' : K.situation({ tone: 'ok', title: 'All ' + r.needs.length + ' sessions are covered' })) : '';
    var history = K.details('History', K.kv([['Why', esc(r.reason)], ['Recorded', stamp('Recorded', r.requestedBy, r.at)], ['Reference', K.id(r.id)]]) + K.timeline(r.history.slice().reverse()), { sub: 'Why, who recorded it, and every step' });
    return page(h, top + '<div class="lx-stack">' + open.map(function (n) { return needCard(r, n); }).join('') + '</div>' +
      (done.length ? (open.length ? K.details('Covered (' + done.length + ')', done.map(function (n) { return needCard(r, n); }).join('')) : '<div class="lx-stack">' + done.map(function (n) { return needCard(r, n); }).join('') + '</div>') : '') + history);
  };
  Hub.actions['co-offer'] = function (el) { var d = el.dataset; Hub.mutate(function () { db.sendCoverOffer(d.req, d.need, d.coach, K.me(), K.now()); }, 'Offer sent to ' + db.coachName(d.coach), log('Cover offer sent to ' + db.coachName(d.coach) + ' (' + d.need + ')', d.req)); };
  Hub.actions['co-respond'] = function (el) {
    var d = el.dataset, n = db.getCoverNeed(d.req, d.need), f = n.offers.filter(function (x) { return x.id === d.offer; })[0], name = db.coachName(f.coach);
    if (d.resp === 'Accepted') { Hub.mutate(function () { db.respondCoverOffer(d.req, d.need, d.offer, 'Accepted', '', K.now()); }, name + ' accepted', log(name + ' accepted cover (' + d.need + ')', d.req, { who: name })); return; }
    K.sheet({ overline: '<span class="overline">Respond as ' + esc(name) + '</span>', title: 'Decline this cover', body: K.form([K.field('Reason (optional)', K.textarea('dec-note', '', 'For example: already working that evening'), null, true)], 1), foot: sheetFoot('Decline', 'co-decline-go', { req: d.req, need: d.need, offer: d.offer }) });
  };
  Hub.actions['co-decline-go'] = function (el) {
    var d = el.dataset, n = db.getCoverNeed(d.req, d.need), f = n.offers.filter(function (x) { return x.id === d.offer; })[0], name = db.coachName(f.coach), note = K.val('dec-note').trim();
    Hub.closeSheet(true); Hub.mutate(function () { db.respondCoverOffer(d.req, d.need, d.offer, 'Declined', note, K.now()); }, name + ' declined: pick another ' + one().toLowerCase(), log(name + ' declined cover (' + d.need + ')', d.req, { who: name }));
  };
  Hub.actions['co-confirm'] = function (el) { var d = el.dataset; Hub.mutate(function () { db.confirmCover(d.req, d.need, K.me(), K.now()); }, 'Cover confirmed', log('Cover confirmed (' + d.need + ')', d.req)); };
  Hub.actions['co-phone'] = function (el) {
    var d = el.dataset;
    K.sheet({ overline: '<span class="overline">Cover</span>', title: 'Needs a phone call', body: K.form([K.field('Note for whoever rings round', K.textarea('ph-note', 'No one free in the Hub. Ring round the reserve list.'), null, true)], 1) + '<p class="k-note">The date stays open and is flagged on the cover workspace. You can still send offers from here.</p>', foot: sheetFoot('Flag for a phone call', 'co-phone-go', { req: d.req, need: d.need }) });
  };
  Hub.actions['co-phone-go'] = function (el) { var d = el.dataset, note = K.val('ph-note').trim() || 'Needs a phone call'; Hub.closeSheet(true); Hub.mutate(function () { db.markCoverPhoneCall(d.req, d.need, note, K.me(), K.now()); }, 'Flagged for a phone call', log('Cover flagged for a phone call (' + d.need + ')', d.req)); };

  /* ============================================================ WORK SUMMARIES */
  var NOT_INVOICE = 'A work summary is a check of work done: it lists the sessions a coach worked in the month and what the Hub expects to pay. It is not an invoice and creates no bill. Lines are frozen from pay items when the summary is prepared.';
  Hub.screens['mgmt-work-summaries'] = function (ctx) {
    var h = K.head({ back: ['mgmt-coaches', word()], eyebrow: word(), title: 'Work summaries', sub: 'September 2026 · one per paid ' + one().toLowerCase() + '. Read each one and finalise it; ' + word().toLowerCase() + ' can query it afterwards.' });
    var g = K.guard(ctx, h, { empty: ['inbox', 'No work summaries yet', 'Summaries are prepared on the first of each month from the previous month’s pay items.'] }); if (g) return g;
    var list = db.getWorkSummaries();
    function n(s) { return list.filter(function (w) { return w.state === s; }).length; }
    var f = K.tab('co-ws', [{ id: 'all' }, { id: 'Needs review' }, { id: 'Queried' }, { id: 'Finalised' }]);
    var shown = list.filter(function (w) { return f === 'all' || w.state === f; });
    var unpaid = db.getCoaches().filter(function (c) { return !list.some(function (w) { return w.coach === c.id; }); });
    return page(h, ui.notice('info', 'A check of work done, not an invoice', NOT_INVOICE) +
      K.stats([{ label: 'Needs review', value: n('Needs review'), sub: 'Read, then finalise one at a time', tone: n('Needs review') ? 'warn' : '' }, { label: 'Queried', value: n('Queried'), sub: 'A coach raised a question after finalising', tone: n('Queried') ? 'warn' : '' }, { label: 'Finalised', value: n('Finalised'), sub: 'Sent for the 7 Oct coach payment' }]) +
      K.section('September 2026', 'Open a summary to see its frozen lines and history.', '<div class="k-bar">' + K.seg('co-ws', [{ id: 'all', label: 'All' }, { id: 'Needs review', label: 'Needs review' }, { id: 'Queried', label: 'Queried' }, { id: 'Finalised', label: 'Finalised' }]) + '</div>' +
        K.table({ cols: WS_COLS, head: wsHead(true), rows: summaryRows(shown, true), empty: 'No summaries in this state.', foot: K.fin() === 'none' ? '' : '<span>' + shown.length + ' summaries</span><span class="k-total">Total ' + K.money(K.sum(shown, 'total')) + '</span>' })) +
      (unpaid.length ? K.section('No summary this month', 'These ' + word().toLowerCase() + ' have no per-session cost.', ui.rows(unpaid.map(function (c) { var r = db.getCurrentRate(c.id); return ui.row({ lead: ui.avatar(c.name, 'sm'), title: esc(c.name), sub: [esc((r && r.note) || 'No paid pay items in September')], href: '#mgmt-coach/' + c.id }); }), 'rows--lead')) : ''));
  };
  Hub.screens['mgmt-work-summary'] = function (ctx) {
    var w = db.getWorkSummary(ctx.param), name = w ? db.coachName(w.coach) : '';
    var acts = '';
    if (w && (w.state === 'Queried' || w.state === 'Finalised')) acts += K.actBtn(w.state === 'Queried' ? 'Reopen to correct' : 'Reopen', 'co-ws-reopen', { id: w.id }, { variant: 'secondary', icon: 'refresh' });
    var h = K.head({ back: ['mgmt-work-summaries', 'Work summaries'], eyebrow: w ? w.id + ' · cycle ' + w.cycle : 'Work summary', title: w ? name + ' · ' + w.label : 'Work summary',
      sub: w ? st(w.state) + ' ' + K.frozen('Lines frozen ' + K.dt(w.frozenAt)) : '', actions: acts });
    var g = K.guard(ctx, h, { empty: ['inbox', 'No lines', 'No pay items were found for this month.'] }); if (g) return g;
    if (!w) return notFound(h, 'Work summary');
    /* Management reads and finalises each summary; the coach can query it afterwards */
    var stateNote = w.state === 'Needs review' ? K.situation({ tone: 'warn', title: 'Read, then finalise', text: w.lines.length + ' sessions, ' + (K.fin() === 'none' ? '' : K.money(w.total) + '. ') + 'Finalising tells ' + first(name) + ' and sends the pay items for the 7 Oct payment.', primary: K.canFin() ? K.actBtn('Finalise', 'co-ws-final', { id: w.id }, { variant: 'primary', icon: 'check' }) : '' }) :
      w.state === 'Queried' ? K.situation({ tone: 'warn', kicker: 'Queried ' + K.dm(w.query.at), title: first(name) + ' queried this summary', text: '“' + esc(w.query.text) + '” Correct the pay item if needed, then reopen and finalise again.', primary: K.actBtn('Reopen to correct', 'co-ws-reopen', { id: w.id }, { variant: 'primary', icon: 'refresh' }) }) :
      w.stale ? K.situation({ tone: 'warn', title: 'Work confirmed after finalising', text: 'A session ' + first(name) + ' worked was confirmed after this summary was finalised, so it isn’t included. Reopen to add it, then finalise again.', primary: K.actBtn('Reopen summary', 'co-ws-reopen', { id: w.id }, { variant: 'primary', icon: 'refresh' }) }) :
      K.situation({ tone: 'ok', title: 'Finalised' + (K.fin() === 'none' ? '' : ' · ' + K.money(w.total)), text: stamp('Finalised', w.finalised.by, w.finalised.at) + '. ' + first(name) + ' can see it in the Coach hub and query it if something looks wrong.', secondary: K.actBtn('Prototype: query as ' + first(name), 'co-ws-query', { id: w.id }, { variant: 'tertiary', size: 'sm' }) });
    var lines = K.fin() === 'none' ? finLocked('Work summary lines') : K.table({ cols: 'minmax(0,2fr) minmax(0,.8fr) 70px 90px 110px', head: ['Session', { label: 'Role', cls: 'wide' }, { label: 'Hours', cls: 'c-num wide' }, { label: 'Rate', cls: 'c-num wide' }, { label: 'Amount', cls: 'c-num' }],
      rows: w.lines.map(function (l) { return { action: 'co-alloc', data: { id: l.allocation }, label: 'Open pay item', cells: [K.cell(esc(l.session), K.dd(l.date) + (l.override ? ' · Adjusted: ' + esc(l.override) : '')), { cls: 'wide', html: esc(l.role) }, { cls: 'c-num wide', html: l.units + ' h' }, { cls: 'c-num wide', html: K.money(l.rate) }, { cls: 'c-num', html: K.money(l.cost) }] }; }),
      foot: '<span>' + w.lines.length + ' sessions · ' + K.sum(w.lines, 'units') + ' hours</span><span class="k-total">Grand total ' + K.money(w.total) + '</span>' });
    var cycles = w.cycles.slice().reverse().map(function (cy) { return K.card({ title: 'Cycle ' + cy.n + (cy.n === w.cycle ? ' (current)' : ''), sub: 'Lines frozen ' + K.dt(cy.frozenAt) + (K.fin() === 'none' ? '' : ' · total ' + K.money(cy.total)), body: K.timeline(cy.events.slice().reverse()) }); });
    return page(h, stateNote + ui.notice('info', 'A check of work done, not an invoice', NOT_INVOICE) + K.section('Lines', 'Frozen copies of the pay items. Changing a pay item does not change these until the summary is reopened.', lines) +
      K.details('History', '<div class="lx-stack">' + cycles.join('') + '</div>', { sub: 'Each cycle: prepared, finalised, queried or reopened' }));
  };
  Hub.actions['co-ws-final'] = function (el) {
    var w = db.getWorkSummary(el.dataset.id), n = first(db.coachName(w.coach));
    K.sheet({ overline: '<span class="overline">' + esc(db.coachName(w.coach)) + ' · ' + esc(w.label) + '</span>', title: 'Finalise this summary?', body: '<p class="k-note">Only finalise once you have read it. Once finalised:</p><ul class="k-list-plain"><li>' + esc(n) + ' is told and can see it in the Coach hub</li><li>The pay items are sent for the 7 Oct coach payment and frozen</li><li>' + esc(n) + ' can still query it; you reopen it to correct anything</li></ul>', foot: sheetFoot('Finalise', 'co-ws-final-go', { id: w.id }) });
  };
  Hub.actions['co-ws-final-go'] = function (el) { var w = db.getWorkSummary(el.dataset.id); Hub.closeSheet(true); Hub.mutate(function () { db.finaliseSummary(w.id, K.me(), K.now()); }, 'Finalised: ' + K.money(w.total), log(db.coachName(w.coach) + ' ' + w.label + ' work summary finalised', w.id, { after: K.money(w.total), finance: true })); };
  Hub.actions['co-ws-reopen'] = function (el) { var w = db.getWorkSummary(el.dataset.id); Hub.mutate(function () { db.reopenSummary(w.id, K.me(), K.now()); }, 'Reopened as cycle ' + (w.cycle + 1), log(db.coachName(w.coach) + ' ' + w.label + ' work summary reopened', w.id, { finance: true })); };
  Hub.actions['co-ws-query'] = function (el) {
    var w = db.getWorkSummary(el.dataset.id);
    K.sheet({ overline: '<span class="overline">' + esc(w.id) + '</span>', title: 'Query as ' + esc(first(db.coachName(w.coach))) + ' (prototype)', body: K.form([K.field('What needs checking', K.textarea('ws-q', '', 'For example: 24 Sep should be 1.5 hours'), null, true)], 1), foot: sheetFoot('Raise query', 'co-ws-query-go', { id: w.id }) });
  };
  Hub.actions['co-ws-query-go'] = function (el) { var w = db.getWorkSummary(el.dataset.id), q = K.val('ws-q').trim(); if (!q) { Hub.toast('Say what needs checking'); return; } Hub.closeSheet(true); Hub.mutate(function () { db.querySummary(w.id, q, db.coachName(w.coach), K.now()); }, 'Query raised', log(db.coachName(w.coach) + ' work summary queried: ' + q, w.id)); };

  /* ============================================================ PROFILE ACTIONS */
  Hub.actions['co-tab'] = function (el) { Hub.wsTabs['coach-prof'] = el.dataset.tab; Hub.render(); };
  Hub.actions['co-active'] = function (el) { var c = db.getCoach(el.dataset.coach), on = !c.active; Hub.mutate(function () { db.setCoachActive(c.id, on, K.me(), K.now()); }, c.name + (on ? ' marked active' : ' marked inactive'), log(c.name + (on ? ' marked active' : ' marked inactive'), c.code, { before: on ? 'Inactive' : 'Active', after: on ? 'Active' : 'Inactive' })); };
  Hub.actions['co-photo'] = function (el) { var c = db.getCoach(el.dataset.coach); Hub.mutate(null, 'Photo request sent to ' + c.name, log('Asked ' + c.name + ' for a profile photo', c.code)); };
  Hub.actions['co-perm'] = function (el) {
    var r = db.getRole(el.dataset.role), p = el.dataset.perm, on = !r.perms[p], label = db.getPermissions().filter(function (x) { return x.id === p; })[0].label;
    Hub.mutate(function () { db.setRolePermission(r.id, p, on, K.me(), K.now()); }, r.name + ': ' + label + (on ? ' on' : ' off'), log(r.name + ' permission "' + label + '" switched ' + (on ? 'on' : 'off'), r.id, { before: on ? 'Off' : 'On', after: on ? 'On' : 'Off' }));
  };
  Hub.actions['co-remove'] = function (el) {
    var d = el.dataset, s = db.getSession(d.session);
    K.confirm({ overline: '<span class="overline">' + esc(db.coachName(d.coach)) + '</span>', title: 'Remove from ' + s.name + '?', body: '<p class="k-note">' + esc(db.coachName(d.coach)) + ' comes off the regular staff. They keep read-only access to this session’s players for 21 days (until ' + K.d(K.addDays(K.today, 21)) + ') so they can finish feedback. Sessions already staffed are not changed.</p>', label: 'Remove', danger: true, action: 'co-remove-go', data: { 'data-coach': d.coach, 'data-session': d.session } });
  };
  Hub.actions['co-remove-go'] = function (el) { var d = el.dataset, s = db.getSession(d.session); Hub.closeSheet(true); Hub.mutate(function () { db.removeAssignment(d.coach, d.session, K.me(), K.now()); }, db.coachName(d.coach) + ' removed from ' + s.name, log(db.coachName(d.coach) + ' removed from ' + s.name + ' (21 days former access)', d.session)); };
  Hub.actions['co-ovr-new'] = function (el) {
    var c = db.getCoach(el.dataset.coach);
    K.sheet({ overline: '<span class="overline">' + esc(c.name) + '</span>', title: 'Temporary role', body: K.form([
      K.field('Session', K.select('ov-session', db.getSessions().filter(function (s) { return s.lifecycle === 'Active'; }).map(function (s) { return [s.id, s.name]; }), 'SES-01')),
      K.field('Role', K.select('ov-role', db.getRoles().filter(function (r) { return r.sessionRole; }).map(function (r) { return [r.id, r.name]; }), 'coach')),
      K.field('From', K.input('ov-from', '2026-10-05', { type: 'date' })), K.field('To', K.input('ov-to', '2026-10-30', { type: 'date' })),
      K.field('Reason', K.input('ov-reason', ''), null, true)]), foot: sheetFoot('Add temporary role', 'co-ovr-add', { coach: c.id }) });
  };
  Hub.actions['co-ovr-add'] = function (el) {
    var o = { coach: el.dataset.coach, session: K.val('ov-session'), role: K.val('ov-role'), from: K.val('ov-from'), to: K.val('ov-to'), reason: K.val('ov-reason').trim(), by: K.me(), at: K.now() };
    if (!o.from || !o.to || o.to < o.from) { Hub.toast('Check the dates'); return; }
    if (!o.reason) { Hub.toast('Add a reason'); return; }
    Hub.closeSheet(true); Hub.mutate(function () { db.addRoleOverride(o); }, 'Temporary role added', log(db.coachName(o.coach) + ' temporary ' + db.getRole(o.role).name + ' on ' + db.getSession(o.session).name + ' ' + range(o.from, o.to), o.session));
  };
  Hub.actions['co-ovr-end'] = function (el) { var id = el.dataset.id; Hub.mutate(function () { db.endRoleOverride(id, K.me(), K.now()); }, 'Temporary role ended', log('Temporary role ' + id + ' ended', id)); };
  Hub.actions['co-rate'] = function (el) {
    var c = db.getCoach(el.dataset.coach), from = K.val('rate-from'), ev = pence(K.val('rate-evening')), day = pence(K.val('rate-day')), note = K.val('rate-note').trim(), cur = db.getCurrentRate(c.id);
    if (!from || ev == null || day == null || ev < 0 || day < 0) { Hub.toast('Enter a date and both rates'); return; }
    if (cur && from <= cur.from) { Hub.toast('The new rate must start after ' + K.d(cur.from)); return; }
    if (!note) { Hub.toast('Add a note saying why the rate changes'); return; }
    var p = Hub.mutate(function () { return db.changeRate(c.id, { from: from, evening: ev, day: day, note: note }, K.me(), K.now()); }, 'New rate from ' + K.dm(from), log(c.name + ' rate changed from ' + K.d(from), c.code, { before: cur ? K.money(cur.evening) + ' / ' + K.money(cur.day) : '', after: K.money(ev) + ' / ' + K.money(day), finance: true }));
    if (!p) Hub.toast('A rate already starts on or after that date');
  };
})();
