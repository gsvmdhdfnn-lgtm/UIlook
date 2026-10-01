/* Invented finance data. Money is held in pence and shown as £ with two
   decimals. Issued invoices, credit notes and payments are immutable
   history: corrections are new entries (credit notes, reversals,
   replacement invoices), never edits. Every figure on the Finance screens
   is computed from these entries so September always reconciles. */
(function () {
  var D = Hub.data, K = Hub.kit, db = Hub.db;
  function pick(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }
  function vatOf(net, rate) { return Math.round(net * rate / 100); }
  function netOfGross(g) { return g - Math.round(g / 6); }

  /* ---------- Settings and access ---------- */
  var F = D.fin = {};
  F.settings = {
    legalName: 'Northfield Coaching Ltd', address: '14 Market Street, Westbrook WB1 1AA', companyNumber: '12 345 678',
    vatRegistered: true, vatNumber: 'GB 123 4567 89', vatRate: 20, vatTreatment: 'Standard rated', paymentTerms: 30, coachPaymentDay: 7,
    numberAuthority: 'Hub', prefix: 'NC-', nextNumber: 1013, digits: 4, updatedBy: 'Josh Evans', updatedAt: '2026-08-28T16:20'
  };
  F.grants = [
    { person: 'Josh Evans', role: 'Director', access: 'Manage', grantedBy: 'System owner', at: '2025-04-01T09:00' },
    { person: 'David Cole', role: 'Head Coach', access: 'Manage', grantedBy: 'Josh Evans', at: '2025-09-01T10:15' },
    { person: 'Sam Okafor', role: 'Office', access: 'View', grantedBy: 'Josh Evans', at: '2026-01-12T14:02' },
    { person: 'Charlie Hughes', role: 'Lead Coach', access: 'None', grantedBy: '—', at: null }
  ];

  /* ---------- Clients, services, terms ---------- */
  F.clients = [
    { id: 'CLI-01', name: 'Northgate School', contact: 'Ms R. Akers (Business Manager)', email: 'finance@northgate-school.example', cc: 'office@northgate-school.example', terms: 30, termsOverride: null, poRequired: true, method: 'Email PDF', status: 'Active' },
    { id: 'CLI-02', name: 'Riverside Academy', contact: 'Mr J. Okafor (Bursar)', email: 'accounts@riverside-academy.example', cc: '', terms: 14, termsOverride: 'Client pays in 14 days by agreement', poRequired: false, method: 'Email PDF + Xero', status: 'Active' },
    { id: 'CLI-03', name: 'Kingsmead Primary', contact: 'Mrs L. Hart (Office)', email: 'office@kingsmead-primary.example', cc: '', terms: 30, termsOverride: null, poRequired: false, method: 'Email PDF', status: 'Paused' },
    { id: 'CLI-04', name: 'Harbour Lane School', contact: 'Mr P. Diaz (Finance)', email: 'finance@harbour-lane.example', cc: 'head@harbour-lane.example', terms: 30, termsOverride: null, poRequired: true, method: 'Email PDF', status: 'Active' }
  ];
  F.services = [
    { id: 'SVC-01', client: 'CLI-01', name: 'After-school club', session: 'SES-06', periods: [{ state: 'Active', from: '2025-09-01', to: null }] },
    { id: 'SVC-02', client: 'CLI-02', name: 'PPA and after-school (Years 5-6)', session: 'SES-05', periods: [{ state: 'Active', from: '2026-04-13', to: null }] },
    { id: 'SVC-03', client: 'CLI-03', name: 'After-school club', session: null, periods: [{ state: 'Active', from: '2025-01-06', to: '2026-07-17' }, { state: 'Paused', from: '2026-09-01', to: null, reason: 'School reviewing budgets until January' }] },
    { id: 'SVC-04', client: 'CLI-04', name: 'Summer holiday camp', session: null, periods: [{ state: 'Active', from: '2026-07-20', to: '2026-08-14' }, { state: 'Ended', from: '2026-08-15', to: null, reason: 'Camp delivered' }] }
  ];
  F.terms = [
    { id: 'TRM-01', service: 'SVC-01', from: '2024-09-01', to: '2025-08-31', payer: 'Client', charge: 'Per occurrence', amount: 4600, vat: 'Standard', rate: 20, qty: 1, frequency: null, by: 'Josh Evans', at: '2024-08-20T10:00' },
    { id: 'TRM-02', service: 'SVC-01', from: '2025-09-01', to: null, payer: 'Client', charge: 'Per occurrence', amount: 5000, vat: 'Standard', rate: 20, qty: 1, frequency: null, by: 'Josh Evans', at: '2025-08-18T15:12' },
    { id: 'TRM-03', service: 'SVC-02', from: '2026-09-07', to: null, payer: 'Client', charge: 'Per class', amount: 4500, vat: 'Standard', rate: 20, qty: 2, frequency: null, by: 'David Cole', at: '2026-09-08T09:40' },
    { id: 'TRM-04', service: 'SVC-03', from: '2025-01-06', to: null, payer: 'Client', charge: 'Per occurrence', amount: 5000, vat: 'Standard', rate: 20, qty: 1, frequency: null, by: 'Josh Evans', at: '2025-01-02T11:30' },
    { id: 'TRM-05', service: 'SVC-04', from: '2026-07-20', to: '2026-08-14', payer: 'Client', charge: 'Per place per day', amount: 2000, vat: 'Standard', rate: 20, qty: 18, frequency: null, by: 'Josh Evans', at: '2026-06-02T10:05' }
  ];
  F.overrides = [
    { id: 'OVR-01', occurrence: D.findOcc('SES-06', '2026-09-18').id, type: 'Not billable', value: null, reason: 'Fire alarm ended the session after 15 minutes; agreed no charge', by: 'David Cole', at: '2026-09-18T17:02', removed: null },
    { id: 'OVR-02', occurrence: D.findOcc('SES-05', '2026-09-24').id, type: 'Quantity', value: 1, reason: 'One class only: Year 6 on a museum trip', by: 'David Cole', at: '2026-09-24T17:15', removed: null }
  ];

  /* ---------- Invoice lines from delivered occurrences ---------- */
  function termFor(serviceId, date) { return F.terms.filter(function (t) { return t.service === serviceId && t.from <= date && (!t.to || t.to >= date); })[0]; }
  function overrideFor(occId) { return F.overrides.filter(function (o) { return o.occurrence === occId && !o.removed; })[0]; }
  F.eligibleLines = function (clientId, month) {
    var svcs = F.services.filter(function (s) { return s.client === clientId && s.session; });
    var out = [];
    svcs.forEach(function (svc) {
      D.occurrences.filter(function (o) { return o.sessionId === svc.session && o.date.slice(0, 7) === month && o.status === 'Completed'; }).forEach(function (o) {
        var t = termFor(svc.id, o.date), ov = overrideFor(o.id);
        var line = { id: 'L-' + o.id, occurrence: o.id, date: o.date, description: svc.name + ' · ' + K.dd(o.date) + ', ' + o.start + '–' + o.end, qty: t ? t.qty : 1, unitNet: t ? t.amount : null, rate: t ? t.rate : 20, term: t ? t.id : null, include: true, reason: '' };
        if (!t) { line.include = false; line.exception = 'Missing terms'; line.reason = 'No commercial terms cover ' + K.dm(o.date); }
        if (ov && ov.type === 'Not billable') { line.include = false; line.exception = 'Not billable'; line.reason = ov.reason; }
        if (ov && ov.type === 'Amount') { line.unitNet = ov.value; line.override = ov.reason; }
        if (ov && ov.type === 'Quantity') { line.qty = ov.value; line.override = ov.reason; }
        out.push(line);
      });
    });
    return out;
  };
  function price(line) { var net = (line.unitNet || 0) * line.qty; var vat = vatOf(net, line.rate); line.net = net; line.vat = vat; line.gross = net + vat; return line; }
  function totals(lines) { var inc = lines.filter(function (l) { return l.include; }).map(price); return { net: K.sum(inc, 'net'), vat: K.sum(inc, 'vat'), gross: K.sum(inc, 'gross'), count: inc.length }; }
  F.totals = totals; F.price = price;

  /* ---------- Issued invoices (immutable) ---------- */
  function simple(desc, n, unit, rate) { var l = price({ id: '', description: desc, qty: n, unitNet: unit, rate: rate == null ? 20 : rate, include: true }); return l; }
  function inv(o) {
    o.lines = o.lines.map(function (l, i) { l.id = o.id + '-L' + (i + 1); return l; });
    var t = totals(o.lines); o.net = t.net; o.vat = t.vat; o.gross = t.gross;
    o.issuer = { name: F.settings.legalName, address: F.settings.address, vatNumber: F.settings.vatNumber, companyNumber: F.settings.companyNumber };
    o.omissions = o.omissions || [];
    o.xero = o.xero || { status: 'Synced', ref: 'XRO-' + o.number.slice(3), at: o.issued + 'T16:05' };
    o.history = [{ text: 'Issued as ' + o.number, who: o.issuedBy, at: o.issued + 'T15:30', tone: 'info' }];
    return o;
  }
  F.invoices = [
    inv({ id: 'INV-0001', number: 'NC-1001', client: 'CLI-01', period: '2026-04', issued: '2026-05-01', due: '2026-05-31', issuedBy: 'Josh Evans', po: 'PO-NG-2207', terms: 30, termsSource: 'Organisation default', lines: [simple('After-school club · April (6 sessions)', 6, 5000)] }),
    inv({ id: 'INV-0002', number: 'NC-1002', client: 'CLI-03', period: '2026-04', issued: '2026-05-01', due: '2026-05-31', issuedBy: 'Josh Evans', po: '', terms: 30, termsSource: 'Organisation default', lines: [simple('After-school club · April (4 sessions)', 4, 5000)] }),
    inv({ id: 'INV-0003', number: 'NC-1003', client: 'CLI-01', period: '2026-05', issued: '2026-06-01', due: '2026-07-01', issuedBy: 'Josh Evans', po: 'PO-NG-2231', terms: 30, termsSource: 'Organisation default', lines: [simple('After-school club · May (8 sessions)', 8, 5000)] }),
    inv({ id: 'INV-0004', number: 'NC-1004', client: 'CLI-03', period: '2026-05', issued: '2026-06-01', due: '2026-07-01', issuedBy: 'Josh Evans', po: '', terms: 30, termsSource: 'Organisation default', lines: [simple('After-school club · May (8 sessions)', 8, 5000)] }),
    inv({ id: 'INV-0005', number: 'NC-1005', client: 'CLI-02', period: '2026-05', issued: '2026-06-01', due: '2026-06-15', issuedBy: 'David Cole', po: '', terms: 14, termsSource: 'Client override', lines: [simple('PPA cover · May (4 sessions)', 4, 4200)] }),
    inv({ id: 'INV-0006', number: 'NC-1006', client: 'CLI-01', period: '2026-06', issued: '2026-07-01', due: '2026-07-31', issuedBy: 'Josh Evans', po: 'PO-NG-2260', terms: 30, termsSource: 'Organisation default', lines: [simple('After-school club · June (8 sessions)', 8, 5000)] }),
    inv({ id: 'INV-0007', number: 'NC-1007', client: 'CLI-03', period: '2026-06', issued: '2026-07-01', due: '2026-07-31', issuedBy: 'Josh Evans', po: '', terms: 30, termsSource: 'Organisation default', lines: [simple('After-school club · Mon 1 Jun', 1, 5000), simple('After-school club · Wed 3 Jun', 1, 5000), simple('After-school club · June (6 further sessions)', 6, 5000)] }),
    inv({ id: 'INV-0008', number: 'NC-1008', client: 'CLI-04', period: '2026-07', issued: '2026-07-06', due: '2026-08-05', issuedBy: 'Josh Evans', po: 'HL-7781', terms: 30, termsSource: 'Organisation default', lines: [simple('Summer camp deposit · 18 places', 18, 2000)] }),
    inv({ id: 'INV-0009', number: 'NC-1009', client: 'CLI-01', period: '2026-07', issued: '2026-08-01', due: '2026-08-31', issuedBy: 'Josh Evans', po: 'PO-NG-2290', terms: 30, termsSource: 'Organisation default', lines: [simple('After-school club · July (6 sessions)', 6, 5000)] }),
    inv({ id: 'INV-0010', number: 'NC-1010', client: 'CLI-03', period: '2026-07', issued: '2026-08-01', due: '2026-08-31', issuedBy: 'Josh Evans', po: '', terms: 30, termsSource: 'Organisation default', lines: [simple('After-school club · July (5 sessions)', 5, 5000)] }),
    inv({ id: 'INV-0011', number: 'NC-1011', client: 'CLI-04', period: '2026-08', issued: '2026-08-17', due: '2026-09-16', issuedBy: 'Josh Evans', po: 'HL-7781', terms: 30, termsSource: 'Organisation default', lines: [simple('Summer camp balance · 3 days × 18 places', 54, 2000)],
      dueChanges: [{ from: '2026-09-16', to: '2026-09-26', reason: 'Client asked for 10 more days while their finance lead was away', by: 'Josh Evans', at: '2026-09-15T10:12' }] }),
    inv({ id: 'INV-0012', number: 'NC-1012', client: 'CLI-02', period: '2026-09', issued: '2026-09-30', due: '2026-10-14', issuedBy: 'David Cole', po: '', poOverride: 'Riverside does not use purchase orders', terms: 14, termsSource: 'Client override', lines: F.eligibleLines('CLI-02', '2026-09').filter(function (l) { return l.include; }).map(function (l) { return price(Object.assign({}, l)); }),
      omissions: F.eligibleLines('CLI-02', '2026-09').filter(function (l) { return !l.include; }).map(function (l) { return { description: l.description, reason: l.reason, approvedBy: 'David Cole' }; }), xero: { status: 'Failed', ref: null, at: '2026-09-30T16:05', error: 'Xero rate limit reached; retry queued' } })
  ];
  /* The overdue invoice keeps its original due date; the current one moved. */
  var hl = pick(F.invoices, 'INV-0011'); hl.originalDue = '2026-09-16'; hl.due = '2026-09-26';
  hl.history.push({ text: 'Due date moved from 16 Sep to 26 Sep', detail: 'Client asked for 10 more days while their finance lead was away', who: 'Josh Evans', at: '2026-09-15T10:12', tone: 'warn' });

  F.creditNotes = [
    { id: 'CN-001', number: 'NC-CN-001', invoice: 'INV-0007', lines: ['INV-0007-L2'], reason: 'Session not delivered: school trip clash on Wed 3 Jun', by: 'Josh Evans', at: '2026-07-09T11:20' }
  ];
  F.creditNotes.forEach(function (c) { var i = pick(F.invoices, c.invoice); var ls = i.lines.filter(function (l) { return c.lines.indexOf(l.id) >= 0; }); c.net = K.sum(ls, 'net'); c.vat = K.sum(ls, 'vat'); c.gross = K.sum(ls, 'gross'); i.history.push({ text: 'Credit note ' + c.number + ' raised (' + K.money(c.gross) + ')', detail: c.reason, who: c.by, at: c.at, tone: 'info' }); });

  F.payments = [];
  function pay(invId, amount, date, method, ref, by, extra) { var p = Object.assign({ id: 'PAY-' + String(F.payments.length + 101), invoice: invId, amount: amount, date: date, method: method, ref: ref, by: by, at: date + 'T12:00' }, extra || {}); F.payments.push(p); return p; }
  ['INV-0001', 'INV-0002', 'INV-0003', 'INV-0004', 'INV-0005', 'INV-0006', 'INV-0008'].forEach(function (id, i) { var v = pick(F.invoices, id); pay(id, v.gross, K.addDays(v.issued, 12 + i), 'Bank transfer', 'BACS ' + v.number, 'Sam Okafor'); });
  pay('INV-0007', pick(F.invoices, 'INV-0007').gross, '2026-07-28', 'Bank transfer', 'BACS NC-1007', 'Sam Okafor'); /* paid in full before the credit note: creates a client credit */
  pay('INV-0009', 20000, '2026-08-20', 'Bank transfer', 'BACS part 1', 'Sam Okafor');
  pay('INV-0009', 22000, '2026-08-29', 'Bank transfer', 'BACS part 2 (overpaid £60.00)', 'Sam Okafor');
  pay('INV-0010', 30000, '2026-08-26', 'Bank transfer', 'BACS NC-1010', 'Sam Okafor');
  pay('INV-0010', 30000, '2026-08-26', 'Bank transfer', 'BACS NC-1010 (entered twice)', 'Sam Okafor');
  pay('INV-0010', -30000, '2026-08-27', 'Reversal', 'Reverses PAY-112: entered twice in error', 'Josh Evans', { reverses: 'PAY-112' });

  /* Client credits: from a paid credit note and from an overpayment. */
  F.clientCredits = [
    { id: 'CC-01', client: 'CLI-03', source: 'Credit note NC-CN-001 on a paid invoice', amount: pick(F.creditNotes, 'CN-001').gross, applied: [], voided: null, at: '2026-07-09T11:20', by: 'Josh Evans' },
    { id: 'CC-02', client: 'CLI-01', source: 'Overpayment on NC-1009', amount: 6000, applied: [], voided: null, at: '2026-08-29T12:00', by: 'Sam Okafor' }
  ];

  /* ---------- Draft invoices ---------- */
  F.drafts = [
    { id: 'DRF-01', client: 'CLI-01', period: '2026-09', state: 'Draft', revision: 1, po: '', poOverride: '', terms: 30, termsSource: 'Organisation default', lines: F.eligibleLines('CLI-01', '2026-09'), createdBy: 'David Cole', at: '2026-09-30T16:40', history: [{ text: 'Draft created for September', who: 'David Cole', at: '2026-09-30T16:40' }] }
  ];

  /* ---------- Coach rates and allocations (one coach, one occurrence) ---------- */
  F.rateProfiles = [];
  D.coachList.forEach(function (c) {
    var salaried = c.id === 'david' || c.id === 'josh', learning = c.type === 'learning';
    F.rateProfiles.push({ id: 'RP-' + c.code.slice(4) + 'A', coach: c.id, from: '2025-09-01', to: c.id === 'charlie' ? '2026-08-31' : null, evening: salaried || learning ? 0 : c.id === 'charlie' ? 2900 : 3125, day: salaried || learning ? 0 : 2500, by: 'Josh Evans', at: '2025-08-25T10:00',
      note: salaried ? 'Salaried: no per-session cost' : learning ? 'Learning placement: expenses only' : '' });
  });
  F.rateProfiles.push({ id: 'RP-003B', coach: 'charlie', from: '2026-09-01', to: null, evening: 3125, day: 2500, by: 'Josh Evans', at: '2026-08-28T16:00', note: 'Lead coach uplift from September' });
  F.rateFor = function (coach, date) { return F.rateProfiles.filter(function (r) { return r.coach === coach && r.from <= date && (!r.to || r.to >= date); })[0]; };
  function hours(o) { var a = o.start.split(':'), b = o.end.split(':'); return ((+b[0] * 60 + +b[1]) - (+a[0] * 60 + +a[1])) / 60; }
  F.allocations = [];
  D.occurrences.forEach(function (o) {
    if (o.status === 'Cancelled' || o.status === 'Rescheduled' || o.draft) return;
    o.staff.forEach(function (s) {
      if (s.unavailable) return;
      var r = F.rateFor(s.coach, o.date), units = hours(o), rate = r ? (o.start < '15:00' ? r.day : r.evening) : 3125;
      var a = { id: 'ALC-' + String(F.allocations.length + 1001), coach: s.coach, occurrence: o.id, date: o.date, role: s.role, rate: rate, rateProfile: r && r.id, units: units, override: null, cost: Math.round(rate * units), state: o.date < '2026-10-01' ? 'Confirmed' : 'Draft' };
      F.allocations.push(a);
    });
  });
  var ovr = F.allocations.filter(function (a) { return a.coach === 'tom' && a.date === '2026-09-10'; })[0];
  if (ovr) { ovr.override = { cost: 6000, reason: 'Covered three classes after a staff absence at the school; agreed by Josh', by: 'Josh Evans', at: '2026-09-11T09:30' }; ovr.cost = 6000; }

  /* ---------- Parent money ---------- */
  F.familyCharges = [];
  function charge(o) { o.id = 'CHG-' + String(F.familyCharges.length + 2001); F.familyCharges.push(o); return o; }
  D.memberships.forEach(function (m) {
    if (m.state === 'Ended') return;
    var p = db.getPlayer(m.player), s = D.session(m.session);
    var failed = m.player === 'PLY-0020' && m.session === 'SES-03';
    charge({ family: p.family, player: m.player, membership: m.id, type: 'Subscription', description: s.name + ' · September', month: '2026-09', date: '2026-09-01', gross: m.price, creditApplied: 0, paid: m.price, state: 'Paid', via: 'Card (Stripe)', stripe: 'pi_test_' + m.id.toLowerCase().replace('-', ''), note: failed ? 'First attempt failed (card expired); paid on retry 4 Sep' : '' });
    if (m.state === 'Paused' && m.pause) { charge({ family: p.family, player: m.player, membership: m.id, type: 'Subscription', description: s.name + ' · October (paused until 19 Oct)', month: '2026-10', date: '2026-10-01', gross: 0, creditApplied: 0, paid: 0, state: 'Not charged', via: '—', note: 'Paused: billing resumes 20 Oct' }); return; }
    charge({ family: p.family, player: m.player, membership: m.id, type: 'Subscription', description: s.name + ' · October', month: '2026-10', date: '2026-10-01', gross: m.price, creditApplied: 0, paid: 0, state: 'Scheduled', via: 'Card (Stripe)' });
  });
  F.bookings = [
    { id: 'BKG-001', family: 'FAM-02', bookedBy: 'PAR-03', payer: 'PAR-04', at: '2026-09-20T19:44', state: 'Paid', terms: 'TRM-P-03', product: 'Autumn half-term camp (26–28 Oct)', lines: [
      { id: 'BKL-001', player: 'PLY-0003', type: 'Camp days', dates: ['2026-10-26', '2026-10-27', '2026-10-28'], tier: '3-day package', status: 'Booked', base: 8000, discount: 0, discountRule: null, refundPolicy: 'Camp: full refund up to 7 days before', creditApplied: 0 },
      { id: 'BKL-002', player: 'PLY-0004', type: 'Camp days', dates: ['2026-10-26', '2026-10-27', '2026-10-28'], tier: '3-day package', status: 'Booked', base: 8000, discount: 800, discountRule: 'Sibling discount 10%', refundPolicy: 'Camp: full refund up to 7 days before', creditApplied: 0 }] },
    { id: 'BKG-002', family: 'FAM-03', bookedBy: 'PAR-05', payer: 'PAR-05', at: '2026-09-23T08:15', state: 'Paid', terms: 'TRM-P-03', product: 'Autumn half-term camp (26–28 Oct)', lines: [
      { id: 'BKL-003', player: 'PLY-0005', type: 'Camp day', dates: ['2026-10-27'], tier: 'Single day', status: 'Booked', base: 3000, discount: 0, discountRule: null, refundPolicy: 'Camp: full refund up to 7 days before', creditApplied: 0 }] },
    { id: 'BKG-003', family: 'FAM-06', bookedBy: 'PAR-08', payer: 'PAR-08', at: '2026-09-18T20:11', state: 'Confirmed', terms: 'TRM-P-03', product: 'U8 Development: free trial', lines: [
      { id: 'BKL-004', player: 'PLY-0010', type: 'Trial', dates: ['2026-09-24', '2026-10-01'], tier: 'Trial (2 sessions)', status: 'Booked', base: 0, discount: 0, discountRule: null, refundPolicy: 'Not applicable', creditApplied: 0 }] },
    { id: 'BKG-004', family: 'FAM-13', bookedBy: 'PAR-15', payer: 'PAR-15', at: '2026-09-21T10:02', state: 'Cancelled', terms: 'TRM-P-03', product: 'Autumn half-term camp (26–28 Oct)', cancelReason: 'Family holiday booked', lines: [
      { id: 'BKL-005', player: 'PLY-0020', type: 'Camp day', dates: ['2026-10-26'], tier: 'Single day', status: 'Cancelled', base: 3000, discount: 0, discountRule: null, refundPolicy: 'Camp: full refund up to 7 days before', creditApplied: 0, cancellation: 'Outside the refund window: full refund' }] }
  ];
  F.bookings.forEach(function (b) { b.lines.forEach(function (l) { l.final = l.base - l.discount - l.creditApplied; l.due = l.status === 'Cancelled' ? 0 : l.final; }); b.total = K.sum(b.lines, 'final'); });
  pick(F.bookings, 'BKG-004').refunded = 3000;

  /* Family credits (applied oldest first, partial use allowed) */
  F.familyCredits = [];
  var cx = D.findOcc('SES-02', '2026-09-17'); var hunt = 'FAM-12';
  D.expectedPlayers(cx).forEach(function (pid) {
    var p = db.getPlayer(pid);
    if (p.family === hunt) return;
    F.familyCredits.push({ id: 'FCR-' + String(F.familyCredits.length + 301), family: p.family, player: pid, amount: 2175, remaining: 2175, source: 'Cancelled U9/10 Development, Thu 17 Sep', occurrence: cx.id, at: '2026-09-17T15:45', by: 'Josh Evans', applications: [] });
  });
  F.familyCredits.push({ id: 'FCR-' + String(F.familyCredits.length + 301), family: 'FAM-01', player: null, amount: 1000, remaining: 1000, source: 'Goodwill credit (adjustment ADJ-02)', at: '2026-09-26T10:30', by: 'Josh Evans', applications: [] });
  F.refunds = [
    { id: 'RFD-01', family: hunt, amount: 2175, reason: 'Cancelled U9/10 Development, Thu 17 Sep: family asked for a refund instead of credit', decidedBy: 'Josh Evans', at: '2026-09-18T09:10', method: 'Card refund (Stripe)', occurrence: cx.id, state: 'Paid' },
    { id: 'RFD-02', family: 'FAM-13', amount: 3000, reason: 'Camp day cancelled 35 days ahead (refund policy: full refund up to 7 days)', decidedBy: 'Sam Okafor', at: '2026-09-21T10:30', method: 'Card refund (Stripe)', booking: 'BKG-004', state: 'Paid' }
  ];
  /* Apply credits to the October subscriptions charged today, oldest first. */
  F.applyFamilyCredits = function (fam, chargeId) {
    var ch = pick(F.familyCharges, chargeId), owed = ch.gross - ch.creditApplied;
    F.familyCredits.filter(function (c) { return c.family === fam && c.remaining > 0; }).sort(function (a, b) { return a.at < b.at ? -1 : 1; }).forEach(function (c) {
      if (owed <= 0) return; var use = Math.min(c.remaining, owed); c.remaining -= use; owed -= use; ch.creditApplied += use;
      c.applications.push({ charge: ch.id, amount: use, at: '2026-10-01T06:00', by: 'System (oldest first)' });
    });
    return ch;
  };
  F.familyCharges.filter(function (c) { return c.month === '2026-10' && c.gross > 0; }).forEach(function (c) {
    F.applyFamilyCredits(c.family, c.id);
    c.state = 'Paid'; c.paid = c.gross - c.creditApplied; c.note = c.creditApplied ? 'Family credit applied ' + K.money(c.creditApplied) : '';
  });

  /* ---------- Money out ---------- */
  F.otherCosts = [
    { id: 'CST-01', date: '2026-09-08', supplier: 'Westbrook Sports Supplies', category: 'Equipment', description: 'Bibs, cones and 6 size-4 balls', net: 8400, vat: 1680, reclaim: true, programme: 'All', paid: true, by: 'Sam Okafor' },
    { id: 'CST-02', date: '2026-08-20', supplier: 'First Aid Direct', category: 'Training', description: 'Emergency first aid refresher (2 coaches)', net: 9000, vat: 0, reclaim: false, programme: 'All', paid: true, by: 'Sam Okafor' }
  ];
  F.overheads = [
    { id: 'OVH-01', name: 'Salaries (office, part-time)', frequency: 'Monthly', net: 42000, vat: 0, reclaim: false, day: 28, supplier: 'Payroll' },
    { id: 'OVH-02', name: 'Van finance', frequency: 'Monthly', net: 18900, vat: 3780, reclaim: true, day: 5, supplier: 'Westbrook Vehicle Finance' },
    { id: 'OVH-03', name: 'Van insurance', frequency: 'Monthly', net: 5800, vat: 0, reclaim: false, day: 12, supplier: 'Ashby Insurance Brokers' }
  ];
  F.venueCost = function (o) {
    if (o.status === 'Cancelled' || o.status === 'Rescheduled' || o.draft) return 0;
    var s = D.session(o.sessionId); if (s.client) return 0;
    var v = D.venues[o.venue]; return Math.round((v ? v.costPerHour : 0) * hours(o));
  };

  /* ---------- Integrations ---------- */
  F.integrations = {
    stripe: { status: 'Connected', account: 'acct_test_northfield', mode: 'Test mode', connectedBy: 'Josh Evans', at: '2025-08-30T11:02', customers: D.families.length, failures: [{ at: '2026-09-01T06:02', text: 'Card expired for the Fielding family; retried and paid on 4 Sep' }] },
    xero: { status: 'Connected', org: 'Northfield Coaching Ltd (demo)', connectedBy: 'Josh Evans', at: '2025-09-01T09:30', contacts: [{ client: 'CLI-02', contact: 'XC-221', state: 'Linked' }, { client: 'CLI-03', contact: 'XC-198', state: 'Linked' }, { client: 'CLI-04', contact: 'XC-240', state: 'Linked' }, { client: 'CLI-01', contact: null, state: 'Not linked' }], failures: [{ at: '2026-09-30T16:05', text: 'NC-1012 not sent: Xero contact not linked for Northgate School' }] }
  };
  F.cashOpening = { date: '2026-09-01', amount: 452000, note: 'Bank balance at 1 Sep (from statement)' };
  F.safetyThreshold = 400000;

  /* ---------- Calculations (the only place figures are derived) ---------- */
  F.paidOn = function (invId) { return K.sum(F.payments.filter(function (p) { return p.invoice === invId; }), 'amount'); };
  F.creditedOn = function (invId) { return K.sum(F.creditNotes.filter(function (c) { return c.invoice === invId; }), 'gross'); };
  F.appliedCreditOn = function (invId) { var n = 0; F.clientCredits.forEach(function (c) { c.applied.forEach(function (a) { if (a.invoice === invId && !a.removed) n += a.amount; }); }); return n; };
  F.balance = function (i) { return i.gross - F.creditedOn(i.id) - F.paidOn(i.id) - F.appliedCreditOn(i.id); };
  F.invoiceState = function (i) { var c = F.creditedOn(i.id); return c >= i.gross ? 'Credited' : c > 0 ? 'Partially credited' : 'Issued'; };
  F.paymentState = function (i) { var b = F.balance(i); if (b < 0) return 'Overpaid'; if (b === 0) return 'Paid'; if (i.due < K.today) return 'Overdue'; return F.paidOn(i.id) > 0 ? 'Part paid' : 'Unpaid'; };
  F.creditRemaining = function (c) { if (c.voided) return 0; return c.amount - K.sum(c.applied.filter(function (a) { return !a.removed; }), 'amount'); };

  F.monthSummary = function (month, includeExpected) {
    var progs = {};
    function P(name) { return progs[name] || (progs[name] = { programme: name, gross: 0, vat: 0, net: 0, credits: 0, coach: 0, venue: 0, other: 0 }); }
    F.invoices.filter(function (i) { return i.period === month; }).forEach(function (i) {
      var credited = K.sum(F.creditNotes.filter(function (c) { return c.invoice === i.id; }), 'net');
      var p = P('Schools'); p.gross += i.gross; p.vat += i.vat; p.net += i.net - credited; p.credits += credited;
    });
    if (includeExpected) F.drafts.filter(function (d) { return d.period === month && d.state !== 'Issued'; }).forEach(function (d) { var t = totals(d.lines); var p = P('Schools'); p.gross += t.gross; p.vat += t.vat; p.net += t.net; });
    F.familyCharges.filter(function (c) { return c.month === month && c.gross > 0; }).forEach(function (c) {
      var s = D.session(D.memberships.filter(function (m) { return m.id === c.membership; })[0].session), p = P(s.programme);
      var vat = Math.round(c.gross / 6); p.gross += c.gross; p.vat += vat; p.net += c.gross - vat;
    });
    F.familyCredits.filter(function (c) { return c.occurrence && c.at.slice(0, 7) === month; }).concat(F.refunds.filter(function (r) { return r.occurrence && r.at.slice(0, 7) === month; })).forEach(function (c) {
      var o = D.occ(c.occurrence), p = P(D.session(o.sessionId).programme), net = netOfGross(c.amount);
      p.net -= net; p.vat -= c.amount - net; p.credits += net;
    });
    F.allocations.filter(function (a) { return a.date.slice(0, 7) === month; }).forEach(function (a) { var o = D.occ(a.occurrence); P(D.session(o.sessionId).programme).coach += a.cost; });
    D.occurrences.filter(function (o) { return o.date.slice(0, 7) === month; }).forEach(function (o) { var c = F.venueCost(o); if (c) P(D.session(o.sessionId).programme).venue += c; });
    var other = F.otherCosts.filter(function (c) { return c.date.slice(0, 7) === month; });
    var rows = Object.keys(progs).map(function (k) { return progs[k]; });
    var totalNet = K.sum(rows, 'net');
    rows.forEach(function (r) { r.other = totalNet ? Math.round(K.sum(other, 'net') * r.net / totalNet) : 0; });
    var drift = K.sum(other, 'net') - K.sum(rows, 'other'); if (rows[0]) rows[0].other += drift;
    rows.forEach(function (r) { r.contribution = r.net - r.coach - r.venue - r.other; r.margin = r.net ? Math.round(r.contribution / r.net * 1000) / 10 : 0; });
    rows.sort(function (a, b) { return b.net - a.net; });
    var overheads = K.sum(F.overheads, 'net');
    var t = { gross: K.sum(rows, 'gross'), vat: K.sum(rows, 'vat'), net: K.sum(rows, 'net'), credits: K.sum(rows, 'credits'), coach: K.sum(rows, 'coach'), venue: K.sum(rows, 'venue'), other: K.sum(rows, 'other'), contribution: K.sum(rows, 'contribution') };
    t.direct = t.coach + t.venue + t.other; t.overheads = overheads; t.profit = t.contribution - overheads; t.margin = t.net ? Math.round(t.contribution / t.net * 1000) / 10 : 0;
    return { month: month, includeExpected: !!includeExpected, rows: rows, totals: t };
  };
  F.vatEstimate = function () {
    var out = 0, inp = 0;
    ['2026-07', '2026-08', '2026-09'].forEach(function (m) {
      F.invoices.filter(function (i) { return i.period === m; }).forEach(function (i) { out += i.vat - K.sum(F.creditNotes.filter(function (c) { return c.invoice === i.id; }), 'vat'); });
      F.familyCharges.filter(function (c) { return c.month === m; }).forEach(function (c) { out += Math.round(c.gross / 6); });
      F.otherCosts.filter(function (c) { return c.date.slice(0, 7) === m && c.reclaim; }).forEach(function (c) { inp += c.vat; });
      F.overheads.filter(function (o) { return o.reclaim; }).forEach(function (o) { inp += o.vat; });
    });
    return { quarter: 'Jul–Sep 2026', output: out, input: inp, due: out - inp, dueDate: '2026-11-07' };
  };
  F.cashEvents = function () {
    var ev = [];
    function e(o) { ev.push(o); }
    F.payments.filter(function (p) { return p.date >= '2026-09-01'; }).forEach(function (p) { var i = pick(F.invoices, p.invoice); e({ date: p.date, kind: 'In', label: 'Payment ' + i.number + ' · ' + pick(F.clients, i.client).name, expected: p.amount, actual: p.amount, state: 'Received', certainty: 'Confirmed', authority: 'Payment ' + p.id }); });
    ['2026-09', '2026-10'].forEach(function (m) {
      var cs = F.familyCharges.filter(function (c) { return c.month === m && c.paid > 0; }), amt = K.sum(cs, 'paid'), past = m === '2026-09';
      if (cs.length) e({ date: m + '-03', kind: 'In', label: 'Stripe payout · ' + (past ? 'September' : 'October') + ' subscriptions (' + cs.length + ' charges)', expected: amt, actual: past ? amt : null, state: past ? 'Received' : 'Expected', certainty: past ? 'Confirmed' : 'Expected', authority: cs.length + ' subscription charges' });
    });
    F.bookings.forEach(function (b) { if (b.state === 'Paid' || b.state === 'Cancelled') e({ date: b.at.slice(0, 10), kind: 'In', label: 'Stripe · ' + b.product, expected: b.state === 'Cancelled' ? 3000 : b.total, actual: b.state === 'Cancelled' ? 3000 : b.total, state: 'Received', certainty: 'Confirmed', authority: 'Booking ' + b.id }); });
    F.refunds.forEach(function (r) { e({ date: r.at.slice(0, 10), kind: 'Out', label: 'Refund · ' + db.getFamily(r.family).name, expected: r.amount, actual: r.amount, state: 'Paid', certainty: 'Confirmed', authority: 'Refund ' + r.id }); });
    F.invoices.forEach(function (i) { var b = F.balance(i); if (b > 0) e({ date: i.due < K.today ? '2026-10-09' : i.due, kind: 'In', label: 'Due · ' + i.number + ' · ' + pick(F.clients, i.client).name, expected: b, actual: null, state: i.due < K.today ? 'Overdue' : 'Expected', certainty: i.due < K.today ? 'At risk' : 'Expected', authority: 'Invoice ' + i.number, remaining: b }); });
    var septCoach = K.sum(F.allocations.filter(function (a) { return a.date.slice(0, 7) === '2026-08'; }), 'cost');
    e({ date: '2026-09-07', kind: 'Out', label: 'Coach payments · August work', expected: 41250, actual: 41250, state: 'Paid', certainty: 'Confirmed', authority: 'Payment run PR-08' });
    e({ date: '2026-10-07', kind: 'Out', label: 'Coach payments · September work', expected: K.sum(F.allocations.filter(function (a) { return a.date.slice(0, 7) === '2026-09'; }), 'cost'), actual: null, state: 'Expected', certainty: 'Confirmed', authority: 'Work summaries (September)' });
    F.overheads.forEach(function (o) { ['2026-09', '2026-10'].forEach(function (m) { var d = m + '-' + String(o.day).padStart(2, '0'); e({ date: d, kind: 'Out', label: o.name, expected: o.net + o.vat, actual: d < K.today ? o.net + o.vat : null, state: d < K.today ? 'Paid' : 'Expected', certainty: 'Confirmed', authority: 'Overhead ' + o.id }); }); });
    F.otherCosts.forEach(function (c) { e({ date: c.date, kind: 'Out', label: c.supplier, expected: c.net + c.vat, actual: c.net + c.vat, state: 'Paid', certainty: 'Confirmed', authority: 'Cost ' + c.id }); });
    D.occurrences.filter(function (o) { return o.date.slice(0, 7) === '2026-09'; }).reduce(function (n, o) { return n + F.venueCost(o); }, 0);
    e({ date: '2026-10-05', kind: 'Out', label: 'Venue hire · September (Northgate, Hollins Park)', expected: K.sum(D.occurrences.filter(function (o) { return o.date.slice(0, 7) === '2026-09'; }), function (o) { return F.venueCost(o); }), actual: null, state: 'Expected', certainty: 'Confirmed', authority: 'Venue invoices' });
    var v = F.vatEstimate(); e({ date: v.dueDate, kind: 'Out', label: 'VAT · ' + v.quarter + ' (estimate)', expected: v.due, actual: null, state: 'Expected', certainty: 'Estimate', authority: 'VAT estimate' });
    ev.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    void septCoach;
    return ev;
  };
  F.cashPosition = function () {
    var ev = F.cashEvents(), bal = F.cashOpening.amount, now = null, low = null, lowDate = null;
    ev.forEach(function (x) {
      var amt = x.actual != null ? x.actual : x.expected; var signed = x.kind === 'In' ? amt : -amt;
      if (x.date < K.today || (x.date === K.today && x.actual != null)) { bal += signed; x.running = bal; return; }
      if (now === null) { now = bal; low = bal; lowDate = K.today; }
      if (x.date <= K.addDays(K.today, 30)) { bal += signed; x.running = bal; if (bal < low) { low = bal; lowDate = x.date; } }
      else { bal += signed; x.running = bal; }
    });
    if (now === null) { now = bal; low = bal; lowDate = K.today; }
    return { events: ev, current: now, low: low, lowDate: lowDate, threshold: F.safetyThreshold, opening: F.cashOpening };
  };
  F.receivables = function () {
    var b = { current: 0, d1_30: 0, d31_60: 0, d60: 0 };
    F.invoices.forEach(function (i) { var bal = F.balance(i); if (bal <= 0) return; var late = K.daysBetween(i.due, K.today); if (late <= 0) b.current += bal; else if (late <= 30) b.d1_30 += bal; else if (late <= 60) b.d31_60 += bal; else b.d60 += bal; });
    b.total = b.current + b.d1_30 + b.d31_60 + b.d60; return b;
  };
  F.ledger = function (month) {
    return D.occurrences.filter(function (o) { return o.date.slice(0, 7) === month && !o.draft; }).map(function (o) {
      var s = D.session(o.sessionId), rev = 0;
      if (s.client) { var line = null; F.invoices.concat(F.drafts).forEach(function (i) { (i.lines || []).forEach(function (l) { if (l.occurrence === o.id && (l.include !== false)) line = l; }); }); rev = line ? price(line).net : 0; }
      else if (o.status === 'Completed') { var weekly = D.occurrences.filter(function (x) { return x.sessionId === o.sessionId && x.date.slice(0, 7) === month && x.status === 'Completed'; }).length; rev = Math.round(K.sum(F.familyCharges.filter(function (c) { return c.month === month && D.memberships.filter(function (m) { return m.id === c.membership; })[0].session === o.sessionId; }), function (c) { return netOfGross(c.gross); }) / (weekly || 1)); }
      var coach = K.sum(F.allocations.filter(function (a) { return a.occurrence === o.id; }), 'cost'), venue = F.venueCost(o);
      return { occurrence: o, revenue: rev, coach: coach, venue: venue, contribution: rev - coach - venue };
    });
  };

  /* ---------- Read helpers ---------- */
  db.fin = F;
  db.getFinanceSettings = function () { return F.settings; };
  db.getFinanceGrants = function () { return F.grants; };
  db.getClients = function () { return F.clients; };
  db.getClient = function (id) { return pick(F.clients, id); };
  db.getServices = function (clientId) { return F.services.filter(function (s) { return !clientId || s.client === clientId; }); };
  db.getService = function (id) { return pick(F.services, id); };
  db.getTerms = function (serviceId) { return F.terms.filter(function (t) { return !serviceId || t.service === serviceId; }); };
  db.getBillingOverrides = function () { return F.overrides; };
  db.getInvoices = function (f) { return f ? F.invoices.filter(f) : F.invoices; };
  db.getInvoice = function (id) { return pick(F.invoices, id) || F.invoices.filter(function (i) { return i.number === id; })[0]; };
  db.getDrafts = function () { return F.drafts; };
  db.getDraft = function (id) { return pick(F.drafts, id); };
  db.getCreditNotes = function (invId) { return F.creditNotes.filter(function (c) { return !invId || c.invoice === invId; }); };
  db.getPayments = function (invId) { return F.payments.filter(function (p) { return !invId || p.invoice === invId; }); };
  db.getClientCredits = function (clientId) { return F.clientCredits.filter(function (c) { return !clientId || c.client === clientId; }); };
  db.getFamilyCharges = function (f) { return f ? F.familyCharges.filter(f) : F.familyCharges; };
  db.getFamilyCredits = function (fam) { return F.familyCredits.filter(function (c) { return !fam || c.family === fam; }); };
  db.getRefunds = function (fam) { return F.refunds.filter(function (r) { return !fam || r.family === fam; }); };
  db.getBookings = function (f) { return f ? F.bookings.filter(f) : F.bookings; };
  db.getBooking = function (id) { return pick(F.bookings, id); };
  db.getRateProfiles = function (coach) { return F.rateProfiles.filter(function (r) { return !coach || r.coach === coach; }); };
  db.getAllocations = function (f) { return f ? F.allocations.filter(f) : F.allocations; };
  db.getOtherCosts = function () { return F.otherCosts; };
  db.getOverheads = function () { return F.overheads; };
  db.getIntegrations = function () { return F.integrations; };

  /* ---------- Write helpers (in memory only) ---------- */
  db.addFamilyCredit = function (c) { c.id = c.id || 'FCR-' + String(F.familyCredits.length + 301); c.remaining = c.remaining == null ? c.amount : c.remaining; c.applications = c.applications || []; F.familyCredits.push(c); return c; };
  db.addRefund = function (r) { r.id = 'RFD-' + String(F.refunds.length + 1).padStart(2, '0'); F.refunds.push(r); return r; };
  db.addBooking = function (b) { b.id = b.id || 'BKG-' + String(F.bookings.length + 1).padStart(3, '0'); F.bookings.push(b); return b; };
  db.addFamilyCharge = function (c) { return charge(c); };
  db.addAllocation = function (a) { a.id = 'ALC-' + String(F.allocations.length + 1001); F.allocations.push(a); return a; };

  /* ---------- Finance audit seed (every finance write is logged) ---------- */
  D.audit = D.audit || [];
  [
    { at: '2026-09-30T16:02', who: 'David Cole', summary: 'Issued invoice NC-1012 to Riverside Academy (£702.00)', entity: 'INV-0012', before: 'Draft DRF-00 (Ready for issue)', after: 'Issued NC-1012' },
    { at: '2026-09-15T10:12', who: 'Josh Evans', summary: 'Moved due date of NC-1011 from 16 Sep to 26 Sep', entity: 'INV-0011', before: 'Due 16 Sep 2026', after: 'Due 26 Sep 2026 (reason: client asked for 10 more days)' },
    { at: '2026-09-11T09:30', who: 'Josh Evans', summary: 'Overrode allocation cost for Tom Reid, Thu 10 Sep', entity: 'ALC', before: '£50.00', after: '£60.00 (reason recorded)' },
    { at: '2026-08-28T16:20', who: 'Josh Evans', summary: 'Updated finance settings', entity: 'Settings', before: 'Next number 1012', after: 'Next number 1013' },
    { at: '2026-08-27T09:05', who: 'Josh Evans', summary: 'Reversed payment PAY-112 (entered twice in error)', entity: 'INV-0010', before: 'Paid £600.00', after: 'Paid £300.00 + reversal −£300.00' },
    { at: '2026-07-09T11:20', who: 'Josh Evans', summary: 'Raised credit note NC-CN-001 against NC-1007', entity: 'INV-0007', before: 'Balance £0.00', after: 'Client credit £60.00 created' }
  ].forEach(function (e, i) { D.audit.push(Object.assign({ id: 'AUD-F' + (i + 1), area: 'Finance', finance: true, restricted: true }, e)); });

  /* ---------- Finance writes: each one is logged with who, when, before and after ---------- */
  function flog(summary, entity, before, after) { return K.log({ area: 'Finance', finance: true, restricted: true, summary: summary, entity: entity, before: before, after: after }); }
  function hist(o, text, detail, tone) { (o.history = o.history || []).push({ text: text, detail: detail || '', who: K.me(), at: K.now(), tone: tone || 'info' }); }
  db.finUpdateSettings = function (patch) {
    var before = JSON.stringify(F.settings); Object.assign(F.settings, patch, { updatedBy: K.me(), updatedAt: K.now() });
    flog('Updated finance settings', 'Settings', before.slice(0, 120) + '…', Object.keys(patch).map(function (k) { return k + ': ' + patch[k]; }).join(', '));
  };
  db.setFinanceGrant = function (person, access) { var g = F.grants.filter(function (x) { return x.person === person; })[0]; var b = g.access; g.access = access; g.grantedBy = K.me(); g.at = K.now(); flog('Changed Finance access for ' + person, 'Access', b, access); return g; };
  db.updateClient = function (id, patch) { var c = pick(F.clients, id), b = JSON.stringify(c); Object.assign(c, patch); flog('Updated client ' + c.name, id, b.slice(0, 100) + '…', JSON.stringify(patch)); return c; };
  db.setServiceState = function (id, state, from, reason) {
    var s = pick(F.services, id), cur = s.periods[s.periods.length - 1];
    if (cur && !cur.to) cur.to = K.addDays(from, -1);
    s.periods.push({ state: state, from: from, to: null, reason: reason, by: K.me(), at: K.now() });
    flog('Service ' + s.name + ' set to ' + state + ' from ' + K.dm(from), id, cur ? cur.state : '—', state); return s;
  };
  db.addTerm = function (t) {
    var prev = F.terms.filter(function (x) { return x.service === t.service && !x.to; })[0];
    if (prev) prev.to = K.addDays(t.from, -1);
    t.id = 'TRM-' + String(F.terms.length + 1).padStart(2, '0'); t.by = K.me(); t.at = K.now(); F.terms.push(t);
    flog('Added commercial terms from ' + K.dm(t.from), t.service, prev ? K.money(prev.amount) + ' (ended ' + K.dm(prev.to) + ')' : 'No terms', K.money(t.amount) + ' ' + t.charge.toLowerCase());
    return t;
  };
  db.addOverride = function (o) { o.id = 'OVR-' + String(F.overrides.length + 1).padStart(2, '0'); o.by = K.me(); o.at = K.now(); o.removed = null; F.overrides.push(o); flog('Billing override on ' + o.occurrence + ': ' + o.type, o.occurrence, 'Billable at terms', o.type + (o.value != null ? ' ' + o.value : '') + ' (' + o.reason + ')'); return o; };
  db.removeOverride = function (id, reason) { var o = pick(F.overrides, id); o.removed = { by: K.me(), at: K.now(), reason: reason }; flog('Removed billing override ' + id, o.occurrence, o.type, 'Billable at terms (' + reason + ')'); return o; };

  db.createDraft = function (clientId, month) {
    var c = pick(F.clients, clientId);
    var d = { id: 'DRF-' + String(F.drafts.length + 1).padStart(2, '0'), client: clientId, period: month, state: 'Draft', revision: 1, po: '', poOverride: '', terms: c.terms, termsSource: c.termsOverride ? 'Client override' : 'Organisation default', lines: F.eligibleLines(clientId, month), createdBy: K.me(), at: K.now(), history: [] };
    hist(d, 'Draft created for ' + month); F.drafts.push(d); flog('Created invoice draft for ' + c.name + ' (' + month + ')', d.id, '—', 'Draft');
    return d;
  };
  function touch(d) { if (d.state === 'Ready for issue') { d.state = 'Draft'; d.revision++; hist(d, 'Changed after it was ready: back to Draft (revision ' + d.revision + ')', '', 'warn'); } }
  db.setDraftLine = function (draftId, lineId, include, reason) {
    var d = pick(F.drafts, draftId), l = pick(d.lines, lineId); touch(d);
    var b = l.include; l.include = include; l.reason = include ? '' : reason; l.excludedBy = include ? null : K.me();
    hist(d, (include ? 'Included ' : 'Excluded ') + l.description, include ? '' : reason, include ? 'info' : 'warn');
    flog((include ? 'Included' : 'Excluded') + ' a line on ' + d.id, d.id, b ? 'Included' : 'Excluded', include ? 'Included' : 'Excluded: ' + reason);
  };
  db.setDraftPO = function (draftId, po, override) { var d = pick(F.drafts, draftId); touch(d); d.po = po; d.poOverride = override; hist(d, po ? 'PO number set to ' + po : 'PO override: ' + override); flog('Set PO on ' + d.id, d.id, '—', po || ('Override: ' + override)); };
  db.draftProblems = function (d) {
    var c = pick(F.clients, d.client), p = [];
    if (c.poRequired && !d.po && !d.poOverride) p.push('A PO number or a PO override reason is needed for ' + c.name + '.');
    d.lines.forEach(function (l) { if (l.exception === 'Missing terms' && l.include) p.push('A line has no commercial terms: ' + l.description); if (!l.include && !l.reason) p.push('Excluded line needs a reason: ' + l.description); });
    if (!d.lines.some(function (l) { return l.include; })) p.push('No lines are included.');
    return p;
  };
  db.readyDraft = function (draftId) { var d = pick(F.drafts, draftId); d.state = 'Ready for issue'; hist(d, 'Marked ready for issue (revision ' + d.revision + ')', '', 'ok'); flog('Marked ' + d.id + ' ready for issue', d.id, 'Draft', 'Ready for issue'); };
  db.issueDraft = function (draftId) {
    var d = pick(F.drafts, draftId), c = pick(F.clients, d.client), S = F.settings;
    var number = S.prefix + String(S.nextNumber).padStart(S.digits, '0'); S.nextNumber++;
    var issued = '2026-10-01', at = K.now();
    var i = { id: 'INV-' + String(F.invoices.length + 1).padStart(4, '0'), number: number, client: d.client, period: d.period, issued: issued, due: K.addDays(issued, d.terms), issuedBy: K.me(), po: d.po, poOverride: d.poOverride, terms: d.terms, termsSource: d.termsSource,
      lines: d.lines.filter(function (l) { return l.include; }).map(function (l) { return price(Object.assign({}, l)); }),
      omissions: d.lines.filter(function (l) { return !l.include; }).map(function (l) { return { description: l.description, reason: l.reason, approvedBy: K.me() }; }), fromDraft: d.id, revision: d.revision,
      xero: { status: S.numberAuthority === 'Hub' ? 'Pending' : 'Synced', ref: null, at: at } };
    i.lines.forEach(function (l, n) { l.id = i.id + '-L' + (n + 1); });
    var t = totals(i.lines); i.net = t.net; i.vat = t.vat; i.gross = t.gross;
    i.issuer = { name: S.legalName, address: S.address, vatNumber: S.vatNumber, companyNumber: S.companyNumber };
    i.history = [{ text: 'Issued as ' + number + ' from ' + d.id + ' (revision ' + d.revision + ')', who: K.me(), at: at, tone: 'info' }];
    F.invoices.push(i); d.state = 'Issued'; d.invoice = i.id; hist(d, 'Issued as ' + number, '', 'ok');
    flog('Issued invoice ' + number + ' to ' + c.name + ' (' + K.money(i.gross) + ')', i.id, d.id + ' ready for issue', 'Issued ' + number);
    return i;
  };
  db.sendInvoice = function (invId) { var i = pick(F.invoices, invId), c = pick(F.clients, i.client); hist(i, 'Sent to ' + c.email + (c.cc ? ' (cc ' + c.cc + ')' : '')); flog('Sent ' + i.number, invId, '—', 'Sent to ' + c.email); };
  db.retryXero = function (invId) { var i = pick(F.invoices, invId); var b = i.xero.status; i.xero = { status: 'Synced', ref: 'XRO-' + i.number.slice(3), at: K.now() }; hist(i, 'Sent to Xero (' + i.xero.ref + ')', '', 'ok'); flog('Synced ' + i.number + ' to Xero', invId, b, 'Synced'); };
  db.changeDueDate = function (invId, to, reason) {
    var i = pick(F.invoices, invId); i.originalDue = i.originalDue || i.due; var from = i.due; i.due = to;
    (i.dueChanges = i.dueChanges || []).push({ from: from, to: to, reason: reason, by: K.me(), at: K.now() }); hist(i, 'Due date moved from ' + K.dm(from) + ' to ' + K.dm(to), reason, 'warn');
    flog('Moved due date of ' + i.number, invId, 'Due ' + K.d(from), 'Due ' + K.d(to) + ' (' + reason + ')');
  };
  db.recordPayment = function (invId, amount, method, ref, date) {
    var i = pick(F.invoices, invId), bal = F.balance(i);
    var p = { id: 'PAY-' + String(F.payments.length + 101), invoice: invId, amount: amount, date: date || K.today, method: method, ref: ref, by: K.me(), at: K.now() };
    F.payments.push(p); hist(i, 'Payment ' + K.money(amount) + ' recorded (' + method + ')', ref, 'ok');
    flog('Recorded payment on ' + i.number, invId, 'Balance ' + K.money(bal), 'Balance ' + K.money(F.balance(i)));
    if (amount > bal && bal >= 0) { var cc = { id: 'CC-' + String(F.clientCredits.length + 1).padStart(2, '0'), client: i.client, source: 'Overpayment on ' + i.number, amount: amount - bal, applied: [], voided: null, at: K.now(), by: K.me() }; F.clientCredits.push(cc); hist(i, 'Overpayment: client credit ' + K.money(cc.amount) + ' created', '', 'info'); }
    return p;
  };
  db.reversePayment = function (payId, reason) {
    var o = pick(F.payments, payId), i = pick(F.invoices, o.invoice);
    var r = { id: 'PAY-' + String(F.payments.length + 101), invoice: o.invoice, amount: -o.amount, date: K.today, method: 'Reversal', ref: 'Reverses ' + payId + ': ' + reason, reverses: payId, by: K.me(), at: K.now() };
    F.payments.push(r); hist(i, 'Payment ' + payId + ' reversed', reason, 'danger'); flog('Reversed payment ' + payId, o.invoice, 'Paid ' + K.money(o.amount), 'Reversal −' + K.money(o.amount) + ' (' + reason + ')'); return r;
  };
  db.isReversed = function (payId) { return F.payments.some(function (p) { return p.reverses === payId; }); };
  db.creditedLines = function (invId) { var ids = []; F.creditNotes.forEach(function (c) { if (c.invoice === invId) ids = ids.concat(c.lines); }); return ids; };
  db.raiseCreditNote = function (invId, lineIds, reason) {
    var i = pick(F.invoices, invId), balBefore = F.balance(i);
    var ls = i.lines.filter(function (l) { return lineIds.indexOf(l.id) >= 0; });
    var c = { id: 'CN-' + String(F.creditNotes.length + 1).padStart(3, '0'), number: 'NC-CN-' + String(F.creditNotes.length + 1).padStart(3, '0'), invoice: invId, lines: lineIds.slice(), reason: reason, by: K.me(), at: K.now(), net: K.sum(ls, 'net'), vat: K.sum(ls, 'vat'), gross: K.sum(ls, 'gross') };
    F.creditNotes.push(c); hist(i, 'Credit note ' + c.number + ' raised (' + K.money(c.gross) + ')', reason, 'info');
    var after = F.balance(i);
    if (after < 0) { var cc = { id: 'CC-' + String(F.clientCredits.length + 1).padStart(2, '0'), client: i.client, source: 'Credit note ' + c.number + ' on a paid invoice', amount: Math.min(-after, c.gross), applied: [], voided: null, at: K.now(), by: K.me() }; F.clientCredits.push(cc); hist(i, 'Client credit ' + K.money(cc.amount) + ' created from the credit note', '', 'info'); }
    flog('Raised credit note ' + c.number + ' on ' + i.number, invId, 'Balance ' + K.money(balBefore), 'Balance ' + K.money(Math.max(0, after)));
    return c;
  };
  db.replaceInvoice = function (invId, reason) {
    var i = pick(F.invoices, invId), open = i.lines.filter(function (l) { return db.creditedLines(invId).indexOf(l.id) < 0; });
    var cn = db.raiseCreditNote(invId, open.map(function (l) { return l.id; }), 'Correction: ' + reason);
    var d = { id: 'DRF-' + String(F.drafts.length + 1).padStart(2, '0'), client: i.client, period: i.period, state: 'Draft', revision: 1, po: i.po, poOverride: i.poOverride || '', terms: i.terms, termsSource: i.termsSource, replaces: invId,
      lines: open.map(function (l, n) { return Object.assign({}, l, { id: 'RL-' + (n + 1), include: true, reason: '' }); }), createdBy: K.me(), at: K.now(), history: [] };
    hist(d, 'Replacement draft for ' + i.number + ' (credited in full by ' + cn.number + ')', reason, 'warn'); F.drafts.push(d);
    hist(i, 'Replaced: correction draft ' + d.id + ' created', reason, 'warn'); flog('Started replacement for ' + i.number, invId, 'Issued', 'Credited by ' + cn.number + '; replacement ' + d.id);
    return d;
  };
  db.applyClientCredit = function (ccId, invId, amount) { var c = pick(F.clientCredits, ccId), i = pick(F.invoices, invId); c.applied.push({ invoice: invId, amount: amount, by: K.me(), at: K.now() }); hist(i, 'Client credit ' + K.money(amount) + ' applied (' + ccId + ')', '', 'ok'); flog('Applied client credit ' + ccId + ' to ' + i.number, ccId, 'Remaining ' + K.money(F.creditRemaining(c) + amount), 'Remaining ' + K.money(F.creditRemaining(c))); };
  db.unapplyClientCredit = function (ccId, idx, reason) { var c = pick(F.clientCredits, ccId), a = c.applied[idx]; a.removed = { by: K.me(), at: K.now(), reason: reason }; hist(pick(F.invoices, a.invoice), 'Client credit ' + K.money(a.amount) + ' unapplied', reason, 'warn'); flog('Unapplied client credit ' + ccId, ccId, 'Applied ' + K.money(a.amount), 'Unapplied (' + reason + ')'); };
  db.voidClientCredit = function (ccId, reason) { var c = pick(F.clientCredits, ccId), b = F.creditRemaining(c); c.voided = { by: K.me(), at: K.now(), reason: reason }; flog('Voided client credit ' + ccId, ccId, 'Remaining ' + K.money(b), 'Void (' + reason + ')'); };
  db.recordRefundDecision = function (fam, amount, reason, method) { var r = db.addRefund({ family: fam, amount: amount, reason: reason, decidedBy: K.me(), at: K.now(), method: method, state: 'Approved' }); flog('Refund decision for ' + db.getFamily(fam).name + ' (' + K.money(amount) + ')', r.id, '—', reason); return r; };
  db.addOtherCost = function (c) { c.id = 'CST-' + String(F.otherCosts.length + 1).padStart(2, '0'); c.by = K.me(); F.otherCosts.push(c); flog('Added cost ' + c.supplier + ' (' + K.money(c.net) + ' net)', c.id, '—', c.description); return c; };
  db.addOverhead = function (o) { o.id = 'OVH-' + String(F.overheads.length + 1).padStart(2, '0'); F.overheads.push(o); flog('Added overhead ' + o.name, o.id, '—', K.money(o.net) + ' ' + o.frequency.toLowerCase()); return o; };
  F.paymentRuns = [{ id: 'PR-08', month: '2026-08', paidOn: '2026-09-07', amount: 41250, by: 'Josh Evans', at: '2026-09-07T09:15', state: 'Paid' }];
  db.getPaymentRuns = function () { return F.paymentRuns; };
  db.runCoachPayments = function (month) {
    var list = F.allocations.filter(function (a) { return a.date.slice(0, 7) === month && (a.state === 'Confirmed' || a.state === 'Exported') && !a.run; });
    list.forEach(function (a) { a.state = 'Exported'; a.run = 'PR-' + month.slice(5); });
    var run = { id: 'PR-' + month.slice(5), month: month, paidOn: month === '2026-09' ? '2026-10-07' : K.today, amount: K.sum(list, 'cost'), by: K.me(), at: K.now(), state: 'Scheduled', count: list.length };
    F.paymentRuns.push(run); flog('Prepared coach payment run for ' + month + ' (' + K.money(run.amount) + ')', run.id, list.length + ' confirmed allocations', 'Exported, paying ' + K.d(run.paidOn)); return run;
  };
})();
