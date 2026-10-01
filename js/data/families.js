/* Players, families and bookings: invented mock data and Hub.db helpers
   (pass 12). Extends the people in people.js (families, parents, players)
   and the memberships in schedule.js with requests, lifecycle history,
   commercial setup (discounts, refund policies, package pricing, billing
   rules, terms versions), commercial adjustments and a seeded history for
   the Players & Parents area. Everything here is in memory only. */
(function () {
  var D = Hub.data, db = Hub.db, K = Hub.kit;
  function pick(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }
  function memOf(pid, sid) { return D.memberships.filter(function (m) { return m.player === pid && m.session === sid; })[0]; }

  /* ---------- People additions ---------- */
  /* A closed family (moved away), with an ended parent link and an inactive player. */
  D.families.push({ id: 'FAM-17', name: 'Kerr family', surname: 'Kerr', status: 'Closed', reviewDue: null, closureReason: 'Moved out of the area (Aberdeen)', closedBy: 'Josh Evans', closedAt: '2026-07-24T11:05', credits: [], requests: [], parents: ['PAR-19'] });
  D.parents.push({ id: 'PAR-19', name: 'Fiona Kerr', email: 'fiona.kerr@example.com', phone: '07700 900219', relationship: 'Mother', family: 'FAM-17', priority: 1,
    link: { method: 'Email match + date of birth', verifiedAt: '2025-01-06T18:20', invite: 'Verified', ended: { at: '2026-07-24T11:05', by: 'Josh Evans', reason: 'Family closed: moved out of the area' } } });
  /* A second guardian for the Moss family whose link has ended. */
  D.families.filter(function (f) { return f.id === 'FAM-08'; })[0].parents.push('PAR-20');
  D.parents.push({ id: 'PAR-20', name: 'Lee Moss', email: 'lee.moss@example.com', phone: '07700 900220', relationship: 'Stepfather', family: 'FAM-08', priority: 2,
    link: { method: 'Invited by Rachel Moss', verifiedAt: '2025-03-02T19:41', invite: 'Verified', ended: { at: '2026-06-30T10:12', by: 'Sam Okafor', reason: 'Rachel Moss asked for the link to be removed' } } });
  /* A grandparent guardian with access, contact priority 2 (priority never changes access). */
  D.families.filter(function (f) { return f.id === 'FAM-05'; })[0].parents.push('PAR-21');
  D.parents.push({ id: 'PAR-21', name: 'Ruth Grant', email: 'ruth.grant@example.com', phone: '07700 900221', relationship: 'Grandmother (guardian)', family: 'FAM-05', priority: 2,
    link: { method: 'Invited by Nina Grant', verifiedAt: null, invite: 'Invite sent', invitedAt: '2026-09-28T17:30', ended: null } });

  var streets = ['Larch Avenue', 'Cooper Street', 'Wren Close'];
  function addPlayer(o, i) {
    var par = D.parents.filter(function (p) { return p.family === o.family; });
    D.players.push(Object.assign({
      address: (5 + i * 7) + ' ' + streets[i % 3] + ', Westbrook WB' + (2 + i) + ' 4QX', medicalDetail: '', supportDetail: '', support: 'none',
      emergency: [{ name: par[0].name, rel: par[0].relationship, phone: par[0].phone }, { name: 'Grandparent · Pat ' + o.last, rel: 'Grandparent', phone: '07700 9004' + (40 + i) }]
    }, o, { name: o.first + ' ' + o.last }));
  }
  addPlayer({ id: 'PLY-0027', first: 'Lewis', last: 'Kerr', dob: '2016-07-03', family: 'FAM-17', ageGroup: 'U9/10', school: 'Westbrook Primary', year: 'Year 5', medical: 'none', photo: 'no', status: 'Inactive', joined: '2025-01-09', leftOn: '2026-07-16' }, 0);
  addPlayer({ id: 'PLY-0028', first: 'Arlo', last: 'Grant', dob: '2016-04-19', family: 'FAM-05', ageGroup: 'U9/10', school: 'Westbrook Primary', year: 'Year 5', medical: 'none', photo: 'yes', status: 'Active', joined: '2026-09-01', imported: { at: '2026-09-01T09:00', by: 'Sam Okafor', note: 'Imported from the previous booking system; not yet on a session' } }, 1);
  addPlayer({ id: 'PLY-0029', first: 'Poppy', last: 'Ellis', dob: '2018-12-12', family: 'FAM-10', ageGroup: 'U8', school: 'Westbrook Primary', year: 'Year 2', medical: 'none', photo: 'unknown', status: 'Active', joined: '2026-09-01', imported: { at: '2026-09-01T09:00', by: 'Sam Okafor', note: 'Imported from the previous booking system; not yet on a session' } }, 2);

  /* Who confirmed medical and photo answers, and when. */
  D.players.forEach(function (p, i) {
    var par = D.parents.filter(function (x) { return x.family === p.family; })[0];
    p.medicalConfirmed = p.medical === 'not_confirmed' ? null : { by: par.name, at: '2026-0' + (1 + i % 8) + '-' + String(10 + i % 18) + 'T19:' + String(10 + i).slice(-2) };
    p.photoAnswered = p.photo === 'unknown' ? null : { by: par.name, at: p.medicalConfirmed ? p.medicalConfirmed.at : '2026-09-01T09:00' };
  });

  /* Family review notes and history */
  D.families.forEach(function (f) {
    f.history = [{ text: 'Family created', who: 'System', at: '2024-08-20T09:00' }];
    if (f.status === 'Trial') f.history.push({ text: 'Trial family: first booking was a free trial', who: 'Claire Dawson', at: '2026-09-18T20:11', tone: 'info' });
    if (f.status === 'Closed') f.history.push({ text: 'Family closed: ' + f.closureReason, who: f.closedBy, at: f.closedAt, tone: 'danger' });
  });

  /* ---------- Membership lifecycle history ---------- */
  D.memberships.forEach(function (m) {
    m.history = m.history || [{ text: 'Membership started at ' + K.money(m.price) + ' a month', who: 'System', at: m.start + 'T09:00', tone: 'ok' }];
    if (m.pause) m.history.push({ text: 'Paused ' + K.dm(m.pause.from) + ' to ' + K.dm(m.pause.to) + ': ' + m.pause.reason, who: m.pause.by, at: m.pause.at, tone: 'warn' });
    if (m.cancel) {
      m.history.push({ text: 'Cancellation requested: ' + m.cancel.reason, who: m.cancel.by, at: m.cancel.requested, tone: 'warn' });
      if (m.cancel.approvedBy) m.history.push({ text: 'Cancellation approved. Notice from ' + K.dm(m.cancel.noticeStart) + ', ends ' + K.dm(m.cancel.end), who: m.cancel.approvedBy, at: m.cancel.approvedAt, tone: 'info' });
    }
    if (m.ended) { m.ended.by = m.ended.by || 'Josh Evans'; m.ended.at = m.ended.at || m.ended.on + 'T10:00'; m.history.push({ text: 'Membership ended: ' + m.ended.reason, who: m.ended.by, at: m.ended.at }); }
  });
  var kerr = { id: 'MEM-' + String(101 + D.memberships.length), player: 'PLY-0027', session: 'SES-02', state: 'Ended', start: '2025-01-09', price: 8700, billingRule: 'BR-02', priceLabel: K.money(8700) + ' a month',
    cancel: { requested: '2026-06-12T18:30', by: 'Fiona Kerr', reason: 'Moving out of the area', noticeStart: '2026-06-16', end: '2026-07-16', approvedBy: 'Josh Evans', approvedAt: '2026-06-16T09:00' }, ended: { on: '2026-07-16', reason: 'Notice period completed', by: 'System', at: '2026-07-16T23:59' } };
  kerr.history = [{ text: 'Membership started at ' + K.money(8700) + ' a month', who: 'System', at: '2025-01-09T09:00', tone: 'ok' }, { text: 'Cancellation requested: Moving out of the area', who: 'Fiona Kerr', at: '2026-06-12T18:30', tone: 'warn' },
    { text: 'Cancellation approved. Notice from 16 Jun, ends 16 Jul', who: 'Josh Evans', at: '2026-06-16T09:00', tone: 'info' }, { text: 'Membership ended: Notice period completed', who: 'System', at: '2026-07-16T23:59' }];
  D.memberships.push(kerr);

  /* ---------- Commercial setup ---------- */
  var C = D.commercial = {};
  C.billingRules = [
    { id: 'BR-01', name: 'U8 Development monthly', session: 'SES-01' }, { id: 'BR-02', name: 'U9/10 Development monthly', session: 'SES-02' },
    { id: 'BR-03', name: 'U12 Academy monthly', session: 'SES-03' }, { id: 'BR-04', name: 'U13/14 Development monthly', session: 'SES-04' }
  ].map(function (r) {
    return Object.assign(r, { payer: 'Parent (family account)', model: 'Monthly subscription', basis: 'Per calendar month, not per occurrence', amount: D.session(r.session).price, from: '2026-09-01', to: null, anchorDay: 1, noticeDays: 30, by: 'Josh Evans', at: '2026-08-14T10:20' });
  });
  C.discountGroups = [
    { id: 'DSG-01', name: 'Sibling', stacking: false, rules: [{ id: 'DSC-01', name: 'Sibling discount 10%', type: 'Sibling', amount: '10% off', appliesTo: 'Camps and single-session bookings', condition: 'Second and later child in the same checkout', active: true, from: '2025-09-01', by: 'Josh Evans', at: '2025-08-20T12:00' }] },
    { id: 'DSG-02', name: 'Membership', stacking: false, rules: [{ id: 'DSC-02', name: 'Member camp rate 5%', type: 'Membership', amount: '5% off', appliesTo: 'Camps', condition: 'Player has an Active membership on the camp start date', active: true, from: '2026-09-01', by: 'Josh Evans', at: '2026-08-14T10:30' }] },
    { id: 'DSG-03', name: 'Manual', stacking: false, rules: [{ id: 'DSC-03', name: 'Manual discount', type: 'Manual', amount: 'Set per booking', appliesTo: 'Any booking line', condition: 'Management only; a reason is required', active: true, from: '2025-01-01', by: 'Josh Evans', at: '2024-12-18T09:00' }] }
  ];
  C.stackingDefault = false;
  C.refundPolicies = [
    { id: 'RFP-01', name: 'Camp: full refund up to 7 days before', appliesTo: 'Camp days and packages', noticeHours: 168, outside: 'Full refund to the original payment method', inside: 'No refund; management may give a family credit', by: 'Josh Evans', at: '2025-09-01T09:00' },
    { id: 'RFP-02', name: 'Membership: 30 days notice', appliesTo: 'Monthly memberships', noticeHours: 720, outside: 'Membership ends 30 days after notice; no further charges', inside: 'Already-charged month is not refunded', by: 'Josh Evans', at: '2025-09-01T09:00' },
    { id: 'RFP-03', name: 'Single session: 48 hours', appliesTo: 'Open booking sessions', noticeHours: 48, outside: 'Family credit for the session price', inside: 'No refund or credit', by: 'Josh Evans', at: '2026-08-14T10:40' },
    { id: 'RFP-04', name: 'Not applicable', appliesTo: 'Free trials', noticeHours: 0, outside: 'Nothing to refund', inside: 'Nothing to refund', by: 'System', at: '2024-08-20T09:00' }
  ];
  C.packageGroups = [
    { id: 'PKG-01', name: 'Holiday camp days', appliesTo: 'Autumn half-term camp (26–28 Oct)', by: 'Josh Evans', at: '2026-08-30T15:10',
      tiers: [{ id: 'PKT-01', name: 'Single day', days: 1, price: 3000 }, { id: 'PKT-02', name: '3-day package', days: 3, price: 8000 }] },
    { id: 'PKG-02', name: 'Trial sessions', appliesTo: 'Development Centre and TDC trials', by: 'Josh Evans', at: '2025-09-01T09:00',
      tiers: [{ id: 'PKT-03', name: 'Trial (2 sessions)', days: 2, price: 0 }] }
  ];
  C.terms = [
    { id: 'TRM-P-01', kind: 'Terms and conditions', version: '1.0', from: '2024-09-01', to: '2025-08-31', summary: 'First published terms', by: 'Josh Evans', at: '2024-08-20T09:00' },
    { id: 'TRM-P-02', kind: 'Terms and conditions', version: '2.0', from: '2025-09-01', to: '2026-07-31', summary: '30-day notice for memberships', by: 'Josh Evans', at: '2025-08-18T15:00' },
    { id: 'TRM-P-03', kind: 'Terms and conditions', version: '3.0', from: '2026-08-01', to: null, summary: 'Camp packages and refund windows added', by: 'Josh Evans', at: '2026-07-28T16:40' },
    { id: 'POL-PR-02', kind: 'Privacy policy', version: '2.1', from: '2026-01-01', to: null, summary: 'Photo and video permission wording updated', by: 'Josh Evans', at: '2025-12-12T10:00' }
  ];
  C.acceptances = [
    { parent: 'PAR-03', version: 'TRM-P-03', at: '2026-09-20T19:43', evidence: 'Checkbox at checkout for BKG-001' },
    { parent: 'PAR-05', version: 'TRM-P-03', at: '2026-09-23T08:14', evidence: 'Checkbox at checkout for BKG-002' },
    { parent: 'PAR-08', version: 'TRM-P-03', at: '2026-09-18T20:10', evidence: 'Checkbox at checkout for BKG-003' },
    { parent: 'PAR-15', version: 'TRM-P-03', at: '2026-09-21T10:01', evidence: 'Checkbox at checkout for BKG-004' },
    { parent: 'PAR-01', version: 'TRM-P-03', at: '2026-08-03T21:12', evidence: 'Accepted at sign-in after the update' },
    { parent: 'PAR-01', version: 'POL-PR-02', at: '2026-01-04T09:30', evidence: 'Accepted at sign-in after the update' },
    { parent: 'PAR-14', version: 'TRM-P-02', at: '2025-09-02T18:05', evidence: 'Accepted at sign-in after the update' },
    { parent: 'PAR-07', version: 'TRM-P-02', at: '2025-09-06T08:40', evidence: 'Accepted at sign-up' }
  ];

  /* ---------- Commercial adjustments ---------- */
  var goodwill = db.getFamilyCredits('FAM-01').filter(function (c) { return /ADJ-02/.test(c.source); })[0];
  D.adjustments = [
    { id: 'ADJ-01', family: 'FAM-04', player: 'PLY-0007', kind: 'Charge', amount: 1500, reason: 'Replacement training top (size 7-8)', collection: 'Added to the next subscription charge', status: 'Collected', credit: null, by: 'Sam Okafor', at: '2026-09-08T12:30', collectedAt: '2026-09-08T12:31' },
    { id: 'ADJ-02', family: 'FAM-01', player: null, kind: 'Credit', amount: 1000, reason: 'Goodwill: Isla missed the photo day because of our timing mistake', collection: 'Family credit', status: 'Credit issued', credit: goodwill ? goodwill.id : null, by: 'Josh Evans', at: '2026-09-26T10:30' },
    { id: 'ADJ-03', family: 'FAM-12', player: 'PLY-0019', kind: 'Charge', amount: 500, reason: 'Late collection after U9/10 Development, Thu 24 Sep (25 minutes)', collection: 'Card payment link', status: 'Waived', waived: { by: 'Josh Evans', at: '2026-09-25T09:15', reason: 'First time; reminder sent instead' }, credit: null, by: 'David Cole', at: '2026-09-24T19:05' }
  ];

  /* ---------- Requests (Players & Parents inbox) ---------- */
  var george = memOf('PLY-0019', 'SES-02'), jackE = memOf('PLY-0016', 'SES-02'), sophie = memOf('PLY-0026', 'SES-04');
  var ava = db.getPlayer('PLY-0003');
  D.requests = [
    { id: 'REQ-01', type: 'Session request', status: 'Open', stage: 'New', player: 'PLY-0010', family: 'FAM-06', by: 'PAR-08', at: '2026-10-01T09:24', session: 'SES-01', reason: 'Mia enjoyed her trial and would like to join U8 Development every Thursday.', effective: '2026-10-08' },
    { id: 'REQ-02', type: 'Session request', status: 'Open', stage: 'New', player: 'PLY-0028', family: 'FAM-05', by: 'PAR-07', at: '2026-10-01T09:26', session: 'SES-02', reason: 'Arlo would like to train with his school friends on Thursdays.', effective: '2026-10-08' },
    { id: 'REQ-03', type: 'Cancellation', status: 'Open', stage: 'Ready to decide', player: 'PLY-0019', family: 'FAM-12', by: 'PAR-14', at: george.cancel.requested, membership: george.id, session: 'SES-02', reason: george.cancel.reason, effective: K.addDays('2026-10-01', 30) },
    { id: 'REQ-04', type: 'Detail change', status: 'Open', stage: 'Ready to decide', player: 'PLY-0003', family: 'FAM-02', by: 'PAR-03', at: '2026-09-30T21:02', reason: 'We have moved house.', effective: '2026-10-01',
      change: { field: 'address', label: 'Home address', before: ava.address, after: '7 Juniper Court, Westbrook WB3 6QX' } },
    { id: 'REQ-05', type: 'Detail change', status: 'Open', stage: 'Waiting on family', player: 'PLY-0009', family: 'FAM-05', by: 'PAR-07', at: '2026-09-29T20:15', reason: 'Medical details not confirmed at sign-up. We asked Nina to confirm.', effective: null,
      change: { field: 'medical', label: 'Medical state', before: 'Not confirmed', after: 'Confirmed none' } },
    { id: 'REQ-06', type: 'Pause', status: 'Resolved', stage: 'Done', player: 'PLY-0016', family: 'FAM-10', by: 'PAR-12', at: jackE.pause.at, membership: jackE.id, session: 'SES-02', reason: jackE.pause.reason, effective: jackE.pause.from, pauseTo: jackE.pause.to,
      resolution: { outcome: 'Approved', note: 'Paused until after half term; billing resumes 20 Oct.', by: 'Josh Evans', at: '2026-09-21T08:55' } },
    { id: 'REQ-07', type: 'Cancellation', status: 'Resolved', stage: 'Done', player: 'PLY-0026', family: 'FAM-16', by: 'PAR-18', at: sophie.cancel.requested, membership: sophie.id, session: 'SES-04', reason: sophie.cancel.reason, effective: sophie.cancel.end,
      resolution: { outcome: 'Approved', note: '30 days notice from 20 Sep; last session Fri 16 Oct.', by: sophie.cancel.approvedBy, at: sophie.cancel.approvedAt } },
    { id: 'REQ-08', type: 'Pause', status: 'Declined', stage: 'Done', player: 'PLY-0015', family: 'FAM-09', by: 'PAR-11', at: '2026-09-14T07:50', membership: memOf('PLY-0015', 'SES-03').id, session: 'SES-03', reason: 'Family holiday for one week.', effective: '2026-09-17', pauseTo: '2026-09-24',
      resolution: { outcome: 'Declined', note: 'Pauses are for four weeks or more; a single missed week is covered by the monthly price.', by: 'Josh Evans', at: '2026-09-14T12:10' } },
    { id: 'REQ-09', type: 'Second parent invite', status: 'Open', stage: 'Waiting on family', player: null, family: 'FAM-01', by: 'PAR-01', at: '2026-09-27T20:40', parent: 'PAR-02', reason: 'Please give Daniel access too.', effective: null }
  ];

  /* ---------- Seeded history for the area (merged with K.log entries) ---------- */
  D.peopleAudit = [
    { id: 'PPH-01', at: '2026-10-01T08:42', who: 'Kate Hunt', area: 'Memberships', summary: 'Cancellation requested for George Hunt (U9/10 Development)', entity: 'PLY-0019', before: { state: 'Active' }, after: { state: 'Cancellation Pending' } },
    { id: 'PPH-02', at: '2026-09-30T21:02', who: 'Hannah Price', area: 'Players', summary: 'Address change requested for Ava Price', entity: 'PLY-0003', before: { address: ava.address }, after: { address: '7 Juniper Court, Westbrook WB3 6QX' }, restricted: true },
    { id: 'PPH-03', at: '2026-09-28T17:30', who: 'Nina Grant', area: 'Parents', summary: 'Invite sent to Ruth Grant as a guardian', entity: 'PAR-21' },
    { id: 'PPH-04', at: '2026-09-27T20:40', who: 'Sarah Whitfield', area: 'Parents', summary: 'Second parent invite sent to Daniel Whitfield', entity: 'PAR-02' },
    { id: 'PPH-05', at: '2026-09-26T10:30', who: 'Josh Evans', area: 'Adjustments', summary: 'Goodwill credit of £10.00 for the Whitfield family (ADJ-02)', entity: 'FAM-01', finance: true },
    { id: 'PPH-06', at: '2026-09-21T09:02', who: 'Josh Evans', area: 'Memberships', summary: 'Cancellation approved for Sophie Moore; ends 20 Oct', entity: 'PLY-0026', before: { state: 'Cancellation Pending' }, after: { state: 'Ending Scheduled', end: '2026-10-20' } },
    { id: 'PPH-07', at: '2026-09-20T19:22', who: 'Lucy Ellis', area: 'Memberships', summary: 'Pause requested for Jack Ellis (21 Sep to 19 Oct)', entity: 'PLY-0016', before: { state: 'Active' }, after: { state: 'Paused' } },
    { id: 'PPH-08', at: '2026-09-12T18:05', who: 'Imran Shah', area: 'Players', summary: 'Medical details updated for Evie Shah', entity: 'PLY-0017', before: { medical: 'Nut allergy. EpiPen in bag.' }, after: { medical: 'Nut allergy (severe). EpiPen in bag front pocket.' }, restricted: true },
    { id: 'PPH-09', at: '2026-09-01T09:00', who: 'Sam Okafor', area: 'Players', summary: 'Imported Arlo Grant and Poppy Ellis from the previous booking system', entity: 'PLY-0028' },
    { id: 'PPH-10', at: '2026-07-24T11:05', who: 'Josh Evans', area: 'Families', summary: 'Kerr family closed: moved out of the area', entity: 'FAM-17', before: { status: 'Active' }, after: { status: 'Closed' } },
    { id: 'PPH-11', at: '2026-06-30T10:12', who: 'Sam Okafor', area: 'Parents', summary: 'Parent link ended for Lee Moss', entity: 'PAR-20', before: { link: 'Verified' }, after: { link: 'Ended', reason: 'Rachel Moss asked for the link to be removed' }, restricted: true }
  ];

  /* ================================================================ Helpers */
  function nextId(prefix, list, pad, base) { return prefix + String((base || 0) + list.length + 1).padStart(pad || 2, '0'); }
  function hist(m, text, who, at, tone) { m.history = m.history || []; m.history.push({ text: text, who: who, at: at, tone: tone }); }

  /* Players and people */
  db.getPlayersMissingMedical = function () { return D.players.filter(function (p) { return p.status !== 'Inactive' && p.medical === 'not_confirmed'; }); };
  db.getPlayersPhotoUnknown = function () { return D.players.filter(function (p) { return p.status !== 'Inactive' && p.photo === 'unknown'; }); };
  db.getPlayerFigures = function () {
    var act = D.players.filter(function (p) { return p.status === 'Active'; });
    return {
      active: act.length, trial: D.players.filter(function (p) { return p.status === 'Trial'; }).length, inactive: D.players.filter(function (p) { return p.status === 'Inactive'; }).length,
      parents: D.parents.filter(function (p) { return !p.link.ended && p.link.invite === 'Verified'; }).length,
      invites: D.parents.filter(function (p) { return !p.link.ended && p.link.invite === 'Invite sent'; }).length,
      families: D.families.filter(function (f) { return f.status !== 'Closed'; }).length,
      missingMedical: db.getPlayersMissingMedical().length, photoUnknown: db.getPlayersPhotoUnknown().length,
      openRequests: db.getOpenRequests().length
    };
  };
  db.getPlayerAttendance = function (pid) {
    var out = [];
    D.occurrences.forEach(function (o) { var r = D.registers[o.id]; if (r && r.marks && r.marks[pid]) out.push({ occurrence: o, mark: r.marks[pid].mark, by: r.marks[pid].by, at: r.marks[pid].at, register: r.state }); });
    return out.sort(function (a, b) { return a.occurrence.date < b.occurrence.date ? 1 : -1; });
  };
  db.getPlayerBookings = function (pid) { return db.getBookings(function (b) { return b.lines.some(function (l) { return l.player === pid; }); }); };
  db.getMigrationCandidates = function () {
    return D.players.filter(function (p) { return p.status !== 'Inactive' && !D.memberships.some(function (m) { return m.player === p.id && m.state !== 'Ended'; }); });
  };
  db.endParentLink = function (id, reason, who, at) { var p = db.getParent(id); p.link.ended = { reason: reason, by: who, at: at }; return p; };
  db.resendInvite = function (id, who, at) { var p = db.getParent(id); p.link.invitedAt = at; p.link.resentBy = who; return p; };
  db.verifyParentLink = function (id, method, who, at) { var p = db.getParent(id); p.link.invite = 'Verified'; p.link.verifiedAt = at; p.link.method = method; p.link.verifiedBy = who; return p; };

  /* Families */
  db.getFamiliesReviewDue = function (days) { var lim = K.addDays(K.today, days == null ? 30 : days); return D.families.filter(function (f) { return f.status !== 'Closed' && f.reviewDue && f.reviewDue <= lim; }); };
  db.setFamilyStatus = function (id, status, reason, who, at) {
    var f = db.getFamily(id); var before = f.status; f.status = status;
    if (status === 'Closed') { f.closureReason = reason; f.closedBy = who; f.closedAt = at; f.reviewDue = null; } else { f.closureReason = null; }
    f.history.push({ text: 'Status changed from ' + before + ' to ' + status + (reason ? ': ' + reason : ''), who: who, at: at, tone: status === 'Closed' ? 'danger' : 'info' });
    return f;
  };
  db.markFamilyReviewed = function (id, who, at) { var f = db.getFamily(id); f.reviewDue = K.addDays(K.today, 182); f.history.push({ text: 'Family reviewed; next review ' + K.dm(f.reviewDue) + ' ' + f.reviewDue.slice(0, 4), who: who, at: at, tone: 'ok' }); return f; };
  db.getFamilyHistory = function (id) { var f = db.getFamily(id); return (f.history || []).slice().sort(function (a, b) { return a.at < b.at ? 1 : -1; }); };

  /* Memberships lifecycle (states: Active, Paused, Cancellation Pending, Ending Scheduled, Ended) */
  db.pauseMembership = function (id, from, to, reason, who, at) { var m = db.getMembership(id); m.state = 'Paused'; m.pause = { from: from, to: to, reason: reason, by: who, at: at }; hist(m, 'Paused ' + K.dm(from) + ' to ' + K.dm(to) + ': ' + reason, who, at, 'warn'); return m; };
  db.resumeMembership = function (id, who, at) { var m = db.getMembership(id); m.state = 'Active'; if (m.pause) m.pause.resumedAt = at; hist(m, 'Resumed: billing restarts on the next anchor day', who, at, 'ok'); return m; };
  db.requestCancellation = function (id, reason, who, at) { var m = db.getMembership(id); m.state = 'Cancellation Pending'; m.cancel = { requested: at, by: who, reason: reason }; hist(m, 'Cancellation requested: ' + reason, who, at, 'warn'); return m; };
  db.approveCancellation = function (id, who, at) {
    var m = db.getMembership(id); var start = (m.cancel && m.cancel.requested ? m.cancel.requested : at).slice(0, 10), rule = db.getBillingRule(m.billingRule), days = rule ? rule.noticeDays : 30;
    m.cancel = Object.assign(m.cancel || { requested: at, by: who, reason: 'Recorded by management' }, { noticeStart: start, end: K.addDays(start, days), approvedBy: who, approvedAt: at });
    m.state = 'Ending Scheduled'; hist(m, 'Cancellation approved. Notice from ' + K.dm(start) + ', ends ' + K.dm(m.cancel.end), who, at, 'info'); return m;
  };
  db.endMembership = function (id, reason, who, at) { var m = db.getMembership(id); m.state = 'Ended'; m.ended = { on: at.slice(0, 10), reason: reason, by: who, at: at }; hist(m, 'Membership ended: ' + reason, who, at); return m; };
  db.getMembershipHistory = function (id) { return (db.getMembership(id).history || []).slice().sort(function (a, b) { return a.at < b.at ? 1 : -1; }); };
  db.getMembershipsEndingSoon = function (days) { var lim = K.addDays(K.today, days == null ? 30 : days); return D.memberships.filter(function (m) { return m.state === 'Ending Scheduled' && m.cancel && m.cancel.end <= lim; }); };

  /* Requests */
  db.getRequests = function (f) { return f ? D.requests.filter(f) : D.requests; };
  db.getRequest = function (id) { return pick(D.requests, id); };
  db.getOpenRequests = function (type) { return D.requests.filter(function (r) { return (r.status === 'Open' || r.status === 'In review') && (!type || r.type === type); }); };
  db.getSessionRequests = function () { return D.requests.filter(function (r) { return r.type === 'Session request'; }); };
  db.addRequest = function (r) { r.id = r.id || nextId('REQ-', D.requests); D.requests.unshift(r); return r; };
  db.setRequestStage = function (id, stage) { var r = db.getRequest(id); r.stage = stage; if (r.status === 'Open' && stage !== 'New') r.status = 'In review'; return r; };
  /* Resolve or decline. Approving applies the change: membership lifecycle,
     a new membership for a session request, or the new detail value. */
  db.resolveRequest = function (id, outcome, note, who, at) {
    var r = db.getRequest(id);
    r.status = outcome === 'Declined' ? 'Declined' : 'Resolved'; r.stage = 'Done';
    r.resolution = { outcome: outcome, note: note, by: who, at: at };
    if (outcome !== 'Approved') return r;
    if (r.type === 'Cancellation' && r.membership) { var m = db.getMembership(r.membership); if (m.state !== 'Cancellation Pending') db.requestCancellation(m.id, r.reason, db.getParent(r.by).name, r.at); db.approveCancellation(m.id, who, at); r.effective = m.cancel.end; }
    if (r.type === 'Pause' && r.membership) db.pauseMembership(r.membership, r.effective, r.pauseTo, r.reason, who, at);
    if (r.type === 'Session request') {
      var s = db.getSession(r.session), nm = { id: 'MEM-' + String(101 + D.memberships.length), player: r.player, session: r.session, state: 'Active', start: r.effective || K.today, price: s.price, billingRule: 'BR-0' + (['SES-01', 'SES-02', 'SES-03', 'SES-04'].indexOf(r.session) + 1), priceLabel: K.money(s.price) + ' a month', history: [] };
      hist(nm, 'Membership started from session request ' + r.id, who, at, 'ok'); db.addMembership(nm); r.createdMembership = nm.id;
      var p = db.getPlayer(r.player); if (p.status === 'Trial') p.status = 'Active';
    }
    if (r.type === 'Detail change' && r.change) {
      var patch = {}; patch[r.change.field] = r.change.field === 'medical' ? ({ 'Confirmed none': 'none', 'Has details': 'details', 'Not confirmed': 'not_confirmed' }[r.change.after] || r.change.after) : r.change.after;
      if (r.change.field === 'medical') patch.medicalConfirmed = { by: db.getParent(r.by).name, at: at };
      if (r.change.field === 'medicalDetail') { patch.medical = String(r.change.after || '').trim() ? 'details' : 'none'; patch.medicalConfirmed = { by: db.getParent(r.by).name, at: at }; }
      if (r.change.field === 'emergencyNote') { var ep = db.getPlayer(r.player), list = (ep.emergency || []).slice(); list[1] = { name: r.change.after, rel: 'Updated by parent', phone: '' }; delete patch.emergencyNote; patch.emergency = list; }
      db.updatePlayer(r.player, patch);
    }
    if (r.type === 'Second parent invite' && r.parent) db.verifyParentLink(r.parent, 'Invite accepted; confirmed by management', who, at);
    return r;
  };

  /* Commercial setup */
  db.getBillingRules = function () { return C.billingRules; };
  db.getBillingRule = function (id) { return pick(C.billingRules, id); };
  db.getDiscountGroups = function () { return C.discountGroups; };
  db.getDiscountRules = function () { return [].concat.apply([], C.discountGroups.map(function (g) { return g.rules.map(function (r) { return Object.assign({ group: g.name }, r); }); })); };
  db.getStackingDefault = function () { return C.stackingDefault; };
  db.setDiscountActive = function (id, on) { C.discountGroups.forEach(function (g) { g.rules.forEach(function (r) { if (r.id === id) r.active = on; }); }); };
  db.getRefundPolicies = function () { return C.refundPolicies; };
  db.getRefundPolicyByName = function (name) { return C.refundPolicies.filter(function (p) { return p.name === name; })[0]; };
  db.getPackageGroups = function () { return C.packageGroups; };
  db.getTermsVersions = function () { return C.terms; };
  db.getTermsVersion = function (id) { return pick(C.terms, id); };
  db.getTermsAcceptances = function (f) { return f ? C.acceptances.filter(f) : C.acceptances; };

  /* Bookings: cancel one line (a new event; paid history is not edited) */
  db.cancelBookingLine = function (bid, lid, reason, who, at) {
    var b = db.getBooking(bid), l = b.lines.filter(function (x) { return x.id === lid; })[0], pol = db.getRefundPolicyByName(l.refundPolicy);
    var hoursAhead = K.daysBetween(K.today, l.dates[0]) * 24, outside = !pol || hoursAhead >= pol.noticeHours;
    l.status = 'Cancelled'; l.due = 0; l.cancellation = (outside ? 'Outside the refund window: ' : 'Inside the refund window: ') + (pol ? (outside ? pol.outside : pol.inside) : 'no policy'); l.cancelReason = reason; l.cancelledBy = who; l.cancelledAt = at;
    if (b.lines.every(function (x) { return x.status === 'Cancelled'; })) { b.state = 'Cancelled'; b.cancelReason = reason; }
    b.history = b.history || []; b.history.push({ text: 'Line ' + lid + ' cancelled: ' + reason, detail: l.cancellation, who: who, at: at, tone: 'danger' });
    return l;
  };

  /* Adjustments */
  db.getAdjustments = function (fam) { return D.adjustments.filter(function (a) { return !fam || a.family === fam; }); };
  db.getAdjustment = function (id) { return pick(D.adjustments, id); };
  db.addAdjustment = function (a) {
    a.id = nextId('ADJ-', D.adjustments);
    if (a.kind === 'Credit') {
      var c = db.addFamilyCredit({ family: a.family, player: a.player || null, amount: a.amount, source: a.reason + ' (adjustment ' + a.id + ')', at: a.at, by: a.by });
      a.credit = c.id; a.status = 'Credit issued'; a.collection = 'Family credit';
    } else a.status = a.status || 'Pending collection';
    D.adjustments.unshift(a); return a;
  };
  db.waiveAdjustment = function (id, reason, who, at) { var a = db.getAdjustment(id); a.status = 'Waived'; a.waived = { reason: reason, by: who, at: at }; return a; };

  /* History: seeded area history plus everything written through K.log */
  db.getPeopleAudit = function () { return D.peopleAudit; };
  db.getAuditAll = function () {
    return (D.audit || []).concat(D.peopleAudit).slice().sort(function (a, b) { return a.at < b.at ? 1 : -1; });
  };
  db.getAuditEntry = function (id) { return db.getAuditAll().filter(function (e) { return e.id === id; })[0]; };
  db.getEntityAudit = function (ids) { ids = [].concat(ids); return db.getAuditAll().filter(function (e) { return ids.some(function (i) { return e.entity === i || String(e.entity).indexOf(i) >= 0; }); }); };
})();
