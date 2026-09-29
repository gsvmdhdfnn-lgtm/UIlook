# Relvor: visual pass 3

Pass 2 was clean but read like a dense admin tool. Pass 3 keeps the same
architecture, destinations and placeholder content, and changes only
composition, spacing, type, surfaces and navigation, so the two passes compare
directly.

Earlier passes, for comparison:
- Pass 1: branch `claude/visual-pass-1`, screenshots in `docs/screenshots/pass-1/`.
- Pass 2: branch `claude/visual-pass-2`, screenshots in `docs/screenshots/pass-2/`.

Pass 3 screenshots are in `docs/screenshots/pass-3/`.

## What changed, and why

| Problem in pass 2 | What pass 3 does |
|---|---|
| Too much at once; every section had equal weight | Each screen has one primary zone, one secondary zone and a quieter side column. On Management Home, Needs attention leads, Today follows, and approvals and tomorrow move to a smaller, softer side column. |
| Metric tiles competing with the content | The five-figure strip is gone. The same figures now read as one line of context under the greeting: "4 sessions today · 53 expected · 6 staff on duty · 2 urgent". |
| Borders everywhere | Panels lost their outlines. Structure now comes from surface tone, spacing and alignment. Lines remain only between rows of the same list or table, under a table header, and around floating panels. |
| Compressed type | Body text went from 14px to 15px, secondary text to 14px, section titles to 17px and page titles to 30px (26–34px where needed). 12px is kept for captions; 11px only for tertiary metadata. |
| Tight rows | List rows are 60px and table rows 64–72px. Row titles are 15px and meta 14px. Separators start at the text column, and the hover state is a soft rounded surface. |
| Sidebar felt like a utility menu | Nav rows grew from 30 to 40px, with 28px between groups. The organisation block is larger and shows a sub-line. The selected item lifts to the workspace tone, with its icon in the accent colour, and has no outline. Settings and "All tools" sit lower and quieter, above a rule and the account area. |
| Staff/Client tabs crowded, with a thin underline | Tabs are 40px tall, 16px each side and spaced apart. The selected tab is a raised tone rather than a 2px underline. The bar shares the page ground, so shell and page read as one surface. |
| Severe corners | Radii went from 4 / 6 / 8 / 12 to 6 / 10 / 14 / 18. |
| Cool, generic palette | Warm porcelain and stone neutrals with graphite and obsidian text. The Relvor accent is a muted amber, adjusted to a bronze for legibility. Warnings use rust so they never read as the accent. |

## The spacing and hierarchy system

- **Three distances:**
  - 4–8px inside a unit (a title and its sub-line);
  - 12–20px inside a group (a section heading and its list);
  - 48–64px between zones.
  These are the `--gap-unit`, `--gap-group` and `--gap-zone` tokens.
- **Page structure:** title, then one line of context, then the primary zone,
  the secondary zone and the side column. Page actions sit to the right of the
  title, with at most one primary button.
- **Working widths:**
  - 1180px is the central working width for Home, Staff and Client screens.
  - 1360px is for wide operational views: Needs attention and People.
  - Neither stretches edge to edge on large monitors.
- **Quieter side column:** smaller headings, 14px row titles in secondary
  text colour, 48px rows, and a tonal inset surface where it helps group the
  content.
- **Weight:** 400, 500 and 600 only. Urgent items are marked by position
  (first), weight (600 titles) and a small red marker. No red fills.

## How borders were reduced

- **Surfaces do the grouping.** There are five tones:
  - ground (sidebar, and the Staff and Client page);
  - workspace (Management canvas);
  - inset (the side column);
  - raised (feature surfaces on the ground);
  - floating (drawers, toasts).
- **Removed outlines:** buttons, inputs, tags, notices, tabs, the segmented
  control, the search field and all panels. Buttons are tonal; inputs use a
  single inset hairline only where a boundary is needed to type into.
- **Lines kept:** row separators (soft, and inset to the text column), one
  line under a table header, one faint line above the phone tab bar, and
  the rule in the sidebar foot.
- **Shadows:** a 1–2px shadow on raised surfaces and the selected nav item.
  A real shadow only on things that float: the drawer (now an inset panel with
  rounded corners on desktop), toasts and menus.

## How navigation was improved

- **Management sidebar:**
  - 264px wide, on the warm ground, with no dividing line (the tone change
    is the edge).
  - 34px organisation mark with name and sub-line.
  - 40px rows with 18px icons and 28px between groups.
  - An understated selected state; counts in plain numerals, red only for
    urgent.
  - System links set lower and smaller.
  - The Manage/Staff switch and account sit anchored at the bottom.
- **Context bar:** 68px, no bottom border, slightly translucent. It holds the
  breadcrumb, a wider search field and notifications.
- **Staff and Client desktop:** identity on the left and spaced tonal tabs
  beside it, with the Manage/Staff switch and account on the right. The bar
  sits on the page ground.
- **Phones:**
  - a 64px tab bar with 22px icons and 12px labels;
  - an accent-coloured icon for the active tab;
  - a count bubble only for urgent items.
  On a phone showing the Manage/Staff switch, the top bar drops the area
  sub-line so the organisation name doesn't truncate.

## What was deliberately left untouched

- **Structure:** routes, destinations, tab sets, the Manage/Staff switch, and
  the drawer behaviour for Needs attention and People.
- **Content:** placeholder sessions, people and items are the same as in pass
  2, so screens compare one to one. Management Home's figures moved from
  tiles into the context line; nothing was added or removed.
- **Branding:** the rules are unchanged. An organisation supplies a name, mark,
  identity colour, accent and terms, and the accent is adjusted for contrast.
  Josh Evans still re-themes to its blue by changing one value.
- **Rules:** semantic colour rules, the icon set, states (empty, loading,
  error), dark mode support and the Visual system page. These were restyled,
  not restructured.

## Honest limits

- The larger rows mean fewer items per screen. The table pattern is built to
  stay calm at 50+ rows, but no screen demonstrates that yet.
- The warm palette makes Josh Evans' bright blue accent the most saturated
  thing on screen. That's intended (identity lives in the accent), but it's
  worth judging on a real display.
