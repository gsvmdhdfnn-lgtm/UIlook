# Relvor: visual pass 2

This pass is about the look only: identity, navigation, type, surfaces, rows,
controls and density. Screen content is placeholder material used as a canvas.
Pass 1 is kept for comparison:
- branch `claude/visual-pass-1`
- screenshots in `docs/screenshots/pass-1/`

Pass 2 screenshots are in `docs/screenshots/pass-2/`.

## Direction

Quiet, precise management software:
- Neutral surfaces and fine 1px lines carry the structure.
- One interface typeface, used at restrained weights.
- Colour only for selection, action and risk. Normal state stays grey;
  exceptions (urgent, warning, missing) are the only things in colour.

Management reads as a working environment:
- a permanent sidebar;
- a white canvas beside it;
- a quiet context bar with breadcrumb and search.

Staff and Client share the same system with more space and fewer columns.

## What changed from pass 1

| | Pass 1 | Pass 2 |
|---|---|---|
| Typeface | Manrope, plus Anton for display moments | Instrument Sans only. No display face anywhere in the product. |
| Weights | Up to 750 as the everyday weight | 400 for reading, 500 for labels, 600 for headings |
| Base size | 15px body | 14px body on desktop, 15px on touch devices |
| Colour | Brand navy, blue and lime across the UI | Stone-grey neutrals and ink text; the organisation accent only marks selection, primary action and links |
| Structure | Every group in a rounded, shadowed card | Metrics as a ruled strip; lists and tables in a single bordered panel; shadow only on things that float |
| Radius | 8 / 12 / 16 / 24 | 4 / 6 / 8 / 12 |
| Status | Filled pills everywhere | A dot and a word. "Staffed" is grey, and is hidden on phones. |
| Severity | Coloured icon tiles | Small shape markers: filled circle for urgent, diamond for warning, ring for to-do |
| Management desktop | Sidebar with pill items | 248px sidebar on the app ground: workspace switcher, grouped nav, a raised active item with an accent icon, and quiet counts |
| Tables | None; everything was rows | A lightweight table (tinted header, right-aligned numbers, hairline rows) that becomes a list on phones |
| Buttons | 44px, full width | 32px on desktop and 40px on touch; primary, secondary, tertiary, link, danger and icon variants; row actions appear on hover |
| Next session | Navy hero card with lime button and display type | A panel with a thin accent header band, a label/value grid and an action footer |
| Mobile nav | Lime marker, 22px icons | 20px icons, accent on the active icon, and a count bubble only for urgent items |

## Shared system (what's reusable)

- **Tokens** (`css/tokens.css`): organisation, then platform, then role:
  - surfaces: app ground, workspace, inset, hover, press, selected, ink;
  - three line weights and four text levels;
  - the accent and four semantic colours;
  - type, space, radius, control heights and three shadows;
  - a dark theme.
- **Components** (`css/components.css`):
  - page head and section head;
  - panel and metrics strip;
  - buttons and icon button;
  - status, tag, count, bubble and severity marker;
  - rows and table;
  - avatar with a per-person muted hue, identity header, fields;
  - notice, empty, skeleton;
  - tabs, segmented control, inputs and search;
  - drawer (bottom sheet on phones, full-height side panel on desktop);
  - toast.
- **Shell** (`css/shell.css`):
  - sidebar, context bar and top bar with tabs;
  - bottom tab bar;
  - workspace switcher, user chip and "Relvor" mark.

## White-label rules

- An organisation supplies a name, a mark, an identity colour, an accent, and
  the words it uses for staff and clients ("Coach", "Parent").
- `js/brand.js` adjusts the accent until it meets 4.5:1 contrast on the
  light canvas and 5.2:1 on the dark canvas. A pale or neon brand colour is
  darkened or lightened; it is never used raw.
- The accent never fills a large surface. It shows on:
  - the active nav icon and active tab underline;
  - primary buttons and links;
  - the next-session band;
  - focus rings.
- Neutrals, status colours, type and spacing are Relvor's and never change
  per organisation. That's what keeps two organisations looking like the same
  product.
- Relvor itself appears only as a small mark at the foot of the sidebar. The
  organisation is the workspace context.

## Final check

- **Serious management software?** Yes. The desktop Management screens read
  as a working environment: a stable sidebar, a breadcrumb, a ruled metric
  strip, a queue and a table. There are no widget tiles.
- **Calm with a lot on screen?** Needs Attention shows nine items with
  category, due time and action in one view. Only the two urgent items take
  colour.
- **Premium without trying?** There's no gradient, glow, large shadow or
  display type. The quality comes from alignment, spacing and consistent
  line weight.
- **Scales?** The table and row patterns already cope with longer lists. The
  People screen shows how staff and client data would look at larger volume.

## Worth testing next

- Whether the Management sidebar should be collapsible on smaller laptops.
- A dense data screen (Finance or Schedule) to push the table pattern further.
- The Client area with a non-football organisation's content, to confirm it
  reads as a general client portal.
- Real phones: tab bar, drawers, and the switch between Manage and Staff views.
