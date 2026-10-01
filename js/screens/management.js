/* Management screens. Page structure, tabs, grouping and navigation follow
   the Josh Evans Hub design pack (docs/design in the supplied ZIP): Home
   and More at top level; Needs Attention, Schedule & Sessions, Coaches and
   Players & Parents as the core areas reached from Home; Finance and the
   rest reached through More. Presentation stays Relvor's. Mock data only. */
(function () {
  var ui = Hub.ui, I = Hub.icon, D = Hub.data, esc = ui.esc;
  function venue(o) { return D.venues[o.venue].name; }
  function todayOcc() { return D.occurrences.filter(function (o) { return o.date === '2026-10-01'; }); }
  function tomorrowOcc() { return D.occurrences.filter(function (o) { return o.date === '2026-10-02'; }); }
  function occProblem(o) {
    if (!o.staff.length) return ui.status('No staff assigned', 'danger');
    if (o.staff.some(function (s) { return s.unavailable; })) return ui.status('Staff unavailable', 'danger');
    return '';
  }
  function skeleton(n) { var r = []; for (var i = 0; i < n; i++) r.push('<div class="row"><span class="skeleton" style="width:14px;height:14px;border-radius:50%"></span><div style="display:grid;gap:8px"><span class="skeleton" style="height:13px;width:' + (58 - i * 7) + '%"></span><span class="skeleton" style="height:11px;width:34%"></span></div><span></span></div>'); return ui.rows(r, 'rows--lead'); }
  function due(c) { return '<span class="num when when--' + c.severity.toLowerCase() + '">' + esc(c.when) + '</span>'; }

  function caseRow(c) {
    return ui.row({
      stretch: true, action: 'case', data: { key: c.caseKey }, cls: c.severity === 'Urgent' ? 'is-urgent' : '',
      lead: ui.sev(c.severity), title: esc(c.title), sub: [esc(c.detail)],
      after: '<div class="row__sub only-narrow">' + due(c) + '</div>',
      trail: '<span class="wide-inline trail-swap">' + due(c) + ui.btn(c.actionLabel, { size: 'sm', cls: 'hover-action', trail: 'arrowRight', attrs: { 'data-action': 'case', 'data-key': c.caseKey } }) + '</span>',
      chevron: false
    });
  }

  function todayTable(list) {
    return ui.table({
      cols: '64px minmax(0, 1.6fr) minmax(0, 1.1fr) 72px minmax(0, 150px)',
      head: ['Time', 'Session', { label: 'Staff', cls: 'wide' }, { label: 'Expected', cls: 'c-num wide' }, { label: '', cls: 'wide' }],
      body: list.slice().sort(function (a, b) { return a.start < b.start ? -1 : 1; }).map(function (o) {
        return ui.tr([
          { cls: 'c-time', html: o.start + '<small>' + o.end + '</small>' },
          { cls: 'c-main', html: '<span class="c-title">' + esc(o.session) + '</span><span class="c-sub">' + esc(venue(o)) + '<span class="only-narrow-inline"> · ' + o.players + ' expected</span></span>' },
          { cls: 'wide c-cell', html: o.staff.length ? ui.staffNames(o.staff) : '<span class="c-mute">—</span>' },
          { cls: 'c-num wide', html: String(o.players) },
          { cls: 'c-end', html: occProblem(o) }
        ], { action: 'soon', label: 'Open ' + o.session });
      }).join('')
    });
  }

  /* ------------------------------------------------------- Layout pieces */
  function head(o) {
    return '<header class="lx-head">' +
      (o.back ? '<a class="lx-back" href="' + o.back.href + '"' + (o.back.action ? ' data-action="' + o.back.action + '" data-view="' + o.back.view + '"' : '') + '>' + I('chevron', 'icon-sm flip') + esc(o.back.label) + '</a>' : '') +
      '<div class="lx-head__row"><div class="lx-head__text"><div class="lx-eyebrow">' + esc(o.eyebrow) + '</div><h1 class="lx-title">' + esc(o.title) + '</h1>' +
      (o.sub ? '<p class="lx-sub">' + o.sub + '</p>' : '') + '</div>' + (o.actions ? '<div class="lx-head__actions">' + o.actions + '</div>' : '') + '</div>' +
      (o.tabs || '') + '</header>';
  }
  function page(h, body, cls) { return '<div class="lx' + (cls ? ' ' + cls : '') + '">' + h + '<div class="lx-body">' + body + '</div></div>'; }
  function section(title, sub, body, right) {
    return '<section class="lx-section"><div class="lx-section__head"><div><h2>' + esc(title) + '</h2>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (right || '') + '</div>' + body + '</section>';
  }
  function stat(o) {
    var tag = o.href ? 'a' : o.action ? 'button' : 'div';
    return '<' + tag + ' class="lx-stat' + (o.tone ? ' lx-stat--' + o.tone : '') + '"' + (o.href ? ' href="' + o.href + '"' : '') + (o.action ? ' type="button" data-action="' + o.action + '"' : '') + '>' +
      '<span class="lx-stat__label">' + esc(o.label) + '</span><b class="lx-stat__value num">' + o.value + '</b>' + (o.sub ? '<small>' + o.sub + '</small>' : '') + '</' + tag + '>';
  }
  function areaCard(o) {
    var tag = o.href ? 'a' : 'button';
    return '<' + tag + ' class="lx-area"' + (o.href ? ' href="' + o.href + '"' : ' type="button" data-action="' + o.action + '"' + (o.data || '')) + '>' +
      '<span class="lx-area__top"><span class="lx-area__icon">' + I(o.icon) + '</span>' + I('arrowRight', 'icon-sm lx-area__go') + '</span>' +
      '<span class="lx-area__title">' + esc(o.title) + '</span>' +
      (o.value != null ? '<span class="lx-area__value"><b class="num">' + o.value + '</b><small>' + esc(o.label) + '</small></span>' : '') +
      '<span class="lx-area__desc">' + esc(o.desc) + '</span>' + (o.cta ? '<span class="lx-area__cta">' + esc(o.cta) + I('arrowRight', 'icon-sm') + '</span>' : '') + '</' + tag + '>';
  }
  function tabs(id, list, active) {
    return '<nav class="glide lx-tabs" data-glide="lx-' + id + '" role="tablist" aria-label="Sections"><span class="glide__puck" aria-hidden="true"></span>' + list.map(function (t) {
      return '<button type="button" class="glide__tab" role="tab" aria-selected="' + (t.id === active) + '" data-action="wstab" data-ws="' + id + '" data-tab="' + esc(t.id) + '">' +
        '<span class="glide__label">' + esc(t.label) + '</span>' + (t.meta != null ? '<span class="glide__meta">' + (t.state ? ui.sev(t.state) : '') + '<span>' + t.meta + '</span></span>' : '') + '</button>';
    }).join('') + '</nav>';
  }
  function pill(text, tone) { return '<span class="lx-pill' + (tone ? ' lx-pill--' + tone : '') + '">' + esc(text) + '</span>'; }
  function sevTone(s) { return { Urgent: 'danger', Warning: 'warn', Normal: 'info' }[s] || ''; }
  function loadingBody(n) { var r = ''; for (var i = 0; i < (n || 3); i++) r += '<span class="skeleton" style="height:112px;border-radius:20px"></span>'; return '<div class="lx-stack">' + r + '</div>'; }
  function errorBody(t, b) { return ui.notice('danger', t, b, { action: ui.btn('Retry', { size: 'sm', icon: 'refresh' }) }); }
  function staffWord() { return Hub.staffPlural ? Hub.staffPlural() : 'Staff'; }

  Hub.wsTabs = Hub.wsTabs || {};
  ['attention:All', 'schedule:home', 'finance:overview'].forEach(function (p) { var k = p.split(':'); if (!Hub.wsTabs[k[0]]) Hub.wsTabs[k[0]] = k[1]; });
  if (['home', 'all', 'calendar', 'venues'].indexOf(Hub.wsTabs.schedule) < 0) Hub.wsTabs.schedule = 'home';
  Hub.actions.wstab = function (el) {
    var tabsEls = Array.prototype.slice.call(el.parentNode.querySelectorAll('.glide__tab')), cur = el.parentNode.querySelector('[aria-selected="true"]');
    Hub.sectionDir = tabsEls.indexOf(el) - tabsEls.indexOf(cur);
    Hub.wsTabs[el.dataset.ws] = el.dataset.tab; Hub.animateSection = Hub.sectionDir !== 0; Hub.render();
  };
  function placeholderBody(title, body) { return '<div class="zone-inset ws-placeholder">' + ui.empty('grid', title, body) + '</div>'; }

  /* ---------------------------------------------------------------- HOME
     Pack layout: Needs Attention is the priority card; Schedule & Sessions,
     Coaches, Players & Parents and Today are the other daily areas. */
  function backdrop() {
    return '<div class="hx__backdrop" aria-hidden="true"><svg viewBox="0 0 1200 420" preserveAspectRatio="xMidYMin slice">' +
      '<path class="r1" d="M0 250 C140 205 250 190 360 212 C470 234 560 170 690 140 C800 115 880 150 960 128 C1050 104 1130 70 1200 86 L1200 420 L0 420Z"/>' +
      '<path class="r2" d="M0 300 C120 270 230 262 350 280 C480 300 590 236 720 214 C840 194 930 232 1030 206 C1110 186 1160 170 1200 176 L1200 420 L0 420Z"/>' +
      '<path class="r3" d="M0 350 C180 322 330 330 470 340 C620 350 760 300 900 292 C1030 285 1120 300 1200 290 L1200 420 L0 420Z"/>' +
      '</svg></div>';
  }
  function schedRow(o) {
    var risk = !o.staff.length || o.staff.some(function (s) { return s.unavailable; });
    return '<button type="button" class="hx-sched" data-action="' + (risk ? 'case' : 'soon') + '"' + (risk ? ' data-key="' + (o.id === 'o4' ? 'assigned_coach_unavailable|occurrence:o4|coach:charlie' : 'session_no_coach|occurrence:o5') + '"' : '') + '>' +
      '<span class="hx-sched__bar hx-tone--' + (risk ? 'warn' : 'ok') + '"></span>' +
      '<span class="hx-sched__time num">' + o.start + '<small>' + o.end + '</small></span>' +
      '<span class="hx-sched__main"><b>' + esc(o.session) + '</b><small>' + esc(venue(o)) + '</small></span>' +
      '<span class="hx-sched__count num">' + I('users', 'icon-sm') + o.players + '</span>' +
      '<span class="hx-pill hx-pill--' + (risk ? 'warn' : 'ok') + '">' + (risk ? 'At risk' : 'On track') + '</span>' + I('chevron', 'icon-sm hx-chev') + '</button>';
  }
  /* Needs Attention as a working panel: counts by severity, compact rows,
     colour held back for urgent items only. */
  function attentionPanel(state) {
    var A = D.attention, c = A.summary.counts, empty = state === 'empty';
    var head = '<div class="hx-card__head"><div><h2>Needs attention</h2><small class="hx-sub">' + (empty ? 'Nothing waiting' : A.summary.total + ' open · updated 14:05') + '</small></div><a class="hx-link" href="#mgmt-attention">View all' + I('arrowRight', 'icon-sm') + '</a></div>';
    if (empty) return '<section class="hx-card hm-attn">' + head + ui.empty('checkCircle', 'All clear', 'Nothing currently needs management action.', 'ok') + '</section>';
    var sev = '<div class="hm-sev num">' + [['Urgent', 'urgent'], ['Warning', 'warning'], ['Normal', 'normal']].map(function (x) {
      return '<a class="hm-sev__i hm-sev--' + x[1] + '" href="#mgmt-attention"><i></i><b>' + c[x[0]] + '</b>' + ui.sevWord(x[0]) + '</a>';
    }).join('') + '</div>';
    var rows = '<div class="hx-list">' + A.cases.slice(0, 5).map(function (k) {
      return '<button type="button" class="hx-attn' + (k.severity === 'Urgent' ? ' is-urgent' : '') + '" data-action="case" data-key="' + esc(k.caseKey) + '"><span class="hx-dot hx-tone--' + (k.severity === 'Urgent' ? 'danger' : k.severity === 'Warning' ? 'warn' : 'muted') + '"></span>' +
        '<span class="hx-attn__main"><b>' + esc(k.title) + '</b><small>' + esc(k.when) + ' · ' + esc(k.category) + '</small></span>' + I('chevron', 'icon-sm hx-chev') + '</button>';
    }).join('') + '</div>';
    return '<section class="hx-card hm-attn" id="hm-attn">' + head + sev + rows + '</section>';
  }

  Hub.screens['mgmt-home'] = function (ctx) {
    var first = D.me.name.split(' ')[0], empty = ctx.state === 'empty';
    var hello = '<header class="hm-hello"><div class="hm-hello__date">Thursday 1 October</div><h1 class="hm-hello__title">Good afternoon, ' + esc(first) + '.</h1>' +
      '<p class="hm-hello__lede">Here’s what’s happening across ' + esc(Hub.brand.orgFull || Hub.brand.orgName) + ' today.</p></header>';
    var shell = function (main, rail) { return '<div class="hx">' + backdrop() + '<div class="hm"><div class="hm__main">' + hello + main + '</div>' + (rail ? '<aside class="hm__rail">' + rail + '</aside>' : '') + '</div></div>'; };
    if (ctx.state === 'loading') return shell('<div class="lx-areas">' + [1, 2, 3, 4].map(function () { return '<span class="skeleton" style="height:76px;border-radius:14px"></span>'; }).join('') + '</div><div class="hm__pair"><span class="skeleton" style="height:360px;border-radius:16px"></span><span class="skeleton" style="height:360px;border-radius:16px"></span></div>');
    if (ctx.state === 'error') return shell(errorBody('Couldn’t load today’s operation', 'Nothing is shown as clear until the checks complete. Try again in a moment.'));

    var active = D.staff.filter(function (p) { return p.sessions > 0; }).length;
    var areas = '<div class="lx-areas lx-areas--stat">' +
      areaCard({ href: '#mgmt-schedule', icon: 'calendar', title: 'Schedule & Sessions', value: empty ? 0 : todayOcc().length, label: 'sessions today', desc: '' }) +
      areaCard({ href: '#mgmt-coaches', icon: 'coaches', title: staffWord(), value: active, label: 'active', desc: '' }) +
      areaCard({ href: '#mgmt-players', icon: 'players', title: 'Players & ' + Hub.brand.terms.client + 's', value: 214, label: 'active players', desc: '' }) +
      areaCard({ action: 'scroll-today', icon: 'clock', title: 'Today', value: empty ? 0 : 53, label: 'players expected', desc: '' }) + '</div>';

    var sched = '<section class="hx-card hm-sched" id="hx-today"><div class="hx-card__head"><div><h2>Today’s schedule</h2><small class="hx-sub">' + (empty ? 'No sessions' : todayOcc().length + ' sessions · 53 players expected') + '</small></div><a class="hx-link" href="#mgmt-schedule">View full day' + I('arrowRight', 'icon-sm') + '</a></div>' +
      (empty ? ui.empty('calendar', 'Nothing scheduled today', 'Tomorrow has 2 sessions.') : '<div class="hx-list">' + todayOcc().slice().sort(function (a, b) { return a.start < b.start ? -1 : 1; }).map(schedRow).join('') + '</div>') + '</section>';

    var week = [['Mon', 28], ['Tue', 29], ['Wed', 30], ['Thu', 1], ['Fri', 2], ['Sat', 3], ['Sun', 4]];
    var todayCard = '<section class="hx-card hx-card--rail"><div class="hx-card__head"><div><h2>Calendar</h2><small class="hx-sub">Thursday 1 October 2026</small></div><span class="hx-arrows"><button type="button" class="icon-btn" aria-label="Previous week" data-action="soon">' + I('chevron', 'icon-sm flip') + '</button><button type="button" class="icon-btn" aria-label="Next week" data-action="soon">' + I('chevron', 'icon-sm') + '</button></span></div>' +
      '<div class="hx-week" role="group" aria-label="Choose a day">' + week.map(function (d, i) { return '<button type="button" class="hx-week__day' + (i === 3 ? ' is-today' : '') + '"' + (i === 3 ? ' aria-pressed="true"' : ' data-action="soon"') + '><small>' + d[0] + '</small><b>' + d[1] + '</b></button>'; }).join('') + '</div>' +
      '<p class="hm-cal__sum num">' + (empty ? 'No sessions today' : todayOcc().length + ' sessions · first 15:30 · last ends 20:30') + '</p></section>';
    var activity = '<section class="hx-card hx-card--rail"><div class="hx-card__head"><h2>Recent activity</h2></div><div class="hx-activity">' +
      D.changes.map(function (ch, i) {
        var tone = ['warn', 'ok', 'blue'][i % 3], icon = ['calendar', 'shield', 'inbox'][i % 3];
        return '<div class="hx-act"><span class="hx-act__icon hx-tone--' + tone + '">' + I(icon, 'icon-sm') + '</span><span><b>' + esc(ch.text) + '</b><small>' + esc(ch.time) + '</small></span></div>';
      }).join('') + '</div></section>';

    /* Phones: urgent items stay visible above the schedule, without a banner. */
    var urgent = D.attention.cases.filter(function (k) { return k.severity === 'Urgent'; });
    var c = D.attention.summary.counts;
    var urgentSum = empty || !urgent.length ? '' : '<section class="hm-urgent" aria-label="Urgent actions"><a class="hm-urgent__head" href="#hm-attn"><span class="hm-urgent__k">' + ui.sev('Urgent') + '<b class="num">' + urgent.length + ' urgent</b><span class="num">· ' + c.Warning + ' warning · ' + c.Normal + ' to do</span></span><span class="hm-urgent__go">Review' + I('arrowRight', 'icon-sm') + '</span></a>' +
      urgent.map(function (k) { return '<button type="button" class="hm-urgent__row" data-action="case" data-key="' + esc(k.caseKey) + '"><b>' + esc(k.title) + '</b><small>' + esc(k.when) + '</small></button>'; }).join('') + '</section>';
    return shell(areas + urgentSum + '<div class="hm__pair">' + sched + attentionPanel(ctx.state) + '</div>', todayCard + activity);
  };
  Hub.actions['scroll-today'] = function () { var t = document.getElementById('hx-today'); if (t) t.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); };

  /* ------------------------------------------------------ NEEDS ATTENTION
     Pack layout: severity filters plus a category filter; each issue is a
     card with severity, what is wrong, what it affects and one action. */
  var attnCategory = 'All';
  Hub.screens['mgmt-attention'] = function (ctx) {
    var A = D.attention, c = A.summary.counts, sev = Hub.wsTabs.attention;
    if (['All', 'Urgent', 'Warning', 'Normal'].indexOf(sev) < 0) sev = Hub.wsTabs.attention = 'All';
    Hub.crumbTail = sev === 'All' ? 'All items' : sev;
    var live = ctx.state === 'live';
    var t = live ? tabs('attention', [{ id: 'All', label: 'All', meta: A.summary.total + ' open' }, { id: 'Urgent', label: 'Urgent', meta: c.Urgent, state: 'Urgent' }, { id: 'Warning', label: 'Warning', meta: c.Warning, state: 'Warning' }, { id: 'Normal', label: 'Normal', meta: c.Normal, state: 'Normal' }], sev) : '';
    var cats = ['All'].concat(A.cases.map(function (k) { return k.category; }).filter(function (v, i, a) { return a.indexOf(v) === i; }));
    var select = live ? '<label class="lx-select"><span class="visually-hidden">Category</span>' + I('filter', 'icon-sm') + '<select data-change="attn-cat">' + cats.map(function (k) { return '<option value="' + esc(k) + '"' + (k === attnCategory ? ' selected' : '') + '>' + (k === 'All' ? 'All categories' : esc(k)) + '</option>'; }).join('') + '</select>' + I('chevronDown', 'icon-sm') + '</label>' : '';
    var h = head({ back: { href: '#mgmt-home', label: 'Home' }, eyebrow: 'Needs attention', title: 'Needs attention', sub: 'A work queue of things Management needs to decide, fix, approve or support.',
      actions: ui.btn('Refresh', { variant: 'secondary', icon: 'refresh', attrs: { 'data-action': 'refresh' } }), tabs: live ? '<div class="lx-filterbar">' + t + select + '</div>' : '' });
    if (ctx.state === 'loading') return page(h, loadingBody(4));
    if (ctx.state === 'error') return page(h, errorBody('The queue couldn’t be checked', 'One of the checks didn’t complete, so this page won’t show a partial list or call it clear. Refresh to try again.'));
    if (ctx.state === 'empty') return page(h, '<div class="zone-inset">' + ui.empty('checkCircle', 'All clear', 'No staffing gaps, compliance issues, cover or summaries are waiting.', 'ok') + '</div>');
    var list = A.cases.filter(function (k) { return (sev === 'All' || k.severity === sev) && (attnCategory === 'All' || k.category === attnCategory); });
    var cards = list.length ? list.map(function (k) {
      return '<article class="lx-issue lx-issue--' + k.severity.toLowerCase() + '">' +
        '<div class="lx-issue__main">' + pill(ui.sevWord(k.severity), sevTone(k.severity)) +
        '<h3><button type="button" class="lx-issue__link" data-action="case" data-key="' + esc(k.caseKey) + '">' + esc(k.title) + '</button></h3>' +
        '<p class="lx-issue__meta">' + esc(k.detail) + '</p><p class="lx-issue__why"><span>' + esc(k.category) + '</span><span class="num when when--' + k.severity.toLowerCase() + '">' + esc(k.when) + '</span></p></div>' +
        '<div class="lx-issue__act">' + ui.btn(k.actionLabel, { variant: 'primary', trail: 'arrowRight', attrs: { 'data-action': 'case', 'data-key': k.caseKey } }) + '</div></article>';
    }).join('') : '<div class="zone-inset">' + ui.empty('checkCircle', 'Nothing in this filter', 'Try another severity or category.', 'ok') + '</div>';
    return page(h, '<div class="lx-stack">' + cards + '</div>' +
      '<p class="lx-note">Each item clears on its own once the underlying issue is fixed. Detailed options appear after opening it.</p>');
  };
  document.addEventListener('change', function (e) {
    if (e.target.matches && e.target.matches('[data-change="attn-cat"]')) { attnCategory = e.target.value; Hub.render(); }
  });

  Hub.actions.refresh = function (el) { el.classList.add('is-busy'); setTimeout(function () { el.classList.remove('is-busy'); Hub.toast('Queue is up to date'); }, 700); };

  Hub.actions['case'] = function (el) {
    var c = D.attention.cases.filter(function (x) { return x.caseKey === el.dataset.key; })[0];
    if (!c) return;
    var occ = c.related && c.related.occurrence && D.occurrences.filter(function (o) { return o.id === c.related.occurrence; })[0];
    var occHtml = '';
    if (occ) {
      occHtml = '<section class="section">' + ui.sectionHead(occ.session, { meta: (occ.date === '2026-10-01' ? 'Today' : 'Fri 2 Oct') + ', ' + occ.start + '–' + occ.end }) +
        (occ.staff.length ? ui.rows(occ.staff.map(function (s) {
          var co = D.coaches[s.coach];
          return ui.row({ lead: ui.avatar(co.name, 'md'), title: esc(co.name), sub: [s.lead ? 'Lead' : 'Assistant'], trail: s.unavailable ? ui.status('Unavailable', 'danger') : ui.status('Confirmed') });
        }), 'rows--avatar') : '<p>' + ui.status('No staff assigned yet', 'danger') + '</p>') + '</section>';
    }
    Hub.openSheet({
      overline: '<div class="sheet-kicker">' + ui.sev(c.severity) + '<span class="' + (c.severity === 'Urgent' ? 'text-danger' : '') + '">' + ui.sevWord(c.severity) + '</span><span class="text-4">/</span><span>' + esc(c.category) + '</span></div>',
      title: esc(c.title),
      body: ui.fields([['Due', due(c)], ['Details', esc(c.detail)], ['Priority', esc(c.severityReason)], ['Check', esc(c.ruleName) + ' <span class="text-3 mono">' + esc(c.ruleId) + '</span>']]) + occHtml +
        '<p class="text-3 fs-14">This item clears on its own once the underlying issue is fixed.</p>',
      foot: ui.btn('Close', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + ui.btn(c.actionLabel, { variant: 'primary', trail: 'arrowRight', attrs: { 'data-action': 'go-area', 'data-area': c.destination.area } })
    });
  };
  Hub.actions['go-area'] = function (el) { Hub.closeSheet(); Hub.toast('Would open ' + el.dataset.area); };

  /* -------------------------------------------------------------- COACHES
     Pack layout: add / cover actions, At a glance, then the directory. */
  var peopleFilter = 'all';
  function flagged(p) { return p.compliance === 'warn' || p.compliance === 'danger' || p.flag; }
  Hub.screens['mgmt-coaches'] = function (ctx) {
    var word = staffWord(), single = Hub.brand.terms.staff;
    var h = head({ back: { href: '#mgmt-home', label: 'Home' }, eyebrow: 'Management', title: word,
      sub: 'Manage the person once, then let their profile feed staffing, cover, compliance and month-end work summaries.',
      actions: ui.btn('Open cover workspace', { variant: 'secondary', attrs: { 'data-action': 'soon' } }) + ui.btn('Add ' + single.toLowerCase(), { variant: 'primary', icon: 'plus', attrs: { 'data-action': 'soon' } }) });
    if (ctx.state === 'loading') return page(h, loadingBody(3));
    if (ctx.state === 'error') return page(h, errorBody('Couldn’t load ' + word.toLowerCase(), 'Check your connection and try again.'));
    var A = D.attention.cases;
    var cover = A.filter(function (k) { return k.ruleId === 'ATT-041'; }).length;
    var summaries = A.filter(function (k) { return k.ruleId === 'ATT-045'; }).length;
    var docs = A.filter(function (k) { return k.category === 'Coaches & Compliance' && k.ruleId !== 'ATT-045'; }).length;
    var glance = section('At a glance', 'Operational items that may need action.', '<div class="lx-stats">' +
      stat({ label: 'Active ' + word.toLowerCase(), value: D.staff.filter(function (p) { return p.sessions > 0; }).length, sub: 'Across current programmes' }) +
      stat({ label: 'Open cover', value: cover, sub: 'Tom Reid, 12–16 Oct', href: '#mgmt-attention', tone: cover ? 'warn' : '' }) +
      stat({ label: 'Work summaries', value: summaries, sub: 'Ready to finalise', href: '#mgmt-attention' }) +
      stat({ label: 'Documents', value: docs, sub: 'Expiring, missing or awaiting check', href: '#mgmt-attention', tone: docs ? 'warn' : '' }) + '</div>');
    var list = D.staff.filter(function (p) { return peopleFilter === 'all' || flagged(p); });
    var tools = '<div class="lx-tools"><label class="search"><span class="visually-hidden">Search ' + word.toLowerCase() + '</span>' + I('search') + '<input class="input" placeholder="Search ' + word.toLowerCase() + '"></label>' +
      '<div class="segmented" role="group" aria-label="Filter"><button type="button" data-action="pfilter" data-val="all" aria-pressed="' + (peopleFilter === 'all') + '">All</button><button type="button" data-action="pfilter" data-val="flag" aria-pressed="' + (peopleFilter === 'flag') + '">Needs a look</button></div></div>';
    var cards = list.map(function (p) {
      var comp = p.compliance === 'ok' ? pill('Docs current', 'ok') : p.compliance === 'none' ? pill('Not required', '') : pill(p.complianceText, p.compliance === 'danger' ? 'danger' : 'warn');
      return '<button type="button" class="lx-person" data-action="person" data-id="' + p.id + '">' + ui.avatar(p.name, 'lg') +
        '<span class="lx-person__text"><b>' + esc(p.name) + '</b><small>' + esc(p.role) + ' · ' + esc(p.team) + '</small></span>' + I('chevron', 'icon-sm lx-person__go') +
        '<span class="lx-person__pills">' + comp + (p.flag ? pill(p.flag.text, p.flag.tone === 'danger' ? 'danger' : 'warn') : '') + '<span class="lx-person__n num">' + p.sessions + ' this week</span></span></button>';
    }).join('');
    return page(h, glance + section(single + ' directory', 'Open a ' + single.toLowerCase() + ' to see their management profile.', tools + '<div class="lx-people">' + cards + '</div>'));
  };
  Hub.actions.pfilter = function (el) { peopleFilter = el.dataset.val; Hub.render(); };
  Hub.actions.person = function (el) {
    var p = D.staff.filter(function (x) { return x.id === el.dataset.id; })[0];
    if (!p) return;
    var comp = [['Enhanced DBS', p.compliance === 'warn' ? ui.status('Expires 13 Oct', 'warn') : '<span class="text-3">Valid to Mar 2028</span>'], ['First aid', p.compliance === 'danger' ? ui.status('Missing', 'danger') : '<span class="text-3">Valid to Jan 2027</span>'], ['Safeguarding', '<span class="text-3">Level 2, current</span>']];
    Hub.openSheet({
      title: '<span class="identity" style="grid-template-columns:auto minmax(0,1fr)">' + ui.avatar(p.name, 'lg') + '<span style="display:grid;gap:4px"><span class="identity__name">' + esc(p.name) + '</span><span class="identity__meta"><span>' + esc(p.role) + '</span><span>' + esc(p.team) + '</span></span></span></span>',
      body: ui.fields([['Sessions this week', '<span class="num">' + p.sessions + '</span>'], ['Last active', esc(p.last)], ['Email', esc(p.email)], ['Team', esc(p.team)]], true) +
        (p.flag ? ui.notice(p.flag.tone === 'danger' ? 'danger' : 'warn', p.flag.text, null) : '') +
        '<section class="section">' + ui.sectionHead('Compliance') + ui.fields(comp) + '</section>',
      foot: ui.btn('Message', { variant: 'tertiary', icon: 'chat' }) + ui.btn('Open profile', { variant: 'primary' })
    });
  };

  /* ----------------------------------------------------- PLAYERS & PARENTS
     Pack layout: a quick operational view, then Players or Parents. */
  Hub.screens['mgmt-players'] = function (ctx) {
    var client = Hub.brand.terms.client;
    var h = head({ back: { href: '#mgmt-home', label: 'Home' }, eyebrow: 'Management', title: 'Players & ' + client + 's',
      sub: 'A quick operational view, then straight into the player or ' + client.toLowerCase() + ' you need.',
      actions: ui.btn(client + ' hub preview', { variant: 'secondary', icon: 'external', attrs: { 'data-action': 'area', 'data-area': 'client' } }) });
    if (ctx.state === 'loading') return page(h, loadingBody(2));
    if (ctx.state === 'error') return page(h, errorBody('Couldn’t load players', 'Check your connection and try again.'));
    var needs = D.approvals.filter(function (a) { return a.id === 'parent-claims' || a.id === 'session-requests'; }).reduce(function (n, a) { return n + a.count; }, 0);
    return page(h, '<div class="lx-stats">' +
      stat({ label: 'Active players', value: 214, sub: 'On current programmes' }) +
      stat({ label: client + ' accounts', value: 163, sub: 'Linked families' }) +
      stat({ label: 'Claims waiting', value: 1, sub: client + 's claiming a child', href: '#mgmt-parent-claims' }) +
      stat({ label: 'Needs action', value: needs, sub: 'Claims and session requests', href: '#mgmt-session-requests', tone: 'feature' }) + '</div>' +
      '<div class="lx-links">' +
      areaCard({ action: 'soon', icon: 'players', title: 'Players', desc: 'Search active players, include inactive when needed, and open one player profile.', cta: 'Open players' }) +
      areaCard({ action: 'soon', icon: 'family', title: client + 's', desc: 'All ' + client.toLowerCase() + ' accounts, linked children, access status and current requests.', cta: 'Open ' + client.toLowerCase() + 's' }) + '</div>');
  };

  /* ----------------------------------------------------- SCHEDULE & SESSIONS
     Pack layout: All Sessions is the main workspace; Calendar and Venues
     sit beside it. Sub-views open in place with a back link. */
  Hub.actions.sview = function (el) { Hub.wsTabs.schedule = el.dataset.view; Hub.render(); window.scrollTo(0, 0); };
  function sessRow(o) {
    var risk = !o.staff.length || o.staff.some(function (s) { return s.unavailable; });
    var pct = Math.round(o.players / o.capacity * 100);
    return '<button type="button" class="lx-sess' + (risk ? ' is-risk' : '') + '" data-action="' + (risk ? 'case' : 'soon') + '"' + (risk ? ' data-key="' + (o.id === 'o4' ? 'assigned_coach_unavailable|occurrence:o4|coach:charlie' : 'session_no_coach|occurrence:o5') + '"' : '') + '>' +
      '<span class="lx-sess__main"><b>' + esc(o.session) + '</b><small class="num">' + o.start + '–' + o.end + ' · ' + esc(venue(o)) + '</small>' + (risk ? '<small class="lx-sess__risk">' + (o.staff.length ? 'Staff unavailable' : 'No staff assigned') + '</small>' : '') + '</span>' +
      '<span class="lx-sess__fill"><b class="num">' + o.players + ' / ' + o.capacity + '</b><small class="num">' + pct + '% filled</small><i style="--pct:' + pct + '%"></i></span></button>';
  }
  Hub.screens['mgmt-schedule'] = function (ctx) {
    var view = Hub.wsTabs.schedule, back = { href: '#mgmt-schedule', label: 'Schedule & Sessions', action: 'sview', view: 'home' };
    var create = ui.btn('Create session', { variant: 'primary', icon: 'plus', attrs: { 'data-action': 'soon' } });
    var sessions = D.occurrences.map(function (o) { return o.session; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).length;
    Hub.crumbTail = { all: 'All sessions', calendar: 'Calendar', venues: 'Venues' }[view] || null;
    if (view === 'all') {
      var h = head({ back: back, eyebrow: 'All sessions', title: 'Upcoming sessions', sub: 'Everything on the calendar going forward.', actions: create });
      if (ctx.state === 'loading') return page(h, loadingBody(3));
      var days = [['2026-10-01', 'Thursday 1 October'], ['2026-10-02', 'Friday 2 October'], ['2026-10-08', 'Thursday 8 October']];
      var tools = '<div class="lx-tools"><label class="search"><span class="visually-hidden">Search sessions</span>' + I('search') + '<input class="input" placeholder="Search sessions"></label>' + ui.btn('Filter', { variant: 'secondary', icon: 'filter', attrs: { 'data-action': 'soon' } }) + '</div>' +
        '<div class="lx-legend"><span><i class="ok"></i>Staffed</span><span><i class="warn"></i>Needs staff</span></div>';
      return page(h, tools + '<div class="lx-stack">' + days.map(function (d, i) {
        var list = D.occurrences.filter(function (o) { return o.date === d[0]; }).sort(function (a, b) { return a.start < b.start ? -1 : 1; });
        return '<details class="lx-day"' + (i < 2 ? ' open' : '') + '><summary><b>' + d[1] + '</b><span class="num">' + list.length + ' session' + (list.length === 1 ? '' : 's') + '</span>' + I('chevronDown', 'icon-sm') + '</summary><div class="lx-day__list">' + list.map(sessRow).join('') + '</div></details>';
      }).join('') + '</div>');
    }
    if (view === 'venues') {
      var hv = head({ back: back, eyebrow: 'Schedule & Sessions', title: 'Venues', sub: 'Venue details, closures and the sessions that use each one.', actions: ui.btn('Add venue', { variant: 'primary', icon: 'plus', attrs: { 'data-action': 'soon' } }) });
      return page(hv, '<div class="lx-links lx-links--3">' + Object.keys(D.venues).map(function (k) {
        var v = D.venues[k], n = D.occurrences.filter(function (o) { return o.venue === k; }).length;
        return areaCard({ action: 'soon', icon: 'pin', title: v.name, desc: v.area + (v.meetingPoint ? ' · Meet at ' + v.meetingPoint.toLowerCase() : ''), value: n, label: 'Upcoming occurrences' });
      }).join('') + '</div>');
    }
    if (view === 'calendar') {
      return page(head({ back: back, eyebrow: 'Schedule & Sessions', title: 'Calendar', sub: 'The full operational schedule by grid, list or month.' }),
        placeholderBody('Calendar is not part of this visual pass', 'It keeps its place so the area reads as complete. Grid, list and month views come from the Schedule design pack.'));
    }
    var hh = head({ back: { href: '#mgmt-home', label: 'Home' }, eyebrow: 'Schedule & Sessions', title: 'Schedule & Sessions', sub: 'Manage sessions, dated occurrences and venues from one place.', actions: create });
    if (ctx.state === 'loading') return page(hh, loadingBody(2));
    var feature = '<section class="lx-feature"><div class="lx-feature__text"><h2>All sessions</h2><p>Your main workspace for everything currently running or coming up.</p>' +
      '<p class="lx-feature__facts num"><span><b>' + sessions + '</b> sessions running</span><span><b>' + D.occurrences.length + '</b> dated occurrences</span><span class="is-alert"><b>2</b> need staff</span></p></div>' +
      '<button type="button" class="lx-feature__btn" data-action="sview" data-view="all">Open all sessions' + I('arrowRight', 'icon-sm') + '</button></section>';
    var cards = '<div class="lx-links">' +
      areaCard({ action: 'sview', data: ' data-view="calendar"', icon: 'calendar', title: 'Calendar', desc: 'See the full operational schedule by grid, list or month.', cta: 'Open calendar' }) +
      areaCard({ action: 'sview', data: ' data-view="venues"', icon: 'pin', title: 'Venues', desc: 'Manage venue details, closures and affected sessions.', cta: 'Open venues' }) + '</div>';
    var today = section('Today', 'Thursday 1 October · ' + todayOcc().length + ' sessions · 53 expected', '<div class="lx-surface">' + (ctx.state === 'empty' ? ui.empty('calendar', 'Nothing scheduled today', 'Tomorrow has 2 sessions.') : todayTable(todayOcc())) + '</div>');
    return page(hh, feature + cards + today);
  };

  /* -------------------------------------------------------------- FINANCE
     Pack layout: section tabs, a month selector, headline figures, today's
     actions beside upcoming payments, work areas and the cash position. */
  Hub.actions['fin-tab'] = function (el) { Hub.wsTabs.finance = el.dataset.tab; Hub.animateSection = true; Hub.sectionDir = 1; Hub.render(); window.scrollTo(0, 0); };
  Hub.screens['mgmt-finance'] = function (ctx) {
    var F = D.finance, tab = Hub.wsTabs.finance;
    var list = [{ id: 'overview', label: 'Overview' }, { id: 'in', label: 'Money in' }, { id: 'out', label: 'Money out' }, { id: 'cash', label: 'Cash flow' }, { id: 'report', label: 'Month report' }];
    if (!list.some(function (t) { return t.id === tab; })) tab = Hub.wsTabs.finance = 'overview';
    Hub.crumbTail = list.filter(function (t) { return t.id === tab; })[0].label;
    var h = head({ back: { href: '#mgmt-more', label: 'More' }, eyebrow: 'Management · Finance', title: 'Finance', sub: 'A simple operating view of money in, money out, cash position and monthly performance.',
      actions: ui.btn('Finance settings', { variant: 'secondary', icon: 'settings', attrs: { 'data-action': 'soon' } }), tabs: tabs('finance', list, tab) });
    if (ctx.state === 'loading') return page(h, loadingBody(3));
    if (ctx.state === 'error') return page(h, errorBody('Finance couldn’t load', 'Figures aren’t shown until they can be trusted. Try again in a moment.'));
    if (tab !== 'overview') return page(h, placeholderBody(Hub.crumbTail + ' is not part of this visual pass', 'The section keeps its place so Finance reads as complete. Its layout comes from the Finance design pack.'));
    var bar = '<div class="lx-periodbar"><p>' + esc(F.period) + ' · ' + esc(F.basis) + '</p><button type="button" class="lx-select lx-select--btn" data-action="soon">' + I('calendar', 'icon-sm') + '<span>' + esc(F.period) + '</span>' + I('chevronDown', 'icon-sm') + '</button></div>';
    var kpis = '<div class="lx-stats">' + F.kpis.map(function (k, i) { return stat({ label: k[0], value: k[1], tone: i === 3 ? 'feature' : '' }); }).join('') + '</div>';
    var attn = '<section class="lx-card"><div class="lx-card__head"><div><h2>Needs attention</h2><p>Finance items from the main Management queue.</p></div><span class="lx-count num">' + F.attention.length + '</span></div><div class="lx-rows">' +
      F.attention.map(function (r) { return '<div class="lx-row">' + pill(r.tag, r.tone) + '<span class="lx-row__main"><b>' + esc(r.title) + '</b><small class="num">' + esc(r.meta) + '</small></span>' + ui.btn(r.action, { variant: 'secondary', size: 'sm', attrs: { 'data-action': 'soon' } }) + '</div>'; }).join('') + '</div></section>';
    var up = '<section class="lx-card"><div class="lx-card__head"><div><h2>Upcoming payments</h2><p>Next confirmed or expected outgoing cash.</p></div>' + ui.btn('View cash flow', { variant: 'secondary', size: 'sm', attrs: { 'data-action': 'fin-tab', 'data-tab': 'cash' } }) + '</div><div class="lx-rows">' +
      F.upcoming.map(function (r) { return '<div class="lx-row"><span class="lx-row__date num">' + esc(r.when) + '</span><span class="lx-row__main"><b>' + esc(r.title) + '</b><small>' + esc(r.meta) + '</small></span><b class="lx-row__amt num">' + esc(r.amount) + '</b></div>'; }).join('') + '</div></section>';
    var areas = '<div class="lx-areas">' +
      areaCard({ action: 'fin-tab', data: ' data-tab="in"', icon: 'download', title: 'Money in', desc: 'Clients, invoices, subscriptions and other revenue.' }) +
      areaCard({ action: 'fin-tab', data: ' data-tab="out"', icon: 'card', title: 'Money out', desc: 'Coaches, venues, suppliers and overheads.' }) +
      areaCard({ action: 'fin-tab', data: ' data-tab="cash"', icon: 'finance', title: 'Cash flow', desc: 'Cash position and dated expected movements.' }) +
      areaCard({ action: 'fin-tab', data: ' data-tab="report"', icon: 'development', title: 'Month report', desc: 'Business result and programme breakdown.' }) + '</div>';
    var cash = '<section class="lx-band" aria-label="Cash position">' + F.cash.map(function (c) { return '<div><span>' + esc(c[0]) + '</span><b class="num">' + esc(c[1]) + '</b>' + (c[2] ? '<small>' + esc(c[2]) + '</small>' : '') + '</div>'; }).join('') + '</section>';
    return page(h, bar + kpis + section('Today', 'Actions and near-term commitments together.', '<div class="lx-pair">' + attn + up + '</div>') + section('Finance work areas', '', areas) + cash);
  };

  /* ---------------------------------------------------------------- MORE
     Pack layout: areas that don't need the daily Home, in two groups;
     approvals and account follow. */
  Hub.screens['mgmt-more'] = function () {
    var me = D.me, t = Hub.brand.terms;
    function group(title, rows) { return '<section class="lx-group"><h2 class="lx-group__title">' + esc(title) + '</h2><div class="zone-inset">' + ui.rows(rows, 'rows--lead') + '</div></section>'; }
    function r(icon, title, sub, href, trail) { return ui.row({ lead: I(icon, 'row-glyph'), title: esc(title), sub: sub ? [esc(sub)] : null, href: href, trail: trail || '' }); }
    var dev = [r('development', 'Development', 'Feedback, IDPs, reviews and development framework', '#mgmt-development'),
      r('comms', 'Communications', 'Notices, messages and communication history', '#mgmt-comms', '<span class="text-4">Off</span>'),
      r('star', 'Content & Brand', 'Resources, programme content and brand controls', '#mgmt-content')];
    var biz = [r('finance', 'Finance', 'Revenue, coach costs, profitability and financial reporting', '#mgmt-finance'),
      r('grid', 'Reports', 'Operational, programme and business reporting', '#mgmt-reports'),
      r('settings', 'Settings & System', 'Permissions, integrations, system health and data housekeeping', '#mgmt-settings')];
    var appr = D.approvals.map(function (a) { return ui.row({ lead: I(a.icon, 'row-glyph'), title: esc(a.label), sub: [esc(a.sub)], trail: a.count ? '<span class="num">' + a.count + ' waiting</span>' : '', href: '#mgmt-' + a.id }); });
    var acct = [ui.row({ lead: I('swap', 'row-glyph'), title: 'Switch to ' + t.staff.toLowerCase() + ' hub', action: 'area', data: { area: 'staff' } })].concat(
      [['user', 'Profile'], ['bell', 'Notifications'], ['chat', 'Send feedback'], ['phone', 'Contact the office']].map(function (x) { return ui.row({ lead: I(x[0], 'row-glyph'), title: x[1], action: 'soon' }); }));
    acct.push(ui.row({ lead: I('logout', 'row-glyph'), title: 'Log out', action: 'soon', chevron: false }));
    var h = head({ eyebrow: 'Management', title: 'More', sub: 'Management areas that don’t need to occupy the daily Home screen.',
      actions: '<span class="lx-me">' + ui.avatar(me.name, 'md') + '<span><b>' + esc(me.name) + '</b><small>' + esc(me.email) + '</small></span></span>' });
    return page(h, '<div class="lx-columns"><div class="lx-col">' + group('Development & Communication', dev) + group('Business & System', biz) + '</div>' +
      '<div class="lx-col">' + group('Approvals', appr) + group('Account', acct) + '</div></div>');
  };
})();
