/* A small stroke icon set (24px grid). Replaces the Hub's unicode glyphs
   (● ▣ ▤ ⌖ ◷), which render differently on every platform and carry no
   meaning. Usage: Hub.icon('calendar'), Hub.icon('pin', 'icon-sm'). */
(function () {
  var P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-5h4v5"/>',
    attention: '<path d="M12 3.5 2.8 19.5h18.4Z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    coaches: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c2 .7 3.2 2.4 3.5 5.2"/>',
    players: '<circle cx="12" cy="12" r="8.5"/><path d="m12 7.5 3.5 2.6-1.3 4.1H9.8l-1.3-4.1Z"/><path d="M12 3.5v4M20.3 10.1l-4.8 0M3.7 10.1h4.8M14.2 14.2l2.6 4.4M9.8 14.2l-2.6 4.4"/>',
    finance: '<path d="M16 6.5a4 4 0 0 0-7 2.7V17M6.5 12.5h7M6.5 17.5H17"/>',
    development: '<path d="M4 19.5h16"/><path d="M6.5 16V11M11 16V6.5M15.5 16v-3.5M20 16V9"/>',
    comms: '<path d="M4 5.5h16v10.5H9l-5 4Z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V20a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3.5a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3.5a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.1a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/>',
    more: '<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>',
    grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
    user: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5c.8-4 3.8-6 7.5-6s6.7 2 7.5 6"/>',
    userCheck: '<circle cx="10" cy="8" r="3.6"/><path d="M3 20c.8-3.8 3.6-5.6 7-5.6 1.4 0 2.7.3 3.8.9"/><path d="m15.5 18 2 2 4-4.5"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    inbox: '<path d="M3.5 13.5 6 5.5h12l2.5 8V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19Z"/><path d="M3.5 13.5H8l1.5 2.5h5l1.5-2.5h4.5"/>',
    move: '<path d="M4 8h13M13.5 4.5 17 8l-3.5 3.5M20 16H7M10.5 12.5 7 16l3.5 3.5"/>',
    book: '<path d="M5 4.5h10.5A3.5 3.5 0 0 1 19 8v11.5H8.5A3.5 3.5 0 0 1 5 16Z"/><path d="M5 16a3.5 3.5 0 0 1 3.5-3.5H19"/>',
    shield: '<path d="M12 3.5 19 6v6c0 4.3-3 7.3-7 8.5-4-1.2-7-4.2-7-8.5V6Z"/><path d="m9 12 2 2 4-4"/>',
    phone: '<path d="M5 4.5h3.5l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5C10.5 20 4 13.5 3.5 6.1A1.5 1.5 0 0 1 5 4.5Z"/>',
    bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    chat: '<path d="M20 12a8 8 0 0 1-11.8 7L4 20l1-4A8 8 0 1 1 20 12Z"/>',
    logout: '<path d="M14 4.5h4.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="M10 16.5 5.5 12 10 7.5M5.5 12H15"/>',
    chevron: '<path d="m9.5 6 6 6-6 6"/>',
    chevronDown: '<path d="m6 9.5 6 6 6-6"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    checkCircle: '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.2 2.4 2.4 4.8-5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8h.01"/>',
    alertCircle: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.5M12 16.2h.01"/>',
    flame: '<path d="M12 21a6.5 6.5 0 0 0 6.5-6.5c0-4.5-4.5-6.5-4-11.5-3 1.5-5 4.5-4.5 7.5-1.5-.5-2.5-2-2.5-2S5.5 11 5.5 14.5A6.5 6.5 0 0 0 12 21Z"/>',
    whistle: '<circle cx="8.5" cy="14.5" r="5"/><path d="M13 12.5 21 8.5v-3h-9"/><path d="M8.5 14.5h.01"/>',
    venue: '<path d="M3.5 20.5h17M5.5 20.5V9l6.5-4.5L18.5 9v11.5"/><path d="M9.5 20.5v-5h5v5"/>',
    support: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="m6 6 3.5 3.5M14.5 14.5 18 18M18 6l-3.5 3.5M9.5 14.5 6 18"/>',
    star: '<path d="m12 4 2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.7-5 2.7 1-5.6-4.1-3.9 5.6-.8Z"/>',
    megaphone: '<path d="M4 10v4h3l7 4.5v-13L7 10Z"/><path d="M18 9a4 4 0 0 1 0 6"/>',
    family: '<circle cx="8" cy="7" r="2.8"/><circle cx="17" cy="9" r="2.2"/><path d="M3 20c.4-3.8 2.4-6 5-6s4.6 2.2 5 6M13.5 20c.3-2.8 1.6-4.5 3.5-4.5s3.2 1.7 3.5 4.5"/>',
    card: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4.5v4.5h-4.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    swap: '<path d="M7 4.5 3.5 8 7 11.5M3.5 8h13M17 12.5l3.5 3.5-3.5 3.5M20.5 16h-13"/>'
  };
  window.Hub = window.Hub || {};
  Hub.icon = function (name, cls) {
    return '<svg class="icon ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (P[name] || P.info) + '</svg>';
  };
  Hub.iconNames = Object.keys(P);
})();
