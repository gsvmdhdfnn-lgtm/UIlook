/* public mock data and read helpers (pass 12).
   Public site offers, Trial Interest leads, sign-up flows and the
   management approvals behind them: coach sign-ups, trial coaches and
   parent claims. Every name, email and date is invented. Sessions and
   prices are read from the schedule data (SES-) where they exist. */
(function () {
  var D = Hub.data, db = Hub.db, K = Hub.kit;
  function by(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }

  /* ---------- Public site ---------- */
  D.publicSite = {
    tagline: 'Football coaching that helps young players love the game and keep getting better.',
    intro: 'Weekly development groups, an academy pathway, holiday camps and tours across Westbrook and Ashby Vale. Qualified, DBS-checked coaches and small groups.',
    facts: [['Players coached each week', '180+'], ['Qualified coaches', '8'], ['Venues', '3'], ['Free first session', 'Every group']],
    ageGroups: ['U8', 'U9/10', 'U11', 'U12', 'U13/14', 'Years 3-6 (after school)', 'Not sure yet']
  };

  /* Offer rows: { session } takes age, day, time, venue and price from the
     Session; otherwise the row carries its own details. */
  D.publicOffers = [
    { id: 'trials', title: 'Trials', icon: 'whistle', kicker: 'Start here',
      summary: 'Try any evening group for free before you join. No commitment and no kit needed.',
      body: 'Every player starts with a free trial session in their age group. A coach meets you at the gate, your child joins the group, and we follow up the next day with how it went and the options to join.',
      rows: [{ session: 'SES-01', trial: true }, { session: 'SES-02', trial: true }, { session: 'SES-03', trial: true }, { session: 'SES-04', trial: true }] },
    { id: 'academy', title: 'Academy', icon: 'star', kicker: 'Weekly coaching',
      summary: 'Development Centre, TDC and Academy groups from U8 to U14, every week of term.',
      body: 'Our weekly groups follow one coaching framework from U8 up. Players work on the ball, decision making and confidence, with written feedback each half term. Billed monthly; pause or cancel with a month’s notice.',
      rows: [{ session: 'SES-01' }, { session: 'SES-02' }, { session: 'SES-03' }, { session: 'SES-04' }] },
    { id: 'tours', title: 'Tours', icon: 'venue', kicker: 'Travel and play',
      summary: 'An Easter football tour for U12 to U14 players, with matches against club sides.',
      body: 'Four days of matches, training and team time with our coaches. Places are limited and held with a deposit; the balance is due eight weeks before travel.',
      rows: [{ name: 'Easter tour 2027', who: 'U12 to U14 (Years 7-9)', when: 'Fri 2 to Mon 5 Apr 2027', venue: 'Easter tour, Netherlands', price: 49500, period: 'per player · £100 deposit' }] },
    { id: 'events', title: 'Events', icon: 'calendar', kicker: 'Holiday camps',
      summary: 'Half-term camps and a Christmas festival, open to members and non-members.',
      body: 'Camps run 9:30 to 15:00 with a mix of skills, small-sided games and a tournament on the last day. Book single days or the three-day package; siblings get 10% off.',
      rows: [
        { who: 'Ages 5 to 13', when: 'Mon 26 to Wed 28 Oct · 9:30–15:00', venue: 'northgate', price: 3000, period: 'per day' },
        { who: 'Ages 5 to 13', when: 'Mon 26 to Wed 28 Oct · 9:30–15:00', venue: 'northgate', price: 8000, period: '3-day package' },
        { name: 'Christmas festival', who: 'U8 to U12', when: 'Sat 12 Dec · 10:00–13:00', venue: 'northgate', price: 1500, period: 'per player' }] },
    { id: 'general', title: 'General', icon: 'users', kicker: 'Schools and 1-to-1',
      summary: 'After-school clubs through local schools and one-to-one coaching on request.',
      body: 'We run after-school clubs and PE support for local primary schools; schools book these with us directly. One-to-one sessions are arranged around the player’s week.',
      rows: [
        { session: 'SES-06', schoolLed: true },
        { name: 'One-to-one coaching', who: 'Any age', when: 'By arrangement, weekdays after 16:00', venue: 'northgate', price: 3500, period: 'per hour' }] }
  ];
  var DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function offerRow(r) {
    if (!r.session) return { who: r.who, when: r.when, venue: db.venueName(r.venue) || r.venue, price: r.price, period: r.period, name: r.name || '' };
    var s = db.getSession(r.session);
    var when = s.days.map(function (d) { return DOW[d]; }).join(' and ') + 's · ' + s.start + '–' + s.end;
    if (r.trial) return { name: s.name, who: s.ageGroup, when: when, venue: db.venueName(s.venue), price: 0, period: 'free first session', session: s.id };
    if (r.schoolLed) return { name: s.name, who: s.ageGroup, when: when, venue: db.venueName(s.venue), price: null, period: 'Booked through your school', session: s.id };
    return { name: s.name, who: s.ageGroup, when: when, venue: db.venueName(s.venue), price: s.price, period: 'a month', session: s.id };
  }

  /* ---------- Trial Interest leads ---------- */
  D.trialLeads = [
    { id: 'LEAD-014', parent: 'Bethany Cross', email: 'bethany.cross@example.com', phone: '07700 900611', child: 'Reuben Cross', ageGroup: 'U8', offer: 'trials', message: 'Reuben is 7 and has never played in a club. Is that OK?', status: 'New', at: '2026-10-01T09:12', notes: [], history: [{ text: 'Submitted on the public site', who: 'Bethany Cross', at: '2026-10-01T09:12' }] },
    { id: 'LEAD-013', parent: 'Martin Oyelaran', email: 'm.oyelaran@example.com', phone: '07700 900612', child: 'Tobi Oyelaran', ageGroup: 'U12', offer: 'academy', message: 'Plays for a Sunday team, looking for extra coaching.', status: 'New', at: '2026-09-30T20:41', notes: [], history: [{ text: 'Submitted on the public site', who: 'Martin Oyelaran', at: '2026-09-30T20:41' }] },
    { id: 'LEAD-012', parent: 'Fiona Garside', email: 'fiona.garside@example.com', phone: '07700 900613', child: 'Esme Garside', ageGroup: 'U9/10', offer: 'trials', message: '', status: 'Contacted', at: '2026-09-28T18:05', notes: [{ text: 'Called, prefers a Thursday. Sent trial dates.', by: 'Sam Okafor', at: '2026-09-29T10:20' }], history: [{ text: 'Submitted on the public site', who: 'Fiona Garside', at: '2026-09-28T18:05' }, { text: 'Status changed to Contacted', who: 'Sam Okafor', at: '2026-09-29T10:20' }] },
    { id: 'LEAD-011', parent: 'Claire Dawson', email: 'claire.dawson@example.com', phone: '07700 900207', child: 'Mia Dawson', ageGroup: 'U8', offer: 'trials', message: 'Mia’s friend Ava goes on Thursdays.', status: 'Booked', at: '2026-09-17T21:30', notes: [{ text: 'Trial booked for 24 Sep and 1 Oct (TRL-01).', by: 'Sam Okafor', at: '2026-09-18T20:11' }], history: [{ text: 'Submitted on the public site', who: 'Claire Dawson', at: '2026-09-17T21:30' }, { text: 'Status changed to Booked', who: 'Sam Okafor', at: '2026-09-18T20:11' }] },
    { id: 'LEAD-010', parent: 'Graham Pilling', email: 'g.pilling@example.com', phone: '07700 900614', child: 'Archie Pilling', ageGroup: 'U13/14', offer: 'tours', message: 'Interested in the Easter tour only.', status: 'Declined', at: '2026-09-12T12:44', declineReason: 'Tour is for current members; offered a trial instead and the family said no thanks.', notes: [], history: [{ text: 'Submitted on the public site', who: 'Graham Pilling', at: '2026-09-12T12:44' }, { text: 'Status changed to Declined', who: 'Josh Evans', at: '2026-09-14T09:05' }] }
  ];
  D.leadStatuses = ['New', 'Contacted', 'Booked', 'Declined'];

  /* ---------- Staff sign-ups (coach and management) ---------- */
  D.coachSignups = [
    { id: 'CSU-07', name: 'Rhys Calloway', email: 'rhys.calloway@example.com', phone: '07700 900621', role: 'Coach', at: '2026-09-29T19:40', status: 'Pending', qualification: 'FA Introduction to Coaching Football', dbs: 'Enhanced DBS on the update service', experience: 'Two seasons assistant coaching an U10 Sunday side.', heard: 'Recommended by Jack Morgan' },
    { id: 'CSU-06', name: 'Leah Brannigan', email: 'leah.brannigan@example.com', phone: '07700 900622', role: 'Coach', at: '2026-09-02T08:15', status: 'Approved', outcome: 'Started a trial period', decidedBy: 'Josh Evans', decidedAt: '2026-09-03T09:30', qualification: 'UEFA C (in progress)', dbs: 'Enhanced DBS applied for', experience: 'Primary teaching assistant, runs a lunchtime club.', heard: 'Public site' },
    { id: 'CSU-05', name: 'Dean Whitlock', email: 'dean.whitlock@example.com', phone: '07700 900623', role: 'Management', at: '2026-08-21T22:02', status: 'Declined', declineReason: 'Not a member of staff. Management access is only given to office staff.', decidedBy: 'Josh Evans', decidedAt: '2026-08-22T08:40', qualification: '—', dbs: '—', experience: 'Parent volunteer.', heard: 'Public site' }
  ];

  /* ---------- Trial coaches: a coach on a trial period ---------- */
  D.trialCoaches = [
    { id: 'TCO-03', name: 'Leah Brannigan', email: 'leah.brannigan@example.com', from: '2026-09-07', to: '2026-10-05', status: 'On trial', sessions: 7, shadowing: 'charlie', feedback: 'Good rapport with the U8s, organised. Needs more confidence leading the warm-up.', feedbackBy: 'Charlie Hughes', feedbackAt: '2026-09-30T19:10', history: [{ text: 'Trial period started (4 weeks)', who: 'Josh Evans', at: '2026-09-03T09:30' }] },
    { id: 'TCO-02', name: 'Owen Pryce', email: 'owen.pryce@example.com', from: '2026-09-14', to: '2026-10-26', status: 'On trial', sessions: 4, shadowing: 'david', feedback: 'Strong technically. Missed one session without notice.', feedbackBy: 'David Cole', feedbackAt: '2026-09-24T20:05', history: [{ text: 'Trial period started (6 weeks)', who: 'Josh Evans', at: '2026-09-11T11:00' }] },
    { id: 'TCO-01', name: 'Marcus Bell', email: 'marcus@example.com', from: '2025-09-01', to: '2025-10-13', status: 'Approved', sessions: 12, shadowing: 'david', feedback: 'Ready to lead a group.', feedbackBy: 'David Cole', feedbackAt: '2025-10-10T18:00', decidedBy: 'Josh Evans', decidedAt: '2025-10-13T09:00', outcome: 'Approved as a full coach', history: [{ text: 'Trial period started (6 weeks)', who: 'Josh Evans', at: '2025-08-28T10:00' }, { text: 'Approved as a full coach', who: 'Josh Evans', at: '2025-10-13T09:00' }] }
  ];

  /* ---------- Parent claims ---------- */
  D.parentClaims = [
    { id: 'CLM-04', parent: 'Paul Moss', email: 'paul.moss@example.com', child: 'Harry Moss', dob: '2017-02-17', player: 'PLY-0013', outcome: 'Needs review', status: 'Pending', at: '2026-09-30T21:14',
      checks: [
        { label: 'Child name', ok: true, detail: 'Harry Moss matches PLY-0013' },
        { label: 'Date of birth', ok: false, detail: 'Entered 17 Feb 2017; on file 11 Feb 2017 (looks like a typo)' },
        { label: 'Parent email', ok: false, detail: 'paul.moss@example.com is not on the Moss family' }],
      why: 'Only the child’s name matched. A name on its own is never enough to link a parent to a player, so a person checks before anyone sees Harry’s details.' },
    { id: 'CLM-03', parent: 'Sarah Whitfield', email: 'sarah.whitfield@example.com', child: 'Isla Whitfield', dob: '2018-11-02', player: 'PLY-0002', outcome: 'Matched', status: 'Approved', at: '2026-03-12T10:02', decidedBy: 'Automatic match', decidedAt: '2026-03-12T10:02',
      checks: [{ label: 'Child name', ok: true, detail: 'Isla Whitfield' }, { label: 'Date of birth', ok: true, detail: '2 Nov 2018' }, { label: 'Parent email', ok: true, detail: 'On the Whitfield family' }],
      why: 'Name, date of birth and parent email all matched, so the link was made straight away.' },
    { id: 'CLM-02', parent: 'Jo Lane', email: 'jo.lane@example.com', child: 'Ruby Lane', dob: '2016-08-25', player: 'PLY-0008', outcome: 'Needs review', status: 'Declined', at: '2026-06-03T19:30', decidedBy: 'Josh Evans', decidedAt: '2026-06-04T09:12', declineReason: 'Gareth Lane confirmed Jo is not a parent or guardian. Family asked us not to link.',
      checks: [{ label: 'Child name', ok: true, detail: 'Ruby Lane' }, { label: 'Date of birth', ok: true, detail: '25 Aug 2016' }, { label: 'Parent email', ok: false, detail: 'Not on the Lane family' }],
      why: 'Name and date of birth matched but the email is new to the family, so a person checks with the family first.' }
  ];

  /* ---------- Sign-up journey state (this browser tab only) ---------- */
  D.pubAccount = { role: 'Parent', name: '', email: '' };
  D.pubSignup = { first: '', last: '', dob: '', email: '', result: null };
  D.pubInterest = {};
  D.signupExamples = [
    { id: 'matched', label: 'Matched', first: 'Alfie', last: 'Whitfield', dob: '2016-05-14', email: 'sarah.whitfield@example.com', note: 'Name, date of birth and parent email all match.' },
    { id: 'created', label: 'Created', first: 'Poppy', last: 'Hartley', dob: '2019-03-02', email: 'amy.hartley@example.com', note: 'No player matches, so a new one is created.' },
    { id: 'review', label: 'Needs review', first: 'Oscar', last: 'Bennett', dob: '2016-03-04', email: 'tom.bennett@example.com', note: 'Name and date of birth match, but the email is new to the family.' }
  ];
  D.demoAccounts = [
    { role: 'Parent', email: 'sarah.whitfield@example.com', route: 'parent-home' },
    { role: 'Coach', email: 'jack@example.com', route: 'coach-home' },
    { role: 'Management', email: 'david@example.com', route: 'mgmt-home' }
  ];

  /* ---------- Read helpers ---------- */
  db.getPublicSite = function () { return D.publicSite; };
  db.getPublicOffers = function () { return D.publicOffers; };
  db.getPublicOffer = function (id) { return by(D.publicOffers, id); };
  db.getOfferRows = function (id) { var o = by(D.publicOffers, id); return o ? o.rows.map(offerRow) : []; };
  /* Lowest paid price for the "from" line on an offer card */
  db.getOfferFrom = function (id) {
    var rows = db.getOfferRows(id), paid = rows.filter(function (r) { return r.price > 0; });
    if (rows.some(function (r) { return r.price === 0; })) return { price: 0, period: 'free first session' };
    if (!paid.length) return null;
    var low = paid.reduce(function (a, b) { return b.price < a.price ? b : a; });
    return { price: low.price, period: low.period };
  };
  db.getAgeGroups = function () { return D.publicSite.ageGroups; };
  db.getSignupExamples = function () { return D.signupExamples; };
  db.getDemoAccounts = function () { return D.demoAccounts; };
  db.getPubAccount = function () { return D.pubAccount; };
  db.setPubAccount = function (a) { return Object.assign(D.pubAccount, a); };
  db.getPubSignup = function () { return D.pubSignup; };
  db.setPubSignup = function (s) { return Object.assign(D.pubSignup, s); };
  db.getInterestSent = function (key) { return D.pubInterest[key] ? db.getLead(D.pubInterest[key]) : null; };
  db.clearInterestSent = function (key) { delete D.pubInterest[key]; };

  /* Trial Interest leads */
  db.getLeads = function (status) { return D.trialLeads.filter(function (l) { return !status || l.status === status; }); };
  db.getLead = function (id) { return by(D.trialLeads, id); };
  db.getLeadStatuses = function () { return D.leadStatuses; };
  db.getNewLeads = function () { return db.getLeads('New'); };
  db.addLead = function (l, key) {
    var n = D.trialLeads.reduce(function (m, x) { return Math.max(m, +x.id.slice(5)); }, 0) + 1;
    l.id = 'LEAD-' + String(n).padStart(3, '0'); l.status = 'New'; l.notes = []; l.history = [{ text: 'Submitted on the public site', who: l.parent, at: l.at }];
    D.trialLeads.unshift(l);
    if (key) D.pubInterest[key] = l.id;
    return l;
  };
  db.setLeadStatus = function (id, status, who, at, reason) {
    var l = db.getLead(id); l.status = status; if (reason) l.declineReason = reason;
    l.history.push({ text: 'Status changed to ' + status, who: who, at: at, detail: reason || '' });
    return l;
  };
  db.addLeadNote = function (id, text, who, at) { var l = db.getLead(id); l.notes.push({ text: text, by: who, at: at }); return l; };

  /* Staff sign-ups */
  db.getCoachSignups = function () { return D.coachSignups; };
  db.getCoachSignup = function (id) { return by(D.coachSignups, id); };
  db.getPendingCoachSignups = function () { return D.coachSignups.filter(function (s) { return s.status === 'Pending'; }); };
  db.addCoachSignup = function (s) {
    s.id = 'CSU-' + String(D.coachSignups.length + 5).padStart(2, '0'); s.status = 'Pending';
    D.coachSignups.unshift(s); return s;
  };
  db.findSignupByEmail = function (email) { return D.coachSignups.filter(function (s) { return s.email.toLowerCase() === String(email).toLowerCase(); })[0]; };
  /* mode: 'coach' approves straight to a coach; 'trial' starts a trial period */
  db.approveCoachSignup = function (id, mode, weeks, who, at) {
    var s = db.getCoachSignup(id); s.status = 'Approved'; s.decidedBy = who; s.decidedAt = at;
    if (mode === 'trial') {
      s.outcome = 'Started a trial period';
      D.trialCoaches.unshift({ id: 'TCO-' + String(D.trialCoaches.length + 1).padStart(2, '0'), name: s.name, email: s.email, from: K.addDays(K.today, 4), to: K.addDays(K.today, 4 + weeks * 7), status: 'On trial', sessions: 0, shadowing: 'charlie', feedback: '', history: [{ text: 'Trial period started (' + weeks + ' weeks)', who: who, at: at }] });
    } else s.outcome = s.role === 'Management' ? 'Given Management access' : 'Approved as a coach';
    return s;
  };
  db.declineCoachSignup = function (id, reason, who, at) { var s = db.getCoachSignup(id); s.status = 'Declined'; s.declineReason = reason; s.decidedBy = who; s.decidedAt = at; return s; };

  /* Trial coaches */
  db.getTrialCoaches = function (status) { return D.trialCoaches.filter(function (t) { return !status || t.status === status; }); };
  db.getTrialCoach = function (id) { return by(D.trialCoaches, id); };
  db.getActiveTrialCoaches = function () { return db.getTrialCoaches('On trial'); };
  /* Trials ending within 7 days: worth a Needs Attention case */
  db.getTrialCoachesEndingSoon = function () { return db.getActiveTrialCoaches().filter(function (t) { return K.daysBetween(K.today, t.to) <= 7; }); };
  db.approveTrialCoach = function (id, who, at) { var t = db.getTrialCoach(id); t.status = 'Approved'; t.outcome = 'Approved as a full coach'; t.decidedBy = who; t.decidedAt = at; t.history.push({ text: 'Approved as a full coach', who: who, at: at }); return t; };
  db.extendTrialCoach = function (id, days, who, at) { var t = db.getTrialCoach(id), old = t.to; t.to = K.addDays(t.to, days); t.history.push({ text: 'Trial extended by ' + days / 7 + ' weeks', detail: 'End date ' + K.dm(old) + ' → ' + K.dm(t.to), who: who, at: at }); return t; };
  db.endTrialCoach = function (id, reason, who, at) { var t = db.getTrialCoach(id); t.status = 'Ended'; t.outcome = 'Trial ended'; t.endReason = reason; t.decidedBy = who; t.decidedAt = at; t.history.push({ text: 'Trial ended', detail: reason, who: who, at: at }); return t; };

  /* Parent claims */
  db.getParentClaims = function () { return D.parentClaims; };
  db.getParentClaim = function (id) { return by(D.parentClaims, id); };
  db.getPendingClaims = function () { return D.parentClaims.filter(function (c) { return c.status === 'Pending'; }); };
  db.approveClaim = function (id, who, at) {
    var c = db.getParentClaim(id), pl = db.getPlayer(c.player), fam = db.getFamily(pl.family);
    var pid = 'PAR-' + String(D.parents.length + 1).padStart(2, '0');
    db.addParent({ id: pid, name: c.parent, email: c.email, phone: '', relationship: 'Parent', family: fam.id, priority: fam.parents.length + 1, link: { method: 'Parent claim approved by ' + who, verifiedAt: at, invite: 'Verified', ended: null } });
    fam.parents.push(pid);
    c.status = 'Approved'; c.decidedBy = who; c.decidedAt = at; c.linkedParent = pid;
    return c;
  };
  db.declineClaim = function (id, reason, who, at) { var c = db.getParentClaim(id); c.status = 'Declined'; c.declineReason = reason; c.decidedBy = who; c.decidedAt = at; return c; };

  /* Parent sign-up matching. Rules: a link is only made automatically when
     the child's name, date of birth AND the parent's email all match.
     A partial match goes to a person (Needs review). Name alone never
     links. No match at all creates a new player. */
  function norm(s) { return String(s || '').trim().toLowerCase(); }
  db.matchChild = function (q) {
    var name = norm(q.first) + ' ' + norm(q.last), email = norm(q.email);
    var byName = D.players.filter(function (p) { return norm(p.name) === name; });
    var byDob = D.players.filter(function (p) { return p.dob === q.dob && norm(p.last) === norm(q.last); });
    var cand = byName[0] || byDob[0];
    if (!cand) return { outcome: 'Created', checks: [{ label: 'Child name', ok: false, detail: 'No player with this name' }, { label: 'Date of birth', ok: false, detail: 'No player with this date of birth and surname' }], why: 'Nothing matched an existing player, so a new player is created and linked to you.' };
    var famEmails = db.getFamilyParents(cand.family).map(function (p) { return norm(p.email); });
    var okName = norm(cand.name) === name, okDob = cand.dob === q.dob, okEmail = famEmails.indexOf(email) >= 0;
    var checks = [
      { label: 'Child name', ok: okName, detail: okName ? cand.name + ' matches ' + cand.id : 'Differs from the player on file' },
      { label: 'Date of birth', ok: okDob, detail: okDob ? K.d(q.dob) : 'Entered ' + K.d(q.dob) + '; on file differs' },
      { label: 'Parent email', ok: okEmail, detail: okEmail ? 'On the ' + db.getFamily(cand.family).surname + ' family' : q.email + ' is not on this family' }];
    if (okName && okDob && okEmail) return { outcome: 'Matched', player: cand.id, checks: checks, why: 'Name, date of birth and parent email all matched, so you are linked straight away.' };
    var why = okName && !okDob && !okEmail ? 'Only the child’s name matched. A name on its own is never enough to link a parent to a child, so a person checks first.'
      : 'Some details matched and some did not. To keep children’s details safe, a person checks before anything is linked.';
    return { outcome: 'Needs review', player: cand.id, checks: checks, why: why };
  };
  db.applySignup = function (q, res, who, at) {
    if (res.outcome === 'Created') {
      var n = D.players.length + 1, fid = 'FAM-' + String(D.families.length + 1).padStart(2, '0');
      db.addFamily({ id: fid, name: q.last + ' family', surname: q.last, status: 'Active', reviewDue: '2027-03-01', closureReason: null, credits: [], requests: [], parents: [] });
      var pid = 'PAR-' + String(D.parents.length + 1).padStart(2, '0');
      db.addParent({ id: pid, name: who, email: q.email, phone: '', relationship: 'Parent', family: fid, priority: 1, link: { method: 'Created at sign-up', verifiedAt: at, invite: 'Verified', ended: null } });
      db.getFamily(fid).parents.push(pid);
      var pl = db.addPlayer({ id: 'PLY-' + String(n).padStart(4, '0'), first: q.first, last: q.last, name: q.first + ' ' + q.last, dob: q.dob, family: fid, ageGroup: '', school: '', year: '', address: '', medical: 'not_confirmed', medicalDetail: '', support: 'none', supportDetail: '', photo: 'unknown', status: 'New', emergency: [], joined: K.today });
      res.player = pl.id; res.family = fid;
    } else if (res.outcome === 'Needs review') {
      var c = { id: 'CLM-' + String(D.parentClaims.length + 2).padStart(2, '0'), parent: who, email: q.email, child: q.first + ' ' + q.last, dob: q.dob, player: res.player, outcome: 'Needs review', status: 'Pending', at: at, checks: res.checks, why: res.why };
      D.parentClaims.unshift(c); res.claim = c.id;
    }
    return res;
  };

  /* Sign in: finds the right hub for an email */
  db.signIn = function (email) {
    var e = norm(email);
    var su = db.findSignupByEmail(e);
    if (su && su.status === 'Pending') return { route: 'pub-waiting', name: su.name, pending: true };
    var mgmt = ['david@example.com', 'josh@example.com'];
    var coach = db.getCoaches().filter(function (c) { return norm(c.email) === e; })[0];
    if (mgmt.indexOf(e) >= 0) return { route: 'mgmt-home', name: coach.name };
    if (coach) return { route: 'coach-home', name: coach.name };
    var par = db.getParents().filter(function (p) { return norm(p.email) === e; })[0];
    if (par) return { route: 'parent-home', name: par.name };
    return null;
  };

  /* Approval counts for the More menu and the approvals hub */
  db.getApprovalCounts = function () {
    return { coachSignups: db.getPendingCoachSignups().length, trialCoaches: db.getActiveTrialCoaches().length, parentClaims: db.getPendingClaims().length, trialLeads: db.getNewLeads().length };
  };
  /* Keep the shared approvals list (Coach sign-ups 1, Parent claims 1) live */
  (D.approvals || []).forEach(function (a) {
    var f = { 'coach-signups': db.getPendingCoachSignups, 'parent-claims': db.getPendingClaims }[a.id];
    if (f) Object.defineProperty(a, 'count', { get: function () { return f().length; }, set: function () {}, enumerable: true, configurable: true });
  });
  /* Recent approval decisions across all four tools, newest first */
  db.getApprovalLog = function () {
    var out = [];
    D.coachSignups.forEach(function (s) { if (s.decidedAt) out.push({ text: s.name + ': coach sign-up ' + s.status.toLowerCase(), detail: s.outcome || s.declineReason || '', who: s.decidedBy, at: s.decidedAt, tone: s.status === 'Approved' ? 'ok' : 'danger' }); });
    D.parentClaims.forEach(function (c) { if (c.decidedAt && c.decidedBy !== 'Automatic match') out.push({ text: c.parent + ' → ' + c.child + ': claim ' + c.status.toLowerCase(), detail: c.declineReason || '', who: c.decidedBy, at: c.decidedAt, tone: c.status === 'Approved' ? 'ok' : 'danger' }); });
    D.trialCoaches.forEach(function (t) { t.history.slice(1).forEach(function (h) { out.push({ text: t.name + ': ' + h.text.toLowerCase(), detail: h.detail || '', who: h.who, at: h.at, tone: 'info' }); }); });
    D.trialLeads.forEach(function (l) { l.history.slice(1).forEach(function (h) { out.push({ text: l.child + ' (trial interest): ' + h.text.toLowerCase(), detail: h.detail || '', who: h.who, at: h.at }); }); });
    return out.sort(function (a, b) { return a.at < b.at ? 1 : -1; });
  };
})();
