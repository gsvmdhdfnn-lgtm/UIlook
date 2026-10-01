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
    { id: 'lead', name: 'Lead', sessionRole: 'Lead', desc: 'Runs the session and is accountable for the group.', perms: { viewPlayers: true, namesOnly: false, feedback: true, editPlans: true, attendance: true, comms: true } },
    { id: 'coach', name: 'Coach', sessionRole: 'Coach', desc: 'Delivers part of the session under the lead.', perms: { viewPlayers: true, namesOnly: false, feedback: true, editPlans: false, attendance: true, comms: false } },
    { id: 'learning', name: 'Learning Coach', sessionRole: 'Learning', desc: 'On placement. Never left alone with a group.', perms: { viewPlayers: false, namesOnly: true, feedback: false, editPlans: false, attendance: true, comms: false } },
    { id: 'office', name: 'Office', sessionRole: null, desc: 'Office staff: registers and family contact, no coaching.', perms: { viewPlayers: true, namesOnly: false, feedback: false, editPlans: false, attendance: true, comms: true } }
  ];
  C.roleHistory = [
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
  var ppa12 = db.findOccurrence('SES-05', '2026-10-12'), ppa15 = db.findOccurrence('SES-05', '2026-10-15');
  var u12 = db.findOccurrence('SES-03', '2026-10-01'), u13 = db.findOccurrence('SES-04', '2026-10-02');
  var r1 = cvr({ coach: 'tom', kind: 'Holiday', from: '2026-10-12', to: '2026-10-16', reason: 'Family holiday (booked in July)', requestedBy: 'Tom Reid', at: '2026-09-28T20:14', exception: 'AVX-02',
    needs: [ppa12, ppa15].filter(Boolean).map(function (o) { return need(o.id, 'tom'); }),
    history: [{ text: 'Holiday requested for 12–16 Oct', who: 'Tom Reid', at: '2026-09-28T20:14' }, { text: 'Holiday approved; cover needed for 2 sessions', who: DC, at: '2026-09-29T08:30', tone: 'ok' }] });
  /* The approved holiday takes Tom off those occurrences and withdraws his draft allocations. */
  r1.needs.forEach(function (n) {
    var o = db.getOccurrence(n.occurrence);
    o.staff.forEach(function (s) { if (s.coach === 'tom') s.unavailable = true; });
    for (var i = F.allocations.length - 1; i >= 0; i--) if (F.allocations[i].occurrence === o.id && F.allocations[i].coach === 'tom' && F.allocations[i].state === 'Draft') F.allocations.splice(i, 1);
  });
  if (r1.needs[0]) {
    r1.needs[0].offers.push({ id: 'OFR-01', coach: 'priya', rate: 2500, cost: 5000, sentBy: DC, sentAt: '2026-09-30T10:05', response: null, respondedAt: null, note: '' });
    r1.needs[0].state = 'Offered';
    r1.history.push({ text: 'Offer sent to Priya Nair for ' + K.dd(ppa12.date), who: DC, at: '2026-09-30T10:05', tone: 'info' });
  }
  var r2 = cvr({ coach: 'charlie', kind: 'Unavailable', from: '2026-10-01', to: '2026-10-01', reason: 'Family commitment this evening', requestedBy: 'Charlie Hughes', at: '2026-09-30T18:12', exception: 'AVX-01',
    needs: [need(u12.id, 'charlie')],
    history: [{ text: 'Marked unavailable for U12 Academy tonight', who: 'Charlie Hughes', at: '2026-09-30T18:12', tone: 'danger' }] });
  r2.needs[0].offers.push({ id: 'OFR-02', coach: 'marcus', rate: 3125, cost: 4688, sentBy: DC, sentAt: '2026-10-01T09:15', response: 'Declined', respondedAt: '2026-10-01T11:02', note: 'Can’t get to Northgate by 19:00 tonight' });
  r2.history.push({ text: 'Offer sent to Marcus Bell', who: DC, at: '2026-10-01T09:15', tone: 'info' }, { text: 'Marcus Bell declined: can’t get to Northgate by 19:00 tonight', who: 'Marcus Bell', at: '2026-10-01T11:02', tone: 'danger' });
  cvr({ coach: null, kind: 'No coach', from: u13.date, to: u13.date, reason: 'No coach assigned after the September rota change', requestedBy: 'System', at: '2026-09-28T09:00',
    needs: [need(u13.id, null)], history: [{ text: 'Session has no coach assigned', who: 'System', at: '2026-09-28T09:00', tone: 'danger' }] });

  /* ---------- Work summaries (September 2026) ---------- */
  C.summaries = [];
  function freeze(coach, month) {
    return F.allocations.filter(function (a) { return a.coach === coach && a.date.slice(0, 7) === month; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; }).map(function (a) {
      var o = db.getOccurrence(a.occurrence);
      return { allocation: a.id, occurrence: a.occurrence, date: a.date, session: o ? o.session : '', role: a.role, units: a.units, rate: a.rate, cost: a.cost, override: a.override ? a.override.reason : '' };
    });
  }
  C.freeze = freeze;
  var month = '2026-09';
  [['charlie', 'Ready to finalise'], ['jack', 'Finalised'], ['tom', 'Awaiting coach'], ['priya', 'Queried'], ['marcus', 'Awaiting coach']].forEach(function (s, i) {
    var lines = freeze(s[0], month), name = db.coachName(s[0]);
    var ws = { id: 'WS-' + String(901 + i), coach: s[0], month: month, label: 'September 2026', state: s[1], cycle: 1, lines: lines, total: K.sum(lines, 'cost'), frozenAt: '2026-10-01T06:00', frozenBy: 'System',
      cycles: [{ n: 1, frozenAt: '2026-10-01T06:00', total: K.sum(lines, 'cost'), events: [{ text: 'Prepared from ' + lines.length + ' pay items and sent to ' + name, who: 'System', at: '2026-10-01T06:00' }] }] };
    var ev = ws.cycles[0].events;
    if (s[0] === 'charlie') ev.push({ text: 'Confirmed by coach: matches my September sessions', who: name, at: '2026-10-01T08:12', tone: 'ok' });
    if (s[0] === 'jack') {
      ev.push({ text: 'Confirmed by coach', who: name, at: '2026-10-01T07:30', tone: 'ok' }, { text: 'Finalised and sent for the 7 Oct coach payment', who: JE, at: '2026-10-01T09:40', tone: 'ok' });
      ws.finalised = { by: JE, at: '2026-10-01T09:40' };
      F.allocations.forEach(function (a) { if (a.coach === 'jack' && a.date.slice(0, 7) === month) { a.state = 'Exported'; a.exported = { by: JE, at: '2026-10-01T09:40', summary: ws.id }; } });
    }
    if (s[0] === 'tom') {
      /* Cycle 1 was queried over the 10 Sep override, then reopened. */
      ev.push({ text: 'Queried by coach: 10 Sep should be the agreed £60.00 for three classes', who: name, at: '2026-09-11T08:05', tone: 'warn' },
        { text: 'Reopened after the pay was adjusted', who: JE, at: '2026-09-11T09:32', tone: 'info' });
      ws.cycles[0].frozenAt = '2026-09-11T06:00'; ws.cycles[0].events[0].at = '2026-09-11T06:00'; ws.cycles[0].events[0].text = 'Prepared early (mid-month check) and sent to ' + name;
      ws.cycles[0].total = ws.total - 6000 + 5000;
      ws.cycle = 2; ws.cycles.push({ n: 2, frozenAt: '2026-10-01T06:00', total: ws.total, events: [{ text: 'Prepared again from ' + lines.length + ' pay items and sent to ' + name, who: 'System', at: '2026-10-01T06:00' }] });
    }
    if (s[0] === 'priya') { ev.push({ text: 'Queried by coach: Northgate After-School on Fri 18 Sep ran its full hour before the alarm', who: name, at: '2026-10-01T10:20', tone: 'warn' }); ws.query = { text: 'Northgate After-School on Fri 18 Sep ran its full hour before the alarm', by: name, at: '2026-10-01T10:20' }; }
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
    var ex = C.exceptions.filter(function (e) { return e.coach === coach && e.from <= o.date && e.to >= o.date; })[0];
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
  db.getCoverRequest = function (id) { return pick(C.cover, id); };
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
  /* Suggested coaches for a need: every other active coach, eligible first */
  db.getCoverCandidates = function (reqId, needId) {
    var n = db.getCoverNeed(reqId, needId), o = db.getOccurrence(n.occurrence);
    return db.getCoaches().filter(function (c) { return c.active && c.id !== n.absent && !o.staff.some(function (s) { return s.coach === c.id && !s.unavailable; }); }).map(function (c) {
      var av = db.coachAvailableFor(c.id, o), comp = db.getCoachComplianceSummary(c.id), why = [];
      var ok = av.ok;
      if (!av.ok) why.push(av.reason);
      if (c.type === 'learning') { ok = false; why.push('Learning coaches cannot cover alone'); }
      if (comp.state === 'Expired' || comp.state === 'Missing') { ok = false; why.push(comp.text); }
      var declined = n.offers.some(function (f) { return f.coach === c.id && f.response === 'Declined'; });
      if (declined) { ok = false; why.push('Declined this session'); }
      if (n.offers.some(function (f) { return f.coach === c.id && !f.response; })) { ok = false; why.push('Offer already sent, waiting for a reply'); }
      var r = db.coverRate(c.id, o);
      return { coach: c, eligible: ok, reasons: why, available: av, compliance: comp, rate: r.rate, cost: r.cost, units: r.units, note: r.note };
    }).sort(function (a, b) { return (b.eligible - a.eligible) || (a.cost - b.cost); });
  };

  db.getWorkSummaries = function (f) { return f ? C.summaries.filter(f) : C.summaries; };
  db.getWorkSummary = function (id) { return pick(C.summaries, id); };
  /* Needs Attention: summaries a manager can finalise now */
  db.getSummariesReady = function () { return C.summaries.filter(function (s) { return s.state === 'Ready to finalise'; }); };
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
    return c;
  };
  db.setRolePermission = function (roleId, perm, on, who, at) {
    var r = pick(C.roles, roleId); r.perms[perm] = !!on;
    C.roleHistory.unshift({ text: r.name + ': "' + pick(C.permissions, perm).label + '" switched ' + (on ? 'on' : 'off'), who: who, at: at, tone: on ? 'info' : 'warn' });
    return r;
  };
  db.addRoleOverride = function (o) { o.id = 'ROV-' + String(C.overrides.length + 1).padStart(2, '0'); o.ended = null; C.overrides.push(o); return o; };
  db.endRoleOverride = function (id, who, at) { var o = pick(C.overrides, id); o.ended = { by: who, at: at }; return o; };
  db.removeAssignment = function (coach, sessionId, who, at, reason) {
    var s = db.getSession(sessionId), st = (s.staff || []).filter(function (x) { return x.coach === coach; })[0];
    var r = { id: 'RMV-' + String(C.removed.length + 1).padStart(2, '0'), coach: coach, sessionName: s.name, session: s.id, role: st ? st.role : 'Coach', removedAt: at, by: who, reason: reason || 'Removed by management', accessUntil: K.addDays(at.slice(0, 10), C.accessWindowDays) };
    s.staff = s.staff.filter(function (x) { return x.coach !== coach; });
    C.removed.push(r); return r;
  };
  db.addAvailabilityException = function (e) { e.id = 'AVX-' + String(C.exceptions.length + 1).padStart(2, '0'); C.exceptions.push(e); return e; };
  db.removeAvailabilityException = function (id) { C.exceptions = C.exceptions.filter(function (e) { return e.id !== id; }); };
  db.setWeeklyAvailability = function (coach, dayIdx, win, who, at) { C.weekly[coach][dayIdx] = win; C.weeklyUpdated = { by: who, at: at }; };

  db.verifyDocument = function (id, who, at) {
    var d = pick(C.docs, id); d.verification = { state: 'Verified', by: who, at: at, note: '' };
    d.history.push({ text: 'Verified', who: who, at: at, tone: 'ok' }); return d;
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

  /* Cover workflow. Each date (need) moves on its own:
     Open → Offered → Accepted → Covered, a decline returns it to Open,
     and "Needs a phone call" parks it for a manager to ring round. */
  db.addCoverRequest = function (o, who, at) {
    var occs = db.getOccurrences(function (x) { return x.date >= o.from && x.date <= o.to && x.status !== 'Cancelled' && x.staff.some(function (s) { return s.coach === o.coach && !s.unavailable; }); });
    var ex = db.addAvailabilityException({ coach: o.coach, type: o.kind === 'Holiday' ? 'Holiday' : 'Unavailable', from: o.from, to: o.to, start: null, end: null, reason: o.reason, by: who, at: at });
    var r = cvr({ coach: o.coach, kind: o.kind, from: o.from, to: o.to, reason: o.reason, requestedBy: who, at: at, exception: ex.id, needs: occs.map(function (x) { return need(x.id, o.coach); }),
      history: [{ text: o.kind + ' recorded for ' + K.dm(o.from) + (o.to !== o.from ? '–' + K.dm(o.to) : '') + ': ' + occs.length + ' session' + (occs.length === 1 ? '' : 's') + ' affected', who: who, at: at }] });
    occs.forEach(function (x) { x.staff.forEach(function (s) { if (s.coach === o.coach) s.unavailable = true; }); });
    return r;
  };
  db.sendCoverOffer = function (reqId, needId, coach, who, at) {
    var r = pick(C.cover, reqId), n = db.getCoverNeed(reqId, needId), o = db.getOccurrence(n.occurrence), rate = db.coverRate(coach, o);
    var f = { id: 'OFR-' + String(C.cover.reduce(function (k, x) { return k + x.needs.reduce(function (m, y) { return m + y.offers.length; }, 0); }, 0) + 1).padStart(2, '0'), coach: coach, rate: rate.rate, cost: rate.cost, sentBy: who, sentAt: at, response: null, respondedAt: null, note: '' };
    n.offers.push(f); n.state = 'Offered'; n.phone = null;
    r.history.push({ text: 'Offer sent to ' + db.coachName(coach) + ' for ' + K.dd(o.date), who: who, at: at, tone: 'info' });
    return f;
  };
  db.respondCoverOffer = function (reqId, needId, offerId, response, note, at) {
    var r = pick(C.cover, reqId), n = db.getCoverNeed(reqId, needId), f = n.offers.filter(function (x) { return x.id === offerId; })[0], o = db.getOccurrence(n.occurrence);
    f.response = response; f.respondedAt = at; f.note = note || '';
    n.state = response === 'Accepted' ? 'Accepted' : (n.offers.some(function (x) { return !x.response; }) ? 'Offered' : 'Open');
    r.history.push({ text: db.coachName(f.coach) + ' ' + response.toLowerCase() + ' cover for ' + K.dd(o.date) + (note ? ': ' + note : ''), who: db.coachName(f.coach), at: at, tone: response === 'Accepted' ? 'ok' : 'danger' });
    return f;
  };
  db.markCoverPhoneCall = function (reqId, needId, note, who, at) {
    var r = pick(C.cover, reqId), n = db.getCoverNeed(reqId, needId), o = db.getOccurrence(n.occurrence);
    n.state = 'Needs a phone call'; n.phone = { note: note, by: who, at: at };
    r.history.push({ text: 'Needs a phone call for ' + K.dd(o.date), detail: note, who: who, at: at, tone: 'warn' });
  };
  /* Confirm: the accepted coach joins the occurrence staff as cover, the
     absent coach's draft allocation is withdrawn and a new draft allocation
     is created at the covering coach's current rate (snapshot). */
  db.confirmCover = function (reqId, needId, who, at) {
    var r = pick(C.cover, reqId), n = db.getCoverNeed(reqId, needId), o = db.getOccurrence(n.occurrence);
    var f = n.offers.filter(function (x) { return x.response === 'Accepted'; }).slice(-1)[0]; if (!f) return null;
    var absent = o.staff.filter(function (s) { return n.absent && s.coach === n.absent; })[0];
    var role = absent ? absent.role : 'Lead';
    if (absent) { absent.unavailable = true; absent.covering = f.coach; }
    o.staff.push({ coach: f.coach, lead: role === 'Lead', role: role, actualRole: role, attended: null, cover: true, covers: n.absent || null });
    if (o.status !== 'Completed') o.confirmed = { by: who, at: at };
    (o.history = o.history || []).push({ text: 'Cover confirmed: ' + db.coachName(f.coach) + (n.absent ? ' for ' + db.coachName(n.absent) : ''), who: who, at: at, tone: 'ok' });
    for (var i = F.allocations.length - 1; i >= 0; i--) { var a = F.allocations[i]; if (n.absent && a.occurrence === o.id && a.coach === n.absent && a.state === 'Draft') F.allocations.splice(i, 1); }
    var rp = F.rateFor(f.coach, o.date), rate = db.coverRate(f.coach, o);
    db.addAllocation({ coach: f.coach, occurrence: o.id, date: o.date, role: role, rate: rate.rate, rateProfile: rp && rp.id, units: rate.units, override: null, cost: rate.cost, state: 'Draft', cover: r.id });
    n.state = 'Covered'; n.confirmed = { coach: f.coach, by: who, at: at };
    r.history.push({ text: 'Cover confirmed: ' + db.coachName(f.coach) + ' on ' + K.dd(o.date), who: who, at: at, tone: 'ok' });
    return n;
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
    F.rateProfiles.push(p); return p;
  };
  /* Allocations */
  db.getAllocation = function (id) { return pick(F.allocations, id); };
  db.overrideAllocation = function (id, cost, reason, who, at) {
    var a = pick(F.allocations, id); if (!a || a.state === 'Exported' || !reason) return null;
    a.override = { cost: cost, was: a.override ? a.override.cost : Math.round(a.rate * a.units), reason: reason, by: who, at: at }; a.cost = cost; return a;
  };
  db.clearAllocationOverride = function (id, who, at) {
    var a = pick(F.allocations, id); if (!a || a.state === 'Exported' || !a.override) return null;
    a.overrideHistory = (a.overrideHistory || []).concat([Object.assign({ removedBy: who, removedAt: at }, a.override)]);
    a.override = null; a.cost = Math.round(a.rate * a.units); return a;
  };
  db.confirmAllocation = function (id, who, at) { var a = pick(F.allocations, id); if (a && a.state === 'Draft') { a.state = 'Confirmed'; a.confirmedBy = { by: who, at: at }; } return a; };

  /* Work summaries: Finalise / Query / Reopen, each cycle kept */
  function ev(ws, e) { ws.cycles[ws.cycles.length - 1].events.push(e); }
  db.coachConfirmSummary = function (id, at) { var ws = pick(C.summaries, id); ws.state = 'Ready to finalise'; ev(ws, { text: 'Confirmed by coach', who: db.coachName(ws.coach), at: at, tone: 'ok' }); return ws; };
  db.finaliseSummary = function (id, who, at) {
    var ws = pick(C.summaries, id); if (ws.state !== 'Ready to finalise') return null;
    ws.state = 'Finalised'; ws.finalised = { by: who, at: at }; ws.query = null;
    ws.lines.forEach(function (l) { var a = pick(F.allocations, l.allocation); if (a) { a.state = 'Exported'; a.exported = { by: who, at: at, summary: ws.id }; } });
    ev(ws, { text: 'Finalised and sent for the coach payment', who: who, at: at, tone: 'ok' }); return ws;
  };
  db.querySummary = function (id, text, who, at) {
    var ws = pick(C.summaries, id); ws.state = 'Queried'; ws.query = { text: text, by: who, at: at };
    ev(ws, { text: 'Queried: ' + text, who: who, at: at, tone: 'warn' }); return ws;
  };
  db.reopenSummary = function (id, who, at) {
    var ws = pick(C.summaries, id);
    ev(ws, { text: 'Reopened', who: who, at: at, tone: 'info' });
    if (ws.state === 'Finalised') ws.lines.forEach(function (l) { var a = pick(F.allocations, l.allocation); if (a) { a.state = 'Confirmed'; a.exported = null; } });
    ws.lines = freeze(ws.coach, ws.month); ws.total = K.sum(ws.lines, 'cost'); ws.frozenAt = at; ws.frozenBy = who; ws.cycle += 1; ws.state = 'Awaiting coach'; ws.query = null; ws.finalised = null;
    ws.cycles.push({ n: ws.cycle, frozenAt: at, total: ws.total, events: [{ text: 'Prepared again from ' + ws.lines.length + ' pay items and sent to ' + db.coachName(ws.coach), who: who, at: at }] });
    return ws;
  };
})();
