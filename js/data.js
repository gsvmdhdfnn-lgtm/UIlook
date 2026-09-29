/* Mock domain data. Shaped around product concepts (Coach, Session,
   Occurrence, Player, Parent, Attention Case), not storage. Values echo
   the real Hub's demo and TEST data so screens read believably.

   The prototype's clock is fixed at Thursday 1 October 2026, 14:10, so
   "today" always has sessions to show. */
(function () {
  var NOW = new Date(2026, 9, 1, 14, 10);

  var coaches = {
    david: { id: 'david', name: 'David Cole', role: 'Head Coach', email: 'david@example.com' },
    josh: { id: 'josh', name: 'Josh Evans', role: 'Director' },
    charlie: { id: 'charlie', name: 'Charlie Hughes', role: 'Lead Coach' },
    jack: { id: 'jack', name: 'Jack Morgan', role: 'Coach' },
    tom: { id: 'tom', name: 'Tom Reid', role: 'Coach' },
    ellie: { id: 'ellie', name: 'Ellie Shaw', role: 'Learning Coach' }
  };

  var venues = {
    freemens: { name: "City of London Freemen's", area: 'Ashtead, KT21', meetingPoint: 'Astro gate' },
    therfield: { name: 'Therfield School', area: 'Leatherhead' },
    daneshill: { name: 'Daneshill', area: 'Leatherhead' },
    stpeters: { name: "St Peter's School", area: 'Leatherhead' }
  };

  /* Occurrences: dated instances of a Session. */
  function occ(o) { return o; }
  var occurrences = [
    occ({ id: 'o1', session: 'Daneshill Years 5-6', programme: 'Day', ageGroup: 'Years 5-6', date: '2026-10-01', start: '15:30', end: '16:30', venue: 'daneshill', staff: [{ coach: 'tom', lead: true }], players: 16, status: 'ok' }),
    occ({ id: 'o2', session: 'U8 Development', programme: 'Evening', ageGroup: 'U8', date: '2026-10-01', start: '16:30', end: '17:30', venue: 'freemens', staff: [{ coach: 'jack', lead: true }, { coach: 'ellie' }], players: 11, status: 'ok' }),
    occ({ id: 'o3', session: 'U9/10 Development', programme: 'Evening', ageGroup: 'U9/10', date: '2026-10-01', start: '17:30', end: '18:30', venue: 'freemens', staff: [{ coach: 'david', lead: true }, { coach: 'charlie' }], players: 12, status: 'ok', theme: 'Receiving to play forward' }),
    occ({ id: 'o4', session: 'U12 Academy', programme: 'Evening', ageGroup: 'U12', date: '2026-10-01', start: '19:00', end: '20:30', venue: 'freemens', staff: [{ coach: 'david', lead: true }, { coach: 'charlie', unavailable: true }], players: 14, status: 'attention', theme: 'Playing through pressure' }),
    occ({ id: 'o5', session: 'U13/14 Development', programme: 'Evening', ageGroup: 'U13/14', date: '2026-10-02', start: '18:00', end: '19:00', venue: 'therfield', staff: [], players: 15, status: 'attention' }),
    occ({ id: 'o6', session: "St Peter's After School", programme: 'Day', ageGroup: 'Years 3-4', date: '2026-10-02', start: '16:00', end: '17:00', venue: 'stpeters', staff: [{ coach: 'david', lead: true }], players: 18, status: 'ok' }),
    occ({ id: 'o7', session: 'U12 Academy', programme: 'Evening', ageGroup: 'U12', date: '2026-10-08', start: '19:00', end: '20:30', venue: 'freemens', staff: [{ coach: 'david', lead: true }, { coach: 'charlie' }], players: 14, status: 'ok' })
  ];

  /* Needs Attention: mirrors the needs-attention function's case contract
     (ruleId, category, severity, severityReason, title, detail,
     actionLabel, destination.area, anchorTime). Only Active rules are
     used. Ordered as the engine orders them: severity, rule sort order,
     earliest anchor. */
  var attention = {
    generatedAt: '2026-10-01T14:05:00',
    summary: { state: 'Urgent', total: 9, counts: { Urgent: 2, Warning: 3, Normal: 4 } },
    cases: [
      { caseKey: 'session_no_coach|occurrence:o5', ruleId: 'ATT-013', ruleName: 'Session has no coach', category: 'Staffing & Cover', severity: 'Urgent', severityReason: 'Starts within 48 hours', title: 'U13/14 Development has no coach', detail: 'Fri 2 Oct, 18:00 · Therfield School · 15 players', when: 'Starts in 28 h', actionLabel: 'Assign Staff', destination: { area: 'Schedule & Sessions' }, related: { occurrence: 'o5' } },
      { caseKey: 'assigned_coach_unavailable|occurrence:o4|coach:charlie', ruleId: 'ATT-014', ruleName: 'Assigned coach unavailable', category: 'Staffing & Cover', severity: 'Urgent', severityReason: 'Starts within 48 hours', title: 'Charlie Hughes is unavailable for U12 Academy', detail: 'Today, 19:00 · City of London Freemen’s · marked unavailable 30 Sep', when: 'Starts in 4 h 50 m', actionLabel: 'Review Staffing', destination: { area: 'Schedule & Sessions' }, related: { occurrence: 'o4', coach: 'charlie' } },
      { caseKey: 'learning_coach_only|occurrence:o8', ruleId: 'ATT-002', ruleName: 'Learning coach only', category: 'Staffing & Cover', severity: 'Warning', severityReason: 'Base severity', title: "St Peter's After School has only a learning coach", detail: 'Mon 5 Oct, 16:00 · St Peter’s School · Ellie Shaw', when: 'In 4 days', actionLabel: 'Review Staffing', destination: { area: 'Schedule & Sessions' } },
      { caseKey: 'coach_compliance_expiry|requirement:jack-dbs', ruleId: 'ATT-011', ruleName: 'Compliance expiring', category: 'Coaches & Compliance', severity: 'Warning', severityReason: 'Base severity', title: "Jack Morgan's DBS check expires in 12 days", detail: 'Expires 13 Oct 2026 · Enhanced DBS', when: 'Expires 13 Oct', actionLabel: 'Review Compliance', destination: { area: 'Coaches' } },
      { caseKey: 'non_compliant_coach_assigned|occurrence:o9|coach:tom', ruleId: 'ATT-031', ruleName: 'Non-compliant coach assigned', category: 'Coaches & Compliance', severity: 'Warning', severityReason: 'Locked minimum: Warning', title: 'Tom Reid is assigned without a current first aid certificate', detail: 'Daneshill Years 1-2 · Mon 5 Oct, 15:30', when: 'In 4 days', actionLabel: 'Review Compliance', destination: { area: 'Coaches' } },
      { caseKey: 'venue_missing|occurrence:o10', ruleId: 'ATT-018', ruleName: 'Venue missing', category: 'Sessions & Venues', severity: 'Normal', severityReason: 'Base severity', title: 'U11 Development has no venue', detail: 'Sat 10 Oct, 09:30 · 10 players', when: 'In 9 days', actionLabel: 'Assign Venue', destination: { area: 'Schedule & Sessions' } },
      { caseKey: 'cover_open|coverdate:tom-2026-10-12', ruleId: 'ATT-041', ruleName: 'Cover open', category: 'Staffing & Cover', severity: 'Normal', severityReason: 'Base severity', title: 'Cover needed while Tom Reid is on holiday', detail: '12–16 Oct · 3 sessions affected', when: 'Opened 1 day ago', actionLabel: 'Resolve Cover', destination: { area: 'Coaches' } },
      { caseKey: 'compliance_verification_pending|requirement:tom-firstaid', ruleId: 'ATT-042', ruleName: 'Verification pending', category: 'Coaches & Compliance', severity: 'Normal', severityReason: 'Base severity', title: 'First aid certificate from Tom Reid awaits verification', detail: 'Uploaded 30 Sep', when: '1 day ago', actionLabel: 'Review Compliance', destination: { area: 'Coaches' } },
      { caseKey: 'work_summary_ready_to_finalise|summary:charlie-2026-09', ruleId: 'ATT-045', ruleName: 'Work summary ready', category: 'Coaches & Compliance', severity: 'Normal', severityReason: 'Base severity', title: "Charlie Hughes's September summary is ready to finalise", detail: '14 sessions · 21.5 hours', when: 'Period ended 30 Sep', actionLabel: 'Finalise Summary', destination: { area: 'Coaches' } }
    ]
  };

  /* Existing approval tools in the Hub's More menu, with waiting counts. */
  var approvals = [
    { id: 'coach-signups', label: 'Coach sign-ups', sub: 'Approve pending staff sign-ups', count: 1, icon: 'userCheck' },
    { id: 'session-requests', label: 'Session requests', sub: 'Approve player session requests', count: 2, icon: 'inbox' },
    { id: 'parent-claims', label: 'Parent claims', sub: 'Approve parents’ claims to their child', count: 1, icon: 'link' },
    { id: 'player-migration', label: 'Player migration', sub: 'Move existing players onto sessions', count: 0, icon: 'move' }
  ];

  /* Management areas, matching the backend's Destination Areas and the
     Feature Controls module each depends on. */
  var areas = [
    { id: 'schedule', label: 'Schedule & Sessions', sub: 'Sessions, occurrences, venues and staffing', icon: 'calendar', module: 'module_schedule', on: true },
    { id: 'coaches', label: 'Coaches', sub: 'Compliance, cover, availability and work summaries', icon: 'coaches', module: 'module_coaches', on: true },
    { id: 'players', label: 'Players & Parents', sub: 'Players, memberships, families and access', icon: 'players', module: 'module_players_parents', on: true },
    { id: 'finance', label: 'Finance', sub: 'Billing, invoicing and session finances', icon: 'finance', module: 'module_finance', on: true, restricted: 'Finance access only' },
    { id: 'development', label: 'Development', sub: 'Feedback, frameworks and reviews', icon: 'development', module: 'module_development', on: true },
    { id: 'comms', label: 'Communications', sub: 'Messages to families and staff', icon: 'comms', module: 'module_communications', on: false }
  ];

  var parent = {
    name: 'Sarah Whitfield',
    email: 'sarah.whitfield@example.com',
    children: [
      { id: 'alfie', name: 'Alfie Whitfield', ageGroup: 'U9/10', sessions: ['U9/10 Development'],
        next: { session: 'U9/10 Development', dateLabel: 'Today', date: 'Thursday 1 October', time: '5:30pm – 6:30pm', venue: "City of London Freemen's", venueArea: 'Ashtead, KT21', coach: 'David Cole', meetingPoint: 'Astro gate' },
        feedback: { date: '20 September 2026', coach: 'David Cole', keepDoing: 'Scanning before you receive. You’re finding space early and it shows.', focus: 'Using your weaker foot to play forward under pressure.' } },
      { id: 'isla', name: 'Isla Whitfield', ageGroup: 'U8', sessions: ['U8 Development'],
        next: { session: 'U8 Development', dateLabel: 'Today', date: 'Thursday 1 October', time: '4:30pm – 5:30pm', venue: "City of London Freemen's", venueArea: 'Ashtead, KT21', coach: 'Jack Morgan', meetingPoint: 'Astro gate' },
        feedback: null }
    ],
    updates: [
      { title: 'Tonight’s sessions are on the back astro', body: 'The front pitch is being resurfaced. Please use the sports hall car park and meet at the astro gate.', meta: 'From the office · today, 11:20' }
    ]
  };


  /* People: staff list canvas (visual language for staff/client rows). */
  var staff = [
    { id: 'david', name: 'David Cole', email: 'david@example.com', role: 'Head Coach', team: 'Management', sessions: 9, compliance: 'ok', complianceText: 'Current', last: 'Active now', flag: null },
    { id: 'josh', name: 'Josh Evans', email: 'josh@example.com', role: 'Director', team: 'Management', sessions: 3, compliance: 'ok', complianceText: 'Current', last: '2 h ago', flag: null },
    { id: 'charlie', name: 'Charlie Hughes', email: 'charlie@example.com', role: 'Lead Coach', team: 'Evening', sessions: 8, compliance: 'ok', complianceText: 'Current', last: 'Yesterday', flag: { tone: 'danger', text: 'Unavailable today' } },
    { id: 'jack', name: 'Jack Morgan', email: 'jack@example.com', role: 'Coach', team: 'Evening', sessions: 6, compliance: 'warn', complianceText: 'DBS expires 13 Oct', last: '3 h ago', flag: null },
    { id: 'tom', name: 'Tom Reid', email: 'tom@example.com', role: 'Coach', team: 'Schools', sessions: 7, compliance: 'danger', complianceText: 'First aid missing', last: 'Today, 09:12', flag: { tone: 'warn', text: 'Holiday 12\u201316 Oct' } },
    { id: 'ellie', name: 'Ellie Shaw', email: 'ellie@example.com', role: 'Learning Coach', team: 'Evening', sessions: 4, compliance: 'ok', complianceText: 'Current', last: '1 day ago', flag: null },
    { id: 'priya', name: 'Priya Nair', email: 'priya@example.com', role: 'Coach', team: 'Schools', sessions: 5, compliance: 'ok', complianceText: 'Current', last: '4 days ago', flag: null },
    { id: 'sam', name: 'Sam Okafor', email: 'sam@example.com', role: 'Office', team: 'Operations', sessions: 0, compliance: 'none', complianceText: 'Not required', last: 'Active now', flag: null }
  ];

  /* What changed since the user last looked. Consistent with the cases
     and approvals above; nothing new is implied. */
  var lastVisit = 'yesterday at 17:40';
  var changes = [
    { time: '30 Sep, 18:12', text: 'Charlie Hughes marked unavailable for U12 Academy', tone: 'danger', key: 'assigned_coach_unavailable|occurrence:o4|coach:charlie' },
    { time: '30 Sep, 19:03', text: 'Tom Reid uploaded a first aid certificate', tone: '', key: 'compliance_verification_pending|requirement:tom-firstaid' },
    { time: 'Today, 09:24', text: '2 session requests arrived', tone: '', href: '#mgmt-session-requests' }
  ];

  Hub.data = {
    now: NOW, coaches: coaches, venues: venues, occurrences: occurrences, attention: attention,
    approvals: approvals, areas: areas, parent: parent, staff: staff, changes: changes, lastVisit: lastVisit,
    me: { id: 'david', name: 'David Cole', email: 'david@example.com', roleLabel: 'Management' },
    term: 'Term 1 · Week 4'
  };
})();
