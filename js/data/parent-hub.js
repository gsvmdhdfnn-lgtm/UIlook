/* Parent / Player hub: mock data and Hub.db helpers (pass 12).
   The signed-in parent is Sarah Whitfield (PAR-01, FAM-01). Everything
   here composes the shared people, schedule, finance, families and
   development data; only parent-hub-only details (what to bring, bookable
   products, the basket, notification choices) live here. In memory only. */
(function () {
  var D = Hub.data, db = Hub.db, K = Hub.kit;
  var PH = D.parentHub = {};
  function pick(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }
  function byAt(a, b) { return a.at < b.at ? -1 : 1; }

  /* ---------- Parent-hub-only mock data ---------- */
  /* What to bring, per programme (shown on each occurrence). */
  PH.whatToBring = {
    'Development Centre': ['Football boots or astro trainers', 'Shin pads', 'Named water bottle', 'A warm layer; we train outside unless there is lightning'],
    TDC: ['Football boots or astro trainers', 'Shin pads', 'Named water bottle', 'Training top if you have one', 'A warm layer for the cool-down'],
    Academy: ['Academy training kit', 'Boots and shin pads', 'Named water bottle', 'Any medication your child may need'],
    Camp: ['Packed lunch and two snacks (nut free)', 'Named water bottle', 'Boots, trainers and shin pads', 'Sun cream or a waterproof, depending on the forecast'],
    Event: ['Boots or astro trainers', 'Shin pads', 'Named water bottle'],
    Tour: ['Passport (valid until October 2027)', 'Club kit issued at the pre-tour meeting', 'European health card (GHIC)']
  };

  /* Two family credits added today for the Whitfields, so checkout can
     show credit being used oldest first (and part-used). */
  db.addFamilyCredit({ family: 'FAM-01', player: 'PLY-0002', amount: 1200, source: 'Training top returned unworn (kit order KIT-114)', at: '2026-10-01T09:05', by: 'Sam Okafor' });
  db.addFamilyCredit({ family: 'FAM-01', player: 'PLY-0001', amount: 1500, source: 'U9/10 Development ended 30 minutes early on Thu 24 Sep (floodlight fault)', at: '2026-10-01T10:05', by: 'Josh Evans' });

  /* Bookable products. Prices come from the package groups and the public
     offers so they match what management and the public site show. */
  var pkg = pick(db.getPackageGroups(), 'PKG-01');
  var ev = db.getPublicOffer('events').rows, tour = db.getPublicOffer('tours').rows[0];
  PH.products = [
    { id: 'camp-oct', title: 'Autumn half-term camp', kind: 'Camp', offer: 'events', icon: 'whistle', when: 'Mon 26 to Wed 28 Oct · 9:30–15:00', venue: 'northgate', ages: 'Ages 5 to 13',
      ageGroups: ['U7', 'U8', 'U9/10', 'U11', 'U12', 'U13/14'], dates: ['2026-10-26', '2026-10-27', '2026-10-28'], pickDay: true, packageGroup: pkg.id,
      tiers: pkg.tiers.map(function (t) { return { id: t.id, name: t.name, days: t.days, price: t.price }; }),
      refundPolicy: 'RFP-01', discounts: ['DSC-01', 'DSC-02'], capacity: 40, booked: 23,
      summary: 'Skills, small-sided games and a tournament on the last day. Book single days or the three-day package.' },
    { id: 'xmas-festival', title: ev[2].name, kind: 'Event', offer: 'events', icon: 'star', when: ev[2].when, venue: ev[2].venue, ages: ev[2].who,
      ageGroups: ['U8', 'U9/10', 'U11', 'U12'], dates: ['2026-12-12'], tiers: [{ id: 'XMS-01', name: 'Festival place', days: 1, price: ev[2].price }],
      refundPolicy: 'RFP-01', discounts: ['DSC-01'], capacity: 60, booked: 12,
      summary: 'A morning of festive small-sided games for every group, with a visit from the coaches in fancy dress.' },
    { id: 'easter-tour', title: tour.name, kind: 'Tour', offer: 'tours', icon: 'venue', when: tour.when, venue: null, venueText: tour.venue, ages: tour.who,
      ageGroups: ['U12', 'U13/14'], dates: ['2027-04-02', '2027-04-03', '2027-04-04', '2027-04-05'], tiers: [{ id: 'TOR-01', name: 'Deposit to hold a place', days: 4, price: 10000, full: tour.price, balanceDue: '2027-02-05' }],
      refundPolicy: null, refundText: 'The deposit is not refundable once the tour is confirmed in January.', discounts: [], capacity: 24, booked: 17,
      summary: 'Four days of matches, training and team time with our coaches.' }
  ];

  /* Notification choices for the signed-in parent. */
  PH.prefs = [
    { id: 'pp-sessions', label: 'Session changes and cancellations', email: true, push: true, locked: true },
    { id: 'pp-feedback', label: 'New feedback and development plans', email: true, push: true },
    { id: 'pp-billing', label: 'Payments, credits and refunds', email: true, push: false },
    { id: 'pp-requests', label: 'Updates on my requests', email: true, push: true },
    { id: 'pp-news', label: 'Camps, events and offers', email: false, push: false }
  ];
  PH.prefsUpdated = { by: 'Sarah Whitfield', at: '2026-03-12T10:20' };
  PH.security = { passwordChangedAt: '2026-03-12T10:04', twoStep: false };
  PH.basket = [];
  PH.lastBooking = null;

  /* ---------- Signed-in parent ---------- */
  db.phAccount = function () { return Object.assign({}, db.getParent(D.parent.id), { email: D.parent.email }); };
  db.phFamily = function () { return db.getFamily(D.parent.family); };
  db.phChildren = function () { return db.getFamilyPlayers(D.parent.family).filter(function (p) { return p.status !== 'Inactive'; }); };
  db.phIsChild = function (pid) { return db.phChildren().some(function (p) { return p.id === pid; }); };
  db.phMemberships = function () { var ids = db.phChildren().map(function (p) { return p.id; }); return db.getMemberships(function (m) { return ids.indexOf(m.player) >= 0; }); };
  db.phIsMembership = function (mid) { return db.phMemberships().some(function (m) { return m.id === mid; }); };
  db.getParentPrefs = function () { return PH.prefs; };
  db.getParentPrefsUpdated = function () { return PH.prefsUpdated; };
  db.setParentPref = function (id, channel, who, at) { var p = pick(PH.prefs, id); if (p.locked) return p; p[channel] = !p[channel]; PH.prefsUpdated = { by: who, at: at }; return p; };
  db.getParentSecurity = function () { return PH.security; };
  db.changeParentPassword = function (at) { PH.security.passwordChangedAt = at; return PH.security; };
  db.updateParentContact = function (id, patch) { var p = db.getParent(id), before = { phone: p.phone }; if (patch.phone != null) p.phone = patch.phone; return { before: before, after: { phone: p.phone } }; };

  /* ---------- Sessions for the family's children ---------- */
  /* Occurrences a child is (or was) expected at, including cancelled and
     rescheduled ones. o: { from, to } ISO dates. */
  db.getChildOccurrences = function (pid, o) {
    o = o || {};
    return db.getOccurrences(function (x) {
      if (x.draft || (o.from && x.date < o.from) || (o.to && x.date > o.to)) return false;
      return db.getExpectedPlayers(x).indexOf(pid) >= 0;
    });
  };
  /* Every child's occurrences together, soonest first: [{ occurrence, player }]. */
  db.getFamilyOccurrences = function (o) {
    var out = [];
    db.phChildren().forEach(function (p) { db.getChildOccurrences(p.id, o).forEach(function (x) { out.push({ occurrence: x, player: p }); }); });
    return out.sort(function (a, b) { var ka = a.occurrence.date + a.occurrence.start, kb = b.occurrence.date + b.occurrence.start; return ka < kb ? -1 : ka > kb ? 1 : 0; });
  };
  db.getNextChildOccurrence = function (pid) {
    return db.getChildOccurrences(pid, { from: K.today }).filter(function (x) { return x.status === 'Scheduled' && (x.date > K.today || x.end > '14:10'); })[0] || null;
  };
  db.phOccurrenceChildren = function (occId) { var o = db.getOccurrence(occId); if (!o) return []; var ex = db.getExpectedPlayers(o); return db.phChildren().filter(function (p) { return ex.indexOf(p.id) >= 0; }); };
  /* Credit or refund the family received for a cancelled occurrence. */
  db.getOccurrenceOutcomeFor = function (occId, pid) {
    var c = db.getFamilyCredits().filter(function (x) { return x.occurrence === occId && (!pid || x.player === pid); })[0];
    if (c) return { kind: 'Credit', item: c };
    var r = db.getRefunds().filter(function (x) { return x.occurrence === occId && (!pid || x.player === pid); })[0];
    return r ? { kind: 'Refund', item: r } : null;
  };
  db.getWhatToBring = function (programmeOrKind) { return PH.whatToBring[programmeOrKind] || PH.whatToBring.TDC; };

  /* ---------- Browse, book, basket and checkout ---------- */
  db.getBookables = function () { return PH.products; };
  db.getBookable = function (id) { return pick(PH.products, id); };
  db.getBookableTier = function (pid, tid) { var p = db.getBookable(pid); return p && pick(p.tiers, tid); };
  db.getCurrentTerms = function () { return db.getTermsVersions().filter(function (t) { return t.kind === 'Terms and conditions' && !t.to; })[0]; };
  db.addTermsAcceptance = function (a) { D.commercial.acceptances.push(a); return a; };
  db.isEligibleFor = function (productId, pid) {
    var p = db.getBookable(productId), pl = db.getPlayer(pid);
    if (!p || !pl) return { ok: false, reason: 'Not found' };
    if (p.ageGroups.indexOf(pl.ageGroup) < 0) return { ok: false, reason: pl.first + ' is ' + pl.ageGroup + '; this is for ' + p.ages };
    if (PH.basket.some(function (l) { return l.product === productId && l.player === pid; })) return { ok: false, reason: pl.first + ' is already in your basket for this' };
    if (db.getBookings(function (b) { return b.family === pl.family && b.state !== 'Cancelled' && b.productId === productId && b.lines.some(function (l) { return l.player === pid && l.status !== 'Cancelled'; }); }).length) return { ok: false, reason: pl.first + ' is already booked' };
    return { ok: true, reason: 'Eligible' };
  };
  db.getBasket = function () { return PH.basket; };
  db.addBasketLine = function (l) { PH.seq = (PH.seq || 0) + 1; l.id = 'BSK-' + String(PH.seq).padStart(3, '0'); PH.basket.push(l); return l; };
  db.removeBasketLine = function (id) { PH.basket = PH.basket.filter(function (l) { return l.id !== id; }); };
  db.getLastParentBooking = function () { return PH.lastBooking ? db.getBooking(PH.lastBooking) : null; };
  db.clearLastParentBooking = function () { PH.lastBooking = null; };

  /* Does the player hold a membership that is still running on this date? */
  db.phMemberOn = function (pid, date) {
    return db.getPlayerMemberships(pid).some(function (m) {
      if (m.state === 'Active' || m.state === 'Cancellation Pending') return true;
      if (m.state === 'Ending Scheduled') return m.cancel && m.cancel.end >= date;
      if (m.state === 'Paused') return m.pause && (date < m.pause.from || date > m.pause.to);
      return false;
    });
  };
  /* Price the basket. Discounts never stack (commercial setup): each line
     gets its single best active discount. Sibling: second and later child
     on the same product in this checkout. Membership: an Active
     membership on the product's first date (camps only). */
  db.priceBasket = function () {
    var rules = db.getDiscountRules(), seen = {}, on = K.feature('discounts');
    var lines = PH.basket.map(function (l) {
      var p = db.getBookable(l.product), t = db.getBookableTier(l.product, l.tier), base = t.price, best = null;
      var nth = (seen[l.product] = (seen[l.product] || 0) + 1);
      (p.discounts || []).forEach(function (rid) {
        var r = pick(rules, rid); if (!on || !r || !r.active) return;
        var pct = parseFloat(r.amount) / 100, ok = false;
        if (r.type === 'Sibling') ok = nth > 1;
        if (r.type === 'Membership') ok = db.phMemberOn(l.player, p.dates[0]);
        if (ok && (!best || pct > best.pct)) best = { rule: r, pct: pct };
      });
      var discount = best ? Math.round(base * best.pct) : 0;
      return Object.assign({}, l, { productTitle: p.title, tierName: t.name, base: base, discount: discount, discountRule: best ? best.rule.name : null, final: base - discount });
    });
    var total = K.sum(lines, 'final');
    var plan = db.planFamilyCredit(D.parent.family, total);
    return { lines: lines, subtotal: K.sum(lines, 'base'), discount: K.sum(lines, 'discount'), total: total, credit: plan, creditUsed: K.sum(plan, 'use'), due: total - K.sum(plan, 'use') };
  };
  /* Family credit with something left, oldest first. */
  db.getAvailableFamilyCredit = function (fam) { return db.getFamilyCredits(fam).filter(function (c) { return c.remaining > 0; }).sort(byAt); };
  db.planFamilyCredit = function (fam, amount) {
    var left = amount, out = [];
    db.getAvailableFamilyCredit(fam).forEach(function (c) { if (left <= 0) return; var use = Math.min(c.remaining, left); left -= use; out.push({ credit: c, use: use }); });
    return out;
  };
  /* Pay: one booking, one family charge, credit applied oldest first,
     terms acceptance kept as evidence. Card details are never kept. */
  db.checkoutBasket = function (card, who, at) {
    var q = db.priceBasket(); if (!q.lines.length) return null;
    var fam = D.parent.family, terms = db.getCurrentTerms(), first = db.getBookable(q.lines[0].product);
    var titles = q.lines.map(function (l) { return l.productTitle; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var remainingCredit = q.creditUsed, lineNo = K.sum(db.getBookings(), function (x) { return x.lines.length; });
    var b = db.addBooking({ family: fam, bookedBy: D.parent.id, payer: D.parent.id, at: at, state: 'Paid', terms: terms.id, product: titles.join(' + '), productId: titles.length === 1 ? first.id : null, source: 'Parent hub checkout',
      lines: q.lines.map(function (l, i) {
        var use = Math.min(remainingCredit, l.final); remainingCredit -= use;
        var p = db.getBookable(l.product);
        return { id: 'BKL-' + String(lineNo + i + 1).padStart(3, '0'), player: l.player, type: p.kind === 'Camp' ? (l.dates.length > 1 ? 'Camp days' : 'Camp day') : p.kind, dates: l.dates, tier: l.tierName, status: 'Booked', base: l.base, discount: l.discount, discountRule: l.discountRule,
          refundPolicy: p.refundPolicy ? db.getRefundPolicies().filter(function (r) { return r.id === p.refundPolicy; })[0].name : 'Tour deposit', creditApplied: use, final: l.final - use, due: l.final - use };
      }),
      payment: q.due > 0 ? { method: card.brand + ' ending ' + card.last4, amount: q.due, at: at, by: who, reference: 'pi_test_' + at.replace(/\D/g, '').slice(-8) } : null,
      history: [{ text: 'Booked and paid in the parent hub', detail: q.due > 0 ? K.money(q.due) + ' by card' : 'Paid in full with family credit', who: who, at: at, tone: 'ok' }] });
    b.total = K.sum(b.lines, 'final');
    var ch = db.addFamilyCharge({ family: fam, player: q.lines[0].player, membership: null, booking: b.id, type: 'Booking', description: b.product + ' (' + b.id + ')', month: null, date: at.slice(0, 10), gross: q.total, creditApplied: q.creditUsed, paid: q.due, state: 'Paid', via: q.due > 0 ? 'Card' : 'Family credit', note: q.creditUsed ? 'Family credit applied ' + K.money(q.creditUsed) : '' });
    b.charge = ch.id;
    q.credit.forEach(function (x) { x.credit.remaining -= x.use; x.credit.applications.push({ charge: ch.id, booking: b.id, amount: x.use, at: at, by: who + ' (checkout, oldest first)' }); });
    db.addTermsAcceptance({ parent: D.parent.id, version: terms.id, at: at, evidence: 'Checkbox at checkout for ' + b.id });
    PH.basket = []; PH.lastBooking = b.id;
    return b;
  };
  db.getFamilyBookings = function (fam) { return db.getBookings(function (b) { return b.family === fam; }).slice().sort(byAt).reverse(); };

  /* ---------- Memberships: requests from the family ---------- */
  db.getMembershipNotice = function (m) { var r = db.getBillingRule(m.billingRule), days = r ? r.noticeDays : 30; return { days: days, end: K.addDays(K.today, days), rule: r }; };
  db.getOpenMembershipRequest = function (mid) { return db.getRequests(function (r) { return r.membership === mid && (r.status === 'Open' || r.status === 'In review'); })[0] || null; };
  db.requestMembershipPause = function (mid, from, to, reason, who, at) {
    var m = db.getMembership(mid), p = db.getPlayer(m.player);
    return db.addRequest({ type: 'Pause', status: 'Open', stage: 'New', player: m.player, family: p.family, by: D.parent.id, at: at, membership: mid, session: m.session, reason: reason, effective: from, pauseTo: to });
  };
  db.requestMembershipCancellation = function (mid, reason, who, at) {
    var m = db.getMembership(mid), p = db.getPlayer(m.player), n = db.getMembershipNotice(m);
    db.requestCancellation(mid, reason, who, at);
    return db.addRequest({ type: 'Cancellation', status: 'Open', stage: 'New', player: m.player, family: p.family, by: D.parent.id, at: at, membership: mid, session: m.session, reason: reason, effective: n.end });
  };

  /* ---------- Requests, details and medical ---------- */
  db.getFamilyRequests = function (fam) { return db.getRequests(function (r) { return r.family === fam; }).slice().sort(byAt).reverse(); };
  db.withdrawRequest = function (id, who, at) {
    var r = db.getRequest(id); r.status = 'Withdrawn'; r.stage = 'Done'; r.resolution = { outcome: 'Withdrawn', note: 'Withdrawn by the family', by: who, at: at };
    if (r.type === 'Cancellation' && r.membership) { var m = db.getMembership(r.membership); if (m.state === 'Cancellation Pending') { m.state = 'Active'; m.history.push({ text: 'Cancellation request withdrawn by the family', who: who, at: at, tone: 'ok' }); } }
    return r;
  };
  db.requestDetailChange = function (pid, change, reason, who, at) {
    var p = db.getPlayer(pid);
    return db.addRequest({ type: 'Detail change', status: 'Open', stage: 'New', player: pid, family: p.family, by: D.parent.id, at: at, reason: reason || 'Updated in the parent hub', effective: null, change: change });
  };
  db.requestSessionPlace = function (pid, sid, from, reason, who, at) {
    var p = db.getPlayer(pid);
    return db.addRequest({ type: 'Session request', status: 'Open', stage: 'New', player: pid, family: p.family, by: D.parent.id, at: at, session: sid, reason: reason, effective: from });
  };
  db.requestNewChild = function (child, who, at) {
    return db.addRequest({ type: 'Add a child', status: 'Open', stage: 'New', player: null, family: D.parent.family, by: D.parent.id, at: at, reason: child.first + ' ' + child.last + ', born ' + K.d(child.dob) + (child.note ? '. ' + child.note : ''), effective: null, child: child });
  };
  /* Families re-confirm medical details each term (autumn term from 1 Sep). */
  PH.termStart = '2026-09-01';
  db.getMedicalTermStart = function () { return PH.termStart; };
  db.isMedicalReconfirmDue = function (p) { return p.medical === 'not_confirmed' || !p.medicalConfirmed || p.medicalConfirmed.at.slice(0, 10) < PH.termStart; };
  /* Needs Attention input: active players whose family has not confirmed medical details this term. */
  db.getMedicalReconfirmDue = function (fam) { return db.getPlayers(function (p) { return p.status !== 'Inactive' && (!fam || p.family === fam) && db.isMedicalReconfirmDue(p); }); };
  db.confirmMedical = function (pid, who, at) {
    var p = db.getPlayer(pid), before = p.medicalConfirmed ? K.dt(p.medicalConfirmed.at) + ' by ' + p.medicalConfirmed.by : 'Not confirmed';
    p.medicalConfirmed = { by: who, at: at, reconfirmed: true }; if (p.medical === 'not_confirmed') p.medical = 'none';
    return { before: before, after: K.dt(at) + ' by ' + who };
  };

  /* ---------- Absence notices, invites, resources ---------- */
  /* A family telling the coach a child will miss one occurrence. Coaches can
     read these on the register; nothing changes what the family pays. */
  PH.absences = [];
  db.getAbsences = function (occId) { return PH.absences.filter(function (a) { return !occId || a.occurrence === occId; }); };
  db.addAbsence = function (a) { a.id = 'ABS-' + String(PH.absences.length + 1).padStart(2, '0'); PH.absences.push(a); return a; };
  db.inviteFamilyParent = function (o, who, at) {
    var f = db.getFamily(D.parent.family), id = 'PAR-' + String(D.parents.length + 1).padStart(2, '0');
    var p = db.addParent({ id: id, name: o.name, email: o.email, phone: '', relationship: o.relationship, family: f.id, priority: f.parents.length + 1, link: { method: 'Invite from ' + who, verifiedAt: null, invite: 'Invite sent', invitedAt: at, ended: null } });
    f.parents.push(id);
    db.addRequest({ type: 'Second parent invite', status: 'Open', stage: 'Waiting on family', player: null, family: f.id, by: D.parent.id, at: at, parent: id, reason: 'Please give ' + o.name + ' access too.', effective: null });
    f.history = f.history || []; f.history.push({ text: 'Invite sent to ' + o.name + ' (' + o.relationship + ')', who: who, at: at, tone: 'info' });
    return p;
  };
  PH.read = {};
  db.isResourceRead = function (id) { return !!PH.read[id]; };
  db.markResourceRead = function (id, who, at) { PH.read[id] = { by: who, at: at }; return PH.read[id]; };

  /* ---------- Billing and statement ---------- */
  db.getFamilyBillingSummary = function (fam) {
    var ch = db.getFamilyCharges(function (c) { return c.family === fam; });
    var owed = K.sum(ch.filter(function (c) { return c.state !== 'Paid' && c.state !== 'Not charged'; }), function (c) { return c.gross - c.creditApplied - c.paid; });
    var next = ch.filter(function (c) { return c.state === 'Scheduled'; })[0];
    return { charges: ch, owed: owed, credit: K.sum(db.getFamilyCredits(fam), 'remaining'), paidThisMonth: K.sum(ch.filter(function (c) { return (c.date || '').slice(0, 7) === K.today.slice(0, 7); }), 'paid'), next: next };
  };
  /* Statement of account: charges, card payments and family credit, oldest first, with what is owed after each. */
  db.getFamilyStatement = function (fam) {
    var rows = [];
    db.getFamilyCharges(function (c) { return c.family === fam; }).forEach(function (c) {
      if (c.gross > 0) rows.push({ date: c.date, at: c.date + 'T06:00', text: c.description, ref: c.id, charge: c.gross, kind: 'charge' });
      if (c.creditApplied > 0) rows.push({ date: c.date, at: c.date + 'T06:01', text: 'Family credit applied', ref: c.id, paid: c.creditApplied, kind: 'credit' });
      if (c.paid > 0 && c.state === 'Paid') rows.push({ date: c.date, at: c.date + 'T06:02', text: 'Card payment' + (c.via ? ' · ' + c.via : ''), ref: c.stripe || c.id, paid: c.paid, kind: 'payment' });
    });
    db.getRefunds(fam).forEach(function (r) { rows.push({ date: r.at.slice(0, 10), at: r.at, text: 'Refund: ' + r.reason, ref: r.id, refund: r.amount, kind: 'refund' }); });
    rows.sort(byAt);
    var bal = 0; rows.forEach(function (r) { bal += (r.charge || 0) - (r.paid || 0); r.balance = bal; });
    return rows;
  };
})();
