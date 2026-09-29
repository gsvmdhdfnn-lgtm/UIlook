/* Prototype shell: routing, navigation per area, sheet, toast and the
   prototype control bar. Hash routes are bare tokens (#mgmt-home). */
(function () {
  var I = Hub.icon, ui = Hub.ui, D = Hub.data, esc = ui.esc;
  var attentionCount = D.attention.summary.total;
  var approvalsCount = D.approvals.reduce(function (a, x) { return a + x.count; }, 0);

  var NAV = {
    management: [
      { id: 'mgmt-home', label: 'Home', icon: 'home' },
      { id: 'mgmt-attention', label: 'Attention', long: 'Needs Attention', icon: 'attention', badge: attentionCount },
      { id: 'mgmt-schedule', label: 'Schedule', icon: 'calendar' },
      { id: 'mgmt-coaches', label: 'Coaches', icon: 'coaches' },
      { id: 'mgmt-more', label: 'More', icon: 'grid' }
    ],
    coach: [
      { id: 'coach-home', label: 'Home', icon: 'home' },
      { id: 'coach-schedule', label: 'Schedule', icon: 'calendar' },
      { id: 'coach-library', label: 'Library', icon: 'book' },
      { id: 'coach-players', label: 'Player Hub', icon: 'players' }
    ],
    parent: [
      { id: 'parent-home', label: 'Home', icon: 'home' },
      { id: 'parent-sessions', label: 'Sessions', icon: 'calendar' },
      { id: 'parent-development', label: 'Development', icon: 'development' },
      { id: 'parent-more', label: 'More', icon: 'grid' }
    ]
  };
  var HOME = { management: 'mgmt-home', coach: 'coach-home', parent: 'parent-home' };
  var AREA_LABEL = { management: 'Management', coach: 'Coach Hub', parent: 'Parent & Player Hub' };
  var BUILT = { 'mgmt-home': 1, 'mgmt-attention': 1, 'mgmt-more': 1, 'coach-home': 1, 'parent-home': 1, system: 1 };

  var S = { role: 'management', area: 'management', route: 'mgmt-home', state: 'live', theme: 'auto', brand: 'joshevans' };
  try { var saved = JSON.parse(localStorage.getItem('hub-proto') || '{}'); ['theme', 'brand'].forEach(function (k) { if (saved[k]) S[k] = saved[k]; }); } catch (e) {}
  function persist() { try { localStorage.setItem('hub-proto', JSON.stringify({ theme: S.theme, brand: S.brand })); } catch (e) {} }

  function areaOf(route) { return route.indexOf('mgmt-') === 0 ? 'management' : route.indexOf('coach-') === 0 ? 'coach' : route.indexOf('parent-') === 0 ? 'parent' : null; }

  function navLinks(area, cls) {
    return NAV[area].map(function (n) {
      /* Anything reached through More keeps More highlighted. */
      var cur = n.id === S.route || (n.id === 'mgmt-more' && S.route.indexOf('mgmt-') === 0 && !NAV.management.some(function (m) { return m.id === S.route; }));
      return '<a class="' + cls + '" href="#' + n.id + '"' + (cur ? ' aria-current="page"' : '') + '>' + I(n.icon) + '<span>' + esc(n.label) + '</span>' + (n.badge ? '<span class="badge num">' + n.badge + '</span>' : '') + '</a>';
    }).join('');
  }

  function areaSwitch() {
    if (S.role !== 'management' || S.area === 'parent') return '';
    return '<div class="area-switch" role="group" aria-label="Switch view"><button type="button" data-action="area" data-area="management" aria-pressed="' + (S.area === 'management') + '">Manage</button><button type="button" data-action="area" data-area="coach" aria-pressed="' + (S.area === 'coach') + '">Coach</button></div>';
  }

  function sidebar() {
    var linkFor = function (id, label, icon, trail) {
      return '<a class="side-link" href="#' + id + '"' + (S.route === id ? ' aria-current="page"' : '') + '>' + I(icon) + '<span>' + esc(label) + '</span>' + (trail || '') + '</a>';
    };
    return '<aside class="sidebar" aria-label="Management navigation">' +
      '<a class="brand" href="#mgmt-home">' + Hub.brandMark() + '<span class="brand__name">' + esc(Hub.brand.hubName) + '<span class="brand__area">Management</span></span></a>' +
      '<nav class="side-group">' + linkFor('mgmt-home', 'Home', 'home') + linkFor('mgmt-attention', 'Needs Attention', 'attention', '<span class="badge num">' + attentionCount + '</span>') + '</nav>' +
      '<nav class="side-group"><div class="side-group__label">Areas</div>' + D.areas.map(function (a) { return linkFor('mgmt-' + a.id, a.label, a.icon, a.on ? '' : '<span class="off">Off</span>'); }).join('') + '</nav>' +
      '<nav class="side-group"><div class="side-group__label">Approvals</div>' + D.approvals.map(function (a) { return linkFor('mgmt-' + a.id, a.label, a.icon, a.count ? '<span class="badge badge--quiet num">' + a.count + '</span>' : ''); }).join('') + '</nav>' +
      '<nav class="side-group">' + linkFor('mgmt-settings', 'Settings & System', 'settings') + linkFor('mgmt-more', 'More', 'grid') + '</nav>' +
      '<div class="sidebar__foot">' + areaSwitch() + '<div class="sidebar__me">' + ui.avatar(D.me.name, 'sm') + '<span class="truncate"><b>' + esc(D.me.name) + '</b><small>' + esc(D.me.email) + '</small></span></div></div>' +
      '</aside>';
  }

  function topbar() {
    var who = S.area === 'parent' ? D.parent.name : D.me.name;
    return '<header class="topbar">' +
      '<a class="brand" href="#' + HOME[S.area] + '">' + Hub.brandMark() + '<span class="brand__name">' + esc(Hub.brand.hubName) + '<span class="brand__area">' + AREA_LABEL[S.area] + '</span></span></a>' +
      '<nav class="topbar__tabs" aria-label="Main">' + navLinks(S.area, '') + '</nav>' +
      '<span class="topbar__spacer"></span>' + areaSwitch() +
      '<button type="button" class="icon-btn me-btn" data-action="profile" aria-label="Account">' + ui.avatar(who, 'sm') + '</button>' +
      '</header>';
  }

  function protoBar() {
    function group(key, opts) { return '<div class="proto-bar__group" role="group">' + opts.map(function (o) { return '<button type="button" data-action="proto" data-key="' + key + '" data-val="' + o[0] + '" aria-pressed="' + (S[key] === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div>'; }
    return '<div class="proto-bar" role="toolbar" aria-label="Prototype controls"><span class="proto-bar__label">Prototype</span>' +
      group('role', [['management', 'Management'], ['coach', 'Coach'], ['parent', 'Parent']]) + '<span class="proto-bar__sep"></span>' +
      group('state', [['live', 'Data'], ['empty', 'Empty'], ['loading', 'Loading'], ['error', 'Error']].concat(S.route === 'coach-home' ? [['warning', 'Warning']] : [])) + '<span class="proto-bar__sep"></span>' +
      group('theme', [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']]) + '<span class="proto-bar__sep"></span>' +
      group('brand', [['joshevans', 'Josh Evans'], ['sample', 'Sample org']]) + '<span class="proto-bar__sep"></span>' +
      '<div class="proto-bar__group"><button type="button" data-action="goto" data-route="system" aria-pressed="' + (S.route === 'system') + '">Visual system</button></div>' +
      '</div>';
  }

  function placeholder() {
    var n = (NAV[S.area] || []).filter(function (x) { return x.id === S.route; })[0];
    var area = D.areas.filter(function (a) { return 'mgmt-' + a.id === S.route; })[0];
    var appr = D.approvals.filter(function (a) { return 'mgmt-' + a.id === S.route; })[0];
    var title = (n && (n.long || n.label)) || (area && area.label) || (appr && appr.label) || 'This screen';
    return '<div class="page page--read">' + ui.pageHead({ eyebrow: AREA_LABEL[S.area], title: title }) +
      '<div class="card">' + ui.empty('grid', 'Not in this first pass', 'This prototype covers five screens. The shared components are ready to apply here next.') + '</div></div>';
  }

  Hub.render = function () {
    var root = document.documentElement;
    if (S.theme === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', S.theme);
    Hub.applyBrand(S.brand);
    var app = document.getElementById('app');
    app.dataset.area = S.area;
    var screen = Hub.screens[S.route];
    var content = screen && BUILT[S.route] ? screen({ state: S.state }) : placeholder();
    app.innerHTML = protoBar() +
      '<div class="frame">' + (S.area === 'management' ? sidebar() : '') +
      '<div class="main">' + topbar() + '<main id="main" tabindex="-1">' + content + '</main></div></div>' +
      '<nav class="tabbar" aria-label="Main">' + navLinks(S.area, 'tab') + '</nav>';
    document.title = (S.route === 'system' ? 'Visual system' : AREA_LABEL[S.area]) + ' · Hub UI';
  };

  function go(route) {
    if (route === 'system') { S.route = 'system'; }
    else {
      var a = areaOf(route) || 'management';
      if (a === 'parent') S.role = 'parent';
      else if (S.role === 'parent') S.role = a === 'coach' ? 'coach' : 'management';
      else if (a === 'management') S.role = 'management';
      S.area = a; S.route = route;
    }
    if (S.state === 'warning' && S.route !== 'coach-home') S.state = 'live';
    if (!document.getElementById('sheet').hidden) Hub.closeSheet();
    Hub.render(); window.scrollTo(0, 0);
  }

  /* Sheet & toast */
  var lastFocus = null;
  Hub.openSheet = function (html) {
    lastFocus = document.activeElement;
    var el = document.getElementById('sheet');
    el.innerHTML = '<div class="sheet__scrim" data-action="close-sheet"></div><div class="sheet__panel" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><div class="sheet__grip"></div>' + html + '</div>';
    el.hidden = false; document.body.style.overflow = 'hidden';
    var f = el.querySelector('.sheet__panel button, .sheet__panel a'); if (f) f.focus();
  };
  Hub.closeSheet = function () { var el = document.getElementById('sheet'); el.hidden = true; el.innerHTML = ''; document.body.style.overflow = ''; if (lastFocus && lastFocus.focus) lastFocus.focus(); };
  var toastTimer;
  Hub.toast = function (t) { var el = document.getElementById('toast'); el.innerHTML = I('check', 'icon-sm') + '<span>' + esc(t) + '</span>'; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.hidden = true; }, 2200); };

  /* Actions */
  Hub.actions.proto = function (el) {
    var k = el.dataset.key, v = el.dataset.val;
    if (k === 'role') { S.role = v; S.state = 'live'; go(HOME[v]); return; }
    S[k] = v; persist(); Hub.render();
  };
  Hub.actions['goto'] = function (el) { location.hash = el.dataset.route; };
  Hub.actions.area = function (el) { location.hash = HOME[el.dataset.area]; };
  Hub.actions['close-sheet'] = function () { Hub.closeSheet(); };
  Hub.actions.soon = function () { Hub.toast('Not part of this first pass'); };
  Hub.actions.profile = function () {
    var who = S.area === 'parent' ? { name: D.parent.name, email: D.parent.email, role: 'Parent' } : { name: D.me.name, email: D.me.email, role: S.role === 'management' ? 'Management' : 'Coach' };
    Hub.openSheet('<div class="sheet__head"><div class="profile-head">' + ui.avatar(who.name, 'lg') + '<div><h2 id="sheet-title" class="profile-head__name">' + esc(who.name) + '</h2><div class="profile-head__meta"><span>' + esc(who.email) + '</span>' + ui.pill(who.role, 'info', 'pill--plain') + '</div></div></div><button type="button" class="icon-btn" data-action="close-sheet" aria-label="Close">' + I('x') + '</button></div>' +
      '<div class="sheet__body"><div class="card card--flush">' + ui.list([
        ui.row({ compact: true, lead: '<span class="tile__icon tile__icon--quiet">' + I('user', 'icon-sm') + '</span>', title: 'My profile', action: 'soon' }),
        ui.row({ compact: true, lead: '<span class="tile__icon tile__icon--quiet">' + I('bell', 'icon-sm') + '</span>', title: 'Notifications', action: 'soon' }),
        ui.row({ compact: true, lead: '<span class="tile__icon tile__icon--quiet">' + I('logout', 'icon-sm') + '</span>', title: 'Log out', action: 'soon', trail: '' })
      ]) + '</div></div>');
  };

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-action]');
    if (!a) return;
    var fn = Hub.actions[a.dataset.action];
    if (fn) { e.preventDefault(); fn(a); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !document.getElementById('sheet').hidden) Hub.closeSheet(); });
  window.addEventListener('hashchange', function () { go(location.hash.slice(1) || 'mgmt-home'); });

  go(location.hash.slice(1) || 'mgmt-home');
})();
