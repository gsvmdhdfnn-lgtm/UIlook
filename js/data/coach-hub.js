/* Coach hub mock data and helpers (pass 12). The signed-in coach depends on
   the prototype bar's Coach role switch:
     lead     → Charlie Hughes (Lead Coach, COA-003)
     coach    → Jack Morgan (Coach, COA-004)
     learning → Ellie Shaw (Learning Coach, COA-006)
   Everything here composes the shared data (schedule, coaching, development,
   finance) through existing Hub.db helpers; the few coach-hub-only bits
   (session notes, profile extras, per-coach notifications, messages to
   families) live in D.coachHub. All invented.
   Seeded on purpose, through the shared cover helpers:
   - Priya Nair is away on Fri 2 Oct; Jack Morgan covers Northgate
     After-School (a client session, so its register is a headcount).
   - David Cole offered the coach-less U13/14 Development on Fri 2 Oct to
     Jack Morgan and Charlie Hughes (first to accept). */
(function () {
  var D = Hub.data, db = Hub.db, K = Hub.kit;
  function pick(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }
  function hours(o) { var a = o.start.split(':'), b = o.end.split(':'); return ((+b[0] * 60 + +b[1]) - (+a[0] * 60 + +a[1])) / 60; }
  var NOW = '2026-10-01T14:10';

  var H = D.coachHub = {
    signedIn: { lead: 'charlie', coach: 'jack', learning: 'ellie' },
    notes: {},
    messages: [],
    profile: {
      charlie: { preferredName: 'Charlie', emergency: 'Sam Hughes (partner) · 07700 900611', kit: 'Large', bio: 'UEFA C. Leads the U9/10 group and assists the U12 Academy on Thursdays.', updatedBy: 'Charlie Hughes', updatedAt: '2026-09-02T20:10' },
      jack: { preferredName: 'Jack', emergency: 'Helen Morgan (mother) · 07700 900612', kit: 'Medium', bio: 'FA Level 2. Leads U8 Development and helps with school cover.', updatedBy: 'Jack Morgan', updatedAt: '2026-08-30T18:45' },
      ellie: { preferredName: 'Ellie', emergency: 'Tom Shaw (father) · 07700 900613', kit: 'Small', bio: 'On placement from Westbrook College (Sport Coaching, Year 2).', updatedBy: 'Ellie Shaw', updatedAt: '2026-07-01T10:30' }
    },
    profileHistory: [],
    summaries: [],
    notifications: [],
    saved: { charlie: ['RES-002'], jack: ['RES-001'] },
    questions: [
      { id: 'ASK-01', coach: 'charlie', text: 'Can we have a second set of bibs kept at Northgate?', by: 'Charlie Hughes', at: '2026-09-24T21:10', answer: { text: 'Ordered: a set of 20 arrives on Monday and lives in the astro store.', by: 'Sam Okafor', at: '2026-09-25T10:02' } },
      { id: 'ASK-02', coach: 'jack', text: 'Is the back astro booked for U8 until half term?', by: 'Jack Morgan', at: '2026-09-30T21:12', answer: null },
      { id: 'ASK-03', coach: 'ellie', text: 'Which week is my placement observation?', by: 'Ellie Shaw', at: '2026-09-28T18:40', answer: { text: 'Thursday 15 October with David, at U8 Development.', by: 'David Cole', at: '2026-09-29T09:25' } }
    ]
  };

  /* ---------- Seeded cover, through the shared cover helpers ---------- */
  var ngFri = db.findOccurrence('SES-06', '2026-10-02');
  if (ngFri && db.addCoverRequest) {
    var pr = db.addCoverRequest({ coach: 'priya', kind: 'Unavailable', from: '2026-10-02', to: '2026-10-02', reason: 'Supervising a Year 6 school trip' }, 'Priya Nair', '2026-09-29T16:40');
    var pn = pr.needs[0];
    if (pn) {
      var po = db.sendCoverOffer(pr.id, pn.id, 'jack', 'David Cole', '2026-09-29T17:05');
      db.respondCoverOffer(pr.id, pn.id, po.id, 'Accepted', 'Happy to, I finish at Westbrook at 15:15', '2026-09-29T18:20');
      db.confirmCover(pr.id, pn.id, 'David Cole', '2026-09-29T18:45');
    }
  }
  var u13 = db.findOccurrence('SES-04', '2026-10-02');
  var noCoach = u13 && db.getCoverRequests(function (r) { return r.needs.some(function (n) { return n.occurrence === u13.id; }) && r.kind === 'No coach'; })[0];
  if (noCoach) {
    db.addAvailabilityException({ coach: 'charlie', type: 'Different hours', from: '2026-10-02', to: '2026-10-02', start: '17:00', end: '21:00', reason: 'Free this Friday evening if cover is needed', by: 'Charlie Hughes', at: '2026-10-01T12:05' });
    db.sendCoverOffer(noCoach.id, noCoach.needs[0].id, 'jack', 'David Cole', '2026-10-01T12:30');
    db.sendCoverOffer(noCoach.id, noCoach.needs[0].id, 'charlie', 'David Cole', '2026-10-01T12:31');
  }

  /* ---------- Per-coach notifications (the shared coach list is merged in) ---------- */
  var incReg = db.findOccurrence('SES-03', '2026-09-24');
  H.globalOwner = { 'NTF-101': 'charlie' };
  H.notifications = [
    { id: 'CHN-01', coach: 'charlie', title: 'Cover offered to you', body: 'U13/14 Development, Fri 2 Oct, 18:00 at Hollins Park School. First to accept.', route: 'coach-cover', at: '2026-10-01T12:31', read: false },
    { id: 'CHN-02', coach: 'charlie', title: 'Register still open', body: 'U12 Academy, Thu 24 Sep: four players marked, the rest still to do.', route: incReg ? 'coach-register/' + incReg.id : 'coach-schedule', at: '2026-09-25T08:00', read: false },
    { id: 'CHN-03', coach: 'charlie', title: 'September work summary confirmed', body: 'You confirmed it; the office finalises it for the 7 Oct payment.', route: 'coach-work-summary', at: '2026-10-01T08:12', read: true, readAt: '2026-10-01T08:12' },
    { id: 'CHN-11', coach: 'jack', title: 'Your Enhanced DBS expires on 13 Oct', body: 'Upload the new certificate so the office can verify it before then.', route: 'coach-documents', at: '2026-09-13T08:00', read: false },
    { id: 'CHN-12', coach: 'jack', title: 'Cover offered to you', body: 'U13/14 Development, Fri 2 Oct, 18:00 at Hollins Park School. First to accept.', route: 'coach-cover', at: '2026-10-01T12:30', read: false },
    { id: 'CHN-13', coach: 'jack', title: 'Cover confirmed', body: 'You are on Northgate After-School, Fri 2 Oct, 15:45, covering Priya Nair.', route: ngFri ? 'coach-session/' + ngFri.id : 'coach-schedule', at: '2026-09-29T18:45', read: true, readAt: '2026-09-29T19:02' },
    { id: 'CHN-14', coach: 'jack', title: 'September work summary finalised', body: 'Exported for the 7 Oct coach payment.', route: 'coach-work-summary', at: '2026-10-01T09:40', read: true, readAt: '2026-10-01T10:05' },
    { id: 'CHN-21', coach: 'ellie', title: 'Feedback sent for sign-off', body: 'Ava Price: your lead coach signs it off before the office reviews it.', route: 'coach-feedback/PLY-0003', at: '2026-09-30T17:55', read: true, readAt: '2026-09-30T17:56' },
    { id: 'CHN-22', coach: 'ellie', title: 'Temporary role from 5 Oct', body: 'You act as a Coach on U8 Development from 5 to 30 Oct for your placement assessment.', route: 'coach-profile', at: '2026-09-29T09:20', read: false },
    { id: 'CHN-23', coach: 'ellie', title: 'September summary ready to check', body: 'Learning placement: expenses only, so the total is £0.00.', route: 'coach-work-summary', at: '2026-10-01T06:00', read: false }
  ];

  /* ---------- Session notes from coaches ---------- */
  var u8today = db.findOccurrence('SES-01', '2026-10-01');
  if (u8today) H.notes[u8today.id] = [{ id: 'SNT-01', text: 'Bring the small goals: the back astro has none set out this week.', by: 'Jack Morgan', at: '2026-09-30T21:05' }];
  var u910today = db.findOccurrence('SES-02', '2026-10-01');
  if (u910today) H.notes[u910today.id] = [{ id: 'SNT-02', text: 'Theme: receiving to play forward. Charlie runs the rondo block.', by: 'David Cole', at: '2026-09-30T19:30' }];

  /* =========================== Read helpers =========================== */
  /* The signed-in coach for the current Coach role switch */
  db.getSignedInCoachKey = function () { var r = K.viewer().coachRole || 'lead'; return H.signedIn[r] || 'charlie'; };
  db.getSignedInCoach = function () { return db.getCoach(db.getSignedInCoachKey()); };
  /* Permissions for the signed-in role (from Session roles in Management) */
  db.getHubRole = function () { return db.getRole(K.viewer().coachRole || 'lead'); };
  db.hubCan = function (perm) { var r = db.getHubRole(); return !!(r && r.perms[perm]); };

  function onStaff(o, coach) { return o.staff.filter(function (s) { return s.coach === coach; })[0]; }
  db.getMyStaffEntry = function (o, coach) { return o ? onStaff(o, coach || db.getSignedInCoachKey()) : null; };
  db.occHours = hours;
  /* Occurrences the coach is on (including ones they are unavailable for) */
  db.getMyOccurrences = function (coach, o) {
    o = o || {};
    return db.getOccurrences(function (x) { return !x.draft && onStaff(x, coach) && (!o.from || x.date >= o.from) && (!o.to || x.date <= o.to); })
      .slice().sort(function (a, b) { return (a.date + a.start) < (b.date + b.start) ? -1 : 1; });
  };
  db.isMyOccurrence = function (coach, id) { var o = db.getOccurrence(id); return !!(o && onStaff(o, coach)); };
  /* Next occurrence still to finish that the coach is working */
  db.getMyNext = function (coach) {
    return db.getMyOccurrences(coach, { from: K.today }).filter(function (o) {
      var s = onStaff(o, coach); return o.status === 'Scheduled' && !(s.unavailable && !s.cover) && (o.date + 'T' + o.end) > NOW;
    })[0] || null;
  };
  db.minutesUntil = function (o) { return Math.round((K.parse(o.date + 'T' + o.start) - K.parse(NOW)) / 60000); };
  db.canTakeRegister = function (o) { return o.date <= K.today && o.status !== 'Cancelled' && o.status !== 'Rescheduled' && o.status !== 'Postponed'; };
  /* Registers due and not completed, for occurrences the coach worked */
  db.getMyOpenRegisters = function (coach) {
    return db.getOutstandingRegisters().filter(function (o) { var s = onStaff(o, coach); return s && !s.unavailable; });
  };
  db.getMyTodayRegisters = function (coach) {
    return db.getMyOccurrences(coach, { from: K.today, to: K.today }).filter(function (o) { var s = onStaff(o, coach); return !s.unavailable && o.status === 'Scheduled' && db.getRegister(o.id).state !== 'Completed'; });
  };

  /* Sessions and players */
  db.getMySessions = function (coach) {
    var seen = {}, out = [];
    db.getAssignments(coach).forEach(function (a) { if (!seen[a.session]) { seen[a.session] = 1; out.push(Object.assign({ sessionObj: db.getSession(a.session) }, a)); } });
    return out;
  };
  /* Players in the coach's sessions (memberships not ended, plus trials) */
  db.getMyPlayers = function (coach) {
    var map = {};
    db.getMySessions(coach).forEach(function (a) {
      db.getSessionMembers(a.session).forEach(function (m) { (map[m.player] = map[m.player] || { sessions: [], states: [] }).sessions.push(a.session); map[m.player].states.push(m.state); });
      db.getTrials().forEach(function (t) { if (t.session === a.session) { (map[t.player] = map[t.player] || { sessions: [], states: [] }).sessions.push(a.session); map[t.player].states.push('Trial'); } });
    });
    return Object.keys(map).sort().map(function (pid) { return { player: db.getPlayer(pid), sessions: map[pid].sessions, states: map[pid].states }; }).filter(function (x) { return x.player; })
      .sort(function (a, b) { return a.player.last + a.player.first < b.player.last + b.player.first ? -1 : 1; });
  };
  db.isMyPlayer = function (coach, pid) { return db.getMyPlayers(coach).some(function (x) { return x.player.id === pid; }); };
  db.getMyPlayerSessions = function (coach, pid) { var x = db.getMyPlayers(coach).filter(function (y) { return y.player.id === pid; })[0]; return x ? x.sessions : []; };

  /* Venues: the ones the coach uses first */
  db.getMyVenues = function (coach) {
    var used = {};
    db.getMyOccurrences(coach, { from: K.addDays(K.today, -28) }).forEach(function (o) { if (o.venue) used[o.venue] = (used[o.venue] || 0) + 1; });
    return db.getVenues().map(function (v) { return { venue: v, uses: used[v.key] || 0 }; }).sort(function (a, b) { return b.uses - a.uses; });
  };

  /* Session notes */
  db.getSessionNotes = function (occId) { return (H.notes[occId] || []).slice().sort(function (a, b) { return a.at < b.at ? 1 : -1; }); };
  db.addSessionNote = function (occId, text, who, at) { var n = { id: 'SNT-' + String(Object.keys(H.notes).reduce(function (k, x) { return k + H.notes[x].length; }, 0) + 1).padStart(2, '0'), text: text, by: who, at: at }; (H.notes[occId] = H.notes[occId] || []).push(n); return n; };

  /* Messages to families of a session (Communications switch) */
  db.getSessionMessages = function (occId) { return H.messages.filter(function (m) { return m.occurrence === occId; }); };
  db.sendSessionMessage = function (occId, subject, body, who, at) {
    var o = db.getOccurrence(occId), players = db.getExpectedPlayers(o), fams = {};
    players.forEach(function (pid) { var p = db.getPlayer(pid); if (p) fams[p.family] = 1; });
    var n = db.addNotice({ title: subject, body: body, audience: 'Parents', sessions: [o.sessionId], status: 'Sent', by: who, at: at });
    var m = { id: n.id, occurrence: occId, subject: subject, body: body, families: Object.keys(fams).length, by: who, at: at };
    H.messages.push(m); return m;
  };

  /* Cover: offers made to the coach, and the coach's own requests */
  db.getCoverOffersFor = function (coach) {
    var out = [];
    db.getCoverRequests().forEach(function (r) {
      r.needs.forEach(function (n) {
        n.offers.forEach(function (f) { if (f.coach === coach) out.push({ request: r, need: n, offer: f, occurrence: db.getOccurrence(n.occurrence) }); });
      });
    });
    return out.sort(function (a, b) { return (a.offer.response ? 1 : 0) - (b.offer.response ? 1 : 0) || (a.occurrence.date < b.occurrence.date ? -1 : 1); });
  };
  db.getPendingCoverOffers = function (coach) { return db.getCoverOffersFor(coach).filter(function (x) { return !x.offer.response && x.need.state !== 'Covered'; }); };
  db.getMyCoverRequests = function (coach) { return db.getCoverRequests(function (r) { return r.coach === coach; }).slice().sort(function (a, b) { return a.from < b.from ? 1 : -1; }); };
  /* Occurrences a new absence would affect (preview before recording it) */
  db.getAbsenceImpact = function (coach, from, to) {
    return db.getOccurrences(function (x) { return x.date >= from && x.date <= to && x.status === 'Scheduled' && x.staff.some(function (s) { return s.coach === coach && !s.unavailable; }); });
  };

  /* Feedback written by a coach */
  db.getMyFeedback = function (coach, pid) { return db.getFeedback(pid, { coach: coach }); };
  db.getOpenFeedback = function (coach, pid) { return db.getMyFeedback(coach, pid).filter(function (f) { return f.status === 'Draft' || f.status === 'Returned'; })[0] || null; };
  db.getMyReturnedFeedback = function (coach) { return db.getFeedback(null, { coach: coach, status: 'Returned' }); };
  db.getMyDraftFeedback = function (coach) { return db.getFeedback(null, { coach: coach, status: 'Draft' }); };
  /* Feedback from learning coaches on sessions this coach leads, not yet signed off */
  db.getFeedbackToSignOff = function (coach) {
    var led = db.getMySessions(coach).filter(function (a) { return a.sessionRole === 'Lead'; }).map(function (a) { return a.session; });
    return db.getFeedback(null, { status: 'Awaiting review' }).filter(function (f) { return f.learning && !f.signedOff && led.indexOf(f.session) >= 0; });
  };
  db.getCurrentFeedbackPeriod = function () { return 'October 2026'; };

  /* Development plan in the open review period */
  db.getMyIdp = function (pid) { var p = db.getCurrentReviewPeriod(); return p ? db.getIdps(pid, p.id)[0] || null : null; };
  db.getPastIdps = function (pid) { var p = db.getCurrentReviewPeriod(); return db.getIdps(pid).filter(function (i) { return !p || i.period !== p.id; }); };

  /* Work summaries: the frozen month if one exists, otherwise built from the
     coach's allocations (salaried and learning placements total £0.00). */
  db.getPayNote = function (coach) {
    var r = db.getCurrentRate(coach), c = db.getCoach(coach);
    if (r && r.note && /Salaried|Learning/.test(r.note)) return r.note;
    if (c && c.type === 'learning') return 'Learning placement: expenses only';
    return '';
  };
  function composeSummary(coach, month, label) {
    var lines = (D.coaching && D.coaching.freeze ? D.coaching.freeze(coach, month) : []);
    var ws = { id: 'WS-' + (951 + H.summaries.length), coach: coach, month: month, label: label, state: 'Awaiting coach', cycle: 1, lines: lines, total: K.sum(lines, 'cost'), frozenAt: '2026-10-01T06:00', frozenBy: 'System', composed: true,
      cycles: [{ n: 1, frozenAt: '2026-10-01T06:00', total: K.sum(lines, 'cost'), events: [{ text: 'Prepared from ' + lines.length + ' allocations and sent to ' + db.coachName(coach), who: 'System', at: '2026-10-01T06:00' }] }] };
    H.summaries.push(ws); return ws;
  }
  db.getMyWorkSummary = function (coach, month) {
    var ws = db.getWorkSummaries(function (w) { return w.coach === coach && w.month === month; })[0] || H.summaries.filter(function (w) { return w.coach === coach && w.month === month; })[0];
    return ws || (month === '2026-09' ? composeSummary(coach, month, 'September 2026') : null);
  };
  /* The month still in progress: live allocations, nothing frozen yet */
  db.getMonthAllocations = function (coach, month) {
    return db.getAllocations(function (a) { return a.coach === coach && a.date.slice(0, 7) === month; }).slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  };
  function findSummary(id) { return db.getWorkSummary(id) || pick(H.summaries, id); }
  function ev(ws, e) { ws.cycles[ws.cycles.length - 1].events.push(e); }
  db.confirmMySummary = function (id, who, at) {
    var ws = findSummary(id); if (!ws) return null;
    if (!ws.composed) return db.coachConfirmSummary(id, at);
    ws.state = 'Ready to finalise'; ws.query = null; ev(ws, { text: 'Confirmed by coach', who: who, at: at, tone: 'ok' }); return ws;
  };
  db.queryMySummary = function (id, text, who, at) {
    var ws = findSummary(id); if (!ws) return null;
    if (!ws.composed) return db.querySummary(id, text, who, at);
    ws.state = 'Queried'; ws.query = { text: text, by: who, at: at }; ev(ws, { text: 'Queried: ' + text, who: who, at: at, tone: 'warn' }); return ws;
  };

  /* Profile extras the coach keeps up to date themselves */
  db.getCoachProfileExtras = function (coach) { return H.profile[coach] || { preferredName: '', emergency: '', kit: '', bio: '' }; };
  db.getCoachProfileHistory = function (coach) { return H.profileHistory.filter(function (h) { return h.coach === coach; }); };
  db.updateCoachProfile = function (coach, patch, who, at) {
    var p = H.profile[coach] = H.profile[coach] || {};
    var changed = Object.keys(patch).filter(function (k) { return patch[k] !== p[k]; });
    Object.assign(p, patch, { updatedBy: who, updatedAt: at });
    if (changed.length) H.profileHistory.unshift({ coach: coach, text: 'Profile updated: ' + changed.join(', '), who: who, at: at });
    return changed;
  };

  /* Notifications: the coach's own plus the shared coach list */
  db.getCoachHubNotifications = function (coach) {
    var shared = db.getNotifications('coach').filter(function (n) { var o = H.globalOwner[n.id]; return !o || o === coach; });
    return H.notifications.filter(function (n) { return n.coach === coach; }).concat(shared).sort(function (a, b) { return a.at < b.at ? 1 : -1; });
  };
  db.getCoachHubUnread = function (coach) { return db.getCoachHubNotifications(coach).filter(function (n) { return !n.read; }).length; };
  db.markCoachNotification = function (id, read, at) {
    var n = pick(H.notifications, id);
    if (!n) return db.markNotificationRead(id, read, at);
    n.read = read !== false; n.readAt = n.read ? at : null; return n;
  };
  db.markAllCoachNotifications = function (coach, at) { db.getCoachHubNotifications(coach).forEach(function (n) { if (!n.read) db.markCoachNotification(n.id, true, at); }); };

  /* Library: resources a coach saved for later */
  db.getSavedResources = function (coach) { return (H.saved[coach] || []).slice(); };
  db.isResourceSaved = function (coach, id) { return (H.saved[coach] || []).indexOf(id) >= 0; };
  db.toggleSavedResource = function (coach, id) { var l = H.saved[coach] = H.saved[coach] || [], i = l.indexOf(id); if (i >= 0) l.splice(i, 1); else l.push(id); return i < 0; };
  /* Questions to the office from Support */
  db.getOfficeQuestions = function (coach) { return H.questions.filter(function (q) { return q.coach === coach; }).sort(function (a, b) { return a.at < b.at ? 1 : -1; }); };
  db.askOffice = function (coach, text, who, at) { var q = { id: 'ASK-' + String(H.questions.length + 1).padStart(2, '0'), coach: coach, text: text, by: who, at: at, answer: null }; H.questions.push(q); return q; };
  /* Needs Attention input: questions from coaches the office has not answered */
  db.getUnansweredCoachQuestions = function () { return H.questions.filter(function (q) { return !q.answer; }); };

  /* =========================== Write helpers ========================== */
  /* Feedback: a coach saves a draft, then submits it for review. A learning
     coach's submission waits for the session lead to sign it off. Nothing is
     visible to parents until Management publishes it. */
  db.saveCoachFeedback = function (o, who, at) {
    var list = D.dev.feedback, f = o.id && pick(list, o.id);
    if (!f) {
      f = { id: 'FBK-' + String(list.length + 1).padStart(4, '0'), player: o.player, coach: o.coach, session: o.session, period: o.period, status: 'Draft', keepDoing: '', focus: '', general: '', ratings: {}, submittedBy: null, submittedAt: null, startedBy: who, startedAt: at, history: [{ text: 'Draft started', who: who, at: at }], returns: [] };
      list.push(f);
    } else f.history.push({ text: 'Draft saved', who: who, at: at });
    ['keepDoing', 'focus', 'general', 'ratings', 'session'].forEach(function (k) { if (o[k] != null) f[k] = o[k]; });
    if (f.status !== 'Returned') f.status = 'Draft';
    f.savedBy = who; f.savedAt = at;
    return f;
  };
  db.submitCoachFeedback = function (id, learning, who, at) {
    var f = pick(D.dev.feedback, id); if (!f) return null;
    f.status = 'Awaiting review'; f.submittedBy = who; f.submittedAt = at; f.learning = !!learning; f.signedOff = null;
    f.history.push({ text: learning ? 'Submitted for review (learning coach: needs sign-off)' : 'Submitted for review', who: who, at: at, tone: 'info' });
    return f;
  };
  db.signOffFeedback = function (id, who, at) {
    var f = pick(D.dev.feedback, id); if (!f) return null;
    f.signedOff = { by: who, at: at }; f.history.push({ text: 'Signed off by the lead coach', who: who, at: at, tone: 'ok' }); return f;
  };
  /* Start a development plan for the open review period */
  db.startIdp = function (pid, coach, who, at) {
    var p = db.getCurrentReviewPeriod(); if (!p) return null;
    var list = D.dev.idps, ex = db.getIdps(pid, p.id)[0]; if (ex) return ex;
    var i = { id: 'IDP-' + String(list.length + 1).padStart(3, '0'), player: pid, period: p.id, coach: coach, status: 'Draft', targets: [], updatedBy: who, updatedAt: at, history: [{ text: 'Plan started for ' + p.name, who: who, at: at }] };
    list.push(i); return i;
  };
})();
