/* Prototype shell: routing, navigation per area, sheet, toast and the
   prototype control bar. Routes and destinations are unchanged from
   pass 1; only their presentation changed. Hash routes are bare tokens. */
(function () {
  var I = Hub.icon, ui = Hub.ui, D = Hub.data, esc = ui.esc;

  function terms() { return Hub.brand.terms; }
  function NAV(area) {
    var t = terms();
    return {
      management: [
        /* Design pack: Management uses Home and More only at top level. */
        { id: 'mgmt-home', label: 'Home', icon: 'home', bubble: 1 },
        { id: 'mgmt-more', label: 'More', icon: 'grid' }
      ],
      staff: [
        { id: 'coach-home', label: 'Home', icon: 'home' },
        { id: 'coach-schedule', label: 'Schedule', icon: 'calendar' },
        { id: 'coach-library', label: 'Library', icon: 'book' },
        { id: 'coach-players', label: t.client === 'Parent' ? 'Player Hub' : 'Clients', icon: 'users' }
      ],
      public: [
        { id: 'pub-home', label: 'Home', icon: 'home' },
        { id: 'pub-offers', label: 'What we offer', icon: 'grid' },
        { id: 'pub-signin', label: 'Sign in', icon: 'user' }
      ],
      client: [
        { id: 'parent-home', label: 'Home', icon: 'home' },
        { id: 'parent-sessions', label: 'Sessions', icon: 'calendar' },
        { id: 'parent-development', label: t.client === 'Parent' ? 'Development' : 'Progress', icon: 'development' },
        { id: 'parent-more', label: 'More', icon: 'grid' }
      ]
    }[area];
  }
  var CORE = ['mgmt-attention', 'mgmt-schedule', 'mgmt-coaches', 'mgmt-players'];
  function staffPlural() { var t = terms().staff; return t === 'Coach' ? 'Coaches' : t; }
  Hub.staffPlural = staffPlural;
  var HOME = { management: 'mgmt-home', staff: 'coach-home', client: 'parent-home', public: 'pub-home' };
  function areaLabel(a) { var t = terms(); return { management: 'Management', staff: t.staff + ' hub', client: t.client + ' hub', public: 'Public site' }[a]; }
  var BUILT = { 'mgmt-players': 1, 'mgmt-home': 1, 'mgmt-attention': 1, 'mgmt-more': 1, 'mgmt-coaches': 1, 'mgmt-schedule': 1, 'mgmt-finance': 1, 'coach-home': 1, 'parent-home': 1, system: 1 };

  var S = { role: 'management', area: 'management', route: 'mgmt-home', param: '', state: 'live', theme: 'auto', brand: 'relvor', palette: 'original', finance: 'manage', coachRole: 'lead', scenario: null };
  /* Palette experiment: one scheme per area by default */
  var AREA_PALETTE = { management: 'slate', staff: 'forest', client: 'plum' };
  try { var saved = JSON.parse(localStorage.getItem('relvor-proto-v2') || '{}'); ['theme', 'brand', 'palette'].forEach(function (k) { if (saved[k]) S[k] = saved[k]; }); } catch (e) {}
  function persist() { try { localStorage.setItem('relvor-proto-v2', JSON.stringify({ theme: S.theme, brand: S.brand, palette: S.palette })); } catch (e) {} }

  function areaOf(route) { return route.indexOf('mgmt-') === 0 ? 'management' : route.indexOf('coach-') === 0 ? 'staff' : route.indexOf('parent-') === 0 ? 'client' : route.indexOf('pub-') === 0 ? 'public' : null; }
  function meta(r) { return Hub.routes[r || S.route] || {}; }
  function isCurrent(id) {
    if (id === S.route) return true;
    /* Core areas sit under Home; everything else is reached through More. */
    var m = meta();
    if (m.nav) return id === m.nav;
    if (id === 'mgmt-home') return CORE.indexOf(S.route) >= 0 || m.parent === 'home';
    return id === 'mgmt-more' && S.route.indexOf('mgmt-') === 0 && S.route !== 'mgmt-home' && CORE.indexOf(S.route) < 0 && m.parent !== 'home';
  }

  function tabLinks(area, cls) {
    return '<span class="glide__puck" aria-hidden="true"></span>' + NAV(area).map(function (n) {
      return '<a class="' + cls + (cls === '' ? 'glide__tab' : '') + '" href="#' + n.id + '"' + (isCurrent(n.id) ? ' aria-current="page"' : '') + '>' + I(n.icon) + '<span>' + esc(n.label) + '</span>' + (n.bubble && cls === 'tab' ? '<span class="bubble">' + D.attention.summary.counts.Urgent + '</span>' : '') + '</a>';
    }).join('');
  }

  function areaSwitch() {
    if (S.role !== 'management' || S.area === 'client') return '';
    return '<div class="area-switch" role="group" aria-label="Switch workspace view"><button type="button" data-action="area" data-area="management" aria-pressed="' + (S.area === 'management') + '">Manage</button><button type="button" data-action="area" data-area="staff" aria-pressed="' + (S.area === 'staff') + '">' + esc(terms().staff) + '</button></div>';
  }

  /* Pass 7 sidebar: a floating obsidian card. Relvor at the top, the
     organisation switcher beneath it, one calm list of destinations, and
     settings, help and the person anchored at the bottom. */
  function sidebar() {
    /* Home and More only, as the design pack sets out. The area you are in
       appears nested under its parent, so the sidebar says where you are
       without listing every destination. */
    function link(id, label, icon, open, trail) {
      return '<a class="nav-link' + (open ? ' is-open' : '') + '" href="#' + id + '"' + (S.route === id ? ' aria-current="page"' : '') + '>' + I(icon) + '<span>' + esc(label) + '</span>' + (trail || '') + '</a>';
    }
    var inCore = CORE.indexOf(S.route) >= 0 || meta().parent === 'home', inMore = !inCore && S.route !== 'mgmt-home' && S.route !== 'mgmt-more';
    var child = '<a class="nav-child" href="#' + S.route + '" aria-current="page"><span>' + esc(pageTitle()) + '</span></a>';
    var c = D.attention.summary.counts;
    var status = '<a class="side-status" href="#mgmt-attention"><span class="side-status__k">' + ui.sev('Urgent') + 'Needs attention</span>' +
      '<b class="num">' + c.Urgent + ' urgent</b><small class="num">' + c.Warning + ' warning \u00b7 ' + c.Normal + ' normal</small><span class="side-status__go">Review' + I('arrowRight', 'icon-sm') + '</span></a>';
    return '<aside class="sidebar" aria-label="Management navigation">' +
      '<a class="rv-brand" href="#mgmt-home" aria-label="Relvor home">' + Hub.relvorLogo + '<span>Relvor</span></a>' +
      '<button type="button" class="org-card" data-action="org-switch" aria-label="Switch organisation"><span class="org-card__mark">' + esc(ui.initials(Hub.brand.orgName)) + '</span><span class="org-card__text"><b>' + esc(Hub.brand.orgFull || Hub.brand.orgName) + '</b><small>Management hub</small></span>' + I('chevron', 'icon-sm') + '</button>' +
      '<nav class="nav nav--main">' + link('mgmt-home', 'Home', 'home', inCore) + (inCore ? child : '') + link('mgmt-more', 'More', 'grid', inMore) + (inMore ? child : '') + '</nav>' +
      (S.state === 'live' ? status : '') +
      '<div class="sidebar__foot">' + areaSwitch() +
        '<button type="button" class="user-card" data-action="profile">' + ui.avatar(D.me.name, 'md') + '<span class="truncate"><b>' + esc(D.me.name) + '</b><small>Management</small></span>' + I('chevron', 'icon-sm') + '</button>' +
      '</div></aside>';
  }

  function canvasBar() {
    var n = NAV('management').filter(function (x) { return x.id === S.route; })[0];
    var extra = { 'mgmt-schedule': 'Schedule & Sessions', 'mgmt-finance': 'Finance' };
    var title = extra[S.route] || (n && (n.long || n.label)) || pageTitle();
    var tail = Hub.crumbTail ? I('chevron') + '<b>' + esc(Hub.crumbTail) + '</b>' : '';
    if (S.route === 'mgmt-home') {
      return '<div class="canvas-bar canvas-bar--home"><button type="button" class="search-trigger" data-action="search">' + I('search') + '<span>Search anything\u2026</span><span class="kbd">\u2318K</span></button><span class="canvas-bar__spacer"></span>' +
        ui.btn('Add new', { variant: 'primary', size: 'sm', icon: 'plus', attrs: { 'data-action': 'add-new' } }) +
        '<button type="button" class="icon-btn" data-action="go" data-route="mgmt-notifications" aria-label="Notifications">' + I('bell') + '<span class="dot"></span></button>' +
        '<button type="button" class="me-btn" data-action="profile" aria-label="Account">' + ui.avatar(D.me.name, 'sm') + '</button></div>';
    }
    var parent = (CORE.indexOf(S.route) >= 0 || meta().parent === 'home') ? 'Home' : S.route === 'mgmt-more' ? 'Management' : 'More';
    return '<div class="canvas-bar"><div class="crumbs"><a href="#' + (parent === 'More' ? 'mgmt-more' : 'mgmt-home') + '">' + parent + '</a>' + I('chevron') + (tail ? '<span>' + esc(title) + '</span>' + tail : '<b>' + esc(title) + '</b>') + '</div><span class="canvas-bar__spacer"></span>' +
      '<button type="button" class="search-trigger" data-action="search">' + I('search') + '<span>Search people, sessions, items</span><span class="kbd">⌘K</span></button>' +
      '<button type="button" class="icon-btn" data-action="go" data-route="mgmt-notifications" aria-label="Notifications">' + I('bell') + '<span class="dot"></span></button></div>';
  }

  /* Josh Evans: the Hub's own shell (Coach-allocation-TEST, read only as
     a reference): white header with a lime rule, the JE logo over a hub
     label, a hub switch, and an Anton pill nav beneath. */
  function jeHeader() {
    var who = S.area === 'client' ? D.parent.name : D.me.name;
    var mode = { management: 'Management Hub', staff: 'Coach Hub', client: 'Parent / Player Hub', public: 'Soccer School' }[S.area];
    var sw = S.role === 'management' && S.area !== 'client' ? (S.area === 'management'
      ? '<button type="button" class="je-switch" data-action="area" data-area="staff">' + I('chevron', 'icon-sm flip') + 'Coach Hub</button>'
      : '<button type="button" class="je-switch je-switch--primary" data-action="area" data-area="management">Management Hub</button>') : '';
    return '<header class="je-top"><a class="je-brand" href="#' + HOME[S.area] + '" aria-label="Josh Evans home"><img src="assets/je-logo.png" alt="Josh Evans Soccer School"><span class="je-brand__mode">' + mode + '</span></a>' +
      '<span class="topbar__spacer"></span>' + sw + (S.area === 'public' ? publicActions() : '<button type="button" class="je-me" data-action="profile" aria-label="Account">' + ui.avatar(who, '') + '</button>') + '</header>' +
      '<nav class="je-nav" aria-label="Main">' + NAV(S.area).map(function (n) {
        var cur = isCurrent(n.id);
        return '<a class="je-pill' + (cur ? ' is-active' : '') + '" href="#' + n.id + '"' + (cur ? ' aria-current="page"' : '') + '>' + esc(n.label) + (n.bubble ? '<span class="je-pill__n">' + D.attention.summary.counts.Urgent + '</span>' : '') + '</a>';
      }).join('') + '</nav>';
  }

  function publicActions() {
    return '<span class="k-pubact">' + ui.btn('Sign in', { variant: 'tertiary', size: 'sm', attrs: { 'data-action': 'go', 'data-route': 'pub-signin' } }) + ui.btn('Register', { variant: 'primary', size: 'sm', attrs: { 'data-action': 'go', 'data-route': 'pub-register' } }) + '</span>';
  }
  function topbar() {
    if (S.brand === 'joshevans') return jeHeader();
    var who = S.area === 'client' ? D.parent.name : D.me.name;
    return '<header class="topbar">' +
      '<a class="org" href="#' + HOME[S.area] + '">' + Hub.orgMark() + '<span class="org__name">' + esc(Hub.brand.orgName) + '<span class="org__sub">' + esc(areaLabel(S.area)) + '</span></span></a>' +
      '<nav class="topbar__tabs glide glide--bar" data-glide="top-' + S.area + '" aria-label="Main">' + tabLinks(S.area, '') + '</nav>' +
      '<span class="topbar__spacer"></span>' + areaSwitch() +
      (S.area === 'public' ? publicActions() : '<button type="button" class="me-btn" data-action="profile" aria-label="Account">' + ui.avatar(who, '') + '</button>') + '</header>';
  }

  function protoBar() {
    var t = terms();
    function group(key, opts) { return '<div class="proto-bar__group" role="group">' + opts.map(function (o) { return '<button type="button" data-action="proto" data-key="' + key + '" data-val="' + o[0] + '" aria-pressed="' + (S[key] === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div>'; }
    return '<div class="proto-bar" role="toolbar" aria-label="Prototype controls"><span class="proto-bar__label">Prototype</span>' +
      group('role', [['management', 'Management'], ['staff', t.staff], ['client', t.client], ['public', 'Public']]) + '<span class="proto-bar__sep"></span>' +
      (S.area === 'staff' ? '<span class="proto-bar__label">' + esc(t.staff) + ' role</span>' + group('coachRole', [['lead', 'Lead'], ['coach', t.staff], ['learning', 'Learning']]) + '<span class="proto-bar__sep"></span>' : '') +
      '<span class="proto-bar__label">Finance access</span>' + group('finance', [['none', 'None'], ['view', 'View'], ['manage', 'Manage']]) + '<span class="proto-bar__sep"></span>' +
      '<div class="proto-bar__group"><button type="button" class="proto-menu" data-action="proto-features">Feature switches</button><button type="button" class="proto-menu" data-action="proto-scenarios">' + (S.scenario ? 'Scenario: on' : 'Scenario') + '</button></div><span class="proto-bar__sep"></span>' +
      group('state', [['live', 'Data'], ['empty', 'Empty'], ['loading', 'Loading'], ['error', 'Error']]) + '<span class="proto-bar__sep"></span>' +
      group('theme', [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']]) + '<span class="proto-bar__sep"></span>' +
      group('brand', [['relvor', 'Relvor'], ['joshevans', 'Josh Evans']]) + '<span class="proto-bar__sep"></span>' +
      '<span class="proto-bar__label">Palette</span>' + group('palette', [['original', 'Relvor'], ['area', 'By area'], ['slate', 'Slate'], ['forest', 'Forest'], ['plum', 'Plum'], ['carbon', 'Carbon']]) + '<span class="proto-bar__sep"></span>' +
      '<div class="proto-bar__group"><button type="button" data-action="goto" data-route="system" aria-pressed="' + (S.route === 'system') + '">Visual system</button></div></div>';
  }

  /* Guided walkthroughs: Hub.scenarios is filled by js/scenarios.js */
  function scenarioBar() {
    if (!S.scenario) return '';
    var sc = (Hub.scenarios || {})[S.scenario.id]; if (!sc) return '';
    var i = S.scenario.step, st = sc.steps[i];
    return '<div class="k-scenario" role="region" aria-label="Guided walkthrough"><span class="k-scenario__k">Scenario · ' + (i + 1) + ' of ' + sc.steps.length + '</span>' +
      '<span class="k-scenario__text"><b>' + esc(sc.title) + ': ' + esc(st.title) + '</b><small>' + esc(st.text) + '</small></span>' +
      '<button type="button" data-action="scn-step" data-dir="-1"' + (i === 0 ? ' disabled' : '') + '>Back</button>' +
      (i < sc.steps.length - 1 ? '<button type="button" class="is-primary" data-action="scn-step" data-dir="1">Next step</button>' : '<button type="button" class="is-primary" data-action="scn-exit">Finish</button>') +
      '<button type="button" data-action="scn-exit">Exit</button></div>';
  }
  function scnGo() {
    var sc = Hub.scenarios[S.scenario.id], st = sc.steps[S.scenario.step];
    if (st.before) st.before(Hub.data);
    if (st.role) { S.role = st.role; }
    if (st.coachRole) S.coachRole = st.coachRole;
    if (location.hash.slice(1) === st.route) go(st.route); else location.hash = st.route;
  }
  Hub.actions['scn-start'] = function (el) { S.scenario = { id: el.dataset.id, step: 0 }; var sc = Hub.scenarios[el.dataset.id]; if (sc.setup) sc.setup(Hub.data); Hub.closeSheet(true); scnGo(); };
  Hub.actions['scn-step'] = function (el) { var sc = Hub.scenarios[S.scenario.id]; S.scenario.step = Math.max(0, Math.min(sc.steps.length - 1, S.scenario.step + (+el.dataset.dir))); scnGo(); };
  Hub.actions['scn-exit'] = function () { var done = S.scenario; S.scenario = null; Hub.render(); if (done) Hub.toast('Walkthrough finished'); };
  Hub.actions['proto-scenarios'] = function () {
    var list = Object.keys(Hub.scenarios || {}).map(function (k) { var sc = Hub.scenarios[k]; return ui.row({ lead: '<span class="row__icon">' + I(sc.icon || 'arrowRight', 'icon-sm') + '</span>', title: esc(sc.title), sub: [esc(sc.steps.length + ' steps'), esc(sc.summary || '')], action: 'scn-start', data: { id: k } }); });
    Hub.openSheet({ overline: '<span class="overline">Prototype</span>', title: 'Guided walkthroughs', body: '<p class="k-note">Each walkthrough moves between screens and roles. Do the step on the page, or press Next step to continue. All changes stay in this browser tab.</p>' + ui.rows(list, 'rows--lead') });
  };
  Hub.actions['proto-features'] = function () {
    var rows = Object.keys(Hub.featureInfo).map(function (k) { return '<div class="k-featrow">' + Hub.kit.toggle(Hub.features[k] !== false, 'proto-feature', { key: k }, Hub.featureInfo[k]) + '</div>'; }).join('');
    Hub.openSheet({ overline: '<span class="overline">Prototype</span>', title: 'Feature switches', body: '<p class="k-note">Turn features off to see how the Hub reads when an organisation does not use them. Switched-off areas stay visible but disabled, as the backend allows.</p><div class="k-featlist">' + rows + '</div>' });
  };
  Hub.actions['proto-feature'] = function (el) { var k = el.dataset.key; Hub.features[k] = Hub.features[k] === false; if (Hub.db.setFeature) Hub.db.setFeature(k, Hub.features[k], Hub.kit.me(), Hub.kit.now()); Hub.render(); Hub.actions['proto-features'](); Hub.toast(Hub.featureInfo[k] + (Hub.features[k] ? ' switched on' : ' switched off')); };

  function pageTitle() {
    if (Hub.title) return Hub.title;
    var m = meta(); if (m.title) return typeof m.title === 'function' ? m.title() : m.title;
    var fixed = { 'mgmt-attention': 'Needs attention', 'mgmt-coaches': staffPlural(), 'mgmt-players': 'Players & ' + terms().client + 's', 'mgmt-content': 'Content & Brand', 'mgmt-reports': 'Reports' };
    if (fixed[S.route]) return fixed[S.route];
    var n = (NAV(S.area) || []).filter(function (x) { return x.id === S.route; })[0];
    var area = D.areas.filter(function (a) { return 'mgmt-' + a.id === S.route; })[0];
    var appr = D.approvals.filter(function (a) { return 'mgmt-' + a.id === S.route; })[0];
    return (n && (n.long || n.label)) || (area && area.label) || (appr && appr.label) || (S.route === 'mgmt-settings' ? 'Settings' : 'This screen');
  }
  function placeholder() {
    return '<div class="page page--narrow">' + ui.pageHead({ overline: areaLabel(S.area), title: pageTitle() }) +
      '<div class="zone-inset">' + ui.empty('grid', 'Not part of this visual pass', 'The shared system is ready to apply here. This screen keeps its place in navigation so the shell reads as complete.') + '</div></div>';
  }

  /* The glide selector: it remembers where it was and glides to where it
     is now, even across full re-renders. */
  var puckAt = {};
  function placePucks(root) {
    root.querySelectorAll('[data-glide]').forEach(function (rail) {
      var puck = rail.querySelector('.glide__puck'), key = rail.dataset.glide;
      var sel = rail.querySelector('[aria-selected="true"], [aria-current="page"]');
      if (!puck) return;
      if (!sel || !sel.offsetWidth) { puck.style.opacity = '0'; return; }
      var to = { left: sel.offsetLeft, width: sel.offsetWidth }, from = puckAt[key];
      rail.classList.add('no-anim');
      puck.style.left = (from || to).left + 'px'; puck.style.width = (from || to).width + 'px';
      void puck.offsetWidth;
      rail.classList.remove('no-anim');
      puck.style.left = to.left + 'px'; puck.style.width = to.width + 'px';
      puckAt[key] = to;
      if (rail.scrollWidth > rail.clientWidth && sel.offsetLeft + sel.offsetWidth > rail.clientWidth) rail.scrollLeft = sel.offsetLeft - 24;
    });
  }
  window.addEventListener('resize', function () { puckAt = {}; placePucks(document); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { puckAt = {}; placePucks(document); });

  Hub.state = S;
  Hub.go = function (r) { location.hash = r; };
  Hub.render = function () {
    if (Hub.db.getAttention) Hub.db.getAttention();
    var root = document.documentElement;
    /* The Josh Evans Hub is light only, so its brand ignores the theme switch. */
    var theme = S.brand === 'joshevans' ? 'light' : S.theme;
    if (theme === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', theme);
    Hub.applyBrand(S.brand);
    var app = document.getElementById('app');
    app.dataset.area = S.area;
    app.dataset.brand = S.brand;
    var pal = S.palette === 'area' ? AREA_PALETTE[S.area] : S.palette;
    if (pal && pal !== 'original' && S.brand !== 'joshevans') app.dataset.palette = pal; else delete app.dataset.palette;
    var screen = Hub.screens[S.route];
    Hub.crumbTail = null;
    Hub.title = null;
    var content = screen && (BUILT[S.route] || Hub.screens[S.route]) ? screen({ state: S.state, param: S.param }) : placeholder();
    var animate = Hub.animateSection; Hub.animateSection = false;
    app.innerHTML = protoBar() + scenarioBar() +
      '<div class="frame">' + (S.area === 'management' && S.brand !== 'joshevans' ? sidebar() : '') +
      '<div class="main">' + topbar() + (S.area === 'management' && S.brand !== 'joshevans' ? canvasBar() : '') + '<main id="main" tabindex="-1">' + content + '</main></div></div>' +
      '<nav class="tabbar" data-glide="bar-' + S.area + '" aria-label="Main">' + tabLinks(S.area, 'tab') + '</nav>';
    if (animate) { var sec = app.querySelector('.lx-body') || app.querySelector('.ws + .page'); if (sec) sec.classList.add(Hub.sectionDir < 0 ? 'enter-left' : 'enter-right'); }
    placePucks(app);
    /* Day lines that scroll (phones) open on the first thing still to come */
    app.querySelectorAll('.dayline__scroll').forEach(function (sc) {
      if (sc.scrollWidth <= sc.clientWidth) return;
      var next = sc.querySelector('.blk:not(.blk--past)');
      if (next) sc.scrollLeft = Math.max(0, next.offsetLeft - 96);
    });
    document.title = (S.route === 'system' ? 'Visual system' : pageTitle()) + ' · ' + Hub.brand.orgName;
  };

  function go(full) {
    var parts = String(full).split('/'), route = parts[0];
    S.param = decodeURIComponent(parts.slice(1).join('/'));
    if (route === 'system') S.route = 'system';
    else {
      var a = areaOf(route) || 'management';
      if (a === 'client') S.role = 'client';
      else if (a === 'public') S.role = 'public';
      else if (S.role === 'client' || S.role === 'public') S.role = a === 'staff' ? 'staff' : 'management';
      else if (a === 'management') S.role = 'management';
      S.area = a; S.route = route;
    }
    if (!document.getElementById('sheet').hidden) Hub.closeSheet(true);
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
  Hub.closeSheet = function (instant) {
    var el = document.getElementById('sheet');
    function done() { el.hidden = true; el.classList.remove('is-closing'); el.innerHTML = ''; document.body.style.overflow = ''; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
    if (instant || el.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) { done(); return; }
    el.classList.add('is-closing'); setTimeout(done, 260);
  };
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
  Hub.actions.soon = function () { Hub.toast('Done'); };
  /* Shell actions: organisation switcher, create menu and search */
  Hub.actions['org-switch'] = function () {
    var opts = [['relvor', 'Northfield Group', 'Relvor demo organisation'], ['joshevans', 'Josh Evans Coaching', 'Uses the Josh Evans Hub look']];
    Hub.openSheet({ overline: '<span class="overline">Organisations you manage</span>', title: 'Switch organisation', body: ui.rows(opts.map(function (o) { return ui.row({ lead: '<span class="org-card__mark">' + esc(ui.initials(o[1])) + '</span>', title: esc(o[1]), sub: [esc(o[2])], action: 'org-pick', data: { brand: o[0] }, trail: S.brand === o[0] ? ui.status('Current', 'ok') : '' }); }), 'rows--lead') });
  };
  Hub.actions['org-pick'] = function (el) { S.brand = el.dataset.brand; persist(); Hub.closeSheet(true); Hub.render(); Hub.toast('Switched to ' + Hub.brand.orgName); };
  Hub.actions['add-new'] = function () {
    var items = [['calendar', 'Session', 'Create a session and its occurrences', 'mgmt-session-new'], ['users', 'Player', 'Add a player to a family', 'mgmt-players-list'], ['coaches', terms().staff, 'Invite a ' + terms().staff.toLowerCase(), 'mgmt-coach-signups'], ['finance', 'Invoice draft', 'Build an invoice from delivered occurrences', 'mgmt-fin-drafts'], ['plus', 'Adjustment', 'A one-off charge or credit for a family', 'mgmt-adjustments'], ['pin', 'Venue unavailability', 'Close a venue for some dates', 'mgmt-venues']];
    Hub.openSheet({ overline: '<span class="overline">Create</span>', title: 'Add new', body: ui.rows(items.map(function (i) { return ui.row({ lead: '<span class="row__icon">' + I(i[0], 'icon-sm') + '</span>', title: esc(i[1]), sub: [esc(i[2])], href: '#' + i[3] }); }), 'rows--lead') });
  };
  function searchResults(q) {
    q = q.toLowerCase(); if (q.length < 2) return '<p class="k-note">Type at least two letters: a player, parent, coach, session, venue or invoice number.</p>';
    var db = Hub.db, out = [];
    db.getPlayers().forEach(function (p) { if (p.name.toLowerCase().indexOf(q) >= 0) out.push(['users', p.name, 'Player · ' + p.ageGroup, 'mgmt-player/' + p.id]); });
    db.getParents().forEach(function (p) { if (p.name.toLowerCase().indexOf(q) >= 0) out.push(['family', p.name, 'Parent · ' + p.relationship, 'mgmt-parent/' + p.id]); });
    db.getCoaches().forEach(function (c) { if (c.name.toLowerCase().indexOf(q) >= 0) out.push(['coaches', c.name, terms().staff + ' · ' + c.role, 'mgmt-coach/' + c.id]); });
    db.getSessions().forEach(function (x) { if (x.name.toLowerCase().indexOf(q) >= 0) out.push(['calendar', x.name, 'Session · ' + x.id, 'mgmt-session/' + x.id]); });
    db.getVenues().forEach(function (v) { if (v.name.toLowerCase().indexOf(q) >= 0) out.push(['pin', v.name, 'Venue', 'mgmt-venue/' + v.key]); });
    if (Hub.state.finance !== 'none') db.getInvoices().forEach(function (i) { if ((i.number + ' ' + db.getClient(i.client).name).toLowerCase().indexOf(q) >= 0) out.push(['finance', i.number, 'Invoice · ' + db.getClient(i.client).name, 'mgmt-fin-invoice/' + i.id]); });
    if (!out.length) return ui.empty('search', 'No matches', 'Try a first name, a session or an invoice number.');
    return ui.rows(out.slice(0, 12).map(function (o) { return ui.row({ lead: '<span class="row__icon">' + I(o[0], 'icon-sm') + '</span>', title: esc(o[1]), sub: [esc(o[2])], href: '#' + o[3] }); }), 'rows--lead');
  }
  Hub.actions.search = function () {
    Hub.openSheet({ overline: '<span class="overline">Search</span>', title: 'Search the Hub', body: '<input class="input" id="hub-search" placeholder="Search people, sessions, venues, invoices" autocomplete="off"><div id="hub-search-results">' + searchResults('') + '</div>' });
    var inp = document.getElementById('hub-search'); inp.focus();
    inp.addEventListener('input', function () { document.getElementById('hub-search-results').innerHTML = searchResults(inp.value); });
  };
  Hub.actions.profile = function () {
    var who = S.area === 'client' ? { name: D.parent.name, email: D.parent.email, role: terms().client } : { name: D.me.name, email: D.me.email, role: S.role === 'management' ? 'Management' : terms().staff };
    Hub.openSheet({
      title: esc(who.name), meta: '<div class="identity__meta"><span>' + esc(who.role) + '</span><span>' + esc(who.email) + '</span></div>',
      body: '<div>' + ui.rows([
        ui.row({ lead: '<span class="row__icon">' + I('user', 'icon-sm') + '</span>', title: 'Profile', href: '#' + ({ management: 'mgmt-profile', staff: 'coach-profile', client: 'parent-profile' }[S.area] || 'mgmt-profile') }),
        ui.row({ lead: '<span class="row__icon">' + I('bell', 'icon-sm') + '</span>', title: 'Notifications', href: '#' + ({ management: 'mgmt-notifications', staff: 'coach-notifications', client: 'parent-notifications' }[S.area] || 'mgmt-notifications') }),
        ui.row({ lead: '<span class="row__icon">' + I('logout', 'icon-sm') + '</span>', title: 'Log out', href: '#pub-signin', chevron: false })
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
