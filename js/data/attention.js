/* Needs Attention: rules and an engine that computes cases from every
   area's data on each read, so fixing the underlying issue clears the case.
   Rules carry base severity, warning and urgent thresholds and a locked
   minimum. Management can accept or override a case with a reason and an
   approver; that exception is kept with who and when. */
(function () {
  var D = Hub.data, K = Hub.kit, db = Hub.db;
  var NOW = '2026-10-01T14:10';
  var RANK = { Normal: 1, Warning: 2, Urgent: 3 };
  function maxSev(a, b) { return RANK[a] >= RANK[b] ? a : b; }
  function hoursUntil(date, time) { return (K.parse(date + 'T' + (time || '00:00')) - K.parse(NOW)) / 36e5; }
  function inText(h) { if (h < 0) { var d = Math.round(-h / 24); return d >= 1 ? d + ' day' + (d > 1 ? 's' : '') + ' ago' : Math.round(-h) + ' h ago'; } if (h < 24) { var hh = Math.floor(h), m = Math.round((h - hh) * 60); return 'Starts in ' + hh + ' h' + (m ? ' ' + m + ' m' : ''); } var dd = Math.round(h / 24); return 'In ' + dd + ' day' + (dd > 1 ? 's' : ''); }

  D.attentionRules = [
    { id: 'ATT-013', name: 'Session has no coach', category: 'Staffing & Cover', enabled: true, base: 'Warning', warnHours: null, urgentHours: 48, locked: 'Warning' },
    { id: 'ATT-014', name: 'Assigned coach unavailable', category: 'Staffing & Cover', enabled: true, base: 'Warning', warnHours: null, urgentHours: 48, locked: 'Warning' },
    { id: 'ATT-002', name: 'Learning coach only', category: 'Staffing & Cover', enabled: true, base: 'Warning', warnHours: null, urgentHours: 24, locked: null },
    { id: 'ATT-003', name: 'No Lead Coach', category: 'Staffing & Cover', enabled: true, base: 'Warning', warnHours: null, urgentHours: 48, locked: null },
    { id: 'ATT-041', name: 'Cover still needed', category: 'Staffing & Cover', enabled: true, base: 'Normal', warnHours: 168, urgentHours: 24, locked: null },
    { id: 'ATT-011', name: 'Compliance document expiring or missing', category: 'Coaches & Compliance', enabled: true, base: 'Normal', warnHours: 720, urgentHours: 168, locked: null },
    { id: 'ATT-031', name: 'Non-compliant coach assigned', category: 'Coaches & Compliance', enabled: true, base: 'Warning', warnHours: null, urgentHours: 48, locked: 'Warning' },
    { id: 'ATT-042', name: 'Document awaiting verification', category: 'Coaches & Compliance', enabled: true, base: 'Normal', warnHours: null, urgentHours: null, locked: null },
    { id: 'ATT-045', name: 'Work summary to read or query to answer', category: 'Coaches & Compliance', enabled: true, base: 'Normal', warnHours: null, urgentHours: null, locked: null },
    { id: 'ATT-018', name: 'Session has no venue', category: 'Sessions & Venues', enabled: true, base: 'Normal', warnHours: 336, urgentHours: 48, locked: null },
    { id: 'ATT-019', name: 'Venue unavailable', category: 'Sessions & Venues', enabled: true, base: 'Warning', warnHours: null, urgentHours: 72, locked: 'Warning' },
    { id: 'ATT-020', name: 'Register incomplete', category: 'Sessions & Venues', enabled: true, base: 'Warning', warnHours: null, urgentHours: null, locked: null },
    { id: 'ATT-022', name: 'Session awaiting confirmation', category: 'Sessions & Venues', enabled: true, base: 'Normal', warnHours: null, urgentHours: null, locked: null },
    { id: 'ATT-024', name: 'Cancellation outcome not recorded', category: 'Sessions & Venues', enabled: true, base: 'Warning', warnHours: null, urgentHours: null, locked: null },
    { id: 'ATT-050', name: 'Medical details not confirmed', category: 'Players & Parents', enabled: true, base: 'Normal', warnHours: 72, urgentHours: null, locked: null },
    { id: 'ATT-052', name: 'Parent claim needs review', category: 'Players & Parents', enabled: true, base: 'Normal', warnHours: null, urgentHours: null, locked: null },
    { id: 'ATT-054', name: 'Membership cancellation awaiting decision', category: 'Players & Parents', enabled: true, base: 'Normal', warnHours: null, urgentHours: null, locked: null },
    { id: 'ATT-056', name: 'Family review due', category: 'Players & Parents', enabled: true, base: 'Normal', warnHours: null, urgentHours: null, locked: null },
    { id: 'ATT-070', name: 'Feedback awaiting review', category: 'Development', enabled: true, base: 'Normal', warnHours: null, urgentHours: null, locked: null },
    { id: 'ATT-071', name: 'Development plans not started', category: 'Development', enabled: true, base: 'Normal', warnHours: null, urgentHours: null, locked: null },
    { id: 'ATT-060', name: 'Invoice overdue', category: 'Finance', enabled: true, base: 'Warning', warnHours: null, urgentHours: null, locked: null, urgentDaysOverdue: 30 },
    { id: 'ATT-061', name: 'Invoice not sent to Xero', category: 'Finance', enabled: true, base: 'Normal', warnHours: null, urgentHours: null, locked: null },
    { id: 'ATT-062', name: 'Month not invoiced', category: 'Finance', enabled: true, base: 'Normal', warnHours: null, urgentHours: null, locked: null }
  ];
  D.attentionExceptions = [];
  function rule(id) { return D.attentionRules.filter(function (r) { return r.id === id; })[0]; }
  function sev(r, h) {
    var s = r.base, why = 'Standard priority';
    if (h != null && r.warnHours != null && h <= r.warnHours && RANK.Warning > RANK[s]) { s = 'Warning'; why = 'Within ' + Math.round(r.warnHours / 24) + ' days'; }
    if (h != null && r.urgentHours != null && h <= r.urgentHours) { s = 'Urgent'; why = 'Starts within ' + r.urgentHours + ' hours'; }
    if (r.locked && RANK[r.locked] > RANK[s]) { s = r.locked; why = 'Locked minimum: ' + r.locked; }
    return [s, why];
  }
  function occLabel(o) { return K.dd(o.date) + ', ' + o.start + ' · ' + db.venueName(o.venue); }

  function compute() {
    var cases = [];
    function add(rid, key, o) {
      var r = rule(rid); if (!r || !r.enabled) return;
      var sv = sev(r, o.hours);
      if (o.forceSev) sv = [maxSev(o.forceSev, sv[0]), o.forceWhy || sv[1]];
      cases.push(Object.assign({ caseKey: key, ruleId: r.id, ruleName: r.name, category: r.category, severity: sv[0], severityReason: sv[1], when: o.hours != null ? inText(o.hours) : (o.whenText || '') }, o));
    }
    /* Live cover per date and per absent coach: one coach being covered never hides another */
    var coverOcc = {}, coverFor = {}; (typeof db.getOpenCover === 'function' ? db.getOpenCover() : []).forEach(function (c) { coverOcc[c.occurrence] = 1; coverFor[c.occurrence + '|' + c.absent] = 1; });
    var upcoming = db.getOccurrences(function (o) { return o.date >= '2026-10-01' && o.date <= '2026-10-23' && o.status === 'Scheduled'; });
    upcoming.forEach(function (o) {
      var h = hoursUntil(o.date, o.start); if (h < 0 && o.date === '2026-10-01') return;
      var staffed = o.staff.filter(function (s) { return !s.unavailable || s.covering; });
      var ses = db.getSession(o.sessionId);
      if (!o.draft && !o.staff.length && h <= 336 && !coverOcc[o.id]) add('ATT-013', 'session_no_coach|occurrence:' + o.id, { hours: h, title: o.session + ' has no coach', detail: occLabel(o) + ' · ' + o.players + ' players', actionLabel: 'Add a coach', route: 'mgmt-occurrence/' + o.id, related: { occurrence: o.id } });
      /* A coach who can't coach this date and nobody looking for cover yet, including time off that still leaves them on it */
      o.staff.forEach(function (s) {
        var away = (s.unavailable && !s.covering) || (!s.unavailable && db.awayFrom && db.awayFrom(s.coach, o));
        if (away && !coverFor[o.id + '|' + s.coach]) add('ATT-014', 'assigned_coach_unavailable|occurrence:' + o.id + '|coach:' + s.coach, { hours: h, title: db.coachName(s.coach) + ' can’t coach ' + o.session, detail: occLabel(o) + ' · no cover yet', actionLabel: 'Find cover', route: 'mgmt-occurrence/' + o.id, related: { occurrence: o.id, coach: s.coach } });
      });
      var rolesNow = db.workingStaff(o).map(function (x) { return x.actualRole || x.role; });
      if (rolesNow.length && rolesNow.every(function (r) { return r === 'Learning'; })) add('ATT-002', 'learning_coach_only|occurrence:' + o.id, { hours: h, title: o.session + ' has only a learning coach', detail: occLabel(o), actionLabel: 'Check coaches', route: 'mgmt-occurrence/' + o.id, related: { occurrence: o.id } });
      if (!o.venue && h <= 336) add('ATT-018', 'venue_missing|occurrence:' + o.id, { hours: h, title: o.session + ' has no venue', detail: K.dd(o.date) + ', ' + o.start + (ses.lifecycle === 'Draft' ? ' · session is a draft' : ''), actionLabel: 'Choose a venue', route: 'mgmt-occurrence/' + o.id, related: { occurrence: o.id } });
      var shut = o.venue && db.venueClosure ? db.venueClosure(o.venue, o.date) : null;
      if (shut && !o.draft) add('ATT-019', 'venue_unavailable|occurrence:' + o.id + '|venue:' + o.venue, { hours: h, title: db.venueName(o.venue) + ' is closed for ' + o.session, detail: K.dd(o.date) + ', ' + o.start + ' · ' + shut.reason, actionLabel: 'Change venue', route: 'mgmt-occurrence/' + o.id, related: { occurrence: o.id } });
      var working = db.workingStaff(o).map(function (x) { return x.actualRole || x.role; });
      if (!o.draft && working.length && working.indexOf('Lead') < 0 && !working.every(function (r) { return r === 'Learning'; }) && h <= 336) add('ATT-003', 'no_lead_coach|occurrence:' + o.id, { hours: h, title: o.session + ' has no Lead Coach', detail: occLabel(o) + ' · ' + working.length + ' coach' + (working.length === 1 ? '' : 'es') + ', none leading', actionLabel: 'Choose a lead', route: 'mgmt-occurrence/' + o.id, related: { occurrence: o.id } });
      if (h <= 72 && !ses.client && !o.draft) db.getExpectedPlayers(o).forEach(function (pid) { var p = db.getPlayer(pid); if (p && p.medical === 'not_confirmed') add('ATT-050', 'medical_unconfirmed|player:' + pid + '|occurrence:' + o.id, { hours: h, title: p.name + '’s medical details are not confirmed', detail: 'Attending ' + o.session + ' · ' + K.dd(o.date), actionLabel: 'Ask the family', route: 'mgmt-player/' + pid, related: { player: pid } }); });
    });
    /* Delivery: dates that have ended and nobody has confirmed what happened */
    db.getAwaitingConfirmation().forEach(function (o) {
      var ago = -hoursUntil(o.date, o.end), days = Math.floor(ago / 24);
      add('ATT-022', 'awaiting_confirmation|occurrence:' + o.id, { whenText: days >= 1 ? 'Ended ' + days + ' day' + (days > 1 ? 's' : '') + ' ago' : 'Ended today', forceSev: days >= 5 ? 'Urgent' : days >= 1 ? 'Warning' : null, forceWhy: days >= 1 ? 'Unconfirmed for ' + (days >= 5 ? 'over 5 days' : 'over a day') : '',
        title: 'Did ' + o.session + ' go as planned?', detail: occLabel(o) + ' · confirm who coached so pay and history are right', actionLabel: 'Review delivery', route: 'mgmt-occurrence/' + o.id, related: { occurrence: o.id } });
    });
    /* Coach compliance (from the Coaches area) */
    var docs = typeof db.getComplianceIssues === 'function' ? db.getComplianceIssues() : [];
    var bad = {}; docs.forEach(function (d) { if (d.kind === 'expired' || d.kind === 'missing') (bad[d.coach] = bad[d.coach] || []).push(d); });
    upcoming.forEach(function (o) {
      o.staff.forEach(function (s) {
        var c = s.covering || s.coach, list = bad[c]; if (!list || s.unavailable) return;
        var h = hoursUntil(o.date, o.start); if (h > 168) return;
        var what = list.map(function (d) { var n = /^[A-Z][a-z]/.test(d.typeName) ? d.typeName.toLowerCase() : d.typeName; return d.kind === 'expired' ? n + ' has expired' : n + ' is missing'; }).join(' and ');
        add('ATT-031', 'non_compliant_coach_assigned|occurrence:' + o.id + '|coach:' + c, { hours: h, title: db.coachName(c) + ' is assigned but their ' + what, detail: o.session + ' · ' + occLabel(o), actionLabel: 'Change coach or check documents', route: 'mgmt-occurrence/' + o.id, related: { coach: c, occurrence: o.id } });
      });
    });
    docs.forEach(function (d) {
      var route = d.doc ? 'mgmt-document/' + d.doc : 'mgmt-coach/' + d.coach;
      if (d.kind === 'expiring') add('ATT-011', 'coach_compliance_expiry|doc:' + d.doc, { hours: hoursUntil(d.date, '09:00'), title: d.title, detail: d.typeName + ' · expires ' + K.d(d.date), actionLabel: 'Check document', route: route, related: { coach: d.coach } });
      if (d.kind === 'expired' || d.kind === 'missing') add('ATT-011', 'coach_compliance_' + d.kind + '|coach:' + d.coach + '|type:' + d.type, { forceSev: 'Warning', whenText: d.date ? 'Expired ' + K.dm(d.date) : 'Not on file', title: d.title, detail: d.typeName + ' · needed before they coach', actionLabel: 'Check documents', route: route, related: { coach: d.coach } });
      if (d.kind === 'pending') add('ATT-042', 'verification_pending|doc:' + d.doc, { whenText: 'Uploaded ' + K.dm(d.date), title: d.title, detail: 'Check the document and verify or reject it', actionLabel: 'Check document', route: route, related: { coach: d.coach } });
    });
    var cover = typeof db.getOpenCover === 'function' ? db.getOpenCover() : [];
    /* Cover: one item per date still to sort, worded by its outcome. Urgent within 24 hours and on the day itself. */
    cover.forEach(function (c) {
      var o = db.getOccurrence(c.occurrence) || {}, n = db.getCoverNeed(c.request, c.need); if (!n || !o.date) return;
      var x = db.coverOutcome(n), today = x.urgency === 'today', who = c.absent ? db.coachName(c.absent).split(' ')[0] + ' can’t coach' : 'no coach yet';
      var first = function (f) { return db.coachName(f.coach).split(' ')[0]; };
      var title = x.key === 'choose' ? (x.can.length > 1 ? x.can.length + ' coaches can cover ' + o.session + ': choose one' : first(x.can[0]) + ' can cover ' + o.session + ': choose')
        : x.key === 'none' ? 'No one can cover ' + o.session + ' yet' : 'Cover still needed' + (today ? ' today' : '') + ': ' + o.session;
      var detail = occLabel(o) + ' · ' + who + ' · ' + (x.offered ? x.offered + ' offered, ' + x.replied + ' replied' : 'no eligible coaches');
      add('ATT-041', 'cover_open|' + c.request + '|' + c.need, { hours: hoursUntil(o.date, o.start), forceSev: today ? 'Urgent' : null, forceWhy: today ? 'The session is today' : '', title: title, detail: detail,
        actionLabel: x.key === 'choose' ? 'Choose who covers' : x.key === 'none' ? 'Find someone' : 'See replies', route: 'mgmt-cover-request/' + c.request + '/' + c.need, related: Object.assign({ occurrence: o.id }, c.absent ? { coach: c.absent } : {}) });
    });
    var sums = typeof db.getSummariesReady === 'function' ? db.getSummariesReady() : [];
    sums.forEach(function (w) { add('ATT-045', 'work_summary_ready|' + w.id, { whenText: 'Period ended 30 Sep', title: w.stale && w.state !== 'Needs review' ? db.coachName(w.coach) + '’s ' + (w.monthLabel || 'September') + ' summary needs reopening: delivered work changed after it was finalised' : w.state === 'Queried' ? db.coachName(w.coach) + ' queried their ' + (w.monthLabel || 'September') + ' summary' : db.coachName(w.coach) + '’s ' + (w.monthLabel || 'September') + ' summary needs reading', detail: w.state === 'Queried' && w.query ? w.query.text : (w.lines ? w.lines.length + ' sessions · ' : '') + (w.total != null ? K.money(w.total) : ''), actionLabel: w.stale && w.state !== 'Needs review' ? 'Reopen summary' : w.state === 'Queried' ? 'Answer query' : 'Read and finalise', route: 'mgmt-work-summary/' + w.id, related: { coach: w.coach } }); });
    /* Registers */
    db.getOccurrences(function (o) { return o.status === 'Completed' && o.date < '2026-10-01'; }).forEach(function (o) {
      var r = db.getRegister(o.id);
      if (r.state !== 'Completed') add('ATT-020', 'register_incomplete|occurrence:' + o.id, { hours: hoursUntil(o.date, o.end), title: 'Register incomplete: ' + o.session, detail: occLabel(o) + ' · ' + r.state.toLowerCase(), actionLabel: 'Finish the register', route: 'mgmt-register/' + o.id, related: { occurrence: o.id } });
    });
    /* Players and families */
    var claims = typeof db.getPendingClaims === 'function' ? db.getPendingClaims() : [];
    claims.forEach(function (c) { add('ATT-052', 'parent_claim|' + c.id, { whenText: c.at ? 'Submitted ' + K.dm(c.at) : '', title: (c.parentName || c.parent || 'A parent') + ' claims ' + (c.childName || c.child || 'a child') + ': needs review', detail: c.reason || 'Partial match', actionLabel: 'Check the claim', route: 'mgmt-parent-claims' }); });
    db.getMemberships(function (m) { return m.state === 'Cancellation Pending'; }).forEach(function (m) { var p = db.getPlayer(m.player); add('ATT-054', 'cancel_request|' + m.id, { whenText: m.cancel ? 'Requested ' + K.dm(m.cancel.requested) : '', title: p.name + ': cancellation awaiting decision', detail: db.getSession(m.session).name + (m.cancel ? ' · ' + m.cancel.reason : ''), actionLabel: 'Decide cancellation', route: 'mgmt-membership/' + m.id, related: { player: m.player } }); });
    if (typeof db.getFamiliesReviewDue === 'function') db.getFamiliesReviewDue(30).forEach(function (f) { add('ATT-056', 'family_review_due|' + f.id, { whenText: 'Due ' + K.dm(f.reviewDue), title: String(f.name).replace(/ family$/i, '') + ' family is due a review', detail: 'Check contacts, permissions and who can collect', actionLabel: 'Review family', route: 'mgmt-family/' + f.id }); });
    if (typeof db.getOutcomesMissing === 'function') db.getOutcomesMissing().forEach(function (o) { add('ATT-024', 'outcome_missing|occurrence:' + o.id, { whenText: o.status + ' ' + K.dm(o.date), title: o.session + ': ' + o.status.toLowerCase() + ' without an outcome', detail: 'Decide what families, the venue and coaches get', actionLabel: 'Decide refunds and credits', route: 'mgmt-occurrence-outcome/' + o.id, related: { occurrence: o.id } }); });
    /* Development */
    if (typeof db.getFeedbackAwaitingReview === 'function') db.getFeedbackAwaitingReview().forEach(function (f) { var p = db.getPlayer(f.player); add('ATT-070', 'feedback_review|' + f.id, { whenText: f.submittedAt ? 'Submitted ' + K.dm(f.submittedAt) : '', title: (p ? p.name : 'A player') + '’s feedback is waiting for review', detail: 'From ' + db.coachName(f.coach) + ' · not visible to the family yet', actionLabel: 'Review feedback', route: 'mgmt-feedback-review/' + f.id, related: { player: f.player } }); });
    if (typeof db.getIdpsNotStarted === 'function') { var ns = db.getIdpsNotStarted(); if (ns.length) add('ATT-071', 'idps_not_started|period', { whenText: 'Review period open', title: ns.length + ' ' + K.label(ns.length === 1 ? 'IDP' : 'IDPs') + ' not started', detail: ns.slice(0, 3).map(function (i) { var p = db.getPlayer(i.player); return p ? p.name : i.player; }).join(', ') + (ns.length > 3 ? ' and ' + (ns.length - 3) + ' more' : ''), actionLabel: 'Open ' + K.label('IDPs'), route: 'mgmt-idps' }); }
    /* Finance */
    if (db.fin) {
      db.getInvoices().forEach(function (i) {
        var st = db.fin.paymentState(i), c = db.getClient(i.client);
        if (st === 'Overdue') { var late = K.daysBetween(i.due, '2026-10-01'); add('ATT-060', 'invoice_overdue|' + i.id, { whenText: late + ' days overdue', forceSev: late >= rule('ATT-060').urgentDaysOverdue ? 'Urgent' : null, forceWhy: 'Over ' + rule('ATT-060').urgentDaysOverdue + ' days overdue', title: i.number + ' to ' + c.name + ' is overdue', detail: K.money(db.fin.balance(i)) + ' · due ' + K.d(i.due) + (i.originalDue && i.originalDue !== i.due ? ' (moved from ' + K.dm(i.originalDue) + ')' : ''), actionLabel: 'Chase payment', route: 'mgmt-fin-invoice/' + i.id, finance: true }); }
        if (i.xero && i.xero.status === 'Failed') add('ATT-061', 'xero_failed|' + i.id, { whenText: K.dm(i.xero.at), title: i.number + ' was not sent to Xero', detail: i.xero.error || '', actionLabel: 'Send to Xero again', route: 'mgmt-fin-invoice/' + i.id, finance: true });
      });
      db.getDrafts().filter(function (d) { return d.state !== 'Issued' && !d.replaces; }).forEach(function (d) { add('ATT-062', 'not_invoiced|' + d.id, { whenText: 'Month ended 30 Sep', title: db.getClient(d.client).name + ': September not invoiced', detail: 'Draft ' + d.id + ' · ' + d.state, actionLabel: 'Finish the invoice', route: 'mgmt-fin-draft/' + d.id, finance: true }); });
    }
    /* Exceptions: accepted cases leave the queue; overrides change severity */
    var open = [], accepted = [];
    cases.forEach(function (c) {
      var ex = D.attentionExceptions.filter(function (e) { return e.caseKey === c.caseKey && !e.revoked; })[0];
      if (ex && ex.type === 'Accepted') { c.exception = ex; accepted.push(c); return; }
      if (ex && ex.type === 'Severity override') { c.originalSeverity = c.severity; c.severity = ex.severity; c.severityReason = 'Overridden: ' + ex.reason; c.exception = ex; }
      open.push(c);
    });
    var order = D.attentionRules.map(function (r) { return r.id; });
    open.sort(function (a, b) { return RANK[b.severity] - RANK[a.severity] || order.indexOf(a.ruleId) - order.indexOf(b.ruleId); });
    var counts = { Urgent: 0, Warning: 0, Normal: 0 }; open.forEach(function (c) { counts[c.severity]++; });
    return { generatedAt: '2026-10-01T14:05:00', summary: { state: counts.Urgent ? 'Urgent' : counts.Warning ? 'Warning' : counts.Normal ? 'Normal' : 'Clear', total: open.length, counts: counts }, cases: open, accepted: accepted };
  }

  /* Read helpers replace the static list in core.js */
  db.getAttention = function () { var a = compute(); D.attention = a; return a; };
  db.getAttentionCases = function () { return db.getAttention().cases; };
  db.getAttentionCase = function (key) { var a = compute(); return a.cases.concat(a.accepted).filter(function (c) { return c.caseKey === key; })[0]; };
  db.getAttentionRules = function () { return D.attentionRules; };
  db.getAttentionRule = function (id) { return rule(id); };
  db.updateAttentionRule = function (id, patch) { var r = rule(id), b = JSON.stringify({ enabled: r.enabled, base: r.base, warnHours: r.warnHours, urgentHours: r.urgentHours, locked: r.locked }); Object.assign(r, patch); K.log({ area: 'Needs attention', summary: 'Changed rule ' + r.id + ' (' + r.name + ')', entity: r.id, before: b, after: JSON.stringify(patch) }); return r; };
  db.getAttentionExceptions = function () { return D.attentionExceptions; };
  db.addAttentionException = function (e) { e.id = 'EXC-' + String(D.attentionExceptions.length + 1).padStart(2, '0'); e.by = K.me(); e.at = K.now(); D.attentionExceptions.push(e); K.log({ area: 'Needs attention', summary: e.type + ': ' + e.title, entity: e.caseKey, before: e.from || 'Open', after: (e.severity || 'Accepted') + ' · approved by ' + e.approver + ' (' + e.reason + ')' }); return e; };
  db.revokeAttentionException = function (id) { var e = D.attentionExceptions.filter(function (x) { return x.id === id; })[0]; e.revoked = { by: K.me(), at: K.now() }; K.log({ area: 'Needs attention', summary: 'Reopened: ' + e.title, entity: e.caseKey, before: e.type, after: 'Open' }); return e; };
  db.getApprovalsWaiting = function () {
    var list = db.getApprovals().map(function (a) { return Object.assign({}, a); });
    if (typeof db.getPendingCoachSignups === 'function') list.forEach(function (a) { if (a.id === 'coach-signups') a.count = db.getPendingCoachSignups().length; });
    if (typeof db.getPendingClaims === 'function') list.forEach(function (a) { if (a.id === 'parent-claims') a.count = db.getPendingClaims().length; });
    return list;
  };
})();
