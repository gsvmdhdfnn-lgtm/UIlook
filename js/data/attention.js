/* Needs Attention: one engine for every surface (Needs Attention, Home, area cards, the dated
   session's banners). Issues are computed from live data on each read, so fixing the source clears
   them. Each issue is its own rule with its own state, history and resolution; grouping by date or
   coach happens only when they are shown.
   Every issue answers: what is wrong (title), why it matters (why), what to do (actionLabel, route).
   Urgent means something is about to go wrong. "Leave as it is" is a deliberate exception with a
   reason, a scope, who and when; it reopens itself when a new material fact appears. */
(function () {
  var D = Hub.data, K = Hub.kit, db = Hub.db;
  var NOW = '2026-10-01T14:10', TODAY = '2026-10-01';
  var RANK = { Normal: 1, Warning: 2, Urgent: 3 };
  function maxSev(a, b) { return RANK[a] >= RANK[b] ? a : b; }
  function hoursUntil(date, time) { return (K.parse(date + 'T' + (time || '00:00')) - K.parse(NOW)) / 36e5; }
  function inText(h) { if (h < 0) { var d = Math.round(-h / 24); return d >= 1 ? d + ' day' + (d > 1 ? 's' : '') + ' ago' : Math.round(-h) + ' h ago'; } if (h < 24) { var hh = Math.floor(h), m = Math.round((h - hh) * 60); return 'Starts in ' + hh + ' h' + (m ? ' ' + m + ' m' : ''); } var dd = Math.round(h / 24); return 'In ' + dd + ' day' + (dd > 1 ? 's' : ''); }
  /* The coach payment for a month's work is made on the 7th of the next month */
  function payRunFor(date) { var y = +date.slice(0, 4), m = +date.slice(5, 7) + 1; if (m > 12) { m = 1; y++; } return y + '-' + String(m).padStart(2, '0') + '-07'; }

  /* Rules. Staffing and venue rules share one model: Urgent within 24 hours (or the day), Warning within
     7 days. horizon: how far ahead an issue joins the queue (the date's own page always shows it). */
  D.attentionRules = [
    { id: 'ATT-013', name: 'Session has no coach', category: 'Staffing & Cover', enabled: true, base: 'Normal', warnHours: 168, urgentHours: 24, locked: null, horizon: 336 },
    { id: 'ATT-014', name: 'Coach can’t coach, no cover yet', category: 'Staffing & Cover', enabled: true, base: 'Normal', warnHours: 168, urgentHours: 24, locked: null, horizon: 336 },
    { id: 'ATT-041', name: 'Cover', category: 'Staffing & Cover', enabled: true, base: 'Normal', warnHours: 168, urgentHours: 24, locked: null, horizon: null },
    { id: 'ATT-003', name: 'No Lead Coach', category: 'Staffing & Cover', enabled: true, base: 'Normal', warnHours: 168, urgentHours: 24, locked: null, horizon: 336 },
    { id: 'ATT-002', name: 'Learning Coach only', category: 'Staffing & Cover', enabled: true, base: 'Normal', warnHours: 168, urgentHours: 24, locked: null, horizon: 336 },
    { id: 'ATT-031', name: 'Coach on a date without valid documents', category: 'Coaches & Compliance', enabled: true, base: 'Warning', warnHours: null, urgentHours: 24, locked: null, horizon: 168 },
    { id: 'ATT-042', name: 'Document to check', category: 'Coaches & Compliance', enabled: true, base: 'Normal', warnHours: null, urgentHours: null, locked: null },
    { id: 'ATT-011', name: 'Document expiring, expired or missing', category: 'Coaches & Compliance', enabled: true, base: 'Normal', warnHours: 720, urgentHours: 168, locked: null },
    { id: 'ATT-032', name: 'Coach has no pay rate for a date', category: 'Coaches & Compliance', enabled: true, base: 'Normal', warnHours: 168, urgentHours: null, locked: null, horizon: 336 },
    { id: 'ATT-046', name: 'Coach sign-up to approve', category: 'Coaches & Compliance', enabled: true, base: 'Normal', warnHours: null, urgentHours: null, locked: null },
    { id: 'ATT-045', name: 'Work summary to read or query to answer', category: 'Coaches & Compliance', enabled: true, base: 'Normal', warnHours: 168, urgentHours: 48, locked: null },
    { id: 'ATT-019', name: 'Venue closed', category: 'Sessions & Venues', enabled: true, base: 'Normal', warnHours: 336, urgentHours: 72, locked: null, horizon: 672 },
    { id: 'ATT-018', name: 'Session has no venue', category: 'Sessions & Venues', enabled: true, base: 'Normal', warnHours: 168, urgentHours: 24, locked: null, horizon: 336 },
    { id: 'ATT-016', name: 'Draft session to finish setting up', category: 'Sessions & Venues', enabled: true, base: 'Normal', warnHours: 168, urgentHours: 48, locked: null, horizon: 336 },
    { id: 'ATT-017', name: 'Session missing its commercial setup', category: 'Sessions & Venues', enabled: true, base: 'Normal', warnHours: null, urgentHours: null, locked: null },
    { id: 'ATT-022', name: 'Session to confirm', category: 'Sessions & Venues', enabled: true, base: 'Normal', warnHours: null, urgentHours: 48, locked: null },
    { id: 'ATT-020', name: 'Register to finish', category: 'Sessions & Venues', enabled: true, base: 'Normal', warnHours: null, urgentHours: null, locked: null },
    { id: 'ATT-024', name: 'Outcome to decide for a changed session', category: 'Sessions & Venues', enabled: true, base: 'Warning', warnHours: null, urgentHours: null, locked: null },
    { id: 'ATT-050', name: 'Medical details not confirmed', category: 'Players & Parents', enabled: true, base: 'Warning', warnHours: null, urgentHours: 24, locked: null },
    { id: 'ATT-053', name: 'Session request to decide', category: 'Players & Parents', enabled: true, base: 'Normal', warnHours: null, urgentHours: null, locked: null },
    { id: 'ATT-052', name: 'Parent claim to check', category: 'Players & Parents', enabled: true, base: 'Normal', warnHours: null, urgentHours: null, locked: null },
    { id: 'ATT-054', name: 'Cancellation to decide', category: 'Players & Parents', enabled: true, base: 'Normal', warnHours: null, urgentHours: null, locked: null },
    { id: 'ATT-056', name: 'Family review due', category: 'Players & Parents', enabled: true, base: 'Normal', warnHours: null, urgentHours: null, locked: null },
    { id: 'ATT-070', name: 'Feedback to review', category: 'Development', enabled: true, base: 'Normal', warnHours: null, urgentHours: null, locked: null },
    { id: 'ATT-071', name: 'Development plans not started', category: 'Development', enabled: true, base: 'Normal', warnHours: null, urgentHours: null, locked: null },
    { id: 'ATT-060', name: 'Invoice overdue', category: 'Finance', enabled: true, base: 'Warning', warnHours: null, urgentHours: null, locked: null, urgentDaysOverdue: 30 },
    { id: 'ATT-061', name: 'Invoice not sent to the accounting system', category: 'Finance', enabled: true, base: 'Normal', warnHours: null, urgentHours: null, locked: null },
    { id: 'ATT-062', name: 'Month not invoiced', category: 'Finance', enabled: true, base: 'Normal', warnHours: null, urgentHours: null, locked: null }
  ];
  D.attentionExceptions = [];
  function rule(id) { return D.attentionRules.filter(function (r) { return r.id === id; })[0]; }
  /* How soon, in plain words */
  function sev(r, h) {
    var s = r.base, why = '';
    if (h != null && r.warnHours != null && h <= r.warnHours && RANK.Warning > RANK[s]) { s = 'Warning'; why = h < 24 ? 'Within a day' : 'Within ' + Math.ceil(h / 24) + ' days'; }
    if (h != null && r.urgentHours != null && h <= r.urgentHours) { s = 'Urgent'; why = h <= 0 ? 'Now' : h < 24 ? 'Within ' + Math.max(1, Math.ceil(h)) + ' hours' : 'Within ' + Math.ceil(h / 24) + ' days'; }
    if (r.locked && RANK[r.locked] > RANK[s]) s = r.locked;
    return [s, why];
  }
  function first(n) { return String(n || '').split(' ')[0]; }
  function dayLabel(o) { var d = K.daysBetween(TODAY, o.date); return (d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : K.dd(o.date)) + ', ' + o.start; }
  function occLabel(o) { return K.dd(o.date) + ', ' + o.start + ' · ' + db.venueName(o.venue); }
  function dateGroup(o) { return { key: 'date:' + o.id, kind: 'date', title: o.session, sub: dayLabel(o) + ' · ' + db.venueName(o.venue), route: 'mgmt-occurrence/' + o.id }; }
  function coachGroup(c) { return { key: 'coach:' + c, kind: 'coach', title: db.coachName(c), sub: 'Coach', route: 'mgmt-coach/' + c }; }
  function make(rid, key, o) {
    var r = rule(rid); if (!r || !r.enabled) return null;
    var sv = sev(r, o.hours);
    if (o.forceSev) sv = [maxSev(o.forceSev, sv[0]), o.forceWhy || sv[1]];
    return Object.assign({ caseKey: key, ruleId: r.id, ruleName: r.name, category: r.category, severity: sv[0], severityReason: sv[1], when: o.hours != null ? inText(o.hours) : (o.whenText || ''), due: o.hours != null ? o.hours : 9999, group: { key: key }, fact: o.title }, o);
  }

  /* ---------- One dated session: every issue it has, whatever the horizon ----------
     Before it starts: readiness. Once it starts: what happened, the register and confirmation. */
  function dateIssues(o) {
    var out = [], push = function (c) { if (c) out.push(c); };
    if (!o || o.draft || o.delivery && db.getRegister(o.id).state === 'Completed') return out;
    var h = hoursUntil(o.date, o.start), g = dateGroup(o), occ = { occurrence: o.id };
    if (o.status === 'Scheduled' && !db.hasStarted(o)) {
      var live = db.coverNeedsFor ? db.coverNeedsFor(o.id) : [];
      var hasNeed = function (absent) { return live.some(function (x) { return x.need.absent === absent; }); };
      var away = function (s) { return (s.unavailable && !s.covering) || (!s.unavailable && !s.cover && db.awayFrom && db.awayFrom(s.coach, o)); };
      var on = o.staff.filter(function (s) { return !s.unavailable && !away(s); });
      var onFact = on.map(function (s) { return s.coach + ':' + (s.actualRole || s.role); }).sort().join(',');
      if (!o.staff.length && !hasNeed(null)) push(make('ATT-013', 'session_no_coach|occurrence:' + o.id, { hours: h, title: o.session + ' has no coach', why: 'A session can’t run without a coach.', detail: occLabel(o) + ' · ' + o.players + ' players',
        actionLabel: 'Find cover', route: 'mgmt-occurrence/' + o.id, related: occ, group: g, chain: 'staff:' + o.id + '|null', fact: 'nocoach' }));
      o.staff.forEach(function (s) {
        if (away(s) && !hasNeed(s.coach)) push(make('ATT-014', 'assigned_coach_unavailable|occurrence:' + o.id + '|coach:' + s.coach, { hours: h, title: db.coachName(s.coach) + ' can’t coach ' + o.session, why: 'Nobody has been asked to cover yet.', detail: occLabel(o),
          actionLabel: 'Find cover', route: 'mgmt-occurrence/' + o.id, related: { occurrence: o.id, coach: s.coach }, group: g, chain: 'staff:' + o.id + '|' + s.coach, fact: 'away:' + s.coach + '|on:' + onFact }));
      });
      live.forEach(function (x) {
        var n = x.need, oc = db.coverOutcome(n), today = oc.urgency === 'today', who = n.absent ? first(db.coachName(n.absent)) + ' can’t coach' : 'No coach yet';
        var title = oc.key === 'choose' ? (oc.can.length > 1 ? oc.can.length + ' coaches can cover ' + o.session + ': choose one' : first(db.coachName(oc.can[0].coach)) + ' can cover ' + o.session + ': choose')
          : oc.key === 'none' ? 'No one can cover ' + o.session + ' yet' : 'Cover still needed' + (today ? ' today' : '') + ': ' + o.session;
        var why = oc.key === 'choose' ? who + '. Saying yes doesn’t put anyone on the session until you choose.' : oc.key === 'none' ? who + ' and everyone asked has said no. Without cover the session can’t run as planned.'
          : who + '. ' + oc.offered + ' eligible coach' + (oc.offered === 1 ? ' has' : 'es have') + ' been asked; ' + oc.replied + ' replied so far.';
        /* Waiting for replies with nothing to do yet is someone else's move, until it gets close */
        var waiting = oc.key === 'waiting' && !oc.urgency;
        push(make('ATT-041', 'cover_open|' + x.request.id + '|' + n.id, { hours: h, forceSev: today ? 'Urgent' : null, forceWhy: today ? 'Today' : '', title: title, why: why, detail: occLabel(o) + ' · ' + oc.offered + ' offered, ' + oc.replied + ' replied',
          actionLabel: oc.key === 'choose' ? 'Choose who covers' : oc.key === 'none' ? 'Find someone' : oc.urgency ? 'Ring round' : 'See replies', route: 'mgmt-cover-request/' + x.request.id + '/' + n.id, waiting: waiting,
          related: Object.assign({ occurrence: o.id }, n.absent ? { coach: n.absent } : {}), group: g, chain: 'staff:' + o.id + '|' + (n.absent || 'null'), fact: oc.key }));
      });
      var roles = on.map(function (s) { return s.actualRole || s.role; });
      if (roles.length && roles.every(function (r) { return r === 'Learning'; })) push(make('ATT-002', 'learning_coach_only|occurrence:' + o.id, { hours: h, title: o.session + ' has only a Learning Coach', why: 'A Learning Coach can’t run a session alone.', detail: occLabel(o),
        actionLabel: 'Add a coach', route: 'mgmt-occurrence/' + o.id, related: occ, group: g, fact: onFact }));
      else if (roles.length && roles.indexOf('Lead') < 0) push(make('ATT-003', 'no_lead_coach|occurrence:' + o.id, { hours: h, title: o.session + ' has no Lead Coach', why: 'Someone needs to lead on the day: the register, safeguarding and parents.', detail: occLabel(o) + ' · ' + roles.length + ' coach' + (roles.length === 1 ? '' : 'es') + ', none leading',
        actionLabel: 'Choose a lead', route: 'mgmt-occurrence/' + o.id, related: occ, group: g, fact: onFact }));
      on.forEach(function (s) {
        var comp = db.getCoachComplianceSummary ? db.getCoachComplianceSummary(s.coach) : null;
        if (comp && (comp.state === 'Expired' || comp.state === 'Missing')) push(make('ATT-031', 'non_compliant_coach_assigned|occurrence:' + o.id + '|coach:' + s.coach, { hours: h, title: db.coachName(s.coach) + ' is on ' + o.session + ' without valid documents', why: comp.text + '. They shouldn’t coach until it’s sorted.', detail: occLabel(o),
          actionLabel: 'Change coach', route: 'mgmt-occurrence/' + o.id, related: { occurrence: o.id, coach: s.coach }, group: coachGroup(s.coach), fact: s.coach + ':' + comp.state }));
        if (db.fin && db.fin.rateFor && !db.fin.rateFor(s.coach, o.date)) push(make('ATT-032', 'no_pay_rate|occurrence:' + o.id + '|coach:' + s.coach, { hours: h, title: db.coachName(s.coach) + ' has no pay rate for ' + K.dd(o.date), why: 'Their pay for this date can’t be worked out, so expected cost is missing.', detail: o.session + ' · ' + occLabel(o),
          actionLabel: 'Set a pay rate', route: 'mgmt-coach/' + s.coach + '/pay', related: { occurrence: o.id, coach: s.coach }, group: coachGroup(s.coach), fact: s.coach, finance: true }));
      });
      if (!o.venue) push(make('ATT-018', 'venue_missing|occurrence:' + o.id, { hours: h, title: o.session + ' has no venue', why: 'Families and coaches don’t know where to go.', detail: K.dd(o.date) + ', ' + o.start,
        actionLabel: 'Choose a venue', route: 'mgmt-occurrence/' + o.id, related: occ, group: g, fact: 'novenue' }));
      var shut = o.venue && db.venueClosure ? db.venueClosure(o.venue, o.date) : null;
      if (shut) push(make('ATT-019', 'venue_unavailable|occurrence:' + o.id + '|venue:' + o.venue, { hours: h, title: db.venueName(o.venue) + ' is closed for ' + o.session, why: shut.reason + '. Families need time to hear about a move.', detail: K.dd(o.date) + ', ' + o.start,
        actionLabel: 'Change venue', route: 'mgmt-occurrence/' + o.id, related: occ, group: g, fact: o.venue + ':' + shut.reason }));
      return out;
    }
    if (o.status !== 'Scheduled' && o.status !== 'Completed') return out;
    /* Started: the register; ended: what happened. Kept as separate issues. */
    var reg = db.getRegister(o.id), ended = db.hasEnded(o), ago = -hoursUntil(o.date, o.end), days = Math.floor(ago / 24);
    if (!o.delivery && ended) {
      var run = payRunFor(o.date), toRun = hoursUntil(run, '09:00');
      var notes = o.staff.filter(function (s) { return s.unavailable && !s.covering; }).map(function (s) { return first(db.coachName(s.coach)) + ' couldn’t make it and no cover was confirmed'; });
      if (!o.staff.length) notes.push('no coach was planned');
      push(make('ATT-022', 'awaiting_confirmation|occurrence:' + o.id, { whenText: days >= 1 ? 'Ended ' + days + ' day' + (days > 1 ? 's' : '') + ' ago' : 'Ended today', due: toRun,
        forceSev: toRun <= 48 ? 'Urgent' : days >= 1 ? 'Warning' : null, forceWhy: toRun <= 48 ? 'Coach payment on ' + K.dm(run) : days >= 1 ? 'Unconfirmed for over a day' : '',
        title: 'Did ' + o.session + ' go as planned?', why: 'Coach pay and history use what you confirm' + (notes.length ? '. Before it started: ' + notes.join('; ') : '') + '.', detail: occLabel(o),
        actionLabel: notes.length ? 'Record what happened' : 'Confirm what happened', route: 'mgmt-occurrence/' + o.id, related: occ, group: g, fact: 'unconfirmed' }));
    }
    if (ended && reg.state !== 'Completed') push(make('ATT-020', 'register_incomplete|occurrence:' + o.id, { whenText: days >= 1 ? 'Ended ' + days + ' day' + (days > 1 ? 's' : '') + ' ago' : 'Ended today', due: 9000 - ago,
      forceSev: days >= 1 ? 'Warning' : null, forceWhy: days >= 1 ? 'Open for over a day' : '', title: 'Register to finish: ' + o.session, why: 'Attendance is part of each player’s record and safeguarding.', detail: occLabel(o) + ' · ' + reg.state.toLowerCase(),
      actionLabel: 'Finish the register', route: 'mgmt-register/' + o.id, related: occ, group: g, fact: reg.state }));
    return out;
  }

  /* ---------- Everything ---------- */
  function compute() {
    var cases = [];
    function add(c) { if (c) cases.push(c); }
    /* Dated sessions: upcoming readiness, plus anything still open after it ran */
    db.getOccurrences(function (o) { return !o.draft && (o.status === 'Scheduled' || o.status === 'Completed') && o.date >= '2026-08-01' && o.date <= K.addDays(TODAY, 42); }).forEach(function (o) {
      dateIssues(o).forEach(function (c) { var r = rule(c.ruleId); if (r.horizon == null || c.due <= r.horizon || c.ruleId === 'ATT-022' || c.ruleId === 'ATT-020') add(c); });
    });
    /* Draft sessions: one "finish setting up" item, from 14 days before the first planned date */
    db.getSessions().filter(function (s) { return s.lifecycle === 'Draft'; }).forEach(function (s) {
      var firstOcc = db.getOccurrences(function (o) { return o.sessionId === s.id && o.date >= TODAY; })[0]; if (!firstOcc) return;
      var h = hoursUntil(firstOcc.date, firstOcc.start); if (h > rule('ATT-016').horizon) return;
      var missing = [!s.venue && !firstOcc.venue ? 'a venue' : '', !(s.staff || []).length ? 'coaches' : '', !s.commercial || !s.billing ? 'how it’s charged' : ''].filter(Boolean);
      add(make('ATT-016', 'draft_setup|session:' + s.id, { hours: h, title: 'Finish setting up ' + s.name, why: 'It’s still a draft, so families can’t book and its first date (' + K.dd(firstOcc.date) + ') won’t run.' + (missing.length ? ' Still needs ' + missing.join(', ') + '.' : ''), detail: s.programme + ' · first date ' + K.dd(firstOcc.date),
        actionLabel: 'Finish setting up', route: 'mgmt-session-edit/' + s.id, related: { session: s.id }, fact: missing.join(',') }));
    });
    /* Live sessions without their commercial setup */
    db.getSessions().filter(function (s) { return s.lifecycle !== 'Draft' && s.lifecycle !== 'Inactive' && (!s.commercial || !s.booking || !s.billing); }).forEach(function (s) {
      add(make('ATT-017', 'commercial_missing|session:' + s.id, { whenText: 'Live session', title: s.name + ' is missing how it’s charged', why: 'Families or the client can’t be charged correctly until it’s set.', detail: [!s.commercial ? 'funding' : '', !s.booking ? 'booking access' : '', !s.billing ? 'billing' : ''].filter(Boolean).join(', ') + ' not set',
        actionLabel: 'Set up charging', route: 'mgmt-session-edit/' + s.id, related: { session: s.id }, finance: true }));
    });
    /* Coach documents: grouped with the coach's dates; checking an upload inherits the urgency of the dates it would clear */
    var docs = typeof db.getComplianceIssues === 'function' ? db.getComplianceIssues() : [];
    var dated = {}; cases.forEach(function (c) { if (c.ruleId === 'ATT-031') (dated[c.related.coach] = dated[c.related.coach] || []).push(c); });
    docs.forEach(function (d) {
      var route = d.doc ? 'mgmt-document/' + d.doc : 'mgmt-coach/' + d.coach + '/documents', on = dated[d.coach] || [], next = on.slice().sort(function (a, b) { return a.due - b.due; })[0];
      var onWhy = on.length ? ' ' + first(db.coachName(d.coach)) + ' is on ' + on.length + ' session' + (on.length === 1 ? '' : 's') + ' in the next week, next ' + K.dd(db.getOccurrence(next.related.occurrence).date) + '.' : '';
      if (d.kind === 'expiring') add(make('ATT-011', 'coach_compliance_expiry|doc:' + d.doc, { hours: hoursUntil(d.date, '09:00'), title: d.title, why: 'Once it expires they can’t coach until a new one is checked.', detail: d.typeName + ' · expires ' + K.d(d.date),
        actionLabel: 'Open the document', route: route, related: { coach: d.coach }, group: coachGroup(d.coach), fact: d.doc + ':expiring' }));
      if (d.kind === 'expired' || d.kind === 'missing') add(make('ATT-011', 'coach_compliance_' + d.kind + '|coach:' + d.coach + '|type:' + d.type, { forceSev: next ? next.severity : 'Warning', whenText: d.date ? 'Expired ' + K.dm(d.date) : 'Not on file', due: next ? next.due : 9000,
        title: d.title, why: 'They shouldn’t coach until a valid one is on file.' + onWhy, detail: d.typeName, actionLabel: d.kind === 'missing' ? 'Record the document' : 'Open the document', route: route, related: { coach: d.coach }, group: coachGroup(d.coach), fact: d.kind }));
      if (d.kind === 'pending') add(make('ATT-042', 'verification_pending|doc:' + d.doc, { forceSev: next ? next.severity : null, whenText: 'Uploaded ' + K.dm(d.date), due: next ? next.due - 0.5 : 9000,
        title: d.title, why: on.length ? 'Checking it could clear ' + first(db.coachName(d.coach)) + ' for ' + on.length + ' session' + (on.length === 1 ? '' : 's') + ' this week.' : 'Until it’s checked it doesn’t count.', detail: 'Verify it, or reject it with a reason',
        actionLabel: 'Check the upload', route: route, related: { coach: d.coach }, group: coachGroup(d.coach), fact: d.doc }));
    });
    /* Coach sign-ups */
    if (typeof db.getPendingCoachSignups === 'function') db.getPendingCoachSignups().forEach(function (s) {
      add(make('ATT-046', 'coach_signup|' + s.id, { whenText: 'Signed up ' + K.dm(s.at.slice(0, 10)), due: 8000, title: s.name + ' wants to join as ' + (s.role === 'Management' ? 'Management' : 'a coach'), why: 'They can’t start until someone approves them.', detail: s.qualification || s.email || '',
        actionLabel: 'Approve or decline', route: 'mgmt-coach-signups/' + s.id }));
    });
    /* Work summaries: the coach payment run is the deadline */
    (typeof db.getSummariesReady === 'function' ? db.getSummariesReady() : []).forEach(function (w) {
      var run = '2026-10-07', h = hoursUntil(run, '09:00'), month = w.monthLabel || 'September', nm = db.coachName(w.coach);
      var title = w.stale && w.state !== 'Needs review' ? nm + '’s ' + month + ' summary needs reopening' : w.state === 'Queried' ? nm + ' queried their ' + month + ' summary' : nm + '’s ' + month + ' summary needs reading';
      add(make('ATT-045', 'work_summary_ready|' + w.id, { hours: h, title: title, why: (w.stale && w.state !== 'Needs review' ? 'Delivered work changed after it was finalised. ' : w.state === 'Queried' ? '“' + (w.query && w.query.text || '') + '” ' : '') + 'Coach payment is on ' + K.dm(run) + '.',
        detail: w.lines.length + ' sessions · ' + K.money(w.total), actionLabel: w.state === 'Queried' ? 'Answer the query' : w.stale && w.state !== 'Needs review' ? 'Reopen the summary' : 'Read and finalise', route: 'mgmt-work-summary/' + w.id, related: { coach: w.coach }, finance: true }));
    });
    /* Medical: one issue per player, timed by their next session */
    var med = {};
    db.getOccurrences(function (o) { var h = hoursUntil(o.date, o.start); return o.status === 'Scheduled' && !o.draft && h > 0 && h <= 72 && !db.getSession(o.sessionId).client; }).forEach(function (o) {
      db.getExpectedPlayers(o).forEach(function (pid) { var p = db.getPlayer(pid); if (p && p.medical === 'not_confirmed' && !med[pid]) med[pid] = o; });
    });
    Object.keys(med).forEach(function (pid) {
      var p = db.getPlayer(pid), o = med[pid];
      add(make('ATT-050', 'medical_unconfirmed|player:' + pid, { hours: hoursUntil(o.date, o.start), title: p.name + '’s medical details aren’t confirmed', why: 'Coaches need to know about allergies and conditions before ' + first(p.name) + ' trains.', detail: 'Next session ' + o.session + ', ' + dayLabel(o),
        actionLabel: 'Ask the family', route: 'mgmt-player/' + pid, related: { player: pid } }));
    });
    /* Players and families */
    /* Only while session requests are switched on: when off they're kept and can't be decided yet */
    if (typeof db.getSessionRequests === 'function' && (!K.feature || K.feature('sessionRequests'))) db.getSessionRequests().filter(function (r) { return r.status === 'Open'; }).forEach(function (r) {
      var p = db.getPlayer(r.player), s = db.getSession(r.session);
      add(make('ATT-053', 'session_request|' + r.id, { whenText: 'Requested ' + K.dm(r.at.slice(0, 10)), due: 8000, title: (p ? p.name : 'A player') + ' wants to join ' + (s ? s.name : 'a session'), why: 'The family is waiting to hear back.', detail: r.reason || '',
        actionLabel: 'Approve, amend or decline', route: 'mgmt-session-requests/' + r.id, related: { player: r.player } }));
    });
    (typeof db.getPendingClaims === 'function' ? db.getPendingClaims() : []).forEach(function (c) {
      add(make('ATT-052', 'parent_claim|' + c.id, { whenText: c.at ? 'Submitted ' + K.dm(c.at) : '', due: 8000, title: (c.parent || 'A parent') + ' says they’re ' + (c.child || 'a child') + '’s parent', why: 'They can’t see their child until you check the match.', detail: c.reason || 'Partial match',
        actionLabel: 'Approve or decline', route: 'mgmt-parent-claims/' + c.id }));
    });
    db.getMemberships(function (m) { return m.state === 'Cancellation Pending'; }).forEach(function (m) {
      var p = db.getPlayer(m.player);
      add(make('ATT-054', 'cancel_request|' + m.id, { whenText: m.cancel ? 'Requested ' + K.dm(m.cancel.requested) : '', due: 8000, title: p.name + ' wants to leave ' + db.getSession(m.session).name, why: 'The family is waiting for an answer, and billing depends on it.', detail: m.cancel ? m.cancel.reason : '',
        actionLabel: 'Decide the cancellation', route: 'mgmt-membership/' + m.id, related: { player: m.player } }));
    });
    if (typeof db.getFamiliesReviewDue === 'function') db.getFamiliesReviewDue(30).forEach(function (f) {
      add(make('ATT-056', 'family_review_due|' + f.id, { whenText: 'Due ' + K.dm(f.reviewDue), due: hoursUntil(f.reviewDue, '09:00'), title: String(f.name).replace(/ family$/i, '') + ' family is due a review', why: 'Contacts, permissions and who can collect need checking once a year.', detail: '',
        actionLabel: 'Review the family', route: 'mgmt-family/' + f.id }));
    });
    if (typeof db.getOutcomesMissing === 'function') db.getOutcomesMissing().forEach(function (o) {
      add(make('ATT-024', 'outcome_missing|occurrence:' + o.id, { whenText: o.status + ' ' + K.dm(o.date), due: 7000, title: o.session + ' was ' + o.status.toLowerCase() + ': decide refunds and credits', why: 'Families, the venue and coaches are waiting to hear what they get.', detail: K.dd(o.date) + ', ' + o.start,
        actionLabel: 'Decide refunds and credits', route: 'mgmt-occurrence-outcome/' + o.id, related: { occurrence: o.id } }));
    });
    /* Development */
    if (typeof db.getFeedbackAwaitingReview === 'function') db.getFeedbackAwaitingReview().forEach(function (f) {
      var p = db.getPlayer(f.player);
      add(make('ATT-070', 'feedback_review|' + f.id, { whenText: f.submittedAt ? 'Submitted ' + K.dm(f.submittedAt) : '', due: 8500, title: (p ? p.name : 'A player') + '’s feedback is waiting for review', why: 'The family can’t see it until it’s reviewed.', detail: 'From ' + db.coachName(f.coach),
        actionLabel: 'Review feedback', route: 'mgmt-feedback-review/' + f.id, related: { player: f.player } }));
    });
    if (typeof db.getIdpsNotStarted === 'function') { var ns = db.getIdpsNotStarted(); if (ns.length) add(make('ATT-071', 'idps_not_started|period', { whenText: 'Review period open', due: 8600, title: ns.length + ' ' + K.label(ns.length === 1 ? 'IDP' : 'IDPs') + ' not started', why: 'These players have no plan for this review period yet.',
      detail: ns.slice(0, 3).map(function (i) { var p = db.getPlayer(i.player); return p ? p.name : i.player; }).join(', ') + (ns.length > 3 ? ' and ' + (ns.length - 3) + ' more' : ''), actionLabel: 'Open ' + K.label('IDPs'), route: 'mgmt-idps' })); }
    /* Finance */
    if (db.fin) {
      db.getInvoices().forEach(function (i) {
        var st = db.fin.paymentState(i), c = db.getClient(i.client);
        if (st === 'Overdue') { var late = K.daysBetween(i.due, TODAY), lim = rule('ATT-060').urgentDaysOverdue;
          add(make('ATT-060', 'invoice_overdue|' + i.id, { whenText: late + ' days overdue', due: 6000 - late, forceSev: late >= lim ? 'Urgent' : null, forceWhy: late >= lim ? 'Over ' + lim + ' days overdue' : '', title: i.number + ' to ' + c.name + ' is overdue', why: K.money(db.fin.balance(i)) + ' is owed to us and it’s past its due date.',
            detail: 'Due ' + K.d(i.due) + (i.originalDue && i.originalDue !== i.due ? ' (moved from ' + K.dm(i.originalDue) + ')' : ''), actionLabel: 'Send a reminder', route: 'mgmt-fin-invoice/' + i.id, finance: true })); }
        if (i.xero && i.xero.status === 'Failed') add(make('ATT-061', 'xero_failed|' + i.id, { whenText: K.dm(i.xero.at), due: 8000, title: i.number + ' didn’t reach Xero', why: 'The accounts won’t match until it’s sent.', detail: i.xero.error || '', actionLabel: 'Send to Xero again', route: 'mgmt-fin-invoice/' + i.id, finance: true }));
      });
      db.getDrafts().filter(function (d) { return d.state !== 'Issued' && !d.replaces; }).forEach(function (d) {
        add(make('ATT-062', 'not_invoiced|' + d.id, { whenText: 'Month ended 30 Sep', due: 7500, title: db.getClient(d.client).name + ': September not invoiced', why: 'We can’t be paid for September until the invoice goes out.', detail: 'Draft ' + d.state.toLowerCase(), actionLabel: 'Finish the invoice', route: 'mgmt-fin-draft/' + d.id, finance: true }));
      });
    }
    return applyExceptions(cases);
  }

  /* ---------- Deliberate exceptions ----------
     "Leave as it is": reason, scope (this date / until a date / until something changes), who and when.
     It stays in force only while the facts it was decided on still hold. */
  function exceptionFor(c) {
    var e = D.attentionExceptions.filter(function (x) { return x.caseKey === c.caseKey && !x.revoked && !x.lapsed; }).slice(-1)[0];
    if (!e) return null;
    var why = e.fact != null && c.fact != null && e.fact !== c.fact ? 'Something changed since it was left as it is' : e.scope && e.scope.until && TODAY > e.scope.until ? 'Its time limit passed' : '';
    if (why) { e.lapsed = { at: NOW, why: why }; K.log({ area: 'Needs attention', summary: 'Reopened automatically: ' + c.title, entity: c.caseKey, before: 'Left as it is', after: why }); c.reopened = e; return null; }
    return e;
  }
  function applyExceptions(cases) {
    var open = [], left = [];
    cases.forEach(function (c) {
      var e = exceptionFor(c);
      if (e && e.type === 'Leave as it is') { c.exception = e; left.push(c); return; }
      if (e && e.type === 'Change priority') { c.originalSeverity = c.severity; c.severity = e.severity; c.severityReason = 'Priority changed by ' + e.by; c.exception = e; }
      if (!c.reopened) c.reopened = D.attentionExceptions.filter(function (x) { return x.caseKey === c.caseKey && x.lapsed; }).slice(-1)[0] || null;
      open.push(c);
    });
    open.sort(function (a, b) { return RANK[b.severity] - RANK[a.severity] || a.due - b.due; });
    var active = open.filter(function (c) { return !c.waiting; }), counts = { Urgent: 0, Warning: 0, Normal: 0 };
    active.forEach(function (c) { counts[c.severity]++; });
    return { generatedAt: NOW, summary: { state: counts.Urgent ? 'Urgent' : counts.Warning ? 'Warning' : counts.Normal ? 'Normal' : 'Clear', total: active.length, counts: counts, waiting: open.length - active.length }, cases: open, active: active, accepted: left, left: left };
  }

  /* ---------- Presentation groups: one card per date or coach, each issue still its own ---------- */
  function cards(list) {
    var map = {}, out = [];
    list.forEach(function (c) {
      var k = c.group && c.group.kind ? c.group.key : c.caseKey;
      if (!map[k]) { map[k] = { key: k, group: c.group && c.group.kind ? c.group : null, issues: [] }; out.push(map[k]); }
      map[k].issues.push(c);
    });
    out.forEach(function (g) {
      g.issues.sort(function (a, b) { return (a.waiting - b.waiting) || RANK[b.severity] - RANK[a.severity] || a.due - b.due; });
      g.lead = g.issues[0]; g.severity = g.issues.reduce(function (s, c) { return c.waiting ? s : maxSev(s, c.severity); }, 'Normal');
      g.waiting = g.issues.every(function (c) { return c.waiting; }); g.due = Math.min.apply(null, g.issues.map(function (c) { return c.due; }));
      g.category = g.lead.category;
    });
    return out.sort(function (a, b) { return (a.waiting - b.waiting) || RANK[b.severity] - RANK[a.severity] || a.due - b.due; });
  }

  /* ---------- Read helpers (one engine for every surface) ---------- */
  /* Counts are of what Management sees: one card per date, coach or item, not counting Waiting on others */
  db.getAttention = function () {
    var a = compute(), cs = cards(a.cases).filter(function (g) { return !g.waiting; }), counts = { Urgent: 0, Warning: 0, Normal: 0 };
    cs.forEach(function (g) { counts[g.severity]++; });
    a.summary = { state: counts.Urgent ? 'Urgent' : counts.Warning ? 'Warning' : counts.Normal ? 'Normal' : 'Clear', total: cs.length, counts: counts, waiting: cards(a.cases).length - cs.length };
    D.attention = a; return a;
  };
  db.getAttentionCases = function () { return db.getAttention().cases; };
  db.getAttentionCards = function (list) { return cards(list || db.getAttention().cases); };
  db.getAttentionCase = function (key) { var a = compute(); return a.cases.concat(a.left).filter(function (c) { return c.caseKey === key; })[0]; };
  /* The dated session's own view: every issue, including ones beyond the queue's horizon and ones left as they are */
  db.dateIssues = function (o) { var a = applyExceptions(dateIssues(o)); return { open: a.cases, left: a.left }; };
  db.getAttentionRules = function () { return D.attentionRules; };
  db.getAttentionRule = function (id) { return rule(id); };
  db.updateAttentionRule = function (id, patch) { var r = rule(id), b = JSON.stringify({ enabled: r.enabled, base: r.base, warnHours: r.warnHours, urgentHours: r.urgentHours, locked: r.locked }); Object.assign(r, patch); K.log({ area: 'Needs attention', summary: 'Changed rule ' + r.id + ' (' + r.name + ')', entity: r.id, before: b, after: JSON.stringify(patch) }); return r; };
  db.getAttentionExceptions = function () { return D.attentionExceptions; };
  /* Leave as it is / change priority. e: { caseKey, type, reason, scope: { kind: 'date'|'until'|'change', date, until, label }, severity } */
  db.addAttentionException = function (e) {
    var c = db.getAttentionCase(e.caseKey) || (e.occurrence && dateIssues(db.getOccurrence(e.occurrence)).filter(function (x) { return x.caseKey === e.caseKey; })[0]);
    e.id = 'EXC-' + String(D.attentionExceptions.length + 1).padStart(2, '0'); e.by = e.by || K.me(); e.at = e.at || K.now();
    e.type = e.type === 'Accepted' ? 'Leave as it is' : e.type === 'Severity override' ? 'Change priority' : e.type;
    if (c) { e.title = e.title || c.title; e.ruleId = c.ruleId; e.fact = c.fact; e.related = c.related; }
    D.attentionExceptions.push(e);
    K.log({ area: 'Needs attention', summary: e.type + ': ' + (e.title || e.caseKey), entity: e.caseKey, before: 'Open', after: (e.severity || 'Left as it is') + (e.scope && e.scope.label ? ' · ' + e.scope.label : '') + ' (' + e.reason + ')' });
    return e;
  };
  db.leaveAsIs = function (caseKey, reason, scope, who, at, occurrence) { return db.addAttentionException({ caseKey: caseKey, type: 'Leave as it is', reason: reason, scope: scope, by: who, at: at, occurrence: occurrence }); };
  db.revokeAttentionException = function (id) { var e = D.attentionExceptions.filter(function (x) { return x.id === id; })[0]; e.revoked = { by: K.me(), at: K.now() }; K.log({ area: 'Needs attention', summary: 'Reopened: ' + e.title, entity: e.caseKey, before: e.type, after: 'Open' }); return e; };
  db.getApprovalsWaiting = function () {
    var list = db.getApprovals().map(function (a) { return Object.assign({}, a); });
    if (typeof db.getPendingCoachSignups === 'function') list.forEach(function (a) { if (a.id === 'coach-signups') a.count = db.getPendingCoachSignups().length; });
    if (typeof db.getPendingClaims === 'function') list.forEach(function (a) { if (a.id === 'parent-claims') a.count = db.getPendingClaims().length; });
    return list;
  };
})();
