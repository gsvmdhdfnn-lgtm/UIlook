/* Client Home (the Parent Hub for Josh Evans). The calmest area: a warm
   greeting, one feature surface, one reading surface, and a quiet rail.
   A member switcher appears when an account has more than one person. */
(function () {
  var ui = Hub.ui, I = Hub.icon, D = Hub.data, esc = ui.esc;
  var activeId = null;

  function nextSurface(n) {
    return '<section class="surface surface--pad feature feature--client" aria-labelledby="p-next">' +
      '<div class="feature__kicker"><span class="overline">Next session</span><span class="feature__eta">' + esc(n.dateLabel) + '</span></div>' +
      '<h2 id="p-next" class="feature__title">' + esc(n.session) + '</h2>' +
      ui.fields([['When', esc(n.date) + '<span class="field-note num">' + esc(n.time) + '</span>'], ['Where', esc(n.venue) + '<span class="field-note">' + esc(n.venueArea) + '</span>'], ['With', esc(n.coach)], ['Meeting point', esc(n.meetingPoint)]], true) +
      '<div class="feature__actions">' + ui.btn('View details', { variant: 'primary', size: 'lg', trail: 'arrowRight', attrs: { 'data-action': 'soon' } }) + ui.btn('Location & parking', { variant: 'tertiary', size: 'lg', icon: 'pin', attrs: { 'data-action': 'soon' } }) + '</div>' +
      '</section>';
  }

  function feedback(member) {
    var f = member.feedback;
    if (!f) return '<section class="section">' + ui.sectionHead('Latest feedback') + '<div class="surface">' + ui.empty('star', 'No feedback published yet', 'When feedback for ' + esc(member.name.split(' ')[0]) + ' is published, it will appear here.') + '</div></section>';
    return '<section class="section">' + ui.sectionHead('Latest feedback', { link: 'All feedback', href: '#parent-development' }) +
      '<article class="surface surface--pad reading">' +
        '<div class="reading__by">' + ui.avatar(f.coach, 'md') + '<div><b>' + esc(f.coach) + '</b><small>Published ' + esc(f.date) + '</small></div></div>' +
        '<div class="reading__cols"><div><span class="overline">Keep doing</span><p>' + esc(f.keepDoing) + '</p></div><div><span class="overline">Focus next</span><p>' + esc(f.focus) + '</p></div></div>' +
        '<a class="btn btn--link" href="#parent-development"><span>Read in full</span>' + I('arrowRight', 'icon-sm') + '</a>' +
      '</article></section>';
  }

  Hub.screens['parent-home'] = function (ctx) {
    var P = D.parent, members = P.children;
    var member = members.filter(function (c) { return c.id === activeId; })[0] || members[0];
    var first = P.name.split(' ')[0];

    if (ctx.state === 'loading') return '<div class="page page--client"><div class="page-head"><div class="page-head__text"><span class="skeleton" style="height:34px;width:300px"></span><span class="skeleton" style="height:14px;width:140px"></span></div></div><div class="surface" style="height:300px"></div></div>';
    if (ctx.state === 'error') return '<div class="page page--client">' + ui.notice('danger', 'We couldn’t load your account', 'Please check your connection and try again. If it keeps happening, contact us.', { action: ui.btn('Retry', { size: 'sm', icon: 'refresh' }) }) + '</div>';
    if (ctx.state === 'empty') {
      return '<div class="page page--client"><header class="page-head"><div class="page-head__text"><h1 class="page-title client-title">Welcome, ' + esc(first) + '</h1><p class="page-meta">Link your account to see sessions, updates and feedback in one place.</p></div></header>' +
        '<div class="surface">' + ui.empty('family', 'Nothing linked yet', 'We’ll match the details you give us to the right record. Some links are checked by our team first.') + '<div style="display:flex;justify-content:center;padding-bottom:48px">' + ui.btn('Add a family member', { variant: 'primary', size: 'lg', icon: 'plus' }) + '</div></div></div>';
    }

    var switcher = members.length > 1 ? '<div class="segmented member-switch" role="group" aria-label="Choose family member">' + members.map(function (c) {
      return '<button type="button" data-action="member" data-id="' + c.id + '" aria-pressed="' + (c.id === member.id) + '">' + ui.avatar(c.name, 'xs') + esc(c.name.split(' ')[0]) + '</button>';
    }).join('') + '</div>' : '';

    /* Client brief: the family's week in two sentences, then the week
       line (the Day Line at week scale). */
    var T = ui.tok, n = member.next, fn = member.name.split(' ')[0];
    var brief = ui.brief({ kicker: 'This week \u00b7 updated 11:20', title: 'Welcome back, ' + first,
      lines: [esc(fn) + '\u2019s next session is ' + T('today at ' + n.time.split(' ')[0], 'accent') + ' at ' + T(n.venue) + ', with ' + esc(n.coach) + '. ' +
        (member.feedback ? 'New feedback from ' + esc(member.feedback.coach.split(' ')[0]) + ' is ' + T('ready to read', '', '#parent-development') + '.' : 'No new feedback yet.')],
      since: 'last Thursday', changes: P.updates.map(function (u) { return { text: u.title, time: 'Today, 11:20' }; }) });
    var week = [['Mon', 28], ['Tue', 29], ['Wed', 30], ['Thu', 1], ['Fri', 2], ['Sat', 3], ['Sun', 4]].map(function (d, i) { return { dow: d[0], date: d[1], past: i < 3, today: i === 3, session: i === 3 }; });

    return '<div class="page page--client"><div class="home">' +
      brief +
      '<section class="section">' + ui.chapter(fn + '\u2019s week', { meta: '28 Sep \u2013 4 Oct', right: switcher }) + ui.weekline(week) + '</section>' +
      '<div class="home-grid"><div class="col">' + nextSurface(member.next) + feedback(member) + '</div>' +
      '<aside class="col rail">' +
        '<section class="section section--quiet">' + ui.sectionHead('Your family', { link: 'Manage', href: '#parent-more' }) + ui.rows(members.map(function (c) {
          return ui.row({ lead: ui.avatar(c.name, 'md'), title: esc(c.name), sub: [esc(c.sessions.join(', '))], action: 'member', data: { id: c.id }, chevron: false, cls: 'row--quiet' });
        }), 'rows--quiet rows--avatar') + '</section>' +
'</aside></div></div></div>';
  };

  Hub.actions.member = function (el) { activeId = el.dataset.id; Hub.render(); };
})();
