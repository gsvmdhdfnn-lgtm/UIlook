# Visual pass 10: Relvor brand system and calmer proportions

This pass refines the look to match the Relvor dashboard and brand system
references. Page structure, tabs, navigation and behaviour are unchanged
from pass 9. The new stylesheet is `css/brand.css`, and screenshots are in
`docs/screenshots/pass-10/`.

## Brand
- **Palette:**
  - Obsidian `#0B0B0B` for the shell and text;
  - Porcelain `#F7F3ED` for the canvas;
  - Graphite `#3A3A3A` and Fog `#C9C4BC` for secondary tones;
  - Amber `#D9A441` as a sparing accent.
- **Status colours** (red, rust, green, blue) stay separate from Amber.
- **Logo:** the stepped symbol (an obsidian block and an amber block, in
  porcelain on dark) with a bold Inter wordmark.
- **Type:** Inter throughout, including greetings. The serif is retired.
- **Primary actions:** flat Amber with Obsidian text.
  - Amber appears once per page, on the main action.
  - Repeated row actions are outlined. Urgent rows get a solid Obsidian
    button.
- **Palette switch:** "Relvor" is the default. The other palettes stay
  available in the prototype bar.

## Hierarchy

| Level | Style |
|---|---|
| Page title | 28px, weight 600 (24px on phones) |
| Greeting | 30px, weight 600 (26px on phones) |
| Section heading | 16px, weight 600, full contrast |
| Card title | 15px, weight 600 |
| Supporting text | 13–14.5px, graphite or muted |
| Eyebrow and date | 11px caps, muted |

## Proportions
- Page heads, top bars and the sidebar are shorter.
- Card radii are 14–16px with tighter padding.
- Area cards on Management Home are compact two-line stat cards.
- Issue cards, directory cards, day groups, next-session heroes and tiles
  are all more compact.
- Management Home now fits in a single 1440×900 view.

## Management Home
- **Main working panels:** Today's schedule and Needs attention, side by
  side.
- **Needs attention** is a white panel with:
  - severity counts (only Urgent is tinted);
  - five compact rows;
  - a soft red wash on urgent rows only.
- **The red hero** is gone.
- **Right rail:** the calendar and recent activity sit in quieter
  translucent cards.

## Depth
- Hairline edges with soft, low shadows.
- The ridgeline backdrop is faded to roughly half strength.
