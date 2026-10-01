/* Staff Home (the Coach Hub for Josh Evans). The next session is the one
   raised surface on the page; today's list and the quiet rail sit on the
   ground beneath and beside it. Content is placeholder. */
(function () {
  var ui = Hub.ui, I = Hub.icon, D = Hub.data, esc = ui.esc;
  var ME = 'david';
  function mine(o) { return o.staff.some(function (s) { return s.coach === ME; }); }
  function others(o) { return o.staff.filter(function (s) { return s.coach !== ME; }).map(function (s) { return D.coaches[s.coach].name; }); }
  function venue(o) { return D.venues[o.venue].name; }

  /* Pack layout (Coach Hub): the next session is the hero, then the
     places a coach goes next. */
  function nextHero(o) {
    var w = others(o);
    return '<section class="lx-next" aria-labelledby="next-title"><div class="lx-next__k"><span>Next session</span><span class="lx-next__eta num">Starts in 3 h 20 m</span></div>' +
      '<h2 id="next-title" class="lx-next__title">' + esc(o.session) + '</h2>' +
      '<dl class="lx-next__facts"><div><dt>Time</dt><dd class="num">Today, ' + o.start + '–' + o.end + '</dd></div><div><dt>Location</dt><dd>' + esc(venue(o)) + '</dd></div><div><dt>Expected</dt><dd class="num">' + o.players + '</dd></div><div><dt>Working with</dt><dd>' + (w.length ? esc(w.join(', ')) : 'Just you') + '</dd></div></dl>' +
      (o.theme ? '<p class="lx-next__note"><span>Focus this week</span>' + esc(o.theme) + '</p>' : '') +
      '<div class="lx-next__actions"><button type="button" class="lx-next__btn" data-action="soon">Open session' + I('arrowRight', 'icon-sm') + '</button><button type="button" class="lx-next__ghost" data-action="soon">' + I('pin', 'icon-sm') + 'Location details</button></div></section>';
  }
  function card(icon, title, desc, href) {
    return '<a class="lx-area" href="' + href + '"><span class="lx-area__top"><span class="lx-area__icon">' + I(icon) + '</span>' + I('arrowRight', 'icon-sm lx-area__go') + '</span><span class="lx-area__title">' + esc(title) + '</span><span class="lx-area__desc">' + esc(desc) + '</span></a>';
  }

  Hub.screens['coach-home'] = function (ctx) {
    var today = D.occurrences.filter(function (o) { return o.date === '2026-10-01' && mine(o); });
    var first = D.me.name.split(' ')[0], hub = Hub.brand.terms.staff + ' hub';
    var hello = '<header class="lx-hello"><div class="lx-eyebrow">' + esc(hub) + ' · Thursday 1 October</div><h1 class="lx-hello__title serif">Good afternoon, ' + esc(first) + '</h1></header>';
    var players = Hub.brand.terms.client === 'Parent' ? 'Player Hub' : 'Clients';
    var cards = '<div class="lx-areas">' + card('users', players, 'Players, feedback and development relevant to your sessions.', '#coach-players') +
      card('calendar', 'My schedule', 'Your sessions, roles and availability.', '#coach-schedule') + card('book', 'Library', 'Session plans, drills and resources.', '#coach-library') + card('support', 'Support', 'Locations, contacts and help from the office.', '#coach-support') + '</div>';
    if (ctx.state === 'loading') return '<div class="page lx-page">' + hello + '<span class="skeleton" style="height:280px;border-radius:24px"></span></div>';
    if (ctx.state === 'error') return '<div class="page lx-page">' + hello + ui.notice('danger', 'Couldn’t load your schedule', 'This is usually a weak connection. Check your signal and try again.', { action: ui.btn('Retry', { size: 'sm', icon: 'refresh' }) }) + '</div>';
    if (ctx.state === 'empty') return '<div class="page lx-page">' + hello + '<div class="surface">' + ui.empty('calendar', 'Nothing on today', 'Your next session is Kingsmead After School on Friday at 16:00.') + '</div>' + cards + '</div>';
    return '<div class="page lx-page">' + hello + nextHero(today[0]) + cards + '</div>';
  };
})();
