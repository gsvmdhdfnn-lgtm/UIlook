/* Finance (pass 12). Every figure is computed by Hub.db.fin from the
   underlying entries, so September reconciles across the overview, the
   invoice list, the ledger, costs, cash and reporting. Issued invoices,
   credit notes and payments are frozen history: corrections are new
   entries. Finance View is read-only; Finance None hides the area. */
(function () {
  var K = Hub.kit, db = Hub.db, ui = Hub.ui, I = Hub.icon, esc = ui.esc, F = db.fin;
  var M = K.money;
  function can() { return K.canFin(); }
  function clientName(id) { return (db.getClient(id) || {}).name || id; }
  function monthName(m) { return { '2026-04': 'April 2026', '2026-05': 'May 2026', '2026-06': 'June 2026', '2026-07': 'July 2026', '2026-08': 'August 2026', '2026-09': 'September 2026', '2026-10': 'October 2026' }[m] || m; }
  Hub.finView = Hub.finView || { expected: false, month: '2026-09' };

  /* Six everyday sections; the rest of Finance is one step deeper (finance
     tools on the overview). On a deeper page its name joins the bar so you
     always know where you are. */
  var NAV = [['mgmt-finance', 'Overview'], ['mgmt-fin-money-in', 'Money in'], ['mgmt-fin-money-out', 'Money out'], ['mgmt-fin-cash', 'Cash flow'], ['mgmt-fin-reports', 'Month report']];
  /* Deeper pages sit under one of the five sections, which stays highlighted */
  var GROUP = { 'mgmt-fin-invoices': 'mgmt-fin-money-in', 'mgmt-fin-invoice': 'mgmt-fin-money-in', 'mgmt-fin-invoice-print': 'mgmt-fin-money-in', 'mgmt-fin-drafts': 'mgmt-fin-money-in', 'mgmt-fin-draft': 'mgmt-fin-money-in',
    'mgmt-fin-payments': 'mgmt-fin-money-in', 'mgmt-fin-credit-notes': 'mgmt-fin-money-in', 'mgmt-fin-client-credits': 'mgmt-fin-money-in', 'mgmt-fin-parent-money': 'mgmt-fin-money-in', 'mgmt-fin-clients': 'mgmt-fin-money-in', 'mgmt-fin-client': 'mgmt-fin-money-in',
    'mgmt-fin-ledger': 'mgmt-fin-reports' };
  var TOOLS = [
    ['Costs and profit', [['mgmt-fin-ledger', 'Profit by session', 'Revenue and costs for each session', 'development'], ['mgmt-allocations', 'Coach pay', 'Work done and pay, session by session', 'coaches']]],
    ['Setup', [['mgmt-fin-settings', 'Finance settings', 'Business details, VAT, invoice numbers', 'settings'], ['mgmt-fin-integrations', 'Connected apps', 'Card payments and accounting', 'link'], ['mgmt-fin-access', 'Access and history', 'Who can see Finance, and every change', 'shield']]]
  ];
  function finNav(active) {
    active = GROUP[active] || active;
    var list = NAV.slice(), known = NAV.some(function (n) { return n[0] === active; });
    if (!known) { TOOLS.forEach(function (g) { g[1].forEach(function (t) { if (t[0] === active) list.push([t[0], t[1]]); }); }); }
    return '<nav class="fin-nav" aria-label="Financials sections">' + list.map(function (n) { return '<a href="#' + n[0] + '"' + (n[0] === active ? ' aria-current="page"' : '') + '>' + esc(n[1]) + '</a>'; }).join('') + '</nav>';
  }
  function accessPill() { return K.fin() === 'view' ? '<span class="fin-access">' + I('shield', 'icon-sm') + 'Finance View: read only</span>' : ''; }
  function head(route, o) {
    o.eyebrow = o.eyebrow || 'Financials';
    o.back = o.back || ['mgmt-finance', 'Financials'];
    o.actions = (o.actions || '') + accessPill();
    o.tabs = finNav(route) + (o.tabs || '');
    return K.head(o);
  }
  /* None: Finance is hidden. Every Finance route explains and stops here. */
  function gate(ctx, h, o) {
    if (K.fin() === 'none') return K.page(K.head({ back: ['mgmt-home', 'Home'], eyebrow: 'Home', title: 'Financials' }),
      '<div class="k-off">' + I('shield') + '<div><b>You don’t have Finance access</b><p>Finance View and Finance Manage are granted separately from Management. Ask a Finance Manage user (Josh Evans or David Cole) to grant access. Nothing in Finance is shown until then.</p></div></div>');
    return K.guard(ctx, h, o || {});
  }
  function route(id, title) { K.route(id, { title: title, parent: 'home' }); }

  /* ================================================================ OVERVIEW */
  route('mgmt-finance', 'Financials');
  Hub.actions['fin-expected'] = function (el) { Hub.finView.expected = el.dataset.val === '1'; Hub.render(); };
  function expectedToggle() {
    return '<div class="segmented k-seg" role="group" aria-label="Figures"><button type="button" data-action="fin-expected" data-val="0" aria-pressed="' + !Hub.finView.expected + '">Actual only</button><button type="button" data-action="fin-expected" data-val="1" aria-pressed="' + Hub.finView.expected + '">Including expected</button></div>';
  }
  /* The one-line answer at the top of each finance page */
  function overdueList() { return db.getInvoices().filter(function (i) { return F.balance(i) > 0 && F.paymentState(i) === 'Overdue'; }).sort(function (a, b) { return a.due < b.due ? -1 : 1; }); }
  function cashWords(cp) { return cp.low >= cp.threshold ? 'Cash stays above the ' + M(cp.threshold).replace('.00', '') + ' safety level; lowest ' + M(cp.low).replace('.00', '') + ' on ' + K.dm(cp.lowDate) + '.' : 'Cash falls below the ' + M(cp.threshold).replace('.00', '') + ' safety level: ' + M(cp.low).replace('.00', '') + ' on ' + K.dm(cp.lowDate) + '.'; }
  function financeAttention() {
    var items = [];
    db.getInvoices().forEach(function (i) { var st = F.paymentState(i); if (st === 'Overdue') items.push({ tone: 'danger', tag: 'Overdue', title: i.number + ' · ' + clientName(i.client), meta: M(F.balance(i)) + ' · due ' + K.dm(i.due) + (i.originalDue && i.originalDue !== i.due ? ' (moved from ' + K.dm(i.originalDue) + ')' : ''), route: 'mgmt-fin-invoice/' + i.id }); if (i.xero && i.xero.status === 'Failed') items.push({ tone: 'warn', tag: 'Xero', title: i.number + ' not sent to Xero', meta: i.xero.error, route: 'mgmt-fin-invoice/' + i.id }); });
    db.getDrafts().filter(function (d) { return d.state !== 'Issued'; }).forEach(function (d) { var p = db.draftProblems(d); items.push({ tone: p.length ? 'warn' : 'info', tag: d.state, title: 'Invoice draft · ' + clientName(d.client) + ' · ' + monthName(d.period), meta: p.length ? p.length + ' to resolve before issue' : 'Ready to issue', route: 'mgmt-fin-draft/' + d.id }); });
    var pend = db.getAllocations(function (a) { return a.date.slice(0, 7) === '2026-09' && (a.state === 'Confirmed' || a.state === 'Exported') && !a.run; });
    if (pend.length) items.push({ tone: 'info', tag: 'Due ' + K.dm('2026-10-07'), title: 'Coach payment run · September work', meta: pend.length + ' pay items ready · ' + M(K.sum(pend, 'cost')), route: 'mgmt-fin-money-out' });
    return items;
  }
  Hub.screens['mgmt-finance'] = function (ctx) {
    var h = head('mgmt-finance', { eyebrow: 'Home', title: 'Financials', sub: 'Money coming in, money going out and where the business stands.', back: ['mgmt-home', 'Home'] });
    var g = gate(ctx, h, { empty: ['finance', 'No finance activity yet', 'Invoices, payments and costs appear here once the first month is set up.'] }); if (g) return g;
    var s = F.monthSummary('2026-09', Hub.finView.expected), t = s.totals, cash = F.cashPosition(), rec = F.receivables();
    var bar = '<div class="lx-periodbar"><p>September 2026 · ' + (Hub.finView.expected ? 'including expected (draft invoices)' : 'actual only') + ' · revenue shown net of VAT</p>' + expectedToggle() + '</div>';
    var kpis = K.stats([
      { label: 'Revenue', value: M(t.net), sub: M(t.gross) + ' gross · ' + M(t.vat) + ' VAT', route: 'mgmt-fin-reports' },
      { label: 'Direct costs', value: M(t.direct), sub: 'Coaches ' + M(t.coach) + ' · venues ' + M(t.venue) + ' · other ' + M(t.other), route: 'mgmt-fin-money-out' },
      { label: 'Overheads', value: M(t.overheads), sub: db.getOverheads().length + ' monthly overheads', route: 'mgmt-fin-money-out' },
      { label: 'Profit', value: M(t.profit), sub: 'Before overheads ' + M(t.contribution) + ' (' + t.margin + '%)', tone: 'feature', route: 'mgmt-fin-reports' }]);
    var att = financeAttention();
    var attn = K.card({ title: 'Needs you', sub: 'Money items that need a decision or a nudge.', right: '<span class="lx-count num">' + att.length + '</span>', body: '<div class="lx-rows">' + att.map(function (r) { return '<a class="lx-row fin-rowlink" href="#' + r.route + '">' + K.pill(r.tag, r.tone) + '<span class="lx-row__main"><b>' + esc(r.title) + '</b><small>' + esc(r.meta || '') + '</small></span>' + I('chevron', 'icon-sm') + '</a>'; }).join('') + '</div>' });
    var up = cash.events.filter(function (e) { return e.date >= K.today && e.kind === 'Out'; }).slice(0, 4);
    var upcoming = K.card({ title: 'Upcoming payments', sub: 'Next confirmed or expected outgoing cash.', right: K.goBtn('View cash flow', 'mgmt-fin-cash', { variant: 'secondary', size: 'sm' }), body: '<div class="lx-rows">' + up.map(function (e) { return '<div class="lx-row"><span class="lx-row__date num">' + K.dm(e.date) + '</span><span class="lx-row__main"><b>' + esc(e.label) + '</b><small>' + esc(e.certainty) + ' · ' + esc(e.authority) + '</small></span><b class="lx-row__amt num">' + M(e.expected) + '</b></div>'; }).join('') + '</div>' });
    var areas = K.tiles([
      { route: 'mgmt-fin-money-in', icon: 'download', title: 'Money in', desc: 'Invoices, parent payments, bookings and credits.', value: M(rec.total), label: 'owed to us' },
      { route: 'mgmt-fin-money-out', icon: 'card', title: 'Money out', desc: 'Coach costs, venues, other costs and overheads.' },
      { route: 'mgmt-fin-cash', icon: 'finance', title: 'Cash flow', desc: 'Cash now, what is coming in and going out, and the 30-day low.' },
      { route: 'mgmt-fin-reports', icon: 'development', title: 'Month report', desc: 'Programme breakdown, VAT estimate and profit.' }], 4);
    var band = '<section class="lx-band" aria-label="Cash position"><div><span>Current cash</span><b class="num">' + M(cash.current) + '</b><small>' + esc(K.d(K.today)) + '</small></div><div><span>Lowest next 30 days</span><b class="num">' + M(cash.low) + '</b><small>' + K.dm(cash.lowDate) + '</small></div><div><span>Safety threshold</span><b class="num">' + M(cash.threshold) + '</b><small>' + (cash.low >= cash.threshold ? 'Currently above threshold' : 'Projected below threshold') + '</small></div></section>';
    var tools = K.moreIn('More in Financials', TOOLS.map(function (g) { return [g[0], g[1].map(function (t) { return { route: t[0], title: t[1], desc: t[2], icon: t[3] }; })]; }));
    var od = overdueList(), odSum = K.sum(od, function (i) { return F.balance(i); });
    var sit = cash.low < cash.threshold ? K.situation({ tone: 'danger', kicker: 'September 2026', title: 'Cash drops below the safety level on ' + K.dm(cash.lowDate), text: cashWords(cash) + ' Profit ' + M(t.profit) + ' this month.', primary: K.goBtn('View cash flow', 'mgmt-fin-cash', { variant: 'primary' }) }) :
      /* The month at a glance stays calm; anything overdue is in Needs attention just below */
      od.length ? K.situation({ tone: 'neutral', kicker: 'September 2026', title: 'Profit ' + M(t.profit) + ' this month', text: cashWords(cash) + ' ' + M(odSum) + ' is overdue: see Needs attention below.' }) :
      K.situation({ tone: 'quiet', kicker: 'September 2026', title: 'On track', text: 'Profit ' + M(t.profit) + ' this month. Nothing overdue. ' + cashWords(cash) });
    return K.page(h, sit + K.areaNeeds(['Finance'], { area: 'Financials', clear: 'Nothing overdue, unsent or waiting to be invoiced.' }) + bar + kpis + upcoming + band + K.section('Where the money is', '', areas) + tools, 'fin');
  };

  /* ================================================================ MONEY IN */
  /* Everything coming in, in one place. The detailed pages (invoices, drafts,
     payments, credit notes, client credits, parent money) sit behind it. */
  route('mgmt-fin-money-in', 'Money in');
  Hub.screens['mgmt-fin-money-in'] = function (ctx) {
    var h = head('mgmt-fin-money-in', { title: 'Money in', sub: 'School invoices, parent payments, bookings and credits.' });
    var g = gate(ctx, h, { empty: ['download', 'Nothing coming in yet', 'Invoices and payments appear here once the first month is set up.'] }); if (g) return g;
    var rec = F.receivables(), invs = db.getInvoices(), drafts = db.getDrafts().filter(function (d) { return d.state !== 'Issued'; });
    var open = invs.filter(function (i) { return F.balance(i) > 0; }).sort(function (a, b) { return a.due < b.due ? -1 : 1; });
    var overdue = open.filter(function (i) { return F.paymentState(i) === 'Overdue'; });
    var oct = db.getFamilyCharges(function (c) { return c.month === '2026-10'; });
    var bks = db.getBookings(), bkTotal = K.sum(bks, function (b) { return K.sum(b.lines || [], function (l) { return l.amountDue != null ? l.amountDue : (l.base || 0) - (l.discount || 0); }); });
    var cns = db.getCreditNotes(), ccs = db.getClientCredits(), ccLeft = K.sum(ccs, function (c) { return F.creditRemaining(c); });
    var stats = K.stats([
      { label: 'Owed to us', value: M(rec.total), sub: open.length + ' open invoice' + (open.length === 1 ? '' : 's'), tone: 'feature' },
      { label: 'Overdue', value: M(K.sum(overdue, function (i) { return F.balance(i); })), sub: overdue.length ? overdue.map(function (i) { return i.number; }).join(', ') : 'Nothing overdue', tone: overdue.length ? 'warn' : '' },
      { label: 'Parent payments in October', value: M(K.sum(oct, 'paid')), sub: oct.length + ' subscriptions this month', route: 'mgmt-fin-parent-money' },
      { label: 'Invoices to issue', value: drafts.length, sub: drafts.length ? 'September for ' + drafts.map(function (d) { return db.getClient(d.client).name; }).join(', ') : 'All issued', route: 'mgmt-fin-drafts', tone: drafts.length ? 'warn' : '' }]);
    var invT = K.table({ cols: 'minmax(0,1.6fr) 92px minmax(0,100px)', head: ['Invoice', { label: 'Balance', cls: 'c-num' }, { label: '', cls: 'c-end' }],
      rows: open.map(function (i) { return { route: 'mgmt-fin-invoice/' + i.id, cells: [K.cell(esc(i.number) + ' · ' + esc(clientName(i.client)), 'Due ' + esc(K.dm(i.due))), { cls: 'c-num', html: M(F.balance(i)) }, { cls: 'c-end', html: K.status(F.paymentState(i)) }] }; }),
      empty: 'Every issued invoice is paid.' });
    function link(route, icon, title, sub) { return K.tile({ route: route, icon: icon, title: title, desc: sub }); }
    var odSum = K.sum(overdue, function (i) { return F.balance(i); });
    var sit = overdue.length ? K.situation({ tone: 'warn', title: M(odSum) + ' overdue · chase ' + esc(overdue[0].number), text: esc(clientName(overdue[0].client)) + ' is ' + K.daysBetween(overdue[0].due, K.today) + ' days late.' + (drafts.length ? ' ' + drafts.length + ' invoice' + (drafts.length === 1 ? '' : 's') + ' still to issue.' : ''), primary: ui.btn('Open ' + esc(overdue[0].number), { variant: 'primary', href: '#mgmt-fin-invoice/' + overdue[0].id }), secondary: drafts.length ? K.goBtn('Issue invoices', 'mgmt-fin-drafts', { variant: 'secondary' }) : '' }) :
      drafts.length ? K.situation({ tone: 'info', title: drafts.length + ' invoice' + (drafts.length === 1 ? '' : 's') + ' to issue', text: 'Nothing overdue. ' + M(rec.total) + ' owed to us and not yet due.', primary: K.goBtn('Issue invoices', 'mgmt-fin-drafts', { variant: 'primary' }) }) :
      K.situation({ tone: 'ok', title: 'Everything due has come in', text: M(rec.total) + ' owed to us, none of it late.' });
    var body = sit + stats +
      K.section('School and client invoices', 'Unpaid first. Open one to record a payment, send a reminder or raise a credit note.', invT,
        K.goBtn('All invoices', 'mgmt-fin-invoices', { size: 'sm', variant: 'secondary' })) +
      K.section('Parents and bookings', '', '<div class="lx-links">' +
        link('mgmt-fin-parent-money', 'family', 'Parent payments', 'Monthly subscriptions, failed card payments, family credit and refunds.') +
        link('mgmt-bookings', 'card', 'Bookings', bks.length + ' camps, events and tours · ' + M(bkTotal) + ' booked.') + '</div>') +
      K.section('Credits and corrections', 'For when something needs putting right.', '<div class="lx-links">' +
        link('mgmt-fin-credit-notes', 'swap', 'Credit notes', cns.length + ' issued. Corrections to issued invoices.') +
        link('mgmt-fin-client-credits', 'card', 'Client credit', M(ccLeft) + ' to use, from overpayments and credit notes.') +
        link('mgmt-fin-payments', 'download', 'Payments received', 'Every payment, including part payments and reversals.') + '</div>');
    return K.page(h, body, 'fin');
  };

  /* ================================================================ ACCESS & AUDIT */
  route('mgmt-fin-access', 'Finance access & audit');
  Hub.actions['fin-grant'] = function (el) {
    var p = el.dataset.person;
    Hub.openSheet({ title: 'Finance access · ' + esc(p), body: K.form([K.field('Access', K.select('grant', [['None', 'None'], ['View', 'View (read only)'], ['Manage', 'Manage']], el.dataset.cur)), K.field('Reason', K.input('grant_reason', '', { placeholder: 'Why access is changing' }))], 1) + '<p class="k-note">Finance access is separate from Management. The change is logged with who, when, before and after.</p>',
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Save access', 'fin-grant-save', { person: p }, { variant: 'primary' }) });
  };
  Hub.actions['fin-grant-save'] = function (el) { var v = K.val('grant'); Hub.closeSheet(true); Hub.mutate(function () { db.setFinanceGrant(el.dataset.person, v); }, 'Finance access updated'); };
  Hub.screens['mgmt-fin-access'] = function (ctx) {
    var h = head('mgmt-fin-access', { title: 'Access & audit', sub: 'Finance View and Finance Manage are granted separately from Management. Every finance change is recorded with who, when, before and after.' });
    var g = gate(ctx, h); if (g) return g;
    var grants = K.table({ cols: 'minmax(0,1.4fr) minmax(0,1fr) 120px minmax(0,1.6fr) 110px', head: ['Person', 'Role', 'Access', 'Granted', ''], rows: db.getFinanceGrants().map(function (x) {
      return { cells: [K.cell(esc(x.person)), { cls: 'c-cell', html: esc(x.role) }, { html: K.status(x.access) }, { cls: 'c-cell', html: x.at ? K.stamp('Granted', x.grantedBy, x.at) : '<span class="c-mute">Never granted</span>' }, { cls: 'c-end', html: can() ? K.actBtn('Change', 'fin-grant', { person: x.person, cur: x.access }, { variant: 'tertiary', size: 'sm' }) : '' }] };
    }) });
    return K.page(h, K.section('Who can see Finance', 'View is read only. None hides Finance completely. Use the prototype bar’s Finance access switch to see each level.', grants) + K.section('Finance audit trail', 'Latest first. Details are restricted to Finance Manage.', auditList(true)), 'fin');
  };
  function auditList(finOnly) {
    var list = (Hub.data.audit || []).filter(function (a) { return !finOnly || a.finance; });
    return '<div class="lx-surface fin-audit">' + (list.length ? list.slice(0, 40).map(function (a) {
      return '<div class="fin-audit__i"><div><b>' + esc(a.summary) + '</b>' + K.stamp('Recorded', a.who, a.at) + '</div>' +
        (K.fin() === 'manage' ? '<div class="fin-audit__ba"><span><small>Before</small>' + esc(a.before || '—') + '</span><span><small>After</small>' + esc(a.after || '—') + '</span></div>' : '<div class="k-locked">' + I('shield', 'icon-sm') + '<span><b>Before and after values</b><small>Only visible to Finance Manage.</small></span></div>') + '</div>';
    }).join('') : ui.empty('shield', 'No finance changes yet', 'Every finance change will appear here.')) + '</div>';
  }
  route('mgmt-fin-audit', 'Finance audit trail');
  Hub.screens['mgmt-fin-audit'] = function (ctx) {
    var h = head('mgmt-fin-access', { title: 'Finance audit trail', sub: 'Every finance write, with who, when, before and after.' }); var g = gate(ctx, h); if (g) return g;
    return K.page(h, auditList(true), 'fin');
  };

  /* ================================================================ SETTINGS */
  route('mgmt-fin-settings', 'Finance settings');
  Hub.actions['fin-settings-save'] = function () {
    var p = { legalName: K.val('legalName'), address: K.val('address'), companyNumber: K.val('companyNumber'), vatRegistered: K.val('vatRegistered') === 'yes', vatNumber: K.val('vatNumber'), vatRate: +K.val('vatRate'), vatTreatment: K.val('vatTreatment'), paymentTerms: +K.val('paymentTerms'), coachPaymentDay: +K.val('coachPaymentDay'), numberAuthority: K.val('numberAuthority'), prefix: K.val('prefix'), nextNumber: +K.val('nextNumber'), digits: +K.val('digits') };
    Hub.mutate(function () { db.finUpdateSettings(p); }, 'Finance settings saved');
  };
  Hub.screens['mgmt-fin-settings'] = function (ctx) {
    var h = head('mgmt-fin-settings', { title: 'Finance settings', sub: 'Copied onto every invoice as it is issued. Changing them never alters invoices already issued.' });
    var g = gate(ctx, h); if (g) return g;
    var S = db.getFinanceSettings(), ro = !can();
    function inp(n, v, o) { o = o || {}; o.readonly = ro; return K.input(n, v, o); }
    var next = S.prefix + String(S.nextNumber).padStart(S.digits, '0');
    var form = K.card({ title: 'Invoice issuer', body: K.form([K.field('Invoice legal name', inp('legalName', S.legalName)), K.field('Company number', inp('companyNumber', S.companyNumber)), K.field('Address', inp('address', S.address), '', true)], 2) }) +
      K.card({ title: 'VAT', body: K.form([K.field('VAT registered', K.select('vatRegistered', [['yes', 'Yes'], ['no', 'No']], S.vatRegistered ? 'yes' : 'no')), K.field('VAT number', inp('vatNumber', S.vatNumber)), K.field('Default VAT rate (%)', inp('vatRate', S.vatRate, { type: 'number' })), K.field('Default VAT treatment', K.select('vatTreatment', ['Standard rated', 'Zero rated', 'Exempt', 'Outside scope'], S.vatTreatment))], 2) }) +
      K.card({ title: 'Payment and numbering', body: K.form([K.field('Default payment terms (days)', inp('paymentTerms', S.paymentTerms, { type: 'number' })), K.field('Coach payment day (of month)', inp('coachPaymentDay', S.coachPaymentDay, { type: 'number' })), K.field('Invoice number authority', K.select('numberAuthority', [['Hub', 'Hub issues numbers'], ['Xero', 'Xero issues numbers']], S.numberAuthority), 'The Hub never reuses a number.'), K.field('Prefix', inp('prefix', S.prefix)), K.field('Next number', inp('nextNumber', S.nextNumber, { type: 'number' }), 'Next invoice: <b>' + esc(next) + '</b>'), K.field('Digits', inp('digits', S.digits, { type: 'number' }))], 3) });
    var foot = '<div class="k-bar">' + K.stamp('Last changed', S.updatedBy, S.updatedAt) + '<span class="k-bar__spacer"></span>' + (can() ? K.actBtn('Save settings', 'fin-settings-save', {}, { variant: 'primary' }) : '<span class="k-note">Finance View: settings are read only.</span>') + '</div>';
    return K.page(h, form + foot, 'fin');
  };

  /* ================================================================ CLIENTS */
  route('mgmt-fin-clients', 'Clients');
  route('mgmt-fin-client', function () { var c = db.getClient(K.param()); return c ? c.name : 'Client'; });
  function svcState(s) { var p = s.periods[s.periods.length - 1]; return p.state; }
  Hub.screens['mgmt-fin-clients'] = function (ctx) {
    var h = head('mgmt-fin-clients', { title: 'Clients', sub: 'Schools and organisations invoiced by the Hub.' }); var g = gate(ctx, h); if (g) return g;
    var rows = db.getClients().map(function (c) {
      var inv = db.getInvoices(function (i) { return i.client === c.id; }), bal = K.sum(inv, function (i) { return Math.max(0, F.balance(i)); });
      return { route: 'mgmt-fin-client/' + c.id, cells: [K.cell(esc(c.name), esc(c.id) + ' · ' + esc(c.contact)), { cls: 'c-cell', html: db.getServices(c.id).map(function (s) { return esc(s.name) + ' ' + K.status(svcState(s)); }).join('<br>') }, { cls: 'c-cell', html: (c.termsOverride ? c.terms + ' days (client-specific)' : c.terms + ' days') + (c.poRequired ? '<br><small class="c-mute">PO required</small>' : '') }, { cls: 'c-num', html: M(bal) }, { html: K.status(c.status) }] };
    });
    return K.page(h, K.table({ cols: 'minmax(0,1.5fr) minmax(0,1.6fr) 130px 110px 90px', head: ['Client', 'Services', 'Terms', { label: 'Owed', cls: 'c-num' }, 'Status'], rows: rows }), 'fin');
  };
  Hub.actions['fin-svc-state'] = function (el) {
    Hub.openSheet({ title: el.dataset.state + ' service', body: K.form([K.field('From', K.input('svc_from', K.today, { type: 'date' })), K.field('Reason', K.input('svc_reason', '', { placeholder: 'Required' }))], 1),
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Save', 'fin-svc-state-save', { id: el.dataset.id, state: el.dataset.state }, { variant: 'primary' }) });
  };
  Hub.actions['fin-svc-state-save'] = function (el) { var r = K.val('svc_reason'); if (!r) { Hub.toast('A reason is required'); return; } var f = K.val('svc_from'); Hub.closeSheet(true); Hub.mutate(function () { db.setServiceState(el.dataset.id, el.dataset.state, f, r); }, 'Service ' + el.dataset.state.toLowerCase()); };
  Hub.actions['fin-term-new'] = function (el) {
    Hub.openSheet({ title: 'New commercial terms', meta: '<p class="k-note">Terms are effective-dated. Adding terms ends the current ones the day before; nothing is edited.</p>', body: K.form([
      K.field('Effective from', K.input('t_from', '2026-10-01', { type: 'date' })), K.field('Payer', K.select('t_payer', ['Client', 'Parent'], 'Client')), K.field('Charge type', K.select('t_charge', ['Per session', 'Per class', 'Per place per day', 'Subscription'], 'Per session')),
      K.field('Amount (£, net)', K.input('t_amount', '50.00')), K.field('VAT treatment', K.select('t_vat', ['Standard', 'Zero', 'Exempt'], 'Standard')), K.field('VAT rate (%)', K.input('t_rate', '20', { type: 'number' })),
      K.field('Default quantity', K.input('t_qty', '1', { type: 'number' })), K.field('Subscription frequency', K.select('t_freq', [['', 'Not a subscription'], ['Monthly', 'Monthly'], ['Termly', 'Termly']], ''))], 3),
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Add terms', 'fin-term-save', { svc: el.dataset.svc }, { variant: 'primary' }) });
  };
  Hub.actions['fin-term-save'] = function (el) {
    var t = { service: el.dataset.svc, from: K.val('t_from'), to: null, payer: K.val('t_payer'), charge: K.val('t_charge'), amount: Math.round(parseFloat(K.val('t_amount')) * 100), vat: K.val('t_vat'), rate: +K.val('t_rate'), qty: +K.val('t_qty') || 1, frequency: K.val('t_freq') || null };
    if (!t.amount) { Hub.toast('Enter an amount'); return; }
    Hub.closeSheet(true); Hub.mutate(function () { db.addTerm(t); }, 'New terms added');
  };
  Hub.actions['fin-ovr-new'] = function (el) {
    var c = el.dataset.client, occs = [];
    db.getServices(c).forEach(function (s) { if (s.session) occs = occs.concat(db.getOccurrences(function (o) { return o.sessionId === s.session && o.status === 'Completed'; })); });
    Hub.openSheet({ title: 'Change charge for a session', body: K.form([K.field('Session', K.select('o_occ', occs.slice(-12).map(function (o) { return [o.id, K.dd(o.date) + ' · ' + o.session]; }))), K.field('Change', K.select('o_type', ['Not billable', 'Quantity', 'Amount'])), K.field('Value (quantity or £)', K.input('o_val', '')), K.field('Reason', K.input('o_reason', '', { placeholder: 'Required' }), '', true)], 2),
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Save change', 'fin-ovr-save', {}, { variant: 'primary' }) });
  };
  Hub.actions['fin-ovr-save'] = function () {
    var type = K.val('o_type'), v = K.val('o_val'), r = K.val('o_reason'); if (!r) { Hub.toast('A reason is required'); return; }
    var o = { occurrence: K.val('o_occ'), type: type, value: type === 'Not billable' ? null : type === 'Amount' ? Math.round(parseFloat(v || '0') * 100) : +v, reason: r };
    Hub.closeSheet(true); Hub.mutate(function () { db.addOverride(o); }, 'Override added');
  };
  Hub.actions['fin-ovr-remove'] = function (el) { Hub.mutate(function () { db.removeOverride(el.dataset.id, 'Removed from the client page'); }, 'Charge change removed'); };
  Hub.actions['fin-client-edit'] = function (el) {
    var c = db.getClient(el.dataset.id);
    Hub.openSheet({ title: 'Billing details · ' + esc(c.name), body: K.form([K.field('Billing contact', K.input('c_contact', c.contact)), K.field('Billing email', K.input('c_email', c.email)), K.field('CC emails', K.input('c_cc', c.cc)), K.field('Client-specific payment terms (days)', K.input('c_terms', c.termsOverride ? c.terms : '', { placeholder: 'Organisation default' })), K.field('PO required', K.select('c_po', [['yes', 'Yes'], ['no', 'No']], c.poRequired ? 'yes' : 'no')), K.field('Billing method', K.select('c_method', ['Email PDF', 'Email PDF + accounting app', 'Post'], c.method)), K.field('Status', K.select('c_status', ['Active', 'Paused', 'Ended'], c.status))], 2),
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Save', 'fin-client-save', { id: c.id }, { variant: 'primary' }) });
  };
  Hub.actions['fin-client-save'] = function (el) {
    var t = K.val('c_terms'), patch = { contact: K.val('c_contact'), email: K.val('c_email'), cc: K.val('c_cc'), poRequired: K.val('c_po') === 'yes', method: K.val('c_method'), status: K.val('c_status') };
    if (t) { patch.terms = +t; patch.termsOverride = 'Client-specific: ' + t + ' days'; } else { patch.terms = db.getFinanceSettings().paymentTerms; patch.termsOverride = null; }
    Hub.closeSheet(true); Hub.mutate(function () { db.updateClient(el.dataset.id, patch); }, 'Client updated');
  };
  Hub.screens['mgmt-fin-client'] = function (ctx) {
    var c = db.getClient(ctx.param) || db.getClients()[0];
    var h = head('mgmt-fin-clients', { back: ['mgmt-fin-clients', 'Clients'], eyebrow: 'Finance · Client · ' + c.id, title: c.name, sub: esc(c.contact) + ' · ' + esc(c.email), actions: can() ? K.actBtn('Edit billing details', 'fin-client-edit', { id: c.id }, { variant: 'secondary', icon: 'settings' }) + K.goBtn('New invoice draft', 'mgmt-fin-drafts', { variant: 'primary', icon: 'plus' }) : '' });
    var g = gate(ctx, h); if (g) return g;
    var details = K.card({ title: 'Billing', body: K.kv([['Billing contact', esc(c.contact)], ['Billing email', esc(c.email)], ['CC', esc(c.cc || '—')], ['Payment terms', c.terms + ' days' + (c.termsOverride ? ' · <span class="c-mute">' + esc(c.termsOverride) + '</span>' : ' · organisation default')], ['PO required', c.poRequired ? 'Yes' : 'No'], ['Billing method', esc(c.method)], ['Status', K.status(c.status)]]) });
    var services = db.getServices(c.id).map(function (s) {
      var terms = db.getTerms(s.id);
      return K.card({ title: s.name, sub: s.id + (s.session ? ' · delivered as ' + esc(db.getSession(s.session).name) : ''), right: K.status(svcState(s)) + (can() ? '<span class="k-row-actions">' + (svcState(s) !== 'Active' ? K.actBtn('Resume', 'fin-svc-state', { id: s.id, state: 'Active' }, { variant: 'tertiary', size: 'sm' }) : K.actBtn('Pause', 'fin-svc-state', { id: s.id, state: 'Paused' }, { variant: 'tertiary', size: 'sm' })) + (svcState(s) !== 'Ended' ? K.actBtn('End', 'fin-svc-state', { id: s.id, state: 'Ended' }, { variant: 'tertiary', size: 'sm' }) : '') + '</span>' : ''),
        body: '<p class="k-note">Status: ' + s.periods.map(function (p) { return '<b>' + esc(p.state) + '</b> ' + K.dm(p.from) + (p.to ? '–' + K.dm(p.to) : ' onwards') + (p.reason ? ' (' + esc(p.reason) + ')' : ''); }).join(' · ') + '</p>' +
          K.table({ cols: '170px minmax(0,1fr) 120px 110px 80px', head: ['Effective', 'Charge', { label: 'Amount', cls: 'c-num' }, 'VAT', 'Qty'], rows: terms.map(function (t) { return { cells: [{ cls: 'c-cell', html: K.dm(t.from) + ' – ' + (t.to ? K.dm(t.to) : 'open') + (t.to ? '' : ' ' + K.pill('Current', 'ok')) }, K.cell(esc(t.payer + ' · ' + t.charge) + (t.frequency ? ' · ' + esc(t.frequency) : ''), K.stamp('Set', t.by, t.at)), { cls: 'c-num', html: M(t.amount) }, { cls: 'c-cell', html: esc(t.vat) + ' ' + t.rate + '%' }, { cls: 'c-cell', html: String(t.qty) }] }; }) }) +
          (can() ? '<div class="k-bar" style="margin-top:10px">' + K.actBtn('New terms', 'fin-term-new', { svc: s.id }, { variant: 'secondary', size: 'sm', icon: 'plus' }) + '<span class="k-note">Terms are never edited; new terms start on their effective date.</span></div>' : '') });
    }).join('');
    var ovs = db.getBillingOverrides().filter(function (o) { var occ = db.getOccurrence(o.occurrence); return occ && db.getServices(c.id).some(function (s) { return s.session === occ.sessionId; }); });
    var overrides = K.section('Charge changes for single sessions', 'Not billable, a different quantity or a different amount, always with a reason.', K.table({ cols: 'minmax(0,1.3fr) 130px minmax(0,1.6fr) minmax(0,1.2fr) 110px', head: ['Session', 'Change', 'Reason', 'By', ''], empty: 'No charge changes for this client.', rows: ovs.map(function (o) { var occ = db.getOccurrence(o.occurrence); return { cells: [K.cell(esc(occ.session), K.dd(occ.date)), { html: K.pill(o.type + (o.value != null ? ': ' + (o.type === 'Amount' ? M(o.value) : o.value) : ''), o.removed ? '' : 'info') }, { cls: 'c-cell', html: esc(o.reason) + (o.removed ? '<br><small class="c-mute">Removed: ' + esc(o.removed.reason) + '</small>' : '') }, { cls: 'c-cell', html: K.stamp('Set', o.by, o.at) }, { cls: 'c-end', html: !o.removed && can() ? K.actBtn('Remove', 'fin-ovr-remove', { id: o.id }, { variant: 'tertiary', size: 'sm' }) : '' }] }; }) }), can() ? K.actBtn('Change charge for a session', 'fin-ovr-new', { client: c.id }, { variant: 'secondary', size: 'sm', icon: 'plus' }) : '');
    var inv = db.getInvoices(function (i) { return i.client === c.id; });
    var credits = db.getClientCredits(c.id);
    return K.page(h, K.grid([details, K.card({ title: 'Account', body: K.kv([['Invoices issued', String(inv.length)], ['Owed now', M(K.sum(inv, function (i) { return Math.max(0, F.balance(i)); }))], ['Client credit available', M(K.sum(credits, function (x) { return F.creditRemaining(x); }))]]) })], 2) +
      K.section('Services and commercial terms', 'Each service has active periods and dated terms.', services) + overrides + K.section('Invoices', '', invoiceTable(inv)), 'fin');
  };

  /* ================================================================ DRAFTS */
  route('mgmt-fin-drafts', 'Invoice drafts');
  route('mgmt-fin-draft', function () { var d = db.getDraft(K.param()); return d ? 'Draft ' + d.id : 'Draft'; });
  Hub.actions['fin-draft-new'] = function () {
    Hub.openSheet({ title: 'New invoice draft', body: K.form([K.field('Client', K.select('d_client', db.getClients().map(function (c) { return [c.id, c.name]; }), 'CLI-01')), K.field('Period', K.select('d_month', [['2026-09', 'September 2026'], ['2026-10', 'October 2026 (to date)']], '2026-09'))], 1) + '<p class="k-note">The Hub lists every delivered session for the client’s services in that month, priced from the commercial terms in force on each date.</p>',
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Build draft', 'fin-draft-create', {}, { variant: 'primary' }) });
  };
  Hub.actions['fin-draft-create'] = function () { var c = K.val('d_client'), m = K.val('d_month'); Hub.closeSheet(true); var d = Hub.mutate(function () { return db.createDraft(c, m); }, 'Draft built'); location.hash = 'mgmt-fin-draft/' + d.id; };
  Hub.screens['mgmt-fin-drafts'] = function (ctx) {
    var h = head('mgmt-fin-drafts', { title: 'Invoice drafts', sub: 'Build an invoice from delivered sessions, review the lines, then issue it.', actions: can() ? K.actBtn('New draft', 'fin-draft-new', {}, { variant: 'primary', icon: 'plus' }) : '' });
    var g = gate(ctx, h, { empty: ['inbox', 'No drafts', 'Start a draft for a client and month.'] }); if (g) return g;
    var rows = db.getDrafts().map(function (d) { var t = F.totals(d.lines), p = db.draftProblems(d); return { route: 'mgmt-fin-draft/' + d.id, cells: [K.cell(esc(clientName(d.client)), esc(d.id) + ' · ' + monthName(d.period) + (d.replaces ? ' · replaces ' + esc(db.getInvoice(d.replaces).number) : '')), { html: K.status(d.state) }, { cls: 'c-cell', html: d.state === 'Issued' ? 'Issued as ' + esc(db.getInvoice(d.invoice).number) : p.length ? '<span class="text-warn">' + p.length + ' to resolve</span>' : 'Ready' }, { cls: 'c-cell', html: 'Revision ' + d.revision }, { cls: 'c-num', html: M(t.gross) }] }; });
    return K.page(h, K.table({ cols: 'minmax(0,1.6fr) 140px minmax(0,1.2fr) 100px 110px', head: ['Client', 'State', 'Checks', 'Revision', { label: 'Total', cls: 'c-num' }], rows: rows }), 'fin');
  };
  Hub.actions['fin-line'] = function (el) {
    if (el.dataset.inc === '1') { Hub.mutate(function () { db.setDraftLine(el.dataset.d, el.dataset.l, true, ''); }, 'Line included'); return; }
    Hub.openSheet({ title: 'Exclude this line', body: K.form([K.field('Reason', K.select('x_reason_pick', ['Session cut short: agreed no charge', 'Charged on another invoice', 'Goodwill: client complaint', 'Other'], 'Session cut short: agreed no charge')), K.field('Note', K.input('x_note', '', { placeholder: 'Optional detail' }))], 1) + '<p class="k-note">Excluded lines are listed on the issued invoice as approved omissions.</p>',
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Exclude line', 'fin-line-x', { d: el.dataset.d, l: el.dataset.l }, { variant: 'primary' }) });
  };
  Hub.actions['fin-line-x'] = function (el) { var r = K.val('x_reason_pick') + (K.val('x_note') ? ': ' + K.val('x_note') : ''); Hub.closeSheet(true); Hub.mutate(function () { db.setDraftLine(el.dataset.d, el.dataset.l, false, r); }, 'Line excluded'); };
  Hub.actions['fin-po'] = function (el) { var po = K.val('po'), ov = K.val('po_override'); if (!po && !ov) { Hub.toast('Enter a PO number or a reason for not having one'); return; } Hub.mutate(function () { db.setDraftPO(el.dataset.d, po, po ? '' : ov); }, po ? 'PO number saved' : 'PO reason saved'); };
  Hub.actions['fin-ready'] = function (el) { var d = db.getDraft(el.dataset.d), p = db.draftProblems(d); if (p.length) { Hub.toast(p[0]); return; } Hub.mutate(function () { db.readyDraft(d.id); }, 'Ready for issue'); };
  Hub.actions['fin-issue'] = function (el) {
    var d = db.getDraft(el.dataset.d), t = F.totals(d.lines), S = db.getFinanceSettings(), c = db.getClient(d.client);
    Hub.openSheet({ overline: '<span class="overline">Confirm issue</span>', title: 'Issue invoice ' + esc(S.prefix + String(S.nextNumber).padStart(S.digits, '0')), body:
      K.kv([['Client', esc(c.name)], ['Period', monthName(d.period)], ['Lines', t.count + ' included · ' + d.lines.filter(function (l) { return !l.include; }).length + ' omitted'], ['Net', M(t.net)], ['VAT', M(t.vat)], ['Total', '<b>' + M(t.gross) + '</b>'], ['Payment terms', d.terms + ' days (' + esc(d.termsSource) + ')'], ['PO', esc(d.po || ('No PO: ' + d.poOverride))]]) +
      '<div class="k-sensitive"><span class="k-sensitive__tag">' + I('shield', 'icon-sm') + 'After issue</span><p class="k-note">The lines, totals and issuer details are frozen. Corrections are made with a credit note and, if needed, a replacement invoice. The number cannot be reused.</p></div>',
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Issue invoice', 'fin-issue-go', { d: d.id }, { variant: 'primary' }) });
  };
  Hub.actions['fin-issue-go'] = function (el) { Hub.closeSheet(true); var i = Hub.mutate(function () { return db.issueDraft(el.dataset.d); }, 'Invoice issued'); location.hash = 'mgmt-fin-invoice/' + i.id; };
  Hub.screens['mgmt-fin-draft'] = function (ctx) {
    var d = db.getDraft(ctx.param) || db.getDrafts()[0], c = db.getClient(d.client), t = F.totals(d.lines), probs = db.draftProblems(d), editable = can() && d.state !== 'Issued';
    var h = head('mgmt-fin-drafts', { back: ['mgmt-fin-drafts', 'Drafts'], eyebrow: 'Invoice draft · ' + d.id, title: clientName(d.client) + ' · ' + monthName(d.period), sub: K.stamp('Created', d.createdBy, d.at) + ' · revision ' + d.revision,
      actions: K.status(d.state) + (editable && d.state === 'Draft' ? K.actBtn('Mark ready for issue', 'fin-ready', { d: d.id }, { variant: 'secondary' }) : '') + (editable && d.state === 'Ready for issue' ? K.actBtn('Issue invoice', 'fin-issue', { d: d.id }, { variant: 'primary', trail: 'arrowRight' }) : '') + (d.state === 'Issued' ? K.goBtn('Open ' + db.getInvoice(d.invoice).number, 'mgmt-fin-invoice/' + d.invoice, { variant: 'primary' }) : '') });
    var g = gate(ctx, h); if (g) return g;
    var steps = K.steps(['Build draft', 'Review lines', 'Ready for issue', 'Issued'], d.state === 'Issued' ? 3 : d.state === 'Ready for issue' ? 2 : 1);
    var exc = d.lines.filter(function (l) { return l.exception === 'Missing terms'; });
    var notices = (exc.length ? ui.notice('warn', exc.length + ' session' + (exc.length > 1 ? 's have' : ' has') + ' no commercial terms', 'Add terms on the client page or leave the line excluded with its reason.', { action: K.goBtn('Open client', 'mgmt-fin-client/' + c.id, { variant: 'secondary', size: 'sm' }) }) : '') +
      (probs.length && d.state !== 'Issued' ? ui.notice('info', 'Before this can be issued', probs.map(esc).join('<br>')) : '');
    var lines = K.table({ cols: '88px minmax(0,2fr) 60px 100px 100px 130px', head: ['Include', 'Delivered session', 'Qty', { label: 'Unit (net)', cls: 'c-num' }, { label: 'Total (gross)', cls: 'c-num' }, ''], rows: d.lines.map(function (l) {
      F.price(l);
      return { cells: [{ html: K.pill(l.include ? 'Included' : 'Excluded', l.include ? 'ok' : (l.exception ? 'warn' : '')) },
        K.cell(esc(l.description), (l.exception ? '<span class="text-warn">' + esc(l.exception) + '</span> · ' : '') + (l.override ? 'Charge changed: ' + esc(l.override) + ' · ' : '') + (!l.include && l.reason ? esc(l.reason) : '') + (l.term ? ' ' + esc(l.term) : '')),
        { cls: 'c-cell', html: String(l.qty) }, { cls: 'c-num', html: l.unitNet == null ? '—' : M(l.unitNet) }, { cls: 'c-num', html: l.include ? M(l.gross) : '<s class="c-mute">' + M(l.gross) + '</s>' },
        { cls: 'c-end', html: editable && l.unitNet != null ? K.actBtn(l.include ? 'Exclude' : 'Include', 'fin-line', { d: d.id, l: l.id, inc: l.include ? '0' : '1' }, { variant: 'tertiary', size: 'sm' }) : '' }] };
    }), foot: '<span>' + t.count + ' lines included</span><span class="num">Net <b>' + M(t.net) + '</b> · VAT <b>' + M(t.vat) + '</b> · Total <b class="k-total">' + M(t.gross) + '</b></span>' });
    var po = K.card({ title: 'Purchase order and terms', body: K.kv([['PO required', c.poRequired ? 'Yes' : 'No'], ['Payment terms', d.terms + ' days · ' + esc(d.termsSource)]]) +
      (editable ? K.form([K.field('PO number', K.input('po', d.po, { placeholder: c.poRequired ? 'Required' : 'Optional' })), K.field('Or reason for no PO', K.input('po_override', d.poOverride, { placeholder: 'e.g. Client confirmed no PO this month' }))], 2) + '<div class="k-bar" style="margin-top:10px">' + K.actBtn('Save PO', 'fin-po', { d: d.id }, { variant: 'secondary', size: 'sm' }) + '</div>' : K.kv([['PO', esc(d.po || (d.poOverride ? 'No PO: ' + d.poOverride : '—'))]])) });
    return K.page(h, steps + notices + K.section('Eligible delivered sessions', 'Every completed session for ' + esc(c.name) + '’s services in ' + monthName(d.period) + '. Exclude lines with a reason.', lines) + K.grid([po, K.card({ title: 'History', body: K.timeline(d.history.slice().reverse()) })], 2), 'fin');
  };

  /* ================================================================ INVOICES */
  route('mgmt-fin-invoices', 'Invoices');
  route('mgmt-fin-invoice', function () { var i = db.getInvoice(K.param()); return i ? 'Invoice ' + i.number : 'Invoice'; });
  route('mgmt-fin-invoice-print', function () { var i = db.getInvoice(K.param()); return i ? 'Print ' + i.number : 'Invoice'; });
  function invoiceTable(list) {
    return K.table({ cols: '110px minmax(0,1.5fr) 110px 150px 130px 110px 110px', head: ['Number', 'Client', 'Issued', 'Status', 'Payment', { label: 'Total', cls: 'c-num' }, { label: 'Balance', cls: 'c-num' }], empty: 'No invoices.', rows: list.slice().reverse().map(function (i) {
      var ps = F.paymentState(i);
      return { route: 'mgmt-fin-invoice/' + i.id, cells: [{ cls: 'c-cell', html: '<b>' + esc(i.number) + '</b>' }, K.cell(esc(clientName(i.client)), monthName(i.period)), { cls: 'c-cell', html: K.dm(i.issued) }, { html: K.status(F.invoiceState(i)) }, { html: K.status(ps) + (ps === 'Overdue' ? '<br><small class="c-mute">due ' + K.dm(i.due) + '</small>' : '') }, { cls: 'c-num', html: M(i.gross) }, { cls: 'c-num', html: M(Math.max(0, F.balance(i))) }] };
    }) });
  }
  Hub.screens['mgmt-fin-invoices'] = function (ctx) {
    var h = head('mgmt-fin-invoices', { title: 'Invoices', sub: 'Issued invoices are frozen. Corrections use credit notes and replacement invoices.', actions: can() ? K.actBtn('New draft', 'fin-draft-new', {}, { variant: 'primary', icon: 'plus' }) : '' });
    var g = gate(ctx, h, { empty: ['inbox', 'No invoices yet', 'Issued invoices appear here.'] }); if (g) return g;
    var f = K.tab('fin-inv-f', [{ id: 'all' }, { id: 'open' }, { id: 'overdue' }, { id: 'paid' }, { id: 'credited' }]);
    var list = db.getInvoices().filter(function (i) { var ps = F.paymentState(i), st = F.invoiceState(i); return f === 'all' || (f === 'open' && (ps === 'Unpaid' || ps === 'Part paid' || ps === 'Overdue')) || (f === 'overdue' && ps === 'Overdue') || (f === 'paid' && ps === 'Paid') || (f === 'credited' && st !== 'Issued'); });
    var r = F.receivables();
    var ageing = K.stats([{ label: 'Owed to us', value: M(r.total), sub: 'All open invoices' }, { label: 'Not yet due', value: M(r.current) }, { label: '1–30 days overdue', value: M(r.d1_30), tone: r.d1_30 ? 'warn' : '' }, { label: 'Over 30 days', value: M(r.d31_60 + r.d60) }]);
    var seg = K.seg('fin-inv-f', [{ id: 'all', label: 'All' }, { id: 'open', label: 'Open' }, { id: 'overdue', label: 'Overdue' }, { id: 'paid', label: 'Paid' }, { id: 'credited', label: 'Credited' }]);
    return K.page(h, K.section('Money owed, by age', 'Balances by how late they are today.', ageing) + K.section('All invoices', list.length + ' shown', seg + invoiceTable(list)), 'fin');
  };
  /* Invoice actions */
  Hub.actions['fin-send'] = function (el) { Hub.mutate(function () { db.sendInvoice(el.dataset.id); }, 'Invoice sent'); };
  Hub.actions['fin-pdf'] = function (el) { location.hash = 'mgmt-fin-invoice-print/' + el.dataset.id; Hub.toast('PDF ready to save from the print view'); };
  Hub.actions['fin-xero'] = function (el) { Hub.mutate(function () { db.retryXero(el.dataset.id); }, 'Sent to Xero'); };
  Hub.actions['fin-due'] = function (el) {
    var i = db.getInvoice(el.dataset.id);
    Hub.openSheet({ title: 'Change due date · ' + esc(i.number), body: K.kv([['Current due date', K.d(i.due)], ['Original due date', K.d(i.originalDue || i.due)]]) + K.form([K.field('New due date', K.input('due_to', K.addDays(i.due, 14), { type: 'date' })), K.field('Reason', K.input('due_reason', '', { placeholder: 'Required' }))], 1) + '<p class="k-note">The original due date is kept on the invoice.</p>',
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Change due date', 'fin-due-save', { id: i.id }, { variant: 'primary' }) });
  };
  Hub.actions['fin-due-save'] = function (el) { var r = K.val('due_reason'), d = K.val('due_to'); if (!r) { Hub.toast('A reason is required'); return; } Hub.closeSheet(true); Hub.mutate(function () { db.changeDueDate(el.dataset.id, d, r); }, 'Due date changed'); };
  Hub.actions['fin-pay'] = function (el) {
    var i = db.getInvoice(el.dataset.id), b = Math.max(0, F.balance(i));
    Hub.openSheet({ title: 'Record payment · ' + esc(i.number), meta: '<p class="k-note">Balance ' + M(b) + '. A part payment leaves the rest open. More than the balance creates a client credit.</p>', body: K.form([K.field('Amount (£)', K.input('pay_amount', (b / 100).toFixed(2))), K.field('Date', K.input('pay_date', K.today, { type: 'date' })), K.field('Method', K.select('pay_method', ['Bank transfer', 'Card', 'Cheque', 'Cash'], 'Bank transfer')), K.field('Reference', K.input('pay_ref', 'BACS ' + i.number))], 2),
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Record payment', 'fin-pay-save', { id: i.id }, { variant: 'primary' }) });
  };
  Hub.actions['fin-pay-save'] = function (el) { var a = Math.round(parseFloat(K.val('pay_amount')) * 100); if (!a || a <= 0) { Hub.toast('Enter an amount'); return; } var m = K.val('pay_method'), r = K.val('pay_ref'), d = K.val('pay_date'); Hub.closeSheet(true); Hub.mutate(function () { db.recordPayment(el.dataset.id, a, m, r, d); }, 'Payment recorded'); };
  Hub.actions['fin-reverse'] = function (el) {
    Hub.openSheet({ title: 'Reverse payment ' + esc(el.dataset.id), body: K.form([K.field('Reason', K.input('rev_reason', '', { placeholder: 'e.g. Entered twice in error' }))], 1) + '<p class="k-note">The payment stays in history. A reversal entry for the same amount is added beside it.</p>',
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Add reversal', 'fin-reverse-save', { id: el.dataset.id }, { variant: 'primary' }) });
  };
  Hub.actions['fin-reverse-save'] = function (el) { var r = K.val('rev_reason'); if (!r) { Hub.toast('A reason is required'); return; } Hub.closeSheet(true); Hub.mutate(function () { db.reversePayment(el.dataset.id, r); }, 'Payment reversed'); };
  Hub.actions['fin-cn'] = function (el) {
    var i = db.getInvoice(el.dataset.id), done = db.creditedLines(i.id);
    var opts = i.lines.filter(function (l) { return done.indexOf(l.id) < 0; });
    Hub.openSheet({ title: 'Raise credit note · ' + esc(i.number), meta: '<p class="k-note">Credit whole lines only. The invoice stays as issued.</p>', body: '<div class="fin-checks">' + opts.map(function (l, n) { return '<label class="fin-check"><input type="checkbox" name="cn_line" value="' + esc(l.id) + '"' + (n === opts.length - 1 ? ' checked' : '') + '><span><b>' + esc(l.description) + '</b><small>' + M(l.gross) + '</small></span></label>'; }).join('') + '</div>' + K.form([K.field('Reason', K.input('cn_reason', '', { placeholder: 'Required' }))], 1),
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Raise credit note', 'fin-cn-save', { id: i.id }, { variant: 'primary' }) });
  };
  Hub.actions['fin-cn-save'] = function (el) {
    var ids = Array.prototype.slice.call(document.querySelectorAll('[name="cn_line"]:checked')).map(function (x) { return x.value; }), r = K.val('cn_reason');
    if (!ids.length) { Hub.toast('Pick at least one line'); return; } if (!r) { Hub.toast('A reason is required'); return; }
    Hub.closeSheet(true); Hub.mutate(function () { db.raiseCreditNote(el.dataset.id, ids, r); }, 'Credit note raised');
  };
  Hub.actions['fin-apply'] = function (el) {
    var i = db.getInvoice(el.dataset.id), list = db.getClientCredits(i.client).filter(function (c) { return F.creditRemaining(c) > 0; });
    if (!list.length) { Hub.toast('No client credit available for ' + clientName(i.client)); return; }
    var b = Math.max(0, F.balance(i));
    Hub.openSheet({ title: 'Apply client credit · ' + esc(i.number), body: K.form([K.field('Credit', K.select('cc_id', list.map(function (c) { return [c.id, c.id + ' · ' + c.source + ' · ' + M(F.creditRemaining(c)) + ' left']; }))), K.field('Amount (£)', K.input('cc_amount', (Math.min(b, F.creditRemaining(list[0])) / 100).toFixed(2)))], 1),
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Apply credit', 'fin-apply-save', { id: i.id }, { variant: 'primary' }) });
  };
  Hub.actions['fin-apply-save'] = function (el) { var c = K.val('cc_id'), a = Math.round(parseFloat(K.val('cc_amount')) * 100); if (!a) { Hub.toast('Enter an amount'); return; } Hub.closeSheet(true); Hub.mutate(function () { db.applyClientCredit(c, el.dataset.id, a); }, 'Client credit applied'); };
  Hub.actions['fin-replace'] = function (el) {
    Hub.openSheet({ title: 'Correct with a replacement invoice', body: '<p class="k-note">The open lines are credited in full by a credit note, and a new draft is created with the same lines for you to correct and issue. The original invoice is never edited.</p>' + K.form([K.field('Reason', K.input('rep_reason', '', { placeholder: 'e.g. Wrong client address on the invoice' }))], 1),
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Credit and create replacement', 'fin-replace-go', { id: el.dataset.id }, { variant: 'primary' }) });
  };
  Hub.actions['fin-replace-go'] = function (el) { var r = K.val('rep_reason'); if (!r) { Hub.toast('A reason is required'); return; } Hub.closeSheet(true); var d = Hub.mutate(function () { return db.replaceInvoice(el.dataset.id, r); }, 'Replacement draft created'); location.hash = 'mgmt-fin-draft/' + d.id; };
  Hub.screens['mgmt-fin-invoice'] = function (ctx) {
    var i = db.getInvoice(ctx.param) || db.getInvoices()[0], c = db.getClient(i.client), ps = F.paymentState(i), bal = F.balance(i), done = db.creditedLines(i.id), w = can() && F.invoiceState(i) !== 'Credited';
    var acts = can() ? K.actBtn('Send', 'fin-send', { id: i.id }, { variant: 'secondary', icon: 'external' }) + K.actBtn('Download PDF', 'fin-pdf', { id: i.id }, { variant: 'secondary', icon: 'download' }) : K.goBtn('Print view', 'mgmt-fin-invoice-print/' + i.id, { variant: 'secondary', icon: 'download' });
    var h = head('mgmt-fin-invoices', { back: ['mgmt-fin-invoices', 'Invoices'], eyebrow: 'Invoice · ' + i.id, title: i.number + ' · ' + c.name, sub: K.frozen('Issued · frozen') + ' ' + K.stamp('Issued', i.issuedBy, i.issued + 'T15:30'), actions: acts });
    var g = gate(ctx, h); if (g) return g;
    var figs = K.stats([{ label: 'Total', value: M(i.gross), sub: 'Net ' + M(i.net) + ' · VAT ' + M(i.vat) }, { label: 'Credited', value: M(F.creditedOn(i.id)), sub: F.invoiceState(i) }, { label: 'Paid and applied', value: M(F.paidOn(i.id) + F.appliedCreditOn(i.id)) }, { label: 'Balance', value: M(Math.max(0, bal)), sub: ps + ' · due ' + K.dm(i.due), tone: ps === 'Overdue' ? 'warn' : '' }]);
    var lines = K.table({ cols: 'minmax(0,2fr) 60px 110px 90px 110px', head: ['Line (as issued)', 'Qty', { label: 'Unit (net)', cls: 'c-num' }, { label: 'VAT', cls: 'c-num' }, { label: 'Gross', cls: 'c-num' }], rows: i.lines.map(function (l) { var cr = done.indexOf(l.id) >= 0; return { cells: [K.cell(esc(l.description) + (cr ? ' ' + K.pill('Credited', '') : ''), l.occurrence ? esc(l.occurrence) : ''), { cls: 'c-cell', html: String(l.qty) }, { cls: 'c-num', html: M(l.unitNet) }, { cls: 'c-num', html: M(l.vat) }, { cls: 'c-num', html: cr ? '<s>' + M(l.gross) + '</s>' : M(l.gross) }] }; }),
      foot: '<span>' + i.lines.length + ' lines</span><span class="num">Net <b>' + M(i.net) + '</b> · VAT <b>' + M(i.vat) + '</b> · Total <b class="k-total">' + M(i.gross) + '</b></span>' });
    var omis = i.omissions.length ? K.card({ title: 'Approved omissions', sub: 'Delivered sessions deliberately left off this invoice.', body: '<div class="lx-rows">' + i.omissions.map(function (o) { return '<div class="lx-row"><span class="lx-row__main"><b>' + esc(o.description) + '</b><small>' + esc(o.reason) + ' · approved by ' + esc(o.approvedBy) + '</small></span></div>'; }).join('') + '</div>' }) : '';
    var details = K.card({ title: 'Details', body: K.kv([['Bill to', esc(c.name) + '<br><small class="c-mute">' + esc(c.contact) + ' · ' + esc(c.email) + '</small>'], ['Period', monthName(i.period)], ['Issued', K.d(i.issued)], ['Due', K.d(i.due) + (i.originalDue && i.originalDue !== i.due ? '<br><small class="c-mute">Original due date ' + K.d(i.originalDue) + '</small>' : '')], ['Payment terms', i.terms + ' days · ' + esc(i.termsSource)], ['PO', esc(i.po || (i.poOverride ? 'No PO: ' + i.poOverride : '—'))], ['Your details as issued', esc(i.issuer.name) + '<br><small class="c-mute">' + esc(i.issuer.address) + ' · VAT ' + esc(i.issuer.vatNumber) + ' · Co. ' + esc(i.issuer.companyNumber) + '</small>'], ['Xero', K.status(i.xero.status) + (i.xero.ref ? ' ' + esc(i.xero.ref) : '') + (i.xero.error ? '<br><small class="c-mute">' + esc(i.xero.error) + '</small>' : '')]]) +
      (can() ? '<div class="k-bar" style="margin-top:12px">' + K.actBtn('Change due date', 'fin-due', { id: i.id }, { variant: 'tertiary', size: 'sm' }) + (i.xero.status !== 'Synced' ? K.actBtn('Retry Xero', 'fin-xero', { id: i.id }, { variant: 'tertiary', size: 'sm', icon: 'refresh' }) : '') + '</div>' : '') });
    var corrections = can() ? K.card({ title: 'Corrections', sub: 'Issued figures are never edited.', body: '<div class="k-bar">' + (w ? K.actBtn('Raise credit note', 'fin-cn', { id: i.id }, { variant: 'secondary', size: 'sm' }) : '') + (bal > 0 ? K.actBtn('Apply client credit', 'fin-apply', { id: i.id }, { variant: 'secondary', size: 'sm' }) : '') + (w ? K.actBtn('Correct with replacement invoice', 'fin-replace', { id: i.id }, { variant: 'tertiary', size: 'sm' }) : '') + '</div>' }) : '';
    var pays = db.getPayments(i.id), cns = db.getCreditNotes(i.id);
    var money = K.card({ title: 'Payments and credits', body: '<div class="lx-rows">' + pays.map(function (p) { var rev = db.isReversed(p.id); return '<div class="lx-row"><span class="lx-row__date num">' + K.dm(p.date) + '</span><span class="lx-row__main"><b>' + esc(p.method) + (p.reverses ? ' of ' + esc(p.reverses) : '') + (rev ? ' ' + K.pill('Reversed', 'danger') : '') + '</b><small>' + esc(p.id) + ' · ' + esc(p.ref) + ' · by ' + esc(p.by) + '</small></span><b class="lx-row__amt num">' + M(p.amount) + '</b>' + (can() && !p.reverses && !rev ? K.actBtn('Reverse', 'fin-reverse', { id: p.id }, { variant: 'tertiary', size: 'sm' }) : '') + '</div>'; }).join('') +
      cns.map(function (cn) { return '<div class="lx-row"><span class="lx-row__date num">' + K.dm(cn.at) + '</span><span class="lx-row__main"><b>Credit note ' + esc(cn.number) + ' ' + K.frozen('Frozen') + '</b><small>' + esc(cn.reason) + ' · by ' + esc(cn.by) + '</small></span><b class="lx-row__amt num">−' + M(cn.gross) + '</b></div>'; }).join('') +
      db.getClientCredits(i.client).map(function (cc) { return cc.applied.map(function (a) { return a.invoice === i.id ? '<div class="lx-row"><span class="lx-row__date num">' + K.dm(a.at) + '</span><span class="lx-row__main"><b>Client credit ' + esc(cc.id) + (a.removed ? ' ' + K.pill('Unapplied', '') : '') + '</b><small>by ' + esc(a.by) + '</small></span><b class="lx-row__amt num">−' + M(a.amount) + '</b></div>' : ''; }).join(''); }).join('') +
      (pays.length || cns.length ? '' : '<p class="k-note">Nothing received yet.</p>') + '</div>' });
    var late = ps === 'Overdue' ? K.daysBetween(i.due, K.today) : 0, payBtn = can() && bal > 0 ? K.actBtn('Record payment', 'fin-pay', { id: i.id }, { variant: 'primary' }) : '';
    var sit = F.invoiceState(i) === 'Credited' ? K.situation({ tone: 'ok', title: 'Credited in full', text: 'Nothing more to collect on this invoice.' }) :
      bal <= 0 ? K.situation({ tone: 'ok', title: 'Paid in full', text: M(i.gross) + ' received.' }) :
      ps === 'Overdue' ? K.situation({ tone: 'warn', kicker: M(bal) + ' outstanding', title: 'Payment overdue by ' + late + ' day' + (late === 1 ? '' : 's'), text: 'Was due ' + K.d(i.due) + '. Chase ' + esc(c.contact || c.name) + ', or record the payment if it has arrived.', primary: payBtn, secondary: can() ? K.actBtn('Send reminder', 'fin-send', { id: i.id }, { variant: 'secondary' }) : '' }) :
      K.situation({ tone: 'info', title: M(bal) + ' due on ' + K.d(i.due), text: 'Not late yet. No action needed until then.', primary: payBtn ? payBtn.replace('btn--primary', 'btn--secondary') : '' });
    return K.page(h, sit + figs + K.section('Lines', '', lines) + K.grid([details, '<div class="lx-stack">' + money + corrections + '</div>'], 2) + (omis ? K.details('Sessions left off this invoice', omis, { sub: i.omissions.length + ' approved' }) : '') + K.details('History', K.timeline(i.history.slice().reverse())), 'fin');
  };
  Hub.actions['fin-print'] = function () { window.print(); };
  Hub.screens['mgmt-fin-invoice-print'] = function (ctx) {
    var i = db.getInvoice(ctx.param) || db.getInvoices()[0], c = db.getClient(i.client);
    var h = K.head({ back: ['mgmt-fin-invoice/' + i.id, i.number], eyebrow: 'Printable invoice', title: i.number, actions: K.actBtn('Print or save as PDF', 'fin-print', {}, { variant: 'primary', icon: 'download' }) });
    var g = gate(ctx, h); if (g) return g;
    var doc = '<article class="k-doc"><div class="k-doc__grid" style="margin-top:0"><div><h1>Invoice</h1><p class="k-doc__muted">' + esc(i.number) + ' · issued ' + K.d(i.issued) + '</p></div><div style="text-align:right"><b>' + esc(i.issuer.name) + '</b><br><span class="k-doc__muted">' + esc(i.issuer.address) + '<br>VAT ' + esc(i.issuer.vatNumber) + ' · Company ' + esc(i.issuer.companyNumber) + '</span></div></div>' +
      '<div class="k-doc__grid"><div><b>Bill to</b><br>' + esc(c.name) + '<br><span class="k-doc__muted">' + esc(c.contact) + '<br>' + esc(c.email) + '</span></div><div style="text-align:right"><b>Due ' + K.d(i.due) + '</b><br><span class="k-doc__muted">Terms ' + i.terms + ' days' + (i.po ? '<br>PO ' + esc(i.po) : '') + '</span></div></div>' +
      '<table><thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Unit</th><th class="r">VAT</th><th class="r">Amount</th></tr></thead><tbody>' + i.lines.map(function (l) { return '<tr><td>' + esc(l.description) + '</td><td class="r">' + l.qty + '</td><td class="r">' + M(l.unitNet) + '</td><td class="r">' + l.rate + '%</td><td class="r">' + M(l.net) + '</td></tr>'; }).join('') + '</tbody></table>' +
      '<table style="max-width:300px;margin-left:auto"><tr><td>Net</td><td class="r">' + M(i.net) + '</td></tr><tr><td>VAT</td><td class="r">' + M(i.vat) + '</td></tr><tr><td><b>Total due</b></td><td class="r"><b>' + M(i.gross) + '</b></td></tr></table>' +
      '<p class="k-doc__muted" style="margin-top:28px">Please pay by bank transfer quoting ' + esc(i.number) + '. Thank you.</p></article>';
    return K.page(h, doc, 'fin');
  };

  /* ================================================================ CREDIT NOTES, PAYMENTS, CLIENT CREDITS */
  route('mgmt-fin-credit-notes', 'Credit notes');
  Hub.screens['mgmt-fin-credit-notes'] = function (ctx) {
    var h = head('mgmt-fin-credit-notes', { title: 'Credit notes', sub: 'Whole-line credits against an issued invoice. Each one is frozen once raised.' }); var g = gate(ctx, h, { empty: ['inbox', 'No credit notes', 'Credit notes appear here.'] }); if (g) return g;
    return K.page(h, K.table({ cols: '130px 110px minmax(0,1.4fr) minmax(0,1.6fr) 110px', head: ['Credit note', 'Invoice', 'Client', 'Reason', { label: 'Amount', cls: 'c-num' }], rows: db.getCreditNotes().map(function (c) { var i = db.getInvoice(c.invoice); return { route: 'mgmt-fin-invoice/' + i.id, cells: [K.cell('<b>' + esc(c.number) + '</b>', K.frozen('Frozen')), { cls: 'c-cell', html: esc(i.number) }, K.cell(esc(clientName(i.client)), c.lines.length + ' line' + (c.lines.length > 1 ? 's' : '')), K.cell(esc(c.reason), K.stamp('Raised', c.by, c.at)), { cls: 'c-num', html: M(c.gross) }] }; }) }), 'fin');
  };
  route('mgmt-fin-payments', 'Payments');
  Hub.screens['mgmt-fin-payments'] = function (ctx) {
    var h = head('mgmt-fin-payments', { title: 'Payments', sub: 'Client payments against invoices. Mistakes are corrected with a reversal entry, never deleted.' }); var g = gate(ctx, h, { empty: ['inbox', 'No payments yet', 'Payments appear here.'] }); if (g) return g;
    var open = db.getInvoices(function (i) { return F.balance(i) > 0; });
    var rec = can() && open.length ? K.card({ title: 'Record a payment', sub: 'Pick an open invoice.', body: '<div class="lx-rows">' + open.map(function (i) { return '<div class="lx-row"><span class="lx-row__main"><b>' + esc(i.number) + ' · ' + esc(clientName(i.client)) + '</b><small>Balance ' + M(F.balance(i)) + ' · ' + F.paymentState(i) + '</small></span>' + K.actBtn('Record payment', 'fin-pay', { id: i.id }, { variant: 'secondary', size: 'sm' }) + '</div>'; }).join('') + '</div>' }) : '';
    var t = K.table({ cols: '90px 110px 110px minmax(0,1.2fr) minmax(0,1.6fr) 110px 100px', head: ['Date', 'Payment', 'Invoice', 'Method', 'Reference', { label: 'Amount', cls: 'c-num' }, ''], rows: db.getPayments().slice().reverse().map(function (p) { var i = db.getInvoice(p.invoice), rev = db.isReversed(p.id); return { cells: [{ cls: 'c-cell', html: K.dm(p.date) }, { cls: 'c-cell', html: esc(p.id) }, { cls: 'c-cell', html: K.link('mgmt-fin-invoice/' + i.id, i.number) }, K.cell(esc(p.method), 'by ' + esc(p.by)), { cls: 'c-cell', html: esc(p.ref) + (rev ? ' ' + K.pill('Reversed', 'danger') : '') }, { cls: 'c-num', html: M(p.amount) }, { cls: 'c-end', html: can() && !p.reverses && !rev ? K.actBtn('Reverse', 'fin-reverse', { id: p.id }, { variant: 'tertiary', size: 'sm' }) : '' }] }; }) });
    return K.page(h, rec + K.section('All payments', '', t), 'fin');
  };
  route('mgmt-fin-client-credits', 'Client credits');
  Hub.actions['fin-cc-void'] = function (el) {
    Hub.openSheet({ title: 'Void client credit ' + esc(el.dataset.id), body: K.form([K.field('Reason', K.input('void_reason', '', { placeholder: 'Required' }))], 1), foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Void credit', 'fin-cc-void-save', { id: el.dataset.id }, { variant: 'primary' }) });
  };
  Hub.actions['fin-cc-void-save'] = function (el) { var r = K.val('void_reason'); if (!r) { Hub.toast('A reason is required'); return; } Hub.closeSheet(true); Hub.mutate(function () { db.voidClientCredit(el.dataset.id, r); }, 'Credit voided'); };
  Hub.actions['fin-cc-unapply'] = function (el) { Hub.mutate(function () { db.unapplyClientCredit(el.dataset.id, +el.dataset.idx, 'Applied to the wrong invoice'); }, 'Credit unapplied'); };
  Hub.actions['fin-cc-apply'] = function (el) {
    var c = db.getClientCredits().filter(function (x) { return x.id === el.dataset.id; })[0], inv = db.getInvoices(function (i) { return i.client === c.client && F.balance(i) > 0; });
    if (!inv.length) { Hub.toast('No open invoice for ' + clientName(c.client) + ' yet'); return; }
    Hub.openSheet({ title: 'Apply ' + esc(c.id), body: K.form([K.field('Invoice', K.select('cca_inv', inv.map(function (i) { return [i.id, i.number + ' · balance ' + M(F.balance(i))]; }))), K.field('Amount (£)', K.input('cca_amount', (Math.min(F.creditRemaining(c), F.balance(inv[0])) / 100).toFixed(2)))], 1),
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Apply', 'fin-cc-apply-save', { id: c.id }, { variant: 'primary' }) });
  };
  Hub.actions['fin-cc-apply-save'] = function (el) { var inv = K.val('cca_inv'), a = Math.round(parseFloat(K.val('cca_amount')) * 100); Hub.closeSheet(true); Hub.mutate(function () { db.applyClientCredit(el.dataset.id, inv, a); }, 'Credit applied'); };
  Hub.screens['mgmt-fin-client-credits'] = function (ctx) {
    var h = head('mgmt-fin-client-credits', { title: 'Client credits', sub: 'Created from a paid credit note or an overpayment. Apply to a later invoice, unapply, or void with a reason.' }); var g = gate(ctx, h, { empty: ['inbox', 'No client credits', 'Credits appear here.'] }); if (g) return g;
    return K.page(h, db.getClientCredits().map(function (c) {
      var rem = F.creditRemaining(c);
      return K.card({ title: c.id + ' · ' + clientName(c.client), sub: esc(c.source) + ' · ' + K.stamp('Created', c.by, c.at), right: c.voided ? K.pill('Void', '') : K.pill(M(rem) + ' left', rem ? 'ok' : ''),
        body: K.kv([['Original amount', M(c.amount)], ['Remaining', M(rem)], c.voided ? ['Voided', esc(c.voided.reason) + ' · ' + K.stamp('Voided', c.voided.by, c.voided.at)] : null]) +
          (c.applied.length ? '<div class="lx-rows">' + c.applied.map(function (a, n) { var inv = db.getInvoice(a.invoice); return '<div class="lx-row"><span class="lx-row__main"><b>Applied to ' + esc(inv.number) + (a.removed ? ' ' + K.pill('Unapplied', '') : '') + '</b><small>' + K.stamp('Applied', a.by, a.at) + '</small></span><b class="lx-row__amt num">' + M(a.amount) + '</b>' + (can() && !a.removed && !c.voided ? K.actBtn('Unapply', 'fin-cc-unapply', { id: c.id, idx: n }, { variant: 'tertiary', size: 'sm' }) : '') + '</div>'; }).join('') + '</div>' : '') +
          (can() && !c.voided && rem > 0 ? '<div class="k-bar" style="margin-top:10px">' + K.actBtn('Apply to an invoice', 'fin-cc-apply', { id: c.id }, { variant: 'secondary', size: 'sm' }) + K.actBtn('Void', 'fin-cc-void', { id: c.id }, { variant: 'tertiary', size: 'sm' }) + '</div>' : '') });
    }).join(''), 'fin');
  };

  /* ================================================================ PARENT MONEY */
  route('mgmt-fin-parent-money', 'Parent money');
  function famName(id) { return (db.getFamily(id) || {}).name || id; }
  function parName(id) { return (db.getParent(id) || {}).name || id; }
  Hub.actions['fin-refund'] = function () {
    Hub.openSheet({ title: 'Record a refund decision', body: K.form([K.field('Family', K.select('rf_fam', db.getFamilies().map(function (f) { return [f.id, f.name]; }))), K.field('Amount (£)', K.input('rf_amount', '21.75')), K.field('Method', K.select('rf_method', ['Card refund', 'Bank transfer', 'Family credit instead'])), K.field('Reason', K.input('rf_reason', '', { placeholder: 'Required' }), '', true)], 2),
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Record decision', 'fin-refund-save', {}, { variant: 'primary' }) });
  };
  Hub.actions['fin-refund-save'] = function () {
    var f = K.val('rf_fam'), a = Math.round(parseFloat(K.val('rf_amount')) * 100), m = K.val('rf_method'), r = K.val('rf_reason'); if (!r) { Hub.toast('A reason is required'); return; }
    Hub.closeSheet(true);
    Hub.mutate(function () { if (m === 'Family credit instead') db.addFamilyCredit({ family: f, player: null, amount: a, source: 'Refund decision: ' + r, at: K.now(), by: K.me() }); else db.recordRefundDecision(f, a, r, m); }, m === 'Family credit instead' ? 'Family credit created' : 'Refund decision recorded', { area: 'Finance', finance: true, summary: 'Refund decision for ' + famName(f) + ' (' + M(a) + ')', before: '—', after: m + ': ' + r });
  };
  Hub.screens['mgmt-fin-parent-money'] = function (ctx) {
    var tabs = [{ id: 'payments', label: 'Family payments' }, { id: 'subs', label: 'Subscriptions' }, { id: 'bookings', label: 'Bookings' }, { id: 'refunds', label: 'Refunds' }, { id: 'credits', label: 'Family credits' }];
    var h = head('mgmt-fin-parent-money', { title: 'Parent money', sub: 'Card payments for subscriptions and bookings, refund decisions and family credits. The payer can differ from the person who booked.', tabs: K.tabs('fin-pm', tabs), actions: can() ? K.actBtn('Record refund decision', 'fin-refund', {}, { variant: 'secondary' }) : '' });
    var g = gate(ctx, h); if (g) return g;
    var tab = K.tab('fin-pm', tabs), body = '';
    var charges = db.getFamilyCharges();
    if (tab === 'payments' || tab === 'subs') {
      var list = tab === 'subs' ? charges.filter(function (c) { return c.type === 'Subscription'; }) : charges.filter(function (c) { return c.paid > 0; });
      var paid = K.sum(list, 'paid'), cr = K.sum(list, 'creditApplied');
      body = K.stats([{ label: tab === 'subs' ? 'Subscription charges' : 'Card payments', value: String(list.length) }, { label: 'Paid by card', value: M(paid) }, { label: 'Family credit used', value: M(cr) }, { label: 'September subscriptions', value: M(K.sum(charges.filter(function (c) { return c.month === '2026-09'; }), 'gross')) }]) +
        K.table({ cols: '80px minmax(0,1.2fr) minmax(0,1.6fr) 110px 110px 100px 110px', head: ['Date', 'Family', 'Charge', { label: 'Charge', cls: 'c-num' }, { label: 'Credit used', cls: 'c-num' }, { label: 'Paid', cls: 'c-num' }, 'State'], rows: list.slice().reverse().map(function (c) { return { route: 'mgmt-family/' + c.family, cells: [{ cls: 'c-cell', html: K.dm(c.date) }, K.cell(esc(famName(c.family)), esc((db.getPlayer(c.player) || {}).name || '')), K.cell(esc(c.description), esc(c.via) + (c.note ? ' · ' + esc(c.note) : '')), { cls: 'c-num', html: M(c.gross) }, { cls: 'c-num', html: c.creditApplied ? '−' + M(c.creditApplied) : '—' }, { cls: 'c-num', html: M(c.paid) }, { html: K.status(c.state) }] }; }) });
    } else if (tab === 'bookings') {
      body = K.table({ cols: '100px minmax(0,1.4fr) minmax(0,1.4fr) minmax(0,1.2fr) 110px 110px', head: ['Booking', 'Product', 'Booked by / payer', 'Lines', { label: 'Total', cls: 'c-num' }, 'State'], rows: db.getBookings().map(function (b) { return { route: 'mgmt-booking/' + b.id, cells: [{ cls: 'c-cell', html: esc(b.id) }, K.cell(esc(b.product), K.dt(b.at)), K.cell(esc(parName(b.bookedBy)), b.payer !== b.bookedBy ? 'Paid by ' + esc(parName(b.payer)) : 'Same payer'), { cls: 'c-cell', html: b.lines.map(function (l) { return esc((db.getPlayer(l.player) || {}).first) + ' · ' + esc(l.tier) + (l.discount ? ' (−' + M(l.discount) + ')' : ''); }).join('<br>') }, { cls: 'c-num', html: M(b.total) + (b.refunded ? '<br><small class="c-mute">refunded ' + M(b.refunded) + '</small>' : '') }, { html: K.status(b.state) }] }; }) });
    } else if (tab === 'refunds') {
      body = K.table({ cols: '90px minmax(0,1.2fr) minmax(0,2fr) 160px 110px 100px', head: ['Date', 'Family', 'Reason', 'Decided by', { label: 'Amount', cls: 'c-num' }, 'State'], rows: db.getRefunds().slice().reverse().map(function (r) { return { cells: [{ cls: 'c-cell', html: K.dm(r.at) }, K.cell(esc(famName(r.family)), esc(r.method)), { cls: 'c-cell', html: esc(r.reason) }, { cls: 'c-cell', html: K.stamp('Decided', r.decidedBy, r.at) }, { cls: 'c-num', html: M(r.amount) }, { html: K.status(r.state) }] }; }) });
    } else {
      var fc = db.getFamilyCredits();
      body = K.stats([{ label: 'Credits issued', value: M(K.sum(fc, 'amount')) }, { label: 'Used', value: M(K.sum(fc, 'amount') - K.sum(fc, 'remaining')) }, { label: 'Still available', value: M(K.sum(fc, 'remaining')) }, { label: 'Families with credit', value: String(fc.filter(function (c) { return c.remaining > 0; }).map(function (c) { return c.family; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).length) }]) +
        '<p class="k-note">Credits are applied to the next charge automatically, oldest credit first, and can be part-used.</p>' +
        K.table({ cols: '90px minmax(0,1.2fr) minmax(0,1.8fr) 110px 110px minmax(0,1.4fr)', head: ['Created', 'Family', 'Source', { label: 'Amount', cls: 'c-num' }, { label: 'Remaining', cls: 'c-num' }, 'Applied'], rows: fc.slice().reverse().map(function (c) { return { route: 'mgmt-family/' + c.family, cells: [{ cls: 'c-cell', html: K.dm(c.at) }, K.cell(esc(famName(c.family)), c.id), K.cell(esc(c.source), 'by ' + esc(c.by)), { cls: 'c-num', html: M(c.amount) }, { cls: 'c-num', html: M(c.remaining) }, { cls: 'c-cell', html: c.applications.map(function (a) { return M(a.amount) + ' to ' + esc(a.charge) + ' (' + K.dm(a.at) + ')'; }).join('<br>') || '<span class="c-mute">Not used yet</span>' }] }; }) });
    }
    return K.page(h, body, 'fin');
  };

  /* ================================================================ INTEGRATIONS */
  route('mgmt-fin-integrations', 'Integrations');
  Hub.actions['fin-int-retry'] = function (el) { var x = db.getIntegrations()[el.dataset.k]; Hub.mutate(function () { x.failures = []; x.lastSync = K.now(); }, (el.dataset.k === 'xero' ? 'Xero' : 'Stripe') + ' sync retried', { area: 'Finance', finance: true, summary: 'Retried ' + el.dataset.k + ' sync', before: 'Failures present', after: 'Retried' }); };
  Hub.actions['fin-int-link'] = function (el) { var x = db.getIntegrations().xero; Hub.mutate(function () { x.contacts.forEach(function (c) { if (c.client === el.dataset.c) { c.contact = 'XC-' + (250 + Math.floor(Math.random() * 40)); c.state = 'Linked'; } }); }, 'Xero contact linked', { area: 'Finance', finance: true, summary: 'Linked Xero contact for ' + clientName(el.dataset.c), before: 'Not linked', after: 'Linked' }); };
  Hub.screens['mgmt-fin-integrations'] = function (ctx) {
    var h = head('mgmt-fin-integrations', { title: 'Integrations', sub: 'Stripe takes parent card payments. Xero receives issued invoices and payments. Both are shown in test mode here.' }); var g = gate(ctx, h); if (g) return g;
    var X = db.getIntegrations(), s = X.stripe, x = X.xero;
    var stripe = K.card({ title: 'Stripe', sub: esc(s.account) + ' · ' + esc(s.mode), right: K.status(s.status), body: K.kv([['Connected', K.stamp('Connected', s.connectedBy, s.at)], ['Customer links', s.customers + ' families linked to Stripe customers'], ['Last sync', s.lastSync ? K.dt(s.lastSync) : 'Today, 06:02']]) +
      (s.failures.length ? '<div class="lx-rows">' + s.failures.map(function (f) { return '<div class="lx-row">' + K.pill('Failure', 'warn') + '<span class="lx-row__main"><b>' + esc(f.text) + '</b><small>' + K.dt(f.at) + '</small></span></div>'; }).join('') + '</div>' : '<p class="k-note">No failures.</p>') + (can() ? '<div class="k-bar" style="margin-top:10px">' + K.actBtn('Retry sync', 'fin-int-retry', { k: 'stripe' }, { variant: 'secondary', size: 'sm', icon: 'refresh' }) + '</div>' : '') });
    var xero = K.card({ title: 'Xero', sub: esc(x.org), right: K.status(x.status), body: K.kv([['Connected', K.stamp('Connected', x.connectedBy, x.at)]]) +
      K.table({ cols: 'minmax(0,1.5fr) 110px 110px 120px', head: ['Client', 'Contact', 'State', ''], rows: x.contacts.map(function (c) { return { cells: [K.cell(esc(clientName(c.client))), { cls: 'c-cell', html: esc(c.contact || '—') }, { html: K.status(c.state === 'Linked' ? 'Synced' : 'Not linked') }, { cls: 'c-end', html: c.state !== 'Linked' && can() ? K.actBtn('Link contact', 'fin-int-link', { c: c.client }, { variant: 'tertiary', size: 'sm' }) : '' }] }; }) }) +
      '<h3 class="fin-h3">Invoice sync</h3>' + K.table({ cols: '110px minmax(0,1.5fr) 110px minmax(0,1.5fr)', head: ['Invoice', 'Client', 'Status', 'Detail'], rows: db.getInvoices().slice(-6).reverse().map(function (i) { return { route: 'mgmt-fin-invoice/' + i.id, cells: [{ cls: 'c-cell', html: esc(i.number) }, K.cell(esc(clientName(i.client))), { html: K.status(i.xero.status) }, { cls: 'c-cell', html: esc(i.xero.error || i.xero.ref || '') }] }; }) }) +
      (x.failures.length ? '<div class="lx-rows">' + x.failures.map(function (f) { return '<div class="lx-row">' + K.pill('Failure', 'warn') + '<span class="lx-row__main"><b>' + esc(f.text) + '</b><small>' + K.dt(f.at) + '</small></span></div>'; }).join('') + '</div>' : '') +
      (can() ? '<div class="k-bar" style="margin-top:10px">' + K.actBtn('Retry failed', 'fin-int-retry', { k: 'xero' }, { variant: 'secondary', size: 'sm', icon: 'refresh' }) + '</div>' : '') });
    return K.page(h, K.grid([stripe, xero], 2), 'fin');
  };

  /* ================================================================ MONEY OUT */
  route('mgmt-fin-money-out', 'Money out');
  Hub.actions['fin-run'] = function () { Hub.mutate(function () { db.runCoachPayments('2026-09'); }, 'Coach payment run prepared for 7 Oct'); };
  Hub.actions['fin-cost-new'] = function () {
    Hub.openSheet({ title: 'Add a cost', body: K.form([K.field('Date', K.input('cs_date', K.today, { type: 'date' })), K.field('Supplier', K.input('cs_sup', 'Westbrook Sports Supplies')), K.field('Category', K.select('cs_cat', ['Equipment', 'Venue', 'Training', 'Travel', 'Other'])), K.field('Description', K.input('cs_desc', '')), K.field('Net (£)', K.input('cs_net', '0.00')), K.field('VAT (£)', K.input('cs_vat', '0.00')), K.field('VAT reclaimable', K.select('cs_rec', [['yes', 'Yes'], ['no', 'No']], 'yes'))], 2),
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Add cost', 'fin-cost-save', {}, { variant: 'primary' }) });
  };
  Hub.actions['fin-cost-save'] = function () { var c = { date: K.val('cs_date'), supplier: K.val('cs_sup'), category: K.val('cs_cat'), description: K.val('cs_desc') || K.val('cs_cat'), net: Math.round(parseFloat(K.val('cs_net')) * 100) || 0, vat: Math.round(parseFloat(K.val('cs_vat')) * 100) || 0, reclaim: K.val('cs_rec') === 'yes', programme: 'All', paid: false }; if (!c.net) { Hub.toast('Enter a net amount'); return; } Hub.closeSheet(true); Hub.mutate(function () { db.addOtherCost(c); }, 'Cost added'); };
  Hub.actions['fin-ovh-new'] = function () {
    Hub.openSheet({ title: 'Add an overhead', body: K.form([K.field('Name', K.input('ov_name', '')), K.field('Supplier', K.input('ov_sup', '')), K.field('Frequency', K.select('ov_freq', ['Monthly', 'Quarterly', 'Annual'])), K.field('Net (£)', K.input('ov_net', '0.00')), K.field('VAT (£)', K.input('ov_vat', '0.00')), K.field('VAT reclaimable', K.select('ov_rec', [['yes', 'Yes'], ['no', 'No']], 'no')), K.field('Payment day', K.input('ov_day', '15', { type: 'number' }))], 2),
      foot: ui.btn('Cancel', { variant: 'tertiary', attrs: { 'data-action': 'close-sheet' } }) + K.actBtn('Add overhead', 'fin-ovh-save', {}, { variant: 'primary' }) });
  };
  Hub.actions['fin-ovh-save'] = function () { var o = { name: K.val('ov_name') || 'New overhead', supplier: K.val('ov_sup'), frequency: K.val('ov_freq'), net: Math.round(parseFloat(K.val('ov_net')) * 100) || 0, vat: Math.round(parseFloat(K.val('ov_vat')) * 100) || 0, reclaim: K.val('ov_rec') === 'yes', day: +K.val('ov_day') || 15 }; Hub.closeSheet(true); Hub.mutate(function () { db.addOverhead(o); }, 'Overhead added'); };
  Hub.screens['mgmt-fin-money-out'] = function (ctx) {
    var tabs = [{ id: 'coaches', label: 'Coach costs' }, { id: 'costs', label: 'Venue and other costs' }, { id: 'overheads', label: 'Overheads' }];
    var h = head('mgmt-fin-money-out', { title: 'Money out', sub: 'Coach costs come from pay items (one coach, one session). Coaches are paid on the ' + db.getFinanceSettings().coachPaymentDay + 'th for the previous month.', tabs: K.tabs('fin-mo', tabs) }); var g = gate(ctx, h); if (g) return g;
    var tab = K.tab('fin-mo', tabs), body = '';
    var sepAll = db.getAllocations(function (a) { return a.date.slice(0, 7) === '2026-09'; }), unconf = sepAll.filter(function (a) { return a.state !== 'Confirmed' && a.state !== 'Exported'; }), toRun = sepAll.filter(function (a) { return (a.state === 'Confirmed' || a.state === 'Exported') && !a.run; });
    /* Pay is expected until the session is confirmed as delivered, then actual */
    var waitOcc = []; unconf.forEach(function (a) { if (waitOcc.indexOf(a.occurrence) < 0) waitOcc.push(a.occurrence); });
    var mos = unconf.length ? K.situation({ tone: 'warn', title: waitOcc.length + ' September session' + (waitOcc.length === 1 ? '' : 's') + ' awaiting confirmation', text: M(K.sum(unconf, 'cost')) + ' of coach pay is still expected, not actual. Confirm what happened so it can be paid on ' + K.dm('2026-10-07') + '.', primary: K.goBtn('Review delivery', 'mgmt-occurrence/' + waitOcc[0], { variant: 'primary' }) }) :
      K.situation({ tone: toRun.length ? 'info' : 'ok', title: (toRun.length ? M(K.sum(toRun, 'cost')) + ' to pay coaches on ' : 'Coach pay is ready for ') + K.dm('2026-10-07'), text: sepAll.length + ' September pay items, all confirmed and matching the work summaries. Venues, other costs and overheads (' + M(K.sum(db.getOverheads(), 'net')) + ' a month) are in the tabs above.', primary: can() && toRun.length ? K.actBtn('Prepare payment run', 'fin-run', {}, { variant: 'primary' }) : '' });
    if (tab === 'coaches') {
      var sep = db.getAllocations(function (a) { return a.date.slice(0, 7) === '2026-09' && a.state !== 'Draft'; });
      var per = {}; sep.forEach(function (a) { var p = per[a.coach] || (per[a.coach] = { n: 0, units: 0, cost: 0, states: {} }); p.n++; p.units += a.units; p.cost += a.cost; p.states[a.state] = 1; });
      var confirmed = sep.filter(function (a) { return a.state === 'Confirmed' || a.state === 'Exported'; });
      body = K.stats([{ label: 'September coach cost (actual)', value: M(K.sum(sep, 'cost')), sub: sep.length + ' pay items' + (unconf.length ? ' · ' + M(K.sum(unconf, 'cost')) + ' more expected' : '') }, { label: 'Ready to pay', value: M(K.sum(confirmed, 'cost')), sub: confirmed.length + ' confirmed or sent for payment' }, { label: 'Payment day', value: K.dm('2026-10-07'), sub: 'Previous month’s work' }, { label: 'Standard rate', value: M(3125), sub: 'Per evening hour' }]) +
        K.table({ cols: 'minmax(0,1.5fr) 100px 90px 160px 110px', head: ['Coach', 'Sessions', 'Hours', 'State', { label: 'Cost', cls: 'c-num' }], rows: Object.keys(per).map(function (k) { var p = per[k]; return { route: 'mgmt-coach/' + k, cells: [K.cell(esc(db.coachName(k)), (db.getRateProfiles(k).filter(function (r) { return !r.to; })[0] || {}).note || ''), { cls: 'c-cell', html: String(p.n) }, { cls: 'c-cell', html: String(p.units) }, { html: Object.keys(p.states).map(K.status).join(' ') }, { cls: 'c-num', html: M(p.cost) }] }; }), foot: '<span>Matches the work summaries for September</span><b class="num">' + M(K.sum(sep, 'cost')) + '</b>' }) +
        K.details('Payment runs', K.table({ cols: '100px minmax(0,1fr) 140px minmax(0,1.4fr) 110px', head: ['Run', 'Work month', 'Paid on', 'Prepared', { label: 'Amount', cls: 'c-num' }], rows: db.getPaymentRuns().map(function (r) { return { cells: [{ cls: 'c-cell', html: esc(r.id) }, { cls: 'c-cell', html: monthName(r.month) }, { cls: 'c-cell', html: K.d(r.paidOn) + ' ' + K.status(r.state) }, { cls: 'c-cell', html: K.stamp('Prepared', r.by, r.at) }, { cls: 'c-num', html: M(r.amount) }] }; }) }), { sub: 'Past coach payments' });
    } else if (tab === 'costs') {
      var venues = {}; db.getOccurrences(function (o) { return o.date.slice(0, 7) === '2026-09'; }).forEach(function (o) { var c = F.venueCost(o); if (c) { venues[o.venue] = (venues[o.venue] || 0) + c; } });
      body = K.section('Venue hire · September', 'Hourly hire for parent sessions. Client sessions are held on the client’s own site.', K.table({ cols: 'minmax(0,1.5fr) 140px 110px', head: ['Venue', 'Rate', { label: 'September', cls: 'c-num' }], rows: Object.keys(venues).map(function (k) { var v = db.getVenue(k); return { route: 'mgmt-venue/' + k, cells: [K.cell(esc(v.name)), { cls: 'c-cell', html: M(v.costPerHour) + ' an hour' }, { cls: 'c-num', html: M(venues[k]) }] }; }) })) +
        K.section('Other costs', '', K.table({ cols: '80px minmax(0,1.3fr) minmax(0,1.6fr) 110px 100px 90px', head: ['Date', 'Supplier', 'Description', { label: 'Net', cls: 'c-num' }, { label: 'VAT', cls: 'c-num' }, 'Reclaim'], rows: db.getOtherCosts().map(function (c) { return { cells: [{ cls: 'c-cell', html: K.dm(c.date) }, K.cell(esc(c.supplier), esc(c.category)), { cls: 'c-cell', html: esc(c.description) }, { cls: 'c-num', html: M(c.net) }, { cls: 'c-num', html: M(c.vat) }, { cls: 'c-cell', html: c.reclaim ? 'Yes' : 'No' }] }; }) }), can() ? K.actBtn('Add cost', 'fin-cost-new', {}, { variant: 'secondary', size: 'sm', icon: 'plus' }) : '');
    } else {
      var ovs = db.getOverheads();
      body = K.table({ cols: 'minmax(0,1.6fr) 110px 110px 100px 100px 120px', head: ['Overhead', 'Frequency', { label: 'Net', cls: 'c-num' }, { label: 'VAT', cls: 'c-num' }, 'Reclaimable', 'Paid on'], rows: ovs.map(function (o) { return { cells: [K.cell(esc(o.name), esc(o.supplier || '')), { cls: 'c-cell', html: esc(o.frequency) }, { cls: 'c-num', html: M(o.net) }, { cls: 'c-num', html: M(o.vat) }, { cls: 'c-cell', html: o.reclaim ? 'Yes' : 'No' }, { cls: 'c-cell', html: 'Day ' + o.day }] }; }), foot: '<span>Monthly overheads (net)</span><b class="num">' + M(K.sum(ovs, 'net')) + '</b>' }) + (can() ? '<div class="k-bar">' + K.actBtn('Add overhead', 'fin-ovh-new', {}, { variant: 'secondary', size: 'sm', icon: 'plus' }) + '</div>' : '');
    }
    return K.page(h, mos + body, 'fin');
  };

  /* ================================================================ LEDGER */
  route('mgmt-fin-ledger', 'Session profit');
  Hub.screens['mgmt-fin-ledger'] = function (ctx) {
    var h = head('mgmt-fin-ledger', { title: 'Session profit · September', sub: 'Revenue, coach cost, venue cost and profit before overheads for each session. Parent subscriptions are spread across the month’s delivered sessions.' }); var g = gate(ctx, h); if (g) return g;
    var L = F.ledger('2026-09');
    var t = { rev: K.sum(L, 'revenue'), coach: K.sum(L, 'coach'), venue: K.sum(L, 'venue'), c: K.sum(L, 'contribution') };
    return K.page(h, K.stats([{ label: 'Revenue (net)', value: M(t.rev) }, { label: 'Coach cost', value: M(t.coach) }, { label: 'Venue cost', value: M(t.venue) }, { label: 'Before overheads', value: M(t.c), tone: 'feature' }]) +
      K.table({ cols: '90px minmax(0,1.6fr) 110px 100px 100px 100px 110px', head: ['Date', 'Session', 'Status', { label: 'Revenue', cls: 'c-num' }, { label: 'Coach', cls: 'c-num' }, { label: 'Venue', cls: 'c-num' }, { label: 'Before overheads', cls: 'c-num' }], rows: L.map(function (r) { var o = r.occurrence; return { route: 'mgmt-occurrence/' + o.id, cells: [{ cls: 'c-cell', html: K.dd(o.date) }, K.cell(esc(o.session), esc(o.id)), { html: K.status(db.occState(o)) }, { cls: 'c-num', html: M(r.revenue) }, { cls: 'c-num', html: M(r.coach) }, { cls: 'c-num', html: M(r.venue) }, { cls: 'c-num', html: '<b>' + M(r.contribution) + '</b>' }] }; }),
        foot: '<span>' + L.length + ' sessions · other costs and credits sit in the month report</span><span class="num">Before overheads <b class="k-total">' + M(t.c) + '</b></span>' }), 'fin');
  };

  /* ================================================================ CASH */
  route('mgmt-fin-cash', 'Cash flow');
  function cashChart(cp) {
    var pts = [{ date: K.today, v: cp.current }].concat(cp.events.filter(function (e) { return e.date > K.today && e.date <= K.addDays(K.today, 30); }).map(function (e) { return { date: e.date, v: e.running, label: e.label }; }));
    var W = 640, H = 180, pad = { l: 56, r: 16, t: 14, b: 26 }, max = Math.max.apply(null, pts.map(function (p) { return p.v; }).concat([cp.threshold])) * 1.08, min = 0;
    function x(d) { return pad.l + (K.daysBetween(K.today, d) / 30) * (W - pad.l - pad.r); }
    function y(v) { return pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b); }
    var path = '', prev = null;
    pts.forEach(function (p, i) { if (i === 0) path = 'M' + x(p.date) + ' ' + y(p.v); else path += ' H' + x(p.date) + ' V' + y(p.v); prev = p; });
    path += ' H' + x(K.addDays(K.today, 30));
    var ticks = [0, 10, 20, 30].map(function (d) { var dt = K.addDays(K.today, d); return '<text x="' + x(dt) + '" y="' + (H - 6) + '" text-anchor="middle">' + K.dm(dt) + '</text>'; }).join('');
    var gl = [0, .5, 1].map(function (f) { var v = Math.round(max * f / 100000) * 100000; return '<line x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + y(v) + '" y2="' + y(v) + '" class="fin-chart__grid"/><text x="' + (pad.l - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + M(v).replace('.00', '') + '</text>'; }).join('');
    var dots = pts.map(function (p) { return '<g class="fin-chart__pt"><rect x="' + (x(p.date) - 9) + '" y="' + pad.t + '" width="18" height="' + (H - pad.t - pad.b) + '" fill="transparent"/><circle cx="' + x(p.date) + '" cy="' + y(p.v) + '" r="4"/><title>' + K.dm(p.date) + ': ' + M(p.v) + (p.label ? ' after ' + p.label : '') + '</title></g>'; }).join('');
    var lowX = x(cp.lowDate), lowY = y(cp.low);
    return '<figure class="fin-chart"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Projected cash balance for the next 30 days with the safety threshold">' + gl +
      '<line x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + y(cp.threshold) + '" y2="' + y(cp.threshold) + '" class="fin-chart__threshold"/><text x="' + (W - pad.r) + '" y="' + (y(cp.threshold) - 6) + '" text-anchor="end" class="fin-chart__tlabel">Safety threshold ' + M(cp.threshold).replace('.00', '') + '</text>' +
      '<path d="' + path + '" class="fin-chart__line"/>' + dots + '<circle cx="' + lowX + '" cy="' + lowY + '" r="6" class="fin-chart__low"/><text x="' + Math.min(lowX + 10, W - 120) + '" y="' + (lowY + 18) + '" class="fin-chart__tlabel">Low ' + M(cp.low).replace('.00', '') + '</text>' + ticks + '</svg>' +
      '<figcaption class="k-note">Projected balance after each expected movement. Hover a point for detail; every movement is listed below.</figcaption></figure>';
  }
  Hub.screens['mgmt-fin-cash'] = function (ctx) {
    var h = head('mgmt-fin-cash', { title: 'Cash flow', sub: 'Expected and actual movements, with the 30-day low point against the safety threshold.' }); var g = gate(ctx, h); if (g) return g;
    var cp = F.cashPosition();
    var figs = K.stats([{ label: 'Current cash', value: M(cp.current), sub: 'Opening ' + M(cp.opening.amount) + ' on ' + K.dm(cp.opening.date) }, { label: '30-day low point', value: M(cp.low), sub: K.dd(cp.lowDate), tone: cp.low < cp.threshold ? 'warn' : '' }, { label: 'Safety threshold', value: M(cp.threshold), sub: cp.low >= cp.threshold ? 'Above threshold' : 'Projected below' }, { label: 'Headroom at the low', value: M(cp.low - cp.threshold), tone: 'feature' }]);
    var ev = K.table({ cols: '80px minmax(0,1.8fr) 70px 110px 110px 110px 100px minmax(0,1.2fr)', head: ['Date', 'Movement', 'In / out', { label: 'Expected', cls: 'c-num' }, { label: 'Actual', cls: 'c-num' }, { label: 'Balance', cls: 'c-num' }, 'Certainty', 'Authority'], rows: cp.events.map(function (e) { return { cells: [{ cls: 'c-cell', html: K.dm(e.date) }, K.cell(esc(e.label), K.status(e.state) + (e.remaining ? ' · ' + M(e.remaining) + ' remaining' : '')), { cls: 'c-cell', html: e.kind }, { cls: 'c-num', html: (e.kind === 'Out' ? '−' : '') + M(e.expected) }, { cls: 'c-num', html: e.actual != null ? (e.kind === 'Out' ? '−' : '') + M(e.actual) : '—' }, { cls: 'c-num', html: M(e.running) }, { html: K.status(e.certainty) }, { cls: 'c-cell', html: esc(e.authority) }] }; }) });
    var sit = K.situation({ tone: cp.low >= cp.threshold ? 'ok' : 'danger', title: cp.low >= cp.threshold ? 'Enough cash for the next 30 days' : 'Cash runs short on ' + K.dm(cp.lowDate), text: cashWords(cp) + ' ' + M(cp.current) + ' in the bank today.' });
    return K.page(h, sit + K.card({ title: 'Next 30 days', body: cashChart(cp) }) + figs + K.details('Every cash movement', ev, { sub: 'Expected and actual since ' + K.dm(cp.opening.date) + ', with certainty and who approved it' }), 'fin');
  };

  /* ================================================================ REPORTS */
  route('mgmt-fin-reports', 'Month report');
  Hub.screens['mgmt-fin-reports'] = function (ctx) {
    var h = head('mgmt-fin-reports', { title: 'Month report · September 2026', sub: 'Programme breakdown, overheads, profit, VAT estimate and cash position. The same figures drive the overview, session profit and cash screens.', actions: expectedToggle() }); var g = gate(ctx, h); if (g) return g;
    var s = F.monthSummary('2026-09', Hub.finView.expected), t = s.totals, v = F.vatEstimate(), cp = F.cashPosition();
    var rows = s.rows.map(function (r) { return { cells: [K.cell(esc(r.programme), r.credits ? 'Credits and refunds −' + M(r.credits) : ''), { cls: 'c-num', html: M(r.gross) }, { cls: 'c-num', html: M(r.vat) }, { cls: 'c-num', html: M(r.net) }, { cls: 'c-num', html: M(r.coach) }, { cls: 'c-num', html: M(r.venue) }, { cls: 'c-num', html: M(r.other) }, { cls: 'c-num', html: '<b>' + M(r.contribution) + '</b>' }, { cls: 'c-num', html: r.margin + '%' }] }; });
    rows.push({ cells: [K.cell('<b>Total</b>'), { cls: 'c-num k-total', html: M(t.gross) }, { cls: 'c-num k-total', html: M(t.vat) }, { cls: 'c-num k-total', html: M(t.net) }, { cls: 'c-num k-total', html: M(t.coach) }, { cls: 'c-num k-total', html: M(t.venue) }, { cls: 'c-num k-total', html: M(t.other) }, { cls: 'c-num k-total', html: M(t.contribution) }, { cls: 'c-num k-total', html: t.margin + '%' }] });
    var table = K.table({ cols: 'minmax(0,1.5fr) repeat(7, minmax(78px,1fr)) 70px', head: ['Programme', { label: 'Gross', cls: 'c-num' }, { label: 'VAT', cls: 'c-num' }, { label: 'Net', cls: 'c-num' }, { label: 'Coach', cls: 'c-num' }, { label: 'Venue', cls: 'c-num' }, { label: 'Other', cls: 'c-num' }, { label: 'Before overheads', cls: 'c-num' }, { label: 'Margin', cls: 'c-num' }], rows: rows });
    var pl = K.card({ title: 'Profit', body: K.kv([['Before overheads', M(t.contribution)], ['Overheads', '−' + M(t.overheads) + '<br><small class="c-mute">' + db.getOverheads().map(function (o) { return esc(o.name) + ' ' + M(o.net); }).join(' · ') + '</small>'], ['Profit', '<b class="k-big">' + M(t.profit) + '</b>']]) });
    var vat = K.card({ title: 'VAT estimate · ' + v.quarter, body: K.kv([['Output VAT (sales)', M(v.output)], ['Input VAT (reclaimable costs)', '−' + M(v.input)], ['Estimated to pay', '<b>' + M(v.due) + '</b> by ' + K.d(v.dueDate)]]) + '<p class="k-note">An estimate until the return is reviewed.</p>' });
    var cash = K.card({ title: 'Cash position', body: K.kv([['Current cash', M(cp.current)], ['30-day low point', M(cp.low) + ' on ' + K.dd(cp.lowDate)], ['Safety threshold', M(cp.threshold) + ' · ' + (cp.low >= cp.threshold ? 'above' : 'below')]]) + K.goBtn('Open cash flow', 'mgmt-fin-cash', { variant: 'secondary', size: 'sm' }) });
    var result = K.stats([{ label: 'Revenue', value: M(t.net), sub: 'Net of VAT' }, { label: 'Direct costs', value: M(t.direct), sub: 'Coaches, venues and other' }, { label: 'Overheads', value: M(t.overheads) }, { label: 'Profit', value: M(t.profit), sub: t.margin + '% before overheads', tone: 'feature' }]);
    var notes = K.card({ title: 'Notes and export', body: '<p class="k-note">Figures are worked out from issued invoices, paid parent charges and confirmed costs. Draft invoices are only included when you choose Including expected.</p>' + K.actBtn('Print this report', 'fin-print-report', {}, { variant: 'secondary', icon: 'download', size: 'sm' }) });
    var best = s.rows.slice().sort(function (a, b) { return b.contribution - a.contribution; })[0];
    var sit = K.situation({ tone: t.profit >= 0 ? 'ok' : 'warn', title: (t.profit >= 0 ? 'September made ' + M(t.profit) + ' profit' : 'September lost ' + M(-t.profit)), text: 'Revenue ' + M(t.net) + ' after VAT, ' + t.margin + '% kept before overheads.' + (best ? ' Strongest: ' + esc(best.programme) + ' (' + M(best.contribution) + ').' : '') });
    return K.page(h, sit + result + K.section('By programme', Hub.finView.expected ? 'Including the Northgate September draft and any other unissued drafts.' : 'Actual only: issued invoices and paid parent charges.', table) + K.grid([pl, vat, cash], 3) + notes, 'fin');
  };
  Hub.actions['fin-print-report'] = function () { window.print(); };
})();
