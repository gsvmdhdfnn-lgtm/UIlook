/* Players & Parents, families, memberships, requests, bookings,
   commercial setup, adjustments and history (pass 12). Everything reads and
   writes through Hub.db; changes stay in memory and are recorded with
   Hub.mutate and K.log. Sensitive details go through K.restricted. */
(function () {
  var K = Hub.kit, db = Hub.db, ui = Hub.ui, I = Hub.icon, esc = ui.esc;
  var AREA = 'Players & Parents';
  function client() { return Hub.brand.terms.client || 'Parent'; }
  var MED = { not_confirmed: 'Not confirmed', none: 'Confirmed none', details: 'Has details' };
  var SUP = { none: 'None recorded', details: 'Has details' };
  var PHOTO = { unknown: 'Unknown', yes: 'Yes', no: 'No' };
  var MED_TONE = { not_confirmed: 'warn', none: 'ok', details: 'info' };
  var STATES = ['Active', 'Paused', 'Cancellation Pending', 'Ending Scheduled', 'Ended'];

  /* ---------- Routes ---------- */
  [['mgmt-players', 'Players & Parents'], ['mgmt-players-list', 'Players'], ['mgmt-player', 'Player'], ['mgmt-parents', 'Parents'], ['mgmt-parent', 'Parent'],
    ['mgmt-families', 'Families'], ['mgmt-family', 'Family'], ['mgmt-memberships', 'Memberships'], ['mgmt-membership', 'Membership'], ['mgmt-requests', 'Requests'],
    ['mgmt-session-requests', 'Session requests'], ['mgmt-player-migration', 'Move players onto sessions']].forEach(function (r) { K.route(r[0], { title: r[1], parent: 'home' }); });
  [['mgmt-bookings', 'Bookings'], ['mgmt-booking', 'Booking'], ['mgmt-commercial', 'Prices and policies'], ['mgmt-adjustments', 'Charges and credits'], ['mgmt-audit', 'History']].forEach(function (r) { K.route(r[0], { title: r[1], parent: 'more' }); });
  K.route('mgmt-players', { title: 'Players & Parents', parent: 'home' });
  K.route('mgmt-parents', { title: function () { return client() + 's'; }, parent: 'home' });
  K.route('mgmt-parent', { title: function () { return client(); }, parent: 'home' });

  /* ---------- Small helpers ---------- */
  function player(id) { return db.getPlayer(id) || { id: id, name: id }; }
  function pLink(id) { var p = db.getPlayer(id); return p ? K.link('mgmt-player/' + id, p.name) : '—'; }
  function parLink(id) { var p = db.getParent(id); return p ? K.link('mgmt-parent/' + id, p.name) : '—'; }
  function famLink(id) { var f = db.getFamily(id); return f ? K.link('mgmt-family/' + id, f.name) : '—'; }
  function sesName(id) { var s = db.getSession(id); return s ? s.name : '—'; }
  function sesLink(id) { var s = db.getSession(id); return s ? K.link('mgmt-session/' + id, s.name) : '—'; }
  function age(dob) { var a = K.parse(dob), n = K.parse(K.today), y = n.getFullYear() - a.getFullYear(); if (n.getMonth() < a.getMonth() || (n.getMonth() === a.getMonth() && n.getDate() < a.getDate())) y--; return y; }
  function tbl(o) { return '<div class="pp-t">' + K.table(o) + '</div>'; }
  function stampOf(verb, who, at) { return who && at ? K.stamp(verb, who, at) : ''; }
  function amountLabel(a) { return (a.kind === 'Credit' ? '−' : '') + K.money(a.amount); }
  function linkState(p) { return p.link.ended ? 'Ended' : p.link.invite; }
  function familyCreditLeft(fid) { return K.sum(db.getFamilyCredits(fid), 'remaining'); }
  function entityLink(e) {
    var id = String(e || ''), m = { PLY: 'mgmt-player/', PAR: 'mgmt-parent/', FAM: 'mgmt-family/', MEM: 'mgmt-membership/', BKG: 'mgmt-booking/' }[id.slice(0, 3)];
    if (m && /^[A-Z]{3}-[0-9]+$/.test(id)) return K.link(m + id, id);
    if (id.indexOf('REQ-') === 0) return K.link('mgmt-requests', id);
    if (id.indexOf('ADJ-') === 0) return K.link('mgmt-adjustments', id);
    return id ? esc(id) : '—';
  }
  function search(key, ph) {
    return '<label class="search pp-search">' + I('search') + '<span class="visually-hidden">' + esc(ph) + '</span><input class="input" type="search" data-pp-search="' + key + '" value="' + esc(Q[key] || '') + '" placeholder="' + esc(ph) + '" autocomplete="off"></label>';
  }
  function select(key, label, opts) {
    return '<label class="lx-select"><span class="visually-hidden">' + esc(label) + '</span>' + I('filter', 'icon-sm') + '<select data-pp-filter="' + key + '">' + opts.map(function (o) {
      o = Array.isArray(o) ? o : [o, o]; return '<option value="' + esc(o[0]) + '"' + (String(Q[key]) === String(o[0]) ? ' selected' : '') + '>' + esc(o[1]) + '</option>';
    }).join('') + '</select>' + I('chevronDown', 'icon-sm') + '</label>';
  }
  function match(q, parts) { q = String(q || '').trim().toLowerCase(); return !q || parts.join(' ').toLowerCase().indexOf(q) >= 0; }
  function mutate(fn, toast, summary, entity, extra) { Hub.closeSheet(true); return Hub.mutate(fn, toast, Object.assign({ area: AREA, summary: summary, entity: entity }, extra || {})); }
  function emptyNote(icon, title, body) { return '<div class="zone-inset">' + ui.empty(icon, title, body) + '</div>'; }
  function noteBox(text) { return '<p class="k-note pp-note">' + I('info', 'icon-sm') + '<span>' + text + '</span></p>'; }

  /* Filters and search keep their values while you move around. */
  var Q = { players: '', parents: '', families: '', age: 'All', flag: 'All', reqType: 'All', auditArea: 'All' };
  document.addEventListener('input', function (e) {
    var k = e.target.getAttribute && e.target.getAttribute('data-pp-search'); if (!k) return;
    Q[k] = e.target.value; var pos = e.target.selectionStart; Hub.render();
    var el = document.querySelector('[data-pp-search="' + k + '"]'); if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (x) {} }
  });
  document.addEventListener('change', function (e) {
    var k = e.target.getAttribute && e.target.getAttribute('data-pp-filter'); if (!k) return;
    Q[k] = e.target.value; Hub.render();
  });

  /* "View as" preview: shows what a lead coach or coach would see of the
     restricted details. It only changes this preview, never access. */
  function viewAs() { return K.tab('pp-viewas', [{ id: 'management' }, { id: 'lead' }, { id: 'coach' }]); }
  function restr(allow, html, what) {
    var v = viewAs();
    if (v === 'management' || K.viewer().role !== 'management') return K.restricted(allow, html, what);
    var S = Hub.state, area = S.area, role = S.coachRole;
    S.area = 'staff'; S.coachRole = v;
    try { return K.restricted(allow, html, what); } finally { S.area = area; S.coachRole = role; }
  }
  var VIEW_AS = [{ id: 'management', label: 'Management' }, { id: 'lead', label: 'Lead coach' }, { id: 'coach', label: 'Coach' }];
  function viewAsBar() { return '<div class="pp-viewas"><span>' + I('shield', 'icon-sm') + 'Preview restricted details as</span>' + K.seg('pp-viewas', VIEW_AS) + '</div>'; }

  function areaCard(o) {
    return '<a class="lx-area" href="#' + o.route + '"><span class="lx-area__top"><span class="lx-area__icon">' + I(o.icon) + '</span>' + I('arrowRight', 'icon-sm lx-area__go') + '</span>' +
      '<span class="lx-area__title">' + esc(o.title) + '</span><span class="lx-area__desc">' + esc(o.desc) + '</span><span class="lx-area__cta">' + esc(o.cta) + I('arrowRight', 'icon-sm') + '</span></a>';
  }

  /* ================================================================ HUB */
  /* Players & Parents: one compact working view. Players by default, parents
     one tap away, search across both, and a shortcut into the same master
     Needs attention list (filtered to this area), never a separate queue. */
  var ppQuery = '';
  document.addEventListener('input', function (e) {
    if (!e.target.matches || !e.target.matches('[data-pp-search]')) return;
    ppQuery = e.target.value.trim().toLowerCase(); var shown = 0;
    document.querySelectorAll('[data-pp]').forEach(function (el) { var hit = !ppQuery || el.getAttribute('data-pp').indexOf(ppQuery) >= 0; el.hidden = !hit; if (hit) shown++; });
    var none = document.querySelector('.pp-none'); if (none) none.hidden = shown > 0;
  });
  Hub.screens['mgmt-players'] = function (ctx) {
    var c = client();
    var h = K.head({ back: ['mgmt-home', 'Home'], eyebrow: 'Home', title: 'Players & Parents', sub: 'Find a player or parent, then do what you need from their page.',
      actions: K.actBtn('Add a player or family', 'pp-add', {}, { variant: 'primary', icon: 'plus' }) });
    var g = K.guard(ctx, h, { empty: ['players', 'No players yet', 'Players appear here once families sign up or are moved across.'] }); if (g) return g;
    var F = db.getPlayerFigures();
    var need = db.getAttentionCases().filter(function (k) { return k.category === 'Players & Parents'; }).length;
    var counts = '<div class="pp-counts">' +
      '<span class="pp-count"><b class="num">' + F.active + '</b> active players' + (F.trial ? ' · ' + F.trial + ' on trial' : '') + '</span>' +
      '<span class="pp-count"><b class="num">' + F.parents + '</b> ' + c.toLowerCase() + 's</span>' +
      '<button type="button" class="pp-count pp-count--act' + (need ? ' is-on' : '') + '" data-action="attn-area" data-area="Players & Parents"><b class="num">' + need + '</b> need action' + I('arrowRight', 'icon-sm') + '</button></div>';
    var tab = K.tab('pp-land', [{ id: 'players' }, { id: 'parents' }]);
    var seg = K.seg('pp-land', [{ id: 'players', label: 'Players' }, { id: 'parents', label: c + 's' }]);
    var search = '<label class="search pp-search"><span class="visually-hidden">Search</span>' + I('search') + '<input class="input" data-pp-search placeholder="' + (tab === 'players' ? 'Search players by name, age group or school' : 'Search ' + c.toLowerCase() + 's by name or child') + '" value="' + esc(ppQuery) + '"></label>';
    function match(key) { return !ppQuery || key.indexOf(ppQuery) >= 0; }
    var rows, key;
    if (tab === 'players') {
      rows = db.getPlayers(function (p) { return p.status !== 'Inactive'; }).map(function (p) {
        var where = db.getPlayerMemberships(p.id).filter(function (m) { return m.state !== 'Ended'; }).map(function (m) { return db.getSession(m.session).name; });
        key = (p.name + ' ' + p.ageGroup + ' ' + p.school + ' ' + where.join(' ')).toLowerCase();
        var flags = (p.status === 'Trial' ? K.pill('Trial', 'info') : '') + (p.medical === 'not_confirmed' ? K.pill('Medical to confirm', 'warn') : '');
        return ui.row({ lead: ui.avatar(p.name, 'md'), title: esc(p.name), sub: [esc(p.ageGroup || 'Age group to set'), esc(where.join(', ') || 'Not on a session yet')], href: '#mgmt-player/' + p.id, trail: flags })
          .replace('<a ', '<a data-pp="' + esc(key) + '"' + (match(key) ? '' : ' hidden') + ' ');
      });
    } else {
      rows = db.getParents().filter(function (p) { return !p.link.ended; }).map(function (p) {
        var kids = db.getFamilyPlayers(p.family).map(function (x) { return x.first; });
        key = (p.name + ' ' + p.email + ' ' + kids.join(' ')).toLowerCase();
        var flag = p.link.invite === 'Invite sent' ? K.pill('Invite not accepted', 'warn') : '';
        return ui.row({ lead: ui.avatar(p.name, 'md'), title: esc(p.name), sub: [kids.length ? 'Parent of ' + esc(kids.join(' and ')) : 'No children linked', esc(p.relationship)], href: '#mgmt-parent/' + p.id, trail: flag })
          .replace('<a ', '<a data-pp="' + esc(key) + '"' + (match(key) ? '' : ' hidden') + ' ');
      });
    }
    var anyShown = rows.some(function (r) { return r.indexOf(' hidden ') < 0; });
    var list = K.list(rows) + '<p class="k-note pp-none"' + (anyShown ? ' hidden' : '') + '>Nobody matches this search.</p>';
    var claims = (db.getApprovals().filter(function (a) { return a.id === 'parent-claims'; })[0] || { count: 0 }).count;
    var mems = db.getMemberships(), bookings = db.getBookings();
    var more = K.moreIn('More in Players & Parents', [
      ['Families and memberships', [{ route: 'mgmt-families', icon: 'family', title: 'Families', desc: 'Status, reviews and family credits', count: F.families },
        { route: 'mgmt-memberships', icon: 'calendar', title: 'Memberships', desc: 'Pauses, cancellations and notice', count: mems.filter(function (m) { return m.state === 'Active'; }).length },
        { route: 'mgmt-player-migration', icon: 'move', title: 'Move players onto sessions', desc: 'Players not yet on a session', count: db.getMigrationCandidates().length }]],
      ['Requests and sign-ups', [{ route: 'mgmt-requests', icon: 'inbox', title: 'Requests', desc: 'Pauses, cancellations and detail changes', count: F.openRequests },
        { route: 'mgmt-parent-claims', icon: 'link', title: 'Parent claims', desc: 'Parents asking to link to a child', count: claims },
        { route: 'mgmt-trial-leads', icon: 'whistle', title: 'Trial interest', desc: 'Free sessions, trials and waitlist requests' },
        { route: 'mgmt-session-requests', icon: 'calendar', title: 'Session requests', desc: 'Parents asking for a weekly place' }]],
      ['Bookings and charges', [{ route: 'mgmt-bookings', icon: 'card', title: 'Bookings', desc: 'Camps, events and tours', count: bookings.length },
        { route: 'mgmt-adjustments', icon: 'finance', title: 'Charges and credits', desc: 'One-off charges and goodwill credits', count: db.getAdjustments().length },
        { route: 'mgmt-commercial', icon: 'settings', title: 'Prices and policies', desc: 'Discounts, refunds, packages and terms' },
        { route: 'mgmt-players-list', icon: 'filter', title: 'Players with filters', desc: 'Medical, permissions, inactive players' },
        { route: 'mgmt-audit', icon: 'clock', title: 'History', desc: 'Who changed what, and when' }]]
    ]);
    return K.page(h, counts + '<div class="pp-bar">' + seg + search + '</div>' + list + more);
  };

  /* New families join through the public site (child matched, never by name alone);
     existing players are put onto a session from here. */
  Hub.actions['pp-add'] = function () {
    K.sheet({ overline: '<span class="overline">Players & Parents</span>', title: 'Add a player or family', body:
      '<p class="k-note">New families sign up themselves on the public site, then we match their child so details are never linked on a name alone.</p>' +
      K.list([ui.row({ lead: I('link', 'row-glyph'), title: 'Send a family the sign-up link', sub: ['They choose a session, create an account and add their child'], action: 'pp-add-link', trail: '' }),
        ui.row({ lead: I('move', 'row-glyph'), title: 'Put an existing player onto a session', sub: [db.getMigrationCandidates().length + ' players are not on a session yet'], href: '#mgmt-player-migration' }),
        ui.row({ lead: I('external', 'row-glyph'), title: 'See what families see', sub: ['The public site, where sign-up starts'], href: '#pub-offers' })]) });
  };
  Hub.actions['pp-add-link'] = function () { Hub.closeSheet(true); Hub.mutate(null, 'Sign-up link copied', { area: 'Players', summary: 'Sign-up link copied to send to a family' }); };

  /* ================================================================ PLAYERS LIST */
  Hub.screens['mgmt-players-list'] = function (ctx) {
    var h = K.head({ back: ['mgmt-players', 'Players & Parents'], eyebrow: 'Players & Parents', title: 'Players', sub: 'Search by name, school or family. Inactive players are kept for history.',
      actions: K.goBtn('Move players onto sessions', 'mgmt-player-migration', { variant: 'secondary', icon: 'move' }) });
    var g = K.guard(ctx, h, { empty: ['players', 'No players yet', 'Players appear here once families sign up.'] }); if (g) return g;
    var st = K.tab('pp-pstatus', [{ id: 'Active' }, { id: 'Trial' }, { id: 'Inactive' }, { id: 'All' }]);
    var all = db.getPlayers();
    var groups = ['All'].concat(all.map(function (p) { return p.ageGroup; }).filter(function (v, i, a) { return a.indexOf(v) === i; }));
    var list = all.filter(function (p) {
      if (st !== 'All' && p.status !== st) return false;
      if (Q.age !== 'All' && p.ageGroup !== Q.age) return false;
      if (Q.flag === 'medical' && p.medical !== 'not_confirmed') return false;
      if (Q.flag === 'details' && p.medical !== 'details' && p.support !== 'details') return false;
      if (Q.flag === 'photo' && p.photo !== 'yes') return false;
      if (Q.flag === 'nophoto' && p.photo === 'yes') return false;
      return match(Q.players, [p.name, p.id, p.school, db.getFamily(p.family).name]);
    });
    function count(s) { return all.filter(function (p) { return s === 'All' || p.status === s; }).length; }
    var bar = '<div class="lx-filterbar pp-filters">' + search('players', 'Search players') + K.seg('pp-pstatus', ['Active', 'Trial', 'Inactive', 'All'].map(function (s) { return { id: s, label: s + ' (' + count(s) + ')' }; })) +
      select('age', 'Age group', groups.map(function (x) { return [x, x === 'All' ? 'All age groups' : x]; })) +
      select('flag', 'Care and permissions', [['All', 'Any care or permission'], ['medical', 'Medical not confirmed'], ['details', 'Has medical or support details'], ['photo', 'Photo permission: yes'], ['nophoto', 'Photo permission: no or unknown']]) + '</div>';
    var rows = list.map(function (p) {
      var sess = db.getPlayerMemberships(p.id).filter(function (m) { return m.state !== 'Ended'; }).map(function (m) { return sesName(m.session); }).join(', ');
      return { route: 'mgmt-player/' + p.id, label: 'Open ' + p.name, cells: [
        K.cell(esc(p.name), K.id(p.id) + ' · ' + esc(p.ageGroup) + ' · ' + esc(p.school)),
        { cls: 'wide c-cell', html: esc(db.getFamily(p.family).name) },
        { cls: 'wide c-cell', html: sess ? esc(sess) : '<span class="c-mute">Not on a session</span>' },
        { cls: 'wide', html: K.pill(MED[p.medical], MED_TONE[p.medical]) },
        { cls: 'wide', html: K.status(PHOTO[p.photo]) },
        { cls: 'c-end', html: K.status(p.status) }] };
    });
    return K.page(h, bar + '<p class="k-note">' + list.length + ' of ' + all.length + ' players</p>' + tbl({ cols: 'minmax(0,1.6fr) minmax(0,1fr) minmax(0,1.2fr) 130px 90px 90px', head: ['Player', { label: 'Family', cls: 'wide' }, { label: 'Sessions', cls: 'wide' }, { label: 'Medical', cls: 'wide' }, { label: 'Photo', cls: 'wide' }, { label: 'Status', cls: 'c-end' }], rows: rows, empty: 'No players match this search.' }));
  };

  /* ================================================================ PLAYER PROFILE */
  function feedbackFor(pid) { try { return db.getFeedback ? db.getFeedback(pid) || [] : []; } catch (e) { return []; } }
  function plansFor(pid) { try { return db.getIdps ? db.getIdps(pid) || [] : []; } catch (e) { return []; } }

  Hub.screens['mgmt-player'] = function (ctx) {
    var p = db.getPlayer(ctx.param);
    var h0 = K.head({ back: ['mgmt-players', 'Players & Parents'], eyebrow: 'Player', title: p ? p.name : 'Player' });
    var g = K.guard(ctx, h0, { empty: ['players', 'No player details', 'This player has no details yet.'] }); if (g) return g;
    if (!p) return K.page(h0, emptyNote('players', 'Player not found', 'Check the link or search the players list.'));
    Hub.crumbTail = p.name;
    var fam = db.getFamily(p.family), parents = db.getFamilyParents(p.family);
    var tabsList = [{ id: 'overview', label: 'Overview' }, { id: 'development', label: 'Development' }, { id: 'attendance', label: 'Attendance' }, { id: 'money', label: 'Memberships & bookings' }, { id: 'history', label: 'History' }];
    var tab = K.tab('pp-player', tabsList);
    var acts = [];
    var h = K.head({ back: ['mgmt-players', 'Players & Parents'], eyebrow: 'Player', title: p.name,
      sub: esc(p.ageGroup) + ' · ' + esc(p.school) + ', ' + esc(p.year) + ' · ' + famLink(p.family) + ' · ' + K.status(p.status), actions: acts.join(''), tabs: K.tabs('pp-player', tabsList) });
    var body = '';
    if (tab === 'overview') {
      var details = K.card({ title: 'Details', body: K.kv([['Date of birth', K.d(p.dob) + ' <span class="text-3">(age ' + age(p.dob) + ')</span>'], ['School and year', esc(p.school) + ', ' + esc(p.year)], ['Age group', esc(p.ageGroup)], ['Status', K.status(p.status)],
        ['Joined', K.d(p.joined)], p.leftOn ? ['Left', K.d(p.leftOn)] : null, ['Family', famLink(p.family) + ' ' + K.status(fam.status)],
        [client() + 's', parents.map(function (x) { return parLink(x.id) + (x.link.ended ? ' <span class="text-3">(link ended)</span>' : ''); }).join('<br>')],
        p.imported ? ['Imported', esc(p.imported.note) + '<br>' + K.stamp('Imported', p.imported.by, p.imported.at)] : null], true) });
      var care = K.card({ title: 'Care and permissions', sub: 'States are visible to coaches; details stay restricted.', body:
        '<div class="pp-care">' +
        '<div class="pp-care__row"><span>Medical</span>' + K.pill(MED[p.medical], MED_TONE[p.medical]) + (p.medicalConfirmed ? K.stamp('Confirmed', p.medicalConfirmed.by, p.medicalConfirmed.at) : '<span class="k-note">Not confirmed by the family yet</span>') + '</div>' +
        (p.medical === 'details' ? restr(['management', 'parent', 'coach:lead'], '<p class="pp-p">' + esc(p.medicalDetail) + '</p>', 'Medical details') : '') +
        '<div class="pp-care__row"><span>Support needs</span>' + K.pill(SUP[p.support] || 'None recorded', p.support === 'details' ? 'info' : '') + '</div>' +
        (p.support === 'details' ? restr(['management', 'parent', 'coach:lead'], '<p class="pp-p">' + esc(p.supportDetail) + '</p>', 'Support details') : '') +
        '<div class="pp-care__row"><span>Photo and video</span>' + K.status(PHOTO[p.photo]) + (p.photoAnswered ? K.stamp('Answered', p.photoAnswered.by, p.photoAnswered.at) : '<span class="k-note">No answer yet: do not photograph</span>') + '</div>' +
        '</div>' });
      var medNeeded = p.medical === 'not_confirmed' && p.status === 'Active';
      var sit = p.status !== 'Active' ? K.situation({ tone: 'info', title: p.first + ' is ' + esc(String(p.status).toLowerCase()), text: p.leftOn ? 'Left on ' + K.d(p.leftOn) + '. Records are kept.' : 'Not on any active session.' }) :
        medNeeded ? K.situation({ tone: 'warn', kicker: 'Before ' + p.first + ' plays', title: 'Medical details not confirmed', text: 'The family has not confirmed ' + p.first + '’s medical details. Ask them to confirm in the Parent hub, or record a phone confirmation.', primary: K.actBtn('Send reminder', 'pp-med-remind', { id: p.id }, { variant: 'primary', icon: 'bell' }), secondary: K.actBtn('Record phone confirmation', 'pp-med-confirm', { id: p.id }, { variant: 'secondary' }) }) :
        !p.photoAnswered ? K.situation({ tone: 'info', title: 'No photo answer yet', text: 'Do not photograph or film ' + p.first + ' until the family answers.' }) : '';
      var address = K.card({ title: 'Home address', body: restr(['management', 'parent'], '<p class="pp-p">' + esc(p.address) + '</p>', 'Address') });
      var contacts = K.card({ title: 'Emergency contacts', body: restr(['management', 'parent', 'coach:lead'], ui.fields(p.emergency.map(function (c, i) { return [(i + 1) + '. ' + c.rel, esc(c.name) + '<br><span class="num">' + esc(c.phone) + '</span>']; })), 'Emergency contacts') });
      /* Overview first: what needs doing, where they play, who their parents are, how it is going */
      var mems = db.getPlayerMemberships(p.id).filter(function (m) { return m.state !== 'Ended'; });
      var att = db.getPlayerAttendance(p.id), pres = att.filter(function (a) { return a.mark === 'Present' || a.mark === 'Late'; }).length, fb0 = feedbackFor(p.id)[0];
      var live = parents.filter(function (x) { return !x.link.ended; });
      var snap = K.snap([
        ['Plays at', mems.length ? mems.map(function (m) { return esc(db.getSession(m.session).name); }).join(', ') : 'Not on a session yet', mems.map(function (m) { return m.state === 'Active' ? '' : esc(m.state); }).filter(Boolean).join(' · ') || (mems.length ? 'Membership active' : '')],
        [client() + 's', live.map(function (x) { return parLink(x.id); }).join(', ') || 'None linked', live.map(function (x) { return x.link.invite === 'Verified' ? 'Verified' : esc(x.link.invite || ''); }).join(' · ')],
        ['How it is going', att.length ? Math.round(pres / att.length * 100) + '% attendance' : 'No registers yet', fb0 ? 'Latest feedback ' + esc(fb0.period || '') + ' from ' + esc(db.coachName(fb0.coach)) : 'No feedback yet']
      ]);
      var also = K.needsFor(function (k) { return K.relatesTo(k, 'player', p.id) && !(medNeeded && k.ruleId === 'ATT-050'); }, { title: sit ? 'Also needs you' : 'Needs you for ' + p.first, quiet: true });
      if (!sit && !also) sit = K.situation({ tone: 'ok', title: p.first + ' is all set', text: 'Medical confirmed, photo answer given and nothing waiting.' });
      body = sit + also + snap + K.grid([care, details], 2) + K.details('Address and emergency contacts', viewAsBar() + K.grid([address, contacts], 2), { sub: 'Restricted' });
    } else if (tab === 'development') {
      var fb = feedbackFor(p.id), plans = plansFor(p.id);
      var fbHtml = fb.length ? K.list(fb.map(function (f) {
        return ui.row({ lead: I('chat', 'row-glyph'), title: esc(f.period || 'Feedback') + ' · ' + esc(db.coachName(f.coach)), sub: [esc(f.keepDoing || f.general || ''), f.focus ? 'Focus: ' + esc(f.focus) : ''], href: '#mgmt-feedback-review/' + f.id, trail: K.status(f.status) });
      })) : emptyNote('chat', 'No feedback yet', 'Coach feedback for ' + p.first + ' appears here once a coach writes it.');
      var plHtml = plans.length ? K.list(plans.map(function (x) {
        return ui.row({ lead: I('development', 'row-glyph'), title: esc(K.label('Development plan')) + ' · ' + esc(db.coachName(x.coach)), sub: [(x.targets || []).length + ' targets', x.updatedAt ? 'Updated ' + K.dt(x.updatedAt) + ' by ' + esc(x.updatedBy) : ''], href: '#mgmt-idps', trail: K.status(x.status) });
      })) : emptyNote('development', 'No ' + K.label('Development plan').toLowerCase() + ' yet', 'Plans are created for each review period.');
      body = K.section('Feedback', 'From coaches, newest first.', fbHtml) + K.section(K.label('IDPs'), 'Development plans and their targets.', plHtml);
    } else if (tab === 'attendance') {
      var att = db.getPlayerAttendance(p.id), n = function (m) { return att.filter(function (a) { return a.mark === m; }).length; };
      var counted = att.length, present = n('Present') + n('Late');
      body = K.stats([{ label: 'Sessions marked', value: counted }, { label: 'Present or late', value: present, sub: counted ? Math.round(present / counted * 100) + '% attendance' : '' }, { label: 'Absent', value: n('Absent') }, { label: 'Excused', value: n('Excused') }]) +
        K.section('Register marks', 'From completed and in-progress registers.', tbl({ cols: '120px minmax(0,1.4fr) 110px minmax(0,1fr)', head: ['Date', 'Session', { label: 'Mark', cls: 'c-end' }, { label: 'Recorded', cls: 'wide' }],
          rows: att.map(function (a) { return { route: 'mgmt-register/' + a.occurrence.id, cells: [{ html: K.dd(a.occurrence.date) }, K.cell(esc(a.occurrence.session), esc(a.occurrence.start) + ' · ' + esc(db.venueName(a.occurrence.venue))), { cls: 'c-end', html: K.status(a.mark) }, { cls: 'wide c-cell', html: esc(a.by) + ', ' + esc(K.dt(a.at)) }] }; }),
          empty: p.first + ' has no register marks yet.' }));
    } else if (tab === 'money') {
      var mems = db.getPlayerMemberships(p.id), bks = db.getPlayerBookings(p.id), credits = db.getFamilyCredits(p.family);
      body = K.section('Memberships', null, membershipTable(mems, true)) +
        K.section('Bookings', null, tbl({ cols: 'minmax(0,1.6fr) minmax(0,1fr) 110px', head: ['Booking', { label: 'Lines for ' + p.first, cls: 'wide' }, { label: 'Status', cls: 'c-end' }],
          rows: bks.map(function (b) { var ls = b.lines.filter(function (l) { return l.player === p.id; }); return { route: 'mgmt-booking/' + b.id, cells: [K.cell(esc(b.product), K.id(b.id) + ' · ' + K.dt(b.at)), { cls: 'wide c-cell', html: ls.map(function (l) { return esc(l.tier) + ' · ' + K.money(l.final); }).join(', ') }, { cls: 'c-end', html: K.status(b.state) }] }; }), empty: 'No bookings.' })) +
        K.section('Family credits', 'Shared across the ' + esc(db.getFamily(p.family).name) + '.', tbl({ cols: 'minmax(0,1.6fr) 110px 110px', head: ['Credit', { label: 'Amount', cls: 'c-num wide' }, { label: 'Remaining', cls: 'c-num' }],
          rows: credits.map(function (c) { return { cells: [K.cell(esc(c.source), K.id(c.id) + ' · ' + esc(c.by) + ', ' + K.dt(c.at)), { cls: 'c-num wide', html: K.money(c.amount) }, { cls: 'c-num', html: K.money(c.remaining) }] }; }), empty: 'No family credits.' }));
    } else {
      body = K.section('History', 'Changes to ' + p.first + ', newest first. Old and new values stay restricted.', historyList(db.getEntityAudit([p.id].concat(db.getPlayerMemberships(p.id).map(function (m) { return m.id; })))));
    }
    return K.page(h, body);
  };
  Hub.actions['pp-med-remind'] = function (el) {
    var p = player(el.dataset.id), par = db.getFamilyParents(p.family)[0];
    Hub.mutate(null, 'Reminder sent to ' + par.name, { area: AREA, summary: 'Medical details reminder sent to ' + par.name + ' for ' + p.name, entity: p.id });
  };
  Hub.actions['pp-med-confirm'] = function (el) {
    var p = player(el.dataset.id), par = db.getFamilyParents(p.family)[0];
    K.confirm({ title: 'Record medical as "confirmed none"', body: '<p class="k-note">Use this when ' + esc(par.name) + ' has confirmed by phone that ' + esc(p.first) + ' has no medical conditions. It is recorded against your name.</p>', label: 'Record confirmation', action: 'pp-med-confirm-go', data: { 'data-id': p.id } });
  };
  Hub.actions['pp-med-confirm-go'] = function (el) {
    var p = player(el.dataset.id), at = K.now(), who = K.me();
    mutate(function () { db.updatePlayer(p.id, { medical: 'none', medicalConfirmed: { by: who + ' (by phone)', at: at } }); }, 'Medical confirmed for ' + p.name, 'Medical state confirmed as none by phone for ' + p.name, p.id, { before: { medical: 'Not confirmed' }, after: { medical: 'Confirmed none' }, restricted: true, at: at, who: who });
  };

  function historyList(entries) {
    if (!entries.length) return emptyNote('clock', 'No history yet', 'Changes appear here as they happen.');
    return '<div class="lx-card">' + K.timeline(entries.map(function (e) {
      return { text: e.summary, detail: (e.before || e.after) ? '<button type="button" class="k-link pp-linkbtn" data-action="pp-audit" data-id="' + esc(e.id) + '">' + (e.restricted ? 'View restricted details' : 'View before and after') + '</button>' : '', who: e.who, at: e.at, tone: e.finance ? 'info' : '' };
    })) + '</div>';
  }

  /* ================================================================ PARENTS */
  Hub.screens['mgmt-parents'] = function (ctx) {
    var c = client();
    var h = K.head({ back: ['mgmt-players', 'Players & ' + c + 's'], eyebrow: 'Players & ' + c + 's', title: c + 's and guardians', sub: 'Accounts linked to players. Contact priority sets who we call first; it never changes access.' });
    var g = K.guard(ctx, h, { empty: ['family', 'No ' + c.toLowerCase() + 's yet', c + ' accounts appear once families sign up.'] }); if (g) return g;
    var st = K.tab('pp-parstate', [{ id: 'Current' }, { id: 'Invite sent' }, { id: 'Ended' }, { id: 'All' }]);
    var all = db.getParents();
    function inState(p, s) { return s === 'All' || (s === 'Current' ? !p.link.ended : s === 'Ended' ? !!p.link.ended : !p.link.ended && p.link.invite === s); }
    var list = all.filter(function (p) { return inState(p, st) && match(Q.parents, [p.name, p.email, p.id, db.getFamily(p.family).name]); });
    var bar = '<div class="lx-filterbar pp-filters">' + search('parents', 'Search ' + c.toLowerCase() + 's') + K.seg('pp-parstate', ['Current', 'Invite sent', 'Ended', 'All'].map(function (s) { return { id: s, label: s + ' (' + all.filter(function (p) { return inState(p, s); }).length + ')' }; })) + '</div>';
    return K.page(h, bar + tbl({ cols: 'minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr) 80px 120px', head: [c, { label: 'Family', cls: 'wide' }, { label: 'Relationship', cls: 'wide' }, { label: 'Priority', cls: 'wide c-num' }, { label: 'Link', cls: 'c-end' }],
      rows: list.map(function (p) {
        return { route: 'mgmt-parent/' + p.id, label: 'Open ' + p.name, cells: [K.cell(esc(p.name), K.id(p.id) + ' · ' + esc(p.email)), { cls: 'wide c-cell', html: esc(db.getFamily(p.family).name) }, { cls: 'wide c-cell', html: esc(p.relationship) }, { cls: 'wide c-num', html: String(p.priority) }, { cls: 'c-end', html: K.status(linkState(p)) }] };
      }), empty: 'No ' + c.toLowerCase() + 's match.' }));
  };

  Hub.screens['mgmt-parent'] = function (ctx) {
    var c = client(), p = db.getParent(ctx.param);
    var h0 = K.head({ back: ['mgmt-players', 'Players & Parents'], eyebrow: c, title: p ? p.name : c });
    var g = K.guard(ctx, h0, { empty: ['family', 'No details', 'This account has no details yet.'] }); if (g) return g;
    if (!p) return K.page(h0, emptyNote('family', c + ' not found', 'Check the link or search the list.'));
    Hub.crumbTail = p.name;
    var L = p.link, acts = [];
    if (!L.ended) acts.push(K.actBtn('End link', 'pp-endlink', { id: p.id }, { variant: 'secondary', icon: 'x' }));
    var h = K.head({ back: ['mgmt-players', 'Players & Parents'], eyebrow: c, title: p.name, sub: esc(p.relationship) + ' · ' + famLink(p.family) + ' · ' + K.status(linkState(p)), actions: acts.join('') });
    var kids = db.getFamilyPlayers(p.family);
    var contact = K.card({ title: 'Contact', body: K.kv([['Email', esc(p.email)], ['Phone', '<span class="num">' + esc(p.phone) + '</span>'], ['Relationship', esc(p.relationship)], ['Contact priority', String(p.priority) + ' <span class="text-3">of ' + db.getFamilyParents(p.family).filter(function (x) { return !x.link.ended; }).length + '</span>']]) +
      noteBox('Contact priority only sets who we call first. Every verified ' + c.toLowerCase() + ' has the same access to their children.') });
    var link = K.card({ title: 'Link to the family', body: K.kv([['Verification method', esc(L.method)], ['Verified at', L.verifiedAt ? K.dt(L.verifiedAt) + (L.verifiedBy ? ' by ' + esc(L.verifiedBy) : '') : '<span class="text-3">Not verified yet</span>'],
      ['Invite status', K.status(L.invite) + (L.invitedAt ? ' <span class="text-3">sent ' + K.dt(L.invitedAt) + (L.resentBy ? ' (resent by ' + esc(L.resentBy) + ')' : '') + '</span>' : '')],
      ['Ended', L.ended ? K.status('Ended') + ' ' + esc(L.ended.reason) + '<br>' + K.stamp('Ended', L.ended.by, L.ended.at) : '<span class="text-3">Active link</span>']]) });
    var children = tbl({ cols: 'minmax(0,1.6fr) 120px 100px', head: ['Player', { label: 'Age group', cls: 'wide' }, { label: 'Status', cls: 'c-end' }],
      rows: kids.map(function (k) { return { route: 'mgmt-player/' + k.id, cells: [K.cell(esc(k.name), K.id(k.id) + ' · ' + esc(k.school)), { cls: 'wide', html: esc(k.ageGroup) }, { cls: 'c-end', html: K.status(k.status) }] }; }), empty: 'No linked players.' });
    var reqs = db.getRequests(function (r) { return r.by === p.id || r.parent === p.id; });
    var acc = db.getTermsAcceptances(function (a) { return a.parent === p.id; });
    var bks = db.getBookings(function (b) { return b.bookedBy === p.id || b.payer === p.id; });
    /* Family first: what needs doing, the children, their places, money and open requests */
    var kidIds = kids.map(function (k) { return k.id; });
    var famMems = db.getMemberships(function (m) { return kidIds.indexOf(m.player) >= 0 && m.state !== 'Ended'; });
    var bill = db.getFamilyBillingSummary ? db.getFamilyBillingSummary(p.family) : null;
    var openReqs = db.getRequests(function (r) { return (r.by === p.id || kidIds.indexOf(r.player) >= 0) && r.status !== 'Resolved' && r.status !== 'Declined'; });
    var snap = K.snap([
      ['Children', kids.map(function (k) { return '<a class="k-link" href="#mgmt-player/' + k.id + '">' + esc(k.first) + '</a>'; }).join(', ') || 'None linked', kids.map(function (k) { return esc(k.ageGroup || ''); }).filter(Boolean).join(' · ')],
      ['Places', famMems.length + ' membership' + (famMems.length === 1 ? '' : 's'), famMems.map(function (m) { return esc(db.getPlayer(m.player).first) + ': ' + esc(db.getSession(m.session).name) + (m.state === 'Active' ? '' : ' (' + esc(m.state.toLowerCase()) + ')'); }).join('<br>')],
      ['Money', bill ? (bill.owed > 0 ? K.money(bill.owed) + ' to pay' : 'Nothing owed') : '—', bill ? (bill.credit > 0 ? K.money(bill.credit) + ' family credit available' : 'No family credit') + (openReqs.length ? '<br>' + openReqs.length + ' open request' + (openReqs.length === 1 ? '' : 's') : '') : '']
    ]);
    var needs = K.needsFor(function (k) { if (openReqs.length && k.ruleId === 'ATT-054') return false; return K.relatesTo(k, 'player', kidIds[0]) || kidIds.some(function (id) { return K.relatesTo(k, 'player', id); }) || (k.route || '').indexOf(p.family) >= 0; }, { title: openReqs.length || L.invite === 'Invite sent' ? 'Also needs you' : 'Needs you for this family' });
    var firstReq = openReqs[0];
    var sit = L.ended ? K.situation({ tone: 'info', title: 'Link to the family ended', text: esc(L.ended.reason || '') + ' ' + K.stamp('Ended', L.ended.by, L.ended.at) }) :
      L.invite === 'Invite sent' ? K.situation({ tone: 'warn', title: 'Invite not accepted yet', text: p.name.split(' ')[0] + ' cannot see the family until the invite is accepted or you verify them another way.', primary: K.actBtn('Resend invite', 'pp-invite', { id: p.id }, { variant: 'primary', icon: 'refresh' }), secondary: K.actBtn('Mark verified', 'pp-verify', { id: p.id }, { variant: 'secondary', icon: 'userCheck' }) }) :
      firstReq ? K.situation({ tone: 'warn', title: firstReq.type === 'Cancellation' ? 'Parent requested cancellation' : openReqs.length + ' request' + (openReqs.length === 1 ? '' : 's') + ' waiting for a decision', text: esc(firstReq.type) + (firstReq.player ? ' for ' + esc(db.getPlayer(firstReq.player).first) : '') + ', ' + K.dm(firstReq.at) + '.', primary: K.actBtn('Review request', 'pp-req', { id: firstReq.id }, { variant: 'primary' }) }) :
      bill && bill.owed > 0 ? K.situation({ tone: 'info', title: K.money(bill.owed) + ' to pay', text: 'Collected on the next billing run unless it becomes overdue.' }) : '';
    if (!sit && !needs) sit = K.situation({ tone: 'ok', title: 'Nothing needs you for this family', text: 'Children, places and payments are all in order.' });
    return K.page(h, sit + needs + snap + K.section('Children', null, children) +
      (openReqs.length ? K.section('Open requests', null, requestTable(openReqs)) : '') +
      K.details('Contact and link to the family', K.grid([contact, link], 2), { sub: esc(p.email) }) +
      K.details('All requests', requestTable(reqs), { sub: reqs.length + ' in total' }) +
      K.details('Bookings', tbl({ cols: 'minmax(0,1.6fr) 110px 100px', head: ['Booking', { label: 'Total', cls: 'c-num wide' }, { label: 'Status', cls: 'c-end' }], rows: bks.map(function (b) { return { route: 'mgmt-booking/' + b.id, cells: [K.cell(esc(b.product), K.id(b.id) + ' · ' + (b.bookedBy === p.id ? 'Booked' : 'Paid') + ' ' + K.dt(b.at)), { cls: 'c-num wide', html: K.money(b.total) }, { cls: 'c-end', html: K.status(b.state) }] }; }), empty: 'No bookings.' }), { sub: bks.length + ' bookings' }) +
      K.details('Terms accepted', tbl({ cols: 'minmax(0,1.4fr) minmax(0,1.2fr) 120px', head: ['Version', { label: 'Evidence', cls: 'wide' }, { label: 'Accepted', cls: 'c-end' }], rows: acc.map(function (a) { var v = db.getTermsVersion(a.version); return { route: 'mgmt-commercial', cells: [K.cell(esc(v.kind) + ' v' + esc(v.version), K.id(v.id)), { cls: 'wide c-cell', html: esc(a.evidence) }, { cls: 'c-end', html: K.dt(a.at) }] }; }), empty: 'No acceptances recorded.' }), { sub: 'Which version was accepted, and when' }) +
      K.details('History', historyList(db.getEntityAudit([p.id]))));
  };
  Hub.actions['pp-invite'] = function (el) { var p = db.getParent(el.dataset.id), at = K.now(), who = K.me(); Hub.mutate(function () { db.resendInvite(p.id, who, at); }, 'Invite resent to ' + p.email, { area: AREA, summary: 'Invite resent to ' + p.name, entity: p.id, at: at, who: who }); };
  Hub.actions['pp-verify'] = function (el) {
    var p = db.getParent(el.dataset.id);
    Hub.openSheet({ title: 'Verify ' + esc(p.name), body: K.form([K.field('How was this checked?', K.select('pp-method', ['Invite accepted; confirmed by management', 'ID checked in person', 'Confirmed by phone with the first ' + client().toLowerCase()], '')), K.field('Note', K.textarea('pp-vnote', '', 'Optional'), null, true)], 1),
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Mark verified', 'pp-verify-go', { id: p.id }, { variant: 'primary' }) });
  };
  Hub.actions['pp-verify-go'] = function (el) {
    var p = db.getParent(el.dataset.id), m = K.val('pp-method'), at = K.now(), who = K.me();
    mutate(function () { db.verifyParentLink(p.id, m, who, at); db.getRequests(function (r) { return r.parent === p.id && r.status !== 'Resolved' && r.status !== 'Declined'; }).forEach(function (r) { db.resolveRequest(r.id, 'Approved', 'Link verified: ' + m, who, at); }); }, p.name + ' verified', 'Parent link verified for ' + p.name + ' (' + m + ')', p.id, { at: at, who: who });
  };
  Hub.actions['pp-endlink'] = function (el) {
    var p = db.getParent(el.dataset.id);
    Hub.openSheet({ title: 'End link for ' + esc(p.name), body: '<p class="k-note">' + esc(p.name) + ' will lose access to the ' + esc(db.getFamily(p.family).name) + '. The link and its history are kept.</p>' + K.form([K.field('Reason', K.textarea('pp-endreason', '', 'Required'), null, true)], 1),
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('End link', 'pp-endlink-go', { id: p.id }, { variant: 'primary' }) });
  };
  Hub.actions['pp-endlink-go'] = function (el) {
    var p = db.getParent(el.dataset.id), reason = K.val('pp-endreason').trim(), at = K.now(), who = K.me();
    if (!reason) { Hub.toast('Add a reason to end the link'); return; }
    mutate(function () { db.endParentLink(p.id, reason, who, at); }, 'Link ended for ' + p.name, 'Parent link ended for ' + p.name, p.id, { before: { link: linkState(p) }, after: { link: 'Ended', reason: reason }, restricted: true, at: at, who: who });
  };

  /* ================================================================ FAMILIES */
  Hub.screens['mgmt-families'] = function (ctx) {
    var h = K.head({ back: ['mgmt-players', 'Players & Parents'], eyebrow: 'Players & Parents', title: 'Families', sub: 'Status, reviews, closure reasons and family credits.' });
    var g = K.guard(ctx, h, { empty: ['family', 'No families yet', 'Families appear when the first ' + client().toLowerCase() + ' signs up.'] }); if (g) return g;
    var st = K.tab('pp-famstate', [{ id: 'Open' }, { id: 'Active' }, { id: 'Trial' }, { id: 'Closed' }, { id: 'All' }]);
    var all = db.getFamilies();
    function inState(f, s) { return s === 'All' || (s === 'Open' ? f.status !== 'Closed' : f.status === s); }
    var list = all.filter(function (f) { return inState(f, st) && match(Q.families, [f.name, f.id].concat(db.getFamilyParents(f.id).map(function (p) { return p.name; })).concat(db.getFamilyPlayers(f.id).map(function (p) { return p.name; }))); });
    var bar = '<div class="lx-filterbar pp-filters">' + search('families', 'Search families, ' + client().toLowerCase() + 's or players') + K.seg('pp-famstate', ['Open', 'Active', 'Trial', 'Closed', 'All'].map(function (s) { return { id: s, label: s + ' (' + all.filter(function (f) { return inState(f, s); }).length + ')' }; })) + '</div>';
    return K.page(h, bar + tbl({ cols: 'minmax(0,1.4fr) minmax(0,1.4fr) 120px 110px 100px', head: ['Family', { label: 'Players', cls: 'wide' }, { label: 'Review due', cls: 'wide' }, { label: 'Credit', cls: 'wide c-num' }, { label: 'Status', cls: 'c-end' }],
      rows: list.map(function (f) {
        var due = f.reviewDue && f.reviewDue <= K.addDays(K.today, 30);
        return { route: 'mgmt-family/' + f.id, label: 'Open ' + f.name, cells: [K.cell(esc(f.name), K.id(f.id) + ' · ' + db.getFamilyParents(f.id).filter(function (p) { return !p.link.ended; }).map(function (p) { return esc(p.name); }).join(', ')),
          { cls: 'wide c-cell', html: db.getFamilyPlayers(f.id).map(function (p) { return esc(p.first); }).join(', ') }, { cls: 'wide', html: f.reviewDue ? (due ? K.pill(K.dm(f.reviewDue), 'warn') : K.dm(f.reviewDue) + ' ' + f.reviewDue.slice(0, 4)) : '<span class="c-mute">—</span>' },
          { cls: 'wide c-num', html: K.money(familyCreditLeft(f.id)) }, { cls: 'c-end', html: K.status(f.status) }] };
      }), empty: 'No families match.' }));
  };

  Hub.screens['mgmt-family'] = function (ctx) {
    var f = db.getFamily(ctx.param);
    var h0 = K.head({ back: ['mgmt-families', 'Families'], eyebrow: 'Family', title: f ? f.name : 'Family' });
    var g = K.guard(ctx, h0, { empty: ['family', 'No details', 'This family has no details yet.'] }); if (g) return g;
    if (!f) return K.page(h0, emptyNote('family', 'Family not found', 'Check the link or search families.'));
    Hub.crumbTail = f.name;
    var acts = [];
    if (f.status !== 'Closed') { acts.push(K.actBtn('Mark reviewed', 'pp-fam-review', { id: f.id }, { variant: 'secondary', icon: 'check' })); acts.push(K.goBtn('New adjustment', 'mgmt-adjustments', { variant: 'secondary', icon: 'plus' })); acts.push(K.actBtn('Close family', 'pp-fam-close', { id: f.id }, { variant: 'secondary', icon: 'x' })); }
    else acts.push(K.actBtn('Reopen family', 'pp-fam-reopen', { id: f.id }, { variant: 'secondary', icon: 'refresh' }));
    var h = K.head({ back: ['mgmt-families', 'Families'], eyebrow: 'Family · ' + f.id, title: f.name, sub: K.status(f.status) + (f.reviewDue ? ' · Review due ' + K.d(f.reviewDue) : ''), actions: acts.join('') });
    var parents = db.getFamilyParents(f.id), kids = db.getFamilyPlayers(f.id), credits = db.getFamilyCredits(f.id);
    var reqs = db.getRequests(function (r) { return r.family === f.id; }), bks = db.getBookings(function (b) { return b.family === f.id; }), adj = db.getAdjustments(f.id);
    var stats = K.stats([{ label: 'Players', value: kids.length }, { label: client() + 's', value: parents.filter(function (p) { return !p.link.ended; }).length, sub: parents.filter(function (p) { return p.link.ended; }).length + ' ended links' },
      { label: 'Family credit', value: K.money(familyCreditLeft(f.id)), sub: 'remaining of ' + K.money(K.sum(credits, 'amount')) }, { label: 'Open requests', value: reqs.filter(function (r) { return r.status === 'Open' || r.status === 'In review'; }).length, route: 'mgmt-requests' }]);
    var info = K.card({ title: 'Family status', body: K.kv([['Status', K.status(f.status)], ['Review due', f.reviewDue ? K.d(f.reviewDue) : '<span class="text-3">No review (closed)</span>'], ['Closure reason', f.closureReason ? esc(f.closureReason) + (f.closedBy ? '<br>' + K.stamp('Closed', f.closedBy, f.closedAt) : '') : '<span class="text-3">Not closed</span>']]) });
    var people = K.card({ title: 'People', body: K.list(parents.map(function (p) { return ui.row({ lead: ui.avatar(p.name, 'sm'), title: esc(p.name), sub: [esc(p.relationship), 'Priority ' + p.priority], href: '#mgmt-parent/' + p.id, trail: K.status(linkState(p)) }); }).concat(kids.map(function (k) { return ui.row({ lead: ui.avatar(k.name, 'sm'), title: esc(k.name), sub: ['Player', esc(k.ageGroup)], href: '#mgmt-player/' + k.id, trail: K.status(k.status) }); }))) });
    var creditTbl = tbl({ cols: 'minmax(0,1.8fr) 100px 100px', head: ['Credit', { label: 'Amount', cls: 'c-num wide' }, { label: 'Remaining', cls: 'c-num' }],
      rows: credits.map(function (c) { return { cells: [K.cell(esc(c.source), K.id(c.id) + ' · ' + esc(c.by) + ', ' + K.dt(c.at) + (c.applications.length ? ' · used on ' + c.applications.length + ' charge' + (c.applications.length > 1 ? 's' : '') : '')), { cls: 'c-num wide', html: K.money(c.amount) }, { cls: 'c-num', html: K.money(c.remaining) }] }; }), empty: 'No family credits.', foot: '<span>Credits are used oldest first on the next charge.</span><b class="num">' + K.money(familyCreditLeft(f.id)) + ' remaining</b>' });
    return K.page(h, stats + K.grid([info, people], 2) + K.section('Family credits', null, creditTbl) + K.section('Requests', null, requestTable(reqs)) +
      K.section('Bookings and adjustments', null, tbl({ cols: 'minmax(0,1.6fr) 110px 120px', head: ['Item', { label: 'Amount', cls: 'c-num wide' }, { label: 'Status', cls: 'c-end' }],
        rows: bks.map(function (b) { return { route: 'mgmt-booking/' + b.id, cells: [K.cell(esc(b.product), K.id(b.id) + ' · booking · ' + K.dt(b.at)), { cls: 'c-num wide', html: K.money(b.total) }, { cls: 'c-end', html: K.status(b.state) }] }; })
          .concat(adj.map(function (a) { return { route: 'mgmt-adjustments', cells: [K.cell(esc(a.reason), K.id(a.id) + ' · ' + a.kind.toLowerCase() + ' · ' + K.dt(a.at)), { cls: 'c-num wide', html: amountLabel(a) }, { cls: 'c-end', html: K.status(a.status) }] }; })), empty: 'No bookings or adjustments.' })) +
      K.section('History', null, '<div class="lx-card">' + K.timeline(db.getFamilyHistory(f.id).concat(db.getEntityAudit([f.id]).map(function (e) { return { text: e.summary, who: e.who, at: e.at, tone: e.finance ? 'info' : '' }; })).sort(function (a, b) { return a.at < b.at ? 1 : -1; })) + '</div>'));
  };
  Hub.actions['pp-fam-review'] = function (el) { var f = db.getFamily(el.dataset.id), at = K.now(), who = K.me(); Hub.mutate(function () { db.markFamilyReviewed(f.id, who, at); }, f.name + ' reviewed', { area: AREA, summary: f.name + ' reviewed', entity: f.id, at: at, who: who }); };
  Hub.actions['pp-fam-close'] = function (el) {
    var f = db.getFamily(el.dataset.id);
    Hub.openSheet({ title: 'Close ' + esc(f.name), body: '<p class="k-note">Closing keeps every player, booking and payment as history. Memberships must be ended separately.</p>' + K.form([K.field('Closure reason', K.textarea('pp-close', '', 'Required'), null, true)], 1),
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Close family', 'pp-fam-close-go', { id: f.id }, { variant: 'primary' }) });
  };
  Hub.actions['pp-fam-close-go'] = function (el) {
    var f = db.getFamily(el.dataset.id), r = K.val('pp-close').trim(), at = K.now(), who = K.me(), before = f.status;
    if (!r) { Hub.toast('Add a closure reason'); return; }
    mutate(function () { db.setFamilyStatus(f.id, 'Closed', r, who, at); }, f.name + ' closed', f.name + ' closed: ' + r, f.id, { before: { status: before }, after: { status: 'Closed' }, at: at, who: who });
  };
  Hub.actions['pp-fam-reopen'] = function (el) { var f = db.getFamily(el.dataset.id), at = K.now(), who = K.me(); Hub.mutate(function () { db.setFamilyStatus(f.id, 'Active', null, who, at); f.reviewDue = K.addDays(K.today, 30); }, f.name + ' reopened', { area: AREA, summary: f.name + ' reopened', entity: f.id, before: { status: 'Closed' }, after: { status: 'Active' }, at: at, who: who }); };

  /* ================================================================ MEMBERSHIPS */
  function keyDate(m) {
    if (m.state === 'Paused' && m.pause) return 'Paused until ' + K.dm(m.pause.to);
    if (m.state === 'Ending Scheduled' && m.cancel) return 'Ends ' + K.dm(m.cancel.end);
    if (m.state === 'Cancellation Pending' && m.cancel) return 'Requested ' + K.dm(m.cancel.requested);
    if (m.state === 'Ended' && m.ended) return 'Ended ' + K.dm(m.ended.on);
    return 'Since ' + K.dm(m.start) + ' ' + m.start.slice(0, 4);
  }
  function membershipTable(list, hidePlayer) {
    return tbl({ cols: 'minmax(0,1.5fr) minmax(0,1.2fr) 110px 170px', head: [hidePlayer ? 'Session' : 'Player', { label: hidePlayer ? 'Key date' : 'Session', cls: 'wide' }, { label: 'Price', cls: 'wide c-num' }, { label: 'State', cls: 'c-end' }],
      rows: list.map(function (m) {
        var p = player(m.player);
        return { route: 'mgmt-membership/' + m.id, label: 'Open ' + m.id, cells: [hidePlayer ? K.cell(esc(sesName(m.session)), K.id(m.id) + ' · ' + keyDate(m)) : K.cell(esc(p.name), K.id(m.id) + ' · ' + keyDate(m)),
          { cls: 'wide c-cell', html: hidePlayer ? keyDate(m) : esc(sesName(m.session)) }, { cls: 'wide c-num', html: K.money(m.price) }, { cls: 'c-end', html: K.status(m.state) }] };
      }), empty: 'No memberships.' });
  }
  Hub.screens['mgmt-memberships'] = function (ctx) {
    var h = K.head({ back: ['mgmt-players', 'Players & Parents'], eyebrow: 'Players & Parents', title: 'Memberships', sub: 'One player on one session. Statuses: Active, Paused, Cancellation Pending, Ending Scheduled, Ended.' });
    var g = K.guard(ctx, h, { empty: ['calendar', 'No memberships yet', 'Memberships appear when players join a session.'] }); if (g) return g;
    var all = db.getMemberships();
    var list0 = [{ id: 'Open' }].concat(STATES.map(function (s) { return { id: s }; })).concat([{ id: 'All' }]);
    var st = K.tab('pp-memstate', list0);
    function inState(m, s) { return s === 'All' || (s === 'Open' ? m.state !== 'Ended' : m.state === s); }
    var list = all.filter(function (m) { return inState(m, st); }).sort(function (a, b) { return STATES.indexOf(b.state) - STATES.indexOf(a.state) || (player(a.player).name < player(b.player).name ? -1 : 1); });
    var stats = K.stats([{ label: 'Active', value: all.filter(function (m) { return m.state === 'Active'; }).length }, { label: 'Paused', value: all.filter(function (m) { return m.state === 'Paused'; }).length },
      { label: 'Cancellation requested', value: all.filter(function (m) { return m.state === 'Cancellation Pending'; }).length, tone: 'feature', route: 'mgmt-requests' }, { label: 'Ending in 30 days', value: db.getMembershipsEndingSoon(30).length }]);
    return K.page(h, stats + '<div class="lx-filterbar pp-filters">' + K.seg('pp-memstate', list0.map(function (s) { return { id: s.id, label: K.stateLabel(s.id) + ' (' + all.filter(function (m) { return inState(m, s.id); }).length + ')' }; })) + '</div>' + membershipTable(list));
  };

  Hub.screens['mgmt-membership'] = function (ctx) {
    var m = db.getMembership(ctx.param);
    var h0 = K.head({ back: ['mgmt-memberships', 'Memberships'], eyebrow: 'Membership', title: m ? m.id : 'Membership' });
    var g = K.guard(ctx, h0, { empty: ['calendar', 'No details', 'This membership has no details yet.'] }); if (g) return g;
    if (!m) return K.page(h0, emptyNote('calendar', 'Membership not found', 'Check the link or open the memberships list.'));
    var p = player(m.player), s = db.getSession(m.session), rule = db.getBillingRule(m.billingRule);
    Hub.crumbTail = p.name + ' · ' + (s ? s.name : '');
    var acts = [];
    if (m.state === 'Active') acts = [K.actBtn('Pause', 'pp-mem-pause', { id: m.id }, { variant: 'secondary' }), K.actBtn('Record cancellation request', 'pp-mem-cancel', { id: m.id }, { variant: 'secondary' }), K.actBtn('End now', 'pp-mem-end', { id: m.id }, { variant: 'secondary' })];
    if (m.state === 'Paused' || m.state === 'Ending Scheduled') acts = [K.actBtn('End now', 'pp-mem-end', { id: m.id }, { variant: 'secondary' })];
    if (m.state === 'Ended') acts = [K.frozen('Ended · kept as history')];
    var sit = m.state === 'Cancellation Pending' ? K.situation({ tone: 'warn', kicker: 'Requested ' + K.dm(m.cancel.requested), title: 'Parent requested cancellation', text: (m.cancel.reason ? '"' + esc(m.cancel.reason) + '". ' : '') + 'If approved, the place ends ' + (rule ? rule.noticeDays : 30) + ' days after the request.', primary: K.actBtn('Review request', 'pp-mem-approve', { id: m.id }, { variant: 'primary' }), secondary: K.actBtn('Keep active', 'pp-mem-resume', { id: m.id }, { variant: 'secondary' }) }) :
      m.state === 'Paused' ? K.situation({ tone: 'info', title: 'Paused' + (m.pause ? ' until ' + K.d(m.pause.to) : ''), text: 'No charges while paused.' + (m.pause && m.pause.reason ? ' Reason: ' + esc(m.pause.reason) + '.' : ''), primary: K.actBtn('Resume now', 'pp-mem-resume', { id: m.id }, { variant: 'primary' }) }) :
      m.state === 'Ending Scheduled' ? K.situation({ tone: 'info', title: 'Ends on ' + (m.cancel && m.cancel.end ? K.d(m.cancel.end) : 'the scheduled date'), text: 'Cancellation approved. No action needed.' }) :
      m.state === 'Ended' ? K.situation({ tone: 'ok', title: 'Ended' + (m.ended ? ' on ' + K.d(m.ended.on) : ''), text: 'Kept as history.' }) :
      K.situation({ tone: 'ok', title: 'Active', text: K.money(m.price) + ' a month since ' + K.d(m.start) + '. Nothing needs you.' });
    var h = K.head({ back: ['mgmt-memberships', 'Memberships'], eyebrow: 'Membership · ' + m.id, title: p.name + ' · ' + (s ? s.name : ''), sub: K.status(m.state) + ' · ' + keyDate(m), actions: acts.join('') });
    var cur = STATES.indexOf(m.state);
    var life = '<ol class="pp-life" aria-label="Status">' + STATES.map(function (x, i) { return '<li class="' + (x === m.state ? 'is-current' : (x !== 'Paused' && i < cur && m.state !== 'Paused' && !(x === 'Cancellation Pending' && !m.cancel)) ? 'is-done' : '') + '"><span>' + esc(K.stateLabel(x)) + '</span></li>'; }).join('') + '</ol>';
    var main = K.card({ title: 'Membership', body: K.kv([['Player', pLink(m.player)], ['Session', sesLink(m.session)], ['Family', famLink(p.family)], ['Started', K.d(m.start)], ['State', K.status(m.state)]], true) });
    var price = K.card({ title: 'Price and billing terms at the start', sub: 'Copied when the membership started; later rule changes do not alter it.', body: K.kv([['Price agreed', K.money(m.price) + ' a month'], ['Billing rule', rule ? K.id(rule.id) + ' ' + esc(rule.name) : esc(m.billingRule)],
      rule ? ['Payer', esc(rule.payer)] : null, rule ? ['Billing model', esc(rule.model) + ' · ' + esc(rule.basis)] : null, rule ? ['Anchor day', 'Day ' + rule.anchorDay + ' of each month'] : null, rule ? ['Notice', rule.noticeDays + ' days'] : null], true) });
    var cards = [main];
    if (m.pause) cards.push(K.card({ title: 'Pause', body: K.kv([['From', K.d(m.pause.from)], ['To', K.d(m.pause.to)], ['Reason', esc(m.pause.reason)], ['Recorded', K.stamp('Paused', m.pause.by, m.pause.at)], m.pause.resumedAt ? ['Resumed', K.dt(m.pause.resumedAt)] : null]) }));
    if (m.cancel) cards.push(K.card({ title: 'Cancellation', body: K.kv([['Requested', K.stamp('Requested', m.cancel.by, m.cancel.requested)], ['Reason', esc(m.cancel.reason)], ['Notice starts', m.cancel.noticeStart ? K.d(m.cancel.noticeStart) : '<span class="text-3">When approved</span>'],
      ['Scheduled end', m.cancel.end ? K.d(m.cancel.end) + ' <span class="text-3">(notice + ' + (rule ? rule.noticeDays : 30) + ' days)</span>' : '<span class="text-3">Not scheduled yet</span>'], m.cancel.approvedBy ? ['Approved', K.stamp('Approved', m.cancel.approvedBy, m.cancel.approvedAt)] : null]) }));
    if (m.ended) cards.push(K.card({ title: 'Ended', body: K.kv([['Ended on', K.d(m.ended.on)], ['Reason', esc(m.ended.reason)], ['Recorded', K.stamp('Ended', m.ended.by, m.ended.at)]]) }));
    return K.page(h, sit + K.grid(cards, 2) + life + K.details('Price and billing terms', price, { sub: K.money(m.price) + ' a month, agreed at the start' }) + K.details('History', K.timeline(db.getMembershipHistory(m.id))));
  };
  function memSheet(m, title, body, label, action) { Hub.openSheet({ title: esc(title), body: body, foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn(label, action, { id: m.id }, { variant: 'primary' }) }); }
  function memLabel(m) { return player(m.player).name + ' (' + sesName(m.session) + ')'; }
  Hub.actions['pp-mem-pause'] = function (el) {
    var m = db.getMembership(el.dataset.id);
    memSheet(m, 'Pause ' + memLabel(m), K.form([K.field('From', K.input('pp-from', K.addDays(K.today, 7), { type: 'date' })), K.field('To', K.input('pp-to', K.addDays(K.today, 35), { type: 'date' })), K.field('Reason', K.textarea('pp-reason', '', 'Required'), 'No charges are made while paused.', true)]), 'Pause membership', 'pp-mem-pause-go');
  };
  Hub.actions['pp-mem-pause-go'] = function (el) {
    var m = db.getMembership(el.dataset.id), f = K.val('pp-from'), t = K.val('pp-to'), r = K.val('pp-reason').trim(), at = K.now(), who = K.me();
    if (!f || !t || t < f) { Hub.toast('Check the pause dates'); return; } if (!r) { Hub.toast('Add a reason for the pause'); return; }
    mutate(function () { db.pauseMembership(m.id, f, t, r, who, at); }, 'Membership paused', 'Membership paused for ' + memLabel(m) + ' (' + K.dm(f) + ' to ' + K.dm(t) + ')', m.id, { before: { state: 'Active' }, after: { state: 'Paused', from: f, to: t }, at: at, who: who });
  };
  Hub.actions['pp-mem-cancel'] = function (el) {
    var m = db.getMembership(el.dataset.id);
    memSheet(m, 'Record cancellation request', '<p class="k-note">For a request made by phone or email. The membership moves to Cancellation Pending until approved.</p>' + K.form([K.field('Reason given', K.textarea('pp-reason', '', 'Required'), null, true)], 1), 'Record request', 'pp-mem-cancel-go');
  };
  Hub.actions['pp-mem-cancel-go'] = function (el) {
    var m = db.getMembership(el.dataset.id), r = K.val('pp-reason').trim(), at = K.now(), who = K.me();
    if (!r) { Hub.toast('Add the reason given'); return; }
    mutate(function () { db.requestCancellation(m.id, r, who, at); }, 'Cancellation request recorded', 'Cancellation request recorded for ' + memLabel(m), m.id, { before: { state: m.state }, after: { state: 'Cancellation Pending' }, at: at, who: who });
  };
  Hub.actions['pp-mem-approve'] = function (el) {
    var m = db.getMembership(el.dataset.id), rule = db.getBillingRule(m.billingRule), start = (m.cancel && m.cancel.requested || K.today).slice(0, 10), end = K.addDays(start, rule ? rule.noticeDays : 30);
    memSheet(m, 'Approve cancellation', K.kv([['Notice starts', K.d(start) + ' <span class="text-3">(date of the request)</span>'], ['Scheduled end', K.d(end) + ' <span class="text-3">(+ ' + (rule ? rule.noticeDays : 30) + ' days)</span>'], ['State after approval', K.status('Ending Scheduled')]]), 'Approve cancellation', 'pp-mem-approve-go');
  };
  Hub.actions['pp-mem-approve-go'] = function (el) {
    var m = db.getMembership(el.dataset.id), at = K.now(), who = K.me();
    mutate(function () {
      db.approveCancellation(m.id, who, at);
      db.getRequests(function (r) { return r.membership === m.id && r.type === 'Cancellation' && (r.status === 'Open' || r.status === 'In review'); }).forEach(function (r) { r.status = 'Resolved'; r.stage = 'Done'; r.effective = m.cancel.end; r.resolution = { outcome: 'Approved', note: 'Approved from the membership. Ends ' + K.dm(m.cancel.end) + '.', by: who, at: at }; });
    }, 'Cancellation approved', 'Cancellation approved for ' + memLabel(m), m.id, { before: { state: 'Cancellation Pending' }, after: { state: 'Ending Scheduled' }, at: at, who: who });
  };
  Hub.actions['pp-mem-end'] = function (el) {
    var m = db.getMembership(el.dataset.id);
    memSheet(m, 'End ' + memLabel(m) + ' now', '<p class="k-note">Ending now skips any remaining notice. The membership stays as history.</p>' + K.form([K.field('Reason', K.textarea('pp-reason', '', 'Required'), null, true)], 1), 'End membership', 'pp-mem-end-go');
  };
  Hub.actions['pp-mem-end-go'] = function (el) {
    var m = db.getMembership(el.dataset.id), r = K.val('pp-reason').trim(), at = K.now(), who = K.me(), before = m.state;
    if (!r) { Hub.toast('Add a reason'); return; }
    mutate(function () { db.endMembership(m.id, r, who, at); }, 'Membership ended', 'Membership ended for ' + memLabel(m) + ': ' + r, m.id, { before: { state: before }, after: { state: 'Ended' }, at: at, who: who });
  };
  Hub.actions['pp-mem-resume'] = function (el) {
    var m = db.getMembership(el.dataset.id), at = K.now(), who = K.me(), before = m.state;
    Hub.mutate(function () { db.resumeMembership(m.id, who, at); }, 'Membership active', { area: AREA, summary: 'Membership set back to Active for ' + memLabel(m), entity: m.id, before: { state: before }, after: { state: 'Active' }, at: at, who: who });
  };

  /* ================================================================ REQUESTS */
  var REQ_TYPES = ['Session request', 'Pause', 'Cancellation', 'Detail change', 'Second parent invite', 'Add a child', 'Billing query'];
  function reqDisabled(r) { return r.type === 'Session request' && !K.feature('sessionRequests'); }
  function requestTable(list) {
    return tbl({ cols: 'minmax(0,1.6fr) minmax(0,1.2fr) 140px 130px', head: ['Request', { label: 'Requested by', cls: 'wide' }, { label: 'Stage', cls: 'wide' }, { label: 'Status', cls: 'c-end' }],
      rows: list.map(function (r) {
        var who = db.getParent(r.by), off = reqDisabled(r) && (r.status === 'Open' || r.status === 'In review');
        return { action: 'pp-req', data: { id: r.id }, label: 'Open ' + r.id, cells: [K.cell(esc(r.type) + (r.player ? ' · ' + esc(player(r.player).name) : ''), K.id(r.id) + ' · ' + esc(r.session ? sesName(r.session) : r.change ? r.change.label : r.parent ? db.getParent(r.parent).name : '')),
          { cls: 'wide c-cell', html: esc(who ? who.name : r.by) + '<br><small class="text-3">' + K.dt(r.at) + '</small>' }, { cls: 'wide', html: esc(r.stage) }, { cls: 'c-end', html: off ? K.pill('Switched off', '') : K.status(r.status) }] };
      }), empty: 'No requests here.' });
  }
  Hub.screens['mgmt-requests'] = function (ctx) {
    var h = K.head({ back: ['mgmt-players', 'Players & Parents'], eyebrow: 'Players & Parents', title: 'Requests', sub: 'Session requests, pauses, cancellations and detail changes from families. Resolve or decline with a note.' });
    var g = K.guard(ctx, h, { empty: ['inbox', 'No requests', 'Requests from families appear here.'] }); if (g) return g;
    var all = db.getRequests(), st = K.tab('pp-reqstate', [{ id: 'Open' }, { id: 'Done' }, { id: 'All' }]);
    function inState(r, s) { var open = r.status === 'Open' || r.status === 'In review'; return s === 'All' || (s === 'Open' ? open : !open); }
    var list = all.filter(function (r) { return inState(r, st) && (Q.reqType === 'All' || r.type === Q.reqType); }).sort(function (a, b) { return a.at < b.at ? 1 : -1; });
    var off = K.feature('sessionRequests') ? '' : ui.notice('info', 'Session requests are switched off', 'Session requests from ' + client().toLowerCase() + 's stay visible here but cannot be approved until the feature is switched on.', { action: K.goBtn('Feature controls', 'mgmt-features', { size: 'sm', variant: 'secondary' }) });
    var bar = '<div class="lx-filterbar pp-filters">' + K.seg('pp-reqstate', ['Open', 'Done', 'All'].map(function (s) { return { id: s, label: s + ' (' + all.filter(function (r) { return inState(r, s); }).length + ')' }; })) +
      select('reqType', 'Request type', [['All', 'All request types']].concat(REQ_TYPES.map(function (t) { return [t, t]; }))) + K.goBtn('Session requests', 'mgmt-session-requests', { variant: 'tertiary', size: 'sm', trail: 'arrowRight' }) + '</div>';
    var waiting = all.filter(function (r) { return inState(r, 'Open'); }).sort(function (a, b) { return a.at < b.at ? -1 : 1; });
    var sit = waiting.length ? K.situation({ tone: 'warn', title: waiting.length + ' request' + (waiting.length === 1 ? '' : 's') + ' waiting for a decision', text: 'Oldest: ' + esc(waiting[0].type.toLowerCase()) + ' from ' + esc((db.getParent(waiting[0].by) || {}).name || 'a family') + ', ' + K.dm(waiting[0].at) + '.', primary: K.actBtn('Review the oldest', 'pp-req', { id: waiting[0].id }, { variant: 'primary' }) }) :
      K.situation({ tone: 'ok', title: 'No requests waiting', text: 'Every family request has been decided.' });
    return K.page(h, sit + off + bar + requestTable(list));
  };

  Hub.actions['pp-req'] = function (el) {
    var r = db.getRequest(el.dataset.id); if (!r) return;
    var who = db.getParent(r.by), open = r.status === 'Open' || r.status === 'In review', off = reqDisabled(r);
    var ask = open ? K.situation({ tone: 'warn', kicker: 'Requested ' + K.dm(r.at), title: { Cancellation: 'Parent requested cancellation', Pause: 'Parent asked to pause', 'Session request': 'Parent asked for a place', 'Detail change': 'Parent asked to change a detail', 'Second parent invite': 'Second parent wants access' }[r.type] || esc(r.type), text: esc(r.reason || '') + ' Decide below.' }) : '';
    var pairs = [['Type', esc(r.type)], ['Status', K.status(r.status)], ['Stage', esc(r.stage)], ['Requested by', (who ? parLink(who.id) : esc(r.by)) + '<br>' + K.stamp('Requested', who ? who.name : r.by, r.at)],
      r.player ? ['Player', pLink(r.player)] : null, ['Family', famLink(r.family)], r.session ? ['Session', sesLink(r.session)] : null, r.membership ? ['Membership', K.link('mgmt-membership/' + r.membership, r.membership)] : null,
      r.parent ? [client(), parLink(r.parent)] : null, ['Reason', esc(r.reason)], ['Effective date', r.effective ? K.d(r.effective) : '<span class="text-3">Not set</span>'], r.pauseTo ? ['Pause until', K.d(r.pauseTo)] : null];
    var change = r.change ? '<section class="section">' + ui.sectionHead('Requested change') + K.restricted(['management'], K.kv([['Detail', esc(r.change.label)], ['Old value', esc(r.change.before)], ['New value', esc(r.change.after)]]), 'Old and new values') + '</section>' : '';
    var res = r.resolution ? '<section class="section">' + ui.sectionHead('Resolution') + K.kv([['Outcome', K.status(r.resolution.outcome)], ['Resolution note', esc(r.resolution.note || '—')], ['Resolved by', K.stamp(r.resolution.outcome === 'Declined' ? 'Declined' : 'Resolved', r.resolution.by, r.resolution.at)], r.createdMembership ? ['New membership', K.link('mgmt-membership/' + r.createdMembership, r.createdMembership)] : null].filter(Boolean)) + '</section>' : '';
    var form = '', foot = ui.btn('Close', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } });
    if (open && off) form = K.featureOff('sessionRequests');
    else if (open) {
      var approve = { 'Session request': 'Approve and add to session', Pause: 'Approve pause', Cancellation: 'Approve cancellation', 'Detail change': 'Apply change', 'Second parent invite': 'Confirm access' }[r.type] || 'Resolve';
      var what = { 'Session request': 'A new Active membership starts on the effective date.', Pause: 'The membership is paused for the dates asked.', Cancellation: 'The place ends 30 days after the request date.', 'Detail change': 'The new value replaces the old one; both are kept in history.', 'Second parent invite': 'The second ' + client().toLowerCase() + ' is verified with the same access.' }[r.type] || '';
      form = '<section class="section">' + ui.sectionHead('Decide') + K.form([K.field('Stage', K.select('pp-stage', ['New', 'Waiting on family', 'Ready to decide'], r.stage)), K.field('Resolution note', K.textarea('pp-note', '', 'Required to decline'), esc(what), true)], 1) +
        '<div class="pp-actions">' + K.actBtn('Save stage', 'pp-req-stage', { id: r.id }, { size: 'sm', variant: 'tertiary' }) + '</div></section>';
      foot += K.actBtn('Decline', 'pp-req-go', { id: r.id, outcome: 'Declined' }, { variant: 'secondary' }) + K.actBtn(approve, 'pp-req-go', { id: r.id, outcome: 'Approved' }, { variant: 'primary' });
    }
    Hub.openSheet({ overline: '<span class="overline">' + esc(r.id) + '</span>', title: esc(r.type) + (r.player ? ' · ' + esc(player(r.player).name) : ''), body: ask + K.kv(pairs.filter(Boolean)) + change + res + form, foot: foot });
  };
  Hub.actions['pp-req-stage'] = function (el) {
    var r = db.getRequest(el.dataset.id), s = K.val('pp-stage'), before = r.stage;
    mutate(function () { db.setRequestStage(r.id, s); }, 'Stage set to ' + s, r.id + ' moved from ' + before + ' to ' + s, r.id);
  };
  Hub.actions['pp-req-go'] = function (el) {
    var r = db.getRequest(el.dataset.id), outcome = el.dataset.outcome, note = K.val('pp-note').trim(), at = K.now(), who = K.me();
    if (outcome === 'Declined' && !note) { Hub.toast('Add a resolution note to decline'); return; }
    if (reqDisabled(r)) { Hub.toast('Session requests are switched off'); return; }
    var log = { before: { status: r.status }, after: { status: outcome === 'Declined' ? 'Declined' : 'Resolved' }, at: at, who: who };
    if (r.change) { log.before[r.change.field] = r.change.before; if (outcome === 'Approved') log.after[r.change.field] = r.change.after; log.restricted = true; }
    mutate(function () { db.resolveRequest(r.id, outcome, note || (outcome === 'Approved' ? 'Approved' : ''), who, at); }, (outcome === 'Declined' ? 'Declined ' : 'Approved ') + r.id,
      r.type + ' ' + (outcome === 'Declined' ? 'declined' : 'approved') + (r.player ? ' for ' + player(r.player).name : '') + ' (' + r.id + ')', r.player || r.parent || r.family, log);
  };

  Hub.screens['mgmt-session-requests'] = function (ctx) {
    var on = K.feature('sessionRequests');
    var h = K.head({ back: ['mgmt-requests', 'Requests'], eyebrow: 'Players & Parents', title: 'Session requests', sub: client() + 's asking for their child to join a session.' });
    var g = K.guard(ctx, h, { empty: ['inbox', 'No session requests', 'Requests to join a session appear here.'] }); if (g) return g;
    var list = db.getSessionRequests();
    var waiting = list.filter(function (r) { return r.status === 'Open' || r.status === 'In review'; });
    if (!on) return K.page(h, K.featureOff('sessionRequests') + K.section('Waiting while switched off', waiting.length + ' request' + (waiting.length === 1 ? '' : 's') + ' arrived before the feature was switched off. They are kept and can be decided once it is on.', '<div class="pp-disabled" aria-disabled="true">' + requestTable(list) + '</div>'));
    return K.page(h, K.stats([{ label: 'Waiting', value: waiting.length, tone: 'feature' }, { label: 'Approved', value: list.filter(function (r) { return r.resolution && r.resolution.outcome === 'Approved'; }).length }, { label: 'Declined', value: list.filter(function (r) { return r.status === 'Declined'; }).length }]) +
      K.section('All session requests', 'Open a request to approve or decline it.', requestTable(list)));
  };

  /* ================================================================ PLAYER MIGRATION */
  var MIG = { step: 0, player: '', session: '', start: K.addDays(K.today, 7) };
  Hub.screens['mgmt-player-migration'] = function (ctx) {
    var h = K.head({ back: ['mgmt-players', 'Players & Parents'], eyebrow: 'Players & Parents', title: 'Move players onto sessions', sub: 'Move existing players who are not on a session onto one. Each move creates an Active membership.' });
    var g = K.guard(ctx, h, { empty: ['move', 'Nobody to move', 'Every active player is already on a session.'] }); if (g) return g;
    var cands = db.getMigrationCandidates(), body;
    var steps = K.steps(['Choose player', 'Choose session', 'Confirm'], MIG.step);
    if (MIG.step === 0) {
      body = cands.length ? tbl({ cols: 'minmax(0,1.6fr) minmax(0,1.4fr) 140px', head: ['Player', { label: 'Why they are here', cls: 'wide' }, { label: '', cls: 'c-end' }],
        rows: cands.map(function (p) { return { cells: [K.cell(esc(p.name), K.id(p.id) + ' · ' + esc(p.ageGroup) + ' · ' + K.status(p.status)), { cls: 'wide c-cell', html: p.imported ? esc(p.imported.note) : p.status === 'Trial' ? 'On a free trial' : 'No current membership' }, { cls: 'c-end', html: K.actBtn('Choose', 'pp-mig-pick', { id: p.id }, { size: 'sm', variant: 'secondary' }) }] }; }) })
        : emptyNote('checkCircle', 'Nobody left to move', 'Every active player is on a session.');
    } else if (MIG.step === 1) {
      var p = player(MIG.player), sess = db.getSessions().filter(function (s) { return s.lifecycle === 'Active' && s.commercial === 'Parent bookable'; });
      var rec = sess.filter(function (s) { return s.ageGroup === p.ageGroup; })[0];
      body = K.card({ title: 'Session for ' + p.name, sub: esc(p.ageGroup) + (rec ? ' · suggested: ' + esc(rec.name) : ''), body: K.form([K.field('Session', K.select('pp-mig-session', sess.map(function (s) { return [s.id, s.name + ' · ' + K.money(s.price) + ' a month']; }), MIG.session || (rec && rec.id))), K.field('Start date', K.input('pp-mig-start', MIG.start, { type: 'date' }))]) +
        '<div class="pp-actions">' + K.actBtn('Back', 'pp-mig-step', { step: 0 }, { variant: 'tertiary' }) + K.actBtn('Next', 'pp-mig-next', {}, { variant: 'primary' }) + '</div>' });
    } else {
      var pp = player(MIG.player), s = db.getSession(MIG.session);
      body = K.card({ title: 'Confirm the move', body: K.kv([['Player', pLink(pp.id)], ['Session', esc(s.name)], ['Start date', K.d(MIG.start)], ['Price agreed', K.money(s.price) + ' a month'], ['Billing rule', 'BR-0' + (['SES-01', 'SES-02', 'SES-03', 'SES-04'].indexOf(s.id) + 1)]], true) +
        '<div class="pp-actions">' + K.actBtn('Back', 'pp-mig-step', { step: 1 }, { variant: 'tertiary' }) + K.actBtn('Move onto session', 'pp-mig-go', {}, { variant: 'primary' }) + '</div>' });
    }
    var moved = db.getMemberships(function (m) { return m.migrated; });
    return K.page(h, steps + body + (moved.length ? K.section('Moved this visit', null, membershipTable(moved)) : ''));
  };
  Hub.actions['pp-mig-pick'] = function (el) { MIG.player = el.dataset.id; MIG.session = ''; MIG.step = 1; Hub.render(); };
  Hub.actions['pp-mig-step'] = function (el) { MIG.step = +el.dataset.step; Hub.render(); };
  Hub.actions['pp-mig-next'] = function () { MIG.session = K.val('pp-mig-session'); MIG.start = K.val('pp-mig-start') || MIG.start; if (!MIG.session) { Hub.toast('Choose a session'); return; } MIG.step = 2; Hub.render(); };
  Hub.actions['pp-mig-go'] = function () {
    var p = player(MIG.player), s = db.getSession(MIG.session), at = K.now(), who = K.me(), id = 'MEM-' + String(101 + db.getMemberships().length);
    Hub.mutate(function () {
      db.addMembership({ id: id, player: p.id, session: s.id, state: 'Active', start: MIG.start, price: s.price, billingRule: 'BR-0' + (['SES-01', 'SES-02', 'SES-03', 'SES-04'].indexOf(s.id) + 1), priceLabel: K.money(s.price) + ' a month', migrated: true,
        history: [{ text: 'Moved onto ' + s.name + ' by moving players onto sessions', who: who, at: at, tone: 'ok' }] });
      if (p.status === 'Trial') p.status = 'Active';
      MIG.step = 0; MIG.player = ''; MIG.session = '';
    }, p.name + ' moved onto ' + s.name, { area: AREA, summary: p.name + ' moved onto ' + s.name + ' from ' + K.dm(MIG.start), entity: p.id, after: { membership: id, session: s.name }, at: at, who: who });
  };

  /* ================================================================ BOOKINGS */
  Hub.screens['mgmt-bookings'] = function (ctx) {
    var h = K.head({ back: ['mgmt-players', 'Players & Parents'], eyebrow: 'Players & Parents', title: 'Bookings', sub: 'One checkout, many player and date lines. Paid lines are history; cancellations are new events.' });
    var g = K.guard(ctx, h, { empty: ['card', 'No bookings yet', 'Camp, trial and single-session bookings appear here.'] }); if (g) return g;
    var off = K.feature('bookings') ? '' : K.featureOff('bookings');
    var all = db.getBookings(), st = K.tab('pp-bkstate', [{ id: 'All' }, { id: 'Paid' }, { id: 'Confirmed' }, { id: 'Cancelled' }]);
    var list = all.filter(function (b) { return st === 'All' || b.state === st; }).sort(function (a, b) { return a.at < b.at ? 1 : -1; });
    var lines = [].concat.apply([], all.map(function (b) { return b.lines; }));
    var stats = K.stats([{ label: 'Checkouts', value: all.length }, { label: 'Player lines', value: lines.length }, { label: 'Booked value', value: K.money(K.sum(lines.filter(function (l) { return l.status !== 'Cancelled'; }), 'final')) }, { label: 'Discounts given', value: K.money(K.sum(lines, 'discount')) }]);
    return K.page(h, off + stats + '<div class="lx-filterbar pp-filters">' + K.seg('pp-bkstate', ['All', 'Paid', 'Confirmed', 'Cancelled'].map(function (s) { return { id: s, label: s + ' (' + all.filter(function (b) { return s === 'All' || b.state === s; }).length + ')' }; })) + K.goBtn('Commercial setup', 'mgmt-commercial', { variant: 'tertiary', size: 'sm', trail: 'arrowRight' }) + '</div>' +
      tbl({ cols: 'minmax(0,1.6fr) minmax(0,1fr) 70px 100px 110px', head: ['Booking', { label: 'Family', cls: 'wide' }, { label: 'Lines', cls: 'wide c-num' }, { label: 'Total', cls: 'wide c-num' }, { label: 'Status', cls: 'c-end' }],
        rows: list.map(function (b) { var by = db.getParent(b.bookedBy); return { route: 'mgmt-booking/' + b.id, label: 'Open ' + b.id, cells: [K.cell(esc(b.product), K.id(b.id) + ' · ' + esc(by ? by.name : '') + ' · ' + K.dt(b.at)), { cls: 'wide c-cell', html: esc(db.getFamily(b.family).name) }, { cls: 'wide c-num', html: String(b.lines.length) }, { cls: 'wide c-num', html: K.money(b.total) }, { cls: 'c-end', html: K.status(b.state) }] }; }), empty: 'No bookings in this filter.' }));
  };

  Hub.screens['mgmt-booking'] = function (ctx) {
    var b = db.getBooking(ctx.param);
    var h0 = K.head({ back: ['mgmt-bookings', 'Bookings'], eyebrow: 'Booking', title: b ? b.id : 'Booking' });
    var g = K.guard(ctx, h0, { empty: ['card', 'No details', 'This booking has no details yet.'] }); if (g) return g;
    if (!b) return K.page(h0, emptyNote('card', 'Booking not found', 'Check the link or open the bookings list.'));
    Hub.crumbTail = b.id;
    var by = db.getParent(b.bookedBy), payer = db.getParent(b.payer), terms = db.getTermsVersion(b.terms);
    var acc = db.getTermsAcceptances(function (a) { return a.version === b.terms && a.evidence.indexOf(b.id) >= 0; })[0];
    var h = K.head({ back: ['mgmt-bookings', 'Bookings'], eyebrow: 'Booking · ' + b.id, title: b.product, sub: K.status(b.state) + ' · ' + esc(db.getFamily(b.family).name) + ' · ' + K.dt(b.at), actions: b.state === 'Paid' ? K.frozen('Paid · lines are history') : '' });
    var info = K.card({ title: 'Checkout', body: K.kv([['Family', famLink(b.family)], ['Booked by', by ? parLink(by.id) : '—'], ['Payer', payer ? parLink(payer.id) : '—'], ['Checked out', K.dt(b.at)], ['Status', K.status(b.state)],
      ['Terms accepted', terms ? K.link('mgmt-commercial', terms.kind + ' v' + terms.version) + ' ' + K.id(terms.id) + (acc ? '<br>' + K.stamp('Accepted', db.getParent(acc.parent).name, acc.at) : '') : esc(b.terms)], b.cancelReason ? ['Cancellation reason', esc(b.cancelReason)] : null], true) });
    var tot = K.card({ title: 'Totals', body: K.kv([['Base price', K.money(K.sum(b.lines, 'base'))], ['Discounts', K.money(-K.sum(b.lines, 'discount'))], ['Family credit applied', K.money(-K.sum(b.lines, 'creditApplied'))], ['Final price', '<b>' + K.money(K.sum(b.lines, 'final')) + '</b>'], ['Amount due', K.money(K.sum(b.lines, 'due'))], b.refunded ? ['Refunded', K.money(b.refunded)] : null]) });
    var lines = b.lines.map(function (l) {
      var canCancel = l.status !== 'Cancelled' && l.dates[0] > K.today;
      return K.card({ title: player(l.player).name, sub: K.id(l.id) + ' · ' + esc(l.type), right: K.status(l.status), body: K.kv([['Dates', l.dates.map(K.dd).join(', ')], ['Package tier', esc(l.tier)], ['Base price', K.money(l.base)], ['Applied discount', l.discount ? K.money(l.discount) + ' · ' + esc(l.discountRule) : '<span class="text-3">None</span>'],
        ['Family credit applied', K.money(l.creditApplied)], ['Final price', '<b>' + K.money(l.final) + '</b>'], ['Amount due', K.money(l.due)], ['Refund policy when booked', esc(l.refundPolicy)],
        l.cancellation ? ['Cancellation', esc(l.cancellation) + (l.cancelReason ? '<br>Reason: ' + esc(l.cancelReason) : '') + (l.cancelledBy ? '<br>' + K.stamp('Cancelled', l.cancelledBy, l.cancelledAt) : '')] : null]) +
        (canCancel ? '<div class="pp-actions">' + K.actBtn('Cancel this line', 'pp-bk-cancel', { id: b.id, line: l.id }, { size: 'sm', variant: 'secondary' }) + '</div>' : '') });
    });
    var history = [{ text: 'Checkout completed: ' + b.lines.length + ' line' + (b.lines.length > 1 ? 's' : ''), who: by ? by.name : '', at: b.at, tone: 'ok' }].concat(b.history || []);
    db.getRefunds(b.family).filter(function (r) { return r.booking === b.id; }).forEach(function (r) { history.push({ text: 'Refund ' + K.money(r.amount) + ' (' + r.method + ')', detail: esc(r.reason), who: r.decidedBy, at: r.at, tone: 'info' }); });
    return K.page(h, K.grid([info, tot], '21') + K.section('Lines', 'Each player and date is its own line with its own price and refund policy as booked.', K.grid(lines, 2)) +
      K.section('History', null, '<div class="lx-card">' + K.timeline(history.sort(function (a, c) { return a.at < c.at ? 1 : -1; })) + '</div>'));
  };
  Hub.actions['pp-bk-cancel'] = function (el) {
    var b = db.getBooking(el.dataset.id), l = b.lines.filter(function (x) { return x.id === el.dataset.line; })[0], pol = db.getRefundPolicyByName(l.refundPolicy);
    var hours = K.daysBetween(K.today, l.dates[0]) * 24, outside = !pol || hours >= pol.noticeHours;
    Hub.openSheet({ title: 'Cancel ' + esc(player(l.player).name) + '’s line', body: K.kv([['First date', K.d(l.dates[0]) + ' <span class="text-3">(' + Math.round(hours / 24) + ' days away)</span>'], ['Refund policy', esc(l.refundPolicy)], ['Outcome', esc(outside ? 'Outside the refund window: ' + (pol ? pol.outside : '') : 'Inside the refund window: ' + pol.inside)]]) +
      K.form([K.field('Cancellation reason', K.textarea('pp-bkreason', '', 'Required'), null, true)], 1),
      foot: ui.btn('Keep line', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Cancel line', 'pp-bk-cancel-go', { id: b.id, line: l.id }, { variant: 'primary' }) });
  };
  Hub.actions['pp-bk-cancel-go'] = function (el) {
    var r = K.val('pp-bkreason').trim(), at = K.now(), who = K.me(); if (!r) { Hub.toast('Add a cancellation reason'); return; }
    mutate(function () { db.cancelBookingLine(el.dataset.id, el.dataset.line, r, who, at); }, 'Line cancelled', 'Booking line ' + el.dataset.line + ' cancelled: ' + r, el.dataset.id, { finance: true, at: at, who: who });
  };

  /* ================================================================ COMMERCIAL SETUP */
  Hub.screens['mgmt-commercial'] = function (ctx) {
    var tl = [{ id: 'discounts', label: 'Discounts' }, { id: 'refunds', label: 'Refund policies' }, { id: 'packages', label: 'Package pricing' }, { id: 'billing', label: 'Billing rules' }, { id: 'terms', label: 'Terms and policies' }];
    var t = K.tab('pp-comm', tl);
    var h = K.head({ back: ['mgmt-players', 'Players & Parents'], eyebrow: 'Players & Parents', title: 'Prices and policies', sub: 'Rules that set prices for memberships and bookings. Each booking and membership keeps a copy of the rule it was set up under.', tabs: K.tabs('pp-comm', tl) });
    var g = K.guard(ctx, h, { empty: ['settings', 'Nothing set up yet', 'Discounts, refund policies and billing rules appear here.'] }); if (g) return g;
    var lines = [].concat.apply([], db.getBookings().map(function (b) { return b.lines; })), body;
    if (t === 'discounts') {
      body = (K.feature('discounts') ? '' : K.featureOff('discounts')) + noteBox('No stacking by default: when several rules match one line, only the single largest discount applies.' + (db.getStackingDefault() ? '' : ' Stacking is <b>off</b> for every group.')) +
        db.getDiscountGroups().map(function (gp) {
          return K.section(gp.name + ' discounts', 'Stacking: ' + (gp.stacking ? 'allowed' : 'not allowed'), tbl({ cols: 'minmax(0,1.4fr) 110px minmax(0,1.4fr) 70px 150px', head: ['Rule', { label: 'Amount', cls: 'wide' }, { label: 'Condition', cls: 'wide' }, { label: 'Used', cls: 'wide c-num' }, { label: 'Active', cls: 'c-end' }],
            rows: gp.rules.map(function (r) { return { cells: [K.cell(esc(r.name), K.id(r.id) + ' · ' + esc(r.type) + ' · ' + esc(r.appliesTo)), { cls: 'wide', html: esc(r.amount) }, { cls: 'wide c-cell', html: esc(r.condition) }, { cls: 'wide c-num', html: String(lines.filter(function (l) { return l.discountRule === r.name; }).length) }, { cls: 'c-end', html: K.toggle(r.active, 'pp-disc', { id: r.id }, r.active ? 'On' : 'Off') }] }; }),
            foot: '<span class="k-stamp">Set by <b>' + esc(gp.rules[0].by) + '</b>, ' + K.dt(gp.rules[0].at) + '</span>' }));
        }).join('');
    } else if (t === 'refunds') {
      body = tbl({ cols: 'minmax(0,1.4fr) 110px minmax(0,1.3fr) minmax(0,1.3fr)', head: ['Policy', { label: 'Notice', cls: 'wide' }, { label: 'Outside the window', cls: 'wide' }, { label: 'Inside the window', cls: 'wide' }],
        rows: db.getRefundPolicies().map(function (p) { return { cells: [K.cell(esc(p.name), K.id(p.id) + ' · ' + esc(p.appliesTo) + '<span class="only-narrow"> · ' + p.noticeHours + ' h notice</span>'), { cls: 'wide', html: p.noticeHours + ' h' + (p.noticeHours >= 24 ? ' <span class="text-3">(' + Math.round(p.noticeHours / 24) + ' days)</span>' : '') }, { cls: 'wide', html: esc(p.outside) }, { cls: 'wide', html: esc(p.inside) }] }; }) }) +
        noteBox('Outside the window means the family cancelled with at least the notice shown. The policy is copied onto each booking line, so changing it never alters past bookings.');
    } else if (t === 'packages') {
      body = (K.feature('packages') ? '' : K.featureOff('packages')) + db.getPackageGroups().map(function (gp) {
        return K.section(gp.name, esc(gp.appliesTo), tbl({ cols: 'minmax(0,1.4fr) 80px 110px 110px 80px', head: ['Tier', { label: 'Days', cls: 'wide c-num' }, { label: 'Price', cls: 'c-num' }, { label: 'Per day', cls: 'wide c-num' }, { label: 'Booked', cls: 'wide c-num' }],
          rows: gp.tiers.map(function (x) { return { cells: [K.cell(esc(x.name), K.id(x.id)), { cls: 'wide c-num', html: String(x.days) }, { cls: 'c-num', html: K.money(x.price) }, { cls: 'wide c-num', html: K.money(Math.round(x.price / x.days)) }, { cls: 'wide c-num', html: String(lines.filter(function (l) { return l.tier === x.name; }).length) }] }; }),
          foot: '<span class="k-stamp">Set by <b>' + esc(gp.by) + '</b>, ' + K.dt(gp.at) + '</span>' }));
      }).join('');
    } else if (t === 'billing') {
      body = tbl({ cols: 'minmax(0,1.4fr) minmax(0,1.2fr) 100px 120px 90px 70px', head: ['Rule', { label: 'Payer and model', cls: 'wide' }, { label: 'Amount', cls: 'c-num' }, { label: 'Effective', cls: 'wide' }, { label: 'Anchor · notice', cls: 'wide' }, { label: 'In use', cls: 'wide c-num' }],
        rows: db.getBillingRules().map(function (r) { return { cells: [K.cell(esc(r.name), K.id(r.id) + ' · ' + esc(sesName(r.session))), { cls: 'wide c-cell', html: esc(r.payer) + '<br><small class="text-3">' + esc(r.model) + ' · ' + esc(r.basis) + '</small>' }, { cls: 'c-num', html: K.money(r.amount) }, { cls: 'wide', html: K.dm(r.from) + ' ' + r.from.slice(0, 4) + ' – ' + (r.to ? K.dm(r.to) : 'open') }, { cls: 'wide', html: 'Day ' + r.anchorDay + ' · ' + r.noticeDays + ' d' }, { cls: 'wide c-num', html: String(db.getMemberships(function (m) { return m.billingRule === r.id && m.state !== 'Ended'; }).length) }] }; }) }) +
        noteBox('Memberships copy the price and billing rule when they start. Charges are monthly on the anchor day; cancellations need the notice shown.');
    } else {
      body = K.section('Versions', 'Published versions are kept; a new version replaces the current one from its effective date.', tbl({ cols: 'minmax(0,1.5fr) 150px minmax(0,1.3fr) 110px', head: ['Version', { label: 'Effective', cls: 'wide' }, { label: 'What changed', cls: 'wide' }, { label: 'State', cls: 'c-end' }],
        rows: db.getTermsVersions().map(function (v) { return { cells: [K.cell(esc(v.kind) + ' v' + esc(v.version), K.id(v.id) + ' · published by ' + esc(v.by)), { cls: 'wide', html: K.dm(v.from) + ' ' + v.from.slice(0, 4) + (v.to ? ' – ' + K.dm(v.to) + ' ' + v.to.slice(0, 4) : ' onwards') }, { cls: 'wide c-cell', html: esc(v.summary) }, { cls: 'c-end', html: K.status(v.to ? 'Ended' : 'Current') }] }; }) })) +
        K.section('Acceptance evidence', 'Who accepted which version, when and how.', tbl({ cols: 'minmax(0,1.3fr) minmax(0,1fr) minmax(0,1.4fr) 120px', head: [client(), { label: 'Version', cls: 'wide' }, { label: 'Evidence', cls: 'wide' }, { label: 'Accepted', cls: 'c-end' }],
          rows: db.getTermsAcceptances().slice().sort(function (a, b) { return a.at < b.at ? 1 : -1; }).map(function (a) { var p = db.getParent(a.parent), v = db.getTermsVersion(a.version); return { route: 'mgmt-parent/' + a.parent, cells: [K.cell(esc(p.name), esc(db.getFamily(p.family).name)), { cls: 'wide', html: K.id(v.id) + ' v' + esc(v.version) }, { cls: 'wide c-cell', html: esc(a.evidence) }, { cls: 'c-end', html: K.dt(a.at) }] }; }) }));
    }
    return K.page(h, body);
  };
  Hub.actions['pp-disc'] = function (el) {
    var r = db.getDiscountRules().filter(function (x) { return x.id === el.dataset.id; })[0], on = !r.active;
    Hub.mutate(function () { db.setDiscountActive(r.id, on); }, r.name + (on ? ' switched on' : ' switched off'), { area: 'Commercial setup', summary: r.name + (on ? ' switched on' : ' switched off'), entity: r.id, before: { active: !on }, after: { active: on } });
  };

  /* ================================================================ ADJUSTMENTS */
  Hub.screens['mgmt-adjustments'] = function (ctx) {
    var h = K.head({ back: ['mgmt-players', 'Players & Parents'], eyebrow: 'Players & Parents', title: 'Charges and credits', sub: 'One-off charges and credits for a family. A credit adjustment creates a family credit, used oldest first.',
      actions: K.actBtn('New adjustment', 'pp-adj-new', {}, { variant: 'primary', icon: 'plus' }) });
    var g = K.guard(ctx, h, { empty: ['finance', 'No adjustments yet', 'One-off charges and credits appear here.'] }); if (g) return g;
    var all = db.getAdjustments();
    var stats = K.stats([{ label: 'Charges', value: K.money(K.sum(all.filter(function (a) { return a.kind === 'Charge' && a.status !== 'Waived'; }), 'amount')) }, { label: 'Credits', value: K.money(K.sum(all.filter(function (a) { return a.kind === 'Credit'; }), 'amount')) },
      { label: 'Pending collection', value: all.filter(function (a) { return a.status === 'Pending collection'; }).length }, { label: 'Waived', value: all.filter(function (a) { return a.status === 'Waived'; }).length }]);
    return K.page(h, stats + tbl({ cols: 'minmax(0,1.6fr) minmax(0,1fr) 100px 150px', head: ['Adjustment', { label: 'Collection', cls: 'wide' }, { label: 'Amount', cls: 'wide c-num' }, { label: 'Status', cls: 'c-end' }],
      rows: all.map(function (a) { return { action: 'pp-adj', data: { id: a.id }, label: 'Open ' + a.id, cells: [K.cell(esc(a.reason), K.id(a.id) + ' · ' + esc(db.getFamily(a.family).name) + ' · ' + esc(a.by) + ', ' + K.dt(a.at)), { cls: 'wide c-cell', html: esc(a.collection) }, { cls: 'wide c-num', html: amountLabel(a) }, { cls: 'c-end', html: K.status(a.status) }] }; }), empty: 'No adjustments.' }));
  };
  Hub.actions['pp-adj'] = function (el) {
    var a = db.getAdjustment(el.dataset.id), cr = a.credit && db.getFamilyCredits(a.family).filter(function (c) { return c.id === a.credit; })[0];
    Hub.openSheet({ overline: '<span class="overline">' + esc(a.id) + '</span>', title: esc(a.kind) + ' · ' + amountLabel(a), body: K.kv([['Family', famLink(a.family)], a.player ? ['Player', pLink(a.player)] : null, ['Reason', esc(a.reason)], ['Collection method', esc(a.collection)], ['Status', K.status(a.status)],
      ['Created', K.stamp('Created', a.by, a.at)], a.waived ? ['Waived', esc(a.waived.reason) + '<br>' + K.stamp('Waived', a.waived.by, a.waived.at)] : null,
      cr ? ['Generated family credit', K.id(cr.id) + ' ' + K.money(cr.amount) + ' · ' + K.money(cr.remaining) + ' remaining'] : null].filter(Boolean)),
      foot: ui.btn('Close', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + (a.status === 'Pending collection' ? K.actBtn('Waive charge', 'pp-adj-waive', { id: a.id }, { variant: 'secondary' }) : '') });
  };
  Hub.actions['pp-adj-waive'] = function (el) { var a = db.getAdjustment(el.dataset.id), at = K.now(), who = K.me(); mutate(function () { db.waiveAdjustment(a.id, 'Waived by management', who, at); }, a.id + ' waived', a.id + ' waived (' + K.money(a.amount) + ')', a.family, { finance: true, at: at, who: who }); };
  Hub.actions['pp-adj-new'] = function () {
    var fams = db.getFamilies().filter(function (f) { return f.status !== 'Closed'; }).map(function (f) { return [f.id, f.name]; });
    Hub.openSheet({ title: 'New adjustment', body: K.form([K.field('Family', K.select('pp-adj-fam', fams, 'FAM-01')), K.field('Type', K.select('pp-adj-kind', [['Credit', 'Credit (creates a family credit)'], ['Charge', 'One-off charge']], 'Credit')),
      K.field('Amount (£)', K.input('pp-adj-amt', '', { type: 'number', placeholder: '10.00' })), K.field('Collection (charges)', K.select('pp-adj-col', ['Added to the next subscription charge', 'Card payment link', 'Cash at session'], '')),
      K.field('Reason', K.textarea('pp-adj-reason', '', 'Required: shown to the family'), null, true)]),
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Create adjustment', 'pp-adj-go', {}, { variant: 'primary' }) });
  };
  Hub.actions['pp-adj-go'] = function () {
    var fam = K.val('pp-adj-fam'), kind = K.val('pp-adj-kind'), amt = Math.round(parseFloat(K.val('pp-adj-amt')) * 100), reason = K.val('pp-adj-reason').trim(), col = K.val('pp-adj-col'), at = K.now(), who = K.me();
    if (!(amt > 0)) { Hub.toast('Enter an amount above £0'); return; } if (!reason) { Hub.toast('Add a reason'); return; }
    var a;
    mutate(function () { a = db.addAdjustment({ family: fam, player: null, kind: kind, amount: amt, reason: reason, collection: kind === 'Credit' ? 'Family credit' : col, by: who, at: at }); },
      kind === 'Credit' ? 'Credit of ' + K.money(amt) + ' added to ' + db.getFamily(fam).name : 'Charge of ' + K.money(amt) + ' created',
      (kind === 'Credit' ? 'Credit adjustment ' : 'Charge adjustment ') + K.money(amt) + ' for ' + db.getFamily(fam).name + ': ' + reason, fam, { finance: true, after: { amount: K.money(amt), kind: kind }, at: at, who: who });
  };

  /* ================================================================ HISTORY (AUDIT) */
  Hub.screens['mgmt-audit'] = function (ctx) {
    var h = K.head({ back: ['mgmt-more', 'More'], eyebrow: 'Management', title: 'History', sub: 'Every change, who made it and when. The list shows a safe summary; old and new values open in a restricted drawer.' });
    var g = K.guard(ctx, h, { empty: ['clock', 'No history yet', 'Changes appear here as people use the Hub.'] }); if (g) return g;
    var all = db.getAuditAll(), areas = ['All'].concat(all.map(function (e) { return e.area; }).filter(function (v, i, a) { return a.indexOf(v) === i; }));
    if (areas.indexOf(Q.auditArea) < 0) Q.auditArea = 'All';
    var list = all.filter(function (e) { return Q.auditArea === 'All' || e.area === Q.auditArea; });
    var bar = '<div class="lx-filterbar pp-filters">' + select('auditArea', 'Area', areas.map(function (a) { return [a, a === 'All' ? 'All areas' : a]; })) + '<span class="k-note">' + list.length + ' entries · newest first</span></div>';
    return K.page(h, bar + tbl({ cols: '120px minmax(0,1.8fr) minmax(0,1fr) 120px', head: ['When', 'Summary', { label: 'Who', cls: 'wide' }, { label: 'Area', cls: 'wide' }],
      rows: list.map(function (e) { return { action: 'pp-audit', data: { id: e.id }, label: 'Open ' + e.id, cells: [{ cls: 'c-time', html: K.dm(e.at) + '<small>' + esc(String(e.at).slice(11, 16)) + '</small>' }, K.cell(esc(e.summary), K.id(e.id) + (e.restricted ? ' · restricted' : '') + (e.finance ? ' · finance' : '')), { cls: 'wide c-cell', html: esc(e.who) }, { cls: 'wide c-cell', html: esc(e.area) }] }; }), empty: 'No entries for this area.' }));
  };
  function valueList(o) { if (!o) return '<span class="text-3">—</span>'; return Object.keys(o).map(function (k) { return '<div><span class="text-3">' + esc(k) + ':</span> ' + esc(o[k]) + '</div>'; }).join(''); }
  Hub.actions['pp-audit'] = function (el) {
    var e = db.getAuditEntry(el.dataset.id); if (!e) return;
    var detail = (e.before || e.after) ? K.restricted(['management'], K.kv([['Before', valueList(e.before)], ['After', valueList(e.after)]], true), 'Before and after values') : '<p class="k-note">No values were changed by this entry.</p>';
    Hub.openSheet({ overline: '<span class="overline">' + esc(e.id) + ' · ' + esc(e.area) + '</span>', title: esc(e.summary), body: K.kv([['Who', esc(e.who)], ['When', K.dt(e.at)], ['About', entityLink(e.entity)], ['Restricted', e.restricted ? 'Yes: contains personal details' : 'No']]) + '<section class="section">' + ui.sectionHead('Details') + detail + '</section>' });
  };
})();
