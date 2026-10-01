/* Coach hub (pass 12): home, schedule, occurrence detail, registers,
   players, feedback, development plans, library, support, venues,
   availability, cover, documents, work summary, profile and notifications.
   The signed-in coach follows the prototype bar's Coach role switch
   (db.getSignedInCoach). Role differences:
   - Learning coach: player names and age groups only; medical, support and
     contact details are locked; feedback goes to the lead for sign-off; no
     messages to families.
   - Coach: full player view for their sessions; feedback for review.
   - Lead coach: everything a coach sees, plus the Team card, editing
     development plan targets and messaging families (Communications switch).
   Reads and writes only through Hub.db. */
(function () {
  var K = Hub.kit, db = Hub.db, ui = Hub.ui, I = Hub.icon, esc = ui.esc;
  var SENS = ['management', 'coach:lead', 'coach:coach'];

  /* ---------- Small helpers ---------- */
  function me() { return db.getSignedInCoach(); }
  function meKey() { return db.getSignedInCoachKey(); }
  function who() { return me().name; }
  function first(n) { return String(n || '').split(' ')[0]; }
  function role() { return K.viewer().coachRole || 'lead'; }
  function isLearning() { return role() === 'learning'; }
  function isLead() { return role() === 'lead'; }
  function staff() { return (Hub.brand && Hub.brand.terms && Hub.brand.terms.staff) || 'Coach'; }
  function hub() { return staff() + ' hub'; }
  var ROLE = { lead: ['Lead coach', 'star'], coach: ['Coach', 'whistle'], learning: ['Learning coach', 'book'] };
  function roleLabel(r) { r = r || role(); return r === 'coach' ? staff() : ROLE[r][0]; }
  function rolePill(r) { r = r || role(); return '<span class="ch-role ch-role--' + r + '">' + I(ROLE[r][1], 'icon-sm') + esc(roleLabel(r)) + '</span>'; }
  function page(h, body) { return K.page(h, body, 'ch'); }
  function col() { return '<div class="ch-col">' + Array.prototype.join.call(arguments, '') + '</div>'; }
  function cols(a, b) { return K.grid([col(a), col(b)], '21'); }
  function sens(html, what) { return K.restricted(SENS, html, what); }
  function stamp(verb, w, at) { return w && at ? K.stamp(verb, w, at) : ''; }
  function when(o) { return (o.date === K.today ? 'Today' : K.dd(o.date)) + ', ' + o.start + '–' + o.end; }
  function venueName(o) { return db.venueName(o.venue); }
  function dateLead(iso) { var p = K.dd(iso).split(' '); return '<span class="ch-date' + (iso === K.today ? ' is-today' : '') + '" aria-hidden="true"><small>' + esc(p[0]) + '</small><b>' + esc(p[1]) + '</b></span>'; }
  function icoLead(icon) { return '<span class="row__icon">' + I(icon, 'icon-sm') + '</span>'; }
  function notFound(h, what, back) { return page(h, ui.notice('warn', what + ' not found', 'It may have moved or been removed.', { action: K.goBtn(back[1], back[0], { size: 'sm', variant: 'secondary' }) })); }
  function notMine(h, text, back) { return page(h, ui.notice('info', 'Not one of your sessions', text, { action: K.goBtn(back[1], back[0], { size: 'sm', variant: 'secondary' }) })); }
  function sheetFoot(label, action, data) { return ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn(label, action, data, { variant: 'primary' }); }
  /* Every change: in-memory, logged with the signed-in coach and the time, toast, re-render */
  function act(fn, toast, summary, entity, extra) {
    var at = K.now();
    return Hub.mutate(function () { return fn(at); }, toast, Object.assign({ area: 'Coach hub', summary: summary, entity: entity || '', who: who(), at: at }, extra || {}));
  }
  function eta(o) {
    var m = db.minutesUntil(o);
    if (o.date === K.today) { if (m <= 0) return 'On now · ends ' + o.end; var h = Math.floor(m / 60); return 'Starts in ' + (h ? h + ' h ' : '') + (m % 60) + ' m'; }
    if (K.daysBetween(K.today, o.date) === 1) return 'Tomorrow, ' + o.start;
    return K.dd(o.date) + ', ' + o.start;
  }
  function myEntry(o) { return db.getMyStaffEntry(o, meKey()); }
  function sessionRolePill(o) {
    var s = myEntry(o); if (!s) return '';
    if (s.unavailable && !s.cover) return K.pill('You’re unavailable', 'danger');
    return K.pill(s.cover ? 'Cover · ' + s.role : s.role, s.cover ? 'info' : s.role === 'Lead' ? 'info' : s.role === 'Learning' ? 'warn' : '');
  }
  function regPill(o) {
    if (o.status === 'Cancelled' || o.status === 'Rescheduled' || o.status === 'Postponed') return K.status(o.status);
    var r = db.getRegister(o.id);
    if (r.state === 'Completed') return K.pill('Register done', 'ok');
    if (!db.canTakeRegister(o)) return '';
    return K.pill(r.state === 'In progress' ? 'Register in progress' : 'Register to take', 'warn');
  }
  function isClient(o) { return db.isClientSession(o.sessionId); }
  function staffList(o) { return o.staff.filter(function (s) { return !(s.unavailable && !s.cover) || s.coach === meKey(); }); }

  /* ---------- Routes ---------- */
  function occTitle() { var o = db.getOccurrence(K.param()); return o ? o.session : 'Session'; }
  function plyTitle(pre) { return function () { var p = db.getPlayer(K.param()); return (pre ? pre + ' · ' : '') + (p ? p.name : 'Player'); }; }
  K.route('coach-home', { title: 'Home', nav: 'coach-home' });
  K.route('coach-schedule', { title: 'Schedule', nav: 'coach-schedule' });
  K.route('coach-session', { title: occTitle, nav: 'coach-schedule' });
  K.route('coach-register', { title: function () { return 'Register · ' + occTitle(); }, nav: 'coach-schedule' });
  K.route('coach-players', { title: 'My players', nav: 'coach-players' });
  K.route('coach-player', { title: plyTitle(''), nav: 'coach-players' });
  K.route('coach-feedback', { title: plyTitle('Feedback'), nav: 'coach-players' });
  K.route('coach-idp', { title: function () { return plyTitle(K.label('IDP'))(); }, nav: 'coach-players' });
  K.route('coach-library', { title: 'Library', nav: 'coach-library' });
  K.route('coach-support', { title: 'Support', nav: 'coach-library' });
  K.route('coach-venues', { title: 'Venues', nav: 'coach-library' });
  K.route('coach-availability', { title: 'Availability', nav: 'coach-home' });
  K.route('coach-cover', { title: 'Cover', nav: 'coach-home' });
  K.route('coach-documents', { title: 'My documents', nav: 'coach-home' });
  K.route('coach-work-summary', { title: 'Work summary', nav: 'coach-home' });
  K.route('coach-profile', { title: 'Profile', nav: 'coach-home' });
  K.route('coach-notifications', { title: 'Notifications', nav: 'coach-home' });

  /* What the signed-in role can do (from Session roles in Management) */
  function permChips() {
    var r = db.getHubRole();
    return '<ul class="ch-perms">' + db.getPermissions().filter(function (p) { return p.id !== 'namesOnly'; }).map(function (p) {
      var on = r.perms[p.id];
      if (p.id === 'viewPlayers' && r.perms.namesOnly) return '<li class="is-part">' + I('user', 'icon-sm') + '<span>Player names only</span></li>';
      return '<li class="' + (on ? 'is-on' : 'is-off') + '">' + I(on ? 'check' : 'x', 'icon-sm') + '<span>' + esc(p.label) + (p.id === 'feedback' && !on && isLearning() ? ' (lead signs off)' : '') + '</span></li>';
    }).join('') + '</ul>';
  }
  function roleNote() {
    var idp = K.label('IDP');
    if (isLearning()) return 'You’re on placement: you see player names and age groups only. Medical, support and contact details stay with the coaches who may see them, and your lead coach signs off any feedback you write.';
    if (isLead()) return 'You see full player details for your sessions, edit ' + esc(idp) + ' targets, sign off learning coach feedback and can message families of your sessions.';
    return 'You see player details for your sessions, take registers and write feedback for review. ' + esc(idp) + ' targets are edited by lead coaches.';
  }

  /* ============================================================ HOME */
  function nextHero(o) {
    var mine = myEntry(o), others = o.staff.filter(function (s) { return s.coach !== meKey() && !(s.unavailable && !s.cover); }).map(function (s) { return first(db.coachName(s.coach)); });
    var expected = isClient(o) ? o.players + ' (headcount)' : String(db.getExpectedPlayers(o).length);
    var notes = db.getSessionNotes(o.id)[0];
    return '<section class="lx-next ch-next" aria-labelledby="next-title"><div class="lx-next__k"><span>Next session</span><span class="lx-next__eta num">' + esc(eta(o)) + '</span></div>' +
      '<div class="ch-next__head"><h2 id="next-title" class="lx-next__title">' + esc(o.session) + '</h2><span class="lx-next__pills"><span>' + esc(mine.cover ? 'Cover · ' + mine.role : mine.role) + '</span>' + (isClient(o) ? '<span>Client session</span>' : '') + '</span></div>' +
      '<dl class="lx-next__facts"><div><dt>Time</dt><dd class="num">' + esc(when(o)) + '</dd></div><div><dt>Location</dt><dd>' + esc(venueName(o)) + (o.venue && db.getVenue(o.venue).meetingPoint ? '<small>' + esc(db.getVenue(o.venue).meetingPoint) + '</small>' : '') + '</dd></div><div><dt>Expected</dt><dd class="num">' + esc(expected) + '</dd></div><div><dt>Working with</dt><dd>' + (others.length ? esc(others.join(', ')) : 'Just you') + '</dd></div></dl>' +
      (notes ? '<p class="lx-next__note"><span>Note from ' + esc(first(notes.by)) + '</span>' + esc(notes.text) + '</p>' : (o.theme ? '<p class="lx-next__note"><span>Focus this week</span>' + esc(o.theme) + '</p>' : '')) +
      '<div class="lx-next__actions"><a class="lx-next__btn" href="#coach-session/' + o.id + '">Open session' + I('arrowRight', 'icon-sm') + '</a><a class="lx-next__ghost" href="#coach-register/' + o.id + '">' + I('check', 'icon-sm') + 'Register</a><a class="lx-next__ghost" href="#coach-venues">' + I('pin', 'icon-sm') + 'Location details</a></div></section>';
  }
  function needsYou() {
    var k = meKey(), out = [];
    db.getMyOpenRegisters(k).forEach(function (o) { out.push(ui.row({ lead: icoLead('check'), title: 'Register still open: ' + esc(o.session), sub: [esc(K.dd(o.date) + ', ' + o.start), esc(db.getRegister(o.id).state)], trail: K.pill('Overdue', 'danger'), href: '#coach-register/' + o.id })); });
    if (K.feature('cover')) db.getPendingCoverOffers(k).forEach(function (x) { out.push(ui.row({ lead: icoLead('coaches'), title: 'Cover offered: ' + esc(x.occurrence.session), sub: [esc(when(x.occurrence)), esc(venueName(x.occurrence))], trail: K.pill('Reply', 'info'), href: '#coach-cover' })); });
    db.getMyReturnedFeedback(k).forEach(function (f) { out.push(ui.row({ lead: icoLead('development'), title: 'Feedback returned: ' + esc(db.getPlayer(f.player).name), sub: [esc(f.returns.length ? f.returns[f.returns.length - 1].note : '')], trail: K.pill('Returned', 'warn'), href: '#coach-feedback/' + f.player })); });
    db.getMyDraftFeedback(k).forEach(function (f) { out.push(ui.row({ lead: icoLead('development'), title: 'Draft feedback: ' + esc(db.getPlayer(f.player).name), sub: [esc(f.period), 'Started ' + esc(K.dt(f.startedAt))], trail: K.status('Draft'), href: '#coach-feedback/' + f.player })); });
    db.getFeedbackToSignOff(k).forEach(function (f) { out.push(ui.row({ lead: icoLead('userCheck'), title: 'Sign off ' + esc(first(db.coachName(f.coach))) + '’s feedback for ' + esc(db.getPlayer(f.player).name), sub: ['Learning coach', 'Submitted ' + esc(K.dt(f.submittedAt))], trail: K.pill('Sign off', 'info'), href: '#coach-feedback/' + f.player })); });
    if (K.feature('documents')) db.getCoachCompliance(k).forEach(function (x) {
      if (x.state === 'Verified') return;
      var tone = x.state === 'Expired' || x.state === 'Missing' ? 'danger' : 'warn';
      var sub = x.state === 'Expiring' ? 'Expires ' + K.d(x.doc.expires) : x.state === 'Expired' ? 'Expired ' + K.d(x.doc.expires) : x.state === 'Missing' ? 'Nothing on file' : 'Uploaded ' + K.dt(x.pending.uploaded.at);
      out.push(ui.row({ lead: icoLead('shield'), title: esc(x.type.name), sub: [esc(sub)], trail: K.pill(x.state, tone), href: '#coach-documents' }));
    });
    var ws = db.getMyWorkSummary(k, '2026-09');
    if (ws && ws.state === 'Awaiting coach') out.push(ui.row({ lead: icoLead('finance'), title: 'Check your ' + esc(ws.label) + ' summary', sub: [ws.lines.length + ' occurrences', K.money(ws.total)], trail: K.pill('Confirm', 'info'), href: '#coach-work-summary' }));
    return out;
  }
  Hub.screens['coach-home'] = function (ctx) {
    var c = me(), x = db.getCoachProfileExtras(c.id);
    var hello = '<header class="lx-hello ch-hello"><div class="lx-eyebrow">' + esc(hub()) + ' · Thursday 1 October</div><h1 class="lx-hello__title serif">Good afternoon, ' + esc(x.preferredName || first(c.name)) + '</h1>' +
      '<div class="ch-hello__who">' + rolePill() + '<span>' + esc(c.name) + ' · ' + esc(c.code) + '</span>' + K.link('coach-profile', 'Profile') + '</div></header>';
    var g = K.guard(ctx, hello, { empty: ['calendar', 'Nothing on today', 'Your sessions, registers and anything that needs you will appear here.'] }); if (g) return g;
    var k = c.id, next = db.getMyNext(k), today = db.getMyOccurrences(k, { from: K.today, to: K.today });
    var hero = next ? nextHero(next) : '<div class="zone-inset">' + ui.empty('calendar', 'No sessions coming up', 'When the office adds you to a session it appears here.') + '</div>';
    var unavailableToday = today.filter(function (o) { var s = myEntry(o); return s.unavailable && !s.cover; });
    var away = unavailableToday.map(function (o) { return ui.notice('warn', 'You’re marked unavailable for ' + o.session + ' at ' + o.start, 'The office is arranging cover. You don’t need to do anything else.', { action: K.goBtn('Cover', 'coach-cover', { size: 'sm', variant: 'secondary' }) }); }).join('');
    var needs = needsYou(), unread = db.getCoachHubUnread(k);
    var needCard = K.card({ title: 'Needs you', sub: needs.length ? needs.length + ' thing' + (needs.length === 1 ? '' : 's') + ' to do' : 'Nothing waiting', right: K.goBtn('Notifications' + (unread ? ' · ' + unread : ''), 'coach-notifications', { size: 'sm', variant: 'tertiary' }),
      body: needs.length ? ui.rows(needs, 'rows--lead') : ui.empty('checkCircle', 'You’re all caught up', 'Registers, cover offers, feedback and documents that need you show here.') });
    var todayCard = K.card({ title: 'Today', sub: today.length ? today.length + ' session' + (today.length === 1 ? '' : 's') : 'Nothing today', right: K.goBtn('Schedule', 'coach-schedule', { size: 'sm', variant: 'tertiary' }),
      body: today.length ? ui.rows(today.map(function (o) { return ui.row({ lead: dateLead(o.date), title: esc(o.session), sub: [esc(o.start + '–' + o.end), esc(venueName(o))], trail: sessionRolePill(o) + regPill(o), href: '#coach-session/' + o.id }); }), 'rows--lead') : ui.empty('calendar', 'No sessions today', next ? 'Next: ' + next.session + ', ' + K.dd(next.date) + ' at ' + next.start + '.' : '') });
    var roleCard = K.card({ title: 'Your role', sub: esc(roleNote()), right: rolePill(), body: permChips() + '<p class="k-note ch-note">Set by Management in Session roles. ' + (isLearning() ? 'Your lead coach on U8 Development is ' + esc(db.coachName('jack')) + '.' : '') + '</p>' });
    var notices = db.getNotices('Coaches').filter(function (n) { return n.status === 'Sent'; });
    var officeCard = K.card({ title: 'From the office', sub: 'Notices for ' + esc(Hub.staffPlural ? Hub.staffPlural().toLowerCase() : 'coaches'), body: notices.length ? ui.rows(notices.map(function (n) { return ui.row({ lead: icoLead('megaphone'), title: esc(n.title), sub: [esc(n.body)], after: stamp('Sent', n.by, n.at) }); }), 'rows--lead') : ui.empty('megaphone', 'No notices', 'Notices from the office appear here.') });
    var weekN = db.getCoachWeekCount(k), players = db.getMyPlayers(k).length, offers = db.getPendingCoverOffers(k).length, comp = db.getCoachComplianceSummary(k), ws = db.getMyWorkSummary(k, '2026-09');
    var tiles = K.tiles([
      { route: 'coach-schedule', icon: 'calendar', title: 'Schedule', value: weekN, label: 'this week', desc: 'Your occurrences, past and upcoming.' },
      { route: 'coach-players', icon: 'users', title: 'My players', value: players, label: isLearning() ? 'names only' : 'in your sessions', desc: 'Profiles, attendance, feedback and ' + K.label('IDPs') + '.' },
      { route: 'coach-availability', icon: 'clock', title: 'Availability', desc: 'Your week, holidays and dates you can’t make.' },
      { route: 'coach-cover', icon: 'coaches', title: 'Cover', value: offers, label: offers === 1 ? 'offer to answer' : 'offers to answer', desc: 'Cover offered to you and your own requests.' },
      { route: 'coach-documents', icon: 'shield', title: 'Documents', desc: comp.text, badge: comp.state === 'Current' ? '' : K.pill(comp.state, comp.tone) },
      { route: 'coach-work-summary', icon: 'finance', title: 'Work summary', value: ws ? K.money(ws.total) : '—', label: ws ? ws.label : '', desc: 'Your month: sessions, hours and pay.' },
      { route: 'coach-library', icon: 'book', title: 'Library', desc: 'Session plans, drills and guides.' },
      { route: 'coach-support', icon: 'support', title: 'Support', desc: 'Contacts, how-tos and questions to the office.' },
      { route: 'coach-venues', icon: 'venue', title: 'Venues', desc: 'Access, parking and meeting points.' }
    ], 3);
    var body = away + hero + cols(needCard + todayCard, roleCard + officeCard) + K.section('Your hub', 'Everything for your sessions in one place.', tiles);
    return page(hello, body);
  };

  /* ============================================================ SCHEDULE */
  function weekStart(iso) { var d = K.parse(iso), back = (d.getDay() + 6) % 7; return K.addDays(iso, -back); }
  function occRow(o) {
    var sub = [esc(o.start + '–' + o.end), esc(venueName(o))];
    if (o.venueOverride) sub.push('<span class="ch-warn">Venue changed</span>');
    return ui.row({ lead: dateLead(o.date), title: esc(o.session), sub: sub, trail: sessionRolePill(o) + regPill(o), href: '#coach-session/' + o.id });
  }
  Hub.screens['coach-schedule'] = function (ctx) {
    var k = meKey(), all = db.getMyOccurrences(k);
    var up = all.filter(function (o) { return o.date >= K.today; }), past = all.filter(function (o) { return o.date < K.today; }).reverse();
    var tabs = [{ id: 'upcoming', label: 'Upcoming', meta: up.length }, { id: 'past', label: 'Past', meta: past.length }];
    var h = K.head({ eyebrow: hub(), title: 'My schedule', sub: 'Every occurrence you’re on. Open one for the venue, staff, expected players and the register.',
      actions: K.goBtn('Availability', 'coach-availability', { variant: 'secondary', icon: 'clock' }) + K.goBtn('Cover', 'coach-cover', { variant: 'secondary', icon: 'coaches' }), tabs: K.tabs('ch-sched', tabs) });
    var g = K.guard(ctx, h, { empty: ['calendar', 'No sessions yet', 'When the office adds you to a session, its occurrences appear here week by week.'] }); if (g) return g;
    var tab = K.tab('ch-sched', tabs), list = tab === 'upcoming' ? up : past;
    var wk = weekStart(K.today), days = [];
    for (var i = 0; i < 7; i++) { var d = K.addDays(wk, i); days.push({ dow: K.dd(d).split(' ')[0], date: K.parse(d).getDate(), today: d === K.today, past: d < K.today, session: all.some(function (o) { return o.date === d; }) }); }
    var thisWeek = all.filter(function (o) { return o.date >= wk && o.date <= K.addDays(wk, 6) && !(myEntry(o).unavailable && !myEntry(o).cover); });
    var hrs = thisWeek.reduce(function (n, o) { return n + db.occHours(o); }, 0), open = db.getMyOpenRegisters(k).length;
    var top = K.card({ title: 'This week', sub: K.dm(wk) + ' to ' + K.dm(K.addDays(wk, 6)), body: ui.weekline(days) + K.stats([
      { label: 'Sessions', value: thisWeek.length, sub: hrs + ' hours' },
      { label: 'Registers open', value: open, sub: open ? 'From past sessions' : 'All done', tone: open ? 'warn' : '' },
      { label: 'Next', value: db.getMyNext(k) ? esc(db.getMyNext(k).start) : '—', sub: db.getMyNext(k) ? esc(db.getMyNext(k).session + ' · ' + K.dd(db.getMyNext(k).date)) : 'Nothing booked' }
    ]) });
    var groups = {}, order = [];
    list.forEach(function (o) { var w = weekStart(o.date); if (!groups[w]) { groups[w] = []; order.push(w); } groups[w].push(o); });
    var body = order.map(function (w) {
      var label = w === wk ? 'This week' : w === K.addDays(wk, 7) ? 'Next week' : w === K.addDays(wk, -7) ? 'Last week' : 'Week of ' + K.dd(w);
      return K.section(label, esc(K.dm(w) + ' – ' + K.dm(K.addDays(w, 6))) + ' · ' + groups[w].length + ' session' + (groups[w].length === 1 ? '' : 's'), K.list(groups[w].map(occRow)));
    }).join('');
    return page(h, top + (body || '<div class="zone-inset">' + ui.empty('calendar', tab === 'upcoming' ? 'Nothing coming up' : 'Nothing in the past yet', '') + '</div>'));
  };

  /* ============================================================ SESSION (OCCURRENCE) */
  function playerFlags(p) {
    var f = [];
    if (p.medical === 'details') f.push(K.pill('Medical', 'danger'));
    if (p.medical === 'not_confirmed') f.push(K.pill('Medical not confirmed', 'warn'));
    if (p.support === 'details') f.push(K.pill('Support needs', 'info'));
    if (p.photo === 'no') f.push(K.pill('No photos', 'warn'));
    if (p.photo === 'unknown') f.push(K.pill('Photo consent unknown', 'warn'));
    return f.join('');
  }
  function expectedCard(o) {
    if (isClient(o)) return K.card({ title: 'Expected', sub: 'Client session: the school manages its own class list.', body: K.kv([['Expected headcount', '<b class="num">' + o.players + '</b>'], ['Register', 'A headcount, not names']]) });
    var rows = db.getRegisterRows(o.id);
    var list = rows.map(function (r) {
      var name = r.player ? r.player.name : r.name, ag = r.player ? r.player.ageGroup : r.ageGroup;
      var tag = r.trial ? K.pill('Trial', 'info') : r.oneOff ? K.pill('One-off', 'info') : (r.membership && r.membership !== 'Active' ? K.status(r.membership) : '');
      if (isLearning()) return ui.row({ lead: ui.avatar(name, 'sm'), title: esc(name), sub: [esc(ag)], trail: tag, href: r.player ? '#coach-player/' + r.player.id : null });
      return ui.row({ lead: ui.avatar(name, 'sm'), title: esc(name), sub: [esc(ag), r.player ? esc(r.player.school) : esc(r.note || '')], trail: tag + (r.player ? playerFlags(r.player) : ''), href: r.player ? '#coach-player/' + r.player.id : null });
    });
    return K.card({ title: 'Expected players', sub: rows.length + ' expected' + (isLearning() ? ' · names only for learning coaches' : ''), right: K.goBtn('Register', 'coach-register/' + o.id, { size: 'sm', variant: 'secondary', icon: 'check' }),
      body: rows.length ? ui.rows(list, 'rows--lead') : ui.empty('users', 'No players expected', 'Players appear once they have a membership or a trial booked for this date.') });
  }
  function medicalCard(o) {
    if (isClient(o)) return '';
    var ps = db.getExpectedPlayers(o).map(db.getPlayer).filter(function (p) { return p && (p.medical !== 'none' || p.support !== 'none'); });
    var inner = ps.length ? ui.rows(ps.map(function (p) {
      var lines = [];
      if (p.medical === 'details') lines.push('<b>Medical:</b> ' + esc(p.medicalDetail));
      if (p.medical === 'not_confirmed') lines.push('<b>Medical:</b> not confirmed by the family yet');
      if (p.support === 'details') lines.push('<b>Support:</b> ' + esc(p.supportDetail));
      return ui.row({ title: esc(p.name), sub: lines, href: '#coach-player/' + p.id });
    })) : '<p class="k-note">No medical or support needs in this group.</p>';
    return K.card({ title: 'Medical and support', sub: 'For tonight’s group', body: sens(inner, 'Medical and support needs') });
  }
  function teamCard(o) {
    var list = o.staff.filter(function (s) { return s.coach !== meKey(); });
    if (isLead()) {
      return K.card({ title: 'Team', sub: 'Lead coach view: the other coaches on this occurrence', right: rolePill('lead'), body: list.length ? ui.rows(list.map(function (s) {
        var c = db.getCoach(s.coach), comp = db.getCoachComplianceSummary(s.coach);
        var st = s.unavailable && !s.cover ? K.pill('Unavailable', 'danger') + (s.covering ? K.pill('Covered by ' + first(db.coachName(s.covering)), 'ok') : '') : K.pill(s.cover ? 'Cover · ' + s.role : s.role, s.role === 'Learning' ? 'warn' : '');
        return ui.row({ lead: ui.avatar(c.name, 'sm'), title: esc(c.name), sub: [esc(c.phone || ''), esc(comp.text)], trail: st });
      }), 'rows--lead') : '<p class="k-note">You’re the only coach on this occurrence.</p>' });
    }
    return K.card({ title: 'Staff', sub: 'Who is on this occurrence', body: ui.rows(o.staff.map(function (s) {
      var n = db.coachName(s.coach), mine = s.coach === meKey();
      return ui.row({ lead: ui.avatar(n, 'sm'), title: esc(n) + (mine ? ' <small class="ch-you">(you)</small>' : ''), sub: [esc(s.cover ? 'Cover' : s.role)], trail: s.unavailable && !s.cover ? K.pill('Unavailable', 'danger') : '' });
    }), 'rows--lead') });
  }
  function venueCard(o) {
    if (!o.venue) return K.card({ title: 'Venue', body: ui.notice('warn', 'No venue yet', 'The office will confirm where this runs.') });
    var v = db.getVenue(o.venue);
    var over = o.venueOverride ? ui.notice('warn', 'Venue changed for this date', esc(o.venueOverride.reason) + ' · moved from ' + esc(db.venueName(o.venueOverride.from)) + ' ' + stamp('Changed', o.venueOverride.by, o.venueOverride.at)) : '';
    return K.card({ title: v.name, sub: esc(v.area || ''), right: K.goBtn('All venues', 'coach-venues', { size: 'sm', variant: 'tertiary' }),
      body: over + K.kv([['Address', esc(v.address || '—')], ['Meeting point', esc(o.meetingPoint || v.meetingPoint || '—')], ['Parking', esc(v.parking || '—')], ['Access', esc(v.access || '—')], ['On site', esc(v.siteMap || '—')]]) });
  }
  function notesCard(o) {
    var list = db.getSessionNotes(o.id);
    var office = o.notes ? ui.notice('info', 'From the office', esc(o.notes) + (o.notesBy ? ' ' + stamp('Updated', o.notesBy, o.notesAt) : '')) : '';
    return K.card({ title: 'Notes', sub: 'Shared with the coaches on this occurrence', body: office +
      (list.length ? ui.rows(list.map(function (n) { return ui.row({ title: esc(n.text), after: stamp('Added', n.by, n.at) }); })) : '<p class="k-note">No notes yet.</p>') +
      '<div class="ch-addnote">' + K.field('Add a note', K.textarea('ch-session-note', '', 'Equipment, a change of plan, anything the team should know')) + K.actBtn('Add note', 'ch-note-add', { occ: o.id }, { variant: 'secondary', size: 'sm', icon: 'plus' }) + '</div>' });
  }
  function messageCard(o) {
    if (isClient(o)) return '';
    if (!db.hubCan('comms')) return K.card({ title: 'Message families', body: '<div class="k-locked">' + I('shield', 'icon-sm') + '<span><b>Lead coaches only</b><small>Messages to families of this session are sent by the lead coach or the office.</small></span></div>' });
    if (!K.feature('communications')) return K.card({ title: 'Message families of this session', body: K.featureOff('communications', 'Communications') });
    var sent = db.getSessionMessages(o.id), fams = {};
    db.getExpectedPlayers(o).forEach(function (pid) { var p = db.getPlayer(pid); if (p) fams[p.family] = 1; });
    return K.card({ title: 'Message families of this session', sub: Object.keys(fams).length + ' families of the expected players', body:
      K.form([K.field('Subject', K.input('ch-msg-subject', '', { placeholder: 'For example: Meet at the astro gate tonight' }), '', true), K.field('Message', K.textarea('ch-msg-body', '', 'Keep it short and practical'), '', true)], 1) +
      '<div class="k-row-actions">' + K.actBtn('Send to families', 'ch-msg-send', { occ: o.id }, { variant: 'primary', icon: 'megaphone' }) + '</div>' +
      (sent.length ? ui.rows(sent.map(function (m) { return ui.row({ lead: icoLead('megaphone'), title: esc(m.subject), sub: [esc(m.body), m.families + ' families'], after: stamp('Sent', m.by, m.at) }); }), 'rows--lead') : '') });
  }
  Hub.screens['coach-session'] = function (ctx) {
    var o = db.getOccurrence(ctx.param);
    var h = K.head({ back: ['coach-schedule', 'Schedule'], eyebrow: o ? K.d(o.date) + ' · ' + o.programme : 'Session', title: o ? o.session : 'Session',
      sub: o ? esc(o.start + '–' + o.end) + ' · ' + esc(venueName(o)) + ' · ' + esc(o.ageGroup) + ' ' + sessionRolePill(o) : '',
      actions: o ? K.goBtn('Take register', 'coach-register/' + o.id, { variant: 'primary', icon: 'check' }) + K.goBtn('Players', 'coach-players', { variant: 'secondary', icon: 'users' }) : '' });
    var g = K.guard(ctx, h, { empty: ['calendar', 'Nothing to show for this session', 'Details appear once the office confirms the occurrence.'] }); if (g) return g;
    if (!o) return notFound(h, 'Session', ['coach-schedule', 'Back to schedule']);
    if (!myEntry(o)) return notMine(h, 'You’re not on the staff for this occurrence, so its players and register are hidden.', ['coach-schedule', 'Back to schedule']);
    var s = myEntry(o), top = '';
    if (o.status === 'Cancelled') top += ui.notice('danger', 'Cancelled', esc(o.cancelReason) + ' ' + stamp('Cancelled', o.cancelledBy, o.cancelledAt));
    if (o.status === 'Rescheduled') top += ui.notice('warn', 'Rescheduled', esc(o.cancelReason) + (o.replacement ? ' · ' + K.link('coach-session/' + o.replacement, 'Open the new date') : ''));
    if (s.unavailable && !s.cover) top += ui.notice('warn', 'You’re marked unavailable', s.covering ? esc(db.coachName(s.covering)) + ' is covering for you.' : 'The office is arranging cover.', { action: K.goBtn('Cover', 'coach-cover', { size: 'sm', variant: 'secondary' }) });
    if (s.cover) top += ui.notice('info', 'You’re covering', s.covers ? 'Covering for ' + esc(db.coachName(s.covers)) + '.' : 'You were added as cover.');
    if (isLearning()) top += ui.notice('info', 'Learning coach view', 'You see player names and age groups. Medical and support details are kept with the lead coach.');
    var hist = K.card({ title: 'History', sub: 'Changes to this occurrence', body: K.timeline((o.history || []).slice().reverse().slice(0, 6)) });
    var left = expectedCard(o) + medicalCard(o) + messageCard(o);
    var right = venueCard(o) + teamCard(o) + notesCard(o) + hist;
    return page(h, top + cols(left, right));
  };

  /* ============================================================ REGISTER */
  var MARKS = ['Present', 'Late', 'Absent', 'Excused'];
  function markButtons(o, r, done) {
    var cur = r.mark ? r.mark.mark : '';
    if (done) return cur ? K.status(cur) : K.pill('Not marked', 'warn');
    return '<div class="segmented ch-marks" role="group" aria-label="Mark ' + esc(r.player ? r.player.name : r.name) + '">' + MARKS.map(function (m) {
      return '<button type="button" class="ch-mark ch-mark--' + m.toLowerCase() + '" data-action="ch-mark" data-occ="' + o.id + '" data-pid="' + esc(r.id) + '" data-mark="' + m + '" aria-pressed="' + (cur === m) + '">' + m + '</button>';
    }).join('') + '</div>';
  }
  Hub.screens['coach-register'] = function (ctx) {
    var o = db.getOccurrence(ctx.param), reg = o ? db.getRegister(o.id) : null;
    var h = K.head({ back: o ? ['coach-session/' + o.id, o.session] : ['coach-schedule', 'Schedule'], eyebrow: o ? 'Register · ' + K.d(o.date) + ', ' + o.start : 'Register', title: o ? o.session : 'Register',
      sub: o ? K.status(reg.state) + ' ' + (reg.state === 'Completed' ? stamp('Completed', reg.by, reg.at) : reg.startedBy ? stamp('Started', reg.startedBy, reg.startedAt) : '') : '' });
    var g = K.guard(ctx, h, { empty: ['check', 'No register yet', 'The register appears when the occurrence has players.'] }); if (g) return g;
    if (!o) return notFound(h, 'Register', ['coach-schedule', 'Back to schedule']);
    if (!K.feature('registers')) return page(h, K.featureOff('registers', 'Registers'));
    var s = myEntry(o);
    if (!s) return notMine(h, 'Only the coaches on this occurrence take its register.', ['coach-schedule', 'Back to schedule']);
    if (!db.canTakeRegister(o)) {
      var why = o.date > K.today ? 'You can take this register from ' + K.d(o.date) + '.' : 'This occurrence did not run, so there is no register.';
      return page(h, ui.notice('info', o.date > K.today ? 'Opens on the day' : 'No register', why, { action: K.goBtn('Open session', 'coach-session/' + o.id, { size: 'sm', variant: 'secondary' }) }) + (o.date > K.today ? expectedCard(o) : ''));
    }
    var done = reg.state === 'Completed', top = '';
    if (s.unavailable && !s.cover) top += ui.notice('warn', 'You were marked unavailable', 'You can still help with the register if you were there.');
    if (reg.reopenedBy) top += ui.notice('warn', 'Reopened', stamp('Reopened', reg.reopenedBy, reg.reopenedAt));
    if (isLearning()) top += ui.notice('info', 'Learning coach', 'You can mark the register. You see names only; your name and the time are recorded on every mark.');
    var foot;
    if (isClient(o)) {
      var hc = reg.headcount || { expected: o.players, actual: null };
      var body = K.kv([['Expected', '<b class="num">' + (hc.expected || o.players) + '</b>'], ['Counted', hc.actual != null ? '<b class="num">' + hc.actual + '</b> ' + stamp('Counted', hc.by || reg.by, hc.at || reg.at) : 'Not counted yet']]) +
        (done ? '' : '<div class="ch-headcount">' + K.field('Children here', K.input('ch-headcount', hc.actual != null ? hc.actual : '', { type: 'number' })) + K.actBtn('Save headcount', 'ch-headcount-save', { occ: o.id }, { variant: 'secondary' }) + '</div>');
      foot = done ? '' : K.actBtn('Complete register', 'ch-reg-complete', { occ: o.id }, { variant: 'primary', icon: 'check' });
      return page(h, top + K.card({ title: 'Headcount', sub: 'Client session: count the children who took part.', body: body + (foot ? '<div class="k-row-actions">' + foot + '</div>' : '') + (done ? '<p class="k-note">' + K.frozen('Completed') + ' ' + stamp('Completed', reg.by, reg.at) + '</p>' : '') }));
    }
    var rows = db.getRegisterRows(o.id), c = { Present: 0, Late: 0, Absent: 0, Excused: 0 }, unmarked = 0;
    rows.forEach(function (r) { if (r.mark && c[r.mark.mark] != null) c[r.mark.mark]++; else unmarked++; });
    var stats = K.stats([{ label: 'Present', value: c.Present }, { label: 'Late', value: c.Late }, { label: 'Absent', value: c.Absent, tone: c.Absent ? 'warn' : '' }, { label: 'Excused', value: c.Excused }, { label: 'Not marked', value: unmarked, tone: unmarked ? 'warn' : '' }]);
    var list = rows.map(function (r) {
      var name = r.player ? r.player.name : r.name, sub = [esc(r.player ? r.player.ageGroup : r.ageGroup)];
      if (r.trial) sub.push(K.pill('Trial', 'info')); if (r.oneOff) sub.push(K.pill('One-off', 'info'));
      if (r.membership && r.membership !== 'Active') sub.push(K.status(r.membership));
      if (r.mark && r.mark.note) sub.push('<span class="ch-mnote">' + I('chat', 'icon-sm') + esc(r.mark.note) + '</span>');
      var by = r.mark && r.mark.by ? stamp('Marked', r.mark.by, r.mark.at) : '';
      return '<div class="ch-reg">' + '<div class="ch-reg__who">' + ui.avatar(name, 'sm') + '<span><b>' + (r.player ? K.link('coach-player/' + r.player.id, name) : esc(name)) + '</b><small>' + sub.join(' ') + '</small>' + by + '</span></div>' +
        '<div class="ch-reg__acts">' + markButtons(o, r, done) + (done ? '' : '<button type="button" class="btn btn--tertiary btn--sm" data-action="ch-reg-note" data-occ="' + o.id + '" data-pid="' + esc(r.id) + '">' + I('chat', 'icon-sm') + '<span>Note</span></button>') + '</div></div>';
    }).join('');
    var acts = done ? (isLead() ? K.actBtn('Reopen register', 'ch-reg-reopen', { occ: o.id }, { variant: 'secondary', icon: 'refresh' }) : '<span class="k-note">Need a change? Ask your lead coach or the office to reopen it.</span>')
      : K.actBtn('Mark everyone else present', 'ch-mark-rest', { occ: o.id }, { variant: 'secondary' }) + K.actBtn('Add a one-off player', 'ch-oneoff', { occ: o.id }, { variant: 'tertiary', icon: 'plus' }) + K.actBtn('Complete register', 'ch-reg-complete', { occ: o.id }, { variant: 'primary', icon: 'check' });
    var card = K.card({ title: rows.length + ' players', sub: done ? K.frozen('Completed') + ' ' + stamp('Completed', reg.by, reg.at) : 'Mark each player, add a note for anything unusual, then complete it.', body: (rows.length ? '<div class="ch-regs">' + list + '</div>' : ui.empty('users', 'No players expected', '')) + '<div class="k-row-actions ch-reg__foot">' + acts + '</div>' });
    return page(h, top + stats + card);
  };

  /* ============================================================ PLAYERS */
  function fbState(k, pid) {
    var mine = db.getMyFeedback(k, pid)[0];
    if (!mine) return '';
    return K.pill(mine.status === 'Awaiting review' ? (mine.learning && !mine.signedOff ? 'Awaiting sign-off' : 'Awaiting review') : 'Feedback ' + mine.status.toLowerCase(), mine.status === 'Returned' ? 'warn' : mine.status === 'Published' ? 'ok' : mine.status === 'Draft' ? '' : 'info');
  }
  Hub.screens['coach-players'] = function (ctx) {
    var k = meKey(), mine = db.getMyPlayers(k), sessions = db.getMySessions(k);
    var tabs = [{ id: 'all', label: 'All', meta: mine.length }].concat(sessions.map(function (a) { return { id: a.session, label: a.sessionName, meta: mine.filter(function (x) { return x.sessions.indexOf(a.session) >= 0; }).length }; }));
    var h = K.head({ eyebrow: hub(), title: 'My players', sub: isLearning() ? 'Names and age groups for the sessions you help on.' : 'Players in the sessions you coach: attendance, feedback and ' + esc(K.label('IDPs')) + '.', tabs: K.tabs('ch-players', tabs) });
    var g = K.guard(ctx, h, { empty: ['users', 'No players yet', 'Players appear when you’re assigned to a session with members.'] }); if (g) return g;
    var tab = K.tab('ch-players', tabs), list = tab === 'all' ? mine : mine.filter(function (x) { return x.sessions.indexOf(tab) >= 0; });
    var top = isLearning() ? ui.notice('info', 'Names only', 'As a learning coach you see names and age groups. Ages, schools, medical, support and contact details stay locked.') : '';
    var fbOpen = db.getMyReturnedFeedback(k).length + db.getMyDraftFeedback(k).length;
    var stats = isLearning() ? '' : K.stats([
      { label: 'Players', value: mine.length, sub: sessions.length + ' session' + (sessions.length === 1 ? '' : 's') },
      { label: 'Feedback to finish', value: fbOpen, sub: 'Drafts and returned', tone: fbOpen ? 'warn' : '' },
      { label: 'Awaiting review', value: db.getFeedback(null, { coach: k, status: 'Awaiting review' }).length, sub: 'Not visible to parents yet' },
      { label: 'Medical or support', value: mine.filter(function (x) { return x.player.medical !== 'none' || x.player.support !== 'none'; }).length, sub: 'Check before sessions' }
    ]);
    var cards = list.map(function (x) {
      var p = x.player, sess = x.sessions.map(function (s) { return db.getSession(s).name; }).join(', ');
      var pills = isLearning() ? K.pill(p.ageGroup, '') : K.pill(p.ageGroup, '') + playerFlags(p) + fbState(k, p.id) + (x.states.indexOf('Trial') >= 0 ? K.pill('Trial', 'info') : '');
      return '<a class="lx-person ch-person" href="#coach-player/' + p.id + '">' + ui.avatar(p.name, '') + '<span class="lx-person__text"><b>' + esc(p.name) + '</b><small>' + esc(sess) + '</small></span>' + I('arrowRight', 'icon-sm lx-person__go') + '<span class="lx-person__pills">' + pills + '</span></a>';
    }).join('');
    return page(h, top + stats + (cards ? '<div class="lx-people">' + cards + '</div>' : '<div class="zone-inset">' + ui.empty('users', 'No players in this session', '') + '</div>'));
  };

  function playerHead(p, sub, actions, back) {
    return K.head({ back: back || ['coach-players', 'My players'], eyebrow: p ? p.ageGroup + ' · ' + (db.getMyPlayerSessions(meKey(), p.id).map(function (s) { return db.getSession(s).name; }).join(', ') || 'Not in your sessions') : 'Player', title: p ? p.name : 'Player', sub: sub || '', actions: actions || '' });
  }
  Hub.screens['coach-player'] = function (ctx) {
    var k = meKey(), p = db.getPlayer(ctx.param);
    var h = playerHead(p, p ? rolePill() : '', p ? K.goBtn('Write feedback', 'coach-feedback/' + p.id, { variant: 'primary', icon: 'development' }) + K.goBtn(K.label('IDP'), 'coach-idp/' + p.id, { variant: 'secondary' }) : '');
    var g = K.guard(ctx, h, { empty: ['users', 'Nothing to show yet', 'Attendance and feedback appear once this player has been to a session.'] }); if (g) return g;
    if (!p) return notFound(h, 'Player', ['coach-players', 'Back to my players']);
    if (!db.isMyPlayer(k, p.id)) return notMine(h, p.name + ' is not in any session you coach, so their profile is hidden.', ['coach-players', 'Back to my players']);
    var sess = db.getMyPlayerSessions(k, p.id), mems = db.getPlayerMemberships(p.id).filter(function (m) { return sess.indexOf(m.session) >= 0 && m.state !== 'Ended'; });
    var age = Math.floor(K.daysBetween(p.dob, K.today) / 365.25);
    var about = K.card({ title: 'About', sub: isLearning() ? 'Learning coaches see the name and age group only.' : '', body: K.kv([['Age group', esc(p.ageGroup)], ['Sessions', esc(sess.map(function (s) { return db.getSession(s).name; }).join(', '))], ['Membership', mems.map(function (m) { return K.status(m.state); }).join(' ') || K.pill('Trial', 'info')]]) +
      sens(K.kv([['Age', age + ' (born ' + esc(K.d(p.dob)) + ')'], ['School', esc(p.school + ' · ' + p.year)], ['Joined', esc(K.d(p.joined))], ['Photo consent', esc({ yes: 'Yes', no: 'No', unknown: 'Not given yet' }[p.photo] || p.photo)]]), 'Personal details') });
    var att = sess.map(function (sid) { var sm = db.getAttendanceSummary(p.id, sid); return [db.getSession(sid).name, sm.total ? '<b class="num">' + (sm.pct != null ? sm.pct + '%' : '—') + '</b> · ' + sm.present + ' present, ' + sm.late + ' late, ' + sm.absent + ' absent, ' + sm.excused + ' excused' : 'No registers yet']; });
    var recent = db.getAttendance(p.id).filter(function (x) { return sess.indexOf(x.occurrence.sessionId) >= 0; }).slice(0, 5);
    var attCard = K.card({ title: 'Attendance', sub: 'From completed registers', body: K.kv(att) + (recent.length ? ui.rows(recent.map(function (x) { return ui.row({ title: esc(x.occurrence.session + ' · ' + K.dd(x.occurrence.date)), sub: [x.note ? esc(x.note) : ''], after: stamp('Marked', x.by, x.at), trail: K.status(x.mark), href: '#coach-session/' + x.occurrence.id }); })) : '') });
    var fbs = db.getFeedback(p.id).filter(function (f) { return f.coach === k || f.status === 'Published'; });
    var fbCard = K.card({ title: 'Feedback', sub: 'Yours, and what the family has seen', right: K.goBtn('Write feedback', 'coach-feedback/' + p.id, { size: 'sm', variant: 'tertiary' }), body: fbs.length ? ui.rows(fbs.map(function (f) {
      return ui.row({ title: esc(f.period + ' · ' + db.coachName(f.coach)), sub: [esc(f.focus || f.keepDoing || ''), f.status === 'Published' ? 'Visible to the family' : 'Not visible to parents until reviewed'], trail: K.status(f.status), href: '#coach-feedback/' + p.id });
    })) : ui.empty('development', 'No feedback yet', 'Write the first one after a session.') });
    var med = K.card({ title: 'Medical', body: sens(p.medical === 'details' ? '<p class="ch-sens">' + esc(p.medicalDetail) + '</p>' : p.medical === 'not_confirmed' ? ui.notice('warn', 'Not confirmed', 'The family has not confirmed medical details yet. Ask at pick-up.') : '<p class="ch-sens">No medical needs recorded by the family.</p>', 'Medical details') });
    var sup = K.card({ title: 'Support needs', body: sens(p.support === 'details' ? '<p class="ch-sens">' + esc(p.supportDetail) + '</p>' : '<p class="ch-sens">No support needs shared.</p>', 'Support needs') });
    var emg = K.card({ title: 'Emergency contacts', body: sens(ui.rows(p.emergency.map(function (e) { return ui.row({ lead: icoLead('phone'), title: esc(e.name), sub: [esc(e.rel), esc(e.phone)] }); })), 'Emergency contacts') });
    var idp = db.getMyIdp(p.id);
    var idpCard = K.card({ title: K.label('IDP'), sub: idp ? esc(db.getReviewPeriod(idp.period).name) : 'Nothing started this term', right: K.goBtn('Open', 'coach-idp/' + p.id, { size: 'sm', variant: 'tertiary' }),
      body: idp ? K.kv([['Status', K.status(idp.status)], ['Targets', String(idp.targets.length)], ['Updated', stamp('Updated', idp.updatedBy, idp.updatedAt)]]) : '<p class="k-note">' + (db.hubCan('editPlans') ? 'Start the ' + esc(K.label('IDP')) + ' with one or two targets.' : 'A lead coach starts the ' + esc(K.label('IDP')) + '.') + '</p>' });
    var top = isLearning() ? ui.notice('info', 'Names only', 'You see ' + esc(first(p.name)) + '’s name and age group. Personal, medical, support and contact details are locked for learning coaches.') : '';
    return page(h, top + cols(about + attCard + fbCard, med + sup + emg + idpCard));
  };

  /* ============================================================ FEEDBACK */
  function ratingRow(g, current) {
    var labels = db.getFrameworkSettings().labels, cur = current || 'none';
    return '<div class="ch-rate"><div class="ch-rate__text"><b>' + esc(g.name) + '</b><small>' + esc(g.items.join(' · ')) + '</small></div><div class="segmented ch-rate__opts" role="group" aria-label="' + esc(g.name) + '">' +
      labels.map(function (l) { return '<button type="button" data-action="ch-rate" data-group="' + g.id + '" data-val="' + l.id + '" aria-pressed="' + (cur === l.id) + '"><i class="ch-dot" style="--c:' + esc(l.color) + '"></i>' + esc(l.label) + '</button>'; }).join('') +
      '<button type="button" data-action="ch-rate" data-group="' + g.id + '" data-val="none" aria-pressed="' + (cur === 'none') + '">Not rated</button></div></div>';
  }
  function fbSummary(f) {
    var labels = Object.keys(f.ratings || {}).map(function (gid) { var g = db.getFrameworkGroup(gid), l = db.getColourLabel(f.ratings[gid]); return g && l ? '<span class="ch-chip"><i class="ch-dot" style="--c:' + esc(l.color) + '"></i>' + esc(g.name) + ': ' + esc(l.label) + '</span>' : ''; }).join('');
    return K.kv([f.keepDoing ? ['Keep doing', esc(f.keepDoing)] : null, f.focus ? ['Focus', esc(f.focus)] : null, f.general ? ['General', esc(f.general)] : null, labels ? ['Ratings', '<span class="ch-chips">' + labels + '</span>'] : null]);
  }
  Hub.screens['coach-feedback'] = function (ctx) {
    var k = meKey(), p = db.getPlayer(ctx.param);
    var h = playerHead(p, p ? 'Feedback · ' + esc(db.getCurrentFeedbackPeriod()) + ' ' + rolePill() : '', '', p ? ['coach-player/' + p.id, p.name] : null);
    var g = K.guard(ctx, h, { empty: ['development', 'No feedback yet', 'Feedback you write for this player appears here.'] }); if (g) return g;
    if (!p) return notFound(h, 'Player', ['coach-players', 'Back to my players']);
    if (!K.feature('development')) return page(h, K.featureOff('development', 'Development and feedback'));
    if (!db.isMyPlayer(k, p.id)) return notMine(h, 'You can write feedback only for players in your sessions.', ['coach-players', 'Back to my players']);
    var set = db.getFrameworkSettings(), groups = db.getFrameworkGroups('coach'), open = db.getOpenFeedback(k, p.id), sess = db.getMyPlayerSessions(k, p.id);
    var learning = isLearning(), canWrite = db.hubCan('feedback') || learning;
    var editor;
    if (!canWrite) editor = K.card({ title: 'Write feedback', body: '<div class="k-locked">' + I('shield', 'icon-sm') + '<span><b>Feedback is switched off for your role</b><small>Management can turn “Add feedback” back on in Session roles.</small></span></div>' });
    else {
      var f = open || { keepDoing: '', focus: '', general: '', ratings: {}, session: sess[0] };
      var ret = open && open.status === 'Returned' && open.returns.length ? open.returns[open.returns.length - 1] : null;
      var fields = [];
      if (sess.length > 1) fields.push(K.field('Session', K.select('fb-session', sess.map(function (s) { return [s, db.getSession(s).name]; }), f.session), '', true));
      if (set.keepDoing) fields.push(K.field('Keep doing', K.textarea('fb-keep', f.keepDoing, 'One thing ' + first(p.name) + ' should keep doing'), 'Short, specific and positive.', true));
      if (set.focus) fields.push(K.field('Focus', K.textarea('fb-focus', f.focus, 'One clear thing to work on next'), 'One clear action, not a list.', true));
      if (set.general) fields.push(K.field('General', K.textarea('fb-general', f.general, 'Anything else the family should know (optional)'), '', true));
      var rated = groups.filter(function (x) { return x.rating; });
      var submitLabel = learning ? 'Send for sign-off' : 'Submit for review';
      editor = K.card({ title: open ? (open.status === 'Returned' ? 'Returned: update and resubmit' : 'Draft') : 'New feedback', sub: esc(open ? open.period : db.getCurrentFeedbackPeriod()) + (open ? ' · ' + (open.savedBy ? stamp('Saved', open.savedBy, open.savedAt) : open.startedBy ? stamp('Started', open.startedBy, open.startedAt) : stamp('Submitted', open.submittedBy, open.submittedAt)) : ''), right: open ? K.status(open.status) : '',
        body: (ret ? ui.notice('warn', 'Returned with a note', esc(ret.note) + ' ' + stamp('Returned', ret.by, ret.at)) : '') +
          K.form(fields, 1) + (rated.length ? '<h3 class="ch-h3">Framework ratings</h3><div class="ch-rates">' + rated.map(function (x) { return ratingRow(x, (f.ratings || {})[x.id]); }).join('') + '</div>' : '') +
          (learning ? ui.notice('info', 'Your lead coach signs this off', 'Learning coach feedback goes to the session’s lead coach first, then the office reviews it. Families see nothing until it is published.') : ui.notice('neutral', 'Not visible to parents until reviewed', 'The office reviews feedback before families see it.')) +
          '<div class="k-row-actions">' + K.actBtn('Save draft', 'ch-fb-save', { pid: p.id, id: open ? open.id : '' }, { variant: 'secondary' }) + K.actBtn(submitLabel, 'ch-fb-submit', { pid: p.id, id: open ? open.id : '' }, { variant: 'primary', icon: 'arrowRight' }) + '</div>' + (open ? '<h3 class="ch-h3">History</h3>' + K.timeline(open.history.slice().reverse()) : '') });
    }
    var mine = db.getMyFeedback(k, p.id).filter(function (x) { return x !== open; });
    var histCard = K.card({ title: 'Your feedback for ' + first(p.name), sub: mine.length ? '' : 'Nothing submitted yet', body: mine.length ? mine.map(function (x) {
      var vis = x.status === 'Published' ? K.pill('Visible to the family', 'ok') : '<span class="ch-hidden">' + I('shield', 'icon-sm') + 'Not visible to parents until reviewed</span>';
      var sign = x.learning ? (x.signedOff ? K.pill('Signed off by ' + first(x.signedOff.by), 'ok') : K.pill('Awaiting lead sign-off', 'warn')) : '';
      return '<article class="ch-fb"><div class="ch-fb__head"><b>' + esc(x.period) + '</b>' + K.status(x.status) + sign + '</div>' + fbSummary(x) + '<div class="ch-fb__vis">' + vis + '</div>' + K.timeline(x.history.slice().reverse()) + '</article>';
    }).join('') : '<p class="k-note">When you submit feedback it appears here with each step and who did it.</p>' });
    var signs = db.getFeedbackToSignOff(k).filter(function (x) { return x.player === p.id; });
    var signCard = signs.length ? K.card({ title: 'Learning coach feedback to sign off', sub: 'You lead this session, so you sign it off before the office reviews it.', body: signs.map(function (x) {
      return '<article class="ch-fb"><div class="ch-fb__head"><b>' + esc(db.coachName(x.coach)) + ' · ' + esc(x.period) + '</b>' + K.pill('Awaiting sign-off', 'warn') + '</div>' + fbSummary(x) + '<div class="k-row-actions">' + K.actBtn('Sign off', 'ch-fb-signoff', { id: x.id }, { variant: 'primary', icon: 'check' }) + '</div></article>';
    }).join('') }) : '';
    var others = db.getFeedback(p.id, { publishedOnly: true }).filter(function (x) { return x.coach !== k; });
    var pubCard = others.length ? K.card({ title: 'Published by other coaches', sub: 'What the family has already seen', body: others.map(function (x) { return '<article class="ch-fb"><div class="ch-fb__head"><b>' + esc(x.period + ' · ' + db.coachName(x.coach)) + '</b>' + K.status('Published') + '</div>' + fbSummary(x) + stamp('Published', x.publishedBy, x.publishedAt) + '</article>'; }).join('') }) : '';
    var guide = K.card({ title: 'Framework', sub: esc(db.getFramework().name) + ' · version ' + db.getFramework().version, body: ui.rows(groups.map(function (x) { return ui.row({ title: esc(x.name), sub: [esc(x.prompt)], trail: x.parent ? '' : K.pill('Coaches only', '') }); })) +
      '<div class="ch-legend">' + set.labels.map(function (l) { return '<span class="ch-chip"><i class="ch-dot" style="--c:' + esc(l.color) + '"></i>' + esc(l.label) + '</span>'; }).join('') + '</div>' });
    return page(h, cols(editor + signCard + histCard, guide + pubCard));
  };

  /* ============================================================ IDP */
  var TSTATES = ['Not started', 'In progress', 'On track', 'At risk', 'Achieved'];
  Hub.screens['coach-idp'] = function (ctx) {
    var k = meKey(), p = db.getPlayer(ctx.param), L = K.label('IDP'), period = db.getCurrentReviewPeriod();
    var h = playerHead(p, p ? esc(L) + ' · ' + esc(period ? period.name + ', review by ' + K.d(period.reviewBy) : 'No open review period') : '', '', p ? ['coach-player/' + p.id, p.name] : null);
    if (p) h = h.replace('<h1 class="lx-title">' + esc(p.name) + '</h1>', '<h1 class="lx-title">' + esc(L) + ' · ' + esc(p.name) + '</h1>');
    var g = K.guard(ctx, h, { empty: ['development', 'No ' + L + ' yet', 'Targets for this player appear here once the plan is started.'] }); if (g) return g;
    if (!p) return notFound(h, 'Player', ['coach-players', 'Back to my players']);
    if (!K.feature('development')) return page(h, K.featureOff('development', 'Development and feedback'));
    if (!db.isMyPlayer(k, p.id)) return notMine(h, 'You can see the ' + L + ' only for players in your sessions.', ['coach-players', 'Back to my players']);
    var idp = db.getMyIdp(p.id), can = db.hubCan('editPlans');
    var permNote = can ? '' : ui.notice('info', isLearning() ? 'View only' : 'Lead coaches edit targets', isLearning() ? 'Learning coaches can’t see or change ' + esc(L) + ' targets.' : '“Edit development plans” is off for the ' + esc(staff()) + ' role, so you can read the targets but not change them.');
    var main;
    if (!idp) {
      main = K.card({ title: L + ' for ' + (period ? period.name : 'this term'), body: ui.empty('development', 'Not started yet', can ? 'Start the plan, then add one or two clear targets.' : 'A lead coach starts the plan for this player.') + (can && period ? '<div class="k-row-actions">' + K.actBtn('Start ' + L, 'ch-idp-start', { pid: p.id }, { variant: 'primary', icon: 'plus' }) + '</div>' : '') });
    } else {
      var targets = idp.targets.map(function (t, n) {
        var grp = db.getFrameworkGroup(t.group);
        return '<div class="ch-target"><div class="ch-target__text"><b>' + esc(t.text) + '</b><small>' + esc(grp ? grp.name : '') + '</small></div><div class="ch-target__acts">' +
          (can ? K.select('idp-st-' + n, TSTATES, t.status) + K.actBtn('Update', 'ch-idp-status', { id: idp.id, n: n }, { size: 'sm', variant: 'secondary' }) + K.actBtn('Edit', 'ch-idp-edit', { id: idp.id, n: n }, { size: 'sm', variant: 'tertiary' }) : K.status(t.status)) + '</div></div>';
      }).join('');
      var add = can ? '<h3 class="ch-h3">Add a target</h3>' + K.form([K.field('Target', K.input('idp-new-text', '', { placeholder: 'One clear, measurable target' }), '', true), K.field('Framework area', K.select('idp-new-group', db.getFrameworkGroups('coach').map(function (x) { return [x.id, x.name]; }), 'GRP-TEC'))], 2) +
        '<div class="k-row-actions">' + K.actBtn('Add target', 'ch-idp-add', { id: idp.id }, { variant: 'secondary', icon: 'plus' }) + (idp.status === 'Draft' || idp.status === 'Not started' ? K.actBtn('Mark as agreed', 'ch-idp-agree', { id: idp.id }, { variant: 'primary', icon: 'check' }) : '') + '</div>' : '';
      var shared = idp.sharedBy ? K.pill('Shared with family', 'ok') + ' ' + stamp('Shared', idp.sharedBy, idp.sharedAt) : '<span class="ch-hidden">' + I('shield', 'icon-sm') + 'Not visible to the family until the office shares it</span>';
      var inner = (targets ? '<div class="ch-targets">' + targets + '</div>' : ui.empty('development', 'No targets yet', can ? 'Add the first target below.' : 'Targets appear once a lead coach adds them.')) + add;
      main = K.card({ title: L + ' · ' + db.getReviewPeriod(idp.period).name, sub: stamp('Updated', idp.updatedBy, idp.updatedAt), right: K.status(idp.status), body: '<p class="ch-shared">' + shared + '</p>' + (isLearning() ? sens(inner, L + ' targets') : inner) });
    }
    var hist = idp ? K.card({ title: 'History', sub: 'Every change, with who and when', body: K.timeline(idp.history.slice().reverse()) }) : '';
    var past = db.getPastIdps(p.id);
    var pastCard = K.card({ title: 'Earlier plans', body: past.length ? ui.rows(past.map(function (x) { return ui.row({ title: esc(db.getReviewPeriod(x.period).name), sub: [x.targets.length + ' targets', esc(x.reviewNote || '')], trail: K.status(x.status) }); })) : '<p class="k-note">No earlier plans.</p>' });
    return page(h, permNote + cols(main + hist, pastCard + K.card({ title: 'Feedback', sub: 'Targets work best alongside feedback', body: K.goBtn('Write feedback', 'coach-feedback/' + p.id, { variant: 'secondary', icon: 'development' }) })));
  };

  /* ============================================================ LIBRARY */
  var RES_ICON = { 'Session plan': 'whistle', Video: 'star', Guide: 'book', PDF: 'download' };
  Hub.screens['coach-library'] = function (ctx) {
    var k = meKey(), all = db.getResources('coach'), types = ['all'].concat(all.map(function (r) { return r.type; }).filter(function (v, i, a) { return a.indexOf(v) === i; }));
    var segs = types.map(function (t) { return { id: t, label: t === 'all' ? 'All' : t }; });
    var h = K.head({ eyebrow: hub(), title: 'Library', sub: 'Session plans, drills and guides for coaches.', actions: K.goBtn('Support', 'coach-support', { variant: 'secondary', icon: 'support' }) + K.goBtn('Venues', 'coach-venues', { variant: 'secondary', icon: 'venue' }) });
    var g = K.guard(ctx, h, { empty: ['book', 'The library is empty', 'Session plans and guides from the office appear here.'] }); if (g) return g;
    var t = K.tab('ch-lib', segs), list = all.filter(function (r) { return t === 'all' || r.type === t; });
    var saved = db.getSavedResources(k).map(db.getResource).filter(Boolean);
    function row(r) { return ui.row({ lead: icoLead(RES_ICON[r.type] || 'book'), title: esc(r.title), sub: [esc(r.type), esc(r.topic), 'Updated by ' + esc(r.updatedBy) + ', ' + esc(K.dt(r.updatedAt))], trail: db.isResourceSaved(k, r.id) ? K.pill('Saved', 'ok') : '', action: 'ch-res', data: { id: r.id } }); }
    var savedCard = K.card({ title: 'Saved for later', sub: saved.length ? saved.length + ' saved' : 'Save anything you want to come back to', body: saved.length ? ui.rows(saved.map(row), 'rows--lead') : '<p class="k-note">Nothing saved yet.</p>' });
    var notices = db.getNotices('Coaches');
    var noticeCard = K.card({ title: 'Notices', sub: 'From the office', body: notices.length ? ui.rows(notices.map(function (n) { return ui.row({ lead: icoLead('megaphone'), title: esc(n.title), sub: [esc(n.body)], after: stamp('Sent', n.by, n.at) }); }), 'rows--lead') : '<p class="k-note">No notices.</p>' });
    return page(h, cols(K.card({ title: 'Resources', sub: list.length + ' item' + (list.length === 1 ? '' : 's'), right: K.seg('ch-lib', segs), body: list.length ? ui.rows(list.map(row), 'rows--lead') : ui.empty('book', 'Nothing of this type', '') }), savedCard + noticeCard));
  };

  /* ============================================================ SUPPORT */
  Hub.screens['coach-support'] = function (ctx) {
    var k = meKey();
    var h = K.head({ back: ['coach-library', 'Library'], eyebrow: hub(), title: 'Support', sub: 'Who to call, how things work, and questions to the office.' });
    var g = K.guard(ctx, h, { empty: ['support', 'No support content yet', 'Contacts and guides from the office appear here.'] }); if (g) return g;
    var items = db.getCoachSupport(), contacts = items.filter(function (s) { return s.kind === 'Contact'; }), guides = items.filter(function (s) { return s.kind === 'Guide'; });
    var cCard = K.card({ title: 'Contacts', body: ui.rows(contacts.map(function (c) { return ui.row({ lead: icoLead('phone'), title: esc(c.title), sub: [esc(c.detail)] }); }), 'rows--lead') });
    var gCard = K.card({ title: 'How to', body: ui.rows(guides.map(function (c) { return ui.row({ lead: icoLead('book'), title: esc(c.title), sub: [esc(c.detail)], action: 'ch-guide', data: { id: c.id } }); }), 'rows--lead') });
    var qs = db.getOfficeQuestions(k);
    var ask = K.card({ title: 'Ask the office', sub: 'Questions go to the office and the answer appears here.', body: K.form([K.field('Your question', K.textarea('ch-ask-text', '', 'Kit, rotas, venues, anything else'), '', true)], 1) + '<div class="k-row-actions">' + K.actBtn('Send question', 'ch-ask', {}, { variant: 'primary' }) + '</div>' +
      (qs.length ? ui.rows(qs.map(function (q) { return ui.row({ title: esc(q.text), sub: [q.answer ? '<b>Answer:</b> ' + esc(q.answer.text) : 'Waiting for an answer'], after: stamp('Asked', q.by, q.at) + (q.answer ? stamp('Answered', q.answer.by, q.answer.at) : ''), trail: K.pill(q.answer ? 'Answered' : 'Open', q.answer ? 'ok' : 'warn') }); })) : '') });
    var links = K.tiles([
      { route: 'coach-availability', icon: 'clock', title: 'Availability', desc: 'Mark dates you can’t make.' },
      { route: 'coach-cover', icon: 'coaches', title: 'Cover', desc: 'Offers and your requests.' },
      { route: 'coach-documents', icon: 'shield', title: 'Documents', desc: 'DBS, first aid and qualifications.' },
      { route: 'coach-venues', icon: 'venue', title: 'Venues', desc: 'Access, parking, meeting points.' }
    ], 4);
    return page(h, cols(cCard + gCard, ask) + links);
  };

  /* ============================================================ VENUES */
  Hub.screens['coach-venues'] = function (ctx) {
    var k = meKey();
    var h = K.head({ back: ['coach-library', 'Library'], eyebrow: hub(), title: 'Venues', sub: 'Where you coach: addresses, access, parking and meeting points.' });
    var g = K.guard(ctx, h, { empty: ['venue', 'No venues yet', 'Venues appear once sessions are set up.'] }); if (g) return g;
    var cards = db.getMyVenues(k).map(function (x) {
      var v = x.venue, next = db.getMyOccurrences(k, { from: K.today }).filter(function (o) { return o.venue === v.key && o.status === 'Scheduled'; })[0];
      var closed = db.getVenueUnavailability(v.key).filter(function (u) { return u.to >= K.today; });
      return K.card({ title: v.name, sub: esc(v.area || '') + (x.uses ? ' · you’ve been here ' + x.uses + ' time' + (x.uses === 1 ? '' : 's') + ' in 4 weeks' : ''), right: v.active ? (x.uses ? K.pill('You coach here', 'info') : '') : K.pill('Inactive', ''),
        body: K.kv([['Address', esc(v.address || '—')], ['Meeting point', esc(v.meetingPoint || '—')], ['Parking', esc(v.parking || '—')], ['Access', esc(v.access || '—')], ['On site', esc(v.siteMap || '—')]]) +
          closed.map(function (u) { return ui.notice('warn', 'Closed ' + (u.from === u.to ? K.dd(u.from) : K.dm(u.from) + '–' + K.dm(u.to)), esc(u.reason) + ' ' + stamp('Recorded', u.by, u.at)); }).join('') +
          (next ? '<div class="k-row-actions">' + K.goBtn('Next here: ' + next.session + ', ' + K.dd(next.date), 'coach-session/' + next.id, { size: 'sm', variant: 'secondary', trail: 'arrowRight' }) + '</div>' : '') });
    });
    return page(h, K.grid(cards, 2));
  };

  /* ============================================================ AVAILABILITY */
  Hub.screens['coach-availability'] = function (ctx) {
    var k = meKey();
    var h = K.head({ eyebrow: hub(), title: 'Availability', sub: 'Your usual week, and the dates you can’t make. Marking a date can ask the office for cover straight away.', actions: K.goBtn('Cover', 'coach-cover', { variant: 'secondary', icon: 'coaches' }) });
    var g = K.guard(ctx, h, { empty: ['clock', 'No availability yet', 'Set the days you can usually coach.'] }); if (g) return g;
    var wk = db.getWeeklyAvailability(k), dows = db.getDows(), upd = db.getWeeklyUpdated();
    var week = '<div class="ch-week">' + dows.map(function (d, i) {
      var w = wk[i];
      return '<button type="button" class="ch-day' + (w ? ' is-on' : '') + '" data-action="ch-av-day" data-i="' + i + '" aria-pressed="' + !!w + '"><span>' + esc(d) + '</span><b>' + (w ? esc(w[0] + '–' + w[1]) : 'Off') + '</b></button>';
    }).join('') + '</div>';
    var weekCard = K.card({ title: 'Usual week', sub: 'Tap a day to switch it on or off. ' + stamp('Last updated', upd.by, upd.at), body: week });
    var reqs = db.getMyCoverRequests(k);
    var ex = db.getAvailabilityExceptions(k).slice().reverse();
    var exCard = K.card({ title: 'Dates you can’t make', sub: ex.length ? ex.length + ' on file' : 'Nothing marked', body: ex.length ? ui.rows(ex.map(function (e) {
      var linked = reqs.filter(function (r) { return r.exception === e.id; })[0], past = e.to < K.today;
      var impact = past ? [] : db.getAbsenceImpact(k, e.from, e.to);
      var acts = '';
      if (!past && !linked && e.type !== 'Different hours' && K.feature('cover')) acts += K.actBtn('Request cover', 'ch-av-cover', { id: e.id }, { size: 'sm', variant: 'secondary' });
      if (!past && !linked) acts += K.actBtn('Remove', 'ch-av-remove', { id: e.id }, { size: 'sm', variant: 'tertiary' });
      return ui.row({ title: esc((e.from === e.to ? K.dd(e.from) : K.dm(e.from) + '–' + K.dm(e.to)) + (e.start ? ', ' + e.start + '–' + e.end : '')), sub: [esc(e.reason), linked ? 'Cover ' + esc(linked.id) + ': ' + esc(db.coverStatus(linked)) : impact.length ? impact.length + ' session' + (impact.length === 1 ? '' : 's') + ' affected' : ''],
        after: stamp('Recorded', e.by, e.at) + (acts ? '<div class="k-row-actions ch-rowacts">' + acts + '</div>' : ''), trail: K.pill(e.type, e.type === 'Holiday' ? 'info' : e.type === 'Unavailable' ? 'danger' : 'warn') });
    })) : '<p class="k-note">Nothing marked.</p>' });
    var form = K.card({ title: 'Mark dates you can’t make', sub: 'Holiday, illness or a one-off. The office sees it straight away.', body: K.form([
      K.field('Type', K.select('av-type', ['Unavailable', 'Holiday', 'Different hours'], 'Unavailable')),
      K.field('Reason', K.input('av-reason', '', { placeholder: 'For example: family wedding' })),
      K.field('From', K.input('av-from', K.addDays(K.today, 7), { type: 'date' })),
      K.field('To', K.input('av-to', K.addDays(K.today, 7), { type: 'date' })),
      K.field('Start time (optional)', K.input('av-start', '', { type: 'time' }), 'Leave blank for the whole day'),
      K.field('End time (optional)', K.input('av-end', '', { type: 'time' })),
      K.field('Cover', K.select('av-cover', K.feature('cover') ? [['yes', 'Request cover for my sessions'], ['no', 'Just mark me unavailable']] : [['no', 'Just mark me unavailable']], K.feature('cover') ? 'yes' : 'no'), K.feature('cover') ? 'Cover is requested for every session you’re on in those dates.' : 'The cover workflow is switched off.', true)
    ], 2) + '<div class="k-row-actions">' + K.actBtn('Save', 'ch-av-save', {}, { variant: 'primary', icon: 'check' }) + '</div>' });
    return page(h, cols(form + exCard, weekCard));
  };

  /* ============================================================ COVER */
  Hub.screens['coach-cover'] = function (ctx) {
    var k = meKey();
    var h = K.head({ eyebrow: hub(), title: 'Cover', sub: 'Cover offered to you, and cover for the dates you can’t make.', actions: K.goBtn('Mark dates unavailable', 'coach-availability', { variant: 'secondary', icon: 'clock' }) });
    var g = K.guard(ctx, h, { empty: ['coaches', 'No cover yet', 'Cover offered to you and your own requests appear here.'] }); if (g) return g;
    if (!K.feature('cover')) return page(h, K.featureOff('cover', 'Cover workflow'));
    var offers = db.getCoverOffersFor(k);
    var offerCards = offers.map(function (x) {
      var o = x.occurrence, f = x.offer, n = x.need, state;
      if (!f.response) state = '<div class="k-row-actions">' + K.actBtn('Accept', 'ch-cover-accept', { req: x.request.id, need: n.id, offer: f.id }, { variant: 'primary', icon: 'check' }) + K.actBtn('Decline', 'ch-cover-decline', { req: x.request.id, need: n.id, offer: f.id }, { variant: 'secondary' }) + '</div>';
      else if (f.response === 'Declined') state = ui.notice('neutral', 'You declined', esc(f.note || '') + ' ' + stamp('Declined', db.coachName(f.coach), f.respondedAt));
      else if (n.state === 'Covered' && n.confirmed && n.confirmed.coach === k) state = ui.notice('ok', 'Confirmed: you’re on the staff', stamp('Confirmed', n.confirmed.by, n.confirmed.at), { action: K.goBtn('Open session', 'coach-session/' + o.id, { size: 'sm', variant: 'secondary' }) });
      else if (n.state === 'Covered') state = ui.notice('neutral', 'Covered by someone else', 'Thanks for accepting. ' + esc(db.coachName(n.confirmed.coach)) + ' was confirmed.');
      else state = ui.notice('info', 'Accepted: waiting for the office to confirm', stamp('Accepted', db.coachName(f.coach), f.respondedAt));
      var absent = n.absent ? 'Covering for ' + db.coachName(n.absent) + (x.request.reason ? ': ' + x.request.reason : '') : (x.request.reason || 'No coach assigned yet');
      return K.card({ title: o.session, sub: esc(when(o)) + ' · ' + esc(venueName(o)), right: K.status(f.response || 'Offered'),
        body: K.kv([['Why', esc(absent)], ['Expected', isClient(o) ? o.players + ' (headcount)' : db.getExpectedPlayers(o).length + ' players'], ['Your pay', '<b class="num">' + K.money(f.cost) + '</b> <small>(' + K.money(f.rate) + ' an hour)</small>'], ['Offered', stamp('Offered', f.sentBy, f.sentAt)]]) + state });
    });
    var offerSec = K.section('Offered to you', offers.length ? offers.filter(function (x) { return !x.offer.response; }).length + ' waiting for your reply' : '',
      offers.length ? K.grid(offerCards, 2) : '<div class="zone-inset">' + ui.empty('coaches', isLearning() ? 'Learning coaches aren’t offered cover' : 'No cover offered right now', isLearning() ? 'Learning coaches are never left alone with a group, so cover goes to qualified coaches.' : 'When the office offers you cover it appears here to accept or decline.') + '</div>');
    var reqs = db.getMyCoverRequests(k);
    var reqCards = reqs.map(function (r) {
      var rows = r.needs.map(function (n) {
        var o = db.getOccurrence(n.occurrence), pending = n.offers.filter(function (f) { return !f.response; }).map(function (f) { return first(db.coachName(f.coach)); });
        return ui.row({ lead: dateLead(o.date), title: esc(o.session), sub: [esc(o.start + '–' + o.end), n.confirmed ? 'Covered by ' + esc(db.coachName(n.confirmed.coach)) : pending.length ? 'Offered to ' + esc(pending.join(', ')) : n.offers.length ? n.offers.length + ' offer' + (n.offers.length === 1 ? '' : 's') + ' declined' : 'Not offered yet'], trail: K.status(n.state), href: '#coach-session/' + o.id });
      });
      return K.card({ title: r.kind + ' · ' + (r.from === r.to ? K.dd(r.from) : K.dm(r.from) + '–' + K.dm(r.to)), sub: esc(r.reason) + ' · ' + r.id, right: K.status(db.coverStatus(r)),
        body: (rows.length ? ui.rows(rows, 'rows--lead') : '<p class="k-note">No sessions affected.</p>') + '<h3 class="ch-h3">History</h3>' + K.timeline(r.history.slice().reverse()) });
    }).join('');
    var reqSec = K.section('Your cover requests', 'The office finds cover; each date moves on its own.', reqs.length ? reqCards : '<div class="zone-inset">' + ui.empty('calendar', 'No cover requests', 'Mark dates you can’t make in Availability and ask for cover there.') + '</div>');
    return page(h, offerSec + reqSec);
  };

  /* ============================================================ DOCUMENTS */
  Hub.screens['coach-documents'] = function (ctx) {
    var k = meKey(), sum = db.getCoachComplianceSummary(k);
    var h = K.head({ eyebrow: hub(), title: 'My documents', sub: 'What you need to coach, when it expires, and what the office has checked. ' + K.pill(sum.text, sum.tone) });
    var g = K.guard(ctx, h, { empty: ['shield', 'No documents yet', 'Upload your DBS, first aid and safeguarding certificates here.'] }); if (g) return g;
    if (!K.feature('documents')) return page(h, K.featureOff('documents', 'Coach documents and compliance'));
    var list = db.getCoachCompliance(k);
    var cards = list.map(function (x) {
      var d = x.doc, tone = { Verified: 'ok', Expiring: 'warn', Expired: 'danger', Missing: 'danger', 'Pending verification': 'warn' }[x.state];
      var kv = d ? K.kv([['Reference', esc(d.ref || '—')], ['Issued', esc(K.d(d.issued))], ['Expires', d.expires ? esc(K.d(d.expires)) + (d.expires >= K.today ? ' <small>(' + K.daysBetween(K.today, d.expires) + ' days)</small>' : '') : 'No expiry'], ['Checked', d.verification.by ? stamp('Verified', d.verification.by, d.verification.at) : '—']]) : '<p class="k-note">Nothing on file yet.</p>';
      var pend = x.pending ? ui.notice('info', 'New upload pending verification', esc(x.pending.ref || '') + ' · ' + stamp('Uploaded', x.pending.uploaded.by, x.pending.uploaded.at)) : '';
      var warn = x.state === 'Expiring' ? ui.notice('warn', 'Expires soon', 'Upload the new certificate so the office can check it before ' + esc(K.d(d.expires)) + '.') : x.state === 'Expired' ? ui.notice('danger', 'Expired', 'You can’t be staffed on sessions that need this until a new one is verified.') : '';
      return K.card({ title: x.type.name, sub: x.type.validYears ? 'Valid for ' + x.type.validYears + ' years' : 'Reviewed every ' + (x.type.reviewMonths || 24) + ' months', right: K.pill(x.state, tone),
        body: warn + kv + pend + '<div class="k-row-actions">' + K.actBtn(x.pending ? 'Upload again' : 'Upload new', 'ch-doc-upload', { type: x.type.id }, { variant: x.state === 'Verified' ? 'tertiary' : 'secondary', icon: 'plus' }) + '</div>' });
    });
    var all = db.getDocuments(function (d) { return d.coach === k; }).slice().sort(function (a, b) { return a.uploaded.at < b.uploaded.at ? 1 : -1; });
    var hist = K.card({ title: 'Everything you’ve uploaded', sub: 'Older certificates are kept, never changed', body: K.table({ cols: 'minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr) auto', head: ['Document', 'Uploaded', 'Expires', 'Status'], rows: all.map(function (d) {
      return { cells: [K.cell(esc(db.getDocType(d.type).name), esc(d.ref || '')), esc(K.dt(d.uploaded.at)), esc(d.expires ? K.d(d.expires) : 'No expiry'), K.pill(db.docState(d), { Verified: 'ok', Expired: 'danger', Expiring: 'warn', 'Pending verification': 'warn', Rejected: 'danger' }[db.docState(d)] || '')] };
    }), empty: 'Nothing uploaded yet.' }) });
    return page(h, K.grid(cards, 2) + hist);
  };

  /* ============================================================ WORK SUMMARY */
  Hub.screens['coach-work-summary'] = function (ctx) {
    var k = meKey(), segs = [{ id: '2026-09', label: 'September 2026' }, { id: '2026-10', label: 'October so far' }];
    var h = K.head({ eyebrow: hub(), title: 'Work summary', sub: 'Your sessions, hours and pay for the month. Check it, then confirm or query it.', tabs: K.tabs('ch-ws', segs) });
    var g = K.guard(ctx, h, { empty: ['finance', 'No work yet', 'Delivered sessions appear here and become your monthly summary.'] }); if (g) return g;
    var m = K.tab('ch-ws', segs), rate = db.getCurrentRate(k), payNote = db.getPayNote(k);
    var rateTxt = rate ? K.money(rate.evening) + ' evening · ' + K.money(rate.day) + ' day' : '—';
    var noteBox = payNote ? ui.notice('info', K.money(0) + ': ' + payNote, 'No per-session pay is due. ' + (/Learning/.test(payNote) ? 'Travel expenses are claimed separately through the office.' : 'Your salary is paid through payroll.')) : '';
    function lineTable(lines, live, foot) {
      return K.table({ cols: 'minmax(0,1.6fr) minmax(0,.8fr) minmax(0,.6fr) minmax(0,.8fr) minmax(0,.8fr)', head: ['Occurrence', 'Role', { label: 'Hours', cls: 'c-num' }, { label: 'Rate', cls: 'c-num' }, { label: 'Pay', cls: 'c-num' }], rows: lines.map(function (l) {
        var o = db.getOccurrence(l.occurrence);
        return { cells: [K.cell(esc(o ? o.session : l.session), esc(K.dd(l.date)) + (live && l.date >= K.today ? ' · to come' : '')), esc(l.role || ''), { cls: 'c-num', html: String(l.units) }, { cls: 'c-num', html: K.money(l.rate) }, { cls: 'c-num', html: K.money(l.cost) + (l.override ? '<small class="ch-ovr">' + esc(typeof l.override === 'string' ? l.override : l.override.reason) + '</small>' : '') }], route: o ? 'coach-session/' + o.id : null };
      }), empty: 'No sessions this month.', foot: foot || '' });
    }
    if (m === '2026-10') {
      var al = db.getMonthAllocations(k, '2026-10'), done = al.filter(function (a) { return a.date < K.today; });
      var body = noteBox + K.stats([{ label: 'Sessions', value: al.length, sub: done.length + ' delivered so far' }, { label: 'Hours', value: K.sum(al, 'units'), sub: 'Booked this month' }, { label: 'Your rate', value: esc(rate ? K.money(rate.evening) : '—'), sub: 'Evening, per hour' }, { label: 'Expected total', value: K.money(K.sum(al, 'cost')), sub: 'If every session runs' }]) +
        K.card({ title: 'October so far', sub: 'Live: becomes your October summary when the month closes on 1 Nov.', right: K.pill('In progress', 'warn'), body: lineTable(al, true, '<span>' + al.length + ' sessions · ' + K.sum(al, 'units') + ' hours</span><span class="k-total">So far ' + K.money(K.sum(done, 'cost')) + '</span>') });
      return page(h, body);
    }
    var ws = db.getMyWorkSummary(k, m);
    if (!ws) return page(h, '<div class="zone-inset">' + ui.empty('finance', 'No summary for this month', '') + '</div>');
    var hrs = K.sum(ws.lines, 'units');
    var stats = K.stats([{ label: 'Occurrences', value: ws.lines.length, sub: ws.label }, { label: 'Hours', value: hrs, sub: 'Delivered' }, { label: 'Rate', value: esc(rate ? K.money(rate.evening) : '—'), sub: esc(rateTxt) }, { label: 'Total', value: K.money(ws.total), sub: ws.state, tone: ws.state === 'Queried' ? 'warn' : '' }]);
    var acts = '';
    if (ws.state === 'Awaiting coach') acts = K.actBtn('Confirm', 'ch-ws-confirm', { id: ws.id }, { variant: 'primary', icon: 'check' }) + K.actBtn('Query', 'ch-ws-query', { id: ws.id }, { variant: 'secondary' });
    else if (ws.state === 'Ready to finalise') acts = '<span class="k-note">You confirmed this. The office finalises it for payment.</span>' + K.actBtn('Query', 'ch-ws-query', { id: ws.id }, { variant: 'secondary' });
    else if (ws.state === 'Queried') acts = '<span class="k-note">Your query is with the office.</span>' + K.actBtn('Confirm instead', 'ch-ws-confirm', { id: ws.id }, { variant: 'secondary' });
    var stateLine = ws.state === 'Finalised' ? K.frozen('Finalised · frozen') + ' ' + stamp('Finalised', ws.finalised.by, ws.finalised.at) : K.status(ws.state) + ' ' + stamp('Prepared', ws.frozenBy, ws.frozenAt);
    var query = ws.query ? ui.notice('warn', 'Your query', esc(ws.query.text) + ' ' + stamp('Queried', ws.query.by, ws.query.at)) : '';
    var card = K.card({ title: ws.label, sub: stateLine, right: '<b class="num ch-total">' + K.money(ws.total) + '</b>', body: query + lineTable(ws.lines, false, '<span>' + ws.lines.length + ' sessions · ' + hrs + ' hours</span><span class="k-total">Total ' + K.money(ws.total) + '</span>') + (acts ? '<div class="k-row-actions">' + acts + '</div>' : '') });
    var cyc = K.card({ title: 'History', sub: 'Each preparation is kept', body: ws.cycles.slice().reverse().map(function (c) { return '<h3 class="ch-h3">Cycle ' + c.n + ' · ' + K.money(c.total) + '</h3>' + K.timeline(c.events.slice().reverse()); }).join('') });
    return page(h, noteBox + stats + cols(card, cyc));
  };

  /* ============================================================ PROFILE */
  Hub.screens['coach-profile'] = function (ctx) {
    var c = me(), x = db.getCoachProfileExtras(c.id);
    var h = K.head({ eyebrow: c.code + ' · ' + roleLabel(), title: c.name, sub: rolePill() + ' ' + esc(staff()) + ' since ' + esc(K.d(c.started)), actions: K.actBtn('Edit profile', 'ch-prof-edit', {}, { variant: 'secondary', icon: 'user' }) });
    var g = K.guard(ctx, h, { empty: false }); if (g) return g;
    var account = K.card({ title: 'Account', sub: 'From your sign-in. The office changes your email or role.', body: '<div class="ch-photo">' + ui.avatar(c.name, 'lg') + '<div><b>' + esc(c.name) + '</b><small>' + esc(c.email) + '</small></div></div>' +
      K.kv([['Role', rolePill()], ['Phone', esc(c.phone || '—')], ['Hub access', esc(c.hub || 'Coach')], ['Started', esc(K.d(c.started))]]) });
    var about = K.card({ title: 'About you', sub: x.updatedBy ? stamp('Updated', x.updatedBy, x.updatedAt) : '', right: K.actBtn('Edit', 'ch-prof-edit', {}, { size: 'sm', variant: 'tertiary' }), body: K.kv([['Preferred name', esc(x.preferredName || '—')], ['Emergency contact', esc(x.emergency || '—')], ['Kit size', esc(x.kit || '—')], ['About', esc(x.bio || '—')]]) });
    var perms = K.card({ title: 'What your role can do', sub: 'Set by Management in Session roles', body: permChips() });
    var ass = db.getMySessions(c.id), ovr = db.getRoleOverrides(c.id).filter(function (o) { return !o.ended && o.to >= K.today; }), rem = db.getRemovedAssignments(c.id).filter(function (r) { return r.accessUntil >= K.today; });
    var sess = K.card({ title: 'Your sessions', body: ui.rows(ass.map(function (a) { return ui.row({ lead: icoLead('calendar'), title: esc(a.sessionName), sub: [esc(a.start + '–' + a.end), esc(db.venueName(a.venue))], trail: K.pill(a.sessionRole, a.sessionRole === 'Lead' ? 'info' : a.sessionRole === 'Learning' ? 'warn' : '') }); }), 'rows--lead') +
      ovr.map(function (o) { return ui.notice('info', 'Temporary role: ' + db.getRole(o.role).name + ' on ' + db.getSession(o.session).name, esc(K.dm(o.from) + '–' + K.dm(o.to) + ' · ' + o.reason) + ' ' + stamp('Set', o.by, o.at)); }).join('') +
      rem.map(function (r) { return ui.notice('warn', 'Removed from ' + r.sessionName, esc(r.reason) + ' · read-only access until ' + esc(K.d(r.accessUntil)) + ' ' + stamp('Removed', r.by, r.removedAt)); }).join('') });
    var hist = db.getCoachProfileHistory(c.id);
    var links = K.tiles([{ route: 'coach-documents', icon: 'shield', title: 'Documents', desc: db.getCoachComplianceSummary(c.id).text }, { route: 'coach-availability', icon: 'clock', title: 'Availability', desc: 'Your week and time off.' }, { route: 'coach-work-summary', icon: 'finance', title: 'Work summary', desc: 'Sessions, hours and pay.' }, { route: 'coach-notifications', icon: 'bell', title: 'Notifications', desc: db.getCoachHubUnread(c.id) + ' unread' }], 4);
    return page(h, cols(account + about + (hist.length ? K.card({ title: 'Changes', body: K.timeline(hist) }) : ''), perms + sess) + links);
  };

  /* ============================================================ NOTIFICATIONS */
  Hub.screens['coach-notifications'] = function (ctx) {
    var k = meKey(), all = db.getCoachHubNotifications(k), unread = all.filter(function (n) { return !n.read; });
    var segs = [{ id: 'all', label: 'All' }, { id: 'unread', label: 'Unread (' + unread.length + ')' }];
    var h = K.head({ eyebrow: hub(), title: 'Notifications', sub: unread.length + ' unread', actions: unread.length ? K.actBtn('Mark all as read', 'ch-ntf-all', {}, { variant: 'secondary', icon: 'check' }) : '' });
    var g = K.guard(ctx, h, { empty: ['bell', 'No notifications', 'Cover offers, returned feedback and reminders appear here.'] }); if (g) return g;
    var t = K.tab('ch-ntf', segs), list = t === 'unread' ? unread : all;
    var rows = list.map(function (n) {
      return ui.row({ stretch: true, cls: 'row--stretch', lead: '<span class="ch-unread' + (n.read ? ' is-read' : '') + '" aria-hidden="true"></span>', title: esc(n.title), sub: [esc(n.body), esc(K.dt(n.at)), n.read && n.readAt ? 'Read ' + esc(K.dt(n.readAt)) : ''], action: 'ch-ntf-open', data: { id: n.id, route: n.route },
        trail: K.actBtn(n.read ? 'Mark unread' : 'Mark read', 'ch-ntf-toggle', { id: n.id }, { size: 'sm', variant: 'tertiary' }) });
    });
    return page(h, K.card({ title: t === 'unread' ? 'Unread' : 'Everything', right: K.seg('ch-ntf', segs), body: rows.length ? ui.rows(rows, 'rows--lead') : ui.empty('checkCircle', 'All read', 'Nothing new since you last looked.') }));
  };

  /* ============================================================ ACTIONS */
  var A = Hub.actions;
  function pname(pid, occ) {
    var p = db.getPlayer(pid); if (p) return p.name;
    var r = db.getRegisterRows(occ).filter(function (x) { return x.id === pid; })[0]; return r ? r.name : pid;
  }
  /* Register */
  A['ch-mark'] = function (el) {
    var d = el.dataset, r = db.getRegister(d.occ), note = (r.marks[d.pid] || {}).note || '';
    act(function (at) { return db.setMark(d.occ, d.pid, d.mark, note, who(), at); }, pname(d.pid, d.occ) + ': ' + d.mark, 'Register: ' + pname(d.pid, d.occ) + ' marked ' + d.mark, d.occ);
  };
  A['ch-mark-rest'] = function (el) {
    var occ = el.dataset.occ, rows = db.getRegisterRows(occ).filter(function (r) { return !r.mark; });
    if (!rows.length) { Hub.toast('Everyone is already marked'); return; }
    act(function (at) { rows.forEach(function (r) { db.setMark(occ, r.id, 'Present', '', who(), at); }); }, rows.length + ' marked present', 'Register: ' + rows.length + ' players marked present', occ);
  };
  A['ch-reg-note'] = function (el) {
    var d = el.dataset, cur = (db.getRegister(d.occ).marks[d.pid] || {});
    K.sheet({ overline: '<span class="overline">Register note</span>', title: esc(pname(d.pid, d.occ)), body: K.field('Note', K.textarea('ch-mark-note', cur.note || '', 'Left early, injured, collected by grandparent…')) + (cur.mark ? '' : '<p class="k-note">Not marked yet: saving a note marks them Present.</p>'), foot: sheetFoot('Save note', 'ch-reg-note-save', { occ: d.occ, pid: d.pid }) });
  };
  A['ch-reg-note-save'] = function (el) {
    var d = el.dataset, cur = (db.getRegister(d.occ).marks[d.pid] || {}), note = K.val('ch-mark-note').trim();
    Hub.closeSheet(true);
    act(function (at) { return db.setMark(d.occ, d.pid, cur.mark || 'Present', note, who(), at); }, 'Note saved', 'Register note for ' + pname(d.pid, d.occ), d.occ, { restricted: true });
  };
  A['ch-reg-complete'] = function (el) {
    var occ = el.dataset.occ, o = db.getOccurrence(occ);
    if (isClient(o)) { var r = db.getRegister(occ); if (!r.headcount || r.headcount.actual == null) { Hub.toast('Save the headcount first'); return; } }
    else { var left = db.getRegisterRows(occ).filter(function (x) { return !x.mark; }).length; if (left) { Hub.toast('Mark ' + left + ' more player' + (left === 1 ? '' : 's') + ' first'); return; } }
    act(function (at) { return db.finishRegister(occ, who(), at); }, 'Register completed', 'Register completed: ' + o.session + ', ' + K.dd(o.date), occ);
  };
  A['ch-headcount-save'] = function (el) {
    var occ = el.dataset.occ, v = parseInt(K.val('ch-headcount'), 10);
    if (isNaN(v) || v < 0) { Hub.toast('Enter how many children took part'); return; }
    act(function (at) { return db.setHeadcount(occ, v, who(), at); }, 'Headcount saved: ' + v, 'Headcount recorded: ' + v, occ);
  };
  A['ch-reg-reopen'] = function (el) {
    K.sheet({ overline: '<span class="overline">Register</span>', title: 'Reopen this register?', body: K.field('Reason', K.textarea('ch-reopen-reason', '', 'For example: Alfie arrived late after the register was completed')), foot: sheetFoot('Reopen', 'ch-reg-reopen-save', { occ: el.dataset.occ }) });
  };
  A['ch-reg-reopen-save'] = function (el) {
    var occ = el.dataset.occ, why = K.val('ch-reopen-reason').trim();
    if (!why) { Hub.toast('Add a reason'); return; }
    Hub.closeSheet(true);
    act(function (at) { return db.reopenRegister(occ, why, who(), at); }, 'Register reopened', 'Register reopened: ' + why, occ);
  };
  A['ch-oneoff'] = function (el) {
    K.sheet({ overline: '<span class="overline">Register</span>', title: 'Add a one-off player', body: K.form([K.field('Name', K.input('ch-one-name', '', { placeholder: 'First and last name' }), '', true), K.field('Age group', K.input('ch-one-age', db.getOccurrence(el.dataset.occ).ageGroup)), K.field('Note', K.input('ch-one-note', '', { placeholder: 'Why they joined today' }))], 2), foot: sheetFoot('Add and mark present', 'ch-oneoff-save', { occ: el.dataset.occ }) });
  };
  A['ch-oneoff-save'] = function (el) {
    var occ = el.dataset.occ, name = K.val('ch-one-name').trim();
    if (!name) { Hub.toast('Add their name'); return; }
    var x = { player: null, name: name, ageGroup: K.val('ch-one-age'), note: K.val('ch-one-note'), mark: 'Present' };
    Hub.closeSheet(true);
    act(function (at) { return db.addOneOff(occ, x, who(), at); }, name + ' added to the register', 'One-off player added: ' + name, occ);
  };
  /* Session */
  A['ch-note-add'] = function (el) {
    var occ = el.dataset.occ, t = K.val('ch-session-note').trim();
    if (!t) { Hub.toast('Write the note first'); return; }
    act(function (at) { return db.addSessionNote(occ, t, who(), at); }, 'Note added', 'Session note added', occ);
  };
  A['ch-msg-send'] = function (el) {
    var occ = el.dataset.occ, s = K.val('ch-msg-subject').trim(), b = K.val('ch-msg-body').trim();
    if (!s || !b) { Hub.toast('Add a subject and a message'); return; }
    act(function (at) { return db.sendSessionMessage(occ, s, b, who(), at); }, 'Sent to families', 'Message to families: ' + s, occ, { area: 'Communications' });
  };
  /* Feedback */
  A['ch-rate'] = function (el) {
    el.parentNode.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b === el)); });
  };
  function readFeedback(pid, id) {
    var ratings = {};
    document.querySelectorAll('[data-action="ch-rate"][aria-pressed="true"]').forEach(function (b) { if (b.dataset.val !== 'none') ratings[b.dataset.group] = b.dataset.val; });
    var sess = K.val('fb-session') || db.getMyPlayerSessions(meKey(), pid)[0];
    return { id: id || null, player: pid, coach: meKey(), session: sess, period: db.getCurrentFeedbackPeriod(), keepDoing: K.val('fb-keep').trim(), focus: K.val('fb-focus').trim(), general: K.val('fb-general').trim(), ratings: ratings };
  }
  A['ch-fb-save'] = function (el) {
    var f = readFeedback(el.dataset.pid, el.dataset.id);
    act(function (at) { return db.saveCoachFeedback(f, who(), at); }, 'Draft saved', 'Feedback draft saved for ' + db.getPlayer(f.player).name, f.player, { area: 'Development' });
  };
  A['ch-fb-submit'] = function (el) {
    var f = readFeedback(el.dataset.pid, el.dataset.id), learning = isLearning();
    if (!f.keepDoing && !f.focus) { Hub.toast('Add something to keep doing or a focus first'); return; }
    act(function (at) { var x = db.saveCoachFeedback(f, who(), at); return db.submitCoachFeedback(x.id, learning, who(), at); },
      learning ? 'Sent to your lead coach for sign-off' : 'Submitted for review. Not visible to parents until reviewed', 'Feedback submitted' + (learning ? ' for lead sign-off' : ' for review') + ': ' + db.getPlayer(f.player).name, f.player, { area: 'Development' });
  };
  A['ch-fb-signoff'] = function (el) {
    var f = db.getFeedbackItem(el.dataset.id);
    act(function (at) { return db.signOffFeedback(f.id, who(), at); }, 'Signed off: now with the office for review', 'Learning coach feedback signed off: ' + db.getPlayer(f.player).name, f.id, { area: 'Development' });
  };
  /* IDP */
  A['ch-idp-start'] = function (el) { var pid = el.dataset.pid; act(function (at) { return db.startIdp(pid, meKey(), who(), at); }, K.label('IDP') + ' started', K.label('IDP') + ' started for ' + db.getPlayer(pid).name, pid, { area: 'Development' }); };
  A['ch-idp-status'] = function (el) {
    var d = el.dataset, v = K.val('idp-st-' + d.n), i = db.getIdp(d.id), was = i.targets[+d.n].status;
    if (v === was) { Hub.toast('No change'); return; }
    act(function (at) { return db.setIdpTarget(d.id, +d.n, { status: v }, who(), at); }, 'Target marked ' + v, K.label('IDP') + ' target ' + (+d.n + 1) + ' status changed', d.id, { area: 'Development', before: was, after: v });
  };
  A['ch-idp-edit'] = function (el) {
    var d = el.dataset, t = db.getIdp(d.id).targets[+d.n];
    K.sheet({ overline: '<span class="overline">' + esc(K.label('IDP')) + '</span>', title: 'Edit target ' + (+d.n + 1), body: K.form([K.field('Target', K.input('idp-edit-text', t.text), '', true), K.field('Framework area', K.select('idp-edit-group', db.getFrameworkGroups('coach').map(function (x) { return [x.id, x.name]; }), t.group))], 1), foot: sheetFoot('Save target', 'ch-idp-edit-save', { id: d.id, n: d.n }) });
  };
  A['ch-idp-edit-save'] = function (el) {
    var d = el.dataset, t = K.val('idp-edit-text').trim(), grp = K.val('idp-edit-group'), was = db.getIdp(d.id).targets[+d.n].text;
    if (!t) { Hub.toast('The target can’t be empty'); return; }
    Hub.closeSheet(true);
    act(function (at) { return db.setIdpTarget(d.id, +d.n, { text: t, group: grp }, who(), at); }, 'Target updated', K.label('IDP') + ' target ' + (+d.n + 1) + ' changed', d.id, { area: 'Development', before: was, after: t });
  };
  A['ch-idp-add'] = function (el) {
    var id = el.dataset.id, t = K.val('idp-new-text').trim(), grp = K.val('idp-new-group');
    if (!t) { Hub.toast('Write the target first'); return; }
    act(function (at) { return db.addIdpTarget(id, { text: t, group: grp, status: 'Not started' }, who(), at); }, 'Target added', K.label('IDP') + ' target added: ' + t, id, { area: 'Development' });
  };
  A['ch-idp-agree'] = function (el) { var id = el.dataset.id; act(function (at) { return db.setIdpStatus(id, 'Agreed', who(), at); }, 'Marked as agreed', K.label('IDP') + ' marked as agreed', id, { area: 'Development' }); };
  /* Library and support */
  A['ch-res'] = function (el) {
    var r = db.getResource(el.dataset.id), saved = db.isResourceSaved(meKey(), r.id);
    K.sheet({ overline: '<span class="overline">' + esc(r.type) + ' · ' + esc(r.topic) + '</span>', title: esc(r.title), body: K.kv([['For', esc(r.audience)], ['Type', esc(r.type)], ['Topic', esc(r.topic)], ['Updated', stamp('Updated', r.updatedBy, r.updatedAt)]]) + '<p class="k-note">Opens in the Library viewer on your phone, so you can use it pitch-side.</p>',
      foot: ui.btn('Close', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn(saved ? 'Remove from saved' : 'Save for later', 'ch-res-save', { id: r.id }, { variant: 'primary', icon: saved ? 'x' : 'star' }) });
  };
  A['ch-res-save'] = function (el) {
    var id = el.dataset.id, r = db.getResource(id); Hub.closeSheet(true);
    act(function () { return db.toggleSavedResource(meKey(), id); }, db.isResourceSaved(meKey(), id) ? 'Removed from saved' : 'Saved for later', 'Library: ' + (db.isResourceSaved(meKey(), id) ? 'removed ' : 'saved ') + r.title, id);
  };
  A['ch-guide'] = function (el) {
    var s = db.getCoachSupport().filter(function (x) { return x.id === el.dataset.id; })[0];
    K.sheet({ overline: '<span class="overline">How to</span>', title: esc(s.title), body: '<p>' + esc(s.detail) + '</p>' + stamp('Updated', s.updatedBy, s.updatedAt), foot: ui.btn('Close', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.goBtn('Ask the office', 'coach-support', { variant: 'secondary' }) });
  };
  A['ch-ask'] = function () {
    var t = K.val('ch-ask-text').trim();
    if (!t) { Hub.toast('Write your question first'); return; }
    act(function (at) { return db.askOffice(meKey(), t, who(), at); }, 'Sent to the office', 'Question to the office: ' + t, meKey());
  };
  /* Availability */
  A['ch-av-day'] = function (el) {
    var i = +el.dataset.i, wk = db.getWeeklyAvailability(meKey()), on = !!wk[i], d = db.getDows()[i];
    act(function (at) { return db.setWeeklyAvailability(meKey(), i, on ? null : ['16:00', '21:00'], who(), at); }, d + (on ? ' switched off' : ' set to 16:00–21:00'), 'Usual week: ' + d + (on ? ' off' : ' 16:00–21:00'), meKey(), { before: on ? wk[i].join('–') : 'Off', after: on ? 'Off' : '16:00–21:00' });
  };
  A['ch-av-save'] = function () {
    var type = K.val('av-type'), from = K.val('av-from'), to = K.val('av-to') || from, reason = K.val('av-reason').trim(), start = K.val('av-start'), end = K.val('av-end'), cover = K.val('av-cover') === 'yes';
    if (!from) { Hub.toast('Choose a start date'); return; }
    if (to < from) { Hub.toast('The end date is before the start date'); return; }
    if (from < K.today) { Hub.toast('Choose today or a later date'); return; }
    if (!reason) { Hub.toast('Add a short reason'); return; }
    if (type === 'Different hours' && (!start || !end)) { Hub.toast('Add the hours you can do'); return; }
    var k = meKey(), impact = db.getAbsenceImpact(k, from, to).length;
    if (cover && type !== 'Different hours' && K.feature('cover')) {
      act(function (at) { return db.addCoverRequest({ coach: k, kind: type === 'Holiday' ? 'Holiday' : 'Unavailable', from: from, to: to, reason: reason }, who(), at); }, type + ' saved · cover requested for ' + impact + ' session' + (impact === 1 ? '' : 's'), type + ' ' + from + (to !== from ? ' to ' + to : '') + ' with cover requested', k, { area: 'Coaches' });
    } else {
      act(function (at) { return db.addAvailabilityException({ coach: k, type: type, from: from, to: to, start: start || null, end: end || null, reason: reason, by: who(), at: at }); }, type + ' saved', type + ' recorded ' + from + (to !== from ? ' to ' + to : ''), k, { area: 'Coaches' });
    }
  };
  A['ch-av-remove'] = function (el) {
    var id = el.dataset.id, e = db.getAvailabilityExceptions(meKey()).filter(function (x) { return x.id === id; })[0];
    act(function () { return db.removeAvailabilityException(id); }, 'Removed', 'Availability removed: ' + e.type + ' ' + e.from, meKey(), { area: 'Coaches', before: e.type + ' ' + e.from + (e.to !== e.from ? '–' + e.to : ''), after: 'Removed' });
  };
  A['ch-av-cover'] = function (el) {
    var id = el.dataset.id, e = db.getAvailabilityExceptions(meKey()).filter(function (x) { return x.id === id; })[0], n = db.getAbsenceImpact(meKey(), e.from, e.to).length;
    act(function (at) { db.removeAvailabilityException(id); return db.addCoverRequest({ coach: meKey(), kind: e.type === 'Holiday' ? 'Holiday' : 'Unavailable', from: e.from, to: e.to, reason: e.reason }, who(), at); }, 'Cover requested for ' + n + ' session' + (n === 1 ? '' : 's'), 'Cover requested for ' + e.type.toLowerCase() + ' ' + e.from, meKey(), { area: 'Coaches' });
  };
  /* Cover */
  A['ch-cover-accept'] = function (el) {
    var d = el.dataset;
    act(function (at) { return db.respondCoverOffer(d.req, d.need, d.offer, 'Accepted', '', at); }, 'Accepted: the office will confirm', 'Cover accepted (' + d.req + ')', d.req, { area: 'Coaches' });
  };
  A['ch-cover-decline'] = function (el) {
    var d = el.dataset;
    K.sheet({ overline: '<span class="overline">Cover</span>', title: 'Decline this cover?', body: K.field('Reason (shared with the office)', K.textarea('ch-decline-note', '', 'For example: already working at another session')), foot: sheetFoot('Decline', 'ch-cover-decline-save', { req: d.req, need: d.need, offer: d.offer }) });
  };
  A['ch-cover-decline-save'] = function (el) {
    var d = el.dataset, note = K.val('ch-decline-note').trim(); Hub.closeSheet(true);
    act(function (at) { return db.respondCoverOffer(d.req, d.need, d.offer, 'Declined', note, at); }, 'Declined', 'Cover declined (' + d.req + ')' + (note ? ': ' + note : ''), d.req, { area: 'Coaches' });
  };
  /* Documents */
  A['ch-doc-upload'] = function (el) {
    var t = db.getDocType(el.dataset.type), iss = K.today, exp = t.validYears ? K.addDays(K.today, Math.round(365.25 * t.validYears)) : '';
    K.sheet({ overline: '<span class="overline">Upload</span>', title: esc(t.name), body: '<div class="ch-drop">' + I('download') + '<b>Photo or PDF of the certificate</b><small>certificate-' + esc(t.id) + '.pdf · 1 page</small></div>' +
      K.form([K.field('Reference', K.input('doc-ref', '', { placeholder: 'Certificate number' })), K.field('Issued', K.input('doc-issued', iss, { type: 'date' })), t.validYears ? K.field('Expires', K.input('doc-expires', exp, { type: 'date' })) : ''], 2) + '<p class="k-note">The office checks it; until then it shows as Pending verification.</p>', foot: sheetFoot('Upload', 'ch-doc-save', { type: t.id }) });
  };
  A['ch-doc-save'] = function (el) {
    var type = el.dataset.type, t = db.getDocType(type), ref = K.val('doc-ref').trim(), iss = K.val('doc-issued'), exp = K.val('doc-expires') || null;
    if (!ref) { Hub.toast('Add the certificate reference'); return; }
    Hub.closeSheet(true);
    act(function (at) { return db.addDocument({ coach: meKey(), type: type, ref: ref, issued: iss, expires: exp, uploaded: { by: who(), at: at } }); }, t.name + ' uploaded: pending verification', 'Document uploaded: ' + t.name + ' (' + ref + ')', meKey(), { area: 'Coaches' });
  };
  /* Work summary */
  A['ch-ws-confirm'] = function (el) { var id = el.dataset.id; act(function (at) { return db.confirmMySummary(id, who(), at); }, 'Confirmed: the office finalises it', 'Work summary confirmed by coach (' + id + ')', id, { area: 'Coaches', finance: true }); };
  A['ch-ws-query'] = function (el) {
    K.sheet({ overline: '<span class="overline">Work summary</span>', title: 'What doesn’t look right?', body: K.field('Your query', K.textarea('ch-ws-q', '', 'For example: 17 Sep ran 30 minutes over')), foot: sheetFoot('Send query', 'ch-ws-query-save', { id: el.dataset.id }) });
  };
  A['ch-ws-query-save'] = function (el) {
    var id = el.dataset.id, q = K.val('ch-ws-q').trim();
    if (!q) { Hub.toast('Say what needs checking'); return; }
    Hub.closeSheet(true);
    act(function (at) { return db.queryMySummary(id, q, who(), at); }, 'Query sent to the office', 'Work summary queried (' + id + '): ' + q, id, { area: 'Coaches', finance: true });
  };
  /* Profile */
  A['ch-prof-edit'] = function () {
    var x = db.getCoachProfileExtras(meKey());
    K.sheet({ overline: '<span class="overline">Profile</span>', title: 'About you', body: K.form([K.field('Preferred name', K.input('pf-name', x.preferredName)), K.field('Kit size', K.select('pf-kit', ['Small', 'Medium', 'Large', 'X-Large'], x.kit)), K.field('Emergency contact', K.input('pf-emg', x.emergency), 'Name, relationship and phone', true), K.field('About', K.textarea('pf-bio', x.bio), '', true)], 2), foot: sheetFoot('Save', 'ch-prof-save', {}) });
  };
  A['ch-prof-save'] = function () {
    var patch = { preferredName: K.val('pf-name').trim(), kit: K.val('pf-kit'), emergency: K.val('pf-emg').trim(), bio: K.val('pf-bio').trim() };
    Hub.closeSheet(true);
    act(function (at) { return db.updateCoachProfile(meKey(), patch, who(), at); }, 'Profile saved', 'Coach profile updated', meKey(), { restricted: true });
  };
  /* Notifications */
  A['ch-ntf-open'] = function (el) { var d = el.dataset; db.markCoachNotification(d.id, true, K.now()); location.hash = d.route; };
  A['ch-ntf-toggle'] = function (el) {
    var id = el.dataset.id, n = db.getCoachHubNotifications(meKey()).filter(function (x) { return x.id === id; })[0];
    act(function (at) { return db.markCoachNotification(id, !n.read, at); }, n.read ? 'Marked unread' : 'Marked read', 'Notification ' + (n.read ? 'marked unread' : 'marked read') + ': ' + n.title, id);
  };
  A['ch-ntf-all'] = function () { act(function (at) { return db.markAllCoachNotifications(meKey(), at); }, 'All marked as read', 'All notifications marked as read', meKey()); };
})();
