/* Staff Home (the Coach Hub for Josh Evans). Quicker and more task-led
   than Management: the next session leads, then today, then shortcuts.
   Content is placeholder; the screen proves the visual system. */
(function () {
  var ui = Hub.ui, I = Hub.icon, D = Hub.data, esc = ui.esc;
  var ME = 'david';
  function mine(o) { return o.staff.some(function (s) { return s.coach === ME; }); }
  function others(o) { return o.staff.filter(function (s) { return s.coach !== ME; }).map(function (s) { return D.coaches[s.coach].name; }); }
  function venue(o) { return D.venues[o.venue].name; }

  function nextPanel(o) {
    var w = others(o);
    return '<section class="panel next" aria-labelledby="next-title">' +
      '<div class="next__bar"><span class="overline">Next session</span><span class="next__eta num">Starts in 3 h 20 m</span></div>' +
      '<div class="next__body">' +
        '<div class="next__title-row"><h2 id="next-title" class="next__title">' + esc(o.session) + '</h2>' + ui.tag(o.ageGroup) + '</div>' +
        ui.fields([['Time', '<span class="num">Today, ' + o.start + '–' + o.end + '</span>'], ['Location', esc(venue(o))], ['Expected', '<span class="num">' + o.players + '</span>'], ['Working with', w.length ? esc(w.join(', ')) : 'Just you']], true) +
        (o.theme ? '<p class="next__note"><span class="text-3">Focus this week</span> ' + esc(o.theme) + '</p>' : '') +
      '</div>' +
      '<div class="next__actions">' + ui.btn('Open session', { variant: 'primary', trail: 'arrowRight', attrs: { 'data-action': 'soon' } }) + ui.btn('Location details', { icon: 'pin', attrs: { 'data-action': 'soon' } }) + '</div>' +
      '</section>';
  }

  Hub.screens['coach-home'] = function (ctx) {
    var today = D.occurrences.filter(function (o) { return o.date === '2026-10-01' && mine(o); });
    var later = D.occurrences.filter(function (o) { return o.date > '2026-10-01' && mine(o); });
    var head = ui.pageHead({ overline: 'Thursday 1 October · ' + D.term, title: 'Good afternoon, ' + D.me.name.split(' ')[0] });

    if (ctx.state === 'loading') return '<div class="page page--staff">' + head + '<div class="panel" style="height:240px"><div class="panel--pad" style="display:grid;gap:14px"><span class="skeleton" style="height:12px;width:30%"></span><span class="skeleton" style="height:22px;width:55%"></span><span class="skeleton" style="height:40px"></span></div></div></div>';
    if (ctx.state === 'error') return '<div class="page page--staff page--narrow">' + head + ui.notice('danger', 'Couldn’t load your schedule', 'This is usually a weak connection. Check your signal and try again.', { action: ui.btn('Retry', { size: 'sm', icon: 'refresh' }) }) + '</div>';

    var links = [['calendar', 'My schedule', 'This week and the term calendar', '#coach-schedule'], ['book', 'Library', 'Plans, guides and resources', '#coach-library'], ['pin', 'Locations', 'Access, parking and meeting points', '#coach-venues'], ['support', 'Support', 'Policies and who to contact', '#coach-support']];

    return '<div class="page page--staff">' + head +
      '<div class="layout"><div class="col">' +
        (ctx.state === 'empty' ? '<div class="panel">' + ui.empty('clock', 'Nothing scheduled today', 'Your next session is St Peter’s After School on Friday.') + '</div>' : nextPanel(today[0])) +
        '<section class="section">' + ui.sectionHead('Today', { meta: ctx.state === 'empty' ? '' : today.length + ' sessions', link: 'Schedule', href: '#coach-schedule' }) +
          (ctx.state === 'empty' ? '' : '<div class="panel">' + ui.rows(today.map(function (o, i) {
            return ui.row({ lead: '<span class="row__time">' + o.start + '<small>' + o.end + '</small></span>', title: esc(o.session), sub: [esc(venue(o)), o.players + ' expected'], trail: i === 0 ? ui.tag('Next', 'accent') : '', action: 'soon' });
          }), 'rows--time') + '</div>') + '</section>' +
      '</div><div class="col">' +
        '<section class="section">' + ui.sectionHead('Quick links') + '<div class="panel">' + ui.rows(links.map(function (l) { return ui.row({ lead: '<span class="row__icon">' + I(l[0], 'icon-sm') + '</span>', title: l[1], sub: [l[2]], href: l[3] }); }), 'rows--lead') + '</div></section>' +
        '<section class="section">' + ui.sectionHead('Later this week') + '<div class="panel">' + ui.rows(later.map(function (o) {
          return ui.row({ lead: '<span class="row__time">' + (o.date === '2026-10-02' ? 'Fri' : 'Thu') + '<small>' + o.start + '</small></span>', title: esc(o.session), sub: [esc(venue(o))], action: 'soon' });
        }), 'rows--time') + '</div></section>' +
      '</div></div></div>';
  };
})();
