# Josh Evans brand: the live Hub's design

The prototype has two brands, switched with **Brand** in the prototype bar:
- **Relvor:** the platform's own look (passes 6–11).
- **Josh Evans:** now follows the UI of the live Josh Evans Hub. The
  reference is `gsvmdhdfnn-lgtm/Coach-allocation-TEST`, mainly its
  `styles.css` and `index.html`. That repository was read only and never
  edited.

Page structure, tabs and grouping still follow the Josh Evans design pack
(pass 9), and functionality is unchanged. Only presentation differs between
the brands. The styles are in `css/joshevans.css` (scoped to
`[data-brand="joshevans"]`), and screenshots are in
`docs/screenshots/joshevans/`.

## What comes from the Hub

| Element | Josh Evans brand (as the Hub) |
|---|---|
| Colours | Navy `#062A59`, Blue `#1187EE`, Lime `#C8ED21`, Cream `#F0F0C8`, ground `#F4F7FB`, lines `#E7EDF5`, ink `#102B53`, muted `#728198` |
| Type | Anton for page titles, section headings, figures, the next-session title and navigation; Inter for everything else |
| Header | White, sticky, with a 3px lime rule; the Josh Evans Soccer School logo with the hub name ("Management Hub", "Coach Hub", "Parent / Player Hub") |
| Hub switch | A pill button in the header: "← Coach Hub" from Management, or "Management Hub" (navy) from Coach |
| Navigation | The Hub's Anton uppercase pill bar under the header, with the active item in blue. This applies on desktop and phone, so there is no sidebar and no bottom tab bar. Management shows Home and More, Coach shows Home, Schedule, Library and Player Hub, and Parent shows Home, Sessions, Development and More. |
| Cards | White with a 1px `#E7EDF5` border, a soft navy shadow and 16px corners |
| Feature cards | Next session, All sessions, Profit and Cash position use the blue gradient (`#0A3F7A` → `#0E6CB5`) with the lime ring |
| Buttons | Lime primary with navy text; white secondary with blue text; navy for urgent actions |
| Eyebrows and links | Blue small caps for eyebrows; blue bold links |
| Session rows | Lime accent bar for staffed sessions (rust when at risk) |
| Theme | Light only, as the Hub has no dark mode. The theme switch doesn't apply to this brand. |

Status colours (urgent, warning, OK) keep the same meanings on both brands.
The palette experiment applies to Relvor only.
