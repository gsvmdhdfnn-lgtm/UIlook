/* Development, content and settings mock data (pass 12): development
   framework, framework settings, coach feedback, development plans per
   review period, content library, support, public pages, what we offer,
   admin guide, notices, notifications, organisation settings, labels and
   feature switch history. All invented. Screens read and write only
   through the Hub.db helpers at the bottom. Coach and Parent hubs use the
   same helpers (getFramework, getFeedback, getIdps, getResources,
   getNotices, getNotifications). */
(function () {
  var D = Hub.data, db = Hub.db;
  function pick(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }
  function nextId(list, prefix, pad, base) { return prefix + String(list.length + (base || 1)).padStart(pad || 3, '0'); }

  var V = D.dev = {};

  /* ---------- Development framework: groups with order and visibility ---------- */
  V.framework = {
    name: 'Player development framework', version: 3, updatedBy: 'Josh Evans', updatedAt: '2026-08-26T10:40',
    groups: [
      { id: 'GRP-TEC', name: 'Technical', desc: 'Ball mastery, receiving, passing and finishing.', items: ['First touch', 'Receiving to play forward', 'Passing range', '1v1 attacking', 'Weaker foot'], order: 1, coach: true, parent: true, rating: true, prompt: 'What did the player do well with the ball, and what is the next technical step?', updatedBy: 'Josh Evans', updatedAt: '2026-08-26T10:40' },
      { id: 'GRP-TAC', name: 'Tactical', desc: 'Decision making, scanning and understanding of the game.', items: ['Scanning', 'Positioning', 'Decision making', 'Transition'], order: 2, coach: true, parent: true, rating: true, prompt: 'How well does the player read the game and choose what to do next?', updatedBy: 'Josh Evans', updatedAt: '2026-08-26T10:40' },
      { id: 'GRP-PHY', name: 'Physical', desc: 'Agility, balance, coordination and speed.', items: ['Agility', 'Balance', 'Speed off the mark'], order: 3, coach: true, parent: false, rating: true, prompt: 'Any physical strengths or areas to keep an eye on?', updatedBy: 'David Cole', updatedAt: '2026-09-02T18:05' },
      { id: 'GRP-PSY', name: 'Psychological', desc: 'Confidence, resilience and focus.', items: ['Confidence', 'Resilience after mistakes', 'Focus'], order: 4, coach: true, parent: true, rating: false, prompt: 'How does the player respond to challenge and mistakes?', updatedBy: 'Josh Evans', updatedAt: '2026-08-26T10:40' },
      { id: 'GRP-SOC', name: 'Social', desc: 'Communication, teamwork and leadership.', items: ['Communication', 'Teamwork', 'Encouraging others'], order: 5, coach: true, parent: true, rating: false, prompt: 'How does the player work with and support team mates?', updatedBy: 'Josh Evans', updatedAt: '2026-08-26T10:40' }
    ]
  };

  /* ---------- Framework settings: feedback mode, sections, colour labels ---------- */
  V.frameworkSettings = {
    mode: 'Keep doing and focus', modes: ['Keep doing and focus', 'Ratings and written feedback', 'Ratings only', 'Written only'],
    keepDoing: true, focus: true, general: true, perArea: false, approval: true,
    labels: [
      { id: 'developing', label: 'Developing', color: '#d98a3d' },
      { id: 'secure', label: 'Secure', color: '#3f8f6a' },
      { id: 'excelling', label: 'Excelling', color: '#4a6fb3' }
    ],
    palette: ['#d98a3d', '#c4553f', '#3f8f6a', '#4a6fb3', '#8a5fb0', '#5d6673', '#c9a227'],
    updatedBy: 'Josh Evans', updatedAt: '2026-08-26T10:52'
  };

  /* ---------- Coach feedback (published, awaiting review, returned, draft) ---------- */
  function fb(o) { o.history = o.history || []; o.returns = o.returns || []; return o; }
  V.feedback = [
    fb({ id: 'FBK-0001', player: 'PLY-0001', coach: 'david', session: 'SES-02', period: 'September 2026', status: 'Published', keepDoing: 'Scanning before you receive. You’re finding space early and it shows.', focus: 'Using your weaker foot to play forward under pressure.', general: 'A really positive month. Alfie is first to every session and sets the standard in warm-ups.', ratings: { 'GRP-TEC': 'secure', 'GRP-TAC': 'excelling', 'GRP-PHY': 'secure' }, submittedBy: 'David Cole', submittedAt: '2026-09-18T19:10', publishedBy: 'Josh Evans', publishedAt: '2026-09-20T09:30',
      history: [{ text: 'Submitted for review', who: 'David Cole', at: '2026-09-18T19:10' }, { text: 'Published to the family', who: 'Josh Evans', at: '2026-09-20T09:30', tone: 'ok' }] }),
    fb({ id: 'FBK-0002', player: 'PLY-0008', coach: 'david', session: 'SES-02', period: 'September 2026', status: 'Awaiting review', keepDoing: 'Your work rate when we lose the ball. You win it back quickly.', focus: 'Taking a touch out of your feet before passing.', general: 'Ruby has settled into the group well this term.', ratings: { 'GRP-TEC': 'developing', 'GRP-TAC': 'secure', 'GRP-PHY': 'excelling' }, submittedBy: 'David Cole', submittedAt: '2026-09-30T19:40',
      history: [{ text: 'Submitted for review', who: 'David Cole', at: '2026-09-30T19:40' }] }),
    fb({ id: 'FBK-0003', player: 'PLY-0011', coach: 'charlie', session: 'SES-02', period: 'September 2026', status: 'Awaiting review', keepDoing: 'Calling for the ball. Team mates always know where you are.', focus: 'Opening your body so you can see the whole pitch when receiving.', general: '', ratings: { 'GRP-TEC': 'secure', 'GRP-TAC': 'developing' }, submittedBy: 'Charlie Hughes', submittedAt: '2026-09-30T20:05',
      history: [{ text: 'Submitted for review', who: 'Charlie Hughes', at: '2026-09-30T20:05' }] }),
    fb({ id: 'FBK-0004', player: 'PLY-0014', coach: 'charlie', session: 'SES-02', period: 'September 2026', status: 'Returned', keepDoing: 'Your energy in small-sided games.', focus: 'Listening, passing, first touch and shooting.', general: '', ratings: { 'GRP-TEC': 'developing' }, submittedBy: 'Charlie Hughes', submittedAt: '2026-09-28T19:20',
      returns: [{ note: 'Please make the focus one clear action Theo can work on, rather than four. Keep it short and positive.', by: 'Josh Evans', at: '2026-09-29T10:12' }],
      history: [{ text: 'Submitted for review', who: 'Charlie Hughes', at: '2026-09-28T19:20' }, { text: 'Returned to coach with a note', who: 'Josh Evans', at: '2026-09-29T10:12', tone: 'warn' }] }),
    fb({ id: 'FBK-0005', player: 'PLY-0002', coach: 'jack', session: 'SES-01', period: 'September 2026', status: 'Draft', keepDoing: 'Being brave on the ball in 1v1s.', focus: '', general: '', ratings: {}, submittedBy: null, submittedAt: null, startedBy: 'Jack Morgan', startedAt: '2026-09-30T18:02',
      history: [{ text: 'Draft started', who: 'Jack Morgan', at: '2026-09-30T18:02' }] }),
    fb({ id: 'FBK-0006', player: 'PLY-0006', coach: 'david', session: 'SES-03', period: 'September 2026', status: 'Published', keepDoing: 'Your first touch away from pressure. It buys you time every time.', focus: 'Arriving in the box at the right moment rather than waiting there.', general: 'Ethan has taken on more responsibility in the group.', ratings: { 'GRP-TEC': 'excelling', 'GRP-TAC': 'secure', 'GRP-PHY': 'secure' }, submittedBy: 'David Cole', submittedAt: '2026-09-19T21:00', publishedBy: 'Josh Evans', publishedAt: '2026-09-21T08:45',
      history: [{ text: 'Submitted for review', who: 'David Cole', at: '2026-09-19T21:00' }, { text: 'Published to the family', who: 'Josh Evans', at: '2026-09-21T08:45', tone: 'ok' }] }),
    fb({ id: 'FBK-0007', player: 'PLY-0012', coach: 'charlie', session: 'SES-03', period: 'September 2026', status: 'Awaiting review', keepDoing: 'Organising the back line. You talk all game.', focus: 'Stepping in to win the ball before the striker turns.', general: 'Lily has moved up to U12 Academy smoothly.', ratings: { 'GRP-TEC': 'secure', 'GRP-TAC': 'excelling' }, submittedBy: 'Charlie Hughes', submittedAt: '2026-10-01T09:15',
      history: [{ text: 'Submitted for review', who: 'Charlie Hughes', at: '2026-10-01T09:15' }] }),
    fb({ id: 'FBK-0008', player: 'PLY-0003', coach: 'ellie', session: 'SES-01', period: 'September 2026', status: 'Awaiting review', keepDoing: 'Smiling and trying every challenge, even the hard ones.', focus: 'Keeping the ball close when you dribble.', general: '', ratings: { 'GRP-TEC': 'developing' }, submittedBy: 'Ellie Shaw', submittedAt: '2026-09-30T17:55', learning: true,
      history: [{ text: 'Submitted for review (learning coach: needs sign-off)', who: 'Ellie Shaw', at: '2026-09-30T17:55' }] }),
    fb({ id: 'FBK-0009', player: 'PLY-0001', coach: 'david', session: 'SES-02', period: 'July 2026', status: 'Published', keepDoing: 'Your attitude in every drill.', focus: 'Looking over your shoulder before the ball arrives.', general: 'End of season: great progress since January.', ratings: { 'GRP-TEC': 'secure', 'GRP-TAC': 'developing' }, submittedBy: 'David Cole', submittedAt: '2026-07-13T20:10', publishedBy: 'David Cole', publishedAt: '2026-07-14T09:00',
      history: [{ text: 'Submitted for review', who: 'David Cole', at: '2026-07-13T20:10' }, { text: 'Published to the family', who: 'David Cole', at: '2026-07-14T09:00', tone: 'ok' }] })
  ];

  /* ---------- Development plans per review period ---------- */
  V.periods = [
    { id: 'RVP-02', name: 'Autumn 2026', from: '2026-09-01', to: '2026-12-11', reviewBy: '2026-11-20', status: 'Open', openedBy: 'Josh Evans', openedAt: '2026-08-28T12:00' },
    { id: 'RVP-01', name: 'Summer 2026', from: '2026-04-13', to: '2026-07-17', reviewBy: '2026-07-10', status: 'Closed', openedBy: 'Josh Evans', openedAt: '2026-04-08T09:00', closedBy: 'Josh Evans', closedAt: '2026-07-20T16:30' }
  ];
  function t(text, group, status) { return { text: text, group: group, status: status }; }
  function idp(id, player, period, coach, status, targets, by, at, extra) { return Object.assign({ id: id, player: player, period: period, coach: coach, status: status, targets: targets, updatedBy: by, updatedAt: at, history: [{ text: status === 'Not started' ? 'Created for the review period' : 'Plan updated: ' + status, who: by, at: at }] }, extra || {}); }
  V.idps = [
    idp('IDP-001', 'PLY-0001', 'RVP-02', 'david', 'Shared with family', [t('Play forward with the weaker foot under pressure, 3 times a session', 'GRP-TEC', 'On track'), t('Scan twice before receiving in midfield', 'GRP-TAC', 'Achieved'), t('Lead the warm-up once a month', 'GRP-SOC', 'In progress')], 'David Cole', '2026-09-22T19:30', { sharedBy: 'Josh Evans', sharedAt: '2026-09-23T09:10' }),
    idp('IDP-002', 'PLY-0008', 'RVP-02', 'david', 'Draft', [t('Take a touch out of your feet before passing', 'GRP-TEC', 'Not started'), t('Recover quickly after losing the ball', 'GRP-PSY', 'In progress')], 'David Cole', '2026-09-30T19:45'),
    idp('IDP-003', 'PLY-0011', 'RVP-02', 'charlie', 'Agreed', [t('Open your body to receive on the half-turn', 'GRP-TAC', 'In progress'), t('Finish with the inside of the foot from 12 yards', 'GRP-TEC', 'At risk')], 'Charlie Hughes', '2026-09-25T20:00'),
    idp('IDP-004', 'PLY-0013', 'RVP-02', 'david', 'Not started', [], 'System', '2026-09-01T07:00'),
    idp('IDP-005', 'PLY-0014', 'RVP-02', 'charlie', 'Agreed', [t('One clear job in each drill, and finish it', 'GRP-PSY', 'On track')], 'Charlie Hughes', '2026-09-24T19:05'),
    idp('IDP-006', 'PLY-0006', 'RVP-02', 'david', 'Shared with family', [t('Arrive late in the box rather than waiting there', 'GRP-TAC', 'In progress'), t('Use the outside of the foot to switch play', 'GRP-TEC', 'Not started')], 'David Cole', '2026-09-21T21:10', { sharedBy: 'David Cole', sharedAt: '2026-09-22T08:30' }),
    idp('IDP-007', 'PLY-0012', 'RVP-02', 'charlie', 'Draft', [t('Step in to win the ball before the striker turns', 'GRP-TAC', 'Not started')], 'Charlie Hughes', '2026-10-01T09:20'),
    idp('IDP-008', 'PLY-0018', 'RVP-02', 'david', 'Not started', [], 'System', '2026-09-01T07:00'),
    idp('IDP-009', 'PLY-0001', 'RVP-01', 'david', 'Reviewed', [t('Look over your shoulder before the ball arrives', 'GRP-TAC', 'Achieved'), t('Strike with laces from outside the box', 'GRP-TEC', 'Achieved')], 'David Cole', '2026-07-10T18:00', { reviewNote: 'Both targets met. Moving on to weaker-foot work in Autumn.' })
  ];

  /* ---------- Content: resources, coach support, public pages, offers, admin guide ---------- */
  V.resources = [
    { id: 'RES-001', title: 'Session plan: receiving to play forward', type: 'Session plan', audience: 'Coaches', topic: 'Technical', status: 'Published', updatedBy: 'David Cole', updatedAt: '2026-09-28T21:15' },
    { id: 'RES-002', title: 'Rondo progressions (U9 to U12)', type: 'Video', audience: 'Coaches', topic: 'Tactical', status: 'Published', updatedBy: 'Charlie Hughes', updatedAt: '2026-09-14T19:00' },
    { id: 'RES-003', title: 'Safeguarding refresher 2026', type: 'Guide', audience: 'Coaches', topic: 'Safeguarding', status: 'Published', updatedBy: 'Josh Evans', updatedAt: '2026-08-30T10:00' },
    { id: 'RES-004', title: 'Practising at home: 10-minute ball mastery', type: 'Video', audience: 'Parents', topic: 'At home', status: 'Published', updatedBy: 'David Cole', updatedAt: '2026-09-10T17:40' },
    { id: 'RES-005', title: 'What to bring to training', type: 'Guide', audience: 'Parents', topic: 'Getting started', status: 'Published', updatedBy: 'Sam Okafor', updatedAt: '2026-08-21T11:20' },
    { id: 'RES-006', title: 'Understanding your child’s feedback', type: 'Guide', audience: 'Parents', topic: 'Development', status: 'Draft', updatedBy: 'Josh Evans', updatedAt: '2026-09-30T16:05' },
    { id: 'RES-007', title: 'Club code of conduct', type: 'PDF', audience: 'Everyone', topic: 'Policies', status: 'Published', updatedBy: 'Josh Evans', updatedAt: '2026-07-01T09:00' }
  ];
  V.support = [
    { id: 'SUP-01', kind: 'Contact', title: 'Coaching lead', detail: 'David Cole · 07700 900101 · weekdays 9:00 to 17:00', status: 'Published', updatedBy: 'Josh Evans', updatedAt: '2026-09-01T09:00' },
    { id: 'SUP-02', kind: 'Contact', title: 'Safeguarding lead', detail: 'Josh Evans · 07700 900102 · any time for urgent concerns', status: 'Published', updatedBy: 'Josh Evans', updatedAt: '2026-09-01T09:00' },
    { id: 'SUP-03', kind: 'Contact', title: 'Office and rotas', detail: 'Sam Okafor · office@example.com', status: 'Published', updatedBy: 'Sam Okafor', updatedAt: '2026-09-01T09:05' },
    { id: 'SUP-04', kind: 'Guide', title: 'How to take a register', detail: 'Mark each player, add a note for anything unusual, then complete the register before you leave.', status: 'Published', updatedBy: 'David Cole', updatedAt: '2026-09-03T08:30' },
    { id: 'SUP-05', kind: 'Guide', title: 'Writing good feedback', detail: 'One thing to keep doing, one clear focus. Short, specific and positive.', status: 'Published', updatedBy: 'Josh Evans', updatedAt: '2026-09-05T12:00' },
    { id: 'SUP-06', kind: 'Guide', title: 'Requesting cover', detail: 'Mark yourself unavailable as early as you can; the office arranges cover.', status: 'Draft', updatedBy: 'Sam Okafor', updatedAt: '2026-09-29T15:40' }
  ];
  V.pages = [
    { id: 'PGE-01', title: 'Home', path: '/', status: 'Published', summary: 'Hero, what we offer, testimonials and sign-up.', updatedBy: 'Josh Evans', updatedAt: '2026-08-31T18:00' },
    { id: 'PGE-02', title: 'About us', path: '/about', status: 'Published', summary: 'Our story, coaches and values.', updatedBy: 'Josh Evans', updatedAt: '2026-06-10T10:00' },
    { id: 'PGE-03', title: 'Safeguarding', path: '/safeguarding', status: 'Published', summary: 'Policy, designated lead and how to raise a concern.', updatedBy: 'Josh Evans', updatedAt: '2026-08-30T10:10' },
    { id: 'PGE-04', title: 'Holiday camps', path: '/camps', status: 'Draft', summary: 'October half term camp details and booking.', updatedBy: 'Sam Okafor', updatedAt: '2026-09-30T14:20' },
    { id: 'PGE-05', title: 'Contact', path: '/contact', status: 'Published', summary: 'Office email, phone and venue map.', updatedBy: 'Sam Okafor', updatedAt: '2026-05-02T09:30' }
  ];
  V.offers = [
    { id: 'OFR-01', title: 'U8 Development', group: 'U8', when: 'Thursdays 16:30', venue: 'Northgate Sports Centre', price: 7200, unit: 'a month', status: 'Published', order: 1, updatedBy: 'Josh Evans', updatedAt: '2026-08-20T10:00' },
    { id: 'OFR-02', title: 'U9/10 Development', group: 'U9/10', when: 'Thursdays 17:30', venue: 'Northgate Sports Centre', price: 8700, unit: 'a month', status: 'Published', order: 2, updatedBy: 'Josh Evans', updatedAt: '2026-08-20T10:00' },
    { id: 'OFR-03', title: 'U12 Academy', group: 'U12', when: 'Thursdays 19:00', venue: 'Northgate Sports Centre', price: 9500, unit: 'a month', status: 'Published', order: 3, updatedBy: 'Josh Evans', updatedAt: '2026-08-20T10:00' },
    { id: 'OFR-04', title: 'U11 Saturday Development', group: 'U11', when: 'Saturdays 09:30', venue: 'Venue to be confirmed', price: 1200, unit: 'a session', status: 'Draft', order: 4, updatedBy: 'David Cole', updatedAt: '2026-09-29T11:00' },
    { id: 'OFR-05', title: 'October half term camp', group: 'Ages 6 to 12', when: '26 to 30 Oct', venue: 'Northgate Sports Centre', price: 2500, unit: 'a day', status: 'Draft', order: 5, updatedBy: 'Sam Okafor', updatedAt: '2026-09-30T14:25' }
  ];
  V.guide = [
    { id: 'GDE-01', title: 'Publishing coach feedback', body: 'Coaches submit feedback after a session or at the end of the month. It stays hidden from families until Management publishes it from Feedback review. Return it with a note if it needs changes.', updatedBy: 'Josh Evans', updatedAt: '2026-08-26T11:00' },
    { id: 'GDE-02', title: 'Opening a review period', body: 'Each term has a review period. Opening it creates a development plan for every active player; coaches add targets and Management shares them with families.', updatedBy: 'Josh Evans', updatedAt: '2026-08-28T12:05' },
    { id: 'GDE-03', title: 'Renaming labels', body: 'Hub Settings lets you rename words such as IDP. The new word appears everywhere in Management, Coach and Parent hubs straight away.', updatedBy: 'Josh Evans', updatedAt: '2026-08-28T12:10' },
    { id: 'GDE-04', title: 'Switching features off', body: 'Feature controls turn whole areas on or off. Switched-off areas stay visible but disabled, so nothing is lost when you switch them back on.', updatedBy: 'Josh Evans', updatedAt: '2026-08-28T12:15' }
  ];

  /* ---------- Notices (Communications) ---------- */
  V.notices = [
    { id: 'NTC-01', title: 'Tonight’s sessions are on the back astro', body: 'The front pitch is being resurfaced. Please use the sports hall car park and meet at the astro gate.', audience: 'Parents', sessions: ['SES-01', 'SES-02', 'SES-03'], status: 'Sent', by: 'Sam Okafor', at: '2026-10-01T11:20' },
    { id: 'NTC-02', title: 'Half term camp bookings open', body: 'Bookings for the October half term camp open on Monday 5 October.', audience: 'Parents', sessions: [], status: 'Scheduled', sendAt: '2026-10-05T09:00', by: 'Josh Evans', at: '2026-09-30T16:40' },
    { id: 'NTC-03', title: 'Coach meeting: Thursday 8 October', body: 'All coaches at Northgate, 15:45, before the evening sessions.', audience: 'Coaches', sessions: [], status: 'Sent', by: 'David Cole', at: '2026-09-29T12:00' }
  ];
  V.messageTemplates = [
    { id: 'TPL-01', title: 'Session cancelled (weather)', audience: 'Parents', updatedBy: 'Josh Evans', updatedAt: '2026-09-17T13:10' },
    { id: 'TPL-02', title: 'Welcome to the club', audience: 'Parents', updatedBy: 'Sam Okafor', updatedAt: '2026-08-21T11:00' },
    { id: 'TPL-03', title: 'Cover needed', audience: 'Coaches', updatedBy: 'Sam Okafor', updatedAt: '2026-09-12T10:30' }
  ];

  /* ---------- Notifications (per audience) ---------- */
  V.notifications = [
    { id: 'NTF-001', audience: 'management', title: 'Feedback awaiting review', body: 'Lily Bennett’s September feedback from Charlie Hughes is ready to publish.', route: 'mgmt-feedback-review/FBK-0007', at: '2026-10-01T09:15', read: false },
    { id: 'NTF-002', audience: 'management', title: 'Charlie Hughes marked unavailable', body: 'U12 Academy today, 19:00. Cover may be needed.', route: 'mgmt-attention', at: '2026-09-30T18:12', read: false },
    { id: 'NTF-003', audience: 'management', title: 'Membership cancellation requested', body: 'Kate Hunt asked to end George Hunt’s U9/10 Development membership.', route: 'mgmt-memberships', at: '2026-10-01T08:42', read: false },
    { id: 'NTF-004', audience: 'management', title: 'First aid certificate uploaded', body: 'Tom Reid uploaded a new certificate for verification.', route: 'mgmt-documents', at: '2026-09-30T19:03', read: true, readAt: '2026-09-30T19:30' },
    { id: 'NTF-005', audience: 'management', title: 'Feedback returned', body: 'You returned Theo Patel’s feedback to Charlie Hughes.', route: 'mgmt-feedback-review/FBK-0004', at: '2026-09-29T10:12', read: true, readAt: '2026-09-29T10:12' },
    { id: 'NTF-006', audience: 'management', title: 'September registers', body: 'One register from Thu 24 Sep is still in progress.', route: 'mgmt-registers', at: '2026-09-28T08:00', read: true, readAt: '2026-09-28T08:40' },
    { id: 'NTF-101', audience: 'coach', title: 'Feedback returned with a note', body: 'Theo Patel: please make the focus one clear action.', route: 'coach-feedback/PLY-0014', at: '2026-09-29T10:12', read: false },
    { id: 'NTF-102', audience: 'coach', title: 'New session plan in the library', body: 'Receiving to play forward.', route: 'coach-library', at: '2026-09-28T21:15', read: true, readAt: '2026-09-29T07:50' },
    { id: 'NTF-201', audience: 'parent', title: 'New feedback for Alfie', body: 'David Cole shared September feedback.', route: 'parent-development', at: '2026-09-20T09:30', read: true, readAt: '2026-09-20T12:02' },
    { id: 'NTF-202', audience: 'parent', title: 'Tonight’s sessions are on the back astro', body: 'Meet at the astro gate.', route: 'parent-notices', at: '2026-10-01T11:20', read: false }
  ];
  V.notificationPrefs = {
    management: [
      { id: 'np-feedback', label: 'Feedback awaiting review', email: true, push: true },
      { id: 'np-staffing', label: 'Staffing and cover', email: true, push: true },
      { id: 'np-requests', label: 'Requests from families', email: true, push: false },
      { id: 'np-compliance', label: 'Coach documents and compliance', email: true, push: false },
      { id: 'np-finance', label: 'Finance and payments', email: false, push: false }
    ]
  };

  /* ---------- Organisation settings (extra fields beyond the brand object) ---------- */
  V.org = {
    relvor: { tagline: 'Coaching that grows with every player', website: 'https://northfield.example', supportEmail: 'office@northfield.example', domain: 'hub.northfield.example', timezone: 'Europe/London', logo: null, updatedBy: 'Josh Evans', updatedAt: '2026-08-14T10:00' },
    joshevans: { tagline: 'Developing players, building people', website: 'https://joshevans.example', supportEmail: 'office@joshevans.example', domain: 'hub.joshevans.example', timezone: 'Europe/London', logo: 'assets/je-mark.png', updatedBy: 'Josh Evans', updatedAt: '2026-08-14T10:00' }
  };
  V.timezones = ['Europe/London', 'Europe/Dublin', 'Europe/Lisbon', 'Europe/Paris'];
  V.colourPresets = {
    identity: [['Obsidian', '#0b0b0b'], ['Navy', '#062a59'], ['Forest', '#123b2c'], ['Plum', '#3b1f3f'], ['Slate', '#26323f']],
    accent: [['Amber', '#d9a441'], ['Sky', '#1187ee'], ['Emerald', '#1f9d6b'], ['Coral', '#e0654f'], ['Violet', '#7b5cd6']],
    fill: [['Amber', '#d9a441'], ['Lime', '#c8ed21'], ['Sky', '#1187ee'], ['Emerald', '#1f9d6b'], ['Ink', '#101114']]
  };
  /* Factory values, so "Reset to default" can restore them. */
  V.brandDefaults = {};
  Object.keys(Hub.brands).forEach(function (k) { var b = Hub.brands[k]; V.brandDefaults[k] = { orgName: b.orgName, orgFull: b.orgFull, identity: b.identity, accent: b.accent, fill: b.fill, onFill: b.onFill, org: Object.assign({}, V.org[k]) }; });
  V.brandHistory = [{ text: 'Branding set up', who: 'Josh Evans', at: '2026-08-14T10:00' }];

  /* ---------- Labels and feature switch history ---------- */
  V.labelHistory = [{ text: 'Labels set to the defaults', who: 'Josh Evans', at: '2026-08-14T10:05' }];
  V.labelUses = {
    IDP: ['Coach hub: player page', 'Parent hub: Development', 'Needs attention: plans due'],
    IDPs: ['Management: Development', 'Coach hub: player list'],
    'Development plan': ['Parent hub: Development', 'Coach hub: development tab']
  };
  V.featureLog = {
    communications: { on: false, by: 'Josh Evans', at: '2026-08-14T10:20', note: 'Not used yet: families are messaged by email.' },
    sessionRequests: { on: false, by: 'Josh Evans', at: '2026-08-14T10:20', note: 'Planned for January.' },
    bookings: { on: true, by: 'Josh Evans', at: '2026-08-14T10:20' },
    cover: { on: true, by: 'Josh Evans', at: '2026-08-14T10:20' },
    development: { on: true, by: 'Josh Evans', at: '2026-08-14T10:20' },
    finance: { on: true, by: 'Josh Evans', at: '2026-08-14T10:20' },
    registers: { on: true, by: 'Josh Evans', at: '2026-08-14T10:20' },
    trials: { on: true, by: 'David Cole', at: '2026-09-02T09:15' },
    packages: { on: true, by: 'Sam Okafor', at: '2026-09-18T14:00' },
    discounts: { on: true, by: 'Josh Evans', at: '2026-08-14T10:20' },
    documents: { on: true, by: 'Josh Evans', at: '2026-08-14T10:20' },
    publicSite: { on: true, by: 'Josh Evans', at: '2026-08-14T10:20' }
  };

  /* ---------- Profile (signed-in manager) ---------- */
  V.profile = { phone: '07700 900101', jobTitle: 'Head Coach', hubs: ['Management', 'Coach'], passwordChangedAt: '2026-06-02T08:15', lastSignIn: '2026-10-01T08:02', twoStep: true };

  /* =========================== Read helpers =========================== */
  db.getFramework = function () { V.framework.groups.sort(function (a, b) { return a.order - b.order; }); return V.framework; };
  db.getFrameworkGroups = function (audience) { var g = db.getFramework().groups; return audience === 'parent' ? g.filter(function (x) { return x.parent; }) : audience === 'coach' ? g.filter(function (x) { return x.coach; }) : g; };
  db.getFrameworkGroup = function (id) { return pick(V.framework.groups, id); };
  db.getFrameworkSettings = function () { return V.frameworkSettings; };
  db.getColourLabel = function (id) { return pick(V.frameworkSettings.labels, id); };
  /* Feedback. publishedOnly: what a family may see. */
  db.getFeedback = function (playerId, o) {
    o = o || {};
    return V.feedback.filter(function (f) { return (!playerId || f.player === playerId) && (!o.publishedOnly || f.status === 'Published') && (!o.status || f.status === o.status) && (!o.coach || f.coach === o.coach); })
      .sort(function (a, b) { return (b.publishedAt || b.submittedAt || b.startedAt || '') < (a.publishedAt || a.submittedAt || a.startedAt || '') ? -1 : 1; });
  };
  db.getFeedbackItem = function (id) { return pick(V.feedback, id); };
  db.getLatestPublishedFeedback = function (playerId) { return db.getFeedback(playerId, { publishedOnly: true })[0] || null; };
  db.isFeedbackVisibleToParents = function (f) { return f.status === 'Published'; };
  /* Needs Attention: feedback waiting for Management to publish or return. */
  db.getFeedbackAwaitingReview = function () { return V.feedback.filter(function (f) { return f.status === 'Awaiting review'; }); };
  db.getReviewPeriods = function () { return V.periods; };
  db.getReviewPeriod = function (id) { return pick(V.periods, id); };
  db.getCurrentReviewPeriod = function () { return V.periods.filter(function (p) { return p.status === 'Open'; })[0]; };
  db.getIdps = function (playerId, periodId) { return V.idps.filter(function (i) { return (!playerId || i.player === playerId) && (!periodId || i.period === periodId); }); };
  db.getIdp = function (id) { return pick(V.idps, id); };
  /* Parents see a plan only once it has been shared (or reviewed). */
  db.getSharedIdps = function (playerId) { return db.getIdps(playerId).filter(function (i) { return i.status === 'Shared with family' || i.status === 'Reviewed'; }); };
  /* Needs Attention: plans in the open period that have not been started. */
  db.getIdpsNotStarted = function () { var p = db.getCurrentReviewPeriod(); return p ? db.getIdps(null, p.id).filter(function (i) { return i.status === 'Not started'; }) : []; };
  db.getResources = function (audience, o) {
    o = o || {};
    var map = { coach: 'Coaches', coaches: 'Coaches', parent: 'Parents', parents: 'Parents' }, a = map[String(audience || '').toLowerCase()] || audience;
    return V.resources.filter(function (r) { return (!a || r.audience === a || r.audience === 'Everyone') && (o.includeDrafts || !audience || r.status === 'Published'); });
  };
  db.getResource = function (id) { return pick(V.resources, id); };
  db.getCoachSupport = function (o) { return V.support.filter(function (s) { return (o && o.includeDrafts) || s.status === 'Published'; }); };
  db.getAllCoachSupport = function () { return V.support; };
  db.getPublicPages = function () { return V.pages; };
  db.getOfferContent = function (publishedOnly) { return V.offers.slice().sort(function (a, b) { return a.order - b.order; }).filter(function (o) { return !publishedOnly || o.status === 'Published'; }); };
  db.getAdminGuide = function () { return V.guide; };
  db.getContentItem = function (kind, id) { return pick(db.contentList(kind), id); };
  db.contentList = function (kind) { return { resources: V.resources, support: V.support, pages: V.pages, offers: V.offers, guide: V.guide }[kind] || []; };
  db.getNotices = function (audience) { return V.notices.filter(function (n) { return !audience || n.audience === audience || n.audience === 'Everyone'; }); };
  db.getMessageTemplates = function () { return V.messageTemplates; };
  db.getNotifications = function (audience) { return V.notifications.filter(function (n) { return !audience || n.audience === audience; }).sort(function (a, b) { return a.at < b.at ? 1 : -1; }); };
  db.getUnreadCount = function (audience) { return db.getNotifications(audience).filter(function (n) { return !n.read; }).length; };
  db.getNotificationPrefs = function (audience) { return V.notificationPrefs[audience || 'management'] || []; };
  db.getOrgSettings = function (brandId) { return V.org[brandId] || V.org.relvor; };
  db.getColourPresets = function () { return V.colourPresets; };
  db.getTimezones = function () { return V.timezones; };
  db.getBrandHistory = function () { return V.brandHistory; };
  db.getBrandDefaults = function (brandId) { return V.brandDefaults[brandId]; };
  db.getLabelHistory = function () { return V.labelHistory; };
  db.getLabelUses = function () { return V.labelUses; };
  db.getFeatureLog = function (key) { return V.featureLog[key] || null; };
  db.getProfile = function () { return Object.assign({}, D.me, V.profile); };

  /* =========================== Write helpers ========================== */
  db.saveFrameworkGroup = function (g, who, at) {
    var x = g.id && pick(V.framework.groups, g.id);
    if (!x) { x = { id: 'GRP-' + String(V.framework.groups.length + 1).padStart(2, '0'), order: V.framework.groups.length + 1, coach: true, parent: false, rating: true, items: [] }; V.framework.groups.push(x); }
    Object.assign(x, g, { id: x.id, updatedBy: who, updatedAt: at });
    V.framework.updatedBy = who; V.framework.updatedAt = at;
    return x;
  };
  db.moveFrameworkGroup = function (id, dir, who, at) {
    var g = db.getFramework().groups, i = g.map(function (x) { return x.id; }).indexOf(id), j = i + dir;
    if (i < 0 || j < 0 || j >= g.length) return null;
    var o = g[i].order; g[i].order = g[j].order; g[j].order = o;
    g[i].updatedBy = who; g[i].updatedAt = at; V.framework.updatedBy = who; V.framework.updatedAt = at;
    db.getFramework(); return g;
  };
  db.setFrameworkGroupFlag = function (id, flag, who, at) { var g = pick(V.framework.groups, id); g[flag] = !g[flag]; g.updatedBy = who; g.updatedAt = at; V.framework.updatedBy = who; V.framework.updatedAt = at; return g; };
  db.updateFrameworkSettings = function (patch, who, at) { Object.assign(V.frameworkSettings, patch, { updatedBy: who, updatedAt: at }); return V.frameworkSettings; };
  db.setColourLabel = function (id, patch, who, at) { var l = pick(V.frameworkSettings.labels, id); Object.assign(l, patch); V.frameworkSettings.updatedBy = who; V.frameworkSettings.updatedAt = at; return l; };
  db.publishFeedback = function (id, who, at) { var f = pick(V.feedback, id); f.status = 'Published'; f.publishedBy = who; f.publishedAt = at; f.history.push({ text: 'Published to the family', who: who, at: at, tone: 'ok' }); return f; };
  db.returnFeedback = function (id, note, who, at) { var f = pick(V.feedback, id); f.status = 'Returned'; f.returns.push({ note: note, by: who, at: at }); f.history.push({ text: 'Returned to coach with a note', detail: note, who: who, at: at, tone: 'warn' }); return f; };
  db.unpublishFeedback = function (id, who, at) { var f = pick(V.feedback, id); f.status = 'Awaiting review'; f.history.push({ text: 'Hidden from the family again', who: who, at: at, tone: 'warn' }); f.publishedBy = null; f.publishedAt = null; return f; };
  db.setIdpStatus = function (id, status, who, at) { var i = pick(V.idps, id); i.status = status; i.updatedBy = who; i.updatedAt = at; if (status === 'Shared with family') { i.sharedBy = who; i.sharedAt = at; } i.history.push({ text: 'Plan status: ' + status, who: who, at: at, tone: status === 'Shared with family' ? 'ok' : '' }); return i; };
  db.setIdpTarget = function (id, n, patch, who, at) { var i = pick(V.idps, id); Object.assign(i.targets[n], patch); i.updatedBy = who; i.updatedAt = at; i.history.push({ text: 'Target ' + (n + 1) + (patch.status ? ' marked ' + patch.status : ' changed'), who: who, at: at }); return i; };
  db.addIdpTarget = function (id, target, who, at) { var i = pick(V.idps, id); i.targets.push(target); if (i.status === 'Not started') i.status = 'Draft'; i.updatedBy = who; i.updatedAt = at; i.history.push({ text: 'Target added: ' + target.text, who: who, at: at }); return i; };
  db.saveContentItem = function (kind, item, who, at) {
    var list = db.contentList(kind), x = item.id && pick(list, item.id);
    var prefix = { resources: 'RES-', support: 'SUP-', pages: 'PGE-', offers: 'OFR-', guide: 'GDE-' }[kind];
    if (!x) { x = { id: nextId(list, prefix, kind === 'resources' ? 3 : 2), status: 'Draft' }; if (kind === 'offers') x.order = list.length + 1; list.push(x); }
    Object.assign(x, item, { id: x.id, updatedBy: who, updatedAt: at });
    return x;
  };
  db.setContentStatus = function (kind, id, status, who, at) { var x = pick(db.contentList(kind), id); x.status = status; x.updatedBy = who; x.updatedAt = at; return x; };
  db.moveOffer = function (id, dir, who, at) { var l = db.getOfferContent(), i = l.map(function (o) { return o.id; }).indexOf(id), j = i + dir; if (j < 0 || j >= l.length) return null; var o = l[i].order; l[i].order = l[j].order; l[j].order = o; l[i].updatedBy = who; l[i].updatedAt = at; return l; };
  db.addNotice = function (n) { n.id = nextId(V.notices, 'NTC-', 2); V.notices.unshift(n); return n; };
  db.markNotificationRead = function (id, read, at) { var n = pick(V.notifications, id); n.read = read !== false; n.readAt = n.read ? at : null; return n; };
  db.markAllNotificationsRead = function (audience, at) { db.getNotifications(audience).forEach(function (n) { if (!n.read) { n.read = true; n.readAt = at; } }); };
  db.setNotificationPref = function (audience, id, channel) { var p = pick(V.notificationPrefs[audience], id); p[channel] = !p[channel]; return p; };
  db.saveOrgSettings = function (brandId, brandPatch, orgPatch, who, at) {
    var b = Hub.brands[brandId]; Object.assign(b, brandPatch);
    Object.assign(V.org[brandId], orgPatch, { updatedBy: who, updatedAt: at });
    V.brandHistory.unshift({ text: 'Organisation and branding saved', who: who, at: at });
    return b;
  };
  db.resetBrand = function (brandId, who, at) {
    var d = V.brandDefaults[brandId], b = Hub.brands[brandId];
    ['orgName', 'orgFull', 'identity', 'accent', 'fill', 'onFill'].forEach(function (k) { b[k] = d[k]; });
    Object.assign(V.org[brandId], d.org, { updatedBy: who, updatedAt: at });
    V.brandHistory.unshift({ text: 'Branding reset to default', who: who, at: at, tone: 'warn' });
    return b;
  };
  db.setLabels = function (map, who, at) {
    var changed = [];
    Object.keys(map).forEach(function (k) { if (map[k] && Hub.labels[k] !== map[k]) { changed.push(k + ': ' + Hub.labels[k] + ' → ' + map[k]); Hub.labels[k] = map[k]; } });
    if (changed.length) V.labelHistory.unshift({ text: 'Labels renamed', detail: changed.join(' · '), who: who, at: at });
    return changed;
  };
  db.setFeature = function (key, on, who, at) { Hub.features[key] = !!on; V.featureLog[key] = { on: !!on, by: who, at: at }; return V.featureLog[key]; };
  db.changePassword = function (who, at) { V.profile.passwordChangedAt = at; return V.profile; };
  db.updateProfile = function (patch) { if (patch.phone != null) V.profile.phone = patch.phone; if (patch.jobTitle != null) V.profile.jobTitle = patch.jobTitle; return V.profile; };
})();
