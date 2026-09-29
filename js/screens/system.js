/* Visual system reference: every shared token and component on one page. */
(function () {
  var ui = Hub.ui, I = Hub.icon, esc = ui.esc;

  function swatch(name, token, note) {
    return '<div class="swatch"><span class="swatch__chip" style="background:var(' + token + ')"></span><span><b>' + esc(name) + '</b><small><code>' + token + '</code>' + (note ? ' · ' + esc(note) : '') + '</small></span></div>';
  }
  function block(title, note, body) {
    return '<section class="section sys-block"><div class="section-head"><h2 class="section-title">' + esc(title) + '</h2></div>' + (note ? '<p class="text-2 fs-sm sys-note">' + note + '</p>' : '') + body + '</section>';
  }

  Hub.screens.system = function () {
    var type = [['--fs-3xl', 'Display', 'Brand moments only', 'display'], ['--fs-2xl', 'Page title', 'One per screen', ''], ['--fs-xl', 'Section / sheet title', '', ''], ['--fs-lg', 'Card title', '', ''], ['--fs-md', 'Body and list titles', 'Never smaller on mobile', ''], ['--fs-sm', 'Secondary lines', '', ''], ['--fs-xs', 'Meta, pills, labels', 'Floor: 12px', '']];
    return '<div class="page">' +
      ui.pageHead({ eyebrow: 'Hub visual system', title: 'Tokens & components', sub: 'Everything on the five redesigned screens is built from these pieces. Switch brand, theme and area in the bar above to see them adapt.' }) +

      block('Brand', 'The only colours an organisation supplies. Everything else derives from them.', '<div class="swatches">' +
        swatch('Primary', '--brand-primary', 'strong surfaces, buttons') + swatch('Accent', '--brand-accent', 'links, active, focus') + swatch('Secondary', '--brand-secondary', 'one highlight per screen') + '</div>') +

      block('Neutrals & status', 'Status colours are semantic and never change per organisation.', '<div class="swatches">' +
        swatch('Background', '--bg') + swatch('Surface', '--surface') + swatch('Border', '--border-strong') + swatch('Text', '--text') + swatch('Text 2', '--text-2') +
        swatch('Success', '--ok') + swatch('Warning', '--warn') + swatch('Danger', '--danger') + swatch('Info', '--info') + '</div>') +

      block('Type', 'Manrope for the interface; the brand display face for one moment per screen.', '<div class="card card--flush">' + ui.list(type.map(function (t) {
        return '<div class="row row--nolead type-row"><div class="row__body"><span class="' + t[3] + '" style="font-size:var(' + t[0] + ');font-weight:' + (t[3] ? 400 : 'var(--fw-bold)') + ';line-height:1.15">' + esc(t[1]) + '</span><span class="row__meta"><span><code>' + t[0] + '</code></span>' + (t[2] ? '<span>' + esc(t[2]) + '</span>' : '') + '</span></div><div></div></div>';
      })) + '</div>') +

      block('Buttons', 'One primary action per view. Highlight only on the strong brand surface. All at least 44px tall.',
        '<div class="card card--pad" style="display:grid;gap:12px"><div class="btn-row">' + ui.btn('Primary') + ui.btn('Secondary', { variant: 'secondary' }) + ui.btn('Ghost', { variant: 'ghost' }) + ui.btn('Decline', { variant: 'danger' }) + '</div>' +
        '<div class="btn-row">' + ui.btn('Small', { size: 'sm' }) + ui.btn('With icon', { variant: 'secondary', size: 'sm', icon: 'refresh' }) + '<button class="btn btn--sm is-busy" type="button"><span>Approving…</span></button><button class="btn btn--secondary btn--sm" disabled type="button"><span>Disabled</span></button></div>' +
        '<div class="card card--strong card--pad btn-row">' + ui.btn('Highlight', { variant: 'highlight', trail: 'arrowRight' }) + ui.btn('On strong', { variant: 'on-strong' }) + '</div></div>') +

      block('Status pills', 'Colour plus a dot, with a word that makes sense in greyscale.', '<div class="card card--pad btn-row" style="gap:8px">' +
        ui.pill('Staffed', 'ok') + ui.pill('Warning', 'warn') + ui.pill('Urgent', 'danger') + ui.pill('Pending', 'info') + ui.pill('Paused') + ui.pill('Today', 'highlight', 'pill--plain') + '<span class="badge num">3</span><span class="badge badge--quiet num">2</span></div>') +

      block('List rows', 'The workhorse. One tap target per row, 64px minimum, meta separated by dots.', '<div class="card card--flush">' + ui.list([
        ui.row({ lead: '<span class="row__time">17:30<small>18:30</small></span>', title: 'U9/10 Development', meta: ['City of London Freemen’s', '12 players'], trail: ui.pill('Staffed', 'ok'), action: 'soon' }),
        ui.row({ lead: ui.sev('Urgent'), title: 'U13/14 Development has no coach', meta: ['Fri 2 Oct, 18:00 · Therfield School'], action: 'soon' }),
        ui.row({ lead: ui.avatar('Alfie Whitfield'), title: 'Alfie Whitfield', meta: ['U9/10 Development'], trail: ui.pill('Active', 'ok') }),
        ui.row({ compact: true, lead: '<span class="tile__icon">' + I('inbox', 'icon-sm') + '</span>', title: 'Session requests', trail: '<span class="badge num">2</span>' + I('chevron', 'icon-sm'), action: 'soon' })
      ]) + '</div>') +

      block('Alerts', 'Inline, in the flow of the page. Title says what happened; body says what to do.', '<div style="display:grid;gap:8px">' +
        ui.alert('info', 'Tonight’s sessions are on the back astro', 'Please meet at the astro gate.') +
        ui.alert('warn', 'Today’s cancellations and cover couldn’t be loaded', 'What you see may not reflect a last-minute change.') +
        ui.alert('danger', 'Couldn’t approve this request', 'The session is full. Choose another session and try again.') +
        ui.alert('ok', 'Coach approved', 'Their Coach record has been linked.') + '</div>') +

      block('Empty & loading', null, '<div class="tiles tiles--wide"><div class="card">' + ui.empty('checkCircle', 'Nothing needs attention', 'New items appear as soon as they come up.', 'ok') + '</div><div class="card">' + ui.empty('clock', 'No sessions today', 'Your next session is U9/10 Development, Thursday.') + '</div>' +
        '<div class="card card--pad" style="display:grid;gap:10px"><span class="skeleton" style="height:16px;width:50%"></span><span class="skeleton" style="height:44px"></span><span class="skeleton" style="height:44px"></span></div></div>') +

      block('Forms', '16px input text so iOS never zooms. Labels above, hints below.', '<div class="card card--pad form-demo">' +
        '<div class="field"><label class="label" for="f-name">Child’s full name</label><input class="input" id="f-name" value="Alfie Whitfield"></div>' +
        '<div class="field"><label class="label" for="f-dob">Date of birth</label><input class="input" id="f-dob" type="date" value="2016-05-10"><span class="hint">We use this to match the right player record.</span></div>' +
        '<div class="field field--error"><label class="label" for="f-rel">Relationship</label><select class="select" id="f-rel"><option>Choose…</option><option>Parent</option><option>Guardian</option></select><span class="hint">Choose how you’re related to continue.</span></div>' +
        '<div class="field"><span class="label">View</span><div class="segmented" role="group"><button type="button" aria-pressed="true">Today</button><button type="button" aria-pressed="false">This week</button><button type="button" aria-pressed="false">Calendar</button></div></div>' +
        '</div>') +

      block('Profile header & sheet', null, '<div class="card card--pad" style="display:grid;gap:16px"><div class="profile-head">' + ui.avatar('Charlie Hughes', 'lg') + '<div><div class="profile-head__name">Charlie Hughes</div><div class="profile-head__meta"><span>Lead Coach</span>' + ui.pill('Compliant', 'ok') + '</div></div></div>' +
        ui.btn('Open a drawer', { variant: 'secondary', attrs: { 'data-action': 'demo-sheet' } }) + '</div>') +

      block('Icons', 'One stroke set, 24px grid. Replaces the Hub’s unicode glyphs.', '<div class="card card--pad icon-grid">' + Hub.iconNames.map(function (n) { return '<span title="' + n + '">' + I(n) + '</span>'; }).join('') + '</div>') +
      '</div>';
  };

  Hub.actions['demo-sheet'] = function () {
    Hub.openSheet('<div class="sheet__head"><h2 id="sheet-title" style="font-size:var(--fs-xl)">Drawer</h2><button type="button" class="icon-btn" data-action="close-sheet" aria-label="Close">' + I('x') + '</button></div><div class="sheet__body"><p class="text-2">A bottom sheet on phones and a side drawer on desktop. It is used for detail one level behind a summary, so the list stays in place underneath.</p>' + ui.btn('Done', { block: true, attrs: { 'data-action': 'close-sheet' } }) + '</div>');
  };
})();
