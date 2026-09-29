/* Coach Home. Same content and order as the Hub's current Coach Home:
   next session, today's sessions, then the four shortcuts. The desktop
   layout adds "Later this week" from the same schedule data. */
(function () {
  var ui = Hub.ui, I = Hub.icon, D = Hub.data, esc = ui.esc;
  var ME = 'david';

  function mine(o) { return o.staff.some(function (s) { return s.coach === ME; }); }
  function others(o) { return o.staff.filter(function (s) { return s.coach !== ME; }).map(function (s) { return D.coaches[s.coach].name; }); }

  function nextCard(o) {
    var v = D.venues[o.venue];
    var withWho = others(o);
    return '<section class="card card--strong next-card" aria-labelledby="next-title">' +
      '<div class="next-card__top"><span class="next-card__label">Next session</span>' + ui.pill('Starts in 3 h 20 m', 'highlight', 'pill--plain') + '</div>' +
      '<div class="next-card__main">' +
        '<div class="next-card__tags">' + ui.pill(o.ageGroup, 'on-strong', 'pill--plain') + ui.pill('Lead coach', 'on-strong', 'pill--plain') + '</div>' +
        '<h1 id="next-title" class="display next-card__title">' + esc(o.session) + '</h1>' +
        '<ul class="next-card__meta">' +
          '<li>' + I('clock', 'icon-sm') + '<b class="num">Today, ' + o.start + ' – ' + o.end + '</b></li>' +
          '<li>' + I('pin', 'icon-sm') + '<span>' + esc(v.name) + '</span></li>' +
          '<li>' + I('players', 'icon-sm') + '<span>' + o.players + ' players' + (withWho.length ? ' · with ' + esc(withWho.join(', ')) : '') + '</span></li>' +
          (o.theme ? '<li>' + I('star', 'icon-sm') + '<span><span class="muted">This week’s theme:</span> ' + esc(o.theme) + '</span></li>' : '') +
        '</ul>' +
      '</div>' +
      '<div class="next-card__actions">' + ui.btn('Open session', { variant: 'highlight', trail: 'arrowRight', attrs: { 'data-action': 'soon' } }) + ui.btn('Venue', { variant: 'on-strong', icon: 'venue', attrs: { 'data-action': 'soon' } }) + '</div>' +
      '</section>';
  }

  function sessionRow(o, i) {
    var v = D.venues[o.venue];
    return ui.row({
      lead: '<span class="row__time">' + o.start + '<small>' + o.end + '</small></span>',
      title: esc(o.session),
      meta: [esc(v.name), o.players + ' players'],
      trail: (i === 0 ? ui.pill('Next', 'info') : '') + I('chevron', 'icon-sm'),
      action: 'soon'
    });
  }

  function shortcuts() {
    var items = [['calendar', 'My Schedule', 'This week and calendar', '#coach-schedule'], ['book', 'Library', 'Session plans and resources', '#coach-library'], ['venue', 'Venues', 'Parking, access, meeting points', '#coach-venues'], ['support', 'Coach Support', 'Policies and who to call', '#coach-support']];
    return '<section class="section"><h2 class="visually-hidden">Shortcuts</h2><div class="tiles">' + items.map(function (t) {
      return '<a class="tile" href="' + t[3] + '"><span class="tile__icon">' + I(t[0]) + '</span><span><span class="tile__title">' + t[1] + '</span><span class="tile__meta tile__meta--desk">' + t[2] + '</span></span></a>';
    }).join('') + '</div></section>';
  }

  Hub.screens['coach-home'] = function (ctx) {
    var today = D.occurrences.filter(function (o) { return o.date === '2026-10-01' && mine(o); });
    var later = D.occurrences.filter(function (o) { return o.date > '2026-10-01' && mine(o); });
    var greeting = '<div class="coach-greet"><span class="eyebrow">Thursday 1 October · ' + D.term + '</span></div>';

    if (ctx.state === 'loading') return '<div class="page page--coach">' + greeting + '<div class="card card--strong next-card" aria-busy="true" style="min-height:260px"></div><span class="skeleton" style="height:130px;border-radius:16px"></span></div>';
    if (ctx.state === 'error') return '<div class="page page--coach page--read">' + ui.alert('danger', 'Couldn’t load your Hub', 'This is usually a weak connection. Check your signal and try again.', ui.btn('Try again', { variant: 'secondary', size: 'sm', icon: 'refresh' })) + '</div>';

    var todayHtml = ctx.state === 'empty'
      ? '<div class="card">' + ui.empty('clock', 'No sessions today', 'Your next session is St Peter’s After School, Friday.') + '</div>'
      : '<div class="card card--flush">' + ui.list(today.map(sessionRow)) + '</div>';

    return '<div class="page page--coach">' + greeting +
      (ctx.state === 'warning' ? ui.alert('warn', 'Today’s cancellations and cover couldn’t be loaded', 'What you see below may not reflect a last-minute change. Pull down to refresh and try again.') : '') +
      '<div class="grid-2"><div class="stack">' +
        (ctx.state === 'empty' ? '' : nextCard(today[0])) +
        '<section class="section">' + ui.sectionHead('Today’s sessions', { count: ctx.state === 'empty' ? null : today.length, link: 'Schedule', href: '#coach-schedule' }) + todayHtml + '</section>' +
      '</div><div class="stack">' + shortcuts() +
        '<section class="section later-week">' + ui.sectionHead('Later this week') + '<div class="card card--flush">' + ui.list(later.map(function (o) {
          var v = D.venues[o.venue];
          return ui.row({ compact: true, lead: '<span class="row__time">' + (o.date === '2026-10-02' ? 'Fri' : 'Thu') + '<small>' + o.start + '</small></span>', title: esc(o.session), meta: [esc(v.name)], action: 'soon' });
        })) + '</div></section>' +
      '</div></div></div>';
  };
})();
