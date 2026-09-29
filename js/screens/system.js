/* Relvor visual system reference: tokens and components on one page. */
(function () {
  var ui = Hub.ui, I = Hub.icon, esc = ui.esc;
  function sw(name, token) { return '<div class="swatch"><span class="swatch__chip" style="background:var(' + token + ')"></span><span><b>' + esc(name) + '</b><small class="mono">' + token + '</small></span></div>'; }
  function block(title, note, body) { return '<section class="section sys">' + '<div class="sys__head"><h2 class="section-title">' + esc(title) + '</h2>' + (note ? '<p class="text-3 fs-13">' + note + '</p>' : '') + '</div>' + body + '</section>'; }

  Hub.screens.system = function () {
    var type = [['--t-28', 'Client greeting', 500], ['--t-24', 'Page title', 600], ['--t-18', 'Drawer title', 600], ['--t-16', 'Panel title', 600], ['--t-14', 'Body, row titles, navigation', 500], ['--t-13', 'Secondary text, table cells', 400], ['--t-12', 'Captions, column headers', 500], ['--t-11', 'OVERLINE', 500]];
    var D = Hub.data;
    return '<div class="page">' +
      ui.pageHead({ overline: 'Relvor', title: 'Visual system', sub: 'Tokens and components behind every screen. Switch theme and organisation in the bar above to see what changes and what stays fixed.' }) +

      block('Surfaces', 'Structure comes from tone and 1px lines. Shadow is kept for things that float.', '<div class="swatches">' + sw('App ground', '--app') + sw('Workspace', '--canvas') + sw('Inset', '--inset') + sw('Hover', '--hover') + sw('Line', '--line') + sw('Line strong', '--line-strong') + sw('Ink', '--strong') + '</div>') +
      block('Text & accent', 'The accent is the organisation’s colour, clamped for contrast. It marks selection, action and links only.', '<div class="swatches">' + sw('Text', '--text') + sw('Text 2', '--text-2') + sw('Text 3', '--text-3') + sw('Text 4', '--text-4') + sw('Accent', '--accent') + sw('Accent soft', '--accent-soft') + '</div>') +
      block('Semantic', 'Fixed across organisations. Healthy state is neutral; colour means something needs a look.', '<div class="swatches">' + sw('Danger', '--danger') + sw('Warning', '--warn') + sw('Confirmed', '--ok') + sw('Info', '--info') + '</div>') +

      block('Type', 'Instrument Sans throughout. Weight carries emphasis sparingly: 400 for reading, 500 for labels, 600 for headings.', '<div class="panel">' + ui.rows(type.map(function (t) {
        return '<div class="row row--nolead type-row"><div class="row__body"><span style="font-size:var(' + t[0] + ');font-weight:' + t[2] + ';letter-spacing:' + (t[0] === '--t-11' ? 'var(--track-over)' : '-0.01em') + ';line-height:1.25">' + esc(t[1]) + '</span></div><div class="row__trail mono">' + t[0] + ' · ' + t[2] + '</div></div>';
      })) + '</div>') +

      block('Buttons', 'Compact and confident. One primary per view; row actions stay quiet until hovered.', '<div class="panel panel--pad sys-stack">' +
        '<div class="btn-row">' + ui.btn('Primary', { variant: 'primary' }) + ui.btn('Secondary') + ui.btn('Tertiary', { variant: 'tertiary' }) + ui.btn('Link', { variant: 'link' }) + ui.btn('Remove', { variant: 'danger' }) + ui.iconBtn('dotsV', 'More') + '</div>' +
        '<div class="btn-row">' + ui.btn('Small', { size: 'sm', variant: 'primary' }) + ui.btn('With icon', { size: 'sm', icon: 'refresh' }) + '<button type="button" class="btn btn--sm is-busy"><span>Saving</span></button><button type="button" class="btn btn--sm" disabled><span>Disabled</span></button>' + ui.btn('Large', { size: 'lg', variant: 'primary', trail: 'arrowRight' }) + '</div></div>') +

      block('Status', 'A dot and a word. Normal fades back; exceptions come forward.', '<div class="panel panel--pad sys-inline">' +
        ui.status('Staffed') + ui.status('Confirmed', 'ok') + ui.status('Expires 13 Oct', 'warn') + ui.status('Unavailable', 'danger') + ui.status('Pending review', 'info') +
        '<span class="sys-sep"></span>' + ui.sev('Urgent') + ui.sev('Warning') + ui.sev('Normal') +
        '<span class="sys-sep"></span>' + ui.tag('Evening') + ui.tag('Next', 'accent') + '<span class="count">12</span><span class="count count--alert">2 urgent</span></div>') +

      block('Rows', 'The core pattern. Separators start at the text; trailing detail aligns right.', '<div class="panel">' + ui.rows([
        ui.row({ lead: '<span class="row__time">17:30<small>18:30</small></span>', title: 'U9/10 Development', sub: ['City of London Freemen’s', '12 expected'], trail: ui.status('Staffed'), action: 'soon' }),
        ui.row({ lead: ui.sev('Urgent'), title: 'U13/14 Development has no staff assigned', sub: ['Fri 2 Oct, 18:00', 'Therfield School'], trail: '<span class="num when when--urgent">Starts in 28 h</span>', action: 'soon', chevron: false }),
        ui.row({ lead: ui.avatar('Jack Morgan', 'md'), title: 'Jack Morgan', sub: ['Coach', 'Evening'], trail: ui.status('DBS expires 13 Oct', 'warn'), action: 'soon' }),
        ui.row({ lead: '<span class="row__icon">' + I('inbox', 'icon-sm') + '</span>', title: 'Session requests', trail: '<span class="num">2 waiting</span>', action: 'soon' })
      ], 'rows--lead') + '</div>') +

      block('Table', 'Columns where alignment helps scanning. Collapses to rows on phones.', '<div class="panel">' + ui.table({
        cols: '36px minmax(0, 1.6fr) minmax(0, 1fr) 80px minmax(0, 1.2fr)',
        head: ['', 'Name', { label: 'Role', cls: 'wide' }, { label: 'This week', cls: 'c-num wide' }, { label: 'Compliance', cls: 'wide' }],
        body: D.staff.slice(2, 6).map(function (p) {
          return ui.tr([{ html: ui.avatar(p.name, 'md') }, { cls: 'c-main', html: '<span class="c-title">' + esc(p.name) + '</span><span class="c-sub">' + esc(p.email) + '</span>' }, { cls: 'c-cell wide', html: esc(p.role) }, { cls: 'c-num wide', html: String(p.sessions) }, { cls: 'wide', html: p.compliance === 'ok' ? ui.status('Current') : ui.status(p.complianceText, p.compliance) }]);
        }).join('') }) + '</div>') +

      block('Identity header & fields', null, '<div class="panel panel--pad sys-stack"><div class="identity">' + ui.avatar('Charlie Hughes', 'lg') + '<div style="display:grid;gap:2px"><span class="identity__name">Charlie Hughes</span><span class="identity__meta"><span>Lead Coach</span><span>Evening</span><span>charlie@example.com</span></span></div>' + ui.btn('Open drawer', { attrs: { 'data-action': 'demo-sheet' } }) + '</div>' +
        '<div class="rule"></div>' + ui.fields([['Sessions this week', '<span class="num">8</span>'], ['Compliance', ui.status('Current')], ['Last active', 'Yesterday'], ['Team', 'Evening']], true) + '</div>') +

      block('Notices', 'Inline and proportionate. Title says what happened; body says what to do.', '<div class="sys-stack">' +
        ui.notice('neutral', 'Tonight’s sessions have moved to the back pitch', 'Please use the sports hall car park.', { meta: 'From the office · 11:20', icon: 'megaphone' }) +
        ui.notice('warn', 'Cancellations couldn’t be loaded', 'What you see may not reflect a last-minute change.') +
        ui.notice('danger', 'Couldn’t approve this request', 'The session is full. Choose another session and try again.') +
        ui.notice('ok', 'Approved', 'Their record has been linked.') + '</div>') +

      block('Controls', null, '<div class="panel panel--pad sys-form">' +
        '<div class="field"><label class="label" for="f1">Full name</label><input class="input" id="f1" value="Alfie Whitfield"></div>' +
        '<div class="field"><label class="label" for="f2">Date of birth</label><input class="input" id="f2" type="date" value="2016-05-10"><span class="hint">Used to match the right record.</span></div>' +
        '<div class="field field--error"><label class="label" for="f3">Relationship</label><select class="select" id="f3"><option>Choose…</option></select><span class="hint">Choose a relationship to continue.</span></div>' +
        '<div class="field"><label class="label" for="f4">Search</label><label class="search">' + I('search') + '<input class="input" id="f4" placeholder="Search people"></label></div>' +
        '<div class="field"><span class="label">Segmented</span><div class="segmented"><button type="button" aria-pressed="true">Today</button><button type="button" aria-pressed="false">This week</button><button type="button" aria-pressed="false">Calendar</button></div></div>' +
        '<div class="field"><span class="label">Tabs</span><div class="tabs"><button type="button" class="tab-btn" aria-selected="true">All<span class="count">9</span></button><button type="button" class="tab-btn" aria-selected="false">Staffing<span class="count">4</span></button><button type="button" class="tab-btn" aria-selected="false">Compliance<span class="count">4</span></button></div></div>' +
        '</div>') +

      block('Empty & loading', null, '<div class="layout layout--even"><div class="panel">' + ui.empty('checkCircle', 'Nothing needs attention', 'New items appear as soon as they come up.', 'ok') + '</div><div class="panel panel--pad sys-stack"><span class="skeleton" style="height:12px;width:40%"></span><span class="skeleton" style="height:36px"></span><span class="skeleton" style="height:36px"></span></div></div>') +

      block('Icons', 'One stroke weight, 16px default, drawn on a 24px grid.', '<div class="panel panel--pad icon-grid">' + Hub.iconNames.map(function (n) { return '<span title="' + n + '">' + I(n) + '</span>'; }).join('') + '</div>') +
      '</div>';
  };

  Hub.actions['demo-sheet'] = function () {
    Hub.openSheet({ title: 'Drawer', body: '<p class="text-2">A bottom sheet on phones and a full-height side panel on desktop. Detail one level behind a summary, so the list stays in place underneath.</p>', foot: Hub.ui.btn('Cancel', { attrs: { 'data-action': 'close-sheet' } }) + Hub.ui.btn('Save', { variant: 'primary', attrs: { 'data-action': 'close-sheet' } }) });
  };
})();
