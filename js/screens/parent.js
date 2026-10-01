/* Parent / Player hub (pass 12). Sarah Whitfield (PAR-01, FAM-01) sees her
   children's sessions, books camps and events, manages memberships, pays
   and reads billing, keeps child details up to date and reads published
   development. Everything reads and writes through Hub.db; every change is
   made with Hub.mutate and recorded with K.log. Sensitive details go through
   K.restricted(['management', 'parent'], ...). */
(function () {
  var K = Hub.kit, db = Hub.db, ui = Hub.ui, I = Hub.icon, esc = ui.esc;
  var AREA = 'Parent hub';
  var FAM_ROLES = ['management', 'parent'];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var MED = { not_confirmed: 'Not confirmed', none: 'Confirmed none', details: 'Has details' };
  var PHOTO = { unknown: 'Not answered', yes: 'Yes', no: 'No' };
  var STATE_HELP = [
    ['Active', 'Training every week and billed on the 1st of each month.'],
    ['Paused', 'No sessions and no charges between the pause dates.'],
    ['Cancellation Pending', 'You asked to cancel; the office confirms the notice period.'],
    ['Ending Scheduled', 'Cancellation confirmed. Sessions continue until the end date.'],
    ['Ended', 'No longer attending. Kept here as history.']
  ];

  /* ---------- Routes (nav = bottom-nav item to highlight) ---------- */
  [['parent-home', 'Home', 'parent-home'],
    ['parent-sessions', 'Sessions', 'parent-sessions'], ['parent-session', 'Session', 'parent-sessions'], ['parent-attendance', 'Attendance', 'parent-sessions'],
    ['parent-browse', 'Book camps and events', 'parent-sessions'], ['parent-book', 'Book', 'parent-sessions'], ['parent-basket', 'Basket', 'parent-sessions'], ['parent-checkout', 'Checkout', 'parent-sessions'],
    ['parent-development', 'Development', 'parent-development'],
    ['parent-memberships', 'Memberships', 'parent-more'], ['parent-membership', 'Membership', 'parent-more'], ['parent-billing', 'Billing & payments', 'parent-more'],
    ['parent-child', 'Child profile', 'parent-more'], ['parent-family', 'Family', 'parent-more'], ['parent-requests', 'Requests', 'parent-more'], ['parent-policies', 'Terms & policies', 'parent-more'],
    ['parent-resources', 'Resources', 'parent-more'], ['parent-notices', 'Notices', 'parent-more'], ['parent-offers', 'Offers & discounts', 'parent-more'], ['parent-more', 'More', 'parent-more'],
    ['parent-profile', 'Profile', 'parent-more'], ['parent-notifications', 'Notifications', 'parent-more']
  ].forEach(function (r) { K.route(r[0], { title: r[1], nav: r[2] }); });
  K.route('parent-development', { title: function () { return Hub.brand.terms.client === 'Parent' ? 'Development' : 'Progress'; }, nav: 'parent-development' });

  /* ---------- Small helpers ---------- */
  function term() { return Hub.brand.terms.client || 'Parent'; }
  function hubName() { return term() === 'Parent' ? 'Parent / Player hub' : term() + ' hub'; }
  function me() { return db.phAccount(); }
  function fam() { return db.phFamily(); }
  function kids() { return db.phChildren(); }
  function first(p) { return p ? p.first : ''; }
  function names(list) { var n = list.map(first); return n.length > 1 ? n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1] : n[0] || ''; }
  function t12(hm) { var p = String(hm).split(':'), h = +p[0], m = p[1]; return (h % 12 || 12) + (m === '00' ? '' : ':' + m) + (h < 12 ? 'am' : 'pm'); }
  function longDate(iso) { var d = K.parse(iso); return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; }
  function when(o) { return (o.date === K.today ? 'Today' : K.dd(o.date)) + ', ' + o.start + '–' + o.end; }
  function sess(id) { return db.getSession(id) || { name: id, programme: '' }; }
  function coachNames(o) { var s = (o.staff || []).filter(function (x) { return !x.unavailable || x.covering; }); return s.length ? s.map(function (x) { return db.coachName(x.covering || x.coach); }).join(', ') : 'Coach to be confirmed'; }
  function meeting(o) { var s = sess(o.sessionId), v = db.getVenue(o.venue) || {}; return s.meetingPoint || v.meetingPoint || 'Main entrance'; }
  function occState(o) {
    if (o.status === 'Cancelled') return ['Cancelled', 'danger'];
    if (o.status === 'Rescheduled') return ['Rescheduled', 'info'];
    if (o.status === 'Postponed') return ['Postponed', 'warn'];
    if (o.venueOverride && o.date >= K.today) return ['Venue changed', 'warn'];
    if (o.date === K.today) return ['Today', 'info'];
    if (o.status === 'Completed' || o.date < K.today) return ['Completed', 'ok'];
    return ['Upcoming', ''];
  }
  function mutate(fn, toast, summary, entity, extra) { Hub.closeSheet(true); return Hub.mutate(fn, toast, Object.assign({ area: AREA, summary: summary, entity: entity || '' }, extra || {})); }
  function note(text) { return '<p class="k-note ph-note">' + I('info', 'icon-sm') + '<span>' + text + '</span></p>'; }
  function emptyBox(icon, title, body, action) { return '<div class="zone-inset ph-empty">' + ui.empty(icon, title, body) + (action ? '<div class="ph-empty__act">' + action + '</div>' : '') + '</div>'; }
  function sheetFoot(label, action, data, o) { return ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn(label, action, data || {}, Object.assign({ variant: 'primary' }, o || {})); }
  function head(o) { return K.head(Object.assign({ eyebrow: hubName() }, o)); }
  function guard(ctx, h, empty) { return K.guard(ctx, h, { empty: empty }); }
  function notMine(h, what) { return K.page(h, emptyBox('shield', what + ' not found', 'This is not linked to your family, or the link is out of date.', K.goBtn('Back to home', 'parent-home', { variant: 'secondary', size: 'sm' }))); }
  function dateBlock(iso) { var d = K.parse(iso); return '<span class="lx-date num"><small>' + K.dd(iso).slice(0, 3) + '</small><b>' + d.getDate() + '</b><small>' + MONTHS[d.getMonth()].slice(0, 3) + '</small></span>'; }
  function datedRow(o, who, route, trail) {
    var st = occState(o);
    return '<a class="lx-dated__row ph-dated" href="#' + route + '">' + dateBlock(o.date) + '<span class="lx-dated__main">' + (who ? '<small class="lx-dated__who">' + esc(who) + '</small>' : '') +
      '<b' + (o.status === 'Cancelled' ? ' class="ph-struck"' : '') + '>' + esc(o.session) + '</b><small class="num">' + o.start + '–' + o.end + ' · ' + esc(db.venueName(o.venue)) + '</small></span>' +
      (trail != null ? trail : st[0] !== 'Upcoming' ? K.pill(st[0], st[1]) : '') + I('chevron', 'icon-sm') + '</a>';
  }
  function childSeg(id, all) { var list = (all ? [{ id: 'all', label: 'Everyone' }] : []).concat(kids().map(function (p) { return { id: p.id, label: p.first }; })); return K.seg(id, list); }
  function childPick(id, all) { return K.tab(id, (all ? [{ id: 'all' }] : []).concat(kids().map(function (p) { return { id: p.id }; }))); }
  function mark(m) { return m ? K.status(m) : '<span class="text-3">Not marked</span>'; }
  function venueSheet(key) {
    var v = db.getVenue(key) || {};
    Hub.openSheet({ overline: '<span class="overline">Location & parking</span>', title: esc(v.name || 'Venue'),
      body: K.kv([['Address', esc(v.address || '—')], ['Meeting point', esc(v.meetingPoint || 'Main entrance')], ['Parking', esc(v.parking || '—')], ['Getting in', esc(v.access || '—')], ['On site', esc(v.siteMap || '—')]]),
      foot: ui.btn('Done', { variant: 'primary', attrs: { 'data-action': 'close-sheet' } }) });
  }
  Hub.actions['ph-venue'] = function (el) { venueSheet(el.dataset.venue); };

  /* ================================================================ HOME */
  var activeId = null;
  function nextHero(p) {
    var o = db.getNextChildOccurrence(p.id);
    if (!o) return '<section class="lx-next lx-next--client"><div class="lx-next__k"><span>Next session</span></div><h2 class="lx-next__title">Nothing booked yet</h2><p class="ph-hero-empty">' + esc(p.first) + ' has no upcoming sessions. Browse camps and weekly groups to find something.</p><div class="lx-next__actions"><button type="button" class="lx-next__btn" data-action="go" data-route="parent-browse">Browse' + I('arrowRight', 'icon-sm') + '</button></div></section>';
    var v = db.getVenue(o.venue) || {}, lead = (o.staff || []).filter(function (s) { return s.lead && !s.unavailable; })[0];
    return '<section class="lx-next lx-next--client" aria-labelledby="p-next"><div class="lx-next__k"><span>Next session</span><span class="lx-next__pills"><span>' + (o.date === K.today ? 'Today' : 'Upcoming') + '</span><span>' + esc(p.first) + '</span></span></div>' +
      '<h2 id="p-next" class="lx-next__title">' + esc(o.session) + '</h2>' +
      '<dl class="lx-next__facts"><div><dt>When</dt><dd>' + esc(longDate(o.date)) + '<small class="num">' + t12(o.start) + ' – ' + t12(o.end) + '</small></dd></div><div><dt>Where</dt><dd>' + esc(v.name || 'Venue to be confirmed') + '<small>' + esc(v.area || '') + '</small></dd></div>' +
      '<div><dt>With</dt><dd>' + esc(lead ? db.coachName(lead.coach) : coachNames(o)) + '</dd></div><div><dt>Meeting point</dt><dd>' + esc(meeting(o)) + '</dd></div></dl>' +
      '<div class="lx-next__actions"><button type="button" class="lx-next__btn" data-action="go" data-route="parent-session/' + o.id + '">View details' + I('arrowRight', 'icon-sm') + '</button><button type="button" class="lx-next__ghost" data-action="ph-venue" data-venue="' + esc(o.venue) + '">' + I('pin', 'icon-sm') + 'Location & parking</button></div></section>';
  }
  function tile(tone, icon, title, desc, route) {
    return '<a class="lx-tile lx-tile--' + tone + '" href="#' + route + '"><span class="lx-tile__icon">' + I(icon) + '</span><b>' + esc(title) + '</b><small>' + esc(desc) + '</small></a>';
  }
  function homeActions() {
    var out = [], f = fam();
    var due = db.getMedicalReconfirmDue(f.id);
    if (due.length) out.push({ title: 'Confirm ' + names(due) + '’s medical details for this term', meta: 'We ask every family at the start of term · takes a minute', route: 'parent-child/' + due[0].id });
    db.getFamilyParents(f.id).filter(function (x) { return !x.link.ended && x.link.invite === 'Invite sent'; }).forEach(function (x) { out.push({ title: x.name + ' has not accepted the invite yet', meta: 'Invited ' + (x.link.invitedAt ? K.dt(x.link.invitedAt) : '27 Sep') + ' · resend it from Family', route: 'parent-family' }); });
    var open = db.getFamilyRequests(f.id).filter(function (r) { return (r.status === 'Open' || r.status === 'In review') && r.type !== 'Second parent invite'; });
    if (open.length) out.push({ title: open.length + ' request' + (open.length === 1 ? '' : 's') + ' with the office', meta: open.map(function (r) { return r.type; }).join(' · '), route: 'parent-requests' });
    if (db.getBasket().length) out.push({ title: db.getBasket().length + ' place' + (db.getBasket().length === 1 ? '' : 's') + ' in your basket', meta: 'Not booked until you pay', route: 'parent-basket' });
    var credit = K.sum(db.getFamilyCredits(f.id), 'remaining');
    if (credit > 0) out.push({ title: K.money(credit) + ' family credit available', meta: 'Used automatically on your next payment or booking, oldest first', route: 'parent-billing' });
    if (K.feature('communications')) db.getNotices('Parents').filter(function (n) { return n.status === 'Sent'; }).slice(0, 1).forEach(function (n) { out.push({ title: n.title, meta: 'From ' + n.by + ' · ' + K.dt(n.at), route: 'parent-notices' }); });
    return out;
  }
  function feedbackCard(p) {
    var f = db.getLatestPublishedFeedback(p.id);
    var headHtml = '<div class="lx-section__head"><div><h2>Recent feedback</h2></div>' + (f ? '<a class="hx-link" href="#parent-development">View development' + I('arrowRight', 'icon-sm') + '</a>' : '') + '</div>';
    if (!f) return '<section class="lx-section">' + headHtml + '<div class="lx-surface">' + ui.empty('star', 'No feedback published yet', 'When feedback for ' + p.first + ' is published, it will appear here.') + '</div></section>';
    return '<section class="lx-section">' + headHtml + '<article class="lx-surface lx-feedback">' +
      '<div class="reading__by">' + ui.avatar(db.coachName(f.coach), 'md') + '<div><b>' + esc(db.coachName(f.coach)) + '</b><small>Published ' + esc(K.d(f.publishedAt)) + ' · ' + esc(f.period) + '</small></div></div>' +
      '<div class="reading__cols"><div><span class="overline">Keep doing</span><p>' + esc(f.keepDoing) + '</p></div><div><span class="overline">Focus next</span><p>' + esc(f.focus) + '</p></div></div>' +
      '</article></section>';
  }

  Hub.screens['parent-home'] = function (ctx) {
    var P = me(), firstName = P.name.split(' ')[0];
    var hello = function (t) { return '<header class="lx-hello"><div class="lx-eyebrow">' + esc(hubName()) + ' · ' + esc(longDate(K.today)) + '</div><h1 class="lx-hello__title page-title client-title">' + esc(t) + '</h1></header>'; };
    var g = K.guard(ctx, hello('Welcome back, ' + firstName), { empty: ['family', 'Nothing linked yet', 'We match the details you give us to the right child. Some links are checked by our team first.'] }); if (g) return g;
    var members = kids();
    if (!members.length) return K.page(hello('Welcome, ' + firstName), emptyBox('family', 'Nothing linked yet', 'Add your child and we will link them to your family.', K.goBtn('Add a child', 'parent-family', { variant: 'primary' })));
    var member = members.filter(function (c) { return c.id === activeId; })[0] || members[0];
    var switcher = members.length > 1 ? '<div class="segmented member-switch" role="group" aria-label="Choose family member">' + members.map(function (c) {
      return '<button type="button" data-action="ph-member" data-id="' + c.id + '" aria-pressed="' + (c.id === member.id) + '">' + ui.avatar(c.name, 'xs') + esc(c.first) + '</button>';
    }).join('') + '</div>' : '';
    var family = '<section class="lx-family"><div><b>Family schedule</b><small>' + esc(members.map(first).join(' + ')) + ' · all upcoming sessions together</small></div>' + switcher + '</section>';
    var acts = homeActions();
    var actions = '<section class="lx-section"><div class="lx-section__head"><div><h2>Current actions</h2></div></div><div class="lx-stack">' + (acts.length ? acts.map(function (u) {
      return '<button type="button" class="lx-action" data-action="go" data-route="' + u.route + '"><span class="lx-action__dot"></span><span class="lx-action__main"><b>' + esc(u.title) + '</b><small>' + esc(u.meta) + '</small></span><span class="lx-action__go">View' + I('arrowRight', 'icon-sm') + '</span></button>';
    }).join('') : '<div class="lx-surface">' + ui.empty('checkCircle', 'Nothing needs you', 'You are all up to date.') + '</div>') + '</div></section>';
    var tiles = '<div class="lx-tiles">' + tile('shell', 'card', 'Billing & Payments', 'Payments, family credit and statements', 'parent-billing') + tile('accent', 'star', 'Memberships', 'Weekly groups, pauses and notice periods', 'parent-memberships') +
      tile('light', 'user', 'Child profile', 'Details, medical, support and permissions', 'parent-child/' + member.id) + tile('soft', 'plus', 'Book a camp', 'Half-term camp, festival and tours', 'parent-browse') + '</div>';
    var upcoming = db.getFamilyOccurrences({ from: K.today }).filter(function (x) { return x.occurrence.status !== 'Completed'; }).slice(0, 4);
    var schedule = '<section class="lx-section"><div class="lx-section__head"><div><h2>Your schedule</h2></div><a class="hx-link" href="#parent-sessions">View all' + I('arrowRight', 'icon-sm') + '</a></div><div class="lx-surface lx-dated">' +
      (upcoming.length ? upcoming.map(function (x) { return datedRow(x.occurrence, x.player.first, 'parent-session/' + x.occurrence.id); }).join('') : ui.empty('calendar', 'No sessions coming up', 'Upcoming sessions for your family appear here.')) + '</div></section>';
    return '<div class="page lx-page"><div class="lx-client">' +
      '<div class="lx-client__hello">' + hello('Welcome back, ' + firstName) + '</div>' +
      '<div class="lx-client__family">' + family + '</div>' +
      '<div class="lx-client__next">' + nextHero(member) + '</div>' +
      '<div class="lx-client__actions">' + actions + '</div>' +
      '<div class="lx-client__tiles">' + tiles + '</div>' +
      '<div class="lx-client__schedule">' + schedule + '</div>' +
      '<div class="lx-client__feedback">' + feedbackCard(member) + '</div>' +
      '</div></div>';
  };
  Hub.actions['ph-member'] = function (el) { activeId = el.dataset.id; Hub.render(); };

  /* ================================================================ SESSIONS */
  function cancelledNotice(x) {
    var o = x.occurrence, out = db.getOccurrenceOutcomeFor(o.id, x.player.id);
    var what = out ? (out.kind === 'Credit' ? K.money(out.item.amount) + ' family credit for ' + x.player.first : K.money(out.item.amount) + ' refunded') : 'No charge for this session';
    var used = out && out.kind === 'Credit' && out.item.applications.length ? ', used on ' + out.item.applications.map(function (a) { var c = db.getFamilyCharges(function (ch) { return ch.id === a.charge; })[0]; return c ? c.description : a.charge; }).join(', ') : '';
    return '<a class="ph-change" href="#parent-session/' + o.id + '"><span class="ph-change__icon">' + I('alertCircle') + '</span><span class="ph-change__main"><b>' + esc(o.session) + ' on ' + esc(K.dd(o.date)) + ' was ' + o.status.toLowerCase() + '</b>' +
      '<small>' + esc(o.cancelReason || '') + '. ' + esc(what + used) + '.</small><small class="ph-change__by">' + K.stamp(o.status, o.cancelledBy, o.cancelledAt) + '</small></span>' + I('chevron', 'icon-sm') + '</a>';
  }
  Hub.screens['parent-sessions'] = function (ctx) {
    var tabs = [{ id: 'upcoming', label: 'Upcoming' }, { id: 'changes', label: 'Changes' }, { id: 'past', label: 'Past' }];
    var h = head({ title: 'Sessions', sub: 'Every session for ' + esc(names(kids())) + '. Changes and cancellations show here first.', tabs: K.tabs('ph-sess', tabs),
      actions: K.goBtn('Attendance', 'parent-attendance', { variant: 'secondary', icon: 'checkCircle' }) + K.goBtn('Book camps & events', 'parent-browse', { variant: 'primary', icon: 'plus' }) });
    var g = guard(ctx, h, ['calendar', 'No sessions yet', 'Sessions for your children appear here once they join a group or book a camp.']); if (g) return g;
    var tab = K.tab('ph-sess', tabs), who = childPick('ph-sess-child', true);
    var all = db.getFamilyOccurrences().filter(function (x) { return who === 'all' || x.player.id === who; });
    var changes = all.filter(function (x) { var s = x.occurrence.status; return s === 'Cancelled' || s === 'Rescheduled' || s === 'Postponed' || x.occurrence.venueOverride; });
    var bar = '<div class="ph-bar">' + childSeg('ph-sess-child', true) + '</div>';
    var body = '';
    if (tab === 'upcoming') {
      var up = all.filter(function (x) { return x.occurrence.date >= K.today && x.occurrence.status !== 'Completed'; });
      var recent = changes.filter(function (x) { return K.daysBetween(x.occurrence.date, K.today) <= 21; });
      body = (recent.length ? K.section('Recent changes', 'Cancellations in the last three weeks and what you received.', '<div class="lx-stack">' + recent.map(cancelledNotice).join('') + '</div>') : '') +
        K.section('Coming up', up.length + ' sessions between now and half term', up.length ? '<div class="lx-surface lx-dated">' + up.map(function (x) { return datedRow(x.occurrence, x.player.first, 'parent-session/' + x.occurrence.id); }).join('') + '</div>' : emptyBox('calendar', 'Nothing coming up', 'Upcoming sessions appear here.')) +
        note('Half term is 26 to 30 October: weekly groups do not run. The half-term camp is open to book.');
    } else if (tab === 'changes') {
      body = changes.length ? '<div class="lx-stack">' + changes.map(cancelledNotice).join('') + '</div>' : emptyBox('checkCircle', 'No changes this term', 'Cancelled, moved or rescheduled sessions appear here with any credit you received.');
    } else {
      var past = all.filter(function (x) { return x.occurrence.date < K.today; }).reverse();
      body = past.length ? '<div class="lx-surface lx-dated">' + past.map(function (x) {
        var r = db.getRegister(x.occurrence.id), m = r.marks[x.player.id];
        return datedRow(x.occurrence, x.player.first, 'parent-session/' + x.occurrence.id, x.occurrence.status === 'Cancelled' ? K.pill('Cancelled', 'danger') : m ? K.status(m.mark) : '');
      }).join('') + '</div>' : emptyBox('calendar', 'No past sessions', 'Sessions your children attended appear here.');
    }
    return K.page(h, bar + body, 'ph');
  };

  Hub.screens['parent-session'] = function (ctx) {
    var o = db.getOccurrence(ctx.param), mine = o ? db.phOccurrenceChildren(o.id) : [];
    var h = head({ back: ['parent-sessions', 'Sessions'], eyebrow: o ? longDate(o.date) : 'Session', title: o ? o.session : 'Session', sub: o ? esc(names(mine)) + ' · ' + o.start + '–' + o.end : '',
      actions: o && o.venue ? K.actBtn('Location & parking', 'ph-venue', { venue: o.venue }, { variant: 'secondary', icon: 'pin' }) : '' });
    var g = guard(ctx, h, ['calendar', 'Session not available', 'This session is not available right now.']); if (g) return g;
    if (!o || !mine.length) return notMine(h, 'Session');
    var s = sess(o.sessionId), v = db.getVenue(o.venue) || {}, st = occState(o), top = '', outs = [];
    if (o.status === 'Cancelled' || o.status === 'Rescheduled' || o.status === 'Postponed') {
      var rep = o.replacement ? db.getOccurrence(o.replacement) : null;
      top = ui.notice(o.status === 'Cancelled' ? 'danger' : 'warn', esc(o.session) + ' was ' + o.status.toLowerCase(), esc(o.cancelReason || '') + (rep ? '. It moved to ' + K.link('parent-session/' + rep.id, K.dd(rep.date) + ', ' + rep.start) + '.' : '.'), { meta: o.status + ' by ' + o.cancelledBy + ', ' + K.dt(o.cancelledAt) });
      outs = mine.map(function (p) {
        var out = db.getOccurrenceOutcomeFor(o.id, p.id); if (!out) return K.card({ title: p.first, body: '<p class="k-note">No charge was made for this session, so there is nothing to credit.</p>' });
        var it = out.item, pairs = [['What you received', '<b class="num">' + K.money(it.amount) + '</b> ' + (out.kind === 'Credit' ? 'family credit' : 'refund')], ['Why', esc((o.outcome && o.outcome.parent && o.outcome.parent.reason) || it.reason || '')], ['Given', K.stamp('Given', it.by || it.decidedBy, it.at)]];
        if (out.kind === 'Credit') pairs.push(['Used on', it.applications.length ? it.applications.map(function (a) { var c = db.getFamilyCharges(function (ch) { return ch.id === a.charge; })[0]; return esc((c ? c.description : a.charge) + ' · ' + K.money(a.amount)) + ' <span class="text-3">(' + esc(K.dt(a.at)) + ')</span>'; }).join('<br>') : 'Not used yet: it comes off your next payment'], ['Left to use', K.money(it.remaining)]);
        return K.card({ title: out.kind === 'Credit' ? 'Credit for ' + p.first : 'Refund for ' + p.first, right: K.frozen('Issued'), body: K.kv(pairs) });
      });
      top = top + '';
    } else if (o.venueOverride) top = ui.notice('warn', 'This week is at ' + esc(v.name), 'Moved from ' + esc(db.venueName(o.venueOverride.from)) + ': ' + esc(o.venueOverride.reason) + '.', { meta: 'Changed by ' + o.venueOverride.by + ', ' + K.dt(o.venueOverride.at) });
    var where = K.card({ title: 'When and where', right: K.pill(st[0], st[1]), body: K.kv([['Date', esc(longDate(o.date))], ['Time', t12(o.start) + ' – ' + t12(o.end) + ' <span class="text-3">(arrive 10 minutes early)</span>'], ['Venue', esc(v.name || 'To be confirmed') + (v.address ? '<br><span class="text-3">' + esc(v.address) + '</span>' : '')], ['Meeting point', esc(meeting(o))], ['Parking', esc(v.parking || '—')]]) });
    var coaches = K.card({ title: 'Coaches', body: o.staff.length ? K.list(o.staff.filter(function (x) { return !x.unavailable || x.covering; }).map(function (x) { var n = db.coachName(x.covering || x.coach); return ui.row({ lead: ui.avatar(n, 'sm'), title: esc(n), sub: [x.lead ? 'Lead coach' : esc(x.role || 'Coach')] }); })) + (o.staff.some(function (x) { return x.unavailable && !x.covering; }) ? note('One coach is away this week; the office is arranging cover.') : '') : note('The coach for this session is being confirmed. We will tell you before the session.') });
    var bring = K.card({ title: 'What to bring', body: '<ul class="ph-list">' + db.getWhatToBring(s.programme).map(function (b) { return '<li>' + I('check', 'icon-sm') + esc(b) + '</li>'; }).join('') + '</ul>' +
      mine.filter(function (p) { return p.medical === 'details'; }).map(function (p) { return K.restricted(FAM_ROLES, '<p class="ph-sens">' + esc(p.first) + ': ' + esc(p.medicalDetail) + '</p>', p.first + '’s medical details'); }).join('') });
    var att = '';
    if (db.isRegisterDue(o) && o.status !== 'Cancelled' && o.status !== 'Rescheduled') {
      var r = db.getRegister(o.id);
      att = K.card({ title: 'Attendance', body: K.kv(mine.map(function (p) { var m = r.marks[p.id]; return [p.first, mark(m && m.mark) + (m ? '<br>' + K.stamp('Marked', m.by, m.at) : '')]; })) });
    } else if (o.status === 'Scheduled') {
      var abs = db.getAbsences(o.id);
      att = K.card({ title: 'Can’t make it?', body: (abs.length ? K.kv(abs.map(function (a) { return [db.getPlayer(a.player).first, K.status('Excused') + ' ' + esc(a.reason) + '<br>' + K.stamp('Told the coach', a.by, a.at)]; })) : '<p class="k-note">Let the coach know before the session so nobody waits at the gate. It does not change what you pay.</p>') +
        '<div class="ph-actions">' + mine.filter(function (p) { return !abs.some(function (a) { return a.player === p.id; }); }).map(function (p) { return K.actBtn(p.first + ' can’t come', 'ph-absence', { id: o.id, player: p.id }, { variant: 'secondary', size: 'sm' }); }).join('') + '</div>' });
    }
    var hist = o.history.slice().reverse().filter(function (x) { return !/confirmed|Generated|Staff|notes/i.test(x.text); }).map(function (x) { return /Financial outcome/.test(x.text) ? Object.assign({}, x, { text: 'Credit given to every family affected', detail: '' }) : x; }).concat([{ text: 'Added to the autumn timetable', who: 'System', at: '2026-08-20T09:00' }]);
    return K.page(h, top + K.grid(outs.concat([where, coaches, bring, att]).filter(Boolean), 2) + K.section('History', null, '<div class="lx-card">' + K.timeline(hist) + '</div>'), 'ph');
  };
  Hub.actions['ph-absence'] = function (el) {
    var o = db.getOccurrence(el.dataset.id), p = db.getPlayer(el.dataset.player);
    Hub.openSheet({ title: esc(p.first) + ' can’t come on ' + esc(K.dd(o.date)), body: K.form([K.field('Reason', K.select('ph-abs-reason', ['Unwell', 'Family commitment', 'School event', 'Injury', 'Other'], 'Unwell')), K.field('Anything the coach should know', K.textarea('ph-abs-note', '', 'Optional'), null, true)], 1),
      foot: sheetFoot('Tell the coach', 'ph-absence-go', { id: o.id, player: p.id }) });
  };
  Hub.actions['ph-absence-go'] = function (el) {
    var o = db.getOccurrence(el.dataset.id), p = db.getPlayer(el.dataset.player), r = K.val('ph-abs-reason') + (K.val('ph-abs-note').trim() ? ': ' + K.val('ph-abs-note').trim() : ''), at = K.now(), who = K.me();
    mutate(function () { db.addAbsence({ occurrence: o.id, player: p.id, reason: r, by: who, at: at }); }, 'Coach told that ' + p.first + ' can’t come', 'Absence notice for ' + p.name + ' on ' + K.dd(o.date) + ' (' + o.session + ')', o.id, { after: { mark: 'Excused (notice from family)' }, at: at, who: who });
  };

  /* ================================================================ ATTENDANCE */
  Hub.screens['parent-attendance'] = function (ctx) {
    var h = head({ back: ['parent-sessions', 'Sessions'], title: 'Attendance', sub: 'From the registers coaches take at each session. Cancelled sessions are not counted.' });
    var g = guard(ctx, h, ['checkCircle', 'No attendance yet', 'Attendance appears once a coach completes a register.']); if (g) return g;
    var pid = childPick('ph-att-child'), p = db.getPlayer(pid), sum = db.getAttendanceSummary(pid), list = db.getAttendance(pid);
    var stats = K.stats([{ label: 'Attendance', value: sum.pct == null ? '—' : sum.pct + '%', sub: 'Present or late, this term' }, { label: 'Present', value: sum.present }, { label: 'Late', value: sum.late }, { label: 'Absent or excused', value: sum.absent + sum.excused, sub: sum.excused + ' excused' }]);
    var rows = list.map(function (a) { return { route: 'parent-session/' + a.occurrence.id, cells: [K.cell(esc(K.dd(a.occurrence.date)), esc(a.occurrence.session)), { html: K.status(a.mark) }, { cls: 'wide', html: K.stamp('Marked', a.by, a.at) }, { cls: 'wide c-cell', html: esc(a.note || '') }] }; });
    return K.page(h, '<div class="ph-bar">' + childSeg('ph-att-child') + '</div>' + stats + K.section(p.first + '’s registers', list.length + ' sessions marked', K.table({ cols: 'minmax(0,1.4fr) 110px minmax(0,1.4fr) minmax(0,1fr)', head: ['Session', 'Mark', { label: 'Taken by', cls: 'wide' }, { label: 'Note', cls: 'wide' }], rows: rows, empty: 'No registers completed yet.' })), 'ph');
  };

  /* ================================================================ BROWSE, BOOK, BASKET, CHECKOUT */
  function bookingOff(h) { return K.feature('bookings') ? null : K.page(h, K.featureOff('bookings'), 'ph'); }
  function basketBtn() { var n = db.getBasket().length; return K.goBtn('Basket' + (n ? ' (' + n + ')' : ''), 'parent-basket', { variant: n ? 'primary' : 'secondary', icon: 'card' }); }
  function fromPrice(p) { var low = p.tiers.reduce(function (a, b) { return b.price < a.price ? b : a; }); return K.money(low.price) + (p.tiers.length > 1 ? ' to ' + K.money(Math.max.apply(null, p.tiers.map(function (t) { return t.price; }))) : ''); }
  function facts(list) { return '<ul class="ph-facts">' + list.map(function (f) { return '<li>' + I(f[0], 'icon-sm') + '<span>' + f[1] + '</span></li>'; }).join('') + '</ul>'; }
  Hub.screens['parent-browse'] = function (ctx) {
    var h = head({ title: 'Book camps and events', sub: 'Pick a camp, event or tour, choose who is going, then pay in one checkout. Siblings get 10% off.', actions: basketBtn() });
    var g = guard(ctx, h, ['calendar', 'Nothing to book right now', 'New camps and events appear here when they open.']); if (g) return g;
    var off = bookingOff(h); if (off) return off;
    var cards = db.getBookables().map(function (p) {
      var el = kids().map(function (c) { var e = db.isEligibleFor(p.id, c.id); return '<span class="ph-chip' + (e.ok ? ' is-ok' : '') + '" title="' + esc(e.reason) + '">' + I(e.ok ? 'check' : 'x', 'icon-sm') + esc(c.first) + '</span>'; }).join('');
      var left = p.capacity - p.booked;
      return '<article class="lx-card ph-product"><div class="ph-product__top"><span class="lx-area__icon">' + I(p.icon) + '</span>' + K.pill(p.kind, 'info') + '<span class="ph-product__left">' + left + ' places left</span></div>' +
        '<h3>' + esc(p.title) + '</h3><p class="k-note">' + esc(p.summary) + '</p>' + facts([['calendar', esc(p.when)], ['pin', esc(p.venue ? db.venueName(p.venue) : p.venueText)], ['users', esc(p.ages)]]) + '<b class="num ph-from">' + fromPrice(p) + '</b>' +
        '<div class="ph-product__foot"><div class="ph-chips">' + el + '</div>' + K.goBtn('Choose', 'parent-book/' + p.id, { variant: 'primary', size: 'sm', trail: 'arrowRight' }) + '</div></article>';
    });
    var groups = db.getOfferRows('academy').filter(function (r) { return r.session; }).map(function (r) {
      var member = kids().filter(function (c) { return db.getPlayerMemberships(c.id).some(function (m) { return m.session === r.session && m.state !== 'Ended'; }); });
      return ui.row({ lead: '<span class="row__icon">' + I('calendar', 'icon-sm') + '</span>', title: esc(r.name), sub: [esc(r.who), esc(r.when), esc(r.venue)], stretch: true, action: 'ph-session-req', data: { session: r.session },
        trail: (member.length ? K.pill(names(member) + ' · member', 'ok') : '<span class="num ph-price">' + K.money(r.price) + ' a month</span>') });
    });
    return K.page(h, K.grid(cards, 3) +
      K.section('Weekly groups', 'Monthly memberships. Ask for a place and the office confirms it.', K.list(groups) + (K.feature('sessionRequests') ? '' : note('Asking for a weekly place online is switched off for now. Tap a group to see how to join.'))) +
      K.section('Before you book', null, K.tiles([{ route: 'parent-offers', icon: 'star', title: 'Offers & discounts', desc: 'Sibling discount, member camp rate and package prices' }, { route: 'parent-policies', icon: 'shield', title: 'Terms & refunds', desc: 'What happens if you need to cancel' }, { route: 'parent-basket', icon: 'card', title: 'Basket', value: db.getBasket().length, label: 'places', desc: 'Not booked until you pay' }], 3)), 'ph');
  };
  Hub.actions['ph-session-req'] = function (el) {
    var s = db.getSession(el.dataset.session), list = kids();
    if (!K.feature('sessionRequests')) { Hub.openSheet({ overline: '<span class="overline">' + esc(s.name) + '</span>', title: 'Ask for a weekly place', body: K.featureOff('sessionRequests') + note('You can still ask the office directly: ' + esc('office@example.com') + '.'), foot: ui.btn('Close', { variant: 'primary', attrs: { 'data-action': 'close-sheet' } }) }); return; }
    Hub.openSheet({ overline: '<span class="overline">' + esc(s.name) + '</span>', title: 'Ask for a weekly place', body: K.form([K.field('Child', K.select('ph-sr-child', list.map(function (c) { return [c.id, c.name + ' (' + c.ageGroup + ')']; }), list[0].id)), K.field('Start from', K.input('ph-sr-from', K.addDays(K.today, 7), { type: 'date' })), K.field('Anything we should know', K.textarea('ph-sr-reason', '', 'Optional'), 'The office checks age group and space, then confirms. Nothing is charged until it is approved.', true)]),
      foot: sheetFoot('Send request', 'ph-session-req-go', { session: s.id }) });
  };
  Hub.actions['ph-session-req-go'] = function (el) {
    var s = db.getSession(el.dataset.session), pid = K.val('ph-sr-child'), from = K.val('ph-sr-from'), r = K.val('ph-sr-reason').trim() || 'Asked in the parent hub', at = K.now(), who = K.me(), p = db.getPlayer(pid);
    if (!from) { Hub.toast('Choose a start date'); return; }
    mutate(function () { db.requestSessionPlace(pid, s.id, from, r, who, at); }, 'Request sent for ' + p.first, 'Session request for ' + p.name + ': ' + s.name + ' from ' + K.dm(from), pid, { at: at, who: who });
  };

  var draft = {};
  function bookDraft(p) {
    var d = draft[p.id] = draft[p.id] || { terms: false };
    var el = kids().filter(function (c) { return db.isEligibleFor(p.id, c.id).ok; });
    if (!d.child || !el.some(function (c) { return c.id === d.child; })) d.child = el[0] ? el[0].id : null;
    if (!d.tier || !p.tiers.some(function (t) { return t.id === d.tier; })) d.tier = p.tiers[p.tiers.length - 1].id;
    if (!d.day || p.dates.indexOf(d.day) < 0) d.day = p.dates[0];
    return d;
  }
  function pickBtns(action, list, cur, pid) {
    return '<div class="segmented k-seg ph-pick" role="group">' + list.map(function (x) { return '<button type="button" data-action="' + action + '" data-id="' + pid + '" data-val="' + esc(x[0]) + '" aria-pressed="' + (x[0] === cur) + '"' + (x[2] ? ' disabled' : '') + '>' + esc(x[1]) + '</button>'; }).join('') + '</div>';
  }
  Hub.screens['parent-book'] = function (ctx) {
    var p = db.getBookable(ctx.param);
    var h = head({ back: ['parent-browse', 'Book camps and events'], eyebrow: p ? p.kind : 'Book', title: p ? p.title : 'Book', sub: p ? esc(p.when) + ' · ' + esc(p.venue ? db.venueName(p.venue) : p.venueText) : '', actions: basketBtn() });
    var g = guard(ctx, h, ['calendar', 'Not open for booking', 'This is not open for booking right now.']); if (g) return g;
    var off = bookingOff(h); if (off) return off;
    if (!p) return K.page(h, emptyBox('calendar', 'Not found', 'This camp or event is no longer on offer.', K.goBtn('Browse', 'parent-browse', { variant: 'secondary', size: 'sm' })), 'ph');
    var d = bookDraft(p), t = db.getBookableTier(p.id, d.tier), terms = db.getCurrentTerms();
    var childBtns = pickBtns('ph-book-child', kids().map(function (c) { var e = db.isEligibleFor(p.id, c.id); return [c.id, c.first, !e.ok]; }), d.child, p.id);
    var why = kids().map(function (c) { var e = db.isEligibleFor(p.id, c.id); return e.ok ? '' : '<li>' + esc(e.reason) + '</li>'; }).join('');
    var pol = p.refundPolicy ? db.getRefundPolicies().filter(function (r) { return r.id === p.refundPolicy; })[0] : null;
    var inBasket = db.getBasket().filter(function (l) { return l.product === p.id; }).length;
    var sibling = inBasket > 0 && (p.discounts || []).indexOf('DSC-01') >= 0;
    var member = d.child && (p.discounts || []).indexOf('DSC-02') >= 0 && db.phMemberOn(d.child, p.dates[0]);
    var pct = sibling ? 10 : member ? 5 : 0, disc = Math.round(t.price * pct / 100);
    var form = K.card({ title: '1. Who is going?', body: (d.child ? childBtns : '') + (why ? '<ul class="ph-why">' + why + '</ul>' : '') + (!d.child ? ui.notice('info', 'None of your children can book this', 'Check the age groups above, or look at other camps and events.') : '') }) +
      K.card({ title: '2. Choose a package', body: pickBtns('ph-book-tier', p.tiers.map(function (x) { return [x.id, x.name + ' · ' + K.money(x.price)]; }), d.tier, p.id) +
        (p.pickDay && t.days === 1 ? '<div class="ph-sub">Which day?</div>' + pickBtns('ph-book-day', p.dates.map(function (x) { return [x, K.dd(x)]; }), d.day, p.id) : '') +
        (t.full ? note('Full price ' + K.money(t.full) + '; the balance of ' + K.money(t.full - t.price) + ' is due by ' + K.d(t.balanceDue) + '.') : '') }) +
      K.card({ title: '3. Terms', body: '<p class="k-note">' + esc(terms.kind) + ' version ' + esc(terms.version) + ', from ' + esc(K.d(terms.from)) + ': ' + esc(terms.summary) + '. ' + K.link('parent-policies', 'Read the terms') + '</p>' +
        K.toggle(d.terms, 'ph-book-terms', { id: p.id }, 'I accept the ' + terms.kind.toLowerCase() + ' (v' + terms.version + ')') + (pol ? '<p class="k-note ph-pol">' + I('shield', 'icon-sm') + ' Refund policy: ' + esc(pol.name) + '. ' + esc(pol.outside) + '; inside the window: ' + esc(pol.inside.toLowerCase()) + '.</p>' : '<p class="k-note ph-pol">' + I('shield', 'icon-sm') + ' ' + esc(p.refundText || '') + '</p>') });
    var price = K.card({ title: 'Price', cls: 'ph-sticky', body: K.kv([['Package', esc(t.name)], ['Price', K.money(t.price)], pct ? ['Discount', '−' + K.money(disc) + ' <span class="text-3">(' + (sibling ? 'sibling 10%' : 'member camp rate 5%') + ')</span>'] : null, ['This place', '<b class="num">' + K.money(t.price - disc) + '</b>']]) +
      (inBasket ? note(inBasket + ' already in your basket for this. Each extra child gets the sibling discount.') : (p.discounts || []).indexOf('DSC-01') >= 0 && kids().length > 1 ? note('Add a brother or sister in the same checkout for 10% off their place.') : '') +
      '<div class="ph-actions">' + K.actBtn('Add to basket', 'ph-book-add', { id: p.id }, { variant: 'primary', icon: 'plus', attrs: d.child ? {} : { disabled: true } }) + (inBasket ? K.goBtn('Go to basket', 'parent-basket', { variant: 'secondary' }) : '') + '</div>' });
    return K.page(h, K.steps(['Choose', 'Basket', 'Pay'], 0) + '<div class="k-grid k-grid--21">' + '<div class="lx-stack">' + form + '</div><div class="lx-stack">' + price + K.card({ title: 'What to bring', body: '<ul class="ph-list">' + db.getWhatToBring(p.kind).map(function (b) { return '<li>' + I('check', 'icon-sm') + esc(b) + '</li>'; }).join('') + '</ul>' }) + '</div></div>', 'ph');
  };
  Hub.actions['ph-book-child'] = function (el) { draft[el.dataset.id].child = el.dataset.val; Hub.render(); };
  Hub.actions['ph-book-tier'] = function (el) { draft[el.dataset.id].tier = el.dataset.val; Hub.render(); };
  Hub.actions['ph-book-day'] = function (el) { draft[el.dataset.id].day = el.dataset.val; Hub.render(); };
  Hub.actions['ph-book-terms'] = function (el) { var d = draft[el.dataset.id]; d.terms = !d.terms; Hub.render(); };
  Hub.actions['ph-book-add'] = function (el) {
    var p = db.getBookable(el.dataset.id), d = draft[p.id], t = db.getBookableTier(p.id, d.tier), c = db.getPlayer(d.child), terms = db.getCurrentTerms(), at = K.now(), who = K.me();
    if (!d.child) return;
    if (!d.terms) { Hub.toast('Please accept the terms first'); return; }
    var dates = p.pickDay && t.days === 1 ? [d.day] : p.dates.slice(0, t.days);
    mutate(function () { db.addBasketLine({ product: p.id, player: c.id, tier: t.id, dates: dates, terms: terms.id, termsAt: at, addedBy: who, at: at }); d.terms = false; d.child = null; }, c.first + ' added to your basket', 'Added ' + c.name + ' to the basket: ' + p.title + ' (' + t.name + ')', c.id, { at: at, who: who, after: { terms: terms.id + ' accepted' } });
  };

  function priceTable(q, removable) {
    return K.table({ cols: 'minmax(0,1.8fr) minmax(0,1fr) 80px 90px' + (removable ? ' 90px' : ''), head: ['Place', { label: 'Discount', cls: 'wide' }, { label: 'Price', cls: 'c-num wide' }, { label: 'To pay', cls: 'c-num' }].concat(removable ? [{ label: '', cls: 'wide' }] : []),
      rows: q.lines.map(function (l) {
        var p = db.getPlayer(l.player);
        return { cells: [K.cell(esc(p.first) + ' · ' + esc(l.productTitle), esc(l.tierName) + ' · ' + esc(l.dates.map(K.dm).join(', '))), { cls: 'wide', html: l.discount ? esc(l.discountRule) + ' <span class="num">−' + K.money(l.discount) + '</span>' : '<span class="text-3">None</span>' }, { cls: 'c-num wide', html: K.money(l.base) }, { cls: 'c-num', html: '<b>' + K.money(l.final) + '</b>' }]
          .concat(removable ? [{ cls: 'c-end wide', html: K.actBtn('Remove', 'ph-basket-remove', { id: l.id }, { variant: 'tertiary', size: 'sm' }) }] : []) };
      }), empty: 'Your basket is empty.' });
  }
  function totals(q, done) {
    var pairs = [['Places', K.money(q.subtotal)], q.discount ? ['Discounts', '−' + K.money(q.discount)] : null, ['Total', '<b class="num">' + K.money(q.total) + '</b>']];
    q.credit.forEach(function (x, i) { pairs.push([(i ? 'Then credit from ' : 'Family credit from ') + K.dm(x.credit.at), '−' + K.money(x.use) + '<br><span class="text-3 ph-small">' + esc(x.credit.source) + (x.use < x.credit.remaining ? ' · ' + K.money(x.credit.remaining - x.use) + ' left after' : '') + '</span>']); });
    pairs.push([done ? 'Paid by card' : 'Due now', '<b class="num ph-due">' + K.money(q.due) + '</b>']);
    return K.kv(pairs.filter(Boolean));
  }
  Hub.screens['parent-basket'] = function (ctx) {
    var h = head({ back: ['parent-browse', 'Book camps and events'], title: 'Basket', sub: 'Places are held when you pay. Discounts and family credit are worked out for you.' });
    var g = guard(ctx, h, ['card', 'Your basket is empty', 'Choose a camp or event to add a place.']); if (g) return g;
    var off = bookingOff(h); if (off) return off;
    var q = db.priceBasket();
    if (!q.lines.length) return K.page(h, K.steps(['Choose', 'Basket', 'Pay'], 1) + emptyBox('card', 'Your basket is empty', 'Choose a camp or event and add a place for each child.', K.goBtn('Browse camps and events', 'parent-browse', { variant: 'primary', size: 'sm' })), 'ph');
    return K.page(h, K.steps(['Choose', 'Basket', 'Pay'], 1) + '<div class="k-grid k-grid--21">' + K.card({ title: q.lines.length + ' place' + (q.lines.length === 1 ? '' : 's'), body: priceTable(q, true) + note('Discounts never stack: each place gets its single best discount. Sibling 10% applies to the second and later child on the same camp.') }) +
      K.card({ title: 'Summary', body: totals(q) + note('Family credit is used oldest first and can be part-used.') + '<div class="ph-actions">' + K.goBtn('Continue to checkout', 'parent-checkout', { variant: 'primary', trail: 'arrowRight' }) + K.goBtn('Add another place', 'parent-browse', { variant: 'tertiary' }) + '</div>' }) + '</div>', 'ph');
  };
  Hub.actions['ph-basket-remove'] = function (el) { var l = db.getBasket().filter(function (x) { return x.id === el.dataset.id; })[0], p = db.getPlayer(l.player), at = K.now(); mutate(function () { db.removeBasketLine(l.id); }, p.first + ' removed from your basket', 'Removed ' + p.name + ' from the basket (' + db.getBookable(l.product).title + ')', p.id, { at: at }); };

  Hub.screens['parent-checkout'] = function (ctx) {
    var h = head({ back: ['parent-basket', 'Basket'], title: 'Checkout', sub: 'Test mode: the card form is a mock and no real payment is taken.' });
    var g = guard(ctx, h, ['card', 'Nothing to pay', 'Your basket is empty.']); if (g) return g;
    var off = bookingOff(h); if (off) return off;
    var q = db.priceBasket(), last = db.getLastParentBooking();
    if (!q.lines.length && last) {
      var paid = last.payment ? last.payment.amount : 0, cr = K.sum(last.lines, 'creditApplied');
      return K.page(h, K.steps(['Choose', 'Basket', 'Pay'], 3) + ui.notice('ok', 'Booking ' + last.id + ' confirmed', 'A confirmation is on its way to ' + esc(me().email) + '.', { meta: 'Booked by ' + db.getParent(last.bookedBy).name + ', ' + K.dt(last.at) }) +
        K.card({ title: last.product, right: K.frozen('Paid'), body: K.table({ cols: 'minmax(0,1.6fr) 110px 110px', head: ['Place', { label: 'Credit used', cls: 'c-num wide' }, { label: 'Paid', cls: 'c-num' }], rows: last.lines.map(function (l) { return { cells: [K.cell(esc(db.getPlayer(l.player).first) + ' · ' + esc(l.tier), esc(l.dates.map(K.dm).join(', ')) + (l.discountRule ? ' · ' + esc(l.discountRule) : '')), { cls: 'c-num wide', html: K.money(l.creditApplied) }, { cls: 'c-num', html: K.money(l.final) }] }; }) }) +
          K.kv([['Family credit used', K.money(cr)], ['Paid by card', K.money(paid) + (last.payment ? ' <span class="text-3">(' + esc(last.payment.method) + ')</span>' : '')], ['Terms accepted', esc(db.getTermsVersion(last.terms).kind) + ' v' + esc(db.getTermsVersion(last.terms).version)], ['Recorded', K.stamp('Booked', db.getParent(last.bookedBy).name, last.at)]]) }) +
        '<div class="ph-actions">' + K.goBtn('View billing', 'parent-billing', { variant: 'primary' }) + K.goBtn('Book something else', 'parent-browse', { variant: 'secondary' }) + '</div>', 'ph');
    }
    if (!q.lines.length) return K.page(h, emptyBox('card', 'Nothing to pay', 'Your basket is empty.', K.goBtn('Browse camps and events', 'parent-browse', { variant: 'primary', size: 'sm' })), 'ph');
    var terms = db.getCurrentTerms();
    var payBtn = q.due > 0 ? K.actBtn('Pay ' + K.money(q.due), 'ph-pay', {}, { variant: 'primary', icon: 'card' }) : K.actBtn('Confirm booking', 'ph-pay-go', { credit: 1 }, { variant: 'primary', icon: 'check' });
    return K.page(h, K.steps(['Choose', 'Basket', 'Pay'], 2) + '<div class="k-grid k-grid--21">' +
      K.card({ title: 'Your places', body: priceTable(q, false) + note('You accepted the ' + esc(terms.kind.toLowerCase()) + ' v' + esc(terms.version) + ' for each place. A copy of your acceptance is kept with the booking.') }) +
      K.card({ title: 'Amount due', body: totals(q) + '<div class="ph-actions">' + payBtn + '</div>' + (q.creditUsed ? note(K.money(q.creditUsed) + ' of family credit is applied first, oldest credit first.') : '') }) + '</div>', 'ph');
  };
  Hub.actions['ph-pay'] = function () {
    var q = db.priceBasket();
    Hub.openSheet({ overline: '<span class="overline">Test mode · no real payment</span>', title: 'Pay ' + K.money(q.due),
      body: K.form([K.field('Name on card', K.input('ph-card-name', me().name), null, true), K.field('Card number', K.input('ph-card-no', '4242 4242 4242 4242'), 'Test card. Card details are never kept in the Hub.', true), K.field('Expiry', K.input('ph-card-exp', '12/28')), K.field('Security code', K.input('ph-card-cvc', '123'))]) +
        note(q.creditUsed ? K.money(q.creditUsed) + ' family credit has already been taken off.' : 'No family credit to apply.'),
      foot: sheetFoot('Pay ' + K.money(q.due), 'ph-pay-go', {}, { icon: 'card' }) });
  };
  Hub.actions['ph-pay-go'] = function (el) {
    var credit = el.dataset.credit, no = (K.val('ph-card-no') || '').replace(/\s/g, ''), at = K.now(), who = K.me(), q = db.priceBasket();
    if (!credit && (no.length < 12 || !/^\d+$/.test(no))) { Hub.toast('Check the card number'); return; }
    var card = credit ? { brand: 'Family credit', last4: '' } : { brand: no[0] === '4' ? 'Visa' : 'Card', last4: no.slice(-4) };
    Hub.closeSheet(true);
    Hub.mutate(function () {
      var b = db.checkoutBasket(card, who, at);
      if (b) K.log({ area: AREA, finance: true, summary: 'Booking ' + b.id + ' paid in the parent hub (' + K.money(q.total) + ': family credit ' + K.money(q.creditUsed) + ', card ' + K.money(q.due) + ')', entity: b.id, after: { lines: q.lines.length, paid: K.money(q.due), terms: b.terms }, at: at, who: who });
    }, (q.due > 0 ? 'Paid ' + K.money(q.due) : 'Booked with family credit') + ' · booking confirmed');
  };

  /* ================================================================ MEMBERSHIPS */
  function memTitle(m) { return db.getPlayer(m.player).first + ' · ' + sess(m.session).name; }
  Hub.screens['parent-memberships'] = function (ctx) {
    var h = head({ title: 'Memberships', sub: 'Weekly groups billed monthly. Ask for a pause or cancellation here; the office confirms it.' });
    var g = guard(ctx, h, ['calendar', 'No memberships', 'When your child joins a weekly group, the membership appears here.']); if (g) return g;
    var ms = db.phMemberships().slice().sort(function (a, b) { return (a.state === 'Ended') - (b.state === 'Ended'); });
    var cards = ms.map(function (m) {
      var s = sess(m.session), r = db.getOpenMembershipRequest(m.id), p = db.getPlayer(m.player);
      return '<a class="lx-card ph-mem" href="#parent-membership/' + m.id + '"><div class="ph-mem__top">' + ui.avatar(p.name, 'sm') + '<div><b>' + esc(p.first) + '</b><small>' + esc(s.name) + '</small></div>' + K.status(m.state) + '</div>' +
        K.kv([['Price', K.money(m.price) + ' a month'], ['When', esc(DAYS[s.days[0]]) + 's ' + s.start + '–' + s.end], ['Since', K.d(m.start)], m.state === 'Ending Scheduled' ? ['Ends', K.d(m.cancel.end)] : m.state === 'Paused' ? ['Paused until', K.d(m.pause.to)] : ['Next payment', m.state === 'Ended' ? '—' : K.d('2026-11-01')]].filter(Boolean)) +
        (r ? '<span class="ph-mem__req">' + I('inbox', 'icon-sm') + esc(r.type) + ' request ' + esc(r.status.toLowerCase()) + '</span>' : '') + '</a>';
    });
    return K.page(h, (cards.length ? K.grid(cards, 2) : emptyBox('calendar', 'No memberships', 'Browse weekly groups to ask for a place.', K.goBtn('Browse', 'parent-browse', { variant: 'secondary', size: 'sm' }))) +
      K.section('What each status means', null, '<div class="lx-card">' + K.kv(STATE_HELP.map(function (s) { return [s[0], K.status(s[0]) + ' <span class="text-3">' + esc(s[1]) + '</span>']; })) + '</div>'), 'ph');
  };
  Hub.screens['parent-membership'] = function (ctx) {
    var m = db.getMembership(ctx.param), ok = m && db.phIsMembership(m.id);
    var h = head({ back: ['parent-memberships', 'Memberships'], eyebrow: 'Membership', title: ok ? memTitle(m) : 'Membership', sub: ok ? K.status(m.state) + ' ' + K.id(m.id) : '' });
    var g = guard(ctx, h, ['calendar', 'Membership not available', 'This membership is not available right now.']); if (g) return g;
    if (!ok) return notMine(h, 'Membership');
    var s = sess(m.session), n = db.getMembershipNotice(m), r = db.getOpenMembershipRequest(m.id), pol = db.getRefundPolicies().filter(function (x) { return x.id === 'RFP-02'; })[0];
    var top = '';
    if (m.state === 'Paused' && m.pause) top = ui.notice('warn', 'Paused from ' + K.dm(m.pause.from) + ' to ' + K.dm(m.pause.to), esc(m.pause.reason) + '. No sessions or charges while paused.', { meta: 'Paused by ' + m.pause.by + ', ' + K.dt(m.pause.at) });
    if (m.state === 'Cancellation Pending' && m.cancel) top = ui.notice('warn', 'Cancellation requested', 'Once the office confirms, ' + n.days + ' days notice runs from the request date: the last day would be ' + K.d(K.addDays(m.cancel.requested.slice(0, 10), n.days)) + '.', { meta: 'Requested by ' + m.cancel.by + ', ' + K.dt(m.cancel.requested) });
    if (m.state === 'Ending Scheduled' && m.cancel) top = ui.notice('info', 'Ending on ' + K.d(m.cancel.end), 'Sessions carry on until then. No charges after the end date.', { meta: 'Confirmed by ' + m.cancel.approvedBy + ', ' + K.dt(m.cancel.approvedAt) });
    if (m.state === 'Ended' && m.ended) top = ui.notice('neutral', 'Ended on ' + K.d(m.ended.on), esc(m.ended.reason), { meta: 'Recorded by ' + m.ended.by + ', ' + K.dt(m.ended.at) });
    var details = K.card({ title: 'Details', body: K.kv([['Status', K.status(m.state)], ['Session', esc(s.name) + '<br><span class="text-3">' + esc(DAYS[s.days[0]]) + 's ' + s.start + '–' + s.end + ' · ' + esc(db.venueName(s.venue)) + '</span>'], ['Price', K.money(m.price) + ' a month, taken on the 1st'], ['Started', K.d(m.start)], ['Notice period', n.days + ' days' + (n.rule ? ' <span class="text-3">(' + esc(n.rule.basis) + ')</span>' : '')]]) });
    var acts = '';
    if (r) acts = K.card({ title: 'Your ' + r.type.toLowerCase() + ' request', right: K.status(r.status), body: K.kv([['Reason', esc(r.reason)], r.pauseTo ? ['Dates', K.d(r.effective) + ' to ' + K.d(r.pauseTo)] : ['Would end', r.effective ? K.d(r.effective) : '—'], ['Sent', K.stamp('Requested', db.getParent(r.by).name, r.at)]]) + '<div class="ph-actions">' + K.actBtn('Withdraw request', 'ph-req-withdraw', { id: r.id }, { variant: 'secondary', size: 'sm' }) + '</div>' });
    else if (m.state === 'Active') acts = K.card({ title: 'Need a change?', body: '<p class="k-note">A pause is for four weeks or more (injury, exams). Cancelling needs ' + n.days + ' days notice: if you ask today, the last day would be ' + K.d(n.end) + '.</p>' +
      '<div class="ph-actions">' + K.actBtn('Request a pause', 'ph-mem-pause', { id: m.id }, { variant: 'secondary' }) + K.actBtn('Request cancellation', 'ph-mem-cancel', { id: m.id }, { variant: 'secondary' }) + '</div>' + (pol ? note(esc(pol.name) + ': ' + esc(pol.inside) + '.') : '') });
    var charges = db.getFamilyCharges(function (c) { return c.membership === m.id; });
    var chTable = K.table({ cols: 'minmax(0,1.6fr) 100px 100px 150px', head: ['Charge', { label: 'Credit used', cls: 'c-num wide' }, { label: 'Paid', cls: 'c-num' }, { label: 'State', cls: 'wide' }],
      rows: charges.map(function (c) { return { action: 'ph-charge', data: { id: c.id }, label: 'Open charge', cells: [K.cell(esc(c.description), K.d(c.date)), { cls: 'c-num wide', html: K.money(c.creditApplied) }, { cls: 'c-num', html: K.money(c.paid) }, { cls: 'wide', html: c.state === 'Paid' ? K.frozen('Paid') : K.status(c.state) }] }; }), empty: 'No charges yet.' });
    return K.page(h, top + K.grid([details, acts].filter(Boolean), 2) + K.section('Payments', 'Taken payments are final and cannot be edited.', chTable) + K.section('History', null, '<div class="lx-card">' + K.timeline(db.getMembershipHistory(m.id)) + '</div>'), 'ph');
  };
  Hub.actions['ph-mem-pause'] = function (el) {
    var m = db.getMembership(el.dataset.id);
    Hub.openSheet({ overline: '<span class="overline">' + esc(memTitle(m)) + '</span>', title: 'Request a pause', body: K.form([K.field('From', K.input('ph-from', K.addDays(K.today, 7), { type: 'date' })), K.field('Until', K.input('ph-to', K.addDays(K.today, 42), { type: 'date' })), K.field('Reason', K.textarea('ph-reason', '', 'For example: broken wrist, back after half term'), 'Pauses are for four weeks or more. No charges while paused.', true)]),
      foot: sheetFoot('Send pause request', 'ph-mem-pause-go', { id: m.id }) });
  };
  Hub.actions['ph-mem-pause-go'] = function (el) {
    var m = db.getMembership(el.dataset.id), f = K.val('ph-from'), t = K.val('ph-to'), r = K.val('ph-reason').trim(), at = K.now(), who = K.me();
    if (!f || !t || t <= f) { Hub.toast('Check the pause dates'); return; } if (!r) { Hub.toast('Add a reason'); return; }
    mutate(function () { db.requestMembershipPause(m.id, f, t, r, who, at); }, 'Pause request sent to the office', 'Pause requested for ' + memTitle(m) + ' (' + K.dm(f) + ' to ' + K.dm(t) + ')', m.id, { at: at, who: who });
  };
  Hub.actions['ph-mem-cancel'] = function (el) {
    var m = db.getMembership(el.dataset.id), n = db.getMembershipNotice(m);
    Hub.openSheet({ overline: '<span class="overline">' + esc(memTitle(m)) + '</span>', title: 'Request cancellation', body: K.kv([['Notice period', n.days + ' days from today'], ['Last day if confirmed', '<b>' + K.d(n.end) + '</b>'], ['Payments', 'The payment already taken for October is not refunded. No charges after the last day.']]) +
      K.form([K.field('Why are you leaving?', K.textarea('ph-reason', '', 'Required'), 'It helps us improve. The office confirms the end date.', true)], 1),
      foot: sheetFoot('Send cancellation request', 'ph-mem-cancel-go', { id: m.id }) });
  };
  Hub.actions['ph-mem-cancel-go'] = function (el) {
    var m = db.getMembership(el.dataset.id), r = K.val('ph-reason').trim(), at = K.now(), who = K.me(), n = db.getMembershipNotice(m);
    if (!r) { Hub.toast('Add a reason'); return; }
    mutate(function () { db.requestMembershipCancellation(m.id, r, who, at); }, 'Cancellation request sent · ' + n.days + ' days notice', 'Cancellation requested for ' + memTitle(m), m.id, { before: { state: m.state }, after: { state: 'Cancellation Pending', end: n.end }, at: at, who: who });
  };
  Hub.actions['ph-req-withdraw'] = function (el) {
    var r = db.getRequest(el.dataset.id), at = K.now(), who = K.me();
    mutate(function () { db.withdrawRequest(r.id, who, at); }, 'Request withdrawn', r.type + ' request ' + r.id + ' withdrawn', r.id, { before: { status: r.status }, after: { status: 'Withdrawn' }, at: at, who: who });
  };

  /* ================================================================ BILLING */
  Hub.actions['ph-charge'] = function (el) {
    var c = db.getFamilyCharges(function (x) { return x.id === el.dataset.id; })[0], p = db.getPlayer(c.player);
    var apps = db.getFamilyCredits(c.family).map(function (cr) { return cr.applications.filter(function (a) { return a.charge === c.id; }).map(function (a) { return esc(cr.source) + ' · ' + K.money(a.amount); }); }).reduce(function (a, b) { return a.concat(b); }, []);
    Hub.openSheet({ overline: '<span class="overline">Payment</span>', title: esc(c.description), meta: c.state === 'Paid' ? K.frozen('Paid') : K.status(c.state),
      body: K.kv([['For', esc(p ? p.name : '—')], ['Date', K.d(c.date)], ['Charged', K.money(c.gross)], ['Family credit used', K.money(c.creditApplied) + (apps.length ? '<br><span class="text-3">' + apps.join('<br>') + '</span>' : '')], ['Paid', K.money(c.paid) + (c.via ? ' <span class="text-3">(' + esc(c.via) + ')</span>' : '')], c.note ? ['Note', esc(c.note)] : null, ['Taken', K.stamp('Taken', 'System', c.date + 'T06:00')]].filter(Boolean)) +
        note('Payments that have been taken are final. If something looks wrong, ask the office and they will issue a credit or refund.'),
      foot: ui.btn('Close', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Ask about this payment', 'ph-charge-query', { id: c.id }, { variant: 'secondary' }) });
  };
  Hub.actions['ph-charge-query'] = function (el) {
    var c = db.getFamilyCharges(function (x) { return x.id === el.dataset.id; })[0], at = K.now(), who = K.me();
    mutate(function () { db.addRequest({ type: 'Billing query', status: 'Open', stage: 'New', player: c.player, family: c.family, by: Hub.data.parent.id, at: at, reason: 'Question about ' + c.description + ' (' + K.money(c.paid) + ')', effective: null, charge: c.id }); }, 'Question sent to the office', 'Billing query about ' + c.id, c.id, { at: at, who: who, finance: true });
  };
  Hub.screens['parent-billing'] = function (ctx) {
    var tabs = [{ id: 'charges', label: 'Payments' }, { id: 'credits', label: 'Family credit' }, { id: 'bookings', label: 'Bookings' }, { id: 'refunds', label: 'Refunds' }, { id: 'statement', label: 'Statement' }];
    var h = head({ title: 'Billing & payments', sub: 'Everything you have been charged and paid, family credit and refunds. Taken payments are final; the office corrects mistakes with a credit or refund.', tabs: K.tabs('ph-bill', tabs) });
    var g = guard(ctx, h, ['card', 'No payments yet', 'Payments appear here after your first charge.']); if (g) return g;
    if (!K.feature('finance')) return K.page(h, K.featureOff('finance'), 'ph');
    var f = fam(), S = db.getFamilyBillingSummary(f.id), tab = K.tab('ph-bill', tabs);
    var nextAmt = K.sum(db.phMemberships().filter(function (m) { return m.state === 'Active' || m.state === 'Cancellation Pending' || (m.state === 'Ending Scheduled' && m.cancel.end >= '2026-11-01'); }), 'price');
    var stats = K.stats([{ label: 'Owed now', value: K.money(S.owed), sub: S.owed ? 'Due now' : 'Nothing to pay' }, { label: 'Family credit', value: K.money(S.credit), sub: 'Used automatically, oldest first', tone: S.credit ? 'feature' : '' }, { label: 'Paid in October', value: K.money(S.paidThisMonth), sub: 'Card payments' }, { label: 'Next payment', value: K.money(nextAmt), sub: '1 Nov · memberships' }]);
    var body = '';
    if (tab === 'charges') {
      body = K.table({ cols: '90px minmax(0,1.6fr) 100px 100px 100px 140px', head: ['Date', 'Payment', { label: 'Charged', cls: 'c-num wide' }, { label: 'Credit used', cls: 'c-num wide' }, { label: 'Paid', cls: 'c-num' }, { label: 'State', cls: 'wide' }],
        rows: S.charges.slice().reverse().map(function (c) { var p = db.getPlayer(c.player); return { action: 'ph-charge', data: { id: c.id }, label: 'Open payment', cells: [{ cls: 'c-cell', html: K.dm(c.date) }, K.cell(esc(c.description), esc(p ? p.first : '') + (c.note ? ' · ' + esc(c.note) : '')), { cls: 'c-num wide', html: K.money(c.gross) }, { cls: 'c-num wide', html: c.creditApplied ? '−' + K.money(c.creditApplied) : '—' }, { cls: 'c-num', html: '<b>' + K.money(c.paid) + '</b>' }, { cls: 'wide', html: c.state === 'Paid' ? K.frozen('Paid') : K.status(c.state) }] }; }), empty: 'No payments yet.' });
    } else if (tab === 'credits') {
      var cr = db.getFamilyCredits(f.id).slice().sort(function (a, b) { return a.at < b.at ? 1 : -1; });
      body = note('Credit comes off your next payment or booking automatically, oldest credit first, and can be part-used.') + (cr.length ? '<div class="lx-stack">' + cr.map(function (c) {
        return K.card({ title: esc(c.source), sub: K.stamp('Given', c.by, c.at), right: K.frozen('Issued'), body: K.kv([['Amount', K.money(c.amount)], ['Left to use', '<b class="num">' + K.money(c.remaining) + '</b>'], ['For', c.player ? esc(db.getPlayer(c.player).first) : 'The whole family'], ['Used on', c.applications.length ? c.applications.map(function (a) { var ch = db.getFamilyCharges(function (x) { return x.id === a.charge; })[0]; return esc((ch ? ch.description : a.charge) + ' · ' + K.money(a.amount)) + ' <span class="text-3">' + esc(K.dt(a.at)) + '</span>'; }).join('<br>') : 'Not used yet']]) });
      }).join('') + '</div>' : emptyBox('card', 'No family credit', 'Credit for cancelled sessions and goodwill appears here.'));
    } else if (tab === 'bookings') {
      var bk = db.getFamilyBookings(f.id);
      body = bk.length ? '<div class="lx-stack">' + bk.map(function (b) {
        return K.card({ title: esc(b.product), sub: K.stamp('Booked', db.getParent(b.bookedBy).name, b.at), right: K.frozen('Paid'), body: K.table({ cols: 'minmax(0,1.6fr) 110px 110px', head: ['Place', { label: 'Discount', cls: 'c-num wide' }, { label: 'Paid', cls: 'c-num' }], rows: b.lines.map(function (l) { return { cells: [K.cell(esc(db.getPlayer(l.player).first) + ' · ' + esc(l.tier), esc(l.dates.map(K.dm).join(', ')) + ' · ' + esc(l.refundPolicy)), { cls: 'c-num wide', html: l.discount ? '−' + K.money(l.discount) : '—' }, { cls: 'c-num', html: K.money(l.final) }] }; }) }) + (b.payment ? '<p class="k-note">' + esc(b.payment.method) + ' · ' + K.money(b.payment.amount) + ' · ' + esc(b.payment.reference) + '</p>' : '') });
      }).join('') + '</div>' : emptyBox('calendar', 'No bookings yet', 'Camps, events and tours you book appear here.', K.goBtn('Book camps and events', 'parent-browse', { variant: 'secondary', size: 'sm' }));
    } else if (tab === 'refunds') {
      var rf = db.getRefunds(f.id);
      body = (rf.length ? K.table({ cols: '90px minmax(0,2fr) 110px 120px', head: ['Date', 'Refund', { label: 'Amount', cls: 'c-num' }, { label: 'State', cls: 'wide' }], rows: rf.map(function (r) { return { cells: [{ cls: 'c-cell', html: K.dm(r.at) }, K.cell(esc(r.reason), K.stamp('Decided', r.decidedBy, r.at)), { cls: 'c-num', html: K.money(r.amount) }, { cls: 'wide', html: K.status(r.state) }] }; }) }) : emptyBox('refresh', 'No refunds', 'Refunds go back to the card you paid with. You have not had one this year.')) +
        K.section('Refund policies', null, '<div class="lx-card">' + K.kv(db.getRefundPolicies().filter(function (p) { return p.noticeHours > 0; }).map(function (p) { return [p.name, esc(p.outside) + '<br><span class="text-3">Inside the window: ' + esc(p.inside) + '</span>']; })) + '</div>');
    } else {
      var st = db.getFamilyStatement(f.id);
      body = K.card({ title: 'Statement · ' + esc(f.name), sub: 'Autumn term to date', right: K.actBtn('Email me this statement', 'ph-statement', {}, { variant: 'secondary', size: 'sm', icon: 'download' }),
        body: K.table({ cols: '80px minmax(0,1.8fr) 100px 100px 100px', head: ['Date', 'Item', { label: 'Charged', cls: 'c-num' }, { label: 'Paid', cls: 'c-num wide' }, { label: 'Balance', cls: 'c-num wide' }],
          rows: st.map(function (r) { return { cells: [{ cls: 'c-cell', html: K.dm(r.date) }, K.cell(esc(r.text), esc(r.ref)), { cls: 'c-num', html: r.charge ? K.money(r.charge) : r.paid ? '<span class="only-narrow">−' + K.money(r.paid) + '</span>' : r.refund ? K.money(r.refund) : '' }, { cls: 'c-num wide', html: r.paid ? K.money(r.paid) : '' }, { cls: 'c-num wide', html: K.money(r.balance) }] }; }),
          foot: '<span>Owed now <b class="num">' + K.money(S.owed) + '</b></span><span>Family credit available <b class="num">' + K.money(S.credit) + '</b></span>' }) });
    }
    return K.page(h, stats + body, 'ph');
  };
  Hub.actions['ph-statement'] = function () { var at = K.now(), who = K.me(); mutate(null, 'Statement sent to ' + me().email, 'Statement emailed to ' + who, fam().id, { at: at, who: who, finance: true }); };

  /* ================================================================ CHILD PROFILE */
  var FIELDS = {
    address: { label: 'Home address', get: function (p) { return p.address; } },
    school: { label: 'School', get: function (p) { return p.school; } },
    year: { label: 'School year', get: function (p) { return p.year; } },
    medicalDetail: { label: 'Medical details', get: function (p) { return p.medicalDetail || 'None'; }, sensitive: true },
    supportDetail: { label: 'Support needs', get: function (p) { return p.supportDetail || 'None'; }, sensitive: true },
    emergencyNote: { label: 'Emergency contact', get: function (p) { return p.emergency.map(function (e) { return e.name + ' (' + e.rel + ') ' + e.phone; }).join('; '); }, sensitive: true }
  };
  function age(dob) { var a = K.parse(dob), n = K.parse(K.today), y = n.getFullYear() - a.getFullYear(); if (n.getMonth() < a.getMonth() || (n.getMonth() === a.getMonth() && n.getDate() < a.getDate())) y--; return y; }
  Hub.screens['parent-child'] = function (ctx) {
    var p = db.getPlayer(ctx.param || (kids()[0] || {}).id), ok = p && db.phIsChild(p.id);
    var h = head({ back: ['parent-more', 'More'], eyebrow: 'Child profile', title: ok ? p.name : 'Child profile', sub: ok ? esc(p.ageGroup) + ' · ' + esc(p.school) + ' · ' + esc(p.year) : '',
      actions: ok ? K.actBtn('Update details', 'ph-child-update', { id: p.id }, { variant: 'secondary', icon: 'settings' }) + K.actBtn('Confirm medical details', 'ph-med', { id: p.id }, { variant: 'primary', icon: 'shield' }) : '',
      tabs: ok && kids().length > 1 ? '<div class="ph-bar">' + kids().map(function (c) { return K.goBtn(c.first, 'parent-child/' + c.id, { variant: c.id === p.id ? 'primary' : 'tertiary', size: 'sm' }); }).join('') + '</div>' : '' });
    var g = guard(ctx, h, ['user', 'No child linked', 'Children linked to your family appear here.']); if (g) return g;
    if (!ok) return notMine(h, 'Child');
    var due = db.isMedicalReconfirmDue(p), pend = db.getRequests(function (r) { return r.player === p.id && r.type === 'Detail change' && (r.status === 'Open' || r.status === 'In review'); });
    var top = due ? ui.notice('warn', 'Please confirm ' + p.first + '’s medical details for this term', 'We ask every family at the start of each term so coaches always have the right information.', { action: K.actBtn('Confirm now', 'ph-med', { id: p.id }, { variant: 'primary', size: 'sm' }) }) : '';
    var about = K.card({ title: 'About ' + p.first, body: K.kv([['Date of birth', K.d(p.dob) + ' <span class="text-3">(age ' + age(p.dob) + ')</span>'], ['Age group', esc(p.ageGroup)], ['School', esc(p.school) + ', ' + esc(p.year)], ['Home address', esc(p.address)], ['Joined', K.d(p.joined)], ['Player ID', K.id(p.id)]]) });
    var photo = K.card({ title: 'Photos and video', right: K.status(PHOTO[p.photo] || p.photo), body: '<p class="k-note">May we use photos or video of ' + esc(p.first) + ' on the club website and social media?</p>' + K.kv([['Answer', esc(PHOTO[p.photo] || p.photo)], ['Recorded', p.photoAnswered ? K.stamp('Answered', p.photoAnswered.by, p.photoAnswered.at) : 'Not answered yet']]) +
      '<div class="ph-actions">' + K.actBtn('Yes', 'ph-photo', { id: p.id, val: 'yes' }, { variant: p.photo === 'yes' ? 'primary' : 'secondary', size: 'sm' }) + K.actBtn('No', 'ph-photo', { id: p.id, val: 'no' }, { variant: p.photo === 'no' ? 'primary' : 'secondary', size: 'sm' }) + '</div>' });
    var med = K.card({ title: 'Medical', right: due ? K.pill('Due this term', 'warn') : K.pill('Confirmed this term', 'ok'), body: K.restricted(FAM_ROLES, K.kv([['Medical', esc(MED[p.medical] || p.medical)], ['Details', esc(p.medicalDetail || 'Nothing to tell coaches')], ['Last confirmed', p.medicalConfirmed ? K.stamp('Confirmed', p.medicalConfirmed.by, p.medicalConfirmed.at) : 'Not confirmed']]), 'Medical details') });
    var sup = K.card({ title: 'Support needs', body: K.restricted(FAM_ROLES, K.kv([['Support', esc(p.support === 'details' ? 'Has details' : 'None recorded')], ['Details', esc(p.supportDetail || 'Nothing recorded')]]), 'Support needs') });
    var em = K.card({ title: 'Emergency contacts', body: K.restricted(FAM_ROLES, K.kv(p.emergency.map(function (e, i) { return [(i === 0 ? 'First contact' : 'Second contact'), esc(e.name) + ' · ' + esc(e.rel) + '<br><span class="num">' + esc(e.phone) + '</span>']; })), 'Emergency contacts') });
    var reqs = pend.length ? K.section('Changes waiting for approval', 'The office checks changes before they replace what coaches see.', '<div class="lx-stack">' + pend.map(function (r) {
      var f = FIELDS[r.change.field] || { sensitive: true };
      var vals = K.kv([['Was', esc(r.change.before)], ['Now', esc(r.change.after)]]);
      return K.card({ title: r.change.label, sub: K.stamp('Requested', db.getParent(r.by).name, r.at), right: K.status(r.status), body: (f.sensitive ? K.restricted(FAM_ROLES, vals, 'Old and new values') : vals) + '<div class="ph-actions">' + K.actBtn('Withdraw', 'ph-req-withdraw', { id: r.id }, { variant: 'tertiary', size: 'sm' }) + '</div>' });
    }).join('') + '</div>') : '';
    var mems = db.getPlayerMemberships(p.id), fb = db.getLatestPublishedFeedback(p.id), sum = db.getAttendanceSummary(p.id);
    var links = K.tiles([
      { route: mems[0] ? 'parent-membership/' + mems[0].id : 'parent-memberships', icon: 'calendar', title: 'Membership', value: mems.length ? esc(mems[0].state) : '—', label: mems[0] ? sess(mems[0].session).name : 'none', desc: 'Pause or cancel, notice periods' },
      { route: 'parent-attendance', icon: 'checkCircle', title: 'Attendance', value: sum.pct == null ? '—' : sum.pct + '%', label: 'this term', desc: 'From the coach’s registers' },
      { route: 'parent-development', icon: 'development', title: 'Development', value: fb ? K.dm(fb.publishedAt) : '—', label: fb ? 'latest feedback' : 'no feedback yet', desc: 'Published feedback and ' + K.label('IDPs') }], 3);
    return K.page(h, top + K.grid([about, med, photo, sup, em].filter(Boolean), 2) + reqs + K.section(p.first + ' at the club', null, links), 'ph');
  };
  Hub.actions['ph-photo'] = function (el) {
    var p = db.getPlayer(el.dataset.id), v = el.dataset.val, at = K.now(), who = K.me(), before = PHOTO[p.photo];
    if (p.photo === v) return;
    mutate(function () { db.updatePlayer(p.id, { photo: v, photoAnswered: { by: who, at: at } }); }, 'Photo permission saved: ' + PHOTO[v], 'Photo and video permission for ' + p.name + ' changed', p.id, { before: { photo: before }, after: { photo: PHOTO[v] }, at: at, who: who });
  };
  Hub.actions['ph-med'] = function (el) {
    var p = db.getPlayer(el.dataset.id);
    Hub.openSheet({ overline: '<span class="overline">' + esc(p.name) + '</span>', title: 'Confirm medical details', body: K.restricted(FAM_ROLES, K.kv([['On file', esc(MED[p.medical] || p.medical)], ['Details', esc(p.medicalDetail || 'Nothing to tell coaches')], ['Last confirmed', p.medicalConfirmed ? K.stamp('Confirmed', p.medicalConfirmed.by, p.medicalConfirmed.at) : 'Never']]), 'Medical details') +
      '<p class="k-note">Is this still right for the ' + esc('autumn') + ' term? If anything has changed, send the new details and the office will update them.</p>',
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Something has changed', 'ph-child-update', { id: p.id, field: 'medicalDetail' }, { variant: 'secondary' }) + K.actBtn('Yes, still correct', 'ph-med-go', { id: p.id }, { variant: 'primary' }) });
  };
  Hub.actions['ph-med-go'] = function (el) {
    var p = db.getPlayer(el.dataset.id), at = K.now(), who = K.me(), r;
    mutate(function () { r = db.confirmMedical(p.id, who, at); }, p.first + '’s medical details confirmed', 'Medical details confirmed for ' + p.name + ' (no change)', p.id, { restricted: true, before: { confirmed: p.medicalConfirmed ? K.dt(p.medicalConfirmed.at) : 'Never' }, after: { confirmed: K.dt(at) + ' by ' + who }, at: at, who: who });
  };
  Hub.actions['ph-child-update'] = function (el) {
    var p = db.getPlayer(el.dataset.id), field = el.dataset.field || 'address';
    Hub.openSheet({ overline: '<span class="overline">' + esc(p.name) + '</span>', title: 'Update details', body: '<p class="k-note">Changes are checked by the office before they replace what coaches see. You can follow them in Requests.</p>' +
      K.form([K.field('What has changed?', K.select('ph-field', Object.keys(FIELDS).map(function (k) { return [k, FIELDS[k].label]; }), field)), K.field('New details', K.textarea('ph-new', '', 'Type the new details'), null, true), K.field('Anything else', K.textarea('ph-why', '', 'Optional'), null, true)], 1),
      foot: sheetFoot('Send for approval', 'ph-child-update-go', { id: p.id }) });
  };
  Hub.actions['ph-child-update-go'] = function (el) {
    var p = db.getPlayer(el.dataset.id), f = K.val('ph-field'), nv = K.val('ph-new').trim(), why = K.val('ph-why').trim(), at = K.now(), who = K.me(), F = FIELDS[f];
    if (!nv) { Hub.toast('Add the new details'); return; }
    var before = F.get(p);
    mutate(function () { db.requestDetailChange(p.id, { field: f, label: F.label, before: before, after: nv }, why || F.label + ' updated in the parent hub', who, at); }, F.label + ' sent for approval', F.label + ' change requested for ' + p.name, p.id, { restricted: !!F.sensitive, before: { value: before }, after: { value: nv }, at: at, who: who });
  };

  /* ================================================================ FAMILY */
  Hub.screens['parent-family'] = function (ctx) {
    var f = fam();
    var h = head({ back: ['parent-more', 'More'], title: f ? f.name : 'Family', sub: 'Everyone with access to your children’s details, and the children linked to your family.', actions: K.actBtn('Invite a ' + term().toLowerCase(), 'ph-invite', {}, { variant: 'secondary', icon: 'plus' }) + K.actBtn('Add a child', 'ph-add-child', {}, { variant: 'secondary', icon: 'plus' }) });
    var g = guard(ctx, h, ['family', 'No family linked', 'Your family appears here once you are linked.']); if (g) return g;
    var ps = db.getFamilyParents(f.id).filter(function (x) { return !x.link.ended; }).sort(function (a, b) { return a.priority - b.priority; });
    var rows = ps.map(function (x) {
      var pending = x.link.invite === 'Invite sent', mine = x.id === me().id;
      return ui.row({ lead: ui.avatar(x.name, 'md'), title: esc(x.name) + (mine ? ' <span class="text-3">(you)</span>' : ''), sub: [esc(x.relationship), 'Contact ' + x.priority, esc(x.email)],
        after: pending ? '<div class="ph-row-note">' + K.stamp(x.link.resentBy ? 'Invite resent' : 'Invited', x.link.resentBy || 'Sarah Whitfield', x.link.invitedAt || '2026-09-27T20:40') + '</div>' : x.link.verifiedAt ? '<div class="ph-row-note">' + K.stamp('Access verified', x.link.verifiedBy || 'System', x.link.verifiedAt) + '</div>' : '',
        trail: (pending ? K.status('Pending') + K.actBtn('Resend invite', 'ph-resend', { id: x.id }, { variant: 'secondary', size: 'sm' }) : K.status('Verified')) });
    });
    var children = kids().map(function (c) { return ui.row({ lead: ui.avatar(c.name, 'md'), title: esc(c.name), sub: [esc(c.ageGroup), esc(c.school)], href: '#parent-child/' + c.id, trail: K.status(c.status) }); });
    var reqs = db.getFamilyRequests(f.id).filter(function (r) { return (r.type === 'Second parent invite' || r.type === 'Add a child') && (r.status === 'Open' || r.status === 'In review'); });
    return K.page(h, K.section(term() + 's and guardians', null, K.list(rows) + note('Contact priority is who we call first. It never changes access: every verified ' + term().toLowerCase() + ' sees the same details.')) +
      K.section('Children', null, K.list(children)) +
      (reqs.length ? K.section('Waiting for the office', null, K.list(reqs.map(function (r) { return ui.row({ lead: '<span class="row__icon">' + I('inbox', 'icon-sm') + '</span>', title: esc(r.type), sub: [esc(r.reason), K.dt(r.at)], trail: K.status(r.status) }); }))) : '') +
      K.section('Family history', null, '<div class="lx-card">' + K.timeline(db.getFamilyHistory(f.id)) + '</div>'), 'ph');
  };
  Hub.actions['ph-resend'] = function (el) { var x = db.getParent(el.dataset.id), at = K.now(), who = K.me(); mutate(function () { db.resendInvite(x.id, who, at); }, 'Invite resent to ' + x.email, 'Invite resent to ' + x.name, x.id, { at: at, who: who }); };
  Hub.actions['ph-invite'] = function () {
    Hub.openSheet({ title: 'Invite a ' + term().toLowerCase() + ' or guardian', body: '<p class="k-note">They get the same access as you once they accept and the office confirms the link.</p>' + K.form([K.field('Full name', K.input('ph-inv-name', '')), K.field('Email', K.input('ph-inv-email', '', { type: 'email' })), K.field('Relationship', K.select('ph-inv-rel', ['Father', 'Mother', 'Step-parent', 'Grandparent (guardian)', 'Other guardian'], 'Grandparent (guardian)'), null, true)]),
      foot: sheetFoot('Send invite', 'ph-invite-go') });
  };
  Hub.actions['ph-invite-go'] = function () {
    var n = K.val('ph-inv-name').trim(), e = K.val('ph-inv-email').trim(), rel = K.val('ph-inv-rel'), at = K.now(), who = K.me();
    if (!n || e.indexOf('@') < 1) { Hub.toast('Add a name and email'); return; }
    var x; mutate(function () { x = db.inviteFamilyParent({ name: n, email: e, relationship: rel }, who, at); }, 'Invite sent to ' + e, 'Invited ' + n + ' (' + rel + ') to the ' + fam().name, fam().id, { at: at, who: who });
  };
  Hub.actions['ph-add-child'] = function () {
    Hub.openSheet({ title: 'Add a child', body: '<p class="k-note">The office checks the details and links them to your family. Nothing is shared until then.</p>' + K.form([K.field('First name', K.input('ph-ch-first', '')), K.field('Last name', K.input('ph-ch-last', 'Whitfield')), K.field('Date of birth', K.input('ph-ch-dob', '2020-06-01', { type: 'date' })), K.field('School', K.input('ph-ch-school', 'Westbrook Primary')), K.field('Anything we should know', K.textarea('ph-ch-note', '', 'Optional'), null, true)]),
      foot: sheetFoot('Send to the office', 'ph-add-child-go') });
  };
  Hub.actions['ph-add-child-go'] = function () {
    var c = { first: K.val('ph-ch-first').trim(), last: K.val('ph-ch-last').trim(), dob: K.val('ph-ch-dob'), school: K.val('ph-ch-school').trim(), note: K.val('ph-ch-note').trim() }, at = K.now(), who = K.me();
    if (!c.first || !c.last || !c.dob) { Hub.toast('Add a name and date of birth'); return; }
    mutate(function () { db.requestNewChild(c, who, at); }, c.first + ' sent to the office to link', 'Asked to add ' + c.first + ' ' + c.last + ' to the family', fam().id, { at: at, who: who });
  };

  /* ================================================================ DEVELOPMENT */
  function ratingPill(id) { var l = db.getColourLabel(id); return l ? '<span class="ph-rate" style="--c:' + esc(l.color) + '">' + esc(l.label) + '</span>' : ''; }
  Hub.screens['parent-development'] = function (ctx) {
    var h = head({ title: term() === 'Parent' ? 'Development' : 'Progress', sub: 'Feedback and ' + esc(K.label('IDPs')) + ' your coaches have shared with you. Nothing appears here until the club publishes it.' });
    var g = guard(ctx, h, ['development', 'Nothing shared yet', 'Feedback and plans appear once the club publishes them.']); if (g) return g;
    if (!K.feature('development')) return K.page(h, K.featureOff('development'), 'ph');
    var pid = childPick('ph-dev-child'), p = db.getPlayer(pid);
    var fbs = db.getFeedback(pid, { publishedOnly: true }).filter(db.isFeedbackVisibleToParents), plans = db.getSharedIdps(pid);
    var groups = db.getFrameworkGroups('parent');
    var latest = fbs[0];
    var lead = latest ? '<article class="lx-surface lx-feedback">' + '<div class="reading__by">' + ui.avatar(db.coachName(latest.coach), 'md') + '<div><b>' + esc(db.coachName(latest.coach)) + '</b><small>' + esc(latest.period) + ' · published ' + esc(K.d(latest.publishedAt)) + '</small></div></div>' +
      '<div class="reading__cols"><div><span class="overline">Keep doing</span><p>' + esc(latest.keepDoing) + '</p></div><div><span class="overline">Focus next</span><p>' + esc(latest.focus) + '</p></div></div>' +
      (latest.general ? '<p class="ph-general">' + esc(latest.general) + '</p>' : '') +
      (groups.some(function (gr) { return gr.rating && latest.ratings[gr.id]; }) ? '<div class="ph-rates">' + groups.filter(function (gr) { return gr.rating && latest.ratings[gr.id]; }).map(function (gr) { return '<span><small>' + esc(gr.name) + '</small>' + ratingPill(latest.ratings[gr.id]) + '</span>'; }).join('') + '</div>' : '') +
      '<div class="ph-row-note">' + K.stamp('Published', latest.publishedBy, latest.publishedAt) + '</div></article>' : emptyBox('star', 'No feedback published yet', 'When the club publishes feedback for ' + p.first + ', it will appear here.');
    var earlier = fbs.slice(1).map(function (f) { return K.card({ title: f.period, sub: K.stamp('Published', f.publishedBy, f.publishedAt), body: K.kv([['Keep doing', esc(f.keepDoing)], ['Focus next', esc(f.focus)]]) }); }).join('');
    var plansHtml = plans.length ? '<div class="lx-stack">' + plans.map(function (i) {
      var per = db.getReviewPeriod(i.period);
      return K.card({ title: (per ? per.name : i.period) + ' ' + K.label('IDP'), sub: i.sharedAt ? K.stamp('Shared', i.sharedBy, i.sharedAt) : K.stamp('Reviewed', i.updatedBy, i.updatedAt), right: K.status(i.status === 'Reviewed' ? 'Completed' : 'Current'),
        body: '<ol class="ph-targets">' + i.targets.map(function (t) { var gr = db.getFrameworkGroup(t.group); return '<li><span><b>' + esc(t.text) + '</b><small>' + esc(gr ? gr.name : '') + '</small></span>' + K.status(t.status) + '</li>'; }).join('') + '</ol>' + (i.reviewNote ? note(esc(i.reviewNote)) : '') });
    }).join('') + '</div>' : emptyBox('development', 'No ' + K.label('IDP') + ' shared yet', 'Your coach shares ' + p.first + '’s ' + K.label('IDP') + ' once it has been agreed.');
    return K.page(h, '<div class="ph-bar">' + childSeg('ph-dev-child') + '</div>' + K.section('Latest feedback', null, lead) + (earlier ? K.section('Earlier feedback', null, '<div class="lx-stack">' + earlier + '</div>') : '') + K.section(K.label('IDPs'), 'Targets your coach is working on with ' + esc(p.first) + '.', plansHtml), 'ph');
  };

  /* ================================================================ REQUESTS */
  Hub.screens['parent-requests'] = function (ctx) {
    var h = head({ back: ['parent-more', 'More'], title: 'Requests', sub: 'What you have asked the office for, and where each request is.' });
    var g = guard(ctx, h, ['inbox', 'No requests yet', 'Pauses, cancellations and detail changes you send appear here.']); if (g) return g;
    var list = db.getFamilyRequests(fam().id);
    var rows = list.map(function (r) {
      var open = r.status === 'Open' || r.status === 'In review', p = r.player ? db.getPlayer(r.player) : null;
      return K.card({ title: r.type + (p ? ' · ' + p.first : ''), sub: K.stamp('Sent', db.getParent(r.by).name, r.at), right: K.status(r.status),
        body: K.kv([['Request', r.change ? esc(r.change.label) + (/(medical|support|emergency)/i.test(r.change.field) ? ' <span class="text-3">(details restricted)</span>' : ': ' + esc(r.change.after)) : esc(r.reason)], r.membership ? ['Membership', K.link('parent-membership/' + r.membership, sess(r.session).name)] : r.session ? ['Session', esc(sess(r.session).name)] : null,
          r.effective ? [r.type === 'Pause' ? 'From' : 'Takes effect', K.d(r.effective) + (r.pauseTo ? ' to ' + K.d(r.pauseTo) : '')] : null, ['Stage', esc(r.stage)],
          r.resolution ? ['Outcome', K.status(r.resolution.outcome) + ' ' + esc(r.resolution.note || '') + '<br>' + K.stamp(r.resolution.outcome, r.resolution.by, r.resolution.at)] : null].filter(Boolean)) +
          (open ? '<div class="ph-actions">' + K.actBtn('Withdraw', 'ph-req-withdraw', { id: r.id }, { variant: 'tertiary', size: 'sm' }) + '</div>' : '') });
    });
    var start = K.tiles([{ route: 'parent-memberships', icon: 'calendar', title: 'Pause or cancel', desc: 'From the membership' }, { route: 'parent-child/' + (kids()[0] || {}).id, icon: 'user', title: 'Update child details', desc: 'Address, school, medical, contacts' }, { route: 'parent-browse', icon: 'plus', title: 'Ask for a weekly place', desc: 'From Book camps and events' }], 3);
    return K.page(h, (K.feature('sessionRequests') ? '' : K.featureOff('sessionRequests')) + K.section('Start a request', null, start) + K.section('Your requests', list.length + ' in total', list.length ? '<div class="lx-stack">' + rows.join('') + '</div>' : emptyBox('inbox', 'No requests yet', 'Requests you send appear here.')), 'ph');
  };

  /* ================================================================ POLICIES */
  Hub.screens['parent-policies'] = function (ctx) {
    var h = head({ back: ['parent-more', 'More'], title: 'Terms & policies', sub: 'The versions you have accepted, and how refunds work.' });
    var g = guard(ctx, h, ['shield', 'No policies', 'Terms and policies appear here.']); if (g) return g;
    var pid = me().id, all = db.getTermsVersions(), current = all.filter(function (t) { return !t.to; });
    var famParents = db.getFamilyParents(fam().id).filter(function (x) { return !x.link.ended; });
    var cards = current.map(function (t) {
      return K.card({ title: t.kind, sub: 'Version ' + esc(t.version) + ' · from ' + K.d(t.from), right: K.status('Current'), body: '<p class="k-note">' + esc(t.summary) + '.</p>' +
        K.kv(famParents.map(function (x) { var a = db.getTermsAcceptances(function (y) { return y.parent === x.id && y.version === t.id; }).sort(function (q, r) { return q.at < r.at ? 1 : -1; })[0]; return [x.name, a ? K.status('Accepted') + ' ' + K.stamp('Accepted', x.name, a.at) + '<br><span class="text-3">' + esc(a.evidence) + '</span>' : K.status('Pending') + ' <span class="text-3">' + (x.link.invite === 'Invite sent' ? 'Accepts when they first sign in' : 'Not yet accepted') + '</span>']; })) });
    });
    var hist = K.table({ cols: 'minmax(0,1.3fr) 80px minmax(0,1fr) minmax(0,1.6fr) 120px', head: ['Document', 'Version', { label: 'In force', cls: 'wide' }, { label: 'What changed', cls: 'wide' }, 'You'],
      rows: all.map(function (t) { var a = db.getTermsAcceptances(function (y) { return y.parent === pid && y.version === t.id; })[0]; return { cells: [K.cell(esc(t.kind), K.stamp('Published', t.by, t.at)), { html: 'v' + esc(t.version) }, { cls: 'wide c-cell', html: K.dm(t.from) + ' ' + t.from.slice(0, 4) + ' – ' + (t.to ? K.dm(t.to) + ' ' + t.to.slice(0, 4) : 'now') }, { cls: 'wide c-cell', html: esc(t.summary) }, { html: a ? K.status('Accepted') : t.to ? '<span class="text-3">Replaced</span>' : K.status('Pending') }] }; }) });
    var pols = db.getRefundPolicies().filter(function (p) { return p.noticeHours > 0; }).map(function (p) { return K.card({ title: p.name, sub: esc(p.appliesTo), body: K.kv([['Outside the window', esc(p.outside)], ['Inside the window', esc(p.inside)], ['Set', K.stamp('Set', p.by, p.at)]]) }); });
    return K.page(h, K.grid(cards, 2) + K.section('Version history', null, hist) + K.section('Refund policies', 'Applied automatically to each booking line and membership.', K.grid(pols, 3)), 'ph');
  };

  /* ================================================================ RESOURCES, NOTICES, OFFERS */
  Hub.screens['parent-resources'] = function (ctx) {
    var h = head({ back: ['parent-more', 'More'], title: 'Resources', sub: 'Guides and videos from the coaches for families.' });
    var g = guard(ctx, h, ['book', 'No resources yet', 'Guides and videos for families appear here.']); if (g) return g;
    var list = db.getResources('parent');
    var cards = list.map(function (r) { var read = db.isResourceRead(r.id); return '<article class="lx-card ph-res"><div class="ph-product__top"><span class="lx-area__icon">' + I(r.type === 'Video' ? 'star' : r.type === 'PDF' ? 'download' : 'book') + '</span>' + K.pill(r.type, 'info') + (read ? K.pill('Read', 'ok') : '') + '</div><h3>' + esc(r.title) + '</h3><p class="k-note">' + esc(r.topic) + '</p><div class="ph-row-note">' + K.stamp('Updated', r.updatedBy, r.updatedAt) + '</div><div class="ph-actions">' + K.actBtn(read ? 'Open again' : 'Open', 'ph-res', { id: r.id }, { variant: 'secondary', size: 'sm' }) + '</div></article>'; });
    return K.page(h, cards.length ? K.grid(cards, 3) : emptyBox('book', 'No resources yet', 'Guides and videos for families appear here.'), 'ph');
  };
  Hub.actions['ph-res'] = function (el) {
    var r = db.getResource(el.dataset.id), at = K.now(), who = K.me();
    mutate(function () { db.markResourceRead(r.id, who, at); }, 'Opened: ' + r.title, 'Opened resource ' + r.title, r.id, { at: at, who: who });
  };
  Hub.screens['parent-notices'] = function (ctx) {
    var h = head({ back: ['parent-more', 'More'], title: 'Notices', sub: 'Messages from the club about your children’s sessions.' });
    var g = guard(ctx, h, ['megaphone', 'No notices', 'Messages from the club appear here.']); if (g) return g;
    if (!K.feature('communications')) return K.page(h, K.featureOff('communications') + note('Urgent changes, such as a cancelled session, still reach you by email and show in Sessions and Notifications.'), 'ph');
    var sids = db.phMemberships().map(function (m) { return m.session; });
    var list = db.getNotices('Parents').filter(function (n) { return n.status === 'Sent' && (!n.sessions.length || n.sessions.some(function (s) { return sids.indexOf(s) >= 0; })); });
    return K.page(h, list.length ? '<div class="lx-stack">' + list.map(function (n) { return K.card({ title: n.title, sub: K.stamp('Sent', n.by, n.at), body: '<p class="ph-body">' + esc(n.body) + '</p>' + (n.sessions.length ? '<p class="k-note">For ' + esc(n.sessions.map(function (s) { return sess(s).name; }).join(', ')) + '</p>' : '') }); }).join('') + '</div>' : emptyBox('megaphone', 'No notices', 'Messages from the club appear here.'), 'ph');
  };
  Hub.screens['parent-offers'] = function (ctx) {
    var h = head({ back: ['parent-more', 'More'], title: 'Offers & discounts', sub: 'What the club runs, the prices, and the discounts your family can use.', actions: K.goBtn('Book camps and events', 'parent-browse', { variant: 'primary' }) });
    var g = guard(ctx, h, ['star', 'No offers right now', 'Offers appear here when the club publishes them.']); if (g) return g;
    var offers = db.getOfferContent(true).map(function (o) {
      var member = kids().filter(function (c) { return db.getPlayerMemberships(c.id).some(function (m) { return sess(m.session).name === o.title && m.state !== 'Ended'; }); });
      return '<article class="lx-card ph-res"><div class="ph-product__top"><span class="lx-area__icon">' + I('calendar') + '</span>' + K.pill(o.group, 'info') + (member.length ? K.pill(names(member) + ' · member', 'ok') : '') + '</div><h3>' + esc(o.title) + '</h3><p class="k-note">' + esc(o.when) + ' · ' + esc(o.venue) + '</p><b class="num ph-price">' + K.money(o.price) + ' ' + esc(o.unit) + '</b></article>';
    });
    var rules = db.getDiscountRules().filter(function (r) { return r.active && r.type !== 'Manual'; });
    var disc = K.card({ title: 'Discounts', sub: K.feature('discounts') ? 'Applied for you at checkout. Discounts do not stack: each place gets its best one.' : 'Discounts are switched off for now.', body: K.kv(rules.map(function (r) { return [r.name, esc(r.appliesTo) + '<br><span class="text-3">' + esc(r.condition) + ' · from ' + K.d(r.from) + '</span>']; })) });
    var pk = K.card({ title: 'Package prices', body: K.kv(db.getPackageGroups().filter(function (g2) { return g2.tiers.some(function (t) { return t.price > 0; }); }).map(function (g2) { return [g2.name, g2.tiers.map(function (t) { return esc(t.name) + ' ' + K.money(t.price); }).join(' · ') + '<br><span class="text-3">' + esc(g2.appliesTo) + '</span>']; })) });
    return K.page(h, K.section('Weekly groups', null, K.grid(offers, 3)) + K.grid([disc, pk], 2), 'ph');
  };

  /* ================================================================ MORE */
  Hub.screens['parent-more'] = function (ctx) {
    var h = head({ title: 'More', sub: 'Everything in your ' + esc(hubName().toLowerCase()) + '.' });
    var g = guard(ctx, h, ['grid', 'Nothing here', 'Links to every part of your hub appear here.']); if (g) return g;
    var f = fam(), S = db.getFamilyBillingSummary(f.id), open = db.getFamilyRequests(f.id).filter(function (r) { return r.status === 'Open' || r.status === 'In review'; }).length, unread = db.getUnreadCount('parent');
    var childTiles = kids().map(function (c) { return { route: 'parent-child/' + c.id, icon: 'user', title: c.first, desc: 'Profile and medical' }; });
    return K.page(h,
      K.section('Your family', null, K.tiles(childTiles.concat([{ route: 'parent-family', icon: 'family', title: 'Family', value: db.getFamilyParents(f.id).filter(function (x) { return x.link.invite === 'Invite sent' && !x.link.ended; }).length, label: 'invite pending', desc: 'Guardians and invites' }, { route: 'parent-requests', icon: 'inbox', title: 'Requests', value: open, label: 'open', desc: 'Pauses, cancellations and changes' }]), 4)) +
      K.section('Sessions and booking', null, K.tiles([{ route: 'parent-sessions', icon: 'calendar', title: 'Sessions', desc: 'Upcoming, changes and past' }, { route: 'parent-attendance', icon: 'checkCircle', title: 'Attendance', desc: 'From the coach’s registers' }, { route: 'parent-browse', icon: 'plus', title: 'Book camps and events', desc: 'Half-term camp, festival, tour' }, { route: 'parent-offers', icon: 'star', title: 'Offers & discounts', desc: 'Prices and discounts' }], 4)) +
      K.section('Money', null, K.tiles([{ route: 'parent-billing', icon: 'card', title: 'Billing & payments', value: K.money(S.credit), label: 'credit', desc: 'Payments, credit, refunds, statement' }, { route: 'parent-memberships', icon: 'calendar', title: 'Memberships', value: db.phMemberships().filter(function (m) { return m.state !== 'Ended'; }).length, label: 'running', desc: 'Pause or cancel' }, { route: 'parent-basket', icon: 'card', title: 'Basket', value: db.getBasket().length, label: 'places', desc: 'Not booked until you pay' }, { route: 'parent-policies', icon: 'shield', title: 'Terms & policies', desc: 'Accepted versions and refunds' }], 4)) +
      K.section('Development and news', null, K.tiles([{ route: 'parent-development', icon: 'development', title: term() === 'Parent' ? 'Development' : 'Progress', desc: 'Published feedback and ' + K.label('IDPs') }, { route: 'parent-resources', icon: 'book', title: 'Resources', desc: 'Guides and videos' }, { route: 'parent-notices', icon: 'megaphone', title: 'Notices', desc: K.feature('communications') ? 'Messages from the club' : 'Switched off for now' }, { route: 'parent-notifications', icon: 'bell', title: 'Notifications', value: unread, label: 'unread', desc: 'Updates for your family' }], 4)) +
      K.section('Account', null, K.tiles([{ route: 'parent-profile', icon: 'user', title: 'Profile', desc: 'Contact, password, alerts' }], 4)), 'ph');
  };

  /* ================================================================ PROFILE, NOTIFICATIONS */
  Hub.screens['parent-profile'] = function (ctx) {
    var P = me();
    var h = head({ back: ['parent-more', 'More'], title: 'Profile', sub: esc(P.name) + ' · ' + esc(P.relationship) + ' · ' + esc(fam().name) });
    var g = guard(ctx, h, ['user', 'Profile not available', 'Your profile appears here.']); if (g) return g;
    var sec = db.getParentSecurity(), up = db.getParentPrefsUpdated();
    var contact = K.card({ title: 'Contact details', body: K.form([K.field('Name', K.input('ph-p-name', P.name, { readonly: true }), 'Ask the office to change your name.'), K.field('Sign-in email', K.input('ph-p-email', P.email, { readonly: true }), 'Used to sign in; the office can change it.'), K.field('Mobile', K.input('ph-p-phone', P.phone)), K.field('Contact priority', K.input('ph-p-pri', 'Contact ' + P.priority, { readonly: true }), 'Ask the office to change it.')]) + '<div class="ph-actions">' + K.actBtn('Save mobile number', 'ph-profile-save', {}, { variant: 'primary', size: 'sm' }) + '</div>' });
    var security = K.card({ title: 'Sign-in and security', body: K.kv([['Password', 'Last changed ' + K.dt(sec.passwordChangedAt)], ['Access', K.status('Verified') + ' ' + (P.link.verifiedAt ? K.stamp('Verified', 'System', P.link.verifiedAt) : '')]]) + '<div class="ph-actions">' + K.actBtn('Change password', 'ph-password', {}, { variant: 'secondary', size: 'sm' }) + K.actBtn('Sign out', 'ph-signout', {}, { variant: 'tertiary', size: 'sm' }) + '</div>' });
    var prefs = K.card({ title: 'Notification choices', sub: K.stamp('Updated', up.by, up.at), body: '<div class="ph-prefs">' + db.getParentPrefs().map(function (p) { return '<div class="ph-pref"><span><b>' + esc(p.label) + '</b>' + (p.locked ? '<small>Always sent by email: you cannot turn this off</small>' : '') + '</span>' + K.toggle(p.email, 'ph-pref', { id: p.id, ch: 'email' }, 'Email') + K.toggle(p.push, 'ph-pref', { id: p.id, ch: 'push' }, 'Push') + '</div>'; }).join('') + '</div>' });
    return K.page(h, K.grid([contact, security], 2) + prefs, 'ph');
  };
  Hub.actions['ph-profile-save'] = function () {
    var P = me(), v = K.val('ph-p-phone').trim(), at = K.now(), who = K.me();
    if (!/^[0-9 +]{10,}$/.test(v)) { Hub.toast('Check the mobile number'); return; }
    if (v === P.phone) { Hub.toast('No change to save'); return; }
    var r; mutate(function () { r = db.updateParentContact(P.id, { phone: v }); }, 'Mobile number saved', 'Mobile number changed for ' + P.name, P.id, { restricted: true, before: { phone: P.phone }, after: { phone: v }, at: at, who: who });
  };
  Hub.actions['ph-password'] = function () {
    Hub.openSheet({ title: 'Change password', body: K.form([K.field('Current password', K.input('ph-pw-old', '', { type: 'password' })), K.field('New password', K.input('ph-pw-new', '', { type: 'password' }), 'At least 10 characters.')], 1), foot: sheetFoot('Change password', 'ph-password-go') });
  };
  Hub.actions['ph-password-go'] = function () {
    var a = K.val('ph-pw-old'), b = K.val('ph-pw-new'), at = K.now(), who = K.me();
    if (!a || b.length < 10) { Hub.toast('Enter your current password and a new one of 10+ characters'); return; }
    mutate(function () { db.changeParentPassword(at); }, 'Password changed', 'Password changed', me().id, { at: at, who: who });
  };
  Hub.actions['ph-signout'] = function () { Hub.toast('Signed out'); location.hash = 'pub-signin'; };
  Hub.actions['ph-pref'] = function (el) {
    var p = db.getParentPrefs().filter(function (x) { return x.id === el.dataset.id; })[0], ch = el.dataset.ch, at = K.now(), who = K.me();
    if (p.locked) { Hub.toast('Session changes are always sent by email'); return; }
    mutate(function () { db.setParentPref(p.id, ch, who, at); }, p.label + ' · ' + ch + (p[ch] ? ' off' : ' on'), 'Notification choice changed: ' + p.label + ' (' + ch + ')', me().id, { before: { on: p[ch] }, after: { on: !p[ch] }, at: at, who: who });
  };
  Hub.screens['parent-notifications'] = function (ctx) {
    var unread = db.getUnreadCount('parent');
    var h = head({ back: ['parent-more', 'More'], title: 'Notifications', sub: unread ? unread + ' unread' : 'All read', actions: unread ? K.actBtn('Mark all read', 'ph-ntf-all', {}, { variant: 'secondary', size: 'sm' }) : K.goBtn('Notification choices', 'parent-profile', { variant: 'tertiary', size: 'sm' }) });
    var g = guard(ctx, h, ['bell', 'No notifications', 'Updates about your family appear here.']); if (g) return g;
    var list = db.getNotifications('parent');
    return K.page(h, list.length ? K.list(list.map(function (n) {
      return ui.row({ lead: '<span class="row__icon' + (n.read ? '' : ' ph-unread') + '">' + I('bell', 'icon-sm') + '</span>', title: (n.read ? '' : '<b>') + esc(n.title) + (n.read ? '' : '</b>'), sub: [esc(n.body), K.dt(n.at), n.read && n.readAt ? 'Read ' + K.dt(n.readAt) : ''], action: 'ph-ntf', data: { id: n.id }, trail: n.read ? '' : K.pill('New', 'info') });
    })) : emptyBox('bell', 'No notifications', 'Updates about your family appear here.'), 'ph');
  };
  Hub.actions['ph-ntf'] = function (el) {
    var n = db.getNotifications('parent').filter(function (x) { return x.id === el.dataset.id; })[0], at = K.now();
    if (!n.read) { db.markNotificationRead(n.id, true, at); K.log({ area: AREA, summary: 'Notification read: ' + n.title, entity: n.id, at: at }); }
    location.hash = n.route && n.route.indexOf('parent-') === 0 ? n.route : 'parent-home';
  };
  Hub.actions['ph-ntf-all'] = function () { var at = K.now(); mutate(function () { db.markAllNotificationsRead('parent', at); }, 'All notifications marked read', 'All notifications marked read', me().id, { at: at }); };
})();
