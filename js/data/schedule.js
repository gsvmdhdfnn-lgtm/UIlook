/* Invented schedule data: venues (VEN-), sessions (SES-), occurrences
   (OCC-) generated across autumn term 2026, memberships (MEM-) and
   registers. Edge cases are built in on purpose:
   - SES-02 on Thu 17 Sep was cancelled (waterlogged pitch) with outcomes.
   - SES-04 on Fri 18 Sep was rescheduled to Sat 19 Sep (replacement).
   - SES-04 on Fri 9 Oct moves venue (Hollins Park closed).
   - SES-03 on Thu 24 Sep has an incomplete register.
   - Northgate School INSET day on Fri 25 Sep removes SES-06 that day.
   - SES-07 is a Draft with no venue yet. */
(function () {
  var D = Hub.data, K = Hub.kit;
  D.children = D.parent.children; D.parent.children[0].playerId = 'PLY-0001'; D.parent.children[1].playerId = 'PLY-0002';

  /* Venues: keep the existing four (now invented) and add detail. */
  var V = D.venues;
  Object.assign(V.northgate, { id: 'VEN-01', address: '1 Northgate Road, Westbrook WB2 4NS', parking: 'Free car park by the sports hall (90 spaces).', access: 'Main gate opens 15 min before the first session.', siteMap: 'Astro gate is to the left of the sports hall.', active: true, costPerHour: 2000, photos: 3 });
  Object.assign(V.hollins, { id: 'VEN-02', address: 'Hollins Park School, Park Lane, Ashby Vale AV3 1HP', meetingPoint: 'Sports hall foyer', parking: 'Staff car park after 17:30 only.', access: 'Sign in at reception. Gate code from the office.', siteMap: 'Hall is through the east entrance.', active: true, costPerHour: 1800, photos: 2 });
  Object.assign(V.riverside, { id: 'VEN-03', address: 'Riverside Academy, Mill Lane, Ashby Vale AV2 7RA', meetingPoint: 'School reception', parking: 'Visitor bays by the main entrance.', access: 'Sign in at reception; classes are brought to the hall at 13:15.', siteMap: 'Field behind the junior block.', active: true, costPerHour: 0, photos: 1 });
  Object.assign(V.kingsmead, { id: 'VEN-04', address: 'Kingsmead Primary, Chapel Road, Westbrook WB5 3KP', meetingPoint: 'Hall doors', parking: 'Street parking only.', access: 'Client site. Closed while the service is paused.', siteMap: 'Hall and small playground.', active: false, costPerHour: 0, photos: 0 });
  D.venueList = ['northgate', 'hollins', 'riverside', 'kingsmead'].map(function (k) { V[k].key = k; return V[k]; });
  D.venueUnavailable = [
    { id: 'VUN-01', venue: 'hollins', from: '2026-10-09', to: '2026-10-09', reason: 'Hall floor resurfacing', by: 'Sam Okafor', at: '2026-09-22T11:05' },
    { id: 'VUN-02', venue: 'northgate', from: '2026-10-26', to: '2026-10-30', reason: 'Half term: centre closed', by: 'Josh Evans', at: '2026-07-14T09:30' }
  ];

  /* Sessions */
  D.sessions = [
    { id: 'SES-01', name: 'U8 Development', programme: 'Development Centre', area: 'Evening', ageGroup: 'U8', venue: 'northgate', client: null, commercial: 'Parent subscription', booking: 'Members only', billing: 'Monthly subscription', days: [4], start: '16:30', end: '17:30', capacity: 14, pattern: 'Weekly', startDate: '2026-09-03', endDate: '2026-12-10', lifecycle: 'Active', price: 7200, staff: [{ coach: 'jack', role: 'Lead' }, { coach: 'ellie', role: 'Learning' }] },
    { id: 'SES-02', name: 'U9/10 Development', programme: 'TDC', area: 'Evening', ageGroup: 'U9/10', venue: 'northgate', client: null, commercial: 'Parent subscription', booking: 'Members only', billing: 'Monthly subscription', days: [4], start: '17:30', end: '18:30', capacity: 16, pattern: 'Weekly', startDate: '2026-09-03', endDate: '2026-12-10', lifecycle: 'Active', price: 8700, staff: [{ coach: 'david', role: 'Lead' }, { coach: 'charlie', role: 'Coach' }] },
    { id: 'SES-03', name: 'U12 Academy', programme: 'Academy', area: 'Evening', ageGroup: 'U12', venue: 'northgate', client: null, commercial: 'Parent subscription', booking: 'Members only', billing: 'Monthly subscription', days: [4], start: '19:00', end: '20:30', capacity: 16, pattern: 'Weekly', startDate: '2026-09-03', endDate: '2026-12-10', lifecycle: 'Active', price: 9500, staff: [{ coach: 'david', role: 'Lead' }, { coach: 'charlie', role: 'Coach' }] },
    { id: 'SES-04', name: 'U13/14 Development', programme: 'TDC', area: 'Evening', ageGroup: 'U13/14', venue: 'hollins', client: null, commercial: 'Parent subscription', booking: 'Members only', billing: 'Monthly subscription', days: [5], start: '18:00', end: '19:00', capacity: 16, pattern: 'Weekly', startDate: '2026-09-04', endDate: '2026-12-11', lifecycle: 'Active', price: 8700, staff: [{ coach: 'marcus', role: 'Lead' }] },
    { id: 'SES-05', name: 'Riverside PPA (Years 5-6)', programme: 'Schools', area: 'Schools', ageGroup: 'Years 5-6', venue: 'riverside', client: 'CLI-02', commercial: 'Client contract', booking: 'Client managed', billing: 'Per class, invoiced monthly', days: [1, 4], start: '13:15', end: '15:15', capacity: 60, pattern: 'Weekly', startDate: '2026-09-03', endDate: '2026-12-10', lifecycle: 'Active', price: 4500, headcount: 56, staff: [{ coach: 'tom', role: 'Lead' }] },
    { id: 'SES-06', name: 'Northgate After-School', programme: 'Schools', area: 'Schools', ageGroup: 'Years 3-6', venue: 'northgate', client: 'CLI-01', commercial: 'Client contract', booking: 'Client managed', billing: 'Per session, invoiced monthly', days: [2, 5], start: '15:45', end: '16:45', capacity: 24, pattern: 'Weekly', startDate: '2026-09-04', endDate: '2026-12-11', lifecycle: 'Active', price: 5000, headcount: 18, staff: [{ coach: 'priya', role: 'Lead' }] },
    { id: 'SES-07', name: 'U11 Saturday Development', programme: 'Development Centre', area: 'Weekend', ageGroup: 'U11', venue: null, client: null, commercial: 'Parent subscription', booking: 'Open booking', billing: 'Per session booking', days: [6], start: '09:30', end: '10:30', capacity: 12, pattern: 'Selected dates', dates: ['2026-10-10', '2026-10-17'], startDate: '2026-10-10', endDate: '2026-10-17', lifecycle: 'Draft', price: 1200, staff: [] }
  ];
  D.session = function (id) { return D.sessions.filter(function (s) { return s.id === id; })[0]; };
  D.scheduleBreaks = [
    { id: 'BRK-01', type: 'INSET day', from: '2026-09-25', to: '2026-09-25', sessions: ['SES-06'], note: 'Northgate School INSET day' },
    { id: 'BRK-02', type: 'Venue closure', from: '2026-10-09', to: '2026-10-09', sessions: ['SES-04'], note: 'Hollins Park hall resurfacing: moved to Northgate' },
    { id: 'BRK-03', type: 'Half term', from: '2026-10-26', to: '2026-10-30', sessions: ['SES-01', 'SES-02', 'SES-03', 'SES-04', 'SES-05', 'SES-06'], note: 'Autumn half term' }
  ];

  /* Memberships (player to session) */
  var mem = [
    // player, session, state, start, extra
    ['PLY-0002', 'SES-01', 'Active', '2025-09-04'], ['PLY-0003', 'SES-01', 'Active', '2025-09-04'], ['PLY-0005', 'SES-01', 'Active', '2026-01-08'], ['PLY-0007', 'SES-01', 'Active', '2026-04-16'], ['PLY-0009', 'SES-01', 'Active', '2025-09-04'],
    ['PLY-0001', 'SES-02', 'Active', '2024-09-05'], ['PLY-0008', 'SES-02', 'Active', '2025-01-09'], ['PLY-0011', 'SES-02', 'Active', '2025-09-04'], ['PLY-0013', 'SES-02', 'Active', '2024-09-05'], ['PLY-0014', 'SES-02', 'Active', '2025-09-04'],
    ['PLY-0016', 'SES-02', 'Paused', '2025-01-09', { pause: { from: '2026-09-21', to: '2026-10-19', reason: 'Broken wrist: back after half term', by: 'Lucy Ellis', at: '2026-09-20T19:22' } }],
    ['PLY-0017', 'SES-02', 'Active', '2025-09-04'], ['PLY-0019', 'SES-02', 'Cancellation Pending', '2024-09-05', { cancel: { requested: '2026-10-01T08:42', by: 'Kate Hunt', reason: 'Moving to a Saturday club' } }],
    ['PLY-0006', 'SES-03', 'Active', '2024-09-05'], ['PLY-0012', 'SES-03', 'Active', '2025-09-04'], ['PLY-0015', 'SES-03', 'Active', '2025-01-09'], ['PLY-0018', 'SES-03', 'Active', '2024-09-05'], ['PLY-0020', 'SES-03', 'Active', '2025-09-04'], ['PLY-0021', 'SES-03', 'Active', '2025-09-04'], ['PLY-0023', 'SES-03', 'Active', '2026-04-16'],
    ['PLY-0004', 'SES-04', 'Active', '2024-09-05'], ['PLY-0020', 'SES-04', 'Active', '2026-01-08'], ['PLY-0022', 'SES-04', 'Active', '2025-09-04'], ['PLY-0024', 'SES-04', 'Active', '2025-01-09'], ['PLY-0025', 'SES-04', 'Active', '2024-09-05'],
    ['PLY-0026', 'SES-04', 'Ending Scheduled', '2025-09-04', { cancel: { requested: '2026-09-20T10:15', by: 'Tina Moore', reason: 'Focusing on netball', noticeStart: '2026-09-20', end: '2026-10-20', approvedBy: 'Josh Evans', approvedAt: '2026-09-21T09:02' } }],
    ['PLY-0012', 'SES-02', 'Ended', '2024-09-05', { ended: { on: '2026-07-16', reason: 'Moved up to U12 Academy' } }]
  ];
  D.memberships = mem.map(function (m, i) {
    var s = D.session(m[1]);
    return Object.assign({ id: 'MEM-' + String(101 + i), player: m[0], session: m[1], state: m[2], start: m[3], price: s.price, billingRule: 'BR-0' + (['SES-01', 'SES-02', 'SES-03', 'SES-04'].indexOf(m[1]) + 1), priceLabel: K.money(s.price) + ' a month' }, m[4] || {});
  });
  D.trials = [{ id: 'TRL-01', player: 'PLY-0010', session: 'SES-01', dates: ['2026-09-24', '2026-10-01'], status: 'Booked', by: 'Claire Dawson', at: '2026-09-18T20:11' }];
  function members(sid, date) {
    return D.memberships.filter(function (m) {
      if (m.session !== sid) return false;
      if (m.state === 'Ended') return false;
      if (m.state === 'Paused' && m.pause && date >= m.pause.from && date <= m.pause.to) return false;
      if (m.start > date) return false;
      return true;
    }).map(function (m) { return m.player; });
  }
  D.expectedPlayers = function (o) {
    var list = members(o.sessionId, o.date);
    D.trials.forEach(function (t) { if (t.session === o.sessionId && t.dates.indexOf(o.date) >= 0) list.push(t.player); });
    return list;
  };

  /* Occurrences: weekly from each session's days between 3 Sep and 23 Oct */
  var occ = [], n = 1;
  function add(s, date, extra) {
    var o = Object.assign({ id: '', sessionId: s.id, session: s.name, programme: s.programme, ageGroup: s.ageGroup, date: date, start: s.start, end: s.end, venue: s.venue, capacity: s.capacity,
      staff: s.staff.map(function (x) { return { coach: x.coach, lead: x.role === 'Lead', role: x.role, actualRole: x.role, attended: date < '2026-10-01' ? 'Attended' : null }; }),
      status: date < '2026-10-01' ? 'Completed' : 'Scheduled', change: null, confirmed: date < '2026-10-01' ? { by: 'David Cole', at: K.addDays(date, -1) + 'T18:00' } : (date <= '2026-10-02' ? { by: 'David Cole', at: '2026-09-30T17:45' } : null), notes: '', history: [] }, extra || {});
    occ.push(o);
    return o;
  }
  var d = '2026-09-03';
  while (d <= '2026-10-23') {
    var wd = K.parse(d).getDay();
    D.sessions.forEach(function (s) {
      if (s.lifecycle !== 'Active' || s.days.indexOf(wd) < 0 || d < s.startDate) return;
      if (s.id === 'SES-06' && d === '2026-09-25') return;
      add(s, d);
    });
    d = K.addDays(d, 1);
  }
  D.sessions.filter(function (s) { return s.id === 'SES-07'; })[0].dates.forEach(function (dt) { add(D.session('SES-07'), dt, { status: 'Scheduled', venue: null, confirmed: null, draft: true }); });
  occ.sort(function (a, b) { return (a.date + a.start) < (b.date + b.start) ? -1 : 1; });
  occ.forEach(function (o) { o.id = 'OCC-' + String(n++).padStart(4, '0'); });
  function find(sid, date) { return occ.filter(function (o) { return o.sessionId === sid && o.date === date; })[0]; }

  /* Edge cases */
  var cx = find('SES-02', '2026-09-17');
  Object.assign(cx, { status: 'Cancelled', change: 'Cancelled', cancelReason: 'Waterlogged pitch after storm', cancelledBy: 'Josh Evans', cancelledAt: '2026-09-17T13:05',
    outcome: { parent: { type: 'Credit', amount: 2175, reason: 'One session of a 4-week month (£87 ÷ 4)' }, venue: { type: 'Credit', amount: 4500, reason: 'Centre credited the booking' }, coach: { type: 'None', amount: 0, reason: 'Cancelled over 3 hours before start' }, by: 'Josh Evans', at: '2026-09-17T15:40' } });
  cx.staff.forEach(function (s) { s.attended = 'Not required'; });
  var rs = find('SES-04', '2026-09-18');
  var rep = add(D.session('SES-04'), '2026-09-19', { start: '10:00', end: '11:00', status: 'Completed', replacementOf: rs.id, change: 'Replacement' });
  rep.id = 'OCC-' + String(n++).padStart(4, '0');
  Object.assign(rs, { status: 'Rescheduled', change: 'Rescheduled', replacement: rep.id, cancelReason: 'Hollins Park double-booked the hall', cancelledBy: 'David Cole', cancelledAt: '2026-09-16T10:20' });
  rs.staff.forEach(function (s) { s.attended = 'Moved'; });
  var vo = find('SES-04', '2026-10-09'); Object.assign(vo, { venue: 'northgate', venueOverride: { from: 'hollins', reason: 'Hollins Park hall resurfacing', by: 'Sam Okafor', at: '2026-09-22T11:10' }, change: 'Venue changed' });
  var u13 = find('SES-04', '2026-10-02'); u13.staff = []; u13.confirmed = null; u13.notes = 'Marcus Bell moved to a new contract; cover needed.';
  var u12 = find('SES-03', '2026-10-01'); u12.staff.forEach(function (s) { if (s.coach === 'charlie') { s.unavailable = true; s.covering = null; } }); u12.confirmed = null;
  var cap = find('SES-01', '2026-10-15'); cap.capacityOverride = { value: 16, reason: 'Two trial players joining', by: 'David Cole', at: '2026-09-29T09:12' }; cap.capacity = 16;
  occ.sort(function (a, b) { return (a.date + a.start) < (b.date + b.start) ? -1 : 1; });
  occ.forEach(function (o) {
    o.players = o.sessionId === 'SES-05' || o.sessionId === 'SES-06' ? D.session(o.sessionId).headcount : D.expectedPlayers(o).length;
    o.history = [{ text: 'Added from the weekly timetable', who: 'System', at: '2026-08-20T09:00' }];
    if (o.confirmed) o.history.push({ text: 'Session confirmed', who: o.confirmed.by, at: o.confirmed.at, tone: 'ok' });
    if (o.status === 'Cancelled') o.history.push({ text: 'Cancelled: ' + o.cancelReason, who: o.cancelledBy, at: o.cancelledAt, tone: 'danger' }, { text: 'Financial outcome recorded', who: o.outcome.by, at: o.outcome.at, tone: 'info' });
    if (o.status === 'Rescheduled') o.history.push({ text: 'Rescheduled to Sat 19 Sep, 10:00', who: o.cancelledBy, at: o.cancelledAt, tone: 'warn' });
    if (o.venueOverride) o.history.push({ text: 'Venue changed to Northgate Sports Centre', who: o.venueOverride.by, at: o.venueOverride.at, tone: 'warn' });
    if (o.capacityOverride) o.history.push({ text: 'Capacity raised to 16', who: o.capacityOverride.by, at: o.capacityOverride.at, tone: 'info' });
  });
  D.occurrences.length = 0; Array.prototype.push.apply(D.occurrences, occ);
  D.occ = function (id) { return D.occurrences.filter(function (o) { return o.id === id; })[0]; };
  D.findOcc = find;

  /* Registers: completed for delivered sessions, one left incomplete. */
  D.registers = {};
  var marks = ['Present', 'Present', 'Present', 'Present', 'Present', 'Late', 'Present', 'Absent', 'Present', 'Present', 'Excused', 'Present'];
  D.occurrences.forEach(function (o, i) {
    if (o.status !== 'Completed') { D.registers[o.id] = { state: 'Not started', marks: {}, oneOffs: [] }; return; }
    var lead = (o.staff.filter(function (s) { return s.lead; })[0] || {}).coach || 'david';
    var by = D.coaches[lead].name, at = o.date + 'T' + o.end;
    var r = { state: 'Completed', by: by, at: at, marks: {}, oneOffs: [] };
    if (o.sessionId === 'SES-05' || o.sessionId === 'SES-06') { r.headcount = { expected: o.players, actual: o.players - (i % 3) }; }
    else D.expectedPlayers(o).forEach(function (p, j) { r.marks[p] = { mark: marks[(i + j * 5) % marks.length], note: '', by: by, at: at }; });
    D.registers[o.id] = r;
  });
  var inc = D.registers[find('SES-03', '2026-09-24').id];
  inc.state = 'In progress'; inc.completedBy = null; delete inc.by; inc.startedBy = 'Charlie Hughes'; inc.startedAt = '2026-09-24T19:04';
  Object.keys(inc.marks).slice(4).forEach(function (k) { delete inc.marks[k]; });

  var db = Hub.db;
  db.getVenues = function () { return D.venueList; };
  db.getVenue = function (key) { return D.venues[key] || D.venueList.filter(function (v) { return v.id === key; })[0]; };
  db.venueName = function (key) { return key ? (D.venues[key] || {}).name : 'No venue yet'; };
  db.getVenueUnavailability = function (key) { return D.venueUnavailable.filter(function (u) { return !key || u.venue === key; }); };
  db.addVenueUnavailability = function (u) { D.venueUnavailable.push(u); return u; };
  db.getSessions = function () { return D.sessions; };
  db.getSession = function (id) { return D.session(id); };
  db.addSession = function (s) { D.sessions.push(s); return s; };
  db.getScheduleBreaks = function () { return D.scheduleBreaks; };
  db.getMemberships = function (f) { return f ? D.memberships.filter(f) : D.memberships; };
  db.getMembership = function (id) { return D.memberships.filter(function (m) { return m.id === id; })[0]; };
  db.addMembership = function (m) { D.memberships.push(m); return m; };
  db.getPlayerMemberships = function (pid) { return D.memberships.filter(function (m) { return m.player === pid; }); };
  db.getTrials = function () { return D.trials; };
  db.getOccurrences = function (f) { return f ? D.occurrences.filter(f) : D.occurrences; };
  db.getOccurrence = function (id) { return D.occ(id); };
  db.findOccurrence = function (sid, date) { return find(sid, date); };
  db.getTodayOccurrences = function () { return D.occurrences.filter(function (o) { return o.date === '2026-10-01'; }); };
  db.addOccurrence = function (o) { D.occurrences.push(o); return o; };
  db.getExpectedPlayers = function (o) { return D.expectedPlayers(o); };
  db.getRegister = function (occId) { return D.registers[occId] || (D.registers[occId] = { state: 'Not started', marks: {}, oneOffs: [] }); };
  db.getRegisters = function () { return D.registers; };
  db.setMark = function (occId, pid, mark, note, who, at) { var r = db.getRegister(occId); r.marks[pid] = { mark: mark, note: note || '', by: who, at: at }; if (r.state === 'Not started') { r.state = 'In progress'; r.startedBy = who; r.startedAt = at; } return r; };
  db.completeRegister = function (occId, who, at) { var r = db.getRegister(occId); r.state = 'Completed'; r.by = who; r.at = at; return r; };

  /* ---------- Pass 12 additions: sessions, occurrences, registers, eligibility, venues ---------- */
  var pad = function (n, w) { return String(n).padStart(w, '0'); };
  function hist(o, text, who, at, tone, detail) { o.history = o.history || []; o.history.push({ text: text, who: who, at: at, tone: tone || '', detail: detail || '' }); }
  function nowHM() { return pad(D.now.getHours(), 2) + ':' + pad(D.now.getMinutes(), 2); }
  var CLIENT_SESSIONS = function (sid) { var s = D.session(sid); return !!(s && s.client); };

  /* Choices used by the session wizard and filters */
  D.sessionOptions = {
    programmes: ['Development Centre', 'TDC', 'Academy', 'Schools', 'Holiday camps'],
    areas: ['Evening', 'Weekend', 'Schools', 'Holiday'],
    ageGroups: ['U7', 'U8', 'U9/10', 'U11', 'U12', 'U13/14', 'Years 1-2', 'Years 3-6', 'Years 5-6'],
    schoolYears: ['Reception', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9'],
    commercial: ['Parent subscription', 'Client contract', 'Pay as you go', 'Package'],
    booking: ['Members only', 'Open booking', 'Invite only', 'Client managed'],
    billing: ['Monthly subscription', 'Per session booking', 'Per class, invoiced monthly', 'Per session, invoiced monthly', 'Package price'],
    breakTypes: ['Half term', 'INSET day', 'Venue closure', 'Bank holiday'],
    lifecycle: ['Draft', 'Active', 'Inactive'],
    staffRoles: ['Lead', 'Coach', 'Learning'],
    parentOutcome: ['Credit', 'Refund', 'None'], venueOutcome: ['Paid', 'Credit', 'None'], coachOutcome: ['Paid', 'Part paid', 'None'],
    marks: ['Present', 'Late', 'Absent', 'Excused'],
    dows: [[1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri'], [6, 'Sat'], [0, 'Sun']],
    /* Starting values for a new session in the wizard */
    newSession: { name: '', programme: 'Development Centre', area: 'Evening', ageGroup: 'U11', client: '', commercial: 'Parent subscription', booking: 'Members only', billing: 'Monthly subscription', price: 7200, lifecycle: 'Draft',
      pattern: 'Weekly', days: [3], start: '17:00', end: '18:00', startDate: '2026-10-07', endDate: '2026-12-09', dates: [], breaks: ['BRK-03'], venue: 'northgate', capacity: 16, meetingPoint: 'Astro gate', staff: { jack: 'Lead' } }
  };

  /* Lifecycle history on sessions, plus one inactive client session */
  D.sessions.forEach(function (s) {
    s.history = s.lifecycle === 'Draft'
      ? [{ text: 'Session created as Draft', who: 'Sam Okafor', at: '2026-09-28T11:20' }]
      : [{ text: 'Session created as Draft', who: 'Josh Evans', at: '2026-07-14T10:00' }, { text: 'Status changed to Active', who: 'Josh Evans', at: '2026-08-20T09:00', tone: 'ok', detail: 'Autumn term published' }];
    s.meetingPoint = s.meetingPoint || (s.venue ? D.venues[s.venue].meetingPoint || '' : '');
  });
  D.sessions.push({ id: 'SES-08', name: 'Kingsmead After-School', programme: 'Schools', area: 'Schools', ageGroup: 'Years 3-4', venue: 'kingsmead', client: 'CLI-03', commercial: 'Client contract', booking: 'Client managed', billing: 'Per session, invoiced monthly', days: [1], start: '16:00', end: '17:00', capacity: 20, pattern: 'Weekly', startDate: '2026-01-12', endDate: '2026-07-13', lifecycle: 'Inactive', price: 5000, headcount: 18, staff: [{ coach: 'david', role: 'Lead' }], meetingPoint: 'Hall doors',
    history: [{ text: 'Session created as Draft', who: 'Josh Evans', at: '2025-12-02T09:15' }, { text: 'Status changed to Active', who: 'Josh Evans', at: '2026-01-05T08:30', tone: 'ok' }, { text: 'Status changed to Inactive', who: 'Josh Evans', at: '2026-07-20T16:05', detail: 'Kingsmead Primary paused the service for the autumn term' }] });

  /* Eligibility rules per session, and per-player overrides */
  D.eligibility = {
    'SES-01': { ageGroups: ['U8'], schoolYears: ['Year 3'], membership: true },
    'SES-02': { ageGroups: ['U9/10'], schoolYears: ['Year 4', 'Year 5'], membership: true },
    'SES-03': { ageGroups: ['U12'], schoolYears: ['Year 7'], membership: true },
    'SES-04': { ageGroups: ['U13/14'], schoolYears: ['Year 8', 'Year 9'], membership: true },
    'SES-05': { ageGroups: ['Years 5-6'], schoolYears: ['Year 5', 'Year 6'], membership: false },
    'SES-06': { ageGroups: ['Years 3-6'], schoolYears: ['Year 3', 'Year 4', 'Year 5', 'Year 6'], membership: false },
    'SES-07': { ageGroups: ['U11'], schoolYears: ['Year 5', 'Year 6'], membership: false },
    'SES-08': { ageGroups: ['Years 3-4'], schoolYears: ['Year 3', 'Year 4'], membership: false }
  };
  Object.keys(D.eligibility).forEach(function (k) { Object.assign(D.eligibility[k], { by: 'Josh Evans', at: '2026-08-20T09:05' }); });
  D.eligibilityOverrides = [
    { id: 'ELO-01', player: 'PLY-0023', session: 'SES-03', decision: 'Allow', reason: 'Playing up a year: assessed at the summer camp', by: 'David Cole', at: '2026-04-10T17:20' },
    { id: 'ELO-02', player: 'PLY-0007', session: 'SES-01', decision: 'Allow', reason: 'Year 2: joins older sibling group on coach assessment', by: 'Jack Morgan', at: '2026-04-14T18:40' },
    { id: 'ELO-03', player: 'PLY-0016', session: 'SES-04', decision: 'Deny', reason: 'Not cleared to play up until the wrist has healed', by: 'David Cole', at: '2026-09-21T09:30' }
  ];

  /* Venue history for the active toggle */
  D.venueList.forEach(function (v) { v.history = [{ text: v.active ? 'Venue active' : 'Venue set to inactive', who: 'Josh Evans', at: v.active ? '2026-07-14T09:00' : '2026-07-20T16:00', detail: v.active ? '' : 'Client paused the service' }]; });

  /* One-off attendee seeded on a past register, and today's trial note */
  var oneOffOcc = find('SES-01', '2026-09-24');
  if (oneOffOcc) D.registers[oneOffOcc.id].oneOffs.push({ id: 'ONE-01', player: null, name: 'Leo Grant’s cousin (Max)', ageGroup: 'U8', note: 'Visiting for half term; parent signed the day form', mark: 'Present', by: 'Jack Morgan', at: '2026-09-24T16:34' });

  function nextOccId() { var max = 0; D.occurrences.forEach(function (o) { max = Math.max(max, +o.id.slice(4) || 0); }); return 'OCC-' + pad(max + 1, 4); }
  function makeOcc(s, date, extra) {
    var o = Object.assign({ id: nextOccId(), sessionId: s.id, session: s.name, programme: s.programme, ageGroup: s.ageGroup, date: date, start: s.start, end: s.end, venue: s.venue, capacity: s.capacity,
      staff: (s.staff || []).map(function (x) { return { coach: x.coach, lead: x.role === 'Lead', role: x.role, actualRole: x.role, attended: null }; }),
      status: 'Scheduled', change: null, confirmed: null, notes: '', history: [] }, extra || {});
    if (s.lifecycle === 'Draft') o.draft = true;
    o.players = s.client ? (s.headcount || 0) : D.expectedPlayers(o).length;
    D.occurrences.push(o);
    D.occurrences.sort(function (a, b) { return (a.date + a.start) < (b.date + b.start) ? -1 : 1; });
    D.registers[o.id] = { state: 'Not started', marks: {}, oneOffs: [] };
    return o;
  }

  db.getSessionOptions = function () { return D.sessionOptions; };
  db.isClientSession = function (sid) { return CLIENT_SESSIONS(sid); };
  db.getSessionOccurrences = function (sid) { return D.occurrences.filter(function (o) { return o.sessionId === sid; }); };
  db.getSessionMembers = function (sid) { return D.memberships.filter(function (m) { return m.session === sid && m.state !== 'Ended'; }); };
  db.getCalendarOccurrences = function (from, to) { return D.occurrences.filter(function (o) { return o.date >= from && o.date <= to; }); };

  /* Preview the dates a pattern produces. spec: { pattern, days, startDate, endDate, dates, start, end, breaks: [{type, from, to, note}] } */
  db.previewOccurrences = function (spec) {
    var list = [];
    if (spec.pattern === 'Selected dates') list = (spec.dates || []).slice().sort();
    else { var d = spec.startDate, n = 0; while (d && spec.endDate && d <= spec.endDate && n++ < 400) { if ((spec.days || []).indexOf(K.parse(d).getDay()) >= 0) list.push(d); d = K.addDays(d, 1); } }
    return list.map(function (date) {
      var b = (spec.breaks || []).filter(function (x) { return date >= x.from && date <= x.to; })[0];
      return { date: date, start: spec.start, end: spec.end, skipped: b ? b.type + (b.note ? ': ' + b.note : '') : null };
    });
  };
  /* Create a session and its occurrences (skipped dates are left out). */
  db.createSession = function (spec, who, at) {
    var n = 0; D.sessions.forEach(function (s) { n = Math.max(n, +s.id.slice(4) || 0); });
    var s = { id: 'SES-' + pad(n + 1, 2), name: spec.name, programme: spec.programme, area: spec.area, ageGroup: spec.ageGroup, venue: spec.venue || null, client: spec.client || null, commercial: spec.commercial, booking: spec.booking, billing: spec.billing,
      days: spec.days || [], start: spec.start, end: spec.end, capacity: +spec.capacity || 0, pattern: spec.pattern, dates: spec.pattern === 'Selected dates' ? (spec.dates || []).slice() : undefined, startDate: spec.startDate, endDate: spec.endDate,
      lifecycle: spec.lifecycle || 'Draft', price: +spec.price || 0, headcount: spec.client ? +spec.capacity || 0 : undefined, staff: (spec.staff || []).slice(), meetingPoint: spec.meetingPoint || '',
      history: [{ text: 'Session created as ' + (spec.lifecycle || 'Draft'), who: who, at: at, tone: spec.lifecycle === 'Active' ? 'ok' : '' }] };
    if (s.pattern === 'Selected dates' && s.dates.length) { s.startDate = s.dates.slice().sort()[0]; s.endDate = s.dates.slice().sort().pop(); }
    D.sessions.push(s);
    D.eligibility[s.id] = { ageGroups: [s.ageGroup], schoolYears: [], membership: s.booking === 'Members only', by: who, at: at };
    (spec.breaks || []).forEach(function (b) {
      var ex = b.id && D.scheduleBreaks.filter(function (x) { return x.id === b.id; })[0];
      if (ex) { if (ex.sessions.indexOf(s.id) < 0) ex.sessions.push(s.id); }
      else D.scheduleBreaks.push({ id: 'BRK-' + pad(D.scheduleBreaks.length + 1, 2), type: b.type, from: b.from, to: b.to || b.from, sessions: [s.id], note: b.note || '' });
    });
    var made = db.previewOccurrences(spec).filter(function (p) { return !p.skipped; }).map(function (p) {
      var o = makeOcc(s, p.date); hist(o, 'Generated when the session was created', who, at); return o;
    });
    s.history.push({ text: made.length + ' dates created', who: who, at: at, tone: 'info' });
    return { session: s, occurrences: made };
  };
  /* Update a session; time, venue and capacity carry to future scheduled occurrences. */
  db.updateSession = function (id, patch, who, at) {
    var s = D.session(id); if (!s) return null;
    var before = { start: s.start, end: s.end, venue: s.venue, capacity: s.capacity };
    Object.assign(s, patch);
    var future = D.occurrences.filter(function (o) { return o.sessionId === id && o.date > K.today && o.status === 'Scheduled'; });
    future.forEach(function (o) {
      o.session = s.name; o.start = s.start; o.end = s.end; o.ageGroup = s.ageGroup; o.programme = s.programme;
      if (!o.venueOverride) o.venue = s.venue;
      if (!o.capacityOverride) o.capacity = s.capacity;
      if (patch.staff) o.staff = s.staff.map(function (x) { return { coach: x.coach, lead: x.role === 'Lead', role: x.role, actualRole: x.role, attended: null }; });
      hist(o, 'Session details updated', who, at, 'info');
    });
    s.history.push({ text: 'Session details updated', who: who, at: at, tone: 'info', detail: future.length + ' future sessions updated' + (before.start !== s.start ? '; time ' + before.start + ' → ' + s.start : '') });
    return future.length;
  };
  db.setSessionLifecycle = function (id, state, reason, who, at) {
    var s = D.session(id); if (!s) return null; var was = s.lifecycle; s.lifecycle = state;
    if (state === 'Active') D.occurrences.forEach(function (o) { if (o.sessionId === id) delete o.draft; });
    s.history.push({ text: 'Status changed from ' + was + ' to ' + state, who: who, at: at, tone: state === 'Active' ? 'ok' : state === 'Inactive' ? 'warn' : '', detail: reason || '' });
    return s;
  };
  db.getScheduleBreaksFor = function (sid) { return D.scheduleBreaks.filter(function (b) { return b.sessions.indexOf(sid) >= 0; }); };
  db.addScheduleBreak = function (b) { b.id = 'BRK-' + pad(D.scheduleBreaks.length + 1, 2); D.scheduleBreaks.push(b); return b; };

  /* Occurrence changes; every change writes to the occurrence history. */
  db.confirmOccurrence = function (id, who, at) { var o = D.occ(id); o.confirmed = { by: who, at: at }; hist(o, 'Session confirmed', who, at, 'ok'); return o; };
  db.cancelOccurrence = function (id, reason, who, at) {
    var o = D.occ(id); Object.assign(o, { status: 'Cancelled', change: 'Cancelled', cancelReason: reason, cancelledBy: who, cancelledAt: at });
    o.staff.forEach(function (s) { s.attended = 'Not required'; });
    hist(o, 'Cancelled: ' + reason, who, at, 'danger'); return o;
  };
  db.postponeOccurrence = function (id, reason, who, at) {
    var o = D.occ(id); Object.assign(o, { status: 'Postponed', change: 'Postponed: new date to be set', cancelReason: reason, cancelledBy: who, cancelledAt: at });
    hist(o, 'Postponed: ' + reason, who, at, 'warn'); return o;
  };
  db.rescheduleOccurrence = function (id, to, reason, who, at) {
    var o = D.occ(id), s = D.session(o.sessionId);
    var rep = makeOcc(s, to.date, { start: to.start || o.start, end: to.end || o.end, venue: to.venue || o.venue, capacity: o.capacity, replacementOf: o.id, change: 'Replacement',
      staff: o.staff.map(function (x) { return { coach: x.coach, lead: x.lead, role: x.role, actualRole: x.role, attended: null }; }) });
    hist(rep, 'Created as the replacement for ' + K.dd(o.date) + ', ' + o.start, who, at, 'info');
    Object.assign(o, { status: 'Rescheduled', change: 'Rescheduled', replacement: rep.id, cancelReason: reason, cancelledBy: who, cancelledAt: at });
    o.staff.forEach(function (x) { x.attended = 'Moved'; });
    hist(o, 'Rescheduled to ' + K.dd(rep.date) + ', ' + rep.start, who, at, 'warn', reason);
    return rep;
  };
  db.setOccurrenceVenue = function (id, venue, reason, who, at) {
    var o = D.occ(id), from = o.venueOverride ? o.venueOverride.from : o.venue;
    o.venue = venue; o.venueOverride = { from: from, reason: reason, by: who, at: at }; o.change = 'Venue changed';
    hist(o, 'Venue changed to ' + db.venueName(venue), who, at, 'warn', reason); return o;
  };
  db.setOccurrenceCapacity = function (id, value, reason, who, at) {
    var o = D.occ(id), was = o.capacity; o.capacity = +value; o.capacityOverride = { value: +value, from: was, reason: reason, by: who, at: at };
    hist(o, 'Capacity changed from ' + was + ' to ' + value, who, at, 'info', reason); return o;
  };
  db.setOccurrenceNotes = function (id, notes, who, at) { var o = D.occ(id); o.notes = notes; o.notesBy = who; o.notesAt = at; hist(o, 'Operational notes updated', who, at); return o; };
  db.updateOccurrenceStaff = function (id, coach, patch, who, at) {
    var o = D.occ(id), s = o.staff.filter(function (x) { return x.coach === coach; })[0]; if (!s) return null;
    Object.assign(s, patch); if (patch.covering) s.unavailable = true;
    hist(o, 'Staff updated: ' + db.coachName(coach), who, at, 'info', Object.keys(patch).map(function (k) { return k + ': ' + (k === 'covering' ? db.coachName(patch[k]) : patch[k]); }).join(', '));
    return s;
  };
  db.getAffectedPlayers = function (id) { var o = D.occ(id); return o ? D.expectedPlayers(o) : []; };
  /* Financial outcome of a cancellation or reschedule. A parent Credit creates a family credit per affected player; a Refund creates a refund. */
  db.recordOccurrenceOutcome = function (id, outcome, who, at) {
    var o = D.occ(id), s = D.session(o.sessionId), made = { credits: [], refunds: [] };
    var label = (o.status === 'Rescheduled' ? 'Rescheduled ' : o.status === 'Postponed' ? 'Postponed ' : 'Cancelled ') + s.name + ', ' + K.dd(o.date);
    if (!s.client && outcome.parent.type !== 'None' && outcome.parent.amount > 0) {
      db.getAffectedPlayers(id).forEach(function (pid) {
        var p = db.getPlayer(pid); if (!p) return;
        if (outcome.parent.type === 'Credit') made.credits.push(db.addFamilyCredit({ family: p.family, player: pid, amount: outcome.parent.amount, source: label, occurrence: id, at: at, by: who, reason: outcome.parent.reason }));
        else made.refunds.push(db.addRefund({ family: p.family, player: pid, amount: outcome.parent.amount, reason: label + ': ' + outcome.parent.reason, decidedBy: who, at: at, method: 'Card refund', occurrence: id, state: 'Pending' }));
      });
    }
    o.outcome = Object.assign({}, outcome, { by: who, at: at, issued: true, credits: made.credits.map(function (c) { return c.id; }), refunds: made.refunds.map(function (r) { return r.id; }), notified: made.credits.length + made.refunds.length });
    hist(o, 'Financial outcome recorded', who, at, 'info', 'Parents ' + outcome.parent.type.toLowerCase() + ' · venue ' + outcome.venue.type.toLowerCase() + ' · coach ' + outcome.coach.type.toLowerCase());
    if (o.outcome.notified) hist(o, 'Parents notified (' + o.outcome.notified + ' families)', who, at, 'ok');
    return made;
  };

  /* Registers */
  db.isRegisterDue = function (o) { return o.date < K.today || (o.date === K.today && o.start <= nowHM()); };
  db.getOutstandingRegisters = function () {
    return D.occurrences.filter(function (o) { return !o.draft && (o.status === 'Completed' || o.status === 'Scheduled') && db.isRegisterDue(o) && db.getRegister(o.id).state !== 'Completed'; });
  };
  db.getRegisterRows = function (id) {
    var o = D.occ(id), r = db.getRegister(id);
    var list = D.expectedPlayers(o).map(function (pid) {
      var m = D.memberships.filter(function (x) { return x.player === pid && x.session === o.sessionId && x.state !== 'Ended'; })[0];
      var trial = D.trials.filter(function (t) { return t.player === pid && t.session === o.sessionId && t.dates.indexOf(o.date) >= 0; })[0];
      return { id: pid, player: db.getPlayer(pid), membership: m ? m.state : null, trial: !!trial, mark: r.marks[pid] || null, oneOff: false };
    });
    (r.oneOffs || []).forEach(function (x) { list.push({ id: x.id, player: x.player ? db.getPlayer(x.player) : null, name: x.name, ageGroup: x.ageGroup, note: x.note, oneOff: x, membership: null, trial: false, mark: r.marks[x.id] || (x.mark ? { mark: x.mark, note: '', by: x.by, at: x.at } : null) }); });
    return list;
  };
  db.addOneOff = function (occId, x, who, at) {
    var r = db.getRegister(occId); r.oneOffs = r.oneOffs || [];
    var one = Object.assign({ id: 'ONE-' + occId.slice(4) + '-' + (r.oneOffs.length + 1), by: who, at: at }, x);
    if (one.player && !one.name) one.name = db.getPlayer(one.player).name;
    r.oneOffs.push(one);
    if (r.state === 'Not started') { r.state = 'In progress'; r.startedBy = who; r.startedAt = at; }
    hist(D.occ(occId), 'One-off player added to the register: ' + one.name, who, at, 'info');
    return one;
  };
  db.setHeadcount = function (occId, actual, who, at) {
    var o = D.occ(occId), r = db.getRegister(occId);
    r.headcount = { expected: (r.headcount && r.headcount.expected) || o.players, actual: +actual, by: who, at: at };
    if (r.state === 'Not started') { r.state = 'In progress'; r.startedBy = who; r.startedAt = at; }
    return r;
  };
  db.finishRegister = function (occId, who, at) {
    var o = D.occ(occId), r = db.completeRegister(occId, who, at);
    if (o.status === 'Scheduled') { o.status = 'Completed'; o.staff.forEach(function (s) { if (!s.attended) s.attended = s.unavailable && !s.covering ? 'Absent' : 'Attended'; }); }
    hist(o, 'Register completed', who, at, 'ok');
    return r;
  };
  db.reopenRegister = function (occId, reason, who, at) { var r = db.getRegister(occId); r.state = 'In progress'; r.reopenedBy = who; r.reopenedAt = at; hist(D.occ(occId), 'Register reopened', who, at, 'warn', reason || ''); return r; };
  function summarise(list) {
    var c = { Present: 0, Late: 0, Absent: 0, Excused: 0 };
    list.forEach(function (x) { if (c[x.mark] != null) c[x.mark]++; });
    var counted = c.Present + c.Late + c.Absent;
    return { present: c.Present, late: c.Late, absent: c.Absent, excused: c.Excused, total: list.length, pct: counted ? Math.round((c.Present + c.Late) / counted * 100) : null };
  }
  /* Attendance history for one player, newest first. */
  db.getAttendance = function (pid, sid) {
    var out = [];
    D.occurrences.forEach(function (o) {
      if (sid && o.sessionId !== sid) return;
      var r = D.registers[o.id]; if (!r || !r.marks[pid]) return;
      out.push(Object.assign({ occurrence: o }, r.marks[pid]));
    });
    return out.sort(function (a, b) { return a.occurrence.date < b.occurrence.date ? 1 : -1; });
  };
  db.getAttendanceSummary = function (pid, sid) { return summarise(db.getAttendance(pid, sid)); };
  db.getSessionAttendance = function (sid) {
    var ids = {};
    D.occurrences.forEach(function (o) { if (o.sessionId !== sid) return; var r = D.registers[o.id]; if (r) Object.keys(r.marks).forEach(function (p) { if (p.indexOf('PLY-') === 0) ids[p] = 1; }); });
    var players = Object.keys(ids).sort().map(function (pid) { return { player: db.getPlayer(pid), summary: db.getAttendanceSummary(pid, sid) }; });
    var all = []; players.forEach(function (p) { all = all.concat(db.getAttendance(p.player.id, sid)); });
    var heads = D.occurrences.filter(function (o) { return o.sessionId === sid && D.registers[o.id] && D.registers[o.id].headcount; }).map(function (o) { return D.registers[o.id].headcount; });
    var hc = heads.length ? Math.round(K.sum(heads, 'actual') / K.sum(heads, 'expected') * 100) : null;
    return { players: players, summary: summarise(all), headcount: hc, registers: D.occurrences.filter(function (o) { return o.sessionId === sid && D.registers[o.id] && D.registers[o.id].state === 'Completed'; }).length };
  };

  /* Eligibility */
  db.getEligibilityRules = function (sid) { return sid ? D.eligibility[sid] : D.eligibility; };
  db.setEligibilityRule = function (sid, patch, who, at) { var r = D.eligibility[sid] = Object.assign(D.eligibility[sid] || {}, patch, { by: who, at: at }); return r; };
  db.getEligibilityOverrides = function (sid) { return D.eligibilityOverrides.filter(function (x) { return !sid || x.session === sid; }); };
  db.addEligibilityOverride = function (x) { x.id = 'ELO-' + pad(D.eligibilityOverrides.length + 1, 2); D.eligibilityOverrides.push(x); return x; };
  db.revokeEligibilityOverride = function (id, who, at) { var x = D.eligibilityOverrides.filter(function (e) { return e.id === id; })[0]; if (x) { x.revokedBy = who; x.revokedAt = at; } return x; };
  db.checkEligibility = function (pid, sid) {
    var p = db.getPlayer(pid), rule = D.eligibility[sid];
    var ov = D.eligibilityOverrides.filter(function (x) { return x.player === pid && x.session === sid && !x.revokedAt; })[0];
    if (ov) return { ok: ov.decision === 'Allow', reason: ov.decision + ' override: ' + ov.reason, override: ov };
    if (!rule || !p) return { ok: true, reason: 'No rules set' };
    var age = !rule.ageGroups.length || rule.ageGroups.indexOf(p.ageGroup) >= 0, year = !rule.schoolYears.length || rule.schoolYears.indexOf(p.year) >= 0;
    var mem = !rule.membership || D.memberships.some(function (m) { return m.player === pid && m.session === sid && m.state !== 'Ended'; });
    var why = [];
    if (!age) why.push('age group ' + p.ageGroup); if (!year) why.push(p.year); if (!mem) why.push('no membership');
    return { ok: age && year && mem, reason: why.length ? 'Outside the rules: ' + why.join(', ') : 'Meets the rules' };
  };

  /* Venues */
  db.setVenueActive = function (key, on, who, at) { var v = D.venues[key]; v.active = !!on; v.history.push({ text: on ? 'Venue set to active' : 'Venue set to inactive', who: who, at: at, tone: on ? 'ok' : 'warn' }); return v; };
  /* Occurrences at a venue in a date range, including ones moved away from it. */
  db.getVenueOccurrences = function (key, from, to) {
    return D.occurrences.filter(function (o) { return (o.venue === key || (o.venueOverride && o.venueOverride.from === key)) && (!from || o.date >= from) && (!to || o.date <= to); });
  };
  db.getUnavailabilityImpact = function (u) { return db.getVenueOccurrences(u.venue, u.from, u.to); };

  /* Needs Attention inputs */
  db.getUnconfirmedOccurrences = function (days) { var to = K.addDays(K.today, days || 2); return D.occurrences.filter(function (o) { return !o.draft && o.status === 'Scheduled' && o.date >= K.today && o.date <= to && !o.confirmed; }); };
  db.getUnstaffedOccurrences = function (days) { var to = K.addDays(K.today, days || 7); return D.occurrences.filter(function (o) { return !o.draft && o.status === 'Scheduled' && o.date >= K.today && o.date <= to && (!o.staff.length || o.staff.some(function (s) { return s.unavailable && !s.covering; })); }); };
  db.getOutcomesMissing = function () { return D.occurrences.filter(function (o) { return (o.status === 'Cancelled' || o.status === 'Rescheduled' || o.status === 'Postponed') && !o.outcome; }); };
})();
