/* Branding boundary.
   In the real Hub, the organisation's branding record (name, logo, primary,
   secondary and accent colour) arrives from hub-content and
   content-provider.js writes it onto colour-named variables (--navy,
   --blue, --lime). Here the same three values map onto role-named brand
   tokens, and every other colour is derived in tokens.css. Components
   never know which organisation they belong to. */
(function () {
  var BRANDS = {
    joshevans: {
      id: 'joshevans',
      hubName: 'Josh Evans Hub',
      orgName: 'Josh Evans',
      orgFullName: 'Josh Evans Soccer School',
      mark: 'assets/je-mark.png',
      primary: '#062a59',
      accent: '#1187ee',
      secondary: '#c8ed21',
      displayFont: '"Anton", "Oswald", Impact, "Arial Narrow", sans-serif'
    },
    /* A fictional second organisation, only here to prove the system
       re-themes from three colours and a name. */
    sample: {
      id: 'sample',
      hubName: 'Riverside Hub',
      orgName: 'Riverside Juniors',
      orgFullName: 'Riverside Juniors Football Club',
      mark: null,
      primary: '#3a1146',
      accent: '#c2410c',
      secondary: '#fbbf24',
      displayFont: '"Oswald", "Arial Narrow", sans-serif'
    }
  };

  function hexToRgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function luminance(hex) {
    return hexToRgb(hex).map(function (c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); })
      .reduce(function (a, c, i) { return a + c * [0.2126, 0.7152, 0.0722][i]; }, 0);
  }
  /* Text on the secondary colour: dark primary if it reads, otherwise white. */
  function inkFor(bg, dark) { return luminance(bg) > 0.4 ? dark : '#ffffff'; }

  function initials(name) { return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); }

  Hub.brands = BRANDS;
  Hub.brand = BRANDS.joshevans;
  Hub.applyBrand = function (id) {
    var b = BRANDS[id] || BRANDS.joshevans, s = document.documentElement.style;
    Hub.brand = b;
    s.setProperty('--brand-primary', b.primary);
    s.setProperty('--brand-accent', b.accent);
    s.setProperty('--brand-secondary', b.secondary);
    s.setProperty('--brand-on-secondary', inkFor(b.secondary, b.primary));
    s.setProperty('--font-display', b.displayFont);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', b.primary);
  };
  /* Logo slot: the organisation's mark if it has one, else a monogram. */
  Hub.brandMark = function (cls) {
    var b = Hub.brand;
    if (b.mark) return '<img class="brand__mark ' + (cls || '') + '" src="' + b.mark + '" alt="">';
    return '<span class="brand__mark brand__monogram ' + (cls || '') + '" aria-hidden="true">' + initials(b.orgName) + '</span>';
  };
})();
