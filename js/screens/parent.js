/* Client Home (the Parent Hub for Josh Evans). Warmer and more spacious
   than Management, same system underneath. A member switcher appears
   when an account has more than one person linked. */
(function () {
  var ui = Hub.ui, I = Hub.icon, D = Hub.data, esc = ui.esc;
  var activeId = null;

  function nextPanel(n) {
    return '<section class="panel next next--client" aria-labelledby="p-next">' +
      '<div class="next__bar"><span class="overline">Next session</span><span class="next__eta">' + esc(n.dateLabel) + '</span></div>' +
      '<div class="next__body">' +
        '<h2 id="p-next" class="next__title">' + esc(n.session) + '</h2>' +
        ui.fields([['Date', esc(n.date)], ['Time', '<span class="num">' + esc(n.time) + '</span>'], ['Location', esc(n.venue) + '<span class="field-note">' + esc(n.venueArea) + '</span>'], ['With', esc(n.coach)]], true) +
        '<p class="next__note"><span class="text-3">Meeting point</span> ' + esc(n.meetingPoint) + '</p>' +
      '</div>' +
      '<div class="next__actions">' + ui.btn('View details', { variant: 'primary', trail: 'arrowRight', attrs: { 'data-action': 'soon' } }) + ui.btn('Location & parking', { variant: 'tertiary', icon: 'pin', attrs: { 'data-action': 'soon' } }) + '</div>' +
      '</section>';
  }

  function feedback(member) {
    var f = member.feedback;
    if (!f) return '<section class="section">' + ui.sectionHead('Latest feedback') + '<div class="panel">' + ui.empty('star', 'No feedback published yet', 'When feedback for ' + esc(member.name.split(' ')[0]) + ' is published, it will appear here.') + '</div></section>';
    return '<section class="section">' + ui.sectionHead('Latest feedback', { link: 'All feedback', href: '#parent-development' }) +
      '<article class="panel feedback">' +
        '<div class="panel__head"><div class="feedback__by">' + ui.avatar(f.coach, 'md') + '<div><b>' + esc(f.coach) + '</b><small>Published ' + esc(f.date) + '</small></div></div></div>' +
        '<div class="feedback__cols"><div><span class="overline">Keep doing</span><p>' + esc(f.keepDoing) + '</p></div><div><span class="overline">Focus next</span><p>' + esc(f.focus) + '</p></div></div>' +
        '<div class="panel__foot"><span></span><a class="section-link" href="#parent-development">Read in full' + I('chevron', 'icon-sm') + '</a></div>' +
      '</article></section>';
  }

  Hub.screens['parent-home'] = function (ctx) {
    var P = D.parent, members = P.children;
    var member = members.filter(function (c) { return c.id === activeId; })[0] || members[0];
    var first = P.name.split(' ')[0];

    if (ctx.state === 'loading') return '<div class="page page--client"><div class="page-head"><div class="page-head__text"><span class="skeleton" style="height:10px;width:120px"></span><span class="skeleton" style="height:28px;width:280px"></span></div></div><div class="panel" style="height:260px"></div></div>';
    if (ctx.state === 'error') return '<div class="page page--client">' + ui.notice('danger', 'We couldn’t load your account', 'Please check your connection and try again. If it keeps happening, contact us.', { action: ui.btn('Retry', { size: 'sm', icon: 'refresh' }) }) + '</div>';
    if (ctx.state === 'empty') {
      return '<div class="page page--client">' + ui.pageHead({ overline: esc(Hub.brand.orgName), title: 'Welcome, ' + first, sub: 'Link your account to see sessions, updates and feedback in one place.' }) +
        '<div class="panel">' + ui.empty('family', 'Nothing linked yet', 'We’ll match the details you give us to the right record. Some links are checked by our team first.') + '<div style="display:flex;justify-content:center;padding-bottom:32px">' + ui.btn('Add a family member', { variant: 'primary', icon: 'plus' }) + '</div></div></div>';
    }

    var switcher = members.length > 1 ? '<div class="segmented member-switch" role="group" aria-label="Choose family member">' + members.map(function (c) {
      return '<button type="button" data-action="member" data-id="' + c.id + '" aria-pressed="' + (c.id === member.id) + '">' + ui.avatar(c.name, 'xs') + esc(c.name.split(' ')[0]) + '</button>';
    }).join('') + '</div>' : '';

    var updates = P.updates.map(function (u) { return ui.notice('neutral', u.title, esc(u.body), { meta: u.meta, icon: 'megaphone' }); }).join('');

    return '<div class="page page--client">' +
      '<header class="page-head"><div class="page-head__text"><div class="overline">Thursday 1 October</div><h1 class="page-title client-title">Welcome back, ' + esc(first) + '</h1></div>' + switcher + '</header>' +
      '<div class="layout"><div class="col">' + updates + nextPanel(member.next) + feedback(member) + '</div>' +
      '<div class="col">' +
        '<section class="section">' + ui.sectionHead('Your family', { link: 'Manage', href: '#parent-more' }) + '<div class="panel">' + ui.rows(members.map(function (c) {
          return ui.row({ lead: ui.avatar(c.name, 'md'), title: esc(c.name), sub: [esc(c.sessions.join(', '))], trail: ui.status('Active', 'ok'), action: 'member', data: { id: c.id }, chevron: false });
        }), 'rows--lead') + '</div></section>' +
        '<section class="section">' + ui.sectionHead('Payments') + ui.notice('neutral', 'Coming soon', 'Payments and bookings will be managed here. For now, the office handles them as usual.', { icon: 'card' }) + '</section>' +
      '</div></div></div>';
  };

  Hub.actions.member = function (el) { activeId = el.dataset.id; Hub.render(); };
})();
