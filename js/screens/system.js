/* Relvor visual system reference (pass 3). */
(function () {
  var ui = Hub.ui, I = Hub.icon, esc = ui.esc;
  function sw(name, token) { return '<div class="swatch"><span class="swatch__chip" style="background:var(' + token + ')"></span><span><b>' + esc(name) + '</b><small class="mono">' + token + '</small></span></div>'; }
  function block(title, note, body) { return '<section class="section sys"><div class="sys__head"><h2 class="section-title">' + esc(title) + '</h2>' + (note ? '<p class="text-3 fs-14">' + note + '</p>' : '') + '</div>' + body + '</section>'; }

  Hub.screens.system = function () {
    var D = Hub.data;
    var type = [['--t-34', 'Client greeting', 500], ['--t-30', 'Page title', 600], ['--t-26', 'Feature title, key values', 600], ['--t-20', 'Drawer title', 600], ['--t-17', 'Section title', 600], ['--t-15', 'Body, row titles, navigation', 500], ['--t-14', 'Secondary text', 400], ['--t-13', 'Captions, column headers', 400], ['--t-12', 'OVERLINE', 500]];
    return '<div class="page">' +
      '<header class="page-head"><div class="page-head__text"><h1 class="page-title">Visual system</h1><p class="page-meta">Relvor, pass 3. Switch theme and organisation in the bar above to see what adapts and what stays fixed.</p></div></header>' +

      block('Surfaces', 'Five tones do the work borders used to do. Only floating things carry shadow.', '<div class="swatches">' + sw('Ground', '--ground') + sw('Workspace', '--canvas') + sw('Inset', '--inset') + sw('Hover / selected', '--hover') + sw('Raised', '--raised') + sw('Line', '--line') + sw('Obsidian', '--strong') + '</div>') +
      block('Text & accent', 'Graphite text on porcelain. The accent marks the active item, one primary action and selection.', '<div class="swatches">' + sw('Text', '--text') + sw('Text 2', '--text-2') + sw('Text 3', '--text-3') + sw('Text 4', '--text-4') + sw('Accent', '--accent') + sw('Accent soft', '--accent-soft') + '</div>') +
      block('Semantic', 'Fixed across organisations. Warning is rust so it never reads as the amber accent.', '<div class="swatches">' + sw('Danger', '--danger') + sw('Warning', '--warn') + sw('Confirmed', '--ok') + sw('Info', '--info') + '</div>') +

      block('Type', 'Instrument Sans. Scale and space carry hierarchy; weight is used sparingly.', ui.rows(type.map(function (t) {
        return '<div class="row row--nolead type-row"><div class="row__body"><span style="font-size:var(' + t[0] + ');font-weight:' + t[2] + ';letter-spacing:' + (t[0] === '--t-12' ? 'var(--track-over)' : 'var(--track-title)') + ';line-height:1.2">' + esc(t[1]) + '</span></div><div class="row__trail mono">' + t[0] + ' / ' + t[2] + '</div></div>';
      }))) +

      block('Rhythm', 'Three distances: 4–8px inside a unit, 12–20px inside a group, 48–64px between zones.', '<div class="zone-inset" style="padding:24px"><div class="sys-inline"><span class="tag">unit 4–8</span><span class="tag">group 16–20</span><span class="tag">zone 56</span><span class="tag">nav row 40</span><span class="tag">table row 64–72</span><span class="tag">radius 6 · 10 · 14 · 18</span></div></div>') +

      block('Signature 1: The Brief', 'Every home opens with the operation in plain language. Live facts are tokens you can act on; what changed since the last visit follows.', '<div class="sys-sig">' + ui.brief({ kicker: 'Brief \u00b7 updated 14:10', title: 'Good afternoon, David', lines: [ui.tok('4 sessions', '', '#mgmt-schedule') + ' run today. ' + ui.tok('2 need a decision', 'danger', '#mgmt-attention') + ' before tonight; everything else is on track.'], since: 'yesterday at 17:40', changes: D.changes.slice(0, 2) }) + '</div>') +
      block('Signature 2: The Day Line', 'The day as a line of time: Now in amber, elapsed time shaded, exceptions where they happen. At week scale for clients.', ui.dayline({ label: 'Today', start: 14, end: 21, now: '14:10', items: [{ title: 'U9/10 Development', start: '17:30', end: '18:30', state: 'mine' }, { title: 'U12 Academy', start: '19:00', end: '20:30', state: 'issue' }, { title: 'U8 Development', start: '16:30', end: '17:30' }] }) +
        ui.weekline([['Mon', 28], ['Tue', 29], ['Wed', 30], ['Thu', 1], ['Fri', 2], ['Sat', 3], ['Sun', 4]].map(function (d, i) { return { dow: d[0], date: d[1], past: i < 3, today: i === 3, session: i === 3 || i === 5 }; }))) +
      block('Signature 3: State marks and decisions', 'Ring, diamond, dot: one vocabulary in rows, tabs and the sidebar. Urgent items become decisions with their action attached.', '<div class="sys-inline">' + ui.sev('Normal') + '<span class="text-3 fs-14">To do</span>' + ui.sev('Warning') + '<span class="text-3 fs-14">Warning</span>' + ui.sev('Urgent') + '<span class="text-3 fs-14">Urgent</span></div>' +
        '<div class="decisions" style="max-width:720px">' + ui.decision({ kicker: 'Decision needed', when: 'Starts in 28 h', title: 'U13/14 Development has no coach', ctx: 'Fri 2 Oct, 18:00 \u00b7 Hollins Park School', actions: ui.btn('Assign Staff', { variant: 'primary', trail: 'arrowRight' }) + ui.btn('Details', { variant: 'tertiary' }) }) + '</div>') +

      block('Workspace header & index tabs', 'The sidebar says which module you are in; these tabs say which part of it you are viewing. The selected tab is cut from the page surface below it.', '<div class="sys-ws">' + ui.workspace({ id: 'demo', title: 'People', sub: '<span>Staff, clients and families</span><span>214 active</span>', actions: ui.btn('Add person', { variant: 'primary', icon: 'plus' }), active: (Hub.wsTabs && Hub.wsTabs.demo) || 'staff', tabs: [{ id: 'staff', label: 'Staff', meta: '8 people \u00b7 3 to check', state: 'Warning' }, { id: 'clients', label: 'Clients', meta: '214 active' }, { id: 'families', label: 'Families', meta: '163 linked \u00b7 1 claim', state: 'Normal' }] }) + '<div class="sys-ws__page"></div></div>') +

      block('Buttons', 'Tonal rather than outlined. One primary per view.', '<div class="sys-stack"><div class="btn-row">' + ui.btn('Primary', { variant: 'primary' }) + ui.btn('Secondary') + ui.btn('Tertiary', { variant: 'tertiary' }) + ui.btn('Outline', { variant: 'outline' }) + ui.btn('Remove', { variant: 'danger' }) + ui.btn('Link', { variant: 'link', trail: 'arrowRight' }) + ui.iconBtn('dotsV', 'More') + '</div>' +
        '<div class="btn-row">' + ui.btn('Large primary', { variant: 'primary', size: 'lg', trail: 'arrowRight' }) + ui.btn('Small', { size: 'sm' }) + '<button type="button" class="btn btn--sm is-busy"><span>Saving</span></button><button type="button" class="btn btn--sm" disabled><span>Disabled</span></button></div></div>') +

      block('Status', 'A dot and a word. Normal is grey; exceptions carry colour.', '<div class="sys-inline">' + ui.status('Staffed') + ui.status('Confirmed', 'ok') + ui.status('Expires 13 Oct', 'warn') + ui.status('Unavailable', 'danger') + ui.status('Pending', 'info') + ui.sev('Urgent') + ui.sev('Warning') + ui.sev('Normal') + ui.tag('Evening') + ui.tag('Next', 'accent') + '<span class="count count--alert">2 urgent</span></div>') +

      block('Rows', 'Flush with the text column; separators start at the text; hover reveals a soft surface.', ui.rows([
        ui.row({ lead: '<span class="row__time">17:30<small>18:30</small></span>', title: 'U9/10 Development', sub: ['Northgate Sports Centre', '12 expected'], action: 'soon' }),
        ui.row({ lead: ui.sev('Urgent'), title: 'U13/14 Development has no staff assigned', sub: ['Fri 2 Oct, 18:00', 'Hollins Park School'], trail: '<span class="num when when--urgent">Starts in 28 h</span>', action: 'soon', chevron: false, cls: 'is-urgent' }),
        ui.row({ lead: ui.avatar('Jack Morgan', 'md'), title: 'Jack Morgan', sub: ['Coach', 'Evening'], trail: ui.status('DBS expires 13 Oct', 'warn'), action: 'soon' })
      ], 'rows--lead')) +

      block('Table', 'Hairline row separators, generous columns, aligned numerals, no header fill.', ui.table({
        cols: '36px minmax(0, 1.6fr) minmax(0, 1fr) 84px minmax(0, 1.2fr)',
        head: ['', 'Name', { label: 'Role', cls: 'wide' }, { label: 'This week', cls: 'c-num wide' }, { label: 'Compliance', cls: 'wide' }],
        body: D.staff.slice(2, 6).map(function (p) {
          return ui.tr([{ html: ui.avatar(p.name, 'md') }, { cls: 'c-main', html: '<span class="c-title">' + esc(p.name) + '</span><span class="c-sub">' + esc(p.email) + '</span>' }, { cls: 'c-cell wide', html: esc(p.role) }, { cls: 'c-num wide', html: String(p.sessions) }, { cls: 'wide', html: p.compliance === 'ok' ? '<span class="c-mute">Current</span>' : ui.status(p.complianceText, p.compliance) }]);
        }).join('') })) +

      block('Surfaces in use', null, '<div class="layout layout--even"><div class="surface surface--pad sys-stack"><div class="identity">' + ui.avatar('Charlie Hughes', 'lg') + '<div style="display:grid;gap:4px"><span class="identity__name">Charlie Hughes</span><span class="identity__meta"><span>Lead Coach</span><span>Evening</span></span></div>' + ui.btn('Open drawer', { attrs: { 'data-action': 'demo-sheet' } }) + '</div>' + ui.fields([['Sessions this week', '<span class="num">8</span>'], ['Last active', 'Yesterday']], true) + '</div>' +
        '<div class="zone-inset" style="padding:28px">' + ui.empty('checkCircle', 'Nothing needs attention', 'New items appear as soon as they come up.', 'ok') + '</div></div>') +

      block('Notices', 'Tonal, never outlined.', '<div class="sys-stack">' + ui.notice('neutral', 'Tonight’s sessions have moved to the back pitch', 'Please use the sports hall car park.', { meta: 'From the office · 11:20', icon: 'megaphone' }) + ui.notice('warn', 'Cancellations couldn’t be loaded', 'What you see may not reflect a last-minute change.') + ui.notice('danger', 'Couldn’t approve this request', 'The session is full. Choose another session and try again.') + '</div>') +

      block('Controls', null, '<div class="sys-form">' +
        '<div class="field"><label class="label" for="f1">Full name</label><input class="input" id="f1" value="Alfie Whitfield"></div>' +
        '<div class="field"><label class="label" for="f4">Search</label><label class="search">' + I('search') + '<input class="input" id="f4" placeholder="Search people"></label></div>' +
        '<div class="field field--error"><label class="label" for="f3">Relationship</label><select class="select" id="f3"><option>Choose…</option></select><span class="hint">Choose a relationship to continue.</span></div>' +
        '<div class="field"><span class="label">Segmented</span><div class="segmented"><button type="button" aria-pressed="true">Today</button><button type="button" aria-pressed="false">This week</button><button type="button" aria-pressed="false">Calendar</button></div></div>' +
        '<div class="field"><span class="label">Tabs</span><div class="tabs"><button type="button" class="tab-btn" aria-selected="true">All<span class="count">9</span></button><button type="button" class="tab-btn" aria-selected="false">Staffing<span class="count">4</span></button><button type="button" class="tab-btn" aria-selected="false">Compliance<span class="count">4</span></button></div></div>' +
        '</div>') +

      block('Icons', 'One stroke weight on a 24px grid; 16–18px in use.', '<div class="icon-grid">' + Hub.iconNames.map(function (n) { return '<span title="' + n + '">' + I(n) + '</span>'; }).join('') + '</div>') +
      '</div>';
  };

  Hub.actions['demo-sheet'] = function () {
    Hub.openSheet({ title: 'Drawer', body: '<p class="text-2">A floating panel: a bottom sheet on phones, an inset side panel on desktop. Detail one level behind a summary, so the list stays in place underneath.</p>', foot: Hub.ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + Hub.ui.btn('Save', { variant: 'primary', attrs: { 'data-action': 'close-sheet' } }) });
  };
})();
