/* public screens (pass 12): the public site, sign-in and sign-up, and the
   management approvals behind them (coach sign-ups, trial coaches,
   parent claims and Trial Interest leads). All data comes from Hub.db. */
(function () {
  var K = Hub.kit, db = Hub.db, ui = Hub.ui, I = Hub.icon, esc = ui.esc, A = Hub.actions;
  function S() { return document.getElementById('sheet'); }
  function brandName() { return Hub.brand.orgFull || Hub.brand.orgName; }

  /* ---------- Routes ---------- */
  K.route('pub-home', { title: 'Home', nav: 'pub-home' });
  K.route('pub-offers', { title: 'What we offer', nav: 'pub-offers' });
  K.route('pub-offer', { title: 'What we offer', nav: 'pub-offers' });
  K.route('pub-signin', { title: 'Sign in', nav: 'pub-signin' });
  K.route('pub-register', { title: 'Create an account', nav: 'pub-signin' });
  K.route('pub-check-email', { title: 'Check your email', nav: 'pub-signin' });
  K.route('pub-waiting', { title: 'Waiting for approval', nav: 'pub-signin' });
  K.route('pub-parent-signup', { title: 'Find your child', nav: 'pub-signin' });
  K.route('mgmt-approvals', { title: 'Approvals', parent: 'more' });
  K.route('mgmt-coach-signups', { title: 'Coach sign-ups', parent: 'more' });
  K.route('mgmt-trial-coaches', { title: 'Trial coaches', parent: 'more' });
  K.route('mgmt-parent-claims', { title: 'Parent claims', parent: 'more' });
  K.route('mgmt-trial-leads', { title: 'Trial interest', parent: 'more' });

  /* ---------- Shared public pieces ---------- */
  function priceText(r) {
    if (r.price == null) return '<b>' + esc(r.period) + '</b>';
    if (r.price === 0) return '<b>Free</b><small>' + esc(r.period) + '</small>';
    return '<b class="num">' + K.money(r.price) + '</b><small>' + esc(r.period) + '</small>';
  }
  function offerRows(rows) {
    return '<div class="pub-rows" role="list">' + rows.map(function (r) {
      return '<div class="pub-row" role="listitem"><div class="pub-row__who"><b>' + esc(r.name || r.who) + '</b>' + (r.name ? '<small>' + esc(r.who) + '</small>' : '') + '</div>' +
        '<div class="pub-row__meta"><span>' + I('clock', 'icon-sm') + esc(r.when) + '</span><span>' + I('pin', 'icon-sm') + esc(r.venue) + '</span></div>' +
        '<div class="pub-row__price">' + priceText(r) + '</div></div>';
    }).join('') + '</div>';
  }
  function offerCard(o) {
    var from = db.getOfferFrom(o.id);
    var fromTxt = !from ? 'Booked through your school' : from.price === 0 ? 'Free first session' : 'From ' + K.money(from.price) + ' ' + from.period;
    return '<a class="pub-offer" href="#pub-offer/' + o.id + '"><span class="pub-offer__icon">' + I(o.icon) + '</span>' +
      '<span class="pub-offer__kicker">' + esc(o.kicker) + '</span><span class="pub-offer__title">' + esc(o.title) + '</span>' +
      '<span class="pub-offer__sum">' + esc(o.summary) + '</span><span class="pub-offer__from"><span class="num">' + esc(fromTxt) + '</span>' + I('arrowRight', 'icon-sm') + '</span></a>';
  }
  function interestForm(key, offerId) {
    var sent = db.getInterestSent(key);
    if (sent) {
      return '<div class="pub-form pub-form--sent" id="pub-interest">' + ui.notice('ok', 'Thanks, ' + sent.parent.split(' ')[0] + '. We have your details.', 'We will contact you within two working days about ' + esc(sent.child) + ' (' + esc(sent.ageGroup) + ') and the next free session.', { meta: 'Reference ' + sent.id }) +
        '<p class="k-note">' + K.stamp('Sent', sent.parent, sent.at) + '</p>' + K.actBtn('Register another child', 'pub-interest-again', { key: key }, { variant: 'secondary', size: 'sm' }) + '</div>';
    }
    var offers = db.getPublicOffers().map(function (o) { return [o.id, o.title]; });
    var ages = [['', 'Choose an age group']].concat(db.getAgeGroups().map(function (a) { return [a, a]; }));
    return '<div class="pub-form" id="pub-interest"><div class="pub-form__head"><h2>Register interest</h2><p>Tell us about your child and we will invite you to a free session.</p></div>' +
      K.form([
        K.field('Your name', K.input('lead-parent', '', { placeholder: 'First and last name' })),
        K.field('Email', K.input('lead-email', '', { type: 'email', placeholder: 'you@example.com' })),
        K.field('Phone', K.input('lead-phone', '', { type: 'tel', placeholder: 'Optional' })),
        K.field('Child’s name', K.input('lead-child', '')),
        K.field('Age group', K.select('lead-age', ages, '')),
        K.field('Interested in', K.select('lead-offer', offers, offerId || 'trials')),
        K.field('Anything we should know?', K.textarea('lead-msg', '', 'Experience, friends in a group, questions'), null, true)
      ], 2) +
      '<div class="pub-form__foot">' + K.actBtn('Register interest', 'pub-interest', { key: key }, { variant: 'primary', icon: 'check' }) + '<span class="k-note">We only use these details to contact you about coaching.</span></div></div>';
  }
  A['pub-interest'] = function (el) {
    var v = { parent: K.val('lead-parent').trim(), email: K.val('lead-email').trim(), phone: K.val('lead-phone').trim(), child: K.val('lead-child').trim(), ageGroup: K.val('lead-age'), offer: K.val('lead-offer'), message: K.val('lead-msg').trim() };
    if (!v.parent || !v.email || !v.ageGroup) { Hub.toast('Add your name, email and an age group'); return; }
    if (!v.child) v.child = 'Child of ' + v.parent;
    v.at = K.now();
    Hub.mutate(function () { return db.addLead(v, el.dataset.key); }, 'Thanks, we will be in touch soon', { area: 'Public site', summary: 'Trial Interest from ' + v.parent + ' for ' + v.child + ' (' + v.ageGroup + ')', who: v.parent, at: v.at });
  };
  A['pub-interest-again'] = function (el) { db.clearInterestSent(el.dataset.key); Hub.render(); };
  A['pub-scroll'] = function (el) { var t = document.getElementById(el.dataset.target); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  function foot() {
    return '<footer class="pub-foot"><span>' + Hub.orgMark() + '<b>' + esc(brandName()) + '</b></span><span class="pub-foot__links">' + K.link('pub-offers', 'What we offer') + K.link('pub-signin', 'Sign in') + K.link('pub-register', 'Create an account') + '</span><small>Coaching is delivered by DBS-checked, qualified coaches.</small></footer>';
  }
  function off() { return K.feature('publicSite') ? '' : K.featureOff('publicSite'); }

  /* ---------- pub-home ---------- */
  Hub.screens['pub-home'] = function (ctx) {
    var site = db.getPublicSite();
    var hero = '<header class="pub-hero"><div class="pub-hero__text"><span class="pub-hero__brand">' + Hub.orgMark() + '<span>' + esc(brandName()) + '</span></span>' +
      '<h1 class="pub-hero__title">' + esc(site.tagline) + '</h1><p class="pub-hero__sub">' + esc(site.intro) + '</p>' +
      '<div class="pub-hero__actions">' + K.actBtn('Register interest', 'pub-scroll', { target: 'pub-interest' }, { variant: 'primary', icon: 'whistle' }) + K.goBtn('Create an account', 'pub-register', { variant: 'secondary' }) + K.goBtn('Sign in', 'pub-signin', { variant: 'tertiary', cls: 'pub-hero__ghost' }) + '</div></div>' +
      '<dl class="pub-facts">' + site.facts.map(function (f) { return '<div><dt>' + esc(f[0]) + '</dt><dd class="num">' + esc(f[1]) + '</dd></div>'; }).join('') + '</dl></header>';
    var g = K.guard(ctx, hero, { empty: ['grid', 'Nothing published yet', 'Offers appear here once they are published.'] }); if (g) return g;
    var offers = db.getPublicOffers();
    var body = off() +
      K.section('Choose how to start', 'Trials, weekly coaching, tours, holiday events and school clubs.', '<div class="pub-offers">' + offers.map(offerCard).join('') + '</div>', K.link('pub-offers', 'See everything we offer')) +
      K.section('What we offer', 'Weekly groups in term time. Every group starts with a free session.', '<div class="pub-panel">' + offerRows(db.getOfferRows('academy')) + '</div>') +
      K.section('Holiday camps and events', 'Open to members and non-members.', '<div class="pub-panel">' + offerRows(db.getOfferRows('events')) + '</div>') +
      '<div class="pub-split"><div class="pub-why"><h2>Why families choose us</h2><ul>' +
      ['Small groups with a ratio of 1 coach to 8 players', 'Written feedback for every player each half term', 'Pause or cancel with a month’s notice', 'Free first session in every group'].map(function (t) { return '<li>' + I('checkCircle', 'icon-sm') + esc(t) + '</li>'; }).join('') +
      '</ul><div class="pub-why__cta">' + K.goBtn('Sign in', 'pub-signin', { variant: 'secondary', size: 'sm' }) + K.goBtn('Register', 'pub-register', { variant: 'primary', size: 'sm' }) + '</div></div>' + interestForm('home', 'trials') + '</div>' + foot();
    return K.page(hero, body, 'pub');
  };

  /* ---------- pub-offers ---------- */
  Hub.screens['pub-offers'] = function (ctx) {
    var head = K.head({ eyebrow: brandName(), title: 'What we offer', sub: 'Every programme, who it is for, when and where it runs, and what it costs.' });
    var g = K.guard(ctx, head, { empty: ['grid', 'No offers published', 'Published offers appear here.'] }); if (g) return g;
    var body = off() + db.getPublicOffers().map(function (o) {
      return '<section class="pub-block"><div class="pub-block__head"><span class="pub-offer__icon">' + I(o.icon) + '</span><div><span class="pub-offer__kicker">' + esc(o.kicker) + '</span><h2>' + esc(o.title) + '</h2><p>' + esc(o.summary) + '</p></div>' +
        '<div class="pub-block__act">' + K.goBtn('Details and interest', 'pub-offer/' + o.id, { variant: 'secondary', size: 'sm', trail: 'arrowRight' }) + '</div></div>' + offerRows(db.getOfferRows(o.id)) + '</section>';
    }).join('') + foot();
    return K.page(head, body, 'pub');
  };

  /* ---------- pub-offer/<id> ---------- */
  Hub.screens['pub-offer'] = function (ctx) {
    var o = db.getPublicOffer(ctx.param);
    if (!o) return K.page(K.head({ back: ['pub-offers', 'What we offer'], title: 'Offer not found' }), '<div class="zone-inset">' + ui.empty('grid', 'This offer is not available', 'It may have ended. See everything we offer instead.') + '</div>', 'pub');
    Hub.title = o.title;
    var head = K.head({ back: ['pub-offers', 'What we offer'], eyebrow: o.kicker, title: o.title, sub: esc(o.summary), actions: K.actBtn('Register interest', 'pub-scroll', { target: 'pub-interest' }, { variant: 'primary' }) });
    var g = K.guard(ctx, head, { empty: ['grid', 'Nothing scheduled yet', 'Dates and prices appear here once published.'] }); if (g) return g;
    var others = db.getPublicOffers().filter(function (x) { return x.id !== o.id; });
    var body = off() + '<div class="pub-split pub-split--detail"><div class="lx-stack">' +
      K.card({ title: 'About ' + o.title.toLowerCase(), body: '<p class="pub-copy">' + esc(o.body) + '</p>' }) +
      K.card({ title: 'What we offer', sub: 'Age, day and time, venue and price', body: offerRows(db.getOfferRows(o.id)) }) +
      '<div class="pub-chips"><span class="k-note">Also on offer</span>' + others.map(function (x) { return '<a class="pub-chip" href="#pub-offer/' + x.id + '">' + I(x.icon, 'icon-sm') + esc(x.title) + '</a>'; }).join('') + '</div>' +
      '</div>' + interestForm('offer-' + o.id, o.id) + '</div>' + foot();
    return K.page(head, body, 'pub');
  };

  /* ---------- Sign in ---------- */
  function authPage(ctx, inner, wide) {
    var head = '<div class="pub-auth__brand">' + Hub.orgMark() + '<b>' + esc(brandName()) + '</b></div>';
    var g = K.guard(ctx, head, { empty: false }); if (g) return g;
    return K.page(head, '<div class="pub-auth' + (wide ? ' pub-auth--wide' : '') + '">' + inner + '</div>', 'pub pub--auth');
  }
  Hub.screens['pub-signin'] = function (ctx) {
    var demos = db.getDemoAccounts();
    var inner = '<div class="pub-auth__card"><h1>Sign in</h1><p class="pub-auth__sub">Parents, coaches and management all sign in here. We take you to the right hub.</p>' +
      K.form([K.field('Email', K.input('si-email', '', { type: 'email', placeholder: 'you@example.com' })), K.field('Password', K.input('si-pass', '', { type: 'password', placeholder: '••••••••' }))], 1) +
      '<div class="pub-auth__row">' + K.actBtn('Forgotten your password?', 'pub-forgot', {}, { variant: 'tertiary', size: 'sm' }) + '</div>' +
      K.actBtn('Sign in', 'pub-signin', {}, { variant: 'primary', block: true }) +
      '<p class="pub-auth__alt">New here? ' + K.link('pub-register', 'Create an account') + '</p></div>' +
      '<div class="pub-auth__demo"><span class="k-note">Prototype: sign in as</span><div class="pub-auth__demos">' + demos.map(function (d) { return K.actBtn(d.role, 'pub-demo-signin', { email: d.email }, { variant: 'secondary', size: 'sm' }); }).join('') + '</div></div>';
    return authPage(ctx, inner);
  };
  function signIn(email) {
    var r = db.signIn(email);
    if (!r) { Hub.toast('No account uses that email. Create an account instead.'); return; }
    if (r.pending) { db.setPubAccount({ email: email, name: r.name }); location.hash = 'pub-waiting'; return; }
    K.log({ area: 'Sign in', summary: r.name + ' signed in', who: r.name });
    Hub.toast('Signed in as ' + r.name);
    location.hash = r.route;
  }
  A['pub-signin'] = function () { var e = K.val('si-email').trim(); if (!e) { Hub.toast('Enter your email to sign in'); return; } signIn(e); };
  A['pub-demo-signin'] = function (el) { signIn(el.dataset.email); };
  A['pub-forgot'] = function () {
    var e = K.val('si-email').trim();
    db.setPubAccount({ email: e, mode: 'reset' });
    K.log({ area: 'Sign in', summary: 'Password reset link sent' + (e ? ' to ' + e : ''), who: e || 'Visitor' });
    location.hash = 'pub-check-email';
  };

  /* ---------- Create an account ---------- */
  var ROLES = [
    { id: 'Parent', icon: 'family', text: 'Book sessions, see your child’s development and manage payments.', note: 'Ready straight away' },
    { id: 'Coach', icon: 'whistle', text: 'See your sessions, take registers and give feedback.', note: 'Needs approval' },
    { id: 'Management', icon: 'shield', text: 'Run the organisation: schedule, people and finance.', note: 'Needs approval' }
  ];
  Hub.screens['pub-register'] = function (ctx) {
    var a = db.getPubAccount(), role = a.role || 'Parent', staff = role !== 'Parent';
    var inner = '<div class="pub-auth__card"><h1>Create an account</h1><p class="pub-auth__sub">Choose who you are. You can add children after you confirm your email.</p>' +
      '<div class="pub-roles" role="radiogroup" aria-label="Account type">' + ROLES.map(function (r) {
        return '<button type="button" class="pub-role" role="radio" aria-checked="' + (r.id === role) + '" data-action="pub-role" data-role="' + r.id + '"><span class="pub-role__icon">' + I(r.icon) + '</span><b>' + esc(r.id) + '</b><small>' + esc(r.text) + '</small>' + K.pill(r.note, r.note === 'Needs approval' ? 'warn' : 'ok') + '</button>';
      }).join('') + '</div>' +
      (staff ? ui.notice('warn', role + ' accounts need approval', 'After you confirm your email, management checks your details before you can sign in. ' + (role === 'Coach' ? 'You may start on a trial period.' : 'Management access is only for office staff.')) : '') +
      K.form([
        K.field('Full name', K.input('rg-name', a.name, { placeholder: 'First and last name' })),
        K.field('Email', K.input('rg-email', a.email, { type: 'email', placeholder: 'you@example.com' })),
        K.field('Password', K.input('rg-pass', '', { type: 'password', placeholder: 'At least 10 characters' })),
        staff ? K.field('Phone', K.input('rg-phone', a.phone || '', { type: 'tel' })) : '',
        role === 'Coach' ? K.field('Coaching qualification', K.input('rg-qual', a.qualification || '', { placeholder: 'For example FA Introduction to Coaching' }), null, true) : '',
        staff ? K.field('Tell us about your experience', K.textarea('rg-exp', a.experience || ''), null, true) : ''
      ].filter(Boolean), 1) +
      K.actBtn('Create account', 'pub-register', {}, { variant: 'primary', block: true }) +
      '<p class="pub-auth__alt">Already have an account? ' + K.link('pub-signin', 'Sign in') + '</p></div>';
    return authPage(ctx, inner);
  };
  function keepRegister() { db.setPubAccount({ name: K.val('rg-name'), email: K.val('rg-email'), phone: K.val('rg-phone'), qualification: K.val('rg-qual'), experience: K.val('rg-exp') }); }
  A['pub-role'] = function (el) { keepRegister(); db.setPubAccount({ role: el.dataset.role }); Hub.render(); };
  A['pub-register'] = function () {
    keepRegister();
    var a = db.getPubAccount();
    if (!a.name.trim() || !a.email.trim()) { Hub.toast('Add your name and email'); return; }
    a.mode = 'confirm'; a.at = K.now();
    if (a.role !== 'Parent') {
      db.addCoachSignup({ name: a.name.trim(), email: a.email.trim(), phone: a.phone || '', role: a.role, at: a.at, qualification: a.qualification || 'Not given', dbs: 'To be checked', experience: a.experience || 'Not given', heard: 'Public site' });
    }
    K.log({ area: 'Sign-up', summary: a.role + ' account created for ' + a.name, who: a.name, at: a.at });
    Hub.toast('Account created. Check your email.');
    location.hash = 'pub-check-email';
  };

  /* ---------- Check your email ---------- */
  Hub.screens['pub-check-email'] = function (ctx) {
    var a = db.getPubAccount(), reset = a.mode === 'reset', staff = a.role !== 'Parent';
    var next = reset ? K.goBtn('Back to sign in', 'pub-signin', { variant: 'primary', block: true })
      : K.goBtn('I’ve confirmed my email', staff ? 'pub-waiting' : 'pub-parent-signup', { variant: 'primary', block: true });
    var inner = '<div class="pub-auth__card pub-auth__card--center"><span class="pub-bigicon">' + I('inbox') + '</span><h1>Check your email</h1>' +
      '<p class="pub-auth__sub">We sent ' + (reset ? 'a password reset link' : 'a confirmation link') + ' to <b>' + esc(a.email || 'your email address') + '</b>. The link works for 24 hours.</p>' +
      (reset ? '' : K.steps(['Account', 'Confirm email', staff ? 'Approval' : 'Your child', 'Ready'], 1)) + next +
      '<div class="pub-auth__row pub-auth__row--center">' + K.actBtn('Resend email', 'pub-resend', {}, { variant: 'tertiary', size: 'sm' }) + K.goBtn('Use a different email', reset ? 'pub-signin' : 'pub-register', { variant: 'tertiary', size: 'sm' }) + '</div>' +
      '<p class="k-note">Can’t see it? Check your junk folder, or ask the office to resend it.</p></div>';
    return authPage(ctx, inner);
  };
  A['pub-resend'] = function () { var a = db.getPubAccount(); Hub.mutate(null, 'Email sent again', { area: 'Sign-up', summary: 'Confirmation email resent to ' + (a.email || 'visitor'), who: a.name || 'Visitor' }); };

  /* ---------- Waiting for approval ---------- */
  Hub.screens['pub-waiting'] = function (ctx) {
    var a = db.getPubAccount(), su = db.findSignupByEmail(a.email) || db.getPendingCoachSignups()[0] || db.getCoachSignups()[0];
    var done = su.status !== 'Pending';
    var inner = '<div class="pub-auth__card pub-auth__card--center"><span class="pub-bigicon">' + I(done ? (su.status === 'Approved' ? 'checkCircle' : 'alertCircle') : 'clock') + '</span>' +
      '<h1>' + (done ? (su.status === 'Approved' ? 'You’re approved' : 'Your sign-up was declined') : 'Waiting for approval') + '</h1>' +
      '<p class="pub-auth__sub">' + (done ? (su.status === 'Approved' ? esc(su.outcome) + '. You can now sign in.' : esc(su.declineReason)) : 'Thanks, ' + esc(su.name.split(' ')[0]) + '. Management checks every ' + esc(su.role.toLowerCase()) + ' sign-up before you can sign in. We will email you when it is done, usually within two working days.') + '</p>' +
      K.steps(['Account', 'Confirm email', 'Approval', 'Ready'], done && su.status === 'Approved' ? 4 : 2) +
      ui.fields([['Name', esc(su.name)], ['Email', esc(su.email)], ['Account type', esc(su.role)], ['Status', K.status(su.status)]], true) +
      '<p>' + K.stamp('Signed up', su.name, su.at) + (done ? ' ' + K.stamp(su.status, su.decidedBy, su.decidedAt) : '') + '</p>' +
      (done && su.status === 'Approved' ? K.goBtn('Sign in', 'pub-signin', { variant: 'primary', block: true }) : K.goBtn('Back to the home page', 'pub-home', { variant: 'secondary', block: true })) +
      '<div class="pub-auth__demo"><span class="k-note">Prototype: see the other side</span>' + K.goBtn('Open Coach sign-ups in Management', 'mgmt-coach-signups', { variant: 'tertiary', size: 'sm', trail: 'arrowRight' }) + '</div></div>';
    return authPage(ctx, inner);
  };

  /* ---------- Parent sign-up: find your child ---------- */
  var OUT = { Matched: ['ok', 'checkCircle', 'We found your child'], Created: ['info', 'plus', 'We added your child'], 'Needs review': ['warn', 'clock', 'We need to check a few details'] };
  function checksList(checks) {
    return '<ul class="pub-checks">' + checks.map(function (c) { return '<li class="' + (c.ok ? 'is-ok' : 'is-no') + '">' + I(c.ok ? 'check' : 'x', 'icon-sm') + '<span><b>' + esc(c.label) + '</b><small>' + esc(c.detail) + '</small></span><span class="pub-checks__v">' + (c.ok ? 'Matched' : 'Did not match') + '</span></li>'; }).join('') + '</ul>';
  }
  Hub.screens['pub-parent-signup'] = function (ctx) {
    var a = db.getPubAccount(), s = db.getPubSignup(), r = s.result;
    var head = K.head({ back: ['pub-check-email', 'Back'], eyebrow: 'Parent sign-up', title: 'Find your child', sub: 'Tell us your child’s name and date of birth. If they already play with us, we link you; if not, we add them.' });
    var g = K.guard(ctx, head, { empty: false }); if (g) return g;
    var main;
    if (r) {
      var o = OUT[r.outcome];
      main = '<div class="pub-result pub-result--' + o[0] + '">' + '<div class="pub-result__head"><span class="pub-bigicon pub-bigicon--' + o[0] + '">' + I(o[1]) + '</span><div>' + K.status(r.outcome) + '<h2>' + esc(o[2]) + '</h2><p>' + esc(r.why) + '</p></div></div>' +
        checksList(r.checks) +
        (r.outcome === 'Matched' ? ui.notice('ok', 'Linked to ' + db.getPlayer(r.player).name, 'You can now see sessions, development and payments for this child in the Parent hub.') : '') +
        (r.outcome === 'Created' ? ui.notice('info', s.first + ' ' + s.last + ' has been added', 'New player ' + esc(r.player) + ' in a new family ' + esc(r.family) + '. Next, confirm medical details and book a free session.') : '') +
        (r.outcome === 'Needs review' ? ui.notice('warn', 'Sent to the office to check', 'Nothing about this child is shown to you until a person confirms the link. We email you when it is done. Reference ' + esc(r.claim) + '.') : '') +
        '<p>' + K.stamp('Submitted', r.who, r.at) + '</p>' +
        '<div class="k-bar">' + (r.outcome === 'Needs review' ? K.goBtn('Back to the home page', 'pub-home', { variant: 'primary' }) + K.goBtn('Prototype: open Parent claims', 'mgmt-parent-claims', { variant: 'tertiary', trail: 'arrowRight' })
          : K.goBtn('Go to the Parent hub', 'parent-home', { variant: 'primary' })) + K.actBtn('Add another child', 'pub-signup-reset', {}, { variant: 'secondary' }) + '</div></div>';
    } else {
      main = '<div class="pub-form">' + K.steps(['Account', 'Confirm email', 'Your child', 'Ready'], 2) +
        '<div class="pub-examples"><span class="k-note">Prototype: try an example</span>' + db.getSignupExamples().map(function (x) { return K.actBtn(x.label, 'pub-example', { id: x.id }, { variant: 'secondary', size: 'sm' }); }).join('') + '</div>' +
        K.form([
          K.field('Child’s first name', K.input('ps-first', s.first)),
          K.field('Child’s last name', K.input('ps-last', s.last)),
          K.field('Date of birth', K.input('ps-dob', s.dob, { type: 'date' })),
          K.field('Your email', K.input('ps-email', s.email || a.email, { type: 'email' }), 'The email you signed up with. It must match the one the family gave us.')
        ], 2) +
        '<div class="pub-form__foot">' + K.actBtn('Find my child', 'pub-match', {}, { variant: 'primary', icon: 'search' }) + '</div></div>';
    }
    var how = K.card({ title: 'How we match', body: '<ul class="pub-how">' +
      '<li>' + K.status('Matched') + '<span>Child’s name, date of birth <b>and</b> your email all match a player. You are linked straight away.</span></li>' +
      '<li>' + K.status('Created') + '<span>Nothing matches. We create a new player and link them to you.</span></li>' +
      '<li>' + K.status('Needs review') + '<span>Only some details match. A person checks first. We never link on a name alone, because two children can share a name.</span></li></ul>' });
    return K.page(head, '<div class="pub-split pub-split--detail">' + main + how + '</div>', 'pub');
  };
  function readSignup() { return db.setPubSignup({ first: K.val('ps-first').trim(), last: K.val('ps-last').trim(), dob: K.val('ps-dob'), email: K.val('ps-email').trim() }); }
  A['pub-example'] = function (el) { var x = db.getSignupExamples().filter(function (e) { return e.id === el.dataset.id; })[0]; db.setPubSignup({ first: x.first, last: x.last, dob: x.dob, email: x.email }); Hub.render(); Hub.toast(x.note); };
  A['pub-match'] = function () {
    var q = readSignup();
    if (!q.first || !q.last || !q.dob || !q.email) { Hub.toast('Add the name, date of birth and your email'); return; }
    var a = db.getPubAccount(), who = a.name || 'New parent', at = K.now();
    var res = db.matchChild(q); res.who = who; res.at = at;
    Hub.mutate(function () { db.applySignup(q, res, who, at); q.result = res; }, { Matched: 'Linked to your child', Created: 'Child added', 'Needs review': 'Sent for review' }[res.outcome],
      { area: 'Sign-up', summary: 'Parent sign-up for ' + q.first + ' ' + q.last + ': ' + res.outcome, entity: res.player || '', who: who, at: at });
  };
  A['pub-signup-reset'] = function () { db.setPubSignup({ first: '', last: '', dob: '', result: null }); Hub.render(); };

  /* =====================================================================
     Management approvals
     ===================================================================== */
  function mhead(o) { o.eyebrow = o.eyebrow || 'Approvals'; if (!o.back) o.back = ['mgmt-approvals', 'Approvals']; return K.head(o); }
  function reasonSheet(title, intro, action, id, label) {
    Hub.openSheet({ overline: '<span class="overline">Decline</span>', title: esc(title), body: '<p class="k-note">' + esc(intro) + '</p>' + K.form([K.field('Reason', K.textarea('reason', '', 'Required. Kept with the decision.'))], 1),
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + ui.btn(label || 'Decline', { variant: 'primary', attrs: { 'data-action': action, 'data-id': id } }) });
  }
  function sheetReason() { return K.val('reason', S()).trim(); }
  function decided(x) { return x.decidedAt ? K.stamp(x.status === 'Declined' || x.status === 'Ended' ? (x.status) : 'Approved', x.decidedBy, x.decidedAt) : ''; }

  /* ---------- mgmt-approvals ---------- */
  Hub.screens['mgmt-approvals'] = function (ctx) {
    var c = db.getApprovalCounts();
    var head = K.head({ back: ['mgmt-more', 'More'], eyebrow: 'More', title: 'Approvals', sub: 'Everything waiting for a management decision: new staff, trial coaches, parent claims and trial interest.' });
    var g = K.guard(ctx, head, { empty: ['userCheck', 'Nothing waiting', 'New sign-ups, claims and trial interest appear here.'] }); if (g) return g;
    var shared = db.getApprovals().filter(function (a) { return a.id === 'session-requests' || a.id === 'player-migration'; });
    var tiles = [
      { route: 'mgmt-coach-signups', icon: 'userCheck', title: 'Coach sign-ups', value: c.coachSignups, label: 'waiting', desc: 'Approve or decline new coach and management accounts' },
      { route: 'mgmt-trial-coaches', icon: 'whistle', title: 'Trial coaches', value: c.trialCoaches, label: 'on trial', desc: 'Approve to full coach, extend or end a trial period' },
      { route: 'mgmt-parent-claims', icon: 'link', title: 'Parent claims', value: c.parentClaims, label: 'need review', desc: 'Check partial matches before linking a parent to a player' },
      { route: 'mgmt-trial-leads', icon: 'inbox', title: 'Trial interest', value: c.trialLeads, label: 'new', desc: 'Follow up interest from the public site' }
    ].concat(shared.map(function (a) { return { route: 'mgmt-' + a.id, icon: a.icon, title: a.label, value: a.count, label: 'waiting', desc: a.sub }; }));
    var soon = db.getTrialCoachesEndingSoon();
    var body = K.stats([
      { label: 'Coach sign-ups', value: c.coachSignups, sub: 'waiting', route: 'mgmt-coach-signups', tone: c.coachSignups ? 'warn' : '' },
      { label: 'Parent claims', value: c.parentClaims, sub: 'need review', route: 'mgmt-parent-claims', tone: c.parentClaims ? 'warn' : '' },
      { label: 'Trial coaches', value: c.trialCoaches, sub: soon.length + ' ending within 7 days', route: 'mgmt-trial-coaches' },
      { label: 'New trial interest', value: c.trialLeads, sub: 'not yet contacted', route: 'mgmt-trial-leads' }
    ]) + K.tiles(tiles, 3) +
      K.section('Recent decisions', 'Who decided what, and when.', '<div class="lx-card">' + K.timeline(db.getApprovalLog().slice(0, 8)) + '</div>');
    return K.page(head, body);
  };

  /* ---------- mgmt-coach-signups ---------- */
  Hub.screens['mgmt-coach-signups'] = function (ctx) {
    var pending = db.getPendingCoachSignups(), done = db.getCoachSignups().filter(function (s) { return s.status !== 'Pending'; });
    var tabs = [{ id: 'pending', label: 'Waiting', meta: pending.length }, { id: 'done', label: 'Decided', meta: done.length }];
    var head = mhead({ title: 'Coach sign-ups', sub: 'New coach and management accounts wait here until someone in management approves them.', tabs: K.tabs('csu', tabs) });
    var g = K.guard(ctx, head, { empty: ['userCheck', 'No sign-ups waiting', 'New coach and management sign-ups appear here.'] }); if (g) return g;
    var body;
    if (K.tab('csu', tabs) === 'pending') {
      body = pending.length ? '<div class="lx-stack">' + pending.map(function (s) {
        var mg = s.role === 'Management';
        return K.card({ title: s.name, sub: K.stamp('Signed up', s.name, s.at), right: K.pill(s.role, mg ? 'warn' : 'info'),
          body: K.kv([['Email', esc(s.email)], ['Phone', esc(s.phone || '—')], ['Qualification', esc(s.qualification)], ['DBS', esc(s.dbs)], ['Experience', esc(s.experience)], ['Heard about us', esc(s.heard)]], true) +
            (mg ? ui.notice('warn', 'Management access', 'This person would see every family, player and, with finance access, money. Only approve office staff.') : '') +
            '<div class="k-bar pub-actions">' + (mg ? K.actBtn('Give Management access', 'csu-approve', { id: s.id, mode: 'coach' }, { variant: 'primary', size: 'sm', icon: 'check' })
              : K.actBtn('Start trial period', 'csu-trial', { id: s.id }, { variant: 'primary', size: 'sm', icon: 'whistle' }) + K.actBtn('Approve as coach', 'csu-approve', { id: s.id, mode: 'coach' }, { variant: 'secondary', size: 'sm', icon: 'check' })) +
            K.actBtn('Decline', 'csu-decline', { id: s.id }, { variant: 'tertiary', size: 'sm', icon: 'x' }) + '</div>' });
      }).join('') + '</div>' : '<div class="zone-inset">' + ui.empty('userCheck', 'No sign-ups waiting', 'New coach and management sign-ups from the public site appear here.') + '</div>';
    } else {
      body = K.table({ cols: 'minmax(0,1.3fr) 110px minmax(0,1fr) minmax(0,1.4fr)', head: ['Person', 'Account', 'Decision', 'Who and when'], empty: 'No decisions yet.',
        rows: done.map(function (s) { return { cells: [K.cell(esc(s.name), esc(s.email)), esc(s.role), K.cell(K.status(s.status), esc(s.outcome || s.declineReason || '')), decided(s)] }; }) });
    }
    return K.page(head, body);
  };
  A['csu-approve'] = function (el) {
    var s = db.getCoachSignup(el.dataset.id);
    K.confirm({ overline: '<span class="overline">Approve</span>', title: s.role === 'Management' ? 'Give ' + s.name + ' Management access?' : 'Approve ' + s.name + ' as a coach?', body: '<p class="k-note">' + (s.role === 'Management' ? 'They can sign in to the Management hub straight away.' : 'They can sign in to the Coach hub and be allocated to sessions. Compliance documents are still checked in Coaches.') + '</p>', label: 'Approve', action: 'csu-approve-do', data: { 'data-id': s.id, 'data-mode': el.dataset.mode } });
  };
  A['csu-approve-do'] = function (el) {
    var s = db.getCoachSignup(el.dataset.id), at = K.now(); Hub.closeSheet(true);
    Hub.mutate(function () { db.approveCoachSignup(s.id, 'coach', 0, K.me(), at); }, s.name + ' approved', { area: 'Approvals', summary: 'Approved ' + s.role.toLowerCase() + ' sign-up: ' + s.name, entity: s.id, at: at });
  };
  A['csu-trial'] = function (el) {
    var s = db.getCoachSignup(el.dataset.id);
    Hub.openSheet({ overline: '<span class="overline">Trial period</span>', title: 'Start a trial period for ' + esc(s.name), body: '<p class="k-note">They join as a trial coach, shadow a lead coach and appear in Trial coaches until you approve, extend or end the trial.</p>' + K.form([K.field('Length', K.select('weeks', [['4', '4 weeks'], ['6', '6 weeks'], ['8', '8 weeks']], '4'))], 1),
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + ui.btn('Start trial', { variant: 'primary', attrs: { 'data-action': 'csu-trial-do', 'data-id': s.id } }) });
  };
  A['csu-trial-do'] = function (el) {
    var s = db.getCoachSignup(el.dataset.id), w = +K.val('weeks', S()) || 4, at = K.now(); Hub.closeSheet(true);
    Hub.mutate(function () { db.approveCoachSignup(s.id, 'trial', w, K.me(), at); }, s.name + ' started a ' + w + '-week trial', { area: 'Approvals', summary: 'Started a ' + w + '-week trial period for ' + s.name, entity: s.id, at: at });
  };
  A['csu-decline'] = function (el) { var s = db.getCoachSignup(el.dataset.id); reasonSheet('Decline ' + s.name + '?', 'They are told their sign-up was declined, with this reason.', 'csu-decline-do', s.id); };
  A['csu-decline-do'] = function (el) {
    var r = sheetReason(); if (!r) { Hub.toast('Add a reason to decline'); return; }
    var s = db.getCoachSignup(el.dataset.id), at = K.now(); Hub.closeSheet(true);
    Hub.mutate(function () { db.declineCoachSignup(s.id, r, K.me(), at); }, 'Sign-up declined', { area: 'Approvals', summary: 'Declined ' + s.role.toLowerCase() + ' sign-up: ' + s.name, entity: s.id, after: r, at: at });
  };

  /* ---------- mgmt-trial-coaches ---------- */
  Hub.screens['mgmt-trial-coaches'] = function (ctx) {
    var on = db.getActiveTrialCoaches(), done = db.getTrialCoaches().filter(function (t) { return t.status !== 'On trial'; });
    var tabs = [{ id: 'on', label: 'On trial', meta: on.length }, { id: 'done', label: 'Decided', meta: done.length }];
    var head = mhead({ title: 'Trial coaches', sub: 'Coaches on a trial period. Approve them to full coach, extend the trial or end it.', tabs: K.tabs('tco', tabs) });
    var g = K.guard(ctx, head, { empty: ['whistle', 'No coaches on trial', 'Start a trial period from Coach sign-ups.'] }); if (g) return g;
    var body;
    if (K.tab('tco', tabs) === 'on') {
      body = on.length ? K.grid(on.map(function (t) {
        var left = K.daysBetween(K.today, t.to), started = t.from > K.today;
        return K.card({ title: t.name, sub: esc(t.email), right: started ? K.pill('Starts ' + K.dm(t.from), 'info') : K.pill(left <= 7 ? 'Ends in ' + left + ' days' : left + ' days left', left <= 7 ? 'warn' : ''),
          body: K.kv([['Trial period', esc(K.dm(t.from) + ' – ' + K.dm(t.to))], ['Sessions worked', '<span class="num">' + t.sessions + '</span>'], ['Shadowing', K.link('mgmt-coach/' + t.shadowing, db.coachName(t.shadowing))]], true) +
            (t.feedback ? '<blockquote class="pub-quote">' + esc(t.feedback) + '<footer>' + K.stamp('Feedback', t.feedbackBy, t.feedbackAt) + '</footer></blockquote>' : '<p class="k-note">No feedback from the lead coach yet.</p>') +
            K.timeline(t.history.slice().reverse().map(function (h) { return { text: h.text, detail: h.detail ? esc(h.detail) : '', who: h.who, at: h.at }; })) +
            '<div class="k-bar pub-actions">' + K.actBtn('Approve to full coach', 'tco-approve', { id: t.id }, { variant: 'primary', size: 'sm', icon: 'check' }) + K.actBtn('Extend 2 weeks', 'tco-extend', { id: t.id }, { variant: 'secondary', size: 'sm' }) + K.actBtn('End trial', 'tco-end', { id: t.id }, { variant: 'tertiary', size: 'sm', icon: 'x' }) + '</div>' });
      }), 2) : '<div class="zone-inset">' + ui.empty('whistle', 'No coaches on trial', 'Start a trial period from Coach sign-ups.') + '</div>';
    } else {
      body = K.table({ cols: 'minmax(0,1.2fr) minmax(0,1fr) minmax(0,1.3fr) minmax(0,1.3fr)', head: ['Coach', 'Trial period', 'Outcome', 'Who and when'], empty: 'No decisions yet.',
        rows: done.map(function (t) { return { cells: [K.cell(esc(t.name), esc(t.email)), esc(K.dm(t.from) + ' – ' + K.dm(t.to)), K.cell(K.status(t.status), esc(t.endReason || t.outcome || '')), decided(t)] }; }) });
    }
    return K.page(head, body);
  };
  A['tco-approve'] = function (el) {
    var t = db.getTrialCoach(el.dataset.id);
    K.confirm({ overline: '<span class="overline">Approve</span>', title: 'Approve ' + t.name + ' to full coach?', body: '<p class="k-note">They stop shadowing and can be allocated as a coach. Their rate profile is set in Coaches.</p>', label: 'Approve', action: 'tco-approve-do', data: { 'data-id': t.id } });
  };
  A['tco-approve-do'] = function (el) {
    var t = db.getTrialCoach(el.dataset.id), at = K.now(); Hub.closeSheet(true);
    Hub.mutate(function () { db.approveTrialCoach(t.id, K.me(), at); }, t.name + ' is now a full coach', { area: 'Approvals', summary: 'Trial coach approved to full coach: ' + t.name, entity: t.id, at: at });
  };
  A['tco-extend'] = function (el) {
    var t = db.getTrialCoach(el.dataset.id), before = t.to, at = K.now();
    Hub.mutate(function () { db.extendTrialCoach(t.id, 14, K.me(), at); }, 'Trial extended by 2 weeks', { area: 'Approvals', summary: 'Trial extended for ' + t.name, entity: t.id, before: K.dm(before), after: K.dm(K.addDays(before, 14)), at: at });
  };
  A['tco-end'] = function (el) { var t = db.getTrialCoach(el.dataset.id); reasonSheet('End ' + t.name + '’s trial?', 'Their Coach hub access ends today. The reason is kept with the decision.', 'tco-end-do', t.id, 'End trial'); };
  A['tco-end-do'] = function (el) {
    var r = sheetReason(); if (!r) { Hub.toast('Add a reason to end the trial'); return; }
    var t = db.getTrialCoach(el.dataset.id), at = K.now(); Hub.closeSheet(true);
    Hub.mutate(function () { db.endTrialCoach(t.id, r, K.me(), at); }, 'Trial ended', { area: 'Approvals', summary: 'Trial ended for ' + t.name, entity: t.id, after: r, at: at });
  };

  /* ---------- mgmt-parent-claims ---------- */
  Hub.screens['mgmt-parent-claims'] = function (ctx) {
    var pend = db.getPendingClaims(), done = db.getParentClaims().filter(function (c) { return c.status !== 'Pending'; });
    var tabs = [{ id: 'review', label: 'Needs review', meta: pend.length, state: pend.length ? 'Warning' : null }, { id: 'done', label: 'Decided', meta: done.length }];
    var head = mhead({ title: 'Parent claims', sub: 'A parent who signs up and claims a child is linked automatically only when the name, date of birth and email all match. Everything else is checked here.', tabs: K.tabs('clm', tabs) });
    var g = K.guard(ctx, head, { empty: ['link', 'No claims to review', 'Partial matches from parent sign-up appear here.'] }); if (g) return g;
    var body;
    if (K.tab('clm', tabs) === 'review') {
      body = pend.length ? '<div class="lx-stack">' + pend.map(function (c) {
        var pl = db.getPlayer(c.player), fam = pl && db.getFamily(pl.family), parents = fam ? db.getFamilyParents(fam.id) : [];
        return K.card({ title: c.parent + ' claims ' + c.child, sub: K.stamp('Submitted', c.parent, c.at), right: K.status(c.outcome),
          body: '<div class="pub-claim"><div><h3 class="pub-h3">What matched and what did not</h3>' + checksList(c.checks) + '</div><div>' +
            K.kv([['Parent email', esc(c.email)], ['Date of birth entered', esc(K.d(c.dob))], pl ? ['Player on file', K.link('mgmt-player/' + pl.id, pl.name) + ' ' + K.id(pl.id) + '<br><small class="k-note">Born ' + esc(K.d(pl.dob)) + ' · ' + esc(pl.ageGroup) + '</small>'] : null,
              fam ? ['Family', K.link('mgmt-family/' + fam.id, fam.name) + ' ' + K.id(fam.id)] : null, fam ? ['Parents already linked', parents.map(function (p) { return esc(p.name) + ' <small class="k-note">' + esc(p.email) + '</small>'; }).join('<br>') || '—'] : null]) + '</div></div>' +
            ui.notice('warn', 'Why this needs review', esc(c.why)) +
            '<div class="k-bar pub-actions">' + K.actBtn('Approve and link', 'clm-approve', { id: c.id }, { variant: 'primary', size: 'sm', icon: 'link' }) + K.actBtn('Decline', 'clm-decline', { id: c.id }, { variant: 'tertiary', size: 'sm', icon: 'x' }) + '</div>' });
      }).join('') + '</div>' : '<div class="zone-inset">' + ui.empty('link', 'No claims to review', 'Partial matches from parent sign-up appear here.') + '</div>';
    } else {
      body = K.table({ cols: 'minmax(0,1.4fr) 120px minmax(0,1.4fr) minmax(0,1.4fr)', head: ['Claim', 'Match', 'Decision', 'Who and when'], empty: 'No decisions yet.',
        rows: done.map(function (c) { return { cells: [K.cell(esc(c.parent) + ' → ' + esc(c.child), esc(c.email) + ' · ' + esc(c.player)), K.status(c.outcome), K.cell(K.status(c.status), esc(c.declineReason || (c.linkedParent ? 'Linked as ' + c.linkedParent : ''))), decided(c)] }; }) });
    }
    return K.page(head, body);
  };
  A['clm-approve'] = function (el) {
    var c = db.getParentClaim(el.dataset.id), pl = db.getPlayer(c.player), fam = db.getFamily(pl.family);
    K.confirm({ overline: '<span class="overline">Approve claim</span>', title: 'Link ' + c.parent + ' to ' + pl.name + '?', body: '<p class="k-note">' + esc(c.parent) + ' joins the ' + esc(fam.name) + ' (' + esc(fam.id) + ') as a parent and can see ' + esc(pl.first) + '’s sessions, development and billing. Only approve once you have confirmed with the family. The date of birth on file is not changed.</p>', label: 'Approve and link', action: 'clm-approve-do', data: { 'data-id': c.id } });
  };
  A['clm-approve-do'] = function (el) {
    var c = db.getParentClaim(el.dataset.id), at = K.now(); Hub.closeSheet(true);
    Hub.mutate(function () { db.approveClaim(c.id, K.me(), at); }, c.parent + ' linked to ' + c.child, { area: 'Approvals', summary: 'Parent claim approved: ' + c.parent + ' linked to ' + c.child, entity: c.player, at: at });
  };
  A['clm-decline'] = function (el) { var c = db.getParentClaim(el.dataset.id); reasonSheet('Decline ' + c.parent + '’s claim?', 'Nothing is linked. The parent is told their claim could not be confirmed and to contact the office.', 'clm-decline-do', c.id); };
  A['clm-decline-do'] = function (el) {
    var r = sheetReason(); if (!r) { Hub.toast('Add a reason to decline'); return; }
    var c = db.getParentClaim(el.dataset.id), at = K.now(); Hub.closeSheet(true);
    Hub.mutate(function () { db.declineClaim(c.id, r, K.me(), at); }, 'Claim declined', { area: 'Approvals', summary: 'Parent claim declined: ' + c.parent + ' for ' + c.child, entity: c.player, after: r, at: at });
  };

  /* ---------- mgmt-trial-leads and mgmt-trial-leads/<id> ---------- */
  function offerTitle(id) { var o = db.getPublicOffer(id); return o ? o.title : id; }
  Hub.screens['mgmt-trial-leads'] = function (ctx) {
    if (ctx.param) return leadDetail(ctx);
    var all = db.getLeads(), sts = db.getLeadStatuses();
    var filters = [{ id: 'all', label: 'All (' + all.length + ')' }].concat(sts.map(function (s) { return { id: s, label: s + ' (' + db.getLeads(s).length + ')' }; }));
    var head = mhead({ title: 'Trial interest', sub: 'Interest registered on the public site. Contact the family, book a free session, or decline with a reason.', actions: K.goBtn('View the public site', 'pub-home', { variant: 'secondary', size: 'sm', trail: 'arrowRight' }) });
    var g = K.guard(ctx, head, { empty: ['inbox', 'No trial interest yet', 'Interest from the public site appears here.'] }); if (g) return g;
    var f = K.tab('leads', filters), list = f === 'all' ? all : db.getLeads(f);
    var body = (K.feature('trials') ? '' : K.featureOff('trials')) +
      K.stats(sts.map(function (s) { return { label: s, value: db.getLeads(s).length, tone: s === 'New' && db.getLeads(s).length ? 'warn' : '' }; })) +
      '<div class="lx-stack">' + K.seg('leads', filters) +
      K.table({ cols: 'minmax(0,1.3fr) minmax(0,1.3fr) 110px 110px 120px', head: ['Child', 'Parent', 'Interested in', 'Status', 'Received'], empty: 'No trial interest with this status.',
        rows: list.map(function (l) { return { route: 'mgmt-trial-leads/' + l.id, label: 'Open ' + l.child, cells: [K.cell(esc(l.child), esc(l.ageGroup) + ' · ' + esc(l.id)), K.cell(esc(l.parent), esc(l.email)), esc(offerTitle(l.offer)), K.status(l.status), '<span class="num">' + esc(K.dt(l.at)) + '</span>'] }; }) }) + '</div>';
    return K.page(head, body);
  };
  function leadDetail(ctx) {
    var l = db.getLead(ctx.param);
    if (!l) return K.page(mhead({ back: ['mgmt-trial-leads', 'Trial interest'], title: 'Not found' }), '<div class="zone-inset">' + ui.empty('inbox', 'This trial interest was not found', 'It may have been removed.') + '</div>');
    Hub.crumbTail = l.child;
    var head = mhead({ back: ['mgmt-trial-leads', 'Trial interest'], eyebrow: 'Trial interest · ' + l.id, title: l.child, sub: esc(l.ageGroup) + ' · ' + esc(offerTitle(l.offer)) + ' · ' + K.status(l.status) });
    var g = K.guard(ctx, head, { empty: false }); if (g) return g;
    var statusBtns = '<div class="segmented k-seg" role="group" aria-label="Status">' + db.getLeadStatuses().map(function (s) { return '<button type="button" data-action="lead-status" data-id="' + l.id + '" data-status="' + s + '" aria-pressed="' + (l.status === s) + '">' + esc(s) + '</button>'; }).join('') + '</div>';
    var left = K.card({ title: 'Details', body: K.kv([['Parent', esc(l.parent)], ['Email', esc(l.email)], ['Phone', esc(l.phone || '—')], ['Child', esc(l.child)], ['Age group', esc(l.ageGroup)], ['Interested in', K.link('pub-offer/' + l.offer, offerTitle(l.offer))], ['Message', esc(l.message || '—')]], true) + '<p>' + K.stamp('Submitted', l.parent, l.at) + '</p>' }) +
      K.card({ title: 'Notes', sub: 'Visible to management only', body: (l.notes.length ? '<ul class="pub-notes">' + l.notes.map(function (n) { return '<li><p>' + esc(n.text) + '</p>' + K.stamp('Added', n.by, n.at) + '</li>'; }).join('') + '</ul>' : '<p class="k-note">No notes yet.</p>') +
        K.form([K.field('Add a note', K.textarea('lead-note', '', 'Call outcome, preferred day, follow-up'))], 1) + '<div class="k-bar pub-actions">' + K.actBtn('Add note', 'lead-note', { id: l.id }, { variant: 'secondary', size: 'sm', icon: 'plus' }) + '</div>' });
    var right = K.card({ title: 'Status', body: statusBtns + (l.status === 'Declined' && l.declineReason ? ui.notice('neutral', 'Declined', esc(l.declineReason)) : '') +
        (l.status === 'Booked' ? '<p class="k-note">Book the free session from the group’s schedule: ' + K.link('mgmt-sessions', 'Sessions') + '.</p>' : '') }) +
      K.card({ title: 'History', body: K.timeline(l.history.slice().reverse().map(function (h) { return { text: h.text, detail: h.detail ? esc(h.detail) : '', who: h.who, at: h.at }; })) });
    return K.page(head, '<div class="k-grid k-grid--21"><div class="lx-stack">' + left + '</div><div class="lx-stack">' + right + '</div></div>');
  }
  A['lead-status'] = function (el) {
    var l = db.getLead(el.dataset.id), s = el.dataset.status;
    if (s === l.status) return;
    if (s === 'Declined') { reasonSheet('Decline trial interest for ' + l.child + '?', 'The reason is kept with the history. The family is not emailed automatically.', 'lead-decline-do', l.id); return; }
    var before = l.status, at = K.now();
    Hub.mutate(function () { db.setLeadStatus(l.id, s, K.me(), at); }, 'Marked ' + s.toLowerCase(), { area: 'Trial interest', summary: l.child + ' trial interest marked ' + s, entity: l.id, before: before, after: s, at: at });
  };
  A['lead-decline-do'] = function (el) {
    var r = sheetReason(); if (!r) { Hub.toast('Add a reason to decline'); return; }
    var l = db.getLead(el.dataset.id), before = l.status, at = K.now(); Hub.closeSheet(true);
    Hub.mutate(function () { db.setLeadStatus(l.id, 'Declined', K.me(), at, r); }, 'Marked declined', { area: 'Trial interest', summary: l.child + ' trial interest declined', entity: l.id, before: before, after: 'Declined', at: at });
  };
  A['lead-note'] = function (el) {
    var t = K.val('lead-note').trim(); if (!t) { Hub.toast('Write a note first'); return; }
    var l = db.getLead(el.dataset.id), at = K.now();
    Hub.mutate(function () { db.addLeadNote(l.id, t, K.me(), at); }, 'Note added', { area: 'Trial interest', summary: 'Note added to ' + l.child + ' trial interest', entity: l.id, at: at });
  };
})();
