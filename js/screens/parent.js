/* Parent Home. Same content and order as the Hub's current Parent Home
   (greeting with child, next session, updates when there are any, recent
   published feedback). A child switcher appears only when a family has
   more than one linked child. */
(function () {
  var ui = Hub.ui, I = Hub.icon, D = Hub.data, esc = ui.esc;
  var activeId = null;

  function nextSession(n) {
    return '<section class="card card--strong next-card next-card--parent" aria-labelledby="p-next">' +
      '<div class="next-card__top"><span class="next-card__label">Next session</span>' + ui.pill(n.dateLabel, 'highlight', 'pill--plain') + '</div>' +
      '<div class="next-card__main">' +
        '<h2 id="p-next" class="display next-card__title">' + esc(n.session) + '</h2>' +
        '<ul class="next-card__meta">' +
          '<li>' + I('calendar', 'icon-sm') + '<span>' + esc(n.date) + '</span></li>' +
          '<li>' + I('clock', 'icon-sm') + '<b class="num">' + esc(n.time) + '</b></li>' +
          '<li>' + I('pin', 'icon-sm') + '<span>' + esc(n.venue) + ' <span class="muted">· meet at the ' + esc(n.meetingPoint.toLowerCase()) + '</span></span></li>' +
          '<li>' + I('whistle', 'icon-sm') + '<span>Coach: ' + esc(n.coach) + '</span></li>' +
        '</ul>' +
      '</div>' +
      '<div class="next-card__actions">' + ui.btn('View session', { variant: 'highlight', trail: 'arrowRight', attrs: { 'data-action': 'soon' } }) + '</div>' +
      '</section>';
  }

  function feedback(child) {
    var f = child.feedback;
    if (!f) return '<section class="section">' + ui.sectionHead('Recent feedback') + '<div class="card">' + ui.empty('star', 'No published feedback yet', 'When ' + esc(child.name.split(' ')[0]) + '’s coach publishes feedback, it will appear here.') + '</div></section>';
    return '<section class="section">' + ui.sectionHead('Recent feedback', { link: 'Development', href: '#parent-development' }) +
      '<article class="card card--pad feedback-card">' +
        '<header class="feedback-card__head">' + ui.avatar(f.coach, 'sm') + '<div><b>' + esc(f.coach) + '</b><small>Published ' + esc(f.date) + '</small></div></header>' +
        '<div class="feedback-card__blocks">' +
          '<div class="fb-block"><span class="fb-block__label">Keep doing</span><p>' + esc(f.keepDoing) + '</p></div>' +
          '<div class="fb-block fb-block--focus"><span class="fb-block__label">My focus</span><p>' + esc(f.focus) + '</p></div>' +
        '</div>' +
        ui.btn('Read full feedback', { variant: 'secondary', block: true, attrs: { 'data-action': 'soon' } }) +
      '</article></section>';
  }

  function family(children) {
    return '<section class="section">' + ui.sectionHead('Your family', { link: 'Manage', href: '#parent-more' }) +
      '<div class="card card--flush">' + ui.list(children.map(function (c) {
        return ui.row({ lead: ui.avatar(c.name), title: esc(c.name), meta: [esc(c.sessions.join(', '))], trail: ui.pill('Linked', 'ok'), data: { child: c.id }, action: 'child' });
      })) + '</div></section>' +
      '<section class="section">' + ui.sectionHead('Payments & bookings') +
      '<div class="card card--pad card--quiet"><p class="fs-sm text-2">Paying for sessions and managing bookings will live here. For now, payments are handled by the office as usual.</p></div></section>';
  }

  Hub.screens['parent-home'] = function (ctx) {
    var P = D.parent, kids = P.children;
    var child = kids.filter(function (c) { return c.id === activeId; })[0] || kids[0];
    var first = P.name.split(' ')[0];

    if (ctx.state === 'loading') return '<div class="page page--parent"><div class="parent-hero"><span class="skeleton" style="height:14px;width:30%"></span><span class="skeleton" style="height:34px;width:60%;margin-top:10px"></span></div><div class="card card--strong next-card" style="min-height:240px" aria-busy="true"></div></div>';
    if (ctx.state === 'error') return '<div class="page page--parent page--read">' + ui.alert('danger', 'We couldn’t load your Hub', 'Please check your connection and try again. If it keeps happening, contact the office.', ui.btn('Try again', { variant: 'secondary', size: 'sm', icon: 'refresh' })) + '</div>';
    if (ctx.state === 'empty') {
      return '<div class="page page--parent page--read"><header class="parent-hero"><span class="eyebrow">' + esc(Hub.brand.hubName) + '</span><h1 class="display parent-hero__title">Welcome, ' + esc(first) + '</h1><p class="page-sub">Add your child to see their sessions, coach and feedback in one place.</p></header>' +
        '<div class="card card--pad add-child">' + ui.empty('family', 'No children linked yet', 'We’ll match your child to their existing record. It usually takes a moment; some links are checked by the office first.') + ui.btn('Add your child', { block: true, icon: 'plus', attrs: { 'data-action': 'soon' } }) + '</div></div>';
    }

    var switcher = kids.length > 1 ? '<div class="child-switch" role="group" aria-label="Choose child">' + kids.map(function (c) {
      return '<button type="button" data-action="child" data-child="' + c.id + '" aria-pressed="' + (c.id === child.id) + '">' + ui.avatar(c.name, 'sm') + '<span>' + esc(c.name.split(' ')[0]) + '</span></button>';
    }).join('') + '</div>' : '';

    var updates = P.updates.map(function (u) { return ui.alert('info', u.title, esc(u.body) + '<div class="alert__meta">' + esc(u.meta) + '</div>'); }).join('');

    return '<div class="page page--parent">' +
      '<header class="parent-hero"><span class="eyebrow">Thursday 1 October</span><h1 class="display parent-hero__title">Welcome back, ' + esc(first) + '</h1>' + switcher + '</header>' +
      '<div class="grid-2"><div class="stack">' + updates + nextSession(child.next) + feedback(child) + '</div>' +
      '<div class="stack">' + family(kids) + '</div></div>' +
      '</div>';
  };

  Hub.actions.child = function (el) { activeId = el.dataset.child; Hub.render(); };
})();
