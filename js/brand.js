/* Organisation branding boundary.
   An organisation supplies: name, mark, identity colour, accent colour and
   the words it uses for its staff and clients. Relvor decides everything
   else. The accent is clamped here so it always meets 4.5:1 contrast on
   the light canvas and on the dark canvas; a pale or neon brand colour is
   darkened or lightened until it is usable, never used raw. */
(function () {
  var BRANDS = {
    relvor: {
      id: 'relvor',
      orgName: 'Northfield Group',
      orgSub: 'Operations',
      mark: null,
      identity: '#1d1b18',
      accent: '#b7832f',
      terms: { staff: 'Staff', client: 'Client' }
    },
    joshevans: {
      id: 'joshevans',
      orgName: 'Josh Evans',
      orgFull: 'Josh Evans Coaching',
      orgSub: 'Coaching',
      mark: 'assets/je-mark.png',
      identity: '#062a59',
      accent: '#1187ee',
      terms: { staff: 'Coach', client: 'Parent' }
    }
  };

  function rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function hex(c) { return '#' + c.map(function (v) { return Math.round(v).toString(16).padStart(2, '0'); }).join(''); }
  function lum(h) { return rgb(h).map(function (c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }).reduce(function (a, c, i) { return a + c * [0.2126, 0.7152, 0.0722][i]; }, 0); }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function mix(a, b, t) { var A = rgb(a), B = rgb(b); return hex(A.map(function (v, i) { return v + (B[i] - v) * t; })); }
  /* Move the colour toward `toward` until it clears `min` against `bg`. */
  function clamp(color, bg, toward, min) { var c = color, t = 0; while (contrast(c, bg) < min && t < 1) { t += 0.04; c = mix(color, toward, t); } return c; }

  function initials(name) { return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); }

  Hub.brands = BRANDS;
  Hub.brand = BRANDS.relvor;
  Hub.applyBrand = function (id) {
    var b = BRANDS[id] || BRANDS.relvor, s = document.documentElement.style;
    Hub.brand = b;
    s.setProperty('--accent-l', clamp(b.accent, '#ffffff', '#101114', 4.6));
    s.setProperty('--accent-d', clamp(b.accent, '#15171c', '#ffffff', 5.2));
    s.setProperty('--identity', b.identity);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', '#ffffff');
  };
  Hub.orgMark = function () {
    var b = Hub.brand;
    if (b.mark) return '<img class="org-mark" src="' + b.mark + '" alt="">';
    return '<span class="org-mark org-mark--mono" aria-hidden="true">' + initials(b.orgName) + '</span>';
  };
  /* The Relvor logo: a champagne 'r' built from a stem and a leaf. */
  Hub.relvorLogo = '<svg class="rv-logo" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="rvg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e7cf"/><stop offset="1" stop-color="#c9a574"/></linearGradient></defs><rect x="5" y="6" width="7.5" height="21" rx="3.75" fill="url(#rvg)"/><path d="M14.5 13.5C14.5 8.8 18.3 5 23 5h2.2c1 0 1.8.8 1.8 1.8v1.4c0 4.7-3.8 8.5-8.5 8.5h-4v-3.2Z" fill="url(#rvg)" opacity=".92"/></svg>';
  /* Relvor's own mark: used quietly, never over the organisation. */
  Hub.relvorMark = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="0.5" y="0.5" width="15" height="15" rx="3.5" fill="currentColor"/><path d="M5.5 11.5v-7h3.1a2.1 2.1 0 0 1 0 4.2H5.5M8.4 8.7l2.3 2.8" fill="none" stroke="var(--canvas)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
})();
