/* Prototype shell: routing, navigation per area, sheet, toast and the
   prototype control bar. Routes and destinations are unchanged from
   pass 1; only their presentation changed. Hash routes are bare tokens. */
(function () {
  var I = Hub.icon, ui = Hub.ui, D = Hub.data, esc = ui.esc;
  var attentionCount = D.attention.summary.total;

  function terms() { return Hub.brand.terms; }
  function NAV(area) {
    var t = terms();
    return {
      management: [
        { id: 'mgmt-home', label: 'Home', icon: 'home' },
        { id: 'mgmt-attention', label: 'Attention', long: 'Needs attention', icon: 'attention', bubble: attentionCount },
        { id: 'mgmt-schedule', label: 'Schedule', icon: 'calendar' },
        { id: 'mgmt-coaches', label: 'People', icon: 'users' },
        { id: 'mgmt-more', label: 'More', icon: 'grid' }
      ],
      staff: [
        { id: 'coach-home', label: 'Home', icon: 'home' },
        { id: 'coach-schedule', label: 'Schedule', icon: 'calendar' },
        { id: 'coach-library', label: 'Library', icon: 'book' },
        { id: 'coach-players', label: t.client === 'Parent' ? 'Player Hub' : 'Clients', icon: 'users' }
      ],
      client: [
        { id: 'parent-home', label: 'Home', icon: 'home' },
        { id: 'parent-sessions', label: 'Sessions', icon: 'calendar' },
        { id: 'parent-development', label: t.client === 'Parent' ? 'Development' : 'Progress', icon: 'development' },
        { id: 'parent-more', label: 'More', icon: 'grid' }
      ]
    }[area];
  }
  var HOME = { management: 'mgmt-home', staff: 'coach-home', client: 'parent-home' };
  function areaLabel(a) { var t = terms(); return { management: 'Management', staff: t.staff + ' hub', client: t.client + ' hub' }[a]; }
  var BUILT = { 'mgmt-home': 1, 'mgmt-attention': 1, 'mgmt-more': 1, 'mgmt-coaches': 1, 'coach-home': 1, 'parent-home': 1, system: 1 };

  var S = { role: 'management', area: 'management', route: 'mgmt-home', state: 'live', theme: 'auto', brand: 'relvor' };
  try { var saved = JSON.parse(localStorage.getItem('relvor-proto') || '{}'); ['theme', 'brand'].forEach(function (k) { if (saved[k]) S[k] = saved[k]; }); } catch (e) {}
  function persist() { try { localStorage.setItem('relvor-proto', JSON.stringify({ theme: S.theme, brand: S.brand })); } catch (e) {} }

  function areaOf(route) { return route.indexOf('mgmt-') === 0 ? 'management' : route.indexOf('coach-') === 0 ? 'staff' : route.indexOf('parent-') === 0 ? 'client' : null; }
  function isCurrent(id) {
    if (id === S.route) return true;
    /* Anything reached through More keeps More selected on mobile. */
    return id === 'mgmt-more' && S.route.indexOf('mgmt-') === 0 && !NAV('management').some(function (m) { return m.id === S.route; });
  }

  function tabLinks(area, cls) {
    return NAV(area).map(function (n) {
      return '<a class="' + cls + '" href="#' + n.id + '"' + (isCurrent(n.id) ? ' aria-current="page"' : '') + '>' + I(n.icon) + '<span>' + esc(n.label) + '</span>' + (n.bubble && cls === 'tab' ? '<span class="bubble">' + D.attention.summary.counts.Urgent + '</span>' : '') + '</a>';
    }).join('');
  }

  function areaSwitch() {
    if (S.role !== 'management' || S.area === 'client') return '';
    return '<div class="area-switch" role="group" aria-label="Switch workspace view"><button type="button" data-action="area" data-area="management" aria-pressed="' + (S.area === 'management') + '">Manage</button><button type="button" data-action="area" data-area="staff" aria-pressed="' + (S.area === 'staff') + '">' + esc(terms().staff) + '</button></div>';
  }

  function sidebar() {
    function link(id, label, icon, trail) {
      return '<a class="nav-link" href="#' + id + '"' + (S.route === id ? ' aria-current="page"' : '') + '>' + I(icon) + '<span>' + esc(label) + '</span>' + (trail || '') + '</a>';
    }
    var urgent = D.attention.summary.counts.Urgent;
    return '<aside class="sidebar" aria-label="Management navigation">' +
      '<button type="button" class="workspace" data-action="soon" aria-label="Switch organisation">' + Hub.orgMark() + '<span class="org__name">' + esc(Hub.brand.orgName) + '<span class="org__sub">' + esc(Hub.brand.orgSub) + '</span></span>' + I('selector', 'icon-sm') + '</button>' +
      '<nav class="nav">' + link('mgmt-home', 'Home', 'home') + link('mgmt-attention', 'Needs attention', 'attention', '<span class="count count--alert" title="' + urgent + ' urgent">' + attentionCount + '</span>') + '</nav>' +
      '<nav class="nav"><div class="nav__label">Workspace</div>' + D.areas.map(function (a) {
        var id = a.id === 'coaches' ? 'mgmt-coaches' : 'mgmt-' + a.id;
        var label = a.id === 'coaches' ? 'People' : a.label;
        return link(id, label, a.id === 'coaches' ? 'users' : a.id === 'players' ? 'family' : a.icon, a.on ? '' : '<span class="off">Off</span>');
      }).join('') + '</nav>' +
      '<nav class="nav"><div class="nav__label">Approvals</div>' + D.approvals.map(function (a) { return link('mgmt-' + a.id, a.label, a.icon, a.count ? '<span class="count">' + a.count + '</span>' : ''); }).join('') + '</nav>' +
      '<div class="sidebar__foot"><nav class="nav nav--quiet">' + link('mgmt-settings', 'Settings', 'settings') + link('mgmt-more', 'All tools', 'grid') + '</nav>' +
        '<div class="sidebar__rule"></div>' + areaSwitch() +
        '<button type="button" class="user-chip" data-action="profile">' + ui.avatar(D.me.name, 'md') + '<span class="truncate" style="text-align:left"><b>' + esc(D.me.name) + '</b><small>Management</small></span>' + I('dotsV', 'icon-sm') + '</button>' +
        '<div class="powered">' + Hub.relvorMark + '<span>Relvor</span></div>' +
      '</div></aside>';
  }

  function canvasBar() {
    var n = NAV('management').filter(function (x) { return x.id === S.route; })[0];
    var extra = { 'mgmt-coaches': 'People' };
    var title = extra[S.route] || (n && (n.long || n.label)) || pageTitle();
    return '<div class="canvas-bar"><div class="crumbs"><span>Management</span>' + I('chevron') + '<b>' + esc(title) + '</b></div><span class="canvas-bar__spacer"></span>' +
      '<button type="button" class="search-trigger" data-action="soon">' + I('search') + '<span>Search people, sessions, items</span><span class="kbd">⌘K</span></button>' +
      '<button type="button" class="icon-btn" data-action="soon" aria-label="Notifications">' + I('bell') + '<span class="dot"></span></button></div>';
  }

  function topbar() {
    var who = S.area === 'client' ? D.parent.name : D.me.name;
    return '<header class="topbar">' +
      '<a class="org" href="#' + HOME[S.area] + '">' + Hub.orgMark() + '<span class="org__name">' + esc(Hub.brand.orgName) + '<span class="org__sub">' + esc(areaLabel(S.area)) + '</span></span></a>' +
      '<nav class="topbar__tabs" aria-label="Main">' + tabLinks(S.area, '') + '</nav>' +
      '<span class="topbar__spacer"></span>' + areaSwitch() +
      '<button type="button" class="me-btn" data-action="profile" aria-label="Account">' + ui.avatar(who, '') + '</button></header>';
  }

  function protoBar() {
    var t = terms();
    function group(key, opts) { return '<div class="proto-bar__group" role="group">' + opts.map(function (o) { return '<button type="button" data-action="proto" data-key="' + key + '" data-val="' + o[0] + '" aria-pressed="' + (S[key] === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div>'; }
    return '<div class="proto-bar" role="toolbar" aria-label="Prototype controls"><span class="proto-bar__label">Prototype</span>' +
      group('role', [['management', 'Management'], ['staff', t.staff], ['client', t.client]]) + '<span class="proto-bar__sep"></span>' +
      group('state', [['live', 'Data'], ['empty', 'Empty'], ['loading', 'Loading'], ['error', 'Error']]) + '<span class="proto-bar__sep"></span>' +
      group('theme', [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']]) + '<span class="proto-bar__sep"></span>' +
      group('brand', [['relvor', 'Relvor'], ['joshevans', 'Josh Evans']]) + '<span class="proto-bar__sep"></span>' +
      '<div class="proto-bar__group"><button type="button" data-action="goto" data-route="system" aria-pressed="' + (S.route === 'system') + '">Visual system</button></div></div>';
  }

  function pageTitle() {
    var n = (NAV(S.area) || []).filter(function (x) { return x.id === S.route; })[0];
    var area = D.areas.filter(function (a) { return 'mgmt-' + a.id === S.route; })[0];
    var appr = D.approvals.filter(function (a) { return 'mgmt-' + a.id === S.route; })[0];
    return (n && (n.long || n.label)) || (area && area.label) || (appr && appr.label) || (S.route === 'mgmt-settings' ? 'Settings' : 'This screen');
  }
  function placeholder() {
    return '<div class="page page--narrow">' + ui.pageHead({ overline: areaLabel(S.area), title: pageTitle() }) +
      '<div class="zone-inset">' + ui.empty('grid', 'Not part of this visual pass', 'The shared system is ready to apply here. This screen keeps its place in navigation so the shell reads as complete.') + '</div></div>';
  }

  Hub.state = S;
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
      '<div class="main">' + topbar() + (S.area === 'management' ? canvasBar() : '') + '<main id="main" tabindex="-1">' + content + '</main></div></div>' +
      '<nav class="tabbar" aria-label="Main">' + tabLinks(S.area, 'tab') + '</nav>';
    document.title = (S.route === 'system' ? 'Visual system' : pageTitle()) + ' · ' + Hub.brand.orgName;
  };

  function go(route) {
    if (route === 'system') S.route = 'system';
    else {
      var a = areaOf(route) || 'management';
      if (a === 'client') S.role = 'client';
      else if (S.role === 'client') S.role = a === 'staff' ? 'staff' : 'management';
      else if (a === 'management') S.role = 'management';
      S.area = a; S.route = route;
    }
    if (!document.getElementById('sheet').hidden) Hub.closeSheet();
    Hub.render(); window.scrollTo(0, 0);
  }

  /* Sheet & toast */
  var lastFocus = null;
  Hub.openSheet = function (o) {
    lastFocus = document.activeElement;
    var el = document.getElementById('sheet');
    el.innerHTML = '<div class="sheet__scrim" data-action="close-sheet"></div><div class="sheet__panel" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><div class="sheet__grip"></div>' +
      '<div class="sheet__head"><div style="display:grid;gap:6px;min-width:0">' + (o.overline || '') + '<h2 id="sheet-title" class="sheet__title">' + o.title + '</h2>' + (o.meta || '') + '</div>' + ui.iconBtn('x', 'Close', { 'data-action': 'close-sheet' }) + '</div>' +
      '<div class="sheet__body">' + o.body + '</div>' + (o.foot ? '<div class="sheet__foot">' + o.foot + '</div>' : '') + '</div>';
    el.hidden = false; document.body.style.overflow = 'hidden';
    var f = el.querySelector('.sheet__panel button'); if (f) f.focus();
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
  Hub.actions.soon = function () { Hub.toast('Not part of this visual pass'); };
  Hub.actions.profile = function () {
    var who = S.area === 'client' ? { name: D.parent.name, email: D.parent.email, role: terms().client } : { name: D.me.name, email: D.me.email, role: S.role === 'management' ? 'Management' : terms().staff };
    Hub.openSheet({
      title: esc(who.name), meta: '<div class="identity__meta"><span>' + esc(who.role) + '</span><span>' + esc(who.email) + '</span></div>',
      body: '<div>' + ui.rows([
        ui.row({ lead: '<span class="row__icon">' + I('user', 'icon-sm') + '</span>', title: 'Profile', action: 'soon' }),
        ui.row({ lead: '<span class="row__icon">' + I('bell', 'icon-sm') + '</span>', title: 'Notifications', action: 'soon' }),
        ui.row({ lead: '<span class="row__icon">' + I('logout', 'icon-sm') + '</span>', title: 'Log out', action: 'soon', chevron: false })
      ], 'rows--lead') + '</div>'
    });
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
