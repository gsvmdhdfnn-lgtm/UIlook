/* Development, content and settings screens (pass 12). Management →
   More: Development hub, development framework and its settings, feedback
   review and publishing, development plans per review period, content
   admin, communications, organisation and branding, Hub Settings labels,
   feature controls, operational reports, profile and notifications.
   Data comes only from Hub.db (js/data/development.js and the shared
   data files). Every change goes through Hub.mutate with a log entry. */
(function () {
  var K = Hub.kit, db = Hub.db, ui = Hub.ui, I = Hub.icon, esc = ui.esc;
  var A = Hub.actions;

  /* ------------------------------------------------------------ helpers */
  function me() { return K.me(); }
  function pname(id) { var p = db.getPlayer(id); return p ? p.name : id; }
  function cname(key) { return db.coachName(key); }
  function sname(id) { var s = db.getSession(id); return s ? s.name : ''; }
  function P(text, tone) { return K.pill(text, tone); }
  var STATUS_TONE = { 'Published': 'ok', 'Awaiting review': 'warn', 'Returned': 'danger', 'Draft': '', 'Not started': '', 'Agreed': 'info', 'Shared with family': 'ok', 'Reviewed': 'ok', 'In progress': 'warn', 'On track': 'ok', 'At risk': 'danger', 'Achieved': 'ok', 'Sent': 'ok', 'Scheduled': 'info', 'Open': 'ok', 'Closed': '' };
  function st(text) { return P(text, STATUS_TONE[text] || ''); }
  /* Tables: first cell is the main cell, the last cell trails; middle
     cells are hidden on phones (st-tbl collapses to two columns). */
  function tbl(o) {
    var n = o.head.length;
    var head = o.head.map(function (h, i) { h = typeof h === 'string' ? { label: h } : h; return i > 0 && i < n - 1 ? { label: h.label, cls: ((h.cls || '') + ' wide').trim() } : h; });
    var rows = o.rows.map(function (r) { return { route: r.route, label: r.label, cells: r.cells.map(function (c, i) { c = typeof c === 'string' ? { html: c } : c; return i > 0 && i < n - 1 ? { html: c.html, cls: ((c.cls || '') + ' wide').trim() } : c; }) }; });
    return '<div class="st-tbl">' + K.table({ cols: o.cols, head: head, rows: rows, empty: o.empty, foot: o.foot }) + '</div>';
  }
  function chips(list) { return '<span class="st-chips">' + list.map(function (x) { return '<span class="st-chip">' + esc(x) + '</span>'; }).join('') + '</span>'; }
  function swatch(color, label) { return '<span class="st-sw" style="--sw:' + esc(color) + '"></span>' + (label ? '<span>' + esc(label) + '</span>' : ''); }
  function colourChip(l) { return l ? '<span class="st-clabel" style="--sw:' + esc(l.color) + '"><i></i>' + esc(l.label) + '</span>' : '<span class="c-mute">—</span>'; }
  function hidden(text) { return '<span class="st-vis st-vis--off">' + I('shield', 'icon-sm') + esc(text || 'Not visible to parents') + '</span>'; }
  function visible(text) { return '<span class="st-vis st-vis--on">' + I('checkCircle', 'icon-sm') + esc(text || 'Visible to the family') + '</span>'; }
  function sheetFoot(label, action, data) { return ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn(label, action, data || {}, { variant: 'primary' }); }
  function notFound(h, what) { return K.page(h, '<div class="zone-inset">' + ui.empty('info', what + ' not found', 'It may have been removed. Go back to the list to choose another.') + '</div>'); }
  function devOff() { return K.feature('development') ? '' : K.featureOff('development'); }
  function sorted(items) { return items.sort(function (a, b) { return a.at < b.at ? 1 : -1; }); }

  /* ------------------------------------------------------------- routes */
  K.route('mgmt-development', { title: 'Development', parent: 'more' });
  K.route('mgmt-framework', { title: 'Development framework', parent: 'more' });
  K.route('mgmt-framework-settings', { title: 'Framework settings', parent: 'more' });
  K.route('mgmt-feedback-review', { title: 'Feedback review', parent: 'more' });
  K.route('mgmt-idps', { title: function () { return K.label('IDPs'); }, parent: 'more' });
  K.route('mgmt-content', { title: 'Content & Brand', parent: 'more' });
  K.route('mgmt-comms', { title: 'Communications', parent: 'more' });
  K.route('mgmt-settings', { title: 'Organisation & branding', parent: 'more' });
  K.route('mgmt-labels', { title: 'Hub Settings: labels', parent: 'more' });
  K.route('mgmt-features', { title: 'Feature controls', parent: 'more' });
  K.route('mgmt-reports', { title: 'Reports', parent: 'more' });
  K.route('mgmt-profile', { title: 'Profile', parent: 'more' });
  K.route('mgmt-notifications', { title: 'Notifications', parent: 'more' });

  /* ================================================== DEVELOPMENT HUB */
  Hub.screens['mgmt-development'] = function (ctx) {
    var h = K.head({ back: ['mgmt-more', 'More'], eyebrow: 'Development', title: 'Development', sub: 'Feedback, ' + esc(K.label('IDPs')) + ', review periods and the development framework coaches work to.',
      actions: K.goBtn('Review feedback', 'mgmt-feedback-review', { variant: 'primary', icon: 'development' }) });
    var g = K.guard(ctx, h, { empty: ['development', 'No development activity yet', 'Feedback and ' + K.label('IDPs') + ' appear here once coaches start writing them.'] }); if (g) return g;
    var waiting = db.getFeedbackAwaitingReview(), all = db.getFeedback(), period = db.getCurrentReviewPeriod();
    var pub = all.filter(function (f) { return f.status === 'Published' && f.period === 'September 2026'; }).length;
    var idps = period ? db.getIdps(null, period.id) : [], shared = idps.filter(function (i) { return i.status === 'Shared with family'; }).length, notStarted = db.getIdpsNotStarted().length;
    var stats = K.stats([
      { label: 'Awaiting review', value: waiting.length, sub: 'Hidden from families until published', route: 'mgmt-feedback-review', tone: waiting.length ? 'warn' : '' },
      { label: 'Published in September', value: pub, sub: 'Feedback visible to families', route: 'mgmt-feedback-review' },
      { label: K.label('IDPs') + ' shared', value: shared + ' of ' + idps.length, sub: (period ? period.name : '') + ' review period', route: 'mgmt-idps' },
      { label: K.label('IDPs') + ' not started', value: notStarted, sub: period ? 'Review by ' + K.dm(period.reviewBy) : '', route: 'mgmt-idps', tone: notStarted ? 'warn' : '' }
    ]);
    var fw = db.getFramework();
    var tiles = K.tiles([
      { route: 'mgmt-feedback-review', icon: 'inbox', title: 'Feedback review', value: waiting.length, label: 'awaiting review', desc: 'Publish coach feedback to families or return it with a note.' },
      { route: 'mgmt-idps', icon: 'star', title: K.label('IDPs'), value: idps.length, label: period ? period.name : '', desc: 'Targets per player for each review period.' },
      { route: 'mgmt-framework', icon: 'development', title: 'Development framework', value: fw.groups.length, label: 'groups', desc: 'Groups, order, visibility and written prompts.' },
      { route: 'mgmt-framework-settings', icon: 'settings', title: 'Framework settings', desc: 'Feedback mode, sections and colour labels.' },
      { route: 'mgmt-content', icon: 'book', title: 'Resources', desc: 'Library items for coaches and parents.' },
      { route: 'mgmt-labels', icon: 'swap', title: 'Rename labels', desc: 'Call ' + K.label('IDPs') + ' something else across every hub.' }
    ], 3);
    var events = [];
    all.forEach(function (f) { f.history.forEach(function (x) { events.push({ text: x.text + ': ' + pname(f.player), who: x.who, at: x.at, tone: x.tone }); }); });
    db.getIdps().forEach(function (i) { i.history.forEach(function (x) { if (x.who !== 'System') events.push({ text: K.label('IDP') + ' · ' + x.text + ': ' + pname(i.player), who: x.who, at: x.at, tone: x.tone }); }); });
    var activity = K.card({ title: 'Recent development activity', sub: 'Who did what, newest first', body: K.timeline(sorted(events).slice(0, 7)) });
    var queue = K.card({ title: 'Waiting for you', sub: waiting.length + ' feedback item' + (waiting.length === 1 ? '' : 's') + ' to publish or return', right: K.link('mgmt-feedback-review', 'Open review'),
      body: waiting.length ? K.list(waiting.map(function (f) { return ui.row({ lead: ui.avatar(pname(f.player), 'md'), title: esc(pname(f.player)), sub: [esc(cname(f.coach)), esc(f.period), K.dt(f.submittedAt)], href: '#mgmt-feedback-review/' + f.id, trail: hidden('Hidden') }); })) : ui.empty('checkCircle', 'Nothing waiting', 'All submitted feedback has been reviewed.', 'ok') });
    return K.page(h, devOff() + stats + tiles + K.grid([queue, activity], 2));
  };

  /* ============================================ DEVELOPMENT FRAMEWORK */
  Hub.screens['mgmt-framework'] = function (ctx) {
    var fw = db.getFramework();
    var h = K.head({ back: ['mgmt-development', 'Development'], eyebrow: 'Development', title: 'Development framework', sub: 'The groups coaches rate and write about. Order, visibility and prompts apply to the Coach and Parent hubs straight away.',
      actions: K.goBtn('Framework settings', 'mgmt-framework-settings', { variant: 'secondary', icon: 'settings' }) + K.actBtn('Add group', 'st-group-edit', { id: '' }, { variant: 'primary', icon: 'plus' }) });
    var g = K.guard(ctx, h, { empty: ['development', 'No framework groups yet', 'Add a group such as Technical or Social to start.'] }); if (g) return g;
    var n = fw.groups.length;
    var cards = fw.groups.map(function (gr, i) {
      var moves = '<span class="k-row-actions">' +
        K.actBtn('', 'st-group-move', { id: gr.id, dir: -1 }, { size: 'sm', variant: 'tertiary', icon: 'chevronDown', cls: 'st-up', attrs: i === 0 ? { disabled: true, 'aria-label': 'Move up' } : { 'aria-label': 'Move ' + gr.name + ' up' } }) +
        K.actBtn('', 'st-group-move', { id: gr.id, dir: 1 }, { size: 'sm', variant: 'tertiary', icon: 'chevronDown', attrs: i === n - 1 ? { disabled: true, 'aria-label': 'Move down' } : { 'aria-label': 'Move ' + gr.name + ' down' } }) +
        K.actBtn('Edit', 'st-group-edit', { id: gr.id }, { size: 'sm', variant: 'secondary' }) + '</span>';
      return '<article class="st-group lx-card">' +
        '<div class="st-group__head"><span class="st-group__n num">' + (i + 1) + '</span><div class="st-group__title"><h3>' + esc(gr.name) + '</h3><p>' + esc(gr.desc) + '</p></div>' + moves + '</div>' +
        chips(gr.items) +
        '<div class="st-group__toggles">' + K.toggle(gr.coach, 'st-group-flag', { id: gr.id, flag: 'coach' }, 'Visible to coaches') + K.toggle(gr.parent, 'st-group-flag', { id: gr.id, flag: 'parent' }, 'Visible to parents') + K.toggle(gr.rating, 'st-group-flag', { id: gr.id, flag: 'rating' }, 'Rating enabled') + '</div>' +
        '<div class="st-prompt"><span class="lx-eyebrow">Written prompt</span><p>' + esc(gr.prompt) + '</p></div>' +
        K.stamp('Updated', gr.updatedBy, gr.updatedAt) + '</article>';
    }).join('');
    var parentSees = db.getFrameworkGroups('parent').map(function (x) { return x.name; });
    var aside = K.card({ title: 'What families see', sub: 'Groups visible to parents, in this order', body: (parentSees.length ? chips(parentSees) : '<p class="k-note">No groups are visible to parents.</p>') +
      '<p class="k-note st-gap">Groups hidden from parents still appear to coaches when written about. ' + K.link('mgmt-framework-settings', 'Colour labels and sections') + '</p>' +
      '<div class="st-gap">' + K.stamp('Framework v' + fw.version + ' updated', fw.updatedBy, fw.updatedAt) + '</div>' });
    return K.page(h, devOff() + '<div class="k-grid k-grid--21"><div class="lx-stack">' + cards + '</div>' + aside + '</div>');
  };
  A['st-group-move'] = function (el) {
    var gr = db.getFrameworkGroup(el.dataset.id), at = K.now();
    Hub.mutate(function () { db.moveFrameworkGroup(el.dataset.id, +el.dataset.dir, me(), at); }, gr.name + ' moved ' + (+el.dataset.dir < 0 ? 'up' : 'down'), { area: 'Development', summary: 'Framework group ' + gr.name + ' moved ' + (+el.dataset.dir < 0 ? 'up' : 'down'), entity: gr.id, at: at });
  };
  A['st-group-flag'] = function (el) {
    var gr = db.getFrameworkGroup(el.dataset.id), f = el.dataset.flag, at = K.now(), word = { coach: 'Visible to coaches', parent: 'Visible to parents', rating: 'Rating' }[f];
    var before = gr[f] ? 'On' : 'Off';
    Hub.mutate(function () { db.setFrameworkGroupFlag(gr.id, f, me(), at); }, gr.name + ': ' + word + (gr[f] ? ' off' : ' on'), { area: 'Development', summary: gr.name + ': ' + word + ' switched ' + (before === 'On' ? 'off' : 'on'), entity: gr.id, before: before, after: before === 'On' ? 'Off' : 'On', at: at });
  };
  A['st-group-edit'] = function (el) {
    var gr = el.dataset.id ? db.getFrameworkGroup(el.dataset.id) : { name: '', desc: '', items: [], prompt: '' };
    K.sheet({ overline: '<span class="overline">Development framework</span>', title: gr.id ? 'Edit ' + esc(gr.name) : 'Add a group',
      body: K.form([K.field('Group name', K.input('fg-name', gr.name, { placeholder: 'e.g. Goalkeeping' })), K.field('Short description', K.input('fg-desc', gr.desc)),
        K.field('Areas in this group', K.input('fg-items', gr.items.join(', ')), 'Separate with commas.', true), K.field('Written prompt for coaches', K.textarea('fg-prompt', gr.prompt, 'What should coaches write about?'), '', true)], 2),
      foot: sheetFoot(gr.id ? 'Save group' : 'Add group', 'st-group-save', { id: gr.id || '' }) });
  };
  A['st-group-save'] = function (el) {
    var name = K.val('fg-name').trim(); if (!name) { Hub.toast('Give the group a name'); return; }
    var at = K.now(), data = { id: el.dataset.id || null, name: name, desc: K.val('fg-desc').trim(), items: K.val('fg-items').split(',').map(function (s) { return s.trim(); }).filter(Boolean), prompt: K.val('fg-prompt').trim() };
    Hub.closeSheet(true);
    Hub.mutate(function () { db.saveFrameworkGroup(data, me(), at); }, el.dataset.id ? name + ' saved' : name + ' added', { area: 'Development', summary: (el.dataset.id ? 'Framework group edited: ' : 'Framework group added: ') + name, entity: el.dataset.id || name, at: at });
  };

  /* ============================================== FRAMEWORK SETTINGS */
  Hub.screens['mgmt-framework-settings'] = function (ctx) {
    var s = db.getFrameworkSettings();
    var h = K.head({ back: ['mgmt-framework', 'Development framework'], eyebrow: 'Development', title: 'Framework settings', sub: 'How coaches write feedback and how families read it.' });
    var g = K.guard(ctx, h, { empty: ['settings', 'No settings yet', 'Settings appear once a framework is set up.'] }); if (g) return g;
    var mode = K.card({ title: 'Feedback mode', sub: 'What a coach fills in for each player', body:
      K.form([K.field('Mode', '<select class="select" data-st="fs-mode" name="fs-mode">' + s.modes.map(function (m) { return '<option' + (m === s.mode ? ' selected' : '') + '>' + esc(m) + '</option>'; }).join('') + '</select>', 'Changes apply to new feedback only.', true)], 1) +
      '<div class="st-toggles">' +
        K.toggle(s.keepDoing, 'st-fs-flag', { flag: 'keepDoing' }, 'Show “Keep doing”') +
        K.toggle(s.focus, 'st-fs-flag', { flag: 'focus' }, 'Show “My focus”') +
        K.toggle(s.general, 'st-fs-flag', { flag: 'general' }, 'Show “General coach feedback”') +
        K.toggle(s.perArea, 'st-fs-flag', { flag: 'perArea' }, 'Written feedback per area') +
        K.toggle(s.approval, 'st-fs-flag', { flag: 'approval' }, 'Management publishes feedback (review first)') + '</div>' +
      K.stamp('Updated', s.updatedBy, s.updatedAt) });
    var labels = K.card({ title: 'Colour labels', sub: 'The rating scale coaches choose from and families see', body:
      '<div class="st-labels">' + s.labels.map(function (l, i) {
        return '<div class="st-label"><span class="st-label__n num">' + (i + 1) + '</span>' + K.field('Label', K.input('fs-label-' + l.id, l.pendingName || l.label)) +
          '<div class="st-pal" role="group" aria-label="Colour for ' + esc(l.label) + '">' + s.palette.map(function (c) { return '<button type="button" class="st-pal__c' + (c === l.color ? ' is-on' : '') + '" style="--sw:' + c + '" data-action="st-label-colour" data-id="' + l.id + '" data-color="' + c + '" aria-label="Colour ' + c + '" aria-pressed="' + (c === l.color) + '"></button>'; }).join('') + '</div></div>';
      }).join('') + '</div><div class="k-bar st-gap">' + K.actBtn('Save label names', 'st-label-save', {}, { variant: 'primary', size: 'sm' }) + '<span class="k-bar__spacer"></span>' + s.labels.map(colourChip).join('') + '</div>' });
    var sample = db.getLatestPublishedFeedback('PLY-0001');
    var prev = sample ? '<div class="st-fbprev">' +
      (s.keepDoing ? '<div class="st-fbprev__b"><span class="lx-eyebrow">Keep doing</span><p>' + esc(sample.keepDoing) + '</p></div>' : '') +
      (s.focus ? '<div class="st-fbprev__b"><span class="lx-eyebrow">My focus</span><p>' + esc(sample.focus) + '</p></div>' : '') +
      (s.general && sample.general ? '<div class="st-fbprev__b"><span class="lx-eyebrow">General coach feedback</span><p>' + esc(sample.general) + '</p></div>' : '') +
      (s.mode !== 'Written only' ? '<div class="st-fbprev__r">' + db.getFrameworkGroups('parent').filter(function (gr) { return gr.rating && sample.ratings[gr.id]; }).map(function (gr) { return '<span>' + esc(gr.name) + '</span>' + colourChip(db.getColourLabel(sample.ratings[gr.id])); }).join('') + '</div>' : '') +
      '<small class="k-note">' + esc(cname(sample.coach)) + ' · ' + esc(sample.period) + '</small></div>' : '';
    var preview = K.card({ title: 'How families see it', sub: 'Live preview using ' + esc(pname('PLY-0001')) + '’s published feedback', body: prev });
    return K.page(h, devOff() + K.grid(['<div class="lx-stack">' + mode + labels + '</div>', preview], '21'));
  };
  A['st-fs-flag'] = function (el) {
    var s = db.getFrameworkSettings(), f = el.dataset.flag, at = K.now(), p = {}; p[f] = !s[f];
    var word = { keepDoing: 'Keep doing', focus: 'My focus', general: 'General coach feedback', perArea: 'Written feedback per area', approval: 'Management review before publishing' }[f];
    Hub.mutate(function () { db.updateFrameworkSettings(p, me(), at); }, word + (p[f] ? ' on' : ' off'), { area: 'Development', summary: 'Framework settings: ' + word + ' switched ' + (p[f] ? 'on' : 'off'), before: s[f] ? 'On' : 'Off', after: p[f] ? 'On' : 'Off', at: at });
  };
  A['st-label-colour'] = function (el) {
    var l = db.getColourLabel(el.dataset.id), at = K.now(), before = l.color;
    keepLabelNames();
    Hub.mutate(function () { db.setColourLabel(l.id, { color: el.dataset.color }, me(), at); }, l.label + ' colour changed', { area: 'Development', summary: 'Colour label ' + l.label + ' colour changed', before: before, after: el.dataset.color, at: at });
  };
  function keepLabelNames() { /* typed names survive a re-render triggered by a colour click */
    db.getFrameworkSettings().labels.forEach(function (l) { var v = K.val('fs-label-' + l.id).trim(); if (v) l.pendingName = v; });
  }
  A['st-label-save'] = function () {
    var at = K.now(), changes = [];
    db.getFrameworkSettings().labels.forEach(function (l) { var v = K.val('fs-label-' + l.id).trim(); delete l.pendingName; if (v && v !== l.label) { changes.push(l.label + ' → ' + v); db.setColourLabel(l.id, { label: v }, me(), at); } });
    if (!changes.length) { Hub.toast('No label names changed'); return; }
    Hub.mutate(null, 'Colour labels saved', { area: 'Development', summary: 'Colour labels renamed: ' + changes.join(', '), at: at });
  };
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t.dataset || !t.dataset.st) return;
    var at = K.now();
    if (t.dataset.st === 'fs-mode') { var before = db.getFrameworkSettings().mode; Hub.mutate(function () { db.updateFrameworkSettings({ mode: t.value }, me(), at); }, 'Feedback mode: ' + t.value, { area: 'Development', summary: 'Feedback mode changed', before: before, after: t.value, at: at }); }
    if (t.dataset.st === 'idp-status') { var i = db.getIdp(t.dataset.id), b = i.status; Hub.mutate(function () { db.setIdpStatus(i.id, t.value, me(), at); }, K.label('IDP') + ' marked ' + t.value, { area: 'Development', summary: K.label('IDP') + ' status for ' + pname(i.player), entity: i.id, before: b, after: t.value, at: at }); }
    if (t.dataset.st === 'idp-target') { var j = db.getIdp(t.dataset.id), n = +t.dataset.n, tb = j.targets[n].status; Hub.mutate(function () { db.setIdpTarget(j.id, n, { status: t.value }, me(), at); }, 'Target marked ' + t.value, { area: 'Development', summary: 'Target ' + (n + 1) + ' for ' + pname(j.player), entity: j.id, before: tb, after: t.value, at: at }); }
    if (t.dataset.st === 'brand-tz') { brandDraft().org.timezone = t.value; }
  });

  /* ================================================== FEEDBACK REVIEW */
  var FB_FILTERS = [{ id: 'Awaiting review', label: 'Awaiting review' }, { id: 'Returned', label: 'Returned' }, { id: 'Draft', label: 'Drafts' }, { id: 'Published', label: 'Published' }, { id: 'all', label: 'All' }];
  Hub.screens['mgmt-feedback-review'] = function (ctx) {
    if (ctx.param) return feedbackDetail(ctx);
    var all = db.getFeedback();
    var list = FB_FILTERS.map(function (f) { var n = f.id === 'all' ? all.length : all.filter(function (x) { return x.status === f.id; }).length; return { id: f.id, label: f.label, meta: n + '', state: f.id === 'Awaiting review' && n ? 'Warning' : null }; });
    var h = K.head({ back: ['mgmt-development', 'Development'], eyebrow: 'Development', title: 'Feedback review', sub: 'Coach feedback stays hidden from families until it is published here. Return it with a note if it needs changes.', tabs: ctx.state === 'live' ? K.tabs('st-fb', list) : '' });
    var g = K.guard(ctx, h, { empty: ['inbox', 'No feedback yet', 'Feedback from coaches appears here for review before families see it.'] }); if (g) return g;
    var f = K.tab('st-fb', list), rows = all.filter(function (x) { return f === 'all' || x.status === f; });
    var body = tbl({ cols: 'minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1.1fr) minmax(0, 190px)', head: ['Player', 'Coach', 'Submitted', { label: 'Status', cls: 'c-end' }], empty: 'Nothing in this filter.',
      rows: rows.map(function (x) {
        var when = x.submittedAt ? K.stamp('Submitted', x.submittedBy, x.submittedAt) : K.stamp('Draft started', x.startedBy, x.startedAt);
        return { route: 'mgmt-feedback-review/' + x.id, label: 'Open ' + pname(x.player), cells: [K.cell(esc(pname(x.player)), esc(x.period) + ' · ' + esc(sname(x.session))), esc(cname(x.coach)) + (x.learning ? ' ' + P('Learning coach', 'info') : ''), when,
          { cls: 'c-end st-stack', html: st(x.status) + (x.status === 'Published' ? visible('Visible') : hidden('Hidden from family')) }] };
      }) });
    return K.page(h, devOff() + body + '<p class="lx-note">Drafts and anything not yet published are never shown in the Parent hub. ' + esc(db.getFeedbackAwaitingReview().length) + ' item(s) waiting raise a case in Needs attention.</p>');
  };
  function feedbackDetail(ctx) {
    var f = db.getFeedbackItem(ctx.param), s = db.getFrameworkSettings();
    var h0 = K.head({ back: ['mgmt-feedback-review', 'Feedback review'], eyebrow: 'Feedback', title: f ? pname(f.player) : 'Feedback' });
    var g = K.guard(ctx, h0, { empty: ['inbox', 'Nothing to review', 'This feedback has no content yet.'] }); if (g) return g;
    if (!f) return notFound(h0, 'Feedback');
    Hub.crumbTail = pname(f.player);
    var acts = '';
    if (f.status === 'Awaiting review') acts = K.actBtn('Return with note', 'st-fb-return', { id: f.id }, { variant: 'secondary' }) + K.actBtn('Publish to family', 'st-fb-publish', { id: f.id }, { variant: 'primary', icon: 'check' });
    else if (f.status === 'Published') acts = K.actBtn('Hide from family', 'st-fb-unpublish', { id: f.id }, { variant: 'secondary' });
    else if (f.status === 'Returned') acts = K.actBtn('Publish anyway', 'st-fb-publish', { id: f.id }, { variant: 'secondary' });
    var h = K.head({ back: ['mgmt-feedback-review', 'Feedback review'], eyebrow: 'Feedback · ' + f.period, title: pname(f.player), sub: esc(cname(f.coach)) + ' · ' + esc(sname(f.session)) + ' · ' + K.id(f.id), actions: acts });
    var vis = f.status === 'Published' ? ui.notice('ok', 'Visible to the family', 'Published by ' + esc(f.publishedBy) + ', ' + esc(K.dt(f.publishedAt)) + '. Parents see this in the Parent hub under Development.')
      : ui.notice('neutral', 'Not visible to parents', f.status === 'Draft' ? 'The coach is still writing this draft. It cannot be published until it is submitted.' : f.status === 'Returned' ? 'Returned to the coach. It stays hidden until it is resubmitted and published.' : 'Waiting for review. Families see nothing until you publish it.', { icon: 'shield' });
    var learning = f.learning ? ui.notice('info', 'Written by a learning coach', 'Learning coach feedback needs a lead or Management sign-off before families see it.') : '';
    function block(label, text, on) { return '<div class="st-fbprev__b' + (on ? '' : ' is-off') + '"><span class="lx-eyebrow">' + esc(label) + (on ? '' : ' · hidden by framework settings') + '</span><p>' + (text ? esc(text) : '<span class="c-mute">Not written yet</span>') + '</p></div>'; }
    var content = K.card({ title: 'Feedback', sub: f.status === 'Published' ? 'As the family sees it' : 'Draft content: not visible to parents', right: st(f.status), body: '<div class="st-fbprev">' +
      block('Keep doing', f.keepDoing, s.keepDoing) + block('My focus', f.focus, s.focus) + block('General coach feedback', f.general, s.general) + '</div>' });
    var ratings = K.card({ title: 'Ratings', sub: 'Colour labels per framework group', body: K.kv(db.getFramework().groups.filter(function (gr) { return gr.rating; }).map(function (gr) {
      return [gr.name + (gr.parent ? '' : ' (coaches only)'), colourChip(db.getColourLabel(f.ratings[gr.id]))]; }), true) });
    var returns = f.returns.length ? K.card({ title: 'Notes returned to the coach', body: f.returns.map(function (r) { return '<div class="st-note"><p>' + esc(r.note) + '</p>' + K.stamp('Returned', r.by, r.at) + '</div>'; }).join('') }) : '';
    var history = K.card({ title: 'History', body: K.timeline(f.history.slice().reverse()) });
    return K.page(h, vis + learning + K.grid(['<div class="lx-stack">' + content + ratings + '</div>', '<div class="lx-stack">' + returns + history + '</div>'], '21'));
  }
  A['st-fb-publish'] = function (el) {
    var f = db.getFeedbackItem(el.dataset.id), at = K.now();
    Hub.mutate(function () { db.publishFeedback(f.id, me(), at); }, 'Published to ' + pname(f.player) + '’s family', { area: 'Development', summary: 'Feedback published for ' + pname(f.player), entity: f.id, before: 'Hidden', after: 'Visible to family', at: at });
  };
  A['st-fb-unpublish'] = function (el) {
    var f = db.getFeedbackItem(el.dataset.id), at = K.now();
    Hub.mutate(function () { db.unpublishFeedback(f.id, me(), at); }, 'Hidden from the family', { area: 'Development', summary: 'Feedback hidden from family for ' + pname(f.player), entity: f.id, before: 'Visible to family', after: 'Hidden', at: at });
  };
  A['st-fb-return'] = function (el) {
    var f = db.getFeedbackItem(el.dataset.id);
    K.sheet({ overline: '<span class="overline">Feedback review</span>', title: 'Return to ' + esc(cname(f.coach)), body: '<p class="k-note">The coach sees this note and can resubmit. The feedback stays hidden from the family.</p>' + K.form([K.field('Note to the coach', K.textarea('fb-note', '', 'What needs changing?'), '', true)], 1),
      foot: sheetFoot('Return with note', 'st-fb-return-go', { id: f.id }) });
  };
  A['st-fb-return-go'] = function (el) {
    var note = K.val('fb-note').trim(); if (!note) { Hub.toast('Add a note for the coach'); return; }
    var f = db.getFeedbackItem(el.dataset.id), at = K.now(); Hub.closeSheet(true);
    Hub.mutate(function () { db.returnFeedback(f.id, note, me(), at); }, 'Returned to ' + cname(f.coach), { area: 'Development', summary: 'Feedback returned for ' + pname(f.player), entity: f.id, after: note, at: at });
  };

  /* ===================================== DEVELOPMENT PLANS (labelled) */
  var IDP_STATUSES = ['Not started', 'Draft', 'Agreed', 'Shared with family', 'Reviewed'];
  var TARGET_STATUSES = ['Not started', 'In progress', 'On track', 'At risk', 'Achieved'];
  Hub.screens['mgmt-idps'] = function (ctx) {
    if (ctx.param) return idpDetail(ctx);
    var periods = db.getReviewPeriods(), tabs = periods.map(function (p) { return { id: p.id, label: p.name, meta: p.status }; });
    var h = K.head({ back: ['mgmt-development', 'Development'], eyebrow: 'Development', title: K.label('IDPs'), sub: 'Targets per player for each review period. Families see a ' + esc(K.label('IDP')) + ' only once it is shared.',
      actions: K.actBtn('Remind coaches', 'st-idp-remind', {}, { variant: 'secondary', icon: 'bell' }), tabs: ctx.state === 'live' ? K.tabs('st-idp', tabs) : '' });
    var g = K.guard(ctx, h, { empty: ['star', 'No ' + K.label('IDPs') + ' yet', 'Open a review period to create one for every active player.'] }); if (g) return g;
    var pid = K.tab('st-idp', tabs), period = db.getReviewPeriod(pid), list = db.getIdps(null, pid);
    var count = function (s) { return list.filter(function (i) { return i.status === s; }).length; };
    var stats = K.stats([{ label: 'Not started', value: count('Not started'), tone: count('Not started') ? 'warn' : '' }, { label: 'Draft', value: count('Draft') }, { label: 'Agreed', value: count('Agreed') }, { label: period.status === 'Open' ? 'Shared with family' : 'Reviewed', value: count(period.status === 'Open' ? 'Shared with family' : 'Reviewed') }]);
    var info = K.card({ title: period.name + ' review period', right: st(period.status), body: K.kv([['Runs', K.dm(period.from) + ' to ' + K.dm(period.to)], ['Review by', K.d(period.reviewBy)], ['Opened', K.stamp('Opened', period.openedBy, period.openedAt)], period.closedAt ? ['Closed', K.stamp('Closed', period.closedBy, period.closedAt)] : null], true) });
    var body = tbl({ cols: 'minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, .8fr) minmax(0, 1.2fr) minmax(0, 170px)', head: ['Player', 'Coach', 'Targets', 'Updated', { label: 'Status', cls: 'c-end' }], empty: 'No plans in this period.',
      rows: list.map(function (i) {
        var done = i.targets.filter(function (t) { return t.status === 'Achieved'; }).length;
        return { route: 'mgmt-idps/' + i.id, label: 'Open ' + pname(i.player), cells: [K.cell(esc(pname(i.player)), esc((db.getPlayer(i.player) || {}).ageGroup || '')), esc(cname(i.coach)), '<span class="num">' + i.targets.length + (i.targets.length ? ' · ' + done + ' achieved' : '') + '</span>', K.stamp('Updated', i.updatedBy, i.updatedAt), { cls: 'c-end st-stack', html: st(i.status) + (i.status === 'Shared with family' || i.status === 'Reviewed' ? visible('Visible') : hidden('Hidden from family')) }] };
      }) });
    return K.page(h, devOff() + stats + info + body);
  };
  function idpDetail(ctx) {
    var i = db.getIdp(ctx.param);
    var h0 = K.head({ back: ['mgmt-idps', K.label('IDPs')], eyebrow: K.label('IDP'), title: i ? pname(i.player) : K.label('IDP') });
    var g = K.guard(ctx, h0, { empty: ['star', 'No targets yet', 'Add a target to start this ' + K.label('IDP') + '.'] }); if (g) return g;
    if (!i) return notFound(h0, K.label('IDP'));
    var period = db.getReviewPeriod(i.period); Hub.crumbTail = pname(i.player);
    var shared = i.status === 'Shared with family' || i.status === 'Reviewed';
    var h = K.head({ back: ['mgmt-idps', K.label('IDPs')], eyebrow: K.label('IDP') + ' · ' + period.name, title: pname(i.player), sub: esc(cname(i.coach)) + ' · ' + K.id(i.id),
      actions: K.goBtn('Player', 'mgmt-player/' + i.player, { variant: 'secondary' }) + (i.status !== 'Shared with family' && i.status !== 'Reviewed' && i.targets.length ? K.actBtn('Share with family', 'st-idp-share', { id: i.id }, { variant: 'primary' }) : '') });
    var vis = shared ? ui.notice('ok', 'Visible to the family', i.sharedAt ? 'Shared by ' + esc(i.sharedBy) + ', ' + esc(K.dt(i.sharedAt)) + '.' : 'Reviewed at the end of the period.') : ui.notice('neutral', 'Not visible to parents', 'This ' + esc(K.label('IDP')) + ' is ' + esc(i.status.toLowerCase()) + '. Families see it once it is shared.', { icon: 'shield' });
    var groups = db.getFramework().groups;
    var targets = i.targets.length ? '<div class="st-targets">' + i.targets.map(function (t, n) {
      var gr = db.getFrameworkGroup(t.group);
      return '<div class="st-target"><span class="st-target__n num">' + (n + 1) + '</span><div class="st-target__main"><b>' + esc(t.text) + '</b><small>' + esc(gr ? gr.name : '') + '</small></div>' +
        '<label class="st-target__st"><span class="visually-hidden">Status</span><select class="select" data-st="idp-target" data-id="' + i.id + '" data-n="' + n + '">' + TARGET_STATUSES.map(function (s) { return '<option' + (s === t.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></label></div>';
    }).join('') + '</div>' : ui.empty('star', 'No targets yet', 'Add the first target below.');
    var add = '<div class="st-gap">' + K.form([K.field('New target', K.input('idp-new', '', { placeholder: 'e.g. Receive on the half-turn' })), K.field('Framework group', K.select('idp-group', groups.map(function (x) { return [x.id, x.name]; }), groups[0].id))], 2) +
      '<div class="k-bar st-gap">' + K.actBtn('Add target', 'st-idp-add', { id: i.id }, { variant: 'secondary', size: 'sm', icon: 'plus' }) + '</div></div>';
    var main = K.card({ title: 'Targets', sub: i.targets.length + ' target' + (i.targets.length === 1 ? '' : 's'), body: targets + add });
    var side = K.card({ title: 'Status', body: '<label class="field k-field"><span class="label">' + esc(K.label('IDP')) + ' status</span><select class="select" data-st="idp-status" data-id="' + i.id + '">' + IDP_STATUSES.map(function (s) { return '<option' + (s === i.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></label>' +
      '<div class="st-gap">' + K.stamp('Updated', i.updatedBy, i.updatedAt) + '</div>' + (i.reviewNote ? '<div class="st-note st-gap"><p>' + esc(i.reviewNote) + '</p></div>' : '') }) +
      K.card({ title: 'History', body: K.timeline(i.history.slice().reverse()) });
    return K.page(h, vis + K.grid([main, '<div class="lx-stack">' + side + '</div>'], '21'));
  }
  A['st-idp-add'] = function (el) {
    var text = K.val('idp-new').trim(); if (!text) { Hub.toast('Write the target first'); return; }
    var i = db.getIdp(el.dataset.id), at = K.now(), grp = K.val('idp-group');
    Hub.mutate(function () { db.addIdpTarget(i.id, { text: text, group: grp, status: 'Not started' }, me(), at); }, 'Target added', { area: 'Development', summary: K.label('IDP') + ' target added for ' + pname(i.player), entity: i.id, after: text, at: at });
  };
  A['st-idp-share'] = function (el) {
    var i = db.getIdp(el.dataset.id), at = K.now(), b = i.status;
    Hub.mutate(function () { db.setIdpStatus(i.id, 'Shared with family', me(), at); }, K.label('IDP') + ' shared with the family', { area: 'Development', summary: K.label('IDP') + ' shared for ' + pname(i.player), entity: i.id, before: b, after: 'Shared with family', at: at });
  };
  A['st-idp-remind'] = function () {
    var n = db.getIdpsNotStarted(), coaches = n.map(function (i) { return cname(i.coach); }).filter(function (v, k, a) { return a.indexOf(v) === k; });
    Hub.mutate(null, n.length ? 'Reminder sent to ' + coaches.join(', ') : 'Every ' + K.label('IDP') + ' has been started', n.length ? { area: 'Development', summary: 'Reminder sent about ' + n.length + ' ' + K.label('IDPs') + ' not started', after: coaches.join(', ') } : null);
  };

  /* ==================================================== CONTENT ADMIN */
  var CT_TABS = [{ id: 'resources', label: 'Resources' }, { id: 'support', label: 'Coach support' }, { id: 'pages', label: 'Public pages' }, { id: 'offers', label: 'What we offer' }, { id: 'guide', label: 'Admin guide' }];
  var CT_FORM = {
    resources: [['title', 'Title'], ['type', 'Type', ['Session plan', 'Video', 'Guide', 'PDF', 'Link']], ['audience', 'Audience', ['Coaches', 'Parents', 'Everyone']], ['topic', 'Topic']],
    support: [['kind', 'Kind', ['Contact', 'Guide']], ['title', 'Title'], ['detail', 'Details', 'text']],
    pages: [['title', 'Page title'], ['path', 'Web address'], ['summary', 'What is on the page', 'text']],
    offers: [['title', 'Title'], ['group', 'Age group'], ['when', 'When'], ['venue', 'Venue'], ['price', 'Price (£)', 'money'], ['unit', 'Charged', ['a month', 'a session', 'a day', 'a term']]],
    guide: [['title', 'Title'], ['body', 'Guidance', 'text']]
  };
  var CT_WORD = { resources: 'resource', support: 'support item', pages: 'page', offers: 'offer', guide: 'guide section' };
  Hub.screens['mgmt-content'] = function (ctx) {
    var tabs = CT_TABS.map(function (t) { return { id: t.id, label: t.label, meta: db.contentList(t.id).length + '' }; });
    var h = K.head({ back: ['mgmt-more', 'More'], eyebrow: 'Content & Brand', title: 'Content', sub: 'Library items, coach support, public pages and what we offer. Drafts are never shown outside Management.',
      actions: K.goBtn('Organisation & branding', 'mgmt-settings', { variant: 'secondary', icon: 'star' }), tabs: ctx.state === 'live' ? K.tabs('st-ct', tabs) : '' });
    var g = K.guard(ctx, h, { empty: ['book', 'No content yet', 'Add resources and pages here; they appear in the hubs once published.'] }); if (g) return g;
    var kind = K.tab('st-ct', tabs), list = kind === 'offers' ? db.getOfferContent() : db.contentList(kind);
    var add = '<div class="k-bar">' + K.actBtn('Add ' + CT_WORD[kind], 'st-ct-edit', { kind: kind, id: '' }, { variant: 'primary', size: 'sm', icon: 'plus' }) + '<span class="k-bar__spacer"></span>' +
      (kind === 'offers' ? K.link('pub-offers', 'See the public page') : kind === 'resources' ? '<span class="k-note">Coaches see Coaches + Everyone; parents see Parents + Everyone.</span>' : '') + '</div>';
    function acts(x) {
      var pub = x.status === 'Published';
      return '<span class="k-row-actions">' + (kind === 'offers' ? K.actBtn('', 'st-offer-move', { id: x.id, dir: -1 }, { size: 'sm', variant: 'tertiary', icon: 'chevronDown', cls: 'st-up', attrs: { 'aria-label': 'Move up' } }) + K.actBtn('', 'st-offer-move', { id: x.id, dir: 1 }, { size: 'sm', variant: 'tertiary', icon: 'chevronDown', attrs: { 'aria-label': 'Move down' } }) : '') +
        K.actBtn('Edit', 'st-ct-edit', { kind: kind, id: x.id }, { size: 'sm', variant: 'tertiary' }) +
        (kind === 'guide' ? '' : K.actBtn(pub ? 'Unpublish' : 'Publish', 'st-ct-status', { kind: kind, id: x.id }, { size: 'sm', variant: pub ? 'secondary' : 'primary' })) + '</span>';
    }
    var body;
    if (kind === 'guide') {
      body = '<div class="lx-stack">' + list.map(function (x) { return K.card({ title: x.title, right: acts(x), body: '<p class="st-p">' + esc(x.body) + '</p>' + K.stamp('Updated', x.updatedBy, x.updatedAt) }); }).join('') + '</div>';
    } else {
      var spec = {
        resources: { head: ['Item', 'Audience', 'Updated', { label: '', cls: 'c-end' }], cell: function (x) { return [K.cell(esc(x.title), esc(x.type) + ' · ' + esc(x.topic) + ' · ' + st(x.status)), esc(x.audience), K.stamp('Updated', x.updatedBy, x.updatedAt)]; } },
        support: { head: ['Item', 'Kind', 'Updated', { label: '', cls: 'c-end' }], cell: function (x) { return [K.cell(esc(x.title), esc(x.detail)), esc(x.kind) + ' · ' + st(x.status), K.stamp('Updated', x.updatedBy, x.updatedAt)]; } },
        pages: { head: ['Page', 'Address', 'Updated', { label: '', cls: 'c-end' }], cell: function (x) { return [K.cell(esc(x.title) + ' ' + st(x.status), esc(x.summary)), '<span class="mono">' + esc(x.path) + '</span>', K.stamp('Updated', x.updatedBy, x.updatedAt)]; } },
        offers: { head: ['Offer', 'Price', 'Updated', { label: '', cls: 'c-end' }], cell: function (x) { return [K.cell(esc(x.title) + ' ' + st(x.status), esc(x.group) + ' · ' + esc(x.when) + ' · ' + esc(x.venue)), '<span class="num">' + K.money(x.price) + '</span> ' + esc(x.unit), K.stamp('Updated', x.updatedBy, x.updatedAt)]; } }
      }[kind];
      body = tbl({ cols: 'minmax(0, 2fr) minmax(0, .9fr) minmax(0, 1.2fr) minmax(0, ' + (kind === 'offers' ? '250px' : '170px') + ')', head: spec.head, empty: 'Nothing here yet.',
        rows: list.map(function (x) { return { cells: spec.cell(x).concat([{ cls: 'c-end', html: acts(x) }]) }; }) });
    }
    return K.page(h, add + body);
  };
  A['st-ct-edit'] = function (el) {
    var kind = el.dataset.kind, x = el.dataset.id ? db.getContentItem(kind, el.dataset.id) : {};
    var fields = CT_FORM[kind].map(function (f) {
      var v = x[f[0]], ctl = Array.isArray(f[2]) ? K.select('ct-' + f[0], f[2], v || f[2][0]) : f[2] === 'text' ? K.textarea('ct-' + f[0], v) : K.input('ct-' + f[0], f[2] === 'money' ? (v != null ? (v / 100).toFixed(2) : '') : v, f[2] === 'money' ? { type: 'number' } : {});
      return K.field(f[1], ctl, '', f[2] === 'text');
    });
    K.sheet({ overline: '<span class="overline">Content</span>', title: x.id ? 'Edit ' + esc(x.title) : 'Add ' + CT_WORD[kind], body: K.form(fields, 2) + (x.id ? '<p class="k-note st-gap">' + K.stamp('Last updated', x.updatedBy, x.updatedAt) + '</p>' : '<p class="k-note st-gap">New items start as drafts.</p>'),
      foot: sheetFoot(x.id ? 'Save changes' : 'Add as draft', 'st-ct-save', { kind: kind, id: x.id || '' }) });
  };
  A['st-ct-save'] = function (el) {
    var kind = el.dataset.kind, item = { id: el.dataset.id || null };
    CT_FORM[kind].forEach(function (f) { var v = K.val('ct-' + f[0]); item[f[0]] = f[2] === 'money' ? Math.round(parseFloat(v || '0') * 100) : v.trim(); });
    if (!item.title) { Hub.toast('Add a title'); return; }
    var at = K.now(); Hub.closeSheet(true);
    Hub.mutate(function () { db.saveContentItem(kind, item, me(), at); }, (el.dataset.id ? 'Saved ' : 'Added as draft: ') + item.title, { area: 'Content', summary: (el.dataset.id ? 'Content edited: ' : 'Content added: ') + item.title, entity: el.dataset.id || CT_WORD[kind], at: at });
  };
  A['st-ct-status'] = function (el) {
    var x = db.getContentItem(el.dataset.kind, el.dataset.id), to = x.status === 'Published' ? 'Draft' : 'Published', at = K.now();
    Hub.mutate(function () { db.setContentStatus(el.dataset.kind, x.id, to, me(), at); }, (to === 'Published' ? 'Published: ' : 'Unpublished: ') + x.title, { area: 'Content', summary: (to === 'Published' ? 'Published ' : 'Unpublished ') + x.title, entity: x.id, before: x.status, after: to, at: at });
  };
  A['st-offer-move'] = function (el) {
    var x = db.getContentItem('offers', el.dataset.id), at = K.now();
    Hub.mutate(function () { db.moveOffer(x.id, +el.dataset.dir, me(), at); }, x.title + ' moved', { area: 'Content', summary: 'What we offer order changed: ' + x.title, entity: x.id, at: at });
  };

  /* =================================================== COMMUNICATIONS */
  Hub.screens['mgmt-comms'] = function (ctx) {
    var on = K.feature('communications');
    var h = K.head({ back: ['mgmt-more', 'More'], eyebrow: 'Communications', title: 'Communications', sub: 'Notices and messages to families and coaches, with a full history of what was sent.',
      actions: on ? K.actBtn('New notice', 'st-notice-new', {}, { variant: 'primary', icon: 'plus' }) : '' });
    var g = K.guard(ctx, h, { empty: ['comms', 'Nothing sent yet', 'Notices and messages appear here once sent.'] }); if (g) return g;
    var notices = db.getNotices(), tpl = db.getMessageTemplates();
    var stats = K.stats([{ label: 'Sent', value: notices.filter(function (n) { return n.status === 'Sent'; }).length }, { label: 'Scheduled', value: notices.filter(function (n) { return n.status === 'Scheduled'; }).length }, { label: 'Templates', value: tpl.length }, { label: 'Audiences', value: 2, sub: 'Parents and coaches' }]);
    var list = K.card({ title: 'Notices', sub: 'Shown in the Parent and Coach hubs', body: K.list(notices.map(function (n) {
      return ui.row({ lead: '<span class="row__icon">' + I('megaphone', 'icon-sm') + '</span>', title: esc(n.title), sub: [esc(n.audience), n.status === 'Scheduled' ? 'Sends ' + K.dt(n.sendAt) : null, K.stamp(n.status === 'Sent' ? 'Sent' : 'Scheduled', n.by, n.at)], after: '<p class="st-p st-p--sm">' + esc(n.body) + '</p>', trail: st(n.status) });
    })) });
    var templates = K.card({ title: 'Message templates', body: K.list(tpl.map(function (t) { return ui.row({ lead: '<span class="row__icon">' + I('chat', 'icon-sm') + '</span>', title: esc(t.title), sub: [esc(t.audience), K.stamp('Updated', t.updatedBy, t.updatedAt)] }); })) });
    var content = stats + K.grid([list, templates], '21');
    return K.page(h, on ? content : K.featureOff('communications') + '<div class="st-disabled" aria-disabled="true" inert><p class="st-disabled__k">' + I('shield', 'icon-sm') + 'Preview: what this area contains when switched on</p>' + content + '</div>');
  };
  A['st-notice-new'] = function () {
    K.sheet({ overline: '<span class="overline">Communications</span>', title: 'New notice', body: K.form([K.field('Title', K.input('nt-title', '')), K.field('Audience', K.select('nt-aud', ['Parents', 'Coaches', 'Everyone'], 'Parents')), K.field('Message', K.textarea('nt-body', ''), '', true)], 2),
      foot: sheetFoot('Send notice', 'st-notice-send') });
  };
  A['st-notice-send'] = function () {
    var title = K.val('nt-title').trim(); if (!title) { Hub.toast('Add a title'); return; }
    var at = K.now(), n = { title: title, body: K.val('nt-body').trim(), audience: K.val('nt-aud'), sessions: [], status: 'Sent', by: me(), at: at };
    Hub.closeSheet(true);
    Hub.mutate(function () { db.addNotice(n); }, 'Notice sent to ' + n.audience.toLowerCase(), { area: 'Communications', summary: 'Notice sent: ' + title, after: n.audience, at: at });
  };

  /* ========================================= ORGANISATION & BRANDING */
  var draft = null;
  function brandDraft() {
    var id = Hub.state.brand, b = Hub.brands[id];
    if (!draft || draft.brand !== id) draft = { brand: id, orgName: b.orgName, orgFull: b.orgFull || '', identity: b.identity, accent: b.accent, fill: b.fill, onFill: b.onFill, org: Object.assign({}, db.getOrgSettings(id)) };
    return draft;
  }
  function inkOn(hex) { var h = hex.replace('#', ''), n = parseInt(h, 16), r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255; return (0.299 * r + 0.587 * gg + 0.114 * b) / 255 > 0.6 ? '#0b0b0b' : '#ffffff'; }
  function readBrandInputs() {
    var d = brandDraft();
    if (!document.querySelector('[name="br-orgName"]')) return d;
    d.orgName = K.val('br-orgName'); d.orgFull = K.val('br-orgFull');
    ['tagline', 'website', 'supportEmail', 'domain'].forEach(function (k) { d.org[k] = K.val('br-' + k); });
    d.org.timezone = K.val('br-timezone') || d.org.timezone;
    return d;
  }
  function brandPreview(d) {
    var mark = d.org.logo && d.org.logo !== 'uploaded' ? '<img src="' + esc(d.org.logo) + '" alt="">' : '<span>' + esc(ui.initials(d.orgName)) + '</span>';
    return '<div class="st-bp" style="--bp-id:' + d.identity + ';--bp-acc:' + d.accent + ';--bp-fill:' + d.fill + ';--bp-on:' + d.onFill + '">' +
      '<div class="st-bp__bar"><span class="st-bp__mark">' + mark + '</span><span class="st-bp__name"><b data-bp="orgName">' + esc(d.orgName) + '</b><small data-bp="orgFull">' + esc(d.orgFull || d.orgName) + '</small></span></div>' +
      '<div class="st-bp__body"><span class="st-bp__k">Parent hub</span><h3>Welcome to <span data-bp="orgName">' + esc(d.orgName) + '</span></h3><p data-bp="tagline">' + esc(d.org.tagline) + '</p>' +
      '<div class="st-bp__row"><span class="st-bp__btn">Book a session</span><span class="st-bp__link">View timetable</span><span class="st-bp__pill">Confirmed</span></div>' +
      '<p class="st-bp__foot"><span data-bp="website">' + esc(d.org.website) + '</span> · <span data-bp="supportEmail">' + esc(d.org.supportEmail) + '</span></p></div></div>';
  }
  Hub.screens['mgmt-settings'] = function (ctx) {
    var bid = Hub.state.brand, org = db.getOrgSettings(bid);
    var h = K.head({ back: ['mgmt-more', 'More'], eyebrow: 'Settings & System', title: 'Organisation & branding', sub: 'Your name, logo, colours and contact details. Saving applies them across every hub straight away.',
      actions: K.actBtn('Reset to default', 'st-brand-reset', {}, { variant: 'tertiary', icon: 'refresh' }) + K.actBtn('Save changes', 'st-brand-save', {}, { variant: 'primary', icon: 'check' }) });
    var g = K.guard(ctx, h, { empty: ['settings', 'No organisation details yet', 'Add your name and colours to brand the Hub.'] }); if (g) return g;
    var d = brandDraft(), pre = db.getColourPresets();
    var details = K.card({ title: 'Organisation', sub: 'Shown in headers, emails and the public site', body: K.form([
      K.field('Short name', '<input class="input" name="br-orgName" data-bpi="orgName" value="' + esc(d.orgName) + '">'),
      K.field('Full name', '<input class="input" name="br-orgFull" data-bpi="orgFull" value="' + esc(d.orgFull) + '">'),
      K.field('Tagline', '<input class="input" name="br-tagline" data-bpi="tagline" value="' + esc(d.org.tagline) + '">', '', true),
      K.field('Website', '<input class="input" name="br-website" data-bpi="website" value="' + esc(d.org.website) + '">'),
      K.field('Support email', '<input class="input" name="br-supportEmail" data-bpi="supportEmail" value="' + esc(d.org.supportEmail) + '">'),
      K.field('Hub address', '<input class="input" name="br-domain" value="' + esc(d.org.domain) + '">', 'Where coaches and families sign in.'),
      K.field('Time zone', '<select class="select" name="br-timezone" data-st="brand-tz">' + db.getTimezones().map(function (z) { return '<option' + (z === d.org.timezone ? ' selected' : '') + '>' + z + '</option>'; }).join('') + '</select>')
    ], 2) });
    var logo = K.card({ title: 'Logo', sub: 'Square image, at least 256 × 256', body: '<div class="st-logo"><span class="st-logo__box">' + (d.org.logo && d.org.logo !== 'uploaded' ? '<img src="' + esc(d.org.logo) + '" alt="Current logo">' : '<b>' + esc(ui.initials(d.orgName)) + '</b>') + '</span>' +
      '<div class="st-logo__text"><b>' + (d.org.logo ? (d.org.logo === 'uploaded' ? 'new-logo.png (ready to save)' : 'Current logo') : 'No logo: initials are used') + '</b><small>PNG or SVG, up to 2 MB.</small><div class="k-bar">' +
      K.actBtn(d.org.logo ? 'Replace' : 'Upload logo', 'st-brand-logo', { op: 'up' }, { size: 'sm', variant: 'secondary', icon: 'download', cls: 'st-flipicon' }) + (d.org.logo ? K.actBtn('Remove', 'st-brand-logo', { op: 'rm' }, { size: 'sm', variant: 'tertiary' }) : '') + '</div></div></div>' });
    function colourRow(slot, title, help) {
      return '<div class="st-colour"><div class="st-colour__k"><b>' + esc(title) + '</b><small>' + esc(help) + '</small></div><div class="st-pal" role="group" aria-label="' + esc(title) + '">' +
        pre[slot].map(function (p) { return '<button type="button" class="st-pal__c st-pal__c--lg' + (p[1].toLowerCase() === String(d[slot]).toLowerCase() ? ' is-on' : '') + '" style="--sw:' + p[1] + '" data-action="st-brand-colour" data-slot="' + slot + '" data-color="' + p[1] + '" aria-label="' + esc(p[0]) + '" aria-pressed="' + (p[1].toLowerCase() === String(d[slot]).toLowerCase()) + '" title="' + esc(p[0]) + '"></button>'; }).join('') +
        '<span class="st-hex mono">' + esc(d[slot]) + '</span></div></div>';
    }
    var colours = K.card({ title: 'Colours', sub: 'Pick from presets. Relvor adjusts contrast so text always stays readable.', body: colourRow('identity', 'Identity', 'Headers and dark surfaces') + colourRow('accent', 'Accent', 'Links, highlights and selected items') + colourRow('fill', 'Button fill', 'Primary buttons') });
    var preview = '<div class="st-sticky">' + K.card({ title: 'Live preview', sub: 'Updates as you type. Nothing changes for others until you save.', body: brandPreview(d) }) +
      K.card({ title: 'Changes', body: K.stamp('Last saved', org.updatedBy, org.updatedAt) + '<div class="st-gap">' + K.timeline(db.getBrandHistory().slice(0, 4)) + '</div>' }) + '</div>';
    var more = K.section('Settings & System', 'Other organisation settings', K.tiles([
      { route: 'mgmt-labels', icon: 'swap', title: 'Hub Settings: labels', desc: 'Rename words like ' + K.label('IDP') + ' everywhere.' },
      { route: 'mgmt-features', icon: 'settings', title: 'Feature controls', desc: 'Switch whole areas on or off.' },
      { route: 'mgmt-content', icon: 'book', title: 'Content', desc: 'Resources, public pages and what we offer.' },
      { route: 'mgmt-fin-settings', icon: 'finance', title: 'Finance settings', desc: 'Legal name, VAT and invoice numbering.' },
      { route: 'mgmt-fin-access', icon: 'shield', title: 'Finance access', desc: 'Who can see and manage money.' },
      { route: 'mgmt-fin-integrations', icon: 'link', title: 'Integrations', desc: 'Accounting and payment connections.' }
    ], 3));
    return K.page(h, '<div class="k-grid k-grid--21"><div class="lx-stack">' + details + logo + colours + '</div>' + preview + '</div>' + more);
  };
  document.addEventListener('input', function (e) {
    var k = e.target.dataset && e.target.dataset.bpi; if (!k) return;
    var d = brandDraft(), v = e.target.value;
    if (k === 'orgName' || k === 'orgFull') d[k] = v; else d.org[k] = v;
    document.querySelectorAll('[data-bp="' + k + '"]').forEach(function (n) { n.textContent = v || (k === 'orgFull' ? d.orgName : ''); });
    if (k === 'orgName') document.querySelectorAll('.st-bp__mark > span, .st-logo__box > b').forEach(function (n) { n.textContent = ui.initials(v); });
  });
  A['st-brand-colour'] = function (el) {
    var d = readBrandInputs(); d[el.dataset.slot] = el.dataset.color; if (el.dataset.slot === 'fill') d.onFill = inkOn(el.dataset.color);
    Hub.render();
  };
  A['st-brand-logo'] = function (el) { var d = readBrandInputs(); d.org.logo = el.dataset.op === 'up' ? 'uploaded' : null; Hub.render(); Hub.toast(el.dataset.op === 'up' ? 'Logo ready: save to apply' : 'Logo removed: save to apply'); };
  A['st-brand-save'] = function () {
    var d = readBrandInputs(), at = K.now(), b = Hub.brands[d.brand], before = b.orgName + ' · ' + b.accent;
    if (!d.orgName.trim()) { Hub.toast('The organisation needs a name'); return; }
    var org = Object.assign({}, d.org); if (org.logo === 'uploaded') org.logo = db.getOrgSettings(d.brand).logo || null;
    Hub.mutate(function () { db.saveOrgSettings(d.brand, { orgName: d.orgName.trim(), orgFull: d.orgFull.trim() || undefined, identity: d.identity, accent: d.accent, fill: d.fill, onFill: d.onFill }, org, me(), at); draft = null; },
      'Branding saved and applied', { area: 'Settings', summary: 'Organisation and branding saved', before: before, after: d.orgName + ' · ' + d.accent, at: at });
  };
  A['st-brand-reset'] = function () {
    K.confirm({ overline: '<span class="overline">Organisation & branding</span>', title: 'Reset branding to default?', body: '<p class="k-note">Name, colours, tagline and contact details go back to how they were set up. This is recorded in the history.</p>', label: 'Reset to default', action: 'st-brand-reset-go', danger: true });
  };
  A['st-brand-reset-go'] = function () {
    var at = K.now(), id = Hub.state.brand; Hub.closeSheet(true);
    Hub.mutate(function () { db.resetBrand(id, me(), at); draft = null; }, 'Branding reset to default', { area: 'Settings', summary: 'Branding reset to default', at: at });
  };

  /* ===================================================== LABELS */
  var LABEL_KEYS = ['IDP', 'IDPs', 'Development plan'];
  var LABEL_PRESETS = [
    { name: 'Default', map: { IDP: 'IDP', IDPs: 'IDPs', 'Development plan': 'Development plan' } },
    { name: 'Targets', map: { IDP: 'Targets', IDPs: 'Targets', 'Development plan': 'Targets' } },
    { name: 'Player plan', map: { IDP: 'Player plan', IDPs: 'Player plans', 'Development plan': 'Player plan' } }
  ];
  Hub.screens['mgmt-labels'] = function (ctx) {
    var h = K.head({ back: ['mgmt-settings', 'Settings'], eyebrow: 'Hub Settings', title: 'Labels', sub: 'Rename the words the Hub uses. Changes appear everywhere straight away: Management, Coach and Parent hubs.' });
    var g = K.guard(ctx, h, { empty: ['swap', 'No labels to rename', 'Renamable labels appear here.'] }); if (g) return g;
    var uses = db.getLabelUses();
    var form = K.card({ title: 'Rename', sub: 'Singular, plural and the longer name', body: K.form(LABEL_KEYS.map(function (k, i) { return K.field('“' + k + '” is called', K.input('lb-' + i, K.label(k)), 'Used in: ' + esc(uses[k].join(', '))); }), 1) +
      '<div class="k-bar st-gap">' + K.actBtn('Save labels', 'st-labels-save', {}, { variant: 'primary', size: 'sm' }) + '<span class="k-bar__spacer"></span><span class="k-note">Quick presets:</span>' +
      LABEL_PRESETS.map(function (p, i) { return K.actBtn(p.name, 'st-labels-preset', { i: i }, { size: 'sm', variant: 'secondary' }); }).join('') + '</div>' });
    var live = K.card({ title: 'See it in place', sub: 'These read from the labels right now', body: K.list([
      ui.row({ lead: I('development', 'row-glyph'), title: esc(K.label('IDPs')), sub: ['Management → Development'], href: '#mgmt-idps' }),
      ui.row({ lead: I('star', 'row-glyph'), title: esc(pname('PLY-0001')) + ' · ' + esc(K.label('IDP')), sub: [esc(K.label('IDP')) + ' detail page'], href: '#mgmt-idps/IDP-001' }),
      ui.row({ lead: I('family', 'row-glyph'), title: esc(K.label('Development plan')), sub: ['Parent hub → Development'], href: '#parent-development' }),
      ui.row({ lead: I('whistle', 'row-glyph'), title: esc(K.label('IDP')) + ' for ' + esc(pname('PLY-0001')), sub: ['Coach hub → player'], href: '#coach-idp/PLY-0001' })
    ]) });
    var hist = K.card({ title: 'History', body: K.timeline(db.getLabelHistory()) });
    return K.page(h, K.grid([form + hist, live], '21'));
  };
  function saveLabels(map, toast) {
    var at = K.now(), changed = db.setLabels(map, me(), at);
    if (!changed.length) { Hub.toast('No labels changed'); return; }
    Hub.mutate(null, toast, { area: 'Settings', summary: 'Labels renamed', before: changed.map(function (c) { return c.split(': ')[1].split(' → ')[0]; }).join(', '), after: changed.map(function (c) { return c.split(' → ')[1]; }).join(', '), at: at });
  }
  A['st-labels-save'] = function () { var map = {}; LABEL_KEYS.forEach(function (k, i) { map[k] = K.val('lb-' + i).trim(); }); saveLabels(map, 'Labels saved'); };
  A['st-labels-preset'] = function (el) { var p = LABEL_PRESETS[+el.dataset.i]; saveLabels(Object.assign({}, p.map), 'Labels set to ' + p.name); };

  /* ================================================ FEATURE CONTROLS */
  var FEATURE_ROUTE = { communications: 'mgmt-comms', sessionRequests: 'mgmt-session-requests', bookings: 'mgmt-bookings', cover: 'mgmt-cover', development: 'mgmt-development', finance: 'mgmt-finance', registers: 'mgmt-registers', trials: 'mgmt-trial-leads', packages: 'mgmt-commercial', discounts: 'mgmt-adjustments', documents: 'mgmt-documents', publicSite: 'pub-home' };
  Hub.screens['mgmt-features'] = function (ctx) {
    var keys = Object.keys(Hub.featureInfo), on = keys.filter(function (k) { return K.feature(k); }).length;
    var h = K.head({ back: ['mgmt-settings', 'Settings'], eyebrow: 'Hub Settings', title: 'Feature controls', sub: 'Turn whole areas on or off for this organisation. Switched-off areas stay visible but disabled, so nothing is lost.' });
    var g = K.guard(ctx, h, { empty: ['settings', 'No features to control', 'Features appear here once the Hub is set up.'] }); if (g) return g;
    var rows = keys.map(function (k) {
      var log = db.getFeatureLog(k), isOn = K.feature(k);
      return '<div class="st-feat"><div class="st-feat__main">' + K.toggle(isOn, 'st-feature', { key: k }, Hub.featureInfo[k]) +
        '<div class="st-feat__meta">' + (log ? K.stamp('Switched ' + (log.on ? 'on' : 'off'), log.by, log.at) : '<span class="k-note">Changed from the prototype bar</span>') + (log && log.note ? '<span class="k-note">' + esc(log.note) + '</span>' : '') + '</div></div>' +
        '<div class="st-feat__end">' + P(isOn ? 'On' : 'Off', isOn ? 'ok' : '') + K.link(FEATURE_ROUTE[k], 'Open area') + '</div></div>';
    }).join('');
    return K.page(h, K.stats([{ label: 'Switched on', value: on }, { label: 'Switched off', value: keys.length - on }]) +
      K.card({ title: 'Features', sub: 'Same switches as the prototype bar’s Feature switches panel', body: '<div class="st-feats">' + rows + '</div>' }));
  };
  A['st-feature'] = function (el) {
    var k = el.dataset.key, to = !K.feature(k), at = K.now();
    Hub.mutate(function () { db.setFeature(k, to, me(), at); }, Hub.featureInfo[k] + (to ? ' switched on' : ' switched off'), { area: 'Settings', summary: 'Feature ' + Hub.featureInfo[k] + ' switched ' + (to ? 'on' : 'off'), entity: k, before: to ? 'Off' : 'On', after: to ? 'On' : 'Off', at: at });
  };

  /* ========================================================= REPORTS */
  function septReport() {
    var occ = db.getOccurrences(function (o) { return o.date.slice(0, 7) === '2026-09'; });
    var res = { total: occ.length, delivered: 0, cancelled: 0, rescheduled: 0, regDone: 0, regDue: 0, present: 0, marks: 0, hcExpected: 0, hcActual: 0, bySession: {} };
    occ.forEach(function (o) {
      var s = res.bySession[o.sessionId] || (res.bySession[o.sessionId] = { id: o.sessionId, name: o.session, delivered: 0, cancelled: 0, rescheduled: 0, regDone: 0, regDue: 0, present: 0, marks: 0 });
      if (o.status === 'Completed') { res.delivered++; s.delivered++; }
      else if (o.status === 'Cancelled') { res.cancelled++; s.cancelled++; }
      else if (o.status === 'Rescheduled') { res.rescheduled++; s.rescheduled++; }
      if (o.status !== 'Completed') return;
      var r = db.getRegister(o.id); res.regDue++; s.regDue++;
      if (r.state === 'Completed') { res.regDone++; s.regDone++; }
      if (r.headcount) { res.hcExpected += r.headcount.expected; res.hcActual += r.headcount.actual; }
      Object.keys(r.marks || {}).forEach(function (p) { var m = r.marks[p].mark; res.marks++; s.marks++; if (m === 'Present' || m === 'Late') { res.present++; s.present++; } });
    });
    return res;
  }
  function pct(a, b) { return b ? Math.round(a / b * 100) + '%' : '—'; }
  Hub.screens['mgmt-reports'] = function (ctx) {
    var h = K.head({ back: ['mgmt-more', 'More'], eyebrow: 'Reports', title: 'Reports', sub: 'Operational reporting for September 2026, worked out from sessions and registers.',
      actions: K.goBtn('Finance reports', 'mgmt-fin-reports', { variant: 'secondary', icon: 'finance' }) });
    var g = K.guard(ctx, h, { empty: ['grid', 'No reporting data yet', 'Reports fill in once sessions have been delivered.'] }); if (g) return g;
    var r = septReport();
    var stats = K.stats([
      { label: 'Attendance', value: pct(r.present, r.marks), sub: r.present + ' of ' + r.marks + ' marks present or late', route: 'mgmt-attendance' },
      { label: 'Registers completed', value: pct(r.regDone, r.regDue), sub: r.regDone + ' of ' + r.regDue + ' delivered sessions', route: 'mgmt-registers', tone: r.regDone < r.regDue ? 'warn' : '' },
      { label: 'Sessions delivered', value: r.delivered, sub: 'of ' + r.total + ' scheduled in September', route: 'mgmt-occurrences' },
      { label: 'Cancelled or moved', value: r.cancelled + r.rescheduled, sub: r.cancelled + ' cancelled · ' + r.rescheduled + ' rescheduled', route: 'mgmt-occurrences', tone: r.cancelled ? 'warn' : '' }
    ]);
    var sessions = Object.keys(r.bySession).sort().map(function (k) { return r.bySession[k]; });
    var body = tbl({ cols: 'minmax(0, 1.8fr) minmax(0, .8fr) minmax(0, .8fr) minmax(0, .9fr) minmax(0, 110px)', head: ['Session', { label: 'Delivered', cls: 'c-num' }, { label: 'Cancelled / moved', cls: 'c-num' }, { label: 'Registers', cls: 'c-num' }, { label: 'Attendance', cls: 'c-num' }],
      rows: sessions.map(function (s) { return { route: 'mgmt-session/' + s.id, label: 'Open ' + s.name, cells: [K.cell(esc(s.name), K.id(s.id)), { cls: 'c-num', html: String(s.delivered) }, { cls: 'c-num', html: String(s.cancelled + s.rescheduled) }, { cls: 'c-num', html: s.regDone + '/' + s.regDue }, { cls: 'c-num', html: s.marks ? pct(s.present, s.marks) : '<span class="c-mute">Headcount</span>' }] }; }),
      foot: '<span>Schools sessions use headcounts: <b class="num">' + r.hcActual + ' of ' + r.hcExpected + '</b> expected (' + pct(r.hcActual, r.hcExpected) + ').</span>' + K.link('mgmt-attendance', 'Attendance detail') });
    var fbAll = db.getFeedback().filter(function (f) { return f.period === 'September 2026'; }), period = db.getCurrentReviewPeriod(), idps = db.getIdps(null, period.id);
    var dev = K.card({ title: 'Development', sub: 'September feedback and ' + esc(period.name) + ' ' + esc(K.label('IDPs')), body: K.kv([
      ['Feedback published', '<span class="num">' + fbAll.filter(function (f) { return f.status === 'Published'; }).length + ' of ' + fbAll.length + '</span>'],
      ['Awaiting review', '<span class="num">' + db.getFeedbackAwaitingReview().length + '</span> ' + K.link('mgmt-feedback-review', 'Review')],
      [K.label('IDPs') + ' shared', '<span class="num">' + idps.filter(function (i) { return i.status === 'Shared with family'; }).length + ' of ' + idps.length + '</span>'],
      [K.label('IDPs') + ' not started', '<span class="num">' + db.getIdpsNotStarted().length + '</span> ' + K.link('mgmt-idps', 'Open')]
    ], true) });
    var links = K.tiles([
      { route: 'mgmt-attendance', icon: 'userCheck', title: 'Attendance', desc: 'Per player and per session attendance.' },
      { route: 'mgmt-registers', icon: 'check', title: 'Registers', desc: 'Completion and missing registers.' },
      { route: 'mgmt-fin-reports', icon: 'finance', title: 'Finance reports', desc: 'Revenue, costs and profit by session.' }
    ], 3);
    return K.page(h, stats + K.section('By session', 'September 2026', body) + K.grid([dev, K.card({ title: 'How these are worked out', body: '<p class="st-p">Delivered counts completed sessions. Registers count as complete once a coach finishes them. Attendance counts Present and Late marks against all marks in completed registers; schools sessions use headcounts instead.</p>' })], 2) + K.section('More reports', '', links));
  };

  /* ========================================================= PROFILE */
  Hub.screens['mgmt-profile'] = function (ctx) {
    var p = db.getProfile();
    var h = K.head({ back: ['mgmt-more', 'More'], eyebrow: 'Account', title: 'Profile', sub: 'Your details, sign-in and which hubs you can use.', actions: K.actBtn('Edit details', 'st-profile-edit', {}, { variant: 'secondary' }) });
    var g = K.guard(ctx, h, { empty: ['user', 'Profile unavailable', 'Your details appear here once your account is set up.'] }); if (g) return g;
    var grant = db.getFinanceGrants().filter(function (x) { return x.person === p.name; })[0];
    var coach = db.getCoach('david') || {};
    var who = '<div class="st-who">' + ui.avatar(p.name, 'lg') + '<div><b>' + esc(p.name) + '</b><small>' + esc(p.jobTitle) + ' · ' + esc(p.roleLabel) + '</small></div></div>';
    var details = K.card({ title: 'Details', body: who + K.kv([['Email', esc(p.email)], ['Phone', esc(p.phone)], ['Job title', esc(p.jobTitle)], ['Coach code', K.id(coach.code || '—')], ['Started', K.d(coach.started)], ['Last sign-in', K.dt(p.lastSignIn)]], true) });
    var security = K.card({ title: 'Sign-in and security', body: K.kv([['Password', K.stamp('Changed', p.name, p.passwordChangedAt)], ['Two-step verification', p.twoStep ? P('On', 'ok') : P('Off', 'warn')]], true) + '<div class="k-bar st-gap">' + K.actBtn('Change password', 'st-pw', {}, { variant: 'secondary', size: 'sm', icon: 'shield' }) + '</div>' });
    var access = K.card({ title: 'Hub access', sub: 'Granted by Josh Evans', body: K.list([
      ui.row({ lead: I('home', 'row-glyph'), title: 'Management hub', sub: ['Full Management access'], trail: P('Access', 'ok') }),
      ui.row({ lead: I('whistle', 'row-glyph'), title: Hub.brand.terms.staff + ' hub', sub: ['Lead ' + Hub.brand.terms.staff.toLowerCase()], trail: P('Access', 'ok'), action: 'area', data: { area: 'staff' } }),
      ui.row({ lead: I('finance', 'row-glyph'), title: 'Finance', sub: grant ? [K.stamp('Granted', grant.grantedBy, grant.at)] : ['No finance access'], trail: P(grant ? grant.access : 'None', grant && grant.access === 'Manage' ? 'ok' : ''), href: '#mgmt-fin-access' })
    ]) });
    return K.page(h, K.grid(['<div class="lx-stack">' + details + security + '</div>', access], 2));
  };
  A['st-profile-edit'] = function () {
    var p = db.getProfile();
    K.sheet({ overline: '<span class="overline">Profile</span>', title: 'Edit details', body: K.form([K.field('Phone', K.input('pf-phone', p.phone)), K.field('Job title', K.input('pf-title', p.jobTitle)), K.field('Email', K.input('pf-email', p.email, { readonly: true }), 'Ask the Director to change your sign-in email.', true)], 2), foot: sheetFoot('Save details', 'st-profile-save') });
  };
  A['st-profile-save'] = function () {
    var at = K.now(), patch = { phone: K.val('pf-phone').trim(), jobTitle: K.val('pf-title').trim() }; Hub.closeSheet(true);
    Hub.mutate(function () { db.updateProfile(patch); }, 'Details saved', { area: 'Account', summary: 'Profile details updated', at: at, restricted: true });
  };
  A['st-pw'] = function () {
    K.sheet({ overline: '<span class="overline">Sign-in and security</span>', title: 'Change password', body: K.steps(['Current password', 'New password', 'Done'], 0) + '<div class="st-gap">' + K.form([K.field('Current password', K.input('pw-cur', '', { type: 'password' }), '', true), K.field('New password', K.input('pw-new', '', { type: 'password' }), 'At least 10 characters.'), K.field('Confirm new password', K.input('pw-new2', '', { type: 'password' }))], 2) + '</div>',
      foot: sheetFoot('Change password', 'st-pw-go') });
  };
  A['st-pw-go'] = function () {
    var cur = K.val('pw-cur'), a = K.val('pw-new'), b = K.val('pw-new2');
    if (!cur) { Hub.toast('Enter your current password'); return; }
    if (a.length < 10) { Hub.toast('New password needs at least 10 characters'); return; }
    if (a !== b) { Hub.toast('The new passwords do not match'); return; }
    var at = K.now();
    db.changePassword(me(), at); K.log({ area: 'Account', summary: 'Password changed', at: at, restricted: true });
    K.sheet({ overline: '<span class="overline">Sign-in and security</span>', title: 'Password changed', body: K.steps(['Current password', 'New password', 'Done'], 2) + '<div class="st-gap">' + ui.notice('ok', 'Your password has been changed', 'Other devices are signed out. ' + K.stamp('Changed', me(), at)) + '</div>', foot: ui.btn('Done', { variant: 'primary', attrs: { 'data-action': 'st-pw-done' } }) });
  };
  A['st-pw-done'] = function () { Hub.closeSheet(true); Hub.render(); Hub.toast('Password changed'); };

  /* =================================================== NOTIFICATIONS */
  Hub.screens['mgmt-notifications'] = function (ctx) {
    var all = db.getNotifications('management'), unread = all.filter(function (n) { return !n.read; });
    var tabs = [{ id: 'all', label: 'All', meta: all.length + '' }, { id: 'unread', label: 'Unread', meta: unread.length + '', state: unread.length ? 'Warning' : null }];
    var h = K.head({ back: ['mgmt-more', 'More'], eyebrow: 'Account', title: 'Notifications', sub: 'Updates that need your attention, newest first.',
      actions: unread.length ? K.actBtn('Mark all read', 'st-ntf-all', {}, { variant: 'secondary', icon: 'check' }) : '', tabs: ctx.state === 'live' ? K.tabs('st-ntf', tabs) : '' });
    var g = K.guard(ctx, h, { empty: ['bell', 'No notifications', 'You are all caught up.'] }); if (g) return g;
    var f = K.tab('st-ntf', tabs), list = f === 'unread' ? unread : all;
    var rows = list.length ? K.list(list.map(function (n) {
      return ui.row({ stretch: true, action: 'st-ntf-open', data: { id: n.id }, cls: n.read ? 'st-ntf' : 'st-ntf is-unread', lead: '<span class="st-dot' + (n.read ? '' : ' is-on') + '" aria-label="' + (n.read ? 'Read' : 'Unread') + '"></span>', title: esc(n.title), sub: [esc(n.body), K.dt(n.at) + (n.read && n.readAt ? ' · read ' + K.dt(n.readAt) : '')],
        trail: K.actBtn(n.read ? 'Mark unread' : 'Mark read', 'st-ntf-toggle', { id: n.id }, { size: 'sm', variant: 'tertiary' }), chevron: false });
    })) : '<div class="zone-inset">' + ui.empty('checkCircle', 'Nothing unread', 'You have read everything.', 'ok') + '</div>';
    var prefs = db.getNotificationPrefs('management');
    var settings = K.card({ title: 'Notification settings', sub: 'How you hear about each kind of update', body: '<div class="st-prefs"><div class="st-prefs__h"><span></span><span>Email</span><span>Push</span></div>' + prefs.map(function (p) {
      return '<div class="st-prefs__r"><span>' + esc(p.label) + '</span>' + K.toggle(p.email, 'st-ntf-pref', { id: p.id, ch: 'email' }) + K.toggle(p.push, 'st-ntf-pref', { id: p.id, ch: 'push' }) + '</div>';
    }).join('') + '</div>' });
    return K.page(h, K.grid([rows, settings], '21'));
  };
  A['st-ntf-open'] = function (el) { var n = db.markNotificationRead(el.dataset.id, true, K.now()); location.hash = n.route; };
  A['st-ntf-toggle'] = function (el) { var n = db.getNotifications().filter(function (x) { return x.id === el.dataset.id; })[0]; var to = !n.read; Hub.mutate(function () { db.markNotificationRead(n.id, to, K.now()); }, to ? 'Marked read' : 'Marked unread'); };
  A['st-ntf-all'] = function () { Hub.mutate(function () { db.markAllNotificationsRead('management', K.now()); }, 'All notifications marked read'); };
  A['st-ntf-pref'] = function (el) {
    var p = db.setNotificationPref('management', el.dataset.id, el.dataset.ch), at = K.now();
    Hub.mutate(null, p.label + ': ' + el.dataset.ch + (p[el.dataset.ch] ? ' on' : ' off'), { area: 'Account', summary: 'Notification setting changed: ' + p.label + ' (' + el.dataset.ch + ')', after: p[el.dataset.ch] ? 'On' : 'Off', at: at });
  };
})();
