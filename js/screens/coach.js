/* Staff Home (the Coach Hub for Josh Evans). The next session is the one
   raised surface on the page; today's list and the quiet rail sit on the
   ground beneath and beside it. Content is placeholder. */
(function () {
  var ui = Hub.ui, I = Hub.icon, D = Hub.data, esc = ui.esc;
  var ME = 'david';
  function mine(o) { return o.staff.some(function (s) { return s.coach === ME; }); }
  function others(o) { return o.staff.filter(function (s) { return s.coach !== ME; }).map(function (s) { return D.coaches[s.coach].name; }); }
  function venue(o) { return D.venues[o.venue].name; }

  function nextSurface(o) {
    var w = others(o);
    return '<section class="surface surface--pad feature" aria-labelledby="next-title">' +
      '<div class="feature__kicker"><span class="overline">Next session</span><span class="feature__eta num">Starts in 3 h 20 m</span></div>' +
      '<h2 id="next-title" class="feature__title">' + esc(o.session) + '</h2>' +
      ui.fields([['Time', '<span class="num">Today, ' + o.start + '–' + o.end + '</span>'], ['Location', esc(venue(o))], ['Expected', '<span class="num">' + o.players + '</span>'], ['Working with', w.length ? esc(w.join(', ')) : 'Just you']], true) +
      (o.theme ? '<p class="feature__note"><span>Focus this week</span>' + esc(o.theme) + '</p>' : '') +
      '<div class="feature__actions">' + ui.btn('Open session', { variant: 'primary', size: 'lg', trail: 'arrowRight', attrs: { 'data-action': 'soon' } }) + ui.btn('Location details', { variant: 'tertiary', size: 'lg', icon: 'pin', attrs: { 'data-action': 'soon' } }) + '</div>' +
      '</section>';
  }

  Hub.screens['coach-home'] = function (ctx) {
    var today = D.occurrences.filter(function (o) { return o.date === '2026-10-01' && mine(o); });
    var later = D.occurrences.filter(function (o) { return o.date > '2026-10-01' && mine(o); });
    var first = D.me.name.split(' ')[0], T = ui.tok;
    var head = '<header class="page-head"><div class="page-head__text"><h1 class="page-title">Good afternoon, ' + esc(first) + '</h1><p class="page-meta">Thursday 1 October \u00b7 ' + esc(D.term) + '</p></div></header>';
    var brief = ui.brief({ kicker: 'Your brief \u00b7 14:10', title: 'Good afternoon, ' + first,
      lines: ['You\u2019re coaching ' + T('2 sessions', '', '#coach-schedule') + ' today, both at ' + T('City of London Freemen\u2019s', '', '#coach-venues') + '. First is ' + T('U9/10 Development at 17:30', 'accent') + ' with Charlie Hughes. ' +
        'For ' + T('U12 Academy at 19:00', 'warn') + ', Charlie is marked unavailable, so expect a change to your staffing.'] });
    var day = ui.dayline({ label: 'Your day', meta: 'Thursday 1 October', start: 14, end: 21, now: '14:10', ground: true,
      items: D.occurrences.filter(function (o) { return o.date === '2026-10-01' && mine(o); }).map(function (o, i) { return { title: o.session, start: o.start, end: o.end, state: i === 0 ? 'mine' : '', action: 'soon' }; }) });

    if (ctx.state === 'loading') return '<div class="page">' + head + '<div class="surface surface--pad" style="display:grid;gap:18px"><span class="skeleton" style="height:12px;width:120px"></span><span class="skeleton" style="height:26px;width:55%"></span><span class="skeleton" style="height:44px"></span></div></div>';
    if (ctx.state === 'error') return '<div class="page page--narrow">' + head + ui.notice('danger', 'Couldn’t load your schedule', 'This is usually a weak connection. Check your signal and try again.', { action: ui.btn('Retry', { size: 'sm', icon: 'refresh' }) }) + '</div>';

    var links = [['calendar', 'My schedule', '#coach-schedule'], ['book', 'Library', '#coach-library'], ['pin', 'Locations', '#coach-venues'], ['support', 'Support', '#coach-support']];

    if (ctx.state === 'empty') return '<div class="page"><div class="home">' + ui.brief({ kicker: 'Your brief \u00b7 14:10', title: 'Good afternoon, ' + first, lines: ['Nothing on today. Your next session is ' + T('St Peter\u2019s After School', '', '#coach-schedule') + ' on Friday at 16:00.'] }) + '</div></div>';

    return '<div class="page"><div class="home">' + brief + day +
      '<div class="home-grid"><div class="col">' + nextSurface(today[0]) +
      '</div><aside class="col rail">' +
        '<section class="section section--quiet">' + ui.sectionHead('Shortcuts') + ui.rows(links.map(function (l) { return ui.row({ lead: I(l[0], 'row-glyph'), title: l[1], href: l[2], cls: 'row--quiet' }); }), 'rows--quiet rows--bare') + '</section>' +
'</aside></div></div></div>';
  };
})();
