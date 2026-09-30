/* Client Home (the Parent Hub for Josh Evans). The calmest area: a warm
   greeting, one feature surface, one reading surface, and a quiet rail.
   A member switcher appears when an account has more than one person. */
(function () {
  var ui = Hub.ui, I = Hub.icon, D = Hub.data, esc = ui.esc;
  var activeId = null;

  /* Pack layout (Parent / Player Hub): family schedule, the next session as
     the hero, current actions, four feature tiles, the combined schedule
     and recent feedback. */
  function nextHero(member) {
    var n = member.next;
    return '<section class="lx-next lx-next--client" aria-labelledby="p-next"><div class="lx-next__k"><span>Next session</span><span class="lx-next__pills"><span>Upcoming</span><span>' + esc(member.name.split(' ')[0]) + '</span></span></div>' +
      '<h2 id="p-next" class="lx-next__title">' + esc(n.session) + '</h2>' +
      '<dl class="lx-next__facts"><div><dt>When</dt><dd>' + esc(n.date) + '<small class="num">' + esc(n.time) + '</small></dd></div><div><dt>Where</dt><dd>' + esc(n.venue) + '<small>' + esc(n.venueArea) + '</small></dd></div><div><dt>With</dt><dd>' + esc(n.coach) + '</dd></div><div><dt>Meeting point</dt><dd>' + esc(n.meetingPoint) + '</dd></div></dl>' +
      '<div class="lx-next__actions"><button type="button" class="lx-next__btn" data-action="soon">View details' + I('arrowRight', 'icon-sm') + '</button><button type="button" class="lx-next__ghost" data-action="soon">' + I('pin', 'icon-sm') + 'Location & parking</button></div></section>';
  }
  function tile(tone, icon, title, desc, href) {
    return '<a class="lx-tile lx-tile--' + tone + '" href="' + href + '"><span class="lx-tile__icon">' + I(icon) + '</span><b>' + esc(title) + '</b><small>' + esc(desc) + '</small></a>';
  }
  function feedback(member) {
    var f = member.feedback;
    var headHtml = '<div class="lx-section__head"><div><h2>Recent feedback</h2></div>' + (f ? '<a class="hx-link" href="#parent-development">View development' + I('arrowRight', 'icon-sm') + '</a>' : '') + '</div>';
    if (!f) return '<section class="lx-section">' + headHtml + '<div class="lx-surface">' + ui.empty('star', 'No feedback published yet', 'When feedback for ' + esc(member.name.split(' ')[0]) + ' is published, it will appear here.') + '</div></section>';
    return '<section class="lx-section">' + headHtml + '<article class="lx-surface lx-feedback">' +
      '<div class="reading__by">' + ui.avatar(f.coach, 'md') + '<div><b>' + esc(f.coach) + '</b><small>Published ' + esc(f.date) + '</small></div></div>' +
      '<div class="reading__cols"><div><span class="overline">Keep doing</span><p>' + esc(f.keepDoing) + '</p></div><div><span class="overline">Focus next</span><p>' + esc(f.focus) + '</p></div></div>' +
      '</article></section>';
  }

  Hub.screens['parent-home'] = function (ctx) {
    var P = D.parent, members = P.children, client = Hub.brand.terms.client;
    var member = members.filter(function (c) { return c.id === activeId; })[0] || members[0];
    var first = P.name.split(' ')[0];
    var hub = client === 'Parent' ? 'Parent / Player hub' : client + ' hub';
    var hello = function (t) { return '<header class="lx-hello"><div class="lx-eyebrow">' + esc(hub) + ' · Thursday 1 October</div><h1 class="lx-hello__title page-title client-title">' + esc(t) + '</h1></header>'; };

    if (ctx.state === 'loading') return '<div class="page lx-page">' + hello('Welcome back, ' + first) + '<span class="skeleton" style="height:300px;border-radius:24px"></span></div>';
    if (ctx.state === 'error') return '<div class="page lx-page">' + ui.notice('danger', 'We couldn’t load your account', 'Please check your connection and try again. If it keeps happening, contact us.', { action: ui.btn('Retry', { size: 'sm', icon: 'refresh' }) }) + '</div>';
    if (ctx.state === 'empty') {
      return '<div class="page lx-page">' + hello('Welcome, ' + first) +
        '<div class="lx-surface">' + ui.empty('family', 'Nothing linked yet', 'We’ll match the details you give us to the right record. Some links are checked by our team first.') + '<div style="display:flex;justify-content:center;padding-bottom:40px">' + ui.btn('Add a family member', { variant: 'primary', size: 'lg', icon: 'plus' }) + '</div></div></div>';
    }

    var switcher = members.length > 1 ? '<div class="segmented member-switch" role="group" aria-label="Choose family member">' + members.map(function (c) {
      return '<button type="button" data-action="member" data-id="' + c.id + '" aria-pressed="' + (c.id === member.id) + '">' + ui.avatar(c.name, 'xs') + esc(c.name.split(' ')[0]) + '</button>';
    }).join('') + '</div>' : '';
    var family = '<section class="lx-family"><div><b>Family schedule</b><small>' + esc(members.map(function (c) { return c.name.split(' ')[0]; }).join(' + ')) + ' · all upcoming sessions together</small></div>' + switcher + '</section>';
    var actions = '<section class="lx-section"><div class="lx-section__head"><div><h2>Current actions</h2></div></div><div class="lx-stack">' + P.updates.map(function (u) {
      return '<button type="button" class="lx-action" data-action="soon"><span class="lx-action__dot"></span><span class="lx-action__main"><b>' + esc(u.title) + '</b><small>' + esc(u.meta) + '</small></span><span class="lx-action__go">View' + I('arrowRight', 'icon-sm') + '</span></button>';
    }).join('') + '</div></section>';
    var tiles = '<div class="lx-tiles">' + tile('shell', 'card', 'Billing & Payments', 'Invoices, payments and family credit', '#parent-more') + tile('accent', 'star', 'Memberships', 'Programmes, camps, offers and waitlists', '#parent-sessions') +
      tile('light', 'user', 'Child profile', 'Details, medical, support and permissions', '#parent-more') + tile('soft', 'plus', 'Browse sessions', 'Find coaching, academy and camps', '#parent-sessions') + '</div>';
    var byId = {}; members.forEach(function (c) { byId[c.id] = c.name.split(' ')[0]; });
    var schedule = '<section class="lx-section"><div class="lx-section__head"><div><h2>Your schedule</h2></div><a class="hx-link" href="#parent-sessions">View all' + I('arrowRight', 'icon-sm') + '</a></div><div class="lx-surface lx-dated">' +
      P.schedule.map(function (x) {
        return '<a class="lx-dated__row" href="#parent-sessions"><span class="lx-date num"><small>' + x.dow + '</small><b>' + x.day + '</b><small>' + x.mon + '</small></span><span class="lx-dated__main"><small class="lx-dated__who">' + esc(byId[x.child]) + '</small><b>' + esc(x.session) + '</b><small class="num">' + x.time + ' · ' + esc(x.venue) + '</small></span>' + I('chevron', 'icon-sm') + '</a>';
      }).join('') + '</div></section>';

    return '<div class="page lx-page"><div class="lx-client">' +
      '<div class="lx-client__hello">' + hello('Welcome back, ' + first) + '</div>' +
      '<div class="lx-client__family">' + family + '</div>' +
      '<div class="lx-client__next">' + nextHero(member) + '</div>' +
      '<div class="lx-client__actions">' + actions + '</div>' +
      '<div class="lx-client__tiles">' + tiles + '</div>' +
      '<div class="lx-client__schedule">' + schedule + '</div>' +
      '<div class="lx-client__feedback">' + feedback(member) + '</div>' +
      '</div></div>';
  };

  Hub.actions.member = function (el) { activeId = el.dataset.id; Hub.render(); };
})();
