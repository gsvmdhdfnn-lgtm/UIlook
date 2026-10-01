/* Invented people for the prototype: coaches, families, parents, players.
   Every name, address and phone number is fictional (07700 900xxx numbers
   are reserved for drama). Stable prototype IDs: COA-, FAM-, PAR-, PLY-. */
(function () {
  var D = Hub.data;

  /* Coaches: extend the existing records, add one more to make eight. */
  var coachExtra = {
    david: { code: 'COA-001', type: 'lead', email: 'david@example.com', phone: '07700 900101', active: true, started: '2019-09-01', hub: 'Management + Coach' },
    josh: { code: 'COA-002', type: 'lead', email: 'josh@example.com', phone: '07700 900102', active: true, started: '2015-04-01', hub: 'Management + Coach' },
    charlie: { code: 'COA-003', type: 'lead', email: 'charlie@example.com', phone: '07700 900103', active: true, started: '2021-01-11', hub: 'Coach' },
    jack: { code: 'COA-004', type: 'coach', email: 'jack@example.com', phone: '07700 900104', active: true, started: '2022-09-05', hub: 'Coach' },
    tom: { code: 'COA-005', type: 'coach', email: 'tom@example.com', phone: '07700 900105', active: true, started: '2023-02-20', hub: 'Coach' },
    ellie: { code: 'COA-006', type: 'learning', email: 'ellie@example.com', phone: '07700 900106', active: true, started: '2026-07-01', hub: 'Coach' },
    priya: { code: 'COA-007', type: 'coach', email: 'priya@example.com', phone: '07700 900107', active: true, started: '2024-04-15', hub: 'Coach' },
    marcus: { code: 'COA-008', type: 'coach', email: 'marcus@example.com', phone: '07700 900108', active: true, started: '2025-09-01', hub: 'Coach' }
  };
  D.coaches.priya = { id: 'priya', name: 'Priya Nair', role: 'Coach' };
  D.coaches.marcus = { id: 'marcus', name: 'Marcus Bell', role: 'Coach' };
  Object.keys(coachExtra).forEach(function (k) { Object.assign(D.coaches[k], coachExtra[k]); });
  D.coachList = ['david', 'josh', 'charlie', 'jack', 'tom', 'ellie', 'priya', 'marcus'].map(function (k) { return D.coaches[k]; });
  if (!D.staff.some(function (s) { return s.id === 'marcus'; })) {
    D.staff.splice(7, 0, { id: 'marcus', name: 'Marcus Bell', email: 'marcus@example.com', role: 'Coach', team: 'Evening', sessions: 2, compliance: 'ok', complianceText: 'Current', last: 'Yesterday', flag: null });
  }
  /* Edge case: Tom Reid's first aid has expired. */
  D.staff.forEach(function (s) { if (s.id === 'tom') { s.compliance = 'danger'; s.complianceText = 'First aid expired 14 Sep'; } });

  /* Families (FAM-) and parents (PAR-). Contact priority never changes access. */
  var families = [
    ['FAM-01', 'Whitfield', [['PAR-01', 'Sarah Whitfield', 'sarah.whitfield@example.com', 'Mother', 'Verified'], ['PAR-02', 'Daniel Whitfield', 'daniel.w@example.com', 'Father', 'Invite sent']]],
    ['FAM-02', 'Price', [['PAR-03', 'Hannah Price', 'hannah.price@example.com', 'Mother', 'Verified'], ['PAR-04', 'Mark Price', 'mark.price@example.com', 'Father', 'Verified']]],
    ['FAM-03', 'Carter', [['PAR-05', 'Jess Carter', 'jess.carter@example.com', 'Mother', 'Verified']]],
    ['FAM-04', 'Lane', [['PAR-06', 'Gareth Lane', 'gareth.lane@example.com', 'Father', 'Verified']]],
    ['FAM-05', 'Grant', [['PAR-07', 'Nina Grant', 'nina.grant@example.com', 'Mother', 'Verified']]],
    ['FAM-06', 'Dawson', [['PAR-08', 'Claire Dawson', 'claire.dawson@example.com', 'Mother', 'Verified']]],
    ['FAM-07', 'Bennett', [['PAR-09', 'Olivia Bennett', 'olivia.bennett@example.com', 'Mother', 'Verified']]],
    ['FAM-08', 'Moss', [['PAR-10', 'Rachel Moss', 'rachel.moss@example.com', 'Mother', 'Verified']]],
    ['FAM-09', 'Patel', [['PAR-11', 'Raj Patel', 'raj.patel@example.com', 'Father', 'Verified']]],
    ['FAM-10', 'Ellis', [['PAR-12', 'Lucy Ellis', 'lucy.ellis@example.com', 'Mother', 'Verified']]],
    ['FAM-11', 'Shah', [['PAR-13', 'Imran Shah', 'imran.shah@example.com', 'Father', 'Verified']]],
    ['FAM-12', 'Hunt', [['PAR-14', 'Kate Hunt', 'kate.hunt@example.com', 'Mother', 'Verified']]],
    ['FAM-13', 'Fielding', [['PAR-15', 'Joanne Fielding', 'joanne.f@example.com', 'Mother', 'Verified']]],
    ['FAM-14', 'Doyle', [['PAR-16', 'Ciara Doyle', 'ciara.doyle@example.com', 'Mother', 'Verified']]],
    ['FAM-15', 'Walsh', [['PAR-17', 'Niamh Walsh', 'niamh.walsh@example.com', 'Mother', 'Verified']]],
    ['FAM-16', 'Moore', [['PAR-18', 'Tina Moore', 'tina.moore@example.com', 'Mother', 'Verified']]]
  ];
  D.families = []; D.parents = [];
  families.forEach(function (f, i) {
    var fam = { id: f[0], name: f[1] + ' family', surname: f[1], status: i === 5 ? 'Trial' : 'Active', reviewDue: i === 12 ? '2026-10-15' : '2027-03-01', closureReason: null, credits: [], requests: [], parents: f[2].map(function (p) { return p[0]; }) };
    D.families.push(fam);
    f[2].forEach(function (p, j) {
      D.parents.push({ id: p[0], name: p[1], email: p[2], phone: '07700 900' + (200 + D.parents.length), relationship: p[3], family: f[0], priority: j + 1,
        link: { method: p[4] === 'Invite sent' ? 'Invite from Sarah Whitfield' : (j === 0 ? 'Email match + date of birth' : 'Invited by ' + f[2][0][1]), verifiedAt: p[4] === 'Verified' ? '2026-0' + (3 + (i % 6)) + '-1' + (i % 9) + 'T10:' + (10 + i) : null, invite: p[4], ended: null } });
    });
  });

  /* Players (PLY-). ageGroup drives which session they belong to. */
  var P = [
    // id, first, last, dob, family, group, school, year, medical, support, photo, status
    ['PLY-0001', 'Alfie', 'Whitfield', '2016-05-14', 'FAM-01', 'U9/10', 'Westbrook Primary', 'Year 5', 'none', 'none', 'yes', 'Active'],
    ['PLY-0002', 'Isla', 'Whitfield', '2018-11-02', 'FAM-01', 'U8', 'Westbrook Primary', 'Year 3', 'details', 'none', 'yes', 'Active'],
    ['PLY-0003', 'Ava', 'Price', '2018-07-21', 'FAM-02', 'U8', 'Ashby Vale Primary', 'Year 3', 'none', 'none', 'yes', 'Active'],
    ['PLY-0004', 'Callum', 'Price', '2012-12-03', 'FAM-02', 'U13/14', 'Hollins Park School', 'Year 9', 'none', 'none', 'yes', 'Active'],
    ['PLY-0005', 'Noah', 'Carter', '2018-09-30', 'FAM-03', 'U8', 'Westbrook Primary', 'Year 3', 'none', 'none', 'yes', 'Active'],
    ['PLY-0006', 'Ethan', 'Carter', '2014-04-17', 'FAM-03', 'U12', 'Northgate School', 'Year 7', 'none', 'none', 'yes', 'Active'],
    ['PLY-0007', 'Freddie', 'Lane', '2019-01-08', 'FAM-04', 'U8', 'Ashby Vale Primary', 'Year 2', 'none', 'none', 'unknown', 'Active'],
    ['PLY-0008', 'Ruby', 'Lane', '2016-08-25', 'FAM-04', 'U9/10', 'Ashby Vale Primary', 'Year 5', 'none', 'none', 'yes', 'Active'],
    ['PLY-0009', 'Leo', 'Grant', '2018-06-12', 'FAM-05', 'U8', 'Westbrook Primary', 'Year 3', 'not_confirmed', 'none', 'yes', 'Active'],
    ['PLY-0010', 'Mia', 'Dawson', '2018-10-19', 'FAM-06', 'U8', 'Riverside Academy', 'Year 3', 'none', 'none', 'yes', 'Trial'],
    ['PLY-0011', 'Oscar', 'Bennett', '2016-03-04', 'FAM-07', 'U9/10', 'Riverside Academy', 'Year 5', 'none', 'none', 'yes', 'Active'],
    ['PLY-0012', 'Lily', 'Bennett', '2014-07-29', 'FAM-07', 'U12', 'Northgate School', 'Year 7', 'none', 'none', 'yes', 'Active'],
    ['PLY-0013', 'Harry', 'Moss', '2017-02-11', 'FAM-08', 'U9/10', 'Westbrook Primary', 'Year 4', 'details', 'none', 'yes', 'Active'],
    ['PLY-0014', 'Theo', 'Patel', '2016-10-30', 'FAM-09', 'U9/10', 'Ashby Vale Primary', 'Year 5', 'none', 'details', 'yes', 'Active'],
    ['PLY-0015', 'Kai', 'Patel', '2014-02-23', 'FAM-09', 'U12', 'Hollins Park School', 'Year 7', 'none', 'none', 'no', 'Active'],
    ['PLY-0016', 'Jack', 'Ellis', '2016-12-09', 'FAM-10', 'U9/10', 'Westbrook Primary', 'Year 4', 'none', 'none', 'yes', 'Active'],
    ['PLY-0017', 'Evie', 'Shah', '2017-05-01', 'FAM-11', 'U9/10', 'Riverside Academy', 'Year 4', 'details', 'none', 'yes', 'Active'],
    ['PLY-0018', 'Zara', 'Shah', '2014-09-14', 'FAM-11', 'U12', 'Northgate School', 'Year 7', 'none', 'none', 'yes', 'Active'],
    ['PLY-0019', 'George', 'Hunt', '2016-01-27', 'FAM-12', 'U9/10', 'Ashby Vale Primary', 'Year 5', 'none', 'none', 'yes', 'Active'],
    ['PLY-0020', 'Max', 'Fielding', '2014-01-05', 'FAM-13', 'U12', 'Hollins Park School', 'Year 7', 'none', 'none', 'yes', 'Active'],
    ['PLY-0021', 'Sam', 'Doyle', '2014-11-18', 'FAM-14', 'U12', 'Northgate School', 'Year 7', 'none', 'none', 'yes', 'Active'],
    ['PLY-0022', 'Finley', 'Doyle', '2012-06-06', 'FAM-14', 'U13/14', 'Hollins Park School', 'Year 9', 'none', 'none', 'yes', 'Active'],
    ['PLY-0023', 'Ella', 'Walsh', '2015-03-22', 'FAM-15', 'U12', 'Northgate School', 'Year 6', 'none', 'none', 'yes', 'Active'],
    ['PLY-0024', 'Amelia', 'Walsh', '2013-01-30', 'FAM-15', 'U13/14', 'Hollins Park School', 'Year 8', 'none', 'none', 'yes', 'Active'],
    ['PLY-0025', 'Jayden', 'Moore', '2012-09-09', 'FAM-16', 'U13/14', 'Hollins Park School', 'Year 9', 'none', 'none', 'yes', 'Active'],
    ['PLY-0026', 'Sophie', 'Moore', '2013-04-15', 'FAM-16', 'U13/14', 'Hollins Park School', 'Year 8', 'none', 'none', 'yes', 'Active']
  ];
  var streets = ['Orchard Way', 'Mill Lane', 'Chapel Road', 'Beech Grove', 'Station Road', 'Elm Close', 'Kingfisher Drive', 'Meadow View'];
  var medicalText = { 'PLY-0002': 'Mild asthma. Blue inhaler in kit bag; use before warm-up if wheezy.', 'PLY-0013': 'Asthma. Inhaler carried by parent at pitch side.', 'PLY-0017': 'Nut allergy (severe). EpiPen in bag front pocket. Coach trained 2026.' };
  var supportText = { 'PLY-0014': 'ADHD. Benefits from clear one-step instructions and a named job in drills.' };
  D.players = P.map(function (r, i) {
    var fam = D.families.filter(function (f) { return f.id === r[4]; })[0];
    var par = D.parents.filter(function (p) { return p.family === r[4]; });
    return {
      id: r[0], first: r[1], last: r[2], name: r[1] + ' ' + r[2], dob: r[3], family: r[4], ageGroup: r[5], school: r[6], year: r[7],
      address: (10 + i * 3) + ' ' + streets[i % streets.length] + ', Westbrook WB' + (1 + i % 6) + ' ' + (2 + i % 7) + 'QX',
      medical: r[8], medicalDetail: medicalText[r[0]] || '', support: r[9], supportDetail: supportText[r[0]] || '', photo: r[10], status: r[11],
      emergency: [{ name: par[0].name, rel: par[0].relationship, phone: par[0].phone }, { name: ['Grandparent', 'Aunt', 'Neighbour'][i % 3] + ' · ' + ['Pat', 'Jo', 'Chris'][i % 3] + ' ' + r[2], rel: ['Grandparent', 'Aunt', 'Neighbour'][i % 3], phone: '07700 900' + (400 + i) }],
      joined: i % 4 === 0 ? '2024-09-05' : i % 4 === 1 ? '2025-01-09' : i % 4 === 2 ? '2025-09-04' : '2026-04-16'
    };
  });
  function by(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }

  /* The signed-in parent in the Parent hub is Sarah Whitfield (FAM-01). */
  D.parent.id = 'PAR-01'; D.parent.family = 'FAM-01';

  var db = Hub.db;
  db.getCoaches = function () { return D.coachList; };
  db.getCoach = function (key) { return D.coaches[key] || D.coachList.filter(function (c) { return c.code === key; })[0]; };
  db.coachName = function (key) { return (D.coaches[key] || {}).name || key; };
  db.getFamilies = function () { return D.families; };
  db.getFamily = function (id) { return by(D.families, id); };
  db.getParents = function () { return D.parents; };
  db.getParent = function (id) { return by(D.parents, id); };
  db.getFamilyParents = function (fid) { return D.parents.filter(function (p) { return p.family === fid; }); };
  db.getPlayers = function (f) { return f ? D.players.filter(f) : D.players; };
  db.getPlayer = function (id) { return by(D.players, id); };
  db.getFamilyPlayers = function (fid) { return D.players.filter(function (p) { return p.family === fid; }); };
  db.addPlayer = function (p) { D.players.push(p); return p; };
  db.addParent = function (p) { D.parents.push(p); return p; };
  db.addFamily = function (f) { D.families.push(f); return f; };
  db.updatePlayer = function (id, patch) { return Object.assign(by(D.players, id), patch); };
})();
