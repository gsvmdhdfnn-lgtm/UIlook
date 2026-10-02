/* Coaching mock data and helpers (pass 12): session roles and permissions,
   assignments and temporary overrides, availability, documents and
   compliance, cover requests, rate changes, allocation overrides and
   monthly work summaries. All invented. Rate profiles and allocations live
   in db.fin (finance.js); the helpers here operate on those arrays.
   Edge cases on purpose:
   - Tom Reid's first aid expired 14 Sep; a newer upload (30 Sep) awaits verification.
   - Jack Morgan's Enhanced DBS expires 13 Oct (inside the review window).
   - Marcus Bell has no Safeguarding L2 on file (missing).
   - Charlie Hughes is unavailable this evening (1 Oct) for U12 Academy.
   - Tom Reid is on holiday 12–16 Oct; his Riverside PPA occurrences need cover.
   - U13/14 Development on Fri 2 Oct has no coach.
   - Jack Morgan was removed from Kingsmead After School on 14 Sep; his
     former access ends 21 days later (5 Oct).
   - Charlie Hughes's September work summary is ready to finalise. */
(function () {
  var D = Hub.data, db = Hub.db, K = Hub.kit, F = db.fin;
  function pick(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }
  function hours(o) { var a = o.start.split(':'), b = o.end.split(':'); return ((+b[0] * 60 + +b[1]) - (+a[0] * 60 + +a[1])) / 60; }
  var C = D.coaching = {};

  /* ---------- Session roles and permissions ---------- */
  C.permissions = [
    { id: 'viewPlayers', label: 'View players', hint: 'Full player profiles, including restricted details where allowed' },
    { id: 'namesOnly', label: 'View names only', hint: 'First names and age group, nothing else' },
    { id: 'feedback', label: 'Add feedback', hint: 'Write session feedback for players' },
    { id: 'editPlans', label: 'Edit development plans', hint: 'Change targets in a development plan' },
    { id: 'attendance', label: 'Record attendance', hint: 'Mark registers for their sessions' },
    { id: 'comms', label: 'Send communications', hint: 'Message families of players in their sessions' }
  ];
  C.roles = [
    { id: 'lead', name: 'Lead Coach', sessionRole: 'Lead', desc: 'Runs the session and is accountable for the group.', perms: { viewPlayers: true, namesOnly: false, feedback: true, editPlans: true, attendance: true, comms: true } },
    { id: 'coach', name: 'Coach', sessionRole: 'Coach', desc: 'Delivers part of the session under the lead.', perms: { viewPlayers: true, namesOnly: false, feedback: true, editPlans: true, attendance: true, comms: false } },
    { id: 'learning', name: 'Learning Coach', sessionRole: 'Learning', desc: 'On placement. Never left alone with a group.', perms: { viewPlayers: false, namesOnly: true, feedback: false, editPlans: false, attendance: false, comms: false } },
    { id: 'office', name: 'Office', sessionRole: null, desc: 'Office staff: registers and family contact, no coaching.', perms: { viewPlayers: true, namesOnly: false, feedback: false, editPlans: false, attendance: true, comms: true } }
  ];
  C.roleHistory = [
    { text: 'Learning Coach: "Record attendance" switched off (lead coach takes the register)', who: 'Josh Evans', at: '2026-09-28T10:05', tone: 'warn' },
    { text: 'Coach: "Edit development plans" switched on', who: 'Josh Evans', at: '2026-09-28T10:04', tone: 'info' },
    { text: 'Learning Coach: "View names only" switched on', who: 'Josh Evans', at: '2026-07-01T09:10', tone: 'info' },
    { text: 'Coach: "Edit development plans" switched off', who: 'Josh Evans', at: '2026-04-14T15:22', tone: 'warn' }
  ];
  function roleKey(sessionRole) { return { Lead: 'lead', Coach: 'coach', Learning: 'learning' }[sessionRole] || 'coach'; }

  /* Temporary role overrides and removed assignments */
  C.overrides = [
    { id: 'ROV-01', coach: 'ellie', session: 'SES-01', role: 'coach', from: '2026-10-05', to: '2026-10-30', reason: 'Placement assessment: leads warm-ups and one practice each week', by: 'David Cole', at: '2026-09-29T09:20', ended: null },
    { id: 'ROV-02', coach: 'charlie', session: 'SES-02', role: 'lead', from: '2026-10-08', to: '2026-10-22', reason: 'David Cole is on an FA course on Thursday evenings', by: 'Josh Evans', at: '2026-09-25T16:40', ended: null }
  ];
  C.removed = [
    { id: 'RMV-01', coach: 'jack', sessionName: 'Kingsmead After School', session: null, role: 'Lead', removedAt: '2026-09-14T10:00', by: 'Josh Evans', reason: 'Kingsmead Primary paused the service until January', accessUntil: '2026-10-05' }
  ];
  C.accessWindowDays = 21;

  /* ---------- Coach status history ---------- */
  C.statusHistory = {};

  /* ---------- Availability: weekly pattern (Mon first) and exceptions ---------- */
  C.dows = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  function wk(o) { return C.dows.map(function (d) { return o[d] || null; }); }
  C.weekly = {
    david: wk({ Mon: ['09:00', '21:00'], Tue: ['09:00', '21:00'], Wed: ['09:00', '21:00'], Thu: ['09:00', '21:00'], Fri: ['09:00', '21:00'], Sat: ['09:00', '13:00'] }),
    josh: wk({ Mon: ['09:00', '18:00'], Tue: ['09:00', '18:00'], Wed: ['09:00', '18:00'], Thu: ['09:00', '18:00'], Fri: ['09:00', '18:00'] }),
    charlie: wk({ Mon: ['16:00', '21:00'], Tue: ['16:00', '21:00'], Thu: ['16:00', '21:00'], Sat: ['09:00', '12:00'] }),
    jack: wk({ Mon: ['15:30', '21:00'], Tue: ['15:30', '21:00'], Wed: ['15:30', '21:00'], Thu: ['15:30', '21:00'], Fri: ['15:30', '21:00'] }),
    tom: wk({ Mon: ['08:30', '16:00'], Tue: ['08:30', '16:00'], Wed: ['08:30', '16:00'], Thu: ['08:30', '16:00'], Fri: ['08:30', '16:00'] }),
    ellie: wk({ Tue: ['16:00', '19:00'], Thu: ['16:00', '19:00'] }),
    priya: wk({ Mon: ['12:00', '18:00'], Tue: ['12:00', '18:00'], Wed: ['12:00', '18:00'], Thu: ['12:00', '18:00'], Fri: ['12:00', '18:00'] }),
    marcus: wk({ Mon: ['17:00', '21:00'], Wed: ['17:00', '21:00'], Thu: ['17:00', '21:00'], Fri: ['17:00', '21:00'], Sat: ['09:00', '13:00'] })
  };
  C.weeklyUpdated = { by: 'Coaches (self-service)', at: '2026-09-01T09:00' };
  C.exceptions = [
    { id: 'AVX-01', coach: 'charlie', type: 'Unavailable', from: '2026-10-01', to: '2026-10-01', start: '18:45', end: '21:00', reason: 'Family commitment this evening (U12 Academy)', by: 'Charlie Hughes', at: '2026-09-30T18:12' },
    { id: 'AVX-02', coach: 'tom', type: 'Holiday', from: '2026-10-12', to: '2026-10-16', start: null, end: null, reason: 'Family holiday (booked in July)', by: 'Tom Reid', at: '2026-09-28T20:14' },
    { id: 'AVX-03', coach: 'priya', type: 'Different hours', from: '2026-10-06', to: '2026-10-06', start: '14:00', end: '18:00', reason: 'Dentist in the morning', by: 'Priya Nair', at: '2026-09-27T12:30' },
    { id: 'AVX-04', coach: 'jack', type: 'Unavailable', from: '2026-09-22', to: '2026-09-22', start: null, end: null, reason: 'Unwell', by: 'Jack Morgan', at: '2026-09-22T07:40' }
  ];

  /* ---------- Documents and compliance ---------- */
  C.docTypes = [
    { id: 'dbs', name: 'Enhanced DBS', validYears: 3, required: true, appliesTo: ['lead', 'coach', 'learning'], leadDays: 30, by: 'Josh Evans', at: '2025-08-20T10:00' },
    { id: 'firstaid', name: 'First aid', validYears: 3, required: true, appliesTo: ['lead', 'coach'], leadDays: 30, by: 'Josh Evans', at: '2025-08-20T10:00' },
    { id: 'safeguarding', name: 'Safeguarding L2', validYears: 3, required: true, appliesTo: ['lead', 'coach', 'learning'], leadDays: 45, by: 'Josh Evans', at: '2025-08-20T10:00' },
    { id: 'qualification', name: 'Coaching qualification', validYears: null, required: true, appliesTo: ['lead', 'coach'], leadDays: 0, reviewMonths: 24, by: 'Josh Evans', at: '2025-08-20T10:00' }
  ];
  C.docs = [];
  function doc(coach, type, issued, expires, ref, ver, extra) {
    var d = Object.assign({ id: 'DOC-' + String(C.docs.length + 101), coach: coach, type: type, ref: ref, issued: issued, expires: expires,
      reviewDue: null, uploaded: { by: db.coachName(coach), at: K.addDays(issued, 4) + 'T19:00' }, verification: ver, history: [] }, extra || {});
    C.docs.push(d); return d;
  }
  function verified(by, at) { return { state: 'Verified', by: by, at: at, note: '' }; }
  var JE = 'Josh Evans', DC = 'David Cole';
  /* Everyone's standard set */
  [['david', '2025-03-10', '2024-11-02', '2025-01-15', 'UEFA B'], ['josh', '2024-06-04', '2025-02-12', '2024-09-20', 'UEFA A'], ['charlie', '2025-01-20', '2025-06-08', '2025-03-03', 'UEFA C'],
    ['jack', '2023-10-13', '2025-04-17', '2024-10-09', 'FA Level 2'], ['tom', '2024-02-26', '2023-09-14', '2024-03-11', 'FA Level 2'], ['ellie', '2026-06-10', null, '2026-06-24', null],
    ['priya', '2024-04-02', '2025-11-21', '2024-05-14', 'FA Level 2'], ['marcus', '2025-08-11', '2025-08-25', null, 'FA Level 1']].forEach(function (r, i) {
    var who = i % 2 ? DC : JE;
    doc(r[0], 'dbs', r[1], K.addDays(r[1], 365 * 3), 'DBS-00' + (1820 + i * 37), verified(who, K.addDays(r[1], 6) + 'T10:15'));
    if (r[2]) doc(r[0], 'firstaid', r[2], K.addDays(r[2], 365 * 3 + 1), 'FA-' + (4410 + i * 13), verified(who, K.addDays(r[2], 5) + 'T11:30'));
    if (r[3]) doc(r[0], 'safeguarding', r[3], K.addDays(r[3], 365 * 3), 'SG2-' + (770 + i * 9), verified(who, K.addDays(r[3], 3) + 'T09:45'));
    if (r[4]) doc(r[0], 'qualification', K.addDays(r[1], -200), null, r[4], verified(who, K.addDays(r[1], -190) + 'T14:00'), { level: r[4] });
  });
  /* Edge cases: Tom's first aid expired 14 Sep 2026 (issued 2023-09-14 + 3y); a newer certificate is pending. */
  var tomOld = C.docs.filter(function (d) { return d.coach === 'tom' && d.type === 'firstaid'; })[0];
  tomOld.expires = '2026-09-14';
  doc('tom', 'firstaid', '2026-09-27', '2029-09-26', 'FA-5120', { state: 'Pending', by: null, at: null, note: '' }, { uploaded: { by: 'Tom Reid', at: '2026-09-30T19:03' } });
  /* Jack's DBS expires 13 Oct 2026 (issued 2023-10-13). */
  var jackDbs = C.docs.filter(function (d) { return d.coach === 'jack' && d.type === 'dbs'; })[0]; jackDbs.expires = '2026-10-13';
  C.docs.forEach(function (d) {
    var t = typeOf(d.type);
    d.reviewDue = d.expires ? K.addDays(d.expires, -t.leadDays) : (t.reviewMonths ? K.addDays(d.issued, 30 * t.reviewMonths) : null);
    d.history = [{ text: 'Uploaded', who: d.uploaded.by, at: d.uploaded.at }];
    if (d.verification.state === 'Verified') d.history.push({ text: 'Verified', who: d.verification.by, at: d.verification.at, tone: 'ok' });
  });
  function typeOf(id) { return pick(C.docTypes, id); }

  function docState(d) {
    if (d.verification.state === 'Rejected') return 'Rejected';
    if (d.verification.state === 'Pending') return 'Pending verification';
    if (d.expires && d.expires < K.today) return 'Expired';
    if (d.expires && d.reviewDue <= K.today) return 'Expiring';
    return 'Verified';
  }
  function requiredTypes(coach) {
    var c = db.getCoach(coach); if (!c) return [];
    return C.docTypes.filter(function (t) { return t.required && t.appliesTo.indexOf(c.type) >= 0; });
  }
  /* One line per required type: the state that matters for compliance. */
  function compliance(coach) {
    return requiredTypes(coach).map(function (t) {
      var docs = C.docs.filter(function (d) { return d.coach === coach && d.type === t.id && d.verification.state !== 'Rejected'; }).sort(function (a, b) { return a.uploaded.at < b.uploaded.at ? 1 : -1; });
      var current = docs.filter(function (d) { return d.verification.state === 'Verified'; })[0];
      var pending = docs.filter(function (d) { return d.verification.state === 'Pending'; })[0];
      var state = !current ? (pending ? 'Pending verification' : 'Missing') : docState(current);
      return { type: t, doc: current || null, pending: pending || null, state: state };
    });
  }

  /* ---------- Cover requests ---------- */
  C.cover = [];
  function need(occId, absent) { return { id: '', occurrence: occId, absent: absent, state: 'Open', offers: [], confirmed: null, phone: null }; }
  function cvr(o) {
    o.id = 'CVR-' + String(C.cover.length + 1).padStart(2, '0');
    o.needs.forEach(function (n, i) { n.id = o.id + '-' + (i + 1); });
    C.cover.push(o); return o;
  }
  /* The mock requests are raised through the same cover functions the Hub uses (see coach-hub.js),
     so they behave exactly like real ones: offered to every eligible coach, each date on its own. */

  /* ---------- Work summaries (September 2026) ---------- */
  C.summaries = [];
  function freeze(coach, month) {
    /* Only work confirmed as delivered goes into a summary */
    return F.allocations.filter(function (a) { return a.coach === coach && a.date.slice(0, 7) === month && a.state !== 'Draft'; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; }).map(function (a) {
      var o = db.getOccurrence(a.occurrence);
      return { allocation: a.id, occurrence: a.occurrence, date: a.date, session: o ? o.session : '', role: a.role, units: a.units, rate: a.rate, cost: a.cost, override: a.override ? a.override.reason : a.adjustment ? 'Correction: ' + a.adjustment.reason : '' };
    });
  }
  C.freeze = freeze;
  var month = '2026-09';
  [['charlie', 'Needs review'], ['jack', 'Finalised'], ['tom', 'Needs review'], ['priya', 'Queried'], ['marcus', 'Needs review']].forEach(function (s, i) {
    var lines = freeze(s[0], month), name = db.coachName(s[0]);
    var ws = { id: 'WS-' + String(901 + i), coach: s[0], month: month, label: 'September 2026', state: s[1], cycle: 1, lines: lines, total: K.sum(lines, 'cost'), frozenAt: '2026-10-01T06:00', frozenBy: 'System',
      cycles: [{ n: 1, frozenAt: '2026-10-01T06:00', total: K.sum(lines, 'cost'), events: [{ text: 'Prepared from ' + lines.length + ' pay items for Management to review', who: 'System', at: '2026-10-01T06:00' }] }] };
    var ev = ws.cycles[0].events;
    if (s[0] === 'jack') {
      ev.push({ text: 'Finalised and sent for the 7 Oct coach payment; ' + name + ' told', who: JE, at: '2026-10-01T09:40', tone: 'ok' });
      ws.finalised = { by: JE, at: '2026-10-01T09:40' };
      F.allocations.forEach(function (a) { if (a.coach === 'jack' && a.date.slice(0, 7) === month) { a.state = 'Exported'; a.exported = { by: JE, at: '2026-10-01T09:40', summary: ws.id }; } });
    }
    if (s[0] === 'tom') {
      /* Cycle 1 was queried over the 10 Sep override, then reopened. */
      ev.push({ text: 'Queried by coach: 10 Sep should be the agreed £60.00 for three classes', who: name, at: '2026-09-11T08:05', tone: 'warn' },
        { text: 'Reopened after the pay was adjusted', who: JE, at: '2026-09-11T09:32', tone: 'info' });
      ws.cycles[0].frozenAt = '2026-09-11T06:00'; ws.cycles[0].events[0].at = '2026-09-11T06:00'; ws.cycles[0].events[0].text = 'Prepared early (mid-month check) and finalised; ' + name + ' told';
      ws.cycles[0].total = ws.total - 6000 + 5000;
      ws.cycle = 2; ws.cycles.push({ n: 2, frozenAt: '2026-10-01T06:00', total: ws.total, events: [{ text: 'Prepared again from ' + lines.length + ' pay items for Management to review', who: 'System', at: '2026-10-01T06:00' }] });
    }
    if (s[0] === 'priya') {
      /* Finalised, then queried by the coach from the Coach hub */
      ev.push({ text: 'Finalised and sent for the 7 Oct coach payment; ' + name + ' told', who: JE, at: '2026-10-01T09:10', tone: 'ok' });
      ws.finalised = { by: JE, at: '2026-10-01T09:10' };
      F.allocations.forEach(function (a) { if (a.coach === 'priya' && a.date.slice(0, 7) === month) { a.state = 'Exported'; a.exported = { by: JE, at: '2026-10-01T09:10', summary: ws.id }; } });
      ev.push({ text: 'Queried by coach: Northgate After-School on Fri 18 Sep ran its full hour before the alarm', who: name, at: '2026-10-01T10:20', tone: 'warn' }); ws.query = { text: 'Northgate After-School on Fri 18 Sep ran its full hour before the alarm', by: name, at: '2026-10-01T10:20' }; }
    C.summaries.push(ws);
  });

  /* ---------- Read helpers ---------- */
  db.getRoles = function () { return C.roles; };
  db.getRole = function (id) { return pick(C.roles, id); };
  db.getPermissions = function () { return C.permissions; };
  db.getRoleHistory = function () { return C.roleHistory; };
  db.roleOfSessionRole = function (sr) { return pick(C.roles, roleKey(sr)); };
  /* Regular assignments come from each session's staff, minus removed ones. */
  db.getAssignments = function (coach) {
    var out = [];
    db.getSessions().forEach(function (s) {
      (s.staff || []).forEach(function (st) {
        if (coach && st.coach !== coach) return;
        if (s.lifecycle !== 'Active') return;
        out.push({ coach: st.coach, session: s.id, sessionName: s.name, role: roleKey(st.role), sessionRole: st.role, days: s.days, start: s.start, end: s.end, venue: s.venue });
      });
    });
    return out;
  };
  db.getRoleOverrides = function (coach) { return C.overrides.filter(function (o) { return !coach || o.coach === coach; }); };
  db.getRemovedAssignments = function (coach) { return C.removed.filter(function (r) { return !coach || r.coach === coach; }); };
  db.accessDaysLeft = function (r) { return Math.max(0, K.daysBetween(K.today, r.accessUntil)); };
  db.getCoachStatusHistory = function (coach) { return C.statusHistory[coach] || []; };

  db.getWeeklyAvailability = function (coach) { return C.weekly[coach] || wk({}); };
  db.getWeeklyUpdated = function () { return C.weeklyUpdated; };
  db.getAvailabilityExceptions = function (coach) { return C.exceptions.filter(function (e) { return !coach || e.coach === coach; }).sort(function (a, b) { return a.from < b.from ? -1 : 1; }); };
  db.getDows = function () { return C.dows; };
  /* Is the coach free for an occurrence? Returns { ok, reason }. */
  db.coachAvailableFor = function (coach, o) {
    var dow = (K.parse(o.date).getDay() + 6) % 7, w = db.getWeeklyAvailability(coach)[dow];
    var ex = C.exceptions.filter(function (e) { return e.coach === coach && e.from <= o.date && e.to >= o.date && (e.back || []).indexOf(o.date) < 0; })[0];
    if (ex && ex.type !== 'Different hours') {
      if (!ex.start || (ex.start < o.end && ex.end > o.start)) return { ok: false, reason: ex.type + (ex.start ? ' ' + ex.start + '–' + ex.end : '') };
    }
    if (ex && ex.type === 'Different hours') w = [ex.start, ex.end];
    if (!w) return { ok: false, reason: 'Not available on ' + C.dows[dow] + 's' };
    if (w[0] > o.start || w[1] < o.end) return { ok: false, reason: 'Available ' + w[0] + '–' + w[1] + ' that day' };
    var clash = db.getOccurrences(function (x) { return x.date === o.date && x.id !== o.id && x.status !== 'Cancelled' && x.start < o.end && x.end > o.start && x.staff.some(function (s) { return s.coach === coach && !s.unavailable; }); })[0];
    if (clash) return { ok: false, reason: 'Already on ' + clash.session + ' ' + clash.start + '–' + clash.end };
    return { ok: true, reason: w[0] + '–' + w[1] };
  };

  db.getDocTypes = function () { return C.docTypes; };
  db.getDocType = typeOf;
  db.getDocuments = function (f) { return f ? C.docs.filter(f) : C.docs; };
  db.getDocument = function (id) { return pick(C.docs, id); };
  db.docState = docState;
  db.getRequiredDocTypes = requiredTypes;
  db.getCoachCompliance = compliance;
  /* Overall: worst state for a coach, with a short label */
  db.getCoachComplianceSummary = function (coach) {
    var list = compliance(coach), order = ['Expired', 'Missing', 'Expiring', 'Pending verification'];
    for (var i = 0; i < order.length; i++) {
      var hit = list.filter(function (x) { return x.state === order[i]; })[0];
      if (hit) {
        var txt = order[i] === 'Expired' ? hit.type.name + ' expired ' + K.dm(hit.doc.expires) : order[i] === 'Missing' ? hit.type.name + ' missing' : order[i] === 'Expiring' ? hit.type.name + ' expires ' + K.dm(hit.doc.expires) : hit.type.name + ' awaiting check';
        return { state: order[i], text: txt, tone: i < 2 ? 'danger' : 'warn' };
      }
    }
    return { state: 'Current', text: 'Docs current', tone: 'ok' };
  };
  /* Needs Attention: every expired, missing, expiring or pending item. */
  db.getComplianceIssues = function () {
    var out = [];
    db.getCoaches().forEach(function (c) {
      if (!c.active) return;
      compliance(c.id).forEach(function (x) {
        var base = { coach: c.id, coachName: c.name, type: x.type.id, typeName: x.type.name };
        if (x.state === 'Expired') out.push(Object.assign({ kind: 'expired', severity: 'Urgent', doc: x.doc.id, date: x.doc.expires, title: c.name + '’s ' + x.type.name + ' expired on ' + K.dm(x.doc.expires) }, base));
        if (x.state === 'Missing') out.push(Object.assign({ kind: 'missing', severity: 'Warning', doc: null, date: null, title: c.name + ' has no ' + x.type.name + ' on file' }, base));
        if (x.state === 'Expiring') out.push(Object.assign({ kind: 'expiring', severity: 'Warning', doc: x.doc.id, date: x.doc.expires, days: K.daysBetween(K.today, x.doc.expires), title: c.name + '’s ' + x.type.name + ' expires in ' + K.daysBetween(K.today, x.doc.expires) + ' days' }, base));
        if (x.pending) out.push(Object.assign({ kind: 'pending', severity: 'Normal', doc: x.pending.id, date: x.pending.uploaded.at.slice(0, 10), title: x.type.name + ' from ' + c.name + ' awaits verification' }, base));
      });
    });
    return out;
  };

  db.getCoverRequests = function (f) { return f ? C.cover.filter(f) : C.cover; };
  db.getCoverRequest = function (id) { return pick(C.cover, String(id || '').split('/')[0]); };
  db.coverStatus = function (r) {
    var s = r.needs.map(function (n) { return n.state; });
    if (s.every(function (x) { return x === 'Covered'; })) return 'Covered';
    if (s.some(function (x) { return x === 'Open' || x === 'Needs a phone call'; })) return 'Open';
    return 'In progress';
  };
  /* Needs Attention: every cover need that is not yet covered. */
  db.getOpenCover = function () {
    var out = [];
    C.cover.forEach(function (r) { r.needs.forEach(function (n) { if (n.state !== 'Covered') out.push({ request: r.id, need: n.id, occurrence: n.occurrence, state: n.state, absent: n.absent, kind: r.kind, date: db.getOccurrence(n.occurrence).date }); }); });
    return out.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  };
  db.getCoverNeed = function (reqId, needId) { var r = pick(C.cover, reqId); return r && r.needs.filter(function (n) { return n.id === needId; })[0]; };
  /* Normal rate and expected cost for a coach on an occurrence */
  db.coverRate = function (coach, o) {
    var r = F.rateFor(coach, o.date), rate = r ? (o.start < '15:00' ? r.day : r.evening) : 0;
    return { rate: rate, units: hours(o), cost: Math.round(rate * hours(o)), profile: r, note: r && r.note };
  };
  function mins(t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; }
  /* Free, but working right before or after (within 30 minutes): shown as a flag, not excluded */
  function backToBack(coach, o) {
    var near = db.getOccurrences(function (x) { return x.date === o.date && x.id !== o.id && x.status !== 'Cancelled' && x.staff.some(function (s) { return s.coach === coach && !s.unavailable; }) &&
      ((mins(x.end) <= mins(o.start) && mins(o.start) - mins(x.end) <= 30) || (mins(x.start) >= mins(o.end) && mins(x.start) - mins(o.end) <= 30)); })[0];
    return near ? 'Working ' + near.start + '–' + near.end + (near.end <= o.start ? ' just before' : ' just after') + ' (' + near.session + ')' : '';
  }
  db.coverFlag = function (coach, o) { return backToBack(coach, o); };
  function otherAcceptance(coach, o, needId) {
    var hit = null;
    C.cover.forEach(function (r) { r.needs.forEach(function (n) {
      if (hit || n.id === needId || n.state === 'Covered') return;
      var x = db.getOccurrence(n.occurrence);
      if (x && x.date === o.date && x.start < o.end && x.end > o.start && n.offers.some(function (f) { return f.coach === coach && f.response === 'Accepted' && !f.closed; })) hit = x;
    }); });
    return hit;
  }
  /* Suggested coaches for a need: every other active coach, eligible first */
  db.getCoverCandidates = function (reqId, needId) {
    var n = db.getCoverNeed(reqId, needId), o = db.getOccurrence(n.occurrence);
    var away = n.absent && o.staff.filter(function (s) { return s.coach === n.absent; })[0], place = away ? (away.actualRole || away.role) : 'Lead';
    var mine = function (c) { return n.offers.filter(function (f) { return f.coach === c && live(f); }); };
    return db.getCoaches().filter(function (c) { return c.active && c.id !== n.absent && !o.staff.some(function (s) { return s.coach === c.id && !s.unavailable; }); }).map(function (c) {
      var av = db.coachAvailableFor(c.id, o), comp = db.getCoachComplianceSummary(c.id), why = [];
      var ok = av.ok;
      if (!av.ok) why.push(av.reason);
      if (c.type === 'learning' && place !== 'Learning') { ok = false; why.push('Learning Coaches only cover a Learning Coach place'); }
      if (comp.state === 'Expired' || comp.state === 'Missing') { ok = false; why.push(comp.text); }
      var m = mine(c.id);
      if (m.some(function (f) { return f.response === 'Declined'; })) { ok = false; why.push('Said they can’t'); }
      if (m.some(function (f) { return !f.response; })) { ok = false; why.push('Offered, waiting for a reply'); }
      if (m.some(function (f) { return f.response === 'Accepted'; })) { ok = false; why.push('Said they can cover'); }
      /* Already said yes to cover something else at the same time */
      var elsewhere = otherAcceptance(c.id, o, n.id);
      if (elsewhere) { ok = false; why.push('Said yes to ' + elsewhere.session + ' ' + elsewhere.start + '–' + elsewhere.end + ' that day'); }
      var r = db.coverRate(c.id, o);
      return { coach: c, eligible: ok, reasons: why, flag: backToBack(c.id, o), available: av, compliance: comp, rate: r.rate, cost: r.cost, units: r.units, note: r.note };
    }).sort(function (a, b) { return (b.eligible - a.eligible) || (a.cost - b.cost); });
  };

  db.getWorkSummaries = function (f) { return f ? C.summaries.filter(f) : C.summaries; };
  db.getWorkSummary = function (id) { return pick(C.summaries, id); };
  /* Needs Attention: summaries a manager can finalise now */
  /* Waiting on Management: new summaries to read and finalise, and coach queries */
  db.getSummariesReady = function () { return C.summaries.filter(function (s) { return s.state === 'Needs review' || s.state === 'Queried' || s.stale; }); };
  db.getCoachWeekCount = function (coach) {
    return db.getOccurrences(function (o) { return o.date >= '2026-09-28' && o.date <= '2026-10-04' && o.status !== 'Cancelled' && o.staff.some(function (s) { return s.coach === coach && !s.unavailable; }); }).length;
  };
  db.getCoachUpcoming = function (coach, n) {
    return db.getOccurrences(function (o) { return o.date >= K.today && o.status !== 'Cancelled' && o.staff.some(function (s) { return s.coach === coach; }); }).slice(0, n || 5);
  };

  /* ---------- Write helpers (in memory only) ---------- */
  db.setCoachActive = function (coach, on, who, at) {
    var c = db.getCoach(coach); c.active = !!on;
    (C.statusHistory[coach] = C.statusHistory[coach] || []).unshift({ text: on ? 'Marked active' : 'Marked inactive', who: who, at: at, tone: on ? 'ok' : 'warn' });
    if (on) keepOffering(at);
    return c;
  };
  db.setRolePermission = function (roleId, perm, on, who, at) {
    var r = pick(C.roles, roleId); r.perms[perm] = !!on;
    C.roleHistory.unshift({ text: r.name + ': "' + pick(C.permissions, perm).label + '" switched ' + (on ? 'on' : 'off'), who: who, at: at, tone: on ? 'info' : 'warn' });
    return r;
  };
  db.addRoleOverride = function (o) { o.id = 'ROV-' + String(C.overrides.length + 1).padStart(2, '0'); o.ended = null; C.overrides.push(o); return o; };
  db.endRoleOverride = function (id, who, at) { var o = pick(C.overrides, id); o.ended = { by: who, at: at }; return o; };
  /* Coming off a session's regular coaches keeps read-only access to its players for 21 days from that date */
  db.addFormerAccess = function (coach, sessionId, role, from, who, at, reason) {
    var s = db.getSession(sessionId);
    var r = { id: 'RMV-' + String(C.removed.length + 1).padStart(2, '0'), coach: coach, sessionName: s.name, session: s.id, role: role || 'Coach', removedAt: from + 'T00:00', by: who, reason: reason || 'Changed by management', accessUntil: K.addDays(from, C.accessWindowDays) };
    C.removed.push(r); return r;
  };
  db.addAvailabilityException = function (e) { e.id = 'AVX-' + String(C.exceptions.reduce(function (m, x) { return Math.max(m, +x.id.slice(4) || 0); }, 0) + 1).padStart(2, '0'); C.exceptions.push(e); return e; };
  db.removeAvailabilityException = function (id) { C.exceptions = C.exceptions.filter(function (e) { return e.id !== id; }); };
  /* The usual week can't silently clash with dates the coach is on: change those sessions, or mark the dates as time off */
  db.weeklyClashes = function (coach, dayIdx, win) {
    return db.getOccurrences(function (o) { return (K.parse(o.date).getDay() + 6) % 7 === dayIdx && o.status === 'Scheduled' && !o.delivery && !db.hasStarted(o) &&
      o.staff.some(function (s) { return s.coach === coach && !s.unavailable; }) && (!win || win[0] > o.start || win[1] < o.end); });
  };
  db.setWeeklyAvailability = function (coach, dayIdx, win, who, at) {
    var clash = db.weeklyClashes(coach, dayIdx, win);
    if (clash.length) return { error: clash };
    C.weekly[coach][dayIdx] = win; C.weeklyUpdated = { by: who, at: at }; keepOffering(at); return { ok: true };
  };

  db.verifyDocument = function (id, who, at) {
    var d = pick(C.docs, id); d.verification = { state: 'Verified', by: who, at: at, note: '' };
    d.history.push({ text: 'Verified', who: who, at: at, tone: 'ok' }); keepOffering(at); return d;
  };
  db.rejectDocument = function (id, reason, who, at) {
    var d = pick(C.docs, id); d.verification = { state: 'Rejected', by: who, at: at, note: reason };
    d.history.push({ text: 'Rejected', detail: reason, who: who, at: at, tone: 'danger' }); return d;
  };
  db.addDocument = function (o) {
    var t = typeOf(o.type);
    var d = Object.assign({ id: 'DOC-' + String(C.docs.length + 101), verification: { state: 'Pending', by: null, at: null, note: '' } }, o);
    d.reviewDue = d.expires ? K.addDays(d.expires, -t.leadDays) : null;
    d.history = [{ text: 'Uploaded', who: d.uploaded.by, at: d.uploaded.at }];
    C.docs.push(d); return d;
  };
  db.setDocLeadDays = function (typeId, days, who, at) { var t = typeOf(typeId); t.leadDays = days; t.by = who; t.at = at; C.docs.forEach(function (d) { if (d.type === typeId && d.expires) d.reviewDue = K.addDays(d.expires, -days); }); return t; };

  /* ============================================================ COVER
     One source of truth for cover. A request groups dates for convenience; every date (a "need")
     moves on its own: Open → Offered → Accepted → Covered. "Covered" also holds a date that is no
     longer needed (confirmed.coach is null and confirmed.ended says why).
     - The Hub finds every eligible coach and offers the date to all of them at once (Hub and email).
     - Saying yes never assigns anyone: Management chooses.
     - The shared staffing steps put the chosen coach on that date only, at the agreed rate for the date.
     - Time off that touches a date the coach is on always takes them off it and starts cover,
       so that date can never look ready. */
  var HUB = 'The Hub';
  function live(f) { return !f.closed && f.response !== 'Filled'; }
  function liveNeed(n) { return !!n && n.state !== 'Covered'; }
  function occOf(n) { return db.getOccurrence(n.occurrence); }
  function whenOf(o) { return o.session + ', ' + K.dd(o.date) + ', ' + o.start; }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function needState(n) {
    if (!liveNeed(n)) return;
    var fs = n.offers.filter(live);
    n.state = fs.some(function (f) { return f.response === 'Accepted'; }) ? 'Accepted' : fs.some(function (f) { return !f.response; }) ? 'Offered' : n.phone ? 'Needs a phone call' : 'Open';
  }
  db.coverNeedsFor = function (occId) {
    var out = []; C.cover.forEach(function (r) { r.needs.forEach(function (n) { if (n.occurrence === occId && liveNeed(n)) out.push({ request: r, need: n }); }); }); return out;
  };
  /* Does this time off take the coach away from this date? A "Different hours" day counts when the session falls outside them. */
  function exHits(e, o) {
    if (e.from > o.date || e.to < o.date || (e.back || []).indexOf(o.date) >= 0) return false;
    if (e.type === 'Different hours') return !!e.start && !(e.start <= o.start && e.end >= o.end);
    return !e.start || (e.start < o.end && e.end > o.start);
  }
  db.awayFrom = function (coach, o) { return C.exceptions.filter(function (e) { return e.coach === coach && exHits(e, o); })[0] || null; };
  /* Dates the coach is on that the time off reaches: still to start, not confirmed */
  function touched(e) {
    return db.getOccurrences(function (o) { return o.status === 'Scheduled' && !o.delivery && !o.draft && !db.hasStarted(o) && exHits(e, o) && o.staff.some(function (s) { return s.coach === e.coach && !s.unavailable; }); });
  }
  db.timeOffTouches = function (e) { return touched(Object.assign({ back: [] }, e)); };

  /* A coach can't coach some dates (or a date has no coach): they come off those dates as away,
     and each date is offered to every eligible coach. */
  db.raiseCover = function (spec, who, at) {
    var absent = spec.coach || null;
    var occs = spec.occurrences.filter(function (o) { return o && !db.coverNeedsFor(o.id).some(function (x) { return x.need.absent === absent; }); })
      .sort(function (a, b) { return (a.date + a.start) < (b.date + b.start) ? -1 : 1; });
    if (!occs.length) return null;
    var label = absent ? db.coachName(absent) + ' can’t coach' : 'No coach';
    var r = cvr({ coach: absent, kind: spec.kind || (absent ? 'Unavailable' : 'No coach'), from: spec.from || occs[0].date, to: spec.to || occs[occs.length - 1].date, reason: spec.reason || '', requestedBy: who, at: at, exception: spec.exception || null,
      needs: occs.map(function (o) { return need(o.id, absent); }),
      history: [{ text: label + ': ' + occs.length + ' date' + (occs.length === 1 ? '' : 's') + ' need cover', detail: spec.reason || '', who: who, at: at, tone: 'warn' }] });
    occs.forEach(function (o) {
      if (absent) db.staffTakeOff(o, absent, { keepAway: true });
      (o.history = o.history || []).push({ text: label + ' on this date: finding cover', detail: spec.reason || '', who: who, at: at, tone: 'warn' });
    });
    if (!spec.noAutoSend) r.needs.forEach(function (n) { db.offerAllEligible(r.id, n.id, HUB, at); });
    return r;
  };
  /* Time off, from the coach or from Management */
  db.recordTimeOff = function (e, who, at) {
    var ex = db.addAvailabilityException({ coach: e.coach, type: e.type, from: e.from, to: e.to || e.from, start: e.start || null, end: e.end || null, reason: e.reason, by: who, at: at });
    var occs = touched(ex);
    var r = occs.length ? db.raiseCover({ coach: e.coach, occurrences: occs, kind: e.kind || (e.type === 'Holiday' ? 'Holiday' : 'Unavailable'), reason: e.reason, exception: ex.id, from: ex.from, to: ex.to, noAutoSend: e.noAutoSend }, who, at) : null;
    keepOffering(at);
    return { exception: ex, request: r, dates: occs.length };
  };
  db.addCoverRequest = function (o, who, at) {
    return db.recordTimeOff({ coach: o.coach, type: o.kind === 'Holiday' ? 'Holiday' : 'Unavailable', kind: o.kind, from: o.from, to: o.to, reason: o.reason, noAutoSend: o.noAutoSend }, who, at).request;
  };
  /* Safety net: any time off already on file that still leaves the coach on a date starts cover for it */
  db.sweepTimeOff = function (who, at) {
    var made = [];
    C.exceptions.slice().forEach(function (e) {
      var occs = touched(e); if (!occs.length) return;
      var r = db.raiseCover({ coach: e.coach, occurrences: occs, kind: e.type === 'Holiday' ? 'Holiday' : 'Unavailable', reason: e.reason, exception: e.id, from: e.from, to: e.to }, who, at); if (r) made.push(r);
    });
    return made;
  };
  /* Removing time off puts the coach back on the dates still looking for cover; dates already covered stay covered */
  db.removeTimeOff = function (id, who, at) {
    var e = C.exceptions.filter(function (x) { return x.id === id; })[0]; if (!e) return null;
    C.cover.forEach(function (r) { if (r.exception === id) r.needs.forEach(function (n) { if (liveNeed(n)) db.withdrawCover(r.id, n.id, { back: true, reason: 'Time off removed' }, who, at); }); });
    db.removeAvailabilityException(id); keepOffering(at); return e;
  };

  function offerId() { return 'OFR-' + String(C.cover.reduce(function (k, x) { return k + x.needs.reduce(function (m, y) { return m + y.offers.length; }, 0); }, 0) + 1).padStart(2, '0'); }
  function notify(coach, title, body, route, at) { if (db.notifyCoach && coach) db.notifyCoach(coach, title, body, route, at); }
  db.sendCoverOffer = function (reqId, needId, coach, who, at, quiet) {
    var r = pick(C.cover, reqId), n = db.getCoverNeed(reqId, needId), o = occOf(n), normal = db.coverRate(coach, o);
    if (!liveNeed(n)) return null;
    var rate = n.enhanced ? n.enhanced.rate : normal.rate;
    var f = { id: offerId(), coach: coach, rate: rate, normal: normal.rate, cost: Math.round(rate * normal.units), sentBy: who, sentAt: at, response: null, respondedAt: null, note: '' };
    n.offers.push(f); needState(n);
    if (!quiet) r.history.push({ text: 'Offered to ' + db.coachName(coach) + ' for ' + K.dd(o.date), who: who, at: at, tone: 'info' });
    notify(coach, 'Cover available', whenOf(o) + (rate !== normal.rate ? ', at ' + K.money(rate) + ' an hour' : '') + '. Accept or say you can’t; the office chooses who covers.', 'coach-cover', at);
    return f;
  };
  /* The default: every eligible coach is asked at once (Hub and email), each date on its own */
  db.offerAllEligible = function (reqId, needId, who, at) {
    var r = pick(C.cover, reqId), n = db.getCoverNeed(reqId, needId);
    if (!liveNeed(n)) return [];
    var o = occOf(n);
    var sent = db.getCoverCandidates(reqId, needId).filter(function (c) { return c.eligible; }).map(function (c) { return db.sendCoverOffer(reqId, needId, c.coach.id, who, at, true); }).filter(Boolean);
    if (sent.length) r.history.push({ text: 'Offered to ' + sent.length + ' eligible coach' + (sent.length === 1 ? '' : 'es') + ' for ' + K.dd(o.date) + ' by Hub and email: ' + sent.map(function (f) { return db.coachName(f.coach); }).join(', '), who: who, at: at, tone: 'info' });
    needState(n);
    return sent;
  };
  /* Coaches who become free later (time off removed, hours or usual week changed, documents verified,
     back to active, taken off another date) are offered the dates still open */
  function keepOffering(at) {
    C.cover.forEach(function (r) { r.needs.forEach(function (n) { if (liveNeed(n) && !db.hasStarted(occOf(n))) db.offerAllEligible(r.id, n.id, HUB, at); }); });
  }
  db.keepOffering = keepOffering;
  /* A coach answers, and can change their mind until Management chooses */
  db.respondCoverOffer = function (reqId, needId, offerId, response, note, at) {
    var r = pick(C.cover, reqId), n = db.getCoverNeed(reqId, needId), f = n && n.offers.filter(function (x) { return x.id === offerId; })[0];
    if (!f || !liveNeed(n) || !live(f)) return null;
    var o = occOf(n);
    if (response === 'Accepted') { var av = db.coachAvailableFor(f.coach, o); if (!av.ok) return { error: av.reason }; }
    var was = f.response;
    f.response = response; f.respondedAt = at; if (note != null) f.note = note || '';
    needState(n);
    var said = response === 'Accepted' ? (was === 'Declined' ? ' can cover after all' : ' can cover') : (was === 'Accepted' ? ' can’t cover after all' : ' can’t cover');
    r.history.push({ text: db.coachName(f.coach) + said + ' on ' + K.dd(o.date) + (note ? ': ' + note : ''), who: db.coachName(f.coach), at: at, tone: response === 'Accepted' ? 'ok' : 'danger' });
    return f;
  };
  /* A reason added after saying "Can't do it" */
  db.noteCoverReply = function (reqId, needId, offerId, note) {
    var n = db.getCoverNeed(reqId, needId), f = n && n.offers.filter(function (x) { return x.id === offerId; })[0]; if (f) f.note = note; return f;
  };
  db.markCoverPhoneCall = function (reqId, needId, note, who, at) {
    var r = pick(C.cover, reqId), n = db.getCoverNeed(reqId, needId), o = occOf(n);
    n.phone = { note: note, by: who, at: at }; needState(n);
    r.history.push({ text: 'Ring round for ' + K.dd(o.date), detail: note, who: who, at: at, tone: 'warn' });
  };
  /* A higher rate for one date, for everyone offered it. The coaches' normal rates never change. */
  db.setCoverRate = function (reqId, needId, rate, reason, who, at) {
    var r = pick(C.cover, reqId), n = db.getCoverNeed(reqId, needId); if (!liveNeed(n)) return null;
    var o = occOf(n); n.enhanced = { rate: rate, reason: reason, by: who, at: at };
    n.offers.forEach(function (f) { if (live(f)) { f.rate = rate; f.cost = Math.round(rate * hours(o)); notify(f.coach, 'Cover now pays more', whenOf(o) + ' now pays ' + K.money(rate) + ' an hour.', 'coach-cover', at); } });
    r.history.push({ text: 'Cover for ' + K.dd(o.date) + ' now offered at ' + K.money(rate) + ' an hour', detail: reason, who: who, at: at, tone: 'info' });
    return n;
  };
  /* Closing one date's cover need: the shared last step for Cover, a direct Change coach, withdrawing,
     and a date that was cancelled, moved or confirmed. Every other offer for that date closes and the
     coaches offered it are told; other dates are untouched.
     how: { coach, offer, rate, direct, ended, note, history, reason } */
  db.closeCoverNeed = function (reqId, needId, how, who, at) {
    var r = pick(C.cover, reqId), n = db.getCoverNeed(reqId, needId);
    if (!liveNeed(n)) return null;
    var o = occOf(n);
    n.state = 'Covered'; n.confirmed = { coach: how.coach || null, offer: how.offer || null, rate: how.rate != null ? how.rate : null, by: who, at: at, direct: !!how.direct, ended: how.coach ? null : (how.ended || 'not-needed'), note: how.note || '' };
    var told = [], what = whenOf(o), by = how.coach ? (how.direct ? 'filled by Management' : 'covered by ' + db.coachName(how.coach)) : 'no longer needed';
    n.offers.forEach(function (x) {
      if (x.id === how.offer || (how.coach && x.coach === how.coach) || !live(x) || x.response === 'Declined') return;
      if (!x.response) { x.response = 'Filled'; x.respondedAt = at; x.closed = true; x.note = cap(by); told.push({ c: x.coach, replied: false }); }
      else if (x.response === 'Accepted') { x.closed = true; x.closedNote = cap(by); told.push({ c: x.coach, replied: true }); }
    });
    told.forEach(function (t) { notify(t.c, how.coach ? 'Cover filled' : 'Cover no longer needed', what + (how.coach ? (how.direct ? ' has been filled by Management.' : ' is now covered by ' + db.coachName(how.coach) + '.') : ' is no longer needed.') + (t.replied ? ' Thanks for replying.' : ' No need to reply.'), 'coach-cover', at); });
    told = told.map(function (t) { return t.c; });
    r.history.push({ text: (how.history || ('Cover confirmed: ' + db.coachName(how.coach) + ' on ' + K.dd(o.date))) + (told.length ? '; ' + told.map(function (c) { return db.coachName(c).split(' ')[0]; }).join(', ') + ' told' : ''), detail: how.reason || '', who: who, at: at, tone: how.coach ? 'ok' : 'info' });
    return { need: n, told: told };
  };
  /* The chosen coach can't be in two places: their other open offers at the same time close */
  db.coverBusyElsewhere = function (coach, o, at) {
    C.cover.forEach(function (r) { r.needs.forEach(function (n) {
      if (!liveNeed(n) || n.occurrence === o.id) return;
      var x = occOf(n); if (x.date !== o.date || !(x.start < o.end && x.end > o.start)) return;
      var hit = false;
      n.offers.forEach(function (f) { if (f.coach === coach && live(f) && f.response !== 'Declined') { hit = true; f.closed = true; f.closedNote = 'Coaching ' + o.session + ' at the same time'; if (!f.response) { f.response = 'Filled'; f.respondedAt = at; f.note = f.closedNote; } } });
      if (hit) { r.history.push({ text: db.coachName(coach) + ' is now coaching ' + o.session + ' at the same time, so their offer for ' + K.dd(x.date) + ' closed', who: HUB, at: at, tone: 'info' }); needState(n); }
    }); });
  };
  /* Management chooses one coach who said yes. The shared staffing steps put them on that date as cover
     (the regular coaches never change) at the agreed rate for the date; the absent coach stays on the
     date as away. Then the shared close step tidies every other offer. opts: { offer, rate, reason } */
  db.confirmCover = function (reqId, needId, who, at, opts) {
    opts = opts || {};
    var r = pick(C.cover, reqId), n = db.getCoverNeed(reqId, needId);
    if (!liveNeed(n)) return null;
    var o = occOf(n);
    var f = n.offers.filter(function (x) { return x.response === 'Accepted' && live(x) && (!opts.offer || x.id === opts.offer); }).slice(-1)[0]; if (!f) return null;
    var av = db.coachAvailableFor(f.coach, o); if (!av.ok) return { error: db.coachName(f.coach).split(' ')[0] + ' isn’t free any more: ' + av.reason.toLowerCase() };
    var absent = n.absent && o.staff.filter(function (s) { return s.coach === n.absent; })[0];
    var role = absent ? (absent.actualRole || absent.role) : 'Lead', normal = db.coverRate(f.coach, o).rate;
    var rate = opts.rate != null ? opts.rate : n.enhanced ? n.enhanced.rate : normal;
    if (n.absent) db.staffTakeOff(o, n.absent, { keepAway: true, coveredBy: f.coach });
    /* The agreed cover rate is this date's rate: a later change to the coach's normal rate leaves it alone */
    db.staffPlace(o, { coach: f.coach, role: role, covers: n.absent || null, agreed: { rate: rate, cover: r.id, note: { reason: opts.reason || (n.enhanced && rate === n.enhanced.rate ? n.enhanced.reason || 'Higher cover rate' : rate === normal ? 'Agreed cover rate (normal rate)' : 'Agreed cover rate'), by: who, at: at } } });
    f.chosen = true;
    db.closeCoverNeed(reqId, needId, { coach: f.coach, offer: f.id, rate: rate, history: 'Cover confirmed: ' + db.coachName(f.coach) + ' on ' + K.dd(o.date) + ' at ' + K.money(rate) + ' an hour' + (opts.reason ? ' (' + opts.reason + ')' : ''), reason: opts.reason }, who, at);
    db.coverBusyElsewhere(f.coach, o, at);
    notify(f.coach, 'You’re covering', 'You’re on ' + whenOf(o) + (n.absent ? ', covering ' + db.coachName(n.absent).split(' ')[0] : '') + '.', 'coach-session/' + o.id, at);
    if (n.absent) notify(n.absent, db.coachName(f.coach).split(' ')[0] + ' is covering for you', whenOf(o) + '.', 'coach-cover', at);
    (o.history = o.history || []).push({ text: 'Cover confirmed: ' + db.coachName(f.coach) + (n.absent ? ' for ' + db.coachName(n.absent) : '') + ' at ' + K.money(rate) + ' an hour', who: who, at: at, tone: 'ok' });
    return n;
  };
  /* The chosen coach can't do it after all: they come off the date and it is offered again */
  db.coverDropOut = function (reqId, needId, reason, who, at) {
    var r = pick(C.cover, reqId), n = db.getCoverNeed(reqId, needId), c = n && n.confirmed && !n.confirmed.direct && n.confirmed.coach;
    if (!c) return null;
    var o = occOf(n); if (db.hasStarted(o) || o.delivery) return null;
    db.staffTakeOff(o, c);
    o.staff.forEach(function (s) { if (s.covering === c) s.covering = null; });
    (n.dropped = n.dropped || []).push({ coach: c, reason: reason, at: at });
    n.offers.forEach(function (f) {
      if (f.coach === c) { f.response = 'Declined'; f.closed = false; f.chosen = false; f.note = 'Couldn’t do it after being chosen: ' + reason; }
      else if (f.response === 'Accepted' && f.closed) f.response = 'Filled';
    });
    n.state = 'Open'; n.confirmed = null;
    r.history.push({ text: db.coachName(c) + ' can’t cover ' + K.dd(o.date) + ' any more: offered again', detail: reason, who: who, at: at, tone: 'danger' });
    (o.history = o.history || []).push({ text: db.coachName(c) + ' can’t cover any more: finding cover again', detail: reason, who: who, at: at, tone: 'danger' });
    if (n.absent) notify(n.absent, db.coachName(c).split(' ')[0] + ' can’t cover for you any more', whenOf(o) + '. The office is finding someone else.', 'coach-cover', at);
    db.offerAllEligible(r.id, needId, HUB, at); needState(n);
    return n;
  };
  /* No longer needed for one date. back: the absent coach can coach after all and goes back on the
     date; otherwise the date runs without cover. Offers close and everyone offered it is told. */
  db.withdrawCover = function (reqId, needId, how, who, at) {
    var r = pick(C.cover, reqId), n = db.getCoverNeed(reqId, needId);
    if (!liveNeed(n)) return null;
    var o = occOf(n), back = how.back && n.absent;
    if (back) {
      db.staffBack(o, n.absent);
      var e = db.awayFrom(n.absent, o); if (e) (e.back = e.back || []).push(o.date);
      if (how.tell !== false) notify(n.absent, 'You’re back on ' + o.session, whenOf(o) + '. Cover is no longer needed.', 'coach-session/' + o.id, at);
    }
    var words = back ? db.coachName(n.absent).split(' ')[0] + ' can coach after all' : 'Running without cover';
    (o.history = o.history || []).push({ text: words + ': cover no longer needed', detail: how.reason || '', who: who, at: at, tone: 'info' });
    var res = db.closeCoverNeed(reqId, needId, { coach: null, ended: back ? 'back' : 'not-needed', note: words, history: words + ' on ' + K.dd(o.date) + ': cover no longer needed', reason: how.reason }, who, at);
    /* Running without cover is a deliberate exception for this date only: kept with reason, who and when,
       and it reopens itself if anything material changes on the date */
    if (!back && n.absent && db.leaveAsIs) db.leaveAsIs('assigned_coach_unavailable|occurrence:' + o.id + '|coach:' + n.absent, how.reason || 'Running without cover', { kind: 'date', date: o.date, label: 'For ' + K.dd(o.date) + ' only' }, who, at, o.id);
    return res;
  };
  /* The date itself changed (cancelled, postponed, moved, or confirmed as delivered): its cover closes.
     coveredBy: { absentCoach: coach who actually covered } from delivery confirmation. */
  db.closeCoverForDate = function (o, ended, note, who, at, coveredBy) {
    db.coverNeedsFor(o.id).forEach(function (x) {
      var c = coveredBy && coveredBy[String(x.need.absent)];
      db.closeCoverNeed(x.request.id, x.need.id, c ? { coach: c, direct: true, note: note, history: db.coachName(c) + ' covered ' + K.dd(o.date) + ' (recorded when delivery was confirmed)' } : { coach: null, ended: ended, note: note, history: note + ': cover for ' + K.dd(o.date) + ' closed' }, who, at);
    });
  };
  /* Plain outcome of one date, shared by Management screens, Needs Attention and the Coach hub */
  db.coverOutcome = function (n) {
    var o = occOf(n), now = K.parse(K.now()), start = K.parse(o.date + 'T' + o.start), h = (start - now) / 36e5;
    var fs = n.offers, lv = fs.filter(live);
    var out = { offered: fs.length, replied: fs.filter(function (f) { return f.response === 'Accepted' || f.response === 'Declined'; }).length,
      can: lv.filter(function (f) { return f.response === 'Accepted'; }), waiting: lv.filter(function (f) { return !f.response; }), cant: fs.filter(function (f) { return f.response === 'Declined'; }),
      urgency: o.date === K.today ? 'today' : h <= 24 ? 'soon' : '', hours: h };
    out.key = !liveNeed(n) ? (n.confirmed && n.confirmed.coach ? 'done' : 'ended') : out.can.length ? 'choose' : out.waiting.length ? 'waiting' : 'none';
    return out;
  };

  /* ---------- Delivery confirmation ----------
     Turns the planned staff of an ended date into what actually happened.
     spec: { people: [{ coach, attended: 'Present'|'Absent', role }], extras: [{ coach, role, covering }],
             partial: { endedAt: 'HH:MM', reason, payFull }, note }
     Pay items become actual: present coaches are confirmed at the rate in
     force that day (kept on the item); absent coaches lose their expected item;
     extra or covering coaches gain one. A confirmed date is not changed again. */
  function mins(t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; }
  db.confirmDelivery = function (id, spec, who, at) {
    var o = db.getOccurrence(id); if (!o || o.delivery) return null;
    spec = spec || {};
    var changes = [], first = function (c) { return db.coachName(c).split(' ')[0]; };
    var people = spec.people || db.workingStaff(o).map(function (x) { return { coach: x.coach, attended: 'Present', role: x.actualRole || x.role }; });
    people.forEach(function (p) {
      var x = o.staff.filter(function (st) { return st.coach === p.coach && !st.unavailable; })[0]; if (!x) return;
      var planned = x.actualRole || x.role;
      x.attended = p.attended === 'Absent' ? 'Absent' : 'Attended';
      if (x.attended === 'Absent') changes.push(first(x.coach) + ' was absent');
      else if (p.role && p.role !== planned) changes.push(first(x.coach) + ' was ' + K.roleName(p.role) + ' on the day');
      x.actualRole = p.role || planned;
    });
    o.staff.forEach(function (x) { if (x.unavailable) x.attended = 'Absent'; });
    (spec.extras || []).forEach(function (e) {
      if (!e.coach) return;
      var cov = e.covering || null;
      o.staff.push({ coach: e.coach, lead: e.role === 'Lead', role: e.role, actualRole: e.role, attended: 'Attended', extra: !cov, cover: !!cov, covers: cov });
      if (cov) { var ab = o.staff.filter(function (x) { return x.coach === cov && x !== o.staff[o.staff.length - 1]; })[0]; if (ab) { ab.attended = 'Absent'; ab.covering = e.coach; } }
      changes.push(cov ? first(e.coach) + ' covered for ' + first(cov) : first(e.coach) + ' joined as an extra ' + K.roleName(e.role));
    });
    var full = (mins(o.end) - mins(o.start)) / 60, worked = full;
    if (spec.partial && spec.partial.endedAt) {
      worked = Math.max(0, (mins(spec.partial.endedAt) - mins(o.start)) / 60);
      changes.push('Ended early at ' + spec.partial.endedAt + (spec.partial.reason ? ': ' + spec.partial.reason : '') + (spec.partial.payFull ? ' (coaches paid in full)' : ''));
    }
    var units = spec.partial && !spec.partial.payFull ? Math.round(worked * 100) / 100 : full;
    var workers = o.staff.filter(function (x) { return x.attended === 'Attended'; }).map(function (x) { return x.coach; });
    for (var i = F.allocations.length - 1; i >= 0; i--) { var a = F.allocations[i]; if (a.occurrence === o.id && a.state === 'Draft' && workers.indexOf(a.coach) < 0) F.allocations.splice(i, 1); }
    o.staff.filter(function (x) { return x.attended === 'Attended'; }).forEach(function (w) {
      var a = F.allocations.filter(function (al) { return al.occurrence === o.id && al.coach === w.coach && al.state !== 'Exported'; })[0];
      if (!a) { var rp = F.rateFor(w.coach, o.date), r = db.coverRate(w.coach, o); a = db.addAllocation({ coach: w.coach, occurrence: o.id, date: o.date, role: w.actualRole, rate: r.rate, rateProfile: rp && rp.id, units: full, override: null, cost: r.cost, state: 'Draft', extra: !!w.extra }); }
      /* Rate used: a rate set for this session wins; otherwise the normal rate in force that day */
      if (a.rateSource !== 'occurrence') { var rn = db.coverRate(w.coach, o), rpn = F.rateFor(w.coach, o.date); a.rate = rn.rate; a.rateProfile = rpn && rpn.id; a.rateSource = 'normal'; }
      a.role = w.actualRole; a.units = units; if (!a.override) a.cost = Math.round(a.rate * units);
      a.state = 'Confirmed'; a.confirmedBy = { by: who, at: at };
      /* Frozen record of what was actually worked and paid; later rate changes never touch it */
      a.actual = { coach: a.coach, role: a.role, units: a.units, rate: a.rate, rateSource: a.rateSource, rateProfile: a.rateProfile, cost: a.cost, by: who, at: at };
    });
    o.status = 'Completed';
    o.delivery = { state: spec.partial ? 'Partial' : changes.length ? 'Changed' : 'As planned', by: who, at: at, changes: changes, partial: spec.partial || null, note: spec.note || '',
      /* Snapshot of the confirmed staffing, kept even if the delivery is later corrected */
      staff: o.staff.map(function (x) { return { coach: x.coach, plannedRole: x.role, role: x.actualRole || x.role, attended: x.attended, covers: x.covers || null, extra: !!x.extra }; }) };
    (o.history = o.history || []).push({ text: 'Delivery confirmed: ' + (changes.length ? changes.join('; ') : 'went as planned'), who: who, at: at, tone: 'ok' });
    syncSummaries(o, workers, o.staff.map(function (x) { return x.coach; }), 'confirmed as delivered', who, at);
    /* Cover still open for this date closes with what actually happened */
    var coveredBy = {}; o.staff.forEach(function (x) { if (x.covering) coveredBy[x.coach] = x.covering; });
    if (workers.length) coveredBy['null'] = workers[0];
    db.closeCoverForDate(o, 'delivered', 'Session has run', who, at, coveredBy);
    return o;
  };

  /* Work summaries after a delivery is confirmed or corrected: one still in review picks the
     change up; a finalised one is never rewritten, it is flagged for Management to reopen. */
  function syncSummaries(o, workers, touched, what, who, at) {
    C.summaries.forEach(function (ws) {
      if (ws.month !== o.date.slice(0, 7) || touched.indexOf(ws.coach) < 0) return;
      if (ws.state !== 'Needs review') {
        if (workers.indexOf(ws.coach) < 0) return;
        ws.stale = { occurrence: o.id, at: at };
        ev(ws, { text: o.session + ' on ' + K.dm(o.date) + ' was ' + what + ' after finalising; reopen to include it', who: who, at: at, tone: 'warn' });
        return;
      }
      ws.lines = freeze(ws.coach, ws.month); ws.total = K.sum(ws.lines, 'cost'); ws.cycles[ws.cycles.length - 1].total = ws.total;
      ev(ws, { text: 'Updated: ' + o.session + ' on ' + K.dm(o.date) + ' ' + what, who: who, at: at, tone: 'info' });
    });
  }
  function paid(a) { return a.state === 'Exported' || !!a.run; }

  /* ---------- Correcting a confirmed delivery ----------
     A deliberate action with a reason. The original confirmation is kept; actual staff, role,
     hours and rate are replaced; actual cost is recalculated. Pay already sent for payment or
     in a finalised summary is never rewritten: the difference becomes an adjustment pay item
     and the summary is flagged. rows: [{ coach, attended: 'Present'|'Absent', role, units, rate, covers }] */
  db.correctDelivery = function (id, rows, reason, who, at) {
    var o = db.getOccurrence(id); if (!o || !o.delivery || !reason) return null;
    var before = { delivery: JSON.parse(JSON.stringify(o.delivery)), pay: F.allocations.filter(function (a) { return a.occurrence === o.id; }).map(function (a) { return { id: a.id, coach: a.coach, role: a.role, units: a.units, rate: a.rate, cost: a.cost, state: a.state }; }) };
    (o.deliveryHistory = o.deliveryHistory || []).push(Object.assign(before, { replacedBy: who, replacedAt: at, reason: reason }));
    var first = function (c) { return db.coachName(c).split(' ')[0]; }, changes = [], money = 0;
    rows.forEach(function (r) {
      var x = o.staff.filter(function (st) { return st.coach === r.coach && !(st.unavailable && st.covering && st.attended !== 'Attended'); })[0];
      if (!x) { x = { coach: r.coach, lead: r.role === 'Lead', role: r.role, actualRole: r.role, attended: null, extra: !r.covers, cover: !!r.covers, covers: r.covers || null, corrected: true }; o.staff.push(x); }
      var was = x.attended, wasRole = x.actualRole || x.role;
      x.attended = r.attended === 'Absent' ? 'Absent' : 'Attended'; x.actualRole = r.role || wasRole;
      if (was !== x.attended) changes.push(first(r.coach) + (x.attended === 'Attended' ? (r.covers ? ' covered for ' + first(r.covers) : ' did work') : ' did not work'));
      else if (x.attended === 'Attended' && x.actualRole !== wasRole) changes.push(first(r.coach) + ' was ' + K.roleName(x.actualRole));
      if (r.covers) { var ab = o.staff.filter(function (st) { return st.coach === r.covers && st !== x; })[0]; if (ab) { ab.covering = r.coach; } }
      var a = F.allocations.filter(function (al) { return al.occurrence === o.id && al.coach === r.coach && !al.adjusts; })[0];
      var worked = x.attended === 'Attended', units = worked ? +r.units : 0, rate = worked ? Math.round(+r.rate) : 0, cost = Math.round(rate * units);
      var oldCost = a ? a.cost + K.sum(F.allocations.filter(function (al) { return al.adjusts === a.id; }), 'cost') : 0;
      if (a && worked && a.units === units && a.rate === rate && a.role === x.actualRole && !F.allocations.some(function (al) { return al.adjusts === a.id; })) return;
      if (a && paid(a)) {
        /* Already paid or finalised: keep it, record the difference */
        if (cost - oldCost) { db.addAllocation({ coach: r.coach, occurrence: o.id, date: o.date, role: x.actualRole, rate: rate, units: units, override: null, cost: cost - oldCost, rateSource: 'occurrence', state: 'Confirmed', adjusts: a.id, adjustment: { reason: reason, by: who, at: at }, confirmedBy: { by: who, at: at }, actual: { coach: r.coach, role: x.actualRole, units: units, rate: rate, cost: cost - oldCost, by: who, at: at } }); money += cost - oldCost; changes.push('Pay for ' + first(r.coach) + ' ' + (cost > oldCost ? 'up ' : 'down ') + K.money(Math.abs(cost - oldCost)) + ' (adjustment, already sent for payment)'); }
      } else if (a) {
        (a.actualHistory = a.actualHistory || []).push(a.actual);
        if (!worked) { F.allocations.splice(F.allocations.indexOf(a), 1); money -= oldCost; return; }
        if (rate !== a.rate) { a.rateNote = { normal: a.rate, reason: reason, by: who, at: at }; a.rateSource = 'occurrence'; }
        a.role = x.actualRole; a.units = units; a.rate = rate; a.override = null; a.cost = cost; money += cost - oldCost;
        a.actual = { coach: a.coach, role: a.role, units: units, rate: rate, rateSource: a.rateSource, cost: cost, by: who, at: at, corrected: true };
      } else if (worked) {
        var rp = F.rateFor(r.coach, o.date), normal = db.coverRate(r.coach, o).rate;
        a = db.addAllocation({ coach: r.coach, occurrence: o.id, date: o.date, role: x.actualRole, rate: rate, rateProfile: rp && rp.id, units: units, override: null, cost: cost, rateSource: rate === normal ? 'normal' : 'occurrence', state: 'Confirmed', confirmedBy: { by: who, at: at } });
        a.actual = { coach: a.coach, role: a.role, units: units, rate: rate, rateSource: a.rateSource, cost: cost, by: who, at: at, corrected: true }; money += cost;
      }
    });
    if (!changes.length && !money) { o.deliveryHistory.pop(); return null; }
    o.delivery.state = o.delivery.state === 'As planned' ? 'Changed' : o.delivery.state;
    o.delivery.corrected = { by: who, at: at, reason: reason, changes: changes, money: money };
    o.delivery.staff = o.staff.map(function (x) { return { coach: x.coach, plannedRole: x.role, role: x.actualRole || x.role, attended: x.attended, covers: x.covers || null, extra: !!x.extra }; });
    o.history.push({ text: 'Delivery corrected: ' + changes.join('; '), detail: 'Reason: ' + reason + '. Original confirmation by ' + before.delivery.by + ' kept in history.', who: who, at: at, tone: 'warn' });
    var coaches = rows.map(function (r) { return r.coach; });
    syncSummaries(o, coaches, coaches, 'corrected', who, at);
    return o;
  };

  /* Rates: never edited. A change adds a new profile from a date and ends the previous one. */
  db.getCurrentRate = function (coach) { return F.rateFor(coach, K.today); };
  db.changeRate = function (coach, o, who, at) {
    var list = F.rateProfiles.filter(function (r) { return r.coach === coach; }).sort(function (a, b) { return a.from < b.from ? -1 : 1; });
    var prev = list.filter(function (r) { return !r.to || r.to >= o.from; }).slice(-1)[0];
    if (prev && prev.from >= o.from) return null;
    if (prev) { prev.to = K.addDays(o.from, -1); prev.endedBy = who; prev.endedAt = at; }
    var c = db.getCoach(coach);
    var p = { id: 'RP-' + c.code.slice(4) + String.fromCharCode(65 + list.length), coach: coach, from: o.from, to: null, evening: o.evening, day: o.day, by: who, at: at, note: o.note || '' };
    F.rateProfiles.push(p);
    /* Expected pay from the effective date follows the new normal rate. Actual (confirmed) pay
       and any rate set for one session are never touched. */
    F.allocations.forEach(function (a) {
      if (a.coach !== coach || a.state !== 'Draft' || a.date < o.from || a.rateSource === 'occurrence') return;
      var oc = db.getOccurrence(a.occurrence); if (!oc) return;
      a.rate = oc.start < '15:00' ? p.day : p.evening; a.rateProfile = p.id; if (!a.override) a.cost = Math.round(a.rate * a.units);
    });
    return p;
  };
  /* A rate set for one session (for example an enhanced cover rate) wins over the normal rate.
     Only while the pay is still expected; once delivery is confirmed it is fixed. */
  db.setOccurrenceRate = function (id, rate, reason, who, at) {
    var a = pick(F.allocations, id); if (!a || a.state !== 'Draft' || !reason) return null;
    a.rateNote = { normal: a.rateSource === 'occurrence' && a.rateNote ? a.rateNote.normal : a.rate, reason: reason, by: who, at: at };
    a.rate = rate; a.rateSource = 'occurrence'; if (!a.override) a.cost = Math.round(rate * a.units); return a;
  };
  /* Allocations */
  db.getAllocation = function (id) { return pick(F.allocations, id); };
  db.overrideAllocation = function (id, cost, reason, who, at) {
    var a = pick(F.allocations, id); if (!a || a.state !== 'Draft' || !reason) return null;
    a.override = { cost: cost, was: a.override ? a.override.cost : Math.round(a.rate * a.units), reason: reason, by: who, at: at }; a.cost = cost; return a;
  };
  db.clearAllocationOverride = function (id, who, at) {
    var a = pick(F.allocations, id); if (!a || a.state !== 'Draft' || !a.override) return null;
    a.overrideHistory = (a.overrideHistory || []).concat([Object.assign({ removedBy: who, removedAt: at }, a.override)]);
    a.override = null; a.cost = Math.round(a.rate * a.units); return a;
  };

  /* Work summaries: Finalise / Query / Reopen, each cycle kept */
  function ev(ws, e) { ws.cycles[ws.cycles.length - 1].events.push(e); }
  db.finaliseSummary = function (id, who, at) {
    var ws = pick(C.summaries, id); if (ws.state !== 'Needs review') return null;
    ws.state = 'Finalised'; ws.finalised = { by: who, at: at }; ws.query = null;
    ws.lines.forEach(function (l) { var a = pick(F.allocations, l.allocation); if (a) { a.state = 'Exported'; a.exported = { by: who, at: at, summary: ws.id }; } });
    ev(ws, { text: 'Finalised and sent for the coach payment; ' + db.coachName(ws.coach) + ' told', who: who, at: at, tone: 'ok' }); return ws;
  };
  db.querySummary = function (id, text, who, at) {
    var ws = pick(C.summaries, id); ws.state = 'Queried'; ws.query = { text: text, by: who, at: at };
    ev(ws, { text: 'Queried: ' + text, who: who, at: at, tone: 'warn' }); return ws;
  };
  db.reopenSummary = function (id, who, at) {
    var ws = pick(C.summaries, id);
    ev(ws, { text: 'Reopened', who: who, at: at, tone: 'info' });
    if (ws.state === 'Finalised') ws.lines.forEach(function (l) { var a = pick(F.allocations, l.allocation); if (a) { a.state = 'Confirmed'; a.exported = null; } });
    ws.lines = freeze(ws.coach, ws.month); ws.total = K.sum(ws.lines, 'cost'); ws.frozenAt = at; ws.frozenBy = who; ws.cycle += 1; ws.state = 'Needs review'; ws.stale = null; ws.query = null; ws.finalised = null;
    ws.cycles.push({ n: ws.cycle, frozenAt: at, total: ws.total, events: [{ text: 'Prepared again from ' + ws.lines.length + ' pay items for review', who: who, at: at }] });
    return ws;
  };
})();
